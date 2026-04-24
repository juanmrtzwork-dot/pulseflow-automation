async function fetchJson(url, options) {
  const response = await fetch(url, options);

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;

    try {
      const data = await response.json();
      message = data.message || message;
    } catch (error) {
      // Ignored on purpose.
    }

    throw new Error(message);
  }

  return response.json();
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function statusClass(status) {
  return status === "Activa" || status === "Completada" || status === "Demo agendada"
    ? "status-ok"
    : "status-warn";
}

function renderOverview(data) {
  document.getElementById("metric-automations").textContent = formatNumber(data.metrics.automations);
  document.getElementById("metric-runs").textContent = formatNumber(data.metrics.runs);
  document.getElementById("metric-hours").textContent = `${formatNumber(data.metrics.savedHours)}h`;
  document.getElementById("metric-success").textContent = `${data.metrics.successRate}%`;
  document.getElementById("metric-pipeline").textContent = formatNumber(data.metrics.pipeline);
  document.getElementById("metric-hours-preview").textContent = `${formatNumber(data.metrics.savedHours)}h`;
}

function renderTemplates(items) {
  const container = document.getElementById("templates-list");
  container.innerHTML = items
    .map(
      (item) => `
        <article class="value-card">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <div class="pill-row">
            ${item.integrations.map((integration) => `<span class="mini-pill">${integration}</span>`).join("")}
          </div>
        </article>
      `
    )
    .join("");
}

function renderAutomations(items) {
  const container = document.getElementById("automations-list");
  container.innerHTML = items
    .slice(0, 3)
    .map(
      (item) => `
        <article class="stack-item">
          <h4>${item.name}</h4>
          <p>${item.trigger}</p>
          <div class="stack-meta">
            <span>${item.department}</span>
            <span class="${statusClass(item.status)}">${item.status}</span>
            <span>${item.runs} runs</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderExecutions(items) {
  const container = document.getElementById("executions-list");
  container.innerHTML = items
    .slice(0, 4)
    .map(
      (item) => `
        <article class="stack-item">
          <h4>${item.automation}</h4>
          <p>${item.startedAt}</p>
          <div class="stack-meta">
            <span class="${statusClass(item.status)}">${item.status}</span>
            <span>${item.duration}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderPlans(items) {
  const container = document.getElementById("plans-list");
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
  const [overview, automations, templates, executions, plans] = await Promise.all([
    fetchJson("/api/overview"),
    fetchJson("/api/automations"),
    fetchJson("/api/templates"),
    fetchJson("/api/executions"),
    fetchJson("/api/plans")
  ]);

  renderOverview(overview);
  renderAutomations(automations);
  renderTemplates(templates);
  renderExecutions(executions);
  renderPlans(plans);
}

document.getElementById("demo-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const status = document.getElementById("form-status");
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  status.textContent = "Sending request...";

  try {
    const data = await fetchJson("/api/demo-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    status.textContent = `${data.message} We will follow up to schedule the audit.`;
    form.reset();
    await refreshData();
  } catch (error) {
    status.textContent = error.message;
  }
});

refreshData().catch((error) => {
  console.error(error);
});
