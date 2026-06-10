import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
    const { addToCart } = useCart();

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
        <div className="col-md-6 col-lg-4 col-xl-3 animate-scale-in">
            <div className="glass-card h-100 overflow-hidden position-relative d-flex flex-column border border-white border-opacity-10 shadow-sm" 
                 style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                
                {/* Product Image Section */}
                <div className="position-relative overflow-hidden" style={{ height: '190px' }}>
                    <img
                        src={product.imagen || 'https://placehold.co/600x400?text=Wurger'}
                        className="w-100 h-100 object-fit-cover hover-scale"
                        alt={product.nombreProducto}
                        onError={(e) => {
                            e.target.src = 'https://placehold.co/600x400?text=Wurger';
                        }}
                    />
                    
                    {/* Discount/Offer Badge */}
                    {product.precioOriginal && product.precioOriginal > product.precioVenta && (
                        <div className="position-absolute top-0 end-0 m-3 z-2">
                            <span className="badge bg-danger rounded-pill px-3 py-2 shadow-sm animate-pulse small">
                                ¡OFERTA!
                            </span>
                        </div>
                    )}
                </div>

                {/* Card Content */}
                <div className="p-3 d-flex flex-column flex-grow-1">
                    <div className="mb-3">
                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10 mb-2 py-1 px-2 text-uppercase fw-bold" 
                              style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                            {product.categoria?.nombreCategoria || 'General'}
                        </span>
                        <h5 className="card-title fw-bold mb-1 text-truncate" title={product.nombreProducto}>
                            {product.nombreProducto}
                        </h5>
                        <p className="text-muted small text-truncate mb-0" style={{ fontSize: '0.8rem' }}>
                            {product.stock > 0 ? (
                                <span className="text-success"><i className="bi bi-check2-circle me-1"></i>Disponible ({product.stock})</span>
                            ) : (
                                <span className="text-danger"><i className="bi bi-x-circle me-1"></i>Agotado</span>
                            )}
                        </p>
                    </div>

                    {/* Bottom row: Pricing & Add to Cart button */}
                    <div className="mt-auto pt-3 border-top border-secondary-subtle d-flex justify-content-between align-items-center">
                        <div>
                            {product.precioOriginal && product.precioOriginal > product.precioVenta && (
                                <small className="text-decoration-line-through text-muted d-block" style={{ fontSize: '0.75rem' }}>
                                    {formatCOP(product.precioOriginal)}
                                </small>
                            )}
                            <span className="h5 mb-0 fw-bold" style={{ color: 'var(--primary-color)' }}>
                                {formatCOP(product.precioVenta)}
                            </span>
                        </div>
                        <button
                            className="btn btn-primary rounded-pill px-3 py-2 shadow-sm d-flex align-items-center gap-1 hover-scale"
                            onClick={() => addToCart({
                                ...product,
                                nombre: product.nombreProducto,
                                precio: product.precioVenta,
                                originalPrice: product.precioOriginal,
                                promoId: product.promoId
                            })}
                            disabled={product.stock <= 0}
                            style={{ fontSize: '0.85rem' }}
                        >
                            <span>Agregar</span>
                            <i className="bi bi-bag-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
