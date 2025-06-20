document.addEventListener('DOMContentLoaded', () => {
  const productsList = document.getElementById('productsList');
  const categoryFilter = document.getElementById('categoryFilter');
  const searchInput = document.getElementById('searchInput');
  const modal = document.getElementById('productModal');
  const modalDetails = document.getElementById('modalDetails');
  const closeModal = document.getElementById('closeModal');

  let products = [];
  let filteredProducts = [];

  // تحميل المنتجات من ملف JSON
  fetch('products.json')
    .then(res => res.json())
    .then(data => {
      products = data;
      filteredProducts = products;
      renderProducts(products);
    });

  // تصفية المنتجات
  categoryFilter.addEventListener('change', () => {
    filterAndSearch();
  });
  searchInput.addEventListener('input', () => {
    filterAndSearch();
  });

  function filterAndSearch() {
    const category = categoryFilter.value;
    const search = searchInput.value.trim();
    filteredProducts = products.filter(p => {
      const matchCategory = category === 'all' || p.category === category;
      const matchSearch = p.name.includes(search) || p.description.includes(search);
      return matchCategory && matchSearch;
    });
    renderProducts(filteredProducts);
  }

  // عرض المنتجات
  function renderProducts(list) {
    productsList.innerHTML = '';
    if (list.length === 0) {
      productsList.innerHTML = '<p>لا توجد منتجات مطابقة.</p>';
      return;
    }
    list.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <div class="price">${product.price} د.أ</div>
        <button data-id="${product.id}">أضف إلى السلة</button>
      `;
      card.addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON') {
          addToCart(product.id, 1);
          e.stopPropagation();
        } else {
          showModal(product);
        }
      });
      productsList.appendChild(card);
    });
  }

  // مودال تفاصيل المنتج
  function showModal(product) {
    modalDetails.innerHTML = `
      <img src="${product.image}" alt="${product.name}" style="width:100%;height:120px;object-fit:contain;margin-bottom:1rem;">
      <h3>${product.name}</h3>
      <div class="price">${product.price} د.أ</div>
      <p>${product.description}</p>
      <div style="margin:12px 0;display:flex;align-items:center;gap:12px;justify-content:center;">
        <label style="font-size:0.95em;">الكمية:</label>
        <button id="modal-qty-minus" style="width:28px;height:28px;font-size:1.2em;">-</button>
        <span id="modal-qty-value" style="min-width:24px;display:inline-block;text-align:center;">1</span>
        <button id="modal-qty-plus" style="width:28px;height:28px;font-size:1.2em;">+</button>
        <button id="modal-add-to-cart" style="margin-right:10px;">أضف إلى السلة</button>
      </div>
    `;
    modal.style.display = 'flex';
    let qty = 1;
    const qtyValue = document.getElementById('modal-qty-value');
    document.getElementById('modal-qty-minus').onclick = function() {
      qty = Math.max(1, qty - 1);
      qtyValue.textContent = qty;
    };
    document.getElementById('modal-qty-plus').onclick = function() {
      qty = qty + 1;
      qtyValue.textContent = qty;
    };
    document.getElementById('modal-add-to-cart').onclick = function() {
      addToCart(product.id, qty);
    };
  }
  closeModal.onclick = () => {
    modal.style.display = 'none';
  };
  window.onclick = e => {
    if (e.target === modal) modal.style.display = 'none';
  };

  // إضافة للسلة (localStorage)
  function addToCart(id, qty = 1) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex(item => item.id === id);
    if (idx > -1) {
      cart[idx].qty += qty;
    } else {
      cart.push({ id, qty });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert('تمت إضافة المنتج إلى السلة!');
  }

  // تحديث عداد السلة
  function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    let count = cart.reduce((sum, item) => sum + item.qty, 0);
    let badge = document.getElementById('cartCount');
    if (badge) {
      badge.textContent = count > 0 ? count : '';
    }
  }

  // عند تحميل الصفحة، حدث العداد
  updateCartCount();
}); 