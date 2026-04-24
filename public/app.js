const state = {
  automations: [],
  templates: [],
  executions: [],
  demoRequests: [],
  plans: [],
  overview: null
};

async function fetchJson(url, options) {
  const response = await fetch(url, options);

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;

    try {
      const data = await response.json();
      message = data.message || message;
    } catch (error) {
      // Ignored because some responses may not include JSON.
    }

    throw new Error(message);
  }

  return response.json();
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-ES").format(value);
}

function renderOverview(data) {
  state.overview = data;
  document.getElementById("metric-automations").textContent = formatNumber(data.metrics.automations);
  document.getElementById("metric-runs").textContent = formatNumber(data.metrics.runs);
  document.getElementById("metric-hours").textContent = `${formatNumber(data.metrics.savedHours)}h`;
  document.getElementById("metric-success").textContent = `${data.metrics.successRate}%`;
  document.getElementById("metric-pipeline").textContent = formatNumber(data.metrics.pipeline);
  document.getElementById("metric-hours-preview").textContent = `${formatNumber(data.metrics.savedHours)}h`;
}

function statusClass(status) {
  return status === "Activa" || status === "Completada" || status === "Demo agendada"
    ? "status-ok"
    : "status-warn";
}

function renderAutomations(items) {
  const container = document.getElementById("automations-list");
  state.automations = items;

  container.innerHTML = items
    .map(
      (item) => `
        <article class="stack-item">
          <div class="stack-head">
            <div>
              <h4>${item.name}</h4>
              <p>${item.trigger}</p>
            </div>
            <div class="stack-actions">
              <button class="btn btn-small btn-secondary run-button" data-id="${item.id}">Ejecutar</button>
              <button
                class="btn btn-small btn-secondary status-button"
                data-id="${item.id}"
                data-next="${item.status === "Activa" ? "Pausada" : "Activa"}"
              >
                ${item.status === "Activa" ? "Pausar" : "Activar"}
              </button>
            </div>
          </div>
          <div class="stack-meta">
            <span>${item.department}</span>
            <span class="${statusClass(item.status)}">${item.status}</span>
            <span>${item.runs} runs</span>
            <span>${item.successRate}% exito</span>
            <span>${item.savedHours}h ahorradas</span>
          </div>
          <div class="pill-row">
            ${item.actions.map((action) => `<span class="mini-pill">${action}</span>`).join("")}
          </div>
        </article>
      `
    )
    .join("");
}

function renderTemplates(items) {
  const container = document.getElementById("templates-list");
  state.templates = items;

  container.innerHTML = items
    .map(
      (item) => `
        <article class="stack-item">
          <h4>${item.title}</h4>
          <p>${item.description}</p>
          <div class="stack-meta">
            ${item.integrations.map((integration) => `<span>${integration}</span>`).join("")}
          </div>
        </article>
      `
    )
    .join("");
}

function renderExecutions(items) {
  const container = document.getElementById("executions-list");
  state.executions = items;

  container.innerHTML = items
    .map(
      (item) => `
        <article class="stack-item">
          <h4>${item.automation}</h4>
          <p>${item.startedAt}</p>
          <div class="stack-meta">
            <span class="${statusClass(item.status)}">${item.status}</span>
            <span>${item.duration}</span>
            <span>${item.id}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderDemoRequests(items) {
  const container = document.getElementById("demo-requests-list");
  state.demoRequests = items;

  container.innerHTML = items
    .map(
      (item) => `
        <article class="stack-item">
          <h4>${item.company}</h4>
          <p>${item.contact}</p>
          <div class="stack-meta">
            <span>${item.useCase}</span>
            <span class="${statusClass(item.stage)}">${item.stage}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderPlans(items) {
  const container = document.getElementById("plans-list");
  state.plans = items;

  container.innerHTML = items
    .map(
      (item) => `
        <article class="plan-card">
          <p class="plan-name">${item.name}</p>
          <h3>${item.price}</h3>
          <p>${item.description}</p>
          <div class="pill-row">
            ${item.includes.map((value) => `<span class="mini-pill">${value}</span>`).join("")}
          </div>
        </article>
      `
    )
    .join("");
}

async function refreshData() {
  const [overview, automations, templates, executions, demoRequests, plans] = await Promise.all([
    fetchJson("/api/overview"),
    fetchJson("/api/automations"),
    fetchJson("/api/templates"),
    fetchJson("/api/executions"),
    fetchJson("/api/demo-requests"),
    fetchJson("/api/plans")
  ]);

  renderOverview(overview);
  renderAutomations(automations);
  renderTemplates(templates);
  renderExecutions(executions);
  renderDemoRequests(demoRequests);
  renderPlans(plans);
}

document.getElementById("demo-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const status = document.getElementById("form-status");
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  status.textContent = "Enviando solicitud...";

  try {
    const data = await fetchJson("/api/demo-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    status.textContent = data.message;
    form.reset();
    await refreshData();
  } catch (error) {
    status.textContent = error.message;
  }
});

document.getElementById("automation-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const status = document.getElementById("automation-status");
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  status.textContent = "Creando automatizacion...";

  try {
    await fetchJson("/api/automations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    status.textContent = "Automatizacion creada.";
    form.reset();
    await refreshData();
  } catch (error) {
    status.textContent = error.message;
  }
});

document.addEventListener("click", async (event) => {
  const runButton = event.target.closest(".run-button");
  const statusButton = event.target.closest(".status-button");

  if (runButton) {
    runButton.disabled = true;
    runButton.textContent = "Ejecutando...";

    try {
      await fetchJson(`/api/automations/${runButton.dataset.id}/run`, {
        method: "POST"
      });
      await refreshData();
    } catch (error) {
      alert(error.message);
    } finally {
      runButton.disabled = false;
      runButton.textContent = "Ejecutar";
    }
  }

  if (statusButton) {
    statusButton.disabled = true;

    try {
      await fetchJson(`/api/automations/${statusButton.dataset.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: statusButton.dataset.next
        })
      });
      await refreshData();
    } catch (error) {
      alert(error.message);
    } finally {
      statusButton.disabled = false;
    }
  }
});

refreshData().catch((error) => {
  console.error(error);
});
