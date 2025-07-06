// ==UserScript==
// @name         Kemer Downloader
// @name:zh-TW   Kemer 下載器
// @name:zh-CN   Kemer 下载器
// @name:ja      Kemer ダウンローダー
// @name:ru      Kemer Загрузчик
// @name:ko      Kemer 다운로더
// @name:en      Kemer Downloader
// @version      0.0.21-Beta6
// @author       Canaan HS
// @description         一鍵下載圖片 (壓縮下載/單圖下載) , 一鍵獲取帖子數據以 Json 或 Txt 下載 , 一鍵開啟當前所有帖子
// @description:zh-TW   一鍵下載圖片 (壓縮下載/單圖下載) , 下載頁面數據 , 一鍵開啟當前所有帖子
// @description:zh-CN   一键下载图片 (压缩下载/单图下载) , 下载页面数据 , 一键开启当前所有帖子
// @description:ja      画像をワンクリックでダウンロード（圧縮ダウンロード/単一画像ダウンロード）、ページデータを作成してjsonでダウンロード、現在のすべての投稿をワンクリックで開く
// @description:ru      Загрузка изображений в один клик (сжатая загрузка/загрузка отдельных изображений), создание данных страницы для загрузки в формате json, открытие всех текущих постов одним кликом
// @description:ko      이미지 원클릭 다운로드(압축 다운로드/단일 이미지 다운로드), 페이지 데이터 생성하여 json 다운로드, 현재 모든 게시물 원클릭 열기
// @description:en      One-click download of images (compressed download/single image download), create page data for json download, one-click open all current posts

// @connect      *
// @match        *://kemono.su/*
// @match        *://coomer.su/*
// @match        *://nekohouse.su/*
// @match        *://*.kemono.su/*
// @match        *://*.coomer.su/*
// @match        *://*.nekohouse.su/*

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635
// @supportURL   https://github.com/Canaan-HS/MonkeyScript/issues
// @icon         https://cdn-icons-png.flaticon.com/512/2381/2381981.png

// @require      https://update.greasyfork.org/scripts/495339/1616381/Syntax_min.js
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
  const Config = {
    Dev: false,
    // 顯示請求資訊, 與錯誤資訊
    ContainsVideo: false,
    // 下載時包含影片
    CompleteClose: false,
    // 下載完成後關閉
    ConcurrentDelay: 500,
    // 下載線程延遲 (ms) [壓縮下載]
    ConcurrentQuantity: 5,
    // 下載線程數量 [壓縮下載]
    BatchOpenDelay: 500
    // 一鍵開啟帖子的延遲 (ms)
  };
  const FileName = {
    FillValue: {
      Filler: "0",
      // 填充元素 / 填料
      Amount: "Auto"
      // 填充數量 [輸入 auto 或 任意數字]
    },
    CompressName: "({Artist}) {Title}",
    // 壓縮檔案名稱
    FolderName: "{Title}",
    // 資料夾名稱 (用空字串, 就直接沒資料夾)
    FillName: "{Title} {Fill}"
    // 檔案名稱 [! 可以移動位置, 但不能沒有 {Fill}]
  };
  const FetchSet = {
    Delay: 200,
    // 獲取延遲 (ms) [太快會被 BAN]
    AdvancedFetch: true,
    // 進階獲取 (如果只需要 圖片和影片連結, 關閉該功能獲取會快很多)
    ToLinkTxt: false
  };
  const Process = {
    Lock: false,
    IsNeko: location.hostname.startsWith("nekohouse")
  };
  const Dict = {
    Traditional: {
      "開帖說明": "\n\n!! 不輸入直接確認, 將會開啟當前頁面所有帖子\n輸入開啟範圍(說明) =>\n單個: 1, 2, 3\n範圍: 1~5, 6-10\n排除: !5, -10"
    },
    Simplified: {
      "🔁 切換下載模式": "🔁 切换下载模式",
      "📑 獲取帖子數據": "📑 获取帖子数据",
      "📃 開啟當前頁面帖子": "📃 打开当前页面帖子",
      "📥 強制壓縮下載": "📥 强制压缩下载",
      "⛔️ 取消下載": "⛔️ 取消下载",
      "壓縮下載模式": "压缩下载模式",
      "單圖下載模式": "单图下载模式",
      "壓縮下載": "压缩下载",
      "單圖下載": "单图下载",
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
      "作者": "作者",
      "時間": "时间",
      "來源": "来源",
      "未取得數據": "未获取到数据",
      "模式切換": "模式切换",
      "數據處理中": "数据处理中",
      "當前處理頁數": "当前处理页数",
      "數據處理完成": "数据处理完成",
      "Json 數據下載": "JSON 数据下载",
      "當前帖子數": "当前帖子数",
      "開帖說明": "\n\n!! 如果直接确认而不输入，将会打开当前页面的所有帖子\n输入选择范围：\n单个项目：1, 2, 3\n范围指定：1~5, 6-10\n排除项目：!5, -10"
    },
    Japan: {
      "🔁 切換下載模式": "🔁 ダウンロードモード切替",
      "📑 獲取帖子數據": "📑 投稿データ取得",
      "📃 開啟當前頁面帖子": "📃 現在のページの投稿を開く",
      "📥 強制壓縮下載": "📥 強制圧縮ダウンロード",
      "⛔️ 取消下載": "⛔️ ダウンロード中止",
      "壓縮下載模式": "圧縮ダウンロードモード",
      "單圖下載模式": "単一画像ダウンロードモード",
      "壓縮下載": "圧縮ダウンロード",
      "單圖下載": "単一画像ダウンロード",
      "開始下載": "ダウンロード開始",
      "無法下載": "ダウンロード不可",
      "下載進度": "ダウンロード進捗",
      "封裝進度": "パッケージング進捗",
      "壓縮封裝失敗": "圧縮パッケージング失敗",
      "下載完成": "ダウンロード完了",
      "請求進度": "リクエスト進捗",
      "下載中鎖定": "ダウンロード中ロック",
      "原始連結": "元のリンク",
      "圖片數量": "画像数",
      "影片數量": "動画数",
      "下載連結": "ダウンロードリンク",
      "作者": "作者",
      "時間": "時間",
      "來源": "ソース",
      "未取得數據": "データ未取得",
      "模式切換": "モード切替",
      "數據處理中": "データ処理中",
      "當前處理頁數": "現在処理中のページ",
      "數據處理完成": "データ処理完了",
      "Json 數據下載": "Jsonデータダウンロード",
      "當前帖子數": "現在の投稿数",
      "開帖說明": "\n\n!! 確認を入力しないと、現在のページのすべての投稿が開かれます\n開始範囲を入力してください：\n単一項目: 1, 2, 3\n範囲指定: 1~5, 6-10\n除外設定: !5, -10"
    },
    Korea: {
      "🔁 切換下載模式": "🔁 다운로드 모드 전환",
      "📑 獲取帖子數據": "📑 게시물 데이터 가져오기",
      "📃 開啟當前頁面帖子": "📃 현재 페이지 게시물 열기",
      "📥 強制壓縮下載": "📥 강제 압축 다운로드",
      "⛔️ 取消下載": "⛔️ 다운로드 취소",
      "壓縮下載模式": "압축 다운로드 모드",
      "單圖下載模式": "단일 이미지 다운로드 모드",
      "壓縮下載": "압축 다운로드",
      "單圖下載": "단일 이미지 다운로드",
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
      "影片數量": "동영상 수",
      "下載連結": "다운로드 링크",
      "作者": "작성자",
      "時間": "시간",
      "來源": "출처",
      "未取得數據": "데이터를 가져오지 못함",
      "模式切換": "모드 전환",
      "數據處理中": "데이터 처리 중",
      "當前處理頁數": "현재 처리 페이지",
      "數據處理完成": "데이터 처리 완료",
      "Json 數據下載": "JSON 데이터 다운로드",
      "當前帖子數": "현재 게시물 수",
      "開帖說明": "\n\n!! 확인 없이 진행하면 현재 페이지의 모든 게시물이 열립니다\n선택 범위 입력:\n단일 항목: 1, 2, 3\n범위 지정: 1~5, 6-10\n제외 항목: !5, -10"
    },
    Russia: {
      "🔁 切換下載模式": "🔁 Переключить режим загрузки",
      "📑 獲取帖子數據": "📑 Получить данные постов",
      "📃 開啟當前頁面帖子": "📃 Открыть посты на текущей странице",
      "📥 強制壓縮下載": "📥 Принудительная сжатая загрузка",
      "⛔️ 取消下載": "⛔️ Отменить загрузку",
      "壓縮下載模式": "Режим сжатой загрузки",
      "單圖下載模式": "Режим загрузки отдельных изображений",
      "壓縮下載": "Сжатая загрузка",
      "單圖下載": "Загрузка отдельных изображений",
      "開始下載": "Начать загрузку",
      "無法下載": "Невозможно загрузить",
      "下載進度": "Прогресс загрузки",
      "封裝進度": "Прогресс упаковки",
      "壓縮封裝失敗": "Ошибка сжатия",
      "下載完成": "Загрузка завершена",
      "請求進度": "Прогресс запроса",
      "下載中鎖定": "Заблокировано во время загрузки",
      "原始連結": "Исходная ссылка",
      "圖片數量": "Количество изображений",
      "影片數量": "Количество видео",
      "下載連結": "Ссылка для загрузки",
      "作者": "Автор",
      "時間": "Время",
      "來源": "Источник",
      "未取得數據": "Данные не получены",
      "模式切換": "Переключение режима",
      "數據處理中": "Обработка данных",
      "當前處理頁數": "Обрабатываемая страница",
      "數據處理完成": "Обработка данных завершена",
      "Json 數據下載": "Загрузка данных JSON",
      "當前帖子數": "Текущее количество постов",
      "開帖說明": "\n\n!! Без подтверждения будут открыты все посты на текущей странице\nВведите диапазон выбора:\nОтдельные элементы: 1, 2, 3\nДиапазоны: 1~5, 6-10\nИсключения: !5, -10"
    },
    English: {
      "🔁 切換下載模式": "🔁 Switch Download Mode",
      "📑 獲取帖子數據": "📑 Get Post Data",
      "📃 開啟當前頁面帖子": "📃 Open Posts on Current Page",
      "📥 強制壓縮下載": "📥 Force Compressed Download",
      "⛔️ 取消下載": "⛔️ Cancel Download",
      "壓縮下載模式": "Compressed Download Mode",
      "單圖下載模式": "Single Image Download Mode",
      "壓縮下載": "Compressed Download",
      "單圖下載": "Single Image Download",
      "開始下載": "Start Download",
      "無法下載": "Unable to Download",
      "下載進度": "Download Progress",
      "封裝進度": "Packaging Progress",
      "壓縮封裝失敗": "Compression Failed",
      "下載完成": "Download Complete",
      "請求進度": "Request Progress",
      "下載中鎖定": "Locked During Download",
      "原始連結": "Original Link",
      "圖片數量": "Image Count",
      "影片數量": "Video Count",
      "下載連結": "Download Link",
      "作者": "Author",
      "時間": "Time",
      "來源": "Source",
      "未取得數據": "No Data Retrieved",
      "模式切換": "Mode Switch",
      "數據處理中": "Processing Data",
      "當前處理頁數": "Processing Page",
      "數據處理完成": "Data Processing Complete",
      "Json 數據下載": "Download JSON Data",
      "當前帖子數": "Current Post Count",
      "開帖說明": "\n\n!! Without confirmation, all posts on the current page will be opened\nEnter selection range:\nSingle items: 1, 2, 3\nRanges: 1~5, 6-10\nExclusions: !5, -10"
    }
  };
  function Fetch(Config2, Process2, Transl2, Syn2, md52) {
    return class FetchData {
      constructor(Delay, AdvancedFetch, ToLinkTxt) {
        this.MetaDict = {};
        this.DataDict = {};
        this.RecordKey = `${decodeURIComponent(Syn2.url)}-Complete`;
        this.TaskDict = /* @__PURE__ */ new Map();
        this.Host = Syn2.$domain;
        this.SourceURL = Syn2.url;
        this.TitleCache = Syn2.title();
        this.FirstURL = this.SourceURL.split("?o=")[0];
        this.Pages = 1;
        this.FinalPages = 10;
        this.Progress = 0;
        this.OnlyMode = false;
        this.FetchDelay = Delay;
        this.ToLinkTxt = ToLinkTxt;
        this.AdvancedFetch = AdvancedFetch;
        this.PostAPI = `${this.FirstURL}/post`.replace(this.Host, `${this.Host}/api/v1`);
        this.PreviewAPI = (Url) => (
          // 將預覽頁面轉成 API 連結
          /[?&]o=/.test(Url) ? Url.replace(this.Host, `${this.Host}/api/v1`).replace(/([?&]o=)/, "/posts-legacy$1") : Url.replace(this.Host, `${this.Host}/api/v1`) + "/posts-legacy"
        );
        this.InfoRules = {
          "PostLink": Transl2("帖子連結"),
          "Timestamp": Transl2("發佈日期"),
          "TypeTag": Transl2("類型標籤"),
          "ImgLink": Transl2("圖片連結"),
          "VideoLink": Transl2("影片連結"),
          "DownloadLink": Transl2("下載連結"),
          "ExternalLink": Transl2("外部連結")
        };
        this.Default = (Value) => {
          if (!Value) return null;
          const type = Syn2.Type(Value);
          if (type === "Array") return Value.length > 0 && Value.some((item) => item !== "") ? Value : null;
          if (type === "Object") {
            const values = Object.values(Value);
            return values.length > 0 && values.some((item) => item !== "") ? Value : null;
          }
          return Value;
        };
        this.FetchGenerate = (Data) => {
          return Object.keys(Data).reduce((acc, key) => {
            if (this.InfoRules.hasOwnProperty(key)) {
              const value = this.Default(Data[key]);
              value && (acc[this.InfoRules[key]] = value);
            }
            return acc;
          }, {});
        };
        this.Video = /* @__PURE__ */ new Set([
          ".mp4",
          ".avi",
          ".mkv",
          ".mov",
          ".flv",
          ".wmv",
          ".webm",
          ".mpg",
          ".mpeg",
          ".m4v",
          ".ogv",
          ".3gp",
          ".asf",
          ".ts",
          ".vob",
          ".rm",
          ".rmvb",
          ".m2ts",
          ".f4v",
          ".mts"
        ]);
        this.Image = /* @__PURE__ */ new Set([
          ".jpg",
          ".jpeg",
          ".png",
          ".gif",
          ".bmp",
          ".webp",
          ".tiff",
          ".tif",
          ".svg",
          ".heic",
          ".heif",
          ".raw",
          ".ico",
          ".psd"
        ]);
        this.Suffix = (Str) => {
          var _a;
          try {
            return `.${(_a = Str == null ? void 0 : Str.match(/\.([^.]+)$/)[1]) == null ? void 0 : _a.trim()}`;
          } catch {
            return "";
          }
        };
        this.AdvancedCategorize = (Data) => {
          return Data.reduce((acc, file) => {
            const url = `${file.server}/data${file.path}?f=${file.name}`;
            this.Video.has(file.extension) ? acc.video[file.name] = url : acc.other[file.name] = url;
            return acc;
          }, { video: {}, other: {} });
        };
        this.Categorize = (Title, Data) => {
          let imgNumber = 0;
          let serverNumber = 0;
          return Data.reduce((acc, file) => {
            const name = file.name;
            const path = file.path;
            const extension = this.Suffix(name);
            serverNumber = serverNumber % 4 + 1;
            const server = `https://n${serverNumber}.${this.Host}/data`;
            if (this.Video.has(extension)) {
              acc.video[name] = `${server}${path}?f=${name}`;
            } else if (this.Image.has(extension)) {
              const name2 = `${Title}_${String(++imgNumber).padStart(2, "0")}${extension}`;
              acc.img[name2] = `${server}${path}?f=${name2}`;
            } else {
              acc.other[name] = `${server}${path}?f=${name}`;
            }
            return acc;
          }, { img: {}, video: {}, other: {} });
        };
        this.TryAgain_Promise = null;
        this.TooMany_TryAgain = (Uri) => {
          if (this.TryAgain_Promise) {
            return this.TryAgain_Promise;
          }
          const sleepTime = 5e3;
          const timeout = 2e5;
          const Url = Uri;
          this.TryAgain_Promise = new Promise(async (resolve) => {
            const checkRequest = async () => {
              const controller = new AbortController();
              const signal = controller.signal;
              const timeoutId = setTimeout(() => {
                controller.abort();
              }, timeout);
              try {
                const response = await fetch(Url, {
                  // 發起請求
                  method: "HEAD",
                  signal
                });
                clearTimeout(timeoutId);
                if (response.status === 429) {
                  await Syn2.Sleep(sleepTime);
                  await checkRequest();
                } else {
                  resolve();
                  this.TryAgain_Promise = null;
                }
              } catch (err) {
                clearTimeout(timeoutId);
                await Syn2.Sleep(sleepTime);
                await checkRequest();
              }
            };
            await checkRequest();
          });
          return this.TryAgain_Promise;
        };
        this.Worker = Syn2.WorkerCreation(`
                let queue = [], processing=false;
                onmessage = function(e) {
                    queue.push(e.data);
                    !processing && (processing=true, processQueue());
                }
                async function processQueue() {
                    if (queue.length > 0) {
                        const {index, title, url} = queue.shift();
                        FetchRequest(index, title, url);
                        processQueue();
                    } else {processing = false}
                }
                async function FetchRequest(index, title, url) {
                    fetch(url).then(response => {
                        if (response.ok) {
                            // 目前不同網站不一定都是 Json, 所以這裡用 text()
                            response.text().then(content => {
                                postMessage({ index, title, url, content, error: false });
                            });
                        } else {
                            postMessage({ index, title, url, content: "", error: true });
                        }
                    })
                    .catch(error => {
                        postMessage({ index, title, url, content: "", error: true });
                    });
                }
            `);
        this.specialLinkParse = (Data) => {
          var _a, _b, _c, _d, _e;
          const Cache = {};
          try {
            for (const a of Syn2.DomParse(Data).$qa("body a")) {
              const href = a.href;
              const hash = md52(href).slice(0, 16);
              if (href.startsWith("https://mega.nz")) {
                let name = ((_a = a.previousElementSibling) == null ? void 0 : _a.$text().replace(":", "")) || hash;
                if (name === "") continue;
                let pass = "";
                const nextNode = a.nextElementSibling;
                if (nextNode) {
                  const nodeText = ((_b = [...nextNode.childNodes].find((node) => node.nodeType === Node.TEXT_NODE)) == null ? void 0 : _b.$text()) ?? "";
                  if (nodeText.startsWith("Pass")) {
                    pass = ((_d = (_c = nodeText.match(/Pass:([^<]*)/)) == null ? void 0 : _c[1]) == null ? void 0 : _d.trim()) ?? "";
                  }
                }
                ;
                Cache[name] = pass ? {
                  [Transl2("密碼")]: pass,
                  [Transl2("連結")]: href
                } : href;
              } else if (href) {
                const description = ((_e = a.previousSibling) == null ? void 0 : _e.$text()) ?? "";
                const name = `${description} ${a == null ? void 0 : a.$text()}`.trim();
                Cache[name ? name : hash] = href;
              }
            }
            ;
          } catch (error) {
            Syn2.Log("Error specialLinkParse", error, { dev: Config2.Dev, type: "error", collapsed: false });
          }
          return Cache;
        };
      }
      /**
       * 設置抓取規則
       * @param {string} Mode - "FilterMode" | "OnlyMode"
       * @param {Array} UserSet - 要進行的設置
       *
       * @example
       * 可配置項目: ["PostLink", "Timestamp", "TypeTag", "ImgLink", "VideoLink", "DownloadLink"]
       *
       * 這會將這些項目移除在顯示
       * FetchConfig("FilterMode", ["PostLink", "ImgLink", "DownloadLink"]);
       *
       * 這會只顯示這些項目
       * FetchConfig("OnlyMode", ["PostLink", "ImgLink", "DownloadLink"]);
       */
      async FetchConfig(Mode = "FilterMode", UserSet = []) {
        let Cache;
        switch (Mode) {
          case "FilterMode":
            this.OnlyMode = false;
            UserSet.forEach((key) => delete this.InfoRules[key]);
            break;
          case "OnlyMode":
            this.OnlyMode = true;
            Cache = Object.keys(this.InfoRules).reduce((acc, key) => {
              if (UserSet.includes(key)) acc[key] = this.InfoRules[key];
              return acc;
            }, {});
            this.InfoRules = Cache;
            break;
        }
      }
      /* 入口調用函數 */
      async FetchInit() {
        const Section = Syn2.$q("section");
        if (Section) {
          Process2.Lock = true;
          for (const page of Syn2.$qa(".pagination-button-disabled b")) {
            const number = Number(page.$text());
            if (number) {
              this.Pages = number;
              break;
            }
          }
          Syn2.Session(this.RecordKey) && (this.FetchDelay = 0);
          this.FetchRun(Section, this.SourceURL);
        } else {
          alert(Transl2("未取得數據"));
        }
      }
      /* ===== 主要抓取函數 ===== */
      /* 運行抓取數據 */
      async FetchRun(Section, Url) {
        if (Process2.IsNeko) {
          Section.$qa(".card-list__items article");
          Section.$q("a.pagination-button-after-current");
        } else {
          this.Worker.postMessage({ index: 0, title: this.TitleCache, url: this.PreviewAPI(Url) });
          const HomeData = await new Promise((resolve, reject) => {
            this.Worker.onmessage = async (e) => {
              const { index, title, url, content, error } = e.data;
              if (!error) resolve({ index, title, url, content });
              else {
                Syn2.Log(error, { title, url }, { dev: Config2.Dev, type: "error", collapsed: false });
                await this.TooMany_TryAgain(url);
                this.Worker.postMessage({ index, title, url });
              }
            };
          });
          await this.FetchContent(HomeData);
          this.Pages++;
          this.Pages <= this.FinalPages ? this.FetchRun(
            null,
            /\?o=\d+$/.test(Url) ? Url.replace(/\?o=(\d+)$/, (match, number) => `?o=${+number + 50}`) : `${Url}?o=50`
          ) : (Syn2.Session(this.RecordKey, { value: true }), this.ToLinkTxt ? this.ToTxt() : this.ToJson());
        }
      }
      /* 測試進階抓取數據 */
      async FetchTest(Id) {
        Process2.Lock = true;
        this.Worker.postMessage({ index: 0, title: this.TitleCache, url: this.PreviewAPI(this.FirstURL) });
        const HomeData = await new Promise((resolve, reject) => {
          this.Worker.onmessage = async (e) => {
            const { index, title, url, content: content2, error } = e.data;
            if (!error) resolve({ index, title, url, content: content2 });
            else {
              Syn2.Log(error, { title, url }, { dev: Config2.Dev, type: "error", collapsed: false });
              await this.TooMany_TryAgain(url);
              this.Worker.postMessage({ index, title, url });
            }
          };
        });
        const { content } = HomeData;
        Object.assign(HomeData, { content: JSON.parse(content) });
        Syn2.Log("HomeData", HomeData, { collapsed: false });
        const Cloned_HomeData = structuredClone(HomeData);
        Cloned_HomeData.content.results = [{ Id }];
        Cloned_HomeData.content = JSON.stringify(Cloned_HomeData.content);
        await this.FetchContent(Cloned_HomeData);
        Syn2.Log("PostDate", this.DataDict, { collapsed: false });
        this.Reset();
      }
      /* 獲取帖子內部數據 */
      async FetchContent(Data) {
        var _a;
        this.Progress = 0;
        const { index, title, url, content } = Data;
        if (Process2.IsNeko);
        else {
          const Json = JSON.parse(content);
          if (Json) {
            if (Object.keys(this.MetaDict).length === 0) {
              const props = Json.props;
              this.FinalPages = Math.ceil(+props.count / 50);
              this.MetaDict = {
                [Transl2("作者")]: props.name,
                [Transl2("帖子數量")]: props.count,
                [Transl2("建立時間")]: Syn2.GetDate("{year}-{month}-{date} {hour}:{minute}"),
                [Transl2("獲取頁面")]: this.SourceURL,
                [Transl2("作者網站")]: props.display_data.href
              };
            }
            const Results = Json.results;
            if (this.AdvancedFetch) {
              const Tasks = [];
              const resolvers = /* @__PURE__ */ new Map();
              this.Worker.onmessage = async (e) => {
                var _a2;
                const { index: index2, title: title2, url: url2, content: content2, error } = e.data;
                if (resolvers.has(index2)) {
                  const { resolve, reject } = resolvers.get(index2);
                  try {
                    if (!error) {
                      const Json2 = JSON.parse(content2);
                      if (Json2) {
                        const Post = Json2.post;
                        const Title = Post.title.trim().replace(/\n/g, " ") || `Untitled_${String(index2 + 1).padStart(2, "0")}`;
                        const File = this.AdvancedCategorize(Json2.attachments);
                        const ImgLink = () => {
                          //! 還需要測試
                          const ServerList = Json2.previews.filter((item) => item.server);
                          if (((ServerList == null ? void 0 : ServerList.length) ?? 0) === 0) return;
                          const List = [
                            ...Post.file ? Array.isArray(Post.file) ? Post.file : Object.keys(Post.file).length ? [Post.file] : [] : [],
                            ...Post.attachments
                          ];
                          const Fill = Syn2.GetFill(ServerList.length);
                          return ServerList.reduce((acc, Server, Index) => {
                            const extension = [List[Index].name, List[Index].path].map((name2) => this.Suffix(name2)).find((ext) => this.Image.has(ext));
                            if (!extension) return acc;
                            const name = `${Title}_${Syn2.Mantissa(Index, Fill, "0", extension)}`;
                            acc[name] = `${Server.server}/data${List[Index].path}?f=${name}`;
                            return acc;
                          }, {});
                        };
                        const Gen = this.FetchGenerate({
                          PostLink: `${this.FirstURL}/post/${Post.id}`,
                          Timestamp: (_a2 = new Date(Post.added)) == null ? void 0 : _a2.toLocaleString(),
                          TypeTag: Post.tags,
                          ImgLink: ImgLink(),
                          VideoLink: File.video,
                          DownloadLink: File.other,
                          ExternalLink: this.specialLinkParse(Post.content)
                        });
                        if (Object.keys(Gen).length !== 0) {
                          this.TaskDict.set(index2, { title: Title, content: Gen });
                        }
                        ;
                        resolve();
                        Syn2.title(`（${this.Pages} - ${++this.Progress}）`);
                        Syn2.Log("Request Successful", this.TaskDict, { dev: Config2.Dev, collapsed: false });
                      } else throw new Error("Json Parse Failed");
                    } else {
                      throw new Error("Request Failed");
                    }
                  } catch (error2) {
                    Syn2.Log(error2, { index: index2, title: title2, url: url2 }, { dev: Config2.Dev, type: "error", collapsed: false });
                    await this.TooMany_TryAgain(url2);
                    this.Worker.postMessage({ index: index2, title: title2, url: url2 });
                  }
                }
              };
              for (const [Index, Post] of Results.entries()) {
                Tasks.push(new Promise((resolve, reject) => {
                  resolvers.set(Index, { resolve, reject });
                  this.Worker.postMessage({ index: Index, title: Post.title, url: `${this.PostAPI}/${Post.id}` });
                }));
                await Syn2.Sleep(this.FetchDelay);
              }
              await Promise.allSettled(Tasks);
            } else {
              for (const [Index, Post] of Results.entries()) {
                const Title = Post.title.trim();
                try {
                  const File = this.Categorize(Title, [...Post.file ? Array.isArray(Post.file) ? Post.file : Object.keys(Post.file).length ? [Post.file] : [] : [], ...Post.attachments]);
                  const Gen = this.FetchGenerate({
                    PostLink: `${this.FirstURL}/post/${Post.id}`,
                    Timestamp: (_a = new Date(Post.published)) == null ? void 0 : _a.toLocaleString(),
                    ImgLink: File.img,
                    VideoLink: File.video,
                    DownloadLink: File.other
                  });
                  if (Object.keys(Gen).length !== 0) {
                    this.TaskDict.set(Index, { title: Title, content: Gen });
                  }
                  ;
                  Syn2.title(`（${this.Pages} - ${++this.Progress}）`);
                  Syn2.Log("Parsed Successful", this.TaskDict, { dev: Config2.Dev, collapsed: false });
                } catch (error) {
                  Syn2.Log(error, { title: Title, url }, { dev: Config2.Dev, type: "error", collapsed: false });
                  continue;
                }
              }
            }
            for (const data of this.TaskDict.values()) {
              this.DataDict[data.title] = data.content;
            }
            this.TaskDict.clear();
            await Syn2.Sleep(this.FetchDelay);
            return true;
          }
        }
      }
      /* ===== 輸出生成 ===== */
      async Reset() {
        Process2.Lock = false;
        this.Worker.terminate();
        Syn2.title(this.TitleCache);
      }
      async ToTxt() {
        let Content = "";
        for (const value of Object.values(this.DataDict)) {
          for (const link of Object.values(Object.assign(
            {},
            value[Transl2("圖片連結")],
            value[Transl2("影片連結")],
            value[Transl2("下載連結")]
          ))) {
            Content += `${link}
`;
          }
        }
        if (Content.endsWith("\n")) Content = Content.slice(0, -1);
        Syn2.OutputTXT(Content, this.MetaDict[Transl2("作者")], () => {
          this.Reset();
        });
      }
      async ToJson() {
        const Json_data = Object.assign(
          {},
          { [Transl2("元數據")]: this.MetaDict },
          { [`${Transl2("帖子內容")} (${Object.keys(this.DataDict).length})`]: this.DataDict }
        );
        Syn2.OutputJson(Json_data, this.MetaDict[Transl2("作者")], () => {
          this.Reset();
        });
      }
    };
  }
  function Compressor(Syn2) {
    const worker = Syn2.WorkerCreation(`
            importScripts('https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.min.js');
            onmessage = function(e) {
                const { files, level } = e.data;
                try {
                    const zipped = fflate.zipSync(files, { level });
                    postMessage({ data: zipped }, [zipped.buffer]);
                } catch (err) {
                    postMessage({ error: err.message });
                }
            }
        `);
    return class Compression {
      constructor() {
        this.files = {};
        this.tasks = [];
      }
      // 存入 blob 進行壓縮
      async file(name, blob) {
        const task = new Promise(async (resolve) => {
          const buffer = await blob.arrayBuffer();
          this.files[name] = new Uint8Array(buffer);
          resolve();
        });
        this.tasks.push(task);
        return task;
      }
      // 估計壓縮耗時
      estimateCompression() {
        const calculateFileTime = (fileSize) => {
          const baseBytesPerSecond = 30 * 1024 ** 2;
          let fileTime = fileSize / baseBytesPerSecond;
          const fileSizeMB = fileSize / (1024 * 1024);
          if (fileSizeMB > 10) {
            fileTime *= 1 + Math.log10(fileSizeMB / 10) * 0.15;
          }
          return fileTime;
        };
        const calculateCurveParameter = (totalSizeMB2) => {
          let param = 5;
          if (totalSizeMB2 > 50) {
            const reduction = Math.min(Math.floor(totalSizeMB2 / 50) * 0.7, 3);
            param = Math.max(5 - reduction, 1.5);
          }
          return param;
        };
        let totalEstimatedTime = 0;
        let totalSize = 0;
        Object.values(this.files).forEach((file) => {
          totalEstimatedTime += calculateFileTime(file.length);
          totalSize += file.length;
        });
        const totalSizeMB = totalSize / (1024 * 1024);
        const fileCount = Object.keys(this.files).length;
        if (fileCount > 5) {
          totalEstimatedTime *= 1 + Math.min(fileCount / 100, 0.2);
        }
        if (totalSizeMB > 50) {
          const intervals = Math.floor(totalSizeMB / 50);
          totalEstimatedTime *= 1 + intervals * 0.08;
        }
        const curveParameter = calculateCurveParameter(totalSizeMB);
        return {
          estimatedInMs: totalEstimatedTime * 1e3,
          progressCurve: (ratio) => 100 * (1 - Math.exp(-curveParameter * ratio)) / (1 - Math.exp(-curveParameter))
        };
      }
      // 生成壓縮
      async generateZip(options = {}, progressCallback) {
        await Promise.all(this.tasks);
        const startTime = performance.now();
        const updateInterval = 30;
        const estimationData = this.estimateCompression();
        const totalTime = estimationData.estimatedInMs;
        const progressInterval = setInterval(() => {
          const elapsedTime = performance.now() - startTime;
          const ratio = Math.min(elapsedTime / totalTime, 0.99);
          const fakeProgress = estimationData.progressCurve(ratio);
          if (progressCallback) progressCallback(fakeProgress);
          if (ratio >= 0.99) {
            clearInterval(progressInterval);
          }
        }, updateInterval);
        return new Promise((resolve, reject) => {
          if (Object.keys(this.files).length === 0) return reject("Empty Data Error");
          worker.postMessage({
            files: this.files,
            level: options.level || 5
          }, Object.values(this.files).map((buf) => buf.buffer));
          worker.onmessage = (e) => {
            clearInterval(progressInterval);
            if (progressCallback) progressCallback(100);
            const { error, data } = e.data;
            error ? reject(error) : resolve(new Blob([data], { type: "application/zip" }));
          };
        });
      }
    };
  }
  function Downloader(GM_unregisterMenuCommand2, GM_xmlhttpRequest2, GM_download2, Config2, FileName2, Process2, Transl2, Syn2, saveAs2) {
    let Compression;
    return class Download {
      constructor(CM, MD, BT) {
        this.Button = BT;
        this.ModeDisplay = MD;
        this.CompressMode = CM;
        this.ForceDownload = false;
        this.Named_Data = null;
        this.OriginalTitle = () => {
          const cache = Syn2.title();
          return cache.startsWith("✓ ") ? cache.slice(2) : cache;
        };
        this.videoFormat = /* @__PURE__ */ new Set(["MP4", "MOV", "AVI", "WMV", "FLV"]);
        this.isVideo = (str) => this.videoFormat.has(str.toUpperCase());
        this.worker = Syn2.WorkerCreation(`
                let queue = [], processing=false;
                onmessage = function(e) {
                    queue.push(e.data);
                    !processing && (processing=true, processQueue());
                }
                async function processQueue() {
                    if (queue.length > 0) {
                        const {index, url} = queue.shift();
                        XmlRequest(index, url);
                        processQueue();
                    } else {processing = false}
                }

                async function XmlRequest(index, url) {
                    let xhr = new XMLHttpRequest();
                    xhr.responseType = "blob";
                    xhr.open("GET", url, true);
                    xhr.onload = function() {
                        if (xhr.readyState === 4 && xhr.status === 200) {
                            postMessage({ index, url: url, blob: xhr.response, error: false });
                        } else {
                            FetchRequest(index, url);
                        }
                    }
                    xhr.onerror = function() {
                        FetchRequest(index, url);
                    }
                    xhr.send();
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
            `);
      }
      /* 解析名稱格式 */
      NameAnalysis(format) {
        if (typeof format == "string") {
          return format.split(/{([^}]+)}/g).filter(Boolean).map((data) => {
            var _a, _b;
            const LowerData = data.toLowerCase().trim();
            const isWord = /^[a-zA-Z]+$/.test(LowerData);
            return isWord ? ((_b = (_a = this.Named_Data)[LowerData]) == null ? void 0 : _b.call(_a)) ?? "None" : data;
          }).join("");
        } else if (typeof format == "object") {
          const filler = String(format.Filler) || "0";
          const amount = parseInt(format.Amount) || "auto";
          return [amount, filler];
        } else;
      }
      /* 下載觸發 [ 查找下載數據, 解析下載資訊, 呼叫下載函數 ] */
      DownloadTrigger() {
        Syn2.WaitElem([
          ".post__title, .scrape__title",
          ".post__files, .scrape__files",
          ".post__user-name, .scrape__user-name, fix_name"
        ], (found) => {
          const [title, files, artist] = found;
          Process2.Lock = true;
          this.Button.disabled = true;
          const DownloadData = /* @__PURE__ */ new Map();
          this.Named_Data = {
            // 建立數據
            fill: () => "fill",
            title: () => title.$q("span").$text().replaceAll("/", "／"),
            artist: () => artist.$text(),
            source: () => new Date(title.$q(":nth-child(2)").$text()).toLocaleString(),
            time: () => {
              if (Process2.IsNeko) {
                return Syn2.$q(".timestamp").$text() || "";
              }
              let published = Syn2.$q(".post__published").$copy();
              Syn2.$q(".post__published");
              published.firstElementChild.remove();
              return published.$text().split(" ")[0];
            }
          };
          const [
            // 獲取名稱
            compress_name,
            folder_name,
            fill_name
          ] = Object.keys(FileName2).slice(1).map((key) => this.NameAnalysis(FileName2[key]));
          const data = [...files.children].map((child) => child.$q(Process2.IsNeko ? ".fileThumb, rc, img" : "a, rc, img")).filter(Boolean);
          Syn2.$qa(".post__attachment a, .scrape__attachment a");
          const final_data = data;
          for (const [index, file] of final_data.entries()) {
            const Uri = file.src || file.href || file.$gAttr("src") || file.$gAttr("href");
            if (Uri) {
              DownloadData.set(index, Uri.startsWith("http") ? Uri : `${Syn2.$origin}${Uri}`);
            }
          }
          if (DownloadData.size == 0) Config2.Dev = true;
          Syn2.Log("Get Data", {
            FolderName: folder_name,
            DownloadData
          }, { dev: Config2.Dev, collapsed: false });
          this.CompressMode ? this.PackDownload(compress_name, folder_name, fill_name, DownloadData) : this.SeparDownload(fill_name, DownloadData);
        }, { raf: true });
      }
      /* 打包壓縮下載 */
      async PackDownload(CompressName, FolderName, FillName, Data) {
        Compression ?? (Compression = Compressor(Syn2));
        let show, extension, progress = 0, Total = Data.size;
        const Self = this, Zip = new Compression(), TitleCache = this.OriginalTitle();
        const FillValue = this.NameAnalysis(FileName2.FillValue), Filler = FillValue[1], Amount = FillValue[0] == "auto" ? Syn2.GetFill(Total) : FillValue[0];
        async function ForceDownload() {
          Self.worker.terminate();
          Self.Compression(CompressName, Zip, TitleCache);
        }
        Syn2.Menu({
          [Transl2("📥 強制壓縮下載")]: { func: () => ForceDownload(), hotkey: "d" }
        }, { name: "Enforce" });
        FolderName = FolderName != "" ? `${FolderName}/` : "";
        function Request_update(index, url, blob, error = false) {
          if (Self.ForceDownload) return;
          requestAnimationFrame(() => {
            if (!error && blob instanceof Blob && blob.size > 0) {
              extension = Syn2.ExtensionName(url);
              const FileName3 = `${FillName.replace("fill", Syn2.Mantissa(index, Amount, Filler))}.${extension}`;
              Self.isVideo(extension) ? Zip.file(`${FolderName}${decodeURIComponent(url).split("?f=")[1] || Syn2.$q(`a[href*="${new URL(url).pathname}"]`).$text() || FileName3}`, blob) : Zip.file(`${FolderName}${FileName3}`, blob);
              Data.delete(index);
            }
            show = `[${++progress}/${Total}]`;
            Syn2.title(show);
            Self.Button.$text(`${Transl2("下載進度")} ${show}`);
            if (progress == Total) {
              Total = Data.size;
              if (Total == 0) {
                Self.worker.terminate();
                Self.Compression(CompressName, Zip, TitleCache);
              } else {
                show = "Wait for failed re download";
                progress = 0;
                Syn2.title(show);
                Self.Button.$text(show);
                setTimeout(() => {
                  for (const [index2, url2] of Data.entries()) {
                    Self.worker.postMessage({ index: index2, url: url2 });
                  }
                }, 1500);
              }
            }
          });
        }
        async function Request(index, url) {
          if (Self.ForceDownload) return;
          GM_xmlhttpRequest2({
            url,
            method: "GET",
            responseType: "blob",
            onload: (response) => {
              if (response.status == 429) {
                Request_update(index, url, "", true);
                return;
              }
              Request_update(index, url, response.response);
            },
            onerror: () => {
              Request_update(index, url, "", true);
            }
          });
        }
        Self.Button.$text(`${Transl2("請求進度")} [${Total}/${Total}]`);
        const Batch = Config2.ConcurrentQuantity;
        const Delay = Config2.ConcurrentDelay;
        for (let i = 0; i < Total; i += Batch) {
          setTimeout(() => {
            for (let j = i; j < i + Batch && j < Total; j++) {
              this.worker.postMessage({ index: j, url: Data.get(j) });
            }
          }, i / Batch * Delay);
        }
        this.worker.onmessage = (e) => {
          const { index, url, blob, error } = e.data;
          error ? (Request(index, url), Syn2.Log("Download Failed", url, { dev: Config2.Dev, type: "error", collapsed: false })) : (Request_update(index, url, blob), Syn2.Log("Download Successful", url, { dev: Config2.Dev, collapsed: false }));
        };
      }
      /* 單圖下載 */
      async SeparDownload(FillName, Data) {
        let show, url, filename, extension, stop = false, progress = 0;
        const Self = this, Process3 = [], Promises = [], Total = Data.size, ShowTracking = {}, TitleCache = this.OriginalTitle();
        const FillValue = this.NameAnalysis(FileName2.FillValue), Filler = FillValue[1], Amount = FillValue[0] == "auto" ? Syn2.GetFill(Total) : FillValue[0];
        async function Stop() {
          stop = true;
          Process3.forEach((process) => process.abort());
        }
        Syn2.Menu({
          [Transl2("⛔️ 取消下載")]: { func: () => Stop(), hotkey: "s" }
        }, { name: "Abort" });
        async function Request(index) {
          if (stop) return;
          url = Data.get(index);
          extension = Syn2.ExtensionName(url);
          const FileName3 = `${FillName.replace("fill", Syn2.Mantissa(index, Amount, Filler))}.${extension}`;
          filename = Self.isVideo(extension) ? decodeURIComponent(url).split("?f=")[1] || Syn2.$q(`a[href*="${new URL(url).pathname}"]`).$text() || FileName3 : FileName3;
          return new Promise((resolve, reject) => {
            const completed = () => {
              if (!ShowTracking[index]) {
                ShowTracking[index] = true;
                Syn2.Log("Download Successful", url, { dev: Config2.Dev, collapsed: false });
                show = `[${++progress}/${Total}]`;
                Syn2.title(show);
                Self.Button.$text(`${Transl2("下載進度")} ${show}`);
                resolve();
              }
            };
            const download = GM_download2({
              url,
              name: filename,
              conflictAction: "overwrite",
              onload: () => {
                completed();
              },
              onprogress: (progress2) => {
              },
              onerror: () => {
                Syn2.Log("Download Error", url, { dev: Config2.Dev, type: "error", collapsed: false });
                setTimeout(() => {
                  reject();
                  Request(index);
                }, 1500);
              }
            });
            Process3.push(download);
          });
        }
        for (let i = 0; i < Total; i++) {
          Promises.push(Request(i));
          await Syn2.Sleep(1e3);
        }
        await Promise.allSettled(Promises);
        GM_unregisterMenuCommand2("Abort-1");
        Syn2.title(`✓ ${TitleCache}`);
        this.Button.$text(Transl2("下載完成"));
        setTimeout(() => {
          this.ResetButton();
        }, 3e3);
      }
      /* 壓縮檔案 */
      async Compression(Name, Data, Title) {
        this.ForceDownload = true;
        GM_unregisterMenuCommand2("Enforce-1");
        Data.generateZip({
          level: 9
        }, (progress) => {
          const display = `${progress.toFixed(1)} %`;
          Syn2.title(display);
          this.Button.$text(`${Transl2("封裝進度")}: ${display}`);
        }).then((zip) => {
          saveAs2(zip, `${Name}.zip`);
          Syn2.title(`✓ ${Title}`);
          this.Button.$text(Transl2("下載完成"));
          setTimeout(() => {
            this.ResetButton();
          }, 3e3);
        }).catch((result) => {
          Syn2.title(Title);
          const ErrorShow = Transl2("壓縮封裝失敗");
          this.Button.$text(ErrorShow);
          Syn2.Log(ErrorShow, result, { dev: Config2.Dev, type: "error", collapsed: false });
          setTimeout(() => {
            this.Button.disabled = false;
            this.Button.$text(this.ModeDisplay);
          }, 6e3);
        });
      }
      /* 按鈕重置 */
      async ResetButton() {
        Process2.Lock = false;
        const Button2 = Syn2.$q("#Button-Container button");
        Button2.disabled = false;
        Button2.$text(`✓ ${this.ModeDisplay}`);
      }
    };
  }
  const { Transl } = (() => {
    const Matcher = Syn.TranslMatcher(Dict);
    return {
      Transl: (Str) => Matcher[Str] ?? Str
    };
  })();
  new class Main {
    constructor() {
      this.Download = null;
      this.Content = (URL2) => /^(https?:\/\/)?(www\.)?.+\/.+\/user\/.+\/post\/.+$/.test(URL2), this.Preview = (URL2) => /^(https?:\/\/)?(www\.)?.+\/posts\/?(\?.*)?$/.test(URL2) || /^(https?:\/\/)?(www\.)?.+\/.+\/user\/[^\/]+(\?.*)?$/.test(URL2) || /^(https?:\/\/)?(www\.)?.+\/dms\/?(\?.*)?$/.test(URL2);
    }
    /* 按鈕創建 */
    async ButtonCreation() {
      Syn.WaitElem(".post__body h2, .scrape__body h2", null, { raf: true, all: true, timeout: 10 }).then((Files) => {
        var _a;
        Syn.AddStyle(`
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
        (_a = Syn.$q("#Button-Container")) == null ? void 0 : _a.remove();
        try {
          Files = [...Files].filter((file) => file.$text() === "Files");
          if (Files.length == 0) return;
          const CompressMode = Syn.Local("Compression", { error: true });
          const ModeDisplay = CompressMode ? Transl("壓縮下載") : Transl("單圖下載");
          this.Download ?? (this.Download = Downloader(
            // 懶加載 Download 類
            GM_unregisterMenuCommand,
            GM_xmlhttpRequest,
            GM_download,
            Config,
            FileName,
            Process,
            Transl,
            Syn,
            saveAs
          ));
          Syn.createElement(Files[0], "span", {
            id: "Button-Container",
            on: {
              type: "click",
              listener: (event) => {
                const target = event.target;
                if (target.tagName === "BUTTON") {
                  let Instantiate = null;
                  Instantiate = new this.Download(CompressMode, ModeDisplay, target);
                  Instantiate.DownloadTrigger();
                } else if (target.closest("svg")) {
                  alert("Currently Invalid");
                }
              },
              add: { capture: true, passive: true }
            },
            innerHTML: `
                            <svg class="Setting_Button" xmlns="http://www.w3.org/2000/svg" height="1.3rem" viewBox="0 0 512 512"><path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/></svg>
                            <button class="Download_Button" ${Process.Lock ? "disabled" : ""}>${Process.Lock ? Transl("下載中鎖定") : ModeDisplay}</button>
                        `
          });
        } catch (error) {
          Syn.Log("Button Creation Failed", error, { dev: Config.Dev, type: "error", collapsed: false });
          Button.disabled = true;
          Button.$text(Transl("無法下載"));
        }
      });
    }
    /* 一鍵開啟當前所有帖子 */
    async OpenAllPages() {
      const card = Syn.$qa("article.post-card a");
      if (card.length == 0) {
        throw new Error("No links found");
      }
      let scope = prompt(`(${Transl("當前帖子數")}: ${card.length})${Transl("開帖說明")}`);
      if (scope == null) return;
      scope = scope === "" ? "1-50" : scope;
      for (const link of Syn.ScopeParsing(scope, card)) {
        GM_openInTab(link.href, {
          insert: false,
          setParent: false
        });
        await Syn.Sleep(Config.BatchOpenDelay);
      }
    }
    /* 下載模式切換 */
    async DownloadModeSwitch() {
      Syn.Local("Compression", { error: true }) ? Syn.Local("Compression", { value: false }) : Syn.Local("Compression", { value: true });
      this.ButtonCreation();
    }
    /* 檢測創建 [ 檢測頁面創建按鈕, 創建菜單 ] */
    async Init() {
      let FetchData;
      const self = this;
      GM_info.downloadMode = "browser";
      GM_info.isIncognito = true;
      registerMenu(Syn.$url);
      self.Content(Syn.$url) && self.ButtonCreation();
      async function registerMenu(Page) {
        if (self.Content(Page)) {
          Syn.Menu({
            [Transl("🔁 切換下載模式")]: { func: () => self.DownloadModeSwitch(), close: false, hotkey: "c" }
          }, { reset: true });
        } else if (self.Preview(Page)) {
          FetchData ?? (FetchData = Fetch(
            // 懶加載 FetchData 類
            Config,
            Process,
            Transl,
            Syn,
            md5
          ));
          Syn.Menu({
            [Transl("📑 獲取帖子數據")]: () => {
              if (Process.IsNeko) {
                alert("Temporarily Not Supported");
                return;
              }
              if (!Process.Lock) {
                let Instantiate = null;
                Instantiate = new FetchData(FetchSet.Delay, FetchSet.AdvancedFetch, FetchSet.ToLinkTxt);
                Instantiate.FetchInit();
              }
            },
            [Transl("📃 開啟當前頁面帖子")]: self.OpenAllPages
          }, { reset: true });
          if (Config.Dev && !Process.IsNeko) {
            Syn.Menu({
              // 不支援 Neko, 抓取邏輯不同
              "🛠️ 開發者獲取": () => {
                const ID = prompt("輸入請求的 ID");
                if (ID == null || ID === "") return;
                let Instantiate = null;
                Instantiate = new FetchData(FetchSet.Delay, FetchSet.AdvancedFetch, FetchSet.ToLinkTxt);
                Instantiate.FetchTest();
              }
            }, { index: 3 });
          }
        }
      }
      Syn.onUrlChange((change) => {
        self.Content(change.url) && self.ButtonCreation();
        registerMenu(change.url);
      });
    }
  }().Init();

})();