import meta from './ColaMangaEnhance/Dev/src/metadata.js';

function parseMeta(meta) {
  if (typeof meta !== 'string') {
    throw new Error('`Parse`\'s first argument should be a string');
  }

  const endMarker = '// ==/UserScript==';
  const endIndex = meta.indexOf(endMarker);
  const headerContent = endIndex !== -1 ? meta.substring(0, endIndex) : meta;

  return headerContent.split(/[\r\n]/)
    .filter(function (line) {
      return /\S+/.test(line) &&
        line.indexOf('==UserScript==') === -1;
    })
    .reduce(function (obj, line) {
      const trimmedLine = line.trim().replace(/^\/\//, '').trim();
      if (trimmedLine) { // 確保處理非空行

        const arr = trimmedLine.split(/\s+/);
        const key = arr[0]?.slice(1);
        const value = arr.slice(1).join(' ');

        if (key) { // 確保 key 存在
          if (typeof obj[key] === 'undefined') {
            obj[key] = value;
          } else if (Array.isArray(obj[key])) {
            obj[key].push(value);
          } else {
            obj[key] = [obj[key], value];
          }
        }
      }
      return obj;
    }, {});
}

console.log(parseMeta(meta));

export default parseMeta;