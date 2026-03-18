# Plik do definiowania widoków, które są renderowane za pomocą szablonizatora Jinja oraz wyświetlane w przeglądarce

from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages #to show message back for errors
from django.middleware.csrf import get_token
from django.shortcuts import redirect, render
from django.templatetags.static import static
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme

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
            'register': reverse('register_user'),
        },
    }


def index(request):
    values = {
        'home_props': _get_home_props(request),
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

        if User.objects.filter(username=username).exists():
            messages.error(request, 'Ta nazwa uzytkownika jest juz zajeta.')
            return render(request, 'main/auth/register.html', {
                'form_values': form_values,
                'next_target': next_target,
            })

        if User.objects.filter(email__iexact=email).exists():
            messages.error(request, 'Konto z tym adresem e-mail juz istnieje.')
            return render(request, 'main/auth/register.html', {
                'form_values': form_values,
                'next_target': next_target,
            })

        user = User.objects.create_user(username, email, password)
        login(request, user)
        return redirect(next_target or 'home')

    return render(request, 'main/auth/register.html', {
        'form_values': form_values,
        'next_target': next_target,
    })

def logout_user(request):
    logout(request)
     
    return redirect('home')
