package com.Wurger.repository;

import com.Wurger.model.Gasto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GastoRepository extends JpaRepository<Gasto, Integer> {
    List<Gasto> findByIdCajaSesion(Integer idCajaSesion);
}
