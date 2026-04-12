// app/api/items/[id]/permissions/route.js

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/lib/mongodb";
import Item from "@/models/item";

// =======================
// GET: Fetch permissions
// =======================
export async function GET(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { id } = await params; // ✅ FIX (no await)

    const item = await Item.findById(id).lean();
    console.log("item permissions", item);
    if (!item)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isOwner = item.ownerId === userId;
    const hasAccess = item.permissions?.some((p) => p.userId === userId);

    if (!isOwner && !hasAccess)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json({
      success: true,
      permissions: item.permissions || [],
    });
  } catch (error) {
    console.error("GET permissions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =======================
// POST: Add / Update permission
// =======================
export async function POST(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { id } = await params;

    const item = await Item.findById(id);
    if (!item)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // ✅ Only OWNER can manage permissions
    if (item.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only owner can manage permissions" },
        { status: 403 }
      );
    }

    const {
      targetUserId,
      targetUserEmail,
      targetUserName,
      role,
    } = await req.json();

    console.log("perm body", {
      targetUserId,
      targetUserEmail,
      targetUserName,
      role,});

    // -----------------------
    // VALIDATION
    // -----------------------
    if (!targetUserId || !role) {
      return NextResponse.json(
        { error: "targetUserId and role are required" },
        { status: 400 }
      );
    }

    const allowedRoles = ["viewer", "editor", "owner"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // ❌ Prevent owner removal/change accidentally
    if (targetUserId === item.ownerId) {
      return NextResponse.json(
        { error: "Cannot modify owner role" },
        { status: 400 }
      );
    }

    // -----------------------
    // UPSERT PERMISSION
    // -----------------------
    const existingIndex = item.permissions.findIndex(
      (p) => p.userId === targetUserId
    );

    if (existingIndex >= 0) {
      // UPDATE
      item.permissions[existingIndex] = {
        ...item.permissions[existingIndex],
        role,
        userEmail:
          targetUserEmail || item.permissions[existingIndex].userEmail,
        userName:
          targetUserName || item.permissions[existingIndex].userName,
      };
    } else {
      // CREATE
      item.permissions.push({
        userId: targetUserId,
        userEmail: targetUserEmail || "",
        userName: targetUserName || "",
        role,
        grantedBy: userId,
        grantedAt: new Date(),
      });
    }

    await item.save();

    return NextResponse.json({
      success: true,
      permissions: item.permissions,
    });
  } catch (error) {
    console.error("POST permissions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =======================
// DELETE: Remove permission
// =======================
export async function DELETE(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { id } = await params;

    const item = await Item.findById(id);
    if (!item)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // ✅ Only OWNER can delete permissions
    if (item.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only owner can manage permissions" },
        { status: 403 }
      );
    }

    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json(
        { error: "targetUserId required" },
        { status: 400 }
      );
    }

    // ❌ Prevent removing owner
    if (targetUserId === item.ownerId) {
      return NextResponse.json(
        { error: "Cannot remove owner" },
        { status: 400 }
      );
    }

    item.permissions = item.permissions.filter(
      (p) => p.userId !== targetUserId
    );

    await item.save();

    return NextResponse.json({
      success: true,
      permissions: item.permissions,
    });
  } catch (error) {
    console.error("DELETE permissions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}