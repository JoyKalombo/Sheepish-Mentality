import {test} from 'node:test';import assert from 'node:assert/strict';import {herd,similarity,revealIfReady} from './game.js';
test('single largest matching herd scores',()=>assert.deepEqual(herd({a:'Pizza',b:'pizza',c:'pasta'}).winners,['a','b']));
test('tied largest groups score nobody',()=>assert.deepEqual(herd({a:'Tea',b:'tea',c:'Coffee',d:'coffee'}).winners,[]));
test('all unique answers score nobody',()=>assert.equal(herd({a:'dog',b:'cat'}).answer,null));
test('original fuzzy threshold groups minor typos',()=>{assert.ok(similarity('chocolate','chocolat')>=.75);assert.deepEqual(herd({a:'chocolate',b:'chocolat',c:'tea'}).winners,['a','b']);});

function round(){return {phase:'answering', players:{a:{id:'a',online:true,score:0},b:{id:'b',online:true,score:0},c:{id:'c',online:true,score:0}},answers:{a:'Tea',b:'tea'},result:null};}
test('waits for the last connected player and scores exactly once',()=>{const r=round();assert.equal(revealIfReady(r),false);assert.equal(r.result,null);r.answers.c='Coffee';assert.equal(revealIfReady(r),true);assert.equal(r.phase,'revealed');assert.equal(r.players.a.score,1);assert.equal(r.players.b.score,1);assert.equal(r.players.c.score,0);assert.equal(revealIfReady(r),false);assert.equal(r.players.a.score,1);});
test('offline players do not block automatic reveal',()=>{const r=round();r.players.c.online=false;assert.equal(revealIfReady(r),true);});
test('does not reveal with fewer than two connected players',()=>{const r=round();r.players.b.online=false;r.players.c.online=false;assert.equal(revealIfReady(r),false);});
test('automatic tied reveal awards no points',()=>{const r=round();r.answers={a:'tea',b:'coffee',c:'juice'};assert.equal(revealIfReady(r),true);assert.equal(r.result.answer,null);assert.ok(Object.values(r.players).every(p=>p.score===0));});

import {nextQuestion} from './questions.js';
test('shuffled questions do not repeat duplicate prompts or repeat across categories',()=>{const room={};const bank=[{type:'open',question:'First'},{type:'open',question:'First'},{type:'open',question:'Second'},{type:'mc',question:'Third'}];const first=nextQuestion(room,bank,['open']);const second=nextQuestion(room,bank,['open']);assert.notEqual(first.question,second.question);assert.equal(nextQuestion(room,bank,[]).question,'Third');const last=room.lastPrompt;assert.notEqual(nextQuestion(room,bank,[]).question.toLowerCase(),last);});
test('each deck covers all eligible unique prompts',()=>{const room={};const bank=Array.from({length:20},(_,i)=>({type:'open',question:'Question '+i}));const drawn=Array.from({length:20},()=>nextQuestion(room,bank).question);assert.equal(new Set(drawn).size,20);assert.notEqual(nextQuestion(room,bank).question,drawn.at(-1));});
