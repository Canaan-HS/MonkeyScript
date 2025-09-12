import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import config from './ExDownloader/Dev/config.ts';

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
                ...config.userscript,
                'run-at': config.userscript['run-at'] as
                    'document-start' | 'document-body' | 'document-end' | 'document-idle' | 'context-menu'
            },
            build: {
                fileName: config.fileName,
            }
        }),
    ],
});
