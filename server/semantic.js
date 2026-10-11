import {pipeline,env} from '@huggingface/transformers';
import {fileURLToPath} from 'node:url';
import {similarity} from './game.js';
env.cacheDir=fileURLToPath(new URL('./model-cache',import.meta.url));
let extractor;
let inferenceQueue=Promise.resolve();
export async function prepareModel(){
 extractor ??= pipeline('feature-extraction','Xenova/all-MiniLM-L6-v2',{dtype:'q8',device:'cpu',session_options:{intraOpNumThreads:1,interOpNumThreads:1}});
 return extractor;
}
export function cosine(a,b){let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];}return aa&&bb?dot/Math.sqrt(aa*bb):0;}
const normalize = text => text.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
function ingForms(word){
 if(!/^[a-z]{3,}$/.test(word))return [];
 const forms=[word+'ing'];
 if(word.endsWith('ie'))forms.push(word.slice(0,-2)+'ying');
 else if(word.endsWith('e')&&!/(ee|ye|oe)$/.test(word))forms.push(word.slice(0,-1)+'ing');
 if(/[aeiou][b-df-hj-np-tv-z]$/.test(word)&&!/[wxy]$/.test(word))forms.push(word+word.at(-1)+'ing');
 return forms;
}
export function sameIngForm(a,b){
 const left=normalize(a).split(/\b/),right=normalize(b).split(/\b/);
 return left.length===right.length&&left.every((word,i)=>word===right[i]||ingForms(word).includes(right[i])||ingForms(right[i]).includes(word));
}
function conflicts(a,b){
 const negation=t=>/\b(no|not|never|without|cannot|can't|don't|doesn't|isn't|aren't|won't)\b/.test(t);
 const numbers=t=>t.match(/\d+(?:\.\d+)?/g)?.join(',')||'';
 return negation(a)!==negation(b)||numbers(a)!==numbers(b);
}
export async function semanticHerd(answers,type){
 const entries=Object.entries(answers).sort(([a],[b])=>a.localeCompare(b));
 const texts=entries.map(([,text])=>normalize(text));
 const typed=!['mc','pick'].includes(type);
 let vectors;
 if(typed&&new Set(texts).size>1){
  const run=inferenceQueue.then(async()=>{const model=await prepareModel();return (await model(texts,{pooling:'mean',normalize:true})).tolist();});
  inferenceQueue=run.catch(()=>{});vectors=await run;
 }
 const matches=(i,j)=>{
  if(texts[i]===texts[j])return true;
  if(!typed||conflicts(texts[i],texts[j]))return false;
  if(sameIngForm(texts[i],texts[j]))return true;
  // A high typo score keeps minor spelling errors; embeddings compare meaning.
  return similarity(texts[i],texts[j])>=.9 || cosine(vectors[i],vectors[j])>=.78;
 };
 const groups=[];
 for(let i=0;i<entries.length;i++){
  // Every member must match: avoid merging unrelated answers through a chain.
  let group=groups.find(g=>g.indices.every(j=>matches(i,j)));
  if(!group){group={answer:entries[i][1],players:[],indices:[]};groups.push(group);}
  group.indices.push(i);group.players.push(entries[i][0]);
 }
 groups.sort((a,b)=>b.players.length-a.players.length);
 const winner=groups[0]?.players.length>1&&(!groups[1]||groups[0].players.length>groups[1].players.length)?groups[0]:null;
 return {groups:groups.map(({indices,...g})=>g),answer:winner?.answer||null,winners:winner?.players||[]};
}
