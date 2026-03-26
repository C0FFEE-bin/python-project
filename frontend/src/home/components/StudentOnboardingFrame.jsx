import { useEffect, useRef } from "react";

import { gsap } from "../utils/gsap-lite.js";
import "./StudentOnboardingFrame.css";

const STEPS = ["Wybierz typ konta", "Uzupelnij profil", "Poznaj RENT A NERD"];

export default function StudentOnboardingFrame({ children, currentStep = 1, steps = STEPS }) {
    const viewRef = useRef(null);
    const logoRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                viewRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.3, ease: "power2.out" },
            );

            gsap.fromTo(
                logoRef.current,
                { opacity: 0, y: -16 },
                { opacity: 1, y: 0, duration: 0.36, ease: "power2.out" },
            );

            gsap.fromTo(
                panelRef.current,
                { opacity: 0, y: 18, scale: 0.985 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.42,
                    delay: 0.06,
                    ease: "power2.out",
                },
            );
        });

        return () => ctx.revert();
    }, []);

    return (
        <section ref={viewRef} className="student-flow-view">
            <div className="student-flow-shape student-flow-shape--top" aria-hidden="true" />
            <div className="student-flow-shape student-flow-shape--bottom" aria-hidden="true" />

            <div className="student-flow-shell">
                <div ref={logoRef} className="student-flow-logo" aria-label="Rent Nerd">
                    <span>
                        RENT
                        <br />
                        NERD
                    </span>
                    <strong>A</strong>
                </div>

                <div ref={panelRef} className="student-flow-panel">
                    <div className="student-flow-stepper" aria-label="Postep onboardingu">
                        {steps.map((step, index) => (
                            <span key={step} className="student-flow-stepper__item">
                                <span
                                    className={[
                                        "student-flow-stepper__label",
                                        index === currentStep ? "is-current" : "",
                                    ].join(" ")}
                                >
                                    {step}
                                </span>
                                {index < steps.length - 1 ? (
                                    <span className="student-flow-stepper__arrow" aria-hidden="true">
                                        -&gt;
                                    </span>
                                ) : null}
                            </span>
                        ))}
                    </div>

                    {children}
                </div>
            </div>
        </section>
    );
}
