package com.Wurger.repository;

import com.Wurger.model.FormaPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FormaPagoRepository extends JpaRepository<FormaPago, Integer> {
    java.util.List<FormaPago> findByVentaId(Integer ventaId);
}
