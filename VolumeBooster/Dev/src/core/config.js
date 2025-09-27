import { Lib } from '../services/client.js';

const Default = {
    Gain: 1.0,
    LowFilterGain: 1.2,
    LowFilterFreq: 200,
    MidFilterQ: 1,
    MidFilterGain: 1.6,
    MidFilterFreq: 2000,
    HighFilterGain: 1.8,
    HighFilterFreq: 10000,
    CompressorRatio: 3, // 壓縮率 (調低會更大聲, 但容易爆音)
    CompressorKnee: 4, // 壓縮過渡反應時間(越小越快)
    CompressorThreshold: -8, // 壓縮閾值
    CompressorAttack: 0.03, // 開始壓縮的速度
    CompressorRelease: 0.2, // 釋放壓縮的速度
    ...Lib.getV("__REMOVE_ON_BUILD__", {}),
};

const Share = {
    Menu: null, // 菜單
    Parame: null, // 設置參數
    SetControl: null, // 設置控件
    ProcessLock: false, // 處理鎖
    EnhancedNodes: [], // 儲存增強節點 (音頻節點)
    ProcessedElements: new WeakSet(), // 儲存被處理過的元素 (媒體元素)
    ...Lib.getV("__REMOVE_ON_BUILD__", {}),
};

export { Default, Share };