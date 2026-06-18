package com.Wurger.dto;

import lombok.Data;
import java.util.List;

@Data
public class CampaignRequestDTO {
    private List<CampaignTargetDTO> destinatarios;
    private String asunto;
    private String titulo;
    private String mensaje;
    private Integer idPromocion;
}
