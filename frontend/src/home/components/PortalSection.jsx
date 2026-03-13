import { portalCards } from "../content.js";
import Reveal from "./Reveal.jsx";

export default function PortalSection() {
    return (
        <Reveal as="section" id="portal" className="section-panel section-panel--portal landing-section">
            <div className="section-panel__intro">
                <p className="eyebrow">Portal</p>
                <h2>Wszystko w jednym miejscu</h2>
                <p>
                    Uczen dostaje szybkie dopasowanie korepetytora, a tutor gotowy panel do zarzadzania
                    profilem, godzinami i zakresem materialu. Uklad sekcji nawiazuje do makiety, ale
                    pozostaje lekki i responsywny.
                </p>
            </div>

            <div className="portal-grid">
                {portalCards.map((card) => (
                    <article key={card.title} className="portal-card">
                        <span className="portal-card__icon">
                            <i className={card.icon}></i>
                        </span>
                        <h3>{card.title}</h3>
                        <p>{card.text}</p>
                    </article>
                ))}
            </div>
        </Reveal>
    );
}
