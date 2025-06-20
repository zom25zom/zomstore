document.addEventListener("DOMContentLoaded", function() {
    const cartCount = document.getElementById('cartCount');

    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        
        if (cartCount) {
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'inline-block' : 'none';
        }
    }
    
    updateCartCount();

    // Listen for custom event to update cart count from other pages
    window.addEventListener('cartUpdated', function() {
        updateCartCount();
    });

    // Hamburger Menu Logic
    const hamburger = document.querySelector('.hamburger-menu');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
}); 