// ==UserScript==
// @name         SyntaxLite
// @version      2025.10.01
// @author       Canaan HS
// @description  Library for simplifying code logic and syntax (Lite)
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
        get platform() {
            let value;

            if (navigator.userAgentData?.mobile !== undefined) {
                value = navigator.userAgentData.mobile ? "Mobile" : "Desktop";
            } else if (window.matchMedia?.("(max-width: 767px), (pointer: coarse)")?.matches) {
                value = "Mobile";
            } else if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                value = "Mobile";
            } else {
                value = "Desktop";
            }

            value && Object.defineProperty(this, "platform", { value, writable: false });
            return value;
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
        if (root?.nodeType !== 1 && root?.nodeType !== 9) return all ? [] : undefined;

        const head = select[0];
        const headless = select.slice(1);
        const complicated = /[ .#:[\]>+~*,()^$=]/.test(headless);

        if (complicated) {
            return all ? root.querySelectorAll(select) : root.querySelector(select);
        }

        if (!all && head === '#') { // (#id) 選擇器 nodeType 9 是 document, 元素這樣判斷比 instanceof 更安全更快
            return root.nodeType === 9 ? root.getElementById(headless) : root.querySelector(select);
        }

        if (select[0] === '.') { // (.class) 選擇器
            const collection = root.getElementsByClassName(headless);
            return all ? [...collection] : collection[0];
        }

        // (tag) 選擇器
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
            return value === null ? this?.textContent?.trim() : (this.textContent = value?.trim() ?? "");
        },
        $copy(deep = true) {
            return this.cloneNode(deep);
        },
        $iHtml(value = null) {
            return value === null ? this.innerHTML : (this.innerHTML = value);
        },
        $oHtml(value = null) {
            return value === null ? this.outerHTML : (this.outerHTML = value);
        },
        $iAdjacent(value, position = "beforeend") {
            if (value == null) return;
            value.nodeType === 1 // 元素
                ? this.insertAdjacentElement(position, value)
                : this.insertAdjacentHTML(position, value);
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
        get head() {
            const value = document.head;
            value && Object.defineProperty(this, "head", { value, writable: false });
            return value;
        },
        get body() {
            const value = document.body;
            value && Object.defineProperty(this, "body", { value, writable: false });
            return value;
        },
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
        isEmpty(object) { for (const _ in object) return false; return true },
        createDomFragment: (value) => document.createRange().createContextualFragment(value),
        get createFragment() { return document.createDocumentFragment() },
        title: (value = null) => value === null ? document.title : (document.title = value),
        cookie: (value = null) => value === null ? document.cookie : (document.cookie = value),
        createUrl: (object) => URL.createObjectURL(object),
        _on: (root, events) => {
            const event = {};
            for (const type of Object.keys(events)) {
                let cfg = events[type];
                if (!cfg) continue;

                typeof cfg === "function" && (cfg = { listen: cfg });
                if (cfg.listen) {
                    root.addEventListener(type, cfg.listen, cfg.add);
                    event[type] = () => root.removeEventListener(type, cfg.listen, cfg.add);
                }
            }
            return event;
        },
        /**
         * @description 創建元素
         * ! 並無對所有參數類型做嚴格檢查, 傳錯會直接報錯
         * @param {element|string} arg1 - 添加的根元素 或 創建元素標籤
         * @param {string|object} arg2 - 創建元素標籤 或 元素屬性, arg2 = arg1 == element ? string : object
         * @param {object|undefined} arg3 - 元素屬性 或 不傳參數
         * @param {string} arg4 - 插入位置
         * @param {string} [arg.class] - 元素類別
         * @param {string} [arg.text] - 元素內文
         * @param {number} [arg.rows] - 行數
         * @param {number} [arg.cols] - 列數
         * @param {object} [arg.on] - 監聽事件
         * @param {string|object} [arg.style] - 元素樣式
         * @param {object} [arg.attr] - 元素屬性
         * @param {object} [arg.props] - 其餘屬性
         * @returns {element}
         * @example
         * const parent = document.querySelector("#parent");
         * createElement(parent, "div", { class: "child", text: "Hello World" }, "beforebegin");
         *
         * const container = createElement("div", {
         *    id: "container",
         *    class: "container",
         *    attr: { "container-id": "1" },
         *    on: {
         *        click: { listen: () => console.log("click"), add: { capture: true } },
         *        dblclick: () => console.log("dblclick"),
         *    }
         * });
         *
         * document.body.appendChild(container);
         */
        createElement(arg1, arg2, arg3, arg4) {
            const [root, tag, value = {}, position = "beforeend"] = typeof arg1 === "string"
                ? [undefined, arg1, arg2, arg3] : [arg1, arg2, arg3, arg4];

            if (!tag) return;
            const {
                class: className, text: textContent = "", rows: rowSpan, cols: colSpan,
                on = {}, style = {}, attr = {}, ...props
            } = value;

            const element = document.createElement(tag);
            element.textContent = textContent;

            if (className) element.className = className;
            if (rowSpan !== undefined) element.rowSpan = rowSpan;
            if (colSpan !== undefined) element.colSpan = colSpan;

            // 批量賦值常見屬性
            Object.assign(element, props);
            // 設置樣式，支持字串或物件
            typeof style === "string"
                ? element.style.cssText = style
                : Object.assign(element.style, style);
            // 設置屬性
            for (const key in attr) element.setAttribute(key, attr[key]);

            // 設置監聽器
            const event = typeof on === "object" && !this.isEmpty(on)
                ? this._on(element, on) : {};

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

            return root?.nodeType === 1
                ? root.insertAdjacentElement(position, element) : element;
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

            resolve?.(true);
        } catch { resolve?.(false) }
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
     * @description 列印日誌訊息到控制台
     * @param {...any} args - 要列印的一或多個訊息
     *
     * @example
     * {
     *      dev: true,
     *      group: "標籤名",
     *      collapsed: true,
     * }
     *
     * log('訊息').log;
     * log('訊息1', '訊息2', '訊息3').log;
     * log({ id: 1, name: 'Alice' }).log; // 這種的如果當選項輸入, 會被當成一個訊息
     * log({ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }, { group: 'User Data' }).log;
     * log('訊息', { dev: false, group: 'API' }).warn;
     * log({ group: 'API' }, '訊息', '訊息2', '訊息3').error;
     * log({ group: 'User Data' }, "用戶資料：", { id: 1, name: 'Alice' }).table;
     */
    const print = {
        log: (...args) => console.log(...args),
        warn: (...args) => console.warn(...args),
        table: (...args) => console.table(...args),
        trace: (...args) => console.trace(...args),
        debug: (...args) => console.debug(...args),
        error: (...args) => console.error(...args),
        count: (label) => console.count(label),
    };
    function log(...args) {
        if (args.length === 0) return;

        let options = {};
        let messages = args;

        const defaultOptions = { dev: true, group: null, collapsed: true };

        if (args.length > 1) {
            const firstArg = args[0];
            const lastArg = args.at(-1);

            const firstIsObject = firstArg?.constructor === Object;
            const lastIsObject = lastArg?.constructor === Object;

            const giveFirst = () => {
                options = firstArg;
                messages = args.slice(1);
            };

            const giveLast = () => {
                options = lastArg;
                messages = args.slice(0, -1);
            };

            // ! 前兩種狀況就不判斷, 是否含有 defaultOptions 的屬性了, 直接當他就是選項
            if (lastIsObject && !firstIsObject) {
                giveLast();
            } else if (firstIsObject && !lastIsObject) {
                giveFirst();
            } else if (firstIsObject && lastIsObject) {
                const defaultKey = new Set(Object.keys(defaultOptions));
                const Fsimilarity = Object.keys(firstArg).filter(k => defaultKey.has(k)).length;
                const Lsimilarity = Object.keys(lastArg).filter(k => defaultKey.has(k)).length;

                if (Lsimilarity > Fsimilarity) {
                    giveLast();
                } else {
                    giveFirst();
                }
            }
        }

        const { dev, group, collapsed } = { ...defaultOptions, ...options };

        if (!dev || messages.length === 0) {
            return new Proxy({}, { get() { } });
        }

        const execute = (method) => {
            if (method === "count") {
                print.count(messages[0]);
                return;
            }

            const call = print[method] || print.log;
            if (group) {
                collapsed ? console.groupCollapsed(group) : console.group(group);
                call(...messages);
                console.groupEnd();
            } else {
                call(...messages);
            }
        };

        const run = setTimeout(() => execute('log', messages));
        return new Proxy(
            {},
            {
                get(_, method) {
                    clearTimeout(run);
                    execute(method, messages);
                }
            }
        )
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

            const head = sugar.head;
            if (head) head.appendChild(element);
            else waitEl("head").then(head => {
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
     * 使用字串作為 mark，當出現新的元素，會自動清除舊的觀察器，再創建新的觀察器
     *
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
    const observerRecord = new Map();
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
            const record = observerRecord.get(mark);

            if (record) {
                if (record.target === target) return;
                record.ob.disconnect();
                observerRecord.delete(mark);
            }
        };

        const [rateFunc, delayMs] = debounce > 0
            ? [$debounce, debounce]
            : [$throttle, throttle];

        const op = { subtree, childList, attributes, characterData }
        const ob = new MutationObserver(rateFunc(() => { onFunc() }, delayMs));

        ob.observe(target, op);
        mark && observerRecord.set(mark, { target, ob });

        callback?.({ ob, op });
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

                            found?.(result);
                            resolve(result);
                        } else {
                            AnimationFrame = requestAnimationFrame(queryRun);
                        }
                    };

                    AnimationFrame = requestAnimationFrame(queryRun);

                    timer = setTimeout(() => {
                        cancelAnimationFrame(AnimationFrame);

                        if (timeoutResult) {
                            found?.(result);
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

                            found?.(result);
                            resolve(result);
                        }
                    }, delayMs));

                    observer.observe(root, { subtree, childList, attributes, characterData });

                    timer = setTimeout(() => {
                        observer.disconnect();
                        if (timeoutResult) {
                            found?.(result);
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
     * @example
     * 基本支援類型 (String, Number, Array, Object, Boolean, Date, Map, Set)
     * 支援日期格式 (YYYY-MM-DD HH:MM:SS, Yy M Dd h m s)
     *
     * setLocal("數據", 123);
     * setSession("憑證", "token", "7d");
     *
     * getLocal("數據", 456, true);
     * getSession("憑證", "過期");
     */
    const storageParse = {
        Set: value => new Set(value),
        Map: value => new Map(value),
        Date: value => new Date(value),
    };
    const storageSerialize = {
        Set: value => value instanceof Set ? [...value] : value,
        Map: value => value instanceof Map ? [...value] : value,
        Date: value => value instanceof Date ? value.toISOString() : value,
    };
    function parseExpire(expireStr) {
        // 傳入空值或只包含空白的字串，返回 0
        if (!expireStr || !expireStr.trim()) {
            return 0;
        }

        // 檢查是否為絕對時間格式 "YYYY-MM-DD HH:MM:SS"
        const absoluteDatePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
        if (absoluteDatePattern.test(expireStr)) {
            const dateObj = new Date(expireStr);
            const time = dateObj.getTime();
            if (!isNaN(time)) {
                return Math.floor(time / 1000);
            }
        }

        // 解析特定格式字串, 計算到期時間
        const now = new Date();
        const pattern = /(\d+)\s*([YyMDdhms])/g;
        const matches = [...expireStr.matchAll(pattern)];
        if (matches.length === 0) return 0;

        const durations = { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

        for (const match of matches) {
            const value = parseInt(match[1], 10);
            const unit = match[2];

            switch (unit.toLowerCase()) {
                case 'y': durations.years += value; break;
                case 'd': durations.days += value; break;
                case 'h': durations.hours += value; break;
                case 's': durations.seconds += value; break;
                default:
                    if (unit === 'M') durations.months += value;
                    else if (unit === 'm') durations.minutes += value;
            }
        }

        now.setFullYear(now.getFullYear() + durations.years);
        now.setMonth(now.getMonth() + durations.months);
        now.setDate(now.getDate() + durations.days);
        now.setHours(now.getHours() + durations.hours);
        now.setMinutes(now.getMinutes() + durations.minutes);
        now.setSeconds(now.getSeconds() + durations.seconds);

        return Math.floor(now.getTime() / 1000);
    };
    // setter = localStorage.setItem, sessionStorage.setItem, GM_setValue
    function setStorage(setter, key, value, { space = 0, expireStr } = {}) {
        const type = $type(value);
        const pack = { type, value: storageSerialize[type]?.(value) ?? value };
        const expireTime = parseExpire(expireStr);

        expireTime && (pack.expire = expireTime);
        setter(key, JSON.stringify(pack, null, space));
    };
    // getter = localStorage.getItem, sessionStorage.getItem, GM_getValue
    // removeer = localStorage.removeItem, sessionStorage.removeItem, GM_deleteValue
    function getStorage(getter, key, error, { autoRemove = false, removeer } = {}) {
        let item = getter(key);
        if (item == null) return error;

        try {
            item = JSON.parse(item);

            const isObject = item instanceof Object;
            if (isObject && item.expire && Date.now() > (item.expire * 1000)) {
                removeer(key);
                return error;
            };

            // 速度優先不用 三元式 + 解構
            let type, value;
            if (isObject) { // 使用該函數存取的數據
                type = item.type ?? "Object";
                value = item.value ?? item;
            } else { // 一般數據
                type = $type(item);
                value = item;
            };

            const unPack = storageParse[type]?.(value) ?? value;
            autoRemove && removeer(key);

            return unPack;
        }
        catch {
            if (typeof item === "object" && sugar.isEmpty(item)) return error;
            if (typeof item === "string" && item.startsWith("[object")) return error;
            return item;
        }
    };
    const delLocal = localStorage.removeItem.bind(localStorage);
    const setLocal = localStorage.setItem.bind(localStorage);
    const getLocal = localStorage.getItem.bind(localStorage);
    const delSession = sessionStorage.removeItem.bind(sessionStorage);
    const setSession = sessionStorage.setItem.bind(sessionStorage);
    const getSession = sessionStorage.getItem.bind(sessionStorage);
    const storageCall = {
        delLocal: (key) => delLocal(key),
        setLocal: (key, value, expireStr) => setStorage(setLocal, key, value, { expireStr }),
        getLocal: (key, error, autoRemove) => getStorage(getLocal, key, error, { autoRemove, removeer: delLocal }),
        delSession: (key) => delSession(key),
        setSession: (key, value, expireStr) => setStorage(setSession, key, value, { expireStr }),
        getSession: (key, error, autoRemove) => getStorage(getSession, key, error, { autoRemove, removeer: delSession })
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
    function createWorker(code) {
        const blob = new Blob([code], { type: "application/javascript" });
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url);

        const terminate = worker.terminate;
        worker.terminate = function () {
            terminate.call(worker);
            URL.revokeObjectURL(url);
        };

        return worker;
    };

    /**
     * @description 輸出 Json 檔案
     * @param {*} data      - 可轉成 Json 格式的數據
     * @param {string} name - 輸出的檔名 (不用打副檔名)
     * @param {function} success   - 選擇是否回傳輸出狀態
     *
     * @example
     * outputJson(JsonData, "MyJson", success=> {
     *      console.log(success);
     * })
     */
    async function outputJson(data, name, success = null) {
        try {
            data = typeof data === "string" ? data : JSON.stringify(data, null, 4);
            name = typeof name === "string"
                ? name.endsWith(".json") ? name : `${name}.json`
                : `Untitled-${crypto.randomUUID().slice(9, 23)}.json`;

            const Json = new Blob([data], { type: "application/json" });
            const Link = document.createElement("a");
            Link.href = URL.createObjectURL(Json);
            Link.download = name;
            Link.click();

            URL.revokeObjectURL(Link.href);
            Link.remove();

            success?.({ State: true });
        } catch (error) { success?.({ State: false, Info: error }) }
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
     * }, { name: "ID" });
     */
    const registerMenu = new Set();
    function regMenu(items, options = {}) {
        let {
            name = "regMenu",
            index = 1,
            reset = false
        } = options || {};

        if (reset) {
            [...registerMenu].map(id => GM_unregisterMenuCommand(id));
            registerMenu.clear();
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

            registerMenu.add(id);
        }
    };

    /**
     * @description 移除菜單
     * @grant GM_unregisterMenuCommand
     * @example
     *
     * unMenu(); // 全部移除
     * unMenu("ID"); // 單一移除
     * unMenu(["ID1", "ID2"]); // 批量移除
     */
    async function unMenu(id) {
        if (id == null) {
            [...registerMenu].map(id => GM_unregisterMenuCommand(id));
            registerMenu.clear();
        } else if (Array.isArray(id)) {
            id.forEach(item => {
                if (registerMenu.delete(item)) {
                    GM_unregisterMenuCommand(item);
                }
            })
        } else if (registerMenu.delete(id)) {
            GM_unregisterMenuCommand(id);
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
    const GM_storageVerify = val => val == null ? null : val;
    const GM_storageCall = {
        delV: key => GM_deleteValue(key),
        allV: () => GM_storageVerify(GM_listValues()),
        setV: (key, value) => GM_setValue(key, value),
        getV: (key, error) => GM_storageVerify(GM_getValue(key, error)),
        setJV: (key, value, space = 0, expireStr) => setStorage(GM_setValue, key, value, { space, expireStr }),
        getJV: (key, error, autoRemove) => getStorage(GM_getValue, key, error, { autoRemove, removeer: GM_deleteValue }),
    };

    /**
     * @description 監聽保存值的變化
     * @grant GM_addValueChangeListener
     * @grant GM_removeValueChangeListener
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
     * const listenHandle = storageListen(["key1", "key2"], call=> {
     *      console.log(call.key, call.nv);
     * })
     *
     * listenHandle.off("key1");
     * listenHandle.offAll();
     */
    const listenRecord = new Map();
    function storageListen(object, callback) {
        object.forEach(label => {
            if (!listenRecord.has(label)) {
                const id = GM_addValueChangeListener(label, function (key, oldValue, newValue, remote) {
                    callback({ key, ov: oldValue, nv: newValue, far: remote });
                });
                listenRecord.set(label, id);
            }
        });

        return {
            off(label) {
                const id = listenRecord.get(label);
                if (id) {
                    GM_removeValueChangeListener(id);
                    listenRecord.delete(label);
                }
            },
            offAll() {
                for (const id of listenRecord.values()) {
                    GM_removeValueChangeListener(id);
                }
                listenRecord.clear();
            }
        }
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
            ...addCall, ...storageCall, ...GM_storageCall,
            eventRecord, addRecord, observerRecord,
            $type, onE, onEvent, offEvent, onUrlChange, log,
            $observer, waitEl, $throttle, $debounce, createWorker, outputJson,
            runTime, getDate, translMatcher, regMenu, unMenu, storageListen,

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
        });
})();