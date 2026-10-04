function openMenuDrawer() {
      document.getElementById("menu-drawer").classList.add("active");
      document.body.style.overflow = "hidden";
      renderDrawerBag();
    }

    function closeMenuDrawer() {
      document.getElementById("menu-drawer").classList.remove("active");
      document.body.style.overflow = "";
    }

    function handleDrawerBackdropClick(e) {
      if (e.target.id === "menu-drawer") {
        closeMenuDrawer();
      }
    }

    function drawerFilterCategory(cat) {
      closeMenuDrawer();
      filterCategory(cat);
      const target = document.getElementById("collection");
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }

    function handleDrawerTrackingSearch() {
      const q = (document.getElementById("drawer-track-input").value || "").trim().toUpperCase();
      const res = document.getElementById("drawer-track-result");
      if (!q) return;

      const orders = JSON.parse(localStorage.getItem('the_classic_co_orders') || '[]');
      const found = orders.find(o => (o.orderId || '').toUpperCase().includes(q) || (o.phone || '').includes(q));

      res.style.display = "block";
      if (found) {
        res.innerHTML = `
          <div style="font-weight:700; margin-bottom:4px;">#${escapeHTML(found.orderId)}</div>
          <div>Status: <span style="color:var(--green); font-weight:700;">${escapeHTML(found.status || 'In Transit')}</span></div>
          <div>Payable: <strong>₹${escapeHTML(found.amount)}</strong> (${escapeHTML(found.paymentMode)})</div>
          <div style="margin-top:6px; color:var(--text-muted);">Frame: ${escapeHTML(found.title)}</div>
        `;
      } else {
        res.innerHTML = '<span style="color:var(--text-muted);">No order found for "' + escapeHTML(q) + '". Please check ID or message WhatsApp.</span>';
      }
    }
  
    // FAQ Toggle
    function toggleFaq(header) {
      header.parentElement.classList.toggle("open");
      const icon = header.querySelector("span:last-child");
      icon.innerText = header.parentElement.classList.contains("open") ? "−" : "＋";
    }

    // Keyboard Shortcuts: Close Modals on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeProductDetailModal();
        closeCheckoutModal();
        closeTrackerModal();
        closeMenuDrawer();
      }
    });
  
    // =========================================================================