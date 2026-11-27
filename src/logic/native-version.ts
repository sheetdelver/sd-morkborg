/** Admission floor, distinct from dated native verification evidence. */
export function supportsNativeVersion(version: string): boolean {
    const match = version.trim().match(/^v?(\d+)\.(\d+)\.(\d+)$/i);
    if (!match) return false;
    const parts = match.slice(1).map(Number);
    if (!parts.every(Number.isSafeInteger)) return false;
    const minimum = [6, 0, 0];
    for (let index = 0; index < minimum.length; index++) {
        if (parts[index] !== minimum[index]) return parts[index] > minimum[index];
    }
    return true;
}
