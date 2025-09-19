import { Lib } from '../services/client.js';
import { Config, Control, Param } from '../core/config.js';

import Tools from '../utils/tools.js';

/* 快捷切換上下頁 和 自動滾動 */
export default async () => {
    const { TurnPage, AutoScroll, KeepScroll, ManualScroll } = Config.RegisterHotkey.Function;

    let jumpState = false; // 如果不是最後一頁, 觸發時他將會被設置為 true, 反之始終為 false (是 false 才能觸發跳轉, 一個跳轉的防抖機制)
    if (Lib.platform === "Desktop") {

        // 是主頁, 啟用保持滾動 & 啟用翻頁自動滾動, 且沒有開啟手動滾動
        if (Param.IsMainPage && KeepScroll && AutoScroll && !ManualScroll) {
            Param.Down_scroll = Tools.storage("scroll"); // 取得是否有保持滾動
            Param.Down_scroll && Tools.autoScroll(Control.ScrollPixels); // 立即觸發滾動
        }

        const UP_ScrollSpeed = -Control.ScrollPixels;
        const CanScroll = AutoScroll || ManualScroll;

        Lib.onEvent(window, "keydown", event => {
            const key = event.key;

            if (key === "ArrowLeft" && TurnPage && !jumpState) {
                event.stopImmediatePropagation();
                jumpState = !Tools.isFinalPage(Param.PreviousLink);
                location.assign(Param.PreviousLink);
            }
            else if (key === "ArrowRight" && TurnPage && !jumpState) {
                event.stopImmediatePropagation();
                jumpState = !Tools.isFinalPage(Param.NextLink);
                location.assign(Param.NextLink);
            }
            else if (key === "ArrowUp" && CanScroll) {
                event.stopImmediatePropagation();
                event.preventDefault();

                if (ManualScroll) {
                    Tools.manualScroll(-Lib.iH);
                } else {
                    if (Param.Up_scroll) {
                        Param.Up_scroll = false;
                    } else if (!Param.Up_scroll || Param.Down_scroll) {
                        Param.Down_scroll = false;
                        Param.Up_scroll = true;
                        Tools.autoScroll(UP_ScrollSpeed);
                    }
                }
            }
            else if (key === "ArrowDown" && CanScroll) {
                event.stopImmediatePropagation();
                event.preventDefault();

                if (ManualScroll) {
                    Tools.manualScroll(Lib.iH);
                } else {
                    if (Param.Down_scroll) {
                        Param.Down_scroll = false;
                        Tools.storage("scroll", false);
                    } else if (Param.Up_scroll || !Param.Down_scroll) {
                        Param.Up_scroll = false;
                        Param.Down_scroll = true;
                        Tools.storage("scroll", true);
                        Tools.autoScroll(Control.ScrollPixels);
                    }
                }
            }
        }, { capture: true });
    } else if (Lib.platform === "Mobile") {

        let startX, startY, moveX, moveY;
        const sidelineX = Lib.iW * .3;
        const sidelineY = (Lib.iH / 4) * .3;

        Lib.onEvent(window, "touchstart", event => {
            startX = event.touches[0].clientX;
            startY = event.touches[0].clientY;
        }, { passive: true });

        Lib.onEvent(window, "touchmove", Lib.$debounce(event => {
            moveY = event.touches[0].clientY - startY;
            if (Math.abs(moveY) < sidelineY) { // 限制 Y 軸移動
                moveX = event.touches[0].clientX - startX;

                if (moveX > sidelineX && !jumpState) { // 右滑 回到上頁, 需要大於限制 X 軸移動
                    jumpState = !Tools.isFinalPage(Param.PreviousLink);
                    location.assign(Param.PreviousLink);
                } else if (moveX < -sidelineX && !jumpState) { // 左滑 到下一頁, 需要大於限制 X 軸移動
                    jumpState = !Tools.isFinalPage(Param.NextLink);
                    location.assign(Param.NextLink);
                }
            }
        }, 60), { passive: true });
    }
};