const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const sectionLinks = document.querySelectorAll("[data-section-link]");
const revealItems = document.querySelectorAll("[data-reveal]");

if (navToggle && header) {
    navToggle.addEventListener("click", () => {
        const isOpen = header.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
    });
}

sectionLinks.forEach((link) => {
    link.addEventListener("click", () => {
        if (header) {
            header.classList.remove("is-open");
        }

        if (navToggle) {
            navToggle.setAttribute("aria-expanded", "false");
        }
    });
});

if (header) {
    const updateHeaderState = () => {
        header.classList.toggle("is-scrolled", window.scrollY > 18);
    };

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });
}

if (revealItems.length) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.18,
    });

    revealItems.forEach((item) => revealObserver.observe(item));
}

if (sectionLinks.length) {
    const sections = Array.from(sectionLinks)
        .map((link) => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);

    const sectionObserver = new IntersectionObserver((entries) => {
        const visibleEntry = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) {
            return;
        }

        sectionLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === `#${visibleEntry.target.id}`);
        });
    }, {
        threshold: 0.45,
    });

    sections.forEach((section) => sectionObserver.observe(section));
}
