// ==UserScript==
// @name         [E/Ex-Hentai] AutoLogin
// @name:zh-TW   [E/Ex-Hentai] 自動登入
// @name:zh-CN   [E/Ex-Hentai] 自动登入
// @name:ja      [E/Ex-Hentai] 自動ログイン
// @name:ko      [E/Ex-Hentai] 자동 로그인
// @name:ru      [E/Ex-Hentai] Автоматический вход
// @name:en      [E/Ex-Hentai] AutoLogin
// @version      0.0.34-Beta
// @author       Canaan HS
// @description         E/Ex - 共享帳號登入、自動獲取 Cookies、手動輸入 Cookies、本地備份以及查看備份，自動檢測登入
// @description:zh-TW   E/Ex - 共享帳號登入、自動獲取 Cookies、手動輸入 Cookies、本地備份以及查看備份，自動檢測登入
// @description:zh-CN   E/Ex - 共享帐号登录、自动获取 Cookies、手动输入 Cookies、本地备份以及查看备份，自动检测登录
// @description:ja      E/Ex - 共有アカウントでのログイン、クッキーの自動取得、クッキーの手動入力、ローカルバックアップおよびバックアップの表示、自動ログイン検出
// @description:ko      E/Ex - 공유 계정 로그인, 자동으로 쿠키 가져오기, 쿠키 수동 입력, 로컬 백업 및 백업 보기, 자동 로그인 감지
// @description:ru      E/Ex - Вход в общий аккаунт, автоматическое получение cookies, ручной ввод cookies, локальное резервное копирование и просмотр резервных копий, автоматическое определение входа
// @description:en      E/Ex - Shared account login, automatic cookie retrieval, manual cookie input, local backup, and backup viewing, automatic login detection

// @noframes
// @connect      *
// @match        *://e-hentai.org/*
// @match        *://exhentai.org/*
// @icon         https://e-hentai.org/favicon.ico

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635

// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_addValueChangeListener

// @require      https://update.greasyfork.org/scripts/487608/1563101/SyntaxLite_min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.19.0/js/md5.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js

// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery-jgrowl/1.5.1/jquery.jgrowl.min.js
// @resource     jgrowl-css https://cdnjs.cloudflare.com/ajax/libs/jquery-jgrowl/1.5.1/jquery.jgrowl.min.css
// ==/UserScript==

(async () => {
    const domain = Syn.$domain;
    const Transl = Language(Syn.$lang).Transl;

    (async function ImportStyle() {
        let show_style, button_style, button_hover, jGrowl_style, acc_style;
        if (domain == "e-hentai.org") {
            button_hover = "color: #8f4701;"
            jGrowl_style = "background-color: #5C0D12; color: #fefefe;"
            show_style = "background-color: #fefefe; border: 3px ridge #34353b;"
            acc_style = "color: #5C0D12; background-color: #fefefe; border: 2px solid #B5A4A4;"
            button_style = "color: #5C0D12; border: 2px solid #B5A4A4; background-color: #fefefe;"
        } else if (domain == "exhentai.org") {
            button_hover = "color: #989898;"
            jGrowl_style = "background-color: #fefefe; color: #5C0D12;"
            show_style = "background-color: #34353b; border: 2px ridge #5C0D12;"
            acc_style = "color: #f1f1f1; background-color: #34353b; border: 2px solid #8d8d8d;"
            button_style = "color: #fefefe; border: 2px solid #8d8d8d; background-color: #34353b;"
            Syn.AddStyle(`
                body {
                    padding: 2px;
                    color: #f1f1f1;
                    text-align: center;
                    background: #34353b;
                }
            `);
        };
        Syn.AddStyle(`
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
                width: 10rem;
                padding: 4px;
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
                display: inline-block;
                transition: transform 0.2s ease;
            }
            .unFavorite:hover {
                animation: shake 0.8s ease-in-out infinite;
            }
            @keyframes shake {
                0% {
                    transform: translateX(0);
                }
                25% {
                    transform: translateX(-5px);
                }
                50% {
                    transform: translateX(5px);
                }
                75% {
                    transform: translateX(-5px);
                }
                100% {
                    transform: translateX(0);
                }
            }
        `, "AutoLogin-Style");
    })();

    (async function Main($Cookie, $Shared) {
        let Modal = null; // 保存模態
        let Share = Syn.gV("Share", {});

        // 頁面匹配
        const url = Syn.$url;
        const Post_Page = /https:\/\/[^\/]+\/g\/\d+\/[a-zA-Z0-9]+/;
        const Favorites_Page = /https:\/\/[^\/]+\/favorites.php/;

        /* ---------- 菜單切換與創建 ---------- */

        /* 創建菜單前檢測 (刪除重創) */
        const CreateDetection = () => {
            Syn.$q(".modal-background")?.remove();
        };

        /* 創建菜單 */
        const CreateMenu = async () => {
            $(Syn.$body).append(Modal);
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
            Syn.Menu({
                [Transl("📜 自動獲取")]: { func: () => AutoGetCookie() },
                [Transl("📝 手動輸入")]: { func: () => ManualSetting() },
                [Transl("🔍 查看保存")]: { func: () => ViewSaveCookie() },
                [Transl("🔃 手動注入")]: { func: () => CookieInjection() },
                [Transl("🗑️ 清除登入")]: { func: () => ClearLogin() },
            }, "Expand")
        };

        /* 刪除延伸菜單 */
        const Collapse = async () => {
            for (let i = 1; i <= 5; i++) { GM_unregisterMenuCommand("Expand-" + i) }
        };

        /* 切換開合菜單 */
        const MenuToggle = async () => {
            const state = Syn.gV("Expand", false),
                disp = state ? Transl("📁 摺疊菜單") : Transl("📂 展開菜單");

            Syn.Menu({
                [disp]: {
                    func: () => {
                        state
                            ? Syn.sV("Expand", false)
                            : Syn.sV("Expand", true);
                        MenuToggle();
                    }, hotkey: "c", close: false
                }
            }, "Switch");

            //? 開合需要比切換菜單晚創建, 不然會跑版
            state ? Expand() : Collapse();
        };

        /* ---------- 登入檢測 與 入口點 ---------- */

        /* 自動檢測登陸 */
        const LoginToggle = async () => {
            const cookie = Boolean(Syn.gJV("E/Ex_Cookies"));
            const state = Syn.gV("Login", cookie); // 有 Cookie 預設為啟用
            const disp = state ? Transl("🟢 啟用檢測") : Transl("🔴 禁用檢測");

            Syn.Menu({
                [disp]: {
                    func: () => {
                        if (state) Syn.sV("Login", false)
                        else if (cookie) Syn.sV("Login", true)
                        else {
                            alert(Transl("無保存的 Cookie, 無法啟用自動登入"));
                            return;
                        };

                        LoginToggle();
                    }, close: false
                }
            }, "Check");

            //? 選擇檢測狀態後, 會重新創建選單, 避免跑板因此同樣重新創建下方菜單 (兼容舊版本插件的寫法)
            Syn.Menu({ [Transl("🍪 共享登入")]: { func: () => SharedLogin() } });
            MenuToggle();
        };

        /* 監聽選單切換, 全局套用 */
        const GlobalMenuToggle = async () => {
            Syn.StoreListen(["Login", "Expand"], listen => {
                listen.far && LoginToggle();
            })
        };

        /* 入口注射 */
        async function Injection() {
            const cookie = Syn.gJV("E/Ex_Cookies"); // 嘗試取得 Cookie
            const login = Syn.gV("Login", Boolean(cookie)); // 取得是否自動登入

            if (login && cookie) {
                let CurrentTime = new Date();
                let DetectionTime = Syn.Local("DetectionTime");

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
            CreateDetection();
            const Igneous = $Cookie.Get().igneous; // 取得當前登入的帳號
            const AccountQuantity = Object.keys(Share).length; // 取得共享號數量

            // 創建選項模板
            let Select = $(`<select id="account-select" class="acc-select"></select>`), Value;
            for (let i = 1; i <= AccountQuantity; i++) { // 判斷選擇值
                if (Share[i][0].value === Igneous) Value = i;
                Select.append($("<option>").attr({ value: i }).text(`${Transl("帳戶")} ${i}`));
            }

            // 創建菜單模板
            Modal = $(`
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
            CreateMenu();

            // 如果有選擇值, 就進行選取
            Value && $("#account-select").val(Value);
            $(".modal-background").on("click", function (click) {
                click.stopImmediatePropagation();
                const target = click.target;

                if (target.id === "login") {
                    $Cookie.ReAdd(Share[+$("#account-select").val()]);
                } else if (target.id === "update") {
                    $Shared.Update().then(result => {
                        if (result) {
                            Share = Syn.gV("Share", {});
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
            CreateDetection();
            Modal = `
                <div class="modal-background">
                    <div class="show-modal">
                    <h1 style="text-align: center;">${Transl("確認選擇的 Cookies")}</h1>
                        <pre><b>${cookies}</b></pre>
                        <div style="text-align: right;">
                            <button class="modal-button" id="save">${Transl("確認保存")}</button>
                            <button class="modal-button" id="close">${Transl("取消退出")}</button>
                        </div>
                    </div>
                </div>
            `
            CreateMenu();

            $(".modal-background").on("click", function (click) {
                click.stopImmediatePropagation();
                const target = click.target;

                if (target.id === "save") {
                    Syn.sV("E/Ex_Cookies", cookies);
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
                ? Cookie_Show(JSON.stringify(cookie_box, null, 4))
                : alert(Transl("未獲取到 Cookies !!\n\n請先登入帳戶"));
        };

        /* 手動設置 Cookies */
        async function ManualSetting() {
            CreateDetection();
            Modal = `
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
            `
            CreateMenu();

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

                const cookie_list = Array.from($("#set_cookies .set-list")).map(function (input) {
                    const value = $(input).val();
                    return value.trim() !== "" ? { name: $(input).attr("name"), value: value } : null;
                }).filter(Boolean);

                cookie = JSON.stringify(cookie_list, null, 4);
                textarea.val(cookie);
                $("#set_cookies div").append(textarea);

                Growl(Transl("[確認輸入正確] 按下退出選單保存"), "jGrowl", 2500);
            })

            $(".modal-background").on("click", function (click) {
                click.stopImmediatePropagation();

                const target = click.target;
                if (target.className === "modal-background" || target.id === "close") {
                    click.preventDefault();
                    cookie && Syn.sV("E/Ex_Cookies", cookie);
                    DeleteMenu();
                }
            })
        };

        /* 查看保存的 Cookies */
        async function ViewSaveCookie() {
            CreateDetection();
            Modal = `
                <div class="modal-background">
                    <div class="set-modal">
                    <h1>${Transl("當前設置 Cookies")}</h1>
                        <div id="view_cookies" style="margin: 0.6rem"></div>
                        <button class="modal-button" id="save">${Transl("更改保存")}</button>
                        <button class="modal-button" id="close">${Transl("退出選單")}</button>
                    </div>
                </div>
            `
            CreateMenu();

            const cookie = Syn.gJV("E/Ex_Cookies");
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
                    Syn.sJV("E/Ex_Cookies", JSON.parse($("#view_SC").val()));
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
                $Cookie.ReAdd(Syn.gJV("E/Ex_Cookies"));
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
            Syn.WaitElem(["#gd1 div", "#gd2", "#gn", "#gmid"], ([thumbnail, container, title, info]) => {
                const path = location.pathname;
                const save_key = md5(path);

                const Favorites = Syn.gV("Favorites", {});
                const favorite = Favorites[save_key];

                const favoriteButton = Syn.$createElement(container, "div", {
                    class: favorite ? "cancelFavorite" : "addFavorite",
                    text: favorite ? Transl("💘 取消收藏") : Transl("💖 添加收藏")
                });

                favoriteButton.$onEvent("click", () => {
                    const Favorites = Syn.gV("Favorites", {});

                    if (Favorites[save_key]) {
                        delete Favorites[save_key];
                        Syn.sV("Favorites", Favorites);
                        favoriteButton.$text(Transl("💖 添加收藏"));
                        favoriteButton.$replaceClass("cancelFavorite", "addFavorite");
                        return;
                    }

                    const img = getComputedStyle(thumbnail); // 縮略圖樣式
                    const score = getComputedStyle(info.$q(".ir")); // 評分
                    const icon = info.$q("#gdc div"); // 類型 icon
                    const artist = info.$q("#gdn a"); // 藝術家連結
                    const [, gid, tid] = path.match(/\/g\/([^\/]+)\/([^\/]+)\//); // 解析 id
                    const detail = info.$q("#gdd"); // 資訊內容
                    const posted = detail.$q("tr:nth-child(1) .gdt2").$text();
                    const length = detail.$q("tr:nth-child(6) .gdt2").$text();

                    const tagData = new Map();
                    const tagList = info.$qa("#taglist tr"); // 標籤資訊
                    for (const tr of tagList) { // 解析標籤
                        let tagName = "";
                        for (const td of tr.$qa("td")) {
                            if (td.className === "tc") tagName = td.$text();
                            else {
                                tagData.set(tagName, td.$qa("a").map(a => a.$text()));
                            }
                        }
                    };

                    const data = JSON.stringify({
                        gid, tid,
                        posted, length,
                        key: save_key,
                        tags: [...tagData],
                        score: score.backgroundPosition,
                        post_title: title.$text(),
                        artist_link: artist.href,
                        artist_text: artist.$text(),
                        icon_text: icon.$text(),
                        icon_class: icon.className,
                        img_width: img.width,
                        img_height: img.height,
                        img_url: img.background.match(/url\(["']?(.*?)["']?\)/)[1],
                        favorited_time: Syn.GetDate("{year}-{month}-{date} {hour}:{minute}")
                    });

                    Syn.sV("Favorites", Object.assign(Favorites, { [save_key]: LZString.compress(data, 9) }));
                    favoriteButton.$text(Transl("💘 取消收藏"));
                    favoriteButton.$replaceClass("addFavorite", "cancelFavorite");
                });
            }, {raf: true})
        };

        /* 添加自定義收藏夾 */
        function AddCustomFavorites() {
            const Favorites = Syn.gV("Favorites");

            if (Favorites && Object.keys(Favorites).length > 0) {

                Syn.WaitElem(".ido", ido => {
                    let delete_object = "tr";
                    const fragment = Syn.$createFragment();

                    const select = ido.$q(".searchnav div:last-of-type select option[selected='selected']");

                    const mode = !select ? "t" : select.value; // 展示的模式 (m:Minimal, p:Minimal+, l:Compact, e:Extended, t: Thumbnail)

                    if (!select) {
                        const newform = Syn.$createElement("form", {id: "favform", name: "favform", action: "", method: "post"});
                        newform.$iHtml(`<input id="ddact" name="ddact" type="hidden" value=""><div class="itg gld"></div>`);
                        ido.appendChild(newform);
                    };

                    if (mode === "t") delete_object = ".gl1t";

                    for (const data of Object.values(Favorites)) {
                        const json = JSON.parse(LZString.decompress(data));

                        if (mode === "m" || mode === "p") {
                            const tr = Syn.$createElement("tr");
                            tr.$iHtml(`
                                <td class="gl1m glcat">
                                    <div class="${json.icon_class}">${json.icon_text}</div>
                                </td>
                                <td class="gl2m">
                                    <div class="glcut" id="ic${json.gid}"></div>
                                    <div class="glthumb" id="it${json.gid}" style="top:-179px;height:400px">
                                        <div><img style="height:${json.img_height}; width:${json.img_width};top:-7px"
                                                alt="${json.post_title}" title="${json.post_title}" src="${json.img_url}">
                                        </div>
                                        <div>
                                            <div>
                                                <div class="${json.icon_class}">${json.icon_text}</div>
                                                <div style="border-color:#000;background-color:rgba(0,0,0,.1)"
                                                    onclick="popUp('https://exhentai.org/gallerypopups.php?gid=${json.gid}&amp;t=${json.tid}&amp;act=addfav',675,415)"
                                                    id="postedpop_${json.gid}" title="Favorites 0">${json.posted}</div>
                                            </div>
                                            <div>
                                                <div class="ir" style="background-position:${json.score};opacity:1"></div>
                                                <div>${json.length}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style="border-color:#000;background-color:rgba(0,0,0,.1)"
                                        onclick="popUp('https://exhentai.org/gallerypopups.php?gid=${json.gid}&amp;t=${json.tid}&amp;act=addfav',675,415)"
                                        id="posted_${json.gid}" title="Favorites 0">${json.posted}</div>
                                </td>
                                <td class="gl6m">
                                    <div class="gldown">
                                        <a href="https://exhentai.org/gallerytorrents.php?gid=${json.gid}&amp;t=${json.tid}"
                                            onclick="return popUp('https://exhentai.org/gallerytorrents.php?gid=${json.gid}&amp;t=${json.tid}',610,590)"
                                            rel="nofollow"><img src="https://exhentai.org/img/t.png" alt="T" title="Show torrents">
                                        </a>
                                    </div>
                                </td>
                                <td class="gl3m glname" onmouseover="show_image_pane(${json.gid});preload_pane_image(0,0)" onmouseout="hide_image_pane()">
                                    <a href="https://exhentai.org/g/${json.gid}/${json.tid}/">
                                        <div class="glink">${json.post_title}</div>
                                        <div class="glfnote" style="display:none" id="favnote_${json.gid}"></div>
                                    </a>
                                </td>
                                <td class="gl4m">
                                    <div class="ir" style="background-position:${json.score};opacity:1"></div>
                                </td>
                                <td class="glfm glfav">${json.favorited_time}</td>
                                <td class="glfm" style="text-align:center; padding-left:3px">
                                    <div class="lc">
                                        <div id="${json.key}" class="unFavorite">💔</div>
                                    </div>
                                </td>
                            `.replace(/>\s+</g, '><'));
                            fragment.appendChild(tr);
                        } else if (mode === "l") {
                            const tr = Syn.$createElement("tr");
                            const icon_class = json.icon_class.replace("cs", "cn");
                            const posted = json.posted.split(" ");
                            tr.$iHtml(`
                                <tr>
                                    <td class="gl1c glcat">
                                        <div class="${icon_class}">${json.icon_text}</div>
                                    </td>
                                    <td class="gl2c">
                                        <div class="glcut" id="ic${json.gid}"></div>
                                        <div class="glthumb" id="it${json.gid}" style="top:-179px;height:400px">
                                            <div><img style="height:${json.img_height}; width:${json.img_width};top:-7px"
                                                alt="${json.post_title}" title="${json.post_title}" src="${json.img_url}">
                                            </div>
                                            <div>
                                                <div>
                                                    <div class="${icon_class}">${json.icon_text}</div>
                                                    <div style="border-color:#000;background-color:rgba(0,0,0,.1)"
                                                        onclick="popUp('https://exhentai.org/gallerypopups.php?gid=${json.gid}&amp;t=${json.tid}&amp;act=addfav',675,415)"
                                                        id="postedpop_${json.gid}" title="Favorites 0">${json.posted}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div class="ir" style="background-position:${json.score};opacity:1"></div>
                                                    <div>${json.length}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div style="border-color:#000;background-color:rgba(0,0,0,.1)"
                                                onclick="popUp('https://exhentai.org/gallerypopups.php?gid=${json.gid}&amp;t=${json.tid}&amp;act=addfav',675,415)"
                                                id="posted_${json.gid}" title="Favorites 0">${json.posted}
                                            </div>
                                            <div class="ir" style="background-position:${json.score};opacity:1"></div>
                                            <div class="gldown">
                                                <a href="https://exhentai.org/gallerytorrents.php?gid=${json.gid}&amp;t=${json.tid}"
                                                    onclick="return popUp('https://exhentai.org/gallerytorrents.php?gid=${json.gid}&amp;t=${json.tid}',610,590)"
                                                    rel="nofollow"><img src="https://exhentai.org/img/t.png" alt="T" title="Show torrents">
                                                </a>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="gl3c glname" onmouseover="show_image_pane(${json.gid});preload_pane_image(0,0)" onmouseout="hide_image_pane()">
                                        <a href="https://exhentai.org/g/${json.gid}/${json.tid}/">
                                            <div class="glink">${json.post_title}</div>
                                            <div>
                                                ${
                                                    (() => {
                                                        let count = 0;
                                                        let result = '';
                                                        for (const [key, values] of json.tags) {
                                                            for (const tag of values) {
                                                                if (count >= 10) break;
                                                                result += `<div class="gt" title="${key}${tag}">${tag}</div>`;
                                                                count++;
                                                            }
                                                            if (count >= 10) break;
                                                        }
                                                        return result;
                                                    })()
                                                }
                                            </div>
                                            <div class="glfnote" style="display:none" id="favnote_${json.gid}"></div>
                                        </a>
                                    </td>
                                    <td class="glfc glfav">
                                        <p>${posted[0]}</p>
                                        <p>${posted[1]}</p>
                                    </td>
                                    <td class="glfc" style="text-align:center; padding-left:3px">
                                        <label class="lc">
                                            <div id="${json.key}" class="unFavorite">💔</div>
                                        </label>
                                    </td>
                                </tr>
                            `.replace(/>\s+</g, '><'));
                            fragment.appendChild(tr);
                        } else if (mode === "e") {
                            const tr = Syn.$createElement("tr");
                            const icon_class = json.icon_class.replace("cs", "cn");
                            tr.$iHtml(`
                                <tr>
                                    <td class="gl1e" style="width:250px">
                                        <div style="height:340px;width:250px">
                                            <a href="https://exhentai.org/g/${json.gid}/${json.tid}/">
                                                <img style="height:${json.img_height}; width:${json.img_width};top:-7px"
                                                    alt="${json.post_title}" title="${json.post_title}" src="${json.img_url}">
                                            </a>
                                        </div>
                                    </td>
                                    <td class="gl2e">
                                        <div>
                                            <div class="gl3e">
                                                <div class="${icon_class}">${json.icon_text}</div>
                                                <div style="border-color:#000;background-color:rgba(0,0,0,.1)"
                                                    onclick="popUp('https://exhentai.org/gallerypopups.php?gid=${json.gid}&amp;t=${json.tid}&amp;act=addfav',675,415)"
                                                    id="posted_${json.gid}" title="Favorites 0">${json.posted}
                                                </div>
                                                <div class="ir" style="background-position:${json.score};opacity:1">
                                                </div>
                                                <div>
                                                    <a href="${json.artist_link}">${json.artist_text}</a>
                                                </div>
                                                <div>${json.length}</div>
                                                <div class="gldown"><a
                                                        href="https://exhentai.org/gallerytorrents.php?gid=${json.gid}&amp;t=${json.tid}"
                                                        onclick="return popUp('https://exhentai.org/gallerytorrents.php?gid=${json.gid}&amp;t=${json.tid}',610,590)"
                                                        rel="nofollow"><img src="https://exhentai.org/img/t.png" alt="T" title="Show torrents">
                                                    </a>
                                                </div>
                                                <div>
                                                    <p>Favorited:</p>
                                                    <p>${json.favorited_time}</p>
                                                </div>
                                            </div><a href="https://exhentai.org/g/${json.gid}/${json.tid}/">
                                                <div class="gl4e glname" style="min-height:${json.img_height}">
                                                    <div class="glink">${json.post_title}</div>
                                                    <div>
                                                        <table>
                                                            <tbody>
                                                                ${
                                                                    json.tags.map(([key, values]) => {
                                                                        return `
                                                                            <tr>
                                                                                <td class="tc">${key}</td>
                                                                                <td>
                                                                                    ${values.map(value => `<div class="gtl" title="${key}${value}">${value}</div>`).join('')}
                                                                                </td>
                                                                            </tr>
                                                                        `;
                                                                    }).join('')
                                                                }
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div class="glfnote" style="display:none" id="favnote_${json.gid}"></div>
                                                </div>
                                            </a>
                                        </div>
                                    </td>
                                    <td class="glfe" style="text-align:center; padding-left:8px">
                                        <label class="lc">
                                            <div id="${json.key}" class="unFavorite">💔</div>
                                        </label>
                                    </td>
                                </tr>
                            `.replace(/>\s+</g, '><'));
                            fragment.appendChild(tr);
                        } else if (mode === "t") {
                            const div = Syn.$createElement("div", {class: "gl1t"});
                            div.$iHtml(`
                                <div class="gl4t glname glft">
                                    <div>
                                        <a href="https://exhentai.org/g/${json.gid}/${json.tid}/">
                                            <span class="glink">${json.post_title}</span>
                                        </a>
                                    </div>
                                    <div>
                                        <label class="lc">
                                            <div id="${json.key}" class="unFavorite">💔</div>
                                        </label>
                                    </div>
                                </div>
                                <div class="gl3t" style="height:340px;width:250px">
                                    <a href="https://exhentai.org/g/${json.gid}/${json.tid}/">
                                        <img style="height:${json.img_height}; width:${json.img_width};top:-7px"
                                                alt="${json.post_title}" title="${json.post_title}" src="${json.img_url}">
                                    </a>
                                </div>
                                <div class="glfnote" style="display:none" id="favnote_${json.gid}"></div>
                                <div class="gl5t">
                                    <div>
                                        <div class="${json.icon_class}">${json.icon_text}</div>
                                        <div style="border-color:#000;background-color:rgba(0,0,0,.1)"
                                            onclick="popUp('https://exhentai.org/gallerypopups.php?gid=${json.gid}&amp;t=${json.tid}&amp;act=addfav',675,415)"
                                            id="posted_${json.gid}" title="Favorites 0">${json.posted}</div>
                                    </div>
                                    <div>
                                        <div class="ir" style="background-position:${json.score};opacity:1"></div>
                                        <div>${json.length}</div>
                                        <div class="gldown">
                                            <a href="https://exhentai.org/gallerytorrents.php?gid=${json.gid}&amp;t=${json.tid}"
                                                onclick="return popUp('https://exhentai.org/gallerytorrents.php?gid=${json.gid}&amp;t=${json.tid}',610,590)"
                                                rel="nofollow"><img src="https://exhentai.org/img/t.png" alt="T" title="Show torrents">
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            `);
                            fragment.appendChild(div);
                        }
                    };

                    requestAnimationFrame(() => {
                        if (fragment) {
                            ido.$q("tbody")?.appendChild(fragment);
                            ido.$q("#favform .gld")?.appendChild(fragment);
                        }
                    });

                    ido.$onEvent("click", event => {
                        const target = event.target;

                        if (target.className === "unFavorite") {
                            const Favorites = Syn.gV("Favorites");
                            delete Favorites[target.id];
                            Syn.sV("Favorites", Favorites);
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
                    url: "https://raw.githubusercontent.com/Canaan-HS/Script-DataBase/main/Share/ExShare.json",
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
                const localHash = md5(JSON.stringify(Syn.gV("Share", {})));
                const remoteHash = md5(JSON.stringify(Shared));

                if (localHash !== remoteHash) {
                    Syn.sV("Share", Shared);
                    Growl(Transl("共享數據更新完成"), "jGrowl", 1500);

                    return true;
                } else {
                    Growl(Transl("共享數據無需更新"), "jGrowl", 1500);
                }
            } else {
                Syn.sV("Share", {});
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
                return Syn.$cookie().split("; ").reduce((acc, cookie) => {
                    const [name, value] = cookie.split("=");
                    acc[decodeURIComponent(name)] = decodeURIComponent(value);
                    return acc;
                }, {});
            },
            Add: function (CookieObject) { /* 添加 cookie */
                Syn.Local("DetectionTime", { value: Syn.GetDate() });
                for (const Cookie of CookieObject) {
                    Syn.$cookie(`${encodeURIComponent(Cookie.name)}=${encodeURIComponent(Cookie.value)}; domain=.${domain}; path=/; expires=${Expires};`);
                };
                location.reload();
            },
            Delete: function () { /* 刪除 cookie (避免意外使用兩種清除) */
                Object.keys(this.Get()).forEach(Name => {
                    Syn.$cookie(`${Name}=; expires=${UnixUTC}; path=/;`);
                    Syn.$cookie(`${Name}=; expires=${UnixUTC}; path=/; domain=.${domain}`);
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
                    Syn.Local("DetectionTime", { value: Syn.GetDate() });
                }
            }
        }
    };

    /* 語言支援 */
    function Language(lang) {
        const Word = {
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
                "帳戶": "账号",
                "更新": "更新",
                "登入": "登录",
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
                "帳戶": "アカウント",
                "更新": "更新",
                "登入": "ログイン",
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
                "確認選擇的 Cookies": "선택한 쿠키 확인",
                "帳戶": "계정",
                "更新": "업데이트",
                "登入": "로그인",
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
                "帳戶": "Аккаунт",
                "更新": "Обновить",
                "登入": "Войти",
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
                "帳戶": "Account",
                "更新": "Update",
                "登入": "Login",
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
        };

        const translator = Syn.TranslMatcher(Word, lang);
        return {
            Transl: (Str) => translator[Str] ?? Str
        };
    };

})();