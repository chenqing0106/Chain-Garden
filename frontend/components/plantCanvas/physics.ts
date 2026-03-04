import { BioState } from "../../types";
import { PhysicsRefs } from "./types";

export function updatePhysics(
  refs: PhysicsRefs,
  audio: { bass: number; mid: number; treble: number },
  growthSpeed: number,
  onBioUpdate?: (state: BioState) => void,
): void {
  const { bass, mid, treble } = audio;
  const vol = (bass + mid + treble) / 3;

  // ========== 1. 频段分区生长 ==========
  const gSpeed = growthSpeed * 0.6;

  if (bass > 20) {
    const bassGrowthRate = (bass / 255) * gSpeed * 1.2;
    refs.bassGrowthRef.current = Math.min(100, refs.bassGrowthRef.current + bassGrowthRate);
  }

  if (mid > 20) {
    const midGrowthRate = (mid / 255) * gSpeed * 1.0;
    refs.midGrowthRef.current = Math.min(100, refs.midGrowthRef.current + midGrowthRate);
  }

  if (treble > 20) {
    const trebleGrowthRate = (treble / 255) * gSpeed * 0.8;
    refs.trebleGrowthRef.current = Math.min(100, refs.trebleGrowthRef.current + trebleGrowthRate);
  }

  refs.growthRef.current =
    refs.bassGrowthRef.current * 0.4 +
    refs.midGrowthRef.current * 0.35 +
    refs.trebleGrowthRef.current * 0.25;

  // ========== 2. 实时脉冲效果 ==========
  const bassDelta = bass - refs.lastBassRef.current;
  const midDelta = mid - refs.lastMidRef.current;
  const trebleDelta = treble - refs.lastTrebleRef.current;

  if (bassDelta > 30) {
    refs.bassPulseRef.current = Math.min(1.0, bassDelta / 80);
  } else {
    refs.bassPulseRef.current = Math.max(0, refs.bassPulseRef.current - 0.08);
  }

  if (midDelta > 25) {
    refs.midPulseRef.current = Math.min(1.0, midDelta / 70);
  } else {
    refs.midPulseRef.current = Math.max(0, refs.midPulseRef.current - 0.08);
  }

  if (trebleDelta > 20) {
    refs.treblePulseRef.current = Math.min(1.0, trebleDelta / 60);
  } else {
    refs.treblePulseRef.current = Math.max(0, refs.treblePulseRef.current - 0.1);
  }

  refs.lastBassRef.current = bass;
  refs.lastMidRef.current = mid;
  refs.lastTrebleRef.current = treble;

  // ========== 3. 原有的压力/能量逻辑 ==========
  if (vol > 150) {
    refs.stressRef.current = Math.min(1.0, refs.stressRef.current + 0.04);
  } else {
    refs.stressRef.current = Math.max(0.0, refs.stressRef.current - 0.02);
  }

  const delta = Math.abs(vol - refs.lastVolRef.current);
  refs.energyRef.current = Math.min(1.0, delta / 30);
  refs.lastVolRef.current = vol;

  // 风效果受中频影响
  refs.windRef.current += 0.02 + mid / 800;

  if (onBioUpdate)
    onBioUpdate({ stress: refs.stressRef.current, energy: refs.energyRef.current });
}
