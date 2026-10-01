import { createClient } from "@libsql/client";
import { randomBytes, scryptSync, randomUUID } from "node:crypto";

// ============================================================
// AdmiPy demo seed
// Populates an empty Turso/libSQL database with coherent demo data
// (users, clients, projects, milestones, tasks, comments, tags,
// members, checklists, activity logs and notifications) so every
// dashboard KPI and chart renders meaningful values.
//
// NEVER run this against production. It aborts if the database already
// contains data unless --reset is provided (which deletes demo records).
//
// Usage:
//   npm run db:seed
//   npm run db:seed -- --reset --yes
// ============================================================

const DEMO_PASSWORD = "Demo1234!";

const arg = (name) => {
  const flag = process.argv.find((a) => a.startsWith(`--${name}`));
  return flag ? true : undefined;
};

const RESET = Boolean(arg("reset"));
const YES = Boolean(arg("yes"));

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function isoDate(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString();
}

function nowIso() {
  return new Date().toISOString();
}

// Local sequence prefix for timestamps so "latest comments" order is stable.
let logStep = 0;
function stepIso() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - logStep++);
  return d.toISOString();
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("TURSO_DATABASE_URL is not set. Fill it in .env.local first.");
  process.exit(1);
}

const client = createClient({ url, authToken: authToken || undefined });

function log(msg) {
  console.log(msg);
}

async function count(table) {
  const r = await client.execute(`SELECT COUNT(*) AS c FROM ${table}`);
  return Number(r.rows[0].c);
}

async function guaranteeEmpty() {
  const alreadyData = await client.execute(
    `SELECT (SELECT COUNT(*) FROM clients) + (SELECT COUNT(*) FROM projects) + (SELECT COUNT(*) FROM tasks) AS n`,
  );
  const hasData = Number(alreadyData.rows[0].n) > 0;
  if (hasData && !RESET) {
    console.error(
      "Database already contains data (clients/projects/tasks). Aborting to avoid duplicates.\n" +
        "Re-run with --reset to delete demo data first, or seed an empty database.",
    );
    process.exit(1);
  }
}

// Deletes demo data in reverse dependency order (FK-safe) when --reset.
// Only tables that actually exist in this database are emptied, so the seed
// works regardless of how many migrations have been applied.
async function resetDemoData() {
  if (!RESET) return;
  log("= --reset: deleting existing demo data...");

  const desired = [
    "comment_reactions",
    "file_shares",
    "task_tags",
    "project_tags",
    "checklist_items",
    "task_comments",
    "milestone_comments",
    "project_comments",
    "client_comments",
    "time_entries",
    "task_dependencies",
    "activity_logs",
    "notifications",
    "attachments",
    "project_members",
    "tasks",
    "milestones",
    "projects",
    "clients",
    "users",
    "tags",
  ];

  const existing = new Set(
    (
      await client.execute(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite%' AND name != '_migrations'`,
      )
    ).rows.map((r) => String(r.name)),
  );

  for (const t of [...new Set(desired)]) {
    if (existing.has(t)) {
      await client.execute(`DELETE FROM ${t}`);
    }
  }
  log("= demo data cleared.");
}

async function main() {
  await guaranteeEmpty();
  await resetDemoData();

  // ---------- Roles ----------
  const roleRows = await client.execute(`SELECT id, name FROM roles`);
  const roles = Object.fromEntries(roleRows.rows.map((r) => [r.name, String(r.id)]));

  for (const needed of ["Developer", "Client", "Intermediary"]) {
    if (!roles[needed]) {
      console.error(`Role "${needed}" missing. Run 'npm run db:migrate' first.`);
      process.exit(1);
    }
  }

  // ---------- Users ----------
  const adminExisting = await client.execute(
    `SELECT id FROM users WHERE lower(email) = 'admin@admipy.local' LIMIT 1`,
  );
  let adminId =
    adminExisting.rows.length > 0 ? String(adminExisting.rows[0].id) : randomUUID();

  if (adminExisting.rows.length === 0) {
    await client.execute({
      sql: `INSERT INTO users (id, first_name, last_name, email, password_hash, role_id)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        adminId,
        "Admin",
        "User",
        "admin@admipy.local",
        hashPassword(DEMO_PASSWORD),
        roles["Developer"],
      ],
    });
    log("+ admin user");
  }

  const demoUsers = [
    { firstName: "Diego", lastName: "Rojas", email: "diego.rojas@admipy.local", role: "Developer" },
    { firstName: "Lucia", lastName: "Perez", email: "lucia.perez@admipy.local", role: "Developer" },
    { firstName: "Martin", lastName: "Sosa", email: "martin.sosa@admipy.local", role: "Intermediary" },
    { firstName: "Claudia", lastName: "Vega", email: "claudia.vega@admipy.local", role: "Intermediary" },
    { firstName: "Nora", lastName: "Campos", email: "nora.campos@admipy.local", role: "Client" },
  ];

  const userIds = {};
  for (const u of demoUsers) {
    const existing = await client.execute({
      sql: `SELECT id FROM users WHERE lower(email) = lower(?) LIMIT 1`,
      args: [u.email],
    });
    if (existing.rows.length > 0) {
      userIds[u.email] = String(existing.rows[0].id);
      log(`= user ${u.email} (already exists)`);
      continue;
    }
    const id = randomUUID();
    await client.execute({
      sql: `INSERT INTO users (id, first_name, last_name, email, password_hash, role_id)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, u.firstName, u.lastName, u.email, hashPassword(DEMO_PASSWORD), roles[u.role]],
    });
    userIds[u.email] = id;
    log(`+ user ${u.email} (${u.role})`);
  }

  const developerIds = [
    adminId,
    userIds["diego.rojas@admipy.local"],
    userIds["lucia.perez@admipy.local"],
  ];
  const intermediaryIds = [
    userIds["martin.sosa@admipy.local"],
    userIds["claudia.vega@admipy.local"],
  ];

  // ---------- Clients ----------
  const clientSeed = [
    { company: "Norte Digital SRL", contact: "Carlos Ibanez", country: "Argentina", city: "Buenos Aires", intermediary: intermediaryIds[0], active: 1 },
    { company: "Andes Retail SA", contact: "Valeria Ruiz", country: "Chile", city: "Santiago", intermediary: intermediaryIds[0], active: 1 },
    { company: "Costa Logistics", contact: "Ramiro Ponce", country: "Uruguay", city: "Montevideo", intermediary: intermediaryIds[1], active: 1 },
    { company: "Soluciones KP", contact: "Ana Fuentes", country: "Peru", city: "Lima", intermediary: intermediaryIds[1], active: 1 },
    { company: "Terra Agro", contact: "Julio Medina", country: "Paraguay", city: "Asuncion", intermediary: intermediaryIds[0], active: 0 },
  ];

  const clientIds = [];
  for (const c of clientSeed) {
    const id = randomUUID();
    await client.execute({
      sql: `INSERT INTO clients
            (id, company_name, contact_name, email, phone, country, city, website, status, intermediary_id, created_by, updated_by, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
      args: [
        id,
        c.company,
        c.contact,
        `contacto@${c.company.toLowerCase().replace(/\s+/g, "")}.com`,
        "+54 9 11 0000 0000",
        c.country,
        c.city,
        `https://${c.company.toLowerCase().replace(/\s+/g, "")}.com`,
        c.intermediary,
        adminId,
        adminId,
        c.active,
      ],
    });
    clientIds.push(id);
    log(`+ client ${c.company}`);
  }

  // ---------- Projects ----------
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const projectSeed = [
    { name: "Redesign Web Corporativo", client: 0, status: "Development", priority: "High", progress: 65, estH: 240, workH: 180, endOffset: 12 },
    { name: "App Movil de Pedidos", client: 1, status: "In Review", priority: "Critical", progress: 82, estH: 400, workH: 330, endOffset: 7 },
    { name: "Integracion ERP", client: 2, status: "QA", priority: "High", progress: 70, estH: 300, workH: 210, endOffset: 20 },
    { name: "Dashboard de Reportes", client: 3, status: "Design", priority: "Medium", progress: 25, estH: 180, workH: 45, endOffset: 45 },
    { name: "Portal de Clientes", client: 0, status: "Completed", priority: "Medium", progress: 100, estH: 320, workH: 340, endOffset: -30 },
    { name: "Migracion de Infraestructura", client: 1, status: "Completed", priority: "High", progress: 100, estH: 200, workH: 195, endOffset: -15 },
    { name: "Sitio E-commerce", client: 2, status: "Cancelled", priority: "Low", progress: 10, estH: 260, workH: 30, endOffset: 60 },
    { name: "Refactor Backend", client: 3, status: "Archived", priority: "Low", progress: 40, estH: 150, workH: 60, endOffset: 90 },
  ];

  const projectIds = [];
  for (const p of projectSeed) {
    const id = randomUUID();
    const start = new Date(now - 40 * day).toISOString();
    const end = new Date(now + p.endOffset * day).toISOString();
    await client.execute({
      sql: `INSERT INTO projects
            (id, code, name, description, client_id, intermediary_id, status, priority,
             estimated_start_date, estimated_end_date, estimated_hours, worked_hours,
             completion_percentage, budget, visibility, created_by, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Internal', ?, ?)`,
      args: [
        id,
        `PR-${String(projectSeed.indexOf(p) + 1).padStart(3, "0")}`,
        p.name,
        `Proyecto demo: ${p.name}.`,
        clientIds[p.client],
        intermediaryIds[projectSeed.indexOf(p) % intermediaryIds.length],
        p.status,
        p.priority,
        start,
        end,
        p.estH,
        p.workH,
        p.progress,
        25000 + projectSeed.indexOf(p) * 5000,
        adminId,
        adminId,
      ],
    });
    projectIds.push(id);
    log(`+ project ${p.name} (${p.status})`);
  }

  // ---------- Milestones ----------
  const milestoneIds = [];
  for (let i = 0; i < projectIds.length; i++) {
    const active = !["Completed", "Cancelled", "Archived"].includes(projectSeed[i].status);
    const ms = [
      { title: "Kickoff y Discovery", status: "Completed", done: 1 },
      { title: "Desarrollo Principal", status: active ? "Pending" : "Completed", done: active ? 0 : 1 },
      { title: "Entregables Finales", status: "Pending", done: 0 },
    ];
    for (let j = 0; j < ms.length; j++) {
      const id = randomUUID();
      const m = ms[j];
      await client.execute({
        sql: `INSERT INTO milestones
              (id, project_id, title, description, estimated_date, completed_date, status, completion_percentage, sort_order, created_by, updated_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          projectIds[i],
          m.title,
          `Hito ${j + 1} de ${projectSeed[i].name}.`,
          new Date(now + (j + 1) * 15 * day).toISOString(),
          m.done ? new Date(now - 5 * day).toISOString() : null,
          m.status,
          m.done ? 100 : j === 0 ? 100 : 0,
          j,
          adminId,
          adminId,
        ],
      });
      milestoneIds.push(id);
    }
  }
  log(`+ milestones (${milestoneIds.length})`);

  // ---------- Tasks ----------
  const taskTitles = {
    Pending: ["Relevar requerimientos", "Definir wireframes", "Configurar ambiente staging", "Redactar documentacion"],
    "In Progress": ["Implementar modulo de autenticacion", "Maquetar pantalla principal", "Desarrollar API de reportes"],
    Blocked: ["Despliegue bloqueado por firewall", "Esperando credenciales de cliente"],
    Completed: ["Configurar repositorio", "Crear pipeline CI", "Corregir bug de carga", "Cerrar sprint"],
    Planned: ["Planificar iteracion 2", "Estimar backlog"],
  };

  const taskIds = [];
  let position = 0;
  for (let i = 0; i < projectIds.length; i++) {
    const active = !["Completed", "Cancelled", "Archived"].includes(projectSeed[i].status);
    const statuses = active
      ? ["Pending", "Pending", "In Progress", "In Progress", "Blocked", "Completed", "Planned"]
      : ["Completed", "Completed", "Completed"];
    for (const st of statuses) {
      const pool = taskTitles[st] ?? taskTitles["Pending"];
      const title = `${pool[(position + statuses.indexOf(st)) % pool.length]} (${projectSeed[i].name})`;
      const id = randomUUID();
      const completion = st === "Completed" ? 100 : st === "In Progress" ? 50 : st === "Planned" ? 5 : 0;
      await client.execute({
        sql: `INSERT INTO tasks
              (id, project_id, milestone_id, parent_task_id, title, description, assigned_to,
               status, priority, estimated_hours, worked_hours, estimated_start, estimated_end,
               completion_percentage, position, weight, task_type, created_by, updated_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          projectIds[i],
          milestoneIds[i * 3 + (statuses.indexOf(st) % 3)],
          null,
          title,
          `Tarea demo de ${projectSeed[i].name}.`,
          developerIds[position % developerIds.length],
          st,
          ["Low", "Medium", "High"][position % 3],
          4 + (position % 12),
          2 + (position % 8),
          new Date(now + 5 * day).toISOString(),
          new Date(now + 20 * day).toISOString(),
          completion,
          position++,
          1,
          ["Feature", "Bug", "Task"][position % 3],
          adminId,
          adminId,
        ],
      });
      taskIds.push(id);
    }
  }
  log(`+ tasks (${taskIds.length})`);

  // ---------- Subtasks ----------
  const parent = taskIds[taskIds.length - 1];
  if (parent) {
    const subId = randomUUID();
    await client.execute({
      sql: `INSERT INTO tasks
            (id, project_id, parent_task_id, title, description, assigned_to, status, priority,
             estimated_hours, completion_percentage, position, weight, task_type, created_by, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        subId,
        projectIds[projectIds.length - 1],
        parent,
        "Subtarea de soporte",
        "Subdivisión demo de una tarea principal.",
        developerIds[0],
        "Pending",
        "Medium",
        2,
        0,
        position++,
        1,
        "Task",
        adminId,
        adminId,
      ],
    });
    taskIds.push(subId);
    log("+ subtask");
  }

  // ---------- Comments ----------
  const comments = [
    { type: "client", ref: clientIds[0], msg: "Cliente interesado en ampliar alcance." },
    { type: "client", ref: clientIds[1], msg: "Revisar SLA de la cuenta." },
    { type: "project", ref: projectIds[0], msg: "Avance del 65% confirmado en revisión." },
    { type: "project", ref: projectIds[1], msg: "Pendiente de pruebas de aceptación." },
    { type: "project", ref: projectIds[2], msg: "QA encontró 2 defectos menores." },
    { type: "task", ref: taskIds[2], msg: "Espero terminar esta semana." },
    { type: "task", ref: taskIds[4], msg: "Desbloqueo solicitado a IT." },
  ];
  const commentUsers = [adminId, ...developerIds];
  for (const c of comments) {
    const table =
      c.type === "client" ? "client_comments" : c.type === "project" ? "project_comments" : "task_comments";
    const col = c.type === "client" ? "client_id" : c.type === "project" ? "project_id" : "task_id";
    await client.execute({
      sql: `INSERT INTO ${table} (id, ${col}, user_id, message, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [randomUUID(), c.ref, commentUsers[comments.indexOf(c) % commentUsers.length], c.msg, stepIso(), stepIso()],
    });
  }
  log(`+ comments (${comments.length})`);

  // ---------- Tags ----------
  const tagSeed = [
    { name: "Urgente", color: "#EF4444" },
    { name: "Frontend", color: "#3B82F6" },
    { name: "Backend", color: "#22C55E" },
  ];
  const tagIds = [];
  for (const t of tagSeed) {
    const id = randomUUID();
    await client.execute({
      sql: `INSERT INTO tags (id, name, color) VALUES (?, ?, ?)`,
      args: [id, t.name, t.color],
    });
    tagIds.push(id);
  }
  for (let i = 0; i < projectIds.length; i++) {
    await client.execute({
      sql: `INSERT INTO project_tags (project_id, tag_id) VALUES (?, ?)`,
      args: [projectIds[i], tagIds[i % tagIds.length]],
    });
  }
  log(`+ tags (${tagIds.length})`);

  // ---------- Project members ----------
  for (let i = 0; i < projectIds.length; i++) {
    await client.execute({
      sql: `INSERT INTO project_members (id, project_id, user_id, created_by) VALUES (?, ?, ?, ?)`,
      args: [randomUUID(), projectIds[i], developerIds[i % developerIds.length], adminId],
    });
  }
  log(`+ project members (${projectIds.length})`);

  // ---------- Checklist items ----------
  for (let i = 0; i < 3; i++) {
    await client.execute({
      sql: `INSERT INTO checklist_items (id, task_id, title, is_completed, sort_order, created_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [randomUUID(), taskIds[i], `Checklist item ${i + 1}`, i % 2, i, adminId],
    });
  }
  log("+ checklist items (3)");

  // ---------- Activity logs ----------
  const activityActions = [
    "created_client",
    "created_project",
    "created_task",
    "updated_project",
    "logged_in",
  ];
  for (let i = 0; i < 20; i++) {
    await client.execute({
      sql: `INSERT INTO activity_logs (id, user_id, action, entity, entity_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        randomUUID(),
        developerIds[i % developerIds.length],
        activityActions[i % activityActions.length],
        "project",
        projectIds[i % projectIds.length],
        stepIso(),
      ],
    });
  }
  log("+ activity logs (20)");

  // ---------- Notifications ----------
  for (let i = 0; i < 8; i++) {
    await client.execute({
      sql: `INSERT INTO notifications (id, receiver_id, sender_id, title, message, type, entity_type, entity_id, is_read, dedupe_key)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        randomUUID(),
        developerIds[i % developerIds.length],
        adminId,
        "Notificación demo",
        "Este es un mensaje de ejemplo.",
        "info",
        "project",
        projectIds[i % projectIds.length],
        i % 2,
        `seed-demo-${i}`,
      ],
    });
  }
  log("+ notifications (8)");

  // ---------- Summary ----------
  log("\n== Seed complete ==");
  for (const t of ["users", "clients", "projects", "milestones", "tasks", "project_comments", "client_comments", "task_comments", "tags", "project_members", "checklist_items", "activity_logs", "notifications"]) {
    log(`  - ${t}: ${await count(t)}`);
  }
  log(`\nDemo password for seeded users: ${DEMO_PASSWORD}`);
  log("Restart/reload /dashboard to see the data.");
}

main().catch((err) => {
  console.error("[seed-demo] failed:", err);
  process.exit(1);
});