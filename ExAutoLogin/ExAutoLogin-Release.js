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

// @require      https://update.greasyfork.org/scripts/487608/1563601/SyntaxLite_min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.19.0/js/md5.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js

// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery-jgrowl/1.5.1/jquery.jgrowl.min.js
// @resource     jgrowl-css https://cdnjs.cloudflare.com/ajax/libs/jquery-jgrowl/1.5.1/jquery.jgrowl.min.css
// ==/UserScript==

(async () => {
    async function J(f, m, n) { $.jGrowl(`&emsp;&emsp;${f}&emsp;&emsp;`, { theme: m, life: n, speed: "slow" }) } let K = Syn.$domain, b = (f => {
        let m = Syn.TranslMatcher({
            Traditional: {}, Simplified: {
                "\ud83c\udf6a \u5171\u4eab\u767b\u5165": "\ud83c\udf6a \u5171\u4eab\u767b\u5f55", "\ud83d\udfe2 \u555f\u7528\u6aa2\u6e2c": "\ud83d\udfe2 \u542f\u7528\u68c0\u6d4b", "\ud83d\udd34 \u7981\u7528\u6aa2\u6e2c": "\ud83d\udd34 \u7981\u7528\u68c0\u6d4b", "\ud83d\udcc2 \u5c55\u958b\u83dc\u55ae": "\ud83d\udcc2 \u5c55\u5f00\u83dc\u5355",
                "\ud83d\udcc1 \u647a\u758a\u83dc\u55ae": "\ud83d\udcc1 \u6298\u53e0\u83dc\u5355", "\ud83d\udcdc \u81ea\u52d5\u7372\u53d6": "\ud83d\udcdc \u81ea\u52a8\u83b7\u53d6", "\ud83d\udcdd \u624b\u52d5\u8f38\u5165": "\ud83d\udcdd \u624b\u52a8\u8f93\u5165", "\ud83d\udd0d \u67e5\u770b\u4fdd\u5b58": "\ud83d\udd0d \u67e5\u770b\u5df2\u4fdd\u5b58", "\ud83d\udd03 \u624b\u52d5\u6ce8\u5165": "\ud83d\udd03 \u624b\u52a8\u6ce8\u5165", "\ud83d\uddd1\ufe0f \u6e05\u9664\u767b\u5165": "\ud83d\uddd1\ufe0f \u6e05\u9664\u767b\u5f55\u4fe1\u606f",
                "\ud83d\udc96 \u6dfb\u52a0\u6536\u85cf": "\ud83d\udc96 \u6dfb\u52a0\u6536\u85cf", "\ud83d\udc98 \u53d6\u6d88\u6536\u85cf": "\ud83d\udc98 \u53d6\u6d88\u6536\u85cf", "\u5e33\u6236": "\u8d26\u53f7", "\u66f4\u65b0": "\u66f4\u65b0", "\u767b\u5165": "\u767b\u5f55", "\u78ba\u8a8d\u9078\u64c7\u7684 Cookies": "\u786e\u8ba4\u6240\u9009 Cookies", "\u78ba\u8a8d\u4fdd\u5b58": "\u786e\u8ba4\u4fdd\u5b58", "\u53d6\u6d88\u9000\u51fa": "\u53d6\u6d88", "\u9000\u51fa\u9078\u55ae": "\u5173\u95ed\u83dc\u5355", "\u4fdd\u5b58\u6210\u529f!": "\u4fdd\u5b58\u6210\u529f\uff01",
                "\u66f4\u6539\u4fdd\u5b58": "\u4fdd\u5b58\u66f4\u6539", "\u5df2\u4fdd\u5b58\u8b8a\u66f4": "\u66f4\u6539\u5df2\u4fdd\u5b58", "\u8a2d\u7f6e Cookies": "\u8bbe\u7f6e Cookies", "\u8981\u767b\u5165 Ex \u624d\u9700\u8981\u586b\u5beb": "\u4ec5\u767b\u5f55 Ex \u65f6\u9700\u8981\u586b\u5199", "\u5fc5\u586b\u9805\u76ee": "\u5fc5\u586b\u9879", "\u4e0b\u65b9\u9078\u586b \u4e5f\u53ef\u4e0d\u4fee\u6539": "\u4ee5\u4e0b\u4e3a\u9009\u586b\u9879\uff0c\u53ef\u4e0d\u4fee\u6539", "[\u78ba\u8a8d\u8f38\u5165\u6b63\u78ba] \u6309\u4e0b\u9000\u51fa\u9078\u55ae\u4fdd\u5b58": "[\u786e\u8ba4\u8f93\u5165\u65e0\u8bef] \u70b9\u51fb\u5173\u95ed\u83dc\u5355\u4fdd\u5b58",
                "\u7576\u524d\u8a2d\u7f6e Cookies": "\u5f53\u524d Cookies \u8bbe\u7f6e", "\u5e33\u6236\u9078\u64c7": "\u9009\u62e9\u8d26\u53f7", "\u672a\u7372\u53d6\u5230 Cookies !!\n\n\u8acb\u5148\u767b\u5165\u5e33\u6236": "\u672a\u83b7\u53d6\u5230 Cookies\uff01\n\n\u8bf7\u5148\u767b\u5f55\u8d26\u53f7", "\u672a\u6aa2\u6e2c\u5230\u53ef\u6ce8\u5165\u7684 Cookies !!\n\n\u8acb\u5f9e\u9078\u55ae\u4e2d\u9032\u884c\u8a2d\u7f6e": "\u672a\u68c0\u6d4b\u5230\u53ef\u6ce8\u5165\u7684 Cookies\uff01\n\n\u8bf7\u5728\u83dc\u5355\u4e2d\u8fdb\u884c\u8bbe\u7f6e",
                "\u5171\u4eab\u6578\u64da\u66f4\u65b0\u5b8c\u6210": "\u5171\u4eab\u6570\u636e\u66f4\u65b0\u5b8c\u6210", "\u5171\u4eab\u6578\u64da\u7121\u9700\u66f4\u65b0": "\u5171\u4eab\u6570\u636e\u65e0\u9700\u66f4\u65b0", "\u5171\u4eab\u6578\u64da\u7372\u53d6\u5931\u6557": "\u5171\u4eab\u6570\u636e\u83b7\u53d6\u5931\u8d25", "\u7121\u4fdd\u5b58\u7684 Cookie, \u7121\u6cd5\u555f\u7528\u81ea\u52d5\u767b\u5165": "\u6ca1\u6709\u5df2\u4fdd\u5b58\u7684 Cookie\uff0c\u65e0\u6cd5\u542f\u7528\u81ea\u52a8\u767b\u5f55", "\u8acb\u6c42\u70ba\u7a7a\u6578\u64da": "\u8bf7\u6c42\u6570\u636e\u4e3a\u7a7a",
                "\u9023\u7dda\u7570\u5e38\uff0c\u66f4\u65b0\u5730\u5740\u53ef\u80fd\u662f\u932f\u7684": "\u8fde\u63a5\u5f02\u5e38\uff0c\u66f4\u65b0\u5730\u5740\u53ef\u80fd\u4e0d\u6b63\u786e", "\u8acb\u6c42\u932f\u8aa4: ": "\u8bf7\u6c42\u9519\u8bef\uff1a"
            }, Japan: {
                "\ud83c\udf6a \u5171\u4eab\u767b\u5165": "\ud83c\udf6a \u5171\u6709\u30ed\u30b0\u30a4\u30f3", "\ud83d\udfe2 \u555f\u7528\u6aa2\u6e2c": "\ud83d\udfe2 \u691c\u51fa\u3092\u6709\u52b9\u5316", "\ud83d\udd34 \u7981\u7528\u6aa2\u6e2c": "\ud83d\udd34 \u691c\u51fa\u3092\u7121\u52b9\u5316",
                "\ud83d\udcc2 \u5c55\u958b\u83dc\u55ae": "\ud83d\udcc2 \u30e1\u30cb\u30e5\u30fc\u5c55\u958b", "\ud83d\udcc1 \u647a\u758a\u83dc\u55ae": "\ud83d\udcc1 \u30e1\u30cb\u30e5\u30fc\u6298\u308a\u305f\u305f\u307f", "\ud83d\udcdc \u81ea\u52d5\u7372\u53d6": "\ud83d\udcdc \u81ea\u52d5\u53d6\u5f97", "\ud83d\udcdd \u624b\u52d5\u8f38\u5165": "\ud83d\udcdd \u624b\u52d5\u5165\u529b", "\ud83d\udd0d \u67e5\u770b\u4fdd\u5b58": "\ud83d\udd0d \u4fdd\u5b58\u3092\u8868\u793a", "\ud83d\udd03 \u624b\u52d5\u6ce8\u5165": "\ud83d\udd03 \u624b\u52d5\u6ce8\u5165",
                "\ud83d\uddd1\ufe0f \u6e05\u9664\u767b\u5165": "\ud83d\uddd1\ufe0f \u30ed\u30b0\u30a4\u30f3\u3092\u30af\u30ea\u30a2", "\ud83d\udc96 \u6dfb\u52a0\u6536\u85cf": "\ud83d\udc96 \u304a\u6c17\u306b\u5165\u308a\u306b\u8ffd\u52a0", "\ud83d\udc98 \u53d6\u6d88\u6536\u85cf": "\ud83d\udc98 \u304a\u6c17\u306b\u5165\u308a\u304b\u3089\u524a\u9664", "\u5e33\u6236": "\u30a2\u30ab\u30a6\u30f3\u30c8", "\u66f4\u65b0": "\u66f4\u65b0", "\u767b\u5165": "\u30ed\u30b0\u30a4\u30f3", "\u78ba\u8a8d\u9078\u64c7\u7684 Cookies": "\u9078\u629e\u3057\u305fCookie\u3092\u78ba\u8a8d",
                "\u78ba\u8a8d\u4fdd\u5b58": "\u4fdd\u5b58\u3092\u78ba\u8a8d", "\u53d6\u6d88\u9000\u51fa": "\u7d42\u4e86\u3092\u30ad\u30e3\u30f3\u30bb\u30eb", "\u9000\u51fa\u9078\u55ae": "\u30e1\u30cb\u30e5\u30fc\u3092\u7d42\u4e86", "\u4fdd\u5b58\u6210\u529f!": "\u4fdd\u5b58\u306b\u6210\u529f\u3057\u307e\u3057\u305f\uff01", "\u66f4\u6539\u4fdd\u5b58": "\u5909\u66f4\u3092\u4fdd\u5b58", "\u5df2\u4fdd\u5b58\u8b8a\u66f4": "\u5909\u66f4\u304c\u4fdd\u5b58\u3055\u308c\u307e\u3057\u305f", "\u8a2d\u7f6e Cookies": "Cookie\u3092\u8a2d\u5b9a",
                "\u8981\u767b\u5165 Ex \u624d\u9700\u8981\u586b\u5beb": "Ex\u30ed\u30b0\u30a4\u30f3\u306b\u306e\u307f\u5fc5\u8981", "\u5fc5\u586b\u9805\u76ee": "\u5fc5\u9808\u9805\u76ee", "\u4e0b\u65b9\u9078\u586b \u4e5f\u53ef\u4e0d\u4fee\u6539": "\u4ee5\u4e0b\u306f\u4efb\u610f\u3001\u5909\u66f4\u3057\u306a\u304f\u3066\u3082\u69cb\u3044\u307e\u305b\u3093", "[\u78ba\u8a8d\u8f38\u5165\u6b63\u78ba] \u6309\u4e0b\u9000\u51fa\u9078\u55ae\u4fdd\u5b58": "[\u5165\u529b\u304c\u6b63\u3057\u3044\u3053\u3068\u3092\u78ba\u8a8d] \u30e1\u30cb\u30e5\u30fc\u7d42\u4e86\u3092\u62bc\u3057\u3066\u4fdd\u5b58",
                "\u7576\u524d\u8a2d\u7f6e Cookies": "\u73fe\u5728\u306eCookie\u8a2d\u5b9a", "\u5e33\u6236\u9078\u64c7": "\u30a2\u30ab\u30a6\u30f3\u30c8\u9078\u629e", "\u672a\u7372\u53d6\u5230 Cookies !!\n\n\u8acb\u5148\u767b\u5165\u5e33\u6236": "Cookie\u3092\u53d6\u5f97\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\uff01\n\n\u307e\u305a\u30a2\u30ab\u30a6\u30f3\u30c8\u306b\u30ed\u30b0\u30a4\u30f3\u3057\u3066\u304f\u3060\u3055\u3044", "\u672a\u6aa2\u6e2c\u5230\u53ef\u6ce8\u5165\u7684 Cookies !!\n\n\u8acb\u5f9e\u9078\u55ae\u4e2d\u9032\u884c\u8a2d\u7f6e": "\u6ce8\u5165\u53ef\u80fd\u306aCookie\u304c\u691c\u51fa\u3055\u308c\u307e\u305b\u3093\u3067\u3057\u305f\uff01\n\n\u30e1\u30cb\u30e5\u30fc\u304b\u3089\u8a2d\u5b9a\u3057\u3066\u304f\u3060\u3055\u3044",
                "\u5171\u4eab\u6578\u64da\u66f4\u65b0\u5b8c\u6210": "\u5171\u6709\u30c7\u30fc\u30bf\u306e\u66f4\u65b0\u304c\u5b8c\u4e86\u3057\u307e\u3057\u305f", "\u5171\u4eab\u6578\u64da\u7121\u9700\u66f4\u65b0": "\u5171\u6709\u30c7\u30fc\u30bf\u306e\u66f4\u65b0\u306f\u4e0d\u8981\u3067\u3059", "\u5171\u4eab\u6578\u64da\u7372\u53d6\u5931\u6557": "\u5171\u6709\u30c7\u30fc\u30bf\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f", "\u7121\u4fdd\u5b58\u7684 Cookie, \u7121\u6cd5\u555f\u7528\u81ea\u52d5\u767b\u5165": "\u4fdd\u5b58\u3055\u308c\u305fCookie\u304c\u306a\u3044\u305f\u3081\u3001\u81ea\u52d5\u30ed\u30b0\u30a4\u30f3\u3092\u6709\u52b9\u306b\u3067\u304d\u307e\u305b\u3093",
                "\u8acb\u6c42\u70ba\u7a7a\u6578\u64da": "\u30ea\u30af\u30a8\u30b9\u30c8\u306b\u30c7\u30fc\u30bf\u304c\u3042\u308a\u307e\u305b\u3093", "\u9023\u7dda\u7570\u5e38\uff0c\u66f4\u65b0\u5730\u5740\u53ef\u80fd\u662f\u932f\u7684": "\u63a5\u7d9a\u30a8\u30e9\u30fc\u3001\u66f4\u65b0\u30a2\u30c9\u30ec\u30b9\u304c\u9593\u9055\u3063\u3066\u3044\u308b\u53ef\u80fd\u6027\u304c\u3042\u308a\u307e\u3059", "\u8acb\u6c42\u932f\u8aa4: ": "\u30ea\u30af\u30a8\u30b9\u30c8\u30a8\u30e9\u30fc: "
            }, Korea: {
                "\ud83c\udf6a \u5171\u4eab\u767b\u5165": "\ud83c\udf6a \uacf5\uc720 \ub85c\uadf8\uc778",
                "\ud83d\udfe2 \u555f\u7528\u6aa2\u6e2c": "\ud83d\udfe2 \uac10\uc9c0 \ud65c\uc131\ud654", "\ud83d\udd34 \u7981\u7528\u6aa2\u6e2c": "\ud83d\udd34 \uac10\uc9c0 \ube44\ud65c\uc131\ud654", "\ud83d\udcc2 \u5c55\u958b\u83dc\u55ae": "\ud83d\udcc2 \uba54\ub274 \ud3bc\uce58\uae30", "\ud83d\udcc1 \u647a\u758a\u83dc\u55ae": "\ud83d\udcc1 \uba54\ub274 \uc811\uae30", "\ud83d\udcdc \u81ea\u52d5\u7372\u53d6": "\ud83d\udcdc \uc790\ub3d9 \uac00\uc838\uc624\uae30", "\ud83d\udcdd \u624b\u52d5\u8f38\u5165": "\ud83d\udcdd \uc218\ub3d9 \uc785\ub825",
                "\ud83d\udd0d \u67e5\u770b\u4fdd\u5b58": "\ud83d\udd0d \uc800\uc7a5\ub41c \ud56d\ubaa9 \ubcf4\uae30", "\ud83d\udd03 \u624b\u52d5\u6ce8\u5165": "\ud83d\udd03 \uc218\ub3d9 \uc8fc\uc785", "\ud83d\uddd1\ufe0f \u6e05\u9664\u767b\u5165": "\ud83d\uddd1\ufe0f \ub85c\uadf8\uc778 \uc815\ubcf4 \uc0ad\uc81c", "\ud83d\udc96 \u6dfb\u52a0\u6536\u85cf": "\ud83d\udc96 \uc990\uaca8\ucc3e\uae30\uc5d0 \ucd94\uac00", "\ud83d\udc98 \u53d6\u6d88\u6536\u85cf": "\ud83d\udc98 \uc990\uaca8\ucc3e\uae30 \uc81c\uac70", "\u78ba\u8a8d\u9078\u64c7\u7684 Cookies": "\uc120\ud0dd\ud55c \ucfe0\ud0a4 \ud655\uc778",
                "\u5e33\u6236": "\uacc4\uc815", "\u66f4\u65b0": "\uc5c5\ub370\uc774\ud2b8", "\u767b\u5165": "\ub85c\uadf8\uc778", "\u78ba\u8a8d\u4fdd\u5b58": "\uc800\uc7a5 \ud655\uc778", "\u53d6\u6d88\u9000\u51fa": "\uc885\ub8cc \ucde8\uc18c", "\u9000\u51fa\u9078\u55ae": "\uba54\ub274 \uc885\ub8cc", "\u4fdd\u5b58\u6210\u529f!": "\uc800\uc7a5 \uc131\uacf5!", "\u66f4\u6539\u4fdd\u5b58": "\ubcc0\uacbd\uc0ac\ud56d \uc800\uc7a5", "\u5df2\u4fdd\u5b58\u8b8a\u66f4": "\ubcc0\uacbd\uc0ac\ud56d\uc774 \uc800\uc7a5\ub418\uc5c8\uc2b5\ub2c8\ub2e4",
                "\u8a2d\u7f6e Cookies": "\ucfe0\ud0a4 \uc124\uc815", "\u8981\u767b\u5165 Ex \u624d\u9700\u8981\u586b\u5beb": "Ex \ub85c\uadf8\uc778\uc5d0\ub9cc \ud544\uc694", "\u5fc5\u586b\u9805\u76ee": "\ud544\uc218 \ud56d\ubaa9", "\u4e0b\u65b9\u9078\u586b \u4e5f\u53ef\u4e0d\u4fee\u6539": "\uc544\ub798\ub294 \uc120\ud0dd\uc0ac\ud56d, \ubcc0\uacbd\ud558\uc9c0 \uc54a\uc544\ub3c4 \ub429\ub2c8\ub2e4", "[\u78ba\u8a8d\u8f38\u5165\u6b63\u78ba] \u6309\u4e0b\u9000\u51fa\u9078\u55ae\u4fdd\u5b58": "[\uc785\ub825\uc774 \uc815\ud655\ud55c\uc9c0 \ud655\uc778] \uba54\ub274 \uc885\ub8cc\ub97c \ub20c\ub7ec \uc800\uc7a5",
                "\u7576\u524d\u8a2d\u7f6e Cookies": "\ud604\uc7ac \uc124\uc815\ub41c \ucfe0\ud0a4", "\u5e33\u6236\u9078\u64c7": "\uacc4\uc815 \uc120\ud0dd", "\u672a\u7372\u53d6\u5230 Cookies !!\n\n\u8acb\u5148\u767b\u5165\u5e33\u6236": "\ucfe0\ud0a4\ub97c \uac00\uc838\uc624\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4!\n\n\uba3c\uc800 \uacc4\uc815\uc5d0 \ub85c\uadf8\uc778\ud574 \uc8fc\uc138\uc694", "\u672a\u6aa2\u6e2c\u5230\u53ef\u6ce8\u5165\u7684 Cookies !!\n\n\u8acb\u5f9e\u9078\u55ae\u4e2d\u9032\u884c\u8a2d\u7f6e": "\uc8fc\uc785 \uac00\ub2a5\ud55c \ucfe0\ud0a4\uac00 \uac10\uc9c0\ub418\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4!\n\n\uba54\ub274\uc5d0\uc11c \uc124\uc815\ud574 \uc8fc\uc138\uc694",
                "\u5171\u4eab\u6578\u64da\u66f4\u65b0\u5b8c\u6210": "\uacf5\uc720 \ub370\uc774\ud130 \uc5c5\ub370\uc774\ud2b8 \uc644\ub8cc", "\u5171\u4eab\u6578\u64da\u7121\u9700\u66f4\u65b0": "\uacf5\uc720 \ub370\uc774\ud130 \uc5c5\ub370\uc774\ud2b8 \ubd88\ud544\uc694", "\u5171\u4eab\u6578\u64da\u7372\u53d6\u5931\u6557": "\uacf5\uc720 \ub370\uc774\ud130 \uac00\uc838\uc624\uae30 \uc2e4\ud328", "\u7121\u4fdd\u5b58\u7684 Cookie, \u7121\u6cd5\u555f\u7528\u81ea\u52d5\u767b\u5165": "\uc800\uc7a5\ub41c \ucfe0\ud0a4\uac00 \uc5c6\uc5b4 \uc790\ub3d9 \ub85c\uadf8\uc778\uc744 \ud65c\uc131\ud654\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4",
                "\u8acb\u6c42\u70ba\u7a7a\u6578\u64da": "\uc694\uccad\uc5d0 \ub370\uc774\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4", "\u9023\u7dda\u7570\u5e38\uff0c\u66f4\u65b0\u5730\u5740\u53ef\u80fd\u662f\u932f\u7684": "\uc5f0\uacb0 \uc624\ub958, \uc5c5\ub370\uc774\ud2b8 \uc8fc\uc18c\uac00 \uc798\ubabb\ub418\uc5c8\uc744 \uc218 \uc788\uc2b5\ub2c8\ub2e4", "\u8acb\u6c42\u932f\u8aa4: ": "\uc694\uccad \uc624\ub958: "
            }, Russia: {
                "\ud83c\udf6a \u5171\u4eab\u767b\u5165": "\ud83c\udf6a \u041e\u0431\u0449\u0438\u0439 \u0432\u0445\u043e\u0434",
                "\ud83d\udfe2 \u555f\u7528\u6aa2\u6e2c": "\ud83d\udfe2 \u0412\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u043e\u0431\u043d\u0430\u0440\u0443\u0436\u0435\u043d\u0438\u0435", "\ud83d\udd34 \u7981\u7528\u6aa2\u6e2c": "\ud83d\udd34 \u041e\u0442\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u043e\u0431\u043d\u0430\u0440\u0443\u0436\u0435\u043d\u0438\u0435", "\ud83d\udcc2 \u5c55\u958b\u83dc\u55ae": "\ud83d\udcc2 \u0420\u0430\u0437\u0432\u0435\u0440\u043d\u0443\u0442\u044c \u043c\u0435\u043d\u044e", "\ud83d\udcc1 \u647a\u758a\u83dc\u55ae": "\ud83d\udcc1 \u0421\u0432\u0435\u0440\u043d\u0443\u0442\u044c \u043c\u0435\u043d\u044e",
                "\ud83d\udcdc \u81ea\u52d5\u7372\u53d6": "\ud83d\udcdc \u0410\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0435 \u043f\u043e\u043b\u0443\u0447\u0435\u043d\u0438\u0435", "\ud83d\udcdd \u624b\u52d5\u8f38\u5165": "\ud83d\udcdd \u0420\u0443\u0447\u043d\u043e\u0439 \u0432\u0432\u043e\u0434", "\ud83d\udd0d \u67e5\u770b\u4fdd\u5b58": "\ud83d\udd0d \u041f\u0440\u043e\u0441\u043c\u043e\u0442\u0440 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043d\u043e\u0433\u043e", "\ud83d\udd03 \u624b\u52d5\u6ce8\u5165": "\ud83d\udd03 \u0420\u0443\u0447\u043d\u043e\u0435 \u0432\u043d\u0435\u0434\u0440\u0435\u043d\u0438\u0435",
                "\ud83d\uddd1\ufe0f \u6e05\u9664\u767b\u5165": "\ud83d\uddd1\ufe0f \u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u0432\u0445\u043e\u0434", "\ud83d\udc96 \u6dfb\u52a0\u6536\u85cf": "\ud83d\udc96 \u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0432 \u0438\u0437\u0431\u0440\u0430\u043d\u043d\u043e\u0435", "\ud83d\udc98 \u53d6\u6d88\u6536\u85cf": "\ud83d\udc98 \u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0438\u0437 \u0438\u0437\u0431\u0440\u0430\u043d\u043d\u043e\u0433\u043e", "\u5e33\u6236": "\u0410\u043a\u043a\u0430\u0443\u043d\u0442",
                "\u66f4\u65b0": "\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c", "\u767b\u5165": "\u0412\u043e\u0439\u0442\u0438", "\u78ba\u8a8d\u9078\u64c7\u7684 Cookies": "\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0435 Cookies", "\u78ba\u8a8d\u4fdd\u5b58": "\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435", "\u53d6\u6d88\u9000\u51fa": "\u041e\u0442\u043c\u0435\u043d\u0438\u0442\u044c \u0432\u044b\u0445\u043e\u0434",
                "\u9000\u51fa\u9078\u55ae": "\u0412\u044b\u0439\u0442\u0438 \u0438\u0437 \u043c\u0435\u043d\u044e", "\u4fdd\u5b58\u6210\u529f!": "\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435 \u0443\u0441\u043f\u0435\u0448\u043d\u043e!", "\u66f4\u6539\u4fdd\u5b58": "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f", "\u5df2\u4fdd\u5b58\u8b8a\u66f4": "\u0418\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u044b",
                "\u8a2d\u7f6e Cookies": "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0430 Cookies", "\u8981\u767b\u5165 Ex \u624d\u9700\u8981\u586b\u5beb": "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u0442\u043e\u043b\u044c\u043a\u043e \u0434\u043b\u044f \u0432\u0445\u043e\u0434\u0430 \u0432 Ex", "\u5fc5\u586b\u9805\u76ee": "\u041e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e\u0435 \u043f\u043e\u043b\u0435", "\u4e0b\u65b9\u9078\u586b \u4e5f\u53ef\u4e0d\u4fee\u6539": "\u041d\u0435\u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e \u043d\u0438\u0436\u0435, \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f \u043d\u0435 \u0442\u0440\u0435\u0431\u0443\u044e\u0442\u0441\u044f",
                "[\u78ba\u8a8d\u8f38\u5165\u6b63\u78ba] \u6309\u4e0b\u9000\u51fa\u9078\u55ae\u4fdd\u5b58": "[\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u043f\u0440\u0430\u0432\u0438\u043b\u044c\u043d\u043e\u0441\u0442\u044c \u0432\u0432\u043e\u0434\u0430] \u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u0412\u044b\u0439\u0442\u0438 \u0438\u0437 \u043c\u0435\u043d\u044e \u0434\u043b\u044f \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u044f", "\u7576\u524d\u8a2d\u7f6e Cookies": "\u0422\u0435\u043a\u0443\u0449\u0438\u0435 \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 Cookies",
                "\u5e33\u6236\u9078\u64c7": "\u0412\u044b\u0431\u043e\u0440 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430", "\u672a\u7372\u53d6\u5230 Cookies !!\n\n\u8acb\u5148\u767b\u5165\u5e33\u6236": "Cookies \u043d\u0435 \u043f\u043e\u043b\u0443\u0447\u0435\u043d\u044b !!\n\n\u041f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430, \u0441\u043d\u0430\u0447\u0430\u043b\u0430 \u0432\u043e\u0439\u0434\u0438\u0442\u0435 \u0432 \u0430\u043a\u043a\u0430\u0443\u043d\u0442", "\u672a\u6aa2\u6e2c\u5230\u53ef\u6ce8\u5165\u7684 Cookies !!\n\n\u8acb\u5f9e\u9078\u55ae\u4e2d\u9032\u884c\u8a2d\u7f6e": "\u041d\u0435 \u043e\u0431\u043d\u0430\u0440\u0443\u0436\u0435\u043d\u044b Cookies \u0434\u043b\u044f \u0432\u043d\u0435\u0434\u0440\u0435\u043d\u0438\u044f !!\n\n\u041f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430, \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u0442\u0435 \u0432 \u043c\u0435\u043d\u044e",
                "\u5171\u4eab\u6578\u64da\u66f4\u65b0\u5b8c\u6210": "\u041e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435 \u043e\u0431\u0449\u0438\u0445 \u0434\u0430\u043d\u043d\u044b\u0445 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043e", "\u5171\u4eab\u6578\u64da\u7121\u9700\u66f4\u65b0": "\u041e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435 \u043e\u0431\u0449\u0438\u0445 \u0434\u0430\u043d\u043d\u044b\u0445 \u043d\u0435 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f", "\u5171\u4eab\u6578\u64da\u7372\u53d6\u5931\u6557": "\u041e\u0448\u0438\u0431\u043a\u0430 \u043f\u043e\u043b\u0443\u0447\u0435\u043d\u0438\u044f \u043e\u0431\u0449\u0438\u0445 \u0434\u0430\u043d\u043d\u044b\u0445",
                "\u7121\u4fdd\u5b58\u7684 Cookie, \u7121\u6cd5\u555f\u7528\u81ea\u52d5\u767b\u5165": "\u041d\u0435\u0442 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043d\u044b\u0445 cookies, \u043d\u0435\u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e \u0432\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0432\u0445\u043e\u0434", "\u8acb\u6c42\u70ba\u7a7a\u6578\u64da": "\u0417\u0430\u043f\u0440\u043e\u0441 \u0441\u043e\u0434\u0435\u0440\u0436\u0438\u0442 \u043f\u0443\u0441\u0442\u044b\u0435 \u0434\u0430\u043d\u043d\u044b\u0435",
                "\u9023\u7dda\u7570\u5e38\uff0c\u66f4\u65b0\u5730\u5740\u53ef\u80fd\u662f\u932f\u7684": "\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u043e\u0435\u0434\u0438\u043d\u0435\u043d\u0438\u044f, \u0430\u0434\u0440\u0435\u0441 \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u044f \u043c\u043e\u0436\u0435\u0442 \u0431\u044b\u0442\u044c \u043d\u0435\u0432\u0435\u0440\u043d\u044b\u043c", "\u8acb\u6c42\u932f\u8aa4: ": "\u041e\u0448\u0438\u0431\u043a\u0430 \u0437\u0430\u043f\u0440\u043e\u0441\u0430: "
            }, English: {
                "\ud83c\udf6a \u5171\u4eab\u767b\u5165": "\ud83c\udf6a Shared Login",
                "\ud83d\udfe2 \u555f\u7528\u6aa2\u6e2c": "\ud83d\udfe2 Enable Detection", "\ud83d\udd34 \u7981\u7528\u6aa2\u6e2c": "\ud83d\udd34 Disable Detection", "\ud83d\udcc2 \u5c55\u958b\u83dc\u55ae": "\ud83d\udcc2 Expand Menu", "\ud83d\udcc1 \u647a\u758a\u83dc\u55ae": "\ud83d\udcc1 Collapse Menu", "\ud83d\udcdc \u81ea\u52d5\u7372\u53d6": "\ud83d\udcdc Auto Retrieve", "\ud83d\udcdd \u624b\u52d5\u8f38\u5165": "\ud83d\udcdd Manual Input", "\ud83d\udd0d \u67e5\u770b\u4fdd\u5b58": "\ud83d\udd0d View Saved", "\ud83d\udd03 \u624b\u52d5\u6ce8\u5165": "\ud83d\udd03 Manual Injection",
                "\ud83d\uddd1\ufe0f \u6e05\u9664\u767b\u5165": "\ud83d\uddd1\ufe0f Clear Login", "\ud83d\udc96 \u6dfb\u52a0\u6536\u85cf": "\ud83d\udc96 Add to Favorites", "\ud83d\udc98 \u53d6\u6d88\u6536\u85cf": "\ud83d\udc98 Remove from Favorites", "\u5e33\u6236": "Account", "\u66f4\u65b0": "Update", "\u767b\u5165": "Login", "\u78ba\u8a8d\u9078\u64c7\u7684 Cookies": "Confirm Selected Cookies", "\u78ba\u8a8d\u4fdd\u5b58": "Confirm Save", "\u53d6\u6d88\u9000\u51fa": "Cancel Exit", "\u9000\u51fa\u9078\u55ae": "Exit Menu", "\u4fdd\u5b58\u6210\u529f!": "Save Successful!",
                "\u66f4\u6539\u4fdd\u5b58": "Save Changes", "\u5df2\u4fdd\u5b58\u8b8a\u66f4": "Changes Saved", "\u8a2d\u7f6e Cookies": "Set Cookies", "\u8981\u767b\u5165 Ex \u624d\u9700\u8981\u586b\u5beb": "Required for Ex Login Only", "\u5fc5\u586b\u9805\u76ee": "Required Field", "\u4e0b\u65b9\u9078\u586b \u4e5f\u53ef\u4e0d\u4fee\u6539": "Optional Fields Below - No Changes Required", "[\u78ba\u8a8d\u8f38\u5165\u6b63\u78ba] \u6309\u4e0b\u9000\u51fa\u9078\u55ae\u4fdd\u5b58": "[Confirm Input is Correct] Press Exit Menu to Save",
                "\u7576\u524d\u8a2d\u7f6e Cookies": "Current Cookie Settings", "\u5e33\u6236\u9078\u64c7": "Account Selection", "\u672a\u7372\u53d6\u5230 Cookies !!\n\n\u8acb\u5148\u767b\u5165\u5e33\u6236": "No Cookies Retrieved!\n\nPlease Login First", "\u672a\u6aa2\u6e2c\u5230\u53ef\u6ce8\u5165\u7684 Cookies !!\n\n\u8acb\u5f9e\u9078\u55ae\u4e2d\u9032\u884c\u8a2d\u7f6e": "No Injectable Cookies Detected!\n\nPlease Configure in Menu", "\u5171\u4eab\u6578\u64da\u66f4\u65b0\u5b8c\u6210": "Shared Data Update Complete", "\u5171\u4eab\u6578\u64da\u7121\u9700\u66f4\u65b0": "Shared Data Update Not Needed",
                "\u5171\u4eab\u6578\u64da\u7372\u53d6\u5931\u6557": "Shared Data Retrieval Failed", "\u7121\u4fdd\u5b58\u7684 Cookie, \u7121\u6cd5\u555f\u7528\u81ea\u52d5\u767b\u5165": "No Saved Cookies - Unable to Enable Auto-Login", "\u8acb\u6c42\u70ba\u7a7a\u6578\u64da": "Request Contains No Data", "\u9023\u7dda\u7570\u5e38\uff0c\u66f4\u65b0\u5730\u5740\u53ef\u80fd\u662f\u932f\u7684": "Connection Error - Update Address May Be Incorrect", "\u8acb\u6c42\u932f\u8aa4: ": "Request Error: "
            }
        }, f); return { Transl: n => m[n] ?? n }
    })(Syn.$lang).Transl;
    (async () => {
        let f, m, n, k, l; "e-hentai.org" == K ? (n = "color: #8f4701;", k = "background-color: #5C0D12; color: #fefefe;", f = "background-color: #fefefe; border: 3px ridge #34353b;", l = "color: #5C0D12; background-color: #fefefe; border: 2px solid #B5A4A4;", m = "color: #5C0D12; border: 2px solid #B5A4A4; background-color: #fefefe;") : "exhentai.org" == K && (n = "color: #989898;", k = "background-color: #fefefe; color: #5C0D12;", f = "background-color: #34353b; border: 2px ridge #5C0D12;", l = "color: #f1f1f1; background-color: #34353b; border: 2px solid #8d8d8d;",
            m = "color: #fefefe; border: 2px solid #8d8d8d; background-color: #34353b;", Syn.AddStyle("body {    padding: 2px;    color: #f1f1f1;    text-align: center;    background: #34353b;}\n            ")); Syn.AddStyle(`
            ${GM_getResourceText("jgrowl-css")}
            .jGrowl {${k}top: 2rem;left: 50%;width: auto;z-index: 9999;font-size: 1.3rem;border-radius: 2px;text-align: center;white-space: nowrap;transform: translateX(-50%);}
            .modal-background {top: 50%;left: 50%;opacity: 0;width: 100%;height: 100%;z-index: 8888;overflow: auto;position: fixed;transition: 0.6s ease;background-color: rgba(0,0,0,0);transform: translate(-50%, -50%) scale(0.3);}
            .acc-modal {${f}width: 18%;overflow: auto;margin: 11rem auto;border-radius: 10px;}
            .acc-select-flex {display: flex;align-items: center;flex-direction: initial;justify-content: space-around;}
            .acc-button-flex {display: flex;padding: 0 0 15px 0;justify-content: center;}
            .acc-select {${l}width: 10rem;padding: 4px;margin: 1.1rem 1.4rem 1.5rem 1.4rem;font-weight: bold;cursor: pointer;font-size: 1.2rem;text-align: center;border-radius: 5px;}
            .show-modal {${f}width: 25%;padding: 1.5rem;overflow: auto;margin: 5rem auto;text-align: left;border-radius: 10px;border-collapse: collapse;}
            .modal-button {${m}top: 0;margin: 3% 2%;font-size: 14px;font-weight: bold;border-radius: 3px;}
            .modal-button:hover, .modal-button:focus {${n}cursor: pointer;text-decoration: none;}
            .set-modal {${f}width: 30%;padding: 0.3rem;overflow: auto;border-radius: 10px;text-align: center;border-collapse: collapse;margin: 2% auto 8px auto;}
            .set-box {display: flex;margin: 0.6rem;font-weight: bold;flex-direction: column;align-items: flex-start;}
            .set-list {width: 95%;font-weight: 550;font-size: 1.1rem;text-align: center;}
            hr {width: 98%;opacity: 0.2;border: 1px solid;margin-top: 1.3rem;}
            label {margin: 0.4rem;font-size: 0.9rem;}
            .cancelFavorite {float: left;cursor: pointer;font-size: 1.7rem;padding: 10px 0 0 20px;}
            .cancelFavorite:hover {opacity: 0.5;}
            .addFavorite {float: left;cursor: pointer;font-size: 1.7rem;padding: 10px 0 0 20px;transition: transform 0.2s ease;}
            .addFavorite:hover {animation: heartbeat 1.5s infinite;}
            @keyframes heartbeat {0% {transform: scale(1);}25% {transform: scale(1.1);}50% {transform: scale(1);}75% {transform: scale(1.1);}100% {transform: scale(1);}}
            .lc {padding: 1rem 0 !important;}
            .unFavorite {font-size: 2rem;display: inline-block;transition: transform 0.2s ease;}
            .unFavorite:hover {animation: shake 0.8s ease-in-out infinite;}
            @keyframes shake {
            0% {transform: translateX(0);}25% {transform: translateX(-5px);}50% {transform: translateX(5px);}75% {transform: translateX(-5px);}100% {transform: translateX(0);}}
        `, "AutoLogin-Style")
    })(); (async (f, m) => {
        async function n() {
            var d = f.Get().igneous, g = Object.keys(k).length; let e = $('<select id="account-select" class="acc-select"></select>'), h; for (let c = 1; c <= g; c++)k[c][0].value === d && (h = c), e.append($("<option>").attr({ value: c }).text(b("\u5e33\u6236") + " " + c)); G(`
                <div class="modal-background">
                    <div class="acc-modal">
                        <h1>${b("\u5e33\u6236\u9078\u64c7")}</h1>
                        <div class="acc-select-flex">${e.prop("outerHTML")}</div>
                        <div class="acc-button-flex">
                            <button class="modal-button" id="update">${b("\u66f4\u65b0")}</button>
                            <button class="modal-button" id="login">${b("\u767b\u5165")}</button>
                        </div>
                    </div>
                </div>
            `); h && $("#account-select").val(h); $(".modal-background").on("click", function (c) { c.stopImmediatePropagation(); c = c.target; "login" === c.id ? f.ReAdd(k[+$("#account-select").val()]) : "update" === c.id ? m.Update().then(x => { x && (k = Syn.gV("Share", {}), setTimeout(n, 600)) }) : "modal-background" === c.className && L() })
        } let k = Syn.gV("Share", {}), l = Syn.$url, v = /https:\/\/[^\/]+\/g\/\d+\/[a-zA-Z0-9]+/, P = /https:\/\/[^\/]+\/favorites.php/, G = async d => {
            Syn.$q(".modal-background")?.remove(); $(Syn.$body).append(d.replace(/>\s+</g,
                "><")); requestAnimationFrame(() => { $(".modal-background").css({ opacity: "1", "background-color": "rgba(0,0,0,0.7)", transform: "translate(-50%, -50%) scale(1)" }) })
        }, L = async () => { let d = $(".modal-background"); d.css({ opacity: "0", "pointer-events": "none", "background-color": "rgba(0,0,0,0)", transform: "translate(-50%, -50%) scale(0)" }); setTimeout(() => { d.remove() }, 1300) }, W = async () => {
            Syn.Menu({
                [b("\ud83d\udcdc \u81ea\u52d5\u7372\u53d6")]: {
                    func: () => (async () => {
                        var d, g, e = []; for ([d, g] of Object.entries(f.Get())) e.push({
                            name: d,
                            value: g
                        }); 1 < e.length ? (async h => {
                            G(`
                <div class="modal-background">
                    <div class="show-modal">
                    <h1 style="text-align: center;">${b("\u78ba\u8a8d\u9078\u64c7\u7684 Cookies")}</h1>
                        <pre><b>${h}</b></pre>
                        <div style="text-align: right;">
                            <button class="modal-button" id="save">${b("\u78ba\u8a8d\u4fdd\u5b58")}</button>
                            <button class="modal-button" id="close">${b("\u53d6\u6d88\u9000\u51fa")}</button>
                        </div>
                    </div>
                </div>
            `); $(".modal-background").on("click", function (c) { c.stopImmediatePropagation(); c = c.target; "save" === c.id ? (Syn.sV("E/Ex_Cookies", h), J(b("\u4fdd\u5b58\u6210\u529f!"), "jGrowl", 1500), L()) : "modal-background" !== c.className && "close" !== c.id || L() })
                        })(JSON.stringify(e, null, 4)) : alert(b("\u672a\u7372\u53d6\u5230 Cookies !!\n\n\u8acb\u5148\u767b\u5165\u5e33\u6236"))
                    })()
                }, [b("\ud83d\udcdd \u624b\u52d5\u8f38\u5165")]: {
                    func: () => (async () => {
                        G(`
                <div class="modal-background">
                    <div class="set-modal">
                    <h1>${b("\u8a2d\u7f6e Cookies")}</h1>
                        <form id="set_cookies">
                            <div id="input_cookies" class="set-box">
                                <label>[igneous]\uff1a</label><input class="set-list" type="text" name="igneous" placeholder="${b("\u8981\u767b\u5165 Ex \u624d\u9700\u8981\u586b\u5beb")}"><br>
                                <label>[ipb_member_id]\uff1a</label><input class="set-list" type="text" name="ipb_member_id" placeholder="${b("\u5fc5\u586b\u9805\u76ee")}" required><br>
                                <label>[ipb_pass_hash]\uff1a</label><input class="set-list" type="text" name="ipb_pass_hash" placeholder="${b("\u5fc5\u586b\u9805\u76ee")}" required><hr>
                                <h3>${b("\u4e0b\u65b9\u9078\u586b \u4e5f\u53ef\u4e0d\u4fee\u6539")}</h3>
                                <label>[sl]\uff1a</label><input class="set-list" type="text" name="sl" value="dm_2"><br>
                                <label>[sk]\uff1a</label><input class="set-list" type="text" name="sk"><br>
                            </div>
                            <button type="submit" class="modal-button" id="save">${b("\u78ba\u8a8d\u4fdd\u5b58")}</button>
                            <button class="modal-button" id="close">${b("\u9000\u51fa\u9078\u55ae")}</button>
                        </form>
                    </div>
                </div>
            `); let d, g = $("<textarea>").attr({ style: "margin: 1.15rem auto 0 auto", rows: 18, cols: 40, readonly: !0 }); $("#set_cookies").on("submit", function (e) {
                            e.preventDefault(); e.stopImmediatePropagation(); e = Array.from($("#set_cookies .set-list")).map(function (h) { var c = $(h).val(); return "" !== c.trim() ? { name: $(h).attr("name"), value: c } : null }).filter(Boolean); d = JSON.stringify(e, null, 4); g.val(d); $("#set_cookies div").append(g); J(b("[\u78ba\u8a8d\u8f38\u5165\u6b63\u78ba] \u6309\u4e0b\u9000\u51fa\u9078\u55ae\u4fdd\u5b58"),
                                "jGrowl", 2500)
                        }); $(".modal-background").on("click", function (e) { e.stopImmediatePropagation(); var h = e.target; "modal-background" !== h.className && "close" !== h.id || (e.preventDefault(), d && Syn.sV("E/Ex_Cookies", d), L()) })
                    })()
                }, [b("\ud83d\udd0d \u67e5\u770b\u4fdd\u5b58")]: {
                    func: () => (async () => {
                        G(`
                <div class="modal-background">
                    <div class="set-modal">
                    <h1>${b("\u7576\u524d\u8a2d\u7f6e Cookies")}</h1>
                        <div id="view_cookies" style="margin: 0.6rem"></div>
                        <button class="modal-button" id="save">${b("\u66f4\u6539\u4fdd\u5b58")}</button>
                        <button class="modal-button" id="close">${b("\u9000\u51fa\u9078\u55ae")}</button>
                    </div>
                </div>
            `); var d = Syn.gJV("E/Ex_Cookies"), g = $("<textarea>").attr({ rows: 20, cols: 50, id: "view_SC", style: "margin-top: 1.25rem;" }); g.val(JSON.stringify(d, null, 4)); $("#view_cookies").append(g); $(".modal-background").on("click", function (e) { e.stopImmediatePropagation(); e = e.target; "save" === e.id ? (Syn.sJV("E/Ex_Cookies", JSON.parse($("#view_SC").val())), J(b("\u5df2\u4fdd\u5b58\u8b8a\u66f4"), "jGrowl", 1500), L()) : "modal-background" !== e.className && "close" !== e.id || L() })
                    })()
                }, [b("\ud83d\udd03 \u624b\u52d5\u6ce8\u5165")]: {
                    func: () =>
                        (async () => { try { f.ReAdd(Syn.gJV("E/Ex_Cookies")) } catch (d) { alert(b("\u672a\u6aa2\u6e2c\u5230\u53ef\u6ce8\u5165\u7684 Cookies !!\n\n\u8acb\u5f9e\u9078\u55ae\u4e2d\u9032\u884c\u8a2d\u7f6e")) } })()
                }, [b("\ud83d\uddd1\ufe0f \u6e05\u9664\u767b\u5165")]: { func: () => (async () => { f.Delete(); location.reload() })() }
            }, "Expand")
        }, X = async () => { for (let d = 1; 5 >= d; d++)GM_unregisterMenuCommand("Expand-" + d) }, U = async () => {
            let d = Syn.gV("Expand", !1), g = d ? b("\ud83d\udcc1 \u647a\u758a\u83dc\u55ae") : b("\ud83d\udcc2 \u5c55\u958b\u83dc\u55ae");
            Syn.Menu({ [g]: { func: () => { d ? Syn.sV("Expand", !1) : Syn.sV("Expand", !0); U() }, hotkey: "c", close: !1 } }, "Switch"); (d ? W : X)()
        }, T = async () => {
            let d = !!Syn.gJV("E/Ex_Cookies"), g = Syn.gV("Login", d); var e = g ? b("\ud83d\udfe2 \u555f\u7528\u6aa2\u6e2c") : b("\ud83d\udd34 \u7981\u7528\u6aa2\u6e2c"); Syn.Menu({ [e]: { func: () => { if (g) Syn.sV("Login", !1); else { if (!d) return void alert(b("\u7121\u4fdd\u5b58\u7684 Cookie, \u7121\u6cd5\u555f\u7528\u81ea\u52d5\u767b\u5165")); Syn.sV("Login", !0) } T() }, close: !1 } }, "Check"); Syn.Menu({
                [b("\ud83c\udf6a \u5171\u4eab\u767b\u5165")]: {
                    func: () =>
                        n()
                }
            }); U()
        }; return {
            Injection: async function () {
                var d, g, e = Syn.gJV("E/Ex_Cookies"); if (Syn.gV("Login", !!e) && e && (d = new Date, g = (g = Syn.Local("DetectionTime")) ? new Date(g) : new Date(d.getTime() + 66E4), 10 <= Math.abs(g - d) / 6E4) && f.Verify(e), v.test(l)) Syn.WaitElem(["#gd1 div", "#gd2", "#gmid"], ([h, c, x]) => {
                    let Q = location.pathname, q = md5(Q); var r = Syn.gV("Favorites", {})[q]; let u = Syn.$createElement(c, "div", { class: r ? "cancelFavorite" : "addFavorite", text: r ? b("\ud83d\udc98 \u53d6\u6d88\u6536\u85cf") : b("\ud83d\udc96 \u6dfb\u52a0\u6536\u85cf") });
                    u.$onEvent("click", () => {
                        var w = Syn.gV("Favorites", {}); if (w[q]) delete w[q], Syn.sV("Favorites", w), u.$text(b("\ud83d\udc96 \u6dfb\u52a0\u6536\u85cf")), u.$replaceClass("cancelFavorite", "addFavorite"); else {
                            var M, E = getComputedStyle(h), y = getComputedStyle(x.$q(".ir")), N = x.$q("#gdc div"), z = x.$q("#gdn a"), F = c.$q("#gj").$text() || c.$q("#gn").$text(), [, A, H] = Q.match(/\/g\/([^\/]+)\/([^\/]+)\//), I = x.$q("#gdd"), O = I.$q("tr:nth-child(1) .gdt2").$text(); I = I.$q("tr:nth-child(6) .gdt2").$text(); var B = new Map; for (M of x.$qa("#taglist tr a")) {
                                var C =
                                    M.id.slice(3).replace(/[_]/g, " ").split(":"); B.has(C[0]) || B.set(C[0], []); B.get(C[0]).push(C[1])
                            } A = JSON.stringify({ gid: A, tid: H, domain: K, posted: O, length: I, key: q, tags: [...B], score: y.backgroundPosition, post_title: F, artist_link: z.href, artist_text: z.$text(), icon_text: N.$text(), icon_class: N.className, img_width: E.width, img_height: E.height, img_url: E.background.match(/url\(["']?(.*?)["']?\)/)[1], favorited_time: Syn.GetDate("{year}-{month}-{date} {hour}:{minute}") }); Syn.sV("Favorites", Object.assign(w,
                                { [q]: LZString.compress(A, 9) })); u.$text(b("\ud83d\udc98 \u53d6\u6d88\u6536\u85cf")); u.$replaceClass("addFavorite", "cancelFavorite")
                        }
                    })
                }, { raf: !0 }); else if (P.test(l)) {
                    let h = Syn.gV("Favorites"); h && 0 < Object.keys(h).length && Syn.WaitElem(".ido", c => {
                        let x = "tr"; var Q, q = Syn.$createFragment(), r = c.$q(".searchnav div:last-of-type select option[selected='selected']"), u = r ? r.value : "t"; r || ((r = Syn.$createElement("form", { id: "favform", name: "favform", action: "", method: "post" })).$iHtml('<input id="ddact" name="ddact" type="hidden" value=""><div class="itg gld"></div>'),
                            c.appendChild(r)); "t" === u && (x = ".gl1t"); for (Q of Object.values(h)) {
                                let a = JSON.parse(LZString.decompress(Q)); r = `<div>${a.length}</div>`; var w = `<a href="https://${a.domain}/g/${a.gid}/${a.tid}/">`, M = `<div class="glink">${a.post_title}</div>`, E = `<div class="glfnote" style="display:none" id="favnote_${a.gid}"></div>`, y = `<div class="${a.icon_class}">${a.icon_text}</div>`, N = y.replace('class="cs', 'class="cn'), z = `<div class="ir" style="background-position:${a.score};opacity:1"></div>`, F = `<img style="height:${a.img_height}; width:${a.img_width};" alt="${a.post_title}" title="${a.post_title}" src="${a.img_url}">`,
                                    A = `<div class="glcut" id="ic${a.gid}"></div><div class="glthumb" id="it${a.gid}" style="top:-179px;height:400px"><div>${F}</div>`,
                                    H = `<div style="border-color:#000;background-color:rgba(0,0,0,.1)"onclick="popUp('https://${a.domain}/gallerypopups.php?gid=${a.gid}&amp;t=${a.tid}&amp;act=addfav',675,415)"id="posted_${a.gid}" title="Favorites 0">${a.posted}</div>`, I = H.replace("posted_", "postedpop_"),
                                    O = `<div class="gldown"><a href="https://${a.domain}/gallerytorrents.php?gid=${a.gid}&amp;t=${a.tid}"onclick="return popUp('https://${a.domain}/gallerytorrents.php?gid=${a.gid}&amp;t=${a.tid}',610,590)"rel="nofollow"><img src="https://${a.domain}/img/t.png" alt="T" title="Show torrents"></a></div>`,
                                    B = `<div class="lc"><div id="${a.key}" class="unFavorite">\ud83d\udc94</div></div>
                            `; if ("m" === u || "p" === u) {
                                var C = Syn.$createElement("tr"); C.$iHtml(`<td class="gl1m glcat">${y}</td><td class="gl2m">${A}<div><div>${y}${I}</div><div>${z}${r}</div></div></div>${H}</td><td class="gl6m">${O}</td><td class="gl3m glname" onmouseover="show_image_pane(${a.gid});preload_pane_image(0,0)" onmouseout="hide_image_pane()">${w}${M}${E}</a></td><td class="gl4m">${z}</td><td class="glfm glfav">${a.favorited_time}</td><td class="glfm" style="text-align:center; padding-left:3px">${B}</td>
                            `.replace(/>\s+</g, "><")); q.prepend(C)
                                } else "l" === u ? (y = Syn.$createElement("tr"), F = a.posted.split(" "), y.$iHtml(`
                                <tr><td class="gl1c glcat">${N}</td><td class="gl2c">${A}<div><div>${N}${I}</div><div>${z}${r}</div></div></div><div>${H}${z}${O}</div></td><td class="gl3c glname" onmouseover="show_image_pane(${a.gid});preload_pane_image(0,0)" onmouseout="hide_image_pane()">${w}${M}<div>${(() => { let t = 0, D = ""; var p, S; for ([p, S] of a.tags) { for (var R of S) { if (10 <= t) break; D += `<div class="gt" title="${p}:${R}">${R}</div>`; t++ } if (10 <= t) break } return D })()}</div>${E}</a></td><td class="glfc glfav"><p>${F[0]}</p><p>${F[1]}</p></td><td class="glfc" style="text-align:center; padding-left:3px">${B}</td></tr>
                            `.replace(/>\s+</g, "><")), q.prepend(y)) : "e" === u ? (A = Syn.$createElement("tr"), A.$iHtml(`
                                <tr><td class="gl1e" style="width:250px"><div style="height: ${a.img_height}; width:250px">${w}${F}</a></div></td><td class="gl2e"><div><div class="gl3e">${N}${H}${z}<div><a href="${a.artist_link}">${a.artist_text}</a></div>${r}${O}<div><p>Favorited:</p><p>${a.favorited_time}</p></div></div>${w}<div class="gl4e glname" style="min-height:${a.img_height}">${M}<div><table><tbody>${a.tags.map(([t, D]) => `<tr><td class="tc">${t}</td><td>${D.map(p => `<div class="gtl" title="${t}:${p}">${p}</div>`).join("")}</td></tr>`).join("")}</tbody></table></div>${E}</div></a></div></td><td class="glfe" style="text-align:center; padding-left:8px">${B}</td></tr>
                            `.replace(/>\s+</g, "><")), q.prepend(A)) : "t" === u && ((C = Syn.$createElement("div", { class: "gl1t" })).$iHtml(`
                                <div class="gl4t glname glft"><div>${w}<span class="glink">${a.post_title}</span></a></div><div>${B}</div></div><div class="gl3t" style="height: ${a.img_height}; width:250px">${w}${F}</a></div>${E}<div class="gl5t"><div>${y}${H}</div><div>${z}${r}${O}</div></div>
                            `.replace(/>\s+</g, "><")), q.prepend(C))
                            } q && (c.$q("tbody")?.prepend(q), c.$q("#favform .gld")?.prepend(q), requestAnimationFrame(() => {
                                var a = t => { let D = {}; for (var p of t.$qa("div[id^='usertag_']:not(#usertag_0)")) p.$q("div:nth-of-type(2) input").checked && (p = p.$q("div.gt"), D[p.title] = p.style); Syn.$qa(".glname tr td:nth-of-type(2)").forEach(S => { S.childNodes.forEach(R => { var V = D[R.title]; V && (R.style.cssText = V.cssText) }) }) }; GM_xmlhttpRequest({
                                    method: "GET", url: "https://exhentai.org/mytags",
                                    responseType: "document", onload: t => { 200 === t.status && a(t.response) }
                                }); Syn.$q("#nb")?.scrollIntoView()
                            })); c.$onEvent("click", a => { a = a.target; "unFavorite" === a.className && (async (t, D) => { var p = Syn.gV("Favorites"); delete p[t]; Syn.sV("Favorites", p); D.remove() })(a.id, a.closest(x)) })
                    })
                } T(); (async () => { Syn.StoreListen(["Login", "Expand"], h => { h.far && T() }) })()
            }
        }
    })((() => {
        let f = new Date, m = (f.setFullYear(f.getFullYear() + 1), f.toUTCString()), n = (new Date(0)).toUTCString(), k = ["ipb_member_id", "ipb_pass_hash"]; return "exhentai.org" ==
            K && k.unshift("igneous"), {
                Get: () => Syn.$cookie().split("; ").reduce((l, v) => { var [v, P] = v.split("="); return l[decodeURIComponent(v)] = decodeURIComponent(P), l }, {}), Add: function (l) { Syn.Local("DetectionTime", { value: Syn.GetDate() }); for (var v of l) Syn.$cookie(`${encodeURIComponent(v.name)}=${encodeURIComponent(v.value)}; domain=.${K}; path=/; expires=${m};`); location.reload() }, Delete: function () {
                    Object.keys(this.Get()).forEach(l => {
                        Syn.$cookie(`${l}=; expires=${n}; path=/;`); Syn.$cookie(`${l}=; expires=${n}; path=/; domain=.` +
                            K)
                    })
                }, ReAdd: function (l) { this.Delete(); this.Add(l) }, Verify: function (l) { let v = this.Get(), P = new Set(Object.keys(v)); k.every(G => P.has(G) && "mystery" !== v[G]) ? Syn.Local("DetectionTime", { value: Syn.GetDate() }) : this.ReAdd(l) }
        }
    })(), {
        Update: async function () {
            var f = await new Promise((m, n) => {
                GM_xmlhttpRequest({
                    method: "GET", responseType: "json", url: "https://raw.githubusercontent.com/Canaan-HS/Script-DataBase/main/Share/ExShare.json", onload: k => {
                        200 === k.status ? "object" == typeof (k = k.response) && 0 < Object.keys(k).length ?
                            m(k) : (console.error(b("\u8acb\u6c42\u70ba\u7a7a\u6578\u64da")), m({})) : (console.error(b("\u9023\u7dda\u7570\u5e38\uff0c\u66f4\u65b0\u5730\u5740\u53ef\u80fd\u662f\u932f\u7684")), m({}))
                    }, onerror: k => { console.error(b("\u8acb\u6c42\u932f\u8aa4: "), k); m({}) }
                })
            }); if (0 < Object.keys(f).length) {
                if (md5(JSON.stringify(Syn.gV("Share", {}))) !== md5(JSON.stringify(f))) return Syn.sV("Share", f), J(b("\u5171\u4eab\u6578\u64da\u66f4\u65b0\u5b8c\u6210"), "jGrowl", 1500), !0; J(b("\u5171\u4eab\u6578\u64da\u7121\u9700\u66f4\u65b0"),
                    "jGrowl", 1500)
            } else Syn.sV("Share", {}), J(b("\u5171\u4eab\u6578\u64da\u7372\u53d6\u5931\u6557"), "jGrowl", 2500); return !1
        }
    }).then(f => { f.Injection() })
})();