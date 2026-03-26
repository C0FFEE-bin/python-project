import { useState } from "react";

const SCHOOL_LEVELS = [
    {
        id: "podstawowa",
        title: "Podstawowa",
        subtitle: "Szkola podstawowa 1-8",
    },
    {
        id: "srednia",
        title: "Srednia",
        subtitle: "Liceum lub technikum",
    },
    {
        id: "studia",
        title: "Studia",
        subtitle: "Szkola wyzsza",
    },
];

const STEPS = ["Wybierz typ konta", "Uzupelnij profil", "Poznaj RENT A NERD"];

function Stepper({ currentStep }) {
    return (
        <div className="flex flex-wrap items-center gap-2 text-sm">
            {STEPS.map((step, index) => (
                <span key={step} className="flex items-center gap-2">
                    <span
                        className={index === currentStep ? "font-bold text-gray-900" : "text-gray-400"}
                    >
                        {step}
                    </span>
                    {index < STEPS.length - 1 ? (
                        <span className="text-gray-300" aria-hidden="true">
                            -&gt;
                        </span>
                    ) : null}
                </span>
            ))}
        </div>
    );
}

export default function SchoolLevelSelect({
    onBack,
    onComplete,
    onSelect,
}) {
    const [selectedLevel, setSelectedLevel] = useState("");

    const handleSelect = (id) => {
        setSelectedLevel(id);
        onSelect?.(id);
    };

    const handleComplete = () => {
        if (!selectedLevel) {
            return;
        }

        onComplete?.(selectedLevel);
    };

    return (
        <section className="min-h-screen bg-[#f3e8f9] px-4 py-10 sm:px-6">
            <div className="mx-auto w-full max-w-4xl rounded-3xl border border-white/80 bg-white/92 p-6 shadow-[0_20px_55px_rgba(110,76,136,0.16)] sm:p-8">
                <div className="mb-5 flex items-center gap-2 font-black leading-none text-gray-900">
                    <span className="text-lg">
                        RENT
                        <br />
                        NERD
                    </span>
                    <span className="text-5xl">A</span>
                </div>

                <Stepper currentStep={1} />

                <h1 className="mt-6 text-3xl font-black text-gray-900">Wybierz swoja szkole</h1>

                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {SCHOOL_LEVELS.map((level) => {
                        const isSelected = selectedLevel === level.id;

                        return (
                            <button
                                key={level.id}
                                type="button"
                                onClick={() => handleSelect(level.id)}
                                className={[
                                    "rounded-2xl border px-4 py-5 text-left transition-all duration-200",
                                    isSelected
                                        ? "border-purple-400 bg-purple-100 shadow-[0_10px_30px_rgba(155,89,182,0.25)]"
                                        : "border-purple-100 bg-white hover:border-purple-200 hover:bg-purple-50",
                                ].join(" ")}
                            >
                                <div className="text-xl font-bold text-gray-900">{level.title}</div>
                                <div className="mt-2 text-sm text-purple-700">{level.subtitle}</div>
                                <div
                                    className={[
                                        "mt-5 inline-flex rounded-full px-4 py-2 text-xs font-bold",
                                        isSelected ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-700",
                                    ].join(" ")}
                                >
                                    Wybierz
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => onBack?.()}
                        className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                    >
                        Wroc
                    </button>
                    <button
                        type="button"
                        onClick={handleComplete}
                        disabled={!selectedLevel}
                        className={[
                            "rounded-full px-6 py-2.5 text-sm font-bold transition",
                            selectedLevel
                                ? "bg-purple-600 text-white hover:bg-purple-700"
                                : "cursor-not-allowed bg-gray-200 text-gray-500",
                        ].join(" ")}
                    >
                        Zakoncz
                    </button>
                </div>
            </div>
        </section>
    );
}
