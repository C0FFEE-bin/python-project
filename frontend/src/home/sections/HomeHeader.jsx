import { useEffect, useRef, useState } from "react";

import { headerNotifications, navLinks } from "../content.js";
import joinClasses from "../utils/joinClasses.js";
import AuthAction from "../components/AuthAction.jsx";

export default function HomeHeader({
    activeSection,
    csrfToken,
    currentUser,
    isAuthenticated,
    isMenuOpen,
    isScrolled,
    logoSrc,
    onNavClick,
    onOpenPortal,
    onOpenTutorDashboard,
    onToggleMenu,
    urls,
}) {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationsPanelRef = useRef(null);
    const notificationsCount = headerNotifications.length;

    useEffect(() => {
        if (!isNotificationsOpen) {
            return undefined;
        }

        const handlePointerDown = (event) => {
            if (notificationsPanelRef.current?.contains(event.target)) {
                return;
            }

            setIsNotificationsOpen(false);
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setIsNotificationsOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isNotificationsOpen]);

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
                                setIsNotificationsOpen(false);
                                onNavClick(link.id);
                            }}
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="quick-actions">
                    <div
                        ref={notificationsPanelRef}
                        className={joinClasses("quick-actions__notifications", isNotificationsOpen && "is-open")}
                    >
                        <button
                            className={joinClasses(
                                "quick-actions__button",
                                "quick-actions__button--notifications",
                                isNotificationsOpen && "is-active",
                            )}
                            type="button"
                            aria-label="Powiadomienia"
                            aria-expanded={isNotificationsOpen}
                            aria-controls="header-notifications-panel"
                            onClick={() => setIsNotificationsOpen((currentValue) => !currentValue)}
                        >
                            <i className="fa-regular fa-bell" aria-hidden="true"></i>
                            {isAuthenticated ? (
                                <span className="quick-actions__badge" aria-hidden="true">{notificationsCount}</span>
                            ) : null}
                        </button>

                        <div
                            className="notifications-panel"
                            id="header-notifications-panel"
                            role="region"
                            aria-hidden={!isNotificationsOpen}
                            aria-labelledby="header-notifications-heading"
                        >
                            <div className="notifications-panel__header">
                                <div>
                                    <span className="notifications-panel__eyebrow">Centrum</span>
                                    <h2 id="header-notifications-heading">Powiadomienia</h2>
                                </div>
                                <span className="notifications-panel__count">{isAuthenticated ? notificationsCount : 0}</span>
                            </div>

                            {isAuthenticated ? (
                                <div className="notifications-panel__list">
                                    {headerNotifications.map((notification) => (
                                        <article key={notification.id} className="notifications-panel__item">
                                            <span className="notifications-panel__icon" aria-hidden="true">
                                                <i className={notification.icon}></i>
                                            </span>
                                            <div className="notifications-panel__copy">
                                                <p>{notification.title}</p>
                                                <span>{notification.meta}</span>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className="notifications-panel__empty">
                                    <p>Zaloguj sie, aby zobaczyc swoje powiadomienia i aktywnosc konta.</p>
                                    <a className="notifications-panel__link" href={urls.login ?? "/login"}>
                                        Przejdz do logowania
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                    <AuthAction
                        csrfToken={csrfToken}
                        currentUser={currentUser}
                        isAuthenticated={isAuthenticated}
                        onOpenPortal={onOpenPortal}
                        onOpenTutorDashboard={onOpenTutorDashboard}
                        urls={urls}
                    />
                </div>
            </div>
        </header>
    );
}
