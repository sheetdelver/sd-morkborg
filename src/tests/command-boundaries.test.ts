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
// Observed through released Core 0.19.3's actual request runtime, before the
// route's first document read. Preserve its world-retirement meaning safely.
for (const [message, status] of [
    ['World context changed; refresh this action', 409],
    ['World context retired', 503],
    ['World context unavailable', 503],
] as const) {
    const retired = await call({ type: 'ability', key: 'strength' }, {
        documents: { get: async () => { throw new Error(message); } },
    });
    assert.equal(retired.status, status);
}
effects = 0;
for (const body of [
    { type: 'ability', key: 'strength', options: { manualHitDie: 1 } },
    { type: 'ability', key: 'strength', options: { targetArmor: 123 } },
    { type: 'ability', key: 'strength', options: { contextRevision: '1' } },
    { type: 'ability', key: 'strength', options: { manualData: [] } },
]) assert.equal((await call(body)).status, 400);
assert.equal(effects, 0, 'malformed or irrelevant manual controls cannot silently roll');
const missingIncoming = await call({ type: 'defend', key: '', options: { incomingAttack: '@missing' } });
assert.equal(missingIncoming.status, 503);
assert.equal(effects, 0, 'incoming dependencies validate before defense dice, even on success');
console.log('morkborg command boundaries: PASS');
