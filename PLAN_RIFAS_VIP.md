# Plan de Desarrollo Futuro: Fase 7 - Club VIP y Rifas Exclusivas 💎

Este documento describe la arquitectura técnica, lógica de negocio y pasos necesarios para implementar una nueva funcionalidad: **Rifas Exclusivas para Clientas Frecuentes**, lo cual transformará la aplicación de un sitio "público" a un sistema con **Manejo de Roles y Usuarios Autenticados**.

## 1. El Reto y la Solución
Actualmente, calquier persona que entra a la URL puede ver la Rifa Activa y solicitar boletos por WhatsApp. 
Para tener rifas "Exclusivas" u "Ocultas", el sistema necesita saber **quién** está navegando en la página. Eso amerita implementar un Sistema de Autenticación de Usuarios (Login/Registro).

## 2. Arquitectura de Usuarios (Base de Datos)

Se requiere expandir Supabase integrando **Supabase Auth** para manejar sesiones seguras.

**Nueva Tabla `perfiles_usuario`**
- `id` (UUID - vinculado a Supabase Auth)
- `email` (string)
- `nombre` (string)
- `whatsapp` (string)
- `es_vip` (boolean, default: false) - *Solo el Administrador puede cambiar esto a True.*
- `compras_totales` (integer) - *Para medir la lealtad y ascender automáticamente a VIP.*

**Actualización a la Tabla `rifas`**
- Nuevo campo `visibilidad`: `['publica', 'privada_vip']` (default: 'publica').

## 3. Flujo de Experiencia del Usuario (UX)

### Pantalla Pública (Landing Page)
- Los usuarios anónimos o no-VIP entrarán y **solo** verán las rifas marcadas como `publica`.
- En el header, habrá un botón dorado sutil que diga **"Acceso Clientas VIP"** o "Mi Cuenta".

### Portal de Registro/Login (`/login`)
- Pantalla elegante (Vino y Oro) donde los clientes pueden registrarse con Email y Contraseña (o Login con Google/WhatsApp usando Supabase).

### Dashboard del Cliente VIP (`/mi-cuenta`)
- Cuando una clienta catalogada como `es_vip = true` inicie sesión, su panel de control mostrará:
  - **Rifas Normales**.
  - **Rifas Exclusivas VIP** (Ocultas para el resto del mundo).
  - Historial de los boletos que ha comprado previamente.
  - Un estatus visual que le indique que es "Miembro Gold/VIP".

### Panel de Administración (Dueña)
- Nueva sección: **Directorio de Clientas** (`/admin/clientes`).
  - Lista de todas las personas registradas en la app.
  - Switch interactivo para marcar a una persona como `VIP ⭐` o quitarle el rango.
- En `Nueva Rifa`, un checkbox que pregunte: *"¿Esta rifa es visible para todo público o Exclusiva para Tarjeta VIP?"*.

## 4. Requisitos Técnicos y de Seguridad

- **Row Level Security (RLS) en Supabase**:
  - Las `rifas` VIP solo pueden ser descargadas (SELECT) por aquellos cuyo `es_vip` sea `true`. Esto garantiza que nadie con conocimientos técnicos pueda "hackear" la vista y ver los premios exclusivos.
- **Middleware de Next.js**:
  - Proteger la ruta `/mi-cuenta/*` para redirigir a `/login` a los no autenticados.
- **Componentes React**:
  - Implementar contextos (`React Context`) para manejar la sesión globalmente y esconder o mostrar el botón VIP dependiendo de si hay sesión activa.

## 5. Cronograma de Integración Estimado

1. **Sprint 1 (Backend & Auth)**: Setup de Supabase Auth, Triggers de base de datos para crear `perfiles` al registrarse.
2. **Sprint 2 (Vistas de Auth)**: Creación de `/login` y `/registro` con validación de formularios y diseño Premium.
3. **Sprint 3 (Área de Cliente VIP)**: El dashboard privado del usuario, donde pueden ver sus boletos comprados y rifas ocultas.
4. **Sprint 4 (Panel Admin)**: Control CMS de clientes para la dueña (Promover a VIP, Bloquear).

---
*Proyección trazada para escalabilidad directa usando el Stack existente (Next.js 14 + Supabase).*
