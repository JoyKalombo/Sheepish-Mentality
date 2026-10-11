// Ratcliff/Obershelp matching, like the original Python SequenceMatcher.
export function similarity(a,b) {
 a=a.toLowerCase(); b=b.toLowerCase();
 function matches(x,y){let best=0,xi=0,yi=0;for(let i=0;i<x.length;i++)for(let j=0;j<y.length;j++){let n=0;while(i+n<x.length&&j+n<y.length&&x[i+n]===y[j+n])n++;if(n>best){best=n;xi=i;yi=j;}}return best?best+matches(x.slice(0,xi),y.slice(0,yi))+matches(x.slice(xi+best),y.slice(yi+best)):0;}
 return a.length+b.length?2*matches(a,b)/(a.length+b.length):1;
}
export function herd(answers){const groups=[];for(const [id,answer] of Object.entries(answers)){let g=groups.find(g=>similarity(answer,g.answer)>=.75);if(!g){g={answer,players:[]};groups.push(g);}g.players.push(id);}groups.sort((a,b)=>b.players.length-a.players.length);const winner=groups.length&&groups[0].players.length>1&&(!groups[1]||groups[0].players.length>groups[1].players.length)?groups[0]:null;return {groups,winners:winner?.players||[],answer:winner?.answer||null};}

export function revealRound(room, result = herd(room.answers)) {
 if (room.phase !== 'answering' || Object.keys(room.answers).length < 2) return false;
 room.result = {...result, answers: {...room.answers}};
 for (const id of room.result.winners) room.players[id].score++;
 room.phase = 'revealed';
 return true;
}
export function revealIfReady(room) {
 const players = Object.values(room.players).filter(player => player.online);
 if (players.length < 2 || !players.every(player => Object.hasOwn(room.answers, player.id))) return false;
 return revealRound(room);
}
