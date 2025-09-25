// ==UserScript==
// @name         Kemer Enhance
// @name:zh-TW   Kemer 增強
// @name:zh-CN   Kemer 增强
// @name:ja      Kemer 強化
// @name:ko      Kemer 강화
// @name:ru      Kemer Улучшение
// @name:en      Kemer Enhance
// @version      2025.09.25-Beta
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

// @require      https://update.greasyfork.org/scripts/487608/1661432/SyntaxLite_min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/preact/10.27.1/preact.umd.min.js

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
            FixArtist: { // 修復名稱|自訂名稱|外部TAG跳轉|快速預覽內容
                enable: true,
                newtab: true,
                newtab_active: true,
                newtab_insert: true,
            },
        },
        Preview: {
            CardZoom: { mode: 3, enable: true }, // 縮放預覽卡大小 [mode: 1 = 卡片放大 , 2 = 卡片放大 + 懸浮縮放, 3 = 卡片放大 + 自動縮放]
            CardText: { mode: 2, enable: true }, // 預覽卡文字效果 [mode: 1 = 隱藏文字 , 2 = 淡化文字]
            BetterThumbnail: true, // 變更成內頁的縮圖 , nekohouse 是顯示原圖 (但排除 gif)
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
    let Url = Lib.$url;
    const DLL = (() => {
        const color = {
            kemono: "#e8a17d !important",
            coomer: "#99ddff !important",
            nekohouse: "#bb91ff !important"
        }[Lib.$domain.split(".")[0]];
        const saveKey = {
            Img: "ImgStyle",
            Lang: "Language",
            Menu: "MenuPoint"
        };
        const userSet = {
            menuSet: () => Lib.getV(saveKey.Menu, {
                Top: "10vh",
                Left: "10vw"
            }),
            imgSet: () => Lib.getV(saveKey.Img, {
                Width: "auto",
                Height: "auto",
                Spacing: "0px",
                MaxWidth: "100%"
            })
        };
        let imgRule, menuRule;
        const importantStyle = (element, property, value) => {
            requestAnimationFrame(() => {
                element.style.setProperty(property, value, "important");
            });
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
        const style = {
            get getGlobal() {
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
                        width: 5rem;
                        height: 100%;
                    }
                    fix_cont fix_wrapper:hover fix_name {
                        background-color: #fff;
                    }
                    fix_cont fix_wrapper:hover fix_edit {
                        display: block;
                    }

                    .post-show-box {
                        bottom: 85%;
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
                    .post-show-box::-webkit-scrollbar {
                        display: none;
                    }
                    .post-show-box img {
                        height: 23vh;
                        margin: 0 5px;
                        min-width: 55%;
                    }
                    .fancy-image__image {
                        z-index: 1;
                        position: relative;
                    }
                    .fancy-image__picture:before {
                        content: "";
                        z-index: 0;
                        bottom: 20%;
                        width: 100px;
                        height: 105px;
                        position: absolute;
                    }
                `, "Global-Effects", false);
            },
            get getPostview() {
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
                Lib.storeListen(Object.values(saveKey), call => {
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
            get getPostExtra() {
                Lib.addStyle(`
                    #main section {
                        width: 100%;
                    }
                    #next_box a {
                        cursor: pointer;
                    }
                    #next_box a:hover {
                        background-color: ${color};
                    }
                `, "Post-Extra", false);
            }
        };
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
        const Posts = /\/posts\/?.*$/;
        const Search = /\/artists\/?.*$/;
        const User = /\/.+\/user\/[^\/]+(\?.*)?$/;
        const Content = /\/.+\/user\/.+\/post\/.+$/;
        const Favor = /\/favorites\?type=post\/?.*$/;
        const Link = /\/.+\/user\/[^\/]+\/links\/?.*$/;
        const FavorArtist = /\/favorites(?:\?(?!type=post).*)?$/;
        const Recommended = /\/.+\/user\/[^\/]+\/recommended\/?.*$/;
        const Announcement = /\/(dms|(?:.+\/user\/[^\/]+\/announcements))(\?.*)?$/;
        return {
            isContent: () => Content.test(Url),
            isAnnouncement: () => Announcement.test(Url),
            isSearch: () => Search.test(Url) || Link.test(Url) || Recommended.test(Url) || FavorArtist.test(Url),
            isPreview: () => Posts.test(Url) || User.test(Url) || Favor.test(Url),
            isNeko: Lib.$domain.startsWith("nekohouse"),
            language() {
                const Log = Lib.getV(saveKey.Lang);
                const ML = Lib.translMatcher(word, Log);
                return {
                    Log: Log,
                    Transl: str => ML[str] ?? str
                };
            },
            responseRule: {
                text: res => res.text(),
                json: res => res.json(),
                blob: res => res.blob(),
                arrayBuffer: res => res.arrayBuffer(),
                formData: res => res.formData(),
                document: async res => {
                    res = await res.text();
                    return new DOMParser().parseFromString(res, "text/html");
                }
            },
            fetchApi(url, callback, {
                responseType = "json",
                headers = {
                    Accept: "text/css"
                }
            } = {}) {
                fetch(url, {
                    headers: headers
                }).then(async response => {
                    if (!response.ok) {
                        const text = await response.text();
                        throw new Error(`\nFetch failed\nurl: ${response.url}\nstatus: ${response.status}\nstatusText: ${text}`);
                    }
                    return await this.responseRule[responseType](response);
                }).then(callback).catch(error => {
                    Lib.log(error).error;
                });
            },
            ...userSet,
            style: style,
            menuRule: menuRule,
            color: color,
            saveKey: saveKey,
            stylePointer: stylePointer,
            Link: Link,
            Posts: Posts,
            User: User,
            Favor: Favor,
            Search: Search,
            Content: Content,
            FavorArtist: FavorArtist,
            Announcement: Announcement,
            Recommended: Recommended,
            thumbnailApi: `https://img.${Lib.$domain}/thumbnail/data`,
            registered: new Set(),
            supportImg: new Set(["jpg", "jpeg", "png", "gif", "bmp", "webp", "avif", "heic", "svg"])
        };
    })();
    const Enhance = (() => {
        const order = {
            Global: ["BlockAds", "CacheFetch", "SidebarCollapse", "DeleteNotice", "TextToLink", "FixArtist", "KeyScroll"],
            Preview: ["CardText", "CardZoom", "NewTabOpens", "QuickPostToggle", "BetterThumbnail"],
            Content: ["LinkBeautify", "VideoBeautify", "OriginalImage", "ExtraButton", "CommentFormat"]
        };
        const loadFunc = {
            globalCache: undefined,
            previewCache: undefined,
            contentCache: undefined,
            Global() {
                return this.globalCache ??= globalFunc();
            },
            Preview() {
                return this.previewCache ??= previewFunc();
            },
            Content() {
                return this.contentCache ??= contentFunc();
            }
        };
        async function call(page, config = User_Config[page]) {
            const func = loadFunc[page]();
            for (const ord of order[page]) {
                let userConfig = config[ord];
                if (!userConfig) continue;
                if (typeof userConfig !== "object") {
                    userConfig = {
                        enable: true
                    };
                } else if (!userConfig.enable) continue;
                func[ord]?.(userConfig);
            }
        }
        return {
            async run() {
                call("Global");
                if (DLL.isPreview()) call("Preview"); else if (DLL.isContent()) {
                    DLL.style.getPostview;
                    call("Content");
                    menuInit();
                }
            }
        };
    })();
    Enhance.run();
    const waitDom = new MutationObserver(() => {
        waitDom.disconnect();
        Enhance.run();
    });
    Lib.onUrlChange(change => {
        Url = change.url;
        waitDom.observe(document, {
            attributes: true,
            childList: true,
            subtree: true,
            characterData: true
        });
        Lib.body.$sAttr("Enhance", true);
    });
    function globalFunc() {
        const loadFunc = {
            textToLinkCache: undefined,
            textToLinkRequ({
                newtab,
                newtab_active,
                newtab_insert
            }) {
                return this.textToLinkCache ??= {
                    exclusionRegex: /onfanbokkusuokibalab\.net/,
                    urlRegex: /(?:(?:https?|ftp|mailto|file|data|blob|ws|wss|ed2k|thunder):\/\/|(?:[-\w]+\.)+[a-zA-Z]{2,}(?:\/|$)|\w+@[-\w]+\.[a-zA-Z]{2,})[^\s]*?(?=[{}「」『』【】\[\]（）()<>、"'，。！？；：…—～~]|$|\s)/g,
                    exclusionTags: new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "CANVAS", "IFRAME", "AUDIO", "VIDEO", "EMBED", "OBJECT", "SOURCE", "TRACK", "CODE", "KBD", "SAMP", "TEMPLATE", "SLOT", "PARAM", "META", "LINK", "IMG", "PICTURE", "FIGURE", "FIGCAPTION", "MATH", "PORTAL", "METER", "PROGRESS", "OUTPUT", "TEXTAREA", "SELECT", "OPTION", "DATALIST", "FIELDSET", "LEGEND", "MAP", "AREA"]),
                    urlMatch(str) {
                        this.urlRegex.lastIndex = 0;
                        return this.urlRegex.test(str);
                    },
                    getTextNodes(root) {
                        const nodes = new Set();
                        const tree = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                            acceptNode: node => {
                                const parentElement = node.parentElement;
                                if (!parentElement || this.exclusionTags.has(parentElement.tagName)) return NodeFilter.FILTER_REJECT;
                                const content = node.$text();
                                if (!content || this.exclusionRegex.test(content)) return NodeFilter.FILTER_REJECT;
                                return this.urlMatch(content) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                            }
                        });
                        while (tree.nextNode()) {
                            nodes.add(tree.currentNode.parentElement);
                        }
                        return [...nodes];
                    },
                    searchPassword(href, text) {
                        let state = false;
                        if (!text) return {
                            state: state,
                            href: href
                        };
                        const lowerText = text.toLowerCase();
                        if (text.startsWith("#")) {
                            state = true;
                            href += text;
                        } else if (/^[A-Za-z0-9_-]{16,43}$/.test(text)) {
                            state = true;
                            href += "#" + text;
                        } else if (lowerText.startsWith("pass") || lowerText.startsWith("key")) {
                            const key = text.match(/^(Pass|Key)\s*:?\s*(.*)$/i)?.[2]?.trim() ?? "";
                            if (key) {
                                state = true;
                                href += "#" + key;
                            }
                        }
                        return {
                            state: state,
                            href: href.match(this.urlRegex)?.[0] ?? href
                        };
                    },
                    getMegaPass(node, href) {
                        let state;
                        const nextNode = node.nextSibling;
                        if (nextNode) {
                            if (nextNode.nodeType === Node.TEXT_NODE) {
                                ({
                                    state,
                                    href
                                } = this.searchPassword(href, nextNode.$text()));
                                if (state) nextNode.remove();
                            } else if (nextNode.nodeType === Node.ELEMENT_NODE) {
                                const nodeText = [...nextNode.childNodes].find(node => node.nodeType === Node.TEXT_NODE)?.$text() ?? "";
                                ({
                                    state,
                                    href
                                } = this.searchPassword(href, nodeText));
                            }
                        }
                        return href;
                    },
                    protocolParse(url) {
                        if (/^[a-zA-Z][\w+.-]*:\/\//.test(url) || /^[a-zA-Z][\w+.-]*:/.test(url)) return url;
                        if (/^([\w-]+\.)+[a-z]{2,}(\/|$)/i.test(url)) return "https://" + url;
                        if (/^\/\//.test(url)) return "https:" + url;
                        return url;
                    },
                    async parseModify(father, content) {
                        const basicHref = father?.href || "";
                        father.$iHtml(content.replace(this.urlRegex, url => {
                            const decode = decodeURIComponent(url).trim();
                            return basicHref === decode ? father : `<a href="${this.protocolParse(decode)}">${decode}</a>`;
                        }));
                    },
                    async jumpTrigger(root) {
                        const [active, insert] = [newtab_active, newtab_insert];
                        Lib.onEvent(root, "click", event => {
                            const target = event.target.closest("a:not(.fileThumb)");
                            if (!target || target.$hAttr("download")) return;
                            event.preventDefault();
                            !newtab ? location.assign(target.href) : GM_openInTab(target.href, {
                                active: active,
                                insert: insert
                            });
                        }, {
                            capture: true
                        });
                    }
                };
            },
            fixArtistCache: undefined,
            fixArtistRequ() {
                if (!this.fixArtistCache) {
                    const fixRequ = {
                        recordCache: undefined,
                        fixCache: new Map(),
                        getRecord() {
                            const record = Lib.local("fix_record_v2", {
                                error: new Map()
                            });
                            return record instanceof Map ? record : new Map();
                        },
                        async saveRecord(save) {
                            await Lib.local("fix_record_v2", {
                                value: new Map([...this.getRecord(), ...save])
                            });
                            this.fixCache.clear();
                        },
                        replaceUrlTail(url, tail) {
                            const uri = new URL(url);
                            uri.pathname = tail;
                            url = uri.href;
                            return url;
                        },
                        specialServer: {
                            x: "twitter",
                            maker_id: "dlsite"
                        },
                        parseUrlInfo(uri) {
                            uri = uri.match(/\/([^\/]+)\/(?:user|server|creator|fanclubs)\/([^\/?]+)/) || uri.match(/\/([^\/]+)\/([^\/]+)$/);
                            uri = uri.splice(1);
                            let server = uri[0].replace(/\/?(www\.|\.com|\.to|\.jp|\.net|\.adult|user\?u=)/g, "");
                            let user = uri[1];
                            server = this.specialServer[server] ?? server;
                            return uri ? {
                                server: server,
                                user: user
                            } : {
                                uri: uri
                            };
                        },
                        saveWork: (() => Lib.$debounce(() => fixRequ.saveRecord(fixRequ.fixCache), 1e3))(),
                        async fixRequest(url, headers = {}) {
                            return new Promise(resolve => {
                                GM_xmlhttpRequest({
                                    method: "GET",
                                    url: url,
                                    headers: headers,
                                    responseType: "json",
                                    onload: response => resolve(response),
                                    onerror: () => resolve(),
                                    ontimeout: () => resolve()
                                });
                            });
                        },
                        async getPixivName(id) {
                            const response = await this.fixRequest(`https://www.pixiv.net/ajax/user/${id}?full=1&lang=ja`, {
                                referer: "https://www.pixiv.net/"
                            });
                            if (response.status === 200) {
                                const user = response.response;
                                let user_name = user.body.name;
                                user_name = user_name.replace(/(c\d+)?([日月火水木金土]曜日?|[123１２３一二三]日目?)[東南西北]..?\d+\w?/i, "");
                                user_name = user_name.replace(/[@＠]?(fanbox|fantia|skeb|ファンボ|リクエスト|お?仕事|新刊|単行本|同人誌)+(.*(更新|募集|公開|開設|開始|発売|販売|委託|休止|停止)+中?[!！]?$|$)/gi, "");
                                user_name = user_name.replace(/\(\)|（）|「」|【】|[@＠_＿]+$/g, "").trim();
                                return user_name;
                            } else return;
                        },
                        async getCandfansName(id) {
                            const response = await this.fixRequest(`https://candfans.jp/api/contents/get-timeline?user_id=${id}&record=1`);
                            if (response.status === 200) {
                                const user = response.response.data[0];
                                const user_code = user?.user_code || "";
                                const username = user?.username || "";
                                return [user_code, username];
                            } else return;
                        },
                        candfansPageAdapt(oldId, newId, oldUrl, oldName, newName) {
                            if (DLL.isSearch()) {
                                oldId = newId ? newId : oldId;
                            } else {
                                oldUrl = newId ? this.replaceUrlTail(oldUrl, newId) : oldUrl;
                            }
                            oldName = newName ? newName : oldName;
                            return [oldId, oldUrl, oldName];
                        },
                        supportFixName: new Set(["pixiv", "fanbox", "candfans"]),
                        supportFixTag: {
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
                            Fansly: "https://fansly.com/{name}/posts"
                        },
                        async fixUpdateUi(mainUrl, otherUrl, user, nameEl, tagEl, showText, appendTag) {
                            nameEl.$sAttr("style", "display: none;");
                            if (nameEl.previousElementSibling?.tagName !== "FIX_WRAPPER") {
                                nameEl.$iAdjacent(`
                                    <fix_wrapper>
                                        <fix_name jump="${mainUrl}">${showText.trim()}</fix_name>
                                        <fix_edit id="${user}">Edit</fix_edit>
                                    </fix_wrapper>
                                `, "beforebegin");
                            }
                            const [tag_text, support_id, support_name] = [tagEl.$text(), this.supportFixTag.ID, this.supportFixTag.NAME];
                            if (!tag_text) return;
                            const [mark, matchId] = support_id.test(tag_text) ? ["{id}", support_id] : support_name.test(tag_text) ? ["{name}", support_name] : ["", null];
                            if (!mark) return;
                            tagEl.$iHtml(tag_text.replace(matchId, tag => {
                                let supported = false;
                                const supportFormat = appendTag ? (supported = this.supportFixTag[`${tag}${appendTag}`],
                                    supported ? (user = this.parseUrlInfo(otherUrl).user,
                                        supported) : this.supportFixTag[tag]) : this.supportFixTag[tag];
                                return `<fix_tag jump="${supportFormat.replace(mark, user)}">${tag}</fix_tag>`;
                            }));
                        },
                        async fixTrigger(data) {
                            let {
                                mainUrl,
                                otherUrl,
                                server,
                                user,
                                nameEl,
                                tagEl,
                                appendTag
                            } = data;
                            let recordName = this.recordCache.get(user);
                            if (recordName) {
                                if (server === "candfans") {
                                    [user, mainUrl, recordName] = this.candfansPageAdapt(user, recordName[0], mainUrl, nameEl.$text(), recordName[1]);
                                }
                                this.fixUpdateUi(mainUrl, otherUrl, user, nameEl, tagEl, recordName, appendTag);
                            } else {
                                if (this.supportFixName.has(server)) {
                                    if (server === "candfans") {
                                        const [user_code, username] = await this.getCandfansName(user) ?? nameEl.$text();
                                        if (user_code && username) this.fixCache.set(user, [user_code, username]);
                                        [user, mainUrl, recordName] = this.candfansPageAdapt(user, user_code, mainUrl, nameEl.$text(), username);
                                        this.fixUpdateUi(mainUrl, otherUrl, user, nameEl, tagEl, username, appendTag);
                                    } else {
                                        const username = await this.getPixivName(user) ?? nameEl.$text();
                                        this.fixUpdateUi(mainUrl, otherUrl, user, nameEl, tagEl, username, appendTag);
                                        this.fixCache.set(user, username);
                                    }
                                    this.saveWork();
                                } else {
                                    this.fixUpdateUi(mainUrl, otherUrl, user, nameEl, tagEl, nameEl.$text(), appendTag);
                                }
                            }
                        },
                        async searchFix(items) {
                            items.$sAttr("fix", true);
                            const url = items.href;
                            const img = items.$q("img");
                            const {
                                server,
                                user
                            } = this.parseUrlInfo(url);
                            img.$sAttr("jump", url);
                            this.fixTrigger({
                                mainUrl: url,
                                otherUrl: "",
                                server: server,
                                user: user,
                                nameEl: items.$q(".user-card__name"),
                                tagEl: items.$q(".user-card__service"),
                                appendTag: ""
                            });
                        },
                        async otherFix(artist, tag = "", mainUrl = null, otherUrl = null, reTag = "fix_view") {
                            try {
                                const parent = artist.parentElement;
                                const url = mainUrl ?? parent.href;
                                const {
                                    server,
                                    user
                                } = this.parseUrlInfo(url);
                                await this.fixTrigger({
                                    mainUrl: url,
                                    otherUrl: otherUrl,
                                    server: server,
                                    user: user,
                                    nameEl: artist,
                                    tagEl: tag,
                                    appendTag: otherUrl ? "Post" : ""
                                });
                                parent.replaceWith(Lib.createElement(reTag, {
                                    innerHTML: parent.$iHtml()
                                }));
                            } catch { }
                        },
                        async dynamicFix(element) {
                            Lib.$observer(element, () => {
                                this.recordCache = this.getRecord();
                                for (const items of element.$qa("a")) {
                                    !items.$gAttr("fix") && this.searchFix(items);
                                }
                            }, {
                                mark: "dynamic-fix",
                                subtree: false,
                                debounce: 50
                            });
                        }
                    };
                    fixRequ.recordCache = fixRequ.getRecord();
                    this.fixArtistCache = fixRequ;
                }
                return this.fixArtistCache;
            }
        };
        return {
            async SidebarCollapse() {
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
            async DeleteNotice() {
                Lib.waitEl("#announcement-banner", null, {
                    throttle: 50,
                    timeout: 5
                }).then(announcement => announcement.remove());
            },
            async BlockAds() {
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
                }
                if (DLL.registered.has("BlockAds")) return;
                Lib.addStyle(`
                    .root--ujvuu, [id^="ts_ad_native_"], [id^="ts_ad_video_"] {display: none !important}
                `, "Ad-blocking-style");
                const domains = new Set(["go.mnaspm.com", "go.reebr.com", "creative.reebr.com", "tsyndicate.com", "tsvideo.sacdnssedge.com"]);
                const originalRequest = XMLHttpRequest;
                XMLHttpRequest = new Proxy(originalRequest, {
                    construct: function (target, args) {
                        const xhr = new target(...args);
                        return new Proxy(xhr, {
                            get: function (target, prop, receiver) {
                                if (prop === "open") {
                                    return function (method, url) {
                                        try {
                                            if (typeof url !== "string" || url.endsWith(".m3u8")) return;
                                            if ((url.startsWith("http") || url.startsWith("//")) && domains.has(new URL(url).host)) return;
                                        } catch { }
                                        return target[prop].apply(target, arguments);
                                    };
                                }
                                return Reflect.get(target, prop, receiver);
                            }
                        });
                    }
                });
                DLL.registered.add("BlockAds");
            },
            async CacheFetch() {
                if (DLL.isNeko || DLL.registered.has("CacheFetch")) return;
                const script = `
                    const cache = new Map();
                    const originalFetch = window.fetch;

                    window.fetch = async function (...args) {
                        const input = args[0];
                        const options = args[1] || {};

                        const url = (typeof input === 'string') ? input : input.url;
                        const method = options.method || (typeof input === 'object' ? input.method : 'GET') || 'GET';

                        // 如果不是 GET 請求，或有 X-Bypass-CacheFetch 標頭，立即返回原始請求
                        if (method.toUpperCase() !== 'GET' || options.headers?.['X-Bypass-CacheFetch']) {
                            return originalFetch.apply(this, args);
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
                            const response = await originalFetch.apply(this, args);

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
                                        }
                                    } catch { }
                                })();
                            }

                            return response;
                        } catch (error) {
                            throw error;
                        }
                    };
                `;
                eval(script);
                Lib.addScript(script, "Cache-Fetch", false);
                DLL.registered.add("CacheFetch");
            },
            async TextToLink(config) {
                if (!DLL.isContent() && !DLL.isAnnouncement()) return;
                const func = loadFunc.textToLinkRequ(config);
                if (DLL.isContent()) {
                    Lib.waitEl(".post__body, .scrape__body", null).then(body => {
                        let [article, content] = [body.$q("article"), body.$q(".post__content, .scrape__content")];
                        if (article) {
                            func.jumpTrigger(content);
                            for (const span of article.$qa("span.choice-text")) {
                                func.parseModify(span, span.$text());
                            }
                        } else if (content) {
                            func.jumpTrigger(content);
                            func.getTextNodes(content).forEach(node => {
                                let text = node.$text();
                                if (text.startsWith("https://mega.nz") && !text.includes("#")) {
                                    text = func.getMegaPass(node, text);
                                }
                                func.parseModify(node, text);
                            });
                        } else {
                            const attachments = body.$q(".post__attachments, .scrape__attachments");
                            attachments && func.jumpTrigger(attachments);
                        }
                    });
                } else if (DLL.isAnnouncement()) {
                    Lib.waitEl(".card-list__items pre", null, {
                        raf: true
                    }).then(() => {
                        const items = Lib.$q(".card-list__items");
                        func.jumpTrigger(items);
                        func.getTextNodes(items).forEach(node => {
                            func.parseModify(node, node.$text());
                        });
                    });
                }
            },
            async FixArtist({
                newtab,
                newtab_active,
                newtab_insert
            }) {
                DLL.style.getGlobal;
                const func = loadFunc.fixArtistRequ();
                const [active, insert] = [newtab_active, newtab_insert];
                Lib.onEvent(Lib.body, "click", event => {
                    const target = event.target;
                    if (target.tagName === "TEXTAREA") {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                    } else if (target.matches("fix_edit")) {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        Lib.$q(".edit_textarea")?.remove();
                        const display = target.previousElementSibling;
                        const text = Lib.createElement("textarea", {
                            class: "edit_textarea",
                            style: `height: ${display.scrollHeight + 10}px;`
                        });
                        const original_name = display.$text();
                        text.value = original_name.trim();
                        display.$iAdjacent(text, "beforebegin");
                        text.scrollTop = 0;
                        setTimeout(() => {
                            text.focus();
                            setTimeout(() => {
                                text.on("blur", () => {
                                    const change_name = text.value.trim();
                                    if (change_name != original_name) {
                                        display.$text(change_name);
                                        func.saveRecord(new Map([[target.id, change_name]]));
                                    }
                                    text.remove();
                                }, {
                                    once: true,
                                    passive: true
                                });
                            }, 50);
                        }, 300);
                    } else if (newtab && (Lib.platform !== "Mobile" || DLL.isContent()) && (target.matches("fix_name") || target.matches("fix_tag") || target.matches(".fancy-image__image")) || !newtab && DLL.isContent()) {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        const jump = target.$gAttr("jump");
                        if (!target.parentElement.matches("fix_cont") && jump) {
                            DLL.isSearch() || target.matches("fix_tag") ? GM_openInTab(jump, {
                                active: active,
                                insert: insert
                            }) : location.assign(jump);
                        } else if (jump) {
                            newtab && DLL.isContent() && target.matches("fix_name") ? GM_openInTab(jump, {
                                active: active,
                                insert: insert
                            }) : location.assign(jump);
                        } else if (target.tagName === "IMG") {
                            location.assign(target.closest("a").href);
                        }
                    }
                }, {
                    capture: true,
                    mark: "FixArtist"
                });
                if (Lib.platform === "Desktop") {
                    let currentBox, currentTarget;
                    Lib.onEvent(Lib.body, "mouseover", Lib.$debounce(event => {
                        let target = event.target;
                        if (target.tagName === "IMG" && target.$hAttr("jump")) {
                            currentTarget = target.parentElement;
                            currentBox = target.previousElementSibling;
                        } else if (target.tagName === "PICTURE") {
                            currentTarget = target;
                            currentBox = target.$q(".post-show-box");
                            target = target.$q("img");
                        } else return;
                        if (!currentBox && target) {
                            currentBox = Lib.createElement("div", {
                                text: "Loading...",
                                style: "display: none;",
                                class: "post-show-box",
                                on: {
                                    type: "wheel",
                                    listener: event => {
                                        event.preventDefault();
                                        event.currentTarget.scrollLeft += event.deltaY;
                                    }
                                }
                            });
                            target.$iAdjacent(currentBox, "beforebegin");
                            const url = target.$gAttr("jump");
                            if (!url.includes("discord")) {
                                const uri = new URL(url);
                                const api = DLL.isNeko ? url : `${uri.origin}/api/v1${uri.pathname}/posts`;
                                DLL.fetchApi(api, data => {
                                    if (DLL.isNeko) data = data.$qa(".post-card__image");
                                    currentBox.$text("");
                                    for (const [index, post] of data.entries()) {
                                        let src = "";
                                        if (DLL.isNeko) src = post.src ?? ""; else {
                                            for (const {
                                                path
                                            } of [post.file, ...post?.attachments || {}]) {
                                                if (!path) continue;
                                                const isImg = DLL.supportImg.has(path.split(".")[1]);
                                                if (!isImg) continue;
                                                src = DLL.thumbnailApi + path;
                                                break;
                                            }
                                        }
                                        if (!src) continue;
                                        Lib.createElement(currentBox, "img", {
                                            src: src,
                                            loading: "lazy",
                                            attr: {
                                                number: index + 1
                                            }
                                        });
                                    }
                                    if (currentBox.childElementCount === 0) currentBox.$text("No Image");
                                }, {
                                    responseType: DLL.isNeko ? "document" : "json"
                                });
                            } else currentBox.$text("Not Supported");
                        }
                        currentBox?.$sAttr("style", "display: block;");
                    }, 300), {
                        passive: true,
                        mark: "PostShow"
                    });
                    Lib.onEvent(Lib.body, "mouseout", event => {
                        if (!currentTarget) return;
                        if (currentTarget.contains(event.relatedTarget)) return;
                        currentTarget = null;
                        currentBox?.$sAttr("style", "display: none;");
                    }, {
                        passive: true,
                        mark: "PostHide"
                    });
                }
                if (DLL.isSearch()) {
                    Lib.waitEl(".card-list__items", null, {
                        raf: true,
                        timeout: 10
                    }).then(card_items => {
                        if (DLL.Link.test(Url) || DLL.Recommended.test(Url)) {
                            const artist = Lib.$q("span[itemprop='name']");
                            artist && func.otherFix(artist);
                        }
                        func.dynamicFix(card_items);
                        card_items.$sAttr("fix-trigger", true);
                    });
                } else if (DLL.isContent()) {
                    Lib.waitEl(["h1 span:nth-child(2)", ".post__user-name, .scrape__user-name"], null, {
                        raf: true,
                        timeout: 10
                    }).then(([title, artist]) => {
                        func.otherFix(artist, title, artist.href, Lib.url, "fix_cont");
                    });
                } else {
                    Lib.waitEl("span[itemprop='name']", null, {
                        raf: true,
                        timeout: 3
                    }).then(artist => {
                        func.otherFix(artist);
                    });
                }
            },
            async KeyScroll({
                mode
            }) {
                if (Lib.platform === "Mobile" || DLL.registered.has("KeyScroll")) return;
                const Scroll_Requ = {
                    Scroll_Pixels: 2,
                    Scroll_Interval: 800
                };
                const UP_ScrollSpeed = Scroll_Requ.Scroll_Pixels * -1;
                let Scroll, Up_scroll = false, Down_scroll = false;
                const [TopDetected, BottomDetected] = [Lib.$throttle(() => {
                    Up_scroll = Lib.sY == 0 ? false : true;
                }, 600), Lib.$throttle(() => {
                    Down_scroll = Lib.sY + Lib.iH >= Lib.html.scrollHeight ? false : true;
                }, 600)];
                switch (mode) {
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
                }, 100), {
                    capture: true
                });
                DLL.registered.add("KeyScroll");
            }
        };
    }
    function previewFunc() {
        const loadFunc = {
            betterThumbnailCache: undefined,
            betterThumbnailRequ() {
                return this.betterThumbnailCache ??= {
                    imgReload: (img, thumbnailSrc, retry) => {
                        if (retry <= 0) {
                            img.src = thumbnailSrc;
                            return;
                        }
                        const src = img.src;
                        img.onload = function () {
                            img.onload = img.onerror = null;
                        };
                        img.onerror = function () {
                            img.onload = img.onerror = null;
                            img.src = thumbnailSrc;
                            const self = this.betterThumbnailCache;
                            setTimeout(() => {
                                self?.imgReload(img, thumbnailSrc, --retry);
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
                };
            }
        };
        return {
            async NewTabOpens({
                newtab_active,
                newtab_insert
            }) {
                const [active, insert] = [newtab_active, newtab_insert];
                Lib.onEvent(Lib.body, "click", event => {
                    const target = event.target.closest("article a");
                    target && (event.preventDefault(), event.stopImmediatePropagation(),
                        GM_openInTab(target.href, {
                            active: active,
                            insert: insert
                        }));
                }, {
                    capture: true,
                    mark: "NewTabOpens"
                });
            },
            async QuickPostToggle() {
                if (!DLL.isNeko || DLL.registered.has("QuickPostToggle")) return;
                Lib.waitEl("menu", null, {
                    all: true,
                    timeout: 5
                }).then(menu => {
                    DLL.registered.add("QuickPostToggle");
                    function Rendering({
                        href,
                        className,
                        textContent,
                        style
                    }) {
                        return preact.h("a", {
                            href: href,
                            className: className,
                            style: style
                        }, preact.h("b", null, textContent));
                    }
                    const pageContentCache = new Map();
                    const MAX_CACHE_SIZE = 30;
                    function cleanupCache() {
                        if (pageContentCache.size >= MAX_CACHE_SIZE) {
                            const firstKey = pageContentCache.keys().next().value;
                            pageContentCache.delete(firstKey);
                        }
                    }
                    async function fetchPage(url, abortSignal) {
                        if (pageContentCache.has(url)) {
                            const cachedContent = pageContentCache.get(url);
                            pageContentCache.delete(url);
                            pageContentCache.set(url, cachedContent);
                            const clonedContent = cachedContent.cloneNode(true);
                            Lib.$q(".card-list--legacy").replaceChildren(...clonedContent.childNodes);
                            return Promise.resolve();
                        }
                        return new Promise((resolve, reject) => {
                            const request = GM_xmlhttpRequest({
                                method: "GET",
                                url: url,
                                onload: response => {
                                    if (abortSignal?.aborted) return reject(new Error("Aborted"));
                                    if (response.status !== 200) return reject(new Error("Server error"));
                                    const newContent = response.responseXML.$q(".card-list--legacy");
                                    cleanupCache();
                                    const contentToCache = newContent.cloneNode(true);
                                    pageContentCache.set(url, contentToCache);
                                    Lib.$q(".card-list--legacy").replaceChildren(...newContent.childNodes);
                                    resolve();
                                },
                                onerror: () => reject(new Error("Network error"))
                            });
                            if (abortSignal) {
                                abortSignal.addEventListener("abort", () => {
                                    request.abort?.();
                                    reject(new Error("Aborted"));
                                });
                            }
                        });
                    }
                    const totalPages = Math.ceil(+menu[0].previousElementSibling.$text().split("of")[1].trim() / 50);
                    const pageLinks = [Url, ...Array(totalPages - 1).fill().map((_, i) => `${Url}?o=${(i + 1) * 50}`)];
                    const MAX_VISIBLE = 11;
                    const hasScrolling = totalPages > 11;
                    let buttonCache = null;
                    let pageButtonIndexMap = null;
                    let visibleRangeCache = {
                        page: -1,
                        range: null
                    };
                    function getVisibleRange(currentPage) {
                        if (visibleRangeCache.page === currentPage) {
                            return visibleRangeCache.range;
                        }
                        let range;
                        if (!hasScrolling) {
                            range = {
                                start: 1,
                                end: totalPages
                            };
                        } else {
                            let start = 1;
                            if (currentPage >= MAX_VISIBLE && totalPages > MAX_VISIBLE) {
                                start = currentPage - MAX_VISIBLE + 2;
                            }
                            range = {
                                start: start,
                                end: Math.min(totalPages, start + MAX_VISIBLE - 1)
                            };
                        }
                        visibleRangeCache = {
                            page: currentPage,
                            range: range
                        };
                        return range;
                    }
                    function createButton(text, page, isDisabled = false, isCurrent = false, isHidden = false) {
                        return preact.h(Rendering, {
                            href: isDisabled ? undefined : pageLinks[page - 1],
                            textContent: text,
                            className: `${isDisabled ? "pagination-button-disabled" : ""} ${isCurrent ? "pagination-button-current" : ""}`.trim(),
                            style: isHidden ? {
                                display: "none"
                            } : undefined
                        });
                    }
                    function createPaginationElements(currentPage = 1) {
                        const {
                            start,
                            end
                        } = getVisibleRange(currentPage);
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
                    }
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
                        pageButtonIndexMap = new Map();
                        buttonCache.menu1.pages.forEach((btn, index) => {
                            const pageNum = index + 1;
                            pageButtonIndexMap.set(pageNum, index);
                        });
                    }
                    function updateNavigationButtons(menuData, targetPage) {
                        const isFirstPage = targetPage === 1;
                        const isLastPage = targetPage === totalPages;
                        const {
                            nav
                        } = menuData;
                        const navUpdates = [];
                        if (hasScrolling) {
                            navUpdates.push([nav.first, isFirstPage, pageLinks[0]], [nav.prev, isFirstPage, pageLinks[targetPage - 2]], [nav.next, isLastPage, pageLinks[targetPage]], [nav.last, isLastPage, pageLinks[totalPages - 1]]);
                        } else {
                            navUpdates.push([nav.prev, isFirstPage, pageLinks[targetPage - 2]], [nav.next, isLastPage, pageLinks[targetPage]]);
                        }
                        navUpdates.forEach(([btn, isDisabled, href]) => {
                            btn.$toggleClass("pagination-button-disabled", isDisabled);
                            if (isDisabled) {
                                btn.$dAttr("href");
                            } else {
                                btn.href = href;
                            }
                        });
                    }
                    function updatePageButtons(menuData, targetPage, visibleRange) {
                        const {
                            start,
                            end
                        } = visibleRange;
                        const {
                            pages
                        } = menuData;
                        const currentActiveBtn = pages.find(btn => btn.classList.contains("pagination-button-current"));
                        if (currentActiveBtn) {
                            currentActiveBtn.$delClass("pagination-button-current", "pagination-button-disabled");
                        }
                        const startIndex = Math.max(0, start - 1);
                        const endIndex = Math.min(pages.length - 1, end - 1);
                        for (let i = 0; i < startIndex; i++) {
                            pages[i].style.display = "none";
                        }
                        for (let i = endIndex + 1; i < pages.length; i++) {
                            pages[i].style.display = "none";
                        }
                        for (let i = startIndex; i <= endIndex; i++) {
                            const btn = pages[i];
                            const pageNum = i + 1;
                            btn.style.display = "";
                            if (pageNum === targetPage) {
                                btn.$addClass("pagination-button-current", "pagination-button-disabled");
                            }
                        }
                    }
                    function updatePagination(targetPage) {
                        const visibleRange = getVisibleRange(targetPage);
                        updateNavigationButtons(buttonCache.menu1, targetPage);
                        updateNavigationButtons(buttonCache.menu2, targetPage);
                        updatePageButtons(buttonCache.menu1, targetPage, visibleRange);
                        updatePageButtons(buttonCache.menu2, targetPage, visibleRange);
                    }
                    const navigationActions = {
                        "<<": () => 1,
                        ">>": () => totalPages,
                        "<": current => current > 1 ? current - 1 : null,
                        ">": current => current < totalPages ? current + 1 : null
                    };
                    function parseTargetPage(clickText, currentPage) {
                        const clickedNum = parseInt(clickText);
                        if (!isNaN(clickedNum)) return clickedNum;
                        const action = navigationActions[clickText];
                        return action ? action(currentPage) : null;
                    }
                    const elements = createPaginationElements(1);
                    const [fragment1, fragment2] = [Lib.createFragment, Lib.createFragment];
                    preact.render([...elements], fragment1);
                    preact.render([...elements], fragment2);
                    menu[0].replaceChildren(fragment1);
                    menu[0].$sAttr("QuickPostToggle", "true");
                    requestAnimationFrame(() => {
                        menu[1].replaceChildren(fragment2);
                        menu[1].$sAttr("QuickPostToggle", "true");
                        initializeButtonCache();
                    });
                    let isLoading = false;
                    let abortController = null;
                    Lib.onEvent("section", "click", async event => {
                        const target = event.target.closest("menu a:not(.pagination-button-disabled)");
                        if (!target || isLoading) return;
                        event.preventDefault();
                        if (abortController) {
                            abortController.abort();
                        }
                        abortController = new AbortController();
                        const currentActiveBtn = target.closest("menu").$q(".pagination-button-current");
                        const currentPage = parseInt(currentActiveBtn.$text());
                        const targetPage = parseTargetPage(target.$text(), currentPage);
                        if (!targetPage || targetPage === currentPage) return;
                        isLoading = true;
                        try {
                            await Promise.all([fetchPage(pageLinks[targetPage - 1], abortController.signal), new Promise(resolve => {
                                updatePagination(targetPage);
                                resolve();
                            })]);
                            target.closest("#paginator-bottom") && menu[0].scrollIntoView();
                            history.pushState(null, null, pageLinks[targetPage - 1]);
                        } catch (error) {
                            if (error.message !== "Aborted") {
                                Lib.log("Page fetch failed:", error).error;
                            }
                        } finally {
                            isLoading = false;
                            abortController = null;
                        }
                    }, {
                        capture: true,
                        mark: "QuickPostToggle"
                    });
                });
            },
            async CardText({
                mode
            }) {
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
            async CardZoom({
                mode
            }) {
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
                        const [paddingBottom, rowGap, height] = DLL.isNeko ? ["0", "0", "57"] : ["7", "5.8", "50"];
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
                }
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
            async BetterThumbnail() {
                Lib.waitEl(".post-card__image", null, {
                    raf: true,
                    all: true,
                    timeout: 5
                }).then(images => {
                    const func = loadFunc.betterThumbnailRequ();
                    if (DLL.isNeko) {
                        images.forEach(img => {
                            const src = img.src;
                            if (!src?.endsWith(".gif")) {
                                func.changeSrc(img, src, src.replace("thumbnail/", ""));
                            }
                        });
                    } else {
                        const uri = new URL(Url);
                        if (uri.searchParams.get("q") === "") {
                            uri.searchParams.delete("q");
                        }
                        const imgBox = images.reduce((acc, img) => {
                            const src = img.src;
                            if (src) {
                                acc[src] = img;
                            }
                            return acc;
                        }, {});
                        if (imgBox.length === 0) return;
                        const api = `${uri.origin}/api/v1${uri.pathname}${DLL.User.test(Url) ? "/posts" : ""}${uri.search}`;
                        DLL.fetchApi(api, data => {
                            const type = Lib.$type(data);
                            if (type === "Object") {
                                data = data?.posts ?? [];
                            }
                            for (const obj of data) {
                                const file = obj.file.path;
                                const img = imgBox[DLL.thumbnailApi + file];
                                const src = img?.src;
                                if (!src) continue;
                                for (const attach of obj.attachments ?? []) {
                                    const path = attach.path;
                                    if (!path) continue;
                                    const isImg = DLL.supportImg.has(path.split(".")[1]);
                                    if (!isImg) continue;
                                    func.changeSrc(img, src, DLL.thumbnailApi + path);
                                    break;
                                }
                            }
                        });
                    }
                });
            }
        };
    }
    function contentFunc() {
        const loadFunc = {
            linkBeautifyCache: undefined,
            linkBeautifyRequ() {
                return this.linkBeautifyCache ??= async function showBrowse(browse) {
                    const url = DLL.isNeko ? browse.href : browse.href.replace("posts/archives", "api/v1/file");
                    browse.style.position = "relative";
                    browse.$q("View")?.remove();
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: url,
                        headers: {
                            Accept: "text/css",
                            "User-Agent": navigator.userAgent
                        },
                        onload: response => {
                            if (response.status !== 200) return;
                            if (DLL.isNeko) {
                                const main = response.responseXML.$q("main");
                                const view = Lib.createElement("View");
                                const buffer = Lib.createFragment;
                                for (const br of main.$qa("br")) {
                                    buffer.append(document.createTextNode(br.previousSibling.$text()), br);
                                }
                                view.appendChild(buffer);
                                browse.appendChild(view);
                            } else {
                                const responseJson = JSON.parse(response.responseText);
                                const password = responseJson["password"];
                                browse.$iAdjacent(`
                                    <view>
                                        ${password ? `password: ${password}<br>` : ""}
                                        ${responseJson["file_list"].map(file => `${file}<br>`).join("")}
                                    </view>
                                `);
                            }
                        },
                        onerror: error => {
                            showBrowse(browse);
                        }
                    });
                };
            },
            extraButtonCache: undefined,
            extraButtonRequ() {
                return this.extraButtonCache ??= async function getNextPage(url, old_main) {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: url,
                        nocache: false,
                        onload: response => {
                            if (response.status !== 200) {
                                getNextPage(url, old_main);
                                return;
                            }
                            const XML = response.responseXML;
                            const Main = XML.$q("main");
                            old_main.replaceChildren(...Main.childNodes);
                            history.pushState(null, null, url);
                            const Title = XML.$q("title")?.$text();
                            Title && Lib.title(Title);
                            setTimeout(() => {
                                Lib.waitEl(".post__content, .scrape__content", null, {
                                    raf: true,
                                    timeout: 10
                                }).then(post => {
                                    post.$qa("p").forEach(p => {
                                        p.childNodes.forEach(node => {
                                            node.nodeName == "BR" && node.parentNode.remove();
                                        });
                                    });
                                    post.$qa("a").forEach(a => {
                                        /\.(jpg|jpeg|png|gif)$/i.test(a.href) && a.remove();
                                    });
                                });
                                Lib.$q(".post__title, .scrape__title").scrollIntoView();
                            }, 300);
                        },
                        onerror: error => {
                            getNextPage(url, old_main);
                        }
                    });
                };
            }
        };
        return {
            async LinkBeautify() {
                Lib.addStyle(`
                    View {
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
                    a:hover View { display: block }
                    .post__attachment-link:not([beautify]) { display: none !important; }
                `, "Link-Effects", false);
                Lib.waitEl(".post__attachment-link, .scrape__attachment-link", null, {
                    raf: true,
                    all: true,
                    timeout: 5
                }).then(post => {
                    const showBrowse = loadFunc.linkBeautifyRequ();
                    for (const link of post) {
                        if (!DLL.isNeko && link.$gAttr("beautify")) {
                            link.remove();
                            continue;
                        }
                        const text = link.$text().replace("Download ", "");
                        if (DLL.isNeko) {
                            link.$text(text);
                            link.$sAttr("download", text);
                        } else {
                            link.$iAdjacent(`<a class="${link.$gAttr("class")}" href="${link.href}" download="${text}" beautify="true">${text}</a>`, "beforebegin");
                        }
                        const browse = link.nextElementSibling;
                        if (!browse) continue;
                        showBrowse(browse);
                    }
                });
            },
            async VideoBeautify({
                mode
            }) {
                if (DLL.isNeko) {
                    Lib.waitEl(".scrape__files video", null, {
                        raf: true,
                        all: true,
                        timeout: 5
                    }).then(video => {
                        video.forEach(media => media.$sAttr("preload", "metadata"));
                    });
                } else {
                    Lib.waitEl("ul[style*='text-align: center; list-style-type: none;'] li:not([id])", null, {
                        raf: true,
                        all: true,
                        timeout: 5
                    }).then(parents => {
                        Lib.waitEl(".post__attachment-link, .scrape__attachment-link", null, {
                            raf: true,
                            all: true,
                            timeout: 5
                        }).then(post => {
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
                                    let [video, summary] = [li.$q("video"), li.$q("summary")];
                                    if (!video || !summary) return;
                                    video.$sAttr("loop", true);
                                    video.$sAttr("preload", "metadata");
                                    const link = linkBox[summary.$text()];
                                    if (!link) return;
                                    move && link.parentElement.remove();
                                    let element = link.$copy();
                                    element.$sAttr("beautify", true);
                                    element.$text(element.$text().replace("Download", ""));
                                    summary.$text("");
                                    summary.appendChild(element);
                                }, 100));
                                waitLoad.observe(li, {
                                    attributes: true,
                                    characterData: true,
                                    childList: true,
                                    subtree: true
                                });
                                li.$sAttr("Video-Beautify", true);
                            }
                        });
                    });
                }
            },
            async OriginalImage({
                mode,
                experiment
            }) {
                Lib.waitEl(".post__thumbnail, .scrape__thumbnail", null, {
                    raf: true,
                    all: true,
                    timeout: 5
                }).then(thumbnail => {
                    const linkQuery = DLL.isNeko ? "div" : "a";
                    const safeGetSrc = element => element?.src || element?.$gAttr("src");
                    const safeGetHref = element => element?.href || element?.$gAttr("href");
                    function cleanMark(img) {
                        img.onload = img.onerror = null;
                        img.$dAttr("alt");
                        img.$dAttr("data-tsrc");
                        img.$dAttr("data-fsrc");
                        img.$delClass("Image-loading-indicator");
                    }
                    function imgReload(img, retry) {
                        if (retry <= 0) {
                            img.alt = "Loading Failed";
                            img.src = img.$gAttr("data-tsrc");
                            return;
                        }
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
                    }
                    function loadFailedClick() {
                        Lib.onE(".post__files, .scrape__files", "click", event => {
                            const target = event.target;
                            const isImg = target.matches("img");
                            if (isImg && target.alt === "Loading Failed") {
                                target.onload = null;
                                target.$dAttr("src");
                                target.onload = function () {
                                    cleanMark(target);
                                };
                                target.src = target.$gAttr("data-fsrc");
                            }
                        }, {
                            capture: true,
                            passive: true
                        });
                    }
                    let token = 0;
                    let timer = null;
                    function imgRendering({
                        root,
                        index,
                        thumbUrl,
                        newUrl,
                        oldUrl,
                        mode
                    }) {
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
                            };
                        }
                        root.replaceWith(container);
                    }
                    async function getFileSize(url) {
                        for (let i = 0; i < 5; i++) {
                            try {
                                const result = await new Promise((resolve, reject) => {
                                    GM_xmlhttpRequest({
                                        method: "HEAD",
                                        url: url,
                                        onload: response => {
                                            const headers = response.responseHeaders.trim().split(/[\r\n]+/).reduce((acc, line) => {
                                                const [name, ...valueParts] = line.split(":");
                                                if (name) acc[name.toLowerCase().trim()] = valueParts.join(":").trim();
                                                return acc;
                                            }, {});
                                            const totalLength = parseInt(headers["content-length"], 10);
                                            const supportsRange = headers["accept-ranges"] === "bytes" && totalLength > 0;
                                            resolve({
                                                supportsRange: supportsRange,
                                                totalSize: isNaN(totalLength) ? null : totalLength
                                            });
                                        },
                                        onerror: reject,
                                        ontimeout: reject
                                    });
                                });
                                return result;
                            } catch (error) {
                                if (i < 4) await new Promise(res => setTimeout(res, 300));
                            }
                        }
                        return {
                            supportsRange: false,
                            totalSize: null
                        };
                    }
                    async function imgRequest(container, url, result) {
                        const indicator = Lib.createElement(container, "div", {
                            class: "progress-indicator"
                        });
                        let blob = null;
                        try {
                            if (false) {
                                const CHUNK_COUNT = 6;
                                const totalSize = fileInfo.totalSize;
                                const chunkSize = Math.ceil(totalSize / CHUNK_COUNT);
                                const chunkProgress = new Array(CHUNK_COUNT).fill(0);
                                const updateProgress = () => {
                                    const totalDownloaded = chunkProgress.reduce((sum, loaded) => sum + loaded, 0);
                                    const percent = (totalDownloaded / totalSize * 100).toFixed(1);
                                    indicator.$text(`${percent}%`);
                                };
                                const chunkPromises = Array.from({
                                    length: CHUNK_COUNT
                                }, (_, i) => {
                                    return (async () => {
                                        const start = i * chunkSize;
                                        const end = Math.min(start + chunkSize - 1, totalSize - 1);
                                        for (let j = 0; j < 5; j++) {
                                            try {
                                                return await new Promise((resolve, reject) => {
                                                    GM_xmlhttpRequest({
                                                        method: "GET",
                                                        url: url,
                                                        headers: {
                                                            Range: `bytes=${start}-${end}`
                                                        },
                                                        responseType: "blob",
                                                        onload: res => res.status === 206 ? resolve(res.response) : reject(res),
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
                                        throw new Error(`Chunk ${i} failed after 5 retries.`);
                                    })();
                                });
                                const chunks = await Promise.all(chunkPromises);
                                blob = new Blob(chunks);
                            } else {
                                for (let i = 0; i < 5; i++) {
                                    try {
                                        blob = await new Promise((resolve, reject) => {
                                            let timeout = null;
                                            const request = GM_xmlhttpRequest({
                                                url: url,
                                                method: "GET",
                                                responseType: "blob",
                                                onload: res => {
                                                    clearTimeout(timeout);
                                                    return res.status === 200 ? resolve(res.response) : reject(res);
                                                },
                                                onerror: reject,
                                                onprogress: progress => {
                                                    timer();
                                                    if (progress.lengthComputable) {
                                                        const percent = (progress.loaded / progress.total * 100).toFixed(1);
                                                        indicator.$text(`${percent}%`);
                                                    }
                                                }
                                            });
                                            function timer() {
                                                clearTimeout(timeout);
                                                timeout = setTimeout(() => {
                                                    request.abort();
                                                    reject();
                                                }, 15e3);
                                            }
                                        });
                                        break;
                                    } catch (error) {
                                        if (i < 4) await new Promise(res => setTimeout(res, 300));
                                    }
                                }
                            }
                            if (blob && blob.size > 0) {
                                result(URL.createObjectURL(blob));
                            } else {
                                result(Url);
                            }
                        } catch (error) {
                            result(Url);
                        } finally {
                            indicator.remove();
                        }
                    }
                    async function imgLoad(root, index, mode = "fast") {
                        root.$dAttr("class");
                        const a = root.$q(linkQuery);
                        const safeHref = safeGetHref(a);
                        const img = root.$q("img");
                        const safeSrc = safeGetSrc(img);
                        if (!a && img) {
                            img.$addClass("Image-style");
                            return;
                        }
                        if (experiment) {
                            img.$addClass("Image-loading-indicator-experiment");
                            imgRequest(root, safeHref, href => {
                                imgRendering({
                                    root: a,
                                    index: index,
                                    thumbUrl: safeSrc,
                                    newUrl: href,
                                    oldUrl: safeHref,
                                    mode: mode
                                });
                            });
                        } else {
                            imgRendering({
                                root: a,
                                index: index,
                                thumbUrl: safeSrc,
                                newUrl: safeHref,
                                mode: mode
                            });
                        }
                    }
                    async function fastAutoLoad() {
                        loadFailedClick();
                        for (const [index, root] of [...thumbnail].entries()) {
                            while (token >= 7) {
                                await new Promise(resolve => setTimeout(resolve, 700));
                            }
                            imgLoad(root, index);
                        }
                    }
                    async function slowAutoLoad(index) {
                        if (index === thumbnail.length) return;
                        const root = thumbnail[index];
                        imgLoad(root, index, "slow");
                    }
                    function observeLoad() {
                        loadFailedClick();
                        return new IntersectionObserver(observed => {
                            observed.forEach(entry => {
                                if (entry.isIntersecting) {
                                    const root = entry.target;
                                    observer.unobserve(root);
                                    imgLoad(root, root.dataset.index);
                                }
                            });
                        }, {
                            threshold: .4
                        });
                    }
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
            async ExtraButton() {
                Lib.waitEl("h2.site-section__subheading", null, {
                    raf: true,
                    timeout: 5
                }).then(comments => {
                    DLL.style.getPostExtra;
                    const getNextPage = loadFunc.extraButtonRequ();
                    const [Prev, Next, Svg, Span, Buffer] = [Lib.$q(".post__nav-link.prev, .scrape__nav-link.prev"), Lib.$q(".post__nav-link.next, .scrape__nav-link.next"), document.createElement("svg"), document.createElement("span"), Lib.createFragment];
                    Svg.id = "To_top";
                    Svg.$iHtml(`
                        <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512" style="margin-left: 10px;cursor: pointer;">
                            <style>svg{fill: ${DLL.color}}</style>
                            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM135.1 217.4l107.1-99.9c3.8-3.5 8.7-5.5 13.8-5.5s10.1 2 13.8 5.5l107.1 99.9c4.5 4.2 7.1 10.1 7.1 16.3c0 12.3-10 22.3-22.3 22.3H304v96c0 17.7-14.3 32-32 32H240c-17.7 0-32-14.3-32-32V256H150.3C138 256 128 246 128 233.7c0-6.2 2.6-12.1 7.1-16.3z"></path>
                        </svg>
                    `);
                    const Next_btn = Next?.$copy(true) ?? document.createElement("div");
                    Next_btn.style = `color: ${DLL.color};`;
                    Next_btn.$sAttr("jump", Next_btn.href);
                    Next_btn.$dAttr("href");
                    Span.id = "Next_box";
                    Span.style = "float: right; cursor: pointer;";
                    Span.appendChild(Next_btn);
                    Lib.onE(Svg, "click", () => {
                        Lib.$q("header").scrollIntoView();
                    }, {
                        capture: true,
                        passive: true
                    });
                    Lib.onE(Next_btn, "click", () => {
                        if (DLL.isNeko) {
                            getNextPage(Next_btn.$gAttr("jump"), Lib.$q("main"));
                        } else {
                            Svg.remove();
                            Span.remove();
                            Next.click();
                        }
                    }, {
                        capture: true,
                        once: true
                    });
                    if (!Lib.$q("#To_top") && !Lib.$q("#Next_box")) {
                        Buffer.append(Svg, Span);
                        comments.appendChild(Buffer);
                    }
                });
            },
            async CommentFormat() {
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
        };
    }
    async function menuInit(callback = null) {
        const {
            Log,
            Transl
        } = DLL.language();
        callback?.({
            Log: Log,
            Transl: Transl
        });
        Lib.regMenu({
            [Transl("📝 設置選單")]: () => createMenu(Log, Transl)
        });
    }
    async function draggable(element) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        const nonDraggableTags = new Set(["SELECT", "BUTTON", "INPUT", "TEXTAREA", "A"]);
        const handleMouseMove = e => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            element.style.left = `${initialLeft + dx}px`;
            element.style.top = `${initialTop + dy}px`;
        };
        const handleMouseUp = () => {
            if (!isDragging) return;
            isDragging = false;
            element.style.cursor = "auto";
            document.body.style.removeProperty("user-select");
            Lib.offEvent(document, "mousemove");
            Lib.offEvent(document, "mouseup");
        };
        const handleMouseDown = e => {
            if (nonDraggableTags.has(e.target.tagName)) return;
            e.preventDefault();
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const style = window.getComputedStyle(element);
            initialLeft = parseFloat(style.left) || 0;
            initialTop = parseFloat(style.top) || 0;
            element.style.cursor = "grabbing";
            document.body.style.userSelect = "none";
            Lib.onEvent(document, "mousemove", handleMouseMove);
            Lib.onEvent(document, "mouseup", handleMouseUp);
        };
        Lib.onEvent(element, "mousedown", handleMouseDown);
    }
    function createMenu(Log, Transl) {
        const shadowID = "shadow";
        if (Lib.$q(`#${shadowID}`)) return;
        const imgSet = DLL.imgSet();
        const imgSetData = [["圖片高度", "Height", imgSet.Height], ["圖片寬度", "Width", imgSet.Width], ["圖片最大寬度", "MaxWidth", imgSet.MaxWidth], ["圖片間隔高度", "Spacing", imgSet.Spacing]];
        let analyze, img_set, img_input, img_select, set_value, save_cache = {};
        const shadow = Lib.createElement(Lib.body, "div", {
            id: shadowID
        });
        const shadowRoot = shadow.attachShadow({
            mode: "open"
        });
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
        const menuScript = `
            <script id="menu-script">
                function check(value) {
                    return value.toString().length > 4 || value > 1000
                        ? 1000 : value < 0 ? "" : value;
                }
            </script>
        `;
        const menuSet = DLL.menuSet();
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
        shadowRoot.appendChild(Lib.createDomFragment(menuMain));
        const languageEl = shadowRoot.querySelector("#language");
        const readsetEl = shadowRoot.querySelector("#readsettings");
        const interfaceEl = shadowRoot.querySelector(".modal-interface");
        const imageSetEl = shadowRoot.querySelector("#image-settings-show");
        languageEl.value = Log ?? "en-US";
        draggable(interfaceEl);
        DLL.menuRule = shadowRoot.querySelector("#menu-style")?.sheet?.cssRules;
        const menuRequ = {
            menuClose() {
                shadow.remove();
            },
            menuSave() {
                const styles = getComputedStyle(interfaceEl);
                Lib.setV(DLL.saveKey.Menu, {
                    Top: styles.top,
                    Left: styles.left
                });
            },
            imgSave() {
                img_set = imageSetEl.querySelectorAll("p");
                if (img_set.length === 0) return;
                imgSetData.forEach(([title, key, set], index) => {
                    img_input = img_set[index].querySelector("input");
                    img_select = img_set[index].querySelector("select");
                    const inputVal = img_input.value;
                    const selectVal = img_select.value;
                    set_value = selectVal === "auto" ? "auto" : inputVal === "" ? set : `${inputVal}${selectVal}`;
                    save_cache[img_input.$gAttr("data-key")] = set_value;
                });
                Lib.setV(DLL.saveKey.Img, save_cache);
            },
            async imgSettings() {
                let running = false;
                const handle = event => {
                    if (running) return;
                    running = true;
                    const target = event.target;
                    if (!target) {
                        running = false;
                        return;
                    }
                    const key = target.$gAttr("data-key");
                    const value = target?.value;
                    if (isNaN(value)) {
                        const input = target.previousElementSibling;
                        if (value === "auto") {
                            input.disabled = true;
                            DLL.stylePointer[key](value);
                        } else {
                            input.disabled = false;
                            DLL.stylePointer[key](`${input.value}${value}`);
                        }
                    } else {
                        const select = target.nextElementSibling;
                        DLL.stylePointer[key](`${value}${select.value}`);
                    }
                    setTimeout(() => running = false, 100);
                };
                Lib.onEvent(imageSetEl, "input", handle);
                Lib.onEvent(imageSetEl, "change", handle);
            }
        };
        Lib.onE(languageEl, "change", event => {
            event.stopImmediatePropagation();
            const value = event.currentTarget.value;
            Lib.setV(DLL.saveKey.Lang, value);
            menuRequ.menuSave();
            menuRequ.menuClose();
            menuInit(Updata => {
                createMenu(Updata.Log, Updata.Transl);
            });
        });
        Lib.onE(interfaceEl, "click", event => {
            const target = event.target;
            const id = target?.id;
            if (!id) return;
            if (id === "image-settings") {
                const imgsetCss = DLL.menuRule[2].style;
                if (imgsetCss.opacity === "0") {
                    let dom = "";
                    imgSetData.forEach(([title, key]) => {
                        dom += getImgOptions(title, key) + "\n";
                    });
                    imageSetEl.insertAdjacentHTML("beforeend", dom);
                    Object.assign(imgsetCss, {
                        width: "auto",
                        height: "auto",
                        opacity: "1"
                    });
                    target.disabled = true;
                    readsetEl.disabled = false;
                    menuRequ.imgSettings();
                }
            } else if (id === "readsettings") {
                img_set = imageSetEl.querySelectorAll("p");
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
            } else if (id === "application") {
                menuRequ.imgSave();
                menuRequ.menuSave();
                menuRequ.menuClose();
            } else if (id === "closure") {
                menuRequ.menuClose();
            }
        });
    }
})();