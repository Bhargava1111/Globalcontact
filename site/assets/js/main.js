/**
* Template Name: FlexStart - v1.9.0
* Template URL: https://bootstrapmade.com/flexstart-bootstrap-startup-template/
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/
(function() {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    const elements = select(el, all)
    if (!elements) {
      return
    }

    if (all) {
      elements.forEach(e => e.addEventListener(type, listener))
    } else {
      elements.addEventListener(type, listener)
    }
  }

  /**
   * Easy on scroll event listener 
   */
  const onscroll = (el, listener) => {
    el.addEventListener('scroll', listener)
  }

  /**
   * Navbar links active state on scroll
   */
  let navbarlinks = select('#navbar .scrollto', true)
  const navbarlinksActive = () => {
    let position = window.scrollY + 200
    navbarlinks.forEach(navbarlink => {
      if (!navbarlink.hash) return
      let section = select(navbarlink.hash)
      if (!section) return
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        navbarlink.classList.add('active')
      } else {
        navbarlink.classList.remove('active')
      }
    })
  }
  window.addEventListener('load', navbarlinksActive)
  onscroll(document, navbarlinksActive)

  /**
   * Scrolls to an element with header offset
   */
  const scrollto = (el) => {
    let header = select('#header')
    let offset = header.offsetHeight

    if (!header.classList.contains('header-scrolled')) {
      offset -= 10
    }

    let elementPos = select(el).offsetTop
    window.scrollTo({
      top: elementPos - offset,
      behavior: 'smooth'
    })
  }

  /**
   * Toggle .header-scrolled class to #header when page is scrolled
   */
  let selectHeader = select('#header')
  if (selectHeader) {
    const headerScrolled = () => {
      if (window.scrollY > 100) {
        selectHeader.classList.add('header-scrolled')
      } else {
        selectHeader.classList.remove('header-scrolled')
      }
    }
    window.addEventListener('load', headerScrolled)
    onscroll(document, headerScrolled)
  }

  /**
   * Back to top button
   */
  let backtotop = select('.back-to-top')
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add('active')
      } else {
        backtotop.classList.remove('active')
      }
    }
    window.addEventListener('load', toggleBacktotop)
    onscroll(document, toggleBacktotop)
  }

  /**
   * Mobile nav toggle
   */
  const navbar = select('#navbar')
  const headerContainer = select('#header .container-fluid, #header .container-xl')
  const desktopMenu = navbar ? navbar.querySelector(':scope > ul') : null
  let mobileNavToggle = select('#header-nav-toggle')
  let mobileNavOverlay = select('#mobile-nav-overlay')
  let mobileNavPanel = select('#mobile-nav-panel')
  let mobileMenuList = null

  if (navbar && headerContainer && desktopMenu) {
    if (!mobileNavToggle) {
      mobileNavToggle = document.createElement('button')
      mobileNavToggle.type = 'button'
      mobileNavToggle.id = 'header-nav-toggle'
      mobileNavToggle.className = 'mobile-nav-toggle bi bi-list header-nav-toggle'
      mobileNavToggle.setAttribute('aria-label', 'Open navigation menu')
      mobileNavToggle.setAttribute('aria-expanded', 'false')
      document.body.appendChild(mobileNavToggle)
      select('#navbar .mobile-nav-toggle')?.remove()
    }

    if (!mobileNavOverlay) {
      mobileNavOverlay = document.createElement('div')
      mobileNavOverlay.id = 'mobile-nav-overlay'
      mobileNavOverlay.className = 'mobile-nav-overlay'
      mobileNavOverlay.innerHTML = '<div class="mobile-nav-panel" id="mobile-nav-panel"></div>'
      document.body.appendChild(mobileNavOverlay)
      mobileNavPanel = mobileNavOverlay.querySelector('#mobile-nav-panel')
    }

    mobileMenuList = desktopMenu.cloneNode(true)
    mobileMenuList.removeAttribute('id')
    mobileNavPanel.appendChild(mobileMenuList)
  }

  const isMobileViewport = () => window.innerWidth <= 1199

  const setMobileNavIcon = (isOpen) => {
    if (!mobileNavToggle) {
      return
    }

    mobileNavToggle.classList.remove('bi-list', 'bi-x')
    mobileNavToggle.classList.add(isOpen ? 'bi-x' : 'bi-list')
  }

  const setMobileNavState = (isOpen) => {
    if (!mobileNavToggle || !mobileNavOverlay) {
      return
    }

    mobileNavOverlay.classList.toggle('is-open', isOpen)
    setMobileNavIcon(isOpen)
    mobileNavToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false')
    mobileNavToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu')
    document.body.classList.toggle('mobile-nav-active', isOpen)
  }

  const toggleMobileNav = () => {
    if (!mobileNavOverlay) {
      return
    }

    setMobileNavState(!mobileNavOverlay.classList.contains('is-open'))
  }

  const handleMobileNavToggle = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    toggleMobileNav()
  }

  if (mobileNavToggle && mobileNavOverlay && mobileMenuList) {
    mobileNavToggle.addEventListener('click', handleMobileNavToggle)

    mobileNavToggle.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        handleMobileNavToggle(e)
      }
    })

    mobileNavOverlay.addEventListener('click', function(e) {
      if (e.target === mobileNavOverlay) {
        setMobileNavState(false)
      }
    })

    mobileMenuList.addEventListener('click', function(e) {
      const dropdownLink = e.target.closest('.dropdown > a')
      if (dropdownLink && mobileMenuList.contains(dropdownLink)) {
        e.preventDefault()
        const submenu = dropdownLink.nextElementSibling
        if (submenu) {
          submenu.classList.toggle('dropdown-active')
        }
        return
      }

      const link = e.target.closest('a[href]')
      if (!link || !mobileMenuList.contains(link)) {
        return
      }

      setMobileNavState(false)
    })
  }

  setMobileNavState(false)

  window.addEventListener('resize', () => {
    if (!isMobileViewport()) {
      setMobileNavState(false)
    }
  })

  /**
   * Scrool with ofset on links with a class name .scrollto
   */
  on('click', '.scrollto', function(e) {
    if (select(this.hash)) {
      e.preventDefault()

      if (navbar && mobileNavOverlay && mobileNavOverlay.classList.contains('is-open')) {
        setMobileNavState(false)
      }
      scrollto(this.hash)
    }
  }, true)

  /**
   * Scroll with ofset on page load with hash links in the url
   */
  window.addEventListener('load', () => {
    if (window.location.hash) {
      if (select(window.location.hash)) {
        scrollto(window.location.hash)
      }
    }
  });

  /**
   * Clients Slider
   */
  if (select('.clients-slider')) new Swiper('.clients-slider', {
    speed: 400,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    slidesPerView: 'auto',
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    },
    breakpoints: {
      320: {
        slidesPerView: 2,
        spaceBetween: 40
      },
      480: {
        slidesPerView: 3,
        spaceBetween: 60
      },
      640: {
        slidesPerView: 4,
        spaceBetween: 80
      },
      992: {
        slidesPerView: 6,
        spaceBetween: 120
      }
    }
  });

  /**
   * Porfolio isotope and filter
   */
  window.addEventListener('load', () => {
    let portfolioContainer = select('.portfolio-container');
    if (portfolioContainer) {
      let portfolioIsotope = new Isotope(portfolioContainer, {
        itemSelector: '.portfolio-item',
        layoutMode: 'fitRows'
      });

      let portfolioFilters = select('#portfolio-flters li', true);

      on('click', '#portfolio-flters li', function(e) {
        e.preventDefault();
        portfolioFilters.forEach(function(el) {
          el.classList.remove('filter-active');
        });
        this.classList.add('filter-active');

        portfolioIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
        aos_init();
      }, true);
    }

  });

  /**
   * Initiate portfolio lightbox 
   */
  if (select('.portfokio-lightbox')) {
    GLightbox({
      selector: '.portfokio-lightbox'
    });
  }

  /**
   * Portfolio details slider
   */
  if (select('.portfolio-details-slider')) new Swiper('.portfolio-details-slider', {
    speed: 400,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    }
  });

  /**
   * Testimonials slider
   */
  if (select('.testimonials-slider')) new Swiper('.testimonials-slider', {
    speed: 600,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    slidesPerView: 'auto',
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    },
    breakpoints: {
      320: {
        slidesPerView: 1,
        spaceBetween: 40
      },

      1200: {
        slidesPerView: 3,
      }
    }
  });

  /**
   * Animation on scroll
   */
  function aos_init() {
    AOS.init({
      duration: 1000,
      easing: "ease-in-out",
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', () => {
    aos_init();
  });

})();


document.onkeydown = function(e) {
  if(e.keyCode == 123) {
    return false;
  }
  if(e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)){
    return false;
  }
  if(e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)){
    return false;
  }
  if(e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)){
    return false;
  }

  if (e.ctrlKey &&
    (e.keyCode === 67 ||
        e.keyCode === 86 ||
        e.keyCode === 83 ||
        e.keyCode === 80 ||
        e.keyCode === 85 ||
        e.keyCode === 117)) {
    return false;
} 

  if(e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)){
    return false;
  }      


}

document.addEventListener("contextmenu", function(e){
  if (e.target.nodeName === "IMG") {
      e.preventDefault();
  }
}, false);

document.addEventListener("contextmenu", function (e){
  e.preventDefault();
}, false);


/* js slider */
$(function() {
  const slider = $('.slider');
  const testimonials = $('.testimonial');
  if (!slider.length || !testimonials.length) {
    return;
  }

  const prevButton = $('.prev-button');
  const nextButton = $('.next-button');
  const testimonialWidth = testimonials.first().outerWidth(true);
  let currentSlide = 0;

  // initialize slider
  updateSlider();

  // add event listeners to buttons
  prevButton.on('click', () => {
    currentSlide--;
    if (currentSlide < 0) {
      currentSlide = testimonials.length - 1;
    }
    updateSlider();
  });
  nextButton.on('click', () => {
    currentSlide++;
    if (currentSlide > testimonials.length - 1) {
      currentSlide = 0;
    }
    updateSlider();
  });

  function updateSlider() {
    slider.css('transform', `translateX(-${currentSlide * testimonialWidth}px)`);
  }
});

// $(document).ready(function() {
//   // Initialize the carousel
//   $('#carouselExampleSlidesOnly').carousel();
// });

/* Popups are intentionally disabled — inline contact forms are used instead. */