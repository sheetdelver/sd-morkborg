/**
 * MorkBorg pure logic rules. 
 * These functions are environment-agnostic and safe for use in both UI and Server segments.
 */

/**
 * Calculate the total item slots used by an actor's inventory
 */
export function calculateSlotsUsed(items: any[]): number {
    return items.reduce((acc: number, item: any) => {
        const weight = Number(item.system?.weight || 0);
        const quantity = Number(item.system?.quantity || 1);
        return acc + (weight * quantity);
    }, 0);
}

/**
 * Calculate the maximum item slots available to an actor
 */
export function calculateMaxSlots(actor: any): number {
    const strength = Number(actor.system?.abilities?.strength?.value || 0);
    return 8 + strength;
}


/**
 * Get the standardized initiative formula for an actor
 */
export function getInitiativeFormula(actor: any): string {
    const agiVal = actor.system?.abilities?.agility?.value ?? 0;
    let modifierString = '';
    if (agiVal > 0) {
        modifierString = `+${agiVal}`;
    } else if (agiVal < 0) {
        modifierString = `${agiVal}`;
    }
    return `1d6${modifierString}`;
}

/**
 * Normalize item data for UI display
 */
export function normalizeItem(item: any): any {
    const system = item.system || {};
    const type = item.type?.toLowerCase();

    return {
        id: item._id || item.id,
        name: item.name,
        type: type,
        img: item.img,
        system: system, // Keep system for sub-components
        description: system.description || '',
        weight: system.weight || 0,
        quantity: system.quantity || 1,
        // Roll specific data
        damageDie: system.damageDie || '',
        damageReductionDie: system.damageReductionDie || '',
        fumbleOn: system.fumbleOn || 1,
        critOn: system.critOn || 20,
        weaponType: system.weaponType || 'melee',
        equipped: system.equipped || false,
        tier: system.tier || { value: 0, max: 0 },
        rollLabel: system.rollLabel || '',
        rollFormula: system.rollFormula || '',
        rollMacro: system.rollMacro || ''
    };
}

/**
 * Categorize items by type for display
 */
export function categorizeItems(actor: any): any {
    const items = (actor.items || []).map((i: any) => normalizeItem(i));
    return {
        weapons: items.filter((i: any) => i.type === 'weapon'),
        shields: items.filter((i: any) => i.type === 'shield'),
        ammo: items.filter((i: any) => i.type === 'ammo'),
        container: items.filter((i: any) => i.type === 'container'),
        armor: items.filter((i: any) => i.type === 'armor'),
        equipment: items.filter((i: any) => ['misc', 'container', 'ammo'].includes(i.type)),
        scrolls: items.filter((i: any) => ['scroll', 'tablet'].includes(i.type)),
        feats: items.filter((i: any) => i.type === 'feat'),
        uncategorized: items.filter((i: any) => !['class', 'weapon', 'armor', 'shield', 'misc', 'container', 'scroll', 'tablet', 'ammo', 'feat'].includes(i.type))
    };
}

import { 
    MorkBorgRollType, 
    MorkBorgRollOptions, 
    MorkBorgRollData 
} from './types';

/**
 * Resolve roll data or pre-evaluated card content from actor state
 */
export function getRollData(actor: any, type: MorkBorgRollType, key: string, options: MorkBorgRollOptions = {}): MorkBorgRollData | null {
    const system = actor.system || {};
    const abilities = system.abilities || {};

    if (type === 'dice') {
        return {
            formula: key,
            type: 'dice',
            label: options.flavor || 'Roll'
        };
    }

    if (type === 'ability') {
        const statLabel = key.charAt(0).toUpperCase() + key.slice(1);
        const value = abilities[key]?.value ?? 0;
        const sign = value >= 0 ? '+' : '-';
        return {
            type: 'ability',
            statKey: key,
            isAutomated: true,
            options: options,
            label: `Test ${statLabel}`,
            rawFormula: `1d20@abilities.${key}.value`,
            resolvedFormula: `1d20${sign}${Math.abs(value)}`,
            humanFormula: `1d20 ${sign} ${Math.abs(value)} (${statLabel})`,
            rollLabel: `${statLabel} Test`,
        };
    }

    if (type === 'item') {
        let item;
        if (Array.isArray(actor.items)) {
            item = actor.items.find((i: any) => i.uuid === key || i._id === key || i.id === key);
        } else if (actor.items && typeof actor.items === 'object') {
            item = Object.values(actor.items)
                .flat()
                .find((i: any) => (i as any).uuid === key || (i as any)._id === key || (i as any).id === key);
        }

        const itemData = normalizeItem(item || {});

        if (options.rollType === 'attack' || options.rollType === 'defend') {
            const isRanged = itemData.type === 'weapon' && itemData.weaponType === 'ranged';
            const attackStat = isRanged ? 'presence' : 'strength';
            const attackLabel = isRanged ? 'Presence' : 'Strength';
            const abilityVal = actor.system?.abilities?.[attackStat]?.value ?? 0;
            const sign = abilityVal >= 0 ? '+' : '-';
            const absMod = Math.abs(abilityVal);
            const agiVal = actor.system?.abilities?.agility?.value ?? 0;
            const agiSign = agiVal >= 0 ? '+' : '-';
            // Note: encumbered state detection should be pre-computed in derived data for purity
            const encumbered = actor.derived?.encumbered || false;

            if (options.rollType === 'attack') {
                return {
                    type: 'attack',
                    itemId: itemData.id,
                    isAutomated: true,
                    options,
                    label: `Attack: ${itemData.name}`,
                    rollLabel: `Attack — ${itemData.name}`,
                    resolvedFormula: `1d20${sign}${absMod}`,
                    humanFormula: `1d20 ${sign} ${absMod} (${attackLabel})`,
                    damageDie: itemData.damageDie || '1d4',
                    encumbered,
                    dr: 12,
                };
            } else {
                return {
                    type: 'defend',
                    itemId: itemData.id,
                    isAutomated: true,
                    options,
                    label: `Defense: ${itemData.name}`,
                    rollLabel: `Defend — ${itemData.name}`,
                    resolvedFormula: `1d20${agiSign}${Math.abs(agiVal)}`,
                    humanFormula: `1d20 ${agiSign} ${Math.abs(agiVal)} (Agility)`,
                    encumbered,
                    dr: 12,
                };
            }
        }

        if (itemData.type === 'feat') {
            if (!itemData.rollLabel) return null;
            const abilities = actor.system?.abilities || {};
            const rawFeatFormula = itemData.rollFormula || '';
            const resolvedFeatFormula = rawFeatFormula.replace(/@abilities\.(\w+)\.value/g, (_: string, s: string) => String(abilities[s]?.value ?? 0));
            const humanFeatFormula = rawFeatFormula.replace(/([+-]?)@abilities\.(\w+)\.value/g, (_: string, op: string, s: string) => {
                const v = abilities[s]?.value ?? 0; const lbl = s.charAt(0).toUpperCase() + s.slice(1);
                const eff = op === '-' ? -v : v; return ` ${eff >= 0 ? '+' : '-'} ${Math.abs(eff)} (${lbl})`;
            });
            return {
                type: 'feat-roll',
                itemId: itemData.id,
                itemName: itemData.name,
                isAutomated: false,
                label: itemData.rollLabel || itemData.name,
                rollLabel: itemData.rollLabel,
                rawFormula: itemData.rollFormula,
                resolvedFormula: resolvedFeatFormula || itemData.rollFormula,
                humanFormula: humanFeatFormula || itemData.rollFormula,
                formula: itemData.rollFormula,
            };
        }

        if (itemData.type === 'scroll' || itemData.type === 'power') {
            const scrollFormula = itemData.rollFormula || '1d20';
            return {
                type: 'power',
                itemId: itemData.id,
                isAutomated: true,
                label: `Power: ${itemData.name}`,
                rollLabel: `Wield — ${itemData.name}`,
                resolvedFormula: scrollFormula,
                humanFormula: scrollFormula,
                dr: itemData.system?.castingThreshold || undefined,
            };
        }
    }

    if (type === 'initiative') {
        const agiVal = actor.system?.abilities?.agility?.value ?? 0;
        const sign = agiVal >= 0 ? '+' : '-';
        return {
            type: 'initiative',
            subType: key,
            isAutomated: true,
            options,
            label: key === 'party' ? 'Party Initiative' : 'Initiative',
            rollLabel: key === 'party' ? 'Party Initiative' : 'Initiative',
            resolvedFormula: `1d6${sign}${Math.abs(agiVal)}`,
            humanFormula: `1d6 ${sign} ${Math.abs(agiVal)} (Agility)`,
        };
    }

    // Simplistic fallbacks
    if (type === 'rest') return { type: 'rest', isAutomated: true, label: 'Rest' };
    if (type === 'broken') return { type: 'broken', isAutomated: true, label: 'Broken' };
    if (type === 'spendOmen') return { type: 'spendOmen', isAutomated: true, label: 'Spend Omen' };

    return {
        formula: '1d20',
        type: 'default',
        label: 'Roll'
    };
}
