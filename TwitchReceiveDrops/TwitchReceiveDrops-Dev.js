// ==UserScript==
// @name                Twitch Auto Drops Claim
// @name:zh-TW          Twitch 自動領取掉寶
// @name:zh-CN          Twitch 自动领取掉宝
// @name:en             Twitch Auto Drops Claim
// @name:ja             Twitch 自動ドロップ受け取り
// @name:ko             Twitch 자동 드롭 수령
// @name:ru             Twitch Автоматическое получение дропов
// @version             0.0.16
// @author              Canaan HS
// @description         Twitch 自動領取 (掉寶/Drops) , 窗口標籤顯示進度 , 直播結束時還沒領完 , 會自動尋找任意掉寶直播 , 並開啟後繼續掛機 , 代碼自訂義設置
// @description:zh-TW   Twitch 自動領取 (掉寶/Drops) , 窗口標籤顯示進度 , 直播結束時還沒領完 , 會自動尋找任意掉寶直播 , 並開啟後繼續掛機 , 代碼自訂義設置
// @description:zh-CN   Twitch 自动领取 (掉宝/Drops) , 窗口标签显示进度 , 直播结束时还没领完 , 会自动寻找任意掉宝直播 , 并开启后继续挂机 , 代码自定义设置
// @description:en      Automatically claim Twitch Drops, display progress in the tab, and if not finished when the stream ends, it will automatically find another Drops-enabled stream and continue farming. Customizable settings in the code.
// @description:ja      Twitch のドロップを自動的に受け取り、タブに進捗狀況を表示し、ストリーム終了時にまだ受け取っていない場合、自動的に別のドロップ有効なストリームを検索し、収穫を続けます。コードでのカスタマイズ可能な設定
// @description:ko      Twitch 드롭을 자동으로 받아오고 탭에 진행 상황을 표시하며, 스트림이 종료되었을 때 아직 완료되지 않았다면 자동으로 다른 드롭 활성 스트림을 찾아 계속 수집합니다. 코드에서 사용자 정의 설정 가능합니다
// @description:ru      Автоматически получает дропы Twitch, отображает прогресс во вкладке, и если дропы не завершены к концу трансляции, автоматически находит другую трансляцию с активированными дропами и продолжает фарминг. Настраиваемые параметры в коде.

// @match        https://www.twitch.tv/drops/inventory
// @icon         https://cdn-icons-png.flaticon.com/512/8214/8214044.png

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635

// @run-at       document-body
// @grant        window.close
// ==/UserScript==

(async () => {

    const Config = {
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
    };

    /* 檢測邏輯 */
    class Detection {
        constructor() {
            /* 解析進度(找到 < 100 的最大值) */
            this.ProgressParse = progress => progress.sort((a, b) => b - a).find(number => number < 1e2);

            /* 獲取當前時間 */
            this.GetTime = () => {
                const time = this.CurrentTime;
                const year = time.getFullYear();
                const month = `${time.getMonth() + 1}`.padStart(2, "0");
                const date = `${time.getDate()}`.padStart(2, "0");
                const hour = `${time.getHours()}`.padStart(2, "0");
                const minute = `${time.getMinutes()}`.padStart(2, "0");
                const second = `${time.getSeconds()}`.padStart(2, "0");
                return `${year}-${month}-${date} ${hour}:${minute}:${second}`;
            };

            /* 保存數據 */
            this.Storage = (key, value = null) => {
                let data,
                    Formula = {
                        Type: (parse) => Object.prototype.toString.call(parse).slice(8, -1),
                        Number: (parse) => parse ? Number(parse) : (sessionStorage.setItem(key, JSON.stringify(value)), !0),
                        Array: (parse) => parse ? JSON.parse(parse) : (sessionStorage.setItem(key, JSON.stringify(value)), !0),
                        Object: (parse) => parse ? JSON.parse(parse) : (sessionStorage.setItem(key, JSON.stringify(value)), !0),
                    };
                return value != null
                    ? Formula[Formula.Type(value)]()
                    : (data = sessionStorage.getItem(key), data != undefined ? Formula[Formula.Type(JSON.parse(data))](data) : data);
            };

            /* 語言 時間格式 適配器 */
            this.Adapter = {
                __ConvertPM: (time) => time.replace(/(\d{1,2}):(\d{2})/, (_, hours, minutes) => `${+hours + 12}:${minutes}`), // 轉換 24 小時制
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
                    const time = timeStamp.includes("p.m") ? this.Adapter.__ConvertPM(match[4]) : match[4];
                    return new Date(`${match[1]}, ${match[2]} ${match[3]}, ${time} ${match[5]} ${currentYear}`);
                },
                "ja-JP": (timeStamp, currentYear) => { // 日本語
                    const match = timeStamp.match(/(\d{1,2})\D+(\d{1,2})\D+(\d{1,2}:\d{1,2}) (GMT[+-]\d{1,2})/);
                    return new Date(`${currentYear}-${match[1]}-${match[2]} ${match[3]}:00 ${match[4]}`);
                },
                "ko-KR": (timeStamp, currentYear) => { // 한국어
                    const match = timeStamp.match(/(\d{1,2})\D+(\d{1,2})\D+(\d{1,2}:\d{1,2}) (GMT[+-]\d{1,2})/);
                    const time = timeStamp.includes("오후") ? this.Adapter.__ConvertPM(match[3]) : match[3];
                    return new Date(`${currentYear}-${match[1]}-${match[2]} ${time}:00 ${match[4]}`);
                },
                "zh-TW": (timeStamp, currentYear) => { // 中文 繁體
                    const match = timeStamp.match(/(\d{1,2})\D+(\d{1,2})\D+\D+(\d{1,2}:\d{1,2}) \[(GMT[+-]\d{1,2})\]/);
                    const time = timeStamp.includes("下午") ? this.Adapter.__ConvertPM(match[3]) : match[3];
                    return new Date(`${currentYear}-${match[1]}-${match[2]} ${time}:00 ${match[4]}`);
                },
                "zh-CN": (timeStamp, currentYear) => { // 中文 简体
                    const match = timeStamp.match(/(\d{1,2})\D+(\d{1,2})\D+\D+(GMT[+-]\d{1,2}) (\d{1,2}:\d{1,2})/);
                    return new Date(`${currentYear}-${match[1]}-${match[2]} ${match[4]}:00 ${match[3]}`);
                }
            };

            /* 頁面刷新, 展示倒數 */
            this.PageRefresh = async (display, interval) => {
                if (display) { // 展示倒數
                    setInterval(() => { // 背景有時候會被限制, 而卡住倒數 (所以實際刷新由下方定時器觸發)
                        document.title = `【 ${interval--}s 】 ${this.ProgressValue}`
                    }, 1e3);
                }

                setTimeout(() => { location.reload() }, (interval + 1) * 1e3); // 定時刷新
            };

            /* 展示進度於標籤 */
            this.ShowProgress = () => {
                (new MutationObserver(() => {
                    document.title != this.ProgressValue && (document.title = this.ProgressValue);
                })).observe(document.querySelector("title"), { childList: !0, subtree: !1 });
                document.title = this.ProgressValue; // 觸發一次轉換
            };

            /* 查找過期的項目將其刪除 */
            this.ExpiredCleanup = (Object, Adapter, Timestamp, Callback) => {
                const targetTime = Adapter?.(Timestamp, this.CurrentTime.getFullYear()) ?? this.CurrentTime;
                this.CurrentTime > targetTime ? (this.Config.ClearExpiration && Object.remove()) : Callback(Object);
            };

            /* 初始化數據 */
            this.ProgressValue = ""; // 保存進度值字串
            this.CurrentTime = new Date(); // 保存當前時間
            this.Config = Object.assign(Config, {
                EndLine: "div.gtpIYu", // 斷開觀察者的終止線
                AllProgress: "div.ilRKfU", // 所有的掉寶進度
                ProgressBar: "p.mLvNZ span", // 掉寶進度數據
                ActivityTime: "span.jSkguG", // 掉寶活動的日期
            });
        }

        /* 主要運行 */
        static async Ran() {
            let Task = 0, Progress = 0, MaxElement = 0; // 任務數量, 掉寶進度, 最大進度元素
            const Progress_Info = {}; // 保存進度的資訊

            const Detec = new Detection(); // Detec = 靜態函數需要將自身類實例化
            const Self = Detec.Config; // Self = 這樣只是讓語法短一點, 沒有必要性

            const Display = Self.UpdateDisplay;

            /* 主要處理函數 */
            const Process = (Token) => {

                // 這邊寫這麼複雜是為了處理, (1: 只有一個, 2: 存在兩個以上, 3: 存在兩個以上但有些過期)
                const All_Data = document.querySelectorAll(Self.AllProgress);
                if (All_Data && All_Data.length > 0) {
                    const Adapter = Detec.Adapter[document.documentElement.lang]; // 根據網站語言, 獲取適配器 (寫在這裡是避免反覆調用)

                    All_Data.forEach(data => { // 顯示進度, 重啟直播, 刪除過期, 都需要這邊的處理
                        Detec.ExpiredCleanup(
                            data, // 物件整體
                            Adapter, // 適配器
                            data.querySelector(Self.ActivityTime).textContent, // 時間戳
                            NotExpired => { // 取得未過期的物件
                                // 嘗試查找領取按鈕 (可能會出現因為過期, 而無法自動領取問題, 除非我在另外寫一個 All_Data 遍歷)
                                NotExpired.querySelectorAll("button").forEach(draw => { draw.click() });
                                // 紀錄為第幾個任務數, 與掉寶進度
                                Progress_Info[Task++] = [...NotExpired.querySelectorAll(Self.ProgressBar)].map(progress => +progress.textContent);
                            }
                        )
                    });

                    const OldTask = Detec.Storage("Task") ?? {}; // 嘗試獲取舊任務紀錄
                    const NewTask = Object.fromEntries( // 獲取新任務數據
                        Object.entries(Progress_Info).map(([key, value]) => [key, Detec.ProgressParse(value)])
                    );

                    // 開始找到當前運行的任務
                    for (const [key, value] of Object.entries(NewTask)) {
                        const OldValue = OldTask[key] ?? value;

                        if (value != OldValue) { // 找到第一個新值不等於舊值的
                            MaxElement = key;
                            Progress = value;
                            break;
                        } else if (value > Progress) { // 如果都相同, 或沒有紀錄, 就找當前最大對象
                            MaxElement = key;
                            Progress = value;
                        }
                    };

                    Detec.Storage("Task", NewTask); // 保存新任務狀態
                };

                // 處理進度 (寫在這裡是, AllProgress 找不到時, 也要正確試錯)
                if (Progress > 0) {
                    Detec.ProgressValue = `${Progress}%`; // 賦予進度值
                    !Display && Detec.ShowProgress() // 有顯示更新狀態, 就由他動態展示, 沒有再呼叫 ShowProgress 動態處理展示
                } else if (Token > 0) {
                    setTimeout(() => {Process(Token - 1)}, 2e3); // 試錯 (避免意外)
                };

                // 重啟直播與自動關閉, 都需要紀錄判斷, 所以無論如何都會存取紀錄
                const [Record, Timestamp] = Detec.Storage("Record") ?? [0, Detec.GetTime()]; // 進度值, 時間戳
                const Diff = ~~((Detec.CurrentTime - new Date(Timestamp)) / (1e3 * 60)); // 捨棄小數後取整, ~~ 最多限制 32 位整數

                /* 當無取得進度, 且啟用自動關閉, 且紀錄又不為 0, 判斷掉寶領取完成, 最後避免意外 Token 為 0 才觸發 */
                if (!Progress && Self.EndAutoClose && Record != 0 && Token == 0) {
                    window.open("", "LiveWindow", "top=0,left=0,width=1,height=1").close();
                    window.close();

                /* 時間大於檢測間隔, 且標題與進度值相同, 代表需要重啟 */
                } else if (Diff >= Self.JudgmentInterval && Progress == Record) {
                    Self.RestartLive && Restart.Ran(MaxElement); // 已最大進度對象, 進行直播重啟
                    Detec.Storage("Record", [Progress, Detec.GetTime()]);

                /* 差異時間是 0 或 標題與進度值不同 = 有變化 */
                } else if (Diff == 0 || Progress != Record) { // 進度為 0 時不被紀錄 (紀錄了會導致 自動關閉無法運作)
                    if (Progress != 0) Detec.Storage("Record", [Progress, Detec.GetTime()]);

                };
            };

            WaitElem(document, Self.EndLine, () => { // 等待頁面載入
                Process(4); // 預設能試錯 5 次
                Self.TryStayActive && StayActive(document);
            }, {timeoutResult: true});
            Detec.PageRefresh(Display, Self.UpdateInterval); // 頁面刷新
        }
    };

    /* 重啟邏輯 */
    class RestartLive {
        constructor() {
            /* 重啟直播的靜音(持續執行 15 秒) */
            this.LiveMute = async Newindow => {
                WaitElem(Newindow.document, "video", video => {
                    const SilentInterval = setInterval(() => { video.muted = !0 }, 5e2);
                    setTimeout(() => { clearInterval(SilentInterval) }, 1.5e4);
                })
            };

            /* 直播自動最低畫質 */
            this.LiveLowQuality = async Newindow => {
                const Dom = Newindow.document;
                WaitElem(Dom, "[data-a-target='player-settings-button']", Menu => {
                    Menu.click(); // 點擊設置選單
                    WaitElem(Dom, "[data-a-target='player-settings-menu-item-quality']", Quality => {
                        Quality.click(); // 點擊畫質設定
                        WaitElem(Dom, "[data-a-target='player-settings-menu']", Settings => {
                            Settings.lastElementChild.click(); // 選擇最低畫質
                            setTimeout(() => { Menu.click() }, 800); // 等待一下關閉菜單
                        })
                    })
                })
            };

            this.Config = Object.assign(Config, {
                TagType: "span", // 頻道 Tag 標籤
                Article: "article", // 直播目錄的文章
                Offline: "p.fQYeyD", // 離線的直播 (離線文本)
                Online: "span.hERoTc", // 正在直播的標籤 (觀看人數)
                WatchLiveLink: "[data-a-target='preview-card-image-link']", // 觀看直播的連結
                ActivityLink1: "[data-test-selector='DropsCampaignInProgressDescription-hint-text-parent']", // 參與活動的頻道連結
                ActivityLink2: "[data-test-selector='DropsCampaignInProgressDescription-no-channels-hint-text']",
            });
        }

        async Ran(Index) { // 傳入對應的頻道索引
            window.open("", "LiveWindow", "top=0,left=0,width=1,height=1").close(); // 將查找標籤合併成正則
            const Dir = this;
            const Self = Dir.Config;
            const FindTag = new RegExp(Self.FindTag.join("|"));

            let NewWindow, OpenLink, article;
            let Channel = document.querySelectorAll(Self.ActivityLink2)[Index];

            if (Channel) {
                NewWindow = window.open(Channel.href, "LiveWindow");
                DirectorySearch(NewWindow);
            } else {
                Channel = document.querySelectorAll(Self.ActivityLink1)[Index];
                OpenLink = [...Channel.querySelectorAll("a")].reverse();

                FindLive(0);
                async function FindLive(index) { // 持續找到有在直播的頻道
                    if ((OpenLink.length - 1) < index) return !1;

                    const href = OpenLink[index].href;
                    NewWindow = !NewWindow ? window.open(href, "LiveWindow") : (NewWindow.location.assign(href), NewWindow);

                    if (href.includes("directory")) { // 是目錄頁面
                        DirectorySearch(NewWindow);
                    } else {
                        let Offline, Nowlive;
                        const observer = new MutationObserver(Throttle(() => {
                            Nowlive = NewWindow.document.querySelector(Self.Online);
                            Offline = NewWindow.document.querySelector(Self.Offline);

                            if (Offline) {
                                observer.disconnect();
                                FindLive(index + 1);

                            } else if (Nowlive) {
                                observer.disconnect();
                                Self.RestartLiveMute && Dir.LiveMute(NewWindow);
                                Self.TryStayActive && StayActive(NewWindow.document);
                                Self.RestartLowQuality && Dir.LiveLowQuality(NewWindow);

                            }
                        }, 300));

                        NewWindow.onload = () => {
                            observer.observe(NewWindow.document, { subtree: !0, childList: !0, characterData: !0 });
                        }
                    }
                }
            }

            // 目錄頁面的查找邏輯
            async function DirectorySearch(NewWindow) {
                const observer = new MutationObserver(Throttle(() => {
                    article = NewWindow.document.getElementsByTagName(Self.Article);
                    if (article.length > 10) { // 找到大於 10 個頻道
                        observer.disconnect();

                        // 解析 Tag
                        const index = [...article].findIndex(element => {
                            const Tag_box = element.querySelectorAll(Self.TagType);
                            return Tag_box.length > 0 && [...Tag_box].some(match => FindTag.test(match.textContent.toLowerCase()));
                        });

                        if (index != -1) {
                            article[index].querySelector(Self.WatchLiveLink).click();
                            Self.RestartLiveMute && Dir.LiveMute(NewWindow);
                            Self.TryStayActive && StayActive(NewWindow.document);
                            Self.RestartLowQuality && Dir.LiveLowQuality(NewWindow);
                        }
                    }
                }, 300));

                NewWindow.onload = () => {
                    observer.observe(NewWindow.document, { subtree: !0, childList: !0, characterData: !0 });
                }
            }
        }
    };

    /* 節流函數 */
    function Throttle(func, delay) {
        let lastTime = 0;
        return (...args) => {
            const now = Date.now();
            if ((now - lastTime) >= delay) {
                lastTime = now;
                func(...args);
            }
        }
    };

    /* 簡易的 等待元素 */
    async function WaitElem(
        document, selector, found, { timeout=1e4, throttle=200, timeoutResult=false } = {}
    ) {
        let timer, element;

        const observer = new MutationObserver(Throttle(() => {
            element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                clearTimeout(timer);
                found(element);
            }
        }, throttle));

        observer.observe(document, { subtree: !0, childList: !0, characterData: !0 });
        timer = setTimeout(() => {
            observer.disconnect();
            timeoutResult &&found(element);
        }, timeout);

    };

    /* 使窗口保持活躍 */
    async function StayActive(Target) {
        const script = document.createElement("script");
        script.id = "Stay-Active";
        script.textContent = `
            function WorkerCreation(code) {
                const blob = new Blob([code], {type: "application/javascript"});
                return new Worker(URL.createObjectURL(blob));
            }
            const Active = WorkerCreation(\`
                onmessage = function(e) {
                    setTimeout(()=> {
                        const {url} = e.data;
                        fetch(url);
                        postMessage({url});
                    }, 1e4);
                }
            \`);
            Active.postMessage({ url: location.href});
            Active.onmessage = (e) => {
                const { url } = e.data;
                document.querySelector("video")?.play();
                Active.postMessage({ url: url});
            };
        `;
        Target.head.append(script);
    };

    // 主運行調用
    const Restart = new RestartLive();
    Detection.Ran();
})();