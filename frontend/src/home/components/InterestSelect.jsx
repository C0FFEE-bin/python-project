import { useEffect, useMemo, useState } from "react";

import StudentOnboardingFrame from "./StudentOnboardingFrame.jsx";
import "./InterestSelect.css";

const INTERESTS = [
    "Malarstwo",
    "Muzyka",
    "Programowanie",
    "Sport",
    "Konie",
    "Streetwear",
    "Bycie sigiemka",
    "Jezyk Niemiecki",
];

const DEFAULT_SELECTED_INTERESTS = [
    "Malarstwo",
    "Muzyka",
    "Programowanie",
];

export default function InterestSelect({
    title = 'Uzupelnij "o mnie":',
    introLines = ["Czesc!", "Milo mi Cie tutaj widziec :)"],
    initialIntroText = "",
    introPlaceholder = "Wpisz kilka slow o sobie...",
    selectedTitle = "Wybierz twoje zainteresowania",
    availableTitle = "Dostepne zainteresowania:",
    initialInterests = DEFAULT_SELECTED_INTERESTS,
    nextLabel = "Dalej",
    currentStep = 1,
    steps,
    onBack,
    onConfirm,
    onNext,
}) {
    const defaultIntroText = useMemo(
        () => (
            typeof initialIntroText === "string" && initialIntroText.length
                ? initialIntroText
                : (Array.isArray(introLines) ? introLines.join("\n") : "")
        ),
        [initialIntroText, introLines],
    );
    const [introText, setIntroText] = useState(defaultIntroText);
    const [selectedInterests, setSelectedInterests] = useState(() =>
        initialInterests.length ? [...initialInterests] : [...DEFAULT_SELECTED_INTERESTS],
    );

    useEffect(() => {
        setIntroText(defaultIntroText);
    }, [defaultIntroText]);

    useEffect(() => {
        if (!Array.isArray(initialInterests)) {
            return;
        }

        if (initialInterests.length) {
            setSelectedInterests([...initialInterests]);
            return;
        }

        setSelectedInterests([...DEFAULT_SELECTED_INTERESTS]);
    }, [initialInterests]);

    const availableInterests = useMemo(
        () => INTERESTS.filter((interest) => !selectedInterests.includes(interest)),
        [selectedInterests],
    );

    const addInterest = (interest) => {
        setSelectedInterests((current) =>
            current.includes(interest) ? current : [...current, interest],
        );
    };

    const removeInterest = (interest) => {
        setSelectedInterests((current) => current.filter((item) => item !== interest));
    };

    const handleComplete = () => {
        onConfirm?.(selectedInterests, introText);
        onNext?.(selectedInterests, introText);
    };

    return (
        <StudentOnboardingFrame currentStep={currentStep} steps={steps}>
            <div className="interest-step student-flow-card">
                <h1>{title}</h1>
                <textarea
                    className="interest-step__intro"
                    value={introText}
                    onChange={(event) => setIntroText(event.target.value)}
                    placeholder={introPlaceholder}
                    rows={3}
                />

                <h2>{selectedTitle}</h2>
                <div className="interest-step__selected">
                    {selectedInterests.map((interest) => (
                        <button
                            key={interest}
                            type="button"
                            className="interest-chip is-selected"
                            onClick={() => removeInterest(interest)}
                        >
                            {interest}
                            <span>x</span>
                        </button>
                    ))}
                </div>

                <h3>{availableTitle}</h3>
                <div className="interest-step__available">
                    {availableInterests.map((interest) => (
                        <button
                            key={interest}
                            type="button"
                            className="interest-chip"
                            onClick={() => addInterest(interest)}
                        >
                            {interest}
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
                        disabled={!selectedInterests.length}
                    >
                        {nextLabel}
                    </button>
                </div>
            </div>
        </StudentOnboardingFrame>
    );
}
