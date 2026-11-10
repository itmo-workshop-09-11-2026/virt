"use strict";

const STORAGE_KEY = 'team3:cart:v1';
const FAVORITES_KEY = 'team3:favorites:v1';
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?q=80&w=400&auto=format&fit=crop';
const MAX_QTY = 99;

let PRODUCTS = [
    // Еда
    { id: 'bar',        name: 'Космический батончик',   price: 100, category: 'Еда',        image: 'https://images.unsplash.com/photo-1622484212850-eb596d769edc?q=80&w=600&auto=format&fit=crop' },
    { id: 'soup',       name: 'Туба борща',             price: 250, category: 'Еда',        image: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=600&auto=format&fit=crop' },
    { id: 'water',      name: 'Вода «Комета»',          price: 80,  category: 'Еда',        image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=600&auto=format&fit=crop' },
    { id: 'coffee',     name: 'Кофе «Черная дыра»',     price: 320, category: 'Еда',        image: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=600&auto=format&fit=crop' },
    { id: 'candy',      name: 'Метеоритные конфеты',    price: 150, category: 'Еда',        image: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?q=80&w=600&auto=format&fit=crop' },
    // Книги
    { id: 'book',       name: 'Книга по JS',            price: 200, category: 'Книги',      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop' },
    { id: 'atlas',      name: 'Атлас созвездий',        price: 340, category: 'Книги',      image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop' },
    { id: 'diary',      name: 'Дневник астронавта',     price: 290, category: 'Книги',      image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=600&auto=format&fit=crop' },
    { id: 'scifi',      name: 'Фантастика: Марс',       price: 450, category: 'Книги',      image: 'https://images.unsplash.com/photo-1618666012174-83b441c0bc76?q=80&w=600&auto=format&fit=crop' },
    // Игры
    { id: 'game',       name: 'Настольная игра',        price: 50,  category: 'Игры',       image: 'https://images.unsplash.com/photo-1611891487122-207579d67d98?q=80&w=600&auto=format&fit=crop' },
    { id: 'puzzle',     name: 'Космо-пазл «Галактика»', price: 450, category: 'Игры',       image: 'https://images.unsplash.com/photo-1585504198199-20277593b94f?q=80&w=600&auto=format&fit=crop' },
    { id: 'lego',       name: 'Конструктор Ракета',     price: 890, category: 'Игры',       image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=600&auto=format&fit=crop' },
    { id: 'cards',      name: 'Карты Таро Космос',      price: 380, category: 'Игры',       image: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?q=80&w=600&auto=format&fit=crop' },
    // Сувениры
    { id: 'magnet',     name: 'Магнит «Луна»',          price: 150, category: 'Сувениры',   image: 'https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?q=80&w=600&auto=format&fit=crop' },
    { id: 'poster',     name: 'Постер «Марс»',          price: 190, category: 'Сувениры',   image: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=600&auto=format&fit=crop' },
    { id: 'mug',        name: 'Кружка «SpaceX»',        price: 220, category: 'Сувениры',   image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=600&auto=format&fit=crop' },
    { id: 'tshirt',     name: 'Футболка NASA',          price: 550, category: 'Сувениры',   image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=600&auto=format&fit=crop' },
    // Экипировка
    { id: 'flashlight', name: 'Фонарик Starlight',      price: 520, category: 'Экипировка', image: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?q=80&w=600&auto=format&fit=crop' },
    { id: 'gloves',     name: 'Перчатки астронавта',    price: 690, category: 'Экипировка', image: 'https://images.unsplash.com/photo-1584820927498-cafe3c157921?q=80&w=600&auto=format&fit=crop' },
    { id: 'backpack',   name: 'Рюкзак «Orbit»',         price: 1200, category: 'Экипировка', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600&auto=format&fit=crop' },
    { id: 'glasses',    name: 'Очки дополненной реальности', price: 2500, category: 'Экипировка', image: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?q=80&w=600&auto=format&fit=crop' },
    { id: 'helmet',     name: 'Шлем виртуальной реальности', price: 3200, category: 'Экипировка', image: 'https://images.unsplash.com/photo-1626387346567-68d0c2f5a82f?q=80&w=600&auto=format&fit=crop' },
    { id: 'suit',       name: 'Скафандр тренировочный', price: 5000, category: 'Экипировка', image: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=600&auto=format&fit=crop' }
];

const byId = (id) => PRODUCTS.find((p) => p.id === id);

let cart = [];
let discountApplied = false;
let favorites = new Set();
let showFavoritesOnly = false;
let searchTerm = '';
let selectedCategory = 'all';
let sortMode = 'default';

const $ = (selector) => document.querySelector(selector);

/* ---------- Сохранение ---------- */
function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
        cart = saved.filter((item) => byId(item.id)).map((item) => {
            const product = byId(item.id);
            return { id: item.id, name: product.name, price: product.price, qty: item.qty || 1 };
        });
    } catch { cart = []; }
    
    try {
        favorites = new Set((JSON.parse(localStorage.getItem(FAVORITES_KEY)) ?? []).filter((id) => byId(id)));
    } catch { favorites = new Set(); }
}

function saveCart() { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }
function saveFavorites() { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites])); }

/* ---------- Обновление бейджа корзины в хедере ---------- */
function updateCartBadge() {
    const badge = $('#cart-count-badge');
    if (badge) {
        const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
        badge.textContent = totalQty;
    }
}

/* ---------- Инициализация ГЛАВНОЙ страницы (index.html) ---------- */
function initCatalogPage() {
    if (!$('#products-grid')) return; // Мы не на главной

    // Заполняем круглые кнопки категорий
    const pillsContainer = $('#category-pills');
    if (pillsContainer) {
        const categories = [...new Set(PRODUCTS.map(p => p.category))];
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'pill';
            btn.dataset.category = cat;
            btn.textContent = cat;
            pillsContainer.appendChild(btn);
        });

        pillsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('pill')) {
                document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
                selectedCategory = e.target.dataset.category;
                renderCatalog();
            }
        });
    }

    // Слушатели фильтров
    let searchTimer = null;
    $('#search-input')?.addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => { searchTerm = e.target.value.trim(); renderCatalog(); }, 300);
    });
    $('#sort-select')?.addEventListener('change', (e) => { sortMode = e.target.value; renderCatalog(); });
    $('#favorites-toggle')?.addEventListener('click', () => { 
        showFavoritesOnly = !showFavoritesOnly; 
        $('#favorites-toggle').classList.toggle('active', showFavoritesOnly);
        renderCatalog(); 
    });

    // Логика модального окна
    $('#modal-close')?.addEventListener('click', closeModal);
    $('#product-modal')?.addEventListener('click', (e) => { if (e.target.id === 'product-modal') closeModal(); });

    renderCatalog();
}

function renderCatalog() {
    const grid = $('#products-grid');
    const empty = $('#catalog-empty');
    if (!grid) return;
    
    grid.replaceChildren();
    
    let list = PRODUCTS.slice();
    if (showFavoritesOnly) list = list.filter((p) => favorites.has(p.id));
    if (searchTerm) list = list.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (selectedCategory !== 'all') list = list.filter((p) => p.category === selectedCategory);
    if (sortMode === 'asc') list.sort((a, b) => a.price - b.price);
    if (sortMode === 'desc') list.sort((a, b) => b.price - a.price);

    empty.hidden = list.length > 0;

    for (const product of list) {
        grid.append(buildProductCard(product));
    }
}

function buildProductCard(product) {
    const card = document.createElement('article');
    card.className = 'product-card';
    
    // Клик по карточке открывает модалку
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.fav-btn') && !e.target.closest('.add-btn')) {
            openModal(product.id);
        }
    });

    const imageWrap = document.createElement('div');
    imageWrap.className = 'product-image-wrap';

    const image = document.createElement('img');
    image.className = 'product-image';
    image.src = product.image;
    image.alt = product.name;
    image.loading = 'lazy';
    image.onerror = () => { if (!image.src.includes('placeholder')) image.src = PLACEHOLDER_IMAGE; };

    const favBtn = document.createElement('button');
    favBtn.type = 'button';
    favBtn.className = 'fav-btn' + (favorites.has(product.id) ? ' active' : '');
    favBtn.innerHTML = favorites.has(product.id) ? '♥' : '♡';
    favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(product.id);
    });

    imageWrap.append(image, favBtn);

    const content = document.createElement('div');
    content.className = 'product-content';

    const category = document.createElement('span');
    category.className = 'product-category';
    category.textContent = product.category;

    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = product.name;

    const footer = document.createElement('div');
    footer.className = 'product-footer';

    const price = document.createElement('p');
    price.className = 'price';
    price.textContent = `${product.price} ₽`;

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'add-btn btn-filled';
    addBtn.textContent = 'В корзину';
    addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(product.id);
        updateCartBadge();
    });

    footer.append(price, addBtn);
    content.append(category, name, footer);
    card.append(imageWrap, content);
    return card;
}

function toggleFavorite(productId) {
    if (favorites.has(productId)) favorites.delete(productId);
    else favorites.add(productId);
    saveFavorites();
    renderCatalog();
}

/* ---------- Модальное окно товара ---------- */
function openModal(id) {
    const product = byId(id);
    if (!product) return;
    
    $('#modal-img').src = product.image;
    $('#modal-name').textContent = product.name;
    $('#modal-category').textContent = product.category;
    $('#modal-price').textContent = `${product.price} ₽`;
    
    const addBtn = $('#modal-add-btn');
    // Очищаем старые слушатели, заменяя кнопку на клон
    const newBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newBtn, addBtn);
    
    newBtn.addEventListener('click', () => {
        addToCart(id);
        updateCartBadge();
        closeModal();
    });

    $('#product-modal').hidden = false;
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    $('#product-modal').hidden = true;
    document.body.style.overflow = '';
}

/* ---------- Инициализация СТРАНИЦЫ КОРЗИНЫ (cart.html) ---------- */
function initCartPage() {
    if (!$('#cart-list')) return; // Мы не на странице корзины

    renderCart();

    $('#promo-btn')?.addEventListener('click', applyPromo);

    // Кнопка оформления заказа
    $('#checkout-btn')?.addEventListener('click', () => {
        if (cart.length === 0) return;
        
        const delivery = document.querySelector('input[name="delivery"]:checked').value;
        const deliveryText = delivery === 'pickup' ? 'Самовывоз из СПб, ИТМО' : 'Онлайн-доставка';
        
        const msg = $('#checkout-message');
        msg.textContent = `Заказ оформлен! Способ: ${deliveryText}. Ожидайте (это учебный магазин).`;
        
        // Очищаем корзину после оформления
        cart = [];
        discountApplied = false;
        $('#promo-input').value = '';
        $('#promo-message').textContent = '';
        renderCart();
    });
}

function renderCart() {
    const cartList = $('#cart-list');
    const totalPriceEl = $('#total-price');
    if (!cartList) return;

    cartList.replaceChildren();
    let total = 0;
    $('#cart-empty').hidden = cart.length > 0;

    cart.forEach((item, index) => {
        const product = byId(item.id);
        if (!product) return;
        
        total += product.price * item.qty;

        const li = document.createElement('li');
        li.className = 'cart-item';

        const img = document.createElement('img');
        img.src = product.image;
        img.className = 'cart-item-img';

        const info = document.createElement('div');
        info.className = 'cart-item-info';
        info.innerHTML = `<span class="cart-item-name">${product.name}</span><span class="cart-item-price">${product.price} ₽</span>`;

        const qtyControls = document.createElement('div');
        qtyControls.className = 'qty-controls';
        
        const minus = document.createElement('button');
        minus.type = 'button'; minus.className = 'qty-btn'; minus.textContent = '−';
        minus.addEventListener('click', () => { if(item.qty > 1) { item.qty--; renderCart(); saveCart(); }});

        const qty = document.createElement('span');
        qty.className = 'qty-value'; qty.textContent = item.qty;

        const plus = document.createElement('button');
        plus.type = 'button'; plus.className = 'qty-btn'; plus.textContent = '+';
        plus.addEventListener('click', () => { item.qty++; renderCart(); saveCart(); });

        qtyControls.append(minus, qty, plus);

        const remove = document.createElement('button');
        remove.type = 'button'; remove.className = 'delete-btn'; remove.innerHTML = '&times;';
        remove.addEventListener('click', () => { cart.splice(index, 1); renderCart(); saveCart(); });

        li.append(img, info, qtyControls, remove);
        cartList.append(li);
    });

    if (discountApplied && total > 0) total = Math.round(total * 0.9);
    if (totalPriceEl) totalPriceEl.textContent = total;
    updateCartBadge();
}

function addToCart(productId) {
    const existing = cart.find((item) => item.id === productId);
    if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + 1);
    else {
        const product = byId(productId);
        if (product) cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
    }
    saveCart();
}

function applyPromo() {
    const input = $('#promo-input');
    const msg = $('#promo-message');
    if(!input || !msg) return;
    
    const code = input.value.trim().toUpperCase();

    if (cart.length === 0) {
        msg.className = 'msg-error'; msg.textContent = 'Сначала добавьте товары!'; return;
    }
    if (code === 'DEEPSEEK') {
        if (discountApplied) {
            msg.className = 'msg-warning'; msg.textContent = 'Скидка уже применена!';
        } else {
            discountApplied = true;
            msg.className = 'msg-success'; msg.textContent = 'Скидка 10% применена! 🎉';
            renderCart();
        }
    } else {
        msg.className = 'msg-error'; msg.textContent = 'Неверный промокод';
    }
}

/* ---------- Запуск ---------- */
loadState();
updateCartBadge();
initCatalogPage();
initCartPage();