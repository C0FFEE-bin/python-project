import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const CATEGORIES = [
    {
        id: "podstawowy",
        label: "Podstawowy",
        subjects: [
            { id: "mat-p", label: "Matematyka", emoji: "📐" },
            { id: "pol-p", label: "Polski", emoji: "📝" },
            { id: "ang-p", label: "Angielski", emoji: "🇬🇧" },
            { id: "bio-p", label: "Biologia", emoji: "🌿" },
            { id: "che-p", label: "Chemia", emoji: "⚗️" },
            { id: "geo-p", label: "Geografia", emoji: "🌍" },
            { id: "his-p", label: "Historia", emoji: "📜" },
            { id: "wos-p", label: "WOS", emoji: "🏛️" },
            { id: "muz-p", label: "Muzyka", emoji: "🎵" },
            { id: "pla-p", label: "Plastyka", emoji: "🎨" },
        ],
    },
    {
        id: "rozszerzony",
        label: "Rozszerzony",
        subjects: [
            { id: "mat-r", label: "Matematyka", emoji: "📐" },
            { id: "fiz-r", label: "Fizyka", emoji: "⚡" },
            { id: "inf-r", label: "Informatyka", emoji: "💻" },
            { id: "ang-r", label: "Angielski", emoji: "🇬🇧" },
            { id: "che-r", label: "Chemia", emoji: "⚗️" },
            { id: "bio-r", label: "Biologia", emoji: "🌿" },
            { id: "pol-r", label: "Polski", emoji: "📝" },
            { id: "his-r", label: "Historia", emoji: "📜" },
            { id: "geo-r", label: "Geografia", emoji: "🌍" },
        ],
    },
];

function Chip({ onToggle, selected, subject }) {
    const chipRef = useRef(null);

    const handleClick = () => {
        gsap.timeline()
            .to(chipRef.current, { scale: 0.88, duration: 0.08, ease: "power2.in" })
            .to(chipRef.current, { scale: 1.06, duration: 0.15, ease: "elastic.out(2, 0.5)" })
            .to(chipRef.current, { scale: 1, duration: 0.1 });

        onToggle();
    };

    const handleMouseEnter = () => {
        if (!selected) {
            gsap.to(chipRef.current, { scale: 1.05, duration: 0.18, ease: "power2.out" });
        }
    };

    const handleMouseLeave = () => {
        gsap.to(chipRef.current, { scale: 1, duration: 0.15, ease: "power2.out" });
    };

    return (
        <button
            ref={chipRef}
            className={[
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold outline-none transition-all duration-200",
                "focus-visible:ring-2 focus-visible:ring-purple-400",
                selected
                    ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-700",
            ].join(" ")}
            type="button"
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <span className="text-base leading-none">{subject.emoji}</span>
            <span>{subject.label}</span>
            {selected ? (
                <span className="ml-0.5 text-xs leading-none text-purple-200">x</span>
            ) : null}
        </button>
    );
}

export default function SubjectSelect({ onConfirm, onNext }) {
    const [selected, setSelected] = useState(new Set());
    const containerRef = useRef(null);
    const titleRef = useRef(null);
    const btnRef = useRef(null);
    const categoriesRef = useRef(null);

    const toggle = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    };

    useEffect(() => {
        const ctx = gsap.context(() => {
            const chips = categoriesRef.current?.querySelectorAll("[data-chip]");
            const headers = categoriesRef.current?.querySelectorAll("[data-category-header]");

            gsap.fromTo(
                titleRef.current,
                { opacity: 0, y: -20 },
                { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" },
            );

            if (headers?.length) {
                gsap.fromTo(
                    Array.from(headers),
                    { opacity: 0, y: 12 },
                    { opacity: 1, y: 0, duration: 0.35, stagger: 0.12, ease: "power2.out" },
                );
            }

            if (chips?.length) {
                gsap.fromTo(
                    Array.from(chips),
                    { opacity: 0, y: 20, scale: 0.85 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.035, ease: "power3.out" },
                );
            }

            gsap.fromTo(
                btnRef.current,
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const handleBtnEnter = () => {
        if (selected.size > 0) {
            gsap.to(btnRef.current, { scale: 1.03, duration: 0.2, ease: "power2.out" });
        }
    };

    const handleBtnLeave = () => {
        gsap.to(btnRef.current, { scale: 1, duration: 0.18, ease: "power2.out" });
    };

    const selectedLabels = CATEGORIES.flatMap((category) =>
        category.subjects
            .filter((subject) => selected.has(subject.id))
            .map((subject) => subject.label),
    );

    const getCountLabel = (count) => {
        if (count === 1) {
            return "przedmiot";
        }

        if (count < 5) {
            return "przedmioty";
        }

        return "przedmiotow";
    };

    const handleConfirm = () => {
        if (!selected.size) {
            return;
        }

        const payload = Array.from(selected);
        onConfirm?.(payload);
        onNext?.(payload);
    };

    return (
        <div
            ref={containerRef}
            className="relative min-h-screen w-full bg-gradient-to-br from-purple-50 via-fuchsia-50 to-white p-6"
        >
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -right-40 -top-40 h-[550px] w-[550px] rounded-full bg-purple-200/40 blur-3xl" />
                <div className="absolute -bottom-28 -left-28 h-[420px] w-[420px] rounded-full bg-violet-200/25 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto flex w-full max-w-[600px] flex-col gap-7">
                <div ref={titleRef} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                        <span className="font-semibold text-purple-500">Wybierz typ konta</span>
                        <span>-&gt;</span>
                        <span className="font-bold text-purple-600 underline underline-offset-2">
                            Uzupelnij profil
                        </span>
                        <span>-&gt;</span>
                        <span>Poznaj RENT A NERD</span>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                                Wybierz przedmioty
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Mozesz wybrac wiecej niz jeden.
                            </p>
                        </div>

                        <div
                            className={[
                                "flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-300",
                                selected.size > 0
                                    ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-md"
                                    : "bg-gray-100 text-gray-400",
                            ].join(" ")}
                        >
                            <span>{selected.size}</span>
                            <span>{getCountLabel(selected.size)}</span>
                        </div>
                    </div>
                </div>

                <div
                    ref={categoriesRef}
                    className="flex flex-col gap-7 rounded-3xl bg-white p-6 shadow-xl"
                >
                    {CATEGORIES.map((category) => (
                        <div key={category.id} className="flex flex-col gap-3">
                            <div data-category-header className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-500" />
                                <span className="text-xs font-bold uppercase tracking-widest text-purple-500">
                                    {category.label}
                                </span>
                                <div className="h-px flex-1 bg-gradient-to-r from-purple-100 to-transparent" />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {category.subjects.map((subject) => (
                                    <div key={subject.id} data-chip>
                                        <Chip
                                            subject={subject}
                                            selected={selected.has(subject.id)}
                                            onToggle={() => toggle(subject.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {selectedLabels.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 px-1">
                        <span className="shrink-0 text-xs font-medium text-gray-400">Wybrano:</span>
                        {selectedLabels.slice(0, 5).map((label, index) => (
                            <span
                                key={`${label}-${index}`}
                                className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-600"
                            >
                                {label}
                            </span>
                        ))}
                        {selectedLabels.length > 5 ? (
                            <span className="text-xs text-gray-400">
                                +{selectedLabels.length - 5} wiecej
                            </span>
                        ) : null}
                    </div>
                ) : null}

                <button
                    ref={btnRef}
                    className={[
                        "w-full rounded-2xl py-4 text-base font-bold tracking-wide outline-none transition-all duration-300",
                        "focus-visible:ring-4 focus-visible:ring-purple-400",
                        selected.size > 0
                            ? "cursor-pointer bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-xl"
                            : "cursor-not-allowed bg-gray-100 text-gray-400",
                    ].join(" ")}
                    disabled={selected.size === 0}
                    type="button"
                    onClick={handleConfirm}
                    onMouseEnter={handleBtnEnter}
                    onMouseLeave={handleBtnLeave}
                >
                    {selected.size > 0
                        ? `Dalej (${selected.size} ${getCountLabel(selected.size)}) ->`
                        : "Wybierz co najmniej jeden przedmiot"}
                </button>
            </div>
        </div>
    );
}
