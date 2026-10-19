import { SdkError } from '@sheet-delver/sdk';
import { abilityValue, resolveFormula, signed, withManualDie, combatDR } from '../logic/rules';

// Pure plans are shared with the UI; only this request-bound executor performs effects.
export async function executeAction(client: any, actor: any, plan: any, options: any, data: any, card: (actor: any, results: any) => string) {
    const results: any = { type: plan.type, subType: plan.subType, item: actor.items?.find((i: any) => (i._id ?? i.id) === plan.itemId), rolls: [], outcomes: [], options: { ...options } };
    const recorded: string[] = [];
    const id = actor._id ?? actor.id;
    const speaker = { actor: id, alias: actor.name };
    const raw = options.manualData?.dieResult;
    async function roll(formula: string, label: string, tags: any = {}, manual?: unknown) {
        const evaluated = await client.roll(withManualDie(formula, manual), label, { displayChat: false });
        const json = evaluated.rolls?.[0] ? JSON.parse(evaluated.rolls[0]) : { formula: evaluated.formula, total: evaluated.total, terms: evaluated.terms };
        if (!Number.isFinite(evaluated.total ?? json.total)) throw new SdkError('not_ready', 'Dice service returned no valid result');
        const r = { label, formula, total: evaluated.total ?? json.total, json, ...tags,
            natural: manual ?? json.terms?.find((t: any) => t.faces === 20)?.results?.find((r: any) => r.active !== false)?.result };
        results.rolls.push(r);
        recorded.push(...(evaluated.rolls ?? []));
        return r;
    }
    const patch = (updates: any) => client.updateActor(id, updates);
    const resource = (key: string) => {
        const value = actor.system?.[key];
        if (!value || !Number.isFinite(value.value) || !Number.isFinite(value.max)) throw new SdkError('not_ready', `Resource ${key} is unavailable`);
        return value;
    };
    const omenClass = actor.items?.filter((i: any) => i.type === 'class').at(-1);
    const omenFormula = () => resolveFormula(omenClass?.system?.omenDie, actor, omenClass);
    const textDraw = async (key: string, override?: number) => {
        if (!data) throw new SdkError('not_ready', 'Required table service is unavailable');
        const drawn = await data.drawFromTable(key, override);
        recorded.push(...(data.takeRolls?.() ?? []));
        const entries = Array.isArray(drawn) ? drawn : [drawn];
        results.tableResults = [...(results.tableResults ?? []), ...entries.map((entry: any) => ({ tableUuid: entry.tableUuid, rowId: entry.rowId, documentUuid: entry.uuid, roll: entry.roll }))];
        if (!entries.length) throw new SdkError('not_ready', 'Table returned no results');
        return entries.map((d: any) => d.description || d.name || d.text).join('<br>');
    };
    if (plan.type === 'rest') {
        if (!['short', 'long'].includes(options.restLength) || !['eat', 'donteat', 'starve'].includes(options.foodAndDrink) || typeof options.infected !== 'boolean') throw new SdkError('validation', 'Choose rest length, food and infection');
        const hp = resource('hp');
        if (options.restLength === 'long' && options.foodAndDrink === 'eat' && !options.infected) {
            resource('powerUses'); resource('omens'); abilityValue(actor, 'presence');
            if (actor.system.omens.value === 0 && omenClass) omenFormula();
        }
        let next = hp.value;
        const updates: any = {};
        const fed = options.foodAndDrink === 'eat' && !options.infected;
        if (options.restLength === 'long') {
            if (options.foodAndDrink === 'starve') {
                const r = await roll('1d4', 'Starvation'); next -= r.total; results.outcomes.push(`SUFFER ${r.total} DAMAGE.`);
            }
            if (options.infected) {
                const r = await roll('1d6', 'Infection'); next -= r.total; results.outcomes.push(`SUFFER ${r.total} DAMAGE.`);
            }
        }
        if (fed) {
            const r = await roll(options.restLength === 'short' ? '1d4' : '1d6', 'Rest');
            next = Math.min(hp.max, next + r.total); results.outcomes.push(`RECOVER ${r.total} HP.`);
            if (options.restLength === 'long') {
                resource('powerUses'); resource('omens');
                const p = await roll(`1d4${signed(abilityValue(actor, 'presence'))}`, 'Powers per day');
                updates['system.powerUses.value'] = Math.max(0, p.total);
                updates['system.powerUses.max'] = Math.max(0, p.total);
                results.outcomes.push(`POWERS RESET TO ${Math.max(0, p.total)}.`);
                if (actor.system.omens.value === 0 && omenClass) {
                    const o = await roll(omenFormula(), 'Omens');
                    updates['system.omens.value'] = Math.max(0, o.total);
                    updates['system.omens.max'] = Math.max(0, o.total);
                    results.outcomes.push(`OMENS RESET TO ${Math.max(0, o.total)}.`);
                }
            }
        }
        if (fed || options.restLength === 'long' && (options.infected || options.foodAndDrink === 'starve')) updates['system.hp.value'] = next;
        if (Object.keys(updates).length) await patch(updates);
        else results.outcomes.push('NO EFFECT.');
    } else if (plan.type === 'getBetter') {
        const hp = resource('hp');
        const silver = actor.system.silver;
        if (!Number.isFinite(silver)) throw new SdkError('not_ready', 'Silver is unavailable');
        const abilities = ['strength', 'agility', 'presence', 'toughness'];
        abilities.forEach(k => abilityValue(actor, k));
        const h = await roll('6d10', 'HP check');
        const nextHP = h.total >= hp.max ? hp.max + (await roll('1d6', 'HP increase')).total : hp.max;
        const updates: any = { 'system.hp.max': nextHP };
        const outcomes: any = {};
        for (const key of abilities) {
            const r = await roll('1d6', key); const old = abilityValue(actor, key);
            const value = r.total === 1 || r.total < old ? Math.max(-3, old - 1) : Math.min(6, old + 1);
            updates[`system.abilities.${key}.value`] = value; outcomes[key] = `${key}: ${old} → ${value}`;
        }
        const debris = await roll('1d6', 'Debris'); let found = 'Nothing.';
        if (debris.total === 4) {
            const r = await roll('3d10', 'Silver'); updates['system.silver'] = silver + r.total; found = `${r.total} silver`;
        } else if (debris.total >= 5) found = await textDraw(debris.total === 5 ? 'uncleanScrolls' : 'sacredScrolls');
        results.getBetterData = { hpOutcome: `Max HP: ${hp.max} → ${nextHP}`, strOutcome: outcomes.strength, agiOutcome: outcomes.agility, preOutcome: outcomes.presence, touOutcome: outcomes.toughness, debrisOutcome: found };
        await patch(updates);
    } else if (plan.type === 'power') {
        const uses = resource('powerUses').value;
        if (uses < 1) throw new SdkError('validation', 'No power uses remaining');
        const r = await roll(`1d20${signed(abilityValue(actor, 'presence'))}`, 'Power: Presence DR12', {}, raw);
        const crit = r.natural === 20, fumble = r.natural === 1;
        if (crit || r.total >= 12) results.outcomes.push(crit ? 'CRITICAL SUCCESS!' : 'SUCCESS!');
        else {
            results.outcomes.push(fumble ? 'FUMBLE!' : 'FAILED!');
            const damage = await roll('1d2', 'Failure damage');
            results.outcomes.push(`SUFFER ${damage.total} DAMAGE; dizzy and unable to wield powers for one hour. Apply these effects manually.`);
        }
        if (fumble) results.outcomes.push(await textDraw('arcaneCatastrophes'));
        await patch({ 'system.powerUses.value': Math.max(0, uses - 1) });
    } else if (plan.type === 'rollPowers' || plan.type === 'rollOmens') {
        if (plan.type === 'rollOmens' && !omenClass) throw new SdkError('not_ready', 'An owned Class with an Omen die is required');
        const r = await roll(plan.type === 'rollPowers' ? `1d4${signed(abilityValue(actor, 'presence'))}` : omenFormula(), plan.label);
        const total = Math.max(0, r.total);
        const resourcePath = plan.type === 'rollPowers' ? 'system.powerUses' : 'system.omens';
        await patch({ [`${resourcePath}.max`]: total, [`${resourcePath}.value`]: total });
        results.outcomes.push(`RESET TO ${total}.`);
    } else if (plan.type === 'spendOmen') {
        const omens = resource('omens');
        if (omens.value < 1) throw new SdkError('validation', 'No Omens remaining');
        await patch({ 'system.omens.value': omens.value - 1 });
        results.outcomes.push('Spent one Omen. Select and apply its effect manually.');
    } else if (plan.type === 'broken') {
        results.outcomes.push(await textDraw('broken', raw));
    } else if (plan.type === 'feat-macro' || plan.type === 'decoctions') {
        if (plan.type !== 'decoctions' && !await data?.isReviewedDecoctionFeat?.(results.item)) throw new SdkError('validation', 'This native macro is unsupported remotely');
        // Native macro draws twice then presents one total doses roll; no inventory grant.
        results.type = 'decoctions';
        results.outcomes.push(await textDraw('occultHerbmasterDecoctions'));
        results.outcomes.push(await textDraw('occultHerbmasterDecoctions'));
        const doses = await roll('1d4', 'Doses'); results.outcomes.push(`${doses.total} doses. Allocate them manually.`);
    } else if (plan.type === 'attack' || plan.type === 'defend') {
        const dr = combatDR(options.baseDR ?? plan.dr ?? 12, plan.drModifier);
        results.options.modifiedDR = dr;
        const attack = plan.type === 'attack';
        const item = results.item;
        let ammo: any;
        if (attack && item?.system?.usesAmmo && item.system.ammoId && plan.trackAmmo) {
            ammo = actor.items.find((i: any) => (i._id ?? i.id) === item.system.ammoId && i.type === 'ammo');
            if (!ammo || !Number.isSafeInteger(ammo.system.quantity) || ammo.system.quantity < 1) throw new SdkError('not_ready', 'Selected owned ammunition is unavailable');
        }
        // Resolve all selected formula dependencies before even a successful
        // defense can bypass a missing incoming value. The SDK evaluates syntax.
        const incoming = !attack && plan.automation !== false ? resolveFormula(options.incomingAttack ?? plan.incomingAttackDefault, actor) : undefined;
        const selectedArmor = options.targetArmor ?? plan.targetArmorDefault;
        const targetArmor = attack && plan.automation !== false && selectedArmor?.trim() ? resolveFormula(selectedArmor, actor) : undefined;
        const manual = attack ? options.manualHitDie : options.manualDefendDie;
        // Validate every manual expression before evaluating any dice.
        withManualDie(plan.resolvedFormula, manual);
        if (attack) withManualDie(plan.damageDie, options.manualDamageDie);
        else if (options.manualIncomingDamage !== undefined) withManualDie(incoming ?? '', options.manualIncomingDamage);
        const r = await roll(plan.resolvedFormula, attack ? 'Attack' : 'Defense', attack ? { isAttack: true } : { isDefend: true }, manual);
        const fumble = r.natural <= (attack ? item.system.fumbleOn ?? 1 : 1);
        const crit = r.natural >= (attack ? item.system.critOn ?? 20 : 20);
        if (!Number.isFinite(r.natural)) throw new SdkError('not_ready', 'Natural d20 result is unavailable');
        if (plan.automation === false) results.outcomes.push(`Compare with DR ${dr}. Resolve ${attack ? 'hit and damage' : 'defense and damage'} manually.`);
        else {
            const pass = crit || !fumble && r.total >= dr;
            results.outcomes.push(crit ? 'CRITICAL SUCCESS!' : fumble ? 'FUMBLE!' : pass ? (attack ? 'HIT!' : 'SUCCESS!') : (attack ? 'MISS!' : 'FAILED!'));
            if (attack && pass || !attack && !pass) {
                const source = attack ? plan.damageDie : incoming;
                if (!source) throw new SdkError('validation', 'Incoming damage formula is required');
                const manualDamage = attack ? options.manualDamageDie : options.manualIncomingDamage;
                let formula = withManualDie(source, manualDamage);
                if (attack ? crit : fumble) formula = `(${formula}) * 2`;
                const damage = await roll(formula, 'Damage', attack ? { isDamage: true } : { isAttack: true });
                const reduction = attack ? targetArmor : plan.reduction;
                let amount = damage.total;
                if (reduction && reduction !== '0') {
                    const armor = await roll(reduction, 'Armor reduction', attack ? { isTargetArmor: true } : { isArmor: true });
                    amount = Math.max(0, amount - armor.total);
                }
                results.outcomes.push(`${attack ? 'INFLICT' : 'SUFFER'} ${amount} DAMAGE. Apply HP and armor effects manually.`);
            }
        }
        if (plan.automation !== false) {
            // Native dialog callbacks remember the selected base/formula, not
            // the prepared final DR. Preserve unrelated flags and validate all
            // executed dice before committing these preferences.
            const base = options.baseDR ?? plan.dr ?? 12;
            const preferences: Record<string, unknown> = attack
                ? { 'flags.morkborg.attackDR': base }
                : { 'flags.morkborg.defendDR': base, 'flags.morkborg.incomingAttack': options.incomingAttack ?? plan.incomingAttackDefault };
            if (attack && typeof selectedArmor === 'string') preferences['flags.morkborg.targetArmor'] = selectedArmor;
            await patch(preferences);
        }
        if (ammo) {
            if (ammo.system.quantity > 1) await client.updateActorItem(id, ammo._id ?? ammo.id, { 'system.quantity': ammo.system.quantity - 1 });
            else await client.deleteActorItem(id, ammo._id ?? ammo.id);
        }
    } else if (['ability', 'initiative', 'feat-roll', 'dice'].includes(plan.type)) {
        const r = await roll(plan.resolvedFormula ?? plan.formula, plan.label, {}, raw);
        if (plan.type === 'ability' && plan.drModifier) results.drModifiers = [`DR +${plan.drModifier}`];
        if (plan.type === 'feat-roll') { results.featName = plan.itemName; results.featLabel = plan.label; }
        if (plan.type === 'initiative' && plan.subType === 'party') results.outcomes.push(r.total <= 3 ? 'NPCS GO FIRST' : 'PCS GO FIRST');
    } else throw new SdkError('validation', 'Unsupported action');
    return client.sendMessage({ content: card(actor, results), speaker, ...(results.tableResults ? { flags: { morkborg: { tables: results.tableResults } } } : {}), ...(recorded.length ? { rolls: recorded } : {}) }, { rollMode: options.rollMode ?? 'publicroll', speaker });
}
