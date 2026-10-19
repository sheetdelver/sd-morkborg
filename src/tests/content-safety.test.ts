import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MockSDKProvider, createMockSdkContext } from '@sheet-delver/sdk/testing';
import ItemInfoModal from '../ui/components/ItemInfoModal';

// Same native-shaped description executed its onerror handler in the G5 browser
// archive. Expected safety comes from the public SDK rich-content contract.
const item = { _id: 'owned-item', name: 'Unsafe description fixture', type: 'weapon', img: 'data:,',
    system: { description: '<p>Retained description</p><img src="data:,broken" onerror="window.__unsafe=1"><a href="javascript:window.__unsafe=2">Link</a>' } };
const source = JSON.stringify(item);
const html = renderToStaticMarkup(React.createElement(MockSDKProvider, {
    context: createMockSdkContext({ moduleId: 'morkborg' }),
}, React.createElement(ItemInfoModal, { isOpen: true, onClose() {}, item })));
assert.match(html, /Retained description/);
assert.doesNotMatch(html, /onerror|javascript:|window\.__unsafe/);
assert.match(html, /Damage: Unavailable/);
assert.equal(JSON.stringify(item), source);
console.log('morkborg safe Item presentation: PASS');
