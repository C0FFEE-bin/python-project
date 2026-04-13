import { useEffect, useMemo, useState } from "react";

import { toggleTutorObservation } from "../api.js";

const PROFILE_TABS = [
    { id: "info", label: "Informacje" },
    { id: "posts", label: "Wpisy" },
    { id: "gallery", label: "Zdjecia" },
    { id: "achievements", label: "Osiagniecia" },
];

const SIDEBAR_SECTIONS = [
    {
        title: "Glowne zakladki",
        items: [
            { id: "posts", icon: "fa-solid fa-pen-to-square", label: "Wpisy", note: "new" },
            { id: "clubs", icon: "fa-solid fa-flask-vial", label: "Kola naukowe", note: "06" },
            { id: "news", icon: "fa-solid fa-newspaper", label: "Nowosci", note: "hot" },
            { id: "help", icon: "fa-solid fa-circle-question", label: "Pomoc", note: "faq" },
        ],
    },
    {
        title: "Dla mnie",
        items: [
            { id: "calendar", icon: "fa-solid fa-calendar-days", label: "Moje zajecia", note: "3" },
            { id: "notes", icon: "fa-solid fa-note-sticky", label: "Notatki z zajec", note: "12" },
            { id: "homework", icon: "fa-solid fa-book-open-reader", label: "Zadania domowe", note: "4" },
            { id: "progress", icon: "fa-solid fa-chart-line", label: "Postep w nauce", note: "raport" },
            { id: "message", icon: "fa-solid fa-envelope", label: "Wyslij wiadomosc", note: "nowe" },
        ],
    },
];

const BOOKABLE_SLOT_STATUSES = new Set(["available", "highlighted"]);

function safeArray(values) {
    return Array.isArray(values) ? values : [];
}

function StarIcon({ isFilled = true }) {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
            <path
                d="M12 2.9 14.9 8.8l6.5.9-4.7 4.5 1.1 6.4L12 17.5l-5.8 3.1 1.1-6.4-4.7-4.5 6.5-.9Z"
                fill={isFilled ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.4"
            />
        </svg>
    );
}

function RatingStars({ rating }) {
    const filledStars = Math.max(0, Math.round(rating ?? 0));

    return (
        <div className="tutor-profile__stars" aria-label={`Ocena ${rating ?? 0} na 5`}>
            {Array.from({ length: 5 }, (_, index) => (
                <StarIcon key={index} isFilled={index < filledStars} />
            ))}
        </div>
    );
}

function buildDateFromIso(dateIso) {
    if (!dateIso) {
        return null;
    }

    const date = new Date(`${dateIso}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatLongDateLabel(dateIso, fallbackLabel = "") {
    const date = buildDateFromIso(dateIso);
    if (!date) {
        return fallbackLabel;
    }

    const weekdayLabel = new Intl.DateTimeFormat("pl-PL", { weekday: "long" }).format(date);
    const dateLabel = new Intl.DateTimeFormat("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);

    return `${weekdayLabel}, ${dateLabel}`;
}

function formatShortDateLabel(dateIso, fallbackLabel = "") {
    const date = buildDateFromIso(dateIso);
    if (!date) {
        return fallbackLabel;
    }

    return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit" }).format(date);
}

function formatWeekdayShortLabel(dateIso) {
    const date = buildDateFromIso(dateIso);
    if (!date) {
        return "";
    }

    return new Intl.DateTimeFormat("pl-PL", { weekday: "short" }).format(date).replace(".", "");
}

function buildTimeRangeLabel(startLabel) {
    if (!startLabel || !startLabel.includes(":")) {
        return startLabel || "";
    }

    const [hoursLabel, minutesLabel] = startLabel.split(":");
    const hours = Number(hoursLabel);
    const minutes = Number(minutesLabel);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
        return startLabel;
    }

    return `${startLabel}-${String((hours + 1) % 24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function parseRequestedHourStart(hourRange) {
    return String(hourRange || "").split("-")[0].trim();
}

function buildBookableSlots(schedule) {
    const days = safeArray(schedule?.days);
    const rows = safeArray(schedule?.rows);
    const slots = [];

    rows.forEach((row) => {
        safeArray(row?.slots).forEach((slotStatus, index) => {
            if (!BOOKABLE_SLOT_STATUSES.has(slotStatus)) {
                return;
            }

            const day = days[index];
            if (!day?.iso) {
                return;
            }

            slots.push({
                id: `${day.iso}-${row.timeLabel}`,
                dateIso: day.iso,
                shortDateLabel: formatShortDateLabel(day.iso, day.label || ""),
                fullDateLabel: formatLongDateLabel(day.iso, day.label || ""),
                weekdayLabel: formatWeekdayShortLabel(day.iso),
                timeLabel: row.timeLabel || "",
                timeRangeLabel: buildTimeRangeLabel(row.timeLabel || ""),
                isHighlighted: slotStatus === "highlighted",
            });
        });
    });

    return slots;
}

function getPreferredSlotId(slots, requestDate, requestFilters) {
    if (!slots.length) {
        return "";
    }

    const requestedStart = parseRequestedHourStart(requestFilters?.hour);
    const exactMatch = slots.find((slot) => slot.dateIso === requestDate && slot.timeLabel === requestedStart);
    if (exactMatch) {
        return exactMatch.id;
    }

    return slots.find((slot) => slot.isHighlighted)?.id || slots[0].id;
}

function buildSubjectOptions(tutor, requestFilters) {
    const options = [];
    const requestedSubject = String(requestFilters?.subject || "").trim();

    safeArray(tutor?.subjects).forEach((subject) => {
        const nextSubject = String(subject).trim();
        if (nextSubject && !options.includes(nextSubject)) {
            options.push(nextSubject);
        }
    });

    if (requestedSubject && !options.some((subject) => subject.toLowerCase() === requestedSubject.toLowerCase())) {
        options.unshift(requestedSubject);
    }

    if (!options.length) {
        safeArray(tutor?.tags).forEach((tag) => {
            const nextTag = String(tag).trim();
            if (nextTag && !options.includes(nextTag)) {
                options.push(nextTag);
            }
        });
    }

    return options.slice(0, 4);
}

export default function TutorProfile({
    csrfToken = "",
    heroImageSrc = "",
    onBack,
    requestDate = "",
    requestFilters = {},
    tutor,
    urls = {},
}) {
    const [activeTab, setActiveTab] = useState("info");
    const [isFollowing, setIsFollowing] = useState(Boolean(tutor?.isFollowed));
    const [followersCount, setFollowersCount] = useState(Number(tutor?.followersCount || 0));
    const [followError, setFollowError] = useState("");
    const [isFollowSubmitting, setIsFollowSubmitting] = useState(false);
    const [message, setMessage] = useState("");

    const subjectOptions = useMemo(() => buildSubjectOptions(tutor, requestFilters), [requestFilters, tutor]);
    const levelOptions = useMemo(() => safeArray(tutor?.levels).slice(0, 3), [tutor?.levels]);
    const topicOptions = useMemo(() => safeArray(tutor?.topics).slice(0, 3), [tutor?.topics]);
    const bookableSlots = useMemo(() => buildBookableSlots(tutor?.schedule), [tutor?.schedule]);
    const preferredSlotId = useMemo(
        () => getPreferredSlotId(bookableSlots, requestDate, requestFilters),
        [bookableSlots, requestDate, requestFilters],
    );
    const [selectedSubject, setSelectedSubject] = useState(() => subjectOptions[0] || String(requestFilters?.subject || "").trim());
    const [selectedSlotId, setSelectedSlotId] = useState(preferredSlotId);

    useEffect(() => {
        setSelectedSubject(subjectOptions[0] || String(requestFilters?.subject || "").trim());
    }, [requestFilters?.subject, subjectOptions, tutor?.id]);

    useEffect(() => {
        setSelectedSlotId(preferredSlotId);
    }, [preferredSlotId, tutor?.id]);

    useEffect(() => {
        setIsFollowing(Boolean(tutor?.isFollowed));
        setFollowersCount(Number(tutor?.followersCount || 0));
        setFollowError("");
        setMessage("");
        setActiveTab("info");
    }, [tutor?.followersCount, tutor?.id, tutor?.isFollowed]);

    if (!tutor) {
        return null;
    }

    const selectedSlot = bookableSlots.find((slot) => slot.id === selectedSlotId) || null;
    const review = tutor.review || {};
    const summaryDateLabel = selectedSlot?.fullDateLabel || formatLongDateLabel(requestDate, "Termin do ustalenia");
    const summaryTimeLabel = selectedSlot?.timeRangeLabel || requestFilters?.hour || "Do ustalenia";
    const summarySubjectLabel = selectedSubject || subjectOptions[0] || "Przedmiot do ustalenia";
    const summaryLevelLabel = requestFilters?.level || levelOptions[0] || "Rozne poziomy";
    const summaryTopicLabel = requestFilters?.topic || topicOptions[0] || "";
    const coverStyle = heroImageSrc
        ? { backgroundImage: `linear-gradient(135deg, rgba(57, 70, 104, 0.14), rgba(205, 142, 231, 0.36)), url(${heroImageSrc})` }
        : undefined;

    async function handleFollowToggle() {
        if (!tutor?.canFollow || !tutor?.id || isFollowSubmitting) {
            return;
        }

        setIsFollowSubmitting(true);
        setFollowError("");

        try {
            const responsePayload = await toggleTutorObservation({
                payload: {
                    tutorId: tutor.id,
                },
                observationsUrl: urls.observations ?? "/api/portal-observations",
                csrfToken,
                databaseErrorUrl: urls.databaseError ?? "/database-error",
            });

            setIsFollowing(Boolean(responsePayload.isFollowed));
            setFollowersCount(Number(responsePayload.followersCount || 0));
        } catch (error) {
            setFollowError(error?.message || "Nie udalo sie zapisac obserwacji tutora.");
        } finally {
            setIsFollowSubmitting(false);
        }
    }

    return (
        <div className="tutor-profile">
            <style>{`
                .tutor-profile{display:grid;gap:18px}.tutor-profile__layout,.tutor-profile__main,.tutor-profile__surface,.tutor-profile__stack,.tutor-profile__booking-form,.tutor-profile__summary-list{display:grid;gap:18px}.tutor-profile__sidebar{position:sticky;top:108px;gap:18px}.tutor-profile__main{min-width:0}.tutor-profile__top{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px}.tutor-profile__back,.tutor-profile__badge,.tutor-profile__follow,.tutor-profile__follow-note,.tutor-profile__tab,.tutor-profile__choice,.tutor-profile__slot-pill,.tutor-profile__cta,.tutor-profile__fact,.tutor-profile__subject,.tutor-profile__meta{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;font-weight:700}.tutor-profile__back,.tutor-profile__badge{min-height:46px;padding:0 18px}.tutor-profile__back{border:0;background:#ffffffe8;color:#2f2a35;box-shadow:0 12px 22px #665f731f}.tutor-profile__badge{background:#ffffffe0;border:1px solid #a8a0b41f;color:#756c77}.tutor-profile__surface{padding:18px;border:1px solid #7a74821f;border-radius:30px;background:#f9f7fbf0;box-shadow:0 4px 0 #5f5d6614,0 18px 34px #5f596c1f}.tutor-profile__hero,.tutor-profile__panel{border:1px solid #857f911f;border-radius:26px;background:#fffffff4;box-shadow:inset 0 1px 0 #ffffffe0,0 12px 26px #5e5a6817}.tutor-profile__hero{overflow:hidden}.tutor-profile__cover{min-height:150px;padding:18px;background:radial-gradient(circle at 18% 18%,#ffffff57,transparent 22%),linear-gradient(135deg,#d7c0ea 0%,#9db1d9 100%);background-size:cover;background-position:center}.tutor-profile__cover-badges,.tutor-profile__facts,.tutor-profile__subjects,.tutor-profile__meta-strip,.tutor-profile__tabs,.tutor-profile__booking-subjects,.tutor-profile__slot-list{display:flex;flex-wrap:wrap;gap:10px}.tutor-profile__cover-badge{display:inline-flex;align-items:center;gap:8px;min-height:34px;padding:0 14px;border-radius:999px;background:#ffffff3d;color:#fff;font-size:.78rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase}.tutor-profile__hero-body{display:grid;grid-template-columns:auto minmax(0,1fr);gap:18px;align-items:end;padding:0 22px 22px;margin-top:-28px}.tutor-profile__avatar{display:grid;place-items:center;width:84px;aspect-ratio:1;border:4px solid #fff;border-radius:50%;background:linear-gradient(135deg,#637392,#c27ddb);color:#fff;font-family:var(--font-display);font-size:1.9rem;font-weight:800;box-shadow:0 14px 24px #5753612e}.tutor-profile__identity,.tutor-profile__about,.tutor-profile__panel-head,.tutor-profile__rating-box,.tutor-profile__review-card,.tutor-profile__booking-summary,.tutor-profile__field,.tutor-profile__sidebar-summary{display:grid;gap:12px}.tutor-profile__identity-main,.tutor-profile__booking-head,.tutor-profile__booking-actions{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px}.tutor-profile__name{margin:0;color:#1f1b24;font-family:var(--font-display);font-size:clamp(2rem,3vw,2.5rem);line-height:.94}.tutor-profile__sub{margin:10px 0 0;color:#80757d;font-size:.96rem;font-weight:700}.tutor-profile__follow-wrap{display:grid;justify-items:end;gap:8px}.tutor-profile__follow,.tutor-profile__follow-note{min-height:36px;padding:0 14px;font-size:.86rem}.tutor-profile__follow{border:0;background:linear-gradient(135deg,#d68ceb 0%,#b868d5 100%);color:#fff;box-shadow:0 10px 18px #b467d238}.tutor-profile__follow.is-active{background:#6666761f;color:#5f5b68;box-shadow:none}.tutor-profile__follow-note{background:#ece8f0;color:#736977}.tutor-profile__followers,.tutor-profile__sidebar-copy,.tutor-profile__slot-empty,.tutor-profile__summary-note,.tutor-profile__about p,.tutor-profile__review-text{margin:0;color:#7b7078;font-size:.92rem;line-height:1.6}.tutor-profile__fact,.tutor-profile__meta{min-height:36px;padding:0 14px;background:#eeebf3;color:#6f6571;font-size:.84rem}.tutor-profile__subject{min-height:36px;padding:0 14px;background:#eadcef;color:#7a6286;font-size:.84rem}.tutor-profile__tabs{margin-top:-2px}.tutor-profile__tab,.tutor-profile__choice,.tutor-profile__slot-pill{min-height:38px;padding:0 16px;border:1px solid #cdc5d4d9;background:#fff;color:#7e757d;font-size:.84rem;box-shadow:0 6px 14px #6a637412}.tutor-profile__tab.is-active,.tutor-profile__choice.is-selected,.tutor-profile__slot-pill.is-selected,.tutor-profile__cta{border-color:transparent;background:linear-gradient(135deg,#d68ceb 0%,#b868d5 100%);color:#fff;box-shadow:0 12px 20px #b467d238}.tutor-profile__panel{padding:22px}.tutor-profile__panel-label,.tutor-profile__summary-item span,.tutor-profile__sidebar-card span{margin:0;color:#9d9298;font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.tutor-profile__section-title,.tutor-profile__booking-summary h3{margin:0;color:#2f2936;font-family:var(--font-display);line-height:1}.tutor-profile__section-title{font-size:1.55rem}.tutor-profile__review-layout{display:grid;grid-template-columns:minmax(200px,240px) minmax(0,1fr);gap:18px}.tutor-profile__rating-box,.tutor-profile__review-card{padding:18px;border-radius:22px}.tutor-profile__rating-box{background:linear-gradient(180deg,#f5e6fbf0,#ffffffe6)}.tutor-profile__rating-value{display:flex;align-items:baseline;gap:6px;color:#2f2a35;font-family:var(--font-display);font-size:2.2rem;font-weight:800}.tutor-profile__rating-value small{color:#978c93;font-size:1rem}.tutor-profile__stars{display:flex;gap:4px;color:#f2a23c}.tutor-profile__review-card{background:#f7f5f9}.tutor-profile__review-header{display:flex;align-items:center;gap:12px}.tutor-profile__review-avatar{display:grid;place-items:center;width:44px;aspect-ratio:1;border-radius:50%;background:linear-gradient(135deg,#6b7c98,#bc72d6);color:#fff;font-weight:800}.tutor-profile__review-meta strong{display:block;color:#2f2a35}.tutor-profile__review-meta span{color:#988d94;font-size:.82rem;font-weight:700}.tutor-profile__booking-head{align-items:flex-start}.tutor-profile__booking-layout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(250px,.9fr);gap:18px;align-items:start;position:relative}.tutor-profile__field-label{color:#3a333e;font-size:.95rem;font-weight:800}.tutor-profile__slot-pill{min-height:42px;padding:0 14px}.tutor-profile__slot-pill-content{display:grid;gap:2px;justify-items:start;text-align:left}.tutor-profile__slot-pill-content strong{font-size:.88rem}.tutor-profile__slot-pill-content span{font-size:.76rem;opacity:.9}.tutor-profile__booking-message{display:grid;gap:10px}.tutor-profile__booking-message textarea{width:100%;min-height:114px;resize:vertical;padding:16px 18px;border:0;border-radius:18px;background:#f0edf3;color:#524954;font-size:.96rem;line-height:1.6;outline:none}.tutor-profile__booking-summary{padding:18px;border-radius:22px;background:linear-gradient(180deg,#f6f3faf0,#fffffff0);border:1px solid #bdb4c733}.tutor-profile__summary-item,.tutor-profile__sidebar-card{padding:12px 14px;border-radius:18px;background:#ffffffe0}.tutor-profile__summary-item{display:grid;grid-template-columns:32px minmax(0,1fr);gap:12px;align-items:center}.tutor-profile__summary-item i{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:12px;background:#d88ced29;color:#b565d4;font-size:.92rem}.tutor-profile__summary-item strong,.tutor-profile__sidebar-card strong,.tutor-profile__sidebar-card p{display:block;margin-top:4px;color:#332d38;font-size:.95rem;line-height:1.4}.tutor-profile__sidebar-card p{margin:4px 0 0}.tutor-profile__booking-actions{margin-top:4px}.tutor-profile__cta,.tutor-profile__cancel{flex:1;min-height:44px;border:0;border-radius:999px;font-size:.92rem;font-weight:700}.tutor-profile__cancel{background:#8b8c92;color:#fff;box-shadow:0 12px 20px #6b6d741f}.tutor-profile__help{position:absolute;right:16px;bottom:16px;display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border:0;border-radius:50%;background:linear-gradient(135deg,#ff42a0 0%,#5882ff 100%);color:#fff;box-shadow:0 16px 22px #5068bf38}.tutor-profile__sidebar-summary{margin-top:10px}.tutor-profile__placeholder{margin:0;color:#6d6270;font-size:.98rem;line-height:1.65}@media (max-width:1260px){.tutor-profile__booking-layout{grid-template-columns:1fr}.tutor-profile__help{position:static;justify-self:end}}@media (max-width:1100px){.tutor-profile__sidebar{position:static}}@media (max-width:900px){.tutor-profile__hero-body{grid-template-columns:1fr;align-items:start}.tutor-profile__follow-wrap{justify-items:start}.tutor-profile__review-layout{grid-template-columns:1fr}}@media (max-width:680px){.tutor-profile__surface{padding:14px}.tutor-profile__panel{padding:18px}.tutor-profile__tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.tutor-profile__back,.tutor-profile__badge,.tutor-profile__cancel,.tutor-profile__cta,.tutor-profile__tab{width:100%}.tutor-profile__hero-body{padding:0 18px 18px}.tutor-profile__name{font-size:1.8rem}}
            `}</style>

            <div className="portal-hub__inner tutor-profile__layout">
                <aside className="portal-sidebar tutor-profile__sidebar">
                    <div className="portal-sidebar__search">
                        <p>Wyszukiwanie</p>
                        <label htmlFor="tutor-profile-search" className="portal-sidebar__search-input">
                            <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                            <input
                                id="tutor-profile-search"
                                type="text"
                                value={`${summarySubjectLabel}${summaryTopicLabel ? `, ${summaryTopicLabel}` : ""}`}
                                readOnly
                                aria-label="Wybrane filtry"
                            />
                        </label>
                    </div>

                    {SIDEBAR_SECTIONS.map((section) => (
                        <div key={section.title} className="portal-sidebar__group">
                            <p className="portal-sidebar__heading">{section.title}</p>
                            <ul>
                                {section.items.map((item) => (
                                    <li key={item.id}>
                                        <div className="portal-sidebar__item">
                                            <span className="portal-sidebar__button-main">
                                                <i className={item.icon} aria-hidden="true"></i>
                                                <span>{item.label}</span>
                                            </span>
                                            <span className="portal-sidebar__note">{item.note}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    <div className="portal-sidebar__group">
                        <p className="portal-sidebar__heading">Zarezerwuj</p>
                        <div className="portal-sidebar__stack">
                            <span className="portal-sidebar__stack-item">{summarySubjectLabel}</span>
                            <span className="portal-sidebar__stack-item">{summaryLevelLabel}</span>
                            {summaryTopicLabel ? <span className="portal-sidebar__stack-item">{summaryTopicLabel}</span> : null}
                        </div>
                        <div className="tutor-profile__sidebar-summary">
                            <div className="tutor-profile__sidebar-card">
                                <span>Data</span>
                                <strong>{summaryDateLabel}</strong>
                            </div>
                            <div className="tutor-profile__sidebar-card">
                                <span>Godzina</span>
                                <strong>{summaryTimeLabel}</strong>
                            </div>
                            <div className="tutor-profile__sidebar-card">
                                <span>Przedmiot</span>
                                <p>{summarySubjectLabel}</p>
                            </div>
                        </div>
                    </div>

                    <div className="portal-sidebar__group">
                        <p className="portal-sidebar__heading">Twoje operacje</p>
                        <p className="tutor-profile__sidebar-copy">
                            {bookableSlots.length
                                ? "Termin jest juz wybrany z wynikow wyszukiwania. Teraz mozesz dopracowac rezerwacje."
                                : "Tutor nie ma jeszcze wolnego slotu w tym widoku, ale ekran zapisu jest juz gotowy."}
                        </p>
                    </div>
                </aside>

                <div className="tutor-profile__main">
                    <div className="tutor-profile__top">
                        <button className="tutor-profile__back" type="button" onClick={onBack}>
                            <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
                            Wroc do wynikow
                        </button>
                        <span className="tutor-profile__badge">Zapis na zajecia</span>
                    </div>

                    <div className="tutor-profile__surface">
                        <article className="tutor-profile__hero">
                            <div className="tutor-profile__cover" style={coverStyle}>
                                <div className="tutor-profile__cover-badges">
                                    <span className="tutor-profile__cover-badge">
                                        <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
                                        Profil aktywny
                                    </span>
                                    <span className="tutor-profile__cover-badge">
                                        <i className="fa-solid fa-bolt" aria-hidden="true"></i>
                                        Szybka odpowiedz
                                    </span>
                                </div>
                            </div>

                            <div className="tutor-profile__hero-body">
                                <div className="tutor-profile__avatar" aria-hidden="true">{tutor.initials}</div>
                                <div className="tutor-profile__identity">
                                    <div className="tutor-profile__identity-main">
                                        <div>
                                            <h1 className="tutor-profile__name">{tutor.name}</h1>
                                            <p className="tutor-profile__sub">{tutor.experience}</p>
                                        </div>
                                        <div className="tutor-profile__follow-wrap">
                                            {tutor.canFollow ? (
                                                <button
                                                    className={`tutor-profile__follow${isFollowing ? " is-active" : ""}`}
                                                    type="button"
                                                    onClick={handleFollowToggle}
                                                    disabled={isFollowSubmitting}
                                                >
                                                    {isFollowSubmitting
                                                        ? "Zapisywanie..."
                                                        : isFollowing
                                                            ? "Obserwujesz"
                                                            : "Obserwuj"}
                                                </button>
                                            ) : (
                                                <span className="tutor-profile__follow-note">Profil publiczny</span>
                                            )}
                                            <span className="tutor-profile__followers">{followersCount} obserwujacych</span>
                                            {followError ? (
                                                <span className="tutor-profile__followers">{followError}</span>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="tutor-profile__facts">
                                        <span className="tutor-profile__fact">
                                            <i className="fa-solid fa-star" aria-hidden="true"></i>
                                            {Number(tutor.rating || 0).toFixed(1)}/5
                                        </span>
                                        <span className="tutor-profile__fact">
                                            <i className="fa-solid fa-comments" aria-hidden="true"></i>
                                            {tutor.opinions} opinii
                                        </span>
                                        {safeArray(tutor.statusBadges).slice(0, 3).map((badge) => (
                                            <span key={badge} className="tutor-profile__fact">
                                                <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
                                                {badge}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </article>

                        <div className="tutor-profile__tabs" role="tablist" aria-label="Widok profilu tutora">
                            {PROFILE_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`tutor-profile__tab${activeTab === tab.id ? " is-active" : ""}`}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeTab === tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {activeTab !== "info" ? (
                            <section className="tutor-profile__panel">
                                <div className="tutor-profile__panel-head">
                                    <p className="tutor-profile__panel-label">Zakladka</p>
                                    <h2 className="tutor-profile__section-title">
                                        {PROFILE_TABS.find((tab) => tab.id === activeTab)?.label || "Informacje"}
                                    </h2>
                                    <p className="tutor-profile__placeholder">
                                        Ten obszar moze dostac osobny widok, ale glowny ekran zapisu na zajecia
                                        zostal osadzony w zakladce <strong>Informacje</strong>.
                                    </p>
                                </div>
                            </section>
                        ) : (
                            <div className="tutor-profile__stack">
                                <section className="tutor-profile__panel">
                                    <div className="tutor-profile__panel-head">
                                        <p className="tutor-profile__panel-label">Uczy z</p>
                                        <h2 className="tutor-profile__section-title">Zakres zajec</h2>
                                    </div>
                                    <div className="tutor-profile__subjects">
                                        {subjectOptions.map((subject) => (
                                            <span key={subject} className="tutor-profile__subject">{subject}</span>
                                        ))}
                                    </div>
                                    <div className="tutor-profile__meta-strip">
                                        {levelOptions.map((level) => (
                                            <span key={level} className="tutor-profile__meta">{level}</span>
                                        ))}
                                        {topicOptions.map((topic) => (
                                            <span key={topic} className="tutor-profile__meta">{topic}</span>
                                        ))}
                                    </div>
                                </section>

                                <section className="tutor-profile__panel">
                                    <div className="tutor-profile__panel-head">
                                        <p className="tutor-profile__panel-label">O mnie</p>
                                        <h2 className="tutor-profile__section-title">Jak prowadze zajecia</h2>
                                    </div>
                                    <div className="tutor-profile__about">
                                        {safeArray(tutor.aboutParagraphs).map((paragraph) => (
                                            <p key={paragraph}>{paragraph}</p>
                                        ))}
                                    </div>
                                </section>

                                <section className="tutor-profile__panel">
                                    <div className="tutor-profile__panel-head">
                                        <p className="tutor-profile__panel-label">Opinie</p>
                                        <h2 className="tutor-profile__section-title">Ocena i ostatnia rekomendacja</h2>
                                    </div>

                                    <div className="tutor-profile__review-layout">
                                        <div className="tutor-profile__rating-box">
                                            <div className="tutor-profile__rating-value">
                                                {Number(tutor.rating || 0).toFixed(1)}
                                                <small>/5</small>
                                            </div>
                                            <RatingStars rating={Number(tutor.rating || 0)} />
                                            <span className="tutor-profile__followers">{tutor.opinions} opinii z profilu</span>
                                            <button className="tutor-profile__cta" type="button">Zobacz opinie</button>
                                        </div>

                                        <article className="tutor-profile__review-card">
                                            <div className="tutor-profile__review-header">
                                                <div className="tutor-profile__review-avatar" aria-hidden="true">
                                                    {(review.author || "R").slice(0, 1)}
                                                </div>
                                                <div className="tutor-profile__review-meta">
                                                    <strong>{review.author || "Rent Nerd"}</strong>
                                                    <span>{review.dateLabel || "Brak daty"}</span>
                                                </div>
                                            </div>
                                            <RatingStars rating={Number(review.rating || tutor.rating || 0)} />
                                            <p className="tutor-profile__review-text">
                                                {review.content || "Profil zostal przygotowany pod pierwsze zajecia."}
                                            </p>
                                        </article>
                                    </div>
                                </section>

                                <section className="tutor-profile__panel">
                                    <div className="tutor-profile__booking-head">
                                        <div className="tutor-profile__panel-head">
                                            <p className="tutor-profile__panel-label">Zarezerwuj zajecia</p>
                                            <h2 className="tutor-profile__section-title">Wybierz przedmiot</h2>
                                        </div>
                                        <span className="tutor-profile__badge">
                                            {formatLongDateLabel(requestDate, "Termin do ustalenia")}
                                        </span>
                                    </div>

                                    <div className="tutor-profile__booking-layout">
                                        <div className="tutor-profile__booking-form">
                                            <div className="tutor-profile__field">
                                                <span className="tutor-profile__field-label">Przedmiot</span>
                                                <div className="tutor-profile__booking-subjects">
                                                    {subjectOptions.map((subject) => (
                                                        <button
                                                            key={subject}
                                                            className={`tutor-profile__choice${selectedSubject === subject ? " is-selected" : ""}`}
                                                            type="button"
                                                            onClick={() => setSelectedSubject(subject)}
                                                        >
                                                            {subject}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="tutor-profile__field">
                                                <span className="tutor-profile__field-label">Termin</span>
                                                {bookableSlots.length ? (
                                                    <div className="tutor-profile__slot-list">
                                                        {bookableSlots.slice(0, 6).map((slot) => (
                                                            <button
                                                                key={slot.id}
                                                                className={`tutor-profile__slot-pill${selectedSlotId === slot.id ? " is-selected" : ""}`}
                                                                type="button"
                                                                onClick={() => setSelectedSlotId(slot.id)}
                                                            >
                                                                <span className="tutor-profile__slot-pill-content">
                                                                    <strong>{slot.timeRangeLabel}</strong>
                                                                    <span>{slot.weekdayLabel}, {slot.shortDateLabel}</span>
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="tutor-profile__slot-empty">
                                                        Brak gotowego slotu w tym tygodniu. Podsumowanie nadal pokazuje
                                                        termin z wyszukiwania.
                                                    </p>
                                                )}
                                            </div>

                                            <label className="tutor-profile__booking-message">
                                                <span className="tutor-profile__field-label">Wiadomosc do korepetytora</span>
                                                <textarea
                                                    value={message}
                                                    onChange={(event) => setMessage(event.target.value)}
                                                    placeholder="Chcesz cos przekazac korepetytorowi? Mozesz to zrobic tutaj."
                                                />
                                            </label>
                                        </div>

                                        <aside className="tutor-profile__booking-summary">
                                            <h3>Podsumowanie</h3>
                                            <div className="tutor-profile__summary-list">
                                                <div className="tutor-profile__summary-item">
                                                    <i className="fa-regular fa-calendar" aria-hidden="true"></i>
                                                    <div>
                                                        <span>Data</span>
                                                        <strong>{summaryDateLabel}</strong>
                                                    </div>
                                                </div>
                                                <div className="tutor-profile__summary-item">
                                                    <i className="fa-regular fa-clock" aria-hidden="true"></i>
                                                    <div>
                                                        <span>Termin</span>
                                                        <strong>{summaryTimeLabel}</strong>
                                                    </div>
                                                </div>
                                                <div className="tutor-profile__summary-item">
                                                    <i className="fa-solid fa-book-open" aria-hidden="true"></i>
                                                    <div>
                                                        <span>Przedmiot</span>
                                                        <strong>{summarySubjectLabel}</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            {summaryTopicLabel ? (
                                                <p className="tutor-profile__summary-note">
                                                    Temat z wyszukiwania: <strong>{summaryTopicLabel}</strong>
                                                </p>
                                            ) : null}

                                            <div className="tutor-profile__booking-actions">
                                                <button className="tutor-profile__cancel" type="button" onClick={onBack}>
                                                    Anuluj
                                                </button>
                                                <button className="tutor-profile__cta" type="button">Dalej</button>
                                            </div>
                                        </aside>

                                        <button className="tutor-profile__help" type="button" aria-label="Szybka pomoc">
                                            <i className="fa-solid fa-bolt" aria-hidden="true"></i>
                                        </button>
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
