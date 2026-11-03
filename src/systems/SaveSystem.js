import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY='ab-open-world-native-state-v1';
export const SaveSystem={
 async save(engine,ui){const state={version:1,environment:engine.environment.state,player:engine.player?{position:engine.player.position.toArray(),rotation:engine.player.rotation.toArray(),scale:engine.player.scale.toArray()}:null,objects:engine.assets.items.map((o)=>({name:o.name,position:o.position.toArray(),rotation:o.rotation.toArray(),scale:o.scale.toArray(),assetName:o.userData.assetName||o.name,assetUri:o.userData.assetUri||null})),boneEditor:engine.bones.snapshot(),camera:{position:engine.camera.position.toArray(),target:engine.controls.target.toArray(),distance:engine.cameraDistance,yaw:engine.cameraYaw,pitch:engine.cameraPitch},ui};await AsyncStorage.setItem(KEY,JSON.stringify(state));return true;},
 async load(){const raw=await AsyncStorage.getItem(KEY);return raw?JSON.parse(raw):null;},
 async clear(){await AsyncStorage.removeItem(KEY);}
};
