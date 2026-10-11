import {test} from 'node:test';import assert from 'node:assert/strict';import {herd,similarity} from './game.js';
test('single largest matching herd scores',()=>assert.deepEqual(herd({a:'Pizza',b:'pizza',c:'pasta'}).winners,['a','b']));
test('tied largest groups score nobody',()=>assert.deepEqual(herd({a:'Tea',b:'tea',c:'Coffee',d:'coffee'}).winners,[]));
test('all unique answers score nobody',()=>assert.equal(herd({a:'dog',b:'cat'}).answer,null));
test('original fuzzy threshold groups minor typos',()=>{assert.ok(similarity('chocolate','chocolat')>=.75);assert.deepEqual(herd({a:'chocolate',b:'chocolat',c:'tea'}).winners,['a','b']);});
