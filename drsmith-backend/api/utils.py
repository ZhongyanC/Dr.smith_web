import re

YT_PATTERNS = [
    re.compile(r'(https?://(?:www\.)?youtube\.com/watch\?v=([A-Za-z0-9_-]{11}))'),
    re.compile(r'(https?://(?:www\.)?youtu\.be/([A-Za-z0-9_-]{11}))'),
]


def youtube_embed(html):
    """Convert YouTube URLs to embed iframes."""
    if not html:
        return html
    if '<iframe' in html:
        return re.sub(
            r'<iframe([^>]*)></iframe>',
            r'<div class="video-wrap"><iframe\1></iframe></div>',
            html,
            flags=re.I,
        )
    for pat in YT_PATTERNS:
        def repl(m):
            vid = m.group(2)
            src = f"https://www.youtube.com/embed/{vid}"
            return f'<div class="video-wrap"><iframe src="{src}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>'
        html = pat.sub(repl, html)
    return html


def clean_text(value):
    """Strip HTML and URLs for excerpt."""
    if not value:
        return ''
    text = re.sub(r'<[^>]*>', '', value)
    text = text.replace('&nbsp;', ' ')
    text = re.sub(r'https?://\S+', '', text)
    return text.strip()
