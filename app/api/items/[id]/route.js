// items/[id]/route.js
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/lib/mongodb";
import Item from "@/models/item";
import { deleteFromGridFS } from "@/lib/gridfs";

async function checkPermission(item, userId, requiredRole = "viewer") {
  if (item.ownerId === userId) return true;
  const perm = item.permissions?.find((p) => p.userId === userId);
  if (!perm) return false;
  if (requiredRole === "viewer") return true;
  if (requiredRole === "editor") return ["editor", "owner"].includes(perm.role);
  if (requiredRole === "owner") return perm.role === "owner";
  return false;
}

export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { id } = await params; // ✅ FIX
    const item = await Item.findById(id);

    if (!item)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!(await checkPermission(item, userId, "viewer"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { id } = await params; // ✅ FIX
    const item = await Item.findById(id);

    if (!item)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!(await checkPermission(item, userId, "editor"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // STAR
    if (typeof body.starred === "boolean") {
      item.starredBy = item.starredBy || [];

      if (body.starred) {
        if (!item.starredBy.includes(userId)) {
          item.starredBy.push(userId);
        }
      } else {
        item.starredBy = item.starredBy.filter((id) => id !== userId);
      }
    }

    // TRASH
    if (typeof body.isTrashed === "boolean") {
      item.isTrashed = body.isTrashed;
      item.trashedAt = body.isTrashed ? new Date() : null;
      item.trashedBy = body.isTrashed ? userId : null;

      if (item.type === "folder") {
        await Item.updateMany(
          { path: item._id.toString() },
          {
            isTrashed: body.isTrashed,
            trashedAt: body.isTrashed ? new Date() : null,
            trashedBy: body.isTrashed ? userId : null,
          }
        );
      }
    }

    // MOVE
    if (body.parentId !== undefined) {
      const newParentId = body.parentId || null;

      let newPath = [];
      if (newParentId) {
        const newParent = await Item.findById(newParentId);
        if (!newParent)
          return NextResponse.json(
            { error: "Parent not found" },
            { status: 404 }
          );

        newPath = [...newParent.path, newParentId];
      }

      item.parentId = newParentId;
      item.path = newPath;
    }

    item.lastModifiedBy = userId;

    await item.save();

    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { id } = await params; // ✅ FIX
    const item = await Item.findById(id);

    if (!item)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!(await checkPermission(item, userId, "owner"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (item.gridFsId) {
      await deleteFromGridFS(item.gridFsId);
    }

    if (item.type === "folder") {
      const children = await Item.find({ path: item._id.toString() });

      for (const child of children) {
        if (child.gridFsId) {
          await deleteFromGridFS(child.gridFsId);
        }
      }

      await Item.deleteMany({ path: item._id.toString() });
    }

    await item.deleteOne();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}