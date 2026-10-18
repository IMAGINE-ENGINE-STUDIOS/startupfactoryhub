// Credits: Imagine Engine Studios Corp. Direct-provider streaming normalization.
export type Completion = { text: string; input: number; output: number; finish: string };
export async function readCompletion(resp: Response, onDelta: (text: string) => void): Promise<Completion> {
  const result: Completion = { text: "", input: 0, output: 0, finish: "" };
  if (!resp.body) throw new Error("Provider returned no stream");
  if (!(resp.headers.get("content-type") || "").includes("text/event-stream") && !(resp.headers.get("content-type") || "").includes("ndjson")) {
    const data = await resp.json();
    result.text = data.choices?.[0]?.message?.content || "";
    result.finish = data.choices?.[0]?.finish_reason || "stop";
    result.input = data.usage?.prompt_tokens || 0; result.output = data.usage?.completion_tokens || 0;
    onDelta(result.text); return result;
  }
  const reader = resp.body.getReader(), decoder = new TextDecoder();
  const ndjson = (resp.headers.get("content-type") || "").includes("ndjson");
  let buffer = "", ended = false;
  function consume(raw: string) {
    if (raw === "[DONE]") { ended = true; return; }
    const data = JSON.parse(raw);
    if (data.error || data.type === "error") throw new Error("AI provider interrupted the response");
    const delta = data.choices?.[0]?.delta?.content || data.delta?.text || data.message?.content || "";
    if (delta) { result.text += delta; if (result.text.length > 300000) throw new Error("Build output exceeded the safety limit"); onDelta(delta); }
    const usage = data.usage || data.message?.usage;
    if (usage) { result.input = usage.prompt_tokens ?? usage.input_tokens ?? result.input; result.output = usage.completion_tokens ?? usage.output_tokens ?? result.output; }
    if (data.prompt_eval_count != null) result.input = data.prompt_eval_count;
    if (data.eval_count != null) result.output = data.eval_count;
    const finish = data.choices?.[0]?.finish_reason || data.delta?.stop_reason;
    if (finish) { result.finish = finish; ended = true; }
    if (data.type === "message_stop" || data.done) { ended = true; result.finish ||= data.done_reason || "stop"; }
  }
  try {
    while (true) {
      const chunk = await reader.read(); buffer += decoder.decode(chunk.value || new Uint8Array(), { stream: !chunk.done });
      buffer = buffer.replace(/\r\n/g, "\n");
      const delimiter = ndjson ? "\n" : "\n\n";
      let at;
      while ((at = buffer.indexOf(delimiter)) >= 0) {
        const frame = buffer.slice(0, at); buffer = buffer.slice(at + delimiter.length);
        const raw = ndjson ? frame.trim() : frame.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trimStart()).join("\n");
        if (raw) consume(raw);
      }
      if (chunk.done) break;
    }
    if (ndjson && buffer.trim()) consume(buffer.trim());
    if (!ended) throw new Error("AI response ended unexpectedly");
    return result;
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
export function continuation(text: string, finish: string): boolean {
  return finish === "length" || finish === "max_tokens" || finish === "max_output_tokens";
}
export function resumeMessages(messages: { role: string; content: string }[], text: string) {
  // Keep the partial record verbatim: the next output is concatenated, never written alone.
  return [...messages, { role: "assistant", content: text.slice(-24000) }, { role: "user", content: "Continue EXACTLY from the final character of the partial output above. Do not restart the line, repeat any completed files, add a heading or insert a newline first. Finish the interrupted JSON record/code fence, then deliver remaining modules and the root file last. End with the done record. Keep remaining files concise and complete." }];
}