// Profile: who is practising, without accounts.
// A person carries a code like "calm young heron" / "ruhiger junger Reiher":
//   animal = their own symbol, chosen once, never changes (like a kindergarten coat-hook symbol)
//   age    = level (skill): baby → young → grown → wise → ancient
//   tempo  = cardio/pace: calm → lively → swift
// What they pick each day: a theme (like choosing a cuisine) and a length.
(function (root) {
  const POSES = (root.YogaPoses || require("./poses.js")).POSES;
  const BY = Object.fromEntries(POSES.map(p => [p.id, p]));

  // Singular, picturable, no sound-alikes; g = German gender for adjective endings.
  const ANIMALS = [
    ["heron", "Heron", "Reiher", "m"], ["wolf", "Wolf", "Wolf", "m"], ["fox", "Fox", "Fuchs", "m"], ["bear", "Bear", "Bär", "m"],
    ["owl", "Owl", "Eule", "f"], ["otter", "Otter", "Otter", "m"], ["hedgehog", "Hedgehog", "Igel", "m"], ["squirrel", "Squirrel", "Eichhörnchen", "n"],
    ["rabbit", "Rabbit", "Kaninchen", "n"], ["turtle", "Turtle", "Schildkröte", "f"], ["dolphin", "Dolphin", "Delfin", "m"], ["whale", "Whale", "Wal", "m"],
    ["penguin", "Penguin", "Pinguin", "m"], ["panda", "Panda", "Panda", "m"], ["koala", "Koala", "Koala", "m"], ["lion", "Lion", "Löwe", "m"],
    ["tiger", "Tiger", "Tiger", "m"], ["zebra", "Zebra", "Zebra", "n"], ["giraffe", "Giraffe", "Giraffe", "f"], ["elephant", "Elephant", "Elefant", "m"],
    ["camel", "Camel", "Kamel", "n"], ["flamingo", "Flamingo", "Flamingo", "m"], ["swan", "Swan", "Schwan", "m"], ["eagle", "Eagle", "Adler", "m"],
    ["falcon", "Falcon", "Falke", "m"], ["parrot", "Parrot", "Papagei", "m"], ["frog", "Frog", "Frosch", "m"], ["butterfly", "Butterfly", "Schmetterling", "m"],
    ["bee", "Bee", "Biene", "f"], ["ladybird", "Ladybird", "Marienkäfer", "m"], ["seal", "Seal", "Robbe", "f"], ["octopus", "Octopus", "Krake", "m"],
    ["starfish", "Starfish", "Seestern", "m"], ["badger", "Badger", "Dachs", "m"], ["beaver", "Beaver", "Biber", "m"],
    ["raccoon", "Raccoon", "Waschbär", "m"], ["llama", "Llama", "Lama", "n"], ["kangaroo", "Kangaroo", "Känguru", "n"], ["cat", "Cat", "Katze", "f"],
    ["horse", "Horse", "Pferd", "n"], ["goat", "Goat", "Ziege", "f"], ["mouse", "Mouse", "Maus", "f"],
  ].map(([id, en, de, g]) => ({ id, en, de, g }));
  const ANIMAL = Object.fromEntries(ANIMALS.map(a => [a.id, a]));

  // Age = level. stem = German adjective stem (endings added by gender), baby is a compound in German.
  const AGES = [
    { n: 1, en: "baby", de: "Baby", stem: null },
    { n: 2, en: "young", de: "jung", stem: "jung" },
    { n: 3, en: "grown", de: "erwachsen", stem: "erwachsen" },
    { n: 4, en: "wise", de: "weise", stem: "weis" },
    { n: 5, en: "ancient", de: "uralt", stem: "uralt" },
  ];
  const TEMPOS = [
    { n: 1, en: "calm", de: "ruhig", stem: "ruhig" },
    { n: 2, en: "lively", de: "munter", stem: "munter" },
    { n: 3, en: "swift", de: "flink", stem: "flink" },
  ];

  // Level = skill: which poses, which adaptations, how much intensity.
  const LEVELS = [
    { n: 1, name: "First steps", de: "Erste Schritte", maxLvl: 1, energy: "low", swap: { chaturanga: null, "urdhva-mukha-svanasana": "bhujangasana" },
      text: "New to yoga or back after a long break: basic poses, gentle versions, no Chaturanga." },
    { n: 2, name: "Foundation", de: "Fundament", maxLvl: 1, energy: "low", swap: { chaturanga: null },
      text: "Knows the basics: simple flows, Chaturanga still left out." },
    { n: 3, name: "Steady", de: "Sicher", maxLvl: 2, energy: "medium", swap: {},
      text: "Practises regularly: full vinyasa, intermediate poses, a peak with preparation." },
    { n: 4, name: "Strong practice", de: "Kräftige Praxis", maxLvl: 2, energy: "high", swap: {},
      text: "Confident: more rounds, deeper backbends, challenge offers." },
    { n: 5, name: "Advanced", de: "Fortgeschritten", maxLvl: 3, energy: "high", swap: {},
      text: "Experienced: advanced peaks, Wheel and wall inversions as challenges." },
  ];
  // Tempo = cardio: breath length, pace (cost per pose change), intensity shift.
  const TEMPO_CFG = [
    { n: 1, cycle: 7, pace: 6, energy: -1, style: "slow", text: "Slow breath, fewer changes, longer rests." },
    { n: 2, cycle: 6, pace: 3, energy: 0, style: "vinyasa", text: "Steady breath and flow." },
    { n: 3, cycle: 5, pace: 1.2, energy: 1, style: "vinyasa", text: "Quicker breath, more rounds and more poses." },
  ];

  // Themes = what you cook today. peaks = preferred peak themes from blocks.js; focus = tags the composer favours.
  const THEMES = [
    { id: "flow", en: "Classic flow", de: "Klassischer Flow", text: "A bit of everything.", focus: [], peaks: [] },
    { id: "hamstrings", en: "Hamstrings", de: "Beinrückseite", text: "Forward folds and long legs.", focus: ["hamstrings"], peaks: ["pk-halfsplits", "pk-handtoe", "pk-triangle", "pk-w3", "pk-halfmoon"] },
    { id: "hips", en: "Hips", de: "Hüften", text: "Lunges, squats and hip openers.", focus: ["hips"], peaks: ["pk-pigeon", "pk-eagle", "pk-crow"] },
    { id: "backbends", en: "Backbends", de: "Rückbeugen", text: "Open the front body, a strong back.", focus: ["back"], peaks: ["pk-camel", "pk-bow", "pk-wheel", "pk-dancer"] },
    { id: "twists", en: "Twists", de: "Drehungen", text: "Wring out the spine.", focus: ["back"], tags: ["twist"], peaks: ["pk-revchair"] },
    { id: "balance", en: "Balance", de: "Gleichgewicht", text: "Standing on one leg, steady mind.", focus: ["balance"], peaks: ["pk-w3", "pk-halfmoon", "pk-dancer", "pk-eagle", "pk-handtoe"] },
    { id: "core", en: "Core and arms", de: "Rumpf und Arme", text: "Plank, boat, arm balances.", focus: ["core"], peaks: ["pk-crow", "pk-sideplank", "pk-boat", "pk-dolphin"] },
    { id: "shoulders", en: "Shoulders and sides", de: "Schultern und Flanken", text: "Side bends, open shoulders.", focus: [], tags: ["shoulders", "sidebody"], peaks: ["pk-dolphin", "pk-triangle", "pk-halfmoon", "pk-sideplank"] },
    { id: "calm", en: "Calm", de: "Ruhe", text: "Slow, long holds, mostly on the floor.", focus: ["hips", "hamstrings"], style: "slow", energy: -1, cycle: 1, pace: 2, peaks: ["pk-pigeon", "pk-halfsplits", "pk-triangle"] },
  ];
  const THEME = Object.fromEntries(THEMES.map(t => [t.id, t]));

  // Things to take care of today. avoid = left out entirely; swap = replaced (null = dropped) inside flows.
  const CARE = [
    { id: "wrists", en: "Wrists", de: "Handgelenke", avoid: ["bakasana", "vasisthasana", "adho-mukha-vrksasana", "urdhva-dhanurasana"], swap: { chaturanga: null, "urdhva-mukha-svanasana": "bhujangasana" } },
    { id: "knees", en: "Knees", de: "Knie", avoid: ["malasana", "padmasana", "gomukhasana", "skandasana", "eka-pada-rajakapotasana", "hanumanasana"], swap: {} },
    { id: "back", en: "Lower back", de: "Unterer Rücken", avoid: ["urdhva-dhanurasana", "dhanurasana", "ustrasana", "paripurna-navasana", "halasana", "hanumanasana"], swap: {} },
    { id: "neck", en: "Neck", de: "Nacken", avoid: ["sirsasana", "salamba-sarvangasana", "halasana", "matsyasana", "ustrasana"], swap: {} },
    { id: "shoulders", en: "Shoulders", de: "Schultern", avoid: ["pincha-mayurasana", "adho-mukha-vrksasana", "urdhva-dhanurasana", "gomukhasana", "vasisthasana", "bakasana"], swap: { chaturanga: null } },
    { id: "pregnant", en: "Pregnant", de: "Schwanger", avoid: ["salabhasana", "salamba-bhujangasana", "dhanurasana", "parivrtta-utkatasana", "ardha-matsyendrasana", "parivrtta-anjaneyasana", "paripurna-navasana", "sirsasana", "salamba-sarvangasana", "halasana", "pincha-mayurasana", "adho-mukha-vrksasana", "urdhva-dhanurasana", "ustrasana", "bakasana"], swap: { chaturanga: null, "urdhva-mukha-svanasana": null, bhujangasana: null } },
    { id: "pressure", en: "High blood pressure or glaucoma", de: "Bluthochdruck oder Glaukom", avoid: ["sirsasana", "salamba-sarvangasana", "halasana", "pincha-mayurasana", "adho-mukha-vrksasana"], swap: {} },
  ];
  const CARE_BY = Object.fromEntries(CARE.map(c => [c.id, c]));
  // Poses that hold classes together: leaving them out drops them inside flows instead of removing whole blocks.
  const CORE = new Set(["tadasana", "urdhva-hastasana", "uttanasana", "ardha-uttanasana", "phalakasana", "chaturanga", "urdhva-mukha-svanasana", "adho-mukha-svanasana", "balasana", "bharmanasana", "sukhasana", "savasana", "apanasana", "bhujangasana"]);
  const KEEP = new Set(["adho-mukha-svanasana", "savasana"]); // cannot be left out for good

  // ---------- code words ----------
  const DE_END = { m: "er", f: "e", n: "es" };
  function deAdj(stem, g) { return stem + DE_END[g]; }
  function code(st, lang) {
    const a = ANIMAL[st.animal], age = AGES[st.level - 1], t = TEMPOS[st.tempo - 1];
    if (!a) return "";
    if (lang === "de") {
      const tempo = deAdj(t.stem, a.g);
      return age.n === 1 ? `${tempo} Baby-${a.de}` : `${tempo} ${deAdj(age.stem, a.g)} ${a.de}`;
    }
    return `${t.en} ${age.en} ${a.en.toLowerCase()}`;
  }
  const norm = s => String(s || "").toLowerCase().replace(/ß/g, "ss").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "")
    .replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u"); // Bär = Baer
  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); // swapped letters
    }
    return d[a.length][b.length];
  }
  const close = (tok, word) => tok === word || (word.length >= 5 && tok.length >= 4 && lev(tok, word) <= 1);
  const deForms = stem => [stem, stem + "e", stem + "er", stem + "es", stem + "en", stem + "em"].map(norm);
  // Read a code typed in any order, English or German, with German endings and small typos.
  function parse(text) {
    let toks = String(text || "").split(/[\s,.;\/-]+/).map(norm).filter(Boolean);
    // "babyreiher" written as one word
    toks = toks.flatMap(t => t.startsWith("baby") && t.length > 4 ? ["baby", t.slice(4)] : [t]);
    const res = { animal: null, level: null, tempo: null, unknown: [] };
    toks.forEach(t => {
      const an = ANIMALS.find(a => t === norm(a.en) || t === norm(a.de)) || ANIMALS.find(a => close(t, norm(a.en)) || close(t, norm(a.de)));
      if (an && !res.animal) { res.animal = an.id; return; }
      const ag = AGES.find(a => t === a.en || t === norm(a.de) || (a.stem && deForms(a.stem).includes(t)))
        || AGES.find(a => (a.en.length >= 5 && close(t, a.en)) || (a.stem && a.stem.length >= 4 && deForms(a.stem).some(f => close(t, f))));
      if (ag && !res.level) { res.level = ag.n; return; }
      const tp = TEMPOS.find(x => t === x.en || deForms(x.stem).includes(t))
        || TEMPOS.find(x => (x.en.length >= 5 && close(t, x.en)) || deForms(x.stem).some(f => f.length >= 5 && close(t, f)));
      if (tp && !res.tempo) { res.tempo = tp.n; return; }
      res.unknown.push(t);
    });
    return res;
  }
  function suggestAnimals(prefix) {
    const q = norm(prefix).replace(/^.*\s/, "");
    if (!q) return [];
    return ANIMALS.filter(a => norm(a.en).startsWith(q) || norm(a.de).startsWith(q)).slice(0, 8);
  }

  // ---------- profile → composer options ----------
  function options(st, today) {
    today = today || {};
    const L = LEVELS[st.level - 1], T = TEMPO_CFG[st.tempo - 1], th = THEME[today.theme] || THEME.flow;
    const E = ["low", "medium", "high"];
    const energy = E[Math.max(0, Math.min(2, E.indexOf(L.energy) + T.energy + (th.energy || 0)))];
    const minutes = today.minutes || 30;
    const care = (today.care || st.care || []).map(id => CARE_BY[id]).filter(Boolean);
    const skip = new Set((st.skip || []).concat(today.skip || []));
    const me = {}, swap = Object.assign({}, L.swap);
    POSES.forEach(p => { me[p.id] = p.lvl > L.maxLvl ? "new" : "ok"; });
    care.forEach(c => { c.avoid.forEach(id => { me[id] = "new"; }); Object.assign(swap, c.swap); });
    skip.forEach(id => { if (!BY[id] || KEEP.has(id)) return; if (CORE.has(id)) swap[id] = null; else me[id] = "new"; });
    Object.keys(swap).forEach(id => { if (me[id] === "new" && CORE.has(id)) me[id] = "ok"; });
    const lenF = minutes === 30 ? 1 : minutes === 45 ? 0.5 : 0.35;
    return {
      minutes, energy, style: th.style || T.style, cycle: T.cycle + (th.cycle || 0), pace: T.pace * lenF + (th.pace || 0),
      focus: th.focus.concat(th.tags || []), peaks: th.peaks, me, swap, challenges: today.challenges || {},
      history: today.history || [], seed: today.seed || 1,
    };
  }

  // ---------- assessment ----------
  // answers: { yoga 0–4, moves: [..], age 0–4, active 0–2, fold 0–4, plank 0–3, balance 0–2, stairs 0–2 }
  function assess(a) {
    let lv = [1, 1.5, 2.5, 3.4, 4.3][a.yoga ?? 0];
    const mv = new Set(a.moves || []);
    if (mv.has("dance")) lv += 0.5; if (mv.has("martial")) lv += 0.4; if (mv.has("strength")) lv += 0.2;
    lv += [-0.4, 0, 0.2, 0.4, 0.6][a.fold ?? 1];
    lv += [-0.5, -0.3, 0, 0.3][a.plank ?? 2];
    lv += [-0.3, 0, 0.3][a.balance ?? 1];
    lv += [0, 0, -0.1, -0.3, -0.5][a.age ?? 1] + [-0.3, 0, 0.2][a.active ?? 1];
    if ((a.yoga ?? 0) === 0) lv = Math.min(lv, 2.4); // never done yoga: start at most at Foundation
    const level = Math.max(1, Math.min(5, Math.round(lv)));
    let tp = [1, 2, 3][a.stairs ?? 1];
    if (mv.has("endurance")) tp += 1; if ((a.active ?? 1) === 0) tp -= 1; if ((a.age ?? 1) >= 4) tp -= 0.5;
    const tempo = Math.max(1, Math.min(3, Math.round(tp)));
    return { level, tempo };
  }

  // ---------- feedback → next code ----------
  // poses: too easy | just right | too hard;  pace: too slow | just right | too fast
  function next(st, fb) {
    const out = Object.assign({}, st);
    out.streak = st.streak || 0;
    const story = [];
    if (fb.poses === "too easy" && st.level < 5) { out.level = st.level + 1; out.streak = 0; story.push("grew up"); }
    else if (fb.poses === "too hard" && st.level > 1) { out.level = st.level - 1; out.streak = 0; story.push("takes a step back"); }
    else if (fb.poses === "just right") { out.streak += 1; if (out.streak >= 3 && st.level < 5) { out.level = st.level + 1; out.streak = 0; story.push("grew up after three good practices"); } }
    else out.streak = 0;
    if (fb.pace === "too slow" && st.tempo < 3) { out.tempo = st.tempo + 1; story.push("gets quicker"); }
    if (fb.pace === "too fast" && st.tempo > 1) { out.tempo = st.tempo - 1; story.push("slows down"); }
    return { state: out, story };
  }

  root.YogaProfile = { ANIMALS, ANIMAL, AGES, TEMPOS, LEVELS, TEMPO_CFG, THEMES, THEME, CARE, CARE_BY, CORE, KEEP, code, parse, suggestAnimals, options, assess, next, norm };
  if (typeof module !== "undefined") module.exports = root.YogaProfile;
})(typeof window !== "undefined" ? window : globalThis);
