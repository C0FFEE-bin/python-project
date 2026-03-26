import { useEffect, useMemo, useRef, useState } from "react";

import StudentOnboardingFrame from "./StudentOnboardingFrame.jsx";
import "./TutorProfileSetup.css";

const STEPS = ["Wybierz typ konta", "Twoj profil", "Poznaj RENT A NERD"];
const DAYS = ["02.03", "03.03", "04.03", "05.03", "06.03", "07.03", "08.03"];
const TIME_SLOTS = ["16:00", "18:00"];

function buildInitialSchedule() {
    return TIME_SLOTS.map(() => DAYS.map(() => false));
}

function useObjectUrl(file) {
    const [previewUrl, setPreviewUrl] = useState("");

    useEffect(() => {
        if (!file) {
            setPreviewUrl("");
            return undefined;
        }

        const nextUrl = URL.createObjectURL(file);
        setPreviewUrl(nextUrl);

        return () => {
            URL.revokeObjectURL(nextUrl);
        };
    }, [file]);

    return previewUrl;
}

export default function TutorProfileSetup({
    avatarFile = null,
    bannerFile = null,
    initialLevel = "",
    initialInterests = [],
    initialSubjects = [],
    onAvatarChange,
    onBack,
    onBannerChange,
    onComplete,
}) {
    const avatarInputRef = useRef(null);
    const bannerInputRef = useRef(null);
    const avatarPreviewUrl = useObjectUrl(avatarFile);
    const bannerPreviewUrl = useObjectUrl(bannerFile);
    const [fullName, setFullName] = useState("");
    const [about, setAbout] = useState("");
    const [interests, setInterests] = useState(() => [...initialInterests]);
    const [subjects, setSubjects] = useState(() => [...initialSubjects]);
    const [schedule, setSchedule] = useState(() => buildInitialSchedule());

    useEffect(() => {
        if (!Array.isArray(initialSubjects)) {
            return;
        }

        setSubjects([...initialSubjects]);
    }, [initialSubjects]);

    useEffect(() => {
        if (!Array.isArray(initialInterests)) {
            return;
        }

        setInterests([...initialInterests]);
    }, [initialInterests]);

    const canSubmit = useMemo(() => fullName.trim().length > 2, [fullName]);

    const toggleSlot = (rowIndex, dayIndex) => {
        setSchedule((prev) =>
            prev.map((row, currentRow) =>
                currentRow === rowIndex
                    ? row.map((value, currentDay) => (currentDay === dayIndex ? !value : value))
                    : row,
            ),
        );
    };

    const handleComplete = () => {
        if (!canSubmit) {
            return;
        }

        onComplete?.({
            about,
            avatarFile,
            bannerFile,
            fullName,
            interests,
            schedule,
            schoolLevel: initialLevel,
            subjects,
        });
    };

    const handleBannerFileChange = (event) => {
        const file = event.target.files?.[0] || null;
        onBannerChange?.(file);
        event.target.value = "";
    };

    const handleAvatarFileChange = (event) => {
        const file = event.target.files?.[0] || null;
        onAvatarChange?.(file);
        event.target.value = "";
    };

    return (
        <StudentOnboardingFrame currentStep={1} steps={STEPS}>
            <div className="tutor-profile-step">
                <section className="tutor-profile-card tutor-profile-card--identity">
                    <input
                        ref={bannerInputRef}
                        className="tutor-profile-file-input"
                        type="file"
                        accept="image/*"
                        onChange={handleBannerFileChange}
                    />
                    <input
                        ref={avatarInputRef}
                        className="tutor-profile-file-input"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                    />

                    <button
                        type="button"
                        className={[
                            "tutor-profile-banner",
                            bannerPreviewUrl ? "has-image" : "",
                        ].join(" ")}
                        onClick={() => bannerInputRef.current?.click()}
                    >
                        {bannerPreviewUrl ? (
                            <img src={bannerPreviewUrl} alt="Podglad banera" />
                        ) : (
                            <>
                                <span>Kliknij, aby dodac baner.</span>
                                <i className="fa-regular fa-image" aria-hidden="true" />
                            </>
                        )}
                    </button>

                    <div className="tutor-profile-name-row">
                        <button
                            type="button"
                            className={[
                                "tutor-profile-icon",
                                avatarPreviewUrl ? "has-image" : "",
                            ].join(" ")}
                            onClick={() => avatarInputRef.current?.click()}
                        >
                            {avatarPreviewUrl ? (
                                <img src={avatarPreviewUrl} alt="Podglad avatara" />
                            ) : (
                                <i className="fa-regular fa-image" aria-hidden="true" />
                            )}
                        </button>
                        <input
                            id="tutor-fullname"
                            type="text"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            placeholder="Podaj imie i nazwisko..."
                        />
                    </div>
                </section>

                <section className="tutor-profile-card">
                    <p className="tutor-profile-label">Ucze z:</p>
                    <div className="tutor-profile-chip-row">
                        {subjects.length ? (
                            subjects.map((subject) => (
                                <span key={subject} className="tutor-profile-chip">
                                    {subject}
                                </span>
                            ))
                        ) : (
                            <span className="tutor-profile-placeholder">Brak wybranych przedmiotow.</span>
                        )}

                        {initialLevel ? (
                            <span className="tutor-profile-chip tutor-profile-chip--level">
                                {initialLevel}
                            </span>
                        ) : null}
                    </div>

                    <label className="tutor-profile-label" htmlFor="tutor-about">
                        O mnie:
                    </label>
                    <textarea
                        id="tutor-about"
                        value={about}
                        onChange={(event) => setAbout(event.target.value)}
                        placeholder="Kliknij, aby dodac opis..."
                    />

                    <p className="tutor-profile-label tutor-profile-label--with-margin">Zainteresowania:</p>
                    <div className="tutor-profile-chip-row">
                        {interests.length ? (
                            interests.map((interest) => (
                                <span key={interest} className="tutor-profile-chip">
                                    {interest}
                                </span>
                            ))
                        ) : (
                            <span className="tutor-profile-placeholder">Brak wybranych zainteresowan.</span>
                        )}
                    </div>
                </section>

                <section className="tutor-profile-card">
                    <p className="tutor-profile-label">Harmonogram</p>

                    <div className="tutor-profile-schedule-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Godz./Data</th>
                                    {DAYS.map((day) => (
                                        <th key={day}>{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {TIME_SLOTS.map((slot, rowIndex) => (
                                    <tr key={slot}>
                                        <td>{slot}</td>
                                        {DAYS.map((day, dayIndex) => {
                                            const isActive = schedule[rowIndex][dayIndex];

                                            return (
                                                <td key={`${slot}-${day}`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSlot(rowIndex, dayIndex)}
                                                        className={[
                                                            "tutor-profile-slot",
                                                            isActive ? "is-active" : "",
                                                        ].join(" ")}
                                                        aria-label={`Zmien dostepnosc ${slot} ${day}`}
                                                    />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <p className="tutor-profile-help">Zaznacz slot kliknij w kafelek i wybierz opcje.</p>

                    <div className="tutor-profile-legend">
                        <span className="tutor-profile-legend-item is-available">Dostepny</span>
                        <span className="tutor-profile-legend-item is-unavailable">Niedostepny</span>
                    </div>
                </section>

                <div className="student-flow-actions">
                    <button
                        type="button"
                        onClick={() => onBack?.()}
                        className="student-flow-button is-secondary"
                    >
                        Wroc
                    </button>
                    <button
                        type="button"
                        onClick={handleComplete}
                        disabled={!canSubmit}
                        className="student-flow-button is-primary"
                    >
                        Zakoncz
                    </button>
                </div>
            </div>
        </StudentOnboardingFrame>
    );
}
