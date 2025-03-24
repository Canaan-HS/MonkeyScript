// ==UserScript==
// @name                Twitch 自動領取掉寶 / Auto Receive Drops
// @name:zh-TW          Twitch 自動領取掉寶
// @name:zh-CN          Twitch 自动领取掉宝
// @name:en             Twitch Auto Claim Drops
// @name:ja             Twitch 自動ドロップ受け取り
// @name:ko             Twitch 자동 드롭 수령
// @version             0.0.16-Beta
// @author              Canaan HS
// @description         Twitch 自動領取 (掉寶/Drops) , 窗口標籤顯示進度 , 直播結束時還沒領完 , 會自動尋找任意掉寶直播 , 並開啟後繼續掛機 , 代碼自訂義設置
// @description:zh-TW   Twitch 自動領取 (掉寶/Drops) , 窗口標籤顯示進度 , 直播結束時還沒領完 , 會自動尋找任意掉寶直播 , 並開啟後繼續掛機 , 代碼自訂義設置
// @description:zh-CN   Twitch 自动领取 (掉宝/Drops) , 窗口标签显示进度 , 直播结束时还没领完 , 会自动寻找任意掉宝直播 , 并开启后继续挂机 , 代码自定义设置
// @description:en      Automatically claim Twitch Drops, display progress in the tab, and if not finished when the stream ends, it will automatically find another Drops-enabled stream and continue farming. Customizable settings in the code.
// @description:ja      Twitch のドロップを自動的に受け取り、タブに進捗狀況を表示し、ストリーム終了時にまだ受け取っていない場合、自動的に別のドロップ有効なストリームを検索し、収穫を続けます。コードでのカスタマイズ可能な設定
// @description:ko      Twitch 드롭을 자동으로 받아오고 탭에 진행 상황을 표시하며, 스트림이 종료되었을 때 아직 완료되지 않았다면 자동으로 다른 드롭 활성 스트림을 찾아 계속 수집합니다. 코드에서 사용자 정의 설정 가능합니다

// @match        https://www.twitch.tv/drops/inventory
// @icon         https://cdn-icons-png.flaticon.com/512/8214/8214044.png

// @license      MIT
// @namespace    https://greasyfork.org/users/989635

// @run-at       document-body
// @grant        window.close
// @grant        GM_notification
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
    class Detection {
        constructor() {
            this.ProgressParse = progress => progress.sort((a, b) => b - a).find(number => number < 100);
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
            this.Storage = (key, value = null) => {
                let data, Formula = {
                    Type: parse => Object.prototype.toString.call(parse).slice(8, -1),
                    Number: parse => parse ? Number(parse) : (sessionStorage.setItem(key, JSON.stringify(value)),
                        !0),
                    Array: parse => parse ? JSON.parse(parse) : (sessionStorage.setItem(key, JSON.stringify(value)),
                        !0),
                    Object: parse => parse ? JSON.parse(parse) : (sessionStorage.setItem(key, JSON.stringify(value)),
                        !0)
                };
                return value != null ? Formula[Formula.Type(value)]() : (data = sessionStorage.getItem(key),
                    data != undefined ? Formula[Formula.Type(JSON.parse(data))](data) : data);
            };
            this.Adapter = {
                __ConvertPM: time => time.replace(/(\d{1,2}):(\d{2})/, (_, hours, minutes) => `${+hours + 12}:${minutes}`),
                "en-US": (timeStamp, currentYear) => new Date(`${timeStamp} ${currentYear}`),
                "en-GB": (timeStamp, currentYear) => new Date(`${timeStamp} ${currentYear}`),
                "es-ES": (timeStamp, currentYear) => new Date(`${timeStamp} ${currentYear}`),
                "fr-FR": (timeStamp, currentYear) => new Date(`${timeStamp} ${currentYear}`),
                "pt-PT": (timeStamp, currentYear) => {
                    const convert = timeStamp.replace(/(\d{1,2})\/(\d{1,2})/, (_, day, month) => `${month}/${day}`);
                    return new Date(`${convert} ${currentYear}`);
                },
                "pt-BR": (timeStamp, currentYear) => {
                    const ISO = {
                        jan: "Jan", fev: "Feb", mar: "Mar", abr: "Apr", mai: "May", jun: "Jun", jul: "Jul", ago: "Aug", set: "Sep", out: "Oct", nov: "Nov", dez: "Dec", dom: "Sun", seg: "Mon", ter: "Tue", qua: "Wed", qui: "Thu", sex: "Fri", "sáb": "Sat"
                    };
                    const convert = timeStamp.replace(/de/g, "").replace(/(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|dom|seg|ter|qua|qui|sex|sáb)/gi, match => ISO[match.toLowerCase()]);
                    return new Date(`${convert} ${currentYear}`);
                },
                "ru-RU": (timeStamp, currentYear) => {
                    const ISO = {
                        "янв": "Jan", "фев": "Feb", "мар": "Mar", "апр": "Apr", "май": "May", "июн": "Jun", "июл": "Jul", "авг": "Aug", "сен": "Sep", "окт": "Oct", "ноя": "Nov", "дек": "Dec", "пн": "Mon", "вт": "Tue", "ср": "Wed", "чт": "Thu", "пт": "Fri", "сб": "Sat", "вс": "Sun"
                    };
                    const convert = timeStamp.replace(/(янв|фев|мар|апр|май|июн|июл|авг|сен|окт|ноя|дек|пн|вт|ср|чт|пт|сб|вс)/gi, match => ISO[match.toLowerCase()]);
                    return new Date(`${convert} ${currentYear}`);
                },
                "de-DE": (timeStamp, currentYear) => {
                    const ISO = {
                        jan: "Jan", feb: "Feb", "mär": "Mar", apr: "Apr", mai: "May", jun: "Jun", jul: "Jul", aug: "Aug", sep: "Sep", okt: "Oct", nov: "Nov", dez: "Dec", mo: "Mon", di: "Tue", mi: "Wed", do: "Thu", fr: "Fri", sa: "Sat", so: "Sun"
                    };
                    const convert = timeStamp.replace(/(jan|feb|mär|apr|mai|jun|jul|aug|sep|okt|nov|dez|mo|di|mi|do|fr|sa|so)/gi, match => ISO[match.toLowerCase()]);
                    return new Date(`${convert} ${currentYear}`);
                },
                "it-IT": (timeStamp, currentYear) => {
                    const ISO = {
                        gen: "Jan", feb: "Feb", mar: "Mar", apr: "Apr", mag: "May", giu: "Jun", lug: "Jul", ago: "Aug", set: "Sep", ott: "Oct", nov: "Nov", dic: "Dec", dom: "Sun", lun: "Mon", mar: "Tue", mer: "Wed", gio: "Thu", ven: "Fri", sab: "Sat"
                    };
                    const convert = timeStamp.replace(/(gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic|dom|lun|mar|mer|gio|ven|sab)/gi, match => ISO[match.toLowerCase()]);
                    return new Date(`${convert} ${currentYear}`);
                },
                "tr-TR": (timeStamp, currentYear) => {
                    const ISO = {
                        oca: "Jan", "şub": "Feb", mar: "Mar", nis: "Apr", may: "May", haz: "Jun", tem: "Jul", "ağu": "Aug", eyl: "Sep", eki: "Oct", kas: "Nov", ara: "Dec", paz: "Sun", pts: "Mon", sal: "Tue", "çar": "Wed", per: "Thu", cum: "Fri", cmt: "Sat"
                    };
                    const convert = timeStamp.replace(/(oca|şub|mar|nis|may|haz|tem|ağu|eyl|eki|kas|ara|paz|pts|sal|çar|per|cum|cmt)/gi, match => ISO[match.toLowerCase()]);
                    const match = convert.match(/(\d{1,2}) ([a-z]+) ([a-z]+) (\d{1,2}:\d{1,2}) (GMT[+-]\d{1,2})/i);
                    return new Date(`${match[3]} ${match[1]} ${match[2]} ${match[4]} ${match[5]} ${currentYear}`);
                },
                "es-MX": (timeStamp, currentYear) => {
                    const match = timeStamp.match(/^([a-zñáéíóúü]+) (\d{1,2}) de ([a-zñáéíóúü]+), (\d{1,2}:\d{1,2}) (?:[ap]\.m\.) (GMT[+-]\d{1,2})/i);
                    const time = timeStamp.includes("p.m") ? this.Adapter.__ConvertPM(match[4]) : match[4];
                    return new Date(`${match[1]}, ${match[2]} ${match[3]}, ${time} ${match[5]} ${currentYear}`);
                },
                "ja-JP": (timeStamp, currentYear) => {
                    const match = timeStamp.match(/(\d{1,2})\D+(\d{1,2})\D+(\d{1,2}:\d{1,2}) (GMT[+-]\d{1,2})/);
                    return new Date(`${currentYear}-${match[1]}-${match[2]} ${match[3]}:00 ${match[4]}`);
                },
                "ko-KR": (timeStamp, currentYear) => {
                    const match = timeStamp.match(/(\d{1,2})\D+(\d{1,2})\D+(\d{1,2}:\d{1,2}) (GMT[+-]\d{1,2})/);
                    const time = timeStamp.includes("오후") ? this.Adapter.__ConvertPM(match[3]) : match[3];
                    return new Date(`${currentYear}-${match[1]}-${match[2]} ${time}:00 ${match[4]}`);
                },
                "zh-TW": (timeStamp, currentYear) => {
                    const match = timeStamp.match(/(\d{1,2})\D+(\d{1,2})\D+\D+(\d{1,2}:\d{1,2}) \[(GMT[+-]\d{1,2})\]/);
                    const time = timeStamp.includes("下午") ? this.Adapter.__ConvertPM(match[3]) : match[3];
                    return new Date(`${currentYear}-${match[1]}-${match[2]} ${time}:00 ${match[4]}`);
                },
                "zh-CN": (timeStamp, currentYear) => {
                    const match = timeStamp.match(/(\d{1,2})\D+(\d{1,2})\D+\D+(GMT[+-]\d{1,2}) (\d{1,2}:\d{1,2})/);
                    return new Date(`${currentYear}-${match[1]}-${match[2]} ${match[4]}:00 ${match[3]}`);
                }
            };
            this.PageRefresh = async (display, interval) => {
                if (display) {
                    setInterval(() => {
                        document.title = `【 ${interval--}s 】 ${this.ProgressValue}`;
                    }, 1e3);
                }
                setTimeout(() => {
                    location.reload();
                }, (interval + 1) * 1e3);
            };
            this.ShowProgress = () => {
                new MutationObserver(() => {
                    document.title != this.ProgressValue && (document.title = this.ProgressValue);
                }).observe(document.querySelector("title"), {
                    childList: !0,
                    subtree: !1
                });
                document.title = this.ProgressValue;
            };
            this.ExpiredCleanup = (Object, Adapter, Timestamp, Callback) => {
                const targetTime = Adapter?.(Timestamp, this.CurrentTime.getFullYear()) ?? this.CurrentTime;
                this.CurrentTime > targetTime ? this.Config.ClearExpiration && Object.remove() : Callback(Object);
            };
            this.ProgressValue = "";
            this.CurrentTime = new Date();
            this.Config = Object.assign(Config, {
                EndLine: "div.gtpIYu",
                AllProgress: "div.ilRKfU",
                ProgressBar: "p.mLvNZ span",
                ActivityTime: "span.jSkguG"
            });
        }
        static async Ran() {
            let Task = 0, Progress = 0, MaxElement = 0;
            const Progress_Info = {};
            const Detec = new Detection();
            const Self = Detec.Config;
            const Display = Self.UpdateDisplay;
            const Process = Token => {
                const All_Data = document.querySelectorAll(Self.AllProgress);
                if (All_Data && All_Data.length > 0) {
                    const Adapter = Detec.Adapter[document.documentElement.lang];
                    All_Data.forEach(data => {
                        Detec.ExpiredCleanup(data, Adapter, data.querySelector(Self.ActivityTime).textContent, NotExpired => {
                            NotExpired.querySelectorAll("button").forEach(draw => {
                                draw.click();
                            });
                            Progress_Info[Task++] = [...NotExpired.querySelectorAll(Self.ProgressBar)].map(progress => +progress.textContent);
                        });
                    });
                    const OldTask = Detec.Storage("Task") ?? {};
                    const NewTask = Object.fromEntries(Object.entries(Progress_Info).map(([key, value]) => [key, Detec.ProgressParse(value)]));
                    for (const [key, value] of Object.entries(NewTask)) {
                        const OldValue = OldTask[key] ?? value;
                        if (value != OldValue) {
                            MaxElement = key;
                            Progress = value;
                            break;
                        } else if (value > Progress) {
                            MaxElement = key;
                            Progress = value;
                        }
                    }
                    Detec.Storage("Task", NewTask);
                }
                if (Progress > 0) {
                    Detec.ProgressValue = `${Progress}%`;
                    !Display && Detec.ShowProgress();
                } else if (Token > 0) {
                    setTimeout(() => {
                        Process(Token - 1);
                    }, 2e3);
                }
                const [Record, Timestamp] = Detec.Storage("Record") ?? [0, Detec.GetTime()];
                const Diff = ~~((Detec.CurrentTime - new Date(Timestamp)) / (1e3 * 60));
                if (!Progress && Self.EndAutoClose && Record != 0 && Token == 0) {
                    window.open("", "LiveWindow", "top=0,left=0,width=1,height=1").close();
                    window.close();
                } else if (Diff >= Self.JudgmentInterval && Progress == Record) {
                    Self.RestartLive && Restart.Ran(MaxElement);
                    Detec.Storage("Record", [Progress, Detec.GetTime()]);
                } else if (Diff == 0 || Progress != Record) {
                    if (Progress != 0) Detec.Storage("Record", [Progress, Detec.GetTime()]);
                }
            };
            WaitElem(document, Self.EndLine, () => {
                Process(4);
                Self.TryStayActive && StayActive(document);
            }, {
                timeoutResult: true
            });
            Detec.PageRefresh(Display, Self.UpdateInterval);
        }
    }
    class RestartLive {
        constructor() {
            this.LiveMute = async Newindow => {
                WaitElem(Newindow.document, "video", video => {
                    const SilentInterval = setInterval(() => {
                        video.muted = !0;
                    }, 500);
                    setTimeout(() => {
                        clearInterval(SilentInterval);
                    }, 15e3);
                });
            };
            this.LiveLowQuality = async Newindow => {
                const Dom = Newindow.document;
                WaitElem(Dom, "[data-a-target='player-settings-button']", Menu => {
                    Menu.click();
                    WaitElem(Dom, "[data-a-target='player-settings-menu-item-quality']", Quality => {
                        Quality.click();
                        WaitElem(Dom, "[data-a-target='player-settings-menu']", Settings => {
                            Settings.lastElementChild.click();
                            setTimeout(() => {
                                Menu.click();
                            }, 800);
                        });
                    });
                });
            };
            this.Config = Object.assign(Config, {
                TagType: "span",
                Article: "article",
                Offline: "p.fQYeyD",
                Online: "span.hERoTc",
                WatchLiveLink: "[data-a-target='preview-card-image-link']",
                ActivityLink1: "[data-test-selector='DropsCampaignInProgressDescription-hint-text-parent']",
                ActivityLink2: "[data-test-selector='DropsCampaignInProgressDescription-no-channels-hint-text']"
            });
        }
        async Ran(Index) {
            window.open("", "LiveWindow", "top=0,left=0,width=1,height=1").close();
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
                async function FindLive(index) {
                    if (OpenLink.length - 1 < index) return !1;
                    const href = OpenLink[index].href;
                    NewWindow = !NewWindow ? window.open(href, "LiveWindow") : (NewWindow.location.assign(href),
                        NewWindow);
                    if (href.includes("directory")) {
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
                            observer.observe(NewWindow.document, {
                                subtree: !0,
                                childList: !0,
                                characterData: !0
                            });
                        };
                    }
                }
            }
            async function DirectorySearch(NewWindow) {
                const observer = new MutationObserver(Throttle(() => {
                    article = NewWindow.document.getElementsByTagName(Self.Article);
                    if (article.length > 10) {
                        observer.disconnect();
                        const index = [...article].findIndex(element => {
                            const Tag_box = element.querySelectorAll(Self.TagType);
                            return Tag_box.length > 0 && [...Tag_box].some(match => FindTag.test(match.textContent.toLowerCase()));
                        });
                        if (index != -1) {
                            article[index].querySelector(Self.WatchLiveLink).click();
                            Self.RestartLiveMute && Dir.LiveMute(NewWindow);
                            Self.TryStayActive && StayActive(NewWindow.document);
                            Self.RestartLowQuality && Dir.LiveLowQuality(NewWindow);
                        } else {
                            function Language(lang) {
                                const Word = {
                                    Traditional: {},
                                    Simplified: {
                                        "搜尋失敗": "搜索失败", "找不到啟用掉落的頻道": "找不到启用掉落的频道"
                                    },
                                    Korea: {
                                        "搜尋失敗": "검색 실패", "找不到啟用掉落的頻道": "드롭이 활성화된 채널을 찾을 수 없습니다"
                                    },
                                    Japan: {
                                        "搜尋失敗": "検索失敗", "找不到啟用掉落的頻道": "ドロップが有効なチャンネルが見つかりません"
                                    },
                                    English: {
                                        "搜尋失敗": "Search failed", "找不到啟用掉落的頻道": "Can't find a channel with drops enabled"
                                    }
                                }, Match = {
                                    ko: Word.Korea,
                                    ja: Word.Japan,
                                    "en-US": Word.English,
                                    "zh-CN": Word.Simplified,
                                    "zh-SG": Word.Simplified,
                                    "zh-TW": Word.Traditional,
                                    "zh-HK": Word.Traditional,
                                    "zh-MO": Word.Traditional
                                }, ML = Match[lang] ?? Match["en-US"];
                                return {
                                    Transl: Str => ML[Str] ?? Str
                                };
                            }
                            const Lang = Language(navigator.language);
                            GM_notification({
                                title: Lang.Transl("搜尋失敗"),
                                text: Lang.Transl("找不到啟用掉落的頻道")
                            });
                        }
                    }
                }, 300));
                NewWindow.onload = () => {
                    observer.observe(NewWindow.document, {
                        subtree: !0,
                        childList: !0,
                        characterData: !0
                    });
                };
            }
        }
    }
    function Throttle(func, delay) {
        let lastTime = 0;
        return (...args) => {
            const now = Date.now();
            if (now - lastTime >= delay) {
                lastTime = now;
                func(...args);
            }
        };
    }
    async function WaitElem(document, selector, found, {
        timeout = 1e4,
        throttle = 200,
        timeoutResult = false
    } = {}) {
        let timer, element;
        const observer = new MutationObserver(Throttle(() => {
            element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                clearTimeout(timer);
                found(element);
            }
        }, throttle));
        observer.observe(document, {
            subtree: !0,
            childList: !0,
            characterData: !0
        });
        timer = setTimeout(() => {
            observer.disconnect();
            timeoutResult && found(element);
        }, timeout);
    }
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
    }
    const Restart = new RestartLive();
    Detection.Ran();
})();