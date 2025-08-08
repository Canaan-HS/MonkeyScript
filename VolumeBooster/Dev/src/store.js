export const Share = { // 共享的數據
    Parame: null,
    SetControl: null,
};

export const Default = {
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
};