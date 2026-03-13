import { useEffect, useId, useState } from "react";

import joinClasses from "../utils/joinClasses.js";

export default function Reveal({ as: Component = "div", className = "", children, ...props }) {
    const generatedId = useId().replace(/:/g, "");
    const revealId = props.id ?? generatedId;
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = document.getElementById(revealId);

        if (!element) {
            return undefined;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                setIsVisible(true);
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.18,
        });

        observer.observe(element);

        return () => observer.disconnect();
    }, [revealId]);

    return (
        <Component
            {...props}
            id={revealId}
            className={joinClasses(className, isVisible && "is-visible")}
            data-reveal=""
        >
            {children}
        </Component>
    );
}
