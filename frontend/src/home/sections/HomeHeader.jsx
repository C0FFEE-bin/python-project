import { useEffect, useRef, useState } from "react";

import { fetchNotifications, markNotificationsAsRead } from "../api.js";
import { navLinks } from "../content.js";
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
    onToggleMenu,
    urls,
}) {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const notificationsPanelRef = useRef(null);

    // Fetch notifications when authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        const loadNotifications = async () => {
            setIsLoadingNotifications(true);
            try {
                const result = await fetchNotifications({
                    notificationsUrl: urls.notifications,
                });
                setNotifications(result.notifications);
                setUnreadCount(result.unreadCount);
            } catch (error) {
                console.error("Failed to load notifications:", error);
                setNotifications([]);
                setUnreadCount(0);
            } finally {
                setIsLoadingNotifications(false);
            }
        };

        loadNotifications();
    }, [isAuthenticated, urls.notifications]);

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

    const formatNotificationDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = diffMs / (1000 * 60 * 60);
        
        if (diffHours < 1) {
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            return `${diffMinutes} min temu`;
        } else if (diffHours < 24) {
            return `${Math.floor(diffHours)} godz. temu`;
        } else {
            return date.toLocaleDateString('pl-PL');
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'booking_accepted':
                return 'fa-solid fa-calendar-check';
            case 'new_availability':
                return 'fa-solid fa-clock';
            default:
                return 'fa-solid fa-bell';
        }
    };

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
                            aria-label={unreadCount ? `Powiadomienia (${unreadCount})` : "Powiadomienia"}
                            aria-expanded={isNotificationsOpen}
                            aria-controls="header-notifications-panel"
                            onClick={() => setIsNotificationsOpen((currentValue) => !currentValue)}
                        >
                            <i className="fa-regular fa-bell" aria-hidden="true"></i>
                            {isAuthenticated && unreadCount ? (
                                <span className="quick-actions__badge" aria-hidden="true">{unreadCount}</span>
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
                                <span className="notifications-panel__count">{isAuthenticated ? unreadCount : 0}</span>
                            </div>

                            {isAuthenticated ? (
                                unreadCount ? (
                                    <div className="notifications-panel__list">
                                        {notifications.map((notification) => (
                                            <article key={notification.id} className="notifications-panel__item">
                                                <span className="notifications-panel__icon" aria-hidden="true">
                                                    <i className={getNotificationIcon(notification.notification_type)}></i>
                                                </span>
                                                <div className="notifications-panel__copy">
                                                    <p>{notification.message}</p>
                                                    <span>{formatNotificationDate(notification.created_at)}</span>
                                                </div>
                                                <button
                                                    className="notifications-panel__dismiss"
                                                    type="button"
                                                    aria-label={`Oznacz jako przeczytane: ${notification.message}`}
                                                    onClick={() => handleRemoveNotification(notification.id)}
                                                >
                                                    <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                                                </button>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="notifications-panel__empty">
                                        <p>Nie masz nowych powiadomien. Wroc tutaj, gdy pojawi sie kolejna aktywnosc.</p>
                                    </div>
                                )
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
                        urls={urls}
                    />
                </div>
            </div>
        </header>
    );
}
