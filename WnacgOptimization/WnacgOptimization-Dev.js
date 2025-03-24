// ==UserScript==
// @name            wnacg 優化
// @name:zh-TW      wnacg 優化
// @name:zh-CN      wnacg 优化
// @name:ja         wnacg 最適化
// @name:en         wnacg Optimization
// @version         0.0.15
// @author          Canaan HS
// @description         電腦版頁面支持切換自動翻頁或手動按鍵翻頁，並可自定背景顏色及圖像大小。電腦開啟的手機頁面 (移動端不適用)，則可自定背景顏色及圖像大小。
// @description:zh-TW   電腦版頁面支持切換自動翻頁或手動按鍵翻頁，並可自定背景顏色及圖像大小。電腦開啟的手機頁面 (移動端不適用)，則可自定背景顏色及圖像大小。
// @description:zh-CN   电脑版页面支持切换自动翻页或手动按键翻页，并可自定背景颜色及图像大小。电脑开启的手机页面（移动端不适用），则可自定背景颜色及图像大小。
// @description:ja      デスクトップ版ページでは、自動ページ送りと手動キー操作によるページ送りの切り替えができ、背景色と画像サイズをカスタマイズできます。デスクトップで開いたモバイルページ（モバイル端末では適用されません）では、背景色と画像サイズをカスタマイズできます。
// @description:en      The desktop version supports switching between automatic page turning and manual key press page turning, with customizable background color and image size. The mobile version opened on a desktop (not applicable on mobile devices) allows for customizing the background color and image size.

// @match       *://*.wnacg.com/photos-view-id-*.html
// @match       *://*.wnacg01.ru/photos-view-id-*.html
// @match       *://*.wnacg02.ru/photos-view-id-*.html
// @match       *://*.wnacg03.ru/photos-view-id-*.html

// @match       *://*.wnacg.com/photos-slist-aid-*.html
// @match       *://*.wnacg01.ru/photos-slist-aid-*.html
// @match       *://*.wnacg02.ru/photos-slist-aid-*.html
// @match       *://*.wnacg03.ru/photos-slist-aid-*.html

// @icon        https://www.wnacg.com/favicon.ico

// @license     MPL-2.0
// @namespace   https://greasyfork.org/users/989635

// @run-at      document-start
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_registerMenuCommand

// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.14.0/jquery-ui.min.js
// @require     https://update.greasyfork.org/scripts/495339/1551581/ObjectSyntax_min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js
// ==/UserScript==

(async () => {

    // 資料遷移用 (未來刪除)
    (async () => {
        Syn.Store("g", "Mode_V2", false) && Syn.Store("d", "Mode_V2");

        const Settings = Syn.Store("g", "Settings");
        if (Settings) {
            Syn.Store("d", "Settings");

            const { ULS, BW, MW, BH, MH, BC, MT, ML } = Settings[0];
            const Config = {
                SwitchStatus: true,
                MenuTop: MT, MenuLeft: ML,
                ImageBasicWidth: BW, ImageMaxWidth: MW,
                ImageBasicHight: BH, ImageMaxHight: MH,
                ImageSpacing: ULS, BackgroundColor: BC
            };
            Syn.Store("s", "Config", Config);
        };

    })();

    const DLL = (() => {
        // 讀取設置
        const LoadingConfig = () => Syn.Store("g", "Config", null) ?? {
            SwitchStatus: true,
            MenuTop: "auto", MenuLeft: "auto",
            ImageSpacing: "0rem",
            ImageBasicWidth: "100%",
            ImageMaxWidth: "60%",
            ImageBasicHight: "auto",
            ImageMaxHight: "auto",
            BackgroundColor: "#000"
        };

        // 菜單使用的配置解析
        const ConfigAnalyze = (value) => {
            if (value === "auto") {
                return { RangeValue: 9, DisplayText: "auto" };
            } else if (value.endsWith("rem") || value.endsWith("%")) {
                return { RangeValue: parseInt(value), DisplayText: value };
            } else {
                return { RangeValue: value, DisplayText: "color" };
            }
        };

        // 樣式指針
        let Style;
        const StylePointer = {
            MenuTop: value => Style[9].style.top = value,
            MenuLeft: value => Style[9].style.left = value,
            ImageSpacing: value => Style[0].style.margin = `${value} auto`,
            ImageBasicWidth: value => Style[0].style.width = value,
            ImageMaxWidth: value => { Style[0].style.maxWidth = value; Style[2].style.maxWidth = value },
            ImageBasicHight: value => Style[0].style.height = value,
            ImageMaxHight: value => Style[0].style.maxHeight = value,
            BackgroundColor: (element, value) => {
                element.style.setProperty("background-color", value, "important");
            }
        };

        const Display_Lang = {
            Traditional: {},
            Simplified: {
                "圖像設置": "图像设置",
                "圖像間距": "图像间距",
                "基本寬度": "基本宽度",
                "最大寬度": "最大宽度",
                "基本高度": "基本高度",
                "最大高度": "最大高度",
                "背景顏色": "背景颜色",
                "保存設置": "保存设置",
                "滾動閱讀": "滚动阅读",
                "翻頁閱讀": "翻页阅读",
                "🔲 開關菜單": "开关菜单"
            },
            Japan: {
                "圖像設置": "画像設定",
                "圖像間距": "画像間隔",
                "基本寬度": "基本幅",
                "最大寬度": "最大幅",
                "基本高度": "基本高さ",
                "最大高度": "最大高さ",
                "背景顏色": "背景色",
                "保存設置": "設定の保存",
                "滾動閱讀": "スクロール読み取り",
                "翻頁閱讀": "ページ読み取り",
                "🔲 開關菜單": "メニューの切り替え"
            },
            English: {
                "圖像設置": "Image Settings",
                "圖像間距": "Image ImageSpacing",
                "基本寬度": "Base Width",
                "最大寬度": "Max Width",
                "基本高度": "Base Height",
                "最大高度": "Max Height",
                "背景顏色": "BackgroundColor Color",
                "保存設置": "Save Settings",
                "滾動閱讀": "Scroll Read",
                "翻頁閱讀": "TurnPage Read",
                "🔲 開關菜單": "Toggle Menu"
            }
        }, Match = {
            "zh-TW": Display_Lang.Traditional, "zh-HK": Display_Lang.Traditional, "zh-MO": Display_Lang.Traditional,
            "zh-CN": Display_Lang.Simplified, "zh-SG": Display_Lang.Simplified,
            "en-US": Display_Lang.English, "ja": Display_Lang.Japan
        }, ML = Match[Syn.Device.Lang] ?? Match["en-US"];

        // 創建翻譯函數
        const Transl = (Str) => ML[Str] ?? Str;
        // 首次載入設置
        const {
            SwitchStatus, MenuTop, MenuLeft,
            ImageBasicWidth, ImageMaxWidth,
            ImageBasicHight, ImageMaxHight,
            ImageSpacing, BackgroundColor
        } = LoadingConfig();

        Syn.AddStyle(`
            .ImageOptimization {
                display: block;
                margin: ${ImageSpacing} auto;
                width: ${ImageBasicWidth};
                height: ${ImageBasicHight};
                max-width: ${ImageMaxWidth};
                max-height: ${ImageMaxHight};
            }
            body {
                overflow-x: visible !important;
                background-color: ${BackgroundColor} !important;
            }
            a, em {
                color: #fff !important;
            }
            .nav li a {
                float: left;
                line-height: 40px;
                height: 40px;
                width: 85px;
                font-size: 14px;
                color: #fff !important;
                text-decoration: none;
                text-align: center;
                font-weight: bold;
                text-align: center;
                background: #5F5F5F !important;
            }
            .tocaowrap {
                width: 100%;
                margin: 0 auto;
                padding: 0.1rem;
                max-width: ${ImageMaxWidth};
            }
            .btntuzao {
                margin: 0 5px;
                background-color: #5F5F5F;
            }
            #header {
                background: #5F5F5F;
                border-bottom: 1px solid #dfe1e1;
                transform: translateY(-1.6rem);
                opacity: 0;
                transition: 0.8s;
            }
            #header:hover {
                opacity: 1;
                transform: translateY(0rem);
            }
            .modal-background {
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                z-index: 9999;
                position: fixed;
                overflow: auto;
                pointer-events: none;
            }
            .modal-interface {
                top: ${MenuTop};
                left: ${MenuLeft};
                margin: auto;
                color: #3d8fe7;
                padding: 1% 2%;
                border-radius: 5px;
                background-color: #f3f3f3;
                border: 2px solid #c0d8fc;
                pointer-events: auto;
            }
            .slider {
                width: 21rem;
                cursor: pointer;
            }
            .color {
                width: 4rem;
                cursor: pointer;
            }
            .Cshow {
                font-size: 1.25rem;
                margin: auto 1rem;
                font-weight: bold;
            }
            .button-sty {
                color: #ffffff;
                font-size: 1rem;
                padding: 0.3rem;
                font-weight: bold;
                border-radius: 5px;
                background-color: #3d8fe7;
                border: 2px solid #f3f3f3;
            }
            .button-sty:hover,
            .button-sty:focus {
                color: #c0d8fc;
                cursor: pointer;
                text-decoration: none;
            }
            p {
                display: flex;
                align-items: center;
                white-space: nowrap;
            }
            Cins {
                font-size: 1.2rem;
                font-weight: bold;
                padding: 1rem;
                margin-right: 1rem;
            }
            /*--------------------*/
            .DMS {
                position: absolute;
                width: 8.2rem;
                margin-left: 27rem;
            }
            .DMS-checkbox {
                display: none;
            }
            .DMS-label {
                display: block;
                overflow: hidden;
                cursor: pointer;
                border: 2px solid #c0d8fc;
                border-radius: 20px;
            }
            .DMS-inner {
                display: block;
                width: 200%;
                margin-left: -100%;
                transition: margin 0.3s ease-in 0s;
            }
            .DMS-inner:before,
            .DMS-inner:after {
                display: block;
                float: left;
                width: 50%;
                height: 30px;
                padding: 0;
                line-height: 30px;
                font-size: 14px;
                font-family: Trebuchet, Arial, sans-serif;
                font-weight: bold;
                box-sizing: border-box;
            }
            .DMS-inner:before {
                content: "${Transl("滾動閱讀")}";
                padding-left: 1.7rem;
                background-color: #3d8fe7;
                color: #FFFFFF;
            }
            .DMS-inner:after {
                content: "${Transl("翻頁閱讀")}";
                padding-right: 1.5rem;
                background-color: #FFFFFF;
                color: #3d8fe7;
                text-align: right;
            }
            .DMS-switch {
                display: block;
                width: 18px;
                margin: 6px;
                background: #FFFFFF;
                position: absolute;
                top: 0;
                bottom: 0;
                right: 96px;
                border: 2px solid #999999;
                border-radius: 20px;
                transition: all 0.3s ease-in 0s;
            }
            .DMS-checkbox:checked+.DMS-label .DMS-inner {
                margin-left: 0;
            }
            .DMS-checkbox:checked+.DMS-label .DMS-switch {
                right: 0px;
            }
        `);

        // 簡單做個延遲, 避免意外情況
        setTimeout(() => {
            Style = Syn.$$("#New-Style").sheet.cssRules;
        }, 1300);

        return {
            IsMobile: Syn.Device.Url.includes("photos-slist-aid"),
            LoadingConfig, SwitchStatus,
            ConfigAnalyze, StylePointer,
            Transl
        };
    })();

    // 程式入口點
    (async () => {
        if (Syn.Device.Type() == "Mobile") return;

        GM_registerMenuCommand(DLL.Transl("🔲 開關菜單"), () => MeunCreator(true));
        Syn.AddListener(window, "keydown", event => {
            const key = event.key;

            if (key === "Shift") {
                event.preventDefault();
                MeunCreator();
            } else if (key === "Escape") {
                event.preventDefault();
                Syn.$$(".modal-background")?.remove();
            }

        }, { capture: true });

        if (DLL.IsMobile) {
            const processedElements = new Map();

            Syn.WaitElem("#img_list", list => {
                Syn.Observer(list, () => {
                    Syn.$$("div", { root: list, all: true }).forEach(item => {
                        if (!processedElements.has(item)) {
                            processedElements.set(item, true);

                            item.style.cssText = "text-align: center";
                            const img = Syn.$$("img", { root: item });

                            img.removeAttribute("width");
                            img.classList.add("ImageOptimization");
                        };
                    })
                }, {throttle: 1500});
            }, { raf: true, timeout: 10 });

            return;
        };

        Syn.WaitElem([
            ".png.bread", // 廣告
            "#bread", // 廣告容器
            "#photo_body", // 圖片區塊
            "span.newpagelabel b", // 當前頁數
            "#bodywrap", // 底部樣式 1
            ".newpagewrap", // 底部樣式 2
            ".footer.wrap" // 底部樣式 3
        ], found => {
            const [
                ad,
                ad_container,
                photo_box,
                current_page,
                body_wrap, page_wrap, footer_wrap
            ] = found;

            // 替換掉廣告區塊
            ReactDOM.render(
                React.createElement("div", { dangerouslySetInnerHTML: { __html: ad.innerHTML } }), ad_container
            );

            // 刪除不需要區塊
            photo_box.classList.remove("photo_body");
            [body_wrap, page_wrap, footer_wrap].forEach(element => {
                element.style.display = "none";
            });

            // 載入翻頁
            PageTurnCore(photo_box, +current_page.textContent);
        }, { raf: true, timeout: 10 });
    })();

    // 翻頁核心
    async function PageTurnCore(container, current_page) {
        document.title = document.title.split(" - ")[1]; // 變換 title 格式

        const link = Syn.$$("a", { root: container }).href; // 獲取下一頁連結
        const img = Syn.$$("img", { root: container }).src; // 獲取圖像連結

        if (DLL.SwitchStatus) { /* 自動翻頁邏輯 */
            let total_page = Syn.$$("select option", { all: true }).length - current_page;

            const observer = new IntersectionObserver(observed => {
                observed.forEach(entry => {
                    if (entry.isIntersecting) {
                        history.pushState(null, null, entry.target.alt);
                        observer.unobserve(entry.target);
                    };
                });
            }, { threshold: 0.3 });
            function ReactRender({ OLink, src }) {
                return React.createElement("img", {
                    src: src,
                    alt: OLink,
                    loading: "lazy",
                    className: "ImageOptimization",
                    ref: function (img) {
                        if (img) { observer.observe(img) }
                    }
                });
            };
            async function NextPage(link) {
                if (total_page > 0) {
                    fetch(link)
                        .then(response => response.text())
                        .then(html => {
                            const NHtml = Syn.$$("#photo_body", { root: Syn.DomParse(html) });
                            const NLink = Syn.$$("a", { root: NHtml }).href;
                            const NImg = Syn.$$("img", { root: NHtml }).src;
                            ReactDOM.render(React.createElement(ReactRender, { OLink: link, src: NImg }), container.appendChild(document.createElement("div")));

                            setTimeout(() => {
                                total_page--;
                                NextPage(NLink);
                            }, 500);
                        })
                        .catch(error => {
                            NextPage(link);
                        });
                }
            };

            ReactDOM.render(React.createElement(ReactRender, { OLink: Syn.Device.Url, src: img }), container);
            Syn.$$("#header").scrollIntoView(); // 回到頂部
            NextPage(link); // 觸發翻頁
        } else { /* 手動翻頁邏輯 */
            function ReactRender({ number, src }) {
                return React.createElement("img", {
                    src: src,
                    "data-number": number,
                    className: "ImageOptimization"
                })
            };
            async function TurnPage(Link) {
                fetch(Link)
                    .then(response => response.text())
                    .then(html => {
                        const Dom = Syn.DomParse(html);
                        const Photo = Syn.$$("#photo_body", { root: Dom });
                        const NImg = Syn.$$("img", { root: Photo }).src;
                        ReactDOM.render(React.createElement(ReactRender, { number: RecorNumber, src: NImg }), container);

                        const Page = Syn.$$(".newpage .btntuzao", { all: true, root: Dom });
                        RecordBox.set(RecorNumber, { // 紀錄連結
                            PrevLink: Page[0].href,
                            NextLink: Page[1].href
                        });

                        history.pushState(null, null, Link);
                        window.scrollTo(0, 0);
                    })
            };

            let RecorNumber = current_page;
            const RecordBox = new Map();
            const Page = Syn.$$(".newpage .btntuzao", { all: true });

            RecordBox.set(RecorNumber, { // 紀錄連結
                PrevLink: Page[0].href,
                NextLink: Page[1].href
            });
            ReactDOM.render(React.createElement(ReactRender, { number: RecorNumber, NLink: link, src: img }), container); // 重新渲染當前頁面

            // 清除預設按鍵監聽
            document.onkeydown = undefined;
            // 後續監聽翻頁
            $on(window, "keydown", event => {
                const key = event.key;

                if (key == "ArrowLeft" || key == "4") {
                    event.stopImmediatePropagation();
                    --RecorNumber;

                    const dataNumber = +Syn.$$("img", { root: container }).getAttribute("data-number");
                    const PrevLink = RecordBox.get(dataNumber - 1);

                    if (PrevLink) TurnPage(PrevLink.PrevLink);
                    else TurnPage(RecordBox.get(dataNumber).PrevLink); // 當 -1 沒有, 就用原本的

                } else if (key == "ArrowRight" || key == "6") {
                    event.stopImmediatePropagation();
                    ++RecorNumber;

                    const dataNumber = +Syn.$$("img", { root: container }).getAttribute("data-number");
                    const NextLink = RecordBox.get(dataNumber).NextLink;

                    TurnPage(NextLink);
                }
            });
        };
    };

    // 菜單 UI
    async function $on(element, type, listener) { $(element).on(type, listener) };
    async function MeunCreator(remove=false) {
        if (Syn.$$(".modal-background")) {
            if (remove) Syn.$$(".modal-background").remove();
            return;
        }

        const {
            SwitchStatus,
            ImageBasicWidth, ImageMaxWidth,
            ImageBasicHight, ImageMaxHight,
            ImageSpacing, BackgroundColor
        } = DLL.LoadingConfig();

        // 配置解析
        const Parsed = [];
        for (const object of [
            ImageSpacing, ImageBasicWidth, ImageMaxWidth,
            ImageBasicHight, ImageMaxHight, BackgroundColor
        ]) {
            Parsed.push(DLL.ConfigAnalyze(object));
        };

        // 移動端頁面不需要
        const mode = DLL.IsMobile ? "" : `
            <div class="DMS">
                <input type="checkbox" class="DMS-checkbox" id="SwitchMode" ${SwitchStatus ? "checked" : ""}>
                <label class="DMS-label" for="SwitchMode">
                    <span class="DMS-inner"></span>
                    <span class="DMS-switch"></span>
                </label>
            </div>
        `;

        const menu = `
            <div class="modal-background">
                <div class="modal-interface">
                    <div style="display: flex; justify-content: space-between;">
                        <h1 style="margin-bottom: 1rem; font-size: 1.3rem;">${DLL.Transl("圖像設置")}</h1>${mode}
                    </div>
                    <p>
                        <Cins>${DLL.Transl("圖像間距")}</Cins><input type="range" id="ImageSpacing" class="slider" min="0" max="100" step="1" value="${Parsed[0].RangeValue}">
                        <span class="Cshow">${Parsed[0].DisplayText}</span>
                    </p>
                    <br>
                    <p>
                        <Cins>${DLL.Transl("基本寬度")}</Cins><input type="range" id="ImageBasicWidth" class="slider" min="9" max="100" step="1" value="${Parsed[1].RangeValue}">
                        <span class="Cshow">${Parsed[1].DisplayText}</span>
                    </p>
                    <br>
                    <p>
                        <Cins>${DLL.Transl("最大寬度")}</Cins><input type="range" id="ImageMaxWidth" class="slider" min="9" max="100" step="1" value="${Parsed[2].RangeValue}">
                        <span class="Cshow">${Parsed[2].DisplayText}</span>
                    </p>
                    <br>
                    <p>
                        <Cins>${DLL.Transl("基本高度")}</Cins><input type="range" id="ImageBasicHight" class="slider" min="9" max="100" step="1" value="${Parsed[3].RangeValue}">
                        <span class="Cshow">${Parsed[3].DisplayText}</span>
                    </p>
                    <br>
                    <p>
                        <Cins>${DLL.Transl("最大高度")}</Cins><input type="range" id="ImageMaxHight" class="slider" min="9" max="100" step="1" value="${Parsed[4].RangeValue}">
                        <span class="Cshow">${Parsed[4].DisplayText}</span>
                    </p>
                    <br>
                    <p>
                        <Cins>${DLL.Transl("背景顏色")}</Cins><input type="color" id="BackgroundColor" class="color" value="${Parsed[5].RangeValue}">
                        <span style="margin-right: 17.9rem;"></span><button id="SaveConfig" class="button-sty">${DLL.Transl("保存設置")}</button>
                    </p>
                </div>
            </div>
        `;

        const body = document.body;

        $(body).append(menu);
        $(".modal-interface").draggable({ // 添加拖動
            scroll: true,
            opacity: 0.8,
            cursor: "grabbing",
        });

        let id, value, showContainer;
        $on("#BackgroundColor", "input", event => {
            id = event.target.id;
            value = $(event.target).val();
            DLL.StylePointer[id](body, value);
        });
        $on("#ImageSpacing", "input", event => {
            showContainer = $(event.target).next(".Cshow");
            id = event.target.id;
            value = $(event.target).val();
            DLL.StylePointer[id](`${value}rem`);
            showContainer.text(`${value}rem`);
        });
        $on("#ImageBasicWidth, #ImageMaxWidth", "input", event => {
            showContainer = $(event.target).next(".Cshow");
            id = event.target.id;
            value = $(event.target).val();

            if (value === "9") {
                DLL.StylePointer[id]("auto");
                showContainer.text("auto");
            } else {
                DLL.StylePointer[id](`${value}%`);
                showContainer.text(`${value}%`);
            }
        });
        $on("#ImageBasicHight, #ImageMaxHight", "input", event => {
            showContainer = $(event.target).next(".Cshow");
            id = event.target.id;
            value = $(event.target).val();

            if (value === "9") {
                DLL.StylePointer[id]("auto");
                showContainer.text("auto");
            } else {
                DLL.StylePointer[id](`${value}rem`);
                showContainer.text(`${value}rem`);
            }
        });
        $on("#SaveConfig", "click", function () {
            const Config = {};

            // 保存開關狀態
            Config["SwitchStatus"] = $("#SwitchMode").prop("checked") ? true : false;

            const menu_location = $(".modal-interface");
            const top = menu_location.css("top");
            const left = menu_location.css("left");

            // 保存菜單位置同時 設置樣式
            Config["MenuTop"] = top;
            Config["MenuLeft"] = left;
            DLL.StylePointer["MenuTop"](top);
            DLL.StylePointer["MenuLeft"](left);

            // 保存其餘選項
            $(".modal-interface").find("input").not("#SwitchMode").each(function () {
                id = $(this).attr('id');
                value = $(this).val();

                if (id === "ImageSpacing") Config[id] = `${value}rem`;
                else if (id === "ImageBasicWidth" || id === "ImageMaxWidth") {
                    Config[id] = value === "9" ? "auto" : `${value}%`;
                } else if (id === "ImageBasicHight" || id === "ImageMaxHight") {
                    Config[id] = value === "9" ? "auto" : `${value}rem`;
                } else { Config[id] = value }
            });

            // 保存設置
            Syn.Store("s", "Config", Config);
            // 關閉菜單
            $(".modal-background").remove();
        });
    };

})();