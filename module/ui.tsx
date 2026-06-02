import React from 'react';
import type { ModuleInfo, UIModuleManifest } from '@sheet-delver/sdk';
import infoJson from '../info.json';

const info = infoJson as ModuleInfo;

const uiManifest: UIModuleManifest = {
    info,
    sheet: () => import('../src/ui/MorkBorgSheet'),
    actorPage: () => import('../src/ui/pages/ActorPage'),
    tools: {
        'generator': () => import('../src/ui/dashboard/MorkBorgCharacterGenerator')
    },
    dashboardTools: () => import('../src/ui/dashboard/MorkBorgDashboardTools'),
};

export default uiManifest;
