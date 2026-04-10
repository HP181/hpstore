import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/lib/mongodb";
import Item from "@/models/item";

export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const item = await Item.findById(id).lean();
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const isOwner = item.ownerId === userId;
    const hasPerm = item.permissions?.some((p) => p.userId === userId);
    if (!isOwner && !hasPerm) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ permissions: item.permissions });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const item = await Item.findById(id);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (item.ownerId !== userId) {
      const perm = item.permissions?.find((p) => p.userId === userId);
      if (!perm || perm.role !== "owner")
        return NextResponse.json({ error: "Only owners can manage permissions" }, { status: 403 });
    }
    const { targetUserId, targetUserEmail, targetUserName, role } = await request.json();
    if (!targetUserId || !role) return NextResponse.json({ error: "userId and role required" }, { status: 400 });
    const existing = item.permissions.findIndex((p) => p.userId === targetUserId);
    if (existing >= 0) {
      item.permissions[existing].role = role;
      item.permissions[existing].userEmail = targetUserEmail || item.permissions[existing].userEmail;
      item.permissions[existing].userName = targetUserName || item.permissions[existing].userName;
    } else {
      item.permissions.push({ userId: targetUserId, userEmail: targetUserEmail || "", userName: targetUserName || "", role, grantedBy: userId, grantedAt: new Date() });
    }
    await item.save();
    return NextResponse.json({ permissions: item.permissions });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const item = await Item.findById(id);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (item.ownerId !== userId) {
      const perm = item.permissions?.find((p) => p.userId === userId);
      if (!perm || perm.role !== "owner")
        return NextResponse.json({ error: "Only owners can manage permissions" }, { status: 403 });
    }
    const { targetUserId } = await request.json();
    item.permissions = item.permissions.filter((p) => p.userId !== targetUserId);
    await item.save();
    return NextResponse.json({ permissions: item.permissions });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}