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
});test('raw control characters inside JSON strings are repaired, content intact', () => {
  const bad = '{"type":"file","path":"apps/demo/Notes.ts","content":"line one' + String.fromCharCode(10) + 'line two' + String.fromCharCode(9) + 'end"}';
  assert.throws(() => JSON.parse(bad), /control character/i);
  const seen = [], parser = build.parser(r => seen.push(r));
  parser.feed(bad + '\n');
  assert.equal(seen.length, 1);
  assert.equal(seen[0].content, 'line one\nline two\tend');
  assert.equal(parser.finish().errors.length, 0);
});
test('repair never touches structure: broken JSON still fails', () => {
  const seen = [], parser = build.parser(r => seen.push(r));
  assert.throws(() => parser.feed('{"type":"file", oops}\n'), /Invalid structured build record/);
  assert.equal(seen.length, 0);
});
test('fenced actions block with raw newline in a string parses', () => {
  const inner = '{"actions":[{"type":"addFile","name":"src/note.ts","content":"a' + String.fromCharCode(10) + 'b"}]}';
  const seen = [], parser = build.parser(r => seen.push(r));
  parser.feed('```actions\n' + inner + '\n```\n');
  assert.equal(seen.length, 1);
  assert.equal(seen[0].content, 'a\nb');
});
test('benign path shapes normalize instead of killing the build', () => {
  const seen = [], parser = build.parser(r => seen.push(r));
  parser.feed('{"type":"file","path":"index.html","content":"<h1>Hi</h1>"}\n');
  assert.equal(seen[0].type, 'addLiveApp'); assert.equal(seen[0].name, 'index');
  assert.equal(build.normalizePath('./apps/Demo.tsx'), 'apps/Demo.tsx');
  assert.equal(build.normalizePath('/apps/Demo.tsx'), 'apps/Demo.tsx');
  assert.equal(build.normalizePath('styles.css'), 'styles/styles.css');
  assert.equal(build.normalizePath('apps/../secret.ts'), null);
  assert.equal(build.normalizePath('../secret.ts'), null);
});
test('fenced bare filename becomes a live app', () => {
  const seen = [], parser = build.parser(r => seen.push(r));
  parser.feed('```html file=landing.html\n<h1>Shop</h1>\n```\n');
  assert.equal(seen[0].type, 'addLiveApp'); assert.equal(seen[0].name, 'landing');
});
test('foreign roots and spaces normalize; error names the path', () => {
  assert.equal(build.normalizePath('app/page.tsx'), 'apps/page.tsx');
  assert.equal(build.normalizePath('public/index.html'), 'apps/index.html');
  assert.equal(build.normalizePath('coffee shop.html'), 'apps/coffee-shop.html');
  const seen = [], parser = build.parser(r => seen.push(r));
  assert.throws(() => parser.feed('{"type":"addFile","name":"weird//x.ts","content":"x"}\n'), /Unsafe source path: weird/);
  assert.equal(parser.finish().list.length, 0);
});

test('invalid backslash escapes inside JSON strings are repaired, backslash preserved', () => {
  const bs = String.fromCharCode(92);
  const seen = [], parser = build.parser(r => seen.push(r));
  const bad = '{"type":"file","path":"apps/Re.ts","content":"const re = /' + bs + 'd+' + bs + 's/;"}';
  assert.throws(() => JSON.parse(bad), /escaped character/i);
  parser.feed('```json\n' + bad + '\n```\n');
  assert.equal(parser.finish().errors.length, 0);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].content, 'const re = /' + bs + 'd+' + bs + 's/;');
});
test('valid escapes pass through untouched; incomplete unicode escape keeps its backslash', () => {
  const bs = String.fromCharCode(92);
  const seen = [], parser = build.parser(r => seen.push(r));
  const ok = '{"type":"file","path":"apps/U.ts","content":"A' + bs + 'u0042' + bs + 'nX' + bs + 'u12Y"}';
  parser.feed('```json\n' + ok + '\n```\n');
  assert.equal(parser.finish().errors.length, 0);
  assert.equal(seen[0].content, 'AB\nX' + bs + 'u12Y');
});
test('unescaped quotes inside JSON string content are repaired', () => {
  const seen = [], parser = build.parser(r => seen.push(r));
  const bad = '{"type":"file","path":"apps/Q.ts","content":"he said "hi" loudly"}';
  assert.throws(() => JSON.parse(bad));
  parser.feed('```json\n' + bad + '\n```\n');
  assert.equal(parser.finish().errors.length, 0);
  assert.equal(seen[0].content, 'he said "hi" loudly');
});
test('quote repair never eats real string ends (keys, values, arrays)', () => {
  const seen = [], parser = build.parser(r => seen.push(r));
  const ok = '{"type":"file","path":"apps/R.ts","content":"plain"}';
  parser.feed('```json\n' + ok + '\n```\n');
  assert.equal(parser.finish().errors.length, 0);
  assert.equal(seen[0].content, 'plain');
});
