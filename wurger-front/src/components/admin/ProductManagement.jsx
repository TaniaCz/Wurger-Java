import { useState, useEffect } from 'react';

const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        nombreProducto: '',
        stock: '',
        stockMin: '',
        stockMax: '',
        precioCompra: '',
        precioVenta: '',
        estado: 'Activo',
        idCategoria: '',
        imagen: ''
    });

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterStock, setFilterStock] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        setUploading(true);
        try {
            const response = await fetch('http://localhost:8080/api/upload', {
                method: 'POST',
                body: uploadData
            });

            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({ ...prev, imagen: data.url }));
            } else {
                let errorMsg = 'Error desconocido';
                try {
                    const error = await response.json();
                    errorMsg = error.error || errorMsg;
                } catch (err) {
                    try {
                        errorMsg = await response.text();
                    } catch (txtErr) {}
                }
                alert('Error al subir imagen: ' + errorMsg);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error al conectar con el servidor de subida');
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/categorias');
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/productos');
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingProduct
            ? `http://localhost:8080/api/productos/${editingProduct.id}`
            : 'http://localhost:8080/api/productos';
        const method = editingProduct ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    idCategoria: parseInt(formData.idCategoria),
                    stock: parseInt(formData.stock),
                    stockMin: parseInt(formData.stockMin || 0),
                    stockMax: parseInt(formData.stockMax || 0),
                    precioCompra: parseFloat(formData.precioCompra || 0),
                    precioVenta: parseFloat(formData.precioVenta),
                    imagen: formData.imagen || null
                })
            });

            if (response.ok) {
                fetchProducts();
                resetForm();
                alert('Producto guardado exitosamente');
            } else {
                const error = await response.text();
                alert('Error: ' + error);
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error al guardar producto');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este producto?')) {
            try {
                const response = await fetch(`http://localhost:8080/api/productos/${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    fetchProducts();
                    alert('Producto eliminado');
                }
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            nombreProducto: product.nombreProducto,
            stock: product.stock,
            stockMin: product.stockMin || '',
            stockMax: product.stockMax || '',
            precioCompra: product.precioCompra || '',
            precioVenta: product.precioVenta,
            estado: product.estado,
            idCategoria: product.categoria?.id || '',
            imagen: product.imagen || ''
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingProduct(null);
        setFormData({
            nombreProducto: '',
            stock: '',
            stockMin: '',
            stockMax: '',
            precioCompra: '',
            precioVenta: '',
            estado: 'Activo',
            idCategoria: '',
            imagen: ''
        });
    };

    const getFilteredProducts = () => {
        return products.filter(product => {
            const matchesSearch = product.nombreProducto.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === '' || product.categoria?.id === parseInt(filterCategory);
            const matchesStatus = filterStatus === '' || product.estado === filterStatus;
            let matchesStock = true;
            if (filterStock === 'bajo') {
                matchesStock = product.stock < (product.stockMin || 10);
            } else if (filterStock === 'normal') {
                matchesStock = product.stock >= (product.stockMin || 10);
            }
            return matchesSearch && matchesCategory && matchesStatus && matchesStock;
        });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterCategory('');
        setFilterStatus('');
        setFilterStock('');
    };

    return (
        <div className="container-fluid animate-fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Gestión de Productos</h2>
                <button
                    className="btn btn-primary rounded-pill px-4 shadow-sm"
                    onClick={() => setShowForm(!showForm)}
                >
                    <i className={`bi ${showForm ? 'bi-x-lg' : 'bi-plus-lg'} me-2`}></i>
                    {showForm ? 'Cancelar' : 'Nuevo Producto'}
                </button>
            </div>

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
                                placeholder="Buscar por nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-md-2">
                        <select
                            className="form-select"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="">Todas las categorías</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.nombreCategoria}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-2">
                        <select
                            className="form-select"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>
                    </div>
                    <div className="col-md-2">
                        <select
                            className="form-select"
                            value={filterStock}
                            onChange={(e) => setFilterStock(e.target.value)}
                        >
                            <option value="">Todos los stocks</option>
                            <option value="bajo">Stock Bajo</option>
                            <option value="normal">Stock Normal</option>
                        </select>
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
                    Mostrando {getFilteredProducts().length} de {products.length} productos
                </div>
            </div>

            {showForm && (
                <div className="glass-panel p-4 rounded-4 mb-4 animate-fade-in">
                    <h4 className="mb-4">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h4>
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label small text-muted">Nombre del Producto *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.nombreProducto}
                                    onChange={(e) => setFormData({ ...formData, nombreProducto: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small text-muted">Categoría *</label>
                                <select
                                    className="form-select"
                                    value={formData.idCategoria}
                                    onChange={(e) => setFormData({ ...formData, idCategoria: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar categoría...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.nombreCategoria}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small text-muted">Imagen del Producto</label>
                                <div className="d-flex flex-column gap-2">
                                    <div className="input-group">
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            disabled={uploading}
                                        />
                                        {uploading && (
                                            <span className="input-group-text">
                                                <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light text-muted small">URL</span>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={formData.imagen}
                                            onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
                                            placeholder="O ingresa la URL de la imagen..."
                                        />
                                    </div>
                                    {formData.imagen && (
                                        <div className="position-relative mt-1 border rounded-3 p-1 bg-light d-inline-block" style={{ maxWidth: '120px' }}>
                                            <img 
                                                src={formData.imagen} 
                                                alt="Preview" 
                                                className="img-thumbnail object-fit-cover w-100" 
                                                style={{ height: '80px' }}
                                                onError={(e) => { e.target.src = 'https://placehold.co/120x80?text=Error'; }}
                                            />
                                            <button 
                                                type="button" 
                                                className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle p-1 d-flex align-items-center justify-content-center" 
                                                style={{ width: '20px', height: '20px', fontSize: '10px' }}
                                                onClick={() => setFormData({ ...formData, imagen: '' })}
                                            >
                                                <i className="bi bi-x"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small text-muted">Estado *</label>
                                <select
                                    className="form-select"
                                    value={formData.estado}
                                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                    required
                                >
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label small text-muted">Precio Compra (COP)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-control"
                                    value={formData.precioCompra}
                                    onChange={(e) => setFormData({ ...formData, precioCompra: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label small text-muted">Precio Venta (COP) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-control"
                                    value={formData.precioVenta}
                                    onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label small text-muted">Stock *</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="form-control"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small text-muted">Stock Mínimo</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="form-control"
                                    value={formData.stockMin}
                                    onChange={(e) => setFormData({ ...formData, stockMin: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small text-muted">Stock Máximo</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="form-control"
                                    value={formData.stockMax}
                                    onChange={(e) => setFormData({ ...formData, stockMax: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div className="mt-4 d-flex gap-2 justify-content-end">
                            <button type="button" className="btn btn-light" onClick={resetForm}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-success px-4">
                                {editingProduct ? 'Actualizar' : 'Crear'} Producto
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-panel rounded-4 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover mb-0 align-middle">
                        <thead className="bg-light bg-opacity-50">
                            <tr>
                                <th className="border-0 px-4 py-3 text-muted small text-uppercase">Producto</th>
                                <th className="border-0 px-4 py-3 text-muted small text-uppercase">Categoría</th>
                                <th className="border-0 px-4 py-3 text-muted small text-uppercase">Precio</th>
                                <th className="border-0 px-4 py-3 text-muted small text-uppercase">Stock</th>
                                <th className="border-0 px-4 py-3 text-muted small text-uppercase">Estado</th>
                                <th className="border-0 px-4 py-3 text-muted small text-uppercase text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getFilteredProducts().map((product) => (
                                <tr key={product.id}>
                                    <td className="px-4 py-3">
                                        <div className="d-flex align-items-center">
                                            {product.imagen && (
                                                <img src={product.imagen} alt="" className="rounded-3 me-3 object-fit-cover" style={{ width: 40, height: 40 }} />
                                            )}
                                            <div>
                                                <div className="fw-bold">{product.nombreProducto}</div>
                                                <div className="small text-muted">ID: {product.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="badge bg-light text-dark border">
                                            {product.categoria?.nombreCategoria || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 fw-medium">{formatCOP(product.precioVenta)}</td>
                                    <td className="px-4 py-3">
                                        <div className="d-flex align-items-center">
                                            <div className={`rounded-circle me-2 ${product.stock < 10 ? 'bg-danger' : 'bg-success'}`} style={{ width: 8, height: 8 }}></div>
                                            {product.stock}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`badge rounded-pill ${product.estado === 'Activo' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                                            {product.estado}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-end">
                                        <button
                                            className="btn btn-sm btn-light me-2"
                                            onClick={() => handleEdit(product)}
                                            title="Editar"
                                        >
                                            <i className="bi bi-pencil"></i>
                                        </button>
                                        <button
                                            className="btn btn-sm btn-light text-danger"
                                            onClick={() => handleDelete(product.id)}
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
        </div>
    );
};

export default ProductManagement;
