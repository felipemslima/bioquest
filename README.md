# BioQuest

**An educational pixel-art platformer about how a bacterium causes disease.** You play as *Streptococcus pneumoniae*: survive antimicrobial agents, reach the lungs and get past the immune system, learning the real biology along the way.

<!-- TODO: add a gameplay GIF and a link to the playable version (GitHub Pages) -->

Built with **Phaser 3** + **Vite**. The game text is in Portuguese.

## Gameplay

| Phase | Goal | Biology behind it |
|---|---|---|
| **1 — Survive the acid rain** | Cross the level while dodging lethal "rain" | Antimicrobial agents: surface agents, alcohols, biguanides, halogens, antibiotics |
| **2 — Find the lung** | Reach the respiratory tract and infect the cell | Virulence factors: polysaccharide capsule, M protein, toxins |
| **Boss — Beat the immune system** | Fight neutrophils and a macrophage boss | Phagocytosis and how the capsule helps the bacterium evade it |

Between phases, info screens explain each concept, so the gameplay and the content reinforce each other.

**Controls:** `←/→` or `A/D` to move · `↑`, `W` or `Space` to jump · `X` or `Shift` to attack · `Enter` to continue

## Technical highlights

- **Scene-based architecture:** Boot → Title → Objectives → Info → Phase 1 → Phase 2 → Win / Game Over, with scene keys defined in a single config
- **Arcade physics** with tuned gravity, jump velocity, friction, invincibility frames and attack windows
- **Tiled tilemaps** (`assets/tilemaps/*.json`) for level layout, and a seeded RNG for deterministic background decoration
- **Enemy entities** (`Neutrophil`, `Macrophage`) with their own behavior, plus a boss fight
- Educational content kept separate from game logic (`src/data/infoP1.js`, `infoP2.js`)
- Game design document included: [`gamedesign.pdf`](gamedesign.pdf)

## Running

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static build in dist/
```

## Project layout

```
src/
├── main.js            # Phaser game config
├── config.js          # constants: physics, sizes, scene keys
├── scenes/            # Title, Objectives, Info, Phase1, Phase2, Win, GameOver…
├── entities/          # Player, Neutrophil, Macrophage
└── data/              # educational text for each phase
assets/                # sprites, tilemaps
gamedesign.pdf         # game design document
```
