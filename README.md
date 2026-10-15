# 🌌 SNAKE: ECLIPSE — Beyond the Void

> A visually spectacular, futuristic 3D WebGL cosmic snake adventure powered by Three.js and Vite.

---

## 🌟 Overview

**SNAKE: ECLIPSE — Beyond the Void** reinvents the legendary arcade snake mechanic into a high-stakes, fast-paced cosmic space odyssey. Navigate a biomechanical cybernetic serpent through the event horizon of a supermassive black hole, utilizing hyper-speed Phase Dashes, dimensional Quantum Gates, and elemental energy cores.

---

## 🚀 Key Features & Mechanics

- **Real-Time 3D WebGL Engine**: Built with Three.js featuring an animated Gargantua-class black hole, multi-layered relativistic accretion disk, and dynamic starry cosmos.
- **Biomechanical Cyber Serpent**: Articulated dragon/cyber head with glowing optic crest, individually undulating carapace segments, and responsive energy veins.
- **Phase Dash Ability**: Tap `Spacebar` / `Shift` / Onscreen button to warp forward invulnerably with a hyperspace trail, evading tail collisions and cosmic singularities.
- **Dimensional Quantum Gates**: Dual linked portals (Alpha & Beta) providing tactical teleportation across the arena.
- **Energy Evolution System**:
  - 🔷 **Quantum Core (Cyan)**: Primary evolutionary catalyst (+100 pts, body growth).
  - ☀️ **Solar Flare Core (Gold)**: Triggers Solar Frenzy with 2x multipliers and blazing speed (+300 pts).
  - 🟣 **Dark Matter Core (Violet)**: Compresses serpent length by 2 segments and shields against hazards (+200 pts).
  - 🟢 **Chrono Core (Emerald)**: Dilates spacetime into slow-motion for pinpoint navigation (+150 pts).
- **Dynamic Combo Surge**: Chaining core pickups multiplies score up to **x5 Surge**; slithering within 1 tile of danger triggers **Close Call** near-miss bonuses.
- **Boss Encounter**: Milestone Void Titan beam anomalies targeting arena sectors.
- **Procedural Web Audio Synthesizer**: Zero external audio files—100% synthesized cosmic ambient BGM, crystal bell chimes, warp whooshes, and sub-bass implosions.
- **Responsive Controls**: Full support for Keyboard (WASD / Arrows), Touch Swipes, and a dynamic floating Virtual Joystick on mobile and tablets.
- **Persistent Progression**: LocalStorage saves high scores, achievements, and Void Shards currency to unlock skins in the **Serpent Hangar**.

---

## 🎮 Game Modes

1. **Classic Eclipse**: Pure tactical grid progression with portals and self-preservation.
2. **Cosmic Survival**: Shifting singularities, gravitational arena tilts, and boss hazard beams.
3. **Time Attack**: 90-second frenetic rush to achieve maximum score.
4. **Endless Eclipse**: Relaxed Zen exploration with infinite space wrapping and no self-collision.
5. **Flight Academy**: Interactive guided flight tutorial for new pilots.

---

## 🕹️ Controls

| Control | Action |
| :--- | :--- |
| **W / A / S / D** or **Arrow Keys** | Steer Serpent |
| **Spacebar / Shift** | Phase Dash (Invulnerable Warp) |
| **P / Escape** | Pause / Resume Mission |
| **Touch Drag / Swipe** | Mobile Virtual Joystick / Directional Swipe |
| **Onscreen Button** | Mobile Phase Dash Trigger |

---

## 🛠️ Installation & Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- `npm` or `yarn`

### Setup Steps
```bash
# 1. Clone or navigate to the project directory
cd snake-eclipse

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173/`.

### Production Build
```bash
npm run build
```
The optimized static production bundle will be generated in the `dist/` directory.

---

## 🌐 Free Deployment Guide

### Option 1: Vercel (Recommended)
1. Push your repository to GitHub.
2. Log into [Vercel](https://vercel.com/) and click **Add New Project**.
3. Select your repository.
4. Vercel automatically detects Vite:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**.

### Option 2: Netlify
1. Log into [Netlify](https://www.netlify.com/).
2. Drag and drop the `dist/` folder into the Netlify dashboard, or connect your GitHub repository with build command `npm run build` and publish directory `dist`.

### Option 3: GitHub Pages
1. In `vite.config.js`, set `base: './'`.
2. Run `npm run build`.
3. Deploy the `dist` folder to your `gh-pages` branch.

---

## 🛸 Tech Stack
- **Three.js** (WebGL 3D Rendering)
- **Vite** (Next-Generation Frontend Tooling)
- **Vanilla CSS3** (Futuristic Glassmorphism & Cyber Aesthetics)
- **Web Audio API** (Procedural Audio Synthesis)
- **HTML5 Canvas & Semantic Markup**
