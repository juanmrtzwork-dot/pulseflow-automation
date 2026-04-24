const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const {
  createExecution,
  createId,
  getOverviewData,
  readStore,
  writeStore
} = require("./lib/store");

const port = process.env.PORT || 3000;
const host = process.env.HOST || "127.0.0.1";
const publicDir = path.join(__dirname, "public");

let store = readStore();

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(data, null, 2));
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8"
  };

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream"
    });
    res.end(content);
  });
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.join(publicDir, pathname);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  sendFile(res, filePath);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/overview") {
    sendJson(res, 200, getOverviewData(store));
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/automations") {
    sendJson(res, 200, store.automations);
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/automations") {
    parseBody(req)
      .then((payload) => {
        if (!payload.name || !payload.department || !payload.trigger) {
          sendJson(res, 400, { ok: false, message: "Faltan campos obligatorios." });
          return;
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
        sendJson(res, 201, { ok: true, automation });
      })
      .catch(() => {
        sendJson(res, 400, { ok: false, message: "JSON invalido" });
      });
    return true;
  }

  const runMatch = url.pathname.match(/^\/api\/automations\/([^/]+)\/run$/);
  if (req.method === "POST" && runMatch) {
    const automation = store.automations.find((item) => item.id === runMatch[1]);

    if (!automation) {
      sendJson(res, 404, { ok: false, message: "Automatizacion no encontrada." });
      return true;
    }

    const execution = createExecution(store, automation);
    writeStore(store);
    sendJson(res, 201, { ok: true, execution, automation });
    return true;
  }

  const patchMatch = url.pathname.match(/^\/api\/automations\/([^/]+)$/);
  if (req.method === "PATCH" && patchMatch) {
    parseBody(req)
      .then((payload) => {
        const automation = store.automations.find((item) => item.id === patchMatch[1]);

        if (!automation) {
          sendJson(res, 404, { ok: false, message: "Automatizacion no encontrada." });
          return;
        }

        if (payload.status) {
          automation.status = payload.status;
        }

        writeStore(store);
        sendJson(res, 200, { ok: true, automation });
      })
      .catch(() => {
        sendJson(res, 400, { ok: false, message: "JSON invalido" });
      });
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/templates") {
    sendJson(res, 200, store.templates);
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/executions") {
    sendJson(res, 200, store.executions);
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/demo-requests") {
    sendJson(res, 200, store.demoRequests);
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/plans") {
    sendJson(res, 200, store.plans);
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/demo-request") {
    parseBody(req)
      .then((payload) => {
        if (!payload.company || !payload.contact || !payload.useCase) {
          sendJson(res, 400, { ok: false, message: "Completa todos los campos." });
          return;
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

        sendJson(res, 201, {
          ok: true,
          message: `Demo registrada para ${payload.company}.`,
          request
        });
      })
      .catch(() => {
        sendJson(res, 400, { ok: false, message: "JSON invalido" });
      });
    return true;
  }

  return false;
}

const server = http.createServer((req, res) => {
  store = readStore();
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (handleApi(req, res, url)) {
    return;
  }

  serveStatic(req, res);
});

server.listen(port, host, () => {
  console.log(`PulseFlow disponible en http://${host}:${port}`);
});
