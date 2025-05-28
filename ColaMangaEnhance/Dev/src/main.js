import {
    monkeyWindow,
    GM_setValue,
    GM_getValue
} from 'vite-plugin-monkey/dist/client';
const { Syn } = monkeyWindow;

import { Config, Control, Param } from './config.js';
import Tools from './tools.js';
import Style from './style.js';

/*
Todo 未來添加

// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jscolor/2.5.2/jscolor.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js
*/

/**
 * Todo 選單設置
 *
 * 背景色
 * 圖片基本寬度
 * 圖片最大寬度
 *
 * 開關功能
 *
 * 隱藏廣告
 * 快捷翻頁
 * 自動翻頁 => mode: 1 = 快速, 2 = 普通, 3 = 緩慢, 4 = 無盡
 * 自動滾動 => 速度設置 / 換頁繼續滾動
 *
 * 請求 document.querySelector(".all_data_list") 主頁數據
 * 製做一個 iframe 或其他 將主頁的選擇漫畫列表複製到菜單中
 *
 * 返回目錄按鈕 返回首頁按鈕
 * 點選模態框關閉 並自動保存 (先隱藏 隔 1 秒刪除, 製作效果, 注意避免重複創建)
 * 模態需要設置特別的標籤 , 要避免被廣告阻擋函數的樣式擋住
 */

(async () => {
    const tools = Tools(Syn, Config, Control, Param); // 獲取工具函數
    const Set = tools.GetSet(); // 初始化設置

    const style = Style(Syn, Control, Param, Set); // 初始化樣式函數

    /* 阻擋廣告 (目前無效) */
    async function BlockAds() {
        const OriginListener = EventTarget.prototype.addEventListener, Block = Control.BlockListener;
        const EventListeners = new Map();

        EventTarget.prototype.addEventListener = function (type, listener, options) {
            if (Block.has(type)) return;
            if (!EventListeners.has(this)) EventListeners.set(this, []);
            EventListeners.get(this).push({ type, listener, options });
            OriginListener.call(this, type, listener, options);
        };

        function removeBlockedListeners() {
            EventListeners.forEach((listeners, element) => {
                listeners.forEach(({ type, listener }) => {
                    if (Block.has(type)) {
                        element.removeEventListener(type, listener);
                    }
                });
            });
        }

        Syn.AddStyle(`
                html {pointer-events: none !important;}
                .mh_wrap, span.mh_btn:not(.contact), ${Control.IdList.Iframe} {pointer-events: auto;}
        `, Control.IdList.Block);

        // 雖然性能開銷比較高, 但比較不會跳一堆錯誤訊息
        const iframe = `iframe:not(#${Control.IdList.Iframe})`;
        const AdCleanup = () => {
            Syn.$q(iframe)?.remove();
            removeBlockedListeners();
            requestIdleCallback(AdCleanup, { timeout: 500 });
        };

        AdCleanup();
    };

    /* 快捷切換上下頁 和 自動滾動 */
    async function HotkeySwitch() {
        const Use = Config.RegisterHotkey.Function;
        let JumpState = false; // 如果不是最後一頁, 觸發時他將會被設置為 true, 反之始終為 false (是 false 才能觸發跳轉, 一個跳轉的防抖機制)

        if (Syn.Platform() === "Desktop") {
            // 是主頁, 且啟用保持滾動, 也啟用自動滾動(避免無法手動停止), 且沒有開啟手動滾動(避免無法手動停止)
            if (Param.IsMainPage && Use.KeepScroll && Use.AutoScroll && !Use.ManualScroll) {
                Param.IsMainPage = tools.Storage("scroll"); // 取得是否有保持滾動
                Param.IsMainPage && tools.AutoScroll(Control.ScrollPixels); // 立即觸發滾動
            }

            const UP_ScrollSpeed = -Control.ScrollPixels;
            const CanScroll = Use.AutoScroll || Use.ManualScroll;

            Syn.onEvent(window, "keydown", event => {
                const key = event.key;
                if (key == "ArrowLeft" && Use.TurnPage && !JumpState) {
                    event.stopImmediatePropagation();
                    JumpState = !tools.FinalPage(Param.PreviousPage);
                    location.assign(Param.PreviousPage);
                }
                else if (key == "ArrowRight" && Use.TurnPage && !JumpState) {
                    event.stopImmediatePropagation();
                    JumpState = !tools.FinalPage(Param.NextPage);
                    location.assign(Param.NextPage);
                }
                else if (key == "ArrowUp" && CanScroll) {
                    event.stopImmediatePropagation();
                    event.preventDefault();

                    if (Use.ManualScroll) {
                        tools.ManualScroll(-Syn.iH());
                    } else {
                        if (Param.IsMainPage) {
                            Param.IsMainPage = false;
                        } else if (!Param.IsMainPage || Param.IsMainPage) {
                            Param.IsMainPage = false;
                            Param.IsMainPage = true;
                            tools.AutoScroll(UP_ScrollSpeed);
                        }
                    }
                }
                else if (key == "ArrowDown" && CanScroll) {
                    event.stopImmediatePropagation();
                    event.preventDefault();

                    if (Use.ManualScroll) {
                        tools.ManualScroll(Syn.iH());
                    } else {
                        if (Param.IsMainPage) {
                            Param.IsMainPage = false;
                            tools.Storage("scroll", false);
                        } else if (Param.IsMainPage || !Param.IsMainPage) {
                            Param.IsMainPage = false;
                            Param.IsMainPage = true;
                            tools.Storage("scroll", true);
                            tools.AutoScroll(Control.ScrollPixels);
                        }
                    }
                }
            }, { capture: true });
        } else if (Syn.Platform() === "Mobile") {

            let startX, startY, moveX, moveY;
            const sidelineX = Syn.iW() * .3;
            const sidelineY = (Syn.iH() / 4) * .3;

            Syn.onEvent(window, "touchstart", event => {
                startX = event.touches[0].clientX;
                startY = event.touches[0].clientY;
            }, { passive: true });

            Syn.onEvent(window, "touchmove", Syn.Debounce(event => {
                moveY = event.touches[0].clientY - startY;
                if (Math.abs(moveY) < sidelineY) { // 限制 Y 軸移動
                    moveX = event.touches[0].clientX - startX;

                    if (moveX > sidelineX && !JumpState) { // 右滑 回到上頁, 需要大於限制 X 軸移動
                        JumpState = !tools.FinalPage(Param.PreviousPage);
                        location.assign(Param.PreviousPage);
                    } else if (moveX < -sidelineX && !JumpState) { // 左滑 到下一頁, 需要大於限制 X 軸移動
                        JumpState = !tools.FinalPage(Param.NextPage);
                        location.assign(Param.NextPage);
                    }
                }
            }, 60), { passive: true });
        }
    };

})();