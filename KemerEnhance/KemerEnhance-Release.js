// ==UserScript==
// @name         Kemer 增強
// @name:zh-TW   Kemer 增強
// @name:zh-CN   Kemer 增强
// @name:ja      Kemer 強化
// @name:en      Kemer Enhancement
// @version      0.0.49-Beta8
// @author       Canaan HS
// @description        美化介面和重新排版，包括移除廣告和多餘的橫幅，修正繪師名稱和編輯相關的資訊保存，自動載入原始圖像，菜單設置圖像大小間距，快捷鍵觸發自動滾動，解析文本中的連結並轉換為可點擊的連結，快速的頁面切換和跳轉功能，並重新定向到新分頁
// @description:zh-TW  美化介面和重新排版，包括移除廣告和多餘的橫幅，修正繪師名稱和編輯相關的資訊保存，自動載入原始圖像，菜單設置圖像大小間距，快捷鍵觸發自動滾動，解析文本中的連結並轉換為可點擊的連結，快速的頁面切換和跳轉功能，並重新定向到新分頁
// @description:zh-CN  美化界面和重新排版，包括移除广告和多余的横幅，修正画师名称和编辑相关的资讯保存，自动载入原始图像，菜单设置图像大小间距，快捷键触发自动滚动，解析文本中的链接并转换为可点击的链接，快速的页面切换和跳转功能，并重新定向到新分頁
// @description:ja     インターフェイスの美化と再配置、広告や余分なバナーの削除、イラストレーター名の修正と関連情報の保存の編集、オリジナル画像の自動読み込み、メニューでの画像のサイズと間隔の設定、ショートカットキーによる自動スクロールのトリガー、テキスト内のリンクの解析とクリック可能なリンクへの変換、高速なページ切り替えとジャンプ機能、新しいタブへのリダイレクト
// @description:en     Beautify the interface and re-layout, including removing ads and redundant banners, correcting artist names and editing related information retention, automatically loading original images, setting image size and spacing in the menu, triggering automatic scrolling with hotkeys, parsing links in the text and converting them to clickable links, fast page switching and jumping functions, and redirecting to a new tab

// @match        *://kemono.su/*
// @match        *://coomer.su/*
// @match        *://nekohouse.su/*
// @match        *://*.kemono.su/*
// @match        *://*.coomer.su/*
// @match        *://*.nekohouse.su/*

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635
// @icon         https://cdn-icons-png.flaticon.com/512/2566/2566449.png

// @connect      *
// @run-at       document-end
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @grant        GM_addElement
// @grant        GM_deleteValue
// @grant        GM_getResourceURL
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        window.onurlchange
// @grant        GM_registerMenuCommand
// @grant        GM_addValueChangeListener

// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.14.0/jquery-ui.min.js
// @require      https://update.greasyfork.org/scripts/495339/1551581/ObjectSyntax_min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js

// @resource     loading https://cdnjs.cloudflare.com/ajax/libs/lightbox2/2.11.3/images/loading.gif
// @resource     font-awesome https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/svg-with-js.min.css
// ==/UserScript==

(async () => {
    /*! mode: 某些功能可以設置模式 (輸入數字), enable: 是否啟用該功能 (布林) !*/
    const User_Config = {
        Global: {
            BlockAds: { mode: 0, enable: true }, // 阻擋廣告
            BackToTop: { mode: 0, enable: true }, // 翻頁後回到頂部
            KeyScroll: { mode: 1, enable: true }, // 上下鍵觸發自動滾動 [mode: 1 = 動畫偵滾動, mode: 2 = 間隔滾動] (選擇對於自己較順暢的)
            DeleteNotice: { mode: 0, enable: true }, // 刪除上方公告
            SidebarCollapse: { mode: 0, enable: true }, // 側邊攔摺疊
            FixArtist: { // 修復作者名稱
                mode: 0,
                enable: true,
                newtab: true, // 是否以新標籤開啟
                newtab_active: true, // 自動切換焦點到新標籤
                newtab_insert: true, // 新標籤插入到當前標籤的正後方
            },
            TextToLink: { // 連結的 (文本 -> 超連結)
                mode: 0,
                enable: true,
                newtab: true,
                newtab_active: false,
                newtab_insert: false,
            },
        },
        Preview: {
            CardZoom: { mode: 2, enable: true }, // 縮放預覽卡大小 [mode: 1 = 卡片放大 , 2 = 卡片放大 + 懸浮縮放]
            CardText: { mode: 2, enable: true }, // 預覽卡文字效果 [mode: 1 = 隱藏文字 , 2 = 淡化文字]
            QuickPostToggle: { mode: 0, enable: true }, // 快速切換帖子 (部份網站失效)
            NewTabOpens: { // 預覽頁面的帖子都以新分頁開啟 (部份網站失效)
                mode: 0,
                enable: true,
                newtab_active: false,
                newtab_insert: true,
            },
        },
        Content: {
            ExtraButton: { mode: 0, enable: true }, // 額外的下方按鈕 (存在 Bug)
            LinkBeautify: { mode: 0, enable: true }, // 下載連結美化, 當出現 (browse »), 滑鼠懸浮會直接顯示內容, 並移除多餘的字串
            CommentFormat: { mode: 0, enable: true }, // 評論區重新排版
            VideoBeautify: { mode: 1, enable: true }, // 影片美化 [mode: 1 = 複製下載節點 , 2 = 移動下載節點] (有啟用 LinkBeautify, 會與原始狀態不同)
            OriginalImage: { // 自動原圖 [mode: 1 = 快速自動 , 2 = 慢速自動 , 3 = 觀察後觸發]
                mode: 1,
                enable: true,
                experiment: false, // 實驗性替換方式
            }
        }
    };
    let Url = Syn.Device.Url;
    const DLL = (() => {
        const Posts = /^(https?:\/\/)?(www\.)?.+\/posts\/?.*$/;
        const Search = /^(https?:\/\/)?(www\.)?.+\/artists\/?.*$/;
        const User = /^(https?:\/\/)?(www\.)?.+\/.+\/user\/[^\/]+(\?.*)?$/;
        const Content = /^(https?:\/\/)?(www\.)?.+\/.+\/user\/.+\/post\/.+$/;
        const Favor = /^(https?:\/\/)?(www\.)?.+\/favorites\?type=post\/?.*$/;
        const Link = /^(https?:\/\/)?(www\.)?.+\/.+\/user\/[^\/]+\/links\/?.*$/;
        const FavorArtist = /^(https?:\/\/)?(www\.)?.+\/favorites(?:\?(?!type=post).*)?$/;
        const Announcement = /^(https?:\/\/)?(www\.)?.+\/(dms|(?:.+\/user\/[^\/]+\/announcements))(\?.*)?$/;
        const Display_Lang = {
            Traditional: {},
            Simplified: {
                "📝 設置選單": "📝 设置菜单",
                "設置菜單": "设置菜单",
                "圖像設置": "图像设置",
                "讀取設定": "读取设置",
                "關閉離開": "关闭退出",
                "保存應用": "保存应用",
                "語言": "语言",
                "英文": "英文",
                "繁體": "繁体",
                "簡體": "简体",
                "日文": "日文",
                "圖片高度": "图片高度",
                "圖片寬度": "图片宽度",
                "圖片最大寬度": "图片最大宽度",
                "圖片間隔高度": "图片间隔高度"
            },
            Japan: {
                "📝 設置選單": "📝 設定メニュー",
                "設置菜單": "設定メニュー",
                "圖像設置": "画像設定",
                "讀取設定": "設定の読み込み",
                "關閉離開": "閉じて終了する",
                "保存應用": "保存して適用する",
                "語言": "言語",
                "英文": "英語",
                "繁體": "繁体字",
                "簡體": "簡体字",
                "日文": "日本語",
                "圖片高度": "画像の高さ",
                "圖片寬度": "画像の幅",
                "圖片最大寬度": "画像の最大幅",
                "圖片間隔高度": "画像の間隔の高さ"
            },
            English: {
                "📝 設置選單": "📝 Settings Menu",
                "設置菜單": "Settings Menu",
                "圖像設置": "Image Settings",
                "讀取設定": "Load Settings",
                "關閉離開": "Close and Exit",
                "保存應用": "Save and Apply",
                "語言": "Language",
                "英文": "English",
                "繁體": "Traditional Chinese",
                "簡體": "Simplified Chinese",
                "日文": "Japanese",
                "圖片高度": "Image Height",
                "圖片寬度": "Image Width",
                "圖片最大寬度": "Maximum Image Width",
                "圖片間隔高度": "Image Spacing Height"
            }
        }, Match = {
            "zh-TW": Display_Lang.Traditional,
            "zh-HK": Display_Lang.Traditional,
            "zh-MO": Display_Lang.Traditional,
            "zh-CN": Display_Lang.Simplified,
            "zh-SG": Display_Lang.Simplified,
            "en-US": Display_Lang.English,
            ja: Display_Lang.Japan
        };
        const Color = {
            kemono: "#e8a17d !important",
            coomer: "#99ddff !important",
            nekohouse: "#bb91ff !important"
        }[Syn.Device.Host.split(".")[0]];
        const SaveKey = {
            Img: "ImgStyle",
            Lang: "Language",
            Menu: "MenuPoint"
        };
        const UserSet = {
            MenuSet: () => {
                return Syn.Store("g", SaveKey.Menu) ?? {
                    Top: "10vh",
                    Left: "10vw"
                };
            },
            ImgSet: () => {
                return Syn.Store("g", SaveKey.Img) ?? {
                    Width: "auto",
                    Height: "auto",
                    Spacing: "0px",
                    MaxWidth: "100%"
                };
            }
        };
        let ImgRule, MenuRule;
        const ImportantStyle = async (element, property, value) => {
            requestAnimationFrame(() => {
                element.style.setProperty(property, value, "important");
            });
        };
        const NormalStyle = (element, property, value) => {
            requestAnimationFrame(() => {
                element.style[property] = value;
            });
        };
        const Style_Pointer = {
            Top: value => NormalStyle(MenuRule[1], "top", value),
            Left: value => NormalStyle(MenuRule[1], "left", value),
            Width: value => ImportantStyle(ImgRule[1], "width", value),
            Height: value => ImportantStyle(ImgRule[1], "height", value),
            MaxWidth: value => ImportantStyle(ImgRule[1], "max-width", value),
            Spacing: value => ImportantStyle(ImgRule[1], "margin", `${value} auto`)
        };
        const Style = {
            Global: async () => {
                Syn.AddStyle(`
                    /* 搜尋頁面的樣式 */
                    fix_tag:hover { color: ${Color}; }
                    .fancy-image__image, fix_name, fix_tag, fix_edit {
                        cursor: pointer;
                    }
                    .user-card__info {
                        display: flex;
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    fix_name {
                        color: #fff;
                        font-size: 28px;
                        font-weight: 500;
                        max-width: 320px;
                        overflow: hidden;
                        padding: .25rem .1rem;
                        border-radius: .25rem;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                    }
                    .edit_artist {
                        position: absolute;
                        top: 36%;
                        right: 8%;
                        color: #fff;
                        display: none;
                        font-size: 14px;
                        font-weight: 700;
                        background: #666;
                        white-space: nowrap;
                        padding: .25rem .5rem;
                        border-radius: .25rem;
                        transform: translateY(-100%);
                    }
                    .edit_textarea {
                        color: #fff;
                        display: block;
                        font-size: 30px;
                        padding: 6px 1px;
                        line-height: 5vh;
                        text-align: center;
                    }
                    .user-card:hover .edit_artist {
                        display: block;
                    }
                    .user-card:hover fix_name {
                        background-color: ${Color};
                    }
                    .edit_textarea ~ fix_name,
                    .edit_textarea ~ .edit_artist {
                        display: none !important;
                    }

                    /* 預覽頁面的樣式 */
                    fix_view {
                        display: flex;
                        flex-flow: wrap;
                        align-items: center;
                    }
                    fix_view fix_name {
                        font-size: 2rem;
                        font-weight: 700;
                        padding: .25rem 3rem;
                        border-radius: .25rem;
                        transition: background-color 0.3s ease;
                    }
                    fix_view .edit_artist {
                        top: 40%;
                        right: 5%;
                        transform: translateY(-80%);
                    }
                    fix_view:hover fix_name {
                        background-color: ${Color};
                    }
                    fix_view:hover .edit_artist {
                        display: block;
                    }

                    /* 內容頁面的樣式 */
                    fix_cont {
                        display: flex;
                        justify-content: space-around;
                    }
                    fix_cont fix_name {
                        color: ${Color};
                        font-size: 1.25em;
                        display: inline-block;
                    }
                    fix_cont .edit_artist {
                        top: 95%;
                        right: -10%;
                    }
                    fix_cont:hover fix_name {
                        background-color: #fff;
                    }
                    fix_cont:hover .edit_artist {
                        display: block;
                    }
                `, "Global-Effects", false);
            },
            Preview: async () => {
                Syn.AddStyle(`
                    .gif-overlay {
                        top: 45%;
                        left: 50%;
                        width: 60%;
                        height: 60%;
                        opacity: 0.5;
                        z-index: 9999;
                        position: absolute;
                        border-radius: 50%;
                        background-size: contain;
                        background-position: center;
                        background-repeat: no-repeat;
                        transform: translate(-50%, -50%);
                        background-image: url("${GM_getResourceURL("loading")}");
                    }
                    .card-list__items {
                        gap: 0.5em;
                        display: flex;
                        grid-gap: 0.5em;
                        position: relative;
                        align-items: var(--local-align);
                        flex-flow: var(--local-flex-flow);
                        justify-content: var(--local-justify);
                    }
                `, "Preview-Effects", false);
            },
            Postview: async () => {
                const set = UserSet.ImgSet();
                const width = Syn.Device.iW() / 2;
                Syn.AddStyle(`
                    .post__files > div,
                    .scrape__files > div {
                        position: relative;
                    }
                    .Image-style, figure img {
                        display: block;
                        width: ${set.Width} !important;
                        height: ${set.Height} !important;
                        margin: ${set.Spacing} auto !important;
                        max-width: ${set.MaxWidth} !important;
                    }
                    .Image-loading-indicator {
                        min-width: 50vW;
                        min-height: 50vh;
                        max-width: ${width}px;
                        max-height: ${width * 9 / 16}px;
                        border: 1px solid #fafafa;
                    }
                    .Image-loading-indicator-experiment {
                        border: 3px solid #00ff7e;
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
                        border-radius: 5px;
                        background-color: rgba(0, 0, 0, 0.3);
                    }
                `, "Image-Custom-Style", false);
                ImgRule = Syn.$$("#Image-Custom-Style")?.sheet.cssRules;
            },
            Awesome: async () => {
                Syn.AddStyle(`
                    ${GM_getResourceText("font-awesome")}
                    #next_box a {
                        cursor: pointer;
                    }
                    #next_box a:hover {
                        background-color: ${Color};
                    }
            `, "Font-awesome", false);
            },
            Menu: () => {
                const set = UserSet.MenuSet();
                Syn.AddScript(`
                    function check(value) {
                        return value.toString().length > 4 || value > 1000
                            ? 1000 : value < 0 ? "" : value;
                    }
                `, "Menu-Settings", false);
                Syn.AddStyle(`
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
                        top: ${set.Top};
                        left: ${set.Left};
                        margin: 0;
                        display: flex;
                        overflow: auto;
                        position: fixed;
                        border-radius: 5px;
                        pointer-events: auto;
                        background-color: #2C2E3E;
                        border: 3px solid #EE2B47;
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
                    .form-hidden {
                        width: 0;
                        height: 0;
                        opacity: 0;
                        padding: 10px;
                        overflow: hidden;
                        transition: opacity 0.8s, height 0.8s, width 0.8s;
                    }
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
                `, "Menu-Custom-Style", false);
                MenuRule = Syn.$$("#Menu-Custom-Style")?.sheet.cssRules;
                Syn.StoreListen(Object.values(SaveKey), call => {
                    if (call.far) {
                        if (Syn.Type(call.nv) == "String") {
                            MenuTrigger();
                        } else {
                            for (const [key, value] of Object.entries(call.nv)) {
                                Style_Pointer[key](value);
                            }
                        }
                    }
                });
            }
        };
        return {
            IsContent: () => Content.test(Url),
            IsAnnouncement: () => Announcement.test(Url),
            IsSearch: () => Search.test(Url) || Link.test(Url) || FavorArtist.test(Url),
            IsAllPreview: () => Posts.test(Url) || User.test(Url) || Favor.test(Url),
            IsNeko: Syn.Device.Host.startsWith("nekohouse"),
            Language: () => {
                const Log = Syn.Store("g", SaveKey.Lang);
                const ML = Match[Log] ?? Match["en-US"];
                return {
                    Log: Log,
                    Transl: Str => ML[Str] ?? Str
                };
            },
            Rendering: ({
                content
            }) => React.createElement("div", {
                dangerouslySetInnerHTML: {
                    __html: content
                }
            }),
            ...UserSet,
            Style: Style,
            Color: Color,
            SaveKey: SaveKey,
            Style_Pointer: Style_Pointer,
            Link: Link,
            Posts: Posts,
            User: User,
            Favor: Favor,
            Search: Search,
            Content: Content,
            FavorArtist: FavorArtist,
            Announcement: Announcement
        };
    })();
    const Enhance = (() => {
        const Validate = (Bool, Num) => {
            return Bool && Syn.Type(Bool) == "Boolean" && Syn.Type(Num) == "Number" ? true : false;
        };
        const Order = {
            Global: ["SidebarCollapse", "DeleteNotice", "BlockAds", "TextToLink", "FixArtist", "BackToTop", "KeyScroll"],
            Preview: ["NewTabOpens", "QuickPostToggle", "CardZoom", "CardText"],
            Content: ["LinkBeautify", "VideoBeautify", "OriginalImage", "ExtraButton", "CommentFormat"]
        };
        const LoadFunc = {
            Global_Cache: undefined,
            Preview_Cache: undefined,
            Content_Cache: undefined,
            Global: function () {
                if (!this.Global_Cache) this.Global_Cache = Global_Function();
                return this.Global_Cache;
            },
            Preview: function () {
                if (!this.Preview_Cache) this.Preview_Cache = Preview_Function();
                return this.Preview_Cache;
            },
            Content: function () {
                if (!this.Content_Cache) this.Content_Cache = Content_Function();
                return this.Content_Cache;
            }
        };
        const Global_Initial = {
            FixArtist: {
                ...User_Config.Global.FixArtist
            },
            TextToLink: {
                ...User_Config.Global.TextToLink
            }
        };
        let Ord;
        async function Call(page, config = User_Config[page]) {
            const func = LoadFunc[page]();
            for (Ord of Order[page]) {
                const {
                    enable,
                    mode,
                    ...other
                } = config[Ord] ?? {};
                if (Validate(enable, mode)) {
                    func[Ord]?.({
                        mode: mode,
                        ...other
                    });
                }
            }
        }
        return {
            Run: async () => {
                Call("Global");
                if (DLL.IsAllPreview()) Call("Preview"); else if (DLL.IsContent()) {
                    DLL.Style.Postview();
                    Call("Content");
                    DLL.Style.Menu();
                    MenuTrigger();
                }
            },
            ExtraInitial: async () => {
                Call("Global", Global_Initial);
                Call("Content");
            }
        };
    })();
    Enhance.Run();
    Syn.AddListener(window, "urlchange", change => {
        Url = change.url;
        setTimeout(() => {
            Enhance.Run();
        }, 800);
    });
    function Global_Function() {
        const LoadFunc = {
            TextToLink_Cache: undefined,
            TextToLink_Dependent: function (Config) {
                if (!this.TextToLink_Cache) {
                    this.TextToLink_Cache = {
                        Protocol_F: /^(?!https?:\/\/)/,
                        Exclusion_F: /onfanbokkusuokibalab\.net/,
                        URL_F: /(?:https?:\/\/[^\s]+)|(?:[a-zA-Z0-9]+\.)?(?:[a-zA-Z0-9]+)\.[^\s]+\/[^\s]+/g,
                        getTextNodes: function (root) {
                            const nodes = [];
                            const tree = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                                acceptNode: node => {
                                    this.URL_F.lastIndex = 0;
                                    const content = node.textContent.trim();
                                    if (!content || this.Exclusion_F.test(content)) return NodeFilter.FILTER_REJECT;
                                    return this.URL_F.test(content) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                                }
                            });
                            while (tree.nextNode()) {
                                nodes.push(tree.currentNode.parentElement);
                            }
                            return nodes;
                        },
                        ParseModify: async function (father, content) {
                            if (this.Exclusion_F.test(content)) return;
                            father.innerHTML = content.replace(this.URL_F, url => {
                                const decode = decodeURIComponent(url).trim();
                                return `<a href="${decode.replace(this.Protocol_F, "https://")}">${decode}</a>`;
                            });
                        },
                        Process: async function (pre) {
                            const Text = pre.textContent;
                            this.URL_F.test(Text) && this.ParseModify(pre, Text);
                        },
                        Multiprocessing: async function (root) {
                            if (DLL.IsNeko) {
                                const Text = root.textContent;
                                this.URL_F.test(Text) && this.ParseModify(root, Text);
                                return;
                            }
                            let p;
                            for (p of Syn.$$("p", {
                                all: true,
                                root: root
                            })) {
                                const Text = p.textContent;
                                this.URL_F.test(Text) && this.ParseModify(p, Text);
                            }
                            let a;
                            for (a of Syn.$$("a", {
                                all: true,
                                root: root
                            })) {
                                !a.href && this.ParseModify(a, a.textContent);
                            }
                        },
                        JumpTrigger: async root => {
                            const [Newtab, Active, Insert] = [Config.newtab ?? true, Config.newtab_active ?? false, Config.newtab_insert ?? false];
                            Syn.AddListener(root, "click", event => {
                                const target = event.target.closest("a:not(.fileThumb)");
                                if (!target || target.hasAttribute("download")) return;
                                event.preventDefault();
                                !Newtab ? location.assign(target.href) : GM_openInTab(target.href, {
                                    active: Active,
                                    insert: Insert
                                });
                            }, {
                                capture: true
                            });
                        }
                    };
                }
                return this.TextToLink_Cache;
            },
            FixArtist_Cache: undefined,
            FixArtist_Dependent: function () {
                if (!this.FixArtist_Cache) {
                    const Fix_Requ = {
                        Record_Cache: undefined,
                        Fix_Cache: new Map(),
                        Get_Record: () => Syn.Storage("fix_record_v2", {
                            type: localStorage,
                            error: new Map()
                        }),
                        Save_Record: async function (save) {
                            await Syn.Storage("fix_record_v2", {
                                type: localStorage,
                                value: new Map([...this.Get_Record(), ...save])
                            });
                            this.Fix_Cache.clear();
                        },
                        Save_Work: (() => Syn.Debounce(() => Fix_Requ.Save_Record(Fix_Requ.Fix_Cache), 1e3))(),
                        Fix_Name_Support: new Set(["pixiv", "fanbox"]),
                        Fix_Tag_Support: {
                            ID: /Patreon|Fantia|Pixiv|Fanbox/gi,
                            Patreon: "https://www.patreon.com/user?u={id}",
                            Fantia: "https://fantia.jp/fanclubs/{id}/posts",
                            Pixiv: "https://www.pixiv.net/users/{id}/artworks",
                            Fanbox: "https://www.pixiv.net/fanbox/creator/{id}",
                            NAME: /Fansly|OnlyFans/gi,
                            OnlyFans: "https://onlyfans.com/{name}",
                            Fansly: "https://fansly.com/{name}/posts"
                        },
                        Fix_Request: async function (url, headers = {}) {
                            return new Promise(resolve => {
                                GM_xmlhttpRequest({
                                    method: "GET",
                                    url: url,
                                    headers: headers,
                                    onload: response => resolve(response),
                                    onerror: () => resolve(),
                                    ontimeout: () => resolve()
                                });
                            });
                        },
                        Get_Pixiv_Name: async function (id) {
                            const response = await this.Fix_Request(`https://www.pixiv.net/ajax/user/${id}?full=1&lang=ja`, {
                                referer: "https://www.pixiv.net/"
                            });
                            if (response.status === 200) {
                                const user = JSON.parse(response.responseText);
                                let user_name = user.body.name;
                                user_name = user_name.replace(/(c\d+)?([日月火水木金土]曜日?|[123１２３一二三]日目?)[東南西北]..?\d+\w?/i, "");
                                user_name = user_name.replace(/[@＠]?(fanbox|fantia|skeb|ファンボ|リクエスト|お?仕事|新刊|単行本|同人誌)+(.*(更新|募集|公開|開設|開始|発売|販売|委託|休止|停止)+中?[!！]?$|$)/gi, "");
                                user_name = user_name.replace(/\(\)|（）|「」|【】|[@＠_＿]+$/g, "").trim();
                                return user_name;
                            } else return;
                        },
                        Fix_Url: function (url) {
                            url = url.match(/\/([^\/]+)\/([^\/]+)\/([^\/]+)$/) || url.match(/\/([^\/]+)\/([^\/]+)$/);
                            url = url.splice(1).map(url => url.replace(/\/?(www\.|\.com|\.jp|\.net|\.adult|user\?u=)/g, ""));
                            return url.length >= 3 ? [url[0], url[2]] : url;
                        },
                        Fix_Update_Ui: async function (href, id, name_onj, tag_obj, text) {
                            const edit = GM_addElement("fix_edit", {
                                id: id,
                                class: "edit_artist",
                                textContent: "Edit"
                            });
                            name_onj.parentNode.insertBefore(edit, name_onj);
                            name_onj.outerHTML = `<fix_name jump="${href}">${text.trim()}</fix_name>`;
                            const [tag_text, support_id, support_name] = [tag_obj.textContent, this.Fix_Tag_Support.ID, this.Fix_Tag_Support.NAME];
                            if (support_id.test(tag_text)) {
                                tag_obj.innerHTML = tag_text.replace(support_id, tag => {
                                    return `<fix_tag jump="${this.Fix_Tag_Support[tag].replace("{id}", id)}">${tag}</fix_tag>`;
                                });
                            } else if (support_name.test(tag_text)) {
                                tag_obj.innerHTML = tag_text.replace(support_name, tag => {
                                    return `<fix_tag jump="${this.Fix_Tag_Support[tag].replace("{name}", id)}">${tag}</fix_tag>`;
                                });
                            }
                        },
                        Fix_Trigger: async function (object) {
                            const {
                                Url,
                                TailId,
                                Website,
                                NameObject,
                                TagObject
                            } = object;
                            let Record = this.Record_Cache.get(TailId);
                            if (Record) {
                                this.Fix_Update_Ui(Url, TailId, NameObject, TagObject, Record);
                            } else {
                                if (this.Fix_Name_Support.has(Website)) {
                                    Record = await this.Get_Pixiv_Name(TailId) ?? NameObject.textContent;
                                    this.Fix_Update_Ui(Url, TailId, NameObject, TagObject, Record);
                                    this.Fix_Cache.set(TailId, Record);
                                    this.Save_Work();
                                } else {
                                    Record = NameObject.textContent;
                                    this.Fix_Update_Ui(Url, TailId, NameObject, TagObject, Record);
                                }
                            }
                        },
                        Search_Fix: async function (items) {
                            items.setAttribute("fix", true);
                            const url = items.href;
                            const img = Syn.$$("img", {
                                root: items
                            });
                            const parse = this.Fix_Url(url);
                            img.setAttribute("jump", url);
                            items.removeAttribute("href");
                            this.Fix_Trigger({
                                Url: url,
                                TailId: parse[1],
                                Website: parse[0],
                                NameObject: Syn.$$(".user-card__name", {
                                    root: items
                                }),
                                TagObject: Syn.$$(".user-card__service", {
                                    root: items
                                })
                            });
                        },
                        Other_Fix: async function (artist, tag = "", href = null, reTag = "<fix_view>") {
                            try {
                                const parent = artist.parentNode;
                                const url = href ?? parent.href;
                                const parse = this.Fix_Url(url);
                                await this.Fix_Trigger({
                                    Url: url,
                                    TailId: parse[1],
                                    Website: parse[0],
                                    NameObject: artist,
                                    TagObject: tag
                                });
                                $(parent).replaceWith(function () {
                                    return $(reTag, {
                                        html: $(this).html()
                                    });
                                });
                            } catch { }
                        },
                        Dynamic_Fix: async function (Listen, Operat, Config = null) {
                            let observer, options;
                            Syn.Observer(Listen, () => {
                                this.Record_Cache = this.Get_Record();
                                const wait = setInterval(() => {
                                    const operat = typeof Operat === "string" ? Syn.$$(Operat) : Operat;
                                    if (operat) {
                                        clearInterval(wait);
                                        switch (Config) {
                                            case 1:
                                                this.Other_Fix(operat);
                                                setTimeout(() => {
                                                    observer.disconnect();
                                                    observer.observe(Listen.children[0], options);
                                                }, 300);
                                                break;

                                            default:
                                                for (const items of Syn.$$("a", {
                                                    all: true,
                                                    root: operat
                                                })) {
                                                    !items.getAttribute("fix") && this.Search_Fix(items);
                                                }
                                        }
                                    }
                                });
                            }, {
                                subtree: false
                            }, back => {
                                observer = back.ob;
                                options = back.op;
                            });
                        }
                    };
                    this.FixArtist_Cache = Fix_Requ;
                }
                return this.FixArtist_Cache;
            }
        };
        return {
            SidebarCollapse: async Config => {
                if (Syn.Device.Type() === "Mobile") return;
                Syn.AddStyle(`
                    .global-sidebar {
                        opacity: 0;
                        height: 100%;
                        width: 10rem;
                        display: flex;
                        position: fixed;
                        padding: 0.5em 0;
                        transition: 0.8s;
                        background: #282a2e;
                        flex-direction: column;
                        transform: translateX(-9rem);
                    }
                    .global-sidebar:hover {opacity: 1; transform: translateX(0rem);}
                    .content-wrapper.shifted {transition: 0.7s; margin-left: 0rem;}
                    .global-sidebar:hover + .content-wrapper.shifted {margin-left: 10rem;}
                `, "Collapse_Effects", false);
            },
            DeleteNotice: async Config => {
                Syn.WaitElem("aside", null, {
                    object: document,
                    timeout: 5
                }).then(aside => aside.remove());
            },
            BlockAds: async Config => {
                const cookieString = document.cookie;
                const required = ["ts_popunder", "ts_popunder-cnt"];
                const hasCookies = required.every(name => new RegExp(`(?:^|;\\s*)${name}=`).test(cookieString));
                if (!hasCookies) {
                    const now = new Date();
                    now.setFullYear(now.getFullYear() + 1);
                    const expires = now.toUTCString();
                    const cookies = {
                        [required[0]]: now,
                        [required[1]]: 1
                    };
                    for (const [key, value] of Object.entries(cookies)) {
                        document.cookie = `${key}=${value}; domain=.${Syn.Device.Host}; path=/; expires=${expires};`;
                    }
                }
                Syn.AddStyle(`
                    .root--ujvuu, [id^="ts_ad_native_"], [id^="ts_ad_video_"] {display: none !important}
                `, "Ad-blocking-style", false);
                Syn.AddScript(String.raw`
                    const domains = [
                        "go.mnaspm.com", "go.reebr.com",
                        "creative.reebr.com", "tsyndicate.com", "tsvideo.sacdnssedge.com"
                    ];
                    const adRegex = new RegExp("(?:" + domains.join("|").replace(/\./g, "\\.") + ")");
                    const XMLRequest = XMLHttpRequest.prototype.open;
                    const Ad_observer = new MutationObserver(() => {
                        XMLHttpRequest.prototype.open = function(method, Url) {
                            if (Url.endsWith(".m3u8") || adRegex.test(Url)) { return; }
                            XMLRequest.apply(this, arguments);
                        };
                        // document.querySelector("div.ex-over-btn")?.click();
                        // document.querySelector(".root--ujvuu button")?.click();
                    });
                    Ad_observer.observe(document.head, {childList: true, subtree: true});
                `, "Ad-blocking-script", false);
            },
            TextToLink: async Config => {
                if (!DLL.IsContent() && !DLL.IsAnnouncement()) return;
                const Func = LoadFunc.TextToLink_Dependent(Config);
                if (DLL.IsContent()) {
                    Syn.WaitElem(".post__body, .scrape__body", null, {
                        raf: true,
                        timeout: 10
                    }).then(body => {
                        Func.JumpTrigger(body);
                        const [article, content] = [Syn.$$("article", {
                            root: body
                        }), Syn.$$(".post__content, .scrape__content", {
                            root: body
                        })];
                        if (article) {
                            let span;
                            for (span of Syn.$$("span.choice-text", {
                                all: true,
                                root: article
                            })) {
                                Func.ParseModify(span, span.textContent);
                            }
                        } else if (content) {
                            Func.getTextNodes(content).forEach(node => {
                                Func.ParseModify(node, node.textContent);
                            });
                        }
                    });
                } else if (DLL.IsAnnouncement()) {
                    Syn.WaitElem(".card-list__items pre", null, {
                        raf: true,
                        timeout: 10
                    }).then(() => {
                        const items = Syn.$$(".card-list__items");
                        Func.JumpTrigger(items);
                        Func.getTextNodes(items).forEach(node => {
                            Func.ParseModify(node, node.textContent);
                        });
                    });
                }
            },
            FixArtist: async Config => {
                DLL.Style.Global();
                const Func = LoadFunc.FixArtist_Dependent();
                const [Device, Newtab, Active, Insert] = [Syn.Device.Type(), Config.newtab ?? true, Config.newtab_active ?? false, Config.newtab_insert ?? false];
                Syn.AddListener(document.body, "click", event => {
                    const target = event.target;
                    if (target.matches("fix_edit")) {
                        event.stopImmediatePropagation();
                        const display = target.nextElementSibling;
                        const text = GM_addElement("textarea", {
                            class: "edit_textarea",
                            style: `height: ${display.scrollHeight + 10}px;`
                        });
                        const original_name = display.textContent;
                        text.value = original_name.trim();
                        display.parentNode.insertBefore(text, target);
                        text.scrollTop = 0;
                        setTimeout(() => {
                            text.focus();
                            setTimeout(() => {
                                Syn.Listen(text, "blur", () => {
                                    const change_name = text.value.trim();
                                    if (change_name != original_name) {
                                        display.textContent = change_name;
                                        Func.Save_Record(new Map([[target.id, change_name]]));
                                    }
                                    text.remove();
                                }, {
                                    once: true,
                                    passive: true
                                });
                            }, 50);
                        }, 300);
                    } else if (target.matches("fix_name") || target.matches("fix_tag") || target.matches("img.fancy-image__image")) {
                        event.stopImmediatePropagation();
                        const jump = target.getAttribute("jump");
                        if (!target.parentNode.matches("fix_cont") && jump) {
                            !Newtab || DLL.IsSearch() && Device == "Mobile" ? location.assign(jump) : GM_openInTab(jump, {
                                active: Active,
                                insert: Insert
                            });
                        } else if (jump) {
                            location.assign(jump);
                        }
                    }
                }, {
                    capture: true,
                    passive: true,
                    mark: "FixArtist"
                });
                Func.Record_Cache = Func.Get_Record();
                if (DLL.IsSearch()) {
                    Syn.WaitElem(".card-list__items", null, {
                        raf: true,
                        timeout: 15
                    }).then(card_items => {
                        if (DLL.Link.test(Url)) {
                            const artist = Syn.$$("span[itemprop='name']");
                            artist && Func.Other_Fix(artist);
                            for (const items of Syn.$$("a", {
                                all: true,
                                root: card_items
                            })) {
                                Func.Search_Fix(items);
                            }
                            Url.endsWith("new") && Func.Dynamic_Fix(card_items, card_items);
                        } else {
                            Func.Dynamic_Fix(card_items, card_items);
                            GM_addElement(card_items, "fix-trigger", {
                                style: "display: none;"
                            });
                        }
                    });
                } else if (DLL.IsContent()) {
                    Syn.WaitElem(["h1 span:nth-child(2)", ".post__user-name, .scrape__user-name"], null, {
                        raf: true,
                        timeout: 15
                    }).then(found => {
                        const [title, artist] = found;
                        Func.Other_Fix(artist, title, artist.href, "<fix_cont>");
                    });
                } else {
                    Syn.WaitElem("span[itemprop='name']", null, {
                        raf: true,
                        timeout: 15
                    }).then(artist => {
                        Func.Other_Fix(artist);
                        if (User_Config.Preview.QuickPostToggle.enable && DLL.IsNeko) {
                            setTimeout(() => {
                                Func.Dynamic_Fix(Syn.$$("section"), "span[itemprop='name']", 1);
                            }, 300);
                        }
                    });
                }
            },
            BackToTop: async Config => {
                Syn.AddListener(document.body, "pointerup", event => {
                    event.target.closest("#paginator-bottom") && Syn.$$("#paginator-top").scrollIntoView();
                }, {
                    capture: true,
                    passive: true,
                    mark: "BackToTop"
                });
            },
            KeyScroll: async Config => {
                if (Syn.Device.Type() === "Mobile") return;
                const Scroll_Requ = {
                    Scroll_Pixels: 2,
                    Scroll_Interval: 800
                };
                const UP_ScrollSpeed = Scroll_Requ.Scroll_Pixels * -1;
                let Scroll, Up_scroll = false, Down_scroll = false;
                const [TopDetected, BottomDetected] = [Syn.Throttle(() => {
                    Up_scroll = Syn.Device.sY() == 0 ? false : true;
                }, 600), Syn.Throttle(() => {
                    Down_scroll = Syn.Device.sY() + Syn.Device.iH() >= document.documentElement.scrollHeight ? false : true;
                }, 600)];
                switch (Config.mode) {
                    case 2:
                        Scroll = Move => {
                            const Interval = setInterval(() => {
                                if (!Up_scroll && !Down_scroll) {
                                    clearInterval(Interval);
                                }
                                if (Up_scroll && Move < 0) {
                                    window.scrollBy(0, Move);
                                    TopDetected();
                                } else if (Down_scroll && Move > 0) {
                                    window.scrollBy(0, Move);
                                    BottomDetected();
                                }
                            }, Scroll_Requ.Scroll_Interval);
                        };

                    default:
                        Scroll = Move => {
                            if (Up_scroll && Move < 0) {
                                window.scrollBy(0, Move);
                                TopDetected();
                                requestAnimationFrame(() => Scroll(Move));
                            } else if (Down_scroll && Move > 0) {
                                window.scrollBy(0, Move);
                                BottomDetected();
                                requestAnimationFrame(() => Scroll(Move));
                            }
                        };
                }
                Syn.AddListener(window, "keydown", Syn.Throttle(event => {
                    const key = event.key;
                    if (key == "ArrowUp") {
                        event.stopImmediatePropagation();
                        event.preventDefault();
                        if (Up_scroll) {
                            Up_scroll = false;
                        } else if (!Up_scroll || Down_scroll) {
                            Down_scroll = false;
                            Up_scroll = true;
                            Scroll(UP_ScrollSpeed);
                        }
                    } else if (key == "ArrowDown") {
                        event.stopImmediatePropagation();
                        event.preventDefault();
                        if (Down_scroll) {
                            Down_scroll = false;
                        } else if (Up_scroll || !Down_scroll) {
                            Up_scroll = false;
                            Down_scroll = true;
                            Scroll(Scroll_Requ.Scroll_Pixels);
                        }
                    }
                }, 100), {
                    capture: true
                });
            }
        };
    }
    function Preview_Function() {
        return {
            NewTabOpens: async Config => {
                const [Newtab, Active, Insert] = [Config.newtab ?? true, Config.newtab_active ?? false, Config.newtab_insert ?? false];
                Syn.AddListener(document.body, "click", event => {
                    const target = event.target.closest("article a");
                    target && (event.preventDefault(), !Newtab ? location.assign(target.href) : GM_openInTab(target.href, {
                        active: Active,
                        insert: Insert
                    }));
                }, {
                    capture: true,
                    mark: "NewTabOpens"
                });
            },
            QuickPostToggle: async Config => {
                DLL.Style.Preview();
                if (!DLL.IsNeko) return;
                Syn.AddListener(document.body, "click", event => {
                    const target = event.target.closest("menu a");
                    target && (event.preventDefault(), GetNextPage(target.href));
                }, {
                    capture: true,
                    mark: "QuickPostToggle"
                });
                async function GetNextPage(link) {
                    const old_section = Syn.$$("section");
                    const items = Syn.$$(".card-list__items");
                    requestAnimationFrame(() => {
                        GM_addElement(items, "img", {
                            class: "gif-overlay"
                        });
                    });
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: link,
                        nocache: false,
                        onload: response => {
                            const Section = Syn.$$("section", {
                                root: response.responseXML
                            });
                            ReactDOM.render(React.createElement(DLL.Rendering, {
                                content: Section.innerHTML
                            }), old_section);
                            history.pushState(null, null, link);
                        },
                        onerror: error => {
                            GetNextPage(link);
                        }
                    });
                }
            },
            CardZoom: async Config => {
                switch (Config.mode) {
                    case 2:
                        Syn.AddStyle(`
                            .post-card a:hover {
                                overflow: auto;
                                z-index: 99999;
                                background: #000;
                                border: 1px solid #fff6;
                                transform: scale(1.6, 1.5);
                            }
                            .post-card a::-webkit-scrollbar {
                                width: 0;
                                height: 0;
                            }
                            .post-card a:hover .post-card__image-container {
                                position: relative;
                            }
                        `, "CardZoom_Effects_2", false);

                    default:
                        Syn.AddStyle(`
                            * { --card-size: 13vw; }
                            .post-card { margin: .3vw; }
                            .post-card a img { border-radius: 8px; }
                            .post-card a {
                                border-radius: 8px;
                                border: 3px solid #fff6;
                                transition: transform 0.4s;
                            }
                        `, "CardZoom_Effects", false);
                }
            },
            CardText: async Config => {
                if (Syn.Device.Type() === "Mobile") return;
                switch (Config.mode) {
                    case 2:
                        Syn.AddStyle(`
                            .post-card__header, .post-card__footer {
                                opacity: 0.4;
                                transition: opacity 0.3s;
                            }
                            a:hover .post-card__header,
                            a:hover .post-card__footer {
                                opacity: 1;
                            }
                        `, "CardText_Effects_2", false);
                        break;

                    default:
                        Syn.AddStyle(`
                            .post-card__header {
                                opacity: 0;
                                z-index: 1;
                                padding: 5px;
                                pointer-events: none;
                                transform: translateY(-6vh);
                            }
                            .post-card__footer {
                                opacity: 0;
                                z-index: 1;
                                padding: 5px;
                                pointer-events: none;
                                transform: translateY(6vh);
                            }
                            a:hover .post-card__header,
                            a:hover .post-card__footer {
                                opacity: 1;
                                pointer-events: auto;
                                transform: translateY(0vh);
                                transition: transform 0.4s, opacity 0.6s;
                            }
                        `, "CardText_Effects", false);
                }
            }
        };
    }
    function Content_Function() {
        const LoadFunc = {
            LinkBeautify_Cache: undefined,
            LinkBeautify_Dependent: function () {
                if (!this.LinkBeautify_Cache) {
                    this.LinkBeautify_Cache = async function ShowBrowse(Browse) {
                        const URL = DLL.IsNeko ? Browse.href : Browse.href.replace("posts", "api/v1/posts");
                        Browse.style.position = "relative";
                        Syn.$$(".View", {
                            root: Browse
                        })?.remove();
                        GM_xmlhttpRequest({
                            method: "GET",
                            url: URL,
                            onload: response => {
                                if (DLL.IsNeko) {
                                    const Main = Syn.$$("main", {
                                        root: response.responseXML
                                    });
                                    const View = GM_addElement("View", {
                                        class: "View"
                                    });
                                    const Buffer = document.createDocumentFragment();
                                    for (const br of Syn.$$("br", {
                                        all: true,
                                        root: Main
                                    })) {
                                        Buffer.append(document.createTextNode(br.previousSibling.textContent.trim()), br);
                                    }
                                    View.appendChild(Buffer);
                                    Browse.appendChild(View);
                                } else {
                                    const View = GM_addElement("View", {
                                        class: "View"
                                    });
                                    const Buffer = document.createDocumentFragment();
                                    for (const text of JSON.parse(response.responseText)["archive"]["file_list"]) {
                                        Buffer.append(document.createTextNode(text), GM_addElement("br"));
                                    }
                                    View.appendChild(Buffer);
                                    Browse.appendChild(View);
                                }
                            },
                            onerror: error => {
                                ShowBrowse(Browse);
                            }
                        });
                    };
                }
                return this.LinkBeautify_Cache;
            },
            VideoBeautify_Cache: undefined,
            VideoBeautify_Dependent: function () {
                if (!this.VideoBeautify_Cache) {
                    this.VideoBeautify_Cache = function VideoRendering({
                        stream
                    }) {
                        return React.createElement("summary", {
                            className: "video-title"
                        }, React.createElement("video", {
                            key: "video",
                            controls: true,
                            preload: "auto",
                            "data-setup": JSON.stringify({}),
                            className: "post-video"
                        }, React.createElement("source", {
                            key: "source",
                            src: stream.src,
                            type: stream.type
                        })));
                    };
                }
                return this.VideoBeautify_Cache;
            },
            ExtraButton_Cache: undefined,
            ExtraButton_Dependent: function () {
                if (!this.ExtraButton_Cache) {
                    this.ExtraButton_Cache = async function GetNextPage(url, old_main) {
                        GM_xmlhttpRequest({
                            method: "GET",
                            url: url,
                            nocache: false,
                            onload: response => {
                                const XML = response.responseXML;
                                const Main = Syn.$$("main", {
                                    root: XML
                                });
                                ReactDOM.render(React.createElement(DLL.Rendering, {
                                    content: Main.innerHTML
                                }), old_main);
                                const Title = Syn.$$("title", {
                                    root: XML
                                })?.textContent;
                                history.pushState(null, null, url);
                                Title && (document.title = Title);
                                setTimeout(() => {
                                    Enhance.ExtraInitial();
                                    Syn.WaitElem(".post__content, .scrape__content", null, {
                                        raf: true,
                                        timeout: 5
                                    }).then(post => {
                                        Syn.$$("p", {
                                            all: true,
                                            root: post
                                        }).forEach(p => {
                                            p.childNodes.forEach(node => {
                                                node.nodeName == "BR" && node.parentNode.remove();
                                            });
                                        });
                                        Syn.$$("a", {
                                            all: true,
                                            root: post
                                        }).forEach(a => {
                                            /\.(jpg|jpeg|png|gif)$/i.test(a.href) && a.remove();
                                        });
                                    });
                                    Syn.$$(".post__title, .scrape__title").scrollIntoView();
                                }, 300);
                            },
                            onerror: error => {
                                GetNextPage(url, old_main);
                            }
                        });
                    };
                }
                return this.ExtraButton_Cache;
            }
        };
        return {
            LinkBeautify: async function (Config) {
                Syn.AddStyle(`
                    .View {
                        top: -10px;
                        z-index: 1;
                        padding: 10%;
                        display: none;
                        overflow: auto;
                        color: #f2f2f2;
                        font-size: 14px;
                        font-weight: 600;
                        position: absolute;
                        white-space: nowrap;
                        border-radius: .5rem;
                        left: calc(100% + 10px);
                        border: 1px solid #737373;
                        background-color: #3b3e44;
                    }
                    a:hover .View { display: block }
                `, "Link_Effects", false);
                Syn.WaitElem(".post__attachment-link, .scrape__attachment-link", null, {
                    raf: true,
                    all: true,
                    timeout: 5
                }).then(post => {
                    const ShowBrowse = LoadFunc.LinkBeautify_Dependent();
                    for (const link of post) {
                        link.setAttribute("download", "");
                        link.href = decodeURIComponent(link.href);
                        link.textContent = link.textContent.replace("Download", "").trim();
                        const Browse = link.nextElementSibling;
                        if (!Browse) continue;
                        ShowBrowse(Browse);
                    }
                });
            },
            VideoBeautify: async function (Config) {
                Syn.AddStyle(`
                    .video-title {margin-top: 0.5rem;}
                    .post-video {height: 50%; width: 60%;}
                `, "Video_Effects", false);
                if (DLL.IsNeko) {
                    Syn.WaitElem(".scrape__files video", null, {
                        raf: true,
                        all: true,
                        timeout: 5
                    }).then(video => {
                        video.forEach(media => media.setAttribute("preload", "auto"));
                    });
                } else {
                    Syn.WaitElem("ul[style*='text-align: center; list-style-type: none;'] li:not([id])", null, {
                        raf: true,
                        all: true,
                        timeout: 5
                    }).then(parents => {
                        Syn.WaitElem(".post__attachment-link, .scrape__attachment-link", null, {
                            raf: true,
                            all: true,
                            timeout: 5
                        }).then(post => {
                            const VideoRendering = LoadFunc.VideoBeautify_Dependent();
                            let li;
                            for (li of parents) {
                                let [node, title, stream] = [undefined, Syn.$$("summary", {
                                    root: li
                                }), Syn.$$("source", {
                                    root: li
                                })];
                                if (!title || !stream) continue;
                                if (title.previousElementSibling) continue;
                                let link;
                                for (link of post) {
                                    if (link.textContent.includes(title.textContent)) {
                                        switch (Config.mode) {
                                            case 2:
                                                link.parentNode.remove();

                                            default:
                                                node = link.cloneNode(true);
                                        }
                                    }
                                }
                                ReactDOM.render(React.createElement(VideoRendering, {
                                    stream: stream
                                }), li);
                                li.insertBefore(node, Syn.$$("summary", {
                                    root: li
                                }));
                            }
                        });
                    });
                }
            },
            OriginalImage: async function (Config) {
                Syn.WaitElem(".post__thumbnail, .scrape__thumbnail", null, {
                    raf: true,
                    all: true,
                    timeout: 6
                }).then(thumbnail => {
                    const LinkObj = DLL.IsNeko ? "div" : "a";
                    const HrefParse = element => {
                        const Uri = element.href || element.getAttribute("href");
                        return Uri.startsWith("http") ? Uri : `${Syn.Device.Orig}${Uri}`;
                    };
                    const Origina_Requ = {
                        Reload: async (Img, Retry) => {
                            if (Retry > 0) {
                                setTimeout(() => {
                                    const src = Img.src;
                                    Img.src = "";
                                    Object.assign(Img, {
                                        src: src,
                                        alt: "Loading Failed"
                                    });
                                    Img.onload = function () {
                                        Img.classList.remove("Image-loading-indicator");
                                    };
                                    Img.onerror = function () {
                                        Origina_Requ.Reload(Img, Retry - 1);
                                    };
                                }, 1e3);
                            }
                        },
                        FailedClick: async () => {
                            Syn.Listen(Syn.$$(".post__files, .scrape__files"), "click", event => {
                                const target = event.target.matches(".Image-link img");
                                if (target && target.alt == "Loading Failed") {
                                    const src = img.src;
                                    img.src = "";
                                    img.src = src;
                                }
                            }, {
                                capture: true,
                                passive: true
                            });
                        },
                        ImgRendering: ({
                            ID,
                            Ourl = null,
                            Nurl
                        }) => {
                            return React.createElement(Ourl ? "rc" : "div", {
                                id: ID,
                                src: Ourl,
                                className: "Image-link"
                            }, React.createElement("img", {
                                key: "img",
                                src: Nurl,
                                className: "Image-loading-indicator Image-style",
                                onLoad: function () {
                                    Syn.$$(`#${ID} img`).classList.remove("Image-loading-indicator");
                                },
                                onError: function () {
                                    Origina_Requ.Reload(Syn.$$(`#${ID} img`), 10);
                                }
                            }));
                        },
                        Request: async function (Container, Url, Result) {
                            const progressLabel = document.createElement("div");
                            progressLabel.className = "progress-indicator";
                            progressLabel.textContent = "0%";
                            Container.appendChild(progressLabel);
                            GM_xmlhttpRequest({
                                url: Url,
                                method: "GET",
                                responseType: "blob",
                                onprogress: progress => {
                                    const done = (progress.done / progress.total * 100).toFixed(1);
                                    progressLabel.textContent = `${done}%`;
                                },
                                onload: response => {
                                    const blob = response.response;
                                    blob instanceof Blob && blob.size > 0 ? Result(URL.createObjectURL(blob)) : Result(Url);
                                },
                                onerror: () => Result(Url)
                            });
                        },
                        FastAuto: async function () {
                            this.FailedClick();
                            thumbnail.forEach((object, index) => {
                                setTimeout(() => {
                                    object.removeAttribute("class");
                                    const a = Syn.$$(LinkObj, {
                                        root: object
                                    });
                                    const hrefP = HrefParse(a);
                                    if (Config.experiment) {
                                        Syn.$$("img", {
                                            root: a
                                        }).classList.add("Image-loading-indicator-experiment");
                                        this.Request(object, hrefP, href => {
                                            ReactDOM.render(React.createElement(this.ImgRendering, {
                                                ID: `IMG-${index}`,
                                                Ourl: hrefP,
                                                Nurl: href
                                            }), object);
                                        });
                                    } else {
                                        ReactDOM.render(React.createElement(this.ImgRendering, {
                                            ID: `IMG-${index}`,
                                            Nurl: hrefP
                                        }), object);
                                    }
                                }, index * 300);
                            });
                        },
                        SlowAuto: async function (index) {
                            if (index == thumbnail.length) return;
                            const object = thumbnail[index];
                            object.removeAttribute("class");
                            const a = Syn.$$(LinkObj, {
                                root: object
                            });
                            const hrefP = HrefParse(a);
                            const img = Syn.$$("img", {
                                root: a
                            });
                            const replace_core = (Nurl, Ourl = null) => {
                                const container = document.createElement(Ourl ? "rc" : "div");
                                Ourl && container.setAttribute("src", Ourl);
                                Object.assign(container, {
                                    id: `IMG-${index}`,
                                    className: "Image-link"
                                });
                                const img = document.createElement("img");
                                Object.assign(img, {
                                    src: Nurl,
                                    className: "Image-loading-indicator Image-style"
                                });
                                img.onload = function () {
                                    img.classList.remove("Image-loading-indicator");
                                    Origina_Requ.SlowAuto(++index);
                                };
                                object.innerHTML = "";
                                container.appendChild(img);
                                object.appendChild(container);
                            };
                            if (Config.experiment) {
                                img.classList.add("Image-loading-indicator-experiment");
                                this.Request(object, hrefP, href => replace_core(href, hrefP));
                            } else {
                                replace_core(hrefP);
                            }
                        },
                        ObserveTrigger: function () {
                            this.FailedClick();
                            return new IntersectionObserver(observed => {
                                observed.forEach(entry => {
                                    if (entry.isIntersecting) {
                                        const object = entry.target;
                                        observer.unobserve(object);
                                        object.removeAttribute("class");
                                        const a = Syn.$$(LinkObj, {
                                            root: object
                                        });
                                        const hrefP = HrefParse(a);
                                        if (Config.experiment) {
                                            Syn.$$("img", {
                                                root: a
                                            }).classList.add("Image-loading-indicator-experiment");
                                            this.Request(object, hrefP, href => {
                                                ReactDOM.render(React.createElement(this.ImgRendering, {
                                                    ID: object.alt,
                                                    Ourl: hrefP,
                                                    Nurl: href
                                                }), object);
                                            });
                                        } else {
                                            ReactDOM.render(React.createElement(this.ImgRendering, {
                                                ID: object.alt,
                                                Nurl: hrefP
                                            }), object);
                                        }
                                    }
                                });
                            }, {
                                threshold: .3
                            });
                        }
                    };
                    let observer;
                    switch (Config.mode) {
                        case 2:
                            Origina_Requ.SlowAuto(0);
                            break;

                        case 3:
                            observer = Origina_Requ.ObserveTrigger();
                            thumbnail.forEach((object, index) => {
                                object.alt = `IMG-${index}`;
                                observer.observe(object);
                            });
                            break;

                        default:
                            Origina_Requ.FastAuto();
                    }
                });
            },
            ExtraButton: async function (Config) {
                DLL.Style.Awesome();
                const GetNextPage = LoadFunc.ExtraButton_Dependent();
                Syn.WaitElem("h2.site-section__subheading", null, {
                    raf: true,
                    timeout: 10
                }).then(comments => {
                    const [Prev, Next, Svg, Span, Buffer] = [Syn.$$(".post__nav-link.prev, .scrape__nav-link.prev"), Syn.$$(".post__nav-link.next, .scrape__nav-link.next"), document.createElement("svg"), document.createElement("span"), document.createDocumentFragment()];
                    Svg.id = "To_top";
                    Svg.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512" style="margin-left: 10px;cursor: pointer;">
                            <style>svg{fill: ${DLL.Color}}</style>
                            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM135.1 217.4l107.1-99.9c3.8-3.5 8.7-5.5 13.8-5.5s10.1 2 13.8 5.5l107.1 99.9c4.5 4.2 7.1 10.1 7.1 16.3c0 12.3-10 22.3-22.3 22.3H304v96c0 17.7-14.3 32-32 32H240c-17.7 0-32-14.3-32-32V256H150.3C138 256 128 246 128 233.7c0-6.2 2.6-12.1 7.1-16.3z"></path>
                        </svg>
                    `;
                    const Next_btn = Next?.cloneNode(true) ?? document.createElement("div");
                    Next_btn.setAttribute("jump", Next_btn.href);
                    Next_btn.removeAttribute("href");
                    Span.id = "Next_box";
                    Span.style = "float: right; cursor: pointer;";
                    Span.appendChild(Next_btn);
                    Syn.AddListener(Svg, "click", () => {
                        Syn.$$("header").scrollIntoView();
                    }, {
                        capture: true,
                        passive: true
                    });
                    Syn.AddListener(Next_btn, "click", () => {
                        if (DLL.IsNeko) {
                            GetNextPage(Next_btn.getAttribute("jump"), Syn.$$("main"));
                        } else {
                            Svg.remove();
                            Span.remove();
                            Next.click();
                        }
                    }, {
                        capture: true,
                        once: true
                    });
                    if (!Syn.$$("#To_top") && !Syn.$$("#Next_box")) {
                        Buffer.append(Svg, Span);
                        comments.appendChild(Buffer);
                    }
                });
            },
            CommentFormat: async function (Config) {
                Syn.AddStyle(`
                    .post__comments,
                    .scrape__comments {
                        display: flex;
                        flex-wrap: wrap;
                    }
                    .post__comments > *:last-child,
                    .scrape__comments > *:last-child {
                        margin-bottom: 0.5rem;
                    }
                    .comment {
                        margin: 0.5rem;
                        max-width: 25rem;
                        border-radius: 10px;
                        flex-basis: calc(35%);
                        word-break: break-all;
                        border: 0.125em solid var(--colour1-secondary);
                    }
                `, "Comment_Effects", false);
            }
        };
    }
    async function $on(element, type, listener) {
        $(element).on(type, listener);
    }
    async function MenuTrigger(callback = null) {
        const {
            Log,
            Transl
        } = DLL.Language();
        callback && callback({
            Log: Log,
            Transl: Transl
        });
        Syn.Menu({
            [Transl("📝 設置選單")]: {
                func: () => Create_Menu(Log, Transl)
            }
        });
    }
    function Create_Menu(Log, Transl) {
        const shadowID = "shadow";
        if (Syn.$$(`#${shadowID}`)) return;
        const set = DLL.ImgSet();
        const img_data = [set.Height, set.Width, set.MaxWidth, set.Spacing];
        let analyze, parent, child, img_set, img_input, img_select, set_value, save_cache = {};
        const shadow = GM_addElement("div", {
            id: shadowID
        });
        const shadowRoot = shadow.attachShadow({
            mode: "open"
        });
        const script = GM_addElement("script", {
            id: "Img-Script",
            textContent: Syn.$$("#Menu-Settings").textContent
        });
        shadowRoot.appendChild(script);
        const style = GM_addElement("style", {
            id: "Menu-Style",
            textContent: Syn.$$("#Menu-Custom-Style").textContent
        });
        shadowRoot.appendChild(style);
        const UnitOptions = `
            <select class="Image-input-settings" style="margin-left: 1rem;">
                <option value="px" selected>px</option>
                <option value="%">%</option>
                <option value="rem">rem</option>
                <option value="vh">vh</option>
                <option value="vw">vw</option>
                <option value="auto">auto</option>
            </select>
        `;
        shadowRoot.innerHTML += `
            <div class="modal-background">
                <div class="modal-interface">
                    <table class="modal-box">
                        <tr>
                            <td class="menu">
                                <h2 class="menu-text">${Transl("設置菜單")}</h2>
                                <ul>
                                    <li>
                                        <a class="toggle-menu" href="#image-settings-show">
                                            <button class="menu-options" id="image-settings">${Transl("圖像設置")}</button>
                                        </a>
                                    <li>
                                    <li>
                                        <a class="toggle-menu" href="#">
                                            <button class="menu-options" disabled>null</button>
                                        </a>
                                    <li>
                                </ul>
                            </td>
                            <td>
                                <table>
                                    <tr>
                                        <td class="content" id="set-content">
                                            <div id="image-settings-show" class="form-hidden">
                                                <div>
                                                    <h2 class="narrative">${Transl("圖片高度")}：</h2>
                                                    <p><input type="number" id="Height" class="Image-input-settings" oninput="value = check(value)"></p>
                                                </div>
                                                <div>
                                                    <h2 class="narrative">${Transl("圖片寬度")}：</h2>
                                                    <p><input type="number" id="Width" class="Image-input-settings" oninput="value = check(value)"></p>
                                                </div>
                                                <div>
                                                    <h2 class="narrative">${Transl("圖片最大寬度")}：</h2>
                                                    <p><input type="number" id="MaxWidth" class="Image-input-settings" oninput="value = check(value)"></p>
                                                </div>
                                                <div>
                                                    <h2 class="narrative">${Transl("圖片間隔高度")}：</h2>
                                                    <p><input type="number" id="Spacing" class="Image-input-settings" oninput="value = check(value)"></p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="button-area">
                                            <select id="language">
                                                <option value="" disabled selected>${Transl("語言")}</option>
                                                <option value="en-US">${Transl("英文")}</option>
                                                <option value="zh-TW">${Transl("繁體")}</option>
                                                <option value="zh-CN">${Transl("簡體")}</option>
                                                <option value="ja">${Transl("日文")}</option>
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
        `;
        $(document.body).append(shadow);
        const $language = $(shadowRoot).find("#language");
        const $readset = $(shadowRoot).find("#readsettings");
        const $interface = $(shadowRoot).find(".modal-interface");
        const $background = $(shadowRoot).find(".modal-background");
        const $imageSet = $(shadowRoot).find("#image-settings-show");
        $language.val(Log ?? "en-US");
        $interface.draggable({
            cursor: "grabbing"
        });
        const Menu_Requ = {
            Menu_Close: () => {
                $background?.off();
                shadow.remove();
            },
            Menu_Save: () => {
                const top = $interface.css("top");
                const left = $interface.css("left");
                Syn.Store("s", DLL.SaveKey.Menu, {
                    Top: top,
                    Left: left
                });
                DLL.Style_Pointer.Top(top);
                DLL.Style_Pointer.Left(left);
            },
            Img_Save: () => {
                img_set = $imageSet.find("p");
                img_data.forEach((read, index) => {
                    img_input = img_set.eq(index).find("input");
                    img_select = img_set.eq(index).find("select");
                    if (img_select.val() == "auto") {
                        set_value = "auto";
                    } else if (img_input.val() == "") {
                        set_value = read;
                    } else {
                        set_value = `${img_input.val()}${img_select.val()}`;
                    }
                    save_cache[img_input.attr("id")] = set_value;
                });
                Syn.Store("s", DLL.SaveKey.Img, save_cache);
            },
            ImageSettings: async () => {
                $on($(shadowRoot).find(".Image-input-settings"), "input change", function (event) {
                    event.stopPropagation();
                    const target = $(this), value = target.val(), id = target.attr("id");
                    parent = target.closest("div");
                    if (isNaN(value)) {
                        child = parent.find("input");
                        if (value === "auto") {
                            child.prop("disabled", true);
                            DLL.Style_Pointer[child.attr("id")](value);
                        } else {
                            child.prop("disabled", false);
                            DLL.Style_Pointer[child.attr("id")](`${child.val()}${value}`);
                        }
                    } else {
                        child = parent.find("select");
                        DLL.Style_Pointer[id](`${value}${child.val()}`);
                    }
                });
            }
        };
        $on($language, "input change", function (event) {
            event.stopPropagation();
            $language.off("input change");
            const value = $(this).val();
            Syn.Store("s", DLL.SaveKey.Lang, value);
            Menu_Requ.Menu_Save();
            Menu_Requ.Menu_Close();
            MenuTrigger(Updata => {
                Create_Menu(Updata.Log, Updata.Transl);
            });
        });
        $on($interface, "click", function (event) {
            const id = $(event.target).attr("id");
            if (id == "image-settings") {
                img_set = $imageSet;
                if (img_set.css("opacity") === "0") {
                    img_set.find("p").each(function () {
                        $(this).append(UnitOptions);
                    });
                    img_set.css({
                        height: "auto",
                        width: "auto",
                        opacity: 1
                    });
                    $readset.prop("disabled", false);
                    Menu_Requ.ImageSettings();
                }
            } else if (id == "readsettings") {
                img_set = $imageSet.find("p");
                img_data.forEach((read, index) => {
                    img_input = img_set.eq(index).find("input");
                    img_select = img_set.eq(index).find("select");
                    if (read == "auto") {
                        img_input.prop("disabled", true);
                        img_select.val(read);
                    } else {
                        analyze = read.match(/^(\d+)(\D+)$/);
                        img_input.val(analyze[1]);
                        img_select.val(analyze[2]);
                    }
                });
            } else if (id == "application") {
                Menu_Requ.Img_Save();
                Menu_Requ.Menu_Save();
                Menu_Requ.Menu_Close();
            } else if (id == "closure") {
                Menu_Requ.Menu_Close();
            }
        });
    }
})();