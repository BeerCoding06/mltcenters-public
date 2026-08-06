import { NextResponse } from "next/server";
import { z } from "zod";
import { ZodError } from "zod";
import { createProfileMergeService } from "@/features/auth/profile-merge-service";
import { createSupabaseServerClient } from "@/features/auth/supabase-server";
import { isSupabaseConfigured } from "@/features/auth/supabase-config";
import { prisma } from "@/shared/db/prisma";

const mergeSchema = z.object({
  guestId: z.string().min(1),
});

const profileMergeService = createProfileMergeService(prisma);

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return jsonError("Authentication is not configured", 503);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonError("Unauthorized", 401);
    }

    const body = mergeSchema.parse(await request.json());
    const result = await profileMergeService.mergeGuestIntoUser({
      supabaseUserId: user.id,
      guestId: body.guestId,
      displayName:
        (typeof user.user_metadata?.display_name === "string"
          ? user.user_metadata.display_name
          : undefined) ??
        user.email?.split("@")[0] ??
        "Player",
    });

    if (!result.ok) {
      const status = result.code === "guest_not_found" ? 404 : 409;
      return jsonError(result.code, status);
    }

    return NextResponse.json({
      profileId: result.profileId,
      alreadyMerged: result.alreadyMerged ?? false,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.flatten() },
        { status: 400 },
      );
    }
    console.error(err);
    return jsonError("Internal server error", 500);
  }
}
