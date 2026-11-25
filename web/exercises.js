// Övningar, muskelgrupper och animationsställningar.
import { SAFETY } from './safety.js';

export const MUSCLES = {
  cardio:    { name: 'Kondition',   order: 0 },
  legs:      { name: 'Ben & rumpa', order: 1 },
  back:      { name: 'Rygg',        order: 2 },
  chest:     { name: 'Bröst',       order: 3 },
  shoulders: { name: 'Axlar',       order: 4 },
  arms:      { name: 'Armar',       order: 5 },
  core:      { name: 'Mage & bål',  order: 6 },
};
export const MUSCLE_IDS = Object.keys(MUSCLES);

export const EQUIPMENT = {
  none: 'Ingen utrustning',
  dumbbells: 'Hantlar',
  kettlebell: 'Kettlebell',
  board: 'Balansplatta',
  ball: 'Gymboll',
  band: 'Gummiband',
  gym: 'Gymutrustning',
};

/** Utrustning man väljer bland när man tränar fritt. */
export const GEAR = {
  body: 'Kroppsvikt',
  dumbbells: 'Hantlar',
  kettlebell: 'Kettlebell',
  barbell: 'Skivstång',
  machine: 'Maskiner & kabel',
  ball: 'Gymboll',
  band: 'Gummiband',
  board: 'Balansplatta',
};
export const GEAR_IDS = Object.keys(GEAR);

// ---------------------------------------------------------------------------
// Ställningar för streckgubben. Koordinater: x 0–1 vänster→höger, y 0–1 uppifrån
// och ner, golvet vid y ≈ 0.96. Gubben tittar åt höger. N = närmsta arm/ben,
// F = bortre (ritas svagare).
const P = (x, y) => [x, y];
const mod = (base, changes) => ({ ...base, ...changes });

const standing = {
  head: P(0.50, 0.12), neck: P(0.50, 0.22), hip: P(0.50, 0.50),
  elbowN: P(0.52, 0.36), handN: P(0.53, 0.49),
  elbowF: P(0.48, 0.36), handF: P(0.47, 0.49),
  kneeN: P(0.52, 0.72), footN: P(0.53, 0.95),
  kneeF: P(0.48, 0.72), footF: P(0.47, 0.95),
};

const squatTop = mod(standing, {
  elbowN: P(0.62, 0.24), handN: P(0.75, 0.24), elbowF: P(0.61, 0.25), handF: P(0.74, 0.25),
});
const squatBottom = {
  head: P(0.58, 0.34), neck: P(0.52, 0.43), hip: P(0.36, 0.66),
  elbowN: P(0.65, 0.45), handN: P(0.78, 0.44),
  elbowF: P(0.64, 0.46), handF: P(0.77, 0.45),
  kneeN: P(0.58, 0.71), footN: P(0.53, 0.95),
  kneeF: P(0.56, 0.72), footF: P(0.47, 0.95),
};
const gobletTop = mod(standing, {
  elbowN: P(0.55, 0.35), handN: P(0.60, 0.28), elbowF: P(0.54, 0.35), handF: P(0.59, 0.28),
});
const gobletBottom = mod(squatBottom, {
  elbowN: P(0.58, 0.55), handN: P(0.64, 0.47), elbowF: P(0.57, 0.55), handF: P(0.63, 0.47),
});
const barbellSquatTop = mod(standing, {
  elbowN: P(0.42, 0.30), handN: P(0.46, 0.20), elbowF: P(0.41, 0.30), handF: P(0.45, 0.20),
});
const barbellSquatBottom = mod(squatBottom, {
  elbowN: P(0.44, 0.50), handN: P(0.49, 0.41), elbowF: P(0.43, 0.50), handF: P(0.48, 0.41),
});

const deadliftBottom = {
  head: P(0.67, 0.42), neck: P(0.58, 0.46), hip: P(0.32, 0.60),
  elbowN: P(0.59, 0.60), handN: P(0.59, 0.73),
  elbowF: P(0.58, 0.60), handF: P(0.58, 0.73),
  kneeN: P(0.52, 0.72), footN: P(0.53, 0.95),
  kneeF: P(0.50, 0.73), footF: P(0.47, 0.95),
};

const lungeTop = {
  head: P(0.50, 0.13), neck: P(0.50, 0.23), hip: P(0.50, 0.51),
  elbowN: P(0.51, 0.37), handN: P(0.52, 0.50),
  elbowF: P(0.49, 0.37), handF: P(0.48, 0.50),
  kneeN: P(0.60, 0.73), footN: P(0.68, 0.95),
  kneeF: P(0.38, 0.73), footF: P(0.25, 0.94),
};
const lungeBottom = {
  head: P(0.50, 0.30), neck: P(0.50, 0.40), hip: P(0.50, 0.68),
  elbowN: P(0.51, 0.54), handN: P(0.52, 0.67),
  elbowF: P(0.49, 0.54), handF: P(0.48, 0.67),
  kneeN: P(0.69, 0.72), footN: P(0.68, 0.95),
  kneeF: P(0.42, 0.90), footF: P(0.24, 0.93),
};

const bridgeDown = {
  head: P(0.20, 0.88), neck: P(0.30, 0.90), hip: P(0.56, 0.90),
  elbowN: P(0.38, 0.93), handN: P(0.48, 0.93),
  elbowF: P(0.37, 0.93), handF: P(0.47, 0.93),
  kneeN: P(0.68, 0.72), footN: P(0.79, 0.94),
  kneeF: P(0.67, 0.73), footF: P(0.78, 0.94),
};
const bridgeUp = mod(bridgeDown, { hip: P(0.55, 0.74), kneeN: P(0.74, 0.69), kneeF: P(0.73, 0.70) });

const benchUp = {
  head: P(0.78, 0.66), neck: P(0.68, 0.69), hip: P(0.40, 0.69),
  elbowN: P(0.68, 0.55), handN: P(0.68, 0.42),
  elbowF: P(0.67, 0.55), handF: P(0.67, 0.42),
  kneeN: P(0.20, 0.67), footN: P(0.18, 0.95),
  kneeF: P(0.22, 0.68), footF: P(0.21, 0.95),
};
const benchDown = mod(benchUp, {
  elbowN: P(0.60, 0.76), handN: P(0.66, 0.62), elbowF: P(0.59, 0.77), handF: P(0.65, 0.63),
});

const pushUpTop = {
  head: P(0.77, 0.58), neck: P(0.68, 0.62), hip: P(0.40, 0.775),
  elbowN: P(0.68, 0.78), handN: P(0.68, 0.94),
  elbowF: P(0.67, 0.78), handF: P(0.67, 0.94),
  kneeN: P(0.26, 0.853), footN: P(0.12, 0.94),
  kneeF: P(0.27, 0.85), footF: P(0.13, 0.94),
};
const pushUpBottom = {
  head: P(0.77, 0.77), neck: P(0.68, 0.80), hip: P(0.40, 0.865),
  elbowN: P(0.58, 0.81), handN: P(0.68, 0.94),
  elbowF: P(0.57, 0.82), handF: P(0.67, 0.94),
  kneeN: P(0.26, 0.90), footN: P(0.12, 0.94),
  kneeF: P(0.27, 0.90), footF: P(0.13, 0.94),
};

const pressDown = mod(standing, {
  elbowN: P(0.60, 0.30), handN: P(0.59, 0.17), elbowF: P(0.59, 0.31), handF: P(0.58, 0.18),
});
const pressUp = mod(standing, {
  elbowN: P(0.55, 0.09), handN: P(0.56, -0.04), elbowF: P(0.54, 0.09), handF: P(0.55, -0.04),
});
const curlDown = mod(standing, {
  elbowN: P(0.52, 0.36), handN: P(0.55, 0.49), elbowF: P(0.50, 0.36), handF: P(0.53, 0.49),
});
const curlUp = mod(curlDown, { handN: P(0.63, 0.26), handF: P(0.61, 0.26) });
const tricepsUp = mod(standing, {
  elbowN: P(0.54, 0.09), handN: P(0.55, -0.04), elbowF: P(0.53, 0.09), handF: P(0.54, -0.04),
});
const tricepsDown = mod(standing, {
  elbowN: P(0.55, 0.09), handN: P(0.43, 0.15), elbowF: P(0.54, 0.09), handF: P(0.42, 0.15),
});

const rowDown = {
  head: P(0.73, 0.36), neck: P(0.64, 0.40), hip: P(0.38, 0.52),
  elbowN: P(0.64, 0.54), handN: P(0.64, 0.67),
  elbowF: P(0.63, 0.54), handF: P(0.63, 0.67),
  kneeN: P(0.50, 0.72), footN: P(0.47, 0.95),
  kneeF: P(0.48, 0.72), footF: P(0.45, 0.95),
};
const rowUp = mod(rowDown, {
  elbowN: P(0.52, 0.37), handN: P(0.56, 0.50), elbowF: P(0.51, 0.38), handF: P(0.55, 0.51),
});

const pullDown = {
  head: P(0.49, 0.12), neck: P(0.50, 0.22), hip: P(0.50, 0.50),
  elbowN: P(0.52, 0.085), handN: P(0.53, -0.05),
  elbowF: P(0.51, 0.085), handF: P(0.52, -0.05),
  kneeN: P(0.49, 0.72), footN: P(0.38, 0.90),
  kneeF: P(0.48, 0.72), footF: P(0.37, 0.90),
};
const pullUp = {
  head: P(0.50, -0.08), neck: P(0.50, 0.02), hip: P(0.50, 0.30),
  elbowN: P(0.41, 0.04), handN: P(0.53, -0.05),
  elbowF: P(0.40, 0.04), handF: P(0.52, -0.05),
  kneeN: P(0.49, 0.52), footN: P(0.38, 0.70),
  kneeF: P(0.48, 0.52), footF: P(0.37, 0.70),
};

const supermanDown = {
  head: P(0.80, 0.89), neck: P(0.70, 0.92), hip: P(0.42, 0.92),
  elbowN: P(0.83, 0.92), handN: P(0.96, 0.92),
  elbowF: P(0.82, 0.925), handF: P(0.95, 0.925),
  kneeN: P(0.26, 0.925), footN: P(0.10, 0.93),
  kneeF: P(0.27, 0.93), footF: P(0.11, 0.935),
};
const supermanUp = mod(supermanDown, {
  neck: P(0.69, 0.87), head: P(0.79, 0.82),
  elbowN: P(0.82, 0.83), handN: P(0.95, 0.78),
  elbowF: P(0.81, 0.835), handF: P(0.94, 0.785),
  kneeN: P(0.26, 0.90), footN: P(0.11, 0.85),
  kneeF: P(0.27, 0.905), footF: P(0.12, 0.855),
});

const plankA = {
  head: P(0.76, 0.74), neck: P(0.66, 0.78), hip: P(0.40, 0.85),
  elbowN: P(0.66, 0.94), handN: P(0.80, 0.94),
  elbowF: P(0.65, 0.94), handF: P(0.79, 0.94),
  kneeN: P(0.26, 0.89), footN: P(0.12, 0.94),
  kneeF: P(0.27, 0.89), footF: P(0.13, 0.94),
};
const plankB = mod(plankA, { hip: P(0.40, 0.835), neck: P(0.66, 0.775), head: P(0.76, 0.735) });

const crunchDown = {
  head: P(0.20, 0.88), neck: P(0.30, 0.90), hip: P(0.56, 0.90),
  elbowN: P(0.30, 0.79), handN: P(0.21, 0.83),
  elbowF: P(0.29, 0.80), handF: P(0.20, 0.84),
  kneeN: P(0.68, 0.72), footN: P(0.80, 0.94),
  kneeF: P(0.67, 0.73), footF: P(0.79, 0.94),
};
const crunchUp = mod(crunchDown, {
  neck: P(0.37, 0.77), head: P(0.29, 0.71),
  elbowN: P(0.42, 0.66), handN: P(0.30, 0.66),
  elbowF: P(0.41, 0.67), handF: P(0.29, 0.67),
});

// Liggande benlyft: på rygg, raka ben lyfts upp mot taket.
const legRaiseDown = {
  head: P(0.16, 0.89), neck: P(0.26, 0.91), hip: P(0.54, 0.91),
  elbowN: P(0.38, 0.93), handN: P(0.50, 0.93),
  elbowF: P(0.37, 0.93), handF: P(0.49, 0.93),
  kneeN: P(0.70, 0.91), footN: P(0.86, 0.90),
  kneeF: P(0.69, 0.91), footF: P(0.85, 0.90),
};
const legRaiseUp = mod(legRaiseDown, {
  kneeN: P(0.57, 0.75), footN: P(0.59, 0.59),
  kneeF: P(0.56, 0.75), footF: P(0.58, 0.59),
});

// Captain's chair: ryggen mot dynan, underarmarna på armstöden, knäna dras upp.
const captainDown = {
  head: P(0.50, 0.12), neck: P(0.50, 0.22), hip: P(0.50, 0.50),
  elbowN: P(0.51, 0.37), handN: P(0.66, 0.36),
  elbowF: P(0.49, 0.37), handF: P(0.64, 0.36),
  kneeN: P(0.52, 0.71), footN: P(0.53, 0.91),
  kneeF: P(0.50, 0.71), footF: P(0.51, 0.91),
};
const captainUp = mod(captainDown, {
  hip: P(0.51, 0.49),
  kneeN: P(0.71, 0.45), footN: P(0.70, 0.66),
  kneeF: P(0.69, 0.46), footF: P(0.68, 0.67),
});

const jackIn = {
  head: P(0.50, 0.11), neck: P(0.50, 0.21), hip: P(0.50, 0.50),
  elbowN: P(0.58, 0.35), handN: P(0.60, 0.48),
  elbowF: P(0.42, 0.35), handF: P(0.40, 0.48),
  kneeN: P(0.53, 0.72), footN: P(0.54, 0.95),
  kneeF: P(0.47, 0.72), footF: P(0.46, 0.95),
};
const jackOut = {
  head: P(0.50, 0.09), neck: P(0.50, 0.19), hip: P(0.50, 0.47),
  elbowN: P(0.62, 0.08), handN: P(0.58, -0.05),
  elbowF: P(0.38, 0.08), handF: P(0.42, -0.05),
  kneeN: P(0.59, 0.71), footN: P(0.67, 0.94),
  kneeF: P(0.41, 0.71), footF: P(0.33, 0.94),
};

const climberA = mod(pushUpTop, { kneeN: P(0.58, 0.82), footN: P(0.50, 0.93) });
const climberB = mod(pushUpTop, { kneeF: P(0.58, 0.82), footF: P(0.50, 0.93) });

// Skonsamma övningar för knäna
const sideLyingDown = {
  head: P(0.86, 0.80), neck: P(0.76, 0.86), hip: P(0.45, 0.89),
  elbowN: P(0.64, 0.86), handN: P(0.62, 0.935),
  elbowF: P(0.82, 0.94), handF: P(0.88, 0.85),
  kneeN: P(0.24, 0.885), footN: P(0.03, 0.89),
  kneeF: P(0.24, 0.915), footF: P(0.03, 0.93),
};
const sideLyingUp = mod(sideLyingDown, { kneeN: P(0.25, 0.80), footN: P(0.06, 0.71) });

const slrDown = {
  head: P(0.20, 0.88), neck: P(0.30, 0.90), hip: P(0.56, 0.90),
  elbowN: P(0.42, 0.93), handN: P(0.52, 0.93),
  elbowF: P(0.41, 0.93), handF: P(0.51, 0.93),
  kneeN: P(0.78, 0.915), footN: P(1.00, 0.93),
  kneeF: P(0.67, 0.73), footF: P(0.78, 0.94),
};
const slrUp = mod(slrDown, { kneeN: P(0.73, 0.76), footN: P(0.90, 0.62) });

const calfUp = Object.fromEntries(Object.entries(standing).map(([k, [x, y]]) => [k, k.startsWith('foot') ? P(x + 0.01, 0.935) : P(x, y - 0.04)]));

const marchA = mod(standing, {
  kneeN: P(0.63, 0.60), footN: P(0.58, 0.80),
  elbowN: P(0.45, 0.36), handN: P(0.42, 0.47), elbowF: P(0.57, 0.35), handF: P(0.64, 0.29),
});
const marchB = mod(standing, {
  kneeF: P(0.63, 0.60), footF: P(0.58, 0.80),
  elbowF: P(0.45, 0.36), handF: P(0.42, 0.47), elbowN: P(0.57, 0.35), handN: P(0.64, 0.29),
});

const bikeBase = {
  head: P(0.71, 0.22), neck: P(0.62, 0.29), hip: P(0.40, 0.50),
  elbowN: P(0.70, 0.36), handN: P(0.79, 0.42),
  elbowF: P(0.69, 0.37), handF: P(0.78, 0.43),
};
const bike = [
  { kneeN: P(0.635, 0.514), footN: P(0.500, 0.725), kneeF: P(0.588, 0.641), footF: P(0.500, 0.875) },
  { kneeN: P(0.628, 0.556), footN: P(0.575, 0.800), kneeF: P(0.601, 0.622), footF: P(0.425, 0.800) },
  { kneeN: P(0.588, 0.641), footN: P(0.500, 0.875), kneeF: P(0.635, 0.514), footF: P(0.500, 0.725) },
  { kneeN: P(0.601, 0.622), footN: P(0.425, 0.800), kneeF: P(0.628, 0.556), footF: P(0.575, 0.800) },
].map((legs) => ({ ...bikeBase, ...legs }));

const hipThrustDown = mod(bridgeDown, { elbowN: P(0.47, 0.84), handN: P(0.56, 0.85), elbowF: P(0.46, 0.845), handF: P(0.55, 0.855) });
const hipThrustUp = mod(bridgeUp, { elbowN: P(0.45, 0.72), handN: P(0.55, 0.69), elbowF: P(0.44, 0.725), handF: P(0.54, 0.695) });

// Fysio: maskiner med ett ben i taget
const seated = {
  head: P(0.33, 0.20), neck: P(0.35, 0.30), hip: P(0.40, 0.58),
  elbowN: P(0.42, 0.46), handN: P(0.47, 0.585),
  elbowF: P(0.41, 0.46), handF: P(0.46, 0.585),
  kneeN: P(0.63, 0.575), footN: P(0.64, 0.83),
  kneeF: P(0.62, 0.585), footF: P(0.61, 0.84),
};
const extensionUp = mod(seated, { footN: P(0.88, 0.55) });
const curlBent = mod(seated, { footN: P(0.52, 0.79) });

const pressBase = {
  head: P(0.13, 0.43), neck: P(0.20, 0.51), hip: P(0.38, 0.72),
  elbowN: P(0.30, 0.71), handN: P(0.38, 0.77),
  elbowF: P(0.29, 0.715), handF: P(0.37, 0.775),
  kneeF: P(0.53, 0.63), footF: P(0.51, 0.86),
};
const pressBent = { ...pressBase, kneeN: P(0.432, 0.496), footN: P(0.66, 0.53) };
const pressStraight = { ...pressBase, kneeN: P(0.575, 0.575), footN: P(0.75, 0.465) };

// Fysio hemma
const miniSquatTop = {
  head: P(0.50, 0.12), neck: P(0.50, 0.22), hip: P(0.50, 0.50),
  elbowN: P(0.58, 0.33), handN: P(0.68, 0.35),
  elbowF: P(0.57, 0.34), handF: P(0.67, 0.36),
  kneeN: P(0.52, 0.72), footN: P(0.52, 0.95),
  kneeF: P(0.46, 0.72), footF: P(0.38, 0.86),
};
const miniSquatBottom = {
  head: P(0.55, 0.19), neck: P(0.52, 0.29), hip: P(0.45, 0.56),
  elbowN: P(0.60, 0.38), handN: P(0.70, 0.40),
  elbowF: P(0.59, 0.39), handF: P(0.69, 0.41),
  kneeN: P(0.57, 0.75), footN: P(0.52, 0.95),
  kneeF: P(0.42, 0.77), footF: P(0.34, 0.90),
};
const wallSitA = {
  head: P(0.31, 0.17), neck: P(0.31, 0.27), hip: P(0.32, 0.55),
  elbowN: P(0.36, 0.41), handN: P(0.44, 0.50),
  elbowF: P(0.35, 0.415), handF: P(0.43, 0.505),
  kneeN: P(0.50, 0.70), footN: P(0.55, 0.95),
  kneeF: P(0.49, 0.705), footF: P(0.53, 0.95),
};
const wallSitB = mod(wallSitA, { neck: P(0.31, 0.265), head: P(0.31, 0.165), elbowN: P(0.36, 0.405), elbowF: P(0.35, 0.41) });

// Kondition utan hopp
const guard = {
  head: P(0.52, 0.12), neck: P(0.51, 0.22), hip: P(0.49, 0.50),
  elbowN: P(0.57, 0.36), handN: P(0.61, 0.25),
  elbowF: P(0.56, 0.37), handF: P(0.59, 0.26),
  kneeN: P(0.57, 0.72), footN: P(0.61, 0.95),
  kneeF: P(0.45, 0.72), footF: P(0.40, 0.95),
};
const punchN = mod(guard, { elbowN: P(0.67, 0.26), handN: P(0.81, 0.25), head: P(0.53, 0.12) });
const punchF = mod(guard, { elbowF: P(0.66, 0.27), handF: P(0.80, 0.26), head: P(0.53, 0.12) });

const ropeBase = {
  head: P(0.56, 0.18), neck: P(0.53, 0.28), hip: P(0.46, 0.54),
  kneeN: P(0.55, 0.74), footN: P(0.52, 0.95),
  kneeF: P(0.52, 0.745), footF: P(0.44, 0.95),
};
const ropeA = { ...ropeBase, elbowN: P(0.61, 0.36), handN: P(0.72, 0.31), elbowF: P(0.59, 0.45), handF: P(0.70, 0.53) };
const ropeB = { ...ropeBase, elbowN: P(0.59, 0.45), handN: P(0.70, 0.53), elbowF: P(0.61, 0.36), handF: P(0.72, 0.31) };

// Maskiner och kabel (t.ex. Friskis & Svettis)
const pulldownUp = {
  head: P(0.36, 0.20), neck: P(0.37, 0.30), hip: P(0.40, 0.58),
  elbowN: P(0.45, 0.12), handN: P(0.47, -0.01),
  elbowF: P(0.44, 0.12), handF: P(0.46, -0.01),
  kneeN: P(0.63, 0.575), footN: P(0.64, 0.83),
  kneeF: P(0.62, 0.585), footF: P(0.61, 0.84),
};
const pulldownDown = mod(pulldownUp, {
  head: P(0.34, 0.205), neck: P(0.355, 0.305),
  elbowN: P(0.34, 0.42), handN: P(0.46, 0.29), elbowF: P(0.33, 0.42), handF: P(0.45, 0.29),
});
const rowOut = {
  head: P(0.36, 0.40), neck: P(0.35, 0.50), hip: P(0.30, 0.77),
  elbowN: P(0.47, 0.57), handN: P(0.62, 0.61),
  elbowF: P(0.46, 0.575), handF: P(0.61, 0.615),
  kneeN: P(0.50, 0.66), footN: P(0.69, 0.79),
  kneeF: P(0.49, 0.665), footF: P(0.68, 0.80),
};
const rowIn = mod(rowOut, {
  head: P(0.34, 0.40), neck: P(0.33, 0.50),
  elbowN: P(0.22, 0.62), handN: P(0.38, 0.66), elbowF: P(0.21, 0.625), handF: P(0.37, 0.665),
});
const chestPressIn = mod(seated, {
  elbowN: P(0.32, 0.40), handN: P(0.47, 0.35), elbowF: P(0.31, 0.405), handF: P(0.46, 0.355),
});
const chestPressOut = mod(seated, {
  elbowN: P(0.52, 0.34), handN: P(0.68, 0.34), elbowF: P(0.51, 0.345), handF: P(0.67, 0.345),
});
const pushdownUp = mod(standing, {
  head: P(0.53, 0.12), neck: P(0.52, 0.22),
  elbowN: P(0.53, 0.37), handN: P(0.62, 0.29), elbowF: P(0.52, 0.37), handF: P(0.61, 0.29),
});
const pushdownDown = mod(pushdownUp, { handN: P(0.57, 0.51), handF: P(0.56, 0.51) });

// Framifrån: utåtrotation (armbågarna mot sidorna, händerna roterar ut).
const rotIn = {
  head: P(0.50, 0.11), neck: P(0.50, 0.21), hip: P(0.50, 0.50),
  elbowN: P(0.58, 0.36), handN: P(0.53, 0.40),
  elbowF: P(0.42, 0.36), handF: P(0.47, 0.40),
  kneeN: P(0.53, 0.72), footN: P(0.54, 0.95),
  kneeF: P(0.47, 0.72), footF: P(0.46, 0.95),
};
const rotOut = mod(rotIn, { handN: P(0.71, 0.37), handF: P(0.29, 0.37) });
// Framifrån: väggänglar (W till Y).
const angelW = mod(rotIn, { elbowN: P(0.64, 0.27), handN: P(0.65, 0.13), elbowF: P(0.36, 0.27), handF: P(0.35, 0.13) });
const angelY = mod(rotIn, { elbowN: P(0.61, 0.08), handN: P(0.68, -0.04), elbowF: P(0.39, 0.08), handF: P(0.32, -0.04) });
// Fågelhunden: på alla fyra, sträck ut motsatt arm och ben.
// Kettlebell
const kbRack = mod(standing, {
  elbowN: P(0.54, 0.36), handN: P(0.59, 0.25), elbowF: P(0.53, 0.36), handF: P(0.58, 0.25),
});
const swingBottom = mod(deadliftBottom, {
  elbowN: P(0.52, 0.58), handN: P(0.45, 0.68), elbowF: P(0.51, 0.585), handF: P(0.44, 0.685),
});
const swingTop = mod(standing, {
  elbowN: P(0.63, 0.25), handN: P(0.76, 0.27), elbowF: P(0.62, 0.255), handF: P(0.75, 0.275),
});
const haloFront = mod(standing, {
  elbowN: P(0.56, 0.34), handN: P(0.62, 0.22), elbowF: P(0.55, 0.34), handF: P(0.61, 0.22),
});
const haloAbove = mod(standing, {
  elbowN: P(0.62, 0.11), handN: P(0.53, 0.00), elbowF: P(0.61, 0.11), handF: P(0.52, 0.00),
});
const haloBehind = mod(standing, {
  elbowN: P(0.59, 0.13), handN: P(0.43, 0.10), elbowF: P(0.58, 0.13), handF: P(0.42, 0.10),
});
const pulloverUp = mod(benchUp, {
  elbowN: P(0.69, 0.56), handN: P(0.70, 0.43), elbowF: P(0.68, 0.56), handF: P(0.69, 0.43),
});
const pulloverBack = mod(benchUp, {
  elbowN: P(0.81, 0.64), handN: P(0.94, 0.60), elbowF: P(0.80, 0.645), handF: P(0.93, 0.605),
});

const fourPoint = {
  head: P(0.76, 0.64), neck: P(0.66, 0.68), hip: P(0.38, 0.70),
  elbowN: P(0.67, 0.82), handN: P(0.67, 0.95),
  elbowF: P(0.66, 0.82), handF: P(0.66, 0.95),
  kneeN: P(0.39, 0.93), footN: P(0.17, 0.94),
  kneeF: P(0.38, 0.93), footF: P(0.16, 0.94),
};
const birdDogOut = mod(fourPoint, { elbowN: P(0.80, 0.66), handN: P(0.93, 0.63), kneeF: P(0.17, 0.69), footF: P(-0.05, 0.68) });

// Balans: stå på det närmsta benet.
const balanceArms = { elbowN: P(0.57, 0.33), handN: P(0.64, 0.42), elbowF: P(0.44, 0.33), handF: P(0.37, 0.42) };
const oneLegA = mod(standing, { ...balanceArms, kneeF: P(0.61, 0.60), footF: P(0.57, 0.81) });
const oneLegB = mod(oneLegA, { head: P(0.515, 0.12), neck: P(0.508, 0.22), handN: P(0.65, 0.40), handF: P(0.36, 0.44) });
const tandemA = mod(standing, { ...balanceArms, hip: P(0.51, 0.50), kneeN: P(0.555, 0.72), footN: P(0.58, 0.95), kneeF: P(0.47, 0.72), footF: P(0.44, 0.95) });
const tandemB = mod(tandemA, { head: P(0.49, 0.12), neck: P(0.495, 0.22), handN: P(0.63, 0.44), handF: P(0.38, 0.40) });
const slRdlTop = mod(standing, { kneeF: P(0.47, 0.73), footF: P(0.43, 0.93) });
const slRdlBottom = {
  head: P(0.83, 0.46), neck: P(0.73, 0.48), hip: P(0.46, 0.53),
  elbowN: P(0.72, 0.62), handN: P(0.72, 0.75),
  elbowF: P(0.71, 0.62), handF: P(0.71, 0.75),
  kneeN: P(0.49, 0.74), footN: P(0.50, 0.95),
  kneeF: P(0.25, 0.52), footF: P(0.03, 0.51),
};
const swingFront = mod(standing, { ...balanceArms, kneeF: P(0.61, 0.70), footF: P(0.72, 0.91) });
const swingBack = mod(standing, { ...balanceArms, kneeF: P(0.40, 0.70), footF: P(0.30, 0.91) });

// Balansplatta: gubben står på plattan, en bit ovanför golvet.
const BOARD_H = 0.075;
const onBoard = (pose) => Object.fromEntries(Object.entries(pose).map(([k, [x, y]]) => [k, P(x, y - BOARD_H)]));
// Framifrån med fötterna isär. tilt > 0 = höger fot (i bild) ner.
const boardFront = (tilt, shift = 0) => onBoard({
  head: P(0.50 + shift, 0.11), neck: P(0.50 + shift, 0.21), hip: P(0.50 + shift * 0.6, 0.50),
  elbowN: P(0.61 + shift, 0.34), handN: P(0.68 + shift, 0.44),
  elbowF: P(0.39 + shift, 0.34), handF: P(0.32 + shift, 0.44),
  kneeN: P(0.575, 0.725 + tilt * 0.6), footN: P(0.60, 0.95 + tilt),
  kneeF: P(0.425, 0.725 - tilt * 0.6), footF: P(0.40, 0.95 - tilt),
});
const boardSquatDown = onBoard({
  head: P(0.50, 0.23), neck: P(0.50, 0.33), hip: P(0.50, 0.62),
  elbowN: P(0.60, 0.42), handN: P(0.55, 0.36),
  elbowF: P(0.40, 0.42), handF: P(0.45, 0.36),
  kneeN: P(0.63, 0.76), footN: P(0.60, 0.95),
  kneeF: P(0.37, 0.76), footF: P(0.40, 0.95),
});
// Gymboll
const ballSitA = {
  head: P(0.45, 0.26), neck: P(0.45, 0.36), hip: P(0.45, 0.64),
  elbowN: P(0.52, 0.47), handN: P(0.59, 0.56),
  elbowF: P(0.38, 0.47), handF: P(0.31, 0.56),
  kneeN: P(0.65, 0.72), footN: P(0.66, 0.95),
  kneeF: P(0.66, 0.66), footF: P(0.88, 0.64),
};
const ballSitB = mod(ballSitA, { head: P(0.46, 0.26), neck: P(0.455, 0.36), handN: P(0.60, 0.54), handF: P(0.30, 0.58), footF: P(0.88, 0.61) });
const ballCrunchDown = {
  head: P(0.22, 0.58), neck: P(0.31, 0.62), hip: P(0.58, 0.66),
  elbowN: P(0.36, 0.50), handN: P(0.24, 0.55),
  elbowF: P(0.35, 0.51), handF: P(0.23, 0.56),
  kneeN: P(0.79, 0.72), footN: P(0.81, 0.95),
  kneeF: P(0.78, 0.72), footF: P(0.80, 0.95),
};
const ballCrunchUp = mod(ballCrunchDown, {
  head: P(0.30, 0.41), neck: P(0.36, 0.49),
  elbowN: P(0.44, 0.39), handN: P(0.32, 0.37), elbowF: P(0.43, 0.40), handF: P(0.31, 0.38),
});
const ballCurlOut = {
  head: P(0.03, 0.91), neck: P(0.12, 0.90), hip: P(0.38, 0.82),
  elbowN: P(0.22, 0.93), handN: P(0.34, 0.94),
  elbowF: P(0.21, 0.93), handF: P(0.33, 0.94),
  kneeN: P(0.60, 0.76), footN: P(0.82, 0.72),
  kneeF: P(0.59, 0.765), footF: P(0.81, 0.725),
};
const ballCurlIn = mod(ballCurlOut, {
  neck: P(0.15, 0.89), head: P(0.06, 0.90), hip: P(0.40, 0.74),
  kneeN: P(0.50, 0.53), footN: P(0.66, 0.68), kneeF: P(0.49, 0.535), footF: P(0.65, 0.685),
});
const ballWallTop = {
  head: P(0.52, 0.12), neck: P(0.52, 0.22), hip: P(0.52, 0.50),
  elbowN: P(0.54, 0.36), handN: P(0.55, 0.49), elbowF: P(0.50, 0.36), handF: P(0.49, 0.49),
  kneeN: P(0.60, 0.72), footN: P(0.68, 0.95), kneeF: P(0.59, 0.72), footF: P(0.67, 0.95),
};
const ballWallBottom = {
  head: P(0.50, 0.32), neck: P(0.50, 0.42), hip: P(0.50, 0.70),
  elbowN: P(0.62, 0.48), handN: P(0.75, 0.48), elbowF: P(0.61, 0.485), handF: P(0.74, 0.485),
  kneeN: P(0.70, 0.72), footN: P(0.68, 0.95), kneeF: P(0.69, 0.725), footF: P(0.67, 0.95),
};
const ballPlankA = {
  head: P(0.79, 0.47), neck: P(0.70, 0.52), hip: P(0.47, 0.68),
  elbowN: P(0.70, 0.66), handN: P(0.81, 0.65),
  elbowF: P(0.69, 0.66), handF: P(0.80, 0.65),
  kneeN: P(0.29, 0.81), footN: P(0.10, 0.95),
  kneeF: P(0.28, 0.81), footF: P(0.09, 0.95),
};
const ballPlankB = mod(ballPlankA, { hip: P(0.47, 0.665), neck: P(0.70, 0.515), head: P(0.79, 0.465) });

// Gummiband
const bandRowOut = mod(standing, {
  hip: P(0.49, 0.51), kneeN: P(0.53, 0.73), kneeF: P(0.49, 0.73),
  elbowN: P(0.62, 0.32), handN: P(0.75, 0.33), elbowF: P(0.61, 0.33), handF: P(0.74, 0.34),
});
const bandRowIn = mod(bandRowOut, { elbowN: P(0.39, 0.37), handN: P(0.52, 0.36), elbowF: P(0.38, 0.38), handF: P(0.51, 0.37) });
const bandPressIn = mod(standing, { elbowN: P(0.42, 0.33), handN: P(0.54, 0.29), elbowF: P(0.41, 0.34), handF: P(0.53, 0.30) });
const bandPressOut = mod(standing, { elbowN: P(0.64, 0.25), handN: P(0.77, 0.25), elbowF: P(0.63, 0.26), handF: P(0.76, 0.26) });
const pullApartIn = mod(rotIn, { elbowN: P(0.57, 0.27), handN: P(0.535, 0.27), elbowF: P(0.43, 0.27), handF: P(0.465, 0.27) });
const pullApartOut = mod(rotIn, { elbowN: P(0.64, 0.23), handN: P(0.77, 0.23), elbowF: P(0.36, 0.23), handF: P(0.23, 0.23) });
const sideWalkA = {
  head: P(0.50, 0.15), neck: P(0.50, 0.25), hip: P(0.50, 0.53),
  elbowN: P(0.61, 0.38), handN: P(0.57, 0.50), elbowF: P(0.39, 0.38), handF: P(0.43, 0.50),
  kneeN: P(0.57, 0.74), footN: P(0.59, 0.95), kneeF: P(0.43, 0.74), footF: P(0.41, 0.95),
};
const sideWalkB = {
  head: P(0.55, 0.15), neck: P(0.55, 0.25), hip: P(0.55, 0.53),
  elbowN: P(0.66, 0.38), handN: P(0.62, 0.50), elbowF: P(0.44, 0.38), handF: P(0.48, 0.50),
  kneeN: P(0.65, 0.73), footN: P(0.71, 0.95), kneeF: P(0.47, 0.74), footF: P(0.45, 0.95),
};

// Stretch: håll stilla, andas lugnt. B-ställningen är en liten utandning djupare in i stretchen.
const quadA = mod(standing, {
  elbowN: P(0.45, 0.355), handN: P(0.42, 0.49), kneeN: P(0.51, 0.72), footN: P(0.41, 0.51),
  elbowF: P(0.60, 0.29), handF: P(0.72, 0.29), kneeF: P(0.49, 0.72), footF: P(0.48, 0.95),
});
const quadB = mod(quadA, { kneeN: P(0.49, 0.72), footN: P(0.39, 0.51), handN: P(0.40, 0.49) });
const hamA = {
  head: P(0.70, 0.27), neck: P(0.62, 0.32), hip: P(0.44, 0.52),
  elbowN: P(0.66, 0.45), handN: P(0.62, 0.58), elbowF: P(0.65, 0.455), handF: P(0.61, 0.585),
  kneeN: P(0.57, 0.73), footN: P(0.68, 0.93), kneeF: P(0.40, 0.73), footF: P(0.34, 0.95),
};
const hamB = mod(hamA, { head: P(0.73, 0.31), neck: P(0.645, 0.355), elbowN: P(0.68, 0.49), handN: P(0.64, 0.62), elbowF: P(0.67, 0.495), handF: P(0.63, 0.625) });
const calfA = {
  head: P(0.70, 0.22), neck: P(0.62, 0.29), hip: P(0.45, 0.52),
  elbowN: P(0.74, 0.32), handN: P(0.86, 0.30), elbowF: P(0.73, 0.325), handF: P(0.85, 0.305),
  kneeN: P(0.36, 0.73), footN: P(0.27, 0.95), kneeF: P(0.60, 0.72), footF: P(0.60, 0.95),
};
const calfB = mod(calfA, { head: P(0.72, 0.23), neck: P(0.64, 0.30), hip: P(0.47, 0.53), elbowN: P(0.76, 0.34), elbowF: P(0.75, 0.345), kneeF: P(0.63, 0.73) });
const chestA = mod(standing, { elbowN: P(0.38, 0.24), handN: P(0.28, 0.22), elbowF: P(0.50, 0.36), handF: P(0.52, 0.49) });
const chestB = mod(chestA, { head: P(0.54, 0.12), neck: P(0.52, 0.22), elbowF: P(0.52, 0.36), handF: P(0.54, 0.49) });
const shoulderA = mod(rotIn, { elbowN: P(0.44, 0.30), handN: P(0.31, 0.28), elbowF: P(0.40, 0.40), handF: P(0.44, 0.31) });
const shoulderB = mod(shoulderA, { elbowN: P(0.42, 0.30), handN: P(0.29, 0.28), handF: P(0.42, 0.31) });
const hipFlexA = mod(lungeBottom, { elbowN: P(0.58, 0.53), handN: P(0.67, 0.62), elbowF: P(0.57, 0.535), handF: P(0.66, 0.625) });
const hipFlexB = mod(hipFlexA, { head: P(0.53, 0.31), neck: P(0.53, 0.41), hip: P(0.53, 0.70), kneeF: P(0.43, 0.90) });
const childA = {
  head: P(0.60, 0.88), neck: P(0.51, 0.85), hip: P(0.26, 0.76),
  elbowN: P(0.64, 0.92), handN: P(0.77, 0.94), elbowF: P(0.63, 0.925), handF: P(0.76, 0.945),
  kneeN: P(0.42, 0.93), footN: P(0.18, 0.95), kneeF: P(0.41, 0.935), footF: P(0.17, 0.95),
};
const childB = mod(childA, { hip: P(0.25, 0.775), neck: P(0.50, 0.86), head: P(0.59, 0.895) });

const boardSquatUp = mod(boardFront(0), { elbowN: P(0.60, 0.30), handN: P(0.55, 0.24), elbowF: P(0.40, 0.30), handF: P(0.45, 0.24) });

/** period = sekunder för ett helt varv genom alla ställningar (två ställningar = fram och tillbaka). */
export const ANIMATIONS = {
  squat:            { period: 2.6, frames: [squatTop, squatBottom] },
  gobletSquat:      { period: 2.6, frames: [gobletTop, gobletBottom] },
  barbellSquat:     { period: 2.6, frames: [barbellSquatTop, barbellSquatBottom] },
  deadlift:         { period: 2.6, frames: [standing, deadliftBottom] },
  lunge:            { period: 2.6, frames: [lungeTop, lungeBottom] },
  gluteBridge:      { period: 2.6, frames: [bridgeDown, bridgeUp] },
  benchPress:       { period: 2.6, frames: [benchUp, benchDown] },
  pushUp:           { period: 2.4, frames: [pushUpTop, pushUpBottom] },
  shoulderPress:    { period: 2.6, frames: [pressDown, pressUp] },
  bicepCurl:        { period: 2.0, frames: [curlDown, curlUp] },
  tricepsExtension: { period: 2.6, frames: [tricepsUp, tricepsDown] },
  row:              { period: 2.4, frames: [rowDown, rowUp] },
  pullUp:           { period: 2.6, frames: [pullDown, pullUp] },
  superman:         { period: 2.6, frames: [supermanDown, supermanUp] },
  plank:            { period: 3.0, frames: [plankA, plankB] },
  crunch:           { period: 2.0, frames: [crunchDown, crunchUp] },
  lyingLegRaise:    { period: 3.0, frames: [legRaiseDown, legRaiseUp] },
  captainsChair:    { period: 2.6, frames: [captainDown, captainUp] },
  jumpingJack:      { period: 1.0, frames: [jackIn, jackOut], front: true },
  mountainClimber:  { period: 0.8, frames: [climberA, climberB] },
  sideLegRaise:     { period: 2.6, frames: [sideLyingDown, sideLyingUp] },
  straightLegRaise: { period: 3.0, frames: [slrDown, slrUp] },
  calfRaise:        { period: 1.8, frames: [standing, calfUp] },
  march:            { period: 1.6, frames: [standing, marchA, standing, marchB] },
  bike:             { period: 1.2, frames: bike },
  hipThrust:        { period: 2.6, frames: [hipThrustDown, hipThrustUp] },
  legExtension:     { period: 2.8, frames: [seated, extensionUp] },
  legCurl:          { period: 2.8, frames: [extensionUp, curlBent] },
  legPress:         { period: 2.8, frames: [pressBent, pressStraight] },
  miniSquat:        { period: 2.6, frames: [miniSquatTop, miniSquatBottom] },
  shadowBox:        { period: 1.2, frames: [guard, punchN, guard, punchF] },
  latPulldown:      { period: 2.6, frames: [pulldownUp, pulldownDown] },
  seatedRow:        { period: 2.6, frames: [rowOut, rowIn] },
  chestPress:       { period: 2.6, frames: [chestPressIn, chestPressOut] },
  pushdown:         { period: 2.2, frames: [pushdownUp, pushdownDown] },
  battleRopes:      { period: 0.7, frames: [ropeA, ropeB] },
  wallSit:          { period: 3.0, frames: [wallSitA, wallSitB] },
  idle:             { period: 3.0, frames: [standing, standing] },
  externalRotation: { period: 2.6, frames: [rotIn, rotOut], front: true },
  wallAngel:        { period: 3.0, frames: [angelW, angelY], front: true },
  birdDog:          { period: 3.2, frames: [fourPoint, birdDogOut] },
  kbClean:          { period: 2.4, frames: [deadliftBottom, kbRack] },
  kbSwing:          { period: 1.6, frames: [swingBottom, swingTop] },
  halo:             { period: 3.2, frames: [haloFront, haloAbove, haloBehind, haloAbove] },
  pullover:         { period: 3.0, frames: [pulloverUp, pulloverBack] },
  singleLegStand:   { period: 3.4, frames: [oneLegA, oneLegB] },
  tandemStand:      { period: 3.4, frames: [tandemA, tandemB] },
  singleLegRdl:     { period: 3.0, frames: [slRdlTop, slRdlBottom] },
  legSwing:         { period: 2.0, frames: [swingFront, swingBack] },
  boardStand:       { period: 3.6, frames: [boardFront(0.012, 0.008), boardFront(-0.012, -0.008)], front: true },
  boardTilt:        { period: 2.4, frames: [boardFront(0.035, 0.02), boardFront(-0.035, -0.02)], front: true },
  boardSquat:       { period: 2.8, frames: [boardSquatUp, boardSquatDown], front: true },
  boardSingleLeg:   { period: 3.4, frames: [onBoard(oneLegA), onBoard(oneLegB)] },
  stretchQuad:      { period: 5.0, frames: [quadA, quadB] },
  stretchHam:       { period: 5.0, frames: [hamA, hamB] },
  stretchCalf:      { period: 5.0, frames: [calfA, calfB] },
  stretchChest:     { period: 5.0, frames: [chestA, chestB] },
  stretchShoulder:  { period: 5.0, frames: [shoulderA, shoulderB], front: true },
  stretchHipFlex:   { period: 5.0, frames: [hipFlexA, hipFlexB] },
  stretchChild:     { period: 5.0, frames: [childA, childB] },
  ballSit:          { period: 3.4, frames: [ballSitA, ballSitB] },
  ballCrunch:       { period: 2.4, frames: [ballCrunchDown, ballCrunchUp] },
  ballCurl:         { period: 2.8, frames: [ballCurlOut, ballCurlIn] },
  ballWallSquat:    { period: 3.0, frames: [ballWallTop, ballWallBottom] },
  ballPlank:        { period: 3.0, frames: [ballPlankA, ballPlankB] },
  bandRow:          { period: 2.4, frames: [bandRowOut, bandRowIn] },
  bandPress:        { period: 2.4, frames: [bandPressIn, bandPressOut] },
  pullApart:        { period: 2.4, frames: [pullApartIn, pullApartOut], front: true },
  sideWalk:         { period: 1.6, frames: [sideWalkA, sideWalkB], front: true },
};

// ---------------------------------------------------------------------------
// Övningsbibliotek. Första muskeln är den primära.
export const EXERCISES = [
  // Ben
  { kneeHeavy: true, id: 'squat', name: 'Knäböj', muscles: ['legs', 'core'], equipment: 'none',
    sets: 3, reps: '12–15', defaultReps: 12, anim: 'squat',
    tips: ['Stå med fötterna axelbrett isär och tårna lätt utåt.',
           'Skjut bak höften som om du ska sätta dig på en stol.',
           'Håll bröstet uppe och knäna i linje med tårna.',
           'Gå ner tills låren är parallella med golvet och tryck upp genom hälarna.'] },
  { kneeHeavy: true, id: 'goblet-squat', name: 'Gobletknäböj', muscles: ['legs', 'core'], equipment: 'dumbbells',
    sets: 3, reps: '10–12', defaultReps: 10, anim: 'gobletSquat', props: ['dumbbells'],
    tips: ['Håll en hantel lodrätt mot bröstet med båda händerna.',
           'Sitt ner mellan hälarna med rak rygg.',
           'Armbågarna pekar nedåt och kan nudda knäna i bottenläget.',
           'Pressa upp kontrollerat.'] },
  { kneeHeavy: true, id: 'barbell-squat', name: 'Knäböj med skivstång', muscles: ['legs', 'core'], equipment: 'gym',
    sets: 4, reps: '6–10', defaultReps: 8, anim: 'barbellSquat', props: ['barbell'],
    tips: ['Lägg stången på övre delen av ryggen, inte på nacken.',
           'Andas in och spänn magen innan du går ner.',
           'Knäna följer tårnas riktning.',
           'Börja med lätt vikt och fokusera på tekniken.'] },
  { kneeHeavy: true, id: 'lunge', name: 'Utfallssteg', muscles: ['legs'], equipment: 'none',
    sets: 3, reps: '10 per ben', defaultReps: 10, anim: 'lunge',
    tips: ['Ta ett långt steg framåt.',
           'Sänk bakre knät mot golvet tills båda knäna är i ca 90 grader.',
           'Håll överkroppen upprätt.',
           'Tryck ifrån med det främre benet och byt ben.'] },
  { kneeHeavy: true, id: 'db-lunge', name: 'Utfall med hantlar', muscles: ['legs'], equipment: 'dumbbells',
    sets: 3, reps: '8–10 per ben', defaultReps: 8, anim: 'lunge', props: ['dumbbells'],
    tips: ['Håll en hantel i varje hand med raka armar.',
           'Kliv fram och sänk bakre knät mot golvet.',
           'Främre knät ska vara ovanför foten, inte framför tårna.',
           'Växla ben varje repetition eller kör alla på ett ben först.'] },
  { id: 'glute-bridge', name: 'Höftlyft', muscles: ['legs', 'core'], equipment: 'none',
    sets: 3, reps: '15', defaultReps: 15, anim: 'gluteBridge',
    tips: ['Ligg på rygg med böjda knän och fötterna i golvet.',
           'Spänn rumpan och lyft höften tills kroppen är rak från knä till axel.',
           'Håll uppe en sekund.',
           'Sänk långsamt.'] },
  { id: 'rdl', name: 'Rumänska marklyft', muscles: ['legs', 'back'], equipment: 'dumbbells',
    sets: 3, reps: '10–12', defaultReps: 10, anim: 'deadlift', props: ['dumbbells'],
    tips: ['Stå med lätt böjda knän och hantlarna framför låren.',
           'Fäll framåt från höften och för hantlarna nära benen.',
           'Håll ryggen rak – känn sträckningen på baksida lår.',
           'Res dig genom att skjuta fram höften.'] },

  { id: 'straight-leg-raise', name: 'Raka benlyft', muscles: ['legs', 'core'], equipment: 'none',
    sets: 3, reps: '10–12 per ben', defaultReps: 10, anim: 'straightLegRaise',
    tips: ['Ligg på rygg med ena benet böjt och foten i golvet.',
           'Spänn framsidan av låret på det raka benet så att knät är helt rakt.',
           'Lyft benet långsamt till samma höjd som det böjda knät.',
           'Sänk lika långsamt. Byt ben.'] },
  { id: 'side-leg-raise', name: 'Sidoliggande benlyft', muscles: ['legs'], equipment: 'none',
    sets: 3, reps: '12–15 per ben', defaultReps: 12, anim: 'sideLegRaise',
    tips: ['Ligg på sidan med benen raka och huvudet vilande på armen.',
           'Lyft det översta benet snett uppåt, med tån pekande framåt.',
           'Håll höften stilla. Rotera inte bakåt.',
           'Sänk långsamt. Byt sida.'] },
  { id: 'calf-raise', name: 'Tåhävningar', muscles: ['legs'], equipment: 'none',
    sets: 3, reps: '15–20', defaultReps: 15, anim: 'calfRaise',
    tips: ['Stå med fötterna höftbrett isär, gärna med lätt stöd mot en vägg.',
           'Res dig upp på tå så högt du kan.',
           'Håll en sekund i toppen.',
           'Sänk långsamt. Knäna är raka men inte låsta.'] },
  { id: 'hip-thrust', name: 'Höftlyft med skivstång', muscles: ['legs', 'core'], equipment: 'gym',
    sets: 3, reps: '10–12', defaultReps: 10, anim: 'hipThrust', props: ['barbell'],
    tips: ['Ligg på rygg med stången över höften. Använd gärna en dyna.',
           'Fötterna i golvet, ungefär under knäna.',
           'Spänn rumpan och lyft höften tills kroppen är rak från knä till axel.',
           'Sänk kontrollerat. Rörelsen sker i höften, knävinkeln är densamma.'] },

  { kneeHeavy: true, id: 'leg-press', name: 'Benpress', muscles: ['legs'], equipment: 'gym',
    sets: 3, reps: '10–12', defaultReps: 10, anim: 'legPress', props: ['legpress'],
    tips: ['Sätt fötterna höftbrett mitt på plattan.',
           'Lossa spärren och sänk plattan tills knäna är i ungefär 90 grader.',
           'Pressa ut genom hela foten tills benen är nästan raka.',
           'Lås inte knäna i toppen.'] },
  { id: 'leg-extension', name: 'Benspark', muscles: ['legs'], equipment: 'gym',
    sets: 3, reps: '12–15', defaultReps: 12, anim: 'legExtension', props: ['machine', 'pad'],
    tips: ['Ställ in maskinen så att knät är i linje med vridpunkten.',
           'Dynan ligger mot nedre delen av smalbenen.',
           'Sträck benen lugnt tills de är raka.',
           'Sänk långsamt, ungefär 3 sekunder ner.'] },
  { id: 'leg-curl', name: 'Bencurl', muscles: ['legs'], equipment: 'gym',
    sets: 3, reps: '10–12', defaultReps: 10, anim: 'legCurl', props: ['machine', 'pad'],
    tips: ['Ställ in maskinen så att knät är i linje med vridpunkten.',
           'Dynan ligger strax ovanför hälarna.',
           'Böj knäna och dra hälarna in under sätet.',
           'Släpp tillbaka långsamt och kontrollerat.'] },

  // Fysio (ordinerade av fysioterapeut – föreslås inte automatiskt)
  { id: 'single-leg-extension', name: 'Benspark med ett ben', muscles: ['legs'], equipment: 'gym', physio: true,
    sets: 3, reps: '8 per ben', defaultReps: 8, anim: 'legExtension', props: ['machine', 'pad'],
    tips: ['Ställ in maskinen så att knät är i linje med maskinens vridpunkt och dynan ligger mot nedre delen av smalbenet.',
           'Sträck benet lugnt tills det är rakt, utan att låsa knät med en smäll.',
           'Sänk långsamt, ungefär 3 sekunder ner.',
           'Följ din fysioterapeuts råd om vikt och hur långt du böjer knät.'] },
  { id: 'single-leg-curl', name: 'Bencurl med ett ben', muscles: ['legs'], equipment: 'gym', physio: true,
    sets: 3, reps: '8 per ben', defaultReps: 8, anim: 'legCurl', props: ['machine', 'pad'],
    tips: ['Ställ in maskinen så att knät är i linje med vridpunkten och dynan ligger strax ovanför hälen.',
           'Böj knät och dra hälen in under sätet med baksidan av låret.',
           'Släpp tillbaka långsamt och kontrollerat.',
           'Följ din fysioterapeuts råd om vikt och rörelseomfång.'] },
  { id: 'single-leg-press', name: 'Benpress med ett ben', muscles: ['legs'], equipment: 'gym', physio: true,
    sets: 3, reps: '8 per ben', defaultReps: 8, anim: 'legPress', props: ['legpress'],
    tips: ['Sätt foten mitt på plattan, med knät i linje med tårna.',
           'Pressa ut tills benet är nästan rakt, utan att låsa knät.',
           'Sänk långsamt så långt det känns bra i knät.',
           'Börja lätt och följ din fysioterapeuts råd om vikt och djup.'] },
  { id: 'single-leg-mini-squat', name: 'Knäböj på ett ben (kort)', muscles: ['legs'], equipment: 'none', physio: true,
    sets: 3, reps: '8 per ben', defaultReps: 8, anim: 'miniSquat',
    tips: ['Stå på ett ben med lätt stöd mot en vägg eller stol om du behöver.',
           'Skjut bak höften och böj knät bara en liten bit, inte djupt.',
           'Håll knät rakt över foten så att det inte faller inåt.',
           'Res dig lugnt. Gå bara så djupt som din fysioterapeut sagt och det känns bra.'] },
  { id: 'wall-sit-high', name: 'Väggsittande (högt)', muscles: ['legs'], equipment: 'none', physio: true,
    sets: 3, reps: '30–45 s', defaultReps: 30, anim: 'wallSit', props: ['wall'], timed: true,
    tips: ['Stå med ryggen mot en vägg och fötterna en bit ut från väggen.',
           'Glid ner tills knäna är lätt böjda. Stanna högre än 90 grader.',
           'Knäna ska vara ovanför fötterna, inte framför tårna.',
           'Håll ställningen och andas lugnt. Res dig genom att glida upp längs väggen.'] },

  // Rygg
  { kneeHeavy: true, id: 'deadlift', name: 'Marklyft', muscles: ['back', 'legs'], equipment: 'gym',
    sets: 3, reps: '5–8', defaultReps: 6, anim: 'deadlift', props: ['barbell'],
    tips: ['Stå med mitten av foten under stången.',
           'Greppa stången, sänk höften och håll ryggen rak.',
           'Lyft genom att trycka golvet ifrån dig – stången nära kroppen.',
           'Stå upprätt utan att svanka, sänk sedan kontrollerat.'] },
  { id: 'db-row', name: 'Hantelrodd', muscles: ['back', 'arms'], equipment: 'dumbbells',
    sets: 3, reps: '10–12', defaultReps: 10, anim: 'row', props: ['dumbbells'],
    tips: ['Fäll fram överkroppen med rak rygg och lätt böjda knän.',
           'Dra hantlarna mot höften.',
           'Kläm ihop skulderbladen i toppläget.',
           'Sänk långsamt.'] },
  { id: 'barbell-row', name: 'Skivstångsrodd', muscles: ['back', 'arms'], equipment: 'gym',
    sets: 4, reps: '8–10', defaultReps: 8, anim: 'row', props: ['barbell'],
    tips: ['Fäll fram ca 45 grader med rak rygg.',
           'Dra stången mot naveln.',
           'Armbågarna nära kroppen.',
           'Undvik att gunga med överkroppen.'] },
  { id: 'lat-pulldown', name: 'Latsdrag', muscles: ['back', 'arms'], equipment: 'gym',
    sets: 3, reps: '10–12', defaultReps: 10, anim: 'latPulldown', props: ['machine', 'thighpad'], cable: [0.47, -0.17],
    tips: ['Sätt dig med låren under dynan och greppa stången lite bredare än axelbrett.',
           'Luta dig bakåt en aning och dra stången ner mot övre delen av bröstet.',
           'Tänk att du drar armbågarna ner mot sidorna och klämmer ihop skulderbladen.',
           'Släpp upp stången långsamt tills armarna är raka.'] },
  { id: 'seated-row', name: 'Sittande rodd (kabel)', muscles: ['back', 'arms'], equipment: 'gym',
    sets: 3, reps: '10–12', defaultReps: 10, anim: 'seatedRow', props: ['rowseat'], cable: [1.04, 0.69],
    tips: ['Sätt dig med fötterna mot fotplattan och knäna lätt böjda.',
           'Sitt upprätt med rak rygg och greppa handtaget.',
           'Dra handtaget mot magen och kläm ihop skulderbladen.',
           'Sträck armarna långsamt framåt igen, utan att luta dig fram.'] },
  { id: 'chest-press-machine', name: 'Bröstpress i maskin', muscles: ['chest', 'arms', 'shoulders'], equipment: 'gym',
    sets: 3, reps: '10–12', defaultReps: 10, anim: 'chestPress', props: ['machine', 'dumbbells'],
    tips: ['Ställ in sätet så att handtagen är i höjd med mitten av bröstet.',
           'Sitt med ryggen mot ryggstödet och fötterna i golvet.',
           'Pressa handtagen framåt tills armarna är nästan raka.',
           'För tillbaka långsamt tills du känner en lätt sträckning i bröstet.'] },
  { id: 'triceps-pushdown', name: 'Triceps pushdown (kabel)', muscles: ['arms'], equipment: 'gym',
    sets: 3, reps: '12–15', defaultReps: 12, anim: 'pushdown', props: [], cable: [0.66, -0.15],
    tips: ['Stå nära kabelmaskinen och greppa repet eller stången med armbågarna intill kroppen.',
           'Pressa ner tills armarna är raka.',
           'Bara underarmarna rör sig. Överarmarna är stilla.',
           'Släpp upp kontrollerat till ungefär 90 grader i armbågen.'] },
  { noAuto: true, id: 'pull-up', name: 'Chins', muscles: ['back', 'arms'], equipment: 'gym',
    sets: 3, reps: '5–10', defaultReps: 6, anim: 'pullUp', props: ['pullUpBar'],
    tips: ['Häng i stången med raka armar.',
           'Dra dig upp tills hakan är över stången.',
           'Sänk dig kontrollerat hela vägen ner.',
           'För tungt? Använd assisterad chinsmaskin eller ett gummiband.'] },
  { id: 'superman', name: 'Superman', muscles: ['back', 'core'], equipment: 'none',
    sets: 3, reps: '12', defaultReps: 12, anim: 'superman',
    tips: ['Ligg på mage med armarna sträckta framåt.',
           'Lyft armar, bröst och ben samtidigt från golvet.',
           'Håll två sekunder och titta ner i golvet.',
           'Sänk långsamt.'] },

  // Bröst
  { id: 'bench-press', name: 'Bänkpress', muscles: ['chest', 'arms', 'shoulders'], equipment: 'gym',
    sets: 4, reps: '6–10', defaultReps: 8, anim: 'benchPress', props: ['bench', 'barbell'],
    tips: ['Ligg med ögonen under stången och fötterna i golvet.',
           'Greppa lite bredare än axelbrett.',
           'Sänk stången mot nedre delen av bröstet.',
           'Pressa upp. Använd gärna en spotter vid tunga vikter.'] },
  { id: 'db-bench', name: 'Hantelpress på bänk', muscles: ['chest', 'arms'], equipment: 'gym',
    sets: 3, reps: '8–12', defaultReps: 10, anim: 'benchPress', props: ['bench', 'dumbbells'],
    tips: ['Ligg på bänken med en hantel i varje hand.',
           'Sänk hantlarna till bröstets sidor.',
           'Pressa upp och för ihop hantlarna lätt i toppen.',
           'Håll skulderbladen ihop mot bänken.'] },
  { id: 'push-up', name: 'Armhävningar', muscles: ['chest', 'arms', 'core'], equipment: 'none',
    sets: 3, reps: '8–15', defaultReps: 10, anim: 'pushUp',
    tips: ['Händerna lite bredare än axlarna.',
           'Kroppen ska vara rak som en planka från huvud till häl.',
           'Sänk bröstet mot golvet med armbågarna snett bakåt.',
           'För tungt? Gör dem på knä eller mot en bänk.'] },

  // Axlar & armar
  { id: 'shoulder-press', name: 'Axelpress med hantlar', muscles: ['shoulders', 'arms'], equipment: 'dumbbells',
    sets: 3, reps: '8–12', defaultReps: 10, anim: 'shoulderPress', props: ['dumbbells'],
    tips: ['Håll hantlarna i axelhöjd.',
           'Spänn magen så att du inte svankar.',
           'Pressa rakt upp tills armarna är nästan raka.',
           'Sänk kontrollerat.'] },
  { id: 'barbell-press', name: 'Stående axelpress med skivstång', muscles: ['shoulders', 'arms', 'core'], equipment: 'gym',
    sets: 3, reps: '6–10', defaultReps: 8, anim: 'shoulderPress', props: ['barbell'],
    tips: ['Håll stången framför axlarna med greppet lite bredare än axelbrett.',
           'Spänn magen och rumpan så att du inte svankar.',
           'Pressa stången rakt upp och för huvudet lätt bakåt när den passerar.',
           'Sänk kontrollerat till axelhöjd.'] },
  { id: 'machine-shoulder-press', name: 'Axelpress i maskin', muscles: ['shoulders', 'arms'], equipment: 'gym',
    sets: 3, reps: '10–12', defaultReps: 10, anim: 'shoulderPress', props: ['machine'],
    tips: ['Ställ in sätet så att handtagen är i axelhöjd.',
           'Sitt med ryggen mot ryggstödet.',
           'Pressa uppåt tills armarna är nästan raka.',
           'Sänk långsamt.'] },
  { id: 'barbell-curl', name: 'Bicepscurl med skivstång', muscles: ['arms'], equipment: 'gym',
    sets: 3, reps: '8–12', defaultReps: 10, anim: 'bicepCurl', props: ['barbell'],
    tips: ['Greppa stången underifrån, axelbrett.',
           'Armbågarna stilla intill kroppen.',
           'Böj armarna och lyft stången mot axlarna utan att gunga.',
           'Sänk långsamt hela vägen.'] },
  { id: 'bicep-curl', name: 'Bicepscurl', muscles: ['arms'], equipment: 'dumbbells',
    sets: 3, reps: '10–12', defaultReps: 10, anim: 'bicepCurl', props: ['dumbbells'],
    tips: ['Armbågarna stilla intill kroppen.',
           'Böj armarna och lyft hantlarna mot axlarna.',
           'Undvik att gunga med ryggen.',
           'Sänk långsamt hela vägen.'] },
  { id: 'triceps-ext', name: 'Tricepspress över huvudet', muscles: ['arms'], equipment: 'dumbbells',
    sets: 3, reps: '10–12', defaultReps: 10, anim: 'tricepsExtension', props: ['dumbbells'],
    tips: ['Håll hanteln med båda händerna ovanför huvudet.',
           'Sänk hanteln bakom huvudet genom att böja armbågarna.',
           'Överarmarna ska peka rakt upp och vara stilla.',
           'Sträck upp igen.'] },

  // Kettlebell
  { kneeHeavy: true, id: 'kb-goblet-squat', name: 'Gobletknäböj med kettlebell', muscles: ['legs', 'core'], equipment: 'kettlebell',
    sets: 3, reps: '10–12', defaultReps: 10, anim: 'gobletSquat', props: ['kettlebell'],
    tips: ['Håll kettlebellen i handtaget, med kulan nedåt mot bröstet.',
           'Stå med fötterna lite bredare än axelbrett och tårna lätt utåt.',
           'Sitt ner mellan hälarna med rak rygg och bröstet uppe.',
           'Pressa upp genom hälarna.'] },
  { id: 'kb-swing', name: 'Kettlebell swing', muscles: ['legs', 'back', 'core'], equipment: 'kettlebell',
    sets: 3, reps: '15', defaultReps: 15, anim: 'kbSwing', props: ['kettlebell'],
    tips: ['Stå lite bredare än axelbrett med kettlebellen en bit framför fötterna. Fäll fram från höften och greppa handtaget med båda händerna.',
           'Dra kettlebellen bakåt mellan benen, som en passning i amerikansk fotboll.',
           'Skjut fram höften explosivt och spänn rumpan. Armarna är raka och avslappnade, det är höften som lyfter.',
           'Kettlebellen ska nå ungefär bröst- eller axelhöjd. Låt den falla tillbaka och fäll från höften igen.'] },
  { id: 'kb-clean', name: 'Kettlebell clean', muscles: ['legs', 'back', 'shoulders'], equipment: 'kettlebell',
    sets: 3, reps: '8 per arm', defaultReps: 8, anim: 'kbClean', props: ['kettlebell'],
    tips: ['Stå med kettlebellen mellan fötterna. Fäll fram från höften med rak rygg och greppa handtaget.',
           'Res dig explosivt genom att skjuta fram höften. Kraften ska komma från benen och höften, inte från armen.',
           'Håll armbågen nära kroppen så att kettlebellen åker upp nära kroppen.',
           'Ta emot den mjukt i rackläget vid axeln, med kulan mot underarmens utsida. Sänk den kontrollerat och byt arm.'] },
  { id: 'kb-row', name: 'Kettlebellrodd', muscles: ['back', 'arms'], equipment: 'kettlebell',
    sets: 3, reps: '10–12', defaultReps: 10, anim: 'row', props: ['kettlebells'],
    tips: ['Fäll fram överkroppen med rak rygg och lätt böjda knän.',
           'Dra kettlebellen mot höften med armbågen nära kroppen.',
           'Kläm ihop skulderbladen i toppläget.',
           'Sänk långsamt. Kör en arm i taget om du bara har en kettlebell.'] },
  { id: 'kb-curl', name: 'Bicepscurl med kettlebell', muscles: ['arms'], equipment: 'kettlebell',
    sets: 3, reps: '10–12', defaultReps: 10, anim: 'bicepCurl', props: ['kettlebells'],
    tips: ['Håll kettlebellen i handtaget med kulan hängande nedåt, eller i hornen med båda händerna.',
           'Armbågarna stilla intill kroppen.',
           'Böj armen och lyft mot axeln utan att gunga.',
           'Sänk långsamt hela vägen.'] },
  { id: 'kb-triceps-ext', name: 'Tricepspress med kettlebell', muscles: ['arms'], equipment: 'kettlebell',
    sets: 3, reps: '10–12', defaultReps: 10, anim: 'tricepsExtension', props: ['kettlebell'],
    tips: ['Håll kettlebellen i hornen med båda händerna ovanför huvudet.',
           'Sänk den bakom huvudet genom att böja armbågarna.',
           'Överarmarna pekar rakt upp och är stilla.',
           'Sträck upp igen.'] },
  { id: 'kb-halo', name: 'Kettlebell halo', muscles: ['shoulders', 'core'], equipment: 'kettlebell',
    sets: 3, reps: '6 per håll', defaultReps: 6, anim: 'halo', props: ['kettlebell'],
    tips: ['Håll kettlebellen i hornen framför bröstet, med kulan uppåt.',
           'För den runt huvudet i en tät cirkel, nära huvudet och nacken.',
           'Spänn magen och rumpan så att du inte svankar.',
           'Byt håll efter halva setet. Börja med en lätt kettlebell.'] },
  { id: 'kb-pullover', name: 'Pullover med kettlebell', muscles: ['back', 'chest', 'core'], equipment: 'kettlebell',
    sets: 3, reps: '10–12', defaultReps: 10, anim: 'pullover', props: ['bench', 'kettlebell'],
    tips: ['Ligg på rygg på en bänk eller på golvet. Håll kettlebellen i hornen med raka armar ovanför bröstet.',
           'Sänk den i en båge bakåt bakom huvudet, med lätt böjda armbågar.',
           'Gå bara så långt som axlarna tillåter, utan att svanka.',
           'Dra tillbaka den över bröstet med ryggmusklerna.'] },

  // Mage & bål
  { id: 'plank', name: 'Plankan', muscles: ['core'], equipment: 'none',
    sets: 3, reps: '30–45 s', defaultReps: 30, anim: 'plank', timed: true,
    tips: ['Stöd på underarmarna med armbågarna under axlarna.',
           'Kroppen rak – varken rumpa upp eller svank.',
           'Spänn mage och rumpa.',
           'Andas lugnt under hela tiden.'] },
  { id: 'crunch', name: 'Crunches', muscles: ['core'], equipment: 'none',
    sets: 3, reps: '15–20', defaultReps: 15, anim: 'crunch',
    tips: ['Ligg på rygg med böjda knän.',
           'Händerna lätt vid huvudet – dra inte i nacken.',
           'Rulla upp axlarna från golvet med magmusklerna.',
           'Sänk långsamt.'] },
  { id: 'lying-leg-raise', name: 'Liggande benlyft', muscles: ['core'], equipment: 'none',
    sets: 3, reps: '10–15', defaultReps: 12, anim: 'lyingLegRaise',
    tips: ['Ligg på rygg med armarna längs sidorna, handflatorna mot golvet.',
           'Pressa ländryggen mot golvet och håll den där.',
           'Lyft raka ben tills de pekar mot taket.',
           'Sänk långsamt. Stanna strax innan hälarna når golvet.'] },
  { id: 'captains-chair', name: "Benlyft i captain's chair", muscles: ['core'], equipment: 'gym',
    sets: 3, reps: '8–12', defaultReps: 10, anim: 'captainsChair', props: ['captain'],
    tips: ['Ryggen mot dynan och underarmarna på armstöden. Ta tag i handtagen.',
           'Låt benen hänga rakt ner och spänn magen.',
           'Dra upp knäna mot bröstet och rulla upp bäckenet lite.',
           'Sänk långsamt utan att svinga. Starkare? Lyft raka ben.'] },

  // Rehab (föreslås av den inbyggda fysioterapeuten)
  { noAuto: true, id: 'external-rotation', name: 'Utåtrotation med gummiband', muscles: ['shoulders'], equipment: 'none',
    sets: 3, reps: '12–15', defaultReps: 12, anim: 'externalRotation',
    tips: ['Håll ett gummiband med båda händerna, armbågarna intill sidorna och böjda 90 grader.',
           'Vrid underarmarna utåt utan att armbågarna lämnar kroppen.',
           'Kläm lätt ihop skulderbladen.',
           'För tillbaka långsamt. Inget band? Gör rörelsen utan motstånd.'] },
  { noAuto: true, id: 'wall-angel', name: 'Väggänglar', muscles: ['shoulders', 'back'], equipment: 'none',
    sets: 2, reps: '10', defaultReps: 10, anim: 'wallAngel',
    tips: ['Stå med rygg, bakhuvud och rumpa mot en vägg.',
           'Lägg armarna mot väggen i ett W, armbågarna i axelhöjd.',
           'Glid uppåt till ett Y så långt det går utan att ryggen lämnar väggen.',
           'Glid ner långsamt och dra ner skulderbladen.'] },
  { noAuto: true, id: 'bird-dog', name: 'Fågelhunden', muscles: ['core', 'back'], equipment: 'none',
    sets: 3, reps: '8 per sida', defaultReps: 8, anim: 'birdDog',
    tips: ['Stå på alla fyra med händerna under axlarna och knäna under höfterna.',
           'Spänn magen lätt och håll ryggen rak som ett bord.',
           'Sträck ut ena armen och motsatt ben samtidigt. Håll 2 sekunder.',
           'Byt sida. Höften ska inte vrida sig.'] },

  // Balans
  { noAuto: true, balance: true, bothSides: true, id: 'single-leg-stand', name: 'Stå på ett ben', muscles: ['legs', 'core'], equipment: 'none',
    sets: 3, reps: '30 s per ben', defaultReps: 30, anim: 'singleLegStand', timed: true,
    tips: ['Stå nära en vägg eller stol som du kan ta tag i om du tappar balansen.',
           'Lyft ena foten från golvet och hitta en punkt framför dig att titta på.',
           'Håll höften rak och knät på stående benet lätt böjt.',
           'Byt ben halvvägs. För mer utmaning: blunda eller vrid långsamt på huvudet.'] },
  { noAuto: true, balance: true, bothSides: true, id: 'tandem-stand', name: 'Tandemstående', muscles: ['legs', 'core'], equipment: 'none',
    sets: 3, reps: '30 s', defaultReps: 30, anim: 'tandemStand', timed: true,
    tips: ['Ställ ena foten precis framför den andra, häl mot tå, som på en lina.',
           'Stå nära en vägg eller stol som stöd.',
           'Spänn magen lätt och titta rakt fram.',
           'Byt fot framför halvvägs.'] },
  { noAuto: true, balance: true, bothSides: true, id: 'single-leg-rdl', name: 'Enbensmarklyft', muscles: ['legs', 'back'], equipment: 'none',
    sets: 3, reps: '8 per ben', defaultReps: 8, anim: 'singleLegRdl',
    tips: ['Stå på ett ben med lätt böjt knä.',
           'Fäll framåt från höften medan det fria benet går rakt bakåt.',
           'Håll ryggen rak och höften i nivå. Gå bara så långt du har kontroll.',
           'Res dig långsamt. Byt ben halvvägs.'] },
  { noAuto: true, balance: true, bothSides: true, id: 'leg-swing', name: 'Benpendel på ett ben', muscles: ['legs', 'core'], equipment: 'none',
    sets: 3, reps: '30 s per ben', defaultReps: 30, anim: 'legSwing', timed: true,
    tips: ['Stå på ett ben, gärna med en hand lätt mot en vägg.',
           'Pendla det fria benet lugnt fram och tillbaka.',
           'Håll överkroppen stilla och stående benet stabilt.',
           'Byt ben halvvägs. Släpp stödet när det känns tryggt.'] },

  // Balansplatta
  { noAuto: true, balance: true, id: 'board-stand', name: 'Stå på balansplattan', muscles: ['legs', 'core'], equipment: 'board',
    sets: 3, reps: '40 s', defaultReps: 40, anim: 'boardStand', props: ['board'], timed: true,
    tips: ['Ställ plattan nära en vägg eller stol som du kan ta tag i.',
           'Kliv upp med en fot i taget och ställ fötterna höftbrett, lika långt från mitten.',
           'Försök hålla plattan plan utan att kanterna slår i golvet.',
           'Lätt böjda knän och blicken rakt fram. Blunda för mer utmaning.'] },
  { noAuto: true, balance: true, id: 'board-tilt', name: 'Tippa på balansplattan', muscles: ['legs', 'core'], equipment: 'board',
    sets: 3, reps: '40 s', defaultReps: 40, anim: 'boardTilt', props: ['board'], timed: true,
    tips: ['Stå på plattan med fötterna höftbrett.',
           'Tippa lugnt åt höger tills kanten nästan når golvet, sedan åt vänster.',
           'Rör dig från fotlederna och höften, inte genom att kasta med armarna.',
           'Byt till fram och tillbaka halvvägs om plattan går åt alla håll.'] },
  { noAuto: true, balance: true, id: 'board-squat', name: 'Knäböj på balansplattan', muscles: ['legs', 'core'], equipment: 'board',
    sets: 3, reps: '8–10', defaultReps: 8, anim: 'boardSquat', props: ['board'],
    tips: ['Stå på plattan med fötterna höftbrett och armarna framför dig.',
           'Böj knäna och skjut bak höften en liten bit. Djupa knäböj behövs inte.',
           'Håll plattan så plan du kan hela vägen.',
           'Res dig lugnt. Håll i något tills det känns stabilt.'] },
  { noAuto: true, balance: true, bothSides: true, id: 'board-single-leg', name: 'Ett ben på balansplattan', muscles: ['legs', 'core'], equipment: 'board',
    sets: 3, reps: '20–30 s per ben', defaultReps: 20, anim: 'boardSingleLeg', props: ['board'], timed: true,
    tips: ['Den svåraste varianten. Gör den när du står stadigt på två ben.',
           'Ställ en fot mitt på plattan och lyft den andra.',
           'Håll i en vägg eller stol i början.',
           'Byt ben halvvägs.'] },

  // Gymboll
  { id: 'ball-crunch', name: 'Crunches på gymboll', muscles: ['core'], equipment: 'ball',
    sets: 3, reps: '12–15', defaultReps: 12, anim: 'ballCrunch', ball: { x: 0.45, y: 0.81, r: 0.15 },
    tips: ['Ligg med ländryggen mot bollen och fötterna i golvet, höftbrett isär.',
           'Händerna lätt vid huvudet. Dra inte i nacken.',
           'Rulla upp överkroppen med magmusklerna.',
           'Sänk långsamt tillbaka över bollen.'] },
  { id: 'ball-leg-curl', name: 'Bencurl på gymboll', muscles: ['legs', 'core'], equipment: 'ball',
    sets: 3, reps: '10–12', defaultReps: 10, anim: 'ballCurl', ball: { at: 'footN', dx: 0.10, y: 0.81, r: 0.15 },
    tips: ['Ligg på rygg med hälarna på bollen och armarna i golvet.',
           'Lyft höften så att kroppen blir rak.',
           'Dra bollen mot rumpan med hälarna och håll höften uppe.',
           'Rulla ut igen långsamt. Lättare: sänk höften mellan varje.'] },
  { kneeHeavy: true, id: 'ball-wall-squat', name: 'Väggknäböj med gymboll', muscles: ['legs'], equipment: 'ball',
    sets: 3, reps: '12', defaultReps: 12, anim: 'ballWallSquat', props: ['wall'], ball: { x: 0.375, at: 'hip', dy: -0.07, r: 0.11 },
    tips: ['Ställ bollen mellan ländryggen och en vägg och fötterna en bit framför dig.',
           'Böj knäna och låt bollen rulla med längs väggen.',
           'Knäna ovanför fötterna. Gå så djupt det känns bra.',
           'Tryck dig upp genom hälarna.'] },
  { id: 'ball-plank', name: 'Planka på gymboll', muscles: ['core', 'shoulders'], equipment: 'ball',
    sets: 3, reps: '20–40 s', defaultReps: 30, anim: 'ballPlank', timed: true, ball: { x: 0.70, y: 0.81, r: 0.15 },
    tips: ['Lägg underarmarna på bollen och sträck ut benen bakåt.',
           'Kroppen rak från huvud till hälar. Spänn magen och rumpan.',
           'Håll bollen stilla och andas lugnt.',
           'Lättare: stå på knäna i stället för tårna.'] },
  { noAuto: true, balance: true, bothSides: true, id: 'ball-sit', name: 'Sitt på gymbollen med ett ben lyft', muscles: ['core', 'legs'], equipment: 'ball',
    sets: 3, reps: '30 s per ben', defaultReps: 30, anim: 'ballSit', timed: true, ball: { x: 0.45, y: 0.81, r: 0.15 },
    tips: ['Sitt rakt mitt på bollen med fötterna i golvet.',
           'Spänn magen lätt och lyft ena foten en bit från golvet.',
           'Håll ryggen rak och bollen stilla.',
           'Byt ben halvvägs. Ha fritt runt dig.'] },

  // Gummiband
  { id: 'band-row', name: 'Rodd med gummiband', muscles: ['back', 'arms'], equipment: 'band',
    sets: 3, reps: '12–15', defaultReps: 12, anim: 'bandRow', cable: [0.98, 0.34], band: true,
    tips: ['Fäst bandet i en dörr eller runt något stadigt i brösthöjd.',
           'Stå med lätt böjda knän och sträckta armar.',
           'Dra händerna mot magen och kläm ihop skulderbladen.',
           'Släpp tillbaka långsamt.'] },
  { id: 'band-press', name: 'Bröstpress med gummiband', muscles: ['chest', 'arms', 'shoulders'], equipment: 'band',
    sets: 3, reps: '12–15', defaultReps: 12, anim: 'bandPress', cable: [0.10, 0.30], band: true,
    tips: ['Fäst bandet bakom dig i brösthöjd, eller lägg det runt ryggen.',
           'Stå med ena foten framför den andra och händerna vid bröstet.',
           'Pressa rakt fram tills armarna är nästan raka.',
           'För tillbaka långsamt.'] },
  { id: 'band-curl', name: 'Bicepscurl med gummiband', muscles: ['arms'], equipment: 'band',
    sets: 3, reps: '12–15', defaultReps: 12, anim: 'bicepCurl', bandLines: [['footN', 'handN']],
    tips: ['Stå på mitten av bandet och håll i ändarna.',
           'Armbågarna intill sidorna.',
           'Böj armarna och lyft händerna mot axlarna.',
           'Sänk långsamt.'] },
  { id: 'band-pull-apart', name: 'Pull-apart med gummiband', muscles: ['shoulders', 'back'], equipment: 'band',
    sets: 3, reps: '15', defaultReps: 15, anim: 'pullApart', bandLines: [['handF', 'handN']],
    tips: ['Håll bandet med raka armar framför dig i axelhöjd.',
           'Dra isär bandet tills det nuddar bröstet.',
           'Kläm ihop skulderbladen och håll axlarna nere.',
           'Släpp tillbaka långsamt. Bra för hållningen.'] },
  { id: 'band-side-walk', name: 'Sidogång med gummiband', muscles: ['legs'], equipment: 'band',
    sets: 3, reps: '10 steg åt varje håll', defaultReps: 10, anim: 'sideWalk', bandLines: [['kneeF', 'kneeN']],
    tips: ['Lägg ett minband runt benen strax ovanför knäna.',
           'Böj lätt på knäna och skjut bak höften lite.',
           'Ta korta steg åt sidan utan att fötterna går ihop.',
           'Håll knäna utåt mot bandet. Bra för höfter och knän.'] },

  // Stretch efter passet. stretch = muskelgrupperna stretchen passar efter.
  { noAuto: true, stretch: ['chest', 'shoulders', 'arms'], bothSides: true, id: 'stretch-chest', name: 'Bröststretch mot vägg', muscles: ['chest'], equipment: 'none',
    sets: 1, reps: '30 s per sida', defaultReps: 30, anim: 'stretchChest', props: ['wall'], timed: true,
    tips: ['Ställ dig med sidan mot en vägg eller dörrkarm.',
           'Lägg handflatan mot väggen bakom dig, armen i axelhöjd.',
           'Vrid överkroppen sakta bort från väggen tills det drar i bröstet.',
           'Håll stilla och andas lugnt. Byt sida halvvägs.'] },
  { noAuto: true, stretch: ['shoulders', 'back', 'arms'], bothSides: true, id: 'stretch-shoulder', name: 'Axelstretch', muscles: ['shoulders'], equipment: 'none',
    sets: 1, reps: '30 s per sida', defaultReps: 30, anim: 'stretchShoulder', timed: true,
    tips: ['För ena armen rakt över bröstet.',
           'Dra den lätt närmare kroppen med den andra handen ovanför armbågen.',
           'Håll axlarna nere och avslappnade.',
           'Byt sida halvvägs.'] },
  { noAuto: true, stretch: ['legs'], bothSides: true, id: 'stretch-quad', name: 'Stretch framsida lår', muscles: ['legs'], equipment: 'none',
    sets: 1, reps: '30 s per ben', defaultReps: 30, anim: 'stretchQuad', timed: true,
    tips: ['Håll i något med ena handen.',
           'Ta tag i foten och dra hälen mot rumpan.',
           'Knäna nära varandra och höften lätt framskjuten.',
           'Byt ben halvvägs. Gör det ont i knät: ta ett handduksband runt foten.'] },
  { noAuto: true, stretch: ['legs', 'cardio'], bothSides: true, id: 'stretch-calf', name: 'Vadstretch mot vägg', muscles: ['legs'], equipment: 'none',
    sets: 1, reps: '30 s per ben', defaultReps: 30, anim: 'stretchCalf', props: ['wallR'], timed: true,
    tips: ['Stå med händerna mot en vägg och ena benet bakåt.',
           'Håll bakre benet rakt och hälen i golvet.',
           'Luta dig mot väggen tills det drar i vaden.',
           'Byt ben halvvägs.'] },
  { noAuto: true, stretch: ['legs', 'back', 'cardio'], bothSides: true, id: 'stretch-hamstring', name: 'Stretch baksida lår', muscles: ['legs'], equipment: 'none',
    sets: 1, reps: '30 s per ben', defaultReps: 30, anim: 'stretchHam', timed: true,
    tips: ['Sätt ena hälen en bit framför dig med rakt ben och tån uppåt.',
           'Böj det bakre knät och fäll framåt från höften med rak rygg.',
           'Händerna vilar på låret, inte på knät.',
           'Byt ben halvvägs.'] },
  { noAuto: true, stretch: ['legs', 'core'], bothSides: true, id: 'stretch-hip-flexor', name: 'Höftböjarstretch', muscles: ['legs'], equipment: 'none',
    sets: 1, reps: '30 s per sida', defaultReps: 30, anim: 'stretchHipFlex', timed: true,
    tips: ['Ställ dig på ena knät med andra foten framför dig, gärna på en matta.',
           'Spänn rumpan och skjut höften lätt framåt.',
           'Håll överkroppen upprätt. Det ska dra på framsidan av höften.',
           'Byt sida halvvägs.'] },
  { noAuto: true, stretch: ['back', 'core', 'shoulders'], id: 'stretch-child', name: 'Barnets position', muscles: ['back'], equipment: 'none',
    sets: 1, reps: '30–45 s', defaultReps: 40, anim: 'stretchChild', timed: true,
    tips: ['Stå på knä och sätt dig bakåt mot hälarna.',
           'Fäll fram överkroppen och sträck armarna framåt i golvet.',
           'Låt pannan vila mot golvet eller händerna.',
           'Andas djupt ner i ryggen.'] },

  // Kondition
  { kneeHeavy: true, id: 'jumping-jack', name: 'Jumping jacks', muscles: ['cardio'], equipment: 'none',
    sets: 3, reps: '45 s', defaultReps: 45, anim: 'jumpingJack', timed: true, warmup: true,
    tips: ['Hoppa ut med benen samtidigt som armarna går upp.',
           'Hoppa ihop och för ner armarna.',
           'Landa mjukt på framfoten.',
           'Bra uppvärmning!'] },
  { id: 'mountain-climber', name: 'Mountain climbers', muscles: ['cardio', 'core'], equipment: 'none',
    sets: 3, reps: '30 s', defaultReps: 30, anim: 'mountainClimber', timed: true,
    tips: ['Starta i armhävningsposition.',
           'Dra växelvis knäna mot bröstet i högt tempo.',
           'Håll höften låg och stilla.',
           'Händerna rakt under axlarna.'] },
  { id: 'march', name: 'Marsch på stället', muscles: ['cardio'], equipment: 'none',
    sets: 3, reps: '60 s', defaultReps: 60, anim: 'march', timed: true, warmup: true,
    tips: ['Marschera på stället och lyft knäna i lagom höjd.',
           'Pendla med armarna.',
           'Sätt ner fötterna mjukt, utan hopp.',
           'Öka tempot efter hand om det känns bra.'] },
  { id: 'shadow-box', name: 'Skuggboxning', muscles: ['cardio', 'shoulders'], equipment: 'none',
    sets: 3, reps: '45 s', defaultReps: 45, anim: 'shadowBox', timed: true, warmup: true,
    tips: ['Stå med ena foten lite framför den andra och händerna uppe vid hakan.',
           'Slå raka slag växelvis med höger och vänster.',
           'Vrid lätt i höften och spänn magen i varje slag.',
           'Håll fötterna i golvet, utan hopp. Skonsamt för knäna men får upp pulsen.'] },
  { id: 'battle-ropes', name: 'Battle ropes', muscles: ['cardio', 'shoulders'], equipment: 'gym',
    sets: 3, reps: '30 s', defaultReps: 30, anim: 'battleRopes', props: ['rope'], timed: true,
    tips: ['Håll i ett rep i varje hand och stå med lätt böjda knän.',
           'Slå växelvis upp och ner med armarna så att det blir vågor i repen.',
           'Håll ryggen rak och magen spänd.',
           'Pulsen går upp snabbt utan stötar mot knäna.'] },
  { id: 'rowing-machine', name: 'Roddmaskin', muscles: ['cardio', 'back'], equipment: 'gym',
    sets: 1, reps: '5–10 min', defaultReps: 300, anim: 'seatedRow', props: ['rowseat'], timed: true, distance: true, warmup: true,
    tips: ['Spänn fast fötterna och börja med benen: tryck ifrån, luta dig sedan lätt bakåt och dra handtaget mot magen.',
           'På vägen tillbaka: armarna fram först, sedan överkroppen, sist böjer du knäna.',
           'Håll ryggen rak och axlarna avslappnade.',
           'Bra uppvärmning: 5 minuter i lugnt tempo.'] },
  { id: 'bike', name: 'Motionscykel', muscles: ['cardio', 'legs'], equipment: 'gym',
    sets: 1, reps: '10 min', defaultReps: 600, anim: 'bike', props: ['bike'], timed: true, warmup: true,
    tips: ['Ställ in sadeln så att knät är nästan rakt när pedalen är längst ner.',
           'Börja med lätt motstånd.',
           'Trampa i jämnt tempo.',
           'Cykling är ett av de skonsammaste sätten att träna kondition för knäna.'] },
];

const GEAR_OF = {
  'goblet-squat': 'dumbbells', 'db-lunge': 'dumbbells', rdl: 'dumbbells', 'db-row': 'dumbbells', 'db-bench': 'dumbbells',
  'shoulder-press': 'dumbbells', 'bicep-curl': 'dumbbells', 'triceps-ext': 'dumbbells',
  'barbell-squat': 'barbell', 'hip-thrust': 'barbell', deadlift: 'barbell', 'barbell-row': 'barbell',
  'bench-press': 'barbell', 'barbell-press': 'barbell', 'barbell-curl': 'barbell',
  'leg-press': 'machine', 'leg-extension': 'machine', 'leg-curl': 'machine', 'single-leg-extension': 'machine',
  'single-leg-curl': 'machine', 'single-leg-press': 'machine', 'lat-pulldown': 'machine', 'seated-row': 'machine',
  'chest-press-machine': 'machine', 'triceps-pushdown': 'machine', 'machine-shoulder-press': 'machine',
  'battle-ropes': 'machine', bike: 'machine', 'rowing-machine': 'machine', 'captains-chair': 'machine',
  'kb-goblet-squat': 'kettlebell', 'kb-swing': 'kettlebell', 'kb-clean': 'kettlebell', 'kb-row': 'kettlebell', 'kb-curl': 'kettlebell',
  'kb-triceps-ext': 'kettlebell', 'kb-halo': 'kettlebell', 'kb-pullover': 'kettlebell',
  'board-stand': 'board', 'board-tilt': 'board', 'board-squat': 'board', 'board-single-leg': 'board',
  'ball-crunch': 'ball', 'ball-leg-curl': 'ball', 'ball-wall-squat': 'ball', 'ball-plank': 'ball', 'ball-sit': 'ball',
  'band-row': 'band', 'band-press': 'band', 'band-curl': 'band', 'band-pull-apart': 'band', 'band-side-walk': 'band',
};

// Belastning på kroppsdelar som kan göra ont: 1 = viss, 2 = hög.
const LOAD = {
  squat: { knees: 2 }, 'goblet-squat': { knees: 2, back: 1 }, 'barbell-squat': { knees: 2, back: 2, shoulders: 1 },
  'leg-press': { knees: 2, back: 1 }, lunge: { knees: 2 }, 'db-lunge': { knees: 2, back: 1 },
  'leg-extension': { knees: 1 }, 'leg-curl': { knees: 1 }, 'hip-thrust': { back: 1 },
  rdl: { back: 2 }, deadlift: { knees: 2, back: 2 }, 'barbell-row': { back: 2 }, 'db-row': { back: 1 },
  'seated-row': { back: 1 }, 'lat-pulldown': { shoulders: 1 }, 'pull-up': { shoulders: 2 }, superman: { back: 1, shoulders: 1 },
  'bench-press': { shoulders: 2 }, 'db-bench': { shoulders: 1 }, 'chest-press-machine': { shoulders: 1 }, 'push-up': { shoulders: 1 },
  'shoulder-press': { shoulders: 2, back: 1 }, 'barbell-press': { shoulders: 2, back: 1 }, 'machine-shoulder-press': { shoulders: 2 },
  'triceps-ext': { shoulders: 2, back: 1 }, crunch: { back: 1 }, 'lying-leg-raise': { back: 1 }, 'captains-chair': { back: 1, shoulders: 1 }, plank: { back: 1, shoulders: 1 },
  'jumping-jack': { knees: 2, shoulders: 1 }, 'mountain-climber': { knees: 1, shoulders: 1, back: 1 },
  'kb-goblet-squat': { knees: 2, back: 1 }, 'kb-clean': { back: 2, shoulders: 1, knees: 1 }, 'kb-swing': { back: 2 }, 'kb-row': { back: 1 },
  'kb-triceps-ext': { shoulders: 2, back: 1 }, 'kb-halo': { shoulders: 2 }, 'kb-pullover': { shoulders: 2, back: 1 },
  'shadow-box': { shoulders: 1 }, 'rowing-machine': { back: 1, knees: 1 }, 'battle-ropes': { shoulders: 1, back: 1 }, 'wall-angel': { shoulders: 1 },
  'single-leg-rdl': { back: 1 }, 'board-squat': { knees: 1 },
  'ball-wall-squat': { knees: 1 }, 'ball-crunch': { back: 1 }, 'ball-plank': { back: 1, shoulders: 1 }, 'band-press': { shoulders: 1 },
};

// Andra namn som sökningen ska hitta.
const ALIASES = {
  'db-bench': ['liggande hantelpress', 'hantelpress liggande', 'bröstpress med hantlar'],
  'bench-press': ['liggande skivstångspress'],
  'seated-row': ['kabelrodd', 'rodd'],
  'rowing-machine': ['rodd', 'concept2', 'uppvärmning'],
  'db-row': ['rodd med hantel', 'enarmsrodd'],
  'barbell-row': ['rodd'],
  'triceps-pushdown': ['pushdown', 'triceps kabel'],
  'leg-extension': ['benspark', 'quadriceps'],
  'leg-curl': ['bencurl', 'hamstrings', 'lårcurl'],
  'lat-pulldown': ['latsdrag', 'pulldown'],
  'chest-press-machine': ['bröstpress'],
  'bike': ['cykel', 'uppvärmning'],
  'push-up': ['armhävning'],
  'pull-up': ['pull-ups', 'chins'],
  'plank': ['planka'],
  'kb-goblet-squat': ['kettlebell', 'knäböj', 'kb squat'],
  'kb-swing': ['kettlebell', 'swing', 'swings', 'kb swing', 'sving'],
  'kb-clean': ['kettlebell', 'kb clean', 'frivändning', 'vändning'],
  'kb-row': ['kettlebell', 'rodd', 'kb row'],
  'kb-curl': ['kettlebell', 'curl', 'kb curl'],
  'kb-triceps-ext': ['kettlebell', 'triceps', 'extension', 'kb extension'],
  'kb-halo': ['kettlebell', 'halo'],
  'kb-pullover': ['kettlebell', 'pullover', 'pullovers'],
  'lying-leg-raise': ['benlyft', 'leg raise', 'bensänkning'],
  'board-stand': ['balansplatta', 'balansbräda', 'wobble board', 'balance board', 'bosu'],
  'board-tilt': ['balansplatta', 'balansbräda', 'wobble board', 'balance board', 'bosu'],
  'board-squat': ['balansplatta', 'balansbräda', 'knäböj', 'bosu'],
  'board-single-leg': ['balansplatta', 'balansbräda', 'ett ben', 'bosu'],
  'ball-crunch': ['gymboll', 'pilatesboll', 'crunch'], 'ball-leg-curl': ['gymboll', 'bencurl', 'hamstrings'],
  'ball-wall-squat': ['gymboll', 'knäböj', 'väggknäböj'], 'ball-plank': ['gymboll', 'planka'], 'ball-sit': ['gymboll', 'balans'],
  'band-row': ['gummiband', 'rodd', 'band'], 'band-press': ['gummiband', 'bröstpress', 'band'], 'band-curl': ['gummiband', 'curl', 'band'],
  'band-pull-apart': ['gummiband', 'pull apart', 'band'], 'band-side-walk': ['gummiband', 'miniband', 'monster walk', 'sidosteg', 'band'],
  'captains-chair': ['captains chair', 'benlyft', 'knälyft', 'hängande knälyft', 'vertical knee raise', 'dipsställning'],
};
// Övningar som görs ett ben i taget: varje set får H eller V.
const UNILATERAL = new Set(['single-leg-extension', 'single-leg-curl', 'single-leg-press', 'single-leg-mini-squat']);

for (const e of EXERCISES) {
  e.aliases = ALIASES[e.id] ?? [];
  if (UNILATERAL.has(e.id)) e.unilateral = true;
  e.safety = SAFETY[e.id] ?? [];
  e.gear = GEAR_OF[e.id] ?? 'body';
  e.load = { ...(LOAD[e.id] || {}) };
  if (e.kneeHeavy) e.load.knees = 2;
}

/** Sökning på namn och andra namn. */
export function matchesQuery(ex, q) {
  const t = q.trim().toLowerCase();
  return !t || ex.name.toLowerCase().includes(t) || (ex.aliases || []).some((a) => a.includes(t));
}

/** Egna övningar som du skapat själv. Läggs till i biblioteket när appen startar. */
export function addCustomExercise(def) {
  if (BY_ID[def.id]) return BY_ID[def.id];
  const ex = {
    sets: 3, reps: def.timed ? '30 s' : '10', defaultReps: def.timed ? 30 : 10, anim: 'idle', tips: [], noAuto: true,
    ...def, custom: true, safety: [], load: {}, aliases: [],
    equipment: def.gear === 'body' ? 'none' : ['dumbbells', 'kettlebell', 'board', 'ball', 'band'].includes(def.gear) ? def.gear : 'gym',
  };
  EXERCISES.push(ex);
  BY_ID[ex.id] = ex;
  return ex;
}

/**
 * pain: { knees, back, shoulders } med 0 = inget, 1 = lite ont, 2 = ont.
 * Lite ont: hoppa över hög belastning. Ont: hoppa över all belastning på den kroppsdelen.
 * Fysioövningar från din fysioterapeut tas aldrig bort.
 */
export function painOk(exercise, pain = {}) {
  if (exercise.physio) return true;
  return Object.entries(exercise.load).every(([area, l]) => {
    const level = pain[area] || 0;
    return level === 0 || (level === 1 ? l < 2 : l < 1);
  });
}

export const BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

/** opts: { hasDumbbells, hasKettlebell, hasBoard, hasBall, hasBand, kneeFriendly, pain, gear } – gear: vald utrustning (utelämnad = all). */
export function isAvailable(exercise, place, { hasDumbbells = false, hasKettlebell = false, hasBoard = false, hasBall = false, hasBand = false, kneeFriendly = false, pain, gear } = {}) {
  if (pain ? !painOk(exercise, pain) : kneeFriendly && exercise.kneeHeavy) return false;
  if (gear && !gear.includes(exercise.gear)) return false;
  if (place === 'gym') return true;
  return exercise.equipment === 'none' || (exercise.equipment === 'dumbbells' && hasDumbbells)
    || (exercise.equipment === 'kettlebell' && (hasKettlebell || !!gear?.includes('kettlebell')))
    || (exercise.equipment === 'board' && (hasBoard || !!gear?.includes('board')))
    || (exercise.equipment === 'ball' && (hasBall || !!gear?.includes('ball')))
    || (exercise.equipment === 'band' && (hasBand || !!gear?.includes('band')));
}
