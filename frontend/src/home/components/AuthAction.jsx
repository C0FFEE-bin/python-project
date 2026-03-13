export default function AuthAction({ csrfToken, isAuthenticated, urls }) {
    if (isAuthenticated) {
        return (
            <form className="quick-actions__form" method="post" action={urls.logout}>
                <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
                <button className="quick-actions__button" type="submit" aria-label="Wyloguj">
                    <i className="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
            </form>
        );
    }

    return (
        <a className="quick-actions__button" href={urls.login} aria-label="Zaloguj">
            <i className="fa-solid fa-arrow-right-to-bracket"></i>
        </a>
    );
}
