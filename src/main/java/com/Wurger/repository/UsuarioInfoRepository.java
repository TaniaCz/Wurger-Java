package com.Wurger.repository;

import com.Wurger.model.Usuario;
import com.Wurger.model.UsuarioInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UsuarioInfoRepository extends JpaRepository<UsuarioInfo, Integer> {
    Optional<UsuarioInfo> findByUsuario(Usuario usuario);
}
