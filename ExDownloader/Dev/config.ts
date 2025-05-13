import { util } from 'vite-plugin-monkey';

export default {
    entry: './ExDownloader/Dev/main.js',
    userscript: {
        match: [
            '*://e-hentai.org/g/*',
            '*://exhentai.org/g/*',
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