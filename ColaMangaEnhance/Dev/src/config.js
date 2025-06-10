/* 臨時的自定義 (當 Enable = false 時, 其餘的設置將無效) */
export const Config = {
    BGColor: {
        Enable: true,
        Color: "#595959",
    },
    AutoTurnPage: { // 自動翻頁
        Enable: true,
        Mode: 3, // 1 = 快速 | 2 = 一般無盡 | 3 = 優化無盡
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

export const Control = {
    ScrollPixels: 2, // 像素, 越大越快
    WaitPicture: 1000, // 載入延遲時間 (ms)
    BlockListener: new Set([ // 阻擋事件
        "auxclick",
        "mousedown",
        "pointerup",
        "pointerdown",
        "dState",
        "touchstart",
        "unhandledrejection"
    ]),
    IdList: { // Id 表
        Title: "CME_Title", Iframe: "CME_Iframe", Block: "CME_Block-Ads", Menu: "CME_Menu-Style",
        Image: "CME_Image-Style", Scroll: "CME_Scroll-Hidden", ChildS: "CME_Child-Scroll-Hidden"
    }
};

export const Param = {
    Body: null, // body 緩存
    ContentsPage: null, // 返回目錄連結 緩存
    HomePage: null, // 返回首頁連結 緩存
    PreviousLink: null, // 上一頁連結 緩存
    NextLink: null, // 下一頁連結 緩存
    MangaList: null, // 漫畫列表 緩存
    BottomStrip: null, // 以閱讀完畢的那條
    Up_scroll: false, // 向上滾動判斷值
    Down_scroll: false, // 向下滾動判斷值
    IsFinalPage: false, // 最終頁判斷值
    IsMainPage: (window.self === window.parent) // 判斷是否是 iframe
};