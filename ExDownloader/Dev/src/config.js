/* 使用者配置 */
const Config = {
    Dev: true,            // 開發模式 (會顯示除錯訊息)
    ReTry: 10,            // 下載錯誤重試次數, 超過這個次數該圖片會被跳過
    Original: false,      // 是否下載原圖
    ResetScope: true,     // 下載完成後 重置範圍設置
    CompleteClose: false, // 下載完成自動關閉
};

/* 下載配置 (不清楚不要修改) */
const DConfig = {
    Compress_Level: 9,      // 壓縮的等級
    MIN_CONCURRENCY: 5,  // 最小併發數
    MAX_CONCURRENCY: 16, // 最大併發數

    MAX_Delay: 2500,     // 最大延遲
    Home_ID: 100,        // 主頁初始延遲
    Home_ND: 80,         // 主頁最小延遲
    Image_ID: 34,        // 圖頁初始延遲
    Image_ND: 28,        // 圖頁最小延遲
    Download_IT: 6,      // 下載初始線程
    Download_ID: 600,    // 下載初始延遲
    Download_ND: 300,    // 下載最小延遲

    Lock: false, // 鎖定狀態
    SortReverse: false, // 排序反轉

    Scope: undefined, // 下載範圍
    TitleCache: undefined, // 緩存標題
    ModeDisplay: undefined, // 下載模式顯示
    CompressMode: undefined, // 壓縮模式

    KeyCache: undefined, // 緩存鍵
    GetKey: function () {
        if (!this.KeyCache) this.KeyCache = `DownloadCache_${location.pathname.split("/").slice(2, 4).join("")}`;
        return this.KeyCache;
    }
};

export { Config, DConfig };