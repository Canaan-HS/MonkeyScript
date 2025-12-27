// ==UserScript==
// @name         Gpt Translate 優化
// @version      0.0.1
// @author       Canaan HS
// @description  簡單優化

// @match        https://chatgpt.com/*/translate/*

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chatgpt.com

// @require      https://update.greasyfork.org/scripts/487608/1711627/SyntaxLite_min.js

// @grant        none

// @run-at       document-end
// ==/UserScript==

(async () => {

    const config = {
        source: "detect",
        target: "zh-TW",
        translateDelay: 1300,
    };

    Lib.waitEl(["select", "textarea"], null, {
        all: true,
        throttle: 300
    }).then(([selects, textareas]) => {

        const changeSelected = (element, value) => {
            const select = element.$qa("option");
            const optionIndex = select.findIndex(el => el.value === value);
            if (element.selectedIndex !== optionIndex) {
                element.selectedIndex = optionIndex;
                element.dispatchEvent(new Event("change"));
            }
        };

        // 切換選擇 (目前無效, 會被重置)
        // changeSelected(selects[0], config.source);
        // changeSelected(selects[1], config.target);

        // 放大窗口
        textareas.forEach(textarea => {
            Object.assign(textarea.style, {
                minHeight: "400px",
            })
        });

        // 阻止輸入監聽 (等待修改實現)
        // Lib.onEvent(textareas[0], "input", event => {
            // event.stopImmediatePropagation();
        // }, { capture: true });

    });
})();