package com.Wurger.controller;

import com.Wurger.dto.CampaignRequestDTO;
import com.Wurger.dto.CampaignTargetDTO;
import com.Wurger.model.Promocion;
import com.Wurger.model.Usuario;
import com.Wurger.repository.PromocionRepository;
import com.Wurger.repository.UsuarioRepository;
import com.Wurger.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/campanas")
public class EmailCampaignController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PromocionRepository promocionRepository;

    @Autowired
    private EmailService emailService;

    @GetMapping("/destinatarios")
    public ResponseEntity<List<CampaignTargetDTO>> getDestinatariosConPedidos() {
        try {
            List<Usuario> usuarios = usuarioRepository.findUsuariosConPedidos();
            List<CampaignTargetDTO> targets = usuarios.stream().map(u -> {
                String name = "Cliente";
                if (u.getUsuarioInfo() != null && u.getUsuarioInfo().getNombre() != null) {
                    name = u.getUsuarioInfo().getNombre();
                }
                return new CampaignTargetDTO(u.getEmail(), name);
            }).collect(Collectors.toList());
            return ResponseEntity.ok(targets);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/enviar")
    public ResponseEntity<String> enviarCampana(@RequestBody CampaignRequestDTO request) {
        if (request.getDestinatarios() == null || request.getDestinatarios().isEmpty()) {
            return ResponseEntity.badRequest().body("La lista de destinatarios está vacía.");
        }

        // 1. Resolve promotion details synchronously (fast query, < 2ms)
        String discountTextVal = "";
        String productPromoVal = "";
        String imgUrlVal = "";

        if (request.getIdPromocion() != null) {
            Optional<Promocion> promoOpt = promocionRepository.findById(request.getIdPromocion());
            if (promoOpt.isPresent()) {
                Promocion p = promoOpt.get();
                if ("PORCENTAJE".equalsIgnoreCase(p.getTipoDescuento())) {
                    discountTextVal = String.format("%.0f%% Dto.", p.getDescuento());
                } else {
                    discountTextVal = String.format("$%,.0f Dto.", p.getDescuento());
                }
                if (p.getProducto() != null) {
                    productPromoVal = p.getProducto().getNombreProducto();
                    imgUrlVal = p.getProducto().getImagen();
                }
            }
        }

        final String finalDiscount = discountTextVal;
        final String finalProduct = productPromoVal;
        final String finalImg = imgUrlVal;

        // 2. Spawn a separate JVM thread. This is 100% guaranteed to run asynchronously and return instantly.
        new Thread(() -> {
            System.out.println("📬 [HILO-BG] Iniciando campaña masiva: '" + request.getAsunto() + "' para " + request.getDestinatarios().size() + " destinatarios.");
            int enviados = 0;
            int errores = 0;

            for (CampaignTargetDTO target : request.getDestinatarios()) {
                try {
                    // Small delay to prevent SMTP block (1 second)
                    Thread.sleep(1000);
                    
                    emailService.enviarCorreoCampana(
                            target.getEmail(),
                            target.getNombre(),
                            request.getAsunto(),
                            request.getTitulo(),
                            request.getMensaje(),
                            finalDiscount,
                            finalProduct,
                            finalImg
                    );
                    enviados++;
                    System.out.println("✅ [HILO-BG] Correo enviado con éxito a: " + target.getEmail());
                } catch (Exception e) {
                    errores++;
                    System.err.println("❌ [HILO-BG] Error al enviar a " + target.getEmail() + ": " + e.getMessage());
                }
            }
            System.out.println("🏁 [HILO-BG] Campaña finalizada. Enviados: " + enviados + " | Errores: " + errores);
        }).start();

        return ResponseEntity.ok("Campaña iniciada. Se están procesando los correos en segundo plano.");
    }
}
