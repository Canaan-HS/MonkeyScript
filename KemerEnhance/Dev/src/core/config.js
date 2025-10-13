import { monkeyWindow, Lib } from '../services/client.js';

/* Data type checks are removed in user configuration; providing incorrect input may cause it to break */
const User_Config = {
    Global: {
        BlockAds: true, // 阻擋廣告
        CacheFetch: true, // 緩存 Fetch 請求 (僅限 JSON)
        DeleteNotice: true, // 刪除上方公告
        SidebarCollapse: true, // 側邊攔摺疊
        KeyScroll: { mode: 1, enable: true }, // 上下鍵觸發自動滾動 [mode: 1 = 動畫偵滾動, mode: 2 = 間隔滾動] (選擇對於自己較順暢的)
        TextToLink: { // 連結的 (文本 -> 超連結)
            enable: true,
            newtab: true, // 新選項卡開啟
            newtab_active: false, // 切換焦點到新選項卡
            newtab_insert: true, // 選項卡插入到當前選項卡的正後方
        },
        BetterPostCard: { // 修復名稱|自訂名稱|外部TAG跳轉|快速預覽內容
            enable: true,
            newtab: true,
            newtab_active: true,
            newtab_insert: true,
            previewAbove: true, // 快速預覽展示於帖子上方
        },
    },
    Preview: {
        CardZoom: { mode: 3, enable: true }, // 縮放預覽卡大小 [mode: 1 = 卡片放大 , 2 = 卡片放大 + 懸浮縮放, 3 = 卡片放大 + 自動縮放]
        CardText: { mode: 2, enable: true }, // 預覽卡文字效果 [mode: 1 = 隱藏文字 , 2 = 淡化文字]
        BetterThumbnail: true, // 替換成內頁縮圖 (nekohouse 不支援)
        QuickPostToggle: true, // 快速切換帖子 (僅支援 nekohouse)
        NewTabOpens: { // 預覽頁面的帖子都以新分頁開啟
            enable: true,
            newtab_active: false,
            newtab_insert: true,
        },
    },
    Content: {
        ExtraButton: true, // 額外的下方按鈕
        LinkBeautify: true, // 下載連結美化, 當出現 (browse »), 滑鼠懸浮會直接顯示內容, 並移除多餘的字串
        CommentFormat: true, // 評論區重新排版
        VideoBeautify: { mode: 1, enable: true }, // 影片美化 [mode: 1 = 複製下載節點 , 2 = 移動下載節點]
        OriginalImage: { // 自動原圖 [mode: 1 = 快速自動 , 2 = 慢速自動 , 3 = 觀察後觸發]
            mode: 1,
            enable: true,
            experiment: false, // 實驗性替換方式
        }
    },
    ...Lib.getV("__REMOVE_ON_BUILD__", {}),
};

const Parame = {
    Url: Lib.$url,
    DB: import.meta.hot
        ? monkeyWindow["openDB"] ?? await Lib.openDB("KemerEnhanceDB", 1, GM_getResourceText("pako"))
        : await Lib.openDB("KemerEnhanceDB", 1, GM_getResourceText("pako")),
    OriginalApi: `https://${Lib.$domain}/data`,
    ThumbnailApi: `https://${Lib.$domain}/thumbnail/data`,
    SaveKey: { Img: "ImgStyle", Lang: "Language", Menu: "MenuPoint" },
    // 搜尋頁面 ./artists*
    Artists: /.+(?<!favorites)\/artists.*/,
    // 預覽頁的藝術家其他頁面連結 ./links | ./links/new
    Links: /.+\/user\/[^\/]+\/links.*/,
    // 預覽頁的推薦 ./recommended
    Recommended: /.+\/user\/[^\/]+\/recommended.*/,
    // favorites 頁面 ./favorites/artists*
    FavoritesArtists: /.+\/favorites\/artists.*/,

    // 排除 favorites 頁面以外的 posts & posts/popular 頁面
    Posts: /.+(?<!favorites)\/posts.*/,
    // 最常見的 User 預覽頁面, ./user/id || ./user/id?.*
    User: /.+\/user\/[^\/]+(\?.*)?$/,
    // favorites 頁面 ./favorites/posts*
    FavorPosts: /.+\/favorites\/posts.*/,

    // DMs 頁面
    Dms: /.+\/dms(\?.*)?$/,
    // 預覽頁的公告 ./announcements
    Announcement: /.+\/user\/[^\/]+\/announcements.*/,

    // 帖子內容頁面
    Content: /.+\/user\/.+\/post\/.+$/,

    Registered: import.meta.hot
        ? monkeyWindow["Registered"] ?? new Set()
        : new Set(),
    SupportImg: new Set(["jpg", "jpeg", "png", "gif", "bmp", "webp", "avif", "heic", "svg"]),
    VideoType: new Set([
        "mp4", "avi", "mkv", "mov", "flv", "wmv", "webm", "mpg", "mpeg", "m4v",
        "ogv", "3gp", "asf", "ts", "vob", "rm", "rmvb", "m2ts", "f4v", "mts",
        "mpe", "mpv", "m2v", "m4a", "bdmv", "ifo", "r3d", "braw", "cine", "qt",
        "f4p", "swf", "mng", "gifv", "yuv", "roq", "nsv", "amv", "svi", "mod",
        "mxf", "ogg",
    ])
};

const Page = {
    isContent: () => Parame.Content.test(Parame.Url),
    isAnnouncement: () => Parame.Announcement.test(Parame.Url)
        || Parame.Dms.test(Parame.Url),
    isSearch: () => Parame.Artists.test(Parame.Url)
        || Parame.Links.test(Parame.Url)
        || Parame.Recommended.test(Parame.Url)
        || Parame.FavoritesArtists.test(Parame.Url),
    isPreview: () => Parame.Posts.test(Parame.Url)
        || Parame.User.test(Parame.Url)
        || Parame.FavorPosts.test(Parame.Url),
    isNeko: Lib.$domain.startsWith("nekohouse"),
};

const Load = (() => {
    const color = {
        "kemono": "#e8a17d !important",
        "coomer": "#99ddff !important",
        "nekohouse": "#bb91ff !important"
    }[Lib.$domain.split(".")[0]];

    const userSet = {
        menuSet: () => Lib.getV(Parame.SaveKey.Menu, {
            Top: "10vh",
            Left: "10vw"
        }),
        imgSet: () => Lib.getV(Parame.SaveKey.Img, {
            Width: "auto",
            Height: "auto",
            Spacing: "0px",
            MaxWidth: "100%",
        })
    };

    return { ...userSet, color };
})();

export { User_Config, Parame, Page, Load };