// =========================================================================
// CATALOG: Bestsellers by default, "View all styles" shows everything in stock
// =========================================================================
let currentCategory = "All";
let searchQuery = "";
let currentSort = "featured";
let selectedProduct = null;
let selectedPayment = "upi";
let confirmedOrderData = null;
let pendingOrderData = null;
let showAllStyles = false;
let viewingProduct = null;
const BESTSELLER_FALLBACK_COUNT = 6;

document.addEventListener("DOMContentLoaded", () => {
  renderProductsGrid();
});

function inStockProducts() {
  return PRODUCTS.filter(p => p.inStock !== false && !p.hidden);
}

function handleSort(val) {
  currentSort = val;
  renderProductsGrid();
}

function renderProductsGrid() {
  const grid = document.getElementById("products-grid");
  const headingEl = document.getElementById("catalog-heading");
  const subEl = document.getElementById("catalog-sub");
  const countEl = document.getElementById("results-count-text");

  let list = inStockProducts();
  const totalInStock = list.length;

  if (currentCategory !== "All") {
    list = list.filter(p => p.category === currentCategory);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }

  const isFiltered = currentCategory !== "All" || !!searchQuery;
  let display = [...list];
  let showViewAll = false;

  if (currentSort === "price-asc") {
    display.sort((a, b) => a.cod_price - b.cod_price);
  } else if (currentSort === "price-desc") {
    display.sort((a, b) => b.cod_price - a.cod_price);
  } else if (currentSort === "name-asc") {
    display.sort((a, b) => a.title.localeCompare(b.title));
  } else if (currentSort === "name-desc") {
    display.sort((a, b) => b.title.localeCompare(a.title));
  } else {
    // "featured" default sorting
    if (!isFiltered && !showAllStyles) {
      const featured = display.filter(p => p.featured);
      display = featured.length ? featured : display.slice(0, BESTSELLER_FALLBACK_COUNT);
      showViewAll = list.length > display.length;
    }
  }

  if (headingEl) {
    if (!isFiltered && !showAllStyles) headingEl.innerText = "Bestsellers";
    else if (currentCategory !== "All") headingEl.innerText = currentCategory;
    else if (searchQuery) headingEl.innerText = "Search results";
    else headingEl.innerText = "All styles";
  }
  if (subEl) {
    subEl.innerText = (!isFiltered && !showAllStyles)
      ? "Our most-ordered frames. UV400 polarized lenses, hard case and cloth included."
      : "UV400 polarized lenses, hard case and cloth included.";
  }
  if (countEl) {
    countEl.innerText = "Showing " + display.length + (display.length === list.length ? "" : " of " + list.length) + " styles";
  }

  if (display.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:48px 20px; color:var(--text-muted);">No styles match your search. Try another name or category.</div>';
    return;
  }

  grid.innerHTML = display.map(p => `
    <div class="product-card" onclick="openProductDetailModal(${p.id})">
      <div class="media-wrap">
        <img src="${p.images[0]}" alt="${escapeHTML(p.title)}" class="media-img" loading="lazy">
      </div>
      <div class="card-body">
        <div class="card-cat">${escapeHTML(p.category)}</div>
        <div class="card-title">${escapeHTML(p.title)}</div>
        <div class="price-row">
          <span class="price-current">₹${p.cod_price}</span>
          <span class="price-upi-note">₹${p.upi_price} on UPI</span>
        </div>
        <button type="button" class="btn-card-action" onclick="event.stopPropagation(); openProductDetailModal(${p.id})">
          View Details
        </button>
      </div>
    </div>
  `).join('');

  if (showViewAll) {
    grid.insertAdjacentHTML('beforeend', `
      <div class="view-all-wrap" style="grid-column: 1 / -1;">
        <button type="button" class="btn-view-all" onclick="showAllProducts()">
          View all styles (${list.length}) →
        </button>
      </div>
    `);
  }
}

function showAllProducts() {
  showAllStyles = true;
  renderProductsGrid();
  const target = document.getElementById("collection");
  if (target) target.scrollIntoView({ behavior: 'smooth' });
}

// Category Tabs (buttons carry data-cat, so footer/drawer links keep the tabs in sync)
function filterCategory(cat, btn) {
  currentCategory = cat;
  showAllStyles = false;
  document.querySelectorAll(".pill-tab").forEach(t => {
    t.classList.toggle("active", t.getAttribute("data-cat") === cat);
  });
  renderProductsGrid();
}

function handleSearch(val) {
  searchQuery = val.trim();
  renderProductsGrid();
}

// ----- Product detail modal -----
function openProductDetailModal(prodId) {
  const p = PRODUCTS.find(x => x.id === prodId && x.inStock !== false && !x.hidden) || inStockProducts()[0];
  if (!p) return;
  viewingProduct = p;

  document.getElementById("detail-category").innerText = p.category;
  document.getElementById("detail-title").innerText = p.title;
  document.getElementById("detail-price").innerText = "₹" + p.cod_price;
  document.getElementById("detail-upi").innerText = "₹" + p.upi_price + " if you pay by UPI";

  const carousel = document.getElementById("detail-gallery-carousel");
  if (carousel) {
    carousel.innerHTML = p.images.map((imgUrl, idx) => `
      <div class="prod-gallery-slide">
        <img src="${imgUrl}" alt="${escapeHTML(p.title)} - View ${idx + 1}" loading="lazy">
      </div>
    `).join('');
    carousel.scrollLeft = 0;
  }

  const dotsWrap = document.getElementById("detail-carousel-dots");
  if (dotsWrap) {
    dotsWrap.innerHTML = p.images.map((_, idx) => `
      <div class="carousel-dot ${idx === 0 ? 'active' : ''}" onclick="scrollToSlide(${idx})"></div>
    `).join('');
  }

  const strip = document.getElementById("detail-thumbs-strip");
  if (strip) {
    strip.innerHTML = p.images.map((imgUrl, idx) => `
      <button type="button" class="prod-thumb-btn ${idx === 0 ? 'active' : ''}" onclick="scrollToSlide(${idx})">
        <img src="${imgUrl}" alt="Thumbnail ${idx + 1}">
      </button>
    `).join('');
  }

  const waBtn = document.getElementById("detail-wa-btn");
  if (waBtn) {
    const waText = encodeURIComponent("Hi The Classic Co! I am interested in: " + p.title + " (₹" + p.cod_price + ")");
    waBtn.href = "https://wa.me/" + WA_NUMBER + "?text=" + waText;
  }

  try { if (window.fbq) fbq('track', 'ViewContent', { content_name: p.title, value: p.cod_price, currency: 'INR' }); } catch (e) {}

  document.getElementById("product-detail-modal").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeProductDetailModal() {
  document.getElementById("product-detail-modal").style.display = "none";
  document.body.style.overflow = "";
}

function handleProdModalBackdropClick(e) {
  if (e.target.id === "product-detail-modal") closeProductDetailModal();
}

function orderProductFromDetail() {
  closeProductDetailModal();
  if (viewingProduct) openCheckoutForProduct(viewingProduct.id);
}
