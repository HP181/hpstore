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

    // Build breadcrumb from path array
    const breadcrumbs = [];
    if (item.path && item.path.length > 0) {
      const ancestors = await Item.find({ _id: { $in: item.path } }).lean();
      // Sort by path order
      for (const id of item.path) {
        const ancestor = ancestors.find((a) => a._id.toString() === id);
        if (ancestor) breadcrumbs.push({ _id: ancestor._id, name: ancestor.name, type: ancestor.type });
      }
    }
    breadcrumbs.push({ _id: item._id, name: item.name, type: item.type });

    return NextResponse.json({ breadcrumbs });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}