import Compressor from './compressor.js';

export default function Downloader(
    GM_unregisterMenuCommand, GM_xmlhttpRequest, GM_download,
    General, FileName, Process, Transl, Syn, saveAs
) {
    let ZipEngine;

    return class Download {
        constructor(compressMode, modeDisplay, button) {
            this.button = button;
            this.modeDisplay = modeDisplay;
            this.compressMode = compressMode;

            this.namedData = null;
            this.forceCompressSignal = false;

            /* 獲取原始標題 */
            this.originalTitle = () => {
                const cache = Syn.title();
                return cache.startsWith("✓ ") ? cache.slice(2) : cache;
            };

            const videoExts = new Set(Process.VideoExts);
            this.isVideo = (str) => videoExts.has(str.replace(/^\./, "").toLowerCase());

            this.worker = this.compressMode ? Syn.WorkerCreation(`
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
            `) : null;
        }

        /* 解析名稱格式 */
        _nameAnalysis(format) {
            if (typeof format == "string") {
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

        /* 下載觸發 [ 查找下載數據, 解析下載資訊, 呼叫下載函數 ] */
        downloadTrigger() { // 下載數據, 文章標題, 作者名稱
            Syn.WaitElem([
                ".post__title, .scrape__title",
                ".post__files, .scrape__files",
                ".post__user-name, .scrape__user-name, fix_name"
            ], found => {
                const [title, files, artist] = found;

                Process.Lock = true;
                this.button.disabled = true;
                const downloadData = new Map();

                this.namedData = { // 建立數據
                    fill: () => "fill",
                    title: () => title.$q("span").$text().replaceAll("/", "／"),
                    artist: () => artist.$text(),
                    source: () => new Date(title.$q(":nth-child(2)").$text()).toLocaleString(),
                    time: () => {
                        if (Process.IsNeko) {
                            return Syn.$q(".timestamp").$text() || "";
                        };

                        let published = Syn.$q(".post__published").$copy();
                        Syn.$q(".post__published");
                        published.firstElementChild.remove();
                        return published.$text().split(" ")[0];
                    }
                }

                const [ // 獲取名稱
                    compressName,
                    folderName,
                    fillName
                ] = Object.keys(FileName).slice(1).map(key => this._nameAnalysis(FileName[key]));

                const // 這種寫法適應於還未完全載入原圖時
                    imgData = [...files.children]
                        .map(child => child.$q(Process.IsNeko ? ".fileThumb, rc, img" : "a, rc, img"))
                        .filter(Boolean),
                    finalData = General.IncludeExtras
                        ? [...imgData, ...Syn.$qa(".post__attachment a:not(.fancy-link), .scrape__attachment a")] // 包含下載附加內容
                        : imgData;

                // 使用 foreach, 他的異步特性可能造成一些意外, 因此使用 for
                for (const [index, file] of finalData.entries()) {
                    const Uri = file.src || file.href || file.$gAttr("src") || file.$gAttr("href");
                    if (Uri) {
                        downloadData.set(index, (
                            Uri.startsWith("http") ? Uri : `${Syn.$origin}${Uri}` // 方便打印觀看
                        ));
                    }
                }

                if (downloadData.size == 0) General.Dev = true; // 如果沒有下載數據, 就顯示開發者模式, 偵錯用

                Syn.Log("Get Data", {
                    FolderName: folderName,
                    DownloadData: downloadData
                }, { dev: General.Dev, collapsed: false });

                this.compressMode
                    ? this._packDownload(compressName, folderName, fillName, downloadData)
                    : this._separDownload(fillName, downloadData);

            }, { raf: true });
        }

        /* 打包壓縮下載 */
        async _packDownload(compressName, folderName, fillName, data) {
            ZipEngine ??= Compressor(Syn);

            let
                show,
                extension,
                progress = 0,
                total = data.size;
            const
                self = this,
                zipper = new ZipEngine(),
                titleCache = this.originalTitle();
            const
                fillValue = this._nameAnalysis(FileName.FillValue),
                filler = fillValue[1],
                amount = fillValue[0] == "auto" ? Syn.GetFill(total) : fillValue[0];

            // 強制下載
            async function forceDownload() {
                self._compressFile(compressName, zipper, titleCache);
            }

            Syn.Menu({
                [Transl("📥 強制壓縮下載")]: { func: () => forceDownload(), hotkey: "d" }
            }, { name: "Enforce" });

            // 更新請求狀態
            folderName = folderName != "" ? `${folderName}/` : ""; // 處理資料夾名稱格式
            function requestUpdate(index, url, blob, error = false) {
                if (self.forceCompressSignal) return;
                requestAnimationFrame(() => {

                    if (!error && blob instanceof Blob && blob.size > 0) {
                        extension = Syn.SuffixName(url); // 雖然 Mantissa 函數可直接傳遞 url 為第四個參數, 但因為需要 isVideo 的資訊, 所以分別操作

                        const fileName = `${fillName.replace("fill", Syn.Mantissa(index, amount, filler))}.${extension}`;

                        self.isVideo(extension)
                            ? zipper.file(`${folderName}${(
                                decodeURIComponent(url).split("?f=")[1] ||
                                Syn.$q(`a[href*="${new URL(url).pathname}"]`).$text() ||
                                fileName
                            )}`, blob)
                            : zipper.file(`${folderName}${fileName}`, blob);

                        data.delete(index); // 成功時清除
                    }

                    show = `[${++progress}/${total}]`;
                    Syn.title(show);
                    self.button.$text(`${Transl("下載進度")} ${show}`);

                    if (progress == total) {
                        total = data.size;
                        if (total == 0) {
                            self._compressFile(compressName, zipper, titleCache);
                        } else {
                            show = "Wait for failed re download";
                            progress = 0;
                            Syn.title(show);
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
                    ? (request(index, url), Syn.Log("Download Failed", url, { dev: General.Dev, type: "error", collapsed: false }))
                    : (requestUpdate(index, url, blob), Syn.Log("Download Successful", url, { dev: General.Dev, collapsed: false }));
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
                amount = fillValue[0] == "auto" ? Syn.GetFill(total) : fillValue[0];

            // 停止下載的線程
            async function _stop() {
                stop = true;
                process.forEach(pc => pc.abort())
            }

            Syn.Menu({
                [Transl("⛔️ 取消下載")]: { func: () => _stop(), hotkey: "s" }
            }, { name: "Abort" });

            async function request(index) {
                if (stop) return;
                url = data.get(index);
                extension = Syn.SuffixName(url);

                const FileName = `${fillName.replace("fill", Syn.Mantissa(index, amount, filler))}.${extension}`;
                fileName = self.isVideo(extension)
                    ? (
                        decodeURIComponent(url).split("?f=")[1] ||
                        Syn.$q(`a[href*="${new URL(url).pathname}"]`).$text() ||
                        FileName
                    )
                    : FileName;

                return new Promise((resolve, reject) => {

                    const completed = () => {
                        if (!showTracking[index]) { // 多一個判斷是因為, 他有可能同樣的重複呼叫多次
                            showTracking[index] = true;

                            Syn.Log("Download Successful", url, { dev: General.Dev, collapsed: false });

                            show = `[${++progress}/${total}]`;
                            Syn.title(show);

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
                            Syn.Log("Download Progress", {
                                Index: index,
                                ImgUrl: url,
                                Progress: `${progress.loaded}/${progress.total}`
                            }, {dev: General.Dev, collapsed: false});

                            downloadTracking[index] = (progress.loaded == progress.total);
                            downloadTracking[index] && completed();
                            */
                        },
                        onerror: () => {
                            Syn.Log("Download Error", url, { dev: General.Dev, type: "error", collapsed: false });
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
                await Syn.Sleep(General.ConcurrentDelay);
            }

            await Promise.allSettled(promises);
            GM_unregisterMenuCommand("Abort-1");

            Syn.title(`✓ ${titleCache}`);
            this.button.$text(Transl("下載完成"));
            setTimeout(() => {
                this._resetButton();
            }, 3000);
        }

        /* 壓縮檔案 */
        async _compressFile(name, data, title) {
            this.worker.terminate();
            this.forceCompressSignal = true;
            GM_unregisterMenuCommand("Enforce-1");
            data.generateZip({
                level: 9
            }, (progress) => {
                const display = `${progress.toFixed(1)} %`;
                Syn.title(display);
                this.button.$text(`${Transl("封裝進度")}: ${display}`);
            }).then(zip => {
                saveAs(zip, `${name}.zip`);
                Syn.title(`✓ ${title}`);
                this.button.$text(Transl("下載完成"));

                setTimeout(() => {
                    this._resetButton();
                }, 3000);
            }).catch(result => {
                Syn.title(title);

                const errorShow = Transl("壓縮封裝失敗");
                this.button.$text(errorShow);
                Syn.Log(errorShow, result, { dev: General.Dev, type: "error", collapsed: false });

                setTimeout(() => {
                    this.button.disabled = false;
                    this.button.$text(this.modeDisplay);
                }, 6000);
            })
        }

        /* 按鈕重置 */
        async _resetButton() {
            General.CompleteClose && window.close();
            Process.Lock = false;
            const button = Syn.$q("#Button-Container button");
            button.disabled = false;
            button.$text(`✓ ${this.modeDisplay}`);
        }
    }
}