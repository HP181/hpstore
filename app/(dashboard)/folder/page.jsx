import DriveView from "@/components/drive/DriveView";

const FolderPage = async ({ params }) => {
  const { id } = await params;
  return <DriveView folderId={id} />;
}

export default FolderPage;