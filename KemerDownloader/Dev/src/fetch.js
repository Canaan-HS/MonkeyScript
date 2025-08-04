export default function Fetch(
    General, FetchSet, Process, Transl, Lib, md5
) {
    return class FetchData {
        static Try_Again_Promise = null;

        constructor() {
            this.metaDict = new Map(); // 保存元數據
            this.dataDict = new Map(); // 保存最終數據

            this.sourceURL = Lib.url; // 原始連結
            this.titleCache = Lib.title();

            this.URL = new URL(this.sourceURL); // 解析連結

            this.host = this.URL.host;
            this.firstURL = this.URL.origin + this.URL.pathname; // 第一頁連結
            this.queryValue = this.URL.search;

            if (this.queryValue === "") { // 有時候會出現空的搜尋關鍵字
                this.URL.searchParams.delete("q");
                this.sourceURL = this.URL.href;
            }

            this.currentPage = 1; // 預設開始抓取的頁數
            this.finalPage = 1; // 預設最終抓取的頁數
            this.totalPages = 0; // 總頁數
            this.progress = 0; // 用於顯示當前抓取進度
            this.onlyMode = false; // 判斷獲取數據的模式
            this.fetchDelay = FetchSet.Delay; // 獲取延遲
            this.toLinkTxt = FetchSet.ToLinkTxt; // 判斷是否輸出為連結文本
            this.advancedFetch = FetchSet.AdvancedFetch; // 判斷是否往內抓數據

            // 帖子內部連結
            this.getPostURL = id => `${this.firstURL}/post/${id}`;

            // 下一頁連結
            this.getNextPageURL = urlStr => {
                const url = new URL(urlStr);
                const search = url.searchParams;

                const q = search.get("q");
                let o = search.get("o");

                o = o ? +o + 50 : 50;

                const params = q ? `?o=${o}&q=${q}` : `?o=${o}`;
                return `${url.origin}${url.pathname}${params}`;
            };


            // 內部連結的 API 模板
            this.postAPI = `${this.firstURL}/post`.replace(this.host, `${this.host}/api/v1`);

            // 將預覽頁面轉成 API 連結
            this.getPreviewAPI = url =>
                /[?&]o=/.test(url)
                    ? url.replace(this.host, `${this.host}/api/v1`).replace(/([?&]o=)/, "/posts-legacy$1")
                    : this.queryValue // 如果有搜尋關鍵字
                        ? url.replace(this.host, `${this.host}/api/v1`).replace(this.queryValue, `/posts-legacy${this.queryValue}`)
                        : url.replace(this.host, `${this.host}/api/v1`) + "/posts-legacy";

            // 根據類型判斷有效值
            this.getValidValue = (value) => {
                if (!value) return null;

                const type = Lib.$type(value);
                if (type === "Array") return value.length > 0 && value.some(item => item !== "") ? value : null;
                if (type === "Object") {
                    const values = Object.values(value);
                    return values.length > 0 && values.some(item => item !== "") ? value : null;
                }

                return value;
            };

            // 預設添加的數據
            this.infoRules = new Set(["PostLink", "Timestamp", "TypeTag", "ImgLink", "VideoLink", "DownloadLink"]);

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
            this.fetchGenerate = (Data) => {
                return Object.keys(Data).reduce((acc, key) => {
                    if (this.infoRules.has(key)) {
                        const value = this.getValidValue(Data[key]);
                        value && (acc[Transl(key)] = value); // 有數據的才被添加
                    }
                    return acc;
                }, {});
            };

            // 將數據類型表轉為 Set
            const videoExts = new Set(Process.VideoExts);
            const imageExts = new Set(Process.ImageExts);

            this.isVideo = (str) => videoExts.has(str.replace(/^\./, "").toLowerCase());
            this.isImage = (str) => imageExts.has(str.replace(/^\./, "").toLowerCase());

            // 正規化帖子標題名稱 (傳入 Post 標題 (string), 與列表 Index (number))
            this.normalizeName = (title, index) => title.trim().replace(/\n/g, " ") || `Untitled_${String(((this.currentPage - 1) * 50) + (index + 1)).padStart(2, "0")}`;

            // 正規化帖子時間戳 (傳入 Post 的物件)
            this.normalizeTimestamp = (post) => new Date(post.published || post.added)?.toLocaleString();

            // 適用 kemono 和 coomer 的分類 (data = api 文件數據, serverDict = api 伺服器字典, fillValue = 填充數字的位數)
            this.kemerCategorize = ({ title, data, serverDict, fillValue }) => {
                let imgNumber = 0;

                return data.reduce((acc, file) => {
                    const name = file.name;
                    const path = file.path;
                    const extension = Lib.suffixName(path, "");

                    // 如果有伺服器字典, 是非進階抓取模式
                    const server = serverDict ? `${serverDict[path]}/data` : `${file.server}/data`;
                    const url = `${server}${path}`;

                    if (this.isVideo(extension)) {
                        acc.video[name] = `${url}?f=${name}`;
                    } else if (this.isImage(extension)) {
                        const name = `${title}_${String(++imgNumber).padStart(fillValue, "0")}.${extension}`;
                        acc.img[name] = `${url}?f=${name}`;
                    } else {
                        acc.other[name] = `${url}?f=${name}`;
                    }

                    return acc;
                }, { img: {}, video: {}, other: {} });
            };

            // 用於被多層編碼的字串
            this.deepDecodeURIComponent = (str) => {
                let prev = str;
                let curr = decodeURIComponent(prev);

                while (curr !== prev) {
                    prev = curr;
                    curr = decodeURIComponent(prev);
                }

                return curr;
            };

            // 適用 nekohouse 的分類 (data = 連結元素 Array)
            this.nekoCategorize = (title, data) => {
                let imgNumber = 0;

                return data.reduce((acc, file) => {
                    const uri = file.src || file.href || file.$gAttr("src") || file.$gAttr("href");

                    if (uri) {
                        const extension = Lib.suffixName(uri, "");
                        const url = uri.startsWith("http") ? uri : `${Lib.$origin}${uri}`;

                        const getDownloadName = (link) => this.deepDecodeURIComponent(
                            link.download?.trim() || link.$text()
                        );

                        // ? 影片不支援 filename= IDM 解碼, 該網站本身沒有 Content-Disposition
                        if (this.isVideo(extension)) {
                            acc.video[getDownloadName(file)] = url;
                        } else if (this.isImage(extension)) {
                            const name = `${title}_${String(++imgNumber).padStart(2, "0")}.${extension}`;
                            acc.img[name] = `${url}?filename=${name}`;
                        } else {
                            const name = getDownloadName(file);
                            acc.other[name] = `${url}?filename=${name}`;
                        }
                    }

                    return acc;
                }, { video: {}, img: {}, other: {} });
            };

            // 解析特別連結
            this.specialLinkParse = (data) => {
                const Cache = {};

                try {
                    for (const a of Lib.domParse(data).$qa("body a")) {
                        const href = a.href;
                        const hash = md5(href).slice(0, 16);

                        if (href.startsWith("https://mega.nz")) {

                            let name = (a.previousElementSibling?.$text().replace(":", "") || hash);
                            if (name === "") continue;

                            let pass = "";
                            const nextNode = a.nextElementSibling;

                            if (nextNode) {
                                const nodeText = [...nextNode.childNodes].find(node => node.nodeType === Node.TEXT_NODE)?.$text() ?? "";
                                if (nodeText.startsWith("Pass")) {
                                    pass = nodeText.match(/Pass:([^<]*)/)?.[1]?.trim() ?? "";
                                }
                            };

                            Cache[name] = pass ? {
                                [Transl("密碼")]: pass,
                                [Transl("連結")]: href
                            } : href;
                        } else if (href) {
                            const description = a.previousSibling?.$text() ?? "";
                            const name = `${description} ${a?.$text()}`.trim();
                            Cache[name ? name : hash] = href;
                        }
                    };
                } catch (error) {
                    Lib.log("Error specialLinkParse", error, { dev: General.Dev, type: "error", collapsed: false });
                }

                return Cache;
            };

            // ! 目前有 Bug, 只能使用一次, 第二次後 response 的狀態直接都變成 200, 但實際上是 429
            this.TooMany_TryAgain = function (url) {
                if (FetchData.Try_Again_Promise) {
                    return FetchData.Try_Again_Promise;
                }

                const promiseLock = new Promise(async (resolve, reject) => {
                    const sleepTime = 5e3;
                    const timeout = 20e4;

                    const checkRequest = async () => {
                        const controller = new AbortController();
                        const signal = controller.signal;
                        const timeoutId = setTimeout(() => controller.abort(), timeout);

                        try {
                            const response = await fetch(url, {
                                method: "HEAD",
                                signal: signal,
                                cache: 'no-store'
                            });

                            clearTimeout(timeoutId);
                            if (response.status === 429 || response.status === 503) {
                                await Lib.sleep(sleepTime);
                                await checkRequest();
                            } else if (response.status === 200) {
                                resolve(response);
                            }
                        } catch (err) {
                            // 發生網路錯誤也重試
                            clearTimeout(timeoutId);
                            await Lib.sleep(sleepTime);
                            await checkRequest();
                        }
                    };

                    await checkRequest();
                });

                FetchData.Try_Again_Promise = promiseLock;

                promiseLock.finally(() => {
                    if (FetchData.Try_Again_Promise === promiseLock) {
                        FetchData.Try_Again_Promise = null;
                    }
                });

                return promiseLock;
            };

            // 請求工作
            this.worker = Lib.workerCreate(`
                let queue = [], processing=false;
                onmessage = function(e) {
                    queue.push(e.data);
                    !processing && (processing=true, processQueue());
                }
                async function processQueue() {
                    if (queue.length > 0) {
                        const {index, title, url, time, delay} = queue.shift();
                        FetchRequest(index, title, url, time, delay);
                        processQueue();
                    } else {processing = false}
                }
                async function FetchRequest(index, title, url, time, delay) {
                    fetch(url).then(response => {
                        if (response.ok) {
                            // 目前不同網站不一定都是 Json, 所以這裡用 text()
                            response.text().then(content => {
                                postMessage({ index, title, url, content, time, delay, error: false });
                            });
                        } else {
                            postMessage({ index, title, url, content: "", time, delay, error: true });
                        }
                    })
                    .catch(error => {
                        postMessage({ index, title, url, content: "", time, delay, error: true });
                    });
                }
            `);

            // 設置抓取規則
            FetchSet.UseFormat && this._fetchConfig(FetchSet.Mode, FetchSet.Format);
        }

        /**
         * 設置抓取規則
         * @param {string} mode - "FilterMode" | "OnlyMode"
         * @param {Array} userSet - 要進行的設置
         *
         * @example
         * 可配置項目: ["PostLink", "Timestamp", "TypeTag", "ImgLink", "VideoLink", "DownloadLink"]
         *
         * 這會將這些項目移除在顯示
         * _fetchConfig("FilterMode", ["PostLink", "ImgLink", "DownloadLink"]);
         *
         * 這會只顯示這些項目
         * _fetchConfig("OnlyMode", ["PostLink", "ImgLink", "DownloadLink"]);
         */
        async _fetchConfig(mode = "FilterMode", userSet = []) {
            if (!mode || typeof mode !== "string" || !Array.isArray(userSet)) return;

            if (mode.toLowerCase() === "filtermode") {
                this.onlyMode = false;
                userSet.forEach(key => this.infoRules.delete(key));
            } else if (mode.toLowerCase() === "onlymode") {
                this.onlyMode = true;
                const userFilter = new Set(userSet);
                this.infoRules = new Set(
                    [...this.infoRules].filter(key => userFilter.has(key))
                );
            }
        };

        /* 入口調用函數 */
        async fetchRun() {
            const small = Lib.$q("small");
            const items = Lib.$q(".card-list__items");

            if (items) {
                Process.Lock = true; // 鎖定菜單的操作, 避免重複抓取

                // 取得當前頁數
                const currentPage = +Lib.$q(".pagination-button-current b")?.$text();
                currentPage && (this.currentPage = currentPage);

                // ! 實驗性獲取總頁數
                if (small) {
                    this.totalPages = +small.$text().split(" of ")[1] || 0;
                    this.finalPage = Math.max(Math.ceil(this.totalPages / 50), 1);
                }

                this._fetchPage(items, this.sourceURL); // 開始抓取
            } else {
                alert(Transl("未取得數據"));
            }
        };

        /* 測試進階抓取數據 */
        async fetchTest(id) {
            Process.Lock = true;

            this.worker.postMessage({ index: 0, title: this.titleCache, url: this.getPreviewAPI(this.firstURL) });
            const homeData = await new Promise((resolve, reject) => {
                this.worker.onmessage = async (e) => {
                    const { index, title, url, content, error } = e.data;
                    if (!error) resolve({ url, content });
                    else {
                        Lib.log(error, { title, url }, { dev: General.Dev, type: "error", collapsed: false });
                        await this.TooMany_TryAgain(url);
                        this.worker.postMessage({ index, title, url });
                    };
                }
            });

            const { content } = homeData;

            Object.assign(homeData, { content: JSON.parse(content) });
            Lib.log("HomeData", homeData, { collapsed: false });

            // 恢復 _fetchContent 處理數據格式
            const homeDataClone = structuredClone(homeData);
            homeDataClone.content.results = [{ id }]; // 修改數據
            homeDataClone.content = JSON.stringify(homeDataClone.content); // 轉換為字符串

            await this._fetchContent(homeDataClone);
            Lib.log("PostDate", this.dataDict, { collapsed: false });
            this._reset();
        };

        /* ===== 主要抓取函數 ===== */

        /* 獲取預覽頁數據 */
        async _fetchPage(items, url) {

            if (Process.IsNeko) {

                if (!items) { // 第二輪開始 只會得到 url
                    this.worker.postMessage({ index: 0, title: this.titleCache, url, time: Date.now(), delay: this.fetchDelay });

                    const homeData = await new Promise((resolve, reject) => {
                        this.worker.onmessage = async (e) => {
                            const { index, title, url, content, time, delay, error } = e.data;
                            if (!error) {
                                this.fetchDelay = Process.dynamicParam(time, delay);
                                resolve(content);
                            }
                            else {
                                Lib.log(error, { title, url }, { dev: General.Dev, type: "error", collapsed: false });
                                await this.TooMany_TryAgain(url);
                                this.worker.postMessage({ index, title, url, time, delay });
                            };
                        }
                    });

                    items = Lib.domParse(homeData)?.$q(".card-list__items");
                };

                if (items) { // ? 避免可能的意外
                    const article = items.$qa("article");

                    const content = article.map((item, index) => ({ // 獲取帖子內部連結
                        index,
                        title: item.$q("header").$text(),
                        url: item.$q("a").href
                    }));

                    await this._fetchContent({ content });
                };
            } else {
                this.worker.postMessage({ index: 0, title: this.titleCache, url: this.getPreviewAPI(url), time: Date.now(), delay: this.fetchDelay });

                // 等待主頁數據
                const homeData = await new Promise((resolve, reject) => {
                    this.worker.onmessage = async (e) => {
                        const { index, title, url, content, time, delay, error } = e.data;
                        if (!error) {
                            this.fetchDelay = Process.dynamicParam(time, delay);
                            resolve({ url, content });
                        }
                        else {
                            Lib.log(error, { title, url }, { dev: General.Dev, type: "error", collapsed: false });
                            await this.TooMany_TryAgain(url);
                            this.worker.postMessage({ index, title, url, time, delay });
                        };
                    }
                });

                await this._fetchContent(homeData);
            }

            this.currentPage++;
            this.currentPage <= this.finalPage
                ? this._fetchPage(null, this.getNextPageURL(url))
                : this.toLinkTxt ? this._toTxt() : this._toJson();
        };

        /* 獲取帖子內部數據 */
        async _fetchContent(homeData) {
            this.progress = 0; // 重置進度
            const { url, content } = homeData; // 解構數據

            // 解析處理的數據
            if (Process.IsNeko) {
                let taskCount = 0;
                const tasks = [];
                const resolvers = new Map();
                const postCount = content.length;

                if (this.metaDict.size === 0) {
                    this.metaDict.set(Transl("作者"), Lib.$q("span[itemprop='name'], fix_name").$text());
                    this.metaDict.set(Transl("帖子數量"), this.totalPages > 0 ? this.totalPages : postCount);
                    this.metaDict.set(Transl("建立時間"), Lib.getDate("{year}-{month}-{date} {hour}:{minute}"));
                    this.metaDict.set(Transl("獲取頁面"), this.sourceURL);
                };

                this.worker.onmessage = async (e) => {
                    const { index, title, url, content, time, delay, error } = e.data;

                    if (!error) {
                        const { resolve, reject } = resolvers.get(index);
                        this.fetchDelay = Process.dynamicParam(time, delay);

                        const standardTitle = this.normalizeName(title, index);
                        const postDom = Lib.domParse(content);

                        const classifiedFiles = this.nekoCategorize(standardTitle, [
                            ...postDom.$qa(".fileThumb"), // 圖片連結
                            ...postDom.$qa(".scrape__attachments a") // 下載連結
                        ]);

                        const generatedData = this.fetchGenerate({
                            PostLink: url,
                            Timestamp: postDom.$q(".timestamp").$text(),
                            ImgLink: classifiedFiles.img,
                            VideoLink: classifiedFiles.video,
                            DownloadLink: classifiedFiles.other,
                            // ExternalLink: this.specialLinkParse(post.content)
                        });

                        if (Object.keys(generatedData).length !== 0) {
                            this.dataDict.set(standardTitle, generatedData);
                        };

                        resolve();
                        Lib.title(`（${this.currentPage} - ${++taskCount}）`); // ? 如果直接使用 index, 順序會亂跳, 因為是異步執行
                        Lib.log("Request Successful", { index, title: standardTitle, url, data: generatedData }, { dev: General.Dev, collapsed: false });
                    } else {
                        await this.TooMany_TryAgain(url);
                        this.worker.postMessage({ index, title, url, time, delay });
                    }
                };

                for (const { index, title, url } of content) {
                    tasks.push(new Promise((resolve, reject) => {
                        resolvers.set(index, { resolve, reject });
                        this.worker.postMessage({ index, title, url, time: Date.now(), delay: this.fetchDelay });
                    }));

                    await Lib.sleep(this.fetchDelay);
                };

                await Promise.allSettled(tasks);

            } else {
                /* ----- 這邊是主頁的數據 ----- */
                const contentJson = JSON.parse(content);

                if (contentJson) {

                    if (this.metaDict.size === 0) {
                        const props = contentJson.props;

                        this.metaDict.set(Transl("作者"), props.name);
                        this.metaDict.set(Transl("帖子數量"), props.count);
                        this.metaDict.set(Transl("建立時間"), Lib.getDate("{year}-{month}-{date} {hour}:{minute}"));
                        this.metaDict.set(Transl("獲取頁面"), this.sourceURL);
                        this.metaDict.set(Transl("作者網站"), props.display_data.href);
                    }

                    const results = contentJson.results;
                    if (this.advancedFetch) {
                        const tasks = [];
                        const resolvers = new Map();

                        this.worker.onmessage = async (e) => {
                            const { index, title, url, content, time, delay, error } = e.data;
                            try {
                                if (!error) {
                                    const { resolve, reject } = resolvers.get(index);

                                    this.fetchDelay = Process.dynamicParam(time, delay);
                                    const contentJson = JSON.parse(content);

                                    if (contentJson) {
                                        const post = contentJson.post;
                                        const previews = contentJson.previews || []; // 取得圖片數據
                                        const attachments = contentJson.attachments || []; // 取得下載數據

                                        const standardTitle = this.normalizeName(post.title, index);
                                        const classifiedFiles = this.kemerCategorize({
                                            title: standardTitle,
                                            data: [...previews, ...attachments],
                                            fillValue: Lib.getFill(previews?.length || 1)
                                        });

                                        // 生成請求數據 (處理要抓什麼數據)
                                        const generatedData = this.fetchGenerate({
                                            PostLink: this.getPostURL(post.id),
                                            Timestamp: this.normalizeTimestamp(post),
                                            TypeTag: post.tags,
                                            ImgLink: classifiedFiles.img,
                                            VideoLink: classifiedFiles.video,
                                            DownloadLink: classifiedFiles.other,
                                            ExternalLink: this.specialLinkParse(post.content)
                                        });

                                        // 儲存數據
                                        if (Object.keys(generatedData).length !== 0) {
                                            this.dataDict.set(standardTitle, generatedData);
                                        };

                                        resolve();
                                        Lib.title(`（${this.currentPage} - ${++this.progress}）`);
                                        Lib.log("Request Successful", { index, title: standardTitle, url, data: generatedData }, { dev: General.Dev, collapsed: false });
                                    } else throw new Error("Json Parse Failed");
                                } else {
                                    throw new Error("Request Failed");
                                }
                            } catch (error) {
                                Lib.log(error, { index, title, url }, { dev: General.Dev, type: "error", collapsed: false });
                                await this.TooMany_TryAgain(url); // 錯誤等待
                                this.worker.postMessage({ index, title, url, time, delay });
                            }
                        };

                        // 生成任務
                        for (const [index, post] of results.entries()) {
                            tasks.push(new Promise((resolve, reject) => {
                                resolvers.set(index, { resolve, reject }); // 存儲解析器
                                this.worker.postMessage({ index, title: post.title, url: `${this.postAPI}/${post.id}`, time: Date.now(), delay: this.fetchDelay });
                            }));

                            await Lib.sleep(this.fetchDelay);
                        };

                        // 等待所有任務
                        await Promise.allSettled(tasks);

                    } else {
                        const previews = contentJson.result_previews || []; // 圖片所需的數據
                        const attachments = contentJson.result_attachments || []; // 下載所需的數據

                        for (const [index, post] of results.entries()) {
                            const standardTitle = this.normalizeName(post.title, index);

                            try {
                                // 獲取對應的伺服器
                                const serverDict = [...previews[index], ...attachments[index]].reduce((acc, item) => {
                                    acc[item.path] = item.server;
                                    return acc;
                                }, {});

                                // 分類所有文件
                                const classifiedFiles = this.kemerCategorize({
                                    title: standardTitle,
                                    data: [...(post.file // 確保 post.file 是 array
                                        ? (Array.isArray(post.file)
                                            ? post.file
                                            : Object.keys(post.file).length
                                                ? [post.file]
                                                : []
                                        ) : []
                                    ), ...post.attachments],
                                    serverDict,
                                    fillValue: Lib.getFill(previews?.length || 1)
                                });

                                const generatedData = this.fetchGenerate({
                                    PostLink: this.getPostURL(post.id),
                                    Timestamp: this.normalizeTimestamp(post),
                                    ImgLink: classifiedFiles.img,
                                    VideoLink: classifiedFiles.video,
                                    DownloadLink: classifiedFiles.other
                                });

                                if (Object.keys(generatedData).length !== 0) {
                                    this.dataDict.set(standardTitle, generatedData);
                                };

                                Lib.title(`（${this.currentPage}）`);
                                Lib.log("Parsed Successful", { index, title: standardTitle, url, data: generatedData }, { dev: General.Dev, collapsed: false });
                            } catch (error) {
                                Lib.log(error, { index, title: standardTitle, url }, { dev: General.Dev, type: "error", collapsed: false });
                                continue;
                            }
                        };
                    }

                    await Lib.sleep(this.fetchDelay);
                } else { /* 之後在想 */ }
            }

            return true; // 回傳完成
        };

        /* ===== 輸出生成 ===== */

        async _reset() {
            this.metaDict = null;
            this.dataDict = null;
            this.worker.terminate();
            // 上方操作是主動釋放 GC, 並不是必要的, 因為調用下載 Class 每次都是新的實例, 下方是必要的
            Process.Lock = false;
            Lib.title(this.titleCache);
        };

        async _toTxt() {
            let content = "";
            for (const value of this.dataDict.values()) {
                const getLinks = Object.assign(
                    {},
                    value[Transl("ImgLink")],
                    value[Transl("VideoLink")],
                    value[Transl("DownloadLink")]
                );

                for (const link of Object.values(getLinks)) {
                    content += `${encodeURI(link)}\n`;
                }
            }
            if (content.endsWith('\n')) content = content.slice(0, -1); // 去除末行空白

            Lib.outputTXT(content, this.metaDict.get(Transl("作者")), () => {
                content = null;
                this._reset();
            })
        };

        async _toJson() {
            let jsonData = Object.assign(
                {},
                { [Transl("元數據")]: Object.fromEntries(this.metaDict) },
                { [`${Transl("帖子內容")} (${this.dataDict.size})`]: Object.fromEntries(this.dataDict) }
            );

            Lib.outputJson(jsonData, this.metaDict.get(Transl("作者")), () => {
                jsonData = null;
                this._reset();
            });
        };

    }
}