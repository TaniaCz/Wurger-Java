import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        nombre: '',
        telefono: '',
        direccion: ''
    });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const getPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        return strength;
    };

    const getStrengthColor = (strength) => {
        if (strength === 0) return 'bg-secondary';
        if (strength < 3) return 'bg-danger';
        if (strength === 3) return 'bg-warning';
        return 'bg-success';
    };

    const getStrengthText = (strength) => {
        if (strength === 0) return '';
        if (strength < 3) return 'Débil';
        if (strength === 3) return 'Media';
        return 'Fuerte';
    };

    const validateForm = () => {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        const phoneRegex = /^\d{10}$/;

        if (formData.nombre.length < 3) {
            return 'El nombre debe tener al menos 3 caracteres.';
        }
        if (!emailRegex.test(formData.email)) {
            return 'Por favor, ingresa un correo electrónico válido.';
        }
        if (formData.password.length < 8) {
            return 'La contraseña debe tener al menos 8 caracteres.';
        }
        if (!/[A-Z]/.test(formData.password)) {
            return 'La contraseña debe tener al menos una mayúscula.';
        }
        if (!/[0-9]/.test(formData.password)) {
            return 'La contraseña debe tener al menos un número.';
        }
        if (!/[^A-Za-z0-9]/.test(formData.password)) {
            return 'La contraseña debe tener al menos un carácter especial.';
        }
        if (!phoneRegex.test(formData.telefono)) {
            return 'El teléfono debe tener exactamente 10 dígitos numéricos.';
        }
        if (formData.direccion.length < 10) {
            return 'La dirección debe tener al menos 10 caracteres.';
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8080/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('¡Registro exitoso! Por favor inicia sesión.');
                navigate('/');
            } else {
                const text = await response.text();
                setError(text || 'Error en el registro');
            }
        } catch (error) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 py-5 position-relative" style={{ overflow: 'hidden' }}>
            {/* Appetizing Background Image WITHOUT Blur */}
            <div className="position-absolute w-100 h-100" style={{
                backgroundImage: 'url(/bg_burger.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                filter: 'brightness(0.6)',
                transform: 'scale(1.02)',
                zIndex: 0
            }}></div>

            <div className="card border-0 m-3 w-100 shadow-lg" style={{ 
                maxWidth: '480px', 
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

                    {/* Brand / Title */}
                    <div className="text-center mb-4 mt-2">
                        <img
                            src="/logo.png"
                            alt="Wurger Logo"
                            className="mb-3 hover-scale"
                            style={{ height: '60px', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
                        />
                        <h3 className="fw-bold mb-1 text-white">Crear Cuenta</h3>
                        <p className="text-light opacity-75 small">Únete y disfruta de las mejores hamburguesas</p>
                    </div>

                    {error && (
                        <div className="alert border-0 text-white bg-danger bg-opacity-25 rounded-3 mb-4 py-3 px-3 d-flex align-items-center gap-2 animate-fade-in" role="alert">
                            <i className="bi bi-exclamation-octagon-fill fs-5 text-danger"></i>
                            <span className="small fw-semibold">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Name Input */}
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-light mb-2">Nombre Completo</label>
                            <div className="input-group shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <span className="input-group-text bg-dark border-0 text-primary">
                                    <i className="bi bi-person-fill"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control bg-dark text-white border-0 ps-0"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    required
                                    placeholder="Juan Pérez"
                                    style={{ boxShadow: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Email Input */}
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-light mb-2">Email</label>
                            <div className="input-group shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <span className="input-group-text bg-dark border-0 text-primary">
                                    <i className="bi bi-envelope-fill"></i>
                                </span>
                                <input
                                    type="email"
                                    className="form-control bg-dark text-white border-0 ps-0"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="ejemplo@correo.com"
                                    style={{ boxShadow: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-light mb-2">Contraseña</label>
                            <div className="input-group shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <span className="input-group-text bg-dark border-0 text-primary">
                                    <i className="bi bi-lock-fill"></i>
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-control bg-dark text-white border-0 px-0"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Mínimo 8 caracteres"
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

                            {/* Password Strength Bar */}
                            {formData.password && (
                                <div className="mt-2 animate-fade-in">
                                    <div className="progress bg-dark" style={{ height: '6px', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div
                                            className={`progress-bar ${getStrengthColor(getPasswordStrength(formData.password))}`}
                                            role="progressbar"
                                            style={{
                                                width: `${(getPasswordStrength(formData.password) / 4) * 100}%`,
                                                transition: 'width 0.4s ease'
                                            }}
                                        ></div>
                                    </div>
                                    <div className="d-flex justify-content-between mt-1">
                                        <small className="text-light opacity-75" style={{ fontSize: '0.75rem' }}>Seguridad de contraseña</small>
                                        <small className={`fw-bold text-uppercase`} style={{
                                            fontSize: '0.75rem',
                                            color: getPasswordStrength(formData.password) < 3 ? 'var(--danger-color)' : getPasswordStrength(formData.password) === 3 ? 'var(--warning-color)' : 'var(--success-color)'
                                        }}>
                                            {getStrengthText(getPasswordStrength(formData.password))}
                                        </small>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Telephone Input */}
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-light mb-2">Teléfono</label>
                            <div className="input-group shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <span className="input-group-text bg-dark border-0 text-primary">
                                    <i className="bi bi-telephone-fill"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control bg-dark text-white border-0 ps-0"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                    required
                                    placeholder="3001234567"
                                    maxLength="10"
                                    style={{ boxShadow: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Address Input */}
                        <div className="mb-4">
                            <label className="form-label small fw-bold text-light mb-2">Dirección</label>
                            <div className="input-group shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <span className="input-group-text bg-dark border-0 text-primary">
                                    <i className="bi bi-geo-alt-fill"></i>
                                </span>
                                <textarea
                                    className="form-control bg-dark text-white border-0 ps-0"
                                    name="direccion"
                                    value={formData.direccion}
                                    onChange={handleChange}
                                    required
                                    rows="2"
                                    placeholder="Calle 123 # 45-67, Barrio"
                                    style={{ boxShadow: 'none' }}
                                />
                            </div>
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
                                    <span className="fw-bold text-white">Registrarse</span>
                                    <i className="bi bi-person-plus-fill text-white"></i>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="text-center">
                        <p className="text-light opacity-75 small mb-0 fw-medium">
                            ¿Ya tienes cuenta?{' '}
                            <Link to="/" className="fw-bold text-decoration-none hover-scale" style={{ color: 'var(--primary-color)' }}>
                                Inicia Sesión
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
