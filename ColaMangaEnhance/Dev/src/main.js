import {
    monkeyWindow,
    GM_setValue,
    GM_getValue
} from 'vite-plugin-monkey/dist/client';
const { Syn } = monkeyWindow;

import { Config, Control, Param } from './config.js';
import Tools from './tools.js';
import Style from './style.js';
import PageTurn from './pageturn.js';

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
    const turn = PageTurn(Syn, Control, Param, tools); // 初始化自動翻頁函數

    /* 阻擋廣告 (目前無效) */
    async function BlockAds() {
        const OriginListener = EventTarget.prototype.addEventListener;
        const Block = Control.BlockListener;

        EventTarget.prototype.addEventListener = new Proxy(OriginListener, {
            apply(target, thisArg, args) {
                const [type, listener, options] = args;
                if (Block.has(type)) return;
                return target.apply(thisArg, args);
            }
        });

        // 雖然性能開銷比較高, 但比較不會跳一堆錯誤訊息
        const iframe = `iframe:not(#${Control.IdList.Iframe})`;
        const AdCleanup = () => {
            Syn.$q(iframe)?.remove();
            requestIdleCallback(AdCleanup, { timeout: 300 });
        };

        AdCleanup();

        // ? 奇怪的 Bug, 加一個等待 head 的函數
        Syn.WaitElem("head", () => {
            Syn.AddStyle(`
                html {pointer-events: none !important;}
                div[style*='position'] {display: none !important;}
                .mh_wrap a,
                .mh_readend a,
                span.mh_btn:not(.contact),
                #${Control.IdList.Iframe} {
                    pointer-events: auto !important;
                }
            `, Control.IdList.Block);
        });
    };

    /* 快捷切換上下頁 和 自動滾動 */
    async function HotkeySwitch(Use) {
        // const Use = Config.RegisterHotkey.Function;
        let JumpState = false; // 如果不是最後一頁, 觸發時他將會被設置為 true, 反之始終為 false (是 false 才能觸發跳轉, 一個跳轉的防抖機制)

        if (Syn.Platform === "Desktop") {

            // 是主頁, 啟用保持滾動 & 啟用翻頁自動滾動, 且沒有開啟手動滾動
            if (Param.IsMainPage && Use.KeepScroll && Use.AutoScroll && !Use.ManualScroll) {
                Param.Down_scroll = tools.Storage("scroll"); // 取得是否有保持滾動
                Param.Down_scroll && tools.AutoScroll(Control.ScrollPixels); // 立即觸發滾動
            }

            const UP_ScrollSpeed = -Control.ScrollPixels;
            const CanScroll = Use.AutoScroll || Use.ManualScroll;

            Syn.onEvent(window, "keydown", event => {
                const key = event.key;

                if (key === "ArrowLeft" && Use.TurnPage && !JumpState) {
                    event.stopImmediatePropagation();
                    JumpState = !tools.FinalPage(Param.PreviousLink);
                    location.assign(Param.PreviousLink);
                }
                else if (key === "ArrowRight" && Use.TurnPage && !JumpState) {
                    event.stopImmediatePropagation();
                    JumpState = !tools.FinalPage(Param.NextLink);
                    location.assign(Param.NextLink);
                }
                else if (key === "ArrowUp" && CanScroll) {
                    event.stopImmediatePropagation();
                    event.preventDefault();

                    if (Use.ManualScroll) {
                        tools.ManualScroll(-Syn.iH);
                    } else {
                        if (Param.Up_scroll) {
                            Param.Up_scroll = false;
                        } else if (!Param.Up_scroll || Param.Down_scroll) {
                            Param.Down_scroll = false;
                            Param.Up_scroll = true;
                            tools.AutoScroll(UP_ScrollSpeed);
                        }
                    }
                }
                else if (key === "ArrowDown" && CanScroll) {
                    event.stopImmediatePropagation();
                    event.preventDefault();

                    if (Use.ManualScroll) {
                        tools.ManualScroll(Syn.iH);
                    } else {
                        if (Param.Down_scroll) {
                            Param.Down_scroll = false;
                            tools.Storage("scroll", false);
                        } else if (Param.Up_scroll || !Param.Down_scroll) {
                            Param.Up_scroll = false;
                            Param.Down_scroll = true;
                            tools.Storage("scroll", true);
                            tools.AutoScroll(Control.ScrollPixels);
                        }
                    }
                }
            }, { capture: true });
        } else if (Syn.Platform === "Mobile") {

            let startX, startY, moveX, moveY;
            const sidelineX = Syn.iW * .3;
            const sidelineY = (Syn.iH / 4) * .3;

            Syn.onEvent(window, "touchstart", event => {
                startX = event.touches[0].clientX;
                startY = event.touches[0].clientY;
            }, { passive: true });

            Syn.onEvent(window, "touchmove", Syn.Debounce(event => {
                moveY = event.touches[0].clientY - startY;
                if (Math.abs(moveY) < sidelineY) { // 限制 Y 軸移動
                    moveX = event.touches[0].clientX - startX;

                    if (moveX > sidelineX && !JumpState) { // 右滑 回到上頁, 需要大於限制 X 軸移動
                        JumpState = !tools.FinalPage(Param.PreviousLink);
                        location.assign(Param.PreviousLink);
                    } else if (moveX < -sidelineX && !JumpState) { // 左滑 到下一頁, 需要大於限制 X 軸移動
                        JumpState = !tools.FinalPage(Param.NextLink);
                        location.assign(Param.NextLink);
                    }
                }
            }, 60), { passive: true });
        }
    };

    (() => {

        /* 初始化取得數據 */
        async function Init(callback) {
            Syn.WaitElem(["body", "div.mh_readtitle", "div.mh_headpager", "div.mh_readend", "#mangalist"], null,
                { timeout: 10, throttle: 30, visibility: Param.IsMainPage, timeoutResult: true })
                .then(([Body, Title, HeadPager, Readend, Manga]) => {
                    Param.Body = Body;

                    const HomeLink = Title.$qa("a");
                    Param.ContentsPage = HomeLink[0].href; // 目錄連結
                    Param.HomePage = HomeLink[1].href; // 首頁連結

                    try {
                        const PageLink = Readend.$qa("ul a");
                        Param.PreviousLink = PageLink[0].href;
                        Param.NextLink = PageLink[2].href;
                    } catch {
                        const PageLink = HeadPager.$qa("a.mh_btn:not(.mh_bgcolor)");
                        Param.PreviousLink = PageLink[0].href;
                        Param.NextLink = PageLink[1].href;
                    }

                    Param.MangaList = Manga; // 漫畫列表
                    Param.BottomStrip = Readend.$q("a"); // 以閱讀完畢的那條, 看到他跳轉

                    if ([
                        Param.Body,
                        Param.ContentsPage,
                        Param.HomePage,
                        Param.PreviousLink,
                        Param.NextLink,
                        Param.MangaList,
                        Param.BottomStrip
                    ].every(Check => Check)) callback(true);
                    else callback(false);
                });
        };

        BlockAds();

        try {
            Init(state => {
                if (state) { // 在這邊載入的功能都是需要等到, 找到元素才操作比較不會出錯
                    style.PictureStyle();
                    Config.BGColor.Enable && style.BackgroundStyle(Config.BGColor.Color);
                    Config.AutoTurnPage.Enable && turn.Auto(Config.AutoTurnPage.Mode);
                    Config.RegisterHotkey.Enable && HotkeySwitch(Config.RegisterHotkey.Function);
                } else Syn.Log(null, "Error");
            });
        } catch (error) { Syn.Log(null, error) }
    })();

})();