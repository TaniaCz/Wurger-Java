import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import OrderHistory from '../components/OrderHistory';

const ClientDashboard = () => {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('menu');
    const [products, setProducts] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [orderNotes, setOrderNotes] = useState('');
    const [addressError, setAddressError] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal, addToCart } = useCart();

    useEffect(() => {
        const storedUser = localStorage.getItem('usuario');
        if (!storedUser) {
            navigate('/login', { replace: true });
            return;
        }
        setUser(JSON.parse(storedUser));
        fetchProducts();
        fetchPromotions();
    }, [navigate]);

    // Prevent back button after logout
    useEffect(() => {
        const handlePopState = () => {
            const storedUser = localStorage.getItem('usuario');
            if (!storedUser) {
                navigate('/login', { replace: true });
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [navigate]);

    const fetchProducts = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/productos');
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const fetchPromotions = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/promociones');
            if (response.ok) {
                const data = await response.json();
                console.log('All promotions from API:', data);

                const now = new Date();
                const activePromos = data.filter(p => {
                    // Parse dates - backend sends LocalDate as "YYYY-MM-DD"
                    const startDate = new Date(p.inicio + 'T00:00:00');
                    const endDate = new Date(p.fin + 'T23:59:59');

                    const isActive = p.estado === 'Activa';
                    const isInDateRange = now >= startDate && now <= endDate;

                    console.log(`Promo "${p.nombre}": estado=${p.estado}, inicio=${p.inicio}, fin=${p.fin}, isActive=${isActive}, isInDateRange=${isInDateRange}`);

                    return isActive && isInDateRange;
                });

                console.log('Filtered active promotions:', activePromos);
                setPromotions(activePromos);
            }
        } catch (error) {
            console.error("Error fetching promotions:", error);
        }
    };

    const getProductWithDiscount = (product) => {
        const promo = promotions.find(p => p.producto?.id === product.id);
        if (promo) {
            let discountedPrice = product.precioVenta;
            if (promo.tipoDescuento === 'PORCENTAJE') {
                discountedPrice = product.precioVenta * (1 - promo.descuento / 100);
            } else {
                discountedPrice = Math.max(0, product.precioVenta - promo.descuento);
            }

            return {
                ...product,
                precioVenta: discountedPrice,
                precioOriginal: product.precioVenta,
                promoName: promo.nombre,
                promoId: promo.id
            };
        }
        return product;
    };

    const formatPrice = (value) => {
        const price = value < 1000 ? value * 1000 : value;
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    const handleLogout = () => {
        localStorage.removeItem('usuario');
        clearCart();
        window.dispatchEvent(new Event('user-login'));

        // Use window.location.replace to avoid adding to history
        window.location.replace('/login');
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        if (!deliveryAddress || deliveryAddress.trim() === '') {
            setAddressError('La dirección de envío es obligatoria');
            return;
        }

        setAddressError('');
        setLoading(true);

        const payload = {
            idUsuario: user.id,
            direccion: deliveryAddress,
            observaciones: orderNotes || null,
            detalles: cart.map(item => {
                const discountPerUnit = item.originalPrice ? (item.originalPrice - item.precio) : 0;
                const detalle = {
                    idProducto: item.id,
                    cantidad: item.quantity,
                    descuento: discountPerUnit * item.quantity
                };
                // Incluir ID de promoción si existe
                if (item.promoId) {
                    detalle.idPromocion = item.promoId;
                }
                return detalle;
            })
        };

        try {
            const response = await fetch('http://localhost:8080/api/ventas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert('¡Pedido realizado con éxito!');
                clearCart();
                setDeliveryAddress('');
                setOrderNotes('');
                setView('history');
            } else {
                const errorText = await response.text();
                alert('Error al realizar el pedido: ' + errorText);
            }
        } catch (error) {
            console.error("Checkout error:", error);
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="d-flex min-vh-100">
            {/* Glassmorphism Sidebar */}
            <div className="p-3 d-none d-md-block" style={{ width: '280px', position: 'sticky', top: 0, height: '100vh', zIndex: 1000 }}>
                <div className="glass-panel h-100 rounded-4 p-4 d-flex flex-column">
                    <a href="/" className="d-flex align-items-center mb-4 text-decoration-none">
                        <img src="/logo.png" alt="Wurger" style={{ height: '45px', marginRight: '12px' }} />
                        <span className="fs-3 fw-bold" style={{ color: 'var(--primary-color)' }}>Wurger</span>
                    </a>

                    <ul className="nav nav-pills flex-column mb-auto gap-2">
                        <li className="nav-item">
                            <button
                                className={`nav-link w-100 text-start d-flex align-items-center p-3 rounded-3 transition-all ${view === 'menu' ? 'active shadow-sm' : 'text-body'}`}
                                onClick={() => setView('menu')}
                                style={{ background: view === 'menu' ? 'var(--primary-color)' : 'transparent', color: view === 'menu' ? 'white' : 'inherit' }}
                            >
                                <i className="bi bi-grid-fill me-3 fs-5"></i>
                                <span className="fw-medium">Menú</span>
                            </button>
                        </li>
                        <li>
                            <button
                                className={`nav-link w-100 text-start d-flex align-items-center p-3 rounded-3 transition-all ${view === 'cart' ? 'active shadow-sm' : 'text-body'}`}
                                onClick={() => setView('cart')}
                                style={{ background: view === 'cart' ? 'var(--primary-color)' : 'transparent', color: view === 'cart' ? 'white' : 'inherit' }}
                            >
                                <div className="position-relative me-3">
                                    <i className="bi bi-bag-fill fs-5"></i>
                                    {cart.length > 0 && (
                                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light" style={{ fontSize: '0.6rem' }}>
                                            {cart.length}
                                        </span>
                                    )}
                                </div>
                                <span className="fw-medium">Carrito</span>
                            </button>
                        </li>
                        <li>
                            <button
                                className={`nav-link w-100 text-start d-flex align-items-center p-3 rounded-3 transition-all ${view === 'history' ? 'active shadow-sm' : 'text-body'}`}
                                onClick={() => setView('history')}
                                style={{ background: view === 'history' ? 'var(--primary-color)' : 'transparent', color: view === 'history' ? 'white' : 'inherit' }}
                            >
                                <i className="bi bi-clock-history me-3 fs-5"></i>
                                <span className="fw-medium">Mis Pedidos</span>
                            </button>
                        </li>
                    </ul>

                    <div className="mt-auto pt-4 border-top border-secondary-subtle">
                        <button
                            className="btn w-100 mb-3 d-flex align-items-center justify-content-center p-2 rounded-3"
                            onClick={toggleTheme}
                            style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-color)' }}
                        >
                            {theme === 'light' ? <><i className="bi bi-moon-stars-fill me-2"></i> Oscuro</> : <><i className="bi bi-sun-fill me-2"></i> Claro</>}
                        </button>
                        <div className="d-flex align-items-center p-2 rounded-3 mb-3" style={{ background: 'rgba(0,0,0,0.05)' }}>
                            <div className="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center me-3 shadow-sm" style={{ width: 38, height: 38, fontSize: '1.2rem' }}>
                                {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="overflow-hidden">
                                <div className="fw-bold text-truncate">{user.nombre || 'Usuario'}</div>
                                <div className="small text-muted text-truncate" style={{ fontSize: '0.75rem' }}>{user.email}</div>
                            </div>
                        </div>
                        <button
                            className="btn btn-outline-danger w-100 rounded-3"
                            onClick={handleLogout}
                        >
                            <i className="bi bi-box-arrow-right me-2"></i> Salir
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow-1 p-4 overflow-auto">
                {/* Mobile Header */}
                <header className="d-flex d-md-none justify-content-between align-items-center mb-4 glass-panel p-3 rounded-4">
                    <div className="d-flex align-items-center">
                        <img src="/logo.png" alt="Logo" style={{ height: '30px', marginRight: '10px' }} />
                        <span className="fs-5 fw-bold text-primary">Wurger</span>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-secondary position-relative" onClick={() => setView('cart')}>
                            <i className="bi bi-bag"></i>
                            {cart.length > 0 && <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"></span>}
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
                            <i className="bi bi-box-arrow-right"></i>
                        </button>
                    </div>
                </header>

                {/* Hero Section (Only on Menu) */}
                {view === 'menu' && (
                    <div className="glass-panel rounded-4 p-4 p-lg-5 mb-5 position-relative overflow-hidden animate-fade-in">
                        <div className="position-relative z-2">
                            <h1 className="display-5 fw-bold mb-2">
                                ¡Hola, <span style={{ color: 'var(--primary-color)' }}>{user.nombre || 'Amante de las Burgers'}</span>! 👋
                            </h1>
                            <p className="lead text-muted mb-4" style={{ maxWidth: '600px' }}>
                                ¿Listo para probar las mejores hamburguesas de la ciudad? Revisa nuestras promociones exclusivas de hoy.
                            </p>
                            <button className="btn btn-primary btn-lg rounded-pill px-4" onClick={() => document.getElementById('menu-section').scrollIntoView({ behavior: 'smooth' })}>
                                Ver Menú Completo
                            </button>
                        </div>
                        {/* Decorative Background Element */}
                        <div className="position-absolute top-0 end-0 h-100 w-50 d-none d-lg-block"
                            style={{
                                background: 'radial-gradient(circle, rgba(255,159,28,0.1) 0%, rgba(255,255,255,0) 70%)',
                                transform: 'translate(20%, -20%)'
                            }}>
                        </div>
                    </div>
                )}

                <div id="menu-section" className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    {view === 'menu' && (
                        <div className="d-flex flex-column gap-5">
                            {/* Promotions Section */}
                            {promotions.length > 0 && (
                                <div>
                                    <h3 className="mb-4 d-flex align-items-center">
                                        <i className="bi bi-fire text-danger me-2"></i> Promociones Especiales
                                    </h3>
                                    <div className="row flex-nowrap overflow-auto pb-4 px-2" style={{ scrollbarWidth: 'thin' }}>
                                        {promotions.map(promo => {
                                            if (!promo.producto) return null;
                                            const product = getProductWithDiscount(promo.producto);
                                            const daysLeft = Math.ceil((new Date(promo.fin) - new Date()) / (1000 * 60 * 60 * 24));

                                            return (
                                                <div key={promo.id} className="col-10 col-md-6 col-lg-4">
                                                    <div className="glass-card h-100 overflow-hidden position-relative">
                                                        <div className="position-absolute top-0 start-0 m-3 z-2">
                                                            <span className="badge bg-danger rounded-pill px-3 py-2 shadow-sm">
                                                                {promo.tipoDescuento === 'PORCENTAJE' ? `-${promo.descuento}%` : 'OFERTA'}
                                                            </span>
                                                        </div>

                                                        <div className="row g-0 h-100">
                                                            <div className="col-5 position-relative">
                                                                <img
                                                                    src={product.imagen || 'https://placehold.co/600x400?text=Wurger'}
                                                                    className="img-fluid h-100 w-100"
                                                                    alt={product.nombreProducto}
                                                                    style={{ objectFit: 'cover', minHeight: '180px' }}
                                                                />
                                                            </div>
                                                            <div className="col-7 p-3 d-flex flex-column justify-content-between">
                                                                <div>
                                                                    <div className="text-uppercase small fw-bold text-warning mb-1">
                                                                        {promo.nombre}
                                                                    </div>
                                                                    <h5 className="card-title mb-1 text-truncate" title={product.nombreProducto}>
                                                                        {product.nombreProducto}
                                                                    </h5>
                                                                    <p className="small text-muted mb-2 text-truncate">
                                                                        {product.categoria?.nombreCategoria}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <div className="d-flex align-items-end gap-2 mb-3">
                                                                        <span className="h4 mb-0 fw-bold text-primary">
                                                                            {formatPrice(product.precioVenta)}
                                                                        </span>
                                                                        {product.precioOriginal && (
                                                                            <span className="text-decoration-line-through text-muted small mb-1">
                                                                                {formatPrice(product.precioOriginal)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="d-flex justify-content-between align-items-center">
                                                                        <small className="text-muted fst-italic" style={{ fontSize: '0.75rem' }}>
                                                                            <i className="bi bi-clock me-1"></i> {daysLeft > 0 ? `${daysLeft} días` : 'Hoy'}
                                                                        </small>
                                                                        <button
                                                                            className="btn btn-sm btn-primary rounded-pill px-3"
                                                                            onClick={() => addToCart({
                                                                                ...product,
                                                                                nombre: product.nombreProducto,
                                                                                precio: product.precioVenta,
                                                                                originalPrice: product.precioOriginal,
                                                                                promoId: product.promoId
                                                                            })}
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {Object.entries(products.reduce((acc, product) => {
                                const categoryName = product.categoria?.nombreCategoria || 'Otras';
                                if (!acc[categoryName]) {
                                    acc[categoryName] = [];
                                }
                                acc[categoryName].push(getProductWithDiscount(product));
                                return acc;
                            }, {})).map(([categoryName, categoryProducts]) => (
                                <div key={categoryName}>
                                    <h3 className="mb-4 border-bottom pb-2 border-secondary-subtle">
                                        {categoryName}
                                    </h3>
                                    <div className="row g-4">
                                        {categoryProducts.map(product => (
                                            <ProductCard key={product.id} product={product} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {view === 'cart' && (
                        <div className="glass-panel rounded-4 p-4 animate-fade-in">
                            <h2 className="mb-4">Tu Carrito</h2>
                            {cart.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="bi bi-cart-x display-1 text-muted mb-3"></i>
                                    <p className="lead text-muted">Tu carrito está vacío.</p>
                                    <button className="btn btn-primary mt-3" onClick={() => setView('menu')}>
                                        Ir al Menú
                                    </button>
                                </div>
                            ) : (
                                <div className="row g-4">
                                    <div className="col-lg-8">
                                        <div className="list-group list-group-flush rounded-3 overflow-hidden">
                                            {cart.map(item => (
                                                <div key={item.id} className="list-group-item d-flex justify-content-between align-items-center p-3 bg-transparent border-bottom border-secondary-subtle">
                                                    <div className="d-flex align-items-center gap-3">
                                                        {item.imagen && (
                                                            <img src={item.imagen} alt={item.nombre} className="rounded-3 object-fit-cover" style={{ width: 60, height: 60 }} />
                                                        )}
                                                        <div>
                                                            <h6 className="mb-1 fw-bold">
                                                                {item.nombre}
                                                                {item.originalPrice && <span className="badge bg-danger ms-2" style={{ fontSize: '0.6em' }}>OFERTA</span>}
                                                            </h6>
                                                            <div className="text-muted small">
                                                                {formatPrice(item.precio)} c/u
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="input-group input-group-sm" style={{ width: '100px' }}>
                                                            <button className="btn btn-outline-secondary" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                                                            <span className="form-control text-center bg-transparent">{item.quantity}</span>
                                                            <button className="btn btn-outline-secondary" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                                        </div>
                                                        <div className="fw-bold" style={{ minWidth: '80px', textAlign: 'right' }}>
                                                            {formatPrice(item.precio * item.quantity)}
                                                        </div>
                                                        <button className="btn btn-sm btn-outline-danger border-0" onClick={() => removeFromCart(item.id)}>
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="col-lg-4">
                                        <div className="glass-card p-4">
                                            <h4 className="mb-3">Resumen</h4>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Subtotal</span>
                                                <span className="fw-bold">{formatPrice(getCartTotal())}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-4">
                                                <span className="text-muted">Envío</span>
                                                <span className="text-success">Gratis</span>
                                            </div>
                                            <hr />
                                            <div className="d-flex justify-content-between mb-4">
                                                <span className="h5 mb-0">Total</span>
                                                <span className="h4 mb-0 text-primary fw-bold">{formatPrice(getCartTotal())}</span>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label small text-muted">Dirección de Envío</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${addressError ? 'is-invalid' : ''}`}
                                                    value={deliveryAddress}
                                                    onChange={(e) => {
                                                        setDeliveryAddress(e.target.value);
                                                        setAddressError('');
                                                    }}
                                                    placeholder="Calle 123 # 45-67"
                                                />
                                                {addressError && <div className="invalid-feedback">{addressError}</div>}
                                            </div>
                                            <div className="mb-4">
                                                <label className="form-label small text-muted">Notas</label>
                                                <textarea
                                                    className="form-control"
                                                    rows="2"
                                                    placeholder="Instrucciones adicionales..."
                                                    value={orderNotes}
                                                    onChange={(e) => setOrderNotes(e.target.value)}
                                                ></textarea>
                                            </div>

                                            <button
                                                className="btn btn-primary w-100 py-2 rounded-pill shadow-sm"
                                                onClick={handleCheckout}
                                                disabled={loading}
                                            >
                                                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Confirmar Pedido'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'history' && (
                        <div className="glass-panel rounded-4 p-4 animate-fade-in">
                            <h2 className="mb-4">Historial de Pedidos</h2>
                            <OrderHistory userId={user.id} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;
