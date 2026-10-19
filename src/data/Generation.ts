import { randomBytes } from 'node:crypto';
import { SdkError } from '@sheet-delver/sdk';
import { requireRule } from '../logic/worldRules';
import { NativeContent, documentUuid } from './NativeContent';
import { native } from './native';

export const sameIdentity = (a: string, b: string) => a.replace(/\.(Item|Actor|RollTable|Macro)\./, '.') === b.replace(/\.(Item|Actor|RollTable|Macro)\./, '.');
const bonus = (n: number) => n <= 4 ? -3 : n <= 6 ? -2 : n <= 8 ? -1 : n <= 12 ? 0 : n <= 14 ? 1 : n <= 16 ? 2 : 3;
function formula(value: unknown, label: string): string {
    if (typeof value !== 'string' || !value.trim()) throw new SdkError('not_ready', `Class ${label} formula is unavailable`);
    return value;
}
function lines(value: unknown, counts = false): { reference: string; count: number }[] {
    if (value === undefined || value === '') return [];
    if (typeof value !== 'string') throw new SdkError('validation', 'Invalid class starting metadata');
    return value.split('\n').filter(s => s.trim()).map(line => {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length < 2 || parts.length > (counts ? 3 : 2) || !parts[0] || !parts[1]) throw new SdkError('validation', 'Starting references require an exact pack and document name');
        const count = parts[2] === undefined ? 1 : Number(parts[2]);
        if (!Number.isSafeInteger(count) || count < 1) throw new SdkError('validation', 'Invalid starting roll count');
        return { reference: parts.slice(0, 2).join(','), count };
    });
}
export function newDocument(source: any, uuid: string, item = false): any {
    const copy = structuredClone(source);
    delete copy._id; delete copy.id; delete copy.uuid; delete copy.pack; delete copy._stats; delete copy.folder; delete copy.ownership;
    copy.flags = { ...copy.flags, morkborg: { ...copy.flags?.morkborg, sourceUuid: uuid } };
    if (item) {
        if (copy.type === 'container' && copy.system?.items?.length) throw new SdkError('validation', 'Starting container has unresolved owned Item references');
        copy._id = randomBytes(8).toString('hex');
    }
    return copy;
}
export class CharacterGeneration {
    constructor(readonly content: NativeContent) {}
    async catalog(): Promise<any[]> {
        const policy = requireRule(this.content.runtime.world?.snapshot(), 'allowedScvmClasses');
        const items = await this.content.runtime.compendium.findAll('Item', { type: 'class' });
        const classes = items.filter(i => i.type === 'class').map(i => ({ ...i, uuid: documentUuid(i, 'Item') }));
        if (!classes.length) throw new SdkError('not_ready', 'No caller-visible Class templates; restore the required pack and retry');
        return classes.filter(c => {
            const values = Object.entries(policy).filter(([key]) => sameIdentity(key, c.uuid)).map(([, value]) => value);
            if (new Set(values).size > 1) throw new SdkError('conflict', 'Conflicting allowed class identities');
            return values[0] !== false;
        });
    }
    async generate(selected: string[], previous?: string) {
        const catalog = await this.catalog();
        if (!Array.isArray(selected) || !selected.length || selected.some(id => typeof id !== 'string' || !catalog.some(c => sameIdentity(c.uuid, id)))) throw new SdkError('validation', 'Choose at least one currently allowed Class');
        let choices = catalog.filter(c => selected.some(id => sameIdentity(c.uuid, id)));
        if (choices.length > 1 && previous) choices = choices.filter(c => !sameIdentity(c.uuid, previous));
        const choice = choices.length === 1 ? 1 : await this.content.total(`1d${choices.length}`, 'Class selection');
        if (!Number.isInteger(choice) || choice < 1 || choice > choices.length) throw new SdkError('not_ready', 'Invalid class selection roll');
        const clazz = await this.content.document(choices[choice - 1].uuid);
        if (clazz.type !== 'class') throw new SdkError('not_ready', 'Selected document is not a Class');
        const classUuid = choices[choice - 1].uuid;
        const s = clazz.system ?? {};
        const fields = ['startingSilver', 'omenDie', 'startingHitPoints', 'startingStrength', 'startingAgility', 'startingPresence', 'startingToughness'];
        fields.forEach(key => formula(s[key], key));
        for (const key of ['weaponTableDie', 'armorTableDie']) if (typeof s[key] !== 'string') throw new SdkError('not_ready', `Class ${key} is unavailable`);
        const startingItems = await Promise.all(lines(s.startingItems).map(l => this.content.legacy('Item', l.reference)));
        const startingRolls = [];
        for (const l of lines(s.startingRolls, true)) {
            const table = await this.content.legacy('RollTable', l.reference);
            await this.content.table(documentUuid(table, 'RollTable'));
            startingRolls.push({ ...l, table });
        }
        const names = await this.content.draw(native.names);
        if (names.some(e => e.kind !== 'text')) throw new SdkError('validation', 'Name table must return text');
        const name = names.map(e => e.description || e.name).join(' ').trim();
        if (!name) throw new SdkError('not_ready', 'Name table returned empty text');
        const silver = await this.content.total(s.startingSilver, 'Starting silver');
        const omens = await this.content.total(s.omenDie, 'Starting Omens');
        const hpBase = await this.content.total(s.startingHitPoints, 'Starting HP');
        const powerBase = await this.content.total('1d4', 'Starting powers');
        let abilityFormulas = fields.slice(3).map(k => s[k]);
        if (sameIdentity(classUuid, native.classless)) {
            const pool = ['3d6', '3d6', '4d6kh3', '4d6kh3']; abilityFormulas = [];
            while (pool.length) {
                const position = pool.length === 1 ? 1 : await this.content.total(`1d${pool.length}`, 'Classless ability assignment');
                if (!Number.isInteger(position) || position < 1 || position > pool.length) throw new SdkError('not_ready', 'Invalid ability assignment roll');
                abilityFormulas.push(pool.splice(position - 1, 1)[0]);
            }
        }
        const abilities: Record<string, { value: number }> = {};
        for (const [index, key] of ['strength', 'agility', 'presence', 'toughness'].entries()) abilities[key] = { value: bonus(await this.content.total(abilityFormulas[index], key)) };
        const hp = Math.max(1, hpBase + abilities.toughness.value);
        const powers = Math.max(0, powerBase + abilities.presence.value);
        const items = [newDocument(clazz, classUuid, true)];
        const companions: any[] = [];
        const notes: string[] = [];
        const add = (entries: any[]) => {
            for (const e of entries) {
                if (e.kind === 'Item') items.push(newDocument(e.document, e.uuid, true));
                else if (e.kind === 'Actor') companions.push(newDocument(e.document, e.uuid));
                else notes.push(e.description || e.name);
            }
        };
        const food = await this.content.document(native.food);
        const foodCopy = newDocument(food, native.food, true);
        foodCopy.system.quantity = await this.content.total('1d4', 'Starting food'); items.push(foodCopy);
        items.push(newDocument(await this.content.document(native.water), native.water, true));
        for (const uuid of native.equipment) add(await this.content.draw(uuid));
        const scroll = items.some(i => i.type === 'scroll');
        let weaponDie = s.weaponTableDie, armorDie = s.armorTableDie;
        if (scroll && ['1d8', '2d4', '1d10'].includes(weaponDie)) weaponDie = '1d6';
        if (scroll && ['1d3', '1d4'].includes(armorDie)) armorDie = '1d2';
        if (weaponDie) add(await this.content.draw(native.weapon, { formula: weaponDie }));
        if (armorDie) add(await this.content.draw(native.armor, { formula: armorDie }));
        for (const doc of startingItems) items.push(newDocument(doc, documentUuid(doc, 'Item'), true));
        const trait1 = await this.content.draw(native.trait), trait2 = await this.content.draw(native.trait);
        const body = await this.content.draw(native.body), habit = await this.content.draw(native.habit);
        const text = (entries: any[]) => {
            if (entries.some(e => e.kind !== 'text')) throw new SdkError('validation', 'Trait table must return text');
            return entries.map(e => e.description || e.name).join(' ');
        };
        const second = text(trait2);
        const traits = `${text(trait1)} and ${second.charAt(0).toLowerCase()}${second.slice(1)}. ${text(body)} ${text(habit)}`;
        for (const l of startingRolls) {
            const totals = new Set<number>();
            for (let i = 0; i < l.count; i++) {
                const entries = await this.content.draw(documentUuid(l.table, 'RollTable'), { uniqueTotals: totals });
                add(entries.map(e => e.kind === 'text' ? { ...e, description: `${l.table.name}: ${e.description || e.name}` } : e));
            }
        }
        const description = [s.description ?? '', `<p>${traits}</p>`, ...notes.map(line => `<p>${line}</p>`)].join('\n');
        const actor = { name, type: 'character', img: clazz.img, items, flags: {},
            system: { abilities, hp: { value: hp, max: hp }, powerUses: { value: powers, max: powers }, omens: { value: Math.max(0, omens), max: Math.max(0, omens) }, silver, description },
            prototypeToken: { name, texture: { src: clazz.img }, actorLink: true, disposition: 1, sight: { enabled: true } } };
        for (const companion of companions) {
            companion.name = `${name.split(/\s+/)[0]}'s ${companion.name}`;
            const friendly = companion.type === 'follower';
            companion.prototypeToken = { actorLink: friendly, disposition: companion.type === 'creature' ? -1 : friendly ? 1 : 0, sight: { enabled: friendly }, ...companion.prototypeToken };
        }
        return { actor, companions, classUuid, className: clazz.name, traits, notes,
            provenance: { nativeRevision: native.revision, dependencies: Object.fromEntries(this.content.dependencies) } };
    }
}
