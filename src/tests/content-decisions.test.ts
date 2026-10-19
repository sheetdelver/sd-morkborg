import assert from 'node:assert/strict';
import { SdkError, simulateTableDraw } from '@sheet-delver/sdk';
import { NativeContent } from '../data/NativeContent';
import { newDocument } from '../data/Generation';

// Native identities; small authored-data fixtures exercise selection/preservation.
// Installed tests separately use complete records decoded from copied native DBs.
const pale = 'Compendium.morkborg.mork-borg-items.Item.wLJV0VJT5I234obT';
const reference = 'morkborg.mork-borg-items,Intuitive Power';
const pair = ['BtoSeh36zY8IqOQJ', 'YcKA0JHLezBYt3fz'].map(id => `Compendium.morkborg.mork-borg-items.Item.${id}`);
const tableUuid = 'Compendium.morkborg.mork-borg-tables.RollTable.DfILdvixuR0LyIcT';
const stale = 'Compendium.morkborg.morkborg-actors.6QMkD6jeNJ5ovUmf';
const owlUuid = 'Compendium.morkborg.mork-borg-actors.Actor.HLu7lgwoNPlhfx3W';
const docs = new Map<string, any>(pair.map(uuid => [uuid, { _id: uuid.split('.').at(-1), name: 'Intuitive Power', type: 'feat', img: 'systems/morkborg/tokens/players/pale_one.png', system: { description: '', rollFormula: '', rollMacro: '', rollLabel: '' }, effects: [], flags: {} }]));
docs.set(tableUuid, { _id: 'DfILdvixuR0LyIcT', name: 'Forlorn Philosopher Items', formula: '1d6', replacement: true, results: [
    { _id: 'RaRYtTXoANahK7PP', type: 'document', range: [2, 2], documentUuid: stale },
    { _id: 'additional', type: 'text', range: [2, 2], description: 'Additional result' },
] });
docs.set(owlUuid, { _id: 'HLu7lgwoNPlhfx3W', name: 'Hegelian Owl', type: 'follower', system: { hp: { value: 2, max: 2 } }, items: [{ _id: 'MOwcWP9f3Ik1O4FS', name: 'Claw/Bite', type: 'weapon', system: { damageDie: '1d4' } }] });
const original = structuredClone([...docs]);
let choice = 1, dice = 0, denied: string | undefined, version = '6.0.1', retired = false, retireDuringRoll = false;
const reads: string[] = [];
const runtime: any = {
    world: { snapshot: () => ({ identity: { systemId: 'morkborg', systemVersion: version, foundryGeneration: 14 } }) },
    access: { canReadPack: () => true },
    documents: { async fetchByUuid(uuid: string) {
        reads.push(uuid);
        if (uuid === denied) throw new SdkError('permission_denied', 'Denied');
        return structuredClone(docs.get(uuid) ?? null);
    } },
    compendium: { async findAll() { return [...docs.entries()].filter(([, d]) => d.type === 'feat').map(([uuid, d]) => ({ ...d, uuid, pack: 'morkborg.mork-borg-items' })); } },
    rolls: { async roll(formula: string, _label: string, opts: any) {
        assert.equal(formula, '1d2'); assert.equal(opts.displayChat, false); dice++;
        if (retireDuringRoll) retired = true;
        return { total: choice, rolls: [] };
    } },
    tables: { async draw(uuid: string, opts: any) { return simulateTableDraw(await runtime.documents.fetchByUuid(uuid), opts); } },
};
const service = () => new NativeContent(runtime, async () => { if (retired) throw new SdkError('conflict', 'Retired request'); });
const isCode = (code: string) => (e: any) => e.code === code;

for (choice of [1, 2]) {
    const content = service();
    const selected = await content.legacy('Item', reference, pale);
    assert.equal(selected.uuid, pair[choice - 1], 'each SDK source-choice outcome selects its exact reviewed UUID');
    assert.deepEqual([...content.dependencies.keys()].sort(), [...pair].sort(), 'both alternatives are creation dependencies');
    assert.equal(newDocument(selected, selected.uuid, true).flags.morkborg.sourceUuid, pair[choice - 1]);
}
const diceAfterSelection = dice;
await assert.rejects(() => service().legacy('Item', reference), isCode('conflict'));
await assert.rejects(() => service().legacy('Item', reference, 'Item.other-class'), isCode('conflict'));
assert.equal(dice, diceAfterSelection, 'no generic random resolution by name');
docs.get(pair[1]).system.description = 'Changed source';
await assert.rejects(() => service().legacy('Item', reference, pale), isCode('conflict'));
docs.get(pair[1]).system.description = '';
assert.equal(dice, diceAfterSelection, 'diverged documents are not randomly chosen');
denied = pair[1];
await assert.rejects(() => service().legacy('Item', reference, pale), isCode('permission_denied'));
denied = undefined;
const missing = docs.get(pair[1]); docs.delete(pair[1]);
await assert.rejects(() => service().legacy('Item', reference, pale), isCode('not_ready'));
docs.set(pair[1], missing);
assert.equal(dice, diceAfterSelection, 'missing or denied alternatives are not silently discarded');
for (choice of [0, 3, 1.5, NaN]) await assert.rejects(() => service().legacy('Item', reference, pale), isCode('not_ready'));
choice = 1; version = '6.0.2';
await assert.rejects(() => service().legacy('Item', reference, pale), isCode('not_ready'));
version = '6.0.1'; retireDuringRoll = true;
await assert.rejects(() => service().legacy('Item', reference, pale), isCode('conflict'));
retireDuringRoll = false; retired = false;
console.log('morkborg reviewed Intuitive Power choice: PASS');

// The public SDK preserves the original row identity. The module applies the
// reviewed mapping after selection, then uses caller-bound exact document reads.
const rawDraw = await runtime.tables.draw(tableUuid, { rollOverride: 2 });
assert.equal(rawDraw.results[0].documentUuid, stale);
reads.length = 0;
const content = service();
const entries = await content.draw(tableUuid, { override: 2 });
assert.deepEqual(entries.map(e => e.kind), ['Actor', 'text']);
assert.equal(entries[0].uuid, owlUuid);
assert.equal(entries[0].document.items[0].system.damageDie, '1d4');
assert.equal(entries[1].description, 'Additional result');
assert.ok(content.dependencies.has(tableUuid) && content.dependencies.has(owlUuid));
denied = owlUuid;
await assert.rejects(() => service().draw(tableUuid, { override: 2 }), isCode('permission_denied'));
denied = undefined;
const owl = docs.get(owlUuid); docs.delete(owlUuid);
await assert.rejects(() => service().draw(tableUuid, { override: 2 }), isCode('not_ready'));
docs.set(owlUuid, owl);
docs.get(tableUuid).results[0]._id = 'different-row';
await assert.rejects(() => service().draw(tableUuid, { override: 2 }), isCode('not_ready'));
docs.get(tableUuid).results[0]._id = 'RaRYtTXoANahK7PP';
version = '6.0.2';
await assert.rejects(() => service().draw(tableUuid, { override: 2 }), isCode('not_ready'));
version = '6.0.1';
assert.deepEqual([...docs].sort(), original.sort(), 'native documents remain unchanged');
console.log('morkborg reviewed Forlorn Philosopher Owl mapping: PASS');
