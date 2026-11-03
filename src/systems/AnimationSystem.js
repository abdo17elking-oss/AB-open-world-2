import * as THREE from 'three';
export class AnimationSystem {
  constructor() { this.mixer=null;this.actions={};this.current=null;this.currentName=null;this.clips=[]; }
  bind(model,animations=[]) { this.mixer?.stopAllAction();this.mixer=model?new THREE.AnimationMixer(model):null;this.actions={};this.clips=animations||[];for(const clip of this.clips){const name=(clip.name||'Animation').trim();if(!name)continue;this.actions[name]=this.mixer.clipAction(clip);}const idle=this.find(/idle|stand|neutral|t.pose/i);if(idle)this.play(idle);else if(this.clips.length)this.play(this.clips[0].name); }
  find(pattern) { const key=Object.keys(this.actions).find(n=>pattern.test(n));return key||null; }
  play(nameOrPattern,fade=.18,loop=true) { let name=nameOrPattern;if(name instanceof RegExp)name=this.find(name);if(!this.actions[name]){const key=this.find(new RegExp(String(nameOrPattern),'i'));if(!key)return false;name=key;}const next=this.actions[name];if(this.current&&this.current!==next)this.current.fadeOut(fade);next.reset().fadeIn(fade).setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1);next.clampWhenFinished=!loop;next.play();this.current=next;this.currentName=name;return true; }
  ensure(nameOrPattern) { let name=nameOrPattern; if(name instanceof RegExp) name=this.find(name); if(!name) return false; if(this.currentName===name) return true; return this.play(name); }
  update(dt) { this.mixer?.update(Math.min(dt,.05)); }
  setSpeed(v){if(this.mixer)this.mixer.timeScale=Math.max(.1,Math.min(3,v));}
  stop() { this.mixer?.stopAllAction();this.current=null;this.currentName=null; }
  names() { return Object.keys(this.actions); }
}
