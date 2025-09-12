interface ParsedMeta {
  basic: Record<string, string | string[] | Record<string, string>>;
  require: string[];
}

const keys = new Set([
  'connect',
  'match',
  'icon',
  'namespace',
  'noframes',
  'run-at',
  'resource',
  'require'
]);

/**
 * 解析 Userscript metadata
 * @param metaText 任意 Userscript metadata 文本
 * @returns { basic, require }
 */
export default function parseMeta(metaText: string): ParsedMeta {
  const result: ParsedMeta = {
    basic: {},
    require: []
  };

  const lines = metaText.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('// @')) continue;

    // 拆分 key 和 value
    const matchKeyValue = trimmed.match(/^\/\/\s*@(\S+)\s*(.*)$/);
    if (!matchKeyValue) continue;

    const key = matchKeyValue[1];
    const value = matchKeyValue[2].trim();

    if (!keys.has(key)) continue;

    if (key === 'require') {
      // require: array
      result.require.push(value);

    } else if (key === 'match') {
      // match: array
      if (!Array.isArray(result.basic.match)) result.basic.match = [];
      (result.basic.match as string[]).push(value);

    } else if (key === 'resource') {
      // resource: object
      if (typeof result.basic.resource !== 'object') result.basic.resource = {};
      const [resName, resUrl] = value.split(/\s+/, 2);
      if (resName && resUrl) {
        (result.basic.resource as Record<string, string>)[resName] = resUrl;
      }

    } else {
      // other keys: string
      result.basic[key] = value;
    }
  }

  return result;
}
