// Main application JavaScript
const API_BASE = '/api';

// Helper function to make authenticated API calls
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });
    
    return response.json();
}

// Check authentication status and update navigation
async function updateNavigation() {
    const token = localStorage.getItem('token');
    const isAuthenticated = !!token;
    
    // Show/hide desktop navigation links
    const dashboardLink = document.getElementById('nav-dashboard');
    const adminLink = document.getElementById('nav-admin');
    const profileLink = document.getElementById('nav-profile');
    const logoutLink = document.getElementById('nav-logout');
    const guestLinks = document.querySelectorAll('.guest-link');
    
    // Show/hide mobile navigation links
    const mobileDashboardLink = document.getElementById('mobile-nav-dashboard');
    const mobileAdminLink = document.getElementById('mobile-nav-admin');
    const mobileProfileLink = document.getElementById('mobile-nav-profile');
    const mobileLogoutLink = document.getElementById('mobile-nav-logout');
    
    if (isAuthenticated) {
        // Show authenticated links (desktop)
        if (dashboardLink) {
            dashboardLink.classList.remove('hidden');
            dashboardLink.style.display = 'flex';
        }
        if (profileLink) {
            profileLink.classList.remove('hidden');
            profileLink.style.display = 'flex';
        }
        if (logoutLink) {
            logoutLink.classList.remove('hidden');
            logoutLink.style.display = 'flex';
        }
        
        // Show authenticated links (mobile)
        if (mobileDashboardLink) {
            mobileDashboardLink.classList.remove('hidden');
        }
        if (mobileProfileLink) {
            mobileProfileLink.classList.remove('hidden');
        }
        if (mobileLogoutLink) {
            mobileLogoutLink.classList.remove('hidden');
        }
        
        // Hide guest links
        guestLinks.forEach(link => {
            link.style.display = 'none';
        });
        
        // Check if user is admin and show admin portal link
        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (result.success && result.data && result.data.is_admin) {
                // Show admin link (desktop)
                if (adminLink) {
                    adminLink.classList.remove('hidden');
                    adminLink.style.display = 'flex';
                }
                // Show admin link (mobile)
                if (mobileAdminLink) {
                    mobileAdminLink.classList.remove('hidden');
                }
            } else {
                // Hide admin link (desktop)
                if (adminLink) {
                    adminLink.classList.add('hidden');
                    adminLink.style.display = 'none';
                }
                // Hide admin link (mobile)
                if (mobileAdminLink) {
                    mobileAdminLink.classList.add('hidden');
                }
            }
            // Role-based dashboard routing: point Dashboard link to appropriate dashboard and hide client-only links from providers
            if (result.success && result.data) {
                const role = result.data.role;
                const isProvider = role === 'driver' || role === 'professional' || role === 'service-provider';
                const clientOnlyLinks = document.querySelectorAll('.client-only');
                
                if (role === 'driver') {
                    if (dashboardLink) dashboardLink.href = '/driver-dashboard';
                    if (mobileDashboardLink) mobileDashboardLink.href = '/driver-dashboard';
                } else if (role === 'professional') {
                    if (dashboardLink) dashboardLink.href = '/professional-dashboard';
                    if (mobileDashboardLink) mobileDashboardLink.href = '/professional-dashboard';
                } else if (role === 'service-provider') {
                    if (dashboardLink) dashboardLink.href = '/service-provider-dashboard';
                    if (mobileDashboardLink) mobileDashboardLink.href = '/service-provider-dashboard';
                } else {
                    if (dashboardLink) dashboardLink.href = '/dashboard';
                    if (mobileDashboardLink) mobileDashboardLink.href = '/dashboard';
                }
                
                // Hide client-only options (Request Cab/Professional/Service Provider) from providers
                if (isProvider) {
                    clientOnlyLinks.forEach(el => { el.style.display = 'none'; el.classList.add('hidden'); });
                    document.querySelectorAll('.hide-for-drivers').forEach(el => { el.style.display = 'none'; });
                } else {
                    clientOnlyLinks.forEach(el => { el.style.display = ''; el.classList.remove('hidden'); });
                    document.querySelectorAll('.hide-for-drivers').forEach(el => { el.style.display = ''; });
                }
                // Shop and Cart are available for all roles (client, driver, professional, service-provider)
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
            // Hide admin links on error
            if (adminLink) {
                adminLink.classList.add('hidden');
                adminLink.style.display = 'none';
            }
            if (mobileAdminLink) {
                mobileAdminLink.classList.add('hidden');
            }
        }
    } else {
        // Hide authenticated links (desktop)
        if (dashboardLink) {
            dashboardLink.classList.add('hidden');
            dashboardLink.style.display = 'none';
        }
        if (adminLink) {
            adminLink.classList.add('hidden');
            adminLink.style.display = 'none';
        }
        if (profileLink) {
            profileLink.classList.add('hidden');
            profileLink.style.display = 'none';
        }
        if (logoutLink) {
            logoutLink.classList.add('hidden');
            logoutLink.style.display = 'none';
        }
        // Hide authenticated links (mobile)
        if (mobileDashboardLink) {
            mobileDashboardLink.classList.add('hidden');
        }
        if (mobileAdminLink) {
            mobileAdminLink.classList.add('hidden');
        }
        if (mobileProfileLink) {
            mobileProfileLink.classList.add('hidden');
        }
        if (mobileLogoutLink) {
            mobileLogoutLink.classList.add('hidden');
        }
        // Show client-only links and shop/cart when not authenticated
        document.querySelectorAll('.client-only').forEach(el => {
            el.style.display = '';
            el.classList.remove('hidden');
        });
        document.querySelectorAll('.hide-for-drivers').forEach(el => { el.style.display = ''; });
        // Shop/Cart visible for guests (no role-based hiding)
        if (dashboardLink) dashboardLink.href = '/dashboard';
        if (mobileDashboardLink) mobileDashboardLink.href = '/dashboard';
        // Show guest links
        guestLinks.forEach(link => {
            link.style.display = 'flex';
        });
    }
}

// Hamburger menu toggle functionality
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const hamburgerIcon = document.getElementById('hamburgerIcon');
    const closeIcon = document.getElementById('closeIcon');
    
    if (mobileMenu && hamburgerIcon && closeIcon) {
        mobileMenu.classList.toggle('active');
        
        if (mobileMenu.classList.contains('active')) {
            hamburgerIcon.classList.add('hidden');
            closeIcon.classList.remove('hidden');
        } else {
            hamburgerIcon.classList.remove('hidden');
            closeIcon.classList.add('hidden');
        }
    }
}

// Close mobile menu when clicking outside or on a link
function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const hamburgerIcon = document.getElementById('hamburgerIcon');
    const closeIcon = document.getElementById('closeIcon');
    
    if (mobileMenu && mobileMenu.classList.contains('active')) {
        mobileMenu.classList.remove('active');
        hamburgerIcon.classList.remove('hidden');
        closeIcon.classList.add('hidden');
    }
}

// Handle login required modal for request links when not authenticated
document.addEventListener('DOMContentLoaded', function() {
    updateNavigation();
    
    // Hamburger menu button event listener
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Close mobile menu when clicking on a link
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Small delay to allow navigation
            setTimeout(closeMobileMenu, 100);
        });
    });
    
    // Close mobile menu when clicking outside (on the backdrop)
    document.addEventListener('click', function(e) {
        const mobileMenu = document.getElementById('mobileMenu');
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        
        if (mobileMenu && hamburgerBtn && 
            !mobileMenu.contains(e.target) && 
            !hamburgerBtn.contains(e.target) &&
            mobileMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    });
    
    // Close mobile menu when window is resized to desktop size
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768) {
            closeMobileMenu();
        }
    });
    
    // Update mobile cart badge
    const mobileCartBadge = document.getElementById('mobileCartBadge');
    const mobileCartIcon = document.getElementById('mobileCartIcon');
    if (mobileCartBadge && mobileCartIcon) {
        const itemCount = getCartItemCount();
        if (itemCount > 0) {
            mobileCartBadge.classList.remove('hidden');
        } else {
            mobileCartBadge.classList.add('hidden');
        }
    }
    
    const modal = document.getElementById('loginRequiredModal');
    // Handle request links (Driver, Professional, Service Provider) - show modal if not authenticated
    const requestLinks = document.querySelectorAll('a[href^="/request-"]');
    if (requestLinks.length > 0) {
        requestLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const token = localStorage.getItem('token');
                if (!token) {
                    e.preventDefault();
                    // Show login required modal (cannot be dismissed)
                    if (modal) {
                        modal.classList.remove('hidden');
                        modal.style.display = 'flex';
                    }
                }
            });
        });
    }
    
    // Check if user is on a request page: show login modal if not logged in; redirect providers to their dashboards
    if (window.location.pathname.startsWith('/request-')) {
        const token = localStorage.getItem('token');
        if (!token && modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        } else if (token) {
            fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(r => r.json())
                .then(result => {
                    if (result.success && result.data) {
                        const role = result.data.role;
                        if (role === 'driver') {
                            window.location.href = '/driver-dashboard';
                        } else if (role === 'professional') {
                            window.location.href = '/professional-dashboard';
                        } else if (role === 'service-provider') {
                            window.location.href = '/service-provider-dashboard';
                        }
                    }
                })
                .catch(() => {});
        }
    }
    
    // Keep old request-link handling for backward compatibility if any exist
    const oldRequestLinks = document.querySelectorAll('.request-link');
    
    if (modal && oldRequestLinks.length > 0) {
        oldRequestLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const token = localStorage.getItem('token');
                if (!token) {
                    e.preventDefault();
                    modal.classList.remove('hidden');
                    modal.style.display = 'flex';
                }
            });
        });
    }
    
    // Ensure modal is properly hidden on pages where it shouldn't show
    // Note: Modal cannot be dismissed when shown for request pages (per spec)
    // Only allow closing if user is logged in (modal might be used elsewhere)
    if (modal) {
        modal.addEventListener('click', function(e) {
            // Don't allow closing if on request page and not logged in
            if (window.location.pathname.startsWith('/request-')) {
                const token = localStorage.getItem('token');
                if (!token) {
                    // Modal cannot be dismissed on request pages when not logged in
                    return;
                }
            }
            // Allow closing only if clicked on backdrop and not on request page
            if (e.target === modal && !window.location.pathname.startsWith('/request-')) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        });
    }
});

// Cart management functions
function getCart() {
    const cartJson = localStorage.getItem('cart');
    return cartJson ? JSON.parse(cartJson) : [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartIcon();
}

function addToCart(productId, productName, productPrice, productImage, quantity = 1) {
    let cart = getCart();
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: productPrice,
            image: productImage,
            quantity: quantity
        });
    }
    
    saveCart(cart);
    return cart;
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    return cart;
}

function updateCartQuantity(productId, quantity) {
    let cart = getCart();
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (quantity <= 0) {
            return removeFromCart(productId);
        }
        item.quantity = quantity;
        saveCart(cart);
    }
    return cart;
}

function getCartItemCount() {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
}

function updateCartIcon() {
    const cartBadge = document.getElementById('cartBadge');
    const cartIcon = document.getElementById('cartIcon');
    const mobileCartBadge = document.getElementById('mobileCartBadge');
    const itemCount = getCartItemCount();
    
    if (cartBadge && cartIcon) {
        if (itemCount > 0) {
            cartBadge.classList.remove('hidden');
        } else {
            cartBadge.classList.add('hidden');
        }
    }
    
    // Update mobile cart badge
    if (mobileCartBadge) {
        if (itemCount > 0) {
            mobileCartBadge.classList.remove('hidden');
        } else {
            mobileCartBadge.classList.add('hidden');
        }
    }
}

// Update cart icon on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartIcon();
});

// Export for use in templates
window.apiCall = apiCall;
window.getCart = getCart;
window.saveCart = saveCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.getCartItemCount = getCartItemCount;
window.updateCartIcon = updateCartIcon;

