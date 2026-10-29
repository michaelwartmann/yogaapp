// Practice generator v2. Builds a timed sequence of steps from the pose library.
// Input:  { minutes: 30|45|60, style: "vinyasa"|"slow", energy: "low"|"medium"|"high",
//           focus: subset of ["hamstrings","back","hips","balance","core"], cycle: seconds per breath,
//           seed, challenges: {poseId: true|false}, me: {poseId: "easy"|"ok"|"hard"} (personal difficulty overrides) }
// Output: { steps: [{ id, side, secs, breaths, breath, section, how, challenge }], sections, props, offers, totalSecs }
(function (root) {
  const LIB = (root.YogaPoses || require("./poses.js")).POSES;
  const BY = Object.fromEntries(LIB.map(p => [p.id, p]));

  function rng(seed) { // mulberry32
    let a = seed >>> 0;
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  // Transition hints, keyed "from>to" by pose id ({side} / {other} are filled in).
  const HOW = {
    "sukhasana>bharmanasana": "Come onto hands and knees",
    "sukhasana>malasana": "Come up into a deep squat",
    "malasana>bharmanasana": "Hands down, knees to the floor",
    "balasana>adho-mukha-svanasana": "Tuck the toes, lift the hips",
    "bharmanasana>adho-mukha-svanasana": "Tuck the toes, lift the hips",
    "bitilasana>adho-mukha-svanasana": "Tuck the toes, lift the hips",
    "marjaryasana>balasana": "Hips back to the heels",
    "marjaryasana>uttana-shishosana": "Walk the hands forward, hips stay over the knees",
    "uttana-shishosana>balasana": "Hips back to the heels",
    "uttana-shishosana>adho-mukha-svanasana": "Tuck the toes, lift the hips",
    "adho-mukha-svanasana>uttanasana": "Walk the feet to the hands",
    "adho-mukha-svanasana>ardha-uttanasana": "Step or hop the feet to the hands",
    "adho-mukha-svanasana>eka-pada-adho-mukha-svanasana": "Lift the {side} leg up and back",
    "eka-pada-adho-mukha-svanasana>ashta-chandrasana": "Step the {side} foot forward, rise up",
    "eka-pada-adho-mukha-svanasana>virabhadrasana-1": "Step the {side} foot forward, back heel down, rise up",
    "eka-pada-adho-mukha-svanasana>anjaneyasana": "Step the {side} foot forward, back knee down",
    "eka-pada-adho-mukha-svanasana>virabhadrasana-2": "Step the {side} foot forward, back heel down, open to the side",
    "eka-pada-adho-mukha-svanasana>eka-pada-rajakapotasana": "Knee forward behind the {side} wrist, lower down",
    "uttanasana>phalakasana": "Hands down, step back to Plank",
    "ardha-uttanasana>phalakasana": "Hands down, step back to Plank",
    "utkatasana>uttanasana": "Straighten the legs, fold",
    "uttanasana>utkatasana": "Bend the knees, sweep the arms up",
    "utkatasana>tadasana": "Stand up tall",
    "uttanasana>bakasana": "Squat, hands down, knees onto the upper arms",
    "ardha-uttanasana>bakasana": "Squat, hands down, knees onto the upper arms",
    "ardha-hanumanasana>utthan-pristhasana": "Bend the front knee, both hands inside the front foot",
    "paripurna-navasana>vasisthasana": "Roll to Plank, then onto the {other} hand",
    "vasisthasana>salamba-bhujangasana": "Lower down onto the belly, forearms down",
    "vasisthasana>ardha-pincha-mayurasana": "Down Dog, then lower to the forearms",
    "balasana>salamba-bhujangasana": "Slide forward onto the belly, forearms down",
    "uttanasana>adho-mukha-vrksasana": "Walk to the wall, kick up one leg at a time",
    "adho-mukha-vrksasana>balasana": "Come down slowly, rest in Child's Pose",
    "urdhva-dhanurasana>urdhva-dhanurasana": "Lower down, rest a breath, press up again",
    "urdhva-dhanurasana>matsyasana": "Lower slowly, forearms under, lift the chest",
    "bakasana>phalakasana": "Step or float back to Plank",
    "adho-mukha-svanasana>virabhadrasana-1": "Step the {side} foot forward, back heel down, rise up",
    "adho-mukha-svanasana>ashta-chandrasana": "Step the {side} foot forward, rise up",
    "adho-mukha-svanasana>anjaneyasana": "Step the {side} foot forward, back knee down, rise up",
    "adho-mukha-svanasana>virabhadrasana-2": "Step the {side} foot forward, back heel down, open to the side",
    "virabhadrasana-1>virabhadrasana-2": "Open hips and arms to the side",
    "virabhadrasana-1>phalakasana": "Hands down, step back to Plank",
    "ashta-chandrasana>virabhadrasana-2": "Back heel down, open hips and arms to the side",
    "ashta-chandrasana>virabhadrasana-3": "Shift forward, lift the back leg",
    "virabhadrasana-3>ashta-chandrasana": "Step the back foot down into the lunge",
    "virabhadrasana-3>ardha-chandrasana": "Hand down, open the hips to the side",
    "ardha-chandrasana>parsvottanasana": "Lower the lifted foot, hips face forward",
    "virabhadrasana-2>viparita-virabhadrasana": "Front palm up, reach up and back",
    "viparita-virabhadrasana>utthita-parsvakonasana": "Forearm to the front thigh, top arm over the ear",
    "virabhadrasana-2>trikonasana": "Straighten the front leg, reach forward, then down",
    "virabhadrasana-2>utthita-parsvakonasana": "Forearm to the front thigh, top arm over the ear",
    "utthita-parsvakonasana>trikonasana": "Straighten the front leg, top arm up",
    "trikonasana>parsvottanasana": "Turn the hips to face the front leg, hinge forward",
    "trikonasana>ardha-chandrasana": "Bend the front knee, hand forward, lift the back leg",
    "anjaneyasana>ardha-hanumanasana": "Hips back over the knee, straighten the front leg",
    "ardha-hanumanasana>anjaneyasana": "Bend the front knee, hips forward",
    "anjaneyasana>utthan-pristhasana": "Both hands inside the front foot",
    "utthan-pristhasana>ardha-hanumanasana": "Hips back, straighten the front leg",
    "parsvottanasana>adho-mukha-svanasana": "Hands down, step back to Down Dog",
    "ardha-hanumanasana>adho-mukha-svanasana": "Tuck the back toes, step back to Down Dog",
    "utthan-pristhasana>adho-mukha-svanasana": "Tuck the back toes, step back to Down Dog",
    "trikonasana>adho-mukha-svanasana": "Hands down, step back to Down Dog",
    "virabhadrasana-2>adho-mukha-svanasana": "Hands down, step back to Down Dog",
    "utthita-parsvakonasana>adho-mukha-svanasana": "Hands down, step back to Down Dog",
    "ardha-chandrasana>adho-mukha-svanasana": "Lower the leg, step back to Down Dog",
    "adho-mukha-svanasana>tadasana": "Walk the feet to the hands, roll up slowly",
    "uttanasana>tadasana": "Roll up slowly",
    "tadasana>vrksasana": "Weight into the {other} foot, lift the {side} foot",
    "tadasana>natarajasana": "Weight into the {other} foot, catch the {side} foot behind",
    "tadasana>garudasana": "Sit low, cross the {side} leg over",
    "tadasana>virabhadrasana-3": "Hinge forward, lift the {side} leg back",
    "tadasana>utthita-hasta-padangusthasana": "Belt around the {side} foot, lift the leg forward",
    "vrksasana>vrksasana": "Switch sides",
    "natarajasana>natarajasana": "Switch sides",
    "garudasana>garudasana": "Unwind, switch sides",
    "virabhadrasana-3>virabhadrasana-3": "Stand up, switch sides",
    "utthita-hasta-padangusthasana>utthita-hasta-padangusthasana": "Switch legs",
    "tadasana>parivrtta-utkatasana": "Chair, hands to heart, twist to the {side}",
    "parivrtta-utkatasana>parivrtta-utkatasana": "Back to centre, twist the other way",
    "adho-mukha-svanasana>paripurna-navasana": "Come to sit, lift the feet",
    "paripurna-navasana>paripurna-navasana": "Rest a breath, lift again",
    "adho-mukha-svanasana>vasisthasana": "Plank, roll onto the {other} hand",
    "vasisthasana>vasisthasana": "Back through Plank, other side",
    "adho-mukha-svanasana>ardha-pincha-mayurasana": "Lower to the forearms",
    "ardha-pincha-mayurasana>pincha-mayurasana": "Walk in, kick up one leg at a time",
    "pincha-mayurasana>balasana": "Come down slowly, rest in Child's Pose",
    "ardha-pincha-mayurasana>balasana": "Knees down, hips back",
    "adho-mukha-svanasana>salabhasana": "Lower down onto the belly",
    "adho-mukha-svanasana>salamba-bhujangasana": "Lower down onto the belly, forearms down",
    "paripurna-navasana>salabhasana": "Roll over onto the belly",
    "vasisthasana>salabhasana": "Lower down onto the belly",
    "salamba-bhujangasana>salabhasana": "Arms back, lift chest and legs",
    "salabhasana>balasana": "Push back to Child's Pose",
    "balasana>salabhasana": "Slide forward onto the belly",
    "salabhasana>dhanurasana": "Bend the knees, catch the ankles",
    "dhanurasana>balasana": "Release slowly, push back to Child's Pose",
    "balasana>ustrasana": "Kneel up, hands to the lower back",
    "ustrasana>balasana": "Come up with the chest first, rest",
    "balasana>setu-bandha-sarvangasana": "Roll onto the back, feet hip-width",
    "salabhasana>setu-bandha-sarvangasana": "Roll onto the back, feet hip-width",
    "setu-bandha-sarvangasana>setu-bandha-sarvangasana": "Lower down, one breath, lift again",
    "setu-bandha-sarvangasana>urdhva-dhanurasana": "Hands by the ears, press up",
    "urdhva-dhanurasana>setu-bandha-sarvangasana": "Chin in, lower slowly",
    "urdhva-dhanurasana>apanasana": "Lower slowly, hug the knees",
    "setu-bandha-sarvangasana>matsyasana": "Lower down, forearms under, lift the chest",
    "matsyasana>apanasana": "Release, hug the knees",
    "setu-bandha-sarvangasana>apanasana": "Lower down, hug the knees",
    "eka-pada-rajakapotasana>eka-pada-rajakapotasana": "Back through Down Dog, other side",
    "apanasana>supta-padangusthasana": "Belt around the {side} foot, extend the leg up",
    "setu-bandha-sarvangasana>supta-padangusthasana": "Roll down, belt around the {side} foot",
    "supta-padangusthasana>supta-padangusthasana": "Switch legs",
    "supta-padangusthasana>paschimottanasana": "Roll up to sit, legs long",
    "dandasana>paschimottanasana": "Inhale tall, exhale fold",
    "supta-padangusthasana>dandasana": "Roll up to sit, legs long",
    "paschimottanasana>janu-sirsasana": "Bend the {other} knee, sole to the inner thigh",
    "janu-sirsasana>janu-sirsasana": "Switch legs",
    "janu-sirsasana>baddha-konasana": "Soles together, knees open",
    "paschimottanasana>baddha-konasana": "Soles together, knees open",
    "baddha-konasana>ardha-matsyendrasana": "Cross the {side} foot over, twist",
    "ardha-matsyendrasana>ardha-matsyendrasana": "Switch sides",
    "ardha-matsyendrasana>supta-matsyendrasana": "Roll down onto the back",
    "janu-sirsasana>supta-matsyendrasana": "Roll down onto the back",
    "baddha-konasana>supta-matsyendrasana": "Roll down onto the back",
    "paschimottanasana>supta-matsyendrasana": "Roll down onto the back",
    "supta-padangusthasana>supta-matsyendrasana": "Hug the {side} knee in, let it cross",
    "supta-matsyendrasana>supta-matsyendrasana": "Through the centre to the other side",
    "supta-matsyendrasana>ananda-balasana": "Both knees up, hold the feet",
    "supta-matsyendrasana>viparita-karani": "Scoot the hips to the wall, legs up",
    "ananda-balasana>savasana": "Lengthen the legs, let everything go",
    "viparita-karani>savasana": "Slide away from the wall, let everything go",
    "supta-matsyendrasana>savasana": "Lengthen the legs, let everything go",
  };

  // Fallback hints by the pose you move into, when no pair-specific hint exists.
  const TO = {
    "adho-mukha-svanasana": "Hands down, step back to Down Dog",
    "paripurna-navasana": "Come to sit, lift the feet",
    "supta-padangusthasana": "Lie on the back, belt around the {side} foot",
    "ardha-matsyendrasana": "Sit tall, cross the {side} foot over, twist",
    "eka-pada-rajakapotasana": "From Down Dog, bring the {side} knee forward behind the wrist",
    "vrksasana": "Stand tall, weight into the {other} foot, lift the {side} foot",
    "natarajasana": "Stand tall, catch the {side} foot behind",
    "garudasana": "Stand tall, sit low, cross the {side} leg over",
    "virabhadrasana-3": "Stand tall, hinge forward, lift the {side} leg back",
    "utthita-hasta-padangusthasana": "Stand tall, belt around the {side} foot, lift it forward",
    "baddha-konasana": "Come to sit, soles together",
    "salabhasana": "Lower down onto the belly",
    "setu-bandha-sarvangasana": "Lie on the back, feet hip-width",
    "supta-matsyendrasana": "Lie on the back, hug the {side} knee in, let it cross",
    "savasana": "Lengthen the legs, let everything go",
    "uttanasana": "Fold forward, knees soft",
  };

  function generate(opt) {
    opt = Object.assign({ minutes: 30, style: "vinyasa", energy: "medium", focus: ["hamstrings", "back"], cycle: 6, seed: 1, challenges: {}, me: {} }, opt);
    const slow = opt.style === "slow";
    const defRounds = { 30: 3, 45: 3, 60: 4 }[opt.minutes] - (slow ? 1 : 0) + (opt.energy === "high" ? 1 : 0) - (opt.energy === "low" ? 1 : 0);
    const defFlows = opt.minutes === 30 ? 1 : 2;
    let best = null;
    for (let rounds = Math.max(1, defRounds - 2); rounds <= defRounds + 2; rounds++)
      for (let flows = Math.max(1, defFlows - 1); flows <= Math.min(3, defFlows + 1); flows++)
        for (let sc = 6; sc <= 20; sc++) {
          const r = build(opt, { rounds, flows, scale: sc / 10 });
          const cost = Math.abs(r.totalSecs - opt.minutes * 60) + 45 * Math.abs(rounds - defRounds) + 120 * Math.abs(flows - defFlows) + 25 * Math.abs(sc - 10);
          if (!best || cost < best.cost) best = Object.assign(r, { cost });
        }
    return best;
  }

  function build(opt, K) {
    const R = rng(opt.seed);
    const pick = arr => arr[Math.floor(R() * arr.length)];
    const shuffle = arr => arr.map(v => [R(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    const slow = opt.style === "slow";
    const F = f => opt.focus.includes(f);
    const me = id => opt.me[id] || BY[id].me || "ok";
    const C = opt.cycle, MOVE = C / 2 + 0.5;
    const long = opt.minutes >= 45, longest = opt.minutes >= 60;
    const steps = [], sections = [];
    let section = "";

    function add(id, o) {
      o = o || {};
      const p = BY[id];
      const scaled = (section === "Standing" || section === "Cool-down" || section === "Backbends" || section === "Balance" || section === "Hips") ? K.scale : 1;
      const hardBoost = me(id) === "hard" && !o.breath ? 1.3 : 1; // more time to breathe into what is hard for you
      let breaths = o.breaths != null ? o.breaths : Math.max(1, Math.round((slow ? p.hold * 1.5 : p.hold) * scaled * hardBoost));
      const flow = o.breath != null;
      let secs = o.secs != null ? Math.round(o.secs * scaled / 15) * 15 : flow ? MOVE : Math.round(breaths * C);
      if (o.secs != null) breaths = Math.round(secs / C);
      steps.push({ id, side: o.side || null, secs, breaths: flow ? 0 : breaths, breath: o.breath || null, section, challenge: !!o.challenge });
    }
    const last = () => steps[steps.length - 1];
    function begin(name) { section = name; sections.push(name); }
    function both(fn) { fn("right"); fn("left"); }
    function vinyasa() {
      add("phalakasana", { breath: "in" }); add("chaturanga", { breath: "out" });
      add("urdhva-mukha-svanasana", { breath: "in" }); add("adho-mukha-svanasana", { breaths: 2 });
    }
    const dog = () => { if (!last() || last().id !== "adho-mukha-svanasana") add("adho-mukha-svanasana", { breaths: 1 }); };

    // challenge offers: shown in the preview, accepted per practice
    const offers = [];
    const nOffers = { low: 0, medium: 2, high: 3 }[opt.energy];
    const candidates = [
      { id: "bakasana", text: "Crow in the last round of Sun Salutation A" },
      { id: "urdhva-dhanurasana", text: "Wheel after the second Bridge" },
      { id: "pincha-mayurasana", text: "Forearm Stand from Dolphin, near a wall", minM: 45 },
      { id: "adho-mukha-vrksasana", text: "Handstand kick-ups at a wall after the balance poses", minM: 45, energy: "high" },
    ].filter(c => (!c.minM || opt.minutes >= c.minM) && (!c.energy || c.energy === opt.energy));
    shuffle(candidates).slice(0, nOffers).forEach(c => offers.push(c));
    const ok = id => opt.challenges[id] === true && offers.some(o => o.id === id);

    // 1. Arrival
    begin("Arrival");
    add("sukhasana", { breaths: long ? 12 : 8 });

    // 2. Warm-up
    begin("Warm-up");
    if (long && F("hips")) add("malasana", { breaths: 5 });
    add("bharmanasana", { breaths: 1 });
    const cc = long ? 5 : 4;
    for (let k = 0; k < cc; k++) { add("bitilasana", { breath: "in" }); add("marjaryasana", { breath: "out" }); }
    if (long) add("uttana-shishosana", { breaths: 4 });
    add("balasana", { breaths: 3 });
    add("adho-mukha-svanasana", { breaths: slow ? 8 : 6 });
    add("uttanasana", { breaths: 4 });
    add("tadasana", { breaths: 2 });

    // 3. Sun salutations: A rounds, then B rounds for longer or stronger practices
    begin("Sun Salutations");
    const sunA = ["tadasana", "urdhva-hastasana", "uttanasana", "ardha-uttanasana", "phalakasana", "chaturanga",
      "urdhva-mukha-svanasana", "adho-mukha-svanasana", "ardha-uttanasana", "uttanasana", "urdhva-hastasana", "tadasana"];
    const sunBreath = ["out", "in", "out", "in", "in", "out", "in", null, "in", "out", "in", "out"];
    const roundsA = K.rounds;
    for (let r = 0; r < roundsA; r++) {
      sunA.forEach((id, k) => {
        if (k === 0 && r > 0) return;
        if (id === "adho-mukha-svanasana") { add(id, { breaths: r === 0 ? 5 : 3 }); return; }
        if (k === 4 && r === roundsA - 1 && ok("bakasana")) add("bakasana", { breaths: 3, challenge: true });
        add(id, { breath: sunBreath[k] });
      });
    }
    const roundsB = (long ? 2 : 0) + (opt.energy === "high" ? 1 : 0) - (slow ? 1 : 0);
    for (let r = 0; r < Math.max(0, roundsB); r++) {
      add("utkatasana", { breath: "in" }); add("uttanasana", { breath: "out" }); add("ardha-uttanasana", { breath: "in" });
      add("phalakasana", { breath: "out" }); add("chaturanga", { breath: "out" }); add("urdhva-mukha-svanasana", { breath: "in" }); add("adho-mukha-svanasana", { breath: "out" });
      both(s => { add("virabhadrasana-1", { side: s, breath: "in" }); add("phalakasana", { breath: "out" }); add("chaturanga", { breath: "out" }); add("urdhva-mukha-svanasana", { breath: "in" }); add("adho-mukha-svanasana", { breath: "out" }); });
      last().breath = null; last().breaths = 3; last().secs = Math.round(3 * C);
      add("ardha-uttanasana", { breath: "in" }); add("uttanasana", { breath: "out" }); add("utkatasana", { breath: "in" }); add("tadasana", { breath: "out" });
    }

    // 4. Standing flows
    begin("Standing");
    const flows = {
      warriors: s => { add("virabhadrasana-1", { side: s }); add("virabhadrasana-2", { side: s }); add("trikonasana", { side: s }); add("parsvottanasana", { side: s }); },
      sideAngle: s => { add("virabhadrasana-2", { side: s }); add("viparita-virabhadrasana", { side: s }); add("utthita-parsvakonasana", { side: s }); add("trikonasana", { side: s }); },
      lunge: s => { add("anjaneyasana", { side: s }); add("ardha-hanumanasana", { side: s }); if (F("hips")) add("utthan-pristhasana", { side: s }); else { add("anjaneyasana", { side: s, breaths: 2 }); } add("ardha-hanumanasana", { side: s }); },
      balanceFlow: s => { add("ashta-chandrasana", { side: s }); add("virabhadrasana-3", { side: s }); add("ardha-chandrasana", { side: s }); add("parsvottanasana", { side: s }); },
    };
    let order = [];
    if (F("hamstrings")) order.push(pick(["warriors", "lunge"]));
    if (F("balance")) order.push("balanceFlow");
    order.push(...shuffle(["warriors", "sideAngle", "lunge", "balanceFlow"]));
    order = [...new Set(order)].slice(0, K.flows);
    order.forEach(f => both(s => {
      if (f === "balanceFlow" || f === "sideAngle") dog();
      else { dog(); if (opt.energy !== "low" && R() < 0.5) add("eka-pada-adho-mukha-svanasana", { side: s }); }
      flows[f](s); vinyasa();
    }));

    // 5. Standing balance (a strength of yours, so it is always there)
    begin("Balance");
    add("uttanasana", { breaths: 2 }); add("tadasana", { breaths: 1 });
    const balancePool = ["vrksasana", "natarajasana", "virabhadrasana-3", "garudasana", "utthita-hasta-padangusthasana"].filter(id => !order.includes("balanceFlow") || id !== "virabhadrasana-3");
    const nBal = (long ? 2 : 1) + (F("balance") ? 1 : 0);
    shuffle(balancePool).slice(0, nBal).forEach(id => both(s => add(id, { side: s })));
    if (ok("adho-mukha-vrksasana")) { add("uttanasana", { breaths: 1 }); add("adho-mukha-vrksasana", { breaths: 5, challenge: true }); add("balasana", { breaths: 3 }); }

    // 6. Core (longer practices or core focus)
    if (long || F("core")) {
      begin("Core");
      add("paripurna-navasana"); add("paripurna-navasana");
      if (longest || F("core")) both(s => add("vasisthasana", { side: s }));
      if (ok("pincha-mayurasana")) { add("ardha-pincha-mayurasana", { breaths: 3 }); add("pincha-mayurasana", { challenge: true }); add("balasana", { breaths: 3 }); }
    }

    // 7. Backbends
    begin("Backbends");
    const prone = pick(["salabhasana", "salamba-bhujangasana"]);
    add(prone); if (prone === "salamba-bhujangasana") add("salabhasana"); else { add("balasana", { breaths: 2 }); add("salabhasana"); }
    if (long && opt.energy !== "low") { const deep = pick(["dhanurasana", "ustrasana"]); if (deep === "ustrasana") add("balasana", { breaths: 2 }); add(deep); add("balasana", { breaths: 3 }); }
    add("setu-bandha-sarvangasana"); add("setu-bandha-sarvangasana");
    if (ok("urdhva-dhanurasana")) { add("urdhva-dhanurasana", { challenge: true }); add("urdhva-dhanurasana", { challenge: true }); }
    if (longest) add("matsyasana");
    add("apanasana", { breaths: 3 });

    // 8. Hips (your stiff spot: held longer, with props)
    if (long || F("hips")) {
      begin("Hips");
      const yinish = slow || opt.energy === "low";
      const hold = id => yinish && BY[id].yin ? { secs: Math.min(BY[id].yin, opt.minutes === 30 ? 2 : 4) * 60 } : {};
      if (pick([true, false]) || F("hips")) both(s => add("eka-pada-rajakapotasana", Object.assign({ side: s }, hold("eka-pada-rajakapotasana"))));
      else add("baddha-konasana", hold("baddha-konasana"));
    }

    // 9. Cool-down
    begin("Cool-down");
    const yinish = slow || opt.energy === "low";
    const yinCap = opt.minutes === 30 ? 2 : 4;
    const hold = id => yinish && BY[id].yin ? { secs: Math.min(BY[id].yin, yinCap) * 60 } : {};
    if (F("hamstrings")) both(s => add("supta-padangusthasana", Object.assign({ side: s }, hold("supta-padangusthasana"))));
    if (long) {
      add("dandasana", { breaths: 2 }); add("paschimottanasana", hold("paschimottanasana"));
      both(s => add("janu-sirsasana", Object.assign({ side: s }, hold("janu-sirsasana"))));
      if (F("back")) both(s => add("ardha-matsyendrasana", { side: s }));
    }
    both(s => add("supta-matsyendrasana", Object.assign({ side: s }, hold("supta-matsyendrasana"))));
    if (yinish) add("viparita-karani", hold("viparita-karani"));
    else if (long) add("ananda-balasana");

    // 10. Savasana takes the rest of the time (within limits)
    begin("Savasana");
    const used = steps.reduce((a, s) => a + s.secs, 0);
    const minS = { 30: 180, 45: 240, 60: 300 }[opt.minutes], maxS = { 30: 300, 45: 420, 60: 540 }[opt.minutes];
    const sav = Math.max(minS, Math.min(maxS, opt.minutes * 60 - used));
    add("savasana", { secs: Math.round(sav / 30) * 30 });
    last().breaths = 0;

    // transition hints
    steps.forEach((s, i) => {
      const prev = steps[i - 1]; if (!prev) return;
      const h = HOW[prev.id + ">" + s.id] || (prev.id !== s.id && !s.breath ? TO[s.id] : null);
      if (!h) return;
      const side = s.side || prev.side || "right";
      s.how = h.replace("{side}", side).replace("{other}", side === "right" ? "left" : "right");
    });

    const props = [...new Set(steps.map(s => BY[s.id].prop).filter(Boolean))];
    const totalSecs = steps.reduce((a, s) => a + s.secs, 0);
    return { steps, sections, props, offers, totalSecs };
  }

  root.YogaGenerator = { generate, HOW };
  if (typeof module !== "undefined") module.exports = root.YogaGenerator;
})(typeof window !== "undefined" ? window : globalThis);
