// ==UserScript==
// @name         Kemer Downloader
// @name:zh-TW   Kemer 下載器
// @name:zh-CN   Kemer 下载器
// @name:ja      Kemer ダウンローダー
// @name:ru      Kemer Загрузчик
// @name:ko      Kemer 다운로더
// @name:en      Kemer Downloader
// @version      2025.12.08-Beta
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
// @match        *://pawchive.pw/*
// @match        *://nekohouse.su/*

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635
// @supportURL   https://github.com/Canaan-HS/MonkeyScript/issues
// @icon         https://cdn-icons-png.flaticon.com/512/2381/2381981.png

// @resource     fflate https://cdn.jsdelivr.net/npm/fflate@0.8.3/umd/index.min.js

// @require      https://update.greasyfork.org/scripts/495339/1878572/Syntax_min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js

// @grant        window.close
// @grant        window.onurlchange
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @grant        GM_openInTab
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand

// @run-at       document-start
// ==/UserScript==

(function () {
  const General = {
    Dev: false,
    IncludeExtras: false,
    CompleteClose: false,
    ConcurrentDelay: 500,
    ConcurrentQuantity: 5,
    BatchOpenDelay: 500,
  };
  const FileName = {
    FillValue: {
      Filler: "0",
      Amount: "Auto",
    },
    CompressName: "({Artist}) {Title}",
    FolderName: "{Title}",
    FillName: "{Title} {Fill}",
  };
  const FetchSet = {
    Delay: 100,
    ToLinkTxt: false,
    FilterExts: [],
    UseFormat: false,
    Mode: "FilterMode",
    Format: ["Timestamp", "TypeTag"],
  };
  const Process = {
    IsNeko: Lib.$domain.startsWith("nekohouse"),
    IsPawchive: Lib.$domain.startsWith("pawchive"),
    ImageExts: ["jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "tif", "svg", "heic", "heif", "raw", "ico", "avif", "jxl", "cr2", "nef", "arw", "orf", "rw2", "tga", "pcx", "crw", "cr3", "dng", "eps", "xcf", "ai", "psd", "psb", "pef", "nrw", "ptx", "srf", "sr2", "raf", "rwl", "3fr", "fff", "iiq", "x3f", "ari", "bay", "dcr", "kdc", "mef", "mos", "usdz", "jxr", "cdr", "wmf", "emf", "dxf", "svgz", "obj", "fbx", "stl", "gltf", "glb", "dae", "blend", "max", "c4d", "step", "stp", "iges"],
    VideoExts: ["mp4", "avi", "mkv", "mov", "flv", "wmv", "webm", "mpg", "mpeg", "m4v", "ogv", "3gp", "asf", "ts", "vob", "rm", "rmvb", "m2ts", "f4v", "mts", "mpe", "mpv", "m2v", "m4a", "bdmv", "ifo", "r3d", "braw", "cine", "qt", "f4p", "swf", "mng", "gifv", "yuv", "roq", "nsv", "amv", "svi", "mod", "mxf", "ogg"],
    Lock: false,
    DynamicParam: Lib.createNetworkObserver({
      MAX_Delay: 1500,
      MIN_CONCURRENCY: 5,
      MAX_CONCURRENCY: 10,
      Good_Network_THRESHOLD: 200,
      Poor_Network_THRESHOLD: 400,
    }),
  };
  const dict = {
    Traditional: {
      PostLink: "帖子連結",
      Timestamp: "發佈日期",
      TypeTag: "類型標籤",
      ImgLink: "圖片連結",
      VideoLink: "影片連結",
      DownloadLink: "下載連結",
      ExternalLink: "外部連結",
      開帖說明: "\n\n!! 直接確認將會開啟當前頁面所有帖子\n輸入開啟範圍(說明) =>\n單個: 1, 2, 3\n範圍: 1~5, 6-10\n排除: !5, -10",
    },
    Simplified: {
      "🔁 切換下載模式": "🔁 切换下载模式",
      "📑 獲取帖子數據": "📑 获取帖子数据",
      "📃 開啟當前頁面帖子": "📃 打开当前页面帖子",
      "📥 強制壓縮下載": "📥 强制压缩下载",
      "⛔️ 取消下載": "⛔️ 取消下载",
      壓縮下載: "压缩下载",
      單獨下載: "单独下载",
      開始下載: "开始下载",
      無法下載: "无法下载",
      下載進度: "下载进度",
      封裝進度: "打包进度",
      壓縮封裝失敗: "压缩打包失败",
      下載完成: "下载完成",
      請求進度: "请求进度",
      下載中鎖定: "下载中锁定",
      原始連結: "原始链接",
      圖片數量: "图片数量",
      影片數量: "视频数量",
      下載連結: "下载链接",
      密碼: "密码",
      連結: "链接",
      時間: "时间",
      來源: "来源",
      元數據: "元数据",
      PostLink: "帖子链接",
      Timestamp: "发布日期",
      TypeTag: "类型标签",
      ImgLink: "图片链接",
      VideoLink: "视频链接",
      DownloadLink: "下载链接",
      ExternalLink: "外部链接",
      帖子內容: "帖子内容",
      帖子數量: "帖子数量",
      建立時間: "建立时间",
      獲取頁面: "获取页面",
      未取得數據: "未获取到数据",
      模式切換: "模式切换",
      數據處理中: "数据处理中",
      當前處理頁數: "当前处理页数",
      數據處理完成: "数据处理完成",
      "Json 數據下載": "JSON 数据下载",
      當前帖子數: "当前帖子数",
      開帖說明: "\n\n!! 直接确认将开启当前页面的所有帖子\n请输入开启范围：\n单个项目：1, 2, 3\n范围指定：1~5, 6-10\n排除项目：!5, -10",
    },
    Japan: {
      "🔁 切換下載模式": "🔁 ダウンロードモード切替",
      "📑 獲取帖子數據": "📑 投稿データを取得",
      "📃 開啟當前頁面帖子": "📃 現在のページの投稿を開く",
      "📥 強制壓縮下載": "📥 強制ZIPダウンロード",
      "⛔️ 取消下載": "⛔️ ダウンロードをキャンセル",
      壓縮下載: "ZIPダウンロード",
      單獨下載: "個別ダウンロード",
      開始下載: "ダウンロード開始",
      無法下載: "ダウンロード不可",
      下載進度: "ダウンロード進捗",
      封裝進度: "パッケージ化進捗",
      壓縮封裝失敗: "ZIP化に失敗",
      下載完成: "ダウンロード完了",
      請求進度: "リクエスト進捗",
      下載中鎖定: "ダウンロード中はロック中",
      原始連結: "オリジナルリンク",
      圖片數量: "画像数",
      影片數量: "動画数",
      下載連結: "ダウンロードリンク",
      密碼: "パスワード",
      連結: "リンク",
      作者: "作者",
      時間: "日時",
      來源: "ソース",
      元數據: "メタデータ",
      PostLink: "投稿リンク",
      Timestamp: "投稿日時",
      TypeTag: "種類タグ",
      ImgLink: "画像リンク",
      VideoLink: "動画リンク",
      DownloadLink: "ダウンロードリンク",
      ExternalLink: "外部リンク",
      帖子內容: "投稿内容",
      帖子數量: "投稿数",
      建立時間: "作成日時",
      獲取頁面: "ページ取得",
      未取得數據: "データ取得失敗",
      模式切換: "モード切替",
      數據處理中: "データ処理中",
      當前處理頁數: "処理中のページ",
      數據處理完成: "データ処理完了",
      "Json 數據下載": "JSONデータダウンロード",
      當前帖子數: "現在の投稿数",
      開帖說明: "\n\n!! 入力せずに確定すると、現在のページの全投稿が開かれます。\n範囲を指定して開く:\n単一: 1, 2, 3\n範囲: 1~5, 6-10\n除外: !5, -10",
    },
    Korea: {
      "🔁 切換下載模式": "🔁 다운로드 모드 전환",
      "📑 獲取帖子數據": "📑 게시물 데이터 가져오기",
      "📃 開啟當前頁面帖子": "📃 현재 페이지 게시물 열기",
      "📥 強制壓縮下載": "📥 강제 압축 다운로드",
      "⛔️ 取消下載": "⛔️ 다운로드 취소",
      壓縮下載: "압축 다운로드",
      單獨下載: "개별 다운로드",
      開始下載: "다운로드 시작",
      無法下載: "다운로드 불가",
      下載進度: "다운로드 진행률",
      封裝進度: "패키징 진행률",
      壓縮封裝失敗: "압축 실패",
      下載完成: "다운로드 완료",
      請求進度: "요청 진행률",
      下載中鎖定: "다운로드 중 잠금",
      原始連結: "원본 링크",
      圖片數量: "이미지 수",
      影片數量: "영상 수",
      下載連結: "다운로드 링크",
      密碼: "비밀번호",
      連結: "링크",
      作者: "작성자",
      時間: "시간",
      來源: "출처",
      元數據: "메타데이터",
      PostLink: "게시물 링크",
      Timestamp: "타임스탬프",
      TypeTag: "유형 태그",
      ImgLink: "이미지 링크",
      VideoLink: "영상 링크",
      DownloadLink: "다운로드 링크",
      ExternalLink: "외부 링크",
      帖子內容: "게시물 내용",
      帖子數量: "게시물 수",
      建立時間: "생성 시간",
      獲取頁面: "페이지 로딩",
      未取得數據: "데이터를 가져오지 못함",
      模式切換: "모드 전환",
      數據處理中: "데이터 처리 중",
      當前處理頁數: "처리 중인 페이지",
      數據處理完成: "데이터 처리 완료",
      "Json 數據下載": "JSON 데이터 다운로드",
      當前帖子數: "현재 게시물 수",
      開帖說明: "\n\n!! 입력 없이 확인 시, 현재 페이지의 모든 게시물을 엽니다.\n열람 범위 입력 (예시):\n단일: 1, 2, 3\n범위: 1~5, 6-10\n제외: !5, -10",
    },
    Russia: {
      "🔁 切換下載模式": "🔁 Сменить режим загрузки",
      "📑 獲取帖子數據": "📑 Получить данные постов",
      "📃 開啟當前頁面帖子": "📃 Открыть посты на странице",
      "📥 強制壓縮下載": "📥 Принудительно скачать архивом",
      "⛔️ 取消下載": "⛔️ Отменить загрузку",
      壓縮下載: "Скачать архивом",
      單獨下載: "Одиночная загрузка",
      開始下載: "Начать загрузку",
      無法下載: "Ошибка загрузки",
      下載進度: "Прогресс загрузки",
      封裝進度: "Прогресс упаковки",
      壓縮封裝失敗: "Ошибка архивации",
      下載完成: "Загрузка завершена",
      請求進度: "Прогресс запроса",
      下載中鎖定: "Блокировка на время загрузки",
      原始連結: "Оригинальная ссылка",
      圖片數量: "Кол-во изображений",
      影片數量: "Кол-во видео",
      下載連結: "Ссылка на скачивание",
      密碼: "Пароль",
      連結: "Ссылка",
      作者: "Автор",
      時間: "Время",
      來源: "Источник",
      元數據: "Метаданные",
      PostLink: "Ссылка на пост",
      Timestamp: "Дата публикации",
      TypeTag: "Тег типа",
      ImgLink: "Ссылка на изображение",
      VideoLink: "Ссылка на видео",
      DownloadLink: "Ссылка на скачивание",
      ExternalLink: "Внешняя ссылка",
      帖子內容: "Содержимое поста",
      帖子數量: "Количество постов",
      建立時間: "Время создания",
      獲取頁面: "Загрузка страницы",
      未取得數據: "Не удалось получить данные",
      模式切換: "Смена режима",
      數據處理中: "Обработка данных",
      當前處理頁數: "Обрабатываемая страница",
      數據處理完成: "Обработка завершена",
      "Json 數據下載": "Скачать JSON",
      當前帖子數: "Текущее кол-во постов",
      開帖說明: '\n\n!! Нажмите "ОК" без ввода, чтобы открыть все посты на странице.\nВведите диапазон для открытия:\nОдин пост: 1, 2, 3\nДиапазон: 1~5, 6-10\nИсключить: !5, -10',
    },
    English: {
      "🔁 切換下載模式": "🔁 Switch Download Mode",
      "📑 獲取帖子數據": "📑 Fetch Post Data",
      "📃 開啟當前頁面帖子": "📃 Open Posts on This Page",
      "📥 強制壓縮下載": "📥 Force ZIP Download",
      "⛔️ 取消下載": "⛔️ Cancel Download",
      壓縮下載: "Download as ZIP",
      單獨下載: "Download Individually",
      開始下載: "Start Download",
      無法下載: "Download Failed",
      下載進度: "Download Progress",
      封裝進度: "Packaging Progress",
      壓縮封裝失敗: "ZIP Packaging Failed",
      下載完成: "Download Complete",
      請求進度: "Request Progress",
      下載中鎖定: "Locked While Downloading",
      原始連結: "Original Link",
      圖片數量: "Image Count",
      影片數量: "Video Count",
      下載連結: "Download Link",
      密碼: "Password",
      連結: "Link",
      作者: "Author",
      時間: "Time",
      來源: "Source",
      元數據: "Metadata",
      帖子內容: "Post Content",
      帖子數量: "Number of Posts",
      建立時間: "Created At",
      獲取頁面: "Fetching Page",
      未取得數據: "Failed to Retrieve Data",
      模式切換: "Switch Mode",
      數據處理中: "Processing Data",
      當前處理頁數: "Processing Page",
      數據處理完成: "Processing Complete",
      "Json 數據下載": "Download JSON Data",
      當前帖子數: "Current Post Count",
      開帖說明: "\n\n!! Confirming without input will open all posts on the current page.\nEnter range to open (e.g.):\nSingle: 1, 2, 3\nRange: 1~5, 6-10\nExclude: !5, -10",
    },
  };
  const { Transl } = (() => {
    const Matcher = Lib.translMatcher(dict);
    return {
      Transl: (Str) => Matcher[Str] ?? Str,
    };
  })();
  const Parse = (() => {
    const infoF1 = /\/([^\/]+)\/(?:user|server|creator|fanclubs)\/([^\/?]+)(?:\/post\/([^\/?]+))?/;
    const infoF2 = /\/([^\/]+)\/([^\/]+)$/;
    const infoF3 = /^https?:\/\/([^.]+)\.([^.]+)\./;
    const specialServer = { x: "twitter", maker_id: "dlsite" };
    const supportServer = /Gumroad|Patreon|Fantia|Pixiv|Fanbox|CandFans|Twitter|Boosty|OnlyFans|Fansly|SubscribeStar|DLsite/i;
    const protocolF1 = /^[a-zA-Z][\w+.-]*:\/\//;
    const protocolF2 = /^[a-zA-Z][\w+.-]*:/;
    const protocolF3 = /^([\w-]+\.)+[a-z]{2,}(\/|$)/i;
    const protocolF4 = /^\/\//;
    return {
      getUrlInfo(uri) {
        uri = uri.match(infoF1) || uri.match(infoF2) || uri.match(infoF3);
        if (!uri) return;
        return uri.splice(1).reduce((acc, str, idx) => {
          if (supportServer.test(str)) {
            const cleanStr = str.replace(/\/?(www\.|\.com|\.to|\.jp|\.net|\.adult|user\?u=)/g, "");
            acc.server = specialServer[cleanStr] ?? cleanStr;
          } else if (idx === 2) {
            acc.post = str;
          } else {
            acc.user = str;
          }
          return acc;
        }, {});
      },
      getProtocol(uri) {
        if (protocolF1.test(uri) || protocolF2.test(uri)) return uri;
        if (protocolF3.test(uri)) return "https://" + uri;
        if (protocolF4.test(uri)) return "https:" + uri;
        return uri;
      },
    };
  })();
  class FetchData {
    static Try_Again_Promise = null;
    constructor() {
      this.metaDict = new Map();
      this.dataDict = new Map();
      this.sourceURL = Lib.url;
      this.titleCache = Lib.title();
      this.URL = new URL(this.sourceURL);
      this.host = this.URL.host;
      this.origin = this.URL.origin;
      this.pathname = this.URL.pathname;
      this.isPost = this.URL.pathname !== "/posts";
      this.queryValue = this.URL.search;
      if (this.URL.searchParams.get("q") === "") {
        this.URL.searchParams.delete("q");
        this.queryValue = this.URL.search;
        this.sourceURL = this.URL.href;
      }
      this.currentPage = 1;
      this.finalPage = 1;
      this.totalPages = 0;
      this.progress = 0;
      this.onlyMode = false;
      this.fetchDelay = FetchSet.Delay;
      this.toLinkTxt = FetchSet.ToLinkTxt;
      const apiInterface = "api/v1";
      this.getPostURL = ({ service, user, id }) => `${this.origin}/${service}/user/${user}/post/${id}`;
      this.getPostAPI = ({ service, user, id }) => `${this.origin}/${apiInterface}/${service}/user/${user}/post/${id}`;
      this.profile = null;
      this.profileAPI = `${this.origin}/${apiInterface}${this.pathname}/profile`;
      this.getNextPageURL = (urlStr) => {
        const url = new URL(urlStr);
        const search = url.searchParams;
        const q = search.get("q");
        let o = search.get("o");
        o = o ? +o + 50 : 50;
        const params = q ? `?o=${o}&q=${q}` : `?o=${o}`;
        return `${url.origin}${url.pathname}${params}`;
      };
      const append = this.isPost ? "/posts" : "";
      this.getPreviewAPI = (url) => (/[?&]o=/.test(url) ? url.replace(this.host, `${this.host}/${apiInterface}`).replace(/([?&]o=)/, `${append}$1`) : this.queryValue ? url.replace(this.host, `${this.host}/${apiInterface}`).replace(this.queryValue, `${append}${this.queryValue}`) : url.replace(this.host, `${this.host}/${apiInterface}`) + append);
      this.getValidValue = (value) => {
        if (!value) return null;
        const type = Lib.type(value);
        if (type === "Array") return value.length > 0 && value.some((item) => item !== "") ? value : null;
        if (type === "Object") {
          const values = Object.values(value);
          return values.length > 0 && values.some((item) => item !== "") ? value : null;
        }
        return value;
      };
      this.infoRules = new Set(["PostLink", "Timestamp", "TypeTag", "ImgLink", "VideoLink", "DownloadLink", "ExternalLink"]);
      this.fetchGenerate = (Data) => {
        return Object.keys(Data).reduce((acc, key) => {
          if (this.infoRules.has(key)) {
            const value = this.getValidValue(Data[key]);
            value && (acc[Transl(key)] = value);
          }
          return acc;
        }, {});
      };
      const filterExts = new Set(FetchSet.FilterExts);
      const videoExts = new Set(Process.VideoExts);
      const imageExts = new Set(Process.ImageExts);
      this.isVideo = (str) => videoExts.has(str.replace(/^\./, "").toLowerCase());
      this.isImage = (str) => imageExts.has(str.replace(/^\./, "").toLowerCase());
      this.normalizeName = (title, index) => title.trim().replace(/\n/g, " ") || `Untitled_${String((this.currentPage - 1) * 50 + (index + 1)).padStart(2, "0")}`;
      this.normalizeTimestamp = ({ added, published }) => new Date(added || published)?.toLocaleString();
      this.kemerCategorize = ({ title, data, server, fillValue }) => {
        let imgNumber = 0;
        return data.reduce(
          (acc, file) => {
            const name = file.name;
            const path = file.path;
            if (!path) return acc;
            const extension = Lib.suffixName(path, "");
            if (filterExts.has(extension)) return acc;
            const serverPath = server ? `${server}/data` : `${file.server}/data`;
            const url = `${serverPath}${path}`;
            if (this.isVideo(extension)) {
              acc.video[name] = `${url}?f=${name}`;
            } else if (this.isImage(extension)) {
              const name2 = `${title}_${String(++imgNumber).padStart(fillValue, "0")}.${extension}`;
              acc.img[name2] = `${url}?f=${name2}`;
            } else {
              acc.other[name] = `${url}?f=${name}`;
            }
            return acc;
          },
          { img: {}, video: {}, other: {} },
        );
      };
      this.deepDecodeURIComponent = (str) => {
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
        return data.reduce(
          (acc, file) => {
            const uri = file.src || file.href || file.$gAttr("src") || file.$gAttr("href");
            if (uri) {
              const extension = Lib.suffixName(uri, "");
              if (filterExts.has(extension)) return acc;
              const url = uri.startsWith("http") ? uri : `${Lib.$origin}${uri}`;
              const getDownloadName = (link) => this.deepDecodeURIComponent(link.download?.trim() || link.$text());
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
          },
          { video: {}, img: {}, other: {} },
        );
      };
      const allowType = new Set(["A", "P", "STRONG", "BODY"]);
      const pFilter = new Set(["mega.nz"]);
      const urlRegex = /(?:(?:https?|ftp|mailto|file|data|blob|ws|wss|ed2k|thunder):\/\/|(?:[-\w]+\.)+[a-zA-Z]{2,}(?:\/|$)|\w+@[-\w]+\.[a-zA-Z]{2,})[^\s]*?(?=[{}「」『』【】\[\]（）()<>、"'，。！？；：…—～~]|$|\s)/gi;
      const safeInclud = (target, checkStr) => {
        if (typeof target !== "string") return false;
        return target?.includes(checkStr || "");
      };
      const checkProcessableLink = (link) => {
        return link.toLowerCase().startsWith("https://mega.nz") && (!safeInclud(link, "#") || safeInclud(link, "#P!"));
      };
      const searchPassword = (href, text) => {
        let pass = "";
        let state = false;
        if (!text) return { pass, state, href };
        const lowerText = text.toLowerCase();
        const encryptedHref = safeInclud(href, "#P!");
        if (text.startsWith("#")) {
          state = true;
          if (encryptedHref) {
            pass = text.slice(1);
          } else {
            href += text;
          }
        } else if (/^[A-Za-z0-9_-]{16,43}$/.test(text)) {
          state = true;
          if (encryptedHref) {
            pass = text;
          } else {
            href += "#" + text;
          }
        } else if (lowerText.startsWith("pass") || lowerText.startsWith("key")) {
          const key = text.match(/^(Pass|Key)\s*:?\s*(.*)$/i)?.[2]?.trim() ?? "";
          if (key) {
            state = true;
            if (encryptedHref) {
              pass = key;
            } else {
              href += "#" + key;
            }
          }
        }
        return {
          pass,
          state,
          href: href.match(urlRegex)?.[0] ?? href,
        };
      };
      this.specialLinkParse = (data) => {
        const parsed = {};
        try {
          const domBody = Lib.domParse(data).body;
          const parseAdd = (name, href, pass) => {
            if (!href) return;
            if (/\.[a-zA-Z0-9]+$/.test(href)) return;
            if (safeInclud(name, "frame embed")) name = "";
            parsed[name && name !== href ? name : Lib.getFingerprint(href).slice(0, 16)] = pass
              ? {
                  [Transl("密碼")]: pass,
                  [Transl("連結")]: href,
                }
              : href;
          };
          let nodes = new Set();
          const tree = document.createTreeWalker(domBody, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => {
              const parentElement = node.parentElement;
              const tag = parentElement.tagName;
              if (!allowType.has(tag)) return NodeFilter.FILTER_REJECT;
              if (tag === "P" && parentElement.getElementsByTagName("a").length > 0) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            },
          });
          while (tree.nextNode()) {
            nodes.add(tree.currentNode.parentElement);
          }
          const allowBody = nodes.size === 1;
          const urlRecord = new Set();
          nodes = [...nodes];
          Lib.log(domBody, { dev: General.Dev, group: "specialLinkParse DOM", collapsed: false });
          for (const [index, node] of nodes.entries()) {
            const tag = node.tagName;
            Lib.log({ tag, content: node.$text() }, { dev: General.Dev, group: "specialLinkParse node" });
            let name = "";
            let href = "";
            let pass = "";
            let endAdd = true;
            if (tag === "A") {
              href = node.href;
              if (checkProcessableLink(href)) {
                const nextNode = node.nextSibling;
                if (nextNode) {
                  if (nextNode.nodeType === Node.TEXT_NODE) {
                    ({ href, pass } = searchPassword(href, nextNode.$text()));
                  } else if (nextNode.nodeType === Node.ELEMENT_NODE) {
                    const nodeText = [...nextNode.childNodes].find((node2) => node2.nodeType === Node.TEXT_NODE)?.$text() ?? "";
                    ({ href, pass } = searchPassword(href, nodeText));
                  }
                } else {
                  for (let i = index + 1; i < nodes.length; i++) {
                    const newData = searchPassword(href, nodes[i].$text());
                    if (newData.state) {
                      ({ href, pass } = newData);
                      break;
                    }
                  }
                }
              }
              const previousNode = node.previousSibling;
              if (previousNode?.nodeType === Node.ELEMENT_NODE) {
                name = previousNode.$text().replace(":", "");
              } else {
                const text = node.$text();
                name = !safeInclud(href, text) ? text : "";
              }
            } else if (tag === "P") {
              const url = node.$text().match(urlRegex);
              if (url && !pFilter.has(url[0])) {
                href = Parse.getProtocol(url[0]);
              }
            } else if (tag === "STRONG") {
              const parentElement = node.parentElement;
              if (parentElement.tagName === "A") {
                href = parentElement.href;
                name = node.$text();
              }
            } else if (tag === "BODY" && allowBody) {
              node.$text().replace(urlRegex, (url, offset, fullText) => {
                const before = fullText.slice(0, offset);
                const linesBefore = before.split(/\r?\n/);
                let currentLine = linesBefore[linesBefore.length - 1].trim();
                if (currentLine.length > 0) {
                  name = currentLine;
                } else {
                  if (linesBefore.length > 1) {
                    name = linesBefore[linesBefore.length - 2].trim();
                  }
                }
                if (name.match(urlRegex)) name = "";
                if (checkProcessableLink(url)) {
                  const after = fullText.slice(offset + url.length);
                  const linesAfter = after.split(/\r?\n/);
                  for (const line of linesAfter) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;
                    const newData = searchPassword(url, trimmed);
                    if (newData.state) {
                      ({ href, pass } = newData);
                      break;
                    }
                  }
                }
                parseAdd(name, Parse.getProtocol(url), pass);
              });
              endAdd = false;
            }
            if (endAdd && !urlRecord.has(href)) {
              urlRecord.add(href);
              parseAdd(name, href, pass);
            }
          }
        } catch (error) {
          Lib.log(error, { dev: General.Dev, group: "Error specialLinkParse", collapsed: false }).error;
        }
        return parsed;
      };
      this.tooManyTryAgain = function (url) {
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
                headers: {
                  Accept: "text/css",
                },
                signal,
                cache: "no-store",
              });
              clearTimeout(timeoutId);
              if (response.status === 429 || response.status === 503) {
                await Lib.sleep(sleepTime);
                await checkRequest();
              } else if (response.status === 200) {
                resolve(response);
              }
            } catch (err) {
              clearTimeout(timeoutId);
              await Lib.sleep(sleepTime);
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
      this.worker = Lib.createWorker(`
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
                fetch(url, {
                    headers: {
                        "Accept": "text/css",
                    }
                }).then(response => {
                    if (response.ok) {
                        response.text().then(content => {
                            postMessage({ index, title, url, content, time, delay, error: false });
                        });
                    } else {
                        postMessage({ index, title, url, content: "", time, delay, error: true });
                    }
                }).catch(error => {
                    postMessage({ index, title, url, content: "", time, delay, error: true });
                });
            }
        `);
      FetchSet.UseFormat && this._fetchConfig(FetchSet.Mode, FetchSet.Format);
      Lib.log(
        {
          Title: this.titleCache,
          isPost: this.isPost,
          QueryValue: this.queryValue,
          ProfileAPI: this.profileAPI,
          GenerateRules: this.infoRules,
          ParseUrl: this.URL,
        },
        { dev: General.Dev, group: "Fetch Init" },
      );
    }
    async _fetchConfig(mode = "FilterMode", userSet = []) {
      if (!mode || typeof mode !== "string" || !Array.isArray(userSet)) return;
      if (mode.toLowerCase() === "filtermode") {
        this.onlyMode = false;
        userSet.forEach((key) => this.infoRules.delete(key));
      } else if (mode.toLowerCase() === "onlymode") {
        this.onlyMode = true;
        const userFilter = new Set(userSet);
        this.infoRules = new Set([...this.infoRules].filter((key) => userFilter.has(key)));
      }
    }
    async fetchRun() {
      const small = Lib.$q("small");
      const items = Lib.$q(".card-list__items");
      if (items) {
        Process.Lock = true;
        const currentPage = +Lib.$q(".pagination-button-current b")?.$text();
        currentPage && (this.currentPage = currentPage);
        if (small) {
          this.totalPages = +small.$text().split(" of ")[1] || 0;
          this.finalPage = Math.max(Math.ceil(this.totalPages / 50), 1);
        }
        Lib.log(
          {
            small,
            items,
            CurrentPage: this.currentPage,
            TotalPages: this.totalPages,
            FinalPage: this.finalPage,
          },
          { dev: General.Dev, group: "Fetch Run" },
        );
        this._fetchPage(items, this.sourceURL);
      } else {
        alert(Transl("未取得數據"));
      }
    }
    async fetchTest(id) {
      if (!this.isPost) {
        alert("This Page Does Not Support Test");
        return;
      }
      Process.Lock = true;
      const { server, user } = Parse.getUrlInfo(this.sourceURL);
      const pack = {
        id,
        user,
        service: server,
        title: this.titleCache,
      };
      Lib.log(pack, { dev: General.Dev, group: "Fetch Test", collapsed: false });
      await this._fetchContent({
        content: JSON.stringify([pack]),
      });
      this._reset();
    }
    async _fetchPage(items, url) {
      if (Process.IsNeko) {
        if (!items) {
          this.worker.postMessage({ title: this.titleCache, url, time: Date.now(), delay: this.fetchDelay });
          const homeData = await new Promise((resolve, reject) => {
            this.worker.onmessage = async (e) => {
              const { title, url: url2, content, time, delay, error } = e.data;
              if (!error) {
                this.fetchDelay = Process.DynamicParam(time, delay);
                resolve(content);
              } else {
                Lib.log({ title, url: url2, error }, { dev: General.Dev, collapsed: false }).error;
                await this.tooManyTryAgain(url2);
                this.worker.postMessage({ title, url: url2, time, delay });
              }
            };
          });
          items = Lib.domParse(homeData)?.$q(".card-list__items");
        }
        if (items) {
          const article = items.$qa("article");
          const content = article.map((item, index) => ({
            index,
            title: item.$q("header").$text(),
            url: item.$q("a").href,
          }));
          await this._fetchContent({ content });
        }
      } else {
        this.worker.postMessage({ title: this.titleCache, url: this.getPreviewAPI(url), time: Date.now(), delay: this.fetchDelay });
        const homeData = await new Promise((resolve, reject) => {
          this.worker.onmessage = async (e) => {
            const { title, url: url2, content, time, delay, error } = e.data;
            if (!error) {
              this.fetchDelay = Process.DynamicParam(time, delay);
              resolve({ url: url2, content });
            } else {
              Lib.log({ title, url: url2, error }, { dev: General.Dev, collapsed: false }).error;
              await this.tooManyTryAgain(url2);
              this.worker.postMessage({ title, url: url2, time, delay });
            }
          };
        });
        await this._fetchContent(homeData);
      }
      ++this.currentPage <= this.finalPage ? this._fetchPage(null, this.getNextPageURL(url)) : this.toLinkTxt ? this._toTxt() : this._toJson();
    }
    async _fetchContent(homeData) {
      this.progress = 0;
      const { content } = homeData;
      Lib.log(homeData, { dev: General.Dev, group: "Fetch Content" });
      if (!this.profile) this._getMeta();
      if (Process.IsNeko) {
        let taskCount = 0;
        const tasks = [];
        const resolvers = new Map();
        if (this.metaDict.size === 0) this._setMeta({ defPostCount: content.length });
        this.worker.onmessage = async (e) => {
          const { index, title, url, content: content2, time, delay, error } = e.data;
          if (!error) {
            const { resolve } = resolvers.get(index);
            this.fetchDelay = Process.DynamicParam(time, delay);
            const standardTitle = this.normalizeName(title, index);
            const postDom = Lib.domParse(content2);
            const classifiedFiles = this.nekoCategorize(standardTitle, [...postDom.$qa(".fileThumb"), ...postDom.$qa(".scrape__attachments a")]);
            const generatedData = this.fetchGenerate({
              PostLink: url,
              Timestamp: postDom.$q(".timestamp").$text(),
              ImgLink: classifiedFiles.img,
              VideoLink: classifiedFiles.video,
              DownloadLink: classifiedFiles.other,
            });
            if (Object.keys(generatedData).length !== 0) {
              this.dataDict.set(standardTitle, generatedData);
            }
            resolve();
            Lib.title(`（${this.currentPage} - ${++taskCount}）`);
            Lib.log({ index, title: standardTitle, url, data: generatedData }, { dev: General.Dev, group: "Request Successful", collapsed: false });
          } else {
            await this.tooManyTryAgain(url);
            this.worker.postMessage({ index, title, url, time, delay });
          }
        };
        for (const { index, title, url } of content) {
          tasks.push(
            new Promise((resolve, reject) => {
              resolvers.set(index, { resolve, reject });
              this.worker.postMessage({ index, title, url, time: Date.now(), delay: this.fetchDelay });
            }),
          );
          await Lib.sleep(this.fetchDelay);
        }
        await Promise.allSettled(tasks);
      } else {
        let homeJson = JSON.parse(content);
        if (homeJson) {
          if (this.metaDict.size === 0) {
            if ((!this.profile.name || !this.profile.post_count) && this.isPost && !Process.IsPawchive) {
              this.worker.postMessage({ url: this.profileAPI });
              Object.assign(
                this.profile,
                await new Promise((resolve, reject) => {
                  this.worker.onmessage = async (e) => {
                    const { url, content: content2, error } = e.data;
                    if (!error) resolve(JSON.parse(content2));
                    else {
                      Lib.log(url, { dev: General.Dev, collapsed: false }).error;
                      await this.tooManyTryAgain(url);
                      this.worker.postMessage({ url });
                    }
                  };
                }),
              );
            }
            if (!this.isPost) {
              this.finalPage = Math.min(this.finalPage, 1e3);
              this.profile.post_count = homeJson.true_count;
            }
            this._setMeta();
          }
          const tasks = [];
          const resolvers = new Map();
          this.worker.onmessage = async (e) => {
            const { index, title, url, content: content2, time, delay, error } = e.data;
            try {
              if (!error) {
                const { resolve } = resolvers.get(index);
                this.fetchDelay = Process.DynamicParam(time, delay);
                const contentJson = JSON.parse(content2);
                if (contentJson) {
                  const post = contentJson.post;
                  const previews = contentJson.previews || [];
                  const attachments = contentJson.attachments || [];
                  this._packData({
                    index,
                    post,
                    data: [...previews, ...attachments],
                  });
                  resolve();
                } else throw new Error("Json Parse Failed");
              } else {
                throw new Error("Request Failed");
              }
            } catch (error2) {
              Lib.log({ index, title, url, error: error2 }, { dev: General.Dev, collapsed: false }).error;
              await this.tooManyTryAgain(url);
              this.worker.postMessage({ index, title, url, time, delay });
            }
          };
          homeJson = this.isPost ? homeJson : homeJson.posts;
          for (const [index, post] of homeJson.entries()) {
            if (Process.IsPawchive) {
              const file = post.file ? [post.file] : [];
              const attachments = post.attachments || [];
              try {
                post.tags = post.tags
                  .slice(1, -1)
                  .split(",")
                  .map((s) => s.trim());
                this._packData({
                  index,
                  post,
                  data: [...file, ...attachments],
                  server: "https://file.pawchive.pw",
                });
              } catch (error) {
                Lib.log(
                  {
                    index,
                    title: post.title,
                    url: this.getPostURL(post),
                    error,
                  },
                  { dev: General.Dev, collapsed: false },
                ).error;
              }
            } else {
              tasks.push(
                new Promise((resolve, reject) => {
                  resolvers.set(index, { resolve, reject });
                  this.worker.postMessage({
                    index,
                    title: post.title,
                    url: this.getPostAPI(post),
                    time: Date.now(),
                    delay: this.fetchDelay,
                  });
                }),
              );
              await Lib.sleep(this.fetchDelay);
            }
          }
          await Promise.allSettled(tasks);
          await Lib.sleep(this.fetchDelay);
        }
      }
      return true;
    }
    _getMeta() {
      this.profile = {
        name: Lib.$q("span[itemprop='name'], fix_name").$text(),
        post_count: this.totalPages > 0 ? this.totalPages : void 0,
        create_time: Lib.getDate("{year}-{month}-{date} {hour}:{minute}"),
        source_url: this.sourceURL,
      };
    }
    _setMeta({ defName, defPostCount, defCreateTime, defSourceUrl } = {}) {
      this.metaDict.set(Transl("作者"), this.profile.name ?? defName);
      this.metaDict.set(Transl("帖子數量"), this.profile.post_count ?? defPostCount);
      this.metaDict.set(Transl("建立時間"), this.profile.create_time ?? defCreateTime);
      this.metaDict.set(Transl("獲取頁面"), this.profile.source_url ?? defSourceUrl);
      Lib.log(this.metaDict, { dev: General.Dev, group: "Meta Data" });
    }
    _packData({ index, post, data, server }) {
      const standardTitle = this.normalizeName(post.title, index);
      const classifiedFiles = this.kemerCategorize({
        title: standardTitle,
        data,
        server,
        fillValue: Lib.getFill(data?.length || 1),
      });
      const url = this.getPostURL(post);
      const generatedData = this.fetchGenerate({
        PostLink: url,
        Timestamp: this.normalizeTimestamp(post),
        TypeTag: post.tags,
        ImgLink: classifiedFiles.img,
        VideoLink: classifiedFiles.video,
        DownloadLink: classifiedFiles.other,
        ExternalLink: this.specialLinkParse(post.content),
      });
      if (!Lib.isEmpty(generatedData)) this.dataDict.set(standardTitle, generatedData);
      Lib.title(`（${this.currentPage} - ${++this.progress}）`);
      Lib.log({ index, title: standardTitle, url, data: generatedData }, { dev: General.Dev, group: "Request Successful", collapsed: false });
    }
    async _reset() {
      this.metaDict = null;
      this.dataDict = null;
      this.worker.terminate();
      Process.Lock = false;
      Lib.title(this.titleCache);
    }
    async _toTxt() {
      let content = "";
      for (const value of this.dataDict.values()) {
        const getLinks = Object.assign({}, value[Transl("ImgLink")], value[Transl("VideoLink")], value[Transl("DownloadLink")]);
        for (const link of Object.values(getLinks)) {
          content += `${encodeURI(link)}
`;
        }
      }
      if (content.endsWith("\n")) content = content.slice(0, -1);
      Lib.outputTXT(content, this.metaDict.get(Transl("作者")), () => {
        content = null;
        this._reset();
      });
    }
    async _toJson() {
      let jsonData = Object.assign({}, { [Transl("元數據")]: Object.fromEntries(this.metaDict) }, { [`${Transl("帖子內容")} (${this.dataDict.size})`]: Object.fromEntries(this.dataDict) });
      Lib.outputJson(jsonData, this.metaDict.get(Transl("作者")), () => {
        jsonData = null;
        this._reset();
      });
    }
  }
  function Downloader() {
    const zipper = Lib.createZip(GM_getResourceText("fflate"));
    return class Download {
      constructor(compressMode, modeDisplay, button) {
        this.button = button;
        this.modeDisplay = modeDisplay;
        this.compressMode = compressMode;
        this.namedData = null;
        this.forceCompressSignal = false;
        this.originalTitle = () => {
          const cache = Lib.title();
          return cache.startsWith("✓ ") ? cache.slice(2) : cache;
        };
        const videoExts = new Set(Process.VideoExts);
        this.isVideo = (str) => videoExts.has(str.replace(/^\./, "").toLowerCase());
        this.worker = this.compressMode
          ? Lib.createWorker(`
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
            `)
          : null;
      }
      _nameAnalysis(format) {
        if (typeof format === "string") {
          return format
            .split(/{([^}]+)}/g)
            .filter(Boolean)
            .map((data) => {
              const lowerData = data.toLowerCase().trim();
              const isWord = /^[a-zA-Z]+$/.test(lowerData);
              return isWord ? (this.namedData[lowerData]?.() ?? "None") : data;
            })
            .join("");
        } else if (typeof format == "object") {
          const filler = String(format.Filler) || "0";
          const amount = parseInt(format.Amount) || "auto";
          return [amount, filler];
        } else;
      }
      trigger(sourceType) {
        Lib.waitEl(
          [".post__title, .scrape__title", ".post__files, .scrape__files", ".post__user-name, .scrape__user-name, fix_name"],
          (found) => {
            const [title, files, artist] = found;
            Process.Lock = true;
            this.button.disabled = true;
            const downloadData = new Map();
            const { server, user, post } = Parse.getUrlInfo(Lib.url);
            this.namedData = {
              fill: () => "fill",
              userid: () => user,
              postid: () => post,
              title: () => title.$q("span").$text().replaceAll("/", "／"),
              artist: () => artist.$text(),
              source: () => server.charAt(0).toUpperCase() + server.slice(1),
              time: () => {
                if (Process.IsNeko) {
                  return Lib.$q(".timestamp").$text() || "";
                }
                let published = Lib.$q(".post__published").$copy();
                Lib.$q(".post__published");
                published.firstElementChild.remove();
                return published.$text().split(" ")[0];
              },
            };
            const [compressName, folderName, fillName] = Object.keys(FileName)
              .slice(1)
              .map((key) => this._nameAnalysis(FileName[key]));
            const imgData = [...files.children].map((child) => child.$q(Process.IsNeko ? ".fileThumb, rc, img" : "a, rc, img")).filter(Boolean);
            const extrasData = Lib.$qa(".post__attachment a:not(.fancy-link):not([beautify]), .scrape__attachments a");
            const finalData = General.IncludeExtras ? [...imgData, ...extrasData] : sourceType === "Files" ? imgData : extrasData;
            for (const [index, file] of finalData.entries()) {
              const uri = file.src || file.href || file.$gAttr("src") || file.$gAttr("href");
              if (uri) {
                downloadData.set(index, uri.startsWith("http") ? uri : `${Lib.$origin}${uri}`);
              }
            }
            if (downloadData.size == 0) General.Dev = true;
            Lib.log(
              {
                CompressName: compressName,
                FolderName: folderName,
                DownloadData: downloadData,
              },
              { dev: General.Dev, group: "Get Data", collapsed: false },
            );
            this.compressMode ? this._packDownload(compressName, folderName, fillName, downloadData) : this._separDownload(fillName, downloadData);
          },
          { raf: true },
        );
      }
      async _packDownload(compressName, folderName, fillName, data) {
        let show,
          extension,
          progress = 0,
          total = data.size;
        const self = this,
          titleCache = this.originalTitle();
        const fillValue = this._nameAnalysis(FileName.FillValue),
          filler = fillValue[1],
          amount = fillValue[0] == "auto" ? Lib.getFill(total) : fillValue[0];
        async function forceDownload() {
          self._compressFile(compressName, titleCache);
        }
        Lib.regMenu(
          {
            [Transl("📥 強制壓縮下載")]: { func: () => forceDownload(), hotkey: "d" },
          },
          { name: "Enforce" },
        );
        folderName = folderName != "" ? `${folderName}/` : "";
        function requestUpdate(index, url, blob, error = false) {
          if (self.forceCompressSignal) return;
          requestAnimationFrame(() => {
            if (!error && blob instanceof Blob && blob.size > 0) {
              extension = Lib.suffixName(url);
              const fileName = `${fillName.replace("fill", Lib.mantissa(index, amount, filler))}.${extension}`;
              self.isVideo(extension) ? zipper.file(`${folderName}${decodeURIComponent(url).split("?f=")[1] || Lib.$q(`a[href*="${new URL(url).pathname}"]`).$text() || fileName}`, blob) : zipper.file(`${folderName}${fileName}`, blob);
              data.delete(index);
            }
            show = `[${++progress}/${total}]`;
            Lib.title(show);
            self.button.$text(`${Transl("下載進度")} ${show}`);
            if (progress == total) {
              total = data.size;
              if (total == 0) {
                self._compressFile(compressName, titleCache);
              } else {
                show = "Wait for failed re download";
                progress = 0;
                Lib.title(show);
                self.button.$text(show);
                setTimeout(() => {
                  for (const [index2, url2] of data.entries()) {
                    self.worker.postMessage({ index: index2, url: url2 });
                  }
                }, 1500);
              }
            }
          });
        }
        async function request(index, url) {
          if (self.forceCompressSignal) return;
          GM_xmlhttpRequest({
            url,
            method: "GET",
            responseType: "blob",
            onload: (response) => {
              if (response.status == 429) {
                requestUpdate(index, url, "", true);
                return;
              }
              requestUpdate(index, url, response.response);
            },
            onerror: () => {
              requestUpdate(index, url, "", true);
            },
          });
        }
        self.button.$text(`${Transl("請求進度")} [${total}/${total}]`);
        const batch = General.ConcurrentQuantity;
        const delay = General.ConcurrentDelay;
        for (let i = 0; i < total; i += batch) {
          setTimeout(
            () => {
              for (let j = i; j < i + batch && j < total; j++) {
                this.worker.postMessage({ index: j, url: data.get(j) });
              }
            },
            (i / batch) * delay,
          );
        }
        this.worker.onmessage = (e) => {
          const { index, url, blob, error } = e.data;
          error ? (request(index, url), Lib.log(url, { dev: General.Dev, group: "Download Failed", collapsed: false })).error : (requestUpdate(index, url, blob), Lib.log(url, { dev: General.Dev, group: "Download Successful", collapsed: false }));
        };
      }
      async _separDownload(fillName, data) {
        let show,
          url,
          fileName,
          extension,
          token = 5,
          stop = false,
          progress = 0;
        const self = this,
          process = [],
          promises = [],
          total = data.size,
          showTracking = {},
          titleCache = this.originalTitle();
        const fillValue = this._nameAnalysis(FileName.FillValue),
          filler = fillValue[1],
          amount = fillValue[0] == "auto" ? Lib.getFill(total) : fillValue[0];
        async function _stop() {
          stop = true;
          process.forEach((pc) => pc.abort());
        }
        Lib.regMenu(
          {
            [Transl("⛔️ 取消下載")]: { func: () => _stop(), hotkey: "s" },
          },
          { name: "Abort" },
        );
        async function request(index) {
          if (stop) return;
          url = data.get(index);
          extension = Lib.suffixName(url);
          const FileName2 = `${fillName.replace("fill", Lib.mantissa(index, amount, filler))}.${extension}`;
          fileName = self.isVideo(extension) ? decodeURIComponent(url).split("?f=")[1] || Lib.$q(`a[href*="${new URL(url).pathname}"]`).$text() || FileName2 : FileName2;
          return new Promise((resolve, reject) => {
            const completed = () => {
              if (!showTracking[index]) {
                showTracking[index] = true;
                Lib.log(url, { dev: General.Dev, group: "Download Successful", collapsed: false });
                show = `[${++progress}/${total}]`;
                Lib.title(show);
                self.button.$text(`${Transl("下載進度")} ${show}`);
                resolve();
              }
            };
            const download = GM_download({
              url,
              name: fileName,
              conflictAction: "overwrite",
              onload: () => {
                completed();
              },
              onprogress: (progress2) => {},
              onerror: () => {
                Lib.log(url, { dev: General.Dev, group: "Download Error", collapsed: false }).error;
                setTimeout(() => {
                  reject();
                  token--;
                  if (token <= 0) return;
                  request(index);
                }, 1500);
              },
            });
            process.push(download);
          });
        }
        for (let i = 0; i < total; i++) {
          promises.push(request(i));
          await Lib.sleep(General.ConcurrentDelay);
        }
        await Promise.allSettled(promises);
        Lib.unMenu("Abort-1");
        Lib.title(`✓ ${titleCache}`);
        this.button.$text(Transl("下載完成"));
        setTimeout(() => {
          this._resetButton();
        }, 3e3);
      }
      async _compressFile(name, title) {
        this.worker.terminate();
        this.forceCompressSignal = true;
        Lib.unMenu("Enforce-1");
        zipper
          .generateZip(
            {
              level: 9,
            },
            (progress) => {
              const display = `${progress.toFixed(1)} %`;
              Lib.title(display);
              this.button.$text(`${Transl("封裝進度")}: ${display}`);
            },
          )
          .then((zip) => {
            saveAs(zip, `${name}.zip`);
            Lib.title(`✓ ${title}`);
            this.button.$text(Transl("下載完成"));
            setTimeout(() => {
              this._resetButton();
            }, 3e3);
          })
          .catch((result) => {
            Lib.title(title);
            const errorShow = Transl("壓縮封裝失敗");
            this.button.$text(errorShow);
            Lib.log(result, { dev: General.Dev, group: errorShow, collapsed: false }).error;
            setTimeout(() => {
              Process.Lock = false;
              this.button.disabled = false;
              this.button.$text(this.modeDisplay);
            }, 6e3);
          });
      }
      async _resetButton() {
        General.CompleteClose && window.close();
        Process.Lock = false;
        Lib.$qa(".Download_Button[disabled]").forEach((button) => {
          button.disabled = false;
          button.$text(`✓ ${this.modeDisplay}`);
        });
      }
    };
  }
  function Main() {
    const isContent = (URL2) => /^(https?:\/\/)?(www\.)?.+\/.+\/user\/.+\/post\/.+$/.test(URL2);
    const isPreview = (URL2) => /^(https?:\/\/)?(www\.)?.+\/posts\/?(\?.*)?$/.test(URL2) || /^(https?:\/\/)?(www\.)?.+\/.+\/user\/[^\/]+(\?.*)?$/.test(URL2) || /^(https?:\/\/)?(www\.)?.+\/dms\/?(\?.*)?$/.test(URL2);
    let download;
    async function openAllPages() {
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
          setParent: false,
        });
        await Lib.sleep(General.BatchOpenDelay);
      }
    }
    async function buttonCreation() {
      Lib.waitEl(".post__body h2, .scrape__body h2", null, { raf: true, all: true, timeout: 10 }).then((Files) => {
        if (Files.length === 0) return;
        Lib.addStyle(
          `
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
            `,
          "Download-button-style",
          false,
        );
        try {
          Lib.$qa("[id^='Button-Container-']").forEach((button) => button.remove());
          const Pointer = [...Files].filter((file) => {
            const text = file.$text();
            if (text === "Downloads" || text === "Files") {
              file.id = text;
              return true;
            }
            return false;
          });
          if (Pointer.length === 0) return;
          const CompressMode = Lib.getLocal("Compression", true);
          const ModeDisplay = CompressMode ? Transl("壓縮下載") : Transl("單獨下載");
          download ??= Downloader();
          Pointer.forEach((pointer, index) => {
            Lib.createElement(pointer, "span", {
              id: `Button-Container-${index}`,
              on: {
                click: (event) => {
                  const target = event.target;
                  if (target.tagName === "BUTTON") {
                    new download(CompressMode, ModeDisplay, target).trigger(target.closest("h2").id);
                  } else if (target.closest("svg")) {
                    alert("Currently Invalid");
                  }
                },
              },
              innerHTML: `
                            <svg class="Setting_Button" xmlns="http://www.w3.org/2000/svg" height="1.3rem" viewBox="0 0 512 512"><path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/></svg>
                            <button class="Download_Button">${ModeDisplay}</button>
                        `,
            });
          });
        } catch (error) {
          Lib.log(error, { dev: General.Dev, group: "Button Creation Failed", collapsed: false }).error;
          const Button = Lib.$q("#Button-Container button");
          if (Button) {
            Button.disabled = true;
            Button.textContent = Transl("無法下載");
          }
        }
      });
    }
    async function downloadModeSwitch() {
      if (Process.Lock) {
        alert(Transl("下載中鎖定"));
        return;
      }
      Lib.getLocal("Compression", true) ? Lib.setLocal("Compression", false) : Lib.setLocal("Compression", true);
      buttonCreation();
    }
    async function registerMenu(Page) {
      if (isContent(Page)) {
        Lib.regMenu(
          {
            [Transl("🔁 切換下載模式")]: { func: () => downloadModeSwitch(), close: false, hotkey: "c" },
          },
          { reset: true },
        );
      } else if (isPreview(Page)) {
        Lib.regMenu(
          {
            [Transl("📑 獲取帖子數據")]: () => {
              if (!Process.Lock) {
                new FetchData().fetchRun();
              }
            },
            [Transl("📃 開啟當前頁面帖子")]: openAllPages,
          },
          { reset: true },
        );
        if (General.Dev && !Process.IsNeko) {
          Lib.regMenu(
            {
              "🛠️ 開發者獲取": () => {
                const id = prompt("輸入請求的 ID");
                if (id == null || id === "") return;
                new FetchData().fetchTest(id);
              },
            },
            { index: 3 },
          );
        }
      }
    }
    isContent(Lib.$url) && buttonCreation();
    registerMenu(Lib.$url);
    Lib.onUrlChange((change) => {
      isContent(change.url) && buttonCreation();
      registerMenu(change.url);
    });
  }
  Main();
})();