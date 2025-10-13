import { Lib } from "../../services/client";
import { Parame, Page } from "../config";

const OriginalImageFactory = () => {

    // 針對 Neko 網站的支援
    const linkQuery = Page.isNeko ? "div" : "a";
    const safeGetSrc = (element) => element?.src || element?.$gAttr("src");
    const safeGetHref = (element) => element?.href || element?.$gAttr("href");

    // 點擊重試
    const loadFailedClick = () => {
        Lib.onE(".post__files, .scrape__files", "click", event => {
            const target = event.target;
            const isImg = target.matches("img");
            if (isImg && target.alt === "Loading Failed") {
                target.onload = null;
                target.$dAttr("src");
                target.onload = function () { cleanMark(target) };
                target.src = target.$gAttr("data-fsrc");
            }
        }, { capture: true, passive: true });
    };

    const cleanMark = (img) => {
        img.onload = img.onerror = null;
        img.$dAttr("alt");
        img.$dAttr("data-tsrc");
        img.$dAttr("data-fsrc");
        img.$delClass("Image-loading-indicator");
    };

    // 載入原圖 (死圖重試)
    const imgReload = (img, retry) => {
        if (!img.isConnected) return;

        if (!retry) {
            img.alt = "Loading Failed";
            img.src = img.$gAttr("data-tsrc");
            return;
        };

        img.$dAttr("src");

        img.onload = function () {
            cleanMark(img);
        };
        img.onerror = function () {
            img.onload = img.onerror = null;
            setTimeout(() => {
                imgReload(img, retry - 1);
            }, 1e4);
        };

        img.alt = "Reload";
        img.src = img.$gAttr("data-fsrc");
    };

    async function getFileSize(url) {
        for (let i = 0; i < 5; i++) {
            try {
                const result = await new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: "HEAD",
                        url: url,
                        onload: response => {
                            const headers = response.responseHeaders.trim().split(/[\r\n]+/).reduce((acc, line) => {
                                const [name, ...valueParts] = line.split(':');
                                if (name) acc[name.toLowerCase().trim()] = valueParts.join(':').trim();
                                return acc;
                            }, {});

                            const totalLength = parseInt(headers['content-length'], 10);
                            const supportsRange = headers['accept-ranges'] === 'bytes' && totalLength > 0;

                            resolve({
                                supportsRange: supportsRange,
                                totalSize: isNaN(totalLength) ? null : totalLength
                            });
                        },
                        onerror: reject, // 任何網路錯誤都 reject，以便觸發 catch 進行重試
                        ontimeout: reject
                    });
                });

                return result; // 只要成功一次，就立刻回傳結果
            } catch (error) {
                if (i < 4) await new Promise(res => setTimeout(res, 300)); // 如果不是最後一次，就稍等後重試
            }
        }

        // 5 次重試全部失敗後，靜默回傳「不支援」的狀態
        return { supportsRange: false, totalSize: null };
    };

    async function imgRequest(container, url, result) {
        // ! 實驗性分段下載 (暫時關閉)
        // const fileInfo = await getFileSize(url);
        const indicator = Lib.createElement(container, "div", { class: "progress-indicator" });

        let blob = null;
        try {
            // 如果支援分段下載
            if (false /* fileInfo.supportsRange && fileInfo.totalSize */) {
                const CHUNK_COUNT = 6;
                const totalSize = fileInfo.totalSize;
                const chunkSize = Math.ceil(totalSize / CHUNK_COUNT);
                const chunkProgress = new Array(CHUNK_COUNT).fill(0);

                // 更新進度的統一邏輯
                const updateProgress = () => {
                    const totalDownloaded = chunkProgress.reduce((sum, loaded) => sum + loaded, 0);
                    const percent = ((totalDownloaded / totalSize) * 100).toFixed(1);
                    indicator.$text(`${percent}%`);
                };

                const chunkPromises = Array.from({ length: CHUNK_COUNT }, (_, i) => {
                    return (async () => {
                        const start = i * chunkSize;
                        const end = Math.min(start + chunkSize - 1, totalSize - 1);
                        // 為每個分塊內建重試邏輯
                        for (let j = 0; j < 5; j++) {
                            try {
                                return await new Promise((resolve, reject) => {
                                    GM_xmlhttpRequest({
                                        method: "GET",
                                        url,
                                        headers: { "Range": `bytes=${start}-${end}` },
                                        responseType: "blob",
                                        onload: res => (res.status === 206 ? resolve(res.response) : reject(res)),
                                        onerror: reject,
                                        ontimeout: reject,
                                        onprogress: progress => {
                                            chunkProgress[i] = progress.loaded;
                                            updateProgress();
                                        }
                                    });
                                });
                            } catch (error) {
                                if (j < 4) await new Promise(res => setTimeout(res, 300));
                            }
                        }
                        throw new Error(`Chunk ${i} failed after 5 retries.`); // 如果單一分塊最終失敗，則拋出錯誤
                    })();
                });

                const chunks = await Promise.all(chunkPromises);
                blob = new Blob(chunks);

                // 策略二：不支援分段，直接完整下載
            } else {
                for (let i = 0; i < 5; i++) {
                    try {
                        blob = await new Promise((resolve, reject) => {
                            let timeout = null;

                            const request = GM_xmlhttpRequest({
                                url,
                                method: "GET",
                                responseType: "blob",
                                onload: res => {
                                    clearTimeout(timeout);
                                    return res.status === 200 ? resolve(res.response) : reject(res)
                                },
                                onerror: reject,
                                onprogress: progress => {
                                    timer();
                                    if (progress.lengthComputable && indicator.isConnected) {
                                        const percent = ((progress.loaded / progress.total) * 100).toFixed(1);
                                        indicator.$text(`${percent}%`);
                                    }
                                }
                            });

                            function timer() {
                                // GM_xmlhttpRequest 的超時不太穩定
                                clearTimeout(timeout);
                                timeout = setTimeout(() => {
                                    request.abort();
                                    reject();
                                }, 1.5e4)
                            };
                        });
                        break;
                    } catch (error) {
                        if (i < 4) await new Promise(res => setTimeout(res, 300));
                    }
                }
            }

            // 下載完成後的最終檢查
            if (blob && blob.size > 0) {
                result(URL.createObjectURL(blob));
            } else {
                result(Parame.Url);
            }
        } catch (error) {
            // 最終回退：任何下載環節徹底失敗，都使用原始 URL
            result(Parame.Url);
        } finally {
            // 無論結果如何，都移除進度指示器
            indicator?.remove();
        }
    };

    return {
        /* 自動載入原圖 */
        async OriginalImage({ mode, experiment }) {
            Lib.waitEl(".post__thumbnail, .scrape__thumbnail", null, { raf: true, all: true, timeout: 5 }).then(thumbnail => {
                let token = 0, timer = null;
                function imgRendering({ root, index, thumbUrl, newUrl, oldUrl, mode }) {
                    if (!root.isConnected) return;

                    ++index;
                    ++token;

                    const tagName = oldUrl ? "rc" : "div";
                    const oldSrc = oldUrl ? `src="${oldUrl}"` : "";
                    const container = Lib.createDomFragment(`
                        <${tagName} id="IMG-${index}" ${oldSrc}>
                            <img src="${newUrl}" class="Image-loading-indicator Image-style" data-tsrc="${thumbUrl}" data-fsrc="${newUrl}">
                        </${tagName}>
                    `);

                    const img = container.querySelector("img");

                    // 超時手動清除占用
                    timer = setTimeout(() => {
                        --token;
                    }, 1e4);

                    img.onload = function () {
                        clearTimeout(timer);
                        --token;
                        cleanMark(img);
                        mode === "slow" && slowAutoLoad(index);
                    };

                    if (mode === "fast") {
                        img.onerror = function () {
                            --token;
                            img.onload = img.onerror = null;
                            imgReload(img, 7);
                        }
                    };

                    root.replaceWith(container);
                };

                async function imgLoad(root, index, mode = "fast") {
                    if (!root.isConnected) return;

                    root.$dAttr("class");

                    const a = root.$q(linkQuery);
                    const safeHref = safeGetHref(a);

                    const img = root.$q("img");
                    const safeSrc = safeGetSrc(img);

                    if (!a && img) {
                        // ? 如果中途被使用者直接點擊
                        img.$addClass("Image-style");
                        return;
                    };

                    const replaceRoot = Page.isNeko ? root : a;

                    if (experiment) {
                        img.$addClass("Image-loading-indicator-experiment");
                        imgRequest(root, safeHref, href => {
                            imgRendering({
                                root: replaceRoot, index, thumbUrl: safeSrc, newUrl: href, oldUrl: safeHref, mode
                            })
                        });
                    } else {
                        imgRendering({
                            root: replaceRoot, index, thumbUrl: safeSrc, newUrl: safeHref, mode
                        })
                    }
                };

                async function fastAutoLoad() { // mode 1 預設 (快速自動)
                    loadFailedClick();
                    for (const [index, root] of [...thumbnail].entries()) {
                        while (token >= 7) {
                            await Lib.sleep(7e2);
                        };
                        imgLoad(root, index);
                    }
                };

                async function slowAutoLoad(index) {
                    if (index === thumbnail.length) return;
                    const root = thumbnail[index];
                    imgLoad(root, index, "slow");
                };

                let observer;
                function observeLoad() { // mode 3 (觀察觸發)
                    loadFailedClick();
                    return new IntersectionObserver(observed => {
                        observed.forEach(entry => {
                            if (entry.isIntersecting) {
                                const root = entry.target;
                                observer.unobserve(root);
                                imgLoad(root, root.dataset.index);
                            }
                        });
                    }, { threshold: 0.4 });
                };

                /* 模式選擇 */
                switch (mode) {
                    case 2:
                        slowAutoLoad(0);
                        break;

                    case 3:
                        observer?.disconnect();
                        observer = observeLoad();
                        thumbnail.forEach((root, index) => {
                            root.dataset.index = index;
                            observer.observe(root);
                        });
                        break;

                    default:
                        fastAutoLoad();
                }
            });
        }
    }
};

export default OriginalImageFactory;