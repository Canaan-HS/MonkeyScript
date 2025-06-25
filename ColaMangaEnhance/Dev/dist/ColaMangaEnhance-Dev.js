// ==UserScript==
// @name         ColaManga 瀏覽增強
// @name:zh-TW   ColaManga 瀏覽增強
// @name:zh-CN   ColaManga 浏览增强
// @name:en      ColaManga Browsing Enhance
// @version      0.0.12-Beta1
// @author       Canaan HS
// @description       隱藏廣告內容，提昇瀏覽體驗。自訂背景顏色，圖片大小調整。當圖片載入失敗時，自動重新載入圖片。提供熱鍵功能：[← 上一頁]、[下一頁 →]、[↑ 自動上滾動]、[↓ 自動下滾動]。當用戶滾動到頁面底部時，自動跳轉到下一頁。
// @description:zh-TW 隱藏廣告內容，提昇瀏覽體驗。自訂背景顏色，圖片大小調整。當圖片載入失敗時，自動重新載入圖片。提供熱鍵功能：[← 上一頁]、[下一頁 →]、[↑ 自動上滾動]、[↓ 自動下滾動]。當用戶滾動到頁面底部時，自動跳轉到下一頁。
// @description:zh-CN 隐藏广告内容，提昇浏览体验。自定义背景颜色，调整图片大小。当图片载入失败时，自动重新载入图片。提供快捷键功能：[← 上一页]、[下一页 →]、[↑ 自动上滚动]、[↓ 自动下滚动]。当用户滚动到页面底部时，自动跳转到下一页。
// @description:en    Hide advertisement content, enhance browsing experience. Customize background color, adjust image size. Automatically reload images when they fail to load. Provide shortcut key functionalities: [← Previous Page], [Next Page →], [↑ Auto Scroll Up], [↓ Auto Scroll Down]. Automatically jump to the next page when users scroll to the bottom of the page.

// @match        *://www.colamanga.com/manga-*/*/*.html
// @icon         https://www.colamanga.com/favicon.png

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635

// @require      https://update.greasyfork.org/scripts/487608/1613825/SyntaxLite_min.js

// @grant        GM_setValue
// @grant        GM_getValue

// @run-at       document-start
// ==/UserScript==

(function () {
  const Config = {
    BGColor: {
      Enable: true,
      Color: "#595959"
    },
    AutoTurnPage: {
      // 自動翻頁
      Enable: true,
      Mode: 3
      // 1 = 快速 | 2 = 一般無盡 | 3 = 優化無盡
    },
    RegisterHotkey: {
      // 快捷功能
      Enable: true,
      Function: {
        // 移動端不適用以下配置
        TurnPage: true,
        // 翻頁
        AutoScroll: true,
        // 自動滾動
        KeepScroll: true,
        // 換頁繼續滾動
        ManualScroll: false
        // 手動滾動啟用時, 將會變成點擊一次, 根據視點翻一頁 且 自動滾動會無效
      }
    }
  };
  const Control = {
    ScrollPixels: 2,
    // 像素, 越大越快
    WaitPicture: 1e3,
    // 載入延遲時間 (ms)
    BlockListener: /* @__PURE__ */ new Set([
      // 阻擋事件
      "auxclick",
      "mousedown",
      "pointerup",
      "pointerdown",
      "dState",
      "touchstart",
      "unhandledrejection"
    ]),
    IdList: {
      // Id 表
      Title: "CME_Title",
      Iframe: "CME_Iframe",
      Block: "CME_Block-Ads",
      Menu: "CME_Menu-Style",
      Image: "CME_Image-Style",
      Scroll: "CME_Scroll-Hidden",
      ChildS: "CME_Child-Scroll-Hidden"
    }
  };
  const Param = {
    Body: null,
    // body 緩存
    ContentsPage: null,
    // 返回目錄連結 緩存
    HomePage: null,
    // 返回首頁連結 緩存
    PreviousLink: null,
    // 上一頁連結 緩存
    NextLink: null,
    // 下一頁連結 緩存
    MangaList: null,
    // 漫畫列表 緩存
    BottomStrip: null,
    // 以閱讀完畢的那條
    Up_scroll: false,
    // 向上滾動判斷值
    Down_scroll: false,
    // 向下滾動判斷值
    IsFinalPage: false,
    // 最終頁判斷值
    IsMainPage: window.self === window.parent
    // 判斷是否是 iframe
  };
  function Tools(Syn2, Config2, Control2, Param2) {
    const IdWhiteList = new Set(Object.values(Control2.IdList));
    const Storage = (key, value = null) => {
      return value != null ? Syn2.Session(key, { value }) : Syn2.Session(key);
    };
    const TopDetected = Syn2.Throttle(() => {
      Param2.Up_scroll = Syn2.sY == 0 ? (Storage("scroll", false), false) : true;
    }, 1e3);
    const Skip = Config2.AutoTurnPage.Mode === 1 && Config2.RegisterHotkey.Function.KeepScroll;
    const IsTheBottom = () => Syn2.sY + Syn2.iH >= document.documentElement.scrollHeight;
    const BottomDetected = Syn2.Throttle(() => {
      if (Skip) return;
      Param2.Down_scroll = IsTheBottom() ? (Storage("scroll", false), false) : true;
    }, 1e3);
    return {
      Storage,
      /* 獲取設置 */
      GetSet: () => {
        return Syn2.gV("Style", {
          "BG_Color": "#595959",
          "Img_Bw": "auto",
          "Img_Mw": "100%"
        });
      },
      /* 取得釋放節點 */
      Get_Nodes(Root) {
        const nodes = [];
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
        }
        Task(Root.head);
        Task(Root.body);
        return nodes;
      },
      /* 自動滾動 */
      AutoScroll(move) {
        requestAnimationFrame(() => {
          if (Param2.Up_scroll && move < 0) {
            window.scrollBy(0, move);
            TopDetected();
            this.AutoScroll(move);
          } else if (Param2.Down_scroll && move > 0) {
            window.scrollBy(0, move);
            BottomDetected();
            this.AutoScroll(move);
          }
        });
      },
      /* 手動滾動 */
      ManualScroll(move) {
        window.scrollBy({
          left: 0,
          top: move,
          behavior: "smooth"
        });
      },
      /* 檢測是否是最後一頁 (當是最後一頁, 就允許繼續處發翻頁跳轉) */
      FinalPage(link) {
        Param2.IsFinalPage = link.startsWith("javascript");
        return Param2.IsFinalPage;
      },
      /* 篩選出可見的圖片 */
      VisibleObjects: (object) => object.filter((img) => img.height > 0 || img.src),
      /* 取得物件的最後一項 */
      ObserveObject: (object) => object[Math.max(object.length - 2, 0)],
      /* 總圖片數的 50 % */
      DetectionValue(object) {
        return this.VisibleObjects(object).length >= Math.floor(object.length * 0.5);
      }
    };
  }
  function Style(Syn2, Control2, Param2, Set2) {
    return {
      /* 背景樣式 */
      async BackgroundStyle(Color) {
        Param2.Body.style.cssText = `
                background: ${Color} !important;
            `;
        document.documentElement.style.cssText = `
                overflow: visible !important;
            `;
      },
      /* 圖片樣式 */
      async PictureStyle() {
        if (Syn2.Platform === "Desktop") {
          Syn2.AddStyle(`
                    .mh_comicpic img {
                        margin: auto;
                        display: block;
                        cursor: pointer;
                        vertical-align: top;
                        width: ${Set2.Img_Bw};
                        max-width: ${Set2.Img_Mw};
                    }
                `, Control2.IdList.Image);
        }
        setTimeout(() => {
          const click = new MouseEvent("click", { bubbles: true, cancelable: true });
          const observer = new IntersectionObserver((observed) => {
            observed.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.dispatchEvent(click);
              }
            });
          }, { threshold: 0.3 });
          Param2.MangaList.$qa("span.mh_btn:not(.contact):not(.read_page_link)").forEach((reloadBtn) => observer.observe(reloadBtn));
        }, Control2.WaitPicture);
      },
      /* 菜單樣式 */
      async MenuStyle() {
      }
    };
  }
  function PageTurn(Syn2, Control2, Param2, tools) {
    async function Unlimited(Optimized) {
      Syn2.AddStyle(`
            .mh_wrap, .mh_readend, .mh_footpager,
            .fed-foot-info, #imgvalidation2022 {display: none;}
            body {
                margin: 0;
                padding: 0;
            }
            #${Control2.IdList.Iframe} {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 110vh;
                border: none;
            }
        `, Control2.IdList.Scroll);
      const StylelRules = Syn2.$q(`#${Control2.IdList.Scroll}`).sheet.cssRules;
      if (Param2.IsMainPage) {
        let Size = 0;
        window.addEventListener("message", (event) => {
          const data = event.data;
          if (data && data.length > 0) {
            const {
              Title,
              PreviousUrl,
              CurrentUrl,
              NextUrl,
              Resize,
              SizeSet,
              SizeRecord
            } = data[0];
            if (Resize) {
              if (Size > SizeRecord) Size -= SizeRecord;
              Size += Resize;
              StylelRules[2].style.height = `${Size}px`;
            } else if (SizeSet) StylelRules[2].style.height = `${SizeSet}px`;
            else if (Title && NextUrl && PreviousUrl && CurrentUrl) {
              document.title = Title;
              Param2.NextLink = NextUrl;
              Param2.PreviousLink = PreviousUrl;
              history.pushState(null, null, CurrentUrl);
            }
          }
        });
      } else {
        Syn2.AddStyle(`
                html {
                    overflow: hidden !important;
                    overflow-x: hidden !important;
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }
                html::-webkit-scrollbar {
                    display: none !important;
                }
            `, Control2.IdList.ChildS);
        let MainWindow = window;
        window.addEventListener("message", (event) => {
          while (MainWindow.parent !== MainWindow) {
            MainWindow = MainWindow.parent;
          }
          MainWindow.postMessage(event.data, Syn2.$origin);
        });
      }
      const iframe = Syn2.createElement("iframe", { id: Control2.IdList.Iframe, src: Param2.NextLink });
      (() => {
        let Img, Observer, Quantity = 0;
        const Observer_Next = new IntersectionObserver((observed) => {
          observed.forEach((entry) => {
            const rect = entry.boundingClientRect;
            const isPastTarget = rect.bottom < 0;
            const isIntersecting = entry.isIntersecting;
            if ((isIntersecting || isPastTarget) && tools.DetectionValue(Img)) {
              Observer_Next.disconnect();
              Observer.disconnect();
              TurnPage();
            }
          });
        }, { threshold: 0.1, rootMargin: "0px 0px 100px 0px" });
        setTimeout(() => {
          Img = Param2.MangaList.$qa("img");
          if (Img.length <= 5) {
            TurnPage();
            return;
          }
          Observer_Next.observe(
            tools.ObserveObject(tools.VisibleObjects(Img))
          );
          Syn2.Observer(Param2.MangaList, () => {
            const Visible = tools.VisibleObjects(Img);
            const VL = Visible.length;
            if (VL > Quantity) {
              Quantity = VL;
              Observer_Next.disconnect();
              Observer_Next.observe(
                tools.ObserveObject(Visible)
                // 修改新的觀察對象
              );
            }
          }, { debounce: 100 }, (observer) => {
            Observer = observer.ob;
          });
        }, Control2.WaitPicture);
      })();
      let Turned = false;
      function TurnPage() {
        if (Turned) return;
        Turned = true;
        let CurrentHeight = 0;
        const Resize = new ResizeObserver(() => {
          const NewHeight = Param2.MangaList.offsetHeight;
          if (NewHeight > CurrentHeight) {
            window.parent.postMessage([{
              Resize: Param2.MangaList.offsetHeight,
              SizeRecord: CurrentHeight
            }], Syn2.$origin);
            CurrentHeight = NewHeight;
          }
        });
        if (tools.FinalPage(Param2.NextLink)) {
          if (Optimized) {
            window.parent.postMessage([{
              SizeSet: Param2.MangaList.offsetHeight + 245
            }], Syn2.$origin);
          }
          StylelRules[0].style.display = "block";
          return;
        }
        Waitload();
        Param2.Body.appendChild(iframe);
        Resize.observe(Param2.MangaList);
        function Waitload() {
          let IframeWindow, CurrentUrl, Content, AllImg;
          const Failed = () => {
            iframe.offAll();
            iframe.src = Param2.NextLink;
            Waitload();
          };
          const Success = () => {
            iframe.offAll();
            IframeWindow = iframe.contentWindow;
            CurrentUrl = IframeWindow.location.href;
            if (CurrentUrl !== Param2.NextLink) {
              Failed();
              return;
            }
            Content = IframeWindow.document;
            Content.body.style.overflow = "hidden";
            Syn2.Log("無盡翻頁", CurrentUrl);
            AllImg = Content.$qa("#mangalist img");
            const UrlUpdate = new IntersectionObserver((observed) => {
              observed.forEach((entry) => {
                var _a, _b;
                if (entry.isIntersecting) {
                  UrlUpdate.disconnect();
                  Resize.disconnect();
                  const PageLink = Content.body.$qa("div.mh_readend ul a");
                  window.parent.postMessage([{
                    Title: Content.title,
                    CurrentUrl,
                    PreviousUrl: (_a = PageLink[0]) == null ? void 0 : _a.href,
                    NextUrl: (_b = PageLink[2]) == null ? void 0 : _b.href
                  }], Syn2.$origin);
                }
              });
            }, { threshold: 0 });
            AllImg.forEach(async (img) => UrlUpdate.observe(img));
            if (Optimized) {
              Syn2.$q("title").id = Control2.IdList.Title;
              const adapt = Syn2.Platform === "Desktop" ? 0.5 : 0.7;
              const ReleaseMemory = new IntersectionObserver((observed) => {
                observed.forEach((entry) => {
                  if (entry.isIntersecting) {
                    const targetImg = entry.target;
                    const ratio = Math.min(adapt, Syn2.iH * adapt / targetImg.clientHeight);
                    if (entry.intersectionRatio >= ratio) {
                      ReleaseMemory.disconnect();
                      tools.Get_Nodes(document).forEach((node) => {
                        node.remove();
                      });
                      targetImg.scrollIntoView();
                    }
                  }
                });
              }, { threshold: [0, 0.5, 1] });
              AllImg.forEach(async (img) => ReleaseMemory.observe(img));
            }
          };
          iframe.on("load", Success);
          iframe.on("error", Failed);
        }
      }
    }
    return {
      /* 自動切換下一頁 */
      async Auto(Mode) {
        switch (Mode) {
          case 2:
          case 3:
            Unlimited(Mode === 3);
            break;
          default:
            setTimeout(() => {
              const img = Param2.MangaList.$qa("img");
              if (!tools.FinalPage(Param2.NextLink)) {
                const Observer_Next = new IntersectionObserver((observed) => {
                  observed.forEach((entry) => {
                    if (entry.isIntersecting && tools.DetectionValue(img)) {
                      Observer_Next.disconnect();
                      location.assign(Param2.NextLink);
                    }
                  });
                }, { threshold: 0.5 });
                Observer_Next.observe(Param2.BottomStrip);
              }
            }, Control2.WaitPicture);
        }
      }
    };
  }
  (async () => {
    const tools = Tools(Syn, Config, Control, Param);
    const Set2 = tools.GetSet();
    const style = Style(Syn, Control, Param, Set2);
    const turn = PageTurn(Syn, Control, Param, tools);
    async function BlockAds() {
      Syn.AddStyle(`
            html {pointer-events: none !important;}
            div[style*='position'] {display: none !important;}
            .mh_wrap a,
            .mh_readend a,
            span.mh_btn:not(.contact),
            #${Control.IdList.Iframe} {
                pointer-events: auto !important;
            }
        `, Control.IdList.Block);
      const OriginListener = EventTarget.prototype.addEventListener;
      const Block = Control.BlockListener;
      EventTarget.prototype.addEventListener = new Proxy(OriginListener, {
        apply(target, thisArg, args) {
          const [type, listener, options] = args;
          if (Block.has(type)) return;
          return target.apply(thisArg, args);
        }
      });
      const iframe = `iframe:not(#${Control.IdList.Iframe})`;
      const AdCleanup = () => {
        var _a;
        (_a = Syn.$q(iframe)) == null ? void 0 : _a.remove();
        requestIdleCallback(AdCleanup, { timeout: 300 });
      };
      AdCleanup();
    }
    async function HotkeySwitch(Use) {
      let JumpState = false;
      if (Syn.Platform === "Desktop") {
        if (Param.IsMainPage && Use.KeepScroll && Use.AutoScroll && !Use.ManualScroll) {
          Param.Down_scroll = tools.Storage("scroll");
          Param.Down_scroll && tools.AutoScroll(Control.ScrollPixels);
        }
        const UP_ScrollSpeed = -2;
        const CanScroll = Use.AutoScroll || Use.ManualScroll;
        Syn.onEvent(window, "keydown", (event) => {
          const key = event.key;
          if (key === "ArrowLeft" && Use.TurnPage && !JumpState) {
            event.stopImmediatePropagation();
            JumpState = !tools.FinalPage(Param.PreviousLink);
            location.assign(Param.PreviousLink);
          } else if (key === "ArrowRight" && Use.TurnPage && !JumpState) {
            event.stopImmediatePropagation();
            JumpState = !tools.FinalPage(Param.NextLink);
            location.assign(Param.NextLink);
          } else if (key === "ArrowUp" && CanScroll) {
            event.stopImmediatePropagation();
            event.preventDefault();
            if (Use.ManualScroll) {
              tools.ManualScroll(-Syn.iH);
            } else {
              if (Param.Up_scroll) {
                Param.Up_scroll = false;
              } else if (!Param.Up_scroll || Param.Down_scroll) {
                Param.Down_scroll = false;
                Param.Up_scroll = true;
                tools.AutoScroll(UP_ScrollSpeed);
              }
            }
          } else if (key === "ArrowDown" && CanScroll) {
            event.stopImmediatePropagation();
            event.preventDefault();
            if (Use.ManualScroll) {
              tools.ManualScroll(Syn.iH);
            } else {
              if (Param.Down_scroll) {
                Param.Down_scroll = false;
                tools.Storage("scroll", false);
              } else if (Param.Up_scroll || !Param.Down_scroll) {
                Param.Up_scroll = false;
                Param.Down_scroll = true;
                tools.Storage("scroll", true);
                tools.AutoScroll(Control.ScrollPixels);
              }
            }
          }
        }, { capture: true });
      } else if (Syn.Platform === "Mobile") {
        let startX, startY, moveX, moveY;
        const sidelineX = Syn.iW * 0.3;
        const sidelineY = Syn.iH / 4 * 0.3;
        Syn.onEvent(window, "touchstart", (event) => {
          startX = event.touches[0].clientX;
          startY = event.touches[0].clientY;
        }, { passive: true });
        Syn.onEvent(window, "touchmove", Syn.Debounce((event) => {
          moveY = event.touches[0].clientY - startY;
          if (Math.abs(moveY) < sidelineY) {
            moveX = event.touches[0].clientX - startX;
            if (moveX > sidelineX && !JumpState) {
              JumpState = !tools.FinalPage(Param.PreviousLink);
              location.assign(Param.PreviousLink);
            } else if (moveX < -sidelineX && !JumpState) {
              JumpState = !tools.FinalPage(Param.NextLink);
              location.assign(Param.NextLink);
            }
          }
        }, 60), { passive: true });
      }
    }
    (() => {
      async function Init(callback) {
        Syn.WaitElem(
          ["body", "div.mh_readtitle", "div.mh_headpager", "div.mh_readend", "#mangalist"],
          null,
          { timeout: 10, throttle: 30, visibility: Param.IsMainPage, timeoutResult: true }
        ).then(([Body, Title, HeadPager, Readend, Manga]) => {
          Param.Body = Body;
          const HomeLink = Title.$qa("a");
          Param.ContentsPage = HomeLink[0].href;
          Param.HomePage = HomeLink[1].href;
          try {
            const PageLink = Readend.$qa("ul a");
            Param.PreviousLink = PageLink[0].href;
            Param.NextLink = PageLink[2].href;
          } catch {
            const PageLink = HeadPager.$qa("a.mh_btn:not(.mh_bgcolor)");
            Param.PreviousLink = PageLink[0].href;
            Param.NextLink = PageLink[1].href;
          }
          Param.MangaList = Manga;
          Param.BottomStrip = Readend.$q("a");
          if ([
            Param.Body,
            Param.ContentsPage,
            Param.HomePage,
            Param.PreviousLink,
            Param.NextLink,
            Param.MangaList,
            Param.BottomStrip
          ].every((Check) => Check)) callback(true);
          else callback(false);
        });
      }
      BlockAds();
      try {
        Init((state) => {
          if (state) {
            style.PictureStyle();
            Config.BGColor.Enable && style.BackgroundStyle(Config.BGColor.Color);
            Config.AutoTurnPage.Enable && turn.Auto(Config.AutoTurnPage.Mode);
            Config.RegisterHotkey.Enable && HotkeySwitch(Config.RegisterHotkey.Function);
          } else Syn.Log(null, "Error");
        });
      } catch (error) {
        Syn.Log(null, error);
      }
    })();
  })();

})();