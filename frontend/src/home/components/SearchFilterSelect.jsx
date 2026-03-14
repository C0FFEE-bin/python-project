import joinClasses from "../utils/joinClasses.js";

export default function SearchFilterSelect({
    filter,
    isOpen,
    selectedValue,
    onSelect,
    onToggle,
}) {
    return (
        <div className="search-filter" data-search-select="">
            <button
                className={joinClasses("search-pill", filter.variant, isOpen && "is-open")}
                type="button"
                onClick={onToggle}
                aria-label={filter.ariaLabel}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <span className="search-pill__value">{selectedValue || filter.placeholder}</span>
                <i className="fa-solid fa-angle-down" aria-hidden="true"></i>
            </button>

            {isOpen && (
                <div className="search-filter__menu" role="listbox" aria-label={filter.placeholder}>
                    {filter.options.map((option) => (
                        <button
                            key={option}
                            className={joinClasses(
                                "search-filter__option",
                                option === selectedValue && "is-selected",
                            )}
                            type="button"
                            onClick={() => onSelect(option)}
                        >
                            <span>{option}</span>
                            {option === selectedValue && (
                                <i className="search-filter__check fa-solid fa-check" aria-hidden="true"></i>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
