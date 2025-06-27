// ==UserScript==
// @name         [E/Ex-Hentai] Downloader
// @name:zh-TW   [E/Ex-Hentai] 下載器
// @name:zh-CN   [E/Ex-Hentai] 下载器
// @name:ja      [E/Ex-Hentai] ダウンローダー
// @name:ko      [E/Ex-Hentai] 다운로더
// @name:ru      [E/Ex-Hentai] Загрузчик
// @name:en      [E/Ex-Hentai] Downloader
// @version      0.0.17-Beta1
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

// @require      https://update.greasyfork.org/scripts/495339/1615053/Syntax_min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js

// @grant        window.close
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @grant        GM_addElement
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand

// @run-at       document-body
// ==/UserScript==

(function () {
    const Config = {
        Dev: true,            // 開發模式 (會顯示除錯訊息)
        ReTry: 10,            // 下載錯誤重試次數, 超過這個次數該圖片會被跳過
        Original: false,      // 是否下載原圖
        ResetScope: true,     // 下載完成後 重置範圍設置
        CompleteClose: false, // 下載完成自動關閉
    };
    const DConfig = {
        Compr_Level: 9,
        MIN_CONCURRENCY: 5,
        MAX_CONCURRENCY: 16,
        TIME_THRESHOLD: 1e3,
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
        responseHistory: [],
        networkCondition: "normal",
        lastNetworkCheck: 0,
        networkCheckInterval: 3e4,
        adaptiveFactors: {
            good: {
                delayFactor: .8,
                threadFactor: 1.2
            },
            normal: {
                delayFactor: 1,
                threadFactor: 1
            },
            poor: {
                delayFactor: 1.5,
                threadFactor: .7
            }
        },
        Scope: void 0,
        DisplayCache: void 0,
        CurrentDownloadMode: void 0,
        KeyCache: void 0,
        GetKey: function () {
            if (!this.KeyCache) this.KeyCache = `DownloadCache_${location.pathname.split("/").slice(2, 4).join("")}`;
            return this.KeyCache;
        },
        checkNetworkCondition: function () {
            const now = Date.now();
            if (now - this.lastNetworkCheck < this.networkCheckInterval) {
                return this.networkCondition;
            }
            this.lastNetworkCheck = now;
            if (navigator.connection) {
                const connection = navigator.connection;
                if (connection.effectiveType === "4g" && !connection.saveData) {
                    this.networkCondition = "good";
                } else if (connection.effectiveType === "3g" || connection.effectiveType === "4g" && connection.saveData) {
                    this.networkCondition = "normal";
                } else {
                    this.networkCondition = "poor";
                }
            } else {
                if (this.responseHistory.length >= 5) {
                    const avgResponseTime = this.responseHistory.reduce((a, b) => a + b, 0) / this.responseHistory.length;
                    if (avgResponseTime < this.TIME_THRESHOLD * .7) {
                        this.networkCondition = "good";
                    } else if (avgResponseTime > this.TIME_THRESHOLD * 1.3) {
                        this.networkCondition = "poor";
                    } else {
                        this.networkCondition = "normal";
                    }
                }
            }
            return this.networkCondition;
        },
        updateThreshold: function (newResponseTime) {
            this.responseHistory.push(newResponseTime);
            if (this.responseHistory.length > 10) {
                this.responseHistory.shift();
            }
            if (this.responseHistory.length >= 5) {
                const avg = this.responseHistory.reduce((a, b) => a + b, 0) / this.responseHistory.length;
                this.TIME_THRESHOLD = Math.max(500, Math.min(2e3, avg * 1.2));
            }
        },
        Dynamic: function (Time, Delay, Thread = null, MIN_Delay) {
            const ResponseTime = Date.now() - Time;
            this.updateThreshold(ResponseTime);
            const networkState = this.checkNetworkCondition();
            const {
                delayFactor,
                threadFactor
            } = this.adaptiveFactors[networkState];
            const ratio = ResponseTime / this.TIME_THRESHOLD;
            let delay, thread;
            if (ResponseTime > this.TIME_THRESHOLD) {
                delay = Math.min(Delay * (1 + Math.log10(ratio) * .3 * delayFactor), this.MAX_Delay);
                if (Thread != null) {
                    thread = Math.max(Thread * Math.pow(.9, ratio) * threadFactor, this.MIN_CONCURRENCY);
                    return [Math.floor(delay), Math.floor(thread)];
                } else {
                    return Math.floor(delay);
                }
            } else {
                delay = Math.max(Delay * (1 - (1 - ratio) * .2 * (1 / delayFactor)), MIN_Delay);
                if (Thread != null) {
                    thread = Math.min(Thread * (1 + (1 - ratio) * .3 * threadFactor), this.MAX_CONCURRENCY);
                    return [Math.ceil(delay), Math.ceil(thread)];
                } else {
                    return Math.ceil(delay);
                }
            }
        },
        getNetworkDiagnostics: function () {
            return {
                networkCondition: this.networkCondition,
                avgResponseTime: this.responseHistory.length > 0 ? this.responseHistory.reduce((a, b) => a + b, 0) / this.responseHistory.length : 0,
                currentThreshold: this.TIME_THRESHOLD,
                connectionInfo: navigator.connection ? {
                    effectiveType: navigator.connection.effectiveType,
                    saveData: navigator.connection.saveData,
                    rtt: navigator.connection.rtt,
                    downlink: navigator.connection.downlink
                } : "Not available"
            };
        }
    };
    function Compressor(WorkerCreation) {
        const worker = WorkerCreation(`
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
        class Compression {
            constructor() {
                this.files = {};
                this.tasks = [];
            }
            async file(name, blob) {
                const task = new Promise(async resolve => {
                    const buffer = await blob.arrayBuffer();
                    this.files[name] = new Uint8Array(buffer);
                    resolve();
                });
                this.tasks.push(task);
                return task;
            }
            estimateCompressionTime() {
                let totalSize = 0;
                Object.values(this.files).forEach(file => {
                    totalSize += file.length;
                });
                const bytesPerSecond = 60 * 1024 ** 2;
                const estimatedTime = totalSize / bytesPerSecond;
                return estimatedTime;
            }
            async generateZip(options = {}, progressCallback) {
                const updateInterval = 30;
                const totalTime = this.estimateCompressionTime();
                const progressUpdate = 100 / (totalTime * 1e3 / updateInterval);
                let fakeProgress = 0;
                const progressInterval = setInterval(() => {
                    if (fakeProgress < 99) {
                        fakeProgress = Math.min(fakeProgress + progressUpdate, 99);
                        if (progressCallback) progressCallback(fakeProgress);
                    } else {
                        clearInterval(progressInterval);
                    }
                }, updateInterval);
                await Promise.all(this.tasks);
                return new Promise((resolve, reject) => {
                    if (Object.keys(this.files).length === 0) return reject("Empty Data Error");
                    worker.postMessage({
                        files: this.files,
                        level: options.level || 5
                    }, Object.values(this.files).map(buf => buf.buffer));
                    worker.onmessage = e => {
                        clearInterval(progressInterval);
                        const {
                            error,
                            data
                        } = e.data;
                        error ? reject(error) : resolve(new Blob([data], {
                            type: "application/zip"
                        }));
                    };
                });
            }
        }
        return Compression;
    }
    const Dict = {
        Traditional: {
            "範圍設置": "下載完成後自動重置\n\n單項設置: 1. 2, 3\n範圍設置: 1~5, 6-10\n排除設置: !5, -10\n"
        },
        Simplified: {
            "🚮 清除數據緩存": "🚮 清除数据缓存",
            "🔁 切換下載模式": "🔁 切换下载模式",
            "⚙️ 下載範圍設置": "⚙️ 下载范围设置",
            "📥 強制壓縮下載": "📥 强制压缩下载",
            "⛔️ 終止下載": "⛔️ 取消下载",
            "壓縮下載": "压缩下载",
            "單圖下載": "单图下载",
            "下載中鎖定": "下载中锁定",
            "開始下載": "开始下载",
            "獲取頁面": "获取页面中",
            "獲取連結": "获取链接中",
            "下載進度": "下载进度",
            "壓縮進度": "压缩进度",
            "壓縮完成": "压缩完成",
            "壓縮失敗": "压缩失败",
            "下載完成": "下载完成",
            "清理警告": "清理提示",
            "任務配置": "任务配置",
            "取得結果": "获取结果",
            "重新取得數據": "重新获取数据",
            "確認設置範圍": "确认设置范围",
            "剩餘重載次數": "剩余重试次数",
            "下載失敗數據": "下载失败数据",
            "內頁跳轉數據": "内页跳转数据",
            "圖片連結數據": "图片链接数据",
            "等待失敗重試...": "等待失败重试...",
            "請求錯誤重新加載頁面": "请求错误，请刷新页面",
            "檢測到圖片集 !!\n\n是否反轉排序後下載 ?": "检测到图片集！\n\n是否按反向顺序下载？",
            "下載數據不完整將清除緩存, 建議刷新頁面後重載": "下载数据不完整，将清除缓存。建议刷新页面后重试",
            "找不到圖片元素, 你的 IP 可能被禁止了, 請刷新頁面重試": "找不到图片元素，您的 IP 可能被禁止。请刷新页面重试",
            "範圍設置": "下载完成后自动重置\n\n单项设置：1, 2, 3\n范围设置：1~5, 6-10\n排除设置：!5, -10\n"
        },
        Japan: {
            "🚮 清除數據緩存": "🚮 データキャッシュを削除",
            "🔁 切換下載模式": "🔁 ダウンロードモードの切り替え",
            "⚙️ 下載範圍設置": "⚙️ ダウンロード範囲設定",
            "📥 強制壓縮下載": "📥 強制圧縮ダウンロード",
            "⛔️ 終止下載": "⛔️ ダウンロードを中止",
            "壓縮下載": "圧縮ダウンロード",
            "單圖下載": "単一画像ダウンロード",
            "下載中鎖定": "ダウンロード中ロック",
            "開始下載": "ダウンロード開始",
            "獲取頁面": "ページ取得中",
            "獲取連結": "リンク取得中",
            "下載進度": "ダウンロード進捗",
            "壓縮進度": "圧縮進捗",
            "壓縮完成": "圧縮完了",
            "壓縮失敗": "圧縮失敗",
            "下載完成": "ダウンロード完了",
            "清理警告": "クリーンアップ警告",
            "任務配置": "タスク設定",
            "取得結果": "結果を取得",
            "重新取得數據": "データを再取得",
            "確認設置範圍": "範囲設定を確認",
            "剩餘重載次數": "残りの再試行回数",
            "下載失敗數據": "ダウンロード失敗データ",
            "內頁跳轉數據": "内部ページリダイレクトデータ",
            "圖片連結數據": "画像リンクデータ",
            "等待失敗重試...": "失敗の再試行を待機中...",
            "請求錯誤重新加載頁面": "リクエストエラー。ページを再読み込みしてください",
            "檢測到圖片集 !!\n\n是否反轉排序後下載 ?": "画像集が検出されました！\n\n逆順でダウンロードしますか？",
            "下載數據不完整將清除緩存, 建議刷新頁面後重載": "ダウンロードデータが不完全です。キャッシュがクリアされます。ページを更新して再度お試しください",
            "找不到圖片元素, 你的 IP 可能被禁止了, 請刷新頁面重試": "画像要素が見つかりません。IPがブロックされている可能性があります。ページを更新して再試行してください",
            "範圍設置": "ダウンロード完了後に自動リセット\n\n単一項目: 1, 2, 3\n範囲指定: 15, 6-10\n除外設定: !5, -10\n"
        },
        Korea: {
            "🚮 清除數據緩存": "🚮 데이터 캐시 삭제",
            "🔁 切換下載模式": "🔁 다운로드 모드 전환",
            "⚙️ 下載範圍設置": "⚙️ 다운로드 범위 설정",
            "📥 強制壓縮下載": "📥 강제 압축 다운로드",
            "⛔️ 終止下載": "⛔️ 다운로드 중단",
            "壓縮下載": "압축 다운로드",
            "單圖下載": "단일 이미지 다운로드",
            "下載中鎖定": "다운로드 중 잠금",
            "開始下載": "다운로드 시작",
            "獲取頁面": "페이지 가져오는 중",
            "獲取連結": "링크 가져오는 중",
            "下載進度": "다운로드 진행률",
            "壓縮進度": "압축 진행률",
            "壓縮完成": "압축 완료",
            "壓縮失敗": "압축 실패",
            "下載完成": "다운로드 완료",
            "清理警告": "정리 경고",
            "任務配置": "작업 구성",
            "取得結果": "결과 가져오기",
            "重新取得數據": "데이터 새로고침",
            "確認設置範圍": "범위 설정 확인",
            "剩餘重載次數": "남은 재시도 횟수",
            "下載失敗數據": "다운로드 실패 데이터",
            "內頁跳轉數據": "내부 페이지 이동 데이터",
            "圖片連結數據": "이미지 링크 데이터",
            "等待失敗重試...": "실패 후 재시도 대기 중...",
            "請求錯誤重新加載頁面": "요청 오류. 페이지를 다시 로드하세요",
            "檢測到圖片集 !!\n\n是否反轉排序後下載 ?": "이미지 모음이 감지되었습니다!\n\n역순으로 다운로드하시겠습니까?",
            "下載數據不完整將清除緩存, 建議刷新頁面後重載": "다운로드 데이터가 불완전합니다. 캐시가 지워집니다. 페이지를 새로고침하고 다시 시도하세요",
            "找不到圖片元素, 你的 IP 可能被禁止了, 請刷新頁面重試": "이미지 요소를 찾을 수 없습니다. IP가 차단되었을 수 있습니다. 페이지를 새로고침하고 다시 시도하세요",
            "範圍設置": "다운로드 완료 후 자동 재설정\n\n단일 항목: 1, 2, 3\n범위 지정: 15, 6-10\n제외 설정: !5, -10\n"
        },
        Russia: {
            "🚮 清除數據緩存": "🚮 Очистить кэш данных",
            "🔁 切換下載模式": "🔁 Переключить режим загрузки",
            "⚙️ 下載範圍設置": "⚙️ Настройки диапазона загрузки",
            "📥 強制壓縮下載": "📥 Принудительная сжатая загрузка",
            "⛔️ 終止下載": "⛔️ Прервать загрузку",
            "壓縮下載": "Сжатая загрузка",
            "單圖下載": "Загрузка отдельных изображений",
            "下載中鎖定": "Заблокировано во время загрузки",
            "開始下載": "Начать загрузку",
            "獲取頁面": "Получить страницу",
            "獲取連結": "Получить ссылку",
            "下載進度": "Прогресс загрузки",
            "壓縮進度": "Прогресс сжатия",
            "壓縮完成": "Сжатие завершено",
            "壓縮失敗": "Ошибка сжатия",
            "下載完成": "Загрузка завершена",
            "清理警告": "Предупреждение об очистке",
            "任務配置": "Конфигурация задачи",
            "取得結果": "Получить результаты",
            "重新取得數據": "Повторно получить данные",
            "確認設置範圍": "Подтвердить настройки диапазона",
            "剩餘重載次數": "Оставшиеся попытки перезагрузки",
            "下載失敗數據": "Данные о неудачных загрузках",
            "內頁跳轉數據": "Данные о перенаправлении внутренней страницы",
            "圖片連結數據": "Данные о ссылках на изображения",
            "等待失敗重試...": "Ожидание повторной попытки после сбоя...",
            "請求錯誤重新加載頁面": "Ошибка запроса, перезагрузите страницу",
            "檢測到圖片集 !!\n\n是否反轉排序後下載 ?": "Обнаружена коллекция изображений !!\n\nХотите изменить порядок сортировки перед загрузкой?",
            "下載數據不完整將清除緩存, 建議刷新頁面後重載": "Данные загрузки неполные, кэш будет очищен, рекомендуется обновить страницу и перезагрузить",
            "找不到圖片元素, 你的 IP 可能被禁止了, 請刷新頁面重試": "Элементы изображения не найдены, возможно, ваш IP заблокирован, пожалуйста, обновите страницу и попробуйте снова",
            "範圍設置": "Автоматический сброс после завершения загрузки\n\nНастройки отдельных элементов: 1. 2, 3\nНастройки диапазона: 1~5, 6-10\nНастройки исключения: !5, -10\n"
        },
        English: {
            "🚮 清除數據緩存": "🚮 Clear Data Cache",
            "🔁 切換下載模式": "🔁 Switch Download Mode",
            "⚙️ 下載範圍設置": "⚙️ Download Range Settings",
            "📥 強制壓縮下載": "📥 Force Compressed Download",
            "⛔️ 終止下載": "⛔️ Cancel Download",
            "壓縮下載": "Compressed Download",
            "單圖下載": "Single Image Download",
            "下載中鎖定": "Locked During Download",
            "開始下載": "Start Download",
            "獲取頁面": "Fetching Page",
            "獲取連結": "Fetching Links",
            "下載進度": "Download Progress",
            "壓縮進度": "Compression Progress",
            "壓縮完成": "Compression Complete",
            "壓縮失敗": "Compression Failed",
            "下載完成": "Download Complete",
            "清理警告": "Cleanup Warning",
            "任務配置": "Task Configuration",
            "取得結果": "Get Results",
            "重新取得數據": "Refresh Data",
            "確認設置範圍": "Confirm Range Settings",
            "剩餘重載次數": "Remaining Retry Attempts",
            "下載失敗數據": "Failed Download Data",
            "內頁跳轉數據": "Internal Page Navigation Data",
            "圖片連結數據": "Image Link Data",
            "等待失敗重試...": "Waiting for failed retry...",
            "請求錯誤重新加載頁面": "Request error. Please reload the page.",
            "檢測到圖片集 !!\n\n是否反轉排序後下載 ?": "Image collection detected!\n\nDo you want to download in reverse order?",
            "下載數據不完整將清除緩存, 建議刷新頁面後重載": "Incomplete download data. Cache will be cleared. We recommend refreshing the page and trying again.",
            "找不到圖片元素, 你的 IP 可能被禁止了, 請刷新頁面重試": "Image elements not found. Your IP may be blocked. Please refresh the page and try again.",
            "範圍設置": "Settings automatically reset after download completes.\n\nSingle items: 1, 2, 3\nRanges: 1~5, 6-10\nExclusions: !5, -10\n"
        }
    };
    (async () => {
        const Url = Syn.url.split("?p=")[0];
        const Compression = Compressor(Syn.WorkerCreation);
        let Lang, OriginalTitle, CompressMode, ModeDisplay;
        function Language() {
            const Matcher = Syn.TranslMatcher(Dict);
            return {
                Transl: Str => Matcher[Str] ?? Str
            };
        }
        class DownloadCore {
            constructor(Button) {
                this.Button = Button;
                this.ComicName = null;
                this.Worker = Syn.WorkerCreation(`
                let queue = [], processing = false;
                onmessage = function(e) {
                    queue.push(e.data);
                    !processing && (processing = true, processQueue());
                }
                async function processQueue() {
                    if (queue.length > 0) {
                        const {index, url, time, delay} = queue.shift();
                        FetchRequest(index, url, time, delay);
                        setTimeout(processQueue, delay);
                    } else {processing = false}
                }
                async function FetchRequest(index, url, time, delay) {
                    try {
                        const response = await fetch(url);
                        const html = await response.text();
                        postMessage({index, url, html, time, delay, error: false});
                    } catch {
                        postMessage({index, url, html, time, delay, error: true});
                    }
                }
            `);
                this.GetTotal = page => Math.ceil(+page[page.length - 2].$text().replace(/\D/g, "") / 20);
                this.GetHomeData();
            }
            async Reset() {
                DConfig.Scope = false;
                this.Worker.terminate();
                const Button = Syn.$q("#ExDB");
                DConfig.Lock = false;
                Button.disabled = false;
                Button.$text(`✓ ${ModeDisplay}`);
            }
            async GetHomeData() {
                const Name = Syn.NameFilter(Syn.$q("#gj").$text() || Syn.$q("#gn").$text());
                const CacheData = Syn.Session(DConfig.GetKey());
                const ImgSet = Syn.$q("#gdc .ct6");
                DConfig.CurrentDownloadMode = CompressMode;
                this.ComicName = Name;
                if (ImgSet) {
                    const yes = confirm(Lang.Transl("檢測到圖片集 !!\n\n是否反轉排序後下載 ?"));
                    yes ? DConfig.SortReverse = true : DConfig.SortReverse = false;
                }
                if (CacheData) {
                    this.StartTask(CacheData);
                    return;
                }
                const Pages = this.GetTotal(Syn.$qa("#gdd td.gdt2"));
                let Delay = DConfig.Home_ID;
                this.Worker.postMessage({
                    index: 0,
                    url: Url,
                    time: Date.now(),
                    delay: Delay
                });
                for (let index = 1; index < Pages; index++) {
                    this.Worker.postMessage({
                        index: index,
                        url: `${Url}?p=${index}`,
                        time: Date.now(),
                        delay: Delay
                    });
                }
                this.Worker.onmessage = e => {
                    const {
                        index,
                        url,
                        html,
                        time,
                        delay,
                        error
                    } = e.data;
                    Delay = DConfig.Dynamic(time, delay, null, DConfig.Home_ND);
                    error ? this.Worker.postMessage({
                        index: index,
                        url: url,
                        time: time,
                        delay: delay
                    }) : GetLink(index, Syn.DomParse(html));
                };
                const self = this;
                const HomeData = new Map();
                let Task = 0;
                function GetLink(index, page) {
                    try {
                        const Cache = [];
                        for (const link of page.$qa("#gdt a")) {
                            Cache.push(link.href);
                        }
                        HomeData.set(index, Cache);
                        DConfig.DisplayCache = `[${++Task}/${Pages}]`;
                        Syn.title(DConfig.DisplayCache);
                        self.Button.$text(`${Lang.Transl("獲取頁面")}: ${DConfig.DisplayCache}`);
                        if (Task === Pages) {
                            const Cache2 = [];
                            for (let index2 = 0; index2 < HomeData.size; index2++) {
                                Cache2.push(...HomeData.get(index2));
                            }
                            const Processed = [...new Set(Cache2)];
                            Syn.Log(Lang.Transl("內頁跳轉數據"), `${Name}
${JSON.stringify(Processed, null, 4)}`, {
                                dev: Config.Dev
                            });
                            self.GetImageData(Processed);
                        }
                    } catch (error) {
                        alert(Lang.Transl("請求錯誤重新加載頁面"));
                        location.reload();
                    }
                }
            }
            async GetImageData(JumpList) {
                const Pages = JumpList.length;
                let Delay = DConfig.Image_ID;
                let Task = 0;
                for (let index = 0; index < Pages; index++) {
                    this.Worker.postMessage({
                        index: index,
                        url: JumpList[index],
                        time: Date.now(),
                        delay: Delay
                    });
                }
                this.Worker.onmessage = e => {
                    const {
                        index,
                        url,
                        html,
                        time,
                        delay,
                        error
                    } = e.data;
                    Delay = DConfig.Dynamic(time, delay, null, DConfig.Image_ND);
                    error ? this.Worker.postMessage({
                        index: index,
                        url: url,
                        time: time,
                        delay: delay
                    }) : GetLink(index, url, Syn.DomParse(html));
                };
                const self = this;
                const ImageData = [];
                function GetLink(index, url, page) {
                    var _a;
                    try {
                        const Resample = page.querySelector("#img");
                        const Original = ((_a = page.querySelector("#i6 div:last-of-type a")) == null ? void 0 : _a.href) || "#";
                        if (!Resample) {
                            Syn.Log(null, {
                                page: page,
                                Resample: Resample,
                                Original: Original
                            }, {
                                dev: Config.Dev,
                                type: "error"
                            });
                            return;
                        }
                        const Link = Config.Original && !Original.endsWith("#") ? Original : Resample.src || Resample.href;
                        ImageData.push([index, {
                            PageUrl: url,
                            ImageUrl: Link
                        }]);
                        DConfig.DisplayCache = `[${++Task}/${Pages}]`;
                        Syn.title(DConfig.DisplayCache);
                        self.Button.$text(`${Lang.Transl("獲取連結")}: ${DConfig.DisplayCache}`);
                        if (Task === Pages) {
                            ImageData.sort((a, b) => a[0] - b[0]);
                            const Processed = new Map(ImageData);
                            Syn.Session(DConfig.GetKey(), {
                                value: Processed
                            });
                            self.StartTask(Processed);
                        }
                    } catch (error) {
                        Syn.Log(null, error, {
                            dev: Config.Dev,
                            type: "error"
                        });
                        Task++;
                    }
                }
            }
            ReGetImageData(Index, Url2) {
                function GetLink(index, url, page) {
                    var _a;
                    const Resample = page.querySelector("#img");
                    ((_a = page.querySelector("#i6 div:last-of-type a")) == null ? void 0 : _a.href) || "#";
                    if (!Resample) return false;
                    const Link = Resample.src || Resample.href;
                    return [index, url, Link];
                }
                let Token = Config.ReTry;
                return new Promise(resolve => {
                    this.Worker.postMessage({
                        index: Index,
                        url: Url2,
                        time: Date.now(),
                        delay: DConfig.Image_ID
                    });
                    this.Worker.onmessage = e => {
                        const {
                            index,
                            url,
                            html,
                            time,
                            delay,
                            error
                        } = e.data;
                        if (Token <= 0) return resolve(false);
                        if (error) {
                            this.Worker.postMessage({
                                Index: Index,
                                url: Url2,
                                time: time,
                                delay: delay
                            });
                        } else {
                            const result = GetLink(index, url, Syn.DomParse(html));
                            if (result) resolve(result); else {
                                this.Worker.postMessage({
                                    Index: Index,
                                    url: Url2,
                                    time: time,
                                    delay: delay
                                });
                            }
                        }
                        Token--;
                    };
                });
            }
            StartTask(DataMap) {
                Syn.Log(Lang.Transl("圖片連結數據"), `${this.ComicName}
${JSON.stringify([...DataMap], null, 4)}`, {
                    dev: Config.Dev
                });
                if (DConfig.Scope) {
                    DataMap = new Map(Syn.ScopeParsing(DConfig.Scope, [...DataMap]));
                }
                if (DConfig.SortReverse) {
                    const Size = DataMap.size - 1;
                    DataMap = new Map([...DataMap.entries()].map(([index, url]) => [Size - index, url]));
                }
                Syn.Log(Lang.Transl("任務配置"), {
                    ReTry: Config.ReTry,
                    Original: Config.Original,
                    ResetScope: Config.ResetScope,
                    CompleteClose: Config.CompleteClose,
                    SortReverse: DConfig.SortReverse,
                    DownloadMode: DConfig.CurrentDownloadMode,
                    CompressionLevel: DConfig.Compr_Level
                }, {
                    dev: Config.Dev
                });
                this.Button.$text(Lang.Transl("開始下載"));
                DConfig.CurrentDownloadMode ? this.PackDownload(DataMap) : this.SingleDownload(DataMap);
            }
            async PackDownload(Data) {
                const self = this;
                const Zip = new Compression();
                let Total = Data.size;
                const Fill = Syn.GetFill(Total);
                let Enforce = false;
                let ClearCache = false;
                let ReTry = Config.ReTry;
                let Task, Progress, Thread, Delay;
                function Init() {
                    Task = 0;
                    Progress = 0;
                    Delay = DConfig.Download_ID;
                    Thread = DConfig.Download_IT;
                }
                function Force() {
                    if (Total > 0) {
                        const SortData = [...Data].sort((a, b) => a[0] - b[0]);
                        SortData.splice(0, 0, {
                            ErrorPage: SortData.map(item => ++item[0]).join(",")
                        });
                        Syn.Log(Lang.Transl("下載失敗數據"), JSON.stringify(SortData, null, 4), {
                            type: "error"
                        });
                    }
                    Enforce = true;
                    Init();
                    self.Compression(Zip);
                }
                function RunClear() {
                    if (!ClearCache) {
                        ClearCache = true;
                        sessionStorage.removeItem(DConfig.GetKey());
                        Syn.Log(Lang.Transl("清理警告"), Lang.Transl("下載數據不完整將清除緩存, 建議刷新頁面後重載"), {
                            type: "warn"
                        });
                    }
                }
                function StatusUpdate(time, index, iurl, blob, error = false) {
                    if (Enforce) return;
                    [Delay, Thread] = DConfig.Dynamic(time, Delay, Thread, DConfig.Download_ND);
                    DConfig.DisplayCache = `[${++Progress}/${Total}]`;
                    self.Button && self.Button.$text(`${Lang.Transl("下載進度")}: ${DConfig.DisplayCache}`);
                    Syn.title(DConfig.DisplayCache);
                    if (!error && blob) {
                        Zip.file(`${self.ComicName}/${Syn.Mantissa(index, Fill, "0", iurl)}`, blob);
                        Data.delete(index);
                    }
                    if (Progress === Total) {
                        Total = Data.size;
                        if (Total > 0 && ReTry-- > 0) {
                            DConfig.DisplayCache = Lang.Transl("等待失敗重試...");
                            Syn.title(DConfig.DisplayCache);
                            self.Button.$text(DConfig.DisplayCache);
                            setTimeout(() => {
                                Start(Data, true);
                            }, 2e3);
                        } else Force();
                    } else if (Progress > Total) Init();
                    --Task;
                }
                function Request(Index, Iurl) {
                    if (Enforce) return;
                    ++Task;
                    let timeout = null;
                    const time = Date.now();
                    if (typeof Iurl !== "undefined") {
                        GM_xmlhttpRequest({
                            url: Iurl,
                            timeout: 15e3,
                            method: "GET",
                            responseType: "blob",
                            onload: response => {
                                clearTimeout(timeout);
                                if (response.finalUrl !== Iurl && `${response.status}`.startsWith("30")) {
                                    Request(Index, response.finalUrl);
                                } else {
                                    response.status == 200 ? StatusUpdate(time, Index, Iurl, response.response) : StatusUpdate(time, Index, Iurl, null, true);
                                }
                            },
                            onerror: () => {
                                clearTimeout(timeout);
                                StatusUpdate(time, Index, Iurl, null, true);
                            }
                        });
                    } else {
                        RunClear();
                        clearTimeout(timeout);
                        StatusUpdate(time, Index, Iurl, null, true);
                    }
                    timeout = setTimeout(() => {
                        StatusUpdate(time, Index, Iurl, null, true);
                    }, 15e3);
                }
                async function Start(DataMap, ReGet = false) {
                    if (Enforce) return;
                    Init();
                    for (const [Index, Uri] of DataMap.entries()) {
                        if (Enforce) break;
                        if (ReGet) {
                            Syn.Log(Lang.Transl("重新取得數據"), {
                                Uri: Uri.PageUrl
                            }, {
                                dev: Config.Dev
                            });
                            const Result = await self.ReGetImageData(Index, Uri.PageUrl);
                            Syn.Log(Lang.Transl("取得結果"), {
                                Result: Result
                            }, {
                                dev: Config.Dev
                            });
                            if (Result) {
                                const [Index2, Purl, Iurl] = Result;
                                Request(Index2, Iurl);
                            } else {
                                RunClear();
                                Request(Index, Uri.ImageUrl);
                            }
                        } else {
                            while (Task >= Thread) {
                                await Syn.Sleep(Delay);
                            }
                            Request(Index, Uri.ImageUrl);
                        }
                    }
                }
                Start(Data);
                GM_registerMenuCommand(Lang.Transl("📥 強制壓縮下載"), Force, {
                    id: "Enforce"
                });
            }
            async SingleDownload(Data) {
                const self = this;
                let Total = Data.size;
                const Fill = Syn.GetFill(Total);
                const TaskPromises = [];
                let Task = 0;
                let Progress = 0;
                let RetryDelay = 1e3;
                let ClearCache = false;
                let ReTry = Config.ReTry;
                let Delay = DConfig.Download_ID;
                let Thread = DConfig.Download_IT;
                function RunClear() {
                    if (!ClearCache) {
                        ClearCache = true;
                        sessionStorage.removeItem(DConfig.GetKey());
                        Syn.Log(Lang.Transl("清理警告"), Lang.Transl("下載數據不完整將清除緩存, 建議刷新頁面後重載"), {
                            type: "warn"
                        });
                    }
                }
                async function Request(Index, Purl, Iurl, Retry) {
                    return new Promise((resolve, reject) => {
                        if (typeof Iurl !== "undefined") {
                            const time = Date.now();
                            ++Task;
                            GM_download({
                                url: Iurl,
                                name: `${self.ComicName}-${Syn.Mantissa(Index, Fill, "0", Iurl)}`,
                                onload: () => {
                                    [Delay, Thread] = DConfig.Dynamic(time, Delay, Thread, DConfig.Download_ND);
                                    DConfig.DisplayCache = `[${++Progress}/${Total}]`;
                                    Syn.title(DConfig.DisplayCache);
                                    self.Button && self.Button.$text(`${Lang.Transl("下載進度")}: ${DConfig.DisplayCache}`);
                                    --Task;
                                    resolve();
                                },
                                onerror: () => {
                                    if (Retry > 0) {
                                        [Delay, Thread] = DConfig.Dynamic(time, Delay, Thread, DConfig.Download_ND);
                                        Syn.Log(null, `[Delay:${Delay}|Thread:${Thread}|Retry:${Retry}] : [${Iurl}]`, {
                                            dev: Config.Dev,
                                            type: "error"
                                        });
                                        --Task;
                                        setTimeout(() => {
                                            self.ReGetImageData(Index, Purl).then(data => {
                                                const [Index2, Purl2, Iurl2] = data;
                                                Request(Index2, Purl2, Iurl2, Retry - 1);
                                                reject();
                                            }).catch(err => {
                                                RunClear();
                                                reject();
                                            });
                                        }, RetryDelay += 1e3);
                                    } else {
                                        --Task;
                                        reject(new Error("Request error"));
                                    }
                                }
                            });
                        } else {
                            RunClear();
                            reject();
                        }
                    });
                }
                for (const [Index, Uri] of Data.entries()) {
                    while (Task >= Thread) {
                        await Syn.Sleep(Delay);
                    }
                    TaskPromises.push(Request(Index, Uri.PageUrl, Uri.ImageUrl, ReTry));
                }
                await Promise.allSettled(TaskPromises);
                this.Button.$text(Lang.Transl("下載完成"));
                this.Button = null;
                setTimeout(() => {
                    Syn.title(`✓ ${OriginalTitle}`);
                    this.Reset();
                }, 3e3);
            }
            async Compression(Zip) {
                const self = this;
                GM_unregisterMenuCommand("Enforce");
                function ErrorProcess(result) {
                    Syn.title(OriginalTitle);
                    DConfig.DisplayCache = Lang.Transl("壓縮失敗");
                    self.Button.$text(DConfig.DisplayCache);
                    Syn.Log(DConfig.DisplayCache, result, {
                        dev: Config.Dev,
                        type: "error",
                        collapsed: false
                    });
                    setTimeout(() => {
                        self.Button.disabled = false;
                        self.Button.$text(ModeDisplay);
                        self.Button = null;
                    }, 4500);
                }
                if (Object.keys(Zip.files).length == 0) {
                    ErrorProcess("無數據可壓縮");
                    return;
                }
                Zip.generateZip({
                    level: DConfig.Compr_Level
                }, progress => {
                    DConfig.DisplayCache = `${progress.toFixed(1)} %`;
                    Syn.title(DConfig.DisplayCache);
                    this.Button.$text(`${Lang.Transl("壓縮進度")}: ${DConfig.DisplayCache}`);
                }).then(zip => {
                    saveAs(zip, `${this.ComicName}.zip`);
                    Syn.title(`✓ ${OriginalTitle}`);
                    this.Button.$text(Lang.Transl("壓縮完成"));
                    this.Button = null;
                    setTimeout(() => {
                        this.Reset();
                    }, 1500);
                }).catch(result => {
                    ErrorProcess(result);
                });
            }
        }
        class ButtonCore {
            constructor() {
                this.E = /https:\/\/e-hentai\.org\/g\/\d+\/[a-zA-Z0-9]+/;
                this.Ex = /https:\/\/exhentai\.org\/g\/\d+\/[a-zA-Z0-9]+/;
                this.Allow = Uri => this.E.test(Uri) || this.Ex.test(Uri);
                this.InitStyle = () => {
                    const Position = `
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
                    const E_Style = `
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
                    const Ex_Style = `
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
                    const Style = Syn.$domain === "e-hentai.org" ? E_Style : Ex_Style;
                    Syn.AddStyle(`${Position}${Style}`, "Button-style");
                };
            }
            async DownloadModeSwitch() {
                CompressMode ? Syn.sV("CompressedMode", false) : Syn.sV("CompressedMode", true);
                Syn.$q("#ExDB").remove();
                this.ButtonCreation();
            }
            async DownloadRangeSetting() {
                let scope = prompt(Lang.Transl("範圍設置")) || false;
                if (scope) {
                    const yes = confirm(`${Lang.Transl("確認設置範圍")}:
${scope}`);
                    if (yes) DConfig.Scope = scope;
                }
            }
            async ButtonCreation() {
                Syn.WaitElem("#gd2", null, {
                    raf: true
                }).then(gd2 => {
                    CompressMode = Syn.gV("CompressedMode", []);
                    ModeDisplay = CompressMode ? Lang.Transl("壓縮下載") : Lang.Transl("單圖下載");
                    const download_button = Syn.createElement(gd2, "button", {
                        id: "ExDB",
                        class: "Download_Button",
                        disabled: DConfig.Lock ? true : false,
                        text: DConfig.Lock ? Lang.Transl("下載中鎖定") : ModeDisplay,
                        on: {
                            type: "click",
                            listener: () => {
                                DConfig.Lock = true;
                                download_button.disabled = true;
                                download_button.$text(Lang.Transl("開始下載"));
                                this.TaskInstance = new DownloadCore(download_button);
                            },
                            add: {
                                capture: true,
                                passive: true
                            }
                        }
                    });
                });
            }
            static async Init() {
                const Core = new ButtonCore();
                if (Core.Allow(Url)) {
                    Core.InitStyle();
                    OriginalTitle = Syn.title();
                    Lang = Language();
                    Core.ButtonCreation();
                    if (Syn.Session(DConfig.GetKey())) {
                        const menu = GM_registerMenuCommand(Lang.Transl("🚮 清除數據緩存"), () => {
                            sessionStorage.removeItem(DConfig.GetKey());
                            GM_unregisterMenuCommand(menu);
                        });
                    }
                    Syn.Menu({
                        [Lang.Transl("🔁 切換下載模式")]: () => Core.DownloadModeSwitch(),
                        [Lang.Transl("⚙️ 下載範圍設置")]: () => Core.DownloadRangeSetting()
                    });
                }
            }
        }
        ButtonCore.Init();
    })();
})();