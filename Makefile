.PHONY: help install install-backend install-frontend dev backend frontend lint build clean

help:
	@echo "Targets:"
	@echo "  make install           Install backend + frontend dependencies"
	@echo "  make install-backend   pip install -r backend/requirements.txt"
	@echo "  make install-frontend  pnpm install in frontend/"
	@echo "  make dev               Run backend (8000) + frontend (3000) in parallel"
	@echo "  make backend           Run backend only (uvicorn --reload)"
	@echo "  make frontend          Run frontend only (pnpm dev)"
	@echo "  make lint              pnpm lint in frontend/"
	@echo "  make build             pnpm build in frontend/"
	@echo ""
	@echo "Note: activate the conda env first  ->  conda activate vn-dataviz-ai"

install: install-backend install-frontend

install-backend:
	cd backend && pip install -r requirements.txt

install-frontend:
	cd frontend && pnpm install

dev:
	@$(MAKE) -j2 backend frontend

backend:
	conda run -n vn-dataviz-ai uvicorn app.main:app --reload --app-dir backend

frontend:
	pnpm --dir frontend dev

lint:
	cd frontend && pnpm lint

build:
	cd frontend && pnpm build

clean:
	cd frontend && rm -rf .next node_modules
	cd backend && rm -rf sandbox/*.py __pycache__
