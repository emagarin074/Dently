import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const templateSchema = z.object({
  type: z.enum(["CONSENT_FORM", "PRESCRIPTION", "MEDICAL_CERTIFICATE"]),
  name: z.string().min(1, "Name is required").max(200),
  content: z.string().min(1, "Content is required"),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.clinicId)
    return NextResponse.json(
      { error: "No clinic workspace associated with this account" },
      { status: 400 },
    );

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = templateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  try {
    await prisma.documentTemplate.create({
      data: {
        clinicId: session.user.clinicId,
        type: parsed.data.type,
        name: parsed.data.name,
        content: parsed.data.content,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.clinicId)
    return NextResponse.json(
      { error: "No clinic workspace associated with this account" },
      { status: 400 },
    );

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id)
    return NextResponse.json(
      { error: "Template ID required" },
      { status: 400 },
    );

  try {
    await prisma.documentTemplate.deleteMany({
      where: { id, clinicId: session.user.clinicId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete template error:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 },
    );
  }
}
