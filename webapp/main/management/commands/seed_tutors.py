from datetime import datetime
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from main.models import Dostepnosc, Przedmiot, Tutor, User

SECONDARY_SCHOOL_LEVEL = "Szkola srednia"

SEED_TUTORS = [
    {
        "imie": "Lukasz",
        "nazwisko": "Gamon",
        "email": "lukasz.gamon@example.com",
        "opis": "Prowadzi zajecia z matematyki i fizyki dla liceum oraz technikum.",
        "stawka_godzinowa": "110.00",
        "rating": 4.5,
        "subjects": [
            ("Matematyka", "Algebra", SECONDARY_SCHOOL_LEVEL),
            ("Fizyka", "Mechanika", SECONDARY_SCHOOL_LEVEL),
            ("Matematyka", "Matura", SECONDARY_SCHOOL_LEVEL),
        ],
        "availability": [
            (2, "18:00", "19:00"),
            (2, "19:00", "20:00"),
            (4, "19:00", "20:00"),
        ],
    },
    {
        "imie": "Aleksandra",
        "nazwisko": "Gawron",
        "email": "aleksandra.gawron@example.com",
        "opis": "Pomaga w matematyce i fizyce, szczegolnie przy powtorkach przed sprawdzianami.",
        "stawka_godzinowa": "125.00",
        "rating": 5.0,
        "subjects": [
            ("Matematyka", "Algebra", SECONDARY_SCHOOL_LEVEL),
            ("Fizyka", "Powtorka", "Podstawowka"),
        ],
        "availability": [
            (2, "19:00", "20:00"),
            (3, "19:00", "20:00"),
        ],
    },
    {
        "imie": "Sebastian",
        "nazwisko": "Kowalski",
        "email": "sebastian.kowalski@example.com",
        "opis": "Przygotowuje do matury z matematyki i prowadzi konsultacje dla uczniow liceum.",
        "stawka_godzinowa": "135.00",
        "rating": 4.8,
        "subjects": [
            ("Matematyka", "Algebra", SECONDARY_SCHOOL_LEVEL),
            ("Matematyka", "Matura", "Studia"),
        ],
        "availability": [
            (2, "19:00", "20:00"),
            (2, "20:00", "21:00"),
        ],
    },
    {
        "imie": "Tomasz",
        "nazwisko": "Swiety",
        "email": "tomasz.swiety@example.com",
        "opis": "Prowadzi spokojne lekcje dla mlodszych uczniow i przygotowuje do matury podstawowej.",
        "stawka_godzinowa": "90.00",
        "rating": 4.7,
        "subjects": [
            ("Matematyka", "Powtorka", "Podstawowka"),
            ("Matematyka", "Matura", SECONDARY_SCHOOL_LEVEL),
        ],
        "availability": [
            (2, "17:00", "18:00"),
            (2, "18:00", "19:00"),
            (3, "18:00", "19:00"),
        ],
    },
    {
        "imie": "Julia",
        "nazwisko": "Serwan",
        "email": "julia.serwan@example.com",
        "opis": "Lacze matematyke z fizyka i dobrze odnajduje sie w pracy z uczniami technikum.",
        "stawka_godzinowa": "85.00",
        "rating": 5.0,
        "subjects": [
            ("Matematyka", "Algebra", SECONDARY_SCHOOL_LEVEL),
            ("Fizyka", "Powtorka", SECONDARY_SCHOOL_LEVEL),
        ],
        "availability": [
            (2, "18:00", "19:00"),
            (6, "20:00", "21:00"),
        ],
    },
    {
        "imie": "Natalia",
        "nazwisko": "Pawlak",
        "email": "natalia.pawlak@example.com",
        "opis": "Prowadzi zajecia z matematyki dla studentow oraz przygotowanie do matury z chemii.",
        "stawka_godzinowa": "115.00",
        "rating": 4.9,
        "subjects": [
            ("Matematyka", "Algebra", "Studia"),
            ("Chemia", "Matura", SECONDARY_SCHOOL_LEVEL),
        ],
        "availability": [
            (5, "19:00", "20:00"),
            (6, "19:00", "20:00"),
        ],
    },
    {
        "imie": "Jakub",
        "nazwisko": "Morek",
        "email": "jakub.morek@example.com",
        "opis": "Pracuje glownie z technikum, pomagajac uporzadkowac algebraiczne podstawy i zadania praktyczne.",
        "stawka_godzinowa": "105.00",
        "rating": 4.7,
        "subjects": [
            ("Matematyka", "Algebra", SECONDARY_SCHOOL_LEVEL),
            ("Matematyka", "Powtorka", SECONDARY_SCHOOL_LEVEL),
        ],
        "availability": [
            (2, "20:00", "21:00"),
            (0, "20:00", "21:00"),
        ],
    },
    {
        "imie": "Klaudia",
        "nazwisko": "Nowak",
        "email": "klaudia.nowak@example.com",
        "opis": "Pomaga w chemii i biologii, szczegolnie przy maturze i zajeciach na poziomie studenckim.",
        "stawka_godzinowa": "130.00",
        "rating": 4.9,
        "subjects": [
            ("Chemia", "Matura", SECONDARY_SCHOOL_LEVEL),
            ("Biologia", "Powtorka", "Studia"),
        ],
        "availability": [
            (2, "19:00", "20:00"),
            (4, "19:00", "20:00"),
        ],
    },
    {
        "imie": "Oskar",
        "nazwisko": "Madej",
        "email": "oskar.madej@example.com",
        "opis": "Specjalizuje sie w fizyce, od mechaniki po zajecia rozszerzone dla studentow.",
        "stawka_godzinowa": "120.00",
        "rating": 4.8,
        "subjects": [
            ("Fizyka", "Mechanika", SECONDARY_SCHOOL_LEVEL),
            ("Fizyka", "Algebra", "Studia"),
        ],
        "availability": [
            (2, "19:00", "20:00"),
            (3, "20:00", "21:00"),
        ],
    },
    {
        "imie": "Monika",
        "nazwisko": "Zielinska",
        "email": "monika.zielinska@example.com",
        "opis": "Prowadzi biologiczne i chemiczne powtorki przed kartkowkami, egzaminami i kolokwiami.",
        "stawka_godzinowa": "140.00",
        "rating": 4.9,
        "subjects": [
            ("Biologia", "Matura", SECONDARY_SCHOOL_LEVEL),
            ("Chemia", "Powtorka", "Studia"),
        ],
        "availability": [
            (2, "18:00", "19:00"),
            (3, "19:00", "20:00"),
        ],
    },
]


def _parse_time(value):
    return datetime.strptime(value, "%H:%M").time()


def _get_subject(subject_name, topic_name, level_name):
    subject = Przedmiot.objects.filter(
        nazwa=subject_name,
        temat=topic_name,
        poziom=level_name,
    ).first()

    if subject is None:
        subject = Przedmiot.objects.create(
            nazwa=subject_name,
            temat=topic_name,
            poziom=level_name,
        )

    return subject


class Command(BaseCommand):
    help = "Uzupelnia lokalna baze przykladowymi tutorami zgodnymi z wyszukiwarka."

    @transaction.atomic
    def handle(self, *args, **options):
        Przedmiot.objects.filter(poziom__in=["Liceum", "Technikum"]).update(
            poziom=SECONDARY_SCHOOL_LEVEL
        )

        created_users = 0
        created_tutors = 0
        created_subjects = 0
        availability_slots = 0

        for tutor_data in SEED_TUTORS:
            user, user_created = User.objects.update_or_create(
                email=tutor_data["email"],
                defaults={
                    "imie": tutor_data["imie"],
                    "nazwisko": tutor_data["nazwisko"],
                    "haslo": "seed-demo-password",
                    "typ": "tutor",
                },
            )
            if user_created:
                created_users += 1

            tutor, tutor_created = Tutor.objects.update_or_create(
                uzytkownik=user,
                defaults={
                    "opis": tutor_data["opis"],
                    "stawka_godzinowa": Decimal(tutor_data["stawka_godzinowa"]),
                    "rating": tutor_data["rating"],
                },
            )
            if tutor_created:
                created_tutors += 1

            subject_objects = []
            for subject_name, topic_name, level_name in tutor_data["subjects"]:
                subject = _get_subject(subject_name, topic_name, level_name)
                if subject.tutorzy.count() == 0:
                    created_subjects += 1
                subject_objects.append(subject)

            tutor.przedmioty.set(subject_objects)

            tutor.dostepnosci.all().delete()
            for weekday, hour_from, hour_to in tutor_data["availability"]:
                Dostepnosc.objects.create(
                    tutor=tutor,
                    dzien_tygodnia=weekday,
                    godzina_od=_parse_time(hour_from),
                    godzina_do=_parse_time(hour_to),
                )
                availability_slots += 1

        self.stdout.write(
            self.style.SUCCESS(
                "Zaseedowano tutorow: "
                f"{len(SEED_TUTORS)} profil(i), "
                f"{created_users} nowych uzytkownikow, "
                f"{created_tutors} nowych tutorow, "
                f"{created_subjects} nowych przedmiotow, "
                f"{availability_slots} slotow dostepnosci."
            )
        )
