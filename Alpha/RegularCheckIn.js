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

// @run-at       document-start
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener

// @require      https://update.greasyfork.org/scripts/462234/1545786/Message.js
// ==/UserScript==

(async ()=> {

    const Config = {
        Dev: true,
        TaskKey: "RunTasks", // 任務列表 Key
        TimerKey: "TaskTimer", // 時間戳 Key
        RegisterKey: "RegisterTime", // 註冊時間 Key
    };

    const Task_List = [
        {
            Name: "GenshInimpact", // 任務名
            API: "https://sg-hk4e-api.hoyolab.com/event/sol/sign?act_id=e202102251931481", // 簽到 API
            Page: "https://act.hoyolab.com/ys/event/signin-sea-v3/index.html?act_id=e202102251931481", // 簽到網址
            verifyStatus: (Name, { retcode }) => { // 驗證邏輯 Name: 任務名, { 要解構物件的值 }
                retcode === 0 ? Qmsg.success(`${Name} 簽到成功`) : retcode === -5003 ? Qmsg.info(`${Name} 已經簽到`) : Qmsg.error(`${Name} 簽到失敗`)
            }
        },
        {
            Name: "HonkaiStarRail",
            API: "https://sg-public-api.hoyolab.com/event/luna/os/sign?act_id=e202303301540311",
            Page: "https://act.hoyolab.com/bbs/event/signin/hkrpg/index.html?act_id=e202303301540311",
            verifyStatus: (Name, { retcode }) => {
                retcode === 0 ? Qmsg.success(`${Name} 簽到成功`) : retcode === -5003 ? Qmsg.info(`${Name} 已經簽到`) : Qmsg.error(`${Name} 簽到失敗`)
            }
        },
        {
            Name: "HonkaiImpact3rd",
            API: "https://sg-public-api.hoyolab.com/event/mani/sign?act_id=e202110291205111",
            Page: "https://act.hoyolab.com/bbs/event/signin-bh3/index.html?act_id=e202110291205111",
            verifyStatus: (Name, { retcode }) => {
                retcode === 0 ? Qmsg.success(`${Name} 簽到成功`) : retcode === -5003 ? Qmsg.info(`${Name} 已經簽到`) : Qmsg.error(`${Name} 簽到失敗`)
            }
        },
        // {
        //     Name: "ZenlessZoneZero",
        //     API: "https://sg-public-api.hoyolab.com/event/luna/zzz/os/sign?act_id=e202406031448091",
        //     Page: "https://act.hoyolab.com/bbs/event/signin/zzz/e202406031448091.html?act_id=e202406031448091",
        //     verifyStatus: (Name, { retcode }) => {
        //         retcode === 0 ? Qmsg.success(`${Name} 簽到成功`) : retcode === -5003 ? Qmsg.info(`${Name} 已經簽到`) : Qmsg.error(`${Name} 簽到失敗`)
        //     }
        // },
        {
            Name: "LeveCheckIn",
            API: "https://api-pass.levelinfinite.com/api/rewards/proxy/lipass/Points/DailyCheckIn?task_id=15",
            Page: "https://pass.levelinfinite.com/rewards?points=/points/",
            verifyStatus: (Name, { code }) => {
                code === 0 ? Qmsg.success(`${Name} 簽到成功`) : code === 1001009 ? Qmsg.info(`${Name} 已經簽到`) : Qmsg.error(`${Name} 簽到失敗`)
            }
        },
        {
            Name: "LeveStageCheckIn",
            API: "https://api-pass.levelinfinite.com/api/rewards/proxy/lipass/Points/DailyStageCheckIn?task_id=58",
            Page: "https://pass.levelinfinite.com/rewards?points=/points/sign-in",
            verifyStatus: (Name, { code }) => {
                code === 0 ? Qmsg.success(`${Name} 簽到成功`) : code === 1001009 || code === 1002007 ? Qmsg.info(`${Name} 已經簽到`) : Qmsg.error(`${Name} 簽到失敗`)
            }
        }
    ];

    'use strict';

    // 建立簽到請求
    function CreateRequest({ Name, API, verifyStatus }) {

        const deBug = (Result) => {
            console.table(Object.assign({name: Name}, Result));
        };

        return {
            Run: () => {
                let CheckIn = undefined;

                try {
                    CheckIn = Qmsg.loading(`${Name} 簽到中`);
                } catch (error) {}

                GM_xmlhttpRequest({
                    method: "POST",
                    url: API,
                    onload: (response) => {
                        const Result = JSON.parse(response.response);
                        deBug(Result);

                        CheckIn?.close();
                        if (response.status === 200) {
                            verifyStatus(Name, Result);
                        } else {
                            Qmsg.error(`${Name} 簽到失敗`);
                        }
                    },
                    onerror: (response) => {
                        deBug(JSON.parse(response.response));

                        CheckIn?.close();
                        Qmsg.error(`${Name} 簽到失敗`);
                    }
                })
            }
        }
    };

    const ListenerRecord = new WeakMap();
    Object.assign(EventTarget.prototype, {
        onEvent(type, listener, options = {}) {
            const record = ListenerRecord.get(this);
            if (record?.has(type)) return;
            this.addEventListener(type, listener, options);
            if (!record) ListenerRecord.set(this, new Map());
            ListenerRecord.get(this).set(type, listener);
        },
        offEvent(type) {
            const listen = ListenerRecord.get(this)?.get(type);
            if (!listen) return;
            this.removeEventListener(type, listen);
            ListenerRecord.get(this).delete(type);
        }
    });

    const RegisterTask = (()=> {
        let Stop = false;
        let Registered = false;

        let Timers = null; // 任務定時器
        let Listeners = null; // 變化監聽器

        // 銷毀所有定時器與詢輪, 並重置註冊狀態
        async function DestroyReset() {
            Stop = true;
            clearTimeout(Timers);
            document.offEvent("visibilitychange");
            GM_removeValueChangeListener(Listeners);

            // 恢復預設狀態
            requestIdleCallback(()=> {
                Stop = false;
                Registered = false;
            })
        };

        // 註冊變化監聽器
        async function Listener(name) {
            Listeners = GM_addValueChangeListener(name, function(key, old_value, new_value, remote) {
                if (remote) { // 來自其他窗口修改
                    DestroyReset();
                    console.log("舊詢輪已被停止");
                }
            })
        };

        // 顯示觸發時間
        function DisplayTrigger(newDate, CheckInDate) {
            if (!Config.Dev) return;

            const ms = CheckInDate - newDate;
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

            console.log(`任務觸發還剩: ${hour} 小時 ${minute} 分鐘 ${seconds} 秒`);
        };

        // 格式化時間
        function TimeFormat(time) {
            const year = time.getFullYear();
            const month = `${time.getMonth() + 1}`.padStart(2, "0");
            const date = `${time.getDate()}`.padStart(2, "0");
            const hour = `${time.getHours()}`.padStart(2, "0");
            const minute = `${time.getMinutes()}`.padStart(2, "0");
            const second = `${time.getSeconds()}`.padStart(2, "0");
            return `${year}/${month}/${date} ${hour}:${minute}:${second}`;
        };

        // 判斷是否是前一天
        function isPrevious(newDate, oldDate) {
            const oldMs = Date.UTC(oldDate.getFullYear(), oldDate.getMonth(), oldDate.getDate());
            const newMs = Date.UTC(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
            return oldMs < newMs;
        };

        // 計算簽到時間
        function CheckInTime(newDate) {
            const tomorrow = new Date();
            tomorrow.setDate(newDate.getDate() + 1); // 設置隔天時間
            tomorrow.setHours(0, 0, 3, 0); // 00:03
            return tomorrow;
        };

        // 更新記錄
        function SetNewRecord(newDate) {
            GM_setValue(Config.TimerKey, {
                RecordTime: TimeFormat(newDate),
                CheckInTime: TimeFormat(CheckInTime(newDate))
            })
        };

        // 任務詢輪
        function Query(newDate = new Date()) {
            if (Stop) return;

            const Tasks = GM_getValue(Config.TaskKey, []); // 取得任務列表

            // 料表類型錯誤, 直接複寫空陣列
            if (!Array.isArray(Tasks)) {
                GM_setValue(Config.TaskKey, []);

                Config.Dev && console.log("錯誤的任務列表, 詢輪已被停止");
                return;
            };

            // 沒有任務不執行 (並清除不需要的值)
            if (Tasks.length === 0) {
                GM_deleteValue(Config.TaskKey);
                GM_deleteValue(Config.TimerKey);
                GM_deleteValue(Config.RegisterKey);

                DestroyReset();
                Config.Dev && console.log("沒有任務, 詢輪已被停止");
                return;
            };

            try {
                const TaskTimer = GM_getValue(Config.TimerKey); // 取得任務時間

                if (TaskTimer) {
                    const CheckInDate = TaskTimer['CheckInTime']; // 主要驗證
                    const RecordDate = TaskTimer['RecordTime']; // 附加驗證 (非必要)

                    if (
                        navigator.onLine && newDate > new Date(CheckInDate) // 有網路時, 當前時間 > 簽到時間
                        || RecordDate && isPrevious(newDate, new Date(RecordDate)) // 判斷紀錄時間是前一天
                    ) { // 執行簽到
                        let Index = 0;
                        const EnabledTask = new Set(Tasks);

                        for (const Task of Task_List) {
                            if (!EnabledTask.has(Task.Name)) continue; // 判斷是否啟用

                            setTimeout(() => {
                                CreateRequest(Task).Run();
                            }, Math.max(Index++ * 2000)); // 每個任務間隔 2 秒
                        }

                        SetNewRecord(newDate); // 更新記錄
                    } else DisplayTrigger(newDate, new Date(CheckInDate));

                } else throw new Error("沒有時間戳記錄");
            } catch {
                SetNewRecord(newDate);
            };

            Timers = setTimeout(Query, 1e4); // 10 秒詢輪
        };

        return {
            Register: () => {
                if (Registered || !navigator.onLine) return; // 禁止重複 與 離線註冊
                Registered = true;

                GM_setValue(Config.RegisterKey, TimeFormat(new Date())); // 紀錄註冊時間
                Listener(Config.RegisterKey); // 監聽註冊時間變化
                Query(); // 開始檢測

                document.onEvent("visibilitychange", () => {
                    if (document.visibilityState === "visible") {
                        clearTimeout(Timers); // 清除舊的定時器
                        Query(); // 重新檢測
                    }
                });

            }
        }
    })();

    (()=> {

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
        function DoubleClickConfirm(callback, delay) {
            let lastTime = 0;
            let timerId;

            return function(...args) {
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
        const GetEnabledTask = () => new Set(GM_getValue(Config.TaskKey, []));
        // 根據版本號判斷菜單是否自動關閉
        const autoClose = !!(isVersionGreater(GM_info.version ?? "5.3.0", "5.3.0"));

        // 透過菜單啟用任務
        async function EnableTask() {
            const EnabledTask = GetEnabledTask();

            // 有任務時註冊
            if (EnabledTask.size > 0) {
                RegisterTask.Register();
            };

            for (const [Index, Task] of Task_List.entries()) {
                const Icon = EnabledTask.has(Task.Name) ? "🟢" : "🔴";

                GM_registerMenuCommand(`${Icon} ${Task.Name}`, DoubleClickConfirm((Open) => {

                    if (Open) {
                        const Url = Task['Page'];
                        isValidURL(Url) && window.open(Url);
                        return;
                    };

                    const EnabledTask = GetEnabledTask();
                    EnabledTask.has(Task.Name)
                        ? EnabledTask.delete(Task.Name)
                        : EnabledTask.add(Task.Name);
                    GM_setValue(Config.TaskKey, [...EnabledTask]);

                    EnableTask(); // 遞迴更新狀態
                }, 200), {
                    id: `CheckIn-${Index}`,
                    autoClose
                })

            }
        };

        EnableTask();
    })();

})();