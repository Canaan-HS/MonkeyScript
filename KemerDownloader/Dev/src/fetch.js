export default function Fetch(
    General, FetchSet, Process, Transl, Syn, md5
) {
    return class FetchData {
        static Try_Again_Promise = null;

        constructor() {
            this.metaDict = new Map(); // 保存元數據
            this.dataDict = new Map(); // 保存最終數據

            this.sourceURL = Syn.url; // 原始連結
            this.titleCache = Syn.title();

            this.URL = new URL(this.sourceURL); // 解析連結

            this.host = this.URL.host;
            this.firstURL = this.URL.origin + this.URL.pathname; // 第一頁連結
            this.queryValue = this.URL.searchParams.get("q");

            if (this.queryValue) { // 確保有搜尋關鍵字
                this.queryValue = encodeURIComponent(this.queryValue);
            } else if (this.queryValue === "") { // 有時候會出現空的搜尋關鍵字
                this.URL.searchParams.delete("q");
                this.sourceURL = this.URL.href;
            }

            this.currentPage = 1; // 預設開始抓取的頁數
            this.finalPage = 10; // 預設最終抓取的頁數
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
                        ? url.replace(this.host, `${this.host}/api/v1`).replace(`?q=${this.queryValue}`, `/posts-legacy?q=${this.queryValue}`)
                        : url.replace(this.host, `${this.host}/api/v1`) + "/posts-legacy";

            // 根據類型判斷有效值
            this.getValidValue = (value) => {
                if (!value) return null;

                const type = Syn.Type(value);
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
            this.normalizeName = (title, index) => title.trim().replace(/\n/g, " ") || `Untitled_${String(index + 1).padStart(2, "0")}`;

            // 正規化帖子時間戳 (傳入 Post 的物件)
            this.normalizeTimestamp = (post) => new Date(post.published || post.added)?.toLocaleString();

            // 進階抓取檔案分類 (影片與圖片文件 Array) => { video: {}, other: {} }
            this.advancedCategorize = (data) => {
                return data.reduce((acc, file) => {
                    const url = `${file.server}/data${file.path}?f=${file.name}`;
                    this.isVideo(file.extension) ? (acc.video[file.name] = url) : (acc.other[file.name] = url);
                    return acc;
                }, { video: {}, other: {} });
            };

            // 一般抓取的檔案分類 (標題字串, 所有類型文件 Array) => { img: [], video: {}, other: {} }
            this.normalCategorize = (title, data) => {
                let imgNumber = 0;
                let serverNumber = 0;

                return data.reduce((acc, file) => {
                    const name = file.name;
                    const path = file.path;
                    const extension = Syn.SuffixName(path, "");

                    serverNumber = (serverNumber % 4) + 1;
                    const server = `https://n${serverNumber}.${this.host}/data`;

                    if (this.isVideo(extension)) {
                        acc.video[name] = `${server}${path}?f=${name}`;
                    } else if (this.isImage(extension)) {
                        const name = `${title}_${String(++imgNumber).padStart(2, "0")}.${extension}`;
                        acc.img[name] = `${server}${path}?f=${name}`;
                    } else {
                        acc.other[name] = `${server}${path}?f=${name}`;
                    }

                    return acc;
                }, { img: {}, video: {}, other: {} });
            };

            // ! 目前有 Bug, 只能使用一次, 第二次後 response 的狀態直接都變成 200, 但實際上是 429
            this.TooMany_TryAgain = function (Uri) {
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
                            const response = await fetch(Uri, {
                                method: "HEAD",
                                signal: signal,
                                cache: 'no-store'
                            });

                            clearTimeout(timeoutId);
                            if (response.status === 429 || response.status === 503) {
                                await Syn.Sleep(sleepTime);
                                await checkRequest();
                            } else if (response.status === 200) {
                                resolve(response);
                            }
                        } catch (err) {
                            // 發生網路錯誤也重試
                            clearTimeout(timeoutId);
                            await Syn.Sleep(sleepTime);
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
            this.worker = Syn.WorkerCreation(`
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

            // 解析特別連結
            this.specialLinkParse = (data) => {
                const Cache = {};

                try {
                    for (const a of Syn.DomParse(data).$qa("body a")) {
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
                    Syn.Log("Error specialLinkParse", error, { dev: General.Dev, type: "error", collapsed: false });
                }

                return Cache;
            };

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
            const small = Syn.$q("small");
            const items = Syn.$q(".card-list__items");

            if (items) {
                Process.Lock = true; // 鎖定菜單的操作, 避免重複抓取

                // 取得當前頁數
                const currentPage = +Syn.$q(".pagination-button-current b")?.$text();
                currentPage && (this.currentPage = currentPage);

                // ! 實驗性獲取總頁數
                this.finalPage = small ? Math.ceil(+small.$text().split(" of ")[1] / 50) : 1;
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
                    if (!error) resolve({ index, title, url, content });
                    else {
                        Syn.Log(error, { title, url }, { dev: General.Dev, type: "error", collapsed: false });
                        await this.TooMany_TryAgain(url);
                        this.worker.postMessage({ index, title, url });
                    };
                }
            });

            const { content } = homeData;

            Object.assign(homeData, { content: JSON.parse(content) });
            Syn.Log("HomeData", homeData, { collapsed: false });

            // 恢復 _fetchContent 處理數據格式
            const homeDataClone = structuredClone(homeData);
            homeDataClone.content.results = [{ id }]; // 修改數據
            homeDataClone.content = JSON.stringify(homeDataClone.content); // 轉換為字符串

            await this._fetchContent(homeDataClone);
            Syn.Log("PostDate", this.dataDict, { collapsed: false });
            this._reset();
        };

        /* ===== 主要抓取函數 ===== */

        /* 獲取預覽頁數據 */
        async _fetchPage(items, url) {

            if (Process.IsNeko) {
                // 這邊由 Article 遍歷每一個帖子, 將 index 與 title 傳遞給 _fetchContent
                const article = items.$qa("article");
                // 下一頁連結由 Url 解析 ?o= + 50 取得
            } else {
                this.worker.postMessage({ index: 0, title: this.titleCache, url: this.getPreviewAPI(url), time: Date.now(), delay: this.fetchDelay });

                // 等待主頁數據
                const homeData = await new Promise((resolve, reject) => {
                    this.worker.onmessage = async (e) => {
                        const { index, title, url, content, time, delay, error } = e.data;
                        if (!error) {
                            this.fetchDelay = Process.dynamicParam(time, delay);
                            resolve({ index, title, url, content });
                        }
                        else {
                            Syn.Log(error, { title, url }, { dev: General.Dev, type: "error", collapsed: false });
                            await this.TooMany_TryAgain(url);
                            this.worker.postMessage({ index, title, url, time, delay });
                        };
                    }
                });

                // 等待內容數據
                await this._fetchContent(homeData);

                this.currentPage++;
                this.currentPage <= this.finalPage
                    ? this._fetchPage(null, this.getNextPageURL(url))
                    : this.toLinkTxt ? this._toTxt() : this._toJson();
            }
        };

        /* 獲取帖子內部數據 */
        async _fetchContent(homeData) {
            this.progress = 0; // 重置進度
            const { index, title, url, content } = homeData; // 解構數據

            // 解析處理的數據
            if (Process.IsNeko) {

            } else {
                /* ----- 這邊是主頁的數據 ----- */
                const contentJson = JSON.parse(content);

                if (contentJson) {

                    // 首次生成元數據
                    if (this.metaDict.size === 0) {
                        const props = contentJson.props;

                        this.metaDict.set(Transl("作者"), props.name);
                        this.metaDict.set(Transl("帖子數量"), props.count);
                        this.metaDict.set(Transl("建立時間"), Syn.GetDate("{year}-{month}-{date} {hour}:{minute}"));
                        this.metaDict.set(Transl("獲取頁面"), this.sourceURL);
                        this.metaDict.set(Transl("作者網站"), props.display_data.href);
                    }

                    const results = contentJson.results;
                    if (this.advancedFetch) {
                        const Tasks = [];
                        const resolvers = new Map(); // 用於存儲每個 Promise

                        this.worker.onmessage = async (e) => {
                            const { index, title, url, content, time, delay, error } = e.data;

                            if (resolvers.has(index)) {
                                const { resolve, reject } = resolvers.get(index);

                                try {
                                    if (!error) {
                                        this.fetchDelay = Process.dynamicParam(time, delay);
                                        const contentJson = JSON.parse(content);

                                        if (contentJson) {
                                            const post = contentJson.post; // ? 避免相容性問題 不用 replaceAll

                                            const standardTitle = this.normalizeName(post.title, index);
                                            const classifiedFiles = this.advancedCategorize(contentJson.attachments); // 對下載連結進行分類

                                            // 獲取圖片連結
                                            const getImgLink = () => { // ! 還需要測試
                                                const serverList = contentJson.previews.filter(item => item.server); // 取得圖片伺服器
                                                if ((serverList?.length ?? 0) === 0) return;

                                                // 為了穩定性這樣寫
                                                const postList = [
                                                    ...(post.file ? (Array.isArray(post.file) ? post.file : Object.keys(post.file).length ? [post.file] : []) : []),
                                                    ...post.attachments
                                                ];
                                                const fillValue = Syn.GetFill(serverList.length);

                                                // 依據篩選出有預覽圖伺服器的, 生成圖片連結
                                                return serverList.reduce((acc, server, index) => {
                                                    const extension = [postList[index].name, postList[index].path]
                                                        .map(name => Syn.SuffixName(name, ""))
                                                        .find(ext => this.isImage(ext));

                                                    if (!extension) return acc;

                                                    const name = `${standardTitle}_${Syn.Mantissa(index, fillValue, '0')}.${extension}`;
                                                    acc[name] = `${server.server}/data${postList[index].path}?f=${name}`;
                                                    return acc;
                                                }, {});
                                            };

                                            // 生成請求數據 (處理要抓什麼數據)
                                            const generatedData = this.fetchGenerate({
                                                PostLink: this.getPostURL(post.id),
                                                Timestamp: this.normalizeTimestamp(post),
                                                TypeTag: post.tags,
                                                ImgLink: getImgLink(),
                                                VideoLink: classifiedFiles.video,
                                                DownloadLink: classifiedFiles.other,
                                                ExternalLink: this.specialLinkParse(post.content)
                                            });

                                            // 儲存數據
                                            if (Object.keys(generatedData).length !== 0) {
                                                this.dataDict.set(standardTitle, generatedData);
                                            };

                                            resolve();
                                            Syn.title(`（${this.currentPage} - ${++this.progress}）`);
                                            Syn.Log("Request Successful", { index, title: standardTitle, url, data: generatedData }, { dev: General.Dev, collapsed: false });
                                        } else throw new Error("Json Parse Failed");
                                    } else {
                                        throw new Error("Request Failed");
                                    }
                                } catch (error) {
                                    Syn.Log(error, { index, title, url }, { dev: General.Dev, type: "error", collapsed: false });
                                    await this.TooMany_TryAgain(url); // 錯誤等待
                                    this.worker.postMessage({ index, title, url, time, delay });
                                }
                            }
                        };

                        // 生成任務
                        for (const [index, post] of results.entries()) {
                            Tasks.push(new Promise((resolve, reject) => {
                                resolvers.set(index, { resolve, reject }); // 存儲解析器
                                this.worker.postMessage({ index, title: post.title, url: `${this.postAPI}/${post.id}`, time: Date.now(), delay: this.fetchDelay });
                            }));
                            await Syn.Sleep(this.fetchDelay);
                        }

                        // 等待所有任務
                        await Promise.allSettled(Tasks);

                    } else {
                        for (const [index, post] of results.entries()) {
                            const standardTitle = this.normalizeName(post.title, index);

                            try {
                                // 分類所有文件
                                const classifiedFiles = this.normalCategorize(standardTitle, [...(post.file ? (Array.isArray(post.file) ? post.file : Object.keys(post.file).length ? [post.file] : []) : []), ...post.attachments]);

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

                                Syn.title(`（${this.currentPage}）`);
                                Syn.Log("Parsed Successful", { index, title: standardTitle, url, data: generatedData }, { dev: General.Dev, collapsed: false });
                            } catch (error) {
                                Syn.Log(error, { index, title: standardTitle, url }, { dev: General.Dev, type: "error", collapsed: false });
                                continue;
                            }
                        }
                    }

                    await Syn.Sleep(this.fetchDelay);
                    return true; // 回傳完成
                } else { /* 之後在想 */ }
            }
        };

        /* ===== 輸出生成 ===== */

        async _reset() {
            this.metaDict = null;
            this.dataDict = null;
            this.worker.terminate();
            // 上方操作是主動釋放 GC, 並不是必要的, 因為調用下載 Class 每次都是新的實例, 下方是必要的
            Process.Lock = false;
            Syn.title(this.titleCache);
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

            Syn.OutputTXT(content, this.metaDict.get(Transl("作者")), () => {
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

            Syn.OutputJson(jsonData, this.metaDict.get(Transl("作者")), () => {
                jsonData = null;
                this._reset();
            });
        };

    }
}