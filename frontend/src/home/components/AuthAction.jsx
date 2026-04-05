import { useEffect, useMemo, useRef, useState } from "react";

import joinClasses from "../utils/joinClasses.js";

function formatDisplayName(fullName = "", username = "") {
    const normalizedFullName = (fullName || "").trim();
    if (normalizedFullName) {
        return normalizedFullName;
    }

    if (!username) {
        return "Moje konto";
    }

    return username
        .split(/[._-]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ");
}

function getInitials(label = "") {
    const parts = label.split(/\s+/).filter(Boolean).slice(0, 2);

    if (!parts.length) {
        return "U";
    }

    return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

export default function AuthAction({
    csrfToken,
    currentUser,
    isAuthenticated,
    onOpenPortal,
    onOpenTutorDashboard,
    urls,
}) {
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const accountPanelRef = useRef(null);
    const displayName = useMemo(
        () => formatDisplayName(currentUser?.fullName, currentUser?.username),
        [currentUser?.fullName, currentUser?.username],
    );
    const avatarInitials = useMemo(
        () => getInitials(displayName),
        [displayName],
    );
    const menuItems = useMemo(() => {
        const items = [
            {
                id: "profile",
                label: "Moj profil",
                icon: "fa-regular fa-user",
                onClick: () => onOpenPortal?.(),
            },
        ];

        if (currentUser?.isTutor) {
            items.push({
                id: "tutor-dashboard",
                label: "Panel korepetytora",
                icon: "fa-solid fa-chalkboard-user",
                onClick: () => onOpenTutorDashboard?.(),
            });
        }

        items.push(
            {
                id: "settings",
                label: "Ustawienia strony",
                icon: "fa-solid fa-gear",
                href: urls.home ?? "/",
            },
            {
                id: "about",
                label: "Wiecej o Rent a Nerd",
                icon: "fa-regular fa-circle-question",
                href: urls.about ?? "/about",
            },
        );

        return items;
    }, [currentUser?.isTutor, onOpenPortal, onOpenTutorDashboard, urls.about, urls.home]);

    useEffect(() => {
        if (!isAuthenticated || !isAccountMenuOpen) {
            return undefined;
        }

        const handlePointerDown = (event) => {
            if (accountPanelRef.current?.contains(event.target)) {
                return;
            }

            setIsAccountMenuOpen(false);
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setIsAccountMenuOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isAccountMenuOpen, isAuthenticated]);

    const handleMenuAction = (action) => {
        setIsAccountMenuOpen(false);
        action?.();
    };

    if (isAuthenticated) {
        return (
            <div
                ref={accountPanelRef}
                className={joinClasses("quick-actions__account", isAccountMenuOpen && "is-open")}
            >
                <button
                    className={joinClasses("quick-actions__account-trigger", isAccountMenuOpen && "is-active")}
                    type="button"
                    aria-expanded={isAccountMenuOpen}
                    aria-controls="header-account-panel"
                    onClick={() => setIsAccountMenuOpen((currentValue) => !currentValue)}
                    title={displayName ? `Zalogowano jako ${displayName}` : "Menu konta"}
                >
                    <span className="quick-actions__avatar" aria-hidden="true">
                        {avatarInitials}
                    </span>
                </button>

                <div
                    className="account-menu"
                    id="header-account-panel"
                    role="menu"
                    aria-hidden={!isAccountMenuOpen}
                >
                    <div className="account-menu__header">
                        <span className="account-menu__eyebrow">
                            {displayName}
                        </span>
                        <span className="account-menu__meta">
                            {currentUser?.accountType === "tutor" ? "Konto korepetytora" : "Konto uzytkownika"}
                        </span>
                    </div>

                    <div className="account-menu__list">
                        {menuItems.map((item) => (
                            item.href ? (
                                <a
                                    key={item.id}
                                    className="account-menu__item"
                                    href={item.href}
                                    role="menuitem"
                                    onClick={() => setIsAccountMenuOpen(false)}
                                >
                                    <span className="account-menu__icon" aria-hidden="true">
                                        <i className={item.icon}></i>
                                    </span>
                                    <span>{item.label}</span>
                                </a>
                            ) : (
                                <button
                                    key={item.id}
                                    className="account-menu__item"
                                    type="button"
                                    role="menuitem"
                                    onClick={() => handleMenuAction(item.onClick)}
                                >
                                    <span className="account-menu__icon" aria-hidden="true">
                                        <i className={item.icon}></i>
                                    </span>
                                    <span>{item.label}</span>
                                </button>
                            )
                        ))}

                        <form className="account-menu__logout-form" method="post" action={urls.logout}>
                            <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
                            <button className="account-menu__item account-menu__item--logout" type="submit" role="menuitem">
                                <span className="account-menu__icon" aria-hidden="true">
                                    <i className="fa-solid fa-arrow-right-from-bracket"></i>
                                </span>
                                <span>Wyloguj mnie</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <a className="quick-actions__button" href={urls.login} aria-label="Zaloguj">
            <i className="fa-solid fa-arrow-right-to-bracket"></i>
        </a>
    );
}
