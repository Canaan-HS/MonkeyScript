// ==UserScript==
// @name         網頁播放器
// @version      2026.09.09
// @description  添加網頁播放器
// @author       Canaan HS
// @match        https://monsnode.com/*

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635
// @icon         https://www.google.com/s2/favicons?sz=64&domain=monsnode.com

// @resource     plyrStyle https://cdnjs.cloudflare.com/ajax/libs/plyr/3.8.4/plyr.min.css

// @require      https://cdnjs.cloudflare.com/ajax/libs/plyr/3.8.4/plyr.min.js
// @require      https://update.greasyfork.org/scripts/487608/1755350/SyntaxLite_min.js

// @run-at       document-body
// @grant        GM_getResourceText
// ==/UserScript==

Lib.addStyle(`
#scroll { display: grid; gap: 5px; padding: 5px; grid-template-columns: repeat(5, 1fr); align-items: start; }
.listn { border-radius: 12px; overflow: hidden; background: #14161a; box-shadow: 0 2px 6px rgba(0,0,0,.25); transition: box-shadow .3s ease; }
.video-container { width: 100%; position: relative; display: inline-block; overflow: hidden; border-radius: 12px; }
.video-container img { width: 100%; display: block; transition: transform 0.4s ease; }
.play-btn { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2; cursor: pointer; width: 48px; height: 48px; border-radius: 50%; background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ffffff"><path d="M8 5v14l11-7z"/></svg>') center center / 18px no-repeat, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease; }
.play-btn:hover { transform: translate(-50%, -50%) scale(1.12); box-shadow: 0 12px 32px rgba(79, 172, 254, 0.65); }
.source-button svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
@property --border-angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
.loading-border::before { content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 2px; background: conic-gradient(from var(--border-angle), #00f2fe, #4facfe, #0072ff, transparent 45%, #00f2fe); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; animation: border-spin 1.6s linear infinite; z-index: 3; pointer-events: none; }
@keyframes border-spin { to { --border-angle: 360deg; } }
.error-border::after { content: ""; position: absolute; inset: 0; border-radius: inherit; border: 1.5px solid rgba(255, 69, 58, .55); z-index: 3; pointer-events: none; }
${GM_getResourceText("plyrStyle")}
`);

Lib.waitEl("#scroll", null, { raf: true, timeout: 10 }).then(scroll => {
    Lib.createElement(document.head, "meta", {
        attr: { name: "referrer", content: "no-referrer" }
    });

    const pageRecord = new Set();
    const fragment = Lib.createFragment;
    const loadPage = async (btn) => {
        const url = btn.href;
        if (pageRecord.has(url)) return;

        const response = await fetch(url);
        if (!response.ok) return loadPage(btn);

        const htmlText = await response.text();
        const html = Lib.domParse(htmlText);

        // 替換成新的 more 按鈕
        const oldContainer = btn.closest("div");
        const newContainer = html.$q(".btn").closest("div");
        oldContainer.replaceWith(newContainer);

        for (const item of html.$qa("#scroll .listn")) {
            fragment.appendChild(item);
        };

        // 添加新元素到當前列表
        scroll.appendChild(fragment);

        pageRecord.add(url);
        history.pushState(null, null, url);
    };

    // 監聽影片是否可見
    const activePlayers = new Map();
    const visibilityObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) {
                activePlayers.get(entry.target)?.pause();
            }
        }
    }, { threshold: 0 });
    const loadVideo = async (a) => {
        const url = a.href;

        const response = await fetch(url);
        if (!response.ok) return loadVideo(a);

        const htmlText = await response.text();
        const html = Lib.domParse(htmlText);

        const script = html.$q("script:not([type])").$text();
        const base64Str = script.match(/atob\(['"]([^'"]+)['"]\)/)[1];

        const videoUrl = atob(base64Str);
        const container = a.parentElement;

        // 獲取預設高度
        const imgHeight = a.$q("img").getBoundingClientRect().height;
        // 獲取原始副本
        let containerCopy = container.$copy();

        // 創建影片元素
        const video = Lib.createElement("video", {
            src: videoUrl,
            style: `width: 100%; height: 100%; min-height: ${imgHeight}px; object-fit: contain;`,
            controls: true,
            playsinline: true,
            on: {
                canplay: () => {
                    video.offAll();
                    containerCopy = null;
                    container.$delClass("loading-border");
                },
                error: () => {
                    video.offAll();
                    activePlayers.delete(container);
                    visibilityObserver.unobserve(container);

                    containerCopy.$addClass("error-border");
                    Lib.$Q(container, ".play-btn")?.remove();
                    Lib.$Q(container, ".video-container")?.remove();
                    container.replaceWith(containerCopy);
                }
            }
        });

        container.replaceChildren(video); // 替換內容
        container.$addClass("loading-border");

        const player = new Plyr(video, {
            autoplay: true,
            hideControls: false,
            loop: { active: true },
            controls: ["play-large", "play", "progress", "current-time", "duration", "mute", "volume", "fullscreen"]
        });

        activePlayers.set(container, player);   // 註冊追蹤
        visibilityObserver.observe(container);  // 開始觀察可視狀態

        // 來源跳轉按鈕
        Lib.createElement(player.elements.buttons.fullscreen, "button", {
            type: "button",
            class: "plyr__controls__item plyr__control source-button",
            innerHTML: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                        d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                    <path
                        d="M14 3h7v7M21 3L11 13"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            `,
            on: {
                click: () => { open(url) }
            }
        }, "beforebegin");

        // 自訂控制顯示
        let timer = null;
        let displayed = true;
        const plyrBtn = player.elements.buttons.play[0];

        Lib.onEvent(container, "mousemove", () => {
            clearTimeout(timer);

            if (!displayed) {
                displayed = true;
                player.toggleControls(true);
                plyrBtn.style.display = "";
            }

            timer = setTimeout(() => {
                displayed = false;
                player.toggleControls(false);
                plyrBtn.style.display = "none";
            }, 2e3);
        });
    };

    const addFeatures = () => {
        for (const a of scroll.$qa(".listn:has(iframe)")) {
            a.remove();
        };

        for (const a of scroll.$qa(".listn > a:not([btn-exists])")) {
            a.$sAttr("btn-exists", true);
            a.$addClass("video-container");
            Lib.createElement(a, "div", { class: "play-btn" }, "afterbegin");
        };

        const moreBtn = Lib.$q(".btn:not([viewing])");
        if (moreBtn) {
            moreBtn.$sAttr("viewing", true);

            const observer = new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting) {
                    observer.disconnect();
                    loadPage(moreBtn);
                }
            }, {
                rootMargin: "0px 0px 100% 0px"
            });

            observer.observe(moreBtn);
        }
    };

    addFeatures(); // 初始化
    Lib.observer(scroll, addFeatures, { // 後續監聽
        debounce: 300,
        subtree: false,
        attributes: false
    });

    Lib.onEvent(scroll, "click", event => {
        const element = event.target;
        const a = element.closest(".video-container");

        if (a) {
            event.preventDefault();
            a.$q(".play-btn").remove();
            loadVideo(a);
        }

        for (const [container, player] of activePlayers) {
            if (!player.paused && !container.contains(element)) player.pause();
        }
    });
});