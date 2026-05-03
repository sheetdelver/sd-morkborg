/**
 * Resolves Foundry @-variables in a roll formula against actor data.
 * e.g. "1d20+@abilities.presence.value" → { resolved: "1d20+4", humanFormula: "1d20 + 4 (Presence)" }
 */

const ABILITY_MAP: Record<string, string> = {
    'abilities.strength.value': 'Strength',
    'abilities.agility.value': 'Agility',
    'abilities.presence.value': 'Presence',
    'abilities.toughness.value': 'Toughness',
};

export interface ResolvedFormula {
    formula: string;       // numeric: e.g. "1d20+4"
    humanFormula: string;  // pretty:  e.g. "1d20 + 4 (Presence)"
}

export function resolveFormula(raw: string, actor: any): ResolvedFormula {
    if (!raw) return { formula: '', humanFormula: '' };

    const system = actor?.system || {};
    let resolved = raw;
    const humanParts: string[] = [];

    // Replace each @abilities.X.value with its numeric value
    resolved = resolved.replace(/@([\w.]+)/g, (_match, path: string) => {
        const value = getNestedValue(system, path);
        const label = ABILITY_MAP[path];
        if (value !== undefined) {
            if (label) humanParts.push(`${value >= 0 ? '+' : ''}${value} (${label})`);
            return String(value);
        }
        return '0';
    });

    // Build human formula: base dice + resolved ability parts
    const baseDice = raw.replace(/@[\w.]+/g, '').replace(/[+-]\s*$/, '').trim();
    const humanFormula = humanParts.length > 0
        ? `${baseDice} ${humanParts.join(' ')}`
        : resolved;

    return { formula: resolved, humanFormula };
}

function getNestedValue(obj: any, path: string): number | undefined {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
        if (current == null || typeof current !== 'object') return undefined;
        current = current[part];
    }
    return typeof current === 'number' ? current : undefined;
}

/**
 * Returns a human-readable label for an ability roll.
 * e.g. "strength" → "1d20 + 2 (Strength)"
 */
export function resolveAbilityFormula(statKey: string, actor: any): ResolvedFormula {
    const system = actor?.system || {};
    const value = system.abilities?.[statKey]?.value ?? 0;
    const label = statKey.charAt(0).toUpperCase() + statKey.slice(1);
    const sign = value >= 0 ? '+' : '-';
    return {
        formula: `1d20${sign}${Math.abs(value)}`,
        humanFormula: `1d20 ${sign} ${Math.abs(value)} (${label})`
    };
}
