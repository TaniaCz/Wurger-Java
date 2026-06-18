package com.Wurger.repository;

import com.Wurger.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional; // <--- Asegúrate de importar esto

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    // AGREGA ESTA LÍNEA:
    Optional<Usuario> findByEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT u FROM Usuario u JOIN Venta v ON v.usuario.id = u.id")
    java.util.List<Usuario> findUsuariosConPedidos();
}