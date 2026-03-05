/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user (based on session cookie).
 */
import { getCurrentUser } from "../session";
import { getErrorMessage } from "../../utils/errors";

export const meRoute = {
  GET: async (req: Request) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
      return Response.json({ user });
    } catch (error) {
      return Response.json({ error: getErrorMessage(error) }, { status: 400 });
    }
  },
};
