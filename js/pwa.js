// PWA & SERVICE WORKER REGISTRATION (WITH SAFE MOBILE NOTIFICATIONS)
    // =========================================================================
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
          console.log('[PWA] Service Worker registered:', reg.scope);
          window.swRegistration = reg;
        }).catch(err => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
      });
    }

    // PWA Install Prompt Capture & Modal Control
    let pwaInstallPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      pwaInstallPrompt = e;

      const drawerLi = document.getElementById("drawer-install-li");
      if (drawerLi) drawerLi.style.display = "block";

      // Gentle auto-popup ask for app install after 8 seconds on first visit
      const pwaPostponed = localStorage.getItem('classic_pwa_postponed');
      const pwaInstalled = localStorage.getItem('classic_pwa_installed');
      if (!pwaPostponed && !pwaInstalled) {
        setTimeout(() => {
          const isCheckoutOpen = document.getElementById("checkout-modal") && document.getElementById("checkout-modal").style.display === "flex";
          const isProdOpen = document.getElementById("product-detail-modal") && document.getElementById("product-detail-modal").style.display === "flex";
          if (!isCheckoutOpen && !isProdOpen) {
            openPwaModal();
          }
        }, 8000);
      }
    });

    window.addEventListener('appinstalled', () => {
      localStorage.setItem('classic_pwa_installed', 'true');
      console.log('[PWA] App successfully installed');
      const btn = document.getElementById("btn-header-install");
      if (btn) btn.style.display = "none";
    });

    function openPwaModal() {
      const modal = document.getElementById("pwa-install-modal");
      if (modal) modal.style.display = "flex";
      document.body.style.overflow = "hidden";

      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const iosHint = document.getElementById("ios-install-hint");
      const androidGuide = document.getElementById("android-install-guide");
      const installBtn = document.getElementById("btn-modal-install-action");

      if (androidGuide) androidGuide.style.display = "none";

      if (isIos && !window.navigator.standalone) {
        if (iosHint) iosHint.style.display = "block";
        if (installBtn) {
          installBtn.innerText = "✓ Close Instructions";
          installBtn.onclick = closePwaModal;
        }
      } else {
        if (iosHint) iosHint.style.display = "none";
        if (installBtn) {
          installBtn.innerText = "📲 Install App Now";
          installBtn.onclick = executePwaInstall;
        }
      }
    }

    function closePwaModal() {
      const modal = document.getElementById("pwa-install-modal");
      if (modal) modal.style.display = "none";
      document.body.style.overflow = "";
    }

    function handlePwaModalBackdrop(e) {
      if (e.target.id === "pwa-install-modal") {
        closePwaModal();
      }
    }

    function postponePwaInstall() {
      closePwaModal();
      localStorage.setItem('classic_pwa_postponed', Date.now());
    }

    function executePwaInstall() {
      if (pwaInstallPrompt) {
        closePwaModal();
        pwaInstallPrompt.prompt();
        pwaInstallPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            localStorage.setItem('classic_pwa_installed', 'true');
            const btn = document.getElementById("btn-header-install");
            if (btn) btn.style.display = "none";
          }
          pwaInstallPrompt = null;
        });
      } else {
        // Show in-modal guidance without any alert()
        const androidGuide = document.getElementById("android-install-guide");
        if (androidGuide) {
          androidGuide.style.display = "block";
        }
        const installBtn = document.getElementById("btn-modal-install-action");
        if (installBtn) {
          installBtn.innerText = "✓ Got It, I'll Tap Menu";
          installBtn.onclick = closePwaModal;
        }
      }
    }

    // =========================================================================
    // INTERNAL NOTIFICATION PRE-PERMISSION MODAL (SOFT-ASK BEFORE BROWSER NATIVE)
    // =========================================================================
    function openNotificationModal() {
      const modal = document.getElementById("notif-pre-permission-modal");
      if (modal) modal.style.display = "flex";
      document.body.style.overflow = "hidden";
    }

    function closeNotifModal() {
      const modal = document.getElementById("notif-pre-permission-modal");
      if (modal) modal.style.display = "none";
      document.body.style.overflow = "";
    }

    function handleNotifModalBackdrop(e) {
      if (e.target.id === "notif-pre-permission-modal") {
        closeNotifModal();
      }
    }

    function postponeNotificationPermission() {
      closeNotifModal();
      localStorage.setItem('classic_notif_postponed', Date.now());
    }

    async function requestBrowserNotificationPermission() {
      closeNotifModal();
      if (!('Notification' in window)) {
        alert("Push notifications are not supported on this browser.");
        return;
      }

      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          localStorage.setItem('classic_notifications_active', 'true');
          updateNotificationBadgeUI(true);

          if ('serviceWorker' in navigator) {
            try {
              const reg = await navigator.serviceWorker.ready;
              await reg.showNotification('The Classic Co. 🕶️', {
                body: 'Delivery & dispatch updates are now active for your orders!',
                icon: './icon-192.png',
                badge: './icon.svg',
                vibrate: [200, 100, 200]
              });
            } catch (swErr) {
              console.warn("SW notification note:", swErr);
            }
          }
          alert("✓ Live Delivery Alerts Activated! You will receive dispatch and tracking updates.");
        } else if (permission === 'denied') {
          localStorage.setItem('classic_notifications_active', 'denied');
          updateNotificationBadgeUI(false);
          alert("Notifications are blocked in your browser settings. To receive delivery updates, please enable notifications for this site in your browser settings.");
        }
      } catch (err) {
        console.error("Notification permission error:", err);
        alert("Notification request: " + err.message);
      }
    }

    function updateNotificationBadgeUI(isActive) {
      const dot = document.getElementById("notif-header-dot");
      const drawerStatus = document.getElementById("drawer-notif-status");
      if (dot) {
        dot.style.background = isActive ? "#16a34a" : "#eab308";
        dot.style.animation = isActive ? "none" : "pulseDot 2s infinite";
      }
      if (drawerStatus) {
        drawerStatus.innerText = isActive ? "✓ Active" : "Enable";
        drawerStatus.style.color = isActive ? "#16a34a" : "#64748b";
      }
    }

    // Check existing notification state on load
    window.addEventListener('DOMContentLoaded', () => {
      const active = localStorage.getItem('classic_notifications_active') === 'true' || (window.Notification && Notification.permission === 'granted');
      updateNotificationBadgeUI(active);
    });

    // Gentle auto-prompt for notifications after 18 seconds (if install ask was handled or skipped)
    setTimeout(() => {
      const status = localStorage.getItem('classic_notifications_active');
      const postponed = localStorage.getItem('classic_notif_postponed');
      if (!status && !postponed) {
        const checkoutModal = document.getElementById("checkout-modal");
        const prodModal = document.getElementById("product-detail-modal");
        const pwaModal = document.getElementById("pwa-install-modal");
        const isCheckoutOpen = checkoutModal && checkoutModal.style.display === "flex";
        const isProdOpen = prodModal && prodModal.style.display === "flex";
        const isPwaOpen = pwaModal && pwaModal.style.display === "flex";
        if (!isCheckoutOpen && !isProdOpen && !isPwaOpen) {
          openNotificationModal();
        }
      }
    }, 18000);