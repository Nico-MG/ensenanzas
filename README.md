# EnseñaPPT

Aplicación web local para Windows destinada a crear enseñanzas bíblicas y convertirlas en presentaciones PowerPoint editables.

## Desarrollo local

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

Abre `.env` y reemplaza `replace_with_your_api_key` con tu clave de ApiBiblia.
Reinicia `npm run dev` después de cambiar la clave. El archivo `.env` es local,
está excluido de Git y la clave solo se usa desde el proxy de desarrollo; no se
envía al navegador. No uses un prefijo `VITE_` para esta variable.

## Publicación en GitHub Pages

El workflow `.github/workflows/deploy-pages.yml` construye la aplicación y
publica `dist` cuando hay un push a `master`. En la configuración del
repositorio, selecciona **Settings → Pages → Build and deployment → Source:
GitHub Actions**. La aplicación se publica bajo `/ensenanzas/`.

GitHub Pages solo aloja archivos estáticos: las consultas bíblicas necesitan un
proxy de servidor que no forma parte de Pages. La clave del `.env` local no se
incluye en el despliegue.

## Exportación

La aplicación genera archivos `.pptx` y `.docx` localmente. El PowerPoint usa
formato panorámico 16:9 e incluye títulos, citas y el texto marcado en negrita;
las citas bíblicas de varios versículos se distribuyen sin cortar versículos.
Cada diapositiva permite elegir una columna o dos columnas, con texto y citas
bíblicas intercambiando lados.
Las imágenes PNG, JPEG y GIF compatibles se incorporan al PowerPoint. El
documento Word conserva el contenido y sus formatos; las imágenes se indican
con su texto alternativo.

Para validar cambios antes de distribuir:

```powershell
npm run build
npm run lint
```
