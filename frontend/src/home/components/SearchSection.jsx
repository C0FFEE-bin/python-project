import { useEffect, useMemo, useState } from "react";

import {
    defaultSearchDate,
    defaultSearchSelections,
    searchFilterDefinitions,
} from "../content.js";
import { formatDateLabelFromIso } from "../utils/dateHelpers.js";
import joinClasses from "../utils/joinClasses.js";
import Reveal from "./Reveal.jsx";
import SearchCalendar from "./SearchCalendar.jsx";
import SearchFilterSelect from "./SearchFilterSelect.jsx";
import SearchResultsView from "./SearchResultsView.jsx";

const emptySearchResults = {
    exactMatches: [],
    suggestedTutors: [],
};

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
    const [isShowingResults, setIsShowingResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [searchResults, setSearchResults] = useState(emptySearchResults);

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

    const selectedDateLabel = useMemo(() => formatDateLabelFromIso(selectedDate), [selectedDate]);
    const selectionSummary = `${selectedFilters.subject}, ${selectedFilters.level}, ${selectedDateLabel}, ${selectedFilters.hour}`;

    const handleFilterSelect = (filterKey, option) => {
        setSelectedFilters((currentValue) => ({
            ...currentValue,
            [filterKey]: option,
        }));
        setOpenFilterKey(null);
    };

    const handleSearch = async () => {
        if (!isAuthenticated) {
            const loginUrl = urls.login ?? "/login";
            const nextTarget = `${window.location.pathname}${window.location.search}#wyszukiwarka`;

            window.location.assign(`${loginUrl}?next=${encodeURIComponent(nextTarget)}`);
            return;
        }

        const searchUrl = new URL(urls.tutorSearch ?? "/api/tutor-search", window.location.origin);
        searchUrl.search = new URLSearchParams({
            ...selectedFilters,
            date: selectedDate,
        }).toString();

        setIsSearching(true);
        setSearchError("");
        setOpenFilterKey(null);

        try {
            const response = await fetch(searchUrl.toString(), {
                headers: {
                    Accept: "application/json",
                },
            });

            let payload = {};
            try {
                payload = await response.json();
            } catch {
                payload = {};
            }

            if (!response.ok) {
                throw new Error(payload.detail || "Nie udalo sie pobrac wynikow z bazy.");
            }

            setSearchResults({
                exactMatches: payload.exactMatches ?? [],
                suggestedTutors: payload.suggestedTutors ?? [],
            });
            setAppliedFilters({ ...selectedFilters });
            setAppliedDate(selectedDate);
            setIsShowingResults(true);
        } catch (error) {
            setSearchError(
                error instanceof Error ? error.message : "Nie udalo sie pobrac wynikow z bazy.",
            );
        } finally {
            setIsSearching(false);
        }
    };

    const handleReset = () => {
        setSelectedFilters({ ...defaultSearchSelections });
        setSelectedDate(defaultSearchDate);
        setAppliedFilters({ ...defaultSearchSelections });
        setAppliedDate(defaultSearchDate);
        setSearchResults(emptySearchResults);
        setIsSearching(false);
        setSearchError("");
        setIsShowingResults(false);
        setOpenFilterKey(null);
    };

    return (
        <section className="search-section" id="wyszukiwarka">
            <Reveal as="div" className="search-section__copy">
                <h2>Uzyj filtrow, aby znalezc korepetytora idealnie dopasowanego pod Ciebie.</h2>
            </Reveal>

                    <Reveal as="div" className="search-results__layout">
                        <SearchResultsView
                            appliedDate={appliedDate}
                            appliedFilters={appliedFilters}
                            exactMatches={searchResults.exactMatches}
                            filterDefinitions={searchResultsSidebarDefinitions}
                            isLoading={isSearching}
                            onFilterSelect={handleFilterSelect}
                            onReset={handleReset}
                            onSearch={handleSearch}
                            onSelectDate={setSelectedDate}
                            onToggleFilter={(filterKey) => setOpenFilterKey((currentValue) => (
                                currentValue === filterKey ? null : filterKey
                            ))}
                            openFilterKey={openFilterKey}
                            searchError={searchError}
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
                            />
                        ))}
                    </div>

                    <SearchCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                </div>

                        <aside className="search-section__actions">
                            <p className="search-section__selection">{selectionSummary}</p>
                            {searchError ? <p className="search-section__error">{searchError}</p> : null}
                            <button
                                className="button button--primary"
                                type="button"
                                onClick={handleSearch}
                                disabled={isSearching}
                            >
                                {isSearching ? "Szukanie..." : "Szukaj wynikow"}
                            </button>
                            <button
                                className="button button--muted"
                                type="button"
                                onClick={handleReset}
                                disabled={isSearching}
                            >
                                Resetuj
                            </button>
                        </aside>
                    </Reveal>
                </>
            )}
        </section>
    );
}
