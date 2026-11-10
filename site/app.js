"use strict";

const STORAGE_KEY = 'team3:cart:v1';
let cart = [];
let discountApplied = false;

function loadCart() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try { cart = JSON.parse(saved); } catch (e) { cart = []; }
    }
    renderCart();
}

function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function renderCart() {
    const cartList = document.getElementById('cart-list');
    const totalPriceEl = document.getElementById('total-price');
    if (!cartList || !totalPriceEl) return;

    cartList.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price;
        const li = document.createElement('li');
        li.innerHTML = `<span>${item.name} — ${item.price} ₽</span>
            <button class="delete-btn" data-index="${index}">✖</button>`;
        cartList.appendChild(li);
    });

    if (discountApplied && total > 0) total = Math.round(total * 0.9);
    totalPriceEl.textContent = total;
    saveCart();
}

document.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const t = e.target;
        cart.push({ id: t.dataset.id, name: t.dataset.name, price: parseInt(t.dataset.price) });
        renderCart();
    });
});

document.getElementById('cart-list')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        cart.splice(parseInt(e.target.dataset.index), 1);
        if (cart.length === 0) {
            discountApplied = false;
            const inp = document.getElementById('promo-input');
            const msg = document.getElementById('promo-message');
            if (inp) inp.value = '';
            if (msg) msg.textContent = '';
        }
        renderCart();
    }
});

document.getElementById('promo-btn')?.addEventListener('click', () => {
    const input = document.getElementById('promo-input');
    const msg = document.getElementById('promo-message');
    if (!input || !msg) return;
    const code = input.value.trim().toUpperCase();

    if (cart.length === 0) { msg.style.color = 'red'; msg.textContent = 'Сначала добавьте товары!'; return; }
    if (code === 'DEEPSEEK') {
        if (discountApplied) { msg.style.color = 'orange'; msg.textContent = 'Скидка уже применена!'; }
        else {
            discountApplied = true;
            msg.style.color = 'green';
            msg.textContent = 'Скидка 10% применена! 🎉';
            renderCart();
        }
    } else { msg.style.color = 'red'; msg.textContent = 'Неверный промокод'; }
});

loadCart();