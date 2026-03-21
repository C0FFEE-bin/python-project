import { useState } from "react";

import studentImg from "./assets/student.png";
import tutorImg from "./assets/tutor.png";


const steps = ["Wybierz typ konta", "Uzupełnij profil", "Poznaj RENT A NERD"];

function ImagePlaceholder({ src, alt, label }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain"
      />
    );
  }
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-2 text-purple-300">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-10 h-10 opacity-50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <span className="text-xs opacity-60 font-medium">{label}</span>
    </div>
  );
}

export default function AccountTypeSelect({ onSelect }) {
  const [selected, setSelected] = useState(null);
  const currentStep = 0;

  const handleSelect = (type) => {
    setSelected(type);
    if (onSelect) onSelect(type);
  };

  return (
    <div className="min-h-screen bg-purple-100 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl overflow-hidden">

        <div className="px-8 pt-6 pb-0">
          <div className="flex items-center gap-1 font-black text-gray-900 text-xl tracking-tight select-none w-fit">
            <span className="leading-none">
              RENT<br />NERD
            </span>
            <span
              className="text-5xl font-extrabold text-gray-900 leading-none"
              style={{ fontFamily: "Georgia, serif" }}
            >
              A
            </span>
          </div>
        </div>

        <div className="px-8 pt-5 pb-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            {steps.map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span
                  className={
                    i === currentStep
                      ? "text-gray-900 font-bold"
                      : "text-gray-400 font-normal"
                  }
                >
                  {step}
                </span>
                {i < steps.length - 1 && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-gray-400 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 px-8 pb-10">
          <button
            onClick={() => handleSelect("uczen")}
            className={`
              group rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-200 cursor-pointer
              ${selected === "uczen"
                ? "bg-purple-500 shadow-lg shadow-purple-200 scale-[1.02]"
                : "bg-purple-100 hover:bg-purple-200 hover:scale-[1.01]"
              }
            `}
          >
            <h2
              className={`text-2xl font-bold mb-1 transition-colors ${
                selected === "uczen" ? "text-white" : "text-purple-700"
              }`}
            >
              Uczeń
            </h2>


            <p
              className={`text-sm italic font-semibold mb-5 transition-colors ${
                selected === "uczen" ? "text-purple-100" : "text-purple-600"
              }`}
            >
              Poszukuję pomocy w nauce<br />z przedmiotów szkolnych.
            </p>

            <div className="w-full h-44 mb-6 flex items-center justify-center">
              <ImagePlaceholder
                src={studentImg || null}
                alt="Uczeń"
                label="Twoje zdjęcie ucznia"
              />
            </div>

            <div
              className={`
                w-full py-3 rounded-full text-sm font-bold transition-colors
                ${selected === "uczen"
                  ? "bg-purple-400 text-white"
                  : "bg-purple-500 text-white group-hover:bg-purple-600"
                }
              `}
            >
              Wybierz
            </div>
          </button>

          <button
            onClick={() => handleSelect("korepetytor")}
            className={`
              group rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-200 cursor-pointer
              ${selected === "korepetytor"
                ? "bg-gray-800 shadow-lg shadow-gray-300 scale-[1.02]"
                : "bg-gray-700 hover:bg-gray-800 hover:scale-[1.01]"
              }
            `}
          >
            <h2 className="text-2xl font-bold text-white mb-1">
              Korepetytor
            </h2>

            <p className="text-sm text-gray-300 mb-5">
              Zamierzam udzielać pomocy<br />innym uczniom.
            </p>

            <div className="w-full h-44 mb-6 flex items-center justify-center">
              <ImagePlaceholder
                src={tutorImg || null}
                alt="Korepetytor"
                label="Twoje zdjęcie korepetytora"
              />
            </div>

            <div
              className={`
                w-full py-3 rounded-full text-sm font-bold transition-colors
                ${selected === "korepetytor"
                  ? "bg-gray-600 text-white"
                  : "bg-gray-900 text-white group-hover:bg-black"
                }
              `}
            >
              Wybierz
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
