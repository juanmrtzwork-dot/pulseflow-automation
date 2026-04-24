# PulseFlow

App funcional para vender automatizaciones a empresas. Incluye landing comercial, workspace con automatizaciones, ejecuciones, leads de demo y pricing sugerido.

## Lo que ya hace

- Crear automatizaciones desde la interfaz
- Ejecutarlas manualmente para simular corridas reales
- Guardar datos localmente en `data/store.json`
- Capturar solicitudes de demo
- Mostrar planes y posicionamiento comercial B2B
- Quedar lista para desplegar en Render o con Docker

## Ejecutar local

```bash
npm start
```

Abre:

```bash
http://127.0.0.1:3000
```

## Publicarla y obtener un enlace

### Opcion 1: Netlify

1. Sube esta carpeta a GitHub.
2. Entra en [Netlify](https://www.netlify.com/).
3. Pulsa `Add new site` > `Import an existing project`.
4. Conecta tu repositorio.
5. Netlify detectara [netlify.toml](/Users/juanmrtz/Documents/Codex/2026-04-24/crea-una-app-para-automatizaciones-para/netlify.toml) y publicara `public/` con funciones en `netlify/functions/`.
6. Obtendras un enlace como `https://tu-app.netlify.app`.

Archivos clave para Netlify:

- [netlify.toml](/Users/juanmrtz/Documents/Codex/2026-04-24/crea-una-app-para-automatizaciones-para/netlify.toml)
- [public/_redirects](/Users/juanmrtz/Documents/Codex/2026-04-24/crea-una-app-para-automatizaciones-para/public/_redirects)
- [netlify/functions/api.js](/Users/juanmrtz/Documents/Codex/2026-04-24/crea-una-app-para-automatizaciones-para/netlify/functions/api.js)

Importante:

- En Netlify esta version funciona bien como demo comercial.
- La persistencia de datos en funciones serverless no es garantizada a largo plazo porque no hay base de datos real.
- Para vender a clientes reales, el siguiente paso es conectar Supabase, PostgreSQL o Firebase.

### Opcion 2: Render

Si prefieres un backend Node tradicional con persistencia local del archivo durante la instancia, tambien puedes desplegarlo en Render con [render.yaml](/Users/juanmrtz/Documents/Codex/2026-04-24/crea-una-app-para-automatizaciones-para/render.yaml).

## Como venderlo a empresas

- Entra por un caso concreto: leads, cobranzas, onboarding, aprobaciones o seguimiento comercial.
- Cobra `setup + mensualidad`. Ejemplo: setup de USD 2,000 a 8,000 y fee mensual de USD 900 a 6,000.
- Ofrece un piloto de 2 a 4 semanas con 1 proceso y una metrica de ROI.
- Vende ahorro de tiempo, menos errores y velocidad operativa, no “automatizacion” como concepto abstracto.
- Usa esta misma app como demo comercial, luego personalizala por cliente.

## Siguiente evolucion recomendada

- Autenticacion y multiempresa
- Base de datos real
- Integraciones reales con Gmail, Slack, HubSpot y Stripe
- Constructor visual de flujos
- Panel admin y permisos por usuario
