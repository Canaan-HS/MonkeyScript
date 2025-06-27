import { util } from 'vite-plugin-monkey';

const Name = "ExDownloader";
export default {
    entry: `./${Name}/Dev/src/main.js`,
    userscript: {
        connect: '*',
        match: ['*://e-hentai.org/g/*', '*://exhentai.org/g/*'],
        icon: 'https://e-hentai.org/favicon.ico',
        namespace: 'https://greasyfork.org/users/989635',
        'run-at': 'document-body',
        require: [
            'https://update.greasyfork.org/scripts/495339/1613824/Syntax_min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',

            util.dataUrl(`window.Syn=Syn`)
        ],
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