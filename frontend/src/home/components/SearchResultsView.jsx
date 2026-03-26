import SearchCalendar from "./SearchCalendar.jsx";
import SearchFilterSelect from "./SearchFilterSelect.jsx";
import TutorResultCard from "./TutorResultCard.jsx";
import { formatDateLabelFromIso } from "../utils/dateHelpers.js";

function getResultWord(count) {
    if (count === 1) {
        return "wynik";
    }

    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14)) {
        return "wyniki";
    }

    return "wynikow";
}

function SearchResultList({ emptyMessage, onOpenTutorProfile, tutors }) {
    if (!tutors.length) {
        return <div className="search-results__empty">{emptyMessage}</div>;
    }

    return (
        <div className="search-results__list">
            {tutors.map((tutor) => (
                <TutorResultCard key={tutor.id} onOpenProfile={onOpenTutorProfile} tutor={tutor} />
            ))}
        </div>
    );
}

export default function SearchResultsView({
    appliedDate,
    appliedFilters,
    exactMatches,
    filterDefinitions,
    isLoading = false,
    onFilterSelect,
    onOpenTutorProfile,
    onReset,
    onSearch,
    onSelectDate,
    onToggleFilter,
    openFilterKey,
    searchError = "",
    selectedDate,
    selectedFilters,
    suggestedTutors,
}) {
    const activeSummaryTags = [
        appliedFilters.subject,
        appliedFilters.level,
        appliedFilters.hour,
        formatDateLabelFromIso(appliedDate),
        appliedFilters.topic,
    ];

    return (
        <div className="search-results">
            <aside className="search-results__sidebar">
                <div className="search-results__panel" role="search" aria-label="Filtry wynikow korepetytorow">
                    <div className="search-results__panel-header">
                        <span className="search-results__panel-label">Filtry</span>
                        <p>Dopasuj preferencje i uruchom wyszukiwanie ponownie.</p>
                    </div>

                    <div className="search-results__filters">
                        {filterDefinitions.map((filter) => (
                            <SearchFilterSelect
                                key={filter.key}
                                filter={filter}
                                isOpen={openFilterKey === filter.key}
                                selectedValue={selectedFilters[filter.key]}
                                onSelect={(option) => onFilterSelect(filter.key, option)}
                                onToggle={() => onToggleFilter(filter.key)}
                            />
                        ))}
                    </div>

                    <SearchCalendar selectedDate={selectedDate} onSelectDate={onSelectDate} />

                    <div className="search-results__actions">
                        {searchError ? <p className="search-section__error">{searchError}</p> : null}
                        <button
                            className="button button--primary"
                            type="button"
                            onClick={onSearch}
                            disabled={isLoading}
                        >
                            {isLoading ? "Szukanie..." : "Szukaj wynikow"}
                        </button>
                        <button
                            className="button button--muted"
                            type="button"
                            onClick={onReset}
                            disabled={isLoading}
                        >
                            Resetuj
                        </button>
                    </div>

                    <div className="search-results__snapshot">
                        <span className="search-results__snapshot-label">Ostatnie wyszukiwanie</span>
                        <strong className="search-results__snapshot-title">
                            {appliedFilters.subject}, {appliedFilters.level}
                        </strong>
                        <span className="search-results__snapshot-meta">
                            {formatDateLabelFromIso(appliedDate)}, {appliedFilters.hour}
                        </span>
                    </div>
                </div>
            </aside>

            <div className="search-results__content">
                <div className="search-results__summary">
                    {activeSummaryTags.map((tag) => (
                        <span key={tag} className="search-results__summary-pill">{tag}</span>
                    ))}
                </div>

                <section className="search-results__group" aria-labelledby="exact-results-heading">
                    <header className="search-results__group-header">
                        <h3 id="exact-results-heading">
                            Dopasowane godzinami: ({exactMatches.length} {getResultWord(exactMatches.length)})
                        </h3>
                    </header>

                    <SearchResultList
                        onOpenTutorProfile={onOpenTutorProfile}
                        tutors={exactMatches}
                        emptyMessage="Brak idealnych trafien dla tej godziny. Zmien termin albo poziom i wyszukaj ponownie."
                    />
                </section>

                <section className="search-results__group" aria-labelledby="suggested-results-heading">
                    <header className="search-results__group-header">
                        <h3 id="suggested-results-heading">
                            Sugerowani korepetytorzy ({suggestedTutors.length} {getResultWord(suggestedTutors.length)})
                        </h3>
                    </header>

                    <SearchResultList
                        onOpenTutorProfile={onOpenTutorProfile}
                        tutors={suggestedTutors}
                        emptyMessage="Nie mamy jeszcze tutorow podobnych do tego zapytania."
                    />
                </section>
            </div>
        </div>
    );
}
