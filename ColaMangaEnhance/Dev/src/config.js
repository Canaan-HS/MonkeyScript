export const Config = {
    BGColor: {
        Enable: true,
        Color: "#595959",
    },
    AutoTurnPage: { // 自動翻頁
        Enable: true,
        Mode: 5, // 1 = 快速 | 2 = 普通 | 3 = 緩慢 | 4 = 一般無盡 | 5 = 優化無盡
    },
    RegisterHotkey: { // 快捷功能
        Enable: true,
        Function: { // 移動端不適用以下配置
            TurnPage: true, // 翻頁
            AutoScroll: true, // 自動滾動
            KeepScroll: true, // 換頁繼續滾動
            ManualScroll: false, // 手動滾動啟用時, 將會變成點擊一次, 根據視點翻一頁 且 自動滾動會無效
        }
    }
};