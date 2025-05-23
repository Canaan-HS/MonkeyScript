import { util } from 'vite-plugin-monkey';

const Name = "ColaMangaEnhance";
export default {
    entry: `./${Name}/Dev/src/main.js`,
    userscript: {
        match: [
            '*://www.colamanga.com/manga-*/*/*.html',
        ],
        icon: 'https://www.colamanga.com/favicon.png',
        namespace: 'https://greasyfork.org/users/989635',
        'run-at': 'document-start',
        grant: [
            'GM_setValue', 'GM_getValue'
        ],
        require: [
            'https://update.greasyfork.org/scripts/487608/1591150/SyntaxLite_min.js',

            util.dataUrl(`window.Syn=Syn`)
        ]
    },
    build: {
        rollupOptions: {
            output: {
                dir: `./${Name}/Dev/dist`,
                entryFileNames: `${Name}-Dev.js`,
            },
        }
    },
};