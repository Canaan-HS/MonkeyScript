import { monkeyWindow, Lib } from '../services/client.js';
import { Config, Control, Param } from '../core/config.js';

import _ from '../core/blockad.js';

import Style from '../features/style.js';
import Hotkey from '../features/hotkey.js';
import PageTurn from '../features/pageturn.js';

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
 * 自動翻頁
 * 自動滾動 => 速度設置 / 換頁繼續滾動
 *
 * 請求 document.querySelector(".all_data_list") 主頁數據
 * 製做一個 iframe 或其他 將主頁的選擇漫畫列表複製到菜單中
 *
 * 返回目錄按鈕 返回首頁按鈕
 * 點選模態框關閉 並自動保存 (先隱藏 隔 1 秒刪除, 製作效果, 注意避免重複創建)
 * 模態需要設置特別的標籤 , 要避免被廣告阻擋函數的樣式擋住
 */

export default function Main(raf = import.meta.hot) {

    async function mangaPageInit(callback) {
        Lib.waitEl(["body", "div.mh_readtitle", "div.mh_headpager", "div.mh_readend", "#mangalist"], null,
            { raf, throttle: 30, timeout: 10, visibility: Param.IsMainPage, timeoutResult: true })
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
                Param.BottomStrip = Readend.$q(".endtip2"); // 底部黃條

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

    async function contentsPageInit() {
        Lib.waitEl([".all_data_list", ".website-display-all"], ([list, display]) => {
            if (list.style.height === "auto") return;
            display.click();
        }, { raf });
    };

    try {
        if (Param.IsMangaPage) {
            mangaPageInit(state => {
                if (state) { // 在這邊載入的功能都是需要等到, 找到元素才操作比較不會出錯
                    Style.pictureStyle();
                    Config.BGColor.Enable && Style.backgroundStyle();
                    Config.AutoTurnPage.Enable && PageTurn();
                    Config.RegisterHotkey.Enable && Hotkey();
                } else {
                    Lib.log("Manga Page Init Error").error;
                    setTimeout(() => Main(true), 2e3); // 2 秒後重新執行
                }
            });
        } else contentsPageInit();
    } catch (error) { Lib.log(error).error }

    if (import.meta.hot) {
        return function () {
            Lib.offEvent(window, "message");
            Lib.offEvent(window, "keydown");
            monkeyWindow.Next?.disconnect();
            monkeyWindow.ImgReload?.disconnect();
            monkeyWindow.changeObserver?.disconnect();
            Object.values(Control.IdList).forEach(id => Lib.$q(`#${id}`)?.remove());
        }
    }
};