import type { ModuleInfo, UIModuleManifest } from '@sheet-delver/sdk';
import { morkborgTheme } from '../src/ui/themes/morkborg';
import infoJson from '../info.json';

const info = infoJson as ModuleInfo;

const uiManifest: UIModuleManifest = {
    info,
    stylesheet: 'assets/presentation.css',
    componentStyles: morkborgTheme,
    sheet: () => import('../src/ui/MorkBorgSheet'),
    actorPage: () => import('../src/ui/pages/ActorPage'),
    rollModal: () => import('../src/ui/components/MorkBorgInitiativeModal'),
    tools: {
        'generator': () => import('../src/ui/dashboard/MorkBorgCharacterGenerator')
    },
    dashboardActions: [
        { id: 'generator', label: 'SCVM Factory', kind: 'tool', toolId: 'generator' },
    ],
};

export default uiManifest;
