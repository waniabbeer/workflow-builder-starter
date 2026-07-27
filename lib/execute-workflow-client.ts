import type { WorkflowNode } from "./workflow-store";

export type WorkflowExecuteStartResult = {
  executionId: string;
  status: string;
  path: string;
  statusCode: number;
  durationMs: number;
};

export function validateWorkflowNodesForRun(nodes: WorkflowNode[]): void {
  for (const node of nodes) {
    if (node.data.type !== "action") {
      continue;
    }
    const actionType = node.data.config?.actionType as string | undefined;
    if (actionType === "HTTP Request") {
      const endpoint = (node.data.config?.endpoint as string | undefined)?.trim();
      if (!endpoint) {
        throw new Error(
          "HTTP Request step needs a URL. Open Properties, set the URL field, and save the workflow."
        );
      }
    }
  }
}

/**
 * Start workflow execution (lesson: instant API response, work continues in background).
 * Logs POST timing to the browser console for DevTools Network-style verification.
 */
export async function postWorkflowExecute(
  workflowId: string
): Promise<WorkflowExecuteStartResult> {
  const path = `/api/workflow/${workflowId}/execute`;
  const startedAt = performance.now();

  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: {} }),
  });

  const durationMs = Math.round(performance.now() - startedAt);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      typeof errorBody.error === "string"
        ? errorBody.error
        : "Failed to execute workflow";
    throw new Error(message);
  }

  const result = (await response.json()) as {
    executionId: string;
    status: string;
  };

  // Visible in DevTools → Console when Network tab is hard to use (e.g. embedded preview)
  console.info(
    `POST ${path} ${response.status} ${durationMs}ms`,
    {
      executionId: result.executionId,
      status: result.status,
    }
  );

  return {
    executionId: result.executionId,
    status: result.status,
    path,
    statusCode: response.status,
    durationMs,
  };
}
