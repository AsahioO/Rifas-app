# Arquitectura de Software 🏗️

Este documento provee una visión técnica en profundidad de cómo está construido el proyecto _WhatsHome Rifas_, diseñado de cero para máxima seguridad de sesión y renderizado híbrido Ultra-Rápido.

## 1. Stack Tecnológico General
*   **Framework Principal**: Next.js 14 (`app` Router) para el SSR (Server-Side Rendering) y SSG (Static Site Generation).
*   **Lenguaje**: TypeScript Estricto. Reduciendo un 80% los errores en tiempo de ejecución.
*   **Estilos**: Tailwind CSS 3.4 acoplado con Lucide React para iconografía veloz en formato SVG. Animaciones CSS puras más Canvas-Confetti para física interactiva.
*   **Backend & DB**: Supabase (PostgreSQL autoadministrado) implementado directamente en cliente asíncrono. Edge-ready.

---

## 2. Mapa del Árbol de Directorios `src/`

Toda la aplicación se compone de archivos alojados exclusivamente en la carpeta `src/`.

```text
src/
├── app/                  # Rutas principales y Front-End Visual
│   ├── globals.css       # Variables de color (Vino Tinto + Oro) globales
│   ├── layout.tsx        # Inyector de fuente Google 'Inter' general
│   ├── page.tsx          # Pantalla Pública (Landing + Carrusel + Catálogo)
│   └── admin/            # Directorio PRIVADO Administrativo
│       ├── layout.tsx    # Sidebar y Nav de escritorio y Dropdown Móvil
│       ├── page.tsx      # Dashboard en Tiempo Real (Resumen/KPIs)
│       ├── historial/    # Vista de rifas en estado 'finalizada'/'cancelada'
│       ├── login/        # Autenticación HTML Form 
│       ├── participantes/# Crud manual de reserva de boletos
│       ├── rifa/nueva/   # Formulario subida Supabase Storage y DB Rifa
│       └── sorteo/       # Ruleta dinámica algorítmica y disparo de Fin
│
├── lib/                  # Lógica de Datos y Back-End "Store"
│   ├── store.ts          # Cerebro. Clase con async/await CRUD a Supabase
│   ├── supabase.ts       # Configuración Singleton de entorno y SupabaseClient
│   └── utils.ts          # Mergeador de variables Tailwind (clsx)
│
└── middleware.ts         # Guardián Global (Edge Middleware de Next.js)
```

## 3. Flujo de Datos Híbrido (Store & Supabase)

El sistema ya no depende de peticiones REST nativas ni de caché local rígido. Emplea la metodología **Cliente Asíncrono Centralizado**:

### El Cerebro: `src/lib/store.ts`
Las Vistas (Pages) no ejecutan el SQL directamente. Todo pasa por el Objeto Singleton `mockStore` que actúa de intermediario:
1. Para pedir la Rifa en vivo, manda llamar a `.getActiveRaffle()` el cual internamente dispara una query `eq('estado', 'activa')` iterativa limitando a "1" resultado con Supabase.
2. Cada Pantalla (`useEffect`) se auto-refresca o carga asíncronamente `.getParticipants()` atado al *Foreign Key* de la Rifa devuelta en el paso 1.

### Manejo de Medios Visuales (Supabase Storage)
La carga de la cámara (`/admin/rifa/nueva`) intercepta las imágenes:
- Convierte fotos locales del FileSystem a Objetos y las empaqueta usando hashes matemáticos alfanuméricos.
- Las lanza (`supabase.storage.from('rifas-images').upload()`) al Bucket aislado obteniendo su `publicUrl`. Ese Array de links resultantes se asienta en la columna SQL `.fotos` (JSONB) de `Rifas`.

## 4. Middleware y Seguridad
La protección de rutas es el último filtro técnico para cuidar tu información en Servidores Edge (*Antes* de que la página renderice):

*   **`middleware.ts`**: Intercepta CUALQUIER intento de visita que empiece con `/admin` (`/admin/sorteo`, `/admin/participantes`, etc.).
*   Verifica la existencia de la cookie encriptada `rifas_admin_session`.
*   Si y **solo si** esta cookie existe, el Edge Renderer de Next.js continúa pintando el HTML privado; si no, ejecuta un HTTP 307 (Redirect) instantáneo arrojando a la intrusa al `/admin/login`.

## 5. Decisiones de Interfaz de Usuario (UI/UX)
-   **Grid vs Catálogo:** Optamos por un catálogo de deslizamiento vertical (Scrollable List) para el teléfono público en vez de una cuadrícula minúscula dado que los sorteos (típicamente >100 números) se volvían inmanejables e ilegibles para adultos mayores.
-   **Carrusel Condicional:** Si el administrador del Content Management System (CMS) sube *n > 1* imágenes, la aplicación inyecta condicionalmente transiciones JS de React (`setInterval()`), permitiendo ver el iPhone/Premio en 360 grados de manera interactiva sin sobrecargar el DOM.
