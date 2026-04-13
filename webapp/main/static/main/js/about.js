document.addEventListener("DOMContentLoaded", () => {
    const animatedNodes = document.querySelectorAll("[data-animate]");
    const parallaxNodes = document.querySelectorAll(".js-parallax");
    const folderStage = document.querySelector(".js-folder-stage");
    const folderToggle = folderStage?.querySelector(".creator-folder");
    const folderHint = folderStage?.querySelector(".about-creators__hint");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canPreviewOnHover = !reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let folderOpen = false;
    let folderPreview = false;

    const getFolderHintText = () => {
        if (folderOpen) {
            return "Kliknij ponownie, aby schowac dokumenty do teczki.";
        }

        if (folderPreview) {
            return "Kliknij, aby rozlozyc dokumenty wokol teczki.";
        }

        return canPreviewOnHover
            ? "Najedz na teczke, aby wysunac dokumenty. Kliknij, aby rozlozyc je wokol teczki."
            : "Kliknij, aby rozlozyc dokumenty wokol teczki.";
    };

    const updateFolderUi = () => {
        if (!folderStage || !folderToggle) {
            return;
        }

        const hintText = getFolderHintText();

        folderStage.dataset.folderState = folderOpen ? "open" : folderPreview ? "preview" : "closed";
        folderStage.classList.toggle("is-open", folderOpen);
        folderStage.classList.toggle("is-preview", !folderOpen && folderPreview);
        folderToggle.setAttribute("aria-expanded", String(folderOpen));
        folderToggle.setAttribute("aria-label", hintText);

        if (folderHint) {
            folderHint.textContent = hintText;
        }
    };

    const setFolderPreview = (value) => {
        if (!folderStage || !folderToggle || !canPreviewOnHover || folderOpen) {
            return;
        }

        folderPreview = value;
        updateFolderUi();
    };

    const toggleFolder = () => {
        if (!folderStage || !folderToggle) {
            return;
        }

        folderOpen = !folderOpen;

        if (folderOpen) {
            folderPreview = false;
        } else if (canPreviewOnHover) {
            folderPreview = folderToggle.matches(":hover");
        }

        updateFolderUi();
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
        updateFolderUi();

        folderToggle.addEventListener("click", (event) => {
            event.preventDefault();
            toggleFolder();
        });

        if (canPreviewOnHover) {
            folderToggle.addEventListener("pointerenter", () => {
                setFolderPreview(true);
            });

            folderStage.addEventListener("pointerleave", () => {
                setFolderPreview(false);
            });

            folderToggle.addEventListener("focus", () => {
                setFolderPreview(true);
            });

            folderToggle.addEventListener("blur", () => {
                setFolderPreview(false);
            });
        }
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
