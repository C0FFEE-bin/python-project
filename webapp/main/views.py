# Plik do definiowania widoków, które są renderowane za pomocą szablonizatora Jinja oraz wyświetlane w przeglądarce

from django.http import HttpResponse
from django.shortcuts import redirect, render
from django.contrib.auth.models import User
from django.contrib.auth import login, logout, authenticate
from django.contrib import messages #to show message back for errors
from django.contrib.auth.decorators import login_required

# Create your views here.
def index(request):
    return render(request, 'main/pages/home/index.html')

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
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        user = authenticate(username=request.POST['username'], password=request.POST['password'])
        if user is not None:
            login(request, user)
            if request.session.get('next'):
                return redirect(request.session.pop('next'))

            return redirect('home')

        messages.error(request, 'Nieprawidlowy login lub haslo.')
        return redirect('login_user')

    if request.GET.get('next'):
        request.session['next'] = request.GET['next']

    return render(request, 'main/auth/login.html')

def register(request):
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')
        password_confirm = request.POST.get('password_confirm', '')

        if not username or not email or not password or not password_confirm:
            messages.error(request, 'Uzupelnij wszystkie pola formularza.')
            return redirect('register_user')

        if password != password_confirm:
            messages.error(request, 'Hasla musza byc takie same.')
            return redirect('register_user')

        if User.objects.filter(username=username).exists():
            messages.error(request, 'Ta nazwa uzytkownika jest juz zajeta.')
            return redirect('register_user')

        if User.objects.filter(email__iexact=email).exists():
            messages.error(request, 'Konto z tym adresem e-mail juz istnieje.')
            return redirect('register_user')

        user = User.objects.create_user(username, email, password)
        login(request, user)
        return redirect('home')

    return render(request, 'main/auth/register.html')

def logout_user(request):
    logout(request)
     
    return redirect('home')
