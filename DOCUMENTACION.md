# Guía Técnica y Documentación de la Aplicación Wurger

Este documento contiene la explicación detallada de la arquitectura, componentes, estructura de carpetas y conexión de la plataforma **Wurger** (sistema de pedidos y administración para una hamburguesería).

---

## 1. Arquitectura General y Flujo de Datos

La aplicación funciona bajo una arquitectura desacoplada **Cliente-Servidor**. El frontend (interfaz de usuario) y el backend (servidor de datos) están alojados de forma independiente y se comunican a través del protocolo seguro HTTPS mediante una API REST.

```
+-------------------------------------------------------------+
|                      Cliente (Navegador)                    |
|             (Visualiza e interactúa con el sistema)         |
+------------------------------+------------------------------+
                               |
                               | (Peticiones HTTP / JSON)
                               v
+-------------------------------------------------------------+
|                      Frontend (Netlify)                     |
|           - React.js + Vite + Bootstrap (Estilos)           |
|           - _redirects (Redirección interna de rutas)       |
+------------------------------+------------------------------+
                               |
                               | (Peticiones CORS a la API)
                               v
+-------------------------------------------------------------+
|                      Backend (Render)                       |
|           - Spring Boot 3 + Java 17 + Spring Security       |
|           - Desplegado en un contenedor Docker              |
+------------------------------+------------------------------+
                               |
                               | (Conexión segura JDBC SSL)
                               v
+-------------------------------------------------------------+
|                  Base de Datos (Aiven Cloud)                |
|                    - Servidor MySQL 8.0                     |
+-------------------------------------------------------------+
```

### ¿Cómo fluyen los datos?
1. **Interacción:** El cliente (usuario o administrador) hace clic en un botón en la interfaz de React.
2. **Petición (Request):** El frontend realiza una llamada HTTP (`GET`, `POST`, `PUT`, `DELETE`) hacia el backend en Render.
3. **Procesamiento:** El backend recibe la solicitud, verifica los permisos de seguridad y ejecuta la lógica necesaria (ej. guardar un pedido).
4. **Base de Datos:** El backend interactúa con la base de datos MySQL para persistir o consultar la información mediante Hibernate (JPA).
5. **Respuesta (Response):** El backend retorna un archivo estructurado en formato JSON.
6. **Renderizado:** React recibe los datos y actualiza la pantalla del usuario inmediatamente sin necesidad de recargar la página entera.

---

## 2. Estructura del Código y Componentes

El proyecto está organizado en un único repositorio dividido en dos partes principales: el backend en la raíz y el frontend dentro de la carpeta `wurger-front`.

### 📁 Estructura del Backend (Spring Boot)
Ubicado en la carpeta raíz del proyecto, sigue la arquitectura orientada a servicios típica de Java:

* **`src/main/java/com/Wurger/`**:
  * **`config/`**: Contiene la configuración global.
    * `SecurityConfig.java`: Configura Spring Security. Aquí se habilitó el acceso sin credenciales restrictivas de origen (`CORS`) para permitir que Netlify lea la API, y se desactivó la protección `CSRF` para las peticiones REST.
    * `WebConfig.java`: Registra rutas adicionales y el cargador de imágenes estáticas para que la app sirva las fotos de las hamburguesas subidas en `uploads/`.
  * **`controller/`**: Los endpoints de la API. Traducen las URLs en acciones de código (ej: `ProductController` atiende las peticiones a `/api/productos`).
  * **`model/`**: Las entidades. Representan las tablas físicas de la base de datos como clases de Java (ej. `Usuario.java`, `Producto.java`, `Venta.java`).
  * **`repository/`**: Interfaces JPA. Realizan de manera automática la comunicación y consultas SQL a la base de datos.
  * **`service/`**: Capa de negocio. Aquí se procesan los cálculos matemáticos, envíos de correo de recuperación y la lógica pesada.
  * **`WurgerApplication.java`**: El arranque principal del backend.
* **`pom.xml`**: Archivo de configuración de dependencias de Maven (Spring Boot Web, Security, Mail, MySQL Driver, Lombok, JPA).
* **`Dockerfile`**: Receta de Docker que usa Render para compilar la aplicación con Maven y montar un servidor Java ejecutable optimizado.

---

### 📁 Estructura del Frontend (React.js)
Ubicado en la carpeta `wurger-front/`. Está configurado con Vite y usa componentes estructurados:

* **`public/`**: Contiene imágenes estáticas y el archivo `_redirects`.
  * `_redirects`: Contiene la regla `/* /index.html 200`. Al desplegar en Netlify, esto es crucial para que cualquier ruta (como `/login` o `/admin`) se resuelva siempre dentro de `index.html` permitiendo que React Router funcione al actualizar la pantalla.
* **`src/`**:
  * **`context/`**: Manejadores de estados globales:
    * `CartContext.js`: Controla el flujo del carrito de compras (añadir, remover, calcular subtotales e IVA).
    * `ThemeContext.js`: Permite alternar entre el modo oscuro y claro de forma global.
  * **`pages/`**: Vistas completas de la aplicación:
    * `Login.jsx` & `Register.jsx`: Interfaces de inicio de sesión y registro de clientes.
    * `ForgotPassword.jsx` & `ResetPassword.jsx`: Formulario de recuperación de contraseñas.
    * `ClientDashboard.jsx`: Interfaz que ve el cliente común para pedir hamburguesas, elegir agregados, pagar e ir a su carrito.
    * `Admin.jsx`: Interfaz general para administradores.
  * **`components/`**: Los submódulos y componentes visuales específicos del panel de administración:
    * `admin/CashRegister.jsx`: Modulo POS para gestionar ventas físicas (apertura, registro de dinero en caja, cierre de caja).
    * `admin/Dashboard.jsx`: Estadísticas de venta rápida e indicadores clave.
    * `admin/ProductManagement.jsx` & `PromotionsManagement.jsx`: Lógica para añadir, editar, eliminar y subir fotos de productos y ofertas.
    * `admin/OrderManagement.jsx`: Panel de control de pedidos en cocina.
    * `admin/Reports.jsx`: Gráficas detalladas de ingresos y egresos.
    * `admin/EmailCampaigns.jsx`: Formulario de correos masivos para marketing a clientes.
  * `main.jsx`: Archivo de configuración e inicialización global de React.

---

## 3. Mecanismos de Conexión Frontend-Backend

Para lograr que ambos servidores se conecten de manera fluida se usaron dos técnicas principales:

### A. Intercepción Dinámica de URL (en el Frontend)
Para no tener que cambiar la URL del servidor local (`http://localhost:8080`) a la de producción en cada archivo `.jsx`, se configuró un interceptor en `main.jsx`. 

El código intercepta cada llamada de `fetch`:
* Si detecta que la petición va dirigida a `http://localhost:8080`, revisa si existe la variable de entorno `VITE_API_URL`.
* Si existe (como en Netlify), reescribe dinámicamente la URL apuntando al backend en producción: `https://wurger-backend.onrender.com`.
* Si no existe, mantiene `localhost` (permitiendo probar el código localmente sin alterar nada).

### B. Habilitación de CORS (en el Backend)
Por defecto, los navegadores bloquean las llamadas de un dominio a otro diferente (de Netlify a Render). Para solucionarlo, en `SecurityConfig.java` se configuró:
```java
configuration.setAllowedOriginPatterns(Arrays.asList("*"));
```
Esto le indica al servidor Spring Boot que acepte llamadas externas desde cualquier dirección web autorizada (como tu sitio en Netlify).

---

## 4. Configuración de Hosting y Despliegue

La aplicación está lista para producción en plataformas gratuitas en la nube:

1. **Frontend (Netlify):**
   * Configurado para desplegar desde la subcarpeta `wurger-front`.
   * Comando de compilación: `npm run build`.
   * Directorio de publicación: `dist`.
   * Variable de entorno requerida: `VITE_API_URL` con el valor `https://wurger-backend.onrender.com`.

2. **Backend (Render):**
   * Desplegado como un servicio web tipo Docker (Render lee automáticamente el `Dockerfile` del proyecto).
   * Variables de entorno requeridas para la base de datos:
     * `SPRING_DATASOURCE_URL`: Enlace JDBC de Aiven Cloud (ej: `jdbc:mysql://...`).
     * `SPRING_DATASOURCE_USERNAME`: Usuario de la BD.
     * `SPRING_DATASOURCE_PASSWORD`: Contraseña de la BD.

3. **Base de Datos (Aiven Cloud):**
   * Base de datos MySQL remota e independiente.
   * Conectada al backend de Render mediante protocolo seguro con SSL activo.
