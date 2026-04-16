import { useMemo, useState } from "react";

import { saveStudentOnboardingProfile, saveTutorOnboardingProfile } from "../api.js";
import AccountTypeSelect from "../components/AccountTypeSelect.jsx";
import InterestSelect from "../components/InterestSelect.jsx";
import SchoolLevelSelect from "../components/SchoolLevelSelect.jsx";
import StudentProfileIntroStep from "../components/StudentProfileIntroStep.jsx";
import SubjectSelect from "../components/SubjectSelect.jsx";
import TutorProfileSetup from "../components/TutorProfileSetup.jsx";

function redirectToTarget(url) {
    if (url) {
        window.location.assign(url);
    }
}

const STUDENT_STEPS = {
    profileIntro: "profile-intro",
    schoolLevel: "school-level",
    subjects: "subjects",
    interests: "interests",
};

const TUTOR_STEPS = {
    schoolLevel: "school-level",
    subjects: "subjects",
    interests: "interests",
    profile: "profile",
};

const DEFAULT_STUDENT_SUBJECTS = ["Matematyka", "Jezyk Polski", "Jezyk Angielski"];
const DEFAULT_TUTOR_SUBJECTS = ["Matematyka", "Jezyk Polski", "Jezyk Angielski"];
const DEFAULT_STUDENT_INTERESTS = ["Malarstwo", "Muzyka", "Programowanie"];
const DEFAULT_TUTOR_INTERESTS = ["Malarstwo", "Muzyka", "Programowanie"];

function createInitialStudentData() {
    return {
        avatarFile: null,
        bannerFile: null,
        fullName: "",
        schoolLevel: "",
        subjects: [...DEFAULT_STUDENT_SUBJECTS],
        interests: [...DEFAULT_STUDENT_INTERESTS],
    };
}

function createInitialTutorData() {
    return {
        avatarFile: null,
        bannerFile: null,
        about: "",
        schoolLevels: [],
        subjects: [...DEFAULT_TUTOR_SUBJECTS],
        interests: [...DEFAULT_TUTOR_INTERESTS],
    };
}

export default function RegistrationOnboardingPage({ csrfToken = "", nextTarget = "", urls = {} }) {
    const [accountType, setAccountType] = useState("");
    const [studentStep, setStudentStep] = useState(STUDENT_STEPS.profileIntro);
    const [studentData, setStudentData] = useState(() => createInitialStudentData());
    const [studentSaveError, setStudentSaveError] = useState("");
    const [isSavingStudentProfileIntro, setIsSavingStudentProfileIntro] = useState(false);
    const [tutorStep, setTutorStep] = useState(TUTOR_STEPS.schoolLevel);
    const [tutorData, setTutorData] = useState(() => createInitialTutorData());

    const completionTarget = useMemo(() => nextTarget || urls.home || "/", [nextTarget, urls.home]);
    const studentOnboardingSaveUrl = urls.studentOnboardingSave ?? "/api/student-onboarding/profile";
    const tutorOnboardingSaveUrl = urls.tutorOnboardingSave ?? "/api/tutor-onboarding/profile";
    const databaseErrorUrl = urls.databaseError ?? "/database-error";

    const resetStudentFlow = () => {
        setStudentStep(STUDENT_STEPS.profileIntro);
        setStudentData(createInitialStudentData());
        setStudentSaveError("");
        setIsSavingStudentProfileIntro(false);
    };

    const resetTutorFlow = () => {
        setTutorStep(TUTOR_STEPS.schoolLevel);
        setTutorData(createInitialTutorData());
    };

    const handleAccountTypeSelect = (selectedAccountType) => {
        setAccountType(selectedAccountType);
        if (selectedAccountType === "uczen") {
            resetStudentFlow();
        }

        if (selectedAccountType === "korepetytor") {
            resetTutorFlow();
        }
    };

    const handleStudentProfileIntroNext = async () => {
        setStudentSaveError("");
        setIsSavingStudentProfileIntro(true);

        try {
            await saveStudentOnboardingProfile({
                payload: {
                    fullName: studentData.fullName,
                },
                saveUrl: studentOnboardingSaveUrl,
                csrfToken,
                databaseErrorUrl,
            });
            setStudentStep(STUDENT_STEPS.schoolLevel);
        } catch (error) {
            setStudentSaveError(error?.message || "Nie udalo sie zapisac imienia i nazwiska.");
        } finally {
            setIsSavingStudentProfileIntro(false);
        }
    };

    if (!accountType) {
        return <AccountTypeSelect onSelect={handleAccountTypeSelect} />;
    }

    if (accountType === "uczen") {
        if (studentStep === STUDENT_STEPS.profileIntro) {
            return (
                <StudentProfileIntroStep
                    avatarFile={studentData.avatarFile}
                    bannerFile={studentData.bannerFile}
                    fullName={studentData.fullName}
                    isSubmitting={isSavingStudentProfileIntro}
                    onAvatarChange={(file) => {
                        setStudentData((current) => ({
                            ...current,
                            avatarFile: file,
                        }));
                    }}
                    onBack={() => {
                        resetStudentFlow();
                        setAccountType("");
                    }}
                    onBannerChange={(file) => {
                        setStudentData((current) => ({
                            ...current,
                            bannerFile: file,
                        }));
                    }}
                    onFullNameChange={(nextFullName) => {
                        setStudentData((current) => ({
                            ...current,
                            fullName: nextFullName,
                        }));
                    }}
                    onNext={handleStudentProfileIntroNext}
                    submitError={studentSaveError}
                />
            );
        }

        if (studentStep === STUDENT_STEPS.schoolLevel) {
            return (
                <SchoolLevelSelect
                    initialLevel={studentData.schoolLevel}
                    onBack={() => setStudentStep(STUDENT_STEPS.profileIntro)}
                    onSelect={(levelId) => {
                        setStudentData((current) => ({
                            ...current,
                            schoolLevel: levelId,
                        }));
                    }}
                    onComplete={(levelId) => {
                        setStudentData((current) => ({
                            ...current,
                            schoolLevel: levelId,
                        }));
                        setStudentStep(STUDENT_STEPS.subjects);
                    }}
                />
            );
        }

        if (studentStep === STUDENT_STEPS.interests) {
            return (
                <InterestSelect
                    initialInterests={studentData.interests}
                    nextLabel="Zakoncz"
                    onBack={() => setStudentStep(STUDENT_STEPS.subjects)}
                    onConfirm={(interests) => {
                        setStudentData((current) => ({
                            ...current,
                            interests: [...interests],
                        }));
                    }}
                    onNext={async (interests) => {
                        setStudentData((current) => ({
                            ...current,
                            interests: [...interests],
                        }));
                        await saveStudentOnboardingProfile({
                            payload: {
                                fullName: studentData.fullName,
                                schoolLevel: studentData.schoolLevel,
                                subjects: studentData.subjects,
                                interests,
                            },
                            saveUrl: studentOnboardingSaveUrl,
                            csrfToken,
                            databaseErrorUrl,
                        });
                        redirectToTarget(completionTarget);
                    }}
                />
            );
        }

        return (
            <SubjectSelect
                initialSubjects={studentData.subjects}
                onBack={() => setStudentStep(STUDENT_STEPS.schoolLevel)}
                onConfirm={(subjects) => {
                    setStudentData((current) => ({
                        ...current,
                        subjects: [...subjects],
                    }));
                }}
                onNext={(subjects) => {
                    setStudentData((current) => ({
                        ...current,
                        subjects: [...subjects],
                    }));
                    setStudentStep(STUDENT_STEPS.interests);
                }}
            />
        );
    }

    if (tutorStep === TUTOR_STEPS.schoolLevel) {
        return (
            <SchoolLevelSelect
                title="Wybierz poziomy, ktorych nauczasz:"
                allowMultiple
                initialLevels={tutorData.schoolLevels}
                onBack={() => {
                    resetTutorFlow();
                    setAccountType("");
                }}
                onSelect={(levelIds) => {
                    setTutorData((current) => ({
                        ...current,
                        schoolLevels: [...levelIds],
                    }));
                }}
                onComplete={(levelIds) => {
                    setTutorData((current) => ({
                        ...current,
                        schoolLevels: [...levelIds],
                    }));
                    setTutorStep(TUTOR_STEPS.subjects);
                }}
            />
        );
    }

    if (tutorStep === TUTOR_STEPS.subjects) {
        return (
            <SubjectSelect
                title="Wybierz przedmioty, z ktorych uczysz:"
                availableTitle="Dostepne przedmioty:"
                initialSubjects={tutorData.subjects}
                nextLabel="Dalej"
                onBack={() => setTutorStep(TUTOR_STEPS.schoolLevel)}
                onConfirm={(subjects) => {
                    setTutorData((current) => ({
                        ...current,
                        subjects: [...subjects],
                    }));
                }}
                onNext={(subjects) => {
                    setTutorData((current) => ({
                        ...current,
                        subjects: [...subjects],
                    }));
                    setTutorStep(TUTOR_STEPS.interests);
                }}
            />
        );
    }

    if (tutorStep === TUTOR_STEPS.interests) {
        return (
            <InterestSelect
                initialInterests={tutorData.interests}
                initialIntroText={tutorData.about}
                nextLabel="Dalej"
                onBack={() => setTutorStep(TUTOR_STEPS.subjects)}
                onConfirm={(interests, about) => {
                    setTutorData((current) => ({
                        ...current,
                        about,
                        interests: [...interests],
                    }));
                }}
                onNext={(interests, about) => {
                    setTutorData((current) => ({
                        ...current,
                        about,
                        interests: [...interests],
                    }));
                    setTutorStep(TUTOR_STEPS.profile);
                }}
            />
        );
    }

    return (
        <TutorProfileSetup
            avatarFile={tutorData.avatarFile}
            bannerFile={tutorData.bannerFile}
            initialAbout={tutorData.about}
            initialLevels={tutorData.schoolLevels}
            initialSubjects={tutorData.subjects}
            initialInterests={tutorData.interests}
            onAvatarChange={(file) => {
                setTutorData((current) => ({
                    ...current,
                    avatarFile: file,
                }));
            }}
            onBack={() => setTutorStep(TUTOR_STEPS.interests)}
            onBannerChange={(file) => {
                setTutorData((current) => ({
                    ...current,
                    bannerFile: file,
                }));
            }}
            onAboutChange={(about) => {
                setTutorData((current) => ({
                    ...current,
                    about,
                }));
            }}
            onComplete={async (payload) => {
                const { avatarFile, bannerFile, ...persistedPayload } = payload;
                await saveTutorOnboardingProfile({
                    payload: persistedPayload,
                    saveUrl: tutorOnboardingSaveUrl,
                    csrfToken,
                    databaseErrorUrl,
                });
                redirectToTarget(completionTarget);
            }}
        />
    );
}
