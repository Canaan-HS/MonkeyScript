// ==UserScript==
// @name         Pornhub 滑鼠隱藏
// @name:zh-TW   Pornhub 滑鼠隱藏
// @name:zh-CN   Pornhub 鼠标隐藏
// @name:en      Pornhub Mouse Hide
// @name:ja      Pornhub マウス非表示
// @name:ko      Pornhub 마우스 숨기기
// @version      0.0.8
// @author       Canaan HS

// @description         電腦端滑鼠於影片區塊上停留一段時間，會隱藏滑鼠遊標和進度條，滑鼠再次移動時將重新顯示，手機端在影片區塊向右滑，會觸發影片加速，滑越多加越多最高16倍，放開後恢復正常速度。
// @description:zh-TW   電腦端滑鼠於影片區塊上停留一段時間，會隱藏滑鼠遊標和進度條，滑鼠再次移動時將重新顯示，手機端在影片區塊向右滑，會觸發影片加速，滑越多加越多最高16倍，放開後恢復正常速度。
// @description:zh-CN   电脑端在观看视频时，鼠标停留在视频区域一段时间后，鼠标指针和进度条会被隐藏。当鼠标再次移动时，它们将重新显示。手机端观看视频时，在视频区域向右滑动手指会触发视频加速，滑动越多，加速效果越明显，最高可达16倍。释放手指后，视频将恢复正常速度。
// @description:en      On desktop, when the mouse hovers over the video for a while, the mouse cursor and progress bar will disappear. They will reappear when the mouse moves again. On mobile, swiping right in the video area triggers video acceleration, with more swipes resulting in faster acceleration, up to 16 times. Releasing the finger restores normal playback speed.
// @description:ja      デスクトップでは、マウスが動畫上にしばらく停止すると、マウスカーソルと進行バーが非表示になります。マウスが再度移動すると再表示されます。モバイル端末では、動畫エリアで右にスワイプすると、動畫の加速がトリガーされます。より多くスワイプすると、最大16倍までの加速が得られます。指を離すと、通常の再生速度に戻ります。
// @description:ko      데스크톱에서 비디오를 시청할 때 마우스가 비디오 위에 일정 시간 머물면 마우스 커서와 진행 막대가 숨겨집니다. 마우스가 다시 움직일 때 다시 나타납니다. 휴대폰에서 비디오 영역에서 오른쪽으로 스와이프하면 비디오가 가속됩니다. 스와이프할수록 더 빠른 가속이 발생하며 최대 16 배까지 가능합니다. 손가락을 놓으면 일반 재생 속도로 돌아갑니다.

// @match        *://*.pornhub.com/view_video.php?viewkey=*
// @match        *://*.pornhubpremium.com/view_video.php?viewkey=*
// @icon         https://ei.phncdn.com/www-static/favicon.ico

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635

// @grant        none
// @run-at       document-start
// ==/UserScript==

(new class {
    constructor() {
        this.StyalRules = null; this.display = async (a, c) => { requestAnimationFrame(() => { this.StyalRules[0].style.setProperty("cursor", a, "important"); this.StyalRules[1].style.setProperty("display", c, "important") }) }; this.Device = {
            iW: () => window.innerWidth, _Cache: void 0, get Platform() {
                this._Cache || (void 0 !== navigator.userAgentData?.mobile ? this._Cache = navigator.userAgentData.mobile ? "Mobile" : "Desktop" : window.matchMedia?.("(max-width: 767px), (pointer: coarse)")?.matches ? this._Cache = "Mobile" : /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ?
                    this._Cache = "Mobile" : this._Cache = "Desktop"); return this._Cache
            }
        }; this.throttle = (a, c) => { let e = 0; return (...b) => { const f = Date.now(); f - e >= c && (e = f, a(...b)) } }; this.Runtime = (a = null) => a ? `${((performance.now() - a) / 1E3).toFixed(3)}s` : performance.now()
    } async WaitMap(a, c, e, { object: b = document, throttle: f = 0 } = {}) {
        let l, d; const g = new MutationObserver(this.throttle(() => { d = a.map(h => document.querySelector(h)); d.every(h => null !== h && "undefined" !== typeof h) && (g.disconnect(), clearTimeout(l), e(d)) }, f)); g.observe(b, {
            childList: !0,
            subtree: !0
        }); l = setTimeout(() => { g.disconnect(); e(d) }, 1E3 * c)
    } async AddStyle(a, c = "New-Style", e = !0) { let b = document.getElementById(c); if (!b) b = document.createElement("style"), b.id = c, document.head.appendChild(b); else if (!e) return; b.textContent += a } async Injection() {
        const a = this, c = a.Runtime(), e = a.Device.Platform; let b, f; a.WaitMap(["Desktop" === e ? ".video-wrapper div" : "Mobile" === e ? ".mgp_videoWrapper" : ".video-wrapper div", "video.mgp_videoElement", "div[class*='mgp_progress']"], 8, l => {
            const [d, g, h] = l; if (d && g && h) if ("Desktop" ===
                e) {
                    a.AddStyle("body {cursor: default;}.Hidden {display: block;}", "Mouse-Hide"); a.StyalRules = document.getElementById("Mouse-Hide").sheet.cssRules; h.parentNode.classList.add("Hidden"); async function k() { f = !0; clearTimeout(b); a.display("default", "block"); b = setTimeout(() => { a.display("none", "none") }, 2100) } d.addEventListener("pointerleave", () => { a.display("default", "block"); clearTimeout(b); f = !1 }, { passive: !0 }); d.addEventListener("pointermove", a.throttle(() => k(), 200), { passive: !0 }); d.addEventListener("pointerdown",
                        () => { f && k() }, { passive: !0 }); document.addEventListener("keydown", a.throttle(() => { console.log("keydown"); f && k() }, 1200)); console.log("\u001b[1m\u001b[32m%s\u001b[0m", `Hidden Injection Success: ${a.Runtime(c)}`)
            } else if ("Mobile" === e) {
                let k, p, m, q = g.playbackRate; d.addEventListener("touchstart", n => { k = .2 * a.Device.iW(); p = n.touches[0].clientX }, { passive: !0 }); d.addEventListener("touchmove", a.throttle(n => {
                    requestAnimationFrame(() => {
                        m = n.touches[0].clientX - p; if (m > k) {
                            const r = (q + (m - k) / 3 * .3).toPrecision(2); g.playbackRate =
                                Math.min(r, 16)
                        }
                    })
                }, 200), { passive: !0 }); d.addEventListener("touchend", () => { g.playbackRate = q }, { passive: !0 }); console.log("\u001b[1m\u001b[32m%s\u001b[0m", `Accelerate Injection Success: ${a.Runtime(c)}`)
            } else console.log("\u001b[1m\u001b[31m%s\u001b[0m", `Unsupported platform: ${a.Runtime(c)}`); else console.log("\u001b[1m\u001b[31m%s\u001b[0m", `Injection Failed: ${this.Runtime(c)}`), console.table({ "Failed Data": { Target: d, Video: g, Bar: h } })
        }, { throttle: 100 })
    }
}).Injection();