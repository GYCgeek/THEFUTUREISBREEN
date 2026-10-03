$(document).ready(function(){
  $('.menu-hamburger').click(function(){
    $('.menu-hamburger').toggleClass('active')
    $('.menu').toggleClass('active')
  });
});

/* ═══════════════════════════════════════════════════════════
   Section ticker – auto-scroll, hover pause, drag + momentum
   ═══════════════════════════════════════════════════════════ */
(function() {
  var ticker = document.getElementById('section-ticker');
  if (!ticker) return;
  var track = ticker.querySelector('.ticker-track');
  if (!track) return;

  var AUTO_SPEED  = -0.6;   // px per frame (negative = leftward)
  var FRICTION    = 0.94;    // velocity decay per frame after release
  var MIN_VEL     = 0.15;    // stop threshold

  var offset   = 0;          // current translateX
  var velocity = 0;          // current drag velocity
  var hovered  = false;
  var dragging = false;
  var wasDragged = false;
  var dragStartX = 0;
  var dragStartOffset = 0;
  var lastDragX = 0;
  var lastDragT = 0;
  var halfWidth = 0;         // width of the first set of buttons (for loop reset)
  var raf;

  function measureHalf() {
    // The track duplicates the full button set once for a seamless loop.
    halfWidth = track.scrollWidth / 2;
  }

  function setTransform() {
    track.style.transform = 'translateX(' + offset + 'px)';
  }

  // ── Seamless loop: when we've scrolled past one full set, jump back ──
  function wrapOffset() {
    if (halfWidth <= 0) return;
    if (offset <= -halfWidth) offset += halfWidth;
    if (offset > 0) offset -= halfWidth;
  }

  // ── Animation loop ──
  function loop() {
    if (!dragging) {
      if (hovered) {
        // Hover = paused, but still decay any fling velocity
        if (Math.abs(velocity) > MIN_VEL) {
          offset += velocity;
          velocity *= FRICTION;
        } else {
          velocity = 0;
        }
      } else {
        // Auto-scroll + decay fling
        if (Math.abs(velocity) > MIN_VEL) {
          offset += velocity;
          velocity *= FRICTION;
        } else {
          velocity = 0;
          offset += AUTO_SPEED;
        }
      }
    }

    wrapOffset();
    setTransform();
    raf = requestAnimationFrame(loop);
  }

  // ── Hover ──
  ticker.addEventListener('mouseenter', function() { hovered = true; });
  ticker.addEventListener('mouseleave', function() { hovered = false; });

  // ── Pointer drag (mouse + touch) ──
  function onPointerDown(e) {
    dragging = true;
    wasDragged = false;
    velocity = 0;
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    dragStartX = clientX;
    dragStartOffset = offset;
    lastDragX = clientX;
    lastDragT = Date.now();
    ticker.style.cursor = 'grabbing';
  }

  function onPointerMove(e) {
    if (!dragging) return;
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var dx = clientX - dragStartX;
    if (Math.abs(dx) > 5) wasDragged = true;
    offset = dragStartOffset + dx;

    // Track velocity for momentum
    var now = Date.now();
    var dt = now - lastDragT || 1;
    velocity = (clientX - lastDragX) / dt * 16; // normalise to ~per-frame
    lastDragX = clientX;
    lastDragT = now;

    e.preventDefault();
  }

  function onPointerUp() {
    if (!dragging) return;
    dragging = false;
    ticker.style.cursor = 'grab';
    // velocity already set from last move — momentum carries on in the loop
  }

  // Mouse events
  ticker.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  // Touch events
  ticker.addEventListener('touchstart', onPointerDown, { passive: false });
  window.addEventListener('touchmove', onPointerMove, { passive: false });
  window.addEventListener('touchend', onPointerUp);

  // ── Click to show section (hide others) ──
  var sectionIds = ['stats','impact-reports','about','rivet-info','values','innovations','movement','gyc-ai-labs','foresight-ie','legal-affairs','champs'];
  // Add .page-section class to toggleable sections on boot.
  // The contact footer stays visible at the bottom, but its ticker button still scrolls to it.
  sectionIds.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('page-section');
  });

  // Default experience: start with About section opened and ticker highlighted.
  (function activateDefaultAboutSection() {
    var defaultId = 'about';
    var target = document.getElementById(defaultId);
    if (!target) return;

    target.classList.add('section-visible');
    var allBtns = ticker.querySelectorAll('.ticker-btn');
    for (var i = 0; i < allBtns.length; i++) {
      if (allBtns[i].getAttribute('data-target') === defaultId) {
        allBtns[i].classList.add('ticker-active');
      }
    }
  })();

  ticker.addEventListener('click', function(e) {
    var btn = e.target.closest('.ticker-btn');
    if (!btn) return;
    if (wasDragged) return; // was a drag, not a click
    var id = btn.getAttribute('data-target');
    var target = document.getElementById(id);
    if (!target) return;

    // Toggle: if already visible, hide it; otherwise show only this one
    var isToggleableSection = sectionIds.indexOf(id) !== -1;
    var isVisible = isToggleableSection && target.classList.contains('section-visible');

    // Hide all sections
    sectionIds.forEach(function(sid) {
      var el = document.getElementById(sid);
      if (el) el.classList.remove('section-visible');
    });
    // Remove active from all buttons
    var allBtns = ticker.querySelectorAll('.ticker-btn');
    for (var i = 0; i < allBtns.length; i++) allBtns[i].classList.remove('ticker-active');

    if (!isVisible || !isToggleableSection) {
      if (isToggleableSection) target.classList.add('section-visible');
      // Mark all buttons with this target as active (original + duplicate)
      for (var i = 0; i < allBtns.length; i++) {
        if (allBtns[i].getAttribute('data-target') === id) allBtns[i].classList.add('ticker-active');
      }
      // Scroll to it
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // ── Reduced motion ──
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    AUTO_SPEED = 0;
  }

  // ── Boot ──
  measureHalf();
  loop();

  window.addEventListener('resize', function() { measureHalf(); });
})();

$('.counting').each(function () {
  var $this = $(this),
    countTo = $this.attr('data-count');

  $({ countNum: $this.text() }).animate({
    countNum: countTo
  },

    {

      duration: 3000,
      easing: 'linear',
      step: function () {
        $this.text(Math.floor(this.countNum));
      },
      complete: function () {
        $this.text(this.countNum);
        //alert('finished');
      }

    });

});

// Cookie Consent
function acceptCookies() {
  const cookieConsent = document.getElementById('cookieConsent');
  if (cookieConsent) {
    cookieConsent.style.display = 'none';
  }
    localStorage.setItem('cookiesAccepted', 'true');
}

// Language Selector
const languageSelector = {
    init() {
        document.querySelectorAll('[data-lang]').forEach(item => {
            item.addEventListener('click', this.changeLanguage);
        });
    },

    async changeLanguage(e) {
        e.preventDefault();
        const lang = e.target.dataset.lang;
        showLoading();
        try {
            const translations = await fetch(`/assets/lang/${lang}.json`);
            const data = await translations.json();
            updatePageContent(data);
        } catch (error) {
            showError('Language loading failed');
        } finally {
            hideLoading();
        }
    }
};

// Loading State Management
function showLoading() {
  const loadingSpinner = document.getElementById('loadingSpinner');
  if (loadingSpinner) {
    loadingSpinner.classList.remove('d-none');
  }
}

function hideLoading() {
  const loadingSpinner = document.getElementById('loadingSpinner');
  if (loadingSpinner) {
    loadingSpinner.classList.add('d-none');
  }
}

// Error Handling
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show';
    errorDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.insertBefore(errorDiv, document.body.firstChild);
}

// Form Validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;

    let isValid = true;
    form.querySelectorAll('[required]').forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('is-invalid');
        } else {
            input.classList.remove('is-invalid');
        }
    });

    return isValid;
}

// Newsletter Subscription
async function subscribeNewsletter(email) {
    showLoading();
    try {
        const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        if (!response.ok) throw new Error('Subscription failed');
        
        showSuccess('Successfully subscribed to newsletter!');
    } catch (error) {
        showError('Failed to subscribe. Please try again.');
    } finally {
        hideLoading();
    }
}

// Dark Mode Toggle
function toggleDarkMode() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

// Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
    // Check cookie consent
    if (!localStorage.getItem('cookiesAccepted')) {
    const cookieConsent = document.getElementById('cookieConsent');
    if (cookieConsent) {
      cookieConsent.style.display = 'block';
    }
    }

    // Initialize language selector
    languageSelector.init();

    // Set theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);

    // Initialize tooltips and popovers
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
});

// Header scroll effect
document.addEventListener('DOMContentLoaded', function() {
  const nav = document.querySelector('.my-nav');
  const menuItems = document.querySelectorAll('.menu ul li a');
  const navOptionGroups = document.querySelectorAll('.nav-options-details');
  
  // Set active menu item based on current page
  const currentPage = window.location.pathname.split('/').pop().split('.')[0];
  menuItems.forEach(item => {
    const itemHref = item.getAttribute('href').split('#')[0].split('/').pop().split('.')[0];
    if (currentPage === itemHref || (currentPage === '' && itemHref === 'index')) {
      item.classList.add('active');
    }
  });

  navOptionGroups.forEach(group => {
    const optionLinks = group.querySelectorAll('.nav-options-menu a');
    const hasActiveOption = Array.from(optionLinks).some(link => link.classList.contains('active'));

    if (hasActiveOption) {
      group.classList.add('is-active');
      group.open = true;
    }
  });

  document.addEventListener('click', function(event) {
    navOptionGroups.forEach(group => {
      if (!group.contains(event.target)) {
        group.removeAttribute('open');
      }
    });
  });
  
  // Add scroll event listener
  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });
});

// Stats counter animation - Fixed for mobile
function animateCounters() {
  const counters = document.querySelectorAll('.bg-01 .wrapper .content ol li h2');
  const shouldSkipAnimation = document.body.classList.contains('index-glass-header');

  function formatCounterValue(value, format) {
    if (format === 'compact-plus') {
      if (value >= 1000) {
        return `${Math.floor(value / 1000)}K+`;
      }
      return `${value}+`;
    }

    if (format === 'currency-compact' || format === 'currency-compact-plus') {
      const plus = format === 'currency-compact-plus' ? '+' : '';
      if (value >= 1000) {
        return `$${Math.floor(value / 1000)}K${plus}`;
      }
      return `$${value}${plus}`;
    }

    return value.toLocaleString();
  }
  
  counters.forEach(counter => {
    const targetAttr = counter.getAttribute('data-count') || counter.textContent;
    const target = parseInt(targetAttr.replace(/,/g, '').replace(/\D/g, ''), 10);
    const originalText = counter.textContent;
    const format = counter.getAttribute('data-format') || 'plain';

    if (shouldSkipAnimation) {
      counter.textContent = originalText;
      return;
    }
    
    if (isNaN(target)) {
      console.error('Invalid counter target:', originalText);
      return;
    }
    
    const duration = 2000; // 2 seconds
    const startTime = Date.now();
    const startValue = 0;
    
    function updateCounter() {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      if (elapsedTime < duration) {
        const value = Math.floor(easeOutQuad(elapsedTime, startValue, target, duration));
        counter.textContent = formatCounterValue(value, format);
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = originalText;
      }
    }
    
    function easeOutQuad(t, b, c, d) {
      t /= d;
      return -c * t * (t - 2) + b;
    }
    
    updateCounter();
  });
}

// Intersection Observer for triggering animations when elements come into view
document.addEventListener('DOMContentLoaded', function() {
  const statsSection = document.querySelector('.bg-01');
  
  if (statsSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounters();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    
    observer.observe(statsSection);
  }
});

// Add carousel fade effect and mobile scroll indicator
document.addEventListener('DOMContentLoaded', function() {
  // Add fade class to carousel
  const aboutCarousel = document.querySelector('#carouselExampleIndicators');
  if (aboutCarousel) {
    aboutCarousel.classList.add('carousel-fade');
    
    // Add scroll indicator for mobile
    if (window.innerWidth < 768) {
      const scrollIndicator = document.createElement('div');
      scrollIndicator.className = 'scroll-indicator';
      scrollIndicator.innerHTML = '<i class="fal fa-chevron-down"></i>';
      aboutCarousel.parentNode.appendChild(scrollIndicator);
    }
  }
});

// Final cleanup - Performance optimization
document.addEventListener('DOMContentLoaded', function() {
  // Debounce function to limit execution of expensive operations
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }
  
  // Optimize scroll event listeners
  const scrollHandlers = [];
  
  // Add scroll handlers
  if (document.querySelector('.parallax-map')) {
    scrollHandlers.push(function() {
      const scrollPosition = window.pageYOffset;
      const mapSection = document.querySelector('.bg-05');
      const parallaxMap = document.querySelector('.parallax-map');
      
      if (!mapSection || !parallaxMap) return;
      
      const mapOffset = mapSection.offsetTop;
      const windowHeight = window.innerHeight;
      
      if (scrollPosition + windowHeight > mapOffset && 
          scrollPosition < mapOffset + mapSection.offsetHeight) {
        const parallaxValue = (scrollPosition - mapOffset) * 0.1;
        parallaxMap.style.transform = `translateY(${parallaxValue}px)`;
      }
    });
  }
  
  // Combine all scroll handlers into one listener
  if (scrollHandlers.length > 0) {
    const handleScroll = debounce(function() {
      scrollHandlers.forEach(handler => handler());
    }, 10);
    
    window.addEventListener('scroll', handleScroll);
  }
  
  // Remove any duplicate event listeners
  const existingListeners = window._eventListeners || [];
  window._eventListeners = existingListeners;
  
  // Check for and remove any orphaned elements
  const cleanupOrphanedElements = function() {
    // Remove any canvas elements without parents
    document.querySelectorAll('canvas').forEach(canvas => {
      if (!canvas.parentElement) {
        canvas.remove();
      }
    });
    
    // Remove any empty containers
    document.querySelectorAll('.container').forEach(container => {
      if (container.children.length === 0) {
        container.remove();
      }
    });
  };
  
  // Run cleanup
  cleanupOrphanedElements();
});

// Mobile Menu Toggle - Fixed Version
document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.querySelector('.hamburger-menu');
  const menuItems = document.querySelector('.menu-items');
  const overlay = document.querySelector('.menu-overlay');
  const navOptionGroups = document.querySelectorAll('.nav-options-details');
  const mobileMenuQuery = window.matchMedia('(max-width: 991.98px)');

  function syncMobileNavOptions() {
    navOptionGroups.forEach(group => {
      if (mobileMenuQuery.matches) {
        group.setAttribute('open', 'open');
        group.classList.add('is-active');
      } else {
        group.removeAttribute('open');
        group.classList.remove('is-active');
      }
    });
  }

  function closeMenu() {
    if (!hamburger || !menuItems || !overlay) {
      return;
    }

    hamburger.classList.remove('active');
    menuItems.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('menu-open');
  }

  syncMobileNavOptions();

  if (typeof mobileMenuQuery.addEventListener === 'function') {
    mobileMenuQuery.addEventListener('change', function() {
      syncMobileNavOptions();
      closeMenu();
    });
  } else if (typeof mobileMenuQuery.addListener === 'function') {
    mobileMenuQuery.addListener(function() {
      syncMobileNavOptions();
      closeMenu();
    });
  }
  
  if (hamburger && menuItems && overlay) {
    hamburger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      syncMobileNavOptions();
      hamburger.classList.toggle('active');
      menuItems.classList.toggle('active');
      overlay.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    });
    
    overlay.addEventListener('click', closeMenu);
    
    // Close menu when clicking a link
    const menuLinks = menuItems.querySelectorAll('a');
    menuLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });
  } else {
    console.warn('Mobile menu not initialized on this page.');
  }
});

// Footer 3D avocado viewer
document.addEventListener('DOMContentLoaded', function() {
  const footerBlocks = document.querySelectorAll('footer .footer-content');
  if (!footerBlocks.length) return;

  let targetBlock = null;
  footerBlocks.forEach(block => {
    const heading = block.querySelector('.contact-heading, h2, h3');
    const headingText = heading ? heading.textContent.trim().toUpperCase() : '';
    if (headingText.indexOf('CONTACT US') !== -1) {
      targetBlock = block;
    }
  });

  if (!targetBlock || targetBlock.querySelector('.avocado-footer-trigger')) {
    return;
  }

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'avocado-footer-trigger';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML =
    '<img src="assets/images/avocado.jpeg" alt="Open 3D avocado viewer">' +
    '<span>Play With Our 3D Avocado</span>';
  targetBlock.appendChild(trigger);

  const modal = document.createElement('div');
  modal.className = 'avocado-viewer-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML =
    '<div class="avocado-viewer-backdrop" data-avocado-close></div>' +
    '<div class="avocado-viewer-panel" role="dialog" aria-modal="true" aria-label="Interactive 3D avocado viewer">' +
      '<button type="button" class="avocado-viewer-close" aria-label="Close avocado viewer" data-avocado-close>&times;</button>' +
      '<div class="avocado-viewer-canvas"></div>' +
      '<p class="avocado-viewer-tip">Drag left or right to rotate. Scroll to zoom.</p>' +
    '</div>';
  document.body.appendChild(modal);

  const panel = modal.querySelector('.avocado-viewer-panel');
  const canvasHost = modal.querySelector('.avocado-viewer-canvas');

  let initialized = false;
  let cleanupFns = [];

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('avocado-modal-open');
  }

  async function initViewer() {
    if (initialized) return;
    initialized = true;

    try {
      const [THREE, loaderModule, controlsModule] = await Promise.all([
        import('https://esm.sh/three@0.161.0'),
        import('https://esm.sh/three@0.161.0/examples/jsm/loaders/GLTFLoader.js'),
        import('https://esm.sh/three@0.161.0/examples/jsm/controls/OrbitControls.js')
      ]);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
      canvasHost.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x10171c);

      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 0.05, 3.6);
      camera.lookAt(0, 0, 0);

      const hemi = new THREE.HemisphereLight(0xffffff, 0x2a3339, 1.15);
      scene.add(hemi);

      const key = new THREE.DirectionalLight(0xffffff, 1.5);
      key.position.set(2.6, 2.9, 2.4);
      scene.add(key);

      const fill = new THREE.DirectionalLight(0x8aa6b5, 0.68);
      fill.position.set(-2.2, 1.7, -1.2);
      scene.add(fill);

      const controls = new controlsModule.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.autoRotate = false;
      controls.enableRotate = false;
      controls.enablePan = false;
      controls.minDistance = 1.7;
      controls.maxDistance = 6;
      controls.target.set(0, 0, 0);

      const loader = new loaderModule.GLTFLoader();
      const gltf = await loader.loadAsync('assets/models/avocado.glb');
      const model = gltf.scene;
      const orbitGroup = new THREE.Group();
      const pivot = new THREE.Group();

      const rawBounds = new THREE.Box3().setFromObject(model);
      const rawSize = rawBounds.getSize(new THREE.Vector3());
      const maxAxis = Math.max(rawSize.x, rawSize.y, rawSize.z) || 1;
      const targetSize = 1.95;
      const scale = targetSize / maxAxis;

      model.scale.setScalar(scale);
      model.rotation.set(-Math.PI / 2, 0, 0.35);
      model.updateMatrixWorld(true);
      const scaledBounds = new THREE.Box3().setFromObject(model);
      const scaledCenter = scaledBounds.getCenter(new THREE.Vector3());
      model.position.set(-scaledCenter.x, -scaledCenter.y, -scaledCenter.z);

      pivot.add(model);
      pivot.rotation.x = 0;
      orbitGroup.rotation.y = 0;
      orbitGroup.add(pivot);
      scene.add(orbitGroup);

      let isDragging = false;
      let lastPointerX = 0;
      let spinVelocity = 0;
      const idleSpin = 0.006;
      const dragRotateFactor = 0.012;
      renderer.domElement.style.cursor = 'grab';

      function onPointerDown(event) {
        isDragging = true;
        lastPointerX = event.clientX;
        spinVelocity = 0;
        renderer.domElement.style.cursor = 'grabbing';
      }

      function onPointerMove(event) {
        if (!isDragging) return;
        const deltaX = event.clientX - lastPointerX;
        lastPointerX = event.clientX;
        orbitGroup.rotation.y += deltaX * dragRotateFactor;
        spinVelocity = deltaX * 0.0008;
      }

      function onPointerUp() {
        isDragging = false;
        renderer.domElement.style.cursor = 'grab';
      }

      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp, { passive: true });
      window.addEventListener('pointercancel', onPointerUp, { passive: true });

      function onResize() {
        const width = canvasHost.clientWidth || 400;
        const height = canvasHost.clientHeight || 320;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      }

      onResize();
      controls.update();
      window.addEventListener('resize', onResize, { passive: true });

      let frame = 0;
      const animate = () => {
        if (isDragging) {
          spinVelocity *= 0.6;
        } else {
          spinVelocity += (idleSpin - spinVelocity) * 0.05;
        }
        orbitGroup.rotation.y += spinVelocity;
        controls.update();
        renderer.render(scene, camera);
        frame = requestAnimationFrame(animate);
      };
      animate();

      cleanupFns.push(() => {
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', onResize);
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
        controls.dispose();
        renderer.dispose();
      });
    } catch (error) {
      canvasHost.innerHTML = '<div class="avocado-viewer-fallback">Unable to load 3D viewer right now.</div>';
    }
  }

  trigger.addEventListener('click', async function() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('avocado-modal-open');
    await initViewer();
  });

  modal.addEventListener('click', function(event) {
    if (event.target && event.target.hasAttribute('data-avocado-close')) {
      closeModal();
    }
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  window.addEventListener('beforeunload', function() {
    cleanupFns.forEach(fn => fn());
    cleanupFns = [];
  });
});

// Modal functionality
document.addEventListener('DOMContentLoaded', function() {
  const modals = Array.from(document.querySelectorAll('.modal'));

  function closeModal(modal) {
    if (!modal) {
      return;
    }

    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }

  function openModal(modal) {
    if (!modal) {
      return;
    }

    modal.style.display = modal.classList.contains('champ-spotlight-modal') ? 'flex' : 'block';
    modal.setAttribute('aria-hidden', 'false');
  }

  window.GYCModals = {
    close: closeModal,
    open: openModal
  };

  document.querySelectorAll('[data-modal-close]').forEach(button => {
    button.addEventListener('click', function() {
      closeModal(button.closest('.modal'));
    });
  });

  window.addEventListener('click', function(event) {
    modals.forEach(modal => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
      modals.forEach(modal => closeModal(modal));
    }
  });
});

// Champs archive toggle
document.addEventListener('DOMContentLoaded', function() {
  const toggleButtons = document.querySelectorAll('.champs-toggle');
  const panels = {
    current: document.getElementById('champs-current-panel'),
    archive: document.getElementById('champs-archive-panel')
  };

  if (toggleButtons.length === 0 || !panels.current || !panels.archive) {
    return;
  }

  function setActiveView(view) {
    toggleButtons.forEach(button => {
      const isActive = button.getAttribute('data-champs-view') === view;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    Object.keys(panels).forEach(key => {
      const panel = panels[key];
      const isActive = key === view;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
    });
  }

  toggleButtons.forEach(button => {
    button.addEventListener('click', function() {
      setActiveView(button.getAttribute('data-champs-view'));
    });
  });
});

// Champs spotlight modal
document.addEventListener('DOMContentLoaded', function() {
  const spotlightModal = document.getElementById('champSpotlightModal');

  if (!spotlightModal) {
    return;
  }

  const spotlightImage = document.getElementById('champSpotlightImage');
  const spotlightEyebrow = document.getElementById('champSpotlightEyebrow');
  const spotlightTitle = document.getElementById('champSpotlightTitle');
  const spotlightRole = document.getElementById('champSpotlightRole');
  const spotlightCountry = document.getElementById('champSpotlightCountry');
  const spotlightDescription = document.getElementById('champSpotlightDescription');
  const spotlightCards = document.querySelectorAll('.champ-poster-card, #champs-archive-panel .team-items, [data-spotlight-card]');

  if (!spotlightImage || !spotlightEyebrow || !spotlightTitle || !spotlightRole || !spotlightCountry || !spotlightDescription || spotlightCards.length === 0) {
    return;
  }

  function buildSpotlightData(card) {
    const image = card.querySelector('img');
    const isCurrentCard = card.classList.contains('champ-poster-card');
    const isCustomCard = card.hasAttribute('data-spotlight-card');
    const nameElement = card.querySelector(isCurrentCard ? '.champ-poster-card__body h4' : '.team-name h2');
    const roleElement = card.querySelector(isCurrentCard ? '.champ-poster-card__body p' : '.team-name b');
    const countryElement = card.querySelector('.champ-country');
    const name = card.getAttribute('data-spotlight-name') || (nameElement ? nameElement.textContent.trim() : 'GYC Champ');
    const role = card.getAttribute('data-spotlight-role') || (roleElement ? roleElement.textContent.trim() : 'Global Youth Coalition');
    const country = card.getAttribute('data-spotlight-country') || (countryElement ? countryElement.textContent.trim() : '');

    let eyebrow = card.getAttribute('data-spotlight-eyebrow') || 'GYC Spotlight';
    let description = card.getAttribute('data-spotlight-description') || '';

    if (!description) {
      if (isCurrentCard) {
        eyebrow = '2026 Champs';
        description = name + ' is part of the current Global Youth Coalition Champs cohort. Tap back to keep browsing the gallery.';
      } else if (!isCustomCard) {
        eyebrow = '2025 Archive';
        description = name + ' is featured in the 2025 GYC Champs archive. This view lets you see the profile in a larger, faster mobile format.';
      }
    }

    return {
      src: image ? image.getAttribute('src') : '',
      alt: image ? image.getAttribute('alt') || name : name,
      name: name,
      role: role,
      country: country,
      eyebrow: eyebrow,
      description: description
    };
  }

  function openSpotlight(card) {
    const data = buildSpotlightData(card);

    spotlightImage.src = data.src;
    spotlightImage.alt = data.alt;
    spotlightEyebrow.textContent = data.eyebrow;
    spotlightTitle.textContent = data.name;
    spotlightRole.textContent = data.role;
    spotlightCountry.textContent = data.country;
    spotlightCountry.hidden = !data.country;
    spotlightDescription.textContent = data.description;

    if (window.GYCModals && typeof window.GYCModals.open === 'function') {
      window.GYCModals.open(spotlightModal);
    } else {
      spotlightModal.style.display = 'flex';
    }
  }

  spotlightCards.forEach(card => {
    const isCurrentCard = card.classList.contains('champ-poster-card');
    const nameElement = card.querySelector(isCurrentCard ? '.champ-poster-card__body h4' : '.team-name h2');
    const name = card.getAttribute('data-spotlight-name') || (nameElement ? nameElement.textContent.trim() : 'GYC Champ');

    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Open spotlight for ' + name);

    card.addEventListener('click', function(event) {
      if (event.target.closest('a, button')) {
        return;
      }

      openSpotlight(card);
    });

    card.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openSpotlight(card);
      }
    });
  });
});

// Add subtle parallax effect to team bubbles
document.addEventListener('DOMContentLoaded', function() {
  const teamSection = document.querySelector('.bg-04');
  const teamItems = document.querySelectorAll('.team-items');
  
  if (teamSection && teamItems.length > 0) {
    // Only apply on desktop
    if (window.innerWidth > 991) {
      teamSection.addEventListener('mousemove', function(e) {
        const sectionRect = teamSection.getBoundingClientRect();
        const sectionX = sectionRect.left + sectionRect.width / 2;
        const sectionY = sectionRect.top + sectionRect.height / 2;
        
        const moveX = (e.clientX - sectionX) / 50;
        const moveY = (e.clientY - sectionY) / 50;
        
        teamItems.forEach((item, index) => {
          // Different movement factor for each item
          const factor = 0.8 + (index % 3) * 0.2;
          item.style.transform = `translateX(${moveX * factor}px) translateY(${moveY * factor}px)`;
        });
      });
      
      // Reset positions when mouse leaves
      teamSection.addEventListener('mouseleave', function() {
        teamItems.forEach(item => {
          item.style.transform = 'translateX(0) translateY(0)';
        });
      });
    }
  }
});

/* ═══════════════════════════════════════════════════════════
   Nature particle canvas for .bg-04 (THE CHAMPS)
   – Floating leaves, fireflies, soft orbs
   – Reacts to mouse position inside the section
   ═══════════════════════════════════════════════════════════ */
(function() {
  var canvas = document.getElementById('nature-canvas');
  if (!canvas) return;
  var section = canvas.closest('.bg-04');
  if (!section) return;
  var ctx = canvas.getContext('2d');

  var mouse = { x: -9999, y: -9999, active: false };
  var dpr = window.devicePixelRatio || 1;
  var W, H;
  var particles = [];
  var raf;

  /* ── Draw a leaf shape ── */
  function drawLeaf(cx, cy, size, angle, color, opacity) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.scale(size, size);
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.moveTo(0, -1);
    ctx.bezierCurveTo(0.6, -0.6, 0.8, 0.2, 0, 1);
    ctx.bezierCurveTo(-0.8, 0.2, -0.6, -0.6, 0, -1);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -0.85);
    ctx.lineTo(0, 0.85);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 0.08;
    ctx.stroke();
    ctx.restore();
  }

  function resize() {
    var rect = section.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ── Palettes ── */
  var leafCol   = ['#4ead5b','#72c375','#a8d89a','#3d8b4f','#8fc98a','#e8c84a','#d4a843','#c2e088'];
  var ffCol     = ['#ffe680','#ffd54f','#fff9c4','#fff176'];
  var orbCol    = ['rgba(164,214,170,0.32)','rgba(255,230,128,0.25)','rgba(200,230,160,0.28)','rgba(253,88,11,0.1)'];

  function rnd(a,b){ return a + Math.random()*(b-a); }

  function makeParticle() {
    var t = Math.random();
    if (t < 0.45) {
      return { k:'leaf', x:rnd(0,W), y:rnd(0,H), vx:rnd(-0.35,0.35), vy:rnd(0.15,0.55),
        sz:rnd(6,16), a:rnd(0,6.28), sp:rnd(-0.012,0.012),
        col:leafCol[Math.floor(Math.random()*leafCol.length)],
        op:0, bop:rnd(0.32,0.72) };
    } else if (t < 0.78) {
      return { k:'ff', x:rnd(0,W), y:rnd(0,H), vx:rnd(-0.6,0.6), vy:rnd(-0.6,0.6),
        r:rnd(1.5,4), gr:rnd(8,22),
        col:ffCol[Math.floor(Math.random()*ffCol.length)],
        ph:rnd(0,6.28), spd:rnd(0.015,0.04), op:0, bop:rnd(0.45,0.85) };
    } else {
      return { k:'orb', x:rnd(0,W), y:rnd(0,H), vx:rnd(-0.18,0.18), vy:rnd(-0.18,0.18),
        r:rnd(18,55), col:orbCol[Math.floor(Math.random()*orbCol.length)],
        ph:rnd(0,6.28), spd:rnd(0.006,0.016), op:0, bop:rnd(0.2,0.38) };
    }
  }

  function initParticles() {
    particles = [];
    var count = Math.min(Math.round((W * H) / 12000), 85);
    if (window.innerWidth < 768) count = Math.min(count, 28);
    for (var i = 0; i < count; i++) particles.push(makeParticle());
  }

  /* ── Physics ── */
  function update() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var dx = p.x - mouse.x, dy = p.y - mouse.y;
      var dist = Math.sqrt(dx*dx + dy*dy);
      var mf = mouse.active ? Math.max(0, 1 - dist / 260) : 0;

      if (p.k === 'leaf') {
        p.x += p.vx + mf * dx * 0.006;
        p.y += p.vy - mf * 0.45;
        p.a += p.sp + mf * 0.035;
        p.op += ((p.bop + mf * 0.3) - p.op) * 0.06;
        if (p.y > H + 22) { p.y = -22; p.x = rnd(0,W); }
        if (p.x < -22) p.x = W + 22;
        if (p.x > W + 22) p.x = -22;
      } else if (p.k === 'ff') {
        p.ph += p.spd;
        var pulse = 0.5 + 0.5 * Math.sin(p.ph);
        p.op += ((p.bop * pulse + mf * 0.5) - p.op) * 0.08;
        p.x += p.vx + Math.sin(p.ph*1.3)*0.3 + mf * dx * 0.004;
        p.y += p.vy + Math.cos(p.ph*0.9)*0.3 + mf * dy * 0.004;
        if (p.x < -10) p.x = W+10; if (p.x > W+10) p.x = -10;
        if (p.y < -10) p.y = H+10; if (p.y > H+10) p.y = -10;
      } else {
        p.ph += p.spd;
        p.op += ((p.bop + mf * 0.16) - p.op) * 0.04;
        p.x += p.vx + Math.sin(p.ph)*0.15;
        p.y += p.vy + Math.cos(p.ph*0.7)*0.15;
        if (p.x < -p.r) p.x = W+p.r; if (p.x > W+p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = H+p.r; if (p.y > H+p.r) p.y = -p.r;
      }
    }
  }

  /* ── Render ── */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (p.op < 0.01) continue;

      if (p.k === 'leaf') {
        drawLeaf(p.x, p.y, p.sz, p.a, p.col, p.op);
      } else if (p.k === 'ff') {
        // glow
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.gr);
        g.addColorStop(0, 'rgba(255,246,128,' + (p.op * 0.6) + ')');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.gr, 0, 6.28);
        ctx.fill();
        // core
        ctx.globalAlpha = Math.min(p.op + 0.15, 1);
        ctx.fillStyle = p.color || p.col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.28);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        ctx.globalAlpha = p.op;
        ctx.fillStyle = p.col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.28);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  function loop() { update(); draw(); raf = requestAnimationFrame(loop); }

  /* ── Mouse tracking (relative to section) ── */
  section.addEventListener('mousemove', function(e) {
    var r = section.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    mouse.active = true;
  });
  section.addEventListener('mouseleave', function() { mouse.active = false; });

  /* ── Respect reduced-motion ── */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ── Boot ── */
  resize();
  initParticles();
  loop();

  var rsTimer;
  window.addEventListener('resize', function() {
    clearTimeout(rsTimer);
    rsTimer = setTimeout(function() { resize(); initParticles(); }, 200);
  });
})();
