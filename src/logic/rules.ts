import { SdkError } from '@sheet-delver/sdk';
import { prepareInventory, normalizeNativeItem } from './inventory';
import type { MorkBorgRollType, MorkBorgRollOptions, MorkBorgRollData } from './types';

export const calculateSlotsUsed = (items: any[]) => prepareInventory(items).slotsUsed;
export const calculateMaxSlots = (actor: any) => abilityValue(actor, 'strength') + 8;
export const normalizeItem = normalizeNativeItem;
export function categorizeItems(actor: any): any {
    const items = prepareInventory(actor.items ?? []).items;
    const group = (...types: string[]) => items.filter(i => types.includes(i.type));
    return { weapons: group('weapon'), armor: group('armor'), shields: group('shield'),
        ammo: group('ammo'), equipment: group('misc', 'container'), scrolls: group('scroll'),
        feats: group('feat'), classes: group('class'), uncategorized: items.filter(i => !['weapon', 'armor', 'shield', 'ammo', 'misc', 'container', 'scroll', 'feat', 'class'].includes(i.type)) };
}
export function abilityValue(actor: any, key: string): number {
    const n = actor.system?.abilities?.[key]?.value;
    if (typeof n !== 'number' || !Number.isFinite(n)) throw new SdkError('not_ready', `Ability ${key} is unavailable`);
    return n;
}
export const signed = (value: number) => value >= 0 ? `+${value}` : String(value);
export const getInitiativeFormula = (actor: any) => `1d6${signed(abilityValue(actor, 'agility'))}`;
export function resolveFormula(formula: unknown, actor: any, item?: any): string {
    if (typeof formula !== 'string' || !formula.trim() || formula.length > 2000) throw new SdkError('not_ready', 'Required formula is unavailable');
    return formula.replace(/@([\w.]+)/g, (_, variable: string) => {
        const path = variable.replace(/^system\./, '').split('.');
        let value: any = actor.system;
        if (item && path.length === 1 && Object.hasOwn(item.system ?? {}, path[0])) value = item.system;
        for (const part of path) value = value?.[part];
        if (typeof value !== 'number' || !Number.isFinite(value)) throw new SdkError('not_ready', `Formula variable @${variable} is unavailable`);
        return `(${value})`;
    });
}
export function manualDieSpec(formula: string): { faces: number; token: string } | null {
    const dice = [...formula.matchAll(/\b(\d*)d(\d+)\b/gi)];
    if (dice.length !== 1 || Number(dice[0][1] || 1) !== 1 || !/^[\d\sd+*/().\-]+$/i.test(formula)) return null;
    return { faces: Number(dice[0][2]), token: dice[0][0] };
}
export function withManualDie(formula: string, raw: unknown): string {
    if (raw === undefined) return formula;
    const spec = manualDieSpec(formula);
    if (!spec) throw new SdkError('validation', 'Manual entry requires a single unmodified die term; use Auto for this formula');
    if (!Number.isInteger(raw) || Number(raw) < 1 || Number(raw) > spec.faces) throw new SdkError('validation', `Raw die must be 1–${spec.faces}`);
    return formula.replace(spec.token, String(raw));
}
export function combatDR(base: number, modifier: number): number {
    if (!Number.isSafeInteger(base)) throw new SdkError('validation', 'Invalid base DR');
    if (!Number.isFinite(modifier)) throw new SdkError('not_ready', 'Action modifiers are unavailable');
    return base + modifier;
}
function combatDefaults(actor: any, kind: 'attack' | 'defend') {
    const flags = actor.flags?.morkborg ?? {};
    const dr = flags[kind === 'attack' ? 'attackDR' : 'defendDR'] || 12;
    if (!Number.isSafeInteger(dr)) throw new SdkError('not_ready', 'Remembered native DR is unavailable');
    const incomingAttackDefault = flags.incomingAttack || '1d4'; // Pinned native defend dialog default.
    const targetArmorDefault = flags.targetArmor || '0';
    if (typeof incomingAttackDefault !== 'string' || typeof targetArmorDefault !== 'string') throw new SdkError('not_ready', 'Remembered native combat formula is unavailable');
    return { dr, incomingAttackDefault, targetArmorDefault };
}
export function actorActionFingerprint(actor: any): string {
    return JSON.stringify([actor._id ?? actor.id, actor.type, actor.system, actor.flags?.morkborg, (actor.items ?? []).map((i: any) => [i._id ?? i.id, i.type, i.system])]);
}
function carryingPenalty(actor: any): number {
    if (typeof actor.derived?.encumbered !== 'boolean') throw new SdkError('not_ready', 'Carrying rules are unavailable');
    return actor.derived.encumbered ? 2 : 0;
}
function booleanRule(actor: any, key: string): boolean {
    const r = actor.derived?.rules?.[`morkborg.${key}`];
    if (!r || r.status === 'unavailable' || typeof r.value !== 'boolean') throw new SdkError('not_ready', `Native ${key} setting is unavailable`);
    return r.value;
}
export function getRollData(actor: any, type: MorkBorgRollType, key: string, options: MorkBorgRollOptions = {}): MorkBorgRollData | null {
    if (actor.type && actor.type !== 'character') throw new SdkError('validation', 'Unsupported Actor type');
    const common = { options, isAutomated: true };
    const simple = (kind: string, formula: string, label: string, extra: any = {}): any => ({ ...common, type: kind, formula, resolvedFormula: formula, humanFormula: formula, label, rollLabel: label, ...extra });
    if (type === 'dice') return simple('dice', resolveFormula(key, actor), options.flavor ?? 'Roll');
    if (type === 'ability') {
        if (!['strength', 'agility', 'presence', 'toughness'].includes(key)) throw new SdkError('validation', 'Unknown ability');
        const inventory = actor.derived?.inventory ?? prepareInventory(actor.items ?? []);
        const drModifier = ['strength', 'agility'].includes(key) ? carryingPenalty(actor) + (key === 'agility' ? inventory.agilityModifier : 0) : 0;
        return simple('ability', `1d20${signed(abilityValue(actor, key))}`, `Test ${key.charAt(0).toUpperCase() + key.slice(1)}`, { statKey: key, drModifier });
    }
    if (type === 'initiative') {
        if (!['individual', 'party'].includes(key)) throw new SdkError('validation', 'Unknown initiative mode');
        return simple('initiative', key === 'party' ? '1d6' : getInitiativeFormula(actor), key === 'party' ? 'Party order roll' : 'Initiative', { subType: key });
    }
    if (['rest', 'broken', 'getBetter', 'spendOmen', 'rollOmens', 'rollPowers'].includes(type)) return { ...common, type, label: type } as any;
    if (type === 'defend' || (type === 'item' && options.rollType === 'defend')) {
        const inv = actor.derived?.inventory ?? prepareInventory(actor.items ?? []);
        if (key && type === 'item' && !inv.items.some((i: any) => i.id === key && ['armor', 'shield'].includes(i.type))) throw new SdkError('not_found', 'Owned defensive Item not found');
        return simple('defend', `1d20${signed(abilityValue(actor, 'agility'))}`, 'Defend', { itemId: key, ...combatDefaults(actor, 'defend'),
            drModifier: carryingPenalty(actor) + inv.defenseModifier, reduction: inv.reduction, automation: booleanRule(actor, 'hitAutomation') });
    }
    if (!['item', 'feat', 'damage'].includes(type)) throw new SdkError('validation', 'Unsupported action');
    const item = (actor.items ?? []).find((i: any) => [i._id, i.id, i.uuid].includes(key));
    if (!item) throw new SdkError('not_found', 'Owned Item not found');
    const id = item._id ?? item.id;
    if (item.type === 'weapon' && (options.rollType === 'attack' || type === 'damage')) {
        if (typeof item.system?.damageDie !== 'string' || !item.system.damageDie.trim()) throw new SdkError('not_ready', 'Weapon damage formula is unavailable');
        const damageDie = resolveFormula(item.system.damageDie, actor, item);
        if (type === 'damage') return simple('dice', damageDie, `Damage: ${item.name}`, { itemId: id });
        if (!['melee', 'ranged'].includes(item.system.weaponType)) throw new SdkError('not_ready', 'Weapon type is unavailable');
        const ranged = item.system.weaponType === 'ranged';
        return simple('attack', `1d20${signed(abilityValue(actor, ranged ? 'presence' : 'strength'))}`, `Attack: ${item.name}`, {
            itemId: id, damageDie, ...combatDefaults(actor, 'attack'), drModifier: ranged ? 0 : carryingPenalty(actor), encumbered: !ranged && actor.derived.encumbered,
            automation: booleanRule(actor, 'hitAutomation'), trackAmmo: booleanRule(actor, 'trackAmmo'),
        });
    }
    if (item.type === 'scroll') return simple('power', `1d20${signed(abilityValue(actor, 'presence'))}`, `Wield: ${item.name}`, { itemId: id, dr: 12 });
    if (item.type === 'feat') {
        if (!item.system?.rollLabel) return null;
        // Native precedence is macro before formula; adapters are reviewed server capabilities.
        if (item.system.rollMacro) return { ...common, type: 'feat-macro', itemId: id, label: item.system.rollLabel, macro: item.system.rollMacro } as any;
        if (!item.system.rollFormula) throw new SdkError('not_ready', 'Feat has no executable formula or reviewed macro');
        return simple('feat-roll', resolveFormula(item.system.rollFormula, actor), item.system.rollLabel, { itemId: id, itemName: item.name });
    }
    throw new SdkError('validation', 'Unsupported Item capability');
}
