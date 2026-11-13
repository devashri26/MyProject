/* ==========================================================================
   ShopEasy - E-Commerce JavaScript Functionality
   Beginner-friendly, modular code with localStorage persistence.
   ========================================================================== */

// Key used for saving cart data into the browser's localStorage
const CART_STORAGE_KEY = 'shopeasy_cart';

/* --------------------------------------------------------------------------
   1. Cart Storage Helper Functions
   -------------------------------------------------------------------------- */

/**
 * Retrieves the current cart array from localStorage.
 * If no cart exists, returns an empty array.
 */
function getCart() {
  const savedCart = localStorage.getItem(CART_STORAGE_KEY);
  if (savedCart) {
    try {
      return JSON.parse(savedCart);
    } catch (e) {
      console.error('Error parsing cart from localStorage:', e);
      return [];
    }
  }
  return [];
}

/**
 * Saves the given cart array into localStorage and updates navbar badge.
 * @param {Array} cart - Array of cart item objects
 */
function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  updateCartBadge();
}

/**
 * Calculates total number of items in the cart and updates all cart badges.
 * Works across index.html, about.html, and contact.html.
 */
function updateCartBadge() {
  const cart = getCart();
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const badgeElements = document.querySelectorAll('.cart-badge');
  badgeElements.forEach((badge) => {
    badge.textContent = totalCount;
  });
}

/* --------------------------------------------------------------------------
   2. Cart Operations (Add, Update Quantity, Remove)
   -------------------------------------------------------------------------- */

/**
 * Adds a product to the shopping cart.
 * If already in cart, increments quantity. Otherwise, adds new item.
 */
function addToCart(productId, name, price, image) {
  const cart = getCart();

  // Check if item already exists in cart
  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: productId,
      name: name,
      price: parseFloat(price),
      image: image,
      quantity: 1
    });
  }

  saveCart(cart);

  // If the cart section is on the current page, re-render it
  renderCart();

  // Show a user-friendly toast notification
  showToast(`Added "${name}" to your cart!`);
}

/**
 * Adjusts the quantity of a product in the cart (+1 or -1).
 * If quantity drops below 1, removes the item.
 */
function updateQuantity(productId, change) {
  let cart = getCart();
  const item = cart.find((item) => item.id === productId);

  if (item) {
    item.quantity += change;

    // Remove if quantity becomes 0 or less
    if (item.quantity <= 0) {
      cart = cart.filter((item) => item.id !== productId);
      showToast('Item removed from cart');
    }
  }

  saveCart(cart);
  renderCart();
}

/**
 * Removes a product completely from the shopping cart.
 */
function removeFromCart(productId) {
  let cart = getCart();
  const removedItem = cart.find((item) => item.id === productId);
  cart = cart.filter((item) => item.id !== productId);

  saveCart(cart);
  renderCart();

  if (removedItem) {
    showToast(`Removed "${removedItem.name}" from your cart`);
  }
}

/**
 * Clears all items from the cart.
 */
function clearCart() {
  saveCart([]);
  renderCart();
  showToast('Your shopping cart has been cleared');
}

/* --------------------------------------------------------------------------
   3. Render Cart on Homepage
   -------------------------------------------------------------------------- */

/**
 * Renders the cart items, subtotal, and total dynamically into the DOM.
 */
function renderCart() {
  const cartContainer = document.getElementById('cart-items');
  const cartSummary = document.getElementById('cart-summary');
  const emptyCartMessage = document.getElementById('cart-empty-state');
  const totalPriceElem = document.getElementById('cart-total-price');
  const subtotalPriceElem = document.getElementById('cart-subtotal-price');
  const totalItemsElem = document.getElementById('cart-total-items');
  const checkoutBtn = document.getElementById('checkout-btn');

  // If we are not on the homepage (cart elements don't exist), exit gracefully
  if (!cartContainer) return;

  const cart = getCart();

  // If cart is empty
  if (cart.length === 0) {
    cartContainer.innerHTML = '';
    if (emptyCartMessage) emptyCartMessage.style.display = 'block';
    if (totalPriceElem) totalPriceElem.textContent = '$0.00';
    if (subtotalPriceElem) subtotalPriceElem.textContent = '$0.00';
    if (totalItemsElem) totalItemsElem.textContent = '0';
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.style.opacity = '0.6';
      checkoutBtn.style.cursor = 'not-allowed';
    }
    return;
  }

  // Cart has items: hide empty message and enable checkout button
  if (emptyCartMessage) emptyCartMessage.style.display = 'none';
  if (checkoutBtn) {
    checkoutBtn.disabled = false;
    checkoutBtn.style.opacity = '1';
    checkoutBtn.style.cursor = 'pointer';
  }

  // Calculate totals
  let totalItems = 0;
  let totalPrice = 0;

  // Build HTML for cart items
  let cartHTML = '';
  cart.forEach((item) => {
    const itemSubtotal = item.price * item.quantity;
    totalItems += item.quantity;
    totalPrice += itemSubtotal;

    cartHTML += `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <span class="cart-item-price">$${item.price.toFixed(2)} each</span>
        </div>
        <div class="quantity-control">
          <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)" title="Decrease quantity" aria-label="Decrease quantity">-</button>
          <span class="qty-number">${item.quantity}</span>
          <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)" title="Increase quantity" aria-label="Increase quantity">+</button>
        </div>
        <div class="cart-item-subtotal">$${itemSubtotal.toFixed(2)}</div>
        <div class="cart-item-remove">
          <button class="btn btn-danger" onclick="removeFromCart('${item.id}')" title="Remove item">Remove</button>
        </div>
      </div>
    `;
  });

  cartContainer.innerHTML = cartHTML;

  // Update Summary numbers
  if (totalPriceElem) totalPriceElem.textContent = `$${totalPrice.toFixed(2)}`;
  if (subtotalPriceElem) subtotalPriceElem.textContent = `$${totalPrice.toFixed(2)}`;
  if (totalItemsElem) totalItemsElem.textContent = totalItems.toString();
}

/* --------------------------------------------------------------------------
   4. Checkout Functionality
   -------------------------------------------------------------------------- */

/**
 * Handles the checkout process.
 * Verifies cart items and displays confirmation modal.
 */
function handleCheckout() {
  const cart = getCart();

  if (cart.length === 0) {
    alert('Your shopping cart is empty! Please add some products first.');
    return;
  }

  // Calculate final order total
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Generate a random Order ID (e.g., SE-84920)
  const randomOrderId = 'SE-' + Math.floor(10000 + Math.random() * 90000);

  // Populate modal details
  const modalOrderId = document.getElementById('modal-order-id');
  const modalOrderTotal = document.getElementById('modal-order-total');
  const modalOrderItems = document.getElementById('modal-order-items');
  const checkoutModal = document.getElementById('checkout-modal');

  if (modalOrderId) modalOrderId.textContent = randomOrderId;
  if (modalOrderTotal) modalOrderTotal.textContent = `$${totalAmount.toFixed(2)}`;
  if (modalOrderItems) modalOrderItems.textContent = `${totalItemsCount} item(s)`;

  if (checkoutModal) {
    checkoutModal.classList.add('active');
  } else {
    // Fallback simple alert if modal is not in DOM
    alert(`Thank you for shopping with ShopEasy!\n\nOrder ID: ${randomOrderId}\nTotal: $${totalAmount.toFixed(2)}\nYour order has been placed successfully!`);
  }

  // Clear cart after checkout
  saveCart([]);
  renderCart();
}

/**
 * Closes the checkout modal.
 */
function closeCheckoutModal() {
  const checkoutModal = document.getElementById('checkout-modal');
  if (checkoutModal) {
    checkoutModal.classList.remove('active');
  }
}

/* --------------------------------------------------------------------------
   5. Toast Notification System
   -------------------------------------------------------------------------- */

/**
 * Displays a non-intrusive floating toast notification.
 */
function showToast(message) {
  let toast = document.getElementById('global-toast');

  // Create toast element if it doesn't already exist
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast toast-success';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');

  // Hide toast after 2.5 seconds
  if (window.toastTimeout) {
    clearTimeout(window.toastTimeout);
  }

  window.toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

/* --------------------------------------------------------------------------
   6. Contact Form Validation
   -------------------------------------------------------------------------- */

/**
 * Sets up and validates the contact form on contact.html.
 */
function setupContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const subjectInput = document.getElementById('subject');
  const messageInput = document.getElementById('message');
  const successMessage = document.getElementById('form-success-message');

  // Helper to show error
  function setError(inputElem, errorId, message) {
    const errorElem = document.getElementById(errorId);
    const formGroup = inputElem.closest('.form-group');
    if (formGroup) formGroup.classList.add('has-error');
    if (errorElem) errorElem.textContent = message;
  }

  // Helper to clear error
  function clearError(inputElem, errorId) {
    const errorElem = document.getElementById(errorId);
    const formGroup = inputElem.closest('.form-group');
    if (formGroup) formGroup.classList.remove('has-error');
    if (errorElem) errorElem.textContent = '';
  }

  // Email format regex pattern
  function isValidEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }

  // Clear errors on real-time input
  nameInput.addEventListener('input', () => clearError(nameInput, 'name-error'));
  emailInput.addEventListener('input', () => clearError(emailInput, 'email-error'));
  subjectInput.addEventListener('input', () => clearError(subjectInput, 'subject-error'));
  messageInput.addEventListener('input', () => clearError(messageInput, 'message-error'));

  // Form submit event handler
  contactForm.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent default page refresh

    let isValid = true;

    // 1. Validate Name
    const nameVal = nameInput.value.trim();
    if (nameVal === '') {
      setError(nameInput, 'name-error', 'Please enter your name.');
      isValid = false;
    } else if (nameVal.length < 2) {
      setError(nameInput, 'name-error', 'Name must be at least 2 characters.');
      isValid = false;
    } else {
      clearError(nameInput, 'name-error');
    }

    // 2. Validate Email
    const emailVal = emailInput.value.trim();
    if (emailVal === '') {
      setError(emailInput, 'email-error', 'Please enter your email address.');
      isValid = false;
    } else if (!isValidEmail(emailVal)) {
      setError(emailInput, 'email-error', 'Please enter a valid email address.');
      isValid = false;
    } else {
      clearError(emailInput, 'email-error');
    }

    // 3. Validate Subject
    const subjectVal = subjectInput.value.trim();
    if (subjectVal === '') {
      setError(subjectInput, 'subject-error', 'Please enter a subject.');
      isValid = false;
    } else if (subjectVal.length < 3) {
      setError(subjectInput, 'subject-error', 'Subject must be at least 3 characters.');
      isValid = false;
    } else {
      clearError(subjectInput, 'subject-error');
    }

    // 4. Validate Message
    const messageVal = messageInput.value.trim();
    if (messageVal === '') {
      setError(messageInput, 'message-error', 'Please enter your message.');
      isValid = false;
    } else if (messageVal.length < 10) {
      setError(messageInput, 'message-error', 'Message must be at least 10 characters long.');
      isValid = false;
    } else {
      clearError(messageInput, 'message-error');
    }

    // If validation fails, stop submission
    if (!isValid) return;

    // Successful Submission: Show UI message and reset form
    if (successMessage) {
      successMessage.classList.add('show');
      successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    contactForm.reset();

    // Auto-hide the success message after 6 seconds
    setTimeout(() => {
      if (successMessage) {
        successMessage.classList.remove('show');
      }
    }, 6000);
  });
}

/* --------------------------------------------------------------------------
   7. Mobile Navigation Toggle
   -------------------------------------------------------------------------- */
function setupMobileNav() {
  const toggleBtn = document.getElementById('nav-toggle-btn');
  const navMenu = document.getElementById('nav-menu');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });

    // Close menu when a link is clicked
    const navLinks = navMenu.querySelectorAll('.nav-link, .cart-link');
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }
}

/* --------------------------------------------------------------------------
   8. Page Initialization
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Update cart badge count across any page
  updateCartBadge();

  // Set up mobile menu toggle
  setupMobileNav();

  // If on homepage: render shopping cart and attach checkout event
  renderCart();

  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', handleCheckout);
  }

  // If on contact page: set up form validation
  setupContactForm();
});

