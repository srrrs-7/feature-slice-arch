import { client } from "$lib/api/client";

export { client };

// Export route clients
export const tasksApi = client.api.tasks;
