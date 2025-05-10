import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// 要開發的對應配置
import config from './KemerDownloader/Dev/config.ts';

const entry: string = config.entry;
const build: object = config.build;
const userscript: object = config.userscript;

export default defineConfig({
    build,
    plugins: [
        monkey({
            entry,
            userscript: {
                name: 'Vite Dev',
                version: '0.0.0',
                author: 'Canaan HS',
                description: 'Vite Server',
                ...userscript
            },
        }),
    ],
});