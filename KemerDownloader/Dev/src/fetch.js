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
            this.origin = this.URL.origin;
            this.pathname = this.URL.pathname;
            this.isPost = this.URL.pathname !== "/posts"; // 用於判斷是 post 還是 posts

            this.queryValue = this.URL.search;
            if (this.URL.searchParams.get("q") === "") { // 有時候會出現空的搜尋關鍵字
                this.URL.searchParams.delete("q");
                this.queryValue = this.URL.search;
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

            const apiInterface = "api/v1";

            // 帖子內部連結
            this.getPostURL = ({ service, user, id }) => `${this.origin}/${service}/user/${user}/post/${id}`;

            // 帖子內部 API 連結
            this.getPostAPI = ({ service, user, id }) => `${this.origin}/${apiInterface}/${service}/user/${user}/post/${id}`;

            // 帖子配置 API (獲取基本數據)
            this.profileAPI = `${this.origin}/${apiInterface}${this.pathname}/profile`;

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

            // 將預覽頁面轉成 API 連結
            const append = this.isPost ? "/posts" : "";
            this.getPreviewAPI = url =>
                /[?&]o=/.test(url)
                    ? url.replace(this.host, `${this.host}/${apiInterface}`).replace(/([?&]o=)/, `${append}$1`)
                    : this.queryValue // 如果有搜尋關鍵字
                        ? url.replace(this.host, `${this.host}/${apiInterface}`).replace(this.queryValue, `${append}${this.queryValue}`)
                        : url.replace(this.host, `${this.host}/${apiInterface}`) + append;

            // 根據類型判斷有效值
            this.getValidValue = value => {
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
            this.infoRules = new Set(["PostLink", "Timestamp", "TypeTag", "ImgLink", "VideoLink", "DownloadLink", "ExternalLink"]);

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
            const filterExts = new Set(FetchSet.FilterExts);
            const videoExts = new Set(Process.VideoExts);
            const imageExts = new Set(Process.ImageExts);

            this.isVideo = (str) => videoExts.has(str.replace(/^\./, "").toLowerCase());
            this.isImage = (str) => imageExts.has(str.replace(/^\./, "").toLowerCase());

            // 正規化帖子標題名稱 (傳入 Post 標題 (string), 與列表 Index (number))
            this.normalizeName = (title, index) => title.trim().replace(/\n/g, " ") || `Untitled_${String(((this.currentPage - 1) * 50) + (index + 1)).padStart(2, "0")}`;

            // 正規化帖子時間戳 (傳入 Post 的物件)
            this.normalizeTimestamp = ({ added, published }) => new Date(added || published)?.toLocaleString();

            // 適用 kemono 和 coomer 的分類 (data = api 文件數據, serverDict = api 伺服器字典, fillValue = 填充數字的位數)
            this.kemerCategorize = ({ title, data, serverDict, fillValue }) => {
                let imgNumber = 0;

                return data.reduce((acc, file) => {
                    const name = file.name;
                    const path = file.path;
                    const extension = Lib.suffixName(path, "");

                    if (filterExts.has(extension)) return acc;

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
                        if (filterExts.has(extension)) return acc;

                        const url = uri.startsWith("http") ? uri : `${Lib.$origin}${uri}`;
                        const getDownloadName = (link) => this.deepDecodeURIComponent(
                            link.download?.trim() || link.$text()
                        );

                        if (this.isVideo(extension)) {
                            acc.video[getDownloadName(file)] = url;
                        } else if (this.isImage(extension)) {
                            // ? 圖片基本支援 ?filename= IDM 解碼, 網站本身沒有 Content-Disposition
                            const name = `${title}_${String(++imgNumber).padStart(2, "0")}.${extension}`;
                            acc.img[name] = `${url}?filename=${name}`;
                        } else {
                            // 某些可能支援 ?filename=
                            const name = getDownloadName(file);
                            acc.other[name] = `${url}?filename=${name}`;
                        }
                    }

                    return acc;
                }, { video: {}, img: {}, other: {} });
            };

            /* specialLinkParse 的依賴 */
            const allowType = new Set(["A", "P", "STRONG", "BODY"]); // 允許解析的類型
            const pFilter = new Set(["mega.nz"]); // 過濾 P 中不是 Url 但是會被解析的類型
            const urlRegex = /(?:(?:https?|ftp|mailto|file|data|blob|ws|wss|ed2k|thunder):\/\/|(?:[-\w]+\.)+[a-zA-Z]{2,}(?:\/|$)|\w+@[-\w]+\.[a-zA-Z]{2,})[^\s]*?(?=[{}「」『』【】\[\]（）()<>、"'，。！？；：…—～~]|$|\s)/g;
            const safeInclud = (target, checkStr) => {
                if (typeof target !== "string") return false;
                return target?.includes(checkStr || "");
            };
            const protocolParse = (url) => {
                if (/^[a-zA-Z][\w+.-]*:\/\//.test(url) || /^[a-zA-Z][\w+.-]*:/.test(url)) return url;
                if (/^([\w-]+\.)+[a-z]{2,}(\/|$)/i.test(url)) return "https://" + url;
                if (/^\/\//.test(url)) return "https:" + url;
                return url;
            };
            // ! 目前都只解析 MEGA 的連結, 還有其他連結類型 暫時不支援
            const checkProcessableLink = (link) => {
                return link.toLowerCase().startsWith("https://mega.nz") && (!safeInclud(link, "#") || safeInclud(link, "#P!"))
            };
            const searchPassword = (href, text) => {
                let pass = "";
                let state = false;
                if (!text) return { pass, state, href };

                const lowerText = text.toLowerCase();
                const encryptedHref = safeInclud(href, "#P!");

                if (text.startsWith("#")) {
                    state = true;
                    if (encryptedHref) { pass = text.slice(1) } else { href += text }
                }
                else if (/^[A-Za-z0-9_-]{16,43}$/.test(text)) { // ! 目前只判斷 16 ~ 43 的長度
                    state = true;
                    if (encryptedHref) { pass = text } else { href += "#" + text }
                }
                else if (lowerText.startsWith("pass") || lowerText.startsWith("key")) {
                    const key = text.match(/^(Pass|Key)\s*:?\s*(.*)$/i)?.[2]?.trim() ?? "";
                    if (key) {
                        state = true;
                        if (encryptedHref) { pass = key } else { href += "#" + key }
                    }
                }

                return {
                    pass,
                    state,
                    href: href.match(urlRegex)?.[0] ?? href
                };
            }
            // 解析特別連結 (不適用 nekohouse)
            this.specialLinkParse = (data) => {
                const parsed = {};

                try {
                    const domBody = Lib.domParse(data).body;

                    const parseAdd = (name, href, pass) => {
                        if (!href) return;
                        // ! 過濾有副檔名的 (只允許網站連結) (實驗性)
                        // ? 在這過濾是避免 specialLinkParse 解析時的意外, 所以不在 tree 直接過濾
                        if (/\.[a-zA-Z0-9]+$/.test(href)) return;
                        // 臨時過濾方式
                        if (safeInclud(name, "frame embed")) name = "";

                        // 名稱為 空 與 連結相同 時, 用哈希值名稱
                        parsed[
                            name && name !== href ? name : md5(href).slice(0, 16)
                        ] = pass ? {
                            [Transl("密碼")]: pass,
                            [Transl("連結")]: href
                        } : href;
                    };

                    // ! 為了通用性 同時獲取 A 和 P 很容易會有重複
                    let nodes = new Set();
                    const tree = document.createTreeWalker(
                        domBody,
                        NodeFilter.SHOW_TEXT,
                        {
                            acceptNode: (node) => {
                                const parentElement = node.parentElement;
                                const tag = parentElement.tagName;

                                if (!allowType.has(tag)) return NodeFilter.FILTER_REJECT;
                                // ? 直接排除 P 中含有 A 的情況, 可能會有例外狀況
                                if (tag === "P" && parentElement.getElementsByTagName("a").length > 0) {
                                    return NodeFilter.FILTER_REJECT;
                                }

                                return NodeFilter.FILTER_ACCEPT;
                            }
                        }
                    );

                    while (tree.nextNode()) {
                        nodes.add(tree.currentNode.parentElement); // ! 這裡會有重複
                    };

                    // ! 只有在 節點數量為 1 時, 才允許獨立解析 body (不然會有怪怪的東西)
                    const allowBody = nodes.size === 1;
                    const urlRecord = new Set();

                    // ! 這網站有一堆不同的格式, 很難寫出通用的解析方式
                    nodes = [...nodes];
                    Lib.log(domBody, { dev: General.Dev, group: "specialLinkParse DOM", collapsed: false });
                    for (const [index, node] of nodes.entries()) {
                        const tag = node.tagName;
                        Lib.log({ tag, content: node.$text() }, { dev: General.Dev, group: "specialLinkParse node"});

                        let name = "";
                        let href = "";
                        let pass = "";
                        let endAdd = true;

                        if (tag === "A") {
                            href = node.href;

                            if (checkProcessableLink(href)) {
                                // 簡單搜索同層級 是否有密碼
                                const nextNode = node.nextSibling;
                                if (nextNode) {
                                    if (nextNode.nodeType === Node.TEXT_NODE) {
                                        ({ href, pass } = searchPassword(href, nextNode.$text()));
                                    } else if (nextNode.nodeType === Node.ELEMENT_NODE) {
                                        const nodeText = [...nextNode.childNodes].find(node => node.nodeType === Node.TEXT_NODE)?.$text() ?? "";
                                        ({ href, pass } = searchPassword(href, nodeText));
                                    }
                                } else {
                                    for (let i = index + 1; i < nodes.length; i++) {
                                        const newData = searchPassword(href, nodes[i].$text());

                                        if (newData.state) {
                                            ({ href, pass } = newData);
                                            break;
                                        }
                                    }
                                }
                            }

                            // 有名稱嘗試賦予
                            const previousNode = node.previousSibling;
                            if (previousNode?.nodeType === Node.ELEMENT_NODE) {
                                name = previousNode.$text().replace(":", "");
                            } else {
                                const text = node.$text();
                                name = !safeInclud(href, text) ? text : ""; // ! 實驗性, 可能不通用
                            }
                        } else if (tag === "P") {
                            const url = node.$text().match(urlRegex);

                            if (url && !pFilter.has(url[0])) {
                                href = protocolParse(url[0]);
                            }
                        } else if (tag === "STRONG") {
                            const parentElement = node.parentElement;

                            /* 父元素是 A, 代表這是名稱 */
                            if (parentElement.tagName === "A") {
                                href = parentElement.href;
                                name = node.$text();
                            };
                        } else if (tag === "BODY" && allowBody) {
                            node.$text().replace(urlRegex, (url, offset, fullText) => {

                                const before = fullText.slice(0, offset); // url 前面的內容
                                const linesBefore = before.split(/\r?\n/); // 拆分行數
                                let currentLine = linesBefore[linesBefore.length - 1].trim();

                                if (currentLine.length > 0) { // 當前行有文字 視為 name
                                    name = currentLine;
                                } else { // 當前行是空的 往前一行找 (只找一層)
                                    if (linesBefore.length > 1) {
                                        name = linesBefore[linesBefore.length - 2].trim();
                                    }
                                }

                                if (name.match(urlRegex)) { // 檢查 如果 name 匹配網址, 則不是名稱
                                    name = "";
                                }

                                if (checkProcessableLink(url)) {
                                    const after = fullText.slice(offset + url.length);
                                    const linesAfter = after.split(/\r?\n/); // 拆分行數
                                    for (const line of linesAfter) {
                                        const trimmed = line.trim();
                                        if (!trimmed) continue;

                                        const newData = searchPassword(url, trimmed);
                                        if (newData.state) {
                                            ({ href, pass } = newData);
                                            break;
                                        }
                                    }
                                }

                                parseAdd(name, protocolParse(url), pass); // 直接進行加入
                            });

                            endAdd = false;
                        }

                        // 加入判斷 與 除重
                        if (endAdd && !urlRecord.has(href)) {
                            urlRecord.add(href);
                            parseAdd(name, href, pass);
                        }
                    }
                } catch (error) {
                    Lib.log(error, { dev: General.Dev, group: "Error specialLinkParse", collapsed: false }).error;
                }

                return parsed;
            };

            this.tooManyTryAgain = function (url) {
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
                                headers: {
                                    "Accept": "text/css",
                                },
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
            this.worker = Lib.createWorker(`
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
                    fetch(url, {
                        headers: {
                            "Accept": "text/css",
                        }
                    }).then(response => {
                        if (response.ok) {
                            response.text().then(content => {
                                postMessage({ index, title, url, content, time, delay, error: false });
                            });
                        } else {
                            postMessage({ index, title, url, content: "", time, delay, error: true });
                        }
                    }).catch(error => {
                        postMessage({ index, title, url, content: "", time, delay, error: true });
                    });
                }
            `);

            // 設置抓取規則
            FetchSet.UseFormat && this._fetchConfig(FetchSet.Mode, FetchSet.Format);

            Lib.log({
                Title: this.titleCache,
                isPost: this.isPost,
                QueryValue: this.queryValue,
                ProfileAPI: this.profileAPI,
                GenerateRules: this.infoRules,
                ParseUrl: this.URL,
            }, { dev: General.Dev, group: "Fetch Init" });
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

                Lib.log({
                    small, items,
                    CurrentPage: this.currentPage,
                    TotalPages: this.totalPages,
                    FinalPage: this.finalPage
                }, { dev: General.Dev, group: "Fetch Run" });

                this._fetchPage(items, this.sourceURL); // 開始抓取
            } else {
                alert(Transl("未取得數據"));
            }
        };

        /* 測試進階抓取數據 */
        async fetchTest(id) {
            if (!this.isPost) {
                alert("This Page Does Not Support Test");
                return;
            };

            Process.Lock = true;

            const parseUrlInfo = (uri) => {
                uri =
                    uri.match(/\/([^\/]+)\/(?:user|server|creator|fanclubs)\/([^\/?]+)/)
                    || uri.match(/\/([^\/]+)\/([^\/]+)$/);
                uri = uri.splice(1);

                let server = uri[0].replace(/\/?(www\.|\.com|\.to|\.jp|\.net|\.adult|user\?u=)/g, "");
                let user = uri[1];

                server = { x: "twitter", maker_id: "dlsite" }[server] ?? server;
                return uri ? { server, user } : { uri };
            };

            const { service, user } = parseUrlInfo(this.sourceURL);
            const pack = {
                id,
                user,
                service,
                title: this.titleCache
            };

            Lib.log(pack, { dev: General.Dev, group: "Fetch Test", collapsed: false });

            await this._fetchContent({
                content: JSON.stringify([pack])
            });

            this._reset();
        };

        /* ===== 主要抓取函數 ===== */

        /* 獲取預覽頁數據 */
        async _fetchPage(items, url) {

            if (Process.IsNeko) {

                if (!items) { // 第二輪開始 只會得到 url
                    this.worker.postMessage({ title: this.titleCache, url, time: Date.now(), delay: this.fetchDelay });

                    const homeData = await new Promise((resolve, reject) => {
                        this.worker.onmessage = async (e) => {
                            const { title, url, content, time, delay, error } = e.data;
                            if (!error) {
                                this.fetchDelay = Process.dynamicParam(time, delay);
                                resolve(content);
                            }
                            else {
                                Lib.log({ title, url, error }, { dev: General.Dev, collapsed: false }).error;
                                await this.tooManyTryAgain(url);
                                this.worker.postMessage({ title, url, time, delay });
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
                this.worker.postMessage({ title: this.titleCache, url: this.getPreviewAPI(url), time: Date.now(), delay: this.fetchDelay });

                // 等待主頁數據
                const homeData = await new Promise((resolve, reject) => {
                    this.worker.onmessage = async (e) => {
                        const { title, url, content, time, delay, error } = e.data;
                        if (!error) {
                            this.fetchDelay = Process.dynamicParam(time, delay);
                            resolve({ url, content });
                        }
                        else {
                            Lib.log({ title, url, error }, { dev: General.Dev, collapsed: false }).error;
                            await this.tooManyTryAgain(url);
                            this.worker.postMessage({ title, url, time, delay });
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
            Lib.log(homeData, { dev: General.Dev, group: "Fetch Content" });

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
                            // ? 暫時不支援 ExternalLink 的解析
                            // ExternalLink: this.specialLinkParse(post.content)
                        });

                        if (Object.keys(generatedData).length !== 0) {
                            this.dataDict.set(standardTitle, generatedData);
                        };

                        resolve();
                        Lib.title(`（${this.currentPage} - ${++taskCount}）`); // ? 如果直接使用 index, 順序會亂跳, 因為是異步執行
                        Lib.log({ index, title: standardTitle, url, data: generatedData }, { dev: General.Dev, group: "Request Successful", collapsed: false });
                    } else {
                        await this.tooManyTryAgain(url);
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
                let homeJson = JSON.parse(content);

                if (homeJson) {

                    if (this.metaDict.size === 0) {
                        let profile = { name: null };

                        if (this.isPost) {
                            this.worker.postMessage({ url: this.profileAPI });

                            profile = await new Promise((resolve, reject) => {
                                this.worker.onmessage = async (e) => {
                                    const { url, content, error } = e.data;
                                    if (!error) resolve(JSON.parse(content));
                                    else {
                                        Lib.log(url, { dev: General.Dev, collapsed: false }).error;
                                        await this.tooManyTryAgain(url);
                                        this.worker.postMessage({ url });
                                    };
                                }
                            })
                        } else {
                            this.finalPage = "1000"; // 該頁面能翻的只有 1000
                            profile["post_count"] = homeJson.true_count;
                        }

                        this.metaDict.set(Transl("作者"), profile.name);
                        this.metaDict.set(Transl("帖子數量"), this.totalPages > 0 ? this.totalPages : profile.post_count);
                        this.metaDict.set(Transl("建立時間"), Lib.getDate("{year}-{month}-{date} {hour}:{minute}"));
                        this.metaDict.set(Transl("獲取頁面"), this.sourceURL);

                        Lib.log(this.metaDict, { dev: General.Dev, group: "Meta Data" });
                    }

                    // ! 目前網站修改, 只支援 advancedFetch
                    if (true || this.advancedFetch) {
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
                                            PostLink: this.getPostURL(post),
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
                                        Lib.log({ index, title: standardTitle, url, data: generatedData }, { dev: General.Dev, group: "Request Successful", collapsed: false });
                                    } else throw new Error("Json Parse Failed");
                                } else {
                                    throw new Error("Request Failed");
                                }
                            } catch (error) {
                                Lib.log({ index, title, url, error }, { dev: General.Dev, collapsed: false }).error;
                                await this.tooManyTryAgain(url); // 錯誤等待
                                this.worker.postMessage({ index, title, url, time, delay });
                            }
                        };

                        // 生成任務
                        homeJson = this.isPost ? homeJson : homeJson.posts;
                        for (const [index, post] of homeJson.entries()) {
                            tasks.push(new Promise((resolve, reject) => {
                                resolvers.set(index, { resolve, reject }); // 存儲解析器

                                this.worker.postMessage({
                                    index,
                                    title: post.title,
                                    url: this.getPostAPI(post),
                                    time: Date.now(),
                                    delay: this.fetchDelay
                                })
                            }));

                            await Lib.sleep(this.fetchDelay);
                        };

                        // 等待所有任務
                        await Promise.allSettled(tasks);

                    } else {
                        const previews = homeJson.result_previews || []; // 圖片所需的數據
                        const attachments = homeJson.result_attachments || []; // 下載所需的數據

                        for (const [index, post] of homeJson.entries()) {
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
                                    PostLink: this.getPostURL(post),
                                    Timestamp: this.normalizeTimestamp(post),
                                    ImgLink: classifiedFiles.img,
                                    VideoLink: classifiedFiles.video,
                                    DownloadLink: classifiedFiles.other
                                });

                                if (Object.keys(generatedData).length !== 0) {
                                    this.dataDict.set(standardTitle, generatedData);
                                };

                                Lib.title(`（${this.currentPage}）`);
                                Lib.log({ index, title: standardTitle, url, data: generatedData }, { dev: General.Dev, group:"Parsed Successful", collapsed: false });
                            } catch (error) {
                                Lib.log({ index, title: standardTitle, url, error }, { dev: General.Dev, collapsed: false }).error;
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