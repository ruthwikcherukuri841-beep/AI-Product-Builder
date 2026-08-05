import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";
import { GetProfileResponse, UpdateProfileBody, UpdateProfileResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/profile", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;

  let [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));

  if (!profile) {
    [profile] = await db
      .insert(profilesTable)
      .values({ userId })
      .returning();
  }

  res.json(GetProfileResponse.parse(profile));
});

router.put("/profile", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.user.id;
  const { fullName, resume, jobDescription } = parsed.data;

  const updateData: Record<string, unknown> = {};
  if (fullName !== undefined) updateData.fullName = fullName;
  if (resume !== undefined) updateData.resume = resume;
  if (jobDescription !== undefined) updateData.jobDescription = jobDescription;

  // Upsert profile
  const existing = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));

  let profile;
  if (existing.length === 0) {
    [profile] = await db
      .insert(profilesTable)
      .values({ userId, ...updateData })
      .returning();
  } else {
    [profile] = await db
      .update(profilesTable)
      .set(updateData)
      .where(eq(profilesTable.userId, userId))
      .returning();
  }

  res.json(UpdateProfileResponse.parse(profile));
});

export default router;
