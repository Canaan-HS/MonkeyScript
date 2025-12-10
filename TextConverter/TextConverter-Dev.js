// ==UserScript==
// @name         簡易文本轉換器
// @version      2025.12.10
// @author       Canaan HS
// @description  高效將 指定文本 轉換為 自定文本

// @connect      *
// @match        *://yande.re/*
// @match        *://rule34.xxx/*
// @match        *://nhentai.to/*
// @match        *://nhentai.io/*
// @match        *://nhentai.net/*
// @match        *://nhentai.xxx/*
// @match        *://nhentaibr.com/*
// @match        *://nhentai.website/*
// @match        *://imhentai.xxx/*
// @match        *://konachan.com/*
// @match        *://danbooru.donmai.us/*

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635
// @icon         https://cdn-icons-png.flaticon.com/512/9616/9616859.png

// @noframes
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand

// @run-at       document-start
// ==/UserScript==

/**
 * Data Reference Sources:
 * https://github.com/EhTagTranslation/Database
 * https://github.com/DominikDoom/a1111-sd-webui-tagcomplete
 * https://github.com/scooderic/exhentai-tags-chinese-translation
 * https://greasyfork.org/zh-TW/scripts/20312-e-hentai-tag-list-for-chinese
 */

(async () => {
    const Config = {
        LoadDictionary: {
            /**
             * 載入數據庫類型 (要載入全部, 就輸入一個 "All_Words")
             *
             * 範例:
             * 單導入: "Short"
             * 無導入: [] or ""
             * 多導入: ["Short", "Long", "Tags"]
             * 自定導入: "自己的數據庫 Url" (建議網址是一個 Json, 導入的數據必須是 JavaScript 物件)
             *
             * 可導入字典
             *
             * ! 如果某些單字翻譯的很怪, 可以個別導入 但不導入 "Short", 或是導入 "Curated_Words"
             * ! Curated_Words 主要是, Parody, Character, Tags, 跟一些特殊單詞
             *
             * 全部: "All_Words"
             * 精選: "Curated_Words"
             * 標籤: "Tags"
             * 語言: "Language"
             * 角色: "Character"
             * 作品: "Parody"
             * 繪師: "Artist"
             * 社團: "Group"
             * 短單詞: "Short"
             * 長單詞: "Long"
             * 美化用: "Beautify"
             *
             * 參數 =>
             */
            Data: "All_Words"
        },
        TranslationReversal: {
            /**
             * !! 專注於反轉 (也不是 100% 反轉成功, 只是成功率較高)
             *
             * 1. 轉換時性能開銷較高
             * 2. 轉換時可能會有重複疊加錯誤
             *
             * !! 不專注於反轉
             *
             * 1. 性能開銷較低處理的更快
             * 2. 反轉時常常會有許多無法反轉的狀況 (通常是短句)
             */
            HotKey: true, // 啟用快捷反轉 (alt + v)
            FocusOnRecovery: false // 是否專注於反轉
        }
    };

    /**
     * 自定轉換字典  { "要轉換的字串": "轉換成的字串" }, 要轉換字串中, 如果包含英文, 全部都要小寫
     *
     * 自定字典的優先級更高, 他會覆蓋掉導入的字典
     */
    const Customize = {
        "apple": "蘋果", // 範例
    };

    /* ====================== 不瞭解不要修改下方參數 ===================== */

    // 解構設置, TranslationFactory 需要 Translation 的數據, 如果晚宣告會出錯
    const [LoadDict, Translation] = [Config.LoadDictionary, Config.TranslationReversal];

    const Dev = GM_getValue("Dev", false); // 開發者模式
    const Update = UpdateWordsDict(); // 更新函數

    let Dict = GM_getValue("LocalWords", null) ?? await Update.Reques(); // 本地翻譯字典 (無字典立即請求, 通常只會在第一次運行)
    let Translated = true; // 判斷翻譯狀態 (不要修改)

    const Dictionary = { // 字典操作
        NormalDict: undefined,
        ReverseDict: undefined,
        RefreshNormal() { // 正常字典的緩存
            this.NormalDict = Dict;
        },
        RefreshReverse() { // 刷新反向字典
            this.ReverseDict = Object.entries(this.NormalDict).reduce((acc, [key, value]) => {
                acc[value] = key;
                return acc;
            }, {});
        },
        RefreshDict() { // 刷新翻譯狀態
            Dict = Translated
                ? (
                    Translated = false,
                    this.RefreshReverse(),
                    this.ReverseDict
                ) : (
                    Translated = true,
                    this.NormalDict
                );
        },
        DisplayMemory() {
            const [NormalSize, ReverseSize] = [getObjectSize(this.NormalDict), getObjectSize(this.ReverseDict)];
            const fullMB = (
                Dict === this.NormalDict
                    ? NormalSize.MB
                    : NormalSize.MB + getObjectSize(Dict).MB
            ) + ReverseSize.MB;

            alert(`字典緩存大小
                \r一般字典大小: ${NormalSize.MB} MB
                \r反轉字典大小: ${ReverseSize.MB} MB
                \r全部緩存大小: ${fullMB.toFixed(2)} MB
            `);
        },
        ReleaseMemory() { // 釋放翻譯字典緩存 (不包含自定)
            Dict = this.NormalDict = this.ReverseDict = {};

            console.log("%c緩存已釋放", `
                padding: 5px;
                color: #43fdeeff;
                font-weight: bold;
                border-radius: 10px;
                background-color: #2b6eebff;
                border: 2px solid #2b6eebff;
            `);
        },
        Init() { // 初始化 (重新獲取完整字典, 並刷新兩種不同狀態的緩存)
            Object.assign(Dict, Customize);
            this.RefreshNormal();
        }
    };
    Dictionary.Init();

    WaitElem("body", () => { // 等待頁面載入
        const Transl = TranslationFactory(); // 翻譯工廠

        const processedNodes = new WeakSet();
        const observer = new MutationObserver(DebounceCollect((mutations) => {

            const toProcess = [];
            for (const mutation of mutations) {
                if (mutation.type === "characterData" && mutation.target.parentElement) {
                    // 如果是文字節點
                    const node = mutation.target.parentElement;
                    if (!processedNodes.has(node)) {
                        processedNodes.add(node);
                    }
                }
                else if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                    // 如果是子節點
                    for (const node of mutation.addedNodes) {
                        if ((node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) && !processedNodes.has(node)) {
                            processedNodes.add(node);
                            toProcess.push(node);
                        }
                    }
                }
                else if (mutation.type === "attributes" && mutation.attributeName === "placeholder") {
                    // 如果是 placeholder 屬性
                    const node = mutation.target;
                    if (!processedNodes.has(node)) {
                        processedNodes.add(node);
                        toProcess.push(node);
                    }
                }
            }

            if (toProcess.length > 0) {
                for (const node of toProcess) Transl.Trigger(node);
            }
        }, 600));


        // 啟動觀察 (啟動時會觸發轉換)
        const StartOb = () => {
            Transl.Trigger(document);
            observer.observe(document, {
                subtree: true, // 監視所有後代節點
                childList: true, // 監視子節點添加或移除
                characterData: true, // 監視文字內容變化
                attributes: true, // 監視屬性變化
                attributeFilter: ['placeholder'], // 只監視 placeholder 屬性
            })
        };

        // 斷開觀察
        const DisOB = () => observer.disconnect();
        !Dev && StartOb(); // 首次運行 (開發者模式下不會自動運行, 因為有可能轉換不回來)

        // 反轉 參數: (是否恢復監聽)
        function ThePolesAreReversed(RecoverOB = true) {
            DisOB();
            Dictionary.RefreshDict();

            // 恢復觀察的反轉, 與直接觸發的反轉
            RecoverOB ? StartOb() : Transl.Trigger(document);
        };

        /* ----- 創建按鈕 ----- */

        Menu({
            "🆕 更新字典": {
                desc: "獲取伺服器字典, 更新本地數據庫, 並在控制台打印狀態",
                func: async () => {
                    Translated = true;
                    GM_setValue("Clear", false);

                    ThePolesAreReversed(false); // 反轉一次, 並且不恢復觀察 (在更新前直接恢復一次, 是因為更新後 Dict 會被覆蓋, 可能會轉不回來)

                    Dict = await Update.Reques(); // 請求新的字典
                    Dictionary.Init(); // 更新後重新初始化 緩存

                    ThePolesAreReversed(); // 再次觸發反轉, 並恢復觀察
                }
            },
            "🚮 清空字典": {
                desc: "清除本地緩存的字典",
                func: () => {
                    GM_setValue("LocalWords", {});
                    GM_setValue("Clear", true);
                    location.reload();
                }
            },
            "⚛️ 兩極反轉": {
                hotkey: "c",
                close: false,
                desc: "互相反轉變更後的文本",
                func: () => ThePolesAreReversed()
            }
        }, "Basic");

        if (Dev || Translation.HotKey) {
            document.addEventListener("keydown", event => {
                if (event.altKey && event.key.toLowerCase() === "v") {
                    event.preventDefault();
                    ThePolesAreReversed();
                }
            })
        };

        if (Dev) {
            Translated = false;
            Menu({
                "« 🚫 停用開發者模式 »": {
                    desc: "關閉開發者模式", func: () => {
                        GM_setValue("Dev", false);
                        location.reload();
                    }
                },
                "🪧 展示匹配文本": {
                    desc: "在控制台打印匹配的文本, 建議先開啟控制台在運行",
                    func: () => Transl.Dev(document),
                    close: false
                },
                "🖨️ 輸出匹配文檔": {
                    desc: "以 Json 格式輸出, 頁面上被匹配到的所有文本",
                    func: () => Transl.Dev(document, false)
                },
                "📼 展示字典緩存": {
                    desc: "顯示當前載入的字典大小",
                    func: () => Dictionary.DisplayMemory()
                },
                "🧹 釋放字典緩存": {
                    desc: "將緩存於 JavaScript 記憶體內的字典數據釋放掉",
                    func: () => Dictionary.ReleaseMemory()
                }
            }, "Dev");
        } else {
            Menu({
                "« ✅ 啟用開發者模式 »": {
                    desc: "打開開發者模式", func: () => {
                        GM_setValue("Dev", true);
                        location.reload();
                    }
                }
            }, "Dev");
        };

        const CurrentTime = new Date().getTime(); // 當前時間戳
        const UpdateTime = GM_getValue("UpdateTime", false); // 紀錄時間戳

        if (!UpdateTime || (CurrentTime - new Date(UpdateTime).getTime()) > (36e5 * 24)) { // 24 小時更新
            Update.Reques().then(data => { // 不 await 的更新
                Dict = data;
                Dictionary.Init(); // 初始化
                ThePolesAreReversed(false); // 反轉兩次
                ThePolesAreReversed();
            })
        };
    });

    /* =========================================== */

    // requestIdleCallback 的 fallback
    const RenderWait = requestIdleCallback || ((callback) => {
        const startTime = Date.now();
        // 使用 setTimeout 延遲 1ms，將任務推到事件循環的末尾，模擬“空閒”
        return setTimeout(() => {
            // 執行回調，並傳入一個模擬的 deadline 對象
            callback({
                didTimeout: false, // 不處理 timeout，所以恆為 false
                timeRemaining: () => {
                    // 模擬一個 50ms 的時間預算, 返回預算減去已花費的時間
                    return Math.max(0, 50 - (Date.now() - startTime));
                },
            });
        }, 1);
    });

    /* 翻譯任務的調度程序 */
    function Scheduler() {
        let queue = [];
        let timeout = 1500;
        let isRunning = false;

        const processQueue = (deadline) => {

            while (deadline.timeRemaining() > 0 && queue.length > 0) {
                const task = queue.shift();
                try {
                    task.workFn();
                    task.resolver();
                } catch {
                    task.resolver();
                }
            }

            // 如果時間用完但任務仍在，預約下一次
            if (queue.length > 0) {
                RenderWait(processQueue, { timeout });
            } else {
                isRunning = false; // 所有任務完成
            }
        };

        return {
            wrap: (workFn) => {
                return new Promise(resolve => {
                    queue.push({ workFn, resolver: resolve });
                });
            },

            start: () => {
                if (isRunning || queue.length === 0) {
                    return;
                }

                isRunning = true;
                RenderWait(processQueue, { timeout });
            }
        }
    };

    /* 翻譯處理工廠 */
    function TranslationFactory() {
        const filterTags = new Set([
            // 腳本和樣式
            "SCRIPT", "STYLE", "NOSCRIPT",
            // 多媒體元素
            "SVG", "CANVAS", "IFRAME", "AUDIO", "VIDEO", "EMBED", "OBJECT", "SOURCE", "TRACK",
            // 代碼和預格式化文本
            "CODE", "KBD", "SAMP",
            // 不可見或特殊功能元素
            "TEMPLATE", "SLOT", "PARAM", "META", "LINK",
            // 圖片相關
            "IMG", "PICTURE", "FIGURE", "FIGCAPTION",
            // 特殊交互元素
            "MATH", "PORTAL"
        ]);

        function getTextNodes(root) {
            const tree = document.createTreeWalker(
                root,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        // 標籤過濾
                        const tag = node.parentElement;
                        if (!tag || filterTags.has(tag.tagName)) {
                            return NodeFilter.FILTER_REJECT;
                        }

                        // 檢查內容是否為空
                        const content = node.textContent.trim();
                        if (!content) return NodeFilter.FILTER_REJECT;

                        // 過濾明顯的代碼或屬性
                        if (
                            content.startsWith("src=") ||
                            content.startsWith("href=") ||
                            content.startsWith("data-") ||
                            content.startsWith("function ") ||
                            content.startsWith("const ") ||
                            content.startsWith("var ")
                        ) {
                            return NodeFilter.FILTER_REJECT;
                        }

                        // 代碼符號密度檢查
                        const codeSymbolCount = (content.match(/[{}[\]()<>]/g) || []).length;
                        if (codeSymbolCount > content.length * 0.2) {
                            return NodeFilter.FILTER_REJECT;
                        }

                        // 過濾全都是數字
                        if (/^\d+$/.test(content)) {
                            return NodeFilter.FILTER_REJECT;
                        }

                        // 過濾統計數量類型
                        if (/^\d+(\.\d+)?\s*[km]$/i.test(content)) {
                            return NodeFilter.FILTER_REJECT;
                        }

                        // 過濾非匹配字串
                        if (!/[\w\p{L}]/u.test(content)) {
                            return NodeFilter.FILTER_REJECT;
                        }

                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
            );

            const nodes = [];
            while (tree.nextNode()) {
                nodes.push(tree.currentNode);
            }
            return nodes;
        };

        const TCore = { // 翻譯核心
            __ShortWordRegex: /[\d\p{L}]+/gu,
            __LongWordRegex: /[\d\p{L}]+(?:[^|()\[\]{}{[(\t\n])+[\d\p{L}]\.*/gu,
            __Clean: (text) => text.trim().toLowerCase(),
            Dev_MatchObj(text) {
                const Sresult = text?.match(this.__ShortWordRegex)?.map(Short => {
                    const Clean = this.__Clean(Short);
                    return [Clean, Dict[Clean] ?? ""];
                }) ?? [];

                const Lresult = text?.match(this.__LongWordRegex)?.map(Long => {
                    const Clean = this.__Clean(Long);
                    return [Clean, Dict[Clean] ?? ""];
                }) ?? [];

                return [Sresult, Lresult]
                    .flat().filter(([Key, Value]) => Key && !/^\d+$/.test(Key)) // 過濾全都是數字 和 空的 key
                    .reduce((acc, [Key, Value]) => {
                        acc[Key] = Value;
                        return acc;
                    }, {});
            },
            OnlyLong(text) {
                return text?.replace(this.__LongWordRegex, Long => Dict[this.__Clean(Long)] ?? Long);
            },
            OnlyShort(text) {
                return text?.replace(this.__ShortWordRegex, Short => Dict[this.__Clean(Short)] ?? Short);
            },
            LongShort(text) { // 已長單詞為主, 不存在才去找短單詞
                return text?.replace(this.__LongWordRegex, Long => Dict[this.__Clean(Long)] ?? this.OnlyShort(Long));
            }
        };

        const RefreshUICore = {
            async FocusTextRecovery(textNode) {
                const originalContent = textNode.textContent;
                const longTranslated = TCore.OnlyLong(originalContent);

                if (originalContent !== longTranslated) {
                    textNode.textContent = longTranslated;
                }

                const shortTranslated = TCore.OnlyShort(textNode.textContent);
                if (textNode.textContent !== shortTranslated) {
                    textNode.textContent = shortTranslated;
                }
            },
            async FocusTextTranslate(textNode) {
                const originalContent = textNode.textContent;
                const translated = TCore.LongShort(originalContent);

                if (originalContent !== translated) {
                    textNode.textContent = translated;
                }
            },
            async FocusInputRecovery(inputNode) {
                // 處理 value
                const originalValue = inputNode.value;
                if (originalValue) {
                    const longTranslated = TCore.OnlyLong(originalValue);
                    if (originalValue !== longTranslated) {
                        inputNode.value = longTranslated;
                    }

                    const shortTranslated = TCore.OnlyShort(inputNode.value);
                    if (inputNode.value !== shortTranslated) {
                        inputNode.value = shortTranslated;
                    }
                }

                // 處理 placeholder
                const originalPlaceholder = inputNode.getAttribute("placeholder");
                if (originalPlaceholder) {
                    const longTranslated = TCore.OnlyLong(originalPlaceholder);
                    if (originalPlaceholder !== longTranslated) {
                        inputNode.setAttribute("placeholder", longTranslated);
                    }

                    const shortTranslated = TCore.OnlyShort(inputNode.getAttribute("placeholder"));
                    if (inputNode.getAttribute("placeholder") !== shortTranslated) {
                        inputNode.setAttribute("placeholder", shortTranslated);
                    }
                }
            },
            async FocusInputTranslate(inputNode) {
                // 處理 value
                const originalValue = inputNode.value;
                if (originalValue) {
                    const translated = TCore.LongShort(originalValue);
                    if (originalValue !== translated) {
                        inputNode.value = translated;
                    }
                }

                // 處理 placeholder
                const originalPlaceholder = inputNode.getAttribute("placeholder");
                if (originalPlaceholder) {
                    const translated = TCore.LongShort(originalPlaceholder);
                    if (originalPlaceholder !== translated) {
                        inputNode.setAttribute("placeholder", translated);
                    }
                }
            },
        };

        const ProcessingDataCore = {
            __FocusTextCore: Translation.FocusOnRecovery ? RefreshUICore.FocusTextRecovery : RefreshUICore.FocusTextTranslate,
            __FocusInputCore: Translation.FocusOnRecovery ? RefreshUICore.FocusInputRecovery : RefreshUICore.FocusInputTranslate,
            Dev_Operation(root, print) {
                const results = {};
                [
                    ...getTextNodes(root).map(textNode => textNode.textContent),
                    ...[...root.querySelectorAll("input[placeholder], input[value]")].map(inputNode =>
                        [inputNode.value, inputNode.getAttribute("placeholder")]).flat().filter(value => value && value != '')
                ].map(text => Object.assign(results, TCore.Dev_MatchObj(text)));

                if (Object.keys(results).length === 0) {
                    alert("沒有匹配的數據");
                    return;
                }

                if (print) console.table(results);
                else {
                    const Json = new Blob([JSON.stringify(results, null, 4)], { type: "application/json" });

                    const Link = document.createElement("a");
                    Link.href = URL.createObjectURL(Json);
                    Link.download = "MatchWords.json";
                    Link.click();

                    URL.revokeObjectURL(Link.href);
                    Link.remove();
                };
            },
            OperationText(root, scheduler) {
                requestIdleCallback
                return Promise.all(
                    getTextNodes(root).map(textNode => scheduler.wrap(() => this.__FocusTextCore(textNode)))
                )
            },
            OperationInput(root, scheduler) {
                return Promise.all(
                    [...root.querySelectorAll("input[placeholder], input[value]")]
                        .map(inputNode => scheduler.wrap(() => this.__FocusInputCore(inputNode)))
                )
            },
        };

        return {
            Dev(root, print = true) {
                ProcessingDataCore.Dev_Operation(root, print);
            },
            Trigger: (root) => {
                // 若是 Text Node，轉向 parentElement 處理
                if (root.nodeType === Node.TEXT_NODE && root.parentElement) {
                    const scheduler = Scheduler();
                    const textPromise = ProcessingDataCore.OperationText(root.parentElement, scheduler);
                    scheduler.start();

                    return Promise.all([textPromise]);
                }

                // 處理整頁或一般 element 節點
                if (
                    root === document ||
                    (root.nodeType === Node.ELEMENT_NODE) // 包含 document.body、div 等
                ) {
                    const scheduler = Scheduler();
                    const textPromise = ProcessingDataCore.OperationText(root, scheduler);
                    const inputPromise = ProcessingDataCore.OperationInput(root, scheduler);
                    scheduler.start();

                    return Promise.all([textPromise, inputPromise]);
                }

                // 若是可處理的 input 元素，直接處理
                if (
                    root.nodeType === Node.ELEMENT_NODE &&
                    root.tagName === "INPUT" &&
                    (root.hasAttribute("placeholder") || root.value)
                ) {
                    return ProcessingDataCore.__FocusInputCore(root);
                }

                return Promise.resolve(); // 其他類型忽略
            }
        };
    };

    /* 更新數據 */
    function UpdateWordsDict() {
        const ObjType = (object) => Object.prototype.toString.call(object).slice(8, -1);
        const Parse = { // 解析數據
            Url(str) {
                try {
                    new URL(str); return true;
                } catch { return false }
            },
            ExtenName(link) {
                try {
                    return link.match(/\.([^.]+)$/)[1].toLowerCase() || "json";
                } catch { return "json" }
            },
            Array(data) {
                data = data.filter(d => d.trim() !== ""); // 過濾空字串
                return { State: data.length > 0, Type: "arr", Data: data }
            },
            String: (data) => ({ State: data != "", Type: "str", Data: data }),
            Undefined: () => ({ State: false }),
        };

        // 請求字典
        const RequestDict = (data) => {
            // 解析請求的 Url 是完整的連結, 還是單個字串
            const URL = Parse.Url(data) ? data : `https://raw.githubusercontent.com/Canaan-HS/Script-DataBase/main/Words/${data}.json`;

            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    responseType: Parse.ExtenName(URL), // 自動解析類型
                    url: URL,
                    onload(response) {
                        if (response.status === 200) {
                            const data = response.response; // 只能獲取物件類型
                            if (typeof data === "object" && Object.keys(data).length > 0) {
                                resolve(data);
                            } else {
                                console.error("請求為空數據");
                                resolve({});
                            }
                        } else {
                            console.error("連線異常, 地址類型可能是錯的");
                            resolve({});
                        }
                    },
                    onerror(error) {
                        console.error("連線異常");
                        resolve({});
                    }
                })
            })
        };

        return {
            async Reques() {
                const { State, Type, Data } = Parse[ObjType(LoadDict?.Data)](LoadDict?.Data); // 解構數據 (避免可能的例外)
                const DefaultDict = Object.assign(GM_getValue("LocalWords", {}), Customize);

                // 當解構狀態為 false, 或有清理標記, 直接回傳預設字典
                if (!State || GM_getValue("Clear")) return DefaultDict;

                const CacheDict = {};
                if (Type == "str") Object.assign(CacheDict, await RequestDict(Data)); // 是字串直接傳遞
                else if (Type == "arr") { // 是列表的傳遞
                    for (const data of Data) {
                        Object.assign(CacheDict, await RequestDict(data));
                    }
                };

                if (Object.keys(CacheDict).length > 0) {
                    Object.assign(CacheDict, Customize); // 只保留新的字典

                    GM_setValue("UpdateTime", GetDate());
                    GM_setValue("LocalWords", CacheDict);

                    console.log("%c數據更新成功", `
                        padding: 5px;
                        color: #9BEC00;
                        font-weight: bold;
                        border-radius: 10px;
                        background-color: #597445;
                        border: 2px solid #597445;
                    `);

                    return CacheDict;
                } else {
                    console.log("%c數據更新失敗", `
                        padding: 5px;
                        color: #FF0000;
                        font-weight: bold;
                        border-radius: 10px;
                        background-color: #A91D3A;
                        border: 2px solid #A91D3A;
                    `);

                    return DefaultDict;
                };
            }
        }
    };

    /* 獲取對象大小 (據有誤差) */
    function getObjectSize(object) {
        const seenObjects = new WeakSet();
        const seenStrings = new Set();

        // V8 Pointer Compression: 指針 4 bytes, 標頭 12 bytes
        const bytesPerPointer = 4;
        const headerSize = 12;

        const align = (n) => Math.ceil(n / 8) * 8;

        const getType = (obj) => {
            if (obj === null) return 'Null';
            if (obj === undefined) return 'Undefined';
            return Object.prototype.toString.call(obj).slice(8, -1);
        };

        const calcString = (str) => {
            if (seenStrings.has(str)) return 0;
            seenStrings.add(str);

            let isTwoByte = false;
            for (let i = 0; i < str.length; i++) {
                if (str.charCodeAt(i) > 0xFF) {
                    isTwoByte = true;
                    break;
                }
            }
            return align(headerSize + str.length * (isTwoByte ? 2 : 1));
        };

        const getSizeRec = (value) => {
            const type = getType(value);
            if (type === 'Boolean') return 4;
            if (type === 'Number') {
                if (Number.isSafeInteger(value) && value >= -2147483648 && value <= 2147483647) return 0;
                return 12;
            }
            if (type === 'String') return calcString(value);
            if (type === 'Symbol') return value.description ? calcString(value.description) : 0;
            if (type === 'Null' || type === 'Undefined') return 0;

            if (seenObjects.has(value)) return 0;
            seenObjects.add(value);

            return handlers[type] ? handlers[type](value) : handlers.Object(value);
        };

        const handlers = {
            // 集合類型
            Array: (val) => {
                let bytes = headerSize + (val.length * bytesPerPointer);
                for (const item of val) bytes += getSizeRec(item);
                return align(bytes);
            },
            Object: (val) => {
                let bytes = headerSize;
                const keys = Object.keys(val);
                const symKeys = Object.getOwnPropertySymbols(val);

                // 屬性存儲結構開銷
                bytes += (keys.length + symKeys.length) * bytesPerPointer;

                for (const key of keys) {
                    bytes += calcString(key);
                    bytes += getSizeRec(val[key]);
                }
                for (const sym of symKeys) {
                    bytes += (sym.description || '').length * 2;
                    bytes += getSizeRec(val[sym]);
                }
                return align(bytes);
            },
            Set: (val) => {
                // Set 的底層實現比 Array 複雜，這裡估算 Table 結構開銷
                let bytes = headerSize + (val.size * bytesPerPointer * 2);
                for (const item of val) bytes += getSizeRec(item);
                return align(bytes);
            },
            Map: (val) => {
                let bytes = headerSize + (val.size * bytesPerPointer * 4);
                for (const [k, v] of val) {
                    bytes += getSizeRec(k) + getSizeRec(v);
                }
                return align(bytes);
            },

            // 特殊對象
            Date: () => align(headerSize + 8),

            RegExp: (val) => {
                // 正則是源碼字串 + 編譯後的機器碼(無法獲取)，這裡只算源碼
                return align(headerSize + 4 + calcString(val.toString()));
            },

            BigInt: (val) => {
                // BigInt 是對象，需計算具體位數
                const hexLen = val.toString(16).length;
                return align(headerSize + Math.ceil(hexLen / 2));
            },

            Error: (val) => {
                let bytes = headerSize;
                if (val.message) bytes += calcString(val.message);
                if (val.stack) bytes += calcString(val.stack);
                return align(bytes);
            },

            Promise: () => align(headerSize + (bytesPerPointer * 3)), // 狀態+結果+反應鏈

            // 只能算殼，無法遍歷內容
            WeakMap: () => align(headerSize + 32),
            WeakSet: () => align(headerSize + 24),

            // Binary 數據
            ArrayBuffer: (val) => align(headerSize + val.byteLength),
            DataView: () => align(headerSize + 24),
            Function: (val) => align(headerSize + val.toString().length),
        };

        [
            'Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array',
            'Uint16Array', 'Int32Array', 'Uint32Array', 'Float32Array',
            'Float64Array', 'BigInt64Array', 'BigUint64Array'
        ].forEach(type => {
            // 只算 View 對象本身，Buffer 會單獨算
            handlers[type] = () => align(headerSize + 24);
        });

        const totalBytes = getSizeRec(object);

        const units = ["Bytes", "KB", "MB", "GB"];
        return units.reduce((acc, unit, i) => {
            acc[unit] = Number(i === 0 ? totalBytes : (totalBytes / 1024 ** i).toFixed(2));
            return acc;
        }, {})
    };

    function DebounceCollect(func, delay) {
        let timer = null;
        let collectedMutations = []; // 用於收集所有 mutations

        return (mutations) => {
            clearTimeout(timer);
            collectedMutations.push(...mutations);
            timer = setTimeout(() => {
                func(collectedMutations);
                collectedMutations = [];
                timer = null;
            }, delay);
        }
    };

    function GetDate(format = null) {
        const date = new Date();
        const defaultFormat = "{year}-{month}-{date} {hour}:{minute}:{second}";

        const formatMap = {
            year: date.getFullYear(),
            month: (date.getMonth() + 1).toString().padStart(2, "0"),
            date: date.getDate().toString().padStart(2, "0"),
            hour: date.getHours().toString().padStart(2, "0"),
            minute: date.getMinutes().toString().padStart(2, "0"),
            second: date.getSeconds().toString().padStart(2, "0")
        };

        const generate = (temp) => temp.replace(/{([^}]+)}/g, (_, key) => formatMap[key] || "Error");
        return generate(typeof format === "string" ? format : defaultFormat);
    };

    function Menu(items, name = "Menu", index = 1) {
        for (let [show, item] of Object.entries(items)) {
            let id = `${name}-${index++}`;
            typeof item === "function" && (item = { func: item });

            GM_registerMenuCommand(show, () => { item.func() }, {
                id,
                title: item.desc,
                autoClose: item.close,
                accessKey: item.hotkey,
            });
        }
    };

    async function WaitElem(selector, found) {
        const Core = async function () {
            let AnimationFrame;
            let timer, result;

            const query = () => {
                result = document.getElementsByTagName(selector)[0];

                if (result) {
                    cancelAnimationFrame(AnimationFrame);
                    clearTimeout(timer);
                    found && found(result);
                } else {
                    AnimationFrame = requestAnimationFrame(query);
                }
            };

            AnimationFrame = requestAnimationFrame(query);

            timer = setTimeout(() => {
                cancelAnimationFrame(AnimationFrame);
            }, (1000 * 8));
        };

        if (document.visibilityState === "hidden") {
            document.addEventListener("visibilitychange", () => Core(), { once: true });
        } else Core();
    };
})();