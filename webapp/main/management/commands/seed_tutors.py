import os
from datetime import datetime
from decimal import Decimal

from django.contrib.auth.models import User as AuthUser
from django.core.management.base import BaseCommand
from django.db import transaction

from main.models import Dostepnosc, Opinia, Przedmiot, Tutor, User

DEFAULT_RATE = Decimal("95.00")

SEED_TUTORS = [
    {
        "id": "lukasz-gamon",
        "avatarTone": "violet",
        "name": "Lukasz Gamon",
        "age": 21,
        "rating": 4.5,
        "opinions": 56,
        "experience": "2 lata doswiadczenia",
        "statusBadges": ["sprawny kontakt", "wolne terminy"],
        "subjects": ["Matematyka", "Fizyka", "Informatyka"],
        "topics": ["Algebra", "Mechanika", "Matura"],
        "levels": ["Szkola srednia"],
        "hours": ["18:00-19:00", "19:00-20:00"],
        "availableDates": ["2026-03-11", "2026-03-13"],
    },
    {
        "id": "aleksandra-gawron",
        "avatarTone": "stone",
        "name": "Aleksandra Gawron",
        "age": 38,
        "rating": 5.0,
        "opinions": 6,
        "experience": "pol roku doswiadczenia",
        "statusBadges": ["sprawny kontakt", "wolne terminy"],
        "subjects": ["Matematyka", "Fizyka"],
        "topics": ["Algebra", "Powtorka"],
        "levels": ["Szkola srednia", "Podstawowka"],
        "hours": ["19:00-20:00"],
        "availableDates": ["2026-03-11", "2026-03-12"],
    },
    {
        "id": "sebastian-kowalski",
        "avatarTone": "gold",
        "name": "Sebastian Kowalski",
        "age": 31,
        "rating": 4.8,
        "opinions": 32,
        "experience": "6 lat doswiadczenia",
        "statusBadges": ["sprawny kontakt", "wolne terminy", "nauczyciel"],
        "subjects": ["Matematyka", "Fizyka"],
        "topics": ["Algebra", "Matura"],
        "levels": ["Szkola srednia", "Studia"],
        "hours": ["19:00-20:00", "20:00-21:00"],
        "availableDates": ["2026-03-11", "2026-03-14"],
    },
    {
        "id": "tomasz-swiety",
        "avatarTone": "slate",
        "name": "Tomasz Swiety",
        "age": 51,
        "rating": 4.7,
        "opinions": 103,
        "experience": "2 lata doswiadczenia",
        "statusBadges": ["sprawny kontakt", "nauczyciel"],
        "subjects": ["Matematyka"],
        "topics": ["Matura", "Powtorka"],
        "levels": ["Podstawowka", "Szkola srednia"],
        "hours": ["17:00-18:00", "18:00-19:00"],
        "availableDates": ["2026-03-11", "2026-03-12"],
    },
    {
        "id": "julia-serwan",
        "avatarTone": "rose",
        "name": "Julia Serwan",
        "age": 22,
        "rating": 5.0,
        "opinions": 5,
        "experience": "nowy korepetytor",
        "statusBadges": ["sprawny kontakt", "wolne terminy"],
        "subjects": ["Matematyka", "Fizyka"],
        "topics": ["Algebra", "Powtorka"],
        "levels": ["Szkola srednia"],
        "hours": ["18:00-19:00", "20:00-21:00"],
        "availableDates": ["2026-03-11", "2026-03-15"],
    },
    {
        "id": "natalia-pawlak",
        "avatarTone": "mint",
        "name": "Natalia Pawlak",
        "age": 29,
        "rating": 4.9,
        "opinions": 18,
        "experience": "4 lata doswiadczenia",
        "statusBadges": ["sprawny kontakt", "wolne terminy"],
        "subjects": ["Matematyka", "Chemia"],
        "topics": ["Algebra", "Matura"],
        "levels": ["Szkola srednia", "Studia"],
        "hours": ["19:00-20:00"],
        "availableDates": ["2026-03-14", "2026-03-15"],
    },
    {
        "id": "jakub-morek",
        "avatarTone": "ocean",
        "name": "Jakub Morek",
        "age": 26,
        "rating": 4.7,
        "opinions": 41,
        "experience": "3 lata doswiadczenia",
        "statusBadges": ["sprawny kontakt", "wolne terminy"],
        "subjects": ["Matematyka", "Informatyka"],
        "topics": ["Algebra", "Powtorka"],
        "levels": ["Szkola srednia"],
        "hours": ["20:00-21:00"],
        "availableDates": ["2026-03-11", "2026-03-16"],
    },
    {
        "id": "klaudia-nowak",
        "avatarTone": "coral",
        "name": "Klaudia Nowak",
        "age": 33,
        "rating": 4.9,
        "opinions": 24,
        "experience": "5 lat doswiadczenia",
        "statusBadges": ["sprawny kontakt", "wolne terminy"],
        "subjects": ["Chemia", "Biologia"],
        "topics": ["Matura", "Powtorka"],
        "levels": ["Szkola srednia", "Studia"],
        "hours": ["19:00-20:00"],
        "availableDates": ["2026-03-11", "2026-03-13"],
    },
    {
        "id": "oskar-madej",
        "avatarTone": "indigo",
        "name": "Oskar Madej",
        "age": 27,
        "rating": 4.8,
        "opinions": 27,
        "experience": "4 lata doswiadczenia",
        "statusBadges": ["sprawny kontakt", "wolne terminy", "nauczyciel"],
        "subjects": ["Fizyka", "Informatyka"],
        "topics": ["Mechanika", "Algebra"],
        "levels": ["Szkola srednia", "Studia"],
        "hours": ["19:00-20:00", "20:00-21:00"],
        "availableDates": ["2026-03-11", "2026-03-12"],
    },
    {
        "id": "monika-zielinska",
        "avatarTone": "forest",
        "name": "Monika Zielinska",
        "age": 35,
        "rating": 4.9,
        "opinions": 42,
        "experience": "7 lat doswiadczenia",
        "statusBadges": ["sprawny kontakt", "wolne terminy"],
        "subjects": ["Biologia", "Chemia"],
        "topics": ["Matura", "Powtorka"],
        "levels": ["Szkola srednia", "Studia"],
        "hours": ["18:00-19:00", "19:00-20:00"],
        "availableDates": ["2026-03-11", "2026-03-14"],
    },
]

REVIEW_MESSAGES = [
    "Zajecia byly bardzo konkretne i dobrze przygotowane.",
    "Duza cierpliwosc i dobry kontakt, polecam.",
    "Tempo bylo dopasowane do mnie, widac efekty.",
    "Swietne tlumaczenie krok po kroku.",
    "Bardzo pomocne spotkania przed sprawdzianem.",
]


def _parse_time(value):
    return datetime.strptime(value, "%H:%M").time()


def _parse_date(value):
    return datetime.strptime(value, "%Y-%m-%d").date()


def _split_name(full_name):
    parts = full_name.split(" ", 1)
    first_name = parts[0]
    last_name = parts[1] if len(parts) > 1 else ""
    return first_name, last_name


def _tutor_email(seed_id):
    return f"{seed_id}@rentnerd.local"


def _rate_for_index(index):
    return DEFAULT_RATE + Decimal(index * 4)


def _get_seed_password():
    return (os.environ.get("SEED_TUTOR_PASSWORD") or "").strip()


def _build_opis(tutor_data):
    subjects_label = ", ".join(tutor_data["subjects"]).lower()
    levels_label = ", ".join(tutor_data["levels"]).lower()
    return (
        f"Prowadzi zajecia z {subjects_label}. "
        f"Wspiera uczniow na poziomie {levels_label} i stawia na praktyczne tlumaczenie."
    )


def _subject_combinations(tutor_data):
    combinations = set()
    for subject in tutor_data["subjects"]:
        for topic in tutor_data["topics"]:
            for level in tutor_data["levels"]:
                combinations.add((subject, topic, level))
    return sorted(combinations)


def _ensure_auth_user(seed_id, first_name, last_name, email):
    auth_user, created = AuthUser.objects.get_or_create(
        username=seed_id,
        defaults={
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
        },
    )

    auth_user.email = email
    auth_user.first_name = first_name
    auth_user.last_name = last_name
    seed_password = _get_seed_password()
    if seed_password:
        auth_user.set_password(seed_password)
    else:
        auth_user.set_unusable_password()
    auth_user.save()
    return created


def _ensure_reviewer_users():
    reviewers = []
    for index in range(1, 6):
        email = f"reviewer{index}@rentnerd.local"
        reviewer, _ = User.objects.update_or_create(
            email=email,
            defaults={
                "imie": f"Recenzent{index}",
                "nazwisko": "Seed",
                "haslo": "",
                "typ": "uczen",
            },
        )
        reviewers.append(reviewer)
    return reviewers


class Command(BaseCommand):
    help = "Dodaje tutorow seedowych z kontami, profilami i grafikami pobieranymi z bazy."

    @transaction.atomic
    def handle(self, *args, **options):
        reviewers = _ensure_reviewer_users()
        created_auth_users = 0
        created_custom_users = 0
        created_tutors = 0
        created_subject_links = 0
        created_slots = 0
        created_opinions = 0

        for index, tutor_data in enumerate(SEED_TUTORS, start=1):
            first_name, last_name = _split_name(tutor_data["name"])
            email = _tutor_email(tutor_data["id"])

            if _ensure_auth_user(tutor_data["id"], first_name, last_name, email):
                created_auth_users += 1

            custom_user, custom_user_created = User.objects.update_or_create(
                email=email,
                defaults={
                    "imie": first_name,
                    "nazwisko": last_name,
                    "haslo": "",
                    "typ": "tutor",
                },
            )
            if custom_user_created:
                created_custom_users += 1

            tutor, tutor_created = Tutor.objects.update_or_create(
                uzytkownik=custom_user,
                defaults={
                    "slug": tutor_data["id"],
                    "opis": _build_opis(tutor_data),
                    "stawka_godzinowa": _rate_for_index(index),
                    "rating": tutor_data["rating"],
                    "avatar_tone": tutor_data["avatarTone"],
                    "wiek": tutor_data["age"],
                    "followers_count": max(120, tutor_data["opinions"] * 18 + 95),
                    "experience_label": tutor_data["experience"],
                    "status_badges": tutor_data["statusBadges"],
                },
            )
            if tutor_created:
                created_tutors += 1

            subject_objects = []
            for subject_name, topic_name, level_name in _subject_combinations(tutor_data):
                subject, _ = Przedmiot.objects.get_or_create(
                    nazwa=subject_name,
                    temat=topic_name,
                    poziom=level_name,
                )
                subject_objects.append(subject)

            tutor.przedmioty.set(subject_objects)
            created_subject_links += len(subject_objects)

            tutor.dostepnosci.all().delete()
            for date_label in tutor_data["availableDates"]:
                date_value = _parse_date(date_label)
                weekday = date_value.weekday()
                for hour_range in tutor_data["hours"]:
                    hour_from, hour_to = hour_range.split("-", 1)
                    Dostepnosc.objects.create(
                        tutor=tutor,
                        dzien_tygodnia=weekday,
                        godzina_od=_parse_time(hour_from),
                        godzina_do=_parse_time(hour_to),
                        data=date_value,
                    )
                    created_slots += 1

            tutor.opinie_dla.all().delete()
            for opinion_index in range(tutor_data["opinions"]):
                reviewer = reviewers[opinion_index % len(reviewers)]
                Opinia.objects.create(
                    autor=reviewer,
                    tutor=tutor,
                    rating=tutor_data["rating"],
                    tresc=REVIEW_MESSAGES[opinion_index % len(REVIEW_MESSAGES)],
                )
                created_opinions += 1

        self.stdout.write(
            self.style.SUCCESS(
                "Zaseedowano tutorow z bazy: "
                f"{len(SEED_TUTORS)} profil(i), "
                f"{created_auth_users} nowych kont auth, "
                f"{created_custom_users} nowych kont custom, "
                f"{created_tutors} nowych profilow tutorow, "
                f"{created_subject_links} podpiecia przedmiotow, "
                f"{created_slots} slotow dostepnosci i "
                f"{created_opinions} opinii."
            )
        )
        if not _get_seed_password():
            self.stdout.write(
                self.style.WARNING(
                    "Nie ustawiono SEED_TUTOR_PASSWORD, dlatego seedowe konta auth maja wylaczone logowanie."
                )
            )
