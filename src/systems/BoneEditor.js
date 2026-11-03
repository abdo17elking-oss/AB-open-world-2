import * as THREE from 'three';
export const JOINTS=[
 ['Head','Head',['head']],['Neck','Neck',['neck']],['Spine','Spine',['spine','spine1','spine2']],
 ['RightShoulder','Right Shoulder',['rightshoulder']],['RightArm','Right Arm',['rightarm']],['RightForeArm','Right Forearm',['rightforearm']],['RightWrist','Right Wrist',['righthand']],
 ['RightFingersMCP','Right Fingers MCP',['righthandindex1','righthandmiddle1','righthandring1','righthandpinky1']],['RightFingersPIP','Right Fingers PIP',['righthandindex2','righthandmiddle2','righthandring2','righthandpinky2']],['RightFingersDIP','Right Fingers DIP',['righthandindex3','righthandmiddle3','righthandring3','righthandpinky3']],['RightThumbMCP','Right Thumb MCP',['righthandthumb1','righthandthumb2']],['RightThumbIP','Right Thumb IP',['righthandthumb3']],
 ['LeftShoulder','Left Shoulder',['leftshoulder']],['LeftArm','Left Arm',['leftarm']],['LeftForeArm','Left Forearm',['leftforearm']],['LeftWrist','Left Wrist',['lefthand']],
 ['LeftFingersMCP','Left Fingers MCP',['lefthandindex1','lefthandmiddle1','lefthandring1','lefthandpinky1']],['LeftFingersPIP','Left Fingers PIP',['lefthandindex2','lefthandmiddle2','lefthandring2','lefthandpinky2']],['LeftFingersDIP','Left Fingers DIP',['lefthandindex3','lefthandmiddle3','lefthandring3','lefthandpinky3']],['LeftThumbMCP','Left Thumb MCP',['lefthandthumb1','lefthandthumb2']],['LeftThumbIP','Left Thumb IP',['lefthandthumb3']],
 ['RightUpLeg','Right Hip',['rightupleg']],['RightLeg','Right Knee',['rightleg']],['RightFoot','Right Foot',['rightfoot']],['LeftUpLeg','Left Hip',['leftupleg']],['LeftLeg','Left Knee',['leftleg']],['LeftFoot','Left Foot',['leftfoot']]
];
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
export class BoneEditor {
 constructor(){this.model=null;this.bones={};this.selected='Head';this.offsets={};JOINTS.forEach(([id])=>this.offsets[id]=new THREE.Vector3());this.base=new WeakMap();this.applied=new WeakMap();}
 bind(model){this.model=model;this.bones={};JOINTS.forEach(([id])=>this.bones[id]=[]);if(!model)return;model.traverse(o=>{if(!o.isBone)return;const n=norm(o.name);for(const [id,,aliases] of JOINTS){if(aliases.some(a=>n.includes(a))){this.bones[id].push(o);if(!this.base.has(o))this.base.set(o,o.rotation.clone());break;}}});this.apply();}
 select(id){this.selected=id;}
 rotate(axis,deg){if(!this.bones[this.selected]?.length)return false;this.offsets[this.selected][axis]+=THREE.MathUtils.degToRad(deg);this.apply();return true;}
 resetJoint(){this.offsets[this.selected]?.set(0,0,0);this.apply();}
 resetAll(){Object.values(this.offsets).forEach(v=>v.set(0,0,0));this.apply();}
 beforeMixer(){for(const [id,bones] of Object.entries(this.bones))for(const b of bones){const old=this.applied.get(b);if(old){b.rotation.x-=old.x;b.rotation.y-=old.y;b.rotation.z-=old.z;this.applied.delete(b);}}}
 apply(){this.beforeMixer();for(const [id,bones] of Object.entries(this.bones)){const off=this.offsets[id];for(const b of bones){b.rotation.x+=off.x;b.rotation.y+=off.y;b.rotation.z+=off.z;this.applied.set(b,off.clone());}}}
 grip(on){const ids=['RightFingersMCP','RightFingersPIP','RightFingersDIP','RightThumbMCP','RightThumbIP','LeftFingersMCP','LeftFingersPIP','LeftFingersDIP','LeftThumbMCP','LeftThumbIP'];for(const id of ids){const v=this.offsets[id];if(v)v.set(0,on&&id==='RightThumbMCP'?.5:0,on?(id.includes('Thumb')?.55:.85):0);}this.apply();}
 snapshot(){return {selected:this.selected,offsets:Object.fromEntries(Object.entries(this.offsets).map(([k,v])=>[k,v.toArray()]))};}
 restore(data){if(!data)return;this.selected=data.selected||this.selected;for(const [k,v] of Object.entries(data.offsets||{}))if(this.offsets[k]&&Array.isArray(v))this.offsets[k].fromArray(v);this.apply();}
 available(id){return (this.bones[id]||[]).length;}
}
