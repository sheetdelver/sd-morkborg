import assert from 'node:assert/strict';
import { apiRoutes } from '../server/server';
import { nativeActor } from './native-alignment.test';

const params = { params: Promise.resolve({ systemId: 'morkborg', route: ['actors', 'scvm', 'roll'] }) };
let effects = 0;
const actor = nativeActor();
const runtime = {
    world: { snapshot: () => ({ identity: { contextRevision: 1 }, settings: Object.fromEntries(['trackCarryingCapacity', 'trackAmmo', 'hitAutomation'].map(k => [`morkborg.${k}`, { status: 'world', value: true }])) }), assertRevision() {} },
    documents: { async get(_type: string, _id: string, opts: any) { assert.equal(opts.minOwnership, 'owner'); return actor; } },
    compendium: { async findAll() { throw new Error('unrelated pack dependency'); } },
    rolls: { async roll(formula: string) { effects++; return { total: 14, formula,
        rolls: [JSON.stringify({ formula, total: 14, terms: [] })] }; } },
    chat: { async send() { effects++; return { _id: 'chat' }; } },
};
const call = (body: any, rt: any = runtime) => apiRoutes['actors/[id]/roll']({ json: async () => body, runtime: rt } as any, params);

assert.equal((await call({ type: 'ability', key: 'strength' })).status, 200, 'ordinary rolls do not read generator packs');
assert.equal(effects, 2);
effects = 0;
for (const body of [null, {}, { type: 'unknown', key: '' }, { type: 'ability', key: 'missing' },
    { type: 'ability', key: 'strength', options: { speaker: { actor: 'another' } } },
    { type: 'ability', key: 'strength', options: { rollMode: 'invalid' } },
    { type: 'ability', key: 'strength', options: { rollAdvantageMode: 'advantage' } },
    { type: 'ability', key: 'strength', options: { manualData: { dieResult: NaN } } },
]) assert.equal((await call(body)).status, 400);
assert.equal(effects, 0, 'invalid commands have no roll/chat side effects');
const unexpected = await call({ type: 'ability', key: 'strength' }, { documents: { get: async () => { throw new Error('secret backend detail'); } } });
assert.equal(unexpected.status, 500);
assert.doesNotMatch(JSON.stringify(await unexpected.json()), /secret backend detail/);
assert.equal((await call({ type: 'ability', key: 'strength' }, { documents: { get: async () => null } })).status, 404);
console.log('morkborg command boundaries: PASS');
