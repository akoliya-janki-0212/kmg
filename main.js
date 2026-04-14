/**
 * Dhyan Shah Consultant - Dynamic Multi-Page Logic
 * Centralized Component Loader & Authority-First Interactions
 */

document.addEventListener('DOMContentLoaded', async () => {

    /* --- 1. Dynamic Component Loader --- */
    // This allows "one place changes" for Header, Footer, and Popup
    function loadComponents() {
        try {
            // Automatically detect subdirectory depth
            let prefix = '';
            if (window.location.pathname.includes('/products/')) {
                prefix = '../../';
            }

            // Helper to prefix relative paths only (skip absolute links like http/#)
            const fixPath = (html) => {
                if (!prefix) return html;
                return html.replace(/href="((?!http|#|mailto|tel:)[^"]+)"/g, `href="${prefix}$1"`)
                           .replace(/src="((?!http|#|mailto|tel:)[^"]+)"/g, `src="${prefix}$1"`);
            };

            const headerHTML = fixPath(window.KMG_COMPONENTS.header);
            const footerHTML = fixPath(window.KMG_COMPONENTS.footer);
            const popupHTML = fixPath(window.KMG_COMPONENTS.popup);
            const chatHTML = fixPath(window.KMG_COMPONENTS.chatWidget);

            const headerRoot = document.getElementById('header-root');
            const footerRoot = document.getElementById('footer-root');
            const popupRoot = document.getElementById('popup-root');
            
            // Re-setup chat-root if not present
            let chatRoot = document.getElementById('chat-root');
            if (!chatRoot) {
                chatRoot = document.createElement('div');
                chatRoot.id = 'chat-root';
                document.body.appendChild(chatRoot);
            }

            if (headerRoot) headerRoot.innerHTML = headerHTML;
            if (footerRoot) footerRoot.innerHTML = footerHTML;
            if (popupRoot) popupRoot.innerHTML = popupHTML;
            if (chatRoot) chatRoot.innerHTML = chatHTML;

            // Re-initialize logic that depends on these components
            initializeComponentLogic();
            highlightActiveLink();
            setupUniversalCTAs();
        } catch (error) {
            console.error('Error loading dynamic components:', error);
        }
    }

    /* --- 2. Interactive Logic (Post-Load) --- */
    function initializeComponentLogic() {
        // Countdown Timer Logic
        const targetDate = new Date("Mar 15, 2026 19:00:00").getTime();
        const timerElement = document.getElementById("timer");

        if (timerElement) {
            const timer = setInterval(() => {
                const now = new Date().getTime();
                const distance = targetDate - now;

                if (distance < 0) {
                    clearInterval(timer);
                    timerElement.innerHTML = "LIVE NOW";
                } else {
                    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    timerElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
                }
            }, 1000);
        }

        // Mobile Navigation Toggle
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');
        const dropdowns = document.querySelectorAll('.dropdown');

        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                const icon = mobileMenuToggle.querySelector('i');
                if (navLinks.classList.contains('active')) {
                    icon.classList.replace('fa-bars', 'fa-xmark');
                } else {
                    icon.classList.replace('fa-xmark', 'fa-bars');
                }
            });
        }

        // Mobile Dropdown Behavior
        dropdowns.forEach(dropdown => {
            const link = dropdown.querySelector('a');
            link.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                }
            });
        });

        // Popup Management
        const popupOverlay = document.getElementById('bada-style-popup');
        const closePopupBtn = document.getElementById('closePopupBtn');
        const popupForm = document.getElementById('popupForm');

        if (closePopupBtn) {
            closePopupBtn.addEventListener('click', () => {
                popupOverlay.style.display = 'none';
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target === popupOverlay) popupOverlay.style.display = 'none';
        });

        // Auto-Trigger Popup (5 seconds)
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        // --- SELECTION CONTROL ---
        // For testing/verification: Show EVERY time (to ensure it works on all pages)
        // To revert to "once per session", uncomment the hasSeenPopup check below.

        const storageKey = `kmg_popup_seen_${currentPage}`;
        const hasSeenPopup = sessionStorage.getItem(storageKey);

        // if (!hasSeenPopup) { // Uncomment this line and the closing brace below to restore session logic
        console.log(`Popup timer started for ${currentPage}... waiting 5 seconds`);
        setTimeout(() => {
            const activePopup = document.getElementById('bada-style-popup');
            if (activePopup) {
                console.log("Showing popup now.");
                activePopup.style.display = 'flex';
                sessionStorage.setItem(storageKey, 'true'); // Uncomment to record the view
            } else {
                console.error("Popup overlay element #bada-style-popup not found in DOM!");
            }
        }, 5000);
        // }

        // Popup Form Submission
        if (popupForm) {
            popupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = popupForm.querySelector('button[type="submit"]');
                const successMsg = document.getElementById('popupSuccessMessage');
                const originalText = btn.innerHTML;

                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Request...';
                btn.disabled = true;

                try {
                    const response = await fetch(popupForm.action, {
                        method: 'POST',
                        body: new FormData(popupForm),
                        headers: {
                            'Accept': 'application/json'
                        }
                    });

                    if (response.ok) {
                        btn.innerHTML = 'Success!';
                        popupForm.reset();
                        if (successMsg) successMsg.style.display = 'block';
                        setTimeout(() => {
                            popupOverlay.style.display = 'none';
                            btn.innerHTML = originalText;
                            btn.disabled = false;
                            if (successMsg) successMsg.style.display = 'none';
                        }, 2500);
                    } else {
                        throw new Error('Form submission failed');
                    }
                } catch (error) {
                    btn.innerHTML = 'Error. Try Again.';
                    btn.disabled = false;
                    console.error('Submission error:', error);
                }
            });
        }

        // --- NEW CHAT WIDGET LOGIC ---
        const chatBubble = document.getElementById('chatBubble');
        const chatPanel = document.getElementById('chatPanel');
        const chatForm = document.getElementById('chatForm');

        window.toggleChatWidget = function(saveState = true) {
            if (chatPanel) {
                const isHidden = chatPanel.style.display === 'none' || chatPanel.style.display === '';
                chatPanel.style.display = isHidden ? 'flex' : 'none';
                if (chatBubble) chatBubble.style.display = isHidden ? 'none' : 'flex';
                
                if (saveState) {
                    localStorage.setItem('chatWidgetOpen', isHidden ? 'true' : 'false');
                }
            }
        };

        // Check persistence - Re-open if it was open on the last page
        if (localStorage.getItem('chatWidgetOpen') === 'true') {
            window.toggleChatWidget(false);
        }

        if (chatBubble) {
            chatBubble.addEventListener('click', () => window.toggleChatWidget(true));
        }

        if (chatForm) {
            chatForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = chatForm.querySelector('button[type="submit"]');
                const successMsg = document.getElementById('chatFormSuccess');
                const originalText = btn.innerHTML;

                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
                btn.disabled = true;

                try {
                    const response = await fetch(chatForm.action, {
                        method: 'POST',
                        body: new FormData(chatForm),
                        headers: { 'Accept': 'application/json' }
                    });

                    if (response.ok) {
                        btn.innerHTML = 'Sent!';
                        chatForm.reset();
                        localStorage.setItem('chatWidgetOpen', 'false'); // Close on success

                        if (successMsg) successMsg.style.display = 'block';
                        setTimeout(() => {
                            window.toggleChatWidget();
                            btn.innerHTML = originalText;
                            btn.disabled = false;
                            if (successMsg) successMsg.style.display = 'none';
                        }, 2000);
                    } else { throw new Error('Submission failed'); }
                } catch (error) {
                    btn.innerHTML = 'Error. Try Again.';
                    btn.disabled = false;
                }
            });
        }
    }

    /* --- 3. Unified CTA Logic --- */
    function setupUniversalCTAs() {
        // Any link or button with class 'cta-trigger' will open the popup
        const triggers = document.querySelectorAll('.cta-trigger');
        const popupOverlay = document.getElementById('bada-style-popup');

        triggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                const href = trigger.getAttribute('href');
                // Only intercept if it's not a link to another page (unless explicitly desired)
                // For this request, we make all major buttons triggers
                if (!href || href.startsWith('#') || trigger.tagName === 'BUTTON') {
                    e.preventDefault();
                    if (popupOverlay) popupOverlay.style.display = 'flex';
                }
            });
        });
    }

    /* --- 4. Navigation UI Helpers --- */
    function highlightActiveLink() {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-links a').forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Scroll Effects
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (header) {
            if (window.scrollY > 10) {
                header.classList.add('header-scrolled');
            } else {
                header.classList.remove('header-scrolled');
            }
        }
    });

    /* --- Initialize --- */
    loadComponents();
    initializeHeroSlider();

    /* --- 5. Homepage Slider --- */
    function initializeHeroSlider() {
        const slides = document.querySelectorAll('.hero-slide');
        const dots = document.querySelectorAll('.slider-dot');
        const prevBtn = document.querySelector('.prev-slide');
        const nextBtn = document.querySelector('.next-slide');

        if (slides.length === 0) return;

        let currentSlide = 0;
        let slideInterval;

        function showSlide(index) {
            slides.forEach(s => s.classList.remove('active'));
            dots.forEach(d => d.classList.remove('active'));

            slides[index].classList.add('active');
            dots[index].classList.add('active');
            currentSlide = index;
        }

        function nextSlide() {
            let index = (currentSlide + 1) % slides.length;
            showSlide(index);
        }

        function prevSlide() {
            let index = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(index);
        }

        function startAutoSlide() {
            stopAutoSlide();
            slideInterval = setInterval(nextSlide, 5000);
        }

        function stopAutoSlide() {
            clearInterval(slideInterval);
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextSlide();
                startAutoSlide();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                prevSlide();
                startAutoSlide();
            });
        }

        dots.forEach((dot, idx) => {
            dot.addEventListener('click', () => {
                showSlide(idx);
                startAutoSlide();
            });
        });

        // Pause on hover
        const sliderContainer = document.querySelector('.hero-slider-container');
        if (sliderContainer) {
            sliderContainer.addEventListener('mouseenter', stopAutoSlide);
            sliderContainer.addEventListener('mouseleave', startAutoSlide);
        }

        startAutoSlide();
    }

    // Main Contact Form Logic (Only on contact.html)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button[type="submit"]');
            const successMsg = document.getElementById('formSuccessMessage');
            const originalText = btn.innerHTML;

            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending Details...';
            btn.disabled = true;

            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: new FormData(contactForm),
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    btn.innerHTML = 'Success!';
                    contactForm.reset();
                    if (successMsg) successMsg.style.display = 'block';
                } else {
                    throw new Error('Form submission failed');
                }
            } catch (error) {
                btn.innerHTML = 'Error. Try Again.';
                btn.disabled = false;
                console.error('Submission error:', error);
            }
        });
    }
});
