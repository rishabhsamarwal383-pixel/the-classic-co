function openCartModal() {
      if (confirmedOrderData) {
        openCheckoutForProduct(confirmedOrderData.productId);
      } else {
        openCheckoutForProduct(PRODUCTS[0].id);
      }
    }

    function updateCartCount() {
      try {
        const stored = JSON.parse(localStorage.getItem('the_classic_co_orders') || '[]');
        updateBagBadge();
      } catch(e) {}
    }

    
    // Active Shopping Bag state (Defaults to featured silhouette)
    let currentBagItem = PRODUCTS[0];