import { useState } from "react";

const schools = [
  {
    id: "podstawowa",
    title: "Podstawowa",
    subtitle: "Szkoła podstawowa 1-8",
  },
  {
    id: "srednia",
    title: "Średnia",
    subtitle: "Szkoła średnia\nLiceum / Technikum",
  },
  {
    id: "studia",
    title: "Studia",
    subtitle: "Szkoła wyższa",
  },
];

const steps = ["Wybierz typ konta", "Uzupełnij profil", "Poznaj RENT A NERD"];

export default function SchoolSelector() {
  const [selected, setSelected] = useState(null);

  return (
    <div style={styles.page}>
      {/* Background decoration */}
      <div style={styles.bgBlob} />

      {/* Logo */}
      <div style={styles.logo}>
        <span style={styles.logoRent}>RENT</span>
        <span style={styles.logoNerd}>NERD</span>
        <span style={styles.logoA}>A</span>
      </div>

      {/* Stepper */}
      <div style={styles.stepper}>
        {steps.map((step, i) => (
          <div key={step} style={styles.stepItem}>
            <span
              style={{
                ...styles.stepLabel,
                fontWeight: i === 0 ? 600 : 400,
                color: i === 0 ? "#222" : "#888",
              }}
            >
              {step}
            </span>
            {i < steps.length - 1 && <span style={styles.arrow}>→</span>}
          </div>
        ))}
      </div>

      {/* Heading */}
      <h1 style={styles.heading}>Wybierz swoją szkołę</h1>

      {/* Cards */}
      <div style={styles.cards}>
        {schools.map((school) => {
          const isSelected = selected === school.id;
          return (
            <div
              key={school.id}
              style={{
                ...styles.card,
                boxShadow: isSelected
                  ? "0 0 0 3px #9b59b6, 0 8px 32px rgba(155,89,182,0.25)"
                  : "0 4px 24px rgba(155,89,182,0.10)",
                transform: isSelected ? "translateY(-4px) scale(1.02)" : "none",
              }}
              onClick={() => setSelected(school.id)}
            >
              {/* Card Header */}
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>{school.title}</span>
              </div>

              {/* Card Body */}
              <div style={styles.cardBody}>
                <p style={styles.cardSubtitle}>{school.subtitle}</p>
              </div>

              {/* Card Footer */}
              <div style={styles.cardFooter}>
                <button
                  style={{
                    ...styles.btn,
                    background: isSelected ? "#7d3c98" : "#b07cc6",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(school.id);
                  }}
                >
                  Wybierz
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3e8f9",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "'Nunito', 'Segoe UI', sans-serif",
    position: "relative",
    overflow: "hidden",
    paddingBottom: 60,
  },
  bgBlob: {
    position: "absolute",
    bottom: -80,
    right: -80,
    width: 380,
    height: 380,
    borderRadius: "50% 40% 60% 30%",
    background:
      "radial-gradient(ellipse at 60% 40%, #d7a8f0 0%, #b97dd4 60%, transparent 100%)",
    opacity: 0.55,
    zIndex: 0,
    pointerEvents: "none",
  },
  logo: {
    marginTop: 28,
    marginBottom: 4,
    display: "flex",
    alignItems: "center",
    gap: 2,
    fontWeight: 900,
    fontSize: 22,
    letterSpacing: 1,
    zIndex: 1,
    position: "relative",
  },
  logoRent: {
    color: "#222",
    fontWeight: 800,
  },
  logoNerd: {
    color: "#222",
    fontWeight: 800,
    marginLeft: 4,
  },
  logoA: {
    background: "#222",
    color: "#fff",
    borderRadius: 6,
    padding: "2px 7px",
    fontWeight: 900,
    fontSize: 20,
    marginLeft: 4,
  },
  stepper: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
    marginBottom: 2,
    zIndex: 1,
    position: "relative",
  },
  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  stepLabel: {
    fontSize: 13,
    color: "#888",
    whiteSpace: "nowrap",
  },
  arrow: {
    color: "#aaa",
    fontSize: 14,
    marginLeft: 2,
    marginRight: 2,
  },
  heading: {
    fontSize: 30,
    fontWeight: 800,
    color: "#1a1a2e",
    margin: "18px 0 36px 0",
    zIndex: 1,
    position: "relative",
    letterSpacing: -0.5,
  },
  cards: {
    display: "flex",
    gap: 24,
    zIndex: 1,
    position: "relative",
    flexWrap: "wrap",
    justifyContent: "center",
    padding: "0 16px",
  },
  card: {
    background: "#fff",
    borderRadius: 20,
    width: 180,
    minHeight: 260,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  cardHeader: {
    background: "linear-gradient(135deg, #c47fe0 0%, #a855c8 100%)",
    padding: "18px 16px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: "#fff",
    fontWeight: 800,
    fontSize: 18,
    letterSpacing: 0.2,
  },
  cardBody: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px 16px",
  },
  cardSubtitle: {
    color: "#a07ab8",
    fontSize: 13,
    textAlign: "center",
    whiteSpace: "pre-line",
    lineHeight: 1.5,
    margin: 0,
  },
  cardFooter: {
    padding: "0 20px 20px",
    display: "flex",
    justifyContent: "center",
  },
  btn: {
    background: "#b07cc6",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "9px 32px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    transition: "background 0.2s",
    width: "100%",
    letterSpacing: 0.3,
  },
};