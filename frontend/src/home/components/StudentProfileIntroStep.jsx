import { useEffect, useRef, useState } from "react";

import StudentOnboardingFrame from "./StudentOnboardingFrame.jsx";
import "./StudentProfileIntroStep.css";

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

export default function StudentProfileIntroStep({
    avatarFile,
    bannerFile,
    fullName,
    isSubmitting = false,
    onAvatarChange,
    onBack,
    onBannerChange,
    onFullNameChange,
    onNext,
    submitError = "",
}) {
    const avatarInputRef = useRef(null);
    const bannerInputRef = useRef(null);
    const avatarPreviewUrl = useObjectUrl(avatarFile);
    const bannerPreviewUrl = useObjectUrl(bannerFile);
    const canGoNext = fullName.trim().length > 1;

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
        <StudentOnboardingFrame>
            <div className="student-intro-step student-flow-card">
                <h1>Uzupelnij okna:</h1>

                <input
                    ref={bannerInputRef}
                    className="student-intro-step__file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleBannerFileChange}
                />
                <input
                    ref={avatarInputRef}
                    className="student-intro-step__file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                />

                <button
                    type="button"
                    className={[
                        "student-intro-step__banner",
                        bannerPreviewUrl ? "has-image" : "",
                    ].join(" ")}
                    onClick={() => bannerInputRef.current?.click()}
                >
                    {bannerPreviewUrl ? (
                        <img src={bannerPreviewUrl} alt="Podglad banera" />
                    ) : (
                        <>
                            <span>Kliknij, aby dodać baner.</span>
                            <i className="fa-regular fa-image" aria-hidden="true" />
                        </>
                    )}
                </button>

                <div className="student-intro-step__name-row">
                    <button
                        type="button"
                        className={[
                            "student-intro-step__icon",
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
                        value={fullName}
                        onChange={(event) => onFullNameChange(event.target.value)}
                        type="text"
                        placeholder="Podaj imie i nazwisko..."
                    />
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
                        onClick={onNext}
                        disabled={!canGoNext || isSubmitting}
                    >
                        {isSubmitting ? "Zapisywanie..." : "Dalej"}
                    </button>
                </div>

                {submitError ? (
                    <p className="tutor-profile-submit-error" role="alert">{submitError}</p>
                ) : null}
            </div>
        </StudentOnboardingFrame>
    );
}
