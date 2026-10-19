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
await check('actions','R03 open Violence details follows current owned description and damage',async()=>{
 await setup('VIOLENCE');await click(button('Fixture Sword'));await wait('document.querySelector("[role=dialog]")');await evaluate('window.__patchItem("w1",{description:"<p>AUTHORITATIVE_REVISED</p>",damageDie:"1d10+2"})');await pause(80);
 assert.ok(await evaluate('document.querySelector("[role=dialog]").textContent.includes("AUTHORITATIVE_REVISED")'),'details must follow authoritative source');assert.ok(await evaluate('document.querySelector("[role=dialog]").textContent.includes("1d10+2")'));await key('Escape');assert.equal(await evaluate('document.activeElement.textContent.trim()'),'Fixture Sword');
});
for(const [name,mutation]of [['deletion','window.__removeItem("w1")'],['unequip','window.__patchItem("w1",{equipped:false})'],['Actor replacement','window.__actorId("a2")'],['ownership loss','window.__nativeOwner(2)']])await check('actions',`R03 Violence ${name} retires modal and frees keyboard/focus`,async()=>{
 await setup('VIOLENCE',360);await click(button('Fixture Sword'));await wait('document.querySelector("dialog[open]")');await evaluate(mutation);await pause(120);assert.equal(await evaluate('Boolean(document.querySelector("dialog[open]"))'),false,'out-of-scope details must retire');assert.equal(await evaluate('document.body.style.overflow'),'');assert.equal(await evaluate('document.getElementById("root").inert'),false);await key('Tab');assert.ok(await evaluate('document.activeElement.matches("button,input,select,a[href]") && !document.activeElement.matches(":disabled") && !document.activeElement.closest("dialog")'));
 if(name==='unequip'){await evaluate('window.__patchItem("w1",{equipped:true})');await pause(60);assert.equal(await evaluate('Boolean(document.querySelector("dialog[open]"))'),false,'retired selection must not reopen');}
});
await check('actions','R03 Equipment details and Special editor still refresh current Item',async()=>{
 await setup();await click(button('Fixture Sword'));await evaluate('window.__patchItem("w1",{description:"EQUIPMENT_REVISED"})');await wait('document.querySelector("[role=dialog]").textContent.includes("EQUIPMENT_REVISED")');await key('Escape');await click(button('SPECIAL'));
 await click(`${button('Passive Feat')}.closest('.group').querySelector('[title="Edit Item"]')`);await click(button('Description'));await evaluate('window.__patchItem("f1",{description:"SPECIAL_REVISED"})');await wait('document.querySelector("[role=dialog]").textContent.includes("SPECIAL_REVISED")');await key('Escape');
});
await check('actions','R04 passive details accessible without executable no-op; formula and macro retain shared capability',async()=>{
 await setup('SPECIAL');const passive=`${button('Passive Feat')}.closest('.group')`;assert.equal(await evaluate(`[...${passive}.querySelectorAll('button')].some(b=>b.textContent.trim()==='Use'&&!b.matches(':disabled'))`),false,'passive feat must not offer an executable Use');
 await click(button('Passive Feat'));await wait('document.querySelector("[role=dialog]").textContent.includes("Passive instructions")');await key('Escape');assert.equal(await evaluate('document.activeElement.textContent.trim()'),'Passive Feat');
 await click(button('Roll formula'));await wait('document.querySelector("[role=dialog]")');assert.ok(await evaluate('document.querySelector("[role=dialog]").textContent.includes("1d4")'));await click(button('Roll'));assert.ok(await evaluate('window.__calls.some(c=>c.type==="feat"&&c.key==="f2")'));
 await click(button('Create decoctions'));await pause(80);assert.equal(await evaluate('Boolean(document.querySelector("[role=dialog]"))'),false,'macro takes precedence over invalid formula');assert.ok(await evaluate('window.__calls.some(c=>c.type==="feat"&&c.key==="f3")'));
 await click(button('Try unsupported macro'));assert.ok(await evaluate('window.__calls.some(c=>c.type==="feat"&&c.key==="f4")'),'server validates macros; UI must not run them locally');
});
fs.writeFileSync('browser-results.json',JSON.stringify({package:process.env.MB_BROWSER_ARCHIVE_HASH,scope:'Compiled archive UI in released-Core component fixture; actual pointer/keyboard input; no native connection',gate,results,errors},null,2));console.log(JSON.stringify(results,null,2));ws.close();if(results.some(r=>r.status==='failed')||errors.length)process.exitCode=1;
