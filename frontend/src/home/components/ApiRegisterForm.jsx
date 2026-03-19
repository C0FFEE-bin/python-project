import { useState } from 'react';

export default function ApiRegisterForm({ onRegisterSuccess }) {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        const response = await fetch('/api/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            onRegisterSuccess(data.user);
        } else {
            setErrorMsg(`Błąd: ${data.error}`);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '0 auto', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '15px' }}>Szybka rejestracja z poziomu Reacta</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                    type="text" name="username" placeholder="Nazwa użytkownika"
                    onChange={handleChange} required
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <input
                    type="email" name="email" placeholder="E-mail"
                    onChange={handleChange} required
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <input
                    type="password" name="password" placeholder="Hasło"
                    onChange={handleChange} required
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button type="submit" style={{ padding: '10px', background: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Zarejestruj mnie
                </button>
            </form>
            {errorMsg && <p style={{ color: 'red', marginTop: '10px' }}>{errorMsg}</p>}
        </div>
    );
}