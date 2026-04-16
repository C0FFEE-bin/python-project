from django.core.management.base import BaseCommand
from django.utils import timezone
from main.models import Notification, User, Tutor, Opinia, Obserwacja


class Command(BaseCommand):
    help = 'Tworzy podstawowe powiadomienia dla użytkowników'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=5,
            help='Liczba powiadomień do utworzenia na użytkownika',
        )

    def handle(self, *args, **options):
        count = options['count']

        # Pobierz wszystkich użytkowników
        users = User.objects.all()
        if not users.exists():
            self.stdout.write(
                self.style.WARNING('Brak użytkowników w bazie danych.')
            )
            return

        notifications_created = 0

        for user in users:
            # Twórz podstawowe powiadomienia
            notifications = [
                {
                    'message': f'Witaj {user.imie}! Dziękujemy za dołączenie do naszej platformy.',
                    'notification_type': 'welcome',
                },
                {
                    'message': 'Pamiętaj o regularnym sprawdzaniu nowych tutorów w okolicy.',
                    'notification_type': 'reminder',
                },
                {
                    'message': 'Sprawdź nowe funkcje dostępne w aplikacji.',
                    'notification_type': 'update',
                },
                {
                    'message': 'Nie zapomnij ocenić swoich tutorów po lekcji.',
                    'notification_type': 'rating_reminder',
                },
                {
                    'message': 'Masz nowe wiadomości w skrzynce odbiorczej.',
                    'notification_type': 'message',
                },
            ]

            for i in range(min(count, len(notifications))):
                notification_data = notifications[i]
                Notification.objects.get_or_create(
                    user=user,
                    message=notification_data['message'],
                    notification_type=notification_data['notification_type'],
                    defaults={
                        'is_read': False,
                        'created_at': timezone.now(),
                    }
                )
                notifications_created += 1

        # Dodatkowe powiadomienia dla tutorów na podstawie opinii
        tutors = Tutor.objects.all()
        for tutor in tutors:
            # Sprawdź, czy tutor ma nowe opinie
            recent_opinions = Opinia.objects.filter(
                tutor=tutor,
                data_dodania__gte=timezone.now() - timezone.timedelta(days=7)
            )
            if recent_opinions.exists():
                Notification.objects.get_or_create(
                    user=tutor.uzytkownik,
                    message=f'Masz {recent_opinions.count()} nową(-e) opinię(-e) od studentów.',
                    notification_type='new_review',
                    defaults={
                        'is_read': False,
                        'created_at': timezone.now(),
                    }
                )
                notifications_created += 1

        # Powiadomienia dla użytkowników obserwujących tutorów
        obserwacje = Obserwacja.objects.all()
        for obserwacja in obserwacje:
            tutor = obserwacja.tutor
            # Sprawdź, czy obserwowany tutor ma nowe posty
            recent_posts = tutor.posty.filter(
                data_utworzenia__gte=timezone.now() - timezone.timedelta(days=1)
            )
            if recent_posts.exists():
                Notification.objects.get_or_create(
                    user=obserwacja.uzytkownik,
                    message=f'{tutor.uzytkownik.imie} {tutor.uzytkownik.nazwisko} opublikował nowy post.',
                    notification_type='new_post',
                    defaults={
                        'is_read': False,
                        'created_at': timezone.now(),
                    }
                )
                notifications_created += 1

        self.stdout.write(
            self.style.SUCCESS(f'Utworzono {notifications_created} powiadomień.')
        )