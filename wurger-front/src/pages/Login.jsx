import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const usuario = await response.json();
                localStorage.setItem('usuario', JSON.stringify(usuario));

                // Prevent back button navigation
                window.history.pushState(null, '', window.location.href);
                window.onpopstate = () => {
                    window.history.pushState(null, '', window.location.href);
                };

                // Trigger a global login event so other tabs/headers reload state
                window.dispatchEvent(new Event('user-login'));

                if (usuario.rol === 'Administrador') {
                    navigate('/admin', { replace: true });
                } else {
                    navigate('/client-dashboard', { replace: true });
                }
            } else {
                const errorText = await response.text();
                setError(errorText || 'Usuario o contraseña incorrectos');
            }
        } catch (error) {
            console.error('Login error:', error);
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

                    {/* Brand / Logo */}
                    <div className="text-center mb-4 mt-2">
                        <img
                            src="/logo.png"
                            alt="Wurger Logo"
                            className="mb-3 hover-scale"
                            style={{ height: '70px', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
                        />
                        <h3 className="fw-bold mb-1 text-white">Bienvenido a <span style={{ color: 'var(--primary-color)' }}>Wurger</span></h3>
                        <p className="text-light opacity-75 small">Ingresa para pedir las mejores hamburguesas</p>
                    </div>

                    {error && (
                        <div className="alert border-0 text-white bg-danger bg-opacity-25 rounded-3 mb-4 py-3 px-3 d-flex align-items-center gap-2 animate-fade-in" role="alert">
                            <i className="bi bi-exclamation-octagon-fill fs-5 text-danger"></i>
                            <span className="small fw-semibold">{error}</span>
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

                        {/* Password Input */}
                        <div className="mb-4">
                            <label htmlFor="password" className="form-label small fw-bold text-light mb-2">
                                Contraseña
                            </label>
                            <div className="input-group shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <span className="input-group-text bg-dark border-0 text-primary">
                                    <i className="bi bi-lock-fill"></i>
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-control bg-dark text-white border-0 px-0"
                                    id="password"
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

                        {/* Remember & Forgot Password Links */}
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div className="form-check">
                                <input type="checkbox" className="form-check-input bg-dark border-secondary" id="remember" style={{ cursor: 'pointer' }} />
                                <label className="form-check-label small text-light opacity-75 fw-medium select-none" htmlFor="remember" style={{ cursor: 'pointer' }}>Recuérdame</label>
                            </div>
                            <a href="/forgot-password" className="text-decoration-none small fw-bold hover-scale" style={{ color: 'var(--primary-color)' }}>
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>

                        {/* Submit Button */}
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
                                    <span className="fw-bold text-white">Ingresar a Wurger</span>
                                    <i className="bi bi-arrow-right-circle-fill text-white"></i>
                                </>
                            )}
                        </button>

                        {/* Registration Link */}
                        <div className="text-center">
                            <p className="text-light opacity-75 small mb-0 fw-medium">
                                ¿Aún no tienes hambre... digo, cuenta?{' '}
                                <a href="/register" className="fw-bold text-decoration-none hover-scale" style={{ color: 'var(--primary-color)' }}>
                                    Regístrate aquí
                                </a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;