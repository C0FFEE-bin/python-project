import Reveal from "./Reveal.jsx";

const SIDEBAR_SECTIONS = [
    {
        title: "Glowne zakladki",
        items: [
            { icon: "fa-solid fa-pen-to-square", label: "Wpisy" },
            { icon: "fa-solid fa-shapes", label: "Kolka naukowe" },
            { icon: "fa-solid fa-newspaper", label: "Nowosci" },
            { icon: "fa-solid fa-circle-question", label: "Pomoc" },
        ],
    },
    {
        title: "Dla mnie",
        items: [
            { icon: "fa-solid fa-calendar-days", label: "Moje zajecia" },
            { icon: "fa-solid fa-note-sticky", label: "Notatki z zajec" },
            { icon: "fa-solid fa-book-open-reader", label: "Zadania domowe" },
            { icon: "fa-solid fa-chart-line", label: "Postep w nauce" },
            { icon: "fa-solid fa-envelope", label: "Wyslij wiadomosc" },
        ],
    },
];

const PORTAL_POSTS = [
    {
        author: "Tomasz Kowalski",
        avatarSrc: "/static/main/img/profile1.png",
        dateLabel: "01.09.2024 o 15:13",
        followers: "1,021",
        lines: [
            "Nowy rok szkolny wlasnie sie zaczal - to idealny moment, zeby wejsc na wyzszy poziom!",
            "Nie czekaj, az pojawia sie zaleglosci - dzialaj od poczatku.",
            "Oferuje indywidualne korepetycje dopasowane do Twojego poziomu i celu.",
        ],
        checklist: [
            "proste tlumaczenie trudnych tematow",
            "spokojna atmosfera bez stresu",
            "realne efekty i lepsze oceny",
        ],
        footer: "Zainwestuj w siebie juz teraz. Napisz i zarezerwuj termin!",
    },
    {
        author: "Sebastian Enrique Alvarez",
        avatarSrc: "/static/main/img/profile2.png",
        dateLabel: "01.09.2024 o 19:15",
        followers: "311",
        lines: [
            "Dziekuje wszystkim uczniom za poprzedni rok.",
            "To byla swietna wspolpraca i masa wspolnie osiagnietych celow.",
            "Zaczynamy kolejny rok nauki - nowe wyzwania, ale tez nowe mozliwosci.",
        ],
        checklist: [
            "material dzielony na male etapy",
            "regularne podsumowania postepu",
            "wiecej pewnosci przed kartkowkami",
        ],
        footer: "Mam obecnie 2 wolne terminy, wiec jesli ktos chce dolaczyc - zapraszam.",
    },
];

export default function PortalSection() {
    return (
        <Reveal as="section" id="portal" className="portal-hub landing-section">
            <div className="portal-hub__inner">
                <aside className="portal-sidebar">
                    <div className="portal-sidebar__search">
                        <p>Wyszukiwanie</p>
                        <label htmlFor="portal-search" className="portal-sidebar__search-input">
                            <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                            <input id="portal-search" type="text" placeholder="Szukaj..." />
                        </label>
                    </div>

                    {SIDEBAR_SECTIONS.map((section) => (
                        <div key={section.title} className="portal-sidebar__group">
                            <p className="portal-sidebar__heading">{section.title}</p>
                            <ul>
                                {section.items.map((item) => (
                                    <li key={item.label}>
                                        <i className={item.icon} aria-hidden="true"></i>
                                        <span>{item.label}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    <div className="portal-sidebar__group">
                        <p className="portal-sidebar__heading">Twoje obserwacje</p>
                        <p className="portal-sidebar__empty">Nikogo nie obserwujesz</p>
                    </div>
                </aside>

                <div className="portal-feed">
                    {PORTAL_POSTS.map((post) => (
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
            </div>
        </Reveal>
    );
}
