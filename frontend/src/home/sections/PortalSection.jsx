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

    const postsLastWeekCount = portalPosts.filter((post) => {
        const createdTimestamp = Date.parse(post.createdAt || "");
        return Number.isFinite(createdTimestamp) && (Date.now() - createdTimestamp) <= 7 * 24 * 60 * 60 * 1000;
    }).length;
    const totalAuthorsCount = new Set(portalPosts.map((post) => post.author).filter(Boolean)).size;
    const searchPlaceholder = activeView === "clubs"
        ? "Szukaj kol, tematow lub projektow..."
        : "Szukaj wpisow, autorow lub tematow...";

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
                                    const badgeValue = item.view === "posts"
                                        ? formatPostsBadge(portalPosts.length)
                                        : item.badge;

                                    return (
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
                                                    <span className="portal-sidebar__badge">{badgeValue}</span>
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
                    {activeView === "clubs" ? (
                        <ScientificClubsView clubs={filteredClubs} searchValue={searchValue} />
                    ) : (
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
                    )}
                </div>
            </div>
        </Reveal>
    );
}
