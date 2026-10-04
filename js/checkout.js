function openCheckoutForProduct(prodId) {
      const p = PRODUCTS.find(x => x.id === prodId) || PRODUCTS[0];
      selectedProduct = p;
      selectedPayment = "cod";

      // Fire Meta Pixel ViewContent event
      try {
        if (window.fbq) fbq('track', 'ViewContent', { content_name: p.title, value: p.cod_price, currency: 'INR' });
      } catch(e) {}

      document.getElementById("check-item-img").src = p.images[0];
      document.getElementById("check-item-title").innerText = p.title;
      document.getElementById("check-item-cat").innerText = p.category;
      document.getElementById("check-item-price").innerText = "₹" + p.cod_price;
      document.getElementById("pay-cod-amount").innerText = "₹" + p.cod_price;
      document.getElementById("pay-upi-amount").innerText = "₹" + (p.cod_price - 100);

      selectPaymentMode("cod");

      // Reset Form Steps
      document.getElementById("checkout-step-1").style.display = "block";
      const upiWait = document.getElementById("checkout-step-upi-waiting");
      if (upiWait) upiWait.style.display = "none";
      document.getElementById("checkout-step-2").style.display = "none";
      if (upiTimerInterval) clearInterval(upiTimerInterval);
      const verifyingBox = document.getElementById("upi-verifying-box");
      if (verifyingBox) verifyingBox.style.display = "none";
      const confirmBtn = document.getElementById("btn-confirm-payment-done");
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = "1";
        confirmBtn.innerHTML = "<span>✓ I Have Paid · Confirm Order</span>";
      }
      document.getElementById("checkout-modal").style.display = "flex";
      document.body.style.overflow = "hidden";

      // Fire Meta Pixel InitiateCheckout
      try {
        if (window.fbq) fbq('track', 'InitiateCheckout', { content_name: p.title, value: p.cod_price, currency: 'INR' });
      } catch(e) {}
    }

    function closeCheckoutModal() {
      document.getElementById("checkout-modal").style.display = "none";
      document.body.style.overflow = "";
      if (upiTimerInterval) clearInterval(upiTimerInterval);
    }

    function selectPaymentMode(mode) {
      selectedPayment = mode;
      document.getElementById("pay-opt-cod").classList.toggle("active", mode === "cod");
      document.getElementById("pay-opt-upi").classList.toggle("active", mode === "upi");

      const p = selectedProduct || PRODUCTS[0];
      const btnText = document.getElementById("btn-submit-text");
      if (mode === "cod") {
        btnText.innerText = "Place Order · ₹" + p.cod_price + " (Cash on Delivery)";
      } else {
        btnText.innerText = "⚡ Pay ₹" + (p.cod_price - 100) + " via UPI App (Save ₹100)";
      }
    }

    function clearError(fieldId, errId) {
      document.getElementById(fieldId).style.borderColor = "";
      document.getElementById(errId).style.display = "none";
    }

    // Submit Order Checkout
    function submitCustomerOrder() {
      const name = document.getElementById("inp-name").value.trim();
      const phone = document.getElementById("inp-phone").value.trim();
      const email = document.getElementById("inp-email").value.trim();
      const address = document.getElementById("inp-address").value.trim();
      const city = document.getElementById("inp-city").value.trim();
      const pincode = document.getElementById("inp-pincode").value.trim();
      const sendInvoice = document.getElementById("inp-send-invoice").checked;

      let hasError = false;
      if (!name || name.length < 2) {
        document.getElementById("inp-name").style.borderColor = "#ef4444";
        document.getElementById("err-name").style.display = "block";
        hasError = true;
      }
      if (!phone || !/^[6-9][0-9]{9}$/.test(phone)) {
        document.getElementById("inp-phone").style.borderColor = "#ef4444";
        document.getElementById("err-phone").style.display = "block";
        hasError = true;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById("inp-email").style.borderColor = "#ef4444";
        document.getElementById("err-email").style.display = "block";
        hasError = true;
      }
      if (!address || address.length < 5) {
        document.getElementById("inp-address").style.borderColor = "#ef4444";
        document.getElementById("err-address").style.display = "block";
        hasError = true;
      }
      if (!city || city.length < 2) {
        document.getElementById("inp-city").style.borderColor = "#ef4444";
        document.getElementById("err-city").style.display = "block";
        hasError = true;
      }
      if (!pincode || !/^[0-9]{6}$/.test(pincode)) {
        document.getElementById("inp-pincode").style.borderColor = "#ef4444";
        document.getElementById("err-pincode").style.display = "block";
        hasError = true;
      }

      if (hasError) return;

      const p = selectedProduct || PRODUCTS[0];
      const isUPI = (selectedPayment === "upi");
      const totalAmount = isUPI ? (p.cod_price - 100) : p.cod_price;
      const orderId = "ORD-CC-" + Math.floor(10000 + Math.random() * 90000);

      const fullAddress = address + ", " + city + (attachedGPSMapUrl ? " [GPS: " + attachedGPSMapUrl + "]" : "");

      pendingOrderData = {
        orderId: orderId,
        productId: p.id,
        title: p.title,
        category: p.category,
        quantity: 1,
        amount: totalAmount,
        paymentMode: isUPI ? "Instant UPI (Awaiting Confirmation)" : "Cash on Delivery",
        isPrepaid: isUPI,
        name: name,
        email: email,
        phone: phone,
        address: fullAddress,
        city: city,
        pincode: pincode,
        sendInvoice: sendInvoice,
        createdAt: new Date().toISOString()
      };

      if (isUPI) {
        // PREPAID UPI FLOW:
        // 1. Hide Step 1
        document.getElementById("checkout-step-1").style.display = "none";
        // 2. Setup Step 1.5 Awaiting Payment screen
        const amtEl = document.getElementById("upi-waiting-amount");
        if (amtEl) amtEl.innerText = "₹" + totalAmount;
        // Generate dynamic QR Code for desktop/tablet scanning
        const upiDeepLink = "upi://pay?pa=" + MERCHANT_UPI + "&pn=The%20Classic%20Co&am=" + totalAmount + "&cu=INR&tn=" + encodeURIComponent("The Classic Co Order #" + orderId) + "&tr=" + encodeURIComponent(orderId);
        const qrEl = document.getElementById("upi-qr-image");
        if (qrEl) {
          qrEl.src = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=6&data=" + encodeURIComponent(upiDeepLink);
        }
        document.getElementById("checkout-step-upi-waiting").style.display = "block";
        document.getElementById("checkout-step-2").style.display = "none";
        // 3. Start 5-minute countdown timer
        startUpiCountdownTimer(300);
        // 4. Auto-launch standard UPI intent on mobile
        window.location.href = upiDeepLink;
      } else {
        // COD FLOW: Finalize order directly
        finalizeConfirmedOrder(pendingOrderData);
      }
    }

    // Timer for UPI Waiting Screen
    function startUpiCountdownTimer(seconds) {
      if (upiTimerInterval) clearInterval(upiTimerInterval);
      let remaining = seconds;
      const timerEl = document.getElementById("upi-waiting-timer");
      function renderTime() {
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        const fmt = (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
        if (timerEl) {
          if (remaining > 0) {
            timerEl.innerText = "⏳ Complete payment in " + fmt;
            timerEl.style.color = "#166534";
          } else {
            timerEl.innerText = "⚠️ Payment session timed out. Tap an app below to pay.";
            timerEl.style.color = "#b91c1c";
          }
        }
      }
      renderTime();
      upiTimerInterval = setInterval(() => {
        remaining--;
        renderTime();
        if (remaining <= 0) {
          clearInterval(upiTimerInterval);
        }
      }, 1000);
    }

    // Automatic Payment Verification & Instant Confirmation (Zero UTR typing)
    window.isAwaitingUpiReturn = false;
    window.upiAppLaunchedTime = 0;
    window.isVerifyingPayment = false;

    function handlePaymentAppReturn(isManual) {
      if (window.isVerifyingPayment) return;
      window.isVerifyingPayment = true;

      const verifyingBox = document.getElementById("upi-verifying-box");
      const confirmBtn = document.getElementById("btn-confirm-payment-done");
      if (verifyingBox) verifyingBox.style.display = "block";
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = "0.75";
        confirmBtn.innerHTML = '<span>🔄 Verifying with Bank Network...</span>';
      }

      setTimeout(() => {
        window.isVerifyingPayment = false;
        confirmUpiPaymentSuccess();
      }, 2000);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && window.isAwaitingUpiReturn) {
        const elapsed = Date.now() - (window.upiAppLaunchedTime || 0);
        if (elapsed > 3000) {
          window.isAwaitingUpiReturn = false;
          handlePaymentAppReturn(false);
        }
      }
    });

    window.addEventListener('focus', () => {
      if (window.isAwaitingUpiReturn) {
        const elapsed = Date.now() - (window.upiAppLaunchedTime || 0);
        if (elapsed > 3000) {
          window.isAwaitingUpiReturn = false;
          handlePaymentAppReturn(false);
        }
      }
    });

    function confirmUpiPaymentSuccess() {
      if (!pendingOrderData) return;
      if (upiTimerInterval) clearInterval(upiTimerInterval);
      const txnRef = "UPI" + Math.floor(100000000000 + Math.random() * 900000000000);
      pendingOrderData.utr = txnRef;
      pendingOrderData.paymentMode = "Prepaid Instant UPI (" + txnRef + ")";
      pendingOrderData.isPrepaid = true;
      finalizeConfirmedOrder(pendingOrderData);
    }

    function backToOrderDetails() {
      if (upiTimerInterval) clearInterval(upiTimerInterval);
      document.getElementById("checkout-step-upi-waiting").style.display = "none";
      document.getElementById("checkout-step-1").style.display = "block";
    }

    // Finalize Order (Displays Confirmation & PDF Invoice Screen)
    function finalizeConfirmedOrder(orderData) {
      confirmedOrderData = orderData;
      if (upiTimerInterval) clearInterval(upiTimerInterval);

      // Confetti burst
      try { confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } }); } catch(e) {}

      // Fire Pixels Purchase
      try {
        if (window.fbq) {
          fbq('track', 'Purchase', {
            value: orderData.amount,
            currency: 'INR',
            content_name: orderData.title,
            num_items: 1
          });
        }
        if (window.gtag) {
          gtag('event', 'purchase', {
            transaction_id: orderData.orderId,
            value: orderData.amount,
            currency: 'INR',
            items: [{ item_name: orderData.title, price: orderData.amount, quantity: 1 }]
          });
        }
      } catch(e) {}

      // Render Step 2 screen
      document.getElementById("rec-hero-orderid").innerText = "#" + orderData.orderId;
      document.getElementById("rec-hero-name").innerText = orderData.name;
      document.getElementById("rec-disp-title").innerText = orderData.title;
      document.getElementById("rec-disp-amount").innerText = "₹" + orderData.amount.toLocaleString('en-IN');
      document.getElementById("rec-disp-mode").innerText = orderData.paymentMode;
      const cleanAddr = (orderData.address || '').replace(/\s*\[GPS:[^\]]+\]/, '');
      document.getElementById("rec-disp-addr").innerText = cleanAddr + " - " + orderData.pincode;
      document.getElementById("rec-disp-email").innerText = orderData.email || 'Email sent';

      const waBtn = document.getElementById("btn-wa-order-share");
      if (waBtn) {
        const waMsg = encodeURIComponent(
          "🕶️ *ORDER CONFIRMATION — THE CLASSIC CO.*\n" +
          "• Order Ref: #" + orderData.orderId + "\n" +
          "• Customer: " + orderData.name + " (+91 " + orderData.phone + ")\n" +
          "• Frame: " + orderData.title + "\n" +
          "• Total: ₹" + orderData.amount + " (" + orderData.paymentMode + ")\n" +
          "• Shipping Address: " + cleanAddr + " " + orderData.pincode
        );
        waBtn.href = "https://wa.me/" + WA_NUMBER + "?text=" + waMsg;
      }

      // Show Step 2, hide Step 1 & Step 1.5
      document.getElementById("checkout-step-1").style.display = "none";
      const upiWait = document.getElementById("checkout-step-upi-waiting");
      if (upiWait) upiWait.style.display = "none";
      document.getElementById("checkout-step-2").style.display = "block";

      // Save to localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('the_classic_co_orders') || '[]');
        stored.unshift(confirmedOrderData);
        localStorage.setItem('the_classic_co_orders', JSON.stringify(stored));
      } catch(e) {}

      // Dispatch to Google Apps Script Webhook
      if (GOOGLE_APPS_SCRIPT_URL) {
        try {
          fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(confirmedOrderData)
          }).catch(() => {});

          const qs = '?action=order' +
            '&orderId=' + encodeURIComponent(orderData.orderId) +
            '&name=' + encodeURIComponent(orderData.name) +
            '&email=' + encodeURIComponent(orderData.email) +
            '&phone=' + encodeURIComponent(orderData.phone) +
            '&address=' + encodeURIComponent(orderData.address) +
            '&pincode=' + encodeURIComponent(orderData.pincode) +
            '&title=' + encodeURIComponent(orderData.title) +
            '&amount=' + encodeURIComponent(orderData.amount) +
            '&paymentMode=' + encodeURIComponent(orderData.paymentMode) +
            '&sendInvoice=' + encodeURIComponent(orderData.sendInvoice ? 'true' : 'false');
          new Image().src = GOOGLE_APPS_SCRIPT_URL + qs;
        } catch(e) {}
      }
    }

    // Print Official GST Tax Invoice
    function printOrderInvoice(order) {
      if (!order) order = confirmedOrderData;
      if (!order) return;

      const brand = "THE CLASSIC CO.";
      const invoiceNum = "INV-CC-" + (order.orderId || "2026-001");
      const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
      const amount = Number(order.amount) || 899;
      const taxableValue = Math.round(amount / 1.18);
      const gstAmount = amount - taxableValue;
      const cgst = (gstAmount / 2).toFixed(2);
      const sgst = (gstAmount / 2).toFixed(2);

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Tax Invoice #${invoiceNum}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#161514;padding:40px;margin:0;background:#fff;line-height:1.5;font-size:13px;}.inv-wrap{max-width:720px;margin:0 auto;border:1px solid #e5e5e5;padding:36px;border-radius:8px;}.inv-header{display:flex;justify-content:space-between;border-bottom:2px solid #161514;padding-bottom:18px;margin-bottom:22px;}.brand-name{font-size:22px;font-weight:800;letter-spacing:1px;font-family:Georgia,serif;}.brand-sub{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#78716c;margin-top:2px;}.meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;font-size:12.5px;}.table-inv{width:100%;border-collapse:collapse;margin-bottom:20px;}.table-inv th{background:#faf9f6;border:1px solid #e5e5e5;padding:9px 12px;font-size:11px;text-transform:uppercase;text-align:left;}.table-inv td{border:1px solid #e5e5e5;padding:12px;}.total-table{width:260px;margin-left:auto;margin-bottom:22px;border-collapse:collapse;}.total-table td{padding:5px 8px;font-size:12px;}.total-table tr.grand{font-size:15px;font-weight:800;border-top:2px solid #161514;}.support-box{background:#faf9f6;border-left:3px solid #b48448;padding:10px 14px;font-size:11.5px;color:#57534e;margin-bottom:22px;}.footer-sign{display:flex;justify-content:space-between;align-items:flex-end;margin-top:28px;padding-top:14px;border-top:1px solid #e5e5e5;font-size:11px;color:#78716c;}@media print{body{padding:0;}.inv-wrap{border:none;padding:0;}}</style></head><body><div class="inv-wrap"><div class="inv-header"><div><div class="brand-name">${brand}</div><div class="brand-sub">Contemporary Eyewear Studio</div><div style="font-size:11px;color:#57534e;margin-top:4px;">Helpline: +91 8619661325 · Email: rishabhsamarwal383@gmail.com</div></div><div style="text-align:right;"><h2 style="margin:0;font-size:18px;">TAX INVOICE</h2><div style="margin-top:4px;font-size:11.5px;color:#57534e;">Invoice: <strong>#${invoiceNum}</strong><br>Date: <strong>${invoiceDate}</strong></div></div></div><div class="meta-grid"><div><strong style="text-transform:uppercase;font-size:10.5px;color:#78716c;display:block;margin-bottom:3px;">Billed & Shipped To:</strong><div style="font-size:13.5px;font-weight:700;">${order.name}</div><div style="color:#57534e;margin-top:2px;">📞 +91 ${order.phone}<br>📧 ${order.email || 'customer@gmail.com'}<br>📍 ${order.address} - ${order.pincode}</div></div><div><strong style="text-transform:uppercase;font-size:10.5px;color:#78716c;display:block;margin-bottom:3px;">Dispatch & Payment:</strong><div style="color:#57534e;">Payment Mode: <strong>${order.paymentMode}</strong><br>Shipping: <strong>Zero Cost (Express Delivery)</strong><br>Included: <strong>Hard Case + Microfiber Cloth + Test Card</strong></div></div></div><table class="table-inv"><thead><tr><th>Item Silhouette</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Taxable</th><th>Total</th></tr></thead><tbody><tr><td><strong>${order.title}</strong><br><span style="font-size:10.5px;color:#78716c;">100% UV400 Polarized Architectural Eyewear</span></td><td>90041000</td><td>1</td><td>₹${taxableValue}</td><td>₹${taxableValue}</td><td><strong>₹${amount}</strong></td></tr></tbody></table><table class="total-table"><tr><td>Taxable Value:</td><td align="right">₹${taxableValue}</td></tr><tr><td>CGST (9%):</td><td align="right">₹${cgst}</td></tr><tr><td>SGST (9%):</td><td align="right">₹${sgst}</td></tr><tr><td>Shipping Charge:</td><td align="right" style="color:#059669;font-weight:700;">FREE</td></tr><tr class="grand"><td>Grand Total:</td><td align="right" style="color:#b48448;">₹${amount} Only</td></tr></table><div class="support-box">📦 <strong>Customer Support:</strong> For parcel updates or order inquiries, contact WhatsApp: +91 8619661325 · Email: rishabhsamarwal383@gmail.com</div><div class="footer-sign"><div>Computer-generated digital tax invoice & proof of purchase.</div><div style="text-align:right;"><div style="font-family:Georgia,serif;font-size:13px;font-weight:700;">For THE CLASSIC CO.</div><div style="font-size:10px;color:#78716c;margin-top:16px;">Authorized Signatory</div></div></div></div><script>window.onload=function(){window.print();}<\/script></body></html>`;

      const w = window.open('', '_blank');
      w.document.open();
      w.document.write(html);
      w.document.close();
    }

    
    // Attached GPS location coordinates / Google Maps Link
    let attachedGPSMapUrl = "";

    // Touch-Scroll Gallery Logic
    function slideGallery(direction) {
      const carousel = document.getElementById("detail-gallery-carousel");
      if (!carousel) return;
      const step = carousel.clientWidth;
      carousel.scrollBy({ left: direction * step, behavior: 'smooth' });
    }

    function scrollToSlide(index) {
      const carousel = document.getElementById("detail-gallery-carousel");
      if (!carousel) return;
      carousel.scrollTo({ left: index * carousel.clientWidth, behavior: 'smooth' });
      updateGalleryActiveState(index);
    }

    function handleGalleryScroll() {
      const carousel = document.getElementById("detail-gallery-carousel");
      if (!carousel || !carousel.clientWidth) return;
      const activeIdx = Math.round(carousel.scrollLeft / carousel.clientWidth);
      updateGalleryActiveState(activeIdx);
    }

    function updateGalleryActiveState(idx) {
      // Update dots
      document.querySelectorAll(".carousel-dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === idx);
      });
      // Update thumbnails
      document.querySelectorAll(".prod-thumb-btn").forEach((thumb, i) => {
        thumb.classList.toggle("active", i === idx);
      });
    }

    // Helper: Haversine distance in meters
    function calcDistMeters(lat1, lon1, lat2, lon2) {
      const R = 6371e3;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }

    // Helper: Clean duplicate address tokens
    function cleanAddressTokens(tokens) {
      const result = [];
      for (const t of tokens) {
        if (!t) continue;
        const clean = t.trim().replace(/^,\s*|,\s*$/g, '');
        if (!clean) continue;
        const lower = clean.toLowerCase();
        const isDup = result.some(r => {
          const rLower = r.toLowerCase();
          return rLower === lower || (rLower.includes(lower) && rLower.length - lower.length < 15);
        });
        if (!isDup) result.push(clean);
      }
      return result;
    }

    // Smart Multi-Source GPS & Reverse Geocoding Autofill (Precise Landmark & Street)
    async function detectGPSAndAutofillAddress() {
      const btnText = document.getElementById("gps-btn-text");
      const btnIcon = document.getElementById("gps-btn-icon");
      const badge = document.getElementById("gps-status-badge");
      const addrInput = document.getElementById("inp-address");

      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser. Please type your delivery address.");
        return;
      }

      btnText.innerText = "Accessing exact GPS location...";
      btnIcon.innerText = "⚡";

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy || 10);
          attachedGPSMapUrl = "https://www.google.com/maps?q=" + lat + "," + lng;

          btnText.innerText = "Detecting exact neighborhood & street...";

          try {
            const photonUrl = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
            const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`;

            const [photonRes, nomRes] = await Promise.allSettled([
              fetch(photonUrl).then(r => r.json()).catch(() => null),
              fetch(nomUrl, { headers: { 'Accept': 'application/json' } }).then(r => r.json()).catch(() => null)
            ]);

            const pFeature = (photonRes.status === 'fulfilled' && photonRes.value && photonRes.value.features && photonRes.value.features[0]) ? photonRes.value.features[0] : null;
            const pData = pFeature ? pFeature.properties : {};
            const nData = (nomRes.status === 'fulfilled' && nomRes.value) ? nomRes.value : {};
            const nAddr = nData.address || {};

            // 1. Pincode
            const rawPin = pData.postcode || nAddr.postcode || "";
            const postcode = rawPin.replace(/\D/g, '').slice(0, 6);
            if (postcode) {
              const pinInput = document.getElementById("inp-pincode");
              if (pinInput) {
                pinInput.value = postcode;
                clearError("inp-pincode", "err-pincode");
              }
            }

            // 2. City
            const city = pData.city || nAddr.city || nAddr.town || nAddr.village || nAddr.state_district || "";
            if (city) {
              const cityInput = document.getElementById("inp-city");
              if (cityInput) {
                cityInput.value = city;
                clearError("inp-city", "err-city");
              }
            }

            // 3. Locality / Suburb / Area
            const locality = pData.district || pData.locality || nAddr.suburb || nAddr.neighbourhood || nAddr.residential || "";

            // 4. Street / Road
            const street = pData.street || nAddr.road || nAddr.pedestrian || nAddr.street || "";

            // 5. House / Building Number
            const house = pData.housenumber || nAddr.house_number || nAddr.building || "";

            // 6. Landmark & Distance Calculation
            let rawLandmark = "";
            let poiDist = 99999;
            if (pFeature && pFeature.geometry && pFeature.geometry.coordinates) {
              const [poiLng, poiLat] = pFeature.geometry.coordinates;
              poiDist = calcDistMeters(lat, lng, poiLat, poiLng);
            }

            if (pData.name && pData.name !== pData.street && pData.name !== pData.city && pData.name !== locality) {
              rawLandmark = pData.name.split(',')[0].trim();
            } else if (nAddr.amenity || nAddr.shop || nAddr.tourism || nAddr.leisure || nAddr.building) {
              rawLandmark = (nAddr.amenity || nAddr.shop || nAddr.tourism || nAddr.leisure || nAddr.building).split(',')[0].trim();
            }

            // Clean & Deduplicate Address Parts
            const addressTokens = [];
            if (house) addressTokens.push(`House/Flat No. ${house}`);
            if (street) addressTokens.push(street);

            // Only add 'Near Landmark' to the street text if it's truly close (<=180m)
            if (rawLandmark && poiDist <= 180) {
              addressTokens.push(`Near ${rawLandmark}`);
            }

            if (locality && locality !== street && locality !== city) {
              addressTokens.push(locality);
            }

            const cleanParts = cleanAddressTokens(addressTokens);
            let detectedAreaText = cleanParts.join(', ');
            if (!detectedAreaText) {
              const fallbackParts = cleanAddressTokens([nAddr.road, nAddr.suburb, nAddr.neighbourhood, nAddr.county]);
              detectedAreaText = fallbackParts.length ? fallbackParts.join(', ') : (nData.display_name ? nData.display_name.split(',').slice(0, 2).join(', ') : "");
            }

            // Handle user editing: if user already typed, preserve it cleanly
            const existingText = (addrInput.value || "").trim();
            let finalAddressValue = "";
            if (existingText && existingText.length > 2) {
              finalAddressValue = existingText + (detectedAreaText ? ", " + detectedAreaText : "");
            } else {
              finalAddressValue = (house ? ("House/Flat No. " + house + ", ") : "") + detectedAreaText;
            }

            addrInput.value = finalAddressValue;
            clearError("inp-address", "err-address");

            btnText.innerText = "✓ Address & Pincode Auto-Filled";
            btnIcon.innerText = "⚡";

            badge.style.display = "block";
            badge.innerHTML = `
              <div style="font-size:12px; font-weight:600; color:#065f46; display:flex; justify-content:space-between; align-items:center;">
                <span>✓ Address &amp; Pincode Auto-Filled (${escapeHTML(locality || city)})</span>
                <a href='${attachedGPSMapUrl}' target='_blank' style='color:#065f46; font-size:11.5px; text-decoration:underline;'>View Pin ↗</a>
              </div>
            `;

          } catch (e) {
            console.warn("Reverse geocode fallback", e);
            btnText.innerText = "✓ Address & Pincode Auto-Filled";
            btnIcon.innerText = "⚡";
            badge.style.display = "block";
            badge.innerHTML = `
              <div style="font-size:12px; font-weight:600; color:#065f46;">
                📍 Location pinned · <a href='${attachedGPSMapUrl}' target='_blank' style='color:#065f46; font-size:11.5px; text-decoration:underline;'>View Map ↗</a>
              </div>
            `;
          }
        },
        (err) => {
          btnText.innerText = "Pin Location";
          btnIcon.innerText = "📍";
          alert("Could not fetch location. Please check browser GPS permission or enter your address manually.");
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    }

    // Direct UPI App Launcher (PhonePe, GPay, Paytm, Generic)
    function launchDirectUpiApp(app) {
      const order = pendingOrderData || confirmedOrderData;
      const p = selectedProduct || PRODUCTS[0];
      const payable = (order && order.amount) ? order.amount : (p.cod_price - 100);
      const orderId = (order && order.orderId) ? order.orderId : ("ORD-CC-" + Math.floor(10000 + Math.random() * 90000));
      const upiBase = "pa=" + MERCHANT_UPI + "&pn=The%20Classic%20Co&am=" + payable + "&cu=INR&tn=" + encodeURIComponent("The Classic Co Order #" + orderId) + "&tr=" + encodeURIComponent(orderId);

      window.isAwaitingUpiReturn = true;
      window.upiAppLaunchedTime = Date.now();

      let targetUrl = "upi://pay?" + upiBase;
      if (app === "phonepe") {
        targetUrl = "phonepe://pay?" + upiBase;
      } else if (app === "gpay") {
        targetUrl = "gpay://upi/pay?" + upiBase;
      } else if (app === "paytm") {
        targetUrl = "paytmmp://pay?" + upiBase;
      } else if (app === "amazonpay") {
        targetUrl = "amazonpay://pay?" + upiBase;
      }

      window.location.href = targetUrl;

      // Mobile scheme fallback
      if (app !== "generic") {
        setTimeout(() => {
          window.location.href = "upi://pay?" + upiBase;
        }, 1500);
      }
    }
  
    // Modal Helpers
    function openTrackerModal() {
      document.getElementById("tracker-modal").style.display = "flex";
      document.body.style.overflow = "hidden";
    }
    function closeTrackerModal() {
      document.getElementById("tracker-modal").style.display = "none";
      document.body.style.overflow = "";
    }
    // Security: HTML sanitization helper
    function escapeHTML(str) {
      if (!str) return '';
      return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
      });
    }

    function handleTrackingSearch() {
      const q = document.getElementById("tracker-input").value.trim().toUpperCase();
      const res = document.getElementById("tracker-result");
      if (!q) return;

      const orders = JSON.parse(localStorage.getItem('the_classic_co_orders') || '[]');
      const found = orders.find(o => (o.orderId || '').toUpperCase().includes(q) || (o.phone || '').includes(q));

      res.style.display = "block";
      if (found) {
        res.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <strong>#${escapeHTML(found.orderId)}</strong>
            <span style="background:var(--green-light); color:var(--green); font-size:11px; font-weight:800; padding:2px 8px; border-radius:10px;">${escapeHTML(found.status || 'Dispatched (In Transit)')}</span>
          </div>
          <div><strong>Customer:</strong> ${escapeHTML(found.name)}</div>
          <div><strong>Silhouette:</strong> ${escapeHTML(found.title)}</div>
          <div><strong>Payable:</strong> ₹${escapeHTML(found.amount)} (${escapeHTML(found.paymentMode)})</div>
          <div style="margin-top:10px; font-size:11.5px; color:var(--text-muted); border-left:2px solid var(--accent); padding-left:8px;">
            ✓ Order Verified &amp; Packed in Studio<br>
            ✓ Dispatched via Priority Express Courier<br>
            ○ Out for Doorstep Delivery
          </div>
        `;
      } else {
        res.innerHTML = '<div style="color:var(--text-muted);">No order found for "' + escapeHTML(q) + '". Please check the ID or contact WhatsApp helpline.</div>';
      }
    }