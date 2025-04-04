// ==UserScript==
// @name         媒體音量增強器
// @name:zh-TW   媒體音量增強器
// @name:zh-CN   媒体音量增强器
// @name:en      Media Volume Booster
// @version      0.0.38
// @author       Canaan HS
// @description         增強媒體音量最高至 20 倍，可記住增強設置後自動應用，部分網站可能無效或無聲，可選擇禁用。
// @description:zh-TW   增強媒體音量最高至 20 倍，可記住增強設置後自動應用，部分網站可能無效或無聲，可選擇禁用。
// @description:zh-CN   增强媒体音量最高至 20 倍，可记住增强设置后自动应用，部分网站可能无效或无声，可选择禁用。
// @description:en      Boost media volume up to 20 times, automatically apply saved settings, may not work or have no sound on some sites, can disable if needed.

// @noframes
// @match        *://*/*
// @icon         https://cdn-icons-png.flaticon.com/512/8298/8298181.png

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635

// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_getResourceURL
// @grant        GM_registerMenuCommand
// @grant        GM_addValueChangeListener
// @resource     Img https://cdn-icons-png.flaticon.com/512/8298/8298181.png
// @require      https://update.greasyfork.org/scripts/487608/1558817/ClassSyntax_min.js
// ==/UserScript==

(async () => {
    new class MediaEnhancer extends Syntax {
        constructor() {
            super();
            /* 增益用變數 */
            this.Booster = null; // 保存設置音量函數
            this.Increase = null; // 保存增量
            this.EnhanceNodes = []; // 保存被增強的節點
            this.MediaContent = null; // 保存音頻上下文實例
            this.EnhancedElement = new Map(); // 紀錄被增強的節點
            this.AudioContext = window.AudioContext || window.webkitAudioContext;

            /* 觀察用變數 */
            this.MediaObserver = null;
            this.ObserverOption = null;

            /* 頁面資訊 */
            this.Init = null;
            this.ExcludeStatus = null;
            this.Host = this.Device.Host;
            this.Lang = this.Language(this.Device.Lang);
            this.BannedHost = this.Store("g", "BannedDomains_v2", {});

            /* 獲取初始化資訊 */
            this.GetBannedHost = (result) => { // 存在數據就是被禁止的
                this.ExcludeStatus = this.BannedHost[this.Host] ?? false;
                result(!this.ExcludeStatus);
            };

            /* 禁用操作 */
            this.Banned = async () => {
                if (this.ExcludeStatus) {
                    delete this.BannedHost[this.Host]; // 從排除列表刪除
                } else {
                    this.BannedHost[this.Host] = true; // 添加到排除列表
                }
                this.Store("s", "BannedDomains_v2", this.BannedHost);
                location.reload();
            };

            /* 註冊快捷鍵(開啟菜單) */
            this.MenuHotkey = async () => {
                this.AddListener(document, "keydown", event => {
                    if (event.altKey && event.key.toUpperCase() == "B") this.BoosterMenu();
                }, { passive: true, capture: true });
            };
        };

        /* 媒體添加增益節點 */
        BoosterFactory(media_object, search_time) {
            try {
                if (!this.AudioContext) throw this.Lang.Transl("不支援音頻增強節點");
                if (!this.MediaContent) this.MediaContent = new this.AudioContext();
                if (this.MediaContent.state === "suspended") this.MediaContent.resume();

                const nodecount = this.EnhanceNodes.length; // 紀錄運行前的節點數
                for (const media of media_object) {

                    if (!media.crossOrigin) media.crossOrigin = "anonymous"; // 設置跨域
                    if (media.mediaKeys || media.encrypted || media.textTracks.length > 0) { // 檢查媒體是否受保護
                        continue;
                    };

                    const SourceNode = this.MediaContent.createMediaElementSource(media); // 音頻來源
                    const GainNode = this.MediaContent.createGain(); // 增益節點
                    const LowFilterNode = this.MediaContent.createBiquadFilter(); // 低音慮波器
                    const MidFilterNode = this.MediaContent.createBiquadFilter(); // 中音慮波器
                    const HighFilterNode = this.MediaContent.createBiquadFilter(); // 高音濾波器
                    const CompressorNode = this.MediaContent.createDynamicsCompressor(); // 動態壓縮節點

                    // 設置初始增量
                    GainNode.gain.value = this.Increase ** 2;

                    /* 低音慮波增強 */
                    LowFilterNode.type = "lowshelf";
                    LowFilterNode.gain.value = 2.2;
                    LowFilterNode.frequency.value = 200;

                    /* 中音慮波增強 */
                    MidFilterNode.type = "peaking";
                    MidFilterNode.Q.value = 1;
                    MidFilterNode.gain.value = 3;
                    MidFilterNode.frequency.value = 1200;

                    /* 高音慮波增強 */
                    HighFilterNode.type = "highshelf";
                    HighFilterNode.gain.value = 1.8;
                    HighFilterNode.frequency.value = 12000;

                    /* 設置動態壓縮器的參數 (!! 通用性測試) */
                    CompressorNode.ratio.value = 5.4; // 壓縮率 (調低會更大聲, 但容易爆音)
                    CompressorNode.knee.value = 0.4; // 壓縮過渡反應時間(越小越快)
                    CompressorNode.threshold.value = -12; // 壓縮閾值
                    CompressorNode.attack.value = 0.02; // 開始壓縮的速度
                    CompressorNode.release.value = 0.4; // 釋放壓縮的速度

                    // 進行節點連結
                    SourceNode
                        .connect(GainNode)
                        .connect(LowFilterNode)
                        .connect(MidFilterNode)
                        .connect(HighFilterNode)
                        .connect(CompressorNode)
                        .connect(this.MediaContent.destination);

                    const Interval = setInterval(() => {
                        media.volume = 1; // 將媒體音量設置為 100 % (有可能被其他腳本調整)
                    }, 1e3);
                    setTimeout(() => { clearInterval(Interval) }, 3e3); // 持續 3 秒停止

                    // 將完成的節點添加
                    this.EnhanceNodes.push({
                        GainNode: GainNode.gain,
                        LowFilterGain: LowFilterNode.gain,
                        LowFilterFreq: LowFilterNode.frequency,
                        MidFilterGain: MidFilterNode.gain,
                        MidFilterFreq: MidFilterNode.frequency,
                        HighFilterGain: HighFilterNode.gain,
                        HighFilterFreq: HighFilterNode.frequency,
                        CompressorRatio: CompressorNode.ratio,
                        CompressorKnee: CompressorNode.knee,
                        CompressorThreshold: CompressorNode.threshold,
                        CompressorAttack: CompressorNode.attack,
                        CompressorRelease: CompressorNode.release
                    });

                    // 紀錄被增強的節點
                    this.EnhancedElement.set(media, true);
                };

                // 打印完成狀態 (要有增加節點才會打印)
                if (this.EnhanceNodes.length > nodecount) {
                    this.Log(
                        this.Lang.Transl("添加增強節點成功"),
                        {
                            "Booster Media : ": media_object,
                            "Elapsed Time : ": this.Runtime(search_time, { log: false })
                        },
                        { collapsed: false }
                    );

                    // 初始化創建
                    if (!this.Init) {
                        this.Init = true;
                        this.Menu({
                            [this.Lang.Transl("📜 菜單熱鍵")]: { func: () => alert(this.Lang.Transl("熱鍵呼叫調整菜單!!\n\n快捷組合 : (Alt + B)")) },
                            [this.Lang.Transl("🛠️ 調整菜單")]: { func: () => this.BoosterMenu() }
                        }, "Menu", 2);
                        this.MenuHotkey();
                        this.StoreListen([this.Host], call => { // 全局監聽保存值變化
                            if (call.far && call.key == this.Host) { // 由遠端且觸發網域相同
                                this.Booster.setVolume(call.nv);
                            }
                        });
                    };
                };

                // 完成後繼續監聽 (5 秒後)
                setTimeout(() => {
                    this.MediaObserver.observe(document, this.ObserverOption);
                }, 5e3);

                return {
                    setVolume: increase => { // 設置音量
                        this.Increase = increase;
                        this.EnhanceNodes.forEach(Items => {
                            Items.GainNode.value = increase ** 2; // 設置增益
                        })
                    }
                };
            } catch (error) {
                this.Log(this.Lang.Transl("增強錯誤"), error, { type: "error", collapsed: false });
            }
        };

        /* 找到媒體觸發 */
        async Trigger(media_object, search_time) {
            try {
                this.Increase = this.Store("g", this.Host) ?? 1.0; // 初始增量
                this.Booster = this.BoosterFactory(media_object, search_time); // 添加節點
            } catch (error) {
                this.Log("Trigger Error : ", error, { type: "error", collapsed: false });
            }
        };

        /* 功能注入 */
        async Injec() {
            this.GetBannedHost(NotBanned => {
                const Menu = async (name) => { // 簡化註冊菜單
                    this.Menu({
                        [name]: { func: () => this.Banned() }
                    });
                };

                if (NotBanned) {
                    const FindMedia = this.Debounce((func) => {
                        const media_object = [
                            ...this.$$("video, audio", { all: true })
                        ].filter(media => !this.EnhancedElement.has(media));
                        media_object.length > 0 && func(media_object);
                    }, 400);

                    this.Observer(document, () => { // 觀察者持續觸發查找
                        const Time = this.Runtime();

                        FindMedia(media => {
                            this.MediaObserver.disconnect();
                            this.Trigger(media, Time);
                        });

                    }, { mark: "Media-Booster", attributes: false, throttle: 500 }, back => {
                        this.MediaObserver = back.ob;
                        this.ObserverOption = back.op;
                        Menu(this.Lang.Transl("❌ 禁用增幅"));
                    });
                } else Menu(this.Lang.Transl("✅ 啟用增幅"));
            });
        };

        /* 調整菜單 */
        async BoosterMenu() {
            const shadowID = "Booster_Modal_Background";
            if (this.$$(`#${shadowID}`)) return;

            const shadow = document.createElement("div");
            const shadowRoot = shadow.attachShadow({ mode: "open" });
            shadow.id = shadowID;

            shadowRoot.innerHTML = `
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
                        animation: fadeIn 0.4s ease forwards;
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
                        animation: scaleIn 0.5s ease 0.1s forwards;
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
                        <h2 class="Booster-Title">${this.Lang.Transl("音量增強器")}</h2>

                        <div class="Booster-Multiplier">
                            <span>
                                <img src="${GM_getResourceURL("Img")}">${this.Lang.Transl("增強倍數 ")}
                                <span id="Booster-CurrentValue">${this.Increase}</span>${this.Lang.Transl(" 倍")}
                            </span>
                            <input type="range" id="Adjustment-Sound-Enhancement" class="Booster-Slider" min="0" max="20.0" value="${this.Increase}" step="0.1">
                        </div>

                        <button class="Booster-Accordion">${this.Lang.Transl("低頻設定")}</button>
                        <div class="Booster-Panel">
                            <div class="Booster-Control-Group">
                                <div class="Booster-Control-Label">
                                    <span>${this.Lang.Transl("增益")}</span>
                                    <span class="Booster-Value" id="Low-Gain-Value">2.2</span>
                                </div>
                                <input type="range" id="Low-Gain" class="Booster-Mini-Slider" min="0" max="10" value="2.2" step="0.1">
                            </div>

                            <div class="Booster-Control-Group">
                                <div class="Booster-Control-Label">
                                    <span>${this.Lang.Transl("頻率")}</span>
                                    <span class="Booster-Value" id="Low-Freq-Value">200</span>
                                </div>
                                <input type="range" id="Low-Freq" class="Booster-Mini-Slider" min="50" max="500" value="200" step="10">
                            </div>
                        </div>

                        <button class="Booster-Accordion">${this.Lang.Transl("中頻設定")}</button>
                        <div class="Booster-Panel">
                            <div class="Booster-Control-Group">
                                <div class="Booster-Control-Label">
                                    <span>${this.Lang.Transl("增益")}</span>
                                    <span class="Booster-Value" id="Mid-Gain-Value">3</span>
                                </div>
                                <input type="range" id="Mid-Gain" class="Booster-Mini-Slider" min="0" max="10" value="3" step="0.1">
                            </div>

                            <div class="Booster-Control-Group">
                                <div class="Booster-Control-Label">
                                    <span>${this.Lang.Transl("頻率")}</span>
                                    <span class="Booster-Value" id="Mid-Freq-Value">1200</span>
                                </div>
                                <input type="range" id="Mid-Freq" class="Booster-Mini-Slider" min="500" max="5000" value="1200" step="100">
                            </div>

                            <div class="Booster-Control-Group">
                                <div class="Booster-Control-Label">
                                    <span>${this.Lang.Transl("Q值")}</span>
                                    <span class="Booster-Value" id="Mid-Q-Value">1</span>
                                </div>
                                <input type="range" id="Mid-Q" class="Booster-Mini-Slider" min="0.1" max="5" value="1" step="0.1">
                            </div>
                        </div>

                        <button class="Booster-Accordion">${this.Lang.Transl("高頻設定")}</button>
                        <div class="Booster-Panel">
                            <div class="Booster-Control-Group">
                                <div class="Booster-Control-Label">
                                    <span>${this.Lang.Transl("增益")}</span>
                                    <span class="Booster-Value" id="High-Gain-Value">1.8</span>
                                </div>
                                <input type="range" id="High-Gain" class="Booster-Mini-Slider" min="0" max="10" value="1.8" step="0.1">
                            </div>

                            <div class="Booster-Control-Group">
                                <div class="Booster-Control-Label">
                                    <span>${this.Lang.Transl("頻率")}</span>
                                    <span class="Booster-Value" id="High-Freq-Value">12000</span>
                                </div>
                                <input type="range" id="High-Freq" class="Booster-Mini-Slider" min="5000" max="20000" value="12000" step="500">
                            </div>
                        </div>

                        <button class="Booster-Accordion">${this.Lang.Transl("動態壓縮")}</button>
                        <div class="Booster-Panel">
                            <div class="Booster-Control-Group">
                                <div class="Booster-Control-Label">
                                    <span>${this.Lang.Transl("壓縮率")}</span>
                                    <span class="Booster-Value" id="Comp-Ratio-Value">5.4</span>
                                </div>
                                <input type="range" id="Comp-Ratio" class="Booster-Mini-Slider" min="1" max="20" value="5.4" step="0.1">
                            </div>

                            <div class="Booster-Control-Group">
                                <div class="Booster-Control-Label">
                                    <span>${this.Lang.Transl("過渡反應")}</span>
                                    <span class="Booster-Value" id="Comp-Knee-Value">0.4</span>
                                </div>
                                <input type="range" id="Comp-Knee" class="Booster-Mini-Slider" min="0" max="1" value="0.4" step="0.1">
                            </div>

                            <div class="Booster-Control-Group">
                                <div class="Booster-Control-Label">
                                    <span>${this.Lang.Transl("閾值")}</span>
                                    <span class="Booster-Value" id="Comp-Threshold-Value">-12</span>
                                </div>
                                <input type="range" id="Comp-Threshold" class="Booster-Mini-Slider" min="-50" max="0" value="-12" step="1">
                            </div>

                            <div class="Booster-Control-Group">
                                <div class="Booster-Control-Label">
                                    <span>${this.Lang.Transl("起音速度")}</span>
                                    <span class="Booster-Value" id="Comp-Attack-Value">0.02</span>
                                </div>
                                <input type="range" id="Comp-Attack" class="Booster-Mini-Slider" min="0" max="0.5" value="0.02" step="0.01">
                            </div>

                            <div class="Booster-Control-Group">
                                <div class="Booster-Control-Label">
                                    <span>${this.Lang.Transl("釋放速度")}</span>
                                    <span class="Booster-Value" id="Comp-Release-Value">0.4</span>
                                </div>
                                <input type="range" id="Comp-Release" class="Booster-Mini-Slider" min="0" max="1" value="0.4" step="0.05">
                            </div>
                        </div>

                        <div class="Booster-Buttons">
                            <button class="Booster-Modal-Button" id="Booster-Menu-Close">${this.Lang.Transl("關閉")}</button>
                            <button class="Booster-Modal-Button" id="Booster-Sound-Save">${this.Lang.Transl("保存")}</button>
                        </div>
                    </div>
                </Booster_Modal_Background>
            `;
            document.body.appendChild(shadow);

            const shadowGate = shadow.shadowRoot;
            const Modal = shadowGate.querySelector("Booster_Modal_Background");

            // 關閉菜單
            function DeleteMenu() {
                shadow.remove();
            };

            // 監聽主增益設定拉條
            const CurrentValue = shadowGate.querySelector("#Booster-CurrentValue");
            const Slider = shadowGate.querySelector("#Adjustment-Sound-Enhancement");
            this.Listen(Slider, "input", event => {
                const Current = event.target.value;
                CurrentValue.textContent = Current;
                this.Booster.setVolume(Current);
                GainNode.gain.value = Current ** 2;
            });

            // 手風琴菜單
            const accordions = shadowGate.querySelectorAll(".Booster-Accordion");
            accordions.forEach(accordion => {
                accordion.addEventListener("click", function () {
                    this.classList.toggle("active");
                    const panel = this.nextElementSibling;

                    if (panel.style.maxHeight) {
                        panel.style.maxHeight = null;
                        panel.classList.remove("active");
                    } else {
                        panel.style.maxHeight = panel.scrollHeight + "px";
                        panel.classList.add("active");
                    }
                })
            });

            // 低頻控制
            const lowGainSlider = shadowGate.querySelector("#Low-Gain");
            const lowFreqSlider = shadowGate.querySelector("#Low-Freq");
            if (lowGainSlider && lowFreqSlider) {
                this.Listen(lowGainSlider, "input", event => {
                    shadowGate.querySelector("#Low-Gain-Value").textContent = event.target.value;
                    LowFilterNode.gain.value = parseFloat(event.target.value);
                });

                this.Listen(lowFreqSlider, "input", event => {
                    shadowGate.querySelector("#Low-Freq-Value").textContent = event.target.value;
                    LowFilterNode.frequency.value = parseFloat(event.target.value);
                });
            }

            // 中頻控制
            const midGainSlider = shadowGate.querySelector("#Mid-Gain");
            const midFreqSlider = shadowGate.querySelector("#Mid-Freq");
            const midQSlider = shadowGate.querySelector("#Mid-Q");
            if (midGainSlider && midFreqSlider && midQSlider) {
                this.Listen(midGainSlider, "input", event => {
                    shadowGate.querySelector("#Mid-Gain-Value").textContent = event.target.value;
                    MidFilterNode.gain.value = parseFloat(event.target.value);
                });

                this.Listen(midFreqSlider, "input", event => {
                    shadowGate.querySelector("#Mid-Freq-Value").textContent = event.target.value;
                    MidFilterNode.frequency.value = parseFloat(event.target.value);
                });

                this.Listen(midQSlider, "input", event => {
                    shadowGate.querySelector("#Mid-Q-Value").textContent = event.target.value;
                    MidFilterNode.Q.value = parseFloat(event.target.value);
                });
            }

            // 高頻控制
            const highGainSlider = shadowGate.querySelector("#High-Gain");
            const highFreqSlider = shadowGate.querySelector("#High-Freq");
            if (highGainSlider && highFreqSlider) {
                this.Listen(highGainSlider, "input", event => {
                    shadowGate.querySelector("#High-Gain-Value").textContent = event.target.value;
                    HighFilterNode.gain.value = parseFloat(event.target.value);
                });

                this.Listen(highFreqSlider, "input", event => {
                    shadowGate.querySelector("#High-Freq-Value").textContent = event.target.value;
                    HighFilterNode.frequency.value = parseFloat(event.target.value);
                });
            }

            // 壓縮器控制
            const compRatioSlider = shadowGate.querySelector("#Comp-Ratio");
            const compKneeSlider = shadowGate.querySelector("#Comp-Knee");
            const compThresholdSlider = shadowGate.querySelector("#Comp-Threshold");
            const compAttackSlider = shadowGate.querySelector("#Comp-Attack");
            const compReleaseSlider = shadowGate.querySelector("#Comp-Release");

            if (compRatioSlider && compKneeSlider && compThresholdSlider && compAttackSlider && compReleaseSlider) {
                this.Listen(compRatioSlider, "input", event => {
                    shadowGate.querySelector("#Comp-Ratio-Value").textContent = event.target.value;
                    CompressorNode.ratio.value = parseFloat(event.target.value);
                });

                this.Listen(compKneeSlider, "input", event => {
                    shadowGate.querySelector("#Comp-Knee-Value").textContent = event.target.value;
                    CompressorNode.knee.value = parseFloat(event.target.value);
                });

                this.Listen(compThresholdSlider, "input", event => {
                    shadowGate.querySelector("#Comp-Threshold-Value").textContent = event.target.value;
                    CompressorNode.threshold.value = parseFloat(event.target.value);
                });

                this.Listen(compAttackSlider, "input", event => {
                    shadowGate.querySelector("#Comp-Attack-Value").textContent = event.target.value;
                    CompressorNode.attack.value = parseFloat(event.target.value);
                });

                this.Listen(compReleaseSlider, "input", event => {
                    shadowGate.querySelector("#Comp-Release-Value").textContent = event.target.value;
                    CompressorNode.release.value = parseFloat(event.target.value);
                });
            }

            // 監聽保存關閉
            this.Listen(Modal, "click", click => {
                click.stopPropagation();
                const target = click.target;
                if (target.id === "Booster-Sound-Save") {
                    const value = parseFloat(Slider.value);
                    this.Increase = value;
                    this.Store("s", this.Host, value);
                    DeleteMenu();
                } else if (
                    target.id === "Booster-Menu-Close" || target.id === "Booster-Modal-Menu"
                ) { DeleteMenu() }
            });
        };

        /* 語言 */
        Language(lang) {
            const Word = {
                Traditional: {},
                Simplified: {
                    "✅ 啟用增幅": "✅ 启用增幅",
                    "📜 菜單熱鍵": "📜 菜单热键",
                    "🛠️ 調整菜單": "🛠️ 调整菜单",
                    "關閉": "关闭",
                    "音量增強": "音量增强",
                    "增強倍數 ": "增强倍数 ",
                    "增強錯誤": "增强错误",
                    "添加增強節點成功": "添加增强节点成功",
                    "不支援音頻增強節點": "不支持音频增强节点",
                    "熱鍵呼叫調整菜單!!\n\n快捷組合 : (Alt + B)": "热键呼叫调整菜单!!\n\n快捷组合 : (Alt + B)"
                },
                English: {
                    "❌ 禁用增幅": "❌ Disable Boost",
                    "✅ 啟用增幅": "✅ Enable Boost",
                    "📜 菜單熱鍵": "📜 Menu Hotkey",
                    "🛠️ 調整菜單": "🛠️ Adjust Menu",
                    " 倍": "x",
                    "關閉": "Close",
                    "保存": "Save",
                    "音量增強": "Volume Boost",
                    "增強倍數 ": "Boost Multiplier ",
                    "增強錯誤": "Boost Error",
                    "添加增強節點成功": "Successfully Added Boost Node",
                    "不支援音頻增強節點": "Audio Boost Node Not Supported",
                    "熱鍵呼叫調整菜單!!\n\n快捷組合 : (Alt + B)": "Hotkey to Call Adjust Menu!!\n\nShortcut: (Alt + B)"
                }
            }, Match = {
                "en-US": Word.English,
                "zh-CN": Word.Simplified,
                "zh-SG": Word.Simplified,
                "zh-TW": Word.Traditional,
                "zh-HK": Word.Traditional,
                "zh-MO": Word.Traditional
            }, ML = Match[lang] ?? Match["en-US"];
            return {
                Transl: (Str) => ML[Str] ?? Str,
            };
        };
    }().Injec();
})();