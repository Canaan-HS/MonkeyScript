interface ParsedMeta {
  basic: Record<string, string | string[]>;
  require: string[];
}

// 指定要解析的 key
const keys = ['connect', 'match', 'icon', 'namespace', 'run-at', 'require'];

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
    const matchKeyValue = trimmed.match(/^\/\/\s*@(\S+)\s+(.+)$/);
    if (!matchKeyValue) continue;

    const key = matchKeyValue[1];
    const value = matchKeyValue[2].trim();

    if (!keys.includes(key)) continue; // 忽略不在指定 key 的行

    // 處理 match 和 require 為 array
    if (key === 'require') {
      result.require.push(value);
    } else if (key === 'match') {
      if (!Array.isArray(result.basic[key])) result.basic[key] = [];
      (result.basic[key] as string[]).push(value);
    } else {
      // 其他 key 單值處理
      result.basic[key] = value;
    }
  }

  return result;
}
