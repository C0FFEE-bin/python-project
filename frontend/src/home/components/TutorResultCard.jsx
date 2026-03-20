import joinClasses from "../utils/joinClasses.js";

const metaIcons = {
    rating: "fa-solid fa-star",
    experience: "fa-solid fa-briefcase",
    status: "fa-solid fa-circle-check",
};

export default function TutorResultCard({ onOpenProfile, tutor }) {
    const ratingLabel = typeof tutor.rating === "number" ? `${tutor.rating.toFixed(1)}/5` : "Brak opinii";
    const ageLabel = typeof tutor.age === "number" ? `${tutor.age} lat` : "Profil aktywny";

    return (
        <article className="tutor-card">
            <div className={joinClasses("tutor-card__avatar", `tutor-card__avatar--${tutor.avatarTone}`)}>
                <span>{tutor.initials}</span>
            </div>

            <div className="tutor-card__body">
                <div className="tutor-card__heading">
                    <h4 className="tutor-card__name">{tutor.name}</h4>
                    <span className="tutor-card__age">{ageLabel}</span>
                </div>

                <div className="tutor-card__meta">
                    <span className="tutor-card__pill">
                        <i className={metaIcons.rating} aria-hidden="true"></i>
                        {ratingLabel} ({tutor.opinions} opinii)
                    </span>
                    <span className="tutor-card__pill">
                        <i className={metaIcons.experience} aria-hidden="true"></i>
                        {tutor.experience}
                    </span>
                    {tutor.statusBadges.map((badge) => (
                        <span key={badge} className="tutor-card__pill">
                            <i className={metaIcons.status} aria-hidden="true"></i>
                            {badge}
                        </span>
                    ))}
                </div>

                <div className="tutor-card__tags">
                    {tutor.tags.map((tag) => (
                        <span key={tag} className="tutor-card__tag">{tag}</span>
                    ))}
                </div>

                <div className="tutor-card__actions">
                    <a
                        className="tutor-card__link"
                        href={tutor.profileUrl}
                        onClick={(event) => {
                            if (!onOpenProfile) {
                                return;
                            }

                            event.preventDefault();
                            onOpenProfile(tutor.id);
                        }}
                    >
                        Zobacz profil
                        <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                    </a>
                </div>
            </div>
        </article>
    );
}
