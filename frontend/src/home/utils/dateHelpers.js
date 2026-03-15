const monthNames = [
    "styczen",
    "luty",
    "marzec",
    "kwiecien",
    "maj",
    "czerwiec",
    "lipiec",
    "sierpien",
    "wrzesien",
    "pazdziernik",
    "listopad",
    "grudzien",
];

const monthNamesGenitive = [
    "stycznia",
    "lutego",
    "marca",
    "kwietnia",
    "maja",
    "czerwca",
    "lipca",
    "sierpnia",
    "wrzesnia",
    "pazdziernika",
    "listopada",
    "grudnia",
];

export function parseIsoDate(value) {
    if (!value) {
        return null;
    }

    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
}

export function toIsoDate(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
}

export function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date, amount) {
    return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function getMonthLabel(date) {
    return monthNames[date.getMonth()];
}

export function formatDateLabel(date) {
    return `${date.getDate()} ${monthNamesGenitive[date.getMonth()]}`;
}

export function formatDateLabelFromIso(value) {
    const date = parseIsoDate(value);
    return date ? formatDateLabel(date) : "Brak daty";
}

export function getCalendarDaysForMonth(monthDate) {
    const firstDayOfMonth = startOfMonth(monthDate);
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(
        firstDayOfMonth.getFullYear(),
        firstDayOfMonth.getMonth(),
        firstDayOfMonth.getDate() - startOffset,
    );

    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(
            gridStart.getFullYear(),
            gridStart.getMonth(),
            gridStart.getDate() + index,
        );

        return {
            day: String(date.getDate()),
            label: formatDateLabel(date),
            muted: date.getMonth() !== monthDate.getMonth(),
            value: toIsoDate(date),
        };
    });
}
