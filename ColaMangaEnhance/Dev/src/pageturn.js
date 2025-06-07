export default function PageTurn(Syn, Control, Param, tools) {

    /* 無盡 翻頁模式 */
    async function Unlimited(Optimized) {

        // 修改樣式 (隱藏某些元素 增加沉浸體驗)
        Syn.AddStyle(`
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
        const StylelRules = Syn.$q(`#${Control.IdList.Scroll}`).sheet.cssRules;
        // 嘗試取得阻擋廣告的樣式
        const BlockRules = Syn.$q(`#${Control.IdList.Block}`)?.sheet?.cssRules;

        // 修改最上層主頁面 (根據無盡翻頁的變化)
        if (Param.IsMainPage) {
            window.addEventListener("message", event => {
                const data = event.data;
                if (data && data.length > 0) {
                    const {
                        Title, PreviousUrl, CurrentUrl, NextUrl,
                        Resize, StopResize, Recover
                    } = data[0];

                    if (Resize) StylelRules[2].style.height = `${Resize}px`; // 根據容器高度調整
                    else if (StopResize) clearTimeout(Control.ResizeHandle); // 停止 Resize
                    else if (Recover && BlockRules) BlockRules[0].style.setProperty("pointer-events", "auto", "important"); // 恢復點擊事件 (有時失敗不知道為啥)
                    else { // 更新頁面信息
                        document.title = Title;
                        Param.NextLink = NextUrl;
                        Param.PreviousLink = PreviousUrl;
                        history.pushState(null, null, CurrentUrl);
                    }
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
            `, Control.IdList.ChildS);

            let MainWindow = window;
            window.addEventListener("message", event => {
                while (MainWindow.parent !== MainWindow) { MainWindow = MainWindow.parent }
                MainWindow.postMessage(event.data, Syn.$origin);
            })
        };

        // 創建 iframe 元素
        const iframe = Syn.createElement("iframe", { id: Control.IdList.Iframe, src: Param.NextLink });

        (() => {
            /* 檢測翻頁 */

            let Img, Observer, Quantity = 0;
            const Observer_Next = new IntersectionObserver(observed => { // 觀察器
                observed.forEach(entry => {
                    if (entry.isIntersecting && tools.DetectionValue(Img)) {
                        Observer_Next.disconnect();
                        Observer.disconnect();
                        TurnPage();
                    }
                });
            }, { threshold: .1 });

            setTimeout(() => {
                Img = Param.MangaList.$qa("img"); // 取得當前狀態

                if (Img.length <= 5) { // 總長度 <= 5 直接觸發換頁
                    TurnPage();
                    return;
                };

                // 首次添加觀察
                Observer_Next.observe(
                    tools.ObserveObject(tools.VisibleObjects(Img))
                );

                // 後續根據變化, 修改觀察對象
                Syn.Observer(Param.MangaList, () => {
                    const Visible = tools.VisibleObjects(Img);
                    const VL = Visible.length;

                    if (VL > Quantity) { // 判斷值測試
                        Quantity = VL;
                        Observer_Next.disconnect();
                        Observer_Next.observe(
                            tools.ObserveObject(Visible) // 修改新的觀察對象
                        )
                    }

                }, { debounce: 300 }, observer => {
                    Observer = observer.ob;
                });
            }, Control.WaitPicture);
        })();

        /* 翻頁邏輯 */
        function TurnPage() {
            let CurrentHeight = 0;

            const Resize = (Increment = 0) => {
                const NewHeight = Param.Body.scrollHeight + Increment;

                if (NewHeight > CurrentHeight) {
                    CurrentHeight = NewHeight;
                    window.parent.postMessage([{ Resize: NewHeight }], Syn.$origin);
                };

                Control.ResizeHandle = setTimeout(Resize, 1200);
            };

            if (tools.FinalPage(Param.NextLink)) { // 檢測是否是最後一頁 (進行恢復處理)

                /*
                ? 停止先前 Resize
                * 只在 IsMainPage 啟用 Resize 遞迴, 因此他傳遞的是以 MainPage 的 scrollHeight, 給 MainPage 的 style.height 設置
                * 在這邊停掉先前的 Resize, 再次啟動就會變成 當前 iframe 的 scrollHeight, 給 MainPage 的 style.height 設置
                * 這樣就能解決最後一頁過多空白的問題
                */
                window.parent.postMessage([{ StopResize: true }], Syn.$origin);

                StylelRules[0].style.display = "block"; // 恢復隱藏的元素
                window.parent.postMessage([{ Recover: true }], Syn.$origin); // MainPage 恢復點擊事件 (有時沒用, 不知道為啥)

                Resize(40); // 再次啟動, 並給予 40px 的增量
                return;
            };

            // 持續設置高度
            if (Param.IsMainPage) Resize();

            Waitload();
            Param.Body.appendChild(iframe);

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
                    Syn.Log("無盡翻頁", CurrentUrl);

                    // 全部圖片
                    AllImg = Content.$qa("#mangalist img");

                    // 監聽換頁點
                    const UrlUpdate = new IntersectionObserver(observed => {
                        observed.forEach(entry => {
                            if (entry.isIntersecting) {
                                UrlUpdate.disconnect();

                                const PageLink = Content.body.$qa("div.mh_readend ul a");

                                window.parent.postMessage([{
                                    Title: Content.title,
                                    CurrentUrl,
                                    PreviousUrl: PageLink[0]?.href,
                                    NextUrl: PageLink[2]?.href
                                }], Syn.$origin);
                            }
                        });
                    }, { threshold: .1 });
                    AllImg.forEach(async img => UrlUpdate.observe(img));

                    if (Optimized) {
                        Syn.$q("title").id = Control.IdList.Title; // 賦予一個 ID 用於白名單排除

                        const adapt = Syn.Platform === "Desktop" ? .5 : .7;

                        // 監聽釋放點
                        const ReleaseMemory = new IntersectionObserver(observed => {
                            observed.forEach(entry => {
                                if (entry.isIntersecting) {

                                    const targetImg = entry.target;
                                    const ratio = Math.min(adapt, (Syn.iH * adapt) / targetImg.clientHeight); // 動態計算

                                    if (entry.intersectionRatio >= ratio) {
                                        ReleaseMemory.disconnect();
                                        tools.Get_Nodes(document).forEach(node => {
                                            node.remove(); // 刪除元素, 等待瀏覽器自己釋放
                                        })
                                        targetImg.scrollIntoView();
                                    }
                                }
                            });
                        }, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0] });

                        AllImg.forEach(async img => ReleaseMemory.observe(img));
                    }
                };

                // 監聽 iframe 載入事件
                iframe.on("load", Success); // ! 有些漫畫觸發很慢, 詢輪查找又有其他 Bug, 暫時放棄解決
                iframe.on("error", Failed);
            }
        }
    };

    return {
        /* 自動切換下一頁 */
        async Auto(Mode) {
            switch (Mode) {
                case 2: case 3:
                    Unlimited(Mode === 3);
                    break;
                default:
                    setTimeout(() => {
                        const img = Param.MangaList.$qa("img");

                        if (!tools.FinalPage(Param.NextLink)) {
                            const Observer_Next = new IntersectionObserver(observed => {
                                observed.forEach(entry => {
                                    if (entry.isIntersecting && tools.DetectionValue(img)) {
                                        location.assign(Param.NextLink);
                                    }
                                });
                            }, { threshold: .5 });

                            // 預設觀察底部換頁條
                            Observer_Next.observe(Param.BottomStrip);
                        }
                    }, Control.WaitPicture);
            }
        }
    };
}