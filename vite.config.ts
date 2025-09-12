import fs from 'fs';
import path from 'path';

import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

import config from './ExDownloader/Dev/config';
import metaData from './ExDownloader/Dev/metadata';

/* 解析運行的瀏覽器 */
const browserPaths = {
    brave: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    chrome: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    edge: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    firefox: 'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
};

const browserName = process.env.BROWSER;
const openConfig = browserName && browserPaths[browserName as keyof typeof browserPaths]
    ? { app: { name: browserPaths[browserName as keyof typeof browserPaths] } }
    : true;

/* 替換 metadata */
const meta = metaData.trim();
const replaceMetadataPlugin = () => ({
    name: 'replace-metadata-block',
    apply: 'build' as const,
    async closeBundle() {
        const finalScriptPath = path.join(config.outDir, config.fileName);

        try {
            if (!fs.existsSync(finalScriptPath)) {
                console.error(`[replace-metadata-block] Error: File not found at ${finalScriptPath}`);
                return;
            }

            const originalContent = fs.readFileSync(finalScriptPath, 'utf-8');
            const newContent = originalContent.replace(
                /\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/, meta
            );

            fs.writeFileSync(finalScriptPath, newContent, 'utf-8');
        } catch (error) {
            console.error('[replace-metadata-block] An error occurred:', error);
        }
    },
});

export default defineConfig({
    build: {
        outDir: config.outDir,
    },
    server: {
        host: '0.0.0.0',
        open: openConfig as any,
    },
    plugins: [
        monkey({
            entry: config.entry,
            userscript: {
                version: 'alpha',
                author: 'Canaan HS',
                description: 'vite dev server',
                ...config.userscript as any,
            },
            server: {
                open: false,
                prefix: 'vite-monkey-dev',
            },
            build: {
                autoGrant: false,
                fileName: config.fileName,
            }
        }),
        replaceMetadataPlugin()
    ],
});
