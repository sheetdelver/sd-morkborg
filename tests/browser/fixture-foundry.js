import {useSyncExternalStore} from 'react';
let state={worldId:'fixture',sharedContent:null};
const listeners=new Set();let sequence=0;
export function useFoundry(){return useSyncExternalStore(callback=>{listeners.add(callback);return()=>listeners.delete(callback)},()=>state)}
window.__share=()=>{
 const payload={type:'image',data:{url:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',title:'Shared fixture'},streamId:'fixture',sequence:++sequence,shareId:String(Date.now())};
 state={...state,sharedContent:payload};listeners.forEach(callback=>callback());
 window.__events.emit('content:shared',{kind:'image',data:payload.data});
};
