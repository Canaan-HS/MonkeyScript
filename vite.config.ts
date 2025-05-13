import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// 要開發的配置
import config from './ExDownloader/Dev/config.ts';

const entry: string = config.entry;
const userscript: object = config.userscript;

export default defineConfig({
    plugins: [
        monkey({
            entry,
            userscript,
        }),
    ],
});