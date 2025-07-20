export default function Fetch(
    General, Process, Transl, Syn, md5
) {
    return class FetchData {
        constructor(Delay, AdvancedFetch, ToLinkTxt) {
            this.MetaDict = {}; // 保存元數據
            this.DataDict = {}; // 保存最終數據
            this.RecordKey = `${decodeURIComponent(Syn.url)}-Complete`; // 緩存最終數據 (根據 Url 設置)

            this.TaskDict = new Map(); // 任務臨時數據

            this.Host = Syn.$domain;
            this.SourceURL = Syn.url;
            this.TitleCache = Syn.title();
            this.FirstURL = this.SourceURL.split("?o=")[0]; // 第一頁連結

            this.Pages = 1; // 預設開始抓取的頁數
            this.FinalPages = 10; // 預設最終抓取的頁數
            this.Progress = 0; // 用於顯示當前抓取進度
            this.OnlyMode = false; // 判斷獲取數據的模式
            this.FetchDelay = Delay; // 獲取延遲
            this.ToLinkTxt = ToLinkTxt; // 判斷是否輸出為連結文本
            this.AdvancedFetch = AdvancedFetch; // 判斷是否往內抓數據

            // 帖子內部連結
            this.PostURL = ID => `${this.FirstURL}/post/${ID}`;

            // 內部連結的 API 模板
            this.PostAPI = `${this.FirstURL}/post`.replace(this.Host, `${this.Host}/api/v1`);

            this.PreviewAPI = Url => // 將預覽頁面轉成 API 連結
                /[?&]o=/.test(Url)
                    ? Url.replace(this.Host, `${this.Host}/api/v1`).replace(/([?&]o=)/, "/posts-legacy$1")
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

            // 抓取檔案的副檔名
            this.Suffix = (Str) => {
                try {
                    return `${Str?.match(/\.([^.]+)$/)[1]?.trim()}`;
                } catch { // 無法判斷副檔名
                    return "";
                }
            }

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
                    const extension = this.Suffix(name);

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
                        FetchRequest(index, title, url);
                        processQueue();
                    } else {processing = false}
                }
                async function FetchRequest(index, title, url) {
                    fetch(url).then(response => {
                        if (response.ok) {
                            // 目前不同網站不一定都是 Json, 所以這裡用 text()
                            response.text().then(content => {
                                postMessage({ index, title, url, content, error: false });
                            });
                        } else {
                            postMessage({ index, title, url, content: "", error: true });
                        }
                    })
                    .catch(error => {
                        postMessage({ index, title, url, content: "", error: true });
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
        async FetchInit() {
            const Section = Syn.$q("section");

            if (Section) {
                Process.Lock = true; // 鎖定菜單的操作, 避免重複抓取

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

            if (Process.IsNeko) {
                const Item = Section.$qa(".card-list__items article");

                // 下一頁連結
                const Menu = Section.$q("a.pagination-button-after-current");
                if (Menu) {
                    // Menu.href
                }
            } else {
                this.Worker.postMessage({ index: 0, title: this.TitleCache, url: this.PreviewAPI(Url) });

                // 等待主頁數據
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

                // 等待內容數據
                await this.FetchContent(HomeData);

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

            // 恢復 FetchContent 處理數據格式
            const Cloned_HomeData = structuredClone(HomeData);
            Cloned_HomeData.content.results = [{ id: Id }]; // 修改數據
            Cloned_HomeData.content = JSON.stringify(Cloned_HomeData.content); // 轉換為字符串

            await this.FetchContent(Cloned_HomeData);
            Syn.Log("PostDate", this.DataDict, { collapsed: false });
            this.Reset();
        };

        /* 獲取帖子內部數據 */
        async FetchContent(Data) {
            this.Progress = 0; // 重置進度
            const { index, title, url, content } = Data; // 解構數據

            // 解析處理的數據
            if (Process.IsNeko) {

            } else {
                /* ----- 這邊是主頁的數據 ----- */
                const Json = JSON.parse(content);

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
                            const { index, title, url, content, error } = e.data;

                            if (resolvers.has(index)) {
                                const { resolve, reject } = resolvers.get(index);

                                try {
                                    if (!error) {
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
                                                        .map(name => this.Suffix(name))
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
                                                this.TaskDict.set(index, { title: Title, content: Gen });
                                            };

                                            resolve();
                                            Syn.title(`（${this.Pages} - ${++this.Progress}）`);
                                            Syn.Log("Request Successful", this.TaskDict, { dev: General.Dev, collapsed: false });
                                        } else throw new Error("Json Parse Failed");
                                    } else {
                                        throw new Error("Request Failed");
                                    }
                                } catch (error) {
                                    Syn.Log(error, { index: index, title: title, url: url }, { dev: General.Dev, type: "error", collapsed: false });
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
                                    this.TaskDict.set(Index, { title: Title, content: Gen });
                                };

                                Syn.title(`（${this.Pages}）`);
                                Syn.Log("Parsed Successful", this.TaskDict, { dev: General.Dev, collapsed: false });
                            } catch (error) {
                                Syn.Log(error, { title: Title, url: url }, { dev: General.Dev, type: "error", collapsed: false });
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

        async Reset() {
            Process.Lock = false;
            this.MetaDict = {};
            this.DataDict = {};
            this.Worker.terminate();
            // 上方操作是主動恢復 與 釋放 GC, 並不是必要的, 因為調用下載 Class 每次都是新的實例
            Syn.title(this.TitleCache);
        };

        async ToTxt() {
            let Content = "";
            for (const value of Object.values(this.DataDict)) {
                for (const link of Object.values(Object.assign({},
                    value[Transl("ImgLink")],
                    value[Transl("VideoLink")],
                    value[Transl("DownloadLink")]
                ))) {
                    Content += `${link}\n`;
                }
            }
            if (Content.endsWith('\n')) Content = Content.slice(0, -1); // 去除末行空白

            Syn.OutputTXT(Content, this.MetaDict[Transl("作者")], () => {
                Content = "";
                this.Reset();
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
                this.Reset();
            });
        };

    }
}