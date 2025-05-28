export default function Style(Syn, Control, Param, Set) {


    return {
        /* 背景樣式 */
        async BackgroundStyle(Color) {
            Param.Body.style.cssText = `
                background: ${Color} !important;
            `;

            // 避免開啟檔廣告插件時的跑板
            document.documentElement.style.cssText = `
                overflow: visible !important;
            `;
        },

        /* 圖片樣式 */
        async PictureStyle() {
            if (Syn.Platform === "Desktop") {
                Syn.AddStyle(`
                    .mh_comicpic img {
                        margin: auto;
                        display: block;
                        cursor: pointer;
                        vertical-align: top;
                        width: ${Set.Img_Bw};
                        max-width: ${Set.Img_Mw};
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
            }, Control.WaitPicture);
        },

        /* 菜單樣式 */
        async MenuStyle() {
        }
    }
};