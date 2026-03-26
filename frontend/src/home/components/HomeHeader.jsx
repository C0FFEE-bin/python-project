import { navLinks } from "../content.js";
import joinClasses from "../utils/joinClasses.js";
import AuthAction from "./AuthAction.jsx";

export default function HomeHeader({
    activeSection,
    csrfToken,
    currentUser,
    isAuthenticated,
    isMenuOpen,
    isScrolled,
    logoSrc,
    onNavClick,
    onToggleMenu,
    urls,
}) {
    return (
        <header className={joinClasses("landing-header", isMenuOpen && "is-open", isScrolled && "is-scrolled")}>
            <a className="brand" href={urls.home} aria-label="Rent Nerd home">
                <img className="brand__logo" src={logoSrc} alt="Rent Nerd" />
            </a>

            <button
                className="landing-header__toggle"
                type="button"
                onClick={onToggleMenu}
                aria-expanded={isMenuOpen}
                aria-label="Otworz menu"
            >
                <i className="fa-solid fa-bars"></i>
            </button>

            <div className="landing-header__panel">
                <nav className="top-nav" aria-label="Glowna nawigacja">
                    {navLinks.map((link) => (
                        <a
                            key={link.id}
                            className={joinClasses("top-nav__link", activeSection === link.id && "is-active")}
                            href={`#${link.id}`}
                            onClick={(event) => {
                                event.preventDefault();
                                onNavClick(link.id);
                            }}
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="quick-actions">
                    <button className="quick-actions__button" type="button" aria-label="Powiadomienia">
                        <i className="fa-regular fa-bell"></i>
                    </button>
                    <AuthAction
                        csrfToken={csrfToken}
                        currentUser={currentUser}
                        isAuthenticated={isAuthenticated}
                        urls={urls}
                    />
                </div>
            </div>
        </header>
    );
}
