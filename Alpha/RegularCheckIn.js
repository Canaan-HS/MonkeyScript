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

// @require      https://cdn.jsdelivr.net/npm/qmsg@1.6.0/dist/index.umd.min.js
// @require      https://update.greasyfork.org/scripts/487608/1711627/SyntaxLite_min.js

// @run-at       document-start
// ==/UserScript==

(async () => {

    /*
        Todo - 待測試
        Jkf 每日簽到任務領取 (POST)
        https://jkforum.net/api/jkf-dailyTask-api/v1/DailyTask/CompleteTask?taskId=614115862249472

        code
        200000 = Success

        進行每日簽到 (只領這個任務的獎勵)
        taskId=614115862249472

        觀看任一篇文章
        taskId=614116038410241

        Jkf 每日簽到任務額外獎勵 (Post)
        https://jkforum.net/api/jkf-dailyTask-api/v1/DailyStage/CompleteStage?stageId=370080837533734

        code
        201000 = Success

        古代銀幣 (只領這個任務的獎勵)
        stageId=370080837533734

        勇氣之羽
        stageId=370081890304039

        小型體力藥水
        stageId=370081911275560
    */

    /**
     * 任務列表
     * @example
     * {
     *      Name: "任務名",
     *      Method: "GET" | "POST", // 選填
     *      API: "簽到 API 網址",
     *      Page: "簽到網址", // 選填
     *      Headers: Object | Function, // 選填
     *      Data: Object | Function, // 選填
     *      Cookie: Object | Function, // 選填
     *      verifyStatus: (response) => { // 驗證簽到狀態回傳 0=success, 1=checked, 2=failed }
     */

    const taskList = [
        {
            Name: "Android 台灣中文網",
            Method: "GET",
            API: "https://apk.tw/plugin.php?id=dsu_amupper:pper&ajax=1&formhash=ae746a25&inajax=1", // 似乎每過一段時間就會變更
            Page: "https://apk.tw/forum.php",
            verifyStatus: (response) => response?.includes("wb.gif") ? 0 : 2
        },
        {
            Name: "GenshInimpact", // 任務名
            Method: "POST", // 請求方法
            API: "https://sg-hk4e-api.hoyolab.com/event/sol/sign?act_id=e202102251931481", // 簽到 API
            Page: "https://act.hoyolab.com/ys/event/signin-sea-v3/index.html?act_id=e202102251931481", // 簽到網址
            verifyStatus: ({ retcode }) => retcode === 0 ? 0 : retcode === -5003 ? 1 : 2
        },
        {
            Name: "HonkaiStarRail",
            API: "https://sg-public-api.hoyolab.com/event/luna/os/sign?act_id=e202303301540311",
            Page: "https://act.hoyolab.com/bbs/event/signin/hkrpg/index.html?act_id=e202303301540311",
            verifyStatus: ({ retcode }) => retcode === 0 ? 0 : retcode === -5003 ? 1 : 2
        },
        {
            Name: "HonkaiImpact3rd",
            API: "https://sg-public-api.hoyolab.com/event/mani/sign?act_id=e202110291205111",
            Page: "https://act.hoyolab.com/bbs/event/signin-bh3/index.html?act_id=e202110291205111",
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
        Dev: false,
        TaskKey: "RunTasks", // 任務列表 Key
        TimerKey: "TaskTimer", // 時間戳 Key
        RegisterKey: "LeaderId", // 當前註冊 Key
    };

    const requestTask = (() => {

        const showStatus = {
            0: (name) => Qmsg.success(`${name} 簽到成功`),
            1: (name) => Qmsg.info(`${name} 已經簽到`),
            2: (name) => {
                Qmsg.error(`${name} 簽到失敗`);
                Lib.delV(`${name}-CheckIn`); // 刪除簽到成功標籤
            }
        };

        const deBug = (name, result) => {
            const _type = Lib.type(result);
            Lib.log(
                Object.assign({ name }, _type === "Object" ? result : { response: result })
            ).table;
            return result;
        };

        const objectVerify = (obj) =>
            typeof obj === "function"
                ? obj() : obj;

        return {
            send({ API, Method = "POST", Headers, Cookie, Data, Name, verifyStatus }) {
                let checkIn = undefined;

                try {
                    checkIn = Qmsg.loading(`${Name} 簽到中`);
                } catch (error) { }

                const params = {
                    url: API,
                    method: Method,
                    onload(response) {
                        checkIn?.close();

                        if (response.status !== 200) {
                            showStatus[2](Name);
                            return;
                        }

                        let status = undefined;

                        try {
                            status = verifyStatus(deBug(Name, JSON.parse(response.response)));
                        } catch {
                            status = verifyStatus(deBug(Name, response.response));
                        }

                        status
                            ? showStatus[status](Name)
                            : showStatus[2](Name);
                    },
                    onerror(response) {
                        checkIn?.close();

                        try {
                            deBug(Name, JSON.parse(response.response));
                        } catch {
                            deBug(Name, response.response);
                        } finally {
                            showStatus[2](Name);
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
            }
        }
    })();

    const timeUtils = {
        // 判斷是否是前一天
        isPrevious(newDate, oldDate) {
            const oldMs = Date.UTC(oldDate.getFullYear(), oldDate.getMonth(), oldDate.getDate());
            const newMs = Date.UTC(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
            return oldMs < newMs;
        },
        // 計算簽到時間
        getCheckInTime(newDate) {
            const tomorrow = new Date();
            tomorrow.setDate(newDate.getDate() + 1); // 設置隔天時間
            tomorrow.setHours(0, 0, 1, 0); // 00:01 (暫時統一時間)
            return tomorrow;
        },
        // 格式化時間
        getFormat(time) {
            const year = time.getFullYear();
            const month = `${time.getMonth() + 1}`.padStart(2, "0");
            const date = `${time.getDate()}`.padStart(2, "0");
            const hour = `${time.getHours()}`.padStart(2, "0");
            const minute = `${time.getMinutes()}`.padStart(2, "0");
            const second = `${time.getSeconds()}`.padStart(2, "0");
            return `${year}/${month}/${date} ${hour}:${minute}:${second}`;
        },
        // 顯示觸發時間
        showTriggerTime(newDate, checkInDate) {
            if (!config.Dev) return;

            const ms = checkInDate - newDate;
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

            Lib.log(`任務觸發還剩: ${hour} 小時 ${minute} 分鐘 ${seconds} 秒`, { dev: config.Dev });
        },
    };

    const createTask = (() => {
        const taskId = crypto.randomUUID();

        let stop = false;
        let timers = null;
        let registered = false;

        function setTab(role = "Leader") {
            GM_saveTab({ ID: taskId, Role: role, Name: Lib.title() });
        };

        // 更新記錄
        function setTimestamp(newDate) {
            Lib.setV(config.TimerKey, {
                RecordTime: timeUtils.getFormat(newDate),
                CheckInTime: timeUtils.getFormat(timeUtils.getCheckInTime(newDate))
            })
        };

        // 銷毀所有定時器與詢輪, 並重置註冊狀態
        async function destroyReset(recover = true) {
            stop = true;
            setTab("Member");
            clearTimeout(timers);
            Lib.offEvent(window, "beforeunload");
            Lib.offEvent(document, "visibilitychange");

            if (!recover) return;
            // 恢復預設狀態 (允許重複註冊)
            setTimeout(() => {
                stop = false;
                registered = false;
            });
        };

        // 註冊變化監聽器
        async function changeListener(name) {
            Lib.storageListen([name], Lib.debounce(({ nv, far }) => {
                if (far) {
                    // 有新的註冊
                    if (nv !== taskId && registered) {
                        destroyReset();
                        Lib.log("舊詢輪已被停止");
                    }
                    // 新註冊頁面離開 (查找並觸發恢復)
                    else if (nv === "leave") {
                        GM_getTabs(data => {
                            const tabs = Object.values(data).reverse();
                            for (const { ID, Role } of tabs) {
                                if (Role === "Leader") continue;
                                Lib.setV(config.RegisterKey, ID);
                                break;
                            }
                        })
                    }
                }
                // 恢復註冊
                else if (nv === taskId) {
                    register();
                    Lib.log("詢輪已被恢復");
                }
            }, 10))
        };

        // 任務詢輪
        function taskQuery(newDate = new Date()) {
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

            // 料表類型錯誤, 直接複寫空陣列
            if (!Array.isArray(enabledTaskList)) {
                Lib.setV(config.TaskKey, []);

                Lib.log("錯誤的任務列表, 詢輪已被停止", { dev: config.Dev }).error;
                return;
            };

            // 沒有任務不執行 (並清除不需要的值)
            if (enabledTaskList.length === 0) {
                Lib.delV(config.TaskKey);
                Lib.delV(config.TimerKey);
                Lib.delV(config.RegisterKey);

                destroyReset();
                Lib.log("沒有任務, 詢輪已被停止", { dev: config.Dev }).warn;
                return;
            };

            try {
                const taskTimer = Lib.getV(config.TimerKey); // 取得時間戳

                if (taskTimer) {
                    const checkInDate = taskTimer['CheckInTime']; // 主要驗證
                    const recordDate = taskTimer['RecordTime']; // 附加驗證 (非必要)

                    if (
                        navigator.onLine && newDate > new Date(checkInDate) // 有網路時, 當前時間 > 簽到時間
                        || recordDate && timeUtils.isPrevious(newDate, new Date(recordDate)) // 判斷紀錄時間是前一天
                    ) { // 執行簽到
                        destroyReset(false); // 簽到時停止詢輪

                        // ! 暫時檢測
                        Lib.log({
                            "網路狀態": navigator.onLine,
                            "當前時間": timeUtils.getFormat(newDate),
                            "簽到觸發": newDate > new Date(checkInDate),
                            "紀錄時間": recordDate,
                            "前一天": timeUtils.isPrevious(newDate, new Date(recordDate))
                        });

                        let index = 0;
                        const enabledTask = new Set(enabledTaskList);

                        for (const task of taskList) {
                            if (!enabledTask.has(task.Name)) continue; // 判斷是否啟用
                            if (Lib.getV(`${task.Name}-CheckIn`)) continue; // 判斷是否已經簽到

                            setTimeout(() => {
                                requestTask.send(task);
                                Lib.setV(`${task.Name}-CheckIn`, true);
                            }, Math.max(index++ * 2000)); // 每個任務間隔 2 秒
                        }

                        // ? 嘗試確保所有任務都簽到
                        const retryCount = Lib.getV("ReTry-Count", 0);
                        const allCheckIn = enabledTaskList.every(name => Lib.getV(`${name}-CheckIn`));

                        if (allCheckIn || retryCount >= 4) {
                            enabledTask.clear();
                            setTimestamp(newDate); // 更新時間戳

                            Lib.delV("ReTry-Count");
                            enabledTaskList.forEach(name => { // 清除簽到記錄
                                Lib.delV(`${name}-CheckIn`);
                            })
                        } else {
                            Lib.setV("ReTry-Count", retryCount + 1);
                        };
                    } else timeUtils.showTriggerTime(newDate, new Date(checkInDate));

                } else throw new Error("沒有時間戳記錄");
            } catch {
                setTimestamp(newDate);
            };

            if (stop) return;
            timers = setTimeout(taskQuery, 1e4); // 10 秒詢輪
        };

        // 註冊任務
        function register() {
            if (registered || !navigator.onLine) return; // 禁止重複 與 離線註冊
            registered = true;

            setTab();
            Lib.setV(config.RegisterKey, taskId); // 紀錄註冊時間
            changeListener(config.RegisterKey); // 監聽註冊時間變化

            taskQuery(); // 開始檢測
            Lib.onEvent(window, "beforeunload", () => { // 離開時執行
                Lib.setV(config.RegisterKey, "leave");
            });
            Lib.onEvent(document, "visibilitychange", () => { // 切換頁面時執行
                if (document.visibilityState === "visible") {
                    clearTimeout(timers);
                    taskQuery();
                }
            });
        };

        return { register };
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
        const enabledTask = new Set(Lib.getV(config.TaskKey, []));
        // 根據版本號判斷菜單是否自動關閉
        const autoClose = !!(isVersionGreater(GM_info.version ?? "5.3.0", "5.3.0"));

        function run() {
            // 有任務時註冊
            if (enabledTask.size > 0) createTask.register();

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
                    run(); // 遞迴更新狀態
                }, 200), {
                    id: `CheckIn-${index}`,
                    autoClose
                })

            }
        };

        return { run };
    })();

    if (document.visibilityState === "hidden") {
        Lib.onE(document, "visibilitychange", () => enableTask.run(), { once: true });
    } else enableTask.run();
})();