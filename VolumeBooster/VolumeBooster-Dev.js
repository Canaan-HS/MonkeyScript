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

    const { Transl } = Language(); // 語言翻譯

    const BannedDomains = (() => {
        let Banned = new Set(Syn.gV("Banned", [])); // 禁用網域
        let OldData = Syn.gV("BannedDomains_v2");

        if (OldData) {
            const old = Object.keys(OldData);
            Syn.sV("Banned", old); // 將舊數據轉換為新格式
            Syn.dV("BannedDomains_v2"); // 刪除舊數據
            Banned = new Set(old);
        };

        let ExcludeStatus = Banned.has(Syn.$domain); // 排除狀態

        return {
            IsEnabled: (callback) => callback(!ExcludeStatus), // 返回排除狀態
            AddBanned: async () => {
                ExcludeStatus
                    ? Banned.delete(Syn.$domain)
                    : Banned.add(Syn.$domain);

                Syn.sV("Banned", [...Banned]); // 更新禁用網域
                location.reload(); // 重新加載頁面
            }
        }
    })();

    /* 主要函數 */
    function MediaEnhancer() {
        let Initialized = false; // 是否初始化
        let MediaObserver = null; // 媒體觀察者
        let ObserverOption = null; // 觀察者選項

        let Control = null; // 增強控制器
        let Updated = false; // 是否已更新
        const Parame = {}; // 增強參數
        const EnhancedNodes = []; // 儲存增強節點 (音頻節點)
        const EnhancedElements = new Map(); // 儲存增強元素 (媒體元素)

        let MediaAudioContent = null; // 儲存音頻上下文 實例
        const AudioContext = window.AudioContext || window.webkitAudioContext; // 音頻上下文

        const UpdateParame = () => {
            let Config = Syn.gV(Syn.$domain, {}); // 獲取當前網域設置

            if (typeof Config === "number") {
                Config = { Gain: Config }; // 舊數據轉移
            };

            Object.assign(Parame, {
                Gain: Config.Gain ?? 1.0,
                LowFilterGain: Config.LowFilterGain ?? 1.2,
                LowFilterFreq: Config.LowFilterFrequency ?? 200,
                MidFilterQ: Config.MidFilterQ ?? 1,
                MidFilterGain: Config.MidFilterGain ?? 1.6,
                MidFilterFreq: Config.MidFilterFrequency ?? 2000,
                HighFilterGain: Config.HighFilterGain ?? 1.8,
                HighFilterFreq: Config.HighFilterFreq ?? 10000,
                CompressorRatio: Config.CompressorRatio ?? 3, // 壓縮率 (調低會更大聲, 但容易爆音)
                CompressorKnee: Config.CompressorKnee ?? 4, // 壓縮過渡反應時間(越小越快)
                CompressorThreshold: Config.CompressorThreshold ?? -8, // 壓縮閾值
                CompressorAttack: Config.CompressorAttack ?? 0.03, // 開始壓縮的速度
                CompressorRelease: Config.CompressorRelease ?? 0.2, // 釋放壓縮的速度
            })
        };

        /* 註冊快捷鍵(開啟菜單) */
        const MenuHotkey = async () => {
            Syn.onEvent(document, "keydown", event => {
                if (event.altKey && event.key.toUpperCase() == "B") EnhancerMenu();
            }, { passive: true, capture: true, mark: "Volume-Booster-Hotkey" });
        };

        /* 增強處理 */
        function BoosterCore(media_object) {
            try {
                if (!AudioContext) throw new Error(Transl("不支援音頻增強節點"));
                if (!MediaAudioContent) MediaAudioContent = new AudioContext();
                if (MediaAudioContent.state === "suspended") MediaAudioContent.resume();

                const nodecount = EnhancedNodes.length; // 紀錄運行前的節點數
                for (const media of media_object) {

                    if (!media.crossOrigin) media.crossOrigin = "anonymous"; // 設置跨域
                    if (media.mediaKeys || media.encrypted || media.textTracks.length > 0) { // 檢查媒體是否受保護
                        continue;
                    };

                    const SourceNode = MediaAudioContent.createMediaElementSource(media); // 音頻來源
                    const GainNode = MediaAudioContent.createGain(); // 增益節點
                    const LowFilterNode = MediaAudioContent.createBiquadFilter(); // 低音慮波器
                    const MidFilterNode = MediaAudioContent.createBiquadFilter(); // 中音慮波器
                    const HighFilterNode = MediaAudioContent.createBiquadFilter(); // 高音濾波器
                    const CompressorNode = MediaAudioContent.createDynamicsCompressor(); // 動態壓縮節點

                    // 設置初始增量
                    GainNode.gain.value = Parame.Gain;

                    /* 低音慮波增強 */
                    LowFilterNode.type = "lowshelf";
                    LowFilterNode.gain.value = Parame.LowFilterGain;
                    LowFilterNode.frequency.value = Parame.LowFilterFreq;

                    /* 中音慮波增強 */
                    MidFilterNode.type = "peaking";
                    MidFilterNode.Q.value = Parame.MidFilterQ;
                    MidFilterNode.gain.value = Parame.MidFilterGain;
                    MidFilterNode.frequency.value = Parame.MidFilterFreq;

                    /* 高音慮波增強 */
                    HighFilterNode.type = "highshelf";
                    HighFilterNode.gain.value = Parame.HighFilterGain;
                    HighFilterNode.frequency.value = Parame.HighFilterFreq;

                    /* 設置動態壓縮器的參數 */
                    CompressorNode.ratio.value = Parame.CompressorRatio;
                    CompressorNode.knee.value = Parame.CompressorKnee;
                    CompressorNode.threshold.value = Parame.CompressorThreshold;
                    CompressorNode.attack.value = Parame.CompressorAttack;
                    CompressorNode.release.value = Parame.CompressorRelease;

                    // 節點連結
                    SourceNode
                        .connect(GainNode)
                        .connect(LowFilterNode)
                        .connect(MidFilterNode)
                        .connect(HighFilterNode)
                        .connect(CompressorNode)
                        .connect(MediaAudioContent.destination);

                    // 將完成的節點添加
                    EnhancedNodes.push({
                        Gain: GainNode.gain,
                        LowFilterGain: LowFilterNode.gain,
                        LowFilterFreq: LowFilterNode.frequency,
                        MidFilterQ: MidFilterNode.Q,
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
                    EnhancedElements.set(media, true);
                };

                // 打印完成狀態 (要有增加節點才會打印)
                if (EnhancedNodes.length > nodecount) {
                    Syn.Log(
                        Transl("添加增強節點成功"), { 'Booster Media : ': media_object }, { collapsed: false }
                    );

                    // 初始化創建
                    if (!Initialized) {
                        Initialized = true;
                        MenuHotkey();

                        Syn.Menu({
                            [Transl("📜 菜單熱鍵")]: () => alert(Transl("熱鍵呼叫調整菜單!!\n\n快捷組合 : (Alt + B)")),
                            [Transl("🛠️ 調整菜單")]: () => EnhancerMenu()
                        }, {index: 2});

                        Syn.StoreListen([Syn.$domain], call => { // 全局監聽保存值變化
                            if (call.far && call.key == Syn.$domain) { // 由遠端且觸發網域相同
                                Object.entries(call.nv).forEach(([type, value]) => {
                                    Control.SetBooster(type, value); // 更新增強參數
                                })
                            }
                        })
                    }
                };

                setTimeout(() => {
                    MediaObserver.observe(document, ObserverOption);
                }, 3e3); // 3 秒後重新啟動觀察者

                return {
                    SetBooster: (type, value) => { // 設置增強參數
                        Parame[type] = value; // 更新增強參數 (原始值)
                        EnhancedNodes.forEach(Items => {
                            Items[type].value = value;
                        })
                    }
                }
            } catch (error) {
                Syn.Log(Transl("增強錯誤"), error, { type: "error", collapsed: false });
            }
        };

        function Trigger(media) {
            try {
                if (!Updated) { // ? 動態更新是為了首次觸發時 能取得最新的配置
                    Updated = true;
                    UpdateParame();
                };

                Control = BoosterCore(media);
            } catch (error) {
                Syn.Log("Trigger Error : ", error, { type: "error", collapsed: false });
            }
        };

        function Start() {
            BannedDomains.IsEnabled(Status => {
                const Menu = async (name) => { // 簡化註冊菜單
                    Syn.Menu({
                        [name]: () => BannedDomains.AddBanned()
                    })
                };

                if (Status) {

                    // 查找媒體元素
                    const FindMedia = Syn.Debounce((func) => {
                        const media = [];

                        const tree = document.createTreeWalker(
                            Syn.body,
                            NodeFilter.SHOW_ELEMENT,
                            {
                                acceptNode: (node) => {
                                    const tag = node.tagName;

                                    if (tag === 'VIDEO' || tag === 'AUDIO') {
                                        if (!EnhancedElements.has(node))
                                            return NodeFilter.FILTER_ACCEPT;
                                    };

                                    return NodeFilter.FILTER_SKIP;
                                } 
                            }
                        );

                        while (tree.nextNode()) {
                            media.push(tree.currentNode);
                        };

                        media.length > 0 && func(media);
                    }, 50);

                    // 觀察者持續觸發查找
                    Syn.Observer(document, () => {

                        FindMedia(media => {
                            MediaObserver.disconnect(); // 停止觀察
                            Trigger(media);
                        })

                    }, { mark: "Media-Booster", attributes: false, throttle: 200 }, ({ ob, op }) => {
                        MediaObserver = ob;
                        ObserverOption = op;
                        Menu(Transl("❌ 禁用增幅"));
                    });

                } else Menu(Transl("✅ 啟用增幅"));
            })
        };

        return {
            Start,
            SetControl: (...args) => Control.SetBooster(...args),
            Parame
        }
    };

    /* 語言翻譯 */
    function Language() {
        const Word = Syn.TranslMatcher({
            Traditional: {},
            Simplified: {
                "📜 菜單熱鍵": "📜 菜单热键",
                "🛠️ 調整菜單": "🛠️ 调整菜单",
                "❌ 禁用增幅": "❌ 禁用增幅",
                "✅ 啟用增幅": "✅ 启用增幅",
                "增強錯誤": "增强错误",
                "音量增強器": "音量增强器",
                "增強倍數 ": "增强倍数 ",
                " 倍": " 倍",
                "增益": "增益",
                "頻率": "频率",
                "Q值": "Q值",
                "低頻設定": "低频设置",
                "中頻設定": "中频设置",
                "高頻設定": "高频设置",
                "動態壓縮": "动态压缩",
                "壓縮率": "压缩率",
                "過渡反應": "过渡反应",
                "閾值": "阈值",
                "起音速度": "起音速度",
                "釋放速度": "释放速度",
                "關閉": "关闭",
                "保存": "保存",
                "不支援音頻增強節點": "不支持音频增强节点",
                "添加增強節點成功": "添加增强节点成功",
                "熱鍵呼叫調整菜單!!\n\n快捷組合 : (Alt + B)": "热键调用调整菜单!!\n\n快捷组合 : (Alt + B)"
            },
            English: {
                "📜 菜單熱鍵": "📜 Menu Hotkey",
                "🛠️ 調整菜單": "🛠️ Adjustment Menu",
                "❌ 禁用增幅": "❌ Disable Amplification",
                "✅ 啟用增幅": "✅ Enable Amplification",
                "增強錯誤": "Enhancement Error",
                "音量增強器": "Volume Booster",
                "增強倍數 ": "Enhancement Factor ",
                " 倍": " times",
                "增益": "Gain",
                "頻率": "Frequency",
                "Q值": "Q Factor",
                "低頻設定": "Low Frequency Settings",
                "中頻設定": "Mid Frequency Settings",
                "高頻設定": "High Frequency Settings",
                "動態壓縮": "Dynamic Compression",
                "壓縮率": "Compression Ratio",
                "過渡反應": "Knee",
                "閾值": "Threshold",
                "起音速度": "Attack Time",
                "釋放速度": "Release Time",
                "關閉": "Close",
                "保存": "Save",
                "不支援音頻增強節點": "Audio Enhancement Node Not Supported",
                "添加增強節點成功": "Enhancement Node Added Successfully",
                "熱鍵呼叫調整菜單!!\n\n快捷組合 : (Alt + B)": "Hotkey Menu Opened!!\n\nShortcut Combination: (Alt + B)"
            }
        });

        return {
            Transl: (Str) => Word[Str] ?? Str
        }
    };

    /* ===== 入口調用 ===== */
    const { Start, SetControl, Parame } = MediaEnhancer();
    Start(); // 啟動增強器

    /* 調整菜單 */
    async function EnhancerMenu() {
        const shadowID = "Booster_Modal_Background";
        if (Syn.$q(`#${shadowID}`)) return;

        const shadow = Syn.createElement("div", { id: shadowID });
        const shadowRoot = shadow.attachShadow({ mode: "open" });

        shadowRoot.$iHtml(`
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
                    <h2 class="Booster-Title">${Transl("音量增強器")}</h2>

                    <div class="Booster-Multiplier">
                        <span>
                            <img src="${GM_getResourceURL("Img")}">${Transl("增強倍數 ")}
                            <span id="Gain-Value" class="Booster-Value">${Parame.Gain}</span>${Transl(" 倍")}
                        </span>
                        <input type="range" id="Gain" class="Booster-Slider" min="0" max="20.0" value="${Parame.Gain}" step="0.1">
                    </div>

                    <button class="Booster-Accordion">${Transl("低頻設定")}</button>
                    <div class="Booster-Panel">
                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${Transl("增益")}</span>
                                <span id="LowFilterGain-Value" class="Booster-Value">${Parame.LowFilterGain}</span>
                            </div>
                            <input type="range" id="LowFilterGain" class="Booster-Mini-Slider" min="-12" max="12" value="${Parame.LowFilterGain}" step="0.1">
                        </div>

                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${Transl("頻率")}</span>
                                <span id="LowFilterFreq-Value" class="Booster-Value">${Parame.LowFilterFreq}</span>
                            </div>
                            <input type="range" id="LowFilterFreq" class="Booster-Mini-Slider" min="20" max="1000" value="${Parame.LowFilterFreq}" step="20">
                        </div>
                    </div>

                    <button class="Booster-Accordion">${Transl("中頻設定")}</button>
                    <div class="Booster-Panel">
                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${Transl("增益")}</span>
                                <span id="MidFilterGain-Value" class="Booster-Value">${Parame.MidFilterGain}</span>
                            </div>
                            <input type="range" id="MidFilterGain" class="Booster-Mini-Slider" min="-12" max="12" value="${Parame.MidFilterGain}" step="0.1">
                        </div>

                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${Transl("頻率")}</span>
                                <span id="MidFilterFreq-Value" class="Booster-Value">${Parame.MidFilterFreq}</span>
                            </div>
                            <input type="range" id="MidFilterFreq" class="Booster-Mini-Slider" min="200" max="8000" value="${Parame.MidFilterFreq}" step="100">
                        </div>

                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${Transl("Q值")}</span>
                                <span id="MidFilterQ-Value" class="Booster-Value">${Parame.MidFilterQ}</span>
                            </div>
                            <input type="range" id="MidFilterQ" class="Booster-Mini-Slider" min="0.5" max="5" value="${Parame.MidFilterQ}" step="0.1">
                        </div>
                    </div>

                    <button class="Booster-Accordion">${Transl("高頻設定")}</button>
                    <div class="Booster-Panel">
                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${Transl("增益")}</span>
                                <span id="HighFilterGain-Value" class="Booster-Value">${Parame.HighFilterGain}</span>
                            </div>
                            <input type="range" id="HighFilterGain" class="Booster-Mini-Slider" min="-12" max="12" value="${Parame.HighFilterGain}" step="0.1">
                        </div>

                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${Transl("頻率")}</span>
                                <span id="HighFilterFreq-Value" class="Booster-Value">${Parame.HighFilterFreq}</span>
                            </div>
                            <input type="range" id="HighFilterFreq" class="Booster-Mini-Slider" min="2000" max="22000" value="${Parame.HighFilterFreq}" step="500">
                        </div>
                    </div>

                    <button class="Booster-Accordion">${Transl("動態壓縮")}</button>
                    <div class="Booster-Panel">
                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${Transl("壓縮率")}</span>
                                <span id="CompressorRatio-Value" class="Booster-Value">${Parame.CompressorRatio}</span>
                            </div>
                            <input type="range" id="CompressorRatio" class="Booster-Mini-Slider" min="1" max="30" value="${Parame.CompressorRatio}" step="0.1">
                        </div>

                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${Transl("過渡反應")}</span>
                                <span id="CompressorKnee-Value" class="Booster-Value">${Parame.CompressorKnee}</span>
                            </div>
                            <input type="range" id="CompressorKnee" class="Booster-Mini-Slider" min="0" max="40" value="${Parame.CompressorKnee}" step="1">
                        </div>

                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${Transl("閾值")}</span>
                                <span id="CompressorThreshold-Value" class="Booster-Value">${Parame.CompressorThreshold}</span>
                            </div>
                            <input type="range" id="CompressorThreshold" class="Booster-Mini-Slider" min="-60" max="0" value="${Parame.CompressorThreshold}" step="1">
                        </div>

                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${Transl("起音速度")}</span>
                                <span id="CompressorAttack-Value" class="Booster-Value">${Parame.CompressorAttack}</span>
                            </div>
                            <input type="range" id="CompressorAttack" class="Booster-Mini-Slider" min="0.001" max="0.5" value="${Parame.CompressorAttack}" step="0.001">
                        </div>

                        <div class="Booster-Control-Group">
                            <div class="Booster-Control-Label">
                                <span>${Transl("釋放速度")}</span>
                                <span id="CompressorRelease-Value" class="Booster-Value">${Parame.CompressorRelease}</span>
                            </div>
                            <input type="range" id="CompressorRelease" class="Booster-Mini-Slider" min="0.01" max="2" value="${Parame.CompressorRelease}" step="0.01">
                        </div>
                    </div>

                    <div class="Booster-Buttons">
                        <button class="Booster-Modal-Button" id="Booster-Menu-Close">${Transl("關閉")}</button>
                        <button class="Booster-Modal-Button" id="Booster-Sound-Save">${Transl("保存")}</button>
                    </div>
                </div>
            </Booster_Modal_Background>
        `);
        document.body.appendChild(shadow);

        const shadowGate = shadow.shadowRoot;
        const Modal = shadowGate.querySelector("Booster_Modal_Background");
        const Content = shadowGate.querySelector(".Booster-Modal-Content");

        // 添加開啟樣式
        Modal.classList.add("open");
        Content.classList.add("open");

        // 關閉菜單
        function DeleteMenu() {
            Modal.classList.replace("open", "close");
            Content.classList.replace("open", "close");

            setTimeout(() => {
                shadow.remove();
            }, 800)
        };

        // 建立顯示值對應表
        const displayMap = {
            ...Object.fromEntries(
                [...shadowGate.querySelectorAll(".Booster-Value")].map(el => [el.id, el])
            )
        };

        // 監聽滑桿變化
        Content.addEventListener("input", event => {
            const target = event.target;

            const id = target.id;
            const value = target.value;

            displayMap[`${id}-Value`].textContent = value; // 更新顯示值
            SetControl(id, value);
        });

        // 監聽保存關閉
        Modal.addEventListener("click", click => {
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
                Syn.sV(Syn.domain, Parame);
                DeleteMenu();
            } else if (
                target.id === "Booster-Menu-Close" || target.id === "Booster-Modal-Menu"
            ) {
                DeleteMenu()
            }
        });
    };

})();