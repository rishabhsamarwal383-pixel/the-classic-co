/**
 * =============================================================================
 * THE CLASSIC CO. - SUNSET DRIVE: DODGE THE GLARE (Interactive Web Game)
 * =============================================================================
 * High-performance, lightweight HTML5 Canvas arcade mini-game.
 * Players drive a vintage roadster along Udaipur lake roads at sunset.
 * Dodge blinding sun glare, collect Polarized Sunglasses, and unlock discounts!
 * 
 * Reward Tiers:
 * - Score 50+ points  -> 10% OFF (Code: CLASSIC10)
 * - Score 100+ points -> 15% OFF (Code: CLASSIC15)
 * =============================================================================
 */

(function () {
  'use strict';

  // --- AUDIO SYNTHESIS VIA WEB AUDIO API (Zero external audio files needed) ---
  let audioCtx = null;
  let isMuted = false;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type) {
    if (isMuted || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.14);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'collect') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(660, now + 0.08);
        osc.frequency.setValueAtTime(880, now + 0.16);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.26);
      } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'win') {
        // High celebratory chime
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.connect(g);
          g.connect(audioCtx.destination);
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, now + idx * 0.1);
          g.gain.setValueAtTime(0.25, now + idx * 0.1);
          g.gain.linearRampToValueAtTime(0.01, now + idx * 0.1 + 0.25);
          o.start(now + idx * 0.1);
          o.stop(now + idx * 0.1 + 0.26);
        });
      }
    } catch (e) {
      // Audio playback best effort
    }
  }

  // --- GAME CONSTANTS & STATE ---
  let canvas, ctx;
  let animFrameId = null;
  let gameRunning = false;
  let gameState = 'START'; // 'START', 'PLAYING', 'GAMEOVER'
  let score = 0;
  let highScore = parseInt(localStorage.getItem('classic_high_score') || '0', 10);
  let speed = 4.5;
  let gameTime = 0;
  let isPolarizedShieldActive = false;
  let polarizedShieldTimer = 0;

  // Car Physics
  const car = {
    x: 65,
    y: 0,
    width: 68,
    height: 32,
    baseY: 0,
    vy: 0,
    gravity: 0.68,
    jumpPower: -11.5,
    isGrounded: true,
    rotation: 0
  };

  // World Arrays
  let obstacles = [];
  let pickups = [];
  let particles = [];
  let clouds = [];
  let nextObstacleTimer = 80;
  let nextPickupTimer = 180;

  // --- CANVAS RESIZING ---
  function resizeCanvas() {
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    canvas.logicalWidth = rect.width;
    canvas.logicalHeight = rect.height;

    car.baseY = canvas.logicalHeight - 65;
    if (car.isGrounded) car.y = car.baseY;
  }

  // --- ENTITY CREATION ---
  function spawnObstacle() {
    // Blinding sun glare flare or roadblock
    const types = ['glare_cone', 'glare_beam', 'sun_orb'];
    const type = types[Math.floor(Math.random() * types.length)];
    obstacles.push({
      x: canvas.logicalWidth + 20,
      y: car.baseY - (type === 'sun_orb' ? 28 : 12),
      width: type === 'sun_orb' ? 36 : 28,
      height: type === 'sun_orb' ? 36 : 42,
      type: type,
      pulse: 0
    });
  }

  function spawnPickup() {
    // The Classic Co. Polarized Sunglasses item
    pickups.push({
      x: canvas.logicalWidth + 40,
      y: car.baseY - 45 - Math.random() * 35,
      width: 42,
      height: 22,
      floatOffset: 0
    });
  }

  function createDustParticle(x, y) {
    particles.push({
      x: x,
      y: y,
      vx: -(speed * 0.4 + Math.random() * 2),
      vy: (Math.random() - 0.5) * 1.5,
      radius: Math.random() * 4 + 2,
      alpha: 0.7,
      color: Math.random() > 0.5 ? '#f59e0b' : '#fbbf24'
    });
  }

  function createConfetti() {
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: canvas.logicalWidth / 2,
        y: canvas.logicalHeight / 2 - 40,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.9) * 10,
        radius: Math.random() * 5 + 3,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 0.25
      });
    }
  }

  // --- DRAWING ROUTINES ---
  function drawSkyAndPalace() {
    const w = canvas.logicalWidth;
    const h = canvas.logicalHeight;

    // Sunset gradient (Udaipur golden hour)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h - 50);
    if (isPolarizedShieldActive) {
      // Cool polarized tint view!
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.5, '#1e293b');
      skyGrad.addColorStop(1, '#334155');
    } else {
      skyGrad.addColorStop(0, '#4c1d95');
      skyGrad.addColorStop(0.35, '#c2410c');
      skyGrad.addColorStop(0.7, '#f59e0b');
      skyGrad.addColorStop(1, '#fef08a');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Glowing Golden Sun
    const sunY = h * 0.38;
    const sunGrad = ctx.createRadialGradient(w * 0.75, sunY, 10, w * 0.75, sunY, 80);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.3, isPolarizedShieldActive ? '#93c5fd' : '#fde047');
    sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(w * 0.75, sunY, 80, 0, Math.PI * 2);
    ctx.fill();

    // Lake Pichola water reflection strip
    const lakeY = h - 85;
    const waterGrad = ctx.createLinearGradient(0, lakeY, 0, lakeY + 35);
    waterGrad.addColorStop(0, isPolarizedShieldActive ? '#1e293b' : '#b45309');
    waterGrad.addColorStop(1, isPolarizedShieldActive ? '#0f172a' : '#78350f');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, lakeY, w, 35);

    // Lake water shimmer lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const lineY = lakeY + 6 + i * 6;
      const offset = (gameTime * 2 + i * 25) % 80;
      ctx.beginPath();
      ctx.moveTo((offset) % w, lineY);
      ctx.lineTo((offset + 40) % w, lineY);
      ctx.stroke();
    }

    // Udaipur City Palace & hills silhouette
    ctx.fillStyle = isPolarizedShieldActive ? '#090d16' : '#291334';
    ctx.beginPath();
    ctx.moveTo(0, lakeY);
    // Low dome & palace shapes
    const palacePts = [
      [0, lakeY - 12], [40, lakeY - 18], [70, lakeY - 32], [85, lakeY - 32],
      [95, lakeY - 15], [140, lakeY - 24], [160, lakeY - 45], [175, lakeY - 45],
      [190, lakeY - 20], [250, lakeY - 16], [290, lakeY - 35], [330, lakeY - 15],
      [w, lakeY - 14], [w, lakeY], [0, lakeY]
    ];
    for (let pt of palacePts) {
      ctx.lineTo(pt[0], pt[1]);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawRoad() {
    const w = canvas.logicalWidth;
    const h = canvas.logicalHeight;
    const roadY = h - 50;

    // Dark asphalt tarmac
    ctx.fillStyle = '#1e1b18';
    ctx.fillRect(0, roadY, w, 50);

    // Road curb
    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, roadY, w, 4);

    // Moving dashed lane divider
    ctx.fillStyle = '#ffffff';
    const dashW = 32;
    const gapW = 28;
    const cycle = dashW + gapW;
    const offset = (gameTime * speed * 2) % cycle;
    for (let x = -offset; x < w; x += cycle) {
      ctx.fillRect(x, roadY + 22, dashW, 3);
    }
  }

  function drawVintageRoadster(x, y) {
    ctx.save();
    ctx.translate(x + car.width / 2, y + car.height / 2);
    ctx.rotate(car.rotation);

    // Main Body: Sleek British Racing / Luxury Emerald Green Roadster
    const bodyColor = isPolarizedShieldActive ? '#059669' : '#15803d';
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(-car.width / 2, -car.height / 2 + 8, car.width, car.height - 14, 6);
    ctx.fill();

    // Top Cockpit curve & Windshield (Polarized Tint Glass)
    ctx.fillStyle = isPolarizedShieldActive ? '#38bdf8' : '#e0e7ff';
    ctx.beginPath();
    ctx.moveTo(-10, -car.height / 2 + 8);
    ctx.lineTo(10, -car.height / 2 + 8);
    ctx.lineTo(18, -car.height / 2 - 2);
    ctx.lineTo(-4, -car.height / 2 - 2);
    ctx.closePath();
    ctx.fill();

    // Chrome Trim & Side Accent Line
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-car.width / 2 + 4, -car.height / 2 + 15, car.width - 8, 2.5);

    // Headlight (Glowing forward)
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(car.width / 2 - 4, -car.height / 2 + 11, 4, 6);

    // Headlight Beam
    const beamGrad = ctx.createLinearGradient(car.width / 2, 0, car.width / 2 + 70, 0);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(car.width / 2, -car.height / 2 + 11);
    ctx.lineTo(car.width / 2 + 70, -car.height / 2 + 3);
    ctx.lineTo(car.width / 2 + 70, car.height / 2 + 5);
    ctx.lineTo(car.width / 2, -car.height / 2 + 17);
    ctx.closePath();
    ctx.fill();

    // Driver Silhouette wearing sunglasses
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-2, -car.height / 2 + 1, 6, 0, Math.PI * 2);
    ctx.fill();
    // Sunglasses on driver
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(1, -car.height / 2 - 1, 4, 2.5);

    // Wheels (Spinning with spokes)
    const wheelY = car.height / 2 - 5;
    [-20, 20].forEach(wheelX => {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(wheelX, wheelY, 9, 0, Math.PI * 2);
      ctx.fill();

      // Chrome wheel cap
      ctx.fillStyle = '#d4d4d8';
      ctx.beginPath();
      ctx.arc(wheelX, wheelY, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Polarized Shield Aura if active
    if (isPolarizedShieldActive) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, car.width * 0.65, car.height * 0.75, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawObstacle(obs) {
    ctx.save();
    obs.pulse = (obs.pulse + 0.1) % (Math.PI * 2);

    if (obs.type === 'sun_orb') {
      // Blinding High-Beam Sun Glare Orb
      const grad = ctx.createRadialGradient(obs.x + obs.width / 2, obs.y + obs.height / 2, 4, obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#f59e0b');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Road Hazard / Blinding Glare Spikes
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(obs.x + obs.width / 2, obs.y);
      ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
      ctx.lineTo(obs.x, obs.y + obs.height);
      ctx.closePath();
      ctx.fill();

      // Warning glow
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner Glare Star
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(obs.x + obs.width / 2, obs.y + 12, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawSunglassesPickup(p) {
    ctx.save();
    p.floatOffset = Math.sin(gameTime * 0.1) * 4;
    const y = p.y + p.floatOffset;

    // Glowing background aura
    const aura = ctx.createRadialGradient(p.x + p.width / 2, y + p.height / 2, 5, p.x + p.width / 2, y + p.height / 2, 28);
    aura.addColorStop(0, 'rgba(56, 189, 248, 0.6)');
    aura.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(p.x + p.width / 2, y + p.height / 2, 28, 0, Math.PI * 2);
    ctx.fill();

    // Sunglass Gold Frame: Two aviator teardrop lenses + bridge
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;

    // Left Lens
    ctx.beginPath();
    ctx.roundRect(p.x + 2, y + 2, 16, 14, [4, 4, 8, 8]);
    ctx.fill();
    ctx.stroke();

    // Right Lens
    ctx.beginPath();
    ctx.roundRect(p.x + 22, y + 2, 16, 14, [4, 4, 8, 8]);
    ctx.fill();
    ctx.stroke();

    // Bridge Bar & Top Brow Bar
    ctx.beginPath();
    ctx.moveTo(p.x + 18, y + 6);
    ctx.lineTo(p.x + 22, y + 6);
    ctx.moveTo(p.x + 4, y + 2);
    ctx.lineTo(p.x + 36, y + 2);
    ctx.stroke();

    // Polarized Reflection Sheen
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p.x + 5, y + 12);
    ctx.lineTo(p.x + 11, y + 5);
    ctx.moveTo(p.x + 25, y + 12);
    ctx.lineTo(p.x + 31, y + 5);
    ctx.stroke();

    ctx.restore();
  }

  function drawHUD() {
    const w = canvas.logicalWidth;

    // Score pill
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(14, 14, 130, 36, 18);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('SCORE: ' + Math.floor(score), 28, 38);

    // High score pill
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(w - 150, 14, 136, 36, 18);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('BEST: ' + highScore, w - 132, 37);

    // Polarized Shield Timer Bar if active
    if (isPolarizedShieldActive) {
      const shieldRatio = Math.max(0, polarizedShieldTimer / 240);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.fillRect(14, 56, 130 * shieldRatio, 6);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('🕶️ POLARIZED SHIELD', 14, 76);
    }

    // Target Discount Milestones Pill
    let tierText = 'Next: 50 pts → 10% OFF';
    if (score >= 100) {
      tierText = '🎉 15% OFF UNLOCKED!';
    } else if (score >= 50) {
      tierText = '✓ 10% OFF! Next: 100 → 15% OFF';
    }
    ctx.fillStyle = score >= 50 ? '#10b981' : '#f59e0b';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(tierText, w / 2 - ctx.measureText(tierText).width / 2, 38);
  }

  // --- GAME LOOP ---
  function update() {
    gameTime++;

    // Car jump physics
    car.vy += car.gravity;
    car.y += car.vy;

    if (car.y >= car.baseY) {
      car.y = car.baseY;
      car.vy = 0;
      car.isGrounded = true;
      car.rotation = 0;

      // Create tyre smoke/dust while rolling
      if (gameTime % 4 === 0) {
        createDustParticle(car.x, car.y + car.height - 4);
      }
    } else {
      car.isGrounded = false;
      // Slight tilt when jumping
      car.rotation = Math.min(Math.max(car.vy * 0.03, -0.35), 0.35);
    }

    // Score increments smoothly + speed slowly rises
    score += 0.12;
    speed = 4.5 + Math.min(score * 0.025, 4.0);

    // Shield Timer
    if (isPolarizedShieldActive) {
      polarizedShieldTimer--;
      if (polarizedShieldTimer <= 0) {
        isPolarizedShieldActive = false;
      }
    }

    // Spawning Obstacles
    nextObstacleTimer--;
    if (nextObstacleTimer <= 0) {
      spawnObstacle();
      nextObstacleTimer = Math.floor(75 + Math.random() * 55 - Math.min(score * 0.2, 25));
    }

    // Spawning Pickups
    nextPickupTimer--;
    if (nextPickupTimer <= 0) {
      spawnPickup();
      nextPickupTimer = Math.floor(160 + Math.random() * 120);
    }

    // Update Obstacles & Check Collisions
    const carHitbox = {
      x: car.x + 10,
      y: car.y + 6,
      width: car.width - 20,
      height: car.height - 10
    };

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= speed;

      // Collision Detection
      const collides = (
        carHitbox.x < obs.x + obs.width &&
        carHitbox.x + carHitbox.width > obs.x &&
        carHitbox.y < obs.y + obs.height &&
        carHitbox.y + carHitbox.height > obs.y
      );

      if (collides) {
        if (isPolarizedShieldActive) {
          // Polarized shield dissolves the glare!
          obstacles.splice(i, 1);
          playSound('collect');
          score += 15;
          continue;
        } else {
          // Crash!
          gameOver();
          return;
        }
      }

      // Remove off-screen
      if (obs.x + obs.width < -50) {
        obstacles.splice(i, 1);
      }
    }

    // Update Sunglasses Pickups
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      p.x -= speed * 0.85;

      const collidesWithCar = (
        carHitbox.x < p.x + p.width &&
        carHitbox.x + carHitbox.width > p.x &&
        carHitbox.y < p.y + p.height &&
        carHitbox.y + carHitbox.height > p.y
      );

      if (collidesWithCar) {
        pickups.splice(i, 1);
        playSound('collect');
        score += 25; // Bonus points!
        isPolarizedShieldActive = true;
        polarizedShieldTimer = 240; // ~4 seconds of invulnerability
        continue;
      }

      if (p.x + p.width < -50) {
        pickups.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      if (pt.gravity) pt.vy += pt.gravity;
      pt.alpha -= 0.02;
      if (pt.alpha <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.logicalWidth, canvas.logicalHeight);

    drawSkyAndPalace();
    drawRoad();

    // Draw Particles behind car
    particles.forEach(pt => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.alpha);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Pickups & Obstacles
    pickups.forEach(drawSunglassesPickup);
    obstacles.forEach(drawObstacle);

    // Draw Car
    drawVintageRoadster(car.x, car.y);

    // HUD
    drawHUD();
  }

  function gameLoop() {
    if (gameState === 'PLAYING') {
      update();
      render();
      animFrameId = requestAnimationFrame(gameLoop);
    }
  }

  // --- ACTIONS ---
  function jump() {
    initAudio();
    if (gameState === 'START') {
      startGame();
      return;
    }
    if (gameState === 'GAMEOVER') {
      startGame();
      return;
    }
    if (gameState === 'PLAYING' && car.isGrounded) {
      car.vy = car.jumpPower;
      car.isGrounded = false;
      playSound('jump');
    }
  }

  function startGame() {
    initAudio();
    gameState = 'PLAYING';
    score = 0;
    speed = 4.5;
    gameTime = 0;
    obstacles = [];
    pickups = [];
    particles = [];
    isPolarizedShieldActive = false;
    polarizedShieldTimer = 0;
    car.y = car.baseY;
    car.vy = 0;
    car.isGrounded = true;

    hideOverlay();
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function gameOver() {
    gameState = 'GAMEOVER';
    playSound('crash');
    if (animFrameId) cancelAnimationFrame(animFrameId);

    const finalScore = Math.floor(score);
    if (finalScore > highScore) {
      highScore = finalScore;
      localStorage.setItem('classic_high_score', highScore.toString());
    }

    showGameOverScreen(finalScore);
  }

  // --- OVERLAY / UI HANDLING ---
  function showGameOverScreen(finalScore) {
    const overlay = document.getElementById('arcade-overlay');
    if (!overlay) return;

    let discountTier = null;
    let code = '';
    let discountPct = 0;

    if (finalScore >= 100) {
      discountTier = 'Master Aviator Tier';
      code = 'CLASSIC15';
      discountPct = 15;
      playSound('win');
      createConfetti();
    } else if (finalScore >= 50) {
      discountTier = 'Classic Driver Tier';
      code = 'CLASSIC10';
      discountPct = 10;
      playSound('win');
      createConfetti();
    }

    let resultHtml = '';
    if (discountTier) {
      resultHtml = `
        <div style="background:linear-gradient(135deg, #064e3b, #047857); border:2px solid #34d399; border-radius:16px; padding:20px; color:#ffffff; margin-bottom:18px; box-shadow:0 10px 25px rgba(5,150,105,0.35);">
          <div style="font-size:12px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:#a7f3d0; margin-bottom:4px;">
            🎉 REWARD UNLOCKED: ${discountTier.toUpperCase()}
          </div>
          <div style="font-size:26px; font-weight:800; font-family:'Playfair Display', serif; margin-bottom:6px;">
            YOU WON ${discountPct}% OFF!
          </div>
          <p style="font-size:13px; color:#e6fffa; margin-bottom:14px; line-height:1.5;">
            Score: <strong>${finalScore}</strong> (Best: ${highScore}) · Protect your eyes with authentic polarized lenses.
          </p>
          <div style="display:flex; align-items:center; justify-content:center; gap:8px; background:rgba(0,0,0,0.3); border:1px dashed #6ee7b7; border-radius:10px; padding:10px 16px; margin-bottom:14px;">
            <span style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#d1fae5;">Voucher Code:</span>
            <strong style="font-size:18px; font-family:monospace; letter-spacing:2px; color:#ffffff;">${code}</strong>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <button type="button" onclick="window.ClassicGame.copyCode('${code}')" style="background:#ffffff; color:#064e3b; border:none; padding:12px; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer;">
              📋 Copy Code
            </button>
            <button type="button" onclick="window.ClassicGame.applyAndShop('${code}')" style="background:#fbbf24; color:#1e1b18; border:none; padding:12px; border-radius:8px; font-weight:800; font-size:13px; cursor:pointer;">
              🛍️ Apply & Shop
            </button>
          </div>
        </div>
      `;
    } else {
      const needed = 50 - finalScore;
      resultHtml = `
        <div style="background:#1e1b18; border:1px solid #332d27; border-radius:16px; padding:20px; color:#ffffff; margin-bottom:18px;">
          <div style="font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#f59e0b; margin-bottom:4px;">
            🕶️ BLINDED BY ROAD GLARE!
          </div>
          <div style="font-size:24px; font-weight:800; font-family:'Playfair Display', serif; margin-bottom:6px;">
            Final Score: ${finalScore}
          </div>
          <p style="font-size:13px; color:#a8a29e; margin-bottom:16px; line-height:1.5;">
            You missed 10% OFF by just <strong>${needed} points</strong>! Tap jump to dodge sun glare and collect sunglasses for invulnerability shield.
          </p>
        </div>
      `;
    }

    overlay.innerHTML = `
      <div class="arcade-card-content" style="max-width:380px; width:90%; text-align:center;">
        ${resultHtml}
        <button type="button" onclick="window.ClassicGame.start()" class="btn-hero-explore" style="width:100%; justify-content:center; padding:15px; font-size:15px; font-weight:700; background:#161514; color:#ffffff; border:1.5px solid #fbbf24; border-radius:10px; cursor:pointer; margin-bottom:8px;">
          🔄 Play Again (Jump)
        </button>
        <button type="button" onclick="window.ClassicGame.closeModal()" style="background:none; border:none; color:#78716c; font-size:12px; cursor:pointer; padding:8px;">
          Close Arcade
        </button>
      </div>
    `;
    overlay.style.display = 'flex';
  }

  function hideOverlay() {
    const overlay = document.getElementById('arcade-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  // --- PUBLIC API EXPOSURE ---
  window.ClassicGame = {
    openModal: function () {
      initAudio();
      const modal = document.getElementById('classic-arcade-modal');
      if (!modal) return;
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      canvas = document.getElementById('classic-arcade-canvas');
      ctx = canvas.getContext('2d');
      resizeCanvas();

      // Show Start Screen
      const overlay = document.getElementById('arcade-overlay');
      if (overlay) {
        overlay.innerHTML = `
          <div class="arcade-card-content" style="max-width:380px; width:90%; text-align:center; background:#161514; border:1px solid #292524; border-radius:18px; padding:24px 20px; box-shadow:0 20px 40px rgba(0,0,0,0.6);">
            <div style="font-size:11px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:#fbbf24; margin-bottom:6px;">
              THE CLASSIC CO. ARCADE
            </div>
            <h2 style="font-size:24px; font-weight:800; font-family:'Playfair Display', serif; color:#ffffff; margin:0 0 10px;">
              Sunset Drive: Dodge The Glare 🕶️
            </h2>
            <p style="font-size:13px; color:#a8a29e; line-height:1.5; margin-bottom:18px;">
              Drive along Udaipur lake roads. Tap/Space to jump over blinding glare and collect polarized sunglasses to activate your shield!
            </p>
            <div style="display:flex; justify-content:space-around; background:#1e1b18; border-radius:10px; padding:10px; margin-bottom:20px; font-size:12px;">
              <div><strong style="color:#fbbf24;">50 pts</strong><br><span style="color:#a8a29e;">10% OFF</span></div>
              <div style="border-left:1px solid #332d27;"></div>
              <div><strong style="color:#10b981;">100 pts</strong><br><span style="color:#a8a29e;">15% OFF</span></div>
            </div>
            <button type="button" onclick="window.ClassicGame.start()" class="btn-hero-explore" style="width:100%; justify-content:center; padding:15px; font-size:15px; font-weight:800; background:#fbbf24; color:#1e1b18; border:none; border-radius:10px; cursor:pointer;">
              🚀 Tap to Start Drive
            </button>
          </div>
        `;
        overlay.style.display = 'flex';
      }
      render();
    },

    closeModal: function () {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      gameState = 'START';
      const modal = document.getElementById('classic-arcade-modal');
      if (modal) modal.style.display = 'none';
      document.body.style.overflow = '';
    },

    start: function () {
      startGame();
    },

    jump: function () {
      jump();
    },

    toggleMute: function () {
      isMuted = !isMuted;
      const btn = document.getElementById('arcade-sound-btn');
      if (btn) btn.innerText = isMuted ? '🔇' : '🔊';
    },

    copyCode: function (code) {
      navigator.clipboard.writeText(code).then(() => {
        alert(`✓ Coupon code ${code} copied to clipboard!`);
      }).catch(() => {
        prompt('Copy your discount code:', code);
      });
    },

    applyAndShop: function (code) {
      // Store in session storage so checkout can automatically pick it up!
      try {
        sessionStorage.setItem('classic_discount_code', code);
      } catch (e) {}

      window.ClassicGame.closeModal();

      // Smooth scroll to catalog
      const catalogEl = document.getElementById('collection');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }

      // Show notification toast
      const toast = document.createElement('div');
      toast.style.cssText = 'position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#065f46; color:#ffffff; padding:14px 22px; border-radius:30px; font-size:13.5px; font-weight:700; z-index:999999; box-shadow:0 10px 25px rgba(0,0,0,0.3); border:1px solid #34d399; display:flex; align-items:center; gap:8px;';
      toast.innerHTML = `<span>🎉</span> <span>${code} (15% OFF) automatically active at checkout!</span>`;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => toast.remove(), 500);
      }, 4000);
    }
  };

  // --- EVENT LISTENERS ---
  window.addEventListener('resize', resizeCanvas);

  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      const modal = document.getElementById('classic-arcade-modal');
      if (modal && modal.style.display === 'flex') {
        e.preventDefault();
        jump();
      }
    }
    if (e.code === 'Escape') {
      window.ClassicGame.closeModal();
    }
  });

  // Touch & click on canvas
  document.addEventListener('DOMContentLoaded', function () {
    const canvasEl = document.getElementById('classic-arcade-canvas');
    if (canvasEl) {
      canvasEl.addEventListener('touchstart', function (e) {
        e.preventDefault();
        jump();
      }, { passive: false });

      canvasEl.addEventListener('mousedown', function (e) {
        jump();
      });
    }
  });

})();
