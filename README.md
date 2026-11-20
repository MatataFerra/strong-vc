# Strong personal

App personal de iPhone para registrar entrenamientos desde plantillas (series, peso, repeticiones y descanso cronometrado), planificar una rutina semanal moderada con días de descanso, llevar registros opcionales (actividad, sueño, ánimo, energía, notas) y ver patrones semanales en lenguaje neutro.

Sin cuentas, sin nube, sin telemetría ni analítica. Todo queda en el teléfono.

> **Aviso:** Esta app no es atención médica ni reemplaza el consejo de un profesional de la salud. No diagnostica, no indica tratamientos y no da consejos de alimentación ni de ejercicio extremo.

## Requisitos

- Node.js 20 o superior (probado con Node 24) y npm.
- iPhone con **Expo Go** (gratis en el App Store) para probar mientras desarrollás.
- **Xcode** (gratis en el Mac App Store) solo para instalar la app en el iPhone y usarla sin la Mac.

## Probar en local (un comando)

```bash
npm install && npm start
```

Escaneá el código QR que aparece en la terminal con la cámara del iPhone; se abre en Expo Go. La Mac y el iPhone tienen que estar en la misma red wifi. Cada cambio en el código se ve al instante.

No hace falta `.env` para arrancar. Si querés cambiar opciones: `cp .env.example .env`.

## Instalar en el iPhone (Apple ID gratuito)

Una sola vez:

1. Abrí Xcode → **Settings → Accounts** → agregá tu Apple ID.
2. Conectá el iPhone por cable y aceptá "Confiar en esta computadora".
3. En el iPhone: **Ajustes → Privacidad y seguridad → Modo desarrollador** → activalo (se reinicia).

Instalar:

```bash
npm run device
```

Elegí tu iPhone cuando lo pregunte. La primera compilación tarda varios minutos. Si Xcode pide un "Team", elegí tu Apple ID (Personal Team).

La primera vez que abras la app, iOS puede bloquearla: **Ajustes → General → VPN y gestión de dispositivos** → tu Apple ID → **Confiar**.

**Renovación:** con un Apple ID gratuito, Apple vence la firma a los **7 días**. Cuando la app deje de abrir, conectá el iPhone y corré `npm run device` de nuevo. Tus datos se mantienen. (Con una cuenta Apple Developer paga no vence; el código no cambia.)

## Arquitectura

```
src/app/            Rutas (expo-router): pestañas Entrenar, Historial, Rutinas, Registros, Tendencias + Ajustes
src/features/       Pantallas por área (train, history, routines, logs, trends, settings)
src/core/           Lógica pura y testeada: unidades, validación, fechas, resumen semanal, exportación, nombres de archivo
src/db/             SQLite: migraciones versionadas (PRAGMA user_version), datos iniciales, repositorios
src/health/         Puente opcional con Apple Salud; nunca lanza errores hacia la UI
src/notifications/  Recordatorios locales y aviso de fin de descanso, silenciables
src/services/       Exportación a JSON/CSV y hoja de compartir
src/ui/             Componentes base y estados (cargando, vacío, error con reintentar, aviso de éxito)
e2e/                Recorrido de punta a punta
```

Decisiones:
- Pesos guardados en kg, distancias en km y tiempos en minutos; se convierten al mostrar según Ajustes (kg/lb, km/mi).
- Fechas en hora local; la semana empieza el lunes.
- Un entrenamiento en curso vive en la base de datos, así que si cerrás la app lo retomás al volver.
- El historial guarda el nombre de cada ejercicio, así que borrar un ejercicio o plantilla no altera el pasado.

## Permisos

Todos son opcionales; la app funciona completa sin ninguno.

- **Notificaciones:** se piden recién cuando agregás un recordatorio o terminás una serie (aviso de fin de descanso). "Silenciar todo" en Ajustes cancela todos los avisos programados.
- **Apple Salud (HealthKit):** apagado por defecto. Para activarlo, poné `EXPO_PUBLIC_HEALTHKIT_ENABLED=true` en `.env` y reinstalá con `npm run device` (no funciona en Expo Go). Después, en Ajustes, cada tipo (guardar entrenamientos, leer sueño, leer pasos) tiene su propio interruptor y pide permiso solo para ese tipo. Si no está disponible, la app lo indica y sigue funcionando. Con un Apple ID gratuito es posible que Xcode no pueda firmar el permiso de HealthKit; en ese caso dejalo apagado.

## Dónde están tus datos

En una base SQLite llamada `strong.db`, dentro del espacio privado de la app en el iPhone (`Documents/SQLite/strong.db`). Nada sale del teléfono salvo que vos exportes.

## Respaldo y exportación

**Ajustes → Exportar datos** genera:
- `strong-export-AAAA-MM-DD.json`: respaldo completo de todas las tablas.
- `strong-export-AAAA-MM-DD-series.csv`: todas las series (fecha, entrenamiento, ejercicio, serie, peso en kg, repeticiones, hecha), compartible con el botón "Compartir series (CSV)".

Guardalos en **Archivos** (iCloud Drive o "En mi iPhone") o mandalos por AirDrop a la Mac. La restauración desde un respaldo no está incluida en esta versión.

Desinstalar la app borra la base de datos: exportá antes.

## Borrado total

**Ajustes → Borrar todos los datos** (doble confirmación) elimina entrenamientos, registros, rutinas, recordatorios y ajustes, cancela las notificaciones y deja solo los ejercicios y plantillas de ejemplo.

## Tests

```bash
npm test            # unitarios (src/core, src/db, servicios) + recorrido de punta a punta (e2e/)
npm run typecheck   # TypeScript
```

Los tests usan una base SQLite en memoria (`better-sqlite3`) con la misma interfaz que `expo-sqlite`.

## Fuera de alcance (a propósito)

Cuentas, pagos, telemetría, analítica, servidor propio, diagnóstico o tratamiento médico, metas de peso, calorías, rachas, rankings, coaching humano o de ejercicio extremo, wearables y redes sociales.
