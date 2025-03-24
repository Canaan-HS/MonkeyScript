// ==UserScript==
// @name         Pornhub 滑鼠隱藏
// @name:zh-TW   Pornhub 滑鼠隱藏
// @name:zh-CN   Pornhub 鼠标隐藏
// @name:en      Pornhub Mouse Hide
// @name:ja      Pornhub マウス非表示
// @name:ko      Pornhub 마우스 숨기기
// @version      0.0.7
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

// @run-at       document-StartTime

// @license      MIT
// @grant        none
// @namespace    https://greasyfork.org/users/989635
// ==/UserScript==
(function(){(new class{constructor(){this.StyalRules=null;this.ListenerRecord=new Map;this.display=async(a,b)=>{requestAnimationFrame(()=>{this.StyalRules[0].style.setProperty("cursor",a,"important");this.StyalRules[1].style.setProperty("display",b,"important")})};this.Device={iW:()=>window.innerWidth,Width:()=>window.innerWidth,Height:()=>window.innerHeight,Agen:()=>navigator.userAgent,_Type:void 0,Type:function(){return this._Type=this._Type?this._Type:this._Type=/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(this.Agen)||768>this.iW?"Mobile":"Desktop"}};this.throttle=(a,b)=>{let d=0;return(...c)=>{const f=Date.now();f-d>=b&&(d=f,a(...c))}};this.Runtime=(a=null)=>a?`${((performance.now()-a)/1E3).toFixed(3)}s`:performance.now()}async AddListener(a,b,d,c={}){const {mark:f,...l}=c;c=f??a;const e=this.ListenerRecord.get(c);e?.has(b)||(a.addEventListener(b,d,l),e||this.ListenerRecord.set(c,new Map),this.ListenerRecord.get(c).set(b,d))}async RemovListener(a,b){const d=this.ListenerRecord.get(a)?.get(b);d&&(a.removeEventListener(b,d),this.ListenerRecord.get(a).delete(b))}async WaitMap(a,b,d,{object:c=document,throttle:f=0}={}){let l,e;const g=new MutationObserver(this.throttle(()=>{e=a.map(h=>document.querySelector(h));e.every(h=>null!==h&&"undefined"!==typeof h)&&(g.disconnect(),clearTimeout(l),d(e))},f));g.observe(c,{childList:!0,subtree:!0});l=setTimeout(()=>{g.disconnect();d(e)},1E3*b)}async AddStyle(a,b="New-Style",d=!0){let c=document.getElementById(b);if(!c)c=document.createElement("style"),c.id=b,document.head.appendChild(c);else if(!d)return;c.textContent+=a}async Injection(){const a=this,b=a.Runtime(),d=a.Device.Type();let c,f;a.WaitMap(["Desktop"==d?".video-wrapper div":"Mobile"==d?".mgp_videoWrapper":".video-wrapper div","video.mgp_videoElement","div[class*='mgp_progress']"],8,l=>{const [e,g,h]=l;if(e&&g&&h)if("Desktop"==d){a.AddStyle("body {cursor: default;}.Hidden {display: block;}","Mouse-Hide");a.StyalRules=document.getElementById("Mouse-Hide").sheet.cssRules;h.parentNode.classList.add("Hidden");a.AddListener(e,"pointerleave",()=>{a.display("default","block");clearTimeout(c);f=!1},{passive:!0});async function k(){f=!0;clearTimeout(c);a.display("default","block");c=setTimeout(()=>{a.display("none","none")},2100)}a.AddListener(e,"pointermove",a.throttle(()=>k(),200),{passive:!0});a.AddListener(e,"pointerdown",()=>{f&&k()},{passive:!0});a.AddListener(document.body,"keydown",a.throttle(()=>{f&&k()},1200),{passive:!0});console.log("\u001b[1m\u001b[32m%s\u001b[0m",`Hidden Injection Success: ${a.Runtime(b)}`)}else if("Mobile"==d){let k,p,m,q=g.playbackRate;a.AddListener(e,"touchstart",n=>{k=.2*a.Device.Width();p=n.touches[0].clientX},{passive:!0});a.AddListener(e,"touchmove",a.throttle(n=>{requestAnimationFrame(()=>{m=n.touches[0].clientX-p;if(m>k){const r=(q+(m-k)/3*.3).toPrecision(2);g.playbackRate=Math.min(r,16)}})},200),{passive:!0});a.AddListener(e,"touchend",()=>{g.playbackRate=q},{passive:!0});console.log("\u001b[1m\u001b[32m%s\u001b[0m",`Accelerate Injection Success: ${a.Runtime(b)}`)}else console.log("\u001b[1m\u001b[31m%s\u001b[0m",`Unsupported platform: ${a.Runtime(b)}`);else console.log("\u001b[1m\u001b[31m%s\u001b[0m",`Injection Failed: ${this.Runtime(b)}`),console.table({"Failed Data":{Target:e,Video:g,Bar:h}})},{throttle:200})}}).Injection()})();