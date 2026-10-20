import assert from 'node:assert/strict';
import fs from 'node:fs';
import {go,click as rawClick,evaluate,key,send,wait,pause,errors,ws} from './cdp.mjs';

const results=[];
// Desktop and mobile navigation coexist in the DOM. Drive the visible control.
const button=label=>`[...document.querySelectorAll('button')].find(e=>e.getBoundingClientRect().width>0&&e.textContent.trim().replace(/\\s+/g,' ')===${JSON.stringify(label)})`;
const click=async selector=>{try{await rawClick(selector);}catch(error){throw Error(`${selector}: ${error.message}`);}};
const check=async(name,fn)=>{try{await fn();results.push({name,status:'passed'});}catch(error){results.push({name,status:'failed',error:error.message});console.log(name,error.message);}};
const shot=async name=>fs.writeFileSync(name+'.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
const section=async label=>{
 if(!await evaluate(`(()=>{const b=${button(label)};return b&&b.getBoundingClientRect().width>0})()`))await click(button('More'));
 if(!await evaluate(`Boolean(${button(label)})`)){
  await shot('missing-section-'+label);
  console.log(await evaluate(`JSON.stringify([...document.querySelectorAll('nav[aria-label="Character sections"] button')].map(b=>({text:b.textContent,expanded:b.getAttribute('aria-expanded'),rect:b.getBoundingClientRect().toJSON()})))`));
 }
 await click(button(label));
};
const noOverflow=async()=>{
 const overflow=await evaluate(`(()=>{const width=document.documentElement.clientWidth;if(document.documentElement.scrollWidth<=width+1 && innerWidth<=width+1)return [];
 return [...document.querySelectorAll('body *')].filter(n=>{const r=n.getBoundingClientRect();return r.width&&r.right>width+1;}).slice(-12).map(n=>({tag:n.tagName,classes:n.className,text:n.textContent.slice(0,50),right:n.getBoundingClientRect().right}));})()`);
 assert.deepEqual(overflow,[],'horizontal overflow: '+JSON.stringify(overflow));
};
try{
 for(const width of (process.env.MB_PRESENTATION_WIDTHS??'360,768,1280,1920').split(',').map(Number))for(const theme of ['light','dark']){
  await check(`factory ${width}/${theme}: paper, controls, review and recovery`,async()=>{
   await go('installed',width);await evaluate(`document.body.dataset.sdAppearance=${JSON.stringify(theme)}`);
   await evaluate(`window.__factoryClasses=Array.from({length:12},(_,n)=>({uuid:'Compendium.fixture.items.Item.class'+n,name:n?'Allowed Class '+n:'Fixture Class',description:'<p>Fixture class</p>'}));window.__scene("factory")`);await wait('document.querySelector(".mb-factory-class-options input")');await pause(100);
   await wait('document.body.textContent.includes("Generated Item")');
   assert.equal(await evaluate('getComputedStyle(document.querySelector(".mb-factory-classes")).borderTopWidth'),'4px');
   await noOverflow();await shot(`factory-classes-${width}-${theme}`);
   await click(button('Clear All'));assert.equal(await evaluate(`document.querySelector('[aria-label="Randomize All"]').disabled`),true);
   await click(button('Select All'));
   await evaluate(`Math.random=()=>${[360,768,1280,1920].indexOf(width)/4}`);
   await click(`document.querySelector('[aria-label="Randomize All"]')`);
   await wait('document.body.textContent.includes("Generated Item")');
   assert.ok(await evaluate('getComputedStyle(document.querySelector(".mb-factory-stat")).transform!=="none"'));
   assert.ok(await evaluate('document.body.textContent.includes("Generated Donkey")'));
   await click('document.querySelector(".mb-factory-list summary")');
   assert.ok(await evaluate('document.querySelector(".mb-factory-list details").open'));
   assert.ok(await evaluate('document.body.textContent.includes("Reviewed native Item instructions")'));
   await noOverflow();await shot(`factory-preview-${width}-${theme}`);
   await click(button('💀 SAVE THIS ONE 💀'));await wait('document.querySelector(".mb-confirm-dialog")');
   await key('Escape');assert.equal(await evaluate('window.__calls.filter(c=>c.path?.endsWith("/create-character")).length'),0);
  });
  await check(`sheet/rest ${width}/${theme}: texture, frame and keyboard`,async()=>{
   await go('installed',width);await evaluate(`document.body.dataset.sdAppearance=${JSON.stringify(theme)}`);
   await noOverflow();await shot(`sheet-${width}-${theme}`);
   await click(button('REST'));await wait('document.querySelector("[role=dialog]")');
   const styles=await evaluate('(()=>{const n=document.querySelector(".mb-form-panel");if(!n)return null;const s=getComputedStyle(n);return {border:s.borderTopWidth,rotate:s.transform,texture:getComputedStyle(n,"::before").backgroundImage,title:getComputedStyle(n.querySelector("h2")).fontFamily}})()');
   assert.ok(styles,'missing restored frame');assert.equal(styles.border,'4px');assert.match(styles.texture,/grunge\.png/);
   assert.equal(styles.rotate==='none',width<640);await noOverflow();await shot(`rest-${width}-${theme}`);
   await key('Escape');assert.equal(await evaluate('document.activeElement.textContent.trim()'),'REST');
   for(const label of ['VIOLENCE','EQUIPMENT','SPECIAL','BACKGROUND']){
    await section(label);await noOverflow();
    await evaluate('document.querySelector("main").scrollIntoView({block:"start"})');await pause(50);
    await shot(`tab-${label.toLowerCase()}-${width}-${theme}`);
   }
   await section('VIOLENCE');
   await click('document.querySelector(\'[aria-label="Test Strength"]\')');await wait('document.querySelector(".mb-form-panel")');
   await click(button('Manual'));await noOverflow();await shot(`roll-manual-${width}-${theme}`);await key('Escape');
   await click(button('GET BETTER'));await wait('document.querySelector(".mb-confirm-dialog")');await noOverflow();await shot(`confirmation-${width}-${theme}`);await key('Escape');
   await click(button('EDIT SCVM'));await wait('document.querySelector(".mb-form-panel")');await noOverflow();await shot(`edit-scvm-${width}-${theme}`);await key('Escape');
   await section('EQUIPMENT');
   await click(button('Add'));await wait('document.querySelector(".mb-form-panel")');await noOverflow();await shot(`catalog-${width}-${theme}`);
   await click(button('Custom Item'));await noOverflow();await shot(`custom-item-${width}-${theme}`);await key('Escape');
   await click('document.querySelector(\'button[aria-label="Edit Fixture Sword"]\')');await wait('document.querySelector(".mb-form-panel")');
   await click(button('Details'));await noOverflow();await shot(`item-details-${width}-${theme}`);
   await click(button('Description'));await noOverflow();await shot(`item-description-${width}-${theme}`);await key('Escape');
  });
 }
 await check('all sheet tabs and editor surfaces retain presentation',async()=>{
  await go();
  for(const label of ['VIOLENCE','EQUIPMENT','SPECIAL','BACKGROUND']){
   await click(button(label));await noOverflow();
   await evaluate('document.querySelector("main").scrollIntoView({block:"start"})');await pause(50);await shot('tab-'+label.toLowerCase());
  }
  await click(button('EDIT SCVM'));await wait('document.querySelector(".mb-form-panel")');await shot('edit-scvm');await key('Escape');
  await click(button('EQUIPMENT'));await click(button('Fixture Sword'));await wait('document.querySelector(".mb-form-panel")');await shot('item-info');await key('Escape');
  await click('document.querySelector(\'button[aria-label="Edit Fixture Sword"]\')');await wait('document.querySelector(".mb-form-panel")');await shot('edit-item');
  await click(button('Details'));assert.equal(await evaluate(`${button('Details')}.getAttribute("aria-pressed")`),'true');await shot('edit-item-details');await key('Escape');
 });
 assert.equal(errors.length,0,JSON.stringify(errors));
}finally{
 fs.writeFileSync('presentation-results.json',JSON.stringify({archive:process.env.MB_BROWSER_ARCHIVE_HASH,results,errors},null,2));ws.close();
}
console.log(`${results.filter(r=>r.status==='passed').length}/${results.length} presentation cases passed`);
if(results.some(r=>r.status!=='passed'))process.exitCode=1;
