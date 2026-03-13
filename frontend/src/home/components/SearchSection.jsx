import { calendarDays, searchFilters, weekdayLabels } from "../content.js";
import joinClasses from "../utils/joinClasses.js";
import Reveal from "./Reveal.jsx";

export default function SearchSection() {
    return (
        <section className="search-section" id="wyszukiwarka">
            <Reveal as="div" className="search-section__copy">
                <h2>Uzyj filtrow, aby znalezc korepetytora idealnie dopasowanego pod Ciebie.</h2>
            </Reveal>

            <Reveal as="div" className="search-section__layout">
                <div className="search-panel" role="search" aria-label="Filtry wyszukiwarki korepetytorow">
                    <div className="search-panel__filters">
                        {searchFilters.map((filter) => (
                            <button
                                key={filter.label}
                                className={joinClasses("search-pill", filter.variant)}
                                type="button"
                                aria-label={filter.ariaLabel}
                            >
                                <span>{filter.label}</span>
                                <i className="fa-solid fa-angle-down" aria-hidden="true"></i>
                            </button>
                        ))}
                    </div>

                    <div className="search-calendar" aria-label="Dostepne terminy w marcu">
                        <div className="search-calendar__month">marzec</div>
                        <div className="search-calendar__weekdays">
                            {weekdayLabels.map((label) => (
                                <span key={label}>{label}</span>
                            ))}
                        </div>
                        <div className="search-calendar__days">
                            {calendarDays.map((item, index) => (
                                <span
                                    key={`${item.day}-${index}`}
                                    className={joinClasses(
                                        "search-calendar__day",
                                        item.muted && "is-muted",
                                        item.selected && "is-selected",
                                    )}
                                >
                                    {item.day}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <aside className="search-section__actions">
                    <a className="button button--primary" href="#kontakt">Szukaj wynikow</a>
                    <button className="button button--muted" type="button">Resetuj</button>
                </aside>
            </Reveal>
        </section>
    );
}
