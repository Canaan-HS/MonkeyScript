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
// @grant        GM_cookie
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
    // const CheckIn = Qmsg.loading("開始簽到", {
        // onClose: ()=> {
            // Qmsg.success("簽到成功");
            // Qmsg.warning("已經簽到");
            // Qmsg.error("簽到失敗");
        // } 
    // });

    // setTimeout(()=> {
        // CheckIn.close();
    // }, 2500);

    const GetShowTime = (()=> {
        const [
            day_ms, minute_ms, seconds_ms
        ] = [
            (24 * 60 ** 2 * 1e3), (60 ** 2 * 1e3), (60 * 1e3)
        ];
        return {
            TimeFormat: (ms) => { // 將 (毫秒) 格式化
                const [
                    hour, minute, seconds,
                ] = [
                    Math.floor((ms % day_ms) / minute_ms),
                    Math.floor((ms % minute_ms) / seconds_ms),
                    Math.floor((ms % seconds_ms) / 1e3)
                ];
                return `任務觸發還剩: ${hour} 小時 ${minute} 分鐘 ${seconds} 秒`;
            }  
        }
    })();

    const RegisterTask = (()=> {
        const Dev = false;
        const Display = true;
        const Listeners = new Map();

        // 計算當前 到凌晨的差時
        function TimeDiff() {
            const now = new Date(); // 當前時間
            const tomorrow = new Date(); // 設置隔天時間
            tomorrow.setDate(now.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            return (tomorrow - now);
        };

        // 銷毀先前的定時器
        async function RepeatDestroy(name, timer) {
            const Listener = GM_addValueChangeListener(name, function(key, old_value, new_value, remote) {
                if (remote) { // 來自其他窗口修改
                    clearTimeout(timer);
                    GM_removeValueChangeListener(Listeners.get(name));
                    console.log(`舊任務 ${name} 已被清除`);
                }
            })

            Listeners.set(name, Listener);
        };

        return {
            Register: (task) => {
                const task_name = task.name;
                const record = GM_getValue(task_name, 0); // 嘗試取得舊任務紀錄

                if (record < 0) task(); // 當先前紀錄過期, 直接觸發

                const wait_diff = Dev ? 0 : TimeDiff(); // 取得差時 (開發模式為 0)
                const timer = setTimeout(()=> {
                    task(); // 調用任務
                    GM_deleteValue(task_name);
                    GM_removeValueChangeListener(Listeners.get(task_name));
                    Listeners.delete(task_name);
                }, wait_diff);

                if (Display) {
                    console.group(`註冊簽到任務: ${task_name}`);
                    console.log(GetShowTime.TimeFormat(wait_diff));
                    console.groupEnd();
                };

                GM_setValue(task_name, wait_diff); // 註冊新任務時間
                RepeatDestroy(task_name, timer); // 銷毀先前註冊
            }
        }
    })();

    const CheckInTask = (()=> {
        // 目前擁有的任務列表
        const Task_List = [
            {
                Name: "GenshInimpact",
                Url: "https://act.hoyolab.com/ys/event/signin-sea-v3/index.html?act_id=e202102251931481",
                API: "https://sg-hk4e-api.hoyolab.com/event/sol/sign?act_id=e202102251931481"
            },
            {
                Name: "HonkaiStarRail",
                Url: "https://act.hoyolab.com/bbs/event/signin/hkrpg/index.html?act_id=e202303301540311",
                API: "https://sg-public-api.hoyolab.com/event/luna/os/sign?act_id=e202303301540311"
            },
            {
                Name: "ZenlessZoneZero",
                Url: "https://act.hoyolab.com/bbs/event/signin/zzz/e202406031448091.html?act_id=e202406031448091",
                API: "https://sg-public-api.hoyolab.com/event/luna/zzz/os/sign?act_id=e202406031448091"
            }
        ];

        // 目前正式版無法細部驗證
        function VerifyHoyolab() {
            const Cookie = GM_getValue("Hoyolab_Cookie");
            return Cookie;
            // 需要 httpOnly 的, 目前只支援 BETA 版本
            // GM_cookie("list", {
                // httpOnly: true,
                // domain: ".hoyolab.com"
            // }, (cookies) => {
                // for (const cookie of cookies) {
                    // const name = cookie.name;
                    // if (name === "ltmid_v2" || name === "ltoken_v2") {
                        // console.log(cookies);
                    // }
                // }
            // });
        };

        // 開啟對應頁面
        async function OpenPage(Name, Url) {
            const yes = confirm(`是否開啟 ${Name} 簽到頁面, 填寫 Cookie？`);
            yes && window.open(Url);
        };

        const getStatus = (key) => GM_getValue(key) ? "🟢" : "🔴";
        // 創建菜單
        async function CreateMenu() {
            const Hoyolab = VerifyHoyolab();

            GM_registerMenuCommand("添加 Cookie", ()=> {

            });

            for (const Task of Task_List) {
                const Statu = Hoyolab ? getStatus(Task.Name) : "🔴";
                GM_registerMenuCommand(`${Statu} ${Task.Name}`, ()=> {
                    if (!Hoyolab) {
                        OpenPage(Task.Name, Task.Url);
                        return;
                    };

                }, {close: false});
            };
        };

        return {CreateMenu};
    })();

    CheckInTask.CreateMenu();
})();