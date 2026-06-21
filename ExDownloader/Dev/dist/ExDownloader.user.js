// ==UserScript==
// @name         [E/Ex-Hentai] Downloader
// @name:zh-TW   [E/Ex-Hentai] 下載器
// @name:zh-CN   [E/Ex-Hentai] 下载器
// @name:ja      [E/Ex-Hentai] ダウンローダー
// @name:ko      [E/Ex-Hentai] 다운로더
// @name:ru      [E/Ex-Hentai] Загрузчик
// @name:en      [E/Ex-Hentai] Downloader
// @version      2026.06.21-Beta
// @author       Canaan HS
// @description         漫畫頁面創建下載按鈕, 可切換 (壓縮下載 | 單圖下載), 無須複雜設置一鍵點擊下載, 自動獲取(非原圖)進行下載
// @description:zh-TW   漫畫頁面創建下載按鈕, 可切換 (壓縮下載 | 單圖下載), 無須複雜設置一鍵點擊下載, 自動獲取(非原圖)進行下載
// @description:zh-CN   漫画页面创建下载按钮, 可切换 (压缩下载 | 单图下载), 无须复杂设置一键点击下载, 自动获取(非原图)进行下载
// @description:ja      マンガページにダウンロードボタンを作成し、（圧縮ダウンロード | シングルイメージダウンロード）を切り替えることができ、複雑な設定は必要なく、ワンクリックでダウンロードできます。自動的に（オリジナルではない）画像を取得してダウンロードします
// @description:ko      만화 페이지에 다운로드 버튼을 만들어 (압축 다운로드 | 단일 이미지 다운로드)를 전환할 수 있으며, 복잡한 설정이 필요하지 않고, 원클릭 다운로드 기능으로 (원본이 아닌) 이미지를 자동으로 가져와 다운로드합니다
// @description:ru      Создание кнопок загрузки на страницах манги, переключение между (сжатой загрузкой | загрузкой отдельных изображений), без необходимости сложных настроек, возможность загрузки одним кликом, автоматически получает (неоригинальные) изображения для загрузки
// @description:en      Create download buttons on manga pages, switchable between (compressed download | single image download), without the need for complex settings, one-click download capability, automatically fetches (non-original) images for downloading

// @connect      *
// @match        *://e-hentai.org/g/*
// @match        *://exhentai.org/g/*
// @icon         https://e-hentai.org/favicon.ico

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635
// @supportURL   https://github.com/Canaan-HS/MonkeyScript/issues

// @resource     fflate https://cdn.jsdelivr.net/npm/fflate@0.8.3/umd/index.min.js

// @require      https://update.greasyfork.org/scripts/495339/1755349/Syntax_min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js

// @grant        window.close
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @grant        GM_addElement
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand

// @run-at       document-body
// ==/UserScript==

(function () {
  const Config = {
    Dev: true,
    ReTry: 10,
    Timeout: 3e4,
    UseName: false,
    Original: false,
    ResetScope: true,
    CompleteClose: false,
  };
  const DConfig = {
    Compress_Level: 9,
    MIN_CONCURRENCY: 5,
    MAX_CONCURRENCY: 16,
    MAX_Delay: 2500,
    Home_ID: 100,
    Home_ND: 80,
    Image_ID: 34,
    Image_ND: 28,
    Download_IT: 6,
    Download_ID: 600,
    Download_ND: 300,
    Lock: false,
    SortReverse: false,
    Scope: void 0,
    TitleCache: void 0,
    ModeDisplay: void 0,
    CompressMode: void 0,
    KeyCache: void 0,
    GetKey() {
      return (this.KeyCache ??= `DownloadCache_${location.pathname.split("/").slice(2, 4).join("")}`);
    },
  };
  const dict = {
    Traditional: {
      範圍設置: "下載完成後自動重置\n\n單項設置: 1. 2, 3\n範圍設置: 1~5, 6-10\n排除設置: !5, -10\n",
    },
    Simplified: {
      "🚮 清除數據緩存": "🚮 清除数据缓存",
      "🔁 切換下載模式": "🔁 切换下载模式",
      "⚙️ 下載範圍設置": "⚙️ 下载范围设置",
      "📥 強制壓縮下載": "📥 强制压缩下载",
      "⛔️ 終止下載": "⛔️ 取消下载",
      壓縮下載: "压缩下载",
      單圖下載: "单图下载",
      下載中鎖定: "下载中锁定",
      開始下載: "开始下载",
      獲取頁面: "获取页面中",
      獲取連結: "获取链接中",
      下載進度: "下载进度",
      壓縮進度: "压缩进度",
      壓縮完成: "压缩完成",
      壓縮失敗: "压缩失败",
      下載完成: "下载完成",
      清理警告: "清理提示",
      任務配置: "任务配置",
      取得結果: "获取结果",
      重新取得數據: "重新获取数据",
      確認設置範圍: "确认设置范围",
      剩餘重載次數: "剩余重试次数",
      下載失敗數據: "下载失败数据",
      內頁跳轉數據: "内页跳转数据",
      圖片連結數據: "图片链接数据",
      "等待失敗重試...": "等待失败重试...",
      請求錯誤重新加載頁面: "请求错误，请刷新页面",
      "檢測到圖片集 !!\n\n是否反轉排序後下載 ?": "检测到图片集！\n\n是否按反向顺序下载？",
      "下載數據不完整將清除緩存, 建議刷新頁面後重載": "下载数据不完整，将清除缓存。建议刷新页面后重试",
      "找不到圖片元素, 你的 IP 可能被禁止了, 請刷新頁面重試": "找不到图片元素，您的 IP 可能被禁止。请刷新页面重试",
      範圍設置: "下载完成后自动重置\n\n单项设置：1, 2, 3\n范围设置：1~5, 6-10\n排除设置：!5, -10\n",
    },
    Japan: {
      "🚮 清除數據緩存": "🚮 データキャッシュを削除",
      "🔁 切換下載模式": "🔁 ダウンロードモードの切り替え",
      "⚙️ 下載範圍設置": "⚙️ ダウンロード範囲設定",
      "📥 強制壓縮下載": "📥 強制圧縮ダウンロード",
      "⛔️ 終止下載": "⛔️ ダウンロードを中止",
      壓縮下載: "圧縮ダウンロード",
      單圖下載: "単一画像ダウンロード",
      下載中鎖定: "ダウンロード中ロック",
      開始下載: "ダウンロード開始",
      獲取頁面: "ページ取得中",
      獲取連結: "リンク取得中",
      下載進度: "ダウンロード進捗",
      壓縮進度: "圧縮進捗",
      壓縮完成: "圧縮完了",
      壓縮失敗: "圧縮失敗",
      下載完成: "ダウンロード完了",
      清理警告: "クリーンアップ警告",
      任務配置: "タスク設定",
      取得結果: "結果を取得",
      重新取得數據: "データを再取得",
      確認設置範圍: "範囲設定を確認",
      剩餘重載次數: "残りの再試行回数",
      下載失敗數據: "ダウンロード失敗データ",
      內頁跳轉數據: "内部ページリダイレクトデータ",
      圖片連結數據: "画像リンクデータ",
      "等待失敗重試...": "失敗の再試行を待機中...",
      請求錯誤重新加載頁面: "リクエストエラー。ページを再読み込みしてください",
      "檢測到圖片集 !!\n\n是否反轉排序後下載 ?": "画像集が検出されました！\n\n逆順でダウンロードしますか？",
      "下載數據不完整將清除緩存, 建議刷新頁面後重載": "ダウンロードデータが不完全です。キャッシュがクリアされます。ページを更新して再度お試しください",
      "找不到圖片元素, 你的 IP 可能被禁止了, 請刷新頁面重試": "画像要素が見つかりません。IPがブロックされている可能性があります。ページを更新して再試行してください",
      範圍設置: "ダウンロード完了後に自動リセット\n\n単一項目: 1, 2, 3\n範囲指定: 15, 6-10\n除外設定: !5, -10\n",
    },
    Korea: {
      "🚮 清除數據緩存": "🚮 데이터 캐시 삭제",
      "🔁 切換下載模式": "🔁 다운로드 모드 전환",
      "⚙️ 下載範圍設置": "⚙️ 다운로드 범위 설정",
      "📥 強制壓縮下載": "📥 강제 압축 다운로드",
      "⛔️ 終止下載": "⛔️ 다운로드 중단",
      壓縮下載: "압축 다운로드",
      單圖下載: "단일 이미지 다운로드",
      下載中鎖定: "다운로드 중 잠금",
      開始下載: "다운로드 시작",
      獲取頁面: "페이지 가져오는 중",
      獲取連結: "링크 가져오는 중",
      下載進度: "다운로드 진행률",
      壓縮進度: "압축 진행률",
      壓縮完成: "압축 완료",
      壓縮失敗: "압축 실패",
      下載完成: "다운로드 완료",
      清理警告: "정리 경고",
      任務配置: "작업 구성",
      取得結果: "결과 가져오기",
      重新取得數據: "데이터 새로고침",
      確認設置範圍: "범위 설정 확인",
      剩餘重載次數: "남은 재시도 횟수",
      下載失敗數據: "다운로드 실패 데이터",
      內頁跳轉數據: "내부 페이지 이동 데이터",
      圖片連結數據: "이미지 링크 데이터",
      "等待失敗重試...": "실패 후 재시도 대기 중...",
      請求錯誤重新加載頁面: "요청 오류. 페이지를 다시 로드하세요",
      "檢測到圖片集 !!\n\n是否反轉排序後下載 ?": "이미지 모음이 감지되었습니다!\n\n역순으로 다운로드하시겠습니까?",
      "下載數據不完整將清除緩存, 建議刷新頁面後重載": "다운로드 데이터가 불완전합니다. 캐시가 지워집니다. 페이지를 새로고침하고 다시 시도하세요",
      "找不到圖片元素, 你的 IP 可能被禁止了, 請刷新頁面重試": "이미지 요소를 찾을 수 없습니다. IP가 차단되었을 수 있습니다. 페이지를 새로고침하고 다시 시도하세요",
      範圍設置: "다운로드 완료 후 자동 재설정\n\n단일 항목: 1, 2, 3\n범위 지정: 15, 6-10\n제외 설정: !5, -10\n",
    },
    Russia: {
      "🚮 清除數據緩存": "🚮 Очистить кэш данных",
      "🔁 切換下載模式": "🔁 Переключить режим загрузки",
      "⚙️ 下載範圍設置": "⚙️ Настройки диапазона загрузки",
      "📥 強制壓縮下載": "📥 Принудительная сжатая загрузка",
      "⛔️ 終止下載": "⛔️ Прервать загрузку",
      壓縮下載: "Сжатая загрузка",
      單圖下載: "Загрузка отдельных изображений",
      下載中鎖定: "Заблокировано во время загрузки",
      開始下載: "Начать загрузку",
      獲取頁面: "Получить страницу",
      獲取連結: "Получить ссылку",
      下載進度: "Прогресс загрузки",
      壓縮進度: "Прогресс сжатия",
      壓縮完成: "Сжатие завершено",
      壓縮失敗: "Ошибка сжатия",
      下載完成: "Загрузка завершена",
      清理警告: "Предупреждение об очистке",
      任務配置: "Конфигурация задачи",
      取得結果: "Получить результаты",
      重新取得數據: "Повторно получить данные",
      確認設置範圍: "Подтвердить настройки диапазона",
      剩餘重載次數: "Оставшиеся попытки перезагрузки",
      下載失敗數據: "Данные о неудачных загрузках",
      內頁跳轉數據: "Данные о перенаправлении внутренней страницы",
      圖片連結數據: "Данные о ссылках на изображения",
      "等待失敗重試...": "Ожидание повторной попытки после сбоя...",
      請求錯誤重新加載頁面: "Ошибка запроса, перезагрузите страницу",
      "檢測到圖片集 !!\n\n是否反轉排序後下載 ?": "Обнаружена коллекция изображений !!\n\nХотите изменить порядок сортировки перед загрузкой?",
      "下載數據不完整將清除緩存, 建議刷新頁面後重載": "Данные загрузки неполные, кэш будет очищен, рекомендуется обновить страницу и перезагрузить",
      "找不到圖片元素, 你的 IP 可能被禁止了, 請刷新頁面重試": "Элементы изображения не найдены, возможно, ваш IP заблокирован, пожалуйста, обновите страницу и попробуйте снова",
      範圍設置: "Автоматический сброс после завершения загрузки\n\nНастройки отдельных элементов: 1. 2, 3\nНастройки диапазона: 1~5, 6-10\nНастройки исключения: !5, -10\n",
    },
    English: {
      "🚮 清除數據緩存": "🚮 Clear Data Cache",
      "🔁 切換下載模式": "🔁 Switch Download Mode",
      "⚙️ 下載範圍設置": "⚙️ Download Range Settings",
      "📥 強制壓縮下載": "📥 Force Compressed Download",
      "⛔️ 終止下載": "⛔️ Cancel Download",
      壓縮下載: "Compressed Download",
      單圖下載: "Single Image Download",
      下載中鎖定: "Locked During Download",
      開始下載: "Start Download",
      獲取頁面: "Fetching Page",
      獲取連結: "Fetching Links",
      下載進度: "Download Progress",
      壓縮進度: "Compression Progress",
      壓縮完成: "Compression Complete",
      壓縮失敗: "Compression Failed",
      下載完成: "Download Complete",
      清理警告: "Cleanup Warning",
      任務配置: "Task Configuration",
      取得結果: "Get Results",
      重新取得數據: "Refresh Data",
      確認設置範圍: "Confirm Range Settings",
      剩餘重載次數: "Remaining Retry Attempts",
      下載失敗數據: "Failed Download Data",
      內頁跳轉數據: "Internal Page Navigation Data",
      圖片連結數據: "Image Link Data",
      "等待失敗重試...": "Waiting for failed retry...",
      請求錯誤重新加載頁面: "Request error. Please reload the page.",
      "檢測到圖片集 !!\n\n是否反轉排序後下載 ?": "Image collection detected!\n\nDo you want to download in reverse order?",
      "下載數據不完整將清除緩存, 建議刷新頁面後重載": "Incomplete download data. Cache will be cleared. We recommend refreshing the page and trying again.",
      "找不到圖片元素, 你的 IP 可能被禁止了, 請刷新頁面重試": "Image elements not found. Your IP may be blocked. Please refresh the page and try again.",
      範圍設置: "Settings automatically reset after download completes.\n\nSingle items: 1, 2, 3\nRanges: 1~5, 6-10\nExclusions: !5, -10\n",
    },
  };
  const { Transl } = (() => {
    const Matcher = Lib.translMatcher(dict);
    return {
      Transl: (Str) => Matcher[Str] ?? Str,
    };
  })();
  function Downloader() {
    const zipper = Lib.createZip(GM_getResourceText("fflate"));
    const dynamicParam = Lib.createNetworkObserver({
      MAX_Delay: DConfig.MAX_Delay,
      MIN_CONCURRENCY: DConfig.MIN_CONCURRENCY,
      MAX_CONCURRENCY: DConfig.MAX_CONCURRENCY,
      Good_Network_THRESHOLD: 500,
      Poor_Network_THRESHOLD: 1500,
    });
    const getTotal = (page) => Math.ceil(+page[page.length - 2].$text().replace(/\D/g, "") / 20);
    let cleanCache = false;
    const modifyCache = (data) => {
      const cacheData = Lib.getSession(DConfig.GetKey());
      if (!cacheData) return;
      cacheData[data.Index] = data;
      Lib.setSession(DConfig.GetKey(), cacheData);
    };
    const clearCache = () => {
      if (cleanCache) return;
      cleanCache = true;
      Lib.delSession(DConfig.GetKey());
      Lib.log(Transl("下載數據不完整將清除緩存, 建議刷新頁面後重載"), { group: Transl("清理警告") }).warn;
    };
    return (url, button) => {
      let comicName = null;
      cleanCache = false;
      const worker = Lib.createWorker(`
            let queue = [], processing = false;
            onmessage = function(e) {
                queue.push(e.data);
                !processing && (processing = true, processQueue());
            }
            function processQueue() {
                if (queue.length > 0) {
                    const {index, url, name, time, delay} = queue.shift();
                    FetchRequest(index, url, name, time, delay);
                    setTimeout(processQueue, delay);
                } else { processing = false }
            }
            async function FetchRequest(index, url, name, time, delay) {
                try {
                    const response = await fetch(url);
                    const html = await response.text();
                    postMessage({index, url, name, html, time, delay, error: false});
                } catch {
                    postMessage({index, url, name, html: null, time, delay, error: true});
                }
            }
        `);
      function reset() {
        Config.CompleteClose && window.close();
        Config.ResetScope && (DConfig.Scope = void 0);
        worker.terminate();
        button = Lib.$q("#ExDB");
        button.disabled = false;
        button.$text(`✓ ${DConfig.ModeDisplay}`);
        DConfig.Lock = false;
      }
      (function getHomeData() {
        comicName = Lib.nameFilter(Lib.$q("#gj").$text() || Lib.$q("#gn").$text());
        const ct6 = Lib.$q("#gdc .ct6");
        const cacheData = Lib.getSession(DConfig.GetKey());
        if (ct6) {
          const yes = confirm(Transl("檢測到圖片集 !!\n\n是否反轉排序後下載 ?"));
          DConfig.SortReverse = yes ? true : false;
        }
        if (cacheData) {
          startTask(cacheData);
          return;
        }
        const pages = getTotal(Lib.$qa("#gdd td.gdt2"));
        worker.onmessage = (e) => {
          const { index, url: url2, html, time, delay: delay2, error } = e.data;
          error
            ? worker.postMessage({
                index,
                url: url2,
                time,
                delay: dynamicParam(time, delay2, null, DConfig.Home_ND),
              })
            : processUpdate(index, Lib.domParse(html));
        };
        const delay = DConfig.Home_ID;
        worker.postMessage({ index: 0, url, time: Date.now(), delay });
        for (let index = 1; index < pages; index++) {
          worker.postMessage({ index, url: `${url}?p=${index}`, time: Date.now(), delay });
        }
        let task = 0;
        let processed = new Set();
        const homeData = new Map();
        function processUpdate(index, dom) {
          try {
            const box = [];
            const nameRegex = /[a-z0-9_\-\+]+/gi;
            for (const link of dom.$qa("#gdt a")) {
              const url2 = link.href;
              if (processed.has(url2)) continue;
              processed.add(url2);
              const matchName = Config.UseName ? link.$q("div[title]").title?.match(nameRegex) : "";
              box.push({ url: url2, name: matchName?.[2] ? matchName[2] : "" });
            }
            homeData.set(index, box);
            const display = `[${++task}/${pages}]`;
            Lib.title(display);
            button.$text(`${Transl("獲取頁面")}: ${display}`);
            if (task === pages) {
              const box2 = [];
              for (let index2 = 0; index2 < homeData.size; index2++) {
                box2.push(...homeData.get(index2));
              }
              homeData.clear();
              processed.clear();
              Lib.log(
                `${comicName}
${JSON.stringify(box2, null, 4)}`,
                {
                  dev: Config.Dev,
                  group: Transl("內頁跳轉數據"),
                },
              );
              getImageData(box2);
            }
          } catch (error) {
            alert(Transl("請求錯誤重新加載頁面"));
            location.reload();
          }
        }
      })();
      function parseImgData(index, url2, name, dom) {
        const resample = Lib.$Q(dom, "#img");
        const original = Lib.$Q(dom, "#i6 div:last-of-type a")?.href || "#";
        if (!resample)
          return {
            PageUrl: url2,
            ResampleUrl: resample,
            OriginalUrl: original,
          };
        const link = Config.Original && !original.endsWith("#") ? original : resample.src || resample.href;
        return { Index: index, Name: name, PageUrl: url2, ImgUrl: link };
      }
      function getImageData(homeDataList) {
        const pages = homeDataList.length;
        worker.onmessage = (e) => {
          const { index, url: url2, name, html, time, delay, error } = e.data;
          error
            ? worker.postMessage({
                index,
                url: url2,
                name,
                time,
                delay: dynamicParam(time, delay, null, DConfig.Image_ND),
              })
            : processUpdate(index, url2, name, Lib.domParse(html));
        };
        for (const [index, { url: url2, name }] of homeDataList.entries()) {
          worker.postMessage({ index, url: url2, name, time: Date.now(), delay: DConfig.Image_ID });
        }
        let task = 0;
        const imgData = [];
        function processUpdate(index, url2, name, dom) {
          try {
            const data = parseImgData(index, url2, name, dom);
            if (!data.ImgUrl) {
              Lib.log(data, { dev: Config.Dev }).error;
              throw new Error("Image not found");
            }
            imgData.push(data);
            const display = `[${++task}/${pages}]`;
            Lib.title(display);
            button.$text(`${Transl("獲取連結")}: ${display}`);
            if (task === pages) {
              imgData.sort((a, b) => a.Index - b.Index);
              Lib.setSession(DConfig.GetKey(), imgData);
              startTask(imgData);
            }
          } catch (error) {
            Lib.log(error, { dev: Config.Dev }).error;
            task++;
          }
        }
      }
      function reGetImageData(index, name, url2) {
        let token = Config.ReTry;
        return new Promise((resolve) => {
          worker.onmessage = (e) => {
            const { index: index2, url: url3, name: name2, html, time, delay, error } = e.data;
            if (token <= 0) return resolve(false);
            if (error) {
              worker.postMessage({ index: index2, url: url3, name: name2, time, delay });
            } else {
              const data = parseImgData(index2, url3, name2, Lib.domParse(html));
              if (data.ImgUrl) {
                modifyCache(data);
                resolve(data);
              } else {
                worker.postMessage({ index: index2, url: url3, name: name2, time, delay });
              }
            }
            token--;
          };
          worker.postMessage({ index, url: url2, name, time: Date.now(), delay: DConfig.Image_ID });
        });
      }
      function startTask(dataList) {
        Lib.log(
          `${comicName}
${JSON.stringify(dataList, null, 4)}`,
          { dev: Config.Dev, group: Transl("圖片連結數據") },
        );
        if (DConfig.Scope) {
          dataList = Lib.scopeParse(DConfig.Scope, dataList);
        }
        if (DConfig.SortReverse) {
          const size = dataList.length - 1;
          dataList = dataList.map((data, index) => ({ ...data, Index: size - index }));
        }
        const dataMap = new Map(dataList.map((data) => [data.Index, data]));
        button.$text(Transl("開始下載"));
        Lib.log(
          {
            ...Config,
            SortReverse: DConfig.SortReverse,
            CompressMode: DConfig.CompressMode ?? false,
            CompressionLevel: DConfig.Compress_Level,
            DownloadData: dataMap,
          },
          { dev: Config.Dev, group: Transl("任務配置") },
        );
        DConfig.CompressMode ? packDownload(dataMap) : singleDownload(dataMap);
      }
      function packDownload(dataMap) {
        let totalSize = dataMap.size;
        const fillValue = Lib.getFill(totalSize);
        let enforce = false;
        let reTry = Config.ReTry;
        let task, progress, $thread, $delay;
        function init() {
          task = 0;
          progress = 0;
          $delay = DConfig.Download_ID;
          $thread = DConfig.Download_IT;
        }
        function force() {
          if (totalSize > 0) {
            const sortData = [...dataMap].sort((a, b) => a.Index - b.Index);
            sortData.splice(0, 0, { ErrorPage: sortData.map(([_, value]) => value.Index + 1).join(",") });
            Lib.log(JSON.stringify(sortData, null, 4), { group: Transl("下載失敗數據") }).error;
          }
          enforce = true;
          init();
          compressFile();
        }
        function processUpdate(time, index, name, iurl, blob, error = false) {
          if (enforce) return;
          [$delay, $thread] = dynamicParam(time, $delay, $thread, DConfig.Download_ND);
          const display = `[${Math.min(++progress, totalSize)}/${totalSize}]`;
          button?.$text(`${Transl("下載進度")}: ${display}`);
          Lib.title(display);
          if (!error && blob) {
            zipper.file(`${comicName}/${name ? `${name}.${Lib.suffixName(iurl)}` : Lib.mantissa(index, fillValue, "0", iurl)}`, blob);
            dataMap.delete(index);
          }
          if (progress === totalSize) {
            totalSize = dataMap.size;
            if (totalSize > 0 && reTry-- > 0) {
              const display2 = Transl("等待失敗重試...");
              Lib.title(display2);
              button.$text(display2);
              setTimeout(() => {
                start(dataMap);
              }, 2e3);
            } else force();
          }
          --task;
        }
        function request(index, name, iurl) {
          if (enforce) return;
          ++task;
          let timeout = null,
            gmRequest = null,
            pass = false;
          const time = Date.now();
          if (typeof iurl !== "undefined") {
            gmRequest = GM_xmlhttpRequest({
              url: iurl,
              timeout: Config.Timeout,
              method: "GET",
              responseType: "blob",
              onload: (response) => {
                clearTimeout(timeout);
                if (response.finalUrl !== iurl && `${response.status}`.startsWith("30")) {
                  return request(index, name, response.finalUrl);
                }
                if (response.status === 200) {
                  const headers = response.responseHeaders;
                  const contentTypeMatch = headers.match(/content-type:\s*([^\r\n]+)/i);
                  if (contentTypeMatch) {
                    const contentType = contentTypeMatch[1].toLowerCase();
                    pass = contentType.includes("image") ? true : false;
                  } else {
                    pass = true;
                  }
                }
                pass ? processUpdate(time, index, name, iurl, response.response) : processUpdate(time, index, name, iurl, null, true);
              },
              onerror: () => {
                clearTimeout(timeout);
                processUpdate(time, index, name, iurl, null, true);
              },
            });
          } else {
            clearCache();
            clearTimeout(timeout);
            processUpdate(time, index, name, iurl, null, true);
          }
          timeout = setTimeout(() => {
            gmRequest?.abort();
            processUpdate(time, index, name, iurl, null, true);
          }, Config.Timeout);
        }
        async function start(reGet = false) {
          if (enforce) return;
          init();
          for (const { Index, Name, PageUrl, ImgUrl } of dataMap.values()) {
            if (enforce) break;
            if (reGet) {
              Lib.log(PageUrl, { dev: Config.Dev, group: `${Transl("重新取得數據")} (${reTry})` });
              const result = await reGetImageData(Index, Name, PageUrl);
              Lib.log(result, { dev: Config.Dev, group: `${Transl("取得結果")} (${reTry})` });
              if (result) {
                const { Index: Index2, Name: Name2, ImgUrl: ImgUrl2 } = result;
                request(Index2, Name2, ImgUrl2);
              } else {
                clearCache();
                request(Index, Name, ImgUrl);
              }
            } else {
              while (task >= $thread) {
                await Lib.sleep($delay);
              }
              request(Index, Name, ImgUrl);
            }
          }
        }
        start();
        Lib.regMenu(
          {
            [Transl("📥 強制壓縮下載")]: () => force(),
          },
          { name: "Enforce" },
        );
      }
      function compressFile() {
        Lib.unMenu("Enforce-1");
        zipper
          .generateZip(
            {
              level: DConfig.Compress_Level,
            },
            (progress) => {
              const display = `${progress.toFixed(1)} %`;
              Lib.title(display);
              button.$text(`${Transl("壓縮進度")}: ${display}`);
            },
          )
          .then((zip) => {
            saveAs(zip, `${comicName}.zip`);
            Lib.title(`✓ ${DConfig.TitleCache}`);
            button.$text(Transl("壓縮完成"));
            button = null;
            setTimeout(() => {
              reset();
            }, 1500);
          })
          .catch((result) => {
            Lib.title(DConfig.TitleCache);
            const display = Transl("壓縮失敗");
            button.$text(display);
            Lib.log(result, { dev: Config.Dev, group: display, collapsed: false }).error;
            setTimeout(() => {
              button.disabled = false;
              button.$text(DConfig.ModeDisplay);
              button = null;
            }, 4500);
          });
      }
      async function singleDownload(dataMap) {
        let totalSize = dataMap.size;
        const fillValue = Lib.getFill(totalSize);
        const taskPromises = [];
        let task = 0;
        let progress = 0;
        let retryDelay = 1e3;
        let reTry = Config.ReTry;
        let $delay = DConfig.Download_ID;
        let $thread = DConfig.Download_IT;
        function request(index, name, purl, iurl, retry) {
          return new Promise((resolve, reject) => {
            if (typeof iurl !== "undefined") {
              const time = Date.now();
              ++task;
              GM_download({
                url: iurl,
                name: `${comicName} - ${Config.UseName ? `${name}.${Lib.suffixName(iurl)}` : Lib.mantissa(index, fillValue, "0", iurl)}`,
                onload: () => {
                  [$delay, $thread] = dynamicParam(time, $delay, $thread, DConfig.Download_ND);
                  const display = `[${++progress}/${totalSize}]`;
                  Lib.title(display);
                  button?.$text(`${Transl("下載進度")}: ${display}`);
                  --task;
                  resolve();
                },
                onerror: () => {
                  if (retry > 0) {
                    [$delay, $thread] = dynamicParam(time, $delay, $thread, DConfig.Download_ND);
                    Lib.log(`[Delay:${$delay}|Thread:${$thread}|Retry:${retry}] : [${iurl}]`, { dev: Config.Dev }).error;
                    --task;
                    setTimeout(
                      () => {
                        reGetImageData(index, name, purl)
                          .then(({ Index, Name, PageUrl, ImgUrl }) => {
                            request(Index, Name, PageUrl, ImgUrl, retry - 1);
                            reject();
                          })
                          .catch((err) => {
                            clearCache();
                            reject();
                          });
                      },
                      (retryDelay += 1e3),
                    );
                  } else {
                    --task;
                    reject(new Error("request error"));
                  }
                },
              });
            } else {
              clearCache();
              reject();
            }
          });
        }
        for (const { Index, Name, PageUrl, ImgUrl } of dataMap.values()) {
          while (task >= $thread) {
            await Lib.sleep($delay);
          }
          taskPromises.push(request(Index, Name, PageUrl, ImgUrl, reTry));
        }
        await Promise.allSettled(taskPromises);
        button.$text(Transl("下載完成"));
        button = null;
        setTimeout(() => {
          Lib.title(`✓ ${DConfig.TitleCache}`);
          reset();
        }, 3e3);
      }
    };
  }
  function Main() {
    const eRegex = /https:\/\/e-hentai\.org\/g\/\d+\/[a-zA-Z0-9]+/;
    const exRegex = /https:\/\/exhentai\.org\/g\/\d+\/[a-zA-Z0-9]+/;
    let Download, downloadButton;
    let Url = Lib.url.split("?p=")[0];
    async function initStyle() {
      const position = `
            .Download_Button {
                float: right;
                width: 12rem;
                cursor: pointer;
                font-weight: 800;
                line-height: 20px;
                border-radius: 5px;
                position: relative;
                padding: 5px 5px;
                font-family: arial, helvetica, sans-serif;
            }
        `;
      const eStyle = `
            .Download_Button {
                color: #5C0D12;
                border: 2px solid #9a7c7e;
                background-color: #EDEADA;
            }
            .Download_Button:hover {
                color: #8f4701;
                border: 2px dashed #B5A4A4;
            }
            .Download_Button:disabled {
                color: #B5A4A4;
                border: 2px dashed #B5A4A4;
                cursor: default;
            }
        `;
      const exStyle = `
            .Download_Button {
                color: #b3b3b3;
                border: 2px solid #34353b;
                background-color: #2c2b2b;
            }
            .Download_Button:hover {
                color: #f1f1f1;
                border: 2px dashed #4f535b;
            }
            .Download_Button:disabled {
                color: #4f535b;
                border: 2px dashed #4f535b;
                cursor: default;
            }
        `;
      const style = Lib.$domain === "e-hentai.org" ? eStyle : exStyle;
      Lib.addStyle(`${position}${style}`, "Downloader-Button-Style");
    }
    async function downloadRangeSetting() {
      const scope = prompt(Transl("範圍設置"));
      if (scope == null) return;
      const yes = confirm(`${Transl("確認設置範圍")}:
${scope}`);
      if (yes) DConfig.Scope = scope;
    }
    async function downloadModeSwitch() {
      if (DConfig.Lock) {
        alert(Transl("下載中鎖定"));
        return;
      }
      DConfig.CompressMode ? Lib.setV("CompressedMode", false) : Lib.setV("CompressedMode", true);
      downloadButton?.remove();
      buttonCreation();
    }
    async function buttonCreation() {
      Lib.waitEl("#gd2", null, { raf: true }).then((gd2) => {
        DConfig.CompressMode = Lib.getV("CompressedMode", true);
        DConfig.ModeDisplay = DConfig.CompressMode ? Transl("壓縮下載") : Transl("單圖下載");
        downloadButton = Lib.createElement(gd2, "button", {
          id: "ExDB",
          class: "Download_Button",
          text: DConfig.ModeDisplay,
          on: {
            click: () => {
              Download ??= Downloader();
              DConfig.Lock = true;
              downloadButton.disabled = true;
              downloadButton.$text(Transl("開始下載"));
              Download(Url, downloadButton);
            },
          },
        });
      });
    }
    if (eRegex.test(Url) || exRegex.test(Url)) {
      initStyle();
      DConfig.TitleCache = Lib.title();
      buttonCreation();
      if (Lib.getSession(DConfig.GetKey())) {
        Lib.regMenu(
          {
            [Transl("🚮 清除數據緩存")]: () => {
              Lib.delSession(DConfig.GetKey());
              Lib.unMenu("ClearCache-1");
            },
          },
          { name: "ClearCache" },
        );
      }
      Lib.regMenu({
        [Transl("🔁 切換下載模式")]: () => downloadModeSwitch(),
        [Transl("⚙️ 下載範圍設置")]: () => downloadRangeSetting(),
      });
    }
  }
  Main();
})();