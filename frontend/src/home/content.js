export const navLinks = [
    { id: "home", label: "Home" },
    { id: "portal", label: "Portal" },
    { id: "wyszukiwarka", label: "Wyszukiwarka" },
    { id: "kontakt", label: "Kontakt" },
];

export const metrics = [
    { value: "120+", label: "aktywnych tutorow" },
    { value: "24h", label: "na pierwsze dopasowanie" },
    { value: "online", label: "spotkania i kontakt" },
];

export const portalCards = [
    {
        icon: "fa-solid fa-user-graduate",
        title: "Portal ucznia",
        text: "Jedno miejsce na przeglad tutorow, zapisane preferencje i szybki start zajec.",
    },
    {
        icon: "fa-solid fa-calendar-check",
        title: "Plan spotkan",
        text: "Umawianie godzin, status dostepnosci i przejrzysta organizacja calego tygodnia.",
    },
    {
        icon: "fa-solid fa-comments",
        title: "Kontakt 1:1",
        text: "Krotka sciezka od pierwszej wiadomosci do regularnych konsultacji online lub stacjonarnie.",
    },
];

function buildTimeOptions() {
    const options = [];

    for (let hour = 7; hour <= 20; hour += 1) {
        for (let minute = 0; minute < 60; minute += 30) {
            options.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
        }
    }

    return options;
}

export const searchFilterDefinitions = [
    {
        key: "subject",
        placeholder: "Przedmiot",
        variant: "search-pill--dark",
        ariaLabel: "Wybierz przedmiot",
        options: ["Fizyka", "Matematyka", "Chemia", "Biologia"],
    },
    {
        key: "topic",
        placeholder: "Temat",
        variant: "search-pill--light",
        ariaLabel: "Wybierz temat",
        options: ["Mechanika", "Algebra", "Matura", "Powtorka"],
    },
    {
        key: "level",
        placeholder: "Poziom",
        variant: "search-pill--light",
        ariaLabel: "Wybierz poziom",
        options: ["Podstawowy", "Sredni (rozsz.)", "Maturalny", "Studia"],
    },
    {
        key: "hour",
        placeholder: "Godzina",
        variant: "search-pill--dark",
        ariaLabel: "Wybierz godzine",
        options: buildTimeOptions(),
    },
];

export const defaultSearchSelections = {
    subject: "Fizyka",
    topic: "Mechanika",
    level: "Sredni (rozsz.)",
    hour: "17:30",
};

export const defaultSearchDate = "2026-03-11";

export const weekdayLabels = ["pon.", "wt.", "sr.", "czw.", "pt.", "sob.", "niedz."];
