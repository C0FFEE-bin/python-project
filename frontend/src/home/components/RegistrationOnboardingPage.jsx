import { useMemo, useState } from "react";

import AccountTypeSelect from "./AccountTypeSelect.jsx";
import InterestSelect from "./InterestSelect.jsx";
import SchoolLevelSelect from "./SchoolLevelSelect.jsx";
import StudentProfileIntroStep from "./StudentProfileIntroStep.jsx";
import SubjectSelect from "./SubjectSelect.jsx";
import TutorProfileSetup from "./TutorProfileSetup.jsx";

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
        schoolLevel: "",
        subjects: [...DEFAULT_TUTOR_SUBJECTS],
        interests: [...DEFAULT_TUTOR_INTERESTS],
    };
}

export default function RegistrationOnboardingPage({ nextTarget = "", urls = {} }) {
    const [accountType, setAccountType] = useState("");
    const [studentStep, setStudentStep] = useState(STUDENT_STEPS.profileIntro);
    const [studentData, setStudentData] = useState(() => createInitialStudentData());
    const [tutorStep, setTutorStep] = useState(TUTOR_STEPS.schoolLevel);
    const [tutorData, setTutorData] = useState(() => createInitialTutorData());

    const completionTarget = useMemo(() => nextTarget || urls.home || "/", [nextTarget, urls.home]);

    const resetStudentFlow = () => {
        setStudentStep(STUDENT_STEPS.profileIntro);
        setStudentData(createInitialStudentData());
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
                    onNext={() => setStudentStep(STUDENT_STEPS.schoolLevel)}
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
                    onNext={(interests) => {
                        setStudentData((current) => ({
                            ...current,
                            interests: [...interests],
                        }));
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
                title="Wybierz, poziom ktory nauczasz:"
                initialLevel={tutorData.schoolLevel}
                onBack={() => {
                    resetTutorFlow();
                    setAccountType("");
                }}
                onSelect={(levelId) => {
                    setTutorData((current) => ({
                        ...current,
                        schoolLevel: levelId,
                    }));
                }}
                onComplete={(levelId) => {
                    setTutorData((current) => ({
                        ...current,
                        schoolLevel: levelId,
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
                nextLabel="Dalej"
                onBack={() => setTutorStep(TUTOR_STEPS.subjects)}
                onConfirm={(interests) => {
                    setTutorData((current) => ({
                        ...current,
                        interests: [...interests],
                    }));
                }}
                onNext={(interests) => {
                    setTutorData((current) => ({
                        ...current,
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
            initialLevel={tutorData.schoolLevel}
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
            onComplete={() => redirectToTarget(completionTarget)}
        />
    );
}
