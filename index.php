<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="Premium stone sales - Marble, Limestone, Jerusalem Stone for your architectural projects"
    />
    <title>SSMS - Premium Stone Solutions</title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap"
      rel="stylesheet"
    />

    <!-- Stylesheets -->
    <link rel="stylesheet" href="/assets/css/base.css?v=2" />
    <link rel="stylesheet" href="/assets/css/components.css?v=2" />
    <link rel="stylesheet" href="/assets/css/layout.css?v=11" />
    <link rel="stylesheet" href="/assets/css/pages/landing.css?v=2" />
    <link rel="stylesheet" href="/assets/css/theme-toggle.css?v=4" />
    <link rel="icon" type="image/svg+xml" href="/assets/img/logo.svg" />
    <script src="/assets/js/theme.js"></script>
  </head>
  <body>
    <!-- Navbar -->
    <nav class="navbar">
      <div class="navbar-container">
        <a href="/index.php" class="navbar-brand">
          <img src="/assets/img/logo.svg" alt="SSMS" class="navbar-logo" />
          <span>SSMS</span>
        </a>

        <div class="navbar-center">
          <div class="navbar-nav"></div>
        </div>

        <div class="navbar-right">
          <div class="navbar-actions-utilities"></div>
          <div class="theme-toggle">
            <input type="checkbox" id="darkModeToggle" class="theme-toggle__input" aria-label="Toggle dark mode" />
            <label for="darkModeToggle" class="theme-toggle__label">
              <span class="theme-toggle__sky"></span>
              <span class="theme-toggle__sun"></span>
              <span class="theme-toggle__moon"></span>
              <div class="theme-toggle__stars"><span class="theme-toggle__star theme-toggle__star--1"></span><span class="theme-toggle__star theme-toggle__star--2"></span><span class="theme-toggle__star theme-toggle__star--3"></span><span class="theme-toggle__star theme-toggle__star--4"></span><span class="theme-toggle__star theme-toggle__star--5"></span></div>
              <span class="theme-toggle__cloud theme-toggle__cloud--1"></span>
              <span class="theme-toggle__cloud theme-toggle__cloud--2"></span>
              <div class="theme-toggle__hills"><span class="theme-toggle__hill theme-toggle__hill--1"></span><span class="theme-toggle__hill theme-toggle__hill--3"></span><span class="theme-toggle__hill theme-toggle__hill--2"></span><span class="theme-toggle__tree"><div class="theme-toggle__tree-top"></div><div class="theme-toggle__tree-trunk"></div></span></div>
              <span class="theme-toggle__knob"></span>
            </label>
          </div>
          <div class="navbar-actions-auth"></div>
          <button class="navbar-toggle" aria-label="Toggle menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      <div class="navbar-mobile-menu">
        <div class="navbar-nav"></div>
        <div class="navbar-actions-mobile"></div>
      </div>
    </nav>

    <!-- Parallax Hero Section -->
    <section class="parallax-hero" aria-labelledby="parallaxHeroTitle">
      <div class="parallax-hero__overlay"></div>
      <div class="container parallax-hero__container">
        <div class="parallax-hero__content animate-fadeIn">
          <span class="parallax-hero__eyebrow">Curated stone for exceptional spaces</span>
          <h1 class="parallax-hero__title" id="parallaxHeroTitle">
            Elegance Carved in Stone
          </h1>
          <p class="parallax-hero__subtitle">
            From luxury marble statements to timeless architectural surfaces,
            discover premium natural stone selected to elevate landmark homes,
            hospitality projects, and refined interiors.
          </p>
          <div class="parallax-hero__actions">
            <a href="/catalog/stones.html" class="btn btn-accent btn-lg"
              >Shop the Catalog</a
            >
            <a href="/customer/custom-request.html" class="btn btn-outline btn-lg parallax-hero__secondary"
              >Request Bespoke Sourcing</a
            >
          </div>
        </div>
      </div>
    </section>

    <!-- Categories Section -->
    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Stone Categories</h2>
          <p class="section-subtitle">
            Explore our premium collection of natural stones
          </p>
        </div>

        <div class="category-grid">
          <a
            href="/catalog/stones.html?type=Marble"
            class="category-card"
            data-tilt
          >
            <div class="category-card-icon">🏛️</div>
            <h3 class="category-card-title">Marble</h3>
            <p class="category-card-description">
              Luxurious Italian and premium marble varieties
            </p>
            <span class="category-card-arrow">→</span>
          </a>

          <a
            href="/catalog/stones.html?type=Limestone"
            class="category-card"
            data-tilt
          >
            <div class="category-card-icon">⛰️</div>
            <h3 class="category-card-title">Limestone</h3>
            <p class="category-card-description">
              Durable travertine and limestone options
            </p>
            <span class="category-card-arrow">→</span>
          </a>

          <a
            href="/catalog/stones.html?type=Jerusalem Stone"
            class="category-card"
            data-tilt
          >
            <div class="category-card-icon">🕌</div>
            <h3 class="category-card-title">Jerusalem Stone</h3>
            <p class="category-card-description">
              Authentic heritage and architectural stone
            </p>
            <span class="category-card-arrow">→</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Best Sellers Section -->
    <section class="section section-alt">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Best Sellers</h2>
          <p class="section-subtitle">Our most popular stone selections</p>
        </div>

        <div class="product-grid" id="bestSellersGrid">
          <!-- Loading skeletons will be shown, then replaced with products -->
        </div>

        <div class="text-center mt-2xl">
          <a href="/catalog/stones.html" class="btn btn-outline btn-lg"
            >View All Stones</a
          >
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">How It Works</h2>
          <p class="section-subtitle">
            Simple process for your stone procurement
          </p>
        </div>

        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-number">1</div>
            <h3 class="feature-title">Browse & Select</h3>
            <p class="feature-description">
              Explore our extensive catalog of premium stones. Filter by type,
              size, and finish to find your perfect match.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-number">2</div>
            <h3 class="feature-title">Place Order</h3>
            <p class="feature-description">
              Add items to cart and checkout securely. For custom needs, submit
              a custom request with your specifications.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-number">3</div>
            <h3 class="feature-title">Track & Receive</h3>
            <p class="feature-description">
              Monitor your order status in real-time. Our team ensures quality
              packaging and timely delivery to your site.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="section section-alt">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">What Our Clients Say</h2>
          <p class="section-subtitle">
            Trusted by architects, builders, and homeowners
          </p>
        </div>

        <div class="testimonial-grid">
          <div class="testimonial-card">
            <div class="testimonial-rating">
              <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span
              ><span>⭐</span>
            </div>
            <p class="testimonial-text">
              "Exceptional quality and service. The Carrara marble we ordered
              exceeded our expectations. Perfect for our luxury hotel project."
            </p>
            <div class="testimonial-author">
              <div class="testimonial-avatar">JD</div>
              <div>
                <div class="testimonial-name">John Davidson</div>
                <div class="testimonial-role">Architect</div>
              </div>
            </div>
          </div>

          <div class="testimonial-card">
            <div class="testimonial-rating">
              <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span
              ><span>⭐</span>
            </div>
            <p class="testimonial-text">
              "The Jerusalem stone quality is outstanding. Great for our
              heritage building restoration. Professional team and reliable
              delivery."
            </p>
            <div class="testimonial-author">
              <div class="testimonial-avatar">RC</div>
              <div>
                <div class="testimonial-name">Rachel Cohen</div>
                <div class="testimonial-role">Building Contractor</div>
              </div>
            </div>
          </div>

          <div class="testimonial-card">
            <div class="testimonial-rating">
              <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span
              ><span>⭐</span>
            </div>
            <p class="testimonial-text">
              "Best stone supplier we've worked with. Competitive prices,
              premium quality, and excellent customer support. Highly
              recommend!"
            </p>
            <div class="testimonial-author">
              <div class="testimonial-avatar">SM</div>
              <div>
                <div class="testimonial-name">Sarah Mitchell</div>
                <div class="testimonial-role">Interior Designer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">Ready to Start Your Project?</h2>
          <p class="cta-subtitle">
            Get in touch with our team or create a custom request for your
            specific needs
          </p>
          <div class="cta-actions">
            <a
              href="/customer/custom-request.html"
              class="btn btn-accent btn-lg"
              >Custom Request</a
            >
            <a href="/catalog/stones.html" class="btn btn-outline btn-lg"
              >Browse Catalog</a
            >
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h4>About SSMS</h4>
            <p style="color: #e5dcc8; line-height: 1.6">
              Premium stone sales specializing in marble, limestone, and
              Jerusalem stone. Serving architects, builders, and homeowners with
              quality materials since 1995.
            </p>
            <div class="footer-social">
              <a href="#" class="footer-social-link" aria-label="Facebook">f</a>
              <a href="#" class="footer-social-link" aria-label="Twitter">𝕏</a>
              <a href="#" class="footer-social-link" aria-label="Instagram"
                >📷</a
              >
              <a href="#" class="footer-social-link" aria-label="LinkedIn"
                >in</a
              >
            </div>
          </div>

          <div class="footer-section">
            <h4>Quick Links</h4>
            <div class="footer-links">
              <a href="/catalog/stones.html" class="footer-link"
                >Browse Catalog</a
              >
              <a href="/customer/custom-request.html" class="footer-link"
                >Custom Request</a
              >
              <a href="/auth/login.html" class="footer-link">My Account</a>
              <a href="/customer/my-orders.html" class="footer-link"
                >Track Order</a
              >
            </div>
          </div>

          <div class="footer-section">
            <h4>Stone Types</h4>
            <div class="footer-links">
              <a href="/catalog/stones.html?type=Marble" class="footer-link"
                >Marble</a
              >
              <a href="/catalog/stones.html?type=Limestone" class="footer-link"
                >Limestone</a
              >
              <a
                href="/catalog/stones.html?type=Jerusalem Stone"
                class="footer-link"
                >Jerusalem Stone</a
              >
            </div>
          </div>

          <div class="footer-section">
            <h4>Contact Us</h4>
            <div class="footer-links">
              <p style="color: #e5dcc8">📍 123 Stone Avenue, NY 10001</p>
              <p style="color: #e5dcc8">📞 +1 (555) STONE-99</p>
              <p style="color: #e5dcc8">✉️ info@ssms-stone.com</p>
              <p style="color: #e5dcc8">🕐 Mon-Fri: 8AM - 6PM</p>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p>
            &copy; 2026 SSMS - Stone Sales Management System. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>

    <!-- Scripts -->
    <script type="module" src="/assets/js/app.js?v=4"></script>
    <script type="module" src="/assets/js/pages/landing.js"></script>
  </body>
</html>
