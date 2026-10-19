import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MorkBorgInitiativeModal from '../ui/components/MorkBorgInitiativeModal';
import manifest from '../../module/ui';
import { morkborgTheme as theme } from '../ui/themes/morkborg';
import { createMockSdkContext, MockSDKProvider } from '@sheet-delver/sdk/testing';

assert.equal(manifest.componentStyles, theme, 'UI manifest must own shared styles');
assert.equal(manifest.info.compatibility?.coreVersion, '>=0.19.3');
assert.equal(manifest.info.compatibility?.apiContracts?.['module-api'], '>=1.5.0 <2.0.0');
assert.equal(manifest.info.compatibility?.apiContracts?.['ui-extension-api'], '>=3.2.0 <4.0.0');
assert.deepEqual(manifest.dashboardActions?.map(action => [action.id, action.kind]), [['generator', 'tool']]);
const generatorAction = manifest.dashboardActions?.[0];
assert.equal(generatorAction?.kind === 'tool' ? generatorAction.toolId : null, 'generator');
assert.equal('dashboardTools' in manifest, false);
assert.equal(typeof manifest.componentStyles?.chat?.msgContainer, 'function');
assert.equal('diceTray' in theme, false, 'Use the Core dice tray until a Mork Borg design is authored');
assert.equal('globalChat' in theme, false, 'Use the Core frame instead of copied Shadowdark chrome');
assert.notEqual(theme.chat.rollTotal, 'hidden', 'Generic totals and private placeholders must remain visible');
assert.equal(typeof manifest.rollModal, 'function', 'HUD uses the module-owned native roll frame');
const initiative = { isOpen: true, type: 'initiative' as const, title: 'Roll Initiative',
    combatantName: 'SCVM', formula: '1d6+2', source: 'module' as const, audience: 'public' as const,
    rollAvailable: true, manualAvailable: true, advantageAvailable: false, onClose() {}, onConfirm() {} };
const render = (props: typeof initiative) => renderToStaticMarkup(createElement(MockSDKProvider,
    { context: createMockSdkContext(), children: createElement(MorkBorgInitiativeModal, props) }));
const html = render(initiative);
assert.match(html, /border-pink-900/);
assert.match(html, /1d6\+2/);
assert.match(html, /Public Roll/);
assert.match(html, /Input Manually/);
assert.doesNotMatch(html, /<select|Ability Bonus|>Advantage</);
const manual = render({ ...initiative, rollAvailable: false });
assert.match(manual, /Final initiative total/);
assert.match(manual, /step="any"/);
assert.doesNotMatch(manual, /Your Die Result|applied automatically| min=| max=/);
console.log('morkborg shared presentation: PASS');
