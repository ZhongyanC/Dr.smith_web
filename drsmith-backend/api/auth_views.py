from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.conf import settings
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
import requests


class AuthCsrfView(APIView):
    permission_classes = [AllowAny]

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return Response({"csrfToken": get_token(request)})


class AuthLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")
        token = (request.data.get("turnstile_token") or "").strip()
        if not username or not password:
            return Response(
                {"detail": "username and password required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Require Turnstile if configured
        secret = getattr(settings, "TURNSTILE_SECRET_KEY", "") or ""
        if secret:
            if not token:
                return Response(
                    {"detail": "Missing Turnstile token."},
                    status=status.HTTP_400_BAD_REQUEST,
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

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response(
                {"detail": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_staff and not user.is_superuser:
            return Response(
                {"detail": "Admin access required"},
                status=status.HTTP_403_FORBIDDEN,
            )
        login(request, user)
        return Response({
            "user": {
                "id": user.id,
                "username": user.username,
                "email": getattr(user, "email", "") or "",
            },
        })


class AuthLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"status": "ok"})


class AuthMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_staff and not user.is_superuser:
            return Response(
                {"detail": "Admin access required"},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response({
            "user": {
                "id": user.id,
                "username": user.username,
                "email": getattr(user, "email", "") or "",
                "display_name": user.get_full_name() or user.username,
            },
        })


class AuthSettingsView(APIView):
    """GET current settings, PATCH to update display name and/or password."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_staff and not user.is_superuser:
            return Response(
                {"detail": "Admin access required"},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response({
            "display_name": user.get_full_name() or user.username,
            "username": user.username,
            "email": getattr(user, "email", "") or "",
        })

    def patch(self, request):
        user = request.user
        if not user.is_staff and not user.is_superuser:
            return Response(
                {"detail": "Admin access required"},
                status=status.HTTP_403_FORBIDDEN,
            )
        errors = {}

        # Update display name (stored in first_name)
        display_name = request.data.get("display_name")
        if display_name is not None:
            dn = str(display_name).strip()
            user.first_name = dn
            user.last_name = ""
            user.save(update_fields=["first_name", "last_name"])

        # Change password
        current = request.data.get("current_password")
        new_pass = request.data.get("new_password")
        if current is not None or new_pass is not None:
            if not current:
                errors["current_password"] = "Current password is required."
            elif not user.check_password(current):
                errors["current_password"] = "Current password is incorrect."
            elif not new_pass:
                errors["new_password"] = "New password is required."
            else:
                try:
                    validate_password(new_pass, user)
                    user.set_password(new_pass)
                    user.save(update_fields=["password"])
                except ValidationError as e:
                    errors["new_password"] = e.messages[0] if e.messages else "Invalid password."

        if errors:
            return Response({"detail": errors}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "ok"})
