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
        const startLabel = `${String(hour).padStart(2, "0")}:00`;
        const endLabel = `${String(hour + 1).padStart(2, "0")}:00`;
        options.push(`${startLabel}-${endLabel}`);
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
        showInResultsSidebar: true,
    },
    {
        key: "topic",
        placeholder: "Temat",
        variant: "search-pill--light",
        ariaLabel: "Wybierz temat",
        options: ["Mechanika", "Algebra", "Matura", "Powtorka"],
        showInResultsSidebar: false,
    },
    {
        key: "level",
        placeholder: "Poziom",
        variant: "search-pill--light",
        ariaLabel: "Wybierz poziom",
        options: ["Podstawowka", "Liceum", "Technikum", "Studia"],
        showInResultsSidebar: true,
    },
    {
        key: "hour",
        placeholder: "Godzina",
        variant: "search-pill--dark",
        ariaLabel: "Wybierz godzine",
        options: buildTimeOptions(),
        showInResultsSidebar: true,
    },
];

export const searchResultsSidebarDefinitions = searchFilterDefinitions
    .filter((filter) => filter.showInResultsSidebar);

export const defaultSearchSelections = {
    subject: "Matematyka",
    topic: "Algebra",
    level: "Liceum",
    hour: "19:00-20:00",
};

export const defaultSearchDate = "2026-03-11";

export const weekdayLabels = ["pon.", "wt.", "sr.", "czw.", "pt.", "sob.", "niedz."];

const tutorProfiles = [
    {
        id: "lukasz-gamon",
        initials: "LG",
        avatarTone: "violet",
        name: "Lukasz Gamon",
        age: 21,
        rating: 4.5,
        opinions: 56,
        experience: "2 lata doswiadczenia",
        statusBadges: ["sprawny kontakt", "wolne terminy"],
        tags: ["Matematyka", "Fizyka", "Informatyka"],
        subjects: ["Matematyka", "Fizyka", "Informatyka"],
        topics: ["Algebra", "Mechanika", "Matura"],
        levels: ["Liceum", "Technikum"],
        hours: ["18:00-19:00", "19:00-20:00"],
        availableDates: ["2026-03-11", "2026-03-13"],
    },
    {
        id: "aleksandra-gawron",
        initials: "AG",
        avatarTone: "stone",
        name: "Aleksandra Gawron",
        age: 38,
        rating: 5.0,
        opinions: 6,
        experience: "pol roku doswiadczenia",
        statusBadges: ["sprawny kontakt", "wolne terminy"],
        tags: ["Matematyka", "Fizyka"],
        subjects: ["Matematyka", "Fizyka"],
        topics: ["Algebra", "Powtorka"],
        levels: ["Liceum", "Podstawowka"],
        hours: ["19:00-20:00"],
        availableDates: ["2026-03-11", "2026-03-12"],
    },
    {
        id: "sebastian-kowalski",
        initials: "SK",
        avatarTone: "gold",
        name: "Sebastian Kowalski",
        age: 31,
        rating: 4.8,
        opinions: 32,
        experience: "6 lat doswiadczenia",
        statusBadges: ["sprawny kontakt", "wolne terminy", "nauczyciel"],
        tags: ["Matematyka", "Fizyka", "Jezyk hiszpanski"],
        subjects: ["Matematyka", "Fizyka"],
        topics: ["Algebra", "Matura"],
        levels: ["Liceum", "Studia"],
        hours: ["19:00-20:00", "20:00-21:00"],
        availableDates: ["2026-03-11", "2026-03-14"],
    },
    {
        id: "tomasz-swiety",
        initials: "TS",
        avatarTone: "slate",
        name: "Tomasz Swiety",
        age: 51,
        rating: 4.7,
        opinions: 103,
        experience: "2 lata doswiadczenia",
        statusBadges: ["sprawny kontakt", "nauczyciel"],
        tags: ["Matematyka", "Jezyk angielski"],
        subjects: ["Matematyka"],
        topics: ["Matura", "Powtorka"],
        levels: ["Podstawowka", "Liceum"],
        hours: ["17:00-18:00", "18:00-19:00"],
        availableDates: ["2026-03-11", "2026-03-12"],
    },
    {
        id: "julia-serwan",
        initials: "JS",
        avatarTone: "rose",
        name: "Julia Serwan",
        age: 22,
        rating: 5.0,
        opinions: 5,
        experience: "nowy korepetytor",
        statusBadges: ["sprawny kontakt", "wolne terminy"],
        tags: ["Matematyka", "Fizyka"],
        subjects: ["Matematyka", "Fizyka"],
        topics: ["Algebra", "Powtorka"],
        levels: ["Liceum", "Technikum"],
        hours: ["18:00-19:00", "20:00-21:00"],
        availableDates: ["2026-03-11", "2026-03-15"],
    },
    {
        id: "natalia-pawlak",
        initials: "NP",
        avatarTone: "mint",
        name: "Natalia Pawlak",
        age: 29,
        rating: 4.9,
        opinions: 18,
        experience: "4 lata doswiadczenia",
        statusBadges: ["sprawny kontakt", "wolne terminy"],
        tags: ["Matematyka", "Chemia"],
        subjects: ["Matematyka", "Chemia"],
        topics: ["Algebra", "Matura"],
        levels: ["Liceum", "Studia"],
        hours: ["19:00-20:00"],
        availableDates: ["2026-03-14", "2026-03-15"],
    },
    {
        id: "jakub-morek",
        initials: "JM",
        avatarTone: "ocean",
        name: "Jakub Morek",
        age: 26,
        rating: 4.7,
        opinions: 41,
        experience: "3 lata doswiadczenia",
        statusBadges: ["sprawny kontakt", "wolne terminy"],
        tags: ["Matematyka", "Informatyka"],
        subjects: ["Matematyka", "Informatyka"],
        topics: ["Algebra", "Powtorka"],
        levels: ["Liceum", "Technikum"],
        hours: ["20:00-21:00"],
        availableDates: ["2026-03-11", "2026-03-16"],
    },
    {
        id: "klaudia-nowak",
        initials: "KN",
        avatarTone: "coral",
        name: "Klaudia Nowak",
        age: 33,
        rating: 4.9,
        opinions: 24,
        experience: "5 lat doswiadczenia",
        statusBadges: ["sprawny kontakt", "wolne terminy"],
        tags: ["Chemia", "Biologia"],
        subjects: ["Chemia", "Biologia"],
        topics: ["Matura", "Powtorka"],
        levels: ["Liceum", "Studia"],
        hours: ["19:00-20:00"],
        availableDates: ["2026-03-11", "2026-03-13"],
    },
    {
        id: "oskar-madej",
        initials: "OM",
        avatarTone: "indigo",
        name: "Oskar Madej",
        age: 27,
        rating: 4.8,
        opinions: 27,
        experience: "4 lata doswiadczenia",
        statusBadges: ["sprawny kontakt", "wolne terminy", "nauczyciel"],
        tags: ["Fizyka", "Informatyka"],
        subjects: ["Fizyka", "Informatyka"],
        topics: ["Mechanika", "Algebra"],
        levels: ["Liceum", "Studia"],
        hours: ["19:00-20:00", "20:00-21:00"],
        availableDates: ["2026-03-11", "2026-03-12"],
    },
    {
        id: "monika-zielinska",
        initials: "MZ",
        avatarTone: "forest",
        name: "Monika Zielinska",
        age: 35,
        rating: 4.9,
        opinions: 42,
        experience: "7 lat doswiadczenia",
        statusBadges: ["sprawny kontakt", "wolne terminy"],
        tags: ["Biologia", "Chemia"],
        subjects: ["Biologia", "Chemia"],
        topics: ["Matura", "Powtorka"],
        levels: ["Liceum", "Studia"],
        hours: ["18:00-19:00", "19:00-20:00"],
        availableDates: ["2026-03-11", "2026-03-14"],
    },
];

function hasMatch(values, selectedValue) {
    return values.includes(selectedValue);
}

function getTutorSearchScore(profile, filters, date) {
    if (!hasMatch(profile.subjects, filters.subject)) {
        return -1;
    }

    let score = 6;

    if (hasMatch(profile.topics, filters.topic)) {
        score += 2;
    }

    if (hasMatch(profile.levels, filters.level)) {
        score += 4;
    }

    if (hasMatch(profile.hours, filters.hour)) {
        score += 5;
    }

    if (hasMatch(profile.availableDates, date)) {
        score += 3;
    }

    if (profile.statusBadges.includes("wolne terminy")) {
        score += 1;
    }

    return score;
}

function isExactTutorMatch(profile, filters, date) {
    return (
        hasMatch(profile.subjects, filters.subject)
        && hasMatch(profile.levels, filters.level)
        && hasMatch(profile.hours, filters.hour)
        && hasMatch(profile.availableDates, date)
    );
}

function compareTutors(firstTutor, secondTutor) {
    if (secondTutor.score !== firstTutor.score) {
        return secondTutor.score - firstTutor.score;
    }

    if (secondTutor.rating !== firstTutor.rating) {
        return secondTutor.rating - firstTutor.rating;
    }

    return secondTutor.opinions - firstTutor.opinions;
}

export function getTutorSearchResults(filters, date) {
    const profilesWithScore = tutorProfiles
        .map((profile) => ({
            ...profile,
            score: getTutorSearchScore(profile, filters, date),
        }))
        .filter((profile) => profile.score >= 0);

    const exactMatches = profilesWithScore
        .filter((profile) => isExactTutorMatch(profile, filters, date))
        .sort(compareTutors);

    const suggestedTutors = profilesWithScore
        .filter((profile) => !isExactTutorMatch(profile, filters, date))
        .filter((profile) => profile.score >= 12)
        .sort(compareTutors);

    return {
        exactMatches,
        suggestedTutors,
    };
}
