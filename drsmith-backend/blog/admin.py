# blog/admin.py
from django.contrib import admin
from django_summernote.admin import SummernoteModelAdmin
from .models import Post, Category

# ----- Branding -----
admin.site.site_header = "Dr.Smith Admin"
admin.site.site_title = "Dr.Smith Admin"
admin.site.index_title = "Dashboard"
admin.site.site_url = "/blog/"  # “View site” 链接到前台

# ----- Post admin -----
@admin.action(description="Publish selected posts")
def make_published(modeladmin, request, queryset):
    queryset.update(is_published=True)

@admin.action(description="Unpublish selected posts")
def make_unpublished(modeladmin, request, queryset):
    queryset.update(is_published=False)

@admin.register(Post)
class PostAdmin(SummernoteModelAdmin):
    summernote_fields = ("body",)
    list_display = ("title", "category", "is_published", "created_at")
    list_filter = ("is_published", "category", "created_at")
    search_fields = ("title", "subtitle", "body")
    prepopulated_fields = {"slug": ("title",)}
    ordering = ("-created_at",)
    date_hierarchy = "created_at"
    list_display_links = ("title",)
    list_editable = ("is_published",)
    actions = [make_published, make_unpublished]

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name",)
    prepopulated_fields = {"slug": ("name",)}
