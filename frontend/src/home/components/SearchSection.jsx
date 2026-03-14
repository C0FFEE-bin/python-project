import { useEffect, useMemo, useState } from "react";

import {
    calendarDays,
    defaultSearchDate,
    defaultSearchSelections,
    searchFilterDefinitions,
} from "../content.js";
import Reveal from "./Reveal.jsx";
import SearchCalendar from "./SearchCalendar.jsx";
import SearchFilterSelect from "./SearchFilterSelect.jsx";

export default function SearchSection() {
    const [selectedFilters, setSelectedFilters] = useState(defaultSearchSelections);
    const [selectedDate, setSelectedDate] = useState(defaultSearchDate);
    const [openFilterKey, setOpenFilterKey] = useState(null);

    useEffect(() => {
        const handlePointerDown = (event) => {
            if (event.target.closest("[data-search-select]")) {
                return;
            }

            setOpenFilterKey(null);
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, []);

    const selectedDateLabel = useMemo(
        () => calendarDays.find((item) => item.value === selectedDate)?.label ?? "Brak daty",
        [selectedDate],
    );

    const handleFilterSelect = (filterKey, option) => {
        setSelectedFilters((currentValue) => ({
            ...currentValue,
            [filterKey]: option,
        }));
        setOpenFilterKey(null);
    };

    const handleReset = () => {
        setSelectedFilters(defaultSearchSelections);
        setSelectedDate(defaultSearchDate);
        setOpenFilterKey(null);
    };

    return (
        <section className="search-section" id="wyszukiwarka">
            <Reveal as="div" className="search-section__copy">
                <h2>Uzyj filtrow, aby znalezc korepetytora idealnie dopasowanego pod Ciebie.</h2>
            </Reveal>

            <Reveal as="div" className="search-section__layout">
                <div className="search-panel" role="search" aria-label="Filtry wyszukiwarki korepetytorow">
                    <div className="search-panel__filters">
                        {searchFilterDefinitions.map((filter) => (
                            <SearchFilterSelect
                                key={filter.key}
                                filter={filter}
                                isOpen={openFilterKey === filter.key}
                                selectedValue={selectedFilters[filter.key]}
                                onSelect={(option) => handleFilterSelect(filter.key, option)}
                                onToggle={() => setOpenFilterKey((currentValue) => (
                                    currentValue === filter.key ? null : filter.key
                                ))}
                            />
                        ))}
                    </div>

                    <SearchCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                </div>

                <aside className="search-section__actions">
                    <p className="search-section__selection">
                        {selectedFilters.subject}, {selectedFilters.level}, {selectedDateLabel}
                    </p>
                    <a className="button button--primary" href="#kontakt">Szukaj wynikow</a>
                    <button className="button button--muted" type="button" onClick={handleReset}>Resetuj</button>
                </aside>
            </Reveal>
        </section>
    );
}
