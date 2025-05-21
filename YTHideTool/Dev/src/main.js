import {
    monkeyWindow,
    GM_setValue,
    GM_getValue,
    GM_registerMenuCommand,
    GM_addValueChangeListener,
} from 'vite-plugin-monkey/dist/client';
const { Syn } = monkeyWindow;

import { Config, Match } from './config.js';
import Dict from './language.js';

(async () => {
    const { Transl } = (() => {
        const Matcher = Syn.TranslMatcher(Dict);
        return {
            Transl: (Str) => Matcher[Str] ?? Str,
        }
    })();

    (() => {
        let MRM = null; // 菜單註冊標記
        let GCM = null; // 全局變更標記
        let RST = null; // 運行開始時間
        let TFT = false; // 轉換觸發器

        const InjecRecord = {};
        const HotKey = Config.HotKey;

        /* 判斷頁面 */
        const PageType = (url) =>
            Match.Video.test(url) ? "Video"
                : Match.Live.test(url) ? "Live"
                    : Match.Playlist.test(url) ? "Playlist"
                        : "NotSupport";

        /* 標題格式 (傳入標題元素) */
        const TitleFormat = (title) => title.$text().replace(/^\s+|\s+$/g, "");

        /* 開發模式 - 打印 (語法簡化) */
        const DevPrint = (title, content, show = Config.Dev) => {
            Syn.Log(title, content, { dev: show, collapsed: false });
        };

        /*  開發模式 - 時間打印 (語法簡化) */
        const DevTimePrint = (title, show) => {
            DevPrint(title, Syn.Runtime(RST, { log: false }), show);
        };

        /**
         * 判斷設置
         * @param {Element} Element - 要修改的元素
         * @param {String} setKey - 要保存設置的 key, 如果沒傳遞該值, 就不會有保存操作
         */
        const HideJudgment = async (Element, setKey = null) => {
            if (Element.style.display == "none" || TFT) {
                Element.style.display = "block";
                setKey && Syn.sV(setKey, false);
            } else {
                Element.style.display = "none";
                setKey && Syn.sV(setKey, true);
            }
        };

        /**
         * 風格轉換器
         * @param {Array} ObjList - 要修改的元素列表
         * @param {String} Type - 要修改的樣式類型
         * @param {String} Style - 要修改的樣式
         * @returns 回傳修改是否成功狀態 (有開啟 Dev 才會運作)
         */
        const StyleTransform = async (ObjList, Type, Style) => {
            ObjList.forEach(element => { element.style[Type] = Style });
            if (Config.Dev) {
                return new Promise(resolve => {
                    resolve(ObjList.every(element => element.style[Type] == Style))
                });
            }
        };

        /* 監聽配置 */
        const TitleOp = { childList: true, subtree: false };
        /* 持續隱藏 */
        const TitleOb = new MutationObserver(() => {
            document.title != "..." && Syn.title("...");
        });

        async function Core(URL) {
            const Page = PageType(URL);
            DevPrint(Transl("頁面類型"), Page);

            if (Page === "NotSupport" || InjecRecord[URL]) return;

            Syn.WaitElem("#columns, #contents", null, { raf: true, timeout: 10, timeoutResult: true }).then(trigger => {
                if (!trigger) {
                    Syn.Log(null, Transl("查找框架失敗"), { type: "error" });
                    return;
                };

                Config.Dev && (RST = Syn.Runtime());
                MRM ??= GM_registerMenuCommand(Transl("📜 預設熱鍵"), () => { alert(Transl("快捷提示")) });

                if (Page === "Playlist") {
                    Syn.WaitElem("ytd-playlist-header-renderer.style-scope.ytd-browse", null, { throttle: 50, characterData: true, timeoutResult: true }).then(playlist => {
                        DevPrint(Transl("隱藏元素"), playlist);

                        // 播放清單資訊
                        if (Syn.gV("ListDesc")) {
                            StyleTransform([playlist], "display", "none").then(state => DevTimePrint(Transl("隱藏播放清單資訊"), state));
                        };

                        // ! 頁面切換時的監聽器重新註冊有 Bug, 會註冊失敗, 懶得處理
                        Syn.offEvent(document, "keydown");
                        Syn.onEvent(document, "keydown", event => {
                            if (HotKey.ListDesc(event)) {
                                event.preventDefault();
                                HideJudgment(playlist, "ListDesc");
                            }
                        });

                        InjecRecord[URL] = true;
                    });
                } else {
                    // 隱藏結尾推薦樣式
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

                    // 等待影片頁面需隱藏的數據
                    Syn.WaitElem([
                        "title", "#title h1", "#end", "#below",
                        "#secondary.style-scope.ytd-watch-flexy", "#secondary-inner",
                        "#related", "#comments", "#actions"
                    ], null, { throttle: 100, characterData: true, timeoutResult: true }).then(found => {
                        DevPrint(Transl("隱藏元素"), found);

                        const [
                            title, h1, end, below, secondary, inner, related, comments, actions
                        ] = found;

                        // 極簡化
                        if (Syn.gV("Minimalist")) {
                            TitleOb.observe(title, TitleOp);
                            StyleTransform([document.body], "overflow", "hidden");
                            StyleTransform([h1, end, below, secondary, related], "display", "none").then(state => DevTimePrint(Transl("極簡化"), state));
                            document.title = "...";
                        } else {
                            // 標題
                            if (Syn.gV("Title")) {
                                TitleOb.observe(title, TitleOp);
                                StyleTransform([h1], "display", "none").then(state => DevTimePrint(Transl("隱藏標題"), state));
                                document.title = "...";
                            };

                            // 推薦播放
                            if (Syn.gV("RecomViewing")) {
                                StyleTransform([secondary, related], "display", "none").then(state => DevTimePrint(Transl("隱藏推薦觀看"), state));
                            };

                            // 評論區
                            if (Syn.gV("Comment")) {
                                StyleTransform([comments], "display", "none").then(state => DevTimePrint(Transl("隱藏留言區"), state));
                            };

                            // 功能選項區
                            if (Syn.gV("FunctionBar")) {
                                StyleTransform([actions], "display", "none").then(state => DevTimePrint(Transl("隱藏功能選項"), state));
                            };
                        };

                        // 調整操作
                        const Modify = {
                            Title: (Mode, Save = "Title") => { // 以下的 Save 不需要, 就傳遞 false 或是 空值
                                Mode = Save ? Mode : !Mode; // 同上

                                document.title = Mode ? (
                                    TitleOb.disconnect(), TitleFormat(h1)
                                ) : (
                                    TitleOb.observe(title, TitleOp), "..."
                                );
                                HideJudgment(h1, Save);
                            },
                            Minimalist: (Mode, Save = true) => { // 這個比較特別, 他時直接在這操作存儲, 所以 Save 是 Boolen
                                Mode = Save ? Mode : !Mode; // 全局修改時的判斷 Mode 需要是反的, 剛好全局判斷的 Save 始終為 false, 所以這樣寫

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

                        // 註冊前嘗試移除舊的
                        Syn.offEvent(document, "keydown");
                        // 註冊快捷鍵
                        Syn.onEvent(document, "keydown", event => {
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

                        if (Config.GlobalChange && !GCM) {
                            // 動態全局修改
                            Syn.StoreListen(["Minimalist", "Title", "RecomViewing", "Comment", "FunctionBar"], call => {
                                if (call.far) Modify[call.key](call.nv, false);
                            });
                            GCM = true; // 標記註冊
                        };

                        InjecRecord[URL] = true;
                    });
                };
            });
        };

        Core(Syn.$url); // 立即運行
        Syn.onUrlChange(change => {
            Core(change.url); // 監聽變化
        });
    })();
})();