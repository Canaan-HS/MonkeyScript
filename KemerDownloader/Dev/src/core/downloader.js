import { monkeyWindow, Lib, saveAs } from "../services/client.js";
import { General, FileName, Process } from "./config.js";

import Parse from "../utils/parse.js";
import Transl from "../shared/language.js";

export default function Downloader() {
    const zipper = import.meta.hot
        ? monkeyWindow["zipper"] ??= Lib.createZip(GM_getResourceText("fflate"))
        : Lib.createZip(GM_getResourceText("fflate"));

    return class Download {
        constructor(compressMode, modeDisplay, button) {
            this.button = button;
            this.modeDisplay = modeDisplay;
            this.compressMode = compressMode;

            this.namedData = null;
            this.sourceType = null;
            this.forceCompressSignal = false;

            /* 獲取原始標題 */
            this.originalTitle = () => {
                const cache = Lib.title();
                return cache.startsWith("✓ ") ? cache.slice(2) : cache;
            };

            const videoExts = new Set(Process.VideoExts);
            this.isVideo = (str) => videoExts.has(str.replace(/^\./, "").toLowerCase());

            this.worker = this.compressMode ? Lib.createWorker(`
                let queue = [], processing=false;
                onmessage = function(e) {
                    queue.push(e.data);
                    !processing && (processing=true, processQueue());
                }
                async function processQueue() {
                    if (queue.length > 0) {
                        const {index, url} = queue.shift();
                        FetchRequest(index, url);
                        processQueue();
                    } else {processing = false}
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
            `) : null;
        }

        /* 解析名稱格式 */
        _nameAnalysis(format) {
            if (typeof format === "string") {
                return format.split(/{([^}]+)}/g).filter(Boolean).map(data => {
                    const lowerData = data.toLowerCase().trim();
                    const isWord = /^[a-zA-Z]+$/.test(lowerData);
                    return isWord ? this.namedData[lowerData]?.() ?? "None" : data;
                }).join("");

            } else if (typeof format == "object") {
                const filler = String(format.Filler) || "0";
                const amount = parseInt(format.Amount) || "auto";
                return [amount, filler];

            } else { }
        }

        /* 下載觸發 獲取所需數據 */
        trigger(sourceType) {
            this.sourceType = sourceType;

            Lib.waitEl([
                ".post__title, .scrape__title", // 下載數據
                ".post__files, .scrape__files", // 文章標題
                ".post__user-name, .scrape__user-name, fix_name" // 作者名稱
            ], found => {
                const [title, files, artist] = found;

                Process.Lock = true;

                // 使用該模式時全都鎖定
                if (General.IncludeExtras) {
                    Lib.$qa(".Download_Button:not([disabled])").forEach(el => el.disabled = true);
                } else {
                    this.button.disabled = true;
                }

                const downloadData = new Map();

                const { server, user, post } = Parse.getUrlInfo(Lib.url);

                this.namedData = { // 建立數據 (key 需要為全小寫, _nameAnalysis 會自動轉換)
                    fill: () => "fill",
                    userid: () => user,
                    postid: () => post,
                    title: () => title.$q("span").$text().replaceAll("/", "／"),
                    artist: () => artist.$text(),
                    source: () => server.charAt(0).toUpperCase() + server.slice(1),
                    time: () => {
                        if (Process.IsNeko) {
                            return Lib.$q(".timestamp").$text() || "";
                        };

                        let published = Lib.$q(".post__published").$copy();
                        Lib.$q(".post__published");
                        published.firstElementChild.remove();
                        return published.$text().split(" ")[0];
                    }
                }

                let [ // 獲取名稱
                    compressName,
                    folderName,
                    fillName
                ] = Object.keys(FileName).slice(1).map(key => this._nameAnalysis(FileName[key]));

                // 這種寫法適應於還未完全載入原圖時
                const imgData = [...files.children]
                    .map(child => child.$q(Process.IsNeko ? ".fileThumb, rc, img" : "a, rc, img"))
                    .filter(Boolean);

                const extrasData = Lib.$qa(".post__attachment a:not(.fancy-link):not([beautify]), .scrape__attachments a");

                const finalData = General.IncludeExtras
                    ? [...imgData, ...extrasData] // 包含所有下載內容
                    : (() => {
                        // 如果沒使用包括模式, 並使用壓縮模式會再壓縮名稱前 加上類型, 反之會在文件名前 加上類型
                        if (this.compressMode) compressName = `[${sourceType}] ${compressName}`;
                        else fillName = `[${sourceType}] ${fillName}`;

                        // 根據類型選擇
                        return sourceType === "Files" ? imgData : extrasData;
                    })();

                // 使用 foreach, 他的異步特性可能造成一些意外, 因此使用 for
                for (const [index, file] of finalData.entries()) {
                    const uri = file.src || file.href || file.$gAttr("src") || file.$gAttr("href");
                    if (uri) {
                        downloadData.set(index, (
                            uri.startsWith("http") ? uri : `${Lib.$origin}${uri}` // 方便打印觀看
                        ));
                    }
                }

                if (downloadData.size == 0) General.Dev = true; // 如果沒有下載數據, 就顯示開發者模式, 偵錯用

                Lib.log({
                    SourceType: sourceType,
                    CompressName: compressName,
                    FolderName: folderName,
                    DownloadData: downloadData
                }, { dev: General.Dev, group: "Get Data", collapsed: false });

                this.compressMode
                    ? this._packDownload(compressName, folderName, fillName, downloadData)
                    : this._separDownload(fillName, downloadData);

            }, { raf: true });
        }

        /* 打包壓縮下載 */
        async _packDownload(compressName, folderName, fillName, data) {
            let
                show,
                extension,
                progress = 0,
                total = data.size;
            const
                self = this,
                titleCache = this.originalTitle();
            const
                fillValue = this._nameAnalysis(FileName.FillValue),
                filler = fillValue[1],
                amount = fillValue[0] == "auto" ? Lib.getFill(total) : fillValue[0];

            // 強制下載
            async function forceDownload() {
                self._compressFile(compressName, titleCache);
            }

            Lib.regMenu({
                [Transl("📥 強制壓縮下載")]: { func: () => forceDownload(), hotkey: "d" }
            }, { name: "Enforce" });

            // 更新請求狀態
            folderName = folderName != "" ? `${folderName}/` : ""; // 處理資料夾名稱格式
            function requestUpdate(index, url, blob, error = false) {
                if (self.forceCompressSignal) return;
                requestAnimationFrame(() => {

                    if (!error && blob instanceof Blob && blob.size > 0) {
                        extension = Lib.suffixName(url); // 雖然 Mantissa 函數可直接傳遞 url 為第四個參數, 但因為需要 isVideo 的資訊, 所以分別操作

                        const fileName = `${fillName.replace("fill", Lib.mantissa(index, amount, filler))}.${extension}`;

                        self.isVideo(extension)
                            ? zipper.file(`${folderName}${(
                                decodeURIComponent(url).split("?f=")[1] ||
                                Lib.$q(`a[href*="${new URL(url).pathname}"]`).$text() ||
                                fileName
                            )}`, blob)
                            : zipper.file(`${folderName}${fileName}`, blob);

                        data.delete(index); // 成功時清除
                    }

                    show = `[${++progress}/${total}]`;
                    Lib.title(show);
                    self.button.$text(`${Transl("下載進度")} ${show}`);

                    if (progress == total) {
                        total = data.size;
                        if (total == 0) {
                            self._compressFile(compressName, titleCache);
                        } else {
                            show = "Wait for failed re download";
                            progress = 0;
                            Lib.title(show);
                            self.button.$text(show);
                            setTimeout(() => {
                                for (const [index, url] of data.entries()) {
                                    self.worker.postMessage({ index: index, url: url });
                                }
                            }, 1500);
                        }
                    }
                });
            }

            // 不使用 worker 的請求, 切換窗口時, 這裡的請求就會變慢
            async function request(index, url) {
                if (self.forceCompressSignal) return;
                GM_xmlhttpRequest({
                    url: url,
                    method: "GET",
                    responseType: "blob",
                    onload: response => {
                        if (response.status == 429) {
                            requestUpdate(index, url, "", true);
                            return;
                        }

                        requestUpdate(index, url, response.response);
                    },
                    onerror: () => {
                        requestUpdate(index, url, "", true);
                    }
                })
            }

            // 只是顯示給使用者讓其知道 有運作 (無實際作用)
            self.button.$text(`${Transl("請求進度")} [${total}/${total}]`);

            // 傳遞消息發起請求
            const batch = General.ConcurrentQuantity;
            const delay = General.ConcurrentDelay;

            for (let i = 0; i < total; i += batch) {
                setTimeout(() => {
                    for (let j = i; j < i + batch && j < total; j++) {
                        this.worker.postMessage({ index: j, url: data.get(j) });
                    }
                }, (i / batch) * delay);
            }

            // 接收消息處理
            this.worker.onmessage = (e) => {
                const { index, url, blob, error } = e.data;
                error
                    ? (request(index, url), Lib.log(url, { dev: General.Dev, group: "Download Failed", collapsed: false })).error
                    : (requestUpdate(index, url, blob), Lib.log(url, { dev: General.Dev, group: "Download Successful", collapsed: false }));
            }
        }

        /* 單圖下載 */
        async _separDownload(fillName, data) {
            let
                show,
                url,
                fileName,
                extension,
                token = 5,
                stop = false,
                progress = 0;
            const
                self = this,
                process = [],
                promises = [],
                total = data.size,
                showTracking = {},
                downloadTracking = {},
                titleCache = this.originalTitle();
            const
                fillValue = this._nameAnalysis(FileName.FillValue),
                filler = fillValue[1],
                amount = fillValue[0] == "auto" ? Lib.getFill(total) : fillValue[0];

            // 停止下載的線程
            async function _stop() {
                stop = true;
                process.forEach(pc => pc.abort())
            }

            Lib.regMenu({
                [Transl("⛔️ 取消下載")]: { func: () => _stop(), hotkey: "s" }
            }, { name: "Abort" });

            async function request(index) {
                if (stop) return;
                url = data.get(index);
                extension = Lib.suffixName(url);

                const FileName = `${fillName.replace("fill", Lib.mantissa(index, amount, filler))}.${extension}`;
                fileName = self.isVideo(extension)
                    ? (
                        decodeURIComponent(url).split("?f=")[1] ||
                        Lib.$q(`a[href*="${new URL(url).pathname}"]`).$text() ||
                        FileName
                    )
                    : FileName;

                return new Promise((resolve, reject) => {

                    const completed = () => {
                        if (!showTracking[index]) { // 多一個判斷是因為, 他有可能同樣的重複呼叫多次
                            showTracking[index] = true;

                            Lib.log(url, { dev: General.Dev, group: "Download Successful", collapsed: false });

                            show = `[${++progress}/${total}]`;
                            Lib.title(show);

                            self.button.$text(`${Transl("下載進度")} ${show}`);
                            resolve();
                        }
                    };

                    const download = GM_download({
                        url,
                        name: fileName,
                        conflictAction: "overwrite",
                        onload: () => {
                            completed();
                        },
                        onprogress: (progress) => {
                            /* 新版本的油猴插件, 這個回條怪怪的
                            Lib.log{
                                Index: index,
                                ImgUrl: url,
                                Progress: `${progress.loaded}/${progress.total}`
                            }, {dev: General.Dev, group: "Download Progress", collapsed: false});

                            downloadTracking[index] = (progress.loaded == progress.total);
                            downloadTracking[index] && completed();
                            */
                        },
                        onerror: () => {
                            Lib.log(url, { dev: General.Dev, group: "Download Error", collapsed: false }).error;
                            setTimeout(() => {
                                reject();

                                token--;
                                if (token <= 0) return;

                                request(index);
                            }, 1500);
                        }
                    });

                    process.push(download);
                });
            }

            for (let i = 0; i < total; i++) {
                promises.push(request(i));
                await Lib.sleep(General.ConcurrentDelay);
            }

            await Promise.allSettled(promises);
            Lib.unMenu("Abort-1");

            Lib.title(`✓ ${titleCache}`);
            this.button.$text(Transl("下載完成"));
            setTimeout(() => {
                this._resetButton();
            }, 3000);
        }

        /* 壓縮檔案 */
        async _compressFile(name, title) {
            this.worker.terminate();
            this.forceCompressSignal = true;

            Lib.unMenu("Enforce-1");
            zipper.generateZip({
                level: 9
            }, (progress) => {
                const display = `${progress.toFixed(1)} %`;
                Lib.title(display);
                this.button.$text(`${Transl("封裝進度")}: ${display}`);
            }).then(zip => {
                saveAs(zip, `${name}.zip`);
                Lib.title(`✓ ${title}`);
                this.button.$text(Transl("下載完成"));

                setTimeout(() => {
                    this._resetButton();
                }, 3000);
            }).catch(result => {
                Lib.title(title);

                const errorShow = Transl("壓縮封裝失敗");
                this.button.$text(errorShow);
                Lib.log(result, { dev: General.Dev, group: errorShow, collapsed: false }).error;

                setTimeout(() => {
                    // ! 如果用戶亂按, 這邊直接解鎖, 可能會導致重複下載
                    Process.Lock = false;
                    this.button.disabled = false;
                    this.button.$text(this.modeDisplay);
                }, 6000);
            })
        }

        /* 按鈕重置 */
        async _resetButton() {
            General.CompleteClose && window.close();

            const modifyButton = (button) => {
                if (!button) return;

                button.disabled = false;
                button.$text(`✓ ${this.modeDisplay}`);
            };

            // ? 使用重新查找, 而不使用 this.button 來修改, 是因為允許中途修改下載模式, 而修改的方式是刪除重建
            // ? 所以可能會有丟失的狀況, 重新查找比較穩定

            if (General.IncludeExtras) {
                // 該模式兩個都需要解鎖
                Lib.$qa(".Download_Button[disabled]").forEach(el => modifyButton(el));
            } else {
                modifyButton(Lib.$q(`#${this.sourceType} .Download_Button[disabled]`));
            }

            // ? 避免有人同時點兩個下載, 一個先好就解鎖, 導致重複下載

            if (Lib.$qa(".Download_Button:not([disabled])").length >= 2) {
                Process.Lock = false;
            }
        }
    }
}