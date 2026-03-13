import json

from django import template
from django.conf import settings
from django.templatetags.static import static
from django.utils.safestring import mark_safe

register = template.Library()


def _manifest_path():
    return settings.BASE_DIR / 'main' / 'static' / 'main' / 'frontend' / '.vite' / 'manifest.json'


def _dev_server_url():
    return getattr(settings, 'VITE_DEV_SERVER_URL', '')


def _react_refresh_preamble(dev_server_url):
    return f"""
<script type="module">
    import RefreshRuntime from "{dev_server_url}/@react-refresh";
    RefreshRuntime.injectIntoGlobalHook(window);
    window.$RefreshReg$ = () => {{}};
    window.$RefreshSig$ = () => (type) => type;
    window.__vite_plugin_react_preamble_installed__ = true;
</script>
""".strip()


def _read_manifest():
    manifest_path = _manifest_path()

    if not manifest_path.exists():
        raise FileNotFoundError(
            f'Vite manifest not found at {manifest_path}. Run "npm run build" or start Vite dev server.'
        )

    return json.loads(manifest_path.read_text(encoding='utf-8'))


def _get_manifest_entry(entry_name):
    manifest = _read_manifest()

    if entry_name not in manifest:
        raise KeyError(f'Vite entry "{entry_name}" not found in manifest.')

    return manifest[entry_name]


@register.simple_tag
def vite_client():
    dev_server_url = _dev_server_url()

    if not dev_server_url:
        return ''

    tags = [
        _react_refresh_preamble(dev_server_url),
        f'<script type="module" src="{dev_server_url}/@vite/client"></script>',
    ]

    return mark_safe('\n'.join(tags))


@register.simple_tag
def vite_styles(entry_name):
    if _dev_server_url():
        return ''

    entry = _get_manifest_entry(entry_name)
    stylesheet_tags = [
        f'<link rel="stylesheet" href="{static(css_path)}">'
        for css_path in entry.get('css', [])
    ]

    return mark_safe('\n'.join(stylesheet_tags))


@register.simple_tag
def vite_script(entry_name):
    dev_server_url = _dev_server_url()

    if dev_server_url:
        return mark_safe(f'<script type="module" src="{dev_server_url}/{entry_name}"></script>')

    entry = _get_manifest_entry(entry_name)
    return mark_safe(f'<script type="module" src="{static(entry["file"])}"></script>')
