import {
    monkeyWindow,
    GM_setValue,
    GM_getValue,
    GM_download,
    GM_xmlhttpRequest,
    GM_registerMenuCommand,
    GM_unregisterMenuCommand,
} from 'vite-plugin-monkey/dist/client';

import { Config, DConfig } from './config.js';
import { Compressor } from './compression.js';
import words from './language.js';

const { Syn, saveAs, fflate } = monkeyWindow;

(async () => {
    // ! 早期寫的耦合性太高, 難以模組化, 後續很閒時再重構

    const Url = Syn.url.split("?p=")[0];
    const Compression = Compressor(fflate);
    let Lang, OriginalTitle, CompressMode, ModeDisplay;

    function Language() {
        const ML = Syn.TranslMatcher(words);
        return {
            Transl: (Str) => ML[Str] ?? Str
        };
    };

    class DownloadCore {
        constructor(Button) {
            this.Button = Button;
            this.ComicName = null;

            /* 後台請求工作 */
            this.Worker = Syn.WorkerCreation(`
                let queue = [], processing = false;
                onmessage = function(e) {
                    queue.push(e.data);
                    !processing && (processing = true, processQueue());
                }
                async function processQueue() {
                    if (queue.length > 0) {
                        const {index, url, time, delay} = queue.shift();
                        FetchRequest(index, url, time, delay);
                        setTimeout(processQueue, delay);
                    } else {processing = false}
                }
                async function FetchRequest(index, url, time, delay) {
                    try {
                        const response = await fetch(url);
                        const html = await response.text();
                        postMessage({index, url, html, time, delay, error: false});
                    } catch {
                        postMessage({index, url, html, time, delay, error: true});
                    }
                }
            `);

            /* 取得總頁數 */
            this.GetTotal = (page) => Math.ceil(+page[page.length - 2].$text().replace(/\D/g, '') / 20);
            /* 實例化後立即調用 */
            this.GetHomeData();
        };

        /* 按鈕與狀態重置 */
        async Reset() {
            Config.CompleteClose && window.close();
            Config.ResetScope && (DConfig.Scope = false);

            // 切換下載狀態時, 原先的按鈕會被刪除, 所以需要重新找到按鈕
            const Button = Syn.$q("#ExDB");
            DConfig.Lock = false;
            Button.disabled = false;
            Button.$text(`✓ ${ModeDisplay}`);
        };

        /* 獲取主頁連結數據 */
        async GetHomeData() {
            const Name = Syn.NameFilter(Syn.$q("#gj").$text() || Syn.$q("#gn").$text()); // 取得漫畫名稱
            const CacheData = Syn.Session(DConfig.GetKey()); // 嘗試獲取緩存數據
            const ImgSet = Syn.$q("#gdc .ct6"); // 嘗試 取得圖片集 標籤

            DConfig.CurrentDownloadMode = CompressMode; // 將當前下載模式緩存
            this.ComicName = Name; // 將漫畫名稱緩存

            /* 判斷是否為圖片集 (每次下載都可重新設置) */
            if (ImgSet) {
                const yes = confirm(Lang.Transl("檢測到圖片集 !!\n\n是否反轉排序後下載 ?"));
                yes ? (DConfig.SortReverse = true) : (DConfig.SortReverse = false);
            };

            /* 當存在緩存時, 直接啟動下載任務 */
            if (CacheData) {
                this.StartTask(CacheData);
                return;
            };

            /* ----- 數據請求 ----- */

            const Pages = this.GetTotal(Syn.$qa("#gdd td.gdt2")); // 取得總共頁數
            let Delay = DConfig.Home_ID; // 初始延遲

            // 發起請求訊息
            this.Worker.postMessage({ index: 0, url: Url, time: Date.now(), delay: Delay });
            for (let index = 1; index < Pages; index++) {
                this.Worker.postMessage({ index: index, url: `${Url}?p=${index}`, time: Date.now(), delay: Delay });
            };

            // 接收請求訊息
            this.Worker.onmessage = (e) => {
                const { index, url, html, time, delay, error } = e.data;
                Delay = DConfig.Dynamic(time, delay, null, DConfig.Home_ND);
                error
                    ? this.Worker.postMessage({ index: index, url: url, time: time, delay: delay })
                    : GetLink(index, Syn.DomParse(html));
            };

            /* ----- 解析請求數據並保存 ----- */

            const self = this;
            const HomeData = new Map(); // 保存主頁數據
            let Task = 0; // 下載任務進度

            // 獲取連結
            function GetLink(index, page) {
                try {
                    const Cache = [];

                    for (const link of page.$qa("#gdt a")) {
                        Cache.push(link.href);
                    };

                    HomeData.set(index, Cache); // 添加數據
                    DConfig.DisplayCache = `[${++Task}/${Pages}]`;

                    Syn.title(DConfig.DisplayCache);
                    self.Button.$text(`${Lang.Transl("獲取頁面")}: ${DConfig.DisplayCache}`);

                    if (Task === Pages) {
                        const Cache = [];

                        for (let index = 0; index < HomeData.size; index++) {
                            Cache.push(...HomeData.get(index));
                        };

                        const Processed = [...new Set(Cache)]; // 排除重複連結
                        Syn.Log(
                            Lang.Transl("內頁跳轉數據"),
                            `${Name}\n${JSON.stringify(Processed, null, 4)}`, { dev: Config.Dev }
                        );
                        self.GetImageData(Processed); // 處理圖片數據
                    };
                } catch (error) {
                    alert(Lang.Transl("請求錯誤重新加載頁面"));
                    location.reload();
                }
            };
        };

        /* 獲取圖片連結數據 */
        async GetImageData(JumpList) {
            const Pages = JumpList.length; // 取得頁數
            let Delay = DConfig.Image_ID; // 初始延遲
            let Task = 0; // 下載任務進度

            // 發起請求訊息
            for (let index = 0; index < Pages; index++) {
                this.Worker.postMessage({ index, url: JumpList[index], time: Date.now(), delay: Delay });
            };

            // 接收請求訊息
            this.Worker.onmessage = (e) => {
                const { index, url, html, time, delay, error } = e.data;
                Delay = DConfig.Dynamic(time, delay, null, DConfig.Image_ND);
                error
                    ? this.Worker.postMessage({ index: index, url: url, time: time, delay: delay })
                    : GetLink(index, url, Syn.DomParse(html));
            };

            const self = this;
            const ImageData = []; // 保存圖片數據
            function GetLink(index, url, page) {
                try {
                    // ? 這邊不知道為啥 $q 不行, 改用原生的
                    const Resample = page.querySelector("#img");
                    const Original = page.querySelector("#i6 div:last-of-type a")?.href || "#";

                    if (!Resample) { // 處理找不到圖片的錯誤
                        Syn.Log(null, {
                            page, Resample, Original
                        }, { dev: Config.Dev, type: "error" });
                        return;
                    };

                    // 處理圖片連結
                    const Link = Config.Original && !Original.endsWith("#")
                        ? Original : Resample.src || Resample.href;

                    ImageData.push([index, {
                        PageUrl: url,
                        ImageUrl: Link
                    }]);

                    DConfig.DisplayCache = `[${++Task}/${Pages}]`;
                    Syn.title(DConfig.DisplayCache);
                    self.Button.$text(`${Lang.Transl("獲取連結")}: ${DConfig.DisplayCache}`);

                    if (Task === Pages) {
                        ImageData.sort((a, b) => a[0] - b[0]); // 進行排序 (方便範圍設置)
                        const Processed = new Map(ImageData);

                        Syn.Session(DConfig.GetKey(), { value: Processed }); // 緩存數據
                        self.StartTask(Processed);
                    };
                } catch (error) { // 錯誤的直接跳過
                    Syn.Log(null, error, { dev: Config.Dev, type: "error" });
                    Task++;
                }
            };
        };

        /* 重新獲取圖片數據 (試錯) -> [索引, 頁面連結, 圖片連結] */
        ReGetImageData(Index, Url) {
            function GetLink(index, url, page) {
                const Resample = page.$q("#img");
                const Original = page.$q("#i6 div:last-of-type a")?.href || "#";

                if (!Resample) return false;

                const Link = Config.Original && !Original.endsWith("#")
                    ? Original : Resample.src || Resample.href;

                // 索引, 頁面連結, 圖片連結
                return [index, url, Link];
            };

            let Token = Config.ReTry; // 取得試錯次數

            return new Promise((resolve, reject) => {
                this.Worker.postMessage({ index: Index, url: Url, time: Date.now(), delay: DConfig.Image_ID });
                this.Worker.onmessage = (e) => {
                    const { index, url, html, time, delay, error } = e.data;

                    if (Token <= 0) return reject(false); // 真的一直失敗的結束 (應該很難被觸發)

                    if (error) {
                        this.Worker.postMessage({ Index, url: Url, time: time, delay: delay });
                    } else {
                        const result = GetLink(index, url, Syn.DomParse(html));
                        if (result) resolve(result);
                        else {
                            this.Worker.postMessage({ Index, url: Url, time: time, delay: delay });
                        }
                    }

                    Token--;
                };
            });
        };

        /* 任務啟動器 (配置處理) */
        StartTask(DataMap) {
            Syn.Log(
                Lang.Transl("圖片連結數據"),
                `${this.ComicName}\n${JSON.stringify([...DataMap], null, 4)}`, { dev: Config.Dev }
            );

            // 範圍設置
            if (DConfig.Scope) {
                DataMap = new Map(Syn.ScopeParsing(DConfig.Scope, [...DataMap]));
            };

            // 反向排序 (需要再範圍設置後, 才運行反向)
            if (DConfig.SortReverse) {
                const Size = DataMap.size - 1; // 取得真實長度
                DataMap = new Map(
                    [...DataMap.entries()].map(([index, url]) => [Size - index, url]) // 用原始長度 - 索引值 進行反向替換
                );
            };

            Syn.Log(
                Lang.Transl("任務配置"),
                {
                    ReTry: Config.ReTry,
                    Original: Config.Original,
                    ResetScope: Config.ResetScope,
                    CompleteClose: Config.CompleteClose,
                    SortReverse: DConfig.SortReverse,
                    DownloadMode: DConfig.CurrentDownloadMode,
                    CompressionLevel: DConfig.Compr_Level
                },
                { dev: Config.Dev }
            );

            this.Button.$text(Lang.Transl("開始下載"));
            DConfig.CurrentDownloadMode
                ? this.PackDownload(DataMap)
                : this.SingleDownload(DataMap);
        };

        /* 打包壓縮 下載 */
        async PackDownload(Data) {
            const self = this;
            const Zip = new Compression();

            let Total = Data.size;
            const Fill = Syn.GetFill(Total); // 取得填充量

            let Enforce = false; // 判斷強制下載狀態
            let ClearCache = false; // 判斷緩存是否被清除
            let ReTry = Config.ReTry; // 重試次數
            let Task, Progress, Thread, Delay; // 宣告變數

            // 初始化變數
            function Init() {
                Task = 0; // 初始任務數
                Progress = 0; // 初始進度
                Delay = DConfig.Download_ID; // 初始延遲
                Thread = DConfig.Download_IT; // 初始線程數
            };

            // 強制下載
            function Force() {
                if (Total > 0) { // 如果總數 > 0, 代表有下載失敗的數據
                    const SortData = [...Data].sort((a, b) => a[0] - b[0]); // 排序
                    SortData.splice(0, 0, { ErrorPage: SortData.map(item => ++item[0]).join(",") }); // 在 SortData 索引 0 加入 ErrorPage, ++item[0] 是因為使用者設置的範圍, 與數據的索引不同
                    Syn.Log(Lang.Transl("下載失敗數據"), JSON.stringify(SortData, null, 4), { type: "error" });
                };

                Enforce = true; // 強制下載 (實驗性)
                Init(); // 數據初始化
                self.Compression(Zip); // 觸發壓縮
            };

            // 清除緩存
            function RunClear() {
                if (!ClearCache) {
                    ClearCache = true;
                    sessionStorage.removeItem(DConfig.GetKey()); // 清除緩存
                    Syn.Log(Lang.Transl("清理警告"), Lang.Transl("下載數據不完整將清除緩存, 建議刷新頁面後重載"), { type: "warn" });
                }
            };

            // 更新請求狀態 (開始請求時間, 數據的索引, 圖片連結, 圖片數據, 錯誤狀態)
            function StatusUpdate(time, index, iurl, blob, error = false) {
                if (Enforce) return;
                [Delay, Thread] = DConfig.Dynamic(time, Delay, Thread, DConfig.Download_ND); // 動態變更延遲與線程

                DConfig.DisplayCache = `[${++Progress}/${Total}]`;

                // 為了避免移除指向導致的錯誤
                self.Button && (self.Button.$text(`${Lang.Transl("下載進度")}: ${DConfig.DisplayCache}`));
                Syn.title(DConfig.DisplayCache);

                // Todo: 等待調整更完善判斷, 是否下載成功的條件
                if (!error && blob) {
                    Zip.file(`${self.ComicName}/${Syn.Mantissa(index, Fill, "0", iurl)}`, blob); // 保存正確的數據 (有資料夾)
                    Data.delete(index); // 清除完成的任務
                };

                if (Progress === Total) {
                    Total = Data.size; // 再次取得數據量

                    if (Total > 0 && ReTry-- > 0) { // 重試次數足夠

                        DConfig.DisplayCache = Lang.Transl("等待失敗重試...");
                        Syn.title(DConfig.DisplayCache);
                        self.Button.$text(DConfig.DisplayCache);

                        setTimeout(() => { Start(Data, true) }, 2e3); // 等待 2 秒後重新下載
                    } else Force(); // 直接強制壓縮
                } else if (Progress > Total) Init(); // 避免進度超過總數, 當超過時初始化

                --Task; // 完成任務後扣除計數
            };

            // 請求數據
            function Request(Index, Iurl) {
                if (Enforce) return;
                ++Task; // 任務開始計數
                let timeout = null;
                const time = Date.now(); // 請求開始時間

                if (typeof Iurl !== "undefined") {
                    GM_xmlhttpRequest({
                        url: Iurl,
                        timeout: 15000,
                        method: "GET",
                        responseType: "blob",
                        onload: response => {
                            clearTimeout(timeout);

                            if (response.finalUrl !== Iurl && `${response.status}`.startsWith("30")) {
                                Request(Index, response.finalUrl);
                            } else {
                                response.status == 200
                                    ? StatusUpdate(time, Index, Iurl, response.response)
                                    : StatusUpdate(time, Index, Iurl, null, true);
                            }
                        }, onerror: () => {
                            clearTimeout(timeout);
                            StatusUpdate(time, Index, Iurl, null, true);
                        }
                    });
                } else {
                    RunClear();
                    clearTimeout(timeout);
                    StatusUpdate(time, Index, Iurl, null, true);
                }

                timeout = setTimeout(() => {
                    StatusUpdate(time, Index, Iurl, null, true);
                }, 15000);
            };

            // 發起請求任務
            async function Start(DataMap, ReGet = false) {
                if (Enforce) return;
                Init(); // 進行初始化

                for (const [Index, Uri] of DataMap.entries()) {
                    if (Enforce) break;

                    if (ReGet) {
                        Syn.Log(Lang.Transl("重新取得數據"), { Uri: Uri.PageUrl }, { dev: Config.Dev });
                        const Result = await self.ReGetImageData(Index, Uri.PageUrl);
                        Syn.Log(Lang.Transl("取得結果"), { Result: Result }, { dev: Config.Dev });

                        if (Result) {
                            const [Index, Purl, Iurl] = Result;
                            Request(Index, Iurl);
                        } else {
                            RunClear();
                            Request(Index, Uri.ImageUrl);
                        }
                    } else {

                        while (Task >= Thread) { // 根據線程數量暫時卡住迴圈
                            await Syn.Sleep(Delay);
                        }

                        Request(Index, Uri.ImageUrl);
                    }
                }
            };

            Start(Data);
            Syn.Menu({
                [Lang.Transl("📥 強制壓縮下載")]: {
                    func: () => Force(), hotkey: "d"
                }
            }, "Enforce");
        };

        /* 單圖 下載 */
        async SingleDownload(Data) {
            const self = this;

            let Total = Data.size;
            const Fill = Syn.GetFill(Total);
            const TaskPromises = []; // 紀錄任務完成

            let Task = 0;
            let Progress = 0;
            let RetryDelay = 1e3;
            let ClearCache = false;
            let ReTry = Config.ReTry;
            let Delay = DConfig.Download_ID;
            let Thread = DConfig.Download_IT;

            function RunClear() {
                if (!ClearCache) {
                    ClearCache = true;
                    sessionStorage.removeItem(DConfig.GetKey()); // 清除緩存
                    Syn.Log(Lang.Transl("清理警告"), Lang.Transl("下載數據不完整將清除緩存, 建議刷新頁面後重載"), { type: "warn" });
                }
            };

            async function Request(Index, Purl, Iurl, Retry) {
                return new Promise((resolve, reject) => {
                    if (typeof Iurl !== "undefined") {

                        const time = Date.now();
                        ++Task;

                        GM_download({
                            url: Iurl,
                            name: `${self.ComicName}-${Syn.Mantissa(Index, Fill, "0", Iurl)}`,
                            onload: () => {
                                [Delay, Thread] = DConfig.Dynamic(time, Delay, Thread, DConfig.Download_ND);

                                DConfig.DisplayCache = `[${++Progress}/${Total}]`;
                                Syn.title(DConfig.DisplayCache);
                                self.Button && (self.Button.$text(`${Lang.Transl("下載進度")}: ${DConfig.DisplayCache}`));
                                --Task;
                                resolve();
                            },
                            onerror: () => {
                                if (Retry > 0) {
                                    [Delay, Thread] = DConfig.Dynamic(time, Delay, Thread, DConfig.Download_ND);
                                    Syn.Log(null, `[Delay:${Delay}|Thread:${Thread}|Retry:${Retry}] : [${Iurl}]`, { dev: Config.Dev, type: "error" });

                                    --Task;
                                    setTimeout(() => {
                                        self.ReGetImageData(Index, Purl)
                                            .then((data) => {
                                                const [Index, Purl, Iurl] = data;
                                                Request(Index, Purl, Iurl, Retry - 1);
                                                reject();
                                            })
                                            .catch((err) => {
                                                RunClear();
                                                reject();
                                            });
                                    }, RetryDelay += 1e3); // 如果取得數據失敗, 代表資源衝突了, 就需要設置更高的延遲
                                } else {
                                    --Task;
                                    reject(new Error("Request error"));
                                }
                            }
                        });
                    } else {
                        RunClear();
                        reject();
                    }
                });
            };

            /* 發起請求任務 */
            for (const [Index, Uri] of Data.entries()) {

                while (Task >= Thread) {
                    await Syn.Sleep(Delay);
                }

                TaskPromises.push(Request(Index, Uri.PageUrl, Uri.ImageUrl, ReTry));
            };
            await Promise.allSettled(TaskPromises); // 等待任務完成

            this.Button.$text(Lang.Transl("下載完成"));
            this.Button = null; // 避免後續意外, 直接移除指針

            setTimeout(() => {
                Syn.title(`✓ ${OriginalTitle}`);
                this.Reset();
            }, 3000);
        };

        /* 壓縮輸出 */
        async Compression(Zip) {
            const self = this;
            GM_unregisterMenuCommand("Enforce-1"); // 刪除強制下載按鈕

            function ErrorProcess(result) {
                Syn.title(OriginalTitle);

                DConfig.DisplayCache = Lang.Transl("壓縮失敗");
                self.Button.$text(DConfig.DisplayCache);
                Syn.Log(DConfig.DisplayCache, result, { dev: Config.Dev, type: "error", collapsed: false });

                setTimeout(() => {
                    self.Button.disabled = false;
                    self.Button.$text(ModeDisplay);
                    self.Button = null;
                }, 4500);
            };

            if (Object.keys(Zip.files).length == 0) {
                ErrorProcess("無數據可壓縮");
                return;
            };

            Zip.generateZip({
                level: DConfig.Compr_Level
            }, (progress) => {
                DConfig.DisplayCache = `${progress.toFixed(1)} %`;
                Syn.title(DConfig.DisplayCache);
                this.Button.$text(`${Lang.Transl("壓縮進度")}: ${DConfig.DisplayCache}`);
            }).then(zip => {
                saveAs(zip, `${this.ComicName}.zip`);
                Syn.title(`✓ ${OriginalTitle}`);

                this.Button.$text(Lang.Transl("壓縮完成"));
                this.Button = null;

                setTimeout(() => {
                    this.Reset();
                }, 1500);
            }).catch(result => {
                ErrorProcess(result);
            })
        };
    };

    class ButtonCore {
        constructor() {
            this.E = /https:\/\/e-hentai\.org\/g\/\d+\/[a-zA-Z0-9]+/;
            this.Ex = /https:\/\/exhentai\.org\/g\/\d+\/[a-zA-Z0-9]+/;
            this.Allow = (Uri) => this.E.test(Uri) || this.Ex.test(Uri);
            this.InitStyle = () => {
                const Position = `
                    .Download_Button {
                        float: right;
                        width: 12rem;
                        cursor: pointer;
                        font-weight: 800;
                        line-height: 20px;
                        border-radius: 5px;
                        position: relative;
                        padding: 5px 5px;
                        font-family: arial, helvetica, sans-serif;
                    }
                `;

                const E_Style = `
                    .Download_Button {
                    color: #5C0D12;
                    border: 2px solid #9a7c7e;
                    background-color: #EDEADA;
                    }
                    .Download_Button:hover {
                        color: #8f4701;
                        border: 2px dashed #B5A4A4;
                    }
                    .Download_Button:disabled {
                        color: #B5A4A4;
                        border: 2px dashed #B5A4A4;
                        cursor: default;
                    }
                `;

                const Ex_Style = `
                    .Download_Button {
                        color: #b3b3b3;
                        border: 2px solid #34353b;
                        background-color: #2c2b2b;
                    }
                    .Download_Button:hover {
                        color: #f1f1f1;
                        border: 2px dashed #4f535b;
                    }
                    .Download_Button:disabled {
                        color: #4f535b;
                        border: 2px dashed #4f535b;
                        cursor: default;
                    }
                `;

                const Style = Syn.$domain === "e-hentai.org" ? E_Style : Ex_Style;
                Syn.AddStyle(`${Position}${Style}`, "Button-style", false);
            };
        };

        /* 下載模式切換 */
        async DownloadModeSwitch() {
            CompressMode
                ? Syn.sV("CompressedMode", false)
                : Syn.sV("CompressedMode", true);

            Syn.$q("#ExDB").remove();
            this.ButtonCreation();
        };

        /* 下載範圍設置 */
        async DownloadRangeSetting() {
            let scope = prompt(Lang.Transl("範圍設置")) || false;
            if (scope) {
                const yes = confirm(`${Lang.Transl("確認設置範圍")}:\n${scope}`);
                if (yes) DConfig.Scope = scope;
            }
        };

        /* 按鈕創建 */
        async ButtonCreation() {
            Syn.WaitElem("#gd2", null, { raf: true }).then(gd2 => {
                CompressMode = Syn.gV("CompressedMode", []);
                ModeDisplay = CompressMode ? Lang.Transl("壓縮下載") : Lang.Transl("單圖下載");

                const download_button = Syn.createElement(gd2, "button", {
                    id: "ExDB",
                    class: "Download_Button",
                    disabled: DConfig.Lock ? true : false,
                    text: DConfig.Lock ? Lang.Transl("下載中鎖定") : ModeDisplay
                })

                Syn.one(download_button, "click", () => {
                    DConfig.Lock = true;
                    download_button.disabled = true;
                    download_button.$text(Lang.Transl("開始下載"));
                    this.TaskInstance = new DownloadCore(download_button);
                }, { capture: true, passive: true });
            });
        };

        /* 初始化創建 */
        static async Init() {
            const Core = new ButtonCore();
            if (Core.Allow(Url)) {
                Core.InitStyle();
                OriginalTitle = Syn.title();
                Lang = Language();
                Core.ButtonCreation();
                // Todo - 等待添加設置菜單

                if (Syn.Session(DConfig.GetKey())) {
                    const menu = GM_registerMenuCommand(Lang.Transl("🚮 清除數據緩存"), () => {
                        sessionStorage.removeItem(DConfig.GetKey());
                        GM_unregisterMenuCommand(menu);
                    });
                };

                Syn.Menu({
                    [Lang.Transl("🔁 切換下載模式")]: () => Core.DownloadModeSwitch(),
                    [Lang.Transl("⚙️ 下載範圍設置")]: () => Core.DownloadRangeSetting()
                });
            };
        };
    };

    ButtonCore.Init();
})();