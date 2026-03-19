import joinClasses from "../utils/joinClasses.js";

const metaIcons = {
    rating: "fa-solid fa-star",
    experience: "fa-solid fa-briefcase",
    status: "fa-solid fa-circle-check",
};

export default function TutorResultCard({ tutor }) {
    const hasRating = typeof tutor.rating === "number" && tutor.rating > 0;
    const statusBadges = Array.isArray(tutor.statusBadges) ? tutor.statusBadges : [];
    const tags = Array.isArray(tutor.tags) ? tutor.tags : [];
    const avatarTone = tutor.avatarTone || "slate";

    return (
        <article className="tutor-card">
            <div className={joinClasses("tutor-card__avatar", `tutor-card__avatar--${avatarTone}`)}>
                <span>{tutor.initials}</span>
            </div>

            <div className="tutor-card__body">
                <div className="tutor-card__heading">
                    <h4 className="tutor-card__name">{tutor.name}</h4>
                    {typeof tutor.age === "number" ? (
                        <span className="tutor-card__age">{tutor.age} lat</span>
                    ) : null}
                </div>

                <div className="tutor-card__meta">
                    <span className="tutor-card__pill">
                        <i className={metaIcons.rating} aria-hidden="true"></i>
                        {hasRating ? `${tutor.rating.toFixed(1)}/5 (${tutor.opinions ?? 0} opinii)` : "Brak opinii"}
                    </span>
                    <span className="tutor-card__pill">
                        <i className={metaIcons.experience} aria-hidden="true"></i>
                        {tutor.experience || "Profil gotowy do kontaktu"}
                    </span>
                    {statusBadges.map((badge) => (
                        <span key={badge} className="tutor-card__pill">
                            <i className={metaIcons.status} aria-hidden="true"></i>
                            {badge}
                        </span>
                    ))}
                </div>

                <div className="tutor-card__tags">
                    {tags.map((tag) => (
                        <span key={tag} className="tutor-card__tag">{tag}</span>
                    ))}
                </div>
            </div>
        </article>
    );
}
