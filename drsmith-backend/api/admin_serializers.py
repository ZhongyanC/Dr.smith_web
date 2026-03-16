from rest_framework import serializers
from blog.models import Post, Category
from event.models import Event
from .utils import youtube_embed


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class AdminPostSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
        required=False,
        allow_null=True,
    )
    cover_url = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id", "title", "subtitle", "slug", "body",
            "cover", "cover_url", "is_published",
            "created_at", "updated_at",
            "category", "category_id",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_cover_url(self, obj):
        if obj.cover:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.cover.url)
            return obj.cover.url
        return None

    def create(self, validated_data):
        return super().create(validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class AdminEventSerializer(serializers.ModelSerializer):
    cover_url = serializers.SerializerMethodField()
    body_html = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Event
        fields = [
            "id", "title", "subtitle", "slug", "when",
            "body", "body_html", "cover", "cover_url",
            "is_published", "published_at",
            "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "published_at"]

    def get_cover_url(self, obj):
        if obj.cover:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.cover.url)
            return obj.cover.url
        return None

    def get_body_html(self, obj):
        return youtube_embed(obj.body or "")
