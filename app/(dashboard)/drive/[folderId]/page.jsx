import DriveView from "@/components/drive/DriveView";

const FolderPage = async ({ params }) => {
  const { folderId } = await params;

  return (
    <div className="h-full w-full">
      <DriveView folderId={folderId} mode="drive" />
    </div>
  );
}   

export default FolderPage;