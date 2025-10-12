export default `

// ==UserScript==
// @name         [E/Ex-Hentai] Downloader
// @name:zh-TW   [E/Ex-Hentai] 下載器
// @name:zh-CN   [E/Ex-Hentai] 下载器
// @name:ja      [E/Ex-Hentai] ダウンローダー
// @name:ko      [E/Ex-Hentai] 다운로더
// @name:ru      [E/Ex-Hentai] Загрузчик
// @name:en      [E/Ex-Hentai] Downloader
// @version      2025.09.20-Beta
// @author       Canaan HS
// @description         漫畫頁面創建下載按鈕, 可切換 (壓縮下載 | 單圖下載), 無須複雜設置一鍵點擊下載, 自動獲取(非原圖)進行下載
// @description:zh-TW   漫畫頁面創建下載按鈕, 可切換 (壓縮下載 | 單圖下載), 無須複雜設置一鍵點擊下載, 自動獲取(非原圖)進行下載
// @description:zh-CN   漫画页面创建下载按钮, 可切换 (压缩下载 | 单图下载), 无须复杂设置一键点击下载, 自动获取(非原图)进行下载
// @description:ja      マンガページにダウンロードボタンを作成し、（圧縮ダウンロード | シングルイメージダウンロード）を切り替えることができ、複雑な設定は必要なく、ワンクリックでダウンロードできます。自動的に（オリジナルではない）画像を取得してダウンロードします
// @description:ko      만화 페이지에 다운로드 버튼을 만들어 (압축 다운로드 | 단일 이미지 다운로드)를 전환할 수 있으며, 복잡한 설정이 필요하지 않고, 원클릭 다운로드 기능으로 (원본이 아닌) 이미지를 자동으로 가져와 다운로드합니다
// @description:ru      Создание кнопок загрузки на страницах манги, переключение между (сжатой загрузкой | загрузкой отдельных изображений), без необходимости сложных настроек, возможность загрузки одним кликом, автоматически получает (неоригинальные) изображения для загрузки
// @description:en      Create download buttons on manga pages, switchable between (compressed download | single image download), without the need for complex settings, one-click download capability, automatically fetches (non-original) images for downloading

// @connect      *
// @match        *://e-hentai.org/g/*
// @match        *://exhentai.org/g/*
// @icon         https://e-hentai.org/favicon.ico

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635
// @supportURL   https://github.com/Canaan-HS/MonkeyScript/issues

// @resource     fflate https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.min.js

// @require      https://update.greasyfork.org/scripts/495339/1676420/Syntax_min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js

// @grant        window.close
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @grant        GM_addElement
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand

// @run-at       document-body
// ==/UserScript==

`;