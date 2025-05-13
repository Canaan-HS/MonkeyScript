import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// 要開發的配置
import config from './ExDownloader/Dev/config.ts';

const { entry, userscript } = config;

export default defineConfig({
    plugins: [
        monkey({
            entry,
            userscript: {
                name: 'vite-dev',
                version: '0.0.0',
                description: 'vite-dev',
                connect: '*',
                'run-at': 'document-start',
                author: 'Canaan HS',
                ...userscript,
            },
        }),
    ],
});