from django.contrib import admin
from django.utils.html import format_html

# Use Summernote admin if available; fallback to plain ModelAdmin
try:
    from django_summernote.admin import SummernoteModelAdmin as BaseAdmin
except Exception:
    from django.contrib import admin as _admin
    BaseAdmin = _admin.ModelAdmin

from .models import Event

@admin.register(Event)
class EventAdmin(BaseAdmin):
    """Admin interface for Event."""
    if hasattr(BaseAdmin, "summernote_fields"):
        summernote_fields = ("body",)

    list_display = ("title", "when", "is_published", "updated_at")
    list_filter = ("is_published",)
    search_fields = ("title", "subtitle", "body", "slug")
    date_hierarchy = "when"
    ordering = ("-when",)

    readonly_fields = ("cover_preview", "created_at", "updated_at", "published_at")
    fieldsets = (
        ("Basics", {"fields": ("title", "subtitle", "slug", "when", "is_published", "published_at")}),
        ("Content", {"fields": ("body",)}),
        ("Cover", {"fields": ("cover", "cover_preview")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    actions = ("make_published", "make_unpublished")

    def cover_preview(self, obj):
        """Small cover preview for admin."""
        if obj.cover:
            return format_html('<img src="{}" style="max-width:320px;border-radius:8px;" />', obj.cover.url)
        return "-"
    cover_preview.short_description = "Cover Preview"

    @admin.action(description="Publish selected events")
    def make_published(self, request, queryset):
        updated = 0
        for e in queryset:
            if not e.is_published:
                e.is_published = True
                e.save(update_fields=["is_published", "published_at", "updated_at"])
                updated += 1
        self.message_user(request, f"{updated} event(s) published.")

    @admin.action(description="Unpublish selected events")
    def make_unpublished(self, request, queryset):
        updated = queryset.update(is_published=False, published_at=None)
        self.message_user(request, f"{updated} event(s) unpublished.")
