import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/lib/mongodb";
import Item from "@/models/item";
import { uploadToGridFS } from "@/lib/gridfs";


export async function POST(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const formData = await request.formData();
    const file = formData.get("file");
    const parentId = formData.get("parentId") || null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // Check parent permission
    let path = [];
    if (parentId) {
      const parent = await Item.findById(parentId).lean();
      if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });
      const isOwner = parent.ownerId === userId;
      const hasEdit = parent.permissions?.some(
        (p) => p.userId === userId && ["editor", "owner"].includes(p.role)
      );
      if (!isOwner && !hasEdit) {
        return NextResponse.json({ error: "No permission" }, { status: 403 });
      }
      path = [...parent.path, parentId];
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to GridFS
    const gridFsId = await uploadToGridFS(buffer, file.name, file.type);

    const email = sessionClaims?.email || "";
    const fullName = `${sessionClaims?.firstName || ""} ${sessionClaims?.lastName || ""}`.trim();

    const item = new Item({
      name: file.name,
      type: "file",
      ownerId: userId,
      ownerEmail: email,
      parentId: parentId || null,
      path,
      mimeType: file.type,
      size: file.size,
      gridFsId,
      permissions: [{ userId, userEmail: email, userName: fullName, role: "owner", grantedBy: userId }],
      lastModifiedBy: userId,
    });

    await item.save();

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}