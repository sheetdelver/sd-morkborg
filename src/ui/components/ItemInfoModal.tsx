import React from 'react';
import { processHtmlContent } from '@sheet-delver/sdk';
import { useSDK } from '@sheet-delver/sdk/react';
import MorkBorgRollFrame from './MorkBorgRollFrame';
export default function ItemInfoModal({ isOpen, onClose, item }: { isOpen: boolean; onClose: () => void; item: any }) {
    const { foundryUrl, resolveImageUrl } = useSDK();
    if (!isOpen || !item) return null;
    return <MorkBorgRollFrame title={item.name} subtitle={item.type} onClose={onClose} wide>
        <img src={resolveImageUrl(item.img ?? '')} alt="" className="w-20 h-20 object-contain mb-4" />
        <div className="text-neutral-200 leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: processHtmlContent(item.system?.description ?? item.description ?? '', foundryUrl) }} />
        {item.type === 'weapon' && <p className="text-pink-400 mt-4">Damage: {item.damageDie || 'Unavailable'}; handed: {item.handed ?? 'Unavailable'}</p>}
        {item.totalCarryWeight !== undefined && <p className="text-neutral-300 mt-3">Carry weight: {item.totalCarryWeight}; container space used: {item.totalContainerSpace ?? 'Unavailable'}</p>}
        <button onClick={onClose} className="bg-pink-700 text-white p-3 mt-6 w-full">Close</button>
    </MorkBorgRollFrame>;
}
