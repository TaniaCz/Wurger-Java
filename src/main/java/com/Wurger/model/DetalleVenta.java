package com.Wurger.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import java.math.BigDecimal;

@Entity
@Table(name = "detalle_venta")
@Getter
@Setter
public class DetalleVenta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_detalle_venta")
    private Integer id;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "precio_unitario", nullable = false)
    private BigDecimal precioUnitario;

    @Column(nullable = false)
    private BigDecimal subtotal;

    private BigDecimal descuento;

    // Relación N:1 con Venta
    @ManyToOne
    @JoinColumn(name = "id_venta", nullable = false)
    private Venta venta;

    // Relación N:1 con Producto
    // @NotFound permite que el sistema continúe si el producto fue eliminado
    @ManyToOne
    @JoinColumn(name = "id_producto", nullable = false)
    @NotFound(action = NotFoundAction.IGNORE)
    private Producto producto;

    // Relación N:1 con Promocion (opcional)
    // Permite rastrear qué promoción se aplicó a este detalle
    @ManyToOne
    @JoinColumn(name = "id_promocion")
    @NotFound(action = NotFoundAction.IGNORE)
    private Promocion promocion;
}