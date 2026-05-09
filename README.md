# FIGURITAPP — Tracker del álbum Panini FIFA World Cup 2026

FIGURITAPP es un tracker web para el álbum oficial Panini FIFA World Cup 2026.
Cada usuario puede ver su progreso, marcar figuritas como conseguidas o
faltantes, y administrar sus repetidas — todo en su navegador, sin cuentas
y sin base de datos.

La interfaz está pensada en español rioplatense, con una dirección visual
inspirada en Nike: tipografía display, alto contraste, geometría pill,
acentos de selección sutiles y foco en mobile.

## Stack

- **Next.js 16 — App Router** (JavaScript, sin TypeScript).
- **SCSS modules** para todos los estilos.
- **Sistema de diseño Nike** (`getdesign add nike`) — `DESIGN.md` actúa como
  fuente de tokens (paleta `ink/canvas/soft-cloud`, espaciado 8px, geometría
  pill `radius-lg = 30px`).
- **flag-icons** para todas las banderas nacionales (no se usan emojis).
- **localStorage** para persistir el progreso del usuario.

No se usa: TypeScript, base de datos, autenticación, Tailwind, ni dependencias
no esenciales.

## Comandos

```bash
# Crear el proyecto base (sólo si arrancás de cero)
npx create-next-app@latest figuritapp --js --app --src-dir --eslint --no-tailwind

# Agregar la guía de diseño Nike (genera DESIGN.md)
npx getdesign@latest add nike

# Dependencias adicionales
npm install sass flag-icons

# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm run start
```

## Estructura

```
src/
  app/
    api/album/route.js     # GET /api/album, datos generados
    layout.js              # Fuentes (Inter + Bebas Neue), metadata
    page.js                # Punto de entrada — monta AppShell
    globals.scss           # Tokens CSS, reset, import flag-icons
  components/
    AppShell/              # Wrapper, fetch /api/album, manejo de tabs
    MainNav/               # Top nav segmentado
    HomeSection/           # Dashboard
    AlbumSection/          # Grilla del álbum + filtros + import/export
    RepeatedSection/       # Carga y administración de repetidas
    StickerCard/           # Card de figurita (toggle conseguida/faltante)
    StickerGrid/           # Grilla responsive de figuritas
    FilterBar/             # Búsqueda + chips + selects
    ProgressSummary/       # Tarjeta de progreso global
    TeamSection/           # Bloque por selección con header de colores
    TeamBadge/             # Pill con bandera y código
    FlagIcon/              # Span con clases flag-icons + accesibilidad
    ImportExportPanel/     # Exportar/Importar/Reiniciar progreso
    EmptyState/            # Estado vacío reutilizable
  data/
    albumConfig.js         # Constantes (clave de storage, FWC, secciones)
    countryMeta.js         # 48 selecciones, banderas y colores
    generateAlbum.js       # Genera deterministicamente las 980 figuritas
  hooks/
    useLocalStorage.js     # Hook genérico, safe-hydration
    useAlbumProgress.js    # Lee/escribe progress en localStorage
  utils/
    albumStats.js          # Conteos derivados
    stickerCode.js         # Normalización y parseo de códigos
    stickerFilters.js      # Filtros del álbum
    validateAlbum.js       # Validaciones runtime (980, 68, banderas, etc.)
  styles/
    variables.scss         # Tokens SCSS mapeados al DESIGN.md de Nike
    mixins.scss            # Pills, focus ring, breakpoints, helpers
    team-colors.scss       # Una clase por selección con var(--team-*)
```

## API: `GET /api/album`

Devuelve el álbum completo, generado deterministicamente desde
`src/data/countryMeta.js` + `src/data/albumConfig.js`. No hay base de datos.

Forma de la respuesta:

```json
{
  "total": 980,
  "specialTotal": 68,
  "teamsTotal": 48,
  "stickers": [ /* 980 figuritas */ ],
  "teams":    [ /* 48 selecciones */ ],
  "sections": [ /* 3 secciones: panini, fwc, team */ ]
}
```

`validateAlbum.js` verifica al servir la respuesta:

- Hay exactamente 980 figuritas y 68 especiales.
- Cada selección tiene 20 figuritas y un único escudo (sufijo 001).
- No hay IDs duplicados.
- Cada selección tiene `flagCode` y los tres colores (primary, secondary,
  accent).
- Los `flagCode` críticos son consistentes con `flag-icons`:
  ARG → `ar`, USA → `us`, ENG → `gb-eng`, SCO → `gb-sct`, KOR → `kr`,
  KSA → `sa`, RSA → `za`, CIV → `ci`, COD → `cd`.

## Códigos FIFA/Panini vs flag-icons

Los códigos de tres letras de FIFA/Panini no siempre coinciden con los
ISO-3166 de `flag-icons`. Por eso cada selección guarda dos campos:

- `code`: el código FIFA/Panini (`ARG`, `USA`, `ENG`, `RSA`, ...).
- `flagCode`: el slug que entiende `flag-icons` (`ar`, `us`, `gb-eng`,
  `za`, ...).

`<FlagIcon flagCode="gb-eng" label="Inglaterra" />` renderiza como:

```html
<span class="fi fi-gb-eng" role="img" aria-label="Bandera de Inglaterra"></span>
```

## Persistencia local

El progreso del usuario vive en `localStorage` bajo la clave
versionada `panini-2026-progress-v3`:

```json
{
  "owned":      { "ARG1": true, "USA18": true },
  "duplicates": { "ARG1": 1,    "USA18": 2    },
  "updatedAt":  "2026-05-09T04:00:00.000Z"
}
```

- `owned` guarda únicamente las figuritas conseguidas. Las **faltantes
  se derivan** (`todas − owned`); nunca se almacenan.
- `duplicates[code]` representa **copias extra**, no copias totales.
  Un valor `1` significa una copia adicional → la UI muestra `x2`.
- `updatedAt` se actualiza con cada cambio.
- `useAlbumProgress` saneamiento defensivo: ignora claves desconocidas,
  recortes negativos, valores no enteros y JSON corrupto.

`useLocalStorage` evita errores de hidratación: la primera renderización
SSR-segura usa el valor por defecto, y el storage se lee dentro de un
`useEffect` después del mount.

## Lógica de repetidas

1. El usuario ingresa un código en cualquier formato razonable
   (`arg1`, `ARG 01`, `ARG-001`, `usa 18`, `FWC 5`, `fwc05`, `0-0`).
2. `normalizeStickerCode` lo lleva a la forma canónica sin ceros a la
   izquierda y sin espacios (`ARG1`, `USA18`, `FWC5`, `0-0`).
3. Si el código no existe (por ejemplo `ARG21`, `FWC20`, `XXX1`),
   mostramos un mensaje en español y no agregamos nada.
4. Si existe, incrementamos `duplicates[code]` y marcamos
   `owned[code] = true` (una repetida implica que el original ya está).
5. La UI muestra `x2`, `x3`, `x4`… (es decir, `count + 1`).
6. Botones `+1`, `−1` y `Quitar` permiten administrar la cantidad.

## Filtros y búsqueda

- Buscar por código, país o sección (insensible a tildes).
- Estado: Todas / Conseguidas / Faltantes / Repetidas / Especiales.
- Sección: Panini / FWC / Selecciones.
- Selección puntual: las 48 selecciones disponibles.

## Importar / Exportar

- **Exportar**: descarga `figuritapp-progreso-YYYY-MM-DD.json` con
  `owned`, `duplicates` y `updatedAt`.
- **Importar**: lee un JSON, ignora claves que no existen en el álbum y
  fuerza enteros positivos en `duplicates`. Si el archivo no es JSON o
  no tiene la forma esperada, muestra un mensaje de error en español
  sin tocar el progreso actual.
- **Reiniciar**: requiere confirmación con el texto:
  *"¿Seguro que querés reiniciar tu progreso? Esta acción no se puede deshacer."*

## Accesibilidad

- HTML semántico (`<button>`, `<form>`, `<progress>`, `<header>`, `<main>`,
  `<footer>`, `<nav>`).
- Labels en español para botones y banderas
  (ej: *"Marcar ARG 001 como conseguida"*).
- Foco visible en todos los controles, soporte de teclado completo.
- `aria-live` para feedback de validaciones y conteos.
- Respeto de `prefers-reduced-motion` (transiciones reducidas
  automáticamente).
- Touch targets ≥ 44px en pills, chips y cards.

## Limitaciones actuales

- El progreso vive en `localStorage`, así que es por navegador. Para
  pasarlo a otro dispositivo se usa Importar/Exportar.
- No hay multiusuario ni sincronización entre dispositivos.
- No hay imágenes de las figuritas (Panini no expone arte oficial).
- Las traducciones son sólo a español.
- No hay PWA / instalación offline (todo el HTML/JS sí cachea, pero no se
  registró un service worker).

## Mejoras futuras (opcionales)

- Sincronización opcional con la nube (Supabase / Firebase) detrás de un
  toggle, manteniendo localStorage como source of truth offline.
- Cuentas de usuario para compartir el álbum con amigos.
- Modo "intercambio": ver tus repetidas vs los faltantes de otra persona.
- PWA con manifest + service worker para uso offline.
- Modo oscuro siguiendo la paleta Nike (`canvas → ink`, `ink → on-primary`)
  con tokens semánticos.
- Tests automatizados (Vitest + Testing Library) para `stickerCode`,
  `albumStats` y `validateAlbum`.
