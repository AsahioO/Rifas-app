# WhatsHome Rifas 🎟️🍷

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

Plataforma Web diseñada para gestionar, promover y automatizar rifas interactivas en vivo. El sistema cuenta con un Catálogo de Sorteos al público, reserva de boletos en tiempo real mediante contacto de WhatsApp y un Panel de Administración robusto para generar ganadores al vuelo a través de Ruleta digital.

## Características Principales 🌟

1. **Catálogo de Sorteo Público (`/`)**: 
   - Landing Page optimizada a conversión.
   - Carrusel de fotos dinámico (Auto-reproducción cada 4s).
   - Parrilla interactiva de visualización de boletos disponibles/ocupados en tiempo real.
   - Panel de "Ganador Coronado" con confeti cuando la dinámica concluye.

2. **Gestor Administrativo Privado (`/admin`)**:
   - Creación de rifas infinitas ajustables en total de tickets y costo.
   - Subida multi-imagen en servidores perimetrales (Supabase Storage).
   - Control cruzado de "Participantes" (Reserva manual de boletaje).

3. **Ruleta "En-Vivo" (`/admin/sorteo`)**:
   - Panel inmersivo donde una ruleta escoge digitalmente el ganador quemando intentos previos configurables (Ej: Ganador al 5to intento).

4. **Historial Centralizado (`/admin/historial`)**:
   - Registro de todas las rifas cerradas y sus respectivos boletos galardonados con su correspondiente fecha e imagen guardada.

---

## Despliegue y Local (Ejecución Rápida) 🚀

El proyecto usa Node.js (`v18+`) y el manejador por defecto es `npm`.

### 1. Variables de Entorno (`.env.local`)
Debes crear en la raíz un `.env.local` conectando los secretos de tu "Cubo" de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabsae_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_super_secret_anon_key
```

### 2. Base de Datos (SQL Setup)
Ejecutar desde el editor SQL de Supabase para establecer la arquitectura:
- El contenido de `database.sql` (crea tablas `rifas` y `participantes`).
- El contenido de `storage.sql` (crea el cubo `rifas-images` y sus permisos).

### 3. Modo Desarrollo
```bash
npm install
npm run dev
# Abierto en http://localhost:3000
```


---

*Proyecto diseñado a medida. Todos los derechos reservados.*
