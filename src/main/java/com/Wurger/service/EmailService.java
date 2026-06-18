package com.Wurger.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // =====================================================================
    // CORREO DE BIENVENIDA (al registrarse)
    // =====================================================================
    public void enviarBienvenida(String destinatario, String nombre) {
        String asunto = "🍔 ¡Bienvenido a Wurger, " + nombre + "!";
        String html = """
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Bienvenido a Wurger</title>
            </head>
            <body style="margin:0; padding:0; font-family: 'Segoe UI', Arial, sans-serif; background-color:#f0f0f0;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f0f0f0; padding: 40px 0;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.12);">
                      
                      <!-- HEADER -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #FF9F1C 0%%, #FF6B35 100%%); padding: 48px 40px; text-align: center;">
                          <h1 style="color:#ffffff; font-size:42px; margin:0; font-weight:900; letter-spacing:-1px;">🍔 WURGER</h1>
                          <p style="color:rgba(255,255,255,0.85); font-size:16px; margin:8px 0 0 0; font-weight:500;">Las mejores hamburguesas de la ciudad</p>
                        </td>
                      </tr>
                      
                      <!-- BODY -->
                      <tr>
                        <td style="padding: 48px 40px;">
                          <h2 style="color:#1a1a1a; font-size:28px; margin: 0 0 16px 0; font-weight:800;">¡Hola, %s! 👋</h2>
                          <p style="color:#555; font-size:16px; line-height:1.7; margin: 0 0 24px 0;">
                            ¡Tu cuenta en <strong style="color:#FF9F1C;">Wurger</strong> ha sido creada exitosamente! Estás a punto de descubrir el sabor que cambiará tu vida. 🎉
                          </p>
                          <p style="color:#555; font-size:16px; line-height:1.7; margin: 0 0 32px 0;">
                            Ahora puedes explorar nuestro menú, hacer pedidos y disfrutar de las hamburguesas más apetitosas que hayas probado.
                          </p>
                          
                          <!-- CTA BUTTON -->
                          <div style="text-align: center; margin: 32px 0;">
                            <a href="http://localhost:5173/login" 
                               style="background: linear-gradient(135deg, #FF9F1C 0%%, #FF6B35 100%%); 
                                      color: white; 
                                      text-decoration: none; 
                                      padding: 16px 40px; 
                                      border-radius: 50px; 
                                      font-size: 17px; 
                                      font-weight: 700;
                                      display: inline-block;
                                      box-shadow: 0 4px 20px rgba(255,107,53,0.4);">
                              🍔 Ver el Menú Ahora
                            </a>
                          </div>
                          
                          <!-- FEATURES -->
                          <table width="100%%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
                            <tr>
                              <td width="32%%" style="text-align:center; padding: 20px 10px; background:#fff8f0; border-radius:12px;">
                                <div style="font-size:32px; margin-bottom:8px;">🔥</div>
                                <p style="color:#333; font-weight:700; margin:0; font-size:14px;">Recetas Únicas</p>
                              </td>
                              <td width="4%%"></td>
                              <td width="32%%" style="text-align:center; padding: 20px 10px; background:#fff8f0; border-radius:12px;">
                                <div style="font-size:32px; margin-bottom:8px;">🚀</div>
                                <p style="color:#333; font-weight:700; margin:0; font-size:14px;">Pedidos Rápidos</p>
                              </td>
                              <td width="4%%"></td>
                              <td width="32%%" style="text-align:center; padding: 20px 10px; background:#fff8f0; border-radius:12px;">
                                <div style="font-size:32px; margin-bottom:8px;">❤️</div>
                                <p style="color:#333; font-weight:700; margin:0; font-size:14px;">Con Amor</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- FOOTER -->
                      <tr>
                        <td style="background:#1a1a1a; padding: 24px 40px; text-align: center;">
                          <p style="color:#888; font-size:13px; margin:0; line-height:1.6;">
                            Si no creaste esta cuenta, puedes ignorar este correo.<br>
                            © 2024 Wurger. Todos los derechos reservados.
                          </p>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(nombre);

        enviarHtml(destinatario, asunto, html);
    }

    // =====================================================================
    // CORREO DE RECUPERACIÓN DE CONTRASEÑA
    // =====================================================================
    public void enviarRecuperacion(String destinatario, String nombre, String token) {
        String enlace = "http://localhost:5173/reset-password?token=" + token;
        String asunto = "🔑 Recupera tu contraseña de Wurger";
        String html = """
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin:0; padding:0; font-family: 'Segoe UI', Arial, sans-serif; background-color:#f0f0f0;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f0f0f0; padding: 40px 0;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.12);">
                      
                      <!-- HEADER -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #1a1a2e 0%%, #16213e 100%%); padding: 48px 40px; text-align: center;">
                          <h1 style="color:#FF9F1C; font-size:42px; margin:0; font-weight:900; letter-spacing:-1px;">🍔 WURGER</h1>
                          <p style="color:rgba(255,255,255,0.6); font-size:16px; margin:8px 0 0 0; font-weight:500;">Recuperación de contraseña</p>
                        </td>
                      </tr>
                      
                      <!-- BODY -->
                      <tr>
                        <td style="padding: 48px 40px;">
                          <div style="text-align:center; margin-bottom:32px;">
                            <span style="font-size:64px;">🔑</span>
                          </div>
                          <h2 style="color:#1a1a1a; font-size:24px; margin: 0 0 16px 0; font-weight:800; text-align:center;">¿Olvidaste tu contraseña, %s?</h2>
                          <p style="color:#555; font-size:16px; line-height:1.7; margin: 0 0 24px 0; text-align:center;">
                            No te preocupes, le pasa a los mejores. Haz clic en el botón de abajo para crear una nueva contraseña.
                          </p>
                          
                          <!-- CTA BUTTON -->
                          <div style="text-align: center; margin: 32px 0;">
                            <a href="%s" 
                               style="background: linear-gradient(135deg, #FF9F1C 0%%, #FF6B35 100%%); 
                                      color: white; 
                                      text-decoration: none; 
                                      padding: 16px 40px; 
                                      border-radius: 50px; 
                                      font-size: 17px; 
                                      font-weight: 700;
                                      display: inline-block;
                                      box-shadow: 0 4px 20px rgba(255,107,53,0.4);">
                              🔐 Crear Nueva Contraseña
                            </a>
                          </div>
                          
                          <!-- WARNING BOX -->
                          <div style="background:#fff8f0; border-left: 4px solid #FF9F1C; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-top: 32px;">
                            <p style="color:#666; font-size:14px; margin:0; line-height:1.6;">
                              ⚠️ <strong>Este enlace vence en 30 minutos.</strong><br>
                              Si no solicitaste el cambio de contraseña, puedes ignorar este correo con total tranquilidad.
                            </p>
                          </div>
                        </td>
                      </tr>
                      
                      <!-- FOOTER -->
                      <tr>
                        <td style="background:#1a1a1a; padding: 24px 40px; text-align: center;">
                          <p style="color:#888; font-size:13px; margin:0; line-height:1.6;">
                            © 2024 Wurger. Todos los derechos reservados.
                          </p>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(nombre, enlace);

        enviarHtml(destinatario, asunto, html);
    }

    // =====================================================================
    // CORREO DE CAMPAÑA PROMOCIONAL
    // =====================================================================
    public void enviarCorreoCampana(String destinatario, String nombre, String asunto, String titulo, String mensaje, String descuentoText, String productoPromo, String imagenProducto) {
        String promoBox = "";
        if (descuentoText != null && !descuentoText.isEmpty()) {
            String productSection = "";
            if (productoPromo != null && !productoPromo.isEmpty()) {
                String imgHtml = "";
                if (imagenProducto != null && !imagenProducto.isEmpty()) {
                    imgHtml = "<div style='margin-top: 12px;'><img src='" + imagenProducto + "' alt='" + productoPromo + "' style='max-width: 200px; border-radius: 12px; border: 1px solid #ddd; object-fit: cover;' /></div>";
                }
                productSection = "<div style='margin-top: 16px; font-weight: 700; color: #1a1a1a;'>" +
                                 "Aplica para: <strong style='color:#FF9F1C;'>" + productoPromo + "</strong>" +
                                 "</div>" + imgHtml;
            }
            
            promoBox = """
                <div style="background: #fff8f0; border: 2px dashed #FF9F1C; border-radius: 16px; padding: 24px; text-align: center; margin: 32px 0;">
                    <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #FF6B35; font-weight: 800; margin-bottom: 8px;">🔥 DESCUENTO ESPECIAL 🔥</div>
                    <div style="font-size: 36px; font-weight: 900; color: #FF6B35; margin-bottom: 8px;">%s</div>
                    %s
                </div>
            """.formatted(descuentoText, productSection);
        }

        String html = """
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>%s</title>
            </head>
            <body style="margin:0; padding:0; font-family: 'Segoe UI', Arial, sans-serif; background-color:#f0f0f0;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f0f0f0; padding: 40px 0;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.12);">
                      
                      <!-- HEADER -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #FF9F1C 0%%, #FF6B35 100%%); padding: 48px 40px; text-align: center;">
                          <h1 style="color:#ffffff; font-size:42px; margin:0; font-weight:900; letter-spacing:-1px;">🍔 WURGER</h1>
                          <p style="color:rgba(255,255,255,0.85); font-size:16px; margin:8px 0 0 0; font-weight:500;">¡Sabor insuperable a tu alcance!</p>
                        </td>
                      </tr>
                      
                      <!-- BODY -->
                      <tr>
                        <td style="padding: 48px 40px;">
                          <h2 style="color:#1a1a1a; font-size:28px; margin: 0 0 16px 0; font-weight:800;">¡Hola, %s! 👋</h2>
                          <h3 style="color:#FF6B35; font-size:20px; margin: 0 0 16px 0; font-weight:700;">%s</h3>
                          <p style="color:#555; font-size:16px; line-height:1.7; margin: 0 0 24px 0;">
                            %s
                          </p>
                          
                          %s
                          
                          <!-- CTA BUTTON -->
                          <div style="text-align: center; margin: 32px 0;">
                            <a href="http://localhost:5173/login" 
                               style="background: linear-gradient(135deg, #FF9F1C 0%%, #FF6B35 100%%); 
                                      color: white; 
                                      text-decoration: none; 
                                      padding: 16px 40px; 
                                      border-radius: 50px; 
                                      font-size: 17px; 
                                      font-weight: 700;
                                      display: inline-block;
                                      box-shadow: 0 4px 20px rgba(255,107,53,0.4);">
                              🍔 Ordenar Ahora
                            </a>
                          </div>
                        </td>
                      </tr>
                      
                      <!-- FOOTER -->
                      <tr>
                        <td style="background:#1a1a1a; padding: 24px 40px; text-align: center;">
                          <p style="color:#888; font-size:13px; margin:0; line-height:1.6;">
                            Recibiste este correo porque estás registrado en Wurger Restaurant.<br>
                            © 2026 Wurger. Todos los derechos reservados.
                          </p>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(asunto, nombre, titulo, mensaje, promoBox);

        enviarHtml(destinatario, asunto, html);
    }

    // =====================================================================
    // MÉTODO AUXILIAR PARA ENVIAR HTML
    // =====================================================================
    public void enviarHtml(String destinatario, String asunto, String html) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(destinatario);
            helper.setSubject(asunto);
            helper.setText(html, true);
            mailSender.send(mensaje);
        } catch (MessagingException e) {
            throw new RuntimeException("Error al enviar el correo: " + e.getMessage(), e);
        }
    }
}
