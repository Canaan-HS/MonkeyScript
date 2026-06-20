// ==UserScript==
// @name         [E/Ex-Hentai] AutoLogin
// @name:zh-TW   [E/Ex-Hentai] 自動登入
// @name:zh-CN   [E/Ex-Hentai] 自动登入
// @name:ja      [E/Ex-Hentai] 自動ログイン
// @name:ko      [E/Ex-Hentai] 자동 로그인
// @name:ru      [E/Ex-Hentai] Автоматический вход
// @name:en      [E/Ex-Hentai] AutoLogin
// @version      2026.04.26
// @author       Canaan HS
// @description         E/Ex - 自動獲取 Cookies、手動輸入 Cookies、本地備份以及查看備份，自動檢測登入
// @description:zh-TW   E/Ex - 自動獲取 Cookies、手動輸入 Cookies、本地備份以及查看備份，自動檢測登入
// @description:zh-CN   E/Ex - 自动获取 Cookies、手动输入 Cookies、本地备份以及查看备份，自动检测登录
// @description:ja      E/Ex - クッキーの手動入力、ローカルバックアップおよびバックアップの表示、自動ログイン検出
// @description:ko      E/Ex - 자동으로 쿠키 가져오기, 쿠키 수동 입력, 로컬 백업 및 백업 보기, 자동 로그인 감지
// @description:ru      E/Ex - автоматическое получение cookies, ручной ввод cookies, локальное резервное копирование и просмотр резервных копий, автоматическое определение входа
// @description:en      E/Ex - automatic cookie retrieval, manual cookie input, local backup, and backup viewing, automatic login detection

// @noframes
// @connect      *
// @match        *://e-hentai.org/*
// @match        *://exhentai.org/*
// @icon         https://e-hentai.org/favicon.ico

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635
// @supportURL   https://github.com/Canaan-HS/MonkeyScript/issues

// @require      https://update.greasyfork.org/scripts/487608/1647211/SyntaxLite_min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.19.0/js/md5.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js

// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery-jgrowl/1.5.1/jquery.jgrowl.min.js
// @resource     jgrowl-css https://cdnjs.cloudflare.com/ajax/libs/jquery-jgrowl/1.5.1/jquery.jgrowl.min.css

// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_addValueChangeListener

// @run-at       document-start
// ==/UserScript==

(async () => {
    const domain = Lib.$domain;
    const { Transl } = Language();

    (async function ImportStyle() {
        let show_style, button_style, button_hover, jGrowl_style, acc_style;
        if (domain === "e-hentai.org") {
            button_hover = "color: #8f4701;"
            jGrowl_style = "background-color: #5C0D12; color: #fefefe;"
            show_style = "background-color: #fefefe; border: 3px ridge #34353b;"
            acc_style = "color: #5C0D12; background-color: #fefefe; border: 2px solid #B5A4A4;"
            button_style = "color: #5C0D12; border: 2px solid #B5A4A4; background-color: #fefefe;"
        } else if (domain === "exhentai.org") {
            button_hover = "color: #989898;"
            jGrowl_style = "background-color: #fefefe; color: #5C0D12;"
            show_style = "background-color: #34353b; border: 2px ridge #5C0D12;"
            acc_style = "color: #f1f1f1; background-color: #34353b; border: 2px solid #8d8d8d;"
            button_style = "color: #fefefe; border: 2px solid #8d8d8d; background-color: #34353b;"
            Lib.addStyle(`
                body {
                    padding: 2px;
                    color: #f1f1f1;
                    text-align: center;
                    background: #34353b;
                }
            `);
        };
        Lib.addStyle(`
            ${GM_getResourceText("jgrowl-css")}
            .jGrowl {
                ${jGrowl_style}
                top: 2rem;
                left: 50%;
                width: auto;
                z-index: 9999;
                font-size: 1.3rem;
                border-radius: 2px;
                text-align: center;
                white-space: nowrap;
                transform: translateX(-50%);
            }
            .modal-background {
                top: 50%;
                left: 50%;
                opacity: 0;
                width: 100%;
                height: 100%;
                z-index: 8888;
                overflow: auto;
                position: fixed;
                transition: 0.6s ease;
                background-color: rgba(0,0,0,0);
                transform: translate(-50%, -50%) scale(0.3);
            }
            .acc-modal {
                ${show_style}
                width: 18%;
                overflow: auto;
                margin: 11rem auto;
                border-radius: 10px;
            }
            .acc-select-flex {
                display: flex;
                align-items: center;
                flex-direction: initial;
                justify-content: space-around;
            }
            .acc-button-flex {
                display: flex;
                padding: 0 0 15px 0;
                justify-content: center;
            }
            .acc-select {
                ${acc_style}
                padding: 4px;
                min-width: 10rem;
                margin: 1.1rem 1.4rem 1.5rem 1.4rem;
                font-weight: bold;
                cursor: pointer;
                font-size: 1.2rem;
                text-align: center;
                border-radius: 5px;
            }
            .show-modal {
                ${show_style}
                width: 25%;
                padding: 1.5rem;
                overflow: auto;
                margin: 5rem auto;
                text-align: left;
                border-radius: 10px;
                border-collapse: collapse;
            }
            .modal-button {
                ${button_style}
                top: 0;
                margin: 3% 2%;
                font-size: 14px;
                font-weight: bold;
                border-radius: 3px;
            }
            .modal-button:hover, .modal-button:focus {
                ${button_hover}
                cursor: pointer;
                text-decoration: none;
            }
            .set-modal {
                ${show_style}
                width: 30%;
                padding: 0.3rem;
                overflow: auto;
                border-radius: 10px;
                text-align: center;
                border-collapse: collapse;
                margin: 2% auto 8px auto;
            }
            .set-box {
                display: flex;
                margin: 0.6rem;
                font-weight: bold;
                flex-direction: column;
                align-items: flex-start;
            }
            .set-list {
                width: 95%;
                font-weight: 550;
                font-size: 1.1rem;
                text-align: center;
            }
            hr {
                width: 98%;
                opacity: 0.2;
                border: 1px solid;
                margin-top: 1.3rem;
            }
            label {
                margin: 0.4rem;
                font-size: 0.9rem;
            }
            .cancelFavorite {
                float: left;
                cursor: pointer;
                font-size: 1.7rem;
                padding: 10px 0 0 20px;
            }
            .cancelFavorite:hover {
                opacity: 0.5;
            }
            .addFavorite {
                float: left;
                cursor: pointer;
                font-size: 1.7rem;
                padding: 10px 0 0 20px;
                transition: transform 0.2s ease;
            }
            .addFavorite:hover {
                animation: heartbeat 1.5s infinite;
            }
            @keyframes heartbeat {
                0% {
                    transform: scale(1);
                }
                25% {
                    transform: scale(1.1);
                }
                50% {
                    transform: scale(1);
                }
                75% {
                    transform: scale(1.1);
                }
                100% {
                    transform: scale(1);
                }
            }
            .lc {
                padding: 1rem 0 !important;
            }
            .unFavorite {
                font-size: 2rem;
                position: relative;
                display: inline-block;
                transition: transform 0.2s ease;
            }
            .unFavorite:hover {
                animation: shake 0.8s ease-in-out infinite;
            }
            @keyframes shake {
                0% {
                    left: 0;
                }
                25% {
                    left: -5px;
                }
                50% {
                    left: 5px;
                }
                75% {
                    left: -5px;
                }
                100% {
                    left: 0;
                }
            }
        `, "AutoLogin-Style");
    })();

    (async function Main($Cookie, $Shared) {
        let Share = Lib.getV("Share", {});

        // 新版數據轉換
        if (typeof Share === "string") {
            Share = JSON.parse(Share);
        };

        // 頁面匹配
        const url = Lib.$url;
        const Post_Page = /https:\/\/[^\/]+\/g\/\d+\/[a-zA-Z0-9]+/;
        const Favorites_Page = /https:\/\/[^\/]+\/favorites.php/;

        /* ---------- 菜單切換與創建 ---------- */

        /* 創建菜單 */
        const CreateMenu = async (Modal) => {
            Lib.$q(".modal-background")?.remove();
            $("body").append(Modal.replace(/>\s+</g, '><'));
            requestAnimationFrame(() => {
                $(".modal-background").css({
                    "opacity": "1",
                    "background-color": "rgba(0,0,0,0.7)",
                    "transform": "translate(-50%, -50%) scale(1)"
                })
            })
        };

        /* 刪除菜單 */
        const DeleteMenu = async () => {
            const modal = $(".modal-background");
            modal.css({
                "opacity": "0",
                "pointer-events": "none",
                "background-color": "rgba(0,0,0,0)",
                "transform": "translate(-50%, -50%) scale(0)"
            });
            setTimeout(() => { modal.remove() }, 1300);
        };

        /* 創建延伸菜單 */
        const Expand = async () => {
            Lib.regMenu({
                [Transl("📜 自動獲取")]: AutoGetCookie,
                [Transl("📝 手動輸入")]: ManualSetting,
                [Transl("🔍 查看保存")]: ViewSaveCookie,
                [Transl("🔃 手動注入")]: CookieInjection,
                [Transl("🗑️ 清除登入")]: ClearLogin,
            }, { name: "Expand" })
        };

        /* 刪除延伸菜單 */
        const Collapse = async () => {
            for (let i = 1; i <= 5; i++) { Lib.unMenu("Expand-" + i) }
        };

        /* 切換開合菜單 */
        const MenuToggle = async () => {
            const state = Lib.getV("Expand", false),
                disp = state ? Transl("📁 摺疊菜單") : Transl("📂 展開菜單");

            Lib.regMenu({
                [disp]: {
                    func: () => {
                        state
                            ? Lib.setV("Expand", false)
                            : Lib.setV("Expand", true);
                        MenuToggle();
                    }, hotkey: "c", close: false
                }
            }, { name: "Switch" });

            //? 開合需要比切換菜單晚創建, 不然會跑版
            state ? Expand() : Collapse();
        };

        /* ---------- 登入檢測 與 入口點 ---------- */

        /* 自動檢測登陸 */
        const LoginToggle = async () => {
            const cookie = Boolean(Lib.getJV("E/Ex_Cookies"));
            const state = Lib.getV("Login", cookie); // 有 Cookie 預設為啟用
            const disp = state ? Transl("🟢 啟用檢測") : Transl("🔴 禁用檢測");

            Lib.regMenu({
                [disp]: {
                    func: () => {
                        if (state) Lib.setV("Login", false)
                        else if (cookie) Lib.setV("Login", true)
                        else {
                            alert(Transl("無保存的 Cookie, 無法啟用自動登入"));
                            return;
                        };

                        LoginToggle();
                    }, close: false
                }
            }, { name: "Check" });

            //? 選擇檢測狀態後, 會重新創建選單, 避免跑板因此同樣重新創建下方菜單 (兼容舊版本插件的寫法)
            Lib.regMenu({ [Transl("🍪 共享登入")]: SharedLogin });
            MenuToggle();
        };

        /* 監聽選單切換, 全局套用 */
        const GlobalMenuToggle = async () => {
            Lib.storeListen(["Login", "Expand"], listen => {
                listen.far && LoginToggle();
            })
        };

        /* 入口注射 */
        async function Injection() {
            const cookie = Lib.getJV("E/Ex_Cookies"); // 嘗試取得 Cookie
            const login = Lib.getV("Login", Boolean(cookie)); // 取得是否自動登入

            if (login && cookie) {
                let CurrentTime = new Date();
                let DetectionTime = Lib.local("DetectionTime");

                DetectionTime = DetectionTime ? new Date(DetectionTime) : new Date(CurrentTime.getTime() + 11 * 60 * 1000);

                const Conversion = Math.abs(DetectionTime - CurrentTime) / (1000 * 60); // 轉換時間 (舊版相容, 使用 abs)
                if (Conversion >= 10) $Cookie.Verify(cookie); // 隔 10 分鐘檢測
            }

            if (Post_Page.test(url)) CreateFavoritesButton();
            else if (Favorites_Page.test(url)) AddCustomFavorites();

            /* 創建選單 */
            LoginToggle();
            GlobalMenuToggle();
        };

        /* ---------- 菜單核心功能 ---------- */

        /* 共享號登入 */
        async function SharedLogin() {
            const Igneous = $Cookie.Get().igneous; // 取得當前登入的帳號
            const AccountQuantity = Object.keys(Share).length; // 取得共享號數量

            // 創建選項模板
            let Select = $(`<select id="account-select" class="acc-select"></select>`), Value;
            for (let i = 1; i <= AccountQuantity; i++) { // 判斷選擇值
                if (Share[i][0].value === Igneous) Value = i;
                Select.append($("<option>").attr({ value: i }).text(`${Transl("帳戶")} ${i}`));
            }

            CreateMenu(`
                <div class="modal-background">
                    <div class="acc-modal">
                        <h1>${Transl("帳戶選擇")}</h1>
                        <div class="acc-select-flex">${Select.prop("outerHTML")}</div>
                        <div class="acc-button-flex">
                            <button class="modal-button" id="update">${Transl("更新")}</button>
                            <button class="modal-button" id="login">${Transl("登入")}</button>
                        </div>
                    </div>
                </div>
            `);

            if (AccountQuantity === 0) {
                Growl(Transl("首次使用請先更新"), "jGrowl", 2500);
                $("#account-select").append($("<option>")).prop("disabled", true);
            } else if (Value) $("#account-select").val(Value); // 如果有選擇值, 就進行選取

            $(".modal-background").on("click", function (click) {
                click.stopImmediatePropagation();
                const target = click.target;

                if (target.id === "login") {
                    $Cookie.ReAdd(Share[+$("#account-select").val()]);
                } else if (target.id === "update") {
                    $Shared.Update().then(Data => {
                        if (Data) {
                            Share = Data;
                            Lib.setJV("Share", Data);
                            setTimeout(SharedLogin, 600);
                        }
                    })
                } else if (target.className === "modal-background") {
                    DeleteMenu();
                }
            })
        };

        /* 展示自動獲取 Cookies */
        async function Cookie_Show(cookies) {
            CreateMenu(`
                <div class="modal-background">
                    <div class="show-modal">
                    <h1 style="text-align: center;">${Transl("確認選擇的 Cookies")}</h1>
                        <pre><b>${JSON.stringify(cookies, null, 4)}</b></pre>
                        <div style="text-align: right;">
                            <button class="modal-button" id="save">${Transl("確認保存")}</button>
                            <button class="modal-button" id="close">${Transl("取消退出")}</button>
                        </div>
                    </div>
                </div>
            `);

            $(".modal-background").on("click", function (click) {
                click.stopImmediatePropagation();
                const target = click.target;

                if (target.id === "save") {
                    Lib.setJV("E/Ex_Cookies", cookies);
                    Growl(Transl("保存成功!"), "jGrowl", 1500);
                    DeleteMenu();
                } else if (target.className === "modal-background" || target.id === "close") {
                    DeleteMenu();
                }
            });
        };

        /* 自動獲取 Cookies */
        async function AutoGetCookie() {
            let cookie_box = [];

            for (const [name, value] of Object.entries($Cookie.Get())) {
                cookie_box.push({ "name": name, "value": value });
            }

            cookie_box.length > 1
                ? Cookie_Show(cookie_box)
                : alert(Transl("未獲取到 Cookies !!\n\n請先登入帳戶"));
        };

        /* 手動設置 Cookies */
        async function ManualSetting() {
            CreateMenu(`
                <div class="modal-background">
                    <div class="set-modal">
                    <h1>${Transl("設置 Cookies")}</h1>
                        <form id="set_cookies">
                            <div id="input_cookies" class="set-box">
                                <label>[igneous]：</label><input class="set-list" type="text" name="igneous" placeholder="${Transl("要登入 Ex 才需要填寫")}"><br>
                                <label>[ipb_member_id]：</label><input class="set-list" type="text" name="ipb_member_id" placeholder="${Transl("必填項目")}" required><br>
                                <label>[ipb_pass_hash]：</label><input class="set-list" type="text" name="ipb_pass_hash" placeholder="${Transl("必填項目")}" required><hr>
                                <h3>${Transl("下方選填 也可不修改")}</h3>
                                <label>[sl]：</label><input class="set-list" type="text" name="sl" value="dm_2"><br>
                                <label>[sk]：</label><input class="set-list" type="text" name="sk"><br>
                            </div>
                            <button type="submit" class="modal-button" id="save">${Transl("確認保存")}</button>
                            <button class="modal-button" id="close">${Transl("退出選單")}</button>
                        </form>
                    </div>
                </div>
            `);

            let cookie;
            const textarea = $("<textarea>").attr({
                style: "margin: 1.15rem auto 0 auto",
                rows: 18,
                cols: 40,
                readonly: true
            })

            $("#set_cookies").on("submit", function (submit) {
                submit.preventDefault();
                submit.stopImmediatePropagation();

                cookie = Array.from($("#set_cookies .set-list")).map(function (input) {
                    const value = $(input).val();
                    return value.trim() !== "" ? { name: $(input).attr("name"), value: value } : null;
                }).filter(Boolean);

                textarea.val(JSON.stringify(cookie, null, 4));
                $("#set_cookies div").append(textarea);

                Growl(Transl("[確認輸入正確] 按下退出選單保存"), "jGrowl", 2500);
            })

            $(".modal-background").on("click", function (click) {
                click.stopImmediatePropagation();

                const target = click.target;
                if (target.className === "modal-background" || target.id === "close") {
                    click.preventDefault();
                    target.id === "close" && cookie && Lib.setJV("E/Ex_Cookies", cookie);
                    DeleteMenu();
                }
            })
        };

        /* 查看保存的 Cookies */
        async function ViewSaveCookie() {
            CreateMenu(`
                <div class="modal-background">
                    <div class="set-modal">
                    <h1>${Transl("當前設置 Cookies")}</h1>
                        <div id="view_cookies" style="margin: 0.6rem"></div>
                        <button class="modal-button" id="save">${Transl("更改保存")}</button>
                        <button class="modal-button" id="close">${Transl("退出選單")}</button>
                    </div>
                </div>
            `);

            const cookie = Lib.getJV("E/Ex_Cookies", {});
            const textarea = $("<textarea>").attr({
                rows: 20,
                cols: 50,
                id: "view_SC",
                style: "margin-top: 1.25rem;"
            })

            textarea.val(JSON.stringify(cookie, null, 4));
            $("#view_cookies").append(textarea);

            $(".modal-background").on("click", function (click) {
                click.stopImmediatePropagation();
                const target = click.target;

                if (target.id === "save") {
                    Lib.setJV("E/Ex_Cookies", JSON.parse($("#view_SC").val()));
                    Growl(Transl("已保存變更"), "jGrowl", 1500);
                    DeleteMenu();
                } else if (target.className === "modal-background" || target.id === "close") {
                    DeleteMenu();
                }
            })
        };

        /* 手動注入 Cookies 登入 */
        async function CookieInjection() {
            try {
                const cookie = Lib.getJV("E/Ex_Cookies");
                if (cookie === null) throw new Error("No Cookies");
                $Cookie.ReAdd(cookie);
            } catch (error) {
                alert(Transl("未檢測到可注入的 Cookies !!\n\n請從選單中進行設置"));
            }
        };

        /* 清除登入狀態 */
        async function ClearLogin() {
            $Cookie.Delete();
            location.reload();
        };

        /* ---------- 自定收藏核心 ---------- */

        /* 創建收藏按鈕 */
        function CreateFavoritesButton() {
            // 縮圖, 按鈕容器, 標題, 其他資訊
            Lib.waitEl(["#gd1 div", "#gd2", "#gmid"], ([thumbnail, container, info]) => {
                const path = location.pathname;
                const save_key = md5(path);

                const Favorites = Lib.getV("Favorites", {});
                const favorite = Favorites[save_key];

                // 添加收藏 邏輯
                const addfavorite = async (Favorites) => {
                    return new Promise((resolve, reject) => {
                        try {
                            const img = getComputedStyle(thumbnail); // 縮略圖樣式
                            const score = getComputedStyle(info.$q(".ir")); // 評分
                            const icon = info.$q("#gdc div"); // 類型 icon
                            const artist = info.$q("#gdn a"); // 藝術家連結

                            const title = container.$q("#gj").$text() || container.$q("#gn").$text() // 標題 (優先找日文)
                            const [, gid, tid] = path.match(/\/g\/([^\/]+)\/([^\/]+)\//); // 解析 id
                            const detail = info.$q("#gdd"); // 資訊內容
                            const posted = detail.$q("tr:nth-child(1) .gdt2").$text();
                            const length = detail.$q("tr:nth-child(6) .gdt2").$text();

                            // 獲取標籤
                            const tagData = new Map();
                            for (const a of info.$qa("#taglist tr a")) {
                                const tags = a.id.slice(3).replace(/[_]/g, " ").split(":"); // 去除開頭 ta_ , 分出 類別 與 標籤
                                if (!tagData.has(tags[0])) tagData.set(tags[0], []);
                                tagData.get(tags[0]).push(tags[1]);
                            };

                            const data = JSON.stringify({
                                gid, tid, domain, posted, length,
                                key: save_key,
                                tags: [...tagData],
                                score: score.backgroundPosition,
                                post_title: title,
                                artist_link: artist.href,
                                artist_text: artist.$text(),
                                icon_text: icon.$text(),
                                icon_class: icon.className,
                                img_width: img.width,
                                img_height: img.height,
                                img_url: img.background.match(/url\(["']?(.*?)["']?\)/)[1],
                                favorited_time: Lib.getDate("{year}-{month}-{date} {hour}:{minute}")
                            });

                            Lib.setV("Favorites", Object.assign(Favorites, { [save_key]: LZString.compress(data, 9) }));
                            resolve();
                        } catch (error) {
                            console.error(error);
                            reject();
                        }
                    })

                };

                favorite && addfavorite(Favorites); // 當前為收藏狀態時, 進行狀態更新

                // 創建收藏按鈕
                const favoriteButton = Lib.createElement(container, "div", {
                    class: favorite ? "cancelFavorite" : "addFavorite",
                    text: favorite ? Transl("💘 取消收藏") : Transl("💖 添加收藏"),
                    on: {
                        type: "click",
                        listener: () => {
                            const Favorites = Lib.getV("Favorites", {});

                            if (Favorites[save_key]) {
                                delete Favorites[save_key];
                                Lib.setV("Favorites", Favorites);
                                favoriteButton.$text(Transl("💖 添加收藏"));
                                favoriteButton.$replaceClass("cancelFavorite", "addFavorite");
                                return;
                            };

                            addfavorite(Favorites).then(() => {
                                favoriteButton.$text(Transl("💘 取消收藏"));
                                favoriteButton.$replaceClass("addFavorite", "cancelFavorite");
                            });
                        },
                    }
                });
            }, { raf: true });
        };

        /* 請求數據 */
        function httpRequest(url, func) {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                responseType: "document",
                onload: response => {
                    if (response.status === 200) {
                        func(response.response);
                    }
                }
            })
        };

        /* 添加自定義收藏夾 */
        function AddCustomFavorites() {
            const Favorites = Lib.getV("Favorites");

            if (Favorites && Object.keys(Favorites).length > 0) {

                Lib.waitEl(".ido", ido => {
                    let delete_object = "tr";

                    const select = ido.$q(".searchnav div:last-of-type select option[selected='selected']");

                    const usertags = {}; // 保存標籤
                    const favoritDB = Object.values(Favorites); // 收藏數據
                    const mode = !select ? "t" : select.value; // 展示的模式 (m:Minimal, p:Minimal+, l:Compact, e:Extended, t: Thumbnail)

                    if (!select) {
                        const newform = Lib.createElement("form", {
                            id: "favform",
                            name: "favform",
                            action: "",
                            method: "post",
                            innerHTML: `<input id="ddact" name="ddact" type="hidden" value=""><div class="itg gld"></div>`
                        });
                        ido.appendChild(newform);
                    };

                    if (mode === "t") delete_object = ".gl1t";

                    /* 渲染標籤 */
                    const RenderTags = async function () {
                        const nodes = [];
                        const tree = document.createTreeWalker(
                            ido,
                            NodeFilter.SHOW_TEXT,
                            {
                                acceptNode: (node) => {
                                    const parent = node.parentNode;
                                    if (
                                        parent?.nodeName === "DIV" &&
                                        parent.hasAttribute("title") &&
                                        !parent.hasAttribute("id")
                                    ) {
                                        return NodeFilter.FILTER_ACCEPT;
                                    }
                                    return NodeFilter.FILTER_REJECT;
                                }
                            }
                        );

                        while (tree.nextNode()) {
                            nodes.push(tree.currentNode.parentElement);
                        };

                        // ! 如果有必要可以 set 保存渲染過的標籤, 並再下次排除避免重複渲染 (目前無性能瓶頸不做這個優化)
                        nodes.forEach(node => {
                            const tags = usertags[node.title];
                            tags && (node.style.cssText = tags.cssText);
                        });
                    };

                    /* 獲取標籤 */
                    const GetTags = async function () {

                        if (Object.keys(usertags).length > 0) {
                            RenderTags();
                            return;
                        }

                        httpRequest("https://exhentai.org/mytags", root => {
                            for (const user of root.$qa("div[id^='usertag_']:not(#usertag_0)")) {
                                const input = user.$q("div:nth-of-type(2) input");

                                if (input.checked) {
                                    const tag = user.$q("div.gt");
                                    usertags[tag.title] = tag.style;
                                }
                            }

                            RenderTags();
                        })

                    };

                    let count = 0;
                    const fragment = Lib.createFragment;
                    const RenderWait = requestIdleCallback || ((cb, _) => requestAnimationFrame(cb)); // 簡單的 fallback

                    /* 渲染預覽卡 */
                    const RenderCard = async function () {
                        if (fragment.hasChildNodes()) {
                            ido.$q("tbody")?.prepend(fragment);
                            ido.$q("#favform .gld")?.prepend(fragment);

                            requestAnimationFrame(GetTags);
                        };
                    };

                    for (const data of favoritDB) {
                        const json = JSON.parse(LZString.decompress(data));

                        // ! 模板沒問題就不要修改, 很容易壞掉
                        /* ----- 常用模板 ----- */

                        const Pages = `<div>${json.length}</div>`;
                        const PostUrl = `<a href="https://${json.domain}/g/${json.gid}/${json.tid}/">`; // 需要對應 </a>
                        const PostName = `<div class="glink">${json.post_title}</div>`;

                        const Glfnote = `<div class="glfnote" style="display:none" id="favnote_${json.gid}"></div>`;

                        const Thumbnail = `<div class="${json.icon_class}">${json.icon_text}</div>`;
                        const ThumbnailCN = Thumbnail.replace('class="cs', 'class="cn');

                        const Position = `<div class="ir" style="background-position:${json.score};opacity:1"></div>`;
                        const PreviewImg = `<img style="height:${json.img_height}; width:${json.img_width};" alt="${json.post_title}" title="${json.post_title}" src="${json.img_url}">`;
                        const FullPreview = `
                            <div class="glcut" id="ic${json.gid}"></div>
                                <div class="glthumb" id="it${json.gid}" style="top:-179px;height:400px">
                                <div>${PreviewImg}</div>
                        `; // 需要對應 </div>

                        const Posted = `
                            <div style="border-color:#000;background-color:rgba(0,0,0,.1)"
                                onclick="popUp('https://${json.domain}/gallerypopups.php?gid=${json.gid}&amp;t=${json.tid}&amp;act=addfav',675,415)"
                                id="posted_${json.gid}" title="Favorites 0">${json.posted}
                            </div>
                        `;
                        const Postedpop = Posted.replace("posted_", "postedpop_");

                        const Gldown = `
                            <div class="gldown">
                                <a href="https://${json.domain}/gallerytorrents.php?gid=${json.gid}&amp;t=${json.tid}"
                                    onclick="return popUp('https://${json.domain}/gallerytorrents.php?gid=${json.gid}&amp;t=${json.tid}',610,590)"
                                    rel="nofollow"><img src="https://${json.domain}/img/t.png" alt="T" title="Show torrents">
                                </a>
                            </div>
                        `;

                        const unFavorite = `
                            <div class="lc">
                                <div id="${json.key}" class="unFavorite">💔</div>
                            </div>
                        `;

                        /* ----- 後續按照模式個別生成 ----- */

                        if (mode === "m" || mode === "p") {
                            const tr = Lib.createElement("tr");
                            tr.$iHtml(`
                                <td class="gl1m glcat">${Thumbnail}</td>
                                <td class="gl2m">
                                    ${FullPreview}
                                        <div>
                                            <div>
                                                ${Thumbnail}
                                                ${Postedpop}
                                            </div>
                                            <div>
                                                ${Position}
                                                ${Pages}
                                            </div>
                                        </div>
                                    </div>
                                    ${Posted}
                                </td>
                                <td class="gl6m">${Gldown}</td>
                                <td class="gl3m glname" onmouseover="show_image_pane(${json.gid});preload_pane_image(0,0)" onmouseout="hide_image_pane()">
                                    ${PostUrl}
                                        ${PostName}
                                        ${Glfnote}
                                    </a>
                                </td>
                                <td class="gl4m">
                                    ${Position}
                                </td>
                                <td class="glfm glfav">${json.favorited_time}</td>
                                <td class="glfm" style="text-align:center; padding-left:3px">
                                    ${unFavorite}
                                </td>
                            `.replace(/>\s+</g, '><'));
                            fragment.prepend(tr);
                        } else if (mode === "l") {
                            const tr = Lib.createElement("tr");
                            const posted = json.posted.split(" ");
                            tr.$iHtml(`
                                <tr>
                                    <td class="gl1c glcat">${ThumbnailCN}</td>
                                    <td class="gl2c">
                                        ${FullPreview}
                                            <div>
                                                <div>
                                                    ${ThumbnailCN}
                                                    ${Postedpop}
                                                </div>
                                                <div>
                                                    ${Position}
                                                    ${Pages}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            ${Posted}
                                            ${Position}
                                            ${Gldown}
                                        </div>
                                    </td>
                                    <td class="gl3c glname" onmouseover="show_image_pane(${json.gid});preload_pane_image(0,0)" onmouseout="hide_image_pane()">
                                        ${PostUrl}
                                            ${PostName}
                                            <div>
                                                ${(() => {
                                    let count = 0;
                                    let result = '';
                                    for (const [tagCategory, tagList] of json.tags) {
                                        for (const tag of tagList) {
                                            if (count >= 10) break;
                                            result += `<div class="gt" title="${tagCategory}:${tag}">${tag}</div>`;
                                            count++;
                                        }
                                        if (count >= 10) break;
                                    }
                                    return result;
                                })()}
                                            </div>
                                            ${Glfnote}
                                        </a>
                                    </td>
                                    <td class="glfc glfav">
                                        <p>${posted[0]}</p>
                                        <p>${posted[1]}</p>
                                    </td>
                                    <td class="glfc" style="text-align:center; padding-left:3px">
                                        ${unFavorite}
                                    </td>
                                </tr>
                            `.replace(/>\s+</g, '><'));
                            fragment.prepend(tr);
                        } else if (mode === "e") {
                            const tr = Lib.createElement("tr");
                            tr.$iHtml(`
                                <tr>
                                    <td class="gl1e" style="width:250px">
                                        <div style="height: ${json.img_height}; width:250px">
                                            ${PostUrl}
                                                ${PreviewImg}
                                            </a>
                                        </div>
                                    </td>
                                    <td class="gl2e">
                                        <div>
                                            <div class="gl3e">
                                                ${ThumbnailCN}
                                                ${Posted}
                                                ${Position}
                                                <div><a href="${json.artist_link}">${json.artist_text}</a></div>
                                                ${Pages}
                                                ${Gldown}
                                            <div>
                                                <p>Favorited:</p><p>${json.favorited_time}</p>
                                            </div>
                                            </div>
                                            ${PostUrl}
                                                <div class="gl4e glname" style="min-height:${json.img_height}">
                                                    ${PostName}
                                                    <div>
                                                        <table>
                                                            <tbody>
                                                                ${json.tags.map(([tagCategory, tagList]) => {
                                return `
                                                                        <tr>
                                                                            <td class="tc">${tagCategory}</td>
                                                                            <td>
                                                                                ${tagList.map(tag => `<div class="gtl" title="${tagCategory}:${tag}">${tag}</div>`).join('')}
                                                                            </td>
                                                                        </tr>
                                                                    `}).join('')}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    ${Glfnote}
                                                </div>
                                            </a>
                                        </div>
                                    </td>
                                    <td class="glfe" style="text-align:center; padding-left:8px">
                                        ${unFavorite}
                                    </td>
                                </tr>
                            `.replace(/>\s+</g, '><'));
                            fragment.prepend(tr);
                        } else if (mode === "t") {
                            const div = Lib.createElement("div", { class: "gl1t" });
                            div.$iHtml(`
                                <div class="gl4t glname glft">
                                    <div>
                                        ${PostUrl}
                                            <span class="glink">${json.post_title}</span>
                                        </a>
                                    </div>
                                    <div style="transform: translateY(-70%);">
                                        ${unFavorite}
                                    </div>
                                </div>
                                <div class="gl3t" style="height: ${json.img_height}; width:250px">
                                    ${PostUrl}
                                        ${PreviewImg}
                                    </a>
                                </div>
                                ${Glfnote}
                                <div class="gl5t">
                                    <div>
                                        ${Thumbnail}
                                        ${Posted}
                                    </div>
                                    <div>
                                        ${Position}
                                        ${Pages}
                                        ${Gldown}
                                    </div>
                                </div>
                            `.replace(/>\s+</g, '><'));
                            fragment.prepend(div);
                        }

                        /* ----- 內部分批渲染 ----- */

                        ++count;
                        if (count === 50) {
                            count = 0;
                            RenderWait(RenderCard, { timeout: 1e3 });
                        }
                    };

                    RenderCard(); // 完成最終渲染

                    /* 刪除收藏 */
                    Lib.onEvent(ido, "click", event => {
                        const target = event.target;

                        if (target.className === "unFavorite") {
                            const Favorites = Lib.getV("Favorites");
                            delete Favorites[target.id];
                            Lib.setV("Favorites", Favorites);

                            target.closest(delete_object).remove();
                        }
                    })
                })
            }
        };

        return { Injection };
    })(CookieFactory(), SharedFactory()).then(Main => {
        Main.Injection();
    });

    /* 通知展示 */
    async function Growl(message, theme, life) {
        $.jGrowl(`&emsp;&emsp;${message}&emsp;&emsp;`, {
            theme: theme,
            life: life,
            speed: "slow"
        })
    };

    /* 共享數據操作 */
    function SharedFactory() {

        /* 請求共享數據 */
        async function Get() {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    responseType: "json",
                    url: "https://gitlab.com/Canaan-HS/database/-/raw/main/Share/ExShare.json",
                    onload: response => {
                        if (response.status === 200) {
                            const data = response.response;
                            if (typeof data === "object" && Object.keys(data).length > 0) {
                                resolve(data);
                            } else {
                                console.error(Transl("請求為空數據"));
                                resolve({});
                            }
                        } else {
                            console.error(Transl("連線異常，更新地址可能是錯的"));
                            resolve({});
                        }
                    },
                    onerror: error => {
                        console.error(Transl("請求錯誤: "), error);
                        resolve({});
                    }
                })
            })
        };

        /* 更新共享數據 */
        async function Update() {
            const Shared = await Get();

            if (Object.keys(Shared).length > 0) {
                const localHash = md5(Lib.getV("Share", ""));
                const remoteHash = md5(JSON.stringify(Shared));

                if (localHash !== remoteHash) {
                    Growl(Transl("共享數據更新完成"), "jGrowl", 1500);

                    return Shared;
                } else {
                    Growl(Transl("共享數據無需更新"), "jGrowl", 1500);
                }
            } else {
                Growl(Transl("共享數據獲取失敗"), "jGrowl", 2500);
            }

            return false;
        };

        return { Update };
    };

    /* Cookie 操作 */
    function CookieFactory() {
        const Today = new Date();
        Today.setFullYear(Today.getFullYear() + 1);

        const Expires = Today.toUTCString(); // 設置一年的過期時間
        const UnixUTC = new Date(0).toUTCString();

        let RequiredCookie = ["ipb_member_id", "ipb_pass_hash"];
        if (domain == "exhentai.org") RequiredCookie.unshift("igneous");

        return {
            Get: () => { /* 取得 cookie */
                return Lib.cookie().split("; ").reduce((acc, cookie) => {
                    const [name, value] = cookie.split("=");
                    acc[decodeURIComponent(name)] = decodeURIComponent(value);
                    return acc;
                }, {});
            },
            Add: function (CookieObject) { /* 添加 cookie */
                Lib.local("DetectionTime", { value: Lib.getDate() });
                for (const Cookie of CookieObject) {
                    Lib.cookie(`${encodeURIComponent(Cookie.name)}=${encodeURIComponent(Cookie.value)}; domain=.${domain}; path=/; expires=${Expires};`);
                };
                location.reload();
            },
            Delete: function () { /* 刪除 cookie (避免意外使用兩種清除) */
                Object.keys(this.Get()).forEach(Name => {
                    Lib.cookie(`${Name}=; expires=${UnixUTC}; path=/;`);
                    Lib.cookie(`${Name}=; expires=${UnixUTC}; path=/; domain=.${domain}`);
                });
            },
            ReAdd: function (Cookies) { /* 重新添加 */
                this.Delete();
                this.Add(Cookies);
            },
            Verify: function (Cookies) { /* 驗證所需 cookie */
                const Cookie = this.Get();
                const VCookie = new Set(Object.keys(Cookie));
                const Result = RequiredCookie.every(key => VCookie.has(key) && Cookie[key] !== "mystery"); // 避免有意外參數

                if (!Result) {
                    this.ReAdd(Cookies);
                } else {
                    Lib.local("DetectionTime", { value: Lib.getDate() });
                }
            }
        }
    };

    /* 語言支援 */
    function Language() {
        const Word = Lib.translMatcher({
            Traditional: {},
            Simplified: {
                "🍪 共享登入": "🍪 共享登录",
                "🟢 啟用檢測": "🟢 启用检测",
                "🔴 禁用檢測": "🔴 禁用检测",
                "📂 展開菜單": "📂 展开菜单",
                "📁 摺疊菜單": "📁 折叠菜单",
                "📜 自動獲取": "📜 自动获取",
                "📝 手動輸入": "📝 手动输入",
                "🔍 查看保存": "🔍 查看已保存",
                "🔃 手動注入": "🔃 手动注入",
                "🗑️ 清除登入": "🗑️ 清除登录信息",
                "💖 添加收藏": "💖 添加收藏",
                "💘 取消收藏": "💘 取消收藏",
                "帳戶": "账号",
                "更新": "更新",
                "登入": "登录",
                "首次使用請先更新": "首次使用请先更新",
                "確認選擇的 Cookies": "确认所选 Cookies",
                "確認保存": "确认保存",
                "取消退出": "取消",
                "退出選單": "关闭菜单",
                "保存成功!": "保存成功！",
                "更改保存": "保存更改",
                "已保存變更": "更改已保存",
                "設置 Cookies": "设置 Cookies",
                "要登入 Ex 才需要填寫": "仅登录 Ex 时需要填写",
                "必填項目": "必填项",
                "下方選填 也可不修改": "以下为选填项，可不修改",
                "[確認輸入正確] 按下退出選單保存": "[确认输入无误] 点击关闭菜单保存",
                "當前設置 Cookies": "当前 Cookies 设置",
                "帳戶選擇": "选择账号",
                "未獲取到 Cookies !!\n\n請先登入帳戶": "未获取到 Cookies！\n\n请先登录账号",
                "未檢測到可注入的 Cookies !!\n\n請從選單中進行設置": "未检测到可注入的 Cookies！\n\n请在菜单中进行设置",
                "共享數據更新完成": "共享数据更新完成",
                "共享數據無需更新": "共享数据无需更新",
                "共享數據獲取失敗": "共享数据获取失败",
                "無保存的 Cookie, 無法啟用自動登入": "没有已保存的 Cookie，无法启用自动登录",
                "請求為空數據": "请求数据为空",
                "連線異常，更新地址可能是錯的": "连接异常，更新地址可能不正确",
                "請求錯誤: ": "请求错误："
            },
            Japan: {
                "🍪 共享登入": "🍪 共有ログイン",
                "🟢 啟用檢測": "🟢 検出を有効化",
                "🔴 禁用檢測": "🔴 検出を無効化",
                "📂 展開菜單": "📂 メニュー展開",
                "📁 摺疊菜單": "📁 メニュー折りたたみ",
                "📜 自動獲取": "📜 自動取得",
                "📝 手動輸入": "📝 手動入力",
                "🔍 查看保存": "🔍 保存を表示",
                "🔃 手動注入": "🔃 手動注入",
                "🗑️ 清除登入": "🗑️ ログインをクリア",
                "💖 添加收藏": "💖 お気に入りに追加",
                "💘 取消收藏": "💘 お気に入りから削除",
                "帳戶": "アカウント",
                "更新": "更新",
                "登入": "ログイン",
                "首次使用請先更新": "初めてご利用の際は、先に更新してください",
                "確認選擇的 Cookies": "選択したCookieを確認",
                "確認保存": "保存を確認",
                "取消退出": "終了をキャンセル",
                "退出選單": "メニューを終了",
                "保存成功!": "保存に成功しました！",
                "更改保存": "変更を保存",
                "已保存變更": "変更が保存されました",
                "設置 Cookies": "Cookieを設定",
                "要登入 Ex 才需要填寫": "Exログインにのみ必要",
                "必填項目": "必須項目",
                "下方選填 也可不修改": "以下は任意、変更しなくても構いません",
                "[確認輸入正確] 按下退出選單保存": "[入力が正しいことを確認] メニュー終了を押して保存",
                "當前設置 Cookies": "現在のCookie設定",
                "帳戶選擇": "アカウント選択",
                "未獲取到 Cookies !!\n\n請先登入帳戶": "Cookieを取得できませんでした！\n\nまずアカウントにログインしてください",
                "未檢測到可注入的 Cookies !!\n\n請從選單中進行設置": "注入可能なCookieが検出されませんでした！\n\nメニューから設定してください",
                "共享數據更新完成": "共有データの更新が完了しました",
                "共享數據無需更新": "共有データの更新は不要です",
                "共享數據獲取失敗": "共有データの取得に失敗しました",
                "無保存的 Cookie, 無法啟用自動登入": "保存されたCookieがないため、自動ログインを有効にできません",
                "請求為空數據": "リクエストにデータがありません",
                "連線異常，更新地址可能是錯的": "接続エラー、更新アドレスが間違っている可能性があります",
                "請求錯誤: ": "リクエストエラー: "
            },
            Korea: {
                "🍪 共享登入": "🍪 공유 로그인",
                "🟢 啟用檢測": "🟢 감지 활성화",
                "🔴 禁用檢測": "🔴 감지 비활성화",
                "📂 展開菜單": "📂 메뉴 펼치기",
                "📁 摺疊菜單": "📁 메뉴 접기",
                "📜 自動獲取": "📜 자동 가져오기",
                "📝 手動輸入": "📝 수동 입력",
                "🔍 查看保存": "🔍 저장된 항목 보기",
                "🔃 手動注入": "🔃 수동 주입",
                "🗑️ 清除登入": "🗑️ 로그인 정보 삭제",
                "💖 添加收藏": "💖 즐겨찾기에 추가",
                "💘 取消收藏": "💘 즐겨찾기 제거",
                "確認選擇的 Cookies": "선택한 쿠키 확인",
                "帳戶": "계정",
                "更新": "업데이트",
                "登入": "로그인",
                "首次使用請先更新": "처음 사용하기 전에 먼저 업데이트해 주세요",
                "確認保存": "저장 확인",
                "取消退出": "종료 취소",
                "退出選單": "메뉴 종료",
                "保存成功!": "저장 성공!",
                "更改保存": "변경사항 저장",
                "已保存變更": "변경사항이 저장되었습니다",
                "設置 Cookies": "쿠키 설정",
                "要登入 Ex 才需要填寫": "Ex 로그인에만 필요",
                "必填項目": "필수 항목",
                "下方選填 也可不修改": "아래는 선택사항, 변경하지 않아도 됩니다",
                "[確認輸入正確] 按下退出選單保存": "[입력이 정확한지 확인] 메뉴 종료를 눌러 저장",
                "當前設置 Cookies": "현재 설정된 쿠키",
                "帳戶選擇": "계정 선택",
                "未獲取到 Cookies !!\n\n請先登入帳戶": "쿠키를 가져오지 못했습니다!\n\n먼저 계정에 로그인해 주세요",
                "未檢測到可注入的 Cookies !!\n\n請從選單中進行設置": "주입 가능한 쿠키가 감지되지 않았습니다!\n\n메뉴에서 설정해 주세요",
                "共享數據更新完成": "공유 데이터 업데이트 완료",
                "共享數據無需更新": "공유 데이터 업데이트 불필요",
                "共享數據獲取失敗": "공유 데이터 가져오기 실패",
                "無保存的 Cookie, 無法啟用自動登入": "저장된 쿠키가 없어 자동 로그인을 활성화할 수 없습니다",
                "請求為空數據": "요청에 데이터가 없습니다",
                "連線異常，更新地址可能是錯的": "연결 오류, 업데이트 주소가 잘못되었을 수 있습니다",
                "請求錯誤: ": "요청 오류: "
            },
            Russia: {
                "🍪 共享登入": "🍪 Общий вход",
                "🟢 啟用檢測": "🟢 Включить обнаружение",
                "🔴 禁用檢測": "🔴 Отключить обнаружение",
                "📂 展開菜單": "📂 Развернуть меню",
                "📁 摺疊菜單": "📁 Свернуть меню",
                "📜 自動獲取": "📜 Автоматическое получение",
                "📝 手動輸入": "📝 Ручной ввод",
                "🔍 查看保存": "🔍 Просмотр сохраненного",
                "🔃 手動注入": "🔃 Ручное внедрение",
                "🗑️ 清除登入": "🗑️ Очистить вход",
                "💖 添加收藏": "💖 Добавить в избранное",
                "💘 取消收藏": "💘 Удалить из избранного",
                "帳戶": "Аккаунт",
                "更新": "Обновить",
                "登入": "Войти",
                "首次使用請先更新": "Пожалуйста, обновите перед первым использованием",
                "確認選擇的 Cookies": "Подтвердить выбранные Cookies",
                "確認保存": "Подтвердить сохранение",
                "取消退出": "Отменить выход",
                "退出選單": "Выйти из меню",
                "保存成功!": "Сохранение успешно!",
                "更改保存": "Сохранить изменения",
                "已保存變更": "Изменения сохранены",
                "設置 Cookies": "Настройка Cookies",
                "要登入 Ex 才需要填寫": "Требуется только для входа в Ex",
                "必填項目": "Обязательное поле",
                "下方選填 也可不修改": "Необязательно ниже, изменения не требуются",
                "[確認輸入正確] 按下退出選單保存": "[Подтвердите правильность ввода] Нажмите Выйти из меню для сохранения",
                "當前設置 Cookies": "Текущие настройки Cookies",
                "帳戶選擇": "Выбор аккаунта",
                "未獲取到 Cookies !!\n\n請先登入帳戶": "Cookies не получены !!\n\nПожалуйста, сначала войдите в аккаунт",
                "未檢測到可注入的 Cookies !!\n\n請從選單中進行設置": "Не обнаружены Cookies для внедрения !!\n\nПожалуйста, настройте в меню",
                "共享數據更新完成": "Обновление общих данных завершено",
                "共享數據無需更新": "Обновление общих данных не требуется",
                "共享數據獲取失敗": "Ошибка получения общих данных",
                "無保存的 Cookie, 無法啟用自動登入": "Нет сохраненных cookies, невозможно включить автоматический вход",
                "請求為空數據": "Запрос содержит пустые данные",
                "連線異常，更新地址可能是錯的": "Ошибка соединения, адрес обновления может быть неверным",
                "請求錯誤: ": "Ошибка запроса: "
            },
            English: {
                "🍪 共享登入": "🍪 Shared Login",
                "🟢 啟用檢測": "🟢 Enable Detection",
                "🔴 禁用檢測": "🔴 Disable Detection",
                "📂 展開菜單": "📂 Expand Menu",
                "📁 摺疊菜單": "📁 Collapse Menu",
                "📜 自動獲取": "📜 Auto Retrieve",
                "📝 手動輸入": "📝 Manual Input",
                "🔍 查看保存": "🔍 View Saved",
                "🔃 手動注入": "🔃 Manual Injection",
                "🗑️ 清除登入": "🗑️ Clear Login",
                "💖 添加收藏": "💖 Add to Favorites",
                "💘 取消收藏": "💘 Remove from Favorites",
                "帳戶": "Account",
                "更新": "Update",
                "登入": "Login",
                "首次使用請先更新": "Please update before first use",
                "確認選擇的 Cookies": "Confirm Selected Cookies",
                "確認保存": "Confirm Save",
                "取消退出": "Cancel Exit",
                "退出選單": "Exit Menu",
                "保存成功!": "Save Successful!",
                "更改保存": "Save Changes",
                "已保存變更": "Changes Saved",
                "設置 Cookies": "Set Cookies",
                "要登入 Ex 才需要填寫": "Required for Ex Login Only",
                "必填項目": "Required Field",
                "下方選填 也可不修改": "Optional Fields Below - No Changes Required",
                "[確認輸入正確] 按下退出選單保存": "[Confirm Input is Correct] Press Exit Menu to Save",
                "當前設置 Cookies": "Current Cookie Settings",
                "帳戶選擇": "Account Selection",
                "未獲取到 Cookies !!\n\n請先登入帳戶": "No Cookies Retrieved!\n\nPlease Login First",
                "未檢測到可注入的 Cookies !!\n\n請從選單中進行設置": "No Injectable Cookies Detected!\n\nPlease Configure in Menu",
                "共享數據更新完成": "Shared Data Update Complete",
                "共享數據無需更新": "Shared Data Update Not Needed",
                "共享數據獲取失敗": "Shared Data Retrieval Failed",
                "無保存的 Cookie, 無法啟用自動登入": "No Saved Cookies - Unable to Enable Auto-Login",
                "請求為空數據": "Request Contains No Data",
                "連線異常，更新地址可能是錯的": "Connection Error - Update Address May Be Incorrect",
                "請求錯誤: ": "Request Error: "
            }
        });

        return {
            Transl: (Str) => Word[Str] ?? Str
        };
    };

})();