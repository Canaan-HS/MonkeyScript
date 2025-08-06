// ==UserScript==
// @name         Kemer Downloader
// @name:zh-TW   Kemer 下載器
// @name:zh-CN   Kemer 下载器
// @name:ja      Kemer ダウンローダー
// @name:ru      Kemer Загрузчик
// @name:ko      Kemer 다운로더
// @name:en      Kemer Downloader
// @version      2025.08.06-Beta
// @author       Canaan HS
// @description         一鍵下載圖片 (壓縮下載/單圖下載) , 一鍵獲取帖子數據以 Json 或 Txt 下載 , 一鍵開啟當前所有帖子
// @description:zh-TW   一鍵下載圖片 (壓縮下載/單圖下載) , 下載頁面數據 , 一鍵開啟當前所有帖子
// @description:zh-CN   一键下载图片 (压缩下载/单图下载) , 下载页面数据 , 一键开启当前所有帖子
// @description:ja      画像をワンクリックでダウンロード（圧縮ダウンロード/単一画像ダウンロード）、ページデータを作成してjsonでダウンロード、現在のすべての投稿をワンクリックで開く
// @description:ru      Загрузка изображений в один клик (сжатая загрузка/загрузка отдельных изображений), создание данных страницы для загрузки в формате json, открытие всех текущих постов одним кликом
// @description:ko      이미지 원클릭 다운로드(압축 다운로드/단일 이미지 다운로드), 페이지 데이터 생성하여 json 다운로드, 현재 모든 게시물 원클릭 열기
// @description:en      One-click download of images (compressed download/single image download), create page data for json download, one-click open all current posts

// @connect      *
// @match        *://kemono.cr/*
// @match        *://coomer.st/*
// @match        *://nekohouse.su/*

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635
// @supportURL   https://github.com/Canaan-HS/MonkeyScript/issues
// @icon         https://cdn-icons-png.flaticon.com/512/2381/2381981.png

// @require      https://update.greasyfork.org/scripts/495339/1636681/Syntax_min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.19.0/js/md5.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js

// @grant        window.close
// @grant        window.onurlchange
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @grant        GM_openInTab
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand

// @run-at       document-start
// ==/UserScript==

(function () {
    function Config(Lib2) {
        const General2 = {
            Dev: false, // 顯示請求資訊, 與錯誤資訊
            IncludeExtras: false, // 下載時包含 影片 與 其他附加檔案
            CompleteClose: false, // 下載完成後關閉
            ConcurrentDelay: 500, // 下載線程延遲 (ms) [壓縮下載]
            ConcurrentQuantity: 5, // 下載線程數量 [壓縮下載]
            BatchOpenDelay: 500, // 一鍵開啟帖子的延遲 (ms)
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
        const FileName2 = {
            FillValue: {
                Filler: "0", // 填充元素 / 填料
                Amount: "Auto", // 填充數量 [輸入 auto 或 任意數字]
            },
            CompressName: "({Artist}) {Title}", // 壓縮檔案名稱
            FolderName: "{Title}", // 資料夾名稱 (用空字串, 就直接沒資料夾)
            FillName: "{Title} {Fill}", // 檔案名稱 [! 可以移動位置, 但不能沒有 {Fill}]
        };
        /** ---------------------
         * 設置 FetchData 輸出格式
         *
         *! 無論設置什麼, 只要沒有的數據, 就不會顯示 (會被排除掉)
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
        const FetchSet2 = {
            Delay: 100, // 獲取延遲 (ms) [太快會被 BAN]
            AdvancedFetch: true, // 進階獲取 (只需要 一般媒體連結, 關閉該功能獲取會快很多) [ nekohouse 不適用]
            ToLinkTxt: false, // 啟用後輸出為只有連結的 txt, 用於 IDM 導入下載, 理論上也支援 aria2 格式
            FilterExts: [], // 自訂過濾的檔案類型, 過濾的檔案會被排除, 全小寫 例: ["ai", "psd"]
            UseFormat: false, // 這裡為 false 下面兩項就不生效
            Mode: "FilterMode",
            Format: ["Timestamp", "TypeTag"],
        };
        const Process2 = {
            IsNeko: Lib2.$domain.startsWith("nekohouse"),
            ImageExts: ["jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "tif", "svg", "heic", "heif", "raw", "ico", "avif", "jxl", "cr2", "nef", "arw", "orf", "rw2", "tga", "pcx", "crw", "cr2", "cr3", "dng", "eps", "xcf", "ai", "psd", "psb", "pef", "nrw", "ptx", "srf", "sr2", "raf", "rwl", "3fr", "fff", "iiq", "x3f", "ari", "bay", "dcr", "kdc", "mef", "mos", "dng", "usdz", "jxr", "cdr", "wmf", "emf", "dxf", "svgz", "obj", "fbx", "stl", "gltf", "glb", "gltf", "glb", "dae", "blend", "max", "c4d", "step", "stp", "iges"],
            VideoExts: ["mp4", "avi", "mkv", "mov", "flv", "wmv", "webm", "mpg", "mpeg", "m4v", "ogv", "3gp", "asf", "ts", "vob", "rm", "rmvb", "m2ts", "f4v", "mts", "mpe", "mpv", "m2v", "m4a", "bdmv", "ifo", "r3d", "braw", "cine", "qt", "f4p", "swf", "mng", "gifv", "yuv", "roq", "nsv", "amv", "svi", "mod", "mxf", "ogg"],
            Lock: false,
            dynamicParam: Lib2.createNnetworkObserver({
                MAX_Delay: 1500,
                MIN_CONCURRENCY: 5,
                MAX_CONCURRENCY: 10,
                Good_Network_THRESHOLD: 200,
                Poor_Network_THRESHOLD: 400
            })
        };
        return {
            General: General2,
            FileName: FileName2,
            FetchSet: FetchSet2,
            Process: Process2
        };
    }
    const Dict = {
        Traditional: {
            PostLink: "帖子連結",
            Timestamp: "發佈日期",
            TypeTag: "類型標籤",
            ImgLink: "圖片連結",
            VideoLink: "影片連結",
            DownloadLink: "下載連結",
            ExternalLink: "外部連結",
            "開帖說明": "\n\n!! 直接確認將會開啟當前頁面所有帖子\n輸入開啟範圍(說明) =>\n單個: 1, 2, 3\n範圍: 1~5, 6-10\n排除: !5, -10"
        },
        Simplified: {
            "🔁 切換下載模式": "🔁 切换下载模式",
            "📑 獲取帖子數據": "📑 获取帖子数据",
            "📃 開啟當前頁面帖子": "📃 打开当前页面帖子",
            "📥 強制壓縮下載": "📥 强制压缩下载",
            "⛔️ 取消下載": "⛔️ 取消下载",
            "壓縮下載": "压缩下载",
            "單獨下載": "单独下载",
            "開始下載": "开始下载",
            "無法下載": "无法下载",
            "下載進度": "下载进度",
            "封裝進度": "打包进度",
            "壓縮封裝失敗": "压缩打包失败",
            "下載完成": "下载完成",
            "請求進度": "请求进度",
            "下載中鎖定": "下载中锁定",
            "原始連結": "原始链接",
            "圖片數量": "图片数量",
            "影片數量": "视频数量",
            "下載連結": "下载链接",
            "密碼": "密码",
            "連結": "链接",
            "時間": "时间",
            "來源": "来源",
            "元數據": "元数据",
            PostLink: "帖子链接",
            Timestamp: "发布日期",
            TypeTag: "类型标签",
            ImgLink: "图片链接",
            VideoLink: "视频链接",
            DownloadLink: "下载链接",
            ExternalLink: "外部链接",
            "帖子內容": "帖子内容",
            "帖子數量": "帖子数量",
            "建立時間": "建立时间",
            "獲取頁面": "获取页面",
            "作者網站": "作者网站",
            "未取得數據": "未获取到数据",
            "模式切換": "模式切换",
            "數據處理中": "数据处理中",
            "當前處理頁數": "当前处理页数",
            "數據處理完成": "数据处理完成",
            "Json 數據下載": "JSON 数据下载",
            "當前帖子數": "当前帖子数",
            "開帖說明": "\n\n!! 直接确认将开启当前页面的所有帖子\n请输入开启范围：\n单个项目：1, 2, 3\n范围指定：1~5, 6-10\n排除项目：!5, -10"
        },
        Japan: {
            "🔁 切換下載模式": "🔁 ダウンロードモード切替",
            "📑 獲取帖子數據": "📑 投稿データを取得",
            "📃 開啟當前頁面帖子": "📃 現在のページの投稿を開く",
            "📥 強制壓縮下載": "📥 強制ZIPダウンロード",
            "⛔️ 取消下載": "⛔️ ダウンロードをキャンセル",
            "壓縮下載": "ZIPダウンロード",
            "單獨下載": "個別ダウンロード",
            "開始下載": "ダウンロード開始",
            "無法下載": "ダウンロード不可",
            "下載進度": "ダウンロード進捗",
            "封裝進度": "パッケージ化進捗",
            "壓縮封裝失敗": "ZIP化に失敗",
            "下載完成": "ダウンロード完了",
            "請求進度": "リクエスト進捗",
            "下載中鎖定": "ダウンロード中はロック中",
            "原始連結": "オリジナルリンク",
            "圖片數量": "画像数",
            "影片數量": "動画数",
            "下載連結": "ダウンロードリンク",
            "密碼": "パスワード",
            "連結": "リンク",
            "作者": "作者",
            "時間": "日時",
            "來源": "ソース",
            "元數據": "メタデータ",
            PostLink: "投稿リンク",
            Timestamp: "投稿日時",
            TypeTag: "種類タグ",
            ImgLink: "画像リンク",
            VideoLink: "動画リンク",
            DownloadLink: "ダウンロードリンク",
            ExternalLink: "外部リンク",
            "帖子內容": "投稿内容",
            "帖子數量": "投稿数",
            "建立時間": "作成日時",
            "獲取頁面": "ページ取得",
            "作者網站": "作者のサイト",
            "未取得數據": "データ取得失敗",
            "模式切換": "モード切替",
            "數據處理中": "データ処理中",
            "當前處理頁數": "処理中のページ",
            "數據處理完成": "データ処理完了",
            "Json 數據下載": "JSONデータダウンロード",
            "當前帖子數": "現在の投稿数",
            "開帖說明": "\n\n!! 入力せずに確定すると、現在のページの全投稿が開かれます。\n範囲を指定して開く:\n単一: 1, 2, 3\n範囲: 1~5, 6-10\n除外: !5, -10"
        },
        Korea: {
            "🔁 切換下載模式": "🔁 다운로드 모드 전환",
            "📑 獲取帖子數據": "📑 게시물 데이터 가져오기",
            "📃 開啟當前頁面帖子": "📃 현재 페이지 게시물 열기",
            "📥 強制壓縮下載": "📥 강제 압축 다운로드",
            "⛔️ 取消下載": "⛔️ 다운로드 취소",
            "壓縮下載": "압축 다운로드",
            "單獨下載": "개별 다운로드",
            "開始下載": "다운로드 시작",
            "無法下載": "다운로드 불가",
            "下載進度": "다운로드 진행률",
            "封裝進度": "패키징 진행률",
            "壓縮封裝失敗": "압축 실패",
            "下載完成": "다운로드 완료",
            "請求進度": "요청 진행률",
            "下載中鎖定": "다운로드 중 잠금",
            "原始連結": "원본 링크",
            "圖片數量": "이미지 수",
            "影片數量": "영상 수",
            "下載連結": "다운로드 링크",
            "密碼": "비밀번호",
            "連結": "링크",
            "作者": "작성자",
            "時間": "시간",
            "來源": "출처",
            "元數據": "메타데이터",
            PostLink: "게시물 링크",
            Timestamp: "타임스탬프",
            TypeTag: "유형 태그",
            ImgLink: "이미지 링크",
            VideoLink: "영상 링크",
            DownloadLink: "다운로드 링크",
            ExternalLink: "외부 링크",
            "帖子內容": "게시물 내용",
            "帖子數量": "게시물 수",
            "建立時間": "생성 시간",
            "獲取頁面": "페이지 로딩",
            "作者網站": "작성자 웹사이트",
            "未取得數據": "데이터를 가져오지 못함",
            "模式切換": "모드 전환",
            "數據處理中": "데이터 처리 중",
            "當前處理頁數": "처리 중인 페이지",
            "數據處理完成": "데이터 처리 완료",
            "Json 數據下載": "JSON 데이터 다운로드",
            "當前帖子數": "현재 게시물 수",
            "開帖說明": "\n\n!! 입력 없이 확인 시, 현재 페이지의 모든 게시물을 엽니다.\n열람 범위 입력 (예시):\n단일: 1, 2, 3\n범위: 1~5, 6-10\n제외: !5, -10"
        },
        Russia: {
            "🔁 切換下載模式": "🔁 Сменить режим загрузки",
            "📑 獲取帖子數據": "📑 Получить данные постов",
            "📃 開啟當前頁面帖子": "📃 Открыть посты на странице",
            "📥 強制壓縮下載": "📥 Принудительно скачать архивом",
            "⛔️ 取消下載": "⛔️ Отменить загрузку",
            "壓縮下載": "Скачать архивом",
            "單獨下載": "Одиночная загрузка",
            "開始下載": "Начать загрузку",
            "無法下載": "Ошибка загрузки",
            "下載進度": "Прогресс загрузки",
            "封裝進度": "Прогресс упаковки",
            "壓縮封裝失敗": "Ошибка архивации",
            "下載完成": "Загрузка завершена",
            "請求進度": "Прогресс запроса",
            "下載中鎖定": "Блокировка на время загрузки",
            "原始連結": "Оригинальная ссылка",
            "圖片數量": "Кол-во изображений",
            "影片數量": "Кол-во видео",
            "下載連結": "Ссылка на скачивание",
            "密碼": "Пароль",
            "連結": "Ссылка",
            "作者": "Автор",
            "時間": "Время",
            "來源": "Источник",
            "元數據": "Метаданные",
            PostLink: "Ссылка на пост",
            Timestamp: "Дата публикации",
            TypeTag: "Тег типа",
            ImgLink: "Ссылка на изображение",
            VideoLink: "Ссылка на видео",
            DownloadLink: "Ссылка на скачивание",
            ExternalLink: "Внешняя ссылка",
            "帖子內容": "Содержимое поста",
            "帖子數量": "Количество постов",
            "建立時間": "Время создания",
            "獲取頁面": "Загрузка страницы",
            "作者網站": "Сайт автора",
            "未取得數據": "Не удалось получить данные",
            "模式切換": "Смена режима",
            "數據處理中": "Обработка данных",
            "當前處理頁數": "Обрабатываемая страница",
            "數據處理完成": "Обработка завершена",
            "Json 數據下載": "Скачать JSON",
            "當前帖子數": "Текущее кол-во постов",
            "開帖說明": '\n\n!! Нажмите "ОК" без ввода, чтобы открыть все посты на странице.\nВведите диапазон для открытия:\nОдин пост: 1, 2, 3\nДиапазон: 1~5, 6-10\nИсключить: !5, -10'
        },
        English: {
            "🔁 切換下載模式": "🔁 Switch Download Mode",
            "📑 獲取帖子數據": "📑 Fetch Post Data",
            "📃 開啟當前頁面帖子": "📃 Open Posts on This Page",
            "📥 強制壓縮下載": "📥 Force ZIP Download",
            "⛔️ 取消下載": "⛔️ Cancel Download",
            "壓縮下載模式": "ZIP Download Mode",
            "單圖下載模式": "Individual Download Mode",
            "壓縮下載": "Download as ZIP",
            "單獨下載": "Download Individually",
            "開始下載": "Start Download",
            "無法下載": "Download Failed",
            "下載進度": "Download Progress",
            "封裝進度": "Packaging Progress",
            "壓縮封裝失敗": "ZIP Packaging Failed",
            "下載完成": "Download Complete",
            "請求進度": "Request Progress",
            "下載中鎖定": "Locked While Downloading",
            "原始連結": "Original Link",
            "圖片數量": "Image Count",
            "影片數量": "Video Count",
            "下載連結": "Download Link",
            "密碼": "Password",
            "連結": "Link",
            "作者": "Author",
            "時間": "Time",
            "來源": "Source",
            "元數據": "Metadata",
            "帖子內容": "Post Content",
            "帖子數量": "Number of Posts",
            "建立時間": "Created At",
            "獲取頁面": "Fetching Page",
            "作者網站": "Author's Website",
            "未取得數據": "Failed to Retrieve Data",
            "模式切換": "Switch Mode",
            "數據處理中": "Processing Data",
            "當前處理頁數": "Processing Page",
            "數據處理完成": "Processing Complete",
            "Json 數據下載": "Download JSON Data",
            "當前帖子數": "Current Post Count",
            "開帖說明": "\n\n!! Confirming without input will open all posts on the current page.\nEnter range to open (e.g.):\nSingle: 1, 2, 3\nRange: 1~5, 6-10\nExclude: !5, -10"
        }
    };
    function Fetch(General2, FetchSet2, Process2, Transl2, Lib2, md52) {
        return class FetchData {
            static Try_Again_Promise = null;
            constructor() {
                this.metaDict = new Map();
                this.dataDict = new Map();
                this.sourceURL = Lib2.url;
                this.titleCache = Lib2.title();
                this.URL = new URL(this.sourceURL);
                this.host = this.URL.host;
                this.firstURL = this.URL.origin + this.URL.pathname;
                this.queryValue = this.URL.search;
                if (this.queryValue === "") {
                    this.URL.searchParams.delete("q");
                    this.sourceURL = this.URL.href;
                }
                this.currentPage = 1;
                this.finalPage = 1;
                this.totalPages = 0;
                this.progress = 0;
                this.onlyMode = false;
                this.fetchDelay = FetchSet2.Delay;
                this.toLinkTxt = FetchSet2.ToLinkTxt;
                this.advancedFetch = FetchSet2.AdvancedFetch;
                this.getPostURL = id => `${this.firstURL}/post/${id}`;
                this.getNextPageURL = urlStr => {
                    const url = new URL(urlStr);
                    const search = url.searchParams;
                    const q = search.get("q");
                    let o = search.get("o");
                    o = o ? +o + 50 : 50;
                    const params = q ? `?o=${o}&q=${q}` : `?o=${o}`;
                    return `${url.origin}${url.pathname}${params}`;
                };
                this.postAPI = `${this.firstURL}/post`.replace(this.host, `${this.host}/api/v1`);
                this.getPreviewAPI = url => /[?&]o=/.test(url) ? url.replace(this.host, `${this.host}/api/v1`).replace(/([?&]o=)/, "/posts-legacy$1") : this.queryValue ? url.replace(this.host, `${this.host}/api/v1`).replace(this.queryValue, `/posts-legacy${this.queryValue}`) : url.replace(this.host, `${this.host}/api/v1`) + "/posts-legacy";
                this.getValidValue = value => {
                    if (!value) return null;
                    const type = Lib2.$type(value);
                    if (type === "Array") return value.length > 0 && value.some(item => item !== "") ? value : null;
                    if (type === "Object") {
                        const values = Object.values(value);
                        return values.length > 0 && values.some(item => item !== "") ? value : null;
                    }
                    return value;
                };
                this.infoRules = new Set(["PostLink", "Timestamp", "TypeTag", "ImgLink", "VideoLink", "DownloadLink"]);
                this.fetchGenerate = Data => {
                    return Object.keys(Data).reduce((acc, key) => {
                        if (this.infoRules.has(key)) {
                            const value = this.getValidValue(Data[key]);
                            value && (acc[Transl2(key)] = value);
                        }
                        return acc;
                    }, {});
                };
                const filterExts = new Set(FetchSet2.FilterExts);
                const videoExts = new Set(Process2.VideoExts);
                const imageExts = new Set(Process2.ImageExts);
                this.isVideo = str => videoExts.has(str.replace(/^\./, "").toLowerCase());
                this.isImage = str => imageExts.has(str.replace(/^\./, "").toLowerCase());
                this.normalizeName = (title, index) => title.trim().replace(/\n/g, " ") || `Untitled_${String((this.currentPage - 1) * 50 + (index + 1)).padStart(2, "0")}`;
                this.normalizeTimestamp = post => new Date(post.published || post.added)?.toLocaleString();
                this.kemerCategorize = ({
                    title,
                    data,
                    serverDict,
                    fillValue
                }) => {
                    let imgNumber = 0;
                    return data.reduce((acc, file) => {
                        const name = file.name;
                        const path = file.path;
                        const extension = Lib2.suffixName(path, "");
                        if (filterExts.has(extension)) return acc;
                        const server = serverDict ? `${serverDict[path]}/data` : `${file.server}/data`;
                        const url = `${server}${path}`;
                        if (this.isVideo(extension)) {
                            acc.video[name] = `${url}?f=${name}`;
                        } else if (this.isImage(extension)) {
                            const name2 = `${title}_${String(++imgNumber).padStart(fillValue, "0")}.${extension}`;
                            acc.img[name2] = `${url}?f=${name2}`;
                        } else {
                            acc.other[name] = `${url}?f=${name}`;
                        }
                        return acc;
                    }, {
                        img: {},
                        video: {},
                        other: {}
                    });
                };
                this.deepDecodeURIComponent = str => {
                    let prev = str;
                    let curr = decodeURIComponent(prev);
                    while (curr !== prev) {
                        prev = curr;
                        curr = decodeURIComponent(prev);
                    }
                    return curr;
                };
                this.nekoCategorize = (title, data) => {
                    let imgNumber = 0;
                    return data.reduce((acc, file) => {
                        const uri = file.src || file.href || file.$gAttr("src") || file.$gAttr("href");
                        if (uri) {
                            const extension = Lib2.suffixName(uri, "");
                            if (filterExts.has(extension)) return acc;
                            const url = uri.startsWith("http") ? uri : `${Lib2.$origin}${uri}`;
                            const getDownloadName = link => this.deepDecodeURIComponent(link.download?.trim() || link.$text());
                            if (this.isVideo(extension)) {
                                acc.video[getDownloadName(file)] = url;
                            } else if (this.isImage(extension)) {
                                const name = `${title}_${String(++imgNumber).padStart(2, "0")}.${extension}`;
                                acc.img[name] = `${url}?filename=${name}`;
                            } else {
                                const name = getDownloadName(file);
                                acc.other[name] = `${url}?filename=${name}`;
                            }
                        }
                        return acc;
                    }, {
                        video: {},
                        img: {},
                        other: {}
                    });
                };
                this.specialLinkParse = data => {
                    const Cache = {};
                    try {
                        for (const a of Lib2.domParse(data).$qa("body a")) {
                            const href = a.href;
                            const hash = md52(href).slice(0, 16);
                            if (href.startsWith("https://mega.nz")) {
                                let name = a.previousElementSibling?.$text().replace(":", "") || hash;
                                if (name === "") continue;
                                let pass = "";
                                const nextNode = a.nextElementSibling;
                                if (nextNode) {
                                    const nodeText = [...nextNode.childNodes].find(node => node.nodeType === Node.TEXT_NODE)?.$text() ?? "";
                                    if (nodeText.startsWith("Pass")) {
                                        pass = nodeText.match(/Pass:([^<]*)/)?.[1]?.trim() ?? "";
                                    }
                                }
                                Cache[name] = pass ? {
                                    [Transl2("密碼")]: pass,
                                    [Transl2("連結")]: href
                                } : href;
                            } else if (href) {
                                const description = a.previousSibling?.$text() ?? "";
                                const name = `${description} ${a?.$text()}`.trim();
                                Cache[name ? name : hash] = href;
                            }
                        }
                    } catch (error) {
                        Lib2.log("Error specialLinkParse", error, {
                            dev: General2.Dev,
                            type: "error",
                            collapsed: false
                        });
                    }
                    return Cache;
                };
                this.TooMany_TryAgain = function (url) {
                    if (FetchData.Try_Again_Promise) {
                        return FetchData.Try_Again_Promise;
                    }
                    const promiseLock = new Promise(async (resolve, reject) => {
                        const sleepTime = 5e3;
                        const timeout = 2e5;
                        const checkRequest = async () => {
                            const controller = new AbortController();
                            const signal = controller.signal;
                            const timeoutId = setTimeout(() => controller.abort(), timeout);
                            try {
                                const response = await fetch(url, {
                                    method: "HEAD",
                                    signal: signal,
                                    cache: "no-store"
                                });
                                clearTimeout(timeoutId);
                                if (response.status === 429 || response.status === 503) {
                                    await Lib2.sleep(sleepTime);
                                    await checkRequest();
                                } else if (response.status === 200) {
                                    resolve(response);
                                }
                            } catch (err) {
                                clearTimeout(timeoutId);
                                await Lib2.sleep(sleepTime);
                                await checkRequest();
                            }
                        };
                        await checkRequest();
                    });
                    FetchData.Try_Again_Promise = promiseLock;
                    promiseLock.finally(() => {
                        if (FetchData.Try_Again_Promise === promiseLock) {
                            FetchData.Try_Again_Promise = null;
                        }
                    });
                    return promiseLock;
                };
                this.worker = Lib2.workerCreate(`
                let queue = [], processing=false;
                onmessage = function(e) {
                    queue.push(e.data);
                    !processing && (processing=true, processQueue());
                }
                async function processQueue() {
                    if (queue.length > 0) {
                        const {index, title, url, time, delay} = queue.shift();
                        FetchRequest(index, title, url, time, delay);
                        processQueue();
                    } else {processing = false}
                }
                async function FetchRequest(index, title, url, time, delay) {
                    fetch(url).then(response => {
                        if (response.ok) {
                            // 目前不同網站不一定都是 Json, 所以這裡用 text()
                            response.text().then(content => {
                                postMessage({ index, title, url, content, time, delay, error: false });
                            });
                        } else {
                            postMessage({ index, title, url, content: "", time, delay, error: true });
                        }
                    })
                    .catch(error => {
                        postMessage({ index, title, url, content: "", time, delay, error: true });
                    });
                }
            `);
                FetchSet2.UseFormat && this._fetchConfig(FetchSet2.Mode, FetchSet2.Format);
            }
            async _fetchConfig(mode = "FilterMode", userSet = []) {
                if (!mode || typeof mode !== "string" || !Array.isArray(userSet)) return;
                if (mode.toLowerCase() === "filtermode") {
                    this.onlyMode = false;
                    userSet.forEach(key => this.infoRules.delete(key));
                } else if (mode.toLowerCase() === "onlymode") {
                    this.onlyMode = true;
                    const userFilter = new Set(userSet);
                    this.infoRules = new Set([...this.infoRules].filter(key => userFilter.has(key)));
                }
            }
            async fetchRun() {
                const small = Lib2.$q("small");
                const items = Lib2.$q(".card-list__items");
                if (items) {
                    Process2.Lock = true;
                    const currentPage = +Lib2.$q(".pagination-button-current b")?.$text();
                    currentPage && (this.currentPage = currentPage);
                    if (small) {
                        this.totalPages = +small.$text().split(" of ")[1] || 0;
                        this.finalPage = Math.max(Math.ceil(this.totalPages / 50), 1);
                    }
                    this._fetchPage(items, this.sourceURL);
                } else {
                    alert(Transl2("未取得數據"));
                }
            }
            async fetchTest(id) {
                Process2.Lock = true;
                this.worker.postMessage({
                    index: 0,
                    title: this.titleCache,
                    url: this.getPreviewAPI(this.firstURL)
                });
                const homeData = await new Promise((resolve, reject) => {
                    this.worker.onmessage = async e => {
                        const {
                            index,
                            title,
                            url,
                            content: content2,
                            error
                        } = e.data;
                        if (!error) resolve({
                            url: url,
                            content: content2
                        }); else {
                            Lib2.log(error, {
                                title: title,
                                url: url
                            }, {
                                dev: General2.Dev,
                                type: "error",
                                collapsed: false
                            });
                            await this.TooMany_TryAgain(url);
                            this.worker.postMessage({
                                index: index,
                                title: title,
                                url: url
                            });
                        }
                    };
                });
                const {
                    content
                } = homeData;
                Object.assign(homeData, {
                    content: JSON.parse(content)
                });
                Lib2.log("HomeData", homeData, {
                    collapsed: false
                });
                const homeDataClone = structuredClone(homeData);
                homeDataClone.content.results = [{
                    id: id
                }];
                homeDataClone.content = JSON.stringify(homeDataClone.content);
                await this._fetchContent(homeDataClone);
                Lib2.log("PostDate", this.dataDict, {
                    collapsed: false
                });
                this._reset();
            }
            async _fetchPage(items, url) {
                if (Process2.IsNeko) {
                    if (!items) {
                        this.worker.postMessage({
                            index: 0,
                            title: this.titleCache,
                            url: url,
                            time: Date.now(),
                            delay: this.fetchDelay
                        });
                        const homeData = await new Promise((resolve, reject) => {
                            this.worker.onmessage = async e => {
                                const {
                                    index,
                                    title,
                                    url: url2,
                                    content,
                                    time,
                                    delay,
                                    error
                                } = e.data;
                                if (!error) {
                                    this.fetchDelay = Process2.dynamicParam(time, delay);
                                    resolve(content);
                                } else {
                                    Lib2.log(error, {
                                        title: title,
                                        url: url2
                                    }, {
                                        dev: General2.Dev,
                                        type: "error",
                                        collapsed: false
                                    });
                                    await this.TooMany_TryAgain(url2);
                                    this.worker.postMessage({
                                        index: index,
                                        title: title,
                                        url: url2,
                                        time: time,
                                        delay: delay
                                    });
                                }
                            };
                        });
                        items = Lib2.domParse(homeData)?.$q(".card-list__items");
                    }
                    if (items) {
                        const article = items.$qa("article");
                        const content = article.map((item, index) => ({
                            index: index,
                            title: item.$q("header").$text(),
                            url: item.$q("a").href
                        }));
                        await this._fetchContent({
                            content: content
                        });
                    }
                } else {
                    this.worker.postMessage({
                        index: 0,
                        title: this.titleCache,
                        url: this.getPreviewAPI(url),
                        time: Date.now(),
                        delay: this.fetchDelay
                    });
                    const homeData = await new Promise((resolve, reject) => {
                        this.worker.onmessage = async e => {
                            const {
                                index,
                                title,
                                url: url2,
                                content,
                                time,
                                delay,
                                error
                            } = e.data;
                            if (!error) {
                                this.fetchDelay = Process2.dynamicParam(time, delay);
                                resolve({
                                    url: url2,
                                    content: content
                                });
                            } else {
                                Lib2.log(error, {
                                    title: title,
                                    url: url2
                                }, {
                                    dev: General2.Dev,
                                    type: "error",
                                    collapsed: false
                                });
                                await this.TooMany_TryAgain(url2);
                                this.worker.postMessage({
                                    index: index,
                                    title: title,
                                    url: url2,
                                    time: time,
                                    delay: delay
                                });
                            }
                        };
                    });
                    await this._fetchContent(homeData);
                }
                this.currentPage++;
                this.currentPage <= this.finalPage ? this._fetchPage(null, this.getNextPageURL(url)) : this.toLinkTxt ? this._toTxt() : this._toJson();
            }
            async _fetchContent(homeData) {
                this.progress = 0;
                const {
                    url,
                    content
                } = homeData;
                if (Process2.IsNeko) {
                    let taskCount = 0;
                    const tasks = [];
                    const resolvers = new Map();
                    const postCount = content.length;
                    if (this.metaDict.size === 0) {
                        this.metaDict.set(Transl2("作者"), Lib2.$q("span[itemprop='name'], fix_name").$text());
                        this.metaDict.set(Transl2("帖子數量"), this.totalPages > 0 ? this.totalPages : postCount);
                        this.metaDict.set(Transl2("建立時間"), Lib2.getDate("{year}-{month}-{date} {hour}:{minute}"));
                        this.metaDict.set(Transl2("獲取頁面"), this.sourceURL);
                    }
                    this.worker.onmessage = async e => {
                        const {
                            index,
                            title,
                            url: url2,
                            content: content2,
                            time,
                            delay,
                            error
                        } = e.data;
                        if (!error) {
                            const {
                                resolve,
                                reject
                            } = resolvers.get(index);
                            this.fetchDelay = Process2.dynamicParam(time, delay);
                            const standardTitle = this.normalizeName(title, index);
                            const postDom = Lib2.domParse(content2);
                            const classifiedFiles = this.nekoCategorize(standardTitle, [...postDom.$qa(".fileThumb"), ...postDom.$qa(".scrape__attachments a")]);
                            const generatedData = this.fetchGenerate({
                                PostLink: url2,
                                Timestamp: postDom.$q(".timestamp").$text(),
                                ImgLink: classifiedFiles.img,
                                VideoLink: classifiedFiles.video,
                                DownloadLink: classifiedFiles.other
                            });
                            if (Object.keys(generatedData).length !== 0) {
                                this.dataDict.set(standardTitle, generatedData);
                            }
                            resolve();
                            Lib2.title(`（${this.currentPage} - ${++taskCount}）`);
                            Lib2.log("Request Successful", {
                                index: index,
                                title: standardTitle,
                                url: url2,
                                data: generatedData
                            }, {
                                dev: General2.Dev,
                                collapsed: false
                            });
                        } else {
                            await this.TooMany_TryAgain(url2);
                            this.worker.postMessage({
                                index: index,
                                title: title,
                                url: url2,
                                time: time,
                                delay: delay
                            });
                        }
                    };
                    for (const {
                        index,
                        title,
                        url: url2
                    } of content) {
                        tasks.push(new Promise((resolve, reject) => {
                            resolvers.set(index, {
                                resolve: resolve,
                                reject: reject
                            });
                            this.worker.postMessage({
                                index: index,
                                title: title,
                                url: url2,
                                time: Date.now(),
                                delay: this.fetchDelay
                            });
                        }));
                        await Lib2.sleep(this.fetchDelay);
                    }
                    await Promise.allSettled(tasks);
                } else {
                    const contentJson = JSON.parse(content);
                    if (contentJson) {
                        if (this.metaDict.size === 0) {
                            const props = contentJson.props;
                            this.metaDict.set(Transl2("作者"), props.name);
                            this.metaDict.set(Transl2("帖子數量"), props.count);
                            this.metaDict.set(Transl2("建立時間"), Lib2.getDate("{year}-{month}-{date} {hour}:{minute}"));
                            this.metaDict.set(Transl2("獲取頁面"), this.sourceURL);
                            this.metaDict.set(Transl2("作者網站"), props.display_data.href);
                        }
                        const results = contentJson.results;
                        if (this.advancedFetch) {
                            const tasks = [];
                            const resolvers = new Map();
                            this.worker.onmessage = async e => {
                                const {
                                    index,
                                    title,
                                    url: url2,
                                    content: content2,
                                    time,
                                    delay,
                                    error
                                } = e.data;
                                try {
                                    if (!error) {
                                        const {
                                            resolve,
                                            reject
                                        } = resolvers.get(index);
                                        this.fetchDelay = Process2.dynamicParam(time, delay);
                                        const contentJson2 = JSON.parse(content2);
                                        if (contentJson2) {
                                            const post = contentJson2.post;
                                            const previews = contentJson2.previews || [];
                                            const attachments = contentJson2.attachments || [];
                                            const standardTitle = this.normalizeName(post.title, index);
                                            const classifiedFiles = this.kemerCategorize({
                                                title: standardTitle,
                                                data: [...previews, ...attachments],
                                                fillValue: Lib2.getFill(previews?.length || 1)
                                            });
                                            const generatedData = this.fetchGenerate({
                                                PostLink: this.getPostURL(post.id),
                                                Timestamp: this.normalizeTimestamp(post),
                                                TypeTag: post.tags,
                                                ImgLink: classifiedFiles.img,
                                                VideoLink: classifiedFiles.video,
                                                DownloadLink: classifiedFiles.other,
                                                ExternalLink: this.specialLinkParse(post.content)
                                            });
                                            if (Object.keys(generatedData).length !== 0) {
                                                this.dataDict.set(standardTitle, generatedData);
                                            }
                                            resolve();
                                            Lib2.title(`（${this.currentPage} - ${++this.progress}）`);
                                            Lib2.log("Request Successful", {
                                                index: index,
                                                title: standardTitle,
                                                url: url2,
                                                data: generatedData
                                            }, {
                                                dev: General2.Dev,
                                                collapsed: false
                                            });
                                        } else throw new Error("Json Parse Failed");
                                    } else {
                                        throw new Error("Request Failed");
                                    }
                                } catch (error2) {
                                    Lib2.log(error2, {
                                        index: index,
                                        title: title,
                                        url: url2
                                    }, {
                                        dev: General2.Dev,
                                        type: "error",
                                        collapsed: false
                                    });
                                    await this.TooMany_TryAgain(url2);
                                    this.worker.postMessage({
                                        index: index,
                                        title: title,
                                        url: url2,
                                        time: time,
                                        delay: delay
                                    });
                                }
                            };
                            for (const [index, post] of results.entries()) {
                                tasks.push(new Promise((resolve, reject) => {
                                    resolvers.set(index, {
                                        resolve: resolve,
                                        reject: reject
                                    });
                                    this.worker.postMessage({
                                        index: index,
                                        title: post.title,
                                        url: `${this.postAPI}/${post.id}`,
                                        time: Date.now(),
                                        delay: this.fetchDelay
                                    });
                                }));
                                await Lib2.sleep(this.fetchDelay);
                            }
                            await Promise.allSettled(tasks);
                        } else {
                            const previews = contentJson.result_previews || [];
                            const attachments = contentJson.result_attachments || [];
                            for (const [index, post] of results.entries()) {
                                const standardTitle = this.normalizeName(post.title, index);
                                try {
                                    const serverDict = [...previews[index], ...attachments[index]].reduce((acc, item) => {
                                        acc[item.path] = item.server;
                                        return acc;
                                    }, {});
                                    const classifiedFiles = this.kemerCategorize({
                                        title: standardTitle,
                                        data: [...post.file ? Array.isArray(post.file) ? post.file : Object.keys(post.file).length ? [post.file] : [] : [], ...post.attachments],
                                        serverDict: serverDict,
                                        fillValue: Lib2.getFill(previews?.length || 1)
                                    });
                                    const generatedData = this.fetchGenerate({
                                        PostLink: this.getPostURL(post.id),
                                        Timestamp: this.normalizeTimestamp(post),
                                        ImgLink: classifiedFiles.img,
                                        VideoLink: classifiedFiles.video,
                                        DownloadLink: classifiedFiles.other
                                    });
                                    if (Object.keys(generatedData).length !== 0) {
                                        this.dataDict.set(standardTitle, generatedData);
                                    }
                                    Lib2.title(`（${this.currentPage}）`);
                                    Lib2.log("Parsed Successful", {
                                        index: index,
                                        title: standardTitle,
                                        url: url,
                                        data: generatedData
                                    }, {
                                        dev: General2.Dev,
                                        collapsed: false
                                    });
                                } catch (error) {
                                    Lib2.log(error, {
                                        index: index,
                                        title: standardTitle,
                                        url: url
                                    }, {
                                        dev: General2.Dev,
                                        type: "error",
                                        collapsed: false
                                    });
                                    continue;
                                }
                            }
                        }
                        await Lib2.sleep(this.fetchDelay);
                    }
                }
                return true;
            }
            async _reset() {
                this.metaDict = null;
                this.dataDict = null;
                this.worker.terminate();
                Process2.Lock = false;
                Lib2.title(this.titleCache);
            }
            async _toTxt() {
                let content = "";
                for (const value of this.dataDict.values()) {
                    const getLinks = Object.assign({}, value[Transl2("ImgLink")], value[Transl2("VideoLink")], value[Transl2("DownloadLink")]);
                    for (const link of Object.values(getLinks)) {
                        content += `${encodeURI(link)}
`;
                    }
                }
                if (content.endsWith("\n")) content = content.slice(0, -1);
                Lib2.outputTXT(content, this.metaDict.get(Transl2("作者")), () => {
                    content = null;
                    this._reset();
                });
            }
            async _toJson() {
                let jsonData = Object.assign({}, {
                    [Transl2("元數據")]: Object.fromEntries(this.metaDict)
                }, {
                    [`${Transl2("帖子內容")} (${this.dataDict.size})`]: Object.fromEntries(this.dataDict)
                });
                Lib2.outputJson(jsonData, this.metaDict.get(Transl2("作者")), () => {
                    jsonData = null;
                    this._reset();
                });
            }
        };
    }
    function Downloader(GM_unregisterMenuCommand2, GM_xmlhttpRequest2, GM_download2, General2, FileName2, Process2, Transl2, Lib2, saveAs2) {
        const zipper = Lib2.createCompressor();
        return class Download {
            constructor(compressMode, modeDisplay, button) {
                this.button = button;
                this.modeDisplay = modeDisplay;
                this.compressMode = compressMode;
                this.namedData = null;
                this.forceCompressSignal = false;
                this.originalTitle = () => {
                    const cache = Lib2.title();
                    return cache.startsWith("✓ ") ? cache.slice(2) : cache;
                };
                const videoExts = new Set(Process2.VideoExts);
                this.isVideo = str => videoExts.has(str.replace(/^\./, "").toLowerCase());
                this.worker = this.compressMode ? Lib2.workerCreate(`
                let queue = [], processing=false;
                onmessage = function(e) {
                    queue.push(e.data);
                    !processing && (processing=true, processQueue());
                }
                async function processQueue() {
                    if (queue.length > 0) {
                        const {index, url} = queue.shift();
                        FetchRequest(index, url);
                        processQueue();
                    } else {processing = false}
                }

                async function FetchRequest(index, url) {
                    try {
                        const response = await fetch(url);
                        if (response.ok === true && response.status === 200) {
                            const blob = await response.blob();
                            postMessage({ index, url: url, blob, error: false });
                        } else {
                            postMessage({ index, url: url, blob: "", error: true });
                        }
                    } catch {
                        postMessage({ index, url: url, blob: "", error: true });
                    }
                }
            `) : null;
            }
            _nameAnalysis(format) {
                if (typeof format == "string") {
                    return format.split(/{([^}]+)}/g).filter(Boolean).map(data => {
                        const lowerData = data.toLowerCase().trim();
                        const isWord = /^[a-zA-Z]+$/.test(lowerData);
                        return isWord ? this.namedData[lowerData]?.() ?? "None" : data;
                    }).join("");
                } else if (typeof format == "object") {
                    const filler = String(format.Filler) || "0";
                    const amount = parseInt(format.Amount) || "auto";
                    return [amount, filler];
                } else;
            }
            downloadTrigger(sourceType) {
                Lib2.waitEl([".post__title, .scrape__title", ".post__files, .scrape__files", ".post__user-name, .scrape__user-name, fix_name"], found => {
                    const [title, files, artist] = found;
                    Process2.Lock = true;
                    this.button.disabled = true;
                    const downloadData = new Map();
                    this.namedData = {
                        fill: () => "fill",
                        title: () => title.$q("span").$text().replaceAll("/", "／"),
                        artist: () => artist.$text(),
                        source: () => new Date(title.$q(":nth-child(2)").$text()).toLocaleString(),
                        time: () => {
                            if (Process2.IsNeko) {
                                return Lib2.$q(".timestamp").$text() || "";
                            }
                            let published = Lib2.$q(".post__published").$copy();
                            Lib2.$q(".post__published");
                            published.firstElementChild.remove();
                            return published.$text().split(" ")[0];
                        }
                    };
                    const [compressName, folderName, fillName] = Object.keys(FileName2).slice(1).map(key => this._nameAnalysis(FileName2[key]));
                    const imgData = [...files.children].map(child => child.$q(Process2.IsNeko ? ".fileThumb, rc, img" : "a, rc, img")).filter(Boolean);
                    const extrasData = Lib2.$qa(".post__attachment a:not(.fancy-link), .scrape__attachments a");
                    const finalData = General2.IncludeExtras ? [...imgData, ...extrasData] : sourceType === "Files" ? imgData : extrasData;
                    for (const [index, file] of finalData.entries()) {
                        const uri = file.src || file.href || file.$gAttr("src") || file.$gAttr("href");
                        if (uri) {
                            downloadData.set(index, uri.startsWith("http") ? uri : `${Lib2.$origin}${uri}`);
                        }
                    }
                    if (downloadData.size == 0) General2.Dev = true;
                    Lib2.log("Get Data", {
                        FolderName: folderName,
                        DownloadData: downloadData
                    }, {
                        dev: General2.Dev,
                        collapsed: false
                    });
                    this.compressMode ? this._packDownload(compressName, folderName, fillName, downloadData) : this._separDownload(fillName, downloadData);
                }, {
                    raf: true
                });
            }
            async _packDownload(compressName, folderName, fillName, data) {
                let show, extension, progress = 0, total = data.size;
                const self = this, titleCache = this.originalTitle();
                const fillValue = this._nameAnalysis(FileName2.FillValue), filler = fillValue[1], amount = fillValue[0] == "auto" ? Lib2.getFill(total) : fillValue[0];
                async function forceDownload() {
                    self._compressFile(compressName, titleCache);
                }
                Lib2.regMenu({
                    [Transl2("📥 強制壓縮下載")]: {
                        func: () => forceDownload(),
                        hotkey: "d"
                    }
                }, {
                    name: "Enforce"
                });
                folderName = folderName != "" ? `${folderName}/` : "";
                function requestUpdate(index, url, blob, error = false) {
                    if (self.forceCompressSignal) return;
                    requestAnimationFrame(() => {
                        if (!error && blob instanceof Blob && blob.size > 0) {
                            extension = Lib2.suffixName(url);
                            const fileName = `${fillName.replace("fill", Lib2.mantissa(index, amount, filler))}.${extension}`;
                            self.isVideo(extension) ? zipper.file(`${folderName}${decodeURIComponent(url).split("?f=")[1] || Lib2.$q(`a[href*="${new URL(url).pathname}"]`).$text() || fileName}`, blob) : zipper.file(`${folderName}${fileName}`, blob);
                            data.delete(index);
                        }
                        show = `[${++progress}/${total}]`;
                        Lib2.title(show);
                        self.button.$text(`${Transl2("下載進度")} ${show}`);
                        if (progress == total) {
                            total = data.size;
                            if (total == 0) {
                                self._compressFile(compressName, titleCache);
                            } else {
                                show = "Wait for failed re download";
                                progress = 0;
                                Lib2.title(show);
                                self.button.$text(show);
                                setTimeout(() => {
                                    for (const [index2, url2] of data.entries()) {
                                        self.worker.postMessage({
                                            index: index2,
                                            url: url2
                                        });
                                    }
                                }, 1500);
                            }
                        }
                    });
                }
                async function request(index, url) {
                    if (self.forceCompressSignal) return;
                    GM_xmlhttpRequest2({
                        url: url,
                        method: "GET",
                        responseType: "blob",
                        onload: response => {
                            if (response.status == 429) {
                                requestUpdate(index, url, "", true);
                                return;
                            }
                            requestUpdate(index, url, response.response);
                        },
                        onerror: () => {
                            requestUpdate(index, url, "", true);
                        }
                    });
                }
                self.button.$text(`${Transl2("請求進度")} [${total}/${total}]`);
                const batch = General2.ConcurrentQuantity;
                const delay = General2.ConcurrentDelay;
                for (let i = 0; i < total; i += batch) {
                    setTimeout(() => {
                        for (let j = i; j < i + batch && j < total; j++) {
                            this.worker.postMessage({
                                index: j,
                                url: data.get(j)
                            });
                        }
                    }, i / batch * delay);
                }
                this.worker.onmessage = e => {
                    const {
                        index,
                        url,
                        blob,
                        error
                    } = e.data;
                    error ? (request(index, url), Lib2.log("Download Failed", url, {
                        dev: General2.Dev,
                        type: "error",
                        collapsed: false
                    })) : (requestUpdate(index, url, blob), Lib2.log("Download Successful", url, {
                        dev: General2.Dev,
                        collapsed: false
                    }));
                };
            }
            async _separDownload(fillName, data) {
                let show, url, fileName, extension, token = 5, stop = false, progress = 0;
                const self = this, process = [], promises = [], total = data.size, showTracking = {}, titleCache = this.originalTitle();
                const fillValue = this._nameAnalysis(FileName2.FillValue), filler = fillValue[1], amount = fillValue[0] == "auto" ? Lib2.getFill(total) : fillValue[0];
                async function _stop() {
                    stop = true;
                    process.forEach(pc => pc.abort());
                }
                Lib2.regMenu({
                    [Transl2("⛔️ 取消下載")]: {
                        func: () => _stop(),
                        hotkey: "s"
                    }
                }, {
                    name: "Abort"
                });
                async function request(index) {
                    if (stop) return;
                    url = data.get(index);
                    extension = Lib2.suffixName(url);
                    const FileName3 = `${fillName.replace("fill", Lib2.mantissa(index, amount, filler))}.${extension}`;
                    fileName = self.isVideo(extension) ? decodeURIComponent(url).split("?f=")[1] || Lib2.$q(`a[href*="${new URL(url).pathname}"]`).$text() || FileName3 : FileName3;
                    return new Promise((resolve, reject) => {
                        const completed = () => {
                            if (!showTracking[index]) {
                                showTracking[index] = true;
                                Lib2.log("Download Successful", url, {
                                    dev: General2.Dev,
                                    collapsed: false
                                });
                                show = `[${++progress}/${total}]`;
                                Lib2.title(show);
                                self.button.$text(`${Transl2("下載進度")} ${show}`);
                                resolve();
                            }
                        };
                        const download = GM_download2({
                            url: url,
                            name: fileName,
                            conflictAction: "overwrite",
                            onload: () => {
                                completed();
                            },
                            onprogress: progress2 => { },
                            onerror: () => {
                                Lib2.log("Download Error", url, {
                                    dev: General2.Dev,
                                    type: "error",
                                    collapsed: false
                                });
                                setTimeout(() => {
                                    reject();
                                    token--;
                                    if (token <= 0) return;
                                    request(index);
                                }, 1500);
                            }
                        });
                        process.push(download);
                    });
                }
                for (let i = 0; i < total; i++) {
                    promises.push(request(i));
                    await Lib2.sleep(General2.ConcurrentDelay);
                }
                await Promise.allSettled(promises);
                GM_unregisterMenuCommand2("Abort-1");
                Lib2.title(`✓ ${titleCache}`);
                this.button.$text(Transl2("下載完成"));
                setTimeout(() => {
                    this._resetButton();
                }, 3e3);
            }
            async _compressFile(name, title) {
                this.worker.terminate();
                this.forceCompressSignal = true;
                GM_unregisterMenuCommand2("Enforce-1");
                zipper.generateZip({
                    level: 9
                }, progress => {
                    const display = `${progress.toFixed(1)} %`;
                    Lib2.title(display);
                    this.button.$text(`${Transl2("封裝進度")}: ${display}`);
                }).then(zip => {
                    saveAs2(zip, `${name}.zip`);
                    Lib2.title(`✓ ${title}`);
                    this.button.$text(Transl2("下載完成"));
                    setTimeout(() => {
                        this._resetButton();
                    }, 3e3);
                }).catch(result => {
                    Lib2.title(title);
                    const errorShow = Transl2("壓縮封裝失敗");
                    this.button.$text(errorShow);
                    Lib2.log(errorShow, result, {
                        dev: General2.Dev,
                        type: "error",
                        collapsed: false
                    });
                    setTimeout(() => {
                        Process2.Lock = false;
                        this.button.disabled = false;
                        this.button.$text(this.modeDisplay);
                    }, 6e3);
                });
            }
            async _resetButton() {
                General2.CompleteClose && window.close();
                Process2.Lock = false;
                Lib2.$qa(".Download_Button[disabled]").forEach(button => {
                    button.disabled = false;
                    button.$text(`✓ ${this.modeDisplay}`);
                });
            }
        };
    }
    const {
        General,
        FileName,
        FetchSet,
        Process
    } = Config(Lib);
    const {
        Transl
    } = (() => {
        const Matcher = Lib.translMatcher(Dict);
        return {
            Transl: Str => Matcher[Str] ?? Str
        };
    })();
    new class Main {
        constructor() {
            this.Menu = null;
            this.Download = null;
            this.Content = URL2 => /^(https?:\/\/)?(www\.)?.+\/.+\/user\/.+\/post\/.+$/.test(URL2);
            this.Preview = URL2 => /^(https?:\/\/)?(www\.)?.+\/posts\/?(\?.*)?$/.test(URL2) || /^(https?:\/\/)?(www\.)?.+\/.+\/user\/[^\/]+(\?.*)?$/.test(URL2) || /^(https?:\/\/)?(www\.)?.+\/dms\/?(\?.*)?$/.test(URL2);
        }
        async ButtonCreation() {
            Lib.waitEl(".post__body h2, .scrape__body h2", null, {
                raf: true,
                all: true,
                timeout: 10
            }).then(Files => {
                if (Files.length === 0) return;
                Lib.addStyle(`
                #Button-Container {
                    padding: 1rem;
                    font-size: 40% !important;
                }
                #Button-Container svg {
                    fill: white;
                }
                .Setting_Button {
                    cursor: pointer;
                }
                .Download_Button {
                    color: hsl(0, 0%, 45%);
                    padding: 6px;
                    margin: 10px;
                    border-radius: 8px;
                    font-size: 1.1vw;
                    border: 2px solid rgba(59, 62, 68, 0.7);
                    background-color: rgba(29, 31, 32, 0.8);
                    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                }
                .Download_Button:hover {
                    color: hsl(0, 0%, 95%);
                    background-color: hsl(0, 0%, 45%);
                    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                }
                .Download_Button:disabled {
                    color: hsl(0, 0%, 95%);
                    background-color: hsl(0, 0%, 45%);
                    cursor: Synault;
                }
            `, "Download-button-style", false);
                try {
                    Lib.$qa("[id^='Button-Container-']").forEach(button => button.remove());
                    const Pointer = [...Files].filter(file => {
                        const text = file.$text();
                        if (text === "Downloads" || text === "Files") {
                            file.id = text;
                            return true;
                        }
                        return false;
                    });
                    if (Pointer.length === 0) return;
                    const CompressMode = Lib.local("Compression", {
                        error: true
                    });
                    const ModeDisplay = CompressMode ? Transl("壓縮下載") : Transl("單獨下載");
                    this.Download ??= Downloader(GM_unregisterMenuCommand, GM_xmlhttpRequest, GM_download, General, FileName, Process, Transl, Lib, saveAs);
                    Pointer.forEach((pointer, index) => {
                        Lib.createElement(pointer, "span", {
                            id: `Button-Container-${index}`,
                            on: {
                                type: "click",
                                listener: event => {
                                    const target = event.target;
                                    if (target.tagName === "BUTTON") {
                                        if (Process.Lock) {
                                            target.$text(Transl("下載中鎖定"));
                                            target.disabled = true;
                                            return;
                                        }
                                        let Instantiate = null;
                                        Instantiate = new this.Download(CompressMode, ModeDisplay, target);
                                        Instantiate.downloadTrigger(target.closest("h2").id);
                                    } else if (target.closest("svg")) {
                                        alert("Currently Invalid");
                                    }
                                },
                                add: {
                                    capture: true,
                                    passive: true
                                }
                            },
                            innerHTML: `
                            <svg class="Setting_Button" xmlns="http://www.w3.org/2000/svg" height="1.3rem" viewBox="0 0 512 512"><path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/></svg>
                            <button class="Download_Button" ${Process.Lock ? "disabled" : ""}>${Process.Lock ? Transl("下載中鎖定") : ModeDisplay}</button>
                        `
                        });
                    });
                } catch (error) {
                    Lib.log("Button Creation Failed", error, {
                        dev: General.Dev,
                        type: "error",
                        collapsed: false
                    });
                    const Button = Lib.$q("#Button-Container button");
                    if (Button) {
                        Button.disabled = true;
                        Button.textContent = Transl("無法下載");
                    }
                }
            });
        }
        async OpenAllPages() {
            const card = Lib.$qa("article.post-card a");
            if (card.length == 0) {
                throw new Error("No links found");
            }
            let scope = prompt(`(${Transl("當前帖子數")}: ${card.length})${Transl("開帖說明")}`);
            if (scope == null) return;
            scope = scope === "" ? "1-50" : scope;
            for (const link of Lib.scopeParse(scope, card)) {
                GM_openInTab(link.href, {
                    insert: false,
                    setParent: false
                });
                await Lib.sleep(General.BatchOpenDelay);
            }
        }
        async DownloadModeSwitch() {
            Lib.local("Compression", {
                error: true
            }) ? Lib.local("Compression", {
                value: false
            }) : Lib.local("Compression", {
                value: true
            });
            this.ButtonCreation();
        }
        async Init() {
            let FetchData;
            const self = this;
            GM_info.downloadMode = "browser";
            GM_info.isIncognito = true;
            registerMenu(Lib.$url);
            self.Content(Lib.$url) && self.ButtonCreation();
            async function registerMenu(Page) {
                if (self.Content(Page)) {
                    Lib.regMenu({
                        [Transl("🔁 切換下載模式")]: {
                            func: () => self.DownloadModeSwitch(),
                            close: false,
                            hotkey: "c"
                        }
                    }, {
                        reset: true
                    });
                } else if (self.Preview(Page)) {
                    FetchData ??= Fetch(General, FetchSet, Process, Transl, Lib, md5);
                    Lib.regMenu({
                        [Transl("📑 獲取帖子數據")]: () => {
                            if (!Process.Lock) {
                                let Instantiate = null;
                                Instantiate = new FetchData();
                                Instantiate.fetchRun();
                            }
                        },
                        [Transl("📃 開啟當前頁面帖子")]: self.OpenAllPages
                    }, {
                        reset: true
                    });
                    if (General.Dev && !Process.IsNeko) {
                        Lib.regMenu({
                            "🛠️ 開發者獲取": () => {
                                const ID = prompt("輸入請求的 ID");
                                if (ID == null || ID === "") return;
                                let Instantiate = null;
                                Instantiate = new FetchData();
                                Instantiate.fetchTest(ID);
                            }
                        }, {
                            index: 3
                        });
                    }
                }
            }
            Lib.onUrlChange(change => {
                self.Content(change.url) && self.ButtonCreation();
                registerMenu(change.url);
            });
        }
    }().Init();
})();