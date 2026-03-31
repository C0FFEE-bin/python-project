import "./TutorDashboardSection.css";

const scheduleSlotClassNames = {
    available: "tutor-dashboard__schedule-slot is-available",
    highlighted: "tutor-dashboard__schedule-slot is-highlighted",
    unavailable: "tutor-dashboard__schedule-slot is-unavailable",
    blocked: "tutor-dashboard__schedule-slot is-blocked",
};

function DashboardState({ message, title }) {
    return (
        <section className="tutor-dashboard landing-section" id="tutor-dashboard">
            <div className="tutor-dashboard__state">
                <p className="eyebrow">{title}</p>
                <h2>{message}</h2>
            </div>
        </section>
    );
}

function HighlightCard({ item }) {
    return (
        <article className="tutor-dashboard__highlight-card">
            <span className="tutor-dashboard__highlight-icon" aria-hidden="true">
                <i className={item.icon}></i>
            </span>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
            <span>{item.description}</span>
        </article>
    );
}

function LessonItem({ lesson }) {
    return (
        <article className="tutor-dashboard__lesson-card">
            <div className="tutor-dashboard__lesson-topline">
                <span className="tutor-dashboard__lesson-status">{lesson.statusLabel}</span>
                <strong>{lesson.timeLabel}</strong>
            </div>
            <h3>{lesson.subjectLabel}</h3>
            <p>{lesson.levelLabel}</p>
            <footer>
                <span>{lesson.weekdayLabel}</span>
                <span>{lesson.dateLabel}</span>
            </footer>
        </article>
    );
}

function MetaPill({ icon, value }) {
    return (
        <span className="tutor-dashboard__meta-pill">
            <i className={icon} aria-hidden="true"></i>
            {value}
        </span>
    );
}

export default function TutorDashboardSection({ dashboard, error = "", isLoading = false }) {
    if (isLoading) {
        return <DashboardState title="Dashboard tutora" message="Ladowanie Twojego dashboardu..." />;
    }

    if (error) {
        return <DashboardState title="Dashboard tutora" message={error} />;
    }

    if (!dashboard) {
        return <DashboardState title="Dashboard tutora" message="Brak danych do wyswietlenia." />;
    }

    const {
        highlights = [],
        insights = [],
        profile = {},
        schedule = { days: [], rows: [] },
        todayLessons = [],
        upcomingLessons = [],
    } = dashboard;
    const avatarTone = profile.avatarTone || "slate";

    return (
        <section className="tutor-dashboard landing-section" id="tutor-dashboard">
            <div className="tutor-dashboard__hero">
                <div className="tutor-dashboard__hero-copy">
                    <p className="eyebrow">Dashboard tutora</p>
                    <h2>{profile.name || "Twoj panel pracy"}</h2>
                    <p className="tutor-dashboard__hero-text">{profile.about}</p>

                    <div className="tutor-dashboard__chip-row">
                        {(profile.subjects || []).map((subject) => (
                            <span key={subject} className="tutor-dashboard__chip">
                                {subject}
                            </span>
                        ))}
                        {(profile.levels || []).map((level) => (
                            <span key={level} className="tutor-dashboard__chip tutor-dashboard__chip--level">
                                {level}
                            </span>
                        ))}
                    </div>
                </div>

                <aside className="tutor-dashboard__hero-side">
                    <div className={`tutor-dashboard__avatar tutor-dashboard__avatar--${avatarTone}`}>
                        <span>{profile.initials || "T"}</span>
                    </div>
                    <div className="tutor-dashboard__meta">
                        <MetaPill icon="fa-solid fa-briefcase" value={profile.experience || "Profil aktywny"} />
                        <MetaPill icon="fa-solid fa-star" value={profile.opinions ? `${profile.rating}/5 (${profile.opinions})` : "Nowy profil"} />
                        <MetaPill icon="fa-solid fa-users" value={`${profile.followersCount || 0} obserwujacych`} />
                    </div>
                    <div className="tutor-dashboard__badge-row">
                        {(profile.statusBadges || []).map((badge) => (
                            <span key={badge} className="tutor-dashboard__badge">
                                {badge}
                            </span>
                        ))}
                    </div>
                </aside>
            </div>

            <div className="tutor-dashboard__highlights">
                {highlights.map((item) => (
                    <HighlightCard key={item.id} item={item} />
                ))}
            </div>

            <div className="tutor-dashboard__layout">
                <section className="tutor-dashboard__panel">
                    <div className="tutor-dashboard__panel-head">
                        <div>
                            <p className="eyebrow">Najblizsze zajecia</p>
                            <h3>Co masz przed soba w najblizszych dniach.</h3>
                        </div>
                    </div>

                    {upcomingLessons.length ? (
                        <div className="tutor-dashboard__lesson-list">
                            {upcomingLessons.map((lesson) => (
                                <LessonItem key={lesson.id} lesson={lesson} />
                            ))}
                        </div>
                    ) : (
                        <div className="tutor-dashboard__empty">
                            Dodaj kolejne sloty w harmonogramie, aby pojawily sie tutaj najblizsze zajecia.
                        </div>
                    )}
                </section>

                <div className="tutor-dashboard__stack">
                    <section className="tutor-dashboard__panel">
                        <div className="tutor-dashboard__panel-head">
                            <div>
                                <p className="eyebrow">Dzisiaj</p>
                                <h3>Dzisiejszy plan pracy.</h3>
                            </div>
                        </div>

                        {todayLessons.length ? (
                            <div className="tutor-dashboard__today-list">
                                {todayLessons.map((lesson) => (
                                    <div key={lesson.id} className="tutor-dashboard__today-item">
                                        <strong>{lesson.timeLabel}</strong>
                                        <span>{lesson.subjectLabel}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="tutor-dashboard__empty">
                                Dzisiaj nie masz jeszcze zadnych slotow w swoim harmonogramie.
                            </div>
                        )}
                    </section>

                    <section className="tutor-dashboard__panel">
                        <div className="tutor-dashboard__panel-head">
                            <div>
                                <p className="eyebrow">Szybki wglad</p>
                                <h3>Najwazniejsze informacje o Twoim profilu.</h3>
                            </div>
                        </div>

                        <div className="tutor-dashboard__insights">
                            {insights.map((insight) => (
                                <p key={insight}>{insight}</p>
                            ))}
                        </div>
                    </section>
                </div>

                <section className="tutor-dashboard__panel tutor-dashboard__panel--schedule">
                    <div className="tutor-dashboard__panel-head">
                        <div>
                            <p className="eyebrow">Harmonogram</p>
                            <h3>Twoj tygodniowy podglad zajec.</h3>
                        </div>
                        <div className="tutor-dashboard__legend" aria-label="Legenda harmonogramu">
                            <span className="tutor-dashboard__legend-item is-available">Dostepny</span>
                            <span className="tutor-dashboard__legend-item is-highlighted">Wyrozniony</span>
                            <span className="tutor-dashboard__legend-item is-unavailable">Niedostepny</span>
                            <span className="tutor-dashboard__legend-item is-blocked">Brak dnia</span>
                        </div>
                    </div>

                    {schedule.days?.length && schedule.rows?.length ? (
                        <div className="tutor-dashboard__schedule-wrap">
                            <table className="tutor-dashboard__schedule-table">
                                <thead>
                                    <tr>
                                        <th>Godz/Data</th>
                                        {schedule.days.map((day) => (
                                            <th key={day.iso}>{day.label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedule.rows.map((row) => (
                                        <tr key={row.timeLabel}>
                                            <td className="tutor-dashboard__schedule-time">{row.timeLabel}</td>
                                            {row.slots.map((slot, index) => (
                                                <td key={`${row.timeLabel}-${schedule.days[index].iso}`}>
                                                    <span className={scheduleSlotClassNames[slot] || scheduleSlotClassNames.unavailable}></span>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="tutor-dashboard__empty">
                            Harmonogram pojawi sie tutaj po zapisaniu pierwszych terminow.
                        </div>
                    )}
                </section>
            </div>
        </section>
    );
}
