import { useEffect, useMemo, useState } from "react";

import {
    defaultSearchDate,
    defaultSearchSelections,
    searchFilterDefinitions,
} from "../content.js";
import Reveal from "./Reveal.jsx";
import SearchCalendar from "./SearchCalendar.jsx";
import SearchFilterSelect from "./SearchFilterSelect.jsx";
import { formatDateLabelFromIso } from "../utils/dateHelpers.js";

export default function SearchSection({
    initialDate = defaultSearchDate,
    initialFilters = defaultSearchSelections,
    isAuthenticated = false,
    onSearchSubmit,
    urls = {},
}) {
    const [selectedFilters, setSelectedFilters] = useState(() => ({ ...initialFilters }));
    const [selectedDate, setSelectedDate] = useState(initialDate);
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

    useEffect(() => {
        setSelectedFilters({ ...initialFilters });
        setSelectedDate(initialDate);
    }, [initialDate, initialFilters]);

    const selectedDateLabel = useMemo(() => formatDateLabelFromIso(selectedDate), [selectedDate]);
    const selectionSummary = `${selectedFilters.subject}, ${selectedFilters.level}, ${selectedDateLabel}, ${selectedFilters.hour}`;

    const handleFilterSelect = (filterKey, option) => {
        setSelectedFilters((currentValue) => ({
            ...currentValue,
            [filterKey]: option,
        }));
        setOpenFilterKey(null);
    };

    const handleSearch = () => {
        if (!isAuthenticated) {
            const loginUrl = urls.login ?? "/login";
            const nextTarget = `${window.location.pathname}${window.location.search}#wyszukiwarka`;

            window.location.assign(`${loginUrl}?next=${encodeURIComponent(nextTarget)}`);
            return;
        }

        setOpenFilterKey(null);
        onSearchSubmit?.({ ...selectedFilters }, selectedDate);
    };

    const handleReset = () => {
        setSelectedFilters({ ...defaultSearchSelections });
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
                    <p className="search-section__selection">{selectionSummary}</p>
                    <button className="button button--primary" type="button" onClick={handleSearch}>
                        Szukaj wynikow
                    </button>
                    <button className="button button--muted" type="button" onClick={handleReset}>
                        Resetuj
                    </button>
                </aside>
            </Reveal>
        </section>
    );
}
