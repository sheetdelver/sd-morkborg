import tablesData from './packs/morkborg.mork-borg-tables.json';
import itemsData from './packs/morkborg.mork-borg-items.json';
import { logger } from '@shared/utils/logger';

export class MorkBorgDataManager {
    private static instance: MorkBorgDataManager;
    private tablesCache: any[] | null = null;
    private itemsCache: any[] | null = null;

    private constructor() {
        this.loadData();
    }

    public static getInstance(): MorkBorgDataManager {
        if (!MorkBorgDataManager.instance) {
            MorkBorgDataManager.instance = new MorkBorgDataManager();
        }
        return MorkBorgDataManager.instance;
    }

    private loadData() {
        try {
            this.tablesCache = tablesData as any[];
            this.itemsCache = itemsData as any[];
        } catch (error) {
            logger.error('Failed to load Mork Borg compendium data:', error);
            this.tablesCache = [];
            this.itemsCache = [];
        }
    }

    public getItemByName(name: string): any {
        if (!this.itemsCache) return null;
        return this.itemsCache.find(i => i.name === name);
    }

    public getItemById(id: string): any {
        if (!this.itemsCache) return null;
        return this.itemsCache.find(i => i._id === id);
    }

    public getItemsByType(types: string[]): any[] {
        if (!this.itemsCache) return [];
        return this.itemsCache.filter(i => types.includes(i.type));
    }

    private resolveTableName(alias: string): string {
        const mappings: Record<string, string> = {
            'badBirth': 'Bad Birth',
            'nameYourGod1': 'Name your god... (1)',
            'nameYourGod2': 'Name your god... (2)',
            'nameYourGod3': 'Name your god... (3)',
            'sacredScrolls': 'Sacred Scrolls',
            'thingsWereGoingSoWellUntil': 'Things were going so well until',
            'arcaneCatastrophes': 'Arcane Catastrophes - To Leave Cube-Violet',
            'occultHerbmasterDecoctions': 'Occult Herbmaster Decoctions',
            'uncleanScrolls': 'Unclean Scrolls',
            'startingEquipment1': 'Starting Equipment (1)',
            'startingEquipment2': 'Starting Equipment (2)',
            'startingEquipment3': 'Starting Equipment (3)',
            'startingArmor': 'Starting Armor',
            'wretchedRoyaltyItems': 'Wretched Royalty Items',
            'creatureShapes': 'Creature Shapes',
            'forlornPhilosopherItems': 'Forlorn Philosopher Items',
            'theRootsOfYourDejection': 'The Roots of your Dejection',
            'accursedInstruments': 'Accursed Instruments',
            'paleOneBlessings': 'Pale One blessings',
            'probablyRaisedIn': 'Probably raised in',
            'startingEquipment1AllItems': 'Starting Equipment (1) All Items',
            'eldritchOrigins': 'Eldritch Origins',
            'terriblerTraits': 'Terribler Traits',
            'badderHabits': 'Badder Habits',
            'theDejectionOfYourRoots': 'The dejection of your Roots',
            'brokenerBodies': 'Brokener Bodies',
            'unholyOrigins': 'Unholy origins',
            'brokenLimbOrEye': 'Broken - Limb or Eye',
            'arcaneCatastrophesGeneric': 'Arcane Catastrophes',
            'esotericHermitItems': 'Esoteric Hermit Items',
            'aDealWasStruck': 'A deal was struck',
            'theTabletsOfOchreObscurity': 'The Tablets of Ochre Obscurity',
            'earliestMemories': 'Earliest Memories',
            'unspokenOrigins': 'Unspoken origins',
            'youCallYourself1': 'You call yourself... (1)',
            'youCallYourself2': 'You call yourself... (2)',
            'youCallYourself3': 'You call yourself... (3)',
            'fangedDeserterItems': 'Fanged Deserter Items',
            'broken': 'Broken',
            'hereticalPriestItems': 'Heretical Priest Items',
            'startingWeapon': 'Starting Weapon',
            'giftsFromYourDeadGod': 'Gifts From Your Dead God',
            'firstDied': 'First Died',
            'characterNames': 'Character Names',
            'allScrolls': 'All Scrolls',
            'specialities': 'Specialities'
        };
        return mappings[alias] || alias;
    }

    public drawFromTable(tableAlias: string): any {
        if (!this.tablesCache) return { name: "Unknown", description: "Data unavailable." };

        const targetName = this.resolveTableName(tableAlias);
        const table = this.tablesCache.find(t => t.name === targetName);

        if (!table || !table.results || table.results.length === 0) {
            return { name: "Unknown", description: "Table not found or empty." };
        }

        // Simulate rolling on the table formula
        const formula = table.formula || "1d10"; // Fallback to a common die
        const formulaMax = parseInt(formula.split('d')[1] || formula, 10) || table.results.length;

        // Random number 1..formulaMax
        const rollResult = Math.floor(Math.random() * formulaMax) + 1;

        // Find the result matching the drawn range
        let drawnEntry = table.results.find((r: any) => rollResult >= r.range[0] && rollResult <= r.range[1]);

        // Fallback to highest entry if we somehow exceeded range
        if (!drawnEntry) {
            drawnEntry = table.results[table.results.length - 1];
        }

        // It might be a document reference (weapon/item) or pure text
        if (drawnEntry.type === "document") {
            // Look it up locally so we get full data
            const internalItem = this.getItemByName(drawnEntry.name);
            if (internalItem) {
                return { ...internalItem, isDocument: true };
            }
            return { name: drawnEntry.name, description: "Unknown Document." };
        }

        // Text result
        return {
            name: drawnEntry.name || drawnEntry.description || "Unknown",
            description: drawnEntry.name ? drawnEntry.description : ""
        };
    }

    private rollFormula(formula: string): number {
        if (!formula) return 0;

        // Handle kh/kl or complex formulae simply if possible, but for Mork Borg it's usually basic
        // e.g., "3d6", "1d4", "2d6 * 10", "4d6kh3"

        let processedFormula = formula.toLowerCase().replace(/\s/g, '');

        // Special case for classless stat generation: 4d6kh3 (keep highest 3)
        if (processedFormula === '4d6kh3') {
            const rolls = [
                Math.floor(Math.random() * 6) + 1,
                Math.floor(Math.random() * 6) + 1,
                Math.floor(Math.random() * 6) + 1,
                Math.floor(Math.random() * 6) + 1
            ];
            rolls.sort((a, b) => b - a); // descending
            return rolls[0] + rolls[1] + rolls[2];
        }

        // Handle basic multiplication like "2d6*10"
        let multiplier = 1;
        if (processedFormula.includes('*')) {
            const parts = processedFormula.split('*');
            processedFormula = parts[0];
            multiplier = parseInt(parts[1], 10) || 1;
        }

        // Basic XdY+Z
        const match = processedFormula.match(/^(\d*)d(\d+)([\+\-]\d+)?$/);
        if (!match) {
            // Might be a flat number
            const flat = parseInt(processedFormula, 10);
            return isNaN(flat) ? 0 : flat * multiplier;
        }

        const count = parseInt(match[1], 10) || 1;
        const sides = parseInt(match[2], 10);
        const mod = match[3] ? parseInt(match[3], 10) : 0;

        let total = 0;
        for (let i = 0; i < count; i++) {
            total += Math.floor(Math.random() * sides) + 1;
        }

        return (total + mod) * multiplier;
    }

    private getAbilityBonus(rollTotal: number): number {
        if (rollTotal <= 4) return -3;
        if (rollTotal <= 6) return -2;
        if (rollTotal <= 8) return -1;
        if (rollTotal <= 12) return 0;
        if (rollTotal <= 14) return 1;
        if (rollTotal <= 16) return 2;
        return 3;
    }

    public generateRandomCharacter(classInclusion: Record<string, boolean>, previousClassId?: string) {
        if (!this.itemsCache) return null;

        // 1. Class Selection
        const allClasses = this.getItemsByType(['class']);

        // Apply classInclusion filters
        // Identify all allowed classes from the map where the value is true
        let allowedClasses = allClasses.filter((c: any) => classInclusion[c._id]);

        // Safety Fallback: If the user unchecked literally everything, draw from ALL available classes anyway
        if (allowedClasses.length === 0) {
            allowedClasses = allClasses;
        }

        // Exclude the previously rolled class to prevent back-to-back duplicates,
        // but ONLY if there are other options available in the allowed pool.
        if (previousClassId && allowedClasses.length > 1) {
            const filteredClasses = allowedClasses.filter((c: any) => c._id !== previousClassId);
            if (filteredClasses.length > 0) {
                allowedClasses = filteredClasses;
            }
        }

        // Select a random class from the allowed pool
        const selectedClass: any = allowedClasses[Math.floor(Math.random() * allowedClasses.length)];

        const isClassless = !selectedClass || selectedClass.name === 'Adventurer';

        // 2. Base Stats & Abilities
        const name = this.drawFromTable('characterNames').name;

        const startingSilverFormula = selectedClass?.system?.startingSilver || '2d6*10';
        const silver = this.rollFormula(startingSilverFormula);

        const omenDie = selectedClass?.system?.omenDie || '1d2';
        const omensMax = this.rollFormula(omenDie);

        const hpDie = selectedClass?.system?.startingHitPoints || '1d8';
        const baseHp = this.rollFormula(hpDie);

        const basePowerUses = this.rollFormula('1d4');

        // Abilities
        let abilityRollFormulas = ['3d6', '3d6', '3d6', '3d6']; // Default

        if (isClassless) {
            // Mork borg classless roll 3d6 twice, 4d6kh3 twice, mixed randomly
            const pool = ['3d6', '3d6', '4d6kh3', '4d6kh3'];
            abilityRollFormulas = pool.sort(() => 0.5 - Math.random());
        } else {
            abilityRollFormulas = [
                selectedClass.system.startingStrength || '3d6',
                selectedClass.system.startingAgility || '3d6',
                selectedClass.system.startingPresence || '3d6',
                selectedClass.system.startingToughness || '3d6'
            ];
        }

        const strengthTotal = this.rollFormula(abilityRollFormulas[0]);
        const agilityTotal = this.rollFormula(abilityRollFormulas[1]);
        const presenceTotal = this.rollFormula(abilityRollFormulas[2]);
        const toughnessTotal = this.rollFormula(abilityRollFormulas[3]);

        const strBonus = this.getAbilityBonus(strengthTotal);
        const agiBonus = this.getAbilityBonus(agilityTotal);
        const preBonus = this.getAbilityBonus(presenceTotal);
        const touBonus = this.getAbilityBonus(toughnessTotal);

        const maxHp = Math.max(1, baseHp + touBonus);
        const powerUsesMax = Math.max(0, basePowerUses + preBonus);

        const abilities = {
            strength: { value: strBonus },
            agility: { value: agiBonus },
            presence: { value: preBonus },
            toughness: { value: touBonus }
        };

        const hp = {
            value: maxHp,
            max: maxHp
        };

        const equipment = [];
        // Add waterskin and food
        const food = this.getItemByName('Dried food');
        if (food) {
            equipment.push({ ...food, system: { ...food.system, quantity: this.rollFormula('1d4') } });
        }
        const water = this.getItemByName('Waterskin');
        if (water) equipment.push(water);

        // Standard 3 tables
        const eq1 = this.drawFromTable('startingEquipment1');
        if (eq1.isDocument) equipment.push(eq1);

        const eq2 = this.drawFromTable('startingEquipment2');
        if (eq2.isDocument) equipment.push(eq2);

        const eq3 = this.drawFromTable('startingEquipment3');
        if (eq3.isDocument) equipment.push(eq3);

        const hasScroll = equipment.some(i => i.type === 'scroll' || i.type === 'tablet');

        // Weapon
        let weaponDie = selectedClass?.system?.weaponTableDie || '1d10';
        if (hasScroll && ['1d8', '2d4', '1d10'].includes(weaponDie)) {
            weaponDie = '1d6';
        }
        // TODO: Need a way to roll on weapon table *with a specific formula* instead of default
        // For now just draw one
        const weapon = this.drawFromTable('startingWeapon');
        if (weapon.isDocument) equipment.push(weapon);

        // Armor
        let armorDie = selectedClass?.system?.armorTableDie || '1d4';
        if (hasScroll && ['1d3', '1d4'].includes(armorDie)) {
            armorDie = '1d2';
        }
        const armor = this.drawFromTable('startingArmor');
        if (armor.isDocument) equipment.push(armor);

        let classNotes = '';
        const rollResults: Record<string, string[]> = {};

        if (selectedClass?.system?.startingItems) {
            const lines = selectedClass.system.startingItems.split("\n");
            for (const line of lines) {
                const parts = line.split(",");
                const itemName = parts[1]?.trim();
                const item = this.getItemByName(itemName || '');
                if (item) equipment.push(item);
            }
        }

        if (selectedClass?.system?.startingRolls) {
            const lines = selectedClass.system.startingRolls.split("\n");
            for (const line of lines) {
                const parts = line.split(",");
                const tableName = parts[1]?.trim();
                const rolls = parts[2] ? parseInt(parts[2].trim()) : 1;

                if (tableName) {
                    if (!rollResults[tableName]) rollResults[tableName] = [];
                    for (let i = 0; i < rolls; i++) {
                        const result = this.drawFromTable(tableName);
                        if (result.isDocument) {
                            equipment.push(result);
                        } else {
                            rollResults[tableName].push(result.description || result.name);
                        }
                    }
                }
            }
        }

        const className = selectedClass?.name;
        const getRoll = (table: string) => rollResults[table]?.join(', ');

        if (className === "Wretched Royalty") {
            const reason = getRoll("Things were going so well until");
            if (reason) classNotes += `Things were going so well until: ${reason}\n`;
        } else if (className === "Fanged Deserter") {
            const memory = getRoll("Earliest Memories");
            if (memory) classNotes += `Earliest Memories: ${memory}\n`;
        } else if (className === "Occult Herbmaster") {
            const origin = getRoll("Probably raised in");
            if (origin) classNotes += `Probably raised in: ${origin}\n`;
        } else if (className === "Heretical Priest") {
            const origin = getRoll("Unholy origins");
            if (origin) classNotes += `Unholy origin: ${origin}\n`;
        } else if (className === "Dead God's Prophet") {
            const god1 = getRoll("Name your god... (1)");
            const god2 = getRoll("Name your god... (2)");
            const god3 = getRoll("Name your god... (3)");
            if (god1 || god2 || god3) classNotes += `God's name: ${god1 || ''} ${god2 || ''} ${god3 || ''}\n`;
        } else if (className === "Forlorn Philosopher") {
            const root1 = getRoll("The Roots of your Dejection");
            const root2 = getRoll("The dejection of your Roots");
            if (root1 || root2) classNotes += `The roots of your dejection: ${root1 || ''}, ${root2 || ''}\n`;
            const tablet = getRoll("The Tablets of Ochre Obscurity");
            if (tablet) classNotes += `The tablets of Ochre Obscurity: ${tablet}\n`;
        } else if (className === "Cursed Chordsman") {
            const deal = getRoll("A deal was struck");
            if (deal) classNotes += `Deal was struck: ${deal}\n`;
            const instrument = getRoll("Accursed Instruments");
            if (instrument) classNotes += `Accursed instrument: ${instrument}\n`;
        } else if (className === "Skinwalker") {
            const origin = getRoll("First Died");
            if (origin) classNotes += `First died: ${origin}\n`;
            const shapes = getRoll("Creature Shapes");
            if (shapes) classNotes += `Creature shapes: ${shapes}\n`;
        } else if (className === "Night-Terrior") {
            const origin = getRoll("Bad Birth");
            if (origin) classNotes += `Bad birth: ${origin}\n`;
            const specialities = getRoll("Specialities");
            if (specialities) classNotes += `Speciality: ${specialities}\n`;
        } else if (className === "Esoteric Hermit") {
            const origin = getRoll("Eldritch Origins");
            if (origin) classNotes += `Eldritch origin: ${origin}\n`;
        } else if (className === "Pale One") {
            const name1 = getRoll("You call yourself... (1)");
            const name2 = getRoll("You call yourself... (2)");
            const name3 = getRoll("You call yourself... (3)");
            if (name1 || name2 || name3) classNotes += `You call yourself: ${name1 || ''} ${name2 || ''} ${name3 || ''}\n`;
            const origin = getRoll("Unspoken origins");
            if (origin) classNotes += `Unspoken origin: ${origin}\n`;
            const blessing = getRoll("Pale One blessings");
            if (blessing) classNotes += `Pale One's blessing: ${blessing}\n`;
        } else {
            // Fallback for custom classes
            for (const [tableName, results] of Object.entries(rollResults)) {
                classNotes += `${tableName}: ${results.join(', ')}\n`;
            }
        }


        let traits = '';
        const trait1 = this.drawFromTable('terriblerTraits');
        const trait2 = this.drawFromTable('terriblerTraits');
        const broken = this.drawFromTable('brokenerBodies');
        const habit = this.drawFromTable('badderHabits');

        if (trait1.name && trait2.name) {
            traits += `${trait1.name} and ${trait2.name.charAt(0).toLowerCase() + trait2.name.slice(1)}. `;
        }
        if (broken.name) traits += `${broken.name} `;
        if (habit.name) traits += `${habit.name}`;



        const character = {
            name,
            hp,
            class: selectedClass,
            currentHp: hp.value,
            maxHp: hp.max,
            silver,
            omens: {
                value: omensMax,
                max: omensMax
            },
            powers: {
                value: powerUsesMax,
                max: powerUsesMax
            },
            abilities,
            items: [selectedClass, ...equipment],
            traits: traits.trim(),
            classNotes: classNotes.trim()
        };

        return character;
    }
}

export const mbDataManager = MorkBorgDataManager.getInstance();
