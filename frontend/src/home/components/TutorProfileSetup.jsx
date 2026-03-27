import { useEffect, useMemo, useRef, useState } from "react";

import StudentOnboardingFrame from "./StudentOnboardingFrame.jsx";
import "./TutorProfileSetup.css";

const STEPS = ["Wybierz typ konta", "Twoj profil", "Poznaj RENT A NERD"];
const DAYS = [
    { label: "02.03", weekday: 0 },
    { label: "03.03", weekday: 1 },
    { label: "04.03", weekday: 2 },
    { label: "05.03", weekday: 3 },
    { label: "06.03", weekday: 4 },
    { label: "07.03", weekday: 5 },
    { label: "08.03", weekday: 6 },
];
const TIME_SLOTS = ["16:00", "18:00"];
const SLOT_STATUSES = {
    neutral: "neutral",
    available: "available",
    unavailable: "unavailable",
};

function buildInitialSchedule() {
    return TIME_SLOTS.map(() => DAYS.map(() => SLOT_STATUSES.neutral));
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
    const [selectedAvailability, setSelectedAvailability] = useState(SLOT_STATUSES.available);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

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

    const hasAvailableSlot = useMemo(
        () => schedule.some((row) => row.some((slot) => slot === SLOT_STATUSES.available)),
        [schedule],
    );
    const canSubmit = useMemo(
        () => fullName.trim().length > 2 && hasAvailableSlot,
        [fullName, hasAvailableSlot],
    );

    const paintSlot = (rowIndex, dayIndex) => {
        setSchedule((prev) =>
            prev.map((row, currentRow) =>
                currentRow === rowIndex
                    ? row.map((value, currentDay) => {
                        if (currentDay !== dayIndex) {
                            return value;
                        }

                        return value === selectedAvailability
                            ? SLOT_STATUSES.neutral
                            : selectedAvailability;
                    })
                    : row,
            ),
        );
    };

    const handleComplete = async () => {
        if (!canSubmit) {
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            await onComplete?.({
                about,
                avatarFile,
                bannerFile,
                fullName,
                interests,
                schedule: {
                    days: DAYS.map((day) => ({
                        label: day.label,
                        weekday: day.weekday,
                    })),
                    rows: TIME_SLOTS.map((slot, rowIndex) => ({
                        timeLabel: slot,
                        slots: [...schedule[rowIndex]],
                    })),
                },
                schoolLevel: initialLevel,
                subjects,
            });
        } catch (error) {
            setSubmitError(error?.message || "Nie udalo sie zapisac profilu tutora.");
        } finally {
            setIsSubmitting(false);
        }
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

                    <div className="tutor-profile-schedule-grid-wrap">
                        <table className="tutor-profile-schedule-grid">
                            <thead>
                                <tr>
                                    <th className="tutor-profile-schedule-grid__axis">Godz./Data</th>
                                    {DAYS.map((day) => (
                                        <th key={day.label} className="tutor-profile-schedule-grid__day">{day.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {TIME_SLOTS.map((slot, rowIndex) => (
                                    <tr key={slot}>
                                        <td className="tutor-profile-schedule-grid__time">{slot}</td>
                                        {DAYS.map((day, dayIndex) => {
                                            const slotStatus = schedule[rowIndex][dayIndex];

                                            return (
                                                <td key={`${slot}-${day.label}`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => paintSlot(rowIndex, dayIndex)}
                                                        className={[
                                                            "tutor-profile-schedule-grid__slot",
                                                            `is-${slotStatus}`,
                                                        ].join(" ")}
                                                        aria-label={`Zmien dostepnosc ${slot} ${day.label}`}
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

                    <div className="tutor-profile-paint-tools">
                        <button
                            type="button"
                            onClick={() => setSelectedAvailability(SLOT_STATUSES.available)}
                            className={[
                                "tutor-profile-paint-button",
                                "is-available",
                                selectedAvailability === SLOT_STATUSES.available ? "is-selected" : "",
                            ].join(" ")}
                        >
                            Dostepny
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedAvailability(SLOT_STATUSES.unavailable)}
                            className={[
                                "tutor-profile-paint-button",
                                "is-unavailable",
                                selectedAvailability === SLOT_STATUSES.unavailable ? "is-selected" : "",
                            ].join(" ")}
                        >
                            Niedostepny
                        </button>
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
                        disabled={!canSubmit || isSubmitting}
                        className="student-flow-button is-primary"
                    >
                        {isSubmitting ? "Zapisywanie..." : "Zakoncz"}
                    </button>
                </div>

                {submitError ? (
                    <p className="tutor-profile-submit-error" role="alert">{submitError}</p>
                ) : null}
            </div>
        </StudentOnboardingFrame>
    );
}
