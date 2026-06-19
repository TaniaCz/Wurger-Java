import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const CashRegister = () => {
    const [user, setUser] = useState(null);
    const [activeCaja, setActiveCaja] = useState(null);
    const [cajaResumen, setCajaResumen] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pos'); // 'pos' o 'control'
    
    // POS states
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');
    const [customerName, setCustomerName] = useState('Walk-in (Mostrador)');
    const [customerAddress, setCustomerAddress] = useState('En local');
    const [amountPaid, setAmountPaid] = useState('');
    const [changeDue, setChangeDue] = useState(0);
    const [orderNotes, setOrderNotes] = useState('');
    const [receiptOrder, setReceiptOrder] = useState(null); // Para modal de factura
    const [promotions, setPromotions] = useState([]);

    // Form inputs for opening/closing
    const [montoApertura, setMontoApertura] = useState('');
    const [montoCierre, setMontoCierre] = useState('');
    const [cajaObservaciones, setCajaObservaciones] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('usuario');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        checkActiveCaja();
        fetchProducts();
        fetchPromotions();
    }, []);

    useEffect(() => {
        if (activeCaja) {
            fetchCajaResumen(activeCaja.id);
        }
    }, [activeCaja]);

    useEffect(() => {
        // Filter products based on category and search query
        let result = products;
        if (selectedCategory !== 'All') {
            result = result.filter(p => p.categoria?.nombreCategoria === selectedCategory);
        }
        if (searchQuery.trim() !== '') {
            result = result.filter(p => p.nombreProducto.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        setFilteredProducts(result);
    }, [selectedCategory, searchQuery, products]);

    const checkActiveCaja = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8080/api/caja/activa');
            if (response.status === 200) {
                const data = await response.json();
                setActiveCaja(data);
            } else {
                setActiveCaja(null);
                setCajaResumen(null);
            }
        } catch (error) {
            console.error("Error checking active box:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCajaResumen = async (id) => {
        try {
            const response = await fetch(`http://localhost:8080/api/caja/resumen/${id}`);
            if (response.ok) {
                const data = await response.json();
                setCajaResumen(data);
            }
        } catch (error) {
            console.error("Error fetching box summary:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/productos');
            if (response.ok) {
                const data = await response.json();
                const activeProducts = data.filter(p => p.estado === 'Activo');
                setProducts(activeProducts);
                
                // Extract unique categories
                const cats = Array.from(new Set(activeProducts.map(p => p.categoria?.nombreCategoria).filter(Boolean)));
                setCategories(cats);
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

    const handleOpenCaja = async (e) => {
        e.preventDefault();
        if (!montoApertura || parseFloat(montoApertura) < 0) {
            alert('Monto de apertura inválido');
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/caja/abrir', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    montoApertura: parseFloat(montoApertura),
                    idUsuarioApertura: user?.id || 1,
                    observaciones: cajaObservaciones
                })
            });

            if (response.ok) {
                alert('¡Caja abierta con éxito!');
                setMontoApertura('');
                setCajaObservaciones('');
                checkActiveCaja();
            } else {
                const errText = await response.text();
                alert('Error al abrir caja: ' + errText);
            }
        } catch (error) {
            console.error("Error opening box:", error);
            alert('Error de conexión');
        }
    };

    const handleCerrarCaja = async (e) => {
        e.preventDefault();
        if (!montoCierre || parseFloat(montoCierre) < 0) {
            alert('Monto de cierre inválido');
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/caja/cerrar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    montoCierre: parseFloat(montoCierre),
                    idUsuarioCierre: user?.id || 1,
                    observaciones: cajaObservaciones
                })
            });

            if (response.ok) {
                const data = await response.json();
                alert(`Caja cerrada con éxito. Diferencia: ${formatCOP(data.diferencia)}`);
                setMontoCierre('');
                setCajaObservaciones('');
                setActiveCaja(null);
                setCajaResumen(null);
                checkActiveCaja();
            } else {
                const errText = await response.text();
                alert('Error al cerrar caja: ' + errText);
            }
        } catch (error) {
            console.error("Error closing box:", error);
            alert('Error de conexión');
        }
    };

    // POS Cart operations
    const addToCart = (product) => {
        if (product.stock <= 0) {
            alert('Producto sin stock disponible');
            return;
        }

        const existingItem = cart.find(item => item.id === product.id);
        const currentQtyInCart = existingItem ? existingItem.quantity : 0;

        if (currentQtyInCart >= product.stock) {
            alert(`No puedes agregar más de este producto. Stock máximo disponible: ${product.stock}`);
            return;
        }

        const productWithPromo = getProductWithDiscount(product);

        if (existingItem) {
            setCart(cart.map(item => 
                item.id === product.id 
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, {
                id: productWithPromo.id,
                nombre: productWithPromo.nombreProducto,
                precio: productWithPromo.precioVenta,
                originalPrice: productWithPromo.precioOriginal || productWithPromo.precioVenta,
                promoId: productWithPromo.promoId || null,
                promoName: productWithPromo.promoName || null,
                imagen: productWithPromo.imagen,
                quantity: 1,
                stock: productWithPromo.stock
            }]);
        }
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const updateQuantity = (id, newQty) => {
        if (newQty <= 0) {
            removeFromCart(id);
            return;
        }

        const item = cart.find(item => item.id === id);
        if (newQty > item.stock) {
            alert(`Stock máximo disponible: ${item.stock}`);
            return;
        }

        setCart(cart.map(item => 
            item.id === id 
                ? { ...item, quantity: newQty }
                : item
        ));
    };

    const clearCart = () => {
        setCart([]);
        setAmountPaid('');
        setChangeDue(0);
        setOrderNotes('');
        setCustomerName('Walk-in (Mostrador)');
        setCustomerAddress('En local');
    };

    const getCartTotal = () => {
        return cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
    };

    const handleAmountPaidChange = (e) => {
        const val = e.target.value;
        setAmountPaid(val);
        const total = getCartTotal();
        if (val && parseFloat(val) >= total) {
            setChangeDue(parseFloat(val) - total);
        } else {
            setChangeDue(0);
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (!activeCaja) {
            alert('Debes abrir la caja antes de registrar pedidos');
            return;
        }

        const total = getCartTotal();
        if (paymentMethod === 'Efectivo' && (!amountPaid || parseFloat(amountPaid) < total)) {
            alert('El monto pagado debe ser igual o mayor al total del pedido.');
            return;
        }

        const payload = {
            idUsuario: user?.id || 1, // El empleado que atiende
            direccion: customerAddress,
            observaciones: `Cliente: ${customerName} | ${orderNotes}`,
            idCajaSesion: activeCaja.id,
            formaPago: paymentMethod,
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
                const saleData = await response.json();
                
                // Preparar datos para simular factura
                setReceiptOrder({
                    id: saleData.id,
                    fecha: new Date(),
                    cliente: customerName,
                    empleado: user?.nombre || 'Administrador',
                    detalles: cart,
                    total: total,
                    pago: paymentMethod === 'Efectivo' ? parseFloat(amountPaid) : total,
                    cambio: paymentMethod === 'Efectivo' ? changeDue : 0,
                    metodo: paymentMethod
                });

                // Actualizar resumen de caja y refrescar stock
                fetchCajaResumen(activeCaja.id);
                fetchProducts();
                clearCart();
            } else {
                const errText = await response.text();
                alert('Error al registrar pedido: ' + errText);
            }
        } catch (error) {
            console.error("Error at POS checkout:", error);
            alert('Error de conexión');
        }
    };

    const formatCOP = (value) => {
        if (value === null || value === undefined || isNaN(value)) return '$ 0';
        const price = value < 1000 ? value * 1000 : value;
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">Cargando módulo de caja...</p>
            </div>
        );
    }

    // 1. SI LA CAJA ESTÁ CERRADA: MOSTRAR FORMULARIO DE APERTURA
    if (!activeCaja) {
        return (
            <div className="container-fluid animate-fade-in py-4">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="card glass-card-premium border-0 p-4">
                            <div className="text-center mb-4">
                                <div className="d-inline-flex p-3 bg-primary bg-opacity-10 border border-primary border-opacity-20 rounded-circle mb-3 text-primary">
                                    <i className="bi bi-cash-register fs-1"></i>
                                </div>
                                <h3 className="fw-bold">Apertura de Caja</h3>
                                <p className="text-muted small">Ingresa el saldo base en efectivo de la registradora para iniciar el turno.</p>
                            </div>

                            <form onSubmit={handleOpenCaja}>
                                <div className="mb-4">
                                    <label className="form-label small fw-semibold text-muted mb-2">Monto Base / Saldo Inicial (COP) *</label>
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text glass-input-premium border-end-0" style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}>
                                            <i className="bi bi-cash text-muted"></i>
                                        </span>
                                        <input
                                            type="number"
                                            className="form-control glass-input-premium"
                                            value={montoApertura}
                                            onChange={(e) => setMontoApertura(e.target.value)}
                                            placeholder="Ej. 100000"
                                            min="0"
                                            required
                                            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label small fw-semibold text-muted mb-2">Observaciones</label>
                                    <textarea
                                        className="form-control glass-input-premium"
                                        value={cajaObservaciones}
                                        onChange={(e) => setCajaObservaciones(e.target.value)}
                                        placeholder="Ej. Turno mañana, billetes sencillos para cambio"
                                        rows="2"
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary btn-lg w-100 rounded-pill py-2 shadow-sm d-flex align-items-center justify-content-center gap-2">
                                    <i className="bi bi-box-arrow-in-right"></i>
                                    <span>Iniciar Sesión de Caja</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 2. SI LA CAJA ESTÁ ABIERTA: MOSTRAR INTERFAZ COMPLETA (POS Y CONTROL)
    return (
        <div className="container-fluid animate-fade-in">
            {/* Header / Sub-tabs */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h2 className="mb-1">Caja POS & Arqueo</h2>
                    <div className="d-flex align-items-center gap-2 text-success small">
                        <span className="position-relative d-inline-flex">
                            <span className="flex h-2 w-2 rounded-circle bg-success animate-pulse"></span>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-circle bg-success opacity-75"></span>
                        </span>
                        <span>Sesión Activa #{activeCaja.id} | Abierta el {new Date(activeCaja.fechaApertura).toLocaleTimeString()}</span>
                    </div>
                </div>

                <div className="d-flex gap-2">
                    <button 
                        className={`btn rounded-pill px-4 ${activeTab === 'pos' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setActiveTab('pos')}
                    >
                        <i className="bi bi-cart-plus me-2"></i> Hacer Pedido (POS)
                    </button>
                    <button 
                        className={`btn rounded-pill px-4 ${activeTab === 'control' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setActiveTab('control')}
                    >
                        <i className="bi bi-calculator me-2"></i> Control / Cerrar Caja
                    </button>
                </div>
            </div>

            {/* A) POS TAB */}
            {activeTab === 'pos' && (
                <div className="row g-4 animate-fade-in">
                    {/* Grid de Productos Left */}
                    <div className="col-lg-8">
                        {/* Filtros de Categoría */}
                        <div className="d-flex gap-2 overflow-auto pb-3 mb-4" style={{ scrollbarWidth: 'thin' }}>
                            <button
                                className={`btn btn-sm rounded-pill px-3 py-2 text-nowrap transition-all ${selectedCategory === 'All' ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                                onClick={() => setSelectedCategory('All')}
                            >
                                Todos
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    className={`btn btn-sm rounded-pill px-3 py-2 text-nowrap transition-all ${selectedCategory === cat ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Buscador */}
                        <div className="mb-4">
                            <div className="input-group">
                                <span className="input-group-text bg-transparent border-end-0">
                                    <i className="bi bi-search text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-start-0"
                                    placeholder="Buscar producto por nombre..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Product cards container */}
                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-5 glass-panel rounded-4">
                                <i className="bi bi-search display-3 text-muted"></i>
                                <p className="mt-3 text-muted">No se encontraron productos disponibles</p>
                            </div>
                        ) : (
                            <div className="row g-3">
                                {filteredProducts.map(prod => {
                                    const p = getProductWithDiscount(prod);
                                    const hasPromo = p.promoId !== undefined && p.promoId !== null;
                                    return (
                                        <div key={p.id} className="col-md-6 col-xl-4 col-xxl-3">
                                            <div 
                                                className="glass-card h-100 overflow-hidden d-flex flex-column hover-scale"
                                                onClick={() => addToCart(prod)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="position-relative" style={{ height: '120px' }}>
                                                    <img
                                                        src={p.imagen || 'https://placehold.co/400x300?text=Wurger'}
                                                        className="w-100 h-100 object-fit-cover"
                                                        alt={p.nombreProducto}
                                                        onError={(e) => {
                                                            e.target.src = 'https://placehold.co/400x300?text=Wurger';
                                                        }}
                                                    />
                                                    {hasPromo && (
                                                        <span className="position-absolute top-0 start-0 m-2 badge bg-warning text-dark fw-bold shadow-sm">
                                                            {p.promoName}
                                                        </span>
                                                    )}
                                                    <span className={`position-absolute bottom-0 end-0 m-2 badge ${p.stock > 5 ? 'bg-success' : 'bg-danger'}`}>
                                                        Stock: {p.stock}
                                                    </span>
                                                </div>
                                                <div className="p-3 d-flex flex-column flex-grow-1">
                                                    <h6 className="fw-bold mb-1 text-truncate">{p.nombreProducto}</h6>
                                                    <small className="text-muted d-block mb-2">{p.categoria?.nombreCategoria}</small>
                                                    <div className="mt-auto">
                                                        {hasPromo ? (
                                                            <div className="d-flex align-items-baseline gap-2">
                                                                <span className="fw-bold text-danger fs-5">
                                                                    {formatCOP(p.precioVenta)}
                                                                </span>
                                                                <span className="text-decoration-line-through text-muted small">
                                                                    {formatCOP(p.precioOriginal)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="fw-bold text-primary fs-5">
                                                                {formatCOP(p.precioVenta)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Barra lateral del Carrito Right */}
                    <div className="col-lg-4">
                        <div className="glass-panel rounded-4 p-4 sticky-top" style={{ top: '24px', zIndex: 10 }}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold mb-0">Carrito de Ventas</h5>
                                <button className="btn btn-sm btn-outline-danger border-0" onClick={clearCart} title="Vaciar Carrito">
                                    <i className="bi bi-trash"></i>
                                </button>
                            </div>

                            {/* Cart List */}
                            {cart.length === 0 ? (
                                <div className="text-center py-5 my-4">
                                    <i className="bi bi-cart text-muted display-4"></i>
                                    <p className="mt-3 text-muted small">Carrito vacío. Agrega productos de la izquierda.</p>
                                </div>
                            ) : (
                                <div className="mb-4 overflow-auto" style={{ maxHeight: '280px' }}>
                                    <div className="list-group list-group-flush bg-transparent">
                                        {cart.map(item => (
                                            <div key={item.id} className="list-group-item d-flex justify-content-between align-items-center px-0 py-2 bg-transparent border-bottom border-secondary-subtle">
                                                <div className="overflow-hidden me-2" style={{ maxWidth: '160px' }}>
                                                    <span className="fw-bold d-block text-truncate" style={{ fontSize: '0.9rem' }}>
                                                        {item.nombre}
                                                        {item.promoName && (
                                                            <span className="badge bg-warning text-dark ms-1" style={{ fontSize: '0.65rem' }}>
                                                                {item.promoName}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <small className="text-muted">
                                                        {item.originalPrice && item.originalPrice !== item.precio ? (
                                                            <>
                                                                <span className="text-decoration-line-through text-muted me-1 small">{formatCOP(item.originalPrice)}</span>
                                                                <span className="text-danger fw-semibold">{formatCOP(item.precio)}</span>
                                                            </>
                                                        ) : (
                                                            `${formatCOP(item.precio)}`
                                                        )} c/u
                                                    </small>
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="input-group input-group-sm" style={{ width: '80px' }}>
                                                        <button className="btn btn-outline-secondary p-1 px-2" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                                                        <span className="form-control text-center bg-transparent p-1 fw-bold" style={{ fontSize: '0.85rem' }}>{item.quantity}</span>
                                                        <button className="btn btn-outline-secondary p-1 px-2" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                                    </div>
                                                    <span className="fw-bold small text-nowrap" style={{ minWidth: '70px', textAlign: 'right' }}>
                                                        {formatCOP(item.precio * item.quantity)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Form checkout info */}
                            <div className="border-top pt-3">
                                <div className="mb-2">
                                    <label className="form-label small text-muted mb-1">Nombre del Cliente</label>
                                    <input 
                                        type="text" 
                                        className="form-control form-control-sm" 
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Ej. Carlos Mostrador"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small text-muted mb-1">Dirección / Mesa / Canal</label>
                                    <input 
                                        type="text" 
                                        className="form-control form-control-sm" 
                                        value={customerAddress}
                                        onChange={(e) => setCustomerAddress(e.target.value)}
                                        placeholder="Ej. Mesa 4, Para Llevar, Calle 123"
                                    />
                                </div>
                                
                                <div className="row g-2 mb-3">
                                    <div className="col-6">
                                        <label className="form-label small text-muted mb-1">Método Pago</label>
                                        <select 
                                            className="form-select form-select-sm" 
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        >
                                            <option value="Efectivo">Efectivo</option>
                                            <option value="Tarjeta">Tarjeta</option>
                                            <option value="Nequi">Nequi</option>
                                            <option value="Daviplata">Daviplata</option>
                                        </select>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label small text-muted mb-1">Paga Con (Efectivo)</label>
                                        <input 
                                            type="number" 
                                            className="form-control form-control-sm" 
                                            value={amountPaid}
                                            onChange={handleAmountPaidChange}
                                            disabled={paymentMethod !== 'Efectivo'}
                                            placeholder="Monto"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                {paymentMethod === 'Efectivo' && amountPaid && (
                                    <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-success bg-opacity-10 border border-success border-opacity-20 rounded">
                                        <span className="small text-success fw-bold">Cambio a entregar:</span>
                                        <span className="fs-5 fw-bold text-success">{formatCOP(changeDue)}</span>
                                    </div>
                                )}

                                <div className="mb-4">
                                    <label className="form-label small text-muted mb-1">Notas del Pedido</label>
                                    <textarea 
                                        className="form-control form-control-sm" 
                                        value={orderNotes}
                                        onChange={(e) => setOrderNotes(e.target.value)}
                                        placeholder="Sin cebolla, extra salsa..."
                                        rows="1"
                                    />
                                </div>

                                <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                                    <span className="h5 fw-bold mb-0">Total</span>
                                    <span className="h4 fw-bold text-primary mb-0">{formatCOP(getCartTotal())}</span>
                                </div>

                                <button
                                    className="btn btn-warning w-100 py-2 rounded-pill fw-bold shadow-sm"
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0}
                                >
                                    <i className="bi bi-receipt-cutoff me-2"></i> Registrar Venta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* B) CONTROL TAB (ARQUEO Y CIERRE) */}
            {activeTab === 'control' && (
                <div className="row g-4 animate-fade-in">
                    {/* Resumen Financiero actual */}
                    <div className="col-lg-7">
                        <div className="glass-panel rounded-4 p-4 h-100">
                            <h4 className="fw-bold mb-4">Estado del Turno de Caja</h4>
                            {cajaResumen ? (
                                <div className="row g-4">
                                    <div className="col-sm-6">
                                        <div className="p-3 bg-light rounded-3 border">
                                            <small className="text-muted d-block mb-1">Monto de Apertura (Saldo Inicial)</small>
                                            <span className="h4 fw-bold text-dark">{formatCOP(cajaResumen.montoApertura)}</span>
                                        </div>
                                    </div>
                                    <div className="col-sm-6">
                                        <div className="p-3 bg-light rounded-3 border">
                                            <small className="text-muted d-block mb-1">Ventas en Efectivo (+)</small>
                                            <span className="h4 fw-bold text-success">{formatCOP(cajaResumen.ventasEfectivo)}</span>
                                        </div>
                                    </div>
                                    <div className="col-sm-6">
                                        <div className="p-3 bg-light rounded-3 border">
                                            <small className="text-muted d-block mb-1">Ventas otros métodos</small>
                                            <span className="h4 fw-bold text-muted">{formatCOP(cajaResumen.ventasOtros)}</span>
                                        </div>
                                    </div>
                                    <div className="col-sm-6">
                                        <div className="p-3 bg-light rounded-3 border">
                                            <small className="text-muted d-block mb-1">Retiros/Gastos en Efectivo (-)</small>
                                            <span className="h4 fw-bold text-danger">{formatCOP(cajaResumen.gastosCaja)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="col-12 mt-4 pt-3 border-top">
                                        <div className="p-4 rounded-4 bg-primary bg-opacity-5 border border-primary border-opacity-10 d-flex justify-content-between align-items-center">
                                            <div>
                                                <h5 className="fw-bold mb-0 text-primary">Saldo Esperado en Efectivo</h5>
                                                <p className="text-muted small mb-0 mt-1" style={{ fontSize: '0.8rem' }}>Monto Inicial + Ventas Efectivo - Retiros Gasto</p>
                                            </div>
                                            <span className="h2 fw-bold text-primary mb-0">{formatCOP(cajaResumen.montoEsperado)}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted">Cargando cálculos de arqueo...</p>
                            )}
                        </div>
                    </div>

                    {/* Formulario de Cierre de Caja */}
                    <div className="col-lg-5">
                        <div className="card glass-card-premium border-0 p-4">
                            <div className="text-center mb-4">
                                <div className="d-inline-flex p-3 bg-danger bg-opacity-10 border border-danger border-opacity-20 rounded-circle mb-2 text-danger">
                                    <i className="bi bi-lock-fill fs-2"></i>
                                </div>
                                <h4 className="fw-bold">Cierre y Arqueo de Caja</h4>
                                <p className="text-muted small">Cuenta el efectivo físico disponible en cajón e ingresa el total.</p>
                            </div>

                            <form onSubmit={handleCerrarCaja}>
                                <div className="mb-4">
                                    <label className="form-label small fw-semibold text-muted mb-2">Efectivo Real Contado (COP) *</label>
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text glass-input-premium border-end-0" style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}>
                                            <i className="bi bi-safe2 text-muted"></i>
                                        </span>
                                        <input
                                            type="number"
                                            className="form-control glass-input-premium"
                                            value={montoCierre}
                                            onChange={(e) => setMontoCierre(e.target.value)}
                                            placeholder="Monto final contado"
                                            min="0"
                                            required
                                            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label small fw-semibold text-muted mb-2">Observaciones / Diferencias del Cierre</label>
                                    <textarea
                                        className="form-control glass-input-premium"
                                        value={cajaObservaciones}
                                        onChange={(e) => setCajaObservaciones(e.target.value)}
                                        placeholder="Ej. Cuadrado perfecto, o sobraron 2,000 pesos por ajuste de sencillo."
                                        rows="3"
                                    />
                                </div>

                                <button type="submit" className="btn btn-danger btn-lg w-100 rounded-pill py-2 shadow-sm d-flex align-items-center justify-content-center gap-2">
                                    <i className="bi bi-lock"></i>
                                    <span>Cerrar Caja (Arqueo Final)</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* SIMULACIÓN DE RECIBO / FACTURA MODAL */}
            {receiptOrder && createPortal(
                <div className="modal show d-block" tabIndex="-1" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 1100 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '380px', width: '100%' }}>
                        <div className="modal-content border-0 rounded-4" style={{ backgroundColor: '#fff', color: '#000', fontFamily: 'monospace' }}>
                            <div className="modal-body p-4 position-relative">
                                {/* Decoración de bordes de ticket */}
                                <div className="text-center mb-3">
                                    <h4 className="fw-bold mb-0">🍔 WURGER 🍔</h4>
                                    <small className="d-block text-uppercase fw-bold" style={{ fontSize: '0.75rem' }}>Punto de Venta Oficial</small>
                                    <small className="d-block" style={{ fontSize: '0.7rem' }}>Calle 123 # 45-67 | NIT: 12345678-9</small>
                                </div>

                                <hr style={{ borderTop: '2px dashed #000' }} />
                                
                                <div className="small mb-3" style={{ fontSize: '0.75rem' }}>
                                    <div className="d-flex justify-content-between">
                                        <span>Factura No:</span>
                                        <span className="fw-bold">#W-{receiptOrder.id}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span>Fecha:</span>
                                        <span>{receiptOrder.fecha.toLocaleString()}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span>Atendido por:</span>
                                        <span className="text-uppercase">{receiptOrder.empleado}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span>Cliente:</span>
                                        <span className="text-uppercase">{receiptOrder.cliente}</span>
                                    </div>
                                </div>

                                <hr style={{ borderTop: '2px dashed #000' }} />

                                {/* Items list */}
                                <div className="mb-3" style={{ fontSize: '0.75rem' }}>
                                    {receiptOrder.detalles.map((item, idx) => (
                                        <div key={idx} className="mb-1">
                                            <div className="d-flex justify-content-between">
                                                <span>
                                                    {item.nombre}
                                                    {item.promoName && ` (${item.promoName})`}
                                                </span>
                                                <span>{formatCOP(item.precio * item.quantity)}</span>
                                            </div>
                                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                {item.quantity} x {formatCOP(item.precio)}
                                                {item.originalPrice && item.originalPrice !== item.precio && (
                                                    <span className="text-muted ms-1 text-decoration-line-through">({formatCOP(item.originalPrice)})</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <hr style={{ borderTop: '2px dashed #000' }} />

                                {/* Total and Change */}
                                <div style={{ fontSize: '0.8rem' }}>
                                    <div className="d-flex justify-content-between fw-bold mb-1">
                                        <span>TOTAL:</span>
                                        <span>{formatCOP(receiptOrder.total)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.75rem' }}>
                                        <span>Método de Pago:</span>
                                        <span>{receiptOrder.metodo}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.75rem' }}>
                                        <span>Recibido:</span>
                                        <span>{formatCOP(receiptOrder.pago)}</span>
                                    </div>
                                    {receiptOrder.cambio > 0 && (
                                        <div className="d-flex justify-content-between fw-bold text-success mb-1" style={{ fontSize: '0.75rem' }}>
                                            <span>CAMBIO:</span>
                                            <span>{formatCOP(receiptOrder.cambio)}</span>
                                        </div>
                                    )}
                                </div>

                                <hr style={{ borderTop: '2px dashed #000' }} />

                                <div className="text-center mt-3 mb-1" style={{ fontSize: '0.75rem' }}>
                                    <p className="mb-1">¡Gracias por tu compra!</p>
                                    <p className="mb-0 text-muted" style={{ fontSize: '0.65rem' }}>Siguenos en redes @WurgerBurgers</p>
                                    <div className="mt-3 bg-black py-2 text-white font-weight-bold letter-spacing-5 small text-center rounded">
                                        * BARCODE *
                                    </div>
                                </div>

                                <div className="mt-4 d-flex gap-2 justify-content-center no-print">
                                    <button className="btn btn-dark btn-sm rounded-pill px-3" onClick={() => window.print()}>
                                        <i className="bi bi-printer me-1"></i> Imprimir
                                    </button>
                                    <button className="btn btn-secondary btn-sm rounded-pill px-3" onClick={() => setReceiptOrder(null)}>
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default CashRegister;
