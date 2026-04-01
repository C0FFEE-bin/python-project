import { useState } from "react";

import Reveal from "../components/Reveal.jsx";

const SIDEBAR_SECTIONS = [
    {
        title: "Glowne zakladki",
        items: [
            { id: "posts", icon: "fa-solid fa-pen-to-square", label: "Wpisy", view: "posts", badge: "02" },
            { id: "clubs", icon: "fa-solid fa-flask-vial", label: "Kola naukowe", view: "clubs", badge: "06" },
            { id: "news", icon: "fa-solid fa-newspaper", label: "Nowosci", note: "wkrotce" },
            { id: "help", icon: "fa-solid fa-circle-question", label: "Pomoc", note: "faq" },
        ],
    },
    {
        title: "Dla mnie",
        items: [
            { id: "calendar", icon: "fa-solid fa-calendar-days", label: "Moje zajecia", note: "3 terminy" },
            { id: "notes", icon: "fa-solid fa-note-sticky", label: "Notatki z zajec", note: "12 wpisow" },
            { id: "homework", icon: "fa-solid fa-book-open-reader", label: "Zadania domowe", note: "4 aktywne" },
            { id: "progress", icon: "fa-solid fa-chart-line", label: "Postep w nauce", note: "raport" },
            { id: "message", icon: "fa-solid fa-envelope", label: "Wyslij wiadomosc", note: "nowe" },
        ],
    },
];

const PORTAL_POSTS = [
    {
        author: "Tomasz Kowalski",
        avatarSrc: "/static/main/img/profile1.png",
        dateLabel: "01.04.2026 o 15:13",
        followers: "1,021",
        tags: ["matura", "matematyka", "planowanie"],
        lines: [
            "Nowy semestr to dobry moment, zeby ustalic rytm pracy i nie czekac na pierwsze zaleglosci.",
            "Rozpisalem trzy proste kroki, ktore pomagaja utrzymac regularnosc i szybciej wychwycic braki.",
            "Jesli chcesz, moge pomoc Ci ulozyc tygodniowy plan nauki pod mature lub kolokwium.",
        ],
        checklist: [
            "cotygodniowy plan z priorytetami",
            "powtorki rozbite na male bloki",
            "mierzalne cele na kazdy tydzien",
        ],
        footer: "Mam dwa wolne terminy na konsultacje organizacyjne w tym tygodniu.",
    },
    {
        author: "Sebastian Enrique Alvarez",
        avatarSrc: "/static/main/img/profile2.png",
        dateLabel: "30.03.2026 o 19:15",
        followers: "311",
        tags: ["fizyka", "egzamin", "warsztaty"],
        lines: [
            "Dziekuje wszystkim uczniom za poprzedni semestr i swietna wspolprace przy przygotowaniach do egzaminow.",
            "W kwietniu ruszamy z mini-warsztatami z rachunku bledow i rozwiazywania zadan otwartych.",
            "Jesli potrzebujesz intensywnej powtorki przed sprawdzianem, napisz do mnie przez portal.",
        ],
        checklist: [
            "zadania egzaminacyjne krok po kroku",
            "krotkie bloki teorii przed praktyka",
            "powtorki w grupie 2-3 osobowej",
        ],
        footer: "Zostaly mi dwa miejsca w czwartkowym bloku wieczornym.",
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

const OBSERVED_ITEMS = {
    posts: ["AI & Data Lab", "Tomasz Kowalski", "Robotics Forge"],
    clubs: ["Bio Innovators", "Law & Policy Lab", "Astronomical Observatory Crew"],
};

function joinClasses(...classes) {
    return classes.filter(Boolean).join(" ");
}

function matchesSearch(searchValue, entries) {
    if (!searchValue) {
        return true;
    }

    return entries.some((entry) => String(entry).toLowerCase().includes(searchValue));
}

function PortalPostsView({ posts, searchValue }) {
    return (
        <>
            <section className="portal-main__intro">
                <div>
                    <p className="portal-main__eyebrow">Portal ucznia</p>
                    <h2>Wpisy, ogloszenia i szybkie aktualnosci od tutorow</h2>
                    <p className="portal-main__copy">
                        Zbieraj informacje o wolnych terminach, mini-warsztatach i nowych materialach bez
                        przechodzenia miedzy zakladkami.
                    </p>
                </div>

                <div className="portal-main__stats">
                    <div className="portal-main__stat">
                        <strong>{posts.length}</strong>
                        <span>aktywnych wpisow</span>
                    </div>
                    <div className="portal-main__stat">
                        <strong>5</strong>
                        <span>nowych terminow w tym tygodniu</span>
                    </div>
                    <div className="portal-main__stat">
                        <strong>1:1</strong>
                        <span>szybki kontakt z tutorami</span>
                    </div>
                </div>
            </section>

            {posts.length ? (
                <div className="portal-feed__list">
                    {posts.map((post) => (
                        <article key={post.author} className="portal-post">
                            <header className="portal-post__header">
                                <div className="portal-post__identity">
                                    <img src={post.avatarSrc} alt={post.author} />
                                    <div>
                                        <h3>{post.author}</h3>
                                        <div className="portal-post__meta">
                                            <span className="portal-post__follow">Obserwuj</span>
                                            <span>{post.followers}</span>
                                        </div>
                                    </div>
                                </div>
                                <time>{post.dateLabel}</time>
                            </header>

                            <div className="portal-post__body">
                                <div className="portal-post__tags" aria-label="Tematy wpisu">
                                    {post.tags.map((tag) => (
                                        <span key={tag} className="portal-post__tag">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {post.lines.map((line) => (
                                    <p key={line}>{line}</p>
                                ))}

                                <ul>
                                    {post.checklist.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>

                                <p className="portal-post__footer">{post.footer}</p>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="portal-empty-state">
                    Nie znaleziono wpisow pasujacych do frazy <strong>{searchValue}</strong>.
                </div>
            )}
        </>
    );
}

function ScientificClubsView({ clubs, searchValue }) {
    const totalMembers = clubs.reduce((sum, club) => sum + club.membersCount, 0);

    return (
        <>
            <section className="portal-main__intro portal-main__intro--clubs">
                <div>
                    <p className="portal-main__eyebrow">Nowa zakladka</p>
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

export default function PortalSection() {
    const [activeView, setActiveView] = useState("posts");
    const [searchValue, setSearchValue] = useState("");

    const normalizedSearch = searchValue.trim().toLowerCase();

    const filteredPosts = PORTAL_POSTS.filter((post) =>
        matchesSearch(normalizedSearch, [
            post.author,
            post.footer,
            ...post.tags,
            ...post.lines,
            ...post.checklist,
        ]),
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

    const observedItems = OBSERVED_ITEMS[activeView];
    const searchPlaceholder = activeView === "clubs"
        ? "Szukaj kol, tematow lub projektow..."
        : "Szukaj wpisow lub autorow...";

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
                                {section.items.map((item) => (
                                    <li key={item.id}>
                                        {item.view ? (
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
                                                <span className="portal-sidebar__badge">{item.badge}</span>
                                            </button>
                                        ) : (
                                            <div className="portal-sidebar__item">
                                                <span className="portal-sidebar__button-main">
                                                    <i className={item.icon} aria-hidden="true"></i>
                                                    <span>{item.label}</span>
                                                </span>
                                                <span className="portal-sidebar__note">{item.note}</span>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    <div className="portal-sidebar__group">
                        <p className="portal-sidebar__heading">Twoje obserwacje</p>
                        <div className="portal-sidebar__stack">
                            {observedItems.map((item) => (
                                <span key={item} className="portal-sidebar__stack-item">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </aside>

                <div className="portal-main">
                    {activeView === "clubs" ? (
                        <ScientificClubsView clubs={filteredClubs} searchValue={searchValue} />
                    ) : (
                        <PortalPostsView posts={filteredPosts} searchValue={searchValue} />
                    )}
                </div>
            </div>
        </Reveal>
    );
}
