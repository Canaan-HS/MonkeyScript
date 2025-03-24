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

// @license      MIT
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
    const [ LoadDict, Translation ] = [ Config.LoadDictionary, Config.TranslationReversal ];
    const Dev = GM_getValue("Dev", false);
    const Update = UpdateWordsDict();
    const Transl = TranslationFactory();
    const Time = new Date().getTime();
    const Timestamp = GM_getValue("UpdateTime", false);
    let Translated = true;
    let TranslatedRecord = new Set();
    let Dict = GM_getValue("LocalWords", null) ?? await Update.Reques();
    const Dictionary = {
        NormalDict: undefined,
        ReverseDict: undefined,
        RefreshNormal: function() {
            this.NormalDict = Dict;
        },
        RefreshReverse: function() {
            this.ReverseDict = Object.entries(this.NormalDict).reduce((acc, [ key, value ]) => {
                acc[value] = key;
                return acc;
            }, {});
        },
        RefreshDict: function() {
            TranslatedRecord = new Set();
            Dict = Translated ? (Translated = false, this.ReverseDict) : (Translated = true, 
            this.NormalDict);
        },
        DisplayMemory: function() {
            const [ NormalSize, ReverseSize ] = [ objectSize(this.NormalDict), objectSize(this.ReverseDict) ];
            alert(`字典緩存大小
                \r一般字典大小: ${NormalSize.KB} KB
                \r反轉字典大小: ${ReverseSize.KB} KB
                \r全部緩存大小: ${NormalSize.MB * 2 + ReverseSize.MB} MB
            `);
        },
        ReleaseMemory: function() {
            Dict = this.NormalDict = this.ReverseDict = {};
        },
        Init: function() {
            Object.assign(Dict, Customize);
            this.RefreshNormal();
            this.RefreshReverse();
        }
    };
    Dictionary.Init();
    WaitElem("body", body => {
        const RunFactory = () => Transl.Trigger(body);
        const options = {
            subtree: true,
            childList: true,
            characterData: true
        };
        let mutation;
        const observer = new MutationObserver(Debounce((mutationsList, observer) => {
            for (mutation of mutationsList) {
                if (mutation.type === "childList" || mutation.type === "characterData") {
                    RunFactory();
                    break;
                }
            }
        }, 300));
        const StartOb = () => {
            RunFactory();
            observer.observe(body, options);
        };
        const DisOB = () => observer.disconnect();
        !Dev && StartOb();
        function ThePolesAreReversed(RecoverOB = true) {
            DisOB();
            Dictionary.RefreshDict();
            RecoverOB ? StartOb() : RunFactory();
        }
        Menu({
            "🆕 更新字典": {
                desc: "獲取伺服器字典, 更新本地數據庫, 並在控制台打印狀態",
                func: async () => {
                    Translated = true;
                    GM_setValue("Clear", false);
                    ThePolesAreReversed(false);
                    Dict = await Update.Reques();
                    Dictionary.Init();
                    ThePolesAreReversed();
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
            });
        }
        if (Dev) {
            Translated = false;
            Menu({
                "« 🚫 停用開發者模式 »": {
                    desc: "關閉開發者模式",
                    func: () => {
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
                    desc: "打開開發者模式",
                    func: () => {
                        GM_setValue("Dev", true);
                        location.reload();
                    }
                }
            }, "Dev");
        }
        if (!Timestamp || Time - new Date(Timestamp).getTime() > 36e5 * 24) {
            Update.Reques().then(data => {
                Dict = data;
                Dictionary.Init();
                ThePolesAreReversed(false);
                ThePolesAreReversed();
            });
        }
    });
    function TranslationFactory() {
        function getTextNodes(root) {
            const tree = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                acceptNode: node => {
                    const tag = node.parentElement.tagName;
                    if (tag === "STYLE" || tag === "SCRIPT") {
                        return NodeFilter.FILTER_REJECT;
                    }
                    const content = node.textContent.trim();
                    if (content == "") return NodeFilter.FILTER_REJECT;
                    if (!/[\w\p{L}]/u.test(content) || /^\d+$/.test(content) || /^\d+(\.\d+)?\s*[km]$/i.test(content)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            });
            const nodes = [];
            while (tree.nextNode()) {
                nodes.push(tree.currentNode);
            }
            return nodes;
        }
        const TCore = {
            __ShortWordRegex: /[\d\p{L}]+/gu,
            __LongWordRegex: /[\d\p{L}]+(?:[^()\[\]{}{[(\t\n])+[\d\p{L}]\.*/gu,
            __Clean: text => text.trim().toLowerCase(),
            Dev_MatchObj: function(text) {
                const Sresult = text?.match(this.__ShortWordRegex)?.map(Short => {
                    const Clean = this.__Clean(Short);
                    return [ Clean, Dict[Clean] ?? "" ];
                }) ?? [];
                const Lresult = text?.match(this.__LongWordRegex)?.map(Long => {
                    const Clean = this.__Clean(Long);
                    return [ Clean, Dict[Clean] ?? "" ];
                }) ?? [];
                return [ Sresult, Lresult ].flat().filter(([ Key, Value ]) => Key && !/^\d+$/.test(Key)).reduce((acc, [ Key, Value ]) => {
                    acc[Key] = Value;
                    return acc;
                }, {});
            },
            OnlyLong: function(text) {
                return text?.replace(this.__LongWordRegex, Long => Dict[this.__Clean(Long)] ?? Long);
            },
            OnlyShort: function(text) {
                return text?.replace(this.__ShortWordRegex, Short => Dict[this.__Clean(Short)] ?? Short);
            },
            LongShort: function(text) {
                return text?.replace(this.__LongWordRegex, Long => Dict[this.__Clean(Long)] ?? this.OnlyShort(Long));
            }
        };
        const RefreshUICore = {
            FocusTextRecovery: async textNode => {
                textNode.textContent = TCore.OnlyLong(textNode.textContent);
                textNode.textContent = TCore.OnlyShort(textNode.textContent);
            },
            FocusTextTranslate: async textNode => {
                textNode.textContent = TCore.LongShort(textNode.textContent);
            },
            FocusInputRecovery: async inputNode => {
                inputNode.value = TCore.OnlyLong(inputNode.value);
                inputNode.value = TCore.OnlyShort(inputNode.value);
                inputNode.setAttribute("placeholder", TCore.OnlyLong(inputNode.getAttribute("placeholder")));
                inputNode.setAttribute("placeholder", TCore.OnlyShort(inputNode.getAttribute("placeholder")));
            },
            FocusInputTranslate: async inputNode => {
                inputNode.value = TCore.LongShort(inputNode.value);
                inputNode.setAttribute("placeholder", TCore.LongShort(inputNode.getAttribute("placeholder")));
            }
        };
        const ProcessingDataCore = {
            __FocusTextCore: Translation.FocusOnRecovery ? RefreshUICore.FocusTextRecovery : RefreshUICore.FocusTextTranslate,
            __FocusInputCore: Translation.FocusOnRecovery ? RefreshUICore.FocusInputRecovery : RefreshUICore.FocusInputTranslate,
            Dev_Operation: function(root, print) {
                const results = {};
                [ ...getTextNodes(root).map(textNode => textNode.textContent), ...[ ...root.querySelectorAll("input[placeholder], input[value]") ].map(inputNode => [ inputNode.value, inputNode.getAttribute("placeholder") ]).flat().filter(value => value && value != "") ].map(text => Object.assign(results, TCore.Dev_MatchObj(text)));
                if (print) console.table(results); else {
                    const Json = document.createElement("a");
                    Json.href = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(results, null, 4))}`;
                    Json.download = "MatchWords.json";
                    Json.click();
                    setTimeout(() => {
                        Json.remove();
                    }, 500);
                }
            },
            OperationText: async function(root) {
                return Promise.all(getTextNodes(root).map(textNode => {
                    if (TranslatedRecord.has(textNode)) return Promise.resolve();
                    TranslatedRecord.add(textNode);
                    return this.__FocusTextCore(textNode);
                }));
            },
            OperationInput: async function(root) {
                return Promise.all([ ...root.querySelectorAll("input[placeholder]") ].map(inputNode => {
                    if (TranslatedRecord.has(inputNode)) return Promise.resolve();
                    TranslatedRecord.add(inputNode);
                    return this.__FocusInputCore(inputNode);
                }));
            }
        };
        return {
            Dev: (root, print = true) => {
                ProcessingDataCore.Dev_Operation(root, print);
            },
            Trigger: async root => {
                await Promise.all([ ProcessingDataCore.OperationText(root), ProcessingDataCore.OperationInput(root) ]);
            }
        };
    }
    function UpdateWordsDict() {
        const ObjType = object => Object.prototype.toString.call(object).slice(8, -1);
        const Parse = {
            Url: str => {
                try {
                    new URL(str);
                    return true;
                } catch {
                    return false;
                }
            },
            ExtenName: link => {
                try {
                    return link.match(/\.([^.]+)$/)[1].toLowerCase() || "json";
                } catch {
                    return "json";
                }
            },
            Array: data => {
                data = data.filter(d => d.trim() !== "");
                return {
                    State: data.length > 0,
                    Type: "arr",
                    Data: data
                };
            },
            String: data => {
                return {
                    State: data != "",
                    Type: "str",
                    Data: data
                };
            },
            Undefined: () => {
                return {
                    State: false
                };
            }
        };
        const RequestDict = data => {
            const URL = Parse.Url(data) ? data : `https://raw.githubusercontent.com/Canaan-HS/Script-DataBase/main/Words/${data}.json`;
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    responseType: Parse.ExtenName(URL),
                    url: URL,
                    onload: response => {
                        if (response.status === 200) {
                            const data = response.response;
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
                });
            });
        };
        return {
            Reques: async () => {
                const {
                    State,
                    Type,
                    Data
                } = Parse[ObjType(LoadDict?.Data)](LoadDict?.Data);
                const DefaultDict = Object.assign(GM_getValue("LocalWords", {}), Customize);
                if (!State || GM_getValue("Clear")) return DefaultDict;
                const CacheDict = {};
                if (Type == "str") Object.assign(CacheDict, await RequestDict(Data)); else if (Type == "arr") {
                    for (const data of Data) {
                        Object.assign(CacheDict, await RequestDict(data));
                    }
                }
                if (Object.keys(CacheDict).length > 0) {
                    Object.assign(CacheDict, Customize);
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
                }
            }
        };
    }
    function objectSize(object) {
        const Type = obj => Object.prototype.toString.call(obj).slice(8, -1);
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
            String: value => value.length * 2,
            RegExp: value => value.toString().length * 2,
            Symbol: value => (value.description || "").length * 2,
            DataView: value => value.byteLength,
            TypedArray: value => value.byteLength,
            ArrayBuffer: value => value.byteLength,
            Array: (value, cache) => calculateCollectionSize(value, cache, function*(arr) {
                for (const item of arr) {
                    yield [ item ];
                }
            }),
            Set: (value, cache) => calculateCollectionSize(value, cache, function*(set) {
                for (const item of set) {
                    yield [ item ];
                }
            }),
            Object: (value, cache) => calculateCollectionSize(value, cache, function*(obj) {
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        yield [ key, obj[key] ];
                    }
                }
            }),
            Map: (value, cache) => calculateCollectionSize(value, cache, function*(map) {
                for (const [ key, val ] of map) {
                    yield [ key, val ];
                }
            })
        };
        const bytes = Calculate[Type(object)]?.(object, new WeakSet()) ?? 0;
        return {
            Bytes: bytes,
            KB: (bytes / 1024).toFixed(2),
            MB: (bytes / 1024 / 1024).toFixed(2)
        };
    }
    function Debounce(func, delay = 100) {
        let timer = null;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(function() {
                func(...args);
            }, delay);
        };
    }
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
        const generate = temp => temp.replace(/{([^}]+)}/g, (_, key) => formatMap[key] || "Error");
        return generate(typeof format === "string" ? format : defaultFormat);
    }
    async function Menu(Item, ID = "Menu", Index = 1) {
        for (const [ Name, options ] of Object.entries(Item)) {
            GM_registerMenuCommand(Name, () => {
                options.func();
            }, {
                title: options.desc,
                id: `${ID}-${Index++}`,
                autoClose: options.close,
                accessKey: options.hotkey
            });
        }
    }
    async function WaitElem(selector, found) {
        const observer = new MutationObserver(Debounce(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                found(element);
            }
        }));
        observer.observe(document, {
            subtree: true,
            childList: true,
            attributes: true,
            characterData: true
        });
    }
})();