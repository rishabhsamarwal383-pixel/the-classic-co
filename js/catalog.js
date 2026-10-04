let currentCategory = "All";
    let currentSort = "featured";
    let searchQuery = "";
    let selectedProduct = null;
    let selectedPayment = "cod";
    let confirmedOrderData = null;
    let pendingOrderData = null;
    let upiTimerInterval = null;
    let mobileShowAll = false;
    const MOBILE_INITIAL_COUNT = 6;

    // Initialize Application
    document.addEventListener("DOMContentLoaded", () => {
      renderProductsGrid();
      updateCartCount();
    });

    // Render Products Grid
    function renderProductsGrid() {
      const grid = document.getElementById("products-grid");
      let filtered = [...PRODUCTS];

      // 1. Filter Category
      if (currentCategory === "Polarized") {
        filtered = filtered.filter(p => p.category.includes("Polarized"));
      } else if (currentCategory === "Acetates") {
        filtered = filtered.filter(p => p.category.includes("Acetate") || p.category.includes("Lifestyle"));
      } else if (currentCategory === "Magnetic") {
        filtered = filtered.filter(p => p.category.includes("Magnetic"));
      } else if (currentCategory === "Luxury") {
        filtered = filtered.filter(p => p.category.includes("Luxury"));
      } else if (currentCategory === "Lifestyle") {
        filtered = filtered.filter(p => p.category.includes("Lifestyle"));
      }

      // 2. Filter Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
      }

      // 3. Sort
      if (currentSort === "price-low") {
        filtered.sort((a, b) => a.cod_price - b.cod_price);
      } else if (currentSort === "price-high") {
        filtered.sort((a, b) => b.cod_price - a.cod_price);
      } else if (currentSort === "popular") {
        filtered.sort((a, b) => b.id - a.id);
      }

      // Update count
      document.getElementById("results-count-text").innerText = "Showing " + filtered.length + " silhouettes";

      if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:48px 20px; color:var(--text-muted);">No silhouettes match your search query. Try another style or category.</div>';
        return;
      }

      // 4. Mobile: show limited initially
      const isMobile = window.innerWidth <= 680;
      const totalCount = filtered.length;
      let displayProducts = filtered;
      let showViewAllBtn = false;

      if (isMobile && !mobileShowAll && totalCount > MOBILE_INITIAL_COUNT) {
        displayProducts = filtered.slice(0, MOBILE_INITIAL_COUNT);
        showViewAllBtn = true;
      }

      grid.innerHTML = displayProducts.map(p => {
        const discount = Math.round(((p.compare_at - p.cod_price) / p.compare_at) * 100);
        const rating = (4.8 + ((p.id % 3) * 0.1)).toFixed(1);
        const reviewCount = 38 + (p.id * 3);

        return `
          <div class="product-card" onclick="openProductDetailModal(${p.id})">
            <div class="media-wrap">
              <img src="${p.images[0]}" alt="${p.title}" class="media-img" loading="lazy">
            </div>
            <div class="card-body">
              <div class="card-cat">${p.category}</div>
              <div class="card-title">${p.title}</div>
              <div class="card-rating">
                ★★★★★ <span>${rating} (${reviewCount})</span>
              </div>
              <div class="price-row">
                <span class="price-current">₹${p.cod_price}</span>
                <span class="price-original">₹${p.compare_at}</span>
                <span class="price-save">${discount}% OFF</span>
              </div>
              <button type="button" class="btn-card-action" onclick="event.stopPropagation(); openProductDetailModal(${p.id})">
                View Details
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Add "View All" button on mobile
      if (showViewAllBtn) {
        const remaining = totalCount - MOBILE_INITIAL_COUNT;
        grid.insertAdjacentHTML('beforeend', `
          <div class="view-all-wrap" style="grid-column: 1 / -1;">
            <button type="button" class="btn-view-all" onclick="showAllProducts()">
              View All ${totalCount} Silhouettes →
            </button>
            <div class="view-all-hint">${remaining} more styles to explore</div>
          </div>
        `);
      }
    }

    function showAllProducts() {
      mobileShowAll = true;
      renderProductsGrid();
      // Smooth scroll to where new products start
      const cards = document.querySelectorAll('.product-card');
      if (cards.length > MOBILE_INITIAL_COUNT) {
        cards[MOBILE_INITIAL_COUNT].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    // Category Tabs
    function filterCategory(cat, btn) {
      currentCategory = cat;
      mobileShowAll = false;
      document.querySelectorAll(".pill-tab").forEach(t => t.classList.remove("active"));
      if (btn) btn.classList.add("active");
      renderProductsGrid();
    }

    // Search & Sort Handlers
    function handleSearch(val) {
      searchQuery = val.trim();
      mobileShowAll = false;
      renderProductsGrid();
    }
    function handleSort(val) {
      currentSort = val;
      renderProductsGrid();
    }

    // Checkout Modal Logic
    
    let viewingProduct = null;

    function openProductDetailModal(prodId) {
      const p = PRODUCTS.find(x => x.id === prodId) || PRODUCTS[0];
      viewingProduct = p;

      // Gallery images are set up via carousel below
      document.getElementById("detail-category").innerText = p.category;
      document.getElementById("detail-title").innerText = p.title;
      document.getElementById("detail-price").innerText = "₹" + p.cod_price;
      document.getElementById("detail-compare").innerText = "₹" + p.compare_at;
      const discount = Math.round(((p.compare_at - p.cod_price) / p.compare_at) * 100);
      document.getElementById("detail-discount").innerText = discount + "% OFF";
      document.getElementById("detail-review-count").innerText = "(" + (38 + p.id * 3) + " Reviews)";

      // Setup Touch-Scroll Gallery Slides
      const carousel = document.getElementById("detail-gallery-carousel");
      if (carousel) {
        carousel.innerHTML = p.images.map((imgUrl, idx) => `
          <div class="prod-gallery-slide">
            <img src="${imgUrl}" alt="${p.title} - View ${idx+1}" loading="lazy">
          </div>
        `).join('');
        carousel.scrollLeft = 0;
      }

      // Setup Dots
      const dotsWrap = document.getElementById("detail-carousel-dots");
      if (dotsWrap) {
        dotsWrap.innerHTML = p.images.map((_, idx) => `
          <div class="carousel-dot ${idx === 0 ? 'active' : ''}" onclick="scrollToSlide(${idx})"></div>
        `).join('');
      }

      // Setup Thumbnails
      const strip = document.getElementById("detail-thumbs-strip");
      if (strip) {
        strip.innerHTML = p.images.map((imgUrl, idx) => `
          <button type="button" class="prod-thumb-btn ${idx === 0 ? 'active' : ''}" onclick="scrollToSlide(${idx})">
            <img src="${imgUrl}" alt="Thumbnail ${idx+1}">
          </button>
        `).join('');
      }

      // WhatsApp link (optional fallback)
      const waBtn = document.getElementById("detail-wa-btn");
      if (waBtn) {
        const waText = encodeURIComponent("Hi The Classic Co! I am interested in: " + p.title + " (₹" + p.cod_price + ")");
        waBtn.href = "https://wa.me/" + WA_NUMBER + "?text=" + waText;
      }

      // Meta Pixel ViewContent
      try {
        if (window.fbq) fbq('track', 'ViewContent', { content_name: p.title, value: p.cod_price, currency: 'INR' });
      } catch(e) {}

      document.getElementById("product-detail-modal").style.display = "flex";
      document.body.style.overflow = "hidden";
    }

    function closeProductDetailModal() {
      document.getElementById("product-detail-modal").style.display = "none";
      document.body.style.overflow = "";
    }

    function handleProdModalBackdropClick(e) {
      if (e.target.id === "product-detail-modal") {
        closeProductDetailModal();
      }
    }

    function orderProductFromDetail() {
      closeProductDetailModal();
      if (viewingProduct) {
        openCheckoutForProduct(viewingProduct.id);
      }
    }

    function addToCartFromDetail() {
      if (!viewingProduct) return;
      currentBagItem = viewingProduct;
      closeProductDetailModal();
      openCheckoutForProduct(viewingProduct.id);
    }