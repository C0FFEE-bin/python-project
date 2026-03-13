import Reveal from "./Reveal.jsx";

export default function MentorSection({ mentorImageSrc, registerUrl }) {
    return (
        <section className="mentor-section landing-section" id="kontakt">
            <Reveal as="div" className="mentor-section__visual">
                <img
                    className="mentor-section__illustration"
                    src={mentorImageSrc}
                    alt="Ilustracja korepetytora pomagajacego uczniowi przy tablicy"
                />
            </Reveal>

            <Reveal as="div" className="mentor-section__content">
                <p className="eyebrow">Dla tutorow</p>
                <h2>A moze chcesz pomoc innym?</h2>
                <p>
                    Zarejestruj sie u nas, utworz wlasny profil, dopasuj swoje godziny i buduj baze uczniow.
                    Ten blok domyka landing page i daje Ci miejsce na pozniejsze podpiecie prawdziwego formularza.
                </p>

                <div className="mentor-section__actions">
                    <a className="button button--primary" href={registerUrl}>Zostan korepetytorem</a>
                    <a className="button button--ghost" href="#home">Wroc na gore</a>
                </div>

                <div className="contact-card">
                    <span className="contact-card__icon">
                        <i className="fa-regular fa-envelope"></i>
                    </span>
                    <div>
                        <strong>Szybki kontakt</strong>
                        <p>Napisz do nas i ustal, jak ma wygladac profil, oferta oraz obsluga zgloszen.</p>
                    </div>
                </div>
            </Reveal>
        </section>
    );
}
