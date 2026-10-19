// Isolated test-only host internals: copied by run.mjs into a fresh released-Core archive.
import assert from 'node:assert/strict';import fs from 'node:fs';
import {initDataDir} from '../../src/server/core/paths';
const data = process.env.SHEET_DELVER_DATA!;
initDataDir(data);
import {initializeRegistry,getAdapter,getServerModule,listModules,enableModule} from '../../src/modules/registry/server';
import {actorStore} from '../../src/server/core/documents/primary/actors/ActorStore';
import {userStore} from '../../src/server/core/documents/primary/users/UserStore';
import {settingStore} from '../../src/server/core/documents/primary/settings/SettingStore';
import {worldStateStore} from '../../src/server/core/world/WorldStateStore';
import {compendiumStore} from '../../src/server/core/compendium/CompendiumStore';
import {moduleWorldContext as world} from '../../src/server/services/world/ModuleWorldContextService';
import {createModuleRuntime} from '../../src/server/shared/utils/createModuleRuntime';
import {createModuleRequestRuntime} from '../../src/server/shared/utils/moduleDocumentServices';
import {DocumentResolver} from '../../src/server/services/documents';
import {Roll} from '../../src/server/core/foundry/Roll';
import {SdkError} from '@sheet-delver/sdk';
initializeRegistry();assert.ok(enableModule('morkborg'));const inventory=listModules({includeDisabled:true});const module=inventory.find(m=>m.info.id==='morkborg')!;assert.ok(module?.managed);assert.ok(module.enabled);assert.equal(module.info.version,'0.8.3');
const adapter=await getAdapter('morkborg');assert.equal(adapter?.systemId,'morkborg');const server=await getServerModule('morkborg');assert.ok(server?.apiRoutes);
const info=JSON.parse(fs.readFileSync('data/modules/morkborg/info.json','utf8'));
const actor:any={_id:'a1',name:'Isolated source',type:'character',ownership:{default:0,owner:3,observer:2},system:{hp:{value:5,max:10},omens:{value:1,max:2},powerUses:{value:1,max:4},silver:0,abilities:Object.fromEntries(['strength','agility','presence','toughness'].map(k=>[k,{value:2}]))},items:[{_id:'w1',name:'Heavy weapon',type:'weapon',system:{quantity:20,carried:true,carryWeight:1,containerSpace:1,damageDie:'1d6',weaponType:'melee'}}]};
await actorStore.seed(async()=>[actor]);await userStore.seed(async()=>[{_id:'owner',role:1,name:'Owner'},{_id:'observer',role:1,name:'Observer'},{_id:'hidden',role:1,name:'Hidden'},{_id:'gm',role:4,name:'GM'}] as any);
await settingStore.seed(async()=>[]);worldStateStore.seed({release:{generation:14},system:{id:'morkborg',version:process.env.MB_SYSTEM_VERSION??'6.0.0'},world:{id:'fixture'}} as any);
const pack='morkborg.mork-borg-items';compendiumStore.setPackMetadata(pack,{id:pack,type:'Item',packageType:'system',ownership:{PLAYER:'OBSERVER'}} as any);await compendiumStore.setPackRows('morkborg',pack,[{_id:'i1',name:'Visible template',type:'misc',system:{}}]);
world.configure('http://127.0.0.1:1',{worldId:'fixture',systemId:'morkborg',systemVersion:process.env.MB_SYSTEM_VERSION??'6.0.0',foundryGeneration:14,foundryBuild:'fixture',runtimeEpoch:1},info.worldSettings);
const base=await createModuleRuntime('morkborg');const effects:any[]=[];let connected=true;let evaluateDice=false;let forlornTotal=6;let creationCount=0;let allocatedIds=0;let denySecond=false;let beforeRoll:undefined|(()=>Promise<void>);const resolver=new DocumentResolver({allowLiveCompendiumUuidFallback:false});
function runtime(userId='owner'){return createModuleRequestRuntime(base,{userId,fetchByUuid:async(uuid:string)=>resolver.fetchByUuid(uuid),roll:async(formula:string,label:string)=>{effects.push({roll:formula});await beforeRoll?.();if(evaluateDice){if(label==='Forlorn Philosopher Items')return {formula,total:forlornTotal};return (await new Roll(formula).evaluate()).toJSON();}return {formula,total:14,terms:[{class:'Die',faces:20,results:[{result:12,active:true}]}]};},createChatMessage:async(message:any)=>{effects.push({message});return {_id:'chat',...message}},dispatchDocument:async(type:string,action:string,operation:any,parent?:{type:string,id:string})=>{effects.push({type,action,operation,parent});if(type==='Item'){assert.equal(parent?.type,'Actor');const current:any=structuredClone(actorStore.get(parent!.id));assert.ok(current);let result:any[]=[];if(action==='create'){const created={...operation.data[0],_id:operation.data[0]._id??(++allocatedIds).toString(16).padStart(16,'0')};current.items.push(created);result=[created]}else if(action==='delete')current.items=current.items.filter((i:any)=>!operation.ids.includes(i._id));else if(action==='update'){const update=operation.updates[0],item=current.items.find((i:any)=>i._id===update._id);assert.ok(item);for(const[path,value]of Object.entries(update)){if(path==='_id')continue;const parts=path.split('.');let node=item;for(const key of parts.slice(0,-1))node=node[key]??={};node[parts.at(-1)!]=value}result=[item]}await actorStore.seed(async()=>actorStore.list().map(a=>a._id===current._id?current:a));return {result}}if(type==='Actor'&&action==='update'){
 const update=operation.updates[0],current=structuredClone(actorStore.get(update._id));assert.ok(current);
 const merge=(target:any,patch:any)=>{for(const[path,value]of Object.entries(patch)){if(path==='_id')continue;const parts=path.split('.');let node=target;for(const key of parts.slice(0,-1))node=node[key]??={};const key=parts.at(-1)!;if(value&&typeof value==='object'&&!Array.isArray(value))merge(node[key]??={},value);else node[key]=value}};
 merge(current,update);await actorStore.seed(async()=>actorStore.list().map(a=>a._id===current._id?current:a));return {result:[current]}
 }if(type==='Actor'&&action==='create'){creationCount++;if(denySecond&&creationCount===2)throw new SdkError('permission_denied','Fixture second create denied');const created={...operation.data[0],_id:(++allocatedIds).toString(16).padStart(16,'0')};await actorStore.seed(async()=>[...actorStore.list(),created]);return {result:[created]}}return {result:[]}}} as any,async()=>{if(!connected)throw new SdkError('not_ready','Isolated disconnect')})}
const params={params:Promise.resolve({systemId:'morkborg',route:['actors','a1','roll']})};
const call=(rt:any,options:any={})=>server.apiRoutes['actors/[id]/roll']({runtime:rt,json:async()=>({type:'ability',key:'strength',options})},params);
const results:any[]=[];async function test(name:string,fn:()=>unknown){try{await fn();results.push({name,status:'passed'})}catch(e){results.push({name,status:'failed',error:String(e)})}}
await test('production registry loads archive only',()=>{assert.equal(module.directory,data + '/modules/morkborg');assert.equal(fs.existsSync('data/local/modules/morkborg'),false)});
await test('registered default and source preservation',()=>{const snapshot=JSON.stringify(actorStore.get('a1'));const prepared=adapter!.prepareActorData(actorStore.get('a1') as any,{world:world.snapshot()} as any);assert.equal(prepared.derived.encumbered,true);assert.equal(world.snapshot().settings['morkborg.trackAmmo'].status,'registered-default');assert.equal(JSON.stringify(actorStore.get('a1')),snapshot);assert.equal('morkborg.allowedScvmClasses' in world.project(1).settings,false)});
await test('unverified native patch remains unavailable before effects',async()=>{
 const identity=world.snapshot().identity;
 try{
  world.configure('http://127.0.0.1:1',{...identity,systemVersion:'6.0.2'},info.worldSettings);
  assert.equal(world.snapshot().settings['morkborg.trackAmmo'].status,'unavailable');
  effects.length=0;assert.equal((await call(runtime())).status,503);assert.equal(effects.length,0);
 }finally{world.configure('http://127.0.0.1:1',identity,info.worldSettings)}
});
await test('real OWNER/GM vs OBSERVER/hidden Store boundaries before dice/chat',async()=>{for(const id of ['owner','gm','observer','hidden']){effects.length=0;const response=await call(runtime(id));assert.equal(response.status,['owner','gm'].includes(id)?200:404);assert.equal(effects.length,['owner','gm'].includes(id)?2:0)}});
await test('public, GM, blind, self visibility through actual Core chat runtime',async()=>{for(const mode of ['publicroll','gmroll','blindroll','selfroll']){effects.length=0;assert.equal((await call(runtime(),{rollMode:mode})).status,200);const m=effects.find(x=>x.message).message;assert.equal(m.author,'owner');if(mode==='selfroll')assert.deepEqual(m.whisper,['owner']);if(mode==='blindroll'){assert.equal(m.blind,true);assert.deepEqual(m.whisper,['gm'])}if(mode==='gmroll')assert.deepEqual(m.whisper,['gm','owner'])}});
await test('MB-R05 compiled actual cards preserve four ability identities, modifiers, visibility and zero writes',async()=>{
 for(const key of ['strength','agility','presence','toughness'])for(const mode of ['publicroll','gmroll','blindroll','selfroll']){
  effects.length=0;const before=JSON.stringify(actorStore.get('a1'));
  const res=await server.apiRoutes['actors/[id]/roll']({runtime:runtime(),json:async()=>({type:'ability',key,options:{rollMode:mode}})},params);assert.equal(res.status,200);
  const message=effects.find(e=>e.message).message;assert.ok(message.content.includes('Test '+key[0].toUpperCase()+key.slice(1)));assert.equal(effects.filter(e=>e.roll)[0].roll,'1d20+2');assert.equal(effects.filter(e=>e.action).length,0);assert.equal(JSON.stringify(actorStore.get('a1')),before);
  assert.equal(message.content.includes('DR +2'),['strength','agility'].includes(key));
  if(mode==='selfroll')assert.deepEqual(message.whisper,['owner']);if(mode==='blindroll'){assert.equal(message.blind,true);assert.deepEqual(message.whisper,['gm'])}if(mode==='gmroll')assert.deepEqual(message.whisper,['gm','owner']);
 }
});
await test('actual pack permission change, valid empty and restore',async()=>{let rt=runtime();let res=await server.apiRoutes.items({runtime:rt,url:'http://fixture/items?types=misc'});assert.equal(res.status,200);assert.equal((await res.json()).items[0].uuid,'Compendium.morkborg.mork-borg-items.Item.i1');await settingStore.seed(async()=>[{_id:'access',key:'core.compendiumConfiguration',value:JSON.stringify({[pack]:{ownership:{PLAYER:'NONE'}}})}] as any);assert.equal(world.refresh().dependenciesChanged,true);res=await server.apiRoutes.items({runtime:runtime(),url:'http://fixture/items?types=misc'});assert.equal(res.status,403);await settingStore.seed(async()=>[]);world.refresh();await compendiumStore.setPackRows('morkborg',pack,[]);res=await server.apiRoutes.items({runtime:runtime(),url:'http://fixture/items?types=misc'});assert.equal(res.status,200);assert.deepEqual((await res.json()).items,[])});
await test('world false setting refresh and stale client action zero effects',async()=>{const revision=world.snapshot().identity.contextRevision;await settingStore.seed(async()=>[{_id:'carrying',key:'morkborg.trackCarryingCapacity',value:'false'}] as any);assert.equal(world.refresh().affectsPreparation,true);assert.equal(adapter!.prepareActorData(actor as any,{world:world.snapshot()} as any).derived.encumbered,false);effects.length=0;assert.equal((await call(runtime(),{contextRevision:revision})).status,409);assert.equal(effects.length,0)});
await test('owner revoke during native roll prevents chat',async()=>{effects.length=0;beforeRoll=async()=>{await actorStore.seed(async()=>[{...actor,ownership:{default:0,owner:2}}])};const response=await call(runtime());assert.equal(response.status,404);assert.equal(effects.filter(e=>e.message).length,0);beforeRoll=undefined;await actorStore.seed(async()=>[actor])});
await test('disconnect typed503 and same-world recovery',async()=>{connected=false;effects.length=0;assert.equal((await call(runtime())).status,503);assert.equal(effects.length,0);connected=true;assert.equal((await call(runtime())).status,200)});
await test('request retired before first document await preserves conflict',async()=>{const rt=runtime();world.touchDependencies();effects.length=0;assert.equal((await call(rt)).status,409);assert.equal(effects.length,0)});
await test('sheet raw attack and defense fields execute through real Core dice',async()=>{
 evaluateDice=true;
 for(const kind of ['attack','defend']){
  effects.length=0;
  const body=kind==='attack'
   ? {type:'item',key:'w1',options:{rollType:'attack',manualHitDie:20,manualDamageDie:4,baseDR:12,targetArmor:'0'}}
   : {type:'defend',key:'',options:{manualDefendDie:1,manualIncomingDamage:4,baseDR:12,incomingAttack:'1d4'}};
  const response=await server.apiRoutes['actors/[id]/roll']({runtime:runtime(),json:async()=>body},params);
  assert.equal(response.status,200,JSON.stringify(await response.json()));
  assert.deepEqual(effects.filter(e=>e.roll).map(e=>e.roll),[kind==='attack'?'20+2':'1+2','(4) * 2']);
  for(const e of effects.filter(e=>e.action==='update'))assert.ok(Object.keys(e.operation.updates[0]).every(k=>k==='_id'||k.startsWith('flags.morkborg.')),'damage remains instructional; native preferences may persist');
 }
 evaluateDice=false;
});
// Request guards are supplied from current authoritative source, never a prepared projection.
const fingerprint=(a:any)=>JSON.stringify([a._id,a.type,a.system,a.flags?.morkborg,a.items.map((i:any)=>[i._id,i.type,i.system])]);
const itemRequest=(body:any,user='owner')=>({runtime:runtime(user),json:async()=>({...body,expectedSource:fingerprint(actorStore.get('a1'))})});
await test('MB-R01 compiled inventory route shields cycle, replacement, reduction and Observer denial',async()=>{
 const original=structuredClone(actor);const shields=['s1','s2'].map((id,n)=>({_id:id,type:'shield',name:'Shield '+n,flags:{custom:{keep:id}},system:{quantity:1,carryWeight:1,containerSpace:1,carried:true,equipped:n===1,description:'Preserved'}}));
 await actorStore.seed(async()=>[{...original,items:[...original.items,...shields]}]);
 try{
  for(const value of [true,false,true]){
   const res=await server.apiRoutes['actors/[id]/inventory'](itemRequest({op:'equip',itemId:'s1',value}),params);assert.equal(res.status,200,JSON.stringify(await res.json()));
   const source:any=actorStore.get('a1');assert.equal(source.items.find((i:any)=>i._id==='s1').system.equipped,value);assert.equal(source.items.find((i:any)=>i._id==='s2').system.equipped,false);
   assert.equal(adapter!.prepareActorData(source,{world:world.snapshot()} as any).derived.inventory.reduction,value?'0+1':'0');
   for(const shield of shields){const actual=source.items.find((i:any)=>i._id===shield._id);assert.deepEqual({...actual,system:{...actual.system,equipped:shield.system.equipped}},shield)}
  }
  effects.length=0;assert.equal((await server.apiRoutes['actors/[id]/inventory'](itemRequest({op:'equip',itemId:'s1',value:false},'observer'),params)).status,404);assert.equal(effects.length,0);
 }finally{await actorStore.seed(async()=>[original])}
});
await test('MB-R02 exact native ammo browse/add, selection, depletion, replenishment and denied/empty catalogs',async()=>{
 const original=structuredClone(actor);const native=JSON.parse(fs.readFileSync(process.env.MB_NATIVE_FIXTURES+'/native-documents.json','utf8'));
 const ammo=native.items.find((i:any)=>i._id==='4wvSoapM7f0FczOH');assert.ok(ammo);
 // Selection is an owned Item id, independent of template names or pack order.
 const weapon=native.items.find((i:any)=>i.type==='weapon'&&i.system.usesAmmo);assert.ok(weapon);
 await actorStore.seed(async()=>[{...original,items:[{...structuredClone(weapon),_id:'w1',system:{...weapon.system,ammoId:null}}]}]);
 await compendiumStore.setPackRows('morkborg',pack,[ammo]);await compendiumStore.setManifest({systemId:'morkborg',packs:{[pack]:{id:pack,hash:'fixture',lastUpdated:1,rowCount:1,hydrate:true}},_instanceId:'fixture'});world.refresh();
 const add=async()=>{const res=await server.apiRoutes['actors/[id]/add-item'](itemRequest({sourceUuid:`Compendium.${pack}.Item.${ammo._id}`}),params);assert.equal(res.status,200,JSON.stringify(await res.json()));return (await res.json()).item};
 try{
  const catalog=await server.apiRoutes.items({runtime:runtime(),url:'http://fixture/items?types=ammo'});assert.equal(catalog.status,200);assert.equal((await catalog.json()).items[0].uuid,`Compendium.${pack}.Item.${ammo._id}`);
  const first=await add();assert.notEqual(first._id,ammo._id);assert.equal(first.flags.morkborg.sourceUuid,`Compendium.${pack}.Item.${ammo._id}`);assert.deepEqual(first.system,ammo.system);
  effects.length=0;assert.equal((await server.apiRoutes['actors/[id]/add-item'](itemRequest({sourceUuid:`Compendium.${pack}.Item.${ammo._id}`},'observer'),params)).status,404);assert.equal(effects.length,0);
  await runtime().documents.items.update({type:'Actor',id:'a1'},'w1',{'system.ammoId':first._id});
  evaluateDice=true;effects.length=0;const response=await server.apiRoutes['actors/[id]/roll']({runtime:runtime(),json:async()=>({type:'item',key:'w1',options:{rollType:'attack',manualHitDie:2,baseDR:12,targetArmor:'0'}})},params);assert.equal(response.status,200,JSON.stringify(await response.json()));
  assert.equal((actorStore.get('a1') as any).items.some((i:any)=>i._id===first._id),false,'one native sling stone is depleted, not merged by name');
  const second=await add();assert.notEqual(second._id,first._id);const prepared=adapter!.prepareActorData(actorStore.get('a1') as any,{world:world.snapshot()} as any);assert.equal(prepared.categorizedItems.ammo.length,1);assert.equal(prepared.categorizedItems.equipment.some((i:any)=>i.id===second._id),false);
  await settingStore.seed(async()=>[{_id:'access',key:'core.compendiumConfiguration',value:JSON.stringify({[pack]:{ownership:{PLAYER:'NONE'}}})}] as any);world.refresh();effects.length=0;assert.equal((await server.apiRoutes.items({runtime:runtime(),url:'http://fixture/items?types=ammo'})).status,403);assert.equal(effects.length,0);
  await settingStore.seed(async()=>[]);world.refresh();await compendiumStore.setPackRows('morkborg',pack,[]);assert.deepEqual((await(await server.apiRoutes.items({runtime:runtime(),url:'http://fixture/items?types=ammo'})).json()).items,[]);
 }finally{evaluateDice=false;await settingStore.seed(async()=>[]);world.refresh();await actorStore.seed(async()=>[original])}
});
let nativePlans:any[]=[], nativeItems:any[]=[], owlPlan:any;
await test('copied native classes through installed routes and real hydrated Core packs',async()=>{
 evaluateDice=true;
 const native=JSON.parse(fs.readFileSync(process.env.MB_NATIVE_FIXTURES + '/native-documents.json','utf8'));
 const roots=JSON.parse(fs.readFileSync(process.env.MB_NATIVE_FIXTURES + '/native-pack-rows.json','utf8'));
 const packs:any={};
 for(const [key,type] of Object.entries({items:'Item',tables:'RollTable',actors:'Actor',macros:'Macro'})){
  const packId='morkborg.mork-borg-'+key;
  let rows=native[key]??roots[key].filter((row:any)=>row.key.startsWith('!'+key+'!')).map((row:any)=>row.data);if(key==='actors'){const embedded=new Map(roots.actors.filter((r:any)=>r.key.startsWith('!actors.items!')).map((r:any)=>[r.key.split('!')[2],r.data]));rows=rows.map((a:any)=>({...a,items:a.items.map((id:any)=>typeof id==='string'?embedded.get(a._id+'.'+id):id)}));assert.ok(rows.every((a:any)=>a.items.every((i:any)=>i?.system)))}
  compendiumStore.setPackMetadata(packId,{id:packId,type,packageType:'system',ownership:{PLAYER:'OBSERVER'}});
  await compendiumStore.setPackRows('morkborg',packId,rows);
  if(key==='items')nativeItems=structuredClone(rows);
  packs[packId]={id:packId,hash:'fixture',lastUpdated:1,rowCount:rows.length,hydrate:true};
 }
 await compendiumStore.setManifest({systemId:'morkborg',packs,_instanceId:'fixture'});
 world.refresh();
 const request=(body:any)=>({runtime:runtime(),getAccessContext:()=>({userId:'owner'}),json:async()=>body});
 const response=await server.apiRoutes.classes(request({}));assert.equal(response.status,200);const classes=(await response.json()).classes;assert.equal(classes.length,12);
 for(const clazz of classes){
  const res=await server.apiRoutes['generate-character'](request({classUuids:[clazz.uuid]}));
  assert.equal(res.status,200,JSON.stringify(await res.json()));
  const candidate=(await res.json()).candidate;
  assert.equal('sight' in candidate.generated.actor.prototypeToken,false,'native generation does not enable modern token sight');
  assert.equal(new Set(candidate.generated.actor.items.map((i:any)=>i._id)).size,candidate.generated.actor.items.length);
  if(clazz.uuid.endsWith('wLJV0VJT5I234obT')){
   const source=candidate.generated.actor.items.find((i:any)=>i.name==='Intuitive Power').flags.morkborg.sourceUuid;
   assert.ok(['BtoSeh36zY8IqOQJ','YcKA0JHLezBYt3fz'].some(id=>source.endsWith('.'+id)));
   assert.ok(candidate.generated.provenance.decisions.some((d:any)=>d.policy==='adr-0001-intuitive-power'&&d.target===source));
  }
  nativePlans.push(candidate);
 }
 assert.equal(nativePlans.length,12);
});


await test('MB-R04 native passive, formula, reviewed macro precedence and unsupported macro via compiled routes',async()=>{
 const previousDice=evaluateDice;const original=structuredClone(actor);const passive=nativeItems.find(i=>i._id==='BtoSeh36zY8IqOQJ');const formula=nativeItems.find(i=>i._id==='fuFjGnyyrGg0RRbb');const brew=nativeItems.find(i=>i._id==='SeZNKnkTTZ3oi4ln');assert.ok(passive&&formula&&brew);
 const roots=JSON.parse(fs.readFileSync(process.env.MB_NATIVE_FIXTURES+'/native-pack-rows.json','utf8'));const otherMacro=roots.macros.find((r:any)=>r.key.startsWith('!macros!')&&r.data._id!=='l6vx8Dy5iSzh7OEh').data;
 const items=[passive,formula,{...brew,system:{...brew.system,rollFormula:'@missing'}},{...brew,_id:'unsupported',system:{...brew.system,rollFormula:'1d4',rollMacro:`Compendium.morkborg.mork-borg-macros.Macro.${otherMacro._id}`}}];
 await actorStore.seed(async()=>[{...original,items:structuredClone(items)}]);evaluateDice=true;
 try{
  for(const [key,status] of [[passive._id,400],[formula._id,200],[brew._id,200],['unsupported',400]] as const){
   effects.length=0;const before=JSON.stringify(actorStore.get('a1'));const res=await server.apiRoutes['actors/[id]/roll']({runtime:runtime(),json:async()=>({type:'feat',key})},params);const body=await res.json();assert.equal(res.status,status,JSON.stringify(body));
   assert.equal(effects.filter(e=>e.action).length,0,'native instructions do not grant HP, inventory or automatic passive effects');assert.equal(JSON.stringify(actorStore.get('a1')),before);
   if(key===brew._id){assert.ok(effects.some(e=>e.message?.content.includes('Allocate them manually')));assert.equal(effects.filter(e=>e.roll==='1d4').length,1)}
   if(key==='unsupported'){assert.match(body.error,/unsupported remotely/);assert.equal(effects.length,0)}
   if(key===passive._id)assert.equal(effects.length,0);
  }
 }finally{evaluateDice=previousDice;await actorStore.seed(async()=>[original])}
});
await test('reviewed Forlorn row resolves the exact complete native Owl without source writes',async()=>{
 forlornTotal=2;effects.length=0;
 const response=await server.apiRoutes['generate-character']({runtime:runtime(),getAccessContext:()=>({userId:'owner'}),json:async()=>({classUuids:['Compendium.morkborg.mork-borg-items.Item.L9Vwzbx5o0OMdJm0']})});
 assert.equal(response.status,200,JSON.stringify(await response.json()));assert.equal(effects.filter(e=>e.action==='create').length,0);
 owlPlan=(await response.json()).candidate;
 const owl=owlPlan.generated.companions.find((a:any)=>a.flags?.morkborg?.sourceUuid==='Compendium.morkborg.mork-borg-actors.Actor.HLu7lgwoNPlhfx3W');
 assert.ok(owl);assert.equal(owl.system.hp.value,2);assert.equal(owl.items.find((i:any)=>i.name==='Claw/Bite').system.damageDie,'1d4');assert.equal(owl.prototypeToken.sight.range,30);
 assert.ok(owlPlan.generated.provenance.decisions.some((d:any)=>d.policy==='adr-0001-forlorn-owl'&&d.source==='Compendium.morkborg.morkborg-actors.6QMkD6jeNJ5ovUmf'));
 forlornTotal=6;
});
await test('changing the unselected Intuitive Power source rejects creation before writes',async()=>{
 const candidate=nativePlans.find(c=>c.generated.className==='Pale One');assert.ok(candidate);
 const selected=candidate.generated.actor.items.find((i:any)=>i.name==='Intuitive Power').flags.morkborg.sourceUuid;
 const other=['BtoSeh36zY8IqOQJ','YcKA0JHLezBYt3fz'].find(id=>!selected.endsWith('.'+id));
 await compendiumStore.setPackRows('morkborg','morkborg.mork-borg-items',nativeItems.map(i=>i._id===other?{...i,flags:{...i.flags,adrFixtureChanged:true}}:i));
 effects.length=0;
 const response=await server.apiRoutes['create-character']({runtime:runtime(),getAccessContext:()=>({userId:'owner'}),json:async()=>({candidateId:candidate.id})});
 assert.equal(response.status,409);assert.equal(effects.filter(e=>e.action==='create').length,0);
 await compendiumStore.setPackRows('morkborg','morkborg.mork-borg-items',nativeItems);
});
await test('reviewed Pale and Owl candidates create without redrawing or changing source identities',async()=>{
 const request=(body:any)=>({runtime:runtime(),getAccessContext:()=>({userId:'owner'}),json:async()=>body});
 const preview=await server.apiRoutes['generate-character'](request({classUuids:['Compendium.morkborg.mork-borg-items.Item.wLJV0VJT5I234obT']}));assert.equal(preview.status,200);
 const pale=(await preview.json()).candidate;
 for(const candidate of [pale,owlPlan]){
  effects.length=0;const created=await server.apiRoutes['create-character'](request({candidateId:candidate.id}));assert.equal(created.status,200,JSON.stringify(await created.json()));
  assert.equal(effects.filter(e=>e.roll).length,0,'a reviewed source choice is not rerolled on create');
  const actorWrites=effects.filter(e=>e.action==='create').map(e=>e.operation.data[0]);
  assert.deepEqual(actorWrites[0].items.map((i:any)=>i.flags?.morkborg?.sourceUuid),candidate.generated.actor.items.map((i:any)=>i.flags?.morkborg?.sourceUuid));
  if(candidate===owlPlan)assert.ok(actorWrites.some((a:any)=>a.flags?.morkborg?.sourceUuid==='Compendium.morkborg.mork-borg-actors.Actor.HLu7lgwoNPlhfx3W'));
 }
});
await test('real Core Actor create, partial denial, status and no replay',async()=>{
 const candidate=nativePlans.find(c=>c.generated.companions.length>0);assert.ok(candidate);
 denySecond=true;creationCount=0;
 const request=()=>({runtime:runtime(),getAccessContext:()=>({userId:'owner'}),json:async()=>({candidateId:candidate.id})});
 const response=await server.apiRoutes['create-character'](request());assert.equal(response.status,403,JSON.stringify(await response.json()));
 const outcome=(await response.json()).outcome;assert.equal(outcome.created.length,1);assert.deepEqual(actorStore.get(outcome.created[0].id)!.ownership,{default:0,owner:3});
 const count=creationCount;assert.equal((await server.apiRoutes['create-character'](request())).status,409);assert.equal(creationCount,count);assert.equal((await server.apiRoutes['creation-status'](request())).status,200);
});

fs.writeFileSync(process.env.MB_INSTALLED_RESULTS!,JSON.stringify({core:'0.19.3 / 90c13e5e57d88913cd3bae6bf6b9e6f0b995bad1',package:process.env.MB_ARCHIVE_HASH,mode:process.env.NODE_ENV,scope:'actual managed production loader, Core Stores/world context/caller runtime/visibility; deterministic transport boundary, no native world or Core app server',results},null,2));console.log(JSON.stringify(results,null,2));if(results.some(r=>r.status==='failed'))process.exitCode=1;
