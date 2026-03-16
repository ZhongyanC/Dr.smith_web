from rest_framework import serializers
from blog.models import Post, Category
from event.models import Event
from .utils import youtube_embed, clean_text


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']


class PostListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    cover_url = serializers.SerializerMethodField()
    excerpt = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'subtitle', 'slug', 'body', 'excerpt',
            'cover_url', 'created_at', 'category',
        ]

    def get_cover_url(self, obj):
        if obj.cover:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover.url)
            return obj.cover.url
        return None

    def get_excerpt(self, obj):
        text = obj.subtitle or clean_text(obj.body)
        return (text[:240] + '...') if len(text) > 240 else text


class PostDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    cover_url = serializers.SerializerMethodField()
    body = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'subtitle', 'slug', 'body',
            'cover_url', 'created_at', 'updated_at',
            'category',
        ]

    def get_cover_url(self, obj):
        if obj.cover:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover.url)
            return obj.cover.url
        return None

    def get_body(self, obj):
        return youtube_embed(obj.body or '')


class EventSerializer(serializers.ModelSerializer):
    cover_url = serializers.SerializerMethodField()
    body = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'subtitle', 'slug', 'when',
            'body', 'cover_url', 'is_published',
        ]

    def get_cover_url(self, obj):
        if obj.cover:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover.url)
            return obj.cover.url
        return None

    def get_body(self, obj):
        return youtube_embed(obj.body or '')


class CommentSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    user_name = serializers.CharField(source='user_name', read_only=True)
    comment = serializers.CharField(read_only=True)
    submit_date = serializers.DateTimeField(read_only=True)
    parent_id = serializers.IntegerField(source='parent_id', allow_null=True, read_only=True)
    children = serializers.SerializerMethodField()

    def get_children(self, obj):
        if hasattr(obj, 'children') and obj.children:
            return CommentSerializer(obj.children, many=True, context=self.context).data
        return []
