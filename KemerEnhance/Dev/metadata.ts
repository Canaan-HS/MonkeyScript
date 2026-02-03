export default `

// ==UserScript==
// @name         Kemer Enhance
// @name:zh-TW   Kemer 增強
// @name:zh-CN   Kemer 增强
// @name:ja      Kemer 強化
// @name:ko      Kemer 강화
// @name:ru      Kemer Улучшение
// @name:en      Kemer Enhance
// @version      2025.11.12
// @author       Canaan HS
// @description        美化介面與操作增強，增加額外功能，提供更好的使用體驗
// @description:zh-TW  美化介面與操作增強，增加額外功能，提供更好的使用體驗
// @description:zh-CN  美化界面与操作增强，增加额外功能，提供更好的使用体验
// @description:ja     インターフェースを美化し操作を強化、追加機能により、より良い使用体験を提供します
// @description:ko     인터페이스를 미화하고 조작을 강화하며, 추가 기능을 통해 더 나은 사용 경험을 제공합니다
// @description:ru     Улучшение интерфейса и функций управления, добавление дополнительных возможностей для лучшего опыта использования
// @description:en     Beautify interface and enhance operations, add extra features, and provide a better user experience

// @connect      *
// @match        *://kemono.cr/*
// @match        *://coomer.st/*
// @match        *://nekohouse.su/*

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635
// @supportURL   https://github.com/Canaan-HS/MonkeyScript/issues
// @icon         https://cdn-icons-png.flaticon.com/512/2566/2566449.png

// @resource     pako https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js

// @require      https://update.greasyfork.org/scripts/487608/1755350/SyntaxLite_min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/preact/10.27.1/preact.umd.min.js

// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        window.onurlchange
// @grant        GM_registerMenuCommand
// @grant        GM_addValueChangeListener

// @run-at       document-body
// ==/UserScript==

`;