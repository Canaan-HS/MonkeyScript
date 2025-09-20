import { monkeyWindow, Lib } from '../services/client.js';
import { Config, Control, Param } from '../core/config.js';
import Tools from '../utils/tools.js';

export default async () => {
    const turnMode = Config.AutoTurnPage.Mode;
    const optimized = turnMode === 3;

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
        const stylelRules = Lib.$q(`#${Control.IdList.Scroll}`).sheet.cssRules;

        // 修改最上層主頁面 (根據無盡翻頁的變化)
        if (Param.IsMainPage) {
            let size = 0;

            Lib.onEvent(window, "message", event => {
                const data = event.data;
                if (data && data.length > 0) {
                    const {
                        Title, PreviousUrl, CurrentUrl, NextUrl,
                        Resize, SizeSet, SizeRecord
                    } = data[0];

                    if (Resize) {
                        if (optimized) {
                            size = Math.max(Resize, SizeRecord);
                        } else {
                            size += Resize - SizeRecord;
                        }

                        stylelRules[2].style.height = `${size}px`; // 根據容器高度調整
                    }
                    else if (SizeSet) stylelRules[2].style.height = `${SizeSet}px`; // 設置新的大小
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

            let mainWindow = window;
            Lib.onEvent(window, "message", event => {
                while (mainWindow.parent !== mainWindow) {
                    mainWindow = mainWindow.parent;
                }
                mainWindow.postMessage(event.data, Lib.$origin);
            })
        };

        // 創建 iframe 元素
        const iframe = Lib.createElement("iframe", { id: Control.IdList.Iframe, src: Param.NextLink });

        (async () => {
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
                        turnPage();
                    }
                });
            }, { threshold: [0, .1, .5], rootMargin: '0px 0px 200px 0px' });
            if (import.meta.hot) monkeyWindow.Next = observerNext;

            setTimeout(() => {
                img = Param.MangaList.$qa("img"); // 取得當前狀態

                if (img.length <= 5) { // 總長度 <= 5 直接觸發換頁
                    turnPage();
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

                }, {
                    debounce: 100,
                    attributeFilter: ['src']
                }, observer => {
                    Observer = observer.ob;
                    if (import.meta.hot) monkeyWindow.changeObserver = Observer;
                });

            }, Control.WaitPicture);
        })();

        /* 翻頁邏輯 */
        let turned = false;
        function turnPage() {
            if (turned) return;
            turned = true;

            let currentHeight = 0;
            const resizeObserver = new ResizeObserver(() => {
                const newHeight = Param.MangaList.offsetHeight;

                if (newHeight > currentHeight) {

                    window.parent.postMessage([{
                        Resize: Param.MangaList.offsetHeight,
                        SizeRecord: currentHeight,
                    }], Lib.$origin);

                    currentHeight = newHeight;
                }
            });

            if (Tools.isFinalPage(Param.NextLink)) { // 檢測是否是最後一頁 (進行恢復處理)

                if (optimized) {
                    window.parent.postMessage([{
                        SizeSet: (Param.MangaList.offsetHeight + 245),
                    }], Lib.$origin);
                }

                stylelRules[0].style.display = "block"; // 恢復隱藏的元素度
                return;
            };

            waitLoad();
            Param.Body.appendChild(iframe); // 添加到 body 中
            resizeObserver.observe(Param.MangaList);

            // 等待 iframe 載入完成
            function waitLoad() {
                let iframeWindow, currentUrl, content, allImg;

                // 失敗載入處理
                const failed = () => {
                    iframe.offAll();
                    iframe.src = "";
                    setTimeout(() => {
                        iframe.src = Param.NextLink;
                        waitLoad();
                    })
                };

                // 成功載入後處理
                const success = () => {

                    iframe.offAll();
                    iframeWindow = iframe.contentWindow;
                    currentUrl = iframeWindow.location.href;

                    if (currentUrl !== Param.NextLink) { // 避免載入錯誤頁面
                        failed();
                        return;
                    };

                    content = iframeWindow.document;
                    content.body.style.overflow = "hidden";
                    Lib.log(currentUrl, { group: "無盡翻頁" });

                    // 全部圖片
                    allImg = content.$qa("#mangalist img");

                    // 監聽換頁點
                    const urlUpdate = new IntersectionObserver(observed => {
                        observed.forEach(entry => {
                            if (entry.isIntersecting) {
                                urlUpdate.disconnect();

                                const PageLink = content.body.$qa("div.mh_readend ul a");
                                window.parent.postMessage([{
                                    Title: content.title,
                                    CurrentUrl: currentUrl,
                                    PreviousUrl: PageLink[0]?.href,
                                    NextUrl: PageLink[2]?.href
                                }], Lib.$origin);
                            }
                        });
                    }, { threshold: 0 });
                    allImg.forEach(img => urlUpdate.observe(img));

                    if (optimized) {
                        Lib.$q("title").id = Control.IdList.Title; // 賦予一個 ID 用於白名單排除

                        const adapt = Lib.platform === "Desktop" ? .5 : .7;

                        // 監聽釋放點
                        const releaseMemory = new IntersectionObserver(observed => {
                            observed.forEach(entry => {
                                if (entry.isIntersecting) {

                                    const targetImg = entry.target;
                                    const ratio = Math.min(adapt, (Lib.iH * adapt) / targetImg.clientHeight); // 動態計算

                                    if (entry.intersectionRatio >= ratio) {
                                        releaseMemory.disconnect();

                                        Tools.getNodes(document).forEach(node => {
                                            node.remove(); // 刪除元素, 等待瀏覽器自己釋放
                                        })

                                        targetImg.scrollIntoView();
                                    }
                                }
                            });
                        }, { threshold: [0, .5, 1] });

                        allImg.forEach(img => releaseMemory.observe(img));
                    }
                };

                // 監聽 iframe 載入事件
                iframe.on("load", success); // ! 有些漫畫觸發很慢, 詢輪查找又有其他 Bug, 暫時放棄解決
                iframe.on("error", failed);
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