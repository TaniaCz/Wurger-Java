# 🍔 Wurger - Sistema de Gestión para Restaurante

<div align="center">

![Wurger Logo](wurger-front/public/logo.png)

**Sistema completo de gestión para restaurante de hamburguesas con panel de administración y tienda en línea**

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-green.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
</div>

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Capturas de Pantalla](#-capturas-de-pantalla)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## 📖 Descripción

**Wurger** es un sistema integral de gestión para restaurantes especializados en hamburguesas. Incluye dos versiones completas:

1. **Versión Spring Boot + React** (Nueva) - Sistema moderno con diseño premium
2. **Versión Laravel** (Anterior) - Sistema completo en PHP

El sistema permite gestionar productos, pedidos, usuarios, inventario y promociones, con interfaces separadas para administradores y clientes.

---

## ✨ Características

### 🔐 Sistema de Autenticación
- Login y registro de usuarios
- Roles diferenciados (Administrador / Cliente)
- Sesiones seguras con prevención de navegación después de logout

### 👨‍💼 Panel de Administración
- **Gestión de Productos**: CRUD completo con categorías e imágenes
- **Gestión de Pedidos**: Visualización, actualización de estados, detalles completos
- **Gestión de Usuarios**: Administración de clientes y permisos
- **Promociones**: Sistema de descuentos por porcentaje o monto fijo
- **Alertas de Stock**: Notificaciones de productos con bajo inventario
- **Reportes**: Estadísticas de ventas, productos más vendidos, inventario

### 🛒 Dashboard de Cliente
- Catálogo de productos con búsqueda y filtros
- Carrito de compras interactivo
- Sistema de promociones activas
- Historial de pedidos con timestamps
- Diseño premium con glassmorphism
- Modo claro/oscuro

### 📊 Gestión de Inventario
- Control de stock en tiempo real
- Alertas automáticas de bajo stock
- Historial de movimientos

---

## 🛠️ Tecnologías

### Versión Spring Boot + React

#### Backend
- **Java 17+** con Spring Boot 3.x
- **Spring Data JPA** para persistencia
- **MySQL 8.0** como base de datos
- **Lombok** para reducir código boilerplate
- **Maven** para gestión de dependencias

#### Frontend
- **React 18** con Vite
- **React Router** para navegación
- **Bootstrap 5** para estilos base
- **Context API** para gestión de estado
- **Fetch API** para comunicación con backend

### Versión Laravel

- **PHP 8.x** con Laravel 10
- **Blade Templates** para vistas
- **Eloquent ORM** para base de datos
- **MySQL** como base de datos

---

## 📦 Instalación

### Prerrequisitos

- **Java JDK 17+** (para Spring Boot)
- **Node.js 18+** y npm (para React)
- **MySQL 8.0+**
- **Maven** (incluido en el proyecto)
- **PHP 8.x** y Composer (para Laravel)

### Opción 1: Spring Boot + React (Recomendado)

#### 1. Clonar el Repositorio

```bash
git clone https://github.com/TaniaCz/Wurger-Final.git
cd Wurger-Final
```

#### 2. Configurar Base de Datos

```bash
# Conectarse a MySQL
mysql -u root -p

# Importar la base de datos
mysql -u root -p < database/wurger_export.sql
```

#### 3. Configurar Backend (Spring Boot)

```bash
# Copiar archivo de configuración
cp src/main/resources/application.properties.example src/main/resources/application.properties

# Editar application.properties con tus credenciales
# spring.datasource.username=root
# spring.datasource.password=TU_CONTRASEÑA
```

#### 4. Ejecutar Backend

```bash
# Compilar y ejecutar
./mvnw spring-boot:run

# El backend estará disponible en: http://localhost:8080
```

#### 5. Configurar y Ejecutar Frontend

```bash
# Ir a la carpeta del frontend
cd wurger-front

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# El frontend estará disponible en: http://localhost:5173
```

### Opción 2: Laravel

```bash
# Instalar dependencias PHP
composer install

# Instalar dependencias Node
npm install

# Copiar archivo de entorno
cp .env.example .env

# Generar key de aplicación
php artisan key:generate

# Configurar base de datos en .env
# DB_DATABASE=Wurger
# DB_USERNAME=root
# DB_PASSWORD=tu_contraseña

# Ejecutar migraciones
php artisan migrate --seed

# Ejecutar servidor
php artisan serve

# Disponible en: http://localhost:8000
```

---

## 🚀 Uso

### Credenciales de Prueba

#### Administrador
- **Email**: `test@admin.com`
- **Contraseña**: `Test1234!`

#### Cliente
- **Email**: `cliente@wurger.com`
- **Contraseña**: `cliente123`

> ⚠️ **Nota**: Estas credenciales son para pruebas y desarrollo. Cámbialas en producción.

### Flujo de Uso

1. **Acceso**: Visita `http://localhost:5173` (React) o `http://localhost:8000` (Laravel)
2. **Login**: Ingresa con las credenciales según tu rol
3. **Administrador**: Gestiona productos, pedidos, usuarios y promociones
4. **Cliente**: Navega el catálogo, agrega productos al carrito y realiza pedidos

---

## 📁 Estructura del Proyecto

```
Wurger-Final/
│
├── 📂 src/main/java/com/Wurger/     # Backend Spring Boot
│   ├── controller/                   # Controladores REST API
│   ├── model/                        # Entidades JPA
│   ├── service/                      # Lógica de negocio
│   ├── repository/                   # Acceso a datos
│   ├── dto/                          # Objetos de transferencia
│   └── config/                       # Configuraciones
│
├── 📂 wurger-front/                  # Frontend React
│   ├── src/
│   │   ├── pages/                    # Páginas principales
│   │   │   ├── Admin.jsx             # Panel de administración
│   │   │   ├── ClientDashboard.jsx   # Dashboard de cliente
│   │   │   ├── Login.jsx             # Página de login
│   │   │   └── Register.jsx          # Página de registro
│   │   ├── components/               # Componentes reutilizables
│   │   │   ├── admin/                # Componentes del admin
│   │   │   ├── ProductCard.jsx       # Tarjeta de producto
│   │   │   └── OrderHistory.jsx      # Historial de pedidos
│   │   ├── context/                  # Contextos de React
│   │   │   ├── CartContext.jsx       # Estado del carrito
│   │   │   └── ThemeContext.jsx      # Tema claro/oscuro
│   │   └── index.css                 # Estilos globales
│   └── public/                       # Archivos estáticos
│
├── 📂 database/                      # Base de datos
│   ├── wurger_export.sql             # Exportación completa
│   ├── schema.sql                    # Solo estructura
│   ├── sample_data.sql               # Datos de ejemplo
│   └── README.md                     # Documentación de BD
│
├── 📂 app/                           # Laravel (versión anterior)
├── 📂 resources/views/               # Vistas Blade
├── 📂 routes/                        # Rutas Laravel
│
├── .gitignore                        # Archivos ignorados
├── pom.xml                           # Dependencias Maven
├── package.json                      # Dependencias Laravel
└── README.md                         # Este archivo
```

---

## 📸 Capturas de Pantalla

### Dashboard de Cliente
![Client Dashboard](wurger-front/public/login_background.png)

*Interfaz moderna con diseño glassmorphism, catálogo de productos y carrito de compras*

### Panel de Administración
*Sistema completo de gestión con reportes, estadísticas y control de inventario*

---

## 🔒 Seguridad

### Archivos Protegidos

Los siguientes archivos **NO** se incluyen en el repositorio por seguridad:

- `application.properties` - Credenciales de base de datos
- `.env` - Variables de entorno Laravel
- `node_modules/` - Dependencias de Node
- Backups de base de datos personales

### Plantillas Incluidas

- ✅ `application.properties.example` - Template para Spring Boot
- ✅ `.env.example` - Template para Laravel

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Para contribuir:

1. **Fork** el proyecto
2. Crea una **rama** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add: Amazing Feature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. Abre un **Pull Request**

### Guía de Commits

Usa prefijos descriptivos:
- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bugs
- `docs:` - Cambios en documentación
- `style:` - Cambios de formato/estilo
- `refactor:` - Refactorización de código
- `test:` - Agregar o modificar tests

---

## 📝 Documentación Adicional

- [Configuración de Base de Datos](database/README.md)
- [API Documentation](#) *(próximamente)*
- [Guía de Despliegue](#) *(próximamente)*

---

## 🐛 Reporte de Bugs

Si encuentras un bug, por favor:

1. Verifica que no esté ya reportado en [Issues](https://github.com/TaniaCz/Wurger-Final/issues)
2. Crea un nuevo issue con:
   - Descripción clara del problema
   - Pasos para reproducirlo
   - Comportamiento esperado vs actual
   - Screenshots si es posible

---

## 📄 Licencia

Este proyecto es privado y pertenece a **Wurger Restaurant Management System**.

---

## 👥 Autores

- **Tania** - *Desarrollo Principal* - [TaniaCz](https://github.com/TaniaCz)

---

## 🙏 Agradecimientos

- Diseño inspirado en las mejores prácticas de UI/UX modernas
- Comunidad de Spring Boot y React por la documentación
- Bootstrap por los componentes base

---

<div align="center">

**¿Te gusta el proyecto? ¡Dale una ⭐ en GitHub!**

Hecho con ❤️ para Wurger

</div>