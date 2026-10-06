import { z } from "zod";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WeeekClient, CreateTaskBody } from "../client.js";
import type { Resolver } from "../resolver.js";
import { resolveSafeAttachPath, type AttachPolicy } from "../attach.js";
import { parseDueDate } from "../dates.js";
import { jsonReply, errorReply } from "./reply.js";

const nameOrId = z.union([z.string(), z.number()]);
const richUpdateShape = {
  type:z.enum(['action','meet','call']).optional(),
  duration:z.number().int().nonnegative().nullable().optional(),
  tags:z.array(z.number().int().positive()).optional(),
  customFields:z.record(z.unknown()).optional(),
  startDateTime:z.string().datetime({offset:true}).nullable().optional(),
  dueDateTime:z.string().datetime({offset:true}).nullable().optional(),
};

interface CreateInput {
  title: string; project: string | number;
  column?: string | number; assignee?: string | number;
  due?: string; description?: string;
  startDate?: string; dueDate?: string; priority?: number;
  type?: 'action'|'meet'|'call'; customFields?: Record<string,unknown>;
}

export async function buildCreateBody(resolver: Resolver, input: CreateInput): Promise<CreateTaskBody> {
  const projectId = await resolver.resolveProject(input.project);
  const body: CreateTaskBody = { title: input.title, projectId };
  if (input.column !== undefined) body.boardColumnId = await resolver.resolveColumn(projectId, input.column);
  if (input.assignee !== undefined) body.userId = await resolver.resolveAssignee(input.assignee);
  if (input.due !== undefined && input.dueDate !== undefined) throw new Error("Use either due or dueDate, not both");
  if (input.startDate !== undefined) body.startDate = input.startDate;
  if (input.dueDate !== undefined) body.dueDate = input.dueDate;
  if (input.due !== undefined) body.dueDate = parseDueDate(input.due);
  if (body.startDate && body.dueDate && body.startDate > body.dueDate) throw new Error("startDate must not be after dueDate");
  if (input.priority !== undefined) body.priority = input.priority;
  if (input.description !== undefined) body.description = input.description;
  if (input.type !== undefined) body.type = input.type;
  if (input.customFields !== undefined) body.customFields = input.customFields;
  return body;
}

const createShape = {
  title: z.string(),
  project: nameOrId,
  column: nameOrId.optional(),
  assignee: nameOrId.optional(),
  due: z.string().optional(),
  startDate: z.string().date().optional(),
  dueDate: z.string().date().optional(),
  priority: z.number().int().min(0).max(3).optional(),
  description: z.string().optional(),
  type:z.enum(['action','meet','call']).optional(),
  customFields:z.record(z.unknown()).optional(),
};

export function registerWriteTools(
  server: McpServer,
  client: WeeekClient,
  resolver: Resolver,
  attachPolicy: AttachPolicy,
): void {
  server.registerTool(
    "weeek_create_task",
    {
      description: "Create a WEEEK task by project/column/assignee NAME or ID, with description, priority, task type (action/meet/call) and customFields. Use YYYY-MM-DD dueDate or natural-language due; optional startDate ranges may be rejected by workspace limits. Always reads the created ID back; never repeats creation after an uncertain outcome. WEEEK assigns the token owner by default. Use weeek_change_task_assignees to change assignees later and weeek_add_task_comment to append task content.",
      inputSchema: createShape,
    },
    async (args) => {
      try {
        const body = await buildCreateBody(resolver, args as CreateInput);
        return jsonReply(await client.createTask(body));
      } catch (err) { return errorReply(err); }
    },
  );

  server.registerTool(
    "weeek_create_tasks",
    {
      description: "Create many WEEEK tasks in one call. Returns a per-item report; one bad name does not abort the batch.",
      inputSchema: { tasks: z.array(z.object(createShape)).min(1).max(50) },
    },
    async (args) => {
      const report: Array<{ ok: boolean; task?: unknown; error?: string; candidates?: unknown }> = [];
      for (const t of args.tasks) {
        try {
          const body = await buildCreateBody(resolver, t as CreateInput);
          report.push({ ok: true, task: await client.createTask(body) });
        } catch (err) {
          const e = err as { name?: string; message?: string };
          const entry: { ok: false; error: string; candidates?: unknown } = { ok: false, error: e.message ?? String(err) };
          if (e.name === "ResolutionError") entry.candidates = (err as any).candidates;
          report.push(entry);
        }
      }
      return jsonReply(report);
    },
  );

  server.registerTool(
    "weeek_update_task",
    {
      description: "Update task title, priority, type, estimated duration in minutes, tags, customFields, date-only start/deadline or ISO datetime fields. Null clears nullable fields. Do not mix date-only and datetime strings. Reads back and verifies each field; reports an updated ID on uncertainty. Use dueDate alone if workspace rejects ranges. Description replacement is not supported: append details with weeek_add_task_comment or set description when creating the task.",
      inputSchema: { id: z.number().int().positive(), title: z.string().min(1).max(255).optional(), due: z.string().optional(), startDate:z.string().date().nullable().optional(), dueDate:z.string().date().nullable().optional(), priority:z.number().int().min(0).max(3).nullable().optional(), ...richUpdateShape },
    },
    async (args) => {
      try {
        const patch: Record<string, unknown> = {};
        if (args.title !== undefined) patch.title = args.title;
        if (args.due !== undefined && args.dueDate !== undefined) throw new Error("Use either due or dueDate, not both");
        if (args.startDate !== undefined) patch.startDate = args.startDate;
        if (args.dueDate !== undefined) patch.dueDate = args.dueDate;
        if (args.due !== undefined) patch.dueDate = parseDueDate(args.due);
        if (args.priority !== undefined) patch.priority = args.priority;
        for(const key of Object.keys(richUpdateShape)) if((args as any)[key]!==undefined) patch[key]=(args as any)[key];
        if ((typeof patch.startDate==='string'||typeof patch.dueDate==='string')&&(typeof patch.startDateTime==='string'||typeof patch.dueDateTime==='string')) throw new Error('Use date-only fields OR datetime fields, not both');
        if (typeof patch.startDate === "string" && typeof patch.dueDate === "string" && patch.startDate > patch.dueDate) throw new Error("startDate must not be after dueDate");
        if(!Object.keys(patch).length) throw new Error('Provide at least one supported field. To add task content, use weeek_add_task_comment; description cannot be replaced by the public API.');
        return jsonReply(await client.updateTask(args.id, patch));
      } catch (err) { return errorReply(err); }
    },
  );

  server.registerTool(
    "weeek_delete_task",
    {
      description:
        "Permanently delete a WEEEK task by id. Irreversible — the task is removed, not just completed. Requires confirm:true; to merely close a task use weeek_complete_task instead.",
      inputSchema: {
        id: z.number().int(),
        confirm: z.literal(true).describe("Must be true to confirm this irreversible deletion."),
      },
      annotations: { destructiveHint: true, idempotentHint: false },
    },
    async (args) => {
      try { return jsonReply(await client.deleteTask(args.id)); }
      catch (err) { return errorReply(err); }
    },
  );

  server.registerTool(
    "weeek_attach_file",
    {
      description:
        "Attach a local file to a WEEEK task. For safety only files inside the allowed directory (the server's working directory by default, or WEEEK_ATTACH_DIR if set) — and its subfolders — may be attached; paths outside it are refused.",
      inputSchema: { task_id: z.number().int(), path: z.string() },
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const safePath = await resolveSafeAttachPath(args.path, attachPolicy);
        const data = await readFile(safePath);
        return jsonReply(await client.attachFile(args.task_id, basename(safePath), data));
      } catch (err) { return errorReply(err); }
    },
  );

  server.registerTool(
    "weeek_move_task",
    { description: "Move a WEEEK task to a column (by name or id, scoped to the given board) on that board.", inputSchema: { id: z.number().int(), board_id: z.number().int(), column: nameOrId } },
    async (args) => {
      try {
        const columnId = await resolver.resolveColumnInBoard(args.board_id, args.column);
        return jsonReply(await client.moveTask(args.id, args.board_id, columnId));
      } catch (err) { return errorReply(err); }
    },
  );

  server.registerTool(
    "weeek_complete_task",
    { description: "Mark a WEEEK task complete, or reopen it (completed:false).", inputSchema: { id: z.number().int(), completed: z.boolean() } },
    async (args) => {
      try { return jsonReply(await client.setCompleted(args.id, args.completed)); }
      catch (err) { return errorReply(err); }
    },
  );
}
