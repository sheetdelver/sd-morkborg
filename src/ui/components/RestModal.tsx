import React, { useState } from 'react';
import MorkBorgRollFrame from './MorkBorgRollFrame';
import type { MorkBorgRollType, MorkBorgRollOptions } from '../types';
export default function RestModal({ isOpen, onClose, onRoll }: { isOpen: boolean; onClose: () => void; onRoll: (type: MorkBorgRollType, key: string, options: MorkBorgRollOptions) => void; actor: any }) {
    const [restLength, setLength] = useState<'short' | 'long'>('short');
    const [foodAndDrink, setFood] = useState<'eat' | 'donteat' | 'starve'>('eat');
    const [infected, setInfected] = useState(false);
    if (!isOpen) return null;
    return <MorkBorgRollFrame title="Rest" onClose={onClose}>
        <section className="mb-rest-section"><label className="block font-imfell text-2xl">Rest length<select aria-label="Rest length" value={restLength} onChange={e => setLength(e.target.value as any)} className="block bg-black border border-pink-600 p-2 w-full text-base mt-2"><option value="short">Short rest</option><option value="long">Night's sleep</option></select></label></section>
        <section className="mb-rest-section"><label className="block font-imfell text-2xl">Food and drink<select aria-label="Food and drink" value={foodAndDrink} onChange={e => setFood(e.target.value as any)} className="block bg-black border border-pink-600 p-2 w-full text-base mt-2"><option value="eat">Fed</option><option value="donteat">No food or drink</option><option value="starve">Starving (after two days)</option></select></label></section>
        <section className="mb-rest-section"><label className="mb-rest-choice"><input type="checkbox" checked={infected} onChange={e => setInfected(e.target.checked)} /><span><strong>Infected</strong><small>Applies the native infection rule to a night's rest.</small></span></label></section>
        <p className="text-neutral-300 text-sm">Short rest restores no daily resources. Starvation and infection damage apply to a night's rest. A fed, uninfected night's rest also rolls daily powers and zero Omens.</p>
        <button onClick={() => { onRoll('rest', 'rest', { restLength, foodAndDrink, infected }); onClose(); }} className="mb-action-button w-full mt-6">Rest</button>
    </MorkBorgRollFrame>;
}
