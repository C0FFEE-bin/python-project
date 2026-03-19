import { useState } from "react";

const SCHEDULE_DATA = {
  times: ["18:00", "19:00", "20:00", "21:00"],
  days: ["02.03", "03.03", "04.03", "05.03", "06.03", "07.03", "08.03"],
  slots: {
    "18:00": ["busy", "busy", "busy", "busy", "busy", "free", "dark"],
    "19:00": ["free", "busy", "busy", "busy", "busy", "free", "dark"],
    "20:00": ["free", "busy", "free", "busy", "busy", "free", "dark"],
    "21:00": ["busy", "free", "busy", "free", "busy", "free", "dark"],
  },
};

const StarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export default function TutorProfile() {
  const [following, setFollowing] = useState(false);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: "100vh", background: "#f0f0f5" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .follow-btn { cursor: pointer; border: none; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; transition: all 0.2s; letter-spacing: 0.04em; }
        .follow-btn.following { background: #e8e8f0; color: #666; }
        .follow-btn.not-following { background: #d946ef; color: white; }
        .follow-btn:hover { transform: scale(1.05); opacity: 0.9; }
        .tag { background: #f0f0f8; color: #444; padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 500; border: 1.5px solid #e0e0ec; }
        .slot { height: 28px; border-radius: 20px; transition: transform 0.15s; cursor: pointer; }
        .slot:hover { transform: scale(1.08); }
        .slot.busy { background: #f4a0a8; }
        .slot.free { background: #e0e0e8; }
        .slot.dark { background: #888899; }
        .card { background: white; border-radius: 20px; padding: 24px; box-shadow: 0 2px 16px rgba(0,0,0,0.06); }
        .avatar-ring { width: 72px; height: 72px; border-radius: 50%; border: 3px solid #d946ef; overflow: hidden; background: #dde; position: relative; bottom: 32px; box-shadow: 0 0 0 3px white; }
        .avatar-ring img { width: 100%; height: 100%; object-fit: cover; }
        .review-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #a78bfa, #d946ef); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px; flex-shrink: 0; }
        .see-reviews-btn { background: #d946ef; color: white; border: none; padding: 8px 20px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; letter-spacing: 0.04em; transition: all 0.2s; margin-top: 12px; }
        .see-reviews-btn:hover { opacity: 0.85; transform: translateY(-1px); }
      `}</style>

      <div style={{ display: "flex", maxWidth: 900, margin: "0 auto", minHeight: "100vh", position: "relative" }}>
        <div style={{ flex: 1, padding: "16px 16px 40px" }}>

          <div className="card" style={{ marginBottom: 16, overflow: "hidden", padding: 0 }}>
            <div style={{ height: 140, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "url('https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800') center/cover" }} />
            </div>

            <div style={{ padding: "0 24px 24px" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 20 }}>
                <div className="avatar-ring">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" alt="Łukasz Gamoń" />
                </div>
                <div style={{ paddingBottom: 8 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 8 }}>Łukasz Gamoń</h1>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      className={`follow-btn ${following ? "following" : "not-following"}`}
                      onClick={() => setFollowing(!following)}
                    >
                      {following ? "Obserwujesz" : "Obserwuj"}
                    </button>
                    <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>1 021</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Uczę z:</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["Matematyka", "Fizyka", "Informatyka"].map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>O mnie:</p>
                <p style={{ fontSize: 13.5, color: "#444", lineHeight: 1.65, marginBottom: 8 }}>
                  Cześć 👋 Jestem korepetytorem z matematyki ➕, fizyki 🖥 oraz informatyki 💻. Od kilku lat pomagam uczniom zrozumieć trudne zagadnienia, przygotować się do sprawdzianów, egzaminów oraz nadrobić zaległości w nauce 📖
                </p>
                <p style={{ fontSize: 13.5, color: "#444", lineHeight: 1.65, marginBottom: 8 }}>
                  Podczas zajęć stawiam na jasne i spokojne tłumaczenie, cierpliwość oraz indywidualne podejście do każdego ucznia. Pokazuję, że przedmioty ścisłe mogą być logiczne i zrozumiałe, jeśli wyjaśni się je krok po kroku 🧩. Dostosuję tempo pracy do potrzeb ucznia i pomagam rozwijać umiejętność samodzielnego rozwiązywania zadań 💪
                </p>
                <p style={{ fontSize: 13.5, color: "#444", lineHeight: 1.65 }}>
                  Zapraszam zarówno osoby, które mają trudności z materiałem, jak i tych, którzy chcą poszerzyć swoją wiedzę lub dobrze przygotować się do ważnych egzaminów 🎯
                </p>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>Opinie</p>
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <StarIcon />
                  <span style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>4.5</span>
                  <span style={{ fontSize: 16, color: "#999", fontWeight: 400 }}>/5</span>
                </div>
                <p style={{ fontSize: 11, color: "#aaa", marginBottom: 14 }}>69 opinii</p>
                <button className="see-reviews-btn">Zobacz opinie</button>
              </div>

              <div style={{ width: 1, background: "#eee", alignSelf: "stretch" }} />

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div className="review-avatar">K</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "#111", marginBottom: 2 }}>Kacper Kubica</p>
                    <div style={{ display: "flex", gap: 2, marginBottom: 4 }}>
                      {[1,2,3,4,5].map(i => <StarIcon key={i} />)}
                    </div>
                    <p style={{ fontSize: 11, color: "#aaa", marginBottom: 8 }}>21.03.2025</p>
                    <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                      Bardzo polecam korepetycje! Zajęcia były dobrze przygotowane, prowadzone w spokojnej i miłej atmosferze. Materiał został wytłumaczony w prosty i zrozumiały sposób, a efekty nauki było widać bardzo szybko. Zdecydowanie 5/5!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <p style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>Harmonogram</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "5px" }}>
                <thead>
                  <tr>
                    <th style={{ fontSize: 11, color: "#aaa", fontWeight: 600, padding: "4px 8px", textAlign: "left", whiteSpace: "nowrap" }}>Godz./Data</th>
                    {SCHEDULE_DATA.days.map(day => (
                      <th key={day} style={{ fontSize: 11, color: "#111", fontWeight: 700, padding: "4px 8px", textAlign: "center", whiteSpace: "nowrap" }}>{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SCHEDULE_DATA.times.map(time => (
                    <tr key={time}>
                      <td style={{ fontSize: 12, fontWeight: 600, color: "#555", padding: "4px 8px", whiteSpace: "nowrap" }}>{time}</td>
                      {SCHEDULE_DATA.slots[time].map((status, i) => (
                        <td key={i} style={{ padding: "3px 4px" }}>
                          <div className={`slot ${status}`} style={{ minWidth: 52 }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", gap: 20, marginTop: 16, paddingTop: 12, borderTop: "1px solid #f0f0f5" }}>
              {[
                { color: "#f4a0a8", label: "Zajęty" },
                { color: "#e0e0e8", label: "Wolny" },
                { color: "#888899", label: "Niedostępny" },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 28, height: 10, borderRadius: 10, background: color }} />
                  <span style={{ fontSize: 11, color: "#999" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div style={{ width: 24, flexShrink: 0, background: "linear-gradient(180deg, #e879f9 0%, #a78bfa 100%)", borderRadius: "0 0 0 40px", minHeight: 300, marginTop: 80, alignSelf: "flex-start", opacity: 0.85 }} />
      </div>
    </div>
  );
}