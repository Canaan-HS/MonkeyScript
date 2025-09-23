import { Lib } from "../services/client.js";
import { Config, Param } from '../core/config.js';

import Tools from '../core/tools.js';
import Transl from '../core/language.js';

export default function Main() {
    const hotKey = Config.HotKey;
    const injecRecord = new Set();

    async function core(url) {
        const pageType = Tools.pageType(url);
        Tools.devPrint(Transl("頁面類型"), pageType, url);

        if (pageType === "NotSupport" || injecRecord.has(url)) return;

        Lib.waitEl("#columns, #contents", null, { raf: true, timeoutResult: true }).then(trigger => {

            if (!trigger) {
                Lib.log(Transl("查找框架失敗")).error;
                return;
            };

            Config.Dev && (Param.StartTime = Lib.runTime());
            Lib.regMenu({ [Transl("📜 預設熱鍵")]: () => { alert(Transl("快捷提示")) } });

            // 隱藏結尾推薦樣式
            Lib.addStyle(`
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
            `, "Youtube-Hide-Tool", false);

            // 等待影片頁面需隱藏的數據
            Lib.waitEl([
                "title", "#title h1", "#end", "#below",
                "#secondary.style-scope.ytd-watch-flexy", "#secondary-inner",
                "#related", "#comments", "#actions"
            ], null, { throttle: 80, characterData: true, timeoutResult: true }).then(found => {
                Tools.devPrint(Transl("隱藏元素"), found);

                const [
                    title, h1, end, below, secondary, inner, related, comments, actions
                ] = found;

                // 極簡化
                if (Lib.getV("Minimalist")) {
                    Tools.titleOb.observe(title, Tools.titleOp);
                    Tools.styleTransform([document.body], "overflow", "hidden");
                    Tools.styleTransform([h1, end, below, secondary, related], "display", "none").then(state => Tools.devTimePrint(Transl("極簡化"), state));
                    Lib.title("...");
                } else {
                    // 標題
                    if (Lib.getV("Title")) {
                        Tools.titleOb.observe(title, Tools.titleOp);
                        Tools.styleTransform([h1], "display", "none").then(state => Tools.devTimePrint(Transl("隱藏標題"), state));
                        Lib.title("...");
                    };

                    // 推薦播放
                    if (Lib.getV("RecomViewing")) {
                        Tools.styleTransform([secondary, related], "display", "none").then(state => Tools.devTimePrint(Transl("隱藏推薦觀看"), state));
                    };

                    // 評論區
                    if (Lib.getV("Comment")) {
                        Tools.styleTransform([comments], "display", "none").then(state => Tools.devTimePrint(Transl("隱藏留言區"), state));
                    };

                    // 功能選項區
                    if (Lib.getV("FunctionBar")) {
                        Tools.styleTransform([actions], "display", "none").then(state => Tools.devTimePrint(Transl("隱藏功能選項"), state));
                    };
                };

                // 調整操作
                const modify = {
                    title: (mode, save = "Title") => { // 以下的 save 不需要, 就傳遞 false 或是 空值
                        mode = save ? mode : !mode; // 同上

                        Lib.title(mode ? (
                            Tools.titleOb.disconnect(), Tools.titleFormat(h1)
                        ) : (
                            Tools.titleOb.observe(title, Tools.titleOp), "..."
                        ));
                        Tools.hideJudgment(h1, save);
                    },
                    minimalist: (mode, save = true) => { // 這個比較特別, 他時直接在這操作存儲, 所以 save 是 Boolen
                        mode = save ? mode : !mode; // 全局修改時的判斷 mode 需要是反的, 剛好全局判斷的 save 始終為 false, 所以這樣寫

                        if (mode) {
                            modify.title(false, false);
                            save && Lib.setV("Minimalist", false);
                            Tools.styleTransform([document.body], "overflow", "auto");
                            Tools.styleTransform([end, below, secondary, related], "display", "block");
                        } else {
                            modify.title(true, false);
                            save && Lib.setV("Minimalist", true);
                            Tools.styleTransform([document.body], "overflow", "hidden");
                            Tools.styleTransform([end, below, secondary, related], "display", "none");
                        }
                    },
                    recomViewing: (_, save = "RecomViewing") => {
                        if (inner.childElementCount > 1) {
                            Tools.hideJudgment(secondary);
                            Tools.hideJudgment(related, save);
                            Param.Token = false;
                        } else {
                            Tools.hideJudgment(related, save);
                            Param.Token = true;
                        }
                    },
                    comment: (_, save = "Comment") => {
                        Tools.hideJudgment(comments, save);
                    },
                    functionBar: (_, save = "FunctionBar") => {
                        Tools.hideJudgment(actions, save);
                    }
                };

                // 註冊快捷鍵
                Lib.onEvent(document, "keydown", event => {
                    if (hotKey.MinimaList(event)) {
                        event.preventDefault();
                        modify.minimalist(Lib.getV("Minimalist"));
                    } else if (hotKey.Title(event)) {
                        event.preventDefault();
                        modify.title(Lib.title() === "...");
                    } else if (hotKey.RecomViewing(event)) {
                        event.preventDefault();
                        modify.recomViewing();
                    } else if (hotKey.Comment(event)) {
                        event.preventDefault();
                        modify.comment();
                    } else if (hotKey.FunctionBar(event)) {
                        event.preventDefault();
                        modify.functionBar();
                    }
                }, { capture: true });

                // 動態全局修改
                if (Config.GlobalChange) {
                    Lib.storeListen(["Minimalist", "Title", "RecomViewing", "Comment", "FunctionBar"], call => {
                        if (call.far) modify[call.key](call.nv, false);
                    });
                };

                injecRecord.add(url);
            });
        });
    };

    core(Lib.$url); // 立即運行
    Lib.onUrlChange(change => {
        core(change.url); // 監聽變化
    });
};