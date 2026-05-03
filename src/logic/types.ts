/**
 * MorkBorg Logic type definitions
 * These are environment-agnostic and can be safely shared across all segments.
 */

export type MorkBorgRollType = 
    | 'ability' 
    | 'initiative' 
    | 'dice' 
    | 'rest' 
    | 'broken' 
    | 'spendOmen' 
    | 'getBetter' 
    | 'decoctions' 
    | 'feat' 
    | 'item';

export interface BaseRollOptions {
    rollMode?: string;
    flavor?: string;
    speaker?: { actor?: string; alias?: string };
    rollType?: 'attack' | 'defend';
}

export interface RestRollOptions extends BaseRollOptions {
    restLength?: 'short' | 'long';
    foodAndDrink?: 'starve' | 'donteat' | 'eat';
    infected?: boolean;
}

export type MorkBorgRollOptions = BaseRollOptions | RestRollOptions;

/**
 * Common properties across all roll results that the UI may inspect
 */
export interface CommonRollProperties {
    label: string;
    rollLabel?: string;
    formula?: string;
    resolvedFormula?: string;
    humanFormula?: string;
    dr?: number;
    isAutomated?: boolean;
    options?: any;
    rawFormula?: string;
    damageDie?: string;
    encumbered?: boolean;
    incomingAttackDefault?: string;
}

/**
 * Discriminated union for roll data returned by getRollData
 */
export type MorkBorgRollData = 
    | ({ type: 'ability'; statKey: string; dr?: number; isAutomated: true } & CommonRollProperties)
    | ({ type: 'attack'; itemId: string; damageDie: string; encumbered: boolean; dr: number; isAutomated: true } & CommonRollProperties)
    | ({ type: 'defend'; itemId: string; encumbered: boolean; dr: number; isAutomated: true } & CommonRollProperties)
    | ({ type: 'initiative'; subType: string; isAutomated: true } & CommonRollProperties)
    | ({ type: 'power'; itemId: string; dr?: number; isAutomated: true } & CommonRollProperties)
    | ({ type: 'feat-roll'; itemId: string; itemName: string; isAutomated: false } & CommonRollProperties)
    | ({ type: 'dice'; formula: string } & CommonRollProperties)
    | ({ type: 'rest' | 'broken' | 'spendOmen' | 'getBetter' | 'decoctions'; isAutomated: true } & CommonRollProperties)
    | ({ type: 'default'; formula: string } & CommonRollProperties);
