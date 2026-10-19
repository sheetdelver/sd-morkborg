import assert from 'node:assert/strict';
import { NativeContent, contentHash } from '../data/NativeContent';
// Released Core queries raw stored fields, then stamps pack/uuid on catalog rows.
// Its hydrated UUID resolver returns raw source. Reproduced with actual installed
// generation in /tmp/morkborg-adr0001-installed-generation-before.log.
const first = { _id: 'one', name: 'Same name', type: 'misc', system: { quantity: 1 } };
const second = { _id: 'two', name: 'Same name', type: 'misc', system: { quantity: 2 } };
const packs = { 'native.items': first, 'other.items': second };
const before = JSON.stringify(packs);
const runtime: any = {
    access: { canReadPack: () => true },
    compendium: { async findAll(_type: string, query: Record<string, unknown>) {
        return Object.entries(packs).filter(([, row]) => Object.entries(query).every(([k, v]) => (row as any)[k] === v))
            .map(([pack, row]) => ({ ...row, pack, uuid: `Compendium.${pack}.Item.${row._id}` }));
    } },
    documents: { async fetchByUuid(uuid: string) {
        return structuredClone(Object.entries(packs).find(([pack, row]) => uuid === `Compendium.${pack}.Item.${row._id}`)?.[1] ?? null);
    } },
};
const content = new NativeContent(runtime);
const selected = await content.legacy('Item', 'native.items,Same name');
assert.equal(selected._id, 'one');
assert.equal(selected.uuid, 'Compendium.native.items.Item.one');
assert.equal(selected.system.quantity, 1);
assert.equal(content.dependencies.get(selected.uuid), contentHash(selected), 'projection dependencies must revalidate consistently');
assert.equal(JSON.stringify(packs), before, 'raw source remains unchanged');
console.log('morkborg hydrated content identity: PASS');
const { newDocument } = await import('../data/Generation');
assert.throws(() => newDocument({ _id: 'companion', name: 'Companion', type: 'follower', system: {}, items: ['unhydrated-item'] }, 'Actor.companion'), /incomplete|embedded/i);
