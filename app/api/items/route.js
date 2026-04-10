import { NextResponse } from "next/server";
import Item from "@/models/item"; // adjust path if needed
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/lib/mongodb";

// =======================
// GET: list / search / filter / sort
// =======================
export async function GET(req) {
  try {
    await connectDB();

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    console.log("searchParams", searchParams);

    const parentId = searchParams.get("parentId");
    const type = searchParams.get("type"); // file | folder
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") === "asc" ? 1 : -1;
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const skip = (page - 1) * limit;

    // -----------------------
    // BUILD QUERY (SAFE)
    // -----------------------
    const query = {
      ownerId: userId, // ✅ FIX: no frontend ownerId needed
      isTrashed: false,
    };

    // parent filter (root = null)
    if (parentId !== null && parentId !== undefined) {
      query.parentId = parentId === "null" ? null : parentId;
    }

    // type filter
    if (type && ["file", "folder"].includes(type)) {
      query.type = type;
    }

    // text search
    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }

    // -----------------------
    // SORT SAFETY (prevent injection)
    // -----------------------
    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "name",
      "size",
    ];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    // -----------------------
    // FETCH DATA
    // -----------------------
    const [items, total] = await Promise.all([
      Item.find(query)
        .sort({ [safeSortBy]: order })
        .skip(skip)
        .limit(limit)
        .lean(),

      Item.countDocuments(query),
    ]);
console.log("items", items);
console.log("pagination", total, page,
        limit,
        total,
        Math.ceil(total / limit));
    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /items error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// =======================
// POST: create folder/file
// =======================
export async function POST(req) {
  try {
    await connectDB();

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log("body:", body);

    const {
      name,
      type,
      ownerEmail,
      parentId,
      color,
      mimeType,
      size,
    } = body;

    // -----------------------
    // FIXED VALIDATION
    // -----------------------
    if (!name || !type) {
      return NextResponse.json(
        { success: false, message: "name and type are required" },
        { status: 400 }
      );
    }

    if (!["folder", "file"].includes(type)) {
      return NextResponse.json(
        { success: false, message: "type must be folder or file" },
        { status: 400 }
      );
    }

    // -----------------------
    // Build path
    // -----------------------
    let path = [];

    if (parentId && parentId !== "null") {
      const parent = await Item.findById(parentId);

      if (!parent) {
        return NextResponse.json(
          { success: false, message: "Parent not found" },
          { status: 404 }
        );
      }

      path = [...parent.path, parent._id.toString()];
    }

    // -----------------------
    // CREATE ITEM
    // -----------------------
    const newItem = await Item.create({
      name: name.trim(),
      type,
      ownerId: userId, // ✅ FIX: from Clerk
      ownerEmail: ownerEmail || null,
      parentId: parentId && parentId !== "null" ? parentId : null,
      color: type === "folder" ? color || null : null,
      mimeType: type === "file" ? mimeType || null : null,
      size: type === "file" ? size || 0 : 0,
      path,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Item created successfully",
        data: newItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /items error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}