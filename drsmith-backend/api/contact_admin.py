from django.contrib import admin
from .contact_models import ContactMessage


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("created_at", "name", "email", "phone", "short_message")
    list_filter = ("created_at",)
    search_fields = ("name", "email", "phone", "message")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "ip_address", "user_agent")

    def short_message(self, obj):
        text = (obj.message or "").strip()
        return text[:60] + ("..." if len(text) > 60 else "")

    short_message.short_description = "Message"

