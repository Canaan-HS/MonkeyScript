// ==UserScript==
// @name         簡易文本轉換器
// @version      2026.08.12-Beta
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
// @grant        window.onurlchange
// @grant        GM_registerMenuCommand

// @run-at       document-start
// ==/UserScript==

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
    const [LoadDict, Translation] = [Config.LoadDictionary, Config.TranslationReversal];
    const Dev = GM_getValue("Dev", false);
    const Update = updateWordsDict();
    let Dict = GM_getValue("LocalWords", null) ?? await Update.reques();
    let Translated = true;
    const Dictionary = {
        NormalDict: undefined,
        ReverseDict: undefined,
        RefreshNormal() {
            this.NormalDict = Dict;
        },
        RefreshReverse() {
            this.ReverseDict = Object.entries(this.NormalDict).reduce((acc, [key, value]) => {
                acc[value] = key;
                return acc;
            }, {});
        },
        RefreshDict() {
            Dict = Translated ? (Translated = false, this.RefreshReverse(), this.ReverseDict) : (Translated = true,
                this.NormalDict);
        },
        DisplayMemory() {
            const [NormalSize, ReverseSize] = [getObjectSize(this.NormalDict), getObjectSize(this.ReverseDict)];
            const fullMB = (Dict === this.NormalDict ? NormalSize.MB : NormalSize.MB + getObjectSize(Dict).MB) + ReverseSize.MB;
            alert(`字典緩存大小
                \r一般字典大小: ${NormalSize.MB} MB
                \r反轉字典大小: ${ReverseSize.MB} MB
                \r全部緩存大小: ${fullMB.toFixed(2)} MB
            `);
        },
        ReleaseMemory() {
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
        Init() {
            Object.assign(Dict, Customize);
            this.RefreshNormal();
        }
    };
    Dictionary.Init();
    waitElem("body", body => {
        const Transl = translationFactory();
        const processedNodes = new WeakSet();
        const observer = new MutationObserver(debounceCollect(mutations => {
            const toProcess = [];
            for (const mutation of mutations) {
                if (mutation.type === "characterData" && mutation.target.parentElement) {
                    const node = mutation.target.parentElement;
                    if (!processedNodes.has(node)) {
                        processedNodes.add(node);
                    }
                } else if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if ((node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) && !processedNodes.has(node)) {
                            processedNodes.add(node);
                            toProcess.push(node);
                        }
                    }
                } else if (mutation.type === "attributes" && mutation.attributeName === "placeholder") {
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
        const startOb = () => {
            Transl.Trigger();
            observer.observe(body, {
                subtree: true,
                childList: true,
                characterData: true,
                attributes: true,
                attributeFilter: ["placeholder"]
            });
        };
        window.addEventListener("urlchange", () => {
            Transl.Trigger();
        });
        const DisOB = () => observer.disconnect();
        !Dev && startOb();
        function ThePolesAreReversed(RecoverOB = true) {
            DisOB();
            Dictionary.RefreshDict();
            RecoverOB ? startOb() : Transl.Trigger();
        }
        regMenu({
            "🆕 更新字典": {
                desc: "獲取伺服器字典, 更新本地數據庫, 並在控制台打印狀態",
                func: async () => {
                    Translated = true;
                    GM_setValue("Clear", false);
                    ThePolesAreReversed(false);
                    Dict = await Update.reques();
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
            regMenu({
                "« 🚫 停用開發者模式 »": {
                    desc: "關閉開發者模式",
                    func: () => {
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
            regMenu({
                "« ✅ 啟用開發者模式 »": {
                    desc: "打開開發者模式",
                    func: () => {
                        GM_setValue("Dev", true);
                        location.reload();
                    }
                }
            }, "Dev");
        }
        const CurrentTime = new Date().getTime();
        const UpdateTime = GM_getValue("UpdateTime", false);
        if (!UpdateTime || CurrentTime - new Date(UpdateTime).getTime() > 36e5 * 24) {
            Update.reques().then(data => {
                Dict = data;
                Dictionary.Init();
                ThePolesAreReversed(false);
                ThePolesAreReversed();
            });
        }
    });
    const renderWait = requestIdleCallback || (callback => {
        const startTime = Date.now();
        return setTimeout(() => {
            callback({
                didTimeout: false,
                timeRemaining: () => {
                    return Math.max(0, 50 - (Date.now() - startTime));
                }
            });
        }, 1);
    });
    const scheduler = (() => {
        let queue = [];
        let timeout = 1500;
        let isRunning = false;
        const processQueue = deadline => {
            while (deadline.timeRemaining() > 0 && queue.length > 0) {
                const task = queue.shift();
                try {
                    task.workFn();
                    task.resolver();
                } catch {
                    task.resolver();
                }
            }
            if (queue.length > 0) {
                renderWait(processQueue, {
                    timeout: timeout
                });
            } else {
                isRunning = false;
            }
        };
        return {
            wrap: workFn => {
                return new Promise(resolve => {
                    queue.push({
                        workFn: workFn,
                        resolver: resolve
                    });
                });
            },
            start: () => {
                if (isRunning || queue.length === 0) {
                    return;
                }
                isRunning = true;
                renderWait(processQueue, {
                    timeout: timeout
                });
            }
        };
    })();
    function translationFactory() {
        const filterTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "CANVAS", "IFRAME", "AUDIO", "VIDEO", "EMBED", "OBJECT", "SOURCE", "TRACK", "CODE", "KBD", "SAMP", "TEMPLATE", "SLOT", "PARAM", "META", "LINK", "IMG", "PICTURE", "FIGURE", "FIGCAPTION", "MATH", "PORTAL"]);
        function getTextNodes(root) {
            const tree = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                acceptNode: node => {
                    const parent = node.parentElement;
                    if (filterTags.has(parent?.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    const content = node.textContent.trim();
                    if (!content) return NodeFilter.FILTER_REJECT;
                    if (/^\d+$/.test(content)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (/^\d+(\.\d+)?\s*[km]$/i.test(content)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (!/[\w\p{L}]/u.test(content)) {
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
            __LongWordRegex: /[\d\p{L}]+(?:[^|()\[\]{}{[(\t\n])+[\d\p{L}]\.*/gu,
            __Clean: text => text.trim().toLowerCase(),
            Dev_MatchObj(text) {
                const Sresult = text?.match(this.__ShortWordRegex)?.map(Short => {
                    const Clean = this.__Clean(Short);
                    return [Clean, Dict[Clean] ?? ""];
                }) ?? [];
                const Lresult = text?.match(this.__LongWordRegex)?.map(Long => {
                    const Clean = this.__Clean(Long);
                    return [Clean, Dict[Clean] ?? ""];
                }) ?? [];
                return [Sresult, Lresult].flat().filter(([Key, Value]) => Key && !/^\d+$/.test(Key)).reduce((acc, [Key, Value]) => {
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
            LongShort(text) {
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
                const originalValue = inputNode.value;
                if (originalValue) {
                    const translated = TCore.LongShort(originalValue);
                    if (originalValue !== translated) {
                        inputNode.value = translated;
                    }
                }
                const originalPlaceholder = inputNode.getAttribute("placeholder");
                if (originalPlaceholder) {
                    const translated = TCore.LongShort(originalPlaceholder);
                    if (originalPlaceholder !== translated) {
                        inputNode.setAttribute("placeholder", translated);
                    }
                }
            }
        };
        const ProcessingDataCore = {
            __FocusTextCore: Translation.FocusOnRecovery ? RefreshUICore.FocusTextRecovery : RefreshUICore.FocusTextTranslate,
            __FocusInputCore: Translation.FocusOnRecovery ? RefreshUICore.FocusInputRecovery : RefreshUICore.FocusInputTranslate,
            Dev_Operation(root, print) {
                const results = {};
                [...getTextNodes(root).map(textNode => textNode.textContent), ...[...root.querySelectorAll("input[placeholder], input[value]")].map(inputNode => [inputNode.value, inputNode.getAttribute("placeholder")]).flat().filter(value => value && value != "")].map(text => Object.assign(results, TCore.Dev_MatchObj(text)));
                if (Object.keys(results).length === 0) {
                    alert("沒有匹配的數據");
                    return;
                }
                if (print) console.table(results); else {
                    const Json = new Blob([JSON.stringify(results, null, 4)], {
                        type: "application/json"
                    });
                    const Link = document.createElement("a");
                    Link.href = URL.createObjectURL(Json);
                    Link.download = "MatchWords.json";
                    Link.click();
                    URL.revokeObjectURL(Link.href);
                    Link.remove();
                }
            },
            OperationText(root, scheduler) {
                return Promise.all(getTextNodes(root).map(textNode => scheduler.wrap(() => this.__FocusTextCore(textNode))));
            },
            OperationInput(root, scheduler) {
                return Promise.all([...root.querySelectorAll("input[placeholder]")].map(inputNode => scheduler.wrap(() => this.__FocusInputCore(inputNode))));
            }
        };
        return {
            Dev(root, print = true) {
                ProcessingDataCore.Dev_Operation(root, print);
            },
            Trigger: (root = document.body) => {
                if (root.nodeType === Node.TEXT_NODE && root.parentElement) {
                    const textPromise = ProcessingDataCore.OperationText(root.parentElement, scheduler);
                    scheduler.start();
                    return Promise.all([textPromise]);
                }
                if (root === document || root.nodeType === Node.ELEMENT_NODE) {
                    const textPromise = ProcessingDataCore.OperationText(root, scheduler);
                    const inputPromise = ProcessingDataCore.OperationInput(root, scheduler);
                    scheduler.start();
                    return Promise.all([textPromise, inputPromise]);
                }
                if (root.nodeType === Node.ELEMENT_NODE && root.tagName === "INPUT" && root.hasAttribute("placeholder")) {
                    return ProcessingDataCore.__FocusInputCore(root);
                }
                return Promise.resolve();
            }
        };
    }
    function updateWordsDict() {
        const ObjType = object => Object.prototype.toString.call(object).slice(8, -1);
        const Parse = {
            Url(str) {
                try {
                    new URL(str);
                    return true;
                } catch {
                    return false;
                }
            },
            ExtenName(link) {
                try {
                    return link.match(/\.([^.]+)$/)[1].toLowerCase() || "json";
                } catch {
                    return "json";
                }
            },
            Array(data) {
                data = data.filter(d => d.trim() !== "");
                return {
                    State: data.length > 0,
                    Type: "arr",
                    Data: data
                };
            },
            String: data => ({
                State: data != "",
                Type: "str",
                Data: data
            }),
            Undefined: () => ({
                State: false
            })
        };
        const requestDict = data => {
            const URL = Parse.Url(data) ? data : `https://gitlab.com/Canaan-HS/database/-/raw/main/Words/${data}.json`;
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    responseType: Parse.ExtenName(URL),
                    url: URL,
                    onload(response) {
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
                    onerror(error) {
                        console.error("連線異常");
                        resolve({});
                    }
                });
            });
        };
        return {
            async reques() {
                const {
                    State,
                    Type,
                    Data
                } = Parse[ObjType(LoadDict?.Data)](LoadDict?.Data);
                const DefaultDict = Object.assign(GM_getValue("LocalWords", {}), Customize);
                if (!State || GM_getValue("Clear")) return DefaultDict;
                const CacheDict = {};
                if (Type == "str") Object.assign(CacheDict, await requestDict(Data)); else if (Type == "arr") {
                    for (const data of Data) {
                        Object.assign(CacheDict, await requestDict(data));
                    }
                }
                if (Object.keys(CacheDict).length > 0) {
                    Object.assign(CacheDict, Customize);
                    GM_setValue("UpdateTime", getDate());
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
    function getObjectSize(object) {
        const seenObjects = new WeakSet();
        const seenStrings = new Set();
        const bytesPerPointer = 4;
        const headerSize = 12;
        const align = n => Math.ceil(n / 8) * 8;
        const getType = obj => {
            if (obj === null) return "Null";
            if (obj === undefined) return "Undefined";
            return Object.prototype.toString.call(obj).slice(8, -1);
        };
        const calcString = str => {
            if (seenStrings.has(str)) return 0;
            seenStrings.add(str);
            let isTwoByte = false;
            for (let i = 0; i < str.length; i++) {
                if (str.charCodeAt(i) > 255) {
                    isTwoByte = true;
                    break;
                }
            }
            return align(headerSize + str.length * (isTwoByte ? 2 : 1));
        };
        const getSizeRec = value => {
            const type = getType(value);
            if (type === "Boolean") return 4;
            if (type === "Number") {
                if (Number.isSafeInteger(value) && value >= -2147483648 && value <= 2147483647) return 0;
                return 12;
            }
            if (type === "String") return calcString(value);
            if (type === "Symbol") return value.description ? calcString(value.description) : 0;
            if (type === "Null" || type === "Undefined") return 0;
            if (seenObjects.has(value)) return 0;
            seenObjects.add(value);
            return handlers[type] ? handlers[type](value) : handlers.Object(value);
        };
        const handlers = {
            Array: val => {
                let bytes = headerSize + val.length * bytesPerPointer;
                for (const item of val) bytes += getSizeRec(item);
                return align(bytes);
            },
            Object: val => {
                let bytes = headerSize;
                const keys = Object.keys(val);
                const symKeys = Object.getOwnPropertySymbols(val);
                bytes += (keys.length + symKeys.length) * bytesPerPointer;
                for (const key of keys) {
                    bytes += calcString(key);
                    bytes += getSizeRec(val[key]);
                }
                for (const sym of symKeys) {
                    bytes += (sym.description || "").length * 2;
                    bytes += getSizeRec(val[sym]);
                }
                return align(bytes);
            },
            Set: val => {
                let bytes = headerSize + val.size * bytesPerPointer * 2;
                for (const item of val) bytes += getSizeRec(item);
                return align(bytes);
            },
            Map: val => {
                let bytes = headerSize + val.size * bytesPerPointer * 4;
                for (const [k, v] of val) {
                    bytes += getSizeRec(k) + getSizeRec(v);
                }
                return align(bytes);
            },
            Date: () => align(headerSize + 8),
            RegExp: val => {
                return align(headerSize + 4 + calcString(val.toString()));
            },
            BigInt: val => {
                const hexLen = val.toString(16).length;
                return align(headerSize + Math.ceil(hexLen / 2));
            },
            Error: val => {
                let bytes = headerSize;
                if (val.message) bytes += calcString(val.message);
                if (val.stack) bytes += calcString(val.stack);
                return align(bytes);
            },
            Promise: () => align(headerSize + bytesPerPointer * 3),
            WeakMap: () => align(headerSize + 32),
            WeakSet: () => align(headerSize + 24),
            ArrayBuffer: val => align(headerSize + val.byteLength),
            DataView: () => align(headerSize + 24),
            Function: val => align(headerSize + val.toString().length)
        };
        ["Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array", "Float32Array", "Float64Array", "BigInt64Array", "BigUint64Array"].forEach(type => {
            handlers[type] = () => align(headerSize + 24);
        });
        const totalBytes = getSizeRec(object);
        const units = ["Bytes", "KB", "MB", "GB"];
        return units.reduce((acc, unit, i) => {
            acc[unit] = Number(i === 0 ? totalBytes : (totalBytes / 1024 ** i).toFixed(2));
            return acc;
        }, {});
    }
    function debounceCollect(func, delay) {
        let timer = null;
        let collectedMutations = [];
        return mutations => {
            clearTimeout(timer);
            collectedMutations.push(...mutations);
            timer = setTimeout(() => {
                func(collectedMutations);
                collectedMutations = [];
                timer = null;
            }, delay);
        };
    }
    function getDate(format = null) {
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
    function regMenu(items, name = "Menu", index = 1) {
        for (let [show, item] of Object.entries(items)) {
            let id = `${name}-${index++}`;
            typeof item === "function" && (item = {
                func: item
            });
            GM_registerMenuCommand(show, () => {
                item.func();
            }, {
                id: id,
                title: item.desc,
                autoClose: item.close,
                accessKey: item.hotkey
            });
        }
    }
    async function waitElem(selector, found) {
        const core = async function () {
            let animationFrame;
            let timer, result;
            const query = () => {
                result = document.getElementsByTagName(selector)[0];
                if (result) {
                    cancelAnimationFrame(animationFrame);
                    clearTimeout(timer);
                    found && found(result);
                } else {
                    animationFrame = requestAnimationFrame(query);
                }
            };
            animationFrame = requestAnimationFrame(query);
            timer = setTimeout(() => {
                cancelAnimationFrame(animationFrame);
            }, 1e3 * 8);
        };
        if (document.visibilityState === "hidden") {
            document.addEventListener("visibilitychange", () => core(), {
                once: true
            });
        } else core();
    }
})();