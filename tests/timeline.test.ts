import { test, expect } from 'vitest';
import { getPhaseAtTime, computeSubsystems, useTimelineStore, TOTAL_EXPERIENCE_DURATION } from '../src/store/timelineStore';

test('Timeline Phase Progression is strictly deterministic and ordered', () => {
  expect(getPhaseAtTime(0)).toBe('PHASE_A_NORMAL');
  expect(getPhaseAtTime(10.0)).toBe('PHASE_A_NORMAL');
  expect(getPhaseAtTime(16.0)).toBe('PHASE_B_AUREAL_ALERT');
  expect(getPhaseAtTime(25.0)).toBe('PHASE_B_AUREAL_ALERT');
  expect(getPhaseAtTime(32.0)).toBe('PHASE_C_SHARD_GOD_AUTHORITY');
  expect(getPhaseAtTime(45.0)).toBe('PHASE_C_SHARD_GOD_AUTHORITY');
  expect(getPhaseAtTime(52.0)).toBe('PHASE_D_HELIOCIDE');
  expect(getPhaseAtTime(70.0)).toBe('PHASE_D_HELIOCIDE');
  expect(getPhaseAtTime(78.0)).toBe('PHASE_E_CASCADE');
  expect(getPhaseAtTime(95.0)).toBe('PHASE_E_CASCADE');
  expect(getPhaseAtTime(104.0)).toBe('PHASE_F_SIEGE_WALL');
  expect(getPhaseAtTime(118.0)).toBe('PHASE_F_SIEGE_WALL');
  expect(getPhaseAtTime(122.0)).toBe('PHASE_G_STATION_LOSS');
  expect(getPhaseAtTime(135.0)).toBe('PHASE_G_STATION_LOSS');
  expect(getPhaseAtTime(138.0)).toBe('PHASE_H_FORENSIC_REPLAY');
  expect(getPhaseAtTime(150.0)).toBe('PHASE_H_FORENSIC_REPLAY');
});

test('Subsystem status degrades monotonically as catastrophe escalates', () => {
  const normal = computeSubsystems(5.0);
  expect(normal.hullIntegrity).toBe(100);
  expect(normal.orbitalStability).toBe(100);
  expect(normal.quantumComms).toBe(true);

  const heliocide = computeSubsystems(65.0);
  expect(heliocide.hullIntegrity).toBeLessThan(100);
  expect(heliocide.hullIntegrity).toBeGreaterThanOrEqual(30);
  expect(heliocide.orbitalStability).toBeLessThan(90);

  const cascade = computeSubsystems(90.0);
  expect(cascade.hullIntegrity).toBeLessThanOrEqual(50);
  expect(cascade.quantumComms).toBe(false);
  expect(cascade.radiationShield).toBe(0);

  const loss = computeSubsystems(130.0);
  expect(loss.hullIntegrity).toBe(0);
  expect(loss.lifeSupport).toBe(0);
  expect(loss.orbitalStability).toBe(0);
});

test('Replay seeking returns identical state for any arbitrary timestamp', () => {
  for (let t = 0; t <= 138; t += 2.5) {
    const p1 = getPhaseAtTime(t);
    const s1 = computeSubsystems(t);
    const p2 = getPhaseAtTime(t);
    const s2 = computeSubsystems(t);
    expect(p1).toBe(p2);
    expect(s1).toEqual(s2);
  }
});

test('seek and playback normalizations', () => {
  const store = useTimelineStore.getState();
  store.seek(NaN); // Should not modify state if NaN
  
  store.seek(50);
  expect(useTimelineStore.getState().currentTime).toBe(50);
  
  store.seek(-100);
  expect(useTimelineStore.getState().currentTime).toBe(0);
  
  store.seek(50);
  store.seek(Infinity);
  expect(useTimelineStore.getState().currentTime).toBe(50);
  
  store.setPlaybackRate(NaN);
  // Original is 1.0, should stay 1.0 or whatever it was if NaN is ignored
  expect(useTimelineStore.getState().playbackRate).toBeGreaterThan(0);
  
  store.setPlaybackRate(-5);
  // Should ignore negative
  expect(useTimelineStore.getState().playbackRate).toBeGreaterThan(0);
});
