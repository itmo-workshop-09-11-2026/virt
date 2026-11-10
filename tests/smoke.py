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
        for marker in ('products-grid', 'cart-list', 'total-price', 'add-btn', 'data-price'):
            self.assertIn(marker, html, f'В index.html нет: {marker}')

    def test_css_exists_and_mobile(self):
        css_path = SITE / 'styles.css'
        self.assertTrue(css_path.is_file(), 'Нет styles.css')
        css = css_path.read_text(encoding='utf-8')
        self.assertIn('@media', css, 'CSS должен содержать @media (F9)')

    def test_app_js_logic_and_bonuses(self):
        js = (SITE / 'app.js').read_text(encoding='utf-8')
        for marker in ('add', 'delete', 'total'):
            self.assertIn(marker, js.lower(), f'В app.js нет логики: {marker}')
        self.assertIn('localStorage', js, 'F3: нет сохранения корзины')
        self.assertIn('DEEPSEEK', js, 'F7: нет промокода')


if __name__ == '__main__':
    unittest.main()