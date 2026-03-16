
from django.shortcuts import render, get_object_or_404
from django.core.paginator import Paginator
from django.db.models import Q
from .models import Post, Category, Tag

def post_list(request):
    qs = Post.objects.filter(is_published=True).order_by('-created_at')
    q = request.GET.get('q', '').strip()
    cslug = request.GET.get('category', '').strip() or request.GET.get('c', '').strip()
    tslug = request.GET.get('tag', '').strip() or request.GET.get('t', '').strip()
    if q:
        qs = qs.filter(Q(title__icontains=q) | Q(body__icontains=q))
    if cslug:
        qs = qs.filter(category__slug=cslug)
    if tslug:
        qs = qs.filter(tags__slug=tslug)
    paginator = Paginator(qs.distinct(), 6)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    context = {
        'page_obj': page_obj,
        'query': q,
        'current_category': cslug,
        'current_tag': tslug,
        'categories': Category.objects.all().order_by('name'),
        'tags': Tag.objects.all().order_by('name'),
    }
    return render(request, 'blog/post_list.html', context)

def post_detail(request, slug):
    post = get_object_or_404(Post, slug=slug, is_published=True)
    related = Post.objects.filter(is_published=True).exclude(id=post.id)
    if post.category_id:
        related = related.filter(category=post.category_id)
    related = related.order_by('-created_at')[:4]
    context = {
        'post': post,
        'related': related,
        'categories': Category.objects.all().order_by('name'),
        'tags': Tag.objects.all().order_by('name'),
    }
    return render(request, 'blog/post_detail.html', context)
