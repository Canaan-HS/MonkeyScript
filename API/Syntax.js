// ==UserScript==
// @name         Syntax
// @version      2025/08/08
// @author       Canaan HS
// @description  Library for simplifying code logic and syntax
// @namespace    https://greasyfork.org/users/989635
// @match        *://*/*
// @license      MPL-2.0
// ==/UserScript==

const Lib = (() => {
    const $domParser = new DOMParser();
    const $type = (object) => Object.prototype.toString.call(object).slice(8, -1);
    const deviceCall = {
        get sX() { return window.scrollX },
        get sY() { return window.scrollY },
        get iW() { return window.innerWidth },
        get iH() { return window.innerHeight },
        _cache: undefined,
        get platform() {
            if (!this._cache) {
                if (navigator.userAgentData?.mobile !== undefined) {
                    this._cache = navigator.userAgentData.mobile ? "Mobile" : "Desktop";
                } else if (window.matchMedia?.("(max-width: 767px), (pointer: coarse)")?.matches) {
                    this._cache = "Mobile";
                } else if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                    this._cache = "Mobile";
                } else {
                    this._cache = "Desktop";
                }
            }

            return this._cache;
        }
    };

    /* ========== 通用常用 ========== */

    /**
     * @description 查詢語法簡化
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
    function selector(root = document, select, all) {
        const head = select[0];
        const headless = select.slice(1);
        const complicated = /[ .#:[\]>+~*,()^$=]/.test(headless);

        if (complicated) {
            return all ? root.querySelectorAll(select) : root.querySelector(select);
        }

        if (!all && head === '#') { // ID選擇器 (#id)
            return root.getElementById(headless);
        }

        if (select[0] === '.') { // 類選擇器 (.class)
            const collection = root.getElementsByClassName(headless);
            return all ? [...collection] : collection[0];
        }

        // 標籤選擇器 (tag)
        const collection = root.getElementsByTagName(select);
        return all ? [...collection] : collection[0];
    };
    [Document.prototype, Element.prototype].forEach(proto => { // 註冊 document & element 原型
        proto.$q = function (select) {
            return selector(this, select, false);
        };
        proto.$qa = function (select) {
            return selector(this, select, true);
        };
    });

    const $node = {
        $text(value = null) {
            return value !== null ? (this.textContent = value?.trim()) : this.textContent?.trim();
        },
        $copy(deep = true) {
            return this.cloneNode(deep);
        },
        $iHtml(value = null) {
            return value !== null ? (this.innerHTML = value) : this.innerHTML;
        },
        $oHtml(value = null) {
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

    Object.assign(Node.prototype, $node); // 原型註冊
    const $text = Object.keys($node)[0]; // 處理可能的空值
    Object.defineProperty(Object.prototype, $text, {
        value: function (value = null) {
            return $node[$text].call(this, value);
        },
        writable: true,
        configurable: true
    });

    // 簡化語法糖
    const sugar = {
        $q: document.$q.bind(document),
        $Q: (root, select) => selector(root, select, false),
        $qa: document.$qa.bind(document),
        $Qa: (root, select) => selector(root, select, true),
        html: document.documentElement,
        head: document.head ?? selector(document, "head", false),
        body: document.body ?? selector(document, "body", false),
        img: document.images,
        link: document.links,
        script: document.scripts,
        style: document.styleSheets,
        $url: location.href,
        get url() { return location.href },
        $origin: location.origin,
        get origin() { return location.origin },
        $domain: location.hostname,
        get domain() { return location.hostname },
        $lang: navigator.language,
        get lang() { return navigator.language },
        $agen: navigator.userAgent,
        get agen() { return navigator.userAgent },
        get createFragment() { return document.createDocumentFragment() },
        title: (value = null) => value !== null ? (document.title = value) : document.title,
        cookie: (value = null) => value !== null ? (document.cookie = value) : document.cookie,
        createUrl: (object) => URL.createObjectURL(object),
        _on: (root, { type, listener, add }) => {
            if (typeof type === "string" && typeof listener === "function") {
                root.addEventListener(type, listener, add);
                return { [type]: () => root.removeEventListener(type, listener, add) };
            }
            return {};
        },
        /**
         * @description 創建元素
         * ! 並無對所有參數類型做嚴格檢查, 傳錯會直接報錯
         * @param {element|string} arg1 - 添加的根元素 或 創建元素標籤
         * @param {string|object} arg2 - 創建元素標籤 或 元素屬性, arg2 = arg1 == element ? string : object
         * @param {object|undefined} arg3 - 元素屬性 或 不傳參數
         * @param {string} [arg.id] - 元素ID
         * @param {string} [arg.title] - 元素標題
         * @param {string} [arg.class] - 元素類別
         * @param {string} [arg.text] - 元素內文
         * @param {number} [arg.rows] - 行數
         * @param {number} [arg.cols] - 列數
         * @param {object} [arg.on] - 監聽事件, 可用 [] 多設置
         * @param {string|object} [arg.style] - 元素樣式
         * @param {object} [arg.attr] - 元素屬性
         * @param {object} [arg.props] - 其餘屬性
         * @returns {element}
         * @example
         * const parent = document.querySelector("#parent");
         * createElement(parent, "div", { class: "child", text: "Hello World" });
         *
         * const container = createElement("div", {
         *  id: "container",
         *  class: "container",
         *  attr: { "container-id": "1" },
         *  on: {
         *      type: "click",
         *      listener: () => console.log("click"),
         *      add: {
         *          capture: true,
         *          once: true
         *      }
         * });
         * document.body.appendChild(container);
         */
        createElement(arg1, arg2, arg3) {
            const [root, tag, value = {}] = typeof arg1 === "string" ? [null, arg1, arg2] : [arg1, arg2, arg3];
            if (!tag) return;

            const {
                id, title, class: className, text: textContent = "",
                rows: rowSpan, cols: colSpan, on = {}, style = {}, attr = {}, ...props
            } = value;

            const element = Object.assign(document.createElement(tag), { textContent });

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

            // 設置監聽器
            const event = {};

            if (Array.isArray(on)) {
                on.forEach(item => Object.assign(event, this._on(element, item)));
            } else if (typeof on === "object") {
                Object.assign(event, this._on(element, on));
            }

            // 掛載監聽器函數
            Object.assign(element, {
                on(type, listener, add) {
                    this.addEventListener(type, listener, add);
                    Object.assign(event, {
                        [type]: () => this.removeEventListener(type, listener, add)
                    });
                },
                off(type) {
                    event[type]?.();
                    delete event[type];
                },
                offAll() {
                    Object.keys(event).forEach(type => {
                        event[type]();
                        delete event[type];
                    });
                }
            });

            return root instanceof HTMLElement ? root.appendChild(element) : element;
        },
    };

    /**
     * @description 簡化版監聽器 (不檢測是否重複添加, 不回傳註冊監聽器, 只能透過 once 移除)
     * @param {element|string} element - 監聽元素, 或查找字串
     * @param {string} type    - 監聽器類型 (支持批量添加同類型監聽器)
     * @param {*} listener     - 監聽後操作
     * @param {object} add     - 附加功能
     * @returns {boolean}      - 回傳添加狀態
     *
     * @example
     * onE(元素, "監聽類型", 觸發 => {
     *      觸發... 其他操作
     * }, {once: true, capture: true, passive: true}, 接收註冊狀態 => {
     *      console.log(註冊狀態)
     * })
     *
     * onE(元素, "監聽類型1, 監聽類型2|監聽類型3", 觸發 => {})
     */
    async function onE(element, type, listener, add = {}, resolve = null) {
        try {
            typeof element === "string" && (element = selector(document, element));

            let events = type.split(/\s*[\,|/]\s*/).filter(Boolean);

            if (events.length === 0) {
                throw new Error("No event types provided");
            }
            else if (events.length === 1) { // 原始 type 直接註冊
                element.addEventListener(type, listener, add);
            }
            else {
                let timeout = null;
                const trigger = (event) => { // 防抖處理多個相同事件類型
                    clearTimeout(timeout);
                    timeout = setTimeout(() => listener(event), 15);
                };
                // 解析後 type 個別註冊
                events.forEach(type => element.addEventListener(type, trigger, add));
            }

            resolve && resolve(true);
        } catch { resolve && resolve(false) }
    };

    const eventRecord = new Map();
    /**
     * ! 匹配全域的腳本建議使用 mark 定義鍵值
     * @description 添加監聽器 (可透過 offEvent 移除, element 和 type 不能有完全重複的, 否則會被排除)
     * @param {element|string} element - 監聽元素, 或查找字串
     * @param {string} type    - 監聽器類型
     * @param {Function} listener - 監聽後執行的函數
     * @param {boolean} [options.capture] - 是否捕獲事件
     * @param {boolean} [options.once] - 是否只觸發一次
     * @param {boolean} [options.passive] - 是否為被動事件
     * @param {string} [options.mark] - 自定義鍵值
     *
     * @example
     * onEvent(元素, "監聽類型", (event) => {
     *      觸發執行
     * }, {
     *    capture: true,
     *    once: true,
     *    passive: true,
     *    mark: "自定鍵值" // 因為有自定所以不能使用 WeakMap
     * });
     */
    async function onEvent(element, type, listener, options = {}) {
        const { mark, ...opts } = options;
        typeof element === "string" && (element = selector(document, element));
        const key = mark ?? element;
        const record = eventRecord.get(key);

        if (record?.has(type)) return;
        element.addEventListener(type, listener, opts);

        if (!record) eventRecord.set(key, new Map());
        eventRecord.get(key).set(type, listener);
    };

    /**
     * @description 移除監聽器
     * @param {element|string} element - 監聽元素, 或查找字串
     * @param {string} type - 監聽類型
     * @param {string} [mark] - 自定義鍵值 (預設使用 this)
     *
     * @example
     * offEvent(元素, "監聽類型")
     */
    async function offEvent(element, type, mark) {
        typeof element === "string" && (element = selector(document, element));
        const key = mark ?? element;
        const listen = eventRecord.get(key)?.get(type);
        if (listen) {
            element.removeEventListener(type, listen);
            eventRecord.get(key).delete(type);
        }
    };

    /**
     * @description 監聽網址變化
     * @param {function} callback - 回調 {type, url, domain} 
     * @param {number} timeout - 防抖 (毫秒) [設置延遲多少 ms 之後才回條]
     *
     * @example
     * onUrlChange(change => {
     *    console.log(change.url);
     * }, 100);
     */
    function onUrlChange(callback, timeout = 15) {
        let timer = null;
        let cleaned = false;
        let support_urlchange = false;

        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        const eventHandler = {
            urlchange: () => trigger('urlchange'),
            popstate: () => trigger('popstate'),
            hashchange: () => trigger('hashchange')
        };

        function trigger(type) {
            clearTimeout(timer);
            if (!support_urlchange && type === 'urlchange') support_urlchange = true; // 支援時設置為 true
            timer = setTimeout(() => {
                if (support_urlchange) off(false, true); // 支援時調用清除

                callback({
                    type: type,
                    url: location.href,
                    domain: location.hostname
                });
            }, Math.max(15, timeout));
        };

        /**
         * @param {boolean} all - 是否清除所有監聽器 (否會跳過最新的 urlchange 監聽器)
         * @param {boolean} clean - 是否要判斷已經被清理過 
         */
        function off(all = true, clean = false) {
            if (clean && cleaned) return;

            clearTimeout(timer);
            history.pushState = originalPushState;
            history.replaceState = originalReplaceState;
            all && window.removeEventListener('urlchange', eventHandler.urlchange);
            window.removeEventListener('popstate', eventHandler.popstate);
            window.removeEventListener('hashchange', eventHandler.hashchange);

            cleaned = true;
        };

        // 最新版本 url 監聽
        window.addEventListener('urlchange', eventHandler.urlchange);

        // 監聽 popstate
        window.addEventListener('popstate', eventHandler.popstate);

        // 監聽 hashchange
        window.addEventListener('hashchange', eventHandler.hashchange);

        // 監聽 pushState
        history.pushState = function () {
            originalPushState.apply(this, arguments);
            trigger('pushState');
        };

        // 監聽 replaceState
        history.replaceState = function () {
            originalReplaceState.apply(this, arguments);
            trigger('replacestate');
        };

        return { off };
    };

    /**
     * @description 打印元素
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
    const print = {
        log: label => console.log(label),
        warn: label => console.warn(label),
        trace: label => console.trace(label),
        error: label => console.error(label),
        count: label => console.count(label),
    };
    async function log(group = null, label = "print", { dev = true, type = "log", collapsed = true } = {}) {
        if (!dev) return;

        const Call = print[type] || print.log;

        if (group == null) Call(label);
        else {
            collapsed ? console.groupCollapsed(group) : console.group(group);
            Call(label);
            console.groupEnd();
        }
    };

    /**
     * @description 添加元素到 head
     * @param {string} Rule - 元素內容
     * @param {string} ID - 元素ID
     * @param {boolean} RepeatAdd - 是否重複添加
     *
     * @example
     * addStyle(Rule, ID, RepeatAdd)
     * addScript(Rule, ID, RepeatAdd)
     */
    const addRecord = new Set();
    const addCall = {
        addStyle: (rule, id, repeatAdd) => addHead("style", rule, id, repeatAdd),
        addScript: (rule, id, repeatAdd) => addHead("script", rule, id, repeatAdd),
    };
    async function addHead(type, rule, id = crypto.randomUUID(), repeatAdd = true) {
        if (!repeatAdd && addRecord.has(id)) return;

        let element = document.getElementById(id);
        if (!element) {
            element = document.createElement(type);
            element.id = id;

            // ? 應對新版瀏覽器, 奇怪的 Bug (暫時處理方式)
            const head = sugar.head;
            if (head) head.appendChild(element);
            else waitEl("head").then(head => {
                sugar.head = head;
                head.appendChild(element);
            })
        };

        element.textContent += rule;
        addRecord.add(id);
    };

    /**
     * @description 持續監聽 DOM 變化並執行回調函數 
     * @param {Element} target - 要觀察的DOM元素
     * @param {Function} onFunc - 當觀察到變化時執行的回調函數
     * @param {Object} [options] - 配置選項
     * @param {string} [options.mark=""] - 創建標記，避免重複創建觀察器
     * @param {number} [options.throttle=100] - 節流時間(毫秒) [預設使用]
     * @param {number} [options.debounce=0] - 防抖時間(毫秒) [⚠ 再同時設置節流與防抖時, 優先使用防抖]
     * @param {boolean} [options.subtree=true] - 是否觀察目標及其所有後代節點的變化
     * @param {boolean} [options.childList=true] - 是否觀察子節點的添加或移除
     * @param {boolean} [options.attributes=true] - 是否觀察屬性變化
     * @param {boolean} [options.characterData=false] - 是否觀察文本內容變化
     * @param {Function} [callback=null] - 觀察器初始化後的回調，接收{ob, op}參數
     * @returns {MutationObserver} 創建的觀察器實例
     *
     * @example
     * $observer(document.body, () => {
     *     console.log("DOM發生變化");
     * }, {
     *     mark: "bodyObserver",
     *     debounce: 200
     * }, ({ ob, op }) => {
     *    ob.disconnect(); // 關閉觀察器
     *    ob.observe(document.body, op); // 重建觀察器
     * });
     */
    const observerRecord = new Set();
    async function $observer(target, onFunc, options = {}, callback = null) {
        const {
            mark = "",
            debounce = 0,
            throttle = 100,
            subtree = true,
            childList = true,
            attributes = true,
            characterData = false,
        } = options || {};

        if (mark) {
            if (observerRecord.has(mark)) { return } else { observerRecord.add(mark) };
        };

        const [rateFunc, delayMs] = debounce > 0 ? [$debounce, debounce] : [$throttle, throttle];
        const op = {
            subtree: subtree,
            childList: childList,
            attributes: attributes,
            characterData: characterData
        }, ob = new MutationObserver(rateFunc(() => { onFunc() }, delayMs));

        ob.observe(target, op);
        callback && callback({ ob, op });
    };

    /**
     * @description 等待元素出現在 DOM 中並執行回調
     * @param {string|string[]} select - 要查找的選擇器 或 選擇器數組
     * @param {Function} [found=null] - 找到元素後執行的回調函數
     * @param {Object} [options] - 配置選項
     * @param {boolean} [options.raf=false] - 使用 requestAnimationFrame 進行查找 (極致快的查找, 沒有 debounce 限制, 用於盡可能最快找到元素)
     * @param {boolean} [options.all=false] - 是否以 all 查找
     * @param {number} [options.timeout=8] - 超時時間(秒)
     * @param {number} [options.throttle=0] - 節流時間(毫秒) [⚠ 再同時設置節流與防抖時, 優先使用節流]
     * @param {number} [options.debounce=50] - 防抖時間(毫秒) [預設使用]
     * @param {boolean} [options.visibility=true] - 是否在頁面可見時開始查找元素
     * @param {boolean} [options.subtree=true] - 是否觀察所有後代節點
     * @param {boolean} [options.childList=true] - 是否觀察子節點變化
     * @param {boolean} [options.attributes=true] - 是否觀察屬性變化
     * @param {boolean} [options.characterData=false] - 是否觀察文本內容變化
     * @param {boolean} [options.timeoutResult=false] - 超時時是否返回已找到的結果
     * @param {Document|Element} [options.root=document] - 查找的根元素
     * @returns {Promise<Element|Element[]|null>} 返回找到的元素或元素數組的Promise
     *
     * @example
     * waitEl(".example-element", element => {
     *     console.log("找到元素:", element);
     * });
     *
     * waitEl(".example-element")
     *   .then(element => {
     *     console.log("找到元素:", element);
     *   });
     *
     * waitEl([".header", ".main", ".footer"])
     *   .then(([header, main, footer]) => {
     *     console.log("找到所有元素:", header, main, footer);
     *   });
     *
     * waitEl(".example-element", null, {raf: true, root: document.getElementById("app")}).then(element => {
     *     console.log("找到動態內容:", element);
     * });
     */
    const waitCore = {
        queryMap: (select, all) => {
            const result = select.map(select => selector(document, select, all));
            return all
                ? result.every(res => res.length > 0) && result
                : result.every(Boolean) && result;
        },
        queryElement: (select, all) => {
            const result = selector(document, select, all);
            return (all ? result.length > 0 : result) && result;
        }
    };
    async function waitEl(select, found = null, options = {}) {
        const query = Array.isArray(select) ? waitCore.queryMap : waitCore.queryElement; //! 批量查找只能傳 Array
        const {
            raf = false,
            all = false,
            timeout = 8,
            throttle = 0,
            debounce = 50,
            visibility = true,
            subtree = true,
            childList = true,
            attributes = true,
            characterData = false,
            timeoutResult = false,
            root = document
        } = options || {};

        return new Promise((resolve, reject) => {

            const core = async function () {
                let timer, result;

                if (raf) {
                    let AnimationFrame;

                    const queryRun = () => {
                        result = query(select, all);

                        if (result) {
                            cancelAnimationFrame(AnimationFrame);
                            clearTimeout(timer);

                            found && found(result);
                            resolve(result);
                        } else {
                            AnimationFrame = requestAnimationFrame(queryRun);
                        }
                    };

                    AnimationFrame = requestAnimationFrame(queryRun);

                    timer = setTimeout(() => {
                        cancelAnimationFrame(AnimationFrame);

                        if (timeoutResult) {
                            found && found(result);
                            resolve(result);
                        }
                    }, (1000 * timeout));

                } else {
                    const [rateFunc, delayMs] = throttle > 0 ? [$throttle, throttle] : [$debounce, debounce];
                    const observer = new MutationObserver(rateFunc(() => {
                        result = query(select, all);

                        if (result) {
                            observer.disconnect();
                            clearTimeout(timer);

                            found && found(result);
                            resolve(result);
                        }
                    }, delayMs));

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

            if (visibility && document.visibilityState === "hidden") {
                document.addEventListener("visibilitychange", () => core(), { once: true });
            } else core();
        })
    };

    /**
     * @description 瀏覽器 storage 操作
     * @param {string} key - 要操作的鍵
     * @param {object} options - 配置選項
     * @param {any} [options.value] - 要儲存的值
     * @param {any} [options.error] - 預設錯誤值
     * @returns {any}
     *
     * @example
     * 支援的類型 (String, Number, Array, Object, Boolean, Date, Map)
     *
     * session("數據", {value: 123, error: false})
     * session("數據")
     *
     * local("數據", {value: 123, error: null})
     */
    const storageCall = {
        session: (key, { value = null, error = undefined } = {}) => storage(key, sessionStorage, value, error),
        local: (key, { value = null, error = undefined } = {}) => storage(key, localStorage, value, error)
    };
    const storageHandlers = {
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
    function storage(key, type, value, error) {
        let data;
        return value != null
            ? storageHandlers[$type(value)](type, key, value)
            : (data = type.getItem(key), data != undefined ? storageHandlers[$type(JSON.parse(data))](type, data) : error);
    };

    /**
     * @description 節流函數, 立即觸發, 後續按照指定的速率運行
     * @param {function} func - 要觸發的函數
     * @param {number} delay - 延遲的時間ms
     * @returns {function}
     *
     * @example
     * a = $throttle(()=> {}, 100);
     * a();
     *
     * function b(n) {
     *      $throttle(b(n), 100);
     * }
     *
     * document.addEventListener("pointermove", $throttle(()=> {
     * }), 100)
     */
    function $throttle(func, delay) {
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
     * @description 防抖函數 debounce, 只會在停止呼叫後觸發, 持續呼叫就會一直重置
     * @param {function} func - 要觸發的函數
     * @param {number} delay - 延遲的時間ms
     * @returns {function}
     *
     * @example
     * 使用方法同上, 改成 $debounce() 即可
     */
    function $debounce(func, delay) {
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
     * @description 創建 Worker 工作
     * @param {string} code - 運行代碼
     * @returns {Worker}    - 創建的 Worker 連結
     */
    function workerCreate(code) {
        const blob = new Blob([code], { type: "application/javascript" });
        return new Worker(URL.createObjectURL(blob));
    };

    /**
     * @description 解析範圍進行設置 (索引從 1 開始)
     * @param {string} scope  - 設置的索引範圍 [1, 2, 3-5, 6~10, -4, !8]
     * @param {array} object  - 需要設置範圍的物件
     * @returns {object}      - 回傳設置完成的物件
     *
     * @example
     * object = scopeParse("", object);
     */
    function scopeParse(scope, object) {
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
     * @description 用於解析格式, 回傳匹配模板的結果
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
     * const result = formatTemplate(template, format);
     * console.log(result);
     */
    const templateUtils = {
        Process: (template, key, value = null) => {
            const temp = template[key.toLowerCase()];
            return $type(temp) === "Function"
                ? temp(value)
                : (temp !== undefined ? temp : "None");
        }
    };
    function formatTemplate(template, format) {

        if ($type(template) !== "Object") {
            return "Template must be an object";
        }

        // 將 template 的 keys 轉換成小寫
        template = Object.fromEntries(
            Object.entries(template).map(([key, value]) => [key.toLowerCase(), value])
        );

        if ($type(format) === "String") {
            return format.replace(/\{\s*([^}\s]+)\s*\}/g, (_, key) => templateUtils.Process(template, key));
        }

        if ($type(format) === "Object") {
            return Object.entries(format).map(([key, value]) => templateUtils.Process(template, key, value));
        }

        return { "Unsupported format": format };
    };

    /**
     * @description 建立壓縮器
     * @returns {object} - 壓縮函數
     *
     * @example
     * const zipEngine = createCompressor();
     * const { destroyWorker, file, generateZip } = zipEngine;
     *
     * file('test.txt', 'Hello, World!');
     * generateZip(
     *     { level: 5 },
     *     progress => console.log(progress)
     * ).then(zip => {
     *     console.log(zip); // 壓縮後的 zip 檔
     * }).catch(err => {
     *     console.error(err);
     * });
     *
     * ---
     *
     * const zipEngine = createCompressor();
     * zipEngine.file('test.txt', 'Hello, World!');
     * zipEngine.generateZip().then(zip => {})
     */
    function createCompressor() {
        let worker = workerCreate(`
            importScripts('https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.min.js');
            onmessage = function(e) {
                const { files, level } = e.data;
                try {
                    const zipped = fflate.zipSync(files, { level });
                    postMessage({ data: zipped }, [zipped.buffer]);
                } catch (err) {
                    postMessage({ error: err.message });
                }
            }
        `);

        let files = {};
        let tasks = [];

        // 預估壓縮時間
        function estimateCompression() {
            const IO_THRESHOLD = 50 * 1024 * 1024; // 50MB，IO密集型任務的閾值
            const UNCOMPRESSIBLE_EXTENSIONS = new Set([
                // 影片 (大多數視頻編碼已經是高度壓縮)
                '.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.webm',
                '.mpg', '.mpeg', '.m4v', '.ogv', '.3gp', '.asf', '.ts',
                '.vob', '.rm', '.rmvb', '.m2ts', '.f4v', '.mts',

                // 壓縮包（不會再壓縮）
                '.zip', '.rar', '.7z', '.gz', '.bz2',

                // 影像（JPEG、PNG 已壓縮格式）
                '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif', '.svg',
                '.heic', '.heif', '.raw', '.ico', '.psd',

                // 音訊（幾乎不會再壓縮）
                '.mp3', '.aac', '.flac', '.wav', '.ogg',

                // 文件（PDF 有內建壓縮，有時無效）
                '.pdf',
            ]);


            // 為不同任務類型設定不同的基礎速度
            const IO_BYTES_PER_SECOND = 100 * 1024 * 1024; // 假設為 100MB/s 的內存吞吐率
            const CPU_BYTES_PER_SECOND = 25 * 1024 * 1024; // 假設為 25MB/s 的基礎壓縮速度

            let totalEstimatedTime = 0;
            let totalSize = 0;

            Object.entries(files).forEach(([name, file]) => {
                const fileSize = file.length;
                totalSize += fileSize;
                const extension = ('.' + name.split('.').pop()).toLowerCase();

                // 判斷任務類型
                if (fileSize > IO_THRESHOLD && UNCOMPRESSIBLE_EXTENSIONS.has(extension)) {
                    // I/O 密集型任務
                    totalEstimatedTime += fileSize / IO_BYTES_PER_SECOND;
                } else {
                    // CPU 密集型任務
                    let cpuTime = fileSize / CPU_BYTES_PER_SECOND;

                    // 對於 CPU 任務，可以保留一些基於大小的微調
                    const fileSizeMB = fileSize / (1024 * 1024);
                    if (fileSizeMB > 10) {
                        cpuTime *= (1 + Math.log10(fileSizeMB / 10) * 0.1);
                    }
                    totalEstimatedTime += cpuTime;
                }
            });

            // 檔案數量的影響 (少量檔案的固定開銷)
            const fileCount = Object.keys(files).length;
            if (fileCount > 1) {
                totalEstimatedTime += fileCount * 0.01; // 為每個額外檔案增加 10ms 的基礎開銷
            }

            // 總大小的影響 (輕微)
            const totalSizeMB = totalSize / (1024 * 1024);
            if (totalSizeMB > 100) {
                totalEstimatedTime *= (1 + Math.log10(totalSizeMB / 100) * 0.05);
            }

            // 進度條視覺平滑化 (這部分不影響總時長預測，純粹是UI體驗)
            const calculateCurveParameter = (totalSizeMB) => {
                if (totalSizeMB < 50) return 5;
                if (totalSizeMB < 500) return 4;
                return 3;
            };
            const curveParameter = calculateCurveParameter(totalSizeMB);

            return {
                estimatedInMs: totalEstimatedTime * 1000,
                progressCurve: (ratio) => 100 * (1 - Math.exp(-curveParameter * ratio)) / (1 - Math.exp(-curveParameter))
            };
        };

        return {
            // 清除 worker
            async destroyWorker() {
                if (worker) {
                    worker.terminate();
                    worker = null;
                }
            },

            // 存入 blob 進行檔案壓縮
            async file(name, blob) {
                const task = new Promise(async resolve => {
                    const buffer = await blob.arrayBuffer();
                    files[name] = new Uint8Array(buffer);
                    resolve();
                });

                tasks.push(task);
                return task;
            },

            // 生成壓縮文件
            async generateZip(options = {}, progressCallback) {
                await Promise.all(tasks); // 等待所有檔案加入

                const startTime = performance.now();

                const updateInterval = 30; // 更新頻率
                const estimationData = estimateCompression();
                const totalTime = estimationData.estimatedInMs;

                // 假進度模擬, 檔案越大誤差越大
                const progressInterval = setInterval(() => {
                    const elapsedTime = performance.now() - startTime;
                    const ratio = Math.min(elapsedTime / totalTime, 0.99); // 限制在99%以內
                    const fakeProgress = estimationData.progressCurve(ratio);

                    if (progressCallback) progressCallback(fakeProgress);

                    if (ratio >= 0.99) {
                        clearInterval(progressInterval);
                    }
                }, updateInterval);

                return new Promise((resolve, reject) => {
                    if (Object.keys(files).length === 0) return reject("Empty Data Error");

                    worker.postMessage({
                        files,
                        level: options.level || 5
                    }, Object.values(files).map(buf => buf.buffer));

                    worker.onmessage = (e) => {
                        clearInterval(progressInterval);

                        if (progressCallback) progressCallback(100);

                        files = {};
                        tasks = [];

                        const { error, data } = e.data;
                        error ? reject(error) : resolve(new Blob([data], { type: "application/zip" }));
                    }
                });
            },
        }
    };

    /**
     * @description 創建動態網路觀察器
     * @param {Object} [config] - 配置參數
     * @param {number} [config.MAX_Delay] - 最大延遲 (毫秒)
     * @param {number} [config.MIN_CONCURRENCY] - 最小並發
     * @param {number} [config.MAX_CONCURRENCY] - 最大並發
     * @param {number} [config.TIME_THRESHOLD] - 響應時間閾值 (毫秒)
     * @param {number} [config.Network_Check_Interval] - 網路檢測間隔 (毫秒)
     * @param {number} [config.Good_Network_THRESHOLD] - 好網路閾值 (毫秒)
     * @param {number} [config.Poor_Network_THRESHOLD] - 糟網路閾值 (毫秒)
     * @param {number} [config.EMA_ALPHA] - 指數移動平均 (0-1)
     * @param {number} [config.ADJUSTMENT_FACTOR] - 調整因子
     * @returns {Function} - dynamicParam 用於動態設置延遲與並發
     * @example
     * const dynamicParam = createNnetworkObserver();
     * 
     * let 預設延遲 = 1000;
     * let 預設線程數 = 5;
     * const 預設最小延遲 = 100;
     *
     * [ 預設延遲, 預設線程數 ] = dynamicParam(new Date(), 預設延遲, 預設線程數, 預設最小延遲)
     *
     * 預設延遲 = dynamicParam(new Date(), 預設延遲)
     */
    function createNnetworkObserver(config = {}) {
        let {
            /* 建議自訂參數 */
            MAX_Delay = 2e3, // 最大延遲
            MIN_CONCURRENCY = 1, // 最小並發
            MAX_CONCURRENCY = 16, // 最大並發

            Good_Network_THRESHOLD = 500, // 好網路閾值
            Poor_Network_THRESHOLD = 1500, // 糟網路閾值

            adaptiveFactors = { // 不同網路狀態下的調整因子 (大於 1 為增加, 小於 1 為減少)
                good: { delayFactor: 0.8, threadFactor: 1.2 },
                normal: { delayFactor: 1.0, threadFactor: 1.0 },
                poor: { delayFactor: 1.5, threadFactor: 0.7 }
            },

            /* 通常不需要修改 */
            TIME_THRESHOLD = 1000, // 初始響應時間閾值
            Network_Check_Interval = 1e4, // 網路檢測間隔 (10秒)
            EMA_ALPHA = 0.3, // 指數移動平均的平滑因子
            ADJUSTMENT_FACTOR = 0.25, // 每次調整的幅度因子
            History_Size = 10, // 響應時間歷史記錄的大小
        } = config || {};

        let {
            responseHistory = [], // 儲存最近的響應時
            lastNetworkCheck = 0, // 上次檢測的時間
            networkCondition = 'normal', // 網路狀態 'good', 'normal', 'poor'
        } = {};

        function checkNetworkCondition() {
            const now = Date.now();

            if (now - lastNetworkCheck < Network_Check_Interval) {
                return networkCondition;
            }

            lastNetworkCheck = now;

            if (navigator.connection) {
                const { effectiveType, saveData } = navigator.connection;

                if (effectiveType === '4g' && !saveData) networkCondition = 'good';
                else if (effectiveType === '3g' || (effectiveType === '4g' && saveData)) networkCondition = 'normal';
                else networkCondition = 'poor';

            } else if (responseHistory.length >= 5) {
                const avgResponseTime = responseHistory.reduce((a, b) => a + b, 0) / responseHistory.length;

                if (avgResponseTime < Good_Network_THRESHOLD) networkCondition = 'good';
                else if (avgResponseTime > Poor_Network_THRESHOLD) networkCondition = 'poor';
                else networkCondition = 'normal';

            }

            return networkCondition;
        };

        function updateThreshold(newResponseTime) {
            responseHistory.push(newResponseTime);

            if (responseHistory.length > History_Size) responseHistory.shift();

            if (!TIME_THRESHOLD || responseHistory.length <= 1) {
                TIME_THRESHOLD = newResponseTime;
            } else {
                TIME_THRESHOLD = EMA_ALPHA * newResponseTime + (1 - EMA_ALPHA) * TIME_THRESHOLD;
            }

            TIME_THRESHOLD = Math.max(20, Math.min(2000, TIME_THRESHOLD));
        };

        return function dynamicParam(time, currentDelay, currentThread = null, minDelay = 0) {
            const responseTime = Date.now() - time;
            updateThreshold(responseTime);

            const { delayFactor, threadFactor } = adaptiveFactors[checkNetworkCondition()];
            const ratio = responseTime / TIME_THRESHOLD;

            const delayChange = (ratio - 1) * ADJUSTMENT_FACTOR * delayFactor;

            let newDelay = currentDelay * (1 + delayChange);
            newDelay = Math.max(minDelay, Math.min(newDelay, MAX_Delay));

            if (currentThread !== null) {
                const threadChange = (ratio - 1) * ADJUSTMENT_FACTOR * threadFactor;

                let newThread = currentThread * (1 - threadChange);
                newThread = Math.max(MIN_CONCURRENCY, Math.min(newThread, MAX_CONCURRENCY));

                return [Math.round(newDelay), Math.round(newThread)]; // 回傳新的 延遲 和 並發
            }

            return Math.round(newDelay); // 回傳新的延遲
        }
    };

    /**
     * @description 輸出 TXT 檔案
     * @param {*} Data      - 任意格式數據, 會被轉成文本
     * @param {string} Name - 輸出的檔名 (不用打副檔名)
     * @param {function} Success   - 選擇是否回傳輸出狀態
     *
     * @example
     * outputTXT(Data, "MyTXT", Success=> {
     *      console.log(Success);
     * })
     */
    async function outputTXT(Data, Name, Success = null) {
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
     * @description 輸出 Json 檔案
     * @param {*} Data      - 可轉成 Json 格式的數據
     * @param {string} Name - 輸出的檔名 (不用打副檔名)
     * @param {function} Success   - 選擇是否回傳輸出狀態
     *
     * @example
     * outputJson(JsonData, "MyJson", Success=> {
     *      console.log(Success);
     * })
     */
    async function outputJson(Data, Name, Success = null) {
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
     * @description 獲取運行經過時間
     * @param {performance.now() | null} time - 傳入 performance.now() 或 空值
     * @param {string} {lable} - 打印的說明文字
     * @param {boolean} {log} - 是否直接打印
     * @param {boolean} {format} - 使用格式轉換為秒數
     * @param {string} {style} - 打印的風格
     *
     * @returns {performance.now()}
     *
     * @example
     * let start = runTime();
     * let end = runTime(start, {log: false});
     * console.log(end);
     *
     * let start = runTime();
     * runTime(start);
     */
    function runTime(time = null, { lable = "Elapsed Time:", log = true, format = true, style = "\x1b[1m\x1b[36m%s\x1b[0m" } = {}) {
        if (!time) return performance.now();

        const result = format
            ? `${((performance.now() - time) / 1e3).toPrecision(3)}s`
            : performance.now() - time;

        return log ? console.log(style, `${lable} ${result}`) : result;
    };

    /**
     * @description 獲取當前時間格式
     * @param {string} format - 選擇輸出的格式 : {year}{month}{date}{hour}{minute}{second}
     * @returns {string} - 設置的時間格式, 或是預設值
     *
     * @example
     * getDate("{year}/{month}/{date} {hour}:{minute}")
     */
    function getDate(format = null) {
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
     * @description 匹配翻譯對照
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
    const translUtils = {
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
    function translMatcher(word, lang = navigator.language, defaultLang = "en-US") {
        return word[translUtils[lang]]
            ?? word[translUtils[defaultLang]]
            ?? word[translUtils["en-US"]];
    };

    /* ========== 油猴 API ========== */

    /**
     * @description 菜單註冊
     * @grant GM_registerMenuCommand
     * @grant GM_unregisterMenuCommand
     *
     * @param {object} items - 創建菜單的物件
     * @param {string} [options.name] - 創建菜單的 名稱
     * @param {number} [options.index] - 創建菜單的 名稱 編號 (設置從多少開始)
     * @param {boolean} [options.reset] - 是否重置菜單
     * @example
     *
     * regMenu({
     *      "菜單1": {
     *          desc: "菜單描述",
     *          func: ()=> { 方法1() },
     *          hotkey: "a",
     *          close: true,
     *      },
     *      "菜單2": ()=> { 方法2(參數) }
     * }, "ID");
     */
    const Register = new Set();
    function regMenu(items, options = {}) {
        let {
            name = "regMenu",
            index = 1,
            reset = false
        } = options || {};

        if (reset) {
            [...Register].map(id => GM_unregisterMenuCommand(id));
            Register.clear();
        };

        for (let [show, item] of Object.entries(items)) {
            const id = `${name}-${index++}`;

            // 允許 "菜單": ()=> 函數() 這種格式
            typeof item === "function" && (item = { func: item });

            GM_registerMenuCommand(show, () => { item.func() }, {
                id,
                title: item.desc,
                autoClose: item.close,
                accessKey: item.hotkey,
            });

            Register.add(id);
        }
    };

    /**
     * @description 移除菜單
     * @grant GM_unregisterMenuCommand
     * @example
     *
     * unMenu("ID");
     * unMenu("All");
     */
    async function unMenu(id) {
        if (id.toLowerCase() === "all") {
            [...Register].map(id => GM_unregisterMenuCommand(id));
            Register.clear();
        } else {
            if (Register.has(id)) {
                GM_unregisterMenuCommand(id);
                Register.delete(id);
            }
        }
    };

    /**
     * @description 操作存儲空間
     * @grant GM_setValue
     * @grant GM_getValue
     * @grant GM_listValues
     * @grant GM_deleteValue
     * @example
     *
     * delV("數據A") // 刪除數據
     * allV() // 列出所有數據
     * setV("存儲鍵", "數據") // 儲存數據
     * getV("存儲鍵", "錯誤回傳") // 取得數據
     * setJV("存儲鍵", "可轉換成 Json 的數據") // 儲存 JSON 數據
     * getJV("存儲鍵", "錯誤回傳") // 取得 JSON 格式數據
     */
    const storeVerify = (val) => val === void 0 || val === null ? null : val;
    const storeCall = {
        delV: key => GM_deleteValue(key),
        allV: () => storeVerify(GM_listValues()),
        setV: (key, value) => GM_setValue(key, value),
        getV: (key, error) => storeVerify(GM_getValue(key, error)),
        setJV: (key, value, space = 0) => GM_setValue(key, JSON.stringify(value, null, space)),
        getJV(key, error) {
            try { return JSON.parse(storeVerify(GM_getValue(key, error))) }
            catch { return error }
        }
    };

    /**
     * @description 監聽保存值的變化
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
    const listenRecord = new Set();
    async function storeListen(object, callback) {
        object.forEach(label => {
            if (!listenRecord.has(label)) {
                listenRecord.add(label);
                GM_addValueChangeListener(label, function (key, old_value, new_value, remote) {
                    callback({ key, ov: old_value, nv: new_value, far: remote });
                })
            }
        })
    };

    /* ========== [ 其他 ] ========== */

    function _keepGetterMerge(...sources) {
        const target = {};
        for (const source of sources) {
            if (!source) continue;
            Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
        }
        return target;
    };

    return _keepGetterMerge(
        deviceCall, sugar, // 含有 get() 的語法糖, 不能直接展開合併, 展開時會直接調用變成一般的 value
        {
            ...addCall, ...storageCall, ...storeCall,
            $type, eventRecord, onE, onEvent, offEvent, onUrlChange, log, $observer, waitEl, $throttle, $debounce, scopeParse,
            workerCreate, formatTemplate, createCompressor, createNnetworkObserver, outputTXT, outputJson, runTime, getDate, translMatcher,
            regMenu, unMenu, storeListen,

            /**
             * @description 暫停異步函數
             * @param {Integer} delay - 延遲毫秒
             * @returns { Promise }
             */
            sleep: (delay) => new Promise(resolve => setTimeout(resolve, delay)),

            /**
             * @description 解析請求後的頁面, 為 dom 文件
             * @param {htnl} html - 要解析成 html 的文檔
             * @returns {htnl}    - html 文檔
             */
            domParse: (html) => $domParser.parseFromString(html, "text/html"),

            /**
             * @description 清除不能用做檔名的字串
             * @param {string} name - 要修正的字串
             * @returns {string}    - 排除後的字串
             */
            nameFilter: (name) => name.replace(/[\/\?<>\\:\*\|":]/g, "").trim(),

            /**
             * @description 取得下載圖片時的填充量
             * @param {number} pages - 下載物件的長度
             * @returns {number}     - 返回填充的值
             *
             * @example
             * const box = [下載圖片的連結]
             * const Fill = getFill(box);
             */
            getFill: (pages) => Math.max(2, `${pages}`.length),

            /**
             * @description 解析網址字串的副檔名
             * @param {string} url - 含有副檔名的連結
             * @param {string} defaultType - 預設副檔名
             * @returns {string}    - 回傳副檔名字串
             */
            suffixName(url, defaultType = "webp") {
                try {
                    if (!url) return defaultType;

                    const uri = new URL(url, location.href);
                    const regex = /\.([^.]+)$/;
                    const suffix = uri.pathname.match(regex)?.[1] || uri.search.match(regex)?.[1];

                    return suffix?.toLowerCase().trim() || defaultType;
                } catch {
                    return defaultType;
                }
            },

            /**
             * ! 使用 this 勿修改為匿名函數
             * @description 回傳下載圖片的尾數
             * @param {number} index   - 圖片的頁數
             * @param {number} padding - 填充量 [由 getFill() 取得填充量]
             * @param {string} filler  - 用於填充的字串
             * @param {string} url    - 圖片的副檔名, 輸入圖片的連結
             * @returns {string}       - 經填充後的尾數
             */
            mantissa(index, padding, filler = "0", url = null) {
                return url
                    ? `${++index}`.padStart(padding, filler) + `.${this.suffixName(url)}`
                    : `${++index}`.padStart(padding, filler);
            }
        });
})();