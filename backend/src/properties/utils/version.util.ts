export function incrementSemanticVersion(version: string): string {
  const [majorRaw, minorRaw] = version.split('.');
  const major = Number(majorRaw);
  const minor = Number(minorRaw);
  if (Number.isNaN(major) || Number.isNaN(minor)) {
    throw new Error(`Invalid semantic version: ${version}`);
  }
  return `${major}.${minor + 1}`;
}
