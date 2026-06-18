import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const PromotionsManagement = () => {
    const [promotions, setPromotions] = useState([]);
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        inicio: '',
        fin: '',
        cantidadUsos: 0,
        estado: 'Activa',
        descuento: '',
        tipoDescuento: 'PORCENTAJE',
        idProducto: ''
    });

    useEffect(() => {
        fetchPromotions();
        fetchProducts();
    }, []);

    const fetchPromotions = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/promociones');
            if (response.ok) {
                const data = await response.json();
                setPromotions(data);
            }
        } catch (error) {
            console.error('Error fetching promotions:', error);
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
            console.error('Error fetching products:', error);
        }
    };

    // Get today's date in YYYY-MM-DD format
    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    // Validate name (no numbers allowed)
    const validateName = (name) => {
        if (!name || name.trim() === '') {
            return 'El nombre es obligatorio';
        }
        if (/\d/.test(name)) {
            return 'El nombre no puede contener números';
        }
        if (name.length < 3) {
            return 'El nombre debe tener al menos 3 caracteres';
        }
        if (name.length > 100) {
            return 'El nombre no puede exceder 100 caracteres';
        }
        return '';
    };

    // Validate discount value
    const validateDiscount = (value, type) => {
        if (value === '' || value === null || value === undefined) {
            return 'El valor del descuento es obligatorio';
        }
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue) || numValue <= 0) {
            return 'El descuento debe ser mayor a 0';
        }
        if (type === 'PORCENTAJE' && numValue > 100) {
            return 'El porcentaje no puede ser mayor a 100%';
        }
        return '';
    };

    // Validate dates
    const validateDates = (inicio, fin) => {
        const errors = {};
        const today = getTodayDate();

        if (!inicio) {
            errors.inicio = 'La fecha de inicio es obligatoria';
        } else if (inicio < today) {
            errors.inicio = 'La fecha de inicio no puede ser anterior a hoy';
        }

        if (!fin) {
            errors.fin = 'La fecha de fin es obligatoria';
        } else if (fin < today) {
            errors.fin = 'La fecha de fin no puede ser anterior a hoy';
        } else if (inicio && fin < inicio) {
            errors.fin = 'La fecha de fin debe ser posterior o igual a la fecha de inicio';
        }

        return errors;
    };

    const validateForm = () => {
        const newErrors = {};

        // Validate name
        const nameError = validateName(formData.nombre);
        if (nameError) newErrors.nombre = nameError;

        // Validate product
        if (!formData.idProducto) {
            newErrors.idProducto = 'Debe seleccionar un producto';
        }

        // Validate discount
        const discountError = validateDiscount(formData.descuento, formData.tipoDescuento);
        if (discountError) newErrors.descuento = discountError;

        // Validate dates
        const dateErrors = validateDates(formData.inicio, formData.fin);
        Object.assign(newErrors, dateErrors);

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const url = editingPromo
            ? `http://localhost:8080/api/promociones/${editingPromo.id}`
            : 'http://localhost:8080/api/promociones';

        const method = editingPromo ? 'PUT' : 'POST';

        try {
            // Convert descuento to number before sending
            const payload = {
                ...formData,
                descuento: parseFloat(formData.descuento) || 0
            };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                fetchPromotions();
                setShowModal(false);
                resetForm();
                alert('Promoción guardada exitosamente');
            } else {
                const errorText = await response.text();
                alert('Error al guardar la promoción: ' + errorText);
            }
        } catch (error) {
            console.error('Error saving promotion:', error);
            alert('Error de conexión al guardar la promoción');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta promoción?')) return;

        try {
            const response = await fetch(`http://localhost:8080/api/promociones/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchPromotions();
                alert('Promoción eliminada exitosamente');
            } else {
                alert('Error al eliminar la promoción');
            }
        } catch (error) {
            console.error('Error deleting promotion:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            nombre: '',
            descripcion: '',
            inicio: '',
            fin: '',
            cantidadUsos: 0,
            estado: 'Activa',
            descuento: '',
            tipoDescuento: 'PORCENTAJE',
            idProducto: ''
        });
        setEditingPromo(null);
        setErrors({});
    };

    const handleEdit = (promo) => {
        setEditingPromo(promo);
        setFormData({
            nombre: promo.nombre,
            descripcion: promo.descripcion,
            inicio: promo.inicio,
            fin: promo.fin,
            cantidadUsos: promo.cantidadUsos,
            estado: promo.estado,
            descuento: promo.descuento || 0,
            tipoDescuento: promo.tipoDescuento || 'PORCENTAJE',
            idProducto: promo.producto?.id || ''
        });
        setErrors({});
        setShowModal(true);
    };

    const handleFieldChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
        }
    };

    const formatCOP = (value) => {
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
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Gestión de Promociones</h2>
                <button
                    className="btn btn-primary rounded-pill px-4 shadow-sm"
                    onClick={() => { resetForm(); setShowModal(true); }}
                >
                    <i className="bi bi-plus-lg me-2"></i>
                    Nueva Promoción
                </button>
            </div>

            <div className="glass-panel rounded-4 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover mb-0 align-middle">
                        <thead className="bg-light bg-opacity-50">
                            <tr>
                                <th className="border-0 px-4 py-3 text-muted small text-uppercase">Nombre</th>
                                <th className="border-0 px-4 py-3 text-muted small text-uppercase">Producto</th>
                                <th className="border-0 px-4 py-3 text-muted small text-uppercase">Descuento</th>
                                <th className="border-0 px-4 py-3 text-muted small text-uppercase">Vigencia</th>
                                <th className="border-0 px-4 py-3 text-muted small text-uppercase">Estado</th>
                                <th className="border-0 px-4 py-3 text-muted small text-uppercase text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {promotions.map(promo => (
                                <tr key={promo.id}>
                                    <td className="px-4 py-3">
                                        <div className="fw-bold">{promo.nombre}</div>
                                        <small className="text-muted">{promo.descripcion}</small>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="badge bg-light text-dark border">
                                            {promo.producto?.nombreProducto || 'Todos'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">
                                            {promo.tipoDescuento === 'PORCENTAJE'
                                                ? `${promo.descuento}% OFF`
                                                : `${formatCOP(promo.descuento)} OFF`}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="small">
                                            <i className="bi bi-calendar-event me-1 text-muted"></i>
                                            {promo.inicio}
                                        </div>
                                        <div className="small text-muted">
                                            <i className="bi bi-arrow-right me-1"></i>
                                            {promo.fin}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`badge rounded-pill ${promo.estado === 'Activa' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                                            {promo.estado}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-end">
                                        <button
                                            className="btn btn-sm btn-light me-2"
                                            onClick={() => handleEdit(promo)}
                                            title="Editar"
                                        >
                                            <i className="bi bi-pencil"></i>
                                        </button>
                                        <button
                                            className="btn btn-sm btn-light text-danger"
                                            onClick={() => handleDelete(promo.id)}
                                            title="Eliminar"
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Compact Modal - No Scroll Required */}
            {showModal && createPortal(
                <div className="modal show d-block" tabIndex="-1" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', zIndex: 1055 }}>
                    <div className="modal-dialog modal-dialog-centered m-0" style={{ width: '100%', maxWidth: '800px' }}>
                        <div className="modal-content glass-panel border-0 shadow-lg">
                            <div className="modal-header border-bottom border-secondary-subtle py-3">
                                <h5 className="modal-title fw-bold">
                                    {editingPromo ? 'Editar Promoción' : 'Nueva Promoción'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body py-3 px-4">
                                    <div className="row g-2">
                                        {/* Row 1: Nombre y Producto */}
                                        <div className="col-md-6">
                                            <label className="form-label small text-muted mb-1">
                                                Nombre <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control form-control-sm ${errors.nombre ? 'is-invalid' : ''}`}
                                                value={formData.nombre}
                                                onChange={e => handleFieldChange('nombre', e.target.value)}
                                                placeholder="Ej: Promo Verano 2024"
                                            />
                                            {errors.nombre && <div className="invalid-feedback small">{errors.nombre}</div>}
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label small text-muted mb-1">
                                                Producto <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className={`form-select form-select-sm ${errors.idProducto ? 'is-invalid' : ''}`}
                                                value={formData.idProducto}
                                                onChange={e => handleFieldChange('idProducto', e.target.value)}
                                            >
                                                <option value="">Seleccionar producto...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.nombreProducto} - {formatCOP(p.precioVenta)}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.idProducto && <div className="invalid-feedback small">{errors.idProducto}</div>}
                                        </div>

                                        {/* Row 2: Tipo Descuento y Valor */}
                                        <div className="col-md-6">
                                            <label className="form-label small text-muted mb-1">
                                                Tipo Descuento <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select form-select-sm"
                                                value={formData.tipoDescuento}
                                                onChange={e => handleFieldChange('tipoDescuento', e.target.value)}
                                            >
                                                <option value="PORCENTAJE">Porcentaje (%)</option>
                                                <option value="FIJO">Monto Fijo ($)</option>
                                            </select>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label small text-muted mb-1">
                                                Valor Descuento <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                className={`form-control form-control-sm ${errors.descuento ? 'is-invalid' : ''}`}
                                                min="0"
                                                step={formData.tipoDescuento === 'PORCENTAJE' ? '1' : '100'}
                                                max={formData.tipoDescuento === 'PORCENTAJE' ? '100' : undefined}
                                                value={formData.descuento}
                                                onChange={e => handleFieldChange('descuento', e.target.value)}
                                                placeholder={formData.tipoDescuento === 'PORCENTAJE' ? '20' : '5000'}
                                            />
                                            {errors.descuento && <div className="invalid-feedback small">{errors.descuento}</div>}
                                        </div>

                                        {/* Row 3: Fechas */}
                                        <div className="col-md-6">
                                            <label className="form-label small text-muted mb-1">
                                                Fecha Inicio <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                className={`form-control form-control-sm ${errors.inicio ? 'is-invalid' : ''}`}
                                                min={getTodayDate()}
                                                value={formData.inicio}
                                                onChange={e => handleFieldChange('inicio', e.target.value)}
                                            />
                                            {errors.inicio && <div className="invalid-feedback small">{errors.inicio}</div>}
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label small text-muted mb-1">
                                                Fecha Fin <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                className={`form-control form-control-sm ${errors.fin ? 'is-invalid' : ''}`}
                                                min={formData.inicio || getTodayDate()}
                                                value={formData.fin}
                                                onChange={e => handleFieldChange('fin', e.target.value)}
                                            />
                                            {errors.fin && <div className="invalid-feedback small">{errors.fin}</div>}
                                        </div>

                                        {/* Row 4: Descripción */}
                                        <div className="col-12">
                                            <label className="form-label small text-muted mb-1">Descripción</label>
                                            <textarea
                                                className="form-control form-control-sm"
                                                rows="2"
                                                value={formData.descripcion}
                                                onChange={e => handleFieldChange('descripcion', e.target.value)}
                                                placeholder="Descripción opcional"
                                                maxLength="255"
                                            ></textarea>
                                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>{formData.descripcion.length}/255</small>
                                        </div>

                                        {/* Row 5: Estado */}
                                        <div className="col-md-6">
                                            <label className="form-label small text-muted mb-1">Estado</label>
                                            <select
                                                className="form-select form-select-sm"
                                                value={formData.estado}
                                                onChange={e => handleFieldChange('estado', e.target.value)}
                                            >
                                                <option value="Activa">Activa</option>
                                                <option value="Inactiva">Inactiva</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-top border-secondary-subtle py-2">
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary btn-sm px-4">
                                        <i className="bi bi-check-lg me-1"></i>
                                        Guardar
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

export default PromotionsManagement;
