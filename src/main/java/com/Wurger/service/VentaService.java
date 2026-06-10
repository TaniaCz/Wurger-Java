package com.Wurger.service;

import com.Wurger.dto.DetalleVentaDTO;
import com.Wurger.dto.VentaRequestDTO;
import com.Wurger.model.*;
import com.Wurger.repository.ProductoRepository;
import com.Wurger.repository.PromocionRepository;
import com.Wurger.repository.UsuarioRepository;
import com.Wurger.repository.VentaRepository;
import com.Wurger.repository.FormaPagoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class VentaService {

    @Autowired
    private VentaRepository ventaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private PromocionRepository promocionRepository;

    @Autowired
    private FormaPagoRepository formaPagoRepository;

    @Transactional
    public Venta crearVenta(VentaRequestDTO ventaDTO) {
        // 1. Crear la Cabecera de Venta
        Venta venta = new Venta();
        venta.setFecha(LocalDateTime.now());
        venta.setEstado(Venta.EstadoVenta.Pendiente);

        // Buscar Usuario
        Usuario usuario = usuarioRepository.findById(ventaDTO.getIdUsuario())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado ID: " + ventaDTO.getIdUsuario()));
        venta.setUsuario(usuario);

        // Guardar dirección y observaciones
        venta.setDireccion(ventaDTO.getDireccion());
        venta.setObservaciones(ventaDTO.getObservaciones());
        venta.setIdCajaSesion(ventaDTO.getIdCajaSesion());

        // 2. Procesar Detalles
        BigDecimal totalVenta = BigDecimal.ZERO;
        List<DetalleVenta> detallesEntidad = new ArrayList<>();

        for (DetalleVentaDTO item : ventaDTO.getDetalles()) {
            Producto producto = productoRepository.findById(item.getIdProducto())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado ID: " + item.getIdProducto()));

            // A) Validar Stock
            if (producto.getStock() < item.getCantidad()) {
                throw new RuntimeException("Stock insuficiente para: " + producto.getNombreProducto() +
                        " (Disponible: " + producto.getStock() + ", Solicitado: " + item.getCantidad() + ")");
            }

            // B) DESCONTAR STOCK INMEDIATAMENTE
            producto.setStock(producto.getStock() - item.getCantidad());
            productoRepository.save(producto);

            // C) Crear Detalle
            DetalleVenta detalle = new DetalleVenta();
            detalle.setCantidad(item.getCantidad());
            detalle.setPrecioUnitario(producto.getPrecioVenta());

            // Cálculos
            BigDecimal subtotal = producto.getPrecioVenta().multiply(new BigDecimal(item.getCantidad()));
            BigDecimal descuento = item.getDescuento() != null ? item.getDescuento() : BigDecimal.ZERO;

            detalle.setDescuento(descuento);
            detalle.setSubtotal(subtotal.subtract(descuento));

            // D) Rastrear Promoción si se aplicó
            if (item.getIdPromocion() != null) {
                Promocion promocion = promocionRepository.findById(item.getIdPromocion())
                        .orElseThrow(
                                () -> new RuntimeException("Promoción no encontrada ID: " + item.getIdPromocion()));

                detalle.setPromocion(promocion);

                // Incrementar contador de usos de la promoción
                Integer usosActuales = promocion.getCantidadUsos() != null ? promocion.getCantidadUsos() : 0;
                promocion.setCantidadUsos(usosActuales + item.getCantidad());
                promocionRepository.save(promocion);
            }

            // Relación Bidireccional
            detalle.setVenta(venta);
            detalle.setProducto(producto);
            detallesEntidad.add(detalle);

            // Sumar al total general
            totalVenta = totalVenta.add(detalle.getSubtotal());
        }

        venta.setDetalles(detallesEntidad);
        venta.setTotalVenta(totalVenta);

        // 3. Guardar Todo (Cascada guarda los detalles)
        Venta savedVenta = ventaRepository.save(venta);

        if (ventaDTO.getFormaPago() != null && !ventaDTO.getFormaPago().trim().isEmpty()) {
            FormaPago fp = new FormaPago();
            fp.setNombre(ventaDTO.getFormaPago());
            fp.setVenta(savedVenta);
            formaPagoRepository.save(fp);
        }

        return savedVenta;
    }

    public List<Venta> findAll() {
        return ventaRepository.findAll();
    }

    public List<Venta> findByUsuarioId(Integer usuarioId) {
        return ventaRepository.findByUsuarioId(usuarioId);
    }

    @Transactional
    public Venta updateEstado(Integer id, String nuevoEstado) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada ID: " + id));

        Venta.EstadoVenta estadoAnterior = venta.getEstado();
        Venta.EstadoVenta estadoNuevo;

        try {
            estadoNuevo = Venta.EstadoVenta.valueOf(nuevoEstado);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Estado inválido: " + nuevoEstado);
        }

        // Si cambia a Cancelada, devolver el stock
        if (estadoNuevo == Venta.EstadoVenta.Cancelada && estadoAnterior != Venta.EstadoVenta.Cancelada) {
            for (DetalleVenta detalle : venta.getDetalles()) {
                Producto producto = detalle.getProducto();

                if (producto == null) {
                    throw new RuntimeException("Producto no encontrado en el detalle de venta");
                }

                // Devolver stock
                producto.setStock(producto.getStock() + detalle.getCantidad());
                productoRepository.save(producto);

                // Decrementar contador de usos de promoción si se aplicó
                if (detalle.getPromocion() != null) {
                    Promocion promocion = detalle.getPromocion();
                    Integer usosActuales = promocion.getCantidadUsos() != null ? promocion.getCantidadUsos() : 0;
                    promocion.setCantidadUsos(Math.max(0, usosActuales - detalle.getCantidad()));
                    promocionRepository.save(promocion);
                }
            }
        }

        // Prevenir que se cancele una venta ya cancelada o que se vuelva a completar
        if (estadoAnterior == Venta.EstadoVenta.Cancelada && estadoNuevo != Venta.EstadoVenta.Cancelada) {
            throw new RuntimeException("No se puede cambiar el estado de una venta cancelada");
        }

        venta.setEstado(estadoNuevo);
        return ventaRepository.save(venta);
    }
}