import { metrics } from "../content.js";
import Reveal from "./Reveal.jsx";

export default function HeroSection({ aboutUrl, heroImageSrc }) {
    return (
        <section className="hero landing-section" id="home">
            <Reveal as="div" className="hero__content">
                <p className="eyebrow">Platforma do nauki 1:1</p>
                <h1 className="hero__title">Potrzebujesz pomocy w nauce?</h1>
                <p className="hero__text">
                    U nas znajdziesz najlepszych korepetytorow, gotowych pomoc Ci w kazdym momencie.
                    Szybko wybierzesz przedmiot, poziom oraz dogodny termin spotkania.
                </p>

                <div className="hero__actions">
                    <a className="button button--primary" href="#wyszukiwarka">Wybierz swojego korepetytora</a>
                    <a className="button button--muted" href={aboutUrl}>O nas</a>
                </div>

                <div className="hero__metrics">
                    {metrics.map((metric) => (
                        <article key={metric.label} className="metric-card">
                            <strong>{metric.value}</strong>
                            <span>{metric.label}</span>
                        </article>
                    ))}
                </div>
            </Reveal>

            <Reveal as="div" className="hero__visual">
                <div className="hero__scene">
                    <img
                        className="hero__illustration-image"
                        src={heroImageSrc}
                        alt="Ilustracja korepetytora i rakiety"
                    />
                </div>
            </Reveal>
        </section>
    );
}
