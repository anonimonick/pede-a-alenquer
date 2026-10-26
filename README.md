# Pede Aí Alenquer

Crie uma aplicação web com o seguinte código index.html completo:

<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pede Aí | Pediu, chegou! - Alenquer, PA</title>
  
  <!-- Tipografia Principal: Montserrat -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

  <style>
    /* ==========================================================================
       1. VARIÁVEIS CSS E DESIGN SYSTEM
       ========================================================================== */
    :root {
      --color-primary: #FF6A00;
      --color-primary-hover: #E55F00;
      --color-primary-light: #FFF2E8;
      --color-dark: #0F0F0F;
      --color-gray-dark: #2A2A2A;
      --color-gray: #6B6B6B;
      --color-gray-light: #F4F4F5;
      --color-border: #E5E7EB;
      --color-white: #FFFFFF;
      --color-green: #00A651;
      --color-green-light: #E6F6ED;

      --font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --radius-full: 9999px;

      --shadow-sm: 0 1px 3px rgba(15, 15, 15, 0.08);
      --shadow-md: 0 4px 12px rgba(15, 15, 15, 0.08);
      --shadow-lg: 0 8px 24px rgba(15, 15, 15, 0.12);

      --transition-fast: 0.2s ease;
      --max-width: 1200px;
    }

    /* ==========================================================================
       2. RESET E ESTILOS GERAIS
       ========================================================================== */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      font-family: var(--font-family);
      color: var(--color-dark);
      background-color: var(--color-white);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      padding-bottom: 72px;
    }

    @media (min-width: 768px) {
      body {
        padding-bottom: 0;
      }
    }

    a {
      text-decoration: none;
      color: inherit;
    }

    button {
      font-family: inherit;
      border: none;
      background: none;
      cursor: pointer;
      outline: none;
    }

    img {
      max-width: 100%;
      height: auto;
      display: block;
    }

    .container {
      width: 100%;
      max-width: var(--max-width);
      margin: 0 auto;
      padding: 0 20px;
    }

    /* ==========================================================================
       3. CABEÇALHO
       ========================================================================== */
    .header {
      background-color: var(--color-white);
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: var(--shadow-sm);
    }

    .header-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 76px;
      gap: 20px;
    }

    .brand {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .brand-logo {
      font-size: 1.65rem;
      font-weight: 800;
      color: var(--color-primary);
      letter-spacing: -0.5px;
      line-height: 1;
    }

    .brand-slogan {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--color-gray);
      letter-spacing: 0.2px;
      margin-top: 3px;
    }

    .location-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      background-color: var(--color-gray-light);
      padding: 8px 14px;
      border-radius: var(--radius-full);
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-dark);
      cursor: pointer;
      transition: background-color var(--transition-fast);
      white-space: nowrap;
    }

    .location-badge:hover {
      background-color: #EAEAEA;
    }

    .location-badge svg {
      color: var(--color-primary);
    }

    .search-wrapper {
      flex: 1;
      max-width: 480px;
      position: relative;
    }

    .search-input {
      width: 100%;
      height: 44px;
      padding: 0 44px 0 16px;
      border-radius: var(--radius-full);
      border: 1px solid var(--color-border);
      background-color: var(--color-gray-light);
      font-family: inherit;
      font-size: 0.9rem;
      color: var(--color-dark);
      transition: all var(--transition-fast);
    }

    .search-input:focus {
      background-color: var(--color-white);
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(255, 106, 0, 0.15);
    }

    .search-button {
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-gray);
      transition: color var(--transition-fast);
    }

    .search-button:hover {
      color: var(--color-primary);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-account {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: var(--radius-full);
      border: 1px solid var(--color-border);
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--color-dark);
      transition: all var(--transition-fast);
    }

    .btn-account:hover {
      border-color: var(--color-dark);
      background-color: var(--color-gray-light);
    }

    .btn-cart {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: var(--radius-full);
      background-color: var(--color-primary-light);
      color: var(--color-primary);
      transition: all var(--transition-fast);
    }

    .btn-cart:hover {
      background-color: var(--color-primary);
      color: var(--color-white);
    }

    .cart-count {
      position: absolute;
      top: -2px;
      right: -2px;
      background-color: var(--color-green);
      color: var(--color-white);
      font-size: 0.72rem;
      font-weight: 700;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--color-white);
    }

    .mobile-search-bar {
      display: none;
      padding: 12px 20px;
      background-color: var(--color-white);
      border-bottom: 1px solid var(--color-border);
    }

    /* ==========================================================================
       4. BANNER PROMOCIONAL HERO
       ========================================================================== */
    .hero-section {
      padding: 32px 0 24px;
    }

    .hero-card {
      background: linear-gradient(135deg, #FF6A00 0%, #D64F00 100%);
      border-radius: var(--radius-lg);
      padding: 40px 32px;
      color: var(--color-white);
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow-md);
    }

    .hero-content {
      max-width: 580px;
      z-index: 2;
    }

    .hero-tag {
      display: inline-block;
      background-color: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(4px);
      padding: 5px 12px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 14px;
    }

    .hero-title {
      font-size: 2.1rem;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 12px;
    }

    .hero-subtitle {
      font-size: 1.05rem;
      font-weight: 500;
      opacity: 0.95;
      margin-bottom: 24px;
      max-width: 480px;
    }

    .btn-hero {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background-color: var(--color-white);
      color: var(--color-primary);
      padding: 13px 26px;
      border-radius: var(--radius-full);
      font-size: 0.95rem;
      font-weight: 700;
      transition: all var(--transition-fast);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .btn-hero:hover {
      background-color: var(--color-gray-light);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    }

    .hero-decorative {
      position: absolute;
      right: -20px;
      bottom: -40px;
      opacity: 0.15;
      pointer-events: none;
    }

    /* ==========================================================================
       5. CATEGORIAS
       ========================================================================== */
    .section-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--color-dark);
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .categories-section {
      padding: 24px 0 32px;
    }

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }

    @media (min-width: 768px) {
      .categories-grid {
        grid-template-columns: repeat(8, 1fr);
      }
    }

    .category-card {
      background-color: var(--color-white);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 16px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
      transition: all var(--transition-fast);
      user-select: none;
    }

    .category-card:hover {
      border-color: var(--color-primary);
      transform: translateY(-3px);
      box-shadow: var(--shadow-sm);
    }

    .category-card.active {
      background-color: var(--color-primary-light);
      border-color: var(--color-primary);
    }

    .category-icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background-color: var(--color-gray-light);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary);
      transition: all var(--transition-fast);
    }

    .category-card.active .category-icon {
      background-color: var(--color-primary);
      color: var(--color-white);
    }

    .category-name {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--color-dark);
      text-align: center;
    }

    /* ==========================================================================
       6. ESTABELECIMENTOS EM DESTAQUE
       ========================================================================== */
    .restaurants-section {
      padding: 24px 0 40px;
    }

    .restaurants-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    @media (min-width: 640px) {
      .restaurants-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .restaurants-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .restaurant-card {
      background-color: var(--color-white);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: all var(--transition-fast);
      cursor: pointer;
      display: flex;
      flex-direction: column;
    }

    .restaurant-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
      border-color: #D1D5DB;
    }

    .restaurant-image-wrapper {
      position: relative;
      height: 160px;
      background-color: #ECECEC;
      overflow: hidden;
    }

    .restaurant-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .restaurant-card:hover .restaurant-image {
      transform: scale(1.04);
    }

    .demo-tag {
      position: absolute;
      top: 10px;
      left: 10px;
      background-color: rgba(15, 15, 15, 0.75);
      color: var(--color-white);
      font-size: 0.65rem;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .restaurant-rating {
      position: absolute;
      bottom: 10px;
      right: 10px;
      background-color: var(--color-white);
      color: var(--color-dark);
      padding: 4px 8px;
      border-radius: var(--radius-full);
      font-size: 0.78rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 4px;
      box-shadow: var(--shadow-sm);
    }

    .restaurant-rating svg {
      color: #F59E0B;
    }

    .restaurant-info {
      padding: 16px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .restaurant-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 4px;
    }

    .restaurant-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--color-dark);
    }

    .restaurant-category {
      font-size: 0.82rem;
      color: var(--color-gray);
      font-weight: 500;
      margin-bottom: 12px;
    }

    .restaurant-meta {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 0.8rem;
      color: var(--color-gray);
      margin-top: auto;
      padding-top: 10px;
      border-top: 1px solid var(--color-gray-light);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .meta-item.free-delivery {
      color: var(--color-green);
      font-weight: 700;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 48px 20px;
      background-color: var(--color-gray-light);
      border-radius: var(--radius-md);
      color: var(--color-gray);
    }

    .empty-state p {
      font-size: 1rem;
      margin-top: 8px;
    }

    /* ==========================================================================
       7. SEÇÃO DE OFERTAS
       ========================================================================== */
    .offers-section {
      padding: 24px 0 48px;
      background-color: #FAFAFA;
      border-top: 1px solid var(--color-border);
      border-bottom: 1px solid var(--color-border);
    }

    .offers-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 18px;
    }

    @media (min-width: 640px) {
      .offers-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .offers-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .offer-card {
      background-color: var(--color-white);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all var(--transition-fast);
      position: relative;
    }

    .offer-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
      border-color: #D1D5DB;
    }

    .offer-image-wrapper {
      position: relative;
      height: 150px;
      background-color: #ECECEC;
      overflow: hidden;
    }

    .offer-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .discount-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      background-color: var(--color-green);
      color: var(--color-white);
      font-size: 0.72rem;
      font-weight: 800;
      padding: 4px 8px;
      border-radius: var(--radius-sm);
    }

    .offer-content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .offer-restaurant {
      font-size: 0.75rem;
      color: var(--color-gray);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 4px;
    }

    .offer-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--color-dark);
      margin-bottom: 6px;
    }

    .offer-desc {
      font-size: 0.8rem;
      color: var(--color-gray);
      margin-bottom: 14px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .offer-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 10px;
    }

    .price-box {
      display: flex;
      flex-direction: column;
    }

    .price-original {
      font-size: 0.75rem;
      color: var(--color-gray);
      text-decoration: line-through;
    }

    .price-current {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--color-dark);
    }

    .btn-add-cart {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background-color: var(--color-primary);
      color: var(--color-white);
      padding: 8px 14px;
      border-radius: var(--radius-full);
      font-size: 0.82rem;
      font-weight: 700;
      transition: background-color var(--transition-fast);
    }

    .btn-add-cart:hover {
      background-color: var(--color-primary-hover);
    }

    /* ==========================================================================
       8. MODAL DO CARRINHO E TOAST
       ========================================================================== */
    .toast {
      position: fixed;
      bottom: 84px;
      right: 20px;
      background-color: var(--color-dark);
      color: var(--color-white);
      padding: 12px 20px;
      border-radius: var(--radius-md);
      font-size: 0.88rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: var(--shadow-lg);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 1000;
    }

    @media (min-width: 768px) {
      .toast {
        bottom: 24px;
      }
    }

    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    .toast-icon {
      color: var(--color-green);
    }

    .cart-drawer-overlay {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 500;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .cart-drawer-overlay.active {
      opacity: 1;
      visibility: visible;
    }

    .cart-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      max-width: 400px;
      background-color: var(--color-white);
      z-index: 501;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
    }

    .cart-drawer.active {
      transform: translateX(0);
    }

    .cart-drawer-header {
      padding: 20px;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .cart-drawer-title {
      font-size: 1.15rem;
      font-weight: 800;
    }

    .cart-drawer-close {
      font-size: 1.3rem;
      color: var(--color-gray);
      padding: 4px;
    }

    .cart-drawer-body {
      padding: 20px;
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .cart-item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--color-gray-light);
    }

    .cart-item-info h4 {
      font-size: 0.9rem;
      font-weight: 700;
    }

    .cart-item-info span {
      font-size: 0.8rem;
      color: var(--color-gray);
    }

    .cart-item-price {
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--color-dark);
    }

    .cart-empty-text {
      text-align: center;
      color: var(--color-gray);
      margin-top: 40px;
      font-size: 0.95rem;
    }

    .cart-drawer-footer {
      padding: 20px;
      border-top: 1px solid var(--color-border);
      background-color: #FAFAFA;
    }

    .cart-total-row {
      display: flex;
      justify-content: space-between;
      font-size: 1.1rem;
      font-weight: 800;
      margin-bottom: 16px;
    }

    .btn-checkout {
      width: 100%;
      background-color: var(--color-primary);
      color: var(--color-white);
      padding: 14px;
      border-radius: var(--radius-full);
      font-weight: 700;
      font-size: 0.95rem;
      text-align: center;
      transition: background-color var(--transition-fast);
    }

    .btn-checkout:hover {
      background-color: var(--color-primary-hover);
    }

    /* ==========================================================================
       9. RODAPÉ
       ========================================================================== */
    .footer {
      background-color: var(--color-dark);
      color: var(--color-white);
      padding: 60px 0 32px;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 36px;
      margin-bottom: 48px;
    }

    @media (min-width: 640px) {
      .footer-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .footer-grid {
        grid-template-columns: 2fr 1fr 1fr 1.5fr;
      }
    }

    .footer-brand .brand-logo {
      color: var(--color-primary);
      margin-bottom: 8px;
    }

    .footer-text {
      color: #A3A3A3;
      font-size: 0.85rem;
      line-height: 1.6;
      margin-top: 12px;
      max-width: 320px;
    }

    .footer-city-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background-color: rgba(255, 255, 255, 0.1);
      padding: 6px 12px;
      border-radius: var(--radius-full);
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--color-white);
      margin-top: 16px;
    }

    .footer-heading {
      font-size: 0.95rem;
      font-weight: 700;
      margin-bottom: 18px;
      letter-spacing: 0.3px;
    }

    .footer-links {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .footer-links a {
      color: #A3A3A3;
      font-size: 0.85rem;
      transition: color var(--transition-fast);
    }

    .footer-links a:hover {
      color: var(--color-primary);
    }

    .footer-bottom {
      border-top: 1px solid #262626;
      padding-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: center;
      text-align: center;
      font-size: 0.78rem;
      color: #737373;
    }

    @media (min-width: 768px) {
      .footer-bottom {
        flex-direction: row;
        justify-content: space-between;
        text-align: left;
      }
    }

    /* ==========================================================================
       10. NAVEGAÇÃO MOBILE INFERIOR
       ========================================================================== */
    .mobile-bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 64px;
      background-color: var(--color-white);
      border-top: 1px solid var(--color-border);
      display: flex;
      justify-content: space-around;
      align-items: center;
      z-index: 100;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    }

    @media (min-width: 768px) {
      .mobile-bottom-nav {
        display: none;
      }
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      color: var(--color-gray);
      font-size: 0.7rem;
      font-weight: 600;
      transition: color var(--transition-fast);
    }

    .nav-item.active,
    .nav-item:hover {
      color: var(--color-primary);
    }

    .nav-item svg {
      width: 22px;
      height: 22px;
    }

    @media (max-width: 767px) {
      .header .search-wrapper,
      .header .btn-account {
        display: none;
      }
      .mobile-search-bar {
        display: block;
      }
      .hero-title {
        font-size: 1.5rem;
      }
      .hero-card {
        padding: 28px 20px;
      }
    }
  </style>
</head>
<body>

  <header class="header">
    <div class="container header-inner">
      <a href="#" class="brand" aria-label="Página inicial do Pede Aí">
        <span class="brand-logo">Pede Aí</span>
        <span class="brand-slogan">Pediu, chegou!</span>
      </a>

      <div class="location-badge" title="Local de entrega">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span>Alenquer, PA</span>
      </div>

      <div class="search-wrapper">
        <input 
          type="text" 
          id="searchInput" 
          class="search-input" 
          placeholder="O que você quer pedir hoje?" 
          aria-label="Buscar estabelecimentos ou comidas"
        />
        <button class="search-button" aria-label="Pesquisar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>

      <div class="header-actions">
        <button class="btn-account" onclick="showToast('Área de login demonstrativa.')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>Entrar</span>
        </button>

        <button class="btn-cart" id="cartButton" aria-label="Abrir carrinho de compras">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <span class="cart-count" id="cartCount">0</span>
        </button>
      </div>
    </div>
  </header>

  <div class="mobile-search-bar">
    <div class="search-wrapper" style="max-width: 100%;">
      <input 
        type="text" 
        id="mobileSearchInput" 
        class="search-input" 
        placeholder="O que você quer pedir hoje?" 
        aria-label="Buscar estabelecimentos ou comidas no mobile"
      />
      <button class="search-button" aria-label="Pesquisar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
    </div>
  </div>

  <main>
    <section class="hero-section">
      <div class="container">
        <div class="hero-card">
          <div class="hero-content">
            <span class="hero-tag">Delivery em Alenquer</span>
            <h1 class="hero-title">Alenquer, sua próxima comida favorita está aqui!</h1>
            <p class="hero-subtitle">Peça nos seus lugares favoritos sem sair de casa.</p>
            <a href="#restaurantes" class="btn-hero">
              <span>Explorar restaurantes</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>

          <svg class="hero-decorative" width="300" height="300" viewBox="0 0 200 200" fill="currentColor">
            <path d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.5,90,-16.3,88.5,-0.9C87,14.6,81.4,29.1,73.1,42.1C64.8,55.1,53.8,66.5,40.4,73.8C27.1,81.1,13.5,84.3,-0.6,85.4C-14.7,86.4,-29.4,85.4,-42.6,79C-55.8,72.6,-67.4,60.8,-75.6,47.1C-83.8,33.4,-88.6,16.7,-88.2,0.2C-87.9,-16.2,-82.3,-32.5,-73.4,-45.6C-64.5,-58.7,-52.3,-68.7,-38.7,-76.1C-25.2,-83.4,-12.6,-88.2,1,-89.9C14.6,-91.6,29.3,-90.3,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>
      </div>
    </section>

    <section class="categories-section">
      <div class="container">
        <h2 class="section-title">Categorias populares</h2>
        <div class="categories-grid" id="categoriesGrid">
          <div class="category-card" data-category="Lanches" role="button" tabindex="0">
            <div class="category-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 11a8 8 0 0 1 16 0H4z"></path>
                <rect x="2" y="15" width="20" height="4" rx="2"></rect>
                <line x1="6" y1="11" x2="6" y2="15"></line>
                <line x1="18" y1="11" x2="18" y2="15"></line>
              </svg>
            </div>
            <span class="category-name">Lanches</span>
          </div>

          <div class="category-card" data-category="Pizzas" role="button" tabindex="0">
            <div class="category-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2l10 18H2L12 2z"></path>
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="9" cy="15" r="1"></circle>
                <circle cx="15" cy="16" r="1"></circle>
              </svg>
            </div>
            <span class="category-name">Pizzas</span>
          </div>

          <div class="category-card" data-category="Açaí" role="button" tabindex="0">
            <div class="category-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 11c0 4.4 3.6 8 8 8s8-3.6 8-8H4z"></path>
                <path d="M12 3v5"></path>
                <line x1="8" y1="4" x2="9" y2="8"></line>
                <line x1="16" y1="4" x2="15" y2="8"></line>
              </svg>
            </div>
            <span class="category-name">Açaí</span>
          </div>

          <div class="category-card" data-category="Refeições" role="button" tabindex="0">
            <div class="category-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="8"></circle>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <path d="M12 3v18"></path>
              </svg>
            </div>
            <span class="category-name">Refeições</span>
          </div>

          <div class="category-card" data-category="Bebidas" role="button" tabindex="0">
            <div class="category-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 2h10l-1 10a4 4 0 0 1-8 0L7 2z"></path>
                <path d="M12 12v9"></path>
                <line x1="8" y1="21" x2="16" y2="21"></line>
              </svg>
            </div>
            <span class="category-name">Bebidas</span>
          </div>

          <div class="category-card" data-category="Sobremesas" role="button" tabindex="0">
            <div class="category-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21H4v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7z"></path>
                <path d="M16 12V8a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v4"></path>
                <line x1="12" y1="6" x2="12" y2="3"></line>
              </svg>
            </div>
            <span class="category-name">Sobremesas</span>
          </div>

          <div class="category-card" data-category="Mercados" role="button" tabindex="0">
            <div class="category-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
            <span class="category-name">Mercados</span>
          </div>

          <div class="category-card" data-category="Farmácias" role="button" tabindex="0">
            <div class="category-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="4"></rect>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </div>
            <span class="category-name">Farmácias</span>
          </div>
        </div>
      </div>
    </section>

    <section class="restaurants-section" id="restaurantes">
      <div class="container">
        <h2 class="section-title">
          <span>Restaurantes em destaque</span>
          <span style="font-size: 0.85rem; font-weight: 500; color: var(--color-gray);" id="resultsCount">6 locais</span>
        </h2>

        <div class="restaurants-grid" id="restaurantsGrid"></div>
      </div>
    </section>

    <section class="offers-section">
      <div class="container">
        <h2 class="section-title">
          <span>Ofertas do dia</span>
          <span style="font-size: 0.85rem; font-weight: 600; color: var(--color-primary);">Até 30% OFF</span>
        </h2>

        <div class="offers-grid" id="offersGrid"></div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="brand-logo" style="color: #FF6A00; font-size: 1.8rem; font-weight: 800;">Pede Aí</div>
          <p class="footer-text">
            O aplicativo de delivery pensado com carinho para conectar você aos melhores sabores e conveniências da nossa terra.
          </p>
          <div class="footer-city-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>Alenquer, Pará, Brasil</span>
          </div>
        </div>

        <div>
          <h3 class="footer-heading">Pede Aí</h3>
          <ul class="footer-links">
            <li><a href="#about" onclick="showToast('Seção institucional demonstrativa.')">Sobre o Pede Aí</a></li>
            <li><a href="#careers" onclick="showToast('Seção de carreiras demonstrativa.')">Carreiras</a></li>
            <li><a href="#cities" onclick="showToast('Alenquer - PA é o ponto de partida do Pede Aí!')">Cidades atendidas</a></li>
          </ul>
        </div>

        <div>
          <h3 class="footer-heading">Parcerias</h3>
          <ul class="footer-links">
            <li><a href="#partner" onclick="showToast('Portal do Restaurante demonstrativo.')">Seja um parceiro</a></li>
            <li><a href="#courier" onclick="showToast('Cadastro de entregadores demonstrativo.')">Seja um entregador</a></li>
            <li><a href="#support" onclick="showToast('Canal de atendimento ao cliente.')">Atendimento</a></li>
          </ul>
        </div>

        <div>
          <h3 class="footer-heading">Legal</h3>
          <ul class="footer-links">
            <li><a href="#terms" onclick="showToast('Termos de Uso em desenvolvimento.')">Termos de uso</a></li>
            <li><a href="#privacy" onclick="showToast('Política de Privacidade em desenvolvimento.')">Política de privacidade</a></li>
            <li><a href="#security" onclick="showToast('Protocolos de segurança e privacidade.')">Segurança</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; 2026 Pede Aí Delivery. Todos os direitos reservados. Protótipo UI/UX da Etapa 1.</p>
        <p>Desenvolvido com foco no comércio de Alenquer - PA.</p>
      </div>
    </div>
  </footer>

  <nav class="mobile-bottom-nav">
    <a href="#" class="nav-item active">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
      <span>Início</span>
    </a>
    <button class="nav-item" onclick="focusSearch()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <span>Buscar</span>
    </button>
    <button class="nav-item" onclick="toggleCartDrawer()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <path d="M16 10a4 4 0 0 1-8 0"></path>
      </svg>
      <span>Pedidos</span>
    </button>
    <button class="nav-item" onclick="showToast('Perfil de usuário demonstrativo.')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
      <span>Perfil</span>
    </button>
  </nav>

  <div class="cart-drawer-overlay" id="cartOverlay" onclick="toggleCartDrawer()"></div>
  <aside class="cart-drawer" id="cartDrawer" aria-label="Carrinho de compras">
    <div class="cart-drawer-header">
      <h3 class="cart-drawer-title">Meu Carrinho</h3>
      <button class="cart-drawer-close" onclick="toggleCartDrawer()" aria-label="Fechar carrinho">&times;</button>
    </div>
    <div class="cart-drawer-body" id="cartItemsList"></div>
    <div class="cart-drawer-footer">
      <div class="cart-total-row">
        <span>Total:</span>
        <span id="cartTotalPrice">R$ 0,00</span>
      </div>
      <button class="btn-checkout" onclick="handleCheckout()">Finalizar Pedido (Demo)</button>
    </div>
  </aside>

  <div class="toast" id="toastMessage">
    <svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span id="toastText">Item adicionado com sucesso!</span>
  </div>

  <script>
    const MOCK_RESTAURANTS = [
      {
        id: 1,
        name: "Surubim Burger",
        category: "Lanches",
        categoryFilter: "Lanches",
        rating: 4.8,
        deliveryTime: "30-40 min",
        deliveryFee: "R$ 4,50",
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"
      },
      {
        id: 2,
        name: "Pizzaria Bela Vista",
        category: "Pizzas",
        categoryFilter: "Pizzas",
        rating: 4.9,
        deliveryTime: "40-55 min",
        deliveryFee: "Grátis",
        imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80"
      },
      {
        id: 3,
        name: "Sabor da Amazônia",
        category: "Comida Brasileira",
        categoryFilter: "Refeições",
        rating: 4.7,
        deliveryTime: "25-35 min",
        deliveryFee: "R$ 5,00",
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"
      },
      {
        id: 4,
        name: "Açaí do Ximango",
        category: "Açaí & Sobremesas",
        categoryFilter: "Açaí",
        rating: 4.9,
        deliveryTime: "15-25 min",
        deliveryFee: "Grátis",
        imageUrl: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80"
      },
      {
        id: 5,
        name: "Marmitas da Dona Rosa",
        category: "Marmitas & Caseira",
        categoryFilter: "Refeições",
        rating: 4.6,
        deliveryTime: "20-30 min",
        deliveryFee: "R$ 3,50",
        imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80"
      },
      {
        id: 6,
        name: "Empório das Geladas",
        category: "Bebidas & Conveniência",
        categoryFilter: "Bebidas",
        rating: 4.8,
        deliveryTime: "15-20 min",
        deliveryFee: "R$ 4,00",
        imageUrl: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80"
      }
    ];

    const MOCK_OFFERS = [
      {
        id: 101,
        restaurant: "Surubim Burger",
        title: "Smash Duplo Artesanal",
        desc: "Dois hambúrgueres de 90g, queijo cheddar derretido e maionese da casa.",
        originalPrice: 28.00,
        currentPrice: 21.90,
        imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=500&q=80"
      },
      {
        id: 102,
        restaurant: "Pizzaria Bela Vista",
        title: "Pizza Calabresa Especial",
        desc: "Massa fina, molho artesanal de tomate, fatias de calabresa e cebola.",
        originalPrice: 52.00,
        currentPrice: 39.90,
        imageUrl: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=500&q=80"
      },
      {
        id: 103,
        restaurant: "Açaí do Ximango",
        title: "Copo Açaí 500ml Turbinado",
        desc: "Açaí puro acompanhado de banana, granola crocante e leite condensado.",
        originalPrice: 22.00,
        currentPrice: 16.50,
        imageUrl: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=500&q=80"
      },
      {
        id: 104,
        restaurant: "Marmitas da Dona Rosa",
        title: "Marmitex Executiva de Frango",
        desc: "Filé de frango grelhado, arroz fresquinho, feijão caseiro e farofa crocante.",
        originalPrice: 24.00,
        currentPrice: 18.00,
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80"
      }
    ];

    let cart = [];
    let activeCategory = null;
    let currentSearchTerm = "";

    const restaurantsGrid = document.getElementById("restaurantsGrid");
    const offersGrid = document.getElementById("offersGrid");
    const resultsCount = document.getElementById("resultsCount");
    const searchInput = document.getElementById("searchInput");
    const mobileSearchInput = document.getElementById("mobileSearchInput");
    const cartButton = document.getElementById("cartButton");
    const cartCount = document.getElementById("cartCount");
    const cartDrawer = document.getElementById("cartDrawer");
    const cartOverlay = document.getElementById("cartOverlay");
    const cartItemsList = document.getElementById("cartItemsList");
    const cartTotalPrice = document.getElementById("cartTotalPrice");
    const toast = document.getElementById("toastMessage");
    const toastText = document.getElementById("toastText");

    document.addEventListener("DOMContentLoaded", () => {
      renderRestaurants();
      renderOffers();
      setupEvents();
    });

    function renderRestaurants() {
      const filtered = MOCK_RESTAURANTS.filter(item => {
        const matchesCategory = activeCategory 
          ? item.categoryFilter.toLowerCase() === activeCategory.toLowerCase() || item.category.toLowerCase().includes(activeCategory.toLowerCase())
          : true;

        const matchesSearch = currentSearchTerm
          ? item.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) || 
            item.category.toLowerCase().includes(currentSearchTerm.toLowerCase())
          : true;

        return matchesCategory && matchesSearch;
      });

      resultsCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'local' : 'locais'}`;

      if (filtered.length === 0) {
        restaurantsGrid.innerHTML = `
          <div class="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto; color: var(--color-gray);">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <p>Nenhum estabelecimento encontrado para "${currentSearchTerm || activeCategory}".</p>
          </div>
        `;
        return;
      }

      restaurantsGrid.innerHTML = filtered.map(item => `
        <article class="restaurant-card" onclick="showToast('Abrindo cardápio de ${item.name} (Demonstração)')" tabindex="0">
          <div class="restaurant-image-wrapper">
            <img 
              src="${item.imageUrl}" 
              alt="${item.name} - Imagem demonstrativa" 
              class="restaurant-image"
              loading="lazy"
              onerror="this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80'"
            />
            <span class="demo-tag">Demonstrativo</span>
            <div class="restaurant-rating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>${item.rating.toFixed(1)}</span>
            </div>
          </div>
          <div class="restaurant-info">
            <div class="restaurant-header">
              <h3 class="restaurant-name">${item.name}</h3>
            </div>
            <p class="restaurant-category">${item.category}</p>
            <div class="restaurant-meta">
              <div class="meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>${item.deliveryTime}</span>
              </div>
              <div class="meta-item ${item.deliveryFee === 'Grátis' ? 'free-delivery' : ''}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
                <span>${item.deliveryFee}</span>
              </div>
            </div>
          </div>
        </article>
      `).join('');
    }

    function renderOffers() {
      offersGrid.innerHTML = MOCK_OFFERS.map(offer => `
        <article class="offer-card">
          <div class="offer-image-wrapper">
            <img 
              src="${offer.imageUrl}" 
              alt="${offer.title}" 
              class="offer-image"
              loading="lazy"
              onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80'"
            />
            <span class="discount-badge">OFERTA</span>
          </div>
          <div class="offer-content">
            <span class="offer-restaurant">${offer.restaurant}</span>
            <h3 class="offer-title">${offer.title}</h3>
            <p class="offer-desc">${offer.desc}</p>
            <div class="offer-footer">
              <div class="price-box">
                <span class="price-original">R$ ${offer.originalPrice.toFixed(2).replace('.', ',')}</span>
                <span class="price-current">R$ ${offer.currentPrice.toFixed(2).replace('.', ',')}</span>
              </div>
              <button 
                class="btn-add-cart" 
                onclick="addToCart(${offer.id})"
                aria-label="Adicionar ${offer.title} ao carrinho"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Pedir</span>
              </button>
            </div>
          </div>
        </article>
      `).join('');
    }

    function setupEvents() {
      searchInput.addEventListener("input", (e) => {
        currentSearchTerm = e.target.value.trim();
        if (mobileSearchInput.value !== currentSearchTerm) {
          mobileSearchInput.value = currentSearchTerm;
        }
        renderRestaurants();
      });

      mobileSearchInput.addEventListener("input", (e) => {
        currentSearchTerm = e.target.value.trim();
        if (searchInput.value !== currentSearchTerm) {
          searchInput.value = currentSearchTerm;
        }
        renderRestaurants();
      });

      const categoryCards = document.querySelectorAll(".category-card");
      categoryCards.forEach(card => {
        card.addEventListener("click", () => {
          const categoryName = card.getAttribute("data-category");
          
          if (activeCategory === categoryName) {
            activeCategory = null;
            card.classList.remove("active");
          } else {
            categoryCards.forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            activeCategory = categoryName;
          }
          renderRestaurants();
        });
      });

      cartButton.addEventListener("click", toggleCartDrawer);
    }

    function addToCart(productId) {
      const product = MOCK_OFFERS.find(p => p.id === productId);
      if (!product) return;

      const existingIndex = cart.findIndex(item => item.id === productId);
      if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
      } else {
        cart.push({
          id: product.id,
          title: product.title,
          price: product.currentPrice,
          restaurant: product.restaurant,
          quantity: 1
        });
      }

      updateCartBadge();
      showToast(`${product.title} adicionado ao carrinho!`);
    }

    function updateCartBadge() {
      const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
      cartCount.textContent = totalCount;
      renderCartItems();
    }

    function renderCartItems() {
      if (cart.length === 0) {
        cartItemsList.innerHTML = `
          <div class="cart-empty-text">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto; color: var(--color-gray);">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
            </svg>
            <p style="margin-top: 10px;">Seu carrinho está vazio.</p>
          </div>
        `;
        cartTotalPrice.textContent = "R$ 0,00";
        return;
      }

      let total = 0;
      cartItemsList.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
          <div class="cart-item-row">
            <div class="cart-item-info">
              <h4>${item.title}</h4>
              <span>Qtd: ${item.quantity} &bull; ${item.restaurant}</span>
            </div>
            <div class="cart-item-price">
              R$ ${itemTotal.toFixed(2).replace('.', ',')}
            </div>
          </div>
        `;
      }).join('');

      cartTotalPrice.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    function toggleCartDrawer() {
      const isActive = cartDrawer.classList.contains("active");
      if (isActive) {
        cartDrawer.classList.remove("active");
        cartOverlay.classList.remove("active");
      } else {
        renderCartItems();
        cartDrawer.classList.add("active");
        cartOverlay.classList.add("active");
      }
    }

    function handleCheckout() {
      if (cart.length === 0) {
        showToast("Adicione itens ao carrinho antes de finalizar.");
        return;
      }
      showToast("Etapa de checkout demonstrativa. Pedido registrado localmente!");
      cart = [];
      updateCartBadge();
      toggleCartDrawer();
    }

    function focusSearch() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      mobileSearchInput.focus();
    }

    let toastTimeout;
    function showToast(message) {
      toastText.textContent = message;
      toast.classList.add("show");

      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
      }, 3000);
    }
  </script>
</body>
</html>

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6b7d59e0-befc-4eac-b322-139a7092da8c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
