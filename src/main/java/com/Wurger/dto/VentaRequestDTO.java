package com.Wurger.dto;

import lombok.Data;
import java.util.List;

@Data
public class VentaRequestDTO {
    private Integer idUsuario; // El cliente o vendedor
    private String direccion; // Dirección de envío
    private String observaciones; // Notas del pedido
    private Integer idCajaSesion; // ID de sesión de caja (POS)
    private String formaPago;     // Forma de pago (p. ej. Efectivo, Tarjeta, Nequi, etc.)
    private List<DetalleVentaDTO> detalles;
}