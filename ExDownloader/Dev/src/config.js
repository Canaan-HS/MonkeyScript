/* 使用者配置 */
export const Config = {
    Dev: true,            // 開發模式 (會顯示除錯訊息)
    ReTry: 10,            // 下載錯誤重試次數, 超過這個次數該圖片會被跳過
    Original: false,      // 是否下載原圖
    ResetScope: true,     // 下載完成後 重置範圍設置
    CompleteClose: false, // 下載完成自動關閉
};

/* 下載配置 (不清楚不要修改) */
export const DConfig = {
    Compr_Level: 9,      // 壓縮的等級
    MIN_CONCURRENCY: 5,  // 最小併發數
    MAX_CONCURRENCY: 16, // 最大併發數
    TIME_THRESHOLD: 1000, // 響應時間閥值（初始值，會動態調整）

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

    responseHistory: [],     // 儲存最近的響應時間
    networkCondition: 'normal', // 網絡狀態: 'good', 'normal', 'poor'
    lastNetworkCheck: 0,     // 上次網絡檢查時間
    networkCheckInterval: 1e4, // 網絡檢查間隔(10秒)
    networkQualityThresholds: {
        good: 500,  // 平均響應時間 < 500ms 為 'good'
        poor: 1500, // 平均響應時間 > 1500ms 為 'poor'
    },
    EMA_ALPHA: 0.3,
    ADJUSTMENT_FACTOR: 0.25,
    adaptiveFactors: {       // 不同網絡條件下的調整因子
        good: { delayFactor: 0.8, threadFactor: 1.2 },
        normal: { delayFactor: 1.0, threadFactor: 1.0 },
        poor: { delayFactor: 1.5, threadFactor: 0.7 }
    },

    Scope: undefined, // 下載範圍
    DisplayCache: undefined, // 緩存展示時的字串
    CurrentDownloadMode: undefined, // 紀錄當前模式

    KeyCache: undefined, // 緩存鍵
    GetKey: function () {
        if (!this.KeyCache) this.KeyCache = `DownloadCache_${location.pathname.split("/").slice(2, 4).join("")}`;
        return this.KeyCache;
    },

    /**
     * @description 檢測當前網絡狀況
     * @returns {'good'|'normal'|'poor'}
     */
    checkNetworkCondition: function () {
        const now = Date.now();
        if (now - this.lastNetworkCheck < this.networkCheckInterval) {
            return this.networkCondition;
        }
        this.lastNetworkCheck = now;

        if (navigator.connection) {
            const { effectiveType, saveData } = navigator.connection;
            if (effectiveType === '4g' && !saveData) this.networkCondition = 'good';
            else if (effectiveType === '3g' || (effectiveType === '4g' && saveData)) this.networkCondition = 'normal';
            else this.networkCondition = 'poor';
        } else if (this.responseHistory.length >= 5) {
            const avgResponseTime = this.responseHistory.reduce((a, b) => a + b, 0) / this.responseHistory.length;
            if (avgResponseTime < this.networkQualityThresholds.good) this.networkCondition = 'good';
            else if (avgResponseTime > this.networkQualityThresholds.poor) this.networkCondition = 'poor';
            else this.networkCondition = 'normal';
        }
        return this.networkCondition;
    },

    /**
     * @description 更新響應時間歷史記錄並計算新的時間閾值
     * @param {number} newResponseTime - 最新的響應時間(ms)
     */
    updateThreshold: function (newResponseTime) {
        this.responseHistory.push(newResponseTime);
        if (this.responseHistory.length > 10) this.responseHistory.shift();

        if (!this.TIME_THRESHOLD || this.responseHistory.length <= 1) {
            this.TIME_THRESHOLD = newResponseTime;
        } else {
            this.TIME_THRESHOLD = this.EMA_ALPHA * newResponseTime + (1 - this.EMA_ALPHA) * this.TIME_THRESHOLD;
        }
        this.TIME_THRESHOLD = Math.max(500, Math.min(2000, this.TIME_THRESHOLD));
    },

    /**
     * @description 根據網絡狀況動態調整延遲和線程數
     * @param {number} time - 請求完成的時間
     * @param {number} currentDelay - 當前的延遲(ms)
     * @param {number|null} currentThread - 當前的線程數 (可選)
     * @param {number} minDelay - 最小延遲(ms)
     * @returns {number|[number, number]} - 返回新的延遲或 [新的延遲, 新的線程數]
     */
    Dynamic: function (time, currentDelay, currentThread = null, minDelay = 0) {
        const responseTime = Date.now() - time;
        this.updateThreshold(responseTime);

        const networkState = this.checkNetworkCondition();
        const { delayFactor, threadFactor } = this.adaptiveFactors[networkState];
        const ratio = responseTime / this.TIME_THRESHOLD;

        const delayChange = (ratio - 1) * this.ADJUSTMENT_FACTOR * delayFactor;
        let newDelay = currentDelay * (1 + delayChange);
        newDelay = Math.max(minDelay, Math.min(newDelay, this.MAX_Delay));

        if (currentThread !== null) {
            const threadChange = (ratio - 1) * this.ADJUSTMENT_FACTOR * threadFactor;
            let newThread = currentThread * (1 - threadChange);
            newThread = Math.max(this.MIN_CONCURRENCY, Math.min(newThread, this.MAX_CONCURRENCY));
            return [Math.round(newDelay), Math.round(newThread)];
        }

        return Math.round(newDelay);
    },

    // 獲取當前網絡狀態的診斷信息
    getNetworkDiagnostics: function () {
        return {
            networkCondition: this.networkCondition,
            avgResponseTime: this.responseHistory.length > 0 ?
                this.responseHistory.reduce((a, b) => a + b, 0) / this.responseHistory.length : 0,
            currentThreshold: this.TIME_THRESHOLD,
            connectionInfo: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                saveData: navigator.connection.saveData,
                rtt: navigator.connection.rtt,
                downlink: navigator.connection.downlink
            } : 'Not available'
        };
    }
};