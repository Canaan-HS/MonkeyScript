import { Lib } from '../services/client.js';
import { Share } from '../core/config.js';
import Transl from '../shared/language.js';

import { audioContextRecord, updateParame, isCrossOrigin } from '../utils/tools.js';

const Booster = (() => {
    let updated = false; // 是否已更新
    let initialized = false; // 是否初始化

    let mediaAudioContent = null; // 儲存音頻上下文 實例
    const audioContext = AudioContext; // 音頻上下文

    /* 增強處理 */
    function booster(mediaObj) {
        try {
            if (!audioContext) throw new Error(Transl("不支援音頻增強節點"));
            if (!mediaAudioContent) mediaAudioContent = new audioContext();
            if (mediaAudioContent.state === "suspended") mediaAudioContent.resume();

            const successNode = []; // 紀錄增強成功的節點

            for (const media of mediaObj) {
                Share.ProcessedElements.add(media); // 紀錄被增強的節點

                if (
                    media.mediaKeys || media.encrypted // 檢查 DRM 保護
                    || (MediaSource && media.srcObject instanceof MediaSource) // 檢查 MSE
                    || !media.crossOrigin && isCrossOrigin(media.currentSrc) // 檢查跨域
                ) {
                    /**
                     * 跨域播放可能的解法:
                     * - hook createElement 跟 HTMLMediaElement 創建時的原型, 並透過 Cloudflare Worker 代理流量
                     */
                    Lib.log(
                        media, { group: Transl("不支援的媒體跳過"), collapsed: false }
                    );
                    continue;
                };

                try {
                    const recordContext = audioContextRecord.get(media);
                    const tempContext = recordContext.context ?? mediaAudioContent;

                    const SourceNode = recordContext.source ?? tempContext.createMediaElementSource(media); // 音頻來源
                    const GainNode = recordContext.gain ?? tempContext.createGain(); // 增益節點
                    const LowFilterNode = recordContext.lowFilter ?? tempContext.createBiquadFilter(); // 低音慮波器
                    const MidFilterNode = recordContext.midFilter ?? tempContext.createBiquadFilter(); // 中音慮波器
                    const HighFilterNode = recordContext.highFilter ?? tempContext.createBiquadFilter(); // 高音濾波器
                    const CompressorNode = recordContext.compressor ?? tempContext.createDynamicsCompressor(); // 動態壓縮節點
                    const DestinationNode = recordContext.destination ?? tempContext.destination; // 輸出節點

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
                        .connect(DestinationNode);

                    // 將完成的節點添加
                    Share.EnhancedNodes.push({
                        Connected: true,
                        MediaNode: media,
                        DestinationNode, SourceNode,
                        GainNode, CompressorNode,
                        LowFilterNode, MidFilterNode, HighFilterNode,
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
                } catch (error) {
                    Lib.log(
                        { media, error }, { group: Transl("添加增強節點失敗"), collapsed: false }
                    ).error;
                }
            };

            // 打印完成狀態 (要有增加節點才會打印)
            if (successNode.length > 0) {
                Share.ProcessLock = false;

                Lib.log(
                    successNode, { group: Transl("添加增強節點成功"), collapsed: false }
                );

                // 初始化 菜單創建
                if (!initialized) {
                    initialized = true;

                    let disconnected = false;
                    const regChange = () => {
                        Lib.regMenu({
                            [Transl(disconnected ? "🔗 恢復增幅" : "✂️ 斷開增幅")]: () => {
                                if (Share.EnhancedNodes.length === 0) {
                                    alert(Transl("當前沒有被增幅的媒體"));
                                    return;
                                };

                                Share.EnhancedNodes.forEach(items => {
                                    const {
                                        Connected, SourceNode, GainNode, LowFilterNode, MidFilterNode, HighFilterNode, CompressorNode, DestinationNode
                                    } = items;

                                    if (disconnected && !Connected) {
                                        SourceNode
                                            .connect(GainNode)
                                            .connect(LowFilterNode)
                                            .connect(MidFilterNode)
                                            .connect(HighFilterNode)
                                            .connect(CompressorNode)
                                            .connect(DestinationNode);

                                        items.Connected = true;
                                    } else if (!disconnected && Connected) {
                                        SourceNode.disconnect();
                                        GainNode.disconnect();
                                        LowFilterNode.disconnect();
                                        MidFilterNode.disconnect();
                                        HighFilterNode.disconnect();
                                        CompressorNode.disconnect();
                                        SourceNode.connect(DestinationNode);

                                        items.Connected = false;
                                    }
                                });

                                disconnected = !disconnected;
                                regChange();
                            },
                            [Transl("🛠️ 調整菜單")]: {
                                desc: Transl("快捷組合 : (Alt + B)"),
                                func: () => { Share.Menu() }
                            }
                        }, { index: 2 });
                    };
                    regChange();

                    Lib.onEvent(document, "keydown", event => {
                        if (event.altKey && event.key.toUpperCase() == "B") Share.Menu();
                    }, { passive: true, capture: true, mark: "Media-Booster-Hotkey" });

                    Lib.storageListen([Lib.$domain], call => { // 全局監聽保存值變化
                        if (call.far && call.key === Lib.$domain) { // 由遠端且觸發網域相同
                            Object.entries(call.nv).forEach(([type, value]) => {
                                Share.SetControl(type, value); // 更新增強參數
                            })
                        }
                    })
                }
            };
        } catch (error) {
            Lib.log(error, { group: Transl("增強錯誤"), collapsed: false }).error;
        }
    };

    /* 增強觸發 */
    function trigger(media) {
        try {
            if (!updated) { // ? 動態更新是為了首次觸發時 能取得最新的配置
                updated = true;
                updateParame();
            };

            booster(media);
        } catch (error) {
            Lib.log(error, { group: "Trigger Error : ", collapsed: false }).error;
        }
    };

    return { trigger };
})();

export default Booster;