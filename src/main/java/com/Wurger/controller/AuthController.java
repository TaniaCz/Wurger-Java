package com.Wurger.controller;

import com.Wurger.dto.LoginRequestDTO;
import com.Wurger.dto.ResetPasswordRequestDTO;
import com.Wurger.dto.UsuarioResponseDTO;
import com.Wurger.model.PasswordResetToken;
import com.Wurger.model.Usuario;
import com.Wurger.model.UsuarioInfo;
import com.Wurger.repository.PasswordResetTokenRepository;
import com.Wurger.repository.UsuarioInfoRepository;
import com.Wurger.repository.UsuarioRepository;
import com.Wurger.service.EmailService;
import com.Wurger.service.UsuarioService;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private UsuarioInfoRepository usuarioInfoRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private EmailService emailService;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // =====================================================================
    // REGISTRO
    // =====================================================================
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody com.Wurger.dto.RegisterRequestDTO registerRequest,
            BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String errors = bindingResult.getAllErrors().stream()
                    .map(error -> error.getDefaultMessage())
                    .collect(Collectors.joining(", "));
            return ResponseEntity.badRequest().body(errors);
        }

        if (usuarioRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("El email ya está registrado");
        }

        Usuario usuario = new Usuario();
        usuario.setEmail(registerRequest.getEmail());
        usuario.setPassword(registerRequest.getPassword());
        usuario.setRol(Usuario.Rol.Usuario);
        usuario.setEstado(Usuario.Estado.Activo);

        Usuario nuevoUsuario = usuarioService.save(usuario);

        UsuarioInfo info = new UsuarioInfo();
        info.setNombre(registerRequest.getNombre());
        info.setTelefono(registerRequest.getTelefono());
        info.setDireccion(registerRequest.getDireccion());
        info.setUsuario(nuevoUsuario);
        usuarioInfoRepository.save(info);

        // Enviar correo de bienvenida
        try {
            emailService.enviarBienvenida(registerRequest.getEmail(), registerRequest.getNombre());
        } catch (Exception e) {
            // Si el correo falla, el registro igualmente fue exitoso
            System.err.println("⚠️ No se pudo enviar correo de bienvenida a " + registerRequest.getEmail());
            System.err.println("   Causa: " + e.getMessage());
            if (e.getCause() != null) System.err.println("   Root cause: " + e.getCause().getMessage());
        }

        return ResponseEntity.ok("Usuario registrado exitosamente");
    }

    // =====================================================================
    // LOGIN
    // =====================================================================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO loginRequest) {
        Usuario usuario = usuarioRepository.findByEmail(loginRequest.getEmail()).orElse(null);

        if (usuario == null) {
            return ResponseEntity.status(401).body("Usuario o contraseña incorrectos");
        }

        if (passwordEncoder.matches(loginRequest.getPassword(), usuario.getPassword())) {
            if (usuario.getEstado() == Usuario.Estado.Inactivo) {
                return ResponseEntity.status(403).body("Usuario inactivo. Contacte al administrador.");
            }

            UsuarioResponseDTO response = new UsuarioResponseDTO();
            response.setId(usuario.getId());
            response.setEmail(usuario.getEmail());
            response.setRol(usuario.getRol());
            response.setEstado(usuario.getEstado());

            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body("Usuario o contraseña incorrectos");
        }
    }

    // =====================================================================
    // SOLICITAR RECUPERACIÓN DE CONTRASEÑA
    // =====================================================================
    @PostMapping("/forgot-password")
    @Transactional
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        // Siempre respondemos lo mismo por seguridad (no revelar si el email existe)
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.ok("Si el correo está registrado, recibirás un enlace de recuperación.");
        }

        Usuario usuario = usuarioOpt.get();

        // UPSERT: actualizar token existente o crear uno nuevo (evita error de clave duplicada)
        String tokenStr = UUID.randomUUID().toString();
        LocalDateTime expiracion = LocalDateTime.now().plusMinutes(30);

        Optional<PasswordResetToken> existente = tokenRepository.findByUsuario(usuario);
        PasswordResetToken resetToken;
        if (existente.isPresent()) {
            // Actualizar el token existente
            resetToken = existente.get();
            resetToken.setToken(tokenStr);
            resetToken.setExpiracion(expiracion);
        } else {
            // Crear uno nuevo
            resetToken = new PasswordResetToken();
            resetToken.setToken(tokenStr);
            resetToken.setUsuario(usuario);
            resetToken.setExpiracion(expiracion);
        }
        tokenRepository.save(resetToken);

        // Obtener nombre del usuario si existe
        String nombre = "Usuario";
        Optional<UsuarioInfo> infoOpt = usuarioInfoRepository.findByUsuario(usuario);
        if (infoOpt.isPresent()) {
            nombre = infoOpt.get().getNombre();
        }

        // Enviar correo de recuperación
        try {
            emailService.enviarRecuperacion(email, nombre, tokenStr);
        } catch (Exception e) {
            System.err.println("⚠️ Error enviando correo de recuperación: " + e.getMessage());
            if (e.getCause() != null) System.err.println("   Root cause: " + e.getCause().getMessage());
            return ResponseEntity.status(500).body("Error al enviar el correo. Verifica la configuración SMTP.");
        }

        return ResponseEntity.ok("Si el correo está registrado, recibirás un enlace de recuperación.");
    }

    // =====================================================================
    // RESTABLECER CONTRASEÑA
    // =====================================================================
    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequestDTO request) {
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(request.getToken());

        if (tokenOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Enlace inválido o ya fue usado.");
        }

        PasswordResetToken resetToken = tokenOpt.get();

        if (resetToken.isExpirado()) {
            tokenRepository.delete(resetToken);
            return ResponseEntity.badRequest().body("El enlace ha expirado. Solicita uno nuevo.");
        }

        // Actualizar la contraseña del usuario
        Usuario usuario = resetToken.getUsuario();
        usuario.setPassword(passwordEncoder.encode(request.getNewPassword()));
        usuarioRepository.save(usuario);

        // Eliminar el token ya usado
        tokenRepository.delete(resetToken);

        return ResponseEntity.ok("Tu contraseña ha sido actualizada exitosamente.");
    }
}