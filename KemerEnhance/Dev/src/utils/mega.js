// ! 這個功能整體都是實驗性的, 只能根據我遇到的狀況處理
export default function megaUtils(urlRegex) {

    const megaPDecoder = (() => {
        const encoder = new TextEncoder();
        const ITER = 100000;

        const urlBase64ToBase64 = s => s.replace(/-/g, '+').replace(/_/g, '/').replace(/,/g, '');

        function base64ToBytes(b64) {
            try {
                const raw = atob(b64);
                const n = raw.length;
                const out = new Uint8Array(n);
                for (let i = 0; i < n; i++) out[i] = raw.charCodeAt(i);
                return out;
            } catch (e) {
                return null;
            }
        }

        function bytesToBase64Url(bytes) {
            let bin = '';
            for (let i = 0, L = bytes.length; i < L; i++) bin += String.fromCharCode(bytes[i]);
            let b64 = btoa(bin);
            return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        }

        function equalBytesConstTime(a, b) {
            if (!a || !b || a.length !== b.length) return false;
            let r = 0;
            for (let i = 0, L = a.length; i < L; i++) r |= a[i] ^ b[i];
            return r === 0;
        }

        function xorInto(a, b) {
            const n = a.length;
            const out = new Uint8Array(n);
            for (let i = 0; i < n; i++) out[i] = a[i] ^ b[i];
            return out;
        }

        async function importPwKey(password) {
            return crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
        }

        async function deriveDK(pwKey, salt) {
            const bits = await crypto.subtle.deriveBits(
                { name: 'PBKDF2', salt: salt, iterations: ITER, hash: 'SHA-512' },
                pwKey,
                512
            );

            return new Uint8Array(bits);
        }

        async function importMacKey(raw) {
            return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        }

        return async (pFragmentOrFull, password) => {
            try {
                if (!pFragmentOrFull || !password) return pFragmentOrFull;

                let s = String(pFragmentOrFull);
                const idx = s.indexOf('#P!');
                if (idx >= 0) s = s.slice(idx + 3);
                if (s.toUpperCase().startsWith('P!')) s = s.slice(2);

                let b64 = urlBase64ToBase64(s);

                const mod = b64.length % 4;
                if (mod !== 0) b64 += '='.repeat(4 - mod);

                const data = base64ToBytes(b64);
                if (!data || data.length < (1 + 1 + 6 + 32 + 32)) {
                    return pFragmentOrFull;
                }

                const algorithm = data[0];
                const type = data[1];
                const publicHandle = data.subarray(2, 8);
                const salt = data.subarray(8, 40);
                const macTag = data.subarray(data.length - 32);
                const encryptedKey = data.subarray(40, data.length - 32);
                const keyLen = encryptedKey.length;

                const pwKey = await importPwKey(password);
                const dk = await deriveDK(pwKey, salt);

                if (dk.length < 64 || dk.length < (32 + 32)) {
                    return pFragmentOrFull;
                }
                const xorKey = dk.subarray(0, keyLen);
                const macKey = dk.subarray(32, 64);

                const recoveredKey = xorInto(encryptedKey, xorKey);

                const msgLen = 1 + 1 + publicHandle.length + salt.length + encryptedKey.length;
                const msg = new Uint8Array(msgLen);
                let off = 0;
                msg[off++] = algorithm;
                msg[off++] = type;
                msg.set(publicHandle, off); off += publicHandle.length;
                msg.set(salt, off); off += salt.length;
                msg.set(encryptedKey, off);

                const macCryptoKey = await importMacKey(macKey);
                const macBuffer = await crypto.subtle.sign('HMAC', macCryptoKey, msg);
                const mac = new Uint8Array(macBuffer);

                if (!equalBytesConstTime(mac, macTag)) {
                    return pFragmentOrFull;
                }

                const handleB64Url = bytesToBase64Url(publicHandle);
                const keyB64Url = bytesToBase64Url(recoveredKey);
                const fileType = type === 0x00 ? "folder" : "file";
                return `https://mega.nz/${fileType}/${handleB64Url}#${keyB64Url}`;
            } catch (e) {
                return pFragmentOrFull;
            }
        }
    })();

    const getDecryptedUrl = async (url, password) => await megaPDecoder(url, password);

    const passwordCleaner = (text) =>
        text.match(/^(Password|Pass|Key)\s*:?\s*(.*)$/i)?.[2]?.trim() ?? "";

    const extractRegex = /(https?:\/\/mega\.nz\/#P![A-Za-z0-9_-]+).*?(?:Password|Pass|Key)\b[\s:]*(?:<[^>]+>)?([\p{L}\p{N}\p{P}_-]+)(?:<[^>]+>)?/gius;

    // return { url: password }
    function extractPasswords(data) {
        const result = {};

        if (typeof data === "string") {
            let match;
            while ((match = extractRegex.exec(data)) !== null) {
                result[match[1]] = match[2]?.trim() ?? "";
            }
        }

        return result;
    };

    function parsePassword(href, text) {
        let state = false;
        if (!text) return { state, href };

        const lowerText = text.toLowerCase();
        if (text.startsWith("#")) { // 一般狀況, 含有 # 的完整連結
            state = true;
            href += text;
        }
        else if (/^[A-Za-z0-9_!F-]{16,43}$/.test(text)) { // 有尾部字串 但沒有 #
            state = true;
            href += "#" + text;
        }
        else if (lowerText.startsWith("pass") || lowerText.startsWith("key")) { // 密碼字串
            const key = passwordCleaner(text);
            if (key) {
                state = true;
                href += "#" + key;
            }
        }

        return {
            state,
            href: href.match(urlRegex)?.[0] ?? href
        }
    };

    async function getPassword(node, href) {
        let state;
        const nextNode = node.nextSibling;

        if (nextNode) { // 擁有下一個節點可能是密碼, 或是網址後半段
            if (nextNode.nodeType === Node.TEXT_NODE) {
                ({ state, href } = parsePassword(href, nextNode.$text()));
                if (state) nextNode?.remove(); // 清空字串
            } else if (nextNode.nodeType === Node.ELEMENT_NODE) {
                const nodeText = [...nextNode.childNodes].find(node => node.nodeType === Node.TEXT_NODE)?.$text() ?? "";
                ({ state, href } = parsePassword(href, nodeText));
            }
        }

        return href;
    };

    return {
        getPassword,
        getDecryptedUrl,
        extractPasswords,
    };
}