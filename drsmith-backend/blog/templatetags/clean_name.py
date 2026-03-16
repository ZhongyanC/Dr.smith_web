# blog/templatetags/clean_name.py
from django import template
import re

register = template.Library()

@register.filter(name="clean_username")
def clean_username(value):
    """去掉用户名中的特殊符号 . - _ 等"""
    if not value:
        return ""
    return re.sub(r"[._\-]+", " ", value).strip()