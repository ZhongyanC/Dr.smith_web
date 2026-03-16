# blog/templatetags/text_filters.py
import re
from django import template

register = template.Library()

@register.filter
def clean_text(value):
    if not value:
        return ''
    # 去掉 HTML、nbsp、和 URL
    text = re.sub(r'<[^>]*>', '', value)
    text = text.replace('&nbsp;', ' ')
    text = re.sub(r'https?://\S+', '', text)
    return text.strip()