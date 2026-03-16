# Dr. Smith Website – Django + React SPA

Django REST API backend with React SPA frontend.

## Quickstart

```bash
# Backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend (separate terminal)
cd ../frontend
npm install
npm run build
```

## Development

```bash
# Terminal 1: Django
cd drsmith-backend && python manage.py runserver

# Terminal 2: Vite dev server (proxies /api to Django)
cd frontend && npm run dev
```

Visit http://localhost:5173 for frontend dev. For production, run `npm run build` in frontend; Django serves the built assets from `/static/frontend/`.

## Routes

- `/` – Home
- `/blog` – Blog list
- `/blog/<slug>` – Post detail
- `/events` – Events list
- `/events/<slug>` – Event detail
- `/admin` – Django admin
