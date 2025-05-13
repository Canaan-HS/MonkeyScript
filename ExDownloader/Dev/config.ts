import { util } from 'vite-plugin-monkey';

export default {
    entry: './ExDownloader/Dev/src/main.js',
    userscript: {
        name: '[E/Ex-Hentai] Downloader',
        version: '0.0.16',
        author: 'Canaan HS',
        description: '漫畫頁面創建下載按鈕, 可切換 (壓縮下載 | 單圖下載), 無須複雜設置一鍵點擊下載, 自動獲取(非原圖)進行下載',
        connect: '*',
        match: ['*://e-hentai.org/g/*', '*://exhentai.org/g/*'],
        icon: 'https://e-hentai.org/favicon.ico',
        license: 'MPL-2.0',
        namespace: 'https://greasyfork.org/users/989635',
        'run-at': 'document-body',
        grant: [
            'window.close',
            'GM_setValue',
            'GM_getValue',
            'GM_download',
            'GM_addElement',
            'GM_xmlhttpRequest',
            'GM_registerMenuCommand',
            'GM_unregisterMenuCommand'
        ],
        require: [
            'https://update.greasyfork.org/scripts/495339/1558818/ObjectSyntax_min.js',
            'https://update.greasyfork.org/scripts/529004/1548656/JSZip_min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',

            util.dataUrl(`window.Syn=Syn`),
            util.dataUrl(`window.JSZip=JSZip`)
        ],
    }
};