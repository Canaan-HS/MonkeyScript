// ==UserScript==
// @name                Twitch Auto Drops Claim
// @name:zh-TW          Twitch 自動領取掉寶
// @name:zh-CN          Twitch 自动领取掉宝
// @name:en             Twitch Auto Drops Claim
// @name:ja             Twitch 自動ドロップ受け取り
// @name:ko             Twitch 자동 드롭 수령
// @name:ru             Twitch Автоматическое получение дропов
// @version             2025.09.04-Beta
// @author              Canaan HS
// @description         Twitch 自動領取 (掉寶/Drops) , 窗口標籤顯示進度 , 直播結束時還沒領完 , 會自動尋找任意掉寶直播 , 並開啟後繼續掛機 , 代碼自訂義設置
// @description:zh-TW   Twitch 自動領取 (掉寶/Drops) , 窗口標籤顯示進度 , 直播結束時還沒領完 , 會自動尋找任意掉寶直播 , 並開啟後繼續掛機 , 代碼自訂義設置
// @description:zh-CN   Twitch 自动领取 (掉宝/Drops) , 窗口标签显示进度 , 直播结束时还没领完 , 会自动寻找任意掉宝直播 , 并开启后继续挂机 , 代码自定义设置
// @description:en      Automatically claim Twitch Drops, display progress in the tab, and if not finished when the stream ends, it will automatically find another Drops-enabled stream and continue farming. Customizable settings in the code.
// @description:ja      Twitch のドロップを自動的に受け取り、タブに進捗狀況を表示し、ストリーム終了時にまだ受け取っていない場合、自動的に別のドロップ有効なストリームを検索し、収穫を続けます。コードでのカスタマイズ可能な設定
// @description:ko      Twitch 드롭을 자동으로 받아오고 탭에 진행 상황을 표시하며, 스트림이 종료되었을 때 아직 완료되지 않았다면 자동으로 다른 드롭 활성 스트림을 찾아 계속 수집합니다. 코드에서 사용자 정의 설정 가능합니다
// @description:ru      Автоматически получает дропы Twitch, отображает прогресс во вкладке, и если дропы не завершены к концу трансляции, автоматически находит другую трансляцию с активированными дропами и продолжает фарминг. Настраиваемые параметры в коде.

// @match        https://www.twitch.tv/drops/inventory
// @supportURL   https://github.com/Canaan-HS/MonkeyScript/issues
// @icon         https://cdn-icons-png.flaticon.com/512/8214/8214044.png

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635

// @grant        window.close
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand

// @run-at       document-body
// ==/UserScript==

(() => {
    const Backup = GM_getValue("Config", {}); // 不額外做數據驗證

    const Config = {
        Dev: false, // 開發打印

        RestartLive: true, // 使用重啟直播
        EndAutoClose: true, // 全部進度完成後自動關閉
        TryStayActive: true, // 嘗試讓頁面保持活躍
        RestartLiveMute: true, // 重啟的直播靜音
        RestartLowQuality: false, // 重啟直播最低畫質

        UpdateDisplay: true, // 於標題展示更新倒數
        ClearExpiration: true, // 清除過期的掉寶進度
        ProgressDisplay: true, // 於標題展示掉寶進度

        UpdateInterval: 120, // (seconds) 更新進度狀態的間隔
        JudgmentInterval: 6, // (Minute) 經過多長時間進度無增加, 就重啟直播 [設置太短會可能誤檢測]

        FindTag: ["drops", "啟用掉寶", "启用掉宝", "드롭활성화됨"], // 查找直播標籤, 只要有包含該字串即可
        ...Backup
    };

    /* 檢測邏輯 */
    class Detection {
        constructor() {
            /* 解析進度(找到 < 100 的最大值) */
            this.progressParse = progress => progress.sort((a, b) => b - a).find(number => number < 1e2);

            /* 獲取當前時間 */
            this.getTime = () => {
                const time = this.currentTime;
                const year = time.getFullYear();
                const month = `${time.getMonth() + 1}`.padStart(2, "0");
                const date = `${time.getDate()}`.padStart(2, "0");
                const hour = `${time.getHours()}`.padStart(2, "0");
                const minute = `${time.getMinutes()}`.padStart(2, "0");
                const second = `${time.getSeconds()}`.padStart(2, "0");
                return `${year}-${month}-${date} ${hour}:${minute}:${second}`;
            };

            /* 保存數據 */
            this.storage = (key, value = null) => {
                let data,
                    Formula = {
                        Type: (parse) => Object.prototype.toString.call(parse).slice(8, -1),
                        Number: (parse) => parse ? Number(parse) : (sessionStorage.setItem(key, JSON.stringify(value)), 1),
                        Array: (parse) => parse ? JSON.parse(parse) : (sessionStorage.setItem(key, JSON.stringify(value)), 1),
                        Object: (parse) => parse ? JSON.parse(parse) : (sessionStorage.setItem(key, JSON.stringify(value)), 1),
                    };
                return value != null
                    ? Formula[Formula.Type(value)]()
                    : (data = sessionStorage.getItem(key), data != undefined ? Formula[Formula.Type(JSON.parse(data))](data) : data);
            };

            /* 語言 時間格式 適配器 */
            this.adapter = {
                _convertPM: (time) => time.replace(/(\d{1,2}):(\d{2})/, (_, hours, minutes) => `${+hours + 12}:${minutes}`), // 轉換 24 小時制
                "en-US": (timeStamp, currentYear) => new Date(`${timeStamp} ${currentYear}`), // English
                "en-GB": (timeStamp, currentYear) => new Date(`${timeStamp} ${currentYear}`), // English - UK
                "es-ES": (timeStamp, currentYear) => new Date(`${timeStamp} ${currentYear}`), // Español - España
                "fr-FR": (timeStamp, currentYear) => new Date(`${timeStamp} ${currentYear}`), // Français
                "pt-PT": (timeStamp, currentYear) => { // Português
                    const convert = timeStamp.replace(/(\d{1,2})\/(\d{1,2})/, (_, day, month) => `${month}/${day}`);
                    return new Date(`${convert} ${currentYear}`);
                },
                "pt-BR": (timeStamp, currentYear) => { // Português - Brasil
                    const ISO = {
                        'jan': 'Jan', 'fev': 'Feb', 'mar': 'Mar', 'abr': 'Apr',
                        'mai': 'May', 'jun': 'Jun', 'jul': 'Jul', 'ago': 'Aug',
                        'set': 'Sep', 'out': 'Oct', 'nov': 'Nov', 'dez': 'Dec',
                        'dom': 'Sun', 'seg': 'Mon', 'ter': 'Tue', 'qua': 'Wed',
                        'qui': 'Thu', 'sex': 'Fri', 'sáb': 'Sat'
                    };
                    const convert = timeStamp
                        .replace(/de/g, "")
                        .replace(
                            /(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|dom|seg|ter|qua|qui|sex|sáb)/gi,
                            (match) => ISO[match.toLowerCase()]
                        );
                    return new Date(`${convert} ${currentYear}`);
                },
                "ru-RU": (timeStamp, currentYear) => { // Русский
                    const ISO = {
                        'янв': 'Jan', 'фев': 'Feb', 'мар': 'Mar', 'апр': 'Apr',
                        'май': 'May', 'июн': 'Jun', 'июл': 'Jul', 'авг': 'Aug',
                        'сен': 'Sep', 'окт': 'Oct', 'ноя': 'Nov', 'дек': 'Dec',
                        'пн': 'Mon', 'вт': 'Tue', 'ср': 'Wed', 'чт': 'Thu',
                        'пт': 'Fri', 'сб': 'Sat', 'вс': 'Sun'
                    };
                    const convert = timeStamp.replace(
                        /(янв|фев|мар|апр|май|июн|июл|авг|сен|окт|ноя|дек|пн|вт|ср|чт|пт|сб|вс)/gi,
                        (match) => ISO[match.toLowerCase()]
                    );
                    return new Date(`${convert} ${currentYear}`);
                },
                "de-DE": (timeStamp, currentYear) => { // Deutsch
                    const ISO = {
                        'jan': 'Jan', 'feb': 'Feb', 'mär': 'Mar', 'apr': 'Apr',
                        'mai': 'May', 'jun': 'Jun', 'jul': 'Jul', 'aug': 'Aug',
                        'sep': 'Sep', 'okt': 'Oct', 'nov': 'Nov', 'dez': 'Dec',
                        'mo': 'Mon', 'di': 'Tue', 'mi': 'Wed', 'do': 'Thu',
                        'fr': 'Fri', 'sa': 'Sat', 'so': 'Sun'
                    };
                    const convert = timeStamp.replace(
                        /(jan|feb|mär|apr|mai|jun|jul|aug|sep|okt|nov|dez|mo|di|mi|do|fr|sa|so)/gi,
                        (match) => ISO[match.toLowerCase()]
                    );
                    return new Date(`${convert} ${currentYear}`);
                },
                "it-IT": (timeStamp, currentYear) => { // Italiano
                    const ISO = {
                        'gen': 'Jan', 'feb': 'Feb', 'mar': 'Mar', 'apr': 'Apr',
                        'mag': 'May', 'giu': 'Jun', 'lug': 'Jul', 'ago': 'Aug',
                        'set': 'Sep', 'ott': 'Oct', 'nov': 'Nov', 'dic': 'Dec',
                        'dom': 'Sun', 'lun': 'Mon', 'mar': 'Tue', 'mer': 'Wed',
                        'gio': 'Thu', 'ven': 'Fri', 'sab': 'Sat'
                    };
                    const convert = timeStamp.replace(
                        /(gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic|dom|lun|mar|mer|gio|ven|sab)/gi,
                        (match) => ISO[match.toLowerCase()]
                    );
                    return new Date(`${convert} ${currentYear}`);
                },
                "tr-TR": (timeStamp, currentYear) => { // Türkçe
                    const ISO = {
                        'oca': 'Jan', 'şub': 'Feb', 'mar': 'Mar', 'nis': 'Apr',
                        'may': 'May', 'haz': 'Jun', 'tem': 'Jul', 'ağu': 'Aug',
                        'eyl': 'Sep', 'eki': 'Oct', 'kas': 'Nov', 'ara': 'Dec',
                        'paz': 'Sun', 'pts': 'Mon', 'sal': 'Tue', 'çar': 'Wed',
                        'per': 'Thu', 'cum': 'Fri', 'cmt': 'Sat'
                    };
                    const convert = timeStamp.replace(
                        /(oca|şub|mar|nis|may|haz|tem|ağu|eyl|eki|kas|ara|paz|pts|sal|çar|per|cum|cmt)/gi,
                        (match) => ISO[match.toLowerCase()]
                    );
                    const match = convert.match(/(\d{1,2}) ([a-z]+) ([a-z]+) (\d{1,2}:\d{1,2}) (GMT[+-]\d{1,2})/i);
                    return new Date(`${match[3]} ${match[1]} ${match[2]} ${match[4]} ${match[5]} ${currentYear}`);
                },
                "es-MX": (timeStamp, currentYear) => { // Español - Latinoamérica
                    const match = timeStamp.match(/^([a-zñáéíóúü]+) (\d{1,2}) de ([a-zñáéíóúü]+), (\d{1,2}:\d{1,2}) (?:[ap]\.m\.) (GMT[+-]\d{1,2})/i);
                    const time = timeStamp.includes("p.m") ? this.adapter._convertPM(match[4]) : match[4];
                    return new Date(`${match[1]}, ${match[2]} ${match[3]}, ${time} ${match[5]} ${currentYear}`);
                },
                "ja-JP": (timeStamp, currentYear) => { // 日本語
                    const match = timeStamp.match(/(\d{1,2})\D+(\d{1,2})\D+(\d{1,2}:\d{1,2}) (GMT[+-]\d{1,2})/);
                    return new Date(`${currentYear}-${match[1]}-${match[2]} ${match[3]}:00 ${match[4]}`);
                },
                "ko-KR": (timeStamp, currentYear) => { // 한국어
                    const match = timeStamp.match(/(\d{1,2})\D+(\d{1,2})\D+(\d{1,2}:\d{1,2}) (GMT[+-]\d{1,2})/);
                    const time = timeStamp.includes("오후") ? this.adapter._convertPM(match[3]) : match[3];
                    return new Date(`${currentYear}-${match[1]}-${match[2]} ${time}:00 ${match[4]}`);
                },
                "zh-TW": (timeStamp, currentYear) => { // 中文 繁體
                    const match = timeStamp.match(/(\d{1,2})\D+(\d{1,2})\D+\D+(\d{1,2}:\d{1,2}) \[(GMT[+-]\d{1,2})\]/);
                    const time = timeStamp.includes("下午") ? this.adapter._convertPM(match[3]) : match[3];
                    return new Date(`${currentYear}-${match[1]}-${match[2]} ${time}:00 ${match[4]}`);
                },
                "zh-CN": (timeStamp, currentYear) => { // 中文 简体
                    const match = timeStamp.match(/(\d{1,2})\D+(\d{1,2})\D+\D+(GMT[+-]\d{1,2}) (\d{1,2}:\d{1,2})/);
                    return new Date(`${currentYear}-${match[1]}-${match[2]} ${match[4]}:00 ${match[3]}`);
                }
            };

            /* 頁面刷新, 展示倒數 */
            this.pageRefresh = async (display, interval, finish) => {
                if (display) { // 展示倒數 (背景有時會卡住, 用 Date 計算即時修正)
                    const start = Date.now();
                    const Refresh = setInterval(() => {
                        const elapsed = Math.floor((Date.now() - start) / 1000);
                        const remaining = interval - elapsed;

                        if (remaining < 0) {
                            clearInterval(Refresh);
                            return;
                        };

                        document.title = `【 ${remaining}s 】 ${this.progressValue}`;
                    }, 1e3);
                }

                setTimeout(() => { finish?.() }, (interval + 1) * 1e3); // 定時刷新 (準確計時)
            };

            /* 展示進度於標籤 */
            this.showProgress = () => {
                (new MutationObserver(() => {
                    document.title != this.progressValue && (document.title = this.progressValue);
                })).observe(document.querySelector("title"), { childList: 1, subtree: 0 });
                document.title = this.progressValue; // 觸發一次轉換
            };

            /* 查找過期的項目將其刪除 */
            this.expiredCleanup = (element, adapter, timestamp, callback) => {
                const targetTime = adapter?.(timestamp, this.currentTime.getFullYear()) ?? this.currentTime;
                this.currentTime > targetTime ? (this.Config.ClearExpiration && element.remove()) : callback(element);
            };

            this.progressValue; // 保存進度值字串
            this.currentTime; // 保存當前時間

            /* 初始化數據 */
            this.Config = {
                ...Config,
                EndLine: "p a[href='/drops/campaigns']", // 斷開觀察者的終止線
                Campaigns: "a[href='/drops/campaigns']",
                Inventory: "a[href='/drops/inventory']",
                allProgress: ".inventory-max-width > div:not(:first-child)", // 所有的掉寶進度
                ProgressBar: "[role='progressbar'] + div span", // 掉寶進度數據
                ActivityTime: ".inventory-campaign-info span:last-child", // 掉寶活動的日期
            };
        }

        /* 主要運行 */
        static async run() {
            const Detec = new Detection(); // Detec = 靜態函數需要將自身類實例化
            const Self = Detec.Config; // Self = 這樣只是讓語法短一點, 沒有必要性

            const display = Self.UpdateDisplay;

            let campaigns, inventory; // 頁面按鈕
            let task, progress, maxElement, progressInfo; // 任務數量, 掉寶進度, 最大進度元素, 保存進度的資訊

            // 初始化數據
            const initData = () => {
                Detec.progressValue = "";
                Detec.currentTime = new Date();

                task = 0, progress = 0, maxElement = 0;
                progressInfo = {};
            };
            initData();

            /* 主要處理函數 */
            const process = (token) => {
                campaigns ??= devTrace("Campaigns", document.querySelector(Self.Campaigns));
                inventory ??= devTrace("Inventory", document.querySelector(Self.Inventory));

                // 這邊寫這麼複雜是為了處理, (1: 只有一個, 2: 存在兩個以上, 3: 存在兩個以上但有些過期)
                const allProgress = devTrace("allProgress", document.querySelectorAll(Self.allProgress));

                if (allProgress?.length > 0) {
                    const adapter = Detec.adapter[document.documentElement.lang]; // 根據網站語言, 獲取適配器 (寫在這裡是避免反覆調用)

                    allProgress.forEach(data => { // 顯示進度, 重啟直播, 刪除過期, 都需要這邊的處理
                        const activityTime = devTrace("ActivityTime", data.querySelector(Self.ActivityTime));

                        Detec.expiredCleanup(
                            data, // 物件整體
                            adapter, // 適配器
                            activityTime?.textContent, // 時間戳
                            notExpired => { // 取得未過期的物件
                                // 嘗試查找領取按鈕 (可能會出現因為過期, 而無法自動領取問題, 除非我在另外寫一個 allProgress 遍歷)
                                notExpired.querySelectorAll("button").forEach(draw => { draw.click() });

                                const ProgressBar = devTrace("ProgressBar", notExpired.querySelectorAll(Self.ProgressBar));

                                // 紀錄為第幾個任務數, 與掉寶進度
                                progressInfo[task++] = [...ProgressBar].map(progress => +progress.textContent);
                            }
                        )
                    });

                    const oldTask = Detec.storage("Task") ?? {}; // 嘗試獲取舊任務紀錄
                    const newTask = Object.fromEntries( // 獲取新任務數據
                        Object.entries(progressInfo).map(([key, value]) => [key, Detec.progressParse(value)])
                    );

                    // 開始找到當前運行的任務
                    for (const [key, value] of Object.entries(newTask)) {
                        const OldValue = oldTask[key] ?? value;

                        if (value != OldValue) { // 找到第一個新值不等於舊值的
                            maxElement = key;
                            progress = value;
                            break;
                        } else if (value > progress) { // 如果都相同, 或沒有紀錄, 就找當前最大對象
                            maxElement = key;
                            progress = value;
                        }
                    };

                    Detec.storage("Task", newTask); // 保存新任務狀態
                };

                // 處理進度 (寫在這裡是, allProgress 找不到時, 也要正確試錯)
                if (progress > 0) {
                    Detec.progressValue = `${progress}%`; // 賦予進度值
                    !display && Detec.showProgress() // 有顯示更新狀態, 就由他動態展示, 沒有再呼叫 showProgress 動態處理展示
                } else if (token > 0) {
                    setTimeout(() => { process(token - 1) }, 2e3); // 試錯 (避免意外)
                };

                // 重啟直播與自動關閉, 都需要紀錄判斷, 所以無論如何都會存取紀錄
                const [record, timestamp] = Detec.storage("Record") ?? [0, Detec.getTime()]; // 進度值, 時間戳
                const diff = ~~((Detec.currentTime - new Date(timestamp)) / (1e3 * 60)); // 捨棄小數後取整, ~~ 最多限制 32 位整數

                /* 無取得進度, 且啟用自動關閉, 且紀錄又不為 0, 判斷掉寶領取完成, 最後避免意外 token 為 0 才觸發 */
                if (!progress && Self.EndAutoClose && record !== 0 && token === 0) {
                    window.open("", "LiveWindow", "top=0,left=0,width=1,height=1").close();
                    window.close();
                }
                /* 差異大於檢測間隔, 且標題與進度值相同, 代表需要重啟 */
                else if (diff >= Self.JudgmentInterval && progress === record) {
                    Self.RestartLive && Restart.run(maxElement); // 已最大進度對象, 進行直播重啟
                    Detec.storage("Record", [progress, Detec.getTime()]);
                }
                /* 標題與進度值不同 = 有變化 */
                else if (progress !== 0 && progress !== record) { // 進度為 0 時不被紀錄 (紀錄了會導致 自動關閉無法運作)
                    Detec.storage("Record", [progress, Detec.getTime()]);
                };
            };

            const waitLoad = (element, interval = 500, timeout = 15000) => { // 持續等待 15 秒載入
                let elapsed = 0;
                return new Promise((resolve, reject) => {
                    const query = () => {
                        if (document.querySelector(element)) resolve();
                        else {
                            elapsed += interval;
                            elapsed >= timeout
                                ? location.assign("https://www.twitch.tv/drops/inventory")
                                : setTimeout(query, interval);
                        }
                    }
                    setTimeout(query, interval);
                })
            };

            const monitor = () => { // 後續變更監聽
                Detec.pageRefresh(display, Self.UpdateInterval, async () => {
                    initData();

                    campaigns?.click();
                    await waitLoad(".accordion-header");

                    inventory?.click();
                    await waitLoad(Self.EndLine);

                    process(5);
                    monitor();
                })
            };

            waitEl(document, Self.EndLine, () => { // 初始等待頁面載入
                process(5);
                monitor();
                Self.TryStayActive && stayActive(document);
            }, { timeoutResult: true });
        }
    };

    /* 重啟邏輯 */
    class RestartLive {
        constructor() {
            /* 重啟直播的靜音(持續執行 15 秒) */
            this.liveMute = async Newindow => {
                waitEl(Newindow.document, "video", video => {
                    const SilentInterval = setInterval(() => { video.muted = 1 }, 5e2);
                    setTimeout(() => { clearInterval(SilentInterval) }, 1.5e4);
                })
            };

            /* 直播自動最低畫質 */
            this.liveLowQuality = async Newindow => {
                const Dom = Newindow.document;
                waitEl(Dom, "[data-a-target='player-settings-button']", Menu => {
                    Menu.click(); // 點擊設置選單
                    waitEl(Dom, "[data-a-target='player-settings-menu-item-quality']", Quality => {
                        Quality.click(); // 點擊畫質設定
                        waitEl(Dom, "[data-a-target='player-settings-menu']", Settings => {
                            Settings.lastElementChild.click(); // 選擇最低畫質
                            setTimeout(() => { Menu.click() }, 800); // 等待一下關閉菜單
                        })
                    })
                })
            };

            this.Config = {
                ...Config,
                Offline: ".home-carousel-info strong", // 離線的直播 (離線標籤)
                Online: "[data-a-target='animated-channel-viewers-count']", // 正在觀看直播人數標籤 (觀看人數)
                Channel: ".preview-card-channel-link", // 頻道連結
                Container: "#directory-game-main-content", // 頻道播放的容器
                ContainerHandle: ".scrollable-area", // 容器滾動句柄
                ActivityLink1: "[data-test-selector='DropsCampaignInProgressDescription-hint-text-parent']", // 參與活動的頻道連結
                ActivityLink2: "[data-test-selector='DropsCampaignInProgressDescription-no-channels-hint-text']",
            };
        }

        async run(Index) { // 傳入對應的頻道索引
            window.open("", "LiveWindow", "top=0,left=0,width=1,height=1").close(); // 將查找標籤合併成正則
            const Dir = this;
            const Self = Dir.Config;

            let NewWindow;
            let Channel = document.querySelectorAll(Self.ActivityLink2)[Index];

            if (Channel) {
                NewWindow = window.open(Channel.href, "LiveWindow");
                dirSearch(NewWindow);
            } else {
                Channel = document.querySelectorAll(Self.ActivityLink1)[Index];
                const OpenLink = [...Channel.querySelectorAll("a")].reverse();

                findLive(0);
                async function findLive(index) { // 持續找到有在直播的頻道
                    if ((OpenLink.length - 1) < index) return 0;

                    const href = OpenLink[index].href;
                    NewWindow = !NewWindow ? window.open(href, "LiveWindow") : (NewWindow.location.assign(href), NewWindow);

                    if (href.includes("directory")) { // 是目錄頁面
                        dirSearch(NewWindow);
                    } else {
                        let Offline, Online;
                        const observer = new MutationObserver($throttle(() => {
                            Online = devTrace("Online", NewWindow.document.querySelector(Self.Online));
                            Offline = devTrace("Offline", NewWindow.document.querySelector(Self.Offline));

                            if (Offline) {
                                observer.disconnect();
                                findLive(index + 1);

                            } else if (Online) {
                                observer.disconnect();
                                Self.RestartLiveMute && Dir.liveMute(NewWindow);
                                Self.TryStayActive && stayActive(NewWindow.document);
                                Self.RestartLowQuality && Dir.liveLowQuality(NewWindow);

                            }
                        }, 300));

                        NewWindow.onload = () => {
                            observer.observe(NewWindow.document, { subtree: 1, childList: 1, characterData: 1 });
                        }
                    }
                }
            }

            // 目錄頁面的查找邏輯
            const Pattern = Self.FindTag.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|");
            const FindTag = new RegExp(Pattern, "i");
            async function dirSearch(NewWindow) {

                const observer = new MutationObserver($throttle(() => {
                    const Container = devTrace("Container", NewWindow.document.querySelector(Self.Container));

                    if (Container) {
                        observer.disconnect();

                        // 取得滾動句柄
                        const ContainerHandle = devTrace("ContainerHandle", Container.closest(Self.ContainerHandle));

                        const StartFind = () => {
                            const Channel = devTrace("Channel", Container.querySelectorAll(`${Self.Channel}:not([Drops-Processed])`))

                            const Link = [...Channel]
                                .find(channel => {
                                    channel.setAttribute("Drops-Processed", true);
                                    const haveDrops = [...channel.nextElementSibling?.querySelectorAll("span")]
                                        .some(span => FindTag.test(span.textContent))
                                    return haveDrops ? channel : null
                                });

                            if (Link) {
                                Link.click();
                                Link.click(); // 避免意外點兩次 (直接用 dblclick MouseEvent 好像不行)
                                Self.RestartLiveMute && Dir.liveMute(NewWindow);
                                Self.TryStayActive && stayActive(NewWindow.document);
                                Self.RestartLowQuality && Dir.liveLowQuality(NewWindow);
                            } else if (ContainerHandle) {

                                ContainerHandle.scrollTo({ // 向下滾動
                                    top: ContainerHandle.scrollHeight
                                })

                                setTimeout(StartFind, 1500);
                            }
                        }

                        StartFind();
                    }
                }, 300));

                NewWindow.onload = () => {
                    observer.observe(NewWindow.document, { subtree: 1, childList: 1, characterData: 1 });
                }
            }
        }
    };

    /* 節流函數 */
    function $throttle(func, delay) {
        let lastTime = 0;
        return (...args) => {
            const now = Date.now();
            if ((now - lastTime) >= delay) {
                lastTime = now;
                func(...args);
            }
        }
    };

    /* 開發模式追蹤 */
    let cleaner = null;
    let traceRecord = {};

    function getCompositeKey(elements) {
        return Array.from(elements).map(el => {
            if (!(el instanceof Element)) return '';
            return el.tagName + (el.id || 'id') + (el.className || 'class');
        }).join('|');
    };
    function devTrace(tag, element) {
        if (!Config.Dev) return element;

        const record = traceRecord[tag];
        const isNodeList = element instanceof NodeList; // 只用於該腳本, 只會出現 NodeList 和 Element
        const recordKey = isNodeList ? getCompositeKey(element) : element;

        if (record && record.has(recordKey)) return element;
        traceRecord[tag] = new Map().set(recordKey, true); // 記錄

        clearTimeout(cleaner); // GC 清理工作
        cleaner = setTimeout(() => {
            traceRecord = {};
        }, 1e4);

        const isEmpty = !element || (isNodeList && element.length === 0);

        const baseStyle = 'padding: 2px 6px; border-radius: 3px; font-weight: bold; margin: 0 2px;';
        const tagStyle = `${baseStyle} background: linear-gradient(45deg, #667eea 0%, #764ba2 100%); color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);`;

        let statusStyle, statusIcon, statusText;

        if (isEmpty) {
            statusStyle = `${baseStyle} background: linear-gradient(45deg, #e74c3c 0%, #c0392b 100%); color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);`;
            statusIcon = '❌';
            statusText = 'NOT FOUND';
        } else {
            statusStyle = `${baseStyle} background: linear-gradient(45deg, #2ecc71 0%, #27ae60 100%); color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);`;
            statusIcon = '✅';
            statusText = 'FOUND';
        }

        console.groupCollapsed(
            `%c🔍 ${tag} %c${statusIcon} ${statusText}`,
            tagStyle,
            statusStyle
        );

        if (isEmpty) {
            console.log(
                `%c📭 Element: %c${element === null ? 'null' : 'empty NodeList'}`,
                'color: #e74c3c; font-weight: bold;',
                'color: #c0392b; font-style: italic;'
            );
        } else {
            console.log('%c📦 Element:', 'color: #27ae60; font-weight: bold;', element);
        }

        console.trace('🎯 Source');
        console.groupEnd();

        return element;
    };

    /* 簡易的 等待元素 */
    async function waitEl(
        document, selector, found, { timeout = 1e4, throttle = 200, timeoutResult = false } = {}
    ) {
        let timer, element;

        const observer = new MutationObserver($throttle(() => {
            element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                clearTimeout(timer);
                found(element);
            }
        }, throttle));

        observer.observe(document, { subtree: 1, childList: 1, characterData: 1 });
        timer = setTimeout(() => {
            observer.disconnect();
            timeoutResult && found(element);
        }, timeout);

    };

    /* 使窗口保持活躍 */
    async function stayActive(target) {
        const script = document.createElement("script");
        script.id = "Stay-Active";
        script.textContent = `
            function WorkerCreation(code) {
                const blob = new Blob([code], {type: "application/javascript"});
                return new Worker(URL.createObjectURL(blob));
            }

            const Active = WorkerCreation(\`
                onmessage = function(e) {
                    setTimeout(() => {
                        const { url } = e.data;
                        fetch(url);
                        postMessage({ url });
                    }, 1e4);
                }
            \`);

            Active.postMessage({ url: location.href });
            Active.onmessage = (e) => {
                const { url } = e.data;
                document.querySelector("video")?.play();
                Active.postMessage({ url });
            };

            let emptyAudio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEA...");
            emptyAudio.loop = true;
            emptyAudio.muted = true;

            // 後台播放 / 前台暫停
            const visHandler = (isHidden) => {
                if (typeof isHidden !== 'boolean') isHidden = document.hidden;
                if (isHidden) {
                    emptyAudio.play().catch(()=>{});
                } else {
                    emptyAudio.pause();
                }
            };

            if (typeof document.hidden !== "undefined") {
                document.addEventListener("visibilitychange", () => visHandler());
            } else {
                window.addEventListener("focus", () => visHandler(false));
                window.addEventListener("blur", () => visHandler(true));
            }

            visHandler();
        `;
        target.head.append(script);
    };

    if (Object.keys(Backup).length > 0) {
        GM_registerMenuCommand("🗑️ Clear Config", () => {
            GM_deleteValue("Config");
            location.reload();
        });
    } else {
        const SaveConfig = structuredClone(Config); // 維持初始配置
        GM_registerMenuCommand("📝 Save Config", () => {
            GM_setValue("Config", SaveConfig);
        });
    }

    // 主運行調用
    const Restart = new RestartLive();
    Detection.run();

})();