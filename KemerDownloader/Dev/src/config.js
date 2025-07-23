export default function Config(Syn) {
    const General = {
        Dev: false, // 顯示請求資訊, 與錯誤資訊
        IncludeExtras: false, // 下載時包含 影片 與 其他附加檔案
        CompleteClose: false, // 下載完成後關閉
        ConcurrentDelay: 600, // 下載線程延遲 (ms) [壓縮下載]
        ConcurrentQuantity: 3, // 下載線程數量 [壓縮下載]
        BatchOpenDelay: 500, // 一鍵開啟帖子的延遲 (ms)
        ...Syn.gJV("General", {}),
    };

    /** ---------------------
     * 暫時的 檔名修改方案
     *
     * 根據要添加的元素修改字串
     * 中間的間隔可用任意字符
     *
     * ! 不限制大小寫, 但一定要有 {}, 不能用於命名的符號會被移除
     *
     * {Time} 發表時間
     * {Title} 標題
     * {Artist} 作者 | 繪師 ...
     * {Source} 來源 => (Pixiv Fanbox) 之類的標籤
     *
     * {Fill} 填充 => ! 只適用於檔名, 位置隨意 但 必須存在該值, 不然會出錯
     */
    const FileName = {
        FillValue: {
            Filler: "0", // 填充元素 / 填料
            Amount: "Auto", // 填充數量 [輸入 auto 或 任意數字]
        },
        CompressName: "({Artist}) {Title}", // 壓縮檔案名稱
        FolderName: "{Title}", // 資料夾名稱 (用空字串, 就直接沒資料夾)
        FillName: "{Title} {Fill}", // 檔案名稱 [! 可以移動位置, 但不能沒有 {Fill}]
        ...Syn.gJV("FileName", {}),
    };

    /** ---------------------
     * 設置 FetchData 輸出格式
     *
     *! 無論設置什麼, 只要沒有的數據, 就不會顯示 (會被排除掉)
     *
     * ----------------------
     * 舊版 nekohouse.su
     *
     *
     * ----------------------
     * Mode
     * 排除模式: "FilterMode" -> 預設為全部使用, 設置排除的項目
     * 僅有模式: "OnlyMode" -> 預設為全部不使用, 設置使用的項目
     * ----------------------
     * Format
     * 帖子連結: "PostLink"
     * 發佈時間: "Timestamp"
     * 標籤 Tag: "TypeTag" (Only AdvancedFetch)
     * 圖片連結: "ImgLink"
     * 影片連結: "VideoLink"
     * 下載連結: "DownloadLink"
     * 外部連結: "ExternalLink" (Only AdvancedFetch)
     */
    const FetchSet = {
        Delay: 100, // 獲取延遲 (ms) [太快會被 BAN]
        AdvancedFetch: true, // 進階獲取 (如果只需要 圖片和影片連結, 關閉該功能獲取會快很多)
        ToLinkTxt: false, // 啟用後輸出為只有連結的 txt, 用於 IDM 導入下載
        UseFormat: false, // 這裡為 false 下面兩項就不生效
        Mode: "FilterMode",
        Format: ["Timestamp", "TypeTag"],
        ...Syn.gJV("FetchSet", {}),
    };

    // 不要修改
    const Process = {
        IsNeko: Syn.$domain.startsWith("nekohouse"),
        ImageExts: ["jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "tif", "svg", "heic", "heif", "raw", "ico", "psd"],
        VideoExts: ["mp4", "avi", "mkv", "mov", "flv", "wmv", "webm", "mpg", "mpeg", "m4v", "ogv", "3gp", "asf", "ts", "vob", "rm", "rmvb", "m2ts", "f4v", "mts"],
        Lock: false,
        MAX_Delay: 1500,
        MIN_CONCURRENCY: 2,
        MAX_CONCURRENCY: 6,
        TIME_THRESHOLD: 1000,

        responseHistory: [],
        networkCondition: 'normal',
        lastNetworkCheck: 0,
        networkCheckInterval: 1e4,
        networkQualityThresholds: {
            good: 500,
            poor: 1500,
        },
        EMA_ALPHA: 0.3,
        ADJUSTMENT_FACTOR: 0.25,
        adaptiveFactors: {
            good: { delayFactor: 0.8, threadFactor: 1.2 },
            normal: { delayFactor: 1.0, threadFactor: 1.0 },
            poor: { delayFactor: 1.5, threadFactor: 0.7 }
        },

        _checkNetworkCondition() {
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

        _updateThreshold(newResponseTime) {
            this.responseHistory.push(newResponseTime);
            if (this.responseHistory.length > 10) this.responseHistory.shift();

            if (!this.TIME_THRESHOLD || this.responseHistory.length <= 1) {
                this.TIME_THRESHOLD = newResponseTime;
            } else {
                this.TIME_THRESHOLD = this.EMA_ALPHA * newResponseTime + (1 - this.EMA_ALPHA) * this.TIME_THRESHOLD;
            }
            this.TIME_THRESHOLD = Math.max(20, Math.min(2000, this.TIME_THRESHOLD));
        },

        dynamicParam(time, currentDelay, currentThread = null, minDelay = 0) {
            const responseTime = Date.now() - time;
            this._updateThreshold(responseTime);

            const networkState = this._checkNetworkCondition();
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
        }
    };

    return { General, FileName, FetchSet, Process };
}