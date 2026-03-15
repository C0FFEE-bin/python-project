import { useEffect, useMemo, useState } from "react";

import { weekdayLabels } from "../content.js";
import {
    addMonths,
    formatDateLabelFromIso,
    getCalendarDaysForMonth,
    getMonthLabel,
    parseIsoDate,
    startOfMonth,
} from "../utils/dateHelpers.js";
import joinClasses from "../utils/joinClasses.js";

export default function SearchCalendar({ selectedDate, onSelectDate }) {
    const [displayedMonth, setDisplayedMonth] = useState(() => startOfMonth(parseIsoDate(selectedDate)));

    useEffect(() => {
        const parsedDate = parseIsoDate(selectedDate);

        if (!parsedDate) {
            return;
        }

        setDisplayedMonth(startOfMonth(parsedDate));
    }, [selectedDate]);

    const selectedDateLabel = formatDateLabelFromIso(selectedDate);
    const calendarDays = useMemo(() => getCalendarDaysForMonth(displayedMonth), [displayedMonth]);

    return (
        <div className="search-calendar" aria-label={`Dostepne terminy w ${getMonthLabel(displayedMonth)}`}>
            <div className="search-calendar__header">
                <button
                    className="search-calendar__nav"
                    type="button"
                    onClick={() => setDisplayedMonth((currentValue) => addMonths(currentValue, -1))}
                    aria-label="Pokaz poprzedni miesiac"
                >
                    <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
                </button>
                <div className="search-calendar__month">{getMonthLabel(displayedMonth)}</div>
                <button
                    className="search-calendar__nav"
                    type="button"
                    onClick={() => setDisplayedMonth((currentValue) => addMonths(currentValue, 1))}
                    aria-label="Pokaz nastepny miesiac"
                >
                    <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
                </button>
            </div>
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
