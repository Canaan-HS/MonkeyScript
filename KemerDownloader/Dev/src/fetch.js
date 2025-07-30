export default function Fetch(
    General, FetchSet, Process, Transl, Syn, md5
) {
    return class FetchData {
        static TryAgain_Promise = null;

        constructor() {
            this.MetaDict = new Map(); // 保存元數據
            this.DataDict = new Map(); // 保存最終數據

            this.SourceURL = Syn.url; // 原始連結
            this.TitleCache = Syn.title();

            this.URL = new URL(this.SourceURL); // 解析連結

            this.Host = this.URL.host;
            this.FirstURL = this.URL.origin + this.URL.pathname; // 第一頁連結
            this.QueryValue = encodeURIComponent(this.URL.searchParams.get("q") || ""); // 搜尋關鍵字 (如果有的話)

            this.CurrentPage = 1; // 預設開始抓取的頁數
            this.FinalPage = 10; // 預設最終抓取的頁數
            this.Progress = 0; // 用於顯示當前抓取進度
            this.OnlyMode = false; // 判斷獲取數據的模式
            this.FetchDelay = FetchSet.Delay; // 獲取延遲
            this.ToLinkTxt = FetchSet.ToLinkTxt; // 判斷是否輸出為連結文本
            this.AdvancedFetch = FetchSet.AdvancedFetch; // 判斷是否往內抓數據

            // 帖子內部連結
            this.PostURL = ID => `${this.FirstURL}/post/${ID}`;

            // 下一頁連結
            this.NextPageURL = urlStr => {
                const url = new URL(urlStr);
                const search = url.searchParams;

                const q = search.get("q");
                let o = search.get("o");

                o = o ? +o + 50 : 50;

                const params = q ? `?o=${o}&q=${q}` : `?o=${o}`;
                return `${url.origin}${url.pathname}${params}`;
            };


            // 內部連結的 API 模板
            this.PostAPI = `${this.FirstURL}/post`.replace(this.Host, `${this.Host}/api/v1`);

            // 將預覽頁面轉成 API 連結
            this.PreviewAPI = Url =>
                /[?&]o=/.test(Url)
                    ? Url.replace(this.Host, `${this.Host}/api/v1`).replace(/([?&]o=)/, "/posts-legacy$1")
                    : this.QueryValue // 如果有搜尋關鍵字
                        ? Url.replace(this.Host, `${this.Host}/api/v1`).replace(`?q=${this.QueryValue}`, `/posts-legacy?q=${this.QueryValue}`)
                        : Url.replace(this.Host, `${this.Host}/api/v1`) + "/posts-legacy";

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

            // 預設添加的數據
            this.InfoRules = new Set(["PostLink", "Timestamp", "TypeTag", "ImgLink", "VideoLink", "DownloadLink"]);

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
                    if (this.InfoRules.has(key)) {
                        const value = this.Default(Data[key]);
                        value && (acc[Transl(key)] = value); // 有數據的才被添加
                    }
                    return acc;
                }, {});
            };

            // 將數據類型表轉為 Set
            const ImageExts = new Set(Process.ImageExts);
            const VideoExts = new Set(Process.VideoExts);

            this.IsVideo = (Str) => VideoExts.has(Str.replace(/^\./, "").toLowerCase());
            this.IsImage = (Str) => ImageExts.has(Str.replace(/^\./, "").toLowerCase());

            // 正規化帖子標題名稱 (傳入 Post 標題 (string), 與列表 Index (number))
            this.NormalizeName = (Title, Index) => Title.trim().replace(/\n/g, " ") || `Untitled_${String(Index + 1).padStart(2, "0")}`;

            // 正規化帖子時間戳 (傳入 Post 的物件)
            this.NormalizeTimestamp = (Post) => new Date(Post.published || Post.added)?.toLocaleString();

            // 進階抓取檔案分類 (影片與圖片文件 Array) => { video: {}, other: {} }
            this.AdvancedCategorize = (Data) => {
                return Data.reduce((acc, file) => {
                    const url = `${file.server}/data${file.path}?f=${file.name}`;
                    this.IsVideo(file.extension) ? (acc.video[file.name] = url) : (acc.other[file.name] = url);
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
                    const extension = Syn.SuffixName(name, "");

                    serverNumber = (serverNumber % 4) + 1;
                    const server = `https://n${serverNumber}.${this.Host}/data`;

                    if (this.IsVideo(extension)) {
                        acc.video[name] = `${server}${path}?f=${name}`;
                    } else if (this.IsImage(extension)) {
                        const name = `${Title}_${String(++imgNumber).padStart(2, "0")}.${extension}`;
                        acc.img[name] = `${server}${path}?f=${name}`;
                    } else {
                        acc.other[name] = `${server}${path}?f=${name}`;
                    }

                    return acc;
                }, { img: {}, video: {}, other: {} });
            };

            // ! 目前有 Bug, 只能使用一次, 第二次後只回傳 null, 後續研究
            this.TooMany_TryAgain = function (Uri) {
                // 如果已經有一個等待中的 Promise，直接返回並等待它完成
                if (FetchData.TryAgain_Promise) {
                    return FetchData.TryAgain_Promise;
                }

                // 創建一個新的 Promise 作為唯一的鎖
                FetchData.TryAgain_Promise = new Promise(async (resolve) => {
                    const sleepTime = 5e3; // 每次等待 5 秒
                    const timeout = 20e4; // 最多等待 20 秒

                    const checkRequest = async () => {
                        const controller = new AbortController();
                        const signal = controller.signal;
                        const timeoutId = setTimeout(() => controller.abort(), timeout);

                        try {
                            const response = await fetch(Uri, { method: "HEAD", signal });
                            clearTimeout(timeoutId);

                            if (response.status === 429 || response.status === 503) {
                                await Syn.Sleep(sleepTime);
                                await checkRequest(); // 繼續遞迴檢查
                            } else {
                                // 狀態正常，重置鎖，然後喚醒所有等待者
                                FetchData.TryAgain_Promise = null;
                                resolve();
                            }
                        } catch (err) {
                            // 發生網路錯誤也重試
                            clearTimeout(timeoutId);
                            await Syn.Sleep(sleepTime);
                            await checkRequest();
                        }
                    };

                    await checkRequest(); // 開始檢查
                });

                return FetchData.TryAgain_Promise;
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
            this.specialLinkParse = (Data) => {
                const Cache = {};

                try {
                    for (const a of Syn.DomParse(Data).$qa("body a")) {
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
            FetchSet.UseFormat && this._FetchConfig(FetchSet.Mode, FetchSet.Format);
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
         * _FetchConfig("FilterMode", ["PostLink", "ImgLink", "DownloadLink"]);
         *
         * 這會只顯示這些項目
         * _FetchConfig("OnlyMode", ["PostLink", "ImgLink", "DownloadLink"]);
         */
        async _FetchConfig(Mode = "FilterMode", UserSet = []) {
            switch (Mode) {
                case "FilterMode":
                    this.OnlyMode = false;
                    UserSet.forEach(key => this.InfoRules.delete(key));
                    break;
                case "OnlyMode":
                    this.OnlyMode = true;
                    this.InfoRules = new Set(
                        [...this.InfoRules].filter(key => UserSet.has(key))
                    );
                    break;
            }
        };

        /* 入口調用函數 */
        async FetchRun() {
            const Small = Syn.$q("small");
            const Items = Syn.$q(".card-list__items");

            if (Items) {
                Process.Lock = true; // 鎖定菜單的操作, 避免重複抓取

                // 取得當前頁數
                const CurrentPage = +Syn.$q(".pagination-button-current b")?.$text();
                CurrentPage && (this.CurrentPage = CurrentPage);

                // ! 實驗性獲取總頁數
                this.FinalPage = Small ? Math.ceil(+Small.$text().split(" of ")[1] / 50) : 1;
                this._FetchPage(Items, this.SourceURL); // 開始抓取
            } else {
                alert(Transl("未取得數據"));
            }
        };

        /* 測試進階抓取數據 */
        async FetchTest(Id) {
            Process.Lock = true;

            this.Worker.postMessage({ index: 0, title: this.TitleCache, url: this.PreviewAPI(this.FirstURL) });
            const HomeData = await new Promise((resolve, reject) => {
                this.Worker.onmessage = async (e) => {
                    const { index, title, url, content, error } = e.data;
                    if (!error) resolve({ index, title, url, content });
                    else {
                        Syn.Log(error, { title: title, url: url }, { dev: General.Dev, type: "error", collapsed: false });
                        await this.TooMany_TryAgain(url);
                        this.Worker.postMessage({ index: index, title: title, url: url });
                    };
                }
            });

            const { content } = HomeData;

            Object.assign(HomeData, { content: JSON.parse(content) });
            Syn.Log("HomeData", HomeData, { collapsed: false });

            // 恢復 _FetchContent 處理數據格式
            const Cloned_HomeData = structuredClone(HomeData);
            Cloned_HomeData.content.results = [{ id: Id }]; // 修改數據
            Cloned_HomeData.content = JSON.stringify(Cloned_HomeData.content); // 轉換為字符串

            await this._FetchContent(Cloned_HomeData);
            Syn.Log("PostDate", this.DataDict, { collapsed: false });
            this._Reset();
        };

        /* ===== 主要抓取函數 ===== */

        /* 獲取預覽頁數據 */
        async _FetchPage(Items, Url) {

            if (Process.IsNeko) {
                // 這邊由 Article 遍歷每一個帖子, 將 index 與 title 傳遞給 _FetchContent
                const Article = Items.$qa("article");
                // 下一頁連結由 Url 解析 ?o= + 50 取得
            } else {
                this.Worker.postMessage({ index: 0, title: this.TitleCache, url: this.PreviewAPI(Url), time: Date.now(), delay: this.FetchDelay });

                // 等待主頁數據
                const HomeData = await new Promise((resolve, reject) => {
                    this.Worker.onmessage = async (e) => {
                        const { index, title, url, content, time, delay, error } = e.data;
                        if (!error) {
                            this.FetchDelay = Process.dynamicParam(time, delay);
                            resolve({ index, title, url, content });
                        }
                        else {
                            Syn.Log(error, { title: title, url: url }, { dev: General.Dev, type: "error", collapsed: false });
                            await this.TooMany_TryAgain(url);
                            this.Worker.postMessage({ index: index, title: title, url: url, time: time, delay: delay });
                        };
                    }
                });

                // 等待內容數據
                await this._FetchContent(HomeData);

                this.CurrentPage++;
                this.CurrentPage <= this.FinalPage
                    ? this._FetchPage(null, this.NextPageURL(Url))
                    : this.ToLinkTxt ? this._ToTxt() : this._ToJson();
            }
        };

        /* 獲取帖子內部數據 */
        async _FetchContent(Data) {
            this.Progress = 0; // 重置進度
            const { index, title, url, content } = Data; // 解構數據

            // 解析處理的數據
            if (Process.IsNeko) {

            } else {
                /* ----- 這邊是主頁的數據 ----- */
                const Json = JSON.parse(content);

                if (Json) {

                    // 首次生成元數據
                    if (this.MetaDict.size === 0) {
                        const props = Json.props;

                        this.MetaDict.set(Transl("作者"), props.name);
                        this.MetaDict.set(Transl("帖子數量"), props.count);
                        this.MetaDict.set(Transl("建立時間"), Syn.GetDate("{year}-{month}-{date} {hour}:{minute}"));
                        this.MetaDict.set(Transl("獲取頁面"), this.SourceURL);
                        this.MetaDict.set(Transl("作者網站"), props.display_data.href);
                    }

                    const Results = Json.results;
                    if (this.AdvancedFetch) {
                        const Tasks = [];
                        const resolvers = new Map(); // 用於存儲每個 Promise

                        this.Worker.onmessage = async (e) => {
                            const { index, title, url, content, time, delay, error } = e.data;

                            if (resolvers.has(index)) {
                                const { resolve, reject } = resolvers.get(index);

                                try {
                                    if (!error) {
                                        this.FetchDelay = Process.dynamicParam(time, delay);
                                        const Json = JSON.parse(content);

                                        if (Json) {
                                            const Post = Json.post; // ? 避免相容性問題 不用 replaceAll

                                            const Title = this.NormalizeName(Post.title, index);
                                            const File = this.AdvancedCategorize(Json.attachments); // 對下載連結進行分類

                                            // 獲取圖片連結
                                            const ImgLink = () => { // ! 還需要測試
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
                                                        .map(name => Syn.SuffixName(name, ""))
                                                        .find(ext => this.IsImage(ext));

                                                    if (!extension) return acc;

                                                    const name = `${Title}_${Syn.Mantissa(Index, Fill, '0')}.${extension}`;
                                                    acc[name] = `${Server.server}/data${List[Index].path}?f=${name}`;
                                                    return acc;
                                                }, {});
                                            };

                                            // 生成請求數據 (處理要抓什麼數據)
                                            const Gen = this.FetchGenerate({
                                                PostLink: this.PostURL(Post.id),
                                                Timestamp: this.NormalizeTimestamp(Post),
                                                TypeTag: Post.tags,
                                                ImgLink: ImgLink(),
                                                VideoLink: File.video,
                                                DownloadLink: File.other,
                                                ExternalLink: this.specialLinkParse(Post.content)
                                            });

                                            // 儲存數據
                                            if (Object.keys(Gen).length !== 0) {
                                                this.DataDict.set(Title, Gen);
                                            };

                                            resolve();
                                            Syn.title(`（${this.CurrentPage} - ${++this.Progress}）`);
                                            Syn.Log("Request Successful", { index: index, title: Title, url: url, data: Gen }, { dev: General.Dev, collapsed: false });
                                        } else throw new Error("Json Parse Failed");
                                    } else {
                                        throw new Error("Request Failed");
                                    }
                                } catch (error) {
                                    Syn.Log(error, { index: index, title: title, url: url }, { dev: General.Dev, type: "error", collapsed: false });
                                    await this.TooMany_TryAgain(url); // 錯誤等待
                                    this.Worker.postMessage({ index: index, title: title, url: url, time: time, delay: delay });
                                }
                            }
                        };

                        // 生成任務
                        for (const [Index, Post] of Results.entries()) {
                            Tasks.push(new Promise((resolve, reject) => {
                                resolvers.set(Index, { resolve, reject }); // 存儲解析器
                                this.Worker.postMessage({ index: Index, title: Post.title, url: `${this.PostAPI}/${Post.id}`, time: Date.now(), delay: this.FetchDelay });
                            }));
                            await Syn.Sleep(this.FetchDelay);
                        }

                        // 等待所有任務
                        await Promise.allSettled(Tasks);

                    } else {
                        for (const [Index, Post] of Results.entries()) {
                            const Title = this.NormalizeName(Post.title, Index);

                            try {
                                // 分類所有文件
                                const File = this.Categorize(Title, [...(Post.file ? (Array.isArray(Post.file) ? Post.file : Object.keys(Post.file).length ? [Post.file] : []) : []), ...Post.attachments]);

                                const Gen = this.FetchGenerate({
                                    PostLink: this.PostURL(Post.id),
                                    Timestamp: this.NormalizeTimestamp(Post),
                                    ImgLink: File.img,
                                    VideoLink: File.video,
                                    DownloadLink: File.other
                                });

                                if (Object.keys(Gen).length !== 0) {
                                    this.DataDict.set(Title, Gen);
                                };

                                Syn.title(`（${this.CurrentPage}）`);
                                Syn.Log("Parsed Successful", { index: Index, title: Title, url: url, data: Gen }, { dev: General.Dev, collapsed: false });
                            } catch (error) {
                                Syn.Log(error, { index: Index, title: Title, url: url }, { dev: General.Dev, type: "error", collapsed: false });
                                continue;
                            }
                        }
                    }

                    await Syn.Sleep(this.FetchDelay);
                    return true; // 回傳完成
                } else { /* 之後在想 */ }
            }
        };

        /* ===== 輸出生成 ===== */

        async _Reset() {
            this.MetaDict = null;
            this.DataDict = null;
            this.Worker.terminate();
            // 上方操作是主動釋放 GC, 並不是必要的, 因為調用下載 Class 每次都是新的實例, 下方是必要的
            Process.Lock = false;
            Syn.title(this.TitleCache);
        };

        async _ToTxt() {
            let Content = "";
            for (const value of this.DataDict.values()) {
                const getLinks = Object.assign(
                    {},
                    value[Transl("ImgLink")],
                    value[Transl("VideoLink")],
                    value[Transl("DownloadLink")]
                );

                for (const link of Object.values(getLinks)) {
                    Content += `${encodeURI(link)}\n`;
                }
            }
            if (Content.endsWith('\n')) Content = Content.slice(0, -1); // 去除末行空白

            Syn.OutputTXT(Content, this.MetaDict.get(Transl("作者")), () => {
                Content = null;
                this._Reset();
            })
        };

        async _ToJson() {
            let Json_data = Object.assign(
                {},
                { [Transl("元數據")]: Object.fromEntries(this.MetaDict) },
                { [`${Transl("帖子內容")} (${this.DataDict.size})`]: Object.fromEntries(this.DataDict) }
            );

            Syn.OutputJson(Json_data, this.MetaDict.get(Transl("作者")), () => {
                Json_data = null;
                this._Reset();
            });
        };

    }
}