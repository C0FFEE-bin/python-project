import { parseIsoDate, toIsoDate } from "./utils/dateHelpers.js";

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
        options: ["Podstawowka", "Szkola srednia", "Studia"],
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
    level: "Szkola srednia",
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
        levels: ["Szkola srednia"],
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
        levels: ["Szkola srednia", "Podstawowka"],
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
        levels: ["Szkola srednia", "Studia"],
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
        levels: ["Podstawowka", "Szkola srednia"],
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
        levels: ["Szkola srednia"],
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
        levels: ["Szkola srednia", "Studia"],
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
        levels: ["Szkola srednia"],
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
        levels: ["Szkola srednia", "Studia"],
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
        levels: ["Szkola srednia", "Studia"],
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
        levels: ["Szkola srednia", "Studia"],
        hours: ["18:00-19:00", "19:00-20:00"],
        availableDates: ["2026-03-11", "2026-03-14"],
    },
];

const reviewAuthors = [
    "Kacper Kubica",
    "Anna Maj",
    "Julia Wrona",
    "Marek Nowicki",
    "Karolina Lis",
];

const reviewMessages = [
    "Zajecia byly dobrze przygotowane, a material zostal wyjasniony spokojnie i bardzo konkretnie.",
    "Tempo pracy bylo dopasowane do mnie, a po kilku spotkaniach bylo widac wyrazna poprawe.",
    "Bardzo dobry kontakt, duzo cierpliwosci i konkretne wskazowki do dalszej nauki.",
    "Polecam za jasne tlumaczenie i sensowne rozpisanie planu nauki przed sprawdzianem.",
    "Spotkania przebiegaly sprawnie, a zadania byly omawiane krok po kroku bez chaosu.",
];

const scheduleTimeRanges = [
    "18:00-19:00",
    "19:00-20:00",
    "20:00-21:00",
    "21:00-22:00",
];

function formatShortDateLabel(value) {
    const date = parseIsoDate(value);

    if (!date) {
        return "--.--";
    }

    return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildScheduleDays(availableDates) {
    const uniqueDates = [...new Set(availableDates)].sort();
    const baseDate = parseIsoDate(uniqueDates[0] ?? defaultSearchDate) ?? parseIsoDate(defaultSearchDate);
    const days = uniqueDates.slice(0, 5).map((iso) => ({
        iso,
        label: formatShortDateLabel(iso),
    }));

    let dayOffset = 0;
    while (days.length < 5 && baseDate) {
        const nextDate = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            baseDate.getDate() + dayOffset,
        );
        const nextIso = toIsoDate(nextDate);

        if (!days.some((day) => day.iso === nextIso)) {
            days.push({
                iso: nextIso,
                label: formatShortDateLabel(nextIso),
            });
        }

        dayOffset += 1;
    }

    return days;
}

function buildAboutParagraphs(profile) {
    const subjectsLabel = profile.subjects.join(", ").toLowerCase();
    const levelsLabel = profile.levels.join(", ").toLowerCase();
    const leadSubject = profile.subjects[0]?.toLowerCase() ?? "przedmiotow scislych";
    const firstName = profile.name.split(" ")[0] ?? profile.name;

    return [
        `${firstName} prowadzi zajecia z ${subjectsLabel} i wspiera uczniow na poziomie ${levelsLabel}.`,
        `Podczas spotkan stawia na spokojne tlumaczenie krok po kroku, jasne przyklady i tempo dopasowane do potrzeb ucznia.`,
        `Jesli potrzebujesz wsparcia z ${leadSubject} przed sprawdzianem, matura albo do regularnej pracy w tygodniu, ten profil jest przygotowany pod szybki kontakt.`,
    ];
}

function buildReview(profile) {
    const reviewIndex = profile.name.length % reviewAuthors.length;

    return {
        author: reviewAuthors[reviewIndex],
        dateLabel: "21.03.2025",
        rating: 5,
        content: reviewMessages[reviewIndex],
    };
}

function buildSchedule(profile) {
    const scheduleDays = buildScheduleDays(profile.availableDates);
    const availableDatesSet = new Set(profile.availableDates);
    const availableHoursSet = new Set(profile.hours);

    return {
        days: scheduleDays,
        rows: scheduleTimeRanges.map((timeRange) => ({
            timeLabel: timeRange.slice(0, 5),
            slots: scheduleDays.map((day) => {
                if (!availableDatesSet.has(day.iso)) {
                    return "unavailable";
                }

                return availableHoursSet.has(timeRange) ? "available" : "limited";
            }),
        })),
    };
}

export function buildTutorProfileHref(tutorId) {
    return `?view=results&tutor=${encodeURIComponent(tutorId)}#tutor-profile`;
}

export function getTutorProfileById(tutorId) {
    const tutor = tutorProfiles.find((profile) => profile.id === tutorId);

    if (!tutor) {
        return null;
    }

    const followersCount = new Intl.NumberFormat("pl-PL").format(Math.max(120, tutor.opinions * 18 + 95));

    return {
        ...tutor,
        aboutParagraphs: buildAboutParagraphs(tutor),
        followersCount,
        profileUrl: buildTutorProfileHref(tutor.id),
        review: buildReview(tutor),
        schedule: buildSchedule(tutor),
    };
}

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
            profileUrl: buildTutorProfileHref(profile.id),
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
