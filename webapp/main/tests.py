import json
import re
from datetime import time

from django.contrib.auth.models import User
from django.db import OperationalError
from django.http import HttpResponse
from django.test import RequestFactory
from django.test import TestCase
from django.urls import reverse

from main.middleware import DatabaseErrorPageMiddleware
from main.models import Dostepnosc, Przedmiot, Tutor, User as TutorUser


class MainViewsTests(TestCase):
    def _extract_home_props(self, response):
        html = response.content.decode()
        match = re.search(
            r'<script id="home-app-props" type="application/json">(.*?)</script>',
            html,
            re.DOTALL,
        )

        self.assertIsNotNone(match)
        return json.loads(match.group(1))

    def test_home_page_renders(self):
        response = self.client.get(reverse('home'))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'main/pages/home/index.html')

    def test_home_page_uses_built_frontend_asset_paths(self):
        response = self.client.get(reverse('home'))
        html = response.content.decode()

        self.assertIn('/static/main/frontend/assets/', html)
        self.assertNotIn('/static/assets/', html)

    def test_home_page_exposes_authenticated_user_in_frontend_props(self):
        user = User.objects.create_user(
            username='tester',
            email='tester@example.com',
            password='secret123',
        )
        self.client.force_login(user)

        response = self.client.get(reverse('home'))
        home_props = self._extract_home_props(response)

        self.assertTrue(home_props['isAuthenticated'])
        self.assertEqual(home_props['currentUser']['email'], 'tester@example.com')
        self.assertEqual(home_props['currentUser']['username'], 'tester')
        self.assertEqual(home_props['urls']['tutorSearch'], reverse('tutor_search'))

    def test_auth_pages_render(self):
        login_response = self.client.get(reverse('login_user'))
        register_response = self.client.get(reverse('register_user'))

        self.assertEqual(login_response.status_code, 200)
        self.assertEqual(register_response.status_code, 200)
        self.assertTemplateUsed(login_response, 'main/auth/login.html')
        self.assertTemplateUsed(register_response, 'main/auth/register.html')

    def test_cars_page_renders_for_authenticated_user(self):
        user = User.objects.create_user(username='tester', password='secret123')
        self.client.force_login(user)

        response = self.client.get(reverse('cars'))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'main/pages/cars/index.html')

    def test_register_rejects_password_confirmation_mismatch(self):
        response = self.client.post(
            reverse('register_user'),
            {
                'username': 'newuser',
                'email': 'newuser@example.com',
                'password': 'secret123',
                'password_confirm': 'secret456',
                'next': reverse('cars'),
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'main/auth/register.html')
        self.assertContains(response, 'Hasla musza byc takie same.')
        self.assertContains(response, f'value="{reverse("cars")}"')
        self.assertFalse(User.objects.filter(username='newuser').exists())

    def test_login_redirects_to_safe_next_target(self):
        User.objects.create_user(username='tester', password='secret123')

        response = self.client.post(
            reverse('login_user'),
            {
                'username': 'tester',
                'password': 'secret123',
                'next': reverse('cars'),
            },
        )

        self.assertRedirects(response, reverse('cars'))

    def test_login_ignores_external_next_target(self):
        User.objects.create_user(username='tester', password='secret123')

        response = self.client.post(
            reverse('login_user'),
            {
                'username': 'tester',
                'password': 'secret123',
                'next': 'https://example.com/evil',
            },
        )

        self.assertRedirects(response, reverse('home'))

    def test_register_creates_user_and_redirects_to_safe_next_target(self):
        response = self.client.post(
            reverse('register_user'),
            {
                'username': 'newuser',
                'email': 'newuser@example.com',
                'password': 'secret123',
                'password_confirm': 'secret123',
                'next': reverse('cars'),
            },
        )

        self.assertRedirects(response, reverse('cars'))
        self.assertTrue(User.objects.filter(username='newuser').exists())

    def test_tutor_search_returns_exact_and_suggested_results(self):
        exact_user = TutorUser.objects.create(
            imie='Jan',
            nazwisko='Kowalski',
            email='jan@example.com',
            haslo='sekret',
        )
        exact_tutor = Tutor.objects.create(
            uzytkownik=exact_user,
            stawka_godzinowa='120.00',
            rating=4.8,
        )
        exact_tutor.przedmioty.add(
            Przedmiot.objects.create(
                nazwa='Matematyka',
                temat='Algebra',
                poziom='Liceum',
            )
        )
        Dostepnosc.objects.create(
            tutor=exact_tutor,
            dzien_tygodnia=2,
            godzina_od=time(19, 0),
            godzina_do=time(20, 0),
        )

        suggested_user = TutorUser.objects.create(
            imie='Anna',
            nazwisko='Nowak',
            email='anna@example.com',
            haslo='sekret',
        )
        suggested_tutor = Tutor.objects.create(
            uzytkownik=suggested_user,
            stawka_godzinowa='95.00',
            rating=4.5,
        )
        suggested_tutor.przedmioty.add(
            Przedmiot.objects.create(
                nazwa='Matematyka',
                temat='Algebra',
                poziom='Liceum',
            )
        )
        Dostepnosc.objects.create(
            tutor=suggested_tutor,
            dzien_tygodnia=2,
            godzina_od=time(18, 0),
            godzina_do=time(19, 0),
        )

        response = self.client.get(
            reverse('tutor_search'),
            {
                'subject': 'Matematyka',
                'topic': 'Algebra',
                'level': 'Liceum',
                'hour': '19:00-20:00',
                'date': '2026-03-11',
            },
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()

        self.assertEqual(len(payload['exactMatches']), 1)
        self.assertEqual(payload['exactMatches'][0]['name'], 'Jan Kowalski')
        self.assertEqual(len(payload['suggestedTutors']), 1)
        self.assertEqual(payload['suggestedTutors'][0]['name'], 'Anna Nowak')

    def test_tutor_search_rejects_missing_filters(self):
        response = self.client.get(reverse('tutor_search'), {'subject': 'Matematyka'})

        self.assertEqual(response.status_code, 400)
        self.assertIn('Brakuje wymaganych parametrow', response.json()['detail'])

    def test_database_error_middleware_returns_custom_error_page(self):
        def raising_view(_request):
            raise OperationalError('database unavailable')

        middleware = DatabaseErrorPageMiddleware(raising_view)
        response = middleware(RequestFactory().get('/'))

        self.assertEqual(response.status_code, 500)
        self.assertIn(b'Blad bazy danych', response.content)
        self.assertIn(b'error.png', response.content)

    def test_database_error_middleware_passes_regular_response(self):
        middleware = DatabaseErrorPageMiddleware(lambda _request: HttpResponse('ok'))
        response = middleware(RequestFactory().get('/'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, b'ok')
