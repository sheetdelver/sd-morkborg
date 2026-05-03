import { GenericSystemAdapter } from '@modules/generic/src/logic/adapter';
import { ChatCards } from '../ui/components/chat/ChatCards';
import { mbDataManager } from '../data/DataManager';
import { logger } from '@shared/utils/logger';
import { getErrorMessage } from '@server/shared/utils/getErrorMessage';
import { 
    getRollData, 
    calculateMaxSlots, 
    calculateSlotsUsed, 
    getInitiativeFormula, 
    categorizeItems, 
    normalizeItem 
} from '../logic/rules';
import { 
    MorkBorgRollType, 
    MorkBorgRollOptions 
} from '../logic/types';
import { morkborgTheme } from '../ui/themes/morkborg';

/**
 * Adapter for the Mork Borg game system.
 */

interface ClassItem {
    name: string;
    description: string;
}

export class MorkBorgAdapter extends GenericSystemAdapter {
    systemId = 'morkborg';

    getClass(actor: any): ClassItem {
        //return actor.items?.find((i: any) => i.type === 'class')?.name || 'Unknown';
        const classItem = actor.items?.find((i: any) => i.type === 'class');
        return {
            name: classItem?.name || 'Unknown',
            description: classItem?.system?.description || ''
        };
    }

    match(actor: any): boolean {
        const hasMorkborgType = ['character', 'container', 'creature', 'follower', 'misery-tracker'].includes(actor.type?.toLowerCase());
        return actor.systemId === 'morkborg' || hasMorkborgType;
    }

    normalizeActorData(actor: any, client?: any): any {
        const data = super.normalizeActorData(actor);

        if (client && data.items) {
            data.items = data.items.map((item: any) => {
                if (item.img) {
                    item.img = client.resolveUrl(item.img);
                }
                return item;
            });
        }

        return data;
    }

    getInitiativeFormula(actor: any): string {
        return getInitiativeFormula(actor);
    }



    /**
     * Compute derived actor data (HP, omens, powers, abilities, encumbrance)
     */
    computeActorData(actor: any): any {
        const system = actor.system || {};
        const abilities = system.abilities || {};
        const classData = this.getClass(actor);
        const slotsUsed = this.calculateSlotsUsed(actor.items || []);
        const maxSlots = this.calculateMaxSlots(actor);

        return {
            hp: {
                value: system.hp?.value ?? 0,
                max: system.hp?.max ?? 1
            },
            class: classData,
            currentHp: system.hp?.value ?? 0,
            maxHp: system.hp?.max ?? 1,
            omens: {
                value: system.omens?.value ?? 0,
                max: system.omens?.max ?? 0
            },
            powers: {
                value: system.powerUses?.value ?? 0,
                max: system.powerUses?.max ?? 0
            },
            abilities: {
                strength: { value: abilities.strength?.value ?? 0 },
                agility: { value: abilities.agility?.value ?? 0 },
                presence: { value: abilities.presence?.value ?? 0 },
                toughness: { value: abilities.toughness?.value ?? 0 }
            },
            slotsUsed: slotsUsed,
            maxSlots: maxSlots,
            encumbered: slotsUsed > maxSlots,
            encumbranceHelpText: 'STR+8 carried items or DR+2 on AGI/STR tests.',
            weaponCriticalHelpText: 'Critical: X2 damage, target armor reduced one tier. Fumble: Weapon breaks or is lost.',
            armorCriticalHelpText: 'Critical: Gain free attack. Fumble: Take X2 damage, armor reduced one tier.',
            shieldHelpText: '-1 damage, or break to ignore one attack.',
            equipmentHelpText: 'Items can be dragged and dropped to move them in/out of containers.',
            silver: system.silver ?? 0
        };
    }

    getActorCardData(actor: any): import('@shared/interfaces').ActorCardData {
        const charClass = this.getClass(actor).name || actor.type;
        const subtext = charClass;

        const blocks: import('@shared/interfaces').ActorCardBlock[] = [];

        if (actor.derived?.maxHp || actor.system?.hp?.max) {
            blocks.push({
                title: 'HP',
                value: actor.derived?.currentHp ?? actor.system?.hp?.value ?? '?',
                subValue: `/ ${actor.derived?.maxHp ?? actor.system?.hp?.max ?? '?'}`,
                valueClass: 'text-green-400'
            });
        }

        if (actor.derived?.omens?.max || actor.system?.omens?.max) {
            blocks.push({
                title: 'OMENS',
                value: actor.derived?.omens?.value ?? actor.system?.omens?.value ?? 0,
                subValue: `/ ${actor.derived?.omens?.max ?? actor.system?.omens?.max ?? 0}`,
                valueClass: 'text-purple-400'
            });
        }

        if (actor.derived?.powers?.max || actor.system?.powerUses?.max) {
            blocks.push({
                title: 'POWERS',
                value: actor.derived?.powers?.value ?? actor.system?.powerUses?.value ?? 0,
                subValue: `/ ${actor.derived?.powers?.max ?? actor.system?.powerUses?.max ?? 0}`,
                valueClass: 'text-purple-400'
            });
        }

        //if (actor.derived?.silver || actor.system?.silver) {
        blocks.push({
            title: 'SILVER',
            value: actor.derived?.silver ?? actor.system?.silver ?? 0, // if not available it'll be 0
            valueClass: 'text-yellow-400'
        });
        //}

        return {
            subtext,
            blocks
        };
    }

    getConfig() {
        return {
            componentStyles: morkborgTheme
        };
    }

    /**
     * Categorize items by type
     * 
      "ammo",
      "armor",
      "class",
      "container",
      "feat",
      "misc",
      "scroll",
      "shield",
      "weapon"
     */
    categorizeItems(actor: any): any {
        return categorizeItems(actor);
    }

    /**
     * Calculate slots used based on item weights
     */
    calculateSlotsUsed(items: any[]): number {
        return calculateSlotsUsed(items);
    }

    calculateMaxSlots(actor: any): number {
        return calculateMaxSlots(actor);
    }

    /**
     * Normalize item data for UI display
     */
    normalizeItem(item: any): any {
        return normalizeItem(item);
    }

    /**
     * Get roll data or pre-evaluated card content
     */
    getRollData(actor: any, type: MorkBorgRollType, key: string, options: MorkBorgRollOptions = {}): any {
        return getRollData(actor, type, key, options);
    }

    /**
     * Generate stylized HTML for an automated roll card
     */
    generateRollCard(actorData: any, results: any): string {
        const { type, subType, item, rolls, outcomes, options } = results;

        if (type === 'attack') {
            return ChatCards.attack({
                weaponTypeLabel: item?.system?.weaponType === 'ranged' ? 'Ranged' : 'Melee',
                items: item ? [item] : [],
                attackFormula: rolls.find((r: any) => r.isAttack)?.formula || '',
                attackDR: options.modifiedDR || 12,
                attackRoll: rolls.find((r: any) => r.isAttack)?.json,
                attackOutcome: outcomes[0],
                damageRoll: rolls.find((r: any) => r.isDamage)?.json,
                targetArmorRoll: rolls.find((r: any) => r.isTargetArmor)?.json,
                takeDamage: outcomes.find((o: string) => o.includes('INFLICT'))
            });
        }

        if (type === 'defend') {
            return ChatCards.defend({
                items: item ? [item] : [],
                defendFormula: rolls.find((r: any) => r.isDefend)?.formula || '',
                defendDR: options.modifiedDR || 12,
                defendRoll: rolls.find((r: any) => r.isDefend)?.json,
                defendOutcome: outcomes[0],
                attackRoll: rolls.find((r: any) => r.isAttack)?.json,
                armorRoll: rolls.find((r: any) => r.isArmor)?.json,
                takeDamage: outcomes.find((o: string) => o.includes('SUFFER'))
            });
        }

        if (type === 'ability') {
            const statName = subType?.charAt(0).toUpperCase() + subType?.slice(1) || '';
            const roll = rolls[0];
            return ChatCards.result({
                cardTitle: `Test ${statName}`,
                items: item ? [item] : [],
                drModifiers: results.drModifiers,
                rollResults: [{
                    rollTitle: roll?.formula || '',
                    roll: roll?.json,
                    outcomeLines: outcomes
                }]
            });
        }

        if (type === 'feat-roll') {
            const roll = rolls[0];
            return ChatCards.result({
                cardTitle: results.featName || results.featLabel || 'Feat',
                rollResults: [{
                    rollTitle: results.featLabel || roll?.formula || '',
                    roll: roll?.json,
                    outcomeLines: outcomes
                }]
            });
        }

        if (type === 'decoctions') {
            return ChatCards.result({
                cardTitle: 'Brew Decoctions',
                rollResults: [{
                    rollTitle: 'Doses Brewed:',
                    outcomeLines: outcomes
                }]
            });
        }

        if (type === 'getBetter') {
            return ChatCards.getBetter(results.getBetterData);
        }

        if (type === 'spendOmen') {
            return ChatCards.result({
                cardTitle: 'Spend Omen',
                rollResults: [{
                    rollTitle: 'Choose one effect:',
                    outcomeLines: outcomes
                }]
            });
        }

        if (type === 'broken') {
            return ChatCards.result({
                cardTitle: 'Broken',
                rollResults: [{
                    rollTitle: 'Roll',
                    roll: rolls[0]?.json,
                    outcomeLines: outcomes
                }]
            });
        }

        // Default / Initiative / Results
        let cardTitle = 'Test';
        if (type === 'initiative') cardTitle = subType === 'party' ? 'Party Initiative' : 'Initiative';
        else if (type === 'power') cardTitle = 'Wield a Power';

        return ChatCards.result({
            cardTitle,
            items: item ? [item] : [],
            rollResults: rolls.map((r: any) => ({
                rollTitle: r.label,
                roll: r.json,
                outcomeLines: outcomes
            }))
        });
    }

    /**
     * Perform an automated roll sequence (Attack, Defense, Initiative)
     */
    async performAutomatedSequence(client: any, actor: any, rollData: any, options: any): Promise<any> {
        const results: any = {
            type: rollData.type,
            item: actor.items?.find((i: any) => i._id === rollData.itemId || i.id === rollData.itemId),
            rolls: [],
            outcomes: [],
            options
        };

        const collectedRolls: string[] = [];

        const parseSyntheticRoll = (rollResult: any, label: string, tags: any = {}) => {
            return this.parseSyntheticRoll(rollResult, label, results.rolls, collectedRolls, tags);
        };

        const speaker = options?.speaker || {
            actor: actor._id || actor.id,
            alias: actor.name
        };

        if (rollData.type === 'decoctions') {
            return await this.createDecoctions(actor, client, options);
        }

        // Unknown feat: show the item's Foundry card
        if (rollData.type === 'feat-use-item') {
            const items: any[] = actor.items || [];
            const found = items.find((i: any) => i.name === rollData.itemName);
            const itemId = found ? (found._id || found.id) : rollData.itemName;
            return await client.useItem(actor._id || actor.id, itemId);
        }

        if (rollData.type === 'attack') {
            const isRanged = results.item?.system?.weaponType === 'ranged';
            const mod = isRanged ? (actor.system?.abilities?.presence?.value ?? 0) : (actor.system?.abilities?.strength?.value ?? 0);
            const modifiedDR = options.modifiedDR || 12;
            const hitFormula = options.manualHitDie !== undefined ? `${options.manualHitDie}${mod >= 0 ? '+' : ''}${mod}` : `1d20${mod >= 0 ? '+' : ''}${mod}`;
            const hitResult = await client.roll(hitFormula, `Attack Vs DR ${modifiedDR}`, { displayChat: false });
            const hitRoll = parseSyntheticRoll(hitResult, 'Attack', { isAttack: true });

            const d20 = hitRoll.json?.terms?.find((t: any) => t.class === 'Die' && t.faces === 20)?.results?.[0]?.result;
            const fumbleTarget = results.item?.system?.fumbleOn ?? 1;
            const critTarget = results.item?.system?.critOn ?? 20;
            const isFumble = d20 <= fumbleTarget;
            const isCrit = d20 >= critTarget;
            const isHit = hitRoll.total !== 1 && (hitRoll.total === 20 || hitRoll.total >= modifiedDR);

            if (isHit) {
                results.outcomes.push(isCrit ? 'CRITICAL SUCCESS!' : 'HIT!');
                const baseDamageFormula = isCrit ? `(${results.item?.system?.damageDie || '1d4'}) * 2` : (results.item?.system?.damageDie || '1d4');
                const damageFormula = options.manualDamageDie !== undefined ? String(options.manualDamageDie) : baseDamageFormula;
                const damageResult = await client.roll(damageFormula, 'Damage', { displayChat: false });
                const damageRoll = parseSyntheticRoll(damageResult, 'Damage', { isDamage: true });

                let totalDamage = damageRoll.total;
                const armorFormula = options.targetArmor?.trim();
                if (armorFormula && armorFormula !== '0') {
                    const armorResult = await client.roll(armorFormula, 'Target Armor', { displayChat: false });
                    const armorRoll = parseSyntheticRoll(armorResult, 'Target Armor', { isTargetArmor: true });
                    totalDamage = Math.max(totalDamage - armorRoll.total, 0);
                }
                results.outcomes.push(`INFLICT ${totalDamage} DAMAGE`);
            } else {
                results.outcomes.push(isFumble ? 'FUMBLE!' : 'MISS!');
            }
        } else if (rollData.type === 'defend') {
            const mod = actor.system?.abilities?.agility?.value ?? 0;
            const modifiedDR = options.modifiedDR || 12;
            const defendFormula = options.manualDefendDie !== undefined ? `${options.manualDefendDie}${mod >= 0 ? '+' : ''}${mod}` : `1d20${mod >= 0 ? '+' : ''}${mod}`;
            const defendResult = await client.roll(defendFormula, `Defense Vs DR ${modifiedDR}`, { displayChat: false });
            const defendRoll = parseSyntheticRoll(defendResult, 'Defense', { isDefend: true });

            const isPassed = defendRoll.total !== 1 && (defendRoll.total === 20 || defendRoll.total >= modifiedDR);

            if (isPassed) {
                results.outcomes.push('SUCCESS!');
            } else {
                results.outcomes.push('FAILED!');
                if (options.incomingAttack) {
                    const attackResult = await client.roll(options.incomingAttack, 'Incoming Attack', { displayChat: false });
                    const attackRoll = parseSyntheticRoll(attackResult, 'Incoming Attack', { isAttack: true });

                    const items = actor.items || [];
                    const equippedArmor = items.filter((i: any) => i.type === 'armor' && (i.equipped || i.system?.equipped));
                    const equippedShield = items.find((i: any) => i.type === 'shield' && (i.equipped || i.system?.equipped));

                    let armorTier = 0;
                    equippedArmor.forEach((a: any) => {
                        const t = a.system?.tier?.value ?? a.tier?.value ?? 0;
                        if (t > armorTier) armorTier = t;
                    });

                    const hasShield = !!equippedShield;

                    let activeDR = '0';
                    if (armorTier === 1) activeDR = '1d2';
                    else if (armorTier === 2) activeDR = '1d4';
                    else if (armorTier === 3) activeDR = '1d6';

                    if (hasShield) {
                        if (armorTier > 0) activeDR += '+1';
                        else activeDR = '1';
                    }

                    const armorDR = activeDR || 'd2';
                    const armorResult = await client.roll(armorDR, 'Armor DR', { displayChat: false });
                    const armorRoll = parseSyntheticRoll(armorResult, 'Armor DR', { isArmor: true });

                    const damageTaken = Math.max(attackRoll.total - armorRoll.total, 0);
                    results.outcomes.push(`SUFFER ${damageTaken} DAMAGE`);
                }
            }
        } else if (rollData.type === 'ability') {
            const key = rollData.statKey;
            const statMod = actor.system?.abilities?.[key]?.value ?? 0;
            const slotsUsed = this.calculateSlotsUsed(actor.items || []);
            const maxSlots = this.calculateMaxSlots(actor);
            const isEncumbered = slotsUsed > maxSlots;

            // In Mork Borg, encumbrance adds +2 to the DR of Agility and Strength tests.
            // But usually the "flavor" of being encumbered is shown on the card.
            if (isEncumbered && (key === 'strength' || key === 'agility')) {
                results.drModifiers = ['Encumbered: DR +2'];
            }

            const manualBase = options?.manualData?.dieResult;
            const formula = manualBase !== undefined ? `${manualBase}${statMod >= 0 ? '+' : ''}${statMod}` : `1d20${statMod >= 0 ? '+' : ''}${statMod}`;
            const label = `1d20 + ${key.toUpperCase().slice(0, 3)}`;
            const rollResult = await client.roll(formula, label, { displayChat: false });
            parseSyntheticRoll(rollResult, label, { formula: `1d20 + ${key.toUpperCase().slice(0, 3)}` });
            results.subType = key;
        } else if (rollData.type === 'feat-roll') {
            // Formula feat: roll the pre-resolved formula and render a custom result card
            const baseFormula = rollData.formula || '1d20';
            const manualBase = options?.manualData?.dieResult;
            const formula = manualBase !== undefined ? baseFormula.replace(/\d*d\d+/, manualBase.toString()) : baseFormula;

            const label = rollData.rollLabel || rollData.label || 'Feat';
            const rollResult = await client.roll(formula, label, { displayChat: false });
            parseSyntheticRoll(rollResult, label, { formula: baseFormula });
            results.subType = 'feat-roll';
            results.featLabel = label;
            results.featName = rollData.itemName || rollData.label;
        } else if (rollData.type === 'initiative') {
            if (rollData.subType === 'party') {
                const partyResult = await client.roll('1d6', 'Party Initiative', { displayChat: false });
                const partyRoll = parseSyntheticRoll(partyResult, 'Roll');
                results.subType = 'party';
                if (partyRoll.total <= 3) {
                    results.outcomes.push('NPCS GO FIRST');
                } else {
                    results.outcomes.push('PCS GO FIRST');
                }
            } else {
                const mod = actor.system?.abilities?.agility?.value ?? 0;
                const manualBase = options?.manualData?.dieResult;
                const formula = manualBase !== undefined ? `${manualBase}${mod >= 0 ? '+' : ''}${mod}` : `1d6${mod >= 0 ? '+' : ''}${mod}`;
                const initResult = await client.roll(formula, 'Initiative', { displayChat: false });
                const initRoll = parseSyntheticRoll(initResult, 'Roll');
                results.subType = 'individual';
            }
        } else if (rollData.type === 'rest') {
            const currentHp = actor.system?.hp?.value ?? 0;
            const maxHp = actor.system?.hp?.max ?? 1;
            let newHp = currentHp;
            let newPowerMax = actor.system?.powerUses?.max ?? 0;
            let newOmenData = null;
            let skipRecovery = false;

            // 1. Infection (Prioritized)
            if (options?.infected) {
                const damageRes = await client.roll('1d6', 'Infection Damage', { displayChat: false });
                const damageRoll = parseSyntheticRoll(damageRes, 'Damage');
                newHp = Math.max(0, currentHp - damageRoll.total);
                results.outcomes.push(`INFECTED! SUFFER ${damageRoll.total} DAMAGE.`);
                skipRecovery = true;
            }

            // 2. Starvation (Only if not already skipped by infection)
            if (!skipRecovery && options?.foodAndDrink === 'starve') {
                const damageRes = await client.roll('1d4', 'Starvation Damage', { displayChat: false });
                const damageRoll = parseSyntheticRoll(damageRes, 'Damage');
                newHp = Math.max(0, currentHp - damageRoll.total);
                results.outcomes.push(`STARVING! SUFFER ${damageRoll.total} DAMAGE.`);
                skipRecovery = true;
            }

            // 3. Skip Eating
            if (!skipRecovery && options?.foodAndDrink === 'donteat') {
                results.outcomes.push('SKIPPED EATING. NO RECOVERY.');
                skipRecovery = true;
            }

            // 4. Recovery
            if (!skipRecovery) {
                const restLength = options?.restLength || 'short';
                const formula = restLength === 'long' ? '1d6' : '1d4';
                const healResult = await client.roll(formula, `Rest (${restLength})`, { displayChat: false });
                const healRoll = parseSyntheticRoll(healResult, 'Heal');
                newHp = Math.min(maxHp, currentHp + healRoll.total);
                results.outcomes.push(`RECOVERED ${healRoll.total} HP.`);

                if (restLength === 'long') {
                    // Reset Powers
                    const preMod = actor.system?.abilities?.presence?.value ?? 0;
                    const powerFormula = `1d4${preMod >= 0 ? '+' : ''}${preMod}`;
                    const powerRes = await client.roll(powerFormula, 'Powers Reset', { displayChat: false });
                    const powerRoll = parseSyntheticRoll(powerRes, 'Powers');
                    newPowerMax = Math.max(0, powerRoll.total);
                    results.outcomes.push(`POWERS RESET TO ${newPowerMax}.`);

                    // Reset Omens (if 0)
                    if ((actor.system?.omens?.value ?? 0) === 0) {
                        const classItem = actor.items?.find((i: any) => i.type === 'class');
                        const omenDie = classItem?.system?.omenDie || '1d2';
                        const omenRes = await client.roll(omenDie, 'Omens Reset', { displayChat: false });
                        const omenRoll = parseSyntheticRoll(omenRes, 'Omens');
                        const newOmenMax = Math.max(0, omenRoll.total);
                        newOmenData = { value: newOmenMax, max: newOmenMax };
                        results.outcomes.push(`OMENS RESET TO ${newOmenMax}.`);
                    }
                }
            }

            // Update actor
            const updates: any = {
                _id: actor._id || actor.id,
                'system.hp.value': newHp,
                'system.powerUses.value': newPowerMax,
                'system.powerUses.max': newPowerMax
            };
            if (newOmenData) {
                updates['system.omens'] = newOmenData;
            }

            await client.dispatchDocumentSocket('Actor', 'update', {
                ids: [actor._id || actor.id],
                updates: [updates]
            });
        } else if (rollData.type === 'broken') {
            const manualBase = options?.manualData?.dieResult;
            const formula = manualBase !== undefined ? String(manualBase) : '1d4';
            const tableResult = await client.roll(formula, 'Broken', { displayChat: false });
            const tableRoll = parseSyntheticRoll(tableResult, 'Roll');
            // MB broken table is sequential, 1d4 matches index 0-3
            const entry = mbDataManager.drawFromTable('broken');
            // Actually, mbDataManager.drawFromTable picks random. 
            // For Broken, it should be the specific index.
            const allBroken = [
                "Fall unconscious for d4 rounds, awaken with d4 HP.",
                "Roll d6: 1-5 Broken Limb, 6 Eye Lost. Active after d4 rounds with d4 HP.",
                "Hemorrhage. Death in d2 hours unless treated. Tests are DR16/18.",
                "DEAD."
            ];
            results.outcomes.push(allBroken[tableRoll.total - 1] || 'Unknown Outcome');
        } else if (rollData.type === 'getBetter') {
            // 1. HP Check
            const hpCheckResult = await client.roll('6d10', 'Get Better: HP Check', { displayChat: false });
            const hpCheckRoll = parseSyntheticRoll(hpCheckResult, '6d10 vs HP');
            const currentMax = actor.system?.hp?.max ?? 1;
            let hpOutcome = `Roll ${hpCheckRoll.total} vs Max HP ${currentMax}: Failed.`;
            let newMax = currentMax;

            if (hpCheckRoll.total > currentMax) {
                const increaseResult = await client.roll('1d6', 'HP Increase', { displayChat: false });
                const increaseRoll = parseSyntheticRoll(increaseResult, 'Increase');
                newMax = currentMax + increaseRoll.total;
                hpOutcome = `Roll ${hpCheckRoll.total} vs Max HP ${currentMax}: Success! Max HP increased by ${increaseRoll.total} to ${newMax}.`;
            }

            // 2. Ability Checks (d6 according to original code)
            const abilities = ['strength', 'agility', 'presence', 'toughness'];
            const abilityOutcomes: any = {};
            const abilityUpdates: any = {};

            for (const ab of abilities) {
                const abRes = await client.roll('1d6', `Get Better: ${ab}`, { displayChat: false });
                const abRoll = parseSyntheticRoll(abRes, ab);
                const currentVal = actor.system?.abilities?.[ab]?.value ?? 0;

                if (abRoll.total === 1 || abRoll.total < currentVal) {
                    if (currentVal > -3) {
                        abilityUpdates[`system.abilities.${ab}.value`] = currentVal - 1;
                        abilityOutcomes[ab] = `${ab.charAt(0).toUpperCase() + ab.slice(1)}: Decreased to ${currentVal - 1}`;
                    } else {
                        abilityOutcomes[ab] = `${ab.charAt(0).toUpperCase() + ab.slice(1)}: No change (-3 min)`;
                    }
                } else if (abRoll.total > currentVal) {
                    if (currentVal < 6) {
                        abilityUpdates[`system.abilities.${ab}.value`] = currentVal + 1;
                        abilityOutcomes[ab] = `${ab.charAt(0).toUpperCase() + ab.slice(1)}: Increased to ${currentVal + 1}`;
                    } else {
                        abilityOutcomes[ab] = `${ab.charAt(0).toUpperCase() + ab.slice(1)}: No change (+6 max)`;
                    }
                } else {
                    abilityOutcomes[ab] = `${ab.charAt(0).toUpperCase() + ab.slice(1)}: No change (${currentVal})`;
                }
            }

            // 3. Debris (Standard MB flavor)
            const debrisResult = await client.roll('1d6', 'Debris Search', { displayChat: false });
            const debrisRoll = parseSyntheticRoll(debrisResult, 'Debris');
            let debrisOutcome = "";
            let newSilver = actor.system?.silver ?? 0;

            if (debrisRoll.total < 4) {
                debrisOutcome = "Nothing.";
            } else if (debrisRoll.total === 4) {
                const silverRes = await client.roll('3d10', 'Found Silver', { displayChat: false });
                const silverRoll = parseSyntheticRoll(silverRes, 'Silver');
                debrisOutcome = `Found ${silverRoll.total} silver.`;
                newSilver += silverRoll.total;
            } else if (debrisRoll.total === 5) {
                const scroll = mbDataManager.drawFromTable('uncleanScrolls');
                if (scroll?.isDocument) {
                    await client.createActorItem(actor._id || actor.id, scroll);
                    debrisOutcome = `Found an Unclean Scroll: ${scroll.name} — added to inventory.`;
                } else {
                    debrisOutcome = `Found an Unclean Scroll: ${scroll?.name ?? 'Unknown'}.`;
                }
            } else {
                const scroll = mbDataManager.drawFromTable('sacredScrolls');
                if (scroll?.isDocument) {
                    await client.createActorItem(actor._id || actor.id, scroll);
                    debrisOutcome = `Found a Sacred Scroll: ${scroll.name} — added to inventory.`;
                } else {
                    debrisOutcome = `Found a Sacred Scroll: ${scroll?.name ?? 'Unknown'}.`;
                }
            }

            results.getBetterData = {
                hpOutcome,
                strOutcome: abilityOutcomes.strength,
                agiOutcome: abilityOutcomes.agility,
                preOutcome: abilityOutcomes.presence,
                touOutcome: abilityOutcomes.toughness,
                debrisOutcome
            };

            // Update actor
            const updates = {
                _id: actor._id || actor.id,
                'system.hp.max': newMax,
                'system.silver': newSilver,
                ...abilityUpdates
            };
            await client.dispatchDocumentSocket('Actor', 'update', {
                ids: [actor._id || actor.id],
                updates: [updates]
            });
        } else if (rollData.type === 'spendOmen') {
            results.outcomes = [
                '• Deal maximum damage with one attack.',
                '• Reroll a die (yours or someone else\'s).',
                '• Lower a DR by 4.',
                '• DR 6 instead of 12 for a test.',
                '• Neutralize a Crit or Fumble.',
                '• Lower damage taken by d6.'
            ];
        } else if (rollData.type === 'feat') {
            const baseFormula = rollData.formula;
            if (baseFormula) {
                let resolvedFormula = this.resolveVariables(baseFormula, actor);
                const manualBase = options?.manualData?.dieResult;
                if (manualBase !== undefined) {
                    resolvedFormula = resolvedFormula.replace(/\d*d\d+/, manualBase.toString());
                }
                const featResult = await client.roll(resolvedFormula, rollData.label, { displayChat: false });
                parseSyntheticRoll(featResult, rollData.label || 'Feat Roll');
                results.outcomes.push('Feat effect triggered.');
            } else {
                results.outcomes.push('No formula defined. Macro may be required.');
            }
        } else if (rollData.type === 'power') {
            const currentUses = actor.system?.powerUses?.value ?? 0;
            const items = actor.items || [];
            const equippedArmor = items.filter((i: any) => i.type === 'armor' && (i.equipped || i.system?.equipped));
            let armorTier = 0;
            equippedArmor.forEach((a: any) => {
                const t = a.system?.tier?.value ?? a.tier?.value ?? 0;
                if (t > armorTier) armorTier = t;
            });
            const hasTwoHanded = items.some((i: any) => i.type === 'weapon' && (i.equipped || i.system?.equipped) && (i.system?.twoHanded || i.twoHanded));

            if (currentUses < 1) {
                results.outcomes.push('NO POWER USES REMAINING!');
                results.outcomes.push('Failed to wield power.');
            } else if (armorTier >= 2 || hasTwoHanded) {
                results.outcomes.push('CHOKED ON THE WORDS!');
                if (armorTier >= 2) results.outcomes.push('Scrolls never work when wearing medium or heavy armor.');
                if (hasTwoHanded) results.outcomes.push('Scrolls cannot be read while wielding martial weapons.');
                // Note: The scroll use is still consumed even if it failed mechanically due to equipping heavy items.
                const updates: any = { _id: actor._id || actor.id, 'system.powerUses.value': Math.max(0, currentUses - 1) };
                await client.dispatchDocumentSocket('Actor', 'update', { ids: [actor._id || actor.id], updates: [updates] });
            } else {
                const preMod = actor.system?.abilities?.presence?.value ?? 0;
                const manualBase = options?.manualData?.dieResult;
                const formula = manualBase !== undefined ? `${manualBase}${preMod >= 0 ? '+' : ''}${preMod}` : `1d20${preMod >= 0 ? '+' : ''}${preMod}`;
                const powerRes = await client.roll(formula, 'Power: Presence DR 12', { displayChat: false });
                const powerRoll = parseSyntheticRoll(powerRes, 'Presence');

                const d20 = powerRoll.json?.terms?.[0]?.results?.[0]?.result;
                const isFumble = d20 === 1;
                const isCrit = d20 === 20;
                const isSuccess = powerRoll.total >= 12;

                const updates: any = {
                    _id: actor._id || actor.id
                };

                if (isFumble) {
                    results.outcomes.push('FUMBLE! Arcane Catastrophe!');
                    const catastrophe = mbDataManager.drawFromTable('arcaneCatastrophes');
                    results.outcomes.push(catastrophe.name);

                    const damageRes = await client.roll('1d2', 'Catastrophe Damage', { displayChat: false });
                    const damageRoll = parseSyntheticRoll(damageRes, 'Damage');
                    results.outcomes.push(`SUFFER ${damageRoll.total} DAMAGE and power blocked for 1 hour.`);
                    const currentHp = actor.system?.hp?.value ?? 0;
                    updates['system.hp.value'] = Math.max(0, currentHp - damageRoll.total);
                } else if (isCrit || isSuccess) {
                    results.outcomes.push(isCrit ? 'CRITICAL SUCCESS!' : 'SUCCESS!');
                } else {
                    results.outcomes.push('FAILED!');
                    const damageRes = await client.roll('1d2', 'Failure Damage', { displayChat: false });
                    const damageRoll = parseSyntheticRoll(damageRes, 'Damage');
                    results.outcomes.push(`SUFFER ${damageRoll.total} DAMAGE and power blocked for 1 hour.`);
                    const currentHp = actor.system?.hp?.value ?? 0;
                    updates['system.hp.value'] = Math.max(0, currentHp - damageRoll.total);
                }

                // Consuming power use (Standard MB rule: always consume unless crit effects say otherwise, 
                // but simpler to just always consume here as per module implementation)
                const newUses = Math.max(0, currentUses - 1);
                updates['system.powerUses.value'] = newUses;

                await client.dispatchDocumentSocket('Actor', 'update', {
                    ids: [actor._id || actor.id],
                    updates: [updates]
                });
            }
        }

        const html = this.generateRollCard(actor, results);
        return await client.sendMessage({
            content: html,
            rolls: collectedRolls,
            type: 5 // Explicitly set as ROLL type
        }, { rollMode: options?.rollMode, speaker });
    }

    /**
     * Recreates the 'Create Decoctions' compendium macro.
     * Draws 2 decoctions from the 'Occult Herbmaster Decoctions' table,
     * rolls a 1d4 for doses, adds the items to the inventory, and prints a chat card.
     */
    public async createDecoctions(actor: any, client: any, options?: any) {
        const speaker = { alias: actor.name || 'Unknown Actor', actor: actor._id || actor.id };
        const results: any = { type: 'decoctions', outcomes: [] };

        // Output title
        results.outcomes.push('<b>Occult Herbmaster</b>');

        // 1. Roll 1d4 for doses
        const dosesResult = await client.roll('1d4', 'Doses Brewed', { displayChat: false });
        // We aren't adding this roll to a specific 'results.rolls' array for Decoctions, 
        // but we still want the total. Safe to pass empty arrays.
        const dosesRoll = this.parseSyntheticRoll(dosesResult, 'Doses', [], [], {});
        const doses = dosesRoll.total;
        results.outcomes.push(`Brewed <b>${doses}</b> dose(s) each of:`);

        // 2. Draw 2 unique decoctions
        const tableAlias = 'Occult Herbmaster Decoctions';
        const firstDraw = mbDataManager.drawFromTable(tableAlias);
        let secondDraw = mbDataManager.drawFromTable(tableAlias);

        // Prevent duplicate draws if possible
        let attempts = 0;
        while (secondDraw.name === firstDraw.name && attempts < 5) {
            secondDraw = mbDataManager.drawFromTable(tableAlias);
            attempts++;
        }

        const drawnItems = [firstDraw, secondDraw];
        const itemsToCreate: any[] = [];

        // 3. Process the drawn items
        for (const draw of drawnItems) {
            results.outcomes.push(`• <b>${draw.name}</b>`);
            if (draw.description) {
                // Strip paragraph tags for cleaner chat output
                const cleanDesc = draw.description.replace(/<\/?p>/g, '');
                results.outcomes.push(`  <i>${cleanDesc}</i>`);
            }

            // Prepare item data for creation 
            // We use the full item payload if found, otherwise build a generic item.
            const baseItem = mbDataManager.getItemByName(draw.name);
            if (baseItem) {
                const itemData: any = {
                    name: baseItem.name,
                    type: baseItem.type,
                    img: baseItem.img,
                    effects: [],
                    system: { ...baseItem.system }
                };
                // Set the rolled quantity
                itemData.system.quantity = doses;
                itemsToCreate.push(itemData);
            } else {
                // Fallback generic item creation if not found in items cache
                itemsToCreate.push({
                    name: draw.name,
                    type: 'misc',
                    system: {
                        description: draw.description || '',
                        quantity: doses
                    }
                });
            }
        }

        // 4. Create the items on the actor in Foundry
        if (itemsToCreate.length > 0) {
            try {
                await client.createActorItem(actor._id || actor.id, itemsToCreate);
                results.outcomes.push('<br><i>Items added to inventory.</i>');
            } catch (error: unknown) {
                logger.error("Failed to create decoction items:", getErrorMessage(error));
                results.outcomes.push('<br><i>Failed to add items to inventory.</i>');
            }
        }

        // 5. Generate and send chat card
        const html = this.generateRollCard(actor, results);
        // NOTE: sendMessage(content, userId?, options?) — pass undefined as userId so options go to the right param
        return await client.sendMessage(
            { content: html, type: 5 },
            undefined,
            { rollMode: options?.rollMode || 'blindroll', speaker }
        );
    }

    /**
     * Parse a synthetic roll response into an object the MorkBorg chat cards expect
     */
    private parseSyntheticRoll(rollResult: any, label: string, resultsRollsArray: any[], collectedRollsArray: string[], tags: any = {}) {
        if (!rollResult) return { total: 0, formula: '', dice: [] };

        const rollJsonStr = rollResult.rolls ? rollResult.rolls[0] : null;
        if (rollJsonStr) {
            collectedRollsArray.push(rollJsonStr);
        }

        if (typeof rollResult.total === 'number' && !rollResult._synthetic) return rollResult;

        try {
            const rollData = rollJsonStr ? JSON.parse(rollJsonStr) : null;
            const parsed = {
                label,
                total: rollData?.total ?? 0,
                formula: rollData?.formula ?? '',
                json: rollData,
                ...tags,
                dice: rollData?.terms ? [{
                    results: rollData.terms
                        .filter((t: any) => (t.faces === 20 || t.faces === 6 || t.faces === 4 || t.faces === 2) && t.results)
                        .flatMap((t: any) => t.results)
                }] : []
            };
            resultsRollsArray.push(parsed);
            return parsed;
        } catch (e) {
            return { total: 0, formula: '', dice: [] };
        }
    }

    /**
     * Resolve @ variables in formula using actor system data
     */
    private resolveVariables(formula: string, actor: any): string {
        if (!formula || !formula.includes('@')) return formula;

        const system = actor.system || {};
        // Replace @abilities.key.value
        let resolved = formula.replace(/@abilities\.(\w+)\.value/g, (match, key) => {
            return String(system.abilities?.[key]?.value ?? 0);
        });

        // Replace generic @system.path
        resolved = resolved.replace(/@system\.([\w.]+)/g, (match, path) => {
            const parts = path.split('.');
            let current = system;
            for (const part of parts) {
                if (current[part] === undefined) return '0';
                current = current[part];
            }
            return String(current);
        });

        return resolved;
    }
}


export { MorkBorgAdapter as Adapter };
