package com.Wurger.repository;

import com.Wurger.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Integer> {
    java.util.List<Venta> findByUsuarioIdAndIdCajaSesionIsNull(Integer usuarioId);
    java.util.List<Venta> findByIdCajaSesion(Integer idCajaSesion);
}
