// ==UserScript==
// @name         YouTube Hide Tool
// @name:zh-TW   YouTube 隱藏工具
// @name:zh-CN   YouTube 隐藏工具
// @name:ja      YouTube 非表示ツール
// @name:ko      유튜브 숨기기 도구
// @name:en      Youtube Hide Tool
// @version      0.0.38-Beta1
// @author       Canaan HS
// @description         該腳本能夠自動隱藏 YouTube 影片結尾的推薦卡，當滑鼠懸浮於影片上方時，推薦卡會恢復顯示。並額外提供快捷鍵切換功能，可隱藏留言區、影片推薦、功能列表，及切換至極簡模式。設置會自動保存，並在下次開啟影片時自動套用。
// @description:zh-TW   該腳本能夠自動隱藏 YouTube 影片結尾的推薦卡，當滑鼠懸浮於影片上方時，推薦卡會恢復顯示。並額外提供快捷鍵切換功能，可隱藏留言區、影片推薦、功能列表，及切換至極簡模式。設置會自動保存，並在下次開啟影片時自動套用。
// @description:zh-CN   该脚本能够自动隐藏 YouTube 视频结尾的推荐卡，在鼠标悬停于视频上方时，推荐卡会恢复显示。并额外提供快捷键切换功能，可隐藏评论区、视频推荐、功能列表，并切换至极简模式。设置会自动保存，并在下次打开视频时自动应用。
// @description:ja      このスクリプトは、YouTube动画の终わりに表示される推奨カードを自动的に非表示にし、マウスがビデオ上にホバーされると、推奨カードが再表示されます。さらに、ショートカットキーでコメントセクション、动画の推奨、机能リストを非表示に切り替える机能が追加されており、シンプルモードに切り替えることもできます。设定は自动的に保存され、次回ビデオを开くと自动的に适用されます。
// @description:ko      이 스크립트는 YouTube 동영상 끝에 나오는 추천 카드를 자동으로 숨기고, 마우스가 비디오 위에 머무를 때 추천 카드가 다시 나타납니다. 또한, 댓글 섹션, 비디오 추천, 기능 목록을 숨기고 최소 모드로 전환하는 단축키를 제공합니다. 설정은 자동으로 저장되며, 다음 비디오를 열 때 자동으로 적용됩니다.
// @description:en      This script automatically hides the recommended cards at the end of YouTube videos. When the mouse hovers over the video, the recommended cards will reappear. Additionally, it provides shortcut keys to toggle the comment section, video recommendations, feature list, and switch to a minimalist mode. Settings are automatically saved and applied the next time the video is opened.

// @noframes
// @match        *://www.youtube.com/*
// @icon         https://cdn-icons-png.flaticon.com/512/1383/1383260.png

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635

// @require      https://update.greasyfork.org/scripts/487608/1591150/SyntaxLite_min.js

// @grant        GM_setValue
// @grant        GM_getValue
// @grant        window.onurlchange
// @grant        GM_registerMenuCommand
// @grant        GM_addValueChangeListener

// @run-at       document-start
// ==/UserScript==

(async () => {
    const Config = {
        Dev: false,
        GlobalChange: true, // 全局同時修改
        HotKey: {
            Adapt: k => k.key.toLowerCase(), // <- 適配大小寫差異
            Title: k => k.altKey && Config.HotKey.Adapt(k) == "t", // 標題
            MinimaList: k => k.ctrlKey && Config.HotKey.Adapt(k) == "z", // 極簡化
            RecomViewing: k => k.altKey && Config.HotKey.Adapt(k) == "1", // 推薦觀看
            Comment: k => k.altKey && Config.HotKey.Adapt(k) == "2", // 留言區
            FunctionBar: k => k.altKey && Config.HotKey.Adapt(k) == "3" // 功能區
        }
    };
    const Match = {
        Live: /^(https?:\/\/)www\.youtube\.com\/live\/.*$/,
        Video: /^(https?:\/\/)www\.youtube\.com\/watch\?v=.+$/
    };
    const Dict = {
        Traditional: {
            "快捷提示": `@ 功能失效時 [請重新整理] =>
                    \r(Alt + 1)：隱藏推薦播放
                    \r(Alt + 2)：隱藏留言區
                    \r(Alt + 3)：隱藏功能列表
                    \r(Alt + T)：隱藏標題文字
                    \r(Ctrl + Z)：使用極簡化`
        },
        Simplified: {
            "📜 預設熱鍵": "📜 预设热键",
            "快捷提示": `@ 功能失效时 [请重新整理] =>
                    \r(Alt + 1)：隐藏推荐播放
                    \r(Alt + 2)：隐藏评论区
                    \r(Alt + 3)：隐藏功能列表
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
            "隱藏播放清單資訊": "隐藏播放清单信息"
        },
        Japan: {
            "📜 預設熱鍵": "📜 デフォルトホットキー",
            "快捷提示": `@ 机能が无効になった场合 [ページを更新してください] =>
                    \r(Alt + 1)：おすすめ再生を非表示にする
                    \r(Alt + 2)：コメントエリアを非表示にする
                    \r(Alt + 3)：机能リストを非表示にする
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
            "隱藏播放清單資訊": "再生リスト情報を隠す"
        },
        Korea: {
            "📜 預設熱鍵": "📜 기본 단축키",
            "快捷提示": `@ 기능이 작동하지 않을 때 [새로 고침하세요] =>
                    \r(Alt + 1)：추천 재생 숨기기
                    \r(Alt + 2)：댓글 영역 숨기기
                    \r(Alt + 3)：기능 목록 숨기기
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
            "隱藏播放清單資訊": "재생 목록 정보 숨기기"
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
            "隱藏播放清單資訊": "Hide playlist information"
        }
    };
    (async () => {
        const { Transl } = (() => {
            const Matcher = Syn.TranslMatcher(Dict);
            return {
                Transl: (Str) => Matcher[Str] ?? Str
            };
        })();
        (() => {
            let MRM = null;
            let GCM = null;
            let RST = null;
            let TFT = false;
            const InjecRecord = {};
            const HotKey = Config.HotKey;
            const PageType = (url) => Match.Video.test(url) ? "Video" : Match.Live.test(url) ? "Live" : "NotSupport";
            const TitleFormat = (title) => title.$text().replace(/^\s+|\s+$/g, "");
            const DevPrint = (title, content, show = Config.Dev) => {
                Syn.Log(title, content, { dev: show, collapsed: false });
            };
            const DevTimePrint = (title, show) => {
                DevPrint(title, Syn.Runtime(RST, { log: false }), show);
            };
            const HideJudgment = async (Element, setKey = null) => {
                if (Element.style.display == "none" || TFT) {
                    Element.style.display = "block";
                    setKey && Syn.sV(setKey, false);
                } else {
                    Element.style.display = "none";
                    setKey && Syn.sV(setKey, true);
                }
            };
            const StyleTransform = async (ObjList, Type, Style) => {
                ObjList.forEach((element) => {
                    element.style[Type] = Style;
                });
            };
            const TitleOp = { childList: true, subtree: false };
            const TitleOb = new MutationObserver(() => {
                document.title != "..." && Syn.title("...");
            });
            async function Core(URL) {
                const Page = PageType(URL);
                DevPrint(Transl("頁面類型"), Page);
                if (Page === "NotSupport" || InjecRecord[URL]) return;
                Syn.WaitElem("#columns, #contents", null, { raf: true, timeoutResult: true }).then((trigger) => {
                    if (!trigger) {
                        Syn.Log(null, Transl("查找框架失敗"), { type: "error" });
                        return;
                    }
                    MRM ?? (MRM = GM_registerMenuCommand(Transl("📜 預設熱鍵"), () => {
                        alert(Transl("快捷提示"));
                    }));
                    Syn.AddStyle(`
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
                    Syn.WaitElem([
                        "title",
                        "#title h1",
                        "#end",
                        "#below",
                        "#secondary.style-scope.ytd-watch-flexy",
                        "#secondary-inner",
                        "#related",
                        "#comments",
                        "#actions"
                    ], null, { throttle: 80, characterData: true, timeoutResult: true }).then((found) => {
                        DevPrint(Transl("隱藏元素"), found);
                        const [
                            title,
                            h1,
                            end,
                            below,
                            secondary,
                            inner,
                            related,
                            comments,
                            actions
                        ] = found;
                        if (Syn.gV("Minimalist")) {
                            TitleOb.observe(title, TitleOp);
                            StyleTransform([document.body], "overflow", "hidden");
                            StyleTransform([h1, end, below, secondary, related], "display", "none").then((state) => DevTimePrint(Transl("極簡化"), state));
                            document.title = "...";
                        } else {
                            if (Syn.gV("Title")) {
                                TitleOb.observe(title, TitleOp);
                                StyleTransform([h1], "display", "none").then((state) => DevTimePrint(Transl("隱藏標題"), state));
                                document.title = "...";
                            }
                            if (Syn.gV("RecomViewing")) {
                                StyleTransform([secondary, related], "display", "none").then((state) => DevTimePrint(Transl("隱藏推薦觀看"), state));
                            }
                            if (Syn.gV("Comment")) {
                                StyleTransform([comments], "display", "none").then((state) => DevTimePrint(Transl("隱藏留言區"), state));
                            }
                            if (Syn.gV("FunctionBar")) {
                                StyleTransform([actions], "display", "none").then((state) => DevTimePrint(Transl("隱藏功能選項"), state));
                            }
                        }
                        const Modify = {
                            Title: (Mode, Save = "Title") => {
                                Mode = Save ? Mode : !Mode;
                                document.title = Mode ? (TitleOb.disconnect(), TitleFormat(h1)) : (TitleOb.observe(title, TitleOp), "...");
                                HideJudgment(h1, Save);
                            },
                            Minimalist: (Mode, Save = true) => {
                                Mode = Save ? Mode : !Mode;
                                if (Mode) {
                                    Modify.Title(false, false);
                                    Save && Syn.sV("Minimalist", false);
                                    StyleTransform([document.body], "overflow", "auto");
                                    StyleTransform([end, below, secondary, related], "display", "block");
                                } else {
                                    Modify.Title(true, false);
                                    Save && Syn.sV("Minimalist", true);
                                    StyleTransform([document.body], "overflow", "hidden");
                                    StyleTransform([end, below, secondary, related], "display", "none");
                                }
                            },
                            RecomViewing: (Mode, Save = "RecomViewing") => {
                                if (inner.childElementCount > 1) {
                                    HideJudgment(secondary);
                                    HideJudgment(related, Save);
                                    TFT = false;
                                } else {
                                    HideJudgment(related, Save);
                                    TFT = true;
                                }
                            },
                            Comment: (Mode, Save = "Comment") => {
                                HideJudgment(comments, Save);
                            },
                            FunctionBar: (Mode, Save = "FunctionBar") => {
                                HideJudgment(actions, Save);
                            }
                        };
                        Syn.onEvent(document, "keydown", (event) => {
                            if (HotKey.MinimaList(event)) {
                                event.preventDefault();
                                Modify.Minimalist(Syn.gV("Minimalist"));
                            } else if (HotKey.Title(event)) {
                                event.preventDefault();
                                Modify.Title(document.title === "...");
                            } else if (HotKey.RecomViewing(event)) {
                                event.preventDefault();
                                Modify.RecomViewing();
                            } else if (HotKey.Comment(event)) {
                                event.preventDefault();
                                Modify.Comment();
                            } else if (HotKey.FunctionBar(event)) {
                                event.preventDefault();
                                Modify.FunctionBar();
                            }
                        }, { capture: true });
                        if (!GCM) {
                            Syn.StoreListen(["Minimalist", "Title", "RecomViewing", "Comment", "FunctionBar"], (call) => {
                                if (call.far) Modify[call.key](call.nv, false);
                            });
                            GCM = true;
                        }
                        InjecRecord[URL] = true;
                    });
                });
            }
            Core(Syn.$url);
            Syn.onUrlChange((change) => {
                Core(change.url);
            });
        })();
    })();
})();