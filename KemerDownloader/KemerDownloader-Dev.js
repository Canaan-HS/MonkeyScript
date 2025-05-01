// ==UserScript==
// @name         Kemer Downloader
// @name:zh-TW   Kemer 下載器
// @name:zh-CN   Kemer 下载器
// @name:ja      Kemer ダウンローダー
// @name:ru      Kemer Загрузчик
// @name:ko      Kemer 다운로더
// @name:en      Kemer Downloader
// @version      0.0.21-Beta5
// @author       Canaan HS
// @description         一鍵下載圖片 (壓縮下載/單圖下載) , 一鍵獲取帖子數據以 Json 或 Txt 下載 , 一鍵開啟當前所有帖子
// @description:zh-TW   一鍵下載圖片 (壓縮下載/單圖下載) , 下載頁面數據 , 一鍵開啟當前所有帖子
// @description:zh-CN   一键下载图片 (压缩下载/单图下载) , 下载页面数据 , 一键开启当前所有帖子
// @description:ja      画像をワンクリックでダウンロード（圧縮ダウンロード/単一画像ダウンロード）、ページデータを作成してjsonでダウンロード、現在のすべての投稿をワンクリックで開く
// @description:ru      Загрузка изображений в один клик (сжатая загрузка/загрузка отдельных изображений), создание данных страницы для загрузки в формате json, открытие всех текущих постов одним кликом
// @description:ko      이미지 원클릭 다운로드(압축 다운로드/단일 이미지 다운로드), 페이지 데이터 생성하여 json 다운로드, 현재 모든 게시물 원클릭 열기
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
// @supportURL   https://github.com/Canaan-HS/MonkeyScript/issues
// @icon         https://cdn-icons-png.flaticon.com/512/2381/2381981.png

// @run-at       document-start
// @grant        window.close
// @grant        window.onurlchange
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @grant        GM_openInTab
// @grant        GM_getResourceURL
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand

// @require      https://update.greasyfork.org/scripts/529004/1548656/JSZip_min.js
// @require      https://update.greasyfork.org/scripts/495339/1580133/Syntax_min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.19.0/js/md5.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// ==/UserScript==

/**
* 修改思路 (什麼時候有空不知道)
*
* 功能設置: 操作系統通知(開關按鈕)/ 下載完成後自動關閉(開關按鈕)/ 實驗功能(開關按鈕)
* 一鍵開帖延遲(輸入框/毫秒)/ 實驗下載延遲(輸入框/毫秒)
*
* 功能選擇:
* 下載模式選擇(按鈕)
* Json 實驗下載功能(按鈕)
* 開啟當前所有頁面(按鈕)
* 進階 Json 輸出格式設置
*
* 添加功能:
* 下載時檔名格式選擇
* 壓縮下載時選擇是否需多一個資料夾
* 上傳導出的 Json 一鍵下載所有內容 (圖片/影片|雲端應該無法)
*/

(async () => {
    const Config = {
        Dev: true, // 顯示請求資訊, 與錯誤資訊
        ContainsVideo: false, // 下載時包含影片
        CompleteClose: false, // 下載完成後關閉
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
     * 設置 FetchData 輸出格式
     *
     *! 無論設置什麼, 只要沒有的數據, 就不會顯示 (會被排除掉)
     *
     * ----------------------
     * 舊版 nekohouse.su
     *
     *
     * ----------------------
     * Mode
     * 排除模式: "FilterMode" -> 預設為全部使用, 設置排除的項目
     * 僅有模式: "OnlyMode" -> 預設為全部不使用, 設置使用的項目
     * ----------------------
     * Format
     * 帖子連結: "PostLink"
     * 發佈時間: "Timestamp"
     * 標籤 Tag: "TypeTag" (Only AdvancedFetch)
     * 圖片連結: "ImgLink"
     * 影片連結: "VideoLink"
     * 下載連結: "DownloadLink"
     * 外部連結: "ExternalLink" (Only AdvancedFetch)
     */
    const FetchSet = {
        Delay: 200, // 獲取延遲 (ms) [太快會被 BAN]
        AdvancedFetch: true, // 進階獲取 (如果只需要 圖片和影片連結, 關閉該功能獲取會快很多)
        ToLinkTxt: false, // 啟用後輸出為只有連結的 txt, 用於 IDM 導入下載
        UseFormat: false, // 這裡為 false 下面兩項就不生效
        Mode: "FilterMode",
        Format: ["Timestamp", "TypeTag"],
    };

    /* --------------------- */

    let lock = false;
    const { Transl } = Language();
    const IsNeko = Syn.$domain === "nekohouse.su"; // 臨時方案

    class Download {
        constructor(CM, MD, BT) {
            this.Button = BT;
            this.ModeDisplay = MD;
            this.CompressMode = CM;
            this.ForceDownload = false;

            this.Named_Data = null;

            /* 獲取原始標題 */
            this.OriginalTitle = () => {
                const cache = Syn.title();
                return cache.startsWith("✓ ") ? cache.slice(2) : cache;
            };

            this.videoFormat = new Set(["MP4", "MOV", "AVI", "WMV", "FLV"]);
            this.isVideo = (str) => this.videoFormat.has(str.toUpperCase());

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
                        if (response.ok === true && response.status === 200) {
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

        /* 解析名稱格式 */
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

        /* 下載觸發 [ 查找下載數據, 解析下載資訊, 呼叫下載函數 ] */
        DownloadTrigger() { // 下載數據, 文章標題, 作者名稱
            Syn.WaitElem([
                ".post__title, .scrape__title",
                ".post__files, .scrape__files",
                ".post__user-name, .scrape__user-name, fix_name"
            ], found => {
                const [title, files, artist] = found;
                this.Button.disabled = lock = true;
                const DownloadData = new Map();

                this.Named_Data = { // 建立數據
                    fill: () => "fill",
                    title: () => title.$q("span").$text(),
                    artist: () => artist.$text(),
                    source: () => new Date(title.$q(":nth-child(2)").$text()).toLocaleString(),
                    time: () => {
                        if (IsNeko) {
                            return Syn.$q(".timestamp").$text() || "";
                        };

                        let published = Syn.$q(".post__published").$copy();
                        Syn.$q(".post__published");
                        published.firstElementChild.remove();
                        return published.$text().split(" ")[0];
                    }
                }

                const [ // 獲取名稱
                    compress_name,
                    folder_name,
                    fill_name
                ] = Object.keys(FileName).slice(1).map(key => this.NameAnalysis(FileName[key]));

                const // 這種寫法適應於還未完全載入原圖時
                    data = [...files.children]
                        .map(child => child.$q(IsNeko ? ".fileThumb, rc, img" : "a, rc, img"))
                        .filter(Boolean),
                    video = Syn.$qa(".post__attachment a, .scrape__attachment a"),
                    final_data = Config.ContainsVideo ? [...data, ...video] : data;

                // 使用 foreach, 他的異步特性可能造成一些意外, 因此使用 for
                for (const [index, file] of final_data.entries()) {
                    const Uri = file.src || file.href || file.$gAttr("src") || file.$gAttr("href");
                    if (Uri) {
                        DownloadData.set(index, (
                            Uri.startsWith("http") ? Uri : `${Syn.$origin}${Uri}`
                        ));
                    }
                }

                if (DownloadData.size == 0) Config.Dev = true; // 如果沒有下載數據, 就顯示開發者模式, 偵錯用

                Syn.Log("Get Data", {
                    FolderName: folder_name,
                    DownloadData: DownloadData
                }, { dev: Config.Dev, collapsed: false });

                this.CompressMode
                    ? this.PackDownload(compress_name, folder_name, fill_name, DownloadData)
                    : this.SeparDownload(fill_name, DownloadData);

            }, { raf: true });
        }

        /* 打包壓縮下載 */
        async PackDownload(CompressName, FolderName, FillName, Data) {
            let
                show,
                extension,
                progress = 0,
                Total = Data.size;
            const
                Self = this,
                Zip = new JSZip(),
                TitleCache = this.OriginalTitle();
            const
                FillValue = this.NameAnalysis(FileName.FillValue),
                Filler = FillValue[1],
                Amount = FillValue[0] == "auto" ? Syn.GetFill(Total) : FillValue[0];

            // 強制下載
            async function ForceDownload() {
                Self.worker.terminate();
                Self.Compression(CompressName, Zip, TitleCache);
            }

            Syn.Menu({
                [Transl("📥 強制壓縮下載")]: { func: () => ForceDownload(), hotkey: "d" }
            }, { name: "Enforce" });

            // 更新請求狀態
            FolderName = FolderName != "" ? `${FolderName}/` : ""; // 處理資料夾名稱格式
            function Request_update(index, url, blob, retry = false) {
                if (Self.ForceDownload) return;
                requestAnimationFrame(() => {
                    Data.delete(index);
                    if (retry) {
                        Data.set(index, url);
                    } else {
                        extension = Syn.ExtensionName(url); // 雖然 Mantissa 函數可直接傳遞 url 為第四個參數, 但因為需要 isVideo 的資訊, 所以分別操作
                        Self.isVideo(extension)
                            ? Zip.file(`${FolderName}${decodeURIComponent(url.split("?f=")[1])}`, blob)
                            : Zip.file(`${FolderName}${FillName.replace("fill", Syn.Mantissa(index, Amount, Filler))}.${extension}`, blob);
                    }

                    show = `[${++progress}/${Total}]`;
                    Syn.title(show);
                    Self.Button.$text(`${Transl("下載進度")} ${show}`);

                    if (progress == Total) {
                        Total = Data.size;
                        if (Total == 0) {
                            Self.worker.terminate();
                            Self.Compression(CompressName, Zip, TitleCache);
                        } else {
                            show = "Wait for failed re download";
                            progress = 0;
                            Syn.title(show);
                            Self.Button.$text(show);
                            setTimeout(() => {
                                for (const [index, url] of Data.entries()) {
                                    Self.worker.postMessage({ index: index, url: url });
                                }
                            }, 1500);
                        }
                    }
                });
            }

            // 不使用 worker 的請求, 切換窗口時, 這裡的請求就會變慢
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
                        blob instanceof Blob && blob.size > 0
                            ? Request_update(index, url, blob)
                            : Request_update(index, url, "", true);
                    },
                    onerror: () => {
                        Request_update(index, url, "", true);
                    }
                })
            }

            // 傳遞訊息
            const Batch = Config.ConcurrentQuantity;
            const Delay = Config.ConcurrentDelay * 1e3;

            // 只是顯示給使用者讓其知道 有運作 (無實際作用)
            Self.Button.$text(`${Transl("請求進度")} [${Total}/${Total}]`);

            for (let i = 0; i < Total; i += Batch) {
                setTimeout(() => {
                    for (let j = i; j < i + Batch && j < Total; j++) {
                        this.worker.postMessage({ index: j, url: Data.get(j) });
                    }
                }, (i / Batch) * Delay);
            }

            // 接收訊息
            this.worker.onmessage = (e) => {
                const { index, url, blob, error } = e.data;
                error
                    ? (Request(index, url), Syn.Log("Download Failed", url, { dev: Config.Dev, type: "error", collapsed: false }))
                    : (Request_update(index, url, blob), Syn.Log("Download Successful", url, { dev: Config.Dev, collapsed: false }));
            }
        }

        /* 壓縮檔案 */
        async Compression(Name, Data, Title) {
            this.ForceDownload = true;
            GM_unregisterMenuCommand("Enforce-1");
            Data.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: { level: 5 }
            }, (progress) => {
                const display = `${progress.percent.toFixed(1)} %`;
                Syn.title(display);
                this.Button.$text(`${Transl("封裝進度")}: ${display}`);
            }).then(zip => {
                saveAs(zip, `${Name}.zip`);
                Syn.title(`✓ ${Title}`);
                this.Button.$text(Transl("下載完成"));
                setTimeout(() => {
                    this.ResetButton();
                }, 3000);
            }).catch(result => {
                Syn.title(Title);

                const ErrorShow = Transl("壓縮封裝失敗");
                this.Button.$text(ErrorShow);
                Syn.Log(ErrorShow, result, { dev: Config.Dev, type: "error", collapsed: false });

                setTimeout(() => {
                    this.Button.disabled = false;
                    this.Button.$text(this.ModeDisplay);
                }, 6000);
            })
        }

        /* 單圖下載 */
        async SeparDownload(FillName, Data) {
            let
                show,
                link,
                filename,
                extension,
                stop = false,
                progress = 0;
            const
                Self = this,
                Process = [],
                Promises = [],
                Total = Data.size,
                ShowTracking = {},
                DownloadTracking = {},
                TitleCache = this.OriginalTitle();
            const
                FillValue = this.NameAnalysis(FileName.FillValue),
                Filler = FillValue[1],
                Amount = FillValue[0] == "auto" ? Syn.GetFill(Total) : FillValue[0];

            // 停止下載的線程
            async function Stop() {
                stop = true;
                Process.forEach(process => process.abort())
            }

            Syn.Menu({
                [Transl("⛔️ 取消下載")]: { func: () => Stop(), hotkey: "s" }
            }, { name: "Abort" });

            async function Request(index) {
                if (stop) return;
                link = Data.get(index);
                extension = Syn.ExtensionName(link);
                filename = Self.isVideo(extension)
                    ? decodeURIComponent(link.split("?f=")[1])
                    : `${FillName.replace("fill", Syn.Mantissa(index, Amount, Filler))}.${extension}`;

                return new Promise((resolve, reject) => {

                    const completed = () => {
                        if (!ShowTracking[index]) { // 多一個判斷是因為, 他有可能同樣的重複呼叫多次
                            ShowTracking[index] = true;

                            Syn.Log("Download Successful", link, { dev: Config.Dev, collapsed: false });

                            show = `[${++progress}/${Total}]`;
                            Syn.title(show);

                            Self.Button.$text(`${Transl("下載進度")} ${show}`);
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
                        onprogress: (progress) => {
                            /* 新版本的油猴插件, 這個回條怪怪的
                            Syn.Log("Download Progress", {
                                Index: index,
                                ImgUrl: link,
                                Progress: `${progress.loaded}/${progress.total}`
                            }, {dev: Config.Dev, collapsed: false});

                            DownloadTracking[index] = (progress.loaded == progress.total);
                            DownloadTracking[index] && completed();
                            */
                        },
                        onerror: () => {
                            Syn.Log("Download Error", link, { dev: Config.Dev, type: "error", collapsed: false });
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

            Syn.title(`✓ ${TitleCache}`);
            this.Button.$text(Transl("下載完成"));
            setTimeout(() => {
                this.ResetButton();
            }, 3000);
        }

        /* 按鈕重置 */
        async ResetButton() {
            Config.CompleteClose && window.close();
            lock = false;
            const Button = Syn.$q("#Button-Container button");
            Button.disabled = false;
            Button.$text(`✓ ${this.ModeDisplay}`);
        }
    }

    class FetchData {
        constructor(Delay, AdvancedFetch, ToLinkTxt) {
            this.MetaDict = {}; // 保存元數據
            this.DataDict = {}; // 保存最終數據
            this.RecordKey = `${decodeURIComponent(location.href)}-Complete`; // 緩存最終數據

            this.TaskDict = new Map(); // 任務臨時數據

            this.Host = Syn.$domain;
            this.SourceURL = document.URL; // 不能從 Device 取得, 會無法適應換頁
            this.TitleCache = Syn.title();
            this.FirstURL = this.SourceURL.split("?o=")[0]; // 第一頁連結

            this.Pages = 1; // 預設開始抓取的頁數
            this.FinalPages = 10; // 預設最終抓取的頁數
            this.Progress = 0; // 用於顯示當前抓取進度
            this.OnlyMode = false; // 判斷獲取數據的模式
            this.FetchDelay = Delay; // 獲取延遲
            this.ToLinkTxt = ToLinkTxt; // 判斷是否輸出為連結文本
            this.AdvancedFetch = AdvancedFetch; // 判斷是否往內抓數據

            // 內部連結的 API 模板
            this.PostAPI = `${this.FirstURL}/post`.replace(this.Host, `${this.Host}/api/v1`);

            this.PreviewAPI = Url => // 將預覽頁面轉成 API 連結
                /[?&]o=/.test(Url)
                    ? Url.replace(this.Host, `${this.Host}/api/v1`).replace(/([?&]o=)/, "/posts-legacy$1")
                    : Url.replace(this.Host, `${this.Host}/api/v1`) + "/posts-legacy";

            // 預設添加的數據
            this.InfoRules = {
                "PostLink": Transl("帖子連結"),
                "Timestamp": Transl("發佈日期"),
                "TypeTag": Transl("類型標籤"),
                "ImgLink": Transl("圖片連結"),
                "VideoLink": Transl("影片連結"),
                "DownloadLink": Transl("下載連結"),
                "ExternalLink": Transl("外部連結")
            };

            // 根據類型判斷預設值
            this.Default = (Value) => {
                if (!Value) return null;

                const type = Syn.Type(Value);
                if (type === "Array") return Value.length > 0 && Value.some(item => item !== "") ? Value : null;
                if (type === "Object") {
                    const values = Object.values(Value);
                    return values.length > 0 && values.some(item => item !== "") ? Value : null;
                }

                return Value;
            };

            /**
             * 生成數據
             * @param {{
             *      PostLink: string,
             *      Timestamp: string,
             *      TypeTag: array,
             *      ImgLink: object,
             *      VideoLink: object,
             *      DownloadLink: object
             *      ExternalLink: object
             * }} Data
             * @returns {object}
             */
            this.FetchGenerate = (Data) => {
                return Object.keys(Data).reduce((acc, key) => {
                    if (this.InfoRules.hasOwnProperty(key)) {
                        const value = this.Default(Data[key]);
                        value && (acc[this.InfoRules[key]] = value); // 有數據的才被添加
                    }
                    return acc;
                }, {});
            };

            // 影片類型
            this.Video = new Set([
                ".mp4", ".avi", ".mkv", ".mov", ".flv", ".wmv", ".webm", ".mpg", ".mpeg",
                ".m4v", ".ogv", ".3gp", ".asf", ".ts", ".vob", ".rm", ".rmvb", ".m2ts",
                ".f4v", ".mts"
            ]);

            // 圖片類型
            this.Image = new Set([
                ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff", ".tif",
                ".svg", ".heic", ".heif", ".raw", ".ico", ".psd"
            ]);

            // 抓取檔案的副檔名
            this.Suffix = (Str) => `.${Str?.match(/\.([^.]+)$/)[1]?.trim()}`;

            // 進階抓取檔案分類 (影片與圖片文件 Array) => { video: {}, other: {} }
            this.AdvancedCategorize = (Data) => {
                return Data.reduce((acc, file) => {
                    const url = `${file.server}/data${file.path}?f=${file.name}`;
                    this.Video.has(file.extension) ? (acc.video[file.name] = url) : (acc.other[file.name] = url);
                    return acc;
                }, { video: {}, other: {} });
            };

            // 一般抓取的檔案分類 (標題字串, 所有類型文件 Array) => { img: [], video: {}, other: {} }
            this.Categorize = (Title, Data) => {
                let imgNumber = 0;
                let serverNumber = 0;

                return Data.reduce((acc, file) => {
                    const name = file.name;
                    const path = file.path;
                    const extension = this.Suffix(name);

                    serverNumber = (serverNumber % 4) + 1;
                    const server = `https://n${serverNumber}.${this.Host}/data`;

                    if (this.Video.has(extension)) {
                        acc.video[name] = `${server}${path}?f=${name}`;
                    } else if (this.Image.has(extension)) {
                        const name = `${Title}_${String(++imgNumber).padStart(2, "0")}${extension}`;
                        acc.img[name] = `${server}${path}?f=${name}`;
                    } else {
                        acc.other[name] = `${server}${path}?f=${name}`;
                    }

                    return acc;
                }, { img: {}, video: {}, other: {} });
            };

            this.TryAgain_Promise = null; // 緩存等待的 Promise
            this.TooMany_TryAgain = (Uri) => {
                // 如果已經有一個等待中的 Promise，直接返回
                if (this.TryAgain_Promise) {
                    return this.TryAgain_Promise;
                }

                const sleepTime = 5e3; // 每次等待 5 秒
                const timeout = 20e4; // 最多等待 20 秒
                const Url = Uri;

                this.TryAgain_Promise = new Promise(async (resolve) => {
                    const checkRequest = async () => {
                        const controller = new AbortController(); // 創建 AbortController
                        const signal = controller.signal;
                        const timeoutId = setTimeout(() => {
                            controller.abort(); // 超時後中止請求
                        }, timeout);

                        try {
                            const response = await fetch(Url, { // 發起請求
                                method: "HEAD", signal
                            });

                            clearTimeout(timeoutId);
                            if (response.status === 429) {
                                await Syn.Sleep(sleepTime);
                                await checkRequest(); // 繼續檢查
                            } else {
                                resolve(); // 等待完成
                                this.TryAgain_Promise = null;
                            }
                        } catch (err) {
                            clearTimeout(timeoutId);
                            await Syn.Sleep(sleepTime);
                            await checkRequest();
                        }
                    };

                    await checkRequest();
                });

                return this.TryAgain_Promise;
            };

            // 請求工作
            this.Worker = Syn.WorkerCreation(`
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
                        if (xhr.status === 200) {
                            postMessage({ index, title, url, text: xhr.response, error: false });
                        } else if (xhr.status === 429) {
                            postMessage({ index, title, url, text: "", error: true });
                        } else {
                            FetchRequest(index, title, url);
                        }
                    }
                    xhr.onerror = function() {
                        if (xhr.status === 429) {
                            postMessage({ index, title, url, text: "", error: true });
                        } else {
                            FetchRequest(index, title, url);
                        }
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

            // 解析特別連結
            this.specialLinkParse = (Data) => {
                const Cache = {};

                try {
                    for (const a of Syn.DomParse(Data).$qa("body a")) {
                        const href = a.href;
                        const hash = md5(href).slice(0, 16);

                        if (href.startsWith("https://mega.nz")) {

                            let name = (a.previousElementSibling.$text().replace(":", "") || hash);
                            if (name === "") continue;

                            let pass = "";
                            const nextNode = a.nextElementSibling;

                            if (nextNode) {
                                const nodeText = [...nextNode.childNodes].find(node => node.nodeType === Node.TEXT_NODE).$text() ?? "";
                                if (nodeText.startsWith("Pass")) {
                                    pass = nodeText.match(/Pass:([^<]*)/)?.[1]?.trim() ?? "";
                                }
                            };

                            Cache[name] = pass ? {
                                [Transl("密碼")]: pass,
                                [Transl("連結")]: href
                            } : href;
                        } else if (href) {
                            const description = a.previousSibling.$text() ?? "";
                            const name = `${description} ${a.$text()}`.trim();
                            Cache[name ? name : hash] = href;
                        }
                    };
                } catch (error) {
                    Syn.Log("Error specialLinkParse", error, { dev: Config.Dev, type: "error", collapsed: false });
                }

                return Cache;
            };
        }

        /**
         * 設置抓取規則
         * @param {string} Mode - "FilterMode" | "OnlyMode"
         * @param {Array} UserSet - 要進行的設置
         *
         * @example
         * 可配置項目: ["PostLink", "Timestamp", "TypeTag", "ImgLink", "VideoLink", "DownloadLink"]
         *
         * 這會將這些項目移除在顯示
         * FetchConfig("FilterMode", ["PostLink", "ImgLink", "DownloadLink"]);
         *
         * 這會只顯示這些項目
         * FetchConfig("OnlyMode", ["PostLink", "ImgLink", "DownloadLink"]);
         */
        async FetchConfig(Mode = "FilterMode", UserSet = []) {
            let Cache;
            switch (Mode) {
                case "FilterMode":
                    this.OnlyMode = false;
                    UserSet.forEach(key => delete this.InfoRules[key]);
                    break;
                case "OnlyMode":
                    this.OnlyMode = true;
                    Cache = Object.keys(this.InfoRules).reduce((acc, key) => {
                        if (UserSet.includes(key)) acc[key] = this.InfoRules[key];
                        return acc;
                    }, {});
                    this.InfoRules = Cache;
                    break;
            }
        };

        /* 入口調用函數 */
        async FetchInit() {
            const Section = Syn.$q("section");

            if (Section) {
                lock = true; // 鎖定菜單的操作, 避免重複抓取

                // 取得當前頁數
                for (const page of Syn.$qa(".pagination-button-disabled b")) {
                    const number = Number(page.$text());
                    if (number) {
                        this.Pages = number;
                        break;
                    }
                }

                Syn.Session(this.RecordKey) && (this.FetchDelay = 0); // 當存在完成紀錄時, 降低延遲
                this.FetchRun(Section, this.SourceURL); // 啟用抓取
            } else {
                alert(Transl("未取得數據"));
            }
        };

        /* ===== 主要抓取函數 ===== */

        /* 運行抓取數據 */
        async FetchRun(Section, Url) {

            if (IsNeko) {
                const Item = Section.$qa(".card-list__items article");

                // 下一頁連結
                const Menu = Section.$q("a.pagination-button-after-current");
                if (Menu) {
                    // Menu.href
                }
            } else {
                this.Worker.postMessage({ index: 0, title: this.TitleCache, url: this.PreviewAPI(Url) });

                // 等待主頁數據
                const HomePage = await new Promise((resolve, reject) => {
                    this.Worker.onmessage = async (e) => {
                        const { index, title, url, text, error } = e.data;
                        if (!error) resolve({ index, title, url, text });
                        else {
                            Syn.Log(error, { title: title, url: url }, { dev: Config.Dev, type: "error", collapsed: false });
                            await this.TooMany_TryAgain(url);
                            this.Worker.postMessage({ index: index, title: title, url: url });
                        };
                    }
                });

                // 等待內容數據
                await this.FetchContent(HomePage);

                this.Pages++;
                this.Pages <= this.FinalPages
                    ? this.FetchRun(null,
                        /\?o=\d+$/.test(Url) // 生成下一頁連結
                            ? Url.replace(/\?o=(\d+)$/, (match, number) => `?o=${+number + 50}`)
                            : `${Url}?o=50`
                    )
                    : (
                        Syn.Session(this.RecordKey, { value: true }),
                        this.ToLinkTxt ? this.ToTxt() : this.ToJson()
                    );
            }
        };

        /* 獲取帖子內部數據 */
        async FetchContent(Data) {
            this.Progress = 0; // 重置進度
            const { index, title, url, text } = Data; // 解構數據

            // 解析處理的數據
            if (IsNeko) {

            } else {
                /* ----- 這邊是主頁的數據 ----- */
                const Json = JSON.parse(text);

                if (Json) {

                    // 首次生成元數據
                    if (Object.keys(this.MetaDict).length === 0) {
                        const props = Json.props;
                        this.FinalPages = Math.ceil(+props.count / 50); // 計算最終頁數
                        this.MetaDict = {
                            [Transl("作者")]: props.name,
                            [Transl("帖子數量")]: props.count,
                            [Transl("建立時間")]: Syn.GetDate("{year}-{month}-{date} {hour}:{minute}"),
                            [Transl("獲取頁面")]: this.SourceURL,
                            [Transl("作者網站")]: props.display_data.href
                        };
                    }

                    const Results = Json.results;
                    if (this.AdvancedFetch) {
                        const Tasks = [];
                        const resolvers = new Map(); // 用於存儲每個 Promise

                        this.Worker.onmessage = async (e) => {
                            const { index, title, url, text, error } = e.data;

                            if (resolvers.has(index)) {
                                const { resolve, reject } = resolvers.get(index);

                                try {
                                    if (!error) {
                                        const Json = JSON.parse(text);

                                        if (Json) {
                                            const Post = Json.post;
                                            const Title = Post.title.trim() || `Untitled_${String(index + 1).padStart(2, "0")}`;

                                            // 對下載連結進行分類
                                            const File = this.AdvancedCategorize(Json.attachments);

                                            // 獲取圖片連結
                                            const ImgLink = () => {//! 還需要測試
                                                const ServerList = Json.previews.filter(item => item.server); // 取得圖片伺服器
                                                if ((ServerList?.length ?? 0) === 0) return;

                                                // 為了穩定性這樣寫
                                                const List = [
                                                    ...(Post.file ? (Array.isArray(Post.file) ? Post.file : Object.keys(Post.file).length ? [Post.file] : []) : []),
                                                    ...Post.attachments
                                                ];
                                                const Fill = Syn.GetFill(ServerList.length);

                                                // 依據篩選出有預覽圖伺服器的, 生成圖片連結
                                                return ServerList.reduce((acc, Server, Index) => {
                                                    const extension = [List[Index].name, List[Index].path]
                                                        .map(name => this.Suffix(name))
                                                        .find(ext => this.Image.has(ext));

                                                    if (!extension) return acc;

                                                    const name = `${Title}_${Syn.Mantissa(Index, Fill, '0', extension)}`;
                                                    acc[name] = `${Server.server}/data${List[Index].path}?f=${name}`;
                                                    return acc;
                                                }, {});
                                            };

                                            // 生成請求數據 (處理要抓什麼數據)
                                            const Gen = this.FetchGenerate({
                                                PostLink: `${this.FirstURL}/post/${Post.id}`,
                                                Timestamp: new Date(Post.added)?.toLocaleString(),
                                                TypeTag: Post.tags,
                                                ImgLink: ImgLink(),
                                                VideoLink: File.video,
                                                DownloadLink: File.other,
                                                ExternalLink: this.specialLinkParse(Post.content)
                                            });

                                            // 儲存數據
                                            if (Object.keys(Gen).length !== 0) {
                                                this.TaskDict.set(index, { title: Title, content: Gen });
                                            };

                                            resolve();
                                            Syn.title(`（${this.Pages} - ${++this.Progress}）`);
                                            Syn.Log("Request Successful", this.TaskDict, { dev: Config.Dev, collapsed: false });
                                        } else throw new Error("Json Parse Failed");
                                    } else {
                                        throw new Error("Request Failed");
                                    }
                                } catch (error) {
                                    Syn.Log(error, { index: index, title: title, url: url }, { dev: Config.Dev, type: "error", collapsed: false });
                                    await this.TooMany_TryAgain(url); // 錯誤等待
                                    this.Worker.postMessage({ index: index, title: title, url: url });
                                }
                            }
                        };

                        // 生成任務
                        for (const [Index, Post] of Results.entries()) {
                            Tasks.push(new Promise((resolve, reject) => {
                                resolvers.set(Index, { resolve, reject }); // 存儲解析器
                                this.Worker.postMessage({ index: Index, title: Post.title, url: `${this.PostAPI}/${Post.id}` });
                            }));

                            await Syn.Sleep(this.FetchDelay);
                        }

                        // 等待所有任務
                        await Promise.allSettled(Tasks);

                    } else {
                        for (const [Index, Post] of Results.entries()) {
                            const Title = Post.title.trim();

                            try {
                                // 分類所有文件
                                const File = this.Categorize(Title, [...(Post.file ? (Array.isArray(Post.file) ? Post.file : Object.keys(Post.file).length ? [Post.file] : []) : []), ...Post.attachments]);

                                const Gen = this.FetchGenerate({
                                    PostLink: `${this.FirstURL}/post/${Post.id}`,
                                    Timestamp: new Date(Post.published)?.toLocaleString(),
                                    ImgLink: File.img,
                                    VideoLink: File.video,
                                    DownloadLink: File.other
                                });

                                if (Object.keys(Gen).length !== 0) {
                                    this.TaskDict.set(Index, { title: Title, content: Gen });
                                };

                                Syn.title(`（${this.Pages} - ${++this.Progress}）`);
                                Syn.Log("Parsed Successful", this.TaskDict, { dev: Config.Dev, collapsed: false });
                            } catch (error) {
                                Syn.Log(error, { title: Title, url: url }, { dev: Config.Dev, type: "error", collapsed: false });
                                continue;
                            }
                        }
                    }

                    // 將數據依序取出轉存
                    for (const data of this.TaskDict.values()) {
                        this.DataDict[data.title] = data.content;
                    }

                    this.TaskDict.clear(); // 清空任務數據
                    await Syn.Sleep(this.FetchDelay);
                    return true; // 回傳完成
                } else { /* 之後在想 */ }
            }
        };

        /* ===== 輸出生成 ===== */

        async ToTxt() {
            let Content = "";
            for (const value of Object.values(this.DataDict)) {
                for (const link of Object.values(Object.assign({},
                    value[Transl("圖片連結")],
                    value[Transl("影片連結")],
                    value[Transl("下載連結")]
                ))) {
                    Content += `${link}\n`;
                }
            }
            if (Content.endsWith('\n')) Content = Content.slice(0, -1); // 去除末行空白

            Syn.OutputTXT(Content, this.MetaDict[Transl("作者")], () => {
                lock = false;
                this.Worker.terminate();
                Syn.title(this.TitleCache);
            })
        };

        async ToJson() {
            // 合併數據
            const Json_data = Object.assign(
                {},
                { [Transl("元數據")]: this.MetaDict },
                { [`${Transl("帖子內容")} (${Object.keys(this.DataDict).length})`]: this.DataDict }
            );

            Syn.OutputJson(Json_data, this.MetaDict[Transl("作者")], () => {
                lock = false;
                this.Worker.terminate();
                Syn.title(this.TitleCache);
            });
        };

    }

    (new class Main {
        constructor() {
            this.Content = (URL) => /^(https?:\/\/)?(www\.)?.+\/.+\/user\/.+\/post\/.+$/.test(URL),
            this.Preview = (URL) => /^(https?:\/\/)?(www\.)?.+\/posts\/?(\?.*)?$/.test(URL)
                || /^(https?:\/\/)?(www\.)?.+\/.+\/user\/[^\/]+(\?.*)?$/.test(URL)
                || /^(https?:\/\/)?(www\.)?.+\/dms\/?(\?.*)?$/.test(URL)

            this.AddStyle = async () => {
                
            }
        }

        /* 按鈕創建 */
        async ButtonCreation() {
            Syn.WaitElem(".post__body h2, .scrape__body h2", null, {raf: true, all: true}).then(Files => {
                Syn.AddStyle(`
                    #Button-Container {
                        padding: 1rem;
                        font-size: 40% !important;
                    }
                    #Button-Container svg {
                        fill: white;
                    }
                    .Setting_Button {
                        cursor: pointer;
                    }
                    .Download_Button {
                        color: hsl(0, 0%, 45%);
                        padding: 6px;
                        margin: 10px;
                        border-radius: 8px;
                        font-size: 1.1vw;
                        border: 2px solid rgba(59, 62, 68, 0.7);
                        background-color: rgba(29, 31, 32, 0.8);
                        font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    }
                    .Download_Button:hover {
                        color: hsl(0, 0%, 95%);
                        background-color: hsl(0, 0%, 45%);
                        font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    }
                    .Download_Button:disabled {
                        color: hsl(0, 0%, 95%);
                        background-color: hsl(0, 0%, 45%);
                        cursor: Synault;
                    }
                `, "Download-button-style", false);


                Syn.$q("#Button-Container")?.remove(); // 重複時刪除舊的容器
                let Button;

                try {

                    // 創建 Span (找到含有 Files 文本的對象)
                    Files = [...Files].filter(file => file.$text() === "Files");
                    if (Files.length == 0) return;

                    const CompressMode = Syn.Local("Compression", { error: true });
                    const ModeDisplay = CompressMode ? Transl("壓縮下載") : Transl("單圖下載");

                    // 創建容器
                    const Container = Syn.createElement("span", { id: "Button-Container" });

                    Syn.createElement(Container, "svg", { // 創建設置 SVG
                        class: "Setting_Button",
                        innerHTML: `<svg xmlns="http://www.w3.org/2000/svg" height="1.3rem" viewBox="0 0 512 512"><path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/></svg>`
                    });

                    Button = Syn.createElement(Container, "button", { // 創建 Button
                        class: "Download_Button",
                        text: lock ? Transl("下載中鎖定") : ModeDisplay,
                        disabled: lock
                    });

                    Files[0].appendChild(Container);
                    Syn.one(Container, "click", event => {
                        const target = event.target;

                        if (target === Button) {
                            let Instantiate = null;
                            Instantiate = new Download(CompressMode, ModeDisplay, Button);
                            Instantiate.DownloadTrigger();
                        } else if (target.closest("svg")) {
                            alert("Currently Invalid");
                        }
                    }, { capture: true, passive: true });
                } catch (error) {
                    Syn.Log("Button Creation Failed", error, { dev: Config.Dev, type: "error", collapsed: false });

                    Button.disabled = true;
                    Button.$text(Transl("無法下載"));
                }
            })
        }

        /* 一鍵開啟當前所有帖子 */
        async OpenAllPages() {
            const card = Syn.$qa("article.post-card a");
            if (card.length == 0) { throw new Error("No links found") }

            let scope = prompt(`(${Transl("當前帖子數")}: ${card.length})${Transl("開帖說明")}`);

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

        /* 下載模式切換 */
        async DownloadModeSwitch() {
            Syn.Local("Compression", { error: true })
                ? Syn.Local("Compression", { value: false })
                : Syn.Local("Compression", { value: true });
            this.ButtonCreation();
        }

        /* 注入檢測創建 [ 檢測頁面創建按鈕, 創建菜單 ] */
        async Injection() {
            const self = this;

            // 下載模式 native, disabled, browser
            GM_info.downloadMode = "browser";
            GM_info.isIncognito = true;

            // 首次載入嘗試註冊
            registerMenu(Syn.$url);
            self.Content(Syn.$url) && self.ButtonCreation();

            /* 註冊菜單 */
            async function registerMenu(Page) {

                if (self.Content(Page)) {
                    Syn.Menu({
                        [Transl("🔁 切換下載模式")]: { func: () => self.DownloadModeSwitch(), close: false, hotkey: "c" }
                    }, { reset: true });
                } else if (self.Preview(Page)) {
                    Syn.Menu({
                        [Transl("📑 獲取帖子數據")]: () => {
                            if (!lock) {
                                let Instantiate = null;
                                Instantiate = new FetchData(FetchSet.Delay, FetchSet.AdvancedFetch, FetchSet.ToLinkTxt);
                                FetchSet.UseFormat && Instantiate.FetchConfig(FetchSet.Mode, FetchSet.Format);
                                Instantiate.FetchInit();
                            }
                        },
                        [Transl("📃 開啟當前頁面帖子")]: self.OpenAllPages
                    }, { reset: true });
                }
            };

            Syn.onUrlChange(change => {
                self.Content(change.url) && self.ButtonCreation();
                registerMenu(change.url);
            });

        }
    }).Injection();

    function Language() {
        const Word = Syn.TranslMatcher({
            Traditional: {
                "開帖說明": "\n\n!! 不輸入直接確認, 將會開啟當前頁面所有帖子\n輸入開啟範圍(說明) =>\n單個: 1, 2, 3\n範圍: 1~5, 6-10\n排除: !5, -10"
            },
            Simplified: {
                "🔁 切換下載模式": "🔁 切换下载模式",
                "📑 獲取帖子數據": "📑 获取帖子数据",
                "📃 開啟當前頁面帖子": "📃 打开当前页面帖子",
                "📥 強制壓縮下載": "📥 强制压缩下载",
                "⛔️ 取消下載": "⛔️ 取消下载",
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
                "未取得數據": "未获取到数据",
                "模式切換": "模式切换",
                "數據處理中": "数据处理中",
                "當前處理頁數": "当前处理页数",
                "數據處理完成": "数据处理完成",
                "Json 數據下載": "JSON 数据下载",
                "當前帖子數": "当前帖子数",
                "開帖說明": "\n\n!! 如果直接确认而不输入，将会打开当前页面的所有帖子\n输入选择范围：\n单个项目：1, 2, 3\n范围指定：1~5, 6-10\n排除项目：!5, -10",
            },
            Japan: {
                "🔁 切換下載模式": "🔁 ダウンロードモード切替",
                "📑 獲取帖子數據": "📑 投稿データ取得",
                "📃 開啟當前頁面帖子": "📃 現在のページの投稿を開く",
                "📥 強制壓縮下載": "📥 強制圧縮ダウンロード",
                "⛔️ 取消下載": "⛔️ ダウンロード中止",
                "壓縮下載模式": "圧縮ダウンロードモード",
                "單圖下載模式": "単一画像ダウンロードモード",
                "壓縮下載": "圧縮ダウンロード",
                "單圖下載": "単一画像ダウンロード",
                "開始下載": "ダウンロード開始",
                "無法下載": "ダウンロード不可",
                "下載進度": "ダウンロード進捗",
                "封裝進度": "パッケージング進捗",
                "壓縮封裝失敗": "圧縮パッケージング失敗",
                "下載完成": "ダウンロード完了",
                "請求進度": "リクエスト進捗",
                "下載中鎖定": "ダウンロード中ロック",
                "原始連結": "元のリンク",
                "圖片數量": "画像数",
                "影片數量": "動画数",
                "下載連結": "ダウンロードリンク",
                "作者": "作者",
                "時間": "時間",
                "來源": "ソース",
                "未取得數據": "データ未取得",
                "模式切換": "モード切替",
                "數據處理中": "データ処理中",
                "當前處理頁數": "現在処理中のページ",
                "數據處理完成": "データ処理完了",
                "Json 數據下載": "Jsonデータダウンロード",
                "當前帖子數": "現在の投稿数",
                "開帖說明": "\n\n!! 確認を入力しないと、現在のページのすべての投稿が開かれます\n開始範囲を入力してください：\n単一項目: 1, 2, 3\n範囲指定: 1~5, 6-10\n除外設定: !5, -10",
            },
            Korea: {
                "🔁 切換下載模式": "🔁 다운로드 모드 전환",
                "📑 獲取帖子數據": "📑 게시물 데이터 가져오기",
                "📃 開啟當前頁面帖子": "📃 현재 페이지 게시물 열기",
                "📥 強制壓縮下載": "📥 강제 압축 다운로드",
                "⛔️ 取消下載": "⛔️ 다운로드 취소",
                "壓縮下載模式": "압축 다운로드 모드",
                "單圖下載模式": "단일 이미지 다운로드 모드",
                "壓縮下載": "압축 다운로드",
                "單圖下載": "단일 이미지 다운로드",
                "開始下載": "다운로드 시작",
                "無法下載": "다운로드 불가",
                "下載進度": "다운로드 진행률",
                "封裝進度": "패키징 진행률",
                "壓縮封裝失敗": "압축 실패",
                "下載完成": "다운로드 완료",
                "請求進度": "요청 진행률",
                "下載中鎖定": "다운로드 중 잠금",
                "原始連結": "원본 링크",
                "圖片數量": "이미지 수",
                "影片數量": "동영상 수",
                "下載連結": "다운로드 링크",
                "作者": "작성자",
                "時間": "시간",
                "來源": "출처",
                "未取得數據": "데이터를 가져오지 못함",
                "模式切換": "모드 전환",
                "數據處理中": "데이터 처리 중",
                "當前處理頁數": "현재 처리 페이지",
                "數據處理完成": "데이터 처리 완료",
                "Json 數據下載": "JSON 데이터 다운로드",
                "當前帖子數": "현재 게시물 수",
                "開帖說明": "\n\n!! 확인 없이 진행하면 현재 페이지의 모든 게시물이 열립니다\n선택 범위 입력:\n단일 항목: 1, 2, 3\n범위 지정: 1~5, 6-10\n제외 항목: !5, -10",
            },
            Russia: {
                "🔁 切換下載模式": "🔁 Переключить режим загрузки",
                "📑 獲取帖子數據": "📑 Получить данные постов",
                "📃 開啟當前頁面帖子": "📃 Открыть посты на текущей странице",
                "📥 強制壓縮下載": "📥 Принудительная сжатая загрузка",
                "⛔️ 取消下載": "⛔️ Отменить загрузку",
                "壓縮下載模式": "Режим сжатой загрузки",
                "單圖下載模式": "Режим загрузки отдельных изображений",
                "壓縮下載": "Сжатая загрузка",
                "單圖下載": "Загрузка отдельных изображений",
                "開始下載": "Начать загрузку",
                "無法下載": "Невозможно загрузить",
                "下載進度": "Прогресс загрузки",
                "封裝進度": "Прогресс упаковки",
                "壓縮封裝失敗": "Ошибка сжатия",
                "下載完成": "Загрузка завершена",
                "請求進度": "Прогресс запроса",
                "下載中鎖定": "Заблокировано во время загрузки",
                "原始連結": "Исходная ссылка",
                "圖片數量": "Количество изображений",
                "影片數量": "Количество видео",
                "下載連結": "Ссылка для загрузки",
                "作者": "Автор",
                "時間": "Время",
                "來源": "Источник",
                "未取得數據": "Данные не получены",
                "模式切換": "Переключение режима",
                "數據處理中": "Обработка данных",
                "當前處理頁數": "Обрабатываемая страница",
                "數據處理完成": "Обработка данных завершена",
                "Json 數據下載": "Загрузка данных JSON",
                "當前帖子數": "Текущее количество постов",
                "開帖說明": "\n\n!! Без подтверждения будут открыты все посты на текущей странице\nВведите диапазон выбора:\nОтдельные элементы: 1, 2, 3\nДиапазоны: 1~5, 6-10\nИсключения: !5, -10",
            },
            English: {
                "🔁 切換下載模式": "🔁 Switch Download Mode",
                "📑 獲取帖子數據": "📑 Get Post Data",
                "📃 開啟當前頁面帖子": "📃 Open Posts on Current Page",
                "📥 強制壓縮下載": "📥 Force Compressed Download",
                "⛔️ 取消下載": "⛔️ Cancel Download",
                "壓縮下載模式": "Compressed Download Mode",
                "單圖下載模式": "Single Image Download Mode",
                "壓縮下載": "Compressed Download",
                "單圖下載": "Single Image Download",
                "開始下載": "Start Download",
                "無法下載": "Unable to Download",
                "下載進度": "Download Progress",
                "封裝進度": "Packaging Progress",
                "壓縮封裝失敗": "Compression Failed",
                "下載完成": "Download Complete",
                "請求進度": "Request Progress",
                "下載中鎖定": "Locked During Download",
                "原始連結": "Original Link",
                "圖片數量": "Image Count",
                "影片數量": "Video Count",
                "下載連結": "Download Link",
                "作者": "Author",
                "時間": "Time",
                "來源": "Source",
                "未取得數據": "No Data Retrieved",
                "模式切換": "Mode Switch",
                "數據處理中": "Processing Data",
                "當前處理頁數": "Processing Page",
                "數據處理完成": "Data Processing Complete",
                "Json 數據下載": "Download JSON Data",
                "當前帖子數": "Current Post Count",
                "開帖說明": "\n\n!! Without confirmation, all posts on the current page will be opened\nEnter selection range:\nSingle items: 1, 2, 3\nRanges: 1~5, 6-10\nExclusions: !5, -10",
            }
        });

        return {
            Transl: (Str) => Word[Str] ?? Str,
        };
    }
})();