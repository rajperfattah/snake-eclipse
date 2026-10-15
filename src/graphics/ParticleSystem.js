// ParticleSystem.js - High-performance pooled WebGL particle effects
import * as THREE from 'three';

const MAX_PARTICLES = 1200;

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];

    // Pre-allocate geometry and buffers
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.colors = new Float32Array(MAX_PARTICLES * 3);
    this.sizes = new Float32Array(MAX_PARTICLES);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 2.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);

    // Initialize particle pool
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        active: false,
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        r: 1, g: 1, b: 1,
        life: 0,
        maxLife: 1,
        size: 2.0,
      });
      this.sizes[i] = 0;
    }
  }

  emitBurst(origin, colorHex = 0x00f0ff, count = 35, speed = 4.5) {
    const c = new THREE.Color(colorHex);
    let spawned = 0;

    for (let i = 0; i < MAX_PARTICLES && spawned < count; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.x = origin.x;
        p.y = origin.y || 0.6;
        p.z = origin.z;

        // Spherical explosion velocity
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const v = (speed * 0.5) + Math.random() * speed;

        p.vx = Math.sin(phi) * Math.cos(theta) * v;
        p.vy = Math.abs(Math.cos(phi)) * v * 0.8 + 0.5; // Upward bias
        p.vz = Math.sin(phi) * Math.sin(theta) * v;

        p.r = c.r;
        p.g = c.g;
        p.b = c.b;

        p.life = 0;
        p.maxLife = 0.45 + Math.random() * 0.4;
        p.size = 2.0 + Math.random() * 2.5;

        spawned++;
      }
    }
  }

  emitDashTrail(origin, colorHex = 0x00f0ff, count = 6) {
    const c = new THREE.Color(colorHex);
    let spawned = 0;

    for (let i = 0; i < MAX_PARTICLES && spawned < count; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.x = origin.x + (Math.random() - 0.5) * 0.4;
        p.y = 0.6 + (Math.random() - 0.5) * 0.4;
        p.z = origin.z + (Math.random() - 0.5) * 0.4;

        p.vx = (Math.random() - 0.5) * 0.8;
        p.vy = Math.random() * 1.2;
        p.vz = (Math.random() - 0.5) * 0.8;

        p.r = c.r;
        p.g = c.g;
        p.b = c.b;

        p.life = 0;
        p.maxLife = 0.25 + Math.random() * 0.2;
        p.size = 3.2;

        spawned++;
      }
    }
  }

  update(delta) {
    let activeCount = 0;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (p.active) {
        p.life += delta;
        if (p.life >= p.maxLife) {
          p.active = false;
          this.sizes[i] = 0;
          continue;
        }

        // Physics
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.z += p.vz * delta;
        p.vy -= 9.8 * delta * 0.35; // Slight gravity

        // Fade out
        const progress = p.life / p.maxLife;
        const fade = 1 - progress;

        this.positions[i * 3] = p.x;
        this.positions[i * 3 + 1] = p.y;
        this.positions[i * 3 + 2] = p.z;

        this.colors[i * 3] = p.r * fade;
        this.colors[i * 3 + 1] = p.g * fade;
        this.colors[i * 3 + 2] = p.b * fade;

        this.sizes[i] = p.size * fade;
        activeCount++;
      } else {
        this.sizes[i] = 0;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  destroy() {
    this.scene.remove(this.points);
  }
}
