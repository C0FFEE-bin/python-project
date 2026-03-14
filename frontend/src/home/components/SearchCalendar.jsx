import { calendarDays, weekdayLabels } from "../content.js";
import joinClasses from "../utils/joinClasses.js";

export default function SearchCalendar({ selectedDate, onSelectDate }) {
    const selectedDateLabel = calendarDays.find((item) => item.value === selectedDate)?.label ?? "Brak daty";

    return (
        <div className="search-calendar" aria-label="Dostepne terminy w marcu">
            <div className="search-calendar__month">marzec</div>
            <div className="search-calendar__weekdays">
                {weekdayLabels.map((label) => (
                    <span key={label}>{label}</span>
                ))}
            </div>
            <div className="search-calendar__days">
                {calendarDays.map((item) => (
                    <span
                        key={item.value}
                        className={joinClasses(
                            "search-calendar__day",
                            item.muted && "is-muted",
                            item.value === selectedDate && "is-selected",
                        )}
                    >
                        <button
                            className="search-calendar__day-button"
                            type="button"
                            onClick={() => onSelectDate(item.value)}
                            aria-pressed={item.value === selectedDate}
                            aria-label={`Wybierz date ${item.label}`}
                        >
                            {item.day}
                        </button>
                    </span>
                ))}
            </div>
            <div className="search-calendar__selection">Wybrana data: {selectedDateLabel}</div>
        </div>
    );
}
