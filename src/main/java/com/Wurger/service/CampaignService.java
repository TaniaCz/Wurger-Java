package com.Wurger.service;

import com.Wurger.dto.CampaignRequestDTO;
import com.Wurger.dto.CampaignTargetDTO;
import com.Wurger.model.Promocion;
import com.Wurger.repository.PromocionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class CampaignService {

    @Autowired
    private EmailService emailService;

    @Autowired
    private PromocionRepository promocionRepository;

    // Helper static class to hold resolved promotion details
    public static class PromoDetails {
        public final String discount;
        public final String product;
        public final String image;

        public PromoDetails(String discount, String product, String image) {
            this.discount = discount;
            this.product = product;
            this.image = image;
        }
    }

    @Transactional(readOnly = true)
    public PromoDetails getPromoDetails(Integer id) {
        if (id == null) return null;
        Optional<Promocion> promoOpt = promocionRepository.findById(id);
        if (promoOpt.isPresent()) {
            Promocion p = promoOpt.get();
            String discountTextVal = "";
            if ("PORCENTAJE".equalsIgnoreCase(p.getTipoDescuento())) {
                discountTextVal = String.format("%.0f%% Dto.", p.getDescuento());
            } else {
                discountTextVal = String.format("$%,.0f Dto.", p.getDescuento());
            }
            String productPromoVal = p.getProducto() != null ? p.getProducto().getNombreProducto() : "";
            String imgUrlVal = p.getProducto() != null ? p.getProducto().getImagen() : "";
            return new PromoDetails(discountTextVal, productPromoVal, imgUrlVal);
        }
        return null;
    }

    @Async("taskExecutor")
    public void sendCampaignAsync(CampaignRequestDTO request) {
        // 1. Resolve promotion details in a short, separate transaction
        String discountTextVal = "";
        String productPromoVal = "";
        String imgUrlVal = "";

        if (request.getIdPromocion() != null) {
            PromoDetails details = getPromoDetails(request.getIdPromocion());
            if (details != null) {
                discountTextVal = details.discount;
                productPromoVal = details.product;
                imgUrlVal = details.image;
            }
        }

        // 2. Now run the mailing loop. No transaction or DB connection is held during sleeps!
        System.out.println("📬 [COLA] Iniciando campaña masiva: '" + request.getAsunto() + "' para " + request.getDestinatarios().size() + " destinatarios.");
        int enviados = 0;
        int errores = 0;

        for (CampaignTargetDTO target : request.getDestinatarios()) {
            try {
                // Delay to prevent SMTP blocking
                Thread.sleep(1000);
                
                emailService.enviarCorreoCampana(
                        target.getEmail(),
                        target.getNombre(),
                        request.getAsunto(),
                        request.getTitulo(),
                        request.getMensaje(),
                        discountTextVal,
                        productPromoVal,
                        imgUrlVal
                );
                enviados++;
                System.out.println("✅ [COLA] Correo enviado a: " + target.getEmail());
            } catch (Exception e) {
                errores++;
                System.err.println("❌ [COLA] Error al enviar a " + target.getEmail() + ": " + e.getMessage());
            }
        }
        System.out.println("🏁 [COLA] Campaña finalizada. Enviados: " + enviados + " | Errores: " + errores);
    }
}
