# Documentación Técnica - Plataforma de Rifas

Este documento sirve como referencia técnica oficial para el proyecto "Plataforma de Rifas". Se describe la pila tecnológica (stack), decisiones de arquitectura, estructura de los archivos fuente y y el esquema de la base de datos utilizada para construir esta aplicación (PWA).

---

## 1. Pila Tecnológica (Tech Stack)

### Frontend y Framework Principal
- **Next.js 14 (App Router):** Es el corazón absoluto de la aplicación. Maneja el enrutamiento (routing), renderizado del lado del servidor (SSR) y generación estática (SSG) para asegurar un altísimo rendimiento.
- **React 18:** Librería usada para crear los componentes de la interfaz de usuario.
- **TypeScript:** Impone un tipado estricto en todo el código fuente para prevenir errores inesperados y facilitar el mantenimiento a futuro.

### Estilos e Interfaz (UI)
- **Tailwind CSS:** Framework de CSS utilizado para *todo* el diseño visual. Permite mantener un diseño completamente responsivo e iterar la UI de forma acelerada sin abandonar el código HTML (o JSX).
- **Lucide React:** Librería de iconos SVG ligeros.
- **Tailwind-Merge & clsx:** Pequeñas utilidades empleadas para construir o combinar clases de Tailwind de forma dinámica, útiles al momento de hacer componentes reusables.

### Backend y Base de Datos (BaaS)
- **Supabase:** El proveedor absoluto para la parte servidora (Backend as a Service).
  - **Base de Datos PostgreSQL:** Base de datos relacional usada para guardar rifas y participantes.
  - **Supabase Auth:** Administra la autenticación (inicio de sesión seguro a través de JWT) garantizando qué usuarios administradores tienen permiso de alterar los datos o acceder al panel.
  - **Supabase Storage:** Almacenamiento tipo S3 (Object Storage) alojando directamente las imágenes públicas que sube el usuario en su panel de creación de sorteos.

### Hosting (Alojamiento) y Despliegue
- **Vercel:** Despliegue de red de borde (Edge Network) optimizado específicamente para aplicaciones hechas sobre Next.js. Configurado para integrar Integración y Despliegue Continuo (CI/CD) automáticamente al actualizar código hacia la rama `master`.

---

## 2. Arquitectura del Sistema

El proyecto sigue una arquitectura clásica contemporánea basada en servidor (Serverless):

1. **Capa Cliente (Dispositivo):** Una App Web Progresiva (`manifest.webmanifest` & `sw.js` mediante Next-PWA) que da la opción a clientes (e.g., teléfonos móviles) de "Instalar la aplicación" para una mejor experiencia parecida a lo nativo.
2. **Capa de Aplicación (Next.js Edge/Serverless):**
   - El archivo raíz y sus componentes interactúan como un escaparate frontal ("storefront") público sin credenciales.
   - Todo directorio protegido (`/admin/*`) se encuentra blindado a la vista utilizando un Intermediario (`middleware.ts`) que activamente checa los tokens JWT en los cookies, redirigiendo a intrusos antes de mostrar datos privados.
3. **Capa de Datos (Supabase):** Envoltura de consultas enviando lecturas y escrituras hacia el Postgres usando el cliente oficial `@supabase/supabase-js`.

---

## 3. Estructura Exacta del Proyecto y Archivos (`src/`)

```text
src/
├── middleware.ts                   # Guardián (Intercepta rutas protegidas checando si el admin está logueado).
├── app/                            # Carpeta principal bajo el Next.js App Router (Rutas de página).
│   ├── favicon.ico                 # Icono visible en las pestañas del navegador.
│   ├── globals.css                 # Declaraciones CSS y configuraciones globales para TailwindCSS.
│   ├── layout.tsx                  # Envoltura principal de toda la app (agrega fuentes, metadatos y nav).
│   ├── manifest.ts                 # Generador del archivo Manifest para la Aplicación PWA.
│   ├── page.tsx                    # LA PÁGINA PÚBLICA / PRINCIPAL (Muestra la Rifa activa a los clientes).
│   │
│   ├── admin/                      # PANEL DE ADMINISTRADOR (Archivos y sub-rutas protegidas).
│   │   ├── layout.tsx              # Un Navbar / Menú lateral exclusivo para la zona de administración.
│   │   ├── page.tsx                # El Escaparate (Dashboard) del admin (Muestra listados de rifas y estatus).
│   │   │
│   │   ├── finanzas/
│   │   │   └── page.tsx            # Pantalla de Analítica y Contabilidad (Ganancias y estadísticas numéricas).
│   │   │
│   │   ├── historial/
│   │   │   └── page.tsx            # Pantalla donde se listan todas las rifas cerradas / canceladas antiguas.
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx            # Pantalla de Ingreso para el administrador (Login con correo y contraseña).
│   │   │
│   │   ├── participantes/
│   │   │   └── page.tsx            # Módulo de administración de boletos. (Confirmar pagos, liberar boletos).
│   │   │
│   │   ├── rifa/nueva/
│   │   │   └── page.tsx            # Pantalla gigantesca de creación y EDICIÓN de rifas y borrradores.
│   │   │
│   │   └── sorteo/
│   │       └── page.tsx            # Pantalla "En Vivo". Interfaz diseñada para buscar números aleatorios en transmisiones.
│   │
│   └── fonts/                      # Archivos de fuentes locales (GeistMono y Geist) para evitar peticiones externas.
│       ├── GeistMonoVF.woff
│       └── GeistVF.woff
│
└── lib/                            # Carpeta de "Librerías" ó herramientas auxiliares.
    ├── store.ts                    # ARCHIVO VITAL. Contiene TODAS las lógicas e interacciones con la Base de datos (Getters/Setters).
    ├── supabase-server.ts          # Cliente Supabase preparado para ser leido DESDE el servidor (Útil en SSR).
    ├── supabase.ts                 # Cliente Supabase preparado para lado-cliente publico y funciones normales.
    └── utils.ts                    # Funciones muy pequeñas y reciclables (ej: juntar clases `cn()`).
```

---

## 4. Esquema de Base de Datos y Seguridad

### Política de Seguridad (RLS - Row Level Security)
El proyecto confía mayoritatiamente en la seguridad directamente en la Base de Datos. Todas las tablas en Postgres (Supabase) tienen activadas Políticas RLS (Row Level Security). Esto significa que la única política pública habilitada es **"SELECT en rifas"**. Un usuario del internet promedio jamás podrá LEER, ACTUALIZAR ni BORRAR la fila de participantes, ni rifas. Únicamente se permiten escrituras o cambios cuando una petición es solicitada comprobándose el token (Rol) de acceso como "autenticado".

### Esquemas de Tabla

#### `rifas` (Tabla de Sorteos)
- `id` (UUID, Primary Key)
- `nombre` (Text): El Título.
- `descripcion` (Text): Texto informativo.
- `estado` (Text): Situación operativa concreta (`activa`, `borrador`, `finalizada`, `cancelada`).
- `precio_boleto` (Numeric): Costo al público.
- `total_boletos` (Numeric): Límite total de campos dentro de la cuadrícula.
- `valor_producto` (Numeric): Costo real o inversión (exclusivo y protegido solo para cálculo interno de Finanzas).
- `fotos` (Text Array): Listado de URLs (del Supabase Storage) para la galería de premio mayor.
- `ganador_boleto` (Text, Nullable): El número sorteado.
- `ganador_nombre` (Text, Nullable): Texto que muestra el ganador de ese boleto una vez finalizada la cuenta.
- **Campos de Regalo de Incentivo:**
  - `regalo_incluido` (Text, Nullable): Nombre del extra regalo temporizado si es que hubo uno.
  - `fecha_limite_regalo` (Timestamptz, Nullable): Fecha topé para poder entrar a dicha dinámica.
  - `fotos_regalo` (Text Array): Múltiples URLs exclusivas para la galería del regalo.

#### `participantes` (Tabla de Apartados y Compras)
- `id` (UUID, Primary Key)
- `rifa_id` (UUID, Foreign Key conectado a `rifas.id`)
- `nombre` (Text): Nombre del comprador.
- `telefono` (Text): Teléfono (WhatsApp) para validación de contactos.
- `estado_pago` (Text): Estatus financiero (`pendiente` o `pagado`).
- `numero_boletos` (Numeric): Conteo general de los apartados.
- `boletos_seleccionados` (Text Array): Exacto identificador (Array de Textos `["001", "099"]`) comprados impidiendo duplicados en consulta directa desde el frontend.
- `fecha_compra` (Timestamptz)
