import mongoose from "mongoose";

const PermissionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userEmail: { type: String },
  userName: { type: String },
  role: { type: String, enum: ["viewer", "editor", "owner"], default: "viewer" },
  grantedAt: { type: Date, default: Date.now },
  grantedBy: { type: String },
});

const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["folder", "file"], required: true },
    ownerId: { type: String, required: true },
    ownerEmail: { type: String },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", default: null },
    path: { type: [String], default: [] }, // Array of ancestor IDs for efficient queries
    // File-specific fields
    mimeType: { type: String },
    size: { type: Number, default: 0 },
    gridFsId: { type: mongoose.Schema.Types.ObjectId }, // GridFS file ID
    // Sharing & permissions
    permissions: { type: [PermissionSchema], default: [] },
    isPublic: { type: Boolean, default: false },
    publicToken: { type: String },
    // Soft delete
    isTrashed: { type: Boolean, default: false },
    trashedAt: { type: Date },
    trashedBy: { type: String },
    // Metadata
    lastModifiedBy: { type: String },
    description: { type: String },
    tags: { type: [String], default: [] },
    // Color for folders
    color: { type: String, default: null },
    // Star
    starredBy: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
ItemSchema.index({ ownerId: 1, parentId: 1, isTrashed: 1 });
ItemSchema.index({ ownerId: 1, type: 1, isTrashed: 1 });
ItemSchema.index({ path: 1 });
ItemSchema.index({ "permissions.userId": 1 });
ItemSchema.index({ name: "text", description: "text", tags: "text" });

export default mongoose.models.Item || mongoose.model("Item", ItemSchema);