import { Lib } from '../services/client.js';

const Fetch = (() => {
    const responseRule = {
        text: res => res.text(),
        json: res => res.json(),
        blob: res => res.blob(),
        arrayBuffer: res => res.arrayBuffer(),
        formData: res => res.formData(),
        document: async res => {
            res = await res.text();
            return Lib.domParse(res);
        },
    };

    const fetchRecord = {};
    const abort = (url) => {
        fetchRecord[url]?.abort();
        delete fetchRecord[url];
    };

    async function send(url, callback, {
        responseType = "json",
        headers = { "Accept": "text/css" }
    } = {}) {
        fetchRecord[url]?.abort();

        const controller = new AbortController();
        fetchRecord[url] = controller;

        return new Promise((resolve, reject) => {
            fetch(url, { headers, signal: controller.signal })
                .then(async response => {
                    if (!response.ok) {
                        const text = await response.text();
                        throw new Error(`\nFetch failed\nurl: ${response.url}\nstatus: ${response.status}\nstatusText: ${text}`);
                    }

                    try {
                        return await responseRule[responseType](response);
                    } catch { }
                })
                .then(res => {
                    resolve(res);
                    callback?.(res);
                })
                .catch(error => {
                    if (error.name === "AbortError") return; // 忽略中斷錯誤
                    reject(error);
                    Lib.log(error).error;
                })
                .finally(() => {
                    delete fetchRecord[url];
                });
        })
    };

    return { abort, send }
})();

export default Fetch;