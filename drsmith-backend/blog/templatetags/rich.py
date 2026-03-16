
import re
from django import template
register = template.Library()

YT_PATTERNS = [
    re.compile(r'(https?://(?:www\.)?youtube\.com/watch\?v=([A-Za-z0-9_-]{11}))'),
    re.compile(r'(https?://(?:www\.)?youtu\.be/([A-Za-z0-9_-]{11}))'),
]

def _to_iframe(video_id: str) -> str:
    src = f"https://www.youtube.com/embed/{video_id}"
    return f'<div class="video-wrap"><iframe src="{src}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>'
@register.filter(name='youtube_embed', is_safe=True)
def youtube_embed(html: str) -> str:
    if not html:
        return html
    if '<iframe' in html:
        import re as _re
        return _re.sub(r'<iframe([^>]*)></iframe>', r'<div class="video-wrap"><iframe\1></iframe></div>', html, flags=_re.I)
    for pat in YT_PATTERNS:
        def repl(m):
            url, vid = m.group(1), m.group(2)
            return _to_iframe(vid)
        html = pat.sub(repl, html)
    return html
