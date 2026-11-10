"""Дымовые проверки: обязательный минимум и фичи в site/."""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'


class SmokeTests(unittest.TestCase):
    def test_site_folder_exists(self):
        self.assertTrue(SITE.is_dir(), 'Нет папки site/')

    def test_index_html_required_elements(self):
        html = (SITE / 'index.html').read_text(encoding='utf-8')
        # Каталог рендерится из app.js, поэтому в html проверяем контейнеры и фильтры.
        for marker in ('products-grid', 'cart-list', 'total-price',
                       'search-input', 'category-select', 'sort-select',
                       'favorites-toggle', 'promo-input'):
            self.assertIn(marker, html, f'В index.html нет: {marker}')

    def test_css_exists_and_mobile(self):
        css_path = SITE / 'styles.css'
        self.assertTrue(css_path.is_file(), 'Нет styles.css')
        css = css_path.read_text(encoding='utf-8')
        self.assertIn('@media', css, 'CSS должен содержать @media (F9)')

    def test_app_js_logic_and_bonuses(self):
        js = (SITE / 'app.js').read_text(encoding='utf-8')
        for marker in ('addtocart', 'removefromcart', 'total', 'qty'):
            self.assertIn(marker, js.lower(), f'В app.js нет логики: {marker}')
        self.assertIn('add-btn', js, 'Каталог: нет кнопки Добавить')
        self.assertIn('localStorage', js, 'F3: нет сохранения корзины')
        self.assertIn('DEEPSEEK', js, 'F7: нет промокода')
        self.assertIn('PLACEHOLDER_IMAGE', js, 'F1: нет заглушки картинки')
        self.assertIn('FAVORITES_KEY', js, 'F8: нет избранного')
        self.assertIn('searchTerm', js, 'F4: нет поиска')
        self.assertIn("sortMode", js, 'F6: нет сортировки по цене')

    def test_product_images_exist(self):
        assets = SITE / 'assets'
        self.assertTrue((assets / 'placeholder.svg').is_file(), 'F1: нет заглушки')
        for product_id in ('bar', 'soup', 'water', 'book', 'atlas', 'diary',
                           'game', 'puzzle', 'magnet', 'poster',
                           'flashlight', 'gloves'):
            self.assertTrue((assets / f'product-{product_id}.svg').is_file(),
                            f'F1: нет картинки товара {product_id}')


if __name__ == '__main__':
    unittest.main()