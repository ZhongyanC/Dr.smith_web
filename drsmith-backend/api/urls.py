from django.urls import path
from .views import (
    PostListAPIView,
    PostDetailAPIView,
    EventListAPIView,
    EventDetailAPIView,
    CommentListCreateAPIView,
    CommentDetailAPIView,
    ContactAPIView,
)
from .auth_views import AuthCsrfView, AuthLoginView, AuthLogoutView, AuthMeView, AuthSettingsView
from .admin_views import (
    AdminCategoryListCreateView,
    AdminCategoryDetailView,
    AdminPostListCreateView,
    AdminPostDetailView,
    AdminEventListCreateView,
    AdminEventDetailView,
    AdminImageUploadView,
    AdminContactListView,
    AdminContactDetailView,
)

urlpatterns = [
    # Public API
    path("blog/", PostListAPIView.as_view()),
    path("blog/<slug:slug>/", PostDetailAPIView.as_view()),
    path("events/", EventListAPIView.as_view()),
    path("events/<slug:slug>/", EventDetailAPIView.as_view()),
    path("posts/<int:post_id>/comments/", CommentListCreateAPIView.as_view()),
    path("comments/<int:pk>/", CommentDetailAPIView.as_view()),
    path("contact/", ContactAPIView.as_view()),
    # Auth
    path("auth/csrf/", AuthCsrfView.as_view()),
    path("auth/login/", AuthLoginView.as_view()),
    path("auth/logout/", AuthLogoutView.as_view()),
    path("auth/me/", AuthMeView.as_view()),
    path("auth/settings/", AuthSettingsView.as_view()),
    # Admin CRUD
    path("admin/categories/", AdminCategoryListCreateView.as_view()),
    path("admin/categories/<int:pk>/", AdminCategoryDetailView.as_view()),
    path("admin/posts/", AdminPostListCreateView.as_view()),
    path("admin/posts/<int:pk>/", AdminPostDetailView.as_view()),
    path("admin/events/", AdminEventListCreateView.as_view()),
    path("admin/events/<int:pk>/", AdminEventDetailView.as_view()),
    path("admin/upload/", AdminImageUploadView.as_view()),
    path("admin/contacts/", AdminContactListView.as_view()),
    path("admin/contacts/<int:pk>/", AdminContactDetailView.as_view()),
]
