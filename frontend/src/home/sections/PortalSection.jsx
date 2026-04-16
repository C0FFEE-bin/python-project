import { useEffect, useState } from "react";

import {
    createPortalPost,
    fetchPortalObservations,
    fetchPortalPosts,
} from "../api.js";
import Reveal from "../components/Reveal.jsx";
import joinClasses from "../utils/joinClasses.js";

const SIDEBAR_SECTIONS = [
    {
        title: "Glowne zakladki",
        items: [
            { id: "posts", icon: "fa-solid fa-pen-to-square", label: "Wpisy", view: "posts", badge: "02" },
            { id: "clubs", icon: "fa-solid fa-flask-vial", label: "Kola naukowe", view: "clubs", badge: "06" },
            { id: "news", icon: "fa-solid fa-newspaper", label: "Nowosci", view: "news", badge: "04" },
            { id: "help", icon: "fa-solid fa-circle-question", label: "Pomoc", view: "help", badge: "FAQ" },
        ],
    },
    {
        title: "Dla mnie",
        items: [
            { id: "calendar", icon: "fa-solid fa-calendar-days", label: "Moje zajecia", view: "calendar", badge: "3 terminy" },
            { id: "notes", icon: "fa-solid fa-note-sticky", label: "Notatki z zajec", view: "notes", badge: "12 wpisow" },
            { id: "homework", icon: "fa-solid fa-book-open-reader", label: "Zadania domowe", view: "homework", badge: "4 aktywne" },
            { id: "progress", icon: "fa-solid fa-chart-line", label: "Postep w nauce", view: "progress", badge: "Raport" },
            { id: "message", icon: "fa-solid fa-envelope", label: "Wyslij wiadomosc", view: "message", badge: "Nowe" },
        ],
    },
];

const SCIENTIFIC_CLUBS = [
    {
        id: "ai-data-lab",
        shortLabel: "AI",
        accent: "violet",
        name: "AI & Data Lab",
        faculty: "Wydzial Informatyki i Analizy Danych",
        membersCount: 48,
        membersLabel: "48 aktywnych osob",
        schedule: "Wtorki, 18:00",
        format: "Hybrydowo",
        recruitment: "Rekrutacja trwa do 12 kwietnia",
        summary: "Zespol pracuje nad modelami ML, automatyzacja badan i analiza danych z projektow studenckich.",
        tags: ["python", "machine learning", "hackathony"],
        focusAreas: [
            "projekty z komputerowego rozpoznawania obrazu",
            "otwarte sprinty z analizy danych",
            "przygotowanie do konkursow i konferencji",
        ],
    },
    {
        id: "robotics-forge",
        shortLabel: "RB",
        accent: "stone",
        name: "Robotics Forge",
        faculty: "Wydzial Mechatroniki",
        membersCount: 31,
        membersLabel: "31 konstruktorow",
        schedule: "Czwartki, 17:30",
        format: "Laboratorium A2",
        recruitment: "Nabor otwarty dla 1 i 2 roku",
        summary: "Kolo laczy projektowanie ukladow, programowanie mikrokontrolerow i szybkie prototypowanie robotow.",
        tags: ["robotyka", "arduino", "cad"],
        focusAreas: [
            "budowa line followera i ramienia chwytajacego",
            "warsztaty CAD i druk 3D",
            "start w zawodach konstrukcyjnych",
        ],
    },
    {
        id: "bio-innovators",
        shortLabel: "BIO",
        accent: "mint",
        name: "Bio Innovators",
        faculty: "Wydzial Biotechnologii",
        membersCount: 22,
        membersLabel: "22 osoby badawcze",
        schedule: "Srody, 16:45",
        format: "Centrum badawcze",
        recruitment: "Spotkanie otwarte 9 kwietnia",
        summary: "Grupa rozwija projekty laboratoryjne wokol mikrobiologii, biomaterialow i edukacji popularnonaukowej.",
        tags: ["biotech", "laboratorium", "granty"],
        focusAreas: [
            "mikroprojekty laboratoryjne pod opieka doktorantow",
            "prezentacje wynikow na konferencjach",
            "pisanie mini-wnioskow grantowych",
        ],
    },
    {
        id: "astro-observatory",
        shortLabel: "AST",
        accent: "ocean",
        name: "Astronomical Observatory Crew",
        faculty: "Wydzial Fizyki",
        membersCount: 27,
        membersLabel: "27 obserwatorow",
        schedule: "Piatki, 20:00",
        format: "Obserwatorium + online",
        recruitment: "Zapisy na noc obserwacyjna",
        summary: "Kolo prowadzi obserwacje nocnego nieba, warsztaty obslugi teleskopow i analize prostych danych astrofizycznych.",
        tags: ["astrofizyka", "obserwacje", "popularyzacja"],
        focusAreas: [
            "sesje obserwacyjne z mentorami",
            "podstawy fotometrii i obrobki danych",
            "wydarzenia dla licealistow i studentow",
        ],
    },
    {
        id: "eco-design-hub",
        shortLabel: "ECO",
        accent: "forest",
        name: "Eco Design Hub",
        faculty: "Wydzial Architektury i Srodowiska",
        membersCount: 19,
        membersLabel: "19 projektantek i projektantow",
        schedule: "Poniedzialki, 18:15",
        format: "Studio projektowe",
        recruitment: "Czeka na portfolio lub szkice",
        summary: "Zespol rozwija projekty przestrzeni przyjaznych klimatowi i buduje prototypy materialow niskoemisyjnych.",
        tags: ["design", "zrownowazenie", "warsztaty"],
        focusAreas: [
            "makiety i prototypowanie rozwiazan miejskich",
            "analiza obiegu materialow",
            "wspolne konsultacje z opiekunami przemyslowymi",
        ],
    },
    {
        id: "law-policy-lab",
        shortLabel: "LEX",
        accent: "gold",
        name: "Law & Policy Lab",
        faculty: "Wydzial Prawa i Administracji",
        membersCount: 35,
        membersLabel: "35 aktywnych czlonkow",
        schedule: "Wtorki, 19:00",
        format: "Sala seminaryjna",
        recruitment: "Rekrutacja do sekcji debat",
        summary: "Kolo organizuje analizy case studies, debaty oksfordzkie i projekty popularyzujace wiedze o prawie cyfrowym.",
        tags: ["debaty", "prawo", "policy"],
        focusAreas: [
            "trening argumentacji i wystapien",
            "analiza nowych regulacji cyfrowych",
            "projekty z partnerami zewnetrznymi",
        ],
    },
];

const CLUB_EVENTS = [
    {
        club: "AI & Data Lab",
        title: "Open sprint: model predykcyjny dla danych miejskich",
        dateLabel: "04.04.2026",
        meta: "online, 18:00",
    },
    {
        club: "Robotics Forge",
        title: "Warsztat druku 3D i szybkiego prototypowania",
        dateLabel: "08.04.2026",
        meta: "Laboratorium A2, 17:30",
    },
    {
        club: "Bio Innovators",
        title: "Spotkanie otwarte dla nowych osob",
        dateLabel: "09.04.2026",
        meta: "Centrum badawcze, 16:45",
    },
];

const CLUB_JOIN_STEPS = [
    "wybierz obszar, ktory chcesz rozwijac",
    "sprawdz termin spotkania i format pracy",
    "dolacz na otwarte warsztaty lub spotkanie rekrutacyjne",
];

const POST_PUBLISH_STEPS = [
    "dodaj tytul wpisu, np. wolne terminy albo nowy material",
    "w tresci opisz aktualnosc, a linie od - zamienia sie w liste punktow",
    "kliknij publikuj, a wpis od razu zapisze sie w bazie",
];

const NEWS_ITEMS = [
    {
        id: "portal-views",
        category: "Portal",
        dateLabel: "Dzisiaj",
        title: "Portal dostal nowe widoki dla ucznia: nowosci, pomoc, zajecia, notatki, zadania, postep i wiadomosci.",
        summary: "Zamiast jednego feedu portal rozdziela teraz najwazniejsze obszary na osobne ekrany z wlasnym kontekstem i podsumowaniem.",
        highlights: ["nowe sekcje portalu", "mniej przelaczania miedzy ekranami", "latwiejszy dostep do potrzebnych informacji"],
    },
    {
        id: "search-by-view",
        category: "Nawigacja",
        dateLabel: "Wczoraj",
        title: "Wyszukiwanie i badge w sidebarze dopasowuja sie teraz do aktywnej sekcji portalu.",
        summary: "Kazdy widok ma osobny placeholder i filtruje tylko swoje dane, dzieki czemu szukanie wpisow, FAQ, terminow albo wiadomosci nie miesza wynikow.",
        highlights: ["szukanie per widok", "dynamiczne badge", "czytelniejsza nawigacja"],
    },
    {
        id: "booking-flow",
        category: "Rezerwacje",
        dateLabel: "2 dni temu",
        title: "Profil tutora pozwala wyslac zapytanie o zajecia z wybranym przedmiotem, data i godzina.",
        summary: "Frontend przekazuje komplet danych do nowego endpointu, a backend zaklada lub odnajduje rozmowe i zapisuje pierwsza wiadomosc do tutora.",
        highlights: ["nowy endpoint API", "wiadomosc startowa w rozmowie", "kontakt bezposrednio z profilu"],
    },
    {
        id: "booking-validation",
        category: "Backend",
        dateLabel: "3 dni temu",
        title: "Obsluga zapytan do tutora ma walidacje logowania i testy scenariuszy tworzenia rozmowy.",
        summary: "Kod odrzuca niezalogowane proby, pilnuje poprawnych danych wejsciowych i sprawdza testami, ze po wyslaniu powstaje rozmowa oraz pierwsza wiadomosc.",
        highlights: ["autoryzacja", "walidacja danych", "testy backendu"],
    },
];

const HELP_FAQ_ITEMS = [
    {
        id: "help-register",
        question: "Jak zalozyc konto korepetytora?",
        answer: "Po rejestracji przejdz do onboardingu, wybierz typ konta tutor, uzupelnij profil, przedmioty i harmonogram, a potem zapisz dane.",
    },
    {
        id: "help-search",
        question: "Jak znalezc korepetytora pod konkretny termin?",
        answer: "Wejdz do wyszukiwarki, wybierz przedmiot, temat, poziom, date i godzine. Portal pokaze idealne dopasowania oraz tutorow najblizszych Twojemu wyborowi.",
    },
    {
        id: "help-booking",
        question: "Co dzieje sie po wyslaniu zapytania z profilu tutora?",
        answer: "Aplikacja zapisuje rozmowe i pierwsza wiadomosc z przedmiotem, data oraz godzina. Tutor widzi to od razu w swoim widoku wiadomosci.",
    },
    {
        id: "help-posts",
        question: "Kto moze publikowac wpisy w portalu?",
        answer: "Wpisy publikuje konto tutora. Konto ucznia moze je przegladac, filtrowac i obserwowac profile tutorow, ale nie dodaje wlasnych ogloszen.",
    },
    {
        id: "help-observations",
        question: "Do czego sluzy sekcja obserwowanych tutorow?",
        answer: "Pozwala zapisac interesujace profile i szybko wrocic do nich z poziomu portalu, razem z liczba wpisow i obserwujacych.",
    },
];

const LESSON_CALENDAR_ITEMS = [
    {
        id: "lesson-math",
        dateLabel: "Poniedzialek, 20.04.2026",
        timeLabel: "18:00-19:00",
        subject: "Matematyka",
        tutorName: "Alicja Nowak",
        format: "Online",
        place: "Meet link po potwierdzeniu",
        statusLabel: "potwierdzony termin",
    },
    {
        id: "lesson-physics",
        dateLabel: "Sroda, 22.04.2026",
        timeLabel: "19:00-20:00",
        subject: "Fizyka",
        tutorName: "Karol Tutor",
        format: "Stacjonarnie",
        place: "Sala konsultacyjna B-14",
        statusLabel: "oczekuje na material",
    },
    {
        id: "lesson-chemistry",
        dateLabel: "Piatek, 24.04.2026",
        timeLabel: "17:30-18:30",
        subject: "Chemia",
        tutorName: "Klaudia Nowak",
        format: "Online",
        place: "Zoom + notatka po zajeciach",
        statusLabel: "przypomnienie ustawione",
    },
];

const STUDENT_NOTES = [
    {
        id: "note-1",
        subject: "Matematyka",
        title: "Schemat rozwiazywania zadan z funkcji kwadratowej",
        updatedLabel: "Dzisiaj",
        excerpt: "Zacznij od delty i zapisu miejsc zerowych, a dopiero potem przejdz do osi symetrii i przedzialow znakow.",
        tags: ["matura", "funkcje"],
    },
    {
        id: "note-2",
        subject: "Matematyka",
        title: "Szybka checklista przed kartkowka z trygonometrii",
        updatedLabel: "Dzisiaj",
        excerpt: "Sinus i cosinus licz od razu z ukladu osi, a dla tangensa dopisz ograniczenia jeszcze przed obliczeniami.",
        tags: ["trygonometria", "powtorka"],
    },
    {
        id: "note-3",
        subject: "Fizyka",
        title: "Ruch jednostajnie przyspieszony bez chaosu we wzorach",
        updatedLabel: "Wczoraj",
        excerpt: "Najpierw rozpisz dane, potem wybierz tylko jeden wzor z niewiadoma, ktorej faktycznie szukasz.",
        tags: ["kinematyka", "wzory"],
    },
    {
        id: "note-4",
        subject: "Chemia",
        title: "Jak rozpoznawac typ reakcji w jednym kroku",
        updatedLabel: "Wczoraj",
        excerpt: "Zanim zaczniesz liczyc, zaznacz czy reakcja jest redoks, straceniowa czy kwas-zasada.",
        tags: ["reakcje", "analiza"],
    },
    {
        id: "note-5",
        subject: "Biologia",
        title: "Oddychanie komorkowe na jednej stronie",
        updatedLabel: "2 dni temu",
        excerpt: "Podziel proces na glikolize, cykl Krebsa i lancuch oddechowy, a kazdy etap skojarz z miejscem wystepowania.",
        tags: ["komorka", "mapa mysli"],
    },
    {
        id: "note-6",
        subject: "Jezyk angielski",
        title: "Czasy perfect w praktycznych zdaniach",
        updatedLabel: "2 dni temu",
        excerpt: "Najpierw sprawdz zwiazek z terazniejszoscia, potem dopiero wybierz present perfect albo past simple.",
        tags: ["gramatyka", "exam"],
    },
    {
        id: "note-7",
        subject: "Matematyka",
        title: "Granice funkcji krok po kroku",
        updatedLabel: "3 dni temu",
        excerpt: "Zanim podstawisz liczbe, sprawdz czy nie dostajesz formy nieoznaczonej i czy warto skracac wyrazenie.",
        tags: ["analiza", "studia"],
    },
    {
        id: "note-8",
        subject: "Fizyka",
        title: "Prad elektryczny i podstawowe zaleznosci",
        updatedLabel: "3 dni temu",
        excerpt: "Opor, napiecie i natezenie najlepiej rozpisac od razu w jednej malej tabeli, zanim zaczniesz przeliczenia.",
        tags: ["elektrycznosc", "zadania"],
    },
    {
        id: "note-9",
        subject: "Chemia",
        title: "Stezenia procentowe bez gubienia jednostek",
        updatedLabel: "4 dni temu",
        excerpt: "Rozdziel mase substancji i mase roztworu na dwa osobne pola. To najczesciej ucina wiekszosc bledow.",
        tags: ["obliczenia", "roztwory"],
    },
    {
        id: "note-10",
        subject: "Historia",
        title: "Jak budowac odpowiedz rozszerzona do eseju",
        updatedLabel: "4 dni temu",
        excerpt: "Najpierw teza, potem dwa argumenty z data i krotkim skutkiem. Taki szkielet porzadkuje cala odpowiedz.",
        tags: ["esej", "matura"],
    },
    {
        id: "note-11",
        subject: "Biologia",
        title: "Fotosynteza vs oddychanie - najczestsze pomylki",
        updatedLabel: "5 dni temu",
        excerpt: "W notatce warto miec obok siebie substraty, produkty i miejsce przebiegu obu procesow.",
        tags: ["porownanie", "powtorka"],
    },
    {
        id: "note-12",
        subject: "Jezyk polski",
        title: "Plan wypracowania przed pisaniem wlasciwym",
        updatedLabel: "5 dni temu",
        excerpt: "Szkic argumentow i kontekstow zapisany na 3 linijkach oszczedza najwiecej czasu podczas samego pisania.",
        tags: ["wypracowanie", "arkusz"],
    },
];

const HOMEWORK_ITEMS = [
    {
        id: "task-1",
        subject: "Matematyka",
        title: "Arkusz z rownaniami i nierownosciami",
        dueLabel: "Do oddania dzisiaj, 20:00",
        statusLabel: "priorytet",
        effortLabel: "ok. 45 min",
        checklist: ["zadania 1-6", "sprawdzenie wynikow", "wyslanie skanu"],
    },
    {
        id: "task-2",
        subject: "Fizyka",
        title: "Notatka z dynamiki + dwa zadania opisowe",
        dueLabel: "Jutro, 18:30",
        statusLabel: "w trakcie",
        effortLabel: "ok. 35 min",
        checklist: ["wzory do zeszytu", "zadanie z tarciem", "krotkie podsumowanie"],
    },
    {
        id: "task-3",
        subject: "Chemia",
        title: "Powtorka stechiometrii przed kartkowka",
        dueLabel: "Czwartek, 17:00",
        statusLabel: "aktywny",
        effortLabel: "ok. 30 min",
        checklist: ["3 zadania rachunkowe", "jeden przyklad redoks", "sprawdzenie jednostek"],
    },
    {
        id: "task-4",
        subject: "Jezyk angielski",
        title: "Slownictwo i krotka wypowiedz pisemna",
        dueLabel: "Piatek, 16:00",
        statusLabel: "zaplanowany",
        effortLabel: "ok. 25 min",
        checklist: ["15 slowek", "krotki email", "samodzielne przeczytanie poprawionej wersji"],
    },
];

const PROGRESS_REPORT = {
    averageScore: "84%",
    completedPlan: "11/14",
    weeklySessions: "3",
    subjects: [
        { id: "progress-math", subject: "Matematyka", completion: 88, focus: "funkcje, trygonometria", note: "najmocniejszy blok tygodnia" },
        { id: "progress-physics", subject: "Fizyka", completion: 76, focus: "kinematyka, dynamika", note: "warto dopiac zadania opisowe" },
        { id: "progress-chemistry", subject: "Chemia", completion: 81, focus: "stechiometria, redoks", note: "dobry rytm pracy przed kartkowka" },
        { id: "progress-english", subject: "Jezyk angielski", completion: 69, focus: "writing, grammar", note: "najwiekszy zapas do poprawy" },
    ],
    nextSteps: [
        "domknij arkusz z matematyki przed kolejnymi zajeciami",
        "dodaj jedna krotsza powtorke z fizyki miedzy spotkaniami",
        "w angielskim skup sie na jednej stalej strukturze wypowiedzi",
    ],
};

const MESSAGE_THREADS = [
    {
        id: "thread-1",
        tutorName: "Alicja Nowak",
        subject: "Matematyka",
        timeLabel: "12 min temu",
        unreadLabel: "nowa odpowiedz",
        preview: "Mam wolny slot w srode o 18:00. Jesli pasuje, moge od razu wpisac temat z funkcji kwadratowej.",
    },
    {
        id: "thread-2",
        tutorName: "Klaudia Nowak",
        subject: "Chemia",
        timeLabel: "1 godz. temu",
        unreadLabel: "przypomnienie",
        preview: "Podepnij prosze zdjecie ostatnich zadan, to przed spotkaniem ustawie plan szybkiej powtorki z redoks.",
    },
    {
        id: "thread-3",
        tutorName: "Karol Tutor",
        subject: "Fizyka",
        timeLabel: "Wczoraj",
        unreadLabel: "ustalony plan",
        preview: "Na kolejne zajecia wezmiemy ruch jednostajnie przyspieszony i zrobimy trzy zadania maturalne krok po kroku.",
    },
];

const EMPTY_POST_FORM = {
    title: "",
    content: "",
};

function matchesSearch(searchValue, entries) {
    if (!searchValue) {
        return true;
    }

    return entries.some((entry) => String(entry).toLowerCase().includes(searchValue));
}

function buildPostSearchEntries(post) {
    return [
        post.author,
        post.title,
        ...(post.tags || []),
        ...(post.paragraphs || []),
        ...(post.checklist || []),
    ];
}

function formatPostsBadge(postsCount) {
    if (postsCount > 99) {
        return "99+";
    }

    return String(postsCount).padStart(2, "0");
}

function PortalViewIntro({ eyebrow, title, copy, stats }) {
    return (
        <section className="portal-main__intro">
            <div>
                <p className="portal-main__eyebrow">{eyebrow}</p>
                <h2>{title}</h2>
                <p className="portal-main__copy">{copy}</p>
            </div>

            <div className="portal-main__stats">
                {stats.map((stat) => (
                    <div key={stat.label} className="portal-main__stat">
                        <strong>{stat.value}</strong>
                        <span>{stat.label}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

function PortalSearchEmptyState({ label, searchValue }) {
    return (
        <div className="portal-empty-state">
            Nie znaleziono {label} pasujacych do frazy <strong>{searchValue}</strong>.
        </div>
    );
}

function buildNewsSearchEntries(item) {
    return [item.category, item.title, item.summary, ...(item.highlights || [])];
}

function buildHelpSearchEntries(item) {
    return [item.question, item.answer];
}

function buildLessonSearchEntries(item) {
    return [item.subject, item.tutorName, item.format, item.place, item.statusLabel, item.dateLabel];
}

function buildNoteSearchEntries(item) {
    return [item.subject, item.title, item.excerpt, ...(item.tags || [])];
}

function buildHomeworkSearchEntries(item) {
    return [item.subject, item.title, item.dueLabel, item.statusLabel, item.effortLabel, ...(item.checklist || [])];
}

function buildProgressSearchEntries(item) {
    return [item.subject, item.focus, item.note, `${item.completion}%`];
}

function buildMessageSearchEntries(item) {
    return [item.tutorName, item.subject, item.unreadLabel, item.preview, item.timeLabel];
}

function NewsView({ items, searchValue }) {
    return (
        <>
            <PortalViewIntro
                eyebrow="Nowosci"
                title="Co zmienia sie w aplikacji po tym wdrozeniu"
                copy="Ten widok zbiera skrot zmian w portalu, rezerwacjach i backendzie, tak zeby bylo od razu widac, co doszlo w kodzie."
                stats={[
                    { value: items.length, label: "aktualnosci w tym widoku" },
                    { value: "4", label: "obszary aplikacji objete zmianami" },
                    { value: "1 commit", label: "zakres tego zestawu zmian" },
                ]}
            />

            {items.length ? (
                <div className="portal-section-grid">
                    {items.map((item) => (
                        <article key={item.id} className="portal-section-card">
                            <div className="portal-section-card__topline">
                                <span className="portal-section-card__eyebrow">{item.category}</span>
                                <span className="portal-section-card__chip">{item.dateLabel}</span>
                            </div>
                            <h3>{item.title}</h3>
                            <p>{item.summary}</p>
                            <ul className="portal-section-card__list">
                                {item.highlights.map((highlight) => (
                                    <li key={highlight}>{highlight}</li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            ) : (
                <PortalSearchEmptyState label="aktualnosci" searchValue={searchValue} />
            )}
        </>
    );
}

function HelpView({ faqItems, searchValue }) {
    return (
        <>
            <PortalViewIntro
                eyebrow="Pomoc"
                title="Najczestsze pytania o dzialanie aplikacji"
                copy="Ta sekcja zbiera odpowiedzi na rzeczy, ktore najlatwiej zgubic przy pierwszym przejsciu przez portal."
                stats={[
                    { value: faqItems.length, label: "pytan w FAQ" },
                    { value: "4", label: "glowne przeplywy uzytkownika" },
                    { value: "1", label: "miejsce na start bez szukania po ekranach" },
                ]}
            />

            <div className="portal-help__layout">
                <div className="portal-help__faq-list">
                    {faqItems.length ? (
                        faqItems.map((item, index) => (
                            <details key={item.id} className="portal-help__faq-item" open={index === 0}>
                                <summary>{item.question}</summary>
                                <p>{item.answer}</p>
                            </details>
                        ))
                    ) : (
                        <PortalSearchEmptyState label="odpowiedzi" searchValue={searchValue} />
                    )}
                </div>

                <aside className="portal-section-panel">
                    <p className="portal-section-card__eyebrow">Szybki start</p>
                    <h3>Najkrotsza droga przez portal</h3>
                    <ol className="portal-section-card__steps">
                        <li>Wyszukaj tutora po przedmiocie, dacie i godzinie.</li>
                        <li>Otworz profil i wyslij zapytanie z wybranego terminu.</li>
                        <li>Wroc do portalu, aby sledzic wpisy i zapisane profile.</li>
                    </ol>
                </aside>
            </div>
        </>
    );
}

function CalendarView({ lessons, searchValue }) {
    return (
        <>
            <PortalViewIntro
                eyebrow="Moje zajecia"
                title="Najblizsze terminy i plan spotkan"
                copy="Sekcja porzadkuje zajecia, format spotkania i najwazniejsze informacje, ktore warto miec pod reka przed lekcja."
                stats={[
                    { value: lessons.length, label: "najblizsze terminy" },
                    { value: lessons.filter((lesson) => lesson.format === "Online").length, label: "spotkania online" },
                    { value: "1 tydzien", label: "horyzont najblizszych zajec" },
                ]}
            />

            {lessons.length ? (
                <div className="portal-section-grid">
                    {lessons.map((lesson) => (
                        <article key={lesson.id} className="portal-section-card">
                            <div className="portal-section-card__topline">
                                <span className="portal-section-card__eyebrow">{lesson.subject}</span>
                                <span className="portal-section-card__chip">{lesson.statusLabel}</span>
                            </div>
                            <h3>{lesson.tutorName}</h3>
                            <p>{lesson.dateLabel}</p>
                            <div className="portal-section-card__meta">
                                <span>{lesson.timeLabel}</span>
                                <span>{lesson.format}</span>
                            </div>
                            <p>{lesson.place}</p>
                        </article>
                    ))}
                </div>
            ) : (
                <PortalSearchEmptyState label="terminow" searchValue={searchValue} />
            )}
        </>
    );
}

function NotesView({ notes, searchValue }) {
    return (
        <>
            <PortalViewIntro
                eyebrow="Notatki z zajec"
                title="Skroty, schematy i szybkie podsumowania po spotkaniach"
                copy="Notatki zbieraja najwazniejsze rzeczy z konsultacji, tak zeby wrocic do nich bez przewijania czatu i bez szukania w kilku plikach."
                stats={[
                    { value: notes.length, label: "notatek w tym widoku" },
                    { value: "5", label: "obszarow nauki objetych materialem" },
                    { value: "2", label: "swieze wpisy z ostatnich 48 godzin" },
                ]}
            />

            {notes.length ? (
                <div className="portal-section-grid">
                    {notes.map((note) => (
                        <article key={note.id} className="portal-section-card">
                            <div className="portal-section-card__topline">
                                <span className="portal-section-card__eyebrow">{note.subject}</span>
                                <span className="portal-section-card__chip">{note.updatedLabel}</span>
                            </div>
                            <h3>{note.title}</h3>
                            <p>{note.excerpt}</p>
                            <div className="portal-section-card__meta">
                                {note.tags.map((tag) => (
                                    <span key={tag}>{tag}</span>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <PortalSearchEmptyState label="notatek" searchValue={searchValue} />
            )}
        </>
    );
}

function HomeworkView({ tasks, searchValue }) {
    return (
        <>
            <PortalViewIntro
                eyebrow="Zadania domowe"
                title="Aktywne zadania i rzeczy do domkniecia"
                copy="Tutaj masz porzadek w tym, co trzeba oddac, ile to zajmie i z czego sklada sie najblizsza pula pracy."
                stats={[
                    { value: tasks.length, label: "aktywnych zadan" },
                    { value: "1", label: "zadanie z najwyzszym priorytetem na dzisiaj" },
                    { value: "4", label: "przedmioty w biezacym planie" },
                ]}
            />

            {tasks.length ? (
                <div className="portal-section-grid">
                    {tasks.map((task) => (
                        <article key={task.id} className="portal-section-card">
                            <div className="portal-section-card__topline">
                                <span className="portal-section-card__eyebrow">{task.subject}</span>
                                <span className="portal-section-card__chip">{task.statusLabel}</span>
                            </div>
                            <h3>{task.title}</h3>
                            <div className="portal-section-card__meta">
                                <span>{task.dueLabel}</span>
                                <span>{task.effortLabel}</span>
                            </div>
                            <ul className="portal-section-card__list">
                                {task.checklist.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            ) : (
                <PortalSearchEmptyState label="zadan" searchValue={searchValue} />
            )}
        </>
    );
}

function ProgressView({ report, subjects, searchValue }) {
    return (
        <>
            <PortalViewIntro
                eyebrow="Postep w nauce"
                title="Raport tygodniowy i kierunek kolejnych powtorek"
                copy="Widok zbiera tempo pracy, zrealizowany plan i poziom domkniecia dla kazdego przedmiotu."
                stats={[
                    { value: report.averageScore, label: "srednia realizacji materialu" },
                    { value: report.completedPlan, label: "domkniety plan tygodnia" },
                    { value: report.weeklySessions, label: "sesje w tym tygodniu" },
                ]}
            />

            <div className="portal-help__layout">
                <div className="portal-progress__list">
                    {subjects.length ? (
                        subjects.map((item) => (
                            <article key={item.id} className="portal-progress__card">
                                <div className="portal-section-card__topline">
                                    <span className="portal-section-card__eyebrow">{item.subject}</span>
                                    <span className="portal-section-card__chip">{item.completion}%</span>
                                </div>
                                <div className="portal-progress__bar" aria-hidden="true">
                                    <span style={{ width: `${item.completion}%` }}></span>
                                </div>
                                <p>{item.focus}</p>
                                <strong>{item.note}</strong>
                            </article>
                        ))
                    ) : (
                        <PortalSearchEmptyState label="obszarow postepu" searchValue={searchValue} />
                    )}
                </div>

                <aside className="portal-section-panel">
                    <p className="portal-section-card__eyebrow">Kolejny krok</p>
                    <h3>Na czym najlepiej skupic kolejna sesje</h3>
                    <ul className="portal-section-card__list">
                        {report.nextSteps.map((step) => (
                            <li key={step}>{step}</li>
                        ))}
                    </ul>
                </aside>
            </div>
        </>
    );
}

function MessageView({ isAuthenticated, loginUrl, observations, searchValue, threads }) {
    return (
        <>
            <PortalViewIntro
                eyebrow="Wiadomosci"
                title="Szybki podglad rozmow i zapytan do tutorow"
                copy="Sekcja zbiera ostatnie watki, przypomnienia i miejsca, z ktorych najlatwiej wznowic kontakt przed kolejnymi zajeciami."
                stats={[
                    { value: threads.length, label: "aktywnych watkow w podgladzie" },
                    { value: observations.length, label: "obserwowanych tutorow pod reka" },
                    { value: "1 klik", label: "powrot do profilu z poziomu portalu" },
                ]}
            />

            <div className="portal-help__layout">
                <div className="portal-section-grid portal-section-grid--single">
                    {threads.length ? (
                        threads.map((thread) => (
                            <article key={thread.id} className="portal-section-card">
                                <div className="portal-section-card__topline">
                                    <span className="portal-section-card__eyebrow">{thread.subject}</span>
                                    <span className="portal-section-card__chip">{thread.unreadLabel}</span>
                                </div>
                                <h3>{thread.tutorName}</h3>
                                <div className="portal-section-card__meta">
                                    <span>{thread.timeLabel}</span>
                                </div>
                                <p>{thread.preview}</p>
                            </article>
                        ))
                    ) : (
                        <PortalSearchEmptyState label="wiadomosci" searchValue={searchValue} />
                    )}
                </div>

                <aside className="portal-section-panel">
                    <p className="portal-section-card__eyebrow">Szybki start</p>
                    <h3>Jak wznowic kontakt z tutorem</h3>
                    {isAuthenticated ? (
                        <>
                            <p className="portal-section-panel__copy">
                                Otworz profil obserwowanego tutora albo wejdz do wyszukiwarki i wyslij nowe zapytanie z wybranego terminu.
                            </p>
                            {observations.length ? (
                                <div className="portal-section-panel__stack">
                                    {observations.slice(0, 4).map((observation) => (
                                        <a key={observation.id} href={observation.profileUrl}>
                                            {observation.author}
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="portal-section-panel__copy">
                                    Gdy dodasz tutorow do obserwowanych, pojawia sie tu szybkie skróty do ich profili.
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="portal-section-panel__copy">
                            <a href={loginUrl}>Zaloguj sie</a>, aby sledzic rozmowy i wracac do tutorow z poziomu portalu.
                        </p>
                    )}
                </aside>
            </div>
        </>
    );
}

function PortalPostComposer({
    currentUser,
    formValues,
    isSaving,
    onSubmit,
    onTitleChange,
    onContentChange,
    submitError,
    submitSuccess,
}) {
    return (
        <section className="portal-post-editor">
            <div className="portal-post-editor__header">
                <div>
                    <p className="portal-post-guide__eyebrow">Panel tutora</p>
                    <h3>Dodaj nowy wpis do portalu</h3>
                </div>
                <span className="portal-post-editor__author">@{currentUser?.username || "tutor"}</span>
            </div>

            <p className="portal-post-editor__copy">
                Publikuj wolne terminy, nowe materialy, mini-ogloszenia albo szybkie aktualnosci dla uczniow.
            </p>

            <form className="portal-post-form" onSubmit={onSubmit}>
                <label className="portal-post-form__field">
                    <span>Tytul wpisu</span>
                    <input
                        type="text"
                        value={formValues.title}
                        onChange={onTitleChange}
                        placeholder="Np. Wolne terminy przed matura z matematyki"
                        maxLength={200}
                        required
                    />
                </label>

                <label className="portal-post-form__field">
                    <span>Tresc</span>
                    <textarea
                        value={formValues.content}
                        onChange={onContentChange}
                        placeholder={"Dodaj krotka aktualnosc dla uczniow.\n- wolny termin w czwartek 18:00\n- nowy zestaw zadan juz czeka"}
                        required
                    />
                </label>

                <div className="portal-post-editor__actions">
                    <button
                        type="submit"
                        className="button button--primary portal-post-editor__submit"
                        disabled={isSaving}
                    >
                        {isSaving ? "Publikowanie..." : "Publikuj wpis"}
                    </button>
                    <p className="portal-post-editor__hint">
                        Akapity zostana wyswietlone jako opis, a linie od <code>-</code> jako lista punktow.
                    </p>
                </div>

                {submitError ? (
                    <p className="portal-post-editor__status portal-post-editor__status--error">{submitError}</p>
                ) : null}
                {submitSuccess ? (
                    <p className="portal-post-editor__status portal-post-editor__status--success">{submitSuccess}</p>
                ) : null}
            </form>
        </section>
    );
}

function PortalPostGuide({ canCreatePosts, isAuthenticated, loginUrl, onboardingUrl }) {
    return (
        <aside className="portal-post-guide">
            <p className="portal-post-guide__eyebrow">Jak dodac wpis</p>
            <h3>Prosty schemat publikacji dla tutora</h3>

            <ol className="portal-post-guide__steps">
                {POST_PUBLISH_STEPS.map((step) => (
                    <li key={step}>{step}</li>
                ))}
            </ol>

            {canCreatePosts ? (
                <p className="portal-post-guide__note">
                    Twoj wpis pojawi sie od razu w sekcji <strong>Wpisy</strong> i zostanie zapisany w bazie.
                </p>
            ) : null}

            {!canCreatePosts && isAuthenticated ? (
                <p className="portal-post-guide__note">
                    Konto ucznia widzi wpisy, ale nie publikuje ich.{" "}
                    <a className="portal-post-guide__link" href={onboardingUrl}>
                        Przejdz do onboardingu tutora
                    </a>
                    .
                </p>
            ) : null}

            {!canCreatePosts && !isAuthenticated ? (
                <p className="portal-post-guide__note">
                    <a className="portal-post-guide__link" href={loginUrl}>
                        Zaloguj sie
                    </a>{" "}
                    jako tutor, aby publikowac aktualnosci w portalu.
                </p>
            ) : null}
        </aside>
    );
}

function PortalObservationsPanel({
    hasLoaded,
    isAuthenticated,
    observations,
    observationsError,
    loginUrl,
}) {
    return (
        <div className="portal-sidebar__group">
            <p className="portal-sidebar__heading">Twoje obserwacje</p>

            {!isAuthenticated ? (
                <p className="portal-sidebar__observation-auth">
                    <a href={loginUrl}>Zaloguj sie</a>, aby obserwowac tutorow i zobaczyc ich tutaj.
                </p>
            ) : null}

            {observationsError ? <p className="portal-sidebar__observation-auth">{observationsError}</p> : null}

            {!observationsError && !hasLoaded ? (
                <p className="portal-sidebar__observation-auth">Ladowanie obserwacji...</p>
            ) : null}

            {!observationsError && hasLoaded && observations.length ? (
                <div className="portal-sidebar__observation-list">
                    {observations.map((observation) => (
                        <article key={observation.id} className="portal-sidebar__observation-card">
                            <strong>{observation.author}</strong>
                            <p>{observation.followersLabel} obserwujacych</p>
                            <p>{observation.postsCount} wpisow w portalu</p>
                            <a href={observation.profileUrl}>Zobacz profil</a>
                        </article>
                    ))}
                </div>
            ) : null}

            {!observationsError && hasLoaded && !observations.length ? (
                <p className="portal-sidebar__observation-auth">
                    {isAuthenticated
                        ? "Nie obserwujesz jeszcze zadnego tutora."
                        : "Obserwacje sa dostepne po zalogowaniu."}
                </p>
            ) : null}
        </div>
    );
}

function PortalPostsView({
    currentUser,
    formValues,
    hasAnyPosts,
    isAuthenticated,
    isLoading,
    isSaving,
    loginUrl,
    onboardingUrl,
    onContentChange,
    onSubmit,
    onTitleChange,
    posts,
    postsError,
    postsLastWeekCount,
    searchValue,
    submitError,
    submitSuccess,
    totalAuthorsCount,
    totalPostsCount,
}) {
    const canCreatePosts = Boolean(currentUser?.isTutor);

    return (
        <>
            <section className="portal-main__intro">
                <div>
                    <p className="portal-main__eyebrow">Portal ucznia</p>
                    <h2>Wpisy, ogloszenia i szybkie aktualnosci od tutorow</h2>
                    <p className="portal-main__copy">
                        Zbieraj informacje o wolnych terminach, nowych materialach i publikacjach tutorow bez
                        przechodzenia miedzy zakladkami.
                    </p>
                </div>

                <div className="portal-main__stats">
                    <div className="portal-main__stat">
                        <strong>{totalPostsCount}</strong>
                        <span>aktywnych wpisow</span>
                    </div>
                    <div className="portal-main__stat">
                        <strong>{postsLastWeekCount}</strong>
                        <span>publikacji z ostatnich 7 dni</span>
                    </div>
                    <div className="portal-main__stat">
                        <strong>{totalAuthorsCount}</strong>
                        <span>tutorow publikuje w portalu</span>
                    </div>
                </div>
            </section>

            <section className={joinClasses("portal-post-tools", !canCreatePosts && "portal-post-tools--single")}>
                {canCreatePosts ? (
                    <PortalPostComposer
                        currentUser={currentUser}
                        formValues={formValues}
                        isSaving={isSaving}
                        onSubmit={onSubmit}
                        onTitleChange={onTitleChange}
                        onContentChange={onContentChange}
                        submitError={submitError}
                        submitSuccess={submitSuccess}
                    />
                ) : null}

                <PortalPostGuide
                    canCreatePosts={canCreatePosts}
                    isAuthenticated={isAuthenticated}
                    loginUrl={loginUrl}
                    onboardingUrl={onboardingUrl}
                />
            </section>

            {isLoading ? <div className="portal-empty-state">Ladowanie wpisow z bazy...</div> : null}
            {!isLoading && postsError ? <div className="portal-empty-state">{postsError}</div> : null}

            {!isLoading && !postsError && posts.length ? (
                <div className="portal-feed__list">
                    {posts.map((post) => (
                        <article key={post.id} className="portal-post">
                            <header className="portal-post__header">
                                <div className="portal-post__identity">
                                    <div
                                        className={joinClasses(
                                            "portal-post__avatar",
                                            "tutor-card__avatar",
                                            `tutor-card__avatar--${post.avatarTone || "slate"}`,
                                        )}
                                    >
                                        <span>{post.initials}</span>
                                    </div>

                                    <div className="portal-post__identity-copy">
                                        <div>
                                            <h3>{post.author}</h3>
                                            <div className="portal-post__meta">
                                                <span className="portal-post__follow">Obserwuj</span>
                                                <span>{post.followers} obserwujacych</span>
                                            </div>
                                        </div>
                                        <h4 className="portal-post__title">{post.title}</h4>
                                    </div>
                                </div>
                                <time dateTime={post.createdAt}>{post.dateLabel}</time>
                            </header>

                            <div className="portal-post__body">
                                <div className="portal-post__tags" aria-label="Tematy wpisu">
                                    {post.tags.map((tag) => (
                                        <span key={`${post.id}-${tag}`} className="portal-post__tag">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {post.paragraphs.map((paragraph) => (
                                    <p key={`${post.id}-${paragraph}`}>{paragraph}</p>
                                ))}

                                {post.checklist.length ? (
                                    <ul>
                                        {post.checklist.map((item) => (
                                            <li key={`${post.id}-${item}`}>{item}</li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>
                        </article>
                    ))}
                </div>
            ) : null}

            {!isLoading && !postsError && !posts.length ? (
                <div className="portal-empty-state">
                    {hasAnyPosts ? (
                        <>
                            Nie znaleziono wpisow pasujacych do frazy <strong>{searchValue}</strong>.
                        </>
                    ) : (
                        <>
                            Na razie nie ma jeszcze wpisow w portalu. {canCreatePosts
                                ? "Mozesz opublikowac pierwszy wpis i zapisac go od razu w bazie."
                                : "Pierwszy tutor moze dodac wpis po zalogowaniu."}
                        </>
                    )}
                </div>
            ) : null}
        </>
    );
}

function ScientificClubsView({ clubs, searchValue }) {
    const totalMembers = clubs.reduce((sum, club) => sum + club.membersCount, 0);

    return (
        <>
            <section className="portal-main__intro portal-main__intro--clubs">
                <div>
                    <p className="portal-main__eyebrow">Kola naukowe</p>
                    <h2>Kola naukowe, ktore lacza nauke z praktyka</h2>
                    <p className="portal-main__copy">
                        Wybralem dla Ciebie przeglad aktywnych kol z roznych wydzialow, terminami spotkan,
                        obszarami dzialania i aktualna rekrutacja.
                    </p>
                </div>

                <div className="portal-main__stats">
                    <div className="portal-main__stat">
                        <strong>{clubs.length}</strong>
                        <span>aktywnych kol</span>
                    </div>
                    <div className="portal-main__stat">
                        <strong>{totalMembers}+</strong>
                        <span>osob dziala teraz w portalowej bazie</span>
                    </div>
                    <div className="portal-main__stat">
                        <strong>3</strong>
                        <span>otwarte wydarzenia w najblizszym tygodniu</span>
                    </div>
                </div>
            </section>

            <section className="portal-clubs__hero">
                <div className="portal-clubs__hero-copy">
                    <p className="portal-clubs__eyebrow">Warto zaczac tutaj</p>
                    <h3>Dobierz kolo pod tempo, temat i sposob pracy</h3>
                    <p>
                        Jesli chcesz wejsc w projekty, badania albo warsztaty praktyczne, ta sekcja daje Ci
                        szybki przeglad bez szukania po wydzialach i grupach na zewnatrz.
                    </p>
                    <div className="portal-clubs__hero-tags" aria-label="Typy aktywnosci">
                        <span>projekty</span>
                        <span>warsztaty</span>
                        <span>badania</span>
                        <span>debaty</span>
                    </div>
                </div>

                <div className="portal-clubs__hero-panel">
                    <p className="portal-clubs__panel-label">Jak dolaczyc</p>
                    <ol className="portal-clubs__steps">
                        {CLUB_JOIN_STEPS.map((step) => (
                            <li key={step}>{step}</li>
                        ))}
                    </ol>
                </div>
            </section>

            {clubs.length ? (
                <div className="portal-clubs">
                    <div className="portal-clubs__grid">
                        {clubs.map((club) => (
                            <article key={club.id} className="portal-club-card">
                                <div className="portal-club-card__header">
                                    <span
                                        className={joinClasses(
                                            "portal-club-card__badge",
                                            `portal-club-card__badge--${club.accent}`,
                                        )}
                                    >
                                        {club.shortLabel}
                                    </span>
                                    <span className="portal-club-card__members">{club.membersLabel}</span>
                                </div>

                                <div className="portal-club-card__title-block">
                                    <h3>{club.name}</h3>
                                    <p>{club.faculty}</p>
                                </div>

                                <p className="portal-club-card__summary">{club.summary}</p>

                                <div className="portal-club-card__meta">
                                    <span>
                                        <i className="fa-regular fa-clock" aria-hidden="true"></i>
                                        {club.schedule}
                                    </span>
                                    <span>
                                        <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
                                        {club.format}
                                    </span>
                                </div>

                                <div className="portal-club-card__tags" aria-label="Tagi kola">
                                    {club.tags.map((tag) => (
                                        <span key={tag}>{tag}</span>
                                    ))}
                                </div>

                                <ul className="portal-club-card__focus">
                                    {club.focusAreas.map((focusArea) => (
                                        <li key={focusArea}>{focusArea}</li>
                                    ))}
                                </ul>

                                <div className="portal-club-card__footer">
                                    <strong>{club.recruitment}</strong>
                                    <span>Skontaktuj sie przez sekretariat kola lub opiekuna sekcji.</span>
                                </div>
                            </article>
                        ))}
                    </div>

                    <aside className="portal-clubs__aside">
                        <div className="portal-clubs__aside-card">
                            <p className="portal-clubs__panel-label">Najblizsze wydarzenia</p>
                            <div className="portal-clubs__events">
                                {CLUB_EVENTS.map((event) => (
                                    <article key={`${event.club}-${event.title}`} className="portal-clubs__event">
                                        <span className="portal-clubs__event-date">{event.dateLabel}</span>
                                        <strong>{event.title}</strong>
                                        <p>{event.club}</p>
                                        <span>{event.meta}</span>
                                    </article>
                                ))}
                            </div>
                        </div>

                        <div className="portal-clubs__aside-card">
                            <p className="portal-clubs__panel-label">Szukasz pierwszego kola?</p>
                            <p className="portal-clubs__aside-copy">
                                Zacznij od sekcji z otwarta rekrutacja. Jesli jeszcze nie wiesz, co wybrac,
                                filtruj po obszarze zainteresowan albo po wydziale.
                            </p>
                        </div>
                    </aside>
                </div>
            ) : (
                <div className="portal-empty-state">
                    Nie znaleziono kol naukowych pasujacych do frazy <strong>{searchValue}</strong>.
                </div>
            )}
        </>
    );
}

export default function PortalSection({
    csrfToken = "",
    currentUser = null,
    isAuthenticated = false,
    urls = {},
}) {
    const [activeView, setActiveView] = useState("posts");
    const [searchValue, setSearchValue] = useState("");
    const [portalPosts, setPortalPosts] = useState([]);
    const [isPostsLoading, setIsPostsLoading] = useState(false);
    const [postsError, setPostsError] = useState("");
    const [isSavingPost, setIsSavingPost] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState("");
    const [postForm, setPostForm] = useState(EMPTY_POST_FORM);
    const [observations, setObservations] = useState([]);
    const [hasLoadedObservations, setHasLoadedObservations] = useState(false);
    const [observationsError, setObservationsError] = useState("");

    const normalizedSearch = searchValue.trim().toLowerCase();
    const postsUrl = urls.portalPosts ?? "/api/portal-posts";
    const observationsUrl = urls.observations ?? "/api/portal-observations";
    const databaseErrorUrl = urls.databaseError ?? "/database-error";
    const loginUrl = urls.login ?? "/login";
    const onboardingUrl = urls.onboarding ?? "/onboarding";

    useEffect(() => {
        let ignoreResponse = false;

        async function loadPortalPosts() {
            setIsPostsLoading(true);
            setPostsError("");

            try {
                const loadedPosts = await fetchPortalPosts({
                    postsUrl,
                    databaseErrorUrl,
                });

                if (!ignoreResponse) {
                    setPortalPosts(loadedPosts);
                }
            } catch (error) {
                if (!ignoreResponse) {
                    setPortalPosts([]);
                    setPostsError(error?.message || "Nie udalo sie pobrac wpisow z portalu.");
                }
            } finally {
                if (!ignoreResponse) {
                    setIsPostsLoading(false);
                }
            }
        }

        loadPortalPosts();

        return () => {
            ignoreResponse = true;
        };
    }, [databaseErrorUrl, postsUrl]);

    useEffect(() => {
        let ignoreResponse = false;

        async function loadObservations() {
            setObservationsError("");
            setHasLoadedObservations(false);

            try {
                const loadedObservations = await fetchPortalObservations({
                    observationsUrl,
                    databaseErrorUrl,
                });

                if (!ignoreResponse) {
                    setObservations(loadedObservations);
                }
            } catch (error) {
                if (!ignoreResponse) {
                    setObservations([]);
                    setObservationsError(error?.message || "Nie udalo sie pobrac obserwacji.");
                }
            } finally {
                if (!ignoreResponse) {
                    setHasLoadedObservations(true);
                }
            }
        }

        loadObservations();

        return () => {
            ignoreResponse = true;
        };
    }, [databaseErrorUrl, observationsUrl]);

    const filteredPosts = portalPosts.filter((post) =>
        matchesSearch(normalizedSearch, buildPostSearchEntries(post)),
    );

    const filteredNews = NEWS_ITEMS.filter((item) =>
        matchesSearch(normalizedSearch, buildNewsSearchEntries(item)),
    );

    const filteredHelpItems = HELP_FAQ_ITEMS.filter((item) =>
        matchesSearch(normalizedSearch, buildHelpSearchEntries(item)),
    );

    const filteredClubs = SCIENTIFIC_CLUBS.filter((club) =>
        matchesSearch(normalizedSearch, [
            club.name,
            club.faculty,
            club.summary,
            club.schedule,
            club.format,
            club.recruitment,
            ...club.tags,
            ...club.focusAreas,
        ]),
    );

    const filteredLessons = LESSON_CALENDAR_ITEMS.filter((item) =>
        matchesSearch(normalizedSearch, buildLessonSearchEntries(item)),
    );

    const filteredNotes = STUDENT_NOTES.filter((item) =>
        matchesSearch(normalizedSearch, buildNoteSearchEntries(item)),
    );

    const filteredHomework = HOMEWORK_ITEMS.filter((item) =>
        matchesSearch(normalizedSearch, buildHomeworkSearchEntries(item)),
    );

    const filteredProgressSubjects = PROGRESS_REPORT.subjects.filter((item) =>
        matchesSearch(normalizedSearch, buildProgressSearchEntries(item)),
    );

    const filteredThreads = MESSAGE_THREADS.filter((item) =>
        matchesSearch(normalizedSearch, buildMessageSearchEntries(item)),
    );

    const postsLastWeekCount = portalPosts.filter((post) => {
        const createdTimestamp = Date.parse(post.createdAt || "");
        return Number.isFinite(createdTimestamp) && (Date.now() - createdTimestamp) <= 7 * 24 * 60 * 60 * 1000;
    }).length;
    const totalAuthorsCount = new Set(portalPosts.map((post) => post.author).filter(Boolean)).size;
    const searchPlaceholderByView = {
        posts: "Szukaj wpisow, autorow lub tematow...",
        clubs: "Szukaj kol, tematow lub projektow...",
        news: "Szukaj aktualnosci i zmian w aplikacji...",
        help: "Szukaj pytan i odpowiedzi...",
        calendar: "Szukaj terminow, tutorow lub przedmiotow...",
        notes: "Szukaj notatek, przedmiotow lub tematow...",
        homework: "Szukaj zadan, terminow lub przedmiotow...",
        progress: "Szukaj przedmiotow i obszarow postepu...",
        message: "Szukaj tutorow, watkow lub tematow...",
    };
    const searchPlaceholder = searchPlaceholderByView[activeView] || searchPlaceholderByView.posts;

    function getSidebarBadgeValue(item) {
        switch (item.view) {
            case "posts":
                return formatPostsBadge(portalPosts.length);
            case "clubs":
                return String(SCIENTIFIC_CLUBS.length).padStart(2, "0");
            case "news":
                return String(NEWS_ITEMS.length).padStart(2, "0");
            case "help":
                return "FAQ";
            case "calendar":
                return `${LESSON_CALENDAR_ITEMS.length} terminy`;
            case "notes":
                return `${STUDENT_NOTES.length} wpisow`;
            case "homework":
                return `${HOMEWORK_ITEMS.length} aktywne`;
            case "progress":
                return "Raport";
            case "message":
                return "Nowe";
            default:
                return item.badge;
        }
    }

    function renderActiveView() {
        switch (activeView) {
            case "clubs":
                return <ScientificClubsView clubs={filteredClubs} searchValue={searchValue} />;
            case "news":
                return <NewsView items={filteredNews} searchValue={searchValue} />;
            case "help":
                return <HelpView faqItems={filteredHelpItems} searchValue={searchValue} />;
            case "calendar":
                return <CalendarView lessons={filteredLessons} searchValue={searchValue} />;
            case "notes":
                return <NotesView notes={filteredNotes} searchValue={searchValue} />;
            case "homework":
                return <HomeworkView tasks={filteredHomework} searchValue={searchValue} />;
            case "progress":
                return (
                    <ProgressView
                        report={PROGRESS_REPORT}
                        searchValue={searchValue}
                        subjects={filteredProgressSubjects}
                    />
                );
            case "message":
                return (
                    <MessageView
                        isAuthenticated={isAuthenticated}
                        loginUrl={loginUrl}
                        observations={observations}
                        searchValue={searchValue}
                        threads={filteredThreads}
                    />
                );
            case "posts":
            default:
                return (
                    <PortalPostsView
                        currentUser={currentUser}
                        formValues={postForm}
                        hasAnyPosts={portalPosts.length > 0}
                        isAuthenticated={isAuthenticated}
                        isLoading={isPostsLoading}
                        isSaving={isSavingPost}
                        loginUrl={loginUrl}
                        onboardingUrl={onboardingUrl}
                        onContentChange={handleFieldChange("content")}
                        onSubmit={handleCreatePost}
                        onTitleChange={handleFieldChange("title")}
                        posts={filteredPosts}
                        postsError={postsError}
                        postsLastWeekCount={postsLastWeekCount}
                        searchValue={searchValue}
                        submitError={submitError}
                        submitSuccess={submitSuccess}
                        totalAuthorsCount={totalAuthorsCount}
                        totalPostsCount={portalPosts.length}
                    />
                );
        }
    }

    async function handleCreatePost(event) {
        event.preventDefault();
        if (isSavingPost) {
            return;
        }

        setIsSavingPost(true);
        setSubmitError("");
        setSubmitSuccess("");

        try {
            const responsePayload = await createPortalPost({
                payload: {
                    title: postForm.title,
                    content: postForm.content,
                },
                postsUrl,
                csrfToken,
                databaseErrorUrl,
            });

            if (responsePayload.post) {
                setPortalPosts((currentPosts) => [responsePayload.post, ...currentPosts].slice(0, 24));
            }

            setPostForm(EMPTY_POST_FORM);
            setSearchValue("");
            setSubmitSuccess(responsePayload.message || "Wpis zostal opublikowany.");
        } catch (error) {
            setSubmitError(error?.message || "Nie udalo sie zapisac wpisu.");
        } finally {
            setIsSavingPost(false);
        }
    }

    function handleFieldChange(fieldName) {
        return (event) => {
            const nextValue = event.target.value;
            setPostForm((currentForm) => ({
                ...currentForm,
                [fieldName]: nextValue,
            }));
            setSubmitError("");
            setSubmitSuccess("");
        };
    }

    return (
        <Reveal as="section" id="portal" className="portal-hub landing-section">
            <div className="portal-hub__inner">
                <aside className="portal-sidebar">
                    <div className="portal-sidebar__search">
                        <p>Wyszukiwanie</p>
                        <label htmlFor="portal-search" className="portal-sidebar__search-input">
                            <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                            <input
                                id="portal-search"
                                type="text"
                                value={searchValue}
                                onChange={(event) => setSearchValue(event.target.value)}
                                placeholder={searchPlaceholder}
                            />
                        </label>
                    </div>

                    {SIDEBAR_SECTIONS.map((section) => (
                        <div key={section.title} className="portal-sidebar__group">
                            <p className="portal-sidebar__heading">{section.title}</p>
                            <ul>
                                {section.items.map((item) => {
                                    const badgeValue = getSidebarBadgeValue(item);

                                    return (
                                        <li key={item.id}>
                                            <button
                                                type="button"
                                                className={joinClasses(
                                                    "portal-sidebar__button",
                                                    activeView === item.view && "is-active",
                                                )}
                                                aria-pressed={activeView === item.view}
                                                onClick={() => setActiveView(item.view)}
                                            >
                                                <span className="portal-sidebar__button-main">
                                                    <i className={item.icon} aria-hidden="true"></i>
                                                    <span>{item.label}</span>
                                                </span>
                                                <span className="portal-sidebar__badge">{badgeValue}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}

                    <PortalObservationsPanel
                        hasLoaded={hasLoadedObservations}
                        isAuthenticated={isAuthenticated}
                        loginUrl={loginUrl}
                        observations={observations}
                        observationsError={observationsError}
                    />
                </aside>

                <div className="portal-main">
                    {renderActiveView()}
                </div>
            </div>
        </Reveal>
    );
}
