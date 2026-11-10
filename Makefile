PYTHON ?= python3
.PHONY: run pack test test-pytest docker-build docker-run

run:
	$(PYTHON) main.py

pack:
	$(PYTHON) main.py --pack

test:
	$(PYTHON) -m pytest tests/ -v

test-unittest:
	$(PYTHON) tests/test_pack.py

docker-build:
	docker build -t shop-python .

docker-run:
	docker run --rm -p 127.0.0.1:8000:8000 shop-python