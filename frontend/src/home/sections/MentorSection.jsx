import Reveal from "../components/Reveal.jsx";

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
                <p style={{ marginTop: '3px' }}>
                    Zarejestruj sie u nas, utworz wlasny profil, dopasuj swoje godziny i buduj baze uczniow.
                    Szybko, sprawnie i wygodnie realizuj swoje sposoby i pomagaj innym!
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
                        <strong>Chcesz zadać pytanie biznesowe?</strong>
                        <p>Napisz do nas prywatną wiadomość e-mail na adres: kontakt@rentanerd.pl</p>
                    </div>
                </div>
            </Reveal>
        </section>
    );
}
