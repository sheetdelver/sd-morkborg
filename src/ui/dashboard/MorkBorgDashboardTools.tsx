import React, { useState } from 'react';
import MorkBorgCharacterGenerator from './MorkBorgCharacterGenerator';
import { Skull } from 'lucide-react';
import { logger } from '@shared/utils/logger';


interface MorkBorgDashboardToolsProps {
    setLoading: (loading: boolean) => void;
    setLoginMessage: (msg: string) => void;
    theme: any;
    token: string | null;
}

export default function MorkBorgDashboardTools({ setLoading, setLoginMessage, theme, token }: MorkBorgDashboardToolsProps) {

    return (
        <div className={`p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/5 shadow-lg`}>
            <h3 className="text-sm font-bold opacity-50 uppercase tracking-widest mb-3">Tools</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                    onClick={() => {
                        setLoading(true);
                        setLoginMessage('CREATING SCVM...');
                        setTimeout(() => {
                            window.location.href = '/tools/morkborg/generator';
                        }, 500);
                    }}
                    className={`px-4 py-4 rounded-lg font-bold ${theme.button} text-white shadow-xl hover:-translate-y-0.5 hover:shadow-2xl flex items-center justify-center gap-2 transition-all duration-300 w-full border border-white/10`}
                >
                    💀 SCVM FACTORY 💀
                </button>
                {/*
                <button
                    onClick={() => logger.info('TODO...')}
                    className={`px-4 py-4 rounded-lg font-bold bg-neutral-800/80 hover:bg-neutral-700/80 border border-white/10 text-white shadow-xl hover:-translate-y-0.5 hover:shadow-2xl flex items-center justify-center gap-2 transition-all duration-300 w-full`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                    </svg>
                    Import Character?
                </button>
                */}
            </div>
        </div>
    );
}
