// SerpentMesh.js - 3D Cybernetic Serpent with animated head, articulating body segments, and energy veins.
import * as THREE from 'three';

const SKIN_PALETTES = {
  white: {
    armor: 0xf5f8fc,     // Pristine Celestial Titanium Pearl White
    glow: 0xffffff,      // Radiant Luminescent White Energy Veins
    eyes: 0x00f0ff,      // Glowing Cyan Visor Eyes
    metalness: 0.96,
    roughness: 0.12,
  },
  cyan: {
    armor: 0x0d1117,
    glow: 0x00f0ff,
    eyes: 0x00f0ff,
    metalness: 0.9,
    roughness: 0.2,
  },
  ultraviolet: {
    armor: 0x160826,
    glow: 0xd900ff,
    eyes: 0xff007f,
    metalness: 0.85,
    roughness: 0.25,
  },
  solar: {
    armor: 0x241400,
    glow: 0xffb703,
    eyes: 0xff4500,
    metalness: 0.92,
    roughness: 0.18,
  },
  matrix: {
    armor: 0x06180a,
    glow: 0x00ff66,
    eyes: 0x39ff14,
    metalness: 0.88,
    roughness: 0.22,
  },
  iridescent: {
    armor: 0x181828,
    glow: 0x00f7ff,
    eyes: 0xffffff,
    metalness: 0.95,
    roughness: 0.1,
  },
};

export class SerpentMesh {
  constructor(scene, skinKey = 'white') {
    this.scene = scene;
    this.skinKey = skinKey;
    this.palette = SKIN_PALETTES[skinKey] || SKIN_PALETTES.white;

    this.group = new THREE.Group();
    this.segments = []; // array of { mesh, veinMesh, targetPos, currentPos, angle }
    this.pulseWave = -1; // wave position for feeding pulse

    this.createMaterials();
    this.createHead();

    this.scene.add(this.group);
  }

  createMaterials() {
    this.armorMat = new THREE.MeshStandardMaterial({
      color: this.palette.armor,
      metalness: this.palette.metalness,
      roughness: this.palette.roughness,
    });

    this.veinMat = new THREE.MeshBasicMaterial({
      color: this.palette.glow,
      wireframe: false,
    });

    this.eyeMat = new THREE.MeshBasicMaterial({
      color: this.palette.eyes,
    });
  }

  setSkin(skinKey) {
    this.skinKey = skinKey;
    this.palette = SKIN_PALETTES[skinKey] || SKIN_PALETTES.cyan;
    this.armorMat.color.setHex(this.palette.armor);
    this.veinMat.color.setHex(this.palette.glow);
    this.eyeMat.color.setHex(this.palette.eyes);
  }

  createHead() {
    this.headGroup = new THREE.Group();

    // 1. Sleek Main Skull (Angled Hexagonal Wedge)
    const skullGeom = new THREE.ConeGeometry(0.75, 1.6, 6);
    skullGeom.rotateX(Math.PI / 2); // Point forward along +Z
    this.skull = new THREE.Mesh(skullGeom, this.armorMat);
    this.skull.scale.set(1.1, 0.7, 1.0);
    this.headGroup.add(this.skull);

    // 2. Optical Visor / Glowing Cyber Eyes
    const eyeGeom = new THREE.BoxGeometry(0.2, 0.12, 0.45);
    const leftEye = new THREE.Mesh(eyeGeom, this.eyeMat);
    leftEye.position.set(-0.35, 0.15, 0.2);
    leftEye.rotation.y = 0.25;

    const rightEye = new THREE.Mesh(eyeGeom, this.eyeMat);
    rightEye.position.set(0.35, 0.15, 0.2);
    rightEye.rotation.y = -0.25;

    this.headGroup.add(leftEye);
    this.headGroup.add(rightEye);

    // 3. Central Dorsal Energy Crest
    const crestGeom = new THREE.BoxGeometry(0.08, 0.4, 0.9);
    const crest = new THREE.Mesh(crestGeom, this.veinMat);
    crest.position.set(0, 0.35, -0.15);
    crest.rotation.x = -0.3;
    this.headGroup.add(crest);

    // 4. Lateral Mandible Aerofoils
    const finGeom = new THREE.BufferGeometry();
    const finVertices = new Float32Array([
      0, 0, 0,
      -0.6, 0, -0.5,
      0, 0, -0.6
    ]);
    finGeom.setAttribute('position', new THREE.BufferAttribute(finVertices, 3));
    const leftFin = new THREE.Mesh(finGeom, this.armorMat);
    leftFin.position.set(-0.4, -0.05, 0);

    const rightFin = leftFin.clone();
    rightFin.scale.x = -1;
    rightFin.position.set(0.4, -0.05, 0);

    this.headGroup.add(leftFin);
    this.headGroup.add(rightFin);

    // Head elevation
    this.headGroup.position.y = 0.6;
    this.group.add(this.headGroup);
  }

  createSegmentMesh(index, total) {
    const segGroup = new THREE.Group();

    // Scale tapers slightly towards tail
    const factor = Math.max(0.4, 1.0 - (index / total) * 0.45);

    // 1. Carapace Shell (Segment Armor)
    const shellGeom = new THREE.CylinderGeometry(0.55 * factor, 0.6 * factor, 0.7 * factor, 7);
    shellGeom.rotateX(Math.PI / 2);
    const shell = new THREE.Mesh(shellGeom, this.armorMat);
    segGroup.add(shell);

    // 2. Glowing Vein Ring (Energy core connector)
    const veinGeom = new THREE.TorusGeometry(0.52 * factor, 0.08 * factor, 8, 16);
    const vein = new THREE.Mesh(veinGeom, this.veinMat);
    segGroup.add(vein);

    // 3. Spine Node Spike
    const spineGeom = new THREE.ConeGeometry(0.12 * factor, 0.35 * factor, 4);
    const spine = new THREE.Mesh(spineGeom, this.veinMat);
    spine.position.y = 0.45 * factor;
    spine.rotation.x = -0.2;
    segGroup.add(spine);

    segGroup.position.y = 0.6;
    return { group: segGroup, vein, factor };
  }

  triggerFeedPulse() {
    this.pulseWave = 0; // starts wave at head
  }

  update(bodyPositions, isDashing = false, delta = 0.016) {
    if (!bodyPositions || bodyPositions.length === 0) return;

    // 1. Head Update
    const headTarget = bodyPositions[0];
    this.headGroup.position.x = headTarget.x;
    this.headGroup.position.z = headTarget.z;

    // Head rotation to face movement direction
    if (bodyPositions.length > 1) {
      const nextPos = bodyPositions[1];
      const dx = headTarget.x - nextPos.x;
      const dz = headTarget.z - nextPos.z;
      const angle = Math.atan2(dx, dz);
      // Smooth slerp/lerp rotation
      this.headGroup.rotation.y = angle;
    }

    // 2. Synchronize Segment Count
    const needed = bodyPositions.length - 1;
    while (this.segments.length < needed) {
      const idx = this.segments.length;
      const item = this.createSegmentMesh(idx, Math.max(10, needed));
      this.group.add(item.group);
      this.segments.push(item);
    }
    while (this.segments.length > needed) {
      const removed = this.segments.pop();
      this.group.remove(removed.group);
    }

    // 3. Feeding pulse propagation
    if (this.pulseWave >= 0) {
      this.pulseWave += delta * 15;
      if (this.pulseWave > this.segments.length + 3) {
        this.pulseWave = -1;
      }
    }

    // 4. Update Each Segment
    const time = Date.now() * 0.006;
    for (let i = 0; i < this.segments.length; i++) {
      const pos = bodyPositions[i + 1];
      const prevPos = bodyPositions[i];
      const item = this.segments[i];

      // Position
      item.group.position.x = pos.x;
      item.group.position.z = pos.z;

      // Natural biomechanical undulating sine-wave
      const undulation = Math.sin(time + i * 0.45) * (0.08 * item.factor);
      item.group.position.y = 0.6 + undulation;

      // Align segment with preceding node
      const dx = prevPos.x - pos.x;
      const dz = prevPos.z - pos.z;
      if (dx !== 0 || dz !== 0) {
        item.group.rotation.y = Math.atan2(dx, dz);
      }

      // Energy vein pulse highlight
      const distFromWave = Math.abs(i - this.pulseWave);
      if (distFromWave < 1.5) {
        item.vein.scale.setScalar(1.4);
      } else if (isDashing) {
        item.vein.scale.setScalar(1.2 + Math.sin(time * 4) * 0.15);
      } else {
        item.vein.scale.setScalar(1.0);
      }
    }
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
