import { useEffect, useMemo, useState } from "react";

import {
    defaultSearchDate,
    defaultSearchSelections,
    getTutorSearchResults,
    searchResultsSidebarDefinitions,
} from "../content.js";
import SearchResultsView from "./SearchResultsView.jsx";
import { formatDateLabelFromIso } from "../utils/dateHelpers.js";

export default function SearchResultsPage({
    initialDate = defaultSearchDate,
    initialFilters = defaultSearchSelections,
    onBackToSearch,
    onOpenTutorProfile,
    onSearchSubmit,
}) {
    const [selectedFilters, setSelectedFilters] = useState(() => ({ ...initialFilters }));
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [appliedFilters, setAppliedFilters] = useState(() => ({ ...initialFilters }));
    const [appliedDate, setAppliedDate] = useState(initialDate);
    const [openFilterKey, setOpenFilterKey] = useState(null);

    useEffect(() => {
        setSelectedFilters({ ...initialFilters });
        setSelectedDate(initialDate);
        setAppliedFilters({ ...initialFilters });
        setAppliedDate(initialDate);
        setOpenFilterKey(null);
    }, [initialDate, initialFilters]);

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

    const appliedDateLabel = useMemo(() => formatDateLabelFromIso(appliedDate), [appliedDate]);
    const searchResults = useMemo(
        () => getTutorSearchResults(appliedFilters, appliedDate),
        [appliedDate, appliedFilters],
    );
    const appliedSelectionSummary = `${appliedFilters.subject}, ${appliedFilters.level}, ${appliedDateLabel}, ${appliedFilters.hour}`;

    const handleFilterSelect = (filterKey, option) => {
        setSelectedFilters((currentValue) => ({
            ...currentValue,
            [filterKey]: option,
        }));
        setOpenFilterKey(null);
    };

    const handleSearch = () => {
        const nextFilters = { ...selectedFilters };

        setAppliedFilters(nextFilters);
        setAppliedDate(selectedDate);
        setOpenFilterKey(null);
        onSearchSubmit?.(nextFilters, selectedDate);
    };

    const handleReset = () => {
        setSelectedFilters({ ...defaultSearchSelections });
        setSelectedDate(defaultSearchDate);
        setAppliedFilters({ ...defaultSearchSelections });
        setAppliedDate(defaultSearchDate);
        setOpenFilterKey(null);
        onBackToSearch?.();
    };

    return (
        <section className="search-section is-results-view landing-section" id="search-results-page">
            <div className="search-results-page__toolbar">
                <button className="search-results-page__back" type="button" onClick={onBackToSearch}>
                    <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
                    Wroc do wyszukiwarki
                </button>
            </div>

            <div className="search-results__intro">
                <div>
                    <p className="eyebrow">Wyniki wyszukiwania</p>
                    <h2>Korepetytorzy dopasowani do Twojego terminu.</h2>
                </div>
                <p className="search-results__intro-copy">{appliedSelectionSummary}</p>
            </div>

            <div className="search-results__layout">
                <SearchResultsView
                    appliedDate={appliedDate}
                    appliedFilters={appliedFilters}
                    exactMatches={searchResults.exactMatches}
                    filterDefinitions={searchResultsSidebarDefinitions}
                    onFilterSelect={handleFilterSelect}
                    onOpenTutorProfile={(tutorId) => onOpenTutorProfile?.(tutorId, appliedFilters, appliedDate)}
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
            </div>
        </section>
    );
}
