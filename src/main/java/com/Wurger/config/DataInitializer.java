package com.Wurger.config;

import com.Wurger.model.Usuario;
import com.Wurger.model.UsuarioInfo;
import com.Wurger.model.CategoriaProducto;
import com.Wurger.repository.UsuarioInfoRepository;
import com.Wurger.repository.UsuarioRepository;
import com.Wurger.repository.CategoriaProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private UsuarioInfoRepository usuarioInfoRepository;

    @Autowired
    private com.Wurger.service.UsuarioService usuarioService;

    @Autowired
    private CategoriaProductoRepository categoriaRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        ejecutarMigraciones();

        // Crear categorías por defecto
        String[] categorias = { "Comida Rápida", "Bebidas", "Postres", "Acompañamientos" };
        for (String nombreCat : categorias) {
            boolean existe = false;
            for (CategoriaProducto c : categoriaRepository.findAll()) {
                if (c.getNombreCategoria().equalsIgnoreCase(nombreCat)) {
                    existe = true;
                    break;
                }
            }

            if (!existe) {
                CategoriaProducto cat = new CategoriaProducto();
                cat.setNombreCategoria(nombreCat);
                cat.setCantidadCategoria(0);
                categoriaRepository.save(cat);
                System.out.println("✅ Categoría creada: " + nombreCat);
            }
        }

        // Verificar si el admin ya existe
        if (usuarioRepository.findByEmail("Wurger@admin.com").isEmpty()) {
            // Crear usuario admin
            Usuario admin = new Usuario();
            admin.setEmail("Wurger@admin.com");
            admin.setPassword("Wurger101010.");
            admin.setRol(Usuario.Rol.Administrador);
            admin.setEstado(Usuario.Estado.Activo);

            Usuario adminGuardado = usuarioService.save(admin);

            // Crear info del admin
            UsuarioInfo adminInfo = new UsuarioInfo();
            adminInfo.setNombre("Admin Default");
            adminInfo.setTelefono("0000000000");
            adminInfo.setDireccion("Wurger HQ");
            adminInfo.setUsuario(adminGuardado);

            usuarioInfoRepository.save(adminInfo);

            System.out.println("✅ Usuario administrador creado: Wurger@admin.com");
        } else {
            System.out.println("ℹ️ Usuario administrador ya existe");
        }
    }

    private void ejecutarMigraciones() {
        try {
            System.out.println("🔄 Verificando migraciones de base de datos...");

            // Verificar si columna id_promocion existe en detalle_venta
            Integer existeColumna = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'detalle_venta' AND COLUMN_NAME = 'id_promocion'",
                    Integer.class);

            if (existeColumna != null && existeColumna == 0) {
                System.out.println("🛠️ Aplicando migración: Agregar id_promocion a detalle_venta");

                jdbcTemplate.execute("ALTER TABLE detalle_venta ADD COLUMN id_promocion INT NULL");
                jdbcTemplate.execute(
                        "ALTER TABLE detalle_venta ADD CONSTRAINT fk_detalle_venta_promocion FOREIGN KEY (id_promocion) REFERENCES promocion(id_promocion) ON DELETE SET NULL ON UPDATE CASCADE");

                System.out.println("✅ Migración exitosa: Columna id_promocion agregada.");
            } else {
                System.out.println("ℹ️ Base de datos ya está actualizada.");
            }
        } catch (Exception e) {
            System.err.println("❌ Error aplicando migraciones: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
