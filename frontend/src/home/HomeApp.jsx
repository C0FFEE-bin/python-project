import { useEffect, useState } from "react";

import {
    defaultSearchDate,
    defaultSearchSelections,
    navLinks,
} from "./content.js";
import { fetchTutorDashboard, fetchTutorProfile } from "./api.js";
import HomeHeader from "./sections/HomeHeader.jsx";
import HeroSection from "./sections/HeroSection.jsx";
import MentorSection from "./sections/MentorSection.jsx";
import OnboardingPreviewPage from "./sections/OnboardingPreviewPage.jsx";
import PortalSection from "./sections/PortalSection.jsx";
import RegistrationOnboardingPage from "./sections/RegistrationOnboardingPage.jsx";
import SearchResultsPage from "./sections/SearchResultsPage.jsx";
import SearchSection from "./sections/SearchSection.jsx";
import TutorDashboardSection from "./sections/TutorDashboardSection.jsx";
import TutorProfile from "./sections/TutorProfile.jsx";

function getSearchParamsState(isTutorAccount = false) {
    const searchParams = new URLSearchParams(window.location.search);
    const viewMode = searchParams.get("view");

    return {
        date: searchParams.get("date") || defaultSearchDate,
        filters: {
            subject: searchParams.get("subject") || defaultSearchSelections.subject,
            topic: searchParams.get("topic") || defaultSearchSelections.topic,
            level: searchParams.get("level") || defaultSearchSelections.level,
            hour: searchParams.get("hour") || defaultSearchSelections.hour,
        },
        mode: viewMode === "results"
            ? "results"
            : viewMode === "tutor-dashboard"
                ? "tutor-dashboard"
                : viewMode === "portal"
                    ? "portal"
                    : isTutorAccount
                        ? "tutor-dashboard"
                        : "landing",
        tutorId: searchParams.get("tutor") || "",
    };
}

function updateLocationState({ date, filters, mode, tutorId = "" }) {
    const nextUrl = new URL(window.location.href);

    nextUrl.searchParams.delete("view");
    nextUrl.searchParams.delete("tutor");
    nextUrl.searchParams.delete("subject");
    nextUrl.searchParams.delete("topic");
    nextUrl.searchParams.delete("level");
    nextUrl.searchParams.delete("hour");
    nextUrl.searchParams.delete("date");

    if (mode === "results" || tutorId) {
        nextUrl.searchParams.set("view", "results");
        nextUrl.searchParams.set("subject", filters.subject);
        nextUrl.searchParams.set("topic", filters.topic);
        nextUrl.searchParams.set("level", filters.level);
        nextUrl.searchParams.set("hour", filters.hour);
        nextUrl.searchParams.set("date", date);
    }

    if (mode === "portal" && !tutorId) {
        nextUrl.searchParams.set("view", "portal");
    }

    if (mode === "tutor-dashboard" && !tutorId) {
        nextUrl.searchParams.set("view", "tutor-dashboard");
    }

    if (tutorId) {
        nextUrl.searchParams.set("tutor", tutorId);
    }

    const hash = tutorId
        ? "#tutor-profile"
        : mode === "results"
            ? "#search-results-page"
            : mode === "tutor-dashboard"
                ? "#tutor-dashboard"
                : mode === "portal"
                    ? "#portal"
                    : "";

    window.history.pushState({}, "", `${nextUrl.pathname}${nextUrl.search}${hash}`);
}

export default function HomeApp({
    csrfToken = "",
    currentUser = null,
    images = {},
    isAuthenticated = false,
    onboardingMode = "",
    onboardingNextTarget = "",
    previewComponent = "",
    urls = {},
}) {
    const isPreview = Boolean(previewComponent);
    const isOnboarding = onboardingMode === "account-type";
    const isStandaloneView = isPreview || isOnboarding;
    const [currentUserState, setCurrentUserState] = useState(currentUser);
    const isTutorAccount = Boolean(currentUserState?.isTutor);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState("home");
    const [pageState, setPageState] = useState(() => getSearchParamsState(isTutorAccount));
    const [selectedTutor, setSelectedTutor] = useState(null);
    const [isTutorLoading, setIsTutorLoading] = useState(false);
    const [tutorError, setTutorError] = useState("");
    const [tutorDashboard, setTutorDashboard] = useState(null);
    const [isTutorDashboardLoading, setIsTutorDashboardLoading] = useState(false);
    const [tutorDashboardError, setTutorDashboardError] = useState("");
    const hasTutorView = Boolean(pageState.tutorId);

    useEffect(() => {
        setCurrentUserState(currentUser);
    }, [currentUser]);

    useEffect(() => {
        if (!pageState.tutorId) {
            setSelectedTutor(null);
            setTutorError("");
            setIsTutorLoading(false);
            return undefined;
        }

        let ignoreResponse = false;

        async function loadTutorProfile() {
            setIsTutorLoading(true);
            setTutorError("");

            try {
                const tutorProfileBaseUrl = urls.tutorProfileBase ?? "/api/tutor-profile";
                const tutorProfile = await fetchTutorProfile({
                    tutorId: pageState.tutorId,
                    tutorProfileBaseUrl,
                    date: pageState.date,
                    databaseErrorUrl: urls.databaseError ?? "/database-error",
                });

                if (!ignoreResponse) {
                    setSelectedTutor(tutorProfile);
                }
            } catch (error) {
                if (!ignoreResponse) {
                    setSelectedTutor(null);
                    setTutorError(error?.message || "Nie udalo sie pobrac profilu tutora.");
                }
            } finally {
                if (!ignoreResponse) {
                    setIsTutorLoading(false);
                }
            }
        }

        loadTutorProfile();

        return () => {
            ignoreResponse = true;
        };
    }, [pageState.date, pageState.tutorId, urls.tutorProfileBase, urls.databaseError]);

    useEffect(() => {
        if (pageState.mode !== "tutor-dashboard" || !isTutorAccount || hasTutorView) {
            setTutorDashboard(null);
            setTutorDashboardError("");
            setIsTutorDashboardLoading(false);
            return undefined;
        }

        let ignoreResponse = false;

        async function loadTutorDashboard() {
            setIsTutorDashboardLoading(true);
            setTutorDashboardError("");

            try {
                const dashboardUrl = urls.tutorDashboardData ?? "/api/tutor-dashboard";
                const dashboardPayload = await fetchTutorDashboard({
                    dashboardUrl,
                    databaseErrorUrl: urls.databaseError ?? "/database-error",
                });

                if (!ignoreResponse) {
                    setTutorDashboard(dashboardPayload);
                    setCurrentUserState((previousUser) => {
                        if (!previousUser?.isTutor) {
                            return previousUser;
                        }

                        const nextAvatarTone = dashboardPayload?.profile?.avatarTone || previousUser.avatarTone;
                        if (nextAvatarTone === previousUser.avatarTone) {
                            return previousUser;
                        }

                        return {
                            ...previousUser,
                            avatarTone: nextAvatarTone,
                        };
                    });
                }
            } catch (error) {
                if (!ignoreResponse) {
                    setTutorDashboard(null);
                    setTutorDashboardError(error?.message || "Nie udalo sie pobrac dashboardu tutora.");
                }
            } finally {
                if (!ignoreResponse) {
                    setIsTutorDashboardLoading(false);
                }
            }
        }

        loadTutorDashboard();

        return () => {
            ignoreResponse = true;
        };
    }, [hasTutorView, isTutorAccount, pageState.mode, urls.databaseError, urls.tutorDashboardData]);

    useEffect(() => {
        if (isStandaloneView) {
            return undefined;
        }

        const updateHeaderState = () => {
            setIsScrolled(window.scrollY > 18);
        };

        updateHeaderState();
        window.addEventListener("scroll", updateHeaderState, { passive: true });

        return () => window.removeEventListener("scroll", updateHeaderState);
    }, [isStandaloneView]);

    useEffect(() => {
        if (isStandaloneView) {
            return undefined;
        }

        const handlePopState = () => {
            setPageState(getSearchParamsState(isTutorAccount));
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [isStandaloneView, isTutorAccount]);

    useEffect(() => {
        if (isStandaloneView) {
            return undefined;
        }

        if (pageState.mode === "tutor-dashboard") {
            setActiveSection("home");
            return undefined;
        }

        if (pageState.mode === "portal") {
            setActiveSection("portal");
            return undefined;
        }

        if (pageState.mode === "results" || hasTutorView) {
            setActiveSection("wyszukiwarka");
            return undefined;
        }

        const sections = navLinks
            .map((link) => document.getElementById(link.id))
            .filter(Boolean);

        if (!sections.length) {
            return undefined;
        }

        const observer = new IntersectionObserver((entries) => {
            const visibleEntry = entries
                .filter((entry) => entry.isIntersecting)
                .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

            if (visibleEntry) {
                setActiveSection(visibleEntry.target.id);
            }
        }, {
            threshold: 0.45,
        });

        sections.forEach((section) => observer.observe(section));

        return () => observer.disconnect();
    }, [hasTutorView, isStandaloneView, pageState.mode]);

    if (isPreview) {
        return <OnboardingPreviewPage previewComponent={previewComponent} urls={urls} />;
    }

    if (isOnboarding) {
        return (
            <RegistrationOnboardingPage
                csrfToken={csrfToken}
                nextTarget={onboardingNextTarget}
                urls={urls}
            />
        );
    }

    const handleNavClick = (sectionId) => {
        if (sectionId === "home" && isTutorAccount) {
            const nextState = {
                date: pageState.date,
                filters: { ...pageState.filters },
                mode: "tutor-dashboard",
                tutorId: "",
            };

            updateLocationState(nextState);
            setPageState(nextState);
            setActiveSection("home");
            setIsMenuOpen(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        if (sectionId === "portal") {
            const nextState = {
                date: pageState.date,
                filters: { ...pageState.filters },
                mode: "portal",
                tutorId: "",
            };

            updateLocationState(nextState);
            setPageState(nextState);
            setActiveSection("portal");
            setIsMenuOpen(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        if (pageState.mode !== "landing" || pageState.tutorId) {
            const nextState = {
                date: pageState.date,
                filters: { ...pageState.filters },
                mode: "landing",
                tutorId: "",
            };

            updateLocationState(nextState);
            setPageState(nextState);
            requestAnimationFrame(() => {
                document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        } else {
            document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        setActiveSection(sectionId);
        setIsMenuOpen(false);
    };

    const handleOpenResultsPage = (filters, date) => {
        const nextState = {
            date,
            filters: { ...filters },
            mode: "results",
            tutorId: "",
        };

        updateLocationState(nextState);
        setPageState(nextState);
        setActiveSection("wyszukiwarka");
        setIsMenuOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleBackToSearch = () => {
        const nextState = {
            date: pageState.date,
            filters: { ...pageState.filters },
            mode: "landing",
            tutorId: "",
        };

        updateLocationState(nextState);
        setPageState(nextState);
        requestAnimationFrame(() => {
            document.getElementById("wyszukiwarka")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    };

    const handleOpenTutorProfile = (tutorId, filters, date) => {
        const nextState = {
            date,
            filters: { ...filters },
            mode: "results",
            tutorId,
        };

        updateLocationState(nextState);
        setPageState(nextState);
        setActiveSection("wyszukiwarka");
        setIsMenuOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCloseTutorProfile = () => {
        const nextState = {
            date: pageState.date,
            filters: { ...pageState.filters },
            mode: "results",
            tutorId: "",
        };

        updateLocationState(nextState);
        setPageState(nextState);
        requestAnimationFrame(() => {
            document.getElementById("search-results-page")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    };

    return (
        <div className="landing-shell">
            <div className="landing-backdrop landing-backdrop--top" aria-hidden="true"></div>
            <div className="landing-backdrop landing-backdrop--bottom" aria-hidden="true"></div>

            <HomeHeader
                activeSection={activeSection}
                csrfToken={csrfToken}
                currentUser={currentUserState}
                isAuthenticated={isAuthenticated}
                isMenuOpen={isMenuOpen}
                isScrolled={isScrolled}
                logoSrc={images.logo}
                onNavClick={handleNavClick}
                onToggleMenu={() => setIsMenuOpen((currentValue) => !currentValue)}
                urls={urls}
            />

            <main className="landing-main">
                {hasTutorView ? (
                    <section className="tutor-profile-page landing-section" id="tutor-profile">
                        {isTutorLoading ? (
                            <div className="search-results__empty">Ladowanie profilu tutora...</div>
                        ) : null}
                        {!isTutorLoading && tutorError ? (
                            <div className="search-results__empty">{tutorError}</div>
                        ) : null}
                        {!isTutorLoading && !tutorError && selectedTutor ? (
                            <TutorProfile
                                csrfToken={csrfToken}
                                heroImageSrc={images.hero}
                                requestDate={pageState.date}
                                requestFilters={pageState.filters}
                                tutor={selectedTutor}
                                onBack={handleCloseTutorProfile}
                                urls={urls}
                            />
                        ) : null}
                    </section>
                ) : null}

                {!hasTutorView && pageState.mode === "results" ? (
                    <SearchResultsPage
                        initialDate={pageState.date}
                        initialFilters={pageState.filters}
                        onBackToSearch={handleBackToSearch}
                        onOpenTutorProfile={handleOpenTutorProfile}
                        onSearchSubmit={handleOpenResultsPage}
                        urls={urls}
                    />
                ) : null}

                {!hasTutorView && pageState.mode === "landing" ? (
                    <>
                        <HeroSection aboutUrl={urls.about} heroImageSrc={images.hero} />
                        <SearchSection
                            initialDate={pageState.date}
                            initialFilters={pageState.filters}
                            isAuthenticated={isAuthenticated}
                            onSearchSubmit={handleOpenResultsPage}
                            urls={urls}
                        />
                        <MentorSection mentorImageSrc={images.mentor} registerUrl={urls.register} />
                    </>
                ) : null}

                {!hasTutorView && pageState.mode === "portal" ? (
                    <PortalSection
                        csrfToken={csrfToken}
                        currentUser={currentUserState}
                        isAuthenticated={isAuthenticated}
                        urls={urls}
                    />
                ) : null}

                {!hasTutorView && pageState.mode === "tutor-dashboard" ? (
                    isTutorAccount ? (
                        <TutorDashboardSection
                            dashboard={tutorDashboard}
                            error={tutorDashboardError}
                            isLoading={isTutorDashboardLoading}
                        />
                    ) : (
                        <section className="search-section landing-section" id="tutor-dashboard">
                            <div className="search-results__empty">
                                Dashboard tutora jest dostepny tylko dla konta korepetytora.
                            </div>
                        </section>
                    )
                ) : null}
            </main>
        </div>
    );
}
