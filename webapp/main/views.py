from datetime import datetime

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import redirect, render
from django.templatetags.static import static
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme

from .models import Tutor

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
            "register": reverse("register_user"),
            "tutorSearch": reverse("tutor_search"),
        },
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


def _get_weekday_candidates(selected_date):
    weekday = selected_date.weekday()
    return {weekday, weekday + 1}


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

    has_topic = any((przedmiot.temat or "") == filters["topic"] for przedmiot in subject_matches)
    has_level = any((przedmiot.poziom or "") == filters["level"] for przedmiot in subject_matches)

    weekday_candidates = _get_weekday_candidates(selected_date)
    matching_day_slots = [
        slot for slot in tutor.dostepnosci.all() if slot.dzien_tygodnia in weekday_candidates
    ]
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

    first_name = (tutor.uzytkownik.imie or "").strip()
    last_name = (tutor.uzytkownik.nazwisko or "").strip()
    display_name = " ".join(part for part in (first_name, last_name) if part) or tutor.uzytkownik.email
    hourly_rate = (
        f"Stawka {tutor.stawka_godzinowa:.2f} zl/h"
        if tutor.stawka_godzinowa is not None
        else "Profil gotowy do kontaktu"
    )
    status_badges = []
    if has_hour:
        status_badges.append("wolne terminy")
    elif has_date:
        status_badges.append("dostepny tego dnia")

    rating = float(tutor.rating) if tutor.rating is not None else None

    return {
        "id": tutor.pk,
        "name": display_name,
        "initials": _build_initials(first_name, last_name),
        "avatarTone": AVATAR_TONES[tutor.pk % len(AVATAR_TONES)],
        "age": None,
        "rating": rating,
        "opinions": 0,
        "experience": hourly_rate,
        "statusBadges": status_badges,
        "tags": _build_tags(przedmioty),
        "score": score,
        "isExactMatch": has_level and has_hour and has_date,
    }


def _sort_results_key(item):
    rating = item["rating"] or 0
    return (-item["score"], -rating, item["name"].lower())


def index(request):
    return render(request, "main/pages/home/index.html", {"home_props": _get_home_props(request)})


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
        password = request.POST.get("password", "")
        password_confirm = request.POST.get("password_confirm", "")
        form_values = {
            "email": email,
            "username": username,
        }

        if not username or not email or not password or not password_confirm:
            messages.error(request, "Uzupelnij wszystkie pola formularza.")
            return render(
                request,
                "main/auth/register.html",
                {
                    "form_values": form_values,
                    "next_target": next_target,
                },
            )

        if password != password_confirm:
            messages.error(request, "Hasla musza byc takie same.")
            return render(
                request,
                "main/auth/register.html",
                {
                    "form_values": form_values,
                    "next_target": next_target,
                },
            )

        if User.objects.filter(username=username).exists():
            messages.error(request, "Ta nazwa uzytkownika jest juz zajeta.")
            return render(
                request,
                "main/auth/register.html",
                {
                    "form_values": form_values,
                    "next_target": next_target,
                },
            )

        if User.objects.filter(email__iexact=email).exists():
            messages.error(request, "Konto z tym adresem e-mail juz istnieje.")
            return render(
                request,
                "main/auth/register.html",
                {
                    "form_values": form_values,
                    "next_target": next_target,
                },
            )

        user = User.objects.create_user(username, email, password)
        login(request, user)
        return redirect(next_target or "home")

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
