/* Imagine Engine: real maps inside map/logistics widgets.
   Each map widget gets a live map (same map service as the Startup Factory resource map) showing the
   project owner's own places, driven by the widget's purpose: store locator, delivery tracking,
   warehouse coverage, route planning, or delivery-address confirmation. Controlled from the Content tab.
   Data persists per widget section in localStorage ("ie-map:<sectionId>"). */
(function () {
  var TOKEN = "pk.eyJ1IjoiaW1hZ2luZWVuZ2luZSIsImEiOiJjbWhlYWo5bTgwYzkyMmpxMno3ODdoZGt6In0.B66urpifKwsS7bltMqzaBQ";
  var STYLE = "mapbox://styles/imagineengine/cmhfkp1ie001d01qi2hyg82lp";
  var CDN = "https://api.mapbox.com/mapbox-gl-js/v3.16.0/mapbox-gl";
  var TYPES = {
    locator: { label: "Store locator", ids: ["store-locator-map", "store-pickup-selector", "store-stock-checker", "vendor-directory-filter"], place: "store" },
    tracker: { label: "Delivery tracking", ids: ["delivery-tracker-live", "last-mile-tracking", "order-tracking", "delivery-proof-signature"], place: "stop" },
    coverage: { label: "Warehouse coverage", ids: ["warehouse-heatmap", "multi-warehouse-split"], place: "warehouse" },
    route: { label: "Route & fleet", ids: ["route-optimizer", "fleet-dispatch-drivers"], place: "stop" },
    confirm: { label: "Delivery address check", ids: ["checkout-map-confirm", "address-autocomplete"], place: "store" }
  };
  function typeOf(wid) { for (var k in TYPES) if (TYPES[k].ids.indexOf(wid) >= 0) return k; return null; }
  function J(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function S(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  // ---- identify which widget an element belongs to ----
  function secIdFrom(el) {
    while (el) { var id = el.getAttribute && el.getAttribute("data-id"); if (id && id.indexOf("sec_") === 0) return id; el = el.parentElement; }
    return null;
  }
  function widgetOf(el) {
    if (!el) return null;
    var doc = el.ownerDocument, win = doc.defaultView, sid, wid;
    if (win !== window) {
      var fr = win.frameElement; if (!fr) return null;
      sid = secIdFrom(fr);
      var w = new URLSearchParams(win.location.search).get("w"), NW = window.__NW || {};
      for (var k in NW) if (String(NW[k]) === w) wid = k;
    } else {
      sid = secIdFrom(el);
      var m = sid && sid.match(/^sec_(.+)_[^_]+$/); wid = m && m[1];
    }
    if (!sid || !wid) return null;
    var t = typeOf(wid); return t ? { sid: sid, wid: wid, type: t } : null;
  }
  function cfgOf(w) {
    var c = J("ie-map:" + w.sid);
    if (!c) c = { type: w.type, wid: w.wid, enabled: true, view: null, places: [], driver: null, zoneKm: 10, routeInfo: null };
    c.view = Object.assign({ proj: "globe", style: "dark", pitch: 45, bearing: 0, fog: true, search: true, traffic: false, buildings: false, pin: "#8b5cf6", height: 320 }, c.view || {});
    return c;
  }
  var STYLES = { dark: STYLE, satellite: "mapbox://styles/mapbox/satellite-streets-v12", standard: "mapbox://styles/mapbox/standard" };
  function hostOf(root) {
    var best = null, ba = 0, rr = root.getBoundingClientRect();
    Array.prototype.forEach.call(root.querySelectorAll("svg,canvas,[class*='map' i],[class*='Map']"), function (e) {
      if (e.closest("[data-ie-map]") || e.closest("button")) return;
      var t = /^(svg|canvas)$/i.test(e.tagName) ? e.parentElement : e; if (!t || t === root) return;
      var b = t.getBoundingClientRect(), a = b.width * b.height;
      if (b.width >= 160 && b.height >= 110 && a < rr.width * rr.height * 0.95 && a > ba) { ba = a; best = t; }
    });
    return best;
  }
  function applyView(box, c) {
    var m = box.__m, v = c.view, mb = box.ownerDocument.defaultView.mapboxgl;
    var sig = JSON.stringify(v);
    if (box.__vs === sig) return; var prev = box.__vs ? JSON.parse(box.__vs) : {}; box.__vs = sig;
    if (box.__inline) box.style.height = (+v.height || 320) + "px";
    if (prev.style && prev.style !== v.style) { box.__ready = false; m.setStyle(STYLES[v.style] || STYLE); return; }
    try { m.setProjection(v.proj === "flat" ? "mercator" : "globe"); } catch (e) {}
    m.easeTo({ pitch: +v.pitch || 0, bearing: +v.bearing || 0, duration: 400 });
    try { m.setFog(v.fog ? { color: "rgb(12,12,20)", "high-color": "rgb(36,92,223)", "horizon-blend": 0.03, "space-color": "rgb(5,5,12)", "star-intensity": 0.6 } : null); } catch (e) {}
    if (m.getLayer("ie-traffic")) m.removeLayer("ie-traffic"); if (m.getSource("ie-traffic")) m.removeSource("ie-traffic");
    if (v.traffic) { m.addSource("ie-traffic", { type: "vector", url: "mapbox://mapbox.mapbox-traffic-v1" }); m.addLayer({ id: "ie-traffic", type: "line", source: "ie-traffic", "source-layer": "traffic", paint: { "line-width": 2, "line-color": ["match", ["get", "congestion"], "low", "#22c55e", "moderate", "#f59e0b", "heavy", "#ef4444", "severe", "#7f1d1d", "#64748b"] } }); }
    if (m.getLayer("ie-3d")) m.removeLayer("ie-3d");
    if (v.buildings && v.style !== "standard" && m.getSource("composite")) { try { m.addLayer({ id: "ie-3d", source: "composite", "source-layer": "building", filter: ["==", "extrude", "true"], type: "fill-extrusion", minzoom: 14, paint: { "fill-extrusion-color": "#3f3f46", "fill-extrusion-height": ["get", "height"], "fill-extrusion-base": ["get", "min_height"], "fill-extrusion-opacity": 0.8 } }); } catch (e) {} }
    var sb = box.querySelector("[data-ie-map-search]"); if (sb) sb.style.display = v.search ? "" : "none";
  }
  function save(w, c) { S("ie-map:" + w.sid, c); c.__v = Date.now(); bump[w.sid] = (bump[w.sid] || 0) + 1; }
  var bump = {};

  // ---- geo helpers ----
  function geocode(q) {
    return fetch("https://api.mapbox.com/geocoding/v5/mapbox.places/" + encodeURIComponent(q) + ".json?limit=1&access_token=" + TOKEN)
      .then(function (r) { return r.json(); }).then(function (d) { var f = d.features && d.features[0]; if (!f) throw new Error("Address not found"); return { lng: f.center[0], lat: f.center[1], address: f.place_name }; });
  }
  function routeOf(pts) {
    var q = pts.map(function (p) { return p.lng + "," + p.lat; }).join(";");
    return fetch("https://api.mapbox.com/directions/v5/mapbox/driving/" + q + "?geometries=geojson&overview=full&access_token=" + TOKEN)
      .then(function (r) { return r.json(); }).then(function (d) { var r = d.routes && d.routes[0]; if (!r) throw new Error("No route"); return { geo: r.geometry, km: r.distance / 1000, min: r.duration / 60 }; });
  }
  function km(a, b) { var R = 6371, t = Math.PI / 180, dl = (b.lat - a.lat) * t, dn = (b.lng - a.lng) * t, x = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dn / 2) * Math.sin(dn / 2); return 2 * R * Math.asin(Math.sqrt(x)); }
  function circle(c, r) { var pts = []; for (var i = 0; i <= 64; i++) { var a = i / 64 * 2 * Math.PI; pts.push([c.lng + (r / (111.32 * Math.cos(c.lat * Math.PI / 180))) * Math.cos(a), c.lat + (r / 110.574) * Math.sin(a)]); } return pts; }

  // ---- mapbox loading per document (top window or widget iframe) ----
  function ensureLib(win, cb) {
    if (win.mapboxgl) return cb();
    var d = win.document;
    if (!d.getElementById("ie-mbx-css")) { var l = d.createElement("link"); l.id = "ie-mbx-css"; l.rel = "stylesheet"; l.href = CDN + ".css"; d.head.appendChild(l); }
    var s = d.getElementById("ie-mbx-js");
    if (!s) { s = d.createElement("script"); s.id = "ie-mbx-js"; s.src = CDN + ".js"; d.head.appendChild(s); }
    s.addEventListener("load", function () { cb(); });
  }

  // ---- drawing ----
  function pin(win, color, label) {
    var e = win.document.createElement("div");
    e.style.cssText = "width:16px;height:16px;border-radius:50%;background:" + color + ";border:2px solid #fff;box-shadow:0 0 12px " + color;
    if (label) e.title = label; return e;
  }
  function draw(box, c) {
    var win = box.ownerDocument.defaultView, mb = win.mapboxgl, m = box.__m;
    (box.__mk || []).forEach(function (x) { x.remove(); }); box.__mk = [];
    ["ie-route", "ie-zone"].forEach(function (id) { if (m.getLayer(id + "-l")) m.removeLayer(id + "-l"); if (m.getLayer(id + "-f")) m.removeLayer(id + "-f"); if (m.getSource(id)) m.removeSource(id); });
    var pts = c.places.slice(), info = box.querySelector("[data-ie-map-info]");
    c.places.forEach(function (p, i) {
      var html = "<b>" + (p.name || "Place") + "</b><br>" + (p.address || "") + (p.hours ? "<br>" + p.hours : "") + (p.radiusKm ? "<br>Covers " + p.radiusKm + " km" : "");
      var col = c.type === "route" || c.type === "tracker" ? (i === 0 ? "#22c55e" : i === c.places.length - 1 ? "#ef4444" : "#a78bfa") : (c.view && c.view.pin) || "#8b5cf6";
      box.__mk.push(new mb.Marker({ element: pin(win, col, p.name) }).setLngLat([p.lng, p.lat]).setPopup(new mb.Popup({ offset: 12 }).setHTML(html)).addTo(m));
    });
    var feats = [];
    if (c.type === "coverage") c.places.forEach(function (p) { if (p.radiusKm) feats.push({ type: "Feature", geometry: { type: "Polygon", coordinates: [circle(p, +p.radiusKm)] } }); });
    if (c.type === "confirm" && c.places[0]) feats.push({ type: "Feature", geometry: { type: "Polygon", coordinates: [circle(c.places[0], +c.zoneKm || 10)] } });
    if (feats.length) {
      m.addSource("ie-zone", { type: "geojson", data: { type: "FeatureCollection", features: feats } });
      m.addLayer({ id: "ie-zone-f", type: "fill", source: "ie-zone", paint: { "fill-color": "#8b5cf6", "fill-opacity": 0.18 } });
      m.addLayer({ id: "ie-zone-l", type: "line", source: "ie-zone", paint: { "line-color": "#a78bfa", "line-width": 1.5 } });
    }
    if (c.driver && c.driver.lat != null) {
      box.__mk.push(new mb.Marker({ element: pin(win, "#14b8a6", c.driver.name) }).setLngLat([c.driver.lng, c.driver.lat]).setPopup(new mb.Popup({ offset: 12 }).setHTML("<b>" + (c.driver.name || "Driver") + "</b><br>" + (c.driver.status || ""))).addTo(m));
      pts.push(c.driver);
    }
    if (c.customer) { box.__mk.push(new mb.Marker({ element: pin(win, "#f59e0b", "Delivery address") }).setLngLat([c.customer.lng, c.customer.lat]).addTo(m)); pts.push(c.customer); }
    var txt = "";
    if ((c.type === "route" || c.type === "tracker") && c.places.length >= 2) {
      var key = c.places.map(function (p) { return p.lng + "," + p.lat; }).join(";");
      var go = function (r) {
        if (!m.getSource("ie-route")) { m.addSource("ie-route", { type: "geojson", data: r.geo }); m.addLayer({ id: "ie-route-l", type: "line", source: "ie-route", paint: { "line-color": "#14b8a6", "line-width": 4 } }); }
        if (info) info.textContent = (c.type === "route" ? "Route: " : "Delivery route: ") + r.km.toFixed(1) + " km • about " + Math.round(r.min) + " min drive" + (c.driver && c.driver.status ? " • " + c.driver.status : "");
      };
      if (box.__rk === key && box.__r) go(box.__r); else routeOf(c.places).then(function (r) { box.__rk = key; box.__r = r; go(r); }).catch(function () { if (info) info.textContent = "Couldn't plan a route between these places."; });
    } else if (c.type === "confirm") {
      txt = c.places[0] ? (c.customer ? (km(c.places[0], c.customer) <= (+c.zoneKm || 10) ? "We deliver to this address (" + km(c.places[0], c.customer).toFixed(1) + " km)." : "Sorry, this address is outside our " + c.zoneKm + " km delivery area.") : "Tap the map to set your delivery address.") : "Add your store in the Content tab.";
    } else if (c.type === "coverage") txt = c.places.length + " warehouse" + (c.places.length === 1 ? "" : "s") + " • tap a pin for details";
    else if (c.type === "locator") txt = c.places.length + " location" + (c.places.length === 1 ? "" : "s");
    else if (c.type === "tracker") txt = c.driver ? (c.driver.name || "Driver") + " • " + (c.driver.status || "") : "Add a pickup and a delivery stop in the Content tab.";
    if (info && txt) info.textContent = txt;
    if (!c.places.length && !txt && info) info.textContent = "Add your places in the Content tab.";
    if (pts.length === 1) m.jumpTo({ center: [pts[0].lng, pts[0].lat], zoom: 12 });
    else if (pts.length > 1) { var b = new mb.LngLatBounds(); pts.forEach(function (p) { b.extend([p.lng, p.lat]); }); m.fitBounds(b, { padding: 50, maxZoom: 13, duration: 0 }); }
  }
  function mount(root, w) {
    var c = cfgOf(w), box = root.querySelector(":scope > [data-ie-map]");
    if (!box) box = root.querySelector("[data-ie-map='" + w.sid + "']");
    if (!c.enabled) { if (box) { if (box.__host) box.__host.style.visibility = ""; box.remove(); } return; }
    var win = root.ownerDocument.defaultView;
    if (!box) {
      box = root.ownerDocument.createElement("div"); box.setAttribute("data-ie-map", w.sid);
      box.style.cssText = "position:relative;width:100%;height:320px;border-radius:20px;overflow:hidden;margin-top:12px;border:1px solid #27272a;background:#0b0b0c";
      var mapEl = root.ownerDocument.createElement("div"); mapEl.style.cssText = "position:absolute;inset:0";
      var inf = root.ownerDocument.createElement("div"); inf.setAttribute("data-ie-map-info", "1");
      inf.style.cssText = "position:absolute;left:10px;bottom:10px;z-index:2;padding:6px 10px;border-radius:10px;background:rgba(9,9,11,.85);color:#e4e4e7;font:12px system-ui;max-width:80%";
      box.appendChild(mapEl); box.appendChild(inf);
      var sr = root.ownerDocument.createElement("input"); sr.setAttribute("data-ie-map-search", "1"); sr.placeholder = "Search address";
      sr.style.cssText = "position:absolute;left:10px;top:10px;z-index:3;width:min(240px,70%);height:30px;border-radius:10px;border:1px solid #3f3f46;background:rgba(9,9,11,.88);color:#e4e4e7;font:12px system-ui;padding:0 10px;outline:none";
      sr.addEventListener("keydown", function (e) { e.stopPropagation(); if (e.key === "Enter" && sr.value.trim() && box.__m) geocode(sr.value.trim()).then(function (g) { box.__m.flyTo({ center: [g.lng, g.lat], zoom: 14, pitch: +c.view.pitch || 0, duration: 1800 }); }).catch(function () {}); });
      ["mousedown", "dblclick", "click"].forEach(function (ev) { sr.addEventListener(ev, function (e) { e.stopPropagation(); }); });
      box.appendChild(sr);
      var host = hostOf(root);
      if (host) {
        if (root.ownerDocument.defaultView.getComputedStyle(host).position === "static") host.style.position = "relative";
        box.style.cssText = "position:absolute;inset:0;z-index:5;overflow:hidden;border-radius:inherit;background:#0b0b0c";
        box.__host = host; host.appendChild(box);
      } else { box.__inline = true; root.appendChild(box); }
      ensureLib(win, function () {
        if (box.__m) return;
        win.mapboxgl.accessToken = TOKEN;
        var m = box.__m = new win.mapboxgl.Map({ container: mapEl, style: STYLES[c.view.style] || STYLE, projection: c.view.proj === "flat" ? "mercator" : "globe", pitch: +c.view.pitch || 0, bearing: +c.view.bearing || 0, center: [-81.38, 28.54], zoom: 2.2, attributionControl: false });
        m.on("style.load", function () { box.__ready = true; box.__v = -1; box.__vs = null; box.__rk = null; });
        m.on("click", function (e) {
          var cc = cfgOf(w); if (cc.type !== "confirm") return;
          cc.customer = { lng: e.lngLat.lng, lat: e.lngLat.lat }; save(w, cc);
        });
      });
    }
    if (box.__ready) { try { applyView(box, c); } catch (e) {} }
    if (box.__ready && box.__v !== (bump[w.sid] || 0)) { box.__v = bump[w.sid] || 0; try { draw(box, c); } catch (e) {} }
  }
  function docs() {
    var out = [document];
    Array.prototype.forEach.call(document.querySelectorAll("iframe"), function (f) { try { if (f.contentDocument && f.contentDocument.body) out.push(f.contentDocument); } catch (e) {} });
    return out;
  }
  function tick() {
    docs().forEach(function (d) {
      Array.prototype.forEach.call(d.querySelectorAll("[data-ie-root]"), function (root) {
        var w = widgetOf(root); if (w) mount(root, w);
      });
    });
  }
  setInterval(tick, 1200);

  // ---- live GPS for drivers (this device) ----
  var watch = {};
  function gps(w, on) {
    if (watch[w.sid] != null) { navigator.geolocation.clearWatch(watch[w.sid]); delete watch[w.sid]; }
    if (!on || !navigator.geolocation) return;
    watch[w.sid] = navigator.geolocation.watchPosition(function (p) {
      var c = cfgOf(w); c.driver = c.driver || { name: "Driver", status: "On the way" };
      c.driver.lat = p.coords.latitude; c.driver.lng = p.coords.longitude; c.driver.at = Date.now(); save(w, c);
    }, function () {}, { enableHighAccuracy: true });
  }

  // ---- Content tab controller ----
  var L = "font:500 10px system-ui;text-transform:uppercase;letter-spacing:.04em;color:#71717a;margin:10px 0 4px";
  var BTN = "height:28px;border-radius:10px;background:#27272a;color:#e4e4e7;font:11px system-ui;border:1px solid #3f3f46;cursor:pointer;padding:0 8px";
  var INP = "width:100%;height:30px;border-radius:10px;background:#09090b;border:1px solid #27272a;color:#e4e4e7;font:12px system-ui;padding:0 8px;box-sizing:border-box;margin-top:6px";
  function h(tag, a, kids) { var e = document.createElement(tag); for (var k in a || {}) { if (k === "style") e.style.cssText = a[k]; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), a[k]); else e.setAttribute(k, a[k]); } (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return e; }
  function note(p, t, col) { p.appendChild(h("div", { style: "font:11px system-ui;color:" + (col || "#a1a1aa") + ";margin-top:6px;line-height:1.4" }, [t])); }

  window.__IEMapWidget = function (tg) {
    if (!tg) return null;
    if (tg.kind === "dom") return widgetOf(tg.el);
    var id = tg.node && tg.node.id, m = id && id.match(/^sec_(.+)_[^_]+$/);
    if (m && typeOf(m[1])) return { sid: id, wid: m[1], type: typeOf(m[1]) };
    if (id) { var el = document.querySelector('[data-id="' + id + '"]'); var w = el && widgetOf(el); if (w) return w; var f = el && el.querySelector("iframe"); try { var r = f && f.contentDocument.querySelector("[data-ie-root]"); if (r) return widgetOf(r); } catch (e) {} }
    return null;
  };
  window.__IEMapPanel = function (box, tg, refresh) {
    var w = window.__IEMapWidget(tg); if (!w) return;
    var c = cfgOf(w), T = TYPES[w.type], first = !J("ie-map:" + w.sid);
    var wrap = h("div", { style: "margin-top:12px;padding-top:10px;border-top:1px solid #27272a" });
    box.appendChild(wrap);
    wrap.appendChild(h("div", { style: "font:600 11px system-ui;color:#c4b5fd" }, ["Map • " + T.label]));
    function commit() { save(w, c); refresh && refresh(); }
    var en = h("input", { type: "checkbox" }); en.checked = c.enabled;
    en.addEventListener("change", function () { c.enabled = en.checked; commit(); });
    wrap.appendChild(h("label", { style: "display:flex;gap:6px;align-items:center;font:12px system-ui;color:#e4e4e7;margin-top:8px" }, [en, "Show a live map in this widget"]));

    // view & style controls
    var V = c.view;
    wrap.appendChild(h("div", { style: L }, ["Map look"]));
    var sty = h("select", { style: INP }); [["dark", "Dark globe"], ["satellite", "Satellite streets"], ["standard", "3D city"]].forEach(function (o) { var e = h("option", { value: o[0] }, [o[1]]); if (V.style === o[0]) e.selected = true; sty.appendChild(e); });
    sty.addEventListener("change", function () { V.style = sty.value; commit(); }); wrap.appendChild(sty);
    var pr = h("select", { style: INP }); [["globe", "3D globe"], ["flat", "Flat map"]].forEach(function (o) { var e = h("option", { value: o[0] }, [o[1]]); if (V.proj === o[0]) e.selected = true; pr.appendChild(e); });
    pr.addEventListener("change", function () { V.proj = pr.value; commit(); }); wrap.appendChild(pr);
    function slider(label, key, min, max) {
      var lab = h("div", { style: "font:11px system-ui;color:#a1a1aa;margin-top:8px" }, [label + ": " + V[key]]);
      var r = h("input", { type: "range", min: String(min), max: String(max), value: String(V[key]), style: "width:100%" });
      r.addEventListener("input", function () { V[key] = +r.value; lab.textContent = label + ": " + r.value; save(w, c); });
      wrap.appendChild(lab); wrap.appendChild(r);
    }
    slider("Tilt", "pitch", 0, 85); slider("Rotation", "bearing", -180, 180); slider("Height (when below the widget)", "height", 180, 720);
    function tog(label, key) { var cb = h("input", { type: "checkbox" }); cb.checked = !!V[key]; cb.addEventListener("change", function () { V[key] = cb.checked; save(w, c); }); wrap.appendChild(h("label", { style: "display:flex;gap:6px;align-items:center;font:12px system-ui;color:#e4e4e7;margin-top:6px" }, [cb, label])); }
    tog("Space & atmosphere", "fog"); tog("Address search on the map", "search"); tog("Live traffic", "traffic"); tog("3D buildings", "buildings");
    var pc = h("input", { type: "color", value: V.pin, style: "width:40px;height:24px;border:0;background:none;cursor:pointer" });
    pc.addEventListener("input", function () { V.pin = pc.value; save(w, c); });
    wrap.appendChild(h("label", { style: "display:flex;gap:8px;align-items:center;font:12px system-ui;color:#e4e4e7;margin-top:6px" }, [pc, "Pin color"]));

    // places list
    wrap.appendChild(h("div", { style: L }, [w.type === "tracker" ? "Stops (first = pickup, last = delivery)" : w.type === "route" ? "Stops in order" : w.type === "coverage" ? "Your warehouses" : "Your locations"]));
    if (!c.places.length) note(wrap, "No places yet. Add your own below.");
    c.places.forEach(function (p, i) {
      var row = h("div", { style: "display:flex;gap:6px;align-items:center;margin-top:4px;padding:6px 8px;border-radius:10px;background:#09090b;border:1px solid #27272a" });
      row.appendChild(h("div", { style: "flex:1;min-width:0;font:12px system-ui;color:#e4e4e7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap", title: p.address }, [(i + 1) + ". " + p.name + (p.radiusKm ? " • " + p.radiusKm + " km" : "")]));
      if (i > 0 && (w.type === "route" || w.type === "tracker")) row.appendChild(h("button", { style: BTN, title: "Move up", onclick: function () { var t = c.places[i - 1]; c.places[i - 1] = p; c.places[i] = t; commit(); } }, ["Up"]));
      row.appendChild(h("button", { style: BTN, onclick: function () { c.places.splice(i, 1); commit(); } }, ["Remove"]));
      wrap.appendChild(row);
    });
    var nm = h("input", { style: INP, placeholder: "Name (e.g. " + (w.type === "coverage" ? "North warehouse" : "Downtown store") + ")" });
    var ad = h("input", { style: INP, placeholder: "Address" });
    var ex = h("input", { style: INP, placeholder: w.type === "coverage" ? "Covers how many km" : "Opening hours (optional)" });
    wrap.appendChild(nm); wrap.appendChild(ad); if (w.type === "coverage" || w.type === "locator") wrap.appendChild(ex);
    var msg = h("div"); 
    wrap.appendChild(h("button", { style: BTN + ";margin-top:6px;width:100%", onclick: function () {
      if (!ad.value.trim()) return;
      msg.textContent = "Finding address…";
      geocode(ad.value.trim()).then(function (g) {
        var p = { name: nm.value.trim() || g.address.split(",")[0], address: g.address, lat: g.lat, lng: g.lng };
        if (w.type === "coverage") p.radiusKm = +ex.value || 25; else if (ex.value) p.hours = ex.value;
        c.places.push(p); c.enabled = true; commit();
      }).catch(function (e) { msg.textContent = e.message; });
    } }, ["Add place"]));
    msg.style.cssText = "font:11px system-ui;color:#a1a1aa;margin-top:4px"; wrap.appendChild(msg);

    // type-specific controls
    if (w.type === "tracker" || w.type === "route") {
      wrap.appendChild(h("div", { style: L }, [w.type === "route" ? "Driver" : "Driver & status"]));
      var d = c.driver || {};
      var dn = h("input", { style: INP, placeholder: "Driver name", value: d.name || "" });
      var st = h("select", { style: INP });
      ["Preparing", "Picked up", "On the way", "Arriving", "Delivered"].forEach(function (s) { var o = h("option", { value: s }, [s]); if (s === d.status) o.selected = true; st.appendChild(o); });
      var da = h("input", { style: INP, placeholder: "Driver's current address (or use GPS below)" });
      wrap.appendChild(dn); wrap.appendChild(st); wrap.appendChild(da);
      wrap.appendChild(h("button", { style: BTN + ";margin-top:6px;width:100%", onclick: function () {
        c.driver = c.driver || {}; c.driver.name = dn.value.trim() || "Driver"; c.driver.status = st.value;
        if (da.value.trim()) geocode(da.value.trim()).then(function (g) { c.driver.lat = g.lat; c.driver.lng = g.lng; commit(); }).catch(function (e) { msg.textContent = e.message; });
        else commit();
      } }, ["Update driver"]));
      var gp = h("input", { type: "checkbox" }); gp.checked = watch[w.sid] != null;
      gp.addEventListener("change", function () { gps(w, gp.checked); });
      wrap.appendChild(h("label", { style: "display:flex;gap:6px;align-items:center;font:12px system-ui;color:#e4e4e7;margin-top:8px" }, [gp, "Track live from this device's GPS"]));
      note(wrap, "Turn this on from the driver's phone to show their real position.");
    }
    if (w.type === "confirm") {
      wrap.appendChild(h("div", { style: L }, ["Delivery area (km around your first location)"]));
      var zk = h("input", { style: INP, type: "number", min: "1", value: String(c.zoneKm || 10) });
      zk.addEventListener("change", function () { c.zoneKm = +zk.value || 10; commit(); });
      wrap.appendChild(zk);
      note(wrap, "Shoppers tap the map to check if you deliver to them.");
    }

    // import from Database tab
    var tables = (window.__IE && window.__IE.tableData) || [];
    wrap.appendChild(h("div", { style: L }, ["Load places from a table"]));
    var ts = h("select", { style: INP }); ts.appendChild(h("option", { value: "" }, [tables.length ? "Pick a table" : "No tables yet (Database tab)"]));
    tables.forEach(function (t, i) { ts.appendChild(h("option", { value: String(i) }, [t.name || "Table " + (i + 1)])); });
    ts.addEventListener("change", function () {
      var t = tables[+ts.value]; if (!t) return;
      var rows = t.rows || t.data || [], cols = (t.columns || []).map(function (x) { return typeof x === "string" ? x : x.name; });
      if (!cols.length && rows[0]) cols = Object.keys(rows[0]);
      var f = function (re) { return cols.filter(function (k) { return re.test(k); })[0]; };
      var nk = f(/name|title/i), ak = f(/address|location|city/i), la = f(/^lat/i), lo = f(/^(lng|lon)/i);
      if (!rows.length || (!ak && !(la && lo))) { msg.textContent = "This table needs an address column, or lat and lng columns."; return; }
      msg.textContent = "Loading " + rows.length + " places…";
      Promise.all(rows.slice(0, 50).map(function (r) {
        var name = String(r[nk] || r[ak] || "Place");
        if (la && lo && r[la] != null) return Promise.resolve({ name: name, address: ak ? String(r[ak]) : "", lat: +r[la], lng: +r[lo] });
        return geocode(String(r[ak])).then(function (g) { return { name: name, address: g.address, lat: g.lat, lng: g.lng }; }).catch(function () { return null; });
      })).then(function (ps) { ps.filter(Boolean).forEach(function (p) { if (w.type === "coverage") p.radiusKm = 25; c.places.push(p); }); c.enabled = true; commit(); });
    });
    wrap.appendChild(ts);
  };
})();
