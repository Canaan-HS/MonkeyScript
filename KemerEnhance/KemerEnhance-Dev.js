// ==UserScript==
// @name         Kemer Enhance
// @name:zh-TW   Kemer 增強
// @name:zh-CN   Kemer 增强
// @name:ja      Kemer 強化
// @name:ko      Kemer 강화
// @name:ru      Kemer Улучшение
// @name:en      Kemer Enhance
// @version      2025.09.26-Beta1
// @author       Canaan HS
// @description        美化介面與操作增強，增加額外功能，提供更好的使用體驗
// @description:zh-TW  美化介面與操作增強，增加額外功能，提供更好的使用體驗
// @description:zh-CN  美化界面与操作增强，增加额外功能，提供更好的使用体验
// @description:ja     インターフェースを美化し操作を強化、追加機能により、より良い使用体験を提供します
// @description:ko     인터페이스를 미화하고 조작을 강화하며, 추가 기능을 통해 더 나은 사용 경험을 제공합니다
// @description:ru     Улучшение интерфейса и функций управления, добавление дополнительных возможностей для лучшего опыта использования
// @description:en     Beautify interface and enhance operations, add extra features, and provide a better user experience

// @connect      *
// @match        *://kemono.cr/*
// @match        *://coomer.st/*
// @match        *://nekohouse.su/*

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635
// @supportURL   https://github.com/Canaan-HS/MonkeyScript/issues
// @icon         https://cdn-icons-png.flaticon.com/512/2566/2566449.png

// @resource     pako https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js

// @require      https://update.greasyfork.org/scripts/487608/1674922/SyntaxLite_min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/preact/10.27.1/preact.umd.min.js

// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        window.onurlchange
// @grant        GM_registerMenuCommand
// @grant        GM_addValueChangeListener

// @run-at       document-body
// ==/UserScript==

(async () => {
    /* Data type checks are removed in user configuration; providing incorrect input may cause it to break */
    const User_Config = {
        Global: {
            BlockAds: true, // 阻擋廣告
            CacheFetch: true, // 緩存 Fetch 請求 (僅限 JSON)
            DeleteNotice: true, // 刪除上方公告
            SidebarCollapse: true, // 側邊攔摺疊
            KeyScroll: { mode: 1, enable: true }, // 上下鍵觸發自動滾動 [mode: 1 = 動畫偵滾動, mode: 2 = 間隔滾動] (選擇對於自己較順暢的)
            TextToLink: { // 連結的 (文本 -> 超連結)
                enable: true,
                newtab: true, // 新選項卡開啟
                newtab_active: false, // 切換焦點到新選項卡
                newtab_insert: true, // 選項卡插入到當前選項卡的正後方
            },
            BetterPostCard: { // 修復名稱|自訂名稱|外部TAG跳轉|快速預覽內容
                enable: true,
                newtab: true,
                newtab_active: true,
                newtab_insert: true,
                previewAbove: true, // 快速預覽展示於帖子上方
            },
        },
        Preview: {
            CardZoom: { mode: 3, enable: true }, // 縮放預覽卡大小 [mode: 1 = 卡片放大 , 2 = 卡片放大 + 懸浮縮放, 3 = 卡片放大 + 自動縮放]
            CardText: { mode: 2, enable: true }, // 預覽卡文字效果 [mode: 1 = 隱藏文字 , 2 = 淡化文字]
            BetterThumbnail: true, // 替換成內頁縮圖 , 與文件類型直接顯示 (nekohouse 某些不支援)
            QuickPostToggle: true, // 快速切換帖子 (僅支援 nekohouse)
            NewTabOpens: { // 預覽頁面的帖子都以新分頁開啟
                enable: true,
                newtab_active: false,
                newtab_insert: true,
            },
        },
        Content: {
            ExtraButton: true, // 額外的下方按鈕
            LinkBeautify: true, // 下載連結美化, 當出現 (browse »), 滑鼠懸浮會直接顯示內容, 並移除多餘的字串
            CommentFormat: true, // 評論區重新排版
            VideoBeautify: { mode: 1, enable: true }, // 影片美化 [mode: 1 = 複製下載節點 , 2 = 移動下載節點]
            OriginalImage: { // 自動原圖 [mode: 1 = 快速自動 , 2 = 慢速自動 , 3 = 觀察後觸發]
                mode: 1,
                enable: true,
                experiment: false, // 實驗性替換方式
            }
        }
    };

    /* ==================== 依賴項目 ==================== */
    let Url = Lib.$url; // 全局變化
    const DB = await Lib.openDB("KemerEnhanceDB", 1, GM_getResourceText("pako"));
    const DLL = (() => {
        // 所需樣式 (需要傳入顏色的, 就是需要動態適應顏色變化)
        const color = {
            "kemono": "#e8a17d !important",
            "coomer": "#99ddff !important",
            "nekohouse": "#bb91ff !important"
        }[Lib.$domain.split(".")[0]];

        const saveKey = { Img: "ImgStyle", Lang: "Language", Menu: "MenuPoint" };
        // 導入使用者設定
        const userSet = {
            menuSet: () => Lib.getV(saveKey.Menu, {
                Top: "10vh",
                Left: "10vw"
            }),
            imgSet: () => Lib.getV(saveKey.Img, {
                Width: "auto",
                Height: "auto",
                Spacing: "0px",
                MaxWidth: "100%",
            })
        };

        // 動態調整圖片樣式
        let imgRule, menuRule;
        const importantStyle = (element, property, value) => {
            requestAnimationFrame(() => {
                element.style.setProperty(property, value, "important");
            })
        };
        const normalStyle = (element, property, value) => {
            requestAnimationFrame(() => {
                element.style[property] = value;
            });
        };
        const stylePointer = {
            Top: value => normalStyle(menuRule[1], "top", value),
            Left: value => normalStyle(menuRule[1], "left", value),
            Width: value => importantStyle(imgRule[1], "width", value),
            Height: value => importantStyle(imgRule[1], "height", value),
            MaxWidth: value => importantStyle(imgRule[1], "max-width", value),
            Spacing: value => importantStyle(imgRule[1], "margin", `${value} auto`)
        };

        // 功能依賴樣式
        const style = {
            get getGlobal() { // 全域 修復所需
                Lib.addStyle(`
                    /* 搜尋頁面的樣式 */
                    fix_tag:hover { color: ${color}; }
                    .card-list__items a:not(article a) {
                        cursor: default;
                    }
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
                        display: block;
                        padding: .25rem .1rem;
                        border-radius: .25rem;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                    }
                    fix_edit {
                        top: 85px;
                        right: 8%;
                        color: #fff;
                        display: none;
                        z-index: 9999;
                        font-size: 1.1rem;
                        font-weight: 700;
                        position: absolute;
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
                    .user-card:hover fix_edit {
                        display: block;
                    }
                    .user-card:hover fix_name {
                        background-color: ${color};
                    }
                    .edit_textarea ~ fix_name,
                    .edit_textarea ~ fix_edit {
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
                    fix_view fix_edit {
                        top: 65px;
                        right: 5%;
                        transform: translateY(-80%);
                    }
                    fix_view:hover fix_name {
                        background-color: ${color};
                    }
                    fix_view:hover fix_edit {
                        display: block;
                    }

                    /* 內容頁面的樣式 */
                    fix_cont {
                        display: flex;
                        height: 5rem;
                        width: 15rem;
                        align-items: center;
                        justify-content: center;
                    }
                    fix_cont fix_wrapper {
                        position: relative;
                        display: inline-block;
                        margin-top: 1.5rem;
                    }
                    fix_cont fix_name {
                        color: ${color};
                        font-size: 1.8rem;
                        display: inline-block;
                    }
                    fix_cont fix_edit {
                        top: 2.2rem;
                        right: -4.2rem;
                        position: absolute;
                    }
                    fix_cont fix_wrapper::after {
                        content: "";
                        position: absolute;
                        width: 1.2rem;
                        height: 100%;
                    }
                    fix_cont fix_wrapper:hover fix_name {
                        background-color: #fff;
                    }
                    fix_cont fix_wrapper:hover fix_edit {
                        display: block;
                    }

                    .post-show-box {
                        z-index: 9999;
                        cursor: pointer;
                        position: absolute;
                        padding: 8px 4px;
                        max-width: 120%;
                        min-width: 80px;
                        overflow-x: auto;
                        overflow-y: hidden;
                        white-space: nowrap;
                        border-radius: 5px;
                        background: #1d1f20ff;
                        border: 1px solid #fff;
                    }
                    .post-show-box[preview="above"] {
                        bottom: 85%;
                    }
                    .post-show-box[preview="below"] {
                        top: 85%;
                    }
                    .post-show-box::-webkit-scrollbar {
                        display: none;
                    }
                    .post-show-box img {
                        height: 23vh;
                        margin: 0 .3rem;
                        min-width: 55%;
                        border: 1px solid #fff;
                    }
                    .fancy-image__image {
                        z-index: 1;
                        position: relative;
                    }
                    .fancy-image__picture:before {
                        content: "";
                        z-index: 0;
                        bottom: 10%;
                        width: 100px;
                        height: 115px;
                        position: absolute;
                    }
                `, "Global-Effects", false);
            },
            get getPostview() { // 觀看帖子頁所需
                // 讀取圖像設置
                const set = userSet.imgSet();
                Lib.addStyle(`
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
                        object-fit: contain;
                        border: 2px solid #fafafa;
                    }
                    .Image-loading-indicator-experiment {
                        border: 3px solid #00ff7e;
                    }
                    .Image-loading-indicator[alt] {
                        border: 2px solid #e43a3aff;
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
                        border-radius: 3px;
                        background-color: rgba(0, 0, 0, 0.3);
                    }
                `, "Image-Custom-Style", false);
                imgRule = Lib.$q("#Image-Custom-Style")?.sheet.cssRules;

                // 全局修改功能
                Lib.storageListen(Object.values(saveKey), call => {
                    if (call.far) {
                        if (typeof call.nv === "string") {
                            menuInit();
                        } else {
                            for (const [key, value] of Object.entries(call.nv)) {
                                stylePointer[key](value);
                            }
                        }
                    }
                });
            },
            get getPostExtra() { // 觀看帖子頁圖示
                Lib.addStyle(`
                    #main section {
                        width: 100%;
                    }
                `, "Post-Extra", false);
            }
        };

        // 展示語言
        const word = {
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

        // 搜尋頁面 ./artists*
        const Artists = /.+(?<!favorites)\/artists.*/;
        // 預覽頁的藝術家其他頁面連結 ./links | ./links/new
        const Links = /.+\/user\/[^\/]+\/links.*/;
        // 預覽頁的推薦 ./recommended
        const Recommended = /.+\/user\/[^\/]+\/recommended.*/;
        // favorites 頁面 ./favorites/artists*
        const FavoritesArtists = /.+\/favorites\/artists.*/;

        // 排除 favorites 頁面以外的 posts & posts/popular 頁面
        const Posts = /.+(?<!favorites)\/posts.*/;
        // 最常見的 User 預覽頁面, ./user/id || ./user/id?.*
        const User = /.+\/user\/[^\/]+(\?.*)?$/;
        // favorites 頁面 ./favorites/posts*
        const FavorPosts = /.+\/favorites\/posts.*/;

        // DMs 頁面
        const Dms = /.+\/dms(\?.*)?$/;
        // 預覽頁的公告 ./announcements
        const Announcement = /.+\/user\/[^\/]+\/announcements.*/;

        // 帖子內容頁面
        const Content = /.+\/user\/.+\/post\/.+$/;

        return {
            isContent: () => Content.test(Url),
            isAnnouncement: () => Announcement.test(Url) || Dms.test(Url),
            isSearch: () => Artists.test(Url) || Links.test(Url) || Recommended.test(Url) || FavoritesArtists.test(Url),
            isPreview: () => Posts.test(Url) || User.test(Url) || FavorPosts.test(Url),
            isNeko: Lib.$domain.startsWith("nekohouse"),

            language() {
                const Log = Lib.getV(saveKey.Lang);
                const ML = Lib.translMatcher(word, Log);

                return { Log, Transl: (str) => ML[str] ?? str }
            },
            responseRule: {
                text: res => res.text(),
                json: res => res.json(),
                blob: res => res.blob(),
                arrayBuffer: res => res.arrayBuffer(),
                formData: res => res.formData(),
                document: async res => {
                    res = await res.text();
                    return Lib.domParse(res);
                },
            },
            fetchRecord: {},
            fetchAbort(url) {
                this.fetchRecord[url]?.abort();
                delete this.fetchRecord[url];
            },
            async fetchApi(url, callback, {
                responseType = "json",
                headers = { "Accept": "text/css" }
            } = {}) {
                this.fetchRecord[url]?.abort();

                const controller = new AbortController();
                this.fetchRecord[url] = controller;

                return new Promise((resolve, reject) => {
                    fetch(url, { headers, signal: controller.signal })
                        .then(async response => {
                            if (!response.ok) {
                                const text = await response.text();
                                throw new Error(`\nFetch failed\nurl: ${response.url}\nstatus: ${response.status}\nstatusText: ${text}`);
                            }

                            try {
                                return await this.responseRule[responseType](response);
                            } catch { }
                        })
                        .then(res => {
                            resolve(res);
                            callback?.(res);
                        })
                        .catch(error => {
                            reject(error);
                            Lib.log(error).error;
                        })
                        .finally(() => {
                            delete this.fetchRecord[url];
                        });
                })
            },
            ...userSet, style, menuRule, color, saveKey, stylePointer,
            Artists, FavoritesArtists, FavorPosts, Links, Recommended, Posts, User, Content, Dms,
            originalApi: `https://${Lib.$domain}/data`,
            thumbnailApi: `https://${Lib.$domain}/thumbnail/data`,
            registered: new Set(),
            supportImg: new Set(["jpg", "jpeg", "png", "gif", "bmp", "webp", "avif", "heic", "svg"]),
            videoType: new Set([
                "mp4", "avi", "mkv", "mov", "flv", "wmv", "webm", "mpg", "mpeg", "m4v",
                "ogv", "3gp", "asf", "ts", "vob", "rm", "rmvb", "m2ts", "f4v", "mts",
                "mpe", "mpv", "m2v", "m4a", "bdmv", "ifo", "r3d", "braw", "cine", "qt",
                "f4p", "swf", "mng", "gifv", "yuv", "roq", "nsv", "amv", "svi", "mod",
                "mxf", "ogg",
            ])
        };
    })();

    /* ==================== 配置解析 調用 ==================== */
    const Enhance = (() => {
        // 呼叫順序
        const order = {
            Global: [
                "BlockAds",
                "CacheFetch",
                "SidebarCollapse",
                "DeleteNotice",
                "TextToLink",
                "BetterPostCard",
                "KeyScroll"
            ],
            Preview: [
                "CardText",
                "CardZoom",
                "NewTabOpens",
                "QuickPostToggle",
                "BetterThumbnail"
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
        const loadFunc = {
            globalCache: undefined,
            previewCache: undefined,
            contentCache: undefined,
            Global() { return this.globalCache ??= globalFunc() },
            Preview() { return this.previewCache ??= previewFunc() },
            Content() { return this.contentCache ??= contentFunc() },
        };

        // 解析配置調用對應功能
        async function call(page, config = User_Config[page]) {
            const func = loadFunc[page](); // 載入對應函數

            for (const ord of order[page]) {
                let userConfig = config[ord]; // 載入對應的用戶配置

                if (!userConfig) continue;
                if (typeof userConfig !== "object") {
                    userConfig = { enable: true };
                } else if (!userConfig.enable) continue;

                // 更輕量化的直接呼叫 (沒有驗證數據格式)
                func[ord]?.(userConfig);
            }
        };

        return {
            async run() {
                call("Global");

                if (DLL.isPreview()) call("Preview");
                else if (DLL.isContent()) {
                    /* 就算沒開啟原圖功能, 還是需要導入 Postview (暫時寫在這) */
                    DLL.style.getPostview; // 導入 Post 頁面樣式
                    call("Content"); // 呼叫功能
                    menuInit();
                }
            }
        }
    })();

    /* ==================== 主運行 ==================== */
    Enhance.run();

    // 等待 DOM 更新
    const waitDom = new MutationObserver(() => {
        waitDom.disconnect();
        Enhance.run();
    });

    // 監聽網址變化
    Lib.onUrlChange(change => {
        Url = change.url;

        waitDom.observe(document, {
            attributes: true,
            childList: true,
            subtree: true,
            characterData: true
        })

        Lib.body.$sAttr("Enhance", true); // 避免沒監聽到變化
    });

    /* ==================== 全域功能 ==================== */
    function globalFunc() {
        const loadFunc = {
            textToLinkCache: undefined,
            textToLinkRequ({ newtab, newtab_active, newtab_insert }) {
                return this.textToLinkCache ??= {
                    mega: undefined,
                    exclusionRegex: /onfanbokkusuokibalab\.net/,
                    urlRegex: /(?:(?:https?|ftp|mailto|file|data|blob|ws|wss|ed2k|thunder):\/\/|(?:[-\w]+\.)+[a-zA-Z]{2,}(?:\/|$)|\w+@[-\w]+\.[a-zA-Z]{2,})[^\s]*?(?=[{}「」『』【】\[\]（）()<>、"'，。！？；：…—～~]|$|\s)/gi,
                    exclusionTags: new Set([
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
                    urlMatch(str) {
                        // ? 使用 /g 全局匹配, 如果不重新宣告 使用 test()|exec(), 沒有重設 lastIndex 會有意外狀況
                        // 不直接用 match 是為了性能, 因為節點可能很多, test 比 match 開銷更小
                        this.urlRegex.lastIndex = 0;
                        return this.urlRegex.test(str);
                    },
                    getTextNodeMap(root) {
                        const nodes = new Map();
                        const tree = document.createTreeWalker(
                            root,
                            NodeFilter.SHOW_TEXT,
                            {
                                acceptNode: (node) => {
                                    const parentElement = node.parentElement;
                                    if (!parentElement || this.exclusionTags.has(parentElement.tagName)) return NodeFilter.FILTER_REJECT;

                                    const content = node.$text();
                                    if (!content || this.exclusionRegex.test(content)) return NodeFilter.FILTER_REJECT;
                                    return content === "(frame embed)" || this.urlMatch(content)
                                        ? NodeFilter.FILTER_ACCEPT
                                        : NodeFilter.FILTER_REJECT;
                                }
                            }
                        );
                        let node, parent, pack;
                        while ((node = tree.nextNode())) {
                            parent = node.parentElement;
                            pack = nodes.get(parent);
                            if (pack === undefined) {
                                pack = [];
                                nodes.set(parent, pack);
                            }
                            pack.push(node);
                        };
                        return nodes;
                    },
                    protocolParse(url) {
                        if (/^[a-zA-Z][\w+.-]*:\/\//.test(url) || /^[a-zA-Z][\w+.-]*:/.test(url)) return url;
                        if (/^([\w-]+\.)+[a-z]{2,}(\/|$)/i.test(url)) return "https://" + url;
                        if (/^\/\//.test(url)) return "https:" + url;
                        return url;
                    },
                    // 解析後轉換網址 (上層容器, 文本父節點, 文本內容, 文本節點, 是否為複雜文本)
                    async parseModify(
                        container, father, text, textNode = null, complex = false
                    ) {
                        let modifyUrl, passwordDict = {};

                        // 單獨的 (frame embed)
                        if (text === "(frame embed)") {
                            const a = father.closest("a");
                            if (!a) return;

                            const href = a.href;
                            if (!href) return;

                            if (href.includes("mega.nz/#P!")) {
                                this.mega ??= megaUtils(this.urlRegex);
                                passwordDict = this.mega.extractPasswords(container.$oHtml());
                            }

                            if (passwordDict[href])
                                modifyUrl = await this.mega.getDecryptedUrl(href, passwordDict[href]);

                            if (modifyUrl && modifyUrl !== href) {
                                a.href = modifyUrl;
                                a.$text(modifyUrl);
                            } else {
                                a.$text(href);
                            }
                        }
                        // 複雜文本, 同個父元素內含多個文本, 主要是避免跑板的 (還未支援 mega 解密)
                        else if (complex) {
                            textNode.replaceWith(
                                Lib.createDomFragment(
                                    text.replace(this.urlRegex, url => {
                                        const decode = decodeURIComponent(url).trim();
                                        return `<a href="${this.protocolParse(decode)}" rel="noopener noreferrer">${decode}</a>`;
                                    })
                                )
                            )
                        }
                        // 通常是完整的 pre 文本
                        else {
                            // ? 用於提前退出, 與降低開始處理速度, 有時 AJAX 載入比較慢會導致沒處理到
                            if (text.match(this.urlRegex).length === 0) return;

                            if (text.includes("mega.nz/#P!")) {
                                this.mega ??= megaUtils(this.urlRegex);
                                passwordDict = this.mega.extractPasswords(text);
                            }

                            let url, index, lastIndex = 0;
                            const segments = [];
                            for (const match of text.matchAll(this.urlRegex)) {
                                url = match[0];
                                index = match.index;

                                if (index > lastIndex) segments.push(text.slice(lastIndex, index));

                                modifyUrl = decodeURIComponent(url).trim();
                                if (passwordDict[url])
                                    modifyUrl = await this.mega.getDecryptedUrl(url, passwordDict[url]);

                                segments.push(`<a href="${this.protocolParse(modifyUrl)}" rel="noopener noreferrer">${modifyUrl}</a>`);
                                lastIndex = index + url.length;
                            }

                            if (lastIndex < text.length) {
                                segments.push(text.slice(lastIndex));
                            }

                            father.tagName === "A"
                                ? father.replaceWith(Lib.createDomFragment(segments.join("")))
                                : father.$iHtml(segments.join(""));
                        }
                    },
                    async jumpTrigger(root) { // 將該區塊的所有 a 觸發跳轉, 改成開新分頁
                        const [active, insert] = [newtab_active, newtab_insert];
                        Lib.onEvent(root, "click", event => {
                            const target = event.target.closest("a:not(.fileThumb)");
                            if (!target || target.$hAttr("download")) return;
                            event.preventDefault();

                            !newtab
                                ? location.assign(target.href)
                                : GM_openInTab(target.href, { active, insert });
                        }, { capture: true });
                    }
                };
            },
            betterPostCardCache: undefined,
            async betterPostCardRequ() {
                if (!this.betterPostCardCache) {
                    const oldKey = "fix_record_v2";
                    const recordKey = "better_post_record";

                    const oldRecord = Lib.getLocal(oldKey); // 數據轉移
                    if (oldRecord instanceof Array) {
                        const r = await DB.set(recordKey, new Map(oldRecord));
                        r === recordKey && Lib.delLocal(oldKey);
                    };

                    const fixRequ = { // 宣告修復需要的函數
                        recordCache: undefined, // 讀取修復紀錄 用於緩存
                        fixCache: new Map(), // 修復後 用於緩存
                        async init() {
                            this.recordCache = await this.getRecord(); // 初始化獲取緩存
                        },
                        async getRecord() {
                            return await DB.get(recordKey, new Map());
                        },
                        async saveRecord(save) {
                            await DB.set(recordKey, new Map([...await this.getRecord(), ...save]));
                            this.fixCache.clear();
                        },
                        saveWork: (() => Lib.$debounce(() => fixRequ.saveRecord(fixRequ.fixCache), 1e3))(),
                        replaceUrlTail(url, tail) {
                            const uri = new URL(url);
                            uri.pathname = tail;
                            url = uri.href;
                            return url;
                        },
                        uriFormat1: /\/([^\/]+)\/(?:user|server|creator|fanclubs)\/([^\/?]+)/,
                        uriFormat2: /\/([^\/]+)\/([^\/]+)$/,
                        uriFormat3: /^https?:\/\/([^.]+)\.([^.]+)\./,
                        specialServer: { x: "twitter", maker_id: "dlsite" },
                        supportServer: /Gumroad|Patreon|Fantia|Pixiv|Fanbox|CandFans|Twitter|Boosty|OnlyFans|Fansly|SubscribeStar|DLsite/i,
                        parseUrlInfo(uri) { // 解析所有內部網址, 與作者外部網址
                            uri = uri.match(this.uriFormat1) || uri.match(this.uriFormat2) || uri.match(this.uriFormat3);
                            if (!uri) return;

                            return uri.splice(1).reduce((acc, str) => {
                                if (this.supportServer.test(str)) {
                                    const cleanStr = str.replace(/\/?(www\.|\.com|\.to|\.jp|\.net|\.adult|user\?u=)/g, "");
                                    acc.server = this.specialServer[cleanStr] ?? cleanStr
                                } else {
                                    acc.user = str;
                                }

                                return acc;
                            }, {});
                        },
                        async fixRequest(url, headers = {}) { // 請求修復數據
                            return new Promise(resolve => {
                                GM_xmlhttpRequest({
                                    method: "GET",
                                    url: url,
                                    headers: headers,
                                    responseType: "json",
                                    onload: response => resolve(response),
                                    onerror: () => resolve(),
                                    ontimeout: () => resolve()
                                })
                            });
                        },
                        async getPixivName(id) { // 取得 Pixiv 名稱
                            const response = await this.fixRequest(
                                `https://www.pixiv.net/ajax/user/${id}?full=1&lang=ja`, { referer: "https://www.pixiv.net/" }
                            );
                            if (response.status === 200) {
                                const user = response.response;
                                let user_name = user.body.name;
                                user_name = user_name.replace(/(c\d+)?([日月火水木金土]曜日?|[123１２３一二三]日目?)[東南西北]..?\d+\w?/i, '');
                                user_name = user_name.replace(/[@＠]?(fanbox|fantia|skeb|ファンボ|リクエスト|お?仕事|新刊|単行本|同人誌)+(.*(更新|募集|公開|開設|開始|発売|販売|委託|休止|停止)+中?[!！]?$|$)/gi, '');
                                user_name = user_name.replace(/\(\)|（）|「」|【】|[@＠_＿]+$/g, '').trim();
                                return user_name;
                            } else return;
                        },
                        async getCandfansName(id) { // 取得 Candfans 名稱
                            const response = await this.fixRequest(
                                `https://candfans.jp/api/contents/get-timeline?user_id=${id}&record=1`
                            );
                            if (response.status === 200) {
                                const user = response.response.data[0];
                                const user_code = user?.user_code || "";
                                const username = user?.username || "";
                                return [user_code, username]; // user_code 是搜尋用, username 是顯示用
                            } else return;
                        },
                        candfansPageAdapt(oldId, newId, oldUrl, oldName, newName) { // Candfans 很麻煩, 不同頁面的格式不一樣
                            if (DLL.isSearch()) {
                                oldId = newId || oldId;
                            } else {
                                oldUrl = newId ? this.replaceUrlTail(oldUrl, newId) : oldUrl;
                            }

                            oldName = newName || oldName;
                            return [oldId, oldUrl, oldName];
                        },
                        supportFixName: new Set(["pixiv", "fanbox", "candfans"]),
                        supportFixTag: { // 無論是 ID 修復, 還是 NAME 修復, 處理方式都一樣, 只是分開處理, 方便維護
                            // ? 使用 g 是因為, 會有 'Pixiv Fanbox' 這樣的字串
                            ID: /Gumroad|Patreon|Fantia|Pixiv|Fanbox|CandFans/gi,
                            NAME: /Twitter|Boosty|OnlyFans|Fansly|SubscribeStar|DLsite/gi,

                            Fantia: "https://fantia.jp/fanclubs/{id}/posts",
                            FantiaPost: "https://fantia.jp/posts/{id}",

                            Patreon: "https://www.patreon.com/user?u={id}",
                            PatreonPost: "https://www.patreon.com/posts/{id}",

                            DLsite: "https://www.dlsite.com/maniax/circle/profile/=/maker_id/{name}.html",
                            DLsitePost: "https://www.dlsite.com/maniax/work/=/product_id/{name}.html",

                            CandFans: "https://candfans.jp/{id}",
                            CandFansPost: "https://candfans.jp/posts/comment/show/{id}",

                            Gumroad: "https://gumroad.com/{id}",
                            Pixiv: "https://www.pixiv.net/users/{id}/artworks",
                            Fanbox: "https://www.pixiv.net/fanbox/creator/{id}",
                            Boosty: "https://boosty.to/{name}",
                            SubscribeStar: "https://subscribestar.adult/{name}",
                            Twitter: "https://x.com/{name}",
                            OnlyFans: "https://onlyfans.com/{name}",
                            Fansly: "https://fansly.com/{name}/posts",
                        },
                        async fixUpdateUi(mainUrl, otherUrl, user, nameEl, tagEl, showText, appendTag) { // 修復後更新 UI
                            nameEl.$sAttr("style", "display: none;"); // 隱藏原始名稱

                            if (nameEl.previousElementSibling?.tagName !== "FIX_WRAPPER") {
                                nameEl.$iAdjacent(`
                                    <fix_wrapper>
                                        <fix_name jump="${mainUrl}">${showText.trim()}</fix_name>
                                        <fix_edit id="${user}">Edit</fix_edit>
                                    </fix_wrapper>
                                `, "beforebegin");
                            };

                            /* 取得支援修復的正則 */
                            const [tag_text, support_id, support_name] = [
                                tagEl.$text(),
                                this.supportFixTag.ID,
                                this.supportFixTag.NAME
                            ];

                            if (!tag_text) return;

                            const [mark, matchId] = support_id.test(tag_text)
                                ? ["{id}", support_id]
                                : support_name.test(tag_text) ? ["{name}", support_name] : ["", null];

                            if (!mark) return;

                            tagEl.$iHtml(tag_text.replace(matchId, tag => {
                                let supported = false;
                                const supportFormat = appendTag
                                    ? ( // 存在 appendTag 時 且擁有對應的 API 格式, 才使用新的 user 與支援格式, 否則回退到舊格式
                                        supported = this.supportFixTag[`${tag}${appendTag}`],
                                        supported ? (user = this.parseUrlInfo(otherUrl).user, supported) : this.supportFixTag[tag]
                                    )
                                    : this.supportFixTag[tag];

                                return `<fix_tag jump="${supportFormat.replace(mark, user)}">${tag}</fix_tag>`;
                            }));
                        },
                        async fixTrigger(data) { // 觸發修復
                            let { mainUrl, otherUrl, server, user, nameEl, tagEl, appendTag } = data;

                            let recordName = this.recordCache?.get(user); // 從緩存 使用尾部 ID 取出對應紀錄
                            if (recordName) {
                                if (server === "candfans") {
                                    [user, mainUrl, recordName] = this.candfansPageAdapt(
                                        user,
                                        recordName[0],
                                        mainUrl,
                                        nameEl.$text(),
                                        recordName[1]
                                    )
                                };

                                this.fixUpdateUi(mainUrl, otherUrl, user, nameEl, tagEl, recordName, appendTag);
                            } else {
                                if (this.supportFixName.has(server)) {

                                    if (server === "candfans") {
                                        const [user_code, username] = await this.getCandfansName(user) ?? nameEl.$text();

                                        if (user_code && username) this.fixCache.set(user, [user_code, username]); // 都存在才添加數據

                                        [user, mainUrl, recordName] = this.candfansPageAdapt(
                                            user,
                                            user_code,
                                            mainUrl,
                                            nameEl.$text(),
                                            username
                                        )

                                        this.fixUpdateUi(mainUrl, otherUrl, user, nameEl, tagEl, username, appendTag);
                                    } else {
                                        const username = await this.getPixivName(user) ?? nameEl.$text();
                                        this.fixUpdateUi(mainUrl, otherUrl, user, nameEl, tagEl, username, appendTag);
                                        this.fixCache.set(user, username); // 添加數據
                                    }

                                    this.saveWork(); // 呼叫保存工作
                                } else {
                                    this.fixUpdateUi(mainUrl, otherUrl, user, nameEl, tagEl, nameEl.$text(), appendTag);
                                }
                            }
                        },
                        /* ===== 前置處理觸發 ===== */
                        async searchFix(items) { // 針對 搜尋頁, 那種有許多用戶卡的
                            items.$sAttr("fix", true); // 添加修復標籤

                            const url = items.href;
                            const img = items.$q("img");
                            const { server, user } = this.parseUrlInfo(url);

                            img.$sAttr("jump", url); // 圖片設置跳轉連結

                            this.fixTrigger({
                                mainUrl: url, // 主要跳轉連結
                                otherUrl: "", // 其他替代連結
                                server, // 網站 字串
                                user, // 尾部 id 資訊
                                nameEl: items.$q(".user-card__name"), // 名稱物件
                                tagEl: items.$q(".user-card__service"), // 標籤物件
                                appendTag: "", // 附加 tag 文本
                            });
                        },
                        async otherFix(artist, tag = "", mainUrl = null, otherUrl = null, reTag = "fix_view") { // 針對其餘頁面的修復
                            try {
                                const parent = artist.parentElement;
                                const url = mainUrl ?? parent.href;
                                const { server, user } = this.parseUrlInfo(url);

                                await this.fixTrigger({
                                    mainUrl: url,
                                    otherUrl,
                                    server,
                                    user,
                                    nameEl: artist,
                                    tagEl: tag,
                                    appendTag: otherUrl ? "Post" : "" // 用於調用 Post API, 的附加標籤
                                });

                                parent.replaceWith(
                                    Lib.createElement(reTag, { innerHTML: parent.$iHtml() })
                                );
                            } catch {/* 防止動態監聽進行二次操作時的錯誤 (因為 DOM 已經被修改) */ }
                        },
                        async dynamicFix(element) {
                            Lib.$observer(element, async () => {
                                this.recordCache = await this.getRecord(); // 觸發時重新取得緩存
                                // ! 暫時寫法, 該頁面更新時不會完整刷新, 所以要跳過檢查
                                const checkFix = !DLL.FavoritesArtists.test(Url);
                                for (const items of element.$qa(`a${checkFix ? ":not([fix])" : ""}`)) {
                                    this.searchFix(items);
                                }
                            }, { mark: "dynamic-fix", subtree: false, debounce: 50 });
                        }
                    }

                    await fixRequ.init();
                    this.betterPostCardCache = fixRequ;
                };

                return this.betterPostCardCache;
            }
        }

        return {
            async SidebarCollapse() { /* 收縮側邊攔 */
                if (Lib.platform === "Mobile") return;

                Lib.addStyle(`
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
                `, "Collapse-Effects", false);
            },
            async DeleteNotice() { /* 刪除公告通知 */
                Lib.waitEl("#announcement-banner", null, { throttle: 50, timeout: 5 }).then(announcement => announcement.remove());
            },
            async BlockAds() { /* (阻止/封鎖)廣告 */
                if (DLL.isNeko) return;

                const cookieString = Lib.cookie();
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
                        Lib.cookie(`${key}=${value}; domain=.${Lib.$domain}; path=/; expires=${expires};`);
                    }
                };

                // 舊版白名單正則轉換
                // const adRegex = new RegExp("(?:" + domains.join("|").replace(/\./g, "\\.") + ")");

                if (DLL.registered.has("BlockAds")) return;

                Lib.addStyle(`
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

                DLL.registered.add("BlockAds");
            },
            async CacheFetch() { /* 緩存請求 */
                if (DLL.isNeko || DLL.registered.has("CacheFetch")) return;

                const cacheKey = "fetch_cache_data";
                const cache = await DB.get(cacheKey, new Map());
                const saveCache = Lib.$debounce(() => {
                    DB.set(cacheKey, cache, { expireStr: "5m" }); // 有效 5 分鐘緩存 (每次都刷新)
                }, 1e3);

                // unsafeWindow 是 瀏覽器環境, window 是 sandbox 環境
                const originalFetch = { Sandbox: window.fetch, Window: unsafeWindow.fetch };

                window.fetch = (...args) => fetchWrapper(originalFetch.Sandbox, ...args);
                unsafeWindow.fetch = (...args) => fetchWrapper(originalFetch.Window, ...args);

                async function fetchWrapper(windowContext, ...args) {
                    const input = args[0];
                    const options = args[1] || {};

                    if (!input) return windowContext(...args);

                    const url = (typeof input === 'string') ? input : input.url;
                    const method = options.method || (typeof input === 'object' ? input.method : 'GET') || 'GET';

                    // 不是 GET 請求 或 有 X-Bypass-CacheFetch 標頭 或 url 結尾為 random
                    if (method.toUpperCase() !== 'GET' || options.headers?.['X-Bypass-CacheFetch'] || url.endsWith("random")) {
                        return windowContext(...args);
                    }

                    // 如果快取命中，立即返回快取中的 Response
                    if (cache.has(url)) {
                        const cached = cache.get(url);
                        return new Response(cached.body, {
                            status: cached.status,
                            headers: cached.headers
                        });
                    }

                    // 執行請求與非阻塞式快取
                    try {
                        // 等待原始請求完成
                        const response = await windowContext(...args);

                        // 檢查是否滿足所有快取條件
                        if (response.status === 200 && url.includes('api')) {

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

                                        saveCache();
                                    }
                                } catch { }
                            })();
                        }

                        return response;
                    } catch (error) {
                        throw error;
                    }
                };

                DLL.registered.add("CacheFetch");
            },
            async TextToLink(config) { /* 連結文本轉連結 (沒有連結文本的不會執行) */
                if (!DLL.isContent() && !DLL.isAnnouncement()) return;

                const func = loadFunc.textToLinkRequ(config);

                if (DLL.isContent()) {
                    Lib.waitEl(".post__body, .scrape__body", null).then(async body => {

                        let [article, content] = [
                            body.$q("article"),
                            body.$q(".post__content, .scrape__content")
                        ];

                        if (article) {
                            func.jumpTrigger(content);
                            let span;
                            for (span of article.$qa("span.choice-text")) {
                                func.parseModify(article, span, span.$text());
                            }
                        } else if (content) {
                            func.jumpTrigger(content);
                            let parentNode, text, textNode, data, dataLength;
                            for ([parentNode, data] of func.getTextNodeMap(content).entries()) {
                                dataLength = data.length;

                                for (textNode of data) {
                                    text = textNode.$text();

                                    if (text.startsWith("https://mega.nz")) {
                                        func.mega ??= megaUtils(func.urlRegex);
                                        text = await func.mega.getPassword(parentNode, text);
                                    }

                                    func.parseModify(content, parentNode, text, textNode, dataLength > 1);
                                }
                            }
                        } else {
                            const attachments = body.$q(".post__attachments, .scrape__attachments");
                            attachments && func.jumpTrigger(attachments);
                        }
                    });

                } else if (DLL.isAnnouncement()) {
                    Lib.waitEl(".card-list__items pre", null, { raf: true }).then(() => {
                        const items = Lib.$q(".card-list__items");
                        func.jumpTrigger(items);

                        let parentNode, textNode, data, dataLength;
                        for ([parentNode, data] of func.getTextNodeMap(items).entries()) {
                            dataLength = data.length;
                            for (textNode of data) {
                                func.parseModify(items, parentNode, textNode.$text(), textNode, dataLength > 1);
                            }
                        }
                    })
                }
            },
            async BetterPostCard({ newtab, newtab_active, newtab_insert, previewAbove }) { /* 更好的 PostCard */
                DLL.style.getGlobal; // 導入 Global 頁面樣式
                const func = await loadFunc.betterPostCardRequ();

                // 監聽點擊事件
                const [active, insert] = [newtab_active, newtab_insert];
                Lib.onEvent(Lib.body, "click", event => {
                    const target = event.target;
                    const tagName = target.tagName;

                    if (tagName === "TEXTAREA") {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                    } else if (tagName === "FIX_EDIT") {
                        event.preventDefault();
                        event.stopImmediatePropagation();

                        Lib.$q(".edit_textarea")?.remove(); // 移除上一次的編輯框 (避免意外)

                        const display = target.previousElementSibling; // 取得上方的 name 元素
                        const text = Lib.createElement(display, "textarea", {
                            class: "edit_textarea",
                            style: `height: ${display.scrollHeight + 10}px;`,
                        }, "beforebegin");

                        const original_name = display.$text();
                        text.value = original_name.trim();

                        text.scrollTop = 0; // 滾動到最上方
                        setTimeout(() => {
                            text.focus() // 設置焦點
                            setTimeout(() => { // 避免還沒設置好焦點就觸發
                                text.on("blur", () => {
                                    const change_name = text.value.trim();
                                    if (change_name != original_name) {
                                        display.$text(change_name); // 修改顯示名
                                        func.saveRecord(new Map([[target.id, change_name]])); // 保存修改名
                                    }
                                    text.remove();
                                }, { once: true, passive: true });
                            }, 50);
                        }, 300);
                    } else if (
                        // ! 以後在優化, 現在只是為了快速實現
                        newtab && Lib.platform !== "Mobile" && (
                            tagName === "FIX_NAME" || tagName === "FIX_TAG" || tagName === "PICTURE"
                            || target.matches(".fancy-image__image, .post-show-box, .post-show-box img")
                        )
                        || tagName === "FIX_TAG"
                        || tagName === "FIX_NAME" && (DLL.isPreview() || DLL.isContent())
                        || DLL.isContent() && target.matches(".fancy-image__image")
                    ) {
                        event.preventDefault();
                        event.stopImmediatePropagation();

                        const url = target.$gAttr("jump");
                        if (url) {
                            newtab
                                || tagName === "FIX_TAG"
                                || tagName === "FIX_NAME" && DLL.isPreview()
                                ? GM_openInTab(url, { active, insert })
                                : location.assign(url);
                        }
                        else if (tagName === "IMG" || tagName === "PICTURE") {
                            const href = target.closest("a").href;
                            newtab && !DLL.isContent()
                                ? GM_openInTab(href, { active, insert })
                                : location.assign(href);
                        }
                    }
                }, { capture: true, mark: "BetterPostCard" });

                // 監聽滑鼠移入事件
                if (Lib.platform === "Desktop") {
                    let currentBox, currentTarget;

                    Lib.onEvent(Lib.body, "mouseover", Lib.$debounce(event => {
                        let target = event.target;
                        const tagName = target.tagName;

                        if (tagName === "IMG" && target.$hAttr("jump")) {
                            currentTarget = target.parentElement;
                            currentBox = target.previousElementSibling;
                        }
                        else if (tagName === "PICTURE") {
                            currentTarget = target;
                            currentBox = target.$q(".post-show-box");
                            target = target.$q("img");
                        } else return;

                        if (!currentBox && target) {
                            currentBox = Lib.createElement(target, "div", {
                                text: "Loading...",
                                style: "display: none;",
                                class: "post-show-box",
                                attr: { preview: previewAbove ? "above" : "below" },
                                on: {
                                    wheel: event => {
                                        event.preventDefault();
                                        event.currentTarget.scrollLeft += event.deltaY;
                                    }
                                }
                            }, "beforebegin")

                            const url = target.$gAttr("jump");
                            // 目前暫時只有 discord 不支援, 就不用正則
                            if (url && !url.includes("discord")) {
                                const uri = new URL(url);
                                const api = DLL.isNeko ? url : `${uri.origin}/api/v1${uri.pathname}/posts`;
                                DLL.fetchApi(api, null, {
                                    responseType: DLL.isNeko ? "document" : "json"
                                })
                                    .then(data => {
                                        if (DLL.isNeko) data = data.$qa(".post-card__image");
                                        currentBox.$text(""); // 清除載入文本

                                        const srcBox = new Set();
                                        for (const post of data) {
                                            let src = "";

                                            if (DLL.isNeko) src = post.src ?? "";
                                            else {
                                                for (const { path } of [
                                                    post.file,
                                                    ...post?.attachments || []
                                                ]) {
                                                    if (!path) continue;

                                                    const isImg = DLL.supportImg.has(path.split(".")[1]);
                                                    if (!isImg) continue;

                                                    src = DLL.thumbnailApi + path;
                                                    break;
                                                }
                                            }

                                            if (!src) continue;
                                            srcBox.add(src);
                                        }

                                        if (srcBox.size === 0) currentBox.$text("No Image");
                                        else {
                                            currentBox.$iAdjacent([...srcBox].map((src, index) => `<img src="${src}" loading="lazy" number="${index + 1}">`).join(''));
                                            srcBox.clear();
                                        }
                                    })
                            } else currentBox.$text("Not Supported");
                        }

                        // ? 這樣寫是為了使用 ?. 語法, 避免 currentBox 為 null 造成錯誤
                        currentBox?.$sAttr("style", "display: block;");
                    }, 3e2), { passive: true, mark: "PostShow" });

                    Lib.onEvent(Lib.body, "mouseout", event => {
                        if (!currentTarget) return;
                        if (currentTarget.contains(event.relatedTarget)) return;
                        currentTarget = null;
                        currentBox?.$sAttr("style", "display: none;");
                    }, { passive: true, mark: "PostHide" });
                }

                // 搜尋頁面, 與一些特殊預覽頁
                if (DLL.isSearch()) {
                    Lib.waitEl(".card-list__items", null, { raf: true, timeout: 10 }).then(card_items => {
                        if (DLL.Links.test(Url) || DLL.Recommended.test(Url)) {
                            // 特定頁面的 名稱修復
                            const artist = Lib.$q("span[itemprop='name']");
                            artist && func.otherFix(artist);
                        }

                        func.dynamicFix(card_items);
                        card_items.$sAttr("fix-trigger", true); // 避免沒觸發變更
                    });
                }
                else if (DLL.isContent()) { // 是內容頁面
                    Lib.waitEl([
                        "h1 span:nth-child(2)",
                        ".post__user-name, .scrape__user-name"
                    ], null, { raf: true, timeout: 10 }).then(([title, artist]) => {
                        func.otherFix(artist, title, artist.href, Lib.url, "fix_cont");
                    });

                }
                else { // 一般 預覽頁面
                    Lib.waitEl("span[itemprop='name']", null, { raf: true, timeout: 3 }).then(artist => {
                        func.otherFix(artist);
                    });
                }
            },
            async KeyScroll({ mode }) { /* 快捷自動滾動 */
                if (Lib.platform === "Mobile" || DLL.registered.has("KeyScroll")) return;

                // 滾動配置
                const Scroll_Requ = {
                    Scroll_Pixels: 2,
                    Scroll_Interval: 800,
                };

                const UP_ScrollSpeed = Scroll_Requ.Scroll_Pixels * -1;
                let Scroll, Up_scroll = false, Down_scroll = false;

                const [TopDetected, BottomDetected] = [ // 到頂 和 到底 的檢測
                    Lib.$throttle(() => {
                        Up_scroll = Lib.sY == 0
                            ? false : true
                    }, 600),
                    Lib.$throttle(() => {
                        Down_scroll = Lib.sY + Lib.iH >= Lib.html.scrollHeight
                            ? false : true
                    }, 600)
                ];

                switch (mode) {
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

                Lib.onEvent(window, "keydown", Lib.$throttle(event => {
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

                DLL.registered.add("KeyScroll");
            }
        }
    };

    /* ==================== 預覽頁功能 ==================== */
    function previewFunc() {
        const loadFunc = {
            betterThumbnailCache: undefined,
            betterThumbnailRequ() {
                return this.betterThumbnailCache ??= {
                    imgReload: (img, thumbnailSrc, retry) => {
                        if (!retry) {
                            img.src = thumbnailSrc;
                            return;
                        };

                        const src = img.src;

                        img.onload = function () {
                            img.onload = img.onerror = null;
                        };
                        img.onerror = function () {
                            img.onload = img.onerror = null;
                            img.src = thumbnailSrc;

                            const self = this.betterThumbnailCache;
                            setTimeout(() => {
                                self?.imgReload(img, thumbnailSrc, retry - 1);
                            }, 2e3);
                        };

                        img.src = src;
                    },
                    changeSrc: (img, thumbnailSrc, src) => {
                        const self = this.betterThumbnailCache;

                        img.loading = "lazy";
                        img.onerror = function () {
                            img.onerror = null;
                            self.imgReload(this, thumbnailSrc, 10);
                        };

                        img.src = src;
                    }
                }
            }
        }

        return {
            async NewTabOpens({ newtab_active, newtab_insert }) { /* 將預覽頁面 開啟帖子都變成新分頁開啟 */
                const [active, insert] = [newtab_active, newtab_insert];

                Lib.onEvent(Lib.body, "click", event => {
                    const target = event.target.closest("article a");
                    target && (
                        event.preventDefault(),
                        event.stopImmediatePropagation(),
                        GM_openInTab(target.href, { active, insert })
                    );
                }, { capture: true, mark: "NewTabOpens" });
            },
            async QuickPostToggle() { /* 預覽換頁 快速切換 (整體以性能為優先, 增加 代碼量|複雜度|緩存) */

                if (!DLL.isNeko || DLL.registered.has("QuickPostToggle")) return; // ! 暫時只支援 Neko

                Lib.waitEl("menu", null, { all: true, timeout: 5 }).then(menu => {
                    DLL.registered.add("QuickPostToggle");

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
                            Lib.$q(".card-list--legacy").replaceChildren(...clonedContent.childNodes);
                            return Promise.resolve();
                        }

                        return new Promise((resolve, reject) => {
                            const request = GM_xmlhttpRequest({
                                method: "GET",
                                url,
                                onload: response => {
                                    if (abortSignal?.aborted) return reject(new Error('Aborted'));
                                    if (response.status !== 200) return reject(new Error('Server error'));

                                    const newContent = response.responseXML.$q(".card-list--legacy");

                                    // 緩存清理
                                    cleanupCache();

                                    // 緩存內容
                                    const contentToCache = newContent.cloneNode(true);
                                    pageContentCache.set(url, contentToCache);

                                    // 應用到頁面
                                    Lib.$q(".card-list--legacy").replaceChildren(...newContent.childNodes);
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
                        const menu1Buttons = menu[0].$qa("a");
                        const menu2Buttons = menu[1].$qa("a");

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
                    const [fragment1, fragment2] = [Lib.createFragment, Lib.createFragment];

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

                    Lib.onEvent("section", "click", async event => {
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
                                    resolve();
                                })
                            ]);

                            target.closest("#paginator-bottom") && menu[0].scrollIntoView();
                            history.pushState(null, null, pageLinks[targetPage - 1]);
                        } catch (error) {
                            if (error.message !== 'Aborted') {
                                Lib.log('Page fetch failed:', error).error;
                            }
                        } finally {
                            isLoading = false;
                            abortController = null;
                        }
                    }, { capture: true, mark: "QuickPostToggle" });
                });
            },
            async CardText({ mode }) { /* 帖子說明文字效果 */
                if (Lib.platform === "Mobile") return;

                switch (mode) {
                    case 2:
                        Lib.addStyle(`
                            .post-card__header, .post-card__footer {
                                opacity: 0.4 !important;
                                transition: opacity 0.3s;
                            }
                            a:hover .post-card__header,
                            a:hover .post-card__footer {
                                opacity: 1 !important;
                            }
                        `, "CardText-Effects-2", false);
                        break;
                    default:
                        Lib.addStyle(`
                            .post-card__header {
                                opacity: 0;
                                z-index: 1;
                                padding: 5px;
                                pointer-events: none;
                                transform: translateY(-6vh);
                                transition: transform 0.4s, opacity 0.6s;
                            }
                            .post-card__footer {
                                opacity: 0;
                                z-index: 1;
                                padding: 5px;
                                pointer-events: none;
                                transform: translateY(6vh);
                                transition: transform 0.4s, opacity 0.6s;
                            }
                            a:hover .post-card__header,
                            a:hover .post-card__footer {
                                opacity: 1;
                                pointer-events: auto;
                                transform: translateY(0);
                            }
                        `, "CardText-Effects", false);
                }
            },
            async CardZoom({ mode }) { /* 帖子預覽卡縮放效果 */
                switch (mode) {
                    case 2:
                        Lib.addStyle(`
                            .post-card a:hover {
                                z-index: 9999;
                                overflow: auto;
                                max-height: 90vh;
                                min-height: 100%;
                                height: max-content;
                                background: #000;
                                border: 1px solid #fff6;
                                transform: scale(1.1) translateY(0);
                            }
                            .post-card a::-webkit-scrollbar {
                                display: none;
                            }
                            .post-card a:hover .post-card__image-container {
                                position: relative;
                            }
                        `, "CardZoom-Effects-2", false);
                        break;
                    case 3:
                        const [paddingBottom, rowGap, height] = DLL.isNeko
                            ? ["0", "0", "57"]
                            : ["7", "5.8", "50"];

                        Lib.addStyle(`
                            .card-list--legacy { padding-bottom: ${paddingBottom}em }
                            .card-list--legacy .card-list__items {
                                row-gap: ${rowGap}em;
                                column-gap: 3em;
                            }
                            .post-card a {
                                width: 20em;
                                height: ${height}vh;
                            }
                            .post-card__image-container img { object-fit: contain }
                        `, "CardZoom-Effects-3", false);
                };

                Lib.addStyle(`
                    .card-list--legacy * {
                        font-size: 20px !important;
                        font-weight: 600 !important;
                        --card-size: 350px !important;
                    }
                    .post-card a {
                        background: #000;
                        overflow: hidden;
                        border-radius: 8px;
                        border: 3px solid #fff6;
                        transition: transform 0.3s ease, box-shadow 0.3s ease;
                    }
                `, "CardZoom-Effects", false);
            },
            async BetterThumbnail() { /* 變更預覽卡縮圖 */
                Lib.waitEl(
                    DLL.isNeko ? ".post-card__image" : "article.post-card", null, { raf: true, all: true, timeout: 5 }
                ).then(postCard => {
                    const func = loadFunc.betterThumbnailRequ();

                    if (DLL.isNeko) {
                        postCard.forEach(img => {
                            const src = img.src;
                            if (!src?.endsWith(".gif")) { // gif 太大
                                func.changeSrc(img, src, src.replace("thumbnail/", ""));
                            }
                        })
                    } else {
                        const uri = new URL(Url);

                        if (uri.searchParams.get("q") === "") uri.searchParams.delete("q"); // 移除空搜尋

                        if (DLL.User.test(Url)) { // 一般預覽頁面適應
                            uri.pathname += "/posts";
                        }
                        else if (DLL.FavorPosts.test(Url)) { // 收藏頁面適應
                            uri.pathname = uri.pathname.replace("/posts", "");
                            uri.searchParams.set("type", "post");
                        };

                        const postData = [...postCard].reduce((acc, card) => {
                            const id = card.$gAttr("data-id");
                            if (id) acc[id] = { img: card.$q("img"), footer: card.$q("time").nextElementSibling };
                            return acc;
                        }, {});

                        // ! 理論上這邊的實現如果交給 CacheFetch 攔截時直接修改, 會更加高效
                        const api = `${uri.origin}/api/v1${uri.pathname}${uri.search}`;
                        DLL.fetchApi(api, data => {
                            // ! 不特別處理 API 格式修改, 會導致報錯的問題
                            if (Lib.$type(data) === "Object") data = data?.posts || [];

                            for (const post of data) {
                                const { img, footer } = postData[post?.id] || {};
                                if (!img && !footer) continue;

                                let replaced = false;
                                const src = img?.src;
                                const attachments = post.attachments || [];

                                const record = new Set();
                                const count = [post.file, ...attachments].reduce((count, attach, index) => {
                                    const path = attach.path || "";
                                    if (record.has(path)) return count;

                                    const ext = path.split(".").at(-1).toLowerCase();
                                    if (!ext) return count;

                                    // 計算檔案類型
                                    const isImg = DLL.supportImg.has(ext);
                                    if (isImg) count.image = (count.image ?? 0) + 1;
                                    else if (DLL.videoType.has(ext)) count.video = (count.video ?? 0) + 1;
                                    else count.file = (count.file ?? 0) + 1;

                                    // 替換縮圖
                                    if (src && !replaced && index > 0 && isImg) {
                                        replaced = true;
                                        func.changeSrc(img, src, DLL.thumbnailApi + path);
                                    };

                                    record.add(path);
                                    return count;
                                }, {});

                                if (footer && !Lib.isEmpty(count)) {
                                    const { image, video, file } = count;

                                    const parts = [];
                                    if (image) parts.push(`${image} images`);
                                    if (video) parts.push(`${video} videos`);
                                    if (file) parts.push(`${file} files`);

                                    const showText = parts.join(" | ");
                                    if (showText) footer.$text(showText);
                                }
                            }
                        });
                    }
                })
            }
        }
    };

    /* ==================== 內容頁功能 ==================== */
    function contentFunc() {
        const loadFunc = {
            linkBeautifyCache: undefined,
            linkBeautifyRequ() {
                return this.linkBeautifyCache ??= function showBrowse(browse, retry = 5) {
                    if (!retry) return;

                    browse.style.position = "relative"; // 修改樣式避免跑版
                    browse.$q("View")?.remove(); // 查找是否存在 View 元素, 先將其刪除

                    DLL.fetchApi(
                        browse.href?.replace("posts/archives", "api/v1/file"),
                        json => {
                            const password = json.password;
                            browse.$iAdjacent(`
                            <view>
                                ${password ? `password: ${password}<br>` : ""}
                                ${json.file_list.map(file => `${file}<br>`).join("")}
                            </view>`)
                        }
                    ).catch(() => {
                        setTimeout(() => showBrowse(browse, retry - 1), 1e3);
                    });
                }
            },
            extraButtonCache: undefined,
            extraButtonRequ() {
                // ! 這個函數目前只有 nekohouse 需要
                return this.extraButtonCache ??= function getNextPage(url, oldMain, retry = 5) {
                    if (!retry) return;

                    DLL.fetchApi(url, null, { responseType: "document" })
                        .then(dom => {
                            const main = dom.$q("main");
                            if (!main) return;

                            oldMain.replaceWith(main); // 替換舊的 main
                            Lib.$q("header")?.scrollIntoView(); // 回到頂部

                            history.pushState(null, null, url); // 修改連結與紀錄
                            Lib.title(dom.title); // 修改標題
                        })
                        .catch(() => {
                            setTimeout(() => getNextPage(url, oldMain), 1e3);
                        });
                }
            }
        }

        return {
            async LinkBeautify() { /* 懸浮於 browse » 標籤時, 直接展示文件, 刪除下載連結前的 download 字樣, 並解析轉換連結 */
                Lib.addStyle(`
                    View {
                        top: -10px;
                        z-index: 1;
                        padding: 10%;
                        display: none;
                        overflow: auto;
                        color: #f2f2f2;
                        font-size: 14px;
                        max-height: 50vh;
                        font-weight: 600;
                        text-align: center;
                        position: absolute;
                        white-space: nowrap;
                        border-radius: .5rem;
                        left: calc(100% + 10px);
                        border: 1px solid #737373;
                        background-color: #3b3e44;
                    }
                    a:hover View { display: block }
                    .post__attachment .fancy-link::after {
                        content: "";
                        position: absolute;
                        height: 100%;
                        padding: .4rem;
                    }
                    .post__attachment-link:not([beautify]) { display: none !important; }
                `, "Link-Effects", false);

                Lib.waitEl(".post__attachment-link, .scrape__attachment-link", null, { raf: true, all: true, timeout: 5 }).then(post => {
                    const showBrowse = loadFunc.linkBeautifyRequ();

                    for (const link of post) {

                        // 過濾先前處理層
                        if (!DLL.isNeko && link.$gAttr("beautify")) {
                            link.remove();
                            continue;
                        };

                        const text = link.$text().replace("Download ", ""); // 修正原文本

                        if (DLL.isNeko) {
                            link.$text(text);
                            link.$sAttr("download", text);
                        } else {
                            // ! 該站點是 React 渲染的, 直接修改會導致變更異常
                            link.$iAdjacent(
                                `<a class="${link.$gAttr("class")}" href="${link.href}" download="${text}" beautify="true">${text}</a>`,
                                "beforebegin"
                            )
                        };

                        const browse = link.nextElementSibling; // 查找是否含有 browse 元素
                        if (!browse || browse.$text() !== "browse »") continue;
                        showBrowse(browse); // 請求顯示 browse 數據
                    }
                });
            },
            async VideoBeautify({ mode }) { /* 調整影片區塊大小, 將影片名稱轉換成下載連結 */
                if (DLL.isNeko) {
                    Lib.waitEl(".scrape__files video", null, { raf: true, all: true, timeout: 5 }).then(video => {
                        video.forEach(media => media.$sAttr("preload", "metadata"));
                    });
                } else {
                    Lib.waitEl("ul[style*='text-align: center; list-style-type: none;'] li:not([id])", null, { raf: true, all: true, timeout: 5 }).then(parents => {
                        Lib.waitEl(".post__attachment-link, .scrape__attachment-link", null, { raf: true, all: true, timeout: 5 }).then(post => {

                            Lib.addStyle(`
                                .fluid_video_wrapper {
                                    height: 50% !important;
                                    width: 65% !important;
                                    border-radius: 8px !important;
                                }
                            `, "Video-Effects", false);

                            const move = mode === 2;
                            const linkBox = Object.fromEntries([...post].map(a => {
                                const data = [a.download?.trim(), a];

                                return data;
                            }));

                            for (const li of parents) {

                                const waitLoad = new MutationObserver(Lib.$debounce(() => {
                                    waitLoad.disconnect();

                                    let [video, summary] = [
                                        li.$q("video"),
                                        li.$q("summary"),
                                    ];

                                    if (!video || !summary) return;

                                    video.$sAttr("loop", true); // 開啟影片循環
                                    video.$sAttr("preload", "metadata"); // 預載影片元數據

                                    const link = linkBox[summary.$text()]; // 查找對應下載連結
                                    if (!link) return;

                                    move && link.parentElement.remove(); // 刪除對應下載連結

                                    let element = link.$copy();
                                    element.$sAttr("beautify", true); // ? LinkBeautify 的適應, 避免被隱藏
                                    element.$text(element.$text().replace("Download", "")); // 修改載入連結

                                    summary.$text("");
                                    summary.appendChild(element);
                                }, 100));

                                // 監聽動態變化
                                waitLoad.observe(li, { attributes: true, characterData: true, childList: true, subtree: true });
                                li.$sAttr("Video-Beautify", true); // 容錯 (避免沒有監聽到動態變化)
                            };

                        })
                    });
                }
            },
            async OriginalImage({ mode, experiment }) { /* 自動載入原圖 */
                Lib.waitEl(".post__thumbnail, .scrape__thumbnail", null, { raf: true, all: true, timeout: 5 }).then(thumbnail => {
                    /**
                     * 針對 Neko 網站的支援
                     */
                    const linkQuery = DLL.isNeko ? "div" : "a";
                    const safeGetSrc = (element) => element?.src || element?.$gAttr("src");
                    const safeGetHref = (element) => element?.href || element?.$gAttr("href");

                    function cleanMark(img) {
                        img.onload = img.onerror = null;
                        img.$dAttr("alt");
                        img.$dAttr("data-tsrc");
                        img.$dAttr("data-fsrc");
                        img.$delClass("Image-loading-indicator");
                    };

                    // 載入原圖 (死圖重試)
                    function imgReload(img, retry) {
                        if (!retry) {
                            img.alt = "Loading Failed";
                            img.src = img.$gAttr("data-tsrc");
                            return;
                        };

                        img.$dAttr("src");

                        img.onload = function () {
                            cleanMark(img);
                        };
                        img.onerror = function () {
                            img.onload = img.onerror = null;
                            setTimeout(() => {
                                imgReload(img, retry - 1);
                            }, 1e4);
                        };

                        img.alt = "Reload";
                        img.src = img.$gAttr("data-fsrc");
                    };

                    // 點擊重試
                    function loadFailedClick() {
                        Lib.onE(".post__files, .scrape__files", "click", event => {
                            const target = event.target;
                            const isImg = target.matches("img");
                            if (isImg && target.alt === "Loading Failed") {
                                target.onload = null;
                                target.$dAttr("src");
                                target.onload = function () { cleanMark(target) };
                                target.src = target.$gAttr("data-fsrc");
                            }
                        }, { capture: true, passive: true });
                    };

                    let token = 0;
                    let timer = null;
                    function imgRendering({ root, index, thumbUrl, newUrl, oldUrl, mode }) {
                        ++index;
                        ++token;

                        const tagName = oldUrl ? "rc" : "div";
                        const oldSrc = oldUrl ? `src="${oldUrl}"` : "";
                        const container = Lib.createDomFragment(`
                            <${tagName} id="IMG-${index}" ${oldSrc}>
                                <img src="${newUrl}" class="Image-loading-indicator Image-style" data-tsrc="${thumbUrl}" data-fsrc="${newUrl}">
                            </${tagName}>
                        `);

                        const img = container.querySelector("img");

                        timer = setTimeout(() => {
                            --token;
                        }, 1e4);

                        img.onload = function () {
                            clearTimeout(timer);
                            --token;
                            cleanMark(img);
                            mode === "slow" && slowAutoLoad(index);
                        };

                        if (mode === "fast") {
                            img.onerror = function () {
                                --token;
                                img.onload = img.onerror = null;
                                imgReload(img, 7);
                            }
                        };

                        root.replaceWith(container);
                    };

                    async function getFileSize(url) {
                        for (let i = 0; i < 5; i++) {
                            try {
                                const result = await new Promise((resolve, reject) => {
                                    GM_xmlhttpRequest({
                                        method: "HEAD",
                                        url: url,
                                        onload: response => {
                                            const headers = response.responseHeaders.trim().split(/[\r\n]+/).reduce((acc, line) => {
                                                const [name, ...valueParts] = line.split(':');
                                                if (name) acc[name.toLowerCase().trim()] = valueParts.join(':').trim();
                                                return acc;
                                            }, {});

                                            const totalLength = parseInt(headers['content-length'], 10);
                                            const supportsRange = headers['accept-ranges'] === 'bytes' && totalLength > 0;

                                            resolve({
                                                supportsRange: supportsRange,
                                                totalSize: isNaN(totalLength) ? null : totalLength
                                            });
                                        },
                                        onerror: reject, // 任何網路錯誤都 reject，以便觸發 catch 進行重試
                                        ontimeout: reject
                                    });
                                });

                                return result; // 只要成功一次，就立刻回傳結果
                            } catch (error) {
                                if (i < 4) await new Promise(res => setTimeout(res, 300)); // 如果不是最後一次，就稍等後重試
                            }
                        }

                        // 5 次重試全部失敗後，靜默回傳「不支援」的狀態
                        return { supportsRange: false, totalSize: null };
                    };

                    async function imgRequest(container, url, result) {
                        // ! 實驗性分段下載 (暫時關閉)
                        // const fileInfo = await getFileSize(url);
                        const indicator = Lib.createElement(container, "div", { class: "progress-indicator" });

                        let blob = null;
                        try {
                            // 如果支援分段下載
                            if (false /* fileInfo.supportsRange && fileInfo.totalSize */) {
                                const CHUNK_COUNT = 6;
                                const totalSize = fileInfo.totalSize;
                                const chunkSize = Math.ceil(totalSize / CHUNK_COUNT);
                                const chunkProgress = new Array(CHUNK_COUNT).fill(0);

                                // 更新進度的統一邏輯
                                const updateProgress = () => {
                                    const totalDownloaded = chunkProgress.reduce((sum, loaded) => sum + loaded, 0);
                                    const percent = ((totalDownloaded / totalSize) * 100).toFixed(1);
                                    indicator.$text(`${percent}%`);
                                };

                                const chunkPromises = Array.from({ length: CHUNK_COUNT }, (_, i) => {
                                    return (async () => {
                                        const start = i * chunkSize;
                                        const end = Math.min(start + chunkSize - 1, totalSize - 1);
                                        // 為每個分塊內建重試邏輯
                                        for (let j = 0; j < 5; j++) {
                                            try {
                                                return await new Promise((resolve, reject) => {
                                                    GM_xmlhttpRequest({
                                                        method: "GET",
                                                        url,
                                                        headers: { "Range": `bytes=${start}-${end}` },
                                                        responseType: "blob",
                                                        onload: res => (res.status === 206 ? resolve(res.response) : reject(res)),
                                                        onerror: reject,
                                                        ontimeout: reject,
                                                        onprogress: progress => {
                                                            chunkProgress[i] = progress.loaded;
                                                            updateProgress();
                                                        }
                                                    });
                                                });
                                            } catch (error) {
                                                if (j < 4) await new Promise(res => setTimeout(res, 300));
                                            }
                                        }
                                        throw new Error(`Chunk ${i} failed after 5 retries.`); // 如果單一分塊最終失敗，則拋出錯誤
                                    })();
                                });

                                const chunks = await Promise.all(chunkPromises);
                                blob = new Blob(chunks);

                                // 策略二：不支援分段，直接完整下載
                            } else {
                                for (let i = 0; i < 5; i++) {
                                    try {
                                        blob = await new Promise((resolve, reject) => {
                                            let timeout = null;

                                            const request = GM_xmlhttpRequest({
                                                url,
                                                method: "GET",
                                                responseType: "blob",
                                                onload: res => {
                                                    clearTimeout(timeout);
                                                    return res.status === 200 ? resolve(res.response) : reject(res)
                                                },
                                                onerror: reject,
                                                onprogress: progress => {
                                                    timer();
                                                    if (progress.lengthComputable) {
                                                        const percent = ((progress.loaded / progress.total) * 100).toFixed(1);
                                                        indicator.$text(`${percent}%`);
                                                    }
                                                }
                                            });

                                            function timer() {
                                                // GM_xmlhttpRequest 的超時不太穩定
                                                clearTimeout(timeout);
                                                timeout = setTimeout(() => {
                                                    request.abort();
                                                    reject();
                                                }, 1.5e4)
                                            };
                                        });
                                        break;
                                    } catch (error) {
                                        if (i < 4) await new Promise(res => setTimeout(res, 300));
                                    }
                                }
                            }

                            // 下載完成後的最終檢查
                            if (blob && blob.size > 0) {
                                result(URL.createObjectURL(blob));
                            } else {
                                result(Url);
                            }
                        } catch (error) {
                            // 最終回退：任何下載環節徹底失敗，都使用原始 URL
                            result(Url);
                        } finally {
                            // 無論結果如何，都移除進度指示器
                            indicator.remove();
                        }
                    };

                    async function imgLoad(root, index, mode = "fast") {
                        root.$dAttr("class");

                        const a = root.$q(linkQuery);
                        const safeHref = safeGetHref(a);

                        const img = root.$q("img");
                        const safeSrc = safeGetSrc(img);

                        if (!a && img) {
                            // ? 如果中途被使用者直接點擊
                            img.$addClass("Image-style");
                            return;
                        };

                        const replaceRoot = DLL.isNeko ? root : a;

                        if (experiment) {
                            img.$addClass("Image-loading-indicator-experiment");
                            imgRequest(root, safeHref, href => {
                                imgRendering({
                                    root: replaceRoot, index, thumbUrl: safeSrc, newUrl: href, oldUrl: safeHref, mode
                                })
                            });
                        } else {
                            imgRendering({
                                root: replaceRoot, index, thumbUrl: safeSrc, newUrl: safeHref, mode
                            })
                        }
                    };

                    async function fastAutoLoad() { // mode 1 預設 (快速自動)
                        loadFailedClick();
                        for (const [index, root] of [...thumbnail].entries()) {
                            while (token >= 7) {
                                await Lib.sleep(7e2);
                            };
                            imgLoad(root, index);
                        }
                    };

                    async function slowAutoLoad(index) {
                        if (index === thumbnail.length) return;
                        const root = thumbnail[index];
                        imgLoad(root, index, "slow");
                    };

                    function observeLoad() { // mode 3 (觀察觸發)
                        loadFailedClick();
                        return new IntersectionObserver(observed => {
                            observed.forEach(entry => {
                                if (entry.isIntersecting) {
                                    const root = entry.target;
                                    observer.unobserve(root);
                                    imgLoad(root, root.dataset.index);
                                }
                            });
                        }, { threshold: 0.4 });
                    };

                    /* 模式選擇 */
                    let observer;
                    switch (mode) {
                        case 2:
                            slowAutoLoad(0);
                            break;

                        case 3:
                            observer = observeLoad();
                            thumbnail.forEach((root, index) => {
                                root.dataset.index = index;
                                observer.observe(root);
                            });
                            break;

                        default:
                            fastAutoLoad();
                    }
                });
            },
            async ExtraButton() { /* 下方額外擴充按鈕 */
                Lib.waitEl("h2.site-section__subheading", null, { raf: true, timeout: 5 }).then(comments => {
                    DLL.style.getPostExtra; // 導入需求樣式
                    const getNextPage = loadFunc.extraButtonRequ();

                    const prevBtn = Lib.$q(".post__nav-link.prev, .scrape__nav-link.prev");
                    const nextBtn = Lib.$q(".post__nav-link.next, .scrape__nav-link.next");

                    let toTopBtn, newNextBtn;

                    if (!Lib.$q("#to-top-svg")) {
                        const header = Lib.$q("header");
                        toTopBtn = Lib.createElement(comments, "span", {
                            id: "to-top-svg",
                            innerHTML: `
                            <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512" style="margin-left: 10px;cursor: pointer;">
                                <style>svg{fill: ${DLL.color}}</style>
                                <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM135.1 217.4l107.1-99.9c3.8-3.5 8.7-5.5 13.8-5.5s10.1 2 13.8 5.5l107.1 99.9c4.5 4.2 7.1 10.1 7.1 16.3c0 12.3-10 22.3-22.3 22.3H304v96c0 17.7-14.3 32-32 32H240c-17.7 0-32-14.3-32-32V256H150.3C138 256 128 246 128 233.7c0-6.2 2.6-12.1 7.1-16.3z"></path>
                            </svg>`,
                            on: {
                                click: () => header?.scrollIntoView()
                            }
                        })
                    }

                    if (nextBtn && !Lib.$q("#next-btn")) {
                        const newBtn = nextBtn.$copy(true);
                        newBtn.style = `color: ${DLL.color};`;
                        newBtn.$sAttr("jump", nextBtn.href);
                        newBtn.$dAttr("href");

                        newNextBtn = Lib.createElement(comments, "span", {
                            id: "next-btn",
                            style: "float: right; cursor: pointer;",
                            on: {
                                click: {
                                    listen: () => {
                                        if (DLL.isNeko) {
                                            newBtn.disabled = true;
                                            getNextPage(newBtn.$gAttr("jump"), Lib.$q("main"));
                                        } else {
                                            toTopBtn?.remove();
                                            newNextBtn.remove();
                                            nextBtn.click();
                                        }
                                    },
                                    add: { once: true }
                                }
                            }
                        })

                        newNextBtn.appendChild(newBtn);
                    }
                });
            },
            async CommentFormat() { /* 評論區 重新排版 */
                Lib.addStyle(`
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
                `, "Comment-Effects", false);
            }
        }
    };

    /* ==================== 設置菜單 ==================== */
    async function menuInit(callback = null) {
        const { Log, Transl } = DLL.language(); // 菜單觸發器, 每次創建都會獲取新數據

        callback?.({ Log, Transl }); // 使用 callback 會額外回傳數據
        Lib.regMenu({ [Transl("📝 設置選單")]: () => createMenu(Log, Transl) });
    };
    async function draggable(element) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        const nonDraggableTags = new Set(["SELECT", "BUTTON", "INPUT", "TEXTAREA", "A"]);

        // 將處理函式定義在外面，這樣 onEvent 和 offEvent 才能引用到同一個函式
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            element.style.left = `${initialLeft + dx}px`;
            element.style.top = `${initialTop + dy}px`;
        };

        const handleMouseUp = () => {
            if (!isDragging) return; // 增加一個判斷避免重複觸發
            isDragging = false;
            element.style.cursor = 'auto';
            document.body.style.removeProperty('user-select');

            Lib.offEvent(document, "mousemove");
            Lib.offEvent(document, "mouseup");
        };

        const handleMouseDown = (e) => {
            if (nonDraggableTags.has(e.target.tagName)) return;
            e.preventDefault();

            isDragging = true;

            startX = e.clientX;
            startY = e.clientY;
            const style = window.getComputedStyle(element);
            initialLeft = parseFloat(style.left) || 0;
            initialTop = parseFloat(style.top) || 0;

            element.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';

            Lib.onEvent(document, "mousemove", handleMouseMove);
            Lib.onEvent(document, "mouseup", handleMouseUp);
        };

        Lib.onEvent(element, "mousedown", handleMouseDown);
    };
    function createMenu(Log, Transl) {
        const shadowID = "shadow";
        if (Lib.$q(`#${shadowID}`)) return;

        // 取得圖片設置
        const imgSet = DLL.imgSet();
        const imgSetData = [
            ["圖片高度", "Height", imgSet.Height],
            ["圖片寬度", "Width", imgSet.Width],
            ["圖片最大寬度", "MaxWidth", imgSet.MaxWidth],
            ["圖片間隔高度", "Spacing", imgSet.Spacing]
        ];

        let analyze, img_set, img_input, img_select, set_value, save_cache = {};

        // 創建陰影環境
        const shadow = Lib.createElement(Lib.body, "div", { id: shadowID });
        const shadowRoot = shadow.attachShadow({ mode: "open" });

        // 調整選項
        const getImgOptions = (title, key) => `
            <div>
                <h2 class="narrative">${Transl(title)}：</h2>
                <p>
                    <input type="number" data-key="${key}" class="Image-input-settings" oninput="value = check(value)">
                    <select data-key="${key}" class="Image-input-settings" style="margin-left: 1rem;">
                        <option value="px" selected>px</option>
                        <option value="%">%</option>
                        <option value="rem">rem</option>
                        <option value="vh">vh</option>
                        <option value="vw">vw</option>
                        <option value="auto">auto</option>
                    </select>
                </p>
            </div>
        `;

        // 調整數值腳本
        const menuScript = `
            <script id="menu-script">
                function check(value) {
                    return value.toString().length > 4 || value > 1000
                        ? 1000 : value < 0 ? "" : value;
                }
            </script>
        `;

        const menuSet = DLL.menuSet(); // 取得菜單設置
        // 菜單樣式
        const menuStyle = `
            <style id="menu-style">
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
                    top: ${menuSet.Top};
                    left: ${menuSet.Left};
                    margin: 0;
                    display: flex;
                    overflow: auto;
                    position: fixed;
                    border-radius: 5px;
                    pointer-events: auto;
                    background-color: #2C2E3E;
                    border: 3px solid #EE2B47;
                }
                /* 設定介面 */
                #image-settings-show {
                    width: 0;
                    height: 0;
                    opacity: 0;
                    padding: 10px;
                    overflow: hidden;
                    transition: opacity 0.8s, height 0.8s, width 0.8s;
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
            </style>
        `;

        // 添加菜單主樣式
        const menuMain = `
            ${menuStyle}
            ${menuScript}
            <div class="modal-background">
                <div class="modal-interface">
                    <table class="modal-box">
                        <tr>
                            <td class="menu">
                                <h2 class="menu-text">${Transl("設置菜單")}</h2>
                                <ul>
                                    <li>
                                        <a class="toggle-menu">
                                            <button class="menu-options" id="image-settings">${Transl("圖像設置")}</button>
                                        </a>
                                    <li>
                                    <li>
                                        <a class="toggle-menu">
                                            <button class="menu-options" disabled>null</button>
                                        </a>
                                    <li>
                                </ul>
                            </td>
                            <td>
                                <table>
                                    <tr>
                                        <td class="content" id="set-content">
                                            <div id="image-settings-show"></div>
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
        `;

        // 添加主頁面
        shadowRoot.appendChild(Lib.createDomFragment(menuMain));

        const languageEl = shadowRoot.querySelector("#language");
        const readsetEl = shadowRoot.querySelector("#readsettings");
        const interfaceEl = shadowRoot.querySelector(".modal-interface");
        const imageSetEl = shadowRoot.querySelector("#image-settings-show");

        languageEl.value = Log ?? "en-US"; // 添加語言設置
        draggable(interfaceEl); // 添加拖曳功能

        DLL.menuRule = shadowRoot.querySelector("#menu-style")?.sheet?.cssRules;

        // 菜單調整依賴
        const menuRequ = {
            menuClose() { // 關閉菜單
                shadow.remove();
            },
            menuSave() { // 保存菜單
                const styles = getComputedStyle(interfaceEl);
                Lib.setV(DLL.saveKey.Menu, { Top: styles.top, Left: styles.left }); // 保存設置數據
            },
            imgSave() {
                img_set = imageSetEl.querySelectorAll("p"); // 獲取設定 DOM 參數
                if (img_set.length === 0) return;

                imgSetData.forEach(([title, key, set], index) => {
                    img_input = img_set[index].querySelector("input");
                    img_select = img_set[index].querySelector("select");

                    const inputVal = img_input.value;
                    const selectVal = img_select.value;

                    set_value =
                        selectVal === "auto" ? "auto"
                            : inputVal === "" ? set
                                : `${inputVal}${selectVal}`

                    save_cache[img_input.$gAttr("data-key")] = set_value;
                });

                Lib.setV(DLL.saveKey.Img, save_cache); // 保存設置數據
            },
            async imgSettings() {

                let running = false;
                const handle = (event) => {
                    if (running) return;
                    running = true;

                    const target = event.target;
                    if (!target) {
                        running = false;
                        return;
                    }

                    const key = target.$gAttr("data-key");
                    const value = target?.value;

                    // 是 select
                    if (isNaN(value)) {
                        const input = target.previousElementSibling;
                        if (value === "auto") {
                            input.disabled = true;
                            DLL.stylePointer[key](value);
                        } else {
                            input.disabled = false;
                            DLL.stylePointer[key](`${input.value}${value}`);
                        }
                    }
                    // 是 input
                    else {
                        const select = target.nextElementSibling;
                        DLL.stylePointer[key](`${value}${select.value}`);
                    }

                    setTimeout(() => running = false, 100);
                };

                Lib.onEvent(imageSetEl, "input", handle);
                Lib.onEvent(imageSetEl, "change", handle);
            }
        };

        // 語言選擇
        Lib.onE(languageEl, "change", event => {
            event.stopImmediatePropagation();

            const value = event.currentTarget.value;
            Lib.setV(DLL.saveKey.Lang, value);

            menuRequ.menuSave();
            menuRequ.menuClose();

            menuInit(Updata => {
                createMenu(Updata.Log, Updata.Transl); // 重新創建
            });
        });

        // 監聽菜單的點擊事件
        Lib.onE(interfaceEl, "click", event => {
            const target = event.target;
            const id = target?.id;
            if (!id) return;

            // 菜單功能選擇
            if (id === "image-settings") {
                const imgsetCss = DLL.menuRule[2].style;

                if (imgsetCss.opacity === "0") {
                    let dom = "";

                    imgSetData.forEach(([title, key]) => {
                        dom += getImgOptions(title, key) + "\n";
                    })

                    imageSetEl.insertAdjacentHTML("beforeend", dom);

                    Object.assign(imgsetCss, {
                        width: "auto",
                        height: "auto",
                        opacity: "1"
                    });

                    target.disabled = true;
                    readsetEl.disabled = false; // 點擊圖片設定才會解鎖讀取設置
                    menuRequ.imgSettings();
                }
            }
            // 讀取設置
            else if (id === "readsettings") {
                img_set = imageSetEl.querySelectorAll("p"); // 獲取設定 DOM 參數
                if (img_set.length === 0) return;

                imgSetData.forEach(([title, key, set], index) => {
                    img_input = img_set[index].querySelector("input");
                    img_select = img_set[index].querySelector("select");

                    if (set === "auto") {
                        img_input.disabled = true;
                        img_select.value = set;
                    } else {
                        analyze = set?.match(/^(\d+)(\D+)$/);
                        if (!analyze) return;

                        img_input.value = analyze[1];
                        img_select.value = analyze[2];
                    }
                });
            }
            // 應用保存
            else if (id === "application") {
                menuRequ.imgSave();
                menuRequ.menuSave();
                menuRequ.menuClose();
            }
            // 關閉菜單
            else if (id === "closure") {
                menuRequ.menuClose();
            }
        });
    };

    /* ==================== 功能函數 ==================== */
    function megaUtils(urlRegex) { // ! 這個功能整體都是實驗性的, 只能根據我遇到的狀況處理

        const megaPDecoder = (() => {
            const encoder = new TextEncoder();
            const ITER = 100000;

            const urlBase64ToBase64 = s => s.replace(/-/g, '+').replace(/_/g, '/').replace(/,/g, '');

            function base64ToBytes(b64) {
                try {
                    const raw = atob(b64);
                    const n = raw.length;
                    const out = new Uint8Array(n);
                    for (let i = 0; i < n; i++) out[i] = raw.charCodeAt(i);
                    return out;
                } catch (e) {
                    return null;
                }
            }

            function bytesToBase64Url(bytes) {
                let bin = '';
                for (let i = 0, L = bytes.length; i < L; i++) bin += String.fromCharCode(bytes[i]);
                let b64 = btoa(bin);
                return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            }

            function equalBytesConstTime(a, b) {
                if (!a || !b || a.length !== b.length) return false;
                let r = 0;
                for (let i = 0, L = a.length; i < L; i++) r |= a[i] ^ b[i];
                return r === 0;
            }

            function xorInto(a, b) {
                const n = a.length;
                const out = new Uint8Array(n);
                for (let i = 0; i < n; i++) out[i] = a[i] ^ b[i];
                return out;
            }

            async function importPwKey(password) {
                return crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
            }

            async function deriveDK(pwKey, salt) {
                const bits = await crypto.subtle.deriveBits(
                    { name: 'PBKDF2', salt: salt, iterations: ITER, hash: 'SHA-512' },
                    pwKey,
                    512
                );

                return new Uint8Array(bits);
            }

            async function importMacKey(raw) {
                return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
            }

            return async (pFragmentOrFull, password) => {
                try {
                    if (!pFragmentOrFull || !password) return pFragmentOrFull;

                    let s = String(pFragmentOrFull);
                    const idx = s.indexOf('#P!');
                    if (idx >= 0) s = s.slice(idx + 3);
                    if (s.toUpperCase().startsWith('P!')) s = s.slice(2);

                    let b64 = urlBase64ToBase64(s);

                    const mod = b64.length % 4;
                    if (mod !== 0) b64 += '='.repeat(4 - mod);

                    const data = base64ToBytes(b64);
                    if (!data || data.length < (1 + 1 + 6 + 32 + 32)) {
                        return pFragmentOrFull;
                    }

                    const algorithm = data[0];
                    const type = data[1];
                    const publicHandle = data.subarray(2, 8);
                    const salt = data.subarray(8, 40);
                    const macTag = data.subarray(data.length - 32);
                    const encryptedKey = data.subarray(40, data.length - 32);
                    const keyLen = encryptedKey.length;

                    const pwKey = await importPwKey(password);
                    const dk = await deriveDK(pwKey, salt);

                    if (dk.length < 64 || dk.length < (32 + 32)) {
                        return pFragmentOrFull;
                    }
                    const xorKey = dk.subarray(0, keyLen);
                    const macKey = dk.subarray(32, 64);

                    const recoveredKey = xorInto(encryptedKey, xorKey);

                    const msgLen = 1 + 1 + publicHandle.length + salt.length + encryptedKey.length;
                    const msg = new Uint8Array(msgLen);
                    let off = 0;
                    msg[off++] = algorithm;
                    msg[off++] = type;
                    msg.set(publicHandle, off); off += publicHandle.length;
                    msg.set(salt, off); off += salt.length;
                    msg.set(encryptedKey, off);

                    const macCryptoKey = await importMacKey(macKey);
                    const macBuffer = await crypto.subtle.sign('HMAC', macCryptoKey, msg);
                    const mac = new Uint8Array(macBuffer);

                    if (!equalBytesConstTime(mac, macTag)) {
                        return pFragmentOrFull;
                    }

                    const handleB64Url = bytesToBase64Url(publicHandle);
                    const keyB64Url = bytesToBase64Url(recoveredKey);
                    const fileType = type === 0x00 ? "folder" : "file";
                    return `https://mega.nz/${fileType}/${handleB64Url}#${keyB64Url}`;
                } catch (e) {
                    return pFragmentOrFull;
                }
            }
        })();

        const getDecryptedUrl = async (url, password) => await megaPDecoder(url, password);

        const passwordCleaner = (text) =>
            text.match(/^(Password|Pass|Key)\s*:?\s*(.*)$/i)?.[2]?.trim() ?? "";

        const extractRegex = /(https?:\/\/mega\.nz\/#P![A-Za-z0-9_-]+).*?(?:Password|Pass|Key)\b[\s:]*(?:<[^>]+>)?([\p{L}\p{N}\p{P}_-]+)(?:<[^>]+>)?/gius;

        // return { url: password }
        function extractPasswords(data) {
            const result = {};

            if (typeof data === "string") {
                let match;
                while ((match = extractRegex.exec(data)) !== null) {
                    result[match[1]] = match[2]?.trim() ?? "";
                }
            }

            return result;
        };

        function parsePassword(href, text) {
            let state = false;
            if (!text) return { state, href };

            const lowerText = text.toLowerCase();
            if (text.startsWith("#")) { // 一般狀況, 含有 # 的完整連結
                state = true;
                href += text;
            }
            else if (/^[A-Za-z0-9_!F-]{16,43}$/.test(text)) { // 有尾部字串 但沒有 #
                state = true;
                href += "#" + text;
            }
            else if (lowerText.startsWith("pass") || lowerText.startsWith("key")) { // 密碼字串
                const key = passwordCleaner(text);
                if (key) {
                    state = true;
                    href += "#" + key;
                }
            }

            return {
                state,
                href: href.match(urlRegex)?.[0] ?? href
            }
        };

        async function getPassword(node, href) {
            let state;
            const nextNode = node.nextSibling;

            if (nextNode) { // 擁有下一個節點可能是密碼, 或是網址後半段
                if (nextNode.nodeType === Node.TEXT_NODE) {
                    ({ state, href } = parsePassword(href, nextNode.$text()));
                    if (state) nextNode?.remove(); // 清空字串
                } else if (nextNode.nodeType === Node.ELEMENT_NODE) {
                    const nodeText = [...nextNode.childNodes].find(node => node.nodeType === Node.TEXT_NODE)?.$text() ?? "";
                    ({ state, href } = parsePassword(href, nodeText));
                }
            }

            return href;
        };

        return {
            getPassword,
            getDecryptedUrl,
            extractPasswords,
        };
    }
})();