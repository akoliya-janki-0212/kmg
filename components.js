window.KMG_COMPONENTS = {
    header: `

<!-- Navigation Menu -->
<header class="header">
    <div class="container nav-container">
        <div class="logo">
            <a href="index.html">
                <img src="assets/logo.jpg" alt="KMG Industries Logo" style="height: 70px; width: auto; display: block;">
            </a>
        </div>

        <button class="mobile-menu-toggle" aria-label="Toggle menu">
            <i class="fa-solid fa-bars"></i>
        </button>

        <nav class="main-nav">
            <ul class="nav-links">
                <li><a href="index.html">Home</a></li>
                <li><a href="about.html">Journey</a></li>
                <li><a href="machineries.html">Machineries</a></li>
                <li><a href="projects.html" style="display: none;">Project</a></li>
                <li><a href="contract-packaging.html">Contract packaging</a></li>
                <li><a href="spares.html">120 Min Spares</a></li>
                <li><a href="talkwithdhyan.html" style="display: none;">Talk with Dhyan</a></li>
                <li><a href="careers.html">Careers</a></li>
                <li><a href="contact.html" class="btn btn-secondary nav-cta cta-trigger">Contact us</a></li>
            </ul>
        </nav>
    </div>
</header>
`,
    footer: `
<footer class="footer">
    <div class="container footer-container">
        <div class="footer-brand">
            <p class="mt-1 text-white" style="font-weight: 600;">Turnkey Solutions in Processing & Packaging</p>
            <p class="mt-1 text-light-dim">Moving your factory from daily messes to a business that grows on its own.
            </p>
            <div class="contact-details mt-3 text-light-dim" style="font-size: 0.9rem;">
                <p class="mb-1 text-light-dim"><i class="fa-solid fa-location-dot me-2"></i> 210, Arved Transcube Mall, Bandhu Nagar, Vijay Nagar, Ranip, Ahmedabad, Gujarat 382480</p>
                <p class="mb-1 text-light-dim"><i class="fa-solid fa-phone me-2"></i> +91 91041 83331</p>
                <p class="mb-1 text-light-dim"><i class="fa-solid fa-envelope me-2"></i> info.kmgindustries@gmail.com</p>
            </div>
            <div class="social-icons mt-3">
                <a href="https://www.facebook.com/profile.php?id=61558509921435#" target="_blank"><i class="fa-brands fa-facebook-f"></i></a>
                <a href="https://linkedin.com/company/kmgindustries" target="_blank"><i class="fa-brands fa-linkedin-in"></i></a>
                <a href="https://www.instagram.com/kmgindustriesindia?igsh=OTY4M3k5Y3Jjcmxu" target="_blank"><i class="fa-brands fa-instagram"></i></a>
            </div>
        </div>
        <div class="footer-links">
            <h4>Navigation</h4>
            <ul>
                <li><a href="index.html">Home</a></li>
                <li><a href="about.html">Journey</a></li>
                <li><a href="talkwithdhyan.html" style="display: none;">Talk with Dhyan</a></li>
                <li><a href="careers.html">Careers</a></li>
                <li><a href="contact.html">Contact Us</a></li>
            </ul>
        </div>
        <div class="footer-links">
            <h4>Services</h4>
            <ul>
                <li><a href="projects.html" style="display: none;">Turnkey Project</a></li>
                <li><a href="machineries.html">Machineries</a></li>
                <li><a href="contract-packaging.html">Contract Packaging</a></li>
            </ul>
        </div>
    </div>
    <div class="footer-bottom">
        <p>&copy; 2026 KMG Industries. Engineered for Industrial Excellence.</p>
    </div>
</footer>

<!-- WhatsApp Floating Button -->
<a href="https://wa.me/919104183331?text=Hello%20KMG%20Industries,%20I%20am%20interested%20in%20your%20services%20and%20would%20like%20to%20discuss%20further." target="_blank" class="whatsapp-float" aria-label="Chat on WhatsApp">
    <i class="fa-brands fa-whatsapp"></i>
</a>
`,
    popup: `
<div id="bada-style-popup" class="modal-overlay" style="display: none;">
    <div class="modal-content bph-modal-content bph-light-modal">
        <button class="modal-close bph-close bph-light-close" id="closePopupBtn">&times; Close</button>
        <div class="bph-modal-inner">
            <h2 class="bph-title bph-light-title">Sir I Can Save Your Time!</h2>
            <p class="bph-subtitle bph-light-subtitle">I give u best price & options for various services & machines u need. Let's discuss over chat... I'm waiting for your reply :)</p>
            
            <div class="bph-profile-card">
                <div class="bph-avatar bph-light-avatar">
                   <i class="fa-solid fa-user-tie" style="font-size: 3.5rem; color: #333; background: #f0f0f0; border-radius: 50%; padding: 10px; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;"></i>
                </div>
                <div class="bph-info">
                    <span class="bph-name bph-light-name">Dhyan Shah - Director</span>
                    <span class="bph-status">Now Online</span>
                </div>
            </div>

            <a href="https://wa.me/919104183331?text=Hello%20KMG%20Industries,%20I%20am%20interested%20in%20your%20services%20and%20would%20like%20to%20discuss%20further." target="_blank" class="btn bph-chat-btn">
                <i class="fa-brands fa-whatsapp me-2"></i> CHAT WITH ME
            </a>
        </div>
    </div>
</div>
`,
    chatWidget: `
<div class="chat-widget-wrapper">
    <!-- Chat Icon / Bubble -->
    <div id="chatBubble" class="chat-bubble">
        <i class="fa-solid fa-comments"></i>
    </div>

    <!-- Expanded Chat Panel -->
    <div id="chatPanel" class="chat-panel" style="display: none;">
        <div class="chat-header">
            <div class="chat-header-top">
                <button onclick="window.toggleChatWidget()" class="chat-min-btn"><i class="fa-solid fa-minus"></i></button>
                <button onclick="window.toggleChatWidget()" class="chat-close-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="chat-header-user-card">
                <i class="fa-solid fa-user-tie" style="font-size: 2rem; color: white; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 8px; display: flex; align-items: center; justify-content: center; width: 45px; height: 45px; margin-right: 12px;"></i>
                <div class="chat-header-info">
                    <span class="name">Dhyan Shah - Online Now</span>
                    <span class="status">Direct Advisory</span>
                </div>
            </div>
        </div>
        <div class="chat-body">
            <p class="chat-greeting" style="font-weight: 500; color: #444; margin-bottom: 12px;">Welcome! Pls enter your details and start chat.</p>
            <form id="chatForm" action="https://formspree.io/f/mlgpkkjj" method="POST">
                <div class="chat-form-row">
                    <input type="text" name="name" placeholder="Name*" required>
                    <input type="email" name="email" placeholder="E-mail*" required>
                </div>
                <input type="tel" name="phone" placeholder="Phone*" required>
                <textarea name="message" placeholder="Your Message" required></textarea>
                <button type="submit" class="chat-submit-btn">Send Message</button>
                <p id="chatFormSuccess" style="display:none; color: green; font-size: 0.8rem; text-align:center; margin-top: 5px;">Sent! We'll reply on WhatsApp.</p>
            </form>
        </div>
    </div>
</div>
`
};
