import { useState } from "react";

const slotClassNames = {
    available: "tutor-profile__slot tutor-profile__slot--available",
    limited: "tutor-profile__slot tutor-profile__slot--limited",
    unavailable: "tutor-profile__slot tutor-profile__slot--unavailable",
};

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
    const filledStars = Math.max(1, Math.round(rating ?? 0));

    return (
        <div className="tutor-profile__stars" aria-label={`Ocena ${rating ?? 0} na 5`}>
            {Array.from({ length: 5 }, (_, index) => (
                <StarIcon key={index} isFilled={index < filledStars} />
            ))}
        </div>
    );
}

export default function TutorProfile({ onBack, tutor }) {
    const [isFollowing, setIsFollowing] = useState(false);

    if (!tutor) {
        return null;
    }

    return (
        <div className="tutor-profile">
            <style>{`
                .tutor-profile {
                    display: grid;
                    gap: 24px;
                }

                .tutor-profile__toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                    flex-wrap: wrap;
                }

                .tutor-profile__back,
                .tutor-profile__cta,
                .tutor-profile__follow {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    min-height: 52px;
                    padding: 0 22px;
                    border: 0;
                    border-radius: 999px;
                    font-family: var(--font-display);
                    font-size: 0.96rem;
                    font-weight: 700;
                    letter-spacing: 0.02em;
                    transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
                }

                .tutor-profile__back {
                    background: rgba(255, 255, 255, 0.88);
                    color: var(--ink);
                    box-shadow: var(--shadow-soft);
                }

                .tutor-profile__cta {
                    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%);
                    color: #fff;
                    box-shadow: 0 16px 28px rgba(173, 95, 202, 0.24);
                }

                .tutor-profile__follow {
                    min-height: 40px;
                    padding: 0 16px;
                    background: rgba(233, 219, 241, 0.92);
                    color: var(--accent-strong);
                    box-shadow: none;
                }

                .tutor-profile__follow.is-active {
                    background: rgba(94, 102, 125, 0.12);
                    color: #5c5560;
                }

                .tutor-profile__back:hover,
                .tutor-profile__cta:hover,
                .tutor-profile__follow:hover {
                    transform: translateY(-2px);
                }

                .tutor-profile__hero,
                .tutor-profile__panel {
                    border: 1px solid rgba(124, 114, 131, 0.12);
                    border-radius: 34px;
                    background: rgba(255, 255, 255, 0.94);
                    box-shadow:
                        0 4px 0 rgba(95, 93, 102, 0.08),
                        0 18px 32px rgba(101, 97, 109, 0.1);
                }

                .tutor-profile__hero {
                    overflow: hidden;
                }

                .tutor-profile__cover {
                    position: relative;
                    min-height: 220px;
                    padding: 26px;
                    background:
                        radial-gradient(circle at 10% 24%, rgba(255, 255, 255, 0.4), transparent 24%),
                        radial-gradient(circle at 82% 28%, rgba(255, 255, 255, 0.26), transparent 18%),
                        linear-gradient(135deg, #d59ae4 0%, #a971cf 48%, #6f7fa0 100%);
                }

                .tutor-profile__cover::after {
                    content: "";
                    position: absolute;
                    inset: auto -4% -64px auto;
                    width: 42%;
                    height: 140px;
                    border-radius: 999px 0 0 0;
                    background: rgba(255, 255, 255, 0.14);
                    filter: blur(0.4px);
                }

                .tutor-profile__cover-badges {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .tutor-profile__cover-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    min-height: 36px;
                    padding: 0 16px;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.2);
                    color: #fff;
                    font-size: 0.84rem;
                    font-weight: 700;
                    letter-spacing: 0.03em;
                    text-transform: uppercase;
                    backdrop-filter: blur(10px);
                }

                .tutor-profile__hero-body {
                    position: relative;
                    z-index: 1;
                    display: grid;
                    grid-template-columns: auto minmax(0, 1fr);
                    gap: 22px;
                    align-items: end;
                    padding: 0 28px 28px;
                    margin-top: -62px;
                }

                .tutor-profile__avatar {
                    display: grid;
                    place-items: center;
                    width: 122px;
                    aspect-ratio: 1;
                    border: 5px solid #fff;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #66748f, #c07fd7);
                    color: #fff;
                    font-family: var(--font-display);
                    font-size: 2.2rem;
                    font-weight: 800;
                    box-shadow: 0 18px 30px rgba(89, 86, 100, 0.2);
                }

                .tutor-profile__identity-copy {
                    display: grid;
                    gap: 14px;
                    min-width: 0;
                    padding-top: 72px;
                }

                .tutor-profile__headline {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 22px;
                    flex-wrap: wrap;
                }

                .tutor-profile__name {
                    margin: 0;
                    color: #201c23;
                    font-family: var(--font-display);
                    font-size: clamp(2.1rem, 3vw, 2.9rem);
                    line-height: 0.96;
                }

                .tutor-profile__meta-line {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px 12px;
                    align-items: center;
                    color: #847781;
                    font-size: 0.95rem;
                    font-weight: 700;
                    margin-top: 10px;
                }

                .tutor-profile__follow-row {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 10px;
                    margin-top: 16px;
                }

                .tutor-profile__followers {
                    color: #9a8f97;
                    font-size: 0.9rem;
                    font-weight: 700;
                }

                .tutor-profile__meta-pill,
                .tutor-profile__subject,
                .tutor-profile__legend-pill {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    min-height: 34px;
                    padding: 0 14px;
                    border-radius: 999px;
                    font-size: 0.82rem;
                    font-weight: 700;
                }

                .tutor-profile__meta-pill {
                    background: rgba(238, 235, 240, 0.92);
                    color: #71676d;
                }

                .tutor-profile__subject {
                    background: rgba(229, 216, 238, 0.84);
                    color: #755d82;
                }

                .tutor-profile__grid {
                    display: grid;
                    gap: 18px;
                }

                .tutor-profile__panel {
                    padding: 28px;
                }

                .tutor-profile__section-title {
                    margin: 0 0 16px;
                    color: #3d3742;
                    font-family: var(--font-display);
                    font-size: 1.42rem;
                    font-weight: 700;
                }

                .tutor-profile__subjects,
                .tutor-profile__facts,
                .tutor-profile__legend {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .tutor-profile__facts {
                    margin-top: 18px;
                }

                .tutor-profile__about {
                    display: grid;
                    gap: 14px;
                }

                .tutor-profile__about p,
                .tutor-profile__review-text {
                    margin: 0;
                    color: #655c64;
                    font-size: 1rem;
                    line-height: 1.7;
                }

                .tutor-profile__panel--compact {
                    padding-bottom: 34px;
                }

                .tutor-profile__review-layout {
                    display: grid;
                    grid-template-columns: minmax(180px, 220px) minmax(0, 1fr);
                    gap: 24px;
                    align-items: start;
                }

                .tutor-profile__rating-box {
                    display: grid;
                    gap: 12px;
                    padding: 20px;
                    border-radius: 26px;
                    background: linear-gradient(180deg, rgba(244, 229, 250, 0.9), rgba(255, 255, 255, 0.88));
                }

                .tutor-profile__rating-value {
                    display: flex;
                    align-items: baseline;
                    gap: 6px;
                    color: #2f2a35;
                    font-family: var(--font-display);
                    font-size: 2.2rem;
                    font-weight: 800;
                }

                .tutor-profile__rating-value small {
                    color: #95898f;
                    font-size: 1rem;
                }

                .tutor-profile__stars {
                    display: flex;
                    gap: 4px;
                    color: #f1a43f;
                }

                .tutor-profile__rating-caption {
                    color: #8e8389;
                    font-size: 0.92rem;
                    font-weight: 700;
                }

                .tutor-profile__review-card {
                    display: grid;
                    gap: 10px;
                    padding: 20px;
                    border-radius: 26px;
                    background: rgba(248, 246, 249, 0.92);
                }

                .tutor-profile__review-header {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }

                .tutor-profile__review-avatar {
                    display: grid;
                    place-items: center;
                    width: 46px;
                    aspect-ratio: 1;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #677896, #b86ed2);
                    color: #fff;
                    font-weight: 800;
                }

                .tutor-profile__review-meta strong {
                    display: block;
                    color: #2f2a35;
                    font-size: 1rem;
                }

                .tutor-profile__review-meta span {
                    color: #988d94;
                    font-size: 0.84rem;
                    font-weight: 700;
                }

                .tutor-profile__schedule {
                    overflow-x: auto;
                }

                .tutor-profile__schedule-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 8px;
                }

                .tutor-profile__schedule-table th,
                .tutor-profile__schedule-table td {
                    text-align: center;
                }

                .tutor-profile__schedule-table th {
                    color: #867a84;
                    font-size: 0.86rem;
                    font-weight: 800;
                    letter-spacing: 0.04em;
                }

                .tutor-profile__schedule-time {
                    color: #514953;
                    font-size: 0.9rem;
                    font-weight: 800;
                    white-space: nowrap;
                }

                .tutor-profile__slot {
                    min-width: 72px;
                    height: 30px;
                    border-radius: 999px;
                }

                .tutor-profile__slot--available {
                    background: #ef9aa8;
                }

                .tutor-profile__slot--limited {
                    background: #dad7df;
                }

                .tutor-profile__slot--unavailable {
                    background: #8b8a96;
                }

                .tutor-profile__legend-pill::before {
                    content: "";
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: currentColor;
                }

                .tutor-profile__legend-pill--available {
                    background: rgba(239, 154, 168, 0.16);
                    color: #d8798b;
                }

                .tutor-profile__legend-pill--limited {
                    background: rgba(218, 215, 223, 0.42);
                    color: #847a86;
                }

                .tutor-profile__legend-pill--unavailable {
                    background: rgba(139, 138, 150, 0.14);
                    color: #666473;
                }

                @media (max-width: 900px) {
                    .tutor-profile__hero-body {
                        grid-template-columns: 1fr;
                        align-items: start;
                        margin-top: -52px;
                    }

                    .tutor-profile__review-layout {
                        grid-template-columns: 1fr;
                    }

                    .tutor-profile__identity-copy {
                        padding-top: 0;
                    }
                }

                @media (max-width: 640px) {
                    .tutor-profile__toolbar,
                    .tutor-profile__headline,
                    .tutor-profile__meta-line {
                        align-items: stretch;
                    }

                    .tutor-profile__toolbar > *,
                    .tutor-profile__headline > *,
                    .tutor-profile__follow,
                    .tutor-profile__back,
                    .tutor-profile__cta {
                        width: 100%;
                    }

                    .tutor-profile__panel {
                        padding: 20px;
                    }

                    .tutor-profile__cover {
                        min-height: 180px;
                        padding: 20px;
                    }

                    .tutor-profile__avatar {
                        width: 96px;
                        font-size: 1.7rem;
                    }

                    .tutor-profile__schedule-table {
                        border-spacing: 6px;
                    }

                    .tutor-profile__slot {
                        min-width: 60px;
                    }

                    .tutor-profile__hero-body {
                        padding: 0 20px 22px;
                        margin-top: -44px;
                    }
                }
            `}</style>

            <div className="tutor-profile__toolbar">
                <button className="tutor-profile__back" type="button" onClick={onBack}>
                    <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
                    Wroc do wynikow
                </button>

                <a className="tutor-profile__cta" href="#kontakt">
                    Napisz do tutora
                </a>
            </div>

            <article className="tutor-profile__hero">
                <div className="tutor-profile__cover">
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

                    <div className="tutor-profile__identity-copy">
                        <div className="tutor-profile__headline">
                            <div>
                                <h1 className="tutor-profile__name">{tutor.name}</h1>
                                <div className="tutor-profile__meta-line">
                                    <span>{tutor.age} lat</span>
                                    <span>|</span>
                                    <span>{tutor.experience}</span>
                                    <span>|</span>
                                    <span>{tutor.followersCount} obserwujacych</span>
                                </div>
                                <div className="tutor-profile__follow-row">
                                    <button
                                        className={`tutor-profile__follow${isFollowing ? " is-active" : ""}`}
                                        type="button"
                                        onClick={() => setIsFollowing((currentValue) => !currentValue)}
                                    >
                                        {isFollowing ? "Obserwujesz" : "Obserwuj"}
                                    </button>
                                    <span className="tutor-profile__followers">{tutor.followersCount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="tutor-profile__facts">
                            <span className="tutor-profile__meta-pill">
                                <i className="fa-solid fa-star" aria-hidden="true"></i>
                                {tutor.rating.toFixed(1)}/5
                            </span>
                            <span className="tutor-profile__meta-pill">
                                <i className="fa-solid fa-comments" aria-hidden="true"></i>
                                {tutor.opinions} opinii
                            </span>
                            {tutor.statusBadges.map((badge) => (
                                <span key={badge} className="tutor-profile__meta-pill">
                                    <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
                                    {badge}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </article>

            <div className="tutor-profile__grid">
                <section className="tutor-profile__panel tutor-profile__panel--compact">
                    <h2 className="tutor-profile__section-title">Uczy z</h2>
                    <div className="tutor-profile__subjects">
                        {tutor.tags.map((tag) => (
                            <span key={tag} className="tutor-profile__subject">{tag}</span>
                        ))}
                    </div>
                </section>

                <section className="tutor-profile__panel">
                    <h2 className="tutor-profile__section-title">O mnie</h2>
                    <div className="tutor-profile__about">
                        {tutor.aboutParagraphs.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                    </div>
                </section>

                <section className="tutor-profile__panel">
                    <h2 className="tutor-profile__section-title">Opinie</h2>

                    <div className="tutor-profile__review-layout">
                        <div className="tutor-profile__rating-box">
                            <div className="tutor-profile__rating-value">
                                {tutor.rating.toFixed(1)}
                                <small>/5</small>
                            </div>
                            <RatingStars rating={tutor.rating} />
                            <span className="tutor-profile__rating-caption">{tutor.opinions} opinii z profilu</span>
                        </div>

                        <article className="tutor-profile__review-card">
                            <div className="tutor-profile__review-header">
                                <div className="tutor-profile__review-avatar" aria-hidden="true">
                                    {tutor.review.author.slice(0, 1)}
                                </div>

                                <div className="tutor-profile__review-meta">
                                    <strong>{tutor.review.author}</strong>
                                    <span>{tutor.review.dateLabel}</span>
                                </div>
                            </div>

                            <RatingStars rating={tutor.review.rating} />
                            <p className="tutor-profile__review-text">{tutor.review.content}</p>
                        </article>
                    </div>
                </section>

                <section className="tutor-profile__panel">
                    <h2 className="tutor-profile__section-title">Harmonogram</h2>

                    <div className="tutor-profile__schedule">
                        <table className="tutor-profile__schedule-table">
                            <thead>
                                <tr>
                                    <th>Godz./Data</th>
                                    {tutor.schedule.days.map((day) => (
                                        <th key={day.iso}>{day.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tutor.schedule.rows.map((row) => (
                                    <tr key={row.timeLabel}>
                                        <td className="tutor-profile__schedule-time">{row.timeLabel}</td>
                                        {row.slots.map((slot, index) => (
                                            <td key={`${row.timeLabel}-${tutor.schedule.days[index].iso}`}>
                                                <div className={slotClassNames[slot]}></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="tutor-profile__legend">
                        <span className="tutor-profile__legend-pill tutor-profile__legend-pill--available">Dostepny</span>
                        <span className="tutor-profile__legend-pill tutor-profile__legend-pill--limited">Inna godzina</span>
                        <span className="tutor-profile__legend-pill tutor-profile__legend-pill--unavailable">Poza grafikiem</span>
                    </div>
                </section>
            </div>
        </div>
    );
}
