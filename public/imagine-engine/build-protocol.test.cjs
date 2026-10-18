// Credits: Imagine Engine Studios Corp.
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('./build-protocol.js');
const build = globalThis.__IEBuild;
test('complete structured files apply before the response finishes', () => {
  const seen = [], parser = build.parser(r => seen.push(r));
  const line = JSON.stringify({type:'file',path:'apps/demo/types.ts',content:'export type Item = string;'});
  parser.feed(line.slice(0,30)); assert.equal(seen.length,0);
  parser.feed(line.slice(30)+'\n'); assert.equal(seen[0].name,'apps/demo/types.ts');
});
test('fenced source applies only at its closing line', () => {
  const seen = [], parser = build.parser(r => seen.push(r));
  parser.feed('```tsx file=apps/Demo.tsx\nexport default function App(){return null}\n');
  assert.equal(seen.length,0); parser.feed('```\n'); assert.equal(seen[0].type,'addLiveApp');
});
test('partial file is never committed', () => {
  const seen = [], parser = build.parser(r => seen.push(r));
  parser.feed('```tsx file=apps/Demo.tsx\nexport default');
  assert.equal(parser.finish().errors.length,1); assert.equal(seen.length,0);
});
test('atomic patch rejects a later missing match without changing source', () => {
  const source='const one = 1; const two = 2;';
  assert.throws(()=>build.patch(source,[{find:'one = 1',replace:'one = 3'},{find:'missing',replace:'x'}]));
  assert.equal(source,'const one = 1; const two = 2;');
});
test('duplicate exact snippets are rejected',()=>assert.throws(()=>build.patch('x(); x();',[{find:'x();',replace:'y();'}]),/Ambiguous/));
test('safe fuzzy patch tolerates only whitespace',()=>{
  assert.equal(build.patch('const  amount =  2;',[{find:'const amount = 2;',replace:'const amount = 3;'}]),'const amount = 3;');
  assert.throws(()=>build.patch('const amount = 20;',[{find:'const amount = 2;',replace:'x'}]));
});
test('selected file outranks unrelated small files and is not silently truncated',()=>{
  const ranked=build.rank([{name:'apps/Small.tsx',content:'nothing'},{name:'apps/Large.tsx',content:'selected\n'.repeat(100)}],'change color',{file:'apps/Large.tsx',line:40},2000);
  assert.equal(ranked[0].name,'apps/Large.tsx'); assert.equal(ranked[0].content.length,900); assert.equal(ranked[0].omitted,false);
});
test('unsafe file paths are rejected',()=>{
  for(const path of ['apps/../secret.ts','/apps/X.tsx','apps//X.tsx']) assert.equal(build.safePath(path),false);
});
test('split SSE events and final credits read correctly',async()=>{
  const bytes=new TextEncoder().encode('data: {"type":"delta","text":"hello"}\n\ndata: {"type":"complete","result":{"text":"hello","credits":{"balance":5}}}\n\n');
  const stream=new ReadableStream({start(c){for(let i=0;i<bytes.length;i+=3)c.enqueue(bytes.slice(i,i+3));c.close();}});
  const seen=[]; const result=await build.readResponse(new Response(stream,{headers:{'content-type':'text/event-stream'}}),e=>seen.push(e));
  assert.equal(seen[0].text,'hello'); assert.equal(result.j.credits.balance,5);
});
test('SSE EOF without completion is an error',async()=>{
  await assert.rejects(build.readResponse(new Response('data: {"type":"delta","text":"hi"}\n\n',{headers:{'content-type':'text/event-stream'}})),/before completion/);
});
test('existing JSON responses still work',async()=>{
  const r=await build.readResponse(new Response('{"text":"ok"}',{headers:{'content-type':'application/json'}})); assert.equal(r.j.text,'ok');
});