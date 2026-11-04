/* Imagine Engine 3D runtime bridge, shared by every three.js block.
   - Live settings from the Content tab (camera, light, fog, sky, materials, gameplay) without restarting.
   - Flow commands: spawn / move / remove / color objects, read events back as state.
   - Settings persist per block in localStorage "ie-3d:<block path+query>". */
(function () {
  var KEY = "ie-3d:" + location.pathname.split("/").pop() + location.search.replace(/[?&]b=1/, "");
  var reg = null, cfg = {}, objs = {};
  try { cfg = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
  function up(m) { try { parent.postMessage(m, "*"); } catch (e) {} }
  function apply() {
    if (!reg) return; var T = reg.THREE, c = reg.camera, r = reg.renderer, s = reg.scene;
    if (cfg.fov != null && c.fov != null) { c.fov = +cfg.fov; c.updateProjectionMatrix(); }
    if (cfg.camDist != null && reg.camBase) { c.position.copy(reg.camBase).multiplyScalar(+cfg.camDist); if (reg.lookAt) c.lookAt(reg.lookAt); }
    if (cfg.exposure != null && r) { r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = +cfg.exposure; }
    if (cfg.bg && s) { s.background = new T.Color(cfg.bg); if (s.fog) s.fog.color = new T.Color(cfg.bg); }
    if (cfg.fog != null && s && s.fog) { s.fog.far = 20 + (1 - +cfg.fog) * 280; s.fog.near = Math.min(s.fog.far - 1, 5 + (1 - +cfg.fog) * 40); }
    s.traverse(function (o) {
      if (o.isLight && !o.isAmbientLight && !o.isHemisphereLight && cfg.sun != null) { o.userData.b = o.userData.b == null ? o.intensity : o.userData.b; o.intensity = o.userData.b * +cfg.sun; }
      if ((o.isAmbientLight || o.isHemisphereLight) && cfg.ambient != null) { o.userData.b = o.userData.b == null ? o.intensity : o.userData.b; o.intensity = o.userData.b * +cfg.ambient; }
      if (o.isLight && o.isDirectionalLight && cfg.sunAngle != null) { var a = +cfg.sunAngle * Math.PI / 180; o.position.set(Math.cos(a) * 10, Math.max(1, Math.sin(a) * 12), 5); }
      if (o.isMesh && o.material) [].concat(o.material).forEach(function (m) {
        if (cfg.wireframe != null && "wireframe" in m) m.wireframe = !!cfg.wireframe;
        if (cfg.roughness != null && m.roughness != null) m.roughness = +cfg.roughness;
        if (cfg.metalness != null && m.metalness != null) m.metalness = +cfg.metalness;
      });
    });
    if (reg.onConfig) try { reg.onConfig(cfg); } catch (e) {}
  }
  function cmd(d) {
    if (!reg) return; var T = reg.THREE, s = reg.scene;
    if (d.op === "spawn") {
      var geo = d.shape === "sphere" ? new T.SphereGeometry(d.size || 1, 24, 16) : d.shape === "cylinder" ? new T.CylinderGeometry(d.size || 1, d.size || 1, (d.size || 1) * 2, 24) : new T.BoxGeometry(d.size || 1, d.size || 1, d.size || 1);
      var m = new T.Mesh(geo, new T.MeshStandardMaterial({ color: d.color || "#8b5cf6", roughness: .4, metalness: .2 }));
      var p = d.position || [0, 1, 0]; m.position.set(+p[0] || 0, +p[1] || 0, +p[2] || 0);
      var id = d.id || "obj_" + Date.now().toString(36); objs[id] = m; m.name = id; s.add(m); up({ ie: "state", key: "3d:last", value: id });
    } else if (d.op === "move") {
      var o = objs[d.id] || s.getObjectByName(d.id); if (!o) return; var to = d.position || [0, 0, 0], from = o.position.clone(), t0 = performance.now(), dur = Math.max(1, d.duration || 600);
      (function step() { var k = Math.min(1, (performance.now() - t0) / dur), e = k * k * (3 - 2 * k); o.position.set(from.x + (to[0] - from.x) * e, from.y + (to[1] - from.y) * e, from.z + (to[2] - from.z) * e); if (k < 1) requestAnimationFrame(step); })();
      if (d.rotateY != null) o.rotation.y += +d.rotateY * Math.PI / 180;
    } else if (d.op === "remove") { var r0 = objs[d.id] || s.getObjectByName(d.id); if (r0) { s.remove(r0); delete objs[d.id]; } }
    else if (d.op === "color") { var c0 = objs[d.id] || s.getObjectByName(d.id); if (c0 && c0.material) c0.material.color = new T.Color(d.color); }
    else if (d.op === "scale" || d.op === "rotate") {
      var o2 = objs[d.id] || s.getObjectByName(d.id); if (!o2) { up({ ie: "state", key: "3d:error", value: "no object " + d.id }); return; }
      var isS = d.op === "scale", tgt = isS ? (d.scale || [1, 1, 1]) : (d.rotation || [0, 0, 0]).map(function (v) { return +v * Math.PI / 180; });
      var frm = isS ? o2.scale.clone() : { x: o2.rotation.x, y: o2.rotation.y, z: o2.rotation.z }, t02 = performance.now(), dur2 = Math.max(1, d.duration || 500);
      (function step2() { var k = Math.min(1, (performance.now() - t02) / dur2), e = k * k * (3 - 2 * k), x = frm.x + (tgt[0] - frm.x) * e, y = frm.y + (tgt[1] - frm.y) * e, z = frm.z + (tgt[2] - frm.z) * e; if (isS) o2.scale.set(x, y, z); else o2.rotation.set(x, y, z); if (k < 1) requestAnimationFrame(step2); })();
    }
    else if (d.op === "spin") {
      var o3 = objs[d.id] || s.getObjectByName(d.id); if (!o3) { up({ ie: "state", key: "3d:error", value: "no object " + d.id }); return; }
      cancelAnimationFrame(o3.userData.__spin); var sp = (+d.speed || 0) * Math.PI / 180, ax = d.axis === "x" || d.axis === "z" ? d.axis : "y", last = performance.now();
      if (!sp) return;
      (function tick() { var now = performance.now(); o3.rotation[ax] += sp * (now - last) / 1000; last = now; o3.userData.__spin = requestAnimationFrame(tick); })();
    }
    else if (d.op === "visible") { var o4 = objs[d.id] || s.getObjectByName(d.id); if (o4) o4.visible = d.visible !== false; else up({ ie: "state", key: "3d:error", value: "no object " + d.id }); }
    else if (d.op === "camera") {
      var cam = reg.camera; if (!cam) return; var to3 = d.position || [cam.position.x, cam.position.y, cam.position.z], from3 = cam.position.clone(), t03 = performance.now(), dur3 = Math.max(1, d.duration || 800), look = d.lookAt ? new T.Vector3(+d.lookAt[0] || 0, +d.lookAt[1] || 0, +d.lookAt[2] || 0) : null;
      (function step3() { var k = Math.min(1, (performance.now() - t03) / dur3), e = k * k * (3 - 2 * k); cam.position.set(from3.x + (to3[0] - from3.x) * e, from3.y + (to3[1] - from3.y) * e, from3.z + (to3[2] - from3.z) * e); if (look) cam.lookAt(look); if (k < 1) requestAnimationFrame(step3); })();
    }
    else if (d.op === "light") { s.traverse(function (o5) { if (!o5.isLight || (d.id && o5.name !== d.id)) return; if (d.intensity != null) o5.intensity = +d.intensity; if (d.color) o5.color = new T.Color(d.color); }); }
    else if (d.op === "theater") { try { window.dispatchEvent(new CustomEvent("ie-theater", { detail: { id: d.id, kind: d.kind || "screen", url: d.url, page: d.page, dir: d.dir } })); } catch (e) {} up({ ie: "state", key: "3d:theater", value: d.kind || "screen" }); }
    else if (d.op) { up({ ie: "state", key: "3d:error", value: "unknown op " + d.op }); }
  }
  addEventListener("message", function (e) {
    var d = e.data; if (!d || typeof d !== "object") return;
    if (d.__IE3D === "set") { cfg = Object.assign(cfg, d.cfg || {}); try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (x) {} apply(); }
    else if (d.__IE3D === "reset") { cfg = {}; try { localStorage.removeItem(KEY); } catch (x) {} location.reload(); }
    else if (d.__IE3D === "cmd") cmd(d);
    else if (d.__IE3D === "ping") up({ __IE3D: "info", key: KEY, cfg: cfg, game: !!(reg && reg.game) });
  });
  // clicking inside a 3D block selects it in the Content tab
  addEventListener("pointerdown", function () { up({ __IE3D: "pick", key: KEY, cfg: cfg, game: !!(reg && reg.game) }); }, true);
  window.IE3D = {
    attach: function (o) { reg = o; if (o.camera && o.camera.position) o.camBase = o.camera.position.clone(); apply(); up({ __IE3D: "ready", key: KEY }); },
    cfg: function () { return cfg; },
    emit: function (key, value) { up({ ie: "state", key: key, value: value }); }
  };
})();
