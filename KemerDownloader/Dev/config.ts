import path from 'path';
import { fileURLToPath } from 'url';

import { util } from 'vite-plugin-monkey';

import metaData from './metadata';
import parseMeta from '../../parseMeta';

const meta = metaData.trim();
const parsed = parseMeta(meta);
const name = path.basename(path.resolve(fileURLToPath(import.meta.url), '../../'));

export default {
    meta,
    entry: `./${name}/Dev/src/index.js`,
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