from django.db import models
from django.utils.text import slugify

# --- 一个通用的唯一 slug 生成函数 ---
def unique_slugify(instance, value, slug_field_name='slug', max_length=50):
    """
    根据 value 生成 slug，若冲突自动追加 -2, -3...
    instance: 模型实例
    value: 用于 slugify 的源字符串
    slug_field_name: 字段名（默认 'slug'）
    max_length: 该 slug 字段的 max_length
    """
    base_slug = slugify(value)[:max_length].strip('-')
    slug = base_slug
    ModelClass = instance.__class__
    n = 2
    # 构造查询条件，排除自身（编辑保存时）
    while ModelClass.objects.filter(**{slug_field_name: slug}).exclude(pk=instance.pk).exists():
        suffix = f'-{n}'
        # 预留后缀长度，避免超过 max_length
        slug = f"{base_slug[:max_length - len(suffix)]}{suffix}"
        n += 1
    return slug or 'item'  # 避免空 slug

class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=60, unique=True, blank=True)

    class Meta:
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, self.name, max_length=60)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Post(models.Model):
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=220, blank=True)  # 新增：副标题（可选）
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    body = models.TextField()
    cover = models.ImageField(  # 新增：封面图上传
        upload_to='blog/covers/',
        blank=True,
        null=True,
        help_text='Cover max size: 10MB'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=True)

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='posts'
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            # 预留唯一化空间，统一用 unique_slugify 处理
            self.slug = unique_slugify(self, self.title, max_length=220)
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return f'/blog/{self.slug}/'

    @property
    def cover_url(self):
        return self.cover.url if self.cover else ''

    def __str__(self):
        return self.title
