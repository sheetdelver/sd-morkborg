import React from 'react';
import { UIModuleManifest } from '@modules/registry/types';
import info from '../info.json';

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
