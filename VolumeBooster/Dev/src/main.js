import {
    monkeyWindow,
    GM_setValue,
    GM_getValue,
    GM_deleteValue,
    GM_getResourceURL,
    GM_registerMenuCommand,
    GM_addValueChangeListener,
} from 'vite-plugin-monkey/dist/client';
const { Lib } = monkeyWindow;

import { Share, Default } from './store.js';
import CreateMenu from './menu.js';
import Words from './language.js';

const bannedDomains = (() => {
    let banned = new Set(Lib.getV("Banned", [])); // 禁用網域
    let excludeStatus = banned.has(Lib.$domain); // 排除狀態

    return {
        isEnabled: (callback) => callback(!excludeStatus), // 返回排除狀態
        addBanned: async () => {
            excludeStatus
                ? banned.delete(Lib.$domain)
                : banned.add(Lib.$domain);

            Lib.setV("Banned", [...banned]); // 更新禁用網域
            location.reload(); // 重新加載頁面
        }
    }
})();

const { Transl } = (() => {
    const matcher = Lib.translMatcher(Words);
    return {
        Transl: (Str) => matcher[Str] ?? Str,
    }
})();

(async () => {
    let menu = null;

    let updated = false; // 是否已更新
    let processing = false; // 是否處理中
    let initialized = false; // 是否初始化

    const enhancedNodes = []; // 儲存增強節點 (音頻節點)
    const processedElements = new Map(); // 儲存被處理過的元素 (媒體元素)

    let mediaAudioContent = null; // 儲存音頻上下文 實例
    const audioContext = window.AudioContext || window.webkitAudioContext; // 音頻上下文

    const updateParame = () => {
        let Config = Lib.getV(Lib.$domain, {}); // 獲取當前網域設置

        if (typeof Config === "number") {
            Config = { Gain: Config }; // 舊數據轉移
        };

        Share.Parame = Object.assign(Default, Config); // 更新參數
    };

    /* 增強處理 */
    function boosterCore(mediaObject) {
        try {
            if (!audioContext) throw new Error(Transl("不支援音頻增強節點"));
            if (!mediaAudioContent) mediaAudioContent = new audioContext();
            if (mediaAudioContent.state === "suspended") mediaAudioContent.resume();

            const successNode = []; // 紀錄增強成功的節點

            for (const media of mediaObject) {
                processedElements.set(media, true); // 紀錄被增強的節點

                if (
                    media.mediaKeys || media.encrypted // 檢查 DRM 保護
                    || (window.MediaSource && media.srcObject instanceof MediaSource) // 檢查 MSE
                ) {
                    Lib.log(
                        Transl("不支援的媒體跳過"), media, { collapsed: false }
                    );
                    continue;
                };

                try {
                    if (!media.crossOrigin) media.crossOrigin = "anonymous"; // 設置跨域

                    const SourceNode = mediaAudioContent.createMediaElementSource(media); // 音頻來源
                    const GainNode = mediaAudioContent.createGain(); // 增益節點
                    const LowFilterNode = mediaAudioContent.createBiquadFilter(); // 低音慮波器
                    const MidFilterNode = mediaAudioContent.createBiquadFilter(); // 中音慮波器
                    const HighFilterNode = mediaAudioContent.createBiquadFilter(); // 高音濾波器
                    const CompressorNode = mediaAudioContent.createDynamicsCompressor(); // 動態壓縮節點

                    // 設置初始增量
                    GainNode.gain.value = Share.Parame.Gain;

                    /* 低音慮波增強 */
                    LowFilterNode.type = "lowshelf";
                    LowFilterNode.gain.value = Share.Parame.LowFilterGain;
                    LowFilterNode.frequency.value = Share.Parame.LowFilterFreq;

                    /* 中音慮波增強 */
                    MidFilterNode.type = "peaking";
                    MidFilterNode.Q.value = Share.Parame.MidFilterQ;
                    MidFilterNode.gain.value = Share.Parame.MidFilterGain;
                    MidFilterNode.frequency.value = Share.Parame.MidFilterFreq;

                    /* 高音慮波增強 */
                    HighFilterNode.type = "highshelf";
                    HighFilterNode.gain.value = Share.Parame.HighFilterGain;
                    HighFilterNode.frequency.value = Share.Parame.HighFilterFreq;

                    /* 設置動態壓縮器的參數 */
                    CompressorNode.ratio.value = Share.Parame.CompressorRatio;
                    CompressorNode.knee.value = Share.Parame.CompressorKnee;
                    CompressorNode.threshold.value = Share.Parame.CompressorThreshold;
                    CompressorNode.attack.value = Share.Parame.CompressorAttack;
                    CompressorNode.release.value = Share.Parame.CompressorRelease;

                    // 節點連結
                    SourceNode
                        .connect(GainNode)
                        .connect(LowFilterNode)
                        .connect(MidFilterNode)
                        .connect(HighFilterNode)
                        .connect(CompressorNode)
                        .connect(mediaAudioContent.destination);

                    // 將完成的節點添加
                    enhancedNodes.push({
                        Connected: true,
                        Destination: mediaAudioContent.destination,
                        SourceNode, GainNode, LowFilterNode, MidFilterNode, HighFilterNode, CompressorNode,
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

                    // 紀錄增強成功的節點
                    successNode.push(media);
                } catch (e) {
                    Lib.log(
                        Transl("添加增強節點失敗"), media, { collapsed: false }
                    );
                }
            };

            // 打印完成狀態 (要有增加節點才會打印)
            if (successNode.length > 0) {
                processing = false;

                Lib.log(
                    Transl("添加增強節點成功"), successNode, { collapsed: false }
                );

                // 初始化 菜單創建
                if (!initialized) {
                    initialized = true;

                    let disconnected = false;

                    function regChange() {
                        Lib.regMenu({
                            [Transl(disconnected ? "🔗 恢復增幅" : "✂️ 斷開增幅")]: () => {
                                if (enhancedNodes.length === 0) {
                                    alert(Transl("當前沒有被增幅的媒體"));
                                    return;
                                };

                                enhancedNodes.forEach(items => {
                                    const { Connected, SourceNode, GainNode, LowFilterNode, MidFilterNode, HighFilterNode, CompressorNode, Destination } = items;

                                    if (disconnected && !Connected) {
                                        SourceNode
                                            .connect(GainNode)
                                            .connect(LowFilterNode)
                                            .connect(MidFilterNode)
                                            .connect(HighFilterNode)
                                            .connect(CompressorNode)
                                            .connect(Destination);
 
                                        items.Connected = true;
                                    } else if (!disconnected && Connected) {
                                        SourceNode.disconnect();
                                        GainNode.disconnect();
                                        LowFilterNode.disconnect();
                                        MidFilterNode.disconnect();
                                        HighFilterNode.disconnect();
                                        CompressorNode.disconnect();
                                        SourceNode.connect(Destination);

                                        items.Connected = false;
                                    }
                                });

                                disconnected = !disconnected;
                                regChange();
                            },
                            [Transl("🛠️ 調整菜單")]: {
                                desc: Transl("快捷組合 : (Alt + B)"),
                                func: () => { menu() }
                            }
                        }, { index: 2 });
                    }
                    regChange();

                    Lib.onEvent(document, "keydown", event => {
                        if (event.altKey && event.key.toUpperCase() == "B") menu();
                    }, { passive: true, capture: true, mark: "Media-Booster-Hotkey" });

                    Lib.storeListen([Lib.$domain], call => { // 全局監聽保存值變化
                        if (call.far && call.key === Lib.$domain) { // 由遠端且觸發網域相同
                            Object.entries(call.nv).forEach(([type, value]) => {
                                Share.SetControl(type, value); // 更新增強參數
                            })
                        }
                    })
                }
            };
        } catch (error) {
            Lib.log(Transl("增強錯誤"), error, { type: "error", collapsed: false });
        }
    };

    function trigger(media) {
        try {
            if (!updated) { // ? 動態更新是為了首次觸發時 能取得最新的配置
                updated = true;
                updateParame();
            };

            boosterCore(media);
        } catch (error) {
            Lib.log("Trigger Error : ", error, { type: "error", collapsed: false });
        }
    };

    // 執行判斷
    bannedDomains.isEnabled(Status => {
        const regMenu = async (name) => { // 簡化註冊菜單
            Lib.regMenu({
                [name]: () => bannedDomains.addBanned()
            })
        };

        if (Status) {
            Share.SetControl = (type, value) => { // 建立控制器
                Share.Parame[type] = value; // 更新增強參數 (原始值)
                enhancedNodes.forEach(items => {
                    items[type].value = value;
                })
            };

            menu = CreateMenu(Lib, Share, GM_getResourceURL("Img"), Transl); // 創建菜單

            // 查找媒體元素
            const findMedia = Lib.$debounce((func) => {
                const media = [];

                const tree = document.createTreeWalker(
                    Lib.body,
                    NodeFilter.SHOW_ELEMENT,
                    {
                        acceptNode: (node) => {
                            const tag = node.tagName;

                            if (tag === 'VIDEO' || tag === 'AUDIO') {
                                if (!processedElements.has(node))
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
            Lib.$observer(Lib.body, () => {
                if (processing) return;

                findMedia(media => {
                    processing = true;
                    trigger(media);
                })

            }, { mark: "Media-Booster", attributes: false, throttle: 200 }, () => {
                regMenu(Transl("❌ 禁用網域"));
            });

            // 網址變化
            Lib.onUrlChange(() => {
                processedElements.clear();
            });

        } else regMenu(Transl("✅ 啟用網域"));
    })
})();