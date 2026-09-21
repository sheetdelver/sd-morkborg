import assert from 'node:assert/strict';
import manifest from '../../module/ui';
import { morkborgTheme as theme } from '../ui/themes/morkborg';

assert.equal(manifest.componentStyles, theme, 'UI manifest must own shared styles');
assert.equal(manifest.info.compatibility?.apiContracts?.['ui-extension-api'], '>=1.3.0 <2.0.0');
assert.equal(typeof manifest.componentStyles?.chat?.msgContainer, 'function');
assert.equal('diceTray' in theme, false, 'Use the Core dice tray until a Mork Borg design is authored');
assert.equal('globalChat' in theme, false, 'Use the Core frame instead of copied Shadowdark chrome');
assert.notEqual(theme.chat.rollTotal, 'hidden', 'Generic totals and private placeholders must remain visible');
console.log('morkborg shared presentation: PASS');
