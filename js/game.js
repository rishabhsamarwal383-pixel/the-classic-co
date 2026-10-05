/**
 * =============================================================================
 * THE CLASSIC CO. - SUNSET DRIVE: UDAIPUR HERITAGE EDITION (Interactive Web Game)
 * =============================================================================
 * Luxury D2C interactive experience matching The Classic Co. brand aesthetic.
 * Features:
 * - Iconic Vintage Indian Hindustan Ambassador car (transparent sprite)
 * - Udaipur Lake Pichola, City Palace & Ghats panorama scrolling in background
 * - The Classic Co. roadside billboards passing continuously
 * - Heritage Udaipur streetlamps and chhatris along the scenic promenade
 * - Polarized sunglasses collectible with temporary anti-glare shield
 * - Reward Tiers: 50 pts -> 10% OFF (CLASSIC10), 100 pts -> 15% OFF (CLASSIC15)
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
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.14);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'collect') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(880, now + 0.16);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.26);
      } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);
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

  // --- ASSET PRELOADER ---
  const assets = {
    car: { src: 'images/ambassador_car.png', img: null, loaded: false },
    bg: { src: 'images/udaipur_sunset_bg.jpg', img: null, loaded: false },
    billboard: { src: 'images/classic_billboard.png', img: null, loaded: false },
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
  let speed = 4.8;
  let gameTime = 0;
  let bgScrollX = 0;
  let isPolarizedShieldActive = false;
  let polarizedShieldTimer = 0;

  // Indian Ambassador Car physics
  const car = {
    x: 55,
    y: 0,
    width: 86,
    height: 38,
    baseY: 0,
    vy: 0,
    gravity: 0.65,
    jumpPower: -11.2,
    isGrounded: true,
    rotation: 0,
    suspensionBob: 0
  };

  // World Elements
  let roadsideProps = [];
  let obstacles = [];
  let pickups = [];
  let particles = [];
  let nextObstacleTimer = 85;
  let nextPickupTimer = 175;
  let nextPropTimer = 50;

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

    car.baseY = canvas.logicalHeight - 56;
    if (car.isGrounded) car.y = car.baseY;
  }

  // --- SPAWNING ---
  function spawnRoadsideProp() {
    // Alternate between The Classic Co. billboards, heritage chhatris, and streetlamps
    const types = ['billboard', 'chhatri', 'lamp', 'billboard'];
    const type = types[Math.floor(Math.random() * types.length)];
    let width = 75, height = 48;
    if (type === 'billboard') { width = 90; height = 55; }
    else if (type === 'chhatri') { width = 50; height = 80; }
    else if (type === 'lamp') { width = 30; height = 70; }

    roadsideProps.push({
      x: canvas.logicalWidth + 30,
      y: car.baseY - height + 10,
      width: width,
      height: height,
      type: type
    });
  }

  function spawnObstacle() {
    const types = ['glare_cone', 'sun_flare', 'road_bump'];
    const type = types[Math.floor(Math.random() * types.length)];
    obstacles.push({
      x: canvas.logicalWidth + 20,
      y: car.baseY - (type === 'sun_flare' ? 32 : 14),
      width: type === 'sun_flare' ? 34 : 26,
      height: type === 'sun_flare' ? 34 : 36,
      type: type,
      pulse: 0
    });
  }

  function spawnPickup() {
    // Floating Polarized Sunglasses
    pickups.push({
      x: canvas.logicalWidth + 40,
      y: car.baseY - 48 - Math.random() * 32,
      width: 44,
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
      radius: Math.random() * 3.5 + 1.5,
      alpha: 0.65,
      color: '#e7e5e4'
    });
  }

  function createConfetti() {
    const colors = ['#b45309', '#059669', '#3b82f6', '#f59e0b', '#ec4899'];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: canvas.logicalWidth / 2,
        y: canvas.logicalHeight / 2 - 30,
        vx: (Math.random() - 0.5) * 11,
        vy: (Math.random() - 0.85) * 10,
        radius: Math.random() * 5 + 3,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 0.22
      });
    }
  }

  // --- DRAWING PIPELINE ---
  function drawParallaxUdaipur() {
    const w = canvas.logicalWidth;
    const h = canvas.logicalHeight;

    if (assets.bg.loaded && assets.bg.img) {
      // Seamless scrolling panorama of Udaipur Palaces & Ghats
      const img = assets.bg.img;
      const bgAspect = img.width / img.height;
      const bgDrawH = h - 42;
      const bgDrawW = bgDrawH * bgAspect;

      bgScrollX = (bgScrollX - speed * 0.35) % bgDrawW;
      let startX = bgScrollX;
      while (startX < w) {
        ctx.drawImage(img, startX, 0, bgDrawW, bgDrawH);
        startX += bgDrawW;
      }
    } else {
      // Elegant warm sunset gradient fallback
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h - 50);
      skyGrad.addColorStop(0, '#f97316');
      skyGrad.addColorStop(0.5, '#fbbf24');
      skyGrad.addColorStop(1, '#fed7aa');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // Polarized Shield Tint Overlay (Cool crystal view when shield is on)
    if (isPolarizedShieldActive) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(0, 0, w, h);
    }
  }

  function drawPromenadeAndRoad() {
    const w = canvas.logicalWidth;
    const h = canvas.logicalHeight;
    const roadY = h - 46;

    // Stone Ghat railing along the lake promenade
    ctx.fillStyle = '#e7e5e4';
    ctx.fillRect(0, roadY - 10, w, 10);
    // Railing posts
    ctx.fillStyle = '#a8a29e';
    for (let x = -((gameTime * speed) % 24); x < w; x += 24) {
      ctx.fillRect(x, roadY - 14, 4, 14);
    }
    // Top handrail
    ctx.fillStyle = '#78716c';
    ctx.fillRect(0, roadY - 14, w, 3);

    // Smooth Road Tarmac
    ctx.fillStyle = '#292524';
    ctx.fillRect(0, roadY, w, 46);

    // Warm curb stripe
    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, roadY, w, 3);

    // Road dashed center line
    ctx.fillStyle = '#ffffff';
    const dashW = 28;
    const gapW = 24;
    const cycle = dashW + gapW;
    const offset = (gameTime * speed * 1.8) % cycle;
    for (let x = -offset; x < w; x += cycle) {
      ctx.fillRect(x, roadY + 20, dashW, 2.5);
    }
  }

  function drawRoadsideProps() {
    for (let p of roadsideProps) {
      if (p.type === 'billboard' && assets.billboard.loaded && assets.billboard.img) {
        ctx.drawImage(assets.billboard.img, p.x, p.y, p.width, p.height);
      } else if (p.type === 'chhatri' && assets.chhatri.loaded && assets.chhatri.img) {
        ctx.drawImage(assets.chhatri.img, p.x, p.y, p.width, p.height);
      } else if (p.type === 'lamp' && assets.lamp.loaded && assets.lamp.img) {
        ctx.drawImage(assets.lamp.img, p.x, p.y, p.width, p.height);
      } else if (p.type === 'billboard') {
        // Fallback Vector The Classic Co. Billboard
        ctx.fillStyle = '#443a30';
        ctx.fillRect(p.x + 8, p.y + 20, 6, p.height - 20);
        ctx.fillRect(p.x + p.width - 14, p.y + 20, 6, p.height - 20);
        ctx.fillStyle = '#161514';
        ctx.fillRect(p.x, p.y, p.width, 36);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x, p.y, p.width, 36);
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('THE CLASSIC CO.', p.x + 8, p.y + 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = '7px sans-serif';
        ctx.fillText('POLARIZED EYEWEAR', p.x + 8, p.y + 28);
      }
    }
  }

  function drawAmbassadorCar(x, y) {
    ctx.save();
    ctx.translate(x + car.width / 2, y + car.height / 2);
    ctx.rotate(car.rotation);

    if (assets.car.loaded && assets.car.img) {
      // Draw Authentic Vintage Indian Ambassador Car
      ctx.drawImage(assets.car.img, -car.width / 2, -car.height / 2 + car.suspensionBob, car.width, car.height);
    } else {
      // High-precision vector Ambassador fallback
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(-car.width / 2, -car.height / 2 + 8, car.width, car.height - 14, 8);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Chrome wheel hubs
      [-car.width / 2 + 18, car.width / 2 - 18].forEach(wx => {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(wx, car.height / 2 - 6, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(wx, car.height / 2 - 6, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Glowing Headlight Beam at sunset
    const beamGrad = ctx.createLinearGradient(car.width / 2, 0, car.width / 2 + 75, 0);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(car.width / 2 - 4, -4);
    ctx.lineTo(car.width / 2 + 75, -12);
    ctx.lineTo(car.width / 2 + 75, 16);
    ctx.lineTo(car.width / 2 - 4, 8);
    ctx.closePath();
    ctx.fill();

    // Polarized Shield Aura
    if (isPolarizedShieldActive) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, car.suspensionBob, car.width * 0.62, car.height * 0.72, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawObstacle(obs) {
    ctx.save();
    obs.pulse = (obs.pulse + 0.12) % (Math.PI * 2);

    if (obs.type === 'sun_flare') {
      // Blinding Road Glare Orb
      const grad = ctx.createRadialGradient(obs.x + obs.width / 2, obs.y + obs.height / 2, 4, obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, '#f59e0b');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Road hazard / glare triangle
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(obs.x + obs.width / 2, obs.y);
      ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
      ctx.lineTo(obs.x, obs.y + obs.height);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(obs.x + obs.width / 2, obs.y + 12, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSunglassesPickup(p) {
    ctx.save();
    p.floatOffset = Math.sin(gameTime * 0.12) * 4;
    const y = p.y + p.floatOffset;

    // Glowing protective aura
    const aura = ctx.createRadialGradient(p.x + p.width / 2, y + p.height / 2, 4, p.x + p.width / 2, y + p.height / 2, 26);
    aura.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
    aura.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(p.x + p.width / 2, y + p.height / 2, 26, 0, Math.PI * 2);
    ctx.fill();

    // Gold Aviator Frames & Polarized Dark Lenses
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;

    // Left & Right Lenses
    ctx.beginPath();
    ctx.roundRect(p.x + 2, y + 2, 17, 14, [4, 4, 8, 8]);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(p.x + 23, y + 2, 17, 14, [4, 4, 8, 8]);
    ctx.fill();
    ctx.stroke();

    // Double bridge
    ctx.beginPath();
    ctx.moveTo(p.x + 19, y + 6);
    ctx.lineTo(p.x + 23, y + 6);
    ctx.moveTo(p.x + 4, y + 2);
    ctx.lineTo(p.x + 38, y + 2);
    ctx.stroke();

    // Polarized Sheen reflection
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p.x + 6, y + 12);
    ctx.lineTo(p.x + 12, y + 5);
    ctx.moveTo(p.x + 27, y + 12);
    ctx.lineTo(p.x + 33, y + 5);
    ctx.stroke();

    ctx.restore();
  }

  function drawHUD() {
    const w = canvas.logicalWidth;

    // Score Card (Editorial Minimalist Luxury Style)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.beginPath();
    ctx.roundRect(14, 12, 126, 34, 17);
    ctx.fill();
    ctx.strokeStyle = '#e7e5e4';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#161514';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('SCORE: ' + Math.floor(score), 26, 34);

    // High Score Badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.beginPath();
    ctx.roundRect(w - 138, 12, 124, 34, 17);
    ctx.fill();
    ctx.strokeStyle = '#e7e5e4';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#78716c';
    ctx.font = '600 12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('BEST: ' + highScore, w - 122, 34);

    // Target Milestone Pill
    let tierText = 'Target: 50 pts → 10% OFF';
    let tierColor = '#b45309';
    if (score >= 100) {
      tierText = '🎉 15% OFF UNLOCKED!';
      tierColor = '#059669';
    } else if (score >= 50) {
      tierText = '✓ 10% OFF! Next: 100 → 15%';
      tierColor = '#059669';
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const textWidth = ctx.measureText(tierText).width;
    ctx.beginPath();
    ctx.roundRect(w / 2 - textWidth / 2 - 12, 12, textWidth + 24, 34, 17);
    ctx.fill();
    ctx.strokeStyle = tierColor;
    ctx.stroke();

    ctx.fillStyle = tierColor;
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(tierText, w / 2 - textWidth / 2, 34);

    // Polarized Shield Indicator
    if (isPolarizedShieldActive) {
      const shieldRatio = Math.max(0, polarizedShieldTimer / 240);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(14, 52, 126 * shieldRatio, 5);
      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 10.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('🕶️ POLARIZED SHIELD ON', 14, 70);
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
      // Gentle vintage car suspension bob while driving on road
      car.suspensionBob = Math.sin(gameTime * 0.35) * 1.5;

      if (gameTime % 4 === 0) {
        createDustParticle(car.x, car.y + car.height - 4);
      }
    } else {
      car.isGrounded = false;
      car.suspensionBob = 0;
      car.rotation = Math.min(Math.max(car.vy * 0.025, -0.3), 0.3);
    }

    // Score & Speed
    score += 0.12;
    speed = 4.8 + Math.min(score * 0.022, 3.8);

    // Shield Timer
    if (isPolarizedShieldActive) {
      polarizedShieldTimer--;
      if (polarizedShieldTimer <= 0) isPolarizedShieldActive = false;
    }

    // Spawn Roadside Props (The Classic Co. billboards, chhatris, lamps)
    nextPropTimer--;
    if (nextPropTimer <= 0) {
      spawnRoadsideProp();
      nextPropTimer = Math.floor(90 + Math.random() * 80);
    }

    // Update Roadside Props
    for (let i = roadsideProps.length - 1; i >= 0; i--) {
      roadsideProps[i].x -= speed;
      if (roadsideProps[i].x + roadsideProps[i].width < -60) {
        roadsideProps.splice(i, 1);
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
      x: car.x + 8,
      y: car.y + 6,
      width: car.width - 16,
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
          // Polarized lenses destroy road glare!
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
    drawRoadsideProps();
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
    speed = 4.8;
    gameTime = 0;
    obstacles = [];
    pickups = [];
    roadsideProps = [];
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

  // --- REWARD SCREEN (MATCHING WEBSITE'S LUXURY EDITORIAL STYLE) ---
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

      // Start Screen matching the Website's Editorial Luxury Vibe
      const overlay = document.getElementById('arcade-overlay');
      if (overlay) {
        overlay.innerHTML = `
          <div class="arcade-card-content" style="max-width:390px; width:92%; text-align:center; background:#ffffff; border:1px solid #e7e5e4; border-radius:18px; padding:24px 20px; box-shadow:0 15px 35px rgba(0,0,0,0.12);">
            <div style="display:inline-block; background:#fffbeb; color:#b45309; border:1px solid #fef3c7; font-size:10.5px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; padding:3px 10px; border-radius:20px; margin-bottom:8px;">
              THE CLASSIC CO. · UDAIPUR DRIVE
            </div>
            <h2 style="font-size:22px; font-weight:800; font-family:'Playfair Display', serif; color:#161514; margin:0 0 8px;">
              Sunset Drive: Dodge The Glare 🕶️
            </h2>
            <p style="font-size:13px; color:#78716c; line-height:1.5; margin-bottom:16px;">
              Cruise along Lake Pichola in our vintage Ambassador. Tap/Space to jump over road glare, collect polarized lenses, and unlock exclusive discounts!
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
