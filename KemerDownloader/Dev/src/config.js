export default function Config(Lib) {
    const General = {
        Dev: false, // 顯示請求資訊, 與錯誤資訊
        IncludeExtras: false, // 下載時包含 影片 與 其他附加檔案
        CompleteClose: false, // 下載完成後關閉
        ConcurrentDelay: 600, // 下載線程延遲 (ms) [壓縮下載]
        ConcurrentQuantity: 3, // 下載線程數量 [壓縮下載]
        BatchOpenDelay: 500, // 一鍵開啟帖子的延遲 (ms)
        ...Lib.getJV("General", {}),
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
        ...Lib.getJV("FileName", {}),
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
        ToLinkTxt: false, // 啟用後輸出為只有連結的 txt, 用於 IDM 導入下載, 理論上也支援 aria2 格式
        UseFormat: false, // 這裡為 false 下面兩項就不生效
        Mode: "FilterMode",
        Format: ["Timestamp", "TypeTag"],
        ...Lib.getJV("FetchSet", {}),
    };

    // 不要修改
    const Process = {
        IsNeko: Lib.$domain.startsWith("nekohouse"),
        ImageExts: [
            "jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "tif", "svg", "heic",
            "heif", "raw", "ico", "avif", "jxl", "cr2", "nef", "arw", "orf", "rw2",
            "tga", "pcx", "crw", "cr2", "cr3", "dng", "eps", "xcf", "ai", "psd",
            "psb", "pef", "nrw", "ptx", "srf", "sr2", "raf", "rwl", "3fr", "fff",
            "iiq", "x3f", "ari", "bay", "dcr", "kdc", "mef", "mos", "dng", "usdz",
            "jxr", "cdr", "wmf", "emf", "dxf", "svgz", "obj", "fbx", "stl", "gltf",
            "glb", "gltf", "glb", "dae", "blend", "max", "c4d", "step", "stp", "iges",
        ],
        VideoExts: [
            "mp4", "avi", "mkv", "mov", "flv", "wmv", "webm", "mpg", "mpeg", "m4v",
            "ogv", "3gp", "asf", "ts", "vob", "rm", "rmvb", "m2ts", "f4v", "mts",
            "mpe", "mpv", "m2v", "m4a", "bdmv", "ifo", "r3d", "braw", "cine", "qt",
            "f4p", "swf", "mng", "gifv", "yuv", "roq", "nsv", "amv", "svi", "mod",
            "mxf", "ogg",
        ],
        Lock: false,
        dynamicParam: Lib.createNnetworkObserver({
            MAX_Delay: 1500,
            MIN_CONCURRENCY: 5,
            MAX_CONCURRENCY: 10,
            Good_Network_THRESHOLD: 200,
            Poor_Network_THRESHOLD: 400,
        }),
    };

    return { General, FileName, FetchSet, Process };
}