import { SdkError } from '@sheet-delver/sdk';

// Native d850c094: config.js, item/item.js and actor/actor.js.
export const equipmentTypes = ['ammo', 'armor', 'container', 'misc', 'scroll', 'shield', 'weapon'];
export const containerItemTypes = equipmentTypes.filter(t => t !== 'container');
export const armorTiers = [
    { reduction: '0', agility: 0, defense: 0 },
    { reduction: '1d2', agility: 0, defense: 0 },
    { reduction: '1d4', agility: 2, defense: 2 },
    { reduction: '1d6', agility: 4, defense: 2 },
] as const;
export const ownedId = (item: any): string => item?._id || item?.id;

export interface PreparedInventoryItem {
    id: string; name: string; type: string; img?: string; system: Record<string, any>;
    quantity: number; carried: boolean; equipped: boolean; carryWeight: number;
    containerSpace: number; containerId: string | null; totalCarryWeight: number;
    totalContainerSpace: number; damageReductionDie?: string; handed: 1 | 2 | null;
    [key: string]: any;
}
export interface PreparedInventory {
    items: PreparedInventoryItem[]; slotsUsed: number; containerSpace: number;
    armor: PreparedInventoryItem | null; shield: PreparedInventoryItem | null;
    reduction: string; defenseModifier: number; agilityModifier: number;
}
export function normalizeNativeItem(source: any): PreparedInventoryItem {
    const system = structuredClone(source.system ?? {});
    const type = source.type?.toLowerCase();
    const handed = ['1', '1h'].includes(String(system.handed)) ? 1 : ['2', '2h'].includes(String(system.handed)) ? 2 : null;
    // Native getter deliberately treats stored zero quantity as one for weight.
    // Keep the source zero and display quantity intact; this is a derived weight quirk.
    const quantity = Number(system.quantity ?? 1);
    const carryWeight = Number(system.carryWeight ?? 0);
    const containerSpace = Number(system.containerSpace ?? 0);
    if (![quantity, carryWeight, containerSpace].every(n => Number.isFinite(n) && n >= 0)) throw new SdkError('validation', 'Invalid native inventory measurements');
    const tier = system.tier;
    if (type === 'armor' && (!tier || ![tier.value, tier.max].every(v => Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 3))) throw new SdkError('validation', 'Invalid armor tiers');
    return {
        ...structuredClone(source), id: ownedId(source), type, system,
        name: source.name ?? '', quantity, carryWeight, containerSpace, handed,
        description: system.description ?? '', damageDie: system.damageDie ?? '',
        damageReductionDie: type === 'armor' ? armorTiers[Number(tier.value)].reduction : undefined,
        tier, fumbleOn: system.fumbleOn ?? 1, critOn: system.critOn ?? 20,
        weaponType: system.weaponType, rollLabel: system.rollLabel ?? '',
        rollFormula: system.rollFormula ?? '', rollMacro: system.rollMacro ?? '',
        carried: system.carried === undefined ? true : carryWeight === 0 ? false : system.carried === true,
        equipped: system.equipped === true, containerId: null,
        totalCarryWeight: Math.ceil(carryWeight * (quantity || 1)), totalContainerSpace: 0,
    };
}
export function prepareInventory(sources: any[]): PreparedInventory {
    const items = sources.map(normalizeNativeItem);
    const byId = new Map<string, PreparedInventoryItem>();
    for (const item of items) {
        if (!item.id || byId.has(item.id)) throw new SdkError('validation', 'Missing or duplicate owned Item ID');
        byId.set(item.id, item);
    }
    for (const container of items.filter(i => i.type === 'container')) {
        const members = container.system.items ?? [];
        if (!Array.isArray(members) || new Set(members).size !== members.length) throw new SdkError('validation', 'Invalid container membership');
        container.totalCarryWeight = container.carryWeight;
        for (const id of members) {
            const child = byId.get(id);
            if (!child || !containerItemTypes.includes(child.type) || child.containerId) throw new SdkError('validation', 'Missing, nested or multiply contained Item');
            child.containerId = container.id;
            container.totalCarryWeight += child.totalCarryWeight;
            container.totalContainerSpace += Math.ceil(child.containerSpace * (child.quantity || 1));
        }
    }
    const top = items.filter(i => equipmentTypes.includes(i.type) && !i.containerId);
    const armor = items.find(i => i.type === 'armor' && i.equipped) ?? null;
    const shield = items.find(i => i.type === 'shield' && i.equipped) ?? null;
    const tier = armor ? armorTiers[Number(armor.tier.max)] : armorTiers[0];
    return {
        items, slotsUsed: top.filter(i => i.carried).reduce((sum, i) => sum + i.totalCarryWeight, 0),
        containerSpace: top.reduce((sum, i) => sum + i.totalContainerSpace + Math.ceil(i.containerSpace * i.quantity), 0),
        armor, shield, defenseModifier: tier.defense, agilityModifier: tier.agility,
        reduction: `${armor?.damageReductionDie ?? '0'}${shield ? '+1' : ''}`,
    };
}
