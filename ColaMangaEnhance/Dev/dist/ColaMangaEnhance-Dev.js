// ==UserScript==
// @name         ColaManga 瀏覽增強
// @name:zh-TW   ColaManga 瀏覽增強
// @name:zh-CN   ColaManga 浏览增强
// @name:en      ColaManga Browsing Enhance
// @version      0.0.12-Beta
// @author       Canaan HS
// @description       隱藏廣告內容，提昇瀏覽體驗。自訂背景顏色，圖片大小調整。當圖片載入失敗時，自動重新載入圖片。提供熱鍵功能：[← 上一頁]、[下一頁 →]、[↑ 自動上滾動]、[↓ 自動下滾動]。當用戶滾動到頁面底部時，自動跳轉到下一頁。
// @description:zh-TW 隱藏廣告內容，提昇瀏覽體驗。自訂背景顏色，圖片大小調整。當圖片載入失敗時，自動重新載入圖片。提供熱鍵功能：[← 上一頁]、[下一頁 →]、[↑ 自動上滾動]、[↓ 自動下滾動]。當用戶滾動到頁面底部時，自動跳轉到下一頁。
// @description:zh-CN 隐藏广告内容，提昇浏览体验。自定义背景颜色，调整图片大小。当图片载入失败时，自动重新载入图片。提供快捷键功能：[← 上一页]、[下一页 →]、[↑ 自动上滚动]、[↓ 自动下滚动]。当用户滚动到页面底部时，自动跳转到下一页。
// @description:en    Hide advertisement content, enhance browsing experience. Customize background color, adjust image size. Automatically reload images when they fail to load. Provide shortcut key functionalities: [← Previous Page], [Next Page →], [↑ Auto Scroll Up], [↓ Auto Scroll Down]. Automatically jump to the next page when users scroll to the bottom of the page.

// @match        *://www.colamanga.com/manga-*/*/*.html
// @icon         https://www.colamanga.com/favicon.png

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635

// @require      https://update.greasyfork.org/scripts/487608/1597491/SyntaxLite_min.js

// @grant        GM_setValue
// @grant        GM_getValue

// @run-at       document-start
// ==/UserScript==

(async () => {
  const Config = {
    BGColor: {
      Enable: true,
      Color: "#595959"
    },
    AutoTurnPage: {
      Enable: true,
      Mode: 3
    },
    RegisterHotkey: {
      Enable: true,
      Function: {
        TurnPage: true,
        AutoScroll: true,
        KeepScroll: true,
        ManualScroll: false
      }
    }
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
      ChildS: "CME_Child-Scroll-Hidden"
    }
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
    IsMainPage: window.self === window.parent
  };
  function Tools(Syn2, Config2, Control2, Param2) {
    const IdWhiteList = new Set(Object.values(Control2.IdList));
    const Storage = (key, value = null) => {
      return value != null ? Syn2.Session(key, {
        value: value
      }) : Syn2.Session(key);
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
      Storage: Storage,
      GetSet: () => {
        return Syn2.gV("Style", {
          BG_Color: "#595959",
          Img_Bw: "auto",
          Img_Mw: "100%"
        });
      },
      Get_Nodes(Root) {
        const nodes = [];
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
      },
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
      ManualScroll(move) {
        window.scrollBy({
          left: 0,
          top: move,
          behavior: "smooth"
        });
      },
      FinalPage(link) {
        Param2.IsFinalPage = link.startsWith("javascript");
        return Param2.IsFinalPage;
      },
      VisibleObjects: object => object.filter(img => img.height > 0 || img.src),
      ObserveObject: object => object[Math.max(object.length - 2, 0)],
      DetectionValue(object) {
        return this.VisibleObjects(object).length >= Math.floor(object.length * .5);
      }
    };
  }
  function Style(Syn2, Control2, Param2, Set2) {
    return {
      async BackgroundStyle(Color) {
        Param2.Body.style.cssText = `
                background: ${Color} !important;
            `;
        document.documentElement.style.cssText = `
                overflow: visible !important;
            `;
      },
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
          const click = new MouseEvent("click", {
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
          Param2.MangaList.$qa("span.mh_btn:not(.contact):not(.read_page_link)").forEach(reloadBtn => observer.observe(reloadBtn));
        }, Control2.WaitPicture);
      },
      async MenuStyle() { }
    };
  }
  function PageTurn(Syn2, Control2, Param2, tools) {
    async function Unlimited(Optimized) {
      const iframe = Syn2.createElement("iframe", {
        id: Control2.IdList.Iframe,
        src: Param2.NextLink
      });
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
      if (Param2.IsMainPage) {
        Syn2.one(window, "message", event => {
          const data = event.data;
          if (data && data.length > 0) {
            const {
              Title,
              PreviousUrl,
              CurrentUrl,
              NextUrl
            } = data[0];
            document.title = Title;
            Param2.NextLink = NextUrl;
            Param2.PreviousLink = PreviousUrl;
            history.pushState(null, null, CurrentUrl);
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
        Syn2.one(window, "message", event => {
          while (MainWindow.parent !== MainWindow) {
            MainWindow = MainWindow.parent;
          }
          MainWindow.postMessage(event.data, Syn2.$origin);
        });
      }
      TriggerNextLink();
      async function TriggerNextLink() {
        let Img, Observer, Quantity = 0;
        const Observer_Next = new IntersectionObserver(observed => {
          observed.forEach(entry => {
            if (entry.isIntersecting && tools.DetectionValue(Img)) {
              Observer_Next.disconnect();
              Observer.disconnect();
              TurnPage();
            }
          });
        }, {
          threshold: .1
        });
        setTimeout(() => {
          Img = Param2.MangaList.$qa("img");
          if (Img.length <= 5) {
            TurnPage();
            return;
          }
          Observer_Next.observe(tools.ObserveObject(tools.VisibleObjects(Img)));
          Syn2.Observer(Param2.MangaList, () => {
            Img = Param2.MangaList.$qa("img");
            const Visible = tools.VisibleObjects(Img);
            const VL = Visible.length;
            if (VL > Quantity) {
              Quantity = VL;
              Observer_Next.disconnect();
              Observer_Next.observe(tools.ObserveObject(Visible));
            }
          }, {
            debounce: 500
          }, observer => {
            Observer = observer.ob;
          });
        }, Control2.WaitPicture);
      }
      async function TurnPage() {
        let Content, CurrentUrl, StylelRules = Syn2.$q(`#${Control2.IdList.Scroll}`).sheet.cssRules;
        if (tools.FinalPage(Param2.NextLink)) {
          StylelRules[0].style.display = "block";
          return;
        }
        Param2.Body.appendChild(iframe);
        Waitload();
        function Waitload() {
          iframe.onload = () => {
            CurrentUrl = iframe.contentWindow.location.href;
            CurrentUrl != Param2.NextLink && (iframe.src = Param2.NextLink,
              Waitload());
            Content = iframe.contentWindow.document;
            Content.body.style.overflow = "hidden";
            Syn2.Log("無盡翻頁", CurrentUrl);
            const TopImg = Content.$q("#mangalist img");
            let lastHeight = 0;
            const Resize = () => {
              const newHeight = Content.body.scrollHeight;
              if (newHeight !== lastHeight) {
                StylelRules[2].style.height = `${newHeight}px`;
                lastHeight = newHeight;
              }
              setTimeout(Resize, 1300);
            };
            Resize();
            const UrlUpdate = new IntersectionObserver(observed => {
              observed.forEach(entry => {
                var _a, _b;
                if (entry.isIntersecting) {
                  UrlUpdate.disconnect();
                  const PageLink = Content.body.$qa("div.mh_readend ul a");
                  window.parent.postMessage([{
                    Title: Content.title,
                    CurrentUrl: CurrentUrl,
                    PreviousUrl: (_a = PageLink[0]) == null ? void 0 : _a.href,
                    NextUrl: (_b = PageLink[2]) == null ? void 0 : _b.href
                  }], Syn2.$origin);
                }
              });
            }, {
              threshold: .1
            });
            UrlUpdate.observe(TopImg);
            if (Optimized) {
              Syn2.$q("title").id = Control2.IdList.Title;
              const adapt = Syn2.Platform === "Desktop" ? .5 : .7;
              const hold = Math.min(adapt, Syn2.iH * adapt / TopImg.clientHeight);
              const ReleaseMemory = new IntersectionObserver(observed => {
                observed.forEach(entry => {
                  if (entry.isIntersecting) {
                    ReleaseMemory.disconnect();
                    tools.Get_Nodes(document).forEach(node => {
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
            iframe.src = Param2.NextLink;
            Waitload();
          };
        }
      }
    }
    return {
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
                const Observer_Next = new IntersectionObserver(observed => {
                  observed.forEach(entry => {
                    if (entry.isIntersecting && tools.DetectionValue(img)) {
                      location.assign(Param2.NextLink);
                    }
                  });
                }, {
                  threshold: .5
                });
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
      const OriginListener = EventTarget.prototype.addEventListener, Block = Control.BlockListener;
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
      Syn.AddStyle(`
            div[style*='position'] {display: none !important;}
            html {pointer-events: none !important;}
            .mh_wrap, span.mh_btn:not(.contact), ${Control.IdList.Iframe} {pointer-events: auto;}
        `, Control.IdList.Block);
      const iframe = `iframe:not(#${Control.IdList.Iframe})`;
      const AdCleanup = () => {
        var _a;
        (_a = Syn.$q(iframe)) == null ? void 0 : _a.remove();
        removeBlockedListeners();
        requestIdleCallback(AdCleanup, {
          timeout: 500
        });
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
        Syn.onEvent(window, "keydown", event => {
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
        }, {
          capture: true
        });
      } else if (Syn.Platform === "Mobile") {
        let startX, startY, moveX, moveY;
        const sidelineX = Syn.iW * .3;
        const sidelineY = Syn.iH / 4 * .3;
        Syn.onEvent(window, "touchstart", event => {
          startX = event.touches[0].clientX;
          startY = event.touches[0].clientY;
        }, {
          passive: true
        });
        Syn.onEvent(window, "touchmove", Syn.Debounce(event => {
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
        }, 60), {
          passive: true
        });
      }
    }
    (() => {
      async function Init(callback) {
        Syn.WaitElem(["body", "div.mh_readtitle", "div.mh_headpager", "div.mh_readend", "#mangalist"], null, {
          timeout: 10,
          throttle: 30,
          visibility: Param.IsMainPage,
          timeoutResult: true
        }).then(([Body, Title, HeadPager, Readend, Manga]) => {
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
          if ([Param.Body, Param.ContentsPage, Param.HomePage, Param.PreviousLink, Param.NextLink, Param.MangaList, Param.BottomStrip].every(Check => Check)) callback(true); else callback(false);
        });
      }
      BlockAds();
      try {
        Init(state => {
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