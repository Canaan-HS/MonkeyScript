import metaData from './metadata';
import parseMeta from '../../parseMeta';

import { util } from 'vite-plugin-monkey';

const name = "ExDownloader";
const meta = metaData.trim();
const parsed = parseMeta(meta);

export default {
    meta,
    entry: `./${name}/Dev/src/main.js`,
    fileName: `${name}-Dev.js`,
    outDir: `./${name}/Dev/dist`,
    userscript: {
        ...parsed.basic,
        require: [
            ...parsed.require,
            util.dataUrl('window.Lib=Lib')
        ],
    },
};