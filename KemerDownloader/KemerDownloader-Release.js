// ==UserScript==
// @name         Kemer 下載器
// @name:zh-TW   Kemer 下載器
// @name:zh-CN   Kemer 下载器
// @name:ja      Kemer ダウンローダー
// @name:en      Kemer Downloader
// @version      0.0.21-Beta5
// @author       Canaan HS
// @description         一鍵下載圖片 (壓縮下載/單圖下載) , 頁面數據創建 json 下載 , 一鍵開啟當前所有帖子
// @description:zh-TW   一鍵下載圖片 (壓縮下載/單圖下載) , 頁面數據創建 json 下載 , 一鍵開啟當前所有帖子
// @description:zh-CN   一键下载图片 (压缩下载/单图下载) , 页面数据创建 json 下载 , 一键开启当前所有帖子
// @description:ja      画像をワンクリックでダウンロード（圧縮ダウンロード/単一画像ダウンロード）、ページデータを作成してjsonでダウンロード、現在のすべての投稿をワンクリックで開く
// @description:en      One-click download of images (compressed download/single image download), create page data for json download, one-click open all current posts

// @connect      *
// @match        *://kemono.su/*
// @match        *://coomer.su/*
// @match        *://nekohouse.su/*
// @match        *://*.kemono.su/*
// @match        *://*.coomer.su/*
// @match        *://*.nekohouse.su/*

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635
// @icon         https://cdn-icons-png.flaticon.com/512/2381/2381981.png

// @run-at       document-start
// @grant        window.close
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @grant        GM_openInTab
// @grant        GM_addElement
// @grant        GM_notification
// @grant        GM_getResourceURL
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand

// @require      https://update.greasyfork.org/scripts/529004/1548656/JSZip_min.js
// @require      https://update.greasyfork.org/scripts/495339/1456526/ObjectSyntax_min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js

// @resource     json-processing https://cdn-icons-png.flaticon.com/512/2582/2582087.png
// @resource     font-awesome https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/svg-with-js.min.css
// ==/UserScript==

(async () => {
    const Config = {
        Dev: false, // 顯示請求資訊, 與錯誤資訊
        NotiFication: true, // 操作時 系統通知
        ContainsVideo: false, // 下載時包含影片
        CompleteClose: false, // 下載完成後關閉
        ExperimeDownload: true, // 實驗功能 [json 下載]
        ConcurrentDelay: 3, // 下載線程延遲 (秒) [壓縮下載]
        ConcurrentQuantity: 5, // 下載線程數量 [壓縮下載]
        BatchOpenDelay: 500, // 一鍵開啟帖子的延遲 (ms)
    };

    /** ---------------------
     * 暫時的 檔名修改方案
     *
     * 根據要添加的元素修改字串
     * 中間的間隔可用任意字符
     *
     * ! 不限制大小寫, 但一定要有 {}, 不能用於命名的符號會被移除
     *
     * {Time} 發表時間
     * {Title} 標題
     * {Artist} 作者 | 繪師 ...
     * {Source} 來源 => (Pixiv Fanbox) 之類的標籤
     *
     * {Fill} 填充 => ! 只適用於檔名, 位置隨意 但 必須存在該值, 不然會出錯
     */
    const FileName = {
        FillValue: {
            Filler: "0", // 填充元素 / 填料
            Amount: "Auto", // 填充數量 [輸入 auto 或 任意數字]
        },
        CompressName: "({Artist}) {Title}", // 壓縮檔案名稱
        FolderName: "{Title}", // 資料夾名稱 (用空字串, 就直接沒資料夾)
        FillName: "{Artist} {Fill}", // 檔案名稱 [! 可以移動位置, 但不能沒有 {Fill}]
    };

    /** ---------------------
     * 設置 json 輸出格式
     *
     * Mode
     * 排除模式: "FilterMode" -> 預設為全部使用, 設置排除的項目
     * 僅有模式: "OnlyMode" -> 預設為全部不使用, 設置使用的項目
     *
     * ----------------------
     *
     * Settings
     * 原始連結: "orlink"
     * 圖片數量: "imgnb"
     * 影片數量: "videonb"
     * 連結數量: "dllink"
     */
    const JsonFormat = {
        Use: false,
        Mode: "OnlyMode",
        Settings: ["orlink", "dllink"],
    };

    /* --------------------- */
    let lock = false;
    const Lang = Language(Syn.Device.Lang);
    const IsNeko = Syn.Device.Host === "nekohouse.su";
    class Download {
        constructor(CM, MD, BT) {
            this.Button = BT;
            this.ModeDisplay = MD;
            this.CompressMode = CM;
            this.ForceDownload = false;
            this.Named_Data = null;
            this.OriginalTitle = () => {
                const cache = document.title;
                return cache.startsWith("✓ ") ? cache.slice(2) : cache;
            };
            this.videoFormat = new Set(["MP4", "MOV", "AVI", "WMV", "FLV"]);
            this.isVideo = str => this.videoFormat.has(str.toUpperCase());
            this.worker = Syn.WorkerCreation(`
                let queue = [], processing=false;
                onmessage = function(e) {
                    queue.push(e.data);
                    !processing && (processing=true, processQueue());
                }
                async function processQueue() {
                    if (queue.length > 0) {
                        const {index, url} = queue.shift();
                        XmlRequest(index, url);
                        processQueue();
                    } else {processing = false}
                }

                async function XmlRequest(index, url) {
                    let xhr = new XMLHttpRequest();
                    xhr.responseType = "blob";
                    xhr.open("GET", url, true);
                    xhr.onload = function() {
                        if (xhr.readyState === 4 && xhr.status === 200) {
                            postMessage({ index, url: url, blob: xhr.response, error: false });
                        } else {
                            FetchRequest(index, url);
                        }
                    }
                    xhr.onerror = function() {
                        FetchRequest(index, url);
                    }
                    xhr.send();
                }

                async function FetchRequest(index, url) {
                    try {
                        const response = await fetch(url);
                        if (response.readyState === 4 && response.status === 200) {
                            const blob = await response.blob();
                            postMessage({ index, url: url, blob, error: false });
                        } else {
                            postMessage({ index, url: url, blob: "", error: true });
                        }
                    } catch {
                        postMessage({ index, url: url, blob: "", error: true });
                    }
                }
            `);
        }
        NameAnalysis(format) {
            if (typeof format == "string") {
                return format.split(/{([^}]+)}/g).filter(Boolean).map(data => {
                    const LowerData = data.toLowerCase().trim();
                    const isWord = /^[a-zA-Z]+$/.test(LowerData);
                    return isWord ? this.Named_Data[LowerData]?.() ?? "None" : data;
                }).join("");
            } else if (typeof format == "object") {
                const filler = String(format.Filler) || "0";
                const amount = parseInt(format.Amount) || "auto";
                return [amount, filler];
            } else { }
        }
        DownloadTrigger() {
            Syn.WaitMap([".post__title, .scrape__title", ".post__files, .scrape__files", ".post__user-name, .scrape__user-name, fix_name"], found => {
                const [title, files, artist] = found;
                this.Button.disabled = lock = true;
                const DownloadData = new Map();
                this.Named_Data = {
                    fill: () => "fill",
                    title: () => Syn.$$("span", {
                        root: title
                    }).textContent.trim(),
                    artist: () => artist.textContent.trim(),
                    source: () => title.querySelector(":nth-child(2)").textContent.trim(),
                    time: () => {
                        if (IsNeko) return "";
                        let published = Syn.$$(".post__published").cloneNode(true);
                        published.firstElementChild.remove();
                        return published.textContent.trim().split(" ")[0];
                    }
                };
                const [compress_name, folder_name, fill_name] = Object.keys(FileName).slice(1).map(key => this.NameAnalysis(FileName[key]));
                const data = [...files.children].map(child => Syn.$$(IsNeko ? "div, rc, img" : "a, rc, img", {
                    root: child
                })).filter(Boolean), video = Syn.$$(".post__attachment a, .scrape__attachment a", {
                    all: true
                }), final_data = Config.ContainsVideo ? [...data, ...video] : data;
                for (const [index, file] of final_data.entries()) {
                    const Uri = file.src || file.href || file.getAttribute("src") || file.getAttribute("href");
                    if (Uri) {
                        DownloadData.set(index, Uri.startsWith("http") ? Uri : `${Syn.Device.Orig}${Uri}`);
                    }
                }
                Syn.Log("Get Data", {
                    FolderName: folder_name,
                    DownloadData: DownloadData
                }, {
                    dev: Config.Dev,
                    collapsed: false
                });
                this.CompressMode ? this.PackDownload(compress_name, folder_name, fill_name, DownloadData) : this.SeparDownload(fill_name, DownloadData);
            }, {
                raf: true
            });
        }
        async PackDownload(CompressName, FolderName, FillName, Data) {
            let show, extension, progress = 0, Total = Data.size;
            const Self = this, Zip = new JSZip(), TitleCache = this.OriginalTitle();
            const FillValue = this.NameAnalysis(FileName.FillValue), Filler = FillValue[1], Amount = FillValue[0] == "auto" ? Syn.GetFill(Total) : FillValue[0];
            async function ForceDownload() {
                Self.worker.terminate();
                Self.Compression(CompressName, Zip, TitleCache);
            }
            Syn.Menu({
                [Lang.Transl("📥 強制壓縮下載")]: {
                    func: () => ForceDownload(),
                    hotkey: "d"
                }
            }, "Enforce");
            FolderName = FolderName != "" ? `${FolderName}/` : "";
            function Request_update(index, url, blob, retry = false) {
                if (Self.ForceDownload) return;
                requestAnimationFrame(() => {
                    Data.delete(index);
                    if (retry) {
                        Data.set(index, url);
                    } else {
                        extension = Syn.ExtensionName(url);
                        Self.isVideo(extension) ? Zip.file(`${FolderName}${decodeURIComponent(url.split("?f=")[1])}`, blob) : Zip.file(`${FolderName}${FillName.replace("fill", Syn.Mantissa(index, Amount, Filler))}.${extension}`, blob);
                    }
                    show = `[${++progress}/${Total}]`;
                    document.title = show;
                    Self.Button.textContent = `${Lang.Transl("下載進度")} ${show}`;
                    if (progress == Total) {
                        Total = Data.size;
                        if (Total == 0) {
                            Self.worker.terminate();
                            Self.Compression(CompressName, Zip, TitleCache);
                        } else {
                            show = "Wait for failed re download";
                            progress = 0;
                            document.title = show;
                            Self.Button.textContent = show;
                            setTimeout(() => {
                                for (const [index, url] of Data.entries()) {
                                    Self.worker.postMessage({
                                        index: index,
                                        url: url
                                    });
                                }
                            }, 1500);
                        }
                    }
                });
            }
            async function Request(index, url) {
                if (Self.ForceDownload) return;
                GM_xmlhttpRequest({
                    url: url,
                    method: "GET",
                    responseType: "blob",
                    onload: response => {
                        if (response.status == 429) {
                            Request_update(index, url, "", true);
                            return;
                        }
                        const blob = response.response;
                        blob instanceof Blob && blob.size > 0 ? Request_update(index, url, blob) : Request_update(index, url, "", true);
                    },
                    onerror: () => {
                        Request_update(index, url, "", true);
                    }
                });
            }
            const Batch = Config.ConcurrentQuantity;
            const Delay = Config.ConcurrentDelay * 1e3;
            Self.Button.textContent = `${Lang.Transl("請求進度")} [${Total}/${Total}]`;
            for (let i = 0; i < Total; i += Batch) {
                setTimeout(() => {
                    for (let j = i; j < i + Batch && j < Total; j++) {
                        this.worker.postMessage({
                            index: j,
                            url: Data.get(j)
                        });
                    }
                }, i / Batch * Delay);
            }
            this.worker.onmessage = e => {
                const {
                    index,
                    url,
                    blob,
                    error
                } = e.data;
                error ? (Request(index, url), Syn.Log("Download Failed", url, {
                    dev: Config.Dev,
                    collapsed: false
                })) : (Request_update(index, url, blob), Syn.Log("Download Successful", url, {
                    dev: Config.Dev,
                    collapsed: false
                }));
            };
        }
        async Compression(Name, Data, Title) {
            this.ForceDownload = true;
            GM_unregisterMenuCommand("Enforce-1");
            Data.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: {
                    level: 5
                }
            }, progress => {
                document.title = `${progress.percent.toFixed(1)} %`;
                this.Button.textContent = `${Lang.Transl("封裝進度")}: ${progress.percent.toFixed(1)} %`;
            }).then(zip => {
                saveAs(zip, `${Name}.zip`);
                document.title = `✓ ${Title}`;
                this.Button.textContent = Lang.Transl("下載完成");
                setTimeout(() => {
                    this.ResetButton();
                }, 3e3);
            }).catch(result => {
                document.title = Title;
                const ErrorShow = Lang.Transl("壓縮封裝失敗");
                this.Button.textContent = ErrorShow;
                Syn.Log(ErrorShow, result, {
                    dev: Config.Dev,
                    type: "error",
                    collapsed: false
                });
                setTimeout(() => {
                    this.Button.disabled = false;
                    this.Button.textContent = this.ModeDisplay;
                }, 6e3);
            });
        }
        async SeparDownload(FillName, Data) {
            let show, link, filename, extension, stop = false, progress = 0;
            const Self = this, Process = [], Promises = [], Total = Data.size, ShowTracking = {}, DownloadTracking = {}, TitleCache = this.OriginalTitle();
            const FillValue = this.NameAnalysis(FileName.FillValue), Filler = FillValue[1], Amount = FillValue[0] == "auto" ? Syn.GetFill(Total) : FillValue[0];
            async function Stop() {
                stop = true;
                Process.forEach(process => process.abort());
            }
            Syn.Menu({
                [Lang.Transl("⛔️ 終止下載")]: {
                    func: () => Stop(),
                    hotkey: "s"
                }
            }, "Abort");
            async function Request(index) {
                if (stop) return;
                link = Data.get(index);
                extension = Syn.ExtensionName(link);
                filename = Self.isVideo(extension) ? decodeURIComponent(link.split("?f=")[1]) : `${FillName.replace("fill", Syn.Mantissa(index, Amount, Filler))}.${extension}`;
                return new Promise((resolve, reject) => {
                    const completed = () => {
                        if (!ShowTracking[index]) {
                            ShowTracking[index] = true;
                            Syn.Log("Download Successful", link, {
                                dev: Config.Dev,
                                collapsed: false
                            });
                            show = `[${++progress}/${Total}]`;
                            document.title = show;
                            Self.Button.textContent = `${Lang.Transl("下載進度")} ${show}`;
                            resolve();
                        }
                    };
                    const download = GM_download({
                        url: link,
                        name: filename,
                        conflictAction: "overwrite",
                        onload: () => {
                            completed();
                        },
                        onprogress: progress => { },
                        onerror: () => {
                            Syn.Log("Download Error", link, {
                                dev: Config.Dev,
                                collapsed: false
                            });
                            setTimeout(() => {
                                reject();
                                Request(index);
                            }, 1500);
                        }
                    });
                    Process.push(download);
                });
            }
            for (let i = 0; i < Total; i++) {
                Promises.push(Request(i));
                await Syn.Sleep(1e3);
            }
            await Promise.allSettled(Promises);
            GM_unregisterMenuCommand("Abort-1");
            document.title = `✓ ${TitleCache}`;
            this.Button.textContent = Lang.Transl("下載完成");
            setTimeout(() => {
                this.ResetButton();
            }, 3e3);
        }
        async ResetButton() {
            Config.CompleteClose && window.close();
            lock = false;
            const Button = Syn.$$("#ExDB button");
            Button.disabled = false;
            Button.textContent = `✓ ${this.ModeDisplay}`;
        }
    }
    class DataToJson {
        constructor() {
            this.JsonDict = {};
            this.Genmode = true;
            this.SortMap = new Map();
            this.Source = document.URL;
            this.TitleCache = document.title;
            this.Section = Syn.$$("section");
            this.Pages = this.progress = this.filtercache = null;
            this.Author = Syn.$$("span[itemprop='name'], fix_name").textContent;
            this.JsonMode = {
                orlink: "set_1",
                imgnb: "set_2",
                videonb: "set_3",
                dllink: "set_4"
            };
            this.GenerateBox = (ol, pn, vn, lb) => {
                if (this.Genmode) {
                    return {
                        ...this.JsonMode.hasOwnProperty("orlink") ? {
                            [Lang.Transl("原始連結")]: ol
                        } : {},
                        ...this.JsonMode.hasOwnProperty("imgnb") ? {
                            [Lang.Transl("圖片數量")]: pn
                        } : {},
                        ...this.JsonMode.hasOwnProperty("videonb") ? {
                            [Lang.Transl("影片數量")]: vn
                        } : {},
                        ...this.JsonMode.hasOwnProperty("dllink") ? {
                            [Lang.Transl("下載連結")]: lb || {}
                        } : {}
                    };
                } else {
                    return {
                        ...this.JsonMode.hasOwnProperty("orlink") ? {
                            [Lang.Transl("原始連結")]: ol
                        } : {},
                        ...this.JsonMode.hasOwnProperty("imgnb") && pn > 0 && vn == 0 ? {
                            [Lang.Transl("圖片數量")]: pn
                        } : {},
                        ...this.JsonMode.hasOwnProperty("videonb") && vn > 0 && pn <= 10 ? {
                            [Lang.Transl("影片數量")]: vn
                        } : {},
                        ...this.JsonMode.hasOwnProperty("dllink") && Object.keys(lb).length > 0 ? {
                            [Lang.Transl("下載連結")]: lb
                        } : {}
                    };
                }
            };
            this.ToJsonSet = async (mode = "FilterMode", set = []) => {
                try {
                    switch (mode) {
                        case "FilterMode":
                            this.Genmode = true;
                            set.forEach(key => {
                                delete this.JsonMode[key];
                            });
                            break;

                        case "OnlyMode":
                            this.Genmode = false;
                            this.filtercache = Object.keys(this.JsonMode).reduce((obj, key) => {
                                if (set.includes(key)) {
                                    obj[key] = this.JsonMode[key];
                                }
                                return obj;
                            }, {});
                            this.JsonMode = this.filtercache;
                            break;
                    }
                } catch (error) {
                    console.error(error);
                }
            };
            this.MegaAnalysis = data => {
                let title_box = [], link_box = [], result = {}, pass;
                for (let i = 0; i < data.length; i++) {
                    const str = data[i].textContent.trim();
                    if (str.startsWith("Pass")) {
                        const ps = data[i].innerHTML.match(/Pass:([^<]*)/);
                        try {
                            pass = `Pass : ${ps[1].trim()}`;
                        } catch {
                            pass = str;
                        }
                    } else if (str.toUpperCase() == "MEGA") {
                        link_box.push(data[i].parentElement.href);
                    } else {
                        title_box.push(str.replace(":", "").trim());
                    }
                }
                for (let i = 0; i < title_box.length; i++) {
                    result[title_box[i]] = link_box[i];
                }
                return {
                    pass: pass,
                    result: result
                };
            };
            this.ToJson = async () => {
                const Json_data = Object.assign({
                    ["Meta-Data"]: {
                        [Lang.Transl("作者")]: this.Author,
                        [Lang.Transl("時間")]: Syn.GetDate("{year}-{month}-{date} {hour}:{minute}:{second}"),
                        [Lang.Transl("來源")]: this.Source
                    }
                }, this.JsonDict);
                Syn.OutputJson(Json_data, this.Author, () => {
                    if (Config.NotiFication) {
                        GM_notification({
                            title: Lang.Transl("數據處理完成"),
                            text: Lang.Transl("Json 數據下載"),
                            image: GM_getResourceURL("json-processing"),
                            timeout: 2e3
                        });
                    }
                    lock = false;
                    this.worker.terminate();
                    document.title = this.TitleCache;
                });
            };
            this.worker = Syn.WorkerCreation(`
                let queue = [], processing=false;
                onmessage = function(e) {
                    queue.push(e.data);
                    !processing && (processing=true, processQueue());
                }
                async function processQueue() {
                    if (queue.length > 0) {
                        const {index, title, url} = queue.shift();
                        XmlRequest(index, title, url);
                        processQueue();
                    } else {processing = false}
                }
                async function XmlRequest(index, title, url) {
                    let xhr = new XMLHttpRequest();
                    xhr.responseType = "text";
                    xhr.open("GET", url, true);
                    xhr.onload = function() {
                        if (xhr.readyState === 4 && xhr.status === 200) {
                            postMessage({ index, title, url, text: xhr.response, error: false });
                        } else {
                            FetchRequest(index, title, url);
                        }
                    }
                    xhr.onerror = function() {
                        FetchRequest(index, title, url);
                    }
                    xhr.send();
                }
                async function FetchRequest(index, title, url) {
                    fetch(url).then(response => {
                        if (response.ok) {
                            response.text().then(text => {
                                postMessage({ index, title, url, text, error: false });
                            });
                        } else {
                            postMessage({ index, title, url, text: "", error: true });
                        }
                    })
                    .catch(error => {
                        postMessage({ index, title, url, text: "", error: true });
                    });
                }
            `);
        }
        async GetData() {
            if (this.Section) {
                lock = true;
                this.Pages = 1;
                for (const page of Syn.$$(".pagination-button-disabled b", {
                    all: true
                })) {
                    const number = Number(page.textContent);
                    if (number) {
                        this.Pages = number;
                        break;
                    }
                }
                this.GetPageData(this.Section);
                this.DataAnalysis();
            } else {
                alert(Lang.Transl("未取得數據"));
            }
        }
        async GetNextPage(NextPage) {
            GM_xmlhttpRequest({
                method: "GET",
                url: NextPage,
                nocache: false,
                onload: response => {
                    this.GetPageData(Syn.$$("section", {
                        root: response.responseXML
                    }));
                }
            });
        }
        async GetPageData(section) {
            let title, link;
            const item = Syn.$$(".card-list__items article", {
                all: true,
                root: section
            });
            if (Config.NotiFication) {
                GM_notification({
                    title: Lang.Transl("數據處理中"),
                    text: `${Lang.Transl("當前處理頁數")} : ${this.Pages}`,
                    image: GM_getResourceURL("json-processing"),
                    timeout: 800
                });
            }
            this.progress = 0;
            for (const [index, card] of item.entries()) {
                link = Syn.$$("a", {
                    root: card
                }).href;
                title = Syn.$$(".post-card__header", {
                    root: card
                }).textContent.trim() || `Untitled_${String(this.progress + 1).padStart(2, "0")}`;
                if (Config.ExperimeDownload) {
                    this.worker.postMessage({
                        index: index,
                        title: title,
                        url: link
                    });
                } else {
                    this.JsonDict[`${link}`] = title;
                }
                await Syn.Sleep(10);
            }
            const menu = Syn.$$("a.pagination-button-after-current", {
                root: section
            });
            if (Config.ExperimeDownload) {
                const ILength = item.length, wait = setInterval(() => {
                    if (ILength == this.SortMap.size) {
                        clearInterval(wait);
                        for (let i = 0; i < ILength; i++) {
                            const data = this.SortMap.get(i);
                            this.JsonDict[data.title] = data.box;
                        }
                        this.Pages++;
                        this.SortMap.clear();
                        menu ? this.GetNextPage(menu.href) : this.ToJson();
                    }
                }, 500);
            } else {
                this.Pages++;
                await Syn.Sleep(500);
                menu ? this.GetNextPage(menu.href) : this.ToJson();
            }
        }
        async DataAnalysis() {
            this.worker.onmessage = async e => {
                const data_box = {}, {
                    index,
                    title,
                    url,
                    text,
                    error
                } = e.data;
                if (!error) {
                    const DOM = Syn.DomParse(text);
                    const original_link = url, pictures_number = Syn.$$("post__thumbnail, .scrape__thumbnail", {
                        all: true,
                        root: DOM
                    }).length, video_number = Syn.$$(".post__body li video, .scrape__files video", {
                        all: true,
                        root: DOM
                    }).length, mega_link = Syn.$$(".post__content strong, .scrape__content strong", {
                        all: true,
                        root: DOM
                    });
                    Syn.$$("a.post__attachment-link, a.scrape__attachment-link", {
                        all: true,
                        root: DOM
                    }).forEach(link => {
                        const analyze = decodeURIComponent(link.href).split("?f="), download_link = analyze[0], download_name = analyze[1];
                        data_box[download_name] = download_link;
                    });
                    if (mega_link.length > 0) {
                        try {
                            const {
                                pass,
                                result
                            } = this.MegaAnalysis(mega_link);
                            pass != unSynined ? data_box[pass] = result : null;
                        } catch { }
                    }
                    const box = this.GenerateBox(original_link, pictures_number, video_number, data_box);
                    if (Object.keys(box).length !== 0) {
                        this.SortMap.set(index, {
                            title: title,
                            box: box
                        });
                    }
                    Syn.Log("Request Successful", this.SortMap, {
                        dev: Config.Dev,
                        collapsed: false
                    });
                    document.title = `（${this.Pages} - ${++this.progress}）`;
                } else {
                    Syn.Log("Request Failed", {
                        title: title,
                        url: url
                    }, {
                        dev: Config.Dev,
                        collapsed: false
                    });
                    await Syn.Sleep(1500);
                    this.worker.postMessage({
                        index: index,
                        title: title,
                        url: url
                    });
                }
            };
        }
    }
    new class Main {
        constructor() {
            this.URL = Syn.Device.Url;
            this.Page = {
                Content: /^(https?:\/\/)?(www\.)?.+\/.+\/user\/.+\/post\/.+$/.test(this.URL),
                Preview: /^(https?:\/\/)?(www\.)?.+\/posts\/?(\?.*)?$/.test(this.URL) || /^(https?:\/\/)?(www\.)?.+\/.+\/user\/[^\/]+(\?.*)?$/.test(this.URL) || /^(https?:\/\/)?(www\.)?.+\/dms\/?(\?.*)?$/.test(this.URL)
            };
            this.AddStyle = async () => {
                Syn.AddStyle(`
                    ${GM_getResourceText("font-awesome")}
                    .File_Span {
                        padding: 1rem;
                        font-size: 20% !important;
                    }
                    .Setting_Button {
                        cursor: pointer;
                    }
                    .Download_Button {
                        color: hsl(0, 0%, 45%);
                        padding: 6px;
                        margin: 10px;
                        border-radius: 8px;
                        border: 2px solid rgba(59, 62, 68, 0.7);
                        background-color: rgba(29, 31, 32, 0.8);
                        font-family: Arial, sans-serif;
                    }
                    .Download_Button:hover {
                        color: hsl(0, 0%, 95%);
                        background-color: hsl(0, 0%, 45%);
                        font-family: Arial, sans-serif;
                    }
                    .Download_Button:disabled {
                        color: hsl(0, 0%, 95%);
                        background-color: hsl(0, 0%, 45%);
                        cursor: Synault;
                    }
                `, "Download-button-style", false);
            };
            GM_info.downloadMode = "browser";
            GM_info.isIncognito = true;
        }
        async ButtonCreation() {
            Syn.$$("section").setAttribute("Download-Button-Created", true);
            this.AddStyle();
            let Button, Files;
            const IntervalFind = setInterval(() => {
                Files = Syn.$$(IsNeko ? "div.scrape__body h2" : "div.post__body h2", {
                    all: true
                });
                if (Files.length > 0) {
                    clearInterval(IntervalFind);
                    try {
                        const CompressMode = Syn.Storage("Compression", {
                            type: localStorage,
                            error: true
                        });
                        const ModeDisplay = CompressMode ? Lang.Transl("壓縮下載") : Lang.Transl("單圖下載");
                        Files = Array.from(Files).filter(file => file.textContent.trim() == "Files");
                        if (Files.length == 0) {
                            return;
                        }
                        const spanElement = GM_addElement(Files[0], "span", {
                            class: "File_Span",
                            id: "ExDB"
                        });
                        const setting = GM_addElement(spanElement, "svg", {
                            class: "Setting_Button"
                        });
                        setting.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="1.3rem" viewBox="0 0 512 512"><style>svg {fill: hsl(0, 0%, 45%);}</style>
                        <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/></svg>`;
                        Syn.Listen(setting, "click", () => {
                            alert("Currently Invalid");
                        }, {
                            capture: true,
                            passive: true
                        });
                        Button = GM_addElement(spanElement, "button", {
                            class: "Download_Button",
                            textContent: lock ? Lang.Transl("下載中鎖定") : ModeDisplay
                        });
                        Button.disabled = lock;
                        Syn.Listen(Button, "click", () => {
                            let Instantiate = null;
                            Instantiate = new Download(CompressMode, ModeDisplay, Button);
                            Instantiate.DownloadTrigger();
                        }, {
                            capture: true,
                            passive: true
                        });
                    } catch {
                        Button.disabled = true;
                        Button.textContent = Lang.Transl("無法下載");
                    }
                }
            });
        }
        async OpenAllPages() {
            const card = Syn.$$("article.post-card a", {
                all: true
            });
            if (card.length == 0) {
                throw new Error("No links found");
            }
            let scope = prompt(`(${Lang.Transl("當前帖子數")}: ${card.length})${Lang.Transl("開帖說明")}`);
            if (scope != null) {
                scope = scope == "" ? "1-50" : scope;
                for (const link of Syn.ScopeParsing(scope, card)) {
                    GM_openInTab(link.href, {
                        insert: false,
                        setParent: false
                    });
                    await Syn.Sleep(Config.BatchOpenDelay);
                }
            }
        }
        async DownloadModeSwitch() {
            if (Syn.Storage("Compression", {
                type: localStorage,
                error: true
            })) {
                Syn.Storage("Compression", {
                    type: localStorage,
                    value: false
                });
                if (Config.NotiFication) {
                    GM_notification({
                        title: Lang.Transl("模式切換"),
                        text: Lang.Transl("單圖下載模式"),
                        timeout: 1500
                    });
                }
            } else {
                Syn.Storage("Compression", {
                    type: localStorage,
                    value: true
                });
                if (Config.NotiFication) {
                    GM_notification({
                        title: Lang.Transl("模式切換"),
                        text: Lang.Transl("壓縮下載模式"),
                        timeout: 1500
                    });
                }
            }
            Syn.$$("#ExDB").remove();
            this.ButtonCreation();
        }
        async Injection() {
            Syn.Observer(document, () => {
                try {
                    this.Page.Content && !Syn.$$("section").hasAttribute("Download-Button-Created") && this.ButtonCreation();
                } catch { }
            }, {
                throttle: 300
            });
            if (this.Page.Content) {
                Syn.Menu({
                    [Lang.Transl("🔁 切換下載模式")]: {
                        func: () => this.DownloadModeSwitch(),
                        close: false,
                        hotkey: "c"
                    }
                });
            } else if (this.Page.Preview) {
                Syn.Menu({
                    [Lang.Transl("📑 獲取 Json 數據")]: {
                        func: () => {
                            if (!lock) {
                                let Instantiate = null;
                                Instantiate = new DataToJson();
                                JsonFormat.Use && Instantiate.ToJsonSet(JsonFormat.Mode, JsonFormat.Settings);
                                Instantiate.GetData();
                            }
                        }
                    },
                    [Lang.Transl("📃 開啟當前頁面帖子")]: {
                        func: () => this.OpenAllPages()
                    }
                });
            }
        }
    }().Injection();
    function Language(lang) {
        const Word = {
            Traditional: {
                "開帖說明": "\n\n!! 不輸入直接確認, 將會開啟當前頁面所有帖子\n輸入開啟範圍(說明) =>\n單個: 1, 2, 3\n範圍: 1~5, 6-10\n排除: !5, -10"
            },
            Simplified: {
                "🔁 切換下載模式": "🔁 切换下载模式",
                "📑 獲取 Json 數據": "📑 获取 Json 数据",
                "📃 開啟當前頁面帖子": "📃 打开当前页面帖子",
                "📥 強制壓縮下載": "📥 强制压缩下载",
                "⛔️ 終止下載": "⛔️ 终止下载",
                "壓縮下載模式": "压缩下载模式",
                "單圖下載模式": "单图下载模式",
                "壓縮下載": "压缩下载",
                "單圖下載": "单图下载",
                "開始下載": "开始下载",
                "無法下載": "无法下载",
                "下載進度": "下载进度",
                "封裝進度": "打包进度",
                "壓縮封裝失敗": "压缩打包失败",
                "下載完成": "下载完成",
                "請求進度": "请求进度",
                "下載中鎖定": "下载中锁定",
                "原始連結": "原始链接",
                "圖片數量": "图片数量",
                "影片數量": "视频数量",
                "下載連結": "下载链接",
                "作者": "作者",
                "時間": "时间",
                "來源": "来源",
                "未取得數據": "未取得数据",
                "模式切換": "模式切换",
                "數據處理中": "数据处理中",
                "當前處理頁數": "当前处理页数",
                "數據處理完成": "数据处理完成",
                "Json 數據下載": "Json 数据下载",
                "當前帖子數": "当前帖子数",
                "開帖說明": "\n\n!! 不输入直接确认, 将会打开当前页面所有帖子\n输入开启范围(说明) =>\n单个: 1, 2, 3\n范围: 1~5, 6-10\n排除: !5, -10"
            },
            Japan: {
                "🔁 切換下載模式": "🔁 ダウンロードモードの切り替え",
                "📑 獲取 Json 數據": "📑 Json データの取得",
                "📃 開啟當前頁面帖子": "📃 現在のページの投稿を開く",
                "📥 強制壓縮下載": "📥 強制的に圧縮してダウンロード",
                "⛔️ 終止下載": "⛔️ ダウンロードを中止",
                "壓縮下載模式": "圧縮ダウンロードモード",
                "單圖下載模式": "単一画像ダウンロードモード",
                "壓縮下載": "圧縮ダウンロード",
                "單圖下載": "単一画像ダウンロード",
                "開始下載": "ダウンロードを開始",
                "無法下載": "ダウンロードできません",
                "下載進度": "ダウンロードの進行状況",
                "封裝進度": "パッケージングの進行状況",
                "壓縮封裝失敗": "圧縮パッケージングに失敗しました",
                "下載完成": "ダウンロードが完了しました",
                "請求進度": "リクエストの進行状況",
                "下載中鎖定": "ダウンロード中にロック",
                "原始連結": "元のリンク",
                "圖片數量": "画像の数",
                "影片數量": "動画の数",
                "下載連結": "ダウンロードリンク",
                "作者": "著者",
                "時間": "時間",
                "來源": "ソース",
                "未取得數據": "データを取得できませんでした",
                "模式切換": "モードの切り替え",
                "數據處理中": "データ処理中",
                "當前處理頁數": "現在処理中のページ数",
                "數據處理完成": "データ処理が完了しました",
                "Json 數據下載": "Json データのダウンロード",
                "當前帖子數": "現在の投稿数",
                "開帖說明": "\n\n!! 直接確認を入力しないと、現在のページのすべての投稿が開きます\n開始範囲を入力してください (説明) =>\n単一: 1, 2, 3\n範囲: 1~5, 6-10\n除外: !5, -10"
            },
            English: {
                "🔁 切換下載模式": "🔁 Switch Download Mode",
                "📑 獲取 Json 數據": "📑 Get Json Data",
                "📃 開啟當前頁面帖子": "📃 Open Current Page Post",
                "📥 強制壓縮下載": "📥 Force Compress Download",
                "⛔️ 終止下載": "⛔️ Terminate download",
                "壓縮下載模式": "Compress Download Mode",
                "單圖下載模式": "Single Image Download Mode",
                "壓縮下載": "Compress Download",
                "單圖下載": "Single Image Download",
                "開始下載": "Start Download",
                "無法下載": "Unable to Download",
                "下載進度": "Download Progress",
                "封裝進度": "Packaging Progress",
                "壓縮封裝失敗": "Compress Packaging Failed",
                "下載完成": "Download Complete",
                "請求進度": "Request Progress",
                "下載中鎖定": "Download Locked",
                "原始連結": "Original Link",
                "圖片數量": "Image Count",
                "影片數量": "Video Count",
                "下載連結": "Download Link",
                "作者": "Author",
                "時間": "Time",
                "來源": "Source",
                "未取得數據": "No Data",
                "模式切換": "Mode Switch",
                "數據處理中": "Data Processing",
                "當前處理頁數": "Current Processing Page",
                "數據處理完成": "Data Processing Complete",
                "Json 數據下載": "Json Data Download",
                "當前帖子數": "Current Post Count",
                "開帖說明": "\n\n!! If you do not enter a direct confirmation, all posts on the current page will be opened\nEnter the start range (說明) =>\nSingle: 1, 2, 3\nRange: 1~5, 6-10\nExclude: !5, -10"
            }
        }, Match = {
            "zh-TW": Word.Traditional,
            "zh-HK": Word.Traditional,
            "zh-MO": Word.Traditional,
            "zh-CN": Word.Simplified,
            "zh-SG": Word.Simplified,
            "en-US": Word.English,
            ja: Word.Japan
        }, ML = Match[lang] ?? Match["en-US"];
        return {
            Transl: Str => ML[Str] ?? Str
        };
    }
})();