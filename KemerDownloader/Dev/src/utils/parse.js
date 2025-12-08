const Parse = (() => {
    const infoF1 = /\/([^\/]+)\/(?:user|server|creator|fanclubs)\/([^\/?]+)(?:\/post\/([^\/?]+))?/;
    const infoF2 = /\/([^\/]+)\/([^\/]+)$/;
    const infoF3 = /^https?:\/\/([^.]+)\.([^.]+)\./;
    const specialServer = { x: "twitter", maker_id: "dlsite" };
    const supportServer = /Gumroad|Patreon|Fantia|Pixiv|Fanbox|CandFans|Twitter|Boosty|OnlyFans|Fansly|SubscribeStar|DLsite/i;

    const protocolF1 = /^[a-zA-Z][\w+.-]*:\/\//;
    const protocolF2 = /^[a-zA-Z][\w+.-]*:/;
    const protocolF3 = /^([\w-]+\.)+[a-z]{2,}(\/|$)/i;
    const protocolF4 = /^\/\//;

    return {
        /**
         * @description 解析所有內部網址, 與作者外部網址
         * @param {String} uri - 要解析的網址
         * @returns {Object} { server, user, post } - 網址解析結果
         */
        getUrlInfo(uri) {
            uri = uri.match(infoF1) || uri.match(infoF2) || uri.match(infoF3);
            if (!uri) return;

            return uri.splice(1).reduce((acc, str, idx) => {
                if (supportServer.test(str)) {
                    const cleanStr = str.replace(/\/?(www\.|\.com|\.to|\.jp|\.net|\.adult|user\?u=)/g, "");
                    acc.server = specialServer[cleanStr] ?? cleanStr
                } else if (idx === 2) {
                    acc.post = str;
                } else {
                    acc.user = str;
                }

                return acc;
            }, {});
        },
        /**
         * @description 根據網址字串補齊協議
         * @param {String} uri - 要處理的網址
         * @returns {String} - 處理後的網址
         */
        getProtocol(uri) {
            if (protocolF1.test(uri) || protocolF2.test(uri)) return uri;
            if (protocolF3.test(uri)) return "https://" + uri;
            if (protocolF4.test(uri)) return "https:" + uri;
            return uri;
        }
    }
})();

export default Parse;