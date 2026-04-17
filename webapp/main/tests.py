import os
import json
import re
from datetime import date, time
from unittest.mock import patch
from urllib.parse import urlencode

from django.contrib.auth.models import User
from django.core.management import call_command
from django.db import OperationalError
from django.http import HttpResponse
from django.test import Client
from django.test import RequestFactory
from django.test import TestCase
from django.urls import reverse

from main.middleware import DatabaseErrorPageMiddleware
from main.models import (
    Comment,
    Dostepnosc,
    LessonNote,
    Obserwacja,
    Opinia,
    Post,
    Przedmiot,
    Tutor,
    TutorConversation,
    TutorMessage,
    User as TutorUser,
)


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
        self.assertEqual(home_props['currentUser']['avatarTone'], 'slate')
        self.assertFalse(home_props['currentUser']['isTutor'])
        self.assertEqual(home_props['currentUser']['accountType'], 'uczen')
        self.assertEqual(home_props['urls']['observations'], reverse('portal_observations'))
        self.assertEqual(home_props['urls']['portalNotes'], reverse('portal_notes'))
        self.assertEqual(home_props['urls']['portalPosts'], reverse('portal_posts'))
        self.assertEqual(home_props['urls']['tutorSearch'], reverse('tutor_search'))
        self.assertEqual(home_props['urls']['tutorDashboardData'], reverse('tutor_dashboard_data'))
        self.assertEqual(home_props['urls']['tutorMessages'], reverse('tutor_messages'))
        self.assertEqual(home_props['urls']['tutorProfileSettings'], reverse('tutor_profile_settings'))

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
            f'{reverse("onboarding_account_type")}?{urlencode({"next": reverse("about")})}'
        )
        home_props = self._extract_home_props(response)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'main/pages/home/index.html')
        self.assertEqual(home_props['onboardingMode'], 'account-type')
        self.assertEqual(home_props['onboardingNextTarget'], reverse('about'))

    def test_student_onboarding_save_updates_auth_and_custom_user_names(self):
        auth_user = User.objects.create_user(
            username='student-save',
            email='student-save@example.com',
            password='secret123',
        )
        self.client.force_login(auth_user)

        response = self.client.post(
            reverse('student_onboarding_save'),
            data=json.dumps(
                {
                    'fullName': 'Anna Kowalska',
                    'schoolLevel': 'Studia',
                    'subjects': ['Matematyka'],
                    'interests': ['Programowanie'],
                }
            ),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)

        auth_user.refresh_from_db()
        custom_user = TutorUser.objects.get(username='student-save')

        self.assertEqual(auth_user.first_name, 'Anna')
        self.assertEqual(auth_user.last_name, 'Kowalska')
        self.assertEqual(custom_user.imie, 'Anna')
        self.assertEqual(custom_user.nazwisko, 'Kowalska')
        self.assertEqual(custom_user.typ, 'uczen')

    def test_student_onboarding_save_accepts_name_only_payload(self):
        auth_user = User.objects.create_user(
            username='student-name-only',
            email='student-name-only@example.com',
            password='secret123',
        )
        self.client.force_login(auth_user)

        response = self.client.post(
            reverse('student_onboarding_save'),
            data=json.dumps(
                {
                    'fullName': 'Maria Nowak',
                }
            ),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)

        auth_user.refresh_from_db()
        custom_user = TutorUser.objects.get(username='student-name-only')

        self.assertEqual(auth_user.first_name, 'Maria')
        self.assertEqual(auth_user.last_name, 'Nowak')
        self.assertEqual(custom_user.imie, 'Maria')
        self.assertEqual(custom_user.nazwisko, 'Nowak')

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
                'next': reverse('about'),
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'main/auth/register.html')
        self.assertContains(response, 'Hasla musza byc takie same.')
        self.assertContains(response, f'value="{reverse("about")}"')
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

    def test_register_creates_custom_user_without_password_field(self):
        self.client.post(
            reverse('register_user'),
            {
                'username': 'safe-user',
                'email': 'safe-user@example.com',
                'password': 'secret123',
                'password_confirm': 'secret123',
            },
        )

        custom_user = TutorUser.objects.get(email='safe-user@example.com')

        self.assertEqual(custom_user.email, 'safe-user@example.com')
        self.assertEqual(custom_user.username, 'safe-user')
        self.assertNotIn('haslo', [field.name for field in TutorUser._meta.fields])

    def test_api_register_requires_csrf_token(self):
        csrf_client = Client(enforce_csrf_checks=True)
        response = csrf_client.post(
            reverse('api_register'),
            data=json.dumps(
                {
                    'username': 'csrf-user',
                    'email': 'csrf-user@example.com',
                    'password': 'secret123',
                }
            ),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(User.objects.filter(username='csrf-user').exists())

    def test_api_register_creates_custom_user_without_password_field(self):
        response = self.client.post(
            reverse('api_register'),
            data=json.dumps(
                {
                    'username': 'api-user',
                    'email': 'api-user@example.com',
                    'password': 'secret123',
                }
            ),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        custom_user = TutorUser.objects.get(email='api-user@example.com')
        self.assertEqual(custom_user.email, 'api-user@example.com')
        self.assertEqual(custom_user.username, 'api-user')
        self.assertNotIn('haslo', [field.name for field in TutorUser._meta.fields])

    def test_home_page_resolves_custom_user_by_username(self):
        auth_user = User.objects.create_user(
            username='username-link',
            email='auth-link@example.com',
            password='secret123',
        )
        custom_user = TutorUser.objects.create(
            username='username-link',
            imie='Ewa',
            nazwisko='Tutor',
            email='custom-link@example.com',
            typ='tutor',
        )
        Tutor.objects.create(uzytkownik=custom_user)

        self.client.force_login(auth_user)
        response = self.client.get(reverse('home'))
        home_props = self._extract_home_props(response)

        self.assertTrue(home_props['currentUser']['isTutor'])
        self.assertEqual(home_props['currentUser']['accountType'], 'tutor')
        self.assertEqual(home_props['currentUser']['displayName'], 'Ewa Tutor')
        self.assertEqual(home_props['currentUser']['avatarTone'], 'slate')

    def test_login_redirects_to_safe_next_target(self):
        User.objects.create_user(username='tester', password='secret123')

        response = self.client.post(
            reverse('login_user'),
            {
                'username': 'tester',
                'password': 'secret123',
                'next': reverse('about'),
            },
        )

        self.assertRedirects(response, reverse('about'))

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
                'next': reverse('about'),
            },
        )

        expected_redirect = f'{reverse("onboarding_account_type")}?{urlencode({"next": reverse("about")})}'
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
            username='dashboard-tutor',
            imie='Ela',
            nazwisko='Maj',
            email='dashboard-tutor@example.com',
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

    def test_tutor_profile_settings_redirects_non_tutor_to_onboarding(self):
        auth_user = User.objects.create_user(
            username='student-profile',
            email='student-profile@example.com',
            password='secret123',
        )
        self.client.force_login(auth_user)

        response = self.client.get(reverse('tutor_profile_settings'))

        self.assertEqual(response.status_code, 302)
        self.assertEqual(
            response.url,
            f'{reverse("onboarding_account_type")}?{urlencode({"next": reverse("tutor_profile_settings")})}',
        )

    def test_tutor_profile_settings_updates_tutor_profile(self):
        auth_user = User.objects.create_user(
            username='edit-tutor',
            email='edit-tutor@example.com',
            password='secret123',
        )
        tutor_user = TutorUser.objects.create(
            username='edit-tutor',
            imie='Ela',
            nazwisko='Maj',
            email='edit-tutor@example.com',
            typ='tutor',
            tel_num='111222333',
        )
        tutor = Tutor.objects.create(
            uzytkownik=tutor_user,
            opis='Stary opis',
            experience_label='Nowy korepetytor',
            avatar_tone='rose',
            avatar_image_url='https://example.com/old-avatar.jpg',
            cover_image_url='https://example.com/old-cover.jpg',
            status_badges=['sprawny kontakt'],
        )
        tutor.przedmioty.add(
            Przedmiot.objects.create(
                nazwa='Matematyka',
                temat='Powtorka',
                poziom='Podstawowka',
            )
        )

        self.client.force_login(auth_user)
        response = self.client.post(
            reverse('tutor_profile_settings'),
            {
                'full_name': 'Tomasz Kowalski',
                'phone': '500600700',
                'about': 'Prowadze zajecia 1:1 i przygotowuje do matury.',
                'hourly_rate': '110',
                'age': '29',
                'experience_label': '5 lat pracy z uczniami',
                'avatar_image_url': 'https://example.com/new-avatar.jpg',
                'cover_image_url': 'https://example.com/new-cover.jpg',
                'avatar_tone': 'ocean',
                'status_badges': 'sprawny kontakt, zajecia online, matura 2026',
                'subjects': ['Matematyka', 'Fizyka'],
                'levels': ['Szkola srednia', 'Studia'],
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, reverse('tutor_profile_settings'))

        auth_user.refresh_from_db()
        tutor_user.refresh_from_db()
        tutor.refresh_from_db()

        self.assertEqual(auth_user.first_name, 'Tomasz')
        self.assertEqual(auth_user.last_name, 'Kowalski')
        self.assertEqual(tutor_user.imie, 'Tomasz')
        self.assertEqual(tutor_user.nazwisko, 'Kowalski')
        self.assertEqual(tutor_user.tel_num, '500600700')
        self.assertEqual(tutor.opis, 'Prowadze zajecia 1:1 i przygotowuje do matury.')
        self.assertEqual(float(tutor.stawka_godzinowa), 110.0)
        self.assertEqual(tutor.wiek, 29)
        self.assertEqual(tutor.experience_label, '5 lat pracy z uczniami')
        self.assertEqual(tutor.avatar_image_url, 'https://example.com/new-avatar.jpg')
        self.assertEqual(tutor.cover_image_url, 'https://example.com/new-cover.jpg')
        self.assertEqual(tutor.avatar_tone, 'rose')
        self.assertEqual(
            tutor.status_badges,
            ['sprawny kontakt'],
        )
        self.assertEqual(
            sorted(tutor.przedmioty.values_list('nazwa', 'poziom')),
            [
                ('Matematyka', 'Podstawowka'),
            ],
        )

    def test_tutor_profile_returns_reviews_list(self):
        auth_user = User.objects.create_user(
            username='review-viewer',
            email='review-viewer@example.com',
            password='secret123',
        )
        reviewer = TutorUser.objects.create(
            username='review-viewer',
            imie='Anna',
            nazwisko='Student',
            email='review-viewer@example.com',
            typ='uczen',
        )
        tutor_user = TutorUser.objects.create(
            username='reviewed-profile',
            imie='Michal',
            nazwisko='Tutor',
            email='reviewed-profile@example.com',
            typ='tutor',
        )
        tutor = Tutor.objects.create(uzytkownik=tutor_user, rating=4.0)
        Opinia.objects.create(
            autor=reviewer,
            tutor=tutor,
            rating=5,
            tresc='Super prowadzone zajecia i szybki kontakt po kazdym spotkaniu.',
        )

        self.client.force_login(auth_user)
        response = self.client.get(reverse('tutor_profile', kwargs={'tutor_id': tutor.pk}))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload['canReview'])
        self.assertEqual(len(payload['reviews']), 1)
        self.assertEqual(payload['reviews'][0]['author'], 'Anna Student')
        self.assertTrue(payload['reviews'][0]['isOwn'])
        self.assertEqual(payload['review']['author'], 'Anna Student')

    def test_tutor_reviews_create_persists_review_and_updates_rating(self):
        auth_user = User.objects.create_user(
            username='review-author',
            email='review-author@example.com',
            password='secret123',
        )
        author = TutorUser.objects.create(
            username='review-author',
            imie='Piotr',
            nazwisko='Uczen',
            email='review-author@example.com',
            typ='uczen',
        )
        tutor_user = TutorUser.objects.create(
            username='rated-tutor',
            imie='Kasia',
            nazwisko='Mentorka',
            email='rated-tutor@example.com',
            typ='tutor',
        )
        tutor = Tutor.objects.create(uzytkownik=tutor_user, rating=0)

        self.client.force_login(auth_user)
        response = self.client.post(
            reverse('tutor_reviews'),
            data=json.dumps(
                {
                    'tutorId': tutor.pk,
                    'rating': 4,
                    'content': 'Bardzo konkretne zajecia i duzo przydatnych wskazowek do nauki.',
                }
            ),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Opinia.objects.count(), 1)
        review = Opinia.objects.get()
        tutor.refresh_from_db()
        payload = response.json()

        self.assertEqual(review.autor, author)
        self.assertEqual(review.tutor, tutor)
        self.assertEqual(float(tutor.rating), 4.0)
        self.assertEqual(payload['opinions'], 1)
        self.assertEqual(payload['rating'], 4.0)
        self.assertEqual(payload['reviews'][0]['author'], 'Piotr Uczen')

    def test_tutor_reviews_reject_own_profile(self):
        auth_user = User.objects.create_user(
            username='self-review',
            email='self-review@example.com',
            password='secret123',
        )
        tutor_user = TutorUser.objects.create(
            username='self-review',
            imie='Ola',
            nazwisko='Tutor',
            email='self-review@example.com',
            typ='tutor',
        )
        tutor = Tutor.objects.create(uzytkownik=tutor_user, rating=0)

        self.client.force_login(auth_user)
        response = self.client.post(
            reverse('tutor_reviews'),
            data=json.dumps(
                {
                    'tutorId': tutor.pk,
                    'rating': 5,
                    'content': 'To nie powinno przejsc dla wlasnego profilu.',
                }
            ),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Opinia.objects.count(), 0)

    def test_tutor_messages_redirects_non_tutor_to_onboarding(self):
        auth_user = User.objects.create_user(
            username='student-messages',
            email='student-messages@example.com',
            password='secret123',
        )
        self.client.force_login(auth_user)

        response = self.client.get(reverse('tutor_messages'))

        self.assertEqual(response.status_code, 302)
        self.assertEqual(
            response.url,
            f'{reverse("onboarding_account_type")}?{urlencode({"next": reverse("tutor_messages")})}',
        )

    def test_tutor_messages_creates_conversation_and_message(self):
        auth_user = User.objects.create_user(
            username='message-tutor',
            email='message-tutor@example.com',
            password='secret123',
        )
        tutor_user = TutorUser.objects.create(
            username='message-tutor',
            imie='Alicja',
            nazwisko='Nowak',
            email='message-tutor@example.com',
            typ='tutor',
        )
        tutor = Tutor.objects.create(uzytkownik=tutor_user, followers_count=1)
        student = TutorUser.objects.create(
            username='student-thread',
            imie='Jan',
            nazwisko='Uczen',
            email='student-thread@example.com',
            typ='uczen',
        )
        Obserwacja.objects.create(uzytkownik=student, tutor=tutor)

        self.client.force_login(auth_user)
        response = self.client.post(
            reverse('tutor_messages'),
            {
                'action': 'start',
                'student_id': str(student.pk),
                'body': 'Czesc, widze ze obserwujesz moj profil. Ustalmy pierwszy termin.',
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertTrue(response.url.startswith(reverse('tutor_messages')))
        self.assertEqual(TutorConversation.objects.count(), 1)
        self.assertEqual(TutorMessage.objects.count(), 1)

        conversation = TutorConversation.objects.get()
        message = TutorMessage.objects.get()

        self.assertEqual(conversation.tutor, tutor)
        self.assertEqual(conversation.student, student)
        self.assertEqual(message.conversation, conversation)
        self.assertEqual(message.sender, tutor_user)
        self.assertIn('Ustalmy pierwszy termin', message.body)

    def test_tutor_messages_page_renders_existing_thread(self):
        auth_user = User.objects.create_user(
            username='thread-tutor',
            email='thread-tutor@example.com',
            password='secret123',
        )
        tutor_user = TutorUser.objects.create(
            username='thread-tutor',
            imie='Karol',
            nazwisko='Tutor',
            email='thread-tutor@example.com',
            typ='tutor',
        )
        tutor = Tutor.objects.create(uzytkownik=tutor_user, followers_count=1)
        student = TutorUser.objects.create(
            username='ola-student',
            imie='Ola',
            nazwisko='Student',
            email='ola-student@example.com',
            typ='uczen',
        )
        Obserwacja.objects.create(uzytkownik=student, tutor=tutor)
        conversation = TutorConversation.objects.create(tutor=tutor, student=student)
        TutorMessage.objects.create(
            conversation=conversation,
            sender=tutor_user,
            body='Pierwsza wiadomosc do ucznia.',
        )

        self.client.force_login(auth_user)
        response = self.client.get(
            f'{reverse("tutor_messages")}?{urlencode({"conversation": conversation.pk})}'
        )

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'main/pages/tutor_messages/index.html')
        self.assertContains(response, 'Aktywne rozmowy')
        self.assertContains(response, 'Ola Student')
        self.assertContains(response, 'Pierwsza wiadomosc do ucznia.')

    def test_tutor_booking_request_creates_conversation_and_message(self):
        auth_user = User.objects.create_user(
            username='student-booking',
            email='student-booking@example.com',
            password='secret123',
        )
        student_user = TutorUser.objects.create(
            username='student-booking',
            imie='Jan',
            nazwisko='Uczen',
            email='student-booking@example.com',
            typ='uczen',
        )
        tutor_user = TutorUser.objects.create(
            username='booking-tutor',
            imie='Alicja',
            nazwisko='Nowak',
            email='booking-tutor@example.com',
            typ='tutor',
        )
        tutor = Tutor.objects.create(uzytkownik=tutor_user, followers_count=4)
        Dostepnosc.objects.create(
            tutor=tutor,
            dzien_tygodnia=2,
            godzina_od=time(19, 0),
            godzina_do=time(20, 0),
            data=date(2026, 3, 11),
        )

        self.client.force_login(auth_user)
        response = self.client.post(
            reverse('tutor_booking_request'),
            data=json.dumps(
                {
                    'tutorId': tutor.pk,
                    'subject': 'Matematyka',
                    'date': '2026-03-11',
                    'timeLabel': '19:00-20:00',
                    'message': 'Chce omowic material do matury rozszerzonej.',
                }
            ),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(TutorConversation.objects.count(), 1)
        self.assertEqual(TutorMessage.objects.count(), 1)

        conversation = TutorConversation.objects.get()
        message = TutorMessage.objects.get()

        self.assertEqual(conversation.tutor, tutor)
        self.assertEqual(conversation.student, student_user)
        self.assertEqual(message.conversation, conversation)
        self.assertEqual(message.sender, student_user)
        self.assertIn('Przedmiot: Matematyka', message.body)
        self.assertIn('Data: 2026-03-11', message.body)
        self.assertIn('Godzina: 19:00-20:00', message.body)
        self.assertIn('matury rozszerzonej', message.body)

    def test_tutor_booking_request_requires_authentication(self):
        tutor_user = TutorUser.objects.create(
            username='booking-tutor-guest',
            imie='Alicja',
            nazwisko='Nowak',
            email='booking-tutor-guest@example.com',
            typ='tutor',
        )
        tutor = Tutor.objects.create(uzytkownik=tutor_user)

        response = self.client.post(
            reverse('tutor_booking_request'),
            data=json.dumps(
                {
                    'tutorId': tutor.pk,
                    'subject': 'Matematyka',
                    'date': '2026-03-11',
                    'timeLabel': '19:00-20:00',
                }
            ),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(TutorConversation.objects.count(), 0)
        self.assertEqual(TutorMessage.objects.count(), 0)

    def test_tutor_booking_request_rejects_unavailable_slot(self):
        auth_user = User.objects.create_user(
            username='student-booking-mismatch',
            email='student-booking-mismatch@example.com',
            password='secret123',
        )
        TutorUser.objects.create(
            username='student-booking-mismatch',
            imie='Jan',
            nazwisko='Uczen',
            email='student-booking-mismatch@example.com',
            typ='uczen',
        )
        tutor_user = TutorUser.objects.create(
            username='booking-slot-check',
            imie='Alicja',
            nazwisko='Nowak',
            email='booking-slot-check@example.com',
            typ='tutor',
        )
        tutor = Tutor.objects.create(uzytkownik=tutor_user)
        Dostepnosc.objects.create(
            tutor=tutor,
            dzien_tygodnia=2,
            godzina_od=time(18, 0),
            godzina_do=time(19, 0),
            data=date(2026, 3, 11),
        )

        self.client.force_login(auth_user)
        response = self.client.post(
            reverse('tutor_booking_request'),
            data=json.dumps(
                {
                    'tutorId': tutor.pk,
                    'subject': 'Matematyka',
                    'date': '2026-03-11',
                    'timeLabel': '19:00-20:00',
                }
            ),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('nie jest juz dostepny', response.json()['detail'])
        self.assertEqual(TutorConversation.objects.count(), 0)
        self.assertEqual(TutorMessage.objects.count(), 0)

    def test_portal_posts_returns_serialized_entries(self):
        tutor_user = TutorUser.objects.create(
            username='ola-portal',
            imie='Ola',
            nazwisko='Maj',
            email='ola-portal@example.com',
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
        self.assertEqual(payload['posts'][0]['comments'], [])
        self.assertEqual(payload['posts'][0]['commentsCount'], 0)
        self.assertFalse(payload['posts'][0]['canComment'])

    def test_portal_posts_marks_comments_available_for_logged_user_without_custom_profile(self):
        auth_user = User.objects.create_user(
            username='portal-reader',
            email='portal-reader@example.com',
            password='secret123',
        )
        tutor_user = TutorUser.objects.create(
            username='portal-post-author',
            imie='Ola',
            nazwisko='Tutor',
            email='portal-post-author@example.com',
            typ='tutor',
        )
        tutor = Tutor.objects.create(uzytkownik=tutor_user, followers_count=14)
        Post.objects.create(
            tutor=tutor,
            tytul='Material do powtorki',
            tresc='Wrzucilem kolejne zadania do przepracowania przed zajeciami.',
        )

        self.client.force_login(auth_user)
        response = self.client.get(reverse('portal_posts'))

        self.assertEqual(response.status_code, 200)
        payload = response.json()

        self.assertEqual(len(payload['posts']), 1)
        self.assertTrue(payload['posts'][0]['canComment'])
        self.assertTrue(TutorUser.objects.filter(username='portal-reader').exists())

    def test_portal_posts_create_persists_post_for_logged_tutor(self):
        auth_user = User.objects.create_user(
            username='portal-tutor',
            email='portal-tutor@example.com',
            password='secret123',
        )
        tutor_user = TutorUser.objects.create(
            username='portal-tutor',
            imie='Ola',
            nazwisko='Tutor',
            email='portal-tutor@example.com',
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
            username='portal-student',
            imie='Adam',
            nazwisko='Uczen',
            email='portal-student@example.com',
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

    def test_portal_post_comments_create_persists_comment_for_logged_user(self):
        auth_user = User.objects.create_user(
            username='portal-comment',
            email='portal-comment@example.com',
            password='secret123',
        )
        commenting_user = TutorUser.objects.create(
            username='portal-comment',
            imie='Maja',
            nazwisko='Komentuje',
            email='portal-comment@example.com',
            typ='uczen',
        )
        tutor_user = TutorUser.objects.create(
            username='commented-tutor',
            imie='Olga',
            nazwisko='Tutor',
            email='commented-tutor@example.com',
            typ='tutor',
        )
        tutor = Tutor.objects.create(uzytkownik=tutor_user, followers_count=5)
        post = Post.objects.create(
            tutor=tutor,
            tytul='Nowe materialy do powtorki',
            tresc='Wrzucilem dzisiaj zestaw zadan i odpowiedzi do wspolnej analizy.',
        )

        self.client.force_login(auth_user)
        response = self.client.post(
            reverse('portal_post_comments'),
            data=json.dumps(
                {
                    'postId': post.pk,
                    'content': 'Dzieki, to bardzo pomaga przed kolokwium.',
                }
            ),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Comment.objects.count(), 1)
        created_comment = Comment.objects.get()
        payload = response.json()

        self.assertEqual(created_comment.post, post)
        self.assertEqual(created_comment.uzytkownik, commenting_user)
        self.assertEqual(payload['postId'], post.pk)
        self.assertEqual(payload['commentsCount'], 1)
        self.assertEqual(payload['comment']['author'], 'Maja Komentuje')
        self.assertEqual(payload['comments'][0]['content'], 'Dzieki, to bardzo pomaga przed kolokwium.')
        self.assertTrue(payload['comments'][0]['isOwn'])

    def test_portal_notes_returns_current_user_entries(self):
        auth_user = User.objects.create_user(
            username='notes-reader',
            email='notes-reader@example.com',
            password='secret123',
        )
        note_owner = TutorUser.objects.create(
            username='notes-reader',
            imie='Ala',
            nazwisko='Uczen',
            email='notes-reader@example.com',
            typ='uczen',
        )
        other_user = TutorUser.objects.create(
            username='notes-other',
            imie='Ola',
            nazwisko='Student',
            email='notes-other@example.com',
            typ='uczen',
        )
        LessonNote.objects.create(
            user=other_user,
            subject='Fizyka',
            title='Obca notatka',
            content='Ta notatka nie powinna trafic do zalogowanego uzytkownika.',
            tags=['obca'],
        )
        LessonNote.objects.create(
            user=note_owner,
            subject='Matematyka',
            title='Wlasna notatka',
            content='Najpierw policz delte, potem miejsca zerowe i sprawdz os symetrii.',
            tags=['matura', 'algebra'],
        )

        self.client.force_login(auth_user)
        response = self.client.get(reverse('portal_notes'))

        self.assertEqual(response.status_code, 200)
        payload = response.json()

        self.assertEqual(len(payload['notes']), 1)
        self.assertEqual(payload['notes'][0]['subject'], 'Matematyka')
        self.assertEqual(payload['notes'][0]['title'], 'Wlasna notatka')
        self.assertEqual(payload['notes'][0]['tags'], ['matura', 'algebra'])
        self.assertIn('Najpierw policz delte', payload['notes'][0]['excerpt'])

    def test_portal_notes_create_persists_note_for_logged_user_without_custom_profile(self):
        auth_user = User.objects.create_user(
            username='notes-create',
            email='notes-create@example.com',
            password='secret123',
        )

        self.client.force_login(auth_user)
        response = self.client.post(
            reverse('portal_notes'),
            data=json.dumps(
                {
                    'subject': 'Chemia',
                    'title': 'Stechiometria przed kartkowka',
                    'content': 'Rozdziel mase, liczbe moli i wynik koncowy w trzech oddzielnych krokach.',
                    'tags': ['obliczenia', 'powtorka'],
                }
            ),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(LessonNote.objects.count(), 1)

        note = LessonNote.objects.get()
        self.assertEqual(note.subject, 'Chemia')
        self.assertEqual(note.title, 'Stechiometria przed kartkowka')
        self.assertEqual(note.tags, ['obliczenia', 'powtorka'])
        self.assertEqual(note.user.username, 'notes-create')
        self.assertTrue(TutorUser.objects.filter(username='notes-create').exists())
        self.assertEqual(response.json()['note']['title'], 'Stechiometria przed kartkowka')

    def test_portal_notes_update_updates_owned_note(self):
        auth_user = User.objects.create_user(
            username='notes-update',
            email='notes-update@example.com',
            password='secret123',
        )
        note_owner = TutorUser.objects.create(
            username='notes-update',
            imie='Jan',
            nazwisko='Uczen',
            email='notes-update@example.com',
            typ='uczen',
        )
        note = LessonNote.objects.create(
            user=note_owner,
            subject='Historia',
            title='Pierwsza wersja',
            content='Krotka wersja notatki do poprawy przed kolejnymi zajeciami.',
            tags=['esej'],
        )

        self.client.force_login(auth_user)
        response = self.client.post(
            reverse('portal_notes'),
            data=json.dumps(
                {
                    'noteId': note.pk,
                    'subject': 'Historia',
                    'title': 'Plan odpowiedzi rozszerzonej',
                    'content': 'Najpierw zapisz teze, potem dwa argumenty z data i na koncu dopisz skutek.',
                    'tags': ['matura', 'esej'],
                }
            ),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        note.refresh_from_db()

        self.assertEqual(note.title, 'Plan odpowiedzi rozszerzonej')
        self.assertEqual(note.tags, ['matura', 'esej'])
        self.assertIn('Najpierw zapisz teze', note.content)

    def test_portal_observations_returns_current_user_entries(self):
        auth_user = User.objects.create_user(
            username='observation-user',
            email='observation-user@example.com',
            password='secret123',
        )
        custom_user = TutorUser.objects.create(
            username='observation-user',
            imie='Ola',
            nazwisko='Notatka',
            email='observation-user@example.com',
            typ='uczen',
        )
        tutor_user = TutorUser.objects.create(
            username='patryk-tutor',
            imie='Patryk',
            nazwisko='Tutor',
            email='patryk-tutor@example.com',
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
            username='observation-create',
            imie='Adam',
            nazwisko='Uczen',
            email='observation-create@example.com',
            typ='uczen',
        )
        tutor_user = TutorUser.objects.create(
            username='kasia-mentor',
            imie='Kasia',
            nazwisko='Mentorka',
            email='kasia-mentor@example.com',
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
            username='jan',
            imie='Jan',
            nazwisko='Kowalski',
            email='jan@example.com',
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
            username='anna',
            imie='Anna',
            nazwisko='Nowak',
            email='anna@example.com',
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

    def test_tutor_search_requires_matching_topic_for_exact_match(self):
        tutor_user = TutorUser.objects.create(
            username='topic-mismatch',
            imie='Jan',
            nazwisko='Kowalski',
            email='topic-mismatch@example.com',
        )
        tutor = Tutor.objects.create(
            uzytkownik=tutor_user,
            stawka_godzinowa='120.00',
            rating=4.8,
        )
        tutor.przedmioty.add(
            Przedmiot.objects.create(
                nazwa='Matematyka',
                temat='Geometria',
                poziom='Szkola srednia',
            )
        )
        Dostepnosc.objects.create(
            tutor=tutor,
            dzien_tygodnia=2,
            godzina_od=time(19, 0),
            godzina_do=time(20, 0),
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

        self.assertEqual(payload['exactMatches'], [])
        self.assertEqual(len(payload['suggestedTutors']), 1)
        self.assertEqual(payload['suggestedTutors'][0]['name'], 'Jan Kowalski')

    def test_tutor_search_returns_fallback_suggestions_when_exact_match_is_missing(self):
        tutor_user = TutorUser.objects.create(
            username='piotr',
            imie='Piotr',
            nazwisko='Mazur',
            email='piotr@example.com',
        )
        fallback_tutor = Tutor.objects.create(
            uzytkownik=tutor_user,
            stawka_godzinowa='85.00',
            rating=4.2,
        )
        fallback_tutor.przedmioty.add(
            Przedmiot.objects.create(
                nazwa='Matematyka',
                temat='Geometria',
                poziom='Studia',
            )
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

        self.assertEqual(payload['exactMatches'], [])
        self.assertEqual(len(payload['suggestedTutors']), 1)
        self.assertEqual(payload['suggestedTutors'][0]['name'], 'Piotr Mazur')

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

    def test_seed_tutors_keep_passwords_only_in_auth_model(self):
        with patch.dict(os.environ, {'SEED_TUTOR_PASSWORD': 'Tutor123!'}):
            call_command('seed_tutors', verbosity=0)

        auth_user = User.objects.get(username='lukasz-gamon')
        seeded_tutor = TutorUser.objects.get(email='lukasz-gamon@rentnerd.local')
        seeded_reviewer = TutorUser.objects.get(email='reviewer1@rentnerd.local')

        self.assertTrue(auth_user.check_password('Tutor123!'))
        self.assertEqual(seeded_tutor.email, 'lukasz-gamon@rentnerd.local')
        self.assertEqual(seeded_tutor.username, 'lukasz-gamon')
        self.assertEqual(seeded_reviewer.email, 'reviewer1@rentnerd.local')
        self.assertEqual(seeded_reviewer.username, 'reviewer1')
        self.assertNotIn('haslo', [field.name for field in TutorUser._meta.fields])

    def test_seed_tutors_uses_unusable_auth_password_without_env_override(self):
        with patch.dict(os.environ, {'SEED_TUTOR_PASSWORD': ''}):
            call_command('seed_tutors', verbosity=0)

        auth_user = User.objects.get(username='lukasz-gamon')

        self.assertFalse(auth_user.has_usable_password())
        self.assertNotIn('haslo', [field.name for field in TutorUser._meta.fields])
