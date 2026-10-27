# Bojana Estudio

Sitio web de Bojana Estudio: Arquitectura, Ingeniería Civil, Diseño y Construcción.

- Sitio: https://bojana.com.ar
- Hosting: Vercel
- Sitio estático, sin instalación ni compilación.

## Contenido

- Hero con animación del plano a los renders de habitación y living.
- Proyecto Los Alisos: Acceso SUM, SUM, Gimnasio y Exteriores. Los renders cambian con el scroll de la página y también al volver hacia arriba.
- Sección Estudio y formulario de consultas.
- Menú de hamburguesa en móvil y accesos de email y WhatsApp en el footer.
- Estructuras: servicios del Ing. José Bojana, ejemplo interactivo con cuatro etapas y descarga del portafolio.

## Documentos públicos

Se publican únicamente los PDF finales de `documentos/`:

- https://www.bojana.com.ar/documentos/portafolio-estructural.pdf — 18 páginas.
- https://www.bojana.com.ar/documentos/anexo-tecnico.pdf — 29 páginas.

Las referencias AT del portafolio abren la página correspondiente del anexo. Cada lámina del anexo incluye un enlace de regreso al caso. Los enlaces usan las URL públicas para funcionar también desde los PDF descargados.

Las carpetas locales `portafolio estructural/` y `files (2)/` conservan los originales y las revisiones; están excluidas del repositorio y del despliegue. Al actualizar los documentos, conservar sus rutas públicas y revisar los destinos de página.

## Archivos

- `index.html`: página principal.
- `style.css`: estilos y layout responsive.
- `script.js`: navegación, galería con scroll y formulario.
- `assets/`: renders y animación del hero.
- `Bojana-Estudio-Logo-White.svg`: logo del estudio.

## Desarrollo local

Desde la raíz del repositorio, ejecutá `python -m http.server 8000` y abrí `http://localhost:8000`.

## Formulario

Las consultas se envían a `info@bojana.com.ar` mediante FormSubmit. La recepción requiere confirmar una vez el email de activación de FormSubmit; la entrega real de mensajes aún no se verificó.
