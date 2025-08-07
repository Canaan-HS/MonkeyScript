import { util } from 'vite-plugin-monkey';

const Name = "VolumeBooster";
export default {
    entry: `./${Name}/Dev/src/main.js`,
    fileName: `${Name}-Dev.js`,
    outDir: `./${Name}/Dev/dist`,
    userscript: {
        match: [
            '*://*/*',
        ],
        icon: 'https://cdn-icons-png.flaticon.com/512/16108/16108408.png',
        namespace: 'https://greasyfork.org/users/989635',
        noframes: '',
        'run-at': 'document-body',
        grant: [
            'GM_setValue',
            'GM_getValue',
            'GM_deleteValue',
            'GM_getResourceURL',
            'GM_registerMenuCommand',
            'GM_addValueChangeListener'
        ],
        resource: 'Img https://cdn-icons-png.flaticon.com/512/11243/11243783.png',
        require: [
            'https://update.greasyfork.org/scripts/487608/1637297/SyntaxLite_min.js',

            util.dataUrl(`window.Lib=Lib`)
        ]
    },
};