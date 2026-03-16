# blog/templatetags/avatar.py
import hashlib
from urllib.parse import urlencode
from django import template
from django.conf import settings

register = template.Library()

def _gravatar(email: str, size: int = 64):
    email = (email or '').strip().lower().encode('utf-8')
    md5 = hashlib.md5(email).hexdigest()
    qs = urlencode({'s': str(size), 'd': 'identicon', 'r': 'g'})
    return f'https://www.gravatar.com/avatar/{md5}?{qs}'

@register.filter(name='avatar_url')
def avatar_url(user, size=64):
    if not user or user.is_anonymous:
        return getattr(settings, 'DEFAULT_AVATAR_URL', f'https://placehold.co/{size}x{size}.png')

    # 1) profile.avatar
    profile = getattr(user, 'profile', None)
    if profile and getattr(profile, 'avatar', None):
        try:
            return profile.avatar.url
        except Exception:
            pass

    # 2) 自定义直链字段
    field = getattr(settings, 'AVATAR_URL_FIELD', None)
    if field and hasattr(user, field):
        v = getattr(user, field)
        if v:
            return v

    # 3) gravatar
    email = getattr(user, 'email', '') or ''
    if email:
        return _gravatar(email, int(size))

    # 4) 占位
    return getattr(settings, 'DEFAULT_AVATAR_URL', f'https://placehold.co/{size}x{size}.png')
