import { monkeyWindow, Lib } from '../services/client.js';
import { Config, Control, Param } from '../core/config.js';
import Tools from '../utils/tools.js';

export default async (
    turnMode = Config.AutoTurnPage.Mode,
    optimized = Config.AutoTurnPage.Mode === 3
) => {

    /* 無盡 翻頁 */
    async function unlimited() {

        // 修改樣式 (隱藏某些元素 增加沉浸體驗)
        Lib.addStyle(`
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
        `, Control.IdList.Scroll);

        // 取得樣式
        const StylelRules = Lib.$q(`#${Control.IdList.Scroll}`).sheet.cssRules;

        // 修改最上層主頁面 (根據無盡翻頁的變化)
        if (Param.IsMainPage) {
            let Size = 0;

            Lib.onEvent(window, "message", event => {
                const data = event.data;
                if (data && data.length > 0) {
                    const {
                        Title, PreviousUrl, CurrentUrl, NextUrl,
                        Resize, SizeSet, SizeRecord
                    } = data[0];

                    if (Resize) {
                        if (Size > SizeRecord) Size -= SizeRecord; // 減去先前的大小
                        Size += Resize; // 以最新大小累加
                        StylelRules[2].style.height = `${Size}px`; // 根據容器高度調整
                    }
                    else if (SizeSet) StylelRules[2].style.height = `${SizeSet}px`; // 設置新的大小
                    else if (Title && NextUrl && PreviousUrl && CurrentUrl) { // 更新頁面信息
                        document.title = Title;
                        Param.NextLink = NextUrl;
                        Param.PreviousLink = PreviousUrl;
                        history.pushState(null, null, CurrentUrl);
                    }
                }
            })
        } else {
            Lib.addStyle(`
                html {
                    overflow: hidden !important;
                    overflow-x: hidden !important;
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }
                html::-webkit-scrollbar {
                    display: none !important;
                }
            `, Control.IdList.ChildS);

            let MainWindow = window;
            Lib.onEvent(window, "message", event => {
                while (MainWindow.parent !== MainWindow) {
                    MainWindow = MainWindow.parent;
                }
                MainWindow.postMessage(event.data, Lib.$origin);
            })
        };

        // 創建 iframe 元素
        const iframe = Lib.createElement("iframe", { id: Control.IdList.Iframe, src: Param.NextLink });

        (() => {
            /* 檢測翻頁 */

            let img, Observer, quantity = 0;
            const observerNext = new IntersectionObserver(observed => { // 觀察器
                observed.forEach(entry => {
                    const rect = entry.boundingClientRect;
                    const isPastTarget = rect.bottom < 0;
                    const isIntersecting = entry.isIntersecting;

                    if ((isIntersecting || isPastTarget) && Tools.detectionValue(img)) {
                        observerNext.disconnect();
                        Observer.disconnect();
                        TurnPage();
                    }
                });
            }, { threshold: .1, rootMargin: '0px 0px 100px 0px' });
            if (import.meta.hot) monkeyWindow.Next = observerNext;

            setTimeout(() => {
                img = Param.MangaList.$qa("img"); // 取得當前狀態

                if (img.length <= 5) { // 總長度 <= 5 直接觸發換頁
                    TurnPage();
                    return;
                };

                // ! 不能保證最終一定能觀察成功
                const lastImg = Tools.lastObject(Tools.visibleObjects(img));
                lastImg instanceof Element && observerNext.observe(lastImg); // 首次添加觀察

                // 後續根據變化, 修改觀察對象
                Lib.$observer(Param.MangaList, () => {
                    const visible = Tools.visibleObjects(img);
                    const vlen = visible.length;

                    if (vlen > quantity) { // 判斷值測試
                        quantity = vlen;
                        // 修改新的觀察對象

                        const lastImg = Tools.lastObject(visible);
                        if (lastImg instanceof Element) {
                            observerNext.disconnect();
                            observerNext.observe(lastImg);
                        }
                    }

                }, { debounce: 100 }, observer => {
                    Observer = observer.ob;
                    if (import.meta.hot) monkeyWindow.changeObserver = Observer;
                });

            }, Control.WaitPicture);
        })();

        /* 翻頁邏輯 */
        let Turned = false;
        function TurnPage() {
            if (Turned) return;
            Turned = true;

            let CurrentHeight = 0;
            const Resize = new ResizeObserver(() => {
                const NewHeight = Param.MangaList.offsetHeight;

                if (NewHeight > CurrentHeight) {
                    window.parent.postMessage([{
                        Resize: Param.MangaList.offsetHeight,
                        SizeRecord: CurrentHeight
                    }], Lib.$origin);

                    CurrentHeight = NewHeight;
                }
            });

            if (Tools.isFinalPage(Param.NextLink)) { // 檢測是否是最後一頁 (進行恢復處理)

                if (optimized) {
                    window.parent.postMessage([{
                        SizeSet: (Param.MangaList.offsetHeight + 245),
                    }], Lib.$origin);
                }

                StylelRules[0].style.display = "block"; // 恢復隱藏的元素度
                return;
            };

            Waitload();
            Param.Body.appendChild(iframe); // 添加到 body 中
            Resize.observe(Param.MangaList); // 持續設置高度

            // 等待 iframe 載入完成
            function Waitload() {
                let IframeWindow, CurrentUrl, Content, AllImg;

                // 失敗載入處理
                const Failed = () => {
                    iframe.offAll();
                    iframe.src = Param.NextLink;
                    Waitload();
                };

                // 成功載入後處理
                const Success = () => {

                    iframe.offAll();
                    IframeWindow = iframe.contentWindow;
                    CurrentUrl = IframeWindow.location.href;

                    if (CurrentUrl !== Param.NextLink) { // 避免載入錯誤頁面
                        Failed();
                        return;
                    };

                    Content = IframeWindow.document;
                    Content.body.style.overflow = "hidden";
                    Lib.log(CurrentUrl, { group: "無盡翻頁" });

                    // 全部圖片
                    AllImg = Content.$qa("#mangalist img");

                    // 監聽換頁點
                    const UrlUpdate = new IntersectionObserver(observed => {
                        observed.forEach(entry => {
                            if (entry.isIntersecting) {
                                UrlUpdate.disconnect();
                                Resize.disconnect();

                                const PageLink = Content.body.$qa("div.mh_readend ul a");

                                window.parent.postMessage([{
                                    Title: Content.title,
                                    CurrentUrl,
                                    PreviousUrl: PageLink[0]?.href,
                                    NextUrl: PageLink[2]?.href
                                }], Lib.$origin);
                            }
                        });
                    }, { threshold: 0 });
                    AllImg.forEach(async img => UrlUpdate.observe(img));

                    if (optimized) {
                        Lib.$q("title").id = Control.IdList.Title; // 賦予一個 ID 用於白名單排除

                        const adapt = Lib.platform === "Desktop" ? .5 : .7;

                        // 監聽釋放點
                        const ReleaseMemory = new IntersectionObserver(observed => {
                            observed.forEach(entry => {
                                if (entry.isIntersecting) {

                                    const targetImg = entry.target;
                                    const ratio = Math.min(adapt, (Lib.iH * adapt) / targetImg.clientHeight); // 動態計算

                                    if (entry.intersectionRatio >= ratio) {
                                        ReleaseMemory.disconnect();
                                        Tools.getNodes(document).forEach(node => {
                                            node.remove(); // 刪除元素, 等待瀏覽器自己釋放
                                        })
                                        targetImg.scrollIntoView();
                                    }
                                }
                            });
                        }, { threshold: [0, .5, 1] });

                        AllImg.forEach(async img => ReleaseMemory.observe(img));
                    }
                };

                // 監聽 iframe 載入事件
                iframe.on("load", Success); // ! 有些漫畫觸發很慢, 詢輪查找又有其他 Bug, 暫時放棄解決
                iframe.on("error", Failed);
            }
        }
    };

    switch (turnMode) {
        case 2: case 3:
            unlimited();
            break;
        default:
            /* 一般翻頁 */
            setTimeout(() => {
                const img = Param.MangaList.$qa("img");

                if (!Tools.isFinalPage(Param.NextLink)) {
                    const observerNext = new IntersectionObserver(observed => {
                        observed.forEach(entry => {
                            if (entry.isIntersecting && Tools.detectionValue(img)) {
                                observerNext.disconnect();
                                location.assign(Param.NextLink);
                            }
                        });
                    }, { threshold: .5 });

                    // 預設觀察底部換頁條
                    observerNext.observe(Param.BottomStrip);
                    if (import.meta.hot) monkeyWindow.Next = observerNext;
                }
            }, Control.WaitPicture);
    }
};