import re

from django import forms


DEFAULT_TUTOR_SUBJECT_OPTIONS = (
    "Matematyka",
    "Jezyk Polski",
    "Jezyk Angielski",
    "Fizyka",
    "Chemia",
    "Biologia",
    "Informatyka",
    "Geografia",
    "Historia",
    "Jezyk Niemiecki",
)

DEFAULT_TUTOR_LEVEL_OPTIONS = (
    "Podstawowka",
    "Szkola srednia",
    "Studia",
)

AVATAR_TONE_CHOICES = (
    ("violet", "Violet"),
    ("stone", "Stone"),
    ("gold", "Gold"),
    ("slate", "Slate"),
    ("rose", "Rose"),
    ("mint", "Mint"),
    ("ocean", "Ocean"),
    ("coral", "Coral"),
    ("indigo", "Indigo"),
    ("forest", "Forest"),
)


class TutorProfileSettingsForm(forms.Form):
    full_name = forms.CharField(
        max_length=120,
        label="Imie i nazwisko",
        widget=forms.TextInput(
            attrs={
                "class": "tutor-profile-settings__input",
                "placeholder": "Np. Tomasz Kowalski",
            }
        ),
    )
    phone = forms.CharField(
        required=False,
        max_length=20,
        label="Telefon",
        widget=forms.TextInput(
            attrs={
                "class": "tutor-profile-settings__input",
                "placeholder": "Np. 500 600 700",
            }
        ),
    )
    about = forms.CharField(
        required=False,
        max_length=1200,
        label="O mnie",
        widget=forms.Textarea(
            attrs={
                "class": "tutor-profile-settings__textarea",
                "rows": 6,
                "placeholder": "Opisz, jak prowadzisz zajecia i z czym pomagasz uczniom.",
            }
        ),
    )
    hourly_rate = forms.DecimalField(
        required=False,
        min_value=0,
        max_digits=10,
        decimal_places=2,
        label="Stawka za godzine",
        widget=forms.NumberInput(
            attrs={
                "class": "tutor-profile-settings__input",
                "placeholder": "Np. 95",
                "step": "0.01",
                "min": "0",
            }
        ),
    )
    age = forms.IntegerField(
        required=False,
        min_value=16,
        max_value=99,
        label="Wiek",
        widget=forms.NumberInput(
            attrs={
                "class": "tutor-profile-settings__input",
                "placeholder": "Np. 24",
                "min": "16",
                "max": "99",
            }
        ),
    )
    experience_label = forms.CharField(
        required=False,
        max_length=120,
        label="Naglowek doswiadczenia",
        widget=forms.TextInput(
            attrs={
                "class": "tutor-profile-settings__input",
                "placeholder": "Np. 4 lata pracy z matura rozszerzona",
            }
        ),
    )
    avatar_image_url = forms.CharField(
        required=False,
        max_length=500,
        label="Zdjecie profilowe",
        widget=forms.TextInput(
            attrs={
                "class": "tutor-profile-settings__input",
                "placeholder": "Wklej link do avatara, np. https://...",
            }
        ),
    )
    cover_image_url = forms.CharField(
        required=False,
        max_length=500,
        label="Tlo profilu",
        widget=forms.TextInput(
            attrs={
                "class": "tutor-profile-settings__input",
                "placeholder": "Wklej link do tla profilu albo /static/...",
            }
        ),
    )
    avatar_tone = forms.ChoiceField(
        choices=AVATAR_TONE_CHOICES,
        label="Kolor avatara",
        required=False,
        widget=forms.RadioSelect(),
    )
    status_badges = forms.CharField(
        required=False,
        max_length=240,
        label="Wyroznienia",
        widget=forms.TextInput(
            attrs={
                "class": "tutor-profile-settings__input",
                "placeholder": "Np. sprawny kontakt, zajecia online, matura 2026",
            }
        ),
    )
    subjects = forms.MultipleChoiceField(
        choices=(),
        label="Przedmioty",
        required=False,
        widget=forms.CheckboxSelectMultiple(),
    )
    levels = forms.MultipleChoiceField(
        choices=(),
        label="Poziomy nauczania",
        required=False,
        widget=forms.CheckboxSelectMultiple(),
    )

    def __init__(self, *args, subject_choices=None, level_choices=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["subjects"].choices = subject_choices or [
            (value, value) for value in DEFAULT_TUTOR_SUBJECT_OPTIONS
        ]
        self.fields["levels"].choices = level_choices or [
            (value, value) for value in DEFAULT_TUTOR_LEVEL_OPTIONS
        ]

    def clean_full_name(self):
        full_name = (self.cleaned_data.get("full_name") or "").strip()
        if len(full_name) < 3:
            raise forms.ValidationError("Podaj imie i nazwisko.")
        return full_name

    def clean_status_badges(self):
        raw_value = (self.cleaned_data.get("status_badges") or "").strip()
        if not raw_value:
            return []

        badges = []
        for chunk in re.split(r"[\n,]+", raw_value):
            badge = chunk.strip()
            if badge and badge not in badges:
                badges.append(badge[:40])

        return badges[:4]

    def _clean_optional_image_reference(self, field_name):
        value = (self.cleaned_data.get(field_name) or "").strip()
        if not value:
            return ""

        allowed_prefixes = ("http://", "https://", "/")
        if not value.startswith(allowed_prefixes):
            raise forms.ValidationError("Podaj pelny adres http(s) albo sciezke zaczynajaca sie od /.")

        return value

    def clean_avatar_image_url(self):
        return self._clean_optional_image_reference("avatar_image_url")

    def clean_cover_image_url(self):
        return self._clean_optional_image_reference("cover_image_url")
