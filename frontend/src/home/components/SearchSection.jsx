import { useEffect, useMemo, useState } from "react";

import {
    defaultSearchDate,
    defaultSearchSelections,
    getTutorSearchResults,
    searchFilterDefinitions,
    searchResultsSidebarDefinitions,
} from "../content.js";
import joinClasses from "../utils/joinClasses.js";
import Reveal from "./Reveal.jsx";
import SearchCalendar from "./SearchCalendar.jsx";
import SearchFilterSelect from "./SearchFilterSelect.jsx";
import SearchResultsView from "./SearchResultsView.jsx";
import { formatDateLabelFromIso } from "../utils/dateHelpers.js";

export default function SearchSection({
    isAuthenticated = false,
    urls = {},
}) {
    const [selectedFilters, setSelectedFilters] = useState(() => ({ ...defaultSearchSelections }));
    const [selectedDate, setSelectedDate] = useState(defaultSearchDate);
    const [appliedFilters, setAppliedFilters] = useState(() => ({ ...defaultSearchSelections }));
    const [appliedDate, setAppliedDate] = useState(defaultSearchDate);
    const [openFilterKey, setOpenFilterKey] = useState(null);
    const [isShowingResults, setIsShowingResults] = useState(false);

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

    const selectedDateLabel = useMemo(() => formatDateLabelFromIso(selectedDate), [selectedDate]);
    const appliedDateLabel = useMemo(() => formatDateLabelFromIso(appliedDate), [appliedDate]);
    const searchResults = useMemo(
        () => getTutorSearchResults(appliedFilters, appliedDate),
        [appliedDate, appliedFilters],
    );

    const selectionSummary = `${selectedFilters.subject}, ${selectedFilters.level}, ${selectedDateLabel}, ${selectedFilters.hour}`;
    const appliedSelectionSummary = `${appliedFilters.subject}, ${appliedFilters.level}, ${appliedDateLabel}, ${appliedFilters.hour}`;

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

        setAppliedFilters({ ...selectedFilters });
        setAppliedDate(selectedDate);
        setIsShowingResults(true);
        setOpenFilterKey(null);
    };

    const handleReset = () => {
        setSelectedFilters({ ...defaultSearchSelections });
        setSelectedDate(defaultSearchDate);
        setAppliedFilters({ ...defaultSearchSelections });
        setAppliedDate(defaultSearchDate);
        setIsShowingResults(false);
        setOpenFilterKey(null);
    };

    return (
        <section className={joinClasses("search-section", isShowingResults && "is-results-view")} id="wyszukiwarka">
            {isShowingResults ? (
                <>
                    <Reveal as="div" className="search-results__intro">
                        <div>
                            <p className="eyebrow">Wyniki wyszukiwania</p>
                            <h2>Korepetytorzy dopasowani do Twojego terminu.</h2>
                        </div>
                        <p className="search-results__intro-copy">{appliedSelectionSummary}</p>
                    </Reveal>

                    <Reveal as="div" className="search-results__layout">
                        <SearchResultsView
                            appliedDate={appliedDate}
                            appliedFilters={appliedFilters}
                            exactMatches={searchResults.exactMatches}
                            filterDefinitions={searchResultsSidebarDefinitions}
                            onFilterSelect={handleFilterSelect}
                            onReset={handleReset}
                            onSearch={handleSearch}
                            onSelectDate={setSelectedDate}
                            onToggleFilter={(filterKey) => setOpenFilterKey((currentValue) => (
                                currentValue === filterKey ? null : filterKey
                            ))}
                            openFilterKey={openFilterKey}
                            selectedDate={selectedDate}
                            selectedFilters={selectedFilters}
                            suggestedTutors={searchResults.suggestedTutors}
                        />
                    </Reveal>
                </>
            ) : (
                <>
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
                </>
            )}
        </section>
    );
}
