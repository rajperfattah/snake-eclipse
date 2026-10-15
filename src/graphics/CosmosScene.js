// CosmosScene.js - Manages Three.js WebGL scene, Black Hole, stars, lighting, and camera.
import * as THREE from 'three';

export class CosmosScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x03020a, 0.007);

    // Renderer with fallback
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: 'default',
        alpha: false,
      });
    } catch (e) {
      console.warn('Primary WebGL initialization failed, attempting fallback...', e);
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: false,
      });
    }
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // Camera
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.defaultCamPos = new THREE.Vector3(0, 42, 38);
    this.camera.position.copy(this.defaultCamPos);
    this.camera.lookAt(0, 0, 0);

    // Camera State
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.cameraMode = 'menu'; // 'menu', 'gameplay', 'gameover'
    this.menuAngle = 0;
    this.shakeIntensity = 0;
    this.targetFov = 55;

    // Lighting
    this.setupLighting();

    // Cosmic Environment
    this.setupStarfield();
    this.setupNebulae();
    this.setupBlackHole();

    // Resize handler
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  setupLighting() {
    // Ambient cosmic glow
    const ambientLight = new THREE.AmbientLight(0x1a0f30, 1.8);
    this.scene.add(ambientLight);

    // Deep space directional light (stellar radiance)
    const dirLight = new THREE.DirectionalLight(0x00f0ff, 1.6);
    dirLight.position.set(30, 50, 40);
    this.scene.add(dirLight);

    // Black hole accretion rim light
    const blackHoleGlow = new THREE.PointLight(0xff007f, 3.5, 120);
    blackHoleGlow.position.set(0, -35, 0);
    this.scene.add(blackHoleGlow);
    this.blackHoleGlow = blackHoleGlow;

    // Dynamic light tracking serpent head
    this.serpentLight = new THREE.PointLight(0x00f0ff, 4.0, 35, 2);
    this.serpentLight.position.set(0, 2, 0);
    this.scene.add(this.serpentLight);
  }

  setupStarfield() {
    const starCount = 3500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const palette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0x00f0ff),
      new THREE.Color(0x9d00ff),
      new THREE.Color(0xff007f),
      new THREE.Color(0xffb703),
    ];

    for (let i = 0; i < starCount; i++) {
      // Distribute in a huge cosmic sphere
      const radius = 350 + Math.random() * 850;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    this.starfield = new THREE.Points(geometry, material);
    this.scene.add(this.starfield);
  }

  setupNebulae() {
    // Procedural glowing nebular gas clouds
    this.nebulaGroup = new THREE.Group();
    const cloudCount = 18;
    const cloudGeom = new THREE.DodecahedronGeometry(45, 1);

    for (let i = 0; i < cloudCount; i++) {
      const angle = (i / cloudCount) * Math.PI * 2;
      const dist = 180 + (i % 3) * 60;
      const y = -80 + (i % 4) * 35;

      const hue = (i % 2 === 0) ? 0x9d00ff : 0x00f0ff;
      const mat = new THREE.MeshBasicMaterial({
        color: hue,
        wireframe: true,
        transparent: true,
        opacity: 0.08,
      });

      const mesh = new THREE.Mesh(cloudGeom, mat);
      mesh.position.set(Math.cos(angle) * dist, y, Math.sin(angle) * dist);
      mesh.scale.set(1.5 + Math.random(), 0.8 + Math.random(), 1.5 + Math.random());
      mesh.rotation.set(Math.random(), Math.random(), Math.random());
      this.nebulaGroup.add(mesh);
    }
    this.scene.add(this.nebulaGroup);
  }

  setupBlackHole() {
    this.blackHoleGroup = new THREE.Group();
    this.blackHoleGroup.position.set(0, -42, 0);

    // 1. Event Horizon (Singularity Sphere)
    const sphereGeom = new THREE.SphereGeometry(18, 48, 48);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });
    this.eventHorizon = new THREE.Mesh(sphereGeom, sphereMat);
    this.blackHoleGroup.add(this.eventHorizon);

    // 2. Gravitational Lensing / Photon Ring Halo
    const ringGeom = new THREE.RingGeometry(18.2, 21.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    this.photonRing = new THREE.Mesh(ringGeom, ringMat);
    this.photonRing.rotation.x = Math.PI / 2;
    this.blackHoleGroup.add(this.photonRing);

    // 3. Multi-layered Relativistic Accretion Disk (Swirling plasma particles)
    const diskParticleCount = 4500;
    const diskGeom = new THREE.BufferGeometry();
    const diskPos = new Float32Array(diskParticleCount * 3);
    const diskColors = new Float32Array(diskParticleCount * 3);

    for (let i = 0; i < diskParticleCount; i++) {
      const radius = 22 + Math.pow(Math.random(), 1.5) * 65;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * (radius * 0.08); // Slight funnel thickness

      diskPos[i * 3] = radius * Math.cos(theta);
      diskPos[i * 3 + 1] = y;
      diskPos[i * 3 + 2] = radius * Math.sin(theta);

      // Relativistic color shift: inner edge hot cyan/white, outer rim fiery violet/magenta
      const ratio = (radius - 22) / 65;
      const c = new THREE.Color();
      if (ratio < 0.25) {
        c.setHSL(0.52, 1.0, 0.75); // Hot Electric Cyan
      } else if (ratio < 0.6) {
        c.setHSL(0.80, 1.0, 0.65); // Ultraviolet Purple
      } else {
        c.setHSL(0.92, 1.0, 0.55); // Deep Magenta
      }

      diskColors[i * 3] = c.r;
      diskColors[i * 3 + 1] = c.g;
      diskColors[i * 3 + 2] = c.b;
    }

    diskGeom.setAttribute('position', new THREE.BufferAttribute(diskPos, 3));
    diskGeom.setAttribute('color', new THREE.BufferAttribute(diskColors, 3));

    const diskMat = new THREE.PointsMaterial({
      size: 2.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    this.accretionDisk = new THREE.Points(diskGeom, diskMat);
    this.blackHoleGroup.add(this.accretionDisk);

    // 4. Polar Plasma Jet Streams
    const jetGeom = new THREE.CylinderGeometry(0.8, 14, 180, 16, 1, true);
    const jetMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.25,
      wireframe: true,
      blending: THREE.AdditiveBlending,
    });
    this.northJet = new THREE.Mesh(jetGeom, jetMat);
    this.northJet.position.y = 90;
    this.southJet = new THREE.Mesh(jetGeom, jetMat);
    this.southJet.position.y = -90;
    this.southJet.rotation.x = Math.PI;

    this.blackHoleGroup.add(this.northJet);
    this.blackHoleGroup.add(this.southJet);

    // Tilt the black hole assembly for dramatic framing
    this.blackHoleGroup.rotation.x = 0.35;
    this.blackHoleGroup.rotation.z = -0.2;

    this.scene.add(this.blackHoleGroup);
  }

  addScreenShake(intensity = 0.4) {
    this.shakeIntensity = Math.min(this.shakeIntensity + intensity, 1.2);
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
  }

  update(delta, headPos = null) {
    // 1. Animate Accretion Disk & Cosmic Environment
    if (this.accretionDisk) {
      this.accretionDisk.rotation.y += delta * 0.45;
    }
    if (this.photonRing) {
      this.photonRing.rotation.z += delta * 0.2;
    }
    if (this.starfield) {
      this.starfield.rotation.y += delta * 0.015;
    }
    if (this.nebulaGroup) {
      this.nebulaGroup.rotation.y += delta * 0.02;
    }

    // 2. Pulse Black Hole Light
    if (this.blackHoleGlow) {
      this.blackHoleGlow.intensity = 3.0 + Math.sin(Date.now() * 0.003) * 0.8;
    }

    // 3. Update Serpent Light
    if (headPos && this.serpentLight) {
      this.serpentLight.position.set(headPos.x, headPos.y + 2, headPos.z);
    }

    // 4. Camera Dynamics & Transitions
    if (this.cameraMode === 'menu') {
      this.menuAngle += delta * 0.18;
      const radius = 55;
      const height = 36;
      this.camera.position.x = Math.cos(this.menuAngle) * radius;
      this.camera.position.z = Math.sin(this.menuAngle) * radius;
      this.camera.position.y = height + Math.sin(this.menuAngle * 2) * 5;
      this.cameraTarget.set(0, 0, 0);
      this.camera.lookAt(this.cameraTarget);
      this.targetFov = 55;
    } else if (this.cameraMode === 'gameplay' && headPos) {
      // Dynamic chase camera with smooth lag and tactical top-down angle
      const idealX = headPos.x * 0.25;
      const idealZ = headPos.z * 0.35 + 32;
      const idealY = 38;

      this.camera.position.x += (idealX - this.camera.position.x) * (delta * 4.0);
      this.camera.position.z += (idealZ - this.camera.position.z) * (delta * 4.0);
      this.camera.position.y += (idealY - this.camera.position.y) * (delta * 4.0);

      this.cameraTarget.x += (headPos.x * 0.7 - this.cameraTarget.x) * (delta * 5.0);
      this.cameraTarget.z += (headPos.z * 0.7 - this.cameraTarget.z) * (delta * 5.0);
      this.cameraTarget.y = 0;

      this.camera.lookAt(this.cameraTarget);
    } else if (this.cameraMode === 'gameover') {
      // Cinematic slow pullback
      this.menuAngle += delta * 0.12;
      this.camera.position.x = Math.cos(this.menuAngle) * 62;
      this.camera.position.z = Math.sin(this.menuAngle) * 62;
      this.camera.position.y += (48 - this.camera.position.y) * (delta * 2.0);
      this.camera.lookAt(0, 0, 0);
    }

    // 5. Screen Shake
    if (this.shakeIntensity > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity * 2.5;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity * 2.5;
      this.camera.position.z += (Math.random() - 0.5) * this.shakeIntensity * 2.5;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - delta * 2.5);
    }

    // 6. Smooth FOV Interpolation
    if (Math.abs(this.camera.fov - this.targetFov) > 0.1) {
      this.camera.fov += (this.targetFov - this.camera.fov) * (delta * 5.0);
      this.camera.updateProjectionMatrix();
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  setDashFov(isDashing) {
    this.targetFov = isDashing ? 68 : 55;
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  destroy() {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
