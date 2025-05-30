export const Config = {
    Dev: false,
    GlobalChange: true, // 全局同時修改
    HotKey: {
        Adapt: k => k.key.toLowerCase(), // <- 適配大小寫差異
        Title: k => k.altKey && Config.HotKey.Adapt(k) == "t", // 標題
        MinimaList: k => k.ctrlKey && Config.HotKey.Adapt(k) == "z", // 極簡化
        RecomViewing: k => k.altKey && Config.HotKey.Adapt(k) == "1", // 推薦觀看
        Comment: k => k.altKey && Config.HotKey.Adapt(k) == "2", // 留言區
        FunctionBar: k => k.altKey && Config.HotKey.Adapt(k) == "3" // 功能區
    }
};

export const Match = {
    Live: /^(https?:\/\/)www\.youtube\.com\/live\/.*$/, // 直播影片
    Video: /^(https?:\/\/)www\.youtube\.com\/watch\?v=.+$/ // 影片播放區
}