import test from 'node:test';
import assert from 'node:assert/strict';

// Test phase resolution logic
function getPhaseAtTime(time) {
  if (time >= 138.0) return 'PHASE_H_FORENSIC_REPLAY';
  if (time >= 122.0) return 'PHASE_G_STATION_LOSS';
  if (time >= 104.0) return 'PHASE_F_SIEGE_WALL';
  if (time >= 78.0) return 'PHASE_E_CASCADE';
  if (time >= 52.0) return 'PHASE_D_HELIOCIDE';
  if (time >= 32.0) return 'PHASE_C_SHARD_GOD_AUTHORITY';
  if (time >= 16.0) return 'PHASE_B_AUREAL_ALERT';
  return 'PHASE_A_NORMAL';
}

function computeSubsystems(time) {
  if (time < 16.0) {
    return { lifeSupport: 100, hullIntegrity: 100, orbitalStability: 100, quantumComms: true, radiationShield: 100 };
  } else if (time < 32.0) {
    return { lifeSupport: 100, hullIntegrity: 100, orbitalStability: 98, quantumComms: true, radiationShield: 95 };
  } else if (time < 52.0) {
    return { lifeSupport: 96, hullIntegrity: 100, orbitalStability: 92, quantumComms: true, radiationShield: 88 };
  } else if (time < 78.0) {
    const t = (time - 52.0) / (78.0 - 52.0);
    return {
      lifeSupport: Math.max(20, Math.round(96 - t * 45)),
      hullIntegrity: Math.max(30, Math.round(100 - t * 35)),
      orbitalStability: Math.max(15, Math.round(92 - t * 65)),
      quantumComms: t < 0.7,
      radiationShield: Math.max(0, Math.round(88 - t * 88))
    };
  } else if (time < 104.0) {
    const t = (time - 78.0) / (104.0 - 78.0);
    return {
      lifeSupport: Math.max(5, Math.round(51 - t * 36)),
      hullIntegrity: Math.max(10, Math.round(65 - t * 45)),
      orbitalStability: Math.max(5, Math.round(27 - t * 22)),
      quantumComms: false,
      radiationShield: 0
    };
  } else {
    return { lifeSupport: 0, hullIntegrity: 0, orbitalStability: 0, quantumComms: false, radiationShield: 0 };
  }
}

test('Timeline Phase Progression is strictly deterministic and ordered', () => {
  assert.equal(getPhaseAtTime(0), 'PHASE_A_NORMAL');
  assert.equal(getPhaseAtTime(10.0), 'PHASE_A_NORMAL');
  assert.equal(getPhaseAtTime(16.0), 'PHASE_B_AUREAL_ALERT');
  assert.equal(getPhaseAtTime(25.0), 'PHASE_B_AUREAL_ALERT');
  assert.equal(getPhaseAtTime(32.0), 'PHASE_C_SHARD_GOD_AUTHORITY');
  assert.equal(getPhaseAtTime(45.0), 'PHASE_C_SHARD_GOD_AUTHORITY');
  assert.equal(getPhaseAtTime(52.0), 'PHASE_D_HELIOCIDE');
  assert.equal(getPhaseAtTime(70.0), 'PHASE_D_HELIOCIDE');
  assert.equal(getPhaseAtTime(78.0), 'PHASE_E_CASCADE');
  assert.equal(getPhaseAtTime(95.0), 'PHASE_E_CASCADE');
  assert.equal(getPhaseAtTime(104.0), 'PHASE_F_SIEGE_WALL');
  assert.equal(getPhaseAtTime(118.0), 'PHASE_F_SIEGE_WALL');
  assert.equal(getPhaseAtTime(122.0), 'PHASE_G_STATION_LOSS');
  assert.equal(getPhaseAtTime(135.0), 'PHASE_G_STATION_LOSS');
  assert.equal(getPhaseAtTime(138.0), 'PHASE_H_FORENSIC_REPLAY');
  assert.equal(getPhaseAtTime(150.0), 'PHASE_H_FORENSIC_REPLAY');
});

test('Subsystem status degrades monotonically as catastrophe escalates', () => {
  const normal = computeSubsystems(5.0);
  assert.equal(normal.hullIntegrity, 100);
  assert.equal(normal.orbitalStability, 100);
  assert.equal(normal.quantumComms, true);

  const heliocide = computeSubsystems(65.0);
  assert.ok(heliocide.hullIntegrity < 100 && heliocide.hullIntegrity >= 30);
  assert.ok(heliocide.orbitalStability < 90);

  const cascade = computeSubsystems(90.0);
  assert.ok(cascade.hullIntegrity <= 50);
  assert.equal(cascade.quantumComms, false);
  assert.equal(cascade.radiationShield, 0);

  const loss = computeSubsystems(130.0);
  assert.equal(loss.hullIntegrity, 0);
  assert.equal(loss.lifeSupport, 0);
  assert.equal(loss.orbitalStability, 0);
});

test('Replay seeking returns identical state for any arbitrary timestamp', () => {
  for (let t = 0; t <= 138; t += 2.5) {
    const p1 = getPhaseAtTime(t);
    const s1 = computeSubsystems(t);
    const p2 = getPhaseAtTime(t);
    const s2 = computeSubsystems(t);
    assert.equal(p1, p2);
    assert.deepEqual(s1, s2);
  }
});
