import assert from 'node:assert/strict';
import fs from 'node:fs';
import {go,click,button,evaluate,wait,pause,key,send,errors,ws} from './cdp.mjs';
const results=[];
const check=async(name,fn)=>{try{await fn();results.push({name,status:'passed'});}catch(e){results.push({name,status:'failed',error:e.message});console.log(name,e.message);}};
try {
 await check('Factory automatically generates once and keeps the original single-page review',async()=>{
  await go();await evaluate('window.__scene("factory")');
  await wait('document.querySelector(".mb-factory-save")');
  assert.equal(await evaluate('window.__calls.filter(c=>c.path?.endsWith("/generate-character")).length'),1);
  assert.equal(await evaluate('window.__calls.filter(c=>c.path?.endsWith("/create-character")).length'),0);
  assert.deepEqual(await evaluate('[...document.querySelectorAll(".mb-factory-stat dt")].map(n=>n.textContent)'),['Name','Class','HP','Omens']);
  assert.deepEqual(await evaluate('[...document.querySelectorAll("[data-panel]")].map(n=>n.dataset.panel)'),['background','class','abilities','equipment']);
  assert.equal(await evaluate('document.querySelector(".mb-factory-save").textContent'),'💀 SAVE THIS ONE 💀');
  assert.equal(await evaluate('Boolean(document.querySelector(".mb-factory-nav"))'),false);
  assert.equal(await evaluate('document.querySelector(".mb-factory-roll img").naturalWidth>0'),true);
  await pause(150);
  assert.equal(await evaluate('window.__calls.filter(c=>c.path?.endsWith("/generate-character")).length'),1,'rendering must not regenerate');
  await click(button('Clear All'));await pause(80);
  assert.equal(await evaluate('document.querySelector("[aria-label=\\"Randomize All\\"]").disabled'),true);
  assert.equal(await evaluate('window.__calls.filter(c=>c.path?.endsWith("/generate-character")).length'),1);
  await click(button('Select All'));await click('document.querySelector("[aria-label=\\"Randomize All\\"]")');
  await wait('document.querySelector(".mb-factory-save")');
  assert.equal(await evaluate('window.__calls.filter(c=>c.path?.endsWith("/generate-character")).length'),2);
  assert.equal(await evaluate('window.__calls.filter(c=>c.path?.endsWith("/create-character")).length'),0);
  fs.writeFileSync('factory-restored.png',Buffer.from((await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true})).data,'base64'));
 });
 await check('Factory uses all seven SCVMBIRTHER color combinations',async()=>{
  // Expected colors transcribed from the reference site's theme definitions,
  // independently of the module stylesheet.
  const black='rgb(0, 0, 0)',white='rgb(255, 255, 255)',yellow='rgb(255, 232, 44)',pink='rgb(241, 66, 175)';
  const palettes={
   classic:[white,black,yellow,black,black,white,black],
   doom:[black,white,yellow,black,white,black,yellow],
   flesh:[black,white,pink,black,white,black,pink],
   pig:[pink,white,white,black,black,white,black],
   gold:[yellow,black,white,black,white,black,black],
   ink:[white,black,black,white,black,white,black],
   sarkash:[black,white,white,black,white,black,white],
  };
  await go();await evaluate('window.__scene("factory")');await wait('document.querySelector(".mb-factory-save")');
  for(const [name,expected] of Object.entries(palettes)){
   const previous=await evaluate('document.querySelector(".mb-factory").dataset.palette');
   assert.ok(previous in palettes,`unexpected palette ${previous}`);
   if(previous!==name){
    const choices=Object.keys(palettes).filter(p=>p!==previous);
    await evaluate(`Math.random=()=>${(choices.indexOf(name)+.5)/choices.length}`);
    await click('document.querySelector(\'[aria-label="Randomize All"]\')');await wait('document.querySelector(".mb-factory-save")');
   }
   assert.equal(await evaluate('document.querySelector(".mb-factory").dataset.palette'),name);
   const actual=await evaluate(`(()=>{
    const root=getComputedStyle(document.querySelector('.mb-factory'));
    const heading=getComputedStyle(document.querySelector('.mb-factory-panel h2'));
    const button=getComputedStyle(document.querySelector('.mb-factory-button'));
    const description=getComputedStyle(document.querySelector('.mb-factory-list .mb-factory-description'));
    return [root.backgroundColor,root.color,heading.backgroundColor,heading.color,button.backgroundColor,button.color,description.color];
   })()`);
   assert.deepEqual(actual,expected,name);
   assert.equal(await evaluate('getComputedStyle(document.querySelector(".mb-factory-panel")).borderTopColor'),expected[1]);
   const metrics=await send('Page.getLayoutMetrics');
   fs.writeFileSync(`factory-palette-${name}.png`,Buffer.from((await send('Page.captureScreenshot',{
    format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:metrics.cssContentSize.width,height:metrics.cssContentSize.height,scale:1}
   })).data,'base64'));
  }
 });
 await check('every new SCVM reverses all nine tilts; selection, heartbeat and confirmation stay still',async()=>{
  await go();await evaluate('window.__scene("factory")');await wait('document.querySelector(".mb-factory-save")');
  const snapshot=()=>evaluate(`({
   palette:document.querySelector('.mb-factory').dataset.palette,
   tilts:[...document.querySelectorAll('.mb-factory-stat,.mb-factory-panel,.mb-factory-save')].map(n=>{
    const matrix=new DOMMatrix(getComputedStyle(n).transform);
    return Math.round(Math.atan2(matrix.b,matrix.a)*180/Math.PI);
   })
  })`);
  let previous=await snapshot();
  assert.equal(previous.tilts.length,9);
  // Constant randomness used to choose another angle on the same side. This
  // deliberately catches that subtle failure, especially on SAVE THIS ONE.
  await evaluate('Math.random=()=>0');
  for(let i=0;i<3;i++){
   await click('document.querySelector(\'[aria-label="Randomize All"]\')');await wait('document.querySelector(".mb-factory-save")');
   const next=await snapshot();
   assert.notEqual(next.palette,previous.palette);
   assert.ok(next.tilts.every((tilt,index)=>Math.abs(tilt)>=1&&Math.abs(tilt)<=2&&Math.sign(tilt)===-Math.sign(previous.tilts[index])),'all nine tilts, including SAVE THIS ONE, must reverse direction on reroll');
   previous=next;
  }
  await click(button('Clear All'));assert.deepEqual(await snapshot(),previous);
  await click(button('Select All'));assert.deepEqual(await snapshot(),previous);
  await evaluate('window.__events.emit("connection:changed",{connected:true,worldId:"fixture"})');await pause(100);
  assert.deepEqual(await snapshot(),previous);
  await click(button('💀 SAVE THIS ONE 💀'));await wait('document.querySelector(".mb-confirm-dialog")');
  assert.deepEqual(await snapshot(),previous);await key('Escape');assert.deepEqual(await snapshot(),previous);
  assert.equal(await evaluate('window.__calls.filter(c=>c.path?.endsWith("/generate-character")).length'),4);
  assert.equal(await evaluate('window.__calls.filter(c=>c.path?.endsWith("/create-character")).length'),0);
 });
 await check('healthy Core heartbeats do not refetch classes or regenerate; actual invalidation requires reroll',async()=>{
  await go();await evaluate('window.__scene("factory")');await wait('document.querySelector(".mb-factory-save")');
  const before=await evaluate('window.__calls.filter(c=>c.path?.endsWith("/classes")||c.path?.endsWith("/generate-character")).length');
  await evaluate('for(let i=0;i<20;i++)window.__events.emit("connection:changed",{connected:true,worldId:"fixture"})');await pause(150);
  assert.equal(await evaluate('window.__calls.filter(c=>c.path?.endsWith("/classes")||c.path?.endsWith("/generate-character")).length'),before);
  await evaluate('window.__events.emit("world:contextChanged",{keys:[],revision:2})');
  await wait('document.body.textContent.includes("Roll another SCVM")');await pause(100);
  assert.equal(await evaluate('Boolean(document.querySelector(".mb-factory-save"))'),false);
  assert.equal(await evaluate('window.__calls.filter(c=>c.path?.endsWith("/generate-character")).length'),1,'content invalidation must not silently replace the character');
  await click(button('Roll another SCVM'));await wait('document.querySelector(".mb-factory-save")');
  assert.equal(await evaluate('window.__calls.filter(c=>c.path?.endsWith("/generate-character")).length'),2);
 });
 await check('healthy Core heartbeats preserve an open Item catalog without refetch or loading flicker',async()=>{
  await go();await click(button('EQUIPMENT'));await click(button('Add'));await wait('!document.body.textContent.includes("Loading current Items")');
  await evaluate('window.__catalogFrame=document.querySelector("dialog");window.__catalogRequests=window.__calls.filter(c=>c.path?.includes("/items?")).length');
  await evaluate('for(let i=0;i<20;i++)window.__events.emit("connection:changed",{connected:true,worldId:"fixture"})');await pause(150);
  assert.equal(await evaluate('window.__calls.filter(c=>c.path?.includes("/items?")).length===window.__catalogRequests'),true);
  assert.equal(await evaluate('document.querySelector("dialog")===window.__catalogFrame'),true);
  assert.equal(await evaluate('document.body.textContent.includes("Loading current Items")'),false);
  await evaluate('window.__events.emit("connection:changed",{connected:false,worldId:"fixture"})');await wait('document.body.textContent.includes("Reconnect to the world")');
  await evaluate('window.__events.emit("connection:changed",{connected:true,worldId:"fixture"})');await wait('document.querySelector("[aria-label=\\"Toggle weapon Items\\"]")');await key('Escape');
 });
 for(const connected of [true,false])await check(`pending action feedback survives healthy status only (${connected})`,async()=>{
  await go();await evaluate('window.__scene("page");window.__actionMode="delay"');
  await wait('document.querySelector(\'[aria-label="Test Strength"]\')');
  await click('document.querySelector(\'[aria-label="Test Strength"]\')');await click(button('Roll'));
  await wait('window.__pendingActions.length===1');
  await evaluate(`window.__events.emit("connection:changed",{connected:${connected},worldId:"fixture"});window.__pendingActions.shift()(new Response(JSON.stringify({success:true,label:"Strength",result:{total:17}})))`);
  await pause(150);
  assert.equal(await evaluate('window.__notices.some(n=>n[0].includes("Rolled Strength: 17"))'),connected);
 });
 for(const width of [640,768,1024,1280,1920])await check(`desktop tabs stay in one row at ${width}`,async()=>{
  await go('installed',width);
  const boxes=await evaluate(`['BACKGROUND','EQUIPMENT','VIOLENCE','SPECIAL'].map(label=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===label&&b.getBoundingClientRect().width>0)).map(b=>({x:b.getBoundingClientRect().x,y:b.offsetTop,w:b.getBoundingClientRect().width,right:b.getBoundingClientRect().right}))`);
  assert.equal(new Set(boxes.map(b=>b.y)).size,1,JSON.stringify(boxes));
  assert.ok(boxes.every(b=>b.x>=0&&b.right<=width),JSON.stringify(boxes));
 });
 await check('delayed Item catalog keeps its frame in place and scrolls the results',async()=>{
  await go();await click(button('EQUIPMENT'));await evaluate('window.__mode="delay"');await click(button('Add'));
  await wait('window.__pending.length===1');
  const before=await evaluate('document.querySelector(".mb-form-panel").getBoundingClientRect().toJSON()');
  await evaluate(`window.__pending.shift()(new Response(JSON.stringify({items:Array.from({length:80},(_,i)=>({uuid:'Compendium.fixture.items.Item.'+i,name:'Catalog Item '+i,type:'weapon',img:'data:,'}))})))`);
  await wait('!document.body.textContent.includes("Loading current Items")');await pause(100);
  const after=await evaluate('document.querySelector(".mb-form-panel").getBoundingClientRect().toJSON()');
  assert.ok(Math.abs(before.y-after.y)<5,JSON.stringify({before,after}));
  assert.ok(after.height<900,'the catalog must not expand beyond the viewport');
  if(await evaluate('Boolean(document.querySelector("[aria-label=\\"Toggle weapon Items\\"]"))'))await click('document.querySelector("[aria-label=\\"Toggle weapon Items\\"]")');
  assert.ok(await evaluate('(()=>{const n=document.querySelector(".mb-catalog-results");return n.scrollHeight>n.clientHeight&&getComputedStyle(n).overflowY==="auto"})()'));
  await key('Escape');
 });
 await check('item editor opens without late vertical jump; refresh preserves dialog and draft',async()=>{
  await go();await click(button('EQUIPMENT'));
  await evaluate(`window.__positions=[];window.__modalNodes=new Set();window.__watch=true;
   window.__modalObserver=new MutationObserver(()=>{
    const panel=document.querySelector('.mb-form-panel');if(panel)window.__modalNodes.add(panel);
   });window.__modalObserver.observe(document.body,{childList:true,subtree:true});
   const sample=()=>{const p=document.querySelector('.mb-form-panel');if(p)window.__positions.push(p.getBoundingClientRect().y);if(window.__watch)requestAnimationFrame(sample)};requestAnimationFrame(sample);`);
  await click(`document.querySelector('[aria-label="Edit Fixture Sword"]')`);await wait(button('Edit Item Description'));await pause(350);
  const measured=await evaluate('window.__watch=false;({positions:window.__positions,nodes:window.__modalNodes.size})');
  assert.equal(measured.nodes,1,'dialog remounted during opening');
  assert.ok(Math.max(...measured.positions)-Math.min(...measured.positions)<5,JSON.stringify(measured.positions));
  await click(button('Edit Item Description'));await click('document.querySelector("[contenteditable=true]")');
  await evaluate(`document.querySelector('[contenteditable=true]').focus()`);
  await key('a','KeyA',2);
  const {text}=await import('./cdp.mjs');await text('Unsaved item description');
  await evaluate('window.__patchItem("w1",{quantity:2})');await pause(100);
  assert.equal(await evaluate('window.__modalNodes.size'),1);
  assert.ok(await evaluate('document.querySelector("[contenteditable=true]").textContent.includes("Unsaved item description")'));
  await evaluate('window.__modalObserver.disconnect()');await key('Escape');
 });
} finally {fs.writeFileSync('factory-correction-results.json',JSON.stringify({results,errors},null,2));ws.close();}
console.log(`${results.filter(r=>r.status==='passed').length}/${results.length} Factory correction checks passed`);
if(results.some(r=>r.status==='failed')||errors.length)process.exitCode=1;
