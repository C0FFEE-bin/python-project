import { useState } from "react";

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

function TypeCard({ description, isSelected, onClick, title, variant }) {
    const isStudent = variant === "student";
    const cardTone = isStudent
        ? isSelected
            ? "bg-purple-500 text-white shadow-purple-200"
            : "bg-purple-100 text-purple-700 hover:bg-purple-200"
        : isSelected
            ? "bg-gray-800 text-white shadow-gray-300"
            : "bg-gray-200 text-gray-800 hover:bg-gray-300";

    const subtitleTone = isStudent
        ? isSelected
            ? "text-purple-100"
            : "text-purple-700"
        : isSelected
            ? "text-gray-200"
            : "text-gray-700";

    const buttonTone = isStudent
        ? isSelected
            ? "bg-purple-400 text-white"
            : "bg-purple-500 text-white"
        : isSelected
            ? "bg-gray-600 text-white"
            : "bg-gray-800 text-white";

    return (
        <button
            type="button"
            onClick={onClick}
            className={`group flex flex-col rounded-2xl p-6 text-left transition-all duration-200 ${cardTone} shadow-lg`}
        >
            <h2 className="text-center text-3xl font-bold">{title}</h2>
            <p className={`mt-4 min-h-16 text-center text-lg font-semibold italic ${subtitleTone}`}>
                {description}
            </p>

            <div className="mt-6 flex min-h-44 items-center justify-center rounded-2xl border border-white/25 bg-white/20 px-6 py-4">
                <div className="h-32 w-32 rounded-full bg-white/40" />
            </div>

            <div className={`mt-8 w-full rounded-full py-3 text-center text-sm font-bold ${buttonTone}`}>
                Wybierz
            </div>
        </button>
    );
}

export default function AccountTypeSelect({ onSelect }) {
    const [selectedType, setSelectedType] = useState("");

    const handleSelect = (type) => {
        setSelectedType(type);
        onSelect?.(type);
    };

    return (
        <section className="min-h-screen bg-[#f4e7fa] px-4 py-10 text-gray-900 sm:px-6">
            <div className="mx-auto w-full max-w-5xl rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_20px_55px_rgba(110,76,136,0.18)] sm:p-8">
                <div className="mb-5 flex items-center gap-2 font-black leading-none">
                    <span className="text-lg">
                        RENT
                        <br />
                        NERD
                    </span>
                    <span className="text-5xl">A</span>
                </div>

                <Stepper currentStep={0} />

                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <TypeCard
                        title="Uczen"
                        description="Poszukuje pomocy w nauce z przedmiotow szkolnych."
                        variant="student"
                        isSelected={selectedType === "uczen"}
                        onClick={() => handleSelect("uczen")}
                    />
                    <TypeCard
                        title="Korepetytor"
                        description="Zamierzam udzielac pomocy innym uczniom."
                        variant="tutor"
                        isSelected={selectedType === "korepetytor"}
                        onClick={() => handleSelect("korepetytor")}
                    />
                </div>
            </div>
        </section>
    );
}
