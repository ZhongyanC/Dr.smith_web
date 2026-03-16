import os
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from django.core.files.storage import default_storage
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from blog.models import Post, Category
from event.models import Event
from .admin_serializers import (
    AdminPostSerializer,
    AdminEventSerializer,
    CategorySerializer,
)
from .contact_models import ContactMessage


class AdminCategoryListCreateView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [JSONParser]

    def get(self, request):
        cats = Category.objects.all().order_by("name")
        return Response({"results": CategorySerializer(cats, many=True).data})

    def post(self, request):
        ser = CategorySerializer(data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminCategoryDetailView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [JSONParser]

    def get_object(self, pk):
        return get_object_or_404(Category, pk=pk)

    def put(self, request, pk):
        cat = self.get_object(pk)
        ser = CategorySerializer(cat, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        cat = self.get_object(pk)
        cat.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminPostListCreateView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        qs = Post.objects.all().select_related("category").order_by("-created_at")
        q = request.GET.get("q", "").strip()
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(body__icontains=q))
        ser = AdminPostSerializer(qs, many=True, context={"request": request})
        return Response({"results": ser.data})

    def _post_data(self, request):
        data = dict(request.data.dict()) if hasattr(request.data, "dict") else dict(request.data)
        if request.FILES.get("cover"):
            data["cover"] = request.FILES["cover"]
        if data.get("category") == "" or data.get("category_id") == "":
            data["category_id"] = None
        return data

    def post(self, request):
        data = self._post_data(request)
        ser = AdminPostSerializer(data=data, context={"request": request})
        if ser.is_valid():
            ser.save()
            return Response(ser.data, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminPostDetailView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, pk):
        return get_object_or_404(Post, pk=pk)

    def get(self, request, pk):
        post = self.get_object(pk)
        ser = AdminPostSerializer(post, context={"request": request})
        return Response(ser.data)

    def _put_data(self, request):
        data = dict(request.data.dict()) if hasattr(request.data, "dict") else dict(request.data)
        if request.FILES.get("cover"):
            data["cover"] = request.FILES["cover"]
        elif data.get("cover") == "":
            data["cover"] = None
        if data.get("category") == "" or data.get("category_id") == "":
            data["category_id"] = None
        return data

    def put(self, request, pk):
        post = self.get_object(pk)
        data = self._put_data(request)
        ser = AdminPostSerializer(post, data=data, partial=True, context={"request": request})
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        post = self.get_object(pk)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminEventListCreateView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        qs = Event.objects.all().order_by("-when", "-created_at")
        q = request.GET.get("q", "").strip()
        if q:
            qs = qs.filter(
                Q(title__icontains=q) | Q(subtitle__icontains=q) | Q(body__icontains=q)
            )
        ser = AdminEventSerializer(qs, many=True, context={"request": request})
        return Response({"results": ser.data})

    def post(self, request):
        data = dict(request.data.dict()) if hasattr(request.data, "dict") else dict(request.data)
        if request.FILES.get("cover"):
            data["cover"] = request.FILES["cover"]
        if data.get("is_published") and not data.get("published_at"):
            data["published_at"] = timezone.now()
        ser = AdminEventSerializer(data=data, context={"request": request})
        if ser.is_valid():
            ser.save()
            return Response(ser.data, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminEventDetailView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, pk):
        return get_object_or_404(Event, pk=pk)

    def get(self, request, pk):
        event = self.get_object(pk)
        ser = AdminEventSerializer(event, context={"request": request})
        return Response(ser.data)

    def put(self, request, pk):
        event = self.get_object(pk)
        data = dict(request.data.dict()) if hasattr(request.data, "dict") else dict(request.data)
        if request.FILES.get("cover"):
            data["cover"] = request.FILES["cover"]
        elif data.get("cover") == "":
            data["cover"] = None
        if data.get("is_published") and not event.published_at:
            data["published_at"] = timezone.now()
        elif not data.get("is_published"):
            data["published_at"] = None
        ser = AdminEventSerializer(event, data=data, partial=True, context={"request": request})
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        event = self.get_object(pk)
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminContactListView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [JSONParser]

    def get(self, request):
        qs = ContactMessage.objects.all().order_by("-created_at")
        q = request.GET.get("q", "").strip()
        if q:
            qs = qs.filter(
                Q(name__icontains=q)
                | Q(email__icontains=q)
                | Q(phone__icontains=q)
                | Q(message__icontains=q)
            )
        results = [
            {
                "id": c.id,
                "name": c.name,
                "email": c.email,
                "phone": c.phone,
                "message": c.message,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "ip_address": c.ip_address,
                "user_agent": c.user_agent,
            }
            for c in qs
        ]
        return Response({"results": results})


class AdminContactDetailView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [JSONParser]

    def delete(self, request, pk):
        contact = get_object_or_404(ContactMessage, pk=pk)
        contact.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB


class AdminImageUploadView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            return Response(
                {'detail': 'Invalid file type. Allowed: jpeg, png, gif, webp'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if file.size > MAX_IMAGE_SIZE:
            return Response(
                {'detail': 'File too large. Max size: 5MB'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        now = timezone.now()
        ext = os.path.splitext(file.name)[1] or '.jpg'
        safe_name = f"{now.strftime('%Y%m%d%H%M%S')}_{file.name[:20]}{ext}".replace(' ', '_')
        path = f"uploads/{now:%Y}/{now:%m}/{safe_name}"
        saved_path = default_storage.save(path, file)
        url = default_storage.url(saved_path)
        return Response({'url': url})
