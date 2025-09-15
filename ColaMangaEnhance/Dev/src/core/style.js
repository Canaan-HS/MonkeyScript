import { monkeyWindow, Lib } from '../services/client.js';
import { Config, Control, Param } from './config.js';
import Tools from '../utils/tools.js';

function Style() {
    const $Set = Tools.getSet();

    return {
        /* 背景樣式 */
        async backgroundStyle(Color=Config.BGColor.Color) {
            Param.Body.style.cssText = `
                background: ${Color} !important;
            `;

            // 避免開啟檔廣告插件時的跑板
            document.documentElement.style.cssText = `
                overflow: visible !important;
            `;
        },

        /* 圖片樣式 */
        async pictureStyle() {
            if (Lib.platform === "Desktop") {
                Lib.addStyle(`
                    .mh_comicpic img {
                        margin: auto;
                        display: block;
                        cursor: pointer;
                        vertical-align: top;
                        width: ${$Set.Img_Bw};
                        max-width: ${$Set.Img_Mw};
                    }
                `, Control.IdList.Image);
            }

            /* 自動重新加載死圖 */
            setTimeout(() => {
                const click = new MouseEvent("click", { bubbles: true, cancelable: true });
                const observer = new IntersectionObserver(observed => {
                    observed.forEach(entry => {
                        if (entry.isIntersecting) { entry.target.dispatchEvent(click) }
                    });
                }, { threshold: .3 });

                Param.MangaList.$qa("span.mh_btn:not(.contact):not(.read_page_link)")
                    .forEach(reloadBtn => observer.observe(reloadBtn));

                if (import.meta.hot) monkeyWindow.ImgReload = observer;
            }, Control.WaitPicture);
        },

        /* 菜單樣式 */
        async menuStyle() {
        }
    }
};

export default Style();