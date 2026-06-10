import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setError('Enlace inválido o expirado. Por favor solicita uno nuevo.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:8080/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, newPassword: password })
            });

            if (response.ok) {
                setMessage('Tu contraseña ha sido restablecida exitosamente.');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                const text = await response.text();
                setError(text || 'Error al restablecer la contraseña');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 position-relative" style={{ overflow: 'hidden' }}>
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
                    <div className="position-absolute top-0 start-0 w-100" style={{ height: '6px', background: 'var(--primary-gradient)' }}></div>

                    <div className="text-center mb-4 mt-2">
                        <i className="bi bi-shield-lock-fill mb-3 d-inline-block hover-scale" style={{ fontSize: '3rem', color: 'var(--primary-color)', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}></i>
                        <h3 className="fw-bold mb-1 text-white">Nueva Contraseña</h3>
                        <p className="text-light opacity-75 small">Ingresa tu nueva contraseña</p>
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

                    {token && !message && (
                        <form onSubmit={handleSubmit}>
                            {/* New Password Input */}
                            <div className="mb-4">
                                <label className="form-label small fw-bold text-light mb-2">
                                    Nueva Contraseña
                                </label>
                                <div className="input-group shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <span className="input-group-text bg-dark border-0 text-primary">
                                        <i className="bi bi-lock-fill"></i>
                                    </span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-control bg-dark text-white border-0 px-0"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        style={{ boxShadow: 'none' }}
                                    />
                                    <button
                                        className="btn bg-dark border-0 text-light opacity-75"
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password Input */}
                            <div className="mb-4">
                                <label className="form-label small fw-bold text-light mb-2">
                                    Confirmar Contraseña
                                </label>
                                <div className="input-group shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <span className="input-group-text bg-dark border-0 text-primary">
                                        <i className="bi bi-lock-fill"></i>
                                    </span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-control bg-dark text-white border-0 ps-0"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        style={{ boxShadow: 'none' }}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg w-100 mb-4 shadow-sm d-flex align-items-center justify-content-center gap-2"
                                style={{ borderRadius: '12px', padding: '12px' }}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                ) : (
                                    <>
                                        <span className="fw-bold text-white">Guardar Contraseña</span>
                                        <i className="bi bi-check-circle-fill text-white"></i>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {(!token || message) && (
                        <div className="text-center mt-4">
                            <Link to="/login" className="btn btn-outline-light w-100 d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: '12px', padding: '12px' }}>
                                <i className="bi bi-arrow-left"></i> Volver al Login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
