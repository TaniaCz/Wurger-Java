import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const ExpensesManagement = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCaja, setActiveCaja] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingGasto, setEditingGasto] = useState(null);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [dateRange, setDateRange] = useState({
        start: '',
        end: ''
    });

    // Form fields
    const [formData, setFormData] = useState({
        descripcion: '',
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        categoria: 'Insumos',
        medioPago: 'Efectivo',
        pagarConCaja: false
    });

    const categories = ['Insumos', 'Servicios', 'Nómina', 'Mantenimiento', 'Publicidad', 'Otros'];
    const paymentMethods = ['Efectivo', 'Transferencia Bancaria', 'Tarjeta de Crédito/Débito', 'Otro'];

    useEffect(() => {
        fetchExpenses();
        fetchActiveCaja();
    }, []);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8080/api/gastos');
            if (response.ok) {
                const data = await response.json();
                setExpenses(data);
            }
        } catch (error) {
            console.error("Error fetching expenses:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveCaja = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/caja/activa');
            if (response.status === 200) {
                const data = await response.json();
                setActiveCaja(data);
            } else {
                setActiveCaja(null);
            }
        } catch (error) {
            console.error("Error fetching active box:", error);
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

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleOpenCreateModal = () => {
        setEditingGasto(null);
        setFormData({
            descripcion: '',
            monto: '',
            fecha: new Date().toISOString().split('T')[0],
            categoria: 'Insumos',
            medioPago: 'Efectivo',
            pagarConCaja: activeCaja !== null
        });
        setShowModal(true);
    };

    const handleOpenEditModal = (gasto) => {
        setEditingGasto(gasto);
        setFormData({
            descripcion: gasto.descripcion,
            monto: gasto.monto,
            fecha: gasto.fecha,
            categoria: gasto.categoria,
            medioPago: gasto.medioPago,
            pagarConCaja: gasto.idCajaSesion !== null
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        let payload = {
            descripcion: formData.descripcion,
            monto: parseFloat(formData.monto),
            fecha: formData.fecha,
            categoria: formData.categoria,
            medioPago: formData.medioPago,
            idCajaSesion: null
        };

        if (formData.pagarConCaja && activeCaja && formData.medioPago === 'Efectivo') {
            payload.idCajaSesion = activeCaja.id;
        }

        try {
            const url = editingGasto 
                ? `http://localhost:8080/api/gastos/${editingGasto.id}`
                : 'http://localhost:8080/api/gastos';
            
            const method = editingGasto ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert(editingGasto ? 'Gasto actualizado con éxito' : 'Gasto registrado con éxito');
                setShowModal(false);
                fetchExpenses();
            } else {
                alert('Error al guardar el gasto');
            }
        } catch (error) {
            console.error("Error saving expense:", error);
            alert('Error de conexión');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este gasto?')) return;

        try {
            const response = await fetch(`http://localhost:8080/api/gastos/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Gasto eliminado con éxito');
                fetchExpenses();
            } else {
                alert('Error al eliminar el gasto');
            }
        } catch (error) {
            console.error("Error deleting expense:", error);
            alert('Error de conexión');
        }
    };

    // Filter logic
    const getFilteredExpenses = () => {
        if (!Array.isArray(expenses)) return [];

        return expenses.filter(g => {
            const matchesSearch = g.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
                g.categoria.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCategory = selectedCategory === 'All' || g.categoria === selectedCategory;

            let matchesDate = true;
            if (dateRange.start) {
                matchesDate = matchesDate && g.fecha >= dateRange.start;
            }
            if (dateRange.end) {
                matchesDate = matchesDate && g.fecha <= dateRange.end;
            }

            return matchesSearch && matchesCategory && matchesDate;
        });
    };

    const filteredExpenses = getFilteredExpenses();
    
    const getTotalExpenses = () => {
        return filteredExpenses.reduce((sum, g) => sum + parseFloat(g.monto), 0);
    };

    return (
        <div className="container-fluid animate-fade-in">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">Control de Gastos</h2>
                    <p className="text-muted small">Registra y monitorea los egresos de caja y administración</p>
                </div>
                <button className="btn btn-primary rounded-pill px-4" onClick={handleOpenCreateModal}>
                    <i className="bi bi-plus-lg me-2"></i> Registrar Gasto
                </button>
            </div>

            {/* Quick Stats */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="glass-card p-4 text-white bg-danger bg-gradient" style={{ '--glass-bg': 'rgba(255,255,255,0.1)' }}>
                        <h6 className="opacity-75 small text-uppercase fw-bold mb-2">Total Egresos (Filtrados)</h6>
                        <h3 className="fw-bold mb-0">{formatCOP(getTotalExpenses())}</h3>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="glass-card p-4">
                        <h6 className="text-muted small text-uppercase fw-bold mb-2">Transacciones</h6>
                        <h3 className="fw-bold mb-0 text-primary">{filteredExpenses.length}</h3>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="glass-card p-4">
                        <h6 className="text-muted small text-uppercase fw-bold mb-2">Estado de Caja</h6>
                        {activeCaja ? (
                            <div className="d-flex align-items-center gap-2">
                                <span className="position-relative d-inline-flex">
                                    <span className="flex h-2 w-2 rounded-circle bg-success animate-pulse"></span>
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-circle bg-success opacity-75"></span>
                                </span>
                                <span className="fw-bold text-success">Caja Abierta (ID: {activeCaja.id})</span>
                            </div>
                        ) : (
                            <span className="fw-bold text-muted">Caja Cerrada</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters panel */}
            <div className="glass-panel p-4 rounded-4 mb-4">
                <div className="row g-3">
                    <div className="col-md-4">
                        <label className="form-label small text-muted">Buscar por descripción</label>
                        <div className="input-group">
                            <span className="input-group-text bg-transparent border-end-0">
                                <i className="bi bi-search text-muted"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="Escribe para buscar..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-md-3">
                        <label className="form-label small text-muted">Categoría</label>
                        <select 
                            className="form-select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="All">Todas las Categorías</option>
                            {categories.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-25 col-sm-6">
                        <label className="form-label small text-muted">Fecha Inicio</label>
                        <input
                            type="date"
                            className="form-control"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                    </div>
                    <div className="col-md-25 col-sm-6">
                        <label className="form-label small text-muted">Fecha Fin</label>
                        <input
                            type="date"
                            className="form-control"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Expenses List */}
            <div className="glass-panel rounded-4 p-4 overflow-hidden">
                <h5 className="fw-bold mb-3">Detalle de Gastos</h5>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <p className="mt-2 text-muted">Cargando gastos...</p>
                    </div>
                ) : filteredExpenses.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="bi bi-wallet2 display-1 text-muted opacity-50 mb-3"></i>
                        <p className="lead text-muted">No se encontraron gastos registrados</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="border-0 rounded-start">Fecha</th>
                                    <th className="border-0">Descripción</th>
                                    <th className="border-0">Categoría</th>
                                    <th className="border-0">Medio de Pago</th>
                                    <th className="border-0">Origen</th>
                                    <th className="border-0 text-end">Monto</th>
                                    <th className="border-0 rounded-end text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map(g => (
                                    <tr key={g.id}>
                                        <td className="text-nowrap">{new Date(g.fecha + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        <td className="fw-medium">{g.descripcion}</td>
                                        <td>
                                            <span className="badge bg-secondary bg-opacity-10 text-body border">{g.categoria}</span>
                                        </td>
                                        <td>{g.medioPago}</td>
                                        <td>
                                            {g.idCajaSesion ? (
                                                <span className="text-success small fw-medium">
                                                    <i className="bi bi-cash-coin me-1"></i>
                                                    Caja #{g.idCajaSesion}
                                                </span>
                                            ) : (
                                                <span className="text-muted small">Administración</span>
                                            )}
                                        </td>
                                        <td className="text-end fw-bold text-danger">{formatCOP(g.monto)}</td>
                                        <td className="text-center">
                                            <div className="d-flex justify-content-center gap-2">
                                                <button className="btn btn-sm btn-outline-primary border-0" onClick={() => handleOpenEditModal(g)}>
                                                    <i className="bi bi-pencil-square"></i>
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger border-0" onClick={() => handleDelete(g.id)}>
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && createPortal(
                <div className="modal show d-block" tabIndex="-1" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', zIndex: 1055 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ width: '100%', maxWidth: '500px' }}>
                        <div className="modal-content glass-panel border-0 rounded-4">
                            <div className="modal-header border-bottom border-secondary-subtle">
                                <h5 className="modal-title fw-bold">
                                    {editingGasto ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label small text-muted">Descripción *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="descripcion"
                                            value={formData.descripcion}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Ej. Compra de empaques para hamburguesas"
                                        />
                                    </div>
                                    
                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label small text-muted">Monto (COP) *</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="monto"
                                                value={formData.monto}
                                                onChange={handleInputChange}
                                                required
                                                min="0.01"
                                                step="any"
                                                placeholder="Ej. 15000"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small text-muted">Fecha *</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="fecha"
                                                value={formData.fecha}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label small text-muted">Categoría</label>
                                            <select
                                                className="form-select"
                                                name="categoria"
                                                value={formData.categoria}
                                                onChange={handleInputChange}
                                            >
                                                {categories.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small text-muted">Medio de Pago</label>
                                            <select
                                                className="form-select"
                                                name="medioPago"
                                                value={formData.medioPago}
                                                onChange={handleInputChange}
                                            >
                                                {paymentMethods.map(m => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Integration with Box Session */}
                                    {activeCaja && formData.medioPago === 'Efectivo' && (
                                        <div className="mb-3 p-3 rounded-3 bg-warning bg-opacity-10 border border-warning border-opacity-20">
                                            <div className="form-check">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="pagarConCaja"
                                                    name="pagarConCaja"
                                                    checked={formData.pagarConCaja}
                                                    onChange={handleInputChange}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <label className="form-check-label small fw-semibold text-warning ms-1 select-none" htmlFor="pagarConCaja" style={{ cursor: 'pointer' }}>
                                                    Retirar efectivo del cajón de la Caja activa (ID: {activeCaja.id})
                                                </label>
                                            </div>
                                            <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
                                                Al marcar esta casilla, este gasto se restará automáticamente del dinero en efectivo al realizar el arqueo de cierre.
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer border-top border-secondary-subtle">
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary rounded-pill px-4">
                                        {editingGasto ? 'Actualizar' : 'Guardar Gasto'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ExpensesManagement;
