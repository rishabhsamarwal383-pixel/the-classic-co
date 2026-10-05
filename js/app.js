function openMenuDrawer() {
  document.getElementById("menu-drawer").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeMenuDrawer() {
  document.getElementById("menu-drawer").classList.remove("active");
  document.body.style.overflow = "";
}

function handleDrawerBackdropClick(e) {
  if (e.target.id === "menu-drawer") closeMenuDrawer();
}

function drawerFilterCategory(cat) {
  closeMenuDrawer();
  filterCategory(cat);
  const target = document.getElementById("collection");
  if (target) target.scrollIntoView({ behavior: 'smooth' });
}

// FAQ Toggle
function toggleFaq(header) {
  header.parentElement.classList.toggle("open");
  const icon = header.querySelector("span:last-child");
  if (icon) icon.innerText = header.parentElement.classList.contains("open") ? "−" : "＋";
}

// Close modals on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeProductDetailModal();
    closeCheckoutModal();
    closeMenuDrawer();
  }
});

// Hero lookbook switcher
function switchHeroPhoto(src, pillEl) {
  const img = document.getElementById('hero-main-photo');
  if (!img) return;
  img.style.opacity = '0.35';
  img.style.transform = 'scale(0.97)';
  setTimeout(() => {
    img.src = src;
    img.style.opacity = '1';
    img.style.transform = 'scale(1)';
  }, 160);
  document.querySelectorAll('.hero-pill-thumb').forEach(p => p.classList.remove('active'));
  if (pillEl) pillEl.classList.add('active');
}

// Dynamic Site Promises & Editorial Copy Binding
function applySitePromises() {
  if (typeof SITE_PROMISES === 'undefined' || !SITE_PROMISES) return;
  if (SITE_PROMISES.announcement) {
    const el = document.querySelector('.announcement-bar span');
    if (el) el.innerHTML = SITE_PROMISES.announcement;
  }
  if (SITE_PROMISES.heroTitle) {
    const el = document.querySelector('.hero-main-title');
    if (el) el.innerHTML = SITE_PROMISES.heroTitle;
  }
  if (SITE_PROMISES.heroSubtitle) {
    const el = document.querySelector('.hero-sub-title');
    if (el) el.innerHTML = SITE_PROMISES.heroSubtitle;
  }
  if (SITE_PROMISES.deliveryStrip) {
    const el = document.querySelector('.delivery-strip');
    if (el) el.innerHTML = SITE_PROMISES.deliveryStrip;
  }
  if (SITE_PROMISES.founder) {
    const el = document.querySelector('.founder-section p');
    if (el) el.innerHTML = SITE_PROMISES.founder;
  }
}

document.addEventListener("DOMContentLoaded", applySitePromises);

