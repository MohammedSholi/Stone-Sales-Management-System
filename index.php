<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="Hajari / حجري — premium natural stone curated for luxury residences, hospitality, and signature interiors."
    />
    <title>Hajari / حجري — Luxury Stone Atelier</title>

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />

    <link rel="stylesheet" href="/assets/css/base.css?v=4" />
    <link rel="stylesheet" href="/assets/css/components.css?v=4" />
    <link rel="stylesheet" href="/assets/css/layout.css?v=13" />
    <link rel="stylesheet" href="/assets/css/pages/landing.css?v=5" />
    <link rel="stylesheet" href="/assets/css/theme-toggle.css?v=6" />
    <link rel="icon" href="https://cdn-icons-png.flaticon.com/512/9920/9920984.png" />
    <script src="/assets/js/theme.js"></script>
  </head>

  <body>
    <nav class="navbar">
      <div class="navbar-container">
        <a href="/index.php" class="navbar-brand">
          <img src="/assets/img/logo-hajari.svg" alt="Hajari" class="navbar-logo" />
          <span>Hajari / حجري</span>
        </a>

        <div class="navbar-center">
          <div class="navbar-nav"></div>
        </div>

        <div class="navbar-right">
          <div class="navbar-actions-utilities"></div>
          <div class="theme-toggle">
            <input
              type="checkbox"
              id="darkModeToggle"
              class="theme-toggle__input"
              aria-label="Toggle dark mode"
            />
            <label for="darkModeToggle" class="theme-toggle__label">
              <span class="theme-toggle__sky"></span>
              <span class="theme-toggle__sun"></span>
              <span class="theme-toggle__moon"></span>
              <div class="theme-toggle__stars">
                <span class="theme-toggle__star theme-toggle__star--1"></span
                ><span class="theme-toggle__star theme-toggle__star--2"></span
                ><span class="theme-toggle__star theme-toggle__star--3"></span
                ><span class="theme-toggle__star theme-toggle__star--4"></span
                ><span class="theme-toggle__star theme-toggle__star--5"></span>
              </div>
              <span class="theme-toggle__cloud theme-toggle__cloud--1"></span>
              <span class="theme-toggle__cloud theme-toggle__cloud--2"></span>
              <div class="theme-toggle__hills">
                <span class="theme-toggle__hill theme-toggle__hill--1"></span
                ><span class="theme-toggle__hill theme-toggle__hill--3"></span
                ><span class="theme-toggle__hill theme-toggle__hill--2"></span
                ><span class="theme-toggle__tree"
                  ><div class="theme-toggle__tree-top"></div>
                  <div class="theme-toggle__tree-trunk"></div
                ></span>
              </div>
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

    <main class="home-page">
      <section class="home-hero parallax-hero" aria-labelledby="homeHeroTitle">
        <div class="container home-hero__grid">
          <div class="home-hero__copy">
            <span class="home-hero__eyebrow" data-i18n="heroEyebrow"
              >Architectural Stone, Curated Like Art</span
            >
            <h1 class="home-hero__title" id="homeHeroTitle" data-i18n="heroTitle">
              Natural stone for residences, boutiques, and landmark spaces.
            </h1>
            <p class="home-hero__subtitle" data-i18n="heroSubtitle">
              Hajari brings together premium marble, limestone, and Jerusalem
              stone with the speed of a modern platform and the taste level of
              a private materials studio.
            </p>
            <div class="home-hero__actions">
              <a href="/catalog/stones.html" class="btn btn-accent btn-lg" data-i18n="heroPrimary"
                >Explore the Collection</a
              >
              <a href="/customer/custom-request.html" class="btn btn-outline btn-lg" data-i18n="heroSecondary"
                >Book a Bespoke Request</a
              >
            </div>
          </div>

          <div class="home-hero__media">
            <article class="hero-media-card hero-media-card--tall">
              <video autoplay muted loop playsinline preload="metadata" aria-label="Luxury stone atelier walkthrough">
                <source src="/assets/img/aa/aa/a0184da683694bdd2087096d805d3b92.mp4" type="video/mp4" />
              </video>
            </article>
            <article class="hero-media-card hero-media-card--small">
              <video autoplay muted loop playsinline preload="metadata" aria-label="Stone texture motion detail">
                <source src="/assets/img/aa/aa/1258de32900ae345df2fe22bccb25a25.mp4" type="video/mp4" />
              </video>
            </article>
            <article class="hero-note-card">
              <span class="hero-note-card__value" data-i18n="trustOneValue">120+</span>
              <span class="hero-note-card__label" data-i18n="trustOneLabel">premium stone references</span>
            </article>
          </div>
        </div>

        <div class="container home-proof">
          <div class="home-proof__item">
            <strong data-i18n="trustOneValue">120+</strong>
            <span data-i18n="trustOneLabel">premium stone references</span>
          </div>
          <div class="home-proof__item">
            <strong data-i18n="trustTwoValue">48h</strong>
            <span data-i18n="trustTwoLabel">for curated sourcing response</span>
          </div>
          <div class="home-proof__item">
            <strong data-i18n="trustThreeValue">White-glove</strong>
            <span data-i18n="trustThreeLabel">coordination from sample to delivery</span>
          </div>
        </div>
      </section>

      <section class="home-section">
        <div class="container">
          <div class="section-heading">
            <span class="section-heading__eyebrow" data-i18n="collectionsEyebrow">Featured Materials</span>
            <h2 class="section-heading__title" data-i18n="collectionsTitle">
              A sharper product mix, chosen for statement projects.
            </h2>
          </div>

          <div class="collection-grid">
            <article class="collection-card">
              <img src="/assets/img/aa/aa/0d8567ea6afcc83d58155c413e57c991.jpg" alt="Jerusalem stone" class="collection-card__image" />
              <div class="collection-card__body">
                <span class="collection-card__type" data-i18n="collectionOneType">Jerusalem Stone</span>
                <h3 data-i18n="collectionOneName">Jerusalem Heritage</h3>
                <p data-i18n="collectionOneText">Warm architectural tonality with heritage character for facades, courtyards, and timeless interior detailing.</p>
              </div>
            </article>

            <article class="collection-card">
              <img src="/assets/img/aa/aa/f6e6ca03ecd884a6d3794f2f5c45fe2f.jpg" alt="Luxury marble kitchen" class="collection-card__image" />
              <div class="collection-card__body">
                <span class="collection-card__type" data-i18n="collectionTwoType">Marble</span>
                <h3 data-i18n="collectionTwoName">Calacatta Atelier</h3>
                <p data-i18n="collectionTwoText">High-contrast veining and gallery-grade presence for kitchens, hospitality counters, and sculptural surfaces.</p>
              </div>
            </article>

            <article class="collection-card">
              <img src="/assets/img/aa/aa/0627e541e836ebfbfbb27ae6f10d4c73.jpg" alt="Limestone architecture" class="collection-card__image" />
              <div class="collection-card__body">
                <span class="collection-card__type" data-i18n="collectionThreeType">Limestone</span>
                <h3 data-i18n="collectionThreeName">Desert Veil Limestone</h3>
                <p data-i18n="collectionThreeText">Soft mineral depth and quiet luxury for serene spaces that need warmth without noise.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="home-section section home-section--surface">
        <div class="container">
          <div class="section-heading section-heading--split">
            <h2 class="section-heading__title" data-i18n="goodsTitle">Premium selections ready to specify</h2>
          </div>

          <div class="goods-grid">
            <article class="goods-card">
              <img src="/assets/img/aa/aa/1abf05370ca47a98ad39f23a8f662c34.jpg" alt="Noir Gallery Slab" class="goods-card__image" />
              <div class="goods-card__body">
                <h3 data-i18n="goodsOneName">Noir Gallery Slab</h3>
                <p data-i18n="goodsOneMeta">Book-matched marble · polished finish</p>
                <strong data-i18n="goodsOnePrice">$340 / m2</strong>
              </div>
            </article>

            <article class="goods-card">
              <img src="/assets/img/aa/aa/833675a364b8211efff5185232cbe955.jpg" alt="Ivory Courtyard Cut" class="goods-card__image" />
              <div class="goods-card__body">
                <h3 data-i18n="goodsTwoName">Ivory Courtyard Cut</h3>
                <p data-i18n="goodsTwoMeta">Jerusalem stone · brushed finish</p>
                <strong data-i18n="goodsTwoPrice">$185 / m2</strong>
              </div>
            </article>

            <article class="goods-card">
              <img src="/assets/img/aa/aa/32a0581f956f3fa0f30082300cf0e319.jpg" alt="Cloudline Limestone" class="goods-card__image" />
              <div class="goods-card__body">
                <h3 data-i18n="goodsThreeName">Cloudline Limestone</h3>
                <p data-i18n="goodsThreeMeta">Limestone · honed finish</p>
                <strong data-i18n="goodsThreePrice">$210 / m2</strong>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="home-section">
        <div class="container studio-grid">
          <div class="studio-copy">
            <span class="section-heading__eyebrow" data-i18n="studioEyebrow">Why Hajari</span>
            <h2 class="section-heading__title" data-i18n="studioTitle">Designed to feel like a luxury materials desk, not a generic catalog.</h2>
            <p class="studio-copy__text" data-i18n="studioBody">Every touchpoint was reshaped to be faster, more editorial, and more intentional: stronger navigation, richer project storytelling, clearer product discovery, and a buying experience that feels premium from the first click.</p>
            <ul class="studio-list">
              <li data-i18n="studioPointOne">High-end visual direction aligned with premium stone positioning</li>
              <li data-i18n="studioPointTwo">Concierge-style product presentation with product context, not only specs</li>
              <li data-i18n="studioPointThree">Built to scale across English and Arabic without breaking layout or tone</li>
            </ul>
          </div>
          <div class="studio-visual">
            <img src="/assets/img/aa/aa/38803901df6c56692512b0359d69f803.jpg" alt="Premium stone architecture" />
          </div>
        </div>
      </section>

      <section class="home-section home-gallery-section">
        <div class="container">
          <div class="section-heading">
            <span class="section-heading__eyebrow" data-i18n="galleryEyebrow">Project Atmosphere</span>
            <h2 class="section-heading__title" data-i18n="galleryTitle">Imagery selected to sell aspiration, texture, and architectural confidence.</h2>
          </div>

          <div class="gallery-grid">
            <figure class="gallery-card">
              <img src="/assets/img/aa/aa/be20973ad694a6477da03a9f81289174.jpg" alt="Luxury kitchens" />
              <figcaption data-i18n="galleryOneLabel">Luxury kitchens</figcaption>
            </figure>
            <figure class="gallery-card">
              <img src="/assets/img/aa/aa/e9a4c551dafaa1e3410cf31a51e55357.jpg" alt="Boutique hospitality" />
              <figcaption data-i18n="galleryTwoLabel">Boutique hospitality</figcaption>
            </figure>
            <figure class="gallery-card">
              <img src="/assets/img/aa/aa/27953634adc83a8d01f09c210e11d5a3.webp" alt="Stone detailing" />
              <figcaption data-i18n="galleryThreeLabel">Stone detailing</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section class="home-cta section">
        <div class="container home-cta__content">
          <h2 data-i18n="ctaTitle">Start with a collection. End with a signature space.</h2>
          <p data-i18n="ctaText">Browse refined stone options or brief our team for a more tailored sourcing route.</p>
          <div class="home-cta__actions">
            <a href="/catalog/stones.html" class="btn btn-accent btn-lg" data-i18n="ctaPrimary">Browse Catalog</a>
            <a href="/about.html" class="btn btn-outline btn-lg" data-i18n="ctaSecondary" style="background-color: rgba(182, 126, 64, 0.85); border-color: rgba(182, 126, 64, 0.85); color: white;">About Hajari</a>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h4 data-i18n="footerTitle">Hajari / حجري</h4>
            <p class="footer-description" data-i18n="footerText">
              A premium stone atelier for curated materials, design-led sourcing, and elevated project execution rooted in Palestine and global design.
            </p>
          </div>

          <div class="footer-section">
            <a href="/about.html" class="footer-link" data-i18n="footerAbout">About</a>
            <a href="/customer/custom-request.html" class="footer-link" data-i18n="footerRequest">Custom Request</a>
            <a href="/auth/login.html" class="footer-link" data-i18n="footerAdmin">Admin Login</a>
          </div>

          <div class="footer-section">
            <h4 data-i18n="footerContact">Contact</h4>
            <div class="footer-links">
              <span class="footer-link" data-i18n="footerPhone">+972 59-394-3350</span>
              <span class="footer-link" data-i18n="footerEmail">info@hajari-stone.com</span>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p data-i18n="footerRights">© 2026 Hajari — حجري. All rights reserved.</p>
        </div>
      </div>
    </footer>

    <script type="module" src="/assets/js/app.js?v=6"></script>
    <script type="module" src="/assets/js/pages/landing.js"></script>
    <script type="module" src="/assets/js/pages/home-page.js?v=1"></script>
  </body>
</html>
