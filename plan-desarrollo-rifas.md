# Plan de Desarrollo — App Web de Rifas
**Versión:** 1.0  
**Fecha:** Febrero 2026

---

## 1. Resumen del Proyecto

Aplicación web mobile-first para gestión de rifas. Cuenta con una landing pública donde los usuarios pueden ver el producto y los boletos disponibles, y un dashboard privado para que la dueña administre todo el sistema: productos, participantes y sorteo con ruleta animada.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Mobile-first, SSR, excelente rendimiento |
| Estilos | Tailwind CSS | Rápido de implementar, responsive nativo |
| Animación ruleta | Framer Motion + Canvas API | Ruleta fluida y personalizable |
| Backend / Auth | Supabase | Auth seguro, BD PostgreSQL, Storage de imágenes |
| Deploy | Vercel | Gratis, integración nativa con Next.js |
| Imágenes | Supabase Storage | Sin costo extra, CDN incluido |

---

## 3. Arquitectura de la Base de Datos

### Tabla: `rifas`
```
id               uuid (PK)
nombre           text
descripcion      text
fotos            text[]         — array de URLs en Supabase Storage
precio_boleto    numeric
total_boletos    integer        — definido por la dueña al crear la rifa
max_por_persona  integer
giro_ganador     integer        — entre 3 y 5, default 5
estado           enum           — 'activa' | 'finalizada'
ganador_boleto   integer        — número de boleto ganador
ganador_nombre   text
created_at       timestamp
```

### Tabla: `boletos`
```
id               uuid (PK)
rifa_id          uuid (FK → rifas)
numero_boleto    integer
nombre           text
telefono         text
fecha_registro   timestamp
```

### Tabla: `eliminados_sorteo`
```
id               uuid (PK)
rifa_id          uuid (FK → rifas)
numero_boleto    integer
nombre           text
orden            integer        — 1, 2, 3, 4 (el orden en que fueron eliminados)
```

### Tabla: `usuarios`
Manejada directamente por Supabase Auth. Una sola cuenta (la dueña). Sin registro público.

---

## 4. Pantallas y Componentes

### 4.1 Landing Pública (`/`)

**Header**
- Logo / nombre del negocio
- Sin navegación compleja

**Sección Hero — Rifa Activa**
- Carrusel de imágenes del producto (swipe en móvil)
- Nombre del producto
- Descripción
- Precio del boleto
- Cuenta regresiva hacia la fecha del sorteo
- Badge de estado: ACTIVA / FINALIZADA

**Sección Boletos**
- Cuadrícula de números (estilo bingo)
- Verde = disponible
- Gris + tachado = tomado
- Sin interacción de compra — solo visual
- Indicador: "X de Y boletos disponibles"

**Sección Ganador** (visible solo cuando la rifa finaliza)
- Nombre del ganador
- Número de boleto ganador
- Animación/confetti de celebración

**Footer**
- Información de contacto (WhatsApp link directo)

---

### 4.2 Login (`/admin/login`)

- Formulario minimalista: email + contraseña
- Sin opción de registro (cuenta única)
- Redirige al dashboard tras login exitoso
- Manejo de errores claro (contraseña incorrecta, etc.)

---

### 4.3 Dashboard — Vista General (`/admin`)

- Resumen rápido: rifa activa, boletos vendidos vs total, próxima fecha de sorteo
- Acceso rápido a las 3 secciones principales
- Botón flotante para acción principal (crear rifa o ir al sorteo)

---

### 4.4 Dashboard — Crear / Editar Rifa (`/admin/rifa`)

**Formulario de creación:**
- Nombre del producto (texto)
- Descripción (textarea)
- Subida de fotos (múltiples imágenes, preview inmediato)
- Precio del boleto (número)
- Total de boletos (número — genera la cuadrícula)
- Máximo de boletos por persona (número)
- Fecha del sorteo (date picker)
- Número de giro ganador (selector: 3, 4 o 5 — default 5)

**Regla:** Solo se puede crear una rifa si no hay ninguna activa. El botón de "Nueva rifa" se desactiva si hay una activa.

---

### 4.5 Dashboard — Participantes (`/admin/participantes`)

- Lista de todos los boletos registrados en la rifa activa
- Columnas: Número de boleto, Nombre, Teléfono, Fecha de registro
- Búsqueda por nombre o número de boleto
- Botón "Registrar boleto": abre modal con campos Nombre, Teléfono y Número de boleto
  - Validación: el número elegido debe estar disponible
  - Validación: no superar el máximo por persona
- Opción de eliminar un registro por error
- Contador en tiempo real: "X de Y boletos asignados"
- Exportar lista como CSV

---

### 4.6 Dashboard — Sorteo (`/admin/sorteo`)

**Pre-sorteo**
- Resumen: participantes registrados, boletos en juego
- Selector de giro ganador (si quiere ajustarlo de último momento)
- Botón grande "Iniciar Sorteo"
- Advertencia si quedan menos de 5 boletos registrados

**Durante el sorteo**
- Ruleta animada con los nombres de todos los participantes
  - Participantes con múltiples boletos aparecen N veces
- Giros 1 al (ganador-1): la ruleta gira y cae en alguien → aparece su nombre con badge "ELIMINADO" → ese participante desaparece visualmente del bombo
- Último giro (el configurado como ganador): animación especial, confetti, pantalla de ganador
- Botón "Siguiente giro" que controla la dueña (ella maneja el ritmo del show)

**Post-sorteo**
- Pantalla de ganador con nombre, teléfono y número de boleto
- Botón "Publicar ganador" → actualiza la landing automáticamente
- Botón "Ver historial de eliminados"

---

### 4.7 Dashboard — Historial (`/admin/historial`)

- Lista de rifas pasadas
- Por cada rifa: producto, fecha, total de participantes, ganador
- Al expandir: lista completa de participantes y orden de eliminados

---

## 5. Flujos Principales

### Flujo Creación de Rifa
```
Dueña entra al dashboard
→ Va a "Nueva Rifa"
→ Llena formulario (fotos, descripción, precio, total boletos, max por persona, fecha, giro ganador)
→ Guarda → rifa aparece como activa en la landing
```

### Flujo Venta de Boleto
```
Usuario abre la landing
→ Ve la cuadrícula y elige un número disponible
→ Contacta a la dueña por WhatsApp
→ Realiza el pago por fuera
→ Dueña entra al dashboard → Participantes
→ Registra: número de boleto, nombre y teléfono
→ La cuadrícula en la landing se actualiza automáticamente
```

### Flujo Sorteo
```
Dueña entra a la sección Sorteo
→ Revisa que estén todos los boletos registrados
→ Ajusta el giro ganador si desea
→ Inicia el sorteo en vivo (puede mostrar la pantalla a su audiencia)
→ Presiona "Siguiente giro" N veces (giros de eliminación)
→ En el último giro la app elige al ganador automáticamente
→ Dueña presiona "Publicar ganador"
→ La landing muestra el ganador de forma automática
```

---

## 6. Seguridad

- Autenticación manejada 100% por Supabase Auth (JWT)
- Row Level Security (RLS) en Supabase: solo la dueña autenticada puede escribir datos
- La landing solo lee datos públicos (lectura sin auth)
- Variables de entorno para las keys de Supabase (nunca expuestas en frontend)
- Middleware de Next.js que protege todas las rutas `/admin/*`

---

## 7. Detalles UX / UI Mobile-First

- Diseño pensado primero en pantalla de 375px (iPhone SE) y hacia arriba
- Cuadrícula de boletos: responsive, entre 5 y 8 columnas según el ancho de pantalla
- Carrusel de imágenes con swipe táctil nativo
- Botones con área mínima de toque de 44px (estándar Apple/Google)
- Feedback visual inmediato en todas las acciones (loading states, confirmaciones)
- Animaciones suaves pero sin sacrificar rendimiento
- La ruleta del sorteo funciona perfectamente en móvil en modo horizontal

---

## 8. Fases de Desarrollo

### Fase 1 — Base y Auth (3-4 días)
- Setup del proyecto Next.js + Tailwind + Supabase
- Configuración de base de datos y RLS
- Login seguro y middleware de protección de rutas
- Layout base del dashboard y la landing

### Fase 2 — Gestión de Rifas (3-4 días)
- Formulario de creación de rifa con subida de imágenes
- Landing pública con carrusel y cuenta regresiva
- Cuadrícula de boletos (dinámica y en tiempo real)

### Fase 3 — Participantes (2-3 días)
- Módulo completo de registro de participantes en dashboard
- Validaciones (boleto disponible, máximo por persona)
- Búsqueda, eliminación y exportación CSV

### Fase 4 — Ruleta y Sorteo (4-5 días)
- Animación de la ruleta con Canvas/Framer Motion
- Lógica de eliminaciones progresivas
- Publicación del ganador en la landing
- Historial de sorteos

### Fase 5 — Pulido y Deploy (2-3 días)
- Refinamiento de UX en móvil
- Testing en dispositivos reales
- Optimización de imágenes y carga
- Deploy en Vercel + dominio

**Tiempo total estimado: 3 a 4 semanas**

---

## 9. Costos de Operación (Post-lanzamiento)

| Servicio | Plan | Costo |
|---|---|---|
| Vercel | Hobby | Gratis |
| Supabase | Free tier | Gratis |
| Dominio | — | ~$10-15 USD/año |

El proyecto puede operar sin costo mensual fijo hasta crecer considerablemente en tráfico o almacenamiento de imágenes.

---

## 10. Posibles Mejoras Futuras (fuera de scope inicial)

- Notificación automática al ganador por WhatsApp (vía Twilio o WhatsApp API)
- Múltiples administradoras con roles
- Integración de pagos (Stripe, MercadoPago)
- Los usuarios pueden buscar su nombre/boleto en la landing para verificar registro
- Modo oscuro
