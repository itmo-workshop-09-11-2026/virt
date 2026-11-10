"""Backend магазина: API каталога, заказы, SQLite, остатки, админ-токен.

Только стандартная библиотека. Реализует задачи B1–B6 из ТЗ:
- B1: GET /api/products — JSON с товарами (страница грузит каталог отсюда);
- B2: параметры search и category — поиск и фильтр на сервере;
- B3: POST /api/orders — создание заказа, сумма считается на сервере из своей базы;
- B4: товары и заказы хранятся в SQLite, данные остаются после перезапуска;
- B5: остатки товаров, заказ не может продать больше, чем есть (BEGIN IMMEDIATE);
- B6: изменение каталога только с админ-токеном из переменной окружения ADMIN_TOKEN.

Статические файлы site/ отдаются тем же обработчиком, поэтому сайт и API
работают с одного адреса и CORS не требуется.
"""
import json
import os
import sqlite3
from http.server import SimpleHTTPRequestHandler
from urllib.parse import urlsplit, parse_qs

DB_PATH = os.environ.get('SHOP_DB', 'shop.db')
MAX_QTY = 999  # максимум одного товара в заказе

# Тестовые данные: заливаются в пустую базу при старте (--reset-db пересоздаёт).
SEED_PRODUCTS = [
    {'id': 'bar',        'name': 'Космический батончик',   'price': 100, 'category': 'Еда',        'image': './assets/product-bar.svg',        'stock': 10},
    {'id': 'soup',       'name': 'Туба борща',             'price': 250, 'category': 'Еда',        'image': './assets/product-soup.svg',       'stock': 10},
    {'id': 'water',      'name': 'Вода «Комета»',          'price': 80,  'category': 'Еда',        'image': './assets/product-water.svg',      'stock': 10},
    {'id': 'book',       'name': 'Книга по JS',            'price': 200, 'category': 'Книги',      'image': './assets/product-book.svg',       'stock': 10},
    {'id': 'atlas',      'name': 'Атлас созвездий',        'price': 340, 'category': 'Книги',      'image': './assets/product-atlas.svg',      'stock': 10},
    {'id': 'diary',      'name': 'Дневник астронавта',     'price': 290, 'category': 'Книги',      'image': './assets/product-diary.svg',      'stock': 10},
    {'id': 'game',       'name': 'Настольная игра',        'price': 50,  'category': 'Игры',       'image': './assets/product-game.svg',       'stock': 10},
    {'id': 'puzzle',     'name': 'Космо-пазл «Галактика»', 'price': 450, 'category': 'Игры',       'image': './assets/product-puzzle.svg',     'stock': 10},
    {'id': 'magnet',     'name': 'Магнит «Луна»',          'price': 150, 'category': 'Сувениры',   'image': './assets/product-magnet.svg',     'stock': 10},
    {'id': 'poster',     'name': 'Постер «Марс»',          'price': 190, 'category': 'Сувениры',   'image': './assets/product-poster.svg',     'stock': 10},
    {'id': 'flashlight', 'name': 'Фонарик Starlight',      'price': 520, 'category': 'Экипировка', 'image': './assets/product-flashlight.svg', 'stock': 10},
    {'id': 'gloves',     'name': 'Перчатки астронавта',    'price': 690, 'category': 'Экипировка', 'image': './assets/product-gloves.svg',     'stock': 10},
]

PRODUCT_FIELDS = ('name', 'price', 'category', 'image', 'stock')


class ApiError(Exception):
    """Понятная ошибка 4xx, которую сервер возвращает клиенту как JSON."""

    def __init__(self, status, message):
        super().__init__(message)
        self.status = status
        self.message = message


class OrderError(ApiError):
    def __init__(self, message):
        super().__init__(400, message)


# ---------- База данных (B4) ----------

def get_conn():
    # Отдельное соединение на операцию: безопасно для потоков ThreadingHTTPServer.
    # isolation_level=None + явный BEGIN IMMEDIATE — сериализация записи (B5).
    conn = sqlite3.connect(DB_PATH, timeout=30, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA busy_timeout = 30000')
    return conn


def init_db(reset=False):
    """Создаёт таблицы и заливает тестовые товары, если база пустая."""
    if reset and os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    conn = get_conn()
    try:
        conn.executescript('''
            CREATE TABLE IF NOT EXISTS products (
                id       TEXT PRIMARY KEY,
                name     TEXT NOT NULL,
                price    INTEGER NOT NULL,
                category TEXT NOT NULL,
                image    TEXT,
                stock    INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS orders (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                total      INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS order_items (
                order_id  INTEGER NOT NULL REFERENCES orders(id),
                product_id TEXT NOT NULL,
                name      TEXT NOT NULL,
                price     INTEGER NOT NULL,
                quantity  INTEGER NOT NULL
            );
        ''')
        if conn.execute('SELECT COUNT(*) FROM products').fetchone()[0] == 0:
            conn.executemany(
                'INSERT INTO products (id, name, price, category, image, stock) '
                'VALUES (:id, :name, :price, :category, :image, :stock)',
                SEED_PRODUCTS,
            )
    finally:
        conn.close()


# ---------- Каталог (B1, B2) и админские операции (B6) ----------

def list_products(search='', category=''):
    query = 'SELECT id, name, price, category, image, stock FROM products'
    clauses, params = [], []
    if search:
        clauses.append('LOWER(name) LIKE ?')
        params.append(f'%{search.lower()}%')
    if category:
        clauses.append('category = ?')
        params.append(category)
    if clauses:
        query += ' WHERE ' + ' AND '.join(clauses)
    query += ' ORDER BY rowid'
    with get_conn() as conn:
        return [dict(row) for row in conn.execute(query, params)]


def list_categories():
    with get_conn() as conn:
        return [row[0] for row in
                conn.execute('SELECT DISTINCT category FROM products ORDER BY category')]


def create_product(data):
    if not isinstance(data, dict):
        raise ApiError(400, 'Тело запроса должно быть JSON-объектом')
    product_id = data.get('id')
    if not isinstance(product_id, str) or not product_id.strip():
        raise ApiError(400, 'id должен быть непустой строкой')
    product_id = product_id.strip()
    record = {'image': None, 'stock': 0}
    for field in PRODUCT_FIELDS:
        value = data.get(field, record.get(field))
        if field == 'price' or field == 'stock':
            if isinstance(value, bool) or not isinstance(value, int) or value < 0:
                raise ApiError(400, f'{field} должен быть целым числом не меньше 0')
        elif field == 'name' or field == 'category':
            if not isinstance(value, str) or not value.strip():
                raise ApiError(400, f'{field} должен быть непустой строкой')
        record[field] = value
    conn = get_conn()
    try:
        conn.execute(
            'INSERT INTO products (id, name, price, category, image, stock) '
            'VALUES (?, ?, ?, ?, ?, ?)',
            (product_id, record['name'], record['price'], record['category'],
             record['image'], record['stock']),
        )
    except sqlite3.IntegrityError:
        raise ApiError(409, f'Товар с id «{product_id}» уже существует')
    finally:
        conn.close()
    return {'id': product_id, **record}


def update_product(product_id, data):
    if not isinstance(data, dict):
        raise ApiError(400, 'Тело запроса должно быть JSON-объектом')
    updates = {}
    for field in PRODUCT_FIELDS:
        if field not in data:
            continue
        value = data[field]
        if field == 'price' or field == 'stock':
            if isinstance(value, bool) or not isinstance(value, int) or value < 0:
                raise ApiError(400, f'{field} должен быть целым числом не меньше 0')
        elif field == 'name' or field == 'category':
            if not isinstance(value, str) or not value.strip():
                raise ApiError(400, f'{field} должен быть непустой строкой')
        updates[field] = value
    if not updates:
        raise ApiError(400, 'Нет полей для обновления')
    conn = get_conn()
    try:
        cursor = conn.execute(
            f'UPDATE products SET {", ".join(f"{f} = ?" for f in updates)} WHERE id = ?',
            [*updates.values(), product_id],
        )
        if cursor.rowcount == 0:
            raise ApiError(404, f'Товар «{product_id}» не найден')
    finally:
        conn.close()
    return {'id': product_id, **updates}


# ---------- Заказы (B3, B5) ----------

def create_order(items):
    if not isinstance(items, list) or not items:
        raise OrderError('items должен быть непустым списком позиций')
    wanted = []
    for item in items:
        if not isinstance(item, dict):
            raise OrderError('Позиция заказа должна быть объектом {"productId", "quantity"}')
        product_id = item.get('productId')
        quantity = item.get('quantity')
        if not isinstance(product_id, str) or not product_id.strip():
            raise OrderError('productId должен быть непустой строкой')
        product_id = product_id.strip()
        if isinstance(quantity, bool) or not isinstance(quantity, int):
            raise OrderError(f'quantity должна быть целым числом (товар {product_id})')
        if quantity <= 0:
            raise OrderError(f'quantity должна быть больше 0 (товар {product_id})')
        if quantity > MAX_QTY:
            raise OrderError(f'quantity не может быть больше {MAX_QTY} (товар {product_id})')
        wanted.append((product_id, quantity))

    conn = get_conn()
    try:
        # BEGIN IMMEDIATE захватывает базу на запись: при одновременных запросах
        # второй запрос ждёт и видит уже списанные остатки (B5).
        conn.execute('BEGIN IMMEDIATE')
        total = 0
        lines = []
        for product_id, quantity in wanted:
            row = conn.execute(
                'SELECT name, price, stock FROM products WHERE id = ?',
                (product_id,),
            ).fetchone()
            if row is None:
                raise OrderError(f'Неизвестный товар: {product_id}')
            if row['stock'] < quantity:
                raise OrderError(
                    f'Недостаточно остатков: {row["name"]} '
                    f'(в наличии {row["stock"]}, в заказе {quantity})'
                )
            lines.append((product_id, row['name'], row['price'], quantity))
            # Сумма считается только из цен сервера, цена клиента не участвует (B3).
            total += row['price'] * quantity

        cursor = conn.execute('INSERT INTO orders (total) VALUES (?)', (total,))
        order_id = cursor.lastrowid
        conn.executemany(
            'INSERT INTO order_items (order_id, product_id, name, price, quantity) '
            'VALUES (?, ?, ?, ?, ?)',
            [(order_id, *line) for line in lines],
        )
        for product_id, _, _, quantity in lines:
            conn.execute('UPDATE products SET stock = stock - ? WHERE id = ?',
                         (quantity, product_id))
        conn.execute('COMMIT')
        return {
            'orderId': order_id,
            'total': total,
            'items': [{'productId': pid, 'name': name, 'price': price, 'quantity': qty}
                      for pid, name, price, qty in lines],
        }
    except Exception:
        conn.execute('ROLLBACK')
        raise
    finally:
        conn.close()


def get_order(order_id):
    with get_conn() as conn:
        order = conn.execute(
            'SELECT id, created_at, total FROM orders WHERE id = ?', (order_id,)
        ).fetchone()
        if order is None:
            raise ApiError(404, f'Заказ {order_id} не найден')
        items = [dict(row) for row in conn.execute(
            'SELECT product_id, name, price, quantity FROM order_items WHERE order_id = ? '
            'ORDER BY rowid', (order_id,),
        )]
    return {'orderId': order['id'], 'createdAt': order['created_at'],
            'total': order['total'], 'items': items}


# ---------- HTTP-обработчик ----------

class ShopAPIHandler(SimpleHTTPRequestHandler):
    """Отдаёт статику site/ и обрабатывает /api/*."""

    server_version = 'ShopAPI/1.0'

    # --- служебное ---

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        length = int(self.headers.get('Content-Length') or 0)
        if length <= 0:
            raise ApiError(400, 'Пустое тело запроса, ожидается JSON')
        try:
            return json.loads(self.rfile.read(length).decode('utf-8'))
        except (ValueError, UnicodeDecodeError):
            raise ApiError(400, 'Невалидный JSON в теле запроса')

    def require_admin(self):
        expected = os.environ.get('ADMIN_TOKEN', '')
        if not expected:
            raise ApiError(403, 'Админ-токен не настроен: задайте переменную окружения ADMIN_TOKEN')
        supplied = self.headers.get('X-Admin-Token', '')
        if supplied != expected:
            raise ApiError(403, 'Неверный админ-токен')

    @staticmethod
    def split_path(path):
        parts = urlsplit(path)
        return parts.path, parse_qs(parts.query)

    # --- методы ---

    def do_GET(self):
        path, query = self.split_path(self.path)
        try:
            if path == '/api/products':
                search = (query.get('search') or [''])[0]
                category = (query.get('category') or [''])[0]
                self.send_json(list_products(search, category))
            elif path == '/api/categories':
                self.send_json({'categories': list_categories()})
            elif path.startswith('/api/orders/'):
                tail = path.removeprefix('/api/orders/')
                if not tail.isdigit():
                    raise ApiError(400, 'ID заказа должен быть числом: /api/orders/<id>')
                self.send_json(get_order(int(tail)))
            elif path.startswith('/api/'):
                raise ApiError(404, f'Неизвестный API-маршрут: {path}')
            else:
                super().do_GET()
        except ApiError as error:
            self.send_json({'error': error.message}, error.status)

    def do_POST(self):
        path, _ = self.split_path(self.path)
        try:
            if path == '/api/orders':
                data = self.read_json()
                if not isinstance(data, dict):
                    raise ApiError(400, 'Тело запроса должно быть JSON-объектом {"items": [...]}')
                self.send_json(create_order(data.get('items')), status=201)
            elif path == '/api/products':
                self.require_admin()
                self.send_json(create_product(self.read_json()), status=201)
            else:
                raise ApiError(404, f'Неизвестный API-маршрут: {path}')
        except ApiError as error:
            self.send_json({'error': error.message}, error.status)

    def do_PATCH(self):
        path, _ = self.split_path(self.path)
        try:
            if path.startswith('/api/products/'):
                self.require_admin()
                product_id = path.removeprefix('/api/products/')
                if not product_id:
                    raise ApiError(400, 'Укажите id товара: /api/products/<id>')
                self.send_json(update_product(product_id, self.read_json()))
            else:
                raise ApiError(404, f'Неизвестный API-маршрут: {path}')
        except ApiError as error:
            self.send_json({'error': error.message}, error.status)
