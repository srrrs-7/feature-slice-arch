import { client } from "$lib/api/client";

export { client };

// Export route client for attendance API
export const attendanceApi = client.api.attendance;
