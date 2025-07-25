// ==UserScript==
// @name         SyntaxLite
// @version      2025/06/30
// @author       Canaan HS
// @description  Library for simplifying code logic and syntax (Lite)
// @namespace    https://greasyfork.org/users/989635
// @match        *://*/*
// @license      MPL-2.0
// ==/UserScript==

const Syn = (() => {
    const Mark = {};
    const Type = (object) => Object.prototype.toString.call(object).slice(8, -1);
    const DeviceCall = {
        get sX() { return window.scrollX },
        get sY() { return window.scrollY },
        get iW() { return window.innerWidth },
        get iH() { return window.innerHeight },
        _Cache: undefined,
        get Platform() {
            if (!this._Cache) {
                if (navigator.userAgentData?.mobile !== undefined) {
                    this._Cache = navigator.userAgentData.mobile ? "Mobile" : "Desktop";
                } else if (window.matchMedia?.("(max-width: 767px), (pointer: coarse)")?.matches) {
                    this._Cache = "Mobile";
                } else if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                    this._Cache = "Mobile";
                } else {
                    this._Cache = "Desktop";
                }
            }

            return this._Cache;
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
    function Selector(root = document, selector, all) {
        const head = selector[0];
        const headless = selector.slice(1);
        const complicated = /[ #.\[:]/.test(headless);

        if (complicated) {
            return all ? root.querySelectorAll(selector) : root.querySelector(selector);
        }

        if (!all && head === '#') { // ID選擇器 (#id)
            return root.getElementById(headless);
        }

        if (selector[0] === '.') { // 類選擇器 (.class)
            const collection = root.getElementsByClassName(headless);
            return all ? [...collection] : collection[0];
        }

        // 標籤選擇器 (tag)
        const collection = root.getElementsByTagName(selector);
        return all ? [...collection] : collection[0];
    };
    [Document.prototype, Element.prototype].forEach(proto => { // 註冊 document & element 原型
        proto.$q = function (selector) {
            return Selector(this, selector, false);
        };
        proto.$qa = function (selector) {
            return Selector(this, selector, true);
        };
    });

    const $Node = {
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

    Object.assign(Node.prototype, $Node); // 原型註冊
    const $text = Object.keys($Node)[0]; // 處理可能的空值
    Object.defineProperty(Object.prototype, $text, {
        value: function (value = null) {
            return $Node[$text].call(this, value);
        },
        writable: true,
        configurable: true
    });

    // 簡化語法糖
    const Sugar = {
        $q: document.$q.bind(document),
        Q: (root, selector) => Selector(root, selector, false),
        $qa: document.$qa.bind(document),
        Qa: (root, selector) => Selector(root, selector, true),
        html: document.documentElement,
        head: document.head ?? Selector(document, "head", false),
        body: document.body ?? Selector(document, "body", false),
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
         * * { 創建元素 }
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

            if (typeof on === "object") {
                Object.assign(event, this._on(element, on));
            } else if (Array.isArray(on)) {
                on.forEach(item => Object.assign(event, this._on(element, item)));
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

    const EventRecord = new Map();
    /**
     * * { 簡化版監聽器 (不檢測是否重複添加, 不回傳註冊監聽器, 只能透過 once 移除) }
     * @param {element|string} element - 監聽元素, 或查找字串
     * @param {string} type    - 監聽器類型 (支持批量添加同類型監聽器)
     * @param {*} listener     - 監聽後操作
     * @param {object} add     - 附加功能
     * @returns {boolean}      - 回傳添加狀態
     *
     * @example
     * one(元素, "監聽類型", 觸發 => {
     *      觸發... 其他操作
     * }, {once: true, capture: true, passive: true}, 接收註冊狀態 => {
     *      console.log(註冊狀態)
     * })
     *
     * one(元素, "監聽類型1, 監聽類型2|監聽類型3", 觸發 => {})
     */
    async function one(element, type, listener, add = {}, resolve = null) {
        try {
            typeof element === "string" && (element = Selector(document, element));

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

    /**
     * ! 匹配全域的腳本建議使用 mark 定義鍵值
     * * { 添加監聽器 (可透過 offEvent 移除, element 和 type 不能有完全重複的, 否則會被排除) }
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
        typeof element === "string" && (element = Selector(document, element));
        const key = mark ?? element;
        const record = EventRecord.get(key);

        if (record?.has(type)) return;
        element.addEventListener(type, listener, opts);

        if (!record) EventRecord.set(key, new Map());
        EventRecord.get(key).set(type, listener);
    };

    /**
     * * { 移除監聽器 }
     * @param {element|string} element - 監聽元素, 或查找字串
     * @param {string} type - 監聽類型
     * @param {string} [mark] - 自定義鍵值 (預設使用 this)
     *
     * @example
     * offEvent(元素, "監聽類型")
     */
    async function offEvent(element, type, mark) {
        typeof element === "string" && (element = Selector(document, element));
        const key = mark ?? element;
        const listen = EventRecord.get(key)?.get(type);
        if (listen) {
            element.removeEventListener(type, listen);
            EventRecord.get(key).delete(type);
        }
    };

    /**
     * * { 監聽網址變化 }
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
    async function Log(group = null, label = "print", { dev = true, type = "log", collapsed = true } = {}) {
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
        AddStyle: (rule, id, repeatAdd = true) => AddHead("style", rule, id, repeatAdd),
        AddScript: (rule, id, repeatAdd = true) => AddHead("script", rule, id, repeatAdd),
    };
    async function AddHead(type, rule, id, repeatAdd) {
        let element = document.getElementById(id);
        if (!element) {
            element = document.createElement(type);
            element.id = id;

            // ? 應對新版瀏覽器, 奇怪的 Bug (暫時處理方式)
            const head = Sugar.head;
            if (head) head.appendChild(element);
            else WaitElem("head").then(head => {
                Sugar.head = head;
                head.appendChild(element);
            });
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
    async function Observer(target, onFunc, options = {}, callback = null) {
        const {
            mark = "",
            debounce = 0,
            throttle = 100,
            subtree = true,
            childList = true,
            attributes = true,
            characterData = false,
        } = options ?? {};

        if (mark) {
            if (Mark[mark]) { return } else { Mark[mark] = true }
        };

        const [RateFunc, DelayMs] = debounce > 0 ? [Debounce, debounce] : [Throttle, throttle];
        const op = {
            subtree: subtree,
            childList: childList,
            attributes: attributes,
            characterData: characterData
        }, ob = new MutationObserver(RateFunc(() => { onFunc() }, DelayMs));

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
        queryMap: (selector, all) => {
            const result = selector.map(select => Selector(document, select, all));
            return all
                ? result.every(res => res.length > 0) && result
                : result.every(Boolean) && result;
        },
        queryElement: (selector, all) => {
            const result = Selector(document, selector, all);
            return (all ? result.length > 0 : result) && result;
        }
    };
    async function WaitElem(selector, found = null, options = {}) {
        const Query = Array.isArray(selector) ? WaitCore.queryMap : WaitCore.queryElement; //! 批量查找只能傳 Array
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
                    const [RateFunc, DelayMs] = throttle > 0 ? [Throttle, throttle] : [Debounce, debounce];
                    const observer = new MutationObserver(RateFunc(() => {
                        result = Query(selector, all);

                        if (result) {
                            observer.disconnect();
                            clearTimeout(timer);

                            found && found(result);
                            resolve(result);
                        }
                    }, DelayMs));

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
                document.addEventListener("visibilitychange", () => Core(), { once: true });
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
        Session: (key, { value = null, error = undefined } = {}) => Storage(key, sessionStorage, value, error),
        Local: (key, { value = null, error = undefined } = {}) => Storage(key, localStorage, value, error)
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
    async function OutputJson(Data, Name, Success = null) {
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
    function Runtime(time = null, { lable = "Elapsed Time:", log = true, format = true, style = "\x1b[1m\x1b[36m%s\x1b[0m" } = {}) {
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
    function GetDate(format = null) {
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
    function TranslMatcher(word, lang = navigator.language, defaultLang = "en-US") {
        return word[TranslUtils[lang]]
            ?? word[TranslUtils[defaultLang]]
            ?? word[TranslUtils["en-US"]];
    };

    /* ========== 油猴 API ========== */

    /**
     * * { 菜單註冊 API }
     *
     * @grant GM_registerMenuCommand
     * @grant GM_unregisterMenuCommand
     *
     * @param {object} items - 創建菜單的物件
     * @param {string} [options.name] - 創建菜單的 名稱
     * @param {number} [options.index] - 創建菜單的 名稱 編號 (設置從多少開始)
     * @param {boolean} [options.reset] - 是否重置菜單
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
    const Register = new Set();
    async function Menu(items, options = {}) {
        let {
            name = "Menu",
            index = 1,
            reset = false
        } = options ?? {};

        if (reset) {
            [...Register].map(id => GM_unregisterMenuCommand(id));
            Register.clear();
        };

        for (let [show, item] of Object.entries(items)) {
            let id = `${name}-${index++}`;
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
     ** { 操作存儲空間 (精簡版) }
     *
     * @grant GM_setValue
     * @grant GM_getValue
     * @grant GM_listValues
     * @grant GM_deleteValue
     * @example
     *
     * dV("數據A") // 刪除數據
     * aV() // 列出所有數據
     * sV("存儲鍵", "數據") // 儲存數據
     * gV("存儲鍵", "錯誤回傳") // 取得數據
     * sJV("存儲鍵", "可轉換成 Json 的數據") // 儲存 JSON 數據
     * gJV("存儲鍵", "錯誤回傳") // 取得 JSON 格式數據
     */
    const StoreVerify = (val) => val === void 0 || val === null ? null : val;
    const StoreCall = {
        dV: key => GM_deleteValue(key),
        aV: () => StoreVerify(GM_listValues()),
        sV: (key, value) => GM_setValue(key, value),
        gV: (key, error) => StoreVerify(GM_getValue(key, error)),
        sJV: (key, value, space = 0) => GM_setValue(key, JSON.stringify(value, null, space)),
        gJV: (key, error) => {
            try { return JSON.parse(StoreVerify(GM_getValue(key, error))) }
            catch { return error }
        }
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

    /* ========== [ 其他 ] ========== */

    function _KeepGetterMerge(...sources) {
        const target = {};
        for (const source of sources) {
            if (!source) continue;
            Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
        }
        return target;
    };

    return _KeepGetterMerge(
        DeviceCall, Sugar, // 含有 get() 的語法糖, 不能直接展開合併, 展開時會直接調用變成一般的 value
        {
            ...AddCall, ...StorageCall, ...StoreCall,
            Type, EventRecord, one, onEvent, offEvent, onUrlChange,
            Log, Observer, WaitElem, Throttle, Debounce, OutputJson,
            Runtime, GetDate, TranslMatcher, Menu, StoreListen
        }
    );
})();