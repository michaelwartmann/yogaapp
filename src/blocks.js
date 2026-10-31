// Building-block library for the composer.
// A step is [poseId, hold] where hold is a breath count (number) or "in"/"out" for a flowing movement on one half-breath.
// An optional third element sets { side: "right"|"left" } for explicit sides, or { opt: 0.5 } for an optional add-on.
// In a sided block, every pose that is done on both sides takes the block's current side automatically.
// States describe where the body is between blocks: stand, dog, kneel, prone, supine, seat.
// Tags (what a block works or prepares): hamstrings, hips, hipflex, back, shoulders, core, balance, wrists, twist, sidebody, legs, rest.
(function (root) {
  const WARMUPS = [
    { id: "wu-catcow", name: "Cat and Cow", from: "kneel", to: "dog", int: 1, works: ["back", "wrists", "shoulders"],
      steps: [["bharmanasana", 1], ["bitilasana", "in"], ["marjaryasana", "out"], ["bitilasana", "in"], ["marjaryasana", "out"], ["bitilasana", "in"], ["marjaryasana", "out"], ["bitilasana", "in"], ["marjaryasana", "out"],
        ["uttana-shishosana", 4, { opt: 0.6 }], ["balasana", 3], ["adho-mukha-svanasana", 6]] },
    { id: "wu-supine", name: "Lying warm-up", from: "supine", to: "dog", int: 1, works: ["back", "hips", "twist", "legs"],
      steps: [["apanasana", 4], ["setu-bandha-sarvangasana", "in"], ["apanasana", "out"], ["setu-bandha-sarvangasana", "in"], ["apanasana", "out"], ["setu-bandha-sarvangasana", "in"], ["apanasana", "out"],
        ["supta-matsyendrasana", 4, { side: "right" }], ["supta-matsyendrasana", 4, { side: "left" }], ["ananda-balasana", 4, { opt: 0.6 }], ["bharmanasana", 1], ["bitilasana", "in"], ["marjaryasana", "out"], ["adho-mukha-svanasana", 6]] },
    { id: "wu-standing", name: "Standing warm-up", from: "stand", to: "stand", int: 2, works: ["sidebody", "legs", "hips"],
      steps: [["tadasana", 3], ["indudalasana", 3, { side: "right" }], ["indudalasana", 3, { side: "left" }], ["utthita-tadasana", "in"], ["utkata-konasana", "out"], ["utthita-tadasana", "in"], ["utkata-konasana", "out"], ["utthita-tadasana", "in"], ["utkata-konasana", 4],
        ["tadasana", 1], ["utkatasana", "in"], ["uttanasana", "out"], ["utkatasana", "in"], ["uttanasana", 4], ["tadasana", 2]] },
    { id: "wu-birddog", name: "Cat, Cow and Bird Dog", from: "kneel", to: "dog", int: 1, works: ["back", "core", "balance", "wrists"],
      steps: [["bharmanasana", 1], ["bitilasana", "in"], ["marjaryasana", "out"], ["bitilasana", "in"], ["marjaryasana", "out"], ["bitilasana", "in"], ["marjaryasana", "out"],
        ["bharmanasana", 1], ["dandayamana-bharmanasana", "in", { side: "right" }], ["dandayamana-marjaryasana", "out", { side: "right" }], ["dandayamana-bharmanasana", "in", { side: "right" }], ["dandayamana-marjaryasana", "out", { side: "right" }],
        ["dandayamana-bharmanasana", "in", { side: "right" }], ["dandayamana-marjaryasana", "out", { side: "right" }], ["dandayamana-bharmanasana", 3, { side: "right" }], ["bharmanasana", 1],
        ["dandayamana-bharmanasana", "in", { side: "left" }], ["dandayamana-marjaryasana", "out", { side: "left" }], ["dandayamana-bharmanasana", "in", { side: "left" }], ["dandayamana-marjaryasana", "out", { side: "left" }],
        ["dandayamana-bharmanasana", "in", { side: "left" }], ["dandayamana-marjaryasana", "out", { side: "left" }], ["dandayamana-bharmanasana", 3, { side: "left" }], ["balasana", 2], ["adho-mukha-svanasana", 5]] },
    { id: "wu-lunge", name: "Lunge warm-up", from: "kneel", to: "dog", int: 1, works: ["hipflex", "twist", "back"],
      steps: [["bharmanasana", 1], ["bitilasana", "in"], ["marjaryasana", "out"], ["bitilasana", "in"], ["marjaryasana", "out"], ["adho-mukha-svanasana", 4],
        ["anjaneyasana", 3, { side: "right" }], ["parivrtta-anjaneyasana", 3, { side: "right" }], ["adho-mukha-svanasana", 2],
        ["anjaneyasana", 3, { side: "left" }], ["parivrtta-anjaneyasana", 3, { side: "left" }], ["adho-mukha-svanasana", 4]] },
  ];

  // Sun salutations: one round, from Mountain back to Mountain. "alt" rounds switch the leading side each round.
  const SUNS = [
    { id: "sun-a", name: "Sun Salutation A", int: 2, works: ["hamstrings", "back", "shoulders", "wrists"],
      round: [["tadasana", "out"], ["urdhva-hastasana", "in"], ["uttanasana", "out"], ["ardha-uttanasana", "in"], ["phalakasana", "in"], ["chaturanga", "out"],
        ["urdhva-mukha-svanasana", "in"], ["adho-mukha-svanasana", 3], ["ardha-uttanasana", "in"], ["uttanasana", "out"], ["urdhva-hastasana", "in"], ["tadasana", "out"]] },
    { id: "sun-b", name: "Sun Salutation B", int: 3, works: ["legs", "hipflex", "back", "core"],
      round: [["utkatasana", "in"], ["uttanasana", "out"], ["ardha-uttanasana", "in"], ["phalakasana", "out"], ["chaturanga", "out"], ["urdhva-mukha-svanasana", "in"], ["adho-mukha-svanasana", "out"],
        ["virabhadrasana-1", "in", { side: "right" }], ["phalakasana", "out"], ["chaturanga", "out"], ["urdhva-mukha-svanasana", "in"], ["adho-mukha-svanasana", "out"],
        ["virabhadrasana-1", "in", { side: "left" }], ["phalakasana", "out"], ["chaturanga", "out"], ["urdhva-mukha-svanasana", "in"], ["adho-mukha-svanasana", 3],
        ["ardha-uttanasana", "in"], ["uttanasana", "out"], ["utkatasana", "in"], ["tadasana", "out"]] },
    { id: "sun-classic", name: "Classic Sun Salutation", int: 1, alt: true, works: ["hipflex", "back", "hamstrings"],
      round: [["tadasana", "out"], ["urdhva-hastasana", "in"], ["uttanasana", "out"], ["anjaneyasana", "in", { lead: true }], ["phalakasana", "out"], ["chaturanga", "out"],
        ["bhujangasana", "in"], ["adho-mukha-svanasana", 3], ["anjaneyasana", "in", { lead: true }], ["uttanasana", "out"], ["urdhva-hastasana", "in"], ["tadasana", "out"]] },
    { id: "sun-moon", name: "Moon Salutation", int: 1, slow: true, works: ["sidebody", "hips", "hamstrings", "legs"],
      round: [["tadasana", 1], ["indudalasana", 2, { side: "right" }], ["indudalasana", 2, { side: "left" }], ["utkata-konasana", 2], ["utthita-tadasana", 1],
        ["trikonasana", 2, { side: "right" }], ["parsvottanasana", 2, { side: "right" }], ["anjaneyasana", 2, { side: "right" }], ["skandasana", 2, { side: "right" }], ["malasana", 2],
        ["skandasana", 2, { side: "left" }], ["anjaneyasana", 2, { side: "left" }], ["parsvottanasana", 2, { side: "left" }], ["trikonasana", 2, { side: "left" }],
        ["utthita-tadasana", 1], ["utkata-konasana", 2], ["tadasana", 1]] },
  ];

  // Flow modules. sided: run once per side; between: what links the two sides.
  const MODULES = [
    // standing, from Down Dog back to Down Dog, a vinyasa between the sides
    { id: "s-warriors", kind: "standing", name: "Warrior flow", from: "dog", to: "dog", sided: true, between: "vinyasa", int: 2, prepares: ["hamstrings", "legs", "hips", "sidebody"],
      steps: [["virabhadrasana-1", 3], ["virabhadrasana-2", 3], ["trikonasana", 3], ["parsvottanasana", 3]] },
    { id: "s-sideangle", kind: "standing", name: "Side angle flow", from: "dog", to: "dog", sided: true, between: "vinyasa", int: 2, prepares: ["sidebody", "legs", "hamstrings", "hips"],
      steps: [["virabhadrasana-2", 2], ["viparita-virabhadrasana", 2], ["utthita-parsvakonasana", 3], ["trikonasana", 3]] },
    { id: "s-lunge-ham", kind: "standing", name: "Lunge and half splits", from: "dog", to: "dog", sided: true, between: "vinyasa", int: 1, prepares: ["hamstrings", "hipflex"],
      steps: [["anjaneyasana", 3], ["ardha-hanumanasana", 4], ["anjaneyasana", 1], ["ardha-hanumanasana", 4]] },
    { id: "s-lizard", kind: "standing", name: "Lizard flow", from: "dog", to: "dog", sided: true, between: "vinyasa", int: 1, prepares: ["hips", "hamstrings", "hipflex"],
      steps: [["anjaneyasana", 2], ["utthan-pristhasana", 5], ["ardha-hanumanasana", 4]] },
    { id: "s-balance", kind: "standing", name: "Balance flow", from: "dog", to: "dog", sided: true, between: "vinyasa", int: 3, prepares: ["balance", "hamstrings", "core", "legs"],
      steps: [["ashta-chandrasana", 2], ["virabhadrasana-3", 4], ["ardha-chandrasana", 4], ["parsvottanasana", 3]] },
    { id: "s-twist", kind: "standing", name: "Lunge twist flow", from: "dog", to: "dog", sided: true, between: "vinyasa", int: 1, prepares: ["twist", "hipflex", "back"],
      steps: [["ashta-chandrasana", 3], ["parivrtta-anjaneyasana", 4], ["anjaneyasana", 3]] },
    { id: "s-revlunge", kind: "standing", name: "Revolved lunge flow", from: "dog", to: "dog", sided: true, between: "vinyasa", int: 2, prepares: ["twist", "legs", "hipflex", "shoulders"],
      steps: [["ashta-chandrasana", 2], ["parivrtta-ashta-chandrasana", 4], ["parivrtta-parsvakonasana", 3], ["ashta-chandrasana", 1]] },
    { id: "s-dogplay", kind: "standing", name: "Three-legged dog, scorpion and wild thing", from: "dog", to: "dog", sided: true, between: "none", int: 2, prepares: ["twist", "back", "shoulders", "hips", "core"],
      steps: [["eka-pada-adho-mukha-svanasana", "in"], ["vrischika-svanasana", 2], ["camatkarasana", 3], ["adho-mukha-svanasana", 1],
        ["phalakasana", "in", { opt: 0.6 }], ["vasisthasana", 3, { opt: 0.6 }], ["adho-mukha-svanasana", 2]] },
    { id: "s-highlunge", kind: "standing", name: "High lunge flow", from: "dog", to: "dog", sided: true, between: "vinyasa", int: 2, prepares: ["legs", "hipflex", "sidebody"],
      steps: [["eka-pada-adho-mukha-svanasana", 1, { opt: 0.7 }], ["ashta-chandrasana", 3], ["virabhadrasana-2", 3], ["viparita-virabhadrasana", 2], ["utthita-parsvakonasana", 3]] },
    { id: "s-pyramid", kind: "standing", name: "Pyramid flow", from: "dog", to: "dog", sided: true, between: "vinyasa", int: 2, prepares: ["hamstrings", "balance"],
      steps: [["virabhadrasana-1", 2], ["parsvottanasana", 5], ["virabhadrasana-3", 3]] },
    // standing, from Mountain to Mountain
    { id: "s-wideleg", kind: "standing", name: "Wide-legged fold", from: "stand", to: "stand", sided: false, int: 1, prepares: ["hamstrings", "hips"],
      steps: [["utthita-tadasana", 1], ["prasarita-padottanasana", 6], ["utthita-tadasana", 1], ["tadasana", 1]] },
    { id: "s-goddess", kind: "standing", name: "Goddess flow", from: "stand", to: "stand", sided: false, int: 2, prepares: ["hips", "legs", "hamstrings"],
      steps: [["utthita-tadasana", 2], ["utkata-konasana", 4], ["skandasana", 3, { side: "right" }], ["skandasana", 3, { side: "left" }], ["utkata-konasana", 3], ["utthita-tadasana", 1], ["tadasana", 1]] },
    { id: "s-chairtwist", kind: "standing", name: "Chair and twist", from: "stand", to: "stand", sided: false, int: 2, prepares: ["twist", "legs", "core"],
      steps: [["utkatasana", 3], ["parivrtta-utkatasana", 4, { side: "right" }], ["utkatasana", 1], ["parivrtta-utkatasana", 4, { side: "left" }], ["uttanasana", 2], ["tadasana", 1]] },
    // balance, Mountain to Mountain
    { id: "b-tree", kind: "balance", name: "Tree", from: "stand", to: "stand", sided: true, int: 1, prepares: ["balance", "hips"], steps: [["vrksasana", 6]] },
    { id: "b-dancer", kind: "balance", name: "Dancer", from: "stand", to: "stand", sided: true, int: 2, prepares: ["balance", "hipflex", "back", "shoulders"], steps: [["natarajasana", 5]] },
    { id: "b-w3", kind: "balance", name: "Warrior III", from: "stand", to: "stand", sided: true, int: 2, prepares: ["balance", "hamstrings", "core"], steps: [["virabhadrasana-3", 5]] },
    { id: "b-eagle", kind: "balance", name: "Eagle", from: "stand", to: "stand", sided: true, int: 2, prepares: ["balance", "hips", "shoulders"], steps: [["utkatasana", 1], ["garudasana", 5]] },
    { id: "b-handtoe", kind: "balance", name: "Hand to big toe", from: "stand", to: "stand", sided: true, int: 2, prepares: ["balance", "hamstrings"], steps: [["utthita-hasta-padangusthasana", 5]] },
    // core
    { id: "c-boat", kind: "core", name: "Boat", from: "seat", to: "seat", sided: false, int: 2, prepares: ["core", "hipflex"], steps: [["paripurna-navasana", 5], ["dandasana", 1], ["paripurna-navasana", 5]] },
    { id: "c-sideplank", kind: "core", name: "Side plank", from: "dog", to: "dog", sided: true, between: "none", int: 2, prepares: ["core", "shoulders", "wrists"], steps: [["phalakasana", 1], ["vasisthasana", 4], ["adho-mukha-svanasana", 1]] },
    { id: "c-plankdog", kind: "core", name: "Plank and dog waves", from: "dog", to: "dog", sided: false, int: 2, prepares: ["core", "wrists", "shoulders"],
      steps: [["phalakasana", "in"], ["adho-mukha-svanasana", "out"], ["phalakasana", "in"], ["adho-mukha-svanasana", "out"], ["phalakasana", "in"], ["adho-mukha-svanasana", "out"], ["phalakasana", 4], ["adho-mukha-svanasana", 2]] },
    { id: "c-reverse", kind: "core", name: "Reverse table", from: "seat", to: "seat", sided: false, int: 1, prepares: ["core", "shoulders"],
      steps: [["dandasana", 1], ["ardha-purvottanasana", 4], ["dandasana", 1], ["ardha-purvottanasana", 4], ["dandasana", 1]] },
    { id: "c-dolphin", kind: "core", name: "Dolphin", from: "dog", to: "kneel", sided: false, int: 2, prepares: ["shoulders", "core"], steps: [["ardha-pincha-mayurasana", 5], ["balasana", 2], ["ardha-pincha-mayurasana", 4], ["balasana", 3]] },
    // floor backbends
    { id: "p-locust", kind: "back", name: "Locust", from: "prone", to: "kneel", sided: false, int: 1, prepares: ["back", "shoulders"], steps: [["salabhasana", 4], ["balasana", 2], ["salabhasana", 4], ["balasana", 2]] },
    { id: "p-sphinx", kind: "back", name: "Sphinx and locust", from: "prone", to: "kneel", sided: false, int: 1, prepares: ["back"], steps: [["salamba-bhujangasana", 6], ["salabhasana", 4], ["balasana", 3]] },
    { id: "p-bow", kind: "back", name: "Bow", from: "prone", to: "kneel", sided: false, int: 2, deep: true, prepares: ["back", "hipflex", "shoulders"], steps: [["salabhasana", 3], ["dhanurasana", 4], ["balasana", 2], ["dhanurasana", 4], ["balasana", 3]] },
    { id: "k-camel", kind: "back", name: "Camel", from: "kneel", to: "kneel", sided: false, int: 2, deep: true, prepares: ["back", "hipflex"], steps: [["ustrasana", 4], ["balasana", 3], ["ustrasana", 4], ["balasana", 4]] },
    { id: "k-puppy", kind: "back", name: "Puppy", from: "kneel", to: "kneel", sided: false, int: 1, prepares: ["shoulders", "back"], steps: [["uttana-shishosana", 6], ["balasana", 2]] },
    { id: "u-bridge", kind: "back", name: "Bridge", from: "supine", to: "supine", sided: false, int: 1, prepares: ["back", "hipflex", "legs"], steps: [["setu-bandha-sarvangasana", 5], ["setu-bandha-sarvangasana", 5], ["apanasana", 3]] },
    { id: "u-fish", kind: "back", name: "Fish", from: "supine", to: "supine", sided: false, int: 1, prepares: ["back", "shoulders"], steps: [["matsyasana", 5], ["apanasana", 3]] },
    // hips
    { id: "h-pigeon", kind: "hips", name: "Pigeon", from: "dog", to: "dog", sided: true, between: "none", int: 1, prepares: ["hips"], steps: [["eka-pada-adho-mukha-svanasana", 1], ["eka-pada-rajakapotasana", 8], ["adho-mukha-svanasana", 2]] },
    { id: "h-garland", kind: "hips", name: "Garland", from: "stand", to: "stand", sided: false, int: 1, prepares: ["hips"], steps: [["malasana", 6], ["uttanasana", 2], ["tadasana", 1]] },
    { id: "t-bound", kind: "hips", name: "Bound angle", from: "seat", to: "seat", sided: false, int: 1, prepares: ["hips"], steps: [["baddha-konasana", 8]] },
    { id: "t-cowface", kind: "hips", name: "Cow face", from: "seat", to: "seat", sided: true, between: "none", int: 2, prepares: ["hips", "shoulders"], steps: [["gomukhasana", 5]] },
    { id: "u-happy", kind: "hips", name: "Happy baby", from: "supine", to: "supine", sided: false, int: 1, prepares: ["hips", "back"], steps: [["ananda-balasana", 5]] },
    // cool-down: hamstrings, twists, rest
    { id: "t-fold", kind: "cool", name: "Seated fold", from: "seat", to: "seat", sided: false, int: 1, prepares: ["hamstrings", "back"], steps: [["dandasana", 2], ["paschimottanasana", 8]] },
    { id: "t-headknee", kind: "cool", name: "Head to knee", from: "seat", to: "seat", sided: true, between: "none", int: 1, prepares: ["hamstrings"], steps: [["janu-sirsasana", 6]] },
    { id: "t-twist", kind: "cool", name: "Seated twist", from: "seat", to: "seat", sided: true, between: "none", int: 1, prepares: ["twist", "back"], steps: [["ardha-matsyendrasana", 5]] },
    { id: "u-ham", kind: "cool", name: "Lying hamstring stretch", from: "supine", to: "supine", sided: true, between: "none", int: 1, prepares: ["hamstrings"], steps: [["supta-padangusthasana", 7]] },
    { id: "u-twist", kind: "cool", name: "Supine twist", from: "supine", to: "supine", sided: true, between: "none", int: 1, prepares: ["twist", "back"], steps: [["supta-matsyendrasana", 6]] },
    { id: "u-legsup", kind: "cool", name: "Legs up the wall", from: "supine", to: "supine", sided: false, int: 1, prepares: ["rest", "hamstrings"], steps: [["viparita-karani", 12]] },
  ];

  // Peaks: the pose a practice builds toward. needs = what must be prepared first; place = where it sits in the class.
  const PEAKS = [
    { id: "pk-halfmoon", pose: "ardha-chandrasana", name: "Half Moon", int: 2, place: "standing", needs: ["hamstrings", "balance", "sidebody"], from: "dog", to: "dog", sided: true, between: "vinyasa",
      steps: [["virabhadrasana-2", 2], ["trikonasana", 2], ["ardha-chandrasana", 5], ["parsvottanasana", 2]] },
    { id: "pk-w3", pose: "virabhadrasana-3", name: "Warrior III", int: 2, place: "standing", needs: ["hamstrings", "balance", "core"], from: "dog", to: "dog", sided: true, between: "vinyasa",
      steps: [["ashta-chandrasana", 2], ["virabhadrasana-3", 5], ["ashta-chandrasana", 1], ["virabhadrasana-3", 4]] },
    { id: "pk-dancer", pose: "natarajasana", name: "Dancer", int: 2, place: "balance", needs: ["hipflex", "back", "shoulders", "balance"], from: "stand", to: "stand", sided: true,
      steps: [["natarajasana", 5], ["tadasana", 1], ["natarajasana", 5]], counter: [["uttanasana", 4], ["tadasana", 1]] },
    { id: "pk-eagle", pose: "garudasana", name: "Eagle", int: 2, place: "balance", needs: ["hips", "shoulders", "balance", "legs"], from: "stand", to: "stand", sided: true,
      steps: [["utkatasana", 2], ["garudasana", 6]], counter: [["uttanasana", 3], ["tadasana", 1]] },
    { id: "pk-handtoe", pose: "utthita-hasta-padangusthasana", name: "Hand to Big Toe", int: 2, place: "balance", needs: ["hamstrings", "balance"], thread: true, from: "stand", to: "stand", sided: true,
      steps: [["vrksasana", 2], ["utthita-hasta-padangusthasana", 6]], counter: [["uttanasana", 4], ["tadasana", 1]] },
    { id: "pk-crow", pose: "bakasana", name: "Crow", int: 2, place: "standing", needs: ["core", "wrists", "hips"], from: "stand", to: "dog", sided: false,
      steps: [["malasana", 3], ["bakasana", 3], ["malasana", 2], ["bakasana", 4], ["phalakasana", 1], ["adho-mukha-svanasana", 2]], counter: [["balasana", 4], ["adho-mukha-svanasana", 2]] },
    { id: "pk-sideplank", pose: "vasisthasana", name: "Side Plank", int: 2, place: "core", needs: ["core", "shoulders", "wrists"], from: "dog", to: "dog", sided: true, between: "none",
      steps: [["phalakasana", 2], ["vasisthasana", 5], ["phalakasana", 1], ["adho-mukha-svanasana", 2]], counter: [["balasana", 4], ["adho-mukha-svanasana", 1]] },
    { id: "pk-camel", pose: "ustrasana", name: "Camel", int: 2, place: "floor", needs: ["back", "hipflex", "shoulders"], from: "kneel", to: "kneel", sided: false,
      steps: [["ustrasana", 4], ["balasana", 3], ["ustrasana", 5]], counter: [["balasana", 6]] },
    { id: "pk-bow", pose: "dhanurasana", name: "Bow", int: 2, place: "floor", needs: ["back", "hipflex", "shoulders"], from: "prone", to: "kneel", sided: false,
      steps: [["dhanurasana", 4], ["balasana", 2], ["dhanurasana", 5]], counter: [["balasana", 6]] },
    { id: "pk-wheel", pose: "urdhva-dhanurasana", name: "Wheel", int: 3, place: "floor", needs: ["back", "shoulders", "hipflex", "wrists"], from: "supine", to: "supine", sided: false,
      steps: [["setu-bandha-sarvangasana", 3], ["urdhva-dhanurasana", 4], ["setu-bandha-sarvangasana", 1], ["urdhva-dhanurasana", 4]], counter: [["apanasana", 5], ["supta-matsyendrasana", 3, { side: "right" }], ["supta-matsyendrasana", 3, { side: "left" }]] },
    { id: "pk-halfsplits", pose: "ardha-hanumanasana", name: "Half Splits", int: 1, place: "standing", needs: ["hamstrings", "hipflex"], thread: true, from: "dog", to: "dog", sided: true, between: "vinyasa",
      steps: [["anjaneyasana", 2], ["ardha-hanumanasana", 6], ["anjaneyasana", 1], ["ardha-hanumanasana", 8]] },
    { id: "pk-pigeon", pose: "eka-pada-rajakapotasana", name: "Pigeon", int: 1, place: "floor", needs: ["hips", "hipflex"], from: "dog", to: "dog", sided: true, between: "none",
      steps: [["eka-pada-adho-mukha-svanasana", 1], ["eka-pada-rajakapotasana", 10], ["adho-mukha-svanasana", 2]] },
    { id: "pk-triangle", pose: "trikonasana", name: "Triangle", int: 1, place: "standing", needs: ["hamstrings", "sidebody", "legs"], from: "dog", to: "dog", sided: true, between: "vinyasa",
      steps: [["virabhadrasana-2", 3], ["trikonasana", 6], ["utthita-parsvakonasana", 3], ["trikonasana", 4]] },
    { id: "pk-dolphin", pose: "ardha-pincha-mayurasana", name: "Dolphin", int: 2, place: "core", needs: ["shoulders", "core", "hamstrings"], from: "dog", to: "kneel", sided: false,
      steps: [["ardha-pincha-mayurasana", 5], ["balasana", 2], ["ardha-pincha-mayurasana", 6], ["balasana", 3]] },
    { id: "pk-boat", pose: "paripurna-navasana", name: "Boat", int: 2, place: "core", needs: ["core", "hipflex"], from: "seat", to: "seat", sided: false,
      steps: [["paripurna-navasana", 5], ["dandasana", 1], ["paripurna-navasana", 5], ["dandasana", 1], ["paripurna-navasana", 5]] },
    { id: "pk-revchair", pose: "parivrtta-utkatasana", name: "Revolved Chair", int: 2, place: "standing", needs: ["twist", "legs", "core"], from: "stand", to: "stand", sided: false,
      steps: [["utkatasana", 3], ["parivrtta-utkatasana", 5, { side: "right" }], ["utkatasana", 1], ["parivrtta-utkatasana", 5, { side: "left" }], ["uttanasana", 3], ["tadasana", 1]] },
  ];

  // How to get from one state to another, as steps.
  const CONNECT = {
    "stand>dog": [["uttanasana", "out"], ["phalakasana", "in"], ["adho-mukha-svanasana", 1]],
    "dog>stand": [["uttanasana", 2], ["tadasana", 1]],
    "dog>prone": [["phalakasana", "in"], ["chaturanga", "out"]],
    "dog>kneel": [["balasana", 2]],
    "kneel>dog": [["adho-mukha-svanasana", 2]],
    "prone>dog": [["balasana", 2], ["adho-mukha-svanasana", 2]],
    "seat>dog": [["bharmanasana", 1], ["adho-mukha-svanasana", 2]],
    "supine>dog": [["bharmanasana", 1], ["adho-mukha-svanasana", 2]],
    "supine>kneel": [["bharmanasana", 1]],
    "seat>kneel": [["bharmanasana", 1]],
  };
  const VINYASA = [["phalakasana", "in"], ["chaturanga", "out"], ["urdhva-mukha-svanasana", "in"], ["adho-mukha-svanasana", 2]];

  root.YogaBlocks = { WARMUPS, SUNS, MODULES, PEAKS, CONNECT, VINYASA };
  if (typeof module !== "undefined") module.exports = root.YogaBlocks;
})(typeof window !== "undefined" ? window : globalThis);
