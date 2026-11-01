// Composer v3: builds a practice from the building blocks around a peak pose, with memory of recent practices.
// generate(opt)  → plan { steps, sections, props, offers, totalSecs, meta, why }
// validate(steps) → { ok, issues }      repair(raw) → raw steps with sides, neutral poses and unknown poses fixed
// fromSpec(spec, opt) → plan from a class written elsewhere (Claude), checked and timed by the same rules
// opt: { minutes, style, energy, focus[], cycle, seed, challenges{}, me{poseId: easy|ok|hard|new}, history[{peak, warmup, sun, modules[], loved[]}] }
(function (root) {
  const LIB = (root.YogaPoses || require("./poses.js")).POSES;
  const B = root.YogaBlocks || require("./blocks.js");
  const OLD = root.YogaGenerator || require("./generator.js");
  const BY = Object.fromEntries(LIB.map(p => [p.id, p]));
  const ENGINE = root.PoseEngine || require("./pose-engine.js");
  // Slow transitions: time to get into a pose before its breaths are counted. It grows with how far the body travels
  // (head height from standing to lying), and a side change of the same pose is short.
  const HEAD = {};
  const headY = id => HEAD[id] != null ? HEAD[id] : (HEAD[id] = ENGINE.compute(BY[id].p).head.y);
  function transSecs(prev, s) {
    if (!prev) return 8;
    if (prev.id === s.id) return (prev.side || null) === (s.side || null) ? 3 : 7;
    return Math.round(Math.max(6, Math.min(20, 6 + 0.1 * Math.abs(headY(prev.id) - headY(s.id)))));
  }
  const HOW = Object.assign({}, OLD.HOW, {
    "virabhadrasana-1>parsvottanasana": "Shorten the stance a little, hinge over the front leg",
    "parsvottanasana>virabhadrasana-3": "Weight into the front foot, lift the back leg",
    "parsvottanasana>virabhadrasana-1": "Bend the front knee, rise up",
    "ashta-chandrasana>parivrtta-anjaneyasana": "Back knee down, hands to heart, twist",
    "parivrtta-anjaneyasana>anjaneyasana": "Unwind, arms up",
    "parivrtta-anjaneyasana>phalakasana": "Hands down, step back to Plank",
    "savasana>sukhasana": "Bend the knees, roll onto the right side, slowly press up to sit",
    "bharmanasana>dandayamana-bharmanasana": "{side} arm forward, {other} leg back",
    "dandayamana-bharmanasana>dandayamana-marjaryasana": "Round the back, elbow to knee",
    "dandayamana-marjaryasana>dandayamana-bharmanasana": "Reach long again",
    "dandayamana-bharmanasana>bharmanasana": "Hand and knee down",
    "dandayamana-bharmanasana>balasana": "Hand and knee down, hips back to the heels",
    "ashta-chandrasana>parivrtta-ashta-chandrasana": "Palms together, twist towards the front leg",
    "parivrtta-ashta-chandrasana>parivrtta-parsvakonasana": "Lower hand down, open the top arm to the sky",
    "parivrtta-parsvakonasana>ashta-chandrasana": "Unwind, rise into High Lunge",
    "eka-pada-adho-mukha-svanasana>vrischika-svanasana": "Bend the knee, open the hip",
    "vrischika-svanasana>camatkarasana": "Flip over: foot down behind you, heart to the sky",
    "camatkarasana>adho-mukha-svanasana": "Flip back to Down Dog",
    "vasisthasana>adho-mukha-svanasana": "Hand down, back to Down Dog",
    "parivrtta-ashta-chandrasana>adho-mukha-svanasana": "Hands down, step back to Down Dog",
    "parivrtta-parsvakonasana>adho-mukha-svanasana": "Hands down, step back to Down Dog",
    "ashta-chandrasana>adho-mukha-svanasana": "Hands down, step back to Down Dog",
    "apanasana>supta-matsyendrasana": "Feet down, let the knees fall to the {side}",
    "parivrtta-anjaneyasana>uttanasana": "Step the back foot forward, fold",
    "utthita-tadasana>utkata-konasana": "Turn the toes out, bend the knees, sit low",
    "utkata-konasana>utthita-tadasana": "Straighten the legs, arms out",
    "utkata-konasana>skandasana": "Shift into the {side} leg, other leg long",
    "skandasana>skandasana": "Move through the middle to the other side",
    "skandasana>utkata-konasana": "Come back to the middle, sit low",
    "skandasana>malasana": "Come to the middle into a deep squat",
    "malasana>skandasana": "Shift into the {side} leg, other leg long",
    "utthita-tadasana>tadasana": "Step the feet together",
    "utthita-tadasana>trikonasana": "Turn the {side} foot out, reach and tip over",
    "trikonasana>utthita-tadasana": "Come up, feet parallel, arms out",
    "parsvottanasana>anjaneyasana": "Bend the front knee, back knee down",
    "anjaneyasana>skandasana": "Turn to the side, sit into the {side} leg",
    "skandasana>anjaneyasana": "Turn to face the {side} leg, back knee down",
    "anjaneyasana>parsvottanasana": "Lift the back knee, straighten the front leg, hinge forward",
    "tadasana>indudalasana": "Palms together overhead, lean to the {other}",
    "indudalasana>indudalasana": "Through the middle, lean the other way",
    "indudalasana>utkata-konasana": "Step the feet wide, sit low",
    "indudalasana>utthita-tadasana": "Step the feet wide, arms out",
    "uttanasana>anjaneyasana": "Step the {side} foot back, knee down",
    "anjaneyasana>phalakasana": "Step back to Plank",
    "chaturanga>bhujangasana": "Lower to the floor, lift the chest",
    "bhujangasana>adho-mukha-svanasana": "Tuck the toes, lift the hips",
    "adho-mukha-svanasana>anjaneyasana": "Step the {side} foot forward, back knee down",
    "anjaneyasana>uttanasana": "Step the back foot forward, fold",
    "adho-mukha-svanasana>phalakasana": "Shift forward to Plank",
    "phalakasana>adho-mukha-svanasana": "Hips up and back",
    "phalakasana>vasisthasana": "Roll onto the {other} hand, stack the feet",
    "vasisthasana>phalakasana": "Back to Plank",
    "malasana>bakasana": "Hands down, knees onto the upper arms, lean forward",
    "bakasana>malasana": "Feet down into the squat",
    "utkatasana>garudasana": "Cross the {side} leg over, wrap the arms",
    "garudasana>utkatasana": "Unwind into Chair",
    "vrksasana>utthita-hasta-padangusthasana": "Belt around the {side} foot, extend the leg forward",
    "natarajasana>tadasana": "Release the foot, stand tall",
    "tadasana>malasana": "Feet wide, sink into a squat",
    "malasana>uttanasana": "Lift the hips, fold",
    "ardha-pincha-mayurasana>balasana": "Knees down, hips back",
    "balasana>ardha-pincha-mayurasana": "Forearms down, tuck the toes, lift the hips",
    "dandasana>paripurna-navasana": "Lean back, lift the feet",
    "paripurna-navasana>dandasana": "Feet down, sit tall",
    "salabhasana>salabhasana": "Rest a breath, lift again",
    "salamba-bhujangasana>salabhasana": "Arms back, lift chest and legs",
    "dhanurasana>dhanurasana": "Rest a breath, catch the ankles again",
    "ustrasana>ustrasana": "Come up, then go back again",
    "uttana-shishosana>balasana": "Hips back to the heels",
    "setu-bandha-sarvangasana>apanasana": "Lower down, hug the knees",
    "matsyasana>apanasana": "Release, hug the knees",
    "eka-pada-adho-mukha-svanasana>eka-pada-rajakapotasana": "Bring the {side} knee forward behind the wrist, lower down",
    "eka-pada-rajakapotasana>adho-mukha-svanasana": "Tuck the back toes, step back to Down Dog",
    "dandasana>janu-sirsasana": "Bend the {other} knee, sole to the inner thigh",
    "janu-sirsasana>ardha-matsyendrasana": "Cross the {side} foot over, twist",
    "baddha-konasana>gomukhasana": "Stack the knees, {side} on top",
    "gomukhasana>gomukhasana": "Switch the knees",
    "supta-padangusthasana>ananda-balasana": "Both knees up, hold the feet",
    "ananda-balasana>supta-matsyendrasana": "Feet down, let the knees fall to the {side}",
    "uttanasana>adho-mukha-svanasana": "Hands down, step back to Down Dog",
  });
  // How to come into each pose when no pair-specific hint exists.
  const TO = {
    "tadasana": "Stand tall at the front of the mat", "urdhva-hastasana": "Arms up", "uttanasana": "Fold forward, knees soft",
    "ardha-uttanasana": "Halfway lift, long back", "utkatasana": "Bend the knees, sit back, arms up", "ashta-chandrasana": "Step the {side} foot forward, back heel lifted, rise up",
    "virabhadrasana-1": "Step the {side} foot forward, back heel down, rise up", "virabhadrasana-2": "{side} foot forward, open hips and arms to the side",
    "trikonasana": "Straighten the front leg, reach forward, then down", "parsvottanasana": "Hips face the {side} leg, hinge forward",
    "vrksasana": "Weight into the {other} foot, lift the {side} foot", "phalakasana": "Plank", "chaturanga": "Lower halfway, elbows in",
    "urdhva-mukha-svanasana": "Roll over the toes, chest forward", "adho-mukha-svanasana": "Hips up and back to Down Dog", "bhujangasana": "Lower down, lift the chest",
    "dandayamana-bharmanasana": "From hands and knees, {side} arm forward, {other} leg back", "dandayamana-marjaryasana": "Round the back, elbow to knee",
    "parivrtta-ashta-chandrasana": "High lunge, palms together, twist towards the front leg", "parivrtta-parsvakonasana": "Lower hand down, open the top arm to the sky",
    "vrischika-svanasana": "Three-legged dog, bend the knee, open the hip", "camatkarasana": "Flip over the bottom hand, hips high",
    "baddha-virabhadrasana": "Hands clasped behind, fold inside the front knee",
    "parivrtta-trikonasana": "Hips square, lower hand down, turn the chest open",
    "urdhva-prasarita-eka-padasana": "Fold over the standing leg, lift the other leg",
    "parivrtta-ardha-chandrasana": "Lower hand down, lift the back leg, turn the chest",
    "svarga-dvijasana": "Bind around the front leg, step in, rise slowly",
    "baddha-parsvakonasana": "Wrap the lower arm under the thigh, bind behind",
    "prasarita-padottanasana": "Feet wide, hands to the hips, fold forward",
    "padangusthasana": "Fold forward, hold the big toes",
    "vajrasana": "Kneel and sit back on the heels",
    "virasana": "Kneel, feet wide, sit between the heels",
    "bharadvajasana": "Legs to one side, twist the other way",
    "marichyasana-3": "One leg long, the other knee up, twist towards it",
    "upavistha-konasana": "Legs wide, walk the hands forward",
    "parivrtta-janu-sirsasana": "One leg long, side bend over it, top arm over the ear",
    "agnistambhasana": "Stack the shins, feet flexed",
    "mandukasana": "Knees wide, forearms down, hips back",
    "parsva-balasana": "From hands and knees, slide the {side} arm under",
    "parighasana": "Kneel, {side} leg out to the side, lean over it",
    "jathara-parivartanasana": "Lie on the back, arms wide, legs fall to the {side}",
    "supta-baddha-konasana": "Lie back, soles together, knees open",
    "supta-kapotasana": "Lie on the back, {side} ankle over the other knee",
    "anantasana": "Lie on your side, head in the hand, lift the top leg",
    "ardha-bhekasana": "On the belly, one forearm down, bend the {side} knee, hold the foot",
    "ashtanga-namaskara": "Knees down, lower chest and chin",
    "ardha-purvottanasana": "Sit, feet down, hands behind, lift the hips",
    "purvottanasana": "Legs long, hands behind, lift the hips",
    "makara-adho-mukha-svanasana": "Forearms down, step back into a long line",
    "parsva-bakasana": "Squat, twist, knees onto one arm, lean forward",
    "eka-pada-galavasana": "Shin across the arms, lean forward, lift the back leg",
    "astavakrasana": "Leg over the arm, cross the ankles, lean forward",
    "tittibhasana": "Shoulders behind the knees, press up, straighten the legs",
    "kapotasana": "From Camel, lower the forearms to the floor",
    "eka-pada-urdhva-dhanurasana": "From Wheel, lift the {side} leg",
    "pashasana": "Squat, feet together, twist and wrap",
    "salabhasana": "Lie on the belly, lift chest and legs", "bharmanasana": "Come onto hands and knees", "marjaryasana": "Round the back", "bitilasana": "Belly down, chest forward",
    "anjaneyasana": "Step the {side} foot forward, back knee down", "ardha-hanumanasana": "Hips back over the knee, straighten the front leg",
    "balasana": "Hips back to the heels, rest", "bakasana": "Squat, hands down, knees onto the upper arms", "sukhasana": "Sit cross-legged",
    "paschimottanasana": "Legs long, fold forward", "janu-sirsasana": "One leg long, {other} sole to the inner thigh, fold over the {side} leg",
    "setu-bandha-sarvangasana": "Lie on the back, feet hip-width, lift the hips", "urdhva-dhanurasana": "Hands by the ears, press up",
    "supta-padangusthasana": "Lie on the back, belt around the {side} foot", "supta-matsyendrasana": "Lie on the back, let the {side} knee cross",
    "ananda-balasana": "Lie on the back, knees up, hold the feet", "savasana": "Lie down, let everything go",
    "virabhadrasana-3": "Hinge forward, lift the {other} leg back", "natarajasana": "Catch the {other} foot behind, lean forward",
    "ardha-chandrasana": "Hand down, lift the back leg, open to the side", "utthita-hasta-padangusthasana": "Belt around the {side} foot, lift the leg forward",
    "garudasana": "Sit low, cross the {side} leg over, wrap the arms", "utthita-parsvakonasana": "Forearm to the front thigh, top arm over the ear",
    "viparita-virabhadrasana": "Front palm up, reach up and back", "parivrtta-utkatasana": "Chair, hands to heart, twist to the {side}",
    "malasana": "Feet wide, sink into a squat", "eka-pada-adho-mukha-svanasana": "Lift the {side} leg up and back", "utthan-pristhasana": "Both hands inside the {side} foot",
    "uttana-shishosana": "Walk the hands forward, hips over the knees", "ustrasana": "Kneel up, hands to the lower back, lift the chest",
    "eka-pada-rajakapotasana": "Bring the {side} knee forward behind the wrist, lower down", "hanumanasana": "Slide into the splits, books under the hands",
    "salamba-bhujangasana": "Lie on the belly, forearms down", "dhanurasana": "Bend the knees, catch the ankles", "paripurna-navasana": "Sit, lean back, lift the feet",
    "vasisthasana": "Roll onto the {other} hand, stack the feet", "ardha-pincha-mayurasana": "Forearms down, lift the hips", "dandasana": "Sit tall, legs long",
    "baddha-konasana": "Sit, soles together", "ardha-matsyendrasana": "Sit tall, cross the {side} foot over, twist", "gomukhasana": "Sit, stack the knees, {side} on top",
    "padmasana": "Sit, feet onto the thighs only if easy", "matsyasana": "Lie on the back, forearms under, lift the chest", "apanasana": "Lie on the back, hug the knees",
    "viparita-karani": "Hips to the wall, legs up", "halasana": "From the shoulders, feet over the head", "salamba-sarvangasana": "Lift the legs, hands support the back",
    "sirsasana": "Forearms down, crown down, walk in", "pincha-mayurasana": "Forearms down, kick up at the wall", "adho-mukha-vrksasana": "Hands down, kick up at the wall",
    "utthita-tadasana": "Step the feet wide, arms out", "utkata-konasana": "Toes out, bend the knees, sit low", "indudalasana": "Palms together overhead, lean to the {other}",
    "skandasana": "Sit into the {side} leg, other leg long", "parivrtta-anjaneyasana": "Hands to heart, elbow outside the {side} knee",
  };

  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const FOCUS_TAGS = { hamstrings: ["hamstrings"], back: ["back"], hips: ["hips", "hipflex"], balance: ["balance"], core: ["core"] };
  const DEEP = new Set(["ustrasana", "dhanurasana", "urdhva-dhanurasana", "kapotasana", "eka-pada-urdhva-dhanurasana", "ardha-bhekasana"]);
  const NEUTRAL = new Set(["balasana", "apanasana", "supta-matsyendrasana", "ardha-matsyendrasana", "adho-mukha-svanasana", "bharmanasana", "jathara-parivartanasana", "bharadvajasana"]);
  // variations: a pose with var: X can take X's place inside any flow (same start and end on the mat)
  const VARS = {};
  LIB.forEach(p => { if (p.var) (VARS[p.var] = VARS[p.var] || []).push(p.id); });
  const FLOOR = new Set(["kneel", "prone", "supine", "seat"]);
  const blockPoses = b => (b.steps || b.round || []).map(s => s[0]);

  function connector(from, to) {
    if (!from || from === to) return [];
    if (B.CONNECT[from + ">" + to]) return B.CONNECT[from + ">" + to];
    if (FLOOR.has(from) && FLOOR.has(to)) return [];
    const a = from === "dog" ? [] : (B.CONNECT[from + ">dog"] || []);
    const b = to === "dog" ? [] : (B.CONNECT["dog>" + to] || []);
    return a.concat(b);
  }

  // expand block steps into raw steps for one side
  function expand(steps, ctx, R) {
    const out = [];
    steps.forEach(([id, h, o], i) => {
      o = o || {};
      if (o.opt != null && (ctx.keep ? !ctx.keep[i] : R() > o.opt)) return;
      const sided = BY[id].sides === 2;
      const side = o.side || (o.lead ? ctx.lead : null) || (sided ? (ctx.side || "right") : null);
      out.push({ id, side: sided ? side : null, hold: typeof h === "number" ? h : null, breath: typeof h === "string" ? h : null, challenge: !!o.challenge });
    });
    return out;
  }
  function runBlock(block, R, first) {
    if (!block.sided) return expand(block.steps, {}, R);
    const order = first === "left" ? ["left", "right"] : ["right", "left"];
    const keep = block.steps.map(([, , o]) => !(o && o.opt != null) || R() <= o.opt); // optional add-ons: same choice on both sides
    let out = [];
    order.forEach(side => {
      out = out.concat(expand(block.steps, { side, keep }, R));
      if (block.between === "vinyasa") out = out.concat(expand(B.VINYASA, {}, R));
    });
    return out;
  }

  // ---------------- composition ----------------
  function generate(opt) {
    opt = Object.assign({ minutes: 30, style: "vinyasa", energy: "medium", focus: ["hamstrings", "back"], cycle: 6, seed: 1, challenges: {}, me: {}, history: [], swap: {} }, opt);
    const me = id => opt.me[id] || BY[id].me || "ok";
    const slow = opt.style === "slow";
    const cap = Math.min({ low: 1, medium: 2, high: 3 }[opt.energy], slow ? 2 : 3);
    const ftags = [...new Set(opt.focus.flatMap(f => FOCUS_TAGS[f] || []))];
    const hist = (opt.history || []).slice(-4);
    const W = [1, 0.6, 0.35, 0.2];
    const recency = id => hist.slice().reverse().reduce((a, h, i) => a + ((h.peak === id || h.warmup === id || h.sun === id || (h.modules || []).includes(id)) ? W[i] : 0), 0);
    const loved = new Set(hist.flatMap(h => h.loved || []).concat(opt.loved || []));
    const hardPoses = new Set(hist.flatMap(h => h.hard || []));
    const R = rng(opt.seed * 31 + 7);
    const overlap = (a, b) => a.filter(x => b.includes(x)).length;
    const usable = b => blockPoses(b).every(id => me(id) !== "new");

    // 1. peak
    const peaks = B.PEAKS.filter(p => p.int <= cap && me(p.pose) !== "new" && (me(p.pose) !== "hard" || p.thread) && usable(p) && !(p.place === "core" && opt.minutes === 30 && !opt.focus.includes("core")));
    const peakScore = p => (opt.peaks && opt.peaks.includes(p.id) ? 7 : 0) + (opt.naturePeaks && opt.naturePeaks.includes(p.id) ? 3 : 0) + overlap(p.needs, ftags) * 2 + (p.thread && opt.focus.includes("hamstrings") ? 1 : 0) + (loved.has(p.pose) ? 1.5 : 0)
      + (cap === 1 && p.int === 1 ? 2 : 0) - recency(p.id) * 8 + R() * 4;
    const peak = (peaks.length ? peaks : B.PEAKS.filter(p => p.id === "pk-triangle")).map(p => [peakScore(p), p]).sort((a, b) => b[0] - a[0])[0][1];

    // 2. warm-up and sun salutation
    const pickBest = (list, score) => list.map(x => [score(x), x]).sort((a, b) => b[0] - a[0])[0][1];
    const warm = pickBest(B.WARMUPS.filter(w => w.int <= Math.max(cap, 1) && usable(w)), w => overlap(w.works, ftags) + overlap(w.works, peak.needs) - recency(w.id) * 5 + R() * 3);
    let suns = B.SUNS.filter(s => (s.int <= cap || (s.id === "sun-b" && cap >= 2 && opt.minutes >= 45)) && usable(s));
    if (!suns.length) suns.push(B.SUNS.find(s => s.id === "sun-classic"));
    const sun = pickBest(suns, s => (s.id === "sun-a" ? 1 : 0) + ((slow || cap === 1) && s.slow ? 2.5 : 0) + overlap(s.works, peak.needs) * 0.5 - recency(s.id) * 5 + R() * 3);

    // 3. rank modules: prepare the peak, match the focus, avoid recent ones, keep variety
    const scoreMod = m => overlap(m.prepares, peak.needs) * 3 + overlap(m.prepares, ftags) * 2 - recency(m.id) * 5 + R() * 2.5
      + (m.prepares.includes("twist") && m.kind === "standing" ? 2.5 : 0) // turning, not only straight lines
      + blockPoses(m).filter(id => loved.has(id)).length * 0.5 - blockPoses(m).filter(id => hardPoses.has(id) && !opt.focus.includes("hamstrings")).length * 0.3;
    const steady = cap >= 2 && !opt.gentle && usable(B.MODULES.find(m => m.id === "s-revlunge"));
    const pool = B.MODULES.filter(m => m.int <= cap && usable(m) && !blockPoses(m).includes(peak.pose) && !(steady && m.id === "s-twist")); // knee-down twist only for beginners
    const ranked = kind => pool.filter(m => kind.includes(m.kind)).map(m => [scoreMod(m), m]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
    function takeDiverse(list, n, already) {
      const chosen = [], used = new Set(already.flatMap(blockPoses));
      let rest = list.slice();
      while (chosen.length < n && rest.length) {
        rest = rest.map(m => [blockPoses(m).filter(id => used.has(id)).length, m]).sort((a, b) => a[0] - b[0] || rest.indexOf(a[1]) - rest.indexOf(b[1])).map(x => x[1]);
        const m = rest.shift(); chosen.push(m); blockPoses(m).forEach(id => used.add(id));
      }
      return chosen;
    }
    const RANK = { standing: ranked(["standing"]), balance: ranked(["balance"]), core: ranked(["core"]), back: ranked(["back"]), finish: ranked(["hips", "cool"]).filter(m => m.from !== "stand") };

    const defs = {
      30: { rounds: 2, stand: 1, bal: 1, core: 0, back: 1, finish: 2 },
      45: { rounds: 3, stand: 2, bal: 1, core: 1, back: 1, finish: 3 },
      60: { rounds: 4, stand: 3, bal: 2, core: 1, back: 2, finish: 4 },
    }[opt.minutes];
    const D = Object.assign({}, defs);
    if (opt.energy === "low") { D.stand = Math.max(0, D.stand - 1); D.core = 0; D.finish += 1; D.rounds = Math.max(1, D.rounds - 1); }
    if (opt.energy === "high") { D.rounds += 1; D.core = Math.max(D.core, 1); }
    if (opt.focus.includes("balance")) D.bal += 1;
    if (opt.focus.includes("core")) D.core += 1;
    if (opt.extraCore) D.core += opt.extraCore; // natures that work on strength
    if (sun.id === "sun-moon") D.rounds = Math.max(1, Math.round(D.rounds / 2));
    if (sun.id === "sun-classic") D.rounds = Math.max(2, D.rounds + (D.rounds % 2)); // even: both sides lead equally

    let best = null;
    const tryK = (dr, ds, df, sc) => {
      const K = { rounds: sun.id === "sun-classic" ? Math.max(2, D.rounds + dr * 2) : Math.max(1, D.rounds + dr), stand: Math.min(RANK.standing.length * 2, Math.max(0, D.stand + ds)), bal: D.bal, core: opt.gentle && ds < -1 ? Math.max(0, D.core - 1) : D.core, back: D.back, finish: Math.max(1, D.finish + df), scale: sc / 10 };
      const plan = build(K);
      const pace = opt.pace != null ? opt.pace : ({ 30: 3.5, 45: 1.2, 60: 0.8 }[opt.minutes] || 1); // each pose change costs a little: calmer classes, fewer changes
      const cost = pace * plan.steps.length + Math.abs(plan.totalSecs - opt.minutes * 60) + 50 * Math.abs(K.rounds - D.rounds) + 110 * Math.abs(K.stand - D.stand) + (opt.minutes === 30 ? 35 : 60) * Math.abs(K.finish - D.finish) + 15 * Math.abs(sc - 10);
      if (!best || cost < best.cost) best = Object.assign(plan, { cost });
    };
    for (let dr = -1; dr <= 2; dr++) for (let ds = -1; ds <= 2; ds++) for (let df = -1; df <= 3; df++) for (let sc = 7; sc <= 18; sc++) tryK(dr, ds, df, sc);
    // still well short (fast breath, few poses allowed): flow sequences twice and add rounds, as teachers do
    // too long (slow transitions add time to every pose): fewer rounds and modules, shorter holds
    if (best.totalSecs > opt.minutes * 60 + 60) for (let dr = -4; dr <= 0; dr++) for (let ds = -3; ds <= 0; ds++) for (let df = -3; df <= 0; df++) for (let sc = 5; sc <= 10; sc++) tryK(dr, ds, df, sc);
    if (best.totalSecs < opt.minutes * 60 - 60) for (let dr = 0; dr <= 5; dr++) for (let ds = 0; ds <= 6; ds++) for (let df = 0; df <= 3; df++) for (let sc = 10; sc <= 18; sc += 2) tryK(dr, ds, df, sc);
    return best;

    function build(K) {
      const R2 = rng(opt.seed * 131 + 3);
      // a held pose may become one of its variations: liked ones often, others now and then; the same choice all class long
      const RV = rng(opt.seed * 53 + 17), varPick = {};
      const variant = s => {
        if (!VARS[s.id] || s.breath || s.peak || s.challenge || typeof s.hold !== "number" || s.hold < 2) return s;
        if (!(s.id in varPick)) {
          const ok = VARS[s.id].filter(v => me(v) !== "new");
          const fav = ok.filter(v => loved.has(v));
          const r = RV();
          varPick[s.id] = fav.length && r < 0.75 ? fav[Math.floor(RV() * fav.length)] : ok.length && r > (fav.length ? 0.92 : 0.88) ? ok[Math.floor(RV() * ok.length)] : null;
        }
        const v = varPick[s.id];
        return v ? Object.assign({}, s, { id: v, side: BY[v].sides === 2 ? s.side : null }) : s;
      };
      const raw = [];
      let state = "seat", section = "";
      // adaptations: opt.swap replaces a pose with a gentler one everywhere (or drops it with null), e.g. Up Dog → Cobra
      const push = (steps, extra) => steps.forEach(s => {
        const sw = opt.swap || {};
        if (Object.prototype.hasOwnProperty.call(sw, s.id)) { if (!sw[s.id]) return; s = Object.assign({}, s, { id: sw[s.id], side: BY[sw[s.id]].sides === 2 ? s.side : null }); }
        s = variant(s);
        if (BY[s.id].sides === 2 && !s.side) { ["right", "left"].forEach(side => raw.push(Object.assign({ section }, s, { side }, extra || {}))); return; } // a one-sided variation of a centred pose: both sides
        raw.push(Object.assign({ section }, s, extra || {}));
      });
      const go = to => push(expand(connector(state, to), {}, R2));
      const startSide = () => R2() < 0.3 ? "left" : "right";
      const used = [];
      function place(block, extra) { go(block.from); push(runBlock(block, R2, startSide()), extra); state = block.to; used.push(block.id); }

      section = "Arrival"; push([{ id: "sukhasana", hold: opt.minutes >= 45 ? 12 : 8 }]);
      section = "Warm-up"; place(warm);
      if (steady) raw.forEach(s => { if (s.section !== "Warm-up") return; if (s.id === "anjaneyasana") s.id = "ashta-chandrasana"; else if (s.id === "parivrtta-anjaneyasana") s.id = "parivrtta-ashta-chandrasana"; }); // back knee up

      section = sun.name.includes("Moon") ? "Moon Salutation" : "Sun Salutations";
      const sunStart = raw.length;
      go("stand");
      const roundsStart = raw.length; let firstLen = 0;
      const accCrow = opt.challenges.bakasana === true && peak.pose !== "bakasana";
      for (let r = 0; r < K.rounds; r++) {
        const lead = r % 2 === 0 ? "right" : "left";
        let round = expand(sun.round, { lead }, R2);
        if (cap >= 2 && !opt.gentle && me("ashta-chandrasana") !== "new") round = round.map(s => s.id === "anjaneyasana" ? Object.assign({}, s, { id: "ashta-chandrasana" }) : s); // back knee up
        if (r > 0 && round[0].id === "tadasana") round = round.slice(1);
        if (r === 0) round.forEach(s => { if (s.id === "adho-mukha-svanasana" && s.hold) s.hold = 5; });
        if (accCrow && r === K.rounds - 1 && sun.id !== "sun-moon") {
          const i = round.findIndex(s => s.id === "phalakasana");
          if (i > 0) round.splice(i, 0, { id: "bakasana", hold: 3, challenge: true });
        }
        push(round);
        if (r === 0) firstLen = raw.length - roundsStart;
      }
      state = "stand";

      // standing modules (gentle first), peak if it belongs here
      let standing = takeDiverse(RANK.standing, Math.min(K.stand, RANK.standing.length), [peak]).sort((a, b) => a.int - b.int);
      if (K.stand > standing.length) standing = standing.concat(standing.slice(0, K.stand - standing.length)); // second time through
      section = "Standing";
      standing.forEach(m => place(m));
      if (peak.place === "standing") { section = "Peak · " + peak.name; place(peak, { peak: true }); if (peak.counter) push(expand(peak.counter, {}, R2)); }

      section = "Balance";
      const bal = takeDiverse(RANK.balance, peak.place === "balance" ? Math.max(0, K.bal - 1) : K.bal, standing.concat([peak]));
      bal.forEach(m => place(m));
      if (peak.place === "balance") { section = "Peak · " + peak.name; place(peak, { peak: true }); if (peak.counter) push(expand(peak.counter, {}, R2)); }
      const accHand = opt.challenges["adho-mukha-vrksasana"] === true;
      if (accHand) { section = "Balance"; go("stand"); push([{ id: "uttanasana", hold: 1 }, { id: "adho-mukha-vrksasana", hold: 5, challenge: true }, { id: "balasana", hold: 3 }]); state = "kneel"; }

      const core = takeDiverse(RANK.core, peak.place === "core" ? Math.max(0, K.core - 1) : K.core, []);
      if (core.length || peak.place === "core") {
        section = "Core";
        core.forEach(m => place(m));
        if (opt.challenges["pincha-mayurasana"] === true && (core.some(m => m.id === "c-dolphin") || peak.id === "pk-dolphin")) {
          go("dog"); push([{ id: "ardha-pincha-mayurasana", hold: 2 }, { id: "pincha-mayurasana", hold: 5, challenge: true }, { id: "balasana", hold: 3 }]); state = "kneel";
        }
        if (peak.place === "core") { section = "Peak · " + peak.name; place(peak, { peak: true }); if (peak.counter) push(expand(peak.counter, {}, R2)); }
      }

      // backbends: belly, kneeling, then back; a floor peak sits in its group
      section = "Backbends";
      let back = takeDiverse(RANK.back, K.back, [peak]);
      const wantBridge = peak.id === "pk-wheel" || opt.challenges["urdhva-dhanurasana"] === true;
      if (wantBridge && !back.some(m => m.id === "u-bridge")) back = back.slice(0, Math.max(0, K.back - 1)).concat(B.MODULES.filter(m => m.id === "u-bridge"));
      const rank = { prone: 0, kneel: 1, supine: 2 };
      const group = back.concat(peak.place === "floor" && peak.from !== "dog" ? [peak] : []).sort((a, b) => (rank[a.from] ?? 1) - (rank[b.from] ?? 1) || (a === peak ? 1 : 0) - (b === peak ? 1 : 0));
      let deep = false;
      group.forEach(m => {
        if (m === peak) { section = "Peak · " + peak.name; place(peak, { peak: true }); if (peak.counter) push(expand(peak.counter, {}, R2)); section = "Backbends"; }
        else place(m);
        if (m.deep || DEEP.has(m.pose)) deep = true;
        if (m.id === "u-bridge" && opt.challenges["urdhva-dhanurasana"] === true && peak.id !== "pk-wheel") {
          push([{ id: "urdhva-dhanurasana", hold: 4, challenge: true }, { id: "urdhva-dhanurasana", hold: 4, challenge: true }, { id: "apanasana", hold: 4 }]);
        }
      });
      if (deep) { if (state === "supine") push([{ id: "apanasana", hold: 4 }]); else push([{ id: "balasana", hold: 4 }]); }

      // hips, seated and lying finish
      section = peak.place === "floor" && peak.from === "dog" ? "Hips" : "Cool-down";
      if (peak.place === "floor" && peak.from === "dog") { section = "Peak · " + peak.name; place(peak, { peak: true }); if (peak.counter) push(expand(peak.counter, {}, R2)); }
      let finish = takeDiverse(RANK.finish, K.finish, [peak].concat(back));
      if (opt.focus.includes("hamstrings") && !finish.some(m => m.prepares.includes("hamstrings"))) finish = finish.slice(0, Math.max(0, K.finish - 1)).concat(RANK.finish.filter(m => m.prepares.includes("hamstrings")).slice(0, 1));
      const yinish = slow || opt.energy === "low";
      const frank = { dog: 0, seat: 1, supine: 2 };
      finish.sort((a, b) => (frank[a.from] ?? 1) - (frank[b.from] ?? 1) || (a.prepares.includes("rest") ? 1 : 0) - (b.prepares.includes("rest") ? 1 : 0));
      section = "Cool-down";
      finish.forEach(m => {
        const before = raw.length; place(m);
        if (yinish) raw.slice(before).forEach(s => { const y = BY[s.id].yin; if (y && s.hold) s.secs = Math.min(y, opt.minutes === 30 ? 2 : 4) * 60; });
      });
      const hasTwist = () => raw.some(s => BY[s.id] && BY[s.id].cat === "twist");
      const uTwist = B.MODULES.find(m => m.id === "u-twist");
      if ((opt.minutes > 30 || !hasTwist()) && !finish.some(m => m.id === "u-twist") && !used.includes("u-twist") && usable(uTwist)) place(uTwist); // the spine turns in every class
      go("supine");

      section = "Savasana";
      push([{ id: "savasana", hold: 0 }]);
      const meta = { peak: peak.id, peakPose: peak.pose, peakName: peak.name, warmup: warm.id, sun: sun.id, modules: used.filter(id => id !== peak.id && id !== warm.id),
        sunName: sun.name, sunRounds: K.rounds, sunLead: roundsStart - sunStart, sunRoundLen: firstLen, sunAlt: !!sun.alt };
      const plan = finalize(raw, opt, K.scale, me);
      return Object.assign(plan, { meta, offers: offersFor(peak, used), why: whyText(peak, standing.concat(bal, core, back, finish), warm, sun), whyData: whyData(peak, standing.concat(bal, core, back, finish), warm, sun) });
    }

    function offersFor(peak, used) {
      const nOffers = { low: 0, medium: 2, high: 3 }[opt.energy] + (opt.energy !== "low" ? (opt.extraOffers || 0) : 0);
      const c = [];
      if (peak.pose !== "bakasana" && me("bakasana") !== "new" && sun.id !== "sun-moon") c.push({ id: "bakasana", text: "Crow in the last sun salutation round" });
      if (peak.id !== "pk-wheel" && me("urdhva-dhanurasana") !== "new") c.push({ id: "urdhva-dhanurasana", text: "Wheel after Bridge" });
      if (opt.energy === "high" && opt.minutes >= 45 && me("pincha-mayurasana") !== "new" && (used.includes("c-dolphin") || peak.id === "pk-dolphin")) c.push({ id: "pincha-mayurasana", text: "Forearm Stand from Dolphin, at a wall" });
      if (opt.energy === "high" && opt.minutes >= 45 && me("adho-mukha-vrksasana") !== "new") c.push({ id: "adho-mukha-vrksasana", text: "Handstand kick-ups at a wall after the balance poses" });
      return c.slice(0, nOffers);
    }
  }

  function whyData(peak, blocks, warm, sun) {
    const prep = blocks.filter(b => b.prepares && !['cool', 'hips'].includes(b.kind) && b.prepares.some(t => peak.needs.includes(t))).map(b => b.id);
    return { peak: peak.id, prep: [...new Set(prep)].slice(0, 3), needs: peak.needs.slice(), warm: warm.id, sun: sun.id };
  }
  function whyText(peak, blocks, warm, sun) {
    const prep = blocks.filter(b => b.prepares && !['cool', 'hips'].includes(b.kind) && b.prepares.some(t => peak.needs.includes(t))).map(b => b.name);
    const uniq = [...new Set(prep)].slice(0, 3);
    return `Built around ${peak.name}. ${uniq.length ? uniq.join(", ") + " prepare" + (uniq.length === 1 ? "s" : "") + " " : "Preparation for "}${peak.needs.join(", ")}. Warm-up: ${warm.name}, then ${sun.name}.`;
  }

  // timing: holds in breaths, flows on half a breath; Savasana takes the remaining time
  function finalize(raw, opt, scale, me) {
    me = me || (id => (opt.me && opt.me[id]) || BY[id].me || "ok");
    const C = opt.cycle || 6, MOVE = opt.gentle ? C : C / 2 + 0.5, slow = opt.style === "slow";
    const R3 = rng((opt.seed || 1) * 977 + 11);
    // two identical holds in a row (e.g. Tabletop from a connector, then Tabletop to start the warm-up) become one longer hold;
    // deliberate repeats (Bridge, Wheel) and the salutations stay as they are
    const REPEAT = new Set(["setu-bandha-sarvangasana", "urdhva-dhanurasana"]);
    raw = raw.reduce((acc, s) => {
      const p = acc[acc.length - 1];
      if (p && p.id === s.id && (p.side || null) === (s.side || null) && !p.breath && !s.breath && !REPEAT.has(s.id) && s.id !== "savasana" && !/Salutation/.test(s.section || "")) {
        acc[acc.length - 1] = Object.assign({}, p, { hold: (p.hold || BY[p.id].hold || 2) + (s.hold || BY[s.id].hold || 2), secs: p.secs && s.secs ? p.secs + s.secs : p.secs || s.secs });
        return acc;
      }
      acc.push(s); return acc;
    }, []);
    const steps = raw.map(s => {
      const out = { id: s.id, side: s.side || null, section: s.section || "", breath: s.breath || null, challenge: !!s.challenge, peak: !!s.peak, breaths: 0, secs: 0 };
      if (s.breath) { out.secs = MOVE; return out; }
      if (s.id === "savasana") return out;
      const scaled = /Standing|Balance|Backbends|Cool-down|Hips|Core|Peak/.test(out.section) ? scale : 1;
      if (s.secs) { out.secs = Math.round(s.secs * scaled / 15) * 15; out.breaths = Math.round(out.secs / C); return out; }
      let b = (s.hold || BY[s.id].hold || 3) * scaled * (slow ? 1.35 : 1) * (me(s.id) === "hard" ? 1.3 : 1);
      if (b >= 3 && R3() < 0.3) b += R3() < 0.5 ? -1 : 1;
      out.breaths = Math.max(1, Math.min(Math.max(12, Math.round(72 / C)), Math.round(b))); out.secs = Math.round(out.breaths * C);
      return out;
    });
    // slow transitions: every held pose starts with time to get into it (flows move one whole breath per movement)
    if (opt.gentle) steps.forEach((s, i) => { if (s.breath) return; s.trans = transSecs(steps[i - 1], s); if (s.id !== "savasana") s.secs += s.trans; });
    // closing: after Savasana, roll to the side and come up to sit for a few breaths, hands at the heart
    const sav = steps.find(s => s.id === "savasana");
    if (sav && steps[steps.length - 1] === sav) {
      const close = { id: "sukhasana", side: null, section: "Closing", breath: null, challenge: false, peak: false, breaths: 3, secs: Math.round(3 * C), closing: true,
        tip: { en: "Hands to the heart. Namaste.", de: "Hände vor dem Herzen. Namaste." } };
      close.trans = opt.gentle ? 15 : 10; close.secs += close.trans; // time to roll over and come up
      steps.push(close);
    }
    const used = steps.reduce((a, s) => a + s.secs, 0);
    // Savasana: 3 minutes in 30-minute classes and the Grundton, 4 in 45, 5 in 60
    const SAV = { 30: 180, 45: 240, 60: 300 }[opt.minutes] || 180;
    if (sav) sav.secs = SAV + (sav.trans || 0);
    // hints
    steps.forEach((s, i) => {
      const prev = steps[i - 1]; if (!prev) return;
      const h = HOW[prev.id + ">" + s.id] || (prev.id !== s.id ? TO[s.id] : null);
      if (!h) return;
      const side = s.side || prev.side || "right";
      s.how = h.replace(/\{side\}/g, side).replace(/\{other\}/g, side === "right" ? "left" : "right");
      s.howT = h; s.howSide = side; // template and side, so the app can say it in another language
    });
    const sections = [...new Set(steps.map(s => s.section))];
    const props = [...new Set(steps.map(s => BY[s.id].prop).filter(Boolean))];
    return { steps, sections, props, totalSecs: steps.reduce((a, s) => a + s.secs, 0) };
  }

  // ---------------- rules ----------------
  function validate(steps, opt) {
    const issues = [];
    const me = id => (opt && opt.me && opt.me[id]) || (BY[id] && BY[id].me) || "ok";
    steps.forEach(s => { if (!BY[s.id]) issues.push(`Unknown pose: ${s.id}`); });
    const known = steps.filter(s => BY[s.id]);
    const count = {};
    known.forEach(s => { if (BY[s.id].sides === 2) { if (!s.side) issues.push(`${BY[s.id].en} needs a side`); else { count[s.id] = count[s.id] || { right: 0, left: 0 }; count[s.id][s.side]++; } } });
    Object.entries(count).forEach(([id, c]) => { if (c.right !== c.left) issues.push(`${BY[id].en}: right ${c.right}× but left ${c.left}×`); });
    let deepAt = -1;
    known.forEach((s, i) => {
      if (DEEP.has(s.id)) deepAt = i;
      else if (deepAt >= 0 && NEUTRAL.has(s.id)) deepAt = -1;
      else if (deepAt >= 0 && BY[s.id].cat === "forward fold") { issues.push(`${BY[s.id].en} right after a deep backbend, without a neutral pose between`); deepAt = -1; }
      if (me(s.id) === "new" && !s.challenge) issues.push(`${BY[s.id].en} is untested for you`);
    });
    const lastMain = known.filter(s => !s.closing && s.section !== "Closing");
    if (!lastMain.length || lastMain[lastMain.length - 1].id !== "savasana") issues.push("Does not end in Savasana");
    return { ok: !issues.length, issues };
  }
  function repair(raw, opt) {
    const me = id => (opt && opt.me && opt.me[id]) || (BY[id] && BY[id].me) || "ok";
    let out = raw.filter(s => BY[s.id] && (me(s.id) !== "new" || s.challenge));
    // sides: a one-sided pose without a side becomes right; an unpaired run gets mirrored right after it
    out.forEach(s => { if (BY[s.id].sides === 2 && !s.side) s.side = "right"; if (BY[s.id].sides !== 2) s.side = null; });
    // an unpaired run of one-sided poses (e.g. Warrior II right, Triangle right) is mirrored as a whole right after the run
    const fixed = [];
    const balance = arr => { const c = {}; arr.forEach(x => { if (BY[x.id].sides === 2) { c[x.id] = c[x.id] || 0; c[x.id] += x.side === "right" ? 1 : -1; } }); return c; };
    let i = 0;
    while (i < out.length) {
      const s = out[i];
      if (BY[s.id].sides !== 2) { fixed.push(s); i++; continue; }
      let j = i; while (j < out.length && BY[out[j].id].sides === 2 && out[j].side === s.side) j++;
      const run = out.slice(i, j); run.forEach(x => fixed.push(x));
      const rest = out.slice(j);
      const after = balance(fixed.concat(rest));
      const need = run.filter(x => after[x.id] !== 0);
      if (need.length) {
        const mirrored = need.map(x => Object.assign({}, x, { side: x.side === "right" ? "left" : "right" }));
        const mb = balance(fixed.concat(mirrored, rest));
        if (need.every(x => mb[x.id] === 0 || Math.abs(mb[x.id]) < Math.abs(after[x.id]))) mirrored.forEach(x => fixed.push(x));
      }
      i = j;
    }
    out = fixed;
    // neutral pose after a deep backbend before any forward fold
    const res = []; let deep = false;
    out.forEach(s => {
      if (deep && BY[s.id].cat === "forward fold") { res.push({ id: "apanasana", hold: 4, section: s.section }); deep = false; }
      if (DEEP.has(s.id)) deep = true; else if (NEUTRAL.has(s.id)) deep = false;
      res.push(s);
    });
    if (!res.length || res[res.length - 1].id !== "savasana") res.push({ id: "savasana", hold: 0, section: "Savasana" });
    return res;
  }

  // a class written elsewhere (e.g. by Claude): { title, peak, sections: [{ name, steps: [{ id, side, breaths, breath }] }] }
  function fromSpec(spec, opt) {
    opt = Object.assign({ minutes: 30, cycle: 6, seed: 1, me: {} }, opt);
    let raw = [];
    (spec.sections || []).forEach(sec => (sec.steps || []).forEach(s => {
      if (!s || !s.id) return;
      raw.push({ id: String(s.id), side: s.side === "left" || s.side === "right" ? s.side : null, hold: typeof s.breaths === "number" ? s.breaths : null,
        breath: s.breath === "in" || s.breath === "out" ? s.breath : null, section: String(sec.name || "Flow").slice(0, 40), peak: BY[s.id] && s.id === spec.peak });
    }));
    const dropped = raw.filter(s => !BY[s.id]).map(s => s.id);
    raw = repair(raw, opt);
    let best = null;
    for (let sc = 5; sc <= 20; sc++) {
      const plan = finalize(raw, opt, sc / 10);
      const cost = Math.abs(plan.totalSecs - opt.minutes * 60) + 15 * Math.abs(sc - 10);
      if (!best || cost < best.cost) best = Object.assign(plan, { cost });
    }
    const check = validate(best.steps, opt);
    return Object.assign(best, { offers: [], meta: { peak: spec.peak ? "claude:" + spec.peak : "claude", peakPose: spec.peak || null, source: "claude", modules: [] },
      why: (spec.title ? spec.title + ". " : "") + (spec.why || "Composed by Claude and checked against the sequencing rules."),
      dropped, checks: check });
  }

  // Re-fit an edited plan (pose removed or swapped) to its length; keeps order, sides and the peak.
  function retime(steps, opt) {
    const raw = steps.filter(s => s.id !== "savasana" && !s.closing).map(s => ({ id: s.id, side: s.side, section: s.section, peak: s.peak, challenge: s.challenge,
      breath: s.breath, hold: s.breath ? null : s.baseBreaths || s.breaths || null })).concat([{ id: "savasana", hold: 0, section: "Savasana" }]);
    const fixed = repair(raw, opt);
    let best = null;
    for (let sc = 6; sc <= 16; sc++) {
      const plan = finalize(fixed.map(s => Object.assign({}, s, { hold: s.hold ? s.hold * sc / 10 : s.hold })), opt, 1);
      const cost = Math.abs(plan.totalSecs - opt.minutes * 60) + 12 * Math.abs(sc - 10);
      if (!best || cost < best.cost) best = Object.assign(plan, { cost });
    }
    return best;
  }

  // Grundton (fundamental): the shortest class that moves every part of the body once, in every direction it has.
  // Spine forward, back, sideways and twisting both ways; hip flexors, hamstrings, outward hip; shoulders overhead;
  // arms, wrists and core carrying weight; balance; a rest. About 10 minutes; the breath sets the length.
  const TIP_EAGLE = { en: "Optional: eagle arms", de: "Optional: Adlerarme" };
  const FUNDAMENTAL = [
    ["Arrival", [["sukhasana", 12, null, { en: "Eyes closed, arrive", de: "Augen schließen, ankommen" }]]],
    ["Warm-up", [["bharmanasana", 1], ...Array.from({ length: 5 }, () => [["bitilasana", "in"], ["marjaryasana", "out"]]).flat(), ["adho-mukha-svanasana", 5]]],
    ["Lunges", [["anjaneyasana", 3, "right"], ["parivrtta-anjaneyasana", 3, "right"], ["phalakasana", 5], ["adho-mukha-svanasana", 2],
      ["anjaneyasana", 3, "left"], ["parivrtta-anjaneyasana", 3, "left"], ["uttanasana", 2], ["tadasana", 2]]],
    ["Standing", [["vrksasana", 5, "right", TIP_EAGLE], ["vrksasana", 5, "left", TIP_EAGLE], ["indudalasana", 3, "right"], ["indudalasana", 3, "left"]]],
    ["Backbends", [["setu-bandha-sarvangasana", 5], ["setu-bandha-sarvangasana", 5]]],
    ["Cool-down", [["apanasana", 4], ["supta-matsyendrasana", 5, "right"], ["supta-matsyendrasana", 5, "left"]]],
    ["Savasana", [["savasana", 0]]],
  ];
  function fundamental(opt) {
    opt = Object.assign({ cycle: 6, minutes: 10, seed: 1 }, opt || {}, { style: "vinyasa" });
    // poses that are out for this person (care areas, "never include", left out today) are dropped on both sides
    const out = id => id !== "savasana" && ((opt.me && opt.me[id] === "new") || (opt.swap && id in opt.swap && !opt.swap[id]) || (opt.skip || []).includes(id));
    let raw = [];
    FUNDAMENTAL.forEach(([section, list]) => list.forEach(([id, h, side, tip]) => { if (!out(id)) raw.push(typeof h === "string"
      ? { id, breath: h, section } : { id, hold: h, side: side || null, section, tip }); }));
    opt.me = {};
    const plan = finalize(raw, opt, 1);
    // exact holds, the same on both sides (finalize adds a little random variation for the composed classes)
    if (plan.steps.length >= raw.length) plan.steps.forEach((s, i) => { if (!raw[i]) return; if (!s.breath && raw[i].hold) { s.breaths = raw[i].hold; s.secs = Math.round(raw[i].hold * opt.cycle) + (s.trans || 0); } if (raw[i].tip) s.tip = raw[i].tip; });
    plan.totalSecs = plan.steps.reduce((a, s) => a + s.secs, 0);
    const sav = plan.steps.find(s => s.id === "savasana");
    const before = plan.totalSecs - sav.secs;
    sav.secs = 180 + (sav.trans || 0); // three minutes
    plan.totalSecs = before + sav.secs;
    return Object.assign(plan, { offers: [], meta: { peak: null, source: "fundamental", modules: [] }, checks: validate(plan.steps, opt),
      why: "Arrive sitting, then every part of the body once: the spine in all six directions, hips, hamstrings, shoulders, arms, core and balance; a twist lying down, then rest." });
  }

  root.YogaComposer = { generate, validate, repair, fromSpec, finalize, retime, fundamental, TO, HOW };
  if (typeof module !== "undefined") module.exports = root.YogaComposer;
})(typeof window !== "undefined" ? window : globalThis);
