// Genius 3D: turns a request + scene context into scene operations for the 3D Studio.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { routeChat } from "../_shared/ai.ts";

const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SYS = `You are Genius 3D, the scene engineer of a browser 3D level editor (Three.js, Y-up, meters).
You receive the user's request and a JSON context: level name, selected object (may be null), a compact object list, lights, environment.
If a selected object exists and the request says "this", "it", "selected", apply changes to that object.
Reply with ONLY one JSON object, no prose outside it:
{"reply":"short sentence for the user","ops":[ ... ]}
Allowed ops:
- {"op":"add","object":OBJ}  OBJ primitive: {"kind":"primitive","name":str,"shape":"box|sphere|plane|cylinder|cone|torus","position":[x,y,z],"rotation":[rx,ry,rz],"scale":[sx,sy,sz],"color":[r,g,b,a] (0..1),"metalness":0..1,"roughness":0..1}
  Unit sizes: box 1m cube, sphere radius 0.5, cylinder/cone radius 0.5 height 1, plane 1x1 (lies flat in XY; rotate [-1.5708,0,0] for floors). Use scale to size. Put y = half height so objects rest on the ground.
- {"op":"update","id":str,"patch":{position?,rotation?,scale?,color?,metalness?,roughness?,name?,visible?}}
- {"op":"remove","id":str}
- {"op":"environment","patch":{"background":"#hex","ambient":0..2,"fog":{"color":"#hex","near":n,"far":n}}}
- {"op":"light","light":{"kind":"point|spot|directional","name":str,"position":[x,y,z],"color":[r,g,b,1],"intensity":n}}
- {"op":"script","id":objectId,"interaction":{"name":str,"trigger":"onClick|onPlayerNear|onWalkThrough|always|key","triggerKey":"E","triggerDistance":2.5,"preset":{"type":"rotateContinuously|toggleVisibility|teleportPlayer|playSound|openUrl","axis":[0,1,0],"speed":1,"target":[x,y,z],"url":str}}}
- {"op":"script","id":objectId,"interaction":{"name":str,"trigger":"always","js":"// runs each frame in Play mode with ({ obj, scene, ctx }); obj is the THREE.Object3D"}}
- {"op":"play","id":objectId,"behavior":{"collision":"walkable|blocking|none","grabbable":{"key":"G"},"pushable":{"mass":1},"usable":{"key":"E","label":str}}}
For new objects you may set "id":"new_<word>" and reference it in later ops of the same reply.
Build whole scenes with many ops when asked (up to 120). Compose complex things from several primitives. Keep coordinates sensible around existing objects.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = String(body.prompt || "").slice(0, 4000);
    if (!prompt) return json({ error: "Missing prompt" }, 400);
    const ctx = JSON.stringify(body.context || {}).slice(0, 24000);
    const history = Array.isArray(body.history) ? body.history.slice(-6).map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, 2000) })) : [];
    const { resp } = await routeChat("standard", {
      messages: [{ role: "system", content: SYS }, ...history, { role: "user", content: `CONTEXT:\n${ctx}\n\nREQUEST:\n${prompt}` }],
      max_tokens: 8000,
      temperature: 0.4,
      response_format: { type: "json_object" },
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) return json({ error: data?.error?.message || data?.error || "AI request failed" }, resp.status);
    const text: string = data?.choices?.[0]?.message?.content || "";
    const m = text.match(/\{[\s\S]*\}/);
    let parsed: any = {};
    try { parsed = JSON.parse(m ? m[0] : text); } catch { return json({ reply: text.slice(0, 500), ops: [] }); }
    return json({ reply: String(parsed.reply || "Done."), ops: Array.isArray(parsed.ops) ? parsed.ops.slice(0, 200) : [] });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Genius 3D failed" }, 500);
  }
});
