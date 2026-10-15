// ArenaMesh.js - 3D Holographic Cosmic Platform, Pylons, and Energy Barriers
import * as THREE from 'three';

export class ArenaMesh {
  constructor(scene, gridSize = 22, tileSize = 1.6) {
    this.scene = scene;
    this.gridSize = gridSize;
    this.tileSize = tileSize;
    this.halfSize = (gridSize * tileSize) / 2;

    this.group = new THREE.Group();
    this.pulseTime = 0;
    this.tiltTarget = new THREE.Euler(0, 0, 0);

    this.createFloor();
    this.createPerimeterBarrier();
    this.createCornerPylons();

    this.scene.add(this.group);
  }

  createFloor() {
    // 1. Base dark obsidian slab under the grid
    const slabGeom = new THREE.BoxGeometry(
      this.gridSize * this.tileSize + 3,
      1.2,
      this.gridSize * this.tileSize + 3
    );
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x080612,
      roughness: 0.25,
      metalness: 0.85,
    });
    this.baseSlab = new THREE.Mesh(slabGeom, slabMat);
    this.baseSlab.position.y = -0.65;
    this.group.add(this.baseSlab);

    // 2. Holographic Grid Mesh
    const gridHelper = new THREE.GridHelper(
      this.gridSize * this.tileSize,
      this.gridSize,
      0x00f0ff,
      0x251245
    );
    gridHelper.position.y = 0.02;
    this.gridHelper = gridHelper;
    this.group.add(gridHelper);

    // 3. Central Energy Conduit Ring on Floor
    const conduitGeom = new THREE.RingGeometry(this.halfSize * 0.4, this.halfSize * 0.42, 48);
    const conduitMat = new THREE.MeshBasicMaterial({
      color: 0x9d00ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    this.floorConduit = new THREE.Mesh(conduitGeom, conduitMat);
    this.floorConduit.rotation.x = Math.PI / 2;
    this.floorConduit.position.y = 0.03;
    this.group.add(this.floorConduit);
  }

  createPerimeterBarrier() {
    this.barrierBeams = [];
    const span = this.gridSize * this.tileSize;
    const height = 1.5;

    // 4 glowing laser barriers along the perimeter
    const beamGeom = new THREE.PlaneGeometry(span, height);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
    });

    const positions = [
      { x: 0, z: this.halfSize, rotY: 0 },
      { x: 0, z: -this.halfSize, rotY: 0 },
      { x: this.halfSize, z: 0, rotY: Math.PI / 2 },
      { x: -this.halfSize, z: 0, rotY: Math.PI / 2 },
    ];

    positions.forEach(pos => {
      const beam = new THREE.Mesh(beamGeom, beamMat.clone());
      beam.position.set(pos.x, height / 2, pos.z);
      beam.rotation.y = pos.rotY;
      this.group.add(beam);
      this.barrierBeams.push(beam);
    });

    // Glowing perimeter outline rails
    const railMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 });
    const points = [
      new THREE.Vector3(-this.halfSize, height, -this.halfSize),
      new THREE.Vector3(this.halfSize, height, -this.halfSize),
      new THREE.Vector3(this.halfSize, height, this.halfSize),
      new THREE.Vector3(-this.halfSize, height, this.halfSize),
      new THREE.Vector3(-this.halfSize, height, -this.halfSize),
    ];
    const railGeom = new THREE.BufferGeometry().setFromPoints(points);
    this.topRail = new THREE.Line(railGeom, railMat);
    this.group.add(this.topRail);
  }

  createCornerPylons() {
    this.pylons = [];
    const corners = [
      { x: -this.halfSize, z: -this.halfSize },
      { x: this.halfSize, z: -this.halfSize },
      { x: this.halfSize, z: this.halfSize },
      { x: -this.halfSize, z: this.halfSize },
    ];

    corners.forEach(c => {
      const pylonGroup = new THREE.Group();
      pylonGroup.position.set(c.x, 0, c.z);

      // Pylon Pillar
      const colGeom = new THREE.CylinderGeometry(0.35, 0.55, 3.2, 8);
      const colMat = new THREE.MeshStandardMaterial({
        color: 0x16132b,
        metalness: 0.9,
        roughness: 0.2,
      });
      const col = new THREE.Mesh(colGeom, colMat);
      col.position.y = 1.6;
      pylonGroup.add(col);

      // Pylon Energy Crystal
      const crystalGeom = new THREE.OctahedronGeometry(0.5, 0);
      const crystalMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        wireframe: true,
      });
      const crystal = new THREE.Mesh(crystalGeom, crystalMat);
      crystal.position.y = 3.6;
      pylonGroup.add(crystal);

      this.group.add(pylonGroup);
      this.pylons.push({ group: pylonGroup, crystal });
    });
  }

  setTheme(theme) {
    const themes = {
      void: { primary: 0x00f0ff, secondary: 0x9d00ff, rail: 0x00f0ff },
      solar: { primary: 0xffb703, secondary: 0xff007f, rail: 0xffb703 },
      matrix: { primary: 0x00ff66, secondary: 0x003311, rail: 0x00ff66 },
      ultraviolet: { primary: 0xda00ff, secondary: 0x5a00ff, rail: 0xda00ff },
    };
    const t = themes[theme] || themes.void;

    this.barrierBeams.forEach(b => {
      b.material.color.setHex(t.primary);
    });
    if (this.topRail) {
      this.topRail.material.color.setHex(t.rail);
    }
    if (this.floorConduit) {
      this.floorConduit.material.color.setHex(t.secondary);
    }
    this.pylons.forEach(p => {
      p.crystal.material.color.setHex(t.primary);
    });
  }

  setTilt(x, z) {
    this.tiltTarget.set(x, 0, z);
  }

  update(delta) {
    this.pulseTime += delta;

    // Rotate pylon crystals
    this.pylons.forEach(p => {
      p.crystal.rotation.y += delta * 2.0;
      p.crystal.position.y = 3.6 + Math.sin(this.pulseTime * 3) * 0.2;
    });

    // Floor conduit pulsing
    if (this.floorConduit) {
      this.floorConduit.rotation.z += delta * 0.15;
      this.floorConduit.material.opacity = 0.4 + Math.sin(this.pulseTime * 2.5) * 0.25;
    }

    // Barrier pulsing
    this.barrierBeams.forEach((b, i) => {
      b.material.opacity = 0.18 + Math.sin(this.pulseTime * 3 + i) * 0.08;
    });

    // Smooth tilt interpolation for Gravity Shift
    this.group.rotation.x += (this.tiltTarget.x - this.group.rotation.x) * (delta * 3.0);
    this.group.rotation.z += (this.tiltTarget.z - this.group.rotation.z) * (delta * 3.0);
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
