import { useEffect, useRef, useState } from 'react';
import { useBottomNavigation } from '@sheet-delver/sdk/react';

interface Section { id: string; label: string }

/** Module-owned appearance; Core owns the clearance above this footer. */
export function MobileSectionNavigation({ sections, activeId, onSelect }: {
    sections: Section[]; activeId: string; onSelect: (id: string) => void;
}) {
    const barRef = useRef<HTMLElement>(null);
    const moreRef = useRef<HTMLButtonElement>(null);
    const [moreOpen, setMoreOpen] = useState(false);
    useBottomNavigation(barRef);
    const active = sections.find(section => section.id === activeId) ?? sections[0];
    const remaining = sections.filter(section => section.id !== active.id);
    const visible = [active, remaining[0]].filter(Boolean);
    const overflow = remaining.slice(1);

    const select = (id: string) => {
        onSelect(id);
        setMoreOpen(false);
        requestAnimationFrame(() => barRef.current?.querySelector<HTMLButtonElement>('[aria-current="page"]')?.focus());
    };
    useEffect(() => {
        const outside = (event: PointerEvent) => {
            if (!barRef.current?.contains(event.target as Node)) setMoreOpen(false);
        };
        document.addEventListener('pointerdown', outside);
        return () => document.removeEventListener('pointerdown', outside);
    }, []);

    return <nav ref={barRef} aria-label="Character sections"
        className="fixed sm:hidden bottom-0 left-0 right-0 z-50 bg-neutral-950 border-t-2 border-pink-600 shadow-[0_-8px_24px_rgba(0,0,0,0.8)] px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
        onKeyDown={event => {
            if (event.key === 'Escape' && moreOpen) {
                event.preventDefault(); event.stopPropagation(); setMoreOpen(false);
                moreRef.current?.focus();
            }
        }}>
        {moreOpen && <div id="morkborg-section-overflow" className="grid grid-cols-2 gap-2 pb-3 mb-2 border-b border-pink-600">
            {overflow.map(section => <button key={section.id} type="button" onClick={() => select(section.id)}
                className="block min-h-11 w-full px-3 py-2 text-left text-neutral-200 font-mono text-xs font-bold uppercase hover:bg-pink-600 hover:text-white">
                {section.label}
            </button>)}
        </div>}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
            {visible.map(section => <button key={section.id} type="button" onClick={() => select(section.id)}
                aria-current={section.id === active.id ? 'page' : undefined}
                className={`min-w-0 min-h-11 px-2 py-2 border-2 font-mono text-[11px] font-bold tracking-wider uppercase shadow-[3px_3px_0_0_#000] ${section.id === active.id
                    ? 'bg-pink-600 text-white border-pink-400' : 'bg-black text-neutral-300 border-neutral-700'}`}>
                {section.label}
            </button>)}
            <button ref={moreRef} type="button" aria-expanded={moreOpen} aria-controls="morkborg-section-overflow" onClick={() => setMoreOpen(open => !open)}
                className="min-h-11 flex items-center justify-center px-3 py-2 border-2 border-neutral-700 bg-black text-neutral-200 text-xs font-bold uppercase">More</button>
        </div>
    </nav>;
}
