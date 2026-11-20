# Strong personal — diseño

Fecha: 2026-11-20 · Estado: borrador para aprobación

## Intención

Reemplazo personal de Strong Pro para un solo usuario con iPhone. Registrar entrenamientos
desde plantillas (series, peso/reps, descanso cronometrado), guardar el historial en el
teléfono y ver patrones semanales sin presión. Sin cuentas, sin nube, sin telemetría.

## Objetivos

- Ciclo principal: plantilla → entrenamiento en curso (series + temporizador de descanso) → historial.
- Rutinas moderadas: plan semanal con días de entrenamiento y días de descanso explícitos.
- Registros diarios opcionales: actividad, sueño, ánimo, energía, notas. Unidades editables
  (kg/lb, km/mi, horas/minutos; ánimo y energía en escala 1–5).
- Tendencias: consistencia semanal (días activos, volumen, minutos), en lenguaje neutro.
- Recordatorios locales silenciables (global y por recordatorio).
- Exportar (JSON completo + CSV de series) y borrar todo con confirmación.
- Aviso visible: "Esta app no es atención médica ni reemplaza el consejo de un profesional".
- Estados claros: vacío, cargando, éxito y error recuperable (con "Reintentar").
- Arranque local con un solo comando documentado.

## No-objetivos

Cuentas, facturación, telemetría, analítica, servidor propio, diagnóstico o tratamiento
médico, coaching de ejercicio extremo o alimentación restrictiva, hardware wearable,
coaching humano, red social.

## Anti-objetivos (fracaso aunque funcione)

- Metas de peso corporal, calorías, rachas que "se rompen", castigos, rankings.
- Lenguaje que juzgue cuerpo o rendimiento ("fallaste", "mal", "deberías").
- Que algo dependa de conceder permisos de Salud o de tener red.

## Restricciones

- Stack fijo: React Native + Expo (SDK actual), TypeScript, `expo-sqlite`.
- Datos solo en el dispositivo (SQLite en el sandbox de la app).
- Secretos en `.env` (gitignored); se publica `.env.example`. No hay secretos reales hoy;
  `.env` solo lleva flags (`EXPO_PUBLIC_HEALTHKIT_ENABLED=false`).
- Instalación en el iPhone: camino A — `npx expo run:ios --device` con Apple ID gratuito
  (la firma vence a los 7 días; se reinstala con el mismo comando, los datos persisten).
  Requiere Xcode. Sin EAS ni servicios hospedados.

## Enfoques considerados

1. **Expo + expo-router + expo-sqlite, dominio puro en `src/core`** — elegido. Lógica testeable
   sin dispositivo; la UI es una capa fina.
2. Estado en memoria con persistencia JSON (AsyncStorage) — descartado: la especificación pide
   SQLite y el historial crece.
3. ORM (Drizzle) sobre expo-sqlite — descartado por ahora: más dependencias para un esquema
   chico; SQL directo con migraciones versionadas alcanza.

## Diseño

### Estructura

```
app/                 pantallas (expo-router, tabs)
  (tabs)/train       plantillas + entrenamiento en curso + descanso
  (tabs)/history     lista y detalle de entrenamientos
  (tabs)/routines    plan semanal con días de descanso
  (tabs)/logs        registros diarios opcionales
  (tabs)/trends      patrones semanales
  settings           unidades, recordatorios, salud, exportar, borrar, aviso médico
src/core/            lógica pura: validación, unidades, agregados semanales, export, filename seguro
src/db/              conexión, migraciones, repositorios
src/health/          adaptador HealthKit (no-op si deshabilitado o no disponible)
src/notifications/   recordatorios locales (expo-notifications)
src/ui/              componentes de estado (Empty, Loading, ErrorRetry, Toast)
```

### Datos (SQLite)

`exercises`, `templates`, `template_exercises`, `workouts`, `workout_sets`
(peso siempre guardado en kg, reps, completada), `routines`, `routine_days`
(día de semana → plantilla o descanso), `daily_logs` (fecha, tipo, valor, unidad, nota),
`settings` (clave/valor), `reminders`. Migraciones por `PRAGMA user_version`.
Se siembran ~20 ejercicios comunes y 2 plantillas de ejemplo en el primer arranque.

### Unidades

Se guarda en unidad canónica (kg, km, minutos); se convierte al mostrar según ajustes.

### Tendencias

`weeklySummary(workouts, logs, weekStart)` → días activos, entrenamientos, volumen total,
minutos, promedio de sueño/ánimo/energía si existen. Comparación con semanas previas solo
como números y gráfico de barras simple, sin calificativos.

### HealthKit

Apagado por defecto (`EXPO_PUBLIC_HEALTHKIT_ENABLED=false`). Si está activo y disponible,
en Ajustes cada tipo (escribir entrenamientos, leer sueño, leer pasos) tiene su propio
interruptor que pide permiso solo para ese tipo. Librería: `@kingstinct/react-native-healthkit`
vía config plugin (requiere build nativo, no funciona en Expo Go). Si el módulo no está o
falla, la app sigue normal y muestra "No disponible en este dispositivo".

### Exportar / borrar

Exportar genera `strong-export-YYYY-MM-DD.json` y `.csv` (nombres saneados) en el directorio
de caché y abre la hoja de compartir (`expo-sharing`). Borrar todo: doble confirmación,
cierra y elimina la base, cancela recordatorios, recrea esquema vacío.

### Tests

- Unitarios (Jest) sobre `src/core`: conversión de unidades, validación de entradas,
  `weeklySummary`, construcción de export CSV/JSON, `safeFilename`.
- Un recorrido de punta a punta con React Native Testing Library y una base SQLite en memoria
  (`better-sqlite3` como sustituto en tests): crear plantilla → iniciar entrenamiento →
  completar series → terminar → aparece en historial → exportar contiene el entrenamiento.

### Ejecución

- Local: `npm install && npm start` → escanear QR con Expo Go.
- iPhone sin Mac (camino A): `npx expo run:ios --device` con el iPhone conectado; renovar cada 7 días.
- README: setup, arquitectura, permisos, ubicación de datos, respaldo (exportar + AirDrop/Archivos).

## Decisiones mías (revisables)

- Escala 1–5 para ánimo y energía; sin colores rojo/verde en tendencias.
- Peso canónico en kg; unidad por defecto kg (Argentina).
- Idioma de la UI: español.
- No hay "récords personales" destacados ni rachas; el historial por ejercicio muestra los
  valores pasados sin celebrarlos ni penalizarlos.

## Queda para el implementador

Estilo visual, textos exactos, iconos, orden de pantallas dentro de cada tab.
