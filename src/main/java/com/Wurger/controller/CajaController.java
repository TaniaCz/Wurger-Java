package com.Wurger.controller;

import com.Wurger.model.CajaSesion;
import com.Wurger.model.Venta;
import com.Wurger.model.Gasto;
import com.Wurger.model.FormaPago;
import com.Wurger.repository.CajaSesionRepository;
import com.Wurger.repository.VentaRepository;
import com.Wurger.repository.GastoRepository;
import com.Wurger.repository.FormaPagoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/caja")
public class CajaController {

    @Autowired
    private CajaSesionRepository cajaSesionRepository;

    @Autowired
    private VentaRepository ventaRepository;

    @Autowired
    private GastoRepository gastoRepository;

    @Autowired
    private FormaPagoRepository formaPagoRepository;

    @GetMapping("/activa")
    public ResponseEntity<?> getActiva() {
        Optional<CajaSesion> activa = cajaSesionRepository.findFirstByEstadoOrderByIdDesc("ABIERTA");
        if (activa.isPresent()) {
            return ResponseEntity.ok(activa.get());
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/abrir")
    public ResponseEntity<?> abrirCaja(@RequestBody Map<String, Object> request) {
        Optional<CajaSesion> activa = cajaSesionRepository.findFirstByEstadoOrderByIdDesc("ABIERTA");
        if (activa.isPresent()) {
            return ResponseEntity.badRequest().body("Ya existe una caja abierta con ID: " + activa.get().getId());
        }

        try {
            BigDecimal montoApertura = new BigDecimal(request.get("montoApertura").toString());
            Integer idUsuarioApertura = Integer.valueOf(request.get("idUsuarioApertura").toString());
            String observaciones = request.containsKey("observaciones") ? (String) request.get("observaciones") : "";

            CajaSesion sesion = new CajaSesion();
            sesion.setFechaApertura(LocalDateTime.now());
            sesion.setMontoApertura(montoApertura);
            sesion.setIdUsuarioApertura(idUsuarioApertura);
            sesion.setEstado("ABIERTA");
            sesion.setObservaciones(observaciones);

            return ResponseEntity.ok(cajaSesionRepository.save(sesion));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al abrir caja: " + e.getMessage());
        }
    }

    @PostMapping("/cerrar")
    public ResponseEntity<?> cerrarCaja(@RequestBody Map<String, Object> request) {
        Optional<CajaSesion> activaOpt = cajaSesionRepository.findFirstByEstadoOrderByIdDesc("ABIERTA");
        if (!activaOpt.isPresent()) {
            return ResponseEntity.badRequest().body("No hay ninguna caja abierta actualmente.");
        }

        try {
            CajaSesion sesion = activaOpt.get();
            BigDecimal montoCierre = new BigDecimal(request.get("montoCierre").toString());
            Integer idUsuarioCierre = Integer.valueOf(request.get("idUsuarioCierre").toString());
            String observaciones = request.containsKey("observaciones") ? (String) request.get("observaciones") : "";

            // Calcular monto esperado para arqueo
            Map<String, Object> resumen = calcularResumenSesion(sesion);
            BigDecimal montoEsperado = (BigDecimal) resumen.get("montoEsperado");

            sesion.setFechaCierre(LocalDateTime.now());
            sesion.setMontoCierre(montoCierre);
            sesion.setIdUsuarioCierre(idUsuarioCierre);
            sesion.setEstado("CERRADA");
            sesion.setObservaciones(observaciones);

            CajaSesion cerrada = cajaSesionRepository.save(sesion);
            
            Map<String, Object> response = new HashMap<>();
            response.put("sesion", cerrada);
            response.put("resumen", resumen);
            response.put("diferencia", montoCierre.subtract(montoEsperado));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al cerrar caja: " + e.getMessage());
        }
    }

    @GetMapping("/resumen/{id}")
    public ResponseEntity<?> getResumen(@PathVariable Integer id) {
        Optional<CajaSesion> sesionOpt = cajaSesionRepository.findById(id);
        if (!sesionOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        CajaSesion sesion = sesionOpt.get();
        Map<String, Object> resumen = calcularResumenSesion(sesion);
        return ResponseEntity.ok(resumen);
    }

    private Map<String, Object> calcularResumenSesion(CajaSesion sesion) {
        List<Venta> ventas = ventaRepository.findByIdCajaSesion(sesion.getId());
        List<Gasto> gastos = gastoRepository.findByIdCajaSesion(sesion.getId());

        BigDecimal totalVentas = BigDecimal.ZERO;
        BigDecimal ventasEfectivo = BigDecimal.ZERO;
        BigDecimal ventasOtros = BigDecimal.ZERO;

        for (Venta venta : ventas) {
            if (venta.getEstado() == Venta.EstadoVenta.Cancelada) {
                continue; // Ignorar ventas canceladas en el arqueo de caja
            }
            BigDecimal totalVenta = venta.getTotalVenta() != null ? venta.getTotalVenta() : BigDecimal.ZERO;
            totalVentas = totalVentas.add(totalVenta);

            // Determinar forma de pago
            List<FormaPago> formasPago = formaPagoRepository.findByVentaId(venta.getId());
            boolean esEfectivo = false;
            if (formasPago.isEmpty()) {
                // Por defecto, si no hay método registrado, asumir efectivo para no perder el flujo
                esEfectivo = true;
            } else {
                for (FormaPago fp : formasPago) {
                    if ("Efectivo".equalsIgnoreCase(fp.getNombre()) || "Cash".equalsIgnoreCase(fp.getNombre())) {
                        esEfectivo = true;
                        break;
                    }
                }
            }

            if (esEfectivo) {
                ventasEfectivo = ventasEfectivo.add(totalVenta);
            } else {
                ventasOtros = ventasOtros.add(totalVenta);
            }
        }

        BigDecimal totalGastos = BigDecimal.ZERO;
        for (Gasto gasto : gastos) {
            // Solo restar los gastos que fueron pagados con Efectivo de Caja (para el arqueo físico de caja)
            if ("Efectivo".equalsIgnoreCase(gasto.getMedioPago())) {
                totalGastos = totalGastos.add(gasto.getMonto());
            }
        }

        BigDecimal montoEsperado = sesion.getMontoApertura()
                .add(ventasEfectivo)
                .subtract(totalGastos);

        Map<String, Object> resumen = new HashMap<>();
        resumen.put("idSesion", sesion.getId());
        resumen.put("estado", sesion.getEstado());
        resumen.put("fechaApertura", sesion.getFechaApertura());
        resumen.put("fechaCierre", sesion.getFechaCierre());
        resumen.put("montoApertura", sesion.getMontoApertura());
        resumen.put("montoCierre", sesion.getMontoCierre());
        resumen.put("ventasTotal", totalVentas);
        resumen.put("ventasEfectivo", ventasEfectivo);
        resumen.put("ventasOtros", ventasOtros);
        resumen.put("gastosCaja", totalGastos);
        resumen.put("montoEsperado", montoEsperado);
        if (sesion.getMontoCierre() != null) {
            resumen.put("diferencia", sesion.getMontoCierre().subtract(montoEsperado));
        }

        return resumen;
    }
}
