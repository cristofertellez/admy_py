// Épica 17 (17.1) — OpenAPI 3.1 description of the public API. Served as
// JSON so external tools (Swagger UI, Postman, code generators) can import
// it directly.

const PAGINATION_PARAMS = [
  { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
  { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
];

const PAGINATION_RESPONSE = {
  type: "object",
  properties: {
    data: { type: "array", items: { type: "object" } },
    pagination: {
      type: "object",
      properties: {
        page: { type: "integer" },
        pageSize: { type: "integer" },
        total: { type: "integer" },
        totalPages: { type: "integer" },
      },
    },
    version: { type: "string", example: "v1" },
  },
};

export function GET() {
  const document = {
    openapi: "3.1.0",
    info: {
      title: "AdmiPy Public API",
      version: "1.0.0",
      description:
        "Read-only public API. Authenticate every request with `Authorization: Bearer <apiKey>`. " +
        "Rate limit: 60 requests per minute per key. Data visibility follows the API key owner's role.",
    },
    servers: [{ url: "/api/v1" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer" },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/projects": {
        get: {
          summary: "List visible projects",
          parameters: [
            ...PAGINATION_PARAMS,
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK", content: { "application/json": { schema: PAGINATION_RESPONSE } } } },
        },
      },
      "/projects/{id}": {
        get: {
          summary: "Project detail with tasks and milestones",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
        },
      },
      "/tasks": {
        get: {
          summary: "List visible tasks",
          parameters: [
            ...PAGINATION_PARAMS,
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "priority", in: "query", schema: { type: "string" } },
            { name: "assignee", in: "query", schema: { type: "string" } },
            { name: "project", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK", content: { "application/json": { schema: PAGINATION_RESPONSE } } } },
        },
      },
      "/clients": {
        get: {
          summary: "List visible clients",
          parameters: [
            ...PAGINATION_PARAMS,
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK", content: { "application/json": { schema: PAGINATION_RESPONSE } } } },
        },
      },
      "/milestones": {
        get: {
          summary: "Milestones of a project",
          parameters: [
            { name: "project", in: "query", required: true, schema: { type: "string" } },
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK" } },
        },
      },
      "/calendar": {
        get: {
          summary: "iCalendar (.ics) feed of upcoming milestones",
          description: "Importable by Google Calendar and Outlook (17.4).",
          responses: {
            "200": { description: "OK", content: { "text/calendar": { schema: { type: "string" } } } },
          },
        },
      },
    },
  };

  return Response.json(document);
}
