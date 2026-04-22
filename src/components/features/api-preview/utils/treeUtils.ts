/**
 * 树形结构工具：判断可展开性、值类型、收集路径
 */

export function isExpandable(value: unknown): boolean {
  return (typeof value === 'object' && value !== null && !Array.isArray(value)) || Array.isArray(value);
}

export function getValueType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

export function collectAllPaths(
  obj: unknown,
  path = '',
  paths: Set<string> = new Set()
): Set<string> {
  if (!obj || typeof obj !== 'object') {
    return paths;
  }

  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      const firstItem = obj[0];
      const itemPath = path ? `${path}[0]` : '[0]';
      if (isExpandable(firstItem)) {
        paths.add(itemPath);
        collectAllPaths(firstItem, itemPath, paths);
      }
    }
  } else {
    Object.entries(obj).forEach(([key, value]) => {
      const itemPath = path ? `${path}.${key}` : key;
      if (isExpandable(value)) {
        paths.add(itemPath);
        collectAllPaths(value, itemPath, paths);
      }
    });
  }

  return paths;
}
