'use client';
import React, { useState } from 'react';
import { manualDieSpec, combatDR } from '../../logic/rules';
import MorkBorgRollFrame, { RollEntryMode } from './MorkBorgRollFrame';
import type { MorkBorgRollConfig } from '../types';

interface Props {
    config: MorkBorgRollConfig; rollMode: string; onRollModeChange: (mode: string) => void;
    onConfirm: () => void; onConfirmWithOptions: (options: any) => void;
    onManualConfirm: (result: any) => void; onClose: () => void;
}
export default function MorkBorgRollModal({ config, rollMode, onRollModeChange, onConfirmWithOptions, onManualConfirm, onClose }: Props) {
    const [manual, setManual] = useState(false);
    const [baseDR, setBaseDR] = useState(config.rollData?.dr ?? 12);
    const [armor, setArmor] = useState((config.rollData as any)?.targetArmorDefault ?? '0');
    const [incoming, setIncoming] = useState(config.rollData?.incomingAttackDefault ?? '1d4'); // Shared native plan default.
    const [raw, setRaw] = useState('');
    const [damage, setDamage] = useState('');
    const plan: any = config.rollData;
    const attack = plan?.type === 'attack', defend = plan?.type === 'defend';
    const combat = attack || defend;
    const spec = manualDieSpec(config.formula);
    const damageSpec = manualDieSpec(attack ? config.damageDie ?? '' : incoming);
    const canManual = !!spec && (!combat || !!damageSpec) && plan?.automation !== false;
    const valid = (text: string, faces?: number) => text.trim() !== '' && Number.isInteger(Number(text)) && Number(text) >= 1 && Number(text) <= (faces ?? 0);
    const validManual = valid(raw, spec?.faces) && (!combat || valid(damage, damageSpec?.faces));
    const submit = () => {
        const common = { baseDR, targetArmor: armor, incomingAttack: incoming };
        if (!manual) return onConfirmWithOptions(common);
        if (attack) onManualConfirm({ ...common, attackDie: Number(raw), damageDie: Number(damage) });
        else if (defend) onManualConfirm({ ...common, defendDie: Number(raw), manualIncomingDamage: Number(damage) });
        else onManualConfirm(Number(raw));
    };
    const field = (label: string, value: string, set: (value: string) => void, numeric = false, max?: number) => (
        <label className="block text-neutral-200 font-mono text-sm my-4">{label}
            <input aria-label={label} type={numeric ? 'number' : 'text'} value={value} min={numeric ? 1 : undefined} max={max}
                onChange={e => set(e.target.value)} className="block w-full bg-neutral-900 border border-pink-700 px-3 py-2 mt-1 text-white" />
        </label>
    );
    return <MorkBorgRollFrame title={config.title} subtitle={config.rollLabel} onClose={onClose}>
        {canManual ? <RollEntryMode manual={manual} onChange={value => { setManual(value); setRaw(''); setDamage(''); }} />
            : <p className="text-neutral-300">Auto evaluation is required for this formula or action.</p>}
        <p className="font-mono text-pink-400 my-4">{config.humanFormula || config.formula}</p>
        {combat && <>
            <label className="block text-neutral-200">Base DR
                <input aria-label="Base DR" type="number" value={baseDR} onChange={e => setBaseDR(Number(e.target.value))} className="bg-black border border-pink-600 ml-3 w-20 p-2" />
            </label>
            <p className="text-yellow-400">DR modifier: +{plan.drModifier}. Final DR: {Number.isSafeInteger(baseDR) ? combatDR(baseDR, plan.drModifier) : 'Unavailable'}</p>
            {plan.automation === false && <p className="text-neutral-300">Automation is disabled. Compare the roll manually; use Roll damage for a follow-up weapon roll.</p>}
            {attack ? field('Target armor formula', armor, setArmor) : field('Incoming damage formula', incoming, setIncoming)}
        </>}
        {manual && <>
            {field(`Raw die (1–${spec?.faces})`, raw, setRaw, true, spec?.faces)}
            {combat && field(`Raw damage die (1–${damageSpec?.faces}); used only when damage applies`, damage, setDamage, true, damageSpec?.faces)}
            <p className="text-neutral-300 text-sm">Enter raw dice. Modifiers and critical multiplication apply during execution.</p>
        </>}
        <label className="block text-neutral-200 my-4">Visibility
            <select aria-label="Roll visibility" value={rollMode} onChange={e => onRollModeChange(e.target.value)} className="block bg-neutral-900 border border-pink-800 p-2 mt-1 w-full">
                {['publicroll', 'gmroll', 'blindroll', 'selfroll'].map(mode => <option key={mode} value={mode}>{mode}</option>)}
            </select>
        </label>
        <div className="flex gap-3 mt-6">
            <button disabled={manual && !validManual || !Number.isInteger(baseDR)} onClick={submit} className="flex-1 bg-pink-600 text-black font-bold p-3 disabled:opacity-40">{manual ? 'Use raw dice' : 'Roll'}</button>
            <button onClick={onClose} className="border border-neutral-600 text-white p-3">Cancel</button>
        </div>
    </MorkBorgRollFrame>;
}
