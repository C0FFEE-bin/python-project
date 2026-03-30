import { useEffect, useState } from "react";

import StudentOnboardingFrame from "./StudentOnboardingFrame.jsx";
import "./SchoolLevelSelect.css";

const EMPTY_LEVELS = [];
const LEVELS = [
    {
        id: "podstawowa",
        value: "Podstawowka",
        title: "Podstawowka",
        imageSrc: "/static/main/img/primary.png",
    },
    {
        id: "srednia",
        value: "Szkola srednia",
        title: "Szkola srednia",
        imageSrc: "/static/main/img/high.png",
    },
    {
        id: "studia",
        value: "Studia",
        title: "Studia",
        imageSrc: "/static/main/img/university.png",
    },
];

function LevelCard({ isSelected, level, onClick }) {
    return (
        <button
            type="button"
            className={["student-level-card", isSelected ? "is-selected" : ""].join(" ")}
            onClick={onClick}
            aria-pressed={isSelected}
        >
            <header>
                <h2>{level.title}</h2>
            </header>

            <div className="student-level-card__body">
                <img src={level.imageSrc} alt={level.title} />
                <span>{isSelected ? "Wybrane" : "Wybierz"}</span>
            </div>
        </button>
    );
}

function normalizeLevels(levels) {
    if (!Array.isArray(levels)) {
        return [];
    }

    const normalizedLevels = [];

    levels.forEach((level) => {
        if (typeof level !== "string") {
            return;
        }

        const trimmedLevel = level.trim();
        if (!trimmedLevel || normalizedLevels.includes(trimmedLevel)) {
            return;
        }

        normalizedLevels.push(trimmedLevel);
    });

    return normalizedLevels;
}

export default function SchoolLevelSelect({
    title = "Wybierz twoj poziom edukacji",
    allowMultiple = false,
    initialLevel = "",
    initialLevels = EMPTY_LEVELS,
    nextLabel = "Dalej",
    currentStep = 1,
    steps,
    onBack,
    onComplete,
    onSelect,
}) {
    const [selectedLevel, setSelectedLevel] = useState(initialLevel);
    const [selectedLevels, setSelectedLevels] = useState(() => normalizeLevels(initialLevels));

    useEffect(() => {
        if (allowMultiple) {
            setSelectedLevels(normalizeLevels(initialLevels));
            return;
        }

        setSelectedLevel(initialLevel || "");
    }, [allowMultiple, initialLevel, initialLevels]);

    const handleSelect = (levelId) => {
        if (allowMultiple) {
            setSelectedLevels((currentLevels) => {
                const nextLevels = currentLevels.includes(levelId)
                    ? currentLevels.filter((currentLevel) => currentLevel !== levelId)
                    : [...currentLevels, levelId];

                onSelect?.(nextLevels);
                return nextLevels;
            });
            return;
        }

        setSelectedLevel(levelId);
        onSelect?.(levelId);
    };

    const hasSelection = allowMultiple ? selectedLevels.length > 0 : Boolean(selectedLevel);

    return (
        <StudentOnboardingFrame currentStep={currentStep} steps={steps}>
            <div className="student-level-step student-flow-card">
                <h1>{title}</h1>

                <div className="student-level-step__grid">
                    {LEVELS.map((level) => (
                        <LevelCard
                            key={level.id}
                            level={level}
                            isSelected={allowMultiple ? selectedLevels.includes(level.value) : selectedLevel === level.value}
                            onClick={() => handleSelect(level.value)}
                        />
                    ))}
                </div>

                <div className="student-flow-actions">
                    <button
                        type="button"
                        className="student-flow-button is-secondary"
                        onClick={onBack}
                    >
                        Wroc
                    </button>
                    <button
                        type="button"
                        className="student-flow-button is-primary"
                        onClick={() => {
                            if (!hasSelection) {
                                return;
                            }

                            onComplete?.(allowMultiple ? selectedLevels : selectedLevel);
                        }}
                        disabled={!hasSelection}
                    >
                        {nextLabel}
                    </button>
                </div>
            </div>
        </StudentOnboardingFrame>
    );
}
