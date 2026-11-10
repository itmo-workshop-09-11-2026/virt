# Магазин: старт на Python

Минимальный шаблон для [воркшопа ИТМО](https://github.com/itmo-workshop-09-11-2026/workshop-guide). Здесь есть локальный сервер, пустая стартовая страница и упаковка ZIP. Каталог, корзину, фильтры и промокоды реализует ваша команда по [ТЗ](https://github.com/itmo-workshop-09-11-2026/workshop-guide/blob/main/docs/task.md).

## 1. Создайте репозиторий команды

Нажмите **Use this template → Create a new repository**. Выберите свой аккаунт или организацию, в которой можете создавать репозитории. Назовите проект, например `team07-shop`. Для бесплатного GitHub Pages нужен публичный репозиторий. Скопируйте его на компьютер через GitHub Desktop, `git clone` или **Code → Download ZIP** (ZIP затем распакуйте).

## 2. Запустите без Docker

Установите [Python 3.12+](https://www.python.org/downloads/). После установки заново откройте терминал. В Windows используйте PowerShell и заменяйте `python3` на `py -3` во всех командах ниже. В macOS/Linux используйте обычный терминал. Сторонние пакеты, pip и виртуальное окружение не нужны. Перейдите в папку репозитория, где лежат этот README и папка `site`.

```text
python3 --version
python3 main.py
```

Откройте **http://localhost:8000**. Должны появиться рисунок, оформление и сообщение «JavaScript работает». Для остановки нажмите Ctrl+C. Сервер по умолчанию доступен только на этом компьютере.

Если порт занят, задайте другой перед запуском:

Windows PowerShell:

```powershell
$env:PORT = "8001"
py -3 main.py
```

macOS/Linux:

```bash
PORT=8001 python3 main.py
```

Адрес станет `http://localhost:8001`. Для Windows вернуть порт можно через `$env:PORT = "8000"`.

Если Python установить не удалось, используйте Live Server в VS Code для папки `site`. Другие варианты — в [гайде](https://github.com/itmo-workshop-09-11-2026/workshop-guide/blob/main/docs/local-and-zip.md). Docker и Make не требуются.

## 3. Реализуйте магазин

Редактируйте `site/index.html`, `site/styles.css`, `site/app.js`. Изображения добавляйте в `site/assets/`. После сохранения обновляйте страницу браузера. Ссылки на ресурсы делайте относительными: `./assets/product.jpg`.

Все файлы в `site/` публичные. Не кладите туда секреты, `.env` и серверный код. Не используйте символические ссылки. Это сервер для локальной разработки; для публичного демо публикуйте статику на хостинге.

Если добавите backend на Python, его размещение станет отдельной задачей. GitHub Pages не запускает этот сервер: там публикуется только статика.

## 4. Создайте архив

Из корня репозитория:

```text
python3 main.py --pack
```

Получится `shop.zip`, где `index.html` лежит в корне. Архив содержит только содержимое `site/`. При повторной упаковке старые файлы в ZIP не сохраняются. Готовый архив не добавляется в Git.

Распакуйте ZIP в новую папку и проверьте её через Live Server или HTTP-сервер из [гайда](https://github.com/itmo-workshop-09-11-2026/workshop-guide/blob/main/docs/local-and-zip.md). Исходники проекта сдавайте отдельно ссылкой на репозиторий.

## 5. Опубликуйте самостоятельно

Деплой — дополнительное достижение. Публикуйте папку `site/` на GitHub Pages по [инструкции](https://github.com/itmo-workshop-09-11-2026/workshop-guide/blob/main/docs/deploy.md).

В шаблоне включена автоматическая публикация при каждом push в `main`. Ручной запуск также доступен.

1. В **Settings → Pages → Source** выберите **GitHub Actions**. Это нужно сделать один раз в новом репозитории.
2. Загрузите изменения в ветку `main` (commit/push). Workflow **Publish site** запустится автоматически.
3. Дождитесь зелёного результата; публичная ссылка будет в выполненном workflow и Settings → Pages.
4. Для обновления достаточно нового commit/push в `main`. Основной адрес сохранится.

Чтобы повторить публикацию без изменения кода, откройте **Actions → Publish site → Run workflow**, выберите `main` и запустите. Если первый запуск упал до включения Pages, после настройки повторите его вручную.

Автодеплой запускается на любой push в `main`, без фильтра по файлам. Проверьте его: поменяйте текст и дождитесь появления по прежнему URL.

Сайты одной GitHub-организации делят `localStorage`. Используйте ключ с номером команды, например `team07:cart:v1`. Разные пути на одном домене не обеспечивают изоляцию доступа к хранилищу.

## Backend (B1–B6)

Backend на **Python 3.12+** (только стандартная библиотека, зависимости устанавливать не нужно), код в `backend.py`. Сайт и API отдаются с одного сервера `main.py`, поэтому CORS не требуется. Данные хранятся в SQLite (`shop.db`): база создаётся автоматически с 12 тестовыми товарами и сохраняется между перезапусками сервера. `shop.db` не попадает в Git, пересоздать тестовые данные можно флагом `--reset-db`.

Запуск (из корня проекта):

```bash
python3 main.py             # сайт + API на http://127.0.0.1:8000
python3 main.py --reset-db  # то же, но база пересоздаётся с тестовыми товарами
```

Переменные окружения (пример в `.env.example`): `ADMIN_TOKEN` — токен администратора (B6), `SHOP_DB` — путь к базе, `HOST`/`PORT` — адрес сервера.

### API

| Метод и адрес | Описание |
|---|---|
| `GET /api/products?search=&category=` | Каталог в JSON. `search` — поиск по названию, `category` — фильтр (B1, B2) |
| `GET /api/categories` | Список категорий |
| `POST /api/orders` | Создание заказа: сервер сам считает сумму по своим ценам и списывает остатки (B3, B5) |
| `GET /api/orders/<id>` | Заказ по ID |
| `POST /api/products` | Добавить товар. Только с заголовком `X-Admin-Token` (B6) |
| `PATCH /api/products/<id>` | Изменить товар (цена, остатки и т. д.). Только с `X-Admin-Token` (B6) |

Каталог страницы грузится из `GET /api/products` (B1), поиск и фильтр категорий уходят на сервер (B2). Если API недоступен (например, открыта статическая версия из `shop.zip` без backend), страница работает на встроенном массиве товаров — обязательный минимум не ломается.

### Примеры проверки через curl

```bash
# Каталог и поиск (B1, B2)
curl http://localhost:8000/api/products
curl "http://localhost:8000/api/products?search=батончик&category=Еда"

# Заказ на 300 ₽ (B3): сервер считает сумму сам
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"book","quantity":1},{"productId":"magnet","quantity":1}]}'

# Ошибки дают понятный 4xx, заказ не создаётся
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"book","quantity":0}]}'

# Остатки: заказ списывает stock, продажа большего количества вернёт ошибку (B5)
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"book","quantity":999}]}'

# Изменение каталога только с токеном (B6)
export ADMIN_TOKEN=my-secret-token
curl -X POST http://localhost:8000/api/products \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: my-secret-token" \
  -d '{"id":"tea","name":"Чай «Орбита»","price":120,"category":"Еда","stock":5}'
# Без заголовка X-Admin-Token сервер вернёт 403
```

Токен задаётся только в переменной окружения сервера и **не встраивается в JavaScript сайта**. Статическая обязательная версия хранится отдельно в `shop.zip` (`python3 main.py --pack`) и работает без API.

## Docker и Make (по желанию)

```bash
docker build -t shop-python .
docker run --rm -p 127.0.0.1:8000:8000 shop-python
```

Откройте `http://localhost:8000`. После изменения файлов пересоберите образ и перезапустите контейнер. Первое скачивание образов требует интернета. Dockerfile нужен для локального запуска, он не является инструкцией публикации backend.

Если установлен Make: `make run`, `make pack`, `make docker-build`, `make docker-run`. В Windows без Make используйте команды выше.

## Сдача

Создайте [issue по форме](https://github.com/itmo-workshop-09-11-2026/workshop-guide/issues/new?template=submission.md), укажите команду, дату, репозиторий, commit ID, проверенные функции и публичную ссылку, если она есть. Прикрепите `shop.zip` к issue; если GitHub отклоняет размер, передайте архив ментору и укажите это. [Полный чек-лист](https://github.com/itmo-workshop-09-11-2026/workshop-guide/blob/main/docs/submission.md).

Не публикуйте номера ИСУ, контакты или токены. Достаточно названия команды и GitHub-ников участников.

## Проверка шаблона

При установленном Python 3: `python3 tests/smoke.py` (Windows: `py -3 tests/smoke.py`). Проверка запускает сервер, проверяет ресурсы и ZIP во временной копии; ваши файлы не меняет. GitHub Actions выполняет её на Linux и Windows. Это проверка инфраструктуры шаблона, а не функций вашего магазина; после изменения структуры сайта адаптируйте её.
