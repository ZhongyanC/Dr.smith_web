# event/views.py
from django.views.generic import ListView, DetailView
from django.utils import timezone
from django.db.models import Q
from .models import Event

class EventListView(ListView):
    """
    Public list view for events with search and time-based grouping.
    Splits results into 'upcoming' (when >= now) and 'past' (when < now).
    """
    model = Event
    template_name = "events/event_list.html"
    context_object_name = "events"  # not used directly after grouping
    paginate_by = None  # disable built-in pagination when splitting into two groups

    def get_base_queryset(self):
        qs = Event.objects.filter(is_published=True)
        q = self.request.GET.get("q", "").strip()
        if q:
            qs = qs.filter(
                Q(title__icontains=q) |
                Q(subtitle__icontains=q) |
                Q(body__icontains=q)
            )
        return qs

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        now = timezone.now()
        base_qs = self.get_base_queryset()

        # Upcoming: ascending by time; Past: descending by time
        upcoming = (base_qs
                    .filter(when__gte=now)
                    .order_by("when")
                    .only("title", "subtitle", "slug", "when", "cover"))
        past = (base_qs
                .filter(when__lt=now)
                .order_by("-when")
                .only("title", "subtitle", "slug", "when", "cover"))

        ctx.update({
            "q": self.request.GET.get("q", "").strip(),
            "upcoming": upcoming,
            "past": past,
        })
        return ctx


class EventDetailView(DetailView):
    """Public detail view for a single event."""
    model = Event
    template_name = "events/event_detail.html"
    context_object_name = "event"
    slug_url_kwarg = "slug"

    def get_queryset(self):
        return Event.objects.filter(is_published=True)


