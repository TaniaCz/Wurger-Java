import { useState, useEffect } from 'react';

const PromotionCarousel = ({ promotions, formatPrice, addToCart, getProductWithDiscount }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % promotions.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + promotions.length) % promotions.length);
    };

    const goToSlide = (index) => {
        setCurrentSlide(index);
        setIsAutoPlaying(false);
    };

    // Auto-play carousel
    useEffect(() => {
        if (!isAutoPlaying || promotions.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % promotions.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying, promotions.length]);

    if (!promotions || promotions.length === 0) return null;

    return (
        <div className="animate-slide-up">
            <h3 className="mb-4 d-flex align-items-center">
                <i className="bi bi-fire text-danger me-2 animate-pulse"></i> Promociones Especiales
            </h3>
            <div
                className="promotion-carousel position-relative"
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
            >
                <div className="carousel-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                    {promotions.map((promo) => {
                        if (!promo.producto) return null;
                        const product = getProductWithDiscount(promo.producto);
                        const daysLeft = Math.ceil((new Date(promo.fin) - new Date()) / (1000 * 60 * 60 * 24));

                        return (
                            <div key={promo.id} className="carousel-item">
                                <div className="glass-card overflow-hidden position-relative mx-auto" style={{ maxWidth: '900px' }}>
                                    <div className="position-absolute top-0 start-0 m-3 z-3">
                                        <span className="badge bg-danger rounded-pill px-3 py-2 shadow-sm animate-pulse">
                                            {promo.tipoDescuento === 'PORCENTAJE' ? `-${promo.descuento}%` : 'OFERTA'}
                                        </span>
                                    </div>

                                    <div className="row g-0">
                                        <div className="col-md-5 position-relative">
                                            <img
                                                src={product.imagen || 'https://placehold.co/600x400?text=Wurger'}
                                                className="img-fluid h-100 w-100"
                                                alt={product.nombreProducto}
                                                style={{ objectFit: 'cover', minHeight: '300px' }}
                                            />
                                            <div
                                                className="position-absolute bottom-0 start-0 end-0 p-3"
                                                style={{
                                                    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)'
                                                }}
                                            >
                                                <div className="text-white small">
                                                    <i className="bi bi-clock me-1"></i>
                                                    {daysLeft > 0 ? `Termina en ${daysLeft} días` : 'Último día'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-7 p-4 p-lg-5 d-flex flex-column justify-content-center">
                                            <div
                                                className="text-uppercase small fw-bold mb-2"
                                                style={{
                                                    color: 'var(--primary-color)',
                                                    letterSpacing: '1px'
                                                }}
                                            >
                                                {promo.nombre}
                                            </div>
                                            <h2 className="mb-3 fw-bold">
                                                {product.nombreProducto}
                                            </h2>
                                            <p className="text-muted mb-4">
                                                {promo.descripcion || product.descripcion || 'Aprovecha esta increíble oferta por tiempo limitado.'}
                                            </p>
                                            <div className="d-flex align-items-end gap-3 mb-4">
                                                <div>
                                                    <div className="small text-muted mb-1">Precio especial</div>
                                                    <span className="display-6 fw-bold" style={{ color: 'var(--primary-color)' }}>
                                                        {formatPrice(product.precioVenta)}
                                                    </span>
                                                </div>
                                                {product.precioOriginal && (
                                                    <div className="mb-2">
                                                        <div className="small text-muted mb-1">Antes</div>
                                                        <span className="h5 text-decoration-line-through text-muted">
                                                            {formatPrice(product.precioOriginal)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                className="btn btn-primary btn-lg rounded-pill px-5 align-self-start"
                                                onClick={() => addToCart({
                                                    ...product,
                                                    nombre: product.nombreProducto,
                                                    precio: product.precioVenta,
                                                    originalPrice: product.precioOriginal,
                                                    promoId: product.promoId
                                                })}
                                            >
                                                <i className="bi bi-cart-plus me-2"></i>
                                                Agregar al Carrito
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Carousel Controls */}
                {promotions.length > 1 && (
                    <div className="carousel-controls">
                        <button
                            className="carousel-arrow prev"
                            onClick={prevSlide}
                            aria-label="Previous slide"
                        >
                            <i className="bi bi-chevron-left"></i>
                        </button>
                        <div className="carousel-dots">
                            {promotions.map((_, index) => (
                                <button
                                    key={index}
                                    className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
                                    onClick={() => goToSlide(index)}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                        <button
                            className="carousel-arrow next"
                            onClick={nextSlide}
                            aria-label="Next slide"
                        >
                            <i className="bi bi-chevron-right"></i>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromotionCarousel;
