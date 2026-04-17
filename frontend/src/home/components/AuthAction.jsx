export default function AuthAction({ csrfToken, currentUser, isAuthenticated, urls }) {
    if (isAuthenticated) {
        const avatarTone = currentUser?.avatarTone || "slate";

        return (
            <div className="quick-actions__account">
                {currentUser ? (
                    <span
                        className={`quick-actions__user quick-actions__user--${avatarTone}`}
                        title={`Zalogowano jako ${currentUser.displayName || currentUser.username || "uzytkownik"}`}
                        aria-label={currentUser.displayName || currentUser.username || "uzytkownik"}
                    >
                        <i className="fa-solid fa-user quick-actions__user-icon" aria-hidden="true"></i>
                    </span>
                ) : null}

                <form className="quick-actions__form" method="post" action={urls.logout}>
                    <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
                    <button className="quick-actions__button" type="submit" aria-label="Wyloguj">
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                    </button>
                </form>
            </div>
        );
    }

    return (
        <a className="quick-actions__button" href={urls.login} aria-label="Zaloguj">
            <i className="fa-solid fa-arrow-right-to-bracket"></i>
        </a>
    );
}
