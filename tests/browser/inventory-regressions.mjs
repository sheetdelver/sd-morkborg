import assert from 'node:assert/strict';
import fs from 'node:fs';
import {go,click,button,evaluate,key,text,wait,pause,errors,ws} from './cdp.mjs';
const results=[];
const gate=process.env.MB_REVIEW_GATE??'all';
async function check(group,name,fn){if(gate!=='all'&&gate!==group)return;try{await fn();results.push({name,status:'passed'})}catch(e){results.push({name,status:'failed',error:e.message,diagnostic:await evaluate('({active:document.activeElement?.outerHTML,calls:window.__calls,dialog:document.querySelector("[role=dialog]")?.textContent})')});console.log(name,e.message)}}
const q=s=>`document.querySelector(${JSON.stringify(s)})`;
const row=name=>`[...document.querySelectorAll('[draggable=true]')].find(e=>e.querySelector('button')?.textContent.trim()===${JSON.stringify(name)})`;
const within=(root,selector)=>`${root}?.querySelector(${JSON.stringify(selector)})`;
async function setup(tab='EQUIPMENT',width=1280){await go('installed',width);await evaluate('window.__reviewSetup()');await click(button(tab));}
await check('inventory','R01 shield equip/unequip/re-equip, replacement, source preservation and Observer control',async()=>{
 await setup();const original=await evaluate('window.__raw().items.filter(i=>i.type==="shield")');
 assert.ok(await evaluate(`Boolean(${within(row('Review Shield'),'button[title="Equip"]')})`),'shield must expose Equip');
 for(const title of ['Equip','Unequip','Equip']){await click(within(row('Review Shield'),`button[title="${title}"]`));assert.equal(await evaluate('window.__raw().items.find(i=>i._id==="s1").system.equipped'),title==='Equip');assert.equal(await evaluate('window.__raw().items.find(i=>i._id==="s2").system.equipped'),false);assert.equal(await evaluate('window.__projection.derived.inventory.reduction'),title==='Equip'?'0+1':'0');}
 const current=await evaluate('window.__raw().items.filter(i=>i.type==="shield")');for(let n=0;n<2;n++)assert.deepEqual({...current[n],system:{...current[n].system,equipped:original[n].system.equipped}},original[n]);
 await evaluate('window.__nativeOwner(2)');await pause(60);assert.equal(await evaluate(`${within(row('Review Shield'),'button[title="Unequip"]')}.matches(':disabled')`),true);
 const count=await evaluate('window.__calls.length');await click(within(row('Review Shield'),'button[title="Unequip"]'));assert.equal(await evaluate('window.__calls.length'),count);
});
await check('inventory','R02 browse ammo exact selection and single inventory representation',async()=>{
 await setup();await click(button('Add'));await wait(q('[aria-label="Search Items"]'));
 const request=await evaluate('window.__calls.find(c=>c.path?.includes("/items?")).path');assert.ok(new URL(request,'http://fixture').searchParams.get('types').split(',').includes('ammo'),'catalog must request ammo');
 await click(button('Template Arrows ammo'));await wait('!document.querySelector("[role=dialog]")');assert.deepEqual(await evaluate('window.__calls.find(c=>c.create).create'),{sourceUuid:'Compendium.fixture.items.Item.ammo'});
 assert.equal(await evaluate(`[...document.querySelectorAll('[draggable=true]')].filter(e=>e.querySelector('button')?.textContent.trim().startsWith('Template Arrows')).length`),1);
 await click(q('[aria-label="Edit Fixture Sword"]'));await click(button('Details'));await click(q('[aria-label="Uses Ammo"]'));assert.ok(await evaluate(`[...document.querySelectorAll('select option')].some(o=>o.textContent.includes('Template Arrows'))`));await key('Escape');
});
await check('inventory','R02 custom ammo, keyboard submission, denial and valid-empty catalog',async()=>{
 await setup();await click(button('Add'));await click(button('Custom Item'));const options=await evaluate(`[...document.querySelector('[aria-label="Custom Item type"]').options].map(o=>o.value)`);assert.ok(options.includes('ammo'),'custom types must include ammo');
 await click(q('[aria-label="Custom Item name"]'));await text('Custom Arrows');await key('Tab');assert.equal(await evaluate('document.activeElement.value'),'ammo');await key('ArrowDown');await key('ArrowUp');await key('Enter');await key('Tab');assert.equal(await evaluate('document.activeElement.textContent'),'Create custom Item');assert.equal(await evaluate('document.activeElement.disabled'),false);await key(' ','Space');await wait('!document.querySelector("[role=dialog]")');
 assert.deepEqual(await evaluate('window.__calls.find(c=>c.create).create'),{name:'Custom Arrows',type:'ammo',system:{},effects:[],flags:{}});
 await evaluate('window.__mode="denied"');await click(button('Add'));await wait('document.body.innerText.includes("Fixture access denied")');assert.equal(await evaluate('document.body.innerText.includes("Template Arrows ammo")'),false);await evaluate('window.__mode="empty"');await click(button('Retry Items'));await wait('document.body.innerText.includes("No matching Items")');await key('Escape');
});
fs.writeFileSync('browser-results.json',JSON.stringify({package:process.env.MB_BROWSER_ARCHIVE_HASH,scope:'Compiled archive UI in released-Core component fixture; actual pointer/keyboard input; no native connection',gate,results,errors},null,2));console.log(JSON.stringify(results,null,2));ws.close();if(results.some(r=>r.status==='failed')||errors.length)process.exitCode=1;
