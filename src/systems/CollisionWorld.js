import * as THREE from 'three';

export class CollisionWorld {
  constructor(scene, groundY=0) { this.scene=scene; this.groundY=groundY; this.solids=[]; this.raycaster=new THREE.Raycaster(); }
  register(root) { if(!root) return; root.traverse(o=>{if(o.isMesh && o.userData.solid!==false){o.userData.__collision=true;}}); this.rebuild(); }
  unregister(root) { if(root) this.rebuild(); }
  rebuild() { this.solids=[];this.scene.traverse(o=>{if(!o.userData?.solid||o.userData.player||o.userData.isEnvironmentMirror||!o.visible)return;if(o.parent?.userData?.solid===true)return;const box=new THREE.Box3().setFromObject(o);if(!box.isEmpty()&&box.max.y-box.min.y>.08)this.solids.push({object:o,box});}); }
  blocked(x,z,radius,ignore=null) { for(const c of this.solids){let p=c.object;let skip=false;while(p){if(p===ignore){skip=true;break;}p=p.parent;}if(skip)continue;const dx=Math.max(c.box.min.x-x,0,x-c.box.max.x),dz=Math.max(c.box.min.z-z,0,z-c.box.max.z);if(dx*dx+dz*dz<radius*radius && c.box.max.y>this.groundY+.15)return true;}return false; }
  move(root,dx,dz,radius=.18) { let moved=false;const nx=root.position.x+dx;if(!this.blocked(nx,root.position.z,radius,root)){root.position.x=nx;moved=true;}const nz=root.position.z+dz;if(!this.blocked(root.position.x,nz,radius,root)){root.position.z=nz;moved=true;}return moved; }
  floorHeight(x,z,fromY=10) { const origin=new THREE.Vector3(x,fromY,z);this.raycaster.set(origin,new THREE.Vector3(0,-1,0));this.raycaster.far=fromY-this.groundY+2;const hits=this.raycaster.intersectObjects(this.solids.map(s=>s.object),true).filter(h=>h.object.userData.solid!==false);return hits.length?Math.max(this.groundY,hits[0].point.y):this.groundY; }
  cameraSafe(target,desired,ignore=null) { const dir=desired.clone().sub(target);const len=dir.length();if(len<.001)return desired;dir.normalize();this.raycaster.set(target,dir);this.raycaster.far=len;const hits=this.raycaster.intersectObjects(this.solids.map(s=>s.object),true).filter(h=>{let p=h.object;while(p){if(p===ignore)return false;p=p.parent;}return h.distance>.25;});if(hits.length)return target.clone().addScaledVector(dir,Math.max(.55,hits[0].distance-.25));return desired; }
}
