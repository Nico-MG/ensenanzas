# PROYECTO: EnseñaPPT

## 1. Descripción general

EnseñaPPT es una aplicación web local para Windows destinada a crear enseñanzas bíblicas y transformarlas en presentaciones PowerPoint editables.

El usuario debe poder escribir libremente una enseñanza en un editor de texto ubicado a la izquierda de la pantalla y visualizar simultáneamente, en el lado derecho, cómo se transforma ese contenido en diapositivas.

La aplicación debe detectar referencias bíblicas, sugerir la recuperación del versículo completo desde una fuente bíblica compatible con Reina-Valera 1960 (RVR1960) y permitir incorporarlo a la enseñanza.

El resultado final debe ser un archivo PowerPoint (.pptx) editable.

El proyecto comenzará funcionando exclusivamente de manera local, sin publicación en Internet, sin servidores externos propios y sin Tauri.

## 2. Objetivo principal

Crear una herramienta que permita preparar una enseñanza bíblica desde un documento de texto y convertirla en una presentación profesional sin tener que diseñar manualmente cada diapositiva.

La experiencia debe ser sencilla, intuitiva y similar a un editor de documentos combinado con un diseñador de presentaciones.

## 3. Decisiones funcionales aprobadas

- Plataforma: Windows.
- Modalidad: aplicación web local.
- Ejecución: navegador mediante localhost.
- Editor: texto libre enriquecido.
- Conversión a diapositivas: híbrida.
- Reconocimiento bíblico: mostrar sugerencias y esperar aprobación.
- Traducción bíblica: Reina-Valera 1960.
- Diseño: temas globales.
- Personalización: edición individual de diapositivas.
- Temas iniciales: 3 o 4.
- Almacenamiento: local.
- Exportación: PowerPoint PPTX.
- Idioma de interfaz: español.

## 4. Stack tecnológico

Utilizar preferentemente:

- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- shadcn/ui.
- TipTap para el editor enriquecido.
- PptxGenJS para generar archivos PowerPoint.
- IndexedDB para almacenamiento local.
- Dexie.js como posible capa de abstracción de IndexedDB.
- React Router si se requiere navegación entre pantallas.

No utilizar inicialmente:

- Tauri.
- Electron.
- Next.js.
- Supabase.
- Firebase.
- Vercel.
- Servicios de backend propios.

La aplicación debe funcionar localmente y no depender de infraestructura pública.

## 5. Arquitectura funcional

Separar la aplicación en módulos independientes:

### Módulo 1: Biblioteca de enseñanzas

Permitir:

- Crear una enseñanza.
- Abrir una enseñanza existente.
- Editar.
- Duplicar.
- Eliminar.
- Buscar por título.
- Mostrar última fecha de modificación.

### Módulo 2: Editor de enseñanzas

Implementar un editor enriquecido mediante TipTap.

Debe permitir:

- Títulos.
- Subtítulos.
- Párrafos.
- Negrita.
- Cursiva.
- Subrayado.
- Listas numeradas.
- Viñetas.
- Citas.
- Separadores de sección.
- Referencias bíblicas.
- Inserción de imágenes.

El editor debe admitir escritura libre.

### Módulo 3: Procesador de contenido

Analizar el documento e identificar:

- Títulos.
- Subtítulos.
- Párrafos.
- Listas.
- Citas.
- Referencias bíblicas.
- Separadores de diapositivas.

Debe transformar el contenido en una estructura intermedia que permita generar diapositivas.

### Módulo 4: Generador híbrido de diapositivas

El sistema debe proponer automáticamente una distribución del contenido.

El usuario podrá:

- Aceptar la distribución.
- Modificarla.
- Dividir diapositivas.
- Unir diapositivas.
- Reordenarlas.
- Agregar diapositivas.
- Eliminar diapositivas.

No se debe modificar el documento original al reorganizar las diapositivas.

### Módulo 5: Integración bíblica

Detectar referencias como:

- Juan 3:16.
- Hebreos 11:1.
- Romanos 8:28-31.
- Salmos 23.

Cuando se detecte una referencia:

1. Mostrar una sugerencia.
2. Consultar la fuente bíblica.
3. Mostrar el texto encontrado.
4. Permitir aceptar o cancelar.
5. Incorporar el versículo al documento y/o a una diapositiva.

Utilizar RVR1960 como traducción inicial.

Antes de almacenar localmente o redistribuir textos bíblicos, verificar los derechos y las condiciones de uso de la fuente seleccionada.

Diseñar el módulo para que en el futuro permita agregar otras traducciones.

### Módulo 6: Diseñador visual

Implementar temas globales.

Cada tema debe definir:

- Paleta de colores.
- Tipografías.
- Fondos.
- Estilo de portada.
- Estilo de diapositivas de contenido.
- Estilo de versículos.
- Estilo de citas.
- Estilo de conclusión.

Crear inicialmente entre tres y cuatro temas visuales diferentes.

El usuario podrá cambiar el tema global sin perder el contenido.

### Módulo 7: Personalización individual

Cada diapositiva debe permitir modificaciones independientes:

- Texto.
- Tamaño de fuente.
- Posición de elementos.
- Alineación.
- Fondo.
- Imágenes.
- Distribución.

Las personalizaciones individuales deben conservarse al cambiar de diapositiva o guardar el documento.

### Módulo 8: Vista previa

La vista previa debe actualizarse en función de los cambios del documento y de la estructura de diapositivas.

Utilizar formato panorámico 16:9 como predeterminado.

La vista previa debe representar razonablemente el resultado que se exportará a PowerPoint.

### Módulo 9: Exportación

Utilizar PptxGenJS.

Generar archivos PPTX con:

- Texto editable.
- Elementos gráficos editables cuando sea posible.
- Imágenes incorporadas.
- Fondos y colores.
- Distribución visual.
- Formato 16:9.

No generar una presentación compuesta exclusivamente por capturas de pantalla de las diapositivas.

## 6. Modelo de datos conceptual

Separar los siguientes conceptos:

### Teaching
- id
- title
- content
- createdAt
- updatedAt

### Presentation
- id
- teachingId
- themeId
- slideFormat
- createdAt
- updatedAt

### Slide
- id
- presentationId
- order
- type
- content
- customizations

### BibleReference
- id
- teachingId
- book
- chapter
- verseStart
- verseEnd
- translation
- text

### Theme
- id
- name
- colors
- typography
- background
- layouts

El modelo definitivo podrá ajustarse durante la implementación, pero se debe conservar la separación entre documento original, presentación y personalizaciones.

## 7. Diseño de interfaz

La aplicación tendrá cuatro pantallas:

### Inicio
Biblioteca de enseñanzas y creación de documentos.

### Editor
Pantalla principal dividida en:

- Panel izquierdo: editor de texto.
- Panel derecho: vista previa de la diapositiva.
- Panel inferior: navegación entre diapositivas.

### Diseñador
Configuración del tema global, tipografías, colores y fondos.

### Exportación
Previsualización y generación del archivo PowerPoint.

Estética deseada:

- Profesional.
- Moderna.
- Minimalista.
- Buena legibilidad.
- Interfaz en español.
- Preferentemente tonos neutros con acentos azules.
- Sin exceso de elementos visuales.

## 8. Plan de implementación obligatorio

Desarrollar en este orden:

ETAPA 1: Preparación del proyecto.
- Revisar el entorno.
- Crear proyecto React + Vite + TypeScript.
- Configurar Tailwind.
- Configurar estructura de carpetas.
- Verificar ejecución local.

ETAPA 2: Interfaz principal.
- Diseño general.
- Navegación.
- Biblioteca de enseñanzas.
- Crear, abrir y eliminar documentos.

ETAPA 3: Editor.
- Integrar TipTap.
- Formato de texto.
- Guardado local.
- Vista previa.
- Separación de diapositivas.
- Distribución híbrida.

ETAPA 4: Diseñador.
- Temas globales.
- Plantillas.
- Personalización individual.
- Conservación de cambios.

ETAPA 5: Integración bíblica.
- Detector de referencias.
- Consulta RVR1960.
- Sugerencias.
- Incorporación de versículos.
- Persistencia local autorizada.

ETAPA 6: Exportación.
- Integrar PptxGenJS.
- Generar PPTX.
- Validar edición en PowerPoint.
- Pruebas.
- Preparar distribución local.

## 9. Reglas de desarrollo

MUY IMPORTANTE:

1. No implementar todas las etapas de una sola vez.
2. Trabajar estrictamente por etapas.
3. Antes de comenzar cada etapa, explicar qué se construirá.
4. No avanzar sin validar la etapa anterior.
5. No generar código innecesario ni agregar dependencias sin justificación.
6. Mantener componentes pequeños y reutilizables.
7. Separar lógica de negocio, interfaz y persistencia.
8. Mantener TypeScript correctamente tipado.
9. No utilizar datos ficticios como solución definitiva.
10. No implementar funciones fuera del alcance del MVP sin autorización.
11. Mantener el documento original independiente de las diapositivas.
12. Documentar decisiones técnicas importantes.
13. Priorizar funcionamiento local y persistencia de datos.
14. Evitar dependencias de servicios externos, salvo la consulta bíblica cuando corresponda.

## 10. Instrucción inicial para la IA de desarrollo

Antes de escribir código:

1. Lee completamente este documento.
2. Comprende los objetivos y restricciones.
3. Presenta la arquitectura inicial de carpetas.
4. Identifica dependencias necesarias para la primera etapa.
5. Revisa el entorno de desarrollo.
6. Propón un plan de ejecución para la ETAPA 1.
7. Espera confirmación antes de realizar cambios.

No comiences a implementar módulos futuros.

El objetivo es construir EnseñaPPT paso a paso, con una base técnica sólida y verificando cada avance.