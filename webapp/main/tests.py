import json
import re
from urllib.parse import urlencode

from django.db import OperationalError
from django.contrib.auth.models import User
from django.http import HttpResponse
from django.test import RequestFactory
from django.test import TestCase
from django.urls import reverse

from main.middleware import DatabaseErrorPageMiddleware


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

    def test_component_preview_page_exposes_requested_component(self):
        response = self.client.get(
            reverse('component_preview', kwargs={'component_slug': 'subject-select'})
        )
        home_props = self._extract_home_props(response)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'main/pages/home/index.html')
        self.assertEqual(home_props['previewComponent'], 'subject-select')
        self.assertEqual(
            home_props['urls']['schoolLevelSelectPreview'],
            reverse('component_preview', kwargs={'component_slug': 'school-level-select'}),
        )
        self.assertEqual(
            home_props['urls']['subjectSelectPreview'],
            reverse('component_preview', kwargs={'component_slug': 'subject-select'}),
        )

    def test_component_preview_page_rejects_unsupported_component(self):
        response = self.client.get(
            reverse('component_preview', kwargs={'component_slug': 'unknown-component'})
        )

        self.assertEqual(response.status_code, 404)

    def test_auth_pages_render(self):
        login_response = self.client.get(reverse('login_user'))
        register_response = self.client.get(reverse('register_user'))

        self.assertEqual(login_response.status_code, 200)
        self.assertEqual(register_response.status_code, 200)
        self.assertTemplateUsed(login_response, 'main/auth/login.html')
        self.assertTemplateUsed(register_response, 'main/auth/register.html')

    def test_onboarding_page_requires_authentication(self):
        response = self.client.get(reverse('onboarding_account_type'))

        self.assertRedirects(
            response,
            f'{reverse("login_user")}?next={reverse("onboarding_account_type")}',
        )

    def test_onboarding_page_exposes_account_type_mode(self):
        user = User.objects.create_user(username='tester', password='secret123')
        self.client.force_login(user)
        response = self.client.get(
            f'{reverse("onboarding_account_type")}?{urlencode({"next": reverse("cars")})}'
        )
        home_props = self._extract_home_props(response)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'main/pages/home/index.html')
        self.assertEqual(home_props['onboardingMode'], 'account-type')
        self.assertEqual(home_props['onboardingNextTarget'], reverse('cars'))

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

    def test_register_rejects_username_duplicate_case_insensitive(self):
        User.objects.create_user(
            username='NewUser',
            email='newuser-existing@example.com',
            password='secret123',
        )

        response = self.client.post(
            reverse('register_user'),
            {
                'username': 'newuser',
                'email': 'newuser2@example.com',
                'password': 'secret123',
                'password_confirm': 'secret123',
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'main/auth/register.html')
        self.assertContains(response, 'Ta nazwa uzytkownika jest juz zajeta.')
        self.assertEqual(User.objects.filter(username__iexact='newuser').count(), 1)

    def test_register_rejects_email_duplicate_case_insensitive(self):
        User.objects.create_user(
            username='existing-user',
            email='duplicate@example.com',
            password='secret123',
        )

        response = self.client.post(
            reverse('register_user'),
            {
                'username': 'fresh-user',
                'email': 'DUPLICATE@EXAMPLE.COM',
                'password': 'secret123',
                'password_confirm': 'secret123',
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'main/auth/register.html')
        self.assertContains(response, 'Konto z tym adresem e-mail juz istnieje.')
        self.assertFalse(User.objects.filter(username='fresh-user').exists())

    def test_register_normalizes_email_before_save(self):
        response = self.client.post(
            reverse('register_user'),
            {
                'username': 'normalized-user',
                'email': 'MixedCase@Example.COM',
                'password': 'secret123',
                'password_confirm': 'secret123',
            },
        )

        self.assertEqual(response.status_code, 302)
        created_user = User.objects.get(username='normalized-user')
        self.assertEqual(created_user.email, 'mixedcase@example.com')

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

        expected_redirect = f'{reverse("onboarding_account_type")}?{urlencode({"next": reverse("cars")})}'
        self.assertRedirects(response, expected_redirect)
        self.assertTrue(User.objects.filter(username='newuser').exists())

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
