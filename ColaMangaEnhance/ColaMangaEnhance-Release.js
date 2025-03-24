// ==UserScript==
// @name         ColaManga 瀏覽增強
// @name:zh-TW   ColaManga 瀏覽增強
// @name:zh-CN   ColaManga 浏览增强
// @name:en      ColaManga Browsing Enhancement
// @version      0.0.11-Beta4
// @author       Canaan HS
// @description       隱藏廣告內容，提昇瀏覽體驗。自訂背景顏色，圖片大小調整。當圖片載入失敗時，自動重新載入圖片。提供熱鍵功能：[← 上一頁]、[下一頁 →]、[↑ 自動上滾動]、[↓ 自動下滾動]。當用戶滾動到頁面底部時，自動跳轉到下一頁。
// @description:zh-TW 隱藏廣告內容，提昇瀏覽體驗。自訂背景顏色，圖片大小調整。當圖片載入失敗時，自動重新載入圖片。提供熱鍵功能：[← 上一頁]、[下一頁 →]、[↑ 自動上滾動]、[↓ 自動下滾動]。當用戶滾動到頁面底部時，自動跳轉到下一頁。
// @description:zh-CN 隐藏广告内容，提昇浏览体验。自定义背景颜色，调整图片大小。当图片载入失败时，自动重新载入图片。提供快捷键功能：[← 上一页]、[下一页 →]、[↑ 自动上滚动]、[↓ 自动下滚动]。当用户滚动到页面底部时，自动跳转到下一页。
// @description:en    Hide advertisement content, enhance browsing experience. Customize background color, adjust image size. Automatically reload images when they fail to load. Provide shortcut key functionalities: [← Previous Page], [Next Page →], [↑ Auto Scroll Up], [↓ Auto Scroll Down]. Automatically jump to the next page when users scroll to the bottom of the page.

// @match        *://www.colamanga.com/manga-*/*/*.html
// @icon         https://www.colamanga.com/favicon.png

// @license      MIT
// @namespace    https://greasyfork.org/users/989635

// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue

// @require      https://update.greasyfork.org/scripts/487608/1456525/ClassSyntax_min.js
// ==/UserScript==

(async () => {
    /* 臨時的自定義 (當 Enable = false 時, 其餘的設置將無效) */
    const Config = {
        BGColor: {
            Enable: true,
            Color: "#595959",
        },
        AutoTurnPage: { // 自動翻頁
            Enable: true,
            Mode: 5, // 1 = 快速 | 2 = 普通 | 3 = 緩慢 | 4 = 一般無盡 | 5 = 優化無盡
        },
        RegisterHotkey: { // 快捷功能
            Enable: true,
            Function: { // 移動端不適用以下配置
                TurnPage: true, // 翻頁
                AutoScroll: true, // 自動滾動
                KeepScroll: true, // 換頁繼續滾動
                ManualScroll: false, // 手動滾動啟用時, 將會變成點擊一次, 根據視點翻一頁 且 自動滾動會無效
            }
        }
    };
    new class Manga extends Syntax {
        constructor() {
            super();
            this.ScrollPixels = 2;
            this.WaitPicture = 1e3;
            this.IsFinalPage = false;
            this.AdCleanup = this.Body = null;
            this.ContentsPage = this.HomePage = null;
            this.PreviousPage = this.NextPage = null;
            this.MangaList = this.BottomStrip = null;
            this.Up_scroll = this.Down_scroll = false;
            this.Observer_Next = null;
            this.IsMainPage = window.self === window.parent;
            this.BlockListener = new Set(["pointerup", "pointerdown", "dState", "touchstart", "unhandledrejection"]);
            this.Id = {
                Title: "CME_Title",
                Iframe: "CME_Iframe",
                Block: "CME_Block-Ads",
                Menu: "CME_Menu-Style",
                Image: "CME_Image-Style",
                Scroll: "CME_Scroll-Hidden",
                ChildS: "CME_Child-Scroll-Hidden"
            };
            this.Get_Data = async callback => {
                this.WaitMap(["body", "div.mh_readtitle", "div.mh_headpager", "div.mh_readend", "#mangalist"], element => {
                    const [Body, Title, HeadPager, Readend, Manga] = element;
                    this.Body = Body;
                    const HomeLink = this.$$("a", {
                        all: true,
                        root: Title
                    });
                    this.ContentsPage = HomeLink[0].href;
                    this.HomePage = HomeLink[1].href;
                    try {
                        const PageLink = this.$$("ul a", {
                            all: true,
                            root: Readend
                        });
                        this.PreviousPage = PageLink[0].href;
                        this.NextPage = PageLink[2].href;
                    } catch {
                        const PageLink = this.$$("a.mh_btn:not(.mh_bgcolor)", {
                            all: true,
                            root: HeadPager
                        });
                        this.PreviousPage = PageLink[0].href;
                        this.NextPage = PageLink[1].href;
                    }
                    this.MangaList = Manga;
                    this.BottomStrip = this.$$("a", {
                        root: Readend
                    });
                    if ([this.Body, this.ContentsPage, this.HomePage, this.PreviousPage, this.NextPage, this.MangaList, this.BottomStrip].every(Check => Check)) callback(true); else callback(false);
                }, {
                    timeout: 10,
                    timeoutResult: true,
                    object: document
                });
            };
            this.Get_Nodes = Root => {
                const nodes = [];
                const IdWhiteList = new Set(Object.values(this.Id));
                function Task(root) {
                    const tree = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
                        acceptNode: node => {
                            if (IdWhiteList.has(node.id)) {
                                return NodeFilter.FILTER_REJECT;
                            }
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    });
                    while (tree.nextNode()) {
                        nodes.push(tree.currentNode);
                    }
                }
                Task(Root.head);
                Task(Root.body);
                return nodes;
            };
            this.storage = (key, value = null) => {
                return value != null ? this.Storage(key, {
                    value: value
                }) : this.Storage(key);
            };
            this.TopDetected = this.Throttle(() => {
                this.Up_scroll = this.Device.sY() == 0 ? (this.storage("scroll", false),
                    false) : true;
            }, 1e3);
            this.BottomDetected = this.Throttle(() => {
                this.Down_scroll = this.Device.sY() + this.Device.iH() >= document.documentElement.scrollHeight ? (this.storage("scroll", false),
                    false) : true;
            }, 1e3);
            this.AutoScroll = move => {
                requestAnimationFrame(() => {
                    if (this.Up_scroll && move < 0) {
                        window.scrollBy(0, move);
                        this.TopDetected();
                        this.AutoScroll(move);
                    } else if (this.Down_scroll && move > 0) {
                        window.scrollBy(0, move);
                        this.BottomDetected();
                        this.AutoScroll(move);
                    }
                });
            };
            this.ManualScroll = move => {
                window.scrollBy({
                    left: 0,
                    top: move,
                    behavior: "smooth"
                });
            };
            this.FinalPage = link => {
                this.IsFinalPage = link.startsWith("javascript");
                return this.IsFinalPage;
            };
            this.VisibleObjects = object => object.filter(img => img.height > 0 || img.src);
            this.ObserveObject = object => object[Math.max(object.length - 2, 0)];
            this.DetectionValue = object => this.VisibleObjects(object).length >= Math.floor(object.length * .5);
            this.Get_Style = () => {
                const Style = this.Store("g", "Style") || [{
                    BG_Color: "#595959",
                    Img_Bw: "auto",
                    Img_Mw: "100%"
                }];
                return Style[0];
            };
            this.ImgStyle = this.Get_Style();
        }
        async BlockAds() {
            const OriginListener = EventTarget.prototype.addEventListener, Block = this.BlockListener;
            const EventListeners = new Map();
            EventTarget.prototype.addEventListener = function (type, listener, options) {
                if (Block.has(type)) return;
                if (!EventListeners.has(this)) EventListeners.set(this, []);
                EventListeners.get(this).push({
                    type: type,
                    listener: listener,
                    options: options
                });
                OriginListener.call(this, type, listener, options);
            };
            function removeBlockedListeners() {
                EventListeners.forEach((listeners, element) => {
                    listeners.forEach(({
                        type,
                        listener
                    }) => {
                        if (Block.has(type)) {
                            element.removeEventListener(type, listener);
                        }
                    });
                });
            }
            this.AddStyle(`
                html {pointer-events: none !important;}
                .mh_wrap, span.mh_btn:not(.contact), ${this.Id.Iframe} {pointer-events: auto;}
            `, this.Id.Block);
            this.AdCleanup = setInterval(() => {
                this.$$(`iframe:not(#${this.Id.Iframe})`)?.remove();
                removeBlockedListeners();
            }, 500);
        }
        async BackgroundStyle(Color) {
            this.Body.style.cssText = `
                background: ${Color} !important;
            `;
            document.documentElement.style.cssText = `
                overflow: visible !important;
            `;
        }
        async AutoReload() {
            let click = new MouseEvent("click", {
                bubbles: true,
                cancelable: true
            });
            const observer = new IntersectionObserver(observed => {
                observed.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.dispatchEvent(click);
                    }
                });
            }, {
                threshold: .3
            });
            this.$$("span.mh_btn:not(.contact):not(.read_page_link)", {
                all: true,
                root: this.MangaList
            }).forEach(reloadBtn => observer.observe(reloadBtn));
        }
        async PictureStyle() {
            if (this.Device.Type() == "Desktop") {
                this.AddStyle(`
                    .mh_comicpic img {
                        margin: auto;
                        display: block;
                        cursor: pointer;
                        vertical-align: top;
                        width: ${this.ImgStyle.Img_Bw};
                        max-width: ${this.ImgStyle.Img_Mw};
                    }
                `, this.Id.Image);
            }
            setTimeout(() => {
                this.AutoReload();
            }, this.WaitPicture);
        }
        async HotkeySwitch(Use) {
            let JumpState = false;
            if (this.Device.Type() == "Desktop") {
                if (this.IsMainPage && Use.KeepScroll && Use.AutoScroll && !Use.ManualScroll) {
                    this.Down_scroll = this.storage("scroll");
                    this.Down_scroll && this.AutoScroll(this.ScrollPixels);
                }
                const UP_ScrollSpeed = -this.ScrollPixels;
                const CanScroll = Use.AutoScroll || Use.ManualScroll;
                this.AddListener(window, "keydown", event => {
                    const key = event.key;
                    if (key == "ArrowLeft" && Use.TurnPage && !JumpState) {
                        event.stopImmediatePropagation();
                        JumpState = !this.FinalPage(this.PreviousPage);
                        location.assign(this.PreviousPage);
                    } else if (key == "ArrowRight" && Use.TurnPage && !JumpState) {
                        event.stopImmediatePropagation();
                        JumpState = !this.FinalPage(this.NextPage);
                        location.assign(this.NextPage);
                    } else if (key == "ArrowUp" && CanScroll) {
                        event.stopImmediatePropagation();
                        event.preventDefault();
                        if (Use.ManualScroll) {
                            this.ManualScroll(-this.Device.iH());
                        } else {
                            if (this.Up_scroll) {
                                this.Up_scroll = false;
                            } else if (!this.Up_scroll || this.Down_scroll) {
                                this.Down_scroll = false;
                                this.Up_scroll = true;
                                this.AutoScroll(UP_ScrollSpeed);
                            }
                        }
                    } else if (key == "ArrowDown" && CanScroll) {
                        event.stopImmediatePropagation();
                        event.preventDefault();
                        if (Use.ManualScroll) {
                            this.ManualScroll(this.Device.iH());
                        } else {
                            if (this.Down_scroll) {
                                this.Down_scroll = false;
                                this.storage("scroll", false);
                            } else if (this.Up_scroll || !this.Down_scroll) {
                                this.Up_scroll = false;
                                this.Down_scroll = true;
                                this.storage("scroll", true);
                                this.AutoScroll(this.ScrollPixels);
                            }
                        }
                    }
                }, {
                    capture: true
                });
            } else if (this.Device.Type() == "Mobile") {
                let startX, startY, moveX, moveY;
                const sidelineX = this.Device.iW() * .3;
                const sidelineY = this.Device.iH() / 4 * .3;
                this.AddListener(window, "touchstart", event => {
                    startX = event.touches[0].clientX;
                    startY = event.touches[0].clientY;
                }, {
                    passive: true
                });
                this.AddListener(window, "touchmove", this.Debounce(event => {
                    moveY = event.touches[0].clientY - startY;
                    if (Math.abs(moveY) < sidelineY) {
                        moveX = event.touches[0].clientX - startX;
                        if (moveX > sidelineX && !JumpState) {
                            JumpState = !this.FinalPage(this.PreviousPage);
                            location.assign(this.PreviousPage);
                        } else if (moveX < -sidelineX && !JumpState) {
                            JumpState = !this.FinalPage(this.NextPage);
                            location.assign(this.NextPage);
                        }
                    }
                }, 60), {
                    passive: true
                });
            }
        }
        async AutoPageTurn(Mode) {
            let self = this, hold, point, img;
            self.Observer_Next = new IntersectionObserver(observed => {
                observed.forEach(entry => {
                    if (entry.isIntersecting && self.DetectionValue(img)) {
                        self.Observer_Next.disconnect();
                        !self.FinalPage(self.NextPage) && location.assign(self.NextPage);
                    }
                });
            }, {
                threshold: hold
            });
            switch (Mode) {
                case 2:
                    hold = .5;
                    point = self.$$("li:nth-child(3) a.read_page_link");
                    break;

                case 3:
                    hold = 1;
                    point = self.$$("div.endtip2.clear");
                    break;

                case 4:
                case 5:
                    this.UnlimitedPageTurn(Mode == 5);
                    break;

                default:
                    hold = .1;
                    point = self.BottomStrip;
            }
            if (point) {
                setTimeout(() => {
                    img = self.$$("img", {
                        all: true,
                        root: self.MangaList
                    });
                    self.Observer_Next.observe(point);
                }, self.WaitPicture);
            }
        }
        async UnlimitedPageTurn(Optimized) {
            const self = this;
            const iframe = document.createElement("iframe");
            iframe.id = this.Id.Iframe;
            iframe.src = self.NextPage;
            this.AddStyle(`
                .mh_wrap, .mh_readend, .mh_footpager,
                .fed-foot-info, #imgvalidation2022 {display: none;}
                body {
                    margin: 0;
                    padding: 0;
                }
                #${this.Id.Iframe} {
                    margin: 0;
                    padding: 0;
                    height: 110vh;
                    width: 100%;
                    border: none;
                }
            `, this.Id.Scroll);
            if (this.IsMainPage) {
                this.Listen(window, "message", event => {
                    const data = event.data;
                    if (data && data.length > 0) {
                        document.title = data[0];
                        this.NextPage = data[3];
                        this.PreviousPage = data[1];
                        history.pushState(null, null, data[2]);
                    }
                });
            } else {
                this.AddStyle(`
                    html {
                        overflow: hidden !important;
                        overflow-x: hidden !important;
                        scrollbar-width: none !important;
                        -ms-overflow-style: none !important;
                    }
                    html::-webkit-scrollbar {
                        display: none !important;
                    }
                `, this.Id.ChildS);
                let MainWindow = window;
                this.Listen(window, "message", event => {
                    while (MainWindow.parent !== MainWindow) {
                        MainWindow = MainWindow.parent;
                    }
                    MainWindow.postMessage(event.data, self.Origin);
                });
            }
            TriggerNextPage();
            async function TriggerNextPage() {
                let Img, Observer, Quantity = 0;
                self.Observer_Next = new IntersectionObserver(observed => {
                    observed.forEach(entry => {
                        if (entry.isIntersecting && self.DetectionValue(Img)) {
                            self.Observer_Next.disconnect();
                            Observer.disconnect();
                            TurnPage();
                        }
                    });
                }, {
                    threshold: .1
                });
                setTimeout(() => {
                    Img = self.$$("img", {
                        all: true,
                        root: self.MangaList
                    });
                    if (Img.length <= 5) {
                        TurnPage();
                        return;
                    }
                    self.Observer(self.MangaList, () => {
                        const Visible = self.VisibleObjects(Img), VL = Visible.length;
                        if (VL > Quantity) {
                            Quantity = VL;
                            self.Observer_Next.disconnect();
                            self.Observer_Next.observe(self.ObserveObject(Visible));
                        }
                    }, {
                        throttle: 150
                    }, observer => {
                        Observer = observer.ob;
                    });
                }, self.WaitPicture);
            }
            async function TurnPage() {
                let Content, CurrentUrl, StylelRules = self.$$(`#${self.Id.Scroll}`).sheet.cssRules;
                if (self.FinalPage(self.NextPage)) {
                    StylelRules[0].style.display = "block";
                    return;
                }
                document.body.appendChild(iframe);
                Waitload();
                function Waitload() {
                    iframe.onload = () => {
                        CurrentUrl = iframe.contentWindow.location.href;
                        CurrentUrl != self.NextPage && (iframe.src = self.NextPage,
                            Waitload());
                        Content = iframe.contentWindow.document;
                        Content.body.style.overflow = "hidden";
                        const TopImg = self.$$("#mangalist img", {
                            root: Content
                        });
                        setInterval(() => {
                            StylelRules[2].style.height = `${Content.body.scrollHeight}px`;
                        }, 1500);
                        const UrlUpdate = new IntersectionObserver(observed => {
                            observed.forEach(entry => {
                                if (entry.isIntersecting) {
                                    UrlUpdate.disconnect();
                                    self.Log("無盡翻頁", CurrentUrl);
                                    const PageLink = self.$$("div.mh_readend ul a", {
                                        all: true,
                                        root: Content.body
                                    });
                                    const PreviousUrl = PageLink[0]?.href;
                                    const NextUrl = PageLink[2]?.href;
                                    window.parent.postMessage([Content.title, PreviousUrl, CurrentUrl, NextUrl], self.Origin);
                                }
                            });
                        }, {
                            threshold: .1
                        });
                        UrlUpdate.observe(TopImg);
                        if (Optimized) {
                            self.$$("title").id = self.Id.Title;
                            const adapt = self.Device.Type() == "Desktop" ? .5 : .7;
                            const hold = Math.min(adapt, self.Device.iH() * adapt / TopImg.clientHeight);
                            const ReleaseMemory = new IntersectionObserver(observed => {
                                observed.forEach(entry => {
                                    if (entry.isIntersecting) {
                                        ReleaseMemory.disconnect();
                                        self.Get_Nodes(document).forEach(node => {
                                            node.remove();
                                        });
                                        TopImg.scrollIntoView();
                                    }
                                });
                            }, {
                                threshold: hold
                            });
                            ReleaseMemory.observe(TopImg);
                        }
                    };
                    iframe.onerror = () => {
                        iframe.src = self.NextPage;
                        Waitload();
                    };
                }
            }
        }
        async Injection() {
            this.BlockAds();
            try {
                this.Get_Data(state => {
                    if (state) {
                        this.PictureStyle();
                        Config.BGColor.Enable && this.BackgroundStyle(Config.BGColor.Color);
                        Config.AutoTurnPage.Enable && this.AutoPageTurn(Config.AutoTurnPage.Mode);
                        Config.RegisterHotkey.Enable && this.HotkeySwitch(Config.RegisterHotkey.Function);
                    } else this.Log(null, "Error");
                });
            } catch (error) {
                this.Log(null, error);
            }
        }
    }().Injection();
})();