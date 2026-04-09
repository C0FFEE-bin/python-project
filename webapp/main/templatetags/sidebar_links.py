from django import template

register = template.Library();

@register.simple_tag
def get_links():
    return [{
        'name': 'Start',
        'href': '/',
        'icon': 'fa-house',
    }, {
        'name': 'O nas',
        'href': '/about',
        'icon': 'fa-address-card',
    }]
