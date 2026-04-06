import json
import logging
from datetime import date, datetime, timedelta
from urllib.parse import urlencode

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, transaction
from django.db.models import Count
from django.http import Http404, JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import redirect, render
from django.templatetags.static import static
from django.urls import reverse
from django.utils import timezone
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.csrf import csrf_exempt

# Importujemy Twój customowy model User pod aliasem, żeby nie nadpisał domyślnego User z Django
from .models import Dostepnosc, Obserwacja, Post, Przedmiot, Tutor, User as CustomUser

AVATAR_TONES = (
    "violet",
    "stone",
    "gold",
    "slate",
    "rose",
    "mint",
    "ocean",
    "coral",
    "indigo",
    "forest",
)
WEEKDAY_SHORT_LABELS = ("Pon", "Wt", "Sr", "Czw", "Pt", "Sob", "Niedz")

SUPPORTED_PREVIEW_COMPONENTS = {
    "subject-select": "subject-select",
    "school-level-select": "school-level-select",
}
SCHEDULE_TIME_RANGES = (
    ("18:00", "19:00"),
    ("19:00", "20:00"),
    ("20:00", "21:00"),
    ("21:00", "22:00"),
    ("22:00", "23:00"),
)
DEFAULT_REVIEW_TEXT = "Profil zostal dodany do bazy i jest gotowy na pierwsze opinie."
DEFAULT_REVIEW_AUTHOR = "Rent Nerd"
validate_username = UnicodeUsernameValidator()
logger = logging.getLogger(__name__)


def _validate_registration_data(username, normalized_email, password, password_confirm=None):
    if not username or not normalized_email or not password:
        return "Uzupelnij wszystkie pola formularza."

    if password_confirm is not None and password != password_confirm:
        return "Hasla musza byc takie same."

    try:
        validate_username(username)
    except ValidationError:
        return "Nazwa uzytkownika moze zawierac tylko litery, cyfry i znaki @/./+/-/_."

    try:
        validate_email(normalized_email)
    except ValidationError:
        return "Podaj poprawny adres e-mail."

    if User.objects.filter(username__iexact=username).exists():
        return "Ta nazwa uzytkownika jest juz zajeta."

    if (
            User.objects.filter(email__iexact=normalized_email).exists()
            or CustomUser.objects.filter(email__iexact=normalized_email).exists()
    ):
        return "Konto z tym adresem e-mail juz istnieje."

    return None


def _create_auth_and_custom_user(username, normalized_email, password):
    with transaction.atomic():
        user = User.objects.create_user(username, normalized_email, password)
        CustomUser.objects.create(
            imie=username,
            nazwisko="",
            email=normalized_email,
            haslo=password,
        )

    return user


def _get_custom_user_for_auth_user(auth_user):
    if not getattr(auth_user, "is_authenticated", False):
        return None

    normalized_email = User.objects.normalize_email(auth_user.email or "").strip().lower()
    if not normalized_email:
        return None

    return CustomUser.objects.filter(email__iexact=normalized_email).first()


def _get_or_create_custom_user_for_auth_user(auth_user):
    custom_user = _get_custom_user_for_auth_user(auth_user)
    if custom_user is not None:
        return custom_user

    normalized_email = User.objects.normalize_email(auth_user.email or "").strip().lower()
    if not normalized_email:
        return None

    first_name = (auth_user.first_name or auth_user.get_username() or "").strip()
    last_name = (auth_user.last_name or "").strip()

    return CustomUser.objects.create(
        imie=first_name or auth_user.get_username(),
        nazwisko=last_name,
        email=normalized_email,
        haslo="",
        typ="uczen",
    )


def _get_tutor_for_auth_user(auth_user):
    custom_user = _get_custom_user_for_auth_user(auth_user)
    if custom_user is None:
        return None

    return (
        Tutor.objects.filter(uzytkownik=custom_user)
        .select_related("uzytkownik")
        .prefetch_related("przedmioty", "dostepnosci", "opinie_dla")
        .annotate(opinions_count=Count("opinie_dla", distinct=True))
        .first()
    )


def _get_user_display_name(auth_user, custom_user=None):
    if custom_user is not None:
        name_parts = [
            part.strip()
            for part in (custom_user.imie, custom_user.nazwisko)
            if part and part.strip()
        ]
    else:
        name_parts = [
            part.strip()
            for part in (auth_user.first_name, auth_user.last_name)
            if part and part.strip()
        ]

    return " ".join(name_parts) or auth_user.get_username()


def _get_user_initials(display_name):
    initials = [part[0].upper() for part in display_name.split() if part][:2]
    if initials:
        return "".join(initials)

    fallback = (display_name or "U").strip()
    return (fallback[:1] or "U").upper()


def _is_tutor_followed_by_user(tutor, custom_user):
    if custom_user is None or tutor is None:
        return False

    return Obserwacja.objects.filter(uzytkownik=custom_user, tutor=tutor).exists()


def _can_follow_tutor(tutor, custom_user):
    if custom_user is None or tutor is None:
        return False

    return tutor.uzytkownik_id != custom_user.pk


def _refresh_tutor_followers_count(tutor):
    followers_count = Obserwacja.objects.filter(tutor=tutor).count()
    if tutor.followers_count != followers_count:
        tutor.followers_count = followers_count
        tutor.save(update_fields=["followers_count"])

    return followers_count


def _get_safe_next_target(request):
    candidate = request.POST.get("next") or request.GET.get("next") or ""
    if candidate and url_has_allowed_host_and_scheme(
            candidate,
            allowed_hosts={request.get_host()},
            require_https=request.is_secure(),
    ):
        return candidate

    return ""


def _get_home_props(request):
    current_user = None
    if request.user.is_authenticated:
        custom_user = _get_custom_user_for_auth_user(request.user)
        is_tutor = bool(
            custom_user
            and custom_user.typ == "tutor"
            and Tutor.objects.filter(uzytkownik=custom_user).exists()
        )
        display_name = _get_user_display_name(request.user, custom_user=custom_user)
        current_user = {
            "email": request.user.email,
            "username": request.user.get_username(),
            "displayName": display_name,
            "initials": _get_user_initials(display_name),
            "avatarUrl": static("main/img/profile1.png"),
            "accountType": custom_user.typ if custom_user and custom_user.typ else "uczen",
            "isTutor": is_tutor,
        }

    return {
        "csrfToken": get_token(request),
        "currentUser": current_user,
        "images": {
            "hero": static("main/img/hero_tutor.png"),
            "logo": static("main/img/rent_nerd_logo.png"),
            "mentor": static("main/img/mentor_scene.png"),
        },
        "isAuthenticated": request.user.is_authenticated,
        "urls": {
            "about": reverse("about"),
            "home": reverse("home"),
            "login": reverse("login_user"),
            "logout": reverse("logout_user"),
            "observations": reverse("portal_observations"),
            "onboarding": reverse("onboarding_account_type"),
            "portalPosts": reverse("portal_posts"),
            "register": reverse("register_user"),
            "databaseError": reverse("database_error_page"),
            "schoolLevelSelectPreview": reverse(
                "component_preview",
                kwargs={"component_slug": "school-level-select"},
            ),
            "subjectSelectPreview": reverse(
                "component_preview",
                kwargs={"component_slug": "subject-select"},
            ),
            "tutorOnboardingSave": reverse("tutor_onboarding_save"),
            "tutorDashboardData": reverse("tutor_dashboard_data"),
            "tutorProfileBase": reverse("tutor_profile_base"),
            "tutorSearch": reverse("tutor_search"),
        },
        "onboardingMode": None,
        "onboardingNextTarget": "",
        "previewComponent": None,
    }


def _parse_iso_date(value):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None


def _parse_hour_range(value):
    if not value or "-" not in value:
        return (None, None)

    start_label, end_label = value.split("-", 1)

    try:
        start_time = datetime.strptime(start_label, "%H:%M").time()
        end_time = datetime.strptime(end_label, "%H:%M").time()
    except ValueError:
        return (None, None)

    return (start_time, end_time)


def _split_full_name(full_name, fallback_username):
    cleaned_name = (full_name or "").strip()
    if not cleaned_name:
        return (fallback_username or "", "")

    parts = cleaned_name.split(" ", 1)
    first_name = parts[0].strip()
    last_name = parts[1].strip() if len(parts) > 1 else ""
    return (first_name, last_name)


def _normalize_string_list(values):
    if not isinstance(values, list):
        return []

    normalized_values = []
    for value in values:
        normalized_value = str(value).strip()
        if normalized_value and normalized_value not in normalized_values:
            normalized_values.append(normalized_value)

    return normalized_values


def _parse_time_label(value):
    try:
        start_time = datetime.strptime(value, "%H:%M").time()
    except ValueError:
        return (None, None)

    end_time = (
        datetime.combine(date.today(), start_time) + timedelta(hours=1)
    ).time()
    return (start_time, end_time)


def _get_weekday_candidates(selected_date):
    return {selected_date.weekday()}


def _build_initials(first_name, last_name):
    initials = f"{(first_name or '')[:1]}{(last_name or '')[:1]}".upper()
    return initials or "T"


def _build_tags(przedmioty):
    tags = []

    for przedmiot in przedmioty:
        for value in (przedmiot.nazwa, przedmiot.temat, przedmiot.poziom):
            if value and value not in tags:
                tags.append(value)

    return tags[:4]


def _serialize_tutor_result(tutor, filters, selected_date, start_time, end_time):
    przedmioty = list(tutor.przedmioty.all())
    subject_matches = [przedmiot for przedmiot in przedmioty if przedmiot.nazwa == filters["subject"]]
    if not subject_matches:
        return None

    has_topic = any((przedmiot.temat or "") == filters["topic"] for przedmiot in przedmioty)
    has_level = any((przedmiot.poziom or "") == filters["level"] for przedmiot in przedmioty)

    matching_day_slots = _get_matching_slots_for_date(tutor, selected_date)
    has_date = bool(matching_day_slots)
    has_hour = any(
        slot.godzina_od == start_time and slot.godzina_do == end_time
        for slot in matching_day_slots
    )

    score = 6
    if has_topic:
        score += 2
    if has_level:
        score += 4
    if has_hour:
        score += 5
    if has_date:
        score += 3
    if matching_day_slots:
        score += 1

    display_name = _build_display_name(tutor)
    experience_label = _build_experience_label(tutor)
    status_badges = _build_status_badges(tutor, has_date=has_date, has_hour=has_hour)
    rating = float(tutor.rating) if tutor.rating is not None else 0.0
    opinions_count = getattr(tutor, "opinions_count", None)
    if opinions_count is None:
        opinions_count = tutor.opinie_dla.count()

    return {
        "id": tutor.pk,
        "name": display_name,
        "initials": _build_initials(tutor.uzytkownik.imie, tutor.uzytkownik.nazwisko),
        "avatarTone": tutor.avatar_tone or AVATAR_TONES[tutor.pk % len(AVATAR_TONES)],
        "age": tutor.wiek,
        "rating": rating,
        "opinions": opinions_count,
        "experience": experience_label,
        "statusBadges": status_badges,
        "tags": _build_tags(przedmioty),
        "score": score,
        "isExactMatch": has_level and has_hour and has_date,
    }


def _get_matching_slots_for_date(tutor, selected_date):
    weekday_candidates = _get_weekday_candidates(selected_date)
    matching_slots = []

    for slot in tutor.dostepnosci.all():
        if slot.data is not None:
            if slot.data == selected_date:
                matching_slots.append(slot)
            continue

        if slot.dzien_tygodnia in weekday_candidates:
            matching_slots.append(slot)

    return matching_slots


def _build_display_name(tutor):
    first_name = (tutor.uzytkownik.imie or "").strip()
    last_name = (tutor.uzytkownik.nazwisko or "").strip()
    return " ".join(part for part in (first_name, last_name) if part) or tutor.uzytkownik.email


def _build_experience_label(tutor):
    if tutor.experience_label:
        return tutor.experience_label

    if tutor.stawka_godzinowa is not None:
        return f"Stawka {tutor.stawka_godzinowa:.2f} zl/h"

    return "Profil gotowy do kontaktu"


def _collect_tutor_taxonomy(przedmioty):
    subjects = []
    levels = []
    topics = []

    for przedmiot in przedmioty:
        if przedmiot.nazwa and przedmiot.nazwa not in subjects:
            subjects.append(przedmiot.nazwa)
        if przedmiot.poziom and przedmiot.poziom not in levels:
            levels.append(przedmiot.poziom)
        if przedmiot.temat and przedmiot.temat not in topics:
            topics.append(przedmiot.temat)

    return {
        "subjects": subjects,
        "levels": levels,
        "topics": topics,
    }


def _summarize_values(values, fallback, max_items=2):
    if not values:
        return fallback

    visible_values = values[:max_items]
    remaining_values = len(values) - len(visible_values)
    summary = ", ".join(visible_values)

    if remaining_values > 0:
        return f"{summary} +{remaining_values}"

    return summary


def _format_time_range(start_time, end_time):
    return f"{start_time.strftime('%H:%M')} - {end_time.strftime('%H:%M')}"


def _build_status_badges(tutor, has_date=False, has_hour=False):
    status_badges = list(tutor.status_badges or [])
    if status_badges:
        return status_badges[:4]

    if has_hour:
        return ["wolne terminy"]

    if has_date:
        return ["dostepny tego dnia"]

    return ["sprawny kontakt"]


def _build_about_paragraphs(tutor, przedmioty):
    subjects = []
    levels = []

    for przedmiot in przedmioty:
        if przedmiot.nazwa and przedmiot.nazwa not in subjects:
            subjects.append(przedmiot.nazwa)
        if przedmiot.poziom and przedmiot.poziom not in levels:
            levels.append(przedmiot.poziom)

    first_name = (tutor.uzytkownik.imie or "Tutor").strip()
    subjects_label = ", ".join(subjects).lower() if subjects else "wybranych przedmiotow"
    levels_label = ", ".join(levels).lower() if levels else "roznych poziomach"
    lead_subject = subjects[0].lower() if subjects else "materialu szkolnego"

    return [
        f"{first_name} prowadzi zajecia z {subjects_label} i wspiera uczniow na poziomie {levels_label}.",
        "Podczas spotkan stawia na spokojne tlumaczenie krok po kroku, jasne przyklady i tempo dopasowane do ucznia.",
        f"Jesli potrzebujesz wsparcia z {lead_subject}, profil jest przygotowany pod szybki kontakt i regularna wspolprace.",
    ]


def _build_schedule_days(slots, selected_date):
    explicit_dates = sorted({slot.data for slot in slots if slot.data is not None})
    if explicit_dates:
        days = explicit_dates[:7]
        base_date = explicit_dates[0]
        day_offset = 0

        while len(days) < 7:
            next_date = base_date + timedelta(days=day_offset)
            if next_date not in days:
                days.append(next_date)
            day_offset += 1

        return days

    base_date = selected_date or date.today()
    return [base_date + timedelta(days=offset) for offset in range(7)]


def _build_tutor_schedule(tutor, selected_date):
    slots = list(tutor.dostepnosci.all())
    days = _build_schedule_days(slots, selected_date)
    highlighted_day = days[1] if len(days) > 1 else (days[0] if days else None)
    time_ranges = [
        (
            datetime.strptime(start_label, "%H:%M").time(),
            datetime.strptime(end_label, "%H:%M").time(),
            start_label,
        )
        for start_label, end_label in SCHEDULE_TIME_RANGES
    ]

    day_has_any_slot = {}
    for day in days:
        has_any_slot = False
        for slot in slots:
            slot_matches_day = (
                slot.data == day
                if slot.data is not None
                else slot.dzien_tygodnia == day.weekday()
            )
            if slot_matches_day:
                has_any_slot = True
                break
        day_has_any_slot[day] = has_any_slot

    rows = []
    for start_time, end_time, start_label in time_ranges:
        row_slots = []

        for day in days:
            has_slot = any(
                (
                    slot.data == day
                    if slot.data is not None
                    else slot.dzien_tygodnia == day.weekday()
                )
                and slot.godzina_od == start_time
                and slot.godzina_do == end_time
                for slot in slots
            )

            if has_slot:
                slot_status = "highlighted" if day == highlighted_day else "available"
            elif not day_has_any_slot.get(day, False):
                slot_status = "blocked"
            else:
                slot_status = "unavailable"

            row_slots.append(slot_status)

        rows.append(
            {
                "timeLabel": start_label,
                "slots": row_slots,
            }
        )

    return {
        "days": [
            {
                "iso": day.isoformat(),
                "label": day.strftime("%d.%m"),
            }
            for day in days
        ],
        "rows": rows,
    }


def _build_review_payload(tutor, rating):
    latest_review = tutor.opinie_dla.order_by("-data_dodania").first()

    if latest_review is None:
        return {
            "author": DEFAULT_REVIEW_AUTHOR,
            "dateLabel": date.today().strftime("%d.%m.%Y"),
            "rating": rating,
            "content": DEFAULT_REVIEW_TEXT,
        }

    author_name = " ".join(
        part for part in ((latest_review.autor.imie or "").strip(), (latest_review.autor.nazwisko or "").strip()) if part
    ) or DEFAULT_REVIEW_AUTHOR

    return {
        "author": author_name,
        "dateLabel": latest_review.data_dodania.strftime("%d.%m.%Y"),
        "rating": float(latest_review.rating) if latest_review.rating is not None else rating,
        "content": latest_review.tresc or DEFAULT_REVIEW_TEXT,
    }


def _serialize_tutor_profile(tutor, selected_date, custom_user=None):
    przedmioty = list(tutor.przedmioty.all())
    taxonomy = _collect_tutor_taxonomy(przedmioty)
    rating = float(tutor.rating) if tutor.rating is not None else 0.0
    opinions_count = getattr(tutor, "opinions_count", None)
    if opinions_count is None:
        opinions_count = tutor.opinie_dla.count()

    followers_count = tutor.followers_count
    can_follow = _can_follow_tutor(tutor, custom_user)

    return {
        "id": tutor.pk,
        "name": _build_display_name(tutor),
        "initials": _build_initials(tutor.uzytkownik.imie, tutor.uzytkownik.nazwisko),
        "avatarTone": tutor.avatar_tone or AVATAR_TONES[tutor.pk % len(AVATAR_TONES)],
        "age": tutor.wiek,
        "rating": rating,
        "opinions": opinions_count,
        "experience": _build_experience_label(tutor),
        "canFollow": can_follow,
        "followersCount": followers_count,
        "isFollowed": _is_tutor_followed_by_user(tutor, custom_user) if can_follow else False,
        "statusBadges": _build_status_badges(tutor),
        "subjects": taxonomy["subjects"],
        "levels": taxonomy["levels"],
        "topics": taxonomy["topics"],
        "tags": _build_tags(przedmioty),
        "aboutParagraphs": _build_about_paragraphs(tutor, przedmioty),
        "review": _build_review_payload(tutor, rating),
        "schedule": _build_tutor_schedule(tutor, selected_date),
    }


def _build_tutor_dashboard_upcoming_lessons(tutor, taxonomy, reference_dt, limit=6):
    reference_date = reference_dt.date()
    reference_time = reference_dt.time()
    subject_label = _summarize_values(taxonomy["subjects"], "Profil bez przedmiotow")
    level_label = _summarize_values(taxonomy["levels"], "Rozne poziomy")
    lesson_candidates = []

    for slot in tutor.dostepnosci.all():
        if slot.data is not None:
            occurrence_dates = [slot.data]
        else:
            day_offset = (slot.dzien_tygodnia - reference_date.weekday()) % 7
            first_occurrence = reference_date + timedelta(days=day_offset)

            if day_offset == 0 and slot.godzina_do <= reference_time:
                first_occurrence += timedelta(days=7)

            occurrence_dates = [
                first_occurrence + timedelta(days=7 * week_offset)
                for week_offset in range(2)
            ]

        for occurrence_date in occurrence_dates:
            if occurrence_date < reference_date:
                continue

            if occurrence_date == reference_date and slot.godzina_do <= reference_time:
                continue

            days_away = (occurrence_date - reference_date).days
            lesson_candidates.append(
                {
                    "id": f"{slot.pk}-{occurrence_date.isoformat()}",
                    "dateIso": occurrence_date.isoformat(),
                    "dateLabel": occurrence_date.strftime("%d.%m"),
                    "weekdayLabel": WEEKDAY_SHORT_LABELS[occurrence_date.weekday()],
                    "timeLabel": _format_time_range(slot.godzina_od, slot.godzina_do),
                    "subjectLabel": subject_label,
                    "levelLabel": level_label,
                    "statusLabel": "Dzisiaj" if days_away == 0 else ("Jutro" if days_away == 1 else "Zaplanowane"),
                    "isToday": days_away == 0,
                    "_daysAway": days_away,
                    "_sortTime": slot.godzina_od.strftime("%H:%M"),
                }
            )

    lesson_candidates.sort(key=lambda item: (item["dateIso"], item["_sortTime"], item["id"]))

    today_lessons_count = sum(1 for item in lesson_candidates if item["_daysAway"] == 0)
    week_lessons_count = sum(1 for item in lesson_candidates if 0 <= item["_daysAway"] <= 6)

    upcoming_lessons = []
    for lesson in lesson_candidates[:limit]:
        lesson.pop("_daysAway", None)
        lesson.pop("_sortTime", None)
        upcoming_lessons.append(lesson)

    return {
        "todayLessonsCount": today_lessons_count,
        "upcomingLessons": upcoming_lessons,
        "weekLessonsCount": week_lessons_count,
    }


def _build_tutor_dashboard_highlights(tutor, taxonomy, upcoming_payload):
    next_lesson = upcoming_payload["upcomingLessons"][0] if upcoming_payload["upcomingLessons"] else None
    rating = float(tutor.rating) if tutor.rating is not None else 0.0
    opinions_count = getattr(tutor, "opinions_count", None)
    if opinions_count is None:
        opinions_count = tutor.opinie_dla.count()

    next_value = next_lesson["timeLabel"] if next_lesson else "Brak"
    next_description = (
        f'{next_lesson["weekdayLabel"]} {next_lesson["dateLabel"]}'
        if next_lesson
        else "Dodaj kolejne sloty w harmonogramie"
    )

    return [
        {
            "id": "next",
            "icon": "fa-regular fa-clock",
            "label": "Najblizsze zajecia",
            "value": next_value,
            "description": next_description,
        },
        {
            "id": "today",
            "icon": "fa-solid fa-sun",
            "label": "Dzisiaj",
            "value": str(upcoming_payload["todayLessonsCount"]),
            "description": "sloty w grafiku",
        },
        {
            "id": "week",
            "icon": "fa-solid fa-calendar-week",
            "label": "Ten tydzien",
            "value": str(upcoming_payload["weekLessonsCount"]),
            "description": "zaplanowane okna",
        },
        {
            "id": "profile",
            "icon": "fa-solid fa-star",
            "label": "Profil",
            "value": f"{rating:.1f}/5" if opinions_count else "Nowy",
            "description": f'{opinions_count} opinii, {len(taxonomy["subjects"])} przedmiotow',
        },
    ]


def _build_tutor_dashboard_insights(tutor, taxonomy, upcoming_payload):
    insights = []
    next_lesson = upcoming_payload["upcomingLessons"][0] if upcoming_payload["upcomingLessons"] else None
    opinions_count = getattr(tutor, "opinions_count", None)
    if opinions_count is None:
        opinions_count = tutor.opinie_dla.count()

    if next_lesson:
        insights.append(
            f'Najblizszy blok zajec wypada {next_lesson["weekdayLabel"]} {next_lesson["dateLabel"]} o {next_lesson["timeLabel"]}.'
        )
    else:
        insights.append("Na razie nie masz zadnych przyszlych slotow w harmonogramie.")

    if taxonomy["levels"]:
        insights.append(
            f'Uczysz na poziomach: {_summarize_values(taxonomy["levels"], "Rozne poziomy", max_items=3)}.'
        )

    if taxonomy["topics"]:
        insights.append(
            f'Najczesciej pokrywane tematy: {_summarize_values(taxonomy["topics"], "Powtorka", max_items=3)}.'
        )

    if opinions_count:
        insights.append(f"Masz juz {opinions_count} opinii, warto utrzymac regularnosc i szybki kontakt z uczniami.")
    else:
        insights.append("Profil nie ma jeszcze opinii, wiec dobrym ruchem bedzie dopracowanie opisu i regularnych terminow.")

    return insights[:4]


def _serialize_tutor_dashboard(tutor):
    reference_dt = timezone.localtime()
    reference_date = reference_dt.date()
    przedmioty = list(tutor.przedmioty.all())
    taxonomy = _collect_tutor_taxonomy(przedmioty)
    upcoming_payload = _build_tutor_dashboard_upcoming_lessons(tutor, taxonomy, reference_dt)
    highlights = _build_tutor_dashboard_highlights(tutor, taxonomy, upcoming_payload)
    rating = float(tutor.rating) if tutor.rating is not None else 0.0
    opinions_count = getattr(tutor, "opinions_count", None)
    if opinions_count is None:
        opinions_count = tutor.opinie_dla.count()

    return {
        "tutorId": tutor.pk,
        "profile": {
            "name": _build_display_name(tutor),
            "initials": _build_initials(tutor.uzytkownik.imie, tutor.uzytkownik.nazwisko),
            "avatarTone": tutor.avatar_tone or AVATAR_TONES[tutor.pk % len(AVATAR_TONES)],
            "about": tutor.opis or "Uzupelnij opis, aby uczniowie szybciej rozumieli Twoj styl pracy.",
            "experience": _build_experience_label(tutor),
            "rating": rating,
            "opinions": opinions_count,
            "followersCount": tutor.followers_count or max(120, opinions_count * 18 + 95),
            "subjects": taxonomy["subjects"],
            "levels": taxonomy["levels"],
            "topics": taxonomy["topics"],
            "statusBadges": _build_status_badges(tutor),
        },
        "generatedAt": reference_dt.isoformat(),
        "highlights": highlights,
        "upcomingLessons": upcoming_payload["upcomingLessons"],
        "todayLessons": [lesson for lesson in upcoming_payload["upcomingLessons"] if lesson["isToday"]],
        "insights": _build_tutor_dashboard_insights(tutor, taxonomy, upcoming_payload),
        "schedule": _build_tutor_schedule(tutor, reference_date),
    }


def _split_post_content(content):
    paragraphs = []
    checklist = []

    for raw_line in (content or "").splitlines():
        line = raw_line.strip()
        if not line:
            continue

        if line.startswith("- ") or line.startswith("* "):
            item = line[2:].strip()
            if item:
                checklist.append(item)
            continue

        paragraphs.append(line)

    if not paragraphs and (content or "").strip():
        paragraphs = [(content or "").strip()]

    return {
        "paragraphs": paragraphs[:6],
        "checklist": checklist[:6],
    }


def _format_followers_count(followers_count):
    return f"{int(followers_count or 0):,}".replace(",", " ")


def _serialize_portal_post(post, custom_user=None):
    content_parts = _split_post_content(post.tresc)
    tutor = post.tutor
    localized_created_at = timezone.localtime(post.data_utworzenia)
    can_follow = _can_follow_tutor(tutor, custom_user)

    return {
        "id": post.pk,
        "tutorId": tutor.pk,
        "author": _build_display_name(tutor),
        "title": post.tytul,
        "canFollow": can_follow,
        "createdAt": localized_created_at.isoformat(),
        "dateLabel": localized_created_at.strftime("%d.%m.%Y o %H:%M"),
        "followers": _format_followers_count(tutor.followers_count),
        "followersCount": tutor.followers_count,
        "initials": _build_initials(tutor.uzytkownik.imie, tutor.uzytkownik.nazwisko),
        "isFollowed": _is_tutor_followed_by_user(tutor, custom_user) if can_follow else False,
        "avatarTone": tutor.avatar_tone or AVATAR_TONES[tutor.pk % len(AVATAR_TONES)],
        "tags": _build_tags(tutor.przedmioty.all()),
        "paragraphs": content_parts["paragraphs"],
        "checklist": content_parts["checklist"],
    }


def _serialize_observation(observation):
    tutor = observation.tutor
    return {
        "id": tutor.pk,
        "author": _build_display_name(tutor),
        "avatarTone": tutor.avatar_tone or AVATAR_TONES[tutor.pk % len(AVATAR_TONES)],
        "followersCount": tutor.followers_count,
        "followersLabel": _format_followers_count(tutor.followers_count),
        "initials": _build_initials(tutor.uzytkownik.imie, tutor.uzytkownik.nazwisko),
        "postsCount": tutor.posty.count(),
    }


def _sort_results_key(item):
    rating = item["rating"] or 0
    return (-item["score"], -rating, item["name"].lower())


def index(request):
    return render(request, "main/pages/home/index.html", {"home_props": _get_home_props(request)})



def component_preview(request, component_slug):
    preview_component = SUPPORTED_PREVIEW_COMPONENTS.get(component_slug)

    if preview_component is None:
        raise Http404('Unsupported preview component.')

    values = {
        'home_props': {
            **_get_home_props(request),
            'previewComponent': preview_component,
        },
    }

    return render(request, 'main/pages/home/index.html', values)

@login_required
def onboarding_account_type(request):
    next_target = _get_safe_next_target(request)
    values = {
        'home_props': {
            **_get_home_props(request),
            'onboardingMode': 'account-type',
            'onboardingNextTarget': next_target,
        },
    }

    return render(request, 'main/pages/home/index.html', values)

@login_required
def cars(request):
    values = {
        "cars": [
            {
                "car": "Nissan 350Z",
                "year": 2003,
                "drive_wheel": "rwd",
                "color": "orange",
                "price": "$35,000",
            },
            {
                "car": "Mitsubishi Lancer Evolution VIII",
                "year": 2004,
                "drive_wheel": "4wd",
                "color": "yellow",
                "price": "$36,000",
            },
            {
                "car": "Ford Mustang GT (Gen. 5)",
                "year": 2005,
                "drive_wheel": "rwd",
                "color": "red",
                "price": "$36,000",
            },
            {
                "car": "BMW M3 GTR (E46)",
                "year": 2005,
                "drive_wheel": "rwd",
                "color": "blue and gray",
                "price": "Priceless",
            },
        ],
    }

    return render(request, "main/pages/cars/index.html", values)


def about(request):
    return render(request, "main/pages/about/index.html")


def database_error_page(request):
    return render(request, "main/errors/database_error.html", status=500)


def tutor_search(request):
    filters = {
        "subject": request.GET.get("subject", "").strip(),
        "topic": request.GET.get("topic", "").strip(),
        "level": request.GET.get("level", "").strip(),
        "hour": request.GET.get("hour", "").strip(),
    }
    date_value = request.GET.get("date", "").strip()

    missing_fields = [key for key, value in filters.items() if not value]
    if not date_value:
        missing_fields.append("date")

    if missing_fields:
        return JsonResponse(
            {
                "detail": f"Brakuje wymaganych parametrow: {', '.join(missing_fields)}.",
            },
            status=400,
        )

    selected_date = _parse_iso_date(date_value)
    if selected_date is None:
        return JsonResponse({"detail": "Niepoprawny format daty. Oczekiwano YYYY-MM-DD."}, status=400)

    start_time, end_time = _parse_hour_range(filters["hour"])
    if start_time is None or end_time is None:
        return JsonResponse({"detail": "Niepoprawny format godziny. Oczekiwano HH:MM-HH:MM."}, status=400)

    tutors = (
        Tutor.objects.filter(przedmioty__nazwa=filters["subject"])
        .select_related("uzytkownik")
        .prefetch_related("przedmioty", "dostepnosci")
        .annotate(opinions_count=Count("opinie_dla", distinct=True))
        .distinct()
    )

    serialized_results = []
    for tutor in tutors:
        serialized_tutor = _serialize_tutor_result(tutor, filters, selected_date, start_time, end_time)
        if serialized_tutor is not None:
            serialized_results.append(serialized_tutor)

    exact_matches = sorted(
        [item for item in serialized_results if item["isExactMatch"]],
        key=_sort_results_key,
    )
    suggested_tutors = sorted(
        [item for item in serialized_results if not item["isExactMatch"] and item["score"] >= 12],
        key=_sort_results_key,
    )

    for collection in (exact_matches, suggested_tutors):
        for item in collection:
            item.pop("score", None)
            item.pop("isExactMatch", None)

    return JsonResponse(
        {
            "exactMatches": exact_matches,
            "suggestedTutors": suggested_tutors,
        }
    )


def tutor_profile_base(request):
    return JsonResponse(
        {
            "detail": "Uzyj endpointu /api/tutor-profile/<id> aby pobrac dane tutora.",
        }
    )


def tutor_profile(request, tutor_id):
    selected_date = _parse_iso_date((request.GET.get("date") or "").strip()) or date.today()
    custom_user = _get_custom_user_for_auth_user(request.user)

    tutor = (
        Tutor.objects.filter(pk=tutor_id)
        .select_related("uzytkownik")
        .prefetch_related("przedmioty", "dostepnosci", "opinie_dla__autor")
        .annotate(opinions_count=Count("opinie_dla", distinct=True))
        .first()
    )

    if tutor is None:
        return JsonResponse({"detail": "Nie znaleziono tutora."}, status=404)

    return JsonResponse(_serialize_tutor_profile(tutor, selected_date, custom_user=custom_user))


@login_required
def tutor_dashboard_data(request):
    tutor = _get_tutor_for_auth_user(request.user)

    if tutor is None:
        return JsonResponse(
            {"detail": "Dashboard tutora jest dostepny tylko dla konta korepetytora."},
            status=404,
        )

    return JsonResponse(_serialize_tutor_dashboard(tutor))


def portal_posts(request):
    if request.method == "GET":
        custom_user = _get_custom_user_for_auth_user(request.user)
        posts = (
            Post.objects.select_related("tutor__uzytkownik")
            .prefetch_related("tutor__przedmioty")
            .order_by("-data_utworzenia", "-pk")[:24]
        )

        return JsonResponse(
            {
                "posts": [_serialize_portal_post(post, custom_user=custom_user) for post in posts],
            }
        )

    if request.method != "POST":
        return JsonResponse({"detail": "Zla metoda."}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Zaloguj sie, aby dodac wpis."}, status=401)

    tutor = _get_tutor_for_auth_user(request.user)
    if tutor is None:
        return JsonResponse(
            {"detail": "Dodawanie wpisow jest dostepne tylko dla konta korepetytora."},
            status=403,
        )

    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Niepoprawne dane JSON."}, status=400)

    title = (payload.get("title") or "").strip()
    content = (payload.get("content") or "").strip()

    if len(title) < 4:
        return JsonResponse({"detail": "Tytul wpisu musi miec co najmniej 4 znaki."}, status=400)

    if len(content) < 12:
        return JsonResponse({"detail": "Tresc wpisu musi miec co najmniej 12 znakow."}, status=400)

    post = Post.objects.create(
        tutor=tutor,
        tytul=title,
        tresc=content,
    )
    post = (
        Post.objects.select_related("tutor__uzytkownik")
        .prefetch_related("tutor__przedmioty")
        .get(pk=post.pk)
    )

    return JsonResponse(
        {
            "message": "Wpis zostal opublikowany.",
            "post": _serialize_portal_post(post, custom_user=tutor.uzytkownik),
        },
        status=201,
    )


def portal_observations(request):
    if request.method == "GET":
        if not request.user.is_authenticated:
            return JsonResponse({"observations": []})

        custom_user = _get_or_create_custom_user_for_auth_user(request.user)
        if custom_user is None:
            return JsonResponse({"observations": []})

        observations = (
            Obserwacja.objects.filter(uzytkownik=custom_user)
            .select_related("tutor__uzytkownik")
            .prefetch_related("tutor__posty")
            .order_by("-data_utworzenia", "-pk")[:12]
        )

        return JsonResponse(
            {
                "observations": [_serialize_observation(observation) for observation in observations],
            }
        )

    if request.method != "POST":
        return JsonResponse({"detail": "Zla metoda."}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Zaloguj sie, aby obserwowac tutora."}, status=401)

    custom_user = _get_or_create_custom_user_for_auth_user(request.user)
    if custom_user is None:
        return JsonResponse({"detail": "Konto nie ma poprawnego adresu e-mail."}, status=400)

    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Niepoprawne dane JSON."}, status=400)

    tutor_id = payload.get("tutorId")
    try:
        tutor_id = int(tutor_id)
    except (TypeError, ValueError):
        return JsonResponse({"detail": "Brakuje poprawnego identyfikatora tutora."}, status=400)

    tutor = (
        Tutor.objects.filter(pk=tutor_id)
        .select_related("uzytkownik")
        .prefetch_related("posty")
        .first()
    )
    if tutor is None:
        return JsonResponse({"detail": "Nie znaleziono tutora do obserwowania."}, status=404)

    if tutor.uzytkownik_id == custom_user.pk:
        return JsonResponse({"detail": "Nie mozesz obserwowac wlasnego profilu."}, status=400)

    observation = Obserwacja.objects.filter(
        uzytkownik=custom_user,
        tutor=tutor,
    ).first()

    if observation is not None:
        observation.delete()
        followers_count = _refresh_tutor_followers_count(tutor)
        return JsonResponse(
            {
                "isFollowed": False,
                "message": "Tutor zostal usuniety z obserwowanych.",
                "observation": None,
                "tutorId": tutor.pk,
                "followersCount": followers_count,
            }
        )

    observation = Obserwacja.objects.create(
        uzytkownik=custom_user,
        tutor=tutor,
    )
    followers_count = _refresh_tutor_followers_count(tutor)
    observation = (
        Obserwacja.objects.filter(pk=observation.pk)
        .select_related("tutor__uzytkownik")
        .prefetch_related("tutor__posty")
        .get()
    )

    return JsonResponse(
        {
            "isFollowed": True,
            "message": "Tutor zostal dodany do obserwowanych.",
            "observation": _serialize_observation(observation),
            "tutorId": tutor.pk,
            "followersCount": followers_count,
        },
        status=201,
    )


def login_user(request):
    next_target = _get_safe_next_target(request)
    form_values = {
        "username": "",
    }

    if request.user.is_authenticated:
        return redirect(next_target or "home")

    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "")
        form_values["username"] = username

        if not username or not password:
            messages.error(request, "Uzupelnij nazwe uzytkownika i haslo.")
        else:
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect(next_target or "home")

            messages.error(request, "Nieprawidlowy login lub haslo.")

    return render(
        request,
        "main/auth/login.html",
        {
            "form_values": form_values,
            "next_target": next_target,
        },
    )


def register(request):
    next_target = _get_safe_next_target(request)
    form_values = {
        "email": "",
        "username": "",
    }

    if request.user.is_authenticated:
        return redirect(next_target or "home")

    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        normalized_email = User.objects.normalize_email(email).strip().lower()
        password = request.POST.get("password", "")
        password_confirm = request.POST.get("password_confirm", "")
        form_values = {
            "email": email,
            "username": username,
        }

        validation_error = _validate_registration_data(
            username=username,
            normalized_email=normalized_email,
            password=password,
            password_confirm=password_confirm,
        )
        if validation_error:
            messages.error(request, validation_error)
            return render(
                request,
                "main/auth/register.html",
                {
                    "form_values": form_values,
                    "next_target": next_target,
                },
            )

        try:
            user = _create_auth_and_custom_user(
                username=username,
                normalized_email=normalized_email,
                password=password,
            )
        except IntegrityError as exc:
            logger.exception("Database integrity error during register view: %s", exc)
            raise

        login(request, user)
        onboarding_url = reverse("onboarding_account_type")
        if next_target:
            onboarding_url = f'{onboarding_url}?{urlencode({"next": next_target})}'

        return redirect(onboarding_url)

    return render(
        request,
        "main/auth/register.html",
        {
            "form_values": form_values,
            "next_target": next_target,
        },
    )


def logout_user(request):
    logout(request)
    return redirect("home")


# === ENDPOINTY DO REACTA ===
@login_required
def tutor_onboarding_save(request):
    if request.method != "POST":
        return JsonResponse({"error": "Zla metoda"}, status=405)

    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Niepoprawne dane JSON."}, status=400)

    full_name = (payload.get("fullName") or "").strip()
    about = (payload.get("about") or "").strip()
    subjects = payload.get("subjects")
    school_levels = payload.get("schoolLevels")
    schedule_payload = payload.get("schedule") or {}
    schedule_days = schedule_payload.get("days") or []
    schedule_rows = schedule_payload.get("rows") or []

    if len(full_name) < 3:
        return JsonResponse({"error": "Podaj imie i nazwisko."}, status=400)

    if not isinstance(subjects, list) or not subjects:
        return JsonResponse({"error": "Wybierz przynajmniej jeden przedmiot."}, status=400)

    if not isinstance(schedule_days, list) or not isinstance(schedule_rows, list):
        return JsonResponse({"error": "Niepoprawny format harmonogramu."}, status=400)

    normalized_subjects = _normalize_string_list(subjects)
    if not normalized_subjects:
        return JsonResponse({"error": "Wybierz przynajmniej jeden przedmiot."}, status=400)

    normalized_school_levels = _normalize_string_list(school_levels)
    if not normalized_school_levels:
        single_school_level = str(payload.get("schoolLevel") or "").strip()
        if single_school_level:
            normalized_school_levels = [single_school_level]

    if not normalized_school_levels:
        return JsonResponse({"error": "Wybierz przynajmniej jeden poziom."}, status=400)

    first_name, last_name = _split_full_name(full_name, request.user.get_username())

    try:
        with transaction.atomic():
            auth_user = request.user
            auth_user.first_name = first_name
            auth_user.last_name = last_name
            auth_user.save(update_fields=["first_name", "last_name"])

            custom_user, _ = CustomUser.objects.get_or_create(
                email=auth_user.email,
                defaults={
                    "imie": first_name or auth_user.get_username(),
                    "nazwisko": last_name,
                    "haslo": "",
                    "typ": "tutor",
                },
            )
            custom_user.imie = first_name or auth_user.get_username()
            custom_user.nazwisko = last_name
            custom_user.typ = "tutor"
            custom_user.save(update_fields=["imie", "nazwisko", "typ"])

            tutor, _ = Tutor.objects.get_or_create(uzytkownik=custom_user)
            tutor.opis = about
            if not tutor.status_badges:
                tutor.status_badges = ["sprawny kontakt"]
            if not tutor.experience_label:
                tutor.experience_label = "Nowy korepetytor"
            tutor.save(update_fields=["opis", "status_badges", "experience_label"])

            tutor_subjects = []
            for subject_name in normalized_subjects:
                for school_level in normalized_school_levels:
                    subject_obj, _ = Przedmiot.objects.get_or_create(
                        nazwa=subject_name,
                        temat="Powtorka",
                        poziom=school_level,
                    )
                    tutor_subjects.append(subject_obj)
            tutor.przedmioty.set(tutor_subjects)

            tutor.dostepnosci.all().delete()
            available_slots = 0
            for row in schedule_rows:
                time_label = (row.get("timeLabel") or "").strip()
                row_slots = row.get("slots") or []
                if not isinstance(row_slots, list):
                    continue

                start_time, end_time = _parse_time_label(time_label)
                if start_time is None or end_time is None:
                    continue

                for day_index, slot_status in enumerate(row_slots):
                    if day_index >= len(schedule_days):
                        continue

                    if slot_status != "available":
                        continue

                    day_data = schedule_days[day_index] or {}
                    weekday = day_data.get("weekday")
                    try:
                        weekday_index = int(weekday)
                    except (TypeError, ValueError):
                        weekday_index = day_index

                    if weekday_index < 0 or weekday_index > 6:
                        weekday_index = day_index % 7

                    Dostepnosc.objects.create(
                        tutor=tutor,
                        dzien_tygodnia=weekday_index,
                        godzina_od=start_time,
                        godzina_do=end_time,
                        data=None,
                    )
                    available_slots += 1

    except IntegrityError as exc:
        logger.exception("Database integrity error during tutor onboarding save: %s", exc)
        raise

    return JsonResponse(
        {
            "message": "Profil tutora zapisany.",
            "availableSlots": available_slots,
            "tutorId": tutor.pk,
        }
    )


@csrf_exempt
def api_register(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            username = (data.get("username") or "").strip()
            password = data.get("password") or ""
            email = (data.get("email") or "").strip()
            normalized_email = User.objects.normalize_email(email).strip().lower()

            validation_error = _validate_registration_data(
                username=username,
                normalized_email=normalized_email,
                password=password,
            )
            if validation_error:
                return JsonResponse({"error": validation_error}, status=400)

            user = _create_auth_and_custom_user(
                username=username,
                normalized_email=normalized_email,
                password=password,
            )

            login(request, user)

            return JsonResponse({
                "message": "Zarejestrowano pomyslnie",
                "user": {"username": user.username, "email": user.email},
            })
        except IntegrityError as exc:
            logger.exception("Database integrity error during api_register: %s", exc)
            raise
        except json.JSONDecodeError:
            return JsonResponse({"error": "Niepoprawne dane JSON."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Zla metoda"}, status=405)

def api_current_user(request):
    if request.user.is_authenticated:
        return JsonResponse({
            'is_logged_in': True,
            'username': request.user.username,
            'email': request.user.email,
        })
    return JsonResponse({'is_logged_in': False}, status=401)

