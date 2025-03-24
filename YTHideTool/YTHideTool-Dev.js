// ==UserScript==
// @name         YouTube Hide Tool
// @name:zh-TW   YouTube 隱藏工具
// @name:zh-CN   YouTube 隐藏工具
// @name:ja      YouTube 非表示ツール
// @name:ko      유튜브 숨기기 도구
// @name:en      Youtube Hide Tool
// @version      0.0.38-Beta
// @author       Canaan HS
// @description         該腳本能夠自動隱藏 YouTube 影片結尾的推薦卡，當滑鼠懸浮於影片上方時，推薦卡會恢復顯示。並額外提供快捷鍵切換功能，可隱藏留言區、影片推薦、功能列表，及切換至極簡模式。設置會自動保存，並在下次開啟影片時自動套用。
// @description:zh-TW   該腳本能夠自動隱藏 YouTube 影片結尾的推薦卡，當滑鼠懸浮於影片上方時，推薦卡會恢復顯示。並額外提供快捷鍵切換功能，可隱藏留言區、影片推薦、功能列表，及切換至極簡模式。設置會自動保存，並在下次開啟影片時自動套用。
// @description:zh-CN   该脚本能够自动隐藏 YouTube 视频结尾的推荐卡，在鼠标悬停于视频上方时，推荐卡会恢复显示。并额外提供快捷键切换功能，可隐藏评论区、视频推荐、功能列表，并切换至极简模式。设置会自动保存，并在下次打开视频时自动应用。
// @description:ja      このスクリプトは、YouTube动画の终わりに表示される推奨カードを自动的に非表示にし、マウスがビデオ上にホバーされると、推奨カードが再表示されます。さらに、ショートカットキーでコメントセクション、动画の推奨、机能リストを非表示に切り替える机能が追加されており、シンプルモードに切り替えることもできます。设定は自动的に保存され、次回ビデオを开くと自动的に适用されます。
// @description:ko      이 스크립트는 YouTube 동영상 끝에 나오는 추천 카드를 자동으로 숨기고, 마우스가 비디오 위에 머무를 때 추천 카드가 다시 나타납니다. 또한, 댓글 섹션, 비디오 추천, 기능 목록을 숨기고 최소 모드로 전환하는 단축키를 제공합니다. 설정은 자동으로 저장되며, 다음 비디오를 열 때 자동으로 적용됩니다.
// @description:en      This script automatically hides the recommended cards at the end of YouTube videos. When the mouse hovers over the video, the recommended cards will reappear. Additionally, it provides shortcut keys to toggle the comment section, video recommendations, feature list, and switch to a minimalist mode. Settings are automatically saved and applied the next time the video is opened.

// @match        *://www.youtube.com/*
// @icon         https://cdn-icons-png.flaticon.com/512/1383/1383260.png

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635

// @noframes
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        window.onurlchange
// @grant        GM_registerMenuCommand
// @grant        GM_addValueChangeListener

// @require      https://update.greasyfork.org/scripts/487608/1532086/ClassSyntax_min.js
// ==/UserScript==

(async ()=> {
    const Config = {
        Dev: false,
        GlobalChange: true, // 全局同時修改
        HotKey: {
            Adapt: k => k.key.toLowerCase(), // <- 適配大小寫差異
            Title: k => k.altKey && Config.HotKey.Adapt(k) == "t", // 標題
            MinimaList: k => k.ctrlKey && Config.HotKey.Adapt(k) == "z", // 極簡化
            RecomViewing: k => k.altKey && Config.HotKey.Adapt(k) == "1", // 推薦觀看
            Comment: k => k.altKey && Config.HotKey.Adapt(k) == "2", // 留言區
            FunctionBar: k => k.altKey && Config.HotKey.Adapt(k) == "3", // 功能區
            ListDesc: k => k.altKey && Config.HotKey.Adapt(k) == "4" // 播放清單資訊
        }
    };

    new class Tool extends Syntax {
        constructor() {
            super();

            this.MRM = null; // 菜單註冊標記
            this.GCM = null; // 全局變更標記
            this.RST = null; // 運行開始時間
            this.TFT = false; // 轉換觸發器
            this.InjecRecord = {};

            this.HotKey = Config.HotKey;
            this.Lang = this.Language(this.Device.Lang);

            /* 支援的頁面才會載入 */
            this.Live = /^(https?:\/\/)www\.youtube\.com\/live\/.*$/; // 直播影片
            this.Video = /^(https?:\/\/)www\.youtube\.com\/watch\?v=.+$/; // 影片播放區
            this.Playlist = /^(https?:\/\/)www\.youtube\.com\/playlist\?list=.+$/; // 播放清單

            /* 判斷頁面 */
            this.PageType = (url) =>
                this.Video.test(url) ? "Video"
                : this.Live.test(url) ? "Live"
                : this.Playlist.test(url) ? "Playlist"
                : "NotSupport";

            /* 標題格式 (傳入標題元素) */
            this.TitleFormat = (title) => title.textContent.replace(/^\s+|\s+$/g, "");

            /* 持續隱藏 */
            this.TitleOb = new MutationObserver(()=> {
                document.title != "..." && (document.title = "...");
            });
            /* 監聽配置 */
            this.TitleOp = {childList: true, subtree: false};

            /* 開發模式 - 打印 (語法簡化) */
            this.DevPrint = (title, content, show=Config.Dev) => {
                this.Log(title, content, {dev: show, collapsed: false});
            };
            /*  開發模式 - 時間打印 (語法簡化) */
            this.DevTimePrint = (title, show) => {
                this.DevPrint(title, this.Runtime(this.RST, {log: false}), show);
            };

            /**
             * 判斷設置
             * @param {Element} Element - 要修改的元素
             * @param {String} setKey - 要保存設置的 key, 如果沒傳遞該值, 就不會有保存操作
             */
            this.HideJudgment = async (Element, setKey=null) => {
                if (Element.style.display == "none" || this.TFT) {
                    Element.style.display = "block";
                    setKey && this.Store("s", setKey, false);
                } else {
                    Element.style.display = "none";
                    setKey && this.Store("s", setKey, true);
                }
            };

            /**
             * 風格轉換器
             * @param {Array} ObjList - 要修改的元素列表
             * @param {String} Type - 要修改的樣式類型
             * @param {String} Style - 要修改的樣式
             * @returns 回傳修改是否成功狀態 (有開啟 Dev 才會運作)
             */
            this.StyleTransform = async (ObjList, Type, Style) => {
                ObjList.forEach(element=>{element.style[Type] = Style});
                if (Config.Dev) {
                    return new Promise(resolve => {
                        resolve(ObjList.every(element => element.style[Type] == Style))
                    });
                }
            };
        };

        /* 檢測觸發 */
        async Detec() {
            this.Injec(this.Device.Url); // 立即注入
            this.AddListener(window, "urlchange", change=> {
                this.Injec(change.url); // 監聽變化
            });
        };

        /* 注入操作 */
        async Injec(URL) {
            const Page = this.PageType(URL);
            this.DevPrint(this.Lang.Transl("頁面類型"), Page);

            if (Page == "NotSupport" || this.InjecRecord[URL]) return;

            // 等待的元素是, 判定可開始查找的框架
            this.WaitElem("#columns, #contents", null, {object: document, timeout: 20, characterData: true, timeoutResult: true}).then(trigger=> {
                if (!trigger) {
                    this.Log(null, this.Lang.Transl("查找框架失敗"), {type: "error"});
                    return;
                }

                /* 針對不同頁面處理 */
                if (["Video", "Live"].includes(Page)) {
                    Config.Dev && (this.RST = this.Runtime());

                    // 隱藏結尾推薦樣式
                    this.AddStyle(`
                        .ytp-ce-element {
                            display: none;
                        }
                        #movie_player:not(.ytp-fullscreen):hover .ytp-ce-element {
                            display: block;
                        }
                        .ytp-show-tiles .ytp-videowall-still {
                            cursor: pointer;
                        }
                        body {
                            overflow-x: hidden !important;
                        }
                    `, "Video-Tool-Hide", false);

                    // 等待影片頁面需隱藏的數據
                    this.WaitElem([
                        "title", "#title h1", "#end", "#below",
                        "#secondary.style-scope.ytd-watch-flexy", "#secondary-inner",
                        "#related", "#comments", "#actions"
                    ], null, {throttle: 100, characterData: true, timeoutResult: true}).then(found => {
                        const [
                            title, h1, end, below, secondary, inner, related, comments, actions
                        ] = found;

                        this.DevPrint(this.Lang.Transl("隱藏元素"), found);
                        if (!this.MRM) this.MRM = GM_registerMenuCommand(this.Lang.Transl("📜 預設熱鍵"), ()=> {alert(this.Lang.Transl("快捷提示"))});

                        // 極簡化
                        if (this.Store("g", "Minimalist")) {
                            this.TitleOb.observe(title, this.TitleOp);
                            this.StyleTransform([document.body], "overflow", "hidden");
                            this.StyleTransform([h1, end, below, secondary, related], "display", "none").then(state => this.DevTimePrint(this.Lang.Transl("極簡化"), state));
                            document.title = "...";
                        } else {
                            // 標題
                            if (this.Store("g", "Title")) {
                                this.TitleOb.observe(title, this.TitleOp);
                                this.StyleTransform([h1], "display", "none").then(state => this.DevTimePrint(this.Lang.Transl("隱藏標題"), state));
                                document.title = "...";
                            };

                            // 推薦播放
                            if (this.Store("g", "RecomViewing")) {
                                this.StyleTransform([secondary, related], "display", "none").then(state => this.DevTimePrint(this.Lang.Transl("隱藏推薦觀看"), state));
                            };

                            // 評論區
                            if (this.Store("g", "Comment")) {
                                this.StyleTransform([comments], "display", "none").then(state => this.DevTimePrint(this.Lang.Transl("隱藏留言區"), state));
                            };

                            // 功能選項區
                            if (this.Store("g", "FunctionBar")) {
                                this.StyleTransform([actions], "display", "none").then(state => this.DevTimePrint(this.Lang.Transl("隱藏功能選項"), state));
                            };
                        };

                        // 調整操作
                        const Modify = {
                            Title: (Mode, Save="Title") => { // 以下的 Save 不需要, 就傳遞 false 或是 空值
                                Mode = Save ? Mode : !Mode; // 同上

                                document.title = Mode ? (
                                    this.TitleOb.disconnect(), this.TitleFormat(h1)
                                ) : (
                                    this.TitleOb.observe(title, this.TitleOp), "..."
                                );
                                this.HideJudgment(h1, Save);
                            },
                            Minimalist: (Mode, Save=true) => { // 這個比較特別, 他時直接在這操作存儲, 所以 Save 是 Boolen
                                Mode = Save ? Mode : !Mode; // 全局修改時的判斷 Mode 需要是反的, 剛好全局判斷的 Save 始終為 false, 所以這樣寫

                                if (Mode) {
                                    Modify.Title(false, false);
                                    Save && this.Store("s", "Minimalist", false);
                                    this.StyleTransform([document.body], "overflow", "auto");
                                    this.StyleTransform([end, below, secondary, related], "display", "block");
                                } else {
                                    Modify.Title(true, false);
                                    Save && this.Store("s", "Minimalist", true);
                                    this.StyleTransform([document.body], "overflow", "hidden");
                                    this.StyleTransform([end, below, secondary, related], "display", "none");
                                }
                            },
                            RecomViewing: (Mode, Save="RecomViewing") => {
                                if (inner.childElementCount > 1) {
                                    this.HideJudgment(secondary);
                                    this.HideJudgment(related, Save);
                                    this.TFT = false;
                                } else {
                                    this.HideJudgment(related, Save);
                                    this.TFT = true;
                                }
                            },
                            Comment: (Mode, Save="Comment") => {
                                this.HideJudgment(comments, Save);
                            },
                            FunctionBar: (Mode, Save="FunctionBar") => {
                                this.HideJudgment(actions, Save);
                            }
                        };

                        // 註冊快捷鍵
                        this.AddListener(document, "keydown", event => {
                            if (this.HotKey.MinimaList(event)) {
                                event.preventDefault();
                                Modify.Minimalist(this.Store("g", "Minimalist"));
                            } else if (this.HotKey.Title(event)) {
                                event.preventDefault();
                                Modify.Title(document.title == "...");
                            } else if (this.HotKey.RecomViewing(event)) {
                                event.preventDefault();
                                Modify.RecomViewing();
                            } else if (this.HotKey.Comment(event)) {
                                event.preventDefault();
                                Modify.Comment();
                            } else if (this.HotKey.FunctionBar(event)) {
                                event.preventDefault();
                                Modify.FunctionBar();
                            }
                        }, {capture: true});

                        if (Config.GlobalChange && !this.GCM) {
                            // 動態全局修改
                            this.StoreListen(["Minimalist", "Title", "RecomViewing", "Comment", "FunctionBar"], call=> {
                                if (call.far) Modify[call.key](call.nv, false);
                            });
                            this.GCM = true; // 標記註冊
                        };

                        this.InjecRecord[URL] = true;
                    });

                } else if (Page == "Playlist") {
                    Config.Dev && (this.RST = this.Runtime());

                    this.WaitElem("ytd-playlist-header-renderer.style-scope.ytd-browse", null, {throttle: 100, characterData: true, timeoutResult: true}).then(playlist=> {

                        this.DevPrint(this.Lang.Transl("隱藏元素"), playlist);
                        if (!this.MRM) this.MRM = GM_registerMenuCommand(this.Lang.Transl("📜 預設熱鍵"), ()=> {alert(this.Lang.Transl("快捷提示"))});

                        // 播放清單資訊
                        if (this.Store("g", "ListDesc")) {
                            this.StyleTransform([playlist], "display", "none").then(state => this.DevTimePrint(this.Lang.Transl("隱藏播放清單資訊"), state));
                        };

                        this.AddListener(document, "keydown", event => {
                            if (this.HotKey.ListDesc(event)) {
                                event.preventDefault();
                                this.HideJudgment(playlist, "ListDesc");
                            }
                        });

                        this.InjecRecord[URL] = true;
                    });
                };
            });
        };

        Language(lang) {
            const Word = {
                Traditional: {
                    "快捷提示": `@ 功能失效時 [請重新整理] =>
                    \r(Alt + 1)：隱藏推薦播放
                    \r(Alt + 2)：隱藏留言區
                    \r(Alt + 3)：隱藏功能列表
                    \r(Alt + 4)：隱藏播放清單資訊
                    \r(Alt + T)：隱藏標題文字
                    \r(Ctrl + Z)：使用極簡化`
                },
                Simplified: {
                    "📜 預設熱鍵": "📜 预设热键",
                    "快捷提示": `@ 功能失效时 [请重新整理] =>
                    \r(Alt + 1)：隐藏推荐播放
                    \r(Alt + 2)：隐藏评论区
                    \r(Alt + 3)：隐藏功能列表
                    \r(Alt + 4)：隐藏播放清单资讯
                    \r(Alt + T)：隐藏标题文字
                    \r(Ctrl + Z)：使用极简化`,
                    "查找框架失敗": "查找框架失败",
                    "頁面類型": "页面类型",
                    "隱藏元素": "隐藏元素",
                    "極簡化": "极简化",
                    "隱藏標題": "隐藏标题",
                    "隱藏推薦觀看": "隐藏推荐观看",
                    "隱藏留言區": "隐藏留言区",
                    "隱藏功能選項": "隐藏功能选项",
                    "隱藏播放清單資訊": "隐藏播放清单信息",
                },
                Japan: {
                    "📜 預設熱鍵": "📜 デフォルトホットキー",
                    "快捷提示": `@ 机能が无効になった场合 [ページを更新してください] =>
                    \r(Alt + 1)：おすすめ再生を非表示にする
                    \r(Alt + 2)：コメントエリアを非表示にする
                    \r(Alt + 3)：机能リストを非表示にする
                    \r(Alt + 4)：プレイリスト情报を非表示にする
                    \r(Alt + T)：タイトル文字を隠す
                    \r(Ctrl + Z)：シンプル化を使用する`,
                    "查找框架失敗": "フレームの検索に失敗しました",
                    "頁面類型": "ページタイプ",
                    "隱藏元素": "要素を隠す",
                    "極簡化": "ミニマリスト",
                    "隱藏標題": "タイトルを隠す",
                    "隱藏推薦觀看": "おすすめ視聴を隠す",
                    "隱藏留言區": "コメントセクションを隠す",
                    "隱藏功能選項": "機能オプションを隠す",
                    "隱藏播放清單資訊": "再生リスト情報を隠す",
                },
                Korea: {
                    "📜 預設熱鍵": "📜 기본 단축키",
                    "快捷提示": `@ 기능이 작동하지 않을 때 [새로 고침하세요] =>
                    \r(Alt + 1)：추천 재생 숨기기
                    \r(Alt + 2)：댓글 영역 숨기기
                    \r(Alt + 3)：기능 목록 숨기기
                    \r(Alt + 4)：재생 목록 정보 숨기기
                    \r(Alt + T)：제목 텍스트 숨기기
                    \r(Ctrl + Z)：간소화 사용`,
                    "查找框架失敗": "프레임 검색 실패",
                    "頁面類型": "페이지 유형",
                    "隱藏元素": "요소 숨기기",
                    "極簡化": "극단적 단순화",
                    "隱藏標題": "제목 숨기기",
                    "隱藏推薦觀看": "추천 시청 숨기기",
                    "隱藏留言區": "댓글 섹션 숨기기",
                    "隱藏功能選項": "기능 옵션 숨기기",
                    "隱藏播放清單資訊": "재생 목록 정보 숨기기",
                },
                English: {
                    "📜 預設熱鍵": "📜 Default Hotkeys",
                    "快捷提示": `@ If functionalities fail [Please refresh] =>
                    \r(Alt + 1)：Hide recommended playback
                    \r(Alt + 2)：Hide comments section
                    \r(Alt + 3)：Hide feature list
                    \r(Alt + 4)：Hide playlist info
                    \r(Alt + T)：Hide Title Text
                    \r(Ctrl + Z)：Use Simplification`,
                    "查找框架失敗": "Frame search failed",
                    "頁面類型": "Page type",
                    "隱藏元素": "Hide elements",
                    "極簡化": "Minimalize",
                    "隱藏標題": "Hide title",
                    "隱藏推薦觀看": "Hide recommended views",
                    "隱藏留言區": "Hide comments section",
                    "隱藏功能選項": "Hide feature options",
                    "隱藏播放清單資訊": "Hide playlist information",
                },
            }, Match = {
                ko: Word.Korea,
                ja: Word.Japan,
                "en-US": Word.English,
                "zh-CN": Word.Simplified,
                "zh-SG": Word.Simplified,
                "zh-TW": Word.Traditional,
                "zh-HK": Word.Traditional,
                "zh-MO": Word.Traditional,
            }, ML = Match[lang] ?? Match["en-US"];

            return {
                Transl: (Str) => ML[Str] ?? Str,
            };
        };
    }().Detec();
})();