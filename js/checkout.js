// =========================================================================
// CHECKOUT: delivery rule, payment options, order submission
// Rule: pincode starting with LOCAL_PINCODE_PREFIX (313 = Udaipur) -> COD allowed,
//       delivered within 24 hours. Any other pincode -> prepaid UPI only, 2-4 business days.
// =========================================================================
let userPickedPayment = false;
let isSubmittingOrder = false;
let activeDiscountPercent = 0;
let activeDiscountCode = "";

function getFinalAmount(baseAmount) {
  if (!activeDiscountPercent) return baseAmount;
  const saved = Math.round(baseAmount * (activeDiscountPercent / 100));
  return Math.max(1, baseAmount - saved);
}

function updateCheckoutPriceDisplay() {
  const p = selectedProduct || PRODUCTS[0];
  const finalCod = getFinalAmount(p.cod_price);
  const finalUpi = getFinalAmount(p.upi_price);

  const priceEl = document.getElementById("check-item-price");
  const codEl = document.getElementById("pay-cod-amount");
  const upiEl = document.getElementById("pay-upi-amount");

  if (activeDiscountPercent > 0) {
    if (priceEl) priceEl.innerHTML = `<span style="text-decoration:line-through; color:#94a3b8; font-size:13px; margin-right:6px;">₹${p.cod_price}</span>₹${finalCod}`;
    if (codEl) codEl.innerHTML = `<span style="text-decoration:line-through; color:#94a3b8; font-size:12px; margin-right:4px;">₹${p.cod_price}</span>₹${finalCod}`;
    if (upiEl) upiEl.innerHTML = `<span style="text-decoration:line-through; color:#94a3b8; font-size:12px; margin-right:4px;">₹${p.upi_price}</span>₹${finalUpi}`;
  } else {
    if (priceEl) priceEl.innerText = "₹" + p.cod_price;
    if (codEl) codEl.innerText = "₹" + p.cod_price;
    if (upiEl) upiEl.innerText = "₹" + p.upi_price;
  }

  const btnText = document.getElementById("btn-submit-text");
  if (btnText) {
    if (selectedPayment === "cod") {
      btnText.innerText = "Place Order · ₹" + finalCod + " (Cash on Delivery)";
    } else {
      btnText.innerText = "Pay ₹" + finalUpi + " via UPI";
    }
  }
}

function applyCouponCode() {
  const inp = document.getElementById("inp-coupon");
  const statusEl = document.getElementById("coupon-status");
  if (!inp || !statusEl) return;
  const code = (inp.value || "").trim().toUpperCase();

  if (code === "CLASSIC15") {
    activeDiscountPercent = 15;
    activeDiscountCode = "CLASSIC15";
    statusEl.style.display = "block";
    statusEl.style.color = "#15803d";
    statusEl.innerHTML = `✓ Voucher <strong>CLASSIC15</strong> applied! 15% discount active.`;
    updateCheckoutPriceDisplay();
  } else if (code === "CLASSIC10") {
    activeDiscountPercent = 10;
    activeDiscountCode = "CLASSIC10";
    statusEl.style.display = "block";
    statusEl.style.color = "#15803d";
    statusEl.innerHTML = `✓ Voucher <strong>CLASSIC10</strong> applied! 10% discount active.`;
    updateCheckoutPriceDisplay();
  } else if (!code) {
    activeDiscountPercent = 0;
    activeDiscountCode = "";
    statusEl.style.display = "none";
    updateCheckoutPriceDisplay();
  } else {
    statusEl.style.display = "block";
    statusEl.style.color = "#b91c1c";
    statusEl.innerHTML = `✕ Invalid voucher. Play Sunset Drive game to win!`;
  }
}

function isCompletePincode(pin) { return /^[0-9]{6}$/.test(pin || ""); }
function isLocalPincode(pin) { return isCompletePincode(pin) && pin.indexOf(LOCAL_PINCODE_PREFIX) === 0; }
function currentPincode() {
  const el = document.getElementById("inp-pincode");
  return el ? el.value.trim() : "";
}

function generateOrderId() {
  // 6-digit random from crypto (falls back to Math.random)
  let n;
  try {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    n = 100000 + (a[0] % 900000);
  } catch (e) {
    n = 100000 + Math.floor(Math.random() * 900000);
  }
  return "CC-" + n;
}

function openCheckoutForProduct(prodId) {
  const p = PRODUCTS.find(x => x.id === prodId && x.inStock !== false && !x.hidden) || PRODUCTS.find(x => x.inStock !== false && !x.hidden) || PRODUCTS[0];
  selectedProduct = p;
  userPickedPayment = false;
  isSubmittingOrder = false;
  selectedPayment = "upi";

  try { if (window.fbq) fbq('track', 'InitiateCheckout', { content_name: p.title, value: p.cod_price, currency: 'INR' }); } catch (e) {}

  document.getElementById("check-item-img").src = p.images[0];
  document.getElementById("check-item-title").innerText = p.title;
  document.getElementById("check-item-cat").innerText = p.category;
  
  // Auto-apply saved coupon from session (e.g. from Sunset Drive game)
  try {
    const savedCode = sessionStorage.getItem('classic_discount_code');
    const inp = document.getElementById("inp-coupon");
    if (savedCode && inp && !inp.value) {
      inp.value = savedCode;
    }
  } catch (e) {}
  applyCouponCode();

  updateDeliveryOptions();

  document.getElementById("checkout-step-1").style.display = "block";
  document.getElementById("checkout-step-upi-waiting").style.display = "none";
  document.getElementById("checkout-step-2").style.display = "none";
  const confirmBtn = document.getElementById("btn-confirm-payment-done");
  if (confirmBtn) confirmBtn.disabled = false;
  const submitBtn = document.getElementById("btn-submit-main");
  if (submitBtn) submitBtn.disabled = false;

  document.getElementById("checkout-modal").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeCheckoutModal() {
  document.getElementById("checkout-modal").style.display = "none";
  document.body.style.overflow = "";
}

// Show/hide COD depending on pincode, and explain delivery time
function updateDeliveryOptions() {
  const pin = currentPincode();
  const complete = isCompletePincode(pin);
  const local = isLocalPincode(pin);
  const codCard = document.getElementById("pay-opt-cod");
  const note = document.getElementById("delivery-note");

  codCard.style.display = local ? "" : "none";

  if (note) {
    if (!complete) {
      note.style.display = "block";
      note.style.background = "#f8fafc";
      note.style.borderColor = "#e2e8f0";
      note.style.color = "#475569";
      note.innerText = "Enter your 6-digit pincode to see delivery options.";
    } else if (local) {
      note.style.display = "block";
      note.style.background = "#f0fdf4";
      note.style.borderColor = "#bbf7d0";
      note.style.color = "#166534";
      note.innerText = "✓ Udaipur: delivered within 24 hours. Cash on delivery available.";
    } else {
      note.style.display = "block";
      note.style.background = "#fffbeb";
      note.style.borderColor = "#fde68a";
      note.style.color = "#92400e";
      note.innerText = "Outside Udaipur: prepaid UPI only. Ships in 2-4 business days.";
    }
  }

  if (!local) {
    selectPaymentMode("upi");
  } else if (!userPickedPayment) {
    selectPaymentMode("cod");
  } else {
    selectPaymentMode(selectedPayment);
  }
}

function onPincodeInput() {
  clearError("inp-pincode", "err-pincode");
  updateDeliveryOptions();
}

function pickPaymentMode(mode) {
  userPickedPayment = true;
  selectPaymentMode(mode);
}

function selectPaymentMode(mode) {
  if (mode === "cod" && !isLocalPincode(currentPincode())) mode = "upi";
  selectedPayment = mode;
  document.getElementById("pay-opt-cod").classList.toggle("active", mode === "cod");
  document.getElementById("pay-opt-upi").classList.toggle("active", mode === "upi");

  updateCheckoutPriceDisplay();
}

function clearError(fieldId, errId) {
  const f = document.getElementById(fieldId);
  const e = document.getElementById(errId);
  if (f) f.style.borderColor = "";
  if (e) e.style.display = "none";
}

function flagError(fieldId, errId) {
  document.getElementById(fieldId).style.borderColor = "#ef4444";
  document.getElementById(errId).style.display = "block";
}

// Submit Order Checkout
function submitCustomerOrder() {
  if (isSubmittingOrder) return;

  const name = document.getElementById("inp-name").value.trim();
  const phone = document.getElementById("inp-phone").value.trim();
  const email = document.getElementById("inp-email").value.trim();
  const address = document.getElementById("inp-address").value.trim();
  const city = document.getElementById("inp-city").value.trim();
  const pincode = currentPincode();

  let hasError = false;
  if (!name || name.length < 2) { flagError("inp-name", "err-name"); hasError = true; }
  if (!/^[6-9][0-9]{9}$/.test(phone)) { flagError("inp-phone", "err-phone"); hasError = true; }
  // Email is optional, but if filled it must look valid
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { flagError("inp-email", "err-email"); hasError = true; }
  if (!address || address.length < 5) { flagError("inp-address", "err-address"); hasError = true; }
  if (!city || city.length < 2) { flagError("inp-city", "err-city"); hasError = true; }
  if (!isCompletePincode(pincode)) { flagError("inp-pincode", "err-pincode"); hasError = true; }
  if (hasError) return;

  const p = selectedProduct || PRODUCTS[0];
  const local = isLocalPincode(pincode);
  // Re-check the rule at submit time: COD only for Udaipur pincodes
  const isUPI = (selectedPayment === "upi") || !local;
  const totalAmount = isUPI ? getFinalAmount(p.upi_price) : getFinalAmount(p.cod_price);
  const orderId = generateOrderId();
  const fullAddress = address + ", " + city + (attachedGPSMapUrl ? " [GPS: " + attachedGPSMapUrl + "]" : "");

  isSubmittingOrder = true;
  const submitBtn = document.getElementById("btn-submit-main");
  if (submitBtn) submitBtn.disabled = true;

  pendingOrderData = {
    orderId: orderId,
    productId: p.id,
    title: p.title,
    category: p.category,
    quantity: 1,
    amount: totalAmount,
    discountCode: activeDiscountCode || null,
    discountPercent: activeDiscountPercent || 0,
    paymentMode: isUPI ? "UPI" : "Cash on Delivery",
    paymentStatus: isUPI ? "UPI started - not paid yet" : "COD - collect on delivery",
    zone: local ? "Udaipur (24h)" : "Rest of India (2-4 days)",
    name: name,
    email: email,
    phone: phone,
    address: fullAddress,
    city: city,
    pincode: pincode,
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  if (isUPI) {
    try { if (window.fbq) fbq('track', 'AddPaymentInfo', { value: totalAmount, currency: 'INR' }); } catch (e) {}

    // Save the lead straight away so you can follow up even if they never tap "I've paid"
    saveAndSendOrder(pendingOrderData);

    document.getElementById("checkout-step-1").style.display = "none";
    document.getElementById("upi-waiting-amount").innerText = "₹" + totalAmount;
    const upiDeepLink = "upi://pay?pa=" + MERCHANT_UPI + "&pn=The%20Classic%20Co&am=" + totalAmount + "&cu=INR&tn=" + encodeURIComponent("The Classic Co Order " + orderId) + "&tr=" + encodeURIComponent(orderId);
    document.getElementById("upi-qr-image").src = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=6&data=" + encodeURIComponent(upiDeepLink);
    document.getElementById("checkout-step-upi-waiting").style.display = "block";
    document.getElementById("checkout-step-2").style.display = "none";

    // On phones, open the UPI app straight away
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = upiDeepLink;
    }
  } else {
    finalizeConfirmedOrder(pendingOrderData);
  }
}

// Customer says they paid. We do NOT claim it is verified: you confirm it manually.
function confirmUpiPaid() {
  if (!pendingOrderData) return;
  const btn = document.getElementById("btn-confirm-payment-done");
  if (btn) btn.disabled = true;
  pendingOrderData.paymentStatus = "Payment pending verification";
  pendingOrderData.status = "Payment pending verification";
  finalizeConfirmedOrder(pendingOrderData);
}

function backToOrderDetails() {
  isSubmittingOrder = false;
  const submitBtn = document.getElementById("btn-submit-main");
  if (submitBtn) submitBtn.disabled = false;
  document.getElementById("checkout-step-upi-waiting").style.display = "none";
  document.getElementById("checkout-step-1").style.display = "block";
}

// Store locally and send to the Google Sheet webhook
function saveAndSendOrder(orderData) {
  try {
    const stored = JSON.parse(localStorage.getItem('the_classic_co_orders') || '[]');
    const idx = stored.findIndex(o => o.orderId === orderData.orderId);
    if (idx >= 0) stored[idx] = orderData; else stored.unshift(orderData);
    localStorage.setItem('the_classic_co_orders', JSON.stringify(stored));
  } catch (e) {}

  if (!GOOGLE_APPS_SCRIPT_URL) return;
  // Put the payment status inside paymentMode too, so it always shows up in the sheet column you already have
  const modeLabel = orderData.paymentMode === "UPI" ? ("UPI - " + orderData.paymentStatus) : orderData.paymentMode;
  const payload = Object.assign({}, orderData, { paymentMode: modeLabel, sendInvoice: false });
  try {
    fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});

    const qs = '?action=order' +
      '&orderId=' + encodeURIComponent(orderData.orderId) +
      '&name=' + encodeURIComponent(orderData.name) +
      '&email=' + encodeURIComponent(orderData.email || '') +
      '&phone=' + encodeURIComponent(orderData.phone) +
      '&address=' + encodeURIComponent(orderData.address) +
      '&pincode=' + encodeURIComponent(orderData.pincode) +
      '&title=' + encodeURIComponent(orderData.title) +
      '&amount=' + encodeURIComponent(orderData.amount) +
      '&paymentMode=' + encodeURIComponent(modeLabel) +
      '&zone=' + encodeURIComponent(orderData.zone) +
      '&sendInvoice=false';
    new Image().src = GOOGLE_APPS_SCRIPT_URL + qs;
  } catch (e) {}
}

// Show the confirmation screen
function finalizeConfirmedOrder(orderData) {
  confirmedOrderData = orderData;
  const isUPI = orderData.paymentMode === "UPI";

  try { if (!isUPI) confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } }); } catch (e) {}

  try {
    if (window.fbq) fbq('track', 'Purchase', { value: orderData.amount, currency: 'INR', content_name: orderData.title, num_items: 1 });
    if (window.gtag) gtag('event', 'purchase', { transaction_id: orderData.orderId, value: orderData.amount, currency: 'INR', items: [{ item_name: orderData.title, price: orderData.amount, quantity: 1 }] });
  } catch (e) {}

  document.getElementById("rec-hero-label").innerText = isUPI ? "ORDER RECEIVED" : "ORDER PLACED";
  document.getElementById("rec-hero-orderid").innerText = "#" + orderData.orderId;
  document.getElementById("rec-hero-name").innerText = orderData.name;
  document.getElementById("rec-hero-msg").innerText = isUPI
    ? "We will check your payment and confirm your order on WhatsApp. Sending a screenshot of the payment makes it faster."
    : "We will message you on WhatsApp to confirm. Your sunglasses will be delivered within 24 hours via Cash on Delivery.";
  document.getElementById("rec-disp-title").innerText = orderData.title;
  document.getElementById("rec-disp-amount").innerText = "₹" + Number(orderData.amount).toLocaleString('en-IN');
  document.getElementById("rec-disp-mode").innerText = orderData.paymentMode;
  const cleanAddr = (orderData.address || '').replace(/\s*\[GPS:[^\]]+\]/, '');
  document.getElementById("rec-disp-addr").innerText = cleanAddr + " - " + orderData.pincode;
  document.getElementById("rec-disp-status").innerText = isUPI ? "Payment pending verification" : "Pay on delivery";

  const waBtn = document.getElementById("btn-wa-order-share");
  if (waBtn) {
    const waMsg = encodeURIComponent(
      "Hi The Classic Co! Order " + orderData.orderId + "\n" +
      "Frame: " + orderData.title + "\n" +
      "Amount: ₹" + orderData.amount + " (" + orderData.paymentMode + ")\n" +
      "Name: " + orderData.name + "\n" +
      (isUPI ? "I have paid via UPI. Screenshot attached." : "Please confirm my delivery.")
    );
    waBtn.href = "https://wa.me/" + WA_NUMBER + "?text=" + waMsg;
    document.getElementById("btn-wa-order-text").innerText = isUPI ? "Send payment screenshot on WhatsApp" : "Chat with us on WhatsApp";
  }

  document.getElementById("checkout-step-1").style.display = "none";
  document.getElementById("checkout-step-upi-waiting").style.display = "none";
  document.getElementById("checkout-step-2").style.display = "block";

  saveAndSendOrder(orderData);
}

// Attached GPS location link
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
                updateDeliveryOptions();
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
      if (!order) return;
      const payable = order.amount;
      const orderId = order.orderId;
      const upiBase = "pa=" + MERCHANT_UPI + "&pn=The%20Classic%20Co&am=" + payable + "&cu=INR&tn=" + encodeURIComponent("The Classic Co Order " + orderId) + "&tr=" + encodeURIComponent(orderId);

      let targetUrl = "upi://pay?" + upiBase;
      if (app === "phonepe") targetUrl = "phonepe://pay?" + upiBase;
      else if (app === "gpay") targetUrl = "gpay://upi/pay?" + upiBase;
      else if (app === "paytm") targetUrl = "paytmmp://pay?" + upiBase;
      else if (app === "amazonpay") targetUrl = "amazonpay://pay?" + upiBase;

      window.location.href = targetUrl;

      // Fallback to the generic UPI intent if the app-specific scheme is not installed
      if (app !== "generic") {
        setTimeout(() => { window.location.href = "upi://pay?" + upiBase; }, 1500);
      }
    }

    // Security: HTML sanitization helper
    function escapeHTML(str) {
      if (!str) return '';
      return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
      });
    }
