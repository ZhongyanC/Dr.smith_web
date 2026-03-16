from django.urls import path
from .views import EventListView, EventDetailView

urlpatterns = [
    path("events/", EventListView.as_view(), name="event_list"),
    path("events/<slug:slug>/", EventDetailView.as_view(), name="event_detail"),
]
