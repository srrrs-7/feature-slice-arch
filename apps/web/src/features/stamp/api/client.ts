import { client } from "$lib/api/client";

export { client };

// Export route clients
export const stampsApi = client.api.stamps;
