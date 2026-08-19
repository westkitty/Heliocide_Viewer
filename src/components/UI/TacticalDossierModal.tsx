import { useTimelineStore } from '../../store/timelineStore';
import { TacticalTab } from '../../types';
import { soundSystem } from '../../audio/SoundSystem';
import { X, ShieldAlert, Radio, Globe, Terminal } from 'lucide-react';

function TimeDisplay() {
  const time = useTimelineStore((s) => s.currentTime);
  return <>{time.toFixed(1)}</>;
}

function HalVenStateDisplay() {
  const time = useTimelineStore((s) => s.currentTime);
  const color = time > 52.0 ? '#ef4444' : '#10b981';
  const text = time > 78.0 ? 'STATE: COLLAPSED SINGULARITY' : time > 52.0 ? 'STATE: GRAVITATIONAL IMPLOSION' : 'STATE: STABLE FUSION';
  return <div style={{ fontSize: '0.8rem', color, marginTop: '4px' }}>{text}</div>;
}

export function TacticalDossierModal() {
  const tacticalModalOpen = useTimelineStore((s) => s.tacticalModalOpen);
  const tacticalTab = useTimelineStore((s) => s.tacticalTab);
  const setTacticalModalOpen = useTimelineStore((s) => s.setTacticalModalOpen);
    const currentPhase = useTimelineStore((s) => s.currentPhase);

  if (!tacticalModalOpen) return null;

  const handleTabChange = (tab: TacticalTab) => {
    soundSystem.playUIClick();
    setTacticalModalOpen(true, tab);
  };

  const handleClose = () => {
    soundSystem.playUIClick();
    setTacticalModalOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tactical-modal-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1000px',
          height: '85vh',
          backgroundColor: '#0b1120',
          border: '1px solid #1e293b',
          boxShadow: '0 0 50px rgba(0, 229, 255, 0.15)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f1f5f9'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, #0f172a 0%, #1e1b4b 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={22} color="#00e5ff" />
            <div>
              <h2 id="tactical-modal-title" style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                ADMINISTRATION TACTICAL TELEMETRY // STATION HV-88
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                HAL'VEN CLUSTER OBSERVATION SECTOR — TIME INDEX: <TimeDisplay />
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              color: '#94a3b8',
              borderRadius: '4px',
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <X size={16} /> Close [ESC]
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #1e293b',
            backgroundColor: '#0f172a'
          }}
        >
          <button
            onClick={() => handleTabChange('OVERVIEW')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: tacticalTab === 'OVERVIEW' ? '#1e293b' : 'transparent',
              color: tacticalTab === 'OVERVIEW' ? '#38bdf8' : '#94a3b8',
              borderBottom: tacticalTab === 'OVERVIEW' ? '2px solid #38bdf8' : 'none',
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Globe size={16} /> Sector Overview
          </button>
          <button
            onClick={() => handleTabChange('SHARD_GOD_DOSSIER')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: tacticalTab === 'SHARD_GOD_DOSSIER' ? '#1e293b' : 'transparent',
              color: tacticalTab === 'SHARD_GOD_DOSSIER' ? '#00e5ff' : '#94a3b8',
              borderBottom: tacticalTab === 'SHARD_GOD_DOSSIER' ? '2px solid #00e5ff' : 'none',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <ShieldAlert size={16} /> SHARD GOD DOSSIER
          </button>
          <button
            onClick={() => handleTabChange('CLUSTER_MAP')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: tacticalTab === 'CLUSTER_MAP' ? '#1e293b' : 'transparent',
              color: tacticalTab === 'CLUSTER_MAP' ? '#38bdf8' : '#94a3b8',
              borderBottom: tacticalTab === 'CLUSTER_MAP' ? '2px solid #38bdf8' : 'none',
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Radio size={16} /> Containment Schematic
          </button>
          <button
            onClick={() => handleTabChange('TACTICAL_LOGS')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: tacticalTab === 'TACTICAL_LOGS' ? '#1e293b' : 'transparent',
              color: tacticalTab === 'TACTICAL_LOGS' ? '#38bdf8' : '#94a3b8',
              borderBottom: tacticalTab === 'TACTICAL_LOGS' ? '2px solid #38bdf8' : 'none',
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Terminal size={16} /> Dispatch Logs
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {tacticalTab === 'SHARD_GOD_DOSSIER' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Primary Reference Image Display */}
              <div
                style={{
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  backgroundColor: '#030712',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <div style={{ padding: '8px 12px', width: '100%', background: '#0f172a', fontSize: '0.75rem', color: '#00e5ff', borderBottom: '1px solid #1e293b' }}>
                  ADMINISTRATION BIOMETRIC / SPECTRAL IDENTIFICATION SHEET // REF: 1761893423477
                </div>
                <img
                  src="/assets/shard-god/shard_god_primary_ref.png"
                  alt="Shard God Official Reference Dossier Sheet"
                  style={{ width: '100%', height: 'auto', maxHeight: '420px', objectFit: 'contain' }}
                />
                <div style={{ padding: '8px 12px', width: '100%', fontSize: '0.75rem', color: '#94a3b8', background: '#0a0f1d' }}>
                  SOURCE RECORD: Primary Physical Authority Profile (StarSilk Continuity)
                </div>
              </div>

              {/* Tactical Readout */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '6px', borderLeft: '4px solid #00e5ff' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '6px', textTransform: 'uppercase' }}>
                    AUTHORITY ENTITY: SHARD GOD
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                    <strong>Classification:</strong> Cosmological Sovereign / Divine Physicality<br />
                    <strong>Anatomy:</strong> Matte near-black musculature, dense cyan crystalline dorsal crest, heavy tail, luminous cyan vascular channels, glowing optics.<br />
                    <strong>Status:</strong> Active Strike Execution (Hal'Ven Sector)
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '6px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#e2e8f0', marginBottom: '8px' }}>
                    TACTICAL ASSESSMENT & CAUSALITY
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.6', marginBottom: '10px' }}>
                    At Year 170 during the final collapse at the Aureal Gate, the Drakken Empire weaponized programmable Starsilk. This provided the first empirical proof that the Shard God can be harmed.
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.6' }}>
                    The Shard God's response was instant and surgical: a disproportionate heliocide strike across the Hal'Ven Cluster, collapsing stellar cores into nascent singularities to establish the <strong>Siege Wall</strong> around Drakken territory.
                  </p>
                </div>

                <div style={{ padding: '12px 16px', backgroundColor: '#1e1b4b', borderRadius: '6px', border: '1px solid #4338ca' }}>
                  <span style={{ fontSize: '0.8rem', color: '#c7d2fe' }}>
                    ⚠ <strong>ADMINISTRATION NOTE:</strong> The entity acts without rage or panic. Containment is mathematical and absolute. Hal'Ven IV and Station HV-88 are inside the singularity cordon.
                  </span>
                </div>
              </div>
            </div>
          )}

          {tacticalTab === 'OVERVIEW' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '6px', border: '1px solid #1e293b' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PRIMARY STELLAR BODY</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginTop: '4px' }}>Hal'Ven Prime</div>
                  <HalVenStateDisplay />
                </div>

                <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '6px', border: '1px solid #1e293b' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>INHABITED WORLD</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginTop: '4px' }}>Hal'Ven IV</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                    Population: 4.8 Billion // Orbital Radius: 1.2 AU
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '6px', border: '1px solid #1e293b' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>CURRENT PHASE</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#38bdf8', marginTop: '4px' }}>{currentPhase}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                    Sector Quarantine Code: 0x7E-BLOOD-ECLIPSE
                  </div>
                </div>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#0f172a', borderRadius: '6px', border: '1px solid #1e293b' }}>
                <h4 style={{ fontSize: '0.95rem', color: '#e2e8f0', marginBottom: '10px' }}>
                  STATION HV-88 OBSERVATION LOG
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                  Observation platform positioned in high equatorial orbit above Hal'Ven IV. Mission: Monitoring stellar corona harmonics and peripheral trade corridor ingress. Telemetry linked to Administration Defense Central.
                </p>
              </div>
            </div>
          )}

          {tacticalTab === 'CLUSTER_MAP' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '6px', border: '1px solid #1e293b' }}>
                <h3 style={{ fontSize: '1rem', color: '#38bdf8', marginBottom: '6px' }}>
                  TACTICAL INTERFACE SCHEMATIC // CONTAINMENT LATTICE MODEL
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  [NOTE: This node graph represents an Administration analytical projection of containment geometry. Physical space exhibits no visible grid lines or lattice; from planetary viewpoints, the Siege Wall manifests as an irregular expanding void of starless blackness.]
                </span>
              </div>

              {/* Abstract 2D Tactical Node Graphic */}
              <div
                style={{
                  height: '280px',
                  backgroundColor: '#030712',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="100%" height="100%" viewBox="0 0 600 240">
                  {/* Containment boundary links */}
                  <line x1="120" y1="60" x2="280" y2="40" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="280" y1="40" x2="460" y2="80" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="460" y1="80" x2="490" y2="180" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="490" y1="180" x2="310" y2="200" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="310" y1="200" x2="140" y2="170" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="140" y1="170" x2="120" y2="60" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="4 4" />

                  {/* System Nodes */}
                  <circle cx="120" cy="60" r="6" fill="#ef4444" />
                  <text x="130" y="65" fill="#f8fafc" fontSize="10">Hal'Ven Prime (Collapsed)</text>

                  <circle cx="280" cy="40" r="5" fill="#ef4444" />
                  <text x="290" y="45" fill="#f8fafc" fontSize="10">HV-Delta (Collapsed)</text>

                  <circle cx="460" cy="80" r="5" fill="#ef4444" />
                  <text x="470" y="85" fill="#f8fafc" fontSize="10">HV-Gamma (Collapsed)</text>

                  <circle cx="490" cy="180" r="5" fill="#ef4444" />
                  <text x="400" y="195" fill="#f8fafc" fontSize="10">HV-Theta (Collapsed)</text>

                  <circle cx="310" cy="200" r="5" fill="#ef4444" />
                  <text x="230" y="215" fill="#f8fafc" fontSize="10">HV-Epsilon (Collapsed)</text>

                  <circle cx="140" cy="170" r="5" fill="#ef4444" />
                  <text x="60" y="185" fill="#f8fafc" fontSize="10">HV-Zeta (Collapsed)</text>

                  {/* Drakken Enclosed Core */}
                  <circle cx="300" cy="120" r="30" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="245" y="125" fill="#f59e0b" fontSize="11" fontWeight="bold">DRAKKEN SECTOR</text>
                </svg>
              </div>
            </div>
          )}

          {tacticalTab === 'TACTICAL_LOGS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
              <div style={{ padding: '12px', backgroundColor: '#0f172a', borderRadius: '4px', borderLeft: '3px solid #38bdf8' }}>
                <span style={{ color: '#64748b' }}>[T-00:00:00]</span> <strong>DISPATCH #9921:</strong> Station HV-88 operational. Solar output nominal.
              </div>
              <div style={{ padding: '12px', backgroundColor: '#0f172a', borderRadius: '4px', borderLeft: '3px solid #f59e0b' }}>
                <span style={{ color: '#64748b' }}>[T-00:00:16]</span> <strong>FLASH PRIORITY #01:</strong> Aureal Gate defense collapsed. Starsilk weapon signature verified. Drakken forces breached perimeter.
              </div>
              <div style={{ padding: '12px', backgroundColor: '#0f172a', borderRadius: '4px', borderLeft: '3px solid #00e5ff' }}>
                <span style={{ color: '#64748b' }}>[T-00:00:32]</span> <strong>DIVINE PROTOCOL:</strong> Shard God authority acknowledged. Automated stellar contraction directive broadcast to all Hal'Ven systems.
              </div>
              <div style={{ padding: '12px', backgroundColor: '#0f172a', borderRadius: '4px', borderLeft: '3px solid #ef4444' }}>
                <span style={{ color: '#64748b' }}>[T-00:00:52]</span> <strong>HELIOCIDE ONSET:</strong> Hal'Ven Prime entering forced gravitational collapse. Singularity radius expanding. Evacuate all personnel.
              </div>
              <div style={{ padding: '12px', backgroundColor: '#0f172a', borderRadius: '4px', borderLeft: '3px solid #ef4444' }}>
                <span style={{ color: '#64748b' }}>[T-00:01:18]</span> <strong>CLUSTER CASCADE:</strong> Stellar collapses confirmed at neighboring systems Delta, Gamma, Theta, Epsilon. Structural breach on Station HV-88.
              </div>
              <div style={{ padding: '12px', backgroundColor: '#0f172a', borderRadius: '4px', borderLeft: '3px solid #64748b' }}>
                <span style={{ color: '#64748b' }}>[T-00:02:02]</span> <strong>FINAL STATUS:</strong> Station HV-88 past event horizon. Containment achieved.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
