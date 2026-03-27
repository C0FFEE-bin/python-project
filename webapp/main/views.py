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
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.csrf import csrf_exempt

# Importujemy Twój customowy model User pod aliasem, żeby nie nadpisał domyślnego User z Django
from .models import Dostepnosc, Przedmiot, Tutor, User as CustomUser

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
        current_user = {
            "email": request.user.email,
            "username": request.user.get_username(),
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
            "onboarding": reverse("onboarding_account_type"),
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


def _serialize_tutor_profile(tutor, selected_date):
    przedmioty = list(tutor.przedmioty.all())
    rating = float(tutor.rating) if tutor.rating is not None else 0.0
    opinions_count = getattr(tutor, "opinions_count", None)
    if opinions_count is None:
        opinions_count = tutor.opinie_dla.count()

    followers_count = tutor.followers_count or max(120, opinions_count * 18 + 95)

    return {
        "id": tutor.pk,
        "name": _build_display_name(tutor),
        "initials": _build_initials(tutor.uzytkownik.imie, tutor.uzytkownik.nazwisko),
        "avatarTone": tutor.avatar_tone or AVATAR_TONES[tutor.pk % len(AVATAR_TONES)],
        "age": tutor.wiek,
        "rating": rating,
        "opinions": opinions_count,
        "experience": _build_experience_label(tutor),
        "followersCount": followers_count,
        "statusBadges": _build_status_badges(tutor),
        "tags": _build_tags(przedmioty),
        "aboutParagraphs": _build_about_paragraphs(tutor, przedmioty),
        "review": _build_review_payload(tutor, rating),
        "schedule": _build_tutor_schedule(tutor, selected_date),
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

    tutor = (
        Tutor.objects.filter(pk=tutor_id)
        .select_related("uzytkownik")
        .prefetch_related("przedmioty", "dostepnosci", "opinie_dla__autor")
        .annotate(opinions_count=Count("opinie_dla", distinct=True))
        .first()
    )

    if tutor is None:
        return JsonResponse({"detail": "Nie znaleziono tutora."}, status=404)

    return JsonResponse(_serialize_tutor_profile(tutor, selected_date))


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
    school_level = (payload.get("schoolLevel") or "").strip() or None
    schedule_payload = payload.get("schedule") or {}
    schedule_days = schedule_payload.get("days") or []
    schedule_rows = schedule_payload.get("rows") or []

    if len(full_name) < 3:
        return JsonResponse({"error": "Podaj imie i nazwisko."}, status=400)

    if not isinstance(subjects, list) or not subjects:
        return JsonResponse({"error": "Wybierz przynajmniej jeden przedmiot."}, status=400)

    if not isinstance(schedule_days, list) or not isinstance(schedule_rows, list):
        return JsonResponse({"error": "Niepoprawny format harmonogramu."}, status=400)

    normalized_subjects = [
        str(subject).strip()
        for subject in subjects
        if str(subject).strip()
    ]
    if not normalized_subjects:
        return JsonResponse({"error": "Wybierz przynajmniej jeden przedmiot."}, status=400)

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

