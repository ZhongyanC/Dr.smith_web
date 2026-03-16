
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# Load simple KEY=VALUE pairs from drsmith-backend/.env into process environment
env_path = BASE_DIR / ".env"
if env_path.exists():
  with env_path.open() as f:
    for line in f:
      line = line.strip()
      if not line or line.startswith("#") or "=" not in line:
        continue
      key, value = line.split("=", 1)
      key = key.strip()
      value = value.strip().strip('"').strip("'")
      os.environ.setdefault(key, value)
SECRET_KEY = 'django-insecure-replace-me'
DEBUG = True
ALLOWED_HOSTS = ["*"]
CSRF_TRUSTED_ORIGINS = [
    "https://scottmcbridesmith.com",
    "https://www.scottmcbridesmith.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
INSTALLED_APPS = [
    'django.contrib.admin',
    'rest_framework',
    'corsheaders',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'django_summernote',
    'django_comments',
    'django_comments_xtd',
    'blog',
    'event',
    'api',
]
SITE_ID = 1
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
ROOT_URLCONF = 'myblog.urls'
TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [BASE_DIR / 'templates'],
    'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.debug',
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]
WSGI_APPLICATION = 'myblog.wsgi.application'
DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3','NAME': BASE_DIR / 'db.sqlite3'}}
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'America/Chicago'
USE_I18N = True
USE_TZ = True
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / "statics"]
STATIC_ROOT = BASE_DIR / 'staticfiles'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
# ① 打开图片按钮 & 启用上传
SUMMERNOTE_CONFIG = {
    "iframe": True,
    "summernote": {
        "width": "100%",
        "height": "340",
        "toolbar": [
            ['style', ['style']],
            ['font', ['bold', 'italic', 'underline', 'clear']],
            ['fontname', ['fontname']],
            ['fontsize', ['fontsize']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['insert', ['link', 'picture', 'video', 'table']],   # ← 加上 'picture'
            ['view', ['fullscreen', 'codeview', 'help']],
        ],
    },
    "disable_upload": False,                    # ← 允许上传
    "attachment_require_authentication": True,  # 仅登录用户能上传（建议保留）
    # 可选：限制大小与类型（按需调整）
    "attachment_filesize_limit": 10 * 1024 * 1024,   # 10MB
    "attachment_upload_to": "summernote/%Y/%m/",     # 上传目录
    # 可选：自定义存储（例如用 S3）
    # "attachment_storage_class": "django.core.files.storage.FileSystemStorage",
}

# ② 媒体文件路径（如果你项目还没配置）
MEDIA_URL = "/media/"
MEDIA_ROOT = Path(BASE_DIR) / "media"

COMMENTS_APP = "django_comments_xtd"
COMMENTS_XTD_THREADED = True
COMMENTS_XTD_MAX_THREAD_LEVEL = 3
COMMENTS_XTD_CONFIRM_EMAIL = False

DEFAULT_AVATAR_URL = '/static/avatar.png'
AVATAR_URL_FIELD = ''  # 若你把直链放在 user.avatar_url 之类，填字段名

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Session cookie for dev (Vite proxy at localhost:5173)
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_HTTPONLY = True

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
}

# Cloudflare Turnstile keys (read from environment or .env)
TURNSTILE_SITE_KEY = os.environ.get("TURNSTILE_SITE_KEY", "")
TURNSTILE_SECRET_KEY = os.environ.get("TURNSTILE_SECRET_KEY", "")

