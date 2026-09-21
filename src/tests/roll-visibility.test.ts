import { strict as assert } from 'node:assert';
import { parseRollResult } from '@sheet-delver/sdk';
import { MorkBorgAdapter } from '../server/MorkBorgAdapter';

export async function run(): Promise<void> {
    const actor = { _id: 'actor-1', name: 'Scvm', system: { abilities: {} }, items: [] };
    for (const type of ['initiative', 'decoctions']) {
        for (const rollMode of [undefined, 'publicroll', 'selfroll', 'gmroll', 'blindroll']) {
            const sends: Array<{ message: Record<string, any>; options: Record<string, unknown> }> = [];
            const recorded: string[] = [];
            let created = 0;
            let draws = 0;
            const speaker = { actor: 'actor-1', alias: 'Custom speaker' };
            const posted = { _id: 'chat-1', author: 'user-1', rolls: [] };
            const client = {
                async roll(formula: string, _label: string, options: Record<string, unknown>) {
                    assert.equal(options.displayChat, false, 'evaluate without an intermediate chat post');
                    const json = JSON.stringify({
                        class: 'Roll', formula, total: 2, evaluated: true,
                        terms: [{ class: 'Die', number: 1, faces: formula === '1d4' ? 4 : 6,
                            results: [{ result: 2, active: true }], options: {} }],
                    });
                    recorded.push(json);
                    return parseRollResult({ _synthetic: true, rolls: [json] }, formula);
                },
                async sendMessage(message: Record<string, any>, options: Record<string, unknown>) {
                    sends.push({ message, options });
                    return posted;
                },
                async createActorItem(id: string, items: any[]) {
                    assert.equal(id, actor._id);
                    assert.equal(items.length, 2);
                    assert.ok(items.every(item => item.system.quantity === 2));
                    created++;
                },
            };
            const data = {
                drawFromTable() { return { name: `Decoction ${++draws}`, description: '<p>Fixture</p>' }; },
                getItemByName() { return undefined; },
            };
            const result = await new MorkBorgAdapter().performAutomatedSequence(
                client, actor, { type, subType: 'party' }, { rollMode, speaker }, data as never,
            );
            assert.equal(result, posted, 'keep the original persisted acknowledgement');
            assert.equal(sends.length, 1, 'post exactly one final card');
            assert.deepEqual(sends[0].options, { rollMode: rollMode ?? 'publicroll', speaker });
            assert.equal(sends[0].message.speaker, speaker);
            assert.equal(sends[0].message.whisper, undefined, 'SDK resolves recipients, not the module');
            assert.equal(sends[0].message.blind, undefined, 'do not override SDK visibility');
            assert.deepEqual(sends[0].message.rolls, recorded, 'preserve original evaluated dice');
            assert.ok(sends[0].message.content.length > 0);
            assert.equal(created, type === 'decoctions' ? 1 : 0);
        }
    }
    console.log('morkborg roll visibility: PASS (normal/decoction paths, four modes and default)');
}

if (import.meta.url === `file://${process.argv[1]}`) {
    run().catch(error => { console.error(error); process.exitCode = 1; });
}
