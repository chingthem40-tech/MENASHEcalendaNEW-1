/**
 * scripts/generate-scene-models.mjs
 *
 * Phase 2 — Generate scene GLB assets using Three.js geometry.
 * Run once (or whenever geometry changes) to produce compressed models
 * served from /public/models/.
 *
 * Usage:
 *   node scripts/generate-scene-models.mjs
 *
 * Output:
 *   artifacts/menashe-calendar/public/models/olive-tree.glb
 *   artifacts/menashe-calendar/public/models/stone-bench.glb
 *   artifacts/menashe-calendar/public/models/stone-arch.glb
 *
 * Models are designed to be swapped with photogrammetry or hand-crafted GLBs
 * without changing any scene code — just replace the file.
 */
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { writeFileSync, mkdirSync } from "fs";
import { Buffer } from "buffer";

/* ── Node.js polyfills required by GLTFExporter ─────────────────────────── */

// FileReader polyfill
globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buf => {
      this.result = buf;
      if (this.onload) this.onload({ target: { result: buf } });
    }).catch(err => { if (this.onerror) this.onerror(err); });
  }
  readAsText(blob, encoding = "utf8") {
    blob.text().then(txt => {
      this.result = txt;
      if (this.onload) this.onload({ target: { result: txt } });
    }).catch(err => { if (this.onerror) this.onerror(err); });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then(buf => {
      const b64 = Buffer.from(buf).toString("base64");
      const result = `data:${blob.type || "application/octet-stream"};base64,${b64}`;
      this.result = result;
      if (this.onload) this.onload({ target: { result } });
    }).catch(err => { if (this.onerror) this.onerror(err); });
  }
};

globalThis.Blob = class Blob {
  constructor(chunks = [], opts = {}) {
    this._buf = Buffer.concat(
      chunks.map((c) =>
        Buffer.isBuffer(c) ? c
        : c instanceof ArrayBuffer ? Buffer.from(c)
        : ArrayBuffer.isView(c) ? Buffer.from(c.buffer, c.byteOffset, c.byteLength)
        : Buffer.from(String(c), opts.encoding || "utf8"),
      ),
    );
    this.size = this._buf.length;
    this.type = opts.type || "";
  }
  arrayBuffer() {
    const b = this._buf;
    return Promise.resolve(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  }
  text() { return Promise.resolve(this._buf.toString("utf8")); }
};
globalThis.URL = { createObjectURL: () => "blob:", revokeObjectURL: () => {} };

/* ── Export helper ───────────────────────────────────────────────────────── */
function exportGLB(object, outPath) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      object,
      (result) => {
        writeFileSync(outPath, Buffer.from(result));
        const kb = (result.byteLength / 1024).toFixed(1);
        console.log(`  ✓ ${outPath}  (${kb} KB)`);
        resolve();
      },
      reject,
      { binary: true },
    );
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   OLIVE TREE — mature, multi-branched, high-detail
══════════════════════════════════════════════════════════════════════════ */
function buildOliveTree() {
  const root = new THREE.Group();
  root.name = "OliveTree";

  const trunkMat = new THREE.MeshStandardMaterial({
    name: "Trunk", color: new THREE.Color("#3d2810"), roughness: 0.96, metalness: 0,
  });
  const leaf1Mat = new THREE.MeshStandardMaterial({
    name: "Leaves1", color: new THREE.Color("#3a5a22"), roughness: 0.85, metalness: 0,
  });
  const leaf2Mat = new THREE.MeshStandardMaterial({
    name: "Leaves2", color: new THREE.Color("#4d7a30"), roughness: 0.82, metalness: 0,
  });
  const leaf3Mat = new THREE.MeshStandardMaterial({
    name: "Leaves3", color: new THREE.Color("#5e8840"), roughness: 0.80, metalness: 0,
  });

  // ── Gnarled main trunk (twisted CylinderGeometry) ──
  const trunkGeo = new THREE.CylinderGeometry(0.09, 0.27, 2.9, 10, 6, false);
  const tPos = trunkGeo.attributes.position;
  for (let i = 0; i < tPos.count; i++) {
    const y = (tPos.getY(i) / 2.9 + 0.5);   // 0→1
    const twist = Math.sin(y * Math.PI * 2.1) * 0.09;
    const bulge = Math.sin(y * Math.PI) * 0.04;
    tPos.setX(i, tPos.getX(i) * (1 + bulge) + twist);
    tPos.setZ(i, tPos.getZ(i) * (1 + bulge * 0.7));
  }
  trunkGeo.computeVertexNormals();
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.45;
  trunk.castShadow = trunk.receiveShadow = true;
  root.add(trunk);

  // ── Root flares at base ──
  [0, 72, 144, 216, 288].forEach((deg) => {
    const a = (deg * Math.PI) / 180;
    const g = new THREE.CylinderGeometry(0.03, 0.14, 0.7, 6);
    const m = new THREE.Mesh(g, trunkMat);
    m.position.set(Math.cos(a) * 0.12, 0.35, Math.sin(a) * 0.12);
    m.rotation.set(0, 0, Math.atan2(Math.sin(a) * 0.25, 0.35));
    m.castShadow = true;
    root.add(m);
  });

  // ── 5 main branches spreading out ──
  const branchData = [
    { a: 0.0,   h: 2.55, tilt: 0.38, len: 1.7 },
    { a: 1.26,  h: 2.75, tilt: 0.32, len: 1.5 },
    { a: 2.51,  h: 2.45, tilt: 0.42, len: 1.6 },
    { a: 3.77,  h: 2.65, tilt: 0.36, len: 1.55 },
    { a: 5.03,  h: 2.85, tilt: 0.28, len: 1.4 },
  ];
  branchData.forEach(({ a, h, tilt, len }) => {
    const g = new THREE.CylinderGeometry(0.025, 0.07, len, 8);
    const m = new THREE.Mesh(g, trunkMat);
    m.position.set(Math.cos(a) * 0.18, h, Math.sin(a) * 0.18);
    m.rotation.set(tilt * Math.sin(a + 0.4), a, tilt * Math.cos(a + 0.4));
    m.castShadow = true;
    root.add(m);

    // Each branch has 2–3 secondary branches
    for (let j = 0; j < 3; j++) {
      const sa = a + (j - 1) * 0.55;
      const sg = new THREE.CylinderGeometry(0.012, 0.026, 0.85, 6);
      const sm = new THREE.Mesh(sg, trunkMat);
      sm.position.set(
        m.position.x + Math.cos(a) * len * 0.42,
        h + len * 0.38 + j * 0.06,
        m.position.z + Math.sin(a) * len * 0.35,
      );
      sm.rotation.set(tilt * 0.7 * Math.sin(sa), sa, tilt * 0.7 * Math.cos(sa));
      sm.castShadow = true;
      root.add(sm);
    }
  });

  // ── 12-sphere canopy with natural variation ──
  const canopy = [
    [0,   4.95, 0,    1.72, leaf1Mat],
    [0.9, 4.35, 0.7,  1.30, leaf2Mat],
    [-0.8,4.55, 0.55, 1.25, leaf1Mat],
    [0.4, 5.65, -0.45,1.15, leaf2Mat],
    [-0.55,5.35,-0.38,1.10, leaf3Mat],
    [1.2, 4.85, -0.65,0.95, leaf1Mat],
    [-1.05,4.65,-0.52,0.92, leaf2Mat],
    [0,   3.88, 0,    0.85, leaf3Mat],
    [0.6, 4.0,  0.8,  0.78, leaf1Mat],
    [-0.6,4.1, -0.7,  0.76, leaf2Mat],
    [0.2, 5.2,  0.5,  0.70, leaf3Mat],
    [-0.3,5.0, -0.4,  0.68, leaf1Mat],
  ];
  canopy.forEach(([x, y, z, r, mat]) => {
    const g = new THREE.SphereGeometry(r, 11, 9);
    const m = new THREE.Mesh(g, mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    root.add(m);
  });

  return root;
}

/* ══════════════════════════════════════════════════════════════════════════
   STONE BENCH — Jerusalem limestone with bevels and base
══════════════════════════════════════════════════════════════════════════ */
function buildStoneBench() {
  const root = new THREE.Group();
  root.name = "StoneBench";

  const light = new THREE.MeshStandardMaterial({
    name: "LightStone", color: new THREE.Color("#d0c8b0"), roughness: 0.88, metalness: 0.04,
  });
  const dark = new THREE.MeshStandardMaterial({
    name: "DarkStone", color: new THREE.Color("#bcb4a0"), roughness: 0.90, metalness: 0.03,
  });

  // Base slab
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.09, 0.62), dark);
  base.position.y = 0.045;
  base.receiveShadow = true;
  root.add(base);

  // Legs (2 outer + 1 center)
  [[-0.68, 0], [0.68, 0], [0, 0]].forEach(([x, _], i) => {
    const isCenter = i === 2;
    const g = new THREE.BoxGeometry(isCenter ? 0.14 : 0.19, 0.43, 0.5);
    const m = new THREE.Mesh(g, dark);
    m.position.set(x, 0.24, 0);
    m.castShadow = m.receiveShadow = true;
    root.add(m);
  });

  // Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.17, 0.56), light);
  seat.position.y = 0.455;
  seat.castShadow = seat.receiveShadow = true;
  root.add(seat);

  // Seat front-edge bevel
  const bevel = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.065, 0.09), dark);
  bevel.position.set(0, 0.38, 0.285);
  root.add(bevel);

  // Seat back bevel
  const backBevel = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.065, 0.09), dark);
  backBevel.position.set(0, 0.38, -0.285);
  root.add(backBevel);

  // Armrest knobs at ends
  [-0.88, 0.88].forEach((x) => {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.12, 10), dark);
    knob.position.set(x, 0.56, 0);
    knob.castShadow = true;
    root.add(knob);
  });

  return root;
}

/* ══════════════════════════════════════════════════════════════════════════
   STONE ARCH — single bridge arch span
══════════════════════════════════════════════════════════════════════════ */
function buildStoneArch() {
  const root = new THREE.Group();
  root.name = "StoneArch";

  const mat = new THREE.MeshStandardMaterial({
    name: "ArchStone", color: new THREE.Color("#c8b888"), roughness: 0.82, metalness: 0.06,
  });
  const deckMat = new THREE.MeshStandardMaterial({
    name: "Deck", color: new THREE.Color("#d4c8a8"), roughness: 0.78, metalness: 0.04,
  });
  const parapet = new THREE.MeshStandardMaterial({
    name: "Parapet", color: new THREE.Color("#ccc0a0"), roughness: 0.80, metalness: 0.05,
  });

  const SPAN = 8, N = 13;
  for (let i = 0; i < N; i++) {
    const t = (i / (N - 1)) * Math.PI;
    const x = Math.cos(t - Math.PI / 2) * SPAN * 0.5;
    const y = Math.sin(t - Math.PI / 2) * 1.85 + 1.85;
    const m = new THREE.Mesh(new THREE.BoxGeometry(SPAN * 0.12, 0.58, 2.3), mat);
    m.position.set(x, y, 0);
    m.rotation.z = t - Math.PI / 2;
    m.castShadow = m.receiveShadow = true;
    root.add(m);
  }

  // Deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(SPAN, 0.30, 2.3), deckMat);
  deck.position.y = 0.82;
  deck.receiveShadow = true;
  root.add(deck);

  // Parapets
  [-1.1, 1.1].forEach((z) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(SPAN, 0.52, 0.24), parapet);
    p.position.set(0, 1.22, z);
    p.castShadow = true;
    root.add(p);
  });

  // 6 parapet posts per side
  for (let i = 0; i < 6; i++) {
    const x = (i / 5) * SPAN - SPAN / 2;
    [-1.1, 1.1].forEach((z) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.40, 0.24), parapet);
      post.position.set(x, 1.42, z);
      post.castShadow = true;
      root.add(post);
    });
  }

  // Abutments
  [-SPAN / 2, SPAN / 2].forEach((x) => {
    const ab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 2.5), mat);
    ab.position.set(x, 1.2, 0);
    ab.castShadow = ab.receiveShadow = true;
    root.add(ab);
  });

  return root;
}

/* ── Main ────────────────────────────────────────────────────────────────── */
const OUT_DIR = "./artifacts/menashe-calendar/public/models";
mkdirSync(OUT_DIR, { recursive: true });

console.log("\n🔨 Generating scene GLB models…\n");
await exportGLB(buildOliveTree(),   `${OUT_DIR}/olive-tree.glb`);
await exportGLB(buildStoneBench(),  `${OUT_DIR}/stone-bench.glb`);
await exportGLB(buildStoneArch(),   `${OUT_DIR}/stone-arch.glb`);
console.log("\n✅  All models ready. Serve from /models/*.glb\n");
