// Credits: Imagine Engine Studios Corp.
import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { readCompletion, continuation, resumeMessages } from "./stream.ts";
Deno.test("provider tokens stream before final usage with split frames", async () => {
  const bytes = new TextEncoder().encode('data: {"choices":[{"delta":{"content":"hello"}}]}\n\ndata: {"choices":[{"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":11,"completion_tokens":2}}\n\ndata: [DONE]\n\n');
  const stream = new ReadableStream({ start(c) { for (let i=0;i<bytes.length;i+=7) c.enqueue(bytes.slice(i,i+7)); c.close(); } });
  const seen: string[] = [];
  const result = await readCompletion(new Response(stream, {headers:{"content-type":"text/event-stream"}}), s => seen.push(s));
  assertEquals(seen,["hello"]); assertEquals(result,{text:"hello",input:11,output:2,finish:"stop"});
});
Deno.test("token limit triggers bounded continuation instead of silent success", () => {
  assertEquals(continuation("partial", "length"),true);
  assertEquals(continuation("partial", "max_tokens"),true);
  assertEquals(continuation("complete", "stop"),false);
  const msgs = resumeMessages([{role:"system",content:"system"}], '{"type":"file","content":"part');
  assertEquals(msgs[1].content,'{"type":"file","content":"part');
});
Deno.test("provider interrupted EOF is rejected", async () => {
  await assertRejects(()=>readCompletion(new Response('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n',{headers:{"content-type":"text/event-stream"}}),()=>{}),Error,"ended unexpectedly");
});
Deno.test("Ollama ndjson streams normalize token usage", async () => {
  const result=await readCompletion(new Response('{"message":{"content":"hi"},"done":false}\n{"message":{"content":""},"done":true,"prompt_eval_count":4,"eval_count":1}\n',{headers:{"content-type":"application/x-ndjson"}}),()=>{});
  assertEquals(result,{text:"hi",input:4,output:1,finish:"stop"});
});
Deno.test("Anthropic streaming normalizes message usage", async () => {
  const result=await readCompletion(new Response('data: {"type":"message_start","message":{"usage":{"input_tokens":5}}}\n\ndata: {"type":"content_block_delta","delta":{"text":"hi"}}\n\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":2}}\n\ndata: {"type":"message_stop"}\n\n',{headers:{"content-type":"text/event-stream"}}),()=>{});
  assertEquals(result,{text:"hi",input:5,output:2,finish:"end_turn"});
});