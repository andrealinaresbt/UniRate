# Sistema de Resúmenes con IA (Gemini)

Sistema de generación automática de resúmenes para profesores y materias usando Google Gemini AI.

## 🎯 Características

- ✨ **Resúmenes inteligentes**: Genera resúmenes de 3-4 oraciones basados en reseñas reales
- 💾 **Caché automático**: Los resúmenes se guardan en BD y se regeneran solo cuando hay reseñas nuevas
- 🔄 **Regeneración manual**: Botón para regenerar el resumen cuando sea necesario
- 📊 **Mínimo de reseñas**: Requiere al menos 3 reseñas para generar un resumen
- 🆓 **Completamente gratis**: Usa Gemini API con límites generosos (1500 requests/día)

## 📋 Requisitos Previos

1. **API Key de Google Gemini** (gratuita)
   - Ve a: https://makersuite.google.com/app/apikey
   - Crea una cuenta de Google (si no tienes)
   - Genera una API key gratuita
   - Copia la API key

## 🚀 Instalación

### 1. Base de datos

Ejecuta la migración SQL en tu proyecto de Supabase:

```bash
# Archivo: apps/mobile/src/database/migrations/create_ai_summaries.sql
```

**Pasos en Supabase:**
1. Ve a tu proyecto en Supabase Dashboard
2. Abre el SQL Editor
3. Copia y pega el contenido de `create_ai_summaries.sql`
4. Ejecuta el script
5. Verifica que la tabla `ai_summaries` se haya creado

### 2. Configurar API Key

Edita el archivo de configuración:

```javascript
// apps/mobile/src/config/env.js

export const ENV = {
  SUPABASE_URL: 'tu_url_supabase',
  SUPABASE_ANON_KEY: 'tu_anon_key',
  
  // Reemplaza con tu API key de Gemini
  GEMINI_API_KEY: 'TU_API_KEY_AQUI',
};
```

### 3. Dependencias

La dependencia ya está instalada, pero si necesitas reinstalar:

```bash
cd apps/mobile
npm install @google/generative-ai
```

## 📱 Uso

El sistema funciona automáticamente en las pantallas de perfil:

### ProfessorProfile
- Aparece después de las estadísticas
- Se genera con las reseñas del profesor
- Se actualiza automáticamente cuando hay nuevas reseñas

### CourseProfile
- Aparece después de las estadísticas
- Se genera con las reseñas del curso
- Se actualiza automáticamente cuando hay nuevas reseñas

## 🎨 Interfaz de Usuario

El componente `AISummaryCard` muestra:
- ✨ Icono de IA y título "Resumen IA"
- 📝 Texto del resumen (con "Ver más/menos" si es largo)
- 🔄 Botón de regeneración
- ℹ️ Disclaimer indicando cuántas reseñas se usaron

Estados visuales:
- **Cargando**: Spinner + "Generando resumen..."
- **Error**: Mensaje de error + botón "Reintentar"
- **Sin reseñas suficientes**: No muestra nada (requiere mínimo 3)

## 🔧 Configuración del Caché

El sistema cachea resúmenes automáticamente:

- **Duración del caché**: 7 días
- **Invalidación**: Se regenera si:
  - Han pasado más de 7 días
  - El número de reseñas ha cambiado
  - El usuario presiona el botón de regenerar

Puedes ajustar la duración en `aiSummaryService.js`:

```javascript
const sevenDays = 7 * 24 * 60 * 60 * 1000; // Cambiar aquí
```

## 📊 Estructura de la Base de Datos

### Tabla: `ai_summaries`

```sql
- id: UUID (PK)
- entity_type: TEXT ('professor' | 'course')
- entity_id: UUID (FK a professors o courses)
- summary_text: TEXT
- review_count: INTEGER
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Políticas RLS

- **Lectura**: Público (cualquiera puede leer)
- **Escritura**: Solo usuarios autenticados
- **Actualización**: Solo usuarios autenticados
- **Eliminación**: Solo usuarios autenticados

## 💡 Prompts del Sistema

### Para Profesores
```
- Estilo de enseñanza
- Nivel de dificultad
- Aspectos positivos/negativos más mencionados
- Tono profesional pero amigable
```

### Para Materias
```
- Naturaleza y contenido del curso
- Nivel de dificultad y carga de trabajo
- Tipo de estudiantes que podrían disfrutarlo
- Aspectos positivos y desafíos comunes
```

## 🔒 Seguridad

⚠️ **IMPORTANTE**: La API key de Gemini actualmente está en el código cliente.

**Para producción, considera:**
1. Mover la generación de resúmenes al backend
2. Crear un endpoint protegido que llame a Gemini
3. El cliente solo llama a tu backend
4. Tu backend maneja la API key de forma segura

**Implementación recomendada:**
```javascript
// Backend (Node.js/Supabase Functions)
POST /api/summaries/professor/:id
POST /api/summaries/course/:id

// Cliente solo hace fetch a tu API
const summary = await fetch('/api/summaries/professor/' + id);
```

## 📈 Límites de Gemini (Tier Gratuito)

- **Requests por día**: 1,500
- **Requests por minuto**: 15
- **Tokens por minuto**: 1,000,000

**Estimación de uso:**
- 1 resumen ≈ 1 request
- 100 usuarios activos/día ≈ 50-100 resúmenes/día
- Muy por debajo del límite gratuito

## 🐛 Troubleshooting

### Error: "Could not find the table 'public.ai_summaries'"
**Solución**: Ejecuta la migración SQL en Supabase

### Error: "API key not valid"
**Solución**: 
1. Verifica que tu API key de Gemini sea correcta
2. Asegúrate de que esté en `apps/mobile/src/config/env.js`
3. Recarga la app (Ctrl+C y reinicia Expo)

### El resumen no aparece
**Verificar**:
1. Hay al menos 3 reseñas
2. La migración de BD está ejecutada
3. La API key de Gemini es válida
4. Ver logs de consola con `console.log`

### Error de permisos en Supabase
**Solución**: Verifica que las políticas RLS estén correctamente configuradas

## 🎯 Mejoras Futuras

Ideas para extender el sistema:

1. **Resúmenes por periodo**: Comparar trimestres/semestres
2. **Sentimiento**: Clasificar reseñas como positivas/negativas/neutrales
3. **Palabras clave**: Extraer términos más mencionados
4. **Comparaciones**: "Similar a..." (otros profesores/cursos)
5. **Tendencias**: "Últimamente los estudiantes reportan..."
6. **Traducciones**: Soportar múltiples idiomas
7. **Audio**: Leer resúmenes en voz alta
8. **Notificaciones**: Avisar cuando haya un nuevo resumen

## 📚 Recursos

- [Gemini API Docs](https://ai.google.dev/docs)
- [Gemini Pricing](https://ai.google.dev/pricing)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 🤝 Contribuir

Para modificar el sistema de resúmenes:

1. **Cambiar prompts**: Edita `_generateProfessorSummary` o `_generateCourseSummary` en `aiSummaryService.js`
2. **Ajustar UI**: Modifica `AISummaryCard.js`
3. **Cambiar caché**: Ajusta la lógica en `getProfessorSummary` / `getCourseSummary`

---

**Autor**: GitHub Copilot  
**Fecha**: 19 de noviembre de 2025  
**Versión**: 1.0.0
