import { incrementSemanticVersion } from './version.util';

describe('incrementSemanticVersion', () => {
  it('increments semantic version minor', () => {
    expect(incrementSemanticVersion('1.1')).toBe('1.2');
  });

  it('throws on malformed value', () => {
    expect(() => incrementSemanticVersion('bad')).toThrow();
  });
});
