document.addEventListener("DOMContentLoaded", () => {
    const animatedNodes = document.querySelectorAll("[data-animate]");
    const parallaxNodes = document.querySelectorAll(".js-parallax");
    const folderStage = document.querySelector(".js-folder-stage");
    const folderToggle = folderStage?.querySelector(".creator-folder");
    const folderHint = folderStage?.querySelector(".about-creators__hint");
    const folderCards = folderStage ? Array.from(folderStage.querySelectorAll(".creator-card")) : [];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lastCardIndex = folderCards.length - 1;
    let activeCardIndex = -1;
    let folderLocked = false;

    const getFolderHintText = (activeIndex) => {
        if (activeIndex < 0) {
            return "Kliknij, zeby otworzyc teczke dokumentow.";
        }

        if (activeIndex >= lastCardIndex) {
            return "Kliknij jeszcze raz, a ostatnia kartka opadnie i teczka sie zamknie.";
        }

        const nextCard = folderCards[activeIndex + 1];
        const nextTitle = nextCard?.querySelector("h3")?.textContent?.trim();

        return nextTitle
            ? `Kliknij ponownie, a ta kartka opadnie i wskoczy: ${nextTitle}.`
            : "Kliknij ponownie, a wskoczy kolejna kartka.";
    };

    const updateFolderUi = () => {
        if (!folderStage || !folderToggle) {
            return;
        }

        const isOpen = activeCardIndex >= 0;
        const hintText = getFolderHintText(activeCardIndex);

        folderStage.dataset.folderIndex = String(activeCardIndex);
        folderStage.classList.toggle("is-open", isOpen);
        folderToggle.setAttribute("aria-expanded", String(isOpen));
        folderToggle.setAttribute("aria-label", hintText);

        folderCards.forEach((card, index) => {
            card.classList.toggle("is-active", index === activeCardIndex);
        });

        if (folderHint) {
            folderHint.textContent = hintText;
        }
    };

    const clearCardEffects = () => {
        folderCards.forEach((card) => {
            card.classList.remove("is-active", "is-falling");
        });
    };

    const unlockFolderLater = (delay) => {
        window.setTimeout(() => {
            folderLocked = false;
        }, delay);
    };

    const openFolder = () => {
        if (!folderStage || !folderToggle) {
            return;
        }

        folderLocked = true;
        activeCardIndex = -1;
        clearCardEffects();
        updateFolderUi();

        const revealDelay = reduceMotion ? 0 : 360;

        if (folderHint) {
            folderHint.textContent = "Teczka sie otwiera i pokazuje pierwsza kartke.";
        }

        folderStage.classList.add("is-open");
        folderToggle.setAttribute("aria-expanded", "true");
        folderToggle.setAttribute("aria-label", "Teczka sie otwiera.");

        window.setTimeout(() => {
            activeCardIndex = 0;
            updateFolderUi();
            unlockFolderLater(reduceMotion ? 0 : 260);
        }, revealDelay);
    };

    const dropCurrentCard = (onComplete) => {
        const currentCard = folderCards[activeCardIndex];

        if (!currentCard) {
            onComplete();
            return;
        }

        if (reduceMotion) {
            currentCard.classList.remove("is-active", "is-falling");
            onComplete();
            return;
        }

        currentCard.classList.add("is-falling");

        window.setTimeout(() => {
            currentCard.classList.remove("is-active", "is-falling");
            onComplete();
        }, 420);
    };

    const advanceFolder = () => {
        if (!folderStage || folderLocked) {
            return;
        }

        if (activeCardIndex < 0) {
            openFolder();
            return;
        }

        folderLocked = true;

        if (activeCardIndex >= lastCardIndex) {
            if (folderHint) {
                folderHint.textContent = "Ostatnia kartka opada i teczka wraca do poczatku.";
            }

            dropCurrentCard(() => {
                activeCardIndex = -1;
                updateFolderUi();
                unlockFolderLater(reduceMotion ? 0 : 260);
            });
            return;
        }

        const nextIndex = activeCardIndex + 1;
        const nextTitle = folderCards[nextIndex]?.querySelector("h3")?.textContent?.trim();

        if (folderHint) {
            folderHint.textContent = nextTitle
                ? `Kartka opada. Za chwile zobaczysz: ${nextTitle}.`
                : "Kartka opada. Za chwile zobaczysz kolejna.";
        }

        dropCurrentCard(() => {
            activeCardIndex = nextIndex;
            updateFolderUi();
            unlockFolderLater(reduceMotion ? 0 : 240);
        });
    };

    if (reduceMotion) {
        animatedNodes.forEach((node) => node.classList.add("is-visible"));
    } else {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                });
            },
            {
                threshold: 0.18,
                rootMargin: "0px 0px -8% 0px",
            }
        );

        animatedNodes.forEach((node) => observer.observe(node));
    }

    if (folderStage && folderToggle) {
        clearCardEffects();
        updateFolderUi();

        folderStage.addEventListener("click", () => {
            advanceFolder();
        });
    }

    if (reduceMotion) {
        return;
    }

    parallaxNodes.forEach((node) => {
        let frameId = null;

        const reset = () => {
            node.style.setProperty("--parallax-x", "0");
            node.style.setProperty("--parallax-y", "0");
        };

        const onMove = (event) => {
            const rect = node.getBoundingClientRect();
            const relativeX = (event.clientX - rect.left) / rect.width;
            const relativeY = (event.clientY - rect.top) / rect.height;
            const x = (relativeX - 0.5) * 2;
            const y = (relativeY - 0.5) * 2;

            if (frameId) {
                cancelAnimationFrame(frameId);
            }

            frameId = requestAnimationFrame(() => {
                node.style.setProperty("--parallax-x", x.toFixed(3));
                node.style.setProperty("--parallax-y", y.toFixed(3));
            });
        };

        reset();
        node.addEventListener("pointermove", onMove);
        node.addEventListener("pointerleave", reset);
    });
});
