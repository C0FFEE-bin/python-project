import { useMemo, useState } from "react";

import AccountTypeSelect from "./AccountTypeSelect.jsx";
import SchoolLevelSelect from "./SchoolLevelSelect.jsx";
import TutorProfileSetup from "./TutorProfileSetup.jsx";

function redirectToTarget(url) {
    if (url) {
        window.location.assign(url);
    }
}

export default function RegistrationOnboardingPage({ nextTarget = "", urls = {} }) {
    const [accountType, setAccountType] = useState("");

    const completionTarget = useMemo(() => nextTarget || urls.home || "/", [nextTarget, urls.home]);

    if (!accountType) {
        return <AccountTypeSelect onSelect={setAccountType} />;
    }

    if (accountType === "uczen") {
        return (
            <SchoolLevelSelect
                onBack={() => setAccountType("")}
                onComplete={() => redirectToTarget(completionTarget)}
            />
        );
    }

    return (
        <TutorProfileSetup
            onBack={() => setAccountType("")}
            onComplete={() => redirectToTarget(completionTarget)}
        />
    );
}
