from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from django.core.paginator import Paginator
from django.db.models import Q
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.conf import settings
import requests

from blog.models import Post, Category
from event.models import Event
from .serializers import (
    PostListSerializer,
    PostDetailSerializer,
    EventSerializer,
    CategorySerializer,
)
from .contact_models import ContactMessage


class PostListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Post.objects.filter(is_published=True).select_related('category').order_by('-created_at')
        q = request.GET.get('q', '').strip()
        cslug = request.GET.get('category', '').strip() or request.GET.get('c', '').strip()
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(body__icontains=q))
        if cslug:
            qs = qs.filter(category__slug=cslug)
        paginator = Paginator(qs, 6)
        page_number = request.GET.get('page', 1)
        page_obj = paginator.get_page(page_number)

        serializer = PostListSerializer(page_obj.object_list, many=True, context={'request': request})
        return Response({
            'results': serializer.data,
            'paginator': {
                'number': page_obj.number,
                'num_pages': paginator.num_pages,
            },
            'categories': CategorySerializer(Category.objects.all().order_by('name'), many=True).data,
            'query': q,
            'current_category': cslug,
        })


class PostDetailAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        post = get_object_or_404(Post, slug=slug, is_published=True)
        related = Post.objects.filter(is_published=True).exclude(id=post.id)
        if post.category_id:
            related = related.filter(category=post.category_id)
        related = related.order_by('-created_at')[:4]

        post_serializer = PostDetailSerializer(post, context={'request': request})
        related_serializer = PostListSerializer(related, many=True, context={'request': request})
        return Response({
            'post': post_serializer.data,
            'related': related_serializer.data,
        })


class EventListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from django.utils import timezone
        qs = Event.objects.filter(is_published=True)
        q = request.GET.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(title__icontains=q) |
                Q(subtitle__icontains=q) |
                Q(body__icontains=q),
            )
        now = timezone.now()
        upcoming = qs.filter(when__gte=now).order_by('when')
        past = qs.filter(when__lt=now).order_by('-when')

        return Response({
            'upcoming': EventSerializer(upcoming, many=True, context={'request': request}).data,
            'past': EventSerializer(past, many=True, context={'request': request}).data,
            'query': q,
        })


class EventDetailAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        event = get_object_or_404(Event, slug=slug, is_published=True)
        serializer = EventSerializer(event, context={'request': request})
        return Response({'event': serializer.data})


class CommentListCreateAPIView(APIView):
    permission_classes = [AllowAny]

    def get_xtd_model(self):
        from django_comments_xtd import get_model
        return get_model()

    def build_tree(self, comments_queryset):
        """Build nested tree from flat comment list."""
        items = list(comments_queryset)
        by_id = {c.id: {'obj': c, 'children': []} for c in items}
        roots = []
        for c in items:
            node = by_id[c.id]
            if not c.parent_id or c.parent_id == c.id:
                roots.append(node)
            else:
                parent = by_id.get(c.parent_id)
                if parent:
                    parent['children'].append(node)
                else:
                    roots.append(node)
        def sort_key(n):
            return n['obj'].submit_date
        def sort_all(nodes):
            for n in nodes:
                n['children'] = sorted(n['children'], key=sort_key)
                sort_all(n['children'])
            return sorted(nodes, key=sort_key)
        return sort_all(roots)

    def serialize_comment(self, node):
        c = node['obj']
        return {
            'id': c.id,
            'user_name': getattr(c, 'user_name', None) or (c.user.get_full_name() if c.user_id else getattr(c, 'name', '')),
            'comment': c.comment,
            'submit_date': c.submit_date.isoformat() if c.submit_date else None,
            'children': [self.serialize_comment(ch) for ch in node['children']],
        }

    def get(self, request, post_id):
        post = get_object_or_404(Post, id=post_id, is_published=True)
        XtdComment = self.get_xtd_model()
        ct = ContentType.objects.get_for_model(Post)
        comments_qs = XtdComment.objects.filter(
            content_type=ct,
            object_pk=str(post.id),
            is_public=True,
            is_removed=False,
        ).order_by('thread_id', 'order', 'submit_date')

        tree = self.build_tree(comments_qs)
        data = [self.serialize_comment(n) for n in tree]
        return Response({'comments': data})

    def post(self, request, post_id):
        post = get_object_or_404(Post, id=post_id, is_published=True)
        from django_comments import signals
        from django_comments_xtd.forms import XtdCommentForm
        from django.http import QueryDict
        import time
        from django.utils.crypto import salted_hmac

        timestamp = int(time.time())
        ct_str = str(post._meta)
        info = (ct_str, str(post.pk), str(timestamp))
        security_hash = salted_hmac('django.contrib.forms.CommentSecurityForm', '-'.join(info)).hexdigest()

        data = QueryDict(mutable=True)
        data['content_type'] = ct_str
        data['object_pk'] = str(post.id)
        data['timestamp'] = str(timestamp)
        data['security_hash'] = security_hash
        data['reply_to'] = str(request.data.get('reply_to', 0) or 0)
        data['name'] = request.data.get('name', '')
        data['email'] = request.data.get('email', '')
        data['url'] = request.data.get('url', '')
        raw_comment = request.data.get('comment', '')
        if len(raw_comment or '') > 500:
            return Response(
                {'detail': {'comment': ['Comment must be at most 500 characters.']}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        data['comment'] = raw_comment
        data['followup'] = 'false'

        # Optional: validate Cloudflare Turnstile token if provided
        token = (request.data.get('turnstile_token') or '').strip()
        if token:
            secret = getattr(settings, "TURNSTILE_SECRET_KEY", None)
            if not secret:
                return Response(
                    {'detail': 'Turnstile is not configured.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            try:
                verify_resp = requests.post(
                    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                    data={
                        "secret": secret,
                        "response": token,
                        "remoteip": request.META.get("REMOTE_ADDR", ""),
                    },
                    timeout=5,
                )
                verify_data = verify_resp.json()
            except Exception:
                return Response(
                    {'detail': 'Failed to verify Turnstile token.'},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
            if not verify_data.get("success"):
                return Response(
                    {'detail': 'Turnstile verification failed.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        form = XtdCommentForm(post, data=data)
        if form.is_valid():
            comment = form.get_comment_object()
            comment.ip_address = request.META.get('REMOTE_ADDR', '127.0.0.1')
            comment.is_public = True
            if request.user.is_authenticated:
                comment.user = request.user
                comment.user_name = request.user.get_full_name() or request.user.username
                comment.user_email = request.user.email
            signals.comment_was_posted.send(
                sender=comment.__class__,
                comment=comment,
                request=request,
            )
            new_comment = getattr(comment, 'xtd_comment', None)
            pk = new_comment.pk if new_comment else None
            return Response({'id': pk, 'status': 'ok'}, status=status.HTTP_201_CREATED)

        return Response({'detail': dict(form.errors)}, status=status.HTTP_400_BAD_REQUEST)


class CommentDetailAPIView(APIView):
    """
    Delete a single comment by its XtdComment primary key.
    Only authenticated users can delete comments. By default:
    - The comment author can delete their own comments.
    - Staff users can delete any comment.
    """

    def get_xtd_model(self):
        from django_comments_xtd import get_model
        return get_model()

    def delete(self, request, pk):
        XtdComment = self.get_xtd_model()
        comment = get_object_or_404(XtdComment, pk=pk, is_removed=False)

        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Authentication required to delete comments.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Allow deletion if user owns the comment or is staff
        if comment.user_id and comment.user_id != request.user.id and not request.user.is_staff:
            return Response(
                {'detail': 'You do not have permission to delete this comment.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        comment.is_removed = True
        comment.save(update_fields=['is_removed'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ContactAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data or {}
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip()
        phone = (data.get("phone") or "").strip()
        message = (data.get("message") or "").strip()
        token = (data.get("turnstile_token") or "").strip()

        if not name or not email or not message:
            return Response(
                {"detail": "Name, email and message are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(message) > 500:
            return Response(
                {"detail": "Message must be at most 500 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not token:
            return Response(
                {"detail": "Missing Turnstile token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        secret = getattr(settings, "TURNSTILE_SECRET_KEY", None)
        if not secret:
            return Response(
                {"detail": "Turnstile is not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            verify_resp = requests.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={
                    "secret": secret,
                    "response": token,
                    "remoteip": request.META.get("REMOTE_ADDR", ""),
                },
                timeout=5,
            )
            verify_data = verify_resp.json()
        except Exception:
            return Response(
                {"detail": "Failed to verify Turnstile token."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if not verify_data.get("success"):
            return Response(
                {"detail": "Turnstile verification failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ContactMessage.objects.create(
            name=name,
            email=email,
            phone=phone,
            message=message,
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:1000],
        )

        return Response({"success": True}, status=status.HTTP_201_CREATED)
