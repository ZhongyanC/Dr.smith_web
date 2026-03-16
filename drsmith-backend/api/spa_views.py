from django.conf import settings
from django.http import HttpResponse
from pathlib import Path


def spa_index(request):
    """Serve the React SPA index.html for frontend routes."""
    index_path = Path(settings.BASE_DIR) / 'statics' / 'frontend' / 'index.html'
    if not index_path.exists():
        alt = Path(settings.BASE_DIR) / 'staticfiles' / 'frontend' / 'index.html'
        index_path = alt if alt.exists() else index_path
    if index_path.exists():
        return HttpResponse(index_path.read_text(), content_type='text/html')
    return HttpResponse(
        '<h1>Frontend not built</h1><p>Run: cd frontend && npm run build</p>',
        status=503,
        content_type='text/html',
    )
