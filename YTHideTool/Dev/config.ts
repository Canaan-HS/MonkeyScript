import { util } from 'vite-plugin-monkey';

const Name = "YTHideTool";
export default {
    entry: `./${Name}/Dev/src/main.js`,
    fileName: `${Name}-Dev.js`,
    outDir: `./${Name}/Dev/dist`,
    userscript: {
        match: [
            '*://www.youtube.com/*',
        ],
        icon: 'https://cdn-icons-png.flaticon.com/512/1383/1383260.png',
        namespace: 'https://greasyfork.org/users/989635',
        noframes: '',
        'run-at': 'document-start',
        grant: [
            'window.onurlchange',
            'GM_setValue',
            'GM_getValue',
            'GM_registerMenuCommand',
            'GM_addValueChangeListener'
        ],
        require: [
            'https://update.greasyfork.org/scripts/487608/1591150/SyntaxLite_min.js',

            util.dataUrl(`window.Syn=Syn`)
        ]
    },
};