# event/models.py
from django.db import models
from django.utils import timezone
from django.core.validators import FileExtensionValidator
from django.utils.text import slugify
import re


# ---------- helpers ----------
def _clean_slug(s: str) -> str:
    """Collapse repeated hyphens and trim leading/trailing hyphens."""
    return re.sub(r"-{2,}", "-", s).strip("-")


def unique_slugify(instance, value: str, slug_field: str = "slug", max_length: int = 220) -> str:
    """
    Generate a URL-safe, unique slug based on `value`.
    If conflicts exist, append -2, -3, ... while respecting max_length.
    """
    base = slugify(value or "")[:max_length].strip("-")
    base = _clean_slug(base)
    slug = base or "item"

    Model = instance.__class__
    n = 2
    while Model.objects.filter(**{slug_field: slug}).exclude(pk=instance.pk).exists():
        suffix = f"-{n}"
        slug = f"{(base or 'item')[: max_length - len(suffix)]}{suffix}"
        n += 1
    return slug


# ---------- models ----------
class Event(models.Model):
    """A public event entry with title, time, cover image and rich body (admin widget)."""

    title = models.CharField("Title", max_length=200)
    subtitle = models.CharField("Subtitle", max_length=220, blank=True)
    slug = models.SlugField("Slug", max_length=220, unique=True, blank=True)

    when = models.DateTimeField("Event Time", help_text="Date and time of the event.")

    # Use TextField; the admin (SummernoteModelAdmin) can still render a rich editor widget.
    body = models.TextField("Body / Details", help_text="Event description (rich editor in admin).")

    cover = models.ImageField(
        "Cover Image",
        upload_to="events/covers/",
        blank=True,
        null=True,
        help_text="Accepts jpg, jpeg, png, gif, webp.",
        validators=[FileExtensionValidator(["jpg", "jpeg", "png", "gif", "webp"])],
    )

    is_published = models.BooleanField("Published", default=True)
    published_at = models.DateTimeField("Published At", blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-when", "-created_at"]
        indexes = [
            models.Index(fields=["-when"]),
            models.Index(fields=["is_published", "-when"]),
        ]
        verbose_name = "Event"
        verbose_name_plural = "Events"

    # ---------- behaviors ----------
    def save(self, *args, **kwargs):
        """
        Slug auto-conversion policy:
        - If slug is empty: generate from title (unique).
        - If slug is provided: normalize via slugify, then ensure uniqueness.
        - Maintain `published_at` when toggling `is_published`.
        """
        # Normalize/auto-generate slug
        if self.slug:
            # User provided a slug → normalize and uniquify
            cleaned = _clean_slug(slugify(self.slug)) or slugify(self.title)
            self.slug = unique_slugify(self, cleaned, max_length=220)
        else:
            # No slug provided → generate from title
            self.slug = unique_slugify(self, self.title, max_length=220)

        # Publish timestamp policy
        if self.is_published and not self.published_at:
            self.published_at = timezone.now()
        if not self.is_published:
            # If you prefer to keep publish history, comment the next line.
            self.published_at = None

        super().save(*args, **kwargs)

    # ---------- conveniences ----------
    def get_absolute_url(self):
        return f"/events/{self.slug}/"

    @property
    def cover_url(self) -> str:
        return self.cover.url if self.cover else ""

    def __str__(self):
        try:
            local_dt = timezone.localtime(self.when)
            return f"{self.title} @ {local_dt.strftime('%Y-%m-%d %H:%M')}"
        except Exception:
            return self.title
