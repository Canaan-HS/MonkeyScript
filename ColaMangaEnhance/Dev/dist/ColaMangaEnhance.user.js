// ==UserScript==
// @name         ColaManga 瀏覽增強
// @name:zh-TW   ColaManga 瀏覽增強
// @name:zh-CN   ColaManga 浏览增强
// @name:en      ColaManga Browsing Enhance
// @version      2025.09.15-Beta
// @author       Canaan HS
// @description       隱藏廣告內容，提昇瀏覽體驗。自訂背景顏色，圖片大小調整。當圖片載入失敗時，自動重新載入圖片。提供熱鍵功能：[← 上一頁]、[下一頁 →]、[↑ 自動上滾動]、[↓ 自動下滾動]。當用戶滾動到頁面底部時，自動跳轉到下一頁。
// @description:zh-TW 隱藏廣告內容，提昇瀏覽體驗。自訂背景顏色，圖片大小調整。當圖片載入失敗時，自動重新載入圖片。提供熱鍵功能：[← 上一頁]、[下一頁 →]、[↑ 自動上滾動]、[↓ 自動下滾動]。當用戶滾動到頁面底部時，自動跳轉到下一頁。
// @description:zh-CN 隐藏广告内容，提昇浏览体验。自定义背景颜色，调整图片大小。当图片载入失败时，自动重新载入图片。提供快捷键功能：[← 上一页]、[下一页 →]、[↑ 自动上滚动]、[↓ 自动下滚动]。当用户滚动到页面底部时，自动跳转到下一页。
// @description:en    Hide advertisement content, enhance browsing experience. Customize background color, adjust image size. Automatically reload images when they fail to load. Provide shortcut key functionalities: [← Previous Page], [Next Page →], [↑ Auto Scroll Up], [↓ Auto Scroll Down]. Automatically jump to the next page when users scroll to the bottom of the page.

// @match        *://www.colamanga.com/manga-*/*/*.html
// @icon         https://www.colamanga.com/favicon.png

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635

// @require      https://update.greasyfork.org/scripts/487608/1659706/SyntaxLite_min.js

// @grant        GM_setValue
// @grant        GM_getValue

// @run-at       document-start
// ==/UserScript==

(function () {
  const Config = {
    BGColor: {
      Enable: true,
      Color: "#595959",
    },
    AutoTurnPage: {
      Enable: true,
      Mode: 3,
    },
    RegisterHotkey: {
      Enable: true,
      Function: {
        TurnPage: true,
        AutoScroll: true,
        KeepScroll: true,
        ManualScroll: false,
      },
    },
  };
  const Control = {
    ScrollPixels: 2,
    WaitPicture: 1e3,
    BlockListener: new Set(["auxclick", "mousedown", "pointerup", "pointerdown", "dState", "touchstart", "unhandledrejection"]),
    IdList: {
      Title: "CME_Title",
      Iframe: "CME_Iframe",
      Block: "CME_Block-Ads",
      Menu: "CME_Menu-Style",
      Image: "CME_Image-Style",
      Scroll: "CME_Scroll-Hidden",
      ChildS: "CME_Child-Scroll-Hidden",
    },
  };
  const Param = {
    Body: null,
    ContentsPage: null,
    HomePage: null,
    PreviousLink: null,
    NextLink: null,
    MangaList: null,
    BottomStrip: null,
    Up_scroll: false,
    Down_scroll: false,
    IsFinalPage: false,
    IsMainPage: window.self === window.parent,
  };
  function Tools() {
    const idWhiteList = new Set(Object.values(Control.IdList));
    const storage = (key, value = null) => {
      return value != null ? Lib.session(key, { value }) : Lib.session(key);
    };
    const topDetected = Lib.$throttle(() => {
      Param.Up_scroll = Lib.sY == 0 ? (storage("scroll", false), false) : true;
    }, 1e3);
    const isTheBottom = () => Lib.sY + Lib.iH >= document.documentElement.scrollHeight;
    const bottomDetected = Lib.$throttle(() => {
      Param.Down_scroll = isTheBottom() ? (storage("scroll", false), false) : true;
    }, 1e3);
    return {
      storage,
      getSet: () => {
        return Lib.getV("Style", {
          BG_Color: "#595959",
          Img_Bw: "auto",
          Img_Mw: "100%",
        });
      },
      getNodes(Root) {
        const nodes = [];
        function task(root) {
          const tree = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
            acceptNode: (node) => {
              if (idWhiteList.has(node.id)) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            },
          });
          while (tree.nextNode()) {
            nodes.push(tree.currentNode);
          }
        }
        task(Root.head);
        task(Root.body);
        return nodes;
      },
      autoScroll(move) {
        requestAnimationFrame(() => {
          if (Param.Up_scroll && move < 0) {
            window.scrollBy(0, move);
            topDetected();
            this.autoScroll(move);
          } else if (Param.Down_scroll && move > 0) {
            window.scrollBy(0, move);
            bottomDetected();
            this.autoScroll(move);
          }
        });
      },
      manualScroll(move) {
        window.scrollBy({
          left: 0,
          top: move,
          behavior: "smooth",
        });
      },
      isFinalPage(link) {
        Param.IsFinalPage = link.startsWith("javascript");
        return Param.IsFinalPage;
      },
      visibleObjects: (object) => object.filter((img) => img.height > 0 || img.src),
      lastObject: (object) => object.at(-2),
      detectionValue(object) {
        return this.visibleObjects(object).length >= Math.floor(object.length * 0.5);
      },
    };
  }
  const Tools$1 = Tools();
  function Style() {
    const $Set = Tools$1.getSet();
    return {
      async backgroundStyle(Color = Config.BGColor.Color) {
        Param.Body.style.cssText = `
                background: ${Color} !important;
            `;
        document.documentElement.style.cssText = `
                overflow: visible !important;
            `;
      },
      async pictureStyle() {
        if (Lib.platform === "Desktop") {
          Lib.addStyle(
            `
                    .mh_comicpic img {
                        margin: auto;
                        display: block;
                        cursor: pointer;
                        vertical-align: top;
                        width: ${$Set.Img_Bw};
                        max-width: ${$Set.Img_Mw};
                    }
                `,
            Control.IdList.Image,
          );
        }
        setTimeout(() => {
          const click = new MouseEvent("click", { bubbles: true, cancelable: true });
          const observer = new IntersectionObserver(
            (observed) => {
              observed.forEach((entry) => {
                if (entry.isIntersecting) {
                  entry.target.dispatchEvent(click);
                }
              });
            },
            { threshold: 0.3 },
          );
          Param.MangaList.$qa("span.mh_btn:not(.contact):not(.read_page_link)").forEach((reloadBtn) => observer.observe(reloadBtn));
        }, Control.WaitPicture);
      },
      async menuStyle() {},
    };
  }
  const Style$1 = Style();
  function PageTurn() {
    async function unlimited(Optimized) {
      Lib.addStyle(
        `
            .mh_wrap, .mh_readend, .mh_footpager,
            .fed-foot-info, #imgvalidation2022 {display: none;}
            body {
                margin: 0;
                padding: 0;
            }
            #${Control.IdList.Iframe} {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 110vh;
                border: none;
            }
        `,
        Control.IdList.Scroll,
      );
      const StylelRules = Lib.$q(`#${Control.IdList.Scroll}`).sheet.cssRules;
      if (Param.IsMainPage) {
        let Size = 0;
        Lib.onEvent(window, "message", (event) => {
          const data = event.data;
          if (data && data.length > 0) {
            const { Title, PreviousUrl, CurrentUrl, NextUrl, Resize, SizeSet, SizeRecord } = data[0];
            if (Resize) {
              if (Size > SizeRecord) Size -= SizeRecord;
              Size += Resize;
              StylelRules[2].style.height = `${Size}px`;
            } else if (SizeSet) StylelRules[2].style.height = `${SizeSet}px`;
            else if (Title && NextUrl && PreviousUrl && CurrentUrl) {
              document.title = Title;
              Param.NextLink = NextUrl;
              Param.PreviousLink = PreviousUrl;
              history.pushState(null, null, CurrentUrl);
            }
          }
        });
      } else {
        Lib.addStyle(
          `
                html {
                    overflow: hidden !important;
                    overflow-x: hidden !important;
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }
                html::-webkit-scrollbar {
                    display: none !important;
                }
            `,
          Control.IdList.ChildS,
        );
        let MainWindow = window;
        Lib.onEvent(window, "message", (event) => {
          while (MainWindow.parent !== MainWindow) {
            MainWindow = MainWindow.parent;
          }
          MainWindow.postMessage(event.data, Lib.$origin);
        });
      }
      const iframe = Lib.createElement("iframe", { id: Control.IdList.Iframe, src: Param.NextLink });
      (() => {
        let Img,
          Observer,
          Quantity = 0;
        const observerNext = new IntersectionObserver(
          (observed) => {
            observed.forEach((entry) => {
              const rect = entry.boundingClientRect;
              const isPastTarget = rect.bottom < 0;
              const isIntersecting = entry.isIntersecting;
              if ((isIntersecting || isPastTarget) && Tools$1.detectionValue(Img)) {
                observerNext.disconnect();
                Observer.disconnect();
                TurnPage();
              }
            });
          },
          { threshold: 0.1, rootMargin: "0px 0px 100px 0px" },
        );
        setTimeout(() => {
          Img = Param.MangaList.$qa("img");
          if (Img.length <= 5) {
            TurnPage();
            return;
          }
          observerNext.observe(Tools$1.lastObject(Tools$1.visibleObjects(Img)));
          Lib.$observer(
            Param.MangaList,
            () => {
              const Visible = Tools$1.visibleObjects(Img);
              const VL = Visible.length;
              if (VL > Quantity) {
                Quantity = VL;
                observerNext.disconnect();
                observerNext.observe(Tools$1.lastObject(Visible));
              }
            },
            { debounce: 100 },
            (observer) => {
              Observer = observer.ob;
            },
          );
        }, Control.WaitPicture);
      })();
      let Turned = false;
      function TurnPage() {
        if (Turned) return;
        Turned = true;
        let CurrentHeight = 0;
        const Resize = new ResizeObserver(() => {
          const NewHeight = Param.MangaList.offsetHeight;
          if (NewHeight > CurrentHeight) {
            window.parent.postMessage(
              [
                {
                  Resize: Param.MangaList.offsetHeight,
                  SizeRecord: CurrentHeight,
                },
              ],
              Lib.$origin,
            );
            CurrentHeight = NewHeight;
          }
        });
        if (Tools$1.isFinalPage(Param.NextLink)) {
          if (Optimized) {
            window.parent.postMessage(
              [
                {
                  SizeSet: Param.MangaList.offsetHeight + 245,
                },
              ],
              Lib.$origin,
            );
          }
          StylelRules[0].style.display = "block";
          return;
        }
        Waitload();
        Param.Body.appendChild(iframe);
        Resize.observe(Param.MangaList);
        function Waitload() {
          let IframeWindow, CurrentUrl, Content, AllImg;
          const Failed = () => {
            iframe.offAll();
            iframe.src = Param.NextLink;
            Waitload();
          };
          const Success = () => {
            iframe.offAll();
            IframeWindow = iframe.contentWindow;
            CurrentUrl = IframeWindow.location.href;
            if (CurrentUrl !== Param.NextLink) {
              Failed();
              return;
            }
            Content = IframeWindow.document;
            Content.body.style.overflow = "hidden";
            Lib.log(CurrentUrl, { group: "無盡翻頁" });
            AllImg = Content.$qa("#mangalist img");
            const UrlUpdate = new IntersectionObserver(
              (observed) => {
                observed.forEach((entry) => {
                  if (entry.isIntersecting) {
                    UrlUpdate.disconnect();
                    Resize.disconnect();
                    const PageLink = Content.body.$qa("div.mh_readend ul a");
                    window.parent.postMessage(
                      [
                        {
                          Title: Content.title,
                          CurrentUrl,
                          PreviousUrl: PageLink[0]?.href,
                          NextUrl: PageLink[2]?.href,
                        },
                      ],
                      Lib.$origin,
                    );
                  }
                });
              },
              { threshold: 0 },
            );
            AllImg.forEach(async (img) => UrlUpdate.observe(img));
            if (Optimized) {
              Lib.$q("title").id = Control.IdList.Title;
              const adapt = Lib.platform === "Desktop" ? 0.5 : 0.7;
              const ReleaseMemory = new IntersectionObserver(
                (observed) => {
                  observed.forEach((entry) => {
                    if (entry.isIntersecting) {
                      const targetImg = entry.target;
                      const ratio = Math.min(adapt, (Lib.iH * adapt) / targetImg.clientHeight);
                      if (entry.intersectionRatio >= ratio) {
                        ReleaseMemory.disconnect();
                        Tools$1.getNodes(document).forEach((node) => {
                          node.remove();
                        });
                        targetImg.scrollIntoView();
                      }
                    }
                  });
                },
                { threshold: [0, 0.5, 1] },
              );
              AllImg.forEach(async (img) => ReleaseMemory.observe(img));
            }
          };
          iframe.on("load", Success);
          iframe.on("error", Failed);
        }
      }
    }
    return {
      async auto(Mode = Config.AutoTurnPage.Mode) {
        switch (Mode) {
          case 2:
          case 3:
            unlimited(Mode === 3);
            break;
          default:
            setTimeout(() => {
              const img = Param.MangaList.$qa("img");
              if (!Tools$1.isFinalPage(Param.NextLink)) {
                const observerNext = new IntersectionObserver(
                  (observed) => {
                    observed.forEach((entry) => {
                      if (entry.isIntersecting && Tools$1.detectionValue(img)) {
                        observerNext.disconnect();
                        location.assign(Param.NextLink);
                      }
                    });
                  },
                  { threshold: 0.5 },
                );
                observerNext.observe(Param.BottomStrip);
              }
            }, Control.WaitPicture);
        }
      },
    };
  }
  const PageTurn$1 = PageTurn();
  (async function blockAds() {
    Lib.addStyle(
      `
        html {pointer-events: none !important;}
        div[style*='position'] {display: none !important;}
        .mh_wrap a,
        .mh_readend a,
        span.mh_btn:not(.contact),
        #${Control.IdList.Iframe} {
            pointer-events: auto !important;
        }
    `,
      Control.IdList.Block,
    );
    const OriginListener = EventTarget.prototype.addEventListener;
    const Block = Control.BlockListener;
    EventTarget.prototype.addEventListener = new Proxy(OriginListener, {
      apply(target, thisArg, args) {
        const [type, listener, options] = args;
        if (Block.has(type)) return;
        return target.apply(thisArg, args);
      },
    });
    const iframe = `iframe:not(#${Control.IdList.Iframe})`;
    const AdCleanup = () => {
      Lib.$qa(iframe).forEach((ad) => ad.remove());
      document.body.$qa("script").forEach((ad) => ad.remove());
      requestIdleCallback(AdCleanup, { timeout: 300 });
    };
    AdCleanup();
  })();
  async function hotkeySwitch() {
    const { TurnPage, AutoScroll, KeepScroll } = Config.RegisterHotkey.Function;
    let jumpState = false;
    if (Lib.platform === "Desktop") {
      if (Param.IsMainPage && KeepScroll && AutoScroll && true) {
        Param.Down_scroll = Tools$1.storage("scroll");
        Param.Down_scroll && Tools$1.autoScroll(Control.ScrollPixels);
      }
      const UP_ScrollSpeed = -2;
      const CanScroll = AutoScroll;
      Lib.onEvent(
        window,
        "keydown",
        (event) => {
          const key = event.key;
          if (key === "ArrowLeft" && TurnPage && !jumpState) {
            event.stopImmediatePropagation();
            jumpState = !Tools$1.isFinalPage(Param.PreviousLink);
            location.assign(Param.PreviousLink);
          } else if (key === "ArrowRight" && TurnPage && !jumpState) {
            event.stopImmediatePropagation();
            jumpState = !Tools$1.isFinalPage(Param.NextLink);
            location.assign(Param.NextLink);
          } else if (key === "ArrowUp" && CanScroll) {
            event.stopImmediatePropagation();
            event.preventDefault();
            {
              if (Param.Up_scroll) {
                Param.Up_scroll = false;
              } else if (!Param.Up_scroll || Param.Down_scroll) {
                Param.Down_scroll = false;
                Param.Up_scroll = true;
                Tools$1.autoScroll(UP_ScrollSpeed);
              }
            }
          } else if (key === "ArrowDown" && CanScroll) {
            event.stopImmediatePropagation();
            event.preventDefault();
            {
              if (Param.Down_scroll) {
                Param.Down_scroll = false;
                Tools$1.storage("scroll", false);
              } else if (Param.Up_scroll || !Param.Down_scroll) {
                Param.Up_scroll = false;
                Param.Down_scroll = true;
                Tools$1.storage("scroll", true);
                Tools$1.autoScroll(Control.ScrollPixels);
              }
            }
          }
        },
        { capture: true },
      );
    } else if (Lib.platform === "Mobile") {
      let startX, startY, moveX, moveY;
      const sidelineX = Lib.iW * 0.3;
      const sidelineY = (Lib.iH / 4) * 0.3;
      Lib.onEvent(
        window,
        "touchstart",
        (event) => {
          startX = event.touches[0].clientX;
          startY = event.touches[0].clientY;
        },
        { passive: true },
      );
      Lib.onEvent(
        window,
        "touchmove",
        Lib.$debounce((event) => {
          moveY = event.touches[0].clientY - startY;
          if (Math.abs(moveY) < sidelineY) {
            moveX = event.touches[0].clientX - startX;
            if (moveX > sidelineX && !jumpState) {
              jumpState = !Tools$1.isFinalPage(Param.PreviousLink);
              location.assign(Param.PreviousLink);
            } else if (moveX < -sidelineX && !jumpState) {
              jumpState = !Tools$1.isFinalPage(Param.NextLink);
              location.assign(Param.NextLink);
            }
          }
        }, 60),
        { passive: true },
      );
    }
  }
  function Main() {
    async function initLoad(callback) {
      Lib.waitEl(["body", "div.mh_readtitle", "div.mh_headpager", "div.mh_readend", "#mangalist"], null, { raf: void 0, throttle: 30, timeout: 10, visibility: Param.IsMainPage, timeoutResult: true }).then(([Body, Title, HeadPager, Readend, Manga]) => {
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
        Param.BottomStrip = Readend.$q(".endtip2");
        if ([Param.Body, Param.ContentsPage, Param.HomePage, Param.PreviousLink, Param.NextLink, Param.MangaList, Param.BottomStrip].every((Check) => Check)) callback(true);
        else callback(false);
      });
    }
    try {
      initLoad((state) => {
        if (state) {
          Style$1.pictureStyle();
          Config.BGColor.Enable && Style$1.backgroundStyle();
          Config.AutoTurnPage.Enable && PageTurn$1.auto();
          Config.RegisterHotkey.Enable && hotkeySwitch();
        } else Lib.log("InitLoad Error").error;
      });
    } catch (error) {
      Lib.log(error).error;
    }
  }
  Main();
})();