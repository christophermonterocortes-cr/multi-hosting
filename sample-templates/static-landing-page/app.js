let count = 0;
const counterEl = document.getElementById('counter');
const incBtn = document.getElementById('inc-btn');
const rstBtn = document.getElementById('rst-btn');
const ctaBtn = document.getElementById('cta-btn');

incBtn?.addEventListener('click', () => {
    count++;
    if (counterEl) counterEl.textContent = count;
});

rstBtn?.addEventListener('click', () => {
    count = 0;
    if (counterEl) counterEl.textContent = count;
});

ctaBtn?.addEventListener('click', () => {
    alert('Multi Hosting static application is running smoothly!');
});
