// ==UserScript==
// @name         定時簽到
// @version      0.0.1
// @author       Canaan HS
// @description  定時簽到

// @noframes
// @connect      *
// @match        *://*/*

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635
// @icon         https://cdn-icons-png.flaticon.com/512/10233/10233926.png

// @grant        GM_info
// @grant        GM_saveTab
// @grant        GM_getTabs
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener

// @require      https://cdn.jsdelivr.net/npm/qmsg@1.7.2/dist/index.umd.min.js
// @require      https://update.greasyfork.org/scripts/487608/1909139/SyntaxLite_min.js

// @run-at       document-start
// ==/UserScript==

(async () => {

    /**
     * 任務列表
     * @example
     * {
     *      Name: "任務名",
     *      Method: "POST", // 必要
     *      API: "簽到 API 網址", // 必要
     *      Page: "簽到網址",
     *      AutoOpen: Boolean, // 依賴 Page 參數 (以開啟對應 Page 來觸發簽到)
     *      Async: Boolean, // 允許不阻塞下一個任務
     *      Headers: Object | Function,
     *      Data: Object | Function,
     *      Cookie: Object | Function,
     *      verifyStatus: (response) => { 在簽到觸發後執行任意程式, 最終必要回傳 0=success, 1=checked, 2=failed, 3=expired } // 必要 (需要判斷簽到狀態)
     */

    const taskList = [
        {
            Name: "JKF 論壇",
            Method: "PUT",
            API: "https://jkforum.net/api/jkf-dailysign/v1/DailySign",
            Page: "https://jkforum.net/",
            AutoOpen: true,
            Headers: {
                "Content-Type": "application/json",
            },
            Data: JSON.stringify({
                "moodStickerId": Math.floor(Math.random() * 9) + 1,
                "message": "簽到"
            }),
            verifyStatus: (response) => response === undefined ? 1 : 0
        },
        {
            Name: "JKF 論壇簽到任務",
            Method: "POST",
            API: "https://jkforum.net/api/jkf-dailyTask-api/v1/DailyTask/CompleteTask",
            Page: "https://jkforum.net/",
            Headers: { "Content-Type": "application/json" },
            Data: JSON.stringify({ "taskId": "614115862249472" }),
            Async: true,
            verifyStatus: (response) => response === undefined ? 1 : 0
        },
        {
            Name: "Android 台灣中文網",
            Method: "GET",
            // 每過一段時間就會變更 formhash=後面字串
            API: `https://apk.tw/plugin.php?id=dsu_amupper:pper&ajax=1&formhash=${Lib.getV("apktw_formhash", "")}&inajax=1`,
            Page: "https://apk.tw/forum.php",
            async verifyStatus(response) {
                let status = response?.includes("wb.gif") ? 0 : 2;

                // ! 實驗性
                // 自動取得 formhash
                if (status === 2) {
                    await requestTask.send({
                        API: "https://apk.tw/forum.php",
                        Method: "GET",
                        responseType: "document",
                        verifyStatus(data) {
                            const formhashMatch = data.$q("#my_amupper")?.$gAttr("onclick")?.match(/formhash=([^&]+)/);
                            if (formhashMatch) {
                                status = "formhash"; // 隨便給一個狀態
                                Lib.setV("apktw_formhash", formhashMatch[1]);
                                setTimeout(() => location.reload(), 1e3); // 重新載入
                            }
                            else if (data.$q("#ppered_menu")) {
                                status = 1;
                            }
                            else status = 3;
                        }
                    }, false); // 不顯示並不紀錄狀態
                }

                return status;
            }
        },
        {
            Name: "GenshInimpact",
            API: "https://sg-hk4e-api.hoyolab.com/event/sol/sign?act_id=e202102251931481",
            Page: "https://act.hoyolab.com/ys/event/signin-sea-v3/index.html?act_id=e202102251931481",
            Async: true,
            verifyStatus: ({ retcode }) => retcode === 0 ? 0 : retcode === -5003 ? 1 : 2
        },
        {
            Name: "HonkaiStarRail",
            API: "https://sg-public-api.hoyolab.com/event/luna/os/sign?act_id=e202303301540311",
            Page: "https://act.hoyolab.com/bbs/event/signin/hkrpg/index.html?act_id=e202303301540311",
            Async: true,
            verifyStatus: ({ retcode }) => retcode === 0 ? 0 : retcode === -5003 ? 1 : 2
        },
        {
            Name: "HonkaiImpact3rd",
            API: "https://sg-public-api.hoyolab.com/event/mani/sign?act_id=e202110291205111",
            Page: "https://act.hoyolab.com/bbs/event/signin-bh3/index.html?act_id=e202110291205111",
            Async: true,
            verifyStatus: ({ retcode }) => retcode === 0 ? 0 : retcode === -5003 ? 1 : 2
        },
        {
            Name: "ZenlessZoneZero",
            API: "https://sg-public-api.hoyolab.com/event/luna/zzz/os/sign?act_id=e202406031448091",
            Page: "https://act.hoyolab.com/bbs/event/signin/zzz/e202406031448091.html?act_id=e202406031448091",
            Headers: { "x-rpc-signgame": "zzz" },
            verifyStatus: ({ retcode }) => retcode === 0 ? 0 : retcode === -5003 ? 1 : 2
        },
        {
            Name: "LeveCheckIn",
            API: "https://api-pass.levelinfinite.com/api/rewards/proxy/lipass/Points/DailyCheckIn?task_id=15",
            Page: "https://pass.levelinfinite.com/rewards?points=/points/",
            Async: true,
            verifyStatus: ({ code }) => code === 0 ? 0 : code === 1001009 ? 1 : 2
        },
        {
            Name: "LeveStageCheckIn",
            API: "https://api-pass.levelinfinite.com/api/rewards/proxy/lipass/Points/DailyStageCheckIn?task_id=58",
            Page: "https://pass.levelinfinite.com/rewards?points=/points/sign-in",
            verifyStatus: ({ code }) => code === 0 ? 0 : code === 1001009 || code === 1002007 ? 1 : 2
        }
    ];

    // Qmsg 配置 (避免意外無法自行關閉, 某些網站依舊會無法自動關閉)
    Qmsg.config({
        showClose: true,
        autoClose: true,
    });

    const config = {
        Dev: false, // 開發模式
        TaskKey: "RunTasks", // 任務列表 Key
        TimerKey: "TaskTimer", // 時間戳 Key
        LeaderKey: "LeaderId", // 當前註冊 Key
        QueryInterval: 3e4, // 詢輪間隔 (毫秒 | 預設 30 秒), 重置簽到任務存活狀態
    };

    const requestTask = (() => {

        // 簽到成功才紀錄
        const showStatus = {
            0(name) {
                Lib.setV(`${name}-Checked`, true);
                Qmsg.success(`${name} 簽到成功`);
            },
            1(name) {
                Lib.setV(`${name}-Checked`, true);
                Qmsg.info(`${name} 已經簽到`);
            },
            2(name) {
                Qmsg.error(`${name} 簽到失敗`);
            },
            3(name) {
                Qmsg.warning(`${name} 重新登入`);
            },
        };

        const deBug = (name = "Unknown", result) => {
            Lib.log(
                Object.assign({ name }, Lib.type(result) === "Object" ? result : { response: result }),
                { group: `${name} 簽到除錯`, dev: config.Dev },
            ).table;
            return result;
        };

        const objectVerify = (obj) =>
            typeof obj === "function"
                ? obj() : obj;

        return {
            // 傳送簽到請求 (沒有展示 msg 的, 同時不紀錄狀態)
            send({ API, Method = "POST", Headers, Cookie, Data, responseType = "text", Name, verifyStatus }, msgShow = true) {
                let checkIn = undefined;

                try {
                    if (msgShow) checkIn = Qmsg.loading(`${Name} 簽到中`);
                } catch (error) { }

                return new Promise(async (resolve, reject) => {
                    const params = {
                        url: API,
                        method: Method,
                        responseType,
                        onload(response) {
                            checkIn?.close();

                            if (response.status < 200 || response.status > 300) {
                                if (msgShow) showStatus[2](Name);
                                return resolve(deBug(Name, response));
                            }

                            let responseData = {};

                            try {
                                responseData = JSON.parse(response.response);
                            } catch {
                                responseData = response.response;
                            }

                            Promise.resolve(
                                verifyStatus?.(deBug(Name, responseData))
                            ).then(status => {
                                if (msgShow)
                                    status != null
                                        ? showStatus[status](Name)
                                        : showStatus[2](Name); // 預設為失敗
                            });

                            resolve(response);
                        },
                        onerror(response) {
                            checkIn?.close();

                            try {
                                deBug(Name, JSON.parse(response.response));
                            } catch {
                                deBug(Name, response.response);
                            } finally {
                                if (msgShow) showStatus[2](Name);
                                resolve(response);
                            }
                        }
                    };

                    // 確保參數不為空, 才傳參數
                    const data = objectVerify(Data);
                    const cookie = objectVerify(Cookie);
                    const headers = objectVerify(Headers);

                    if (data != null) params.data = data;
                    if (cookie != null) params.cookie = cookie;
                    if (headers != null) params.headers = headers;

                    GM_xmlhttpRequest(params);
                })
            }
        }
    })();

    const timeUtils = {
        // 判斷是否是前一天
        isPrevious(currentTime, checkInTime) {
            const checkInMs = Date.UTC(checkInTime.getFullYear(), checkInTime.getMonth(), checkInTime.getDate());
            const currentMs = Date.UTC(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());
            return checkInMs < currentMs;
        },
        // 計算簽到時間
        getCheckInTime(currentTime) {
            const tomorrow = new Date();
            tomorrow.setDate(currentTime.getDate() + 1); // 設置隔天時間
            tomorrow.setHours(0, 0, 1, 0); // 00:01 (暫時統一時間)
            return tomorrow;
        },
        // 格式化時間
        getFormat(currentTime) {
            const year = currentTime.getFullYear();
            const month = `${currentTime.getMonth() + 1}`.padStart(2, "0");
            const date = `${currentTime.getDate()}`.padStart(2, "0");
            const hour = `${currentTime.getHours()}`.padStart(2, "0");
            const minute = `${currentTime.getMinutes()}`.padStart(2, "0");
            const second = `${currentTime.getSeconds()}`.padStart(2, "0");
            return `${year}/${month}/${date} ${hour}:${minute}:${second}`;
        },
        // 顯示觸發時間
        getTriggerTime(currentTime, checkInTime) {
            const ms = checkInTime - currentTime;
            const [
                day_ms, minute_ms, seconds_ms
            ] = [
                    (8.64e7), (3.6e6), (6e4)
                ];

            const [
                hour, minute, seconds,
            ] = [
                    Math.floor((ms % day_ms) / minute_ms),
                    Math.floor((ms % minute_ms) / seconds_ms),
                    Math.floor((ms % seconds_ms) / 1e3)
                ];

            return { hour, minute, seconds, ms };
        },
    };

    const createTask = (() => {
        const pageUUID = crypto.randomUUID();

        let stop = false;
        let registered = false;

        let queryTimer = null;
        let checkInTimer = null;

        // 實驗測試
        function setTab(role = "Leader") {
            const data = { ID: pageUUID, Role: role, Name: Lib.title() };

            Lib.log(data);
            GM_saveTab(data);
        };

        function setTimestamp(currentTime) {
            Lib.setV(config.TimerKey, {
                RecordTime: timeUtils.getFormat(currentTime),
                CheckInTime: timeUtils.getFormat(timeUtils.getCheckInTime(currentTime))
            })
        };

        // 銷毀所有定時器與詢輪, 並重置註冊狀態
        function destroyReset(recover = true) {
            stop = true;

            clearTimeout(queryTimer);
            clearTimeout(checkInTimer);
            Lib.offEvent();

            if (!recover) return;

            setTab("Member");
            setTimeout(() => {
                stop = false;
                registered = false;
            });
        };

        // 註冊變化監聽器
        function leaderChangeListener() {
            Lib.storageListen([config.LeaderKey], Lib.debounce(({ nv, far }) => {
                // 來自其他窗口
                if (far) {
                    // 有新的 Leader
                    if (registered) {
                        destroyReset();
                        Lib.log("舊詢輪已被停止");
                    }
                    // 當前 Leader Page 被關閉, 重新找尋 Leader
                    else if (nv === "leave") {
                        GM_getTabs(data => {
                            const tabs = Object.values(data).reverse();
                            for (const { ID, Role } of tabs) {
                                if (Role === "Leader") continue;
                                Lib.setV(config.LeaderKey, ID);
                                break;
                            }
                        })
                    }
                }
                // 新的 Leader, 是當前環境的 UUID, 就 恢復註冊
                else if (nv === pageUUID) {
                    register();
                    Lib.log("詢輪已被恢復");
                }
            }, 10))
        };

        // 任務詢輪
        function taskQuery(currentTime = new Date()) {
            /*
                ! 未實現
                Todo: 將 RecordTime 紀錄移除, 保留 CheckInTime
                Todo: 將 CheckInTime 的格式改成 {CheckInTime: {"時間戳": ["任務"], "時間戳2": ["任務2"]}}, 可自訂個別任務時間

                * 檢查時所有的時間戳都會被檢查, 然後當有命中的時間戳, 紀錄的任務必須同時命中, 此處的任務表 與 有在任務列表內的, 如果沒特定時間
                * 將會被設置為 {"時間戳": ["All"]}, 輪詢始終只創建一個
                * 可能的定義與解析: const time = "01:05:30".split(":").map(value => parseInt(value));
            */
            if (stop) return;
            const enabledTaskList = Lib.getV(config.TaskKey, []); // 取得任務列表

            // 任務列表類型錯誤, 直接複寫空陣列
            if (!Array.isArray(enabledTaskList)) {
                Lib.setV(config.TaskKey, []);

                Lib.log("錯誤的任務列表, 詢輪已被停止", { dev: config.Dev }).error;
                return;
            };

            // 沒有任務不執行 (並清除不需要的值)
            if (enabledTaskList.length === 0) {
                Lib.delV(config.TaskKey);
                Lib.delV(config.TimerKey);
                Lib.delV(config.LeaderKey);

                destroyReset();
                Lib.log("沒有任務, 詢輪已被停止", { dev: config.Dev }).warn;
                return;
            };

            try {
                const timer = Lib.getV(config.TimerKey); // 取得時間戳
                if (!timer) throw new Error("沒有時間戳記錄");

                // 主要驗證
                const checkInTime = timer.CheckInTime ? new Date(timer.CheckInTime) : currentTime;
                // 附加驗證 (非必要)
                const recordTime = timer.RecordTime ? new Date(timer.RecordTime) : null;

                // 執行簽到工作
                const checkInWork = async () => {
                    destroyReset(false); // 簽到時停止詢輪, 且不重置
                    if (!navigator.onLine) return; // 離線不執行

                    currentTime = new Date(); // 更新當前時間

                    let runningTask = [];
                    let enabledTask = new Set(enabledTaskList);

                    for (const task of taskList) {
                        if (!enabledTask.has(task.Name)) continue; // 判斷是否啟用
                        if (Lib.getV(`${task.Name}-Checked`)) continue; // 判斷是否已經簽到

                        if (task.AutoOpen && task.Page) {
                            try {
                                // ! 臨時測試, 目前有偶發 Bug
                                const currentDomain = Lib.domain;
                                const targetDomain = new URL(task.Page).hostname;

                                if (currentDomain !== targetDomain) {
                                    Lib.log({currentDomain, targetDomain});

                                    window.open(task.Page);
                                    return;
                                }
                            } catch {
                                // 失敗當作成功 靜默處理 (因為是參數錯誤, 不是網路問題)
                                Lib.setV(`${task.Name}-Checked`, true);
                                continue;
                            }
                        };

                        // 存儲運行中任務 Promise
                        runningTask.push(
                            // 沒有啟用就會等到自身任務完成, 才進行下一個簽到
                            task.Async
                                ? requestTask.send(task)
                                : await requestTask.send(task)
                        );
                    }

                    // 確保所有任務都簽到
                    await Promise.allSettled(runningTask);

                    const retryCount = Lib.getV("ReTry-Count", 0);
                    const allCheckIn = enabledTaskList.every(name => Lib.getV(`${name}-Checked`));

                    if (allCheckIn || retryCount >= 4) {
                        setTimestamp(currentTime); // 更新時間戳

                        runningTask = null;
                        enabledTask = null;

                        Lib.delV("ReTry-Count");
                        enabledTaskList.forEach(name => { // 清除簽到記錄
                            Lib.delV(`${name}-Checked`);
                        })
                    } else {
                        Lib.setV("ReTry-Count", retryCount + 1);
                    };
                };

                if (
                    currentTime > checkInTime // 當前時間 > 簽到時間
                    || recordTime && timeUtils.isPrevious(currentTime, recordTime) // 判斷紀錄時間是前一天
                ) checkInWork();
                else {
                    const { hour, minute, seconds, ms } = timeUtils.getTriggerTime(currentTime, checkInTime);
                    Lib.log(`任務觸發還剩: ${hour} 小時 ${minute} 分鐘 ${seconds} 秒 | 共 ${ms} 毫秒`, { dev: config.Dev });

                    // ? 這邊是為了設置時間一到, 立即觸發, 而不去等輪詢到才觸發, 因為輪詢有延遲
                    // ? 否則實際上可以只靠輪詢觸發

                    clearTimeout(checkInTimer); // 清除先前簽到
                    checkInTimer = setTimeout(checkInWork, ms); // 重設簽到
                }
            }
            catch { }
            finally {
                if (stop) return;
                queryTimer = setTimeout(taskQuery, config.QueryInterval); // 設定詢輪
            }
        };

        // 註冊任務
        function register(verifyRole = false) {
            if (registered) return; // 禁止重複註冊
            if (!navigator.onLine) return; // 禁止離線註冊

            registered = true;
            setTab();

            Lib.setV(config.LeaderKey, pageUUID); // 紀錄註冊窗口
            leaderChangeListener(); // 監聽註冊窗口變化

            Lib.onEvent(window, "beforeunload", () => { // 離開時執行
                Lib.setV(config.LeaderKey, "leave");
            });

            Lib.onEvent(document, "visibilitychange", () => { // 切換頁面時執行
                if (document.visibilityState === "visible") {
                    clearTimeout(queryTimer);
                    taskQuery();
                }
            });

            taskQuery(); // 開始檢測
        };

        return {
            register,
            get state() {
                return registered;
            },
        };
    })();

    // 透過菜單註冊任務
    const enableTask = (() => {
        // 判斷是否為 url
        function isValidURL(string) {
            try {
                new URL(string);
                return true;
            } catch (error) {
                return false;
            }
        };

        // 雙擊確認
        function doubleClickConfirm(callback, delay) {
            let lastTime = 0;
            let timerId;

            return function (...args) {
                const now = Date.now();
                const isRapid = now - lastTime < delay;

                clearTimeout(timerId);
                lastTime = now;

                if (isRapid) {
                    return callback(true, ...args);
                }

                timerId = setTimeout(() => callback(false, ...args), delay);
            }
        };

        // 判斷版本號
        function isVersionGreater(version, targetVersion) {
            const [major1, minor1, patch1] = version.split('.').map(Number);
            const [major2, minor2, patch2] = targetVersion.split('.').map(Number);

            return major1 > major2 ||
                (major1 === major2 && minor1 > minor2) ||
                (major1 === major2 && minor1 === minor2 && patch1 > patch2);
        };

        // 取得任務列表
        let enabledTask = new Set(Lib.getV(config.TaskKey, []));
        // 根據版本號判斷菜單是否自動關閉
        const autoClose = !!(isVersionGreater(GM_info.version ?? "5.3.0", "5.3.0"));

        // 初始化註冊
        if (enabledTask.size > 0) createTask.register();

        // 全局監聽任務列表
        Lib.storageListen([config.TaskKey], ({ far, nv }) => {
            if (!far) return;
            enabledTask = new Set(nv);
            regMenu();
        });

        function regMenu() {
            for (const [index, task] of taskList.entries()) {
                const icon = enabledTask.has(task.Name) ? "🟢" : "🔴";

                GM_registerMenuCommand(`${icon} ${task.Name}`, doubleClickConfirm((open) => {

                    if (open) {
                        const url = task['Page'];
                        isValidURL(url) && window.open(url);
                        return;
                    };

                    enabledTask.has(task.Name)
                        ? enabledTask.delete(task.Name)
                        : enabledTask.add(task.Name);

                    Lib.setV(config.TaskKey, [...enabledTask]);
                    regMenu(); // 遞迴更新狀態
                }, 200), {
                    id: `CheckIn-${index}`,
                    autoClose
                })

            }
        };

        return { regMenu };
    })();

    if (document.visibilityState === "hidden") {
        Lib.onE(document, "visibilitychange", () => enableTask.regMenu(), { once: true });
    } else enableTask.regMenu();
})();