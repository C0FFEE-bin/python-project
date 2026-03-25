function isElement(target) {
    return Boolean(target && typeof target === "object" && target.nodeType === 1);
}

function toElements(targets) {
    if (!targets) {
        return [];
    }

    if (Array.isArray(targets)) {
        return targets.filter(isElement);
    }

    if (typeof targets.length === "number" && !isElement(targets)) {
        return Array.from(targets).filter(isElement);
    }

    return isElement(targets) ? [targets] : [];
}

function toMilliseconds(value) {
    return typeof value === "number" ? value * 1000 : 0;
}

function toEase(ease) {
    switch (ease) {
        case "power2.out":
            return "cubic-bezier(0.22, 1, 0.36, 1)";
        default:
            if (typeof ease === "string" && ease.startsWith("back.out")) {
                return "cubic-bezier(0.34, 1.56, 0.64, 1)";
            }

            return "ease-out";
    }
}

function getStaggerOffset(stagger, index, total) {
    if (!stagger) {
        return 0;
    }

    if (typeof stagger === "number") {
        return toMilliseconds(stagger) * index;
    }

    if (typeof stagger === "object" && typeof stagger.amount === "number" && total > 1) {
        return (toMilliseconds(stagger.amount) / (total - 1)) * index;
    }

    return 0;
}

function getTransform(vars, fallback = "") {
    const parts = [];

    if (typeof vars?.y === "number") {
        parts.push(`translateY(${vars.y}px)`);
    }

    if (typeof vars?.scale === "number") {
        parts.push(`scale(${vars.scale})`);
    }

    return parts.length ? parts.join(" ") : fallback;
}

function buildCurrentFrame(element, vars) {
    const computedStyle = window.getComputedStyle(element);
    const frame = {};

    if (typeof vars?.opacity === "number") {
        frame.opacity = computedStyle.opacity;
    }

    if (typeof vars?.scale === "number" || typeof vars?.y === "number") {
        frame.transform = computedStyle.transform === "none" ? "" : computedStyle.transform;
    }

    return frame;
}

function buildTargetFrame(element, vars) {
    const frame = {};

    if (typeof vars?.opacity === "number") {
        frame.opacity = `${vars.opacity}`;
    }

    if (typeof vars?.scale === "number" || typeof vars?.y === "number") {
        frame.transform = getTransform(vars, element.style.transform);
    }

    return frame;
}

function applyVars(element, vars) {
    if (typeof vars?.opacity === "number") {
        element.style.opacity = `${vars.opacity}`;
    }

    if (typeof vars?.scale === "number" || typeof vars?.y === "number") {
        element.style.transform = getTransform(vars, element.style.transform);
    }
}

function animate(targets, vars, options = {}) {
    const elements = toElements(targets);
    const duration = Math.max(0, toMilliseconds(vars?.duration));
    const delay = Math.max(0, toMilliseconds(vars?.delay) + (options.offsetMs || 0));
    const easing = toEase(vars?.ease);

    elements.forEach((element, index) => {
        const startFrame = options.fromVars
            ? buildTargetFrame(element, options.fromVars)
            : buildCurrentFrame(element, vars);
        const targetFrame = buildTargetFrame(element, vars);
        const totalDelay = delay + getStaggerOffset(vars?.stagger, index, elements.length);

        if (options.fromVars) {
            applyVars(element, options.fromVars);
        }

        const run = () => {
            if (typeof element.animate === "function" && duration > 0) {
                const animation = element.animate([startFrame, targetFrame], {
                    duration,
                    easing,
                    fill: "forwards",
                });

                animation.onfinish = () => applyVars(element, vars);
                return;
            }

            applyVars(element, vars);
        };

        if (totalDelay > 0) {
            window.setTimeout(run, totalDelay);
            return;
        }

        run();
    });

    return {
        kill() {},
        revert() {},
    };
}

export const gsap = {
    context(callback) {
        callback?.();

        return {
            revert() {},
        };
    },
    fromTo(targets, fromVars, toVars) {
        return animate(targets, toVars, { fromVars });
    },
    timeline() {
        let offsetMs = 0;

        return {
            to(targets, vars) {
                animate(targets, vars, { offsetMs });
                offsetMs += toMilliseconds(vars?.delay) + toMilliseconds(vars?.duration);
                return this;
            },
        };
    },
    to(targets, vars) {
        return animate(targets, vars);
    },
};
