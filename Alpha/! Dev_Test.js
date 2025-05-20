// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      2025-05-20
// @description  try to take over the world!
// @author       You
// @match        https://prts.wiki/w/%E6%95%8C%E4%BA%BA%E4%B8%80%E8%A7%88
// @icon         https://www.google.com/s2/favicons?sz=64&domain=prts.wiki
// @grant        none
// @run-at       document-start
// ==/UserScript==

(async () => {

    const originalFetch = window.fetch;
    window.fetch = function (...args) {
        return originalFetch.apply(this, args)
            .then(async response => {
                const url = response.url;
                if (url === 'https://prts.wiki/index.php?title=%E6%95%8C%E4%BA%BA%E4%B8%80%E8%A7%88%2F%E6%95%B0%E6%8D%AE&action=raw&ctype=application%2Fjson') {
                    const originalData = await response.json();
                    const filteredData = originalData.filter(item => !item.name.includes("组长"));
                    return new Response(JSON.stringify(filteredData), {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    });
                }
                return response;
            });
    };

})();