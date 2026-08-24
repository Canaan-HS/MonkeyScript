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

    // 解構設置, translationFactory 需要 translateCfg 的數據, 如果晚宣告會出錯
    const [loadDict, translateCfg] = [Config.LoadDictionary, Config.TranslationReversal];

    const dev = GM_getValue("Dev", false); // 開發者模式
    const updateDict = updateWordsDict(); // 更新函數

    let originalSnapshots = new WeakMap(); // 原文快照 { original, converted, active }, active 指向當前顯示的是哪一邊
    let recordDict = GM_getValue("LocalWords", null) ?? await updateDict.reques(); // 本地翻譯字典 (無字典立即請求, 通常只會在第一次運行)

    const dictionary = { // 字典操作
        normalDict: undefined,
        refreshNormal() { // 正常字典的緩存
            this.normalDict = recordDict;
        },
        displayMemory() {
            alert(`字典緩存大小
                \r總大小: ${getObjectSize(this.normalDict).MB} MB
            `);
        },
        releaseMemory() { // 釋放翻譯字典緩存 與 原文快照 (不包含自定)
            recordDict = this.normalDict = {};
            originalSnapshots = new WeakMap(); // 快照無法逐一清除, 直接更換參照

            console.log("%c緩存已釋放", `
                padding: 5px;
                color: #43fdeeff;
                font-weight: bold;
                border-radius: 10px;
                background-color: #2b6eebff;
                border: 2px solid #2b6eebff;
            `);
        },
        init() { // 初始化 (合併自定字典, 並刷新緩存)
            Object.assign(recordDict, Customize);
            this.refreshNormal();
        }
    };

    /* =========================================== */

    let isPageConverted = false; // 當前頁面文本是否為轉換態
    const markAttribute = "data-translated"; // 已處理標記 (掛在文本節點的父元素 / input 上)

    // requestIdleCallback 的 fallback
    const renderWait = requestIdleCallback || ((callback) => {
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
    const scheduler = (() => {
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
                renderWait(processQueue, { timeout });
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
                renderWait(processQueue, { timeout });
            }
        }
    })();

    /* 翻譯處理工廠 */
    const translator = (() => {
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

        const emptyOrNumericFilters = {
            allDigits: /^\d+$/, // 全數字
            statNumber: /^[+-]?\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*[kmb萬億w%]?$/iu, // 統計數量
            hasValidChar: /[\w\p{L}]/u, // 無有效字元
        };

        // 清洗數據, 對文本進行過濾
        function isTranslatableText(content) {
            content = content.trim();
            if (!content) return false; // 空內容
            if (emptyOrNumericFilters.allDigits.test(content)) return false;
            if (emptyOrNumericFilters.statNumber.test(content)) return false;
            if (!emptyOrNumericFilters.hasValidChar.test(content)) return false;
            return true;
        };

        function getTextNodes(root) {
            const tree = document.createTreeWalker(
                root,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode(node) {
                        // 標籤過濾 與 已處理標記
                        const parent = node.parentElement;
                        if (parent && (filterTags.has(parent.tagName) || parent.hasAttribute(markAttribute))) {
                            return NodeFilter.FILTER_REJECT;
                        }

                        return isTranslatableText(node.textContent) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                    }
                }
            );

            const nodes = [];
            while (tree.nextNode()) {
                nodes.push({ node: tree.currentNode, parent: tree.currentNode.parentElement });
            }
            return nodes;
        };

        const translationCore = {
            __shortWordRegex: /[\d\p{L}]+/gu,
            __longWordRegex: /[\d\p{L}]+(?:[^|()\[\]{}{[(\t\n])+[\d\p{L}]\.*/gu,
            __clean: (text) => text.trim().toLowerCase(),
            devMatchObj(text) {
                const lResult = text?.match(this.__longWordRegex)?.map(Long => {
                    const Clean = this.__clean(Long);
                    return [Clean, recordDict[Clean] ?? ""];
                }) ?? [];

                const sResult = text?.match(this.__shortWordRegex)?.map(Short => {
                    const Clean = this.__clean(Short);
                    return [Clean, recordDict[Clean] ?? ""];
                }) ?? [];

                return [sResult, lResult]
                    .flat().filter(([Key, Value]) => Key && !/^\d+$/.test(Key)) // 過濾全都是數字 和 空的 key
                    .reduce((acc, [Key, Value]) => {
                        acc[Key] = Value;
                        return acc;
                    }, {});
            },
            longShort(text) { // 已長單詞為主, 不存在才去找短單詞 (fallback 內聯短單詞匹配)
                return text?.replace(
                    this.__longWordRegex,
                    Long => recordDict[this.__clean(Long)] ?? Long.replace(this.__shortWordRegex, Short => recordDict[this.__clean(Short)] ?? Short)
                );
            }
        };

        /*
         * 記錄結構 { original, converted, active }: original 為原文, converted 為轉換後文本,
         * active 指向當前顯示的是哪一邊 ("converted" 或 "original"), 反轉時兩者互相交換
         */
        const snapshotCore = {
            __isActiveText(record, text) { // 內容是否為寫入的當前狀態 (自身寫入會再觸發 observer 事件)
                return !!record && text === (record.active === "converted" ? record.converted : record.original);
            },
            __removeField(inputElement, fieldKey) { // 移除指定欄位, 若紀錄已空則整筆刪除
                const record = originalSnapshots.get(inputElement);
                if (!record?.[fieldKey]) return;

                const next = { ...record };
                delete next[fieldKey];
                (next.placeholder || next.value) ? originalSnapshots.set(inputElement, next) : originalSnapshots.delete(inputElement);
            },
            text(textNode, forceRescan = false) {
                const parentElement = textNode.parentElement;
                if (!parentElement || filterTags.has(parentElement.tagName)) return; // 單節點路徑仍需標籤過濾

                const currentText = textNode.nodeValue;
                if (!isTranslatableText(currentText)) return;

                const record = originalSnapshots.get(textNode);

                // 迴聲防護 (forceRescan 用於字典更新後的全域重掃), 迴聲保留父元素標記現狀
                if (!forceRescan && this.__isActiveText(record, currentText)) return;

                // 內容與我們寫入的不同 (外部改寫或新增內容), 先使父元素標記失效再重新處理
                if (parentElement.hasAttribute(markAttribute)) parentElement.removeAttribute(markAttribute);

                const convertedText = translationCore.longShort(currentText);
                if (convertedText !== currentText) {
                    originalSnapshots.set(textNode, { original: currentText, converted: convertedText, active: "converted" });
                    textNode.nodeValue = convertedText;
                } else if (record) {
                    originalSnapshots.delete(textNode); // 內容已被外部改寫且不再匹配, 放棄持有權
                }

                if (!parentElement.hasAttribute(markAttribute)) parentElement.setAttribute(markAttribute, "");
            },
            input(inputElement, forceRescan = false) {
                const record = originalSnapshots.get(inputElement);

                // placeholder
                const placeholderText = inputElement.getAttribute("placeholder");
                if (placeholderText && (forceRescan || !this.__isActiveText(record?.placeholder, placeholderText))) {
                    const convertedText = translationCore.longShort(placeholderText);

                    if (convertedText !== placeholderText) {
                        originalSnapshots.set(inputElement, { ...(record ?? {}), placeholder: { original: placeholderText, converted: convertedText, active: "converted" } });
                        inputElement.setAttribute("placeholder", convertedText);
                    } else if (record?.placeholder) {
                        this.__removeField(inputElement, "placeholder");
                    }
                }

                // value (重新獲取, placeholder 處理可能已更新紀錄)
                const inputValue = inputElement.value;
                if (inputValue && (forceRescan || !this.__isActiveText(originalSnapshots.get(inputElement)?.value, inputValue))) {
                    const convertedText = translationCore.longShort(inputValue);
                    if (convertedText !== inputValue) {
                        originalSnapshots.set(inputElement, { ...(originalSnapshots.get(inputElement) ?? {}), value: { original: inputValue, converted: convertedText, active: "converted" } });
                        inputElement.value = convertedText;
                    } else if (originalSnapshots.get(inputElement)?.value) {
                        this.__removeField(inputElement, "value");
                    }
                }

                if (!inputElement.hasAttribute(markAttribute)) inputElement.setAttribute(markAttribute, "");
            },
            swap(inputElement) { // 反轉用: 交換 placeholder / value 的當前內容與快照
                const record = originalSnapshots.get(inputElement);
                if (!record) return;

                if (record.placeholder) {
                    const currentText = inputElement.getAttribute("placeholder");
                    const activeText = record.placeholder.active === "converted" ? record.placeholder.converted : record.placeholder.original;
                    if (currentText === activeText) {
                        inputElement.setAttribute("placeholder", record.placeholder.active === "converted" ? record.placeholder.original : record.placeholder.converted);
                        record.placeholder.active = record.placeholder.active === "converted" ? "original" : "converted";
                    } else this.__removeField(inputElement, "placeholder"); // 內容已被外部改寫, 移除該欄位
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
            swapText(textNode) { // 反轉用: 交換文字節點的當前內容與快照
                const parentElement = textNode.parentElement;
                if (!parentElement || filterTags.has(parentElement.tagName)) return;

                const record = originalSnapshots.get(textNode);
                if (!record) return;

                const currentText = textNode.nodeValue;
                const activeText = record.active === "converted" ? record.converted : record.original;
                if (currentText !== activeText) {
                    originalSnapshots.delete(textNode); // 內容已被外部改寫, 放棄持有權
                    return;
                }

                textNode.nodeValue = record.active === "converted" ? record.original : record.converted;
                record.active = record.active === "converted" ? "original" : "converted";
            }
        };

        const processingDataCore = {
            devOperation(root, print) {
                const results = {};
                [
                    ...getTextNodes(root).map(item => item.node.textContent),
                    ...[...root.querySelectorAll("input[placeholder], input[value]")].map(inputNode =>
                        [inputNode.value, inputNode.getAttribute("placeholder")]).flat().filter(value => value && value != '')
                ].map(text => Object.assign(results, translationCore.devMatchObj(text)));

                if (Object.keys(results).length === 0) {
                    alert("沒有匹配的數據");
                    return;
                }

                if (print) console.table(results);
                else {
                    const json = new Blob([JSON.stringify(results, null, 4)], { type: "application/json" });

                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(json);
                    link.download = "MatchWords.json";
                    link.click();

                    URL.revokeObjectURL(link.href);
                    link.remove();
                };
            },
            operationText(root, scheduler, forceRescan = false) {
                return Promise.all(
                    getTextNodes(root).map(entry => scheduler.wrap(() => snapshotCore.text(entry.node, forceRescan)))
                )
            },
            operationInput(root, scheduler, forceRescan = false) {
                return Promise.all(
                    [...root.querySelectorAll(`input[placeholder]:not([${markAttribute}])`)]
                        .map(inputNode => scheduler.wrap(() => snapshotCore.input(inputNode, forceRescan)))
                )
            },
        };

        return {
            dev(root, print = true) {
                processingDataCore.devOperation(root, print);
            },
            // 反轉用: 交換 input 的 placeholder / value
            swapInputElement(inputElement) {
                snapshotCore.swap(inputElement);
            },
            // 反轉用: 交換文字節點內容 (含標籤過濾與外部改寫檢查)
            swapTextElement(textNode) {
                snapshotCore.swapText(textNode);
            },
            // 預設只處理 body 元素, forceRescan 為 true 時忽略標記與迴聲防護 (字典更新後的全域重掃)
            trigger(root = document.body, forceRescan = false) {

                // 單一文字節點 (觀察者增量 / characterData)
                if (root.nodeType === Node.TEXT_NODE) {
                    snapshotCore.text(root, forceRescan);
                    return Promise.resolve();
                }

                // input 元素 (placeholder 屬性變更 或 增量加入)
                if (
                    root.nodeType === Node.ELEMENT_NODE &&
                    root.tagName === "INPUT"
                ) {
                    snapshotCore.input(root, forceRescan);
                    return Promise.resolve();
                }

                // 整頁或一般 element 節點
                if (
                    root === document ||
                    (root.nodeType === Node.ELEMENT_NODE) // 包含 document.body、div 等
                ) {
                    const textPromise = processingDataCore.operationText(root, scheduler, forceRescan);
                    const inputPromise = processingDataCore.operationInput(root, scheduler, forceRescan);
                    scheduler.start();
                    return Promise.all([textPromise, inputPromise]);
                }

                return Promise.resolve(); // 其他類型忽略
            }
        };
    })();

    const trigger = (() => {
        dictionary.init();

        /* ===== 持續觀察觸發工具 ===== */

        /* 只負責收集增量節點, 過濾交給 標記機制 + 冪等處理 */
        const collector = debounceCollect((mutations) => {
            const elements = new Set(), texts = new Set();

            for (const mutation of mutations) {
                if (mutation.type === "characterData") {
                    // 如果是文字內容變化
                    texts.add(mutation.target);
                }
                else if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                    // 如果是子節點
                    for (const addedNode of mutation.addedNodes) {
                        if (addedNode.nodeType === Node.ELEMENT_NODE) elements.add(addedNode);
                        else if (addedNode.nodeType === Node.TEXT_NODE) texts.add(addedNode);
                    }
                }
                else if (mutation.type === "attributes") {
                    // 如果是 placeholder 屬性 (attributeFilter 已限定)
                    elements.add(mutation.target);
                }
            }

            for (const element of elements) translator.trigger(element);
            for (const textNode of texts) translator.trigger(textNode);
        }, 600);

        const observer = new MutationObserver(mutations => collector.push(mutations));

        // 恢復觀察 (不觸發全頁掃描)
        const observePage = () => observer.observe(document.body, {
            subtree: true, // 監視所有後代節點
            childList: true, // 監視子節點添加或移除
            characterData: true, // 監視文字內容變化
            attributes: true, // 監視屬性變化
            attributeFilter: ['placeholder'] // 只監視 placeholder 屬性 (避免腳本自身掛標記時觸發事件)
        });

        return {
            /* 兩極反轉還原: 全頁走訪交換快照回原文, 並移除全部標記讓下次正向掃描能重新處理 */
            swapAllWithSnapshots() {
                // 用 acceptNode 只走訪持有快照的文字節點 (標籤過濾職責統一在 snapshotCore 守衛內)
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    { acceptNode: node => originalSnapshots.has(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT }
                );

                while (walker.nextNode()) {
                    translator.swapTextElement(walker.currentNode);
                }

                // input 的 placeholder / value 交換
                for (const inputElement of document.querySelectorAll("input")) {
                    translator.swapInputElement(inputElement);
                }

                // 移除全頁標記 (內容已回到原文)
                for (const element of document.querySelectorAll(`[${markAttribute}]`)) {
                    element.removeAttribute(markAttribute);
                }

                isPageConverted = false;
            },
            // 反轉
            thePolesAreReversed(recoverOB = true) {
                if (isPageConverted) {
                    this.swapAllWithSnapshots(); // 轉換態 → 原文態
                } else {
                    translator.trigger(document.body, true); // 原文態 → 轉換態 (強制重掃)
                    isPageConverted = true;
                }

                // 恢復觀察 (還原路徑不觸發全頁掃描, 否則剛還原的內容會立刻被翻回去)
                recoverOB && observePage();
            },
            // 啟動觀察, forceRescan 為 true 時強制重掃已標記內容 (用於字典更新後)
            startObserver(forceRescan = false) {
                translator.trigger(document.body, forceRescan);
                observePage();
            },
            // 斷開觀察 (並丟棄尚未觸發的事件批次, 避免反轉後被殘留事件重新翻譯)
            disconnectObserver() {
                observer.disconnect();
                collector.cancel();
            },
        }
    })();

    /* ===== 輔助工具 ===== */

    /* 更新數據 */
    function updateWordsDict() {
        const getType = (object) => Object.prototype.toString.call(object).slice(8, -1);
        const parse = { // 解析數據
            url(str) {
                try {
                    new URL(str); return true;
                } catch { return false }
            },
            extenName(link) {
                try {
                    return link.match(/\.([^.]+)$/)[1].toLowerCase() || "json";
                } catch { return "json" }
            },
            // 以下用於判斷配置類型
            Array(data) {
                data = data.filter(d => d.trim() !== ""); // 過濾空字串
                return { state: data.length > 0, type: "arr", data: data }
            },
            String: (data) => ({ state: data !== "", type: "str", data: data }),
            Undefined: () => ({ state: false }),
        };

        // 請求字典
        const requestDict = (data) => {
            // 解析請求的 url 是完整的連結, 還是單個字串
            const url = parse.url(data) ? data : `https://gitlab.com/Canaan-HS/database/-/raw/main/Words/${data}.json`;

            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url,
                    responseType: parse.extenName(url), // 自動解析類型
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
            async reques() {
                const { state, type, data } = parse[getType(loadDict?.Data)](loadDict?.Data); // 解構數據 (避免可能的例外)
                const localDict = Object.assign(GM_getValue("LocalWords", {}), Customize);

                // 當解構狀態為 false, 或有清理標記, 直接回傳本地字典
                if (!state || GM_getValue("Clear")) return localDict;

                const cacheDict = {};
                if (type == "str") Object.assign(cacheDict, await requestDict(data)); // 是字串直接傳遞
                else if (type == "arr") { // 是列表的傳遞
                    for (const dictUrl of data) {
                        Object.assign(cacheDict, await requestDict(dictUrl));
                    }
                };

                if (Object.keys(cacheDict).length > 0) {
                    Object.assign(cacheDict, Customize); // 只保留新的字典

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
        const getType = (object) => Object.prototype.toString.call(object).slice(8, -1);

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

            return handlers[type]?.(value) ?? handlers.Object(value);
        };

        const handlers = {
            // 集合類型
            Array(val) {
                let bytes = headerSize + (val.length * bytesPerPointer);
                for (const item of val) bytes += getSizeRec(item);
                return align(bytes);
            },
            Object(val) {
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
            Set(val) {
                // Set 的底層實現比 Array 複雜，這裡估算 Table 結構開銷
                let bytes = headerSize + (val.size * bytesPerPointer * 2);
                for (const item of val) bytes += getSizeRec(item);
                return align(bytes);
            },
            Map(val) {
                let bytes = headerSize + (val.size * bytesPerPointer * 4);
                for (const [k, v] of val) {
                    bytes += getSizeRec(k) + getSizeRec(v);
                }
                return align(bytes);
            },

            // 特殊對象
            Date: () => align(headerSize + 8),

            // 正則是源碼字串 + 編譯後的機器碼(無法獲取)，這裡只算源碼
            RegExp: (val) => align(headerSize + 4 + calcString(val.toString())),

            BigInt(val) {
                // BigInt 是對象，需計算具體位數
                const hexLen = val.toString(16).length;
                return align(headerSize + Math.ceil(hexLen / 2));
            },

            Error(val) {
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

    function debounceCollect(callback, delay) {
        let timer = null;
        let collected = []; // 用於收集所有 mutations

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
            cancel() { // 丟棄尚未觸發的批次
                clearTimeout(timer);
                collected = [];
                timer = null;
            }
        };
    };

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

        const generate = (temp) => temp.replace(/{([^}]+)}/g, (_, key) => formatMap[key] || "Error");
        return generate(typeof format === "string" ? format : defaultFormat);
    };

    function regMenu(items, name = "Menu", index = 1) {
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
            }, (1000 * 8));
        };

        if (document.visibilityState === "hidden") {
            document.addEventListener("visibilitychange", () => core(), { once: true });
        } else core();
    };

    /* =========================================== */

    waitElem("body", body => { // 等待頁面載入
        window.addEventListener("urlchange", () => {
            if (dev) return;
            translator.trigger();
            isPageConverted = true;
        });

        // 首次運行 (開發者模式下不自動觸發)
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
                    trigger.swapAllWithSnapshots(); // 先用快照還原原文 (與字典無關, 不受新舊字典差異影響)

                    recordDict = await updateDict.reques(); // 請求新的字典
                    dictionary.init(); // 更新後重新初始化 緩存

                    trigger.startObserver(true); // 用新字典強制全頁重翻, 並恢復觀察
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
            })
        };

        if (dev) {
            regMenu({
                "« 🚫 停用開發者模式 »": {
                    desc: "關閉開發者模式", func: () => {
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
                    desc: "打開開發者模式", func: () => {
                        GM_setValue("Dev", true);
                        location.reload();
                    }
                }
            }, "Dev");
        };

        const currentTime = new Date().getTime(); // 當前時間戳
        const updateTime = GM_getValue("UpdateTime", false); // 紀錄時間戳

        if (!updateTime || (currentTime - new Date(updateTime).getTime()) > (36e5 * 24)) { // 24 小時更新
            updateDict.reques().then(data => { // 不 await 的更新
                trigger.disconnectObserver();
                trigger.swapAllWithSnapshots(); // 還原原文後, 用新字典重翻
                recordDict = data;
                dictionary.init(); // 初始化
                trigger.startObserver(true);
                isPageConverted = true;
            })
        };
    });
})();