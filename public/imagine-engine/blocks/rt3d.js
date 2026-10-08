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
