import path from 'path';
import { fileURLToPath } from 'url';

import { util } from 'vite-plugin-monkey';

import metaData from './metadata';
import parseMeta from '../../parseMeta';

const meta = metaData.trim();
const parsed = parseMeta(meta);

const appName = path.basename(path.resolve(fileURLToPath(import.meta.url), '../../'));

export default {
    meta,
    entry: `./${appName}/Dev/src/entry/bootstrap.js`,
    devFileName: `${appName}.js`,
    devOutDir: `./${appName}/Dev/dist`,
    releaseFileName: `${appName}.js`,
    releaseOutDir: `./${appName}/Release`,
    userscript: {
        ...parsed.basic,
        require: [
            ...parsed.require,
            util.dataUrl('window.Lib=Lib')
        ],
    },
};