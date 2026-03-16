from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include, re_path

from api.spa_views import spa_index

urlpatterns = [
    path("blog/summernote/", include("django_summernote.urls")),
    path("blog/summernote/", include("django_comments_xtd.urls")),
    path("api/", include("api.urls")),
]

# SPA fallback: serve React index.html for all frontend routes (including /admin)
urlpatterns += [
    re_path(r"^(?!api|static|media|blog/summernote|favicon\.ico)(.*)$", spa_index),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
