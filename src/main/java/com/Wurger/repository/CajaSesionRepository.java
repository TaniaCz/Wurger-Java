package com.Wurger.repository;

import com.Wurger.model.CajaSesion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CajaSesionRepository extends JpaRepository<CajaSesion, Integer> {
    Optional<CajaSesion> findFirstByEstadoOrderByIdDesc(String estado);
}
