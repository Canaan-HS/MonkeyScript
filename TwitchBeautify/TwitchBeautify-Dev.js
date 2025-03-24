// ==UserScript==
// @name         Twitch Beautify
// @name:zh-TW   Twitch Beautify
// @name:zh-CN   Twitch Beautify
// @name:ko      Twitch Beautify
// @name:ja      Twitch Beautify
// @name:en      Twitch Beautify
// @version      0.0.23
// @author       Canaan HS
// @description         直播頁面: 自動美化、滑鼠懸浮時自動收合按鈕、重新播放功能自動觸發。 首頁: 恢復原始樣式、自動暫停與靜音、可拖曳與縮放直播窗口。
// @description:zh-TW   直播頁面: 自動美化、滑鼠懸浮時自動收合按鈕、重新播放功能自動觸發。 首頁: 恢復原始樣式、自動暫停與靜音、可拖曳與縮放直播窗口。
// @description:zh-CN   直播页面：自动美化、鼠标悬浮时自动收合按钮、重新播放功能自动触发。 首页： 恢复原始样式、自动暂停与静音、可拖拽与缩放直播窗口。
// @description:ko      라이브 페이지: 자동 미화, 마우스 호버 시 자동으로 버튼 접기, 재생 기능 자동 트리거. 홈 페이지: 원래 스타일 복원, 자동 일시정지 및 음소거, 라이브 창 드래그 및 확대/축소 가능.
// @description:ja      ライブページ：自動美化、マウスホバー時に自動的にボタンを折りたたむ、再生機能が自動的にトリガーされる。ホーム：元のスタイルに戻す、自動停止とミュート、ライブウィンドウをドラッグアンドドロップして拡大縮小できる。
// @description:en      Live page: Auto-beautify, auto-collapse buttons on mouse hover, auto-trigger replay function. Home page: Restore original style, auto-pause and mute, draggable and scalable live window.

// @match        *://*.twitch.tv/*
// @icon         https://cdn-icons-png.flaticon.com/512/9290/9290165.png

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635

// @run-at       document-body
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_getResourceText
// @grant        window.onurlchange
// @grant        GM_registerMenuCommand

// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js
// @require      https://update.greasyfork.org/scripts/495339/1551581/ObjectSyntax_min.js
// @resource     jui https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/themes/base/jquery-ui.min.css
// ==/UserScript==

(function() {
    function language(lang) {
        const Display = {
            Simplified: {MS_01: "🛠️ 已禁用美化❌", MS_02: "🛠️ 已启用美化✅"},
            Traditional: {MS_01: "🛠️ 已禁用美化❌", MS_02: "🛠️ 已啟用美化✅"},
            Korea: {MS_01: "🛠️ 뷰티파이 비활성화됨❌", MS_02: "🛠️ 뷰티파이 활성화됨✅"},
            Japan: {MS_01: "🛠️ ビューティファイが無効です❌", MS_02: "🛠️ ビューティファイが有効です✅"},
            English: {MS_01: "🛠️ Beautification disabled❌", MS_02: "🛠️ Beautification enabled✅"}
        }, Match = {
            "ja": Display.Japan,
            "ko": Display.Korea,
            "en-US": Display.English,
            "zh-CN": Display.Simplified,
            "zh-SG": Display.Simplified,
            "zh-TW": Display.Traditional,
            "zh-HK": Display.Traditional,
            "zh-MO": Display.Traditional
        };
        return Match[lang] || Match["en-US"];
    }
    const lang = language(Syn.Device.Lang);

    (new class Beautify {
        constructor() {
            this.Nav = null;
            this.Frame = null;
            this.Resume = null;
            this.Chat_Button = null;
            this.Channel_Button = null;
            this.Channel_Parent = null;
            this.Control_Token = null;
            this.Control_Timeout = null;
            this.Control_Interval = null;
            this.IsLive = (Url) => /^https:\/\/www\.twitch\.tv\/(?!directory|settings|drops|wallet|subscriptions).+[^\/]$/.test(Url);

            // 菜單註冊
            this.RegisterMenu = (Name) => {
                Syn.Menu({
                    [Name]: {
                        func: ()=> this.Use(), close: false
                    }
                })
            }

            /* 到 Live 頁面觸發美化 */
            this.Start = async() => {
                Syn.AddListener(window, "urlchange", change => {
                    if (this.IsLive(change.url)) {
                        Syn.RemovListener(window, "urlchange");
                        this.Trigger();
                    }
                })
            }

            /* 回到大廳觸發 恢復 */
            this.End = async() => {
                Syn.AddListener(window, "urlchange", change => {
                    if (!this.IsLive(change.url)) {
                        this.Reset();
                        this.Fun($("div[data-a-player-state='mini']")); // 添加可拖動
                        this.Start();
                    }
                })
            }

            /* 切換使用狀態 */
            this.Use = async() => {
                if (Syn.Store("g", "Beautify", [])) {
                    this.Reset();
                    this.RegisterMenu(lang.MS_01);
                    Syn.Store("s", "Beautify", false);
                } else {
                    const Url = document.URL;
                    this.IsLive(Url) ? this.Trigger() : this.Start();
                    this.RegisterMenu(lang.MS_02);
                    Syn.Store("s", "Beautify", true);
                }
            }

            /* 重置所有設置 */
            this.Reset = async() => {
                if (this.Nav) { // 確保有元素 (只判斷一項)
                    this.Resume.disconnect();
                    Syn.RemovListener(window, "urlchange");

                    requestAnimationFrame(() => {
                        this.Nav.classList.remove("Nav_Effect");
                        this.Channel_Button.removeAttribute("style");
                        this.Channel_Button.classList.remove("Button_Effect");
                        this.Channel_Parent.classList.remove("Channel_Expand_Effect");
                    });

                    Syn.RemovListener(this.Channel_Button, "mouseenter");
                    Syn.RemovListener(this.Channel_Button, "mouseleave");
                }
            }
        }

        /* 主運行程式 */
        async Main() {
            this.ImportStyle(); // 導入樣式

            if (Syn.Store("g", "Beautify", [])) {
                this.ClearFooter(); // 清除頁腳
                this.RegisterMenu(lang.MS_02); // 註冊菜單

                this.IsLive(Syn.Device.Url)
                ? this.Trigger()
                : (this.Start(), this.PlayControl(false));
            } else {
                this.RegisterMenu(lang.MS_01);
            }
        }

        /* Live 頁面觸發美化 */
        async Trigger() {
            Syn.WaitElem([
                "nav", // 導覽列
                ".side-nav", // 頻道元素
                ".side-nav-section div", // 判斷收合狀態
                "[data-a-player-state='']", // 影片區塊
                "[data-a-target='side-nav-arrow']", // 頻道列 button
                "[data-a-target='right-column__toggle-collapse-btn']" // 聊天室 button
            ], found=> {
                const [
                    Nav, Channel, Collapsed_State, VideoFrame, Channel_Button, Chat_Button
                ] = found;

                this.Nav = Nav;
                this.Frame = VideoFrame;
                this.Chat_Button = Chat_Button;
                this.Channel_Button = Channel_Button;
                this.Channel_Parent = Channel.parentNode;

                this.Beautify(); // 介面美化 (大廳重置)
                this.AutoClick(); // 使用自動點擊 (大廳重置)
                this.ResumeWatching(); // 自動恢復觀看 (大廳重置)
                this.PlayControl(true); // 恢復播放
                this.Fun($(VideoFrame), false); // 重置可拖動
                !Collapsed_State.getAttribute("data-a-target") && Channel_Button.click(); // 自動展開菜單

                this.End(); // 監聽回大廳
            }, {raf: true});
        }

        // 整體框架美化
        async Beautify() {
            requestAnimationFrame(() => {
                this.Nav.classList.add("Nav_Effect");
                // this.Frame.style.zIndex = "9999";
                this.Channel_Parent.classList.add("Channel_Expand_Effect");
            })
        }

        // 自動點擊
        async AutoClick() {
            this.Chat_Button.classList.add("Button_Effect");
            this.Channel_Button.classList.add("Button_Effect");
            this.Channel_Button.style.transform = "translateY(15px)";

            // 頻道列
            let Channel_timer;
            Syn.AddListener(this.Channel_Button, "mouseenter", ()=> {
                Channel_timer = setTimeout(()=> {
                    this.Channel_Button.click();
                }, 250);
            });
            Syn.AddListener(this.Channel_Button, "mouseleave", ()=> {
                clearTimeout(Channel_timer);
                this.Channel_Button.classList.add("Button_Effect");
            });

            // 聊天室
            let Chat_timer; // 分開使用避免意外
            Syn.AddListener(this.Chat_Button, "mouseenter", ()=> {
                Chat_timer = setTimeout(()=> {
                    this.Chat_Button.click();
                }, 250);
            });
            Syn.AddListener(this.Chat_Button, "mouseleave", ()=> {
                clearTimeout(Chat_timer);
                this.Chat_Button.classList.add("Button_Effect");
            });
        }

        /* 影片播放 與 聲音操作 */
        async PlayControl(control) {
            // 控製是 true, 就是播放, 和恢復聲音
            clearTimeout(this.Control_Timeout); // 呼叫時清除先前狀態
            clearInterval(this.Control_Interval);

            const Token = Symbol("Token");
            this.Control_Token = Token;

            Syn.WaitElem("video", video => {
                if (this.Control_Token !== Token) return;

                const ControlRun = control
                    ? () => {
                        video.play();
                        video.muted = false;
                    }
                    : () => {
                        video.pause();
                        video.muted = true;
                    };

                this.Control_Interval = setInterval(ControlRun, 500);
                this.Control_Timeout = setTimeout(()=> { // 8 秒後無論狀態如何都清除
                    clearInterval(this.Control_Interval);
                }, 8000);

            }, { raf: true });
        }

        /* 自動恢復觀看 */
        async ResumeWatching() {
            let Recover;
            this.Resume = new MutationObserver(() => {
                Recover = Syn.$$(".itFOsv")
                Recover && Recover.click();
            });
            this.Resume.observe(this.Frame, {childList: true, subtree: true});
        }

        // 清除頁腳
        async ClearFooter() {
            Syn.WaitElem("#twilight-sticky-footer-root", footer=> {
                footer.remove();
            }, {throttle: 200});
        }

        /* 拖動效果添加 */
        async Fun(element, state=true) {
            if (element.length > 0) {
                if (state) {

                    element.draggable({ // 設置可拖動
                        cursor: "grabbing",
                        start: function() {
                            $(this).find(".doeqbO").addClass("Drag_Effect");
                        },
                        stop: function() {
                            $(this).find(".doeqbO").removeClass("Drag_Effect");
                        }
                    });


                    element.css({ // 設置初始寬度
                        top: $("nav").height() - 10,
                        left: $(".side-nav").width() - 10,
                        width: window.innerWidth * 0.68,
                        height:  window.innerHeight * 0.88,
                    });
                    element.resizable({ // 設置可縮放
                        minWidth: 50,
                        minHeight: 50,
                        handles: "all",
                        aspectRatio: 16 / 10
                    });
                } else {
                    if (element.data("ui-draggable")) {
                        element.draggable("destroy");
                        element.resizable("destroy");
                    }
                }
            }
        }

        /* 導入樣式 */
        async ImportStyle() {
            Syn.AddStyle(`
                ${GM_getResourceText("jui")}
                .Nav_Effect {
                    opacity: 0;
                    height: 1rem !important;
                    transition: opacity 0.5s , height 0.8s;
                }
                .Nav_Effect:hover {
                    opacity: 1;
                    height: 5rem !important;
                }
                .Channel_Expand_Effect {
                    opacity: 0;
                    width: 1rem;
                    transition: opacity 0.4s , width 0.7s;
                }
                .Channel_Expand_Effect:hover {
                    opacity: 1;
                    width: 24rem;
                }
                .Button_Effect {
                    transform: translateY(10px);
                    color: rgba(239, 239, 241, 0.3) !important;
                }
                .Button_Effect:hover {
                    color: rgb(239, 239, 241) !important;
                }
                .Drag_Effect {
                    border-radius: 10px;
                    border: 2px solid white;
                }
            `, "Effect");
        }
    }).Main();
})();