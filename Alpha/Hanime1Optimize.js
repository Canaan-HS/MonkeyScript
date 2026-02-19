// ==UserScript==
// @name         Hanime1 簡單優化
// @name:zh-TW   Hanime1 簡單優化
// @name:zh-CN   Hanime1 简单优化
// @version      0.0.1-Bate
// @author       Canaan HS
// @description  Hanime1 電腦版觀影體驗優化，移除礙眼的中心圖示，媒體暫停時也可自動隱藏控製器和遊標，手動觸發建立快照預覽圖 (實驗性)，懸浮於進度條上方顯示畫面預覽。
// @description:zh-TW Hanime1 電腦版觀影體驗優化，移除礙眼的中心圖示，媒體暫停時也可自動隱藏控製器和遊標，手動觸發建立快照預覽圖 (實驗性)，懸浮於進度條上方顯示畫面預覽。
// @description:zh-CN Hanime1 电脑版观影体验优化，移除碍眼的中心图标，媒体暂停时也可自动隐藏控制器和光标，手动触发创建快照预览图（实验性），悬浮于进度条上方显示画面预览。

// @noframes
// @match        *://hanime1.me/watch?v=*

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635
// @icon         data:image/png;base64,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

// @require      https://update.greasyfork.org/scripts/487608/1755350/SyntaxLite_min.js

// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// ==/UserScript==

(async () => {
    if (Lib.platform === "Mobile") return;

    if (!Lib.cookie().includes("quality")) {
        Lib.cookie(`quality=1080; domain=${Lib.$domain}; path=/; max-age=${3.1536e7};`);
    };

    Lib.addStyle(`
        body {
            cursor: default;
        }
        .snapshot {
            top: -170px;
            left: 0;
            width: 256px;
            height: 144px;
            position: absolute;
        }
        .plyr--video.custom--hide-controls .plyr__controls {
            opacity: 0 !important;
            pointer-events: none !important;
            transform: translateY(100%) !important;
        }
        .plyr--full-ui.plyr--video .plyr__control--overlaid {
            display: none !important;
        }
    `, "Hanime1-Optimize");

    Lib.waitEl([
        "#player", // 影片元素
        ".plyr--video", // 影片區塊
        ".plyr__tooltip", // 進度提示器
        "input[data-plyr='seek']" // 進度條
    ], null).then(([video, container, tip, progress]) => {

        async function autoHighestQuality() {
            const source = video.$qa("source");
            if (source?.length > 1) {
                // 直接切換到最高畫質的源
                const videoSrc = video.src;
                const sourceSrc = source.reduce((a, b) => b.size > a.size ? b : a).src;
                if (sourceSrc && sourceSrc !== videoSrc) setTimeout(() => { video.src = sourceSrc }, 500);
            }
        };

        async function optimizeVideoControl() {
            let onTarget, mouseHide;

            const styalRule = Lib.$q("#Hanime1-Optimize").sheet.cssRules;
            const _switch = async (params) => {
                styalRule[0].style.setProperty("cursor", params, "important");
            };

            async function _trigger() {
                /* 移動時 */
                _switch("default"); // 恢復滑鼠
                clearTimeout(mouseHide); // 清除計時器
                container.$delClass("custom--hide-controls"); // 清除隱藏樣式

                /* 停止一段時間後 */
                mouseHide = setTimeout(() => {
                    if (!onTarget) return;
                    _switch("none"); // 隱藏滑鼠
                    container.$addClass("custom--hide-controls"); // 恢復隱藏樣式
                }, 1300);
            };


            // 開始播放時才觸發
            Lib.onEvent(video, "play", () => {

                // 目標上移動
                Lib.onEvent(container, "pointermove", Lib.$throttle(() => {
                    onTarget = true;
                    _trigger();
                }, 100), { passive: true });

                // 目標上點擊
                Lib.onEvent(container, "pointerdown", () => {
                    onTarget && _trigger();
                }, { passive: true });

                // 鍵盤按下
                Lib.onEvent(document, "keydown", Lib.$throttle(() => {
                    onTarget && _trigger();
                }, 1e3), { capture: true, passive: true });

                // 離開目標
                Lib.onEvent(container, "pointerleave", () => {
                    onTarget = false;
                    clearTimeout(mouseHide);
                }, { passive: true });

            }, { once: true });
        };

        async function getPreviewSnapshot() {
            const Menu = GM_registerMenuCommand("⏳ 加載預覽圖 (實驗性)", () => {
                GM_unregisterMenuCommand(Menu); // 觸發後刪除菜單

                function timeStringToSeconds(timeString) {
                    const parts = timeString.split(':');

                    if (parts.length === 3) {
                        const hours = parseInt(parts[0], 10);
                        const minutes = parseInt(parts[1], 10);
                        const seconds = parseInt(parts[2], 10);
                        return hours * 3600 + minutes * 60 + seconds;
                    } else if (parts.length === 2) {
                        const minutes = parseInt(parts[0], 10);
                        const seconds = parseInt(parts[1], 10);
                        return minutes * 60 + seconds;
                    } else if (parts.length === 1) {
                        return parseInt(parts[0], 10);
                    }

                    return 0; // 如果格式不符合，則返回 0
                };

                // 保存所有的快照
                const snapshotObject = {};

                // 設定快照的尺寸
                const snapshotHeight = 144;
                const snapshotWidth = 256;

                // 創建畫布並獲取上下文
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                // 取得影片的總長度
                const totalTime = parseFloat(progress.getAttribute("aria-valuemax"));

                // 抓取處理
                const captureSnapshot = () => {
                    const currentTime = video.currentTime;

                    if (currentTime >= totalTime) {
                        video.currentTime = 0;
                        return;
                    };

                    canvas.width = snapshotWidth;
                    canvas.height = snapshotHeight;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    canvas.toBlob(blob => {
                        if (blob) {
                            const webpURL = URL.createObjectURL(blob);
                            if (webpURL) {
                                snapshotObject[currentTime] = webpURL;
                                video.currentTime = currentTime + 1; // 時間跳轉

                                Lib.onEvent(video, "seeked", () => {
                                    requestAnimationFrame(captureSnapshot); // 繼續擷取
                                }, { once: true });

                                return;
                            }
                        }

                        requestAnimationFrame(captureSnapshot);
                    }, "image/webp");
                };

                // 開始擷取
                requestAnimationFrame(captureSnapshot);

                //! 第二個 pointermove 監聽器
                // 動態修正, 根據進度條位置顯示快照
                Lib.onEvent(progress, "pointermove", (event) => {
                    const mouseX = event.offsetX;
                    const left = mouseX - 128; // 減圖片一半寬度, 使其居中
                    styalRule[1].style.left = `${left}px`;
                }, { passive: true });

                // 滑鼠離開時移除圖片
                Lib.onEvent(progress, "mouseleave", () => {
                    Lib.$q(".snapshot")?.remove();  // 移除舊圖片
                }, { capture: true, passive: true });

                // 快照顯示
                const parent = tip.parentNode;
                Lib.$observer(tip, () => {
                    Lib.$q(".snapshot")?.remove();  // 移除舊圖片

                    // 獲取指示器的時間, 並獲取對應的快照
                    const index = timeStringToSeconds(tip.textContent);
                    const selectedSnapshot = snapshotObject[index];

                    if (!selectedSnapshot) return;

                    const img = document.createElement("img");
                    img.className = "Snapshot";
                    img.src = selectedSnapshot;  // 設置圖片源

                    parent.insertBefore( // 插入圖片
                        img,
                        progress
                    );
                });
            });
        };

        autoHighestQuality();
        optimizeVideoControl();
        // getPreviewSnapshot();

    });

})();