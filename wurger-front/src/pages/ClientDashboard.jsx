import { useEffect, useState, useRef } from 'react';
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

    const [coverageStatus, setCoverageStatus] = useState('unchecked'); // 'unchecked', 'loading', 'valid', 'invalid'
    const [coverageMessage, setCoverageMessage] = useState('Verifica tu dirección para comprobar la cobertura de domicilios.');
    const mapRef = useRef(null);
    const userMarkerRef = useRef(null);

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

    useEffect(() => {
        // Destroy map instance if leaving cart view
        if (view !== 'cart') {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                userMarkerRef.current = null;
            }
            return;
        }

        // Wait for container to render in DOM
        const timer = setTimeout(() => {
            const mapContainer = document.getElementById('delivery-map');
            if (!mapContainer || mapRef.current) return;

            try {
                // Main sucursal coords (Zona T, Bogotá)
                const restaurantCoords = [4.6679, -74.0564];

                // Initialize map
                const map = window.L.map('delivery-map').setView(restaurantCoords, 13);
                mapRef.current = map;

                // Load OpenStreetMap tiles
                window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap'
                }).addTo(map);

                // Add restaurant marker
                const restaurantMarker = window.L.marker(restaurantCoords).addTo(map);
                restaurantMarker.bindPopup('<b>🍔 Wurger Principal</b><br>Zona T, Bogotá').openPopup();

                // Draw coverage circle (7 km)
                window.L.circle(restaurantCoords, {
                    color: '#FF9F1C',
                    fillColor: '#FFBF69',
                    fillOpacity: 0.15,
                    radius: 7000 // 7 km in meters
                }).addTo(map);

            } catch (err) {
                console.error("Leaflet initialization error:", err);
            }
        }, 150);

        return () => {
            clearTimeout(timer);
        };
    }, [view]);

    const checkDeliveryCoverage = async () => {
        if (!deliveryAddress || deliveryAddress.trim() === '') {
            setAddressError('Por favor, ingresa una dirección antes de verificar.');
            return;
        }

        setAddressError('');
        setCoverageStatus('loading');
        setCoverageMessage('Buscando dirección en el mapa...');

        try {
            // Call Nominatim Geocoding Web Service
            const query = encodeURIComponent(`${deliveryAddress}, Bogota, Colombia`);
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
            
            if (!response.ok) throw new Error('Error al conectar con el servicio web de mapas.');
            const data = await response.json();

            if (data.length === 0) {
                setCoverageStatus('invalid');
                setCoverageMessage('No se encontró la dirección en Bogotá. Intenta un formato como: Calle 85 # 11-53');
                return;
            }

            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            const restaurantCoords = [4.6679, -74.0564];

            if (mapRef.current) {
                // Calculate distance in meters using Leaflet's built-in distance function
                const distance = mapRef.current.distance([lat, lon], restaurantCoords);

                // Pan map to geocoded position
                mapRef.current.setView([lat, lon], 14);

                // Remove previous address marker if exists
                if (userMarkerRef.current) {
                    userMarkerRef.current.remove();
                }

                // Create and add new marker for client address
                const newMarker = window.L.marker([lat, lon]).addTo(mapRef.current);
                newMarker.bindPopup('<b>Tu Dirección</b>').openPopup();
                userMarkerRef.current = newMarker;

                // Validate if within 7 km (7000 meters)
                if (distance <= 7000) {
                    setCoverageStatus('valid');
                    setCoverageMessage(`¡Cobertura confirmada! Estás a ${(distance / 1000).toFixed(2)} km de Wurger.`);
                } else {
                    setCoverageStatus('invalid');
                    setCoverageMessage(`Fuera de cobertura. Distancia a sucursal: ${(distance / 1000).toFixed(2)} km (máximo permitido: 7 km).`);
                }
            } else {
                throw new Error('El mapa de cobertura no está inicializado.');
            }
        } catch (error) {
            console.error('Error verifying coverage:', error);
            setCoverageStatus('invalid');
            setCoverageMessage('Error al verificar cobertura: ' + error.message);
        }
    };

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
                const now = new Date();
                const activePromos = data.filter(p => {
                    const startDate = new Date(p.inicio + 'T00:00:00');
                    const endDate = new Date(p.fin + 'T23:59:59');
                    const isActive = p.estado === 'Activa';
                    const isInDateRange = now >= startDate && now <= endDate;
                    return isActive && isInDateRange;
                });
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
        window.location.replace('/login');
    };

    const trendingProducts = products.filter(p => !promotions.some(promo => promo.producto?.id === p.id)).slice(0, 4);
    const carouselItems = [
        ...promotions.filter(p => p.producto).map(p => ({ id: `promo-${p.id}`, type: 'promo', data: p })),
        ...trendingProducts.map(p => ({ id: `trend-${p.id}`, type: 'trending', data: p }))
    ];

    useEffect(() => {
        if (carouselItems.length === 0) return;
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % carouselItems.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [carouselItems.length]);

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        if (!deliveryAddress || deliveryAddress.trim() === '') {
            setAddressError('La dirección de envío es obligatoria');
            return;
        }

        if (coverageStatus !== 'valid') {
            setAddressError('Debes verificar tu dirección y confirmar la cobertura en el mapa.');
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
                setCoverageStatus('unchecked');
                setCoverageMessage('Verifica tu dirección para comprobar la cobertura de domicilios.');
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

    const getCategoryIcon = (categoryName) => {
        const name = categoryName.toLowerCase();
        if (name.includes('comida') || name.includes('rapida') || name.includes('hamburguesa') || name.includes('perro')) {
            return 'bi-fire';
        } else if (name.includes('bebida') || name.includes('gaseosa') || name.includes('jugo')) {
            return 'bi-cup-straw';
        } else if (name.includes('postre') || name.includes('dulce') || name.includes('helado')) {
            return 'bi-cookie';
        } else if (name.includes('acompaña') || name.includes('papa') || name.includes('adicional')) {
            return 'bi-grid-3x3-gap-fill';
        }
        return 'bi-tag-fill';
    };

    if (!user) return null;

    return (
        <div className="d-flex min-vh-100">
            {/* Sidebar Navigation */}
            <div className="p-3 d-none d-md-block" style={{ width: '280px', position: 'sticky', top: 0, height: '100vh', zIndex: 1000 }}>
                <div className="glass-panel h-100 rounded-4 p-4 d-flex flex-column border border-white border-opacity-10 shadow">
                    <a href="/" className="d-flex align-items-center mb-5 text-decoration-none hover-scale">
                        <img src="/logo.png" alt="Wurger" style={{ height: '42px', marginRight: '12px' }} />
                        <span className="fs-3 fw-bold" style={{ color: 'var(--primary-color)', textShadow: '0 0 10px rgba(255,159,28,0.2)' }}>Wurger</span>
                    </a>

                    <ul className="nav nav-pills flex-column mb-auto gap-2">
                        <li className="nav-item">
                            <button
                                className={`nav-link w-100 text-start d-flex align-items-center p-3 rounded-3 transition-all ${view === 'menu' ? 'active shadow-sm' : 'text-body'}`}
                                onClick={() => setView('menu')}
                                style={{ background: view === 'menu' ? 'var(--primary-color)' : 'transparent', color: view === 'menu' ? 'white' : 'inherit' }}
                            >
                                <i className="bi bi-grid-fill me-3 fs-5"></i>
                                <span className="fw-semibold">Menú Completo</span>
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
                                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light animate-pulse" style={{ fontSize: '0.65rem' }}>
                                            {cart.length}
                                        </span>
                                    )}
                                </div>
                                <span className="fw-semibold">Mi Carrito</span>
                            </button>
                        </li>
                        <li>
                            <button
                                className={`nav-link w-100 text-start d-flex align-items-center p-3 rounded-3 transition-all ${view === 'history' ? 'active shadow-sm' : 'text-body'}`}
                                onClick={() => setView('history')}
                                style={{ background: view === 'history' ? 'var(--primary-color)' : 'transparent', color: view === 'history' ? 'white' : 'inherit' }}
                            >
                                <i className="bi bi-clock-history me-3 fs-5"></i>
                                <span className="fw-semibold">Mis Pedidos</span>
                            </button>
                        </li>
                    </ul>

                    {/* Sidebar Footer */}
                    <div className="mt-auto pt-4 border-top border-secondary-subtle">
                        <button
                            className="btn w-100 mb-3 d-flex align-items-center justify-content-center p-2 rounded-3 transition-all"
                            onClick={toggleTheme}
                            style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-color)' }}
                        >
                            {theme === 'light' ? <><i className="bi bi-moon-stars-fill me-2 text-primary"></i> Oscuro</> : <><i className="bi bi-sun-fill me-2 text-warning"></i> Claro</>}
                        </button>
                        
                        <div className="d-flex align-items-center p-2.5 rounded-3 mb-3 border border-white border-opacity-10" style={{ background: 'rgba(0,0,0,0.03)' }}>
                            <div className="rounded-circle bg-primary text-white fw-bold d-flex justify-content-center align-items-center me-3 shadow-sm" style={{ width: 38, height: 38, fontSize: '1.1rem' }}>
                                {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="overflow-hidden">
                                <div className="fw-bold text-truncate" style={{ fontSize: '0.9rem' }}>{user.nombre || 'Usuario'}</div>
                                <div className="small text-muted text-truncate" style={{ fontSize: '0.75rem' }}>{user.email}</div>
                            </div>
                        </div>

                        <button
                            className="btn btn-outline-danger w-100 rounded-3 hover-scale"
                            onClick={handleLogout}
                        >
                            <i className="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow-1 p-4 overflow-auto">
                {/* Mobile Navigation Header */}
                <header className="d-flex d-md-none justify-content-between align-items-center mb-4 glass-panel p-3 rounded-4 border border-white border-opacity-10">
                    <div className="d-flex align-items-center">
                        <img src="/logo.png" alt="Logo" style={{ height: '30px', marginRight: '10px' }} />
                        <span className="fs-5 fw-bold text-primary">Wurger</span>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-secondary position-relative" onClick={() => setView('cart')}>
                            <i className="bi bi-bag"></i>
                            {cart.length > 0 && <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle animate-pulse"></span>}
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
                            <i className="bi bi-box-arrow-right"></i>
                        </button>
                    </div>
                </header>

                {/* Hero Section Banner (Menu view only) */}
                {view === 'menu' && (
                    <div className="glass-panel rounded-4 p-4 p-lg-5 mb-5 position-relative overflow-hidden animate-fade-in" 
                         style={{ 
                             background: 'linear-gradient(135deg, rgba(255, 159, 28, 0.15) 0%, rgba(46, 196, 182, 0.05) 100%)',
                             border: '1px solid rgba(255, 159, 28, 0.15)'
                         }}>
                        <div className="position-relative z-2">
                            <span className="badge bg-warning text-dark rounded-pill px-3 py-1.5 fw-bold mb-3 small shadow-sm animate-pulse">🍔 SABORES QUE ENAMORAN</span>
                            <h1 className="display-4 fw-bold mb-2">
                                ¡Hola, <span style={{ color: 'var(--primary-color)' }}>{user.nombre || 'Gourmet'}</span>! 👋
                            </h1>
                            <p className="lead text-muted mb-4" style={{ maxWidth: '600px', fontSize: '1.05rem' }}>
                                ¿Listo para deleitarte con las mejores hamburguesas artesanales? Preparamos cada orden al instante con ingredientes frescos y seleccionados.
                            </p>
                            <button className="btn btn-primary btn-lg rounded-pill px-4 shadow-md hover-scale" 
                                    onClick={() => document.getElementById('menu-list-start').scrollIntoView({ behavior: 'smooth' })}>
                                Explora el Menú <i className="bi bi-arrow-right-short ms-1"></i>
                            </button>
                        </div>
                        {/* Mesh decorative backlights */}
                        <div className="position-absolute top-0 end-0 h-100 w-50 d-none d-lg-block"
                            style={{
                                background: 'radial-gradient(circle, rgba(255,159,28,0.15) 0%, rgba(255,255,255,0) 75%)',
                                transform: 'translate(10%, -20%)'
                            }}>
                        </div>
                    </div>
                )}

                {/* Render Views dynamically */}
                <div id="menu-list-start" className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    {view === 'menu' && (
                        <div className="d-flex flex-column gap-5">
                            {/* Promotions and Trending Carrousel */}
                            {carouselItems.length > 0 && (
                                <div className="mb-5">
                                    <h3 className="mb-4 d-flex align-items-center fw-bold">
                                        <i className="bi bi-star-fill text-warning me-2.5 fs-4 animate-pulse"></i> Destacados para ti
                                    </h3>
                                    <div className="promotion-carousel shadow-lg mb-3">
                                        <div className="carousel-track h-100" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                                            {carouselItems.map((item, index) => {
                                                const isPromo = item.type === 'promo';
                                                const product = isPromo ? getProductWithDiscount(item.data.producto) : item.data;
                                                const promoName = isPromo ? item.data.nombre : 'Tendencia';
                                                const discountInfo = isPromo 
                                                    ? (item.data.tipoDescuento === 'PORCENTAJE' ? `-${item.data.descuento}%` : `AHORRA ${formatPrice(item.data.descuento)}`)
                                                    : 'LO MÁS VENDIDO';
                                                    
                                                let daysLeft = 0;
                                                if (isPromo) {
                                                    daysLeft = Math.ceil((new Date(item.data.fin) - new Date()) / (1000 * 60 * 60 * 24));
                                                }

                                                return (
                                                    <div key={item.id} className="w-100 flex-shrink-0 p-0 m-0" style={{ transition: 'opacity 0.5s ease' }}>
                                                        <div className="glass-card w-100 overflow-hidden position-relative border border-opacity-25" style={{ height: '240px', borderColor: isPromo ? 'var(--danger-color)' : 'var(--primary-color)' }}>
                                                            <div className="position-absolute top-0 start-0 m-3 z-2">
                                                                <span className={`badge ${isPromo ? 'bg-danger' : 'bg-warning text-dark'} rounded-pill px-3 py-1.5 shadow-sm text-uppercase fw-bold`} style={{ fontSize: '0.8rem' }}>
                                                                    {isPromo && <i className="bi bi-fire me-1"></i>} {discountInfo}
                                                                </span>
                                                            </div>

                                                            <div className="row g-0 h-100">
                                                                <div className="col-5 position-relative h-100">
                                                                    <img
                                                                        src={product.imagen || 'https://placehold.co/600x400?text=Wurger'}
                                                                        className="img-fluid h-100 w-100 object-fit-cover"
                                                                        alt={product.nombreProducto}
                                                                        onError={(e) => {
                                                                            e.target.src = 'https://placehold.co/600x400?text=Wurger';
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="col-7 p-4 d-flex flex-column justify-content-center h-100">
                                                                    <div>
                                                                        <div className={`text-uppercase small fw-bold ${isPromo ? 'text-warning' : 'text-primary'} mb-1`} style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                                                                            {promoName}
                                                                        </div>
                                                                        <h4 className="card-title fw-bold mb-2 text-truncate" title={product.nombreProducto}>
                                                                            {product.nombreProducto}
                                                                        </h4>
                                                                    </div>
                                                                    <div className="mt-auto">
                                                                        <div className="d-flex align-items-end gap-2 mb-3">
                                                                            <span className="h3 mb-0 fw-bold text-primary">
                                                                                {formatPrice(product.precioVenta)}
                                                                            </span>
                                                                            {product.precioOriginal && (
                                                                                <span className="text-decoration-line-through text-muted mb-1">
                                                                                    {formatPrice(product.precioOriginal)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="d-flex justify-content-between align-items-center">
                                                                            <small className="text-muted fst-italic">
                                                                                {isPromo ? (
                                                                                    <><i className="bi bi-clock me-1 text-warning"></i> {daysLeft > 0 ? `${daysLeft} días restantes` : 'Termina hoy'}</>
                                                                                ) : (
                                                                                    <><i className="bi bi-graph-up-arrow me-1 text-success"></i> Popular entre clientes</>
                                                                                )}
                                                                            </small>
                                                                            <button
                                                                                className="btn btn-primary rounded-pill px-4 py-2 hover-scale shadow-sm"
                                                                                onClick={() => addToCart({
                                                                                    ...product,
                                                                                    nombre: product.nombreProducto,
                                                                                    precio: product.precioVenta,
                                                                                    originalPrice: product.precioOriginal,
                                                                                    promoId: product.promoId
                                                                                })}
                                                                            >
                                                                                <i className="bi bi-plus-lg me-1"></i> Agregar
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
                                    
                                    {/* Carousel Controls (Outside to prevent overlap) */}
                                    <div className="d-flex justify-content-center align-items-center gap-3">
                                        <button 
                                            className="carousel-arrow"
                                            onClick={() => setCurrentSlide(prev => (prev === 0 ? carouselItems.length - 1 : prev - 1))}
                                        >
                                            <i className="bi bi-chevron-left"></i>
                                        </button>
                                        <div className="carousel-dots">
                                            {carouselItems.map((_, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className={`carousel-dot ${currentSlide === idx ? 'active' : ''}`}
                                                    onClick={() => setCurrentSlide(idx)}
                                                ></div>
                                            ))}
                                        </div>
                                        <button 
                                            className="carousel-arrow"
                                            onClick={() => setCurrentSlide(prev => (prev + 1) % carouselItems.length)}
                                        >
                                            <i className="bi bi-chevron-right"></i>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Categorías y Listado General */}
                            {Object.entries(products.reduce((acc, product) => {
                                const categoryName = product.categoria?.nombreCategoria || 'Otras';
                                if (!acc[categoryName]) {
                                    acc[categoryName] = [];
                                }
                                acc[categoryName].push(getProductWithDiscount(product));
                                return acc;
                            }, {})).map(([categoryName, categoryProducts]) => (
                                <div key={categoryName}>
                                    <h3 className="mb-4 d-flex align-items-center fw-bold border-bottom pb-3 border-secondary-subtle">
                                        <i className={`bi ${getCategoryIcon(categoryName)} text-primary me-2.5 fs-4`}></i>
                                        <span>{categoryName}</span>
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

                    {/* VIEW: CART CHECKOUT */}
                    {view === 'cart' && (
                        <div className="glass-panel rounded-4 p-4 p-sm-5 border border-white border-opacity-10 shadow animate-fade-in">
                            <h2 className="fw-bold mb-4">Tu Carrito de Compra</h2>
                            
                            {cart.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="bi bi-bag-x display-1 text-muted opacity-50 mb-3"></i>
                                    <p className="lead text-muted">Aún no has agregado hamburguesas a tu carrito.</p>
                                    <button className="btn btn-primary rounded-pill px-4 mt-3 hover-scale" onClick={() => setView('menu')}>
                                        Ver Carta del Menú
                                    </button>
                                </div>
                            ) : (
                                <div className="row g-4">
                                    {/* Items List */}
                                    <div className="col-lg-8">
                                        <div className="list-group list-group-flush rounded-3 overflow-hidden border border-secondary-subtle">
                                            {cart.map(item => (
                                                <div key={item.id} className="list-group-item d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center p-3 bg-transparent border-bottom border-secondary-subtle gap-2">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <img 
                                                            src={item.imagen || 'https://placehold.co/100x100?text=Wurger'} 
                                                            alt={item.nombre} 
                                                            className="rounded-3 object-fit-cover shadow-sm border" 
                                                            style={{ width: 64, height: 64 }} 
                                                            onError={(e) => {
                                                                e.target.src = 'https://placehold.co/100x100?text=Wurger';
                                                            }}
                                                        />
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
                                                    
                                                    <div className="d-flex align-items-center justify-content-between w-100 w-sm-auto gap-4 mt-2 mt-sm-0">
                                                        <div className="input-group input-group-sm" style={{ width: '100px' }}>
                                                            <button className="btn btn-outline-secondary px-2" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                                                            <span className="form-control text-center bg-transparent fw-bold" style={{ fontSize: '0.9rem' }}>{item.quantity}</span>
                                                            <button className="btn btn-outline-secondary px-2" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                                        </div>
                                                        <div className="fw-bold text-end" style={{ minWidth: '90px' }}>
                                                            {formatPrice(item.precio * item.quantity)}
                                                        </div>
                                                        <button className="btn btn-sm btn-outline-danger border-0 p-1" onClick={() => removeFromCart(item.id)}>
                                                            <i className="bi bi-trash fs-5"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Order Summary Drawer style */}
                                    <div className="col-lg-4">
                                        <div className="glass-card border border-white border-opacity-10 p-4 shadow-sm">
                                            <h4 className="fw-bold mb-4 border-bottom pb-2">Resumen</h4>
                                            
                                            <div className="d-flex justify-content-between mb-2 small text-muted">
                                                <span>Subtotal del Pedido</span>
                                                <span className="fw-bold">{formatPrice(getCartTotal())}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-3 small text-muted">
                                                <span>Envío / Delivery</span>
                                                <span className="text-success fw-bold">¡Gratuito!</span>
                                            </div>
                                            
                                            <hr className="my-3" />
                                            
                                            <div className="d-flex justify-content-between align-items-center mb-4">
                                                <span className="h5 fw-bold mb-0">Total</span>
                                                <span className="h3 fw-bold text-primary mb-0">{formatPrice(getCartTotal())}</span>
                                            </div>
                                            
                                            {/* Delivery Details */}
                                            <div className="mb-3">
                                                <label className="form-label small fw-semibold text-muted mb-1.5">Dirección de Envío *</label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-transparent border-end-0">
                                                        <i className="bi bi-geo-alt text-muted"></i>
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className={`form-control border-start-0 border-end-0 ${addressError ? 'is-invalid' : ''}`}
                                                        value={deliveryAddress}
                                                        onChange={(e) => {
                                                            setDeliveryAddress(e.target.value);
                                                            setAddressError('');
                                                            if (coverageStatus !== 'unchecked') setCoverageStatus('unchecked');
                                                        }}
                                                        placeholder="Calle 85 # 11-53, Bogota"
                                                    />
                                                    <button 
                                                        className="btn btn-outline-primary fw-bold px-3" 
                                                        type="button"
                                                        onClick={checkDeliveryCoverage}
                                                        disabled={coverageStatus === 'loading'}
                                                    >
                                                        {coverageStatus === 'loading' ? (
                                                            <span className="spinner-border spinner-border-sm" role="status"></span>
                                                        ) : (
                                                            <span>Verificar</span>
                                                        )}
                                                    </button>
                                                    {addressError && <div className="invalid-feedback">{addressError}</div>}
                                                </div>

                                                {coverageMessage && (
                                                    <div className={`mt-2 small p-2.5 rounded-3 d-flex align-items-center gap-2 border ${
                                                        coverageStatus === 'valid' ? 'bg-success bg-opacity-10 text-success border-success border-opacity-20' :
                                                        coverageStatus === 'invalid' ? 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-20' :
                                                        'bg-light text-muted border-secondary border-opacity-10'
                                                    }`}>
                                                        <i className={`bi ${
                                                            coverageStatus === 'valid' ? 'bi-check-circle-fill' :
                                                            coverageStatus === 'invalid' ? 'bi-exclamation-triangle-fill' :
                                                            'bi-info-circle-fill'
                                                        }`}></i>
                                                        <span>{coverageMessage}</span>
                                                    </div>
                                                )}

                                                <div 
                                                    id="delivery-map" 
                                                    className="mt-3 rounded-4 shadow-sm border border-secondary border-opacity-25" 
                                                    style={{ height: '260px', width: '100%', zIndex: 1 }}
                                                ></div>
                                            </div>
                                            
                                            <div className="mb-4">
                                                <label className="form-label small fw-semibold text-muted mb-1.5">Notas o Sugerencias</label>
                                                <textarea
                                                    className="form-control"
                                                    rows="2"
                                                    placeholder="Ej: Sin cebolla, salsas aparte, portería..."
                                                    value={orderNotes}
                                                    onChange={(e) => setOrderNotes(e.target.value)}
                                                ></textarea>
                                            </div>

                                            <button
                                                className="btn btn-primary btn-lg w-100 rounded-pill py-2.5 shadow-sm fw-bold hover-scale d-flex align-items-center justify-content-center gap-2"
                                                onClick={handleCheckout}
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                                ) : (
                                                    <>
                                                        <span>Confirmar Pedido</span>
                                                        <i className="bi bi-check-circle"></i>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* VIEW: ORDER HISTORY */}
                    {view === 'history' && (
                        <div className="glass-panel rounded-4 p-4 p-sm-5 border border-white border-opacity-10 shadow animate-fade-in">
                            <h2 className="fw-bold mb-4">Mi Historial de Pedidos</h2>
                            <OrderHistory userId={user.id} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;
