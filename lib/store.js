const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const persistentStoreFile = path.join(dataDir, "store.json");
const tempStoreFile = path.join("/tmp", "pulseflow-store.json");

const defaultStore = {
  automations: [
    {
      id: "aut-001",
      name: "Lead inbound > CRM > Slack",
      department: "Ventas",
      status: "Activa",
      trigger: "Formulario web recibido",
      actions: ["Crear lead", "Asignar ejecutivo", "Notificar a Slack"],
      runs: 1842,
      successRate: 98.6,
      savedHours: 74
    },
    {
      id: "aut-002",
      name: "Facturas vencidas > Recordatorio",
      department: "Finanzas",
      status: "Activa",
      trigger: "Factura vence en 3 dias",
      actions: ["Enviar email", "Crear tarea", "Escalar si no responde"],
      runs: 623,
      successRate: 96.9,
      savedHours: 29
    },
    {
      id: "aut-003",
      name: "Onboarding de clientes enterprise",
      department: "Customer Success",
      status: "En revision",
      trigger: "Deal ganado",
      actions: ["Crear workspace", "Enviar checklist", "Agendar kickoff"],
      runs: 89,
      successRate: 93.2,
      savedHours: 17
    }
  ],
  templates: [
    {
      id: "tpl-001",
      title: "Ventas y CRM",
      description: "Captura leads, puntua oportunidades y asigna vendedores automaticamente.",
      integrations: ["HubSpot", "Salesforce", "Slack"]
    },
    {
      id: "tpl-002",
      title: "Cobranza automatizada",
      description: "Detecta facturas por vencer y ejecuta recordatorios y escalaciones.",
      integrations: ["Stripe", "Xero", "Gmail"]
    },
    {
      id: "tpl-003",
      title: "RRHH y onboarding",
      description: "Coordina altas de personal, accesos y aprobaciones internas.",
      integrations: ["Google Workspace", "Notion", "Teams"]
    }
  ],
  executions: [
    {
      id: "run-1842",
      automationId: "aut-001",
      automation: "Lead inbound > CRM > Slack",
      status: "Completada",
      startedAt: "2026-04-24 09:20",
      duration: "02.4s"
    },
    {
      id: "run-1841",
      automationId: "aut-002",
      automation: "Facturas vencidas > Recordatorio",
      status: "Completada",
      startedAt: "2026-04-24 08:55",
      duration: "01.1s"
    },
    {
      id: "run-1840",
      automationId: "aut-003",
      automation: "Onboarding de clientes enterprise",
      status: "Requiere atencion",
      startedAt: "2026-04-24 08:41",
      duration: "06.8s"
    }
  ],
  demoRequests: [
    {
      id: "demo-001",
      company: "Nova Logistics",
      contact: "Laura Perez, COO",
      useCase: "Finanzas y cobranzas",
      createdAt: "2026-04-24T01:30:00.000Z",
      stage: "Demo agendada"
    }
  ],
  plans: [
    {
      id: "plan-starter",
      name: "Starter",
      price: "USD 900/mes",
      description: "Ideal para validar 1 proceso y cerrar el primer cliente.",
      includes: ["2 automatizaciones", "1 integracion principal", "Soporte email"]
    },
    {
      id: "plan-growth",
      name: "Growth",
      price: "USD 2,500/mes",
      description: "Para pymes y equipos comerciales con varios procesos.",
      includes: ["10 automatizaciones", "5 integraciones", "Reportes y auditoria"]
    },
    {
      id: "plan-enterprise",
      name: "Enterprise",
      price: "Desde USD 6,000/mes",
      description: "Implementacion por area con onboarding, seguridad y SLA.",
      includes: ["Workflows ilimitados", "SSO y aprobaciones", "Soporte prioritario"]
    }
  ]
};

function getStoreFile() {
  return process.env.NETLIFY ? tempStoreFile : persistentStoreFile;
}

function ensureStoreFile() {
  const storeFile = getStoreFile();

  if (!process.env.NETLIFY && !fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(storeFile)) {
    fs.writeFileSync(storeFile, JSON.stringify(defaultStore, null, 2));
  }

  return storeFile;
}

function readStore() {
  const storeFile = ensureStoreFile();
  return JSON.parse(fs.readFileSync(storeFile, "utf8"));
}

function writeStore(store) {
  const storeFile = ensureStoreFile();
  fs.writeFileSync(storeFile, JSON.stringify(store, null, 2));
}

function createId(prefix) {
  return `${prefix}-${Date.now()}`;
}

function getOverviewData(store) {
  const totalRuns = store.automations.reduce((sum, item) => sum + item.runs, 0);
  const totalSavedHours = store.automations.reduce((sum, item) => sum + item.savedHours, 0);
  const averageSuccessRate = store.automations.length
    ? store.automations.reduce((sum, item) => sum + item.successRate, 0) / store.automations.length
    : 0;

  return {
    company: "PulseFlow",
    segment: "B2B Automation OS",
    metrics: {
      automations: store.automations.length,
      runs: totalRuns,
      savedHours: totalSavedHours,
      successRate: Number(averageSuccessRate.toFixed(1)),
      pipeline: store.demoRequests.length
    }
  };
}

function nowLabel() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function createExecution(store, automation) {
  const wasSuccessful = Math.random() > 0.14;
  const durationValue = (Math.random() * 5 + 1).toFixed(1);

  const execution = {
    id: createId("run"),
    automationId: automation.id,
    automation: automation.name,
    status: wasSuccessful ? "Completada" : "Requiere atencion",
    startedAt: nowLabel(),
    duration: `0${durationValue}s`
  };

  automation.runs += 1;
  automation.savedHours += wasSuccessful ? 1 : 0;
  automation.successRate = Number(
    Math.max(80, Math.min(99.9, automation.successRate + (wasSuccessful ? 0.1 : -0.4))).toFixed(1)
  );

  store.executions.unshift(execution);
  store.executions = store.executions.slice(0, 12);

  return execution;
}

module.exports = {
  createExecution,
  createId,
  defaultStore,
  getOverviewData,
  readStore,
  writeStore
};
