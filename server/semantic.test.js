import {test} from 'node:test';
import assert from 'node:assert/strict';
import {semanticHerd,prepareModel,cosine} from './semantic.js';
test('semantic cosine recognizes equivalent phrases but keeps other answers separate',async()=>{
 const result=await semanticHerd({a:'a car',b:'an automobile',c:'a banana'},'open');
 assert.deepEqual(result.winners,['a','b']);
});
test('different player names and multiple choice options never merge',async()=>{
 assert.equal((await semanticHerd({a:'Ann',b:'Anna'},'pick')).answer,null);
 assert.equal((await semanticHerd({a:'Football',b:'American football'},'mc')).answer,null);
});
test('negations and distinct numbers do not merge',async()=>{
 assert.equal((await semanticHerd({a:'I like tea',b:'I do not like tea'},'open')).answer,null);
 assert.equal((await semanticHerd({a:'10 minutes',b:'100 minutes'},'open')).answer,null);
});
test('model diagnostic pairs and memory',async()=>{
 const model=await prepareModel();const pairs=[['a car','an automobile'],['happy','joyful'],['chocolate','chocolat'],['tea','coffee'],['football','basketball']];
 for(const pair of pairs){const v=(await model(pair,{pooling:'mean',normalize:true})).tolist();console.log(pair.join(' / '),cosine(...v).toFixed(3));}
 console.log('RSS MB',Math.round(process.memoryUsage().rss/1024/1024));
});
