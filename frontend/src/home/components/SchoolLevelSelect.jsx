import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const LEVELS = [
    {
        id: "podstawowa",
        title: "Podstawowa",
        subtitle: ["Szkoła podstawowa 1-8"],
    },
    {
        id: "srednia",
        title: "Średnia",
        subtitle: ["Szkoła średnia", "Liceum / Technikum"],
    },
    {
        id: "studia",
        title: "Studia",
        subtitle: ["Szkoła wyższa"],
    },
];

function BrandMark() {
    return (
        <div className="w-fit select-none">
            <div className="flex items-center gap-0.5 font-black text-black">
                <span className="text-[1.1rem] leading-none tracking-tight uppercase font-extrabold">
                    RENT
                    <br />
                    NERD
                </span>
                <span
                    className="text-[3.2rem] font-extrabold leading-none"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                    A
                </span>
            </div>
        </div>
    );
}

function StepIndicator() {
    return (
        <div className="flex flex-wrap items-center justify-center gap-2 text-center text-[clamp(0.85rem,1.2vw,1rem)] font-semibold text-[#3d2e44]">
            <span className="font-bold">Wybierz typ konta</span>
            <span className="text-[1.4rem] font-normal text-[#8a6492]">→</span>
            <span className="text-[#5a4862]">Uzupełnij profil</span>
            <span className="text-[1.4rem] font-normal text-[#8a6492]">→</span>
            <span className="text-[#5a4862]">Poznaj RENT A NERD</span>
        </div>
    );
}

function LevelCard({ active, card, onChoose, registerRef }) {
    const cardRef = useRef(null);

    useEffect(() => {
        registerRef(cardRef.current);
    }, [registerRef]);

    const handleMouseEnter = () => {
        if (!active) {
            gsap.to(cardRef.current, { y: -5, scale: 1.012, duration: 0.2, ease: "power2.out" });
        }
    };

    const handleMouseLeave = () => {
        if (!active) {
            gsap.to(cardRef.current, { y: 0, scale: 1, duration: 0.18, ease: "power2.out" });
        }
    };

    const handleChoose = () => {
        gsap.timeline()
            .to(cardRef.current, { scale: 0.97, duration: 0.08, ease: "power2.in" })
            .to(cardRef.current, { scale: 1.015, duration: 0.14, ease: "back.out(1.8)" })
            .to(cardRef.current, { scale: 1, duration: 0.1 });

        onChoose(card.id);
    };

    return (
        <article
            ref={cardRef}
            className="flex flex-col overflow-hidden rounded-[1.1rem]"
            style={{
                width: "210px",
                minHeight: "320px",
                background: "#cba8d8",
                border: "1px solid #ba8fcc",
                boxShadow: active
                    ? "0 12px 28px rgba(140, 80, 170, 0.28)"
                    : "0 6px 16px rgba(140, 80, 170, 0.15)",
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Header */}
            <div
                className="px-5 py-4 text-center text-white"
                style={{
                    background: active
                        ? "linear-gradient(135deg, #9e52b8 0%, #8f3fa8 100%)"
                        : "linear-gradient(135deg, #a85dbf 0%, #9849b2 100%)",
                    borderBottom: "1px solid #9e52b5",
                }}
            >
                <h2 className="text-[1.6rem] font-bold leading-none tracking-tight">{card.title}</h2>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col items-center px-5 pb-5 pt-4 text-center">
                <div className="text-[0.82rem] font-semibold italic leading-snug text-white/90">
                    {card.subtitle.map((line) => (
                        <div key={line}>{line}</div>
                    ))}
                </div>

                <div className="mt-auto w-full">
                    <button
                        className="w-full rounded-full px-4 py-2.5 text-[1rem] font-bold text-white transition-all duration-200 hover:brightness-110 hover:translate-y-[-1px]"
                        style={{
                            background: active
                                ? "linear-gradient(135deg, #9348b5 0%, #8437a6 100%)"
                                : "linear-gradient(135deg, #a050c2 0%, #9240b0 100%)",
                            boxShadow: "0 4px 12px rgba(140, 60, 180, 0.30)",
                        }}
                        type="button"
                        onClick={handleChoose}
                    >
                        Wybierz
                    </button>
                </div>
            </div>
        </article>
    );
}

export default function SchoolLevelSelect({ onNext, onSelect }) {
    const [selected, setSelected] = useState(null);
    const shellRef = useRef(null);
    const headingRef = useRef(null);
    const cardRefs = useRef([]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                headingRef.current,
                { opacity: 0, y: -18 },
                { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" },
            );

            gsap.fromTo(
                cardRefs.current.filter(Boolean),
                { opacity: 0, y: 30, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.46, stagger: 0.1, ease: "power3.out" },
            );
        }, shellRef);

        return () => ctx.revert();
    }, []);

    const handleChoose = (levelId) => {
        setSelected(levelId);
        onSelect?.(levelId);
        onNext?.(levelId);
    };

    return (
        <section
            ref={shellRef}
            className="relative min-h-screen overflow-hidden px-6 py-5 md:px-10"
            style={{
                /*
                 * Tło jak na zdjęciu:
                 * – duże białe "ćwiartki koła" w lewym-górnym i lewym-dolnym rogu
                 * – reszta: jednolity jasny fiolet
                 */
                background: [
                    "radial-gradient(ellipse 90% 75% at -5% 5%, #ffffff 0%, #ffffff 38%, transparent 38.5%)",
                    "radial-gradient(ellipse 80% 70% at 5% 105%, #ffffff 0%, #ffffff 36%, transparent 36.5%)",
                    "linear-gradient(135deg, #d8a8e8 0%, #cb98df 50%, #c290d8 100%)",
                ].join(", "),
            }}
        >
            <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[1100px] flex-col">
                {/* Logo */}
                <div className="pt-0">
                    <BrandMark />
                </div>

                {/* Heading area */}
                <div
                    ref={headingRef}
                    className="mx-auto mt-5 flex w-full max-w-[860px] flex-col items-center text-center"
                >
                    <StepIndicator />
                    <h1 className="mt-3 text-[clamp(2rem,3.6vw,3.4rem)] font-black tracking-[-0.04em] text-black">
                        Wybierz swoją szkołę
                    </h1>
                </div>

                {/* Cards */}
                <div className="mt-10 grid flex-1 place-items-center gap-6 md:mt-12 md:grid-cols-3 md:gap-12">
                    {LEVELS.map((level, index) => (
                        <LevelCard
                            key={level.id}
                            card={level}
                            active={selected === level.id}
                            onChoose={handleChoose}
                            registerRef={(element) => {
                                cardRefs.current[index] = element;
                            }}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
