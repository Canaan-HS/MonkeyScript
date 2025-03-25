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

    const Task_List = [
        {
            Name: "GenshInimpact", // 任務名
            verifyLogin: "Hoyolab_Verified", // 驗證登入狀態
            API: "https://sg-hk4e-api.hoyolab.com/event/sol/sign?act_id=e202102251931481", // 簽到 API
            Url: "https://act.hoyolab.com/ys/event/signin-sea-v3/index.html?act_id=e202102251931481", // 簽到網址
            verifyStatus: (Name, { retcode }) => { // 驗證邏輯 Name: 任務名, { 要解構物件的值 }
                retcode === 0 ? Qmsg.success(`${Name} 簽到成功`) : retcode === -5003 ? Qmsg.info(`${Name} 已經簽到`) : Qmsg.error(`${Name} 簽到失敗`)
            }
        },
        {
            Name: "HonkaiStarRail",
            verifyLogin: "Hoyolab_Verified",
            API: "https://sg-public-api.hoyolab.com/event/luna/os/sign?act_id=e202303301540311",
            Url: "https://act.hoyolab.com/bbs/event/signin/hkrpg/index.html?act_id=e202303301540311",
            verifyStatus: (Name, { retcode }) => {
                retcode === 0 ? Qmsg.success(`${Name} 簽到成功`) : retcode === -5003 ? Qmsg.info(`${Name} 已經簽到`) : Qmsg.error(`${Name} 簽到失敗`)
            }
        },
        {
            Name: "HonkaiImpact3rd",
            verifyLogin: "Hoyolab_Verified",
            API: "https://sg-public-api.hoyolab.com/event/mani/sign?act_id=e202110291205111",
            Url: "https://act.hoyolab.com/bbs/event/signin-bh3/index.html?act_id=e202110291205111",
            verifyStatus: (Name, { retcode }) => {
                retcode === 0 ? Qmsg.success(`${Name} 簽到成功`) : retcode === -5003 ? Qmsg.info(`${Name} 已經簽到`) : Qmsg.error(`${Name} 簽到失敗`)
            }
        },
        {
            Name: "ZenlessZoneZero",
            verifyLogin: "Hoyolab_Verified",
            API: "https://sg-public-api.hoyolab.com/event/luna/zzz/os/sign?act_id=e202406031448091",
            Url: "https://act.hoyolab.com/bbs/event/signin/zzz/e202406031448091.html?act_id=e202406031448091",
            verifyStatus: (Name, { retcode }) => {
                retcode === 0 ? Qmsg.success(`${Name} 簽到成功`) : retcode === -5003 ? Qmsg.info(`${Name} 已經簽到`) : Qmsg.error(`${Name} 簽到失敗`)
            }
        },
        {
            Name: "LeveCheckIn",
            verifyLogin: "Levelinfinite_Verified",
            API: "https://api-pass.levelinfinite.com/api/rewards/proxy/lipass/Points/DailyCheckIn?task_id=15",
            Url: "https://pass.levelinfinite.com/rewards?points=/points/",
            verifyStatus: (Name, { code }) => {
                code === 0 ? Qmsg.success(`${Name} 簽到成功`) : code === 1001009 ? Qmsg.info(`${Name} 已經簽到`) : Qmsg.error(`${Name} 簽到失敗`)
            }
        },
        {
            Name: "LeveStageCheckIn",
            verifyLogin: "Levelinfinite_Verified",
            API: "https://api-pass.levelinfinite.com/api/rewards/proxy/lipass/Points/DailyStageCheckIn?task_id=58",
            Url: "https://pass.levelinfinite.com/rewards?points=/points/sign-in",
            verifyStatus: (Name, { code }) => {
                code === 0 ? Qmsg.success(`${Name} 簽到成功`) : code === 1001009 || code === 1002007 ? Qmsg.info(`${Name} 已經簽到`) : Qmsg.error(`${Name} 簽到失敗`)
            }
        }
    ];

    const Config = {
        Dev: false, // 正常使用不要開啟
        Console: true
    };

    function CreateRequest({ Name, API, verifyStatus }) {
        return {
            Request: () => {
                const CheckIn = Qmsg.loading(`${Name} 簽到中`);

                GM_xmlhttpRequest({
                    method: "POST",
                    url: API,
                    onload: (response) => {
                        CheckIn.close();
                        const result = JSON.parse(response.response);

                        if (response.status === 200) {
                            verifyStatus(Name, result);
                        } else {
                            Qmsg.error(`${Name} 簽到失敗`);
                        }

                        console.table(Object.assign({name: Name}, result));
                    },
                    onerror: (response) => {
                        CheckIn.close();
                        Qmsg.error(`${Name} 簽到失敗`);

                        console.table(Object.assign({name: Name}, JSON.parse(response.response)));
                    }
                })
            }
        }
    };

    const RegisterTask = (()=> {
        const Timers = new Map(); // 任務定時器
        const Listeners = new Map(); // 變化監聽器

        const [
            day_ms, minute_ms, seconds_ms
        ] = [
            (24 * 60 ** 2 * 1e3), (60 ** 2 * 1e3), (60 * 1e3)
        ];

        // 計算當前 到凌晨的差時
        function TimeDiff(now) {
            const tomorrow = new Date(); // 設置隔天時間
            tomorrow.setDate(now.getDate() + 5); // 00:05
            tomorrow.setHours(0, 0, 0, 0);
            return (tomorrow - now);
        };

        // 格式化時間
        function TimeFormat(time) {
            const year = time.getFullYear();
            const month = `${time.getMonth() + 1}`.padStart(2, "0");
            const date = `${time.getDate()}`.padStart(2, "0");
            const hour = `${time.getHours()}`.padStart(2, "0");
            const minute = `${time.getMinutes()}`.padStart(2, "0");
            const second = `${time.getSeconds()}`.padStart(2, "0");
            return `${year}-${month}-${date} ${hour}:${minute}:${second}`;
        };

        // 計算觸發時間
        function TriggerTime(ms) {
            const [
                hour, minute, seconds,
            ] = [
                Math.floor((ms % day_ms) / minute_ms),
                Math.floor((ms % minute_ms) / seconds_ms),
                Math.floor((ms % seconds_ms) / 1e3)
            ];

            return `任務觸發還剩: ${hour} 小時 ${minute} 分鐘 ${seconds} 秒`;
        };

        // 刪除定時器, 刪除註冊值 (可選)
        async function RemoveTimers(task_name, delValue = false) {
            clearTimeout(Timers.get(task_name));
            Timers.delete(task_name);
            delValue && GM_deleteValue(task_name);
        };

        // 刪除變化監聽器
        async function RemoveListeners(task_name) {
            GM_removeValueChangeListener(Listeners.get(task_name));
            Listeners.delete(task_name);
        };

        // 註冊變化監聽器
        async function Listener(task_name) {
            const listener = GM_addValueChangeListener(task_name, function(key, old_value, new_value, remote) {
                if (remote) { // 來自其他窗口修改
                    // 銷毀先前的定時器
                    RemoveTimers(task_name);
                    RemoveListeners(task_name);
                    console.log(`任務 ${task_name} 已被清除`);
                }
            })

            Listeners.set(task_name, listener);
        };

        return {
            Destroy: (task_name) => {
                RemoveListeners(task_name);
                RemoveTimers(task_name, true);
                console.log(`任務 ${task_name} 已被停止`);
            },
            Register: (task_name, task_func) => {
                if (Timers.has(task_name)) return; // 禁止重複註冊

                const now = new Date();

                const task_delay = Timers.size * 2e3; // 根據註冊數量 + 2 秒
                const wait_diff = (Config.Dev ? 1e4 : TimeDiff(now)) + task_delay; // 取得差時 (開發模式差時為 10 秒)
                const old_record = new Date(GM_getValue(task_name, now)); // 嘗試取得舊任務紀錄
                const new_record = new Date(now + wait_diff);

                // 當先前紀錄過期, 註冊延遲後觸發
                if ((now - old_record) >= wait_diff) {
                    setTimeout(task_func, task_delay);
                };

                // 紀錄新的時間
                GM_setValue(task_name, TimeFormat(new_record));

                // 創建計時器並保存
                Timers.set(task_name, setTimeout(()=> {
                    task_func(); // 調用任務
                    RemoveListeners(task_name);
                    RemoveTimers(task_name, true);
                }, wait_diff));

                if (Config.Console) {
                    console.group(`註冊簽到任務: ${task_name}`);
                    console.log(TriggerTime(wait_diff));
                    console.groupEnd();
                };

                // 註冊新的監聽器
                Listener(task_name);
            }
        }
    })();

    (()=> {

        // 開啟對應頁面
        async function OpenPage(Name, Url) {
            const yes = confirm(`是否開啟 ${Name} 簽到頁面, 確認登入狀態？`);
            yes && window.open(Url);
        };

        // 透過菜單啟用任務
        async function EnableTask() {
            for (const [index, Task] of Task_List.entries()) {

                const Status = GM_getValue(`${Task.Name}_Enabled`);
                const Icon = Status ? "🟢" : "🔴";

                // 啟用的, 直接註冊
                if (Status) {
                    RegisterTask.Register(
                        Task.Name, CreateRequest(Task).Request
                    )
                };

                GM_registerMenuCommand(`${Icon} ${Task.Name}`, ()=> {
                    if (!GM_getValue(Task.verifyLogin)) { // 還未驗證的
                        OpenPage(Task.Name, Task.Url);
                        GM_setValue(Task.verifyLogin, true); // 註冊驗證 Key
                    };

                    const Status = GM_getValue(`${Task.Name}_Enabled`);
                    if (Status) { // 當前啟用的, 所以進行關閉任務
                        GM_setValue(`${Task.Name}_Enabled`, false);
                        RegisterTask.Destroy(Task.Name);
                    } else { // 當前未啟用的, 所以進行啟用任務
                        GM_setValue(`${Task.Name}_Enabled`, true);
                    }

                    EnableTask(); // 遞迴更新狀態
                }, {
                    id: `CheckIn-${index}`,
                    autoClose: false
                });

            };
        };

        EnableTask();
    })();

})();