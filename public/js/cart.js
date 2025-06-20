document.addEventListener('DOMContentLoaded', () => {
  // تحديث عداد السلة
  function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    let count = cart.reduce((sum, item) => sum + item.qty, 0);
    let badge = document.getElementById('cartCount');
    if (badge) {
      badge.textContent = count > 0 ? count : '';
    }
  }
  updateCartCount();

  // تحميل المنتجات من ملف JSON
  let products = [];
  fetch('products.json')
    .then(res => res.json())
    .then(data => {
      products = data;
      localStorage.setItem('productsCache', JSON.stringify(products));
      renderCart();
    });

  function renderCart() {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const showShippingFormBtn = document.getElementById('showShippingFormBtn');
    const shippingForm = document.getElementById('shippingForm');
    cartItems.innerHTML = '';
    if (cart.length === 0) {
      cartItems.innerHTML = `
        <div class="cart-container">
          <h2>سلتك فارغة!</h2>
          <a href="products.html" class="shop-now-btn">تسوق الآن</a>
        </div>
      `;
      cartTotal.textContent = '';
      if (showShippingFormBtn) showShippingFormBtn.style.display = 'none';
      if (shippingForm) shippingForm.style.display = 'none';
      return;
    }
    let total = 0;
    cart.forEach(item => {
      const product = products.find(p => p.id === item.id);
      if (!product) return;
      total += product.price * item.qty;
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div class="cart-item-content" style="cursor: pointer;">
          <img src="${product.image}" alt="${product.name}">
          <div class="cart-item-details">
            <div class="cart-item-title">${product.name}</div>
            <div class="cart-item-qty" style="display:flex;align-items:center;gap:7px;">
              <span style="color: #666;margin-left: 5px;">الكمية:</span>
              <button class="qty-btn minus" data-id="${item.id}" style="width:28px;height:28px;font-size:1.2em;">-</button>
              <span class="qty-value" id="qty-value-${item.id}" style="min-width:24px;display:inline-block;text-align:center;">${item.qty}</span>
              <button class="qty-btn plus" data-id="${item.id}" style="width:28px;height:28px;font-size:1.2em;">+</button>
            </div>
            <div class="cart-item-price">السعر: ${product.price} د.أ</div>
          </div>
        </div>
        <button class="cart-item-remove" data-id="${item.id}">×</button>
      `;

      // إضافة مستمع حدث للنقر على المنتج
      const itemContent = div.querySelector('.cart-item-content');
      itemContent.addEventListener('click', () => showProductDetails(product));

      div.querySelector('.cart-item-remove').onclick = function(e) {
        e.stopPropagation(); // منع فتح النافذة المنبثقة عند النقر على زر الحذف
        removeFromCart(item.id);
      };
      div.querySelector('.qty-btn.minus').onclick = function(e) {
        e.stopPropagation(); // منع فتح النافذة المنبثقة عند النقر على زر التقليل
        changeItemQty(item.id, -1);
      };
      div.querySelector('.qty-btn.plus').onclick = function(e) {
        e.stopPropagation(); // منع فتح النافذة المنبثقة عند النقر على زر الزيادة
        changeItemQty(item.id, 1);
      };
      cartItems.appendChild(div);
    });
    cartTotal.textContent = `الإجمالي: ${total} د.أ`;
    if (showShippingFormBtn) showShippingFormBtn.style.display = 'block';
    if (shippingForm) shippingForm.style.display = 'none';
  }

  function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
  }

  // إظهار نموذج التوصيل عند الضغط على زر إتمام الشراء
  const showShippingFormBtn = document.getElementById('showShippingFormBtn');
  const shippingForm = document.getElementById('shippingForm');
  if (showShippingFormBtn && shippingForm) {
    showShippingFormBtn.addEventListener('click', function() {
      shippingForm.style.display = 'block';
      showShippingFormBtn.style.display = 'none';
      shippingForm.scrollIntoView({behavior: 'smooth'});
    });
  }

  // إظهار أو إخفاء نموذج PayPal حسب اختيار طريقة الدفع
  const paymentMethod = document.getElementById('paymentMethod');
  const paypalContainer = document.getElementById('paypal-button-container');
  const paypalBtn = document.getElementById('paypal-checkout-btn');
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (paymentMethod && paypalContainer && paypalBtn && checkoutBtn) {
    paymentMethod.addEventListener('change', function() {
      if (paymentMethod.value === 'paypal') {
        paypalBtn.style.display = 'block';
        if (checkoutBtn) checkoutBtn.style.display = 'none';
      } else {
        paypalBtn.style.display = 'none';
        paypalContainer.style.display = 'none';
        paypalContainer.innerHTML = '';
        if (checkoutBtn) checkoutBtn.style.display = 'block';
      }
    });
  }

  // زر PayPal منفصل
  if (paypalBtn) {
    paypalBtn.addEventListener('click', function() {
      // تحقق من تعبئة جميع الحقول المطلوبة في نموذج التواصل
      const requiredFields = ['fullname', 'phone', 'address', 'city'];
      let valid = true;
      requiredFields.forEach(field => {
        const input = shippingForm.querySelector(`[name="${field}"]`);
        if (!input || !input.value.trim()) {
          valid = false;
        }
      });
      if (!valid) {
        alert('يرجى تعبئة نموذج التواصل قبل الدفع عبر PayPal');
        return;
      }
      paypalContainer.style.display = 'block';
      renderPayPalButton();
      paypalBtn.style.display = 'none';
    });
  }

  // التعامل مع نموذج التوصيل (الدفع عند الاستلام فقط)
  if (shippingForm) {
    shippingForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const formData = new FormData(shippingForm);
      const shippingData = {
        fullname: formData.get('fullname'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        city: formData.get('city'),
        notes: formData.get('notes')
      };
      localStorage.setItem('shippingData', JSON.stringify(shippingData));
      const paymentMethodValue = formData.get('paymentMethod');
      
      // إرسال الطلب إلى backend
      await sendOrderToEmail(shippingData, paymentMethodValue);
      
      if (paymentMethodValue === 'cod') {
        window.location.href = 'confirm.html';
      }
    });
  }

  // دالة إرسال الطلب إلى الإيميل
  async function sendOrderToEmail(shippingData, paymentMethod) {
    console.log('sendOrderToEmail function called'); // للتأكد من استدعاء الدالة
    
    // Determine the correct API URL based on the environment
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const apiUrl = isLocal ? 'http://localhost:3001' : 'https://zomstore-backend.onrender.com'; // Replace with your actual deployed backend URL

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const products = JSON.parse(localStorage.getItem('productsCache') || '[]');
    let total = 0;
    
    cart.forEach(item => {
      const product = products.find(p => p.id === item.id);
      if (product) total += product.price * item.qty;
    });

    console.log('Sending order to backend:', { cart, shippingData, total, paymentMethod }); // للتأكد من البيانات

    try {
      const response = await fetch(`${apiUrl}/api/send-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart, shippingData, total, paymentMethod })
      });
      
      console.log('Backend response:', response); // للتأكد من الاستجابة
      
      const data = await response.json();
      if (data.success) {
        console.log('Order sent successfully');
        window.location.href = 'confirm.html';
      } else {
        console.error('Failed to send order:', data.error);
        alert('حدث خطأ أثناء إرسال الطلب: ' + data.error);
      }
    } catch (error) {
      console.error('Error sending order:', error);
      alert('حدث خطأ أثناء إرسال الطلب: ' + error.message);
    }
  }

  // إرسال الطلب بعد الدفع عبر PayPal
  function sendPayPalOrder() {
    const shippingData = JSON.parse(localStorage.getItem('shippingData') || '{}');
    sendOrderToEmail(shippingData, 'paypal');
  }

  // تهيئة زر PayPal
  function renderPayPalButton() {
    console.log('renderPayPalButton called');
    if (paypalContainer.innerHTML) return;
    const PAYPAL_CLIENT_ID = 'AdIWIc23WDEKm29jvj-FOvNq5GlF_9U2BgZE3_GPGBJIg1KOpxbkewQuY2UztgmucxiPLGzCmGn1qnbC';
    console.log('PayPal Client ID:', PAYPAL_CLIENT_ID);
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    script.onload = () => {
      console.log('PayPal script loaded successfully');
      window.paypal.Buttons({
        createOrder: function(data, actions) {
          console.log('createOrder called');
          let cart = JSON.parse(localStorage.getItem('cart') || '[]');
          let products = JSON.parse(localStorage.getItem('productsCache') || '[]');
          let total = 0;
          cart.forEach(item => {
            const product = products.find(p => p.id === item.id);
            if (product) total += product.price * item.qty;
          });
          console.log('Total amount:', total);
          const totalUSD = (total * 1.41).toFixed(2);
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: totalUSD,
                currency_code: 'USD'
              }
            }]
          });
        },
        onApprove: function(data, actions) {
          console.log('Payment approved');
          return actions.order.capture().then(function(details) {
            console.log('Payment captured:', details);
            const shippingData = JSON.parse(localStorage.getItem('shippingData') || '{}');
            sendOrderToEmail(shippingData, 'paypal');
            window.location.href = 'confirm.html';
          });
        }
      }).render('#paypal-button-container');
    };
    script.onerror = (error) => {
      console.error('PayPal script failed to load:', error);
    };
    document.body.appendChild(script);
  }

  // دالة تغيير كمية منتج في السلة عبر الأزرار
  function changeItemQty(id, delta) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex(item => item.id === id);
    if (idx > -1) {
      cart[idx].qty = Math.max(1, cart[idx].qty + delta);
      localStorage.setItem('cart', JSON.stringify(cart));
      renderCart();
      updateCartCount();
    }
  }

  // دالة عرض تفاصيل المنتج
  function showProductDetails(product) {
    const modal = document.getElementById('cartItemModal');
    const modalContent = document.getElementById('modalContent');
    
    modalContent.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <div class="price">السعر: ${product.price} د.أ</div>
      <div class="description">${product.description || 'لا يوجد وصف متاح'}</div>
      <div class="category">التصنيف: ${product.category}</div>
    `;
    
    modal.classList.add('active');

    // إغلاق النافذة المنبثقة
    const closeBtn = modal.querySelector('.cart-item-modal-close');
    const closeModal = () => {
      modal.classList.remove('active');
    };

    closeBtn.onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) {
        closeModal();
      }
    };
  }
}); 
