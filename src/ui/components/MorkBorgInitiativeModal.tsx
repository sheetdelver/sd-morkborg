import React, { useState, useEffect } from 'react';
import MorkBorgRollModal, { parseFormula } from './MorkBorgRollModal';
import { type MorkBorgRollConfig } from '../types';
import { getInitiativeFormula } from '../../logic/rules';

export default function MorkBorgInitiativeModal(props: any) {
    const { isOpen, title, onClose, onConfirm, actor } = props;

    // We store roll mode inside the wrapper to mimic the default behavior
    const [rollMode, setRollMode] = useState<string>('publicroll');

    useEffect(() => {
        if (isOpen) {
            const saved = localStorage.getItem('sheetdelver_roll_mode');
            if (saved) setRollMode(saved);
        }
    }, [isOpen]);

    const handleRollModeChange = (mode: string) => {
        setRollMode(mode);
        localStorage.setItem('sheetdelver_roll_mode', mode);
    };

    if (!isOpen) return null;

    // Use the shared pure logic to get the standardized formula from the actor
    const rawFormula = actor ? getInitiativeFormula(actor) : '1d6';
    const parsed = parseFormula(rawFormula);

    const config: MorkBorgRollConfig = {
        title: title || 'Initiative',
        rollLabel: 'Roll Initiative',
        formula: rawFormula,
        humanFormula: rawFormula,
        type: 'ability',
        key: 'initiative'
    };

    const handleConfirmWithOptions = (opts: any) => {
        onConfirm({
            abilityBonus: parsed.modifier,
            advantageMode: opts.advantageMode,
            rollingMode: rollMode
        });
    };

    const handleManualConfirm = (result: string) => {
        onConfirm({
            abilityBonus: parsed.modifier,
            rollingMode: rollMode,
            manualValue: Number(result)
        });
    };

    return (
        <MorkBorgRollModal
            config={config}
            rollMode={rollMode}
            onRollModeChange={handleRollModeChange}
            onConfirm={() => handleConfirmWithOptions({ advantageMode: 'normal' })}
            onConfirmWithOptions={handleConfirmWithOptions}
            onManualConfirm={handleManualConfirm}
            onClose={onClose}
        />
    );
}
