package com.Wurger.controller;

import com.Wurger.model.Gasto;
import com.Wurger.service.GastoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/gastos")
public class GastoController {

    @Autowired
    private GastoService gastoService;

    @GetMapping
    public List<Gasto> getAll() {
        return gastoService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Gasto> getById(@PathVariable Integer id) {
        return gastoService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/caja/{idCajaSesion}")
    public List<Gasto> getByIdCajaSesion(@PathVariable Integer idCajaSesion) {
        return gastoService.findByIdCajaSesion(idCajaSesion);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Gasto gasto) {
        try {
            return ResponseEntity.ok(gastoService.save(gasto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody Gasto details) {
        try {
            return ResponseEntity.ok(gastoService.update(id, details));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        if (gastoService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
