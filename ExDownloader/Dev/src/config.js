/* 使用者配置 */
export const Config = {
    Dev: true,           // 開發模式 (會顯示除錯訊息)
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

    // 新增的網絡和響應時間監控參數
    responseHistory: [],     // 儲存最近的響應時間
    networkCondition: 'normal', // 網絡狀態: 'good', 'normal', 'poor'
    lastNetworkCheck: 0,     // 上次網絡檢查時間
    networkCheckInterval: 3e4, // 網絡檢查間隔(10秒)
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

    // 檢測網絡狀態
    checkNetworkCondition: function () {
        const now = Date.now();

        // 避免頻繁檢測
        if (now - this.lastNetworkCheck < this.networkCheckInterval) {
            return this.networkCondition;
        }

        this.lastNetworkCheck = now;

        // 使用 Navigator API 檢測網絡狀態
        if (navigator.connection) {
            const connection = navigator.connection;

            // 基於連接類型和有效帶寬判斷
            if (connection.effectiveType === '4g' && !connection.saveData) {
                this.networkCondition = 'good';
            } else if (
                connection.effectiveType === '3g' ||
                (connection.effectiveType === '4g' && connection.saveData)
            ) {
                this.networkCondition = 'normal';
            } else {
                this.networkCondition = 'poor';
            }
        } else {

            // 如果 Navigator API 不可用，使用響應時間歷史判斷
            if (this.responseHistory.length >= 5) {
                const avgResponseTime = this.responseHistory.reduce((a, b) => a + b, 0) / this.responseHistory.length;

                if (avgResponseTime < this.TIME_THRESHOLD * 0.7) {
                    this.networkCondition = 'good';
                } else if (avgResponseTime > this.TIME_THRESHOLD * 1.3) {
                    this.networkCondition = 'poor';
                } else {
                    this.networkCondition = 'normal';
                }
            }
        }

        return this.networkCondition;
    },

    // 更新響應時間閾值
    updateThreshold: function (newResponseTime) {
        // 保存最近10次響應時間
        this.responseHistory.push(newResponseTime);
        if (this.responseHistory.length > 10) {
            this.responseHistory.shift();
        }

        // 動態調整閾值
        if (this.responseHistory.length >= 5) {
            const avg = this.responseHistory.reduce((a, b) => a + b, 0) / this.responseHistory.length;
            // 限制閾值在合理範圍內
            this.TIME_THRESHOLD = Math.max(500, Math.min(2000, avg * 1.2));
        }
    },

    // 動態調整函數
    Dynamic: function (Time, Delay, Thread = null, MIN_Delay) {
        const ResponseTime = (Date.now() - Time);

        // 更新響應時間歷史和閾值
        this.updateThreshold(ResponseTime);

        // 檢查網絡狀態
        const networkState = this.checkNetworkCondition();
        const { delayFactor, threadFactor } = this.adaptiveFactors[networkState];

        // 計算響應時間比率
        const ratio = ResponseTime / this.TIME_THRESHOLD;

        let delay, thread;

        if (ResponseTime > this.TIME_THRESHOLD) {
            // 使用指數函數調整延遲，網絡狀況影響調整幅度
            delay = Math.min(Delay * (1 + Math.log10(ratio) * 0.3 * delayFactor), this.MAX_Delay);

            if (Thread != null) {
                thread = Math.max(Thread * Math.pow(0.9, ratio) * threadFactor, this.MIN_CONCURRENCY);
                return [Math.floor(delay), Math.floor(thread)];
            } else {
                return Math.floor(delay);
            }
        } else {
            // 響應時間良好，根據網絡狀況適當減少延遲
            delay = Math.max(Delay * (1 - (1 - ratio) * 0.2 * (1 / delayFactor)), MIN_Delay);

            if (Thread != null) {
                thread = Math.min(Thread * (1 + (1 - ratio) * 0.3 * threadFactor), this.MAX_CONCURRENCY);
                return [Math.ceil(delay), Math.ceil(thread)];
            } else {
                return Math.ceil(delay);
            }
        }
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