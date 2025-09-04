export default function Downloader(
    GM_xmlhttpRequest, GM_download, Config, DConfig, Transl, Lib, saveAs
) {
    const zipper = Lib.createCompressor(); // 壓縮器
    const dynamicParam = Lib.createNnetworkObserver({ // 網路監視器
        MAX_Delay: DConfig.MAX_Delay,
        MIN_CONCURRENCY: DConfig.MIN_CONCURRENCY,
        MAX_CONCURRENCY: DConfig.MAX_CONCURRENCY,
        Good_Network_THRESHOLD: 500,
        Poor_Network_THRESHOLD: 1500,
    });

    // 計算總頁數
    const getTotal = (page) => Math.ceil(+page[page.length - 2].$text().replace(/\D/g, '') / 20);

    return (url, button) => {
        let comicName = null;

        /* 後台請求工作 */
        const worker = Lib.workerCreate(`
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
                    postMessage({index, url, html: null, time, delay, error: true});
                }
            }
        `);

        getHomeData(); // 開始查找工作

        /* 重置所有狀態 */
        async function reset() {
            Config.CompleteClose && window.close();
            Config.ResetScope && (DConfig.Scope = false);

            worker.terminate(); // 清理後台請求工作

            // 切換下載狀態時, 原先的按鈕會被刪除, 所以需要重新找到按鈕
            button = Lib.$q("#ExDB");
            button.disabled = false;
            button.$text(`✓ ${DConfig.ModeDisplay}`);

            DConfig.Lock = false;
        };

        /* 獲取主頁連結數據 */
        async function getHomeData() {
            comicName = Lib.nameFilter(Lib.$q("#gj").$text() || Lib.$q("#gn").$text()); // 取得漫畫名稱

            const ct6 = Lib.$q("#gdc .ct6"); // 嘗試 取得圖片集 標籤
            const cacheData = Lib.session(DConfig.GetKey()); // 嘗試獲取緩存數據

            /* 判斷是否為圖片集 (每次下載都可重新設置) */
            if (ct6) {
                const yes = confirm(Transl("檢測到圖片集 !!\n\n是否反轉排序後下載 ?"));
                DConfig.SortReverse = yes ? true : false;
            };

            /* 當存在緩存時, 直接啟動下載任務 */
            if (cacheData) {
                startTask(cacheData);
                return;
            };

            /* ----- 數據請求 ----- */

            const pages = getTotal(Lib.$qa("#gdd td.gdt2")); // 取得總共頁數

            // 接收訊息
            worker.onmessage = (e) => {
                const { index, url, html, time, delay, error } = e.data;
                error
                    ? worker.postMessage({
                        index, url, time,
                        delay: dynamicParam(time, delay, null, DConfig.Home_ND)
                    })
                    : parseLink(index, Lib.domParse(html));
            };

            // 發起請求
            const delay = DConfig.Home_ID; // 初始延遲
            worker.postMessage({ index: 0, url, time: Date.now(), delay });
            for (let index = 1; index < pages; index++) {
                worker.postMessage({ index, url: `${url}?p=${index}`, time: Date.now(), delay });
            };

            let task = 0; // 下載任務進度
            let processed = new Set(); // 排除重複
            const homeData = new Map(); // 保存主頁數據
            function parseLink(index, page) {
                try {
                    const box = [];

                    for (const link of page.$qa("#gdt a")) {
                        const href = link.href;
                        if (processed.has(href)) continue;
                        processed.add(href);
                        box.push(href);
                    };

                    // 添加數據
                    homeData.set(index, box);

                    const display = `[${++task}/${pages}]`;
                    Lib.title(display);
                    button.$text(`${Transl("獲取頁面")}: ${display}`);

                    if (task === pages) {
                        const box = [];

                        // 按照 index 排序 (異步請求 添加順序不固定)
                        for (let index = 0; index < homeData.size; index++) {
                            box.push(...homeData.get(index));
                        };

                        homeData.clear();
                        processed.clear();

                        Lib.log(
                            Transl("內頁跳轉數據"),
                            `${comicName}\n${JSON.stringify(box, null, 4)}`, { dev: Config.Dev }
                        );

                        getImageData(box); // 處理圖片數據
                    };
                } catch (error) {
                    alert(Transl("請求錯誤重新加載頁面"));
                    location.reload();
                }
            };

        };

        /* 獲取圖片連結數據 */
        async function getImageData(homeDataList) {
            const pages = homeDataList.length; // 取得頁數

            // 接收請求訊息
            worker.onmessage = (e) => {
                const { index, url, html, time, delay, error } = e.data;
                error
                    ? worker.postMessage({
                        index, url, time,
                        delay: dynamicParam(time, delay, null, DConfig.Image_ND)
                    })
                    : parseLink(index, url, Lib.domParse(html));
            };

            // 發起請求訊息
            for (const [index, url] of homeDataList.entries()) {
                worker.postMessage({ index, url, time: Date.now(), delay: DConfig.Image_ID });
            };

            let task = 0; // 下載任務進度
            const imgData = []; // 保存圖片數據
            function parseLink(index, url, page) {
                try {
                    // 獲取 取樣 元素 與 原圖 連結
                    const resample = Lib.$Q(page, "#img");
                    const original = Lib.$Q(page, "#i6 div:last-of-type a")?.href || "#";

                    if (!resample) { // 處理找不到圖片的錯誤
                        Lib.log(null, {
                            page, resample, original
                        }, { dev: Config.Dev, type: "error" });

                        throw new Error("Image not found");
                    };

                    // 處理圖片連結
                    const link = Config.Original && !original.endsWith("#")
                        ? original : resample.src || resample.href;

                    imgData.push({ Index: index, PageUrl: url, ImgUrl: link });

                    const display = `[${++task}/${pages}]`;
                    Lib.title(display);
                    button.$text(`${Transl("獲取連結")}: ${display}`);

                    if (task === pages) {
                        imgData.sort((a, b) => a.Index - b.Index); // 排序

                        Lib.session(DConfig.GetKey(), { value: imgData }); // 緩存數據
                        startTask(imgData);
                    };
                } catch (error) { // 錯誤的直接跳過
                    Lib.log(null, error, { dev: Config.Dev, type: "error" });
                    task++;
                }
            };

        };

        /* 重新獲取圖片數據 (試錯) -> {索引, 頁面連結, 圖片連結} */
        function reGetImageData(index, url) {
            function parseLink(index, url, page) {
                const resample = Lib.$Q(page, "#img");
                const original = Lib.$Q(page, "#i6 div:last-of-type a")?.href || "#";

                if (!resample) return false;

                const link = Config.Original && !original.endsWith("#")
                    ? original : resample.src || resample.href;

                // 索引, 頁面連結, 圖片連結
                return { Index: index, PageUrl: url, ImgUrl: link };
            };

            let token = Config.ReTry; // 取得試錯次數
            return new Promise(resolve => {
                worker.postMessage({ index, url, time: Date.now(), delay: DConfig.Image_ID });
                worker.onmessage = (e) => {
                    const { index, url, html, time, delay, error } = e.data;

                    if (token <= 0) return resolve(false);

                    if (error) {
                        worker.postMessage({ index, url, time, delay });
                    } else {
                        const result = parseLink(index, url, Lib.domParse(html));
                        if (result) resolve(result);
                        else {
                            worker.postMessage({ index, url, time, delay });
                        }
                    }

                    token--;
                }
            })
        };

        /* 任務啟動器 (配置處理) */
        function startTask(dataList) {
            Lib.log(
                Transl("圖片連結數據"),
                `${comicName}\n${JSON.stringify(dataList, null, 4)}`, { dev: Config.Dev }
            );

            // 範圍設置
            if (DConfig.Scope) {
                dataList = Lib.scopeParse(DConfig.Scope, dataList);
            };

            // 反向排序 (需要再範圍設置後, 才運行反向)
            if (DConfig.SortReverse) {
                const size = dataList.length - 1; // 取得真實長度
                dataList = dataList.map((data, index) => ({ ...data, Index: size - index }));
            };

            const dataMap = new Map(dataList.map(data => [data.Index, data])); // 轉換成 Map
            button.$text(Transl("開始下載"));

            Lib.log(
                Transl("任務配置"),
                {
                    ReTry: Config.ReTry,
                    Original: Config.Original,
                    ResetScope: Config.ResetScope,
                    CompleteClose: Config.CompleteClose,
                    SortReverse: DConfig.SortReverse,
                    CompressMode: DConfig.CompressMode,
                    CompressionLevel: DConfig.Compress_Level,
                    DownloadData: dataMap
                },
                { dev: Config.Dev }
            );

            DConfig.CompressMode
                ? packDownload(dataMap)
                : singleDownload(dataMap);
        };

        /* 壓縮下載 */
        async function packDownload(dataMap) {

            let totalSize = dataMap.size;
            const fillValue = Lib.getFill(totalSize); // 取得填充量

            let enforce = false; // 判斷強制下載狀態
            let clearCache = false; // 判斷緩存是否被清除
            let reTry = Config.ReTry; // 重試次數

            let task, progress, $thread, $delay; // 宣告變數

            // 初始化變數
            function init() {
                task = 0; // 初始任務數
                progress = 0; // 初始進度
                $delay = DConfig.Download_ID; // 初始延遲
                $thread = DConfig.Download_IT; // 初始線程數
            };

            // 強制下載
            function force() {
                if (totalSize > 0) { // 如果總數 > 0, 代表有下載失敗的數據
                    const sortData = [...dataMap].sort((a, b) => a.Index - b.Index); // 排序
                    sortData.splice(0, 0, { ErrorPage: sortData.map(([_, value]) => value.Index + 1).join(",") });
                    Lib.log(Transl("下載失敗數據"), JSON.stringify(sortData, null, 4), { type: "error" });
                };

                enforce = true; // 強制下載 (實驗性)
                init(); // 數據初始化
                compressFile(); // 觸發壓縮
            };

            // 清除緩存
            function runClear() {
                if (!clearCache) {
                    clearCache = true;
                    sessionStorage.removeItem(DConfig.GetKey()); // 清除緩存
                    Lib.log(Transl("清理警告"), Transl("下載數據不完整將清除緩存, 建議刷新頁面後重載"), { type: "warn" });
                }
            };

            // 更新請求狀態 (開始請求時間, 數據的索引, 圖片連結, 圖片數據, 錯誤狀態)
            function statusUpdate(time, index, iurl, blob, error = false) {
                if (enforce) return;
                [$delay, $thread] = dynamicParam(time, $delay, $thread, DConfig.Download_ND); // 動態變更延遲與線程

                const display = `[${Math.min(++progress, totalSize)}/${totalSize}]`;

                // 為了避免移除指向導致的錯誤
                button?.$text(`${Transl("下載進度")}: ${display}`);
                Lib.title(display);

                // Todo: 等待調整更完善判斷, 是否下載成功的條件
                if (!error && blob) {
                    zipper.file(`${comicName}/${Lib.mantissa(index, fillValue, "0", iurl)}`, blob); // 保存正確的數據 (有資料夾)
                    dataMap.delete(index); // 清除完成的任務
                };

                if (progress === totalSize) {
                    totalSize = dataMap.size; // 再次取得數據量

                    if (totalSize > 0 && reTry-- > 0) { // 重試次數足夠

                        const display = Transl("等待失敗重試...");
                        Lib.title(display);
                        button.$text(display);

                        setTimeout(() => { start(dataMap, true) }, 2e3); // 等待 2 秒後重新下載
                    } else force(); // 直接強制壓縮
                }

                --task; // 完成任務後扣除計數
            };

            // 請求數據
            function request(index, iurl) {
                if (enforce) return;
                ++task; // 任務開始計數
                let timeout = null;
                const time = Date.now(); // 請求開始時間

                if (typeof iurl !== "undefined") {
                    GM_xmlhttpRequest({
                        url: iurl,
                        timeout: 15000,
                        method: "GET",
                        responseType: "blob",
                        onload: response => {
                            clearTimeout(timeout);

                            if (response.finalUrl !== iurl && `${response.status}`.startsWith("30")) {
                                request(index, response.finalUrl);
                            } else {
                                response.status == 200
                                    ? statusUpdate(time, index, iurl, response.response)
                                    : statusUpdate(time, index, iurl, null, true);
                            }
                        }, onerror: () => {
                            clearTimeout(timeout);
                            statusUpdate(time, index, iurl, null, true);
                        }
                    });
                } else {
                    runClear();
                    clearTimeout(timeout);
                    statusUpdate(time, index, iurl, null, true);
                }

                timeout = setTimeout(() => {
                    statusUpdate(time, index, iurl, null, true);
                }, 15000);
            };

            // 發起請求任務
            async function start(dataMap, reGet = false) {
                if (enforce) return;
                init(); // 進行初始化

                for (const { Index, PageUrl, ImgUrl } of dataMap.values()) {
                    if (enforce) break;

                    if (reGet) {
                        Lib.log(`${Transl("重新取得數據")} (${reTry})`, { Uri: PageUrl }, { dev: Config.Dev });
                        const result = await reGetImageData(Index, PageUrl);
                        Lib.log(`${Transl("取得結果")} (${reTry})`, { Result: result }, { dev: Config.Dev });

                        if (result) {
                            const { Index, ImgUrl } = result;
                            request(Index, ImgUrl);
                        } else {
                            runClear();
                            request(Index, ImgUrl);
                        }
                    } else {

                        while (task >= $thread) { // 根據線程數量暫時卡住迴圈
                            await Lib.sleep($delay);
                        }

                        request(Index, ImgUrl);
                    }
                }
            };

            start(dataMap);
            Lib.regMenu({
                [Transl("📥 強制壓縮下載")]: () => force()
            }, { name: "Enforce" });
        };

        /* 壓縮檔案 */
        async function compressFile() {
            Lib.unMenu("Enforce-1");
            zipper.generateZip({
                level: DConfig.Compress_Level
            }, progress => {
                const display = `${progress.toFixed(1)} %`;
                Lib.title(display);
                button.$text(`${Transl("壓縮進度")}: ${display}`);
            }).then(zip => {
                saveAs(zip, `${comicName}.zip`);
                Lib.title(`✓ ${DConfig.TitleCache}`);

                button.$text(Transl("壓縮完成"));
                button = null;

                setTimeout(() => {
                    reset();
                }, 1500);
            }).catch(result => {
                Lib.title(DConfig.TitleCache);

                const display = Transl("壓縮失敗");
                button.$text(display);
                Lib.log(display, result, { dev: Config.Dev, type: "error", collapsed: false });

                setTimeout(() => {
                    button.disabled = false;
                    button.$text(DConfig.ModeDisplay);
                    button = null;
                }, 4500);
            });
        };

        /* 單圖下載 */
        async function singleDownload(dataMap) {
            let totalSize = dataMap.size;
            const fillValue = Lib.getFill(totalSize);
            const taskPromises = []; // 紀錄任務完成

            let task = 0;
            let progress = 0;
            let retryDelay = 1e3;
            let clearCache = false;
            let reTry = Config.ReTry;
            let $delay = DConfig.Download_ID;
            let $thread = DConfig.Download_IT;

            function runClear() {
                if (!clearCache) {
                    clearCache = true;
                    sessionStorage.removeItem(DConfig.GetKey()); // 清除緩存
                    Lib.log(Transl("清理警告"), Transl("下載數據不完整將清除緩存, 建議刷新頁面後重載"), { type: "warn" });
                }
            };

            async function request(index, purl, iurl, retry) {
                return new Promise((resolve, reject) => {
                    if (typeof iurl !== "undefined") {

                        const time = Date.now();
                        ++task;

                        GM_download({
                            url: iurl,
                            name: `${comicName}-${Lib.mantissa(index, fillValue, "0", iurl)}`,
                            onload: () => {
                                [$delay, $thread] = dynamicParam(time, $delay, $thread, DConfig.Download_ND);

                                const display = `[${++progress}/${totalSize}]`;
                                Lib.title(display);
                                button?.$text(`${Transl("下載進度")}: ${display}`);

                                --task;
                                resolve();
                            },
                            onerror: () => {
                                if (retry > 0) {
                                    [$delay, $thread] = dynamicParam(time, $delay, $thread, DConfig.Download_ND);
                                    Lib.log(null, `[Delay:${$delay}|Thread:${$thread}|Retry:${retry}] : [${iurl}]`, { dev: Config.Dev, type: "error" });

                                    --task;
                                    setTimeout(() => {
                                        reGetImageData(index, purl)
                                            .then(({ Index, PageUrl, ImgUrl }) => {
                                                request(Index, PageUrl, ImgUrl, retry - 1);
                                                reject();
                                            })
                                            .catch((err) => {
                                                runClear();
                                                reject();
                                            });
                                    }, retryDelay += 1e3); // 如果取得數據失敗, 代表資源衝突了, 就需要設置更高的延遲
                                }
                                else {
                                    --task;
                                    reject(new Error("request error"));
                                }
                            }
                        });
                    } else {
                        runClear();
                        reject();
                    }
                });
            };

            /* 發起請求任務 */
            for (const { Index, PageUrl, ImgUrl } of dataMap.values()) {

                while (task >= $thread) {
                    await Lib.sleep($delay);
                };

                taskPromises.push(request(Index, PageUrl, ImgUrl, reTry));
            };

            await Promise.allSettled(taskPromises); // 等待任務完成

            button.$text(Transl("下載完成"));
            button = null; // 避免後續意外, 直接移除指針

            setTimeout(() => {
                Lib.title(`✓ ${DConfig.TitleCache}`);
                reset();
            }, 3000);
        };
    }
}