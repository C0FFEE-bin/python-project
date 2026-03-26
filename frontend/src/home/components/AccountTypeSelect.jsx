import { useEffect, useRef, useState } from "react";

import "./AccountTypeSelect.css";
import { gsap } from "../utils/gsap-lite.js";

const STEPS = ["Wybierz typ konta", "Uzupelnij profil", "Poznaj RENT A NERD"];

const ACCOUNT_OPTIONS = [
    {
        id: "uczen",
        title: "Uczen",
        description: "Poszukuje pomocy w nauce z przedmiotow szkolnych.",
        imageSrc: "/static/main/img/auth_kids_scene.png",
    },
    {
        id: "korepetytor",
        title: "Korepetytor",
        description: "Zamierzam udzielac pomocy innym uczniom.",
        imageSrc: "/static/main/img/mentor_scene.png",
    },
];

function Stepper({ stepperRef }) {
    return (
        <div ref={stepperRef} className="account-type-stepper" aria-label="Postep onboardingu">
            {STEPS.map((step, index) => (
                <span key={step} className="account-type-stepper__item">
                    <span
                        className={[
                            "account-type-stepper__label",
                            index === 0 ? "is-current" : "",
                        ].join(" ")}
                    >
                        {step}
                    </span>
                    {index < STEPS.length - 1 ? (
                        <span className="account-type-stepper__arrow" aria-hidden="true">
                            -&gt;
                        </span>
                    ) : null}
                </span>
            ))}
        </div>
    );
}

function OptionCard({ isSelected, onChoose, onSelectPreview, option }) {
    const isStudent = option.id === "uczen";
    const cardRef = useRef(null);
    const buttonRef = useRef(null);

    const handleSelectPreview = () => {
        gsap.timeline()
            .to(cardRef.current, { scale: 0.985, duration: 0.08, ease: "power2.out" })
            .to(cardRef.current, { scale: 1.015, duration: 0.14, ease: "back.out(1.7)" })
            .to(cardRef.current, { scale: 1, duration: 0.1, ease: "power2.out" });
        onSelectPreview();
    };

    const handleChoose = (event) => {
        event.stopPropagation();
        gsap.timeline()
            .to(buttonRef.current, { scale: 0.95, duration: 0.08, ease: "power2.out" })
            .to(buttonRef.current, { scale: 1.04, duration: 0.14, ease: "back.out(1.7)" })
            .to(buttonRef.current, { scale: 1, duration: 0.08, ease: "power2.out" });
        onChoose();
    };

    return (
        <article
            ref={cardRef}
            data-account-card={option.id}
            className={[
                "account-type-card",
                isStudent ? "is-student" : "is-tutor",
                isSelected ? "is-selected" : "",
            ].join(" ")}
            onClick={handleSelectPreview}
            onMouseEnter={() => gsap.to(cardRef.current, { scale: 1.01, duration: 0.2, ease: "power2.out" })}
            onMouseLeave={() => gsap.to(cardRef.current, { scale: 1, duration: 0.2, ease: "power2.out" })}
        >
            <header className="account-type-card__header">
                <h2>{option.title}</h2>
            </header>

            <div className="account-type-card__body">
                <p>{option.description}</p>

                <div className="account-type-card__image-wrap">
                    <img src={option.imageSrc} alt={option.title} />
                </div>

                <button
                    ref={buttonRef}
                    type="button"
                    className="account-type-card__choose"
                    onClick={handleChoose}
                >
                    Wybierz
                </button>
            </div>
        </article>
    );
}

export default function AccountTypeSelect({ onSelect }) {
    const [selectedType, setSelectedType] = useState("uczen");
    const viewRef = useRef(null);
    const logoRef = useRef(null);
    const stepperRef = useRef(null);
    const gridRef = useRef(null);
    const hasAnimatedSelection = useRef(false);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const cards = gridRef.current?.querySelectorAll("[data-account-card]");

            gsap.fromTo(
                viewRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.35, ease: "power2.out" },
            );

            gsap.fromTo(
                logoRef.current,
                { opacity: 0, y: -18 },
                { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" },
            );

            gsap.fromTo(
                stepperRef.current,
                { opacity: 0, y: -12 },
                { opacity: 1, y: 0, duration: 0.4, delay: 0.08, ease: "power2.out" },
            );

            if (cards?.length) {
                gsap.fromTo(
                    cards,
                    { opacity: 0, y: 24, scale: 0.96 },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        duration: 0.45,
                        delay: 0.12,
                        stagger: 0.09,
                        ease: "power2.out",
                    },
                );
            }
        });

        return () => ctx.revert();
    }, []);

    useEffect(() => {
        if (!hasAnimatedSelection.current) {
            hasAnimatedSelection.current = true;
            return;
        }

        const selectedCard = gridRef.current?.querySelector(`[data-account-card="${selectedType}"]`);
        if (!selectedCard) {
            return;
        }

        gsap.timeline()
            .to(selectedCard, { scale: 0.985, duration: 0.08, ease: "power2.out" })
            .to(selectedCard, { scale: 1.02, duration: 0.14, ease: "back.out(1.7)" })
            .to(selectedCard, { scale: 1, duration: 0.1, ease: "power2.out" });
    }, [selectedType]);

    return (
        <section ref={viewRef} className="account-type-view">
            <div className="account-type-shape account-type-shape--top" aria-hidden="true" />
            <div className="account-type-shape account-type-shape--bottom" aria-hidden="true" />

            <div className="account-type-shell">
                <div ref={logoRef} className="account-type-logo" aria-label="Rent Nerd">
                    <span>
                        RENT
                        <br />
                        NERD
                    </span>
                    <strong>A</strong>
                </div>

                <div className="account-type-panel">
                    <Stepper stepperRef={stepperRef} />

                    <div ref={gridRef} className="account-type-grid">
                        {ACCOUNT_OPTIONS.map((option) => (
                            <OptionCard
                                key={option.id}
                                option={option}
                                isSelected={selectedType === option.id}
                                onSelectPreview={() => setSelectedType(option.id)}
                                onChoose={() => {
                                    setSelectedType(option.id);
                                    onSelect?.(option.id);
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
