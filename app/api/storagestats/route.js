import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/lib/mongodb";
import Item from "@/models/item";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const stats = await Item.aggregate([
      { $match: { ownerId: userId, type: "file", isTrashed: false } },
      {
        $group: {
          _id: null,
          totalSize: { $sum: "$size" },
          fileCount: { $sum: 1 },
          byType: {
            $push: { mimeType: "$mimeType", size: "$size" },
          },
        },
      },
    ]);

    const folderCount = await Item.countDocuments({
      ownerId: userId,
      type: "folder",
      isTrashed: false,
    });

    const result = stats[0] || { totalSize: 0, fileCount: 0, byType: [] };

    // Group by category
    const categories = { images: 0, videos: 0, audio: 0, documents: 0, others: 0 };
    result.byType?.forEach(({ mimeType, size }) => {
      if (mimeType?.startsWith("image/")) categories.images += size;
      else if (mimeType?.startsWith("video/")) categories.videos += size;
      else if (mimeType?.startsWith("audio/")) categories.audio += size;
      else if (
        mimeType?.includes("pdf") ||
        mimeType?.includes("word") ||
        mimeType?.includes("document") ||
        mimeType?.includes("text/")
      )
        categories.documents += size;
      else categories.others += size;
    });

    return NextResponse.json({
      totalSize: result.totalSize,
      fileCount: result.fileCount,
      folderCount,
      categories,
      // 15GB limit (free tier simulation)
      limit: 15 * 1024 * 1024 * 1024,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}