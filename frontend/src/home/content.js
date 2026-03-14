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
        options: ["16:00", "17:00", "18:30", "20:00"],
    },
];

export const defaultSearchSelections = {
    subject: "Fizyka",
    topic: "Mechanika",
    level: "Sredni (rozsz.)",
    hour: "17:00",
};

export const calendarDays = [
    { day: "23", label: "23 lutego", muted: true, value: "2026-02-23" },
    { day: "24", label: "24 lutego", muted: true, value: "2026-02-24" },
    { day: "25", label: "25 lutego", muted: true, value: "2026-02-25" },
    { day: "26", label: "26 lutego", muted: true, value: "2026-02-26" },
    { day: "27", label: "27 lutego", muted: true, value: "2026-02-27" },
    { day: "28", label: "28 lutego", muted: true, value: "2026-02-28" },
    { day: "1", label: "1 marca", value: "2026-03-01" },
    { day: "2", label: "2 marca", value: "2026-03-02" },
    { day: "3", label: "3 marca", value: "2026-03-03" },
    { day: "4", label: "4 marca", value: "2026-03-04" },
    { day: "5", label: "5 marca", value: "2026-03-05" },
    { day: "6", label: "6 marca", value: "2026-03-06" },
    { day: "7", label: "7 marca", value: "2026-03-07" },
    { day: "8", label: "8 marca", value: "2026-03-08" },
    { day: "9", label: "9 marca", value: "2026-03-09" },
    { day: "10", label: "10 marca", value: "2026-03-10" },
    { day: "11", label: "11 marca", value: "2026-03-11" },
    { day: "12", label: "12 marca", value: "2026-03-12" },
    { day: "13", label: "13 marca", value: "2026-03-13" },
    { day: "14", label: "14 marca", value: "2026-03-14" },
    { day: "15", label: "15 marca", value: "2026-03-15" },
    { day: "16", label: "16 marca", value: "2026-03-16" },
    { day: "17", label: "17 marca", value: "2026-03-17" },
    { day: "18", label: "18 marca", value: "2026-03-18" },
    { day: "19", label: "19 marca", value: "2026-03-19" },
    { day: "20", label: "20 marca", value: "2026-03-20" },
    { day: "21", label: "21 marca", value: "2026-03-21" },
    { day: "22", label: "22 marca", value: "2026-03-22" },
    { day: "23", label: "23 marca", value: "2026-03-23" },
    { day: "24", label: "24 marca", value: "2026-03-24" },
    { day: "25", label: "25 marca", value: "2026-03-25" },
    { day: "26", label: "26 marca", value: "2026-03-26" },
    { day: "27", label: "27 marca", value: "2026-03-27" },
    { day: "28", label: "28 marca", value: "2026-03-28" },
    { day: "29", label: "29 marca", value: "2026-03-29" },
    { day: "30", label: "30 marca", value: "2026-03-30" },
    { day: "31", label: "31 marca", value: "2026-03-31" },
    { day: "1", label: "1 kwietnia", muted: true, value: "2026-04-01" },
    { day: "2", label: "2 kwietnia", muted: true, value: "2026-04-02" },
    { day: "3", label: "3 kwietnia", muted: true, value: "2026-04-03" },
    { day: "4", label: "4 kwietnia", muted: true, value: "2026-04-04" },
    { day: "5", label: "5 kwietnia", muted: true, value: "2026-04-05" },
];

export const defaultSearchDate = "2026-03-11";

export const weekdayLabels = ["pon.", "wt.", "sr.", "czw.", "pt.", "sob.", "niedz."];
