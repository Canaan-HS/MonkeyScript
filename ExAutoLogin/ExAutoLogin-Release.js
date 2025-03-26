// ==UserScript==
// @name         [E/Ex-Hentai] AutoLogin
// @name:zh-TW   [E/Ex-Hentai] 自動登入
// @name:zh-CN   [E/Ex-Hentai] 自动登入
// @name:ja      [E/Ex-Hentai] 自動ログイン
// @name:ko      [E/Ex-Hentai] 자동 로그인
// @name:ru      [E/Ex-Hentai] Автоматический вход
// @name:en      [E/Ex-Hentai] AutoLogin
// @version      0.0.33
// @author       Canaan HS
// @description         E/Ex - 共享帳號登入、自動獲取 Cookies、手動輸入 Cookies、本地備份以及查看備份，自動檢測登入
// @description:zh-TW   E/Ex - 共享帳號登入、自動獲取 Cookies、手動輸入 Cookies、本地備份以及查看備份，自動檢測登入
// @description:zh-CN   E/Ex - 共享帐号登录、自动获取 Cookies、手动输入 Cookies、本地备份以及查看备份，自动检测登录
// @description:ja      E/Ex - 共有アカウントでのログイン、クッキーの自動取得、クッキーの手動入力、ローカルバックアップおよびバックアップの表示、自動ログイン検出
// @description:ko      E/Ex - 공유 계정 로그인, 자동으로 쿠키 가져오기, 쿠키 수동 입력, 로컬 백업 및 백업 보기, 자동 로그인 감지
// @description:ru      E/Ex - Вход в общий аккаунт, автоматическое получение cookies, ручной ввод cookies, локальное резервное копирование и просмотр резервных копий, автоматическое определение входа
// @description:en      E/Ex - Shared account login, automatic cookie retrieval, manual cookie input, local backup, and backup viewing, automatic login detection

// @connect      *
// @match        *://e-hentai.org/*
// @match        *://exhentai.org/*
// @icon         https://e-hentai.org/favicon.ico

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635

// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_addValueChangeListener

// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.19.0/js/md5.min.js
// @require      https://update.greasyfork.org/scripts/495339/1558818/ObjectSyntax_min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery-jgrowl/1.5.1/jquery.jgrowl.min.js
// @resource     jgrowl-css https://cdnjs.cloudflare.com/ajax/libs/jquery-jgrowl/1.5.1/jquery.jgrowl.min.css
// ==/UserScript==

(async () => {
    let l = Syn.Device.Host, d = ((async () => {
        let a, c, b, f, h;
        "e-hentai.org" == l
            ? (b = "color: #8f4701;", f = "background-color: #5C0D12; color: #fefefe;", a = "background-color: #fefefe; border: 3px ridge #34353b;", h = "color: #5C0D12; background-color: #fefefe; border: 2px solid #B5A4A4;", c = "color: #5C0D12; border: 2px solid #B5A4A4; background-color: #fefefe;")
            : "exhentai.org" == l && (b = "color: #989898;", f = "background-color: #fefefe; color: #5C0D12;", a = "background-color: #34353b; border: 2px ridge #5C0D12;",
                h = "color: #f1f1f1; background-color: #34353b; border: 2px solid #8d8d8d;", c = "color: #fefefe; border: 2px solid #8d8d8d; background-color: #34353b;", Syn.AddStyle("body {padding: 2px;color: #f1f1f1;text-align: center;background: #34353b;}"));
        Syn.AddStyle(`
            ${GM_getResourceText("jgrowl-css")}
            .jGrowl {
                ${f}
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
                ${a}
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
                ${h}
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
                ${a}
                width: 25%;
                padding: 1.5rem;
                overflow: auto;
                margin: 5rem auto;
                text-align: left;
                border-radius: 10px;
                border-collapse: collapse;
            }
            .modal-button {
                ${c}
                top: 0;
                margin: 3% 2%;
                font-size: 14px;
                font-weight: bold;
                border-radius: 3px;
            }
            .modal-button:hover, .modal-button:focus {
                ${b}
                cursor: pointer;
                text-decoration: none;
            }
            .set-modal {
                ${a}
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
        `)
    })(), (a => {
        var c = {}, b = {
            "\ud83c\udf6a \u5171\u4eab\u767b\u5165": "\ud83c\udf6a \u5171\u4eab\u767b\u5f55", "\ud83d\udfe2 \u555f\u7528\u6aa2\u6e2c": "\ud83d\udfe2 \u542f\u7528\u68c0\u6d4b", "\ud83d\udd34 \u7981\u7528\u6aa2\u6e2c": "\ud83d\udd34 \u7981\u7528\u68c0\u6d4b", "\ud83d\udcc2 \u5c55\u958b\u83dc\u55ae": "\ud83d\udcc2 \u5c55\u5f00\u83dc\u5355", "\ud83d\udcc1 \u647a\u758a\u83dc\u55ae": "\ud83d\udcc1 \u6298\u53e0\u83dc\u5355", "\ud83d\udcdc \u81ea\u52d5\u7372\u53d6": "\ud83d\udcdc \u81ea\u52a8\u83b7\u53d6",
            "\ud83d\udcdd \u624b\u52d5\u8f38\u5165": "\ud83d\udcdd \u624b\u52a8\u8f93\u5165", "\ud83d\udd0d \u67e5\u770b\u4fdd\u5b58": "\ud83d\udd0d \u67e5\u770b\u5df2\u4fdd\u5b58", "\ud83d\udd03 \u624b\u52d5\u6ce8\u5165": "\ud83d\udd03 \u624b\u52a8\u6ce8\u5165", "\ud83d\uddd1\ufe0f \u6e05\u9664\u767b\u5165": "\ud83d\uddd1\ufe0f \u6e05\u9664\u767b\u5f55\u4fe1\u606f", "\u5e33\u6236": "\u8d26\u53f7", "\u66f4\u65b0": "\u66f4\u65b0", "\u767b\u5165": "\u767b\u5f55", "\u78ba\u8a8d\u9078\u64c7\u7684 Cookies": "\u786e\u8ba4\u6240\u9009 Cookies",
            "\u78ba\u8a8d\u4fdd\u5b58": "\u786e\u8ba4\u4fdd\u5b58", "\u53d6\u6d88\u9000\u51fa": "\u53d6\u6d88", "\u9000\u51fa\u9078\u55ae": "\u5173\u95ed\u83dc\u5355", "\u4fdd\u5b58\u6210\u529f!": "\u4fdd\u5b58\u6210\u529f\uff01", "\u66f4\u6539\u4fdd\u5b58": "\u4fdd\u5b58\u66f4\u6539", "\u8b8a\u66f4\u901a\u77e5": "\u66f4\u6539\u901a\u77e5", "\u5df2\u4fdd\u5b58\u8b8a\u66f4": "\u66f4\u6539\u5df2\u4fdd\u5b58", "\u8a2d\u7f6e Cookies": "\u8bbe\u7f6e Cookies", "\u8981\u767b\u5165 Ex \u624d\u9700\u8981\u586b\u5beb": "\u4ec5\u767b\u5f55 Ex \u65f6\u9700\u8981\u586b\u5199",
            "\u5fc5\u586b\u9805\u76ee": "\u5fc5\u586b\u9879", "\u4e0b\u65b9\u9078\u586b \u4e5f\u53ef\u4e0d\u4fee\u6539": "\u4ee5\u4e0b\u4e3a\u9009\u586b\u9879\uff0c\u53ef\u4e0d\u4fee\u6539", "[\u78ba\u8a8d\u8f38\u5165\u6b63\u78ba] \u6309\u4e0b\u9000\u51fa\u9078\u55ae\u4fdd\u5b58": "[\u786e\u8ba4\u8f93\u5165\u65e0\u8bef] \u70b9\u51fb\u5173\u95ed\u83dc\u5355\u4fdd\u5b58", "\u7576\u524d\u8a2d\u7f6e Cookies": "\u5f53\u524d Cookies \u8bbe\u7f6e", "\u5e33\u6236\u9078\u64c7": "\u9009\u62e9\u8d26\u53f7", "\u672a\u7372\u53d6\u5230 Cookies !!\n\n\u8acb\u5148\u767b\u5165\u5e33\u6236": "\u672a\u83b7\u53d6\u5230 Cookies\uff01\n\n\u8bf7\u5148\u767b\u5f55\u8d26\u53f7",
            "\u672a\u6aa2\u6e2c\u5230\u53ef\u6ce8\u5165\u7684 Cookies !!\n\n\u8acb\u5f9e\u9078\u55ae\u4e2d\u9032\u884c\u8a2d\u7f6e": "\u672a\u68c0\u6d4b\u5230\u53ef\u6ce8\u5165\u7684 Cookies\uff01\n\n\u8bf7\u5728\u83dc\u5355\u4e2d\u8fdb\u884c\u8bbe\u7f6e", "\u5171\u4eab\u6578\u64da\u66f4\u65b0\u5b8c\u6210": "\u5171\u4eab\u6570\u636e\u66f4\u65b0\u5b8c\u6210", "\u5171\u4eab\u6578\u64da\u7121\u9700\u66f4\u65b0": "\u5171\u4eab\u6570\u636e\u65e0\u9700\u66f4\u65b0", "\u5171\u4eab\u6578\u64da\u7372\u53d6\u5931\u6557": "\u5171\u4eab\u6570\u636e\u83b7\u53d6\u5931\u8d25",
            "\u7121\u4fdd\u5b58\u7684 Cookie, \u7121\u6cd5\u555f\u7528\u81ea\u52d5\u767b\u5165": "\u6ca1\u6709\u5df2\u4fdd\u5b58\u7684 Cookie\uff0c\u65e0\u6cd5\u542f\u7528\u81ea\u52a8\u767b\u5f55", "\u8acb\u6c42\u70ba\u7a7a\u6578\u64da": "\u8bf7\u6c42\u6570\u636e\u4e3a\u7a7a", "\u9023\u7dda\u7570\u5e38\uff0c\u66f4\u65b0\u5730\u5740\u53ef\u80fd\u662f\u932f\u7684": "\u8fde\u63a5\u5f02\u5e38\uff0c\u66f4\u65b0\u5730\u5740\u53ef\u80fd\u4e0d\u6b63\u786e", "\u8acb\u6c42\u932f\u8aa4: ": "\u8bf7\u6c42\u9519\u8bef\uff1a"
        }, f =
            {
                "\ud83c\udf6a \u5171\u4eab\u767b\u5165": "\ud83c\udf6a \u5171\u6709\u30ed\u30b0\u30a4\u30f3", "\ud83d\udfe2 \u555f\u7528\u6aa2\u6e2c": "\ud83d\udfe2 \u691c\u51fa\u3092\u6709\u52b9\u5316", "\ud83d\udd34 \u7981\u7528\u6aa2\u6e2c": "\ud83d\udd34 \u691c\u51fa\u3092\u7121\u52b9\u5316", "\ud83d\udcc2 \u5c55\u958b\u83dc\u55ae": "\ud83d\udcc2 \u30e1\u30cb\u30e5\u30fc\u5c55\u958b", "\ud83d\udcc1 \u647a\u758a\u83dc\u55ae": "\ud83d\udcc1 \u30e1\u30cb\u30e5\u30fc\u6298\u308a\u305f\u305f\u307f", "\ud83d\udcdc \u81ea\u52d5\u7372\u53d6": "\ud83d\udcdc \u81ea\u52d5\u53d6\u5f97",
                "\ud83d\udcdd \u624b\u52d5\u8f38\u5165": "\ud83d\udcdd \u624b\u52d5\u5165\u529b", "\ud83d\udd0d \u67e5\u770b\u4fdd\u5b58": "\ud83d\udd0d \u4fdd\u5b58\u3092\u8868\u793a", "\ud83d\udd03 \u624b\u52d5\u6ce8\u5165": "\ud83d\udd03 \u624b\u52d5\u6ce8\u5165", "\ud83d\uddd1\ufe0f \u6e05\u9664\u767b\u5165": "\ud83d\uddd1\ufe0f \u30ed\u30b0\u30a4\u30f3\u3092\u30af\u30ea\u30a2", "\u5e33\u6236": "\u30a2\u30ab\u30a6\u30f3\u30c8", "\u66f4\u65b0": "\u66f4\u65b0", "\u767b\u5165": "\u30ed\u30b0\u30a4\u30f3", "\u78ba\u8a8d\u9078\u64c7\u7684 Cookies": "\u9078\u629e\u3057\u305fCookie\u3092\u78ba\u8a8d",
                "\u78ba\u8a8d\u4fdd\u5b58": "\u4fdd\u5b58\u3092\u78ba\u8a8d", "\u53d6\u6d88\u9000\u51fa": "\u7d42\u4e86\u3092\u30ad\u30e3\u30f3\u30bb\u30eb", "\u9000\u51fa\u9078\u55ae": "\u30e1\u30cb\u30e5\u30fc\u3092\u7d42\u4e86", "\u4fdd\u5b58\u6210\u529f!": "\u4fdd\u5b58\u306b\u6210\u529f\u3057\u307e\u3057\u305f\uff01", "\u66f4\u6539\u4fdd\u5b58": "\u5909\u66f4\u3092\u4fdd\u5b58", "\u8b8a\u66f4\u901a\u77e5": "\u5909\u66f4\u901a\u77e5", "\u5df2\u4fdd\u5b58\u8b8a\u66f4": "\u5909\u66f4\u304c\u4fdd\u5b58\u3055\u308c\u307e\u3057\u305f",
                "\u8a2d\u7f6e Cookies": "Cookie\u3092\u8a2d\u5b9a", "\u8981\u767b\u5165 Ex \u624d\u9700\u8981\u586b\u5beb": "Ex\u30ed\u30b0\u30a4\u30f3\u306b\u306e\u307f\u5fc5\u8981", "\u5fc5\u586b\u9805\u76ee": "\u5fc5\u9808\u9805\u76ee", "\u4e0b\u65b9\u9078\u586b \u4e5f\u53ef\u4e0d\u4fee\u6539": "\u4ee5\u4e0b\u306f\u4efb\u610f\u3001\u5909\u66f4\u3057\u306a\u304f\u3066\u3082\u69cb\u3044\u307e\u305b\u3093", "[\u78ba\u8a8d\u8f38\u5165\u6b63\u78ba] \u6309\u4e0b\u9000\u51fa\u9078\u55ae\u4fdd\u5b58": "[\u5165\u529b\u304c\u6b63\u3057\u3044\u3053\u3068\u3092\u78ba\u8a8d] \u30e1\u30cb\u30e5\u30fc\u7d42\u4e86\u3092\u62bc\u3057\u3066\u4fdd\u5b58",
                "\u7576\u524d\u8a2d\u7f6e Cookies": "\u73fe\u5728\u306eCookie\u8a2d\u5b9a", "\u5e33\u6236\u9078\u64c7": "\u30a2\u30ab\u30a6\u30f3\u30c8\u9078\u629e", "\u672a\u7372\u53d6\u5230 Cookies !!\n\n\u8acb\u5148\u767b\u5165\u5e33\u6236": "Cookie\u3092\u53d6\u5f97\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\uff01\n\n\u307e\u305a\u30a2\u30ab\u30a6\u30f3\u30c8\u306b\u30ed\u30b0\u30a4\u30f3\u3057\u3066\u304f\u3060\u3055\u3044", "\u672a\u6aa2\u6e2c\u5230\u53ef\u6ce8\u5165\u7684 Cookies !!\n\n\u8acb\u5f9e\u9078\u55ae\u4e2d\u9032\u884c\u8a2d\u7f6e": "\u6ce8\u5165\u53ef\u80fd\u306aCookie\u304c\u691c\u51fa\u3055\u308c\u307e\u305b\u3093\u3067\u3057\u305f\uff01\n\n\u30e1\u30cb\u30e5\u30fc\u304b\u3089\u8a2d\u5b9a\u3057\u3066\u304f\u3060\u3055\u3044",
                "\u5171\u4eab\u6578\u64da\u66f4\u65b0\u5b8c\u6210": "\u5171\u6709\u30c7\u30fc\u30bf\u306e\u66f4\u65b0\u304c\u5b8c\u4e86\u3057\u307e\u3057\u305f", "\u5171\u4eab\u6578\u64da\u7121\u9700\u66f4\u65b0": "\u5171\u6709\u30c7\u30fc\u30bf\u306e\u66f4\u65b0\u306f\u4e0d\u8981\u3067\u3059", "\u5171\u4eab\u6578\u64da\u7372\u53d6\u5931\u6557": "\u5171\u6709\u30c7\u30fc\u30bf\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f", "\u7121\u4fdd\u5b58\u7684 Cookie, \u7121\u6cd5\u555f\u7528\u81ea\u52d5\u767b\u5165": "\u4fdd\u5b58\u3055\u308c\u305fCookie\u304c\u306a\u3044\u305f\u3081\u3001\u81ea\u52d5\u30ed\u30b0\u30a4\u30f3\u3092\u6709\u52b9\u306b\u3067\u304d\u307e\u305b\u3093",
                "\u8acb\u6c42\u70ba\u7a7a\u6578\u64da": "\u30ea\u30af\u30a8\u30b9\u30c8\u306b\u30c7\u30fc\u30bf\u304c\u3042\u308a\u307e\u305b\u3093", "\u9023\u7dda\u7570\u5e38\uff0c\u66f4\u65b0\u5730\u5740\u53ef\u80fd\u662f\u932f\u7684": "\u63a5\u7d9a\u30a8\u30e9\u30fc\u3001\u66f4\u65b0\u30a2\u30c9\u30ec\u30b9\u304c\u9593\u9055\u3063\u3066\u3044\u308b\u53ef\u80fd\u6027\u304c\u3042\u308a\u307e\u3059", "\u8acb\u6c42\u932f\u8aa4: ": "\u30ea\u30af\u30a8\u30b9\u30c8\u30a8\u30e9\u30fc: "
            }, h = {
                "\ud83c\udf6a \u5171\u4eab\u767b\u5165": "\ud83c\udf6a \uacf5\uc720 \ub85c\uadf8\uc778",
                "\ud83d\udfe2 \u555f\u7528\u6aa2\u6e2c": "\ud83d\udfe2 \uac10\uc9c0 \ud65c\uc131\ud654", "\ud83d\udd34 \u7981\u7528\u6aa2\u6e2c": "\ud83d\udd34 \uac10\uc9c0 \ube44\ud65c\uc131\ud654", "\ud83d\udcc2 \u5c55\u958b\u83dc\u55ae": "\ud83d\udcc2 \uba54\ub274 \ud3bc\uce58\uae30", "\ud83d\udcc1 \u647a\u758a\u83dc\u55ae": "\ud83d\udcc1 \uba54\ub274 \uc811\uae30", "\ud83d\udcdc \u81ea\u52d5\u7372\u53d6": "\ud83d\udcdc \uc790\ub3d9 \uac00\uc838\uc624\uae30", "\ud83d\udcdd \u624b\u52d5\u8f38\u5165": "\ud83d\udcdd \uc218\ub3d9 \uc785\ub825",
                "\ud83d\udd0d \u67e5\u770b\u4fdd\u5b58": "\ud83d\udd0d \uc800\uc7a5\ub41c \ud56d\ubaa9 \ubcf4\uae30", "\ud83d\udd03 \u624b\u52d5\u6ce8\u5165": "\ud83d\udd03 \uc218\ub3d9 \uc8fc\uc785", "\ud83d\uddd1\ufe0f \u6e05\u9664\u767b\u5165": "\ud83d\uddd1\ufe0f \ub85c\uadf8\uc778 \uc815\ubcf4 \uc0ad\uc81c", "\u78ba\u8a8d\u9078\u64c7\u7684 Cookies": "\uc120\ud0dd\ud55c \ucfe0\ud0a4 \ud655\uc778", "\u5e33\u6236": "\uacc4\uc815", "\u66f4\u65b0": "\uc5c5\ub370\uc774\ud2b8", "\u767b\u5165": "\ub85c\uadf8\uc778", "\u78ba\u8a8d\u4fdd\u5b58": "\uc800\uc7a5 \ud655\uc778",
                "\u53d6\u6d88\u9000\u51fa": "\uc885\ub8cc \ucde8\uc18c", "\u9000\u51fa\u9078\u55ae": "\uba54\ub274 \uc885\ub8cc", "\u4fdd\u5b58\u6210\u529f!": "\uc800\uc7a5 \uc131\uacf5!", "\u66f4\u6539\u4fdd\u5b58": "\ubcc0\uacbd\uc0ac\ud56d \uc800\uc7a5", "\u8b8a\u66f4\u901a\u77e5": "\ubcc0\uacbd \uc54c\ub9bc", "\u5df2\u4fdd\u5b58\u8b8a\u66f4": "\ubcc0\uacbd\uc0ac\ud56d\uc774 \uc800\uc7a5\ub418\uc5c8\uc2b5\ub2c8\ub2e4", "\u8a2d\u7f6e Cookies": "\ucfe0\ud0a4 \uc124\uc815", "\u8981\u767b\u5165 Ex \u624d\u9700\u8981\u586b\u5beb": "Ex \ub85c\uadf8\uc778\uc5d0\ub9cc \ud544\uc694",
                "\u5fc5\u586b\u9805\u76ee": "\ud544\uc218 \ud56d\ubaa9", "\u4e0b\u65b9\u9078\u586b \u4e5f\u53ef\u4e0d\u4fee\u6539": "\uc544\ub798\ub294 \uc120\ud0dd\uc0ac\ud56d, \ubcc0\uacbd\ud558\uc9c0 \uc54a\uc544\ub3c4 \ub429\ub2c8\ub2e4", "[\u78ba\u8a8d\u8f38\u5165\u6b63\u78ba] \u6309\u4e0b\u9000\u51fa\u9078\u55ae\u4fdd\u5b58": "[\uc785\ub825\uc774 \uc815\ud655\ud55c\uc9c0 \ud655\uc778] \uba54\ub274 \uc885\ub8cc\ub97c \ub20c\ub7ec \uc800\uc7a5", "\u7576\u524d\u8a2d\u7f6e Cookies": "\ud604\uc7ac \uc124\uc815\ub41c \ucfe0\ud0a4",
                "\u5e33\u6236\u9078\u64c7": "\uacc4\uc815 \uc120\ud0dd", "\u672a\u7372\u53d6\u5230 Cookies !!\n\n\u8acb\u5148\u767b\u5165\u5e33\u6236": "\ucfe0\ud0a4\ub97c \uac00\uc838\uc624\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4!\n\n\uba3c\uc800 \uacc4\uc815\uc5d0 \ub85c\uadf8\uc778\ud574 \uc8fc\uc138\uc694", "\u672a\u6aa2\u6e2c\u5230\u53ef\u6ce8\u5165\u7684 Cookies !!\n\n\u8acb\u5f9e\u9078\u55ae\u4e2d\u9032\u884c\u8a2d\u7f6e": "\uc8fc\uc785 \uac00\ub2a5\ud55c \ucfe0\ud0a4\uac00 \uac10\uc9c0\ub418\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4!\n\n\uba54\ub274\uc5d0\uc11c \uc124\uc815\ud574 \uc8fc\uc138\uc694",
                "\u5171\u4eab\u6578\u64da\u66f4\u65b0\u5b8c\u6210": "\uacf5\uc720 \ub370\uc774\ud130 \uc5c5\ub370\uc774\ud2b8 \uc644\ub8cc", "\u5171\u4eab\u6578\u64da\u7121\u9700\u66f4\u65b0": "\uacf5\uc720 \ub370\uc774\ud130 \uc5c5\ub370\uc774\ud2b8 \ubd88\ud544\uc694", "\u5171\u4eab\u6578\u64da\u7372\u53d6\u5931\u6557": "\uacf5\uc720 \ub370\uc774\ud130 \uac00\uc838\uc624\uae30 \uc2e4\ud328", "\u7121\u4fdd\u5b58\u7684 Cookie, \u7121\u6cd5\u555f\u7528\u81ea\u52d5\u767b\u5165": "\uc800\uc7a5\ub41c \ucfe0\ud0a4\uac00 \uc5c6\uc5b4 \uc790\ub3d9 \ub85c\uadf8\uc778\uc744 \ud65c\uc131\ud654\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4",
                "\u8acb\u6c42\u70ba\u7a7a\u6578\u64da": "\uc694\uccad\uc5d0 \ub370\uc774\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4", "\u9023\u7dda\u7570\u5e38\uff0c\u66f4\u65b0\u5730\u5740\u53ef\u80fd\u662f\u932f\u7684": "\uc5f0\uacb0 \uc624\ub958, \uc5c5\ub370\uc774\ud2b8 \uc8fc\uc18c\uac00 \uc798\ubabb\ub418\uc5c8\uc744 \uc218 \uc788\uc2b5\ub2c8\ub2e4", "\u8acb\u6c42\u932f\u8aa4: ": "\uc694\uccad \uc624\ub958: "
            }, g = {
                "\ud83c\udf6a \u5171\u4eab\u767b\u5165": "\ud83c\udf6a \u041e\u0431\u0449\u0438\u0439 \u0432\u0445\u043e\u0434",
                "\ud83d\udfe2 \u555f\u7528\u6aa2\u6e2c": "\ud83d\udfe2 \u0412\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u043e\u0431\u043d\u0430\u0440\u0443\u0436\u0435\u043d\u0438\u0435", "\ud83d\udd34 \u7981\u7528\u6aa2\u6e2c": "\ud83d\udd34 \u041e\u0442\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u043e\u0431\u043d\u0430\u0440\u0443\u0436\u0435\u043d\u0438\u0435", "\ud83d\udcc2 \u5c55\u958b\u83dc\u55ae": "\ud83d\udcc2 \u0420\u0430\u0437\u0432\u0435\u0440\u043d\u0443\u0442\u044c \u043c\u0435\u043d\u044e", "\ud83d\udcc1 \u647a\u758a\u83dc\u55ae": "\ud83d\udcc1 \u0421\u0432\u0435\u0440\u043d\u0443\u0442\u044c \u043c\u0435\u043d\u044e",
                "\ud83d\udcdc \u81ea\u52d5\u7372\u53d6": "\ud83d\udcdc \u0410\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0435 \u043f\u043e\u043b\u0443\u0447\u0435\u043d\u0438\u0435", "\ud83d\udcdd \u624b\u52d5\u8f38\u5165": "\ud83d\udcdd \u0420\u0443\u0447\u043d\u043e\u0439 \u0432\u0432\u043e\u0434", "\ud83d\udd0d \u67e5\u770b\u4fdd\u5b58": "\ud83d\udd0d \u041f\u0440\u043e\u0441\u043c\u043e\u0442\u0440 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043d\u043e\u0433\u043e", "\ud83d\udd03 \u624b\u52d5\u6ce8\u5165": "\ud83d\udd03 \u0420\u0443\u0447\u043d\u043e\u0435 \u0432\u043d\u0435\u0434\u0440\u0435\u043d\u0438\u0435",
                "\ud83d\uddd1\ufe0f \u6e05\u9664\u767b\u5165": "\ud83d\uddd1\ufe0f \u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u0432\u0445\u043e\u0434", "\u5e33\u6236": "\u0410\u043a\u043a\u0430\u0443\u043d\u0442", "\u66f4\u65b0": "\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c", "\u767b\u5165": "\u0412\u043e\u0439\u0442\u0438", "\u78ba\u8a8d\u9078\u64c7\u7684 Cookies": "\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0435 Cookies", "\u78ba\u8a8d\u4fdd\u5b58": "\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435",
                "\u53d6\u6d88\u9000\u51fa": "\u041e\u0442\u043c\u0435\u043d\u0438\u0442\u044c \u0432\u044b\u0445\u043e\u0434", "\u9000\u51fa\u9078\u55ae": "\u0412\u044b\u0439\u0442\u0438 \u0438\u0437 \u043c\u0435\u043d\u044e", "\u4fdd\u5b58\u6210\u529f!": "\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435 \u0443\u0441\u043f\u0435\u0448\u043d\u043e!", "\u66f4\u6539\u4fdd\u5b58": "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f", "\u8b8a\u66f4\u901a\u77e5": "\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u0435 \u043e\u0431 \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f\u0445",
                "\u5df2\u4fdd\u5b58\u8b8a\u66f4": "\u0418\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u044b", "\u8a2d\u7f6e Cookies": "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0430 Cookies", "\u8981\u767b\u5165 Ex \u624d\u9700\u8981\u586b\u5beb": "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u0442\u043e\u043b\u044c\u043a\u043e \u0434\u043b\u044f \u0432\u0445\u043e\u0434\u0430 \u0432 Ex", "\u5fc5\u586b\u9805\u76ee": "\u041e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e\u0435 \u043f\u043e\u043b\u0435",
                "\u4e0b\u65b9\u9078\u586b \u4e5f\u53ef\u4e0d\u4fee\u6539": "\u041d\u0435\u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e \u043d\u0438\u0436\u0435, \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f \u043d\u0435 \u0442\u0440\u0435\u0431\u0443\u044e\u0442\u0441\u044f", "[\u78ba\u8a8d\u8f38\u5165\u6b63\u78ba] \u6309\u4e0b\u9000\u51fa\u9078\u55ae\u4fdd\u5b58": "[\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u043f\u0440\u0430\u0432\u0438\u043b\u044c\u043d\u043e\u0441\u0442\u044c \u0432\u0432\u043e\u0434\u0430] \u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u0412\u044b\u0439\u0442\u0438 \u0438\u0437 \u043c\u0435\u043d\u044e \u0434\u043b\u044f \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u044f",
                "\u7576\u524d\u8a2d\u7f6e Cookies": "\u0422\u0435\u043a\u0443\u0449\u0438\u0435 \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 Cookies", "\u5e33\u6236\u9078\u64c7": "\u0412\u044b\u0431\u043e\u0440 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430", "\u672a\u7372\u53d6\u5230 Cookies !!\n\n\u8acb\u5148\u767b\u5165\u5e33\u6236": "Cookies \u043d\u0435 \u043f\u043e\u043b\u0443\u0447\u0435\u043d\u044b !!\n\n\u041f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430, \u0441\u043d\u0430\u0447\u0430\u043b\u0430 \u0432\u043e\u0439\u0434\u0438\u0442\u0435 \u0432 \u0430\u043a\u043a\u0430\u0443\u043d\u0442",
                "\u672a\u6aa2\u6e2c\u5230\u53ef\u6ce8\u5165\u7684 Cookies !!\n\n\u8acb\u5f9e\u9078\u55ae\u4e2d\u9032\u884c\u8a2d\u7f6e": "\u041d\u0435 \u043e\u0431\u043d\u0430\u0440\u0443\u0436\u0435\u043d\u044b Cookies \u0434\u043b\u044f \u0432\u043d\u0435\u0434\u0440\u0435\u043d\u0438\u044f !!\n\n\u041f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430, \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u0442\u0435 \u0432 \u043c\u0435\u043d\u044e", "\u5171\u4eab\u6578\u64da\u66f4\u65b0\u5b8c\u6210": "\u041e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435 \u043e\u0431\u0449\u0438\u0445 \u0434\u0430\u043d\u043d\u044b\u0445 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043e",
                "\u5171\u4eab\u6578\u64da\u7121\u9700\u66f4\u65b0": "\u041e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435 \u043e\u0431\u0449\u0438\u0445 \u0434\u0430\u043d\u043d\u044b\u0445 \u043d\u0435 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f", "\u5171\u4eab\u6578\u64da\u7372\u53d6\u5931\u6557": "\u041e\u0448\u0438\u0431\u043a\u0430 \u043f\u043e\u043b\u0443\u0447\u0435\u043d\u0438\u044f \u043e\u0431\u0449\u0438\u0445 \u0434\u0430\u043d\u043d\u044b\u0445", "\u7121\u4fdd\u5b58\u7684 Cookie, \u7121\u6cd5\u555f\u7528\u81ea\u52d5\u767b\u5165": "\u041d\u0435\u0442 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043d\u044b\u0445 cookies, \u043d\u0435\u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e \u0432\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0432\u0445\u043e\u0434",
                "\u8acb\u6c42\u70ba\u7a7a\u6578\u64da": "\u0417\u0430\u043f\u0440\u043e\u0441 \u0441\u043e\u0434\u0435\u0440\u0436\u0438\u0442 \u043f\u0443\u0441\u0442\u044b\u0435 \u0434\u0430\u043d\u043d\u044b\u0435", "\u9023\u7dda\u7570\u5e38\uff0c\u66f4\u65b0\u5730\u5740\u53ef\u80fd\u662f\u932f\u7684": "\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u043e\u0435\u0434\u0438\u043d\u0435\u043d\u0438\u044f, \u0430\u0434\u0440\u0435\u0441 \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u044f \u043c\u043e\u0436\u0435\u0442 \u0431\u044b\u0442\u044c \u043d\u0435\u0432\u0435\u0440\u043d\u044b\u043c",
                "\u8acb\u6c42\u932f\u8aa4: ": "\u041e\u0448\u0438\u0431\u043a\u0430 \u0437\u0430\u043f\u0440\u043e\u0441\u0430: "
            }, e = {
                "\ud83c\udf6a \u5171\u4eab\u767b\u5165": "\ud83c\udf6a Shared Login", "\ud83d\udfe2 \u555f\u7528\u6aa2\u6e2c": "\ud83d\udfe2 Enable Detection", "\ud83d\udd34 \u7981\u7528\u6aa2\u6e2c": "\ud83d\udd34 Disable Detection", "\ud83d\udcc2 \u5c55\u958b\u83dc\u55ae": "\ud83d\udcc2 Expand Menu", "\ud83d\udcc1 \u647a\u758a\u83dc\u55ae": "\ud83d\udcc1 Collapse Menu", "\ud83d\udcdc \u81ea\u52d5\u7372\u53d6": "\ud83d\udcdc Auto Retrieve",
                "\ud83d\udcdd \u624b\u52d5\u8f38\u5165": "\ud83d\udcdd Manual Input", "\ud83d\udd0d \u67e5\u770b\u4fdd\u5b58": "\ud83d\udd0d View Saved", "\ud83d\udd03 \u624b\u52d5\u6ce8\u5165": "\ud83d\udd03 Manual Injection", "\ud83d\uddd1\ufe0f \u6e05\u9664\u767b\u5165": "\ud83d\uddd1\ufe0f Clear Login", "\u5e33\u6236": "Account", "\u66f4\u65b0": "Update", "\u767b\u5165": "Login", "\u78ba\u8a8d\u9078\u64c7\u7684 Cookies": "Confirm Selected Cookies", "\u78ba\u8a8d\u4fdd\u5b58": "Confirm Save", "\u53d6\u6d88\u9000\u51fa": "Cancel Exit",
                "\u9000\u51fa\u9078\u55ae": "Exit Menu", "\u4fdd\u5b58\u6210\u529f!": "Save Successful!", "\u66f4\u6539\u4fdd\u5b58": "Save Changes", "\u8b8a\u66f4\u901a\u77e5": "Change Notification", "\u5df2\u4fdd\u5b58\u8b8a\u66f4": "Changes Saved", "\u8a2d\u7f6e Cookies": "Set Cookies", "\u8981\u767b\u5165 Ex \u624d\u9700\u8981\u586b\u5beb": "Required for Ex Login Only", "\u5fc5\u586b\u9805\u76ee": "Required Field", "\u4e0b\u65b9\u9078\u586b \u4e5f\u53ef\u4e0d\u4fee\u6539": "Optional Fields Below - No Changes Required", "[\u78ba\u8a8d\u8f38\u5165\u6b63\u78ba] \u6309\u4e0b\u9000\u51fa\u9078\u55ae\u4fdd\u5b58": "[Confirm Input is Correct] Press Exit Menu to Save",
                "\u7576\u524d\u8a2d\u7f6e Cookies": "Current Cookie Settings", "\u5e33\u6236\u9078\u64c7": "Account Selection", "\u672a\u7372\u53d6\u5230 Cookies !!\n\n\u8acb\u5148\u767b\u5165\u5e33\u6236": "No Cookies Retrieved!\n\nPlease Login First", "\u672a\u6aa2\u6e2c\u5230\u53ef\u6ce8\u5165\u7684 Cookies !!\n\n\u8acb\u5f9e\u9078\u55ae\u4e2d\u9032\u884c\u8a2d\u7f6e": "No Injectable Cookies Detected!\n\nPlease Configure in Menu", "\u5171\u4eab\u6578\u64da\u66f4\u65b0\u5b8c\u6210": "Shared Data Update Complete", "\u5171\u4eab\u6578\u64da\u7121\u9700\u66f4\u65b0": "Shared Data Update Not Needed",
                "\u5171\u4eab\u6578\u64da\u7372\u53d6\u5931\u6557": "Shared Data Retrieval Failed", "\u7121\u4fdd\u5b58\u7684 Cookie, \u7121\u6cd5\u555f\u7528\u81ea\u52d5\u767b\u5165": "No Saved Cookies - Unable to Enable Auto-Login", "\u8acb\u6c42\u70ba\u7a7a\u6578\u64da": "Request Contains No Data", "\u9023\u7dda\u7570\u5e38\uff0c\u66f4\u65b0\u5730\u5740\u53ef\u80fd\u662f\u932f\u7684": "Connection Error - Update Address May Be Incorrect", "\u8acb\u6c42\u932f\u8aa4: ": "Request Error: "
            }; c = {
                ko: h, "ko-KR": h, ja: f, "ja-JP": f,
                ru: g, "ru-RU": g, en: e, "en-US": e, "en-GB": e, "en-AU": e, "en-CA": e, "en-NZ": e, "en-IE": e, "en-ZA": e, "en-IN": e, zh: b, "zh-CN": b, "zh-SG": b, "zh-MY": b, "zh-TW": c, "zh-HK": c, "zh-MO": c
            }; let m = c[a] ?? c["en-US"]; return { Transl: n => m[n] ?? n }
    })(Syn.Device.Lang)), k = (() => {
        let a = void 0; var c = new Date; c.setFullYear(c.getFullYear() + 1); let b = c.toUTCString(), f = (new Date(0)).toUTCString(), h = ["ipb_member_id", "ipb_pass_hash"]; return "exhentai.org" == l && h.unshift("igneous"), {
            Get: () => document.cookie.split("; ").reduce((g, e) => {
                var [e, m] = e.split("=");
                return g[decodeURIComponent(e)] = decodeURIComponent(m), g
            }, {}), Add: function (g) { Syn.Storage("DetectionTime", { type: localStorage, value: (new Date).getTime() }); for (a of g) document.cookie = `${encodeURIComponent(a.name)}=${encodeURIComponent(a.value)}; domain=.${l}; path=/; expires=${b};`; location.reload() }, Delete: function () { Object.keys(this.Get()).forEach(g => { document.cookie = `${g}=; expires=${f}; path=/;`; document.cookie = `${g}=; expires=${f}; path=/; domain=.` + l }) }, ReAdd: function (g) { this.Delete(); this.Add(g) },
            Verify: function (g) { let e = this.Get(), m = new Set(Object.keys(e)); h.every(n => m.has(n) && "mystery" !== e[n]) ? Syn.Storage("DetectionTime", { type: localStorage, value: (new Date).getTime() }) : this.ReAdd(g) }
        }
    })(); (new class {
        constructor() {
            this.modal = null; this.Share = Syn.Store("g", "Share") ?? this.UpdateShared(); this.on = async (a, c, b) => { $(a).on(c, b) }; this.Growl = async (a, c, b) => { $.jGrowl(`&emsp;&emsp;${a}&emsp;&emsp;`, { theme: c, life: b }) }; this.CreateDetection = () => { var a = $(".modal-background"); a[0] && a.remove() }; this.CreateMenu =
                async () => { $(document.body).append(this.modal); requestAnimationFrame(() => { $(".modal-background").css({ opacity: "1", "background-color": "rgba(0,0,0,0.7)", transform: "translate(-50%, -50%) scale(1)" }) }) }; this.DeleteMenu = async () => { let a = $(".modal-background"); a.css({ opacity: "0", "pointer-events": "none", "background-color": "rgba(0,0,0,0)", transform: "translate(-50%, -50%) scale(0)" }); setTimeout(() => { a.remove() }, 1300) }; this.GlobalMenuToggle = async () => { Syn.StoreListen(["Login", "Expand"], a => { a.far && this.LoginToggle() }) };
            this.LoginToggle = async () => {
                let a = !!Syn.Store("gj", "E/Ex_Cookies"), c = Syn.Store("g", "Login", a); var b = c ? d.Transl("\ud83d\udfe2 \u555f\u7528\u6aa2\u6e2c") : d.Transl("\ud83d\udd34 \u7981\u7528\u6aa2\u6e2c"); Syn.Menu({ [b]: { func: () => { if (c) Syn.Store("s", "Login", !1); else { if (!a) return void alert(d.Transl("\u7121\u4fdd\u5b58\u7684 Cookie, \u7121\u6cd5\u555f\u7528\u81ea\u52d5\u767b\u5165")); Syn.Store("s", "Login", !0) } this.LoginToggle() }, close: !1 } }, "Check"); Syn.Menu({
                    [d.Transl("\ud83c\udf6a \u5171\u4eab\u767b\u5165")]: {
                        func: () =>
                            this.SharedLogin()
                    }
                }); this.MenuToggle()
            }; this.MenuToggle = async () => { let a = Syn.Store("g", "Expand", !1), c = a ? d.Transl("\ud83d\udcc1 \u647a\u758a\u83dc\u55ae") : d.Transl("\ud83d\udcc2 \u5c55\u958b\u83dc\u55ae"); Syn.Menu({ [c]: { func: () => { a ? Syn.Store("s", "Expand", !1) : Syn.Store("s", "Expand", !0); this.MenuToggle() }, hotkey: "c", close: !1 } }, "Switch"); a ? this.Expand() : this.Collapse() }; this.Expand = async () => {
                Syn.Menu({
                    [d.Transl("\ud83d\udcdc \u81ea\u52d5\u7372\u53d6")]: { func: () => this.GetCookieAutomatically() }, [d.Transl("\ud83d\udcdd \u624b\u52d5\u8f38\u5165")]: {
                        func: () =>
                            this.ManualSetting()
                    }, [d.Transl("\ud83d\udd0d \u67e5\u770b\u4fdd\u5b58")]: { func: () => this.ViewSaveCookie() }, [d.Transl("\ud83d\udd03 \u624b\u52d5\u6ce8\u5165")]: { func: () => this.CookieInjection() }, [d.Transl("\ud83d\uddd1\ufe0f \u6e05\u9664\u767b\u5165")]: { func: () => this.ClearLogin() }
                }, "Expand")
            }; this.Collapse = async () => { for (let a = 1; 5 >= a; a++)GM_unregisterMenuCommand("Expand-" + a) }
        } async Main() {
            var a, c, b = Syn.Store("gj", "E/Ex_Cookies"); Syn.Store("g", "Login", !!b) && b && (a = new Date, c = (c = Syn.Storage("DetectionTime",
                { type: localStorage })) ? new Date(c) : new Date(a.getTime() + 66E4), 10 <= Math.abs(c - a) / 6E4) && k.Verify(b); this.LoginToggle(); this.GlobalMenuToggle()
        } async GetSharedDict() {
            return new Promise((a, c) => {
                GM_xmlhttpRequest({
                    method: "GET", responseType: "json", url: "https://raw.githubusercontent.com/Canaan-HS/Script-DataBase/main/Share/ExShare.json", onload: b => {
                        200 === b.status ? "object" == typeof (b = b.response) && 0 < Object.keys(b).length ? a(b) : (console.error(d.Transl("\u8acb\u6c42\u70ba\u7a7a\u6578\u64da")), a({})) : (console.error(d.Transl("\u9023\u7dda\u7570\u5e38\uff0c\u66f4\u65b0\u5730\u5740\u53ef\u80fd\u662f\u932f\u7684")),
                            a({}))
                    }, onerror: b => { console.error(d.Transl("\u8acb\u6c42\u932f\u8aa4: "), b); a({}) }
                })
            })
        } async UpdateShared() {
            var a = await this.GetSharedDict(); if (0 < Object.keys(a).length) if (md5(JSON.stringify(Syn.Store("g", "Share", {}))) !== md5(JSON.stringify(a))) { this.Share = a; Syn.Store("s", "Share", a); this.Growl(d.Transl("\u5171\u4eab\u6578\u64da\u66f4\u65b0\u5b8c\u6210"), "jGrowl", 1500); let c = Syn.$$(".modal-background"); c && setTimeout(() => { c.remove(); this.SharedLogin() }, 600) } else this.Growl(d.Transl("\u5171\u4eab\u6578\u64da\u7121\u9700\u66f4\u65b0"),
                "jGrowl", 1500); else Syn.Store("s", "Share", {}), this.Growl(d.Transl("\u5171\u4eab\u6578\u64da\u7372\u53d6\u5931\u6557"), "jGrowl", 1500)
        } async SharedLogin() {
            this.CreateDetection(); let a = this.Share, c = Object.keys(a).length, b = k.Get().igneous, f = $('<select id="account-select" class="acc-select"></select>'), h; for (let e = 1; e <= c; e++)a[e][0].value == b && (h = e), f.append($("<option>").attr({ value: e }).text(d.Transl("\u5e33\u6236") + " " + e)); this.modal = $(`
                <div class="modal-background">
                    <div class="acc-modal">
                        <h1>${d.Transl("\u5e33\u6236\u9078\u64c7")}</h1>
                        <div class="acc-select-flex">${f.prop("outerHTML")}</div>
                        <div class="acc-button-flex">
                            <button class="modal-button" id="update">${d.Transl("\u66f4\u65b0")}</button>
                            <button class="modal-button" id="login">${d.Transl("\u767b\u5165")}</button>
                        </div>
                    </div>
                </div>
            `); this.CreateMenu(); h && $("#account-select").val(h); let g = this; g.on(".modal-background", "click", function (e) { e.stopImmediatePropagation(); e = e.target; "login" == e.id ? k.ReAdd(a[+$("#account-select").val()]) : "update" == e.id ? g.UpdateShared() : "modal-background" == e.className && g.DeleteMenu() })
        } async GetCookieAutomatically() { var a, c, b = []; for ([a, c] of Object.entries(k.Get())) b.push({ name: a, value: c }); 1 < b.length ? this.Cookie_Show(JSON.stringify(b, null, 4)) : alert(d.Transl("\u672a\u7372\u53d6\u5230 Cookies !!\n\n\u8acb\u5148\u767b\u5165\u5e33\u6236")) } async Cookie_Show(a) {
            this.CreateDetection();
            this.modal = `
                <div class="modal-background">
                    <div class="show-modal">
                    <h1 style="text-align: center;">${d.Transl("\u78ba\u8a8d\u9078\u64c7\u7684 Cookies")}</h1>
                        <pre><b>${a}</b></pre>
                        <div style="text-align: right;">
                            <button class="modal-button" id="save">${d.Transl("\u78ba\u8a8d\u4fdd\u5b58")}</button>
                            <button class="modal-button" id="close">${d.Transl("\u53d6\u6d88\u9000\u51fa")}</button>
                        </div>
                    </div>
                </div>
            `; this.CreateMenu(); let c = this; c.on(".modal-background", "click", function (b) { b.stopImmediatePropagation(); b = b.target; "save" == b.id ? (Syn.Store("s", "E/Ex_Cookies", a), c.Growl(d.Transl("\u4fdd\u5b58\u6210\u529f!"), "jGrowl", 1500), c.DeleteMenu()) : "modal-background" != b.className && "close" != b.id || c.DeleteMenu() })
        } async ManualSetting() {
            this.CreateDetection(); this.modal = `
                <div class="modal-background">
                    <div class="set-modal">
                    <h1>${d.Transl("\u8a2d\u7f6e Cookies")}</h1>
                        <form id="set_cookies">
                            <div id="input_cookies" class="set-box">
                                <label>[igneous]\uff1a</label><input class="set-list" type="text" name="igneous" placeholder="${d.Transl("\u8981\u767b\u5165 Ex \u624d\u9700\u8981\u586b\u5beb")}"><br>
                                <label>[ipb_member_id]\uff1a</label><input class="set-list" type="text" name="ipb_member_id" placeholder="${d.Transl("\u5fc5\u586b\u9805\u76ee")}" required><br>
                                <label>[ipb_pass_hash]\uff1a</label><input class="set-list" type="text" name="ipb_pass_hash" placeholder="${d.Transl("\u5fc5\u586b\u9805\u76ee")}" required><hr>
                                <h3>${d.Transl("\u4e0b\u65b9\u9078\u586b \u4e5f\u53ef\u4e0d\u4fee\u6539")}</h3>
                                <label>[sl]\uff1a</label><input class="set-list" type="text" name="sl" value="dm_2"><br>
                                <label>[sk]\uff1a</label><input class="set-list" type="text" name="sk"><br>
                            </div>
                            <button type="submit" class="modal-button" id="save">${d.Transl("\u78ba\u8a8d\u4fdd\u5b58")}</button>
                            <button class="modal-button" id="close">${d.Transl("\u9000\u51fa\u9078\u55ae")}</button>
                        </form>
                    </div>
                </div>
            `; this.CreateMenu(); let a, c = $("<textarea>").attr({ style: "margin: 1.15rem auto 0 auto", rows: 18, cols: 40, readonly: !0 }), b = this; b.on("#set_cookies", "submit", function (f) {
                f.preventDefault(); f.stopImmediatePropagation(); f = Array.from($("#set_cookies .set-list")).map(function (h) { var g = $(h).val(); return "" !== g.trim() ? { name: $(h).attr("name"), value: g } : null }).filter(Boolean); a = JSON.stringify(f, null, 4); c.val(a); $("#set_cookies div").append(c); b.Growl(d.Transl("[\u78ba\u8a8d\u8f38\u5165\u6b63\u78ba] \u6309\u4e0b\u9000\u51fa\u9078\u55ae\u4fdd\u5b58"),
                    "jGrowl", 3E3)
            }); b.on(".modal-background", "click", function (f) { f.stopImmediatePropagation(); var h = f.target; "modal-background" != h.className && "close" != h.id || (f.preventDefault(), a && Syn.Store("s", "E/Ex_Cookies", a), b.DeleteMenu()) })
        } async ViewSaveCookie() {
            this.CreateDetection(); this.modal = `
                <div class="modal-background">
                    <div class="set-modal">
                    <h1>${d.Transl("\u7576\u524d\u8a2d\u7f6e Cookies")}</h1>
                        <div id="view_cookies" style="margin: 0.6rem"></div>
                        <button class="modal-button" id="save">${d.Transl("\u66f4\u6539\u4fdd\u5b58")}</button>
                        <button class="modal-button" id="close">${d.Transl("\u9000\u51fa\u9078\u55ae")}</button>
                    </div>
                </div>
            `; this.CreateMenu(); var a = Syn.Store("gj", "E/Ex_Cookies"); let c = $("<textarea>").attr({ rows: 20, cols: 50, id: "view_SC", style: "margin-top: 1.25rem;" }), b = this; c.val(JSON.stringify(a, null, 4)); $("#view_cookies").append(c); b.on(".modal-background", "click", function (f) {
                f.stopImmediatePropagation(); f = f.target; "save" == f.id ? (GM_notification({ title: d.Transl("\u8b8a\u66f4\u901a\u77e5"), text: d.Transl("\u5df2\u4fdd\u5b58\u8b8a\u66f4"), image: "https://cdn-icons-png.flaticon.com/512/5234/5234222.png", timeout: 3E3 }),
                    Syn.Store("sj", "E/Ex_Cookies", JSON.parse($("#view_SC").val())), b.DeleteMenu()) : "modal-background" != f.className && "close" != f.id || b.DeleteMenu()
            })
        } async CookieInjection() { try { k.ReAdd(Syn.Store("gj", "E/Ex_Cookies")) } catch (a) { alert(d.Transl("\u672a\u6aa2\u6e2c\u5230\u53ef\u6ce8\u5165\u7684 Cookies !!\n\n\u8acb\u5f9e\u9078\u55ae\u4e2d\u9032\u884c\u8a2d\u7f6e")) } } async ClearLogin() { k.Delete(); location.reload() }
    }).Main()
})();