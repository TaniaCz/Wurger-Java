import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [filters, setFilters] = useState({
        estado: '',
        fechaInicio: '',
        fechaFin: '',
        cliente: '',
        searchTerm: ''
    });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, orders]);

    const fetchOrders = async () => {
        setError(null);
        try {
            const response = await fetch('http://localhost:8080/api/ventas');
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Error del servidor: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            const sortedData = Array.isArray(data) ? data.sort((a, b) => b.id - a.id) : [];
            setOrders(sortedData);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setError(error.message);
            setOrders([]);
        }
    };

    const applyFilters = () => {
        if (!Array.isArray(orders)) {
            setFilteredOrders([]);
            return;
        }

        let filtered = [...orders];

        if (filters.estado) {
            filtered = filtered.filter(order => order && order.estado === filters.estado);
        }

        if (filters.fechaInicio) {
            filtered = filtered.filter(order => {
                if (!order || !order.fecha) return false;
                return new Date(order.fecha) >= new Date(filters.fechaInicio);
            });
        }

        if (filters.fechaFin) {
            filtered = filtered.filter(order => {
                if (!order || !order.fecha) return false;
                return new Date(order.fecha) <= new Date(filters.fechaFin);
            });
        }

        if (filters.cliente) {
            filtered = filtered.filter(order =>
                (order?.usuario?.email || '').toLowerCase().includes(filters.cliente.toLowerCase())
            );
        }

        if (filters.searchTerm) {
            filtered = filtered.filter(order =>
                order.id.toString().includes(filters.searchTerm) ||
                (order?.usuario?.email || '').toLowerCase().includes(filters.searchTerm.toLowerCase())
            );
        }

        setFilteredOrders(filtered);
    };

    const clearFilters = () => {
        setFilters({
            estado: '',
            fechaInicio: '',
            fechaFin: '',
            cliente: '',
            searchTerm: ''
        });
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const response = await fetch(`http://localhost:8080/api/ventas/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: newStatus })
            });

            if (response.ok) {
                fetchOrders();
                alert('Estado actualizado');
            } else {
                alert('Error al actualizar estado');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Pendiente': return 'bg-warning text-dark';
            case 'EnProceso': return 'bg-info text-dark';
            case 'Completada': return 'bg-success';
            case 'Cancelada': return 'bg-danger';
            case 'Pagada': return 'bg-success';
            case 'Anulada': return 'bg-danger';
            default: return 'bg-secondary';
        }
    };

    const formatCOP = (value) => {
        if (value === null || value === undefined) return '$ 0';
        const price = value < 1000 ? value * 1000 : value;
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    return (
        <div className="container-fluid animate-fade-in">
            <h2 className="mb-4">Gestión de Pedidos</h2>

            {error && (
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">Error al cargar pedidos</h4>
                    <p>{error}</p>
                    <hr />
                    <p className="mb-0">
                        Es probable que el servidor necesite reiniciarse para aplicar los cambios recientes.
                        <button className="btn btn-outline-danger btn-sm ms-3" onClick={fetchOrders}>Reintentar</button>
                    </p>
                </div>
            )}

            {/* Search and Filters */}
            <div className="glass-panel p-4 rounded-4 mb-4">
                <div className="row g-3">
                    <div className="col-md-4">
                        <div className="input-group">
                            <span className="input-group-text bg-transparent border-end-0">
                                <i className="bi bi-search text-muted"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0 ps-0"
                                placeholder="Buscar por ID o cliente..."
                                value={filters.searchTerm}
                                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="col-md-2">
                        <select
                            className="form-select"
                            value={filters.estado}
                            onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                        >
                            <option value="">Todos los estados</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="EnProceso">En Proceso</option>
                            <option value="Completada">Completada</option>
                            <option value="Cancelada">Cancelada</option>
                        </select>
                    </div>
                    <div className="col-md-2">
                        <input
                            type="date"
                            className="form-control"
                            placeholder="Fecha Inicio"
                            value={filters.fechaInicio}
                            onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
                        />
                    </div>
                    <div className="col-md-2">
                        <input
                            type="date"
                            className="form-control"
                            placeholder="Fecha Fin"
                            value={filters.fechaFin}
                            onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
                        />
                    </div>
                    <div className="col-md-2">
                        <button
                            className="btn btn-outline-secondary w-100"
                            onClick={clearFilters}
                        >
                            <i className="bi bi-x-circle me-1"></i>
                            Limpiar
                        </button>
                    </div>
                </div>
                <div className="mt-3 text-muted small">
                    <i className="bi bi-info-circle me-1"></i>
                    Mostrando {filteredOrders.length} de {orders.length} pedidos
                </div>
            </div>

            {/* Orders Table */}
            <div className="glass-panel rounded-4 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover mb-0 align-middle">
                        <thead className="bg-light bg-opacity-50">
                            <tr>
                                <th className="border-0 px-4 py-3 text-muted small text-uppercase">ID</th>
                                <th className="border-0 px-4 py-3 text-muted small text-uppercase">Fecha</th>
                                <th className="border-0 px-4 py-3 text-muted small text-uppercase">Cliente</th>
                                <th className="border-0 px-4 py-3 text-muted small text-uppercase">Total</th>
                                <th className="border-0 px-4 py-3 text-muted small text-uppercase">Estado</th>
                                <th className="border-0 px-4 py-3 text-muted small text-uppercase text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order.id}>
                                    <td className="px-4 py-3 fw-bold">#{order.id}</td>
                                    <td className="px-4 py-3">{new Date(order.fecha).toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <div className="d-flex align-items-center">
                                            <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex justify-content-center align-items-center me-2" style={{ width: 32, height: 32 }}>
                                                <i className="bi bi-person"></i>
                                            </div>
                                            {order.usuario?.email || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 fw-medium">{formatCOP(order.totalVenta)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`badge rounded-pill ${getStatusBadgeClass(order.estado)}`}>
                                            {order.estado}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-end">
                                        <div className="d-flex justify-content-end gap-2">
                                            <select
                                                className="form-select form-select-sm"
                                                style={{ width: 'auto' }}
                                                value={order.estado}
                                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                            >
                                                <option value="Pendiente">Pendiente</option>
                                                <option value="EnProceso">En Proceso</option>
                                                <option value="Completada">Completada</option>
                                                <option value="Cancelada">Cancelada</option>
                                            </select>
                                            <button
                                                className="btn btn-sm btn-info text-white"
                                                onClick={() => setSelectedOrder(order)}
                                                title="Ver Detalles"
                                            >
                                                <i className="bi bi-eye"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Details Modal */}
            {selectedOrder && createPortal(
                <div className="modal fade show" style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1055 }} tabIndex="-1" onClick={() => setSelectedOrder(null)}>
                    <div className="modal-dialog modal-lg w-100" style={{ margin: '0 auto' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-content glass-panel border-0 shadow-lg">
                            <div className="modal-header border-bottom border-secondary-subtle">
                                <h5 className="modal-title fw-bold">Detalles del Pedido #{selectedOrder.id}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setSelectedOrder(null)}
                                ></button>
                            </div>
                            <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <p className="mb-1 text-muted small">Cliente</p>
                                        <p className="fw-medium">{selectedOrder.usuario?.email}</p>
                                        <p className="mb-1 text-muted small">Fecha</p>
                                        <p className="fw-medium">{new Date(selectedOrder.fecha).toLocaleString()}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <p className="mb-1 text-muted small">Estado</p>
                                        <p><span className={`badge ${getStatusBadgeClass(selectedOrder.estado)}`}>{selectedOrder.estado}</span></p>
                                        <p className="mb-1 text-muted small">Dirección</p>
                                        <p className="fw-medium">{selectedOrder.direccion || 'No especificada'}</p>
                                    </div>
                                </div>

                                {selectedOrder.observaciones && (
                                    <div className="alert alert-info d-flex align-items-center">
                                        <i className="bi bi-info-circle-fill me-2"></i>
                                        <div>
                                            <strong>Notas:</strong> {selectedOrder.observaciones}
                                        </div>
                                    </div>
                                )}

                                <h6 className="mt-4 mb-3 fw-bold">Productos</h6>
                                <div className="table-responsive rounded-3 border">
                                    <table className="table table-sm mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="px-3 py-2">Producto</th>
                                                <th className="px-3 py-2 text-center">Cant.</th>
                                                <th className="px-3 py-2 text-end">Precio Unit.</th>
                                                <th className="px-3 py-2 text-end">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.detalles?.map((detalle, index) => (
                                                <tr key={index}>
                                                    <td className="px-3 py-2">{detalle.producto?.nombreProducto || 'Producto no disponible'}</td>
                                                    <td className="px-3 py-2 text-center">{detalle.cantidad}</td>
                                                    <td className="px-3 py-2 text-end">{formatCOP(detalle.precioUnitario)}</td>
                                                    <td className="px-3 py-2 text-end">{formatCOP(detalle.subtotal)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="d-flex justify-content-end mt-3">
                                    <div className="text-end">
                                        <small className="text-muted d-block">Total del Pedido</small>
                                        <span className="h4 fw-bold text-primary">{formatCOP(selectedOrder.totalVenta)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-top border-secondary-subtle">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setSelectedOrder(null)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default OrderManagement;
