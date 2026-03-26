# Plik do definiowania widoków, które są renderowane za pomocą szablonizatora Jinja oraz wyświetlane w przeglądarce

from urllib.parse import urlencode

from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, transaction
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages #to show message back for errors
from django.middleware.csrf import get_token
from django.shortcuts import redirect, render
from django.templatetags.static import static
from django.http import Http404
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme

SUPPORTED_PREVIEW_COMPONENTS = {
    'subject-select': 'subject-select',
    'school-level-select': 'school-level-select',
}
validate_username = UnicodeUsernameValidator()

# Create your views here.
def _get_safe_next_target(request):
    candidate = request.POST.get('next') or request.GET.get('next') or ''
    if candidate and url_has_allowed_host_and_scheme(
        candidate,
        allowed_hosts={request.get_host()},
        require_https=request.is_secure(),
    ):
        return candidate

    return ''


def _get_home_props(request):
    current_user = None
    if request.user.is_authenticated:
        current_user = {
            'email': request.user.email,
            'username': request.user.get_username(),
        }

    return {
        'csrfToken': get_token(request),
        'currentUser': current_user,
        'images': {
            'hero': static('main/img/hero_tutor.png'),
            'logo': static('main/img/rent_nerd_logo.png'),
            'mentor': static('main/img/mentor_scene.png'),
        },
        'isAuthenticated': request.user.is_authenticated,
        'urls': {
            'about': reverse('about'),
            'home': reverse('home'),
            'login': reverse('login_user'),
            'logout': reverse('logout_user'),
            'onboarding': reverse('onboarding_account_type'),
            'register': reverse('register_user'),
            'schoolLevelSelectPreview': reverse(
                'component_preview',
                kwargs={'component_slug': 'school-level-select'},
            ),
            'subjectSelectPreview': reverse(
                'component_preview',
                kwargs={'component_slug': 'subject-select'},
            ),
        },
        'onboardingMode': None,
        'onboardingNextTarget': '',
        'previewComponent': None,
    }


def index(request):
    values = {
        'home_props': _get_home_props(request),
    }

    return render(request, 'main/pages/home/index.html', values)


def component_preview(request, component_slug):
    preview_component = SUPPORTED_PREVIEW_COMPONENTS.get(component_slug)

    if preview_component is None:
        raise Http404('Unsupported preview component.')

    values = {
        'home_props': {
            **_get_home_props(request),
            'previewComponent': preview_component,
        },
    }

    return render(request, 'main/pages/home/index.html', values)

@login_required
def onboarding_account_type(request):
    next_target = _get_safe_next_target(request)
    values = {
        'home_props': {
            **_get_home_props(request),
            'onboardingMode': 'account-type',
            'onboardingNextTarget': next_target,
        },
    }

    return render(request, 'main/pages/home/index.html', values)

@login_required
def cars(request):
    values = {
        'cars': [
            {
                'car': 'Nissan 350Z',
                'year': 2003,
                'drive_wheel': 'rwd',
                'color': 'orange',
                'price': '$35,000',
            },
            {
                'car': 'Mitsubishi Lancer Evolution VIII',
                'year': 2004,
                'drive_wheel': '4wd',
                'color': 'yellow',
                'price': '$36,000',
            },
            {
                'car': 'Ford Mustang GT (Gen. 5)',
                'year': 2005,
                'drive_wheel': 'rwd',
                'color': 'red',
                'price': '$36,000',
            },
            {
                'car': 'BMW M3 GTR (E46)',
                'year': 2005,
                'drive_wheel': 'rwd',
                'color': 'blue and gray',
                'price': 'Priceless',
            },
        ]
    }

    return render(request, 'main/pages/cars/index.html', values)

def about(request):
    return render(request, 'main/pages/about/index.html')

# Using the Django authentication system (Django Documentation)
# https://docs.djangoproject.com/en/5.1/topics/auth/default/
def login_user(request):
    next_target = _get_safe_next_target(request)
    form_values = {
        'username': '',
    }

    if request.user.is_authenticated:
        return redirect(next_target or 'home')

    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        form_values['username'] = username

        if not username or not password:
            messages.error(request, 'Uzupelnij nazwe uzytkownika i haslo.')
        else:
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect(next_target or 'home')

            messages.error(request, 'Nieprawidlowy login lub haslo.')

    return render(request, 'main/auth/login.html', {
        'form_values': form_values,
        'next_target': next_target,
    })

def register(request):
    next_target = _get_safe_next_target(request)
    form_values = {
        'email': '',
        'username': '',
    }

    if request.user.is_authenticated:
        return redirect(next_target or 'home')

    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        email = request.POST.get('email', '').strip()
        normalized_email = User.objects.normalize_email(email).strip().lower()
        password = request.POST.get('password', '')
        password_confirm = request.POST.get('password_confirm', '')
        form_values = {
            'email': email,
            'username': username,
        }

        if not username or not email or not password or not password_confirm:
            messages.error(request, 'Uzupelnij wszystkie pola formularza.')
            return render(request, 'main/auth/register.html', {
                'form_values': form_values,
                'next_target': next_target,
            })

        if password != password_confirm:
            messages.error(request, 'Hasla musza byc takie same.')
            return render(request, 'main/auth/register.html', {
                'form_values': form_values,
                'next_target': next_target,
            })

        try:
            validate_username(username)
        except ValidationError:
            messages.error(
                request,
                'Nazwa uzytkownika moze zawierac tylko litery, cyfry i znaki @/./+/-/_.',
            )
            return render(request, 'main/auth/register.html', {
                'form_values': form_values,
                'next_target': next_target,
            })

        try:
            validate_email(normalized_email)
        except ValidationError:
            messages.error(request, 'Podaj poprawny adres e-mail.')
            return render(request, 'main/auth/register.html', {
                'form_values': form_values,
                'next_target': next_target,
            })

        if User.objects.filter(username__iexact=username).exists():
            messages.error(request, 'Ta nazwa uzytkownika jest juz zajeta.')
            return render(request, 'main/auth/register.html', {
                'form_values': form_values,
                'next_target': next_target,
            })

        if User.objects.filter(email__iexact=normalized_email).exists():
            messages.error(request, 'Konto z tym adresem e-mail juz istnieje.')
            return render(request, 'main/auth/register.html', {
                'form_values': form_values,
                'next_target': next_target,
            })

        try:
            with transaction.atomic():
                user = User.objects.create_user(username, normalized_email, password)
        except IntegrityError:
            messages.error(request, 'Ta nazwa uzytkownika jest juz zajeta.')
            return render(request, 'main/auth/register.html', {
                'form_values': form_values,
                'next_target': next_target,
            })

        login(request, user)
        onboarding_url = reverse('onboarding_account_type')
        if next_target:
            onboarding_url = f'{onboarding_url}?{urlencode({"next": next_target})}'

        return redirect(onboarding_url)

    return render(request, 'main/auth/register.html', {
        'form_values': form_values,
        'next_target': next_target,
    })

def logout_user(request):
    logout(request)
     
    return redirect('home')
