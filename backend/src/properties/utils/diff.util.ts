interface DiffChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export function buildDiff(oldObj: unknown, newObj: unknown, basePath = ''): DiffChange[] {
  if (JSON.stringify(oldObj) === JSON.stringify(newObj)) {
    return [];
  }

  const isObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v);

  if (!isObject(oldObj) || !isObject(newObj)) {
    return [{ field: basePath || 'root', oldValue: oldObj, newValue: newObj }];
  }

  const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  const diffs: DiffChange[] = [];

  for (const key of keys) {
    const path = basePath ? `${basePath}.${key}` : key;
    const oldValue = oldObj[key];
    const newValue = newObj[key];

    if (Array.isArray(oldValue) || Array.isArray(newValue)) {
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        diffs.push({ field: path, oldValue, newValue });
      }
      continue;
    }

    if (isObject(oldValue) && isObject(newValue)) {
      diffs.push(...buildDiff(oldValue, newValue, path));
      continue;
    }

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      diffs.push({ field: path, oldValue, newValue });
    }
  }

  return diffs;
}
