/**
 * THE CLASSIC CO. - ADMIN OPERATIONS DASHBOARD (PWA)
 * Modularized Architecture - Standalone Admin Script
 * Single Source of Truth: Uses window.PRODUCTS from /js/products-data.js
 */

(function(window) {
  'use strict';

  // -------------------------------------------------------------------------
  // CONSTANTS & STATE
  // -------------------------------------------------------------------------
  var STORAGE_KEY_CONFIG = 'classic_co_admin_config';
  var STORAGE_KEY_SOUND = 'classic_co_sound_enabled';
  var STORAGE_KEY_ORDERS = 'classic_co_cached_orders';
  var STORAGE_KEY_TOKEN = 'classic_co_github_token';

  var STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Payment pending verification'];

  var currentProducts = [];
  var currentSettings = {};
  var currentPromises = {};
  var soundAlertsEnabled = localStorage.getItem(STORAGE_KEY_SOUND) !== 'false';
  var knownOrderIds = new Set();
  var deferredInstallPrompt = null;

  // Category Divide & Sort State - matching main store
  var adminCurrentCategory = 'ALL';
  var adminCurrentSort = 'default';

  // -------------------------------------------------------------------------
  // AUDIO & PWA SETUP
  // -------------------------------------------------------------------------
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredInstallPrompt = e;
    var btn = document.getElementById('btn-install-pwa');
    if (btn) btn.style.display = 'inline-flex';
  });

  function installPWA() {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then(function(choice) {
        if (choice && choice.outcome === 'accepted') {
          alert('🎉 App installed successfully! You can now launch "The Classic Co." directly from your home screen.');
        }
        deferredInstallPrompt = null;
        var btn = document.getElementById('btn-install-pwa');
        if (btn) btn.style.display = 'none';
      });
    } else {
      var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        alert("📲 To install on iPhone/iPad:\n\n1. Tap the Share button (square with arrow pointing up at the bottom of Safari)\n2. Scroll down and tap 'Add to Home Screen'\n3. Tap 'Add' in the top-right corner!\n\nThe app will appear on your home screen with the Instagram DP icon.");
      } else {
        alert("📲 To install on Android / Desktop:\n\n1. Tap Chrome's menu (⋮ 3 dots in the top-right corner)\n2. Tap 'Install app' or 'Add to Home screen'\n3. Tap 'Install'!\n\nThe app will be added to your home screen with the Instagram DP icon.");
      }
    }
  }

  function playChaChingFallback() {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      var ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      var osc1 = ctx.createOscillator();
      var osc2 = ctx.createOscillator();
      var gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(1760, ctx.currentTime);
      osc2.frequency.setValueAtTime(2637, ctx.currentTime);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.85);
      osc2.stop(ctx.currentTime + 0.85);
    } catch(e) {}
  }

  function playChaChingSound() {
    if (!soundAlertsEnabled) return;
    var audio = document.getElementById('audio-chaching');
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(function() {
        playChaChingFallback();
      });
    } else {
      playChaChingFallback();
    }
    if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
  }

  function testChaChingSound() {
    playChaChingSound();
    if (window.confetti) {
      try { confetti({ particleCount: 50, spread: 70, origin: { y: 0.8 } }); } catch(e) {}
    }
    showToast({
      orderId: 'CC-TEST-' + Math.floor(1000 + Math.random() * 9000),
      title: 'Royal Gilt Aviators',
      amount: '899',
      name: 'Rishabh Samarwal',
      phone: '8619661325'
    });
  }

  function toggleSoundAlerts() {
    soundAlertsEnabled = !soundAlertsEnabled;
    localStorage.setItem(STORAGE_KEY_SOUND, soundAlertsEnabled);
    if (soundAlertsEnabled) {
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then(function(perm) {
          if (perm === 'granted') {
            try {
              new Notification('🔔 Notifications Active!', {
                body: 'Shopify Cha-Ching alerts enabled for all new orders.',
                icon: '/icon-192.png'
              });
            } catch (e) {}
          }
        });
      }
      playChaChingSound();
    }
    updateSoundUI();
  }

  function enablePushNotifications() {
    if (!('Notification' in window)) {
      alert('Push Notifications are not supported in this browser.');
      return;
    }
    Notification.requestPermission().then(function(perm) {
      if (perm === 'granted') {
        soundAlertsEnabled = true;
        localStorage.setItem(STORAGE_KEY_SOUND, 'true');
        updateSoundUI();
        playChaChingSound();
        try {
          new Notification('💰 Order Notifications Active!', {
            body: 'You will receive instant Shopify Cha-Ching alerts whenever an order is placed.',
            icon: '/icon-192.png'
          });
        } catch (e) {}
        alert('✓ Push Notifications & Cha-Ching Sound enabled successfully!');
      } else if (perm === 'denied') {
        alert('Notification permission was blocked in browser settings. Please allow notifications in site settings to receive order alerts.');
      }
    });
  }
  window.enablePushNotifications = enablePushNotifications;

  function updateSoundUI() {
    var btn = document.getElementById('btn-toggle-sound');
    var icon = document.getElementById('sound-icon');
    var text = document.getElementById('sound-text');
    var btnM = document.getElementById('btn-toggle-sound-m');
    var iconM = document.getElementById('sound-icon-m');
    var textM = document.getElementById('sound-text-m');

    if (soundAlertsEnabled) {
      if (btn) { btn.className = 'btn btn-secondary btn-sm btn-sound-on btn-desktop-only'; if (icon) icon.innerText = '🔔'; if (text) text.innerText = 'Alerts: ON'; }
      if (btnM) { btnM.className = 'btn btn-secondary btn-sm btn-sound-on'; if (iconM) iconM.innerText = '🔔'; if (textM) textM.innerText = 'Alerts: ON'; }
    } else {
      if (btn) { btn.className = 'btn btn-secondary btn-sm btn-desktop-only'; if (icon) icon.innerText = '🔕'; if (text) text.innerText = 'Alerts: OFF'; }
      if (btnM) { btnM.className = 'btn btn-secondary btn-sm'; if (iconM) iconM.innerText = '🔕'; if (textM) textM.innerText = 'Alerts: OFF'; }
    }
  }

  function showToast(order) {
    var toast = document.getElementById('sale-toast');
    if (!toast) return;
    var tTitle = document.getElementById('toast-title');
    var tBody = document.getElementById('toast-body');
    if (tTitle) tTitle.innerText = '💰 Cha-Ching! ₹' + order.amount + ' Sale!';
    if (tBody) tBody.innerText = '#' + order.orderId + ' · ' + order.name + ' (' + order.title + ')';
    var waBtn = document.getElementById('toast-wa-btn');
    if (waBtn) waBtn.onclick = function() { window.open(waCustomerUrl(order), '_blank'); };
    toast.style.display = 'block';
  }

  // -------------------------------------------------------------------------
  // INITIALIZATION & UNIFIED DATA STORAGE
  // -------------------------------------------------------------------------
  function loadStoredConfig() {
    try {
      var custom = JSON.parse(localStorage.getItem(STORAGE_KEY_CONFIG) || '{}');

      // 1. Guaranteed Product Recovery: Uses window.PRODUCTS from /js/products-data.js
      if (Array.isArray(custom.products) && custom.products.length > 0) {
        currentProducts = custom.products;
      } else if (Array.isArray(window.PRODUCTS) && window.PRODUCTS.length > 0) {
        currentProducts = JSON.parse(JSON.stringify(window.PRODUCTS));
      } else {
        currentProducts = [];
      }

      window.PRODUCTS = currentProducts;

      // 2. Settings
      currentSettings = Object.assign({
        priceStandard: (window.PRICE_STANDARD || 899),
        priceUpi: (window.PRICE_UPI || 799),
        pincodePrefix: (window.LOCAL_PINCODE_PREFIX || '313'),
        waNumber: (window.WA_NUMBER || '918619661325'),
        merchantUpi: (window.MERCHANT_UPI || '8619661325@upi'),
        gasUrl: (window.GOOGLE_APPS_SCRIPT_URL || ''),
        metaPixelId: (window.META_PIXEL_ID || ''),
        ga4Id: (window.GA4_ID || '')
      }, custom.settings || {});

      // 3. Promises
      currentPromises = Object.assign({
        announcement: 'UV400 polarized · Hard case & cloth included · 7-day exchange',
        heroTitle: 'Polarized sunglasses,<br><span class="hero-title-accent">delivered to your door.</span>',
        heroSubtitle: 'UV400 polarized lenses. Cash on delivery in Udaipur, 7-day exchange guarantee. Hard case + cloth included.',
        deliveryStrip: '<span><strong>Udaipur:</strong> 1-day delivery + COD</span><span class="delivery-strip-sep">|</span><span><strong>Rest of India:</strong> prepaid UPI</span>',
        founder: 'Run by a local founder in Udaipur. Questions? WhatsApp us.'
      }, custom.promises || {});

    } catch (e) {
      if (Array.isArray(window.PRODUCTS)) {
        currentProducts = JSON.parse(JSON.stringify(window.PRODUCTS));
      }
    }
  }

  function saveStoredConfig() {
    var data = {
      products: currentProducts,
      settings: currentSettings,
      promises: currentPromises,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(data));
    window.PRODUCTS = currentProducts;

    var badge = document.getElementById('badge-sync-status');
    if (badge) {
      badge.innerText = '● Saved in Browser';
      badge.className = 'badge badge-warning';
    }
  }

  function initUI() {
    loadStoredConfig();
    updateSoundUI();

    // Populate Settings Inputs
    var setMap = {
      'cfg-wa-number': currentSettings.waNumber,
      'cfg-merchant-upi': currentSettings.merchantUpi,
      'cfg-gas-url': currentSettings.gasUrl,
      'cfg-meta-pixel': currentSettings.metaPixelId,
      'cfg-ga4': currentSettings.ga4Id
    };
    Object.keys(setMap).forEach(function(k) {
      var el = document.getElementById(k);
      if (el) el.value = setMap[k] || '';
    });

    var token = localStorage.getItem(STORAGE_KEY_TOKEN) || '';
    var tokenEl = document.getElementById('cfg-github-token');
    if (tokenEl && token) tokenEl.value = token;

    // Populate Promises Inputs
    var promMap = {
      'copy-announcement': currentPromises.announcement,
      'copy-hero-title': currentPromises.heroTitle,
      'copy-hero-subtitle': currentPromises.heroSubtitle,
      'copy-delivery-strip': currentPromises.deliveryStrip,
      'copy-founder': currentPromises.founder
    };
    Object.keys(promMap).forEach(function(k) {
      var el = document.getElementById(k);
      if (el) el.value = promMap[k] || '';
    });

    // Initial render
    updateCategoryPillCounts();
    renderProductsTable();
    renderOrders();

    // Start background order polling
    setInterval(pollForNewOrders, 6000);
  }

  // -------------------------------------------------------------------------
  // TAB NAVIGATION
  // -------------------------------------------------------------------------
  function switchTab(tabName, btn) {
    document.querySelectorAll('.tab-link').forEach(function(b) { b.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    var target = document.getElementById('tab-' + tabName);
    if (target) target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (tabName === 'products') {
      updateCategoryPillCounts();
      renderProductsTable();
    } else if (tabName === 'orders') {
      renderOrders();
    }
  }

  // -------------------------------------------------------------------------
  // CATEGORY DIVIDE & SORT (MATCHING MAIN STORE)
  // -------------------------------------------------------------------------
  function setAdminCategory(cat) {
    adminCurrentCategory = cat;
    document.querySelectorAll('.admin-pill-tab').forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-cat') === cat);
    });
    renderProductsTable();
  }

  function updateCategoryPillCounts() {
    var totalCount = currentProducts.length;
    var bestsellerCount = currentProducts.filter(function(p) { return p.featured; }).length;
    var polarizedCount = currentProducts.filter(function(p) { return p.category === 'Polarized & Driving'; }).length;
    var magneticCount = currentProducts.filter(function(p) { return p.category === 'Magnetic Clip-Ons'; }).length;
    var premiumCount = currentProducts.filter(function(p) { return p.category === 'Premium Styles'; }).length;
    var classicCount = currentProducts.filter(function(p) { return p.category === 'Classic Lifestyle'; }).length;
    var trendingCount = currentProducts.filter(function(p) { return p.category === 'Trending'; }).length;
    var hiddenCount = currentProducts.filter(function(p) { return Boolean(p.hidden); }).length;

    var countMap = {
      'pill-count-all': totalCount,
      'pill-count-bestsellers': bestsellerCount,
      'pill-count-polarized': polarizedCount,
      'pill-count-magnetic': magneticCount,
      'pill-count-premium': premiumCount,
      'pill-count-classic': classicCount,
      'pill-count-trending': trendingCount,
      'pill-count-hidden': hiddenCount
    };

    Object.keys(countMap).forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.innerText = countMap[id];
    });

    var badgeProdCount = document.getElementById('badge-prod-count');
    if (badgeProdCount) badgeProdCount.innerText = totalCount;
  }

  // -------------------------------------------------------------------------
  // PRODUCTS MANAGEMENT - DESKTOP TABLE & MOBILE NATIVE CARDS
  // -------------------------------------------------------------------------
  function renderProductsTable() {
    var tbody = document.getElementById('products-table-body');
    var mobileContainer = document.getElementById('products-mobile-container');
    var searchEl = document.getElementById('prod-search');
    var sortEl = document.getElementById('prod-sort');
    var visEl = document.getElementById('prod-vis-filter');
    var stockEl = document.getElementById('prod-stock-filter');

    var search = (searchEl ? searchEl.value : '').toLowerCase().trim();
    var sort = (sortEl ? sortEl.value : adminCurrentSort);
    var visFilter = (visEl ? visEl.value : 'ALL');
    var stockFilter = (stockEl ? stockEl.value : 'ALL');

    adminCurrentSort = sort;

    var list = currentProducts.filter(function(p) {
      // 1. Category Divide (just like main store)
      if (adminCurrentCategory === 'BESTSELLER') {
        if (!p.featured) return false;
      } else if (adminCurrentCategory === 'HIDDEN') {
        if (!p.hidden) return false;
      } else if (adminCurrentCategory !== 'ALL') {
        if (p.category !== adminCurrentCategory) return false;
      }

      // 2. Search
      if (search) {
        var titleMatch = (p.title || '').toLowerCase().includes(search);
        var catMatch = (p.category || '').toLowerCase().includes(search);
        var handleMatch = (p.handle || '').toLowerCase().includes(search);
        if (!titleMatch && !catMatch && !handleMatch) return false;
      }

      // 3. Stock
      if (stockFilter === 'IN_STOCK' && p.inStock === false) return false;
      if (stockFilter === 'OUT_OF_STOCK' && p.inStock !== false) return false;

      // 4. Visibility
      if (visFilter === 'LIVE' && p.hidden) return false;
      if (visFilter === 'HIDDEN' && !p.hidden) return false;

      return true;
    });

    // 5. Sort (just like main store)
    if (sort === 'price-asc') {
      list.sort(function(a, b) { return (a.cod_price || 899) - (b.cod_price || 899); });
    } else if (sort === 'price-desc') {
      list.sort(function(a, b) { return (b.cod_price || 899) - (a.cod_price || 899); });
    } else if (sort === 'name-asc') {
      list.sort(function(a, b) { return (a.title || '').localeCompare(b.title || ''); });
    } else if (sort === 'name-desc') {
      list.sort(function(a, b) { return (b.title || '').localeCompare(a.title || ''); });
    } else if (sort === 'bestseller-first') {
      list.sort(function(a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });
    } else if (sort === 'hidden-first') {
      list.sort(function(a, b) { return (b.hidden ? 1 : 0) - (a.hidden ? 1 : 0); });
    } else if (sort === 'stock-out-first') {
      list.sort(function(a, b) { return (a.inStock === false ? 1 : 0) - (b.inStock === false ? 1 : 0); });
    } else {
      // Default: Catalog ID order
      list.sort(function(a, b) { return a.id - b.id; });
    }

    var resultsText = document.getElementById('prod-results-text');
    if (resultsText) {
      resultsText.innerText = 'Showing ' + list.length + ' of ' + currentProducts.length + ' products';
    }

    if (!list.length) {
      var emptyMsg = 'No products found matching your filters. Try selecting another category tab.';
      if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:36px; color:var(--p-text-subdued);">' + emptyMsg + '</td></tr>';
      if (mobileContainer) mobileContainer.innerHTML = '<div style="text-align:center; padding:36px; color:var(--p-text-subdued);">' + emptyMsg + '</div>';
      return;
    }

    // Render Desktop Table
    if (tbody) {
      tbody.innerHTML = list.map(function(p) {
        var isHidden = Boolean(p.hidden);
        var isInStock = p.inStock !== false;
        var isFeatured = Boolean(p.featured);
        var thumb = (p.images && p.images.length) ? p.images[0] : '/icon-192.png';

        return '<tr ' + (isHidden ? 'style="background:#fcfcfd; opacity:0.86;"' : '') + '>' +
          '<td>' +
            '<div class="prod-cell">' +
              '<img src="' + thumb + '" class="prod-thumbnail" alt="' + escapeHTML(p.title) + '" loading="lazy">' +
              '<div>' +
                '<a class="prod-title-link" onclick="openEditProductModal(' + p.id + ')">' + escapeHTML(p.title) + '</a>' +
                (isHidden ? ' <span class="badge badge-warning" style="font-size:10px; padding:1px 5px; margin-left:4px;">HIDDEN</span>' : '') +
                '<div style="font-size:11.5px; color:var(--p-text-subdued); margin-top:2px;">ID: #' + p.id + '</div>' +
              '</div>' +
            '</div>' +
          '</td>' +
          '<td><span class="badge badge-category">' + escapeHTML(p.category) + '</span></td>' +
          '<td><span class="badge ' + (isHidden ? 'badge-subdued' : 'badge-success') + '">' + (isHidden ? '👁️ Hidden' : '● Live') + '</span></td>' +
          '<td><span class="badge ' + (isInStock ? 'badge-success' : 'badge-subdued') + '">' + (isInStock ? 'In stock' : 'Out of stock') + '</span></td>' +
          '<td>' + (isFeatured ? '<span class="badge badge-warning">★ Bestseller</span>' : '<span style="color:var(--p-text-subdued);">-</span>') + '</td>' +
          '<td><div style="font-weight:700;">₹' + p.cod_price + '</div><div style="font-size:11.5px; color:var(--p-text-subdued);">UPI: ₹' + p.upi_price + '</div></td>' +
          '<td>' +
            '<label class="switch-container" title="' + (isHidden ? 'Product is hidden. Click to show on store' : 'Product is visible. Click to hide from store') + '">' +
              '<input type="checkbox" ' + (!isHidden ? 'checked' : '') + ' onchange="toggleProductVisibility(' + p.id + ', !this.checked)">' +
              '<span class="switch-slider"></span>' +
            '</label>' +
          '</td>' +
          '<td>' +
            '<label class="switch-container" title="Toggle stock availability">' +
              '<input type="checkbox" ' + (isInStock ? 'checked' : '') + ' onchange="toggleProductStock(' + p.id + ', this.checked)">' +
              '<span class="switch-slider"></span>' +
            '</label>' +
          '</td>' +
          '<td>' +
            '<label class="switch-container" title="Toggle homepage bestseller status">' +
              '<input type="checkbox" ' + (isFeatured ? 'checked' : '') + ' onchange="toggleProductFeatured(' + p.id + ', this.checked)">' +
              '<span class="switch-slider"></span>' +
            '</label>' +
          '</td>' +
          '<td style="text-align:right;">' +
            '<div style="display:inline-flex; gap:6px;">' +
              '<button class="btn btn-secondary btn-sm" onclick="toggleProductVisibility(' + p.id + ', ' + (!isHidden) + ')" title="' + (isHidden ? 'Show on store' : 'Hide from store') + '">' +
                (isHidden ? '👁️ Show' : '🚫 Hide') +
              '</button>' +
              '<button class="btn btn-secondary btn-sm" onclick="openEditProductModal(' + p.id + ')">✏️ Edit</button>' +
              '<button class="btn btn-danger btn-sm" onclick="quickDeleteProduct(' + p.id + ')">🗑️</button>' +
            '</div>' +
          '</td>' +
        '</tr>';
      }).join('');
    }

    // Render Mobile Cards
    if (mobileContainer) {
      mobileContainer.innerHTML = list.map(function(p) {
        var isHidden = Boolean(p.hidden);
        var isInStock = p.inStock !== false;
        var isFeatured = Boolean(p.featured);
        var thumb = (p.images && p.images.length) ? p.images[0] : '/icon-192.png';

        return '<div class="mobile-prod-card ' + (isHidden ? 'is-hidden' : '') + '">' +
          '<div class="mobile-prod-top">' +
            '<img src="' + thumb + '" class="mobile-prod-thumb" alt="' + escapeHTML(p.title) + '" loading="lazy" onclick="openEditProductModal(' + p.id + ')">' +
            '<div class="mobile-prod-info">' +
              '<div class="mobile-prod-title" onclick="openEditProductModal(' + p.id + ')">' +
                escapeHTML(p.title) +
                (isHidden ? ' <span class="badge badge-warning" style="font-size:10px; padding:1px 5px;">HIDDEN</span>' : '') +
              '</div>' +
              '<div class="mobile-prod-meta">' +
                '<span class="badge badge-category">' + escapeHTML(p.category) + '</span>' +
                '<span class="badge ' + (isHidden ? 'badge-subdued' : 'badge-success') + '">' + (isHidden ? '👁️ Hidden' : '● Live') + '</span>' +
                (isFeatured ? '<span class="badge badge-warning">★ Bestseller</span>' : '') +
              '</div>' +
              '<div class="mobile-prod-price">' +
                '₹' + p.cod_price +
                '<small>UPI: ₹' + p.upi_price + '</small>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="mobile-toggles-strip">' +
            '<div class="mobile-toggle-item">' +
              '<span>' + (isHidden ? 'Hidden' : 'Live') + '</span>' +
              '<label class="switch-container">' +
                '<input type="checkbox" ' + (!isHidden ? 'checked' : '') + ' onchange="toggleProductVisibility(' + p.id + ', !this.checked)">' +
                '<span class="switch-slider"></span>' +
              '</label>' +
            '</div>' +
            '<div class="mobile-toggle-item">' +
              '<span>' + (isInStock ? 'In Stock' : 'Out Stock') + '</span>' +
              '<label class="switch-container">' +
                '<input type="checkbox" ' + (isInStock ? 'checked' : '') + ' onchange="toggleProductStock(' + p.id + ', this.checked)">' +
                '<span class="switch-slider"></span>' +
              '</label>' +
            '</div>' +
            '<div class="mobile-toggle-item">' +
              '<span>Bestseller</span>' +
              '<label class="switch-container">' +
                '<input type="checkbox" ' + (isFeatured ? 'checked' : '') + ' onchange="toggleProductFeatured(' + p.id + ', this.checked)">' +
                '<span class="switch-slider"></span>' +
              '</label>' +
            '</div>' +
          '</div>' +

          '<div class="mobile-actions-row">' +
            '<button class="btn btn-secondary" onclick="toggleProductVisibility(' + p.id + ', ' + (!isHidden) + ')">' +
              (isHidden ? '👁️ Show' : '🚫 Hide') +
            '</button>' +
            '<button class="btn btn-secondary" onclick="openEditProductModal(' + p.id + ')">' +
              '✏️ Edit' +
            '</button>' +
            '<button class="btn btn-danger" style="flex:0 0 44px;" onclick="quickDeleteProduct(' + p.id + ')">' +
              '🗑️' +
            '</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }
  }

  // -------------------------------------------------------------------------
  // QUICK 1-CLICK TOGGLES
  // -------------------------------------------------------------------------
  function toggleProductVisibility(id, isHidden) {
    var p = currentProducts.find(function(x) { return x.id === id; });
    if (p) {
      p.hidden = isHidden;
      saveStoredConfig();
      updateCategoryPillCounts();
      renderProductsTable();
    }
  }

  function toggleProductStock(id, inStock) {
    var p = currentProducts.find(function(x) { return x.id === id; });
    if (p) {
      p.inStock = inStock;
      saveStoredConfig();
      updateCategoryPillCounts();
      renderProductsTable();
    }
  }

  function toggleProductFeatured(id, featured) {
    var p = currentProducts.find(function(x) { return x.id === id; });
    if (p) {
      p.featured = featured;
      saveStoredConfig();
      updateCategoryPillCounts();
      renderProductsTable();
    }
  }

  // -------------------------------------------------------------------------
  // PRODUCT MODAL (ADD & EDIT)
  // -------------------------------------------------------------------------
  function openEditProductModal(id) {
    var p = currentProducts.find(function(x) { return x.id === id; });
    if (!p) return;
    document.getElementById('modal-title').innerText = 'Edit ' + p.title;
    document.getElementById('edit-prod-id').value = p.id;
    document.getElementById('edit-prod-title').value = p.title;
    document.getElementById('edit-prod-handle').value = p.handle || '';
    document.getElementById('edit-prod-category').value = p.category;
    document.getElementById('edit-prod-cod').value = p.cod_price;
    document.getElementById('edit-prod-upi').value = p.upi_price;
    document.getElementById('edit-prod-hidden').checked = Boolean(p.hidden);
    document.getElementById('edit-prod-instock').checked = p.inStock !== false;
    document.getElementById('edit-prod-featured').checked = Boolean(p.featured);
    document.getElementById('edit-prod-images').value = (p.images || []).join('\n');
    document.getElementById('btn-delete-prod').style.display = 'inline-flex';
    updateImagePreviews();
    document.getElementById('product-modal').style.display = 'flex';
  }

  function openAddProductModal() {
    var newId = currentProducts.length ? Math.max.apply(null, currentProducts.map(function(p) { return p.id; })) + 1 : 1;
    document.getElementById('modal-title').innerText = 'Add New Product';
    document.getElementById('edit-prod-id').value = newId;
    document.getElementById('edit-prod-title').value = '';
    document.getElementById('edit-prod-handle').value = '';
    document.getElementById('edit-prod-category').value = 'Premium Styles';
    document.getElementById('edit-prod-cod').value = currentSettings.priceStandard || 899;
    document.getElementById('edit-prod-upi').value = currentSettings.priceUpi || 799;
    document.getElementById('edit-prod-hidden').checked = false;
    document.getElementById('edit-prod-instock').checked = true;
    document.getElementById('edit-prod-featured').checked = false;
    document.getElementById('edit-prod-images').value = 'https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_705dcf3a-0743-4b68-958a-33d07983079e.jpg?v=1775901336';
    document.getElementById('btn-delete-prod').style.display = 'none';
    updateImagePreviews();
    document.getElementById('product-modal').style.display = 'flex';
  }

  function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
  }

  function updateImagePreviews() {
    var val = document.getElementById('edit-prod-images').value;
    var urls = val.split('\n').map(function(s) { return s.trim(); }).filter(Boolean);
    var container = document.getElementById('edit-prod-img-previews');
    if (!container) return;
    container.innerHTML = urls.map(function(u) {
      return '<img src="' + escapeHTML(u) + '" class="img-preview-card" onerror="this.style.display=\'none\'">';
    }).join('');
  }

  function saveProductModal(e) {
    if (e && e.preventDefault) e.preventDefault();
    var id = Number(document.getElementById('edit-prod-id').value);
    var title = document.getElementById('edit-prod-title').value.trim();
    var handle = document.getElementById('edit-prod-handle').value.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    var category = document.getElementById('edit-prod-category').value;
    var cod = Number(document.getElementById('edit-prod-cod').value);
    var upi = Number(document.getElementById('edit-prod-upi').value);
    var isHidden = document.getElementById('edit-prod-hidden').checked;
    var inStock = document.getElementById('edit-prod-instock').checked;
    var featured = document.getElementById('edit-prod-featured').checked;
    var rawImages = document.getElementById('edit-prod-images').value;
    var images = rawImages.split('\n').map(function(s) { return s.trim(); }).filter(Boolean);

    if (!title) {
      alert('Please enter a product title.');
      return;
    }

    var p = currentProducts.find(function(x) { return x.id === id; });
    if (p) {
      p.title = title;
      p.handle = handle;
      p.category = category;
      p.cod_price = cod;
      p.upi_price = upi;
      p.hidden = isHidden;
      p.inStock = inStock;
      p.featured = featured;
      p.images = images.length ? images : p.images;
    } else {
      currentProducts.unshift({
        id: id,
        handle: handle,
        title: title,
        category: category,
        cod_price: cod,
        upi_price: upi,
        hidden: isHidden,
        inStock: inStock,
        featured: featured,
        images: images.length ? images : ['https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_705dcf3a-0743-4b68-958a-33d07983079e.jpg?v=1775901336']
      });
    }

    saveStoredConfig();
    closeProductModal();
    updateCategoryPillCounts();
    renderProductsTable();
  }

  function quickDeleteProduct(id) {
    var p = currentProducts.find(function(x) { return x.id === id; });
    if (!p) return;
    if (confirm('Delete "' + p.title + '" from your catalog?\n\nTip: You can use "Hide" to temporarily hide it.')) {
      currentProducts = currentProducts.filter(function(x) { return x.id !== id; });
      saveStoredConfig();
      updateCategoryPillCounts();
      renderProductsTable();
    }
  }

  function deleteCurrentProduct() {
    var id = Number(document.getElementById('edit-prod-id').value);
    quickDeleteProduct(id);
    closeProductModal();
  }

  // -------------------------------------------------------------------------
  // ORDERS MANAGEMENT
  // -------------------------------------------------------------------------
  var isInitialOrdersLoaded = false;

  function loadOrders() {
    try {
      var a = JSON.parse(localStorage.getItem(STORAGE_KEY_ORDERS) || '[]');
      var b = JSON.parse(localStorage.getItem('the_classic_co_orders') || '[]');
      var map = {};
      if (Array.isArray(b)) b.forEach(function(o) { if (o && o.orderId) map[o.orderId] = o; });
      if (Array.isArray(a)) a.forEach(function(o) { if (o && o.orderId) map[o.orderId] = o; });
      var list = Object.values(map).sort(function(x, y) {
        return new Date(y.createdAt || 0) - new Date(x.createdAt || 0);
      });
      return list;
    } catch (e) { return []; }
  }

  function saveOrders(list) {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(list));
      localStorage.setItem('the_classic_co_orders', JSON.stringify(list));
    } catch (e) {}
  }

  function pollForNewOrders() {
    // 1. Process current local orders
    processOrdersList(loadOrders());

    // 2. Fetch server orders if running on local server
    try {
      fetch('/api/orders', { cache: 'no-store' })
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(serverOrders) {
          if (Array.isArray(serverOrders) && serverOrders.length > 0) {
            var current = loadOrders();
            var map = {};
            current.forEach(function(o) { if (o && o.orderId) map[o.orderId] = o; });
            var added = false;
            serverOrders.forEach(function(so) {
              if (so && so.orderId && !map[so.orderId]) {
                map[so.orderId] = so;
                added = true;
              }
            });
            if (added) {
              var merged = Object.values(map).sort(function(x, y) {
                return new Date(y.createdAt || 0) - new Date(x.createdAt || 0);
              });
              saveOrders(merged);
              processOrdersList(merged);
            }
          }
        })
        .catch(function() {});
    } catch (e) {}
  }

  function processOrdersList(list) {
    var hasNew = false;
    list.forEach(function(o) {
      if (!o || !o.orderId) return;
      if (!knownOrderIds.has(o.orderId)) {
        if (isInitialOrdersLoaded) {
          hasNew = true;
          playChaChingSound();
          showToast(o);
          if (window.confetti) {
            try { confetti({ particleCount: 60, spread: 80, origin: { y: 0.8 } }); } catch(e) {}
          }
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('💰 New Sale Received!', {
                body: 'Order #' + o.orderId + ' - ₹' + o.amount + ' by ' + o.name,
                icon: '/icon-192.png'
              });
            } catch (e) {}
          }
        }
        knownOrderIds.add(o.orderId);
      }
    });
    isInitialOrdersLoaded = true;
    if (hasNew) renderOrders();
  }

  function waCustomerUrl(order) {
    var phone = String(order.phone || '').replace(/\D/g, '');
    var name = order.name || 'Customer';
    var isUpi = order.paymentMode === 'UPI';
    var text = isUpi
      ? 'Hi ' + name + ', we received your payment for order #' + order.orderId + '. Your sunglasses will ship in 2-4 business days. Thank you!'
      : 'Hi ' + name + ', this is The Classic Co. Your order #' + order.orderId + ' is confirmed. We will deliver within 24 hours via Cash on Delivery.';
    return 'https://wa.me/91' + phone + '?text=' + encodeURIComponent(text);
  }

  function renderOrders() {
    var list = loadOrders();
    list.forEach(function(o) { knownOrderIds.add(o.orderId); });

    var revenue = 0;
    var pendingCount = 0;
    var codCount = 0;
    var upiCount = 0;

    list.forEach(function(o) {
      revenue += Number(o.amount || 0);
      if (o.status === 'Pending' || o.status === 'Payment pending verification') pendingCount++;
      if (o.paymentMode === 'UPI') upiCount++; else codCount++;
    });

    var statRev = document.getElementById('stat-total-revenue');
    if (statRev) statRev.innerText = '₹' + revenue.toLocaleString('en-IN');
    var statTot = document.getElementById('stat-total-orders');
    if (statTot) statTot.innerText = list.length;
    var statPend = document.getElementById('stat-pending-orders');
    if (statPend) statPend.innerText = pendingCount;
    var statSplit = document.getElementById('stat-cod-upi-split');
    if (statSplit) statSplit.innerText = codCount + ' COD / ' + upiCount + ' UPI';
    var badgeOrd = document.getElementById('badge-orders-count');
    if (badgeOrd) badgeOrd.innerText = list.length;

    var searchEl = document.getElementById('order-search');
    var statusEl = document.getElementById('order-status-filter');
    var search = (searchEl ? searchEl.value : '').toLowerCase().trim();
    var statusFilter = (statusEl ? statusEl.value : 'ALL');

    var filtered = list.filter(function(o) {
      var matchSearch = !search ||
        (o.orderId && o.orderId.toLowerCase().includes(search)) ||
        (o.name && o.name.toLowerCase().includes(search)) ||
        (o.phone && o.phone.includes(search));
      var matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
      return matchSearch && matchStatus;
    });

    var tbody = document.getElementById('orders-table-body');
    var mobileOrders = document.getElementById('orders-mobile-container');
    if (!filtered.length) {
      var emptyMsg = 'No orders placed yet.';
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:36px; color:var(--p-text-subdued);">' + emptyMsg + '</td></tr>';
      if (mobileOrders) mobileOrders.innerHTML = '<div style="text-align:center; padding:36px; color:var(--p-text-subdued);">' + emptyMsg + '</div>';
      return;
    }

    if (tbody) {
      tbody.innerHTML = filtered.map(function(o) {
        var st = o.status || 'Pending';
        var opts = STATUSES.map(function(s) { return '<option ' + (s === st ? 'selected' : '') + '>' + s + '</option>'; }).join('');
        var isPendingVerif = st === 'Payment pending verification';

        return '<tr>' +
          '<td>' +
            '<strong>#' + o.orderId + '</strong>' +
            '<div style="font-size:11.5px; color:var(--p-text-subdued);">' + (o.createdAt || '').slice(0, 16).replace('T', ' ') + '</div>' +
          '</td>' +
          '<td>' +
            '<div style="font-weight:600;">' + escapeHTML(o.name || 'Customer') + '</div>' +
            '<div style="font-size:11.5px; color:var(--p-text-subdued);">+91 ' + escapeHTML(o.phone) + '</div>' +
            '<div style="font-size:11px; color:var(--p-text-subdued);">' + escapeHTML(o.city || '') + ' · ' + escapeHTML(o.pincode) + '</div>' +
          '</td>' +
          '<td><div style="font-weight:600;">' + escapeHTML(o.title || 'Classic Frame') + '</div></td>' +
          '<td><div style="font-weight:700;">₹' + Number(o.amount).toLocaleString('en-IN') + '</div></td>' +
          '<td>' +
            '<div>' + (o.paymentMode || 'COD') + '</div>' +
            '<span class="badge ' + (isPendingVerif ? 'badge-warning' : 'badge-success') + '">' + (o.paymentStatus || st) + '</span>' +
          '</td>' +
          '<td>' +
            '<select class="filter-select" onchange="updateOrderStatus(\'' + o.orderId + '\', this.value)" style="height:32px; font-size:12px;">' +
              opts +
            '</select>' +
          '</td>' +
          '<td style="text-align:right;">' +
            '<a class="btn btn-secondary btn-sm" target="_blank" rel="noopener" href="' + waCustomerUrl(o) + '">' +
              'WhatsApp ↗' +
            '</a>' +
          '</td>' +
        '</tr>';
      }).join('');
    }

    if (mobileOrders) {
      mobileOrders.innerHTML = filtered.map(function(o) {
        var st = o.status || 'Pending';
        var opts = STATUSES.map(function(s) { return '<option ' + (s === st ? 'selected' : '') + '>' + s + '</option>'; }).join('');
        var isPendingVerif = st === 'Payment pending verification';

        return '<div class="mobile-order-card">' +
          '<div style="display:flex; justify-content:space-between; align-items:center;">' +
            '<strong>#' + o.orderId + '</strong>' +
            '<span class="badge ' + (isPendingVerif ? 'badge-warning' : 'badge-success') + '">' + (o.paymentStatus || st) + '</span>' +
          '</div>' +
          '<div style="font-size:12px; color:var(--p-text-subdued);">' +
            (o.createdAt || '').slice(0, 16).replace('T', ' ') + ' · ' + (o.paymentMode || 'COD') +
          '</div>' +
          '<div style="font-weight:600; margin-top:4px;">' +
            escapeHTML(o.name || 'Customer') + ' (+91 ' + escapeHTML(o.phone) + ')' +
          '</div>' +
          '<div style="font-size:12px; color:var(--p-text-subdued);">' +
            escapeHTML(o.city || '') + ' · ' + escapeHTML(o.pincode) +
          '</div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; padding-top:6px; border-top:1px solid #f1f2f4;">' +
            '<div>' + escapeHTML(o.title || 'Classic Frame') + '</div>' +
            '<strong>₹' + Number(o.amount).toLocaleString('en-IN') + '</strong>' +
          '</div>' +
          '<div style="margin-top:10px;">' +
            '<select class="filter-select" onchange="updateOrderStatus(\'' + o.orderId + '\', this.value)" style="width:100%; height:38px;">' +
              opts +
            '</select>' +
          '</div>' +
          '<div style="margin-top:8px;">' +
            '<a class="btn btn-primary" style="width:100%; justify-content:center;" target="_blank" rel="noopener" href="' + waCustomerUrl(o) + '">' +
              '💬 Message Customer on WhatsApp' +
            '</a>' +
          '</div>' +
        '</div>';
      }).join('');
    }
  }

  function updateOrderStatus(orderId, newStatus) {
    var list = loadOrders();
    var o = list.find(function(x) { return x.orderId === orderId; });
    if (o) {
      o.status = newStatus;
      saveOrders(list);
      renderOrders();
    }
  }

  // -------------------------------------------------------------------------
  // STORE PROMISES & SETTINGS
  // -------------------------------------------------------------------------
  function saveStorePromises() {
    currentPromises.announcement = document.getElementById('copy-announcement').value;
    currentPromises.heroTitle = document.getElementById('copy-hero-title').value;
    currentPromises.heroSubtitle = document.getElementById('copy-hero-subtitle').value;
    currentPromises.deliveryStrip = document.getElementById('copy-delivery-strip').value;
    currentPromises.founder = document.getElementById('copy-founder').value;

    saveStoredConfig();
    alert('Store Promises saved in browser!\n\nTap "Publish Live" in the top bar to update live visitors.');
  }

  function saveGeneralSettings() {
    currentSettings.waNumber = document.getElementById('cfg-wa-number').value.trim();
    currentSettings.merchantUpi = document.getElementById('cfg-merchant-upi').value.trim();
    currentSettings.gasUrl = document.getElementById('cfg-gas-url').value.trim();
    currentSettings.metaPixelId = document.getElementById('cfg-meta-pixel').value.trim();
    currentSettings.ga4Id = document.getElementById('cfg-ga4').value.trim();

    var token = document.getElementById('cfg-github-token').value.trim();
    if (token) localStorage.setItem(STORAGE_KEY_TOKEN, token);

    saveStoredConfig();
    alert('Settings saved in browser!\n\nTap "Publish Live" to apply changes.');
  }

  // -------------------------------------------------------------------------
  // PUBLISH LIVE TO GITHUB & VERCEL
  // -------------------------------------------------------------------------
  function publishToLiveSite() {
    var token = (document.getElementById('cfg-github-token') ? document.getElementById('cfg-github-token').value.trim() : '') ||
      localStorage.getItem(STORAGE_KEY_TOKEN) || '';

    var btn = document.getElementById('btn-publish-live');
    if (btn) {
      btn.innerText = 'Publishing...';
      btn.disabled = true;
    }

    var jsContent = '// Single Source of Truth for The Classic Co.\n' +
      'var GOOGLE_APPS_SCRIPT_URL = window.GOOGLE_APPS_SCRIPT_URL = ' + JSON.stringify(currentSettings.gasUrl || '') + ';\n' +
      'var LOCAL_PINCODE_PREFIX = window.LOCAL_PINCODE_PREFIX = ' + JSON.stringify(currentSettings.pincodePrefix || '313') + ';\n' +
      'var MERCHANT_UPI = window.MERCHANT_UPI = ' + JSON.stringify(currentSettings.merchantUpi || '8619661325@upi') + ';\n' +
      'var WA_NUMBER = window.WA_NUMBER = ' + JSON.stringify(currentSettings.waNumber || '918619661325') + ';\n' +
      'var META_PIXEL_ID = window.META_PIXEL_ID = ' + JSON.stringify(currentSettings.metaPixelId || '') + ';\n' +
      'var GA4_ID = window.GA4_ID = ' + JSON.stringify(currentSettings.ga4Id || '') + ';\n' +
      'var PRICE_STANDARD = window.PRICE_STANDARD = ' + (currentSettings.priceStandard || 899) + ';\n' +
      'var PRICE_UPI = window.PRICE_UPI = ' + (currentSettings.priceUpi || 799) + ';\n\n' +
      'const PRODUCTS = ' + JSON.stringify(currentProducts, null, 2) + ';\n\n' +
      'if (typeof module !== "undefined" && module.exports) {\n' +
      '  module.exports = { PRODUCTS };\n' +
      '}\n' +
      'if (typeof window !== "undefined") {\n' +
      '  window.PRODUCTS = PRODUCTS;\n' +
      '}\n';

    fetch('/admin?action=publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filePath: 'js/products-data.js',
        content: jsContent,
        message: '🚀 Admin Publish Live: Updated products & settings',
        token: token
      })
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (btn) {
          btn.innerText = 'Publish Live';
          btn.disabled = false;
        }
        if (data.success) {
          alert('🚀 LIVE DEPLOYMENT TRIGGERED!\n\n' + data.message);
          var badge = document.getElementById('badge-sync-status');
          if (badge) {
            badge.innerText = '● Live Published';
            badge.className = 'badge badge-success';
          }
        } else {
          alert('Deployment failed: ' + (data.error || 'Unknown error'));
        }
      })
      .catch(function(err) {
        if (btn) {
          btn.innerText = 'Publish Live';
          btn.disabled = false;
        }
        alert('Error connecting to deployment API: ' + err.message);
      });
  }

  function resetAllToDefaults() {
    if (!confirm('Are you sure you want to reset all products and promises to defaults?')) return;
    localStorage.removeItem(STORAGE_KEY_CONFIG);
    location.reload();
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // -------------------------------------------------------------------------
  // GLOBAL EXPORTS
  // -------------------------------------------------------------------------
  window.switchTab = switchTab;
  window.setAdminCategory = setAdminCategory;
  window.renderProductsTable = renderProductsTable;
  window.toggleProductVisibility = toggleProductVisibility;
  window.toggleProductStock = toggleProductStock;
  window.toggleProductFeatured = toggleProductFeatured;
  window.openEditProductModal = openEditProductModal;
  window.openAddProductModal = openAddProductModal;
  window.openProductModal = function(id) { if (id) openEditProductModal(id); else openAddProductModal(); };
  window.closeProductModal = closeProductModal;
  window.saveProductModal = saveProductModal;
  window.updateImagePreviews = updateImagePreviews;
  window.quickDeleteProduct = quickDeleteProduct;
  window.deleteCurrentProduct = deleteCurrentProduct;
  window.saveStorePromises = saveStorePromises;
  window.saveGeneralSettings = saveGeneralSettings;
  window.publishToLiveSite = publishToLiveSite;
  window.resetAllToDefaults = resetAllToDefaults;
  window.testChaChingSound = testChaChingSound;
  window.toggleSoundAlerts = toggleSoundAlerts;
  window.installPWA = installPWA;
  window.renderOrders = renderOrders;
  window.updateOrderStatus = updateOrderStatus;
  // Real-time Cross-Tab & PWA Order Listener
  try {
    if (window.BroadcastChannel) {
      var bc = new BroadcastChannel('classic_co_orders_channel');
      bc.onmessage = function(ev) {
        if (ev && ev.data && ev.data.action === 'NEW_ORDER') {
          pollForNewOrders();
        }
      };
    }
  } catch (e) {}

  window.addEventListener('storage', function(e) {
    if (e && (e.key === STORAGE_KEY_ORDERS || e.key === 'the_classic_co_orders')) {
      pollForNewOrders();
    }
  });

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }

})(window);
