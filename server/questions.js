import {randomInt} from 'node:crypto';
const key = question => question.question.normalize('NFKC').trim().toLocaleLowerCase();
export function nextQuestion(room, bank, categories = []) {
 const signature = [...categories].sort().join(',');
 room.usedPrompts ??= [];
 if (!room.deck?.length || room.deckCategories !== signature) {
  const seen = new Set();
  const eligible = bank.map((q,index)=>({...q,index})).filter(q=>{
   const id=key(q);
   if ((categories.length && !categories.includes(q.type)) || seen.has(id)) return false;
   seen.add(id); return true;
  });
  if (!eligible.length) throw Error('Select a question category.');
  let deck = eligible.filter(q=>!room.usedPrompts.includes(key(q)));
  if (!deck.length) {
   const exhausted = new Set(eligible.map(key));
   room.usedPrompts = room.usedPrompts.filter(id=>!exhausted.has(id));
   deck = [...eligible];
  }
  for(let i=deck.length-1;i>0;i--){const j=randomInt(i+1);[deck[i],deck[j]]=[deck[j],deck[i]];}
  // Avoid an immediate repeat at the boundary between shuffled cycles.
  if(deck.length>1 && key(deck.at(-1))===room.lastPrompt) [deck[0],deck[deck.length-1]]=[deck.at(-1),deck[0]];
  room.deck = deck; room.deckCategories = signature;
 }
 const question = room.deck.pop();
 room.lastPrompt = key(question); room.usedPrompts.push(room.lastPrompt);
 return question;
}
