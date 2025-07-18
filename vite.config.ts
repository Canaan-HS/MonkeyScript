import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import config from './KemerDownloader/Dev/config';

export default defineConfig({
    build: {
        outDir: config.outDir,
    },
    server: {
        host: '0.0.0.0'
    },
    plugins: [
        monkey({
            entry: config.entry,
            userscript: {
                name: 'Vite Dev',
                version: '0.0.0',
                author: 'Canaan HS',
                description: 'Vite Server',
                ...config.userscript
            },
            build: {
                fileName: config.fileName,
            }
        }),
    ],
});
