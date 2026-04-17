import { useEffect, useMemo, useState } from "react";

import { createTutorBookingRequest, createTutorReview, toggleTutorObservation } from "../api.js";

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
const REVIEW_SCORE_OPTIONS = [1, 2, 3, 4, 5];
const DEFAULT_BOOKING_NOTE =
    "Aby twoje zajecia byly na najwyzszym poziomie, podaj tematyke zajec lub czego oczekujesz od korepetytora.";

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

function ReviewScoreStars({
    value,
    hoveredValue = 0,
    onHover,
    onLeave,
    onSelect,
}) {
    const activeValue = hoveredValue || value;

    return (
        <div className="tutor-profile__score-stars" onMouseLeave={onLeave} aria-label={`Wybrana ocena ${value} na 5`}>
            {REVIEW_SCORE_OPTIONS.map((score) => {
                const isActive = score <= activeValue;

                return (
                    <button
                        key={score}
                        className={`tutor-profile__score-star${isActive ? " is-active" : ""}`}
                        type="button"
                        aria-label={`Wybierz ${score} gwiazdek`}
                        aria-pressed={score === value}
                        onMouseEnter={() => onHover(score)}
                        onFocus={() => onHover(score)}
                        onClick={() => onSelect(score)}
                    >
                        <StarIcon isFilled={isActive} />
                    </button>
                );
            })}
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

function buildScheduleGrid(schedule) {
    const days = safeArray(schedule?.days);
    const rows = safeArray(schedule?.rows);

    return {
        days,
        rows: rows.map((row) => ({
            timeLabel: row?.timeLabel || "",
            cells: safeArray(row?.slots).map((status, index) => {
                const day = days[index];

                return {
                    id: `${day?.iso || index}-${row?.timeLabel || index}`,
                    status: status || "unavailable",
                    timeRangeLabel: buildTimeRangeLabel(row?.timeLabel || ""),
                    shortDateLabel: formatShortDateLabel(day?.iso, day?.label || ""),
                    fullDateLabel: formatLongDateLabel(day?.iso, day?.label || ""),
                    isBookable: BOOKABLE_SLOT_STATUSES.has(status),
                };
            }),
        })),
    };
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

function buildLoginHref(baseUrl) {
    if (!baseUrl) {
        return "/login";
    }

    if (typeof window === "undefined") {
        return baseUrl;
    }

    const nextTarget = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (!nextTarget) {
        return baseUrl;
    }

    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}${new URLSearchParams({ next: nextTarget }).toString()}`;
}

export default function TutorProfile({
    csrfToken = "",
    heroImageSrc = "",
    isAuthenticated = false,
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
    const [message, setMessage] = useState(DEFAULT_BOOKING_NOTE);
    const [reviews, setReviews] = useState(() => safeArray(tutor?.reviews));
    const [featuredReview, setFeaturedReview] = useState(() => tutor?.review || {});
    const [ratingValue, setRatingValue] = useState(Number(tutor?.rating || 0));
    const [opinionsCount, setOpinionsCount] = useState(Number(tutor?.opinions || 0));
    const [reviewScore, setReviewScore] = useState(5);
    const [reviewContent, setReviewContent] = useState("");
    const [reviewError, setReviewError] = useState("");
    const [reviewSuccess, setReviewSuccess] = useState("");
    const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
    const [areAllReviewsVisible, setAreAllReviewsVisible] = useState(false);
    const [hoveredReviewScore, setHoveredReviewScore] = useState(0);
    const [bookingError, setBookingError] = useState("");
    const [bookingSuccess, setBookingSuccess] = useState("");
    const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

    const subjectOptions = useMemo(() => buildSubjectOptions(tutor, requestFilters), [requestFilters, tutor]);
    const levelOptions = useMemo(() => safeArray(tutor?.levels).slice(0, 3), [tutor?.levels]);
    const topicOptions = useMemo(() => safeArray(tutor?.topics).slice(0, 3), [tutor?.topics]);
    const bookableSlots = useMemo(() => buildBookableSlots(tutor?.schedule), [tutor?.schedule]);
    const scheduleGrid = useMemo(() => buildScheduleGrid(tutor?.schedule), [tutor?.schedule]);
    const bookingLoginUrl = useMemo(() => buildLoginHref(urls.login ?? "/login"), [urls.login]);
    const [selectedSubject, setSelectedSubject] = useState(() => subjectOptions[0] || String(requestFilters?.subject || "").trim());
    const [selectedSlotId, setSelectedSlotId] = useState("");

    useEffect(() => {
        setSelectedSubject(subjectOptions[0] || String(requestFilters?.subject || "").trim());
    }, [requestFilters?.subject, subjectOptions, tutor?.id]);

    useEffect(() => {
        setIsFollowing(Boolean(tutor?.isFollowed));
        setFollowersCount(Number(tutor?.followersCount || 0));
        setReviews(safeArray(tutor?.reviews));
        setFeaturedReview(tutor?.review || {});
        setRatingValue(Number(tutor?.rating || 0));
        setOpinionsCount(Number(tutor?.opinions || 0));
        setFollowError("");
        setMessage(DEFAULT_BOOKING_NOTE);
        setSelectedSlotId("");
        setReviewError("");
        setReviewSuccess("");
        setAreAllReviewsVisible(false);
        setHoveredReviewScore(0);
        setBookingError("");
        setBookingSuccess("");
        setIsBookingSubmitting(false);
        setActiveTab("info");
    }, [tutor?.followersCount, tutor?.id, tutor?.isFollowed, tutor?.opinions, tutor?.rating, tutor?.review, tutor?.reviews]);

    const ownReview = useMemo(
        () => reviews.find((reviewItem) => reviewItem?.isOwn) || null,
        [reviews],
    );
    const secondaryReviews = useMemo(
        () => reviews.filter((reviewItem) => !(
            reviewItem?.author === featuredReview?.author
            && reviewItem?.dateLabel === featuredReview?.dateLabel
            && reviewItem?.content === featuredReview?.content
        )),
        [featuredReview, reviews],
    );

    useEffect(() => {
        setReviewScore(Number(ownReview?.rating || 5));
        setReviewContent(ownReview?.content || "");
        setHoveredReviewScore(0);
    }, [ownReview, tutor?.id]);

    useEffect(() => {
        if (selectedSlotId) {
            setBookingError("");
            setBookingSuccess("");
        }
    }, [selectedSlotId]);

    if (!tutor) {
        return null;
    }

    const selectedSlot = bookableSlots.find((slot) => slot.id === selectedSlotId) || null;
    const review = featuredReview || {};
    const summaryDateLabel = selectedSlot?.fullDateLabel || "Wybierz termin z harmonogramu";
    const summaryTimeLabel = selectedSlot?.timeRangeLabel || "Wybierz godzine";
    const summarySubjectLabel = selectedSubject || subjectOptions[0] || "Przedmiot do ustalenia";
    const summaryLevelLabel = requestFilters?.level || levelOptions[0] || "Rozne poziomy";
    const summaryTopicLabel = requestFilters?.topic || topicOptions[0] || "";
    const summaryPriceLabel = Number.isFinite(Number(tutor?.hourlyRate))
        ? `${Number(tutor.hourlyRate).toFixed(0)} zl/h`
        : "Cena do ustalenia";
    const hasBookingSelection = Boolean(selectedSlot);
    const hasExtraReviews = secondaryReviews.length > 0;
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

    async function handleReviewSubmit(event) {
        event.preventDefault();
        if (!tutor?.id || !tutor?.canReview || isReviewSubmitting) {
            return;
        }

        setIsReviewSubmitting(true);
        setReviewError("");
        setReviewSuccess("");

        try {
            const responsePayload = await createTutorReview({
                payload: {
                    tutorId: tutor.id,
                    rating: reviewScore,
                    content: reviewContent,
                },
                reviewsUrl: urls.tutorReviews ?? "/api/tutor-reviews",
                csrfToken,
                databaseErrorUrl: urls.databaseError ?? "/database-error",
            });

            setFeaturedReview(responsePayload.review || {});
            setReviews(safeArray(responsePayload.reviews));
            setRatingValue(Number(responsePayload.rating || 0));
            setOpinionsCount(Number(responsePayload.opinions || 0));
            setReviewSuccess(responsePayload.message || "Opinia zapisana.");
        } catch (error) {
            setReviewError(error?.message || "Nie udalo sie zapisac opinii.");
        } finally {
            setIsReviewSubmitting(false);
        }
    }

    async function handleBookingRequest() {
        if (!tutor?.id || !selectedSlot) {
            setBookingError("Wybierz dostepny termin przed wyslaniem zapytania.");
            return;
        }

        if (!selectedSubject) {
            setBookingError("Wybierz przedmiot przed wyslaniem zapytania.");
            return;
        }

        if (!isAuthenticated) {
            window.location.assign(bookingLoginUrl);
            return;
        }

        setIsBookingSubmitting(true);
        setBookingError("");
        setBookingSuccess("");

        try {
            const responsePayload = await createTutorBookingRequest({
                payload: {
                    tutorId: tutor.id,
                    subject: selectedSubject,
                    date: selectedSlot.dateIso,
                    timeLabel: selectedSlot.timeRangeLabel,
                    message: message.trim(),
                },
                bookingUrl: urls.tutorBookingRequest ?? "/api/tutor-booking-request",
                csrfToken,
                databaseErrorUrl: urls.databaseError ?? "/database-error",
            });

            setBookingSuccess(responsePayload?.message || "Zapytanie zostalo wyslane do korepetytora.");
            setSelectedSlotId("");
            setMessage(DEFAULT_BOOKING_NOTE);
        } catch (error) {
            setBookingError(error?.message || "Nie udalo sie wyslac zapytania do korepetytora.");
        } finally {
            setIsBookingSubmitting(false);
        }
    }

    return (
        <div className="tutor-profile">
            <style>{`
                .tutor-profile{display:grid;gap:18px}
                .tutor-profile__layout,.tutor-profile__main,.tutor-profile__surface,.tutor-profile__stack,.tutor-profile__booking-form,.tutor-profile__summary-list,.tutor-profile__booking-details,.tutor-profile__booking-card{display:grid;gap:18px}
                .tutor-profile__sidebar{position:sticky;top:108px;gap:18px}
                .tutor-profile__main{min-width:0}
                .tutor-profile__top{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px}
                .tutor-profile__back,.tutor-profile__badge,.tutor-profile__follow,.tutor-profile__follow-note,.tutor-profile__tab,.tutor-profile__choice,.tutor-profile__cta,.tutor-profile__fact,.tutor-profile__subject,.tutor-profile__meta,.tutor-profile__legend-chip{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;font-weight:700}
                .tutor-profile__back,.tutor-profile__badge{min-height:46px;padding:0 18px}
                .tutor-profile__back{border:0;background:#ffffffe8;color:#2f2a35;box-shadow:0 12px 22px #665f731f}
                .tutor-profile__badge{background:#ffffffe0;border:1px solid #a8a0b41f;color:#756c77}
                .tutor-profile__surface{padding:18px;border:1px solid #7a74821f;border-radius:30px;background:#f9f7fbf0;box-shadow:0 4px 0 #5f5d6614,0 18px 34px #5f596c1f}
                .tutor-profile__hero,.tutor-profile__panel{border:1px solid #857f911f;border-radius:26px;background:#fffffff4;box-shadow:inset 0 1px 0 #ffffffe0,0 12px 26px #5e5a6817}
                .tutor-profile__hero{overflow:hidden}
                .tutor-profile__cover{min-height:150px;padding:18px;background:radial-gradient(circle at 18% 18%,#ffffff57,transparent 22%),linear-gradient(135deg,#d7c0ea 0%,#9db1d9 100%);background-size:cover;background-position:center}
                .tutor-profile__cover-badges,.tutor-profile__facts,.tutor-profile__subjects,.tutor-profile__meta-strip,.tutor-profile__tabs,.tutor-profile__booking-subjects,.tutor-profile__booking-legend{display:flex;flex-wrap:wrap;gap:10px}
                .tutor-profile__cover-badge{display:inline-flex;align-items:center;gap:8px;min-height:34px;padding:0 14px;border-radius:999px;background:#ffffff3d;color:#fff;font-size:.78rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
                .tutor-profile__hero-body{display:grid;grid-template-columns:auto minmax(0,1fr);gap:18px;align-items:end;padding:0 22px 22px;margin-top:-28px}
                .tutor-profile__avatar{display:grid;place-items:center;width:84px;aspect-ratio:1;border:4px solid #fff;border-radius:50%;background:linear-gradient(135deg,#637392,#c27ddb);color:#fff;font-family:var(--font-display);font-size:1.9rem;font-weight:800;box-shadow:0 14px 24px #5753612e}
                .tutor-profile__identity,.tutor-profile__about,.tutor-profile__panel-head,.tutor-profile__rating-box,.tutor-profile__review-card,.tutor-profile__booking-summary,.tutor-profile__field,.tutor-profile__sidebar-summary,.tutor-profile__review-main{display:grid;gap:12px}
                .tutor-profile__identity-main,.tutor-profile__booking-head,.tutor-profile__booking-actions,.tutor-profile__booking-summary-footer{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px}
                .tutor-profile__name{margin:0;color:#1f1b24;font-family:var(--font-display);font-size:clamp(2rem,3vw,2.5rem);line-height:.94}
                .tutor-profile__sub{margin:10px 0 0;color:#80757d;font-size:.96rem;font-weight:700}
                .tutor-profile__follow-wrap{display:grid;justify-items:end;gap:8px}
                .tutor-profile__follow,.tutor-profile__follow-note{min-height:36px;padding:0 14px;font-size:.86rem}
                .tutor-profile__follow{border:0;background:linear-gradient(135deg,#d68ceb 0%,#b868d5 100%);color:#fff;box-shadow:0 10px 18px #b467d238}
                .tutor-profile__follow.is-active{background:#6666761f;color:#5f5b68;box-shadow:none}
                .tutor-profile__follow-note{background:#ece8f0;color:#736977}
                .tutor-profile__followers,.tutor-profile__sidebar-copy,.tutor-profile__slot-empty,.tutor-profile__summary-note,.tutor-profile__about p,.tutor-profile__review-text,.tutor-profile__booking-copy{margin:0;color:#7b7078;font-size:.92rem;line-height:1.6}
                .tutor-profile__status{margin:0;font-size:.92rem;font-weight:700;line-height:1.6}
                .tutor-profile__status--error{color:#974966}
                .tutor-profile__status--success{color:#3c7d61}
                .tutor-profile__fact,.tutor-profile__meta{min-height:36px;padding:0 14px;background:#eeebf3;color:#6f6571;font-size:.84rem}
                .tutor-profile__subject{min-height:36px;padding:0 14px;background:#eadcef;color:#7a6286;font-size:.84rem}
                .tutor-profile__tabs{margin-top:-2px}
                .tutor-profile__tab,.tutor-profile__choice,.tutor-profile__cta{min-height:38px;padding:0 16px;border:1px solid #cdc5d4d9;background:#fff;color:#7e757d;font-size:.84rem;box-shadow:0 6px 14px #6a637412}
                .tutor-profile__tab.is-active,.tutor-profile__choice.is-selected,.tutor-profile__cta{border-color:transparent;background:linear-gradient(135deg,#d68ceb 0%,#b868d5 100%);color:#fff;box-shadow:0 12px 20px #b467d238}
                .tutor-profile__panel{padding:22px}
                .tutor-profile__panel-label,.tutor-profile__summary-item span,.tutor-profile__sidebar-card span,.tutor-profile__booking-step{margin:0;color:#9d9298;font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
                .tutor-profile__section-title,.tutor-profile__booking-summary h3{margin:0;color:#2f2936;font-family:var(--font-display);line-height:1}
                .tutor-profile__section-title{font-size:1.55rem}
                .tutor-profile__review-layout{display:grid;grid-template-columns:minmax(220px,250px) minmax(0,1fr);gap:20px;align-items:start}
                .tutor-profile__rating-box,.tutor-profile__review-card{padding:20px;border-radius:24px}
                .tutor-profile__rating-box{background:linear-gradient(180deg,#f5e6fbf0,#ffffffe6);border:1px solid #ead9f3;box-shadow:inset 0 1px 0 #fffffff0}
                .tutor-profile__rating-box{align-content:start}
                .tutor-profile__rating-value{display:flex;align-items:baseline;gap:6px;color:#2f2a35;font-family:var(--font-display);font-size:2.2rem;font-weight:800}
                .tutor-profile__rating-value small{color:#978c93;font-size:1rem}
                .tutor-profile__stars{display:flex;gap:4px;color:#f2a23c}
                .tutor-profile__review-card{background:linear-gradient(180deg,#faf8fc,#f4f0f8);border:1px solid #ece4f3;box-shadow:0 10px 22px #705e8610}
                .tutor-profile__review-main{min-width:0}
                .tutor-profile__review-header{display:flex;align-items:flex-start;gap:12px;min-width:0}
                .tutor-profile__review-avatar{display:grid;place-items:center;width:44px;aspect-ratio:1;border-radius:50%;background:linear-gradient(135deg,#6b7c98,#bc72d6);color:#fff;font-weight:800}
                .tutor-profile__review-meta{min-width:0}
                .tutor-profile__review-meta strong{display:block;color:#2f2a35;line-height:1.2;word-break:break-word;overflow-wrap:anywhere}
                .tutor-profile__review-meta span{color:#988d94;font-size:.82rem;font-weight:700}
                .tutor-profile__review-card .tutor-profile__stars{margin-top:2px}
                .tutor-profile__review-text{max-width:100%;font-size:.98rem;line-height:1.72;word-break:break-word;overflow-wrap:anywhere}
                .tutor-profile__review-toggle-row{display:flex;justify-content:flex-end;padding-top:2px}
                .tutor-profile__review-toggle-row .tutor-profile__cta{flex:0 0 auto;min-width:250px}
                .tutor-profile__score-stars{display:flex;flex-wrap:wrap;gap:8px}
                .tutor-profile__score-star{display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;border:1px solid #d9d0e2;border-radius:50%;background:#fff;color:#cfc7d8;box-shadow:0 8px 16px #6a637410;transition:transform .16s ease,box-shadow .16s ease,color .16s ease,border-color .16s ease}
                .tutor-profile__score-star:hover,.tutor-profile__score-star:focus-visible{transform:translateY(-1px);border-color:#c981e2;box-shadow:0 12px 22px #b467d220;outline:none}
                .tutor-profile__score-star.is-active{color:#f2a23c;border-color:#e7bb7a;background:linear-gradient(180deg,#fff9ef,#fff)}
                .tutor-profile__score-star svg{width:24px;height:24px}
                .tutor-profile__booking-head{align-items:flex-start}
                .tutor-profile__field-label{color:#3a333e;font-size:.95rem;font-weight:800}
                .tutor-profile__booking-schedule{display:grid;gap:16px;padding:20px;border-radius:24px;background:linear-gradient(180deg,#f4f2f6,#eeebf0);border:1px solid #d8d1e0}
                .tutor-profile__booking-grid-wrap{overflow:visible}
                .tutor-profile__booking-grid{width:100%;table-layout:fixed;border-collapse:separate;border-spacing:6px 8px}
                .tutor-profile__booking-grid th,.tutor-profile__booking-grid td{padding:0;text-align:center}
                .tutor-profile__booking-axis,.tutor-profile__booking-day,.tutor-profile__booking-time{border-radius:16px;background:#8a8a8f;color:#fff;font-weight:800}
                .tutor-profile__booking-axis,.tutor-profile__booking-day{height:42px;font-size:.94rem}
                .tutor-profile__booking-axis{width:86px;font-size:.82rem}
                .tutor-profile__booking-time{width:86px;height:42px;font-size:.92rem}
                .tutor-profile__booking-cell{position:relative;width:100%;min-width:0;height:42px;border:0;border-radius:999px;background:#8c8c8c;cursor:not-allowed;transition:transform .18s ease,box-shadow .18s ease,opacity .18s ease}
                .tutor-profile__booking-cell.is-bookable{cursor:pointer}
                .tutor-profile__booking-cell.is-bookable:hover{transform:translateY(-1px)}
                .tutor-profile__booking-cell.is-available{background:#d9d9dc}
                .tutor-profile__booking-cell.is-highlighted{background:#8c8c8c}
                .tutor-profile__booking-cell.is-unavailable{background:#8c8c8c;opacity:.95}
                .tutor-profile__booking-cell.is-blocked{background:#d9d9dc;opacity:.82}
                .tutor-profile__booking-cell.is-selected,
                .tutor-profile__booking-cell.is-selected.is-available,
                .tutor-profile__booking-cell.is-selected.is-highlighted{background:linear-gradient(135deg,#c86ae0 0%,#a856cf 100%);box-shadow:0 14px 22px #b467d238;opacity:1}
                .tutor-profile__booking-legend{justify-content:flex-end}
                .tutor-profile__legend-chip{min-height:34px;padding:0 14px;background:#fff;color:#665f6b;font-size:.84rem;border:1px solid #d6cedf}
                .tutor-profile__legend-dot{display:inline-flex;width:18px;height:18px;border-radius:50%}
                .tutor-profile__legend-dot.is-selected{background:#b661d5}
                .tutor-profile__legend-dot.is-available{background:#d9d9dc}
                .tutor-profile__legend-dot.is-unavailable{background:#8c8c8c}
                .tutor-profile__booking-details{margin-top:4px}
                .tutor-profile__booking-card{padding:18px;border-radius:22px;background:linear-gradient(180deg,#f8f5fa,#ffffff);border:1px solid #d9d1e2}
                .tutor-profile__booking-message{display:grid;gap:10px}
                .tutor-profile__booking-message textarea{width:100%;min-height:124px;resize:vertical;padding:18px;border:0;border-radius:20px;background:#efedf0;color:#524954;font-size:1rem;line-height:1.6;outline:none}
                .tutor-profile__booking-summary{padding:20px;border-radius:22px;background:linear-gradient(180deg,#f6f3faf0,#fffffff0);border:1px solid #bdb4c733}
                .tutor-profile__summary-item,.tutor-profile__sidebar-card{padding:12px 14px;border-radius:18px;background:#ffffffe0}
                .tutor-profile__summary-item{display:grid;grid-template-columns:minmax(0,1fr);gap:4px;align-items:center}
                .tutor-profile__summary-item strong,.tutor-profile__sidebar-card strong,.tutor-profile__sidebar-card p{display:block;margin-top:4px;color:#332d38;font-size:1rem;line-height:1.4}
                .tutor-profile__sidebar-card p{margin:4px 0 0}
                .tutor-profile__booking-actions{margin-top:8px;align-items:center}
                .tutor-profile__cta,.tutor-profile__cancel{flex:1;min-height:52px;border:0;border-radius:999px;font-size:.98rem;font-weight:800}
                .tutor-profile__cancel{background:#8b8c92;color:#fff;box-shadow:0 12px 20px #6b6d741f}
                .tutor-profile__booking-actions .tutor-profile__cta{flex:0 0 auto;min-width:240px;padding:0 28px;background:linear-gradient(135deg,#cf7be6 0%,#b861d5 52%,#a751cf 100%);box-shadow:0 16px 30px #b467d22e}
                .tutor-profile__booking-actions .tutor-profile__cta:hover{transform:translateY(-1px);box-shadow:0 18px 34px #b467d238}
                .tutor-profile__booking-actions .tutor-profile__cta:active{transform:translateY(0)}
                .tutor-profile__field > .tutor-profile__booking-actions{margin-top:14px;padding-top:2px}
                .tutor-profile__field > .tutor-profile__booking-actions .tutor-profile__cta{width:100%;min-width:min(100%,340px)}
                .tutor-profile__about:has(.tutor-profile__review-card) {gap:14px}
                .tutor-profile__sidebar-summary{margin-top:10px}
                .tutor-profile__placeholder{margin:0;color:#6d6270;font-size:.98rem;line-height:1.65}
                @media (max-width:1100px){.tutor-profile__sidebar{position:static}}
                @media (max-width:900px){.tutor-profile__hero-body{grid-template-columns:1fr;align-items:start}.tutor-profile__follow-wrap{justify-items:start}.tutor-profile__review-layout{grid-template-columns:1fr}.tutor-profile__booking-legend{justify-content:flex-start}.tutor-profile__booking-actions .tutor-profile__cta{min-width:220px}}
                @media (max-width:900px){.tutor-profile__booking-grid{border-spacing:4px 6px}.tutor-profile__booking-axis,.tutor-profile__booking-time{width:72px}.tutor-profile__booking-axis,.tutor-profile__booking-day,.tutor-profile__booking-time,.tutor-profile__booking-cell{height:38px}.tutor-profile__booking-day,.tutor-profile__booking-time{font-size:.84rem}}
                @media (max-width:680px){.tutor-profile__surface{padding:14px}.tutor-profile__panel{padding:18px}.tutor-profile__tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.tutor-profile__back,.tutor-profile__badge,.tutor-profile__cancel,.tutor-profile__cta,.tutor-profile__tab,.tutor-profile__choice{width:100%}.tutor-profile__hero-body{padding:0 18px 18px}.tutor-profile__name{font-size:1.8rem}.tutor-profile__booking-schedule{padding:14px}.tutor-profile__booking-grid{border-spacing:3px 5px}.tutor-profile__booking-axis,.tutor-profile__booking-time{width:62px}.tutor-profile__booking-axis{font-size:.72rem}.tutor-profile__booking-day,.tutor-profile__booking-time{font-size:.76rem}.tutor-profile__booking-axis,.tutor-profile__booking-day,.tutor-profile__booking-time,.tutor-profile__booking-cell{height:34px}.tutor-profile__review-layout{gap:16px}.tutor-profile__rating-box,.tutor-profile__review-card{padding:18px}.tutor-profile__booking-actions .tutor-profile__cta{min-width:100%}}
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
                                ? hasBookingSelection
                                    ? "Masz juz wybrany termin. Nizej mozesz dopisac notatke i wyslac zapytanie do tutora."
                                    : "Najpierw wybierz przedmiot i kliknij wolny termin w harmonogramie."
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
                                            {Number(ratingValue || 0).toFixed(1)}/5
                                            </span>
                                            <span className="tutor-profile__fact">
                                                <i className="fa-solid fa-comments" aria-hidden="true"></i>
                                            {opinionsCount} opinii
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
                                        <h2 className="tutor-profile__section-title">Opinie:</h2>
                                    </div>

                                    <div className="tutor-profile__review-layout">
                                        <div className="tutor-profile__rating-box">
                                            <div className="tutor-profile__rating-value">
                                                {Number(ratingValue || 0).toFixed(1)}
                                                <small>/5</small>
                                            </div>
                                            <RatingStars rating={Number(ratingValue || 0)} />
                                            <span className="tutor-profile__followers">{opinionsCount} opinii z profilu</span>
                                            <span className="tutor-profile__followers">
                                                {ownReview ? "Mozesz edytowac swoja opinie." : "Nowe opinie od razu aktualizuja ocene profilu."}
                                            </span>
                                        </div>

                                        <div className="tutor-profile__review-main">
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
                                                <RatingStars rating={Number(review.rating || ratingValue || 0)} />
                                                <p className="tutor-profile__review-text">
                                                    {review.content || "Profil zostal przygotowany pod pierwsze zajecia."}
                                                </p>
                                            </article>

                                            {hasExtraReviews ? (
                                                <div className="tutor-profile__review-toggle-row">
                                                    <button
                                                        className="tutor-profile__cta"
                                                        type="button"
                                                        onClick={() => setAreAllReviewsVisible((currentValue) => !currentValue)}
                                                    >
                                                        {areAllReviewsVisible ? "Ukryj pozostale opinie" : "Pokaz wszystkie opinie"}
                                                    </button>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="tutor-profile__about">
                                        {areAllReviewsVisible && secondaryReviews.length ? (
                                            secondaryReviews.map((reviewItem) => (
                                                <article key={reviewItem.id} className="tutor-profile__review-card">
                                                    <div className="tutor-profile__review-header">
                                                        <div className="tutor-profile__review-avatar" aria-hidden="true">
                                                            {reviewItem.initials || "U"}
                                                        </div>
                                                        <div className="tutor-profile__review-meta">
                                                            <strong>{reviewItem.author}</strong>
                                                            <span>{reviewItem.dateLabel}</span>
                                                        </div>
                                                    </div>
                                                    <RatingStars rating={Number(reviewItem.rating || 0)} />
                                                    <p className="tutor-profile__review-text">{reviewItem.content}</p>
                                                </article>
                                            ))
                                        ) : !reviews.length ? (
                                            <p className="tutor-profile__placeholder">
                                                Ten profil nie ma jeszcze zadnych opinii od uzytkownikow.
                                            </p>
                                        ) : null}
                                    </div>

                                    {tutor.canReview ? (
                                        <article className="tutor-profile__review-card">
                                            <form className="tutor-profile__field" onSubmit={handleReviewSubmit}>
                                                <span className="tutor-profile__field-label">Twoja ocena</span>
                                                <ReviewScoreStars
                                                    value={reviewScore}
                                                    hoveredValue={hoveredReviewScore}
                                                    onHover={setHoveredReviewScore}
                                                    onLeave={() => setHoveredReviewScore(0)}
                                                    onSelect={setReviewScore}
                                                />

                                                <label className="tutor-profile__booking-message">
                                                    <span className="tutor-profile__field-label">Twoja opinia</span>
                                                    <textarea
                                                        value={reviewContent}
                                                        onChange={(event) => setReviewContent(event.target.value)}
                                                        placeholder="Napisz, jak wygladaly zajecia i co bylo najbardziej pomocne."
                                                    />
                                                </label>

                                                <div className="tutor-profile__booking-actions">
                                                    <button className="tutor-profile__cta" type="submit" disabled={isReviewSubmitting}>
                                                        {isReviewSubmitting ? "Zapisywanie..." : (ownReview ? "Zaktualizuj opinie" : "Dodaj opinie")}
                                                    </button>
                                                </div>

                                                {reviewError ? <p className="tutor-profile__followers">{reviewError}</p> : null}
                                                {reviewSuccess ? <p className="tutor-profile__followers">{reviewSuccess}</p> : null}
                                            </form>
                                        </article>
                                    ) : (
                                        <p className="tutor-profile__placeholder">
                                            Opinie mozesz dodawac do innych tutorow po zalogowaniu na konto w aplikacji.
                                        </p>
                                    )}
                                </section>

                                <section className="tutor-profile__panel">
                                    <div className="tutor-profile__booking-head">
                                        <div className="tutor-profile__panel-head">
                                            <p className="tutor-profile__panel-label">Zarezerwuj zajecia</p>
                                            <h2 className="tutor-profile__section-title">Zarezerwuj swoje zajecia</h2>
                                        </div>
                                    </div>

                                    <div className="tutor-profile__booking-form">
                                        <div className="tutor-profile__field">
                                            <span className="tutor-profile__booking-step">1. Wybierz przedmiot:</span>
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

                                        <div className="tutor-profile__booking-schedule">
                                            <div className="tutor-profile__booking-head">
                                                <span className="tutor-profile__booking-step">2. Wybierz date i godzine:</span>
                                                <div className="tutor-profile__booking-legend" aria-label="Legenda harmonogramu">
                                                    <span className="tutor-profile__legend-chip">
                                                        <span className="tutor-profile__legend-dot is-selected" aria-hidden="true"></span>
                                                        Wybrane zajecia
                                                    </span>
                                                    <span className="tutor-profile__legend-chip">
                                                        <span className="tutor-profile__legend-dot is-available" aria-hidden="true"></span>
                                                        Dostepne zajecia
                                                    </span>
                                                    <span className="tutor-profile__legend-chip">
                                                        <span className="tutor-profile__legend-dot is-unavailable" aria-hidden="true"></span>
                                                        Niedostepne zajecia
                                                    </span>
                                                </div>
                                            </div>

                                            {scheduleGrid.days.length && scheduleGrid.rows.length ? (
                                                <div className="tutor-profile__booking-grid-wrap">
                                                    <table className="tutor-profile__booking-grid">
                                                        <thead>
                                                            <tr>
                                                                <th className="tutor-profile__booking-axis">Godz./Data</th>
                                                                {scheduleGrid.days.map((day) => (
                                                                    <th key={day.iso} className="tutor-profile__booking-day">{day.label}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {scheduleGrid.rows.map((row) => (
                                                                <tr key={row.timeLabel}>
                                                                    <td className="tutor-profile__booking-time">{row.timeLabel}</td>
                                                                    {row.cells.map((cell) => {
                                                                        const isSelected = selectedSlotId === cell.id;
                                                                        const className = [
                                                                            "tutor-profile__booking-cell",
                                                                            `is-${cell.status}`,
                                                                            cell.isBookable ? "is-bookable" : "",
                                                                            isSelected ? "is-selected" : "",
                                                                        ].filter(Boolean).join(" ");

                                                                        return (
                                                                            <td key={cell.id}>
                                                                                <button
                                                                                    className={className}
                                                                                    type="button"
                                                                                    disabled={!cell.isBookable}
                                                                                    aria-label={`${cell.timeRangeLabel} ${cell.shortDateLabel}`}
                                                                                    onClick={() => setSelectedSlotId(cell.id)}
                                                                                />
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <p className="tutor-profile__slot-empty">
                                                    Brak gotowego harmonogramu dla tego tutora.
                                                </p>
                                            )}
                                        </div>

                                        {hasBookingSelection ? (
                                            <div className="tutor-profile__booking-details">
                                                <label className="tutor-profile__booking-card tutor-profile__booking-message">
                                                    <span className="tutor-profile__booking-step">3. Dodatkowe informacje</span>
                                                    <textarea
                                                        value={message}
                                                        onChange={(event) => setMessage(event.target.value)}
                                                    />
                                                </label>

                                                <aside className="tutor-profile__booking-summary">
                                                    <h3>4. Podsumowanie</h3>
                                                    <div className="tutor-profile__summary-list">
                                                        <div className="tutor-profile__summary-item">
                                                            <span>Data</span>
                                                            <strong>{summaryDateLabel}</strong>
                                                        </div>
                                                        <div className="tutor-profile__summary-item">
                                                            <span>Godzina</span>
                                                            <strong>{summaryTimeLabel}</strong>
                                                        </div>
                                                        <div className="tutor-profile__summary-item">
                                                            <span>Przedmiot</span>
                                                            <strong>{summarySubjectLabel}</strong>
                                                        </div>
                                                        <div className="tutor-profile__summary-item">
                                                            <span>Cena zajec</span>
                                                            <strong>{summaryPriceLabel}</strong>
                                                        </div>
                                                    </div>

                                                    {summaryTopicLabel ? (
                                                        <p className="tutor-profile__summary-note">
                                                            Temat z wyszukiwania: <strong>{summaryTopicLabel}</strong>
                                                        </p>
                                                    ) : null}

                                                    <div className="tutor-profile__booking-summary-footer">
                                                        <button className="tutor-profile__cancel" type="button" onClick={onBack}>
                                                            Anuluj
                                                        </button>
                                                        {isAuthenticated ? (
                                                            <button
                                                                className="tutor-profile__cta"
                                                                type="button"
                                                                onClick={handleBookingRequest}
                                                                disabled={isBookingSubmitting}
                                                            >
                                                                {isBookingSubmitting ? "Wysylanie..." : "Wyslij zapytanie"}
                                                            </button>
                                                        ) : (
                                                            <a className="tutor-profile__cta" href={bookingLoginUrl}>
                                                                Zaloguj sie i wyslij zapytanie
                                                            </a>
                                                        )}
                                                    </div>
                                                </aside>
                                            </div>
                                        ) : (
                                            <p className="tutor-profile__booking-copy">
                                                Na poczatku widac tylko wybor przedmiotu i harmonogram. Po kliknieciu terminu
                                                pojawia sie notatka, podsumowanie i przycisk wysylki zapytania.
                                            </p>
                                        )}

                                        {bookingError ? <p className="tutor-profile__status tutor-profile__status--error">{bookingError}</p> : null}
                                        {bookingSuccess ? <p className="tutor-profile__status tutor-profile__status--success">{bookingSuccess}</p> : null}
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
