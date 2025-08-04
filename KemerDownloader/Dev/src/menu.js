export default function Menu(Lib, Transl, General, FileName, FetchSet) {

    return class UI {
        constructor() {
            this.overlay = null;
            this.shadow = Lib.createElement(document.body, "div", { id: "kemer-settings" });
            this.shadowRoot = this.shadow.attachShadow({ mode: 'open' });

            this._loadUi();
        };

        open() {
            this.overlay.style.display = 'flex';
            setTimeout(() => this.overlay.classList.add('visible'), 10);
        };

        close() {
            this.overlay.classList.remove('visible');
            setTimeout(() => { this.overlay.style.display = 'none'; }, 200);
        };

        _getStyles() {
            const color = {
                Primary: {
                    "kemono": "#e8a17d",
                    "coomer": "#99ddff",
                    "nekohouse": "#bb91ff"
                }[Lib.$domain.split(".")[0]],
                Background: '#2c2c2e',
                BackgroundLight: '#3a3a3c',
                Border: '#545458',
                Text: '#f5f5f7',
                TextSecondary: '#8e8e93',
            }

            return `
                :host { --primary-color: ${color.Primary}; font-size: 16px; }
                #overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); display: none; justify-content: center; align-items: center; z-index: 9999; backdrop-filter: blur(5px); }
                #modal { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: ${color.Background}; color: ${color.Text}; border-radius: 14px; padding: 24px; width: 90%; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid rgba(255, 255, 255, 0.1); transform: scale(0.95); opacity: 0; transition: transform 0.2s ease-out, opacity 0.2s ease-out; }
                #overlay.visible #modal { transform: scale(1); opacity: 1; }
                .header h2 { margin: 0 0 16px 0; font-size: 1.5em; font-weight: 600; text-align: center; }
                .tabs { display: flex; border-bottom: 1px solid ${color.Border}; margin-bottom: 16px; }
                .tab-link { padding: 10px 16px; cursor: pointer; background: none; border: none; color: ${color.TextSecondary}; font-size: 1em; font-weight: 500; transition: color 0.2s, border-bottom 0.2s; border-bottom: 3px solid transparent; }
                .tab-link.active { color: #fff; border-bottom: 3px solid var(--primary-color); }
                .tab-content { display: none; } .tab-content.active { display: block; }
                .form-row { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: center; padding: 14px 4px; border-bottom: 1px solid ${color.BackgroundLight}; }
                .form-row:last-child { border-bottom: none; }
                .form-row-full { grid-template-columns: 1fr; }
                .form-row label { display: flex; align-items: center; gap: 8px; font-size: 0.95em; }
                .tooltip-icon { display: inline-flex; justify-content: center; align-items: center; width: 20px; height: 20px; border-radius: 50%; background-color: #555; color: #fff; font-weight: bold; cursor: help; position: relative; font-size: 14px; }
                .tooltip-icon.separate { margin-left: 8px; }
                .tooltip-icon:hover::after { content: attr(data-tooltip); z-index: 9999; position: absolute; bottom: 130%; left: 50%; transform: translateX(-50%); background-color: #1c1c1e; color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 0.8em; width: max-content; max-width: 250px; z-index: 10001; box-shadow: 0 4px 12px rgba(0,0,0,0.4); border: 1px solid ${color.Border}; }
                .switch { position: relative; display: inline-block; width: 50px; height: 28px; }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #555; transition: .4s; }
                .slider:before { position: absolute; content: ""; height: 22px; width: 22px; left: 3px; bottom: 3px; background-color: white; transition: .4s; }
                input:checked + .slider { background-color: var(--primary-color); }
                input:checked + .slider:before { transform: translateX(22px); }
                .slider.round { border-radius: 28px; } .slider.round:before { border-radius: 50%; }
                input[type="text"], select { background-color: ${color.BackgroundLight}; border: 1px solid ${color.Border}; color: ${color.Text}; border-radius: 8px; padding: 10px; width: 120px; text-align: center; font-size: 0.9em; }
                .accordion { border: 1px solid ${color.Border}; border-radius: 8px; margin-bottom: 16px; background-color: ${color.BackgroundLight}; overflow: hidden; }
                .accordion-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; padding: 14px; background-color: ${color.BackgroundLight}; }
                .accordion-icon { transition: transform 0.3s ease; font-size: 12px; }
                .accordion-content { max-height: 0; overflow: hidden; position: relative; transition: max-height 0.3s ease-out, padding 0.3s ease-out; padding: 0 14px; }
                .accordion-toggle:checked + .accordion-header .accordion-icon { transform: rotate(90deg); }
                .accordion-toggle:checked ~ .accordion-content { max-height: 200px; padding: 14px; }
                #fetch-conditional-settings { max-height: 0; overflow: hidden; transition: max-height 0.5s ease-out; }
                .conditional-trigger:checked + .form-row + #fetch-conditional-settings { max-height: 500px; }
                .conditional-trigger:checked + .form-row .switch .slider { background-color: var(--primary-color); }
                .conditional-trigger:checked + .form-row .switch .slider:before { transform: translateX(22px); }
                .multi-select { align-items: start; }
                .multi-select-group { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-start; }
                .multi-select-btn input { display: none; }
                .multi-select-btn span { display: block; text-align: center; padding: 8px 12px; border: 1px solid ${color.Border}; border-radius: 16px; cursor: pointer; transition: all 0.2s; font-size: 0.85em; }
                .multi-select-btn input:checked + span { background-color: var(--primary-color); color: white; border-color: var(--primary-color); }
                pre { background-color: #1c1c1e; border: 1px solid #545458; border-radius: 8px; padding: 15px; overflow-x: auto; font-size: 0.85em; line-height: 1.4; color: #e0e0e0; }
                code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; }
            `
        };

        _createHTML() {
            const createFormItems = (settings, category) => {
                return Object.entries(settings).map(([key, value]) => {

                    // 跳過不需要顯示的項目
                    if (key === "Dev" || (category === "FetchSet" && (key === "Mode" || key === "Format"))) return '';

                    const type = typeof value;
                    const label = Transl(key);
                    const id = `${category}-${key}`;
                    const tooltip = `<span class="tooltip-icon" data-tooltip="${Transl("說明")}">!</span>`;

                    if (category === 'FetchSet' && key === 'UseFormat') {
                        return `
                        <input type="checkbox" id="${id}" class="conditional-trigger" style="display: none;" ${value ? 'checked' : ''}>
                        <div class="form-row">
                            <label for="${id}">${label}${tooltip}</label>
                            <label class="switch" for="${id}">
                                <span class="slider round"></span>
                            </label>
                        </div>
                        ${this._createFetchConditionalItems()}
                    `;
                    }
                    else if (type === 'boolean') {
                        return `
                        <div class="form-row">
                            <label for="${id}">${label}${tooltip}</label>
                            <label class="switch">
                                <input type="checkbox" id="${id}" ${value ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>
                    `;
                    } else if (key === 'FillValue') {
                        return `
                        <div class="accordion form-row-full">
                            <input type="checkbox" id="accordion-${id}" class="accordion-toggle" style="display: none;">
                            <label class="accordion-header" for="accordion-${id}">
                                <span>${label}</span>
                                <span class="accordion-icon">▶</span>
                            </label>
                            <div class="accordion-content">
                                <div class="form-row">
                                    <label for="${id}-Filler">${Transl("Filler")}<span class="tooltip-icon" data-tooltip="${Transl("FillerHelp")}">!</span></label>
                                    <input type="text" id="${id}-Filler" value="${value.Filler}">
                                </div>
                                <div class="form-row">
                                    <label for="${id}-Amount">${Transl("Amount")}<span class="tooltip-icon" data-tooltip="${Transl("AmountHelp")}">!</span></label>
                                    <input type="text" id="${id}-Amount" value="${value.Amount}">
                                </div>
                            </div>
                        </div>
                    `;
                    } else if (type === 'string' || type === 'number') {
                        return `
                        <div class="form-row">
                            <label for="${id}">${label}${tooltip}</label>
                            <input type="text" id="${id}" value="${value}">
                        </div>
                    `;
                    }

                    return '';
                }).join('');
            };

            const fileNameConfigContent = `
                \r{Time} | ${Transl("發佈時間")}
                \r{Title} | ${Transl("標題")}
                \r{Artist} | ${Transl("作者|繪師")}
                \r{Source} | ${Transl("(Pixiv Fanbox) 之類的標籤")}
                \r{Fill} | ${Transl("只適用於檔名的填充值, 必須存在該值")}
            `;

            return `
                <div id="overlay">
                    <div id="modal">
                        <div class="header"><h2>${Transl("Settings")}</h2></div>
                        <div class="tabs">
                            <button class="tab-link active" data-tab="tab-config">${Transl("General")}</button>
                            <button class="tab-link" data-tab="tab-filename">${Transl("FileName")}</button>
                            <button class="tab-link" data-tab="tab-fetch">${Transl("FetchSet")}</button>
                        </div>
                        <div class="tab-content active" id="tab-config">${createFormItems(General, 'General')}</div>
                        <div class="tab-content" id="tab-filename">
                            ${createFormItems(FileName, 'FileName')}
                            <pre class="filename-config-display">${fileNameConfigContent}</pre>
                        </div>
                        <div class="tab-content" id="tab-fetch">${createFormItems(FetchSet, 'FetchSet')}</div>
                    </div>
                </div>
            `
        };

        _createFetchConditionalItems() {
            const modeHtml = `
                <div class="form-row">
                    <label for="fetch-Mode">${Transl("Mode")}<span class="tooltip-icon" data-tooltip="${Transl("模式說明")}">!</span></label>
                    <select id="fetch-Mode">
                        <option value="FilterMode" ${FetchSet.Mode === 'FilterMode' ? 'selected' : ''}>${Transl("FilterMode")}</option>
                        <option value="OnlyMode" ${FetchSet.Mode === 'OnlyMode' ? 'selected' : ''}>${Transl("OnlyMode")}</option>
                    </select>
                </div>
            `;

            const formatOptions = ["PostLink", "Timestamp", "TypeTag", "ImgLink", "VideoLink", "DownloadLink", "ExternalLink"];
            const formatButtons = formatOptions.map(opt => `
                <label class="multi-select-btn">
                    <input type="checkbox" name="fetch-Format" value="${opt}" ${FetchSet.Format.includes(opt) ? 'checked' : ''}>
                    <span>${Transl(opt)}</span>
                </label>
            `).join('');

            const formatHtml = `
                <div class="form-row multi-select form-row-full">
                    <label>${Transl("Format")}<span class="tooltip-icon" data-tooltip="${Transl("格式說明")}">!</span></label>
                    <div class="multi-select-group">${formatButtons}</div>
                </div>
            `;

            return `<div id="fetch-conditional-settings">${modeHtml}${formatHtml}</div>`;
        };

        _UiSwitchEvent() {
            this.overlay = Lib.$Q(this.shadowRoot, "#overlay");

            Lib.onE(this.overlay, "click", event => {
                const target = event.target;
                const tagName = target.tagName;

                if (tagName === "BUTTON") {
                    // 切換選項卡
                    if (target.classList.contains("active")) return;

                    Lib.$Q(this.shadowRoot, "button.active").classList.remove("active");
                    Lib.$Q(this.shadowRoot, "div.tab-content.active").classList.remove("active");

                    target.classList.add("active");
                    Lib.$Q(this.shadowRoot, `div#${target.dataset.tab}`).classList.add("active");
                } else if (target === this.overlay) {
                    this.close();
                }


            })
        };

        _loadUi() {
            this.shadowRoot.innerHTML = `
                <style>${this._getStyles()}</style>
                ${this._createHTML()}
            `;

            this._UiSwitchEvent();
        };
    }
}