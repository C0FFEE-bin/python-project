from django.db import models
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

class User(models.Model):
    imie = models.CharField(max_length=50)
    nazwisko = models.CharField(max_length=50)
    email = models.EmailField(unique=True, max_length=120)
    tel_num = models.CharField(max_length=20, blank=True, null=True)
    typ = models.CharField(max_length=20, default="uczen")
    data_utworzenia = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user"

    def __str__(self):
        return f"{self.imie} {self.nazwisko}"

class Przedmiot(models.Model):
    nazwa = models.CharField(max_length=100)
    temat = models.CharField(max_length=100, blank=True, null=True)
    poziom = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "przedmiot"

    def __str__(self):
        details = [self.nazwa]
        if self.temat:
            details.append(self.temat)
        if self.poziom:
            details.append(self.poziom)
        return " / ".join(details)

class Tutor(models.Model):
    uzytkownik = models.OneToOneField(User, on_delete=models.CASCADE, related_name="tutor_profile")
    opis = models.TextField(blank=True, null=True)
    stawka_godzinowa = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    przedmioty = models.ManyToManyField(Przedmiot, related_name="tutorzy", db_table="tutor_przedmiot")
    rating = models.FloatField(blank=True, null=True, default=0)
    slug = models.SlugField(max_length=120, unique=True, blank=True, null=True)
    avatar_tone = models.CharField(max_length=30, blank=True, null=True, default="slate")
    wiek = models.PositiveIntegerField(blank=True, null=True)
    followers_count = models.PositiveIntegerField(default=0)
    experience_label = models.CharField(max_length=120, blank=True, null=True)
    status_badges = models.JSONField(blank=True, default=list)

    class Meta:
        db_table = "tutor"

    def __str__(self):
        return f"Tutor: {self.uzytkownik.imie} {self.uzytkownik.nazwisko}"

class Dostepnosc(models.Model):
    tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE, related_name="dostepnosci")
    dzien_tygodnia = models.IntegerField()
    godzina_od = models.TimeField()
    godzina_do = models.TimeField()
    data = models.DateField(blank=True, null=True)

    class Meta:
        db_table = "dostepnosc"

    def __str__(self):
        return f"{self.tutor} - dzien {self.dzien_tygodnia} ({self.godzina_od} - {self.godzina_do})"

class Post(models.Model):
    tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE, related_name="posty")
    tytul = models.CharField(max_length=200)
    tresc = models.TextField()
    data_utworzenia = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "post"

    def __str__(self):
        return self.tytul

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="komentarze")
    uzytkownik = models.ForeignKey(User, on_delete=models.CASCADE, related_name="komentarze_uzytkownika")
    tresc = models.TextField()
    data_utworzenia = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "comment"

    def __str__(self):
        return f"Komentarz od {self.uzytkownik.imie} do posta {self.post.id}"


class Obserwacja(models.Model):
    uzytkownik = models.ForeignKey(User, on_delete=models.CASCADE, related_name="obserwacje")
    tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE, related_name="obserwacje")
    data_utworzenia = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "obserwacja"
        constraints = [
            models.UniqueConstraint(
                fields=["uzytkownik", "tutor"],
                name="unique_tutor_observation_per_user",
            ),
        ]

    def __str__(self):
        return f"{self.uzytkownik} obserwuje {self.tutor}"


class TutorConversation(models.Model):
    tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE, related_name="conversations")
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tutor_conversations")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tutor_conversation"
        ordering = ["-updated_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["tutor", "student"],
                name="unique_tutor_conversation_per_student",
            ),
        ]

    def __str__(self):
        return f"Rozmowa {self.tutor} z {self.student}"


class TutorMessage(models.Model):
    conversation = models.ForeignKey(
        TutorConversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_tutor_messages")
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "tutor_message"
        ordering = ["created_at", "id"]

    def __str__(self):
        return f"Wiadomosc {self.sender} @ {self.created_at:%Y-%m-%d %H:%M}"


class Opinia(models.Model):
    autor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='opinie_od')
    tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE, related_name='opinie_dla')
    rating = models.FloatField()
    tresc = models.TextField()
    data_dodania = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "opinia"

    def __str__(self):
        return f"Opinia ({self.rating}) od {self.autor.imie} dla {self.tutor.uzytkownik.imie}"



@receiver(post_delete, sender='auth.User')
def delete_custom_user(sender, instance, **kwargs):
    if instance.email:
        User.objects.filter(email__iexact=instance.email).delete()

@receiver(post_delete, sender=User)
def delete_auth_user(sender, instance, **kwargs):
    from django.contrib.auth.models import User as AuthUser
    if instance.email:
        AuthUser.objects.filter(email__iexact=instance.email).delete()

@receiver(post_save, sender='auth.User')
def sync_user_email(sender, instance, created, **kwargs):
    if not created and instance.email:
        User.objects.filter(imie=instance.username).update(email=instance.email)

"""
import logging
from datetime import time
from django.db.models import Q, Avg, Count
from django.core.exceptions import ValidationError

# Inicjalizacja loggera dla śledzenia procesów dopasowania
logger = logging.getLogger(__name__)

def match_tutors_to_student_advanced(student_data, criteria=None):

    #Analizuje dostępność, kompetencje przedmiotowe oraz rankingi korepetytorów.
    
    #Args:
    #    student_data (dict): Zawiera 'availability' oraz 'subjects'.
    #    criteria (dict): Opcjonalne filtry (min_rating, max_price, level).
    
    if not student_data or 'availability' not in student_data:
        logger.warning("Próba dopasowania bez danych o dostępności.")
        return Tutor.objects.none()

    queryset = Tutor.objects.filter(is_active=True, profile_completed=True)

    time_query = Q()
    try:
        for slot in student_data.get('availability', []):
            # Walidacja poprawności formatu godzin
            dzien = slot.get('dzien')
            od = slot.get('godzina_od')
            do = slot.get('godzina_do')

            if all([dzien, od, do]):
                time_query |= Q(
                    dostepnosci__dzien_tygodnia=dzien,
                    dostepnosci__godzina_od__lte=od,
                    dostepnosci__godzina_do__gte=do,
                    dostepnosci__is_booked=False  # Uwzględniamy tylko wolne sloty
                )
        
        queryset = queryset.filter(time_query)
    except Exception as e:
        logger.error(f"Błąd podczas parsowania grafiku: {e}")
        return Tutor.objects.none()

    subjects = student_data.get('subjects', [])
    if subjects:
        queryset = queryset.filter(specializations__subject__name__in=subjects)

    if criteria:
        if 'min_rating' in criteria:
            # Agregacja ocen w locie
            queryset = queryset.annotate(avg_rating=Avg('reviews__rating')) \
                               .filter(avg_rating__gte=criteria['min_rating'])
        
        if 'max_price' in criteria:
            queryset = queryset.filter(hourly_rate__lte=criteria['max_price'])

        if 'level' in criteria:
            # Filtrowanie po poziomie nauczania (np. 'Liceum', 'Studia')
            queryset = queryset.filter(levels__name=criteria['level'])

    queryset = queryset.select_related('user').prefetch_related(
        'dostepnosci', 
        'specializations',
        'reviews'
    ).distinct()

    queryset = queryset.order_by('-is_promoted', '-avg_rating')

    logger.info(f"Znaleziono {queryset.count()} pasujących korepetytorów.")
    return queryset


def calculate_match_score(tutor, student_requirements):

    #Funkcja pomocnicza do wyliczania % dopasowania (Scoring Algorithm).
    #Może być użyta do sortowania wyników na froncie.

    score = 0
    
    return min(score, 100)
"""




