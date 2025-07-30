// ==UserScript==
// @name         Kemer Enhance
// @name:zh-TW   Kemer 增強
// @name:zh-CN   Kemer 增强
// @name:ja      Kemer 強化
// @name:ko      Kemer 강화
// @name:ru      Kemer Улучшение
// @name:en      Kemer Enhance
// @version      0.0.50-Beta2
// @author       Canaan HS
// @description        美化介面和重新排版，包括移除廣告和多餘的橫幅，修正繪師名稱和編輯相關的資訊保存，自動載入原始圖像，菜單設置圖像大小間距，快捷鍵觸發自動滾動，解析文本中的連結並轉換為可點擊的連結，快速的頁面切換和跳轉功能，並重新定向到新分頁
// @description:zh-TW  美化介面和重新排版，包括移除廣告和多餘的橫幅，修正繪師名稱和編輯相關的資訊保存，自動載入原始圖像，菜單設置圖像大小間距，快捷鍵觸發自動滾動，解析文本中的連結並轉換為可點擊的連結，快速的頁面切換和跳轉功能，並重新定向到新分頁
// @description:zh-CN  美化界面和重新排版，包括移除广告和多余的横幅，修正画师名称和编辑相关的资讯保存，自动载入原始图像，菜单设置图像大小间距，快捷键触发自动滚动，解析文本中的链接并转换为可点击的链接，快速的页面切换和跳转功能，并重新定向到新分頁
// @description:ja     インターフェイスの美化と再配置、広告や余分なバナーの削除、イラストレーター名の修正と関連情報の保存の編集、オリジナル画像の自動読み込み、メニューでの画像のサイズと間隔の設定、ショートカットキーによる自動スクロールのトリガー、テキスト内のリンクの解析とクリック可能なリンクへの変換、高速なページ切り替えとジャンプ機能、新しいタブへのリダイレクト
// @description:ko     인터페이스 미화 및 재배치, 광고 및 불필요한 배너 제거, 아티스트 이름 수정 및 관련 정보 저장 편집, 원본 이미지 자동 로드, 메뉴에서 이미지 크기 및 간격 설정, 단축키로 자동 스크롤 트리거, 텍스트 내 링크 분석 및 클릭 가능한 링크로 변환, 빠른 페이지 전환 및 점프 기능, 새 탭으로 리디렉션
// @description:ru     Улучшение интерфейса и перекомпоновка, включая удаление рекламы и лишних баннеров, исправление имен художников и редактирование сохранения связанной информации, автоматическая загрузка оригинальных изображений, настройка размера и интервала изображений в меню, запуск автоматической прокрутки с помощью горячих клавиш, анализ ссылок в тексте и преобразование их в кликабельные ссылки, быстрые функции переключения и перехода между страницами, перенаправление на новую вкладку
// @description:en     Beautify the interface and re-layout, including removing ads and redundant banners, correcting artist names and editing related information retention, automatically loading original images, setting image size and spacing in the menu, triggering automatic scrolling with hotkeys, parsing links in the text and converting them to clickable links, fast page switching and jumping functions, and redirecting to a new tab

// @connect      *
// @match        *://kemono.cr/*
// @match        *://coomer.st/*
// @match        *://nekohouse.su/*

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635
// @icon         https://cdn-icons-png.flaticon.com/512/2566/2566449.png

// @require      https://update.greasyfork.org/scripts/487608/1616382/SyntaxLite_min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.14.1/jquery-ui.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/preact/10.26.9/preact.umd.min.js

// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @grant        GM_xmlhttpRequest
// @grant        window.onurlchange
// @grant        GM_registerMenuCommand
// @grant        GM_addValueChangeListener

// @run-at       document-end
// ==/UserScript==

(async () => {
    /*! mode: 某些功能可以設置模式 (輸入數字), enable: 是否啟用該功能 (布林) !*/
    const User_Config = {
        Global: {
            BlockAds: { mode: 0, enable: true }, // 阻擋廣告
            BackToTop: { mode: 0, enable: true }, // 翻頁後回到頂部
            CacheFetch: { mode: 0, enable: true }, // 緩存 Fetch 請求 (僅限 JSON)
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
            QuickPostToggle: { mode: 0, enable: true }, // 快速切換帖子 (僅支援 nekohouse)
            NewTabOpens: { // 預覽頁面的帖子都以新分頁開啟
                mode: 0,
                enable: true,
                newtab_active: false,
                newtab_insert: true,
            },
        },
        Content: {
            ExtraButton: { mode: 0, enable: true }, // 額外的下方按鈕
            LinkBeautify: { mode: 0, enable: true }, // 下載連結美化, 當出現 (browse »), 滑鼠懸浮會直接顯示內容, 並移除多餘的字串
            CommentFormat: { mode: 0, enable: true }, // 評論區重新排版
            VideoBeautify: { mode: 1, enable: true }, // 影片美化 [mode: 1 = 複製下載節點 , 2 = 移動下載節點]
            OriginalImage: { // 自動原圖 [mode: 1 = 快速自動 , 2 = 慢速自動 , 3 = 觀察後觸發]
                mode: 1,
                enable: true,
                experiment: false, // 實驗性替換方式
            }
        }
    };

    /* ==================== 依賴項目 ==================== */
    let Url = Syn.$url;
    const DLL = (() => {
        // 頁面正則
        const Posts = /^(https?:\/\/)?(www\.)?.+\/posts\/?.*$/;
        const Search = /^(https?:\/\/)?(www\.)?.+\/artists\/?.*$/;
        const User = /^(https?:\/\/)?(www\.)?.+\/.+\/user\/[^\/]+(\?.*)?$/;
        const Content = /^(https?:\/\/)?(www\.)?.+\/.+\/user\/.+\/post\/.+$/;
        const Favor = /^(https?:\/\/)?(www\.)?.+\/favorites\?type=post\/?.*$/;
        const Link = /^(https?:\/\/)?(www\.)?.+\/.+\/user\/[^\/]+\/links\/?.*$/;
        const FavorArtist = /^(https?:\/\/)?(www\.)?.+\/favorites(?:\?(?!type=post).*)?$/;
        const Announcement = /^(https?:\/\/)?(www\.)?.+\/(dms|(?:.+\/user\/[^\/]+\/announcements))(\?.*)?$/;

        // 所需樣式 (需要傳入顏色的, 就是需要動態適應顏色變化)
        const Color = {
            "kemono": "#e8a17d !important",
            "coomer": "#99ddff !important",
            "nekohouse": "#bb91ff !important"
        }[Syn.$domain.split(".")[0]];

        const SaveKey = { Img: "ImgStyle", Lang: "Language", Menu: "MenuPoint" };
        // 導入使用者設定
        const UserSet = {
            MenuSet: () => Syn.gV(SaveKey.Menu, {
                Top: "10vh",
                Left: "10vw"
            }),
            ImgSet: () => Syn.gV(SaveKey.Img, {
                Width: "auto",
                Height: "auto",
                Spacing: "0px",
                MaxWidth: "100%",
            })
        };

        // 動態調整圖片樣式
        let ImgRule, MenuRule;
        const ImportantStyle = async (element, property, value) => {
            requestAnimationFrame(() => {
                element.style.setProperty(property, value, "important");
            })
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

        // 功能依賴樣式
        const Style = {
            async Global() { // 全域 修復所需
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
                        top: 85px;
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
                        top: 65px;
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
                        top: 200px;
                        right: -5%;
                    }
                    fix_cont:hover fix_name {
                        background-color: #fff;
                    }
                    fix_cont:hover .edit_artist {
                        display: block;
                    }
                `, "Global-Effects", false);
            },
            async Postview() { // 觀看帖子頁所需
                // 讀取圖像設置
                const set = UserSet.ImgSet();
                const width = Syn.iW / 2;
                Syn.AddStyle(`
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
                ImgRule = Syn.$q("#Image-Custom-Style")?.sheet.cssRules;

                // 全局修改功能
                Syn.StoreListen(Object.values(SaveKey), call => {
                    if (call.far) {
                        if (Syn.Type(call.nv) === "String") {
                            MenuTrigger();
                        } else {
                            for (const [key, value] of Object.entries(call.nv)) {
                                Style_Pointer[key](value);
                            }
                        }
                    }
                });
            },
            async PostExtra() { // 觀看帖子頁圖示
                Syn.AddStyle(`
                    #main section {
                        width: 100%;
                    }
                    #next_box a {
                        cursor: pointer;
                    }
                    #next_box a:hover {
                        background-color: ${Color};
                    }
                `, "Post-Extra", false);
            },
            Menu() { // 回傳創建菜單所需資訊
                const set = UserSet.MenuSet();

                return {
                    ImgScript: `
                        function check(value) {
                            return value.toString().length > 4 || value > 1000
                                ? 1000 : value < 0 ? "" : value;
                        }
                    `,
                    MenuStyle: `
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
                    `
                }
            }
        };

        // 展示語言
        const Word = {
            Traditional: {},
            Simplified: {
                "📝 設置選單": "📝 设置菜单",
                "設置菜單": "设置菜单",
                "圖像設置": "图像设置",
                "讀取設定": "加载设置",
                "關閉離開": "关闭",
                "保存應用": "保存并应用",
                "語言": "语言",
                "英文": "英语",
                "繁體": "繁体中文",
                "簡體": "简体中文",
                "日文": "日语",
                "韓文": "韩语",
                "俄語": "俄语",
                "圖片高度": "图片高度",
                "圖片寬度": "图片宽度",
                "圖片最大寬度": "图片最大宽度",
                "圖片間隔高度": "图片间距"
            },
            Japan: {
                "📝 設置選單": "📝 設定メニュー",
                "設置菜單": "設定メニュー",
                "圖像設置": "画像設定",
                "讀取設定": "設定を読み込む",
                "關閉離開": "閉じる",
                "保存應用": "保存して適用",
                "語言": "言語",
                "英文": "英語",
                "繁體": "繁体字中国語",
                "簡體": "簡体字中国語",
                "日文": "日本語",
                "韓文": "韓国語",
                "俄語": "ロシア語",
                "圖片高度": "画像の高さ",
                "圖片寬度": "画像の幅",
                "圖片最大寬度": "画像の最大幅",
                "圖片間隔高度": "画像の間隔"
            },
            Korea: {
                "📝 設置選單": "📝 설정 메뉴",
                "設置菜單": "설정 메뉴",
                "圖像設置": "이미지 설정",
                "讀取設定": "설정 불러오기",
                "關閉離開": "닫기",
                "保存應用": "저장 및 적용",
                "語言": "언어",
                "英文": "영어",
                "繁體": "번체 중국어",
                "簡體": "간체 중국어",
                "日文": "일본어",
                "韓文": "한국어",
                "俄語": "러시아어",
                "圖片高度": "이미지 높이",
                "圖片寬度": "이미지 너비",
                "圖片最大寬度": "이미지 최대 너비",
                "圖片間隔高度": "이미지 간격"
            },
            Russia: {
                "📝 設置選單": "📝 Меню настроек",
                "設置菜單": "Меню настроек",
                "圖像設置": "Настройки изображений",
                "讀取設定": "Загрузить настройки",
                "關閉離開": "Закрыть",
                "保存應用": "Сохранить и применить",
                "語言": "Язык",
                "英文": "Английский",
                "繁體": "Традиционный китайский",
                "簡體": "Упрощенный китайский",
                "日文": "Японский",
                "韓文": "Корейский",
                "俄語": "Русский",
                "圖片高度": "Высота изображения",
                "圖片寬度": "Ширина изображения",
                "圖片最大寬度": "Максимальная ширина",
                "圖片間隔高度": "Интервал между изображениями"
            },
            English: {
                "📝 設置選單": "📝 Settings Menu",
                "設置菜單": "Settings Menu",
                "圖像設置": "Image Settings",
                "讀取設定": "Load Settings",
                "關閉離開": "Close & Exit",
                "保存應用": "Save & Apply",
                "語言": "Language",
                "英文": "English",
                "繁體": "Traditional Chinese",
                "簡體": "Simplified Chinese",
                "日文": "Japanese",
                "韓文": "Korean",
                "俄語": "Russian",
                "圖片高度": "Image Height",
                "圖片寬度": "Image Width",
                "圖片最大寬度": "Max Image Width",
                "圖片間隔高度": "Image Spacing"
            }
        };

        return {
            IsContent: () => Content.test(Url),
            IsAnnouncement: () => Announcement.test(Url),
            IsSearch: () => Search.test(Url) || Link.test(Url) || FavorArtist.test(Url),
            IsAllPreview: () => Posts.test(Url) || User.test(Url) || Favor.test(Url),
            IsNeko: Syn.$domain.startsWith("nekohouse"), // ? 用判斷字段開頭的方式, 比判斷域名字串更為穩定

            Language() {
                const Log = Syn.gV(SaveKey.Lang);
                const ML = Syn.TranslMatcher(Word, Log);

                return {
                    Log: Log,
                    Transl: (Str) => ML[Str] ?? Str
                }
            },
            ...UserSet, Style, MenuRule, Color, SaveKey, Style_Pointer, Link, Posts, User, Favor, Search, Content, FavorArtist, Announcement
        };
    })();

    /* ==================== 配置解析 調用 ==================== */
    const Enhance = (() => {
        // 配置參數驗證 (避免使用者配置錯誤)
        const Validate = (Bool, Num) => {
            return Bool && typeof Bool === "boolean" && typeof Num === "number"
                ? true : false;
        };
        // 呼叫順序
        const Order = {
            Global: [
                "BlockAds",
                "CacheFetch",
                "SidebarCollapse",
                "DeleteNotice",
                "TextToLink",
                "FixArtist",
                "BackToTop",
                "KeyScroll"
            ],
            Preview: [
                "CardZoom",
                "CardText",
                "NewTabOpens",
                "QuickPostToggle"
            ],
            Content: [
                "LinkBeautify",
                "VideoBeautify",
                "OriginalImage",
                "ExtraButton",
                "CommentFormat",
            ],
        };
        // 懶加載函數
        const LoadFunc = {
            Global_Cache: undefined,
            Preview_Cache: undefined,
            Content_Cache: undefined,
            Global() {
                if (!this.Global_Cache) this.Global_Cache = Global_Function();
                return this.Global_Cache;
            },
            Preview() {
                if (!this.Preview_Cache) this.Preview_Cache = Preview_Function();
                return this.Preview_Cache;
            },
            Content() {
                if (!this.Content_Cache) this.Content_Cache = Content_Function();
                return this.Content_Cache;
            }
        };

        // 解析配置調用對應功能
        let Ord;
        async function Call(page, config = User_Config[page]) {
            const func = LoadFunc[page](); // 載入對應函數

            for (Ord of Order[page]) {
                const { enable, mode, ...other } = config[Ord] ?? {};

                if (Validate(enable, mode)) { // 這個驗證非必要, 但因為使用者可自行配置, 要避免可能的錯誤
                    func[Ord]?.({ mode, ...other }); // 將模式與, 可能有的其他選項, 作為 Config 傳遞
                }
            }
        }

        return {
            Run: async () => {
                Call("Global");
                if (DLL.IsAllPreview()) Call("Preview");
                else if (DLL.IsContent()) {
                    /* 就算沒開啟原圖功能, 還是需要導入 Postview (暫時寫在這) */
                    DLL.Style.Postview(); // 導入 Post 頁面樣式
                    Call("Content"); // 呼叫功能
                    MenuTrigger(); // 創建菜單
                }
            }
        }
    })();

    /* ==================== 主運行 ==================== */
    Enhance.Run();

    // 等待 DOM 更新
    const WaitDom = new MutationObserver(() => {
        WaitDom.disconnect();
        Enhance.Run();
    });

    // 監聽網址變化
    Syn.onUrlChange(change => {
        Url = change.url;
        WaitDom.observe(document, {
            attributes: true,
            childList: true,
            subtree: true,
            characterData: true
        })

        Syn.body.$sAttr("Enhance", true); // 避免沒監聽到變化
    });

    /* ==================== 全域功能 ==================== */
    function Global_Function() {
        const LoadFunc = {
            TextToLink_Cache: undefined,
            TextToLink_Dependent: function (Config) {
                if (!this.TextToLink_Cache) {
                    this.TextToLink_Cache = {
                        Exclusion_Regex: /onfanbokkusuokibalab\.net/,
                        URL_Regex: /(?:(?:https?|ftp|mailto|file|data|blob|ws|wss|ed2k|thunder):\/\/|(?:[-\w]+\.)+[a-zA-Z]{2,}(?:\/|$)|\w+@[-\w]+\.[a-zA-Z]{2,})[^\s]*?(?=[（）()「」『』【】\[\]{}、"'，。！？；：…—～~]|$|\s)/g,
                        Exclusion_Tags: new Set([
                            // 腳本和樣式
                            "SCRIPT", "STYLE", "NOSCRIPT",
                            // 多媒體元素
                            "SVG", "CANVAS", "IFRAME", "AUDIO", "VIDEO", "EMBED", "OBJECT", "SOURCE", "TRACK",
                            // 代碼和預格式化文本
                            "CODE", "KBD", "SAMP",
                            // 不可見或特殊功能元素
                            "TEMPLATE", "SLOT", "PARAM", "META", "LINK",
                            // 圖片相關
                            "IMG", "PICTURE", "FIGURE", "FIGCAPTION",
                            // 特殊交互元素
                            "MATH", "PORTAL", "METER", "PROGRESS", "OUTPUT",
                            // 表單元素
                            "TEXTAREA", "SELECT", "OPTION", "DATALIST", "FIELDSET", "LEGEND",
                            // 其他交互元素
                            "MAP", "AREA"
                        ]),
                        UrlMatch(str) {
                            // ? 使用 /g 全局匹配, 如果不重新宣告 使用 test()|exec()|match(), 沒有重設 lastIndex 會有意外狀況
                            this.URL_Regex.lastIndex = 0;
                            return this.URL_Regex.test(str);
                        },
                        getTextNodes(root) {
                            const nodes = [];
                            const tree = document.createTreeWalker(
                                root,
                                NodeFilter.SHOW_TEXT,
                                {
                                    acceptNode: (node) => {
                                        const parentElement = node.parentElement;
                                        if (!parentElement || this.Exclusion_Tags.has(parentElement.tagName)) return NodeFilter.FILTER_REJECT;

                                        const content = node.$text();
                                        if (!content || this.Exclusion_Regex.test(content)) return NodeFilter.FILTER_REJECT;
                                        return this.UrlMatch(content) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                                    }
                                }
                            );
                            while (tree.nextNode()) {
                                nodes.push(tree.currentNode.parentElement); // 回傳父節點
                            }
                            return nodes;
                        },
                        ProtocolParse(url) {
                            if (/^[a-zA-Z][\w+.-]*:\/\//.test(url) || /^[a-zA-Z][\w+.-]*:/.test(url)) return url;
                            if (/^([\w-]+\.)+[a-z]{2,}(\/|$)/i.test(url)) return "https://" + url;
                            if (/^\/\//.test(url)) return "https:" + url;
                            return url;
                        },
                        async ParseModify(father, content) { // 解析後轉換網址
                            father.$iHtml(content.replace(this.URL_Regex, url => {
                                const decode = decodeURIComponent(url).trim();
                                return `<a href="${this.ProtocolParse(decode)}">${decode}</a>`;
                            }))
                        },
                        async JumpTrigger(root) { // 將該區塊的所有 a 觸發跳轉, 改成開新分頁
                            const [Newtab, Active, Insert] = [
                                Config.newtab ?? true,
                                Config.newtab_active ?? false,
                                Config.newtab_insert ?? false,
                            ];

                            Syn.onEvent(root, "click", event => {
                                const target = event.target.closest("a:not(.fileThumb)");
                                if (!target || target.$hAttr("download")) return;
                                event.preventDefault();

                                !Newtab
                                    ? location.assign(target.href)
                                    : GM_openInTab(target.href, { active: Active, insert: Insert });
                            }, { capture: true });
                        }
                    }
                };
                return this.TextToLink_Cache;
            },
            FixArtist_Cache: undefined,
            FixArtist_Dependent: function () {
                if (!this.FixArtist_Cache) {
                    const Fix_Requ = { // 宣告修復需要的函數
                        Record_Cache: undefined, // 讀取修復紀錄 用於緩存
                        Fix_Cache: new Map(), // 修復後 用於緩存
                        Register_Eement: new Map(), // 用於存放以被註冊的元素
                        Get_Record: () => Syn.Local("fix_record_v2", { error: new Map() }),
                        async Save_Record(save) {
                            await Syn.Local("fix_record_v2",
                                {
                                    value: new Map([...this.Get_Record(), ...save]) // 取得完整數據並合併
                                }
                            );
                            this.Fix_Cache.clear();
                        },
                        Save_Work: (() => Syn.Debounce(() => Fix_Requ.Save_Record(Fix_Requ.Fix_Cache), 1000))(),
                        Fix_Name_Support: new Set(["pixiv", "fanbox"]),
                        Fix_Tag_Support: {
                            ID: /Patreon|Fantia|Pixiv|Fanbox/gi,
                            Patreon: "https://www.patreon.com/user?u={id}",
                            Fantia: "https://fantia.jp/fanclubs/{id}/posts",
                            Pixiv: "https://www.pixiv.net/users/{id}/artworks",
                            Fanbox: "https://www.pixiv.net/fanbox/creator/{id}",

                            NAME: /Fansly|OnlyFans/gi,
                            OnlyFans: "https://onlyfans.com/{name}",
                            Fansly: "https://fansly.com/{name}/posts",
                        },
                        async Fix_Request(url, headers = {}) { // 請求修復數據
                            return new Promise(resolve => {
                                GM_xmlhttpRequest({
                                    method: "GET",
                                    url: url,
                                    headers: headers,
                                    onload: response => resolve(response),
                                    onerror: () => resolve(),
                                    ontimeout: () => resolve()
                                })
                            });
                        },
                        async Get_Pixiv_Name(id) { // 取得 Pixiv 名稱
                            const response = await this.Fix_Request(
                                `https://www.pixiv.net/ajax/user/${id}?full=1&lang=ja`, { referer: "https://www.pixiv.net/" }
                            );
                            if (response.status === 200) {
                                const user = JSON.parse(response.responseText);
                                let user_name = user.body.name;
                                user_name = user_name.replace(/(c\d+)?([日月火水木金土]曜日?|[123１２３一二三]日目?)[東南西北]..?\d+\w?/i, '');
                                user_name = user_name.replace(/[@＠]?(fanbox|fantia|skeb|ファンボ|リクエスト|お?仕事|新刊|単行本|同人誌)+(.*(更新|募集|公開|開設|開始|発売|販売|委託|休止|停止)+中?[!！]?$|$)/gi, '');
                                user_name = user_name.replace(/\(\)|（）|「」|【】|[@＠_＿]+$/g, '').trim();
                                return user_name;
                            } else return;
                        },
                        Fix_Url(url) { // 連結網址修復
                            url = url.match(/\/([^\/]+)\/([^\/]+)\/([^\/]+)$/) || url.match(/\/([^\/]+)\/([^\/]+)$/); // 匹配出三段類型, 或兩段類型的格式
                            url = url.splice(1).map(url => url.replace(/\/?(www\.|\.com|\.jp|\.net|\.adult|user\?u=)/g, "")); // 排除不必要字串
                            return url.length >= 3 ? [url[0], url[2]] : url;
                        },
                        async Fix_Update_Ui(href, id, name_obj, tag_obj, text) { // 修復後更新 UI
                            /* 創建編輯按鈕 */
                            const edit = Syn.createElement("fix_edit", { id, class: "edit_artist", text: "Edit" });

                            name_obj.parentNode.insertBefore(edit, name_obj);
                            name_obj.$oHtml(`<fix_name jump="${href}">${text.trim()}</fix_name>`);

                            /* 取得支援修復的正則 */
                            const [tag_text, support_id, support_name] = [
                                tag_obj.$text(),
                                this.Fix_Tag_Support.ID,
                                this.Fix_Tag_Support.NAME
                            ];

                            if (support_id.test(tag_text)) {
                                tag_obj.$iHtml(tag_text.replace(support_id, tag => {
                                    return `<fix_tag jump="${this.Fix_Tag_Support[tag].replace("{id}", id)}">${tag}</fix_tag>`;
                                }));
                            } else if (support_name.test(tag_text)) {
                                tag_obj.$iHtml(tag_text.replace(support_name, tag => {
                                    return `<fix_tag jump="${this.Fix_Tag_Support[tag].replace("{name}", id)}">${tag}</fix_tag>`;
                                }));
                            }
                        },
                        async Fix_Trigger(object) { // 觸發修復
                            const { Url, TailId, Website, NameObject, TagObject } = object;

                            let Record = this.Record_Cache.get(TailId); // 從緩存 使用尾部 ID 取出對應紀錄

                            if (Record) {
                                this.Fix_Update_Ui(Url, TailId, NameObject, TagObject, Record);
                            } else {
                                if (this.Fix_Name_Support.has(Website)) {
                                    Record = await this.Get_Pixiv_Name(TailId) ?? NameObject.$text();
                                    this.Fix_Update_Ui(Url, TailId, NameObject, TagObject, Record);
                                    this.Fix_Cache.set(TailId, Record); // 添加數據
                                    this.Save_Work(); // 呼叫保存工作
                                } else {
                                    Record = NameObject.$text();
                                    this.Fix_Update_Ui(Url, TailId, NameObject, TagObject, Record);
                                }
                            }
                        },
                        /* ===== 前置處理觸發 ===== */
                        async Search_Fix(items) { // 針對 搜尋頁, 那種有許多用戶卡的
                            items.$sAttr("fix", true); // 添加修復標籤

                            const url = items.href;
                            const img = items.$q("img");
                            const parse = this.Fix_Url(url);

                            img.$sAttr("jump", url); // 圖片設置跳轉連結
                            items.$dAttr("href"); // 刪除原始跳轉連結

                            this.Fix_Trigger({
                                Url: url, // 跳轉連結
                                TailId: parse[1], // 尾部 id 標號
                                Website: parse[0], // 網站
                                NameObject: items.$q(".user-card__name"), // 名稱物件
                                TagObject: items.$q(".user-card__service") // 標籤物件
                            });
                        },
                        async Other_Fix(artist, tag = "", href = null, reTag = "<fix_view>") { // 針對其餘頁面的修復
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
                                    return $(reTag, { html: $(this).html() })
                                });
                            } catch {/* 防止動態監聽進行二次操作時的錯誤 (因為 DOM 已經被修改) */ }
                        },
                        async Dynamic_Fix(Listen, Element) {
                            if (this.Register_Eement.has(Listen)) return;
                            this.Register_Eement.set(Listen, true);

                            Syn.Observer(Listen, () => {
                                this.Record_Cache = this.Get_Record(); // 觸發時重新抓取
                                const element = typeof Element === "string" ? Syn.$q(Element) : Element;
                                if (element) {
                                    // 針對搜尋頁的動態監聽
                                    for (const items of element.$qa("a")) {
                                        !items.$gAttr("fix") && this.Search_Fix(items); // 沒有修復標籤的才修復
                                    }
                                }
                            }, { subtree: false, debounce: 50 });
                        }
                    }
                    Fix_Requ.Record_Cache = Fix_Requ.Get_Record(); // 初始化緩存
                    this.FixArtist_Cache = Fix_Requ;
                };
                return this.FixArtist_Cache;
            }
        }

        return {
            async SidebarCollapse(Config) { /* 收縮側邊攔 */
                if (Syn.Platform === "Mobile") return;

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
            async DeleteNotice(Config) { /* 刪除公告通知 */
                Syn.WaitElem("aside", null, { raf: true, timeout: 5 }).then(aside => aside.remove());
            },
            async BlockAds(Config) { /* (阻止/封鎖)廣告 */
                if (DLL.IsNeko) return;

                const cookieString = Syn.cookie();
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
                        Syn.cookie(`${key}=${value}; domain=.${Syn.$domain}; path=/; expires=${expires};`);
                    }
                };

                // 舊版白名單正則轉換
                // const adRegex = new RegExp("(?:" + domains.join("|").replace(/\./g, "\\.") + ")");

                if (Syn.$q("#Ad-blocking-style")) return; // ! 存在時跳過 (待測試)

                Syn.AddStyle(`
                    .root--ujvuu, [id^="ts_ad_native_"], [id^="ts_ad_video_"] {display: none !important}
                `, "Ad-blocking-style");

                const domains = new Set([
                    "go.mnaspm.com", "go.reebr.com",
                    "creative.reebr.com", "tsyndicate.com", "tsvideo.sacdnssedge.com"
                ]);

                const originalRequest = XMLHttpRequest;
                XMLHttpRequest = new Proxy(originalRequest, {
                    construct: function (target, args) {
                        const xhr = new target(...args);
                        return new Proxy(xhr, {
                            get: function (target, prop, receiver) {
                                if (prop === 'open') {
                                    return function (method, url) {
                                        try {
                                            if (typeof url !== 'string' || url.endsWith(".m3u8")) return;
                                            if ((
                                                url.startsWith('http') || url.startsWith('//')
                                            ) && domains.has(new URL(url).host)) return;
                                        } catch { }
                                        return target[prop].apply(target, arguments);
                                    };
                                }
                                return Reflect.get(target, prop, receiver);
                            }
                        })
                    }
                });
            },
            async CacheFetch(Config) { /* 緩存請求 */
                if (DLL.IsNeko) return;

                Syn.AddScript(`
                    const cache = new Map();
                    const originalFetch = window.fetch;

                    window.fetch = async function (...args) {
                        const input = args[0];
                        const options = args[1] || {};

                        const url = (typeof input === 'string') ? input : input.url;
                        const method = options.method || (typeof input === 'object' ? input.method : 'GET') || 'GET';

                        // 如果不是 GET 請求，則完全不使用快取，立即返回原始請求
                        if (method.toUpperCase() !== 'GET') {
                            return originalFetch.apply(this, args);
                        }

                        // 如果快取命中，立即返回快取中的 Response
                        if (cache.has(url)) {
                            const cached = cache.get(url);
                            return new Response(cached.body, {
                                status: cached.status,
                                headers: cached.reders
                            });
                        }

                        // 執行請求與非阻塞式快取
                        try {
                            // 等待原始請求完成
                            const response = await originalFetch.apply(this, args);

                            // 檢查是否滿足所有快取條件
                            const contentType = response.headers.get('content-type') || '';
                            if (response.status === 200 && contentType.includes('json')) {

                                // 使用一個立即執行的 async 函式 (IIFE) 來處理快取儲存。
                                (async () => {
                                    try {
                                        const responseClone = response.clone();
                                        const bodyText = await responseClone.text();

                                        // 檢查是否有實際內容
                                        if (bodyText) {
                                            const headersObject = {};
                                            responseClone.headers.forEach((value, key) => {
                                                headersObject[key] = value;
                                            });

                                            cache.set(url, {
                                                body: bodyText,
                                                status: responseClone.status,
                                                headers: headersObject
                                            });
                                        }
                                    } catch { }
                                })();
                            }

                            return response;
                        } catch (error) {
                            throw error;
                        }
                    };
                `, "Cache-Fetch", false);
            },
            async TextToLink(Config) { /* 連結文本轉連結 */
                if (!DLL.IsContent() && !DLL.IsAnnouncement()) return;

                const Func = LoadFunc.TextToLink_Dependent(Config);

                if (DLL.IsContent()) {
                    Syn.WaitElem(".post__body, .scrape__body", null).then(body => {
                        Func.JumpTrigger(body);

                        let [article, content] = [
                            body.$q("article"),
                            body.$q(".post__content, .scrape__content")
                        ];

                        if (article) {
                            let span;
                            for (span of article.$qa("span.choice-text")) {
                                Func.ParseModify(span, span.$text());
                            }

                        } else if (content) {
                            Func.getTextNodes(content).forEach(node => {
                                Func.ParseModify(node, node.$text());
                            })
                        }
                    });

                } else if (DLL.IsAnnouncement()) {
                    Syn.WaitElem(".card-list__items pre", null, { raf: true }).then(() => {
                        const items = Syn.$q(".card-list__items");

                        Func.JumpTrigger(items);
                        Func.getTextNodes(items).forEach(node => {
                            Func.ParseModify(node, node.$text());
                        });
                    })
                }
            },
            async FixArtist(Config) { /* 修復藝術家名稱 */
                DLL.Style.Global(); // 導入 Global 頁面樣式
                const Func = LoadFunc.FixArtist_Dependent();

                // 監聽點擊事件
                const [Device, Newtab, Active, Insert] = [
                    Syn.Platform,
                    Config.newtab ?? true,
                    Config.newtab_active ?? false,
                    Config.newtab_insert ?? false,
                ];

                Syn.onEvent(Syn.body, "click", event => {
                    const target = event.target;

                    if (target.matches("fix_edit")) {
                        event.stopImmediatePropagation();

                        const display = target.nextElementSibling; // 取得下方的 name 元素
                        const text = Syn.createElement("textarea", {
                            class: "edit_textarea",
                            style: `height: ${display.scrollHeight + 10}px;`,
                        });

                        const original_name = display.$text();
                        text.value = original_name.trim();
                        display.parentNode.insertBefore(text, target);

                        text.scrollTop = 0; // 滾動到最上方
                        setTimeout(() => {
                            text.focus() // 設置焦點
                            setTimeout(() => { // 避免還沒設置好焦點就觸發
                                text.on("blur", () => {
                                    const change_name = text.value.trim();
                                    if (change_name != original_name) {
                                        display.$text(change_name); // 修改顯示名
                                        Func.Save_Record(new Map([[target.id, change_name]])); // 保存修改名
                                    }
                                    text.remove();
                                }, { once: true, passive: true });
                            }, 50);
                        }, 300);
                    } else if (target.matches("fix_name") || target.matches("fix_tag") || target.matches("img.fancy-image__image")) {
                        event.stopImmediatePropagation();

                        const jump = target.$gAttr("jump");
                        if (!target.parentNode.matches("fix_cont") && jump) {
                            !Newtab || DLL.IsSearch() && Device === "Mobile"
                                ? location.assign(jump)
                                : GM_openInTab(jump, { active: Active, insert: Insert });
                        } else if (jump) { // 內容頁面
                            location.assign(jump);
                        }
                    }
                }, { capture: true, passive: true, mark: "FixArtist" });

                // 搜尋頁面, 與一些特殊預覽頁
                if (DLL.IsSearch()) {
                    Syn.WaitElem(".card-list__items", null, { raf: true, timeout: 10 }).then(card_items => {
                        if (DLL.Link.test(Url)) {
                            const artist = Syn.$q("span[itemprop='name']");
                            artist && Func.Other_Fix(artist); // 預覽頁的 名稱修復

                            for (const items of card_items.$qa("a")) { // 針對 links 頁面的 card
                                Func.Search_Fix(items);
                            }

                        } else {
                            Func.Dynamic_Fix(card_items, card_items);
                            // 這是用於避免沒觸發變更, 手動創建一個元素
                            Syn.createElement(card_items, "fix-trigger", { style: "display: none;" });
                        }
                    });

                } else if (DLL.IsContent()) { // 是內容頁面
                    Syn.WaitElem([
                        "h1 span:nth-child(2)",
                        ".post__user-name, .scrape__user-name"
                    ], null, { raf: true, timeout: 10 }).then(([title, artist]) => {
                        Func.Other_Fix(artist, title, artist.href, "<fix_cont>");
                    });

                } else { // 預覽頁面
                    Syn.WaitElem("span[itemprop='name']", null, { raf: true, timeout: 5 }).then(artist => {
                        Func.Other_Fix(artist);
                    });
                }
            },
            async BackToTop(Config) { /* 翻頁後回到頂部 */
                Syn.onEvent(Syn.body, "pointerup", event => {
                    event.target.closest("#paginator-bottom") && Syn.$q("#paginator-top").scrollIntoView();
                }, { capture: true, passive: true, mark: "BackToTop" });
            },
            async KeyScroll(Config) { /* 快捷自動滾動 */
                if (Syn.Platform === "Mobile") return;

                // 滾動配置
                const Scroll_Requ = {
                    Scroll_Pixels: 2,
                    Scroll_Interval: 800,
                };

                const UP_ScrollSpeed = Scroll_Requ.Scroll_Pixels * -1;
                let Scroll, Up_scroll = false, Down_scroll = false;

                const [TopDetected, BottomDetected] = [ // 到頂 和 到底 的檢測
                    Syn.Throttle(() => {
                        Up_scroll = Syn.sY == 0
                            ? false : true
                    }, 600),
                    Syn.Throttle(() => {
                        Down_scroll = Syn.sY + Syn.iH >= Syn.html.scrollHeight
                            ? false : true
                    }, 600)
                ];

                switch (Config.mode) {
                    case 2:
                        Scroll = (Move) => {
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
                        }
                    default:
                        Scroll = (Move) => {
                            if (Up_scroll && Move < 0) {
                                window.scrollBy(0, Move);
                                TopDetected();
                                requestAnimationFrame(() => Scroll(Move));
                            } else if (Down_scroll && Move > 0) {
                                window.scrollBy(0, Move);
                                BottomDetected();
                                requestAnimationFrame(() => Scroll(Move));
                            }
                        }
                }

                Syn.onEvent(window, "keydown", Syn.Throttle(event => {
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
                }, 100), { capture: true });
            }
        }
    };

    /* ==================== 預覽頁功能 ==================== */
    function Preview_Function() {
        return {
            async NewTabOpens(Config) { /* 將預覽頁面 開啟帖子都變成新分頁開啟 */
                const [Newtab, Active, Insert] = [
                    Config.newtab ?? true,
                    Config.newtab_active ?? false,
                    Config.newtab_insert ?? false,
                ];

                Syn.onEvent(Syn.body, "click", event => {
                    const target = event.target.closest("article a");

                    target && (
                        event.preventDefault(),
                        !Newtab
                            ? location.assign(target.href)
                            : GM_openInTab(target.href, { active: Active, insert: Insert })
                    );
                }, { capture: true, mark: "NewTabOpens" });
            },
            async QuickPostToggle(Config) { /* 預覽換頁 快速切換 (整體以性能為優先, 增加 代碼量|複雜度|緩存) */

                if (!DLL.IsNeko) return; // ! 暫時只支援 Neko

                Syn.WaitElem("menu", null, { all: true, timeout: 5 }).then(menu => {
                    DLL.IsNeko = false; // 防止重複執行

                    // 渲染
                    function Rendering({ href, className, textContent, style }) {
                        return preact.h("a", { href, className, style },
                            preact.h("b", null, textContent)
                        )
                    };

                    // 頁面內容緩存 - 帶大小限制
                    const pageContentCache = new Map();
                    const MAX_CACHE_SIZE = 30; // 最多緩存 30 頁

                    // LRU緩存清理機制
                    function cleanupCache() {
                        if (pageContentCache.size >= MAX_CACHE_SIZE) {
                            // 刪除最舊的緩存項（Map的第一個項目）
                            const firstKey = pageContentCache.keys().next().value;
                            pageContentCache.delete(firstKey);
                        }
                    };

                    // 頁面獲取 - 使用 AbortController 支持取消
                    async function fetchPage(url, abortSignal) {
                        // 檢查緩存
                        if (pageContentCache.has(url)) {
                            const cachedContent = pageContentCache.get(url);

                            // 將該項移到最後（LRU更新）
                            pageContentCache.delete(url);
                            pageContentCache.set(url, cachedContent);

                            // 複製緩存的節點
                            const clonedContent = cachedContent.cloneNode(true);
                            Syn.$q(".card-list--legacy").replaceChildren(...clonedContent.childNodes);
                            return Promise.resolve();
                        }

                        return new Promise((resolve, reject) => {
                            const request = GM_xmlhttpRequest({
                                method: "GET",
                                url,
                                onload: response => {
                                    if (abortSignal?.aborted) return reject(new Error('Aborted'));

                                    const newContent = response.responseXML.$q(".card-list--legacy");

                                    // 緩存清理
                                    cleanupCache();

                                    // 緩存內容
                                    const contentToCache = newContent.cloneNode(true);
                                    pageContentCache.set(url, contentToCache);

                                    // 應用到頁面
                                    Syn.$q(".card-list--legacy").replaceChildren(...newContent.childNodes);
                                    resolve();
                                },
                                onerror: () => reject(new Error('Network error'))
                            });

                            if (abortSignal) {
                                abortSignal.addEventListener('abort', () => {
                                    request.abort?.();
                                    reject(new Error('Aborted'));
                                });
                            }
                        });
                    };

                    const totalPages = Math.ceil(+(menu[0].previousElementSibling.$text().split("of")[1].trim()) / 50);
                    const pageLinks = [Url, ...Array(totalPages - 1).fill().map((_, i) => `${Url}?o=${(i + 1) * 50}`)];

                    const MAX_VISIBLE = 11;
                    const hasScrolling = totalPages > 11;

                    // 緩存按鈕引用和索引映射，避免重複查詢DOM
                    let buttonCache = null;
                    let pageButtonIndexMap = null;

                    // 可見範圍計算 - 緩存結果
                    let visibleRangeCache = { page: -1, range: null };
                    function getVisibleRange(currentPage) {
                        if (visibleRangeCache.page === currentPage) {
                            return visibleRangeCache.range;
                        }

                        let range;
                        if (!hasScrolling) {
                            range = { start: 1, end: totalPages };
                        } else {
                            let start = 1;
                            if (currentPage >= MAX_VISIBLE && totalPages > MAX_VISIBLE) {
                                start = currentPage - MAX_VISIBLE + 2;
                            }
                            range = { start, end: Math.min(totalPages, start + MAX_VISIBLE - 1) };
                        }

                        visibleRangeCache = { page: currentPage, range };
                        return range;
                    };

                    // 創建按鈕元素
                    function createButton(text, page, isDisabled = false, isCurrent = false, isHidden = false) {
                        return preact.h(Rendering, {
                            href: isDisabled ? undefined : pageLinks[page - 1],
                            textContent: text,
                            className: `${isDisabled ? "pagination-button-disabled" : ""} ${isCurrent ? "pagination-button-current" : ""}`.trim(),
                            style: isHidden ? { display: 'none' } : undefined
                        });
                    };

                    // 創建所有分頁元素
                    function createPaginationElements(currentPage = 1) {
                        const { start, end } = getVisibleRange(currentPage);
                        const elements = [];

                        if (hasScrolling) {
                            elements.push(createButton("<<", 1, currentPage === 1));
                        }
                        elements.push(createButton("<", currentPage - 1, currentPage === 1));

                        pageLinks.forEach((link, index) => {
                            const pageNum = index + 1;
                            const isVisible = pageNum >= start && pageNum <= end;
                            const isCurrent = pageNum === currentPage;
                            elements.push(createButton(pageNum, pageNum, isCurrent, isCurrent, !isVisible));
                        });

                        elements.push(createButton(">", currentPage + 1, currentPage === totalPages));
                        if (hasScrolling) {
                            elements.push(createButton(">>", totalPages, currentPage === totalPages));
                        }

                        return elements;
                    };

                    // 初始化按鈕緩存 - 一次性建立映射關係
                    function initializeButtonCache() {
                        const menu1Buttons = [...menu[0].$qa("a")];
                        const menu2Buttons = [...menu[1].$qa("a")];

                        const navOffset = hasScrolling ? 2 : 1;

                        buttonCache = {
                            menu1: {
                                all: menu1Buttons,
                                nav: {
                                    first: hasScrolling ? menu1Buttons[0] : null,
                                    prev: menu1Buttons[hasScrolling ? 1 : 0],
                                    next: menu1Buttons[menu1Buttons.length - (hasScrolling ? 2 : 1)],
                                    last: hasScrolling ? menu1Buttons[menu1Buttons.length - 1] : null
                                },
                                pages: menu1Buttons.slice(navOffset, menu1Buttons.length - navOffset)
                            },
                            menu2: {
                                all: menu2Buttons,
                                nav: {
                                    first: hasScrolling ? menu2Buttons[0] : null,
                                    prev: menu2Buttons[hasScrolling ? 1 : 0],
                                    next: menu2Buttons[menu2Buttons.length - (hasScrolling ? 2 : 1)],
                                    last: hasScrolling ? menu2Buttons[menu2Buttons.length - 1] : null
                                },
                                pages: menu2Buttons.slice(navOffset, menu2Buttons.length - navOffset)
                            }
                        };

                        // 建立頁碼到按鈕索引的映射 - O(1) 查找
                        pageButtonIndexMap = new Map();
                        buttonCache.menu1.pages.forEach((btn, index) => {
                            const pageNum = index + 1;
                            pageButtonIndexMap.set(pageNum, index);
                        });
                    };

                    // 批量DOM更新 - 最小化重排重繪
                    function updateNavigationButtons(menuData, targetPage) {
                        const isFirstPage = targetPage === 1;
                        const isLastPage = targetPage === totalPages;
                        const { nav } = menuData;

                        // 批量更新導航按鈕狀態
                        const navUpdates = [];

                        if (hasScrolling) {
                            navUpdates.push(
                                [nav.first, isFirstPage, pageLinks[0]],
                                [nav.prev, isFirstPage, pageLinks[targetPage - 2]],
                                [nav.next, isLastPage, pageLinks[targetPage]],
                                [nav.last, isLastPage, pageLinks[totalPages - 1]]
                            );
                        } else {
                            navUpdates.push(
                                [nav.prev, isFirstPage, pageLinks[targetPage - 2]],
                                [nav.next, isLastPage, pageLinks[targetPage]]
                            );
                        }

                        // 批量應用更新 - 減少DOM操作次數
                        navUpdates.forEach(([btn, isDisabled, href]) => {
                            btn.$toggleClass("pagination-button-disabled", isDisabled);
                            if (isDisabled) {
                                btn.$dAttr('href');
                            } else {
                                btn.href = href;
                            }
                        });
                    };

                    // 頁碼按鈕更新 - 只更新變化的部分
                    function updatePageButtons(menuData, targetPage, visibleRange) {
                        const { start, end } = visibleRange;
                        const { pages } = menuData;

                        // 找到當前活動按鈕並清除狀態 - O(1) 查找
                        const currentActiveBtn = pages.find(btn => btn.classList.contains("pagination-button-current"));
                        if (currentActiveBtn) {
                            currentActiveBtn.$delClass("pagination-button-current", "pagination-button-disabled");
                        }

                        // 批量處理可見性和狀態 - 預計算範圍
                        const startIndex = Math.max(0, start - 1);
                        const endIndex = Math.min(pages.length - 1, end - 1);

                        // 隱藏範圍外的按鈕
                        for (let i = 0; i < startIndex; i++) {
                            pages[i].style.display = 'none';
                        }
                        for (let i = endIndex + 1; i < pages.length; i++) {
                            pages[i].style.display = 'none';
                        }

                        // 顯示範圍內的按鈕並設置狀態
                        for (let i = startIndex; i <= endIndex; i++) {
                            const btn = pages[i];
                            const pageNum = i + 1;

                            btn.style.display = '';
                            if (pageNum === targetPage) {
                                btn.$addClass("pagination-button-current", "pagination-button-disabled");
                            }
                        }
                    };

                    // 主更新函數 - 使用緩存避免DOM查詢
                    function updatePagination(targetPage) {
                        const visibleRange = getVisibleRange(targetPage);

                        // 並行更新兩個菜單 - 利用緩存的按鈕引用
                        updateNavigationButtons(buttonCache.menu1, targetPage);
                        updateNavigationButtons(buttonCache.menu2, targetPage);
                        updatePageButtons(buttonCache.menu1, targetPage, visibleRange);
                        updatePageButtons(buttonCache.menu2, targetPage, visibleRange);
                    };

                    // 目標頁碼解析 - 預編譯查找表
                    const navigationActions = {
                        "<<": () => 1,
                        ">>": () => totalPages,
                        "<": (current) => current > 1 ? current - 1 : null,
                        ">": (current) => current < totalPages ? current + 1 : null
                    };

                    function parseTargetPage(clickText, currentPage) {
                        const clickedNum = parseInt(clickText);
                        if (!isNaN(clickedNum)) return clickedNum;

                        const action = navigationActions[clickText];
                        return action ? action(currentPage) : null;
                    };

                    // 初始化渲染
                    const elements = createPaginationElements(1);
                    const [fragment1, fragment2] = [Syn.createFragment, Syn.createFragment];

                    preact.render([...elements], fragment1);
                    preact.render([...elements], fragment2);

                    menu[0].replaceChildren(fragment1);
                    menu[0].$sAttr("QuickPostToggle", "true");

                    requestAnimationFrame(() => {
                        menu[1].replaceChildren(fragment2);
                        menu[1].$sAttr("QuickPostToggle", "true");

                        // 初始化完成後建立緩存
                        initializeButtonCache();
                    });

                    // 事件處理 - 減少查詢和計算
                    let isLoading = false;
                    let abortController = null;

                    Syn.onEvent("section", "click", async event => {
                        const target = event.target.closest("menu a:not(.pagination-button-disabled)");
                        if (!target || isLoading) return;

                        event.preventDefault();

                        // 取消之前的請求
                        if (abortController) {
                            abortController.abort();
                        }
                        abortController = new AbortController();

                        // 使用緩存快速獲取當前頁 - 避免DOM查詢
                        const currentActiveBtn = target.closest("menu").$q(".pagination-button-current");
                        const currentPage = parseInt(currentActiveBtn.$text());
                        const targetPage = parseTargetPage(target.$text(), currentPage);

                        if (!targetPage || targetPage === currentPage) return;

                        isLoading = true;

                        try {
                            // 並行執行頁面獲取和UI更新
                            await Promise.all([
                                fetchPage(pageLinks[targetPage - 1], abortController.signal),
                                new Promise(resolve => {
                                    updatePagination(targetPage);
                                    requestAnimationFrame(() => {
                                        history.pushState(null, null, pageLinks[targetPage - 1]);
                                        resolve();
                                    });
                                })
                            ]);
                        } catch (error) {
                            if (error.message !== 'Aborted') {
                                console.error('Page fetch failed:', error);
                            }
                        } finally {
                            isLoading = false;
                            abortController = null;
                        }
                    }, { capture: true, mark: "QuickPostToggle" });
                });
            },
            async CardZoom(Config) { /* 帖子預覽卡縮放效果 */
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
                            .post-card { margin: .3vw; }
                            .post-card a img { border-radius: 8px; }
                            .post-card a {
                                border-radius: 8px;
                                border: 3px solid #fff6;
                                transition: transform 0.4s;
                            }
                            .card-list--legacy * { --card-size: 13vw; }
                        `, "CardZoom_Effects", false);
                }
            },
            async CardText(Config) { /* 帖子說明文字效果 */
                if (Syn.Platform === "Mobile") return;

                switch (Config.mode) {
                    case 2:
                        Syn.AddStyle(`
                            .post-card__header, .post-card__footer {
                                opacity: 0.4 !important;
                                transition: opacity 0.3s;
                            }
                            a:hover .post-card__header,
                            a:hover .post-card__footer {
                                opacity: 1 !important;
                            }
                        `, "CardText_Effects_2", false); break;
                    default:
                        Syn.AddStyle(`
                            .post-card__header, .post-card__footer {
                                opacity: 0 !important;
                                z-index: 1;
                                padding: 5px;
                                pointer-events: none;
                                transform: translateY(-6vh);
                            }
                            a:hover .post-card__header,
                            a:hover .post-card__footer {
                                opacity: 1 !important;
                                pointer-events: auto;
                                transform: translateY(0vh);
                                transition: transform 0.4s, opacity 0.6s;
                            }
                        `, "CardText_Effects", false);
                }
            }
        }
    };

    /* ==================== 內容頁功能 ==================== */
    function Content_Function() {
        const LoadFunc = {
            LinkBeautify_Cache: undefined,
            LinkBeautify_Dependent() {
                if (!this.LinkBeautify_Cache) {
                    this.LinkBeautify_Cache = async function ShowBrowse(Browse) {
                        const URL = DLL.IsNeko ? Browse.href : Browse.href.replace("posts/archives", "api/v1/file"); // 根據站點修改 API

                        // 初始化
                        Browse.style.position = "relative"; // 修改樣式避免跑版
                        Browse.$q(".View")?.remove(); // 查找是否存在 View 元素, 先將其刪除

                        GM_xmlhttpRequest({
                            method: "GET",
                            url: URL,
                            onload: response => {
                                if (DLL.IsNeko) {
                                    const Main = response.responseXML.$q("main");
                                    const View = Syn.createElement("View", { class: "View" });
                                    const Buffer = Syn.createFragment;
                                    for (const br of Main.$qa("br")) { // 取得 br 數據
                                        Buffer.append( // 將以下元素都添加到 Buffer
                                            document.createTextNode(br.previousSibling.$text()),
                                            br
                                        );
                                    }
                                    View.appendChild(Buffer);
                                    Browse.appendChild(View);
                                } else {
                                    const ResponseJson = JSON.parse(response.responseText);
                                    const View = Syn.createElement("View", { class: "View" });
                                    const Buffer = Syn.createFragment;

                                    // 添加密碼數據
                                    const password = ResponseJson['password'];
                                    if (password) {
                                        Buffer.append(
                                            document.createTextNode(`password: ${password}`),
                                            Syn.createElement("br")
                                        )
                                    };

                                    // 添加檔案數據
                                    for (const text of ResponseJson['file_list']) {
                                        Buffer.append(
                                            document.createTextNode(text), Syn.createElement("br")
                                        )
                                    };

                                    View.appendChild(Buffer);
                                    Browse.appendChild(View);
                                }
                            },
                            onerror: error => { ShowBrowse(Browse) }
                        });
                    }
                };
                return this.LinkBeautify_Cache;
            },
            ExtraButton_Cache: undefined,
            ExtraButton_Dependent() {
                // ! 這個函數目前只有 nekohouse 需要
                if (!this.ExtraButton_Cache) {
                    this.ExtraButton_Cache = async function GetNextPage(url, old_main) {
                        GM_xmlhttpRequest({
                            method: "GET",
                            url: url,
                            nocache: false,
                            onload: response => {
                                const XML = response.responseXML;
                                const Main = XML.$q("main");
                                old_main.replaceChildren(...Main.childNodes);

                                history.pushState(null, null, url); // 修改連結與紀錄
                                const Title = XML.$q("title")?.$text();
                                Title && (Syn.title(Title)); // 修改標題

                                setTimeout(() => {
                                    Syn.WaitElem(".post__content, .scrape__content", null, { raf: true, timeout: 10 }).then(post => {
                                        // 刪除所有只有 br 標籤的元素
                                        post.$qa("p").forEach(p => {
                                            p.childNodes.forEach(node => { node.nodeName == "BR" && node.parentNode.remove() });
                                        });

                                        // 刪除所有是圖片連結的 a
                                        post.$qa("a").forEach(a => {
                                            /\.(jpg|jpeg|png|gif)$/i.test(a.href) && a.remove()
                                        });
                                    });

                                    Syn.$q(".post__title, .scrape__title").scrollIntoView(); // 滾動到上方
                                }, 300);
                            },
                            onerror: error => { GetNextPage(url, old_main) }
                        });
                    }
                };
                return this.ExtraButton_Cache;
            }
        }

        return {
            async LinkBeautify(Config) { /* 懸浮於 browse » 標籤時, 直接展示文件, 刪除下載連結前的 download 字樣, 並解析轉換連結 */
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

                Syn.WaitElem(".post__attachment-link, .scrape__attachment-link", null, { raf: true, all: true, timeout: 5 }).then(post => {
                    const ShowBrowse = LoadFunc.LinkBeautify_Dependent();

                    for (const link of post) {
                        const text = link.$text().replace("Download", ""); // 修正原文本

                        link.$text(text); // 修改文本
                        DLL.IsNeko && link.$sAttr("download", text); // ? 修改標籤 (非 Neko 的網站修改標籤會導致 AJAX 換頁時意外無法變更)

                        const Browse = link.nextElementSibling; // 查找是否含有 Browse 元素
                        if (!Browse) continue;

                        ShowBrowse(Browse); // 請求顯示 Browse 數據
                    }
                });
            },
            async VideoBeautify(Config) { /* 調整影片區塊大小, 將影片名稱轉換成下載連結 */
                if (DLL.IsNeko) {
                    Syn.WaitElem(".scrape__files video", null, { raf: true, all: true, timeout: 5 }).then(video => {
                        video.forEach(media => media.$sAttr("preload", "metadata"));
                    });
                } else {
                    Syn.WaitElem("ul[style*='text-align: center; list-style-type: none;'] li:not([id])", null, { raf: true, all: true, timeout: 5 }).then(parents => {
                        Syn.WaitElem(".post__attachment-link, .scrape__attachment-link", null, { raf: true, all: true, timeout: 5 }).then(post => {

                            Syn.AddStyle(`
                                .fluid_video_wrapper {
                                    height: 50% !important;
                                    width: 65% !important;
                                    border-radius: 8px !important;
                                }
                            `, "Video_Effects", false);

                            const move = Config.mode === 2;
                            const linkBox = Object.fromEntries([...post].map(a => {
                                const data = [a.download?.trim(), a];

                                return data;
                            }));

                            for (const li of parents) {

                                const WaitLoad = new MutationObserver(Syn.Debounce(() => {
                                    WaitLoad.disconnect();

                                    let [video, summary] = [
                                        li.$q("video"),
                                        li.$q("summary"),
                                    ];

                                    if (!video || !summary) return;

                                    video.$sAttr("preload", "metadata"); // 預載影片元數據

                                    const link = linkBox[summary.$text()]; // 查找對應下載連結
                                    if (!link) return;

                                    move && link.parentNode.remove(); // 刪除對應下載連結
                                    let element = link.$copy();
                                    element.$text(element.$text().replace("Download", "")); // 修改載入連結

                                    summary.$text("");
                                    summary.appendChild(element);
                                }, 100));

                                // 監聽動態變化
                                WaitLoad.observe(li, { attributes: true, characterData: true, childList: true, subtree: true });
                                li.$sAttr("Video-Beautify", true); // 容錯 (避免沒有監聽到動態變化)
                            };

                        })
                    });
                }
            },
            async OriginalImage(Config) { /* 自動載入原圖 */
                Syn.WaitElem(".post__thumbnail, .scrape__thumbnail", null, { raf: true, all: true, timeout: 5 }).then(thumbnail => {
                    /**
                     * 針對 Neko 網站的支援
                     */
                    const LinkObj = DLL.IsNeko ? "div" : "a";
                    const HrefParse = (element) => element.href || element.$gAttr("href");

                    /**
                     * ! 目前有 Bug, 載入回條怪怪的不準確, 已經載入但觸發 onerror 又重載, 還無限遞迴
                     * 這邊的邏輯, 因為是有延遲運行, 如果還在運行當中,
                     * 頁面被 ExtraButton 的功能進行換頁, 就會出現報錯, 但我懶的處理
                     *
                     * 另外這邊不使用 LoadFunc 懶加載的方式, 也是因為當 ExtraButton 換頁, 先前的函數還沒運行完成
                     * 再次添加新的數據, 會有各種神奇的錯誤, 所以只能每次重新宣告
                     */
                    const Origina_Requ = { // 自動原圖所需
                        Reload: async (Img, Retry) => { // 載入原圖 (死圖重試)
                            if (Retry > 0) {
                                setTimeout(() => {
                                    const src = Img?.src;
                                    if (!src) return;

                                    Img.src = "";
                                    Object.assign(Img, {
                                        src: src,
                                        alt: "Loading Failed"
                                    });
                                    Img.onload = function () { Img.$delClass("Image-loading-indicator") };
                                    Img.onerror = function () { Origina_Requ.Reload(Img, --Retry) };
                                }, 3000); // 降低載入頻率
                            }
                        },
                        FailedClick: async () => {
                            //! 監聽點擊事件 當點擊的是載入失敗的圖片才觸發 (目前也壞了, 感覺觸發不了)
                            Syn.one(".post__files, .scrape__files", "click", event => {
                                const target = event.target.matches(".Image-link img");
                                if (target && target.alt == "Loading Failed") {
                                    const src = img.src;
                                    img.src = "";
                                    img.src = src;
                                }
                            }, { capture: true, passive: true });
                        },
                        /**
                         * 渲染圖像
                         *
                         * @param {Object} { ID, Ourl, Nurl }
                         * ID 用於標示用的
                         * Ourl 原始連結, 當 Nurl 並非原始連結, 可以傳遞該參數保留原始數據 (預設: null)
                         * Nurl 用於渲染圖片的新連結
                         */
                        ImgRendering: ({ ID, Ourl = null, Nurl }) => {
                            return preact.h((Ourl ? "rc" : "div"), {
                                id: ID,
                                src: Ourl,
                                className: "Image-link"
                            },
                                preact.h("img", {
                                    key: "img",
                                    src: Nurl,
                                    className: "Image-loading-indicator Image-style",
                                    onLoad: function () {
                                        Syn.$q(`#${ID} img`)?.$delClass("Image-loading-indicator");
                                    },
                                    onError: function () {
                                        Origina_Requ.Reload(Syn.$q(`#${ID} img`), 10);
                                    }
                                })
                            )
                        },
                        /**
                         * 用於請求圖片數據為 blob 連結
                         *
                         * @param {Object} { Container, Url, Result }
                         * Container 用於標示進度用的容器
                         * Url 請求的圖片連結
                         * Result 回傳圖片連結
                         */
                        Request: async function (Container, Url, Result) {
                            const indicator = Syn.createElement(Container, "div", { class: "progress-indicator", text: "0%" });

                            GM_xmlhttpRequest({
                                url: Url,
                                method: "GET",
                                responseType: "blob",
                                onprogress: progress => {
                                    const done = ((progress.done / progress.total) * 100).toFixed(1);
                                    indicator.$text(`${done}%`);
                                },
                                onload: response => {
                                    const blob = response.response;
                                    blob instanceof Blob && blob.size > 0
                                        ? Result(URL.createObjectURL(blob)) : Result(Url);
                                },
                                onerror: () => Result(Url)
                            })
                        },
                        FastAuto: async function () { // mode 1 預設 (快速自動)
                            this.FailedClick();
                            thumbnail.forEach((object, index) => {
                                requestIdleCallback(() => {
                                    object.$dAttr("class");

                                    const a = object.$q(LinkObj);
                                    const hrefP = HrefParse(a);

                                    if (Config.experiment) {
                                        a.$q("img").$addClass("Image-loading-indicator-experiment");

                                        this.Request(object, hrefP, href => {
                                            render(preact.h(this.ImgRendering, { ID: `IMG-${index}`, Ourl: hrefP, Nurl: href }), object);
                                        });
                                    } else {
                                        render(preact.h(this.ImgRendering, { ID: `IMG-${index}`, Nurl: hrefP }), object);
                                    }
                                }, { timeout: index * 300 });
                            });
                        },
                        SlowAuto: async function (index) {
                            if (index == thumbnail.length) return;
                            const object = thumbnail[index];
                            object.$dAttr("class");

                            const a = object.$q(LinkObj);
                            const hrefP = HrefParse(a);

                            const img = a.$q("img");

                            const replace_core = (Nurl, Ourl = null) => {

                                const container = document.createElement((Ourl ? "rc" : "div"));
                                Ourl && container.$sAttr("src", Ourl); // 當存在時進行設置

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
                                    img.$delClass("Image-loading-indicator");
                                    Origina_Requ.SlowAuto(++index);
                                };

                                object.$iHtml(""); // 清空物件元素
                                container.appendChild(img);
                                object.appendChild(container);
                            };

                            if (Config.experiment) { // 替換調用
                                img.$addClass("Image-loading-indicator-experiment");

                                this.Request(object, hrefP, href => replace_core(href, hrefP));
                            } else {
                                replace_core(hrefP);
                            }
                        },
                        ObserveTrigger: function () { // mode 3 (觀察觸發)
                            this.FailedClick();
                            return new IntersectionObserver(observed => {
                                observed.forEach(entry => {
                                    if (entry.isIntersecting) {
                                        const object = entry.target;
                                        observer.unobserve(object);
                                        object.$dAttr("class");

                                        const a = object.$q(LinkObj);
                                        const hrefP = HrefParse(a);

                                        if (Config.experiment) {
                                            a.$q("img").$addClass("Image-loading-indicator-experiment");

                                            this.Request(object, hrefP, href => {
                                                render(preact.h(this.ImgRendering, { ID: object.alt, Ourl: hrefP, Nurl: href }), object);
                                            });
                                        } else {
                                            render(preact.h(this.ImgRendering, { ID: object.alt, Nurl: hrefP }), object);
                                        }
                                    }
                                });
                            }, { threshold: 0.3 });
                        }
                    };

                    /* 模式選擇 */
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
            async ExtraButton(Config) { /* 下方額外擴充按鈕 */
                DLL.Style.PostExtra(); // 導入需求樣式
                const GetNextPage = LoadFunc.ExtraButton_Dependent();
                Syn.WaitElem("h2.site-section__subheading", null, { raf: true, timeout: 5 }).then(comments => {

                    const [Prev, Next, Svg, Span, Buffer] = [
                        Syn.$q(".post__nav-link.prev, .scrape__nav-link.prev"),
                        Syn.$q(".post__nav-link.next, .scrape__nav-link.next"),
                        document.createElement("svg"),
                        document.createElement("span"),
                        Syn.createFragment
                    ];

                    Svg.id = "To_top";
                    Svg.$iHtml(`
                        <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512" style="margin-left: 10px;cursor: pointer;">
                            <style>svg{fill: ${DLL.Color}}</style>
                            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM135.1 217.4l107.1-99.9c3.8-3.5 8.7-5.5 13.8-5.5s10.1 2 13.8 5.5l107.1 99.9c4.5 4.2 7.1 10.1 7.1 16.3c0 12.3-10 22.3-22.3 22.3H304v96c0 17.7-14.3 32-32 32H240c-17.7 0-32-14.3-32-32V256H150.3C138 256 128 246 128 233.7c0-6.2 2.6-12.1 7.1-16.3z"></path>
                        </svg>
                    `);

                    const Next_btn = Next?.$copy(true) ?? document.createElement("div");
                    Next_btn.style = `color: ${DLL.Color};`;
                    Next_btn.$sAttr("jump", Next_btn.href);
                    Next_btn.$dAttr("href");

                    Span.id = "Next_box";
                    Span.style = "float: right; cursor: pointer;";
                    Span.appendChild(Next_btn);

                    // 點擊回到上方的按鈕
                    Syn.one(Svg, "click", () => {
                        Syn.$q("header").scrollIntoView();
                    }, { capture: true, passive: true });

                    // 點擊切換下一頁按鈕
                    Syn.one(Next_btn, "click", () => {
                        if (DLL.IsNeko) {
                            GetNextPage(
                                Next_btn.$gAttr("jump"),
                                Syn.$q("main")
                            );
                        } else {
                            Svg.remove();
                            Span.remove();
                            Next.click();
                        }
                    }, { capture: true, once: true });

                    // 避免多次創建 Bug
                    if (!Syn.$q("#To_top") && !Syn.$q("#Next_box")) {
                        Buffer.append(Svg, Span);
                        comments.appendChild(Buffer);
                    }

                });
            },
            async CommentFormat(Config) { /* 評論區 重新排版 */
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
        }
    };

    /* ==================== 設置菜單 ==================== */
    async function $on(element, type, listener) { $(element).on(type, listener) };
    async function MenuTrigger(callback = null) {
        const { Log, Transl } = DLL.Language(); // 菜單觸發器, 每次創建都會獲取新數據

        callback && callback({ Log, Transl }); // 使用 callback 會額外回傳數據
        Syn.Menu({ [Transl("📝 設置選單")]: () => Create_Menu(Log, Transl) });
    }
    function Create_Menu(Log, Transl) {
        const shadowID = "shadow";
        if (Syn.$q(`#${shadowID}`)) return;

        // 取得設置
        const set = DLL.ImgSet();
        const img_data = [set.Height, set.Width, set.MaxWidth, set.Spacing]; // 這樣寫是為了讓讀取保存設置可以按照順序 (菜單有索引問題)

        let analyze, parent, child, img_set, img_input, img_select, set_value, save_cache = {};

        // 取得樣式依賴
        const { ImgScript, MenuStyle } = DLL.Style.Menu();

        // 創建陰影環境
        const fragment = Syn.createFragment;
        const shadow = Syn.createElement("div", { id: shadowID });
        const shadowRoot = shadow.attachShadow({ mode: "open" });
        const script = Syn.createElement("script", { id: "Img-Script", text: ImgScript });
        const style = Syn.createElement("style", { id: "Menu-Style", text: MenuStyle });

        // 調整選項
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

        // 添加菜單樣式
        shadowRoot.$iHtml(`
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

        fragment.append(script, style);
        shadowRoot.appendChild(fragment);

        // 添加到 dom, 並緩存對象
        $(Syn.body).append(shadow);
        const $language = $(shadowRoot).find("#language");
        const $readset = $(shadowRoot).find("#readsettings");
        const $interface = $(shadowRoot).find(".modal-interface");
        const $background = $(shadowRoot).find(".modal-background");
        const $imageSet = $(shadowRoot).find("#image-settings-show");

        $language.val(Log ?? "en-US"); // 添加語言設置
        $interface.draggable({ cursor: "grabbing" }); // 添加可拖動效果
        DLL.MenuRule = $(shadowRoot).find("#Menu-Style").prop("sheet")?.cssRules;

        // 菜單調整依賴
        const Menu_Requ = {
            Menu_Close() { // 關閉菜單
                $background?.off();
                shadow.remove();
            },
            Menu_Save() { // 保存菜單
                const top = $interface.css("top");
                const left = $interface.css("left");
                Syn.sV(DLL.SaveKey.Menu, { Top: top, Left: left }); // 保存設置數據
            },
            Img_Save() {
                img_set = $imageSet.find("p"); // 獲取設定 DOM 參數
                img_data.forEach((read, index) => {
                    img_input = img_set.eq(index).find("input");
                    img_select = img_set.eq(index).find("select");
                    if (img_select.val() == "auto") { set_value = "auto" }
                    else if (img_input.val() == "") { set_value = read }
                    else { set_value = `${img_input.val()}${img_select.val()}` }
                    save_cache[img_input.attr("id")] = set_value;
                });
                Syn.sV(DLL.SaveKey.Img, save_cache); // 保存設置數據
            },
            async ImageSettings() {
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

        // 語言選擇
        $on($language, "input change", function (event) {
            event.stopPropagation();
            $language.off("input change");

            const value = $(this).val(); // 取得選擇
            Syn.sV(DLL.SaveKey.Lang, value);

            Menu_Requ.Menu_Save();
            Menu_Requ.Menu_Close();

            MenuTrigger(Updata => {
                Create_Menu(Updata.Log, Updata.Transl); // 重新創建
            });
        });
        // 監聽菜單的點擊事件
        $on($interface, "click", function (event) {
            const id = $(event.target).attr("id");

            // 菜單功能選擇
            if (id == "image-settings") {
                img_set = $imageSet;
                if (img_set.css("opacity") === "0") {
                    img_set.find("p").each(function () {
                        $(this).append(UnitOptions);
                    });
                    img_set.css({
                        "height": "auto",
                        "width": "auto",
                        "opacity": 1
                    });
                    $readset.prop("disabled", false); // 點擊圖片設定才會解鎖讀取設置
                    Menu_Requ.ImageSettings();
                }

                // 讀取保存設置
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
                })

                // 應用保存
            } else if (id == "application") {
                Menu_Requ.Img_Save();
                Menu_Requ.Menu_Save();
                Menu_Requ.Menu_Close();
            } else if (id == "closure") {
                Menu_Requ.Menu_Close();
            }
        });
    };

    /* ==================== 額外封裝函數 ==================== */

    // 透過 $iHtml() 實現 react 的覆蓋渲染
    function render(element, container) {
        container.$iHtml(""); // 雖然這樣性能不是最好的, 但通用性最高
        preact.render(element, container);
    }
})();