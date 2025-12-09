package com.Wurger.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class DetalleVentaDTO {
    private Integer idProducto;
    private Integer cantidad;
    private BigDecimal descuento; // Puede ser 0
    private Integer idPromocion; // ID de la promoción aplicada (opcional)
}