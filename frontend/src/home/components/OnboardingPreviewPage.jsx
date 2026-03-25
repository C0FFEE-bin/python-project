import { useState } from "react";

import SchoolLevelSelect from "./SchoolLevelSelect.jsx";
import SubjectSelect from "./SubjectSelect.jsx";

const PREVIEW_LABELS = {
    "school-level-select": "SchoolLevelSelect.jsx",
    "subject-select": "SubjectSelect.jsx",
};

function PreviewLink({ href, isActive, label }) {
    return (
        <a
            href={href}
            className="rounded-full px-4 py-2 text-sm font-semibold transition-all"
            style={{
                background: isActive ? "#0f172a" : "#e2e8f0",
                color: isActive ? "#fff" : "#334155",
                boxShadow: isActive ? "0 12px 24px rgba(15, 23, 42, 0.18)" : "none",
            }}
        >
            {label}
        </a>
    );
}

function StatusCard({ previewComponent, selectedLevel, selectedSubjects }) {
    if (previewComponent === "subject-select") {
        return (
            <div className="rounded-3xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-sm">
                <div className="font-semibold text-slate-900">Ostatni payload z `onConfirm`</div>
                <div className="mt-1">
                    {selectedSubjects.length
                        ? selectedSubjects.join(", ")
                        : "Jeszcze nic nie potwierdzono."}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-3xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-sm">
            <div className="font-semibold text-slate-900">Ostatni payload z `onSelect`</div>
            <div className="mt-1">{selectedLevel || "Jeszcze nic nie wybrano."}</div>
        </div>
    );
}

export default function OnboardingPreviewPage({ previewComponent, urls = {} }) {
    const [selectedLevel, setSelectedLevel] = useState("");
    const [selectedSubjects, setSelectedSubjects] = useState([]);

    return (
        <div className="relative">
            <div className="pointer-events-none fixed bottom-4 right-4 z-40">
                <div className="pointer-events-auto w-[min(22rem,calc(100vw-2rem))] rounded-[1.4rem] border border-slate-200/80 bg-white/92 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.16)] backdrop-blur">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-slate-500">
                        Onboarding preview
                    </p>
                    <h1
                        className="mt-2 text-xl font-black text-slate-950"
                        style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                        {PREVIEW_LABELS[previewComponent] || "Preview"}
                    </h1>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <PreviewLink
                            href={urls.subjectSelectPreview || "/preview/subject-select"}
                            isActive={previewComponent === "subject-select"}
                            label="SubjectSelect"
                        />
                        <PreviewLink
                            href={urls.schoolLevelSelectPreview || "/preview/school-level-select"}
                            isActive={previewComponent === "school-level-select"}
                            label="SchoolLevelSelect"
                        />
                        <PreviewLink href={urls.home || "/"} isActive={false} label="Powrot" />
                    </div>

                    <div className="mt-3">
                        <StatusCard
                            previewComponent={previewComponent}
                            selectedLevel={selectedLevel}
                            selectedSubjects={selectedSubjects}
                        />
                    </div>
                </div>
            </div>

            {previewComponent === "subject-select" ? (
                <SubjectSelect onConfirm={setSelectedSubjects} />
            ) : (
                <SchoolLevelSelect onSelect={setSelectedLevel} />
            )}
        </div>
    );
}
