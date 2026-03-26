import { useEffect, useMemo, useState } from "react";

import {
    defaultSearchDate,
    defaultSearchSelections,
    getTutorProfileById,
    navLinks,
} from "./content.js";
import HomeHeader from "./components/HomeHeader.jsx";
import HeroSection from "./components/HeroSection.jsx";
import MentorSection from "./components/MentorSection.jsx";
import OnboardingPreviewPage from "./components/OnboardingPreviewPage.jsx";
import PortalSection from "./components/PortalSection.jsx";
import RegistrationOnboardingPage from "./components/RegistrationOnboardingPage.jsx";
import SearchResultsPage from "./components/SearchResultsPage.jsx";
import SearchSection from "./components/SearchSection.jsx";
import TutorProfile from "./components/TutorProfile.jsx";

function getSearchParamsState() {
    const searchParams = new URLSearchParams(window.location.search);

    return {
        date: searchParams.get("date") || defaultSearchDate,
        filters: {
            subject: searchParams.get("subject") || defaultSearchSelections.subject,
            topic: searchParams.get("topic") || defaultSearchSelections.topic,
            level: searchParams.get("level") || defaultSearchSelections.level,
            hour: searchParams.get("hour") || defaultSearchSelections.hour,
        },
        mode: searchParams.get("view") === "results" ? "results" : "landing",
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

    if (tutorId) {
        nextUrl.searchParams.set("tutor", tutorId);
    }

    const hash = tutorId ? "#tutor-profile" : mode === "results" ? "#search-results-page" : "";

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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState("home");
    const [pageState, setPageState] = useState(() => getSearchParamsState());

    const selectedTutor = useMemo(
        () => getTutorProfileById(pageState.tutorId),
        [pageState.tutorId],
    );

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
            setPageState(getSearchParamsState());
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [isStandaloneView]);

    useEffect(() => {
        if (isStandaloneView) {
            return undefined;
        }

        if (pageState.mode === "results" || selectedTutor) {
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
    }, [isStandaloneView, pageState.mode, selectedTutor]);

    if (isPreview) {
        return <OnboardingPreviewPage previewComponent={previewComponent} urls={urls} />;
    }

    if (isOnboarding) {
        return <RegistrationOnboardingPage nextTarget={onboardingNextTarget} urls={urls} />;
    }

    const handleNavClick = (sectionId) => {
        if (pageState.mode !== "landing" || pageState.tutorId) {
            updateLocationState({
                date: defaultSearchDate,
                filters: defaultSearchSelections,
                mode: "landing",
                tutorId: "",
            });
            setPageState({
                date: defaultSearchDate,
                filters: { ...defaultSearchSelections },
                mode: "landing",
                tutorId: "",
            });
            requestAnimationFrame(() => {
                document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
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
                currentUser={currentUser}
                isAuthenticated={isAuthenticated}
                isMenuOpen={isMenuOpen}
                isScrolled={isScrolled}
                logoSrc={images.logo}
                onNavClick={handleNavClick}
                onToggleMenu={() => setIsMenuOpen((currentValue) => !currentValue)}
                urls={urls}
            />

            <main className="landing-main">
                {selectedTutor ? (
                    <section className="tutor-profile-page landing-section" id="tutor-profile">
                        <TutorProfile tutor={selectedTutor} onBack={handleCloseTutorProfile} />
                    </section>
                ) : null}

                {!selectedTutor && pageState.mode === "results" ? (
                    <SearchResultsPage
                        initialDate={pageState.date}
                        initialFilters={pageState.filters}
                        onBackToSearch={handleBackToSearch}
                        onOpenTutorProfile={handleOpenTutorProfile}
                        onSearchSubmit={handleOpenResultsPage}
                    />
                ) : null}

                {!selectedTutor && pageState.mode === "landing" ? (
                    <>
                        <HeroSection aboutUrl={urls.about} heroImageSrc={images.hero} />
                        <PortalSection />
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
            </main>
        </div>
    );
}
