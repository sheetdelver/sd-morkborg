import React,{useState,useCallback} from 'react';
import {createRoot} from 'react-dom/client';
import {createMockSdkContext,createMockSdkComponents,MockSDKProvider} from '@sheet-delver/sdk/testing';
import {ConfirmationModal} from 'host-confirm';
import RichTextEditor from 'host-editor';
import {UIProvider,useUI} from 'host-ui';
import FloatingHUD from 'host-hud';
import {SharedContentHost} from 'host-shared';
import * as ReactJSX from 'react/jsx-runtime';
import * as sdkExports from '@sheet-delver/sdk';
import * as sdkReactExports from '@sheet-delver/sdk/react';
window.__SD={React,ReactJSX,sdk:sdkExports,sdkReact:sdkReactExports};
const manifest=(await import('fixture-module')).default;
import {Adapter} from 'fixture-logic';
import {planInventoryOperation} from 'fixture-inventory';
const Sheet=(await manifest.sheet()).default;
const Factory=(await manifest.tools.generator()).default;
const ActorPage=(await manifest.actorPage()).default;
const worlds={identity:{instanceId:'isolated',worldId:'fixture',systemId:'morkborg',systemVersion:'6.0.0',foundryGeneration:14,foundryBuild:'fixture',runtimeEpoch:1,contextRevision:1},settings:Object.fromEntries(['trackCarryingCapacity','trackAmmo','hitAutomation'].map(k=>['morkborg.'+k,{status:'world',value:true}]))};
const source={_id:'a1',name:'Browser Fixture',type:'character',img:'data:,',ownership:{default:0,u1:3},system:{hp:{value:1234,max:5678},omens:{value:2,max:4},powerUses:{value:3,max:3},silver:20,notes:'Fixture',abilities:{strength:{value:-3},agility:{value:1},presence:{value:2},toughness:{value:0}},description:'Fixture'},items:[{_id:'w1',name:'Fixture Sword',type:'weapon',img:'data:,',system:{damageDie:'1d6+1',weaponType:'melee',handed:1,quantity:1,carryWeight:1,containerSpace:1,carried:true,equipped:true,description:'<p>Safe description</p><img src="data:,broken" onerror="window.__unsafe=(window.__unsafe||0)+1"><a href="javascript:window.__unsafe=99">Unsafe link</a>'}},{_id:'am1',name:'Fixture Arrows',type:'ammo',img:'data:,',system:{quantity:4,carryWeight:0.1,containerSpace:0.1,carried:true}},{_id:'ar1',name:'Fixture Mail',type:'armor',img:'data:,',system:{tier:{value:1,max:2},quantity:1,carryWeight:1,containerSpace:1,carried:true,equipped:false}},{_id:'c1',name:'Fixture Class',type:'class',system:{description:'<p>Class text</p>',maxHp:'1d8',omens:'1d2'}}]};
const adapter=new Adapter();
const actor=adapter.prepareActorData(source,{world:worlds});
const sdk=createMockSdkContext({moduleId:'morkborg',worldId:'fixture',documents:{Actor:{a1:actor}},foundryUrl:location.origin,overrides:{registerBottomNavigation:el=>{window.__footer=el;return()=>{window.__footer=null}},resolveImageUrl:p=>p}});
window.__notices=[];sdk.addNotification=(...args)=>window.__notices.push(args);window.__actionMode='ready';window.__generationMode='ready';window.__pendingGeneration=[];window.__statusMode='ready';window.__pendingStatus=[];window.__nextCandidate=0;window.__pendingActions=[];window.__calls=[];window.__pending=[];window.__mode='ready';window.__catalog='Fixture Sword';
sdk.fetchWithAuth=async(path,opts)=>{
 window.__calls.push({path,body:opts?.body});
 if(path.includes('/actors/')&&path.endsWith('/roll')&&window.__actionMode==='delay')return new Promise(resolve=>window.__pendingActions.push(resolve));
 if(window.__mode==='delay')return new Promise(resolve=>window.__pending.push(resolve));
 if(window.__mode==='denied')return new Response(JSON.stringify({error:'Fixture access denied'}),{status:403});
 if(path.includes('/items?'))return new Response(JSON.stringify({items:window.__mode==='empty'?[]:window.__reviewTemplates?window.__reviewTemplates.filter(i=>new URL(path,location.origin).searchParams.get('types').split(',').includes(i.type)):[{uuid:'Compendium.fixture.items.Item.i1',name:window.__catalog,type:'weapon',img:'data:,'}]}));
 if(path.includes('/classes'))return new Response(JSON.stringify({classes:[{uuid:'Compendium.fixture.items.Item.class',name:'Fixture Class',img:'data:,',description:'<p>Fixture class</p>'}]}));
 if(path.endsWith('/generate-character')){if(window.__generationMode==='delay')return new Promise(resolve=>window.__pendingGeneration.push(resolve));return new Response(JSON.stringify(window.__candidate()));}
 if(path.endsWith('/create-character'))return new Response(JSON.stringify({error:'Fixture partial creation; inspect before recovery',outcome:{status:'needs-review',confirmedWriteCount:1}}),{status:403});
 if(path.endsWith('/creation-status')){if(window.__statusMode==='delay')return new Promise(resolve=>window.__pendingStatus.push(resolve));return new Response(JSON.stringify({outcome:{status:'needs-review',created:[{id:'created1',name:'CURRENT_VISIBLE_ACTOR',type:'character'}]}}));}
 return new Response(JSON.stringify({}));
};
window.__events=sdk.events;
window.__candidate=()=>({candidate:{id:`00000000-0000-4000-8000-${String(++window.__nextCandidate).padStart(12,'0')}`,generated:{actor:{name:'Generated Fixture',system:{abilities:{strength:{value:1}},hp:{max:6},omens:{max:2},powerUses:{max:3},silver:10,description:'<p>Complete preview</p>'},items:[{_id:'generated1',name:'Generated Item',system:{quantity:1}}]},className:'Fixture Class',companions:[{name:'Generated Donkey',type:'container'}]}}});
function App(){
 const ui=useUI();const register=useCallback(el=>{window.__footer=el;const dispose=ui.registerBottomNavigation(el);return()=>{window.__footer=null;dispose()}},[ui.registerBottomNavigation]);
 const context={...sdk,registerBottomNavigation:register};const [scene,setScene]=useState('sheet'),[owner,setOwner]=useState(true),[projection,setProjection]=useState(actor);
 const refresh=()=>setProjection(adapter.prepareActorData(source,{world:worlds}));
 const patch=(object,path,value)=>{const keys=path.split('.');for(const key of keys.slice(0,-1))object=object[key]??={};object[keys.at(-1)]=value};
 const inventory=command=>{window.__calls.push({inventory:command});for(const step of planInventoryOperation(source,command)){if(step.kind==='delete')source.items=source.items.filter(i=>i._id!==step.itemId);else for(const [key,value]of Object.entries(step.patch))patch(source.items.find(i=>i._id===step.itemId),key,value)}refresh()};
 const update=(path,value)=>{window.__calls.push({path,value});if(!window.__review)return;const item=path.match(/^items\.([^.]+)\.(.*)$/);if(item){if(item[2]==='system.equipped')return inventory({op:'equip',itemId:item[1],value});patch(source.items.find(i=>i._id===item[1]),item[2],value)}else patch(source,path,value);refresh()};
 window.__raw=()=>structuredClone(source);window.__projection=projection;
 window.__patchItem=(id,fields)=>{Object.assign(source.items.find(i=>i._id===id).system,fields);refresh()};
 window.__removeItem=id=>{source.items=source.items.filter(i=>i._id!==id);refresh()};
 window.__actorId=id=>{source._id=id;refresh()};
 window.__reviewSetup=()=>{
  window.__review=true;
  source.items.push(...['s1','s2'].map((id,n)=>({_id:id,type:'shield',name:n?'Replacement Shield':'Review Shield',flags:{custom:{keep:id}},system:{description:'Native-shaped shield fixture',quantity:1,carryWeight:1,containerSpace:1,carried:true,equipped:n===1}})));
  source.items.push(...[
   ['f1','Passive Feat',{description:'Passive instructions',rollLabel:'',rollFormula:'',rollMacro:''}],
   ['f2','Formula Feat',{description:'Formula instructions',rollLabel:'Roll formula',rollFormula:'1d4',rollMacro:''}],
   ['f3','Macro Feat',{description:'Macro instructions',rollLabel:'Create decoctions',rollFormula:'@missing',rollMacro:'Compendium.morkborg.mork-borg-macros.Macro.l6vx8Dy5iSzh7OEh'}],
   ['f4','Unsupported Feat',{description:'Unsupported instructions',rollLabel:'Try unsupported macro',rollFormula:'1d4',rollMacro:'Compendium.fixture.macros.Macro.unknown'}],
  ].map(([_id,name,system])=>({_id,name,type:'feat',system})));
  window.__reviewTemplates=[{uuid:'Compendium.fixture.items.Item.ammo',_id:'ammo',name:'Template Arrows',type:'ammo',img:'data:,',flags:{custom:{keep:true}},system:{quantity:2,carryWeight:0.1,containerSpace:0.1,carried:true,description:'Ammo fixture'}}];refresh();
 };
 const create=item=>{window.__calls.push({create:item});if(!window.__review)return;const template=item.sourceUuid?window.__reviewTemplates.find(t=>t.uuid===item.sourceUuid):item;const copy=structuredClone(template);delete copy.uuid;copy._id='added'+(window.__createdCount=(window.__createdCount??0)+1);if(item.sourceUuid)copy.flags={...copy.flags,morkborg:{sourceUuid:item.sourceUuid}};source.items.push(copy);refresh()};
 window.__nativeOwner=value=>setProjection(previous=>({...previous,ownership:{...previous.ownership,u1:value}}));window.__scene=setScene;window.__owner=setOwner;
 return <MockSDKProvider context={context} components={{...createMockSdkComponents(),ConfirmationModal,RichTextEditor}}><div className="sdk-module--morkborg" id="module-root">{scene==='page'?<ActorPage actorId="a1"/>:scene==='sheet'?<Sheet actor={projection} isOwner={owner} onRoll={(type,key,options)=>window.__calls.push({type,key,options})} onUpdate={update} onDeleteItem={id=>window.__calls.push({delete:id})} onInventoryAction={async command=>inventory(command)} onCreateItem={create}/>:<Factory/>}</div></MockSDKProvider>
}
createRoot(document.getElementById('root')).render(<UIProvider><App/><FloatingHUD/><SharedContentHost/></UIProvider>);window.__ready=true;
