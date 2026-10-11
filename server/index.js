import express from 'express';
import {createServer} from 'node:http';
import {Server} from 'socket.io';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {revealRound} from './game.js';
import {semanticHerd, prepareModel} from './semantic.js';
import {nextQuestion} from './questions.js';
const questions=JSON.parse(readFileSync(new URL('./questions.json',import.meta.url)));
const app=express(),http=createServer(app),io=new Server(http,{maxHttpBufferSize:10000});
const rooms=new Map();
app.get('/health',(_,res)=>res.json({ok:true}));
app.use(express.static(fileURLToPath(new URL('../dist',import.meta.url))));
app.get('*',(_,res)=>res.sendFile(fileURLToPath(new URL('../dist/index.html',import.meta.url))));
function view(room,id){return {code:room.code,host:room.host,players:Object.values(room.players).map(({token,...p})=>p),phase:room.phase,round:room.round,question:room.question,result:room.result,answered:Object.keys(room.answers),myAnswer:room.answers[id]||'',revealPending:!!room.revealPending,categories:room.categories};}
function broadcast(r){for(const s of io.sockets.sockets.values())if(s.data.code===r.code)s.emit('state',view(r,s.data.id));}

async function reveal(room) {
 if(room.phase!=='answering'||room.revealPending||Object.keys(room.answers).length<2)return;
 room.revealPending=true; broadcast(room);
 try{const result=await semanticHerd({...room.answers},room.question.type);revealRound(room,result);}
 finally{room.revealPending=false;broadcast(room);}
}
async function revealIfReady(room){
 const players=Object.values(room.players).filter(p=>p.online);
 if(players.length>=2&&players.every(p=>Object.hasOwn(room.answers,p.id)))await reveal(room);
}
io.on('connection',socket=>{
 socket.on('enter',(data,ack)=>{try{
  const name=String(data.name||'').trim().slice(0,24);if(!name)throw Error('Please enter your name.');
  let room;
  if(data.create){let code;do{code=randomBytes(3).toString('hex').toUpperCase();}while(rooms.has(code));room={code,players:{},host:null,phase:'lobby',round:0,question:null,answers:{},result:null,used:[],categories:[]};rooms.set(code,room);}
  else room=rooms.get(String(data.code||'').trim().toUpperCase());
  if(!room)throw Error('Room not found. Check the code with your host.');
  let player=Object.values(room.players).find(p=>p.token===data.token);
  if(!player){if(Object.keys(room.players).length>=30)throw Error('This room is full.');if(Object.values(room.players).some(p=>p.name.toLowerCase()===name.toLowerCase()))throw Error('That name is taken. Try another.');player={id:randomBytes(8).toString('hex'),token:randomBytes(24).toString('hex'),name,score:0,online:true};room.players[player.id]=player;}
  player.online=true;if(!room.host)room.host=player.id;socket.data={code:room.code,id:player.id};socket.join(room.code);ack({ok:true,id:player.id,token:player.token,code:room.code});broadcast(room);
 }catch(e){ack({error:e.message});}});
 socket.on('action',async(data,ack)=>{try{const r=rooms.get(socket.data.code),id=socket.data.id;if(!r||!r.players[id])throw Error('Join a room first.');
  if(data.type==='answer'){if(r.phase!=='answering'||r.revealPending)throw Error('Answers are closed.');const a=String(data.answer||'').trim().slice(0,120);if(!a)throw Error('Enter an answer.');if(r.question.type==='mc'&&!r.question.options.includes(a))throw Error('Choose an option.');if(r.question.type==='pick'&&!Object.values(r.players).some(p=>p.name===a))throw Error('Choose a player.');r.answers[id]=a;ack({ok:true});try{await revealIfReady(r);}catch{io.to(r.code).emit('gameError','Answer matching failed. The host can retry the reveal.');}broadcast(r);return;}
  else {if(r.host!==id)throw Error('Only the host can do that.');
   if(data.type==='next'){if(r.phase==='answering')throw Error('Reveal this round first.');if(Object.values(r.players).filter(p=>p.online).length<2)throw Error('Invite at least one friend first.');const categories=Array.isArray(data.categories)?data.categories:[];const q=nextQuestion(r,questions,categories);r.question=q;r.categories=categories;r.answers={};r.result=null;r.phase='answering';r.round++;}
   else if(data.type==='reveal'){if(r.phase!=='answering')throw Error('This round has already been revealed.');if(Object.keys(r.answers).length<2)throw Error('Need at least two answers.');await reveal(r);}
   else if(data.type==='clear'){if(r.revealPending)throw Error('Please wait for the reveal.');r.phase='lobby';r.question=null;r.answers={};r.result=null;}
   else throw Error('Unknown action.');
  }ack({ok:true});broadcast(r);
 }catch(e){ack({error:e.message});}});
 socket.on('disconnect',async()=>{const r=rooms.get(socket.data.code);if(r){const p=r.players[socket.data.id];if(p)p.online=[...io.sockets.sockets.values()].some(s=>s.data.code===r.code&&s.data.id===p.id);try{await revealIfReady(r);}catch{io.to(r.code).emit('gameError','Answer matching failed. The host can retry the reveal.');}broadcast(r);}});
});
// Rooms expire after 24 hours without anyone connected; state lasts for this server process.
setInterval(()=>{for(const [code,r] of rooms){if(Object.values(r.players).some(p=>p.online))r.emptySince=null;else{r.emptySince??=Date.now();if(Date.now()-r.emptySince>86400000)rooms.delete(code);}}},60000).unref();
await prepareModel();
http.listen(process.env.PORT||3001,'0.0.0.0',()=>console.log('Sheepish Mentality server ready'));
