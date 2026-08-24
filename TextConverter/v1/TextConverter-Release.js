// ==UserScript==
// @name         簡易文本轉換器
// @version      2026.08.24
// @author       Canaan HS
// @description  高效將 指定文本 轉換為 自定文本

// @connect      *
// @match        *://yande.re/*
// @match        *://rule34.xxx/*
// @match        *://nhentai.to/*
// @match        *://nhentai.io/*
// @match        *://nhentai.net/*
// @match        *://nhentai.xxx/*
// @match        *://imhentai.xxx/*
// @match        *://konachan.com/*
// @match        *://hentaiera.com/*
// @match        *://nhentaibr.com/*
// @match        *://nhentai.website/*
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
            HotKey: true // 啟用快捷反轉 (alt + v)
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
    const [loadDict, translateCfg] = [Config.LoadDictionary, Config.TranslationReversal];
    const dev = GM_getValue("Dev", false);
    const updateDict = updateWordsDict();
    let originalSnapshots = new WeakMap();
    let recordDict = GM_getValue("LocalWords", null) ?? await updateDict.reques();
    const dictionary = {
        normalDict: undefined,
        refreshNormal() {
            this.normalDict = recordDict;
        },
        displayMemory() {
            alert(`字典緩存大小
                \r總大小: ${getObjectSize(this.normalDict).MB} MB
            `);
        },
        releaseMemory() {
            recordDict = this.normalDict = {};
            originalSnapshots = new WeakMap();
            console.log("%c緩存已釋放", `
                padding: 5px;
                color: #43fdeeff;
                font-weight: bold;
                border-radius: 10px;
                background-color: #2b6eebff;
                border: 2px solid #2b6eebff;
            `);
        },
        init() {
            Object.assign(recordDict, Customize);
            this.refreshNormal();
        }
    };
    let isPageConverted = false;
    const markAttribute = "data-translated";
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
    const translator = (() => {
        const filterTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "CANVAS", "IFRAME", "AUDIO", "VIDEO", "EMBED", "OBJECT", "SOURCE", "TRACK", "CODE", "KBD", "SAMP", "TEMPLATE", "SLOT", "PARAM", "META", "LINK", "IMG", "PICTURE", "FIGURE", "FIGCAPTION", "MATH", "PORTAL"]);
        const emptyOrNumericFilters = {
            allDigits: /^\d+$/,
            statNumber: /^[+-]?\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*[kmb萬億w%]?$/iu,
            hasValidChar: /[\w\p{L}]/u
        };
        function isTranslatableText(content) {
            content = content.trim();
            if (!content) return false;
            if (emptyOrNumericFilters.allDigits.test(content)) return false;
            if (emptyOrNumericFilters.statNumber.test(content)) return false;
            if (!emptyOrNumericFilters.hasValidChar.test(content)) return false;
            return true;
        }
        function getTextNodes(root) {
            const tree = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                acceptNode(node) {
                    const parent = node.parentElement;
                    if (parent && (filterTags.has(parent.tagName) || parent.hasAttribute(markAttribute))) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return isTranslatableText(node.textContent) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }
            });
            const nodes = [];
            while (tree.nextNode()) {
                nodes.push({
                    node: tree.currentNode,
                    parent: tree.currentNode.parentElement
                });
            }
            return nodes;
        }
        const translationCore = {
            __shortWordRegex: /[\d\p{L}]+/gu,
            __longWordRegex: /[\d\p{L}]+(?:[^|()\[\]{}{[(\t\n])+[\d\p{L}]\.*/gu,
            __clean: text => text.trim().toLowerCase(),
            devMatchObj(text) {
                const lResult = text?.match(this.__longWordRegex)?.map(Long => {
                    const Clean = this.__clean(Long);
                    return [Clean, recordDict[Clean] ?? ""];
                }) ?? [];
                const sResult = text?.match(this.__shortWordRegex)?.map(Short => {
                    const Clean = this.__clean(Short);
                    return [Clean, recordDict[Clean] ?? ""];
                }) ?? [];
                return [sResult, lResult].flat().filter(([Key, Value]) => Key && !/^\d+$/.test(Key)).reduce((acc, [Key, Value]) => {
                    acc[Key] = Value;
                    return acc;
                }, {});
            },
            longShort(text) {
                return text?.replace(this.__longWordRegex, Long => recordDict[this.__clean(Long)] ?? Long.replace(this.__shortWordRegex, Short => recordDict[this.__clean(Short)] ?? Short));
            }
        };
        const snapshotCore = {
            __isActiveText(record, text) {
                return !!record && text === (record.active === "converted" ? record.converted : record.original);
            },
            __removeField(inputElement, fieldKey) {
                const record = originalSnapshots.get(inputElement);
                if (!record?.[fieldKey]) return;
                const next = {
                    ...record
                };
                delete next[fieldKey];
                next.placeholder || next.value ? originalSnapshots.set(inputElement, next) : originalSnapshots.delete(inputElement);
            },
            text(textNode, forceRescan = false) {
                const parentElement = textNode.parentElement;
                if (!parentElement || filterTags.has(parentElement.tagName)) return;
                const currentText = textNode.nodeValue;
                if (!isTranslatableText(currentText)) return;
                const record = originalSnapshots.get(textNode);
                if (!forceRescan && this.__isActiveText(record, currentText)) return;
                if (parentElement.hasAttribute(markAttribute)) parentElement.removeAttribute(markAttribute);
                const convertedText = translationCore.longShort(currentText);
                if (convertedText !== currentText) {
                    originalSnapshots.set(textNode, {
                        original: currentText,
                        converted: convertedText,
                        active: "converted"
                    });
                    textNode.nodeValue = convertedText;
                } else if (record) {
                    originalSnapshots.delete(textNode);
                }
                if (!parentElement.hasAttribute(markAttribute)) parentElement.setAttribute(markAttribute, "");
            },
            input(inputElement, forceRescan = false) {
                const record = originalSnapshots.get(inputElement);
                const placeholderText = inputElement.getAttribute("placeholder");
                if (placeholderText && (forceRescan || !this.__isActiveText(record?.placeholder, placeholderText))) {
                    const convertedText = translationCore.longShort(placeholderText);
                    if (convertedText !== placeholderText) {
                        originalSnapshots.set(inputElement, {
                            ...record ?? {},
                            placeholder: {
                                original: placeholderText,
                                converted: convertedText,
                                active: "converted"
                            }
                        });
                        inputElement.setAttribute("placeholder", convertedText);
                    } else if (record?.placeholder) {
                        this.__removeField(inputElement, "placeholder");
                    }
                }
                const inputValue = inputElement.value;
                if (inputValue && (forceRescan || !this.__isActiveText(originalSnapshots.get(inputElement)?.value, inputValue))) {
                    const convertedText = translationCore.longShort(inputValue);
                    if (convertedText !== inputValue) {
                        originalSnapshots.set(inputElement, {
                            ...originalSnapshots.get(inputElement) ?? {},
                            value: {
                                original: inputValue,
                                converted: convertedText,
                                active: "converted"
                            }
                        });
                        inputElement.value = convertedText;
                    } else if (originalSnapshots.get(inputElement)?.value) {
                        this.__removeField(inputElement, "value");
                    }
                }
                if (!inputElement.hasAttribute(markAttribute)) inputElement.setAttribute(markAttribute, "");
            },
            swap(inputElement) {
                const record = originalSnapshots.get(inputElement);
                if (!record) return;
                if (record.placeholder) {
                    const currentText = inputElement.getAttribute("placeholder");
                    const activeText = record.placeholder.active === "converted" ? record.placeholder.converted : record.placeholder.original;
                    if (currentText === activeText) {
                        inputElement.setAttribute("placeholder", record.placeholder.active === "converted" ? record.placeholder.original : record.placeholder.converted);
                        record.placeholder.active = record.placeholder.active === "converted" ? "original" : "converted";
                    } else this.__removeField(inputElement, "placeholder");
                }
                if (record.value) {
                    const currentText = inputElement.value;
                    const activeText = record.value.active === "converted" ? record.value.converted : record.value.original;
                    if (currentText === activeText) {
                        inputElement.value = record.value.active === "converted" ? record.value.original : record.value.converted;
                        record.value.active = record.value.active === "converted" ? "original" : "converted";
                    } else this.__removeField(inputElement, "value");
                }
            },
            swapText(textNode) {
                const parentElement = textNode.parentElement;
                if (!parentElement || filterTags.has(parentElement.tagName)) return;
                const record = originalSnapshots.get(textNode);
                if (!record) return;
                const currentText = textNode.nodeValue;
                const activeText = record.active === "converted" ? record.converted : record.original;
                if (currentText !== activeText) {
                    originalSnapshots.delete(textNode);
                    return;
                }
                textNode.nodeValue = record.active === "converted" ? record.original : record.converted;
                record.active = record.active === "converted" ? "original" : "converted";
            }
        };
        const processingDataCore = {
            devOperation(root, print) {
                const results = {};
                [...getTextNodes(root).map(item => item.node.textContent), ...[...root.querySelectorAll("input[placeholder], input[value]")].map(inputNode => [inputNode.value, inputNode.getAttribute("placeholder")]).flat().filter(value => value && value != "")].map(text => Object.assign(results, translationCore.devMatchObj(text)));
                if (Object.keys(results).length === 0) {
                    alert("沒有匹配的數據");
                    return;
                }
                if (print) console.table(results); else {
                    const json = new Blob([JSON.stringify(results, null, 4)], {
                        type: "application/json"
                    });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(json);
                    link.download = "MatchWords.json";
                    link.click();
                    URL.revokeObjectURL(link.href);
                    link.remove();
                }
            },
            operationText(root, scheduler, forceRescan = false) {
                return Promise.all(getTextNodes(root).map(entry => scheduler.wrap(() => snapshotCore.text(entry.node, forceRescan))));
            },
            operationInput(root, scheduler, forceRescan = false) {
                return Promise.all([...root.querySelectorAll(`input[placeholder]:not([${markAttribute}])`)].map(inputNode => scheduler.wrap(() => snapshotCore.input(inputNode, forceRescan))));
            }
        };
        return {
            dev(root, print = true) {
                processingDataCore.devOperation(root, print);
            },
            swapInputElement(inputElement) {
                snapshotCore.swap(inputElement);
            },
            swapTextElement(textNode) {
                snapshotCore.swapText(textNode);
            },
            trigger(root = document.body, forceRescan = false) {
                if (root.nodeType === Node.TEXT_NODE) {
                    snapshotCore.text(root, forceRescan);
                    return Promise.resolve();
                }
                if (root.nodeType === Node.ELEMENT_NODE && root.tagName === "INPUT") {
                    snapshotCore.input(root, forceRescan);
                    return Promise.resolve();
                }
                if (root === document || root.nodeType === Node.ELEMENT_NODE) {
                    const textPromise = processingDataCore.operationText(root, scheduler, forceRescan);
                    const inputPromise = processingDataCore.operationInput(root, scheduler, forceRescan);
                    scheduler.start();
                    return Promise.all([textPromise, inputPromise]);
                }
                return Promise.resolve();
            }
        };
    })();
    const trigger = (() => {
        dictionary.init();
        const collector = debounceCollect(mutations => {
            const elements = new Set(), texts = new Set();
            for (const mutation of mutations) {
                if (mutation.type === "characterData") {
                    texts.add(mutation.target);
                } else if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                    for (const addedNode of mutation.addedNodes) {
                        if (addedNode.nodeType === Node.ELEMENT_NODE) elements.add(addedNode); else if (addedNode.nodeType === Node.TEXT_NODE) texts.add(addedNode);
                    }
                } else if (mutation.type === "attributes") {
                    elements.add(mutation.target);
                }
            }
            for (const element of elements) translator.trigger(element);
            for (const textNode of texts) translator.trigger(textNode);
        }, 600);
        const observer = new MutationObserver(mutations => collector.push(mutations));
        const observePage = () => observer.observe(document.body, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: ["placeholder"]
        });
        return {
            swapAllWithSnapshots() {
                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
                    acceptNode: node => originalSnapshots.has(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
                });
                while (walker.nextNode()) {
                    translator.swapTextElement(walker.currentNode);
                }
                for (const inputElement of document.querySelectorAll("input")) {
                    translator.swapInputElement(inputElement);
                }
                for (const element of document.querySelectorAll(`[${markAttribute}]`)) {
                    element.removeAttribute(markAttribute);
                }
                isPageConverted = false;
            },
            thePolesAreReversed(recoverOB = true) {
                if (isPageConverted) {
                    this.swapAllWithSnapshots();
                } else {
                    translator.trigger(document.body, true);
                    isPageConverted = true;
                }
                recoverOB && observePage();
            },
            startObserver(forceRescan = false) {
                translator.trigger(document.body, forceRescan);
                observePage();
            },
            disconnectObserver() {
                observer.disconnect();
                collector.cancel();
            }
        };
    })();
    function updateWordsDict() {
        const getType = object => Object.prototype.toString.call(object).slice(8, -1);
        const parse = {
            url(str) {
                try {
                    new URL(str);
                    return true;
                } catch {
                    return false;
                }
            },
            extenName(link) {
                try {
                    return link.match(/\.([^.]+)$/)[1].toLowerCase() || "json";
                } catch {
                    return "json";
                }
            },
            Array(data) {
                data = data.filter(d => d.trim() !== "");
                return {
                    state: data.length > 0,
                    type: "arr",
                    data: data
                };
            },
            String: data => ({
                state: data !== "",
                type: "str",
                data: data
            }),
            Undefined: () => ({
                state: false
            })
        };
        const requestDict = data => {
            const url = parse.url(data) ? data : `https://gitlab.com/Canaan-HS/database/-/raw/main/Words/${data}.json`;
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: url,
                    responseType: parse.extenName(url),
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
                    state,
                    type,
                    data
                } = parse[getType(loadDict?.Data)](loadDict?.Data);
                const localDict = Object.assign(GM_getValue("LocalWords", {}), Customize);
                if (!state || GM_getValue("Clear")) return localDict;
                const cacheDict = {};
                if (type == "str") Object.assign(cacheDict, await requestDict(data)); else if (type == "arr") {
                    for (const dictUrl of data) {
                        Object.assign(cacheDict, await requestDict(dictUrl));
                    }
                }
                if (Object.keys(cacheDict).length > 0) {
                    Object.assign(cacheDict, Customize);
                    GM_setValue("UpdateTime", getDate());
                    GM_setValue("LocalWords", cacheDict);
                    console.log("%c數據更新成功", `
                        padding: 5px;
                        color: #9BEC00;
                        font-weight: bold;
                        border-radius: 10px;
                        background-color: #597445;
                        border: 2px solid #597445;
                    `);
                    return cacheDict;
                } else {
                    console.log("%c數據更新失敗", `
                        padding: 5px;
                        color: #FF0000;
                        font-weight: bold;
                        border-radius: 10px;
                        background-color: #A91D3A;
                        border: 2px solid #A91D3A;
                    `);
                    return localDict;
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
        const getType = object => Object.prototype.toString.call(object).slice(8, -1);
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
            return handlers[type]?.(value) ?? handlers.Object(value);
        };
        const handlers = {
            Array(val) {
                let bytes = headerSize + val.length * bytesPerPointer;
                for (const item of val) bytes += getSizeRec(item);
                return align(bytes);
            },
            Object(val) {
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
            Set(val) {
                let bytes = headerSize + val.size * bytesPerPointer * 2;
                for (const item of val) bytes += getSizeRec(item);
                return align(bytes);
            },
            Map(val) {
                let bytes = headerSize + val.size * bytesPerPointer * 4;
                for (const [k, v] of val) {
                    bytes += getSizeRec(k) + getSizeRec(v);
                }
                return align(bytes);
            },
            Date: () => align(headerSize + 8),
            RegExp: val => align(headerSize + 4 + calcString(val.toString())),
            BigInt(val) {
                const hexLen = val.toString(16).length;
                return align(headerSize + Math.ceil(hexLen / 2));
            },
            Error(val) {
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
    function debounceCollect(callback, delay) {
        let timer = null;
        let collected = [];
        return {
            push(mutations) {
                collected.push(...mutations);
                clearTimeout(timer);
                timer = setTimeout(() => {
                    const batch = collected;
                    collected = [];
                    timer = null;
                    callback(batch);
                }, delay);
            },
            cancel() {
                clearTimeout(timer);
                collected = [];
                timer = null;
            }
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
    waitElem("body", body => {
        window.addEventListener("urlchange", () => {
            if (dev) return;
            translator.trigger();
            isPageConverted = true;
        });
        if (!dev) {
            trigger.startObserver();
            isPageConverted = true;
        }
        regMenu({
            "🆕 更新字典": {
                desc: "獲取伺服器字典, 更新本地數據庫, 並在控制台打印狀態",
                func: async () => {
                    GM_setValue("Clear", false);
                    trigger.disconnectObserver();
                    trigger.swapAllWithSnapshots();
                    recordDict = await updateDict.reques();
                    dictionary.init();
                    trigger.startObserver(true);
                    isPageConverted = true;
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
                func: () => trigger.thePolesAreReversed()
            }
        }, "Basic");
        if (dev || translateCfg.HotKey) {
            document.addEventListener("keydown", event => {
                if (event.altKey && event.key.toLowerCase() === "v") {
                    event.preventDefault();
                    trigger.thePolesAreReversed();
                }
            });
        }
        if (dev) {
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
                    func: () => translator.dev(document),
                    close: false
                },
                "🖨️ 輸出匹配文檔": {
                    desc: "以 Json 格式輸出, 頁面上被匹配到的所有文本",
                    func: () => translator.dev(document, false)
                },
                "📼 展示字典緩存": {
                    desc: "顯示當前載入的字典大小",
                    func: () => dictionary.displayMemory()
                },
                "🧹 釋放字典緩存": {
                    desc: "將緩存於 JavaScript 記憶體內的字典數據釋放掉",
                    func: () => dictionary.releaseMemory()
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
        const currentTime = new Date().getTime();
        const updateTime = GM_getValue("UpdateTime", false);
        if (!updateTime || currentTime - new Date(updateTime).getTime() > 36e5 * 24) {
            updateDict.reques().then(data => {
                trigger.disconnectObserver();
                trigger.swapAllWithSnapshots();
                recordDict = data;
                dictionary.init();
                trigger.startObserver(true);
                isPageConverted = true;
            });
        }
    });
})();