# Strong personal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App iOS personal (Expo) para registrar entrenamientos desde plantillas, rutinas moderadas, registros diarios opcionales y tendencias semanales neutras, todo local.

**Architecture:** `src/core` es TypeScript puro (sin RN) y concentra la lógica testeable. `src/db` habla con SQLite a través de una interfaz `Db` que imita la API async de `expo-sqlite`; en tests se implementa sobre `better-sqlite3`. Pantallas en `app/` (expo-router) son finas: llaman a componentes de `src/features/*`, que reciben `db` por contexto.

**Tech Stack:** Expo SDK 58, React Native, TypeScript, expo-router, expo-sqlite, expo-notifications, expo-file-system, expo-sharing, @kingstinct/react-native-healthkit (opcional), Jest (jest-expo), @testing-library/react-native, better-sqlite3 (solo dev).

**Spec:** `docs/superpowers/specs/2026-11-20-strong-personal-design.md`

## Global Constraints

- UI en español; lenguaje neutro: prohibidas palabras "fallaste", "mal", "deberías", "racha", "récord", "meta de peso", "calorías".
- Sin cuentas, red, telemetría ni analítica. Ninguna dependencia de analytics/crash reporting.
- Unidades canónicas guardadas: kg, km, minutos. Defaults: kg, km. Ánimo y energía: enteros 1–5.
- Semana empieza el lunes, fechas en hora local con formato `YYYY-MM-DD`.
- `.env` gitignored; `.env.example` con `EXPO_PUBLIC_HEALTHKIT_ENABLED=false`.
- Aviso exacto: "Esta app no es atención médica ni reemplaza el consejo de un profesional de la salud."
- Todo funciona sin permisos de Salud ni de notificaciones.
- Un solo comando de arranque: `npm start` (tras `npm install`).

## Review Focus

- Decimales con coma ("62,5") en peso/distancia → se aceptan como 62.5 (usuario en Argentina). Test en Task 2.
- App cerrada a mitad de entrenamiento → al reabrir, el entrenamiento en curso se retoma (estado en SQLite, no en memoria). Test en Task 4.
- Borrar una plantilla o ejercicio usado en el pasado → el historial sigue mostrando el nombre (se guarda `exercise_name` en `workout_sets`). Test en Task 4.
- Fechas de domingo a la noche → caen en la semana que empezó el lunes previo, no en la siguiente. Test en Task 3.
- Exportar sin datos o sin hoja de compartir disponible → exporta archivo vacío válido / muestra error recuperable, no crashea. Test en Task 3 y manejo en Task 8.

---

### Task 1: Scaffold Expo + Jest

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `jest.config.js`, `.gitignore`, `.env.example`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `src/core/smoke.test.ts`

- [ ] **Step 1:** `npx create-expo-app@latest . --template blank-typescript` (repo tiene `README.md` y `docs/`; si se queja, crear en carpeta temporal y mover). Instalar: `npx expo install expo-router expo-sqlite expo-notifications expo-file-system expo-sharing expo-constants react-native-safe-area-context react-native-screens expo-linking expo-status-bar` y dev: `npm i -D jest-expo jest @types/jest @testing-library/react-native better-sqlite3 @types/better-sqlite3`.
- [ ] **Step 2:** `package.json` → `"main": "expo-router/entry"`, scripts `start: expo start`, `ios: expo run:ios`, `device: expo run:ios --device`, `test: jest`, `typecheck: tsc --noEmit`. `app.json`: name "Strong personal", slug `strong-personal`, `scheme: strongpersonal`, `ios.bundleIdentifier: com.matiasferraro.strongpersonal`, plugins `expo-router`, `expo-sqlite`. Jest preset `jest-expo/ios`.
- [ ] **Step 3:** `.gitignore` incluye `.env`, `node_modules`, `ios/`, `android/`, `.expo/`. `.env.example`: `EXPO_PUBLIC_HEALTHKIT_ENABLED=false`.
- [ ] **Step 4:** Tabs vacías: Entrenar, Historial, Rutinas, Registros, Tendencias; botón engranaje → `/settings`. Smoke test `expect(1+1).toBe(2)`.
- [ ] **Step 5:** `npm test` PASS y `npm run typecheck` sin errores.
- [ ] **Step 6:** Commit `chore: scaffold Expo app with router and jest`.

### Task 2: Core — unidades, validación, nombres de archivo

**Files:** Create `src/core/units.ts`, `src/core/validation.ts`, `src/core/filename.ts`, tests `src/core/__tests__/{units,validation,filename}.test.ts`

**Interfaces — Produces:**
- `type WeightUnit = 'kg'|'lb'; type DistanceUnit = 'km'|'mi'`
- `toKg(v: number, u: WeightUnit): number`, `fromKg(kg: number, u: WeightUnit): number` (1 lb = 0.45359237 kg, redondeo a 2 decimales al mostrar con `formatWeight(kg, u): string`)
- `toKm / fromKm` (1 mi = 1.609344 km)
- `type Result<T> = { ok: true; value: T } | { ok: false; error: string }`
- `parseDecimal(input: string): number | null` (acepta coma o punto, trim; rechaza vacío, NaN, notación con letras)
- `validateSetInput({ weight: string; reps: string }): Result<{ weight: number; reps: number }>` — peso 0–1000, reps entero 1–200
- `validateScale(n: number): Result<number>` — entero 1–5
- `validateName(s: string): Result<string>` — trim, 1–60 chars
- `safeFilename(base: string, ext: string): string` — minúsculas, `[^a-z0-9-_]`→`-`, colapsa guiones, máx 64 chars, fallback `export`

- [ ] **Step 1: Tests**
```ts
expect(parseDecimal('62,5')).toBe(62.5);
expect(parseDecimal(' 80 ')).toBe(80);
expect(parseDecimal('')).toBeNull(); expect(parseDecimal('1e3')).toBeNull();
expect(validateSetInput({ weight: '62,5', reps: '8' })).toEqual({ ok: true, value: { weight: 62.5, reps: 8 } });
expect(validateSetInput({ weight: '50', reps: '0' }).ok).toBe(false);
expect(validateSetInput({ weight: '50', reps: '7.5' }).ok).toBe(false);
expect(validateScale(6).ok).toBe(false);
expect(fromKg(toKg(100, 'lb'), 'lb')).toBeCloseTo(100);
expect(formatWeight(100, 'lb')).toBe('220.46 lb');
expect(safeFilename('../Mi Export/2026', 'json')).toBe('mi-export-2026.json');
expect(safeFilename('', 'csv')).toBe('export.csv');
```
- [ ] **Step 2:** `npm test -- src/core` → FAIL (módulos no existen).
- [ ] **Step 3:** Implementar las firmas de arriba.
- [ ] **Step 4:** `npm test -- src/core` → PASS.
- [ ] **Step 5:** Commit `feat(core): units, validation and safe filenames`.

### Task 3: Core — resumen semanal y exportación

**Files:** Create `src/core/types.ts`, `src/core/dates.ts`, `src/core/weekly.ts`, `src/core/exporter.ts`, tests `src/core/__tests__/{weekly,exporter}.test.ts`

**Interfaces — Produces:**
- `types.ts`: `Workout { id: number; templateId: number|null; name: string; startedAt: string /*ISO*/; endedAt: string|null; note: string|null }`, `WorkoutSet { id: number; workoutId: number; exerciseId: number|null; exerciseName: string; position: number; weightKg: number; reps: number; done: boolean }`, `DailyLog { id: number; date: string; kind: 'activity'|'sleep'|'mood'|'energy'|'note'; value: number|null; unit: string|null; note: string|null }`
- `dates.ts`: `localDate(d: Date): string`, `weekStart(date: string): string` (lunes)
- `weekly.ts`: `WeeklySummary { weekStart: string; activeDays: number; workouts: number; volumeKg: number; minutes: number; avgSleepMin: number|null; avgMood: number|null; avgEnergy: number|null }`; `weeklySummaries(workouts: Workout[], sets: WorkoutSet[], logs: DailyLog[], weeks: number, today: string): WeeklySummary[]` — de más vieja a más nueva, incluye semanas sin datos con ceros/null. Volumen = Σ weightKg·reps de sets `done`. Minutos = endedAt−startedAt de entrenamientos terminados + logs `activity` (value en minutos). activeDays = días distintos con entrenamiento terminado o log `activity`.
- `exporter.ts`: `ExportBundle { app: 'strong-personal'; version: 1; exportedAt: string; data: Record<string, unknown[]> }`; `buildJsonExport(data, now: Date): string`; `buildSetsCsv(workouts: Workout[], sets: WorkoutSet[]): string` — encabezado `date,workout,exercise,set,weight_kg,reps,done`, escapa comas/comillas con comillas dobles.

- [ ] **Step 1: Tests**
```ts
expect(weekStart('2026-11-22')).toBe('2026-11-16'); // domingo → lunes previo
expect(weekStart('2026-11-16')).toBe('2026-11-16');
const s = weeklySummaries([w1 /*2026-11-17, 45 min*/], [{...set, weightKg: 50, reps: 10, done: true}, {...set, weightKg: 50, reps: 10, done: false}], [{ kind: 'mood', value: 4, date: '2026-11-18' } as DailyLog], 2, '2026-11-20');
expect(s).toHaveLength(2);
expect(s[0]).toMatchObject({ weekStart: '2026-11-09', workouts: 0, volumeKg: 0, avgMood: null });
expect(s[1]).toMatchObject({ weekStart: '2026-11-16', workouts: 1, activeDays: 1, volumeKg: 500, minutes: 45, avgMood: 4 });
expect(buildSetsCsv([], [])).toBe('date,workout,exercise,set,weight_kg,reps,done\n');
expect(buildSetsCsv([w], [{ ...set, exerciseName: 'Press, banca "plano"' }])).toContain('"Press, banca ""plano"""');
expect(JSON.parse(buildJsonExport({ workouts: [] }, new Date('2026-11-20T10:00:00Z')))).toMatchObject({ app: 'strong-personal', version: 1 });
```
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementar. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(core): weekly summaries and export builders`.

### Task 4: DB — esquema, migraciones, repositorios

**Files:** Create `src/db/types.ts`, `src/db/migrations.ts`, `src/db/seed.ts`, `src/db/repos/{exercises,templates,workouts,routines,logs,settings,reminders}.ts`, `src/db/testDb.ts` (adaptador better-sqlite3, solo tests), `src/db/__tests__/repos.test.ts`

**Interfaces — Produces:**
- `interface Db { execAsync(sql: string): Promise<void>; runAsync(sql: string, ...params: unknown[]): Promise<{ lastInsertRowId: number; changes: number }>; getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]>; getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T|null>; withTransactionAsync(fn: () => Promise<void>): Promise<void> }` — subconjunto compatible con `SQLiteDatabase` de expo-sqlite.
- `migrate(db: Db): Promise<void>` — usa `PRAGMA user_version`; v1 crea tablas del spec, `PRAGMA foreign_keys = ON`. `workout_sets.exercise_name TEXT NOT NULL`, `exercise_id` con `ON DELETE SET NULL`. `workouts.ended_at NULL` = en curso. `routine_days(routine_id, weekday 1..7, template_id NULL = descanso)`.
- `seedIfEmpty(db): Promise<void>` — ~20 ejercicios (Sentadilla, Press banca, Peso muerto, Press militar, Remo con barra, Dominadas, Fondos, Zancadas, Hip thrust, Curl bíceps, Extensión tríceps, Elevaciones laterales, Prensa, Curl femoral, Remo con mancuerna, Plancha, Face pull, Jalón al pecho, Gemelos, Caminata) y plantillas "Cuerpo completo A" / "Cuerpo completo B" (3 series × 8 reps).
- `createTestDb(): Promise<Db>` — `:memory:` + `migrate` + `seedIfEmpty`.
- Repos (todas toman `db: Db` primero): `listExercises`, `createExercise(db, name)`, `deleteExercise`; `listTemplates(db): Promise<TemplateWithExercises[]>`, `createTemplate(db, name, items: { exerciseId: number; sets: number; reps: number }[])`, `deleteTemplate`; `startWorkout(db, templateId: number|null): Promise<number>` (copia sets de la plantilla con peso 0 y `done=false`; si hay uno en curso, lo devuelve), `getActiveWorkout(db): Promise<{ workout: Workout; sets: WorkoutSet[] }|null>`, `updateSet(db, setId, { weightKg?, reps?, done? })`, `addSet(db, workoutId, exerciseId)`, `finishWorkout(db, id, note?)`, `discardWorkout(db, id)`, `listWorkouts(db, { limit }): Promise<Workout[]>`, `getWorkoutSets(db, id)`, `getAllForExport(db): Promise<Record<string, unknown[]>>`, `deleteAllData(db)`; `getRoutine`/`saveRoutine(db, days: { weekday: number; templateId: number|null }[])`; `addLog(db, log: Omit<DailyLog,'id'>)`, `listLogs(db, fromDate, toDate)`, `deleteLog`; `getSettings(db): Promise<Settings>` / `setSetting(db, key, value)` con `Settings { weightUnit: WeightUnit; distanceUnit: DistanceUnit; remindersMuted: boolean; healthWorkouts: boolean; healthSleep: boolean; healthSteps: boolean }`; `listReminders`, `upsertReminder(db, { id?, weekday, hour, minute, enabled, notificationId })`, `deleteReminder`.

- [ ] **Step 1: Tests**
```ts
const db = await createTestDb();
const [t] = await listTemplates(db);
const id = await startWorkout(db, t.id);
expect(await startWorkout(db, t.id)).toBe(id);           // reanuda, no duplica
const active = await getActiveWorkout(db);                // simula reapertura
expect(active!.sets.length).toBe(t.items.reduce((n, i) => n + i.sets, 0));
await updateSet(db, active!.sets[0].id, { weightKg: 60, reps: 8, done: true });
await finishWorkout(db, id);
expect(await getActiveWorkout(db)).toBeNull();
await deleteExercise(db, active!.sets[0].exerciseId!);
expect((await getWorkoutSets(db, id))[0].exerciseName).toBe(active!.sets[0].exerciseName);
await deleteAllData(db);
expect(await listWorkouts(db, { limit: 10 })).toEqual([]);
expect(await getSettings(db)).toMatchObject({ weightUnit: 'kg', remindersMuted: false });
```
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementar. `deleteAllData` borra todas las tablas de usuario y vuelve a sembrar ejercicios/plantillas por defecto. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(db): schema, migrations and repositories`.

### Task 5: Shell de la app y componentes de estado

**Files:** Create `src/db/DbProvider.tsx`, `src/ui/{EmptyState,Loading,ErrorRetry,Toast,Button,theme}.tsx`, `src/ui/useAsync.ts`; Modify `app/_layout.tsx`

**Interfaces — Produces:**
- `DbProvider({ children, db? })` — sin `db`, abre `openDatabaseAsync('strong.db')`, corre `migrate` + `seedIfEmpty`; muestra `Loading` mientras tanto y `ErrorRetry` si falla. `useDb(): Db`.
- `useAsync<T>(fn: () => Promise<T>, deps): { data: T|undefined; loading: boolean; error: Error|null; reload(): void }`
- `EmptyState({ title, message, action? })`, `Loading({ label? })`, `ErrorRetry({ message, onRetry })`, `useToast(): (msg: string) => void` (éxito, 2 s).
- `theme`: paleta neutra (sin rojo/verde semánticos para resultados).

- [ ] **Step 1:** Test RNTL: `ErrorRetry` llama `onRetry` al tocar "Reintentar"; `DbProvider` con `db` inyectado renderiza hijos.
- [ ] **Step 2:** FAIL → **Step 3:** implementar y envolver `app/_layout.tsx` en `DbProvider` + `ToastProvider` → **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(ui): app shell, db provider and state components`.

### Task 6: Entrenar — plantillas, entrenamiento en curso, descanso

**Files:** Create `src/features/train/{TrainScreen,TemplateEditor,ActiveWorkout,RestTimer}.tsx`, `src/core/restTimer.ts`, test `src/core/__tests__/restTimer.test.ts`; Modify `app/(tabs)/index.tsx`, create `app/template/new.tsx`

**Interfaces:**
- Consumes: repos de Task 4, `validateSetInput`/`formatWeight`/`toKg` de Task 2, `useDb`, `useAsync`, estados de Task 5.
- Produces: `TrainScreen()` (default export de `app/(tabs)/index.tsx`); `remainingSeconds(endsAt: number, now: number): number` (≥0, entero redondeado hacia arriba). Descanso por defecto 90 s, opciones 60/90/120/180; el fin del descanso se calcula desde un timestamp (sobrevive a segundo plano) y programa una notificación local solo si no están silenciadas. testIDs: `start-template-<id>`, `set-weight-<setId>`, `set-reps-<setId>`, `set-done-<setId>`, `finish-workout`.

- [ ] **Step 1:** Test `remainingSeconds(10_500, 1_000) === 10`, `remainingSeconds(0, 5_000) === 0`.
- [ ] **Step 2:** FAIL → **Step 3:** implementar UI: sin entrenamiento en curso → lista de plantillas (vacío: "Todavía no hay plantillas" + "Crear plantilla") y "Entrenamiento libre"; en curso → ejercicios con filas de series, marcar serie inicia descanso, error de validación en línea, "Terminar" con toast "Entrenamiento guardado". → **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(train): templates, active workout and rest timer`.

### Task 7: Historial y Rutinas

**Files:** Create `src/features/history/{HistoryScreen,WorkoutDetail}.tsx`, `src/features/routines/RoutineScreen.tsx`; Modify `app/(tabs)/history.tsx`, `app/(tabs)/routines.tsx`, create `app/workout/[id].tsx`

**Interfaces:** Consumes repos Task 4. Produces `HistoryScreen()` con filas testID `workout-row-<id>` mostrando nombre, fecha, duración, volumen en unidad elegida; vacío "Tus entrenamientos aparecen acá". `RoutineScreen()`: 7 días (lun–dom), cada uno con selector plantilla/"Descanso"; aviso suave si hay más de 6 días de entrenamiento: "Los días de descanso también son parte del plan." (no bloquea). Guardar → toast.

- [ ] **Step 1:** Test RNTL con `createTestDb`: tras `startWorkout`+`finishWorkout`, `HistoryScreen` muestra `workout-row-<id>`; con base vacía muestra el texto de vacío.
- [ ] **Step 2:** FAIL → **Step 3:** implementar → **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: history and weekly routine`.

### Task 8: Registros diarios, Tendencias y Ajustes

**Files:** Create `src/features/logs/LogsScreen.tsx`, `src/features/trends/TrendsScreen.tsx`, `src/features/settings/SettingsScreen.tsx`, `src/services/exportService.ts`, `src/notifications/reminders.ts`, `src/health/healthkit.ts`, `src/health/__tests__/healthkit.test.ts`; Modify `app/(tabs)/logs.tsx`, `app/(tabs)/trends.tsx`, create `app/settings.tsx`; `app.json` plugin healthkit condicionado

**Interfaces:**
- `exportData(db: Db, now?: Date): Promise<{ files: string[] }>` — escribe JSON y CSV con `safeFilename('strong-export-YYYY-MM-DD', …)` en `FileSystem.cacheDirectory`, luego `Sharing.isAvailableAsync()`; si no disponible lanza `Error('Compartir no está disponible en este dispositivo')` que la UI muestra con `ErrorRetry`.
- `reminders.ts`: `scheduleReminder(r): Promise<string|null>`, `cancelAll(): Promise<void>`, `applyMute(muted: boolean, reminders)`. Si el permiso se niega devuelve `null` y la UI dice "Las notificaciones están desactivadas en Ajustes de iOS; los recordatorios no sonarán." Texto de recordatorio neutro: "¿Te queda bien moverte un rato hoy?".
- `healthkit.ts`: `isHealthEnabled(): boolean` (env flag + `Platform.OS==='ios'`), `isHealthAvailable(): Promise<boolean>` (import dinámico en try/catch → false si falla), `requestPermission(kind: 'workouts'|'sleep'|'steps'): Promise<boolean>`, `writeWorkout(w: Workout): Promise<void>` (no-op si deshabilitado), `readSleepMinutes(date: string): Promise<number|null>`. Nunca lanza hacia la UI.
- `LogsScreen`: elegir fecha (hoy por defecto), cargar actividad (minutos o km), sueño (horas+min → minutos), ánimo 1–5, energía 1–5, nota; lista del día con borrar. Vacío: "Nada registrado hoy. Todo es opcional."
- `TrendsScreen`: últimas 8 semanas de `weeklySummaries`; barras de días activos; textos tipo "Esta semana: 3 días activos, 2 entrenamientos." Vacío cuando todo es cero: "Cuando registres algo, vas a ver tus patrones semanales acá."
- `SettingsScreen`: unidades (kg/lb, km/mi), recordatorios (lista, agregar día/hora, silenciar todo), Salud (secciones solo si `isHealthEnabled()`; cada tipo con su interruptor; si no disponible: "No disponible en este dispositivo"), "Exportar datos", "Borrar todos los datos" (Alert de doble confirmación → `deleteAllData` + `cancelAll`), aviso médico exacto de Global Constraints, "Sin cuentas. Tus datos quedan en este iPhone."
- `app.json`: agregar plugin `@kingstinct/react-native-healthkit` con textos `NSHealthShareUsageDescription`/`NSHealthUpdateUsageDescription` en español; dependencia instalada siempre (es inerte en Expo Go porque el import dinámico falla y `isHealthAvailable` devuelve false).

- [ ] **Step 1:** Tests: con `jest.mock('@kingstinct/react-native-healthkit', () => { throw new Error('no native') })`, `await isHealthAvailable()` → `false` y `await writeWorkout(w)` resuelve sin lanzar.
- [ ] **Step 2:** FAIL → **Step 3:** implementar todo lo anterior → **Step 4:** `npm test` y `npm run typecheck` PASS.
- [ ] **Step 5:** Commit `feat: daily logs, trends, settings, export, reminders and optional HealthKit`.

### Task 9: Recorrido de punta a punta

**Files:** Create `e2e/happyPath.test.tsx`

**Interfaces:** Consumes `TrainScreen`, `HistoryScreen`, `createTestDb`, `DbProvider({ db })`, `getAllForExport`, `buildJsonExport`, testIDs de Task 6/7. Mockear `expo-router` (`useRouter`, `Link`) y `expo-notifications` mínimamente.

- [ ] **Step 1: Test**
```ts
const db = await createTestDb();
render(<DbProvider db={db}><TrainScreen /></DbProvider>);
const [t] = await listTemplates(db);
fireEvent.press(await screen.findByTestId(`start-template-${t.id}`));
const { sets } = (await waitFor(() => getActiveWorkout(db).then(a => a!)));
fireEvent.changeText(await screen.findByTestId(`set-weight-${sets[0].id}`), '62,5');
fireEvent.changeText(screen.getByTestId(`set-reps-${sets[0].id}`), '8');
fireEvent.press(screen.getByTestId(`set-done-${sets[0].id}`));
fireEvent.press(screen.getByTestId('finish-workout'));
await screen.findByText('Entrenamiento guardado');
render(<DbProvider db={db}><HistoryScreen /></DbProvider>);
expect(await screen.findByText(t.name)).toBeTruthy();
const json = JSON.parse(buildJsonExport(await getAllForExport(db), new Date()));
expect(json.data.workout_sets).toEqual(expect.arrayContaining([expect.objectContaining({ weight_kg: 62.5, reps: 8, done: 1 })]));
```
- [ ] **Step 2:** Run `npm test -- e2e` → corregir hasta PASS.
- [ ] **Step 3:** Commit `test: end-to-end happy path`.

### Task 10: README y verificación final

**Files:** Modify `README.md`

- [ ] **Step 1:** README en español con: qué es y qué no es (aviso médico), requisitos (Node 20+, Xcode para instalar en iPhone), arranque `npm install && npm start` + Expo Go, instalación en iPhone (camino A): abrir Xcode una vez y loguear Apple ID en Settings → Accounts, conectar iPhone, activar Modo desarrollador (Ajustes → Privacidad y seguridad), `npm run device`, confiar en el desarrollador (Ajustes → General → VPN y gestión de dispositivos), renovación cada 7 días con el mismo comando; arquitectura (carpetas); permisos (notificaciones, Salud por tipo, todo opcional; Salud solo con `EXPO_PUBLIC_HEALTHKIT_ENABLED=true` en `.env` y build nativo); ubicación de datos (`strong.db` en el sandbox de la app, `Documents/SQLite`); respaldo (Ajustes → Exportar → Archivos/AirDrop; restaurar no está incluido en v1); borrado total; tests.
- [ ] **Step 2:** `npm test` y `npm run typecheck` → todo PASS; `npx expo-doctor` sin errores bloqueantes.
- [ ] **Step 3:** Commit `docs: README with setup, architecture, permissions and backup`.
