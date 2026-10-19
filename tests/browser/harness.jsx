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
 if(path.includes('/items?'))return new Response(JSON.stringify({items:window.__mode==='empty'?[]:[{uuid:'Compendium.fixture.items.Item.i1',name:window.__catalog,type:'weapon',img:'data:,'}]}));
 if(path.includes('/classes'))return new Response(JSON.stringify({classes:[{uuid:'Compendium.fixture.items.Item.class',name:'Fixture Class',img:'data:,',description:'<p>Fixture class</p>'}]}));
 if(path.endsWith('/generate-character')){if(window.__generationMode==='delay')return new Promise(resolve=>window.__pendingGeneration.push(resolve));return new Response(JSON.stringify(window.__candidate()));}
 if(path.endsWith('/create-character'))return new Response(JSON.stringify({error:'Fixture partial creation; inspect before recovery',outcome:{status:'needs-review',confirmedWriteCount:1}}),{status:403});
 if(path.endsWith('/creation-status')){if(window.__statusMode==='delay')return new Promise(resolve=>window.__pendingStatus.push(resolve));return new Response(JSON.stringify({outcome:{status:'needs-review',created:[{id:'created1',name:'CURRENT_VISIBLE_ACTOR',type:'character'}]}}));}
 return new Response(JSON.stringify({}));
};
window.__events=sdk.events;
window.__candidate=()=>({candidate:{id:`00000000-0000-4000-8000-${String(++window.__nextCandidate).padStart(12,'0')}`,generated:{actor:{name:'Generated Fixture',system:{abilities:{strength:{value:1}},hp:{max:6},omens:{max:2},powerUses:{max:3},silver:10,description:'<p>Complete preview</p>'},items:[{_id:'generated1',name:'Generated Item',system:{quantity:1}}]},className:'Fixture Class',companions:[{name:'Generated Donkey',type:'container'}]}}});
function App(){const ui=useUI();const register=useCallback(el=>{window.__footer=el;const dispose=ui.registerBottomNavigation(el);return()=>{window.__footer=null;dispose()}},[ui.registerBottomNavigation]);const context={...sdk,registerBottomNavigation:register};const [scene,setScene]=useState('sheet'),[owner,setOwner]=useState(true),[projection,setProjection]=useState(actor);window.__nativeOwner=value=>setProjection(previous=>({...previous,ownership:{...previous.ownership,u1:value}}));window.__scene=setScene;window.__owner=setOwner;return <MockSDKProvider context={context} components={{...createMockSdkComponents(),ConfirmationModal,RichTextEditor}}><div className="sdk-module--morkborg" id="module-root">{scene==='page'?<ActorPage actorId="a1"/>:scene==='sheet'?<Sheet actor={projection} isOwner={owner} onRoll={(type,key,options)=>window.__calls.push({type,key,options})} onUpdate={(path,value)=>window.__calls.push({path,value})} onDeleteItem={id=>window.__calls.push({delete:id})} onCreateItem={item=>window.__calls.push({create:item})}/>:<Factory/>}</div></MockSDKProvider>}
createRoot(document.getElementById('root')).render(<UIProvider><App/><FloatingHUD/><SharedContentHost/></UIProvider>);window.__ready=true;
