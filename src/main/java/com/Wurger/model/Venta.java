package com.Wurger.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "venta")
@Getter
@Setter
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_venta")
    private Integer id;

    @Column(nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fecha;

    @Convert(converter = EstadoVentaConverter.class)
    @Column(length = 20)
    private EstadoVenta estado;

    @Column(name = "Total_venta")
    private BigDecimal totalVenta;

    @Column(length = 500)
    private String observaciones;

    @Column(length = 500)
    private String direccion;

    @Column(name = "id_caja_sesion")
    private Integer idCajaSesion;

    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    // Relación 1:N con DetalleVenta
    // CascadeType.ALL permite que al guardar la Venta, se guarden sus detalles
    // automáticamente
    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("venta") // Evita loop infinito al mostrar detalles
    private List<DetalleVenta> detalles;

    public enum EstadoVenta {
        Pendiente,
        EnProceso,
        Completada,
        Cancelada,
        // Legacy values for backward compatibility
        Pagada,
        Anulada
    }
}