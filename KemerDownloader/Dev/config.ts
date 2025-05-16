import { util } from 'vite-plugin-monkey';

export default {
    entry: './KemerDownloader/Dev/src/main.js',
    userscript: {
        connect: '*',
        match: [
            '*://kemono.su/*',
            '*://coomer.su/*',
            '*://nekohouse.su/*',
            '*://*.kemono.su/*',
            '*://*.coomer.su/*',
            '*://*.nekohouse.su/*'
        ],
        icon: 'https://cdn-icons-png.flaticon.com/512/2381/2381981.png',
        namespace: 'https://greasyfork.org/users/989635',
        'run-at': 'document-start',
        grant: [
            'window.close',
            'window.onurlchange',
            'GM_info',
            'GM_setValue',
            'GM_getValue',
            'GM_download',
            'GM_openInTab',
            'GM_getResourceURL',
            'GM_xmlhttpRequest',
            'GM_registerMenuCommand',
            'GM_unregisterMenuCommand'
        ],
        require: [
            'https://update.greasyfork.org/scripts/495339/1580133/Syntax_min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.19.0/js/md5.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',

            util.dataUrl(`window.Syn=Syn`)
        ]
    },
    build: {
        rollupOptions: {
            output: {
                dir: './KemerDownloader/Dev/dist',
                entryFileNames: 'KemerDownloader-Dev.js',
            },
        }
    },
};