export default function Menu(Syn, Transl, Config, FileName, FetchSet) {

    const shadowHost = document.createElement('div');
    shadowHost.id = 'kemer-settings-host';
    document.body.appendChild(shadowHost);
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

    const getMenuHTML = () => {
        const createFormItems = (settings, category) => {
            return Object.entries(settings).map(([key, value]) => {
                // 跳過不應在此處渲染的特殊鍵
                if (key === 'Dev' || (category === 'fetch' && (key === 'Mode' || key === 'Format'))) return '';

                const id = `${category}-${key}`;
                const label = Transl(key) || key;
                const type = typeof value;
                const tooltipText = Transl(`${key}Help`) || '沒有可用的說明';
                const tooltip = `<span class="tooltip-icon" data-tooltip="${tooltipText}">!</span>`;

                if (type === 'boolean') {
                    const isConditional = key === 'UseFormat';
                    return `
                        <div class="form-row">
                            <label for="${id}">${label}${tooltip}</label>
                            <label class="switch">
                                <input type="checkbox" id="${id}" ${isConditional ? 'class="conditional-trigger"' : ''} data-controls="fetch-conditional-settings" ${value ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>
                    `;
                } else if (key === 'FillValue') {
                    return `
                        <div class="accordion form-row-full">
                            <div class="accordion-header">
                                <span>${label}</span>
                                <span class="accordion-icon">▶</span>
                            </div>
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

        const createFetchConditionalItems = () => {
            const modeHtml = `
                <div class="form-row">
                    <label for="fetch-Mode">${Transl("Mode")}<span class="tooltip-icon" data-tooltip="${Transl("ModeHelp")}">!</span></label>
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
                    <label>${Transl("Format")}<span class="tooltip-icon" data-tooltip="${Transl("FormatHelp")}">!</span></label>
                    <div class="multi-select-group">${formatButtons}</div>
                </div>
            `;

            return `<div id="fetch-conditional-settings">${modeHtml}${formatHtml}</div>`;
        };

        // 從 config.js 中提取 FileName 的註解和內容
        const fileNameConfigContent = `
            \r{Time} 發表時間
            \r{Title} 標題
            \r{Artist} 作者 | 繪師 ...
            \r{Source} 來源 => (Pixiv Fanbox) 之類的標籤
            \r{Fill} 填充 => 只適用於檔名, 位置隨意 但 必須存在該值, 不然會出錯
        `;

        return `
            <div id="overlay">
                <div id="modal">
                    <div class="header"><h2>${Transl("腳本設定")}</h2></div>
                    <div class="tabs">
                        <button class="tab-link active" data-tab="tab-config">${Transl("通用設定")}</button>
                        <button class="tab-link" data-tab="tab-filename">${Transl("檔名設定")}</button>
                        <button class="tab-link" data-tab="tab-fetch">${Transl("抓取設定")}</button>
                    </div>
                    <div class="tab-content active" id="tab-config">${createFormItems(Config, 'config')}</div>
                    <div class="tab-content" id="tab-filename">
                        ${createFormItems(FileName, 'filename')}
                        <pre class="filename-config-display">${fileNameConfigContent}</pre>
                    </div>
                    <div class="tab-content" id="tab-fetch">${createFormItems(FetchSet, 'fetch')}${createFetchConditionalItems()}</div>
                </div>
            </div>
        `;
    };

    const getMenuCSS = () => {
        const Color = {
            Primary: {
                "kemono": "#e8a17d",
                "coomer": "#99ddff",
                "nekohouse": "#bb91ff"
            }[Syn.$domain.split(".")[0]] || '#8e8e93',
            Background: '#2c2c2e',
            BackgroundLight: '#3a3a3c',
            Border: '#545458',
            Text: '#f5f5f7',
            TextSecondary: '#8e8e93',
        };

        return `
            :host { --primary-color: ${Color.Primary}; font-size: 16px; }
            #overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); display: none; justify-content: center; align-items: center; z-index: 9999; backdrop-filter: blur(5px); }
            #modal { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: ${Color.Background}; color: ${Color.Text}; border-radius: 14px; padding: 24px; width: 90%; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid rgba(255, 255, 255, 0.1); transform: scale(0.95); opacity: 0; transition: transform 0.2s ease-out, opacity 0.2s ease-out; }
            #overlay.visible #modal { transform: scale(1); opacity: 1; }
            .header h2 { margin: 0 0 16px 0; font-size: 1.5em; font-weight: 600; text-align: center; }
            .tabs { display: flex; border-bottom: 1px solid ${Color.Border}; margin-bottom: 16px; }
            .tab-link { padding: 10px 16px; cursor: pointer; background: none; border: none; color: ${Color.TextSecondary}; font-size: 1em; font-weight: 500; transition: color 0.2s, border-bottom 0.2s; border-bottom: 3px solid transparent; }
            .tab-link.active { color: #fff; border-bottom: 3px solid var(--primary-color); }
            .tab-content { display: none; } .tab-content.active { display: block; }
            .form-row { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: center; padding: 14px 4px; border-bottom: 1px solid ${Color.BackgroundLight}; }
            .form-row:last-child { border-bottom: none; }
            .form-row-full { grid-template-columns: 1fr; }
            .form-row label { display: flex; align-items: center; gap: 8px; font-size: 0.95em; }
            .tooltip-icon { display: inline-flex; justify-content: center; align-items: center; width: 20px; height: 20px; border-radius: 50%; background-color: #555; color: #fff; font-weight: bold; cursor: help; position: relative; font-size: 14px; }
            .tooltip-icon.separate { margin-left: 8px; }
            .tooltip-icon:hover::after { content: attr(data-tooltip); position: absolute; bottom: 130%; left: 50%; transform: translateX(-50%); background-color: #1c1c1e; color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 0.8em; width: max-content; max-width: 250px; z-index: 10001; box-shadow: 0 4px 12px rgba(0,0,0,0.4); border: 1px solid ${Color.Border}; }
            .switch { position: relative; display: inline-block; width: 50px; height: 28px; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #555; transition: .4s; }
            .slider:before { position: absolute; content: ""; height: 22px; width: 22px; left: 3px; bottom: 3px; background-color: white; transition: .4s; }
            input:checked + .slider { background-color: var(--primary-color); }
            input:checked + .slider:before { transform: translateX(22px); }
            .slider.round { border-radius: 28px; } .slider.round:before { border-radius: 50%; }
            input[type="text"], select { background-color: ${Color.BackgroundLight}; border: 1px solid ${Color.Border}; color: ${Color.Text}; border-radius: 8px; padding: 10px; width: 120px; text-align: center; font-size: 0.9em; }
            .accordion { border: 1px solid ${Color.Border}; border-radius: 8px; margin-bottom: 16px; background-color: ${Color.BackgroundLight}; overflow: hidden; }
            .accordion-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; padding: 14px; background-color: ${Color.BackgroundLight}; }
            .accordion-icon { transition: transform 0.3s ease; font-size: 12px; }
            .accordion-content { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
            .accordion-content.show-tooltip { overflow: visible; }
            .accordion.open .accordion-icon { transform: rotate(90deg); }
            .accordion.open .accordion-content { padding: 0 14px 14px; }
            #fetch-conditional-settings { display: none; }
            .multi-select { align-items: start; }
            .multi-select-group { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-start; }
            .multi-select-btn input { display: none; }
            .multi-select-btn span { display: block; text-align: center; padding: 8px 12px; border: 1px solid ${Color.Border}; border-radius: 16px; cursor: pointer; transition: all 0.2s; font-size: 0.85em; }
            .multi-select-btn input:checked + span { background-color: var(--primary-color); color: white; border-color: var(--primary-color); }
            pre { background-color: #1c1c1e; border: 1px solid #545458; border-radius: 8px; padding: 15px; overflow-x: auto; font-size: 0.85em; line-height: 1.4; color: #e0e0e0; }
            code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; }
        `;
    };

    shadowRoot.innerHTML = `<style>${getMenuCSS()}</style>${getMenuHTML()}`;

    const overlay = shadowRoot.getElementById('overlay');
    const conditionalTrigger = shadowRoot.querySelector('input.conditional-trigger');
    const conditionalTarget = shadowRoot.getElementById(conditionalTrigger?.dataset.controls);

    const setupEventListeners = () => {
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        shadowRoot.querySelectorAll('.tab-link').forEach(link => {
            link.addEventListener('click', () => {
                const tabId = link.dataset.tab;
                shadowRoot.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
                shadowRoot.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                link.classList.add('active');
                shadowRoot.getElementById(tabId).classList.add('active');
            });
        });

        shadowRoot.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const accordion = header.parentElement;
                accordion.classList.toggle('open');
                const content = accordion.querySelector('.accordion-content');
                content.style.maxHeight = accordion.classList.contains('open') ? content.scrollHeight + "px" : null;
            });
        });

        shadowRoot.querySelectorAll('.accordion-content .tooltip-icon').forEach(icon => {
            const contentParent = icon.closest('.accordion-content');
            if (contentParent) {
                icon.addEventListener('mouseenter', () => contentParent.classList.add('show-tooltip'));
                icon.addEventListener('mouseleave', () => contentParent.classList.remove('show-tooltip'));
            }
        });

        if (conditionalTrigger && conditionalTarget) {
            const toggleConditional = () => {
                conditionalTarget.style.display = conditionalTrigger.checked ? 'block' : 'none';
            };
            conditionalTrigger.addEventListener('change', toggleConditional);
            toggleConditional();
        }
    };

    const open = () => { overlay.style.display = 'flex'; setTimeout(() => overlay.classList.add('visible'), 10); };
    const close = () => { overlay.classList.remove('visible'); setTimeout(() => { overlay.style.display = 'none'; }, 200); };

    setupEventListeners();

    return { open, close };
}