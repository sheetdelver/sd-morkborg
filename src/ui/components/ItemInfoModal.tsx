import React from 'react';

import grunge from '../assets/grunge.png';
import { randomRotation } from './utils';



interface ItemInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: any;
}

export default function ItemInfoModal({ isOpen, onClose, item }: ItemInfoModalProps) {
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const memoizedRotation = React.useMemo(() => randomRotation(), []);

    if (!isOpen || !item) return null;

    return (
        <div
            className="fixed inset-0 z-[100] overflow-y-auto animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" aria-hidden="true" />
                <div
                    className={`relative w-full max-w-[500px] bg-black border-[4px] border-black shadow-[15px_15px_0_0_rgba(255,20,147,0.2)] overflow-hidden transform ${memoizedRotation} my-8`}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Grunge Texture Overlay */}
                    <div
                        className="absolute inset-0 opacity-40 pointer-events-none mix-blend-overlay"
                        style={{ backgroundImage: `url(${grunge.src})`, backgroundSize: 'cover' }}
                    />

                    {/* Title and Type Section */}
                    <div className="px-6 pt-8 pb-4 relative z-10 text-center">
                        <h2 className={`$"font-imfell" text-4xl text-white drop-shadow-lg mb-4 capitalize leading-tight uppercase tracking-widest`}>
                            {item.name}
                        </h2>

                        <div className="h-0.5 bg-neutral-700 w-full mb-4 shadow-[0_0_10px_rgba(255,20,147,0.3)]"></div>

                        <div className="font-morkborg text-2xl tracking-widest text-pink-500 uppercase opacity-90 inline-block border-2 border-pink-500/30 px-4 py-1 bg-black shadow-lg">
                            {item.type}
                        </div>
                    </div>

                    {/* Body (Description) */}
                    <div className="px-8 pb-8 pt-2 space-y-4 relative z-10 bg-black/40">
                        <div className="font-serif text-lg leading-relaxed text-neutral-300 max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-pink-900 scrollbar-track-transparent pr-2 flex flex-col items-center text-center">
                            {item.system?.description ? (
                                <div dangerouslySetInnerHTML={{ __html: item.system.description }} />
                            ) : (
                                <p className="italic text-neutral-500">No description available.</p>
                            )}
                        </div>
                    </div>

                    {/* Footer Close Button */}
                    <div className="p-4 bg-white relative z-10">
                        <button
                            onClick={onClose}
                            className="w-full bg-white hover:bg-neutral-100 text-black py-4 border-2 border-black flex items-center justify-center gap-3 shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all group"
                        >
                            <span className="text-3xl animate-pulse">✕</span>
                            <span className={`$"font-imfell" text-4xl font-bold tracking-tighter uppercase`}>Close</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
