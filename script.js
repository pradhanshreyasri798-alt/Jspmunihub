const productGrid = document.getElementById('productGrid');
const cartItems = document.getElementById('cartItems');
const subtotalEl = document.getElementById('subtotal');
const sellForm = document.getElementById('sellForm');
const checkoutBtn = document.getElementById('checkoutBtn');
const payNowBtn = document.getElementById('payNowBtn');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');

let products = [];
let cart = [];
let activeCategory = 'All';

function formatPrice(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    products = await res.json();
    renderProducts();
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

function renderProducts() {
  const searchQuery = searchInput.value.trim().toLowerCase();
  const filtered = products.filter(product => {
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      product.title.toLowerCase().includes(searchQuery) ||
      product.description.toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  productGrid.innerHTML = filtered.map(product => `
    <article class="product-card">
      <img src="${product.image}" alt="${product.title}" />
      <div class="product-body">
        <div class="product-head">
          <h3>${product.title}</h3>
          <span class="pill">${product.condition}</span>
        </div>
        <div class="meta-row">
          <span>${product.location}</span>
          <span>${product.seller}</span>
        </div>
        <div class="price">${formatPrice(product.price)}</div>
        <p class="product-desc">${product.description}</p>
        <button class="add-btn" data-id="${product.id}">Add to Cart</button>
      </div>
    </article>
  `).join('');

  productGrid.querySelectorAll('.add-btn').forEach(button => {
    button.addEventListener('click', () => addToCart(Number(button.dataset.id)));
  });
}

function addToCart(productId) {
  const product = products.find(item => item.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  renderCart();
}

function renderCart() {
  if (!cart.length) {
    cartItems.innerHTML = '<p class="empty-cart">Cart is empty.</p>';
    subtotalEl.textContent = formatPrice(0);
    return;
  }

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.title}" />
      <div class="cart-item-info">
        <h4>${item.title}</h4>
        <p>${formatPrice(item.price)} × ${item.quantity}</p>
      </div>
      <button class="remove-btn" data-id="${item.id}" aria-label="Remove">×</button>
    </div>
  `).join('');

  cartItems.querySelectorAll('.remove-btn').forEach(button => {
    button.addEventListener('click', () => removeFromCart(Number(button.dataset.id)));
  });

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  subtotalEl.textContent = formatPrice(subtotal);
}

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    activeCategory = button.dataset.category;
    renderProducts();
  });
});

searchInput.addEventListener('input', renderProducts);

sellForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(sellForm);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch('/api/sell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.message || 'Unable to list product.');
      return;
    }

    alert(result.message);
    sellForm.reset();
    fetchProducts();
  } catch (error) {
    console.error('Sell error:', error);
    alert('Something went wrong while listing your product.');
  }
});

async function handleCheckout() {
  if (!cart.length) {
    alert('Your cart is empty.');
    return;
  }

  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart })
    });

    const result = await res.json();

    if (result.demoMode) {
      alert(result.message);
      window.location.href = result.checkoutUrl;
      return;
    }

    if (result.url) {
      window.location.href = result.url;
    } else {
      alert('Checkout failed. Please try again.');
    }
  } catch (error) {
    console.error('Checkout error:', error);
    alert('Payment failed. Please try again.');
  }
}

checkoutBtn.addEventListener('click', handleCheckout);
payNowBtn.addEventListener('click', handleCheckout);

fetchProducts();
renderCart();