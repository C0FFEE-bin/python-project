import { useMemo, useState } from "react";

const SUBJECT_SUGGESTIONS = [
    "Matematyka",
    "Fizyka",
    "Angielski",
    "Chemia",
    "Informatyka",
];

const STEPS = ["Wybierz typ konta", "Uzupelnij profil", "Poznaj RENT A NERD"];
const DAYS = ["02.03", "03.03", "04.03", "05.03", "06.03", "07.03", "08.03"];
const TIME_SLOTS = ["16:00", "18:00"];

function Stepper({ currentStep }) {
    return (
        <div className="flex flex-wrap items-center gap-2 text-sm">
            {STEPS.map((step, index) => (
                <span key={step} className="flex items-center gap-2">
                    <span
                        className={index === currentStep ? "font-bold text-gray-900" : "text-gray-400"}
                    >
                        {step}
                    </span>
                    {index < STEPS.length - 1 ? (
                        <span className="text-gray-300" aria-hidden="true">
                            -&gt;
                        </span>
                    ) : null}
                </span>
            ))}
        </div>
    );
}

function buildInitialSchedule() {
    return TIME_SLOTS.map(() => DAYS.map(() => false));
}

export default function TutorProfileSetup({ onBack, onComplete }) {
    const [fullName, setFullName] = useState("");
    const [about, setAbout] = useState("");
    const [subjects, setSubjects] = useState(["Matematyka", "Fizyka"]);
    const [schedule, setSchedule] = useState(() => buildInitialSchedule());

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

    const addSubject = (label) => {
        if (!label || subjects.includes(label)) {
            return;
        }

        setSubjects((prev) => [...prev, label]);
    };

    const removeSubject = (label) => {
        setSubjects((prev) => prev.filter((item) => item !== label));
    };

    const handleComplete = () => {
        if (!canSubmit) {
            return;
        }

        onComplete?.({
            about,
            fullName,
            schedule,
            subjects,
        });
    };

    return (
        <section className="min-h-screen bg-[#f3e8f9] px-4 py-10 sm:px-6">
            <div className="mx-auto w-full max-w-4xl rounded-3xl border border-white/80 bg-white/92 p-6 shadow-[0_20px_55px_rgba(110,76,136,0.16)] sm:p-8">
                <div className="mb-5 flex items-center gap-2 font-black leading-none text-gray-900">
                    <span className="text-lg">
                        RENT
                        <br />
                        NERD
                    </span>
                    <span className="text-5xl">A</span>
                </div>

                <Stepper currentStep={1} />

                <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-500 p-4 text-center text-sm font-bold text-white">
                    Kliknij, aby dodac baner.
                </div>

                <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <label className="text-sm font-bold text-gray-800" htmlFor="tutor-fullname">
                        Podaj imie i nazwisko
                    </label>
                    <input
                        id="tutor-fullname"
                        type="text"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-purple-400"
                        placeholder="np. Anna Kowalska"
                    />
                </div>

                <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-bold text-gray-800">Ucze z:</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {subjects.map((subject) => (
                            <button
                                key={subject}
                                type="button"
                                className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700"
                                onClick={() => removeSubject(subject)}
                            >
                                {subject} x
                            </button>
                        ))}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {SUBJECT_SUGGESTIONS.map((subject) => (
                            <button
                                key={subject}
                                type="button"
                                onClick={() => addSubject(subject)}
                                className="rounded-full border border-purple-200 px-3 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50"
                            >
                                + {subject}
                            </button>
                        ))}
                    </div>

                    <label className="mt-5 block text-sm font-bold text-gray-800" htmlFor="tutor-about">
                        O mnie:
                    </label>
                    <textarea
                        id="tutor-about"
                        value={about}
                        onChange={(event) => setAbout(event.target.value)}
                        className="mt-2 min-h-24 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-purple-400"
                        placeholder="Kilka slow o Tobie..."
                    />
                </div>

                <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-bold text-gray-800">Harmonogram</p>
                    <div className="mt-3 overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-2 text-xs">
                            <thead>
                                <tr>
                                    <th className="rounded bg-gray-700 px-3 py-2 text-left text-white">
                                        Godz./Data
                                    </th>
                                    {DAYS.map((day) => (
                                        <th key={day} className="rounded bg-gray-700 px-3 py-2 text-white">
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {TIME_SLOTS.map((slot, rowIndex) => (
                                    <tr key={slot}>
                                        <td className="rounded bg-gray-600 px-3 py-2 font-semibold text-white">
                                            {slot}
                                        </td>
                                        {DAYS.map((day, dayIndex) => {
                                            const isActive = schedule[rowIndex][dayIndex];

                                            return (
                                                <td key={`${slot}-${day}`} className="p-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSlot(rowIndex, dayIndex)}
                                                        className={[
                                                            "h-7 w-full rounded-full border transition",
                                                            isActive
                                                                ? "border-green-500 bg-green-500/20"
                                                                : "border-gray-300 bg-gray-100 hover:bg-gray-200",
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
                    <p className="mt-3 text-xs text-gray-500">Kliknij slot, aby oznaczyc dostepnosc.</p>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => onBack?.()}
                        className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                    >
                        Wroc
                    </button>
                    <button
                        type="button"
                        onClick={handleComplete}
                        disabled={!canSubmit}
                        className={[
                            "rounded-full px-6 py-2.5 text-sm font-bold transition",
                            canSubmit
                                ? "bg-purple-600 text-white hover:bg-purple-700"
                                : "cursor-not-allowed bg-gray-200 text-gray-500",
                        ].join(" ")}
                    >
                        Zakoncz
                    </button>
                </div>
            </div>
        </section>
    );
}
