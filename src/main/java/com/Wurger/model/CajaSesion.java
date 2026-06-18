package com.Wurger.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "caja_sesion")
@Getter
@Setter
public class CajaSesion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_caja_sesion")
    private Integer id;

    @Column(name = "fecha_apertura", nullable = false)
    private LocalDateTime fechaApertura;

    @Column(name = "fecha_cierre")
    private LocalDateTime fechaCierre;

    @Column(name = "monto_apertura", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoApertura;

    @Column(name = "monto_cierre", precision = 10, scale = 2)
    private BigDecimal montoCierre;

    @Column(nullable = false, length = 20)
    private String estado; // "ABIERTA" o "CERRADA"

    @Column(name = "id_usuario_apertura", nullable = false)
    private Integer idUsuarioApertura;

    @Column(name = "id_usuario_cierre")
    private Integer idUsuarioCierre;

    @Column(length = 255)
    private String observaciones;
}
