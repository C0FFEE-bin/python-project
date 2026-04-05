import json
import re
from datetime import time
from urllib.parse import urlencode

from django.contrib.auth.models import User
from django.core.management import call_command
from django.db import OperationalError
from django.http import HttpResponse
from django.test import RequestFactory
from django.test import TestCase
from django.urls import reverse

from main.middleware import DatabaseErrorPageMiddleware
from main.models import Dostepnosc, Obserwacja, Post, Przedmiot, Tutor, User as TutorUser


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
        self.assertEqual(home_props['currentUser']['displayName'], 'tester')
        self.assertEqual(home_props['currentUser']['initials'], 'T')
        self.assertIn('/static/main/img/profile1.png', home_props['currentUser']['avatarUrl'])
        self.assertFalse(home_props['currentUser']['isTutor'])
        self.assertEqual(home_props['currentUser']['accountType'], 'uczen')
        self.assertEqual(home_props['urls']['observations'], reverse('portal_observations'))
        self.assertEqual(home_props['urls']['portalPosts'], reverse('portal_posts'))
        self.assertEqual(home_props['urls']['tutorSearch'], reverse('tutor_search'))
        self.assertEqual(home_props['urls']['tutorDashboardData'], reverse('tutor_dashboard_data'))

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

    def test_about_page_renders_animated_layout(self):
        response = self.client.get(reverse('about'))
        html = response.content.decode()

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'main/pages/about/index.html')
        self.assertIn('Poznaj ekipe, ktora sklada Rent a Nerd.', html)
        self.assertIn('5 osob, jeden wspolny kierunek.', html)
        self.assertIn('/static/main/css/pages/about.css', html)
        self.assertIn('/static/main/css/pages/home.css', html)
        self.assertIn('/static/main/js/about.js', html)
        self.assertNotIn('app-shell__sidebar', html)

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

    def test_tutor_onboarding_save_accepts_multiple_levels_for_tutor(self):
        user = User.objects.create_user(
            username='tutor-login',
            email='tutor@example.com',
            password='secret123',
        )
        self.client.force_login(user)

        response = self.client.post(
            reverse('tutor_onboarding_save'),
            data=json.dumps(
                {
                    'fullName': 'Jan Kowalski',
                    'about': 'Ucze spokojnie i konkretnie.',
                    'subjects': ['Matematyka', 'Fizyka'],
                    'schoolLevels': ['Podstawowka', 'Szkola srednia'],
                    'schedule': {
                        'days': [
                            {'label': '02.03', 'weekday': 0},
                            {'label': '03.03', 'weekday': 1},
                        ],
                        'rows': [
                            {
                                'timeLabel': '16:00',
                                'slots': ['available', 'neutral'],
                            },
                            {
                                'timeLabel': '18:00',
                                'slots': ['neutral', 'neutral'],
                            },
                        ],
                    },
                }
            ),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()

        tutor = Tutor.objects.get(pk=payload['tutorId'])
        subject_levels = sorted(tutor.przedmioty.values_list('nazwa', 'poziom'))

        self.assertEqual(
            subject_levels,
            [
                ('Fizyka', 'Podstawowka'),
                ('Fizyka', 'Szkola srednia'),
                ('Matematyka', 'Podstawowka'),
                ('Matematyka', 'Szkola srednia'),
            ],
        )
        self.assertEqual(payload['availableSlots'], 1)

    def test_tutor_dashboard_returns_upcoming_lessons_for_logged_tutor(self):
        auth_user = User.objects.create_user(
            username='dashboard-tutor',
            email='dashboard-tutor@example.com',
            password='secret123',
        )
        tutor_user = TutorUser.objects.create(
            imie='Ela',
            nazwisko='Maj',
            email='dashboard-tutor@example.com',
            haslo='sekret',
            typ='tutor',
        )
        tutor = Tutor.objects.create(
            uzytkownik=tutor_user,
            opis='Ucze spokojnie i metodycznie.',
            rating=4.9,
            followers_count=340,
        )
        tutor.przedmioty.add(
            Przedmiot.objects.create(
                nazwa='Matematyka',
                temat='Algebra',
                poziom='Szkola srednia',
            ),
            Przedmiot.objects.create(
                nazwa='Fizyka',
                temat='Mechanika',
                poziom='Studia',
            ),
        )
        Dostepnosc.objects.create(
            tutor=tutor,
            dzien_tygodnia=2,
            godzina_od=time(18, 0),
            godzina_do=time(19, 0),
        )

        self.client.force_login(auth_user)
        response = self.client.get(reverse('tutor_dashboard_data'))

        self.assertEqual(response.status_code, 200)
        payload = response.json()

        self.assertEqual(payload['profile']['name'], 'Ela Maj')
        self.assertTrue(payload['profile']['subjects'])
        self.assertTrue(payload['profile']['levels'])
        self.assertEqual(len(payload['highlights']), 4)
        self.assertTrue(payload['schedule']['rows'])
        self.assertIn('upcomingLessons', payload)

    def test_portal_posts_returns_serialized_entries(self):
        tutor_user = TutorUser.objects.create(
            imie='Ola',
            nazwisko='Maj',
            email='ola-portal@example.com',
            haslo='sekret',
            typ='tutor',
        )
        tutor = Tutor.objects.create(
            uzytkownik=tutor_user,
            followers_count=88,
            avatar_tone='mint',
        )
        tutor.przedmioty.add(
            Przedmiot.objects.create(
                nazwa='Matematyka',
                temat='Matura',
                poziom='Szkola srednia',
            )
        )
        Post.objects.create(
            tutor=tutor,
            tytul='Nowe terminy konsultacji',
            tresc='Mam jeszcze dwa miejsca w tym tygodniu.\n- wtorek 18:00\n- czwartek 19:00',
        )

        response = self.client.get(reverse('portal_posts'))

        self.assertEqual(response.status_code, 200)
        payload = response.json()

        self.assertEqual(len(payload['posts']), 1)
        self.assertEqual(payload['posts'][0]['author'], 'Ola Maj')
        self.assertEqual(payload['posts'][0]['title'], 'Nowe terminy konsultacji')
        self.assertEqual(payload['posts'][0]['avatarTone'], 'mint')
        self.assertEqual(payload['posts'][0]['tags'], ['Matematyka', 'Matura', 'Szkola srednia'])
        self.assertEqual(payload['posts'][0]['checklist'], ['wtorek 18:00', 'czwartek 19:00'])

    def test_portal_posts_create_persists_post_for_logged_tutor(self):
        auth_user = User.objects.create_user(
            username='portal-tutor',
            email='portal-tutor@example.com',
            password='secret123',
        )
        tutor_user = TutorUser.objects.create(
            imie='Ola',
            nazwisko='Tutor',
            email='portal-tutor@example.com',
            haslo='sekret',
            typ='tutor',
        )
        Tutor.objects.create(uzytkownik=tutor_user, followers_count=120)

        self.client.force_login(auth_user)
        response = self.client.post(
            reverse('portal_posts'),
            data=json.dumps(
                {
                    'title': 'Wrzucilem nowy zestaw zadan',
                    'content': 'Material jest juz gotowy do pobrania.\n- rozdzial 1\n- rozdzial 2',
                }
            ),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Post.objects.count(), 1)

        created_post = Post.objects.get()
        self.assertEqual(created_post.tytul, 'Wrzucilem nowy zestaw zadan')
        self.assertEqual(created_post.tutor.uzytkownik.email, 'portal-tutor@example.com')
        self.assertEqual(response.json()['post']['checklist'], ['rozdzial 1', 'rozdzial 2'])

    def test_portal_posts_create_rejects_non_tutor_account(self):
        auth_user = User.objects.create_user(
            username='portal-student',
            email='portal-student@example.com',
            password='secret123',
        )
        TutorUser.objects.create(
            imie='Adam',
            nazwisko='Uczen',
            email='portal-student@example.com',
            haslo='sekret',
            typ='uczen',
        )

        self.client.force_login(auth_user)
        response = self.client.post(
            reverse('portal_posts'),
            data=json.dumps(
                {
                    'title': 'Probny wpis',
                    'content': 'To konto nie powinno publikowac postow.',
                }
            ),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Post.objects.count(), 0)
        self.assertIn('korepetytora', response.json()['detail'])

    def test_portal_observations_returns_current_user_entries(self):
        auth_user = User.objects.create_user(
            username='observation-user',
            email='observation-user@example.com',
            password='secret123',
        )
        custom_user = TutorUser.objects.create(
            imie='Ola',
            nazwisko='Notatka',
            email='observation-user@example.com',
            haslo='sekret',
            typ='uczen',
        )
        tutor_user = TutorUser.objects.create(
            imie='Patryk',
            nazwisko='Tutor',
            email='patryk-tutor@example.com',
            haslo='sekret',
            typ='tutor',
        )
        tutor = Tutor.objects.create(uzytkownik=tutor_user, followers_count=1)
        Post.objects.create(
            tutor=tutor,
            tytul='Nowy wpis',
            tresc='Dostepne sa jeszcze terminy na konsultacje w tym tygodniu.',
        )
        Obserwacja.objects.create(uzytkownik=custom_user, tutor=tutor)

        self.client.force_login(auth_user)
        response = self.client.get(reverse('portal_observations'))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload['observations']), 1)
        self.assertEqual(payload['observations'][0]['id'], tutor.pk)
        self.assertEqual(payload['observations'][0]['author'], 'Patryk Tutor')
        self.assertEqual(payload['observations'][0]['followersCount'], 1)
        self.assertEqual(payload['observations'][0]['postsCount'], 1)

    def test_portal_observations_get_returns_empty_list_for_guest(self):
        response = self.client.get(reverse('portal_observations'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['observations'], [])

    def test_portal_observations_create_persists_entry(self):
        auth_user = User.objects.create_user(
            username='observation-create',
            email='observation-create@example.com',
            password='secret123',
        )
        TutorUser.objects.create(
            imie='Adam',
            nazwisko='Uczen',
            email='observation-create@example.com',
            haslo='sekret',
            typ='uczen',
        )
        tutor_user = TutorUser.objects.create(
            imie='Kasia',
            nazwisko='Mentorka',
            email='kasia-mentor@example.com',
            haslo='sekret',
            typ='tutor',
        )
        tutor = Tutor.objects.create(uzytkownik=tutor_user)

        self.client.force_login(auth_user)
        response = self.client.post(
            reverse('portal_observations'),
            data=json.dumps(
                {
                    'tutorId': tutor.pk,
                }
            ),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Obserwacja.objects.count(), 1)
        created_observation = Obserwacja.objects.get()
        self.assertEqual(created_observation.uzytkownik.email, 'observation-create@example.com')
        self.assertEqual(created_observation.tutor, tutor)
        self.assertTrue(response.json()['isFollowed'])
        self.assertEqual(response.json()['tutorId'], tutor.pk)
        self.assertEqual(response.json()['followersCount'], 1)
        self.assertEqual(response.json()['observation']['author'], 'Kasia Mentorka')

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
                poziom='Szkola srednia',
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
                poziom='Szkola srednia',
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
                'level': 'Szkola srednia',
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


class SeedTutorsCommandTests(TestCase):
    def test_seed_tutors_populates_database_and_is_idempotent(self):
        call_command('seed_tutors', verbosity=0)

        tutor_count = Tutor.objects.count()
        user_count = TutorUser.objects.count()
        subject_count = Przedmiot.objects.count()
        availability_count = Dostepnosc.objects.count()

        self.assertGreaterEqual(tutor_count, 8)
        self.assertGreaterEqual(subject_count, 8)

        response = self.client.get(
            reverse('tutor_search'),
            {
                'subject': 'Matematyka',
                'topic': 'Algebra',
                'level': 'Szkola srednia',
                'hour': '19:00-20:00',
                'date': '2026-03-11',
            },
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertGreaterEqual(len(payload['exactMatches']), 2)
        self.assertGreaterEqual(len(payload['suggestedTutors']), 1)

        call_command('seed_tutors', verbosity=0)

        self.assertEqual(Tutor.objects.count(), tutor_count)
        self.assertEqual(TutorUser.objects.count(), user_count)
        self.assertEqual(Przedmiot.objects.count(), subject_count)
        self.assertEqual(Dostepnosc.objects.count(), availability_count)
