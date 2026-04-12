// app/api/items/route.js
import { NextResponse } from "next/server";
import Item from "@/models/item";
import { auth, currentUser } from "@clerk/nextjs/server";
import connectDB from "@/lib/mongodb";

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

    const parentId = searchParams.get("parentId");
    const mode = searchParams.get("mode") || "drive";
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") === "asc" ? 1 : -1;

    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;

    let query = {
      isTrashed: false,
    };

    // =========================
    // MODE FILTERING
    // =========================
    if (mode === "trash") {
      query = {
        isTrashed: true,
        $or: [
          { ownerId: userId },
          { "permissions.userId": userId },
        ],
      };
    } 
    else if (mode === "starred") {
      query = {
        isTrashed: false,
        starredBy: userId,
        $or: [
          { ownerId: userId },
          { "permissions.userId": userId },
        ],
      };
    } 
    else if (mode === "shared") {
      query = {
        isTrashed: false,
        "permissions.userId": userId,
      };
    } 
    else {
      // DRIVE MODE (IMPORTANT FIX)
      query = {
        isTrashed: false,
        $or: [
          { ownerId: userId },
          { "permissions.userId": userId },
        ],
        parentId: parentId === "null" ? null : parentId,
      };
    }

    // =========================
    // TYPE FILTER
    // =========================
    if (type && ["file", "folder"].includes(type)) {
      query.type = type;
    }

    // =========================
    // SEARCH (FIXED - SAFE)
    // =========================
    if (search?.trim()) {
      const regex = new RegExp(search.trim(), "i");

      query = {
        ...query,
        $or: [
          ...(query.$or || []),
          { name: regex },
          { mimeType: regex },
        ],
      };
    }

    // =========================
    // SORT SAFETY
    // =========================
    const allowedSortFields = ["createdAt", "updatedAt", "name", "size"];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const [items, total] = await Promise.all([
      Item.find(query)
        .sort({ [safeSortBy]: order })
        .skip(skip)
        .limit(limit)
        .lean(),

      Item.countDocuments(query),
    ]);

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
// import { NextResponse } from "next/server";
// import { auth } from "@clerk/nextjs/server";
// import connectDB from "@/lib/mongodb";
// import Item from "@/models/item";

// export async function GET(req) {
//   try {
//     const { userId } = await auth();
//     if (!userId)
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     await connectDB();

//     const { searchParams } = new URL(req.url);

//     const parentId = searchParams.get("parentId");
//     const mode = searchParams.get("mode") || "drive";
//     console.log("mode", mode);

//     let query = {};

//     // =========================
//     // MODE-BASED FILTERING
//     // =========================
//     switch (mode) {
//       case "trash":
//         query = {
//           isTrashed: true,
//           $or: [
//             { ownerId: userId },
//             { "permissions.userId": userId },
//           ],
//         };
//         break;

//       case "starred":
//         query = {
//           isTrashed: false,
//           starredBy: userId,
//           $or: [
//             { ownerId: userId },
//             { "permissions.userId": userId },
//           ],
//         };
//         break;

//       case "shared":
//         query = {
//           isTrashed: false,
//           ownerId: { $ne: userId },
//           "permissions.userId": userId,
//         };
//         break;

//       default: // drive
//         query = {
//           isTrashed: false,
//           parentId: parentId || null,
//           $or: [
//             { ownerId: userId },
//             { "permissions.userId": userId },
//           ],
//         };
//         break;
//     }

//     console.log("q", query);
//     const items = await Item.find(query).sort({ updatedAt: -1 });
//     console.log("f", items);

//     return NextResponse.json({ items });

//   } catch (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

// =======================
// POST: create folder/file
// =======================
export async function POST(req) {
  try {
    await connectDB();

    // const { userId } = await auth();
    const user = await currentUser();
    // console.log("current user:", user);

    if (!user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    // console.log("body:", body);

    const {
      name,
      type,
      // ownerEmail // ✅ FIX: from Clerk
      parentId,
      color,
      mimeType,
      size,
    } = body;

    console.log("body destructured:", body);
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
      ownerId: user.id, // ✅ FIX: from Clerk
      ownerEmail: user.emailAddresses[0].emailAddress || null,
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