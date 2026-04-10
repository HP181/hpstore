import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/lib/mongodb";
import Item from "@/models/item";
import { getGridFSBucket } from "@/lib/gridfs";
import mongoose from "mongoose";

export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const param = await params;
    const item = await Item.findById(param.id).lean();
    if (!item || item.type !== "file") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check permission
    const isOwner = item.ownerId === userId;
    const hasPerm = item.permissions?.some((p) => p.userId === userId);
    if (!isOwner && !hasPerm && !item.isPublic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!item.gridFsId) {
      return NextResponse.json({ error: "File data not found" }, { status: 404 });
    }

    const bucket = getGridFSBucket();
    const objectId = new mongoose.Types.ObjectId(item.gridFsId);

    // Support range requests for video streaming
    const rangeHeader = request.headers.get("range");

    if (rangeHeader) {
      // Get file size from GridFS
      const files = await bucket.find({ _id: objectId }).toArray();
      if (!files.length) return NextResponse.json({ error: "File not found in storage" }, { status: 404 });

      const fileSize = files[0].length;
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const downloadStream = bucket.openDownloadStream(objectId, { start, end: end + 1 });
      const chunks = [];

      await new Promise((resolve, reject) => {
        downloadStream.on("data", (chunk) => chunks.push(chunk));
        downloadStream.on("end", resolve);
        downloadStream.on("error", reject);
      });

      const buffer = Buffer.concat(chunks);

      return new NextResponse(buffer, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": item.mimeType || "application/octet-stream",
        },
      });
    }

    // Regular download
    const downloadStream = bucket.openDownloadStream(objectId);
    const chunks = [];

    await new Promise((resolve, reject) => {
      downloadStream.on("data", (chunk) => chunks.push(chunk));
      downloadStream.on("end", resolve);
      downloadStream.on("error", reject);
    });

    const buffer = Buffer.concat(chunks);
    const { searchParams } = new URL(request.url);
    const inline = searchParams.get("inline") === "true";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": item.mimeType || "application/octet-stream",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${item.name}"`,
        "Content-Length": buffer.length.toString(),
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}