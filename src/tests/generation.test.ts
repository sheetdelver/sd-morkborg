import assert from 'node:assert/strict';
import { simulateTableDraw, SdkError } from '@sheet-delver/sdk';
import { CharacterGeneration } from '../data/Generation';
import { NativeContent } from '../data/NativeContent';
import { native } from '../data/native';
import { apiRoutes } from '../server/server';

const classUuid = 'Compendium.custom.classes.Item.herb';
const clazz = { _id: 'herb', uuid: classUuid, pack: 'custom.classes', name: 'Renamed class', type: 'class', img: 'icons/class.webp', system: {
    startingSilver: '2d6*10', omenDie: '1d2', startingHitPoints: '1d6', startingStrength: '3d6', startingAgility: '3d6', startingPresence: '3d6', startingToughness: '3d6',
    weaponTableDie: '1d6', armorTableDie: '1d2', startingItems: 'custom.items,Repeated', startingRolls: 'custom.tables,Class results,2', description: 'Class fixture',
} };
const docs = new Map<string, any>([[classUuid, clazz]]);
const item = (uuid: string, id: string, type = 'misc', system: any = {}) => docs.set(uuid, { _id: id, uuid, name: id, type, effects: [{ _id: 'effect', name: 'preserved' }], flags: { custom: { keep: true } }, system: { quantity: 1, carryWeight: 1, containerSpace: 1, ...system } });
item(native.food, 'food'); item(native.water, 'water');
item('Item.w', 'weapon', 'weapon', { damageDie: '1d6', weaponType: 'melee' });
item('Item.a', 'armor', 'armor', { tier: { value: 1, max: 1 } });
item('Item.scroll', 'scroll', 'scroll');
item('Compendium.custom.items.Item.repeated', 'Repeated'); docs.get('Compendium.custom.items.Item.repeated').pack = 'custom.items';
docs.set('Actor.companion', { _id: 'companion', name: 'Donkey', type: 'container', items: [], system: { capacity: 30 }, flags: { custom: { keep: true } } });
const row = (id: string, uuid?: string, description = '', range = [1, 1]) => ({ _id: id, type: uuid ? 'document' : 'text', documentUuid: uuid, description, range });
const table = (uuid: string, formula: string, results: any[], name = uuid) => docs.set(uuid, { _id: uuid.split('.').at(-1), uuid, name, formula, replacement: true, results });
table(native.names, '1d1', [row('name', undefined, 'Generated')]);
table(native.equipment[0], '1d1', [row('npc', 'Actor.companion')]);
table(native.equipment[1], '1d1', [row('scroll', 'Item.scroll')]);
table(native.equipment[2], '1d1', [row('text', undefined, 'Starting equipment note')]);
table(native.weapon, '1d10', [row('w', 'Item.w', '', [1, 6]), row('bad', 'Item.missing', '', [7, 10])]);
table(native.armor, '1d4', [row('a', 'Item.a', '', [1, 2]), row('bad', 'Item.missing', '', [3, 4])]);
for (const [uuid, text] of [[native.trait, 'Trait'], [native.body, 'Body'], [native.habit, 'Habit']]) table(uuid, '1d1', [row('t', undefined, text)]);
table('Compendium.custom.tables.RollTable.class', '1d2', [row('one', 'Compendium.custom.items.Item.repeated', '', [1, 1]), row('two', 'Compendium.custom.items.Item.repeated', '', [2, 2])], 'Class results');
docs.get('Compendium.custom.tables.RollTable.class').pack = 'custom.tables';
const before = structuredClone([...docs]);
let policy: any = {}, revision = 1, writes = 0, denySecond = false;
const counts = new Map<string, number>(), formulas: string[] = [], journal = new Map<string, any>(), worldActors = new Map<string, any>();
const identity = () => ({ instanceId: 'offline', worldId: 'fixture', systemId: 'morkborg', systemVersion: '6.0.0', foundryGeneration: 14, foundryBuild: 'fixture', runtimeEpoch: 1, contextRevision: revision });
const runtime: any = {
    world: { snapshot: () => ({ identity: identity(), settings: { 'morkborg.allowedScvmClasses': { status: 'world', value: policy } } }), assertRevision: (n: number) => { if (n !== revision) throw new SdkError('conflict', 'Context changed'); } },
    access: { canReadPack: () => true },
    compendium: { async findAll(type: string) { return [...docs.values()].filter(d => type === 'Item' ? ['class', 'misc'].includes(d.type) : type === 'RollTable' ? !!d.results : false); } },
    documents: {
        async fetchByUuid(uuid: string) { return structuredClone(docs.get(uuid) ?? null); },
        async get(_: string, id: string) { return structuredClone(worldActors.get(id) ?? null); },
        async commit(_: string, ops: any[]) { assert.equal(ops.length, 0); return []; },
        async create(_: string, data: any) { writes++; if (denySecond && writes === 2) throw new SdkError('permission_denied', 'Denied'); const id = `created-${writes}`; worldActors.set(id, { ...data, _id: id }); return { _id: id }; },
    },
    rolls: { async roll(formula: string) {
        formulas.push(formula);
        let total: number;
        if (formula === '3d6') total = 18;
        else if (formula === '2d6*10') total = 120;
        else {
            const faces = Number(formula.match(/^1d(\d+)$/)?.[1]); assert.ok(faces, `Unexpected fixture formula ${formula}`);
            const count = counts.get(formula) ?? 0; counts.set(formula, count + 1); total = faces - count % faces;
        }
        return { total, rolls: [JSON.stringify({ formula, total })] };
    } },
    tables: { async draw(uuid: string, opts: any) { return simulateTableDraw(docs.get(uuid), { rollOverride: opts.rollOverride }); } },
    dataStore: { async get(key: string) { return structuredClone(journal.get(key) ?? null); }, async set(key: string, value: any) { journal.set(key, structuredClone(value)); } },
};
const req = (body: any) => ({ json: async () => body, runtime, getAccessContext: () => ({ userId: 'owner' }) } as any);
const generated = await new CharacterGeneration(new NativeContent(runtime)).generate([classUuid]);
assert.equal(generated.className, 'Renamed class', 'metadata, not name branches');
assert.equal(generated.actor.system.hp.max, 9); assert.equal(generated.actor.system.powerUses.max, 7);
assert.equal(generated.companions.length, 1); assert.equal(generated.companions[0].name, "Generated's Donkey");
assert.equal(generated.actor.items.filter(i => i.name === 'Repeated').length, 3, 'legitimate repeated templates survive');
assert.equal(new Set(generated.actor.items.map(i => i._id)).size, generated.actor.items.length);
assert.ok(generated.actor.items.filter(i => i.name === 'Repeated').every(i => i.effects[0].name === 'preserved'));
assert.match(generated.actor.system.description, /Trait.*Trait.*Body.*Habit/i);
assert.deepEqual([...docs], before, 'source templates preserved');
assert.ok(formulas.includes('1d6') && formulas.includes('1d2'));
await assert.rejects(() => new CharacterGeneration(new NativeContent(runtime)).generate([]), /Choose/);
policy = { [classUuid]: false };
assert.deepEqual(await new CharacterGeneration(new NativeContent(runtime)).catalog(), []);
policy = {};
let response = await apiRoutes['generate-character'](req({ classUuids: [classUuid] }));
assert.equal(response.status, 200); let candidate: any = (await response.json() as any).candidate;
revision++;
response = await apiRoutes['create-character'](req({ candidateId: candidate.id }));
assert.equal(response.status, 409); assert.equal(writes, 0, 'stale preview has no writes');
response = await apiRoutes['generate-character'](req({ classUuids: [classUuid] })); candidate = (await response.json() as any).candidate;
denySecond = true;
response = await apiRoutes['create-character'](req({ candidateId: candidate.id }));
assert.equal(response.status, 403, 'preserve typed native denial during partial creation');
assert.equal((await response.json() as any).outcome.created.length, 1);
const confirmed = writes;
await apiRoutes['create-character'](req({ candidateId: candidate.id }));
assert.equal(writes, confirmed, 'a partial candidate is never replayed');
assert.equal((await apiRoutes['creation-status'](req({ candidateId: candidate.id }))).status, 200);
console.log('morkborg complete generation and creation recovery: PASS');
