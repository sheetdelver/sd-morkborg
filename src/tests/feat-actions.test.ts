import assert from 'node:assert/strict';
import { getRollData } from '../logic/rules';
import { executeAction } from '../server/actions';

const actor = { _id: 'a1', type: 'character', items: [
    { _id: 'passive', type: 'feat', system: { description: 'Apply manually', rollLabel: '', rollFormula: '', rollMacro: '' } },
    { _id: 'formula', type: 'feat', system: { rollLabel: 'Regenerate', rollFormula: '1d4', rollMacro: '' } },
    { _id: 'label', type: 'feat', system: { rollLabel: 'Unavailable', rollFormula: '', rollMacro: '' } },
    { _id: 'macro', type: 'feat', system: { rollLabel: 'Brew', rollFormula: '@missing', rollMacro: 'morkborg.mork-borg-macros,Create Decoctions' } },
] };
assert.equal(getRollData(actor, 'feat', 'passive'), null, 'shared passive capability has no action');
assert.equal(getRollData(actor, 'feat', 'formula')?.resolvedFormula, '1d4');
assert.throws(() => getRollData(actor, 'feat', 'label'), /no executable formula or reviewed macro/);
const plan = getRollData(actor, 'feat', 'macro');
assert.equal(plan?.type, 'feat-macro', 'macro precedes even an unavailable formula variable');
let effects = 0;
await assert.rejects(() => executeAction({ roll() { effects++; }, sendMessage() { effects++; }, updateActor() { effects++; } },
    actor, plan, {}, { isReviewedDecoctionFeat: async () => false }, () => 'unreachable'),
    (e: any) => e.code === 'validation' && /unsupported remotely/.test(e.message));
assert.equal(effects, 0, 'unsupported macros cannot fall back to formula, chat or automatic effects');
console.log('morkborg shared feat capabilities: PASS');
