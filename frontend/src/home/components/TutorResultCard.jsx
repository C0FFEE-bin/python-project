import joinClasses from "../utils/joinClasses.js";

const metaIcons = {
    rating: "fa-solid fa-star",
    experience: "fa-solid fa-briefcase",
    status: "fa-solid fa-circle-check",
};

export default function TutorResultCard({ tutor }) {
    return (
        <article className="tutor-card">
            <div className={joinClasses("tutor-card__avatar", `tutor-card__avatar--${tutor.avatarTone}`)}>
                <span>{tutor.initials}</span>
            </div>

            <div className="tutor-card__body">
                <div className="tutor-card__heading">
                    <h4 className="tutor-card__name">{tutor.name}</h4>
                    <span className="tutor-card__age">{tutor.age} lat</span>
                </div>

                <div className="tutor-card__meta">
                    <span className="tutor-card__pill">
                        <i className={metaIcons.rating} aria-hidden="true"></i>
                        {tutor.rating.toFixed(1)}/5 ({tutor.opinions} opinii)
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
            </div>
        </article>
    );
}
