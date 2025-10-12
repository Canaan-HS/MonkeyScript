import { Lib } from '../services/client.js';
import { Share } from '../core/config.js';
import Transl from '../shared/language.js';

const CreateMenu = () => {
    const icon = GM_getResourceURL("Icon");

    return () => {
        const shadowID = "Booster_Menu";
        if (Lib.$q(`#${shadowID}`)) return;

        const shadow = Lib.createElement(Lib.body, "div", { id: shadowID });
        const shadowRoot = shadow.attachShadow({ mode: "open" });

        const style = `
            <style>
                :host {
                    --primary-color: #3a7bfd;
                    --secondary-color: #00d4ff;
                    --text-color: #ffffff;
                    --slider-track: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
                    --background-dark: #1a1f2c;
                    --background-panel: #252b3a;
                    --highlight-color: #00e5ff;
                    --border-radius: 12px;
                    --hover-bg: rgba(0, 229, 255, 0.06);
                    --hover-border: rgba(0, 229, 255, 0.15);
                }
                ${shadowID} {
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    z-index: 999999;
                    overflow: auto;
                    position: fixed;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(2px);
                    -webkit-backdrop-filter: blur(2px);
                    transition: opacity 0.4s ease;
                    background-color: rgba(0, 0, 0, 0.4);
                }
                ${shadowID}.close {
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
                    max-height: 85vh;
                    transition: all 0.5s ease;
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
                    transform: translateY(-10px);
                }
                .Booster-Multiplier {
                    margin: 1.5rem 0;
                    font-size: 22px;
                    font-weight: 500;
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
                    transform: translateY(10px);
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
                .Booster-Label {
                    padding: 0.1rem 0.2rem;
                    font-size: larger;
                    font-weight: bolder;
                    cursor: pointer;
                    border-radius: 6px;
                    min-width: 50px;
                    text-align: center;
                    color: var(--highlight-color);
                    transition: background-color 0.2s;
                }
                .Booster-Label:hover {
                    background-color: var(--hover-bg);
                    border-color: var(--hover-border);
                    box-shadow: 0 0 0.5rem rgba(0, 229, 255, 0.12);
                    transform: translateY(-1px);
                }
                .Booster-Label-Input {
                    width: 60px;
                    padding: 2px 5px;
                    font-size: 18px;
                    font-weight: bolder;
                    color: var(--text-color);
                    background-color: var(--background-panel);
                    border: 1px solid var(--primary-color);
                    border-radius: 4px;
                    text-align: center;
                    outline: none;
                }
                @keyframes fadeOut {
                    from {opacity: 1;}
                    to {opacity: 0; pointer-events: none;}
                }
                @keyframes shrinkFadeOut {
                    from {transform: scale(1); opacity: 1;}
                    to {transform: scale(0.5); opacity: 0;}
                }
            </style>
        `;

        const generateOtherTemplate = (label, groups) => `
            <button class="Booster-Accordion">${Transl(label)}</button>
            <div class="Booster-Panel">
                ${groups.map((group) => `
                    <div class="Booster-Control-Group">
                        <div class="Booster-Control-Label">
                            <span>${Transl(group.label)}</span>
                            <span id="${group.id}-Label" class="Booster-Label">${Share.Parame[group.id]}</span>
                        </div>
                        <input type="range" id="${group.id}" class="Booster-Mini-Slider" min="${group.min}" max="${group.max}" value="${Share.Parame[group.id]}" step="${group.step}">
                    </div>
                `).join("")}
            </div>
        `;

        const menu = Lib.createDomFragment(`
            ${style}
            <${shadowID} id="Booster-Modal-Menu">
                <div class="Booster-Modal-Content">

                    <h2 class="Booster-Title">${Transl("音量增強器")}</h2>
                    <div class="Booster-Multiplier">
                        <span>
                            <img src="${icon}">${Transl("增強倍數 ")}
                            <span id="Gain-Label" class="Booster-Label">${Share.Parame.Gain}</span>${Transl(" 倍")}
                        </span>
                        <input type="range" id="Gain" class="Booster-Slider" min="0" max="20.0" value="${Share.Parame.Gain}" step="0.1">
                    </div>

            ${generateOtherTemplate("低頻設定", [
            { label: "增益", id: "LowFilterGain", min: "-12", max: "12", step: "0.1" },
            { label: "頻率", id: "LowFilterFreq", min: "20", max: "1000", step: "20" }
        ])}

            ${generateOtherTemplate("中頻設定", [
            { label: "增益", id: "MidFilterGain", min: "-12", max: "12", step: "0.1" },
            { label: "頻率", id: "MidFilterFreq", min: "200", max: "8000", step: "100" },
            { label: "Q值", id: "MidFilterQ", min: "0.5", max: "5", step: "0.1" }
        ])}

            ${generateOtherTemplate("高頻設定", [
            { label: "增益", id: "HighFilterGain", min: "-12", max: "12", step: "0.1" },
            { label: "頻率", id: "HighFilterFreq", min: "2000", max: "22000", step: "500" }
        ])}

            ${generateOtherTemplate("動態壓縮", [
            { label: "壓縮率", id: "CompressorRatio", min: "1", max: "30", step: "0.1" },
            { label: "過渡反應", id: "CompressorKnee", min: "0", max: "40", step: "1" },
            { label: "閾值", id: "CompressorThreshold", min: "-60", max: "0", step: "1" },
            { label: "起音速度", id: "CompressorAttack", min: "0.001", max: "0.5", step: "0.001" },
            { label: "釋放速度", id: "CompressorRelease", min: "0.01", max: "2", step: "0.01" },
        ])}

                    <div class="Booster-Buttons">
                        <button class="Booster-Modal-Button" id="Booster-Menu-Close">${Transl("關閉")}</button>
                        <button class="Booster-Modal-Button" id="Booster-Sound-Save">${Transl("保存")}</button>
                    </div>
                </div>
            </${shadowID}>
        `);

        shadowRoot.appendChild(menu);

        const shadowGate = shadow.shadowRoot;
        const modal = shadowGate.querySelector(shadowID);
        const content = shadowGate.querySelector(".Booster-Modal-Content");

        // 關閉菜單
        function deleteMenu() {
            modal.classList.add("close");
            content.classList.add("close");

            setTimeout(() => {
                shadow.remove();
            }, 800)
        };

        // 建立顯示值對應表
        const displayMap = {
            ...Object.fromEntries(
                [...shadowGate.querySelectorAll(".Booster-Label")].map(el => [el.id, el])
            )
        };

        // 處理 UI 與 控制 更新
        function updateControl(id, value) {
            displayMap[`${id}-Label`].textContent = value;
            shadowGate.querySelector(`#${id}`).value = value;
            Share.SetControl(id, value);
        };

        // 監聽滑桿變化
        content.addEventListener("input", event => {
            const target = event.target;
            if (target.type !== 'range') return; // 只處理滑桿

            const id = target.id;
            const value = parseFloat(target.value);

            updateControl(id, value);
        });

        content.addEventListener("click", event => {
            const target = event.target;
            if (!target.classList.contains("Booster-Label") || target.isEditing) return;

            target.isEditing = true;

            const originalValue = target.textContent.trim();
            const controlId = target.id.replace("-Label", "");
            const slider = shadowGate.querySelector(`#${controlId}`);

            target.textContent = "";
            const input = Lib.createElement(target, "input", {
                class: "Booster-Label-Input",
                value: originalValue,
                on: {
                    blur: {
                        listen: () => {
                            let newValue = parseFloat(input.value);
                            const min = parseFloat(slider.min);
                            const max = parseFloat(slider.max);

                            if (isNaN(newValue)) {
                                newValue = parseFloat(originalValue);
                            } else if (newValue < min) {
                                newValue = min;
                            } else if (newValue > max) {
                                newValue = max;
                            }

                            target.isEditing = false;
                            updateControl(controlId, newValue);
                            target.textContent = newValue; // 移除 input
                        },
                        add: { once: true }
                    },
                    keydown: e => {
                        if (e.key === "Enter") e.target.blur();
                        if (e.key === "Escape") {
                            e.target.value = originalValue;
                            e.target.blur();
                        }
                    }
                }
            });

            requestAnimationFrame(() => input.focus());
        });

        // 監聽保存關閉
        modal.addEventListener("click", click => {
            const target = click.target;
            click.stopPropagation();

            if (target.classList.contains("Booster-Accordion")) {
                target.classList.toggle("active");
                const panel = target.nextElementSibling;

                if (panel.style.maxHeight) {
                    panel.style.maxHeight = null;
                    panel.classList.remove("active");
                } else {
                    panel.style.maxHeight = panel.scrollHeight + "px";
                    panel.classList.add("active");
                }

            } else if (target.id === "Booster-Sound-Save") {
                Lib.setV(Lib.domain, Share.Parame);
                deleteMenu();
            } else if (
                target.id === "Booster-Menu-Close" || target.id === "Booster-Modal-Menu"
            ) {
                deleteMenu();
            }
        });
    };
};

export default CreateMenu;