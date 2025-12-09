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
        <div className="col-md-6 col-lg-4 col-xl-3">
            <div className="glass-card h-100 overflow-hidden position-relative d-flex flex-column">
                <div className="position-relative overflow-hidden" style={{ height: '200px' }}>
                    <img
                        src={product.imagen || 'https://placehold.co/600x400?text=Wurger'}
                        className="w-100 h-100 object-fit-cover transition-transform hover-scale"
                        alt={product.nombreProducto}
                        style={{ transition: 'transform 0.5s ease' }}
                        onError={(e) => {
                            e.target.src = 'https://placehold.co/600x400?text=Wurger';
                        }}
                        onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                    />
                    {product.precioOriginal && (
                        <div className="position-absolute top-0 end-0 m-2 badge bg-danger rounded-pill shadow-sm">
                            OFERTA
                        </div>
                    )}
                </div>

                <div className="p-3 d-flex flex-column flex-grow-1">
                    <div className="mb-2">
                        <small className="text-uppercase fw-bold text-primary" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                            {product.categoria?.nombreCategoria || 'General'}
                        </small>
                        <h5 className="card-title fw-bold mb-1 text-truncate">{product.nombreProducto}</h5>
                    </div>

                    <div className="mt-auto pt-3 border-top border-secondary-subtle d-flex justify-content-between align-items-center">
                        <div>
                            {product.precioOriginal && product.precioOriginal > product.precioVenta && (
                                <small className="text-decoration-line-through text-muted d-block" style={{ fontSize: '0.8rem' }}>
                                    {formatCOP(product.precioOriginal)}
                                </small>
                            )}
                            <span className={`h5 mb-0 fw-bold ${product.precioOriginal ? 'text-danger' : 'text-body'}`}>
                                {formatCOP(product.precioVenta)}
                            </span>
                        </div>
                        <button
                            className="btn btn-primary btn-sm rounded-pill px-3 py-2 shadow-sm d-flex align-items-center gap-2"
                            onClick={() => addToCart({
                                ...product,
                                nombre: product.nombreProducto,
                                precio: product.precioVenta,
                                originalPrice: product.precioOriginal,
                                promoId: product.promoId
                            })}
                        >
                            <span>Agregar</span>
                            <i className="bi bi-plus-lg"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
