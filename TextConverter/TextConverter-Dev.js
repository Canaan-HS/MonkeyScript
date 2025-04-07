// ==UserScript==
// @name         簡易文本轉換器
// @version      0.0.1-Beta2
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
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
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
             * ! 如果某些單字翻譯的很怪, 可以個別導入 但不導入 "Short"
             *
             * 全部: "All_Words"
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
            FocusOnRecovery: true // 是否專注於反轉
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

    // 解構設置
    const [LoadDict, Translation] = [Config.LoadDictionary, Config.TranslationReversal];

    // Transl 會調用 Translation 的數據, 如果晚宣告會找不到
    const Dev = GM_getValue("Dev", false); // 開發者模式
    const Update = UpdateWordsDict(); // 更新函數
    const Transl = TranslationFactory(); // 翻譯函數
    const Time = new Date().getTime(); // 當前時間戳
    const Timestamp = GM_getValue("UpdateTime", false); // 紀錄時間戳

    let Translated = true; // 判斷翻譯狀態 (不要修改)
    let TranslatedRecord = new Set(); // 紀錄翻譯紀錄, 避免疊加轉換問題
    let Dict = GM_getValue("LocalWords", null) ?? await Update.Reques(); // 本地翻譯字典 (無字典立即請求, 通常只會在第一次運行)

    const Dictionary = { // 字典操作
        NormalDict: undefined,
        ReverseDict: undefined,
        RefreshNormal: function () { // 正常字典的緩存
            this.NormalDict = Dict;
        },
        RefreshReverse: function () { // 刷新反向字典
            this.ReverseDict = Object.entries(this.NormalDict).reduce((acc, [key, value]) => {
                acc[value] = key;
                return acc;
            }, {});
        },
        RefreshDict: function () { // 刷新翻譯狀態
            TranslatedRecord = new Set(); // 刷新翻譯紀錄
            Dict = Translated
                ? (
                    Translated = false,
                    this.ReverseDict
                ) : (
                    Translated = true,
                    this.NormalDict
                );
        },
        DisplayMemory: function () {
            const [NormalSize, ReverseSize] = [objectSize(this.NormalDict), objectSize(this.ReverseDict)];
            alert(`字典緩存大小
                \r一般字典大小: ${NormalSize.KB} KB
                \r反轉字典大小: ${ReverseSize.KB} KB
                \r全部緩存大小: ${NormalSize.MB * 2 + ReverseSize.MB} MB
            `);
        },
        ReleaseMemory: function () { // 釋放翻譯字典緩存 (不包含自定)
            Dict = this.NormalDict = this.ReverseDict = {};
        },
        Init: function () { // 初始化 (重新獲取完整字典, 並刷新兩種不同狀態的緩存)
            Object.assign(Dict, Customize);
            this.RefreshNormal();
            this.RefreshReverse();
        }
    };
    Dictionary.Init();

    WaitElem("body", body => { // 等待頁面載入
        const RunFactory = () => Transl.Trigger(body);

        const observer = new MutationObserver(Debounce((mutations) => {
            const hasRelevantChanges = mutations.some(mutation => 
                mutation.type === "childList" || mutation.type === "characterData"
            );
            hasRelevantChanges && RunFactory(); // 監聽到變化就觸發轉換
        }, 300));

        // 啟動觀察 (啟動時會觸發轉換)
        const StartOb = () => {
            RunFactory();
            observer.observe(body, {
                subtree: true, // 監視所有後代節點
                childList: true, // 監視子節點添加或移除
                characterData: true, // 監視文字內容變化
                attributeFilter: ['placeholder'], // 監視屬性變化
            })
        };

        // 斷開觀察
        const DisOB = () => observer.disconnect();
        !Dev && StartOb(); // 首次運行 (開發者模式下不會自動運行, 因為有可能轉換不回來)

        // 反轉 參數: (是否恢復監聽)
        function ThePolesAreReversed(RecoverOB = true) {
            DisOB();
            Dictionary.RefreshDict();

            // 不恢復觀察, 就由該函數直接觸發轉換
            RecoverOB ? StartOb() : RunFactory();
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
                    func: () => Transl.Dev(body),
                    close: false
                },
                "🖨️ 輸出匹配文檔": {
                    desc: "以 Json 格式輸出, 頁面上被匹配到的所有文本",
                    func: () => Transl.Dev(body, false)
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

        if (!Timestamp || (Time - new Date(Timestamp).getTime()) > (36e5 * 24)) { // 24 小時更新
            Update.Reques().then(data => { // 不 await 的更新
                Dict = data;
                Dictionary.Init(); // 初始化
                ThePolesAreReversed(false); // 反轉兩次
                ThePolesAreReversed();
            })
        };
    });

    /* =========================================== */

    /* 翻譯處理工廠 */
    function TranslationFactory() {
        function getTextNodes(root) {
            const tree = document.createTreeWalker(
                root,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        // 標籤過濾
                        const tag = node.parentElement.tagName;
                        if (tag === "STYLE" || tag === "SCRIPT" || tag === "CODE" ||
                            tag === "PRE" || tag === "NOSCRIPT" || tag === "SVG") {
                            return NodeFilter.FILTER_REJECT;
                        }

                        // 檢查內容是否為空
                        const content = node.textContent.trim();
                        if (!content) return NodeFilter.FILTER_REJECT;

                        // 過濾明顯的代碼或屬性
                        if (content.startsWith("src=") || content.startsWith("href=") ||
                            content.startsWith("data-") || content.startsWith("function ") ||
                            content.startsWith("const ") || content.startsWith("var ")) {
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
            Dev_MatchObj: function (text) {
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
            OnlyLong: function (text) {
                return text?.replace(this.__LongWordRegex, Long => Dict[this.__Clean(Long)] ?? Long);
            },
            OnlyShort: function (text) {
                return text?.replace(this.__ShortWordRegex, Short => Dict[this.__Clean(Short)] ?? Short);
            },
            LongShort: function (text) { // 已長單詞為主, 不存在才去找短單詞
                return text?.replace(this.__LongWordRegex, Long => Dict[this.__Clean(Long)] ?? this.OnlyShort(Long));
            }
        };

        const RefreshUICore = {
            FocusTextRecovery: async (textNode) => {
                textNode.textContent = TCore.OnlyLong(textNode.textContent);
                textNode.textContent = TCore.OnlyShort(textNode.textContent);
            },
            FocusTextTranslate: async (textNode) => {
                textNode.textContent = TCore.LongShort(textNode.textContent);
            },
            FocusInputRecovery: async (inputNode) => {
                inputNode.value = TCore.OnlyLong(inputNode.value);
                inputNode.value = TCore.OnlyShort(inputNode.value);
                inputNode.setAttribute("placeholder", TCore.OnlyLong(inputNode.getAttribute("placeholder")));
                inputNode.setAttribute("placeholder", TCore.OnlyShort(inputNode.getAttribute("placeholder")));
            },
            FocusInputTranslate: async (inputNode) => {
                inputNode.value = TCore.LongShort(inputNode.value);
                inputNode.setAttribute("placeholder", TCore.LongShort(inputNode.getAttribute("placeholder")));
            },
        };

        const ProcessingDataCore = {
            __FocusTextCore: Translation.FocusOnRecovery ? RefreshUICore.FocusTextRecovery : RefreshUICore.FocusTextTranslate,
            __FocusInputCore: Translation.FocusOnRecovery ? RefreshUICore.FocusInputRecovery : RefreshUICore.FocusInputTranslate,
            Dev_Operation: function (root, print) {
                const results = {};
                [
                    ...getTextNodes(root).map(textNode => textNode.textContent),
                    ...[...root.querySelectorAll("input[placeholder], input[value]")].map(inputNode =>
                        [inputNode.value, inputNode.getAttribute("placeholder")]).flat().filter(value => value && value != '')
                ].map(text => Object.assign(results, TCore.Dev_MatchObj(text)));

                if (print) console.table(results);
                else {
                    const Json = document.createElement("a");
                    Json.href = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(results, null, 4))}`;
                    Json.download = "MatchWords.json";
                    Json.click();
                    setTimeout(() => { Json.remove() }, 500);
                };
            },
            OperationText: async function (root) {
                return Promise.all(getTextNodes(root).map(textNode => {
                    if (TranslatedRecord.has(textNode)) return Promise.resolve(); // 無腦制止翻譯無限疊加狀況 (當然會導致記憶體使用更多) (會有疊加是因為監聽動態變化 反覆觸發)
                    TranslatedRecord.add(textNode);
                    return this.__FocusTextCore(textNode)
                }));
            },
            OperationInput: async function (root) {
                return Promise.all([...root.querySelectorAll("input[placeholder]")].map(inputNode => {
                    if (TranslatedRecord.has(inputNode)) return Promise.resolve();
                    TranslatedRecord.add(inputNode);
                    return this.__FocusInputCore(inputNode)
                }));
            },
        };

        return {
            Dev: (root, print = true) => {
                ProcessingDataCore.Dev_Operation(root, print);
            },
            Trigger: async (root) => {
                await Promise.all([
                    ProcessingDataCore.OperationText(root),
                    ProcessingDataCore.OperationInput(root)
                ]);
            }
        };
    };

    /* 更新數據 */
    function UpdateWordsDict() {
        const ObjType = (object) => Object.prototype.toString.call(object).slice(8, -1);
        const Parse = { // 解析數據
            Url: (str) => {
                try {
                    new URL(str); return true;
                } catch { return false }
            },
            ExtenName: (link) => {
                try {
                    return link.match(/\.([^.]+)$/)[1].toLowerCase() || "json";
                } catch { return "json" }
            },
            Array: (data) => {
                data = data.filter(d => d.trim() !== ""); // 過濾空字串
                return { State: data.length > 0, Type: "arr", Data: data }
            },
            String: (data) => { return { State: data != "", Type: "str", Data: data } },
            Undefined: () => { return { State: false } },
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
                    onload: response => {
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
                    onerror: error => {
                        console.error("連線異常");
                        resolve({});
                    }
                })
            })
        };

        return {
            Reques: async () => {
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

    /* 獲取對象大小 */
    function objectSize(object) {
        const Type = (obj) => Object.prototype.toString.call(obj).slice(8, -1);
        const calculateCollectionSize = (value, cache, iteratee) => {
            if (!value || cache.has(value)) return 0;
            cache.add(value);
            let bytes = 0;
            for (const item of iteratee(value)) {
                bytes += Calculate[Type(item[0])]?.(item[0], cache) ?? 0;
                bytes += Calculate[Type(item[1])]?.(item[1], cache) ?? 0;
            }
            return bytes;
        };
        const Calculate = {
            Boolean: () => 4,
            Date: () => 8,
            Number: () => 8,
            String: (value) => value.length * 2,
            RegExp: (value) => value.toString().length * 2,
            Symbol: (value) => (value.description || '').length * 2,
            DataView: (value) => value.byteLength,
            TypedArray: (value) => value.byteLength,
            ArrayBuffer: (value) => value.byteLength,
            Array: (value, cache) => calculateCollectionSize(value, cache, function* (arr) {
                for (const item of arr) {
                    yield [item];
                }
            }),
            Set: (value, cache) => calculateCollectionSize(value, cache, function* (set) {
                for (const item of set) {
                    yield [item];
                }
            }),
            Object: (value, cache) => calculateCollectionSize(value, cache, function* (obj) {
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        yield [key, obj[key]];
                    }
                }
            }),
            Map: (value, cache) => calculateCollectionSize(value, cache, function* (map) {
                for (const [key, val] of map) {
                    yield [key, val];
                }
            })
        };

        const bytes = Calculate[Type(object)]?.(object, new WeakSet()) ?? 0;
        return {
            Bytes: bytes,
            KB: (bytes / 1024).toFixed(2),
            MB: (bytes / 1024 / 1024).toFixed(2)
        };
    };

    function Debounce(func, delay = 100) {
        let timer = null;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(function () {
                func(...args);
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

    async function Menu(Item, ID = "Menu", Index = 1) {
        for (const [Name, options] of Object.entries(Item)) {
            GM_registerMenuCommand(Name, () => { options.func() }, {
                title: options.desc,
                id: `${ID}-${Index++}`,
                autoClose: options.close,
                accessKey: options.hotkey,
            });
        }
    }

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