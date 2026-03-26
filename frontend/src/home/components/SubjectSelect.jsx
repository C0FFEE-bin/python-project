import { useEffect, useMemo, useState } from "react";

import StudentOnboardingFrame from "./StudentOnboardingFrame.jsx";
import "./SubjectSelect.css";

const SUBJECTS = [
    "Matematyka",
    "Jezyk Polski",
    "Jezyk Angielski",
    "Fizyka",
    "Chemia",
    "Biologia",
    "Informatyka",
    "Jezyk Niemiecki",
    "Jezyk Hiszpanski",
    "Jezyk Wloski",
    "Jezyk Francuski",
    "Inny",
];

const DEFAULT_SELECTED_SUBJECTS = [
    "Matematyka",
    "Jezyk Polski",
    "Jezyk Angielski",
];

export default function SubjectSelect({
    title = "Wybierz, twoje przedmioty:",
    availableTitle = "Dostepne przedmioty:",
    initialSubjects = DEFAULT_SELECTED_SUBJECTS,
    nextLabel = "Zakoncz",
    currentStep = 1,
    steps,
    onBack,
    onConfirm,
    onNext,
}) {
    const [selectedSubjects, setSelectedSubjects] = useState(() =>
        initialSubjects.length ? [...initialSubjects] : [...DEFAULT_SELECTED_SUBJECTS],
    );

    useEffect(() => {
        if (!Array.isArray(initialSubjects)) {
            return;
        }

        if (initialSubjects.length) {
            setSelectedSubjects([...initialSubjects]);
            return;
        }

        setSelectedSubjects([...DEFAULT_SELECTED_SUBJECTS]);
    }, [initialSubjects]);

    const availableSubjects = useMemo(
        () => SUBJECTS.filter((subject) => !selectedSubjects.includes(subject)),
        [selectedSubjects],
    );

    const addSubject = (subject) => {
        setSelectedSubjects((current) => (current.includes(subject) ? current : [...current, subject]));
    };

    const removeSubject = (subject) => {
        setSelectedSubjects((current) => current.filter((item) => item !== subject));
    };

    const handleComplete = () => {
        onConfirm?.(selectedSubjects);
        onNext?.(selectedSubjects);
    };

    return (
        <StudentOnboardingFrame currentStep={currentStep} steps={steps}>
            <div className="student-subject-step student-flow-card">
                <h1>{title}</h1>

                <div className="student-subject-step__selected">
                    {selectedSubjects.map((subject) => (
                        <button
                            key={subject}
                            type="button"
                            className="student-chip is-selected"
                            onClick={() => removeSubject(subject)}
                        >
                            {subject}
                            <span>x</span>
                        </button>
                    ))}
                </div>

                <h2>{availableTitle}</h2>
                <div className="student-subject-step__available">
                    {availableSubjects.map((subject) => (
                        <button
                            key={subject}
                            type="button"
                            className="student-chip"
                            onClick={() => addSubject(subject)}
                        >
                            {subject}
                        </button>
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
                        onClick={handleComplete}
                        disabled={!selectedSubjects.length}
                    >
                        {nextLabel}
                    </button>
                </div>
            </div>
        </StudentOnboardingFrame>
    );
}
