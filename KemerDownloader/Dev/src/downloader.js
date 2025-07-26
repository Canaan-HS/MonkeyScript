import Compressor from './compressor.js';

export default function Downloader(
    GM_unregisterMenuCommand, GM_xmlhttpRequest, GM_download,
    General, FileName, Process, Transl, Syn, saveAs
) {
    let Compression;

    return class Download {
        constructor(CompressMode, ModeDisplay, Button) {
            this.Button = Button;
            this.ModeDisplay = ModeDisplay;
            this.CompressMode = CompressMode;
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

                Process.Lock = true;
                this.Button.disabled = true;
                const DownloadData = new Map();

                this.Named_Data = { // 建立數據
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
                    compress_name,
                    folder_name,
                    fill_name
                ] = Object.keys(FileName).slice(1).map(key => this.NameAnalysis(FileName[key]));

                const // 這種寫法適應於還未完全載入原圖時
                    data = [...files.children]
                        .map(child => child.$q(Process.IsNeko ? ".fileThumb, rc, img" : "a, rc, img"))
                        .filter(Boolean),
                    video = Syn.$qa(".post__attachment a, .scrape__attachment a"),
                    final_data = General.ContainsVideo ? [...data, ...video] : data;

                // 使用 foreach, 他的異步特性可能造成一些意外, 因此使用 for
                for (const [index, file] of final_data.entries()) {
                    const Uri = file.src || file.href || file.$gAttr("src") || file.$gAttr("href");
                    if (Uri) {
                        DownloadData.set(index, (
                            Uri.startsWith("http") ? Uri : `${Syn.$origin}${Uri}` // 方便打印觀看
                        ));
                    }
                }

                if (DownloadData.size == 0) General.Dev = true; // 如果沒有下載數據, 就顯示開發者模式, 偵錯用

                Syn.Log("Get Data", {
                    FolderName: folder_name,
                    DownloadData: DownloadData
                }, { dev: General.Dev, collapsed: false });

                this.CompressMode
                    ? this.PackDownload(compress_name, folder_name, fill_name, DownloadData)
                    : this.SeparDownload(fill_name, DownloadData);

            }, { raf: true });
        }

        /* 打包壓縮下載 */
        async PackDownload(CompressName, FolderName, FillName, Data) {
            Compression ??= Compressor(Syn);

            let
                show,
                extension,
                progress = 0,
                Total = Data.size;
            const
                Self = this,
                Zip = new Compression(),
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
            function Request_update(index, url, blob, error = false) {
                if (Self.ForceDownload) return;
                requestAnimationFrame(() => {

                    if (!error && blob instanceof Blob && blob.size > 0) {
                        extension = Syn.ExtensionName(url); // 雖然 Mantissa 函數可直接傳遞 url 為第四個參數, 但因為需要 isVideo 的資訊, 所以分別操作

                        const FileName = `${FillName.replace("fill", Syn.Mantissa(index, Amount, Filler))}.${extension}`;
                        Self.isVideo(extension)
                            ? Zip.file(`${FolderName}${(
                                decodeURIComponent(url).split("?f=")[1] ||
                                Syn.$q(`a[href*="${new URL(url).pathname}"]`).$text() ||
                                FileName
                            )}`, blob)
                            : Zip.file(`${FolderName}${FileName}`, blob);

                        Data.delete(index); // 成功時清除
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

                        Request_update(index, url, response.response);
                    },
                    onerror: () => {
                        Request_update(index, url, "", true);
                    }
                })
            }

            // 只是顯示給使用者讓其知道 有運作 (無實際作用)
            Self.Button.$text(`${Transl("請求進度")} [${Total}/${Total}]`);

            // 傳遞消息發起請求
            const Batch = General.ConcurrentQuantity;
            const Delay = General.ConcurrentDelay;

            for (let i = 0; i < Total; i += Batch) {
                setTimeout(() => {
                    for (let j = i; j < i + Batch && j < Total; j++) {
                        this.worker.postMessage({ index: j, url: Data.get(j) });
                    }
                }, (i / Batch) * Delay);
            }

            // 接收消息處理
            this.worker.onmessage = (e) => {
                const { index, url, blob, error } = e.data;
                error
                    ? (Request(index, url), Syn.Log("Download Failed", url, { dev: General.Dev, type: "error", collapsed: false }))
                    : (Request_update(index, url, blob), Syn.Log("Download Successful", url, { dev: General.Dev, collapsed: false }));
            }
        }

        /* 單圖下載 */
        async SeparDownload(FillName, Data) {
            let
                show,
                url,
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
                url = Data.get(index);
                extension = Syn.ExtensionName(url);

                const FileName = `${FillName.replace("fill", Syn.Mantissa(index, Amount, Filler))}.${extension}`;
                filename = Self.isVideo(extension)
                    ? (
                        decodeURIComponent(url).split("?f=")[1] ||
                        Syn.$q(`a[href*="${new URL(url).pathname}"]`).$text() ||
                        FileName
                    )
                    : FileName;

                return new Promise((resolve, reject) => {

                    const completed = () => {
                        if (!ShowTracking[index]) { // 多一個判斷是因為, 他有可能同樣的重複呼叫多次
                            ShowTracking[index] = true;

                            Syn.Log("Download Successful", url, { dev: General.Dev, collapsed: false });

                            show = `[${++progress}/${Total}]`;
                            Syn.title(show);

                            Self.Button.$text(`${Transl("下載進度")} ${show}`);
                            resolve();
                        }
                    };

                    const download = GM_download({
                        url,
                        name: filename,
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

                            DownloadTracking[index] = (progress.loaded == progress.total);
                            DownloadTracking[index] && completed();
                            */
                        },
                        onerror: () => {
                            Syn.Log("Download Error", url, { dev: General.Dev, type: "error", collapsed: false });
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

        /* 壓縮檔案 */
        async Compression(Name, Data, Title) {
            this.ForceDownload = true;
            GM_unregisterMenuCommand("Enforce-1");
            Data.generateZip({
                level: 9
            }, (progress) => {
                const display = `${progress.toFixed(1)} %`;
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
                Syn.Log(ErrorShow, result, { dev: General.Dev, type: "error", collapsed: false });

                setTimeout(() => {
                    this.Button.disabled = false;
                    this.Button.$text(this.ModeDisplay);
                }, 6000);
            })
        }

        /* 按鈕重置 */
        async ResetButton() {
            General.CompleteClose && window.close();
            Process.Lock = false;
            const Button = Syn.$q("#Button-Container button");
            Button.disabled = false;
            Button.$text(`✓ ${this.ModeDisplay}`);
        }
    }
}