export default function PageTurn(Syn, Control, Param, tools) {

    /* 無盡 翻頁模式 */
    async function Unlimited(Optimized) {
        const iframe = Syn.createElement("iframe", { id: Control.IdList.Iframe, src: Param.NextLink });

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

        // 修改當前觀看的頁面 (根據無盡翻頁的變化)
        if (Param.IsMainPage) {
            window.addEventListener("message", event => {
                const data = event.data;
                if (data && data.length > 0) {
                    const { Title, PreviousUrl, CurrentUrl, NextUrl } = data[0];

                    document.title = Title;
                    Param.NextLink = NextUrl;
                    Param.PreviousLink = PreviousUrl;
                    history.pushState(null, null, CurrentUrl);
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

        /* 檢測翻頁 */
        TriggerNextLink();
        async function TriggerNextLink() {

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
        };

        /* 翻頁邏輯 */
        async function TurnPage() {
            let Content, CurrentUrl, StylelRules = Syn.$q(`#${Control.IdList.Scroll}`).sheet.cssRules;

            if (tools.FinalPage(Param.NextLink)) { // 檢測是否是最後一頁 (恢復隱藏的元素)
                StylelRules[0].style.display = "block";
                return;
            };

            Param.Body.appendChild(iframe);
            Waitload();

            // 等待 iframe 載入完成
            function Waitload() {
                iframe.onload = () => {
                    CurrentUrl = iframe.contentWindow.location.href;

                    if (CurrentUrl != Param.NextLink) { // 避免載入錯誤頁面
                        iframe.src = Param.NextLink;
                        Waitload();
                        return;
                    };

                    Content = iframe.contentWindow.document;
                    Content.body.style.overflow = "hidden";
                    Syn.Log("無盡翻頁", CurrentUrl);

                    // 首張圖片
                    const TopImg = Content.$q("#mangalist img");

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

                    UrlUpdate.observe(TopImg);

                    if (Optimized) {
                        Syn.$q("title").id = Control.IdList.Title; // 賦予一個 ID 用於白名單排除

                        // 動態計算臨界值
                        const adapt = Syn.Platform === "Desktop" ? .5 : .7;
                        const hold = Math.min(adapt, (Syn.iH * adapt) / TopImg.clientHeight);

                        // 監聽釋放點
                        const ReleaseMemory = new IntersectionObserver(observed => {
                            observed.forEach(entry => {
                                if (entry.isIntersecting) {
                                    ReleaseMemory.disconnect();
                                    tools.Get_Nodes(document).forEach(node => {
                                        node.remove(); // 刪除元素, 等待瀏覽器自己釋放
                                    })
                                    TopImg.scrollIntoView();
                                }
                            });
                        }, { threshold: hold });

                        ReleaseMemory.observe(TopImg);
                    };

                    // 持續設置高度
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
                };

                iframe.onerror = () => {
                    iframe.src = Param.NextLink;
                    Waitload();
                };
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