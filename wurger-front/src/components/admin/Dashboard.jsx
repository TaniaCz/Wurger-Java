import { useState, useEffect } from 'react';

const Dashboard = ({ onNavigate }) => {
    const [kpis, setKpis] = useState({
        ventasHoy: 0,
        ventasSemana: 0,
        gastosHoy: 0,
        pedidosPendientes: 0,
        productosStockBajo: 0,
        totalProductos: 0,
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cajaActiva, setCajaActiva] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch all data concurrently
            const [ventasRes, gastosRes, pedidosRes, stockRes, cajaRes] = await Promise.allSettled([
                fetch('http://localhost:8080/api/ventas'),
                fetch('http://localhost:8080/api/gastos'),
                fetch('http://localhost:8080/api/pedidos'),
                fetch('http://localhost:8080/api/productos'),
                fetch('http://localhost:8080/api/caja/activa'),
            ]);

            const today = new Date().toISOString().split('T')[0];
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            let ventasHoy = 0, ventasSemana = 0, gastosHoy = 0;
            let pedidosPendientes = 0, productosStockBajo = 0, totalProductos = 0;

            // Ventas
            if (ventasRes.status === 'fulfilled' && ventasRes.value.ok) {
                const ventas = await ventasRes.value.json();
                ventas.forEach(v => {
                    const fecha = v.fecha ? v.fecha.split('T')[0] : '';
                    if (fecha === today) ventasHoy += v.total || 0;
                    if (fecha >= weekAgo) ventasSemana += v.total || 0;
                });
                setRecentOrders(ventas.slice(-5).reverse());
            }

            // Gastos
            if (gastosRes.status === 'fulfilled' && gastosRes.value.ok) {
                const gastos = await gastosRes.value.json();
                gastos.forEach(g => {
                    const fecha = g.fecha ? g.fecha.split('T')[0] : '';
                    if (fecha === today) gastosHoy += g.monto || 0;
                });
            }

            // Pedidos
            if (pedidosRes.status === 'fulfilled' && pedidosRes.value.ok) {
                const pedidos = await pedidosRes.value.json();
                pedidosPendientes = pedidos.filter(p => p.estado === 'PENDIENTE' || p.estado === 'EN_PREPARACION').length;
            }

            // Stock
            if (stockRes.status === 'fulfilled' && stockRes.value.ok) {
                const productos = await stockRes.value.json();
                totalProductos = productos.length;
                const lowStock = productos.filter(p => p.stock !== undefined && p.stock !== null && p.stock <= 5);
                productosStockBajo = lowStock.length;
                setLowStockItems(lowStock.slice(0, 5));
            }

            // Caja
            if (cajaRes.status === 'fulfilled' && cajaRes.value.ok) {
                const caja = await cajaRes.value.json();
                setCajaActiva(caja);
            }

            setKpis({ ventasHoy, ventasSemana, gastosHoy, pedidosPendientes, productosStockBajo, totalProductos });
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fmtCurrency = (val) =>
        new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(val);

    const hora = new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
    const fecha = new Date().toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const kpiCards = [
        {
            id: 'ventas-hoy',
            title: 'Ventas de Hoy',
            value: fmtCurrency(kpis.ventasHoy),
            icon: 'bi-cash-stack',
            gradient: 'var(--primary-gradient)',
            subtitle: `Semana: ${fmtCurrency(kpis.ventasSemana)}`,
            iconColor: '#FF9F1C',
        },
        {
            id: 'gastos-hoy',
            title: 'Gastos de Hoy',
            value: fmtCurrency(kpis.gastosHoy),
            icon: 'bi-wallet2',
            gradient: 'var(--danger-gradient)',
            subtitle: 'Egresos registrados',
            iconColor: '#ef4444',
            view: 'expenses',
        },
        {
            id: 'balance-hoy',
            title: 'Balance del Día',
            value: fmtCurrency(kpis.ventasHoy - kpis.gastosHoy),
            icon: 'bi-graph-up-arrow',
            gradient: 'var(--success-gradient)',
            subtitle: 'Ingresos − Gastos',
            iconColor: '#10b981',
            positive: (kpis.ventasHoy - kpis.gastosHoy) >= 0,
        },
        {
            id: 'pedidos-pendientes',
            title: 'Pedidos Pendientes',
            value: kpis.pedidosPendientes,
            icon: 'bi-clock-history',
            gradient: 'var(--warning-gradient)',
            subtitle: 'En preparación / pendientes',
            iconColor: '#f59e0b',
            view: 'orders',
        },
        {
            id: 'stock-bajo',
            title: 'Stock Bajo',
            value: kpis.productosStockBajo,
            icon: 'bi-exclamation-triangle-fill',
            gradient: 'var(--danger-gradient)',
            subtitle: `De ${kpis.totalProductos} productos`,
            iconColor: '#ef4444',
            alert: kpis.productosStockBajo > 0,
            view: 'stock',
        },
        {
            id: 'caja-estado',
            title: 'Estado de Caja',
            value: cajaActiva ? 'ABIERTA' : 'CERRADA',
            icon: cajaActiva ? 'bi-unlock-fill' : 'bi-lock-fill',
            gradient: cajaActiva ? 'var(--success-gradient)' : 'linear-gradient(135deg,#64748b,#94a3b8)',
            subtitle: cajaActiva ? `ID: #${cajaActiva.id}` : 'Sin sesión activa',
            iconColor: cajaActiva ? '#10b981' : '#64748b',
            view: 'caja',
        },
    ];

    if (loading) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                <div className="text-center">
                    <div className="spinner-border mb-3" style={{ color: 'var(--primary-color)', width: '3rem', height: '3rem' }} role="status" />
                    <p className="text-muted fw-semibold">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-4 gap-3">
                <div>
                    <h2 className="fw-bold mb-1" style={{ fontSize: '1.8rem' }}>
                        <i className="bi bi-speedometer2 me-2" style={{ color: 'var(--primary-color)' }} />
                        Panel Principal
                    </h2>
                    <p className="text-muted mb-0 text-capitalize">{fecha} · {hora}</p>
                </div>
                <button
                    id="dashboard-refresh-btn"
                    className="btn btn-primary rounded-3 d-flex align-items-center gap-2 px-4"
                    onClick={fetchDashboardData}
                >
                    <i className="bi bi-arrow-clockwise" />
                    Actualizar
                </button>
            </div>

            {/* KPI Cards */}
            <div className="row g-3 mb-4">
                {kpiCards.map((card) => (
                    <div key={card.id} className="col-12 col-sm-6 col-xl-4">
                        <div
                            id={card.id}
                            className="glass-card stat-card p-4 h-100"
                            onClick={card.view && onNavigate ? () => onNavigate(card.view) : undefined}
                            style={{
                                borderLeft: `4px solid ${card.iconColor}`,
                                animation: card.alert ? 'glow 2s ease-in-out infinite' : 'none',
                                cursor: card.view ? 'pointer' : 'default',
                            }}
                        >
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.05em' }}>
                                    {card.title}
                                </span>
                                <div
                                    className="rounded-3 d-flex align-items-center justify-content-center"
                                    style={{
                                        width: '42px',
                                        height: '42px',
                                        background: card.gradient,
                                        boxShadow: `0 4px 15px ${card.iconColor}44`,
                                    }}
                                >
                                    <i className={`bi ${card.icon} text-white fs-5`} />
                                </div>
                            </div>
                            <div
                                className="fw-bold mb-1"
                                style={{
                                    fontSize: '1.6rem',
                                    color: card.alert ? '#ef4444' : 'var(--text-color)',
                                }}
                            >
                                {card.value}
                            </div>
                            <small className="text-muted">{card.subtitle}</small>
                        </div>
                    </div>
                ))}
            </div>

            {/* Lower Section: Recent Transactions + Low Stock */}
            <div className="row g-3">
                {/* Recent Sales */}
                <div className="col-12 col-lg-7">
                    <div className="glass-panel rounded-4 p-4 h-100">
                        <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                            <i className="bi bi-receipt" style={{ color: 'var(--primary-color)' }} />
                            Últimas Transacciones
                        </h6>
                        {recentOrders.length === 0 ? (
                            <div className="text-center text-muted py-4">
                                <i className="bi bi-inbox fs-1 d-block mb-2" />
                                No hay transacciones registradas hoy.
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th className="text-muted small fw-semibold border-0">#</th>
                                            <th className="text-muted small fw-semibold border-0">Cliente</th>
                                            <th className="text-muted small fw-semibold border-0">Total</th>
                                            <th className="text-muted small fw-semibold border-0">Método</th>
                                            <th className="text-muted small fw-semibold border-0">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map((v, i) => (
                                            <tr key={v.id || i}>
                                                <td className="fw-semibold text-muted small">#{v.id}</td>
                                                <td>
                                                    <span className="fw-medium" style={{ fontSize: '0.9rem' }}>
                                                        {v.nombreCliente || v.usuario?.nombre || 'Mostrador'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="fw-bold" style={{ color: 'var(--primary-color)' }}>
                                                        {fmtCurrency(v.total || 0)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="badge rounded-pill"
                                                        style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', fontSize: '0.75rem' }}>
                                                        {v.metodoPago || 'Efectivo'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="badge rounded-pill"
                                                        style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.75rem' }}>
                                                        <i className="bi bi-check-circle me-1" />
                                                        Completada
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="col-12 col-lg-5">
                    <div className="glass-panel rounded-4 p-4 h-100">
                        <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                            <i className="bi bi-exclamation-triangle-fill" style={{ color: '#f59e0b' }} />
                            Alertas de Stock Bajo
                        </h6>
                        {lowStockItems.length === 0 ? (
                            <div className="text-center text-muted py-4">
                                <i className="bi bi-check-circle-fill fs-1 d-block mb-2" style={{ color: '#10b981' }} />
                                <p className="mb-0 fw-medium">¡Todo el stock está bien!</p>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                {lowStockItems.map((p, i) => (
                                    <div
                                        key={p.id || i}
                                        className="d-flex align-items-center justify-content-between p-3 rounded-3"
                                        style={{
                                            background: p.stock === 0
                                                ? 'rgba(239,68,68,0.1)'
                                                : 'rgba(245,158,11,0.08)',
                                            borderLeft: `3px solid ${p.stock === 0 ? '#ef4444' : '#f59e0b'}`,
                                        }}
                                    >
                                        <div>
                                            <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                                                {p.nombreProducto}
                                            </div>
                                            <small className="text-muted">{p.categoria?.nombreCategoria || 'Sin categoría'}</small>
                                        </div>
                                        <span
                                            className="badge rounded-3 fw-bold"
                                            style={{
                                                background: p.stock === 0 ? '#ef4444' : '#f59e0b',
                                                color: 'white',
                                                fontSize: '0.85rem',
                                                minWidth: '48px',
                                                textAlign: 'center',
                                            }}
                                        >
                                            {p.stock === 0 ? 'AGOTADO' : `${p.stock} uds`}
                                        </span>
                                    </div>
                                ))}
                                {kpis.productosStockBajo > 5 && (
                                    <p className="text-muted text-center small mt-1">
                                        +{kpis.productosStockBajo - 5} productos más con stock bajo
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-panel rounded-4 p-4 mt-3">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <i className="bi bi-lightning-fill" style={{ color: 'var(--primary-color)' }} />
                    Acciones Rápidas
                </h6>
                <div className="d-flex flex-wrap gap-2">
                    {[
                        { id: 'quick-caja', icon: 'bi-cash-coin', label: 'Ir a Caja POS', view: 'caja', color: 'var(--primary-color)' },
                        { id: 'quick-orders', icon: 'bi-cart-check', label: 'Ver Pedidos', view: 'orders', color: '#3b82f6' },
                        { id: 'quick-products', icon: 'bi-box-seam', label: 'Productos', view: 'products', color: '#10b981' },
                        { id: 'quick-reports', icon: 'bi-bar-chart-fill', label: 'Reportes', view: 'reports', color: '#8b5cf6' },
                        { id: 'quick-campaigns', icon: 'bi-envelope-paper', label: 'Campañas', view: 'campaigns', color: '#f59e0b' },
                    ].map(action => (
                        <button
                            key={action.id}
                            id={action.id}
                            className="btn rounded-3 d-flex align-items-center gap-2 px-3 py-2 fw-semibold transition-all hover-scale"
                            onClick={() => onNavigate && onNavigate(action.view)}
                            style={{
                                background: `${action.color}18`,
                                color: action.color,
                                border: `1px solid ${action.color}33`,
                                fontSize: '0.9rem',
                            }}
                        >
                            <i className={`bi ${action.icon}`} />
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
