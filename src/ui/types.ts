/**
 * MorkBorg UI type definitions
 */
import React from 'react';
import { 
    MorkBorgRollType, 
    MorkBorgRollOptions, 
    MorkBorgRollData 
} from '../logic/types';

export { 
    type MorkBorgRollType, 
    type MorkBorgRollOptions, 
    type MorkBorgRollData 
};

export interface MorkBorgRollConfig {
    title: string;
    rollLabel: string;
    formula: string;          // resolved formula e.g. "1d20+4"
    humanFormula: string;     // human-readable e.g. "1d20 + 4 (Strength)"
    dr?: number;              // optional default DR
    type: string;
    key: string;
    options?: MorkBorgRollOptions;
    rollData?: MorkBorgRollData;
    // Attack/defend specific
    rollType?: 'attack' | 'defend';
    damageDie?: string;       // e.g. "1d6" for weapon damage
    encumbered?: boolean;
    incomingAttackDefault?: string;
}

export interface MorkBorgConfirmConfig {
    title: string;
    body: string | string[];   // paragraph(s) of description text
    confirmLabel?: string;     // defaults to "Confirm"
    confirmIcon?: React.ReactNode;
    dangerous?: boolean;       // red confirm button instead of pink
}

export interface AutoAttackOptions {
    baseDR: number;
    modifiedDR: number;
    targetArmor: string;
    incomingAttack: string;
}
