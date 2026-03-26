import { useEffect, useState } from "react";

import StudentOnboardingFrame from "./StudentOnboardingFrame.jsx";
import "./SchoolLevelSelect.css";

const LEVELS = [
    {
        id: "podstawowa",
        title: "Podstawowa",
        imageSrc: "/static/main/img/primary.png",
    },
    {
        id: "srednia",
        title: "Srednia",
        imageSrc: "/static/main/img/high.png",
    },
    {
        id: "studia",
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
        >
            <header>
                <h2>{level.title}</h2>
            </header>

            <div className="student-level-card__body">
                <img src={level.imageSrc} alt={level.title} />
                <span>Wybierz</span>
            </div>
        </button>
    );
}

export default function SchoolLevelSelect({
    title = "Wybierz twoj poziom edukacji",
    initialLevel = "",
    nextLabel = "Dalej",
    currentStep = 1,
    steps,
    onBack,
    onComplete,
    onSelect,
}) {
    const [selectedLevel, setSelectedLevel] = useState(initialLevel);

    useEffect(() => {
        setSelectedLevel(initialLevel || "");
    }, [initialLevel]);

    const handleSelect = (levelId) => {
        setSelectedLevel(levelId);
        onSelect?.(levelId);
    };

    return (
        <StudentOnboardingFrame currentStep={currentStep} steps={steps}>
            <div className="student-level-step student-flow-card">
                <h1>{title}</h1>

                <div className="student-level-step__grid">
                    {LEVELS.map((level) => (
                        <LevelCard
                            key={level.id}
                            level={level}
                            isSelected={selectedLevel === level.id}
                            onClick={() => handleSelect(level.id)}
                        />
                    ))}
                </div>

                <div className="student-flow-actions">
                    <button
                        type="button"
                        className="student-flow-button is-secondary"
                        onClick={onBack}
                    >
                        Wroć
                    </button>
                    <button
                        type="button"
                        className="student-flow-button is-primary"
                        onClick={() => selectedLevel && onComplete?.(selectedLevel)}
                        disabled={!selectedLevel}
                    >
                        {nextLabel}
                    </button>
                </div>
            </div>
        </StudentOnboardingFrame>
    );
}
