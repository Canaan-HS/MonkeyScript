// ==UserScript==
// @name         Media Volume Booster
// @name:zh-TW   媒體音量增強器
// @name:zh-CN   媒体音量增强器
// @name:en      Media Volume Booster
// @version      0.0.41
// @author       Canaan HS
// @description         調整媒體音量與濾波器，增強倍數最高 20 倍，設置可記住並自動應用。部分網站可能無效、無聲音或無法播放，可選擇禁用。
// @description:zh-TW   調整媒體音量與濾波器，增強倍數最高 20 倍，設置可記住並自動應用。部分網站可能無效、無聲音或無法播放，可選擇禁用。
// @description:zh-CN   调整媒体音量与滤波器，增强倍数最高 20 倍，设置可记住并自动应用。部分网站可能无效、无声音或无法播放，可选择禁用。
// @description:en      Adjust media volume and filters with enhancement factor up to 20x. Settings are saved and auto-applied. May not work on some sites (causing no sound or playback issues). Can be disabled if needed.

// @noframes
// @match        *://*/*
// @icon         https://cdn-icons-png.flaticon.com/512/16108/16108408.png

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635

// @run-at       document-body
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_getResourceURL
// @grant        GM_registerMenuCommand
// @grant        GM_addValueChangeListener
// @resource     Img https://cdn-icons-png.flaticon.com/512/11243/11243783.png
// @require      https://update.greasyfork.org/scripts/487608/1580134/SyntaxLite_min.js
// ==/UserScript==
(async () => {
    async function y() {
        function h() { u.classList.replace("open", "close"); v.classList.replace("open", "close"); setTimeout(() => { g.remove() }, 800) } if (!Syn.$q("#Booster_Modal_Background")) {
            var g = Syn.createElement("div", { id: "Booster_Modal_Background" }); g.attachShadow({ mode: "open" }).$iHtml(`
            <style id="Booster-Menu">
                :host {
                    --primary-color: #3a7bfd;
                    --secondary-color: #00d4ff;
                    --text-color: #ffffff;
                    --slider-track: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
                    --background-dark: #1a1f2c;
                    --background-panel: #252b3a;
                    --highlight-color: #00e5ff;
                    --border-radius: 12px;
                }
                Booster_Modal_Background {
                    top: 0;
                    left: 0;
                    opacity: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    z-index: 9999;
                    overflow: auto;
                    position: fixed;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(5px);
                    -webkit-backdrop-filter: blur(5px);
                    transition: opacity 0.4s ease;
                    background-color: rgba(0, 0, 0, 0.4);
                }
                Booster_Modal_Background.open {
                    animation: fadeIn 0.4s ease forwards;
                }
                Booster_Modal_Background.close {
                    animation: fadeOut 0.4s ease forwards;
                }
                .Booster-Modal-Content {
                    min-width: 420px;
                    max-width: 460px;
                    width: 100%;
                    padding: 20px;
                    padding-inline-end: 10px;
                    overflow-y: auto;
                    scrollbar-gutter: stable;
                    text-align: center;
                    border-radius: var(--border-radius);
                    background-color: var(--background-dark);
                    border: 1px solid rgba(78, 164, 255, 0.3);
                    box-shadow:
                        inset -6px 0 10px -8px rgba(0, 0, 0, 0.5),
                        0 10px 30px rgba(0, 0, 0, 0.5),
                        0 0 15px rgba(0, 212, 255, 0.2);
                    color: var(--text-color);
                    opacity: 0;
                    max-height: 85vh;
                    transform: scale(0.9);
                    transition: all 0.5s ease;
                }
                .Booster-Modal-Content.open {
                    animation: scaleIn 0.5s ease forwards;
                }
                .Booster-Modal-Content.close {
                    animation: shrinkFadeOut 0.8s ease forwards;
                }
                .Booster-Modal-Content::-webkit-scrollbar {
                    width: 8px;
                }
                .Booster-Modal-Content::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                }
                .Booster-Modal-Content::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.1);
                }
                .Booster-Title {
                    margin-top: 0;
                    color: var(--secondary-color);
                    font-size: 22px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    margin-bottom: 20px;
                    text-shadow: 0 0 10px rgba(0, 212, 255, 0.4);
                    opacity: 0;
                    transform: translateY(-10px);
                    animation: slideDown 0.4s ease 0.3s forwards;
                }
                .Booster-Multiplier {
                    margin: 1.5rem 0;
                    font-size: 22px;
                    font-weight: 500;
                    opacity: 0;
                    animation: fadeIn 0.5s ease 0.4s forwards;
                }
                .Booster-Multiplier img {
                    width: 24px;
                    margin-right: 8px;
                    vertical-align: middle;
                }
                .Booster-Multiplier span {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                #Booster-CurrentValue {
                    color: var(--highlight-color);
                    font-weight: 700;
                    margin: 0 5px;
                    font-size: 26px;
                }
                .Booster-Slider {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 90%;
                    height: 6px;
                    cursor: pointer;
                    margin: 2rem 0 3.5rem 0;
                    background: var(--slider-track);
                    border-radius: 3px;
                    outline: none;
                    opacity: 0;
                    animation: progressIn 0.8s ease 0.5s forwards;
                }
                .Booster-Slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--secondary-color);
                    cursor: pointer;
                    box-shadow: 0 0 8px rgba(0, 212, 255, 0.6);
                }
                .Booster-Slider::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--secondary-color);
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 0 8px rgba(0, 212, 255, 0.6);
                }
                .Booster-Slider::-moz-range-progress {
                    background: var(--slider-track);
                    border-radius: 3px;
                    height: 6px;
                }
                .Booster-Buttons {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 20px;
                    gap: 10px;
                    opacity: 0;
                    animation: fadeIn 0.5s ease 0.7s forwards;
                }
                .Booster-Modal-Button {
                    color: var(--text-color);
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: 500;
                    padding: 8px 16px;
                    border-radius: 6px;
                    background-color: rgba(58, 123, 253, 0.2);
                    border: 1px solid rgba(78, 164, 255, 0.3);
                    transition: all 0.2s ease;
                    outline: none;
                }
                .Booster-Modal-Button:hover {
                    background-color: rgba(58, 123, 253, 0.4);
                    box-shadow: 0 0 10px rgba(0, 212, 255, 0.4);
                    transform: translateY(-2px);
                }
                #Booster-Sound-Save {
                    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
                    border: none;
                    position: relative;
                    overflow: hidden;
                }
                #Booster-Sound-Save:hover {
                    box-shadow: 0 0 15px rgba(0, 212, 255, 0.6);
                }
                #Booster-Sound-Save:after {
                    content: "";
                    position: absolute;
                    top: -50%;
                    left: -60%;
                    width: 20%;
                    height: 200%;
                    opacity: 0;
                    transform: rotate(30deg);
                    background: rgba(255, 255, 255, 0.13);
                    background: linear-gradient(
                        to right,
                        rgba(255, 255, 255, 0.13) 0%,
                        rgba(255, 255, 255, 0.13) 77%,
                        rgba(255, 255, 255, 0.5) 92%,
                        rgba(255, 255, 255, 0.0) 100%
                    );
                }
                #Booster-Sound-Save:hover:after {
                    opacity: 1;
                    left: 130%;
                    transition: left 0.7s ease, opacity 0.5s ease;
                }
                .Booster-Accordion {
                    background-color: var(--background-panel);
                    color: var(--text-color);
                    cursor: pointer;
                    padding: 12px 15px;
                    width: 100%;
                    text-align: left;
                    border: none;
                    outline: none;
                    transition: 0.3s;
                    border-radius: 8px;
                    margin-bottom: 8px;
                    font-weight: 500;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    opacity: 0;
                    transform: translateY(10px);
                }
                .Booster-Accordion:nth-of-type(1) {
                    animation: slideUp 0.4s ease 0.5s forwards;
                }
                .Booster-Accordion:nth-of-type(2) {
                    animation: slideUp 0.4s ease 0.6s forwards;
                }
                .Booster-Accordion:nth-of-type(3) {
                    animation: slideUp 0.4s ease 0.7s forwards;
                }
                .Booster-Accordion:nth-of-type(4) {
                    animation: slideUp 0.4s ease 0.8s forwards;
                }
                .Booster-Accordion:after {
                    content: '+';
                    color: var(--secondary-color);
                    font-weight: bold;
                    float: right;
                    margin-left: 5px;
                }
                .Booster-Accordion.active {
                    border-bottom-left-radius: 0;
                    border-bottom-right-radius: 0;
                    margin-bottom: 0;
                }
                .Booster-Accordion.active:after {
                    content: "-";
                }
                .Booster-Panel {
                    max-height: 0;
                    overflow: hidden;
                    padding: 0 15px;
                    margin-top: 0;
                    margin-bottom: 8px;
                    transition: max-height 0.3s ease-out;
                    background-color: var(--background-panel);
                    border-radius: 0 0 8px 8px;
                }
                .Booster-Panel.active {
                    margin-bottom: 15px;
                    padding: 10px 15px 15px;
                }
                .Booster-Control-Group {
                    margin-bottom: 15px;
                }
                .Booster-Control-Label {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.8);
                }
                .Booster-Value {
                    color: var(--highlight-color);
                    font-weight: 600;
                }
                .Booster-Mini-Slider {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 100%;
                    height: 4px;
                    background: var(--slider-track);
                    border-radius: 2px;
                    outline: none;
                }
                .Booster-Mini-Slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: var(--secondary-color);
                    cursor: pointer;
                }
                .Booster-Mini-Slider::-moz-range-thumb {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: var(--secondary-color);
                    cursor: pointer;
                    border: none;
                }
                .Booster-Mini-Slider::-moz-range-progress {
                    background: var(--slider-track);
                    border-radius: 2px;
                    height: 4px;
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                @keyframes fadeOut {
                    from {
                        opacity: 1;
                    }
                    to {
                        opacity: 0;
                        pointer-events: none;
                    }
                }
                @keyframes scaleIn {
                    from {
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                @keyframes shrinkFadeOut {
                    from {
                        transform: scale(1);
                        opacity: 1;
                    }
                    to {
                        transform: scale(0.5);
                        opacity: 0;
                    }
                }
                @keyframes slideUp {
                    from {
                        transform: translateY(10px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes slideDown {
                    from {
                        transform: translateY(-10px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes progressIn {
                    from {
                        width: 0%;
                        opacity: 0;
                    }
                    to {
                        width: 90%;
                        opacity: 1;
                    }
                }
            </style>

            <Booster_Modal_Background id="Booster-Modal-Menu">
                <div class="Booster-Modal-Content">
                    <h2 class="Booster-Title">${c("\u97f3\u91cf\u589e\u5f37\u5668")}</h2>

                    <div class="Booster-Multiplier">
                        <span>
                            <img src="${GM_getResourceURL("Img")}">${c("\u589e\u5f37\u500d\u6578 ")}
                            <span id="Gain-Value" class="Booster-Value">${d.Gain}</span>${c(" \u500d")}
                        </span>
                        <input type="range" id="Gain" class="Booster-Slider" min="0" max="20.0" value="${d.Gain}" step="0.1">
                    </div>

                    <button class="Booster-Accordion">${c("\u4f4e\u983b\u8a2d\u5b9a")}</button>
                    <div class="Booster-Panel">
                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${c("\u589e\u76ca")}</span>
                                <span id="LowFilterGain-Value" class="Booster-Value">${d.LowFilterGain}</span>
                            </div>
                            <input type="range" id="LowFilterGain" class="Booster-Mini-Slider" min="-12" max="12" value="${d.LowFilterGain}" step="0.1">
                        </div>

                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${c("\u983b\u7387")}</span>
                                <span id="LowFilterFreq-Value" class="Booster-Value">${d.LowFilterFreq}</span>
                            </div>
                            <input type="range" id="LowFilterFreq" class="Booster-Mini-Slider" min="20" max="1000" value="${d.LowFilterFreq}" step="20">
                        </div>
                    </div>

                    <button class="Booster-Accordion">${c("\u4e2d\u983b\u8a2d\u5b9a")}</button>
                    <div class="Booster-Panel">
                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${c("\u589e\u76ca")}</span>
                                <span id="MidFilterGain-Value" class="Booster-Value">${d.MidFilterGain}</span>
                            </div>
                            <input type="range" id="MidFilterGain" class="Booster-Mini-Slider" min="-12" max="12" value="${d.MidFilterGain}" step="0.1">
                        </div>

                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${c("\u983b\u7387")}</span>
                                <span id="MidFilterFreq-Value" class="Booster-Value">${d.MidFilterFreq}</span>
                            </div>
                            <input type="range" id="MidFilterFreq" class="Booster-Mini-Slider" min="200" max="8000" value="${d.MidFilterFreq}" step="100">
                        </div>

                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${c("Q\u503c")}</span>
                                <span id="MidFilterQ-Value" class="Booster-Value">${d.MidFilterQ}</span>
                            </div>
                            <input type="range" id="MidFilterQ" class="Booster-Mini-Slider" min="0.5" max="5" value="${d.MidFilterQ}" step="0.1">
                        </div>
                    </div>

                    <button class="Booster-Accordion">${c("\u9ad8\u983b\u8a2d\u5b9a")}</button>
                    <div class="Booster-Panel">
                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${c("\u589e\u76ca")}</span>
                                <span id="HighFilterGain-Value" class="Booster-Value">${d.HighFilterGain}</span>
                            </div>
                            <input type="range" id="HighFilterGain" class="Booster-Mini-Slider" min="-12" max="12" value="${d.HighFilterGain}" step="0.1">
                        </div>

                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${c("\u983b\u7387")}</span>
                                <span id="HighFilterFreq-Value" class="Booster-Value">${d.HighFilterFreq}</span>
                            </div>
                            <input type="range" id="HighFilterFreq" class="Booster-Mini-Slider" min="2000" max="22000" value="${d.HighFilterFreq}" step="500">
                        </div>
                    </div>

                    <button class="Booster-Accordion">${c("\u52d5\u614b\u58d3\u7e2e")}</button>
                    <div class="Booster-Panel">
                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${c("\u58d3\u7e2e\u7387")}</span>
                                <span id="CompressorRatio-Value" class="Booster-Value">${d.CompressorRatio}</span>
                            </div>
                            <input type="range" id="CompressorRatio" class="Booster-Mini-Slider" min="1" max="30" value="${d.CompressorRatio}" step="0.1">
                        </div>

                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${c("\u904e\u6e21\u53cd\u61c9")}</span>
                                <span id="CompressorKnee-Value" class="Booster-Value">${d.CompressorKnee}</span>
                            </div>
                            <input type="range" id="CompressorKnee" class="Booster-Mini-Slider" min="0" max="40" value="${d.CompressorKnee}" step="1">
                        </div>

                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${c("\u95be\u503c")}</span>
                                <span id="CompressorThreshold-Value" class="Booster-Value">${d.CompressorThreshold}</span>
                            </div>
                            <input type="range" id="CompressorThreshold" class="Booster-Mini-Slider" min="-60" max="0" value="${d.CompressorThreshold}" step="1">
                        </div>

                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${c("\u8d77\u97f3\u901f\u5ea6")}</span>
                                <span id="CompressorAttack-Value" class="Booster-Value">${d.CompressorAttack}</span>
                            </div>
                            <input type="range" id="CompressorAttack" class="Booster-Mini-Slider" min="0.001" max="0.5" value="${d.CompressorAttack}" step="0.001">
                        </div>

                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${c("\u91cb\u653e\u901f\u5ea6")}</span>
                                <span id="CompressorRelease-Value" class="Booster-Value">${d.CompressorRelease}</span>
                            </div>
                            <input type="range" id="CompressorRelease" class="Booster-Mini-Slider" min="0.01" max="2" value="${d.CompressorRelease}" step="0.01">
                        </div>
                    </div>

                    <div class="Booster-Buttons">
                        <button class="Booster-Modal-Button" id="Booster-Menu-Close">${c("\u95dc\u9589")}</button>
                        <button class="Booster-Modal-Button" id="Booster-Sound-Save">${c("\u4fdd\u5b58")}</button>
                    </div>
                </div>
            </Booster_Modal_Background>
        `); document.body.appendChild(g); var n = g.shadowRoot, u = n.querySelector("Booster_Modal_Background"), v = n.querySelector(".Booster-Modal-Content"); u.classList.add("open"); v.classList.add("open"); var x = { ...Object.fromEntries([...n.querySelectorAll(".Booster-Value")].map(a => [a.id, a])) }; v.addEventListener("input", a => { var f = a.target; a = f.id; f = f.value; x[`${a}-Value`].textContent = f; C(a, f) }); u.addEventListener("click", a => {
                const f = a.target; a.stopPropagation(); f.classList.contains("Booster-Accordion") ? (f.classList.toggle("active"),
                    a = f.nextElementSibling, a.style.maxHeight ? (a.style.maxHeight = null, a.classList.remove("active")) : (a.style.maxHeight = a.scrollHeight + "px", a.classList.add("active"))) : "Booster-Sound-Save" === f.id ? (Syn.sV(Syn.domain, d), h()) : "Booster-Menu-Close" !== f.id && "Booster-Modal-Menu" !== f.id || h()
            })
        }
    } const { Transl: c } = function () {
        const h = Syn.TranslMatcher({
            Traditional: {}, Simplified: {
                "\ud83d\udcdc \u83dc\u55ae\u71b1\u9375": "\ud83d\udcdc \u83dc\u5355\u70ed\u952e", "\ud83d\udee0\ufe0f \u8abf\u6574\u83dc\u55ae": "\ud83d\udee0\ufe0f \u8c03\u6574\u83dc\u5355",
                "\u274c \u7981\u7528\u589e\u5e45": "\u274c \u7981\u7528\u589e\u5e45", "\u2705 \u555f\u7528\u589e\u5e45": "\u2705 \u542f\u7528\u589e\u5e45", "\u589e\u5f37\u932f\u8aa4": "\u589e\u5f3a\u9519\u8bef", "\u97f3\u91cf\u589e\u5f37\u5668": "\u97f3\u91cf\u589e\u5f3a\u5668", "\u589e\u5f37\u500d\u6578 ": "\u589e\u5f3a\u500d\u6570 ", " \u500d": " \u500d", "\u589e\u76ca": "\u589e\u76ca", "\u983b\u7387": "\u9891\u7387", "Q\u503c": "Q\u503c", "\u4f4e\u983b\u8a2d\u5b9a": "\u4f4e\u9891\u8bbe\u7f6e", "\u4e2d\u983b\u8a2d\u5b9a": "\u4e2d\u9891\u8bbe\u7f6e",
                "\u9ad8\u983b\u8a2d\u5b9a": "\u9ad8\u9891\u8bbe\u7f6e", "\u52d5\u614b\u58d3\u7e2e": "\u52a8\u6001\u538b\u7f29", "\u58d3\u7e2e\u7387": "\u538b\u7f29\u7387", "\u904e\u6e21\u53cd\u61c9": "\u8fc7\u6e21\u53cd\u5e94", "\u95be\u503c": "\u9608\u503c", "\u8d77\u97f3\u901f\u5ea6": "\u8d77\u97f3\u901f\u5ea6", "\u91cb\u653e\u901f\u5ea6": "\u91ca\u653e\u901f\u5ea6", "\u95dc\u9589": "\u5173\u95ed", "\u4fdd\u5b58": "\u4fdd\u5b58", "\u4e0d\u652f\u63f4\u97f3\u983b\u589e\u5f37\u7bc0\u9ede": "\u4e0d\u652f\u6301\u97f3\u9891\u589e\u5f3a\u8282\u70b9",
                "\u6dfb\u52a0\u589e\u5f37\u7bc0\u9ede\u6210\u529f": "\u6dfb\u52a0\u589e\u5f3a\u8282\u70b9\u6210\u529f", "\u71b1\u9375\u547c\u53eb\u8abf\u6574\u83dc\u55ae!!\n\n\u5feb\u6377\u7d44\u5408 : (Alt + B)": "\u70ed\u952e\u8c03\u7528\u8c03\u6574\u83dc\u5355!!\n\n\u5feb\u6377\u7ec4\u5408 : (Alt + B)"
            }, English: {
                "\ud83d\udcdc \u83dc\u55ae\u71b1\u9375": "\ud83d\udcdc Menu Hotkey", "\ud83d\udee0\ufe0f \u8abf\u6574\u83dc\u55ae": "\ud83d\udee0\ufe0f Adjustment Menu", "\u274c \u7981\u7528\u589e\u5e45": "\u274c Disable Amplification",
                "\u2705 \u555f\u7528\u589e\u5e45": "\u2705 Enable Amplification", "\u589e\u5f37\u932f\u8aa4": "Enhancement Error", "\u97f3\u91cf\u589e\u5f37\u5668": "Volume Booster", "\u589e\u5f37\u500d\u6578 ": "Enhancement Factor ", " \u500d": " times", "\u589e\u76ca": "Gain", "\u983b\u7387": "Frequency", "Q\u503c": "Q Factor", "\u4f4e\u983b\u8a2d\u5b9a": "Low Frequency Settings", "\u4e2d\u983b\u8a2d\u5b9a": "Mid Frequency Settings", "\u9ad8\u983b\u8a2d\u5b9a": "High Frequency Settings", "\u52d5\u614b\u58d3\u7e2e": "Dynamic Compression",
                "\u58d3\u7e2e\u7387": "Compression Ratio", "\u904e\u6e21\u53cd\u61c9": "Knee", "\u95be\u503c": "Threshold", "\u8d77\u97f3\u901f\u5ea6": "Attack Time", "\u91cb\u653e\u901f\u5ea6": "Release Time", "\u95dc\u9589": "Close", "\u4fdd\u5b58": "Save", "\u4e0d\u652f\u63f4\u97f3\u983b\u589e\u5f37\u7bc0\u9ede": "Audio Enhancement Node Not Supported", "\u6dfb\u52a0\u589e\u5f37\u7bc0\u9ede\u6210\u529f": "Enhancement Node Added Successfully", "\u71b1\u9375\u547c\u53eb\u8abf\u6574\u83dc\u55ae!!\n\n\u5feb\u6377\u7d44\u5408 : (Alt + B)": "Hotkey Menu Opened!!\n\nShortcut Combination: (Alt + B)"
            }
        });
        return { Transl: g => h[g] ?? g }
    }(), z = (() => { let h = new Set(Syn.gV("Banned", [])); var g = Syn.gV("BannedDomains_v2"); g && (g = Object.keys(g), Syn.sV("Banned", g), Syn.dV("BannedDomains_v2"), h = new Set(g)); let n = h.has(Syn.$domain); return { IsEnabled: u => u(!n), AddBanned: async () => { n ? h.delete(Syn.$domain) : h.add(Syn.$domain); Syn.sV("Banned", [...h]); location.reload() } } })(), { Start: D, SetControl: C, Parame: d } = function () {
        function h(q) {
            try {
                if (!A) throw Error(c("\u4e0d\u652f\u63f4\u97f3\u983b\u589e\u5f37\u7bc0\u9ede")); p ||= new A; "suspended" ===
                    p.state && p.resume(); const w = f.length; for (const e of q) {
                        e.crossOrigin || (e.crossOrigin = "anonymous"); if (e.mediaKeys || e.encrypted || 0 < e.textTracks.length) continue; const k = p.createMediaElementSource(e), b = p.createGain(), r = p.createBiquadFilter(), l = p.createBiquadFilter(), t = p.createBiquadFilter(), m = p.createDynamicsCompressor(); b.gain.value = a.Gain; r.type = "lowshelf"; r.gain.value = a.LowFilterGain; r.frequency.value = a.LowFilterFreq; l.type = "peaking"; l.Q.value = a.MidFilterQ; l.gain.value = a.MidFilterGain; l.frequency.value =
                            a.MidFilterFreq; t.type = "highshelf"; t.gain.value = a.HighFilterGain; t.frequency.value = a.HighFilterFreq; m.ratio.value = a.CompressorRatio; m.knee.value = a.CompressorKnee; m.threshold.value = a.CompressorThreshold; m.attack.value = a.CompressorAttack; m.release.value = a.CompressorRelease; k.connect(b).connect(r).connect(l).connect(t).connect(m).connect(p.destination); f.push({
                                Gain: b.gain, LowFilterGain: r.gain, LowFilterFreq: r.frequency, MidFilterQ: l.Q, MidFilterGain: l.gain, MidFilterFreq: l.frequency, HighFilterGain: t.gain,
                                HighFilterFreq: t.frequency, CompressorRatio: m.ratio, CompressorKnee: m.knee, CompressorThreshold: m.threshold, CompressorAttack: m.attack, CompressorRelease: m.release
                            }); B.set(e, !0)
                    } f.length > w && (Syn.Log(c("\u6dfb\u52a0\u589e\u5f37\u7bc0\u9ede\u6210\u529f"), { "Booster Media : ": q }, { collapsed: !1 }), g || (g = !0, E(), Syn.Menu({
                        [c("\ud83d\udcdc \u83dc\u55ae\u71b1\u9375")]: () => alert(c("\u71b1\u9375\u547c\u53eb\u8abf\u6574\u83dc\u55ae!!\n\n\u5feb\u6377\u7d44\u5408 : (Alt + B)")), [c("\ud83d\udee0\ufe0f \u8abf\u6574\u83dc\u55ae")]: () =>
                            y()
                    }, { index: 2 }), Syn.StoreListen([Syn.$domain], e => { e.far && e.key == Syn.$domain && Object.entries(e.nv).forEach(([k, b]) => { v.SetBooster(k, b) }) }))); setTimeout(() => { n.observe(document, u) }, 3E3); return { SetBooster: (e, k) => { a[e] = k; f.forEach(b => { b[e].value = k }) } }
            } catch (w) { Syn.Log(c("\u589e\u5f37\u932f\u8aa4"), w, { type: "error", collapsed: !1 }) }
        } let g = !1, n = null, u = null, v = null, x = !1; const a = {}, f = [], B = new Map; let p = null; const A = window.AudioContext || window.webkitAudioContext, E = async () => {
            Syn.onEvent(document, "keydown", q => {
                q.altKey &&
                "B" == q.key.toUpperCase() && y()
            }, { passive: !0, capture: !0, mark: "Volume-Booster-Hotkey" })
        }; return {
            Start: function () {
                z.IsEnabled(q => {
                    const w = async e => { Syn.Menu({ [e]: () => z.AddBanned() }) }; if (q) {
                        const e = Syn.Debounce(k => { const b = [], r = document.createTreeWalker(Syn.body, NodeFilter.SHOW_ELEMENT, { acceptNode: l => { const t = l.tagName; return "VIDEO" !== t && "AUDIO" !== t || B.has(l) ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT } }); for (; r.nextNode();)b.push(r.currentNode); 0 < b.length && k(b) }, 50); Syn.Observer(document, () => {
                            e(k => {
                                n.disconnect(); try {
                                    if (!x) {
                                        x = !0; let b = Syn.gV(Syn.$domain, {}); "number" === typeof b && (b = { Gain: b }); Object.assign(a, {
                                            Gain: b.Gain ?? 1, LowFilterGain: b.LowFilterGain ?? 1.2, LowFilterFreq: b.LowFilterFrequency ?? 200, MidFilterQ: b.MidFilterQ ?? 1, MidFilterGain: b.MidFilterGain ?? 1.6, MidFilterFreq: b.MidFilterFrequency ?? 2E3, HighFilterGain: b.HighFilterGain ?? 1.8, HighFilterFreq: b.HighFilterFreq ?? 1E4, CompressorRatio: b.CompressorRatio ?? 3, CompressorKnee: b.CompressorKnee ?? 4, CompressorThreshold: b.CompressorThreshold ?? -8, CompressorAttack: b.CompressorAttack ??
                                                .03, CompressorRelease: b.CompressorRelease ?? .2
                                        })
                                    } v = h(k)
                                } catch (b) { Syn.Log("Trigger Error : ", b, { type: "error", collapsed: !1 }) }
                            })
                        }, { mark: "Media-Booster", attributes: !1, throttle: 200 }, ({ ob: k, op: b }) => { n = k; u = b; w(c("\u274c \u7981\u7528\u589e\u5e45")) })
                    } else w(c("\u2705 \u555f\u7528\u589e\u5e45"))
                })
            }, SetControl: (...q) => v.SetBooster(...q), Parame: a
        }
    }(); D()
})();