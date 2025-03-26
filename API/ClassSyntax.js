// ==UserScript==
// @name         ClassSyntax
// @version      2025/03/27
// @author       Canaan HS
// @description  Library for simplifying code logic and syntax (Class Type)
// @namespace    https://greasyfork.org/users/989635
// @match        *://*/*
// @license      MPL-2.0
// ==/UserScript==

/**
 * * { Class 版 語法簡化 API }
 *
 * 主要個人使用, 避免額外性能開銷, 許多函數並無參數驗證
 *
 * @example
 * 1.
 *  class main extends Syntax {
 *       this.func();
 *  }
 *
 * 2.
 *  const def = new Syntax();
 *  def.func();
 */

class Syntax {
    constructor() {
        this.Mark = {};
        this.Parser = new DOMParser();
        this.ListenerRecord = new Map();
        this.Type = (object) => Object.prototype.toString.call(object).slice(8, -1);
        this.Print = {
            log: label => console.log(label),
            warn: label => console.warn(label),
            trace: label => console.trace(label),
            error: label => console.error(label),
            count: label => console.count(label),
        };
        this.WaitCore = {
            queryMap: (selector) => {
                const result = selector.map(select => document.querySelector(select));
                return result.every(Boolean) && result;
            },
            queryElement: (selector, all) => {
                const result = all ? document.querySelectorAll(selector) : document.querySelector(selector);
                return (all ? result.length > 0 : result) && result;
            }
        };
        this.TemplateMatch = {
            Process: (template, key, value = null) => {
                const temp = template[key.toLowerCase()];
                return this.Type(temp) === "Function"
                    ? temp(value)
                    : (temp !== undefined ? temp : "None");
            }
        };
        this.StoreMatch = {
            verify: val => val !== void 0 ? val : false,
            d: key => GM_deleteValue(key),
            a: () => this.StoreMatch.verify(GM_listValues()),
            s: (key, value) => GM_setValue(key, value),
            g: (key, value) => this.StoreMatch.verify(GM_getValue(key, value)),
            sj: (key, value) => GM_setValue(key, JSON.stringify(value, null, 4)),
            gj: (key, value) => JSON.parse(this.StoreMatch.verify(GM_getValue(key, value)))
        };
        this.StorageMatch = {
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
        this.Device = {
            sX: () => window.scrollX,
            sY: () => window.scrollY,
            iW: () => window.innerWidth,
            iH: () => window.innerHeight,
            _Type: undefined,
            Url: location.href,
            Orig: location.origin,
            Host: location.hostname,
            Path: location.pathname,
            Lang: navigator.language,
            Agen: navigator.userAgent,
            Type: function () {
                return this._Type = this._Type ? this._Type
                    : (this._Type = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(this.Agen) || this.iW < 768
                        ? "Mobile" : "Desktop");
            }
        };
    }

    /* ========== 通用常用函數 ========== */

    /**
     * * { 簡化語法, 並以更高性能 查找 }
     * @param {string} selector - 查找元素
     * @param {Object} [options] - 選項
     * @param {boolean} [options.all=false] - 是否查找全部
     * @param {Element} [options.root=document] - 查找來源
     * @returns {Element|Element[]|null} - DOM元素
     */
    $$(selector, {all = false, root = document} = {}) {

        if (!all && selector[0] === '#' && selector.indexOf(' ') === -1) { // ID選擇器 (#id)
            return document.getElementById(selector.slice(1));
        }

        if (selector[0] === '.' && selector.indexOf(' ') === -1) { // 類選擇器 (.class)
            const collection = root.getElementsByClassName(selector.slice(1));
            return all ? [...collection] : collection[0];
        }

        if (!/[ #.\[:]/.test(selector)) { // 標籤選擇器 (tag)
            const collection = root.getElementsByTagName(selector);
            return all ? [...collection] : collection[0];
        }

        return all ? root.querySelectorAll(selector) : root.querySelector(selector); // 複雜選擇器
    }

    /**
     * * { 暫停異步函數 }
     * @param {Integer} delay - 延遲毫秒
     * @returns { Promise }
     */
    Sleep(delay) {
        return new Promise(resolve => setTimeout(resolve, delay));
    }

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
    async Log(group = null, label = "print", {dev = true, type = "log", collapsed = true} = {}) {
        if (!dev) return;

        const Call = this.Print[type] || this.Print.log;

        if (group == null) Call(label);
        else {
            collapsed ? console.groupCollapsed(group) : console.group(group);
            Call(label);
            console.groupEnd();
        }
    }

    /**
     * * { 添加樣式表到 head }
     * @param {string} Rule - 樣式表
     * @param {string} ID   - 創建 ID
     * @param {boolean} RepeatAdd - 有重複 ID 的對象時, 禁用他將無法在同一個 ID 的樣式內增加
     */
    async AddStyle(Rule, ID = "New-Style", RepeatAdd = true) {
        let style = document.getElementById(ID);
        if (!style) {
            style = document.createElement("style");
            style.id = ID;
            document.head.appendChild(style);
        } else if (!RepeatAdd) return;
        style.textContent += Rule;
    }

    /**
     * * { 添加腳本到 head }
     * @param {string} Rule - Js 腳本
     * @param {string} ID   - 創建 ID
     * @param {boolean} RepeatAdd - 有重複 ID 的對象時, 禁用他將無法在同一個 ID 的樣式內增加
     */
    async AddScript(Rule, ID = "New-Script", RepeatAdd = true) {
        let script = document.getElementById(ID);
        if (!script) {
            script = document.createElement("script");
            script.id = ID;
            document.head.appendChild(script);
        } else if (!RepeatAdd) return;
        script.textContent += Rule;
    }

    /**
     * * { 簡化版監聽器 (不可刪除, 不檢測是否重複添加, 但可回傳註冊狀態) }
     * @param {string} element - 添加元素
     * @param {string} type    - 監聽器類型
     * @param {*} listener     - 監聽後操作
     * @param {object} add     - 附加功能
     * @returns {boolean}      - 回傳添加狀態
     *
     * @example
     * Listen("監聽元素", "監聽類型", 觸發 => {
     *      觸發... 其他操作
     * }, {once: true, capture: true, passive: true}, 接收註冊狀態 => {
     *      console.log(註冊狀態)
     * })
     */
    async Listen(
        element,
        type,
        listener,
        add = {},
        resolve = null
    ) {
        try {
            element.addEventListener(type, listener, add);
            resolve && resolve(true);
        } catch { resolve && resolve(false) }
    }

    /**
     * * { 添加監聽器 (可刪除, element 和 type 不能有完全重複的, 將會被排除) }
     * @param {string} element - 添加元素
     * @param {string} type    - 監聽器類型
     * @param {*} listener     - 監聽後操作
     * @param {object} add     - 附加功能
     *
     * @example
     * 可附加的 add 選項
     * {
     *   once: true,
     *   passive: true,
     *   capture: true,
     *   mark: "自訂檢測 key" (預設是由 element 作為 key)
     * }
     */
    async AddListener(
        element,
        type,
        listener,
        add = {}
    ) {
        const { mark, ...options } = add;
        const key = mark ?? element;

        const Record = this.ListenerRecord.get(key);
        if (Record?.has(type)) return;

        element.addEventListener(type, listener, options);
        if (!Record) this.ListenerRecord.set(key, new Map());
        this.ListenerRecord.get(key).set(type, listener);
    }

    /**
     * * { 刪除 監聽器 }
     * @param {string} element - 添加元素
     * @param {string} type    - 監聽器類型
     *
     * @example
     * RemovListener("監聽的物件" or "自訂 key", "監聽的類型")
     */
    async RemovListener(element, type) {
        const Listen = this.ListenerRecord.get(element)?.get(type);
        if (Listen) {
            element.removeEventListener(type, Listen);
            this.ListenerRecord.get(element).delete(type);
        }
    }

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
    async Observer(target, onFunc, options = {}, callback = null) {
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
        }, ob = new MutationObserver(this.Debounce(() => { onFunc() }, debounce));
        ob.observe(target, op);

        callback && callback({ ob, op });
    }

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
    async WaitElem(selector, found = null, options = {}) {
        const self = this;
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
                    const observer = new MutationObserver(self.Debounce(() => {
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
                document.addEventListener("visibilitychange", () => Core(), { once: true });
            } else Core();
        });
    }

    /**
     ** { 瀏覽器 Storage 操作 }
     * @param {string} key - 存儲的 key 值
     * @param {sessionStorage | localStorage} {type} - 存儲的類型 (預設 sessionStorage)
     * @param {*} {value}  - 存儲的 value 值
     * @param {*} {error}  - 當不存在此值是要回傳的
     * @returns {*}        - 回傳保存的值
     *
     * @example
     * 支援的類型 (String, Number, Array, Object, Boolean, Date, Map)
     *
     * Storage("數據", {value: 123, error: false})
     * Storage("數據")
     *
     * Storage("數據", {value: 123, type: localStorage})
     * Storage("數據", {type: localStorage})
     */
    Storage(key, { type = sessionStorage, value = null, error = undefined } = {}) {
        let data;
        return value != null
            ? this.StorageMatch[this.Type(value)](type, key, value)
            : (data = type.getItem(key), data != undefined ? this.StorageMatch[this.Type(JSON.parse(data))](type, data) : error);
    }

    /* ========== 請求數據處理 ========== */

    /**
     * * { 解析請求後的頁面, 成可查詢的 html 文檔 }
     * @param {htnl} html - 要解析成 html 的文檔
     * @returns {htnl}    - html 文檔
     */
    DomParse(html) {
        return this.Parser.parseFromString(html, "text/html");
    }

    /**
     * * { 排除不能用做檔名的字串 }
     * @param {string} name - 要修正的字串
     * @returns {string}    - 排除後的字串
     */
    NameFilter(name) {
        return name.replace(/[\/\?<>\\:\*\|":]/g, "");
    }

    /**
     ** { 取得下載圖片時的填充量 }
     * @param {number} pages - 下載物件的長度
     * @returns {number}     - 返回填充的值
     *
     * @example
     * const box = [下載圖片的連結]
     * const Fill = GetFill(box);
     */
    GetFill(pages) {
        return Math.max(2, `${pages}`.length);
    }

    /**
     * * { 解析網址字串的副檔名 }
     * @param {string} link - 含有副檔名的連結
     * @returns {string}    - 回傳副檔名字串
     */
    ExtensionName(link) {
        try {
            return link.match(/\.([^.]+)$/)[1].toLowerCase() || "png";
        } catch {
            return "png";
        }
    }

    /**
     ** { 回傳下載圖片的尾數 }
     * @param {number} index   - 圖片的頁數
     * @param {number} padding - 填充量 [由 GetFill() 取得填充量]
     * @param {string} filler  - 用於填充的字串
     * @param {string} type    - 圖片的副檔名, 輸入圖片的連結
     * @returns {string}       - 經填充後的尾數
     */
    Mantissa(index, padding, filler = "0", type = null) {
        return type
            ? `${++index}`.padStart(padding, filler) + `.${this.ExtensionName(type)}`
            : `${++index}`.padStart(padding, filler);
    }

    /**
     * 解析範圍進行設置 (索引從 1 開始)
     *
     * @param {string} scope  - 設置的索引範圍 [1, 2, 3-5, 6~10, -4, !8]
     * @param {array} object  - 需要設置範圍的物件
     * @returns {object}      - 回傳設置完成的物件
     *
     * @example
     * object = ScopeParsing("", object);
     */
    ScopeParsing(scope, object) {
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
    }

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
    FormatTemplate(template, format) {

        if (this.Type(template) !== "Object") {
            return "Template must be an object";
        }

        // 將 template 的 keys 轉換成小寫
        template = Object.fromEntries(
            Object.entries(template).map(([key, value]) => [key.toLowerCase(), value])
        );

        if (this.Type(format) === "String") {
            return format.replace(/\{\s*([^}\s]+)\s*\}/g, (_, key) => this.TemplateMatch.Process(template, key));

        } else if (this.Type(format) === "Object") {
            return Object.entries(format).map(([key, value]) => this.TemplateMatch.Process(template, key, value));

        } else {
            return { "Unsupported format": format };

        }
    }

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
    async OutputTXT(Data, Name, Success = null) {
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
    }

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
    async OutputJson(Data, Name, Success = null) {
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
    }

    /* ========== 特別用途函數 ========== */

    /**
     * * { 創建 Worker 工作文件 }
     * @param {string} code - 運行代碼
     * @returns {Worker}    - 創建的 Worker 連結
     */
    WorkerCreation(code) {
        let blob = new Blob([code], { type: "application/javascript" });
        return new Worker(URL.createObjectURL(blob));
    }

    /**
     * * { 獲取運行經過時間 }
     * @param {performance.now() | null} time - 傳入 performance.now() 或 空值
     * @param {boolean} {log} - 是否直接打印
     * @param {boolean} {format} - 使用格式轉換為秒數
     * @param {string} {lable} - 打印的說明文字
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
    Runtime(time = null, {
        log = true,
        format = true,
        label = "Elapsed Time:",
        style = "\x1b[1m\x1b[36m%s\x1b[0m"
    } = {}) {
        if (!time) return performance.now();

        const result = format
            ? `${((performance.now() - time) / 1e3).toPrecision(3)}s`
            : performance.now() - time;

        return log ? console.log(style, `${label} ${result}`) : result;
    }

    /**
     * * { 獲取當前時間格式 }
     * @param {string} format - 選擇輸出的格式 : {year}{month}{date}{hour}{minute}{second}
     * @returns {string} - 設置的時間格式, 或是預設值
     *
     * @example
     * GetDate("{year}/{month}/{date} {hour}:{minute}")
     */
    GetDate(format = null) {
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
    }

    /**
     ** { 節流函數, 立即觸發, 後續按照指定的速率運行, 期間多餘的觸發將會被忽略 }
     * @param {function} func - 要觸發的函數
     * @param {number} delay - 延遲的時間ms
     * @returns {function}
     *
     * @example
     * 與上方相同只是改成 Throttle()
     */
    Throttle(func, delay) {
        let lastTime = 0;
        return (...args) => {
            const now = Date.now();
            if ((now - lastTime) >= delay) {
                lastTime = now;
                func(...args);
            }
        }
    }

    /**
     ** { 防抖函數 Debounce, 只會在停止呼叫後觸發, 持續呼叫就會一直重置 }
     * @param {function} func - 要觸發的函數
     * @param {number} delay - 延遲的時間ms
     * @returns {function}
     *
     * @example
     * a = Debounce(()=> {}, 100);
     * a();
     *
     * function b(n) {
     *      Debounce(b(n), 100);
     * }
     *
     * document.addEventListener("pointermove", Debounce(()=> {
     *
     * }), 100)
     */
    Debounce(func, delay = 500) {
        let timer = null;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(function () {
                func(...args);
            }, delay);
        }
    }

    /* ========== 油猴的 API ========== */

    /**
     ** { 菜單註冊 API }
     *
     * @grant GM_registerMenuCommand
     *
     * @param {object} Item  - 創建菜單的物件
     * @param {string} ID    - 創建菜單的 ID
     * @param {number} Index - 創建菜單的 ID 的 編號 (設置從多少開始)
     * @example
     * Menu({
     * "菜單1": {
     *     desc: "菜單描述",
     *     func: ()=> { 方法1() },
     *     hotkey: "a",
     *     close: true,
     * },
     * "菜單2": ()=> { 方法2(參數) }
     *}, "ID");
     */
    async Menu(Item, ID = "Menu", Index = 1) {
        for (const [Name, options] of Object.entries(Item)) {
            GM_registerMenuCommand(Name, () => { options.func() }, {
                title: options.desc,
                id: `${ID}-${Index++}`,
                autoClose: options.close,
                accessKey: options.hotkey,
            });
        }
    }

    /**
     ** { 操作存储空間 (精簡版) }
     *
     * @grant GM_setValue
     * @grant GM_getValue
     * @grant GM_listValues
     * @grant GM_deleteValue
     *
     * @param {string} operate - 操作類型 ("s", "g", "sj", "gj", "d", "a")
     * @param {string} key     - 操作數據索引 Key
     * @param {*} value        - 要保存的值, 如果是取得操作, 就是空值時的回傳
     * @returns {data}         - 獲取的數據值
     *
     * @example
     * 數據A = store("g", "資料A", null)
     * store("sj", "資料B", "數據B")
     */
    Store(operat, key = null, value = null) {
        return this.StoreMatch[operat](key, value);
    }

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
    async StoreListen(object, callback) {
        object.forEach(label => {
            if (!this.Mark[label]) {
                this.Mark[label] = true;
                GM_addValueChangeListener(label, function (key, old_value, new_value, remote) {
                    callback({ key, ov: old_value, nv: new_value, far: remote });
                })
            }
        })
    }
}