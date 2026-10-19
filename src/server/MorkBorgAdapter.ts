import { BaseSystemAdapter, resolveImage } from '@sheet-delver/sdk';
import type {
    ActorCardData,
    ActorCardBlock,
    ActorPreparationContext,
    FoundryActor,
    PreparedActorData,
} from '@sheet-delver/sdk';
import { executeAction } from './actions';
import { prepareInventory } from '../logic/inventory';
import { ruleResult } from '../logic/worldRules';
import { ChatCards } from '../ui/components/chat/ChatCards';

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

/**
 * Adapter for the Mork Borg game system.
 */

interface ClassItem {
    name: string;
    description: string;
}

interface CardResource { value?: number | string; max?: number | string }
interface MorkBorgCardSystem {
    hp?: CardResource; omens?: CardResource; powerUses?: CardResource; silver?: unknown;
}
interface MorkBorgCardDerived {
    currentHp?: number | string; maxHp?: number | string;
    omens?: CardResource; powers?: CardResource; silver?: unknown;
}

export class MorkBorgAdapter extends BaseSystemAdapter {
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

    prepareActorData(
        actor: FoundryActor,
        context: Readonly<ActorPreparationContext>,
    ): PreparedActorData {
        if (actor.type !== 'character') return { ...structuredClone(actor), id: actor._id, img: resolveImage(actor.img ?? '', this.foundryUrl), derived: { supported: false, reason: 'This Actor type has no supported module sheet or character actions' }, categorizedItems: {} };
        const prepared = super.prepareActorData(structuredClone(actor), context);
        const carrying = ruleResult(context.world, 'trackCarryingCapacity');
        prepared.derived.rules = Object.fromEntries(['trackCarryingCapacity', 'trackAmmo', 'hitAutomation'].map(k => [`morkborg.${k}`, context.world?.settings[`morkborg.${k}`] ?? { status: 'unavailable', reason: 'not-ready' }]));
        prepared.derived.encumbered = carrying.status === 'unavailable' ? null : carrying.value === true
            && Number(prepared.derived.slotsUsed) > Number(prepared.derived.maxSlots);
        prepared.derived.ruleStatus = carrying.status;
        prepared.derived.worldContextRevision = context.world?.identity.contextRevision ?? null;
        return prepared;
    }

    normalizeActorData(actor: any): any {
        const data = super.normalizeActorData(actor);

        // Resolve embedded item images to full URLs (ADR-0027: pure projection, no client —
        // use the runtime's foundryUrl via the SDK resolveImage helper).
        if (data.items) {
            data.items = data.items.map((item: any) => {
                if (item.img) {
                    item.img = resolveImage(item.img, this.foundryUrl);
                }
                return item;
            });
        }

        return data;
    }

    getInitiativeFormula(actor: PreparedActorData): string {
        return getInitiativeFormula(actor);
    }



    /**
     * Compute derived actor data (HP, omens, powers, abilities, encumbrance)
     */
    computeActorData(actor: any): any {
        const system = actor.system || {};
        const abilities = system.abilities || {};
        const classData = this.getClass(actor);
        const inventory = prepareInventory(actor.items || []);
        const slotsUsed = inventory.slotsUsed;
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
            inventory,
            slotsUsed: slotsUsed,
            maxSlots: maxSlots,
            encumbered: null,
            encumbranceHelpText: 'STR+8 carried items or DR+2 on AGI/STR tests.',
            weaponCriticalHelpText: 'Critical: X2 damage, target armor reduced one tier. Fumble: Weapon breaks or is lost.',
            armorCriticalHelpText: 'Critical: Gain free attack. Fumble: Take X2 damage, armor reduced one tier.',
            shieldHelpText: '-1 damage, or break to ignore one attack.',
            equipmentHelpText: 'Items can be dragged and dropped to move them in/out of containers.',
            silver: system.silver ?? 0
        };
    }

    getActorCardData(actor: PreparedActorData): ActorCardData {
        if (actor.type !== 'character') return { subtext: `${actor.type} — sheet unsupported`, blocks: [] };
        // System shapes belong to the module, not the neutral SDK Actor bags.
        const system = actor.system as MorkBorgCardSystem;
        const derived = actor.derived as MorkBorgCardDerived;
        const charClass = this.getClass(actor).name || actor.type;
        const subtext = charClass;

        const blocks: ActorCardBlock[] = [];

        if (derived?.maxHp || system?.hp?.max) {
            blocks.push({
                title: 'HP',
                value: derived?.currentHp ?? system?.hp?.value ?? '?',
                subValue: `/ ${derived?.maxHp ?? system?.hp?.max ?? '?'}`,
                valueClass: 'text-green-400'
            });
        }

        if (derived?.omens?.max || system?.omens?.max) {
            blocks.push({
                title: 'OMENS',
                value: derived?.omens?.value ?? system?.omens?.value ?? 0,
                subValue: `/ ${derived?.omens?.max ?? system?.omens?.max ?? 0}`,
                valueClass: 'text-purple-400'
            });
        }

        if (derived?.powers?.max || system?.powerUses?.max) {
            blocks.push({
                title: 'POWERS',
                value: derived?.powers?.value ?? system?.powerUses?.value ?? 0,
                subValue: `/ ${derived?.powers?.max ?? system?.powerUses?.max ?? 0}`,
                valueClass: 'text-purple-400'
            });
        }

        //if (actor.derived?.silver || actor.system?.silver) {
        const silver = derived?.silver ?? system?.silver ?? 0;
        blocks.push({
            title: 'SILVER',
            value: typeof silver === 'number' || typeof silver === 'string' ? silver : 0,
            valueClass: 'text-yellow-400'
        });
        //}

        return {
            subtext,
            blocks
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
    getRollData(actor: PreparedActorData, type: MorkBorgRollType, key: string, options: MorkBorgRollOptions = {}): any {
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
        let cardTitle = ({ rest: 'Rest', rollOmens: 'Roll Omens', rollPowers: 'Daily powers', dice: 'Roll' } as Record<string, string>)[type] ?? 'Test';
        if (type === 'initiative') cardTitle = subType === 'party' ? 'Party Initiative' : 'Initiative';
        else if (type === 'power') cardTitle = 'Wield a Power';

        // Pair each roll with its OWN outcome. Multi-roll sequences (e.g. a long rest: Heal +
        // Powers + Omens) build rolls and outcomes in lockstep, so attaching the full outcomes
        // array to every roll duplicates every line. The real Mörk Borg system posts a separate
        // card per action; we keep one card but give each roll only its own outcome, with the
        // last roll absorbing any trailing outcomes so nothing is dropped.
        let rollResults: any[];
        if (rolls.length === 0) {
            rollResults = outcomes.length ? [{ rollTitle: '', outcomeLines: outcomes }] : [];
        } else if (rolls.length === 1) {
            rollResults = [{ rollTitle: rolls[0].label, roll: rolls[0].json, outcomeLines: outcomes }];
        } else {
            rollResults = rolls.map((r: any, i: number) => ({
                rollTitle: r.label,
                roll: r.json,
                outcomeLines: i === rolls.length - 1 ? outcomes.slice(i) : (outcomes[i] !== undefined ? [outcomes[i]] : []),
            }));
        }

        return ChatCards.result({
            cardTitle,
            items: item ? [item] : [],
            rollResults,
        });
    }

    /**
     * Perform an automated roll sequence (Attack, Defense, Initiative)
     */
    async performAutomatedSequence(client: any, actor: any, rollData: any, options: any, data: any): Promise<any> {
        return executeAction(client, actor, rollData, options, data, (a, r) => this.generateRollCard(a, r));
    }
}

export { MorkBorgAdapter as Adapter };
