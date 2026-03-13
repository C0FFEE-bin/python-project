import { useEffect, useState } from "react";

import HomeHeader from "./components/HomeHeader.jsx";
import HeroSection from "./components/HeroSection.jsx";
import MentorSection from "./components/MentorSection.jsx";
import PortalSection from "./components/PortalSection.jsx";
import SearchSection from "./components/SearchSection.jsx";
import { navLinks } from "./content.js";

export default function HomeApp({
    csrfToken = "",
    images = {},
    isAuthenticated = false,
    urls = {},
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState("home");

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
                isAuthenticated={isAuthenticated}
                isMenuOpen={isMenuOpen}
                isScrolled={isScrolled}
                logoSrc={images.logo}
                onNavClick={handleNavClick}
                onToggleMenu={() => setIsMenuOpen((currentValue) => !currentValue)}
                urls={urls}
            />

            <main className="landing-main">
                <HeroSection aboutUrl={urls.about} heroImageSrc={images.hero} />
                <PortalSection />
                <SearchSection />
                <MentorSection mentorImageSrc={images.mentor} registerUrl={urls.register} />
            </main>
        </div>
    );
}
