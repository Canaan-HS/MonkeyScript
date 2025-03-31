// ==UserScript==
// @name         Syntax
// @version      2025/03/31
// @author       Canaan HS
// @description  Library for simplifying code logic and syntax
// @namespace    https://greasyfork.org/users/989635
// @match        *://*/*
// @license      MPL-2.0
// ==/UserScript==

const Syn = (() => {
    const Mark = {};
    const Parser = new DOMParser();
    const ListenerRecord = new Map();
    const Type = (object) => Object.prototype.toString.call(object).slice(8, -1);
    const DeviceCall = {
        sX: () => window.scrollX,
        sY: () => window.scrollY,
        iW: () => window.innerWidth,
        iH: () => window.innerHeight,
        _Cache: undefined,
        Platform: function () {
            return this._Cache = this._Cache ? this._Cache
                : (this._Cache = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(this.Agen) || this.iW < 768
                    ? "Mobile" : "Desktop");
        }
    };

    /* ========== 通用常用 ========== */

    /**
     * * { 語法簡化 }
     *
     * @example
     * 基本上和原生的調用方式類似
     *
     * $q("#id")
     * 元素.$q("tag")
     * $qa(".class")
     * 元素.$qa("元素")
     *
     * 不支援鏈式
     * $qa("div").$qa("span")
     */
    [Document.prototype, Element.prototype].forEach(proto => { // 註冊 document & element 原型
        proto.$q = function(selector) {
            return Selector(this, selector, false);
        };
        proto.$qa = function(selector) {
            return Selector(this, selector, true);
        };
    });
    function Selector(root=document, selector, all) {
        const head = selector[0];
        const headless = selector.slice(1);
        const complicated = /[ #.\[:]/.test(headless);

        if (complicated) {
            return all ? root.querySelectorAll(selector) : root.querySelector(selector);
        }

        if (!all && head === '#') { // ID選擇器 (#id)
            return document.getElementById(headless);
        }

        if (selector[0] === '.') { // 類選擇器 (.class)
            const collection = root.getElementsByClassName(headless);
            return all ? [...collection] : collection[0];
        }

        // 標籤選擇器 (tag)
        const collection = root.getElementsByTagName(selector);
        return all ? [...collection] : collection[0];
    };

    const $Window = {
        $q: document.$q.bind(document),
        $qa: document.$qa.bind(document),
        $html: document.documentElement,
        $head: document.head,
        $body: document.body,
        $img: document.images,
        $link: document.links,
        $script: document.scripts,
        $style: document.styleSheets,
        $url: location.href,
        $origin: location.origin,
        $domain: location.hostname,
        $lang: navigator.language,
        $agen: navigator.userAgent,
        $title: (value=null) => value !== null ? (document.title = value) : document.title,
        $cookie: (value=null) => value !== null ? (document.cookie = value) : document.cookie,
        $createUrl: (object) => URL.createObjectURL(object),
        $createFragment: () => document.createDocumentFragment(),
        $createElement: (arg1, arg2, arg3) => {
            const [root, tag, value = {}] = typeof arg1 === "string" ? [null, arg1, arg2] : [arg1, arg2, arg3];
            if (!tag) return;

            const {
                id, title, class: className, text: textContent = "",
                rows: rowSpan, cols: colSpan, style = {}, attr = {}, ...props
            } = value;

            const element = Object.assign(document.createElement(tag), {textContent});

            if (id) element.id = id;
            if (title) element.title = title;
            if (className) element.className = className;
            if (rowSpan !== undefined) element.rowSpan = rowSpan;
            if (colSpan !== undefined) element.colSpan = colSpan;

            // 批量賦值常見屬性
            Object.assign(element, props);

            // 設置樣式，支持字串或物件
            Object.assign(element.style, typeof style === "string" ? { cssText: style } : style);

            // 設置自定義屬性
            Object.entries(attr).forEach(([key, val]) => element.setAttribute(key, val));

            return root instanceof HTMLElement ? root.appendChild(element) : element;
        },
    };

    const $Node = {
        $text(value=null) {
            return value !== null ? (this.textContent = value?.trim()) : this.textContent?.trim();
        },
        $copy(deep=true) {
            return this.cloneNode(deep);
        },
        $iHtml(value=null) {
            return value !== null ? (this.innerHTML = value) : this.innerHTML;
        },
        $oHtml(value=null) {
            return value !== null ? (this.outerHTML = value) : this.outerHTML;
        },
        $sAttr(name, value) {
            this.setAttribute(name, value);
        },
        $dAttr(name) {
            this.removeAttribute(name);
        },
        $gAttr(name) {
            return this.getAttribute(name);
        },
        $hAttr(value) {
            return this.hasAttribute(value);
        },
        $addClass(...names) {
            this.classList.add(...names);
        },
        $delClass(...names) {
            this.classList.remove(...names);
        },
        $toggleClass(name, force) {
            this.classList.toggle(name, force);
        },
        $replaceClass(oldName, newName) {
            this.classList.replace(oldName, newName);
        },
        $hasClass(name) {
            return this.classList.contains(name);
        },
    };

    const $Event = {
        /**
         * * { 簡化版監聽器 (不可刪除, 不檢測是否重複添加, 但可回傳註冊狀態) }
         * @param {string} element - 添加元素
         * @param {string} type    - 監聽器類型
         * @param {*} listener     - 監聽後操作
         * @param {object} add     - 附加功能
         * @returns {boolean}      - 回傳添加狀態
         *
         * @example
         * 監聽元素.$one("監聽類型", 觸發 => {
         *      觸發... 其他操作
         * }, {once: true, capture: true, passive: true}, 接收註冊狀態 => {
         *      console.log(註冊狀態)
         * })
         */
        $one(type, listener, add={}, resolve=null) {
            try {
                this.addEventListener(type, listener, add);
                resolve && resolve(true);
            } catch { resolve && resolve(false) }
        },

        /**
         * * { 添加監聽器 (可刪除, element 和 type 不能有完全重複的, 否則會被排除) }
         * @param {string} type    - 監聽器類型
         * @param {Function} listener - 監聽後執行的函數
         * @param {object} options - 附加功能 (可選)
         *
         * @example
         * element.$onEvent("click", (event) => {
         *      觸發執行
         * }, {
         *    capture: true,
         *    once: true,
         *    passive: true,
         *    mark: "自定鍵值" // 因為有自定所以不能使用 WeakMap
         * });
         */
        $onEvent(type, listener, options = {}) {
            const { mark, ...opts } = options;
            const key = mark ?? this;
            const record = ListenerRecord.get(key);

            if (record?.has(type)) return;
            this.addEventListener(type, listener, opts);

            if (!record) ListenerRecord.set(key, new Map());
            ListenerRecord.get(key).set(type, listener);
        },

        /**
         * * { 移除監聽器 }
         * @param {string} type - 監聽類型
         *
         * @example
         * element.$offEvent("click")
         */
        $offEvent(type, mark) {
            const key = mark ?? this;
            const listen = ListenerRecord.get(key)?.get(type);
            if (listen) {
                this.removeEventListener(type, listen);
                ListenerRecord.get(key).delete(type);
            }
        }
    };

    // 原型註冊
    Object.assign(window, $Event);
    Object.assign(Node.prototype, $Node);
    Object.assign(EventTarget.prototype, $Event);

    // 處理可能的空值
    const $text = Object.keys($Node)[0];
    Object.defineProperty(Object.prototype, $text, {
        value: function(value = null) {
            return $Node[$text].call(this, value);
        },
        writable: true,
        configurable: true
    });

    /* 工廠函數調用 */
    const $Call = {
        ...$Window,
        // 以下只有展示
        ElementFunctions: Object.keys($Node),
        EventFunctions: Object.keys($Event),
    };

    /**
     * * { 打印元素 }
     * @param {*} group - 打印元素標籤盒
     * @param {*} label - 打印的元素
     * @param {string} type - 要打印的類型 ("log", "warn", "error", "count")
     *
     * {
     * dev: true, - 開發人員設置打印
     * type="log", - 打印的類型
     * collapsed=true - 打印後是否收起
     * }
     */
    const Print = {
        log: label => console.log(label),
        warn: label => console.warn(label),
        trace: label => console.trace(label),
        error: label => console.error(label),
        count: label => console.count(label),
    };
    async function Log(group = null, label = "print", {dev=true, type="log", collapsed=true} = {}) {
        if (!dev) return;

        const Call = Print[type] || Print.log;

        if (group == null) Call(label);
        else {
            collapsed ? console.groupCollapsed(group) : console.group(group);
            Call(label);
            console.groupEnd();
        }
    };

    /**
     * * { 添加元素到 head }
     * @param {string} Rule - 元素內容
     * @param {string} ID - 元素ID
     * @param {boolean} RepeatAdd - 是否重複添加
     *
     * @example
     * AddStyle(Rule, ID, RepeatAdd)
     * AddScript(Rule, ID, RepeatAdd)
     */
    const AddCall = {
        AddStyle: (rule, id, repeatAdd=true)=> AddHead("style", rule, id, repeatAdd),
        AddScript: (rule, id, repeatAdd=true)=> AddHead("script", rule, id, repeatAdd),
    };
    async function AddHead(type, rule, id, repeatAdd) {
        let element = document.getElementById(id);
        if (!element) {
            element = document.createElement(type);
            element.id = id;
            document.head.appendChild(element);
        } else if (!repeatAdd) return;
        element.textContent += rule;
    };

    /**
     * * { 持續監聽DOM變化並執行回調函數 }
     *
     * @param {Element} target - 要觀察的DOM元素
     * @param {Function} onFunc - 當觀察到變化時執行的回調函數
     * @param {Object} [options] - 配置選項
     * @param {string} [options.mark=""] - 創建標記，避免重複創建觀察器
     * @param {number} [options.debounce=0] - 防抖時間(毫秒)
     * @param {boolean} [options.subtree=true] - 是否觀察目標及其所有後代節點的變化
     * @param {boolean} [options.childList=true] - 是否觀察子節點的添加或移除
     * @param {boolean} [options.attributes=true] - 是否觀察屬性變化
     * @param {boolean} [options.characterData=false] - 是否觀察文本內容變化
     * @param {Function} [callback=null] - 觀察器初始化後的回調，接收{ob, op}參數
     * @returns {MutationObserver} 創建的觀察器實例
     *
     * @example
     * Observer(document.body, () => {
     *     console.log("DOM發生變化");
     * }, {
     *     mark: "bodyObserver",
     *     debounce: 200
     * }, ({ ob, op }) => {
     *    ob.disconnect(); // 關閉觀察器
     *    ob.observe(document.body, op); // 重建觀察器
     * });
     */
    async function Observer(target, onFunc, options={}, callback=null) {
        const {
            mark="",
            debounce=0,
            subtree=true,
            childList=true,
            attributes=true,
            characterData=false,
        } = options ?? {};

        if (mark) {
            if (Mark[mark]) { return } else { Mark[mark] = true }
        };

        const op = {
            subtree: subtree,
            childList: childList,
            attributes: attributes,
            characterData: characterData
        }, ob = new MutationObserver(Debounce(() => { onFunc() }, debounce));
        ob.observe(target, op);

        callback && callback({ ob, op });
    };

    /**
     * * { 等待元素出現在DOM中並執行回調 }
     *
     * @param {string|string[]} selector - 要查找的選擇器 或 選擇器數組
     * @param {Function} [found=null] - 找到元素後執行的回調函數
     * @param {Object} [options] - 配置選項
     * @param {boolean} [options.raf=false] - 使用 requestAnimationFrame 進行查找 (極致快的查找, 沒有 debounce 限制, 用於盡可能最快找到元素)
     * @param {boolean} [options.all=false] - 是否以 all 查找, 僅支援 selector 是單個字串
     * @param {number} [options.timeout=8] - 超時時間(秒)
     * @param {number} [options.debounce=50] - 防抖時間(毫秒)
     * @param {boolean} [options.subtree=true] - 是否觀察所有後代節點
     * @param {boolean} [options.childList=true] - 是否觀察子節點變化
     * @param {boolean} [options.attributes=true] - 是否觀察屬性變化
     * @param {boolean} [options.characterData=false] - 是否觀察文本內容變化
     * @param {boolean} [options.timeoutResult=false] - 超時時是否返回已找到的結果
     * @param {Document|Element} [options.root=document] - 查找的根元素
     * @returns {Promise<Element|Element[]|null>} 返回找到的元素或元素數組的Promise
     *
     * @example
     * WaitElem(".example-element", element => {
     *     console.log("找到元素:", element);
     * });
     *
     * WaitElem(".example-element")
     *   .then(element => {
     *     console.log("找到元素:", element);
     *   });
     *
     * WaitElem([".header", ".main", ".footer"])
     *   .then(([header, main, footer]) => {
     *     console.log("找到所有元素:", header, main, footer);
     *   });
     *
     * WaitElem(".example-element", null, {raf: true, root: document.getElementById("app")}).then(element => {
     *     console.log("找到動態內容:", element);
     * });
     */
    const WaitCore = {
        queryMap: (selector) => {
            const result = selector.map(select => Selector(document, select));
            return result.every(Boolean) && result;
        },
        queryElement: (selector, all) => {
            const result = Selector(document, selector, all);
            return (all ? result.length > 0 : result) && result;
        }
    };
    async function WaitElem(selector, found=null, options={}) {
        const Query = Array.isArray(selector) ? WaitCore.queryMap : WaitCore.queryElement; //! 批量查找只能傳 Array
        const {
            raf=false,
            all=false,
            timeout=8,
            debounce=50,
            subtree=true,
            childList=true,
            attributes=true,
            characterData=false,
            timeoutResult=false,
            root=document
        } = options ?? {};

        return new Promise((resolve, reject) => {

            const Core = async function () {
                let timer, result;

                if (raf) {
                    let AnimationFrame;

                    const query = () => {
                        result = Query(selector, all);

                        if (result) {
                            cancelAnimationFrame(AnimationFrame);
                            clearTimeout(timer);

                            found && found(result);
                            resolve(result);
                        } else {
                            AnimationFrame = requestAnimationFrame(query);
                        }
                    };

                    AnimationFrame = requestAnimationFrame(query);

                    timer = setTimeout(() => {
                        cancelAnimationFrame(AnimationFrame);

                        if (timeoutResult) {
                            found && found(result);
                            resolve(result);
                        }
                    }, (1000 * timeout));

                } else {
                    const observer = new MutationObserver(Debounce(() => {
                        result = Query(selector, all);

                        if (result) {
                            observer.disconnect();
                            clearTimeout(timer);

                            found && found(result);
                            resolve(result);
                        }
                    }, debounce));

                    observer.observe(root, {
                        subtree: subtree,
                        childList: childList,
                        attributes: attributes,
                        characterData: characterData
                    });

                    timer = setTimeout(() => {
                        observer.disconnect();
                        if (timeoutResult) {
                            found && found(result);
                            resolve(result);
                        }
                    }, (1000 * timeout));
                }
            };

            if (document.visibilityState === "hidden") {
                document.$one("visibilitychange", () => Core(), { once: true });
            } else Core();
        })
    };

    /**
     * * { 瀏覽器 Storage 操作 }
     * @param {string} key - 要操作的鍵
     * @param {object} options - 配置選項
     * @param {any} [options.value] - 要儲存的值
     * @param {any} [options.error] - 預設錯誤值
     * @returns {any}
     *
     * @example
     * 支援的類型 (String, Number, Array, Object, Boolean, Date, Map)
     *
     * Session("數據", {value: 123, error: false})
     * Session("數據")
     *
     * Local("數據", {value: 123, error: null})
     */
    const StorageCall = {
        Session: (key, {value=null, error=undefined}={}) => Storage(key, sessionStorage, value, error),
        Local: (key, {value=null, error=undefined}={}) => Storage(key, localStorage, value, error)
    };
    const StorageHandlers = {
        String: (storage, key, value) =>
            value != null ? (storage.setItem(key, JSON.stringify(value)), true) : JSON.parse(key),
        Number: (storage, key, value) =>
            value != null ? (storage.setItem(key, JSON.stringify(value)), true) : Number(key),
        Array: (storage, key, value) =>
            value != null ? (storage.setItem(key, JSON.stringify(value)), true)
                : (key = JSON.parse(key), Array.isArray(key[0]) ? new Map(key) : key),
        Object: (storage, key, value) =>
            value != null ? (storage.setItem(key, JSON.stringify(value)), true) : JSON.parse(key),
        Boolean: (storage, key, value) =>
            value != null ? (storage.setItem(key, JSON.stringify(value)), true) : JSON.parse(key),
        Date: (storage, key, value) =>
            value != null ? (storage.setItem(key, JSON.stringify(value)), true) : new Date(key),
        Map: (storage, key, value) =>
            (storage.setItem(key, JSON.stringify([...value])), true)
    };
    function Storage(key, type, value, error) {
        let data;
        return value != null
            ? StorageHandlers[Type(value)](type, key, value)
            : (data = type.getItem(key), data != undefined ? StorageHandlers[Type(JSON.parse(data))](type, data) : error);
    };

    /**
     * * { 節流函數, 立即觸發, 後續按照指定的速率運行, 期間多餘的觸發將會被忽略 }
     * @param {function} func - 要觸發的函數
     * @param {number} delay - 延遲的時間ms
     * @returns {function}
     *
     * @example
     * a = Throttle(()=> {}, 100);
     * a();
     *
     * function b(n) {
     *      Throttle(b(n), 100);
     * }
     *
     * document.addEventListener("pointermove", Throttle(()=> {
     * }), 100)
     */
    function Throttle(func, delay) {
        let lastTime = 0;
        return (...args) => {
            const now = Date.now();
            if ((now - lastTime) >= delay) {
                lastTime = now;
                func(...args);
            }
        }
    };

    /**
     * * { 防抖函數 Debounce, 只會在停止呼叫後觸發, 持續呼叫就會一直重置 }
     * @param {function} func - 要觸發的函數
     * @param {number} delay - 延遲的時間ms
     * @returns {function}
     *
     * @example
     * 使用方法同上, 改成 Debounce() 即可
     */
    function Debounce(func, delay) {
        let timer = null;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(function () {
                func(...args);
            }, delay);
        }
    };

    /* ========== 請求數據處理 ========== */

    /**
     * * 解析範圍進行設置 (索引從 1 開始)
     *
     * @param {string} scope  - 設置的索引範圍 [1, 2, 3-5, 6~10, -4, !8]
     * @param {array} object  - 需要設置範圍的物件
     * @returns {object}      - 回傳設置完成的物件
     *
     * @example
     * object = ScopeParsing("", object);
     */
    function ScopeParsing(scope, object) {
        if (typeof scope !== "string" || scope.trim() === "") return object;

        const len = object.length;
        const result = new Set(), exclude = new Set();
        const scopeGenerate = (start, end, save) => { // 生成一個範圍
            const judge = start <= end;
            for ( // 根據數字大小順序, 生成索引值
                let i = start;
                judge ? i <= end : i >= end;
                judge ? i++ : i--
            ) { save.add(i) }
        };

        let str;
        for (str of scope.split(/\s*[\.,|/]\s*/)) { // 使用 , . / | 進行分割
            /* 可解析的類型
             * 1, -2, !3, 4~5, -6~7, !8-9
             */
            if (/^(!|-)?\d+(~\d+|-\d+)?$/.test(str)) {
                const noneHead = str.slice(1); // 獲取一個從 第二個字元開始的字串
                const isExclude = /^[!-]/.test(str);
                const isRange = /[~-]/.test(noneHead); // 由無頭字串, 判斷內部是否含有範圍字串

                const [save, number] = isExclude
                    ? [exclude, noneHead] // 是排除對象, 傳遞 (排除, 去除首字元為排除符的字串)
                    : [result, str]; // 不是排除對象, 傳遞 (結果, 原始字串)

                const [start, end] = isRange
                    ? number.split(/-|~/) // 是範圍的已範圍符, 拆分成開始與結束
                    : [number, number]; // 不是範圍的, 開始與結束相同

                start == end
                    ? save.add(+start - 1) // 單數字, 將開始與結束, 進行 -1 取得物件索引
                    : scopeGenerate(+start - 1, +end - 1, save); // 是範圍
            }
        };

        // 使用排除過濾出剩下的索引, 並按照順序進行排序
        const final_obj = [...result].filter(index => !exclude.has(index) && index < len && index >= 0).sort((a, b) => a - b);
        // 回傳最終的索引物件
        return final_obj.map(index => object[index]);
    };

    /**
     * * { 用於解析格式, 回傳匹配模板的結果 }
     * @param {object} template - 可被匹配的模板
     * @param {string|object} format - 匹配的格式字串, 要匹配模板的對應 key, 使用 {key} 來標記
     * @returns {string}
     *
     * @example
     * format 是字串, template 不傳參
     * format 是物件, template 可自由設置, 傳參或是不傳參
     *
     * const template {
     *      Title: "一個標題",
     *      Name: ()=> 處理邏輯
     * };
     *
     * const format = "{Title} {Name} {Title}";
     * const result = FormatTemplate(template, format);
     * console.log(result);
     */
    const TemplateUtils = {
        Process: (template, key, value = null) => {
            const temp = template[key.toLowerCase()];
            return Type(temp) === "Function"
                ? temp(value)
                : (temp !== undefined ? temp : "None");
        }
    };
    function FormatTemplate(template, format) {

        if (Type(template) !== "Object") {
            return "Template must be an object";
        }

        // 將 template 的 keys 轉換成小寫
        template = Object.fromEntries(
            Object.entries(template).map(([key, value]) => [key.toLowerCase(), value])
        );

        if (Type(format) === "String") {
            return format.replace(/\{\s*([^}\s]+)\s*\}/g, (_, key) => TemplateUtils.Process(template, key));
        }
        if (Type(format) === "Object") {
            return Object.entries(format).map(([key, value]) => TemplateUtils.Process(template, key, value));
        }
        return { "Unsupported format": format };
    };

    /**
     * * { 輸出 TXT 檔案 }
     *
     * @param {*} Data      - 任意格式數據, 會被轉成文本
     * @param {string} Name - 輸出的檔名 (不用打副檔名)
     * @param {function} Success   - 選擇是否回傳輸出狀態
     *
     * @example
     * OutputTXT(Data, "MyTXT", Success=> {
     *      console.log(Success);
     * })
     */
    async function OutputTXT(Data, Name, Success=null) {
        try {
            Name = typeof Name !== "string" ? "Anonymous.txt" : Name.endsWith(".txt") ? Name : `${Name}.txt`;

            const Text = new Blob([Data], { type: "text/plain" });
            const Link = document.createElement("a");
            Link.href = URL.createObjectURL(Text);
            Link.download = Name;
            Link.click();

            URL.revokeObjectURL(Link.href);
            Link.remove();

            Success && Success({ State: true });
        } catch (error) { Success && Success({ State: false, Info: error }) }
    };

    /**
     * * { 輸出 Json 檔案 }
     *
     * @param {*} Data      - 可轉成 Json 格式的數據
     * @param {string} Name - 輸出的檔名 (不用打副檔名)
     * @param {function} Success   - 選擇是否回傳輸出狀態
     *
     * @example
     * OutputJson(JsonData, "MyJson", Success=> {
     *      console.log(Success);
     * })
     */
    async function OutputJson(Data, Name, Success=null) {
        try {
            Data = typeof Data !== "string" ? JSON.stringify(Data, null, 4) : Data;
            Name = typeof Name !== "string" ? "Anonymous.json" : Name.endsWith(".json") ? Name : `${Name}.json`;

            const Json = new Blob([Data], { type: "application/json" });
            const Link = document.createElement("a");
            Link.href = URL.createObjectURL(Json);
            Link.download = Name;
            Link.click();

            URL.revokeObjectURL(Link.href);
            Link.remove();

            Success && Success({ State: true });
        } catch (error) { Success && Success({ State: false, Info: error }) }
    };

    /* ========== 特別用途 ========== */

    /**
     * * { 獲取運行經過時間 }
     * @param {performance.now() | null} time - 傳入 performance.now() 或 空值
     * @param {string} {lable} - 打印的說明文字
     * @param {boolean} {log} - 是否直接打印
     * @param {boolean} {format} - 使用格式轉換為秒數
     * @param {string} {style} - 打印的風格
     *
     * @returns {performance.now()}
     *
     * @example
     * let start = Runtime();
     * let end = Runtime(start, {log: false});
     * console.log(end);
     *
     * let start = Runtime();
     * Runtime(start);
     */
    function Runtime(time = null, {lable="Elapsed Time:", log=true, format=true, style="\x1b[1m\x1b[36m%s\x1b[0m"} = {}) {
        if (!time) return performance.now();

        const result = format
            ? `${((performance.now() - time) / 1e3).toPrecision(3)}s`
            : performance.now() - time;

        return log ? console.log(style, `${lable} ${result}`) : result;
    };

    /**
     * * { 獲取當前時間格式 }
     * @param {string} format - 選擇輸出的格式 : {year}{month}{date}{hour}{minute}{second}
     * @returns {string} - 設置的時間格式, 或是預設值
     *
     * @example
     * GetDate("{year}/{month}/{date} {hour}:{minute}")
     */
    function GetDate(format=null) {
        const date = new Date();
        const defaultFormat = "{year}-{month}-{date} {hour}:{minute}:{second}";

        const formatMap = {
            year: date.getFullYear(),
            month: `${date.getMonth() + 1}`.padStart(2, "0"),
            date: `${date.getDate()}`.padStart(2, "0"),
            hour: `${date.getHours()}`.padStart(2, "0"),
            minute: `${date.getMinutes()}`.padStart(2, "0"),
            second: `${date.getSeconds()}`.padStart(2, "0")
        };

        const generate = (temp) => temp.replace(/{([^}]+)}/g, (_, key) => formatMap[key] ?? "Error");
        return generate(typeof format === "string" ? format : defaultFormat);
    };

    /**
     * * { 匹配翻譯對照 }
     * @param {object} word - 翻譯的字詞
     * @param {string} lang - 翻譯的語言
     * @param {string} defaultLang - 預設翻譯語言
     * @returns {object} - 匹配到的字詞
     * @example
     * 需要是對照的 Key, 沒有就會找到預設翻譯
     * const Word = {
     *      Traditional: {},
     *      Simplified: {},
     *      Japan: {},
     *      Russia: {},
     *      English: {}
     * }
     */
    const TranslUtils = {
        'ko': 'Korea',
        'ko-KR': 'Korea',
        'ja': 'Japan',
        'ja-JP': 'Japan',
        'ru': 'Russia',
        'ru-RU': 'Russia',
        'en': 'English',
        'en-US': 'English',
        'en-GB': 'English',
        'en-AU': 'English',
        'en-CA': 'English',
        'en-NZ': 'English',
        'en-IE': 'English',
        'en-ZA': 'English',
        'en-IN': 'English',
        'zh': 'Simplified',
        'zh-CN': 'Simplified',
        'zh-SG': 'Simplified',
        'zh-MY': 'Simplified',
        'zh-TW': 'Traditional',
        'zh-HK': 'Traditional',
        'zh-MO': 'Traditional'
    };
    function TranslMatcher(word, lang, defaultLang="en-US") {
        return word[TranslUtils[lang]]
            ?? word[TranslUtils[defaultLang]]
            ?? word[TranslUtils["en-US"]];
    };

    /* ========== 油猴 API ========== */

    /**
     * * { 菜單註冊 API }
     *
     * @grant GM_registerMenuCommand
     *
     * @param {object} Item  - 創建菜單的物件
     * @param {string} ID    - 創建菜單的 ID
     * @param {number} Index - 創建菜單的 ID 的 編號 (設置從多少開始)
     * @example
     *
     * Menu({
     *      "菜單1": {
     *          desc: "菜單描述",
     *          func: ()=> { 方法1() },
     *          hotkey: "a",
     *          close: true,
     *      },
     *      "菜單2": ()=> { 方法2(參數) }
     * }, "ID");
     */
    async function Menu(Item, ID = "Menu", Index = 1) {
        for (const [Name, options] of Object.entries(Item)) {
            GM_registerMenuCommand(Name, () => { options.func() }, {
                title: options.desc,
                id: `${ID}-${Index++}`,
                autoClose: options.close,
                accessKey: options.hotkey,
            });
        }
    };

    /**
     ** { 操作存儲空間 (精簡版) }
     *
     * @grant GM_setValue
     * @grant GM_getValue
     * @grant GM_listValues
     * @grant GM_deleteValue
     * @example
     *
     * dV("數據A") // 刪除數據
     * lV() // 列出所有數據
     * sV("存儲鍵", "數據") // 儲存數據
     * gV("存儲鍵", "錯誤回傳") // 取得數據
     * sJV("存儲鍵", "可轉換成 Json 的數據") // 儲存 JSON 數據
     * gJV("存儲鍵", "錯誤回傳") // 取得 JSON 格式數據
     */
    const StoreVerify = (val) => val !== void 0 ? val : "";
    const StoreCall = {
        dV: key => GM_deleteValue(key),
        lV: () => StoreVerify(GM_listValues()),
        sV: (key, value) => GM_setValue(key, value),
        gV: (key, error) => StoreVerify(GM_getValue(key, error)),
        sJV: (key, value) => GM_setValue(key, JSON.stringify(value, null, 4)),
        gJV: (key, value) => JSON.parse(StoreVerify(GM_getValue(key, value)))
    };

    /**
     ** { 監聽保存值的變化 }
     *
     * @grant GM_addValueChangeListener
     *
     * @param {array} object    - 一個可遍歷的, 標籤對象物件
     * @param {object} callback - 回條函數
     *
     * @example
     * 回條對象
     * key - 觸發的對象 key
     * ov - 對象舊值
     * nv - 對象新值
     * far - 是否是其他窗口觸發
     *
     * storeListen(["key1", "key2"], call=> {
     *      console.log(call.key, call.nv);
     * })
     */
    async function StoreListen(object, callback) {
        object.forEach(label => {
            if (!Mark[label]) {
                Mark[label] = true;
                GM_addValueChangeListener(label, function (key, old_value, new_value, remote) {
                    callback({ key, ov: old_value, nv: new_value, far: remote });
                })
            }
        })
    };

    return {
        ...DeviceCall, ...$Call, ...AddCall, ...StorageCall, ...StoreCall,
        Type, Log, Observer, WaitElem, Throttle, Debounce, ScopeParsing,
        FormatTemplate, OutputTXT, OutputJson, Runtime, GetDate, TranslMatcher,
        Menu, StoreListen,

        /**
         * * { 創建 Worker 工作文件 }
         * @param {string} code - 運行代碼
         * @returns {Worker}    - 創建的 Worker 連結
         */
        WorkerCreation: (code) => {
            const blob = new Blob([code], { type: "application/javascript" });
            return new Worker(URL.createObjectURL(blob));
        },

        /**
         * * { 暫停異步函數 }
         * @param {Integer} delay - 延遲毫秒
         * @returns { Promise }
         */
        Sleep: (delay) => new Promise(resolve => setTimeout(resolve, delay)),

        /**
         * * { 解析請求後的頁面, 成可查詢的 html 文檔 }
         * @param {htnl} html - 要解析成 html 的文檔
         * @returns {htnl}    - html 文檔
         */
        DomParse: (html) => Parser.parseFromString(html, "text/html"),

        /**
         * * { 清除不能用做檔名的字串 }
         * @param {string} name - 要修正的字串
         * @returns {string}    - 排除後的字串
         */
        NameFilter: (name) => name.replace(/[\/\?<>\\:\*\|":]/g, ""),

        /**
         * * { 取得下載圖片時的填充量 }
         * @param {number} pages - 下載物件的長度
         * @returns {number}     - 返回填充的值
         *
         * @example
         * const box = [下載圖片的連結]
         * const Fill = GetFill(box);
         */
        GetFill: (pages) => Math.max(2, `${pages}`.length),

        /**
         * * { 解析網址字串的副檔名 }
         * @param {string} link - 含有副檔名的連結
         * @returns {string}    - 回傳副檔名字串
         */
        ExtensionName: (link) => {
            try {
                return link.match(/\.([^.]+)$/)[1].toLowerCase() || "webp";
            } catch {
                return "webp";
            }
        },

        /**
         * ! 使用 this 勿修改為匿名函數
         * * { 回傳下載圖片的尾數 }
         * @param {number} index   - 圖片的頁數
         * @param {number} padding - 填充量 [由 GetFill() 取得填充量]
         * @param {string} filler  - 用於填充的字串
         * @param {string} type    - 圖片的副檔名, 輸入圖片的連結
         * @returns {string}       - 經填充後的尾數
         */
        Mantissa: function (index, padding, filler="0", type=null) {
            return type
                ? `${++index}`.padStart(padding, filler) + `.${this.ExtensionName(type)}`
                : `${++index}`.padStart(padding, filler);
        }
    };
})();