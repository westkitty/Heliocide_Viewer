import { StarCollapseShader } from './StarCollapseShader';
import { InhabitedPlanet } from './InhabitedPlanet';
import { OrbitalInfrastructure } from './OrbitalInfrastructure';
import { DistantCascadingStars } from './DistantCascadingStars';
import { SiegeWallVoid } from './SiegeWallVoid';
import { GalacticBackground } from './GalacticBackground';

export function CelestialSystem() {
  return (
    <group name="celestial-system">
      {/* Deep-Sky Galactic Background with subtle interstellar dust lanes */}
      <GalacticBackground />

      {/* Background Starfield with deterministic cascade extinction */}
      <DistantCascadingStars />

      {/* Central Collapsing Star & Accretion Singularity */}
      <StarCollapseShader />

      {/* Inhabited World: Hal'Ven IV */}
      <InhabitedPlanet />

      {/* Orbital Traffic & Solar Arrays */}
      <OrbitalInfrastructure />

      {/* Physical Sky Siege Wall Swath */}
      <SiegeWallVoid />
    </group>
  );
}
