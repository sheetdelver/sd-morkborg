'use client';

import React from 'react';
import RichTextEditor from '@client/ui/components/RichTextEditor';
import { morkborgTheme } from './themes/morkborg';

interface BackgroundTabProps {
    actor: any;
    onUpdate: (path: string, value: any) => void;
}

export default function BackgroundTab({ actor, onUpdate }: BackgroundTabProps) {
    return (
        <div className="h-full flex flex-col gap-6 p-1">
            <div className="text-pink-500 p-4 transform -rotate-1 shadow-lg">
                <h3 className="font-morkborg text-3xl uppercase tracking-widest text-left mb-4 pb-2 border-b-4 border-stone-800">
                    Background
                </h3>
            </div>

            <div className="bg-neutral-900/50 rounded-sm border border-stone-800 overflow-hidden relative transform rotate-1 shadow-lg mx-1 my-2">
                <RichTextEditor
                    content={actor.system?.description || actor.system?.biography || ''}
                    onSave={(html) => onUpdate('system.description', html)}
                    editButtonText="Edit Background"
                    theme={morkborgTheme.richText}
                />
            </div>
        </div>
    );
}
