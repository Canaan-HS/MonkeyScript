import { Lib } from "../services/client";
import { Parame, Load } from "./config";

import getLanguage from "./language.js";

const MenuFactory = (() => {
    // 動態調整圖片樣式
    let imgRule, menuRule;
    const importantStyle = (element, property, value) => {
        requestAnimationFrame(() => {
            element.style.setProperty(property, value, "important");
        })
    };
    const normalStyle = (element, property, value) => {
        requestAnimationFrame(() => {
            element.style[property] = value;
        })
    };
    const stylePointer = {
        Top: value => normalStyle(menuRule[1], "top", value),
        Left: value => normalStyle(menuRule[1], "left", value),
        Width: value => importantStyle(imgRule[1], "width", value),
        Height: value => importantStyle(imgRule[1], "height", value),
        MaxWidth: value => importantStyle(imgRule[1], "max-width", value),
        Spacing: value => importantStyle(imgRule[1], "margin", `${value} auto`)
    };

    async function postViewInit() {
        if (Parame.Registered.has("PostViewInit")) return;

        // 讀取圖像設置
        const set = Load.imgSet();
        Lib.addStyle(`
            .post__files > div,
            .scrape__files > div {
                position: relative;
            }
            .Image-style, figure img {
                display: block;
                will-change: transform;
                width: ${set.Width} !important;
                height: ${set.Height} !important;
                margin: ${set.Spacing} auto !important;
                max-width: ${set.MaxWidth} !important;
            }
            .Image-loading-indicator {
                min-width: 50vW;
                min-height: 50vh;
                object-fit: contain;
                border: 2px solid #fafafa;
            }
            .Image-loading-indicator-experiment {
                border: 3px solid #00ff7e;
            }
            .Image-loading-indicator[alt] {
                border: 2px solid #e43a3aff;
            }
            .Image-loading-indicator:hover {
                cursor: pointer;
            }
            .progress-indicator {
                top: 5px;
                left: 5px;
                colo: #fff;
                font-size: 14px;
                padding: 3px 6px;
                position: absolute;
                border-radius: 3px;
                background-color: rgba(0, 0, 0, 0.3);
            }
        `, "Image-Custom-Style", false);
        imgRule = Lib.$q("#Image-Custom-Style")?.sheet.cssRules;

        // 全局修改功能
        Lib.storageListen(Object.values(Parame.SaveKey), call => {
            if (call.far) {
                if (typeof call.nv === "string") {
                    menuInit();
                } else {
                    for (const [key, value] of Object.entries(call.nv)) {
                        stylePointer[key](value);
                    }
                }
            }
        })

        Parame.Registered.add("PostViewInit");
    };

    async function draggable(element) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        const nonDraggableTags = new Set(["SELECT", "BUTTON", "INPUT", "TEXTAREA", "A"]);

        // 將處理函式定義在外面，這樣 onEvent 和 offEvent 才能引用到同一個函式
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            element.style.left = `${initialLeft + dx}px`;
            element.style.top = `${initialTop + dy}px`;
        };

        const handleMouseUp = () => {
            if (!isDragging) return; // 增加一個判斷避免重複觸發
            isDragging = false;
            element.style.cursor = 'auto';
            document.body.style.removeProperty('user-select');

            Lib.offEvent(document, "mousemove");
            Lib.offEvent(document, "mouseup");
        };

        const handleMouseDown = (e) => {
            if (nonDraggableTags.has(e.target.tagName)) return;
            e.preventDefault();

            isDragging = true;

            startX = e.clientX;
            startY = e.clientY;
            const style = window.getComputedStyle(element);
            initialLeft = parseFloat(style.left) || 0;
            initialTop = parseFloat(style.top) || 0;

            element.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';

            Lib.onEvent(document, "mousemove", handleMouseMove);
            Lib.onEvent(document, "mouseup", handleMouseUp);
        };

        Lib.onEvent(element, "mousedown", handleMouseDown);
    };

    async function menuInit(callback = null) {
        const { Log, Transl } = getLanguage(); // 菜單觸發器, 每次創建都會獲取新數據

        callback?.({ Log, Transl }); // 使用 callback 會額外回傳數據
        Lib.regMenu({ [Transl("📝 設置選單")]: () => createMenu(Log, Transl) });
    };

    // 調整數值腳本
    const menuScript = `
        <script id="menu-script">
            function check(value) {
                return value.toString().length > 4 || value > 1000
                    ? 1000 : value < 0 ? "" : value;
            }
        </script>
    `;

    // 圖片調整選項
    const getImgOptions = (title, key) => `
        <div>
            <h2 class="narrative">${title}：</h2>
            <p>
                <input type="number" data-key="${key}" class="Image-input-settings" oninput="value = check(value)">
                <select data-key="${key}" class="Image-input-settings" style="margin-left: 1rem;">
                    <option value="px" selected>px</option>
                    <option value="%">%</option>
                    <option value="rem">rem</option>
                    <option value="vh">vh</option>
                    <option value="vw">vw</option>
                    <option value="auto">auto</option>
                </select>
            </p>
        </div>
    `;

    function createMenu(Log, Transl) {
        const shadowID = "shadow";
        if (Lib.$q(`#${shadowID}`)) return;

        // 取得圖片設置
        const imgSet = Load.imgSet();
        const imgSetData = [
            ["圖片高度", "Height", imgSet.Height],
            ["圖片寬度", "Width", imgSet.Width],
            ["圖片最大寬度", "MaxWidth", imgSet.MaxWidth],
            ["圖片間隔高度", "Spacing", imgSet.Spacing]
        ];

        let analyze, img_set, img_input, img_select, set_value, save_cache = {};

        // 創建陰影環境
        const shadow = Lib.createElement(Lib.body, "div", { id: shadowID });
        const shadowRoot = shadow.attachShadow({ mode: "open" });

        const menuSet = Load.menuSet(); // 取得菜單設置
        // 菜單樣式
        const menuStyle = `
            <style id="menu-style">
                .modal-background {
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    z-index: 9999;
                    overflow: auto;
                    position: fixed;
                    pointer-events: none;
                }
                /* 模態介面 */
                .modal-interface {
                    top: ${menuSet.Top};
                    left: ${menuSet.Left};
                    margin: 0;
                    display: flex;
                    overflow: auto;
                    position: fixed;
                    border-radius: 5px;
                    pointer-events: auto;
                    background-color: #2C2E3E;
                    border: 3px solid #EE2B47;
                }
                /* 設定介面 */
                #image-settings-show {
                    width: 0;
                    height: 0;
                    opacity: 0;
                    padding: 10px;
                    overflow: hidden;
                    transition: opacity 0.8s, height 0.8s, width 0.8s;
                }
                /* 模態內容盒 */
                .modal-box {
                    padding: 0.5rem;
                    height: 50vh;
                    width: 32vw;
                }
                /* 菜單框架 */
                .menu {
                    width: 5.5vw;
                    overflow: auto;
                    text-align: center;
                    vertical-align: top;
                    border-radius: 2px;
                    border: 2px solid #F6F6F6;
                }
                /* 菜單文字標題 */
                .menu-text {
                    color: #EE2B47;
                    cursor: default;
                    padding: 0.2rem;
                    margin: 0.3rem;
                    margin-bottom: 1.5rem;
                    white-space: nowrap;
                    border-radius: 10px;
                    border: 4px solid #f05d73;
                    background-color: #1f202c;
                }
                /* 菜單選項按鈕 */
                .menu-options {
                    cursor: pointer;
                    font-size: 1.4rem;
                    color: #F6F6F6;
                    font-weight: bold;
                    border-radius: 5px;
                    margin-bottom: 1.2rem;
                    border: 5px inset #EE2B47;
                    background-color: #6e7292;
                    transition: color 0.8s, background-color 0.8s;
                }
                .menu-options:hover {
                    color: #EE2B47;
                    background-color: #F6F6F6;
                }
                .menu-options:disabled {
                    color: #6e7292;
                    cursor: default;
                    background-color: #c5c5c5;
                    border: 5px inset #faa5b2;
                }
                /* 設置內容框架 */
                .content {
                    height: 48vh;
                    width: 28vw;
                    overflow: auto;
                    padding: 0px 1rem;
                    border-radius: 2px;
                    vertical-align: top;
                    border-top: 2px solid #F6F6F6;
                    border-right: 2px solid #F6F6F6;
                }
                .narrative { color: #EE2B47; }
                .Image-input-settings {
                    width: 8rem;
                    color: #F6F6F6;
                    text-align: center;
                    font-size: 1.5rem;
                    border-radius: 15px;
                    border: 3px inset #EE2B47;
                    background-color: #202127;
                }
                .Image-input-settings:disabled {
                    border: 3px inset #faa5b2;
                    background-color: #5a5a5a;
                }
                /* 底部按鈕框架 */
                .button-area {
                    display: flex;
                    padding: 0.3rem;
                    border-left: none;
                    border-radius: 2px;
                    border: 2px solid #F6F6F6;
                    justify-content: space-between;
                }
                .button-area select {
                    color: #F6F6F6;
                    margin-right: 1.5rem;
                    border: 3px inset #EE2B47;
                    background-color: #6e7292;
                }
                /* 底部選項 */
                .button-options {
                    color: #F6F6F6;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-weight: bold;
                    border-radius: 10px;
                    white-space: nowrap;
                    background-color: #6e7292;
                    border: 3px inset #EE2B47;
                    transition: color 0.5s, background-color 0.5s;
                }
                .button-options:hover {
                    color: #EE2B47;
                    background-color: #F6F6F6;
                }
                .button-space { margin: 0 0.6rem; }
                .toggle-menu {
                    width: 0;
                    height: 0;
                    padding: 0;
                    margin: 0;
                }
                /* 整體框線 */
                table, td {
                    margin: 0px;
                    padding: 0px;
                    overflow: auto;
                    border-spacing: 0px;
                }
                .modal-background p {
                    display: flex;
                    flex-wrap: nowrap;
                }
                option { color: #F6F6F6; }
                ul {
                    list-style: none;
                    padding: 0px;
                    margin: 0px;
                }
            </style>
        `;

        // 添加菜單主樣式
        shadowRoot.$safeiHtml(`
            ${menuStyle}
            ${menuScript}
            <div class="modal-background">
                <div class="modal-interface">
                    <table class="modal-box">
                        <tr>
                            <td class="menu">
                                <h2 class="menu-text">${Transl("設置菜單")}</h2>
                                <ul>
                                    <li>
                                        <a class="toggle-menu">
                                            <button class="menu-options" id="image-settings">${Transl("圖像設置")}</button>
                                        </a>
                                    <li>
                                    <li>
                                        <a class="toggle-menu">
                                            <button class="menu-options" disabled>null</button>
                                        </a>
                                    <li>
                                </ul>
                            </td>
                            <td>
                                <table>
                                    <tr>
                                        <td class="content" id="set-content">
                                            <div id="image-settings-show"></div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="button-area">
                                            <select id="language">
                                                <option value="" disabled selected>${Transl("語言")}</option>
                                                <option value="en-US">${Transl("英文")}</option>
                                                <option value="ru">${Transl("俄語")}</option>
                                                <option value="zh-TW">${Transl("繁體")}</option>
                                                <option value="zh-CN">${Transl("簡體")}</option>
                                                <option value="ja">${Transl("日文")}</option>
                                                <option value="ko">${Transl("韓文")}</option>
                                            </select>
                                            <button id="readsettings" class="button-options" disabled>${Transl("讀取設定")}</button>
                                            <span class="button-space"></span>
                                            <button id="closure" class="button-options">${Transl("關閉離開")}</button>
                                            <span class="button-space"></span>
                                            <button id="application" class="button-options">${Transl("保存應用")}</button>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        `);

        const languageEl = shadowRoot.querySelector("#language");
        const readsetEl = shadowRoot.querySelector("#readsettings");
        const interfaceEl = shadowRoot.querySelector(".modal-interface");
        const imageSetEl = shadowRoot.querySelector("#image-settings-show");

        languageEl.value = Log ?? "en-US"; // 添加語言設置
        draggable(interfaceEl); // 添加拖曳功能

        menuRule = shadowRoot.querySelector("#menu-style")?.sheet?.cssRules;

        // 菜單調整依賴
        const menuRequ = {
            menuClose() { // 關閉菜單
                shadow.remove();
            },
            menuSave() { // 保存菜單
                const styles = getComputedStyle(interfaceEl);
                Lib.setV(Parame.SaveKey.Menu, { Top: styles.top, Left: styles.left }); // 保存設置數據
            },
            imgSave() {
                img_set = imageSetEl.querySelectorAll("p"); // 獲取設定 DOM 參數
                if (img_set.length === 0) return;

                imgSetData.forEach(([title, key, set], index) => {
                    img_input = img_set[index].querySelector("input");
                    img_select = img_set[index].querySelector("select");

                    const inputVal = img_input.value;
                    const selectVal = img_select.value;

                    set_value =
                        selectVal === "auto" ? "auto"
                            : inputVal === "" ? set
                                : `${inputVal}${selectVal}`

                    save_cache[img_input.$gAttr("data-key")] = set_value;
                });

                Lib.setV(Parame.SaveKey.Img, save_cache); // 保存設置數據
            },
            async imgSettings() {

                let running = false;
                const handle = (event) => {
                    if (running) return;
                    running = true;

                    const target = event.target;
                    if (!target) {
                        running = false;
                        return;
                    }

                    const key = target.$gAttr("data-key");
                    const value = target?.value;

                    // 是 select
                    if (isNaN(value)) {
                        const input = target.previousElementSibling;
                        if (value === "auto") {
                            input.disabled = true;
                            stylePointer[key](value);
                        } else {
                            input.disabled = false;
                            stylePointer[key](`${input.value}${value}`);
                        }
                    }
                    // 是 input
                    else {
                        const select = target.nextElementSibling;
                        stylePointer[key](`${value}${select.value}`);
                    }

                    setTimeout(() => running = false, 100);
                };

                Lib.onEvent(imageSetEl, "input", handle);
                Lib.onEvent(imageSetEl, "change", handle);
            }
        };

        // 語言選擇
        Lib.onE(languageEl, "change", event => {
            event.stopImmediatePropagation();

            const value = event.currentTarget.value;
            Lib.setV(Parame.SaveKey.Lang, value);

            menuRequ.menuSave();
            menuRequ.menuClose();

            menuInit(Updata => {
                createMenu(Updata.Log, Updata.Transl); // 重新創建
            });
        });

        // 監聽菜單的點擊事件
        Lib.onE(interfaceEl, "click", event => {
            const target = event.target;
            const id = target?.id;
            if (!id) return;

            // 菜單功能選擇
            if (id === "image-settings") {
                const imgsetCss = menuRule[2].style;

                if (imgsetCss.opacity === "0") {
                    let dom = "";

                    imgSetData.forEach(([title, key]) => {
                        dom += getImgOptions(Transl(title), key) + "\n";
                    })

                    imageSetEl.insertAdjacentHTML("beforeend", dom);

                    Object.assign(imgsetCss, {
                        width: "auto",
                        height: "auto",
                        opacity: "1"
                    });

                    target.disabled = true;
                    readsetEl.disabled = false; // 點擊圖片設定才會解鎖讀取設置
                    menuRequ.imgSettings();
                }
            }
            // 讀取設置
            else if (id === "readsettings") {
                img_set = imageSetEl.querySelectorAll("p"); // 獲取設定 DOM 參數
                if (img_set.length === 0) return;

                imgSetData.forEach(([title, key, set], index) => {
                    img_input = img_set[index].querySelector("input");
                    img_select = img_set[index].querySelector("select");

                    if (set === "auto") {
                        img_input.disabled = true;
                        img_select.value = set;
                    } else {
                        analyze = set?.match(/^(\d+)(\D+)$/);
                        if (!analyze) return;

                        img_input.value = analyze[1];
                        img_select.value = analyze[2];
                    }
                });
            }
            // 應用保存
            else if (id === "application") {
                menuRequ.imgSave();
                menuRequ.menuSave();
                menuRequ.menuClose();
            }
            // 關閉菜單
            else if (id === "closure") {
                menuRequ.menuClose();
            }
        });

        // 阻止滾動傳遞
        Lib.onE(imageSetEl, "wheel", event => {
            event.stopPropagation();
        });

    };

    return { menuInit, postViewInit }
})();

export default MenuFactory;