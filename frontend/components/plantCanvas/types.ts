import { MutableRefObject } from "react";

export interface DrawState {
  mouse: { x: number; y: number; active: boolean };
  growth: number;
  time: number;
  wind: number;
  stress: number;
  energy: number;
  bass: { growth: number; pulse: number };
  mid: { growth: number; pulse: number };
  treble: { growth: number; pulse: number };
  descriptionWords: string[];
  speciesName: string;
}

export interface PhysicsRefs {
  growthRef: MutableRefObject<number>;
  windRef: MutableRefObject<number>;
  stressRef: MutableRefObject<number>;
  energyRef: MutableRefObject<number>;
  lastVolRef: MutableRefObject<number>;
  bassGrowthRef: MutableRefObject<number>;
  midGrowthRef: MutableRefObject<number>;
  trebleGrowthRef: MutableRefObject<number>;
  bassPulseRef: MutableRefObject<number>;
  midPulseRef: MutableRefObject<number>;
  treblePulseRef: MutableRefObject<number>;
  lastBassRef: MutableRefObject<number>;
  lastMidRef: MutableRefObject<number>;
  lastTrebleRef: MutableRefObject<number>;
}
