const { createExecution, createId, getOverviewData, readStore, writeStore } = require("../../lib/store");

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body, null, 2)
  };
}

function parseBody(event) {
  try {
    return JSON.parse(event.body || "{}");
  } catch (error) {
    return null;
  }
}

exports.handler = async (event) => {
  const store = readStore();
  const path = event.path.replace(/^\/\.netlify\/functions\/api/, "");
  const method = event.httpMethod;

  if (method === "GET" && path === "/overview") {
    return json(200, getOverviewData(store));
  }

  if (method === "GET" && path === "/automations") {
    return json(200, store.automations);
  }

  if (method === "POST" && path === "/automations") {
    const payload = parseBody(event);

    if (!payload || !payload.name || !payload.department || !payload.trigger) {
      return json(400, { ok: false, message: "Faltan campos obligatorios." });
    }

    const automation = {
      id: createId("aut"),
      name: payload.name,
      department: payload.department,
      status: payload.status || "Activa",
      trigger: payload.trigger,
      actions: String(payload.actions || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      runs: 0,
      successRate: 100,
      savedHours: 0
    };

    store.automations.unshift(automation);
    writeStore(store);
    return json(201, { ok: true, automation });
  }

  const runMatch = path.match(/^\/automations\/([^/]+)\/run$/);
  if (method === "POST" && runMatch) {
    const automation = store.automations.find((item) => item.id === runMatch[1]);

    if (!automation) {
      return json(404, { ok: false, message: "Automatizacion no encontrada." });
    }

    const execution = createExecution(store, automation);
    writeStore(store);
    return json(201, { ok: true, execution, automation });
  }

  const patchMatch = path.match(/^\/automations\/([^/]+)$/);
  if (method === "PATCH" && patchMatch) {
    const payload = parseBody(event);
    const automation = store.automations.find((item) => item.id === patchMatch[1]);

    if (!automation) {
      return json(404, { ok: false, message: "Automatizacion no encontrada." });
    }

    if (!payload || !payload.status) {
      return json(400, { ok: false, message: "Falta el nuevo estado." });
    }

    automation.status = payload.status;
    writeStore(store);
    return json(200, { ok: true, automation });
  }

  if (method === "GET" && path === "/templates") {
    return json(200, store.templates);
  }

  if (method === "GET" && path === "/executions") {
    return json(200, store.executions);
  }

  if (method === "GET" && path === "/demo-requests") {
    return json(200, store.demoRequests);
  }

  if (method === "GET" && path === "/plans") {
    return json(200, store.plans);
  }

  if (method === "POST" && path === "/demo-request") {
    const payload = parseBody(event);

    if (!payload || !payload.company || !payload.contact || !payload.useCase) {
      return json(400, { ok: false, message: "Completa todos los campos." });
    }

    const request = {
      id: createId("demo"),
      company: payload.company,
      contact: payload.contact,
      useCase: payload.useCase,
      createdAt: new Date().toISOString(),
      stage: "Nuevo lead"
    };

    store.demoRequests.unshift(request);
    writeStore(store);

    return json(201, {
      ok: true,
      message: `Demo registrada para ${payload.company}.`,
      request
    });
  }

  return json(404, { ok: false, message: "Ruta no encontrada." });
};
