// Profile: who is practising, without accounts.
// A person carries a code like "calm young heron" / "ruhiger junger Reiher":
//   animal = their nature, read from three small tests (strong but stiff → bear, flexible → cat, …); one of three per nature
//            is chosen, so it is both meaningful and their own
//   age    = level (skill): baby → young → grown → wise → ancient
//   tempo  = cardio/pace: calm → lively → swift
// What they pick each day: a theme (like choosing a cuisine) and a length.
(function (root) {
  const POSES = (root.YogaPoses || require("./poses.js")).POSES;
  const BY = Object.fromEntries(POSES.map(p => [p.id, p]));

  // Natures: what the body brings and what the practice works on. Three animals each (singular, picturable, no sound-alikes;
  // g = German gender for adjective endings). work = themes Chef's choice leans to; hard = pose families that get longer holds
  // and props; peaks = preferred peak themes; focus = tags the composer favours; challenge = extra challenge offers.
  const NATURES = [
    { id: "stiff", en: "Strong, but stiff", de: "Stark, aber steif", short: "strong but stiff", shortDe: "stark, aber steif",
      textDe: "Kraft fällt dir leicht; Vorwärtsbeugen und Hüften brauchen Zeit. Deine Praxis setzt auf Beweglichkeit: Beinrückseite, Hüften und Schultern, mit längeren Haltezeiten und Hilfsmitteln.",
      text: "Strength comes easily; folds and hips take time. Your practice leans towards mobility: hamstrings, hips and shoulders, with longer holds and props.",
      animals: [["bear", "Bear", "Bär", "m"], ["bison", "Bison", "Bison", "m"], ["gorilla", "Gorilla", "Gorilla", "m"]],
      work: ["hamstrings", "hips", "shoulders", "calm"], hard: ["forward fold", "hip opener"], focus: ["hamstrings", "hips"], peaks: ["pk-halfsplits", "pk-pigeon", "pk-triangle", "pk-handtoe"] },
    { id: "flexible", en: "Flexible, less strong", de: "Beweglich, weniger kräftig", short: "flexible, less strong", shortDe: "beweglich, weniger kräftig",
      textDe: "Vorwärtsbeugen fallen dir leicht; dich selbst zu halten ist Arbeit. Deine Praxis setzt auf Kraft und Stabilität: Rumpf, Arme und kräftige Standhaltungen.",
      text: "Folds come easily; holding yourself up takes work. Your practice leans towards strength and stability: core, arms and strong standing poses.",
      animals: [["cat", "Cat", "Katze", "f"], ["octopus", "Octopus", "Krake", "m"], ["seal", "Seal", "Robbe", "f"]],
      work: ["core", "balance", "flow"], hard: ["core", "arm balance"], focus: ["core", "legs"], peaks: ["pk-sideplank", "pk-boat", "pk-w3", "pk-dolphin", "pk-revchair"], extraCore: 1 },
    { id: "power", en: "Strong and flexible", de: "Stark und beweglich", short: "strong and flexible", shortDe: "stark und beweglich",
      textDe: "Du bringst beides mit. Deine Praxis setzt auf Herausforderung: Armbalancen, tiefe Rückbeugen und längere Flows.",
      text: "You bring both. Your practice leans towards challenge: arm balances, deep backbends and longer flows.",
      animals: [["tiger", "Tiger", "Tiger", "m"], ["panther", "Panther", "Panther", "m"], ["dolphin", "Dolphin", "Delfin", "m"]],
      work: ["backbends", "core", "balance", "flow"], hard: [], focus: ["core", "back"], peaks: ["pk-crow", "pk-wheel", "pk-camel", "pk-dancer", "pk-halfmoon"], challenge: 1, extraCore: 1 },
    { id: "balance", en: "Steady balance", de: "Gutes Gleichgewicht", short: "steady balance", shortDe: "gutes Gleichgewicht",
      textDe: "Du stehst sicher auf einem Bein. Deine Praxis nutzt das Gleichgewicht als Anker und baut Beweglichkeit und Kraft darum herum auf.",
      text: "You stand steady on one leg. Your practice uses balance as the anchor and builds mobility and strength around it.",
      animals: [["heron", "Heron", "Reiher", "m"], ["flamingo", "Flamingo", "Flamingo", "m"], ["crane", "Crane", "Kranich", "m"]],
      work: ["balance", "hamstrings", "hips", "flow"], hard: ["forward fold"], focus: ["balance", "hamstrings"], peaks: ["pk-halfmoon", "pk-w3", "pk-dancer", "pk-eagle", "pk-handtoe"] },
    { id: "allround", en: "All-rounder", de: "Allrounder", short: "all-rounder", shortDe: "Allrounder",
      textDe: "Nichts sticht heraus, nichts hält dich zurück. Deine Praxis bringt Abwechslung: von allem etwas.",
      text: "Nothing stands out, nothing holds you back. Your practice brings variety: a bit of everything.",
      animals: [["fox", "Fox", "Fuchs", "m"], ["wolf", "Wolf", "Wolf", "m"], ["otter", "Otter", "Otter", "m"]],
      work: ["flow", "backbends", "twists", "balance", "hips", "hamstrings", "core", "shoulders"], hard: [], focus: [], peaks: [] },
    { id: "gentle", en: "Gentle start", de: "Sanfter Start", short: "gentle start", shortDe: "sanfter Start",
      textDe: "Kraft, Beweglichkeit und Gleichgewicht wachsen alle noch. Deine Praxis baut alles Schritt für Schritt auf, in Ruhe.",
      text: "Strength, flexibility and balance are all still growing. Your practice builds everything step by step, calmly.",
      animals: [["panda", "Panda", "Panda", "m"], ["koala", "Koala", "Koala", "m"], ["turtle", "Turtle", "Schildkröte", "f"]],
      work: ["calm", "flow", "hips", "hamstrings"], hard: ["arm balance", "core"], focus: ["hips", "hamstrings"], peaks: ["pk-triangle", "pk-halfsplits", "pk-pigeon"], pace: 1.5 },
  ];
  const NATURE = Object.fromEntries(NATURES.map(n => [n.id, n]));
  const ANIMALS = NATURES.flatMap(n => n.animals.map(([id, en, de, g]) => ({ id, en, de, g, nature: n.id })));
  // Animals from the first version (free choice) → ask for the three tests again.
  const OLD_ANIMALS = ["wolf", "owl", "hedgehog", "squirrel", "rabbit", "whale", "penguin", "lion", "zebra", "giraffe", "elephant", "camel", "swan", "eagle", "falcon", "parrot", "frog", "butterfly", "bee", "ladybird", "starfish", "badger", "beaver", "raccoon", "llama", "kangaroo", "horse", "goat", "mouse"];
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
      text: "New to yoga or back after a long break: basic poses, gentle versions, no Chaturanga.",
      textDe: "Neu im Yoga oder zurück nach langer Pause: Grundhaltungen, sanfte Varianten, kein Chaturanga." },
    { n: 2, name: "Foundation", de: "Fundament", maxLvl: 1, energy: "low", swap: { chaturanga: null },
      text: "Knows the basics: simple flows, Chaturanga still left out.",
      textDe: "Kennt die Grundlagen: einfache Flows, Chaturanga noch ausgelassen." },
    { n: 3, name: "Steady", de: "Sicher", maxLvl: 2, energy: "medium", swap: {},
      text: "Practises regularly: full vinyasa, intermediate poses, a peak with preparation.",
      textDe: "Übt regelmäßig: volle Vinyasa, mittlere Haltungen, ein Höhepunkt mit Vorbereitung." },
    { n: 4, name: "Strong practice", de: "Kräftige Praxis", maxLvl: 2, energy: "high", swap: {},
      text: "Confident: more rounds, deeper backbends, challenge offers.",
      textDe: "Sicher: mehr Runden, tiefere Rückbeugen, Herausforderungen zur Wahl." },
    { n: 5, name: "Advanced", de: "Fortgeschritten", maxLvl: 3, energy: "high", swap: {},
      text: "Experienced: advanced peaks, Wheel and wall inversions as challenges.",
      textDe: "Erfahren: anspruchsvolle Höhepunkte, Rad und Umkehrhaltungen an der Wand als Herausforderung." },
  ];
  // Tempo = cardio: breath length, pace (cost per pose change), intensity shift.
  const TEMPO_CFG = [
    { n: 1, cycle: 7, pace: 6, energy: -1, style: "slow", text: "Slow breath, fewer changes, longer rests.", textDe: "Langsamer Atem, weniger Wechsel, längere Pausen." },
    { n: 2, cycle: 6, pace: 3, energy: 0, style: "vinyasa", text: "Steady breath and flow.", textDe: "Gleichmäßiger Atem und Fluss." },
    { n: 3, cycle: 5, pace: 1.2, energy: 1, style: "vinyasa", text: "Quicker breath, more rounds and more poses.", textDe: "Schnellerer Atem, mehr Runden und mehr Haltungen." },
  ];

  // Themes = what you cook today. peaks = preferred peak themes from blocks.js; focus = tags the composer favours.
  const THEMES = [
    { id: "flow", en: "Classic flow", de: "Klassischer Flow", text: "A bit of everything.", textDe: "Von allem etwas.", focus: [], peaks: [] },
    { id: "hamstrings", en: "Hamstrings", de: "Beinrückseite", text: "Forward folds and long legs.", textDe: "Vorwärtsbeugen und lange Beine.", focus: ["hamstrings"], peaks: ["pk-halfsplits", "pk-handtoe", "pk-triangle", "pk-w3", "pk-halfmoon"] },
    { id: "hips", en: "Hips", de: "Hüften", text: "Lunges, squats and hip openers.", textDe: "Ausfallschritte, Hocken und Hüftöffner.", focus: ["hips"], peaks: ["pk-pigeon", "pk-eagle", "pk-crow"] },
    { id: "backbends", en: "Backbends", de: "Rückbeugen", text: "Open the front body, a strong back.", textDe: "Die Vorderseite öffnen, ein starker Rücken.", focus: ["back"], peaks: ["pk-camel", "pk-bow", "pk-wheel", "pk-dancer"] },
    { id: "twists", en: "Twists", de: "Drehungen", text: "Wring out the spine.", textDe: "Die Wirbelsäule auswringen.", focus: ["back"], tags: ["twist"], peaks: ["pk-revchair"] },
    { id: "balance", en: "Balance", de: "Gleichgewicht", text: "Standing on one leg, steady mind.", textDe: "Auf einem Bein stehen, ruhiger Geist.", focus: ["balance"], peaks: ["pk-w3", "pk-halfmoon", "pk-dancer", "pk-eagle", "pk-handtoe"] },
    { id: "core", en: "Core and arms", de: "Rumpf und Arme", text: "Plank, boat, arm balances.", textDe: "Brett, Boot, Armbalancen.", focus: ["core"], peaks: ["pk-crow", "pk-sideplank", "pk-boat", "pk-dolphin"] },
    { id: "shoulders", en: "Shoulders and sides", de: "Schultern und Flanken", text: "Side bends, open shoulders.", textDe: "Seitbeugen, offene Schultern.", focus: [], tags: ["shoulders", "sidebody"], peaks: ["pk-dolphin", "pk-triangle", "pk-halfmoon", "pk-sideplank"] },
    { id: "calm", en: "Calm", de: "Ruhe", text: "Slow, long holds, mostly on the floor.", textDe: "Langsam, lange Haltezeiten, meist am Boden.", focus: ["hips", "hamstrings"], style: "slow", energy: -1, cycle: 1, pace: 2, peaks: ["pk-pigeon", "pk-halfsplits", "pk-triangle"] },
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
    const nat = NATURE[(ANIMAL[st.animal] || {}).nature] || NATURE.allround;
    POSES.forEach(p => { me[p.id] = p.lvl > L.maxLvl ? "new" : nat.hard.includes(p.cat) ? "hard" : "ok"; });
    care.forEach(c => { c.avoid.forEach(id => { me[id] = "new"; }); Object.assign(swap, c.swap); });
    skip.forEach(id => { if (!BY[id] || KEEP.has(id)) return; if (CORE.has(id)) swap[id] = null; else me[id] = "new"; });
    Object.keys(swap).forEach(id => { if (me[id] === "new" && CORE.has(id)) me[id] = "ok"; });
    const lenF = minutes === 30 ? 1 : minutes === 45 ? 0.5 : 0.35;
    return {
      minutes, energy, style: th.style || T.style, cycle: T.cycle + (th.cycle || 0), pace: T.pace * lenF + (th.pace || 0) + (nat.pace || 0),
      focus: [...new Set(th.focus.concat(th.tags || [], nat.focus))], peaks: th.peaks, naturePeaks: nat.peaks, extraOffers: nat.challenge || 0, extraCore: nat.extraCore || 0, nature: nat.id,
      me, swap, challenges: today.challenges || {},
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

  // Nature from the three small tests and the sports background. Returns the best nature first, then the rest in order of fit.
  function natureOf(a) {
    const mv = new Set(a.moves || []);
    const F = (a.fold ?? 1) / 4 + (mv.has("dance") ? 0.2 : 0);
    const S = (a.plank ?? 2) / 3 + (mv.has("strength") ? 0.15 : 0) + (mv.has("martial") ? 0.1 : 0);
    const B = (a.balance ?? 1) / 2 + (mv.has("martial") || mv.has("dance") ? 0.15 : 0);
    const fit = {
      gentle: (1 - F) + (1 - S) + (1 - B) - 1.9,
      stiff: S - F - 0.3 - (F >= 0.6 ? 0.5 : 0),
      flexible: F - S - 0.3 - (S >= 0.6 ? 0.5 : 0),
      power: Math.min(F, S) - 0.6,
      balance: B - Math.max(F, S) - 0.05 + (B >= 0.9 ? 0.15 : 0),
      allround: 0.35 - Math.abs(F - S) * 0.5 - Math.abs(B - (F + S) / 2) * 0.3,
    };
    return Object.entries(fit).sort((x, y) => y[1] - x[1]).map(([id]) => id);
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

  root.YogaProfile = { NATURES, NATURE, OLD_ANIMALS, natureOf, ANIMALS, ANIMAL, AGES, TEMPOS, LEVELS, TEMPO_CFG, THEMES, THEME, CARE, CARE_BY, CORE, KEEP, code, parse, suggestAnimals, options, assess, next, norm };
  if (typeof module !== "undefined") module.exports = root.YogaProfile;
})(typeof window !== "undefined" ? window : globalThis);
