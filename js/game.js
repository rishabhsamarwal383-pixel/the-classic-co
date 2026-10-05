/**
 * =============================================================================
 * THE CLASSIC CO. - SUNSET DRIVE: UDAIPUR CONTINUOUS JOURNEY EDITION
 * =============================================================================
 * - Continuous, seamless 2940px panorama through Udaipur's famous landmarks:
 *   [1] Lake Pichola & Gangaur Ghat
 *   [2] Fateh Sagar Lake & Rani Road
 *   [3] Jag Mandir Island Palace & City Palace
 * - Prominent "THE CLASSIC CO." roadside hoardings passing regularly
 * - Vintage White Hindustan Ambassador car (scaled for large cinematic viewport)
 * - Anti-glare Polarized Sunglasses collectibles + UV400 shield
 * - Milestone discounts: 50 pts -> 10% OFF (CLASSIC10), 100 pts -> 15% OFF (CLASSIC15)
 * =============================================================================
 */

(function () {
  'use strict';

  // --- AUDIO SYNTHESIS VIA WEB AUDIO API ---
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
        osc.frequency.setValueAtTime(190, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.15);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'collect') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(880, now + 0.16);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.26);
      } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.22);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.26);
      } else if (type === 'win') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.connect(g);
          g.connect(audioCtx.destination);
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, now + idx * 0.1);
          g.gain.setValueAtTime(0.2, now + idx * 0.1);
          g.gain.linearRampToValueAtTime(0.01, now + idx * 0.1 + 0.25);
          o.start(now + idx * 0.1);
          o.stop(now + idx * 0.1 + 0.26);
        });
      }
    } catch (e) {}
  }

  // --- ASSETS LOADING ---
  const assets = {
    car: { src: 'images/ambassador_car.png', img: null, loaded: false },
    bg: { src: 'images/udaipur_seamless_journey.jpg', img: null, loaded: false },
    hoarding1: { src: 'images/classic_hoarding_1.png', img: null, loaded: false },
    hoarding2: { src: 'images/classic_hoarding_2.png', img: null, loaded: false },
    hoarding3: { src: 'images/classic_hoarding_3.png', img: null, loaded: false },
    hoarding4: { src: 'images/classic_hoarding_4.png', img: null, loaded: false },
    lamp: { src: 'images/udaipur_streetlamp.png', img: null, loaded: false },
    chhatri: { src: 'images/udaipur_chhatri.png', img: null, loaded: false }
  };

  function preloadAssets() {
    for (let key in assets) {
      const a = assets[key];
      const img = new Image();
      img.src = a.src;
      img.onload = () => { a.loaded = true; a.img = img; };
      a.img = img;
    }
  }
  preloadAssets();

  // --- GAME STATE ---
  let canvas, ctx;
  let animFrameId = null;
  let gameState = 'START'; // 'START', 'PLAYING', 'GAMEOVER'
  let score = 0;
  let highScore = parseInt(localStorage.getItem('classic_high_score') || '0', 10);
  let speed = 5.0;
  let gameTime = 0;
  let bgScrollX = 0;
  let isPolarizedShieldActive = false;
  let polarizedShieldTimer = 0;

  // Indian Ambassador Car (Scaled up for cinematic viewport)
  const car = {
    x: 70,
    y: 0,
    width: 108,
    height: 44,
    baseY: 0,
    vy: 0,
    gravity: 0.72,
    jumpPower: -12.4,
    isGrounded: true,
    rotation: 0,
    suspensionBob: 0
  };

  // World Elements
  let hoardingsList = [];
  let obstacles = [];
  let pickups = [];
  let particles = [];
  let nextObstacleTimer = 90;
  let nextPickupTimer = 180;
  let nextHoardingTimer = 40; // Spawn first hoarding quickly!

  // --- CANVAS RESIZE ---
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

    // Road is at bottom 64px
    car.baseY = canvas.logicalHeight - 74;
    if (car.isGrounded) car.y = car.baseY;
  }

  // --- SPAWNING ---
  function spawnHoarding() {
    const hoardingKeys = ['hoarding1', 'hoarding2', 'hoarding3', 'hoarding4'];
    const key = hoardingKeys[Math.floor(Math.random() * hoardingKeys.length)];

    // Prominent, large roadside billboard standing on the lake promenade
    hoardingsList.push({
      x: canvas.logicalWidth + 30,
      y: car.baseY - 76,
      width: 142,
      height: 88,
      key: key
    });
  }

  function spawnObstacle() {
    const types = ['sun_glare', 'glare_barrier', 'heat_mirage'];
    const type = types[Math.floor(Math.random() * types.length)];
    obstacles.push({
      x: canvas.logicalWidth + 20,
      y: car.baseY - (type === 'sun_glare' ? 38 : 16),
      width: type === 'sun_glare' ? 38 : 28,
      height: type === 'sun_glare' ? 38 : 42,
      type: type,
      pulse: 0
    });
  }

  function spawnPickup() {
    // Floating The Classic Co. Polarized Sunglasses
    pickups.push({
      x: canvas.logicalWidth + 40,
      y: car.baseY - 55 - Math.random() * 40,
      width: 48,
      height: 24,
      floatOffset: 0
    });
  }

  function createDustParticle(x, y) {
    particles.push({
      x: x,
      y: y,
      vx: -(speed * 0.45 + Math.random() * 2),
      vy: (Math.random() - 0.5) * 1.6,
      radius: Math.random() * 4 + 2,
      alpha: 0.7,
      color: '#e7e5e4'
    });
  }

  function createConfetti() {
    const colors = ['#b45309', '#059669', '#3b82f6', '#f59e0b', '#ec4899'];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: canvas.logicalWidth / 2,
        y: canvas.logicalHeight / 2 - 30,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.85) * 11,
        radius: Math.random() * 5 + 3,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 0.22
      });
    }
  }

  // Current landmark indicator
  function getCurrentLandmark() {
    if (!assets.bg.loaded || !assets.bg.img) return 'Udaipur Lakeside Drive';
    const img = assets.bg.img;
    const bgAspect = img.width / img.height;
    const bgDrawH = canvas.logicalHeight - 55;
    const bgDrawW = bgDrawH * bgAspect;

    const normX = ((-bgScrollX) % bgDrawW) / bgDrawW;
    if (normX < 0.33) {
      return '📍 Lake Pichola & Gangaur Ghat';
    } else if (normX < 0.66) {
      return '📍 Fateh Sagar Lake & Rani Road';
    } else {
      return '📍 Jag Mandir Island & City Palace';
    }
  }

  // --- DRAWING PIPELINE ---
  function drawParallaxUdaipur() {
    const w = canvas.logicalWidth;
    const h = canvas.logicalHeight;

    if (assets.bg.loaded && assets.bg.img) {
      const img = assets.bg.img;
      const bgAspect = img.width / img.height;
      const bgDrawH = h - 55;
      const bgDrawW = bgDrawH * bgAspect;

      // Continuous infinite scroll without cuts
      bgScrollX = (bgScrollX - speed * 0.32) % bgDrawW;
      let startX = bgScrollX;
      while (startX < w) {
        ctx.drawImage(img, startX, 0, bgDrawW, bgDrawH);
        startX += bgDrawW;
      }
    } else {
      // Warm golden hour gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h - 60);
      skyGrad.addColorStop(0, '#ea580c');
      skyGrad.addColorStop(0.5, '#f59e0b');
      skyGrad.addColorStop(1, '#fde68a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // Polarized Shield Tint Overlay (Cool anti-glare crystal clarity)
    if (isPolarizedShieldActive) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.42)';
      ctx.fillRect(0, 0, w, h);
    }
  }

  function drawPromenadeAndRoad() {
    const w = canvas.logicalWidth;
    const h = canvas.logicalHeight;
    const roadY = h - 60;

    // Heritage lakeside promenade stone railing (Gangaur / Rani Road railing)
    ctx.fillStyle = '#f5f5f4';
    ctx.fillRect(0, roadY - 14, w, 14);
    // Railing balusters / posts
    ctx.fillStyle = '#a8a29e';
    for (let x = -((gameTime * speed) % 28); x < w; x += 28) {
      ctx.fillRect(x, roadY - 20, 5, 20);
    }
    // Top marble handrail
    ctx.fillStyle = '#78716c';
    ctx.fillRect(0, roadY - 20, w, 4);

    // Clean dark road tarmac
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, roadY, w, 60);

    // Warm curb stripe
    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, roadY, w, 4);

    // Road dashed white centerlines
    ctx.fillStyle = '#ffffff';
    const dashW = 34;
    const gapW = 28;
    const cycle = dashW + gapW;
    const offset = (gameTime * speed * 1.8) % cycle;
    for (let x = -offset; x < w; x += cycle) {
      ctx.fillRect(x, roadY + 26, dashW, 3.5);
    }
  }

  function drawRoadsideHoardings() {
    for (let p of hoardingsList) {
      const a = assets[p.key];
      if (a && a.loaded && a.img) {
        ctx.drawImage(a.img, p.x, p.y, p.width, p.height);
      } else {
        // Fallback Vector The Classic Co. Hoarding
        ctx.fillStyle = '#44403c';
        ctx.fillRect(p.x + 10, p.y + 30, 8, p.height - 30);
        ctx.fillRect(p.x + p.width - 18, p.y + 30, 8, p.height - 30);
        ctx.fillStyle = '#161514';
        ctx.fillRect(p.x, p.y, p.width, 50);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.width, 50);
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('THE CLASSIC CO.', p.x + 12, p.y + 22);
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px sans-serif';
        ctx.fillText('UV400 POLARIZED', p.x + 12, p.y + 38);
      }
    }
  }

  function drawAmbassadorCar(x, y) {
    ctx.save();
    ctx.translate(x + car.width / 2, y + car.height / 2);
    ctx.rotate(car.rotation);

    if (assets.car.loaded && assets.car.img) {
      // Draw Vintage White Indian Ambassador Car
      ctx.drawImage(assets.car.img, -car.width / 2, -car.height / 2 + car.suspensionBob, car.width, car.height);
    } else {
      // High-precision vector fallback
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(-car.width / 2, -car.height / 2 + 10, car.width, car.height - 16, 10);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.stroke();

      [-car.width / 2 + 22, car.width / 2 - 22].forEach(wx => {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(wx, car.height / 2 - 6, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(wx, car.height / 2 - 6, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Glowing Sunset Headlight Beam forward
    const beamGrad = ctx.createLinearGradient(car.width / 2, 0, car.width / 2 + 90, 0);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.6)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(car.width / 2 - 4, -4);
    ctx.lineTo(car.width / 2 + 90, -14);
    ctx.lineTo(car.width / 2 + 90, 20);
    ctx.lineTo(car.width / 2 - 4, 10);
    ctx.closePath();
    ctx.fill();

    // Polarized Shield Aura
    if (isPolarizedShieldActive) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, car.suspensionBob, car.width * 0.65, car.height * 0.78, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawObstacle(obs) {
    ctx.save();
    obs.pulse = (obs.pulse + 0.12) % (Math.PI * 2);

    if (obs.type === 'sun_glare') {
      // Blinding High-Beam Sun Glare Orb
      const grad = ctx.createRadialGradient(obs.x + obs.width / 2, obs.y + obs.height / 2, 4, obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, '#f59e0b');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Road hazard / glare barrier
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(obs.x + obs.width / 2, obs.y);
      ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
      ctx.lineTo(obs.x, obs.y + obs.height);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(obs.x + obs.width / 2, obs.y + 14, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSunglassesPickup(p) {
    ctx.save();
    p.floatOffset = Math.sin(gameTime * 0.12) * 5;
    const y = p.y + p.floatOffset;

    // Glowing aura
    const aura = ctx.createRadialGradient(p.x + p.width / 2, y + p.height / 2, 4, p.x + p.width / 2, y + p.height / 2, 28);
    aura.addColorStop(0, 'rgba(56, 189, 248, 0.75)');
    aura.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(p.x + p.width / 2, y + p.height / 2, 28, 0, Math.PI * 2);
    ctx.fill();

    // Gold Aviator Frames & Polarized Dark Lenses
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;

    // Left & Right Lenses
    ctx.beginPath();
    ctx.roundRect(p.x + 2, y + 2, 19, 15, [4, 4, 8, 8]);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(p.x + 25, y + 2, 19, 15, [4, 4, 8, 8]);
    ctx.fill();
    ctx.stroke();

    // Double bridge
    ctx.beginPath();
    ctx.moveTo(p.x + 21, y + 6);
    ctx.lineTo(p.x + 25, y + 6);
    ctx.moveTo(p.x + 4, y + 2);
    ctx.lineTo(p.x + 42, y + 2);
    ctx.stroke();

    // Polarized sheen
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(p.x + 6, y + 13);
    ctx.lineTo(p.x + 13, y + 5);
    ctx.moveTo(p.x + 29, y + 13);
    ctx.lineTo(p.x + 36, y + 5);
    ctx.stroke();

    ctx.restore();
  }

  function drawHUD() {
    const w = canvas.logicalWidth;

    // Score Pill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(14, 12, 130, 36, 18);
    ctx.fill();
    ctx.strokeStyle = '#e7e5e4';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#161514';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('SCORE: ' + Math.floor(score), 28, 35);

    // Current Location Journey Badge (Top Center)
    const landmarkText = getCurrentLandmark();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const landmarkWidth = ctx.measureText(landmarkText).width;
    ctx.beginPath();
    ctx.roundRect(w / 2 - landmarkWidth / 2 - 14, 12, landmarkWidth + 28, 36, 18);
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#92400e';
    ctx.fillText(landmarkText, w / 2 - landmarkWidth / 2, 35);

    // Best Score Badge (Top Right)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(w - 140, 12, 126, 36, 18);
    ctx.fill();
    ctx.strokeStyle = '#e7e5e4';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#78716c';
    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('BEST: ' + highScore, w - 124, 35);

    // Polarized Shield Indicator
    if (isPolarizedShieldActive) {
      const shieldRatio = Math.max(0, polarizedShieldTimer / 240);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(14, 54, 130 * shieldRatio, 5);
      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('🕶️ POLARIZED SHIELD ACTIVE', 14, 74);
    }
  }

  // --- GAME UPDATE LOOP ---
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
      car.suspensionBob = Math.sin(gameTime * 0.35) * 1.5;

      if (gameTime % 4 === 0) {
        createDustParticle(car.x, car.y + car.height - 4);
      }
    } else {
      car.isGrounded = false;
      car.suspensionBob = 0;
      car.rotation = Math.min(Math.max(car.vy * 0.024, -0.28), 0.28);
    }

    // Score & Speed
    score += 0.12;
    speed = 5.0 + Math.min(score * 0.02, 3.5);

    // Shield Timer
    if (isPolarizedShieldActive) {
      polarizedShieldTimer--;
      if (polarizedShieldTimer <= 0) isPolarizedShieldActive = false;
    }

    // Spawn Roadside Hoardings with The Classic Co. name
    nextHoardingTimer--;
    if (nextHoardingTimer <= 0) {
      spawnHoarding();
      // Spawn new hoarding every 140 - 200 frames (every ~3-4 seconds continuously)
      nextHoardingTimer = Math.floor(140 + Math.random() * 60);
    }

    // Update Hoardings
    for (let i = hoardingsList.length - 1; i >= 0; i--) {
      hoardingsList[i].x -= speed;
      if (hoardingsList[i].x + hoardingsList[i].width < -80) {
        hoardingsList.splice(i, 1);
      }
    }

    // Spawn Obstacles
    nextObstacleTimer--;
    if (nextObstacleTimer <= 0) {
      spawnObstacle();
      nextObstacleTimer = Math.floor(75 + Math.random() * 55 - Math.min(score * 0.2, 25));
    }

    // Spawn Pickups
    nextPickupTimer--;
    if (nextPickupTimer <= 0) {
      spawnPickup();
      nextPickupTimer = Math.floor(160 + Math.random() * 110);
    }

    // Check Obstacles Collision
    const carHitbox = {
      x: car.x + 10,
      y: car.y + 6,
      width: car.width - 20,
      height: car.height - 10
    };

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= speed;

      const collides = (
        carHitbox.x < obs.x + obs.width &&
        carHitbox.x + carHitbox.width > obs.x &&
        carHitbox.y < obs.y + obs.height &&
        carHitbox.y + carHitbox.height > obs.y
      );

      if (collides) {
        if (isPolarizedShieldActive) {
          obstacles.splice(i, 1);
          playSound('collect');
          score += 15;
          continue;
        } else {
          gameOver();
          return;
        }
      }

      if (obs.x + obs.width < -50) obstacles.splice(i, 1);
    }

    // Check Sunglasses Pickups
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      p.x -= speed * 0.85;

      const collides = (
        carHitbox.x < p.x + p.width &&
        carHitbox.x + carHitbox.width > p.x &&
        carHitbox.y < p.y + p.height &&
        carHitbox.y + carHitbox.height > p.y
      );

      if (collides) {
        pickups.splice(i, 1);
        playSound('collect');
        score += 25;
        isPolarizedShieldActive = true;
        polarizedShieldTimer = 240; // 4 seconds invulnerability
        continue;
      }

      if (p.x + p.width < -50) pickups.splice(i, 1);
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      if (pt.gravity) pt.vy += pt.gravity;
      pt.alpha -= 0.02;
      if (pt.alpha <= 0) particles.splice(i, 1);
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.logicalWidth, canvas.logicalHeight);

    drawParallaxUdaipur();
    drawRoadsideHoardings();
    drawPromenadeAndRoad();

    // Dust particles
    particles.forEach(pt => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.alpha);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    pickups.forEach(drawSunglassesPickup);
    obstacles.forEach(drawObstacle);

    drawAmbassadorCar(car.x, car.y);

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
    if (gameState === 'START' || gameState === 'GAMEOVER') {
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
    speed = 5.0;
    gameTime = 0;
    obstacles = [];
    pickups = [];
    hoardingsList = [];
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

  // --- REWARD SCREEN ---
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
        <div style="background:#ffffff; border:1.5px solid #bbf7d0; border-radius:14px; padding:22px 18px; color:#161514; margin-bottom:16px; box-shadow:0 10px 25px rgba(22,163,74,0.12);">
          <div style="display:inline-block; background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; font-size:11px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; padding:4px 10px; border-radius:20px; margin-bottom:8px;">
            🎉 REWARD UNLOCKED: ${discountTier.toUpperCase()}
          </div>
          <div style="font-size:24px; font-weight:800; font-family:'Playfair Display', serif; margin-bottom:4px; color:#161514;">
            YOU WON ${discountPct}% OFF!
          </div>
          <p style="font-size:13px; color:#57534e; margin-bottom:14px; line-height:1.5;">
            Score: <strong>${finalScore}</strong> (Personal Best: ${highScore}) · Protect your drive with authentic UV400 polarized shades.
          </p>
          <div style="display:flex; align-items:center; justify-content:center; gap:8px; background:#fafaf9; border:1.5px dashed #cbd5e1; border-radius:8px; padding:10px 14px; margin-bottom:14px;">
            <span style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#78716c;">Voucher Code:</span>
            <strong style="font-size:18px; font-family:monospace; letter-spacing:2px; color:#161514;">${code}</strong>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <button type="button" onclick="window.ClassicGame.copyCode('${code}')" style="background:#f5f5f4; color:#1c1917; border:1px solid #d6d3d1; padding:12px; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer;">
              📋 Copy Code
            </button>
            <button type="button" onclick="window.ClassicGame.applyAndShop('${code}')" style="background:#161514; color:#ffffff; border:none; padding:12px; border-radius:8px; font-weight:800; font-size:13px; cursor:pointer;">
              🛍️ Apply & Shop
            </button>
          </div>
        </div>
      `;
    } else {
      const needed = 50 - finalScore;
      resultHtml = `
        <div style="background:#ffffff; border:1px solid #e7e5e4; border-radius:14px; padding:22px 18px; color:#161514; margin-bottom:16px;">
          <div style="font-size:11px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:#d97706; margin-bottom:4px;">
            🕶️ BLINDED BY SUN GLARE!
          </div>
          <div style="font-size:22px; font-weight:800; font-family:'Playfair Display', serif; margin-bottom:6px; color:#161514;">
            Final Score: ${finalScore}
          </div>
          <p style="font-size:13px; color:#78716c; margin-bottom:12px; line-height:1.5;">
            You were just <strong>${needed} points</strong> away from 10% OFF! Collect polarized sunglasses along the drive for an anti-glare shield.
          </p>
        </div>
      `;
    }

    overlay.innerHTML = `
      <div class="arcade-card-content" style="max-width:390px; width:92%; text-align:center;">
        ${resultHtml}
        <button type="button" onclick="window.ClassicGame.start()" class="btn-hero-explore" style="width:100%; justify-content:center; padding:14px; font-size:14px; font-weight:800; background:#161514; color:#ffffff; border-radius:8px; cursor:pointer; margin-bottom:8px;">
          🔄 Take Another Drive (Jump)
        </button>
        <button type="button" onclick="window.ClassicGame.closeModal()" style="background:none; border:none; color:#78716c; font-size:12.5px; cursor:pointer; padding:6px;">
          Close Experience
        </button>
      </div>
    `;
    overlay.style.display = 'flex';
  }

  function hideOverlay() {
    const overlay = document.getElementById('arcade-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  // --- PUBLIC API ---
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

      // Start Screen
      const overlay = document.getElementById('arcade-overlay');
      if (overlay) {
        overlay.innerHTML = `
          <div class="arcade-card-content" style="max-width:420px; width:92%; text-align:center; background:#ffffff; border:1px solid #e7e5e4; border-radius:18px; padding:24px 22px; box-shadow:0 15px 35px rgba(0,0,0,0.12);">
            <div style="display:inline-block; background:#fffbeb; color:#b45309; border:1px solid #fef3c7; font-size:10.5px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; padding:3px 10px; border-radius:20px; margin-bottom:8px;">
              THE CLASSIC CO. · UDAIPUR DRIVE
            </div>
            <h2 style="font-size:22px; font-weight:800; font-family:'Playfair Display', serif; color:#161514; margin:0 0 8px;">
              Sunset Drive: Dodge The Glare 🕶️
            </h2>
            <p style="font-size:13px; color:#78716c; line-height:1.5; margin-bottom:16px;">
              Cruise past <strong>Lake Pichola</strong>, <strong>Fateh Sagar</strong> &amp; <strong>Jag Mandir</strong> in our vintage Ambassador. Tap/Space to jump over road glare, collect polarized lenses, and win discount vouchers!
            </p>
            <div style="display:flex; justify-content:space-around; background:#fafaf9; border:1px solid #e7e5e4; border-radius:10px; padding:10px; margin-bottom:18px; font-size:12px;">
              <div><strong style="color:#d97706; font-size:14px;">50 pts</strong><br><span style="color:#78716c; font-weight:600;">10% OFF</span></div>
              <div style="border-left:1px solid #e7e5e4;"></div>
              <div><strong style="color:#059669; font-size:14px;">100 pts</strong><br><span style="color:#78716c; font-weight:600;">15% OFF</span></div>
            </div>
            <button type="button" onclick="window.ClassicGame.start()" style="width:100%; display:flex; align-items:center; justify-content:center; gap:8px; padding:14px; font-size:14px; font-weight:800; background:#161514; color:#ffffff; border:none; border-radius:8px; cursor:pointer;">
              <span>Start Scenic Drive</span>
              <span>→</span>
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
      try {
        sessionStorage.setItem('classic_discount_code', code);
      } catch (e) {}

      window.ClassicGame.closeModal();

      const catalogEl = document.getElementById('collection');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }

      const toast = document.createElement('div');
      toast.style.cssText = 'position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#065f46; color:#ffffff; padding:14px 22px; border-radius:30px; font-size:13px; font-weight:700; z-index:999999; box-shadow:0 10px 25px rgba(0,0,0,0.25); border:1px solid #34d399; display:flex; align-items:center; gap:8px;';
      toast.innerHTML = `<span>🎉</span> <span>Voucher ${code} applied! Shop any polarized sunglasses now.</span>`;
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

  document.addEventListener('DOMContentLoaded', function () {
    const canvasEl = document.getElementById('classic-arcade-canvas');
    if (canvasEl) {
      canvasEl.addEventListener('touchstart', function (e) {
        e.preventDefault();
        jump();
      }, { passive: false });

      canvasEl.addEventListener('mousedown', function () {
        jump();
      });
    }
  });

})();
