"use strict";

// F3: сохранение корзины, F7: промокод, F1: картинки с заглушкой,
// F2: количество, F4: поиск, F5: категории и фильтр, F6: сортировка,
// F8: избранное, F10: доступность с клавиатуры.

const STORAGE_KEY = 'team3:cart:v1';
const FAVORITES_KEY = 'team3:favorites:v1';
const PLACEHOLDER_IMAGE = './assets/placeholder.svg';
const MAX_QTY = 99;

const PRODUCTS = [
    { id: 'bar',        name: 'Космический батончик',   price: 100, category: 'Еда',        image: './assets/product-bar.svg' },
    { id: 'soup',       name: 'Туба борща',             price: 250, category: 'Еда',        image: './assets/product-soup.svg' },
    { id: 'water',      name: 'Вода «Комета»',          price: 80,  category: 'Еда',        image: './assets/product-water.svg' },
    { id: 'book',       name: 'Книга по JS',            price: 200, category: 'Книги',      image: './assets/product-book.svg' },
    { id: 'atlas',      name: 'Атлас созвездий',        price: 340, category: 'Книги',      image: './assets/product-atlas.svg' },
    { id: 'diary',      name: 'Дневник астронавта',     price: 290, category: 'Книги',      image: './assets/product-diary.svg' },
    { id: 'game',       name: 'Настольная игра',        price: 50,  category: 'Игры',       image: './assets/product-game.svg' },
    { id: 'puzzle',     name: 'Космо-пазл «Галактика»', price: 450, category: 'Игры',       image: './assets/product-puzzle.svg' },
    { id: 'magnet',     name: 'Магнит «Луна»',          price: 150, category: 'Сувениры',   image: './assets/product-magnet.svg' },
    { id: 'poster',     name: 'Постер «Марс»',          price: 190, category: 'Сувениры',   image: './assets/product-poster.svg' },
    { id: 'flashlight', name: 'Фонарик Starlight',      price: 520, category: 'Экипировка', image: './assets/product-flashlight.svg' },
    { id: 'gloves',     name: 'Перчатки астронавта',    price: 690, category: 'Экипировка', image: './assets/product-gloves.svg' },
];

const byId = (id) => PRODUCTS.find((p) => p.id === id);

let cart = [];
let discountApplied = false;
let favorites = new Set();

// Состояние каталога (F4, F5, F6, F8)
let showFavoritesOnly = false;
let searchTerm = '';
let selectedCategory = 'all';
let sortMode = 'default';

const $ = (selector) => document.querySelector(selector);

/* ---------- Загрузка и сохранение ---------- */

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
        // Миграция старого формата ({id,name,price}) в формат с количеством (F2).
        cart = saved
            .filter((item) => byId(item.id))
            .map((item) => {
                const product = byId(item.id);
                const qty = Number.isInteger(item.qty) && item.qty > 0 ? item.qty : 1;
                return { id: item.id, name: product.name, price: product.price, qty };
            });
    } catch {
        cart = [];
    }
    try {
        favorites = new Set(
            (JSON.parse(localStorage.getItem(FAVORITES_KEY)) ?? []).filter((id) => byId(id))
        );
    } catch {
        favorites = new Set();
    }
}

function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function saveFavorites() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
}

/* ---------- Каталог: поиск, фильтр, сортировка (F4, F5, F6) ---------- */

function fillCategories() {
    const select = $('#category-select');
    [...new Set(PRODUCTS.map((p) => p.category))].forEach((category) => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        select.append(option);
    });
}

function visibleProducts() {
    let list = PRODUCTS.slice();

    if (showFavoritesOnly) {
        list = list.filter((p) => favorites.has(p.id));
    }
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        list = list.filter((p) => p.name.toLowerCase().includes(term));
    }
    if (selectedCategory !== 'all') {
        list = list.filter((p) => p.category === selectedCategory);
    }
    if (sortMode === 'asc') list.sort((a, b) => a.price - b.price);
    if (sortMode === 'desc') list.sort((a, b) => b.price - a.price);
    return list;
}

function renderCatalog() {
    const grid = $('#products-grid');
    const empty = $('#catalog-empty');
    grid.replaceChildren();

    const list = visibleProducts();
    empty.hidden = list.length > 0;

    for (const product of list) {
        grid.append(buildProductCard(product));
    }
    updateControlsState();
}

function buildProductCard(product) {
    const card = document.createElement('article');
    card.className = 'product-card';

    // F1: картинка с подписью и заглушкой, если не загрузилась.
    const image = document.createElement('img');
    image.className = 'product-image';
    image.src = product.image;
    image.alt = product.name;
    image.width = 200;
    image.height = 150;
    image.loading = 'lazy';
    image.addEventListener('error', () => {
        if (image.src.endsWith(PLACEHOLDER_IMAGE)) return;
        image.src = PLACEHOLDER_IMAGE;
    });

    const category = document.createElement('span');
    category.className = 'product-category';
    category.textContent = product.category;

    const name = document.createElement('h3');
    name.textContent = product.name;

    const price = document.createElement('p');
    price.className = 'price';
    price.textContent = `${product.price} ₽`;

    const actions = document.createElement('div');
    actions.className = 'product-actions';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'add-btn';
    addBtn.textContent = 'Добавить';
    addBtn.setAttribute('aria-label', `Добавить «${product.name}» в корзину`);
    addBtn.addEventListener('click', () => addToCart(product.id));

    const favBtn = document.createElement('button');
    favBtn.type = 'button';
    favBtn.className = 'fav-btn' + (favorites.has(product.id) ? ' active' : '');
    favBtn.textContent = favorites.has(product.id) ? '♥' : '♡';
    favBtn.setAttribute('aria-pressed', String(favorites.has(product.id)));
    favBtn.setAttribute('aria-label', `Добавить «${product.name}» в избранное`);
    favBtn.addEventListener('click', () => toggleFavorite(product.id));

    actions.append(addBtn, favBtn);
    card.append(image, category, name, price, actions);
    return card;
}

function updateControlsState() {
    const toggle = $('#favorites-toggle');
    toggle.setAttribute('aria-pressed', String(showFavoritesOnly));
    toggle.textContent = showFavoritesOnly ? '♥ В избранном' : '♡ Избранное';

    const hasFilters = showFavoritesOnly || searchTerm || selectedCategory !== 'all' || sortMode !== 'default';
    $('#reset-filters').hidden = !hasFilters;
}

function resetFilters() {
    showFavoritesOnly = false;
    searchTerm = '';
    selectedCategory = 'all';
    sortMode = 'default';
    $('#search-input').value = '';
    $('#category-select').value = 'all';
    $('#sort-select').value = 'default';
    renderCatalog();
}

/* ---------- Избранное (F8) ---------- */

function toggleFavorite(productId) {
    if (favorites.has(productId)) {
        favorites.delete(productId);
    } else {
        favorites.add(productId);
    }
    saveFavorites();
    renderCatalog();
}

/* ---------- Корзина (F2, F3, F7) ---------- */

function renderCart() {
    const cartList = $('#cart-list');
    const totalPriceEl = $('#total-price');
    cartList.replaceChildren();

    let total = 0;
    $('#cart-empty').hidden = cart.length > 0;

    cart.forEach((item, index) => {
        const product = byId(item.id);
        total += product.price * item.qty;

        const li = document.createElement('li');
        li.className = 'cart-item';

        const label = document.createElement('span');
        label.className = 'cart-item-name';
        label.textContent = product.name;

        const qtyControls = document.createElement('div');
        qtyControls.className = 'qty-controls';

        const minus = document.createElement('button');
        minus.type = 'button';
        minus.className = 'qty-btn';
        minus.textContent = '−';
        minus.setAttribute('aria-label', `Убавить «${product.name}»`);
        minus.addEventListener('click', () => changeQty(index, -1));

        const qty = document.createElement('span');
        qty.className = 'qty-value';
        qty.textContent = item.qty;
        qty.setAttribute('aria-label', `Количество: ${item.qty}`);

        const plus = document.createElement('button');
        plus.type = 'button';
        plus.className = 'qty-btn';
        plus.textContent = '+';
        plus.setAttribute('aria-label', `Прибавить «${product.name}»`);
        plus.addEventListener('click', () => changeQty(index, +1));

        qtyControls.append(minus, qty, plus);

        const price = document.createElement('span');
        price.className = 'cart-item-price';
        price.textContent = `${product.price * item.qty} ₽`;

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'delete-btn';
        remove.textContent = '✖';
        remove.setAttribute('aria-label', `Удалить «${product.name}» из корзины`);
        remove.addEventListener('click', () => removeFromCart(index));

        li.append(label, qtyControls, price, remove);
        cartList.append(li);
    });

    if (discountApplied && total > 0) total = Math.round(total * 0.9);
    totalPriceEl.textContent = total;
    saveCart();
}

function addToCart(productId) {
    // Повторное добавление увеличивает количество (F2).
    const existing = cart.find((item) => item.id === productId);
    if (existing) {
        existing.qty = Math.min(MAX_QTY, existing.qty + 1);
    } else {
        const product = byId(productId);
        cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
    }
    renderCart();
}

function changeQty(index, delta) {
    const item = cart[index];
    if (!item) return;
    item.qty = Math.min(MAX_QTY, Math.max(1, item.qty + delta));
    renderCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    if (cart.length === 0) {
        discountApplied = false;
        $('#promo-input').value = '';
        $('#promo-message').textContent = '';
    }
    renderCart();
}

/* ---------- Промокод (F7) ---------- */

function applyPromo() {
    const input = $('#promo-input');
    const msg = $('#promo-message');
    const code = input.value.trim().toUpperCase();

    if (cart.length === 0) {
        msg.style.color = 'red';
        msg.textContent = 'Сначала добавьте товары!';
        return;
    }
    if (code === 'DEEPSEEK') {
        if (discountApplied) {
            msg.style.color = 'orange';
            msg.textContent = 'Скидка уже применена!';
        } else {
            discountApplied = true;
            msg.style.color = 'green';
            msg.textContent = 'Скидка 10% применена! 🎉';
            renderCart();
        }
    } else {
        msg.style.color = 'red';
        msg.textContent = 'Неверный промокод';
    }
}

/* ---------- Инициализация ---------- */

function bindEvents() {
    $('#search-input').addEventListener('input', (e) => {
        searchTerm = e.target.value.trim();
        renderCatalog();
    });
    $('#category-select').addEventListener('change', (e) => {
        selectedCategory = e.target.value;
        renderCatalog();
    });
    $('#sort-select').addEventListener('change', (e) => {
        sortMode = e.target.value;
        renderCatalog();
    });
    $('#favorites-toggle').addEventListener('click', () => {
        showFavoritesOnly = !showFavoritesOnly;
        renderCatalog();
    });
    $('#reset-filters').addEventListener('click', resetFilters);
    $('#promo-btn').addEventListener('click', applyPromo);

    // F10: горячие клавиши — «/» фокусирует поиск, Esc в поиске очищает его.
    document.addEventListener('keydown', (e) => {
        const inField = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName ?? '');
        if (e.key === '/' && !inField) {
            e.preventDefault();
            $('#search-input').focus();
        }
        if (e.key === 'Escape' && document.activeElement === $('#search-input')) {
            $('#search-input').value = '';
            searchTerm = '';
            renderCatalog();
        }
    });
}

loadState();
fillCategories();
bindEvents();
renderCatalog();
renderCart();
