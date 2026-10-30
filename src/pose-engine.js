// Pose engine: a 2D figure defined by absolute segment angles (degrees, 0 = right, 90 = up).
// The same definition drives still drawings and (Phase 2) interpolated transitions.
(function (root) {
  const SEG = { torso: 50, neck: 9, head: 11.5, upper: 28, fore: 26, thigh: 44, shin: 42, foot: 13 };
  const FLOOR = 0; // joints rest one limb-radius above the drawn floor line (model y = -5)
  const rad = d => d * Math.PI / 180;
  const step = (p, ang, len) => ({ x: p.x + Math.cos(rad(ang)) * len, y: p.y + Math.sin(rad(ang)) * len });

  // defaults so pose definitions stay short
  const DEFAULT = { view: "side", t: 90, bend: 0, h: 90, aN: [-90, -90], aF: [-90, -90], lN: [-90, -90, 0], lF: [-90, -90, 0] };

  function full(p) { return Object.assign({}, DEFAULT, p); }

  function compute(pose, opt) {
    const p = full(pose);
    const HR = (opt && opt.head) || SEG.head;
    const width = p.view === "front" ? 1 : 0; // front view spreads shoulders and hips
    const w = p.width != null ? p.width : width;
    const hip = { x: 0, y: 0 };
    const sh = step(hip, p.t, SEG.torso);
    // perpendicular to torso, used for shoulder/hip spread in front view
    const perp = rad(p.t - 90);
    const off = (pt, d) => ({ x: pt.x + Math.cos(perp) * d, y: pt.y + Math.sin(perp) * d });
    const shN = off(sh, 12 * w), shF = off(sh, -12 * w);
    const hipN = off(hip, 7 * w), hipF = off(hip, -7 * w);
    const neck = step(sh, p.h, SEG.neck);
    const head = step(sh, p.h, SEG.neck + HR);
    const arm = (s, a) => { const e = step(s, a[0], SEG.upper); return [s, e, step(e, a[1], SEG.fore)]; };
    const leg = (h, l) => { const k = step(h, l[0], SEG.thigh); const an = step(k, l[1], SEG.shin); return [h, k, an, step(an, l[2], SEG.foot)]; };
    const J = { hip, sh, neck, head, hAng: p.h, armN: arm(shN, p.aN), armF: arm(shF, p.aF), legN: leg(hipN, p.lN), legF: leg(hipF, p.lF), bend: p.bend, t: p.t, w };
    // spine curve control point (positive bend bulges the front of the body)
    const mid = { x: (hip.x + sh.x) / 2, y: (hip.y + sh.y) / 2 };
    J.spineC = step(mid, p.t - 90, p.bend);
    // put the lowest point on the floor
    const pts = [hip, sh, ...J.armN, ...J.armF, ...J.legN, ...J.legF];
    let minY = Math.min(...pts.map(q => q.y), head.y - HR + 5); // head circle rests on the floor line
    const dy = FLOOR - minY + (pose.lift || 0);
    const all = [hip, sh, neck, head, J.spineC, ...J.armN, ...J.armF, ...J.legN, ...J.legF];
    // shoulder/hip offsets are separate objects inside the arrays; dedupe before shifting
    const seen = new Set();
    for (const q of all) { if (seen.has(q)) continue; seen.add(q); q.y += dy; }
    return J;
  }

  function bounds(J, HR) {
    HR = HR || SEG.head;
    const pts = [J.hip, J.sh, ...J.armN, ...J.armF, ...J.legN, ...J.legF];
    const xs = pts.map(p => p.x).concat([J.head.x - HR, J.head.x + HR]);
    const ys = pts.map(p => p.y).concat([J.head.y + HR]);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), maxY: Math.max(...ys) };
  }

  // shortest-path angle interpolation
  function lerpAng(a, b, t) { let d = ((b - a + 540) % 360) - 180; return a + d * t; }
  function lerp(a, b, t) {
    a = full(a); b = full(b);
    const L = (x, y) => x + (y - x) * t;
    const arr = (x, y) => x.map((v, i) => lerpAng(v, y[i], t));
    const wa = a.view === "front" ? 1 : 0, wb = b.view === "front" ? 1 : 0;
    return { view: "side", width: L(a.width != null ? a.width : wa, b.width != null ? b.width : wb), t: lerpAng(a.t, b.t, t), bend: L(a.bend, b.bend), h: lerpAng(a.h, b.h, t),
      aN: arr(a.aN, b.aN), aF: arr(a.aF, b.aF), lN: arr(a.lN, b.lN), lF: arr(a.lF, b.lF), lift: L(a.lift || 0, b.lift || 0) };
  }

  // SVG markup. Model y is up; SVG y is down. Fixed scale so all poses share one size.
  const VB = { w: 260, h: 230, floor: 210 };
  // Styles: "stick" (default line figure) and two mascot looks, "bean" and "cat".
  const STYLES = {
    stick: { head: SEG.head, arm: 8, leg: 10, torso: 15, torsoFront: 22, neck: 7,
      near: "var(--fig, #1d2b25)", far: "var(--fig-far, #8aa198)" },
    bean: { head: 15, arm: 11, leg: 13, torso: 24, torsoFront: 30, neck: 10, face: true,
      near: "var(--m-body, #5c9a82)", far: "var(--m-far, #a8ccbd)" },
    cat: { head: 18, arm: 13, leg: 15, torso: 30, torsoFront: 38, neck: 12, cat: true, line: "var(--cat-line, #24170f)", lw: 2.2,
      near: "var(--cat-body, #f2a157)", far: "var(--cat-shade, #de8a45)" },
  };
  function svgInner(pose, o) {
    o = o || {};
    const S = STYLES[o.style] || STYLES.stick;
    const J = compute(pose, { head: S.head });
    const b = bounds(J, S.head);
    const cx = VB.w / 2 - (b.minX + b.maxX) / 2;
    const X = p => (p.x + cx).toFixed(1), Y = p => (VB.floor - p.y).toFixed(1);
    const line = pts => pts.map((p, i) => (i ? "L" : "M") + X(p) + " " + Y(p)).join(" ");
    const front = J.w > 0.5;
    const nearC = S.near, farC = front ? nearC : S.far;
    const plain = (pts, c, sw) => `<path d="${line(pts)}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
    // contour: the same shape drawn a little wider in the line colour underneath, so every arm and leg reads clearly
    const limb = (pts, c, sw) => (S.line ? plain(pts, S.line, sw + 2 * S.lw) : "") + plain(pts, c, sw);
    const tw = front ? S.torsoFront : S.torso, tpath = `M${X(J.hip)} ${Y(J.hip)} Q${X(J.spineC)} ${Y(J.spineC)} ${X(J.sh)} ${Y(J.sh)}`;
    const torso = (S.line ? `<path d="${tpath}" fill="none" stroke="${S.line}" stroke-width="${tw + 2 * S.lw}" stroke-linecap="round"/>` : "") + `<path d="${tpath}" fill="none" stroke="${nearC}" stroke-width="${tw}" stroke-linecap="round"/>`;
    const neck = plain([J.sh, J.neck], nearC, S.neck);
    const r = S.head, c = J.head, hA = J.hAng;
    const at = (base, ang, d) => step(base, ang, d);
    let ears = "", face = "", tail = "";
    if (S.ears && !S.cat) {
      const ear = s => { const a = at(c, hA + 30 * s, r * 0.95), b2 = at(c, hA + 62 * s, r * 0.95), tip = at(c, hA + 40 * s, r * 1.55);
        return `<path d="M${X(a)} ${Y(a)} L${X(tip)} ${Y(tip)} L${X(b2)} ${Y(b2)} Z" fill="${nearC}" stroke="${nearC}" stroke-width="3" stroke-linejoin="round"/>`; };
      ears = ear(1) + ear(-1);
    }
    if (S.tail && !S.cat && !front) {
      const t0 = J.hip, t1 = at(J.hip, J.t + 120, 30), t2 = at(J.hip, J.t + 70, 36);
      tail = `<path d="M${X(t0)} ${Y(t0)} Q${X(t1)} ${Y(t1)} ${X(t2)} ${Y(t2)}" fill="none" stroke="${farC}" stroke-width="7" stroke-linecap="round"/>`;
    }
    if (S.face) {
      const ink = "var(--m-face, #2b211b)", blush = "var(--m-blush, #f08a8a)";
      const dot = (p, rr, col) => `<circle cx="${X(p)}" cy="${Y(p)}" r="${rr}" fill="${col}"/>`;
      if (front) {
        const fwd = hA - 90;
        [1, -1].forEach(sg => {
          face += dot(at(at(c, fwd, r * 0.38 * sg), hA, r * 0.12), 2.1, ink);
          face += `<ellipse cx="${X(at(at(c, fwd, r * 0.55 * sg), hA, -r * 0.22))}" cy="${Y(at(at(c, fwd, r * 0.55 * sg), hA, -r * 0.22))}" rx="3" ry="1.8" fill="${blush}" opacity=".8"/>`;
        });
        const m0 = at(at(c, hA, -r * 0.3), fwd, -r * 0.14), m1 = at(at(c, hA, -r * 0.3), fwd, r * 0.14), mc = at(c, hA, -r * 0.45);
        face += `<path d="M${X(m0)} ${Y(m0)} Q${X(mc)} ${Y(mc)} ${X(m1)} ${Y(m1)}" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>`;
      } else {
        const fwd = hA - 90; // the way the face points in profile
        face += dot(at(at(c, fwd, r * 0.5), hA, r * 0.12), 2.2, ink);
        face += `<ellipse cx="${X(at(at(c, fwd, r * 0.36), hA, -r * 0.3))}" cy="${Y(at(at(c, fwd, r * 0.36), hA, -r * 0.3))}" rx="3.2" ry="2" fill="${blush}" opacity=".8"/>`;
      }
    }
    let belly = "", shadow = "";
    if (S.cat) {
      const ink = "var(--cat-ink, #5a3420)", cream = "var(--cat-cream, #fde4b8)", pink = "var(--cat-pink, #f3a3a0)",
        cheek = "var(--cat-cheek, #f2867f)", tailC = "var(--cat-tail, #d97c36)";
      const ell = (p, rx, ry, ang, fill, extra) => `<ellipse cx="${X(p)}" cy="${Y(p)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${fill}" transform="rotate(${(-ang).toFixed(1)} ${X(p)} ${Y(p)})"${extra || ""}/>`;
      // ears with pink insides
      const ear = sg => {
        const a = at(c, hA + 18 * sg, r * 0.92), b2 = at(c, hA + 58 * sg, r * 0.92), tip = at(c, hA + 36 * sg, r * 1.5);
        const cen = { x: (a.x + b2.x + tip.x) / 3, y: (a.y + b2.y + tip.y) / 3 };
        const sh2 = q => ({ x: cen.x + (q.x - cen.x) * 0.5, y: cen.y + (q.y - cen.y) * 0.5 + 0 });
        const tri = (A, B, C, f, sw) => `<path d="M${X(A)} ${Y(A)} L${X(B)} ${Y(B)} L${X(C)} ${Y(C)} Z" fill="${f}" stroke="${f}" stroke-width="${sw}" stroke-linejoin="round"/>`;
        return (S.line ? tri(a, tip, b2, S.line, 5 + 2 * S.lw) : "") + tri(a, tip, b2, nearC, 5) + tri(sh2(a), sh2(tip), sh2(b2), pink, 2);
      };
      ears = ear(1) + ear(-1);
      // tail continues the spine past the hips and curls up
      const tp = front ? [at(J.hip, -40, 24), at(J.hip, -5, 40), at(J.hip, 25, 44)]
                       : [at(J.hip, J.t + 150, 22), at(J.hip, J.t + 118, 38), at(J.hip, J.t + 82, 40)];
      if (Math.min(...tp.map(q => q.y)) > 3) {
        const tpd = `M${X(J.hip)} ${Y(J.hip)} C${X(tp[0])} ${Y(tp[0])} ${X(tp[1])} ${Y(tp[1])} ${X(tp[2])} ${Y(tp[2])}`;
        tail = `<path d="${tpd}" fill="none" stroke="${S.line}" stroke-width="${9 + 2 * S.lw}" stroke-linecap="round"/><path d="${tpd}" fill="none" stroke="${tailC}" stroke-width="9" stroke-linecap="round"/>`;
      }
      // cream belly patch on the front of the torso
      const mid = { x: (J.hip.x + J.sh.x) / 2, y: (J.hip.y + J.sh.y) / 2 };
      const tl = Math.hypot(J.sh.x - J.hip.x, J.sh.y - J.hip.y);
      if (front) belly = ell(at(mid, J.t, -4), tl * 0.36, S.torsoFront * 0.3, J.t, cream);
      else {
        const bc = { x: (mid.x + J.spineC.x) / 2, y: (mid.y + J.spineC.y) / 2 };
        belly = ell(at(bc, J.t - 90, S.torso * 0.2), tl * 0.38, S.torso * 0.24, J.t, cream);
      }
      // face
      const fwd = hA - 90;
      const P = (f, u) => at(at(c, fwd, r * f), hA, r * u);
      const eye = q => `<circle cx="${X(q)}" cy="${Y(q)}" r="${(r * 0.13).toFixed(1)}" fill="${ink}"/>`;
      if (front) {
        face += eye(P(0.4, 0.08)) + eye(P(-0.4, 0.08));
        face += ell(P(0.62, -0.22), r * 0.17, r * 0.11, 0, cheek, ' opacity=".85"') + ell(P(-0.62, -0.22), r * 0.17, r * 0.11, 0, cheek, ' opacity=".85"');
        face += ell(P(0, -0.34), r * 0.36, r * 0.27, fwd, cream);
        face += ell(P(0, -0.2), r * 0.09, r * 0.065, fwd, ink);
        const m = (s1) => { const a = P(0, -0.3), b2 = P(0.2 * s1, -0.4), mc = P(0.1 * s1, -0.5); return `<path d="M${X(a)} ${Y(a)} Q${X(mc)} ${Y(mc)} ${X(b2)} ${Y(b2)}" fill="none" stroke="${ink}" stroke-width="1.5" stroke-linecap="round"/>`; };
        face += m(1) + m(-1);
      } else {
        face += eye(P(0.42, 0.1));
        face += ell(P(0.22, -0.3), r * 0.17, r * 0.11, fwd, cheek, ' opacity=".85"');
        face += ell(P(0.74, -0.3), r * 0.3, r * 0.24, fwd, cream);
        face += ell(P(0.98, -0.2), r * 0.08, r * 0.065, fwd, ink);
        const a = P(0.95, -0.36), mc = P(0.86, -0.5), b2 = P(0.72, -0.4);
        face += `<path d="M${X(a)} ${Y(a)} Q${X(mc)} ${Y(mc)} ${X(b2)} ${Y(b2)}" fill="none" stroke="${ink}" stroke-width="1.5" stroke-linecap="round"/>`;
      }
      const sw = (b.maxX - b.minX) / 2 * 0.85 + 12;
      shadow = `<ellipse cx="${(VB.w / 2).toFixed(1)}" cy="${VB.floor + 5}" rx="${sw.toFixed(1)}" ry="6" fill="var(--cat-shadow, #e3cfb3)"/>`;
    }
    const head = ears + `<circle cx="${X(c)}" cy="${Y(c)}" r="${r}" fill="${nearC}"${S.line ? ` stroke="${S.line}" stroke-width="${S.lw}"` : ""}/>` + face;
    const strap = pose.strap ? `<path d="${line(pose.strap === "F" ? [J.armF[2], J.legF[2]] : [J.armN[2], J.legN[3]])}" stroke="var(--strap, #6a5acd)" stroke-width="3" stroke-linecap="round"/>` : "";
    const floor = o.floor === false ? "" : shadow ? shadow : `<line x1="8" x2="${VB.w - 8}" y1="${VB.floor + 5}" y2="${VB.floor + 5}" stroke="var(--floor, #c9d4ce)" stroke-width="3" stroke-linecap="round"/>`;
    // tall poses (inversions) are scaled down around the floor so they stay inside the frame
    const top = Math.max(b.maxY, ...[J.armN, J.armF, J.legN, J.legF].flat().map(q => q.y)) + 12;
    const room = VB.floor - 6;
    const body = tail + limb(J.armF, farC, S.arm) + limb(J.legF, farC, S.leg) + torso + belly + neck + head + limb(J.legN, nearC, S.leg) + strap + limb(J.armN, nearC, S.arm);
    if (top > room) { const k = (room / top).toFixed(3); return floor + `<g transform="translate(${VB.w / 2} ${VB.floor + 5}) scale(${k}) translate(${-VB.w / 2} ${-(VB.floor + 5)})">${body}</g>`; }
    return floor + body;
    return floor + tail + limb(J.armF, farC, S.arm) + limb(J.legF, farC, S.leg) + torso + belly + neck + head + limb(J.legN, nearC, S.leg) + strap + limb(J.armN, nearC, S.arm);
  }
  function svg(pose, o) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB.w} ${VB.h}" role="img">${svgInner(pose, o)}</svg>`;
  }

  root.PoseEngine = { SEG, STYLES, compute, lerp, svg, svgInner, VB };
  if (typeof module !== "undefined") module.exports = root.PoseEngine;
})(typeof window !== "undefined" ? window : globalThis);
