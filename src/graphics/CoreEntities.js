// CoreEntities.js - 3D meshes for Collectible Energy Cores, Quantum Gate Portals, and Hazards.
import * as THREE from 'three';

export class CoreEntities {
  constructor(scene) {
    this.scene = scene;
    this.coreMesh = null;
    this.portals = []; // Array of portal meshes
    this.hazards = []; // Array of active hazard meshes
    this.bossBeamMesh = null;
    this.animTime = 0;
  }

  // --- COLLECTIBLE ENERGY CORES ---

  createCore(type = 'quantum', position = { x: 0, z: 0 }) {
    if (this.coreMesh) {
      this.scene.remove(this.coreMesh);
      this.coreMesh = null;
    }

    const group = new THREE.Group();
    group.position.set(position.x, 0.75, position.z);

    const typeConfigs = {
      quantum: {
        color: 0x00f0ff,
        innerGeom: new THREE.OctahedronGeometry(0.5, 0),
        rings: 2,
      },
      solar: {
        color: 0xffb703,
        innerGeom: new THREE.DodecahedronGeometry(0.55, 0),
        rings: 3,
      },
      darkmatter: {
        color: 0x9d00ff,
        innerGeom: new THREE.IcosahedronGeometry(0.48, 1),
        rings: 1,
      },
      chrono: {
        color: 0x00ff88,
        innerGeom: new THREE.OctahedronGeometry(0.52, 1),
        rings: 2,
      },
    };

    const cfg = typeConfigs[type] || typeConfigs.quantum;

    // 1. Central Floating Polyhedral Core
    const coreMat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      wireframe: true,
    });
    const innerCore = new THREE.Mesh(cfg.innerGeom, coreMat);
    group.add(innerCore);

    // 2. Solid Inner Glow Nucleus
    const nucleusMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    const nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), nucleusMat);
    group.add(nucleus);

    // 3. Gyroscopic Orbital Rings
    const ringMat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });

    const rings = [];
    for (let i = 0; i < cfg.rings; i++) {
      const ringGeom = new THREE.TorusGeometry(0.75 + i * 0.18, 0.03, 6, 24);
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = (i * Math.PI) / 3;
      ringMesh.rotation.y = (i * Math.PI) / 4;
      group.add(ringMesh);
      rings.push(ringMesh);
    }

    // 4. Point light for ground illumination
    const light = new THREE.PointLight(cfg.color, 2.5, 8);
    light.position.set(0, 0, 0);
    group.add(light);

    this.scene.add(group);
    this.coreMesh = { group, innerCore, rings, type, light };
    return this.coreMesh;
  }

  removeCore() {
    if (this.coreMesh) {
      this.scene.remove(this.coreMesh.group);
      this.coreMesh = null;
    }
  }

  // --- QUANTUM GATES (PORTALS) ---

  createPortals(portalA, portalB) {
    this.clearPortals();

    const portalConfigs = [
      { pos: portalA, color: 0x00f0ff, name: 'Alpha' },
      { pos: portalB, color: 0xff007f, name: 'Beta' },
    ];

    portalConfigs.forEach((cfg, idx) => {
      const group = new THREE.Group();
      group.position.set(cfg.pos.x, 0.05, cfg.pos.z);

      // 1. Swirling Vortex Disk on floor
      const diskGeom = new THREE.RingGeometry(0.3, 1.25, 32);
      const diskMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      });
      const disk = new THREE.Mesh(diskGeom, diskMat);
      disk.rotation.x = Math.PI / 2;
      group.add(disk);

      // 2. Vertical Gateway Arch Ring
      const archGeom = new THREE.TorusGeometry(1.2, 0.08, 8, 32, Math.PI);
      const archMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        metalness: 0.9,
        roughness: 0.2,
      });
      const arch = new THREE.Mesh(archGeom, archMat);
      arch.position.y = 0;
      group.add(arch);

      // 3. Vertical Portal Shimmer Plane
      const shimmerGeom = new THREE.CircleGeometry(1.15, 24, 0, Math.PI);
      const shimmerMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      const shimmer = new THREE.Mesh(shimmerGeom, shimmerMat);
      group.add(shimmer);

      // 4. Portal Ambient Light
      const light = new THREE.PointLight(cfg.color, 2.0, 7);
      light.position.set(0, 1.0, 0);
      group.add(light);

      this.scene.add(group);
      this.portals.push({ group, disk, arch, shimmer, color: cfg.color, pos: cfg.pos });
    });
  }

  clearPortals() {
    this.portals.forEach(p => this.scene.remove(p.group));
    this.portals = [];
  }

  // --- HAZARDS (COSMIC SINGULARITIES / MINES) ---

  createHazard(pos) {
    const group = new THREE.Group();
    group.position.set(pos.x, 0.7, pos.z);

    // Hazard Spiky Core
    const geom = new THREE.DodecahedronGeometry(0.48, 0);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff1e42,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geom, mat);
    group.add(mesh);

    // Warning Aura ring
    const auraGeom = new THREE.RingGeometry(0.5, 0.75, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xff0044,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const aura = new THREE.Mesh(auraGeom, auraMat);
    aura.rotation.x = Math.PI / 2;
    group.add(aura);

    this.scene.add(group);
    const item = { group, mesh, aura, pos };
    this.hazards.push(item);
    return item;
  }

  clearHazards() {
    this.hazards.forEach(h => this.scene.remove(h.group));
    this.hazards = [];
  }

  // --- BOSS BEAM ANOMALY ---

  triggerBossBeam(x, z, duration = 2.0) {
    if (this.bossBeamMesh) {
      this.scene.remove(this.bossBeamMesh.group);
      this.bossBeamMesh = null;
    }

    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Vertical orbital death ray cylinder
    const cylGeom = new THREE.CylinderGeometry(1.4, 1.4, 60, 16, 1, true);
    const cylMat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(cylGeom, cylMat);
    beam.position.y = 30;
    group.add(beam);

    // Ground burn reticle
    const reticleGeom = new THREE.RingGeometry(0.2, 1.8, 32);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const reticle = new THREE.Mesh(reticleGeom, reticleMat);
    reticle.rotation.x = Math.PI / 2;
    reticle.position.y = 0.05;
    group.add(reticle);

    this.scene.add(group);
    this.bossBeamMesh = { group, beam, reticle, timeLeft: duration, x, z };
  }

  update(delta) {
    this.animTime += delta;

    // 1. Animate Active Collectible Core
    if (this.coreMesh) {
      const { group, innerCore, rings } = this.coreMesh;
      // Floating vertical bobbing
      group.position.y = 0.75 + Math.sin(this.animTime * 3.5) * 0.15;
      innerCore.rotation.x += delta * 1.5;
      innerCore.rotation.y += delta * 2.0;

      rings.forEach((r, idx) => {
        r.rotation.x += delta * (1.8 + idx * 0.5);
        r.rotation.y += delta * (1.2 - idx * 0.4);
      });
    }

    // 2. Animate Portals
    this.portals.forEach(p => {
      p.disk.rotation.z += delta * 2.5;
      p.shimmer.material.opacity = 0.3 + Math.sin(this.animTime * 4) * 0.15;
    });

    // 3. Animate Hazards
    this.hazards.forEach(h => {
      h.mesh.rotation.x += delta * 2.0;
      h.mesh.rotation.y += delta * 2.5;
      const pulse = 1.0 + Math.sin(this.animTime * 5) * 0.2;
      h.aura.scale.set(pulse, pulse, 1);
    });

    // 4. Animate Boss Beam
    if (this.bossBeamMesh) {
      this.bossBeamMesh.timeLeft -= delta;
      this.bossBeamMesh.beam.rotation.y += delta * 6.0;
      this.bossBeamMesh.beam.scale.x = 1.0 + Math.sin(this.animTime * 20) * 0.1;
      this.bossBeamMesh.beam.scale.z = 1.0 + Math.sin(this.animTime * 20) * 0.1;

      if (this.bossBeamMesh.timeLeft <= 0) {
        this.scene.remove(this.bossBeamMesh.group);
        this.bossBeamMesh = null;
      }
    }
  }

  destroy() {
    this.removeCore();
    this.clearPortals();
    this.clearHazards();
    if (this.bossBeamMesh) {
      this.scene.remove(this.bossBeamMesh.group);
    }
  }
}
