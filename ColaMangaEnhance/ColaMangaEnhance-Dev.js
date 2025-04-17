// ==UserScript==
// @name         ColaManga 瀏覽增強
// @name:zh-TW   ColaManga 瀏覽增強
// @name:zh-CN   ColaManga 浏览增强
// @name:en      ColaManga Browsing Enhance
// @version      0.0.11
// @author       Canaan HS
// @description       隱藏廣告內容，提昇瀏覽體驗。自訂背景顏色，圖片大小調整。當圖片載入失敗時，自動重新載入圖片。提供熱鍵功能：[← 上一頁]、[下一頁 →]、[↑ 自動上滾動]、[↓ 自動下滾動]。當用戶滾動到頁面底部時，自動跳轉到下一頁。
// @description:zh-TW 隱藏廣告內容，提昇瀏覽體驗。自訂背景顏色，圖片大小調整。當圖片載入失敗時，自動重新載入圖片。提供熱鍵功能：[← 上一頁]、[下一頁 →]、[↑ 自動上滾動]、[↓ 自動下滾動]。當用戶滾動到頁面底部時，自動跳轉到下一頁。
// @description:zh-CN 隐藏广告内容，提昇浏览体验。自定义背景颜色，调整图片大小。当图片载入失败时，自动重新载入图片。提供快捷键功能：[← 上一页]、[下一页 →]、[↑ 自动上滚动]、[↓ 自动下滚动]。当用户滚动到页面底部时，自动跳转到下一页。
// @description:en    Hide advertisement content, enhance browsing experience. Customize background color, adjust image size. Automatically reload images when they fail to load. Provide shortcut key functionalities: [← Previous Page], [Next Page →], [↑ Auto Scroll Up], [↓ Auto Scroll Down]. Automatically jump to the next page when users scroll to the bottom of the page.

// @match        *://www.colamanga.com/manga-*/*/*.html
// @icon         https://www.colamanga.com/favicon.png

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635

// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue

// @require      https://update.greasyfork.org/scripts/487608/1572649/SyntaxLite_min.js
// ==/UserScript==

/*
Todo 未來添加

// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jscolor/2.5.2/jscolor.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js
*/

(async () => {
    /**
     * 選單設置
     *
     * 背景色
     * 圖片基本寬度
     * 圖片最大寬度
     *
     * 開關功能
     *
     * 隱藏廣告
     * 快捷翻頁
     * 自動翻頁 => mode: 1 = 快速, 2 = 普通, 3 = 緩慢, 4 = 無盡
     * 自動滾動 => 速度設置 / 換頁繼續滾動
     *
     * 請求 document.querySelector(".all_data_list") 主頁數據
     * 製做一個 iframe 或其他 將主頁的選擇漫畫列表複製到菜單中
     *
     * 返回目錄按鈕 返回首頁按鈕
     * 點選模態框關閉 並自動保存 (先隱藏 隔 1 秒刪除, 製作效果, 注意避免重複創建)
     * 模態需要設置特別的標籤 , 要避免被廣告阻擋函數的樣式擋住
     */

    /* 臨時的自定義 (當 Enable = false 時, 其餘的設置將無效) */
    const Config = {
        BGColor: {
            Enable: true,
            Color: "#595959",
        },
        AutoTurnPage: { // 自動翻頁
            Enable: true,
            Mode: 4, // 1 = 快速 | 2 = 普通 | 3 = 緩慢 | 4 = 一般無盡 | 5 = 優化無盡
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
    (new class Manga {
        constructor() {
            this.ScrollPixels = 2; // 像素, 越高越快
            this.WaitPicture = 1000; // 等待圖片載入時間
            this.IsFinalPage = false; // 判斷是否為最終頁
            this.AdCleanup = this.Body = null; // 清理廣告的函數, body 元素
            this.ContentsPage = this.HomePage = null; // 返回目錄, 返回首頁, 連結
            this.PreviousPage = this.NextPage = null; // 下一頁, 上一頁, 連結
            this.MangaList = this.BottomStrip = null; // 漫畫列表, 底下觸發換頁條
            this.Up_scroll = this.Down_scroll = false; // 向上滾動, 向下滾動
            this.Observer_Next = null; // 下一頁觀察器

            this.IsMainPage = (window.self === window.parent); // 判斷是非 iframe
            this.BlockListener = new Set([
                "pointerup", "pointerdown", "dState", "touchstart", "unhandledrejection"
            ]);
            this.Id = { // Id 名稱表
                Title: "CME_Title", Iframe: "CME_Iframe", Block: "CME_Block-Ads", Menu: "CME_Menu-Style",
                Image: "CME_Image-Style", Scroll: "CME_Scroll-Hidden", ChildS: "CME_Child-Scroll-Hidden"
            };

            /* 取得數據 */
            this.Get_Data = async (callback) => {
                Syn.WaitElem(["body", "div.mh_readtitle", "div.mh_headpager", "div.mh_readend", "#mangalist"], null,
                    {raf: true, timeout: 10, timeoutResult: true})
                    .then(([Body, Title, HeadPager, Readend, Manga]) => {
                        this.Body = Body;

                        const HomeLink = Title.$qa("a");
                        this.ContentsPage = HomeLink[0].href; // 目錄連結
                        this.HomePage = HomeLink[1].href; // 首頁連結

                        try {
                            const PageLink = Readend.$qa("ul a");
                            this.PreviousPage = PageLink[0].href;
                            this.NextPage = PageLink[2].href;
                        } catch {
                            const PageLink = HeadPager.$qa("a.mh_btn:not(.mh_bgcolor)");
                            this.PreviousPage = PageLink[0].href;
                            this.NextPage = PageLink[1].href;
                        }

                        this.MangaList = Manga; // 漫畫列表
                        this.BottomStrip = Readend.$q("a"); // 以閱讀完畢的那條, 看到他跳轉

                        if([
                            this.Body,
                            this.ContentsPage,
                            this.HomePage,
                            this.PreviousPage,
                            this.NextPage,
                            this.MangaList,
                            this.BottomStrip
                        ].every(Check => Check)) callback(true);
                        else callback(false);
                    });
            };

            /* 取得釋放節點 */
            this.Get_Nodes = (Root) => {
                const nodes = [];
                const IdWhiteList = new Set(Object.values(this.Id));

                function Task(root) {
                    const tree = document.createTreeWalker(
                        root,
                        NodeFilter.SHOW_ELEMENT,
                        {
                            acceptNode: (node) => {
                                if (IdWhiteList.has(node.id)) {
                                    return NodeFilter.FILTER_REJECT;
                                }
                                return NodeFilter.FILTER_ACCEPT;
                            }
                        }
                    );

                    while (tree.nextNode()) {
                        nodes.push(tree.currentNode);
                    }
                };

                Task(Root.head);
                Task(Root.body);

                return nodes;
            };

            /* 存取會話數據 */
            this.storage = (key, value=null) => {
                return value != null
                    ? Syn.Session(key, {value: value})
                    : Syn.Session(key);
            };

            /* ===== 自動滾動的函數 ===== */

            /* 檢測到頂 */
            this.TopDetected = Syn.Throttle(()=>{
                this.Up_scroll = Syn.sY() == 0 ? (this.storage("scroll", false), false) : true;
            }, 1000);

            /* 檢測到底 */
            this.IsTheBottom = () => Syn.sY() + Syn.iH() >= document.documentElement.scrollHeight;
            this.BottomDetected = Syn.Throttle(()=>{
                if (Config.AutoTurnPage.Mode <= 3) return; // ! 臨時寫法, 當翻頁模式為 1,2,3 時不會觸發
                this.Down_scroll = this.IsTheBottom() ? (this.storage("scroll", false), false) : true;
            }, 1000);

            /* 自動滾動 (邏輯修改) */
            this.AutoScroll = (move) => {
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
                })
            };

            /* 手動滾動 */
            this.ManualScroll = (move) => {
                window.scrollBy({
                    left: 0,
                    top: move,
                    behavior: "smooth"
                });
            };

            /* ===== 翻頁的函數 ===== */

            /* 檢測是否是最後一頁 (當是最後一頁, 就允許繼續處發翻頁跳轉) */
            this.FinalPage = (link) => {
                this.IsFinalPage = link.startsWith("javascript");
                return this.IsFinalPage;
            };
            /* 篩選出可見的圖片 */
            this.VisibleObjects = (object) => object.filter(img => img.height > 0 || img.src);
            /* 取得物件的最後一項 */
            this.ObserveObject = (object) => object[Math.max(object.length - 2, 0)];
            /* 總圖片數的 50 % */
            this.DetectionValue = (object) => this.VisibleObjects(object).length >= Math.floor(object.length * .5);

            /* 獲取樣式 */
            this.Get_Style = () => {
                const Style = Syn.gV("Style", [{
                    "BG_Color": "#595959",
                    "Img_Bw": "auto",
                    "Img_Mw": "100%"
                }]);
                return Style[0];
            };

            this.ImgStyle = this.Get_Style();
        }

        /* 阻擋廣告 (目前無效) */
        async BlockAds() {
            const OriginListener = EventTarget.prototype.addEventListener, Block = this.BlockListener;
            const EventListeners = new Map();

            EventTarget.prototype.addEventListener = function(type, listener, options) {
                if (Block.has(type)) return;
                if (!EventListeners.has(this)) EventListeners.set(this, []);
                EventListeners.get(this).push({ type, listener, options });
                OriginListener.call(this, type, listener, options);
            };

            function removeBlockedListeners() {
                EventListeners.forEach((listeners, element) => {
                    listeners.forEach(({ type, listener }) => {
                        if (Block.has(type)) {
                            element.removeEventListener(type, listener);
                        }
                    });
                });
            }

            Syn.AddStyle(`
                html {pointer-events: none !important;}
                .mh_wrap, span.mh_btn:not(.contact), ${this.Id.Iframe} {pointer-events: auto;}
            `, this.Id.Block);

            // 雖然性能開銷比較高, 但比較不會跳一堆錯誤訊息
            this.AdCleanup = setInterval(() => {
                Syn.$q(`iframe:not(#${this.Id.Iframe})`)?.remove();
                removeBlockedListeners();
            }, 500);
        }

        /* 背景樣式 */
        async BackgroundStyle(Color) {
            this.Body.style.cssText = `
                background: ${Color} !important;
            `;

            // 避免開啟檔廣告插件時的跑板
            document.documentElement.style.cssText = `
                overflow: visible !important;
            `;

            // this.Body.style.cssText = `
                // background: ${this.ImgStyle.BG_Color} !important;
            // `;
        }

        /* 自動重新加載死圖 */
        async AutoReload() {
            let click = new MouseEvent("click", { bubbles: true, cancelable: true });
            const observer = new IntersectionObserver(observed => {
                observed.forEach(entry => {
                    if (entry.isIntersecting) {entry.target.dispatchEvent(click)}
                });
            }, { threshold: .3 });

            this.MangaList.$qa("span.mh_btn:not(.contact):not(.read_page_link)")
                .forEach(reloadBtn => observer.observe(reloadBtn));
        }

        /* 圖片樣式 */
        async PictureStyle() {
            if (Syn.Platform() === "Desktop") {
                Syn.AddStyle(`
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
            setTimeout(()=>{this.AutoReload()}, this.WaitPicture);
        }

        /* 快捷切換上下頁 和 自動滾動 */
        async HotkeySwitch(Use) {
            let JumpState = false; // 如果不是最後一頁, 觸發時他將會被設置為 true, 反之始終為 false (是 false 才能觸發跳轉, 一個跳轉的防抖機制)

            if (Syn.Platform() === "Desktop") {
                // 是主頁, 且啟用保持滾動, 也啟用自動滾動(避免無法手動停止), 且沒有開啟手動滾動(避免無法手動停止)
                if (this.IsMainPage && Use.KeepScroll && Use.AutoScroll && !Use.ManualScroll) {
                    this.Down_scroll = this.storage("scroll"); // 取得是否有保持滾動
                    this.Down_scroll && this.AutoScroll(this.ScrollPixels); // 立即觸發滾動
                }

                const UP_ScrollSpeed = -this.ScrollPixels;
                const CanScroll = Use.AutoScroll || Use.ManualScroll;

                window.$onEvent("keydown", event => {
                    const key = event.key;
                    if (key == "ArrowLeft" && Use.TurnPage && !JumpState) {
                        event.stopImmediatePropagation();
                        JumpState = !this.FinalPage(this.PreviousPage);
                        location.assign(this.PreviousPage);
                    }
                    else if (key == "ArrowRight" && Use.TurnPage && !JumpState) {
                        event.stopImmediatePropagation();
                        JumpState = !this.FinalPage(this.NextPage);
                        location.assign(this.NextPage);
                    }
                    else if (key == "ArrowUp" && CanScroll) {
                        event.stopImmediatePropagation();
                        event.preventDefault();

                        if (Use.ManualScroll) {
                            this.ManualScroll(-Syn.iH());
                        } else {
                            if (this.Up_scroll) {
                                this.Up_scroll = false;
                            } else if (!this.Up_scroll || this.Down_scroll) {
                                this.Down_scroll = false;
                                this.Up_scroll = true;
                                this.AutoScroll(UP_ScrollSpeed);
                            }
                        }
                    }
                    else if (key == "ArrowDown" && CanScroll) {
                        event.stopImmediatePropagation();
                        event.preventDefault();

                        if (Use.ManualScroll) {
                            this.ManualScroll(Syn.iH());
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
                }, { capture: true });
            } else if (Syn.Platform() === "Mobile") {

                let startX, startY, moveX, moveY;
                const sidelineX = Syn.iW() * .3;
                const sidelineY = (Syn.iH() / 4) * .3;

                window.$onEvent("touchstart", event => {
                    startX = event.touches[0].clientX;
                    startY = event.touches[0].clientY;
                }, { passive: true });

                window.$onEvent("touchmove", Syn.Debounce(event => {
                    moveY = event.touches[0].clientY - startY;
                    if (Math.abs(moveY) < sidelineY) { // 限制 Y 軸移動
                        moveX = event.touches[0].clientX - startX;

                        if (moveX > sidelineX && !JumpState) { // 右滑 回到上頁, 需要大於限制 X 軸移動
                            JumpState = !this.FinalPage(this.PreviousPage);
                            location.assign(this.PreviousPage);
                        } else if (moveX < -sidelineX && !JumpState) { // 左滑 到下一頁, 需要大於限制 X 軸移動
                            JumpState = !this.FinalPage(this.NextPage);
                            location.assign(this.NextPage);
                        }
                    }
                }, 60), { passive: true });
            }
        }

        /* 自動切換下一頁 */
        async AutoPageTurn(Mode) {
            let hold, point, img;
            this.Observer_Next = new IntersectionObserver(observed => {
                observed.forEach(entry => {
                    if (entry.isIntersecting && this.DetectionValue(img)) {
                        location.assign(this.NextPage);
                    }
                });
            }, { threshold: hold });

            switch (Mode) {
                case 2:
                    hold = .5;
                    point = Syn.$q("li:nth-child(3) a.read_page_link");
                    break;
                case 3:
                    hold = 1;
                    point = Syn.$q("div.endtip2.clear");
                    break;
                case 4: case 5:
                    this.UnlimitedPageTurn(Mode == 5);
                    break;
                default:
                    hold = .1;
                    point = this.BottomStrip;
            };

            if (point) {
                setTimeout(()=> {
                    img = this.MangaList.$qa("img");
                    if (!this.FinalPage(this.NextPage)) this.Observer_Next.observe(point);
                }, this.WaitPicture);
            };
        }

        /* 無盡 翻頁模式 */
        async UnlimitedPageTurn(Optimized) {
            const self = this;
            const iframe = Syn.$createElement("iframe", { id: this.Id.Iframe, src: this.NextPage });

            // 修改樣式 (隱藏某些元素 增加沉浸體驗)
            Syn.AddStyle(`
                .mh_wrap, .mh_readend, .mh_footpager,
                .fed-foot-info, #imgvalidation2022 {display: none;}
                body {
                    margin: 0;
                    padding: 0;
                }
                #${this.Id.Iframe} {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 150vh;
                    border: none;
                }
            `, this.Id.Scroll);

            // 修改當前觀看的頁面 (根據無盡翻頁的變化)
            if (this.IsMainPage) {
                window.$one("message", event => {
                    const data = event.data;
                    if (data && data.length > 0) {
                        document.title = data[0]; // 修改最上層標題
                        this.NextPage = data[3]; // 修改上一頁跳轉連結
                        this.PreviousPage = data[1]; // 修改下一頁跳轉連結
                        history.pushState(null, null, data[2]); // 修改網址並添加到歷史紀錄
                    }
                })
            } else { // 第二頁開始, 不斷向上找到主頁
                Syn.AddStyle(`
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
                window.$one("message", event => {
                    while (MainWindow.parent !== MainWindow) {MainWindow = MainWindow.parent}
                    MainWindow.postMessage(event.data, self.Origin);
                })
            };

            /* 檢測翻頁 */
            TriggerNextPage();
            async function TriggerNextPage() {

                let Img, Observer, Quantity=0;

                self.Observer_Next = new IntersectionObserver(observed => {
                    observed.forEach(entry => {
                        if (entry.isIntersecting && self.DetectionValue(Img)) {
                            self.Observer_Next.disconnect();
                            Observer.disconnect();
                            TurnPage();
                        }
                    });
                }, { threshold: .1 });

                setTimeout(()=> {

                    Img = self.MangaList.$qa("img");

                    if (Img.length <= 5) { // 總長度 <= 5 直接觸發換頁
                        TurnPage();
                        return;
                    };

                    // 後續變化觀察
                    Syn.Observer(self.MangaList, () => {
                        const Visible = self.VisibleObjects(Img);
                        const VL = Visible.length;

                        if (VL > Quantity) { // 判斷值測試
                            Quantity = VL;
                            self.Observer_Next.disconnect();
                            self.Observer_Next.observe(
                                self.ObserveObject(Visible) // 修改新的觀察對象
                            );
                        }
                    }, {debounce: 500}, observer=> {
                        Observer = observer.ob;
                    });

                }, self.WaitPicture);
            };

            /* 翻頁邏輯 */
            async function TurnPage() {
                let Content, CurrentUrl, StylelRules=Syn.$q(`#${self.Id.Scroll}`).sheet.cssRules;

                if (self.FinalPage(self.NextPage)) { // 檢測是否是最後一頁 (恢復隱藏的元素)
                    StylelRules[0].style.display = "block";
                    return;
                };

                // iframe 載入
                document.body.appendChild(iframe);
                Waitload();

                // 等待 iframe 載入完成
                function Waitload() {
                    iframe.onload = () => {
                        CurrentUrl = iframe.contentWindow.location.href;
                        CurrentUrl != self.NextPage && (iframe.src = self.NextPage, Waitload()); // 避免載入錯誤頁面

                        Content = iframe.contentWindow.document;
                        Content.body.style.overflow = "hidden";
                        Syn.Log("無盡翻頁", CurrentUrl);

                        // 首張圖片
                        const TopImg = Content.$q("#mangalist img");

                        // 持續設置高度
                        let lastHeight = 0;
                        const Resize = () => {
                            const newHeight = Content.body.scrollHeight;

                            if (newHeight !== lastHeight) {
                                requestAnimationFrame(() => {
                                    StylelRules[2].style.height = `${newHeight}px`;
                                })
                                lastHeight = newHeight;
                            }

                            setTimeout(Resize, 1300);
                        };
                        Resize();

                        // 監聽換頁點
                        const UrlUpdate = new IntersectionObserver(observed => {
                            observed.forEach(entry => {
                                if (entry.isIntersecting) {
                                    UrlUpdate.disconnect();

                                    const PageLink = Content.body.$qa("div.mh_readend ul a");
                                    const PreviousUrl = PageLink[0]?.href;
                                    const NextUrl = PageLink[2]?.href;

                                    window.parent.postMessage([
                                        Content.title,
                                        PreviousUrl,
                                        CurrentUrl,
                                        NextUrl
                                    ], self.Origin);
                                }
                            });
                        }, { threshold: .1 });
                        UrlUpdate.observe(TopImg);

                        if (Optimized) {
                            Syn.$q("title").id = self.Id.Title; // 賦予一個 ID 用於白名單排除

                            // 動態計算臨界值
                            const adapt = Syn.Platform() === "Desktop" ? .5 : .7;
                            const hold = Math.min(adapt, (Syn.iH() * adapt) / TopImg.clientHeight);

                            // 監聽釋放點
                            const ReleaseMemory = new IntersectionObserver(observed => {
                                observed.forEach(entry => {
                                    if (entry.isIntersecting) {
                                        ReleaseMemory.disconnect();
                                        self.Get_Nodes(document).forEach(node => {
                                            node.remove(); // 刪除元素, 等待瀏覽器自己釋放
                                        })
                                        TopImg.scrollIntoView();
                                    }
                                });
                            }, { threshold: hold });

                            ReleaseMemory.observe(TopImg);
                        };
                    };

                    iframe.onerror = () => {
                        iframe.src = self.NextPage;
                        Waitload();
                    };
                }
            }
        }

        /* 設定菜單 */
        async SettingMenu() {
        }

        /* 菜單樣式 */
        async MenuStyle() {
            Syn.AddStyle(``, this.Id.Menu);
        }

        /* 功能注入 */
        async Injection() {
            this.BlockAds();

            try {
                this.Get_Data(state=> {
                    if (state) { // 在這邊載入的功能都是需要等到, 找到元素才操作比較不會出錯
                        this.PictureStyle();
                        Config.BGColor.Enable && this.BackgroundStyle(Config.BGColor.Color);
                        Config.AutoTurnPage.Enable && this.AutoPageTurn(Config.AutoTurnPage.Mode);
                        Config.RegisterHotkey.Enable && this.HotkeySwitch(Config.RegisterHotkey.Function);
                    } else Syn.Log(null, "Error");
                });
            } catch (error) { Syn.Log(null, error) }
        }
    }).Injection();
})();