// ==UserScript==
// @name         Media Volume Booster
// @name:zh-TW   媒體音量增強器
// @name:zh-CN   媒体音量增强器
// @name:en      Media Volume Booster
// @version      0.0.39
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

// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_getResourceURL
// @grant        GM_registerMenuCommand
// @grant        GM_addValueChangeListener
// @resource     Img https://cdn-icons-png.flaticon.com/512/11243/11243783.png
// @require      https://update.greasyfork.org/scripts/487608/1565376/SyntaxLite_min.js
// ==/UserScript==
(async () => {
    async function A() {
        function l() { t.classList.replace("open", "close"); x.classList.replace("open", "close"); setTimeout(() => { h.remove() }, 800) } if (!Syn.$q("#Booster_Modal_Background")) {
            var h = Syn.$createElement("div", { id: "Booster_Modal_Background" }); h.attachShadow({ mode: "open" }).$iHtml(`
            <style id="Booster-Menu">
                :host {--primary-color: #3a7bfd;--secondary-color: #00d4ff;--text-color: #ffffff;--slider-track: linear-gradient(90deg, var(--primary-color), var(--secondary-color));--background-dark: #1a1f2c;--background-panel: #252b3a;--highlight-color: #00e5ff;--border-radius: 12px;}
                Booster_Modal_Background {top: 0;left: 0;opacity: 0;width: 100%;height: 100%;display: flex;z-index: 9999;overflow: auto;position: fixed;align-items: center;justify-content: center;backdrop-filter: blur(5px);-webkit-backdrop-filter: blur(5px);transition: opacity 0.4s ease;background-color: rgba(0, 0, 0, 0.4);}
                Booster_Modal_Background.open {animation: fadeIn 0.4s ease forwards;}
                Booster_Modal_Background.close {animation: fadeOut 0.4s ease forwards;}
                .Booster-Modal-Content {min-width: 420px;max-width: 460px;width: 100%;padding: 20px;padding-inline-end: 10px;overflow-y: auto;scrollbar-gutter: stable;text-align: center;border-radius: var(--border-radius);background-color: var(--background-dark);border: 1px solid rgba(78, 164, 255, 0.3);box-shadow:     inset -6px 0 10px -8px rgba(0, 0, 0, 0.5),    0 10px 30px rgba(0, 0, 0, 0.5),    0 0 15px rgba(0, 212, 255, 0.2);color: var(--text-color);opacity: 0;max-height: 85vh;transform: scale(0.9);transition: all 0.5s ease;}
                .Booster-Modal-Content.open {animation: scaleIn 0.5s ease forwards;}
                .Booster-Modal-Content.close {animation: shrinkFadeOut 0.8s ease forwards;}
                .Booster-Modal-Content::-webkit-scrollbar {width: 8px;}
                .Booster-Modal-Content::-webkit-scrollbar-thumb {background: rgba(255, 255, 255, 0.2);border-radius: 8px;}
                .Booster-Modal-Content::-webkit-scrollbar-track {background: rgba(0, 0, 0, 0.1);}
                .Booster-Title {margin-top: 0;color: var(--secondary-color);font-size: 22px;font-weight: 600;letter-spacing: 0.5px;margin-bottom: 20px;text-shadow: 0 0 10px rgba(0, 212, 255, 0.4);opacity: 0;transform: translateY(-10px);animation: slideDown 0.4s ease 0.3s forwards;}
                .Booster-Multiplier {margin: 1.5rem 0;font-size: 22px;font-weight: 500;opacity: 0;animation: fadeIn 0.5s ease 0.4s forwards;}
                .Booster-Multiplier img {width: 24px;margin-right: 8px;vertical-align: middle;}
                .Booster-Multiplier span {display: flex;align-items: center;justify-content: center;}
                #Booster-CurrentValue {color: var(--highlight-color);font-weight: 700;margin: 0 5px;font-size: 26px;}
                .Booster-Slider {-webkit-appearance: none;appearance: none;width: 90%;height: 6px;cursor: pointer;margin: 2rem 0 3.5rem 0;background: var(--slider-track);border-radius: 3px;outline: none;opacity: 0;animation: progressIn 0.8s ease 0.5s forwards;}
                .Booster-Slider::-webkit-slider-thumb {-webkit-appearance: none;appearance: none;width: 16px;height: 16px;border-radius: 50%;background: var(--secondary-color);cursor: pointer;box-shadow: 0 0 8px rgba(0, 212, 255, 0.6);}
                .Booster-Slider::-moz-range-thumb {width: 16px;height: 16px;border-radius: 50%;background: var(--secondary-color);cursor: pointer;border: none;box-shadow: 0 0 8px rgba(0, 212, 255, 0.6);}
                .Booster-Slider::-moz-range-progress {background: var(--slider-track);border-radius: 3px;height: 6px;}
                .Booster-Buttons {display: flex;justify-content: flex-end;margin-top: 20px;gap: 10px;opacity: 0;animation: fadeIn 0.5s ease 0.7s forwards;}
                .Booster-Modal-Button {color: var(--text-color);cursor: pointer;font-size: 15px;font-weight: 500;padding: 8px 16px;border-radius: 6px;background-color: rgba(58, 123, 253, 0.2);border: 1px solid rgba(78, 164, 255, 0.3);transition: all 0.2s ease;outline: none;}
                .Booster-Modal-Button:hover {background-color: rgba(58, 123, 253, 0.4);box-shadow: 0 0 10px rgba(0, 212, 255, 0.4);transform: translateY(-2px);}
                #Booster-Sound-Save {background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));border: none;position: relative;overflow: hidden;}
                #Booster-Sound-Save:hover {box-shadow: 0 0 15px rgba(0, 212, 255, 0.6);}
                #Booster-Sound-Save:after {content: "";position: absolute;top: -50%;left: -60%;width: 20%;height: 200%;opacity: 0;transform: rotate(30deg);background: rgba(255, 255, 255, 0.13);background: linear-gradient(    to right,     rgba(255, 255, 255, 0.13) 0%,    rgba(255, 255, 255, 0.13) 77%,    rgba(255, 255, 255, 0.5) 92%,    rgba(255, 255, 255, 0.0) 100%);}
                #Booster-Sound-Save:hover:after {opacity: 1;left: 130%;transition: left 0.7s ease, opacity 0.5s ease;}
                .Booster-Accordion {background-color: var(--background-panel);color: var(--text-color);cursor: pointer;padding: 12px 15px;width: 100%;text-align: left;border: none;outline: none;transition: 0.3s;border-radius: 8px;margin-bottom: 8px;font-weight: 500;display: flex;justify-content: space-between;align-items: center;opacity: 0;transform: translateY(10px);}
                .Booster-Accordion:nth-of-type(1) {animation: slideUp 0.4s ease 0.5s forwards;}
                .Booster-Accordion:nth-of-type(2) {animation: slideUp 0.4s ease 0.6s forwards;}
                .Booster-Accordion:nth-of-type(3) {animation: slideUp 0.4s ease 0.7s forwards;}
                .Booster-Accordion:nth-of-type(4) {animation: slideUp 0.4s ease 0.8s forwards;}
                .Booster-Accordion:after {content: '+';color: var(--secondary-color);font-weight: bold;float: right;margin-left: 5px;}
                .Booster-Accordion.active {border-bottom-left-radius: 0;border-bottom-right-radius: 0;margin-bottom: 0;}
                .Booster-Accordion.active:after {content: "-";}
                .Booster-Panel {max-height: 0;overflow: hidden;padding: 0 15px;margin-top: 0;margin-bottom: 8px;transition: max-height 0.3s ease-out;background-color: var(--background-panel);border-radius: 0 0 8px 8px;}
                .Booster-Panel.active {margin-bottom: 15px;padding: 10px 15px 15px;}
                .Booster-Control-Group {margin-bottom: 15px;}
                .Booster-Control-Label {display: flex;justify-content: space-between;margin-bottom: 5px;font-size: 14px;color: rgba(255, 255, 255, 0.8);}
                .Booster-Value {color: var(--highlight-color);font-weight: 600;}
                .Booster-Mini-Slider {-webkit-appearance: none;appearance: none;width: 100%;height: 4px;background: var(--slider-track);border-radius: 2px;outline: none;}
                .Booster-Mini-Slider::-webkit-slider-thumb {-webkit-appearance: none;appearance: none;width: 12px;height: 12px;border-radius: 50%;background: var(--secondary-color);cursor: pointer;}
                .Booster-Mini-Slider::-moz-range-thumb {width: 12px;height: 12px;border-radius: 50%;background: var(--secondary-color);cursor: pointer;border: none;}
                .Booster-Mini-Slider::-moz-range-progress {background: var(--slider-track);border-radius: 2px;height: 4px;}
                @keyframes fadeIn {from {opacity: 0;}to {opacity: 1;}}
                @keyframes fadeOut {from {opacity: 1;}to {opacity: 0;pointer-events: none;}}
                @keyframes scaleIn {from {transform: scale(0.9);opacity: 0;}to {transform: scale(1);opacity: 1;}}
                @keyframes shrinkFadeOut {from {transform: scale(1);opacity: 1;}to {transform: scale(0.5);opacity: 0;}}
                @keyframes slideUp {from {transform: translateY(10px);opacity: 0;}to {transform: translateY(0);opacity: 1;}}
                @keyframes slideDown {from {transform: translateY(-10px);opacity: 0;}to {transform: translateY(0);opacity: 1;}}
                @keyframes progressIn {from {width: 0%;opacity: 0;}to {width: 90%;opacity: 1;}}
            </style>
            <Booster_Modal_Background id="Booster-Modal-Menu">
                <div class="Booster-Modal-Content">
                    <h2 class="Booster-Title">${a("\u97f3\u91cf\u589e\u5f37\u5668")}</h2>
                    <div class="Booster-Multiplier">
                        <span>
                            <img src="${GM_getResourceURL("Img")}">${a("\u589e\u5f37\u500d\u6578 ")}
                            <span id="Gain-Value" class="Booster-Value">${b.Gain}</span>${a(" \u500d")}
                        </span>
                        <input type="range" id="Gain" class="Booster-Slider" min="0" max="20.0" value="${b.Gain}" step="0.1">
                    </div>
                    <button class="Booster-Accordion">${a("\u4f4e\u983b\u8a2d\u5b9a")}</button>
                    <div class="Booster-Panel">
                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${a("\u589e\u76ca")}</span>
                                <span id="LowFilterGain-Value" class="Booster-Value">${b.LowFilterGain}</span>
                            </div>
                            <input type="range" id="LowFilterGain" class="Booster-Mini-Slider" min="0" max="20" value="${b.LowFilterGain}" step="0.1">
                        </div>
                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${a("\u983b\u7387")}</span>
                                <span id="LowFilterFreq-Value" class="Booster-Value">${b.LowFilterFreq}</span>
                            </div>
                            <input type="range" id="LowFilterFreq" class="Booster-Mini-Slider" min="20" max="1000" value="${b.LowFilterFreq}" step="20">
                        </div>
                    </div>
                    <button class="Booster-Accordion">${a("\u4e2d\u983b\u8a2d\u5b9a")}</button>
                    <div class="Booster-Panel">
                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${a("\u589e\u76ca")}</span>
                                <span id="MidFilterGain-Value" class="Booster-Value">${b.MidFilterGain}</span>
                            </div>
                            <input type="range" id="MidFilterGain" class="Booster-Mini-Slider" min="0" max="20" value="${b.MidFilterGain}" step="0.1">
                        </div>
                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${a("\u983b\u7387")}</span>
                                <span id="MidFilterFreq-Value" class="Booster-Value">${b.MidFilterFreq}</span>
                            </div>
                            <input type="range" id="MidFilterFreq" class="Booster-Mini-Slider" min="200" max="8000" value="${b.MidFilterFreq}" step="100">
                        </div>
                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${a("Q\u503c")}</span>
                                <span id="MidFilterQ-Value" class="Booster-Value">${b.MidFilterQ}</span>
                            </div>
                            <input type="range" id="MidFilterQ" class="Booster-Mini-Slider" min="0.1" max="10" value="${b.MidFilterQ}" step="0.1">
                        </div>
                    </div>
                    <button class="Booster-Accordion">${a("\u9ad8\u983b\u8a2d\u5b9a")}</button>
                    <div class="Booster-Panel">
                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${a("\u589e\u76ca")}</span>
                                <span id="HighFilterGain-Value" class="Booster-Value">${b.HighFilterGain}</span>
                            </div>
                            <input type="range" id="HighFilterGain" class="Booster-Mini-Slider" min="0" max="20" value="${b.HighFilterGain}" step="0.1">
                        </div>
                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${a("\u983b\u7387")}</span>
                                <span id="HighFilterFreq-Value" class="Booster-Value">${b.HighFilterFreq}</span>
                            </div>
                            <input type="range" id="HighFilterFreq" class="Booster-Mini-Slider" min="2000" max="22000" value="${b.HighFilterFreq}" step="500">
                        </div>
                    </div>
                    <button class="Booster-Accordion">${a("\u52d5\u614b\u58d3\u7e2e")}</button>
                    <div class="Booster-Panel">
                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${a("\u58d3\u7e2e\u7387")}</span>
                                <span id="CompressorRatio-Value" class="Booster-Value">${b.CompressorRatio}</span>
                            </div>
                            <input type="range" id="CompressorRatio" class="Booster-Mini-Slider" min="1" max="30" value="${b.CompressorRatio}" step="0.1">
                        </div>
                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${a("\u904e\u6e21\u53cd\u61c9")}</span>
                                <span id="CompressorKnee-Value" class="Booster-Value">${b.CompressorKnee}</span>
                            </div>
                            <input type="range" id="CompressorKnee" class="Booster-Mini-Slider" min="0" max="40" value="${b.CompressorKnee}" step="0.1">
                        </div>
                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${a("\u95be\u503c")}</span>
                                <span id="CompressorThreshold-Value" class="Booster-Value">${b.CompressorThreshold}</span>
                            </div>
                            <input type="range" id="CompressorThreshold" class="Booster-Mini-Slider" min="-100" max="0" value="${b.CompressorThreshold}" step="1">
                        </div>
                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${a("\u8d77\u97f3\u901f\u5ea6")}</span>
                                <span id="CompressorAttack-Value" class="Booster-Value">${b.CompressorAttack}</span>
                            </div>
                            <input type="range" id="CompressorAttack" class="Booster-Mini-Slider" min="0" max="1" value="${b.CompressorAttack}" step="0.01">
                        </div>
                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${a("\u91cb\u653e\u901f\u5ea6")}</span>
                                <span id="CompressorRelease-Value" class="Booster-Value">${b.CompressorRelease}</span>
                            </div>
                            <input type="range" id="CompressorRelease" class="Booster-Mini-Slider" min="0" max="2" value="${b.CompressorRelease}" step="0.1">
                        </div>
                    </div>
                    <div class="Booster-Buttons">
                        <button class="Booster-Modal-Button" id="Booster-Menu-Close">${a("\u95dc\u9589")}</button>
                        <button class="Booster-Modal-Button" id="Booster-Sound-Save">${a("\u4fdd\u5b58")}</button>
                    </div>
                </div>
            </Booster_Modal_Background>
        `); document.body.appendChild(h); var m = h.shadowRoot, t = m.querySelector("Booster_Modal_Background"), x = m.querySelector(".Booster-Modal-Content"); t.classList.add("open"); x.classList.add("open"); var z = { ...Object.fromEntries([...m.querySelectorAll(".Booster-Value")].map(c => [c.id, c])) }; x.addEventListener("input", c => { var f = c.target; c = f.id; f = f.value; z[`${c}-Value`].textContent = f; D(c, f) }); t.addEventListener("click", c => {
                const f = c.target; c.stopPropagation(); f.classList.contains("Booster-Accordion") ? (f.classList.toggle("active"),
                    c = f.nextElementSibling, c.style.maxHeight ? (c.style.maxHeight = null, c.classList.remove("active")) : (c.style.maxHeight = c.scrollHeight + "px", c.classList.add("active"))) : "Booster-Sound-Save" === f.id ? (Syn.sV(Syn.$domain, b), l()) : "Booster-Menu-Close" !== f.id && "Booster-Modal-Menu" !== f.id || l()
            })
        }
    } const { Transl: a } = function (l) {
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
        },
            l); return { Transl: m => h[m] ?? m }
    }(Syn.$lang), B = (() => { let l = new Set(Syn.gV("Banned", [])); var h = Syn.gV("BannedDomains_v2"); h && (h = Object.keys(h), Syn.sV("Banned", h), Syn.dV("BannedDomains_v2"), l = new Set(h)); let m = l.has(Syn.$domain); return { IsEnabled: t => t(!m), AddBanned: async () => { m ? l.delete(Syn.$domain) : l.add(Syn.$domain); Syn.sV("Banned", [...l]); location.reload() } } })(), { Start: E, SetControl: D, Parame: b } = function () {
        function l(p) {
            try {
                if (!C) throw Error(a("\u4e0d\u652f\u63f4\u97f3\u983b\u589e\u5f37\u7bc0\u9ede")); r ||=
                    new C; "suspended" === r.state && r.resume(); const u = c.length; for (const d of p) {
                        d.crossOrigin || (d.crossOrigin = "anonymous"); if (d.mediaKeys || d.encrypted || 0 < d.textTracks.length) continue; const k = r.createMediaElementSource(d), n = r.createGain(), v = r.createBiquadFilter(), w = r.createBiquadFilter(), y = r.createBiquadFilter(), q = r.createDynamicsCompressor(); n.gain.value = g.Gain ** 2; v.type = "lowshelf"; v.gain.value = g.LowFilterGain; v.frequency.value = g.LowFilterFreq; w.type = "peaking"; w.Q.value = g.MidFilterQ; w.gain.value = g.MidFilterGain;
                        w.frequency.value = g.MidFilterFreq; y.type = "highshelf"; y.gain.value = g.HighFilterGain; y.frequency.value = g.HighFilterFreq; q.ratio.value = g.CompressorRatio; q.knee.value = g.CompressorKnee; q.threshold.value = g.CompressorThreshold; q.attack.value = g.CompressorAttack; q.release.value = g.CompressorRelease; k.connect(n).connect(v).connect(w).connect(y).connect(q).connect(r.destination); const F = setInterval(() => { d.volume = 1 }, 1E3); setTimeout(() => { clearInterval(F) }, 3E3); c.push({
                            Gain: n.gain, LowFilterGain: v.gain, LowFilterFreq: v.frequency,
                            MidFilterQ: w.Q, MidFilterGain: w.gain, MidFilterFreq: w.frequency, HighFilterGain: y.gain, HighFilterFreq: y.frequency, CompressorRatio: q.ratio, CompressorKnee: q.knee, CompressorThreshold: q.threshold, CompressorAttack: q.attack, CompressorRelease: q.release
                        }); f.set(d, !0)
                    } c.length > u && (Syn.Log(a("\u6dfb\u52a0\u589e\u5f37\u7bc0\u9ede\u6210\u529f"), { "Booster Media : ": p }, { collapsed: !1 }), m || (m = !0, G(), Syn.Menu({
                        [a("\ud83d\udcdc \u83dc\u55ae\u71b1\u9375")]: { func: () => alert(a("\u71b1\u9375\u547c\u53eb\u8abf\u6574\u83dc\u55ae!!\n\n\u5feb\u6377\u7d44\u5408 : (Alt + B)")) },
                        [a("\ud83d\udee0\ufe0f \u8abf\u6574\u83dc\u55ae")]: { func: () => A() }
                    }, "Menu", 2), Syn.StoreListen([Syn.$domain], d => { d.far && d.key == Syn.$domain && Object.entries(d.nv).forEach(([k, n]) => { z.SetBooster(k, n) }) }))); setTimeout(() => { t.observe(document, x) }, 3E3); return { SetBooster: (d, k) => { g[d] = k; "Gain" === d && (k **= 2); c.forEach(n => { n[d].value = k }) } }
            } catch (u) { Syn.Log(a("\u589e\u5f37\u932f\u8aa4"), u, { type: "error", collapsed: !1 }) }
        } async function h(p) { try { z = l(p) } catch (u) { Syn.Log("Trigger Error : ", u, { type: "error", collapsed: !1 }) } }
        let m = !1, t = null, x = null, z = null; const c = [], f = new Map; let r = null; const C = window.AudioContext || window.webkitAudioContext; let e = Syn.gV(Syn.$domain, {}); "number" === typeof e && (e = { Gain: e }); const g = {
            Gain: e.Gain ?? 1, LowFilterGain: e.LowFilterGain ?? 2.2, LowFilterFreq: e.LowFilterFrequency ?? 200, MidFilterQ: e.MidFilterQ ?? 1, MidFilterGain: e.MidFilterGain ?? 3, MidFilterFreq: e.MidFilterFrequency ?? 1200, HighFilterGain: e.HighFilterGain ?? 1.8, HighFilterFreq: e.HighFilterFreq ?? 12E3, CompressorRatio: e.CompressorRatio ?? 5.4, CompressorKnee: e.CompressorKnee ??
                .4, CompressorThreshold: e.CompressorThreshold ?? -12, CompressorAttack: e.CompressorAttack ?? .02, CompressorRelease: e.CompressorRelease ?? .4
        }, G = async () => { document.$onEvent("keydown", p => { p.altKey && "B" == p.key.toUpperCase() && A() }, { passive: !0, capture: !0 }) }; return {
            Start: function () {
                B.IsEnabled(p => {
                    const u = async d => { Syn.Menu({ [d]: { func: () => B.AddBanned() } }) }; if (p) {
                        const d = Syn.Debounce(k => { const n = [...Syn.$qa("video, audio")].filter(v => !f.has(v)); 0 < n.length && k(n) }, 300); Syn.Observer(document, () => {
                            d(k => {
                                t.disconnect();
                                h(k)
                            })
                        }, { mark: "Media-Booster", attributes: !1, debounce: 60 }, ({ ob: k, op: n }) => { t = k; x = n; u(a("\u274c \u7981\u7528\u589e\u5e45")) })
                    } else u(a("\u2705 \u555f\u7528\u589e\u5e45"))
                })
            }, SetControl: (...p) => z.SetBooster(...p), Parame: g
        }
    }(); E()
})();