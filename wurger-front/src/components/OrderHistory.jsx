import { useEffect, useState } from 'react';

const OrderHistory = ({ userId }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/ventas/usuario/${userId}`);
                if (response.ok) {
                    const data = await response.json();
                    // Sort by newest first
                    const sortedData = data.sort((a, b) => b.id - a.id);
                    setOrders(sortedData);
                }
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchOrders();
        }
    }, [userId]);

    const formatPrice = (value) => {
        const price = value < 1000 ? value * 1000 : value;
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pagada':
            case 'Completada':
                return {
                    class: 'bg-success bg-opacity-10 text-success border border-success border-opacity-20',
                    icon: 'bi-check-circle-fill',
                    label: 'Entregado'
                };
            case 'EnProceso':
                return {
                    class: 'bg-info bg-opacity-10 text-info border border-info border-opacity-20',
                    icon: 'bi-hourglass-split',
                    label: 'En Proceso'
                };
            case 'Cancelada':
            case 'Anulada':
                return {
                    class: 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20',
                    icon: 'bi-x-circle-fill',
                    label: 'Cancelado'
                };
            default: // Pendiente
                return {
                    class: 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-20',
                    icon: 'bi-clock-fill',
                    label: 'Pendiente'
                };
        }
    };

    const toggleExpandOrder = (orderId) => {
        if (expandedOrder === orderId) {
            setExpandedOrder(null);
        } else {
            setExpandedOrder(orderId);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted small">Cargando tu historial de pedidos...</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-5 glass-panel rounded-4">
                <i className="bi bi-clock-history display-3 text-muted opacity-50 mb-3"></i>
                <p className="lead text-muted mb-0">Aún no has realizado pedidos</p>
                <small className="text-muted">¡Anímate a probar nuestras deliciosas hamburguesas!</small>
            </div>
        );
    }

    return (
        <div className="position-relative ps-4" style={{ borderLeft: '2px solid var(--border-color)' }}>
            {orders.map((order) => {
                const status = getStatusBadge(order.estado);
                const isExpanded = expandedOrder === order.id;

                return (
                    <div key={order.id} className="position-relative mb-4 animate-slide-up">
                        {/* Timeline Node Icon */}
                        <div className="position-absolute rounded-circle d-flex align-items-center justify-content-center bg-card border shadow-sm"
                             style={{
                                 width: '32px',
                                 height: '32px',
                                 left: '-57px',
                                 top: '0px',
                                 zIndex: 2,
                                 color: order.estado === 'Pagada' || order.estado === 'Completada' ? 'var(--success-color)' : 'var(--primary-color)'
                             }}>
                            <i className="bi bi-receipt fs-6"></i>
                        </div>

                        {/* Order Card */}
                        <div className={`card glass-card border border-white border-opacity-10 shadow-sm p-4 rounded-4 transition-all ${isExpanded ? 'shadow-md' : ''}`}>
                            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
                                <div>
                                    <h5 className="fw-bold mb-1">Pedido #{order.id}</h5>
                                    <span className="small text-muted">
                                        <i className="bi bi-calendar3 me-1"></i>
                                        {new Date(order.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <span className={`badge rounded-pill d-flex align-items-center gap-1.5 py-1.5 px-3 fs-7.5 ${status.class}`}>
                                    <i className={`bi ${status.icon}`}></i>
                                    <span>{status.label}</span>
                                </span>
                            </div>

                            <div className="row g-2 mb-3">
                                <div className="col-sm-6">
                                    <div className="small text-muted mb-0.5">Dirección de Envío</div>
                                    <div className="fw-medium small">
                                        <i className="bi bi-geo-alt me-1 text-primary"></i>
                                        {order.direccion || 'No especificada'}
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div className="small text-muted mb-0.5">Total Cancelado</div>
                                    <div className="fw-bold text-primary fs-5">
                                        {formatPrice(order.totalVenta)}
                                    </div>
                                </div>
                            </div>

                            {order.observaciones && (
                                <div className="p-3 bg-light bg-opacity-50 border rounded-3 small text-muted mb-3">
                                    <i className="bi bi-info-circle me-1 text-warning"></i>
                                    <strong>Notas:</strong> {order.observaciones}
                                </div>
                            )}

                            {/* Dropdown Items toggle */}
                            <button 
                                className="btn btn-sm btn-link text-decoration-none p-0 d-flex align-items-center gap-1 text-primary fw-semibold"
                                onClick={() => toggleExpandOrder(order.id)}
                            >
                                <span>{isExpanded ? 'Ocultar productos' : 'Ver productos en el pedido'}</span>
                                <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                            </button>

                            {/* Collapsible Details list */}
                            {isExpanded && (
                                <div className="mt-3 pt-3 border-top border-secondary-subtle animate-fade-in">
                                    <h6 className="fw-bold small text-muted mb-2.5">Detalle del Pedido:</h6>
                                    <div className="list-group list-group-flush bg-transparent">
                                        {order.detalles?.map((det, idx) => (
                                            <div key={idx} className="list-group-item d-flex justify-content-between align-items-center py-2 px-0 bg-transparent border-bottom border-light">
                                                <div className="d-flex align-items-center gap-2.5">
                                                    {det.producto?.imagen && (
                                                        <img src={det.producto.imagen} alt={det.producto.nombreProducto} className="rounded object-fit-cover" style={{ width: '40px', height: '40px' }} />
                                                    )}
                                                    <div>
                                                        <span className="fw-medium small d-block">{det.producto?.nombreProducto || 'Producto'}</span>
                                                        <small className="text-muted">{formatPrice(det.precioUnitario)} c/u</small>
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <span className="badge bg-secondary bg-opacity-10 text-body border me-2 small">Cant: {det.cantidad}</span>
                                                    <span className="fw-bold small">{formatPrice(det.subtotal)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default OrderHistory;
