// InputController.js - Unified input handling for Keyboard, Touch Swipes, and Virtual Joystick.

export class InputController {
  constructor(onDirectionChange, onDash, onPause) {
    this.onDirectionChange = onDirectionChange;
    this.onDash = onDash;
    this.onPause = onPause;

    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isTouchActive = false;

    // Joystick state
    this.joystickActive = false;
    this.joystickOrigin = { x: 0, y: 0 };
    this.joystickCurrent = { x: 0, y: 0 };
    this.minSwipeDistance = 25; // px

    this.setupKeyboard();
    this.setupTouch();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Prevent scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          this.onDirectionChange({ x: 0, z: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          this.onDirectionChange({ x: 0, z: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.onDirectionChange({ x: -1, z: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.onDirectionChange({ x: 1, z: 0 });
          break;
        case ' ':
        case 'Shift':
          this.onDash();
          break;
        case 'p':
        case 'P':
        case 'Escape':
          this.onPause();
          break;
      }
    });
  }

  setupTouch() {
    const zone = document.getElementById('touch-zone') || window;

    zone.addEventListener('touchstart', (e) => {
      if (e.target.closest('button, .interactive-ui')) return;
      const t = e.touches[0];
      this.touchStartX = t.clientX;
      this.touchStartY = t.clientY;
      this.isTouchActive = true;

      // Virtual Joystick Origin
      this.joystickOrigin = { x: t.clientX, y: t.clientY };
      this.joystickCurrent = { x: t.clientX, y: t.clientY };
      this.showJoystickUI(t.clientX, t.clientY);
    }, { passive: false });

    zone.addEventListener('touchmove', (e) => {
      if (!this.isTouchActive) return;
      const t = e.touches[0];
      this.joystickCurrent = { x: t.clientX, y: t.clientY };

      const dx = t.clientX - this.touchStartX;
      const dy = t.clientY - this.touchStartY;

      this.updateJoystickUI(dx, dy);

      // Trigger direction if moved past threshold
      if (Math.hypot(dx, dy) > this.minSwipeDistance) {
        if (Math.abs(dx) > Math.abs(dy)) {
          this.onDirectionChange(dx > 0 ? { x: 1, z: 0 } : { x: -1, z: 0 });
        } else {
          this.onDirectionChange(dy > 0 ? { x: 0, z: 1 } : { x: 0, z: -1 });
        }
        // Reset origin to current point for fluid continuous steering
        this.touchStartX = t.clientX;
        this.touchStartY = t.clientY;
      }
    }, { passive: false });

    zone.addEventListener('touchend', () => {
      this.isTouchActive = false;
      this.hideJoystickUI();
    });

    zone.addEventListener('touchcancel', () => {
      this.isTouchActive = false;
      this.hideJoystickUI();
    });
  }

  showJoystickUI(x, y) {
    const stick = document.getElementById('virtual-joystick');
    if (stick) {
      stick.style.display = 'block';
      stick.style.left = `${x}px`;
      stick.style.top = `${y}px`;
    }
  }

  updateJoystickUI(dx, dy) {
    const knob = document.getElementById('joystick-knob');
    if (knob) {
      const dist = Math.min(35, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);
      knob.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
    }
  }

  hideJoystickUI() {
    const stick = document.getElementById('virtual-joystick');
    const knob = document.getElementById('joystick-knob');
    if (stick) stick.style.display = 'none';
    if (knob) knob.style.transform = 'translate(0px, 0px)';
  }
}
