import { useEffect, useState } from "react";

import HomeHeader from "./components/HomeHeader.jsx";
import HeroSection from "./components/HeroSection.jsx";
import MentorSection from "./components/MentorSection.jsx";
import PortalSection from "./components/PortalSection.jsx";
import SearchSection from "./components/SearchSection.jsx";
import ApiRegisterForm from "./components/ApiRegisterForm.jsx";
import { navLinks } from "./content.js";

export default function HomeApp({
    csrfToken = "",
    currentUser: initialUser = null,
    images = {},
    isAuthenticated: initialAuth = false,
    urls = {},
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState("home");

    // Używamy stanu w Reakcie, żeby łatwo go zaktualizować po rejestracji w tle
    const [currentUser, setCurrentUser] = useState(initialUser);
    const [isAuthenticated, setIsAuthenticated] = useState(initialAuth);

    useEffect(() => {
        const updateHeaderState = () => {
            setIsScrolled(window.scrollY > 18);
        };

        updateHeaderState();
        window.addEventListener("scroll", updateHeaderState, { passive: true });

        return () => window.removeEventListener("scroll", updateHeaderState);
    }, []);

    useEffect(() => {
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
    }, []);

    const handleNavClick = (sectionId) => {
        setActiveSection(sectionId);
        setIsMenuOpen(false);
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
                {/* Blok demo do prezentacji działania rejestracji/danych */}
                <section style={{ padding: '60px 20px', textAlign: 'center', background: isAuthenticated ? '#f0fdf4' : '#f9fafb' }}>
                    {!isAuthenticated ? (
                        <ApiRegisterForm onRegisterSuccess={(userData) => {
                            setCurrentUser(userData);
                            setIsAuthenticated(true);
                        }} />
                    ) : (
                        <div>
                            <h2>Cześć, {currentUser.username}!</h2>
                            <p>Twój e-mail wyciągnięty do Reacta to: <strong>{currentUser.email}</strong></p>
                            <p style={{ fontSize: '14px', color: '#555', marginTop: '10px' }}>
                                (Ten obiekt <code>currentUser</code> żyje w stanie HomeApp i możesz go przekazywać do każdego innego komponentu)
                            </p>
                        </div>
                    )}
                </section>

                <HeroSection aboutUrl={urls.about} heroImageSrc={images.hero} />
                <PortalSection />
                <SearchSection isAuthenticated={isAuthenticated} urls={urls} />
                <MentorSection mentorImageSrc={images.mentor} registerUrl={urls.register} />
            </main>
        </div>
    );
}