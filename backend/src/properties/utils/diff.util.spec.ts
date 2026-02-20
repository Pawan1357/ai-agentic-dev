import { buildDiff } from './diff.util';

describe('buildDiff', () => {
  it('returns empty list for equal values', () => {
    expect(buildDiff({ a: 1 }, { a: 1 })).toEqual([]);
  });

  it('returns field path for nested change', () => {
    const result = buildDiff({ a: { b: 1 } }, { a: { b: 2 } });
    expect(result[0]?.field).toBe('a.b');
    expect(result[0]?.oldValue).toBe(1);
    expect(result[0]?.newValue).toBe(2);
  });
});
