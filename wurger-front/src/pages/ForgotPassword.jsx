import { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8080/api/auth/forgot-password?email=' + encodeURIComponent(email), {
                method: 'POST'
            });

            if (response.ok) {
                setMessage('Si el correo está registrado, te hemos enviado un enlace para recuperar tu contraseña.');
                setEmail('');
            } else {
                const text = await response.text();
                setError(text || 'Error al intentar recuperar la contraseña');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 position-relative" style={{ overflow: 'hidden' }}>
            {/* Appetizing Background Image WITHOUT Blur */}
            <div className="position-absolute w-100 h-100" style={{
                backgroundImage: 'url(/bg_burger.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.6)',
                transform: 'scale(1.02)',
                zIndex: 0
            }}></div>

            <div className="card border-0 m-3 w-100 shadow-lg" style={{ 
                maxWidth: '440px', 
                zIndex: 10,
                background: 'rgba(15, 20, 25, 0.85)',
                backdropFilter: 'blur(12px)',
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div className="card-body p-4 p-sm-5 position-relative">
                    {/* Top Decorative Accent */}
                    <div className="position-absolute top-0 start-0 w-100" style={{ height: '6px', background: 'var(--primary-gradient)' }}></div>

                    {/* Header */}
                    <div className="text-center mb-4 mt-2">
                        <i className="bi bi-key-fill mb-3 d-inline-block hover-scale" style={{ fontSize: '3rem', color: 'var(--primary-color)', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}></i>
                        <h3 className="fw-bold mb-1 text-white">Recuperar Contraseña</h3>
                        <p className="text-light opacity-75 small">Ingresa tu correo para recibir un enlace de recuperación</p>
                    </div>

                    {error && (
                        <div className="alert border-0 text-white bg-danger bg-opacity-25 rounded-3 mb-4 py-3 px-3 d-flex align-items-center gap-2 animate-fade-in" role="alert">
                            <i className="bi bi-exclamation-octagon-fill fs-5 text-danger"></i>
                            <span className="small fw-semibold">{error}</span>
                        </div>
                    )}

                    {message && (
                        <div className="alert border-0 text-white bg-success bg-opacity-25 rounded-3 mb-4 py-3 px-3 d-flex align-items-center gap-2 animate-fade-in" role="alert">
                            <i className="bi bi-check-circle-fill fs-5 text-success"></i>
                            <span className="small fw-semibold">{message}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Email Input */}
                        <div className="mb-4">
                            <label htmlFor="email" className="form-label small fw-bold text-light mb-2">
                                Correo Electrónico
                            </label>
                            <div className="input-group shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <span className="input-group-text bg-dark border-0 text-primary">
                                    <i className="bi bi-envelope-fill"></i>
                                </span>
                                <input
                                    type="email"
                                    className="form-control bg-dark text-white border-0 ps-0"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="ejemplo@correo.com"
                                    style={{ boxShadow: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-100 mb-4 shadow-sm d-flex align-items-center justify-content-center gap-2"
                            style={{ borderRadius: '12px', padding: '12px' }}
                            disabled={loading || !!message}
                        >
                            {loading ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                                <>
                                    <span className="fw-bold text-white">Enviar Enlace</span>
                                    <i className="bi bi-send-fill text-white"></i>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Back to Login Link */}
                    <div className="text-center">
                        <Link to="/login" className="text-light opacity-75 small fw-medium text-decoration-none hover-scale d-inline-flex align-items-center gap-1">
                            <i className="bi bi-arrow-left"></i> Volver al Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
