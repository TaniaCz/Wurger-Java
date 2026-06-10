package com.Wurger.service;

import com.Wurger.model.Gasto;
import com.Wurger.repository.GastoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class GastoService {

    @Autowired
    private GastoRepository gastoRepository;

    public List<Gasto> findAll() {
        return gastoRepository.findAll();
    }

    public Optional<Gasto> findById(Integer id) {
        return gastoRepository.findById(id);
    }

    public List<Gasto> findByIdCajaSesion(Integer idCajaSesion) {
        return gastoRepository.findByIdCajaSesion(idCajaSesion);
    }

    public Gasto save(Gasto gasto) {
        return gastoRepository.save(gasto);
    }

    public Gasto update(Integer id, Gasto details) {
        Gasto existing = gastoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gasto no encontrado con ID: " + id));
        existing.setDescripcion(details.getDescripcion());
        existing.setMonto(details.getMonto());
        existing.setFecha(details.getFecha());
        existing.setCategoria(details.getCategoria());
        existing.setMedioPago(details.getMedioPago());
        existing.setIdCajaSesion(details.getIdCajaSesion());
        return gastoRepository.save(existing);
    }

    public boolean delete(Integer id) {
        if (gastoRepository.existsById(id)) {
            gastoRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
