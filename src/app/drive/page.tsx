import { CreateFolderButtonContainer } from "@/components/CreateFolder";
import { FileListView } from "@/components/FileList";
import { FileUploadContainer } from "@/components/FileUpload";
import { Header as HeaderComponent } from "@/components/Header";
import { authOptions } from "@/lib/auth";
import { getFiles } from "@/lib/r2";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function Page({
  searchParams,
}: {
  searchParams: { path: string };
}) {
  const { path } = await searchParams;
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FileUploadContainer />
          <CreateFolderButtonContainer />
          <FileListContainer path={path} />
        </div>
      </main>
    </>
  );
}

async function Header() {
  const session = await getSession();
  return <HeaderComponent userName={session.user.name || "사용자"} />;
}

async function FileListContainer({ path }: { path?: string }) {
  const session = await getSession();
  const prefix = `${session.user.id}/${path ? `${path}/` : ""}`;
  const files = await getFiles(prefix);
  return <FileListView files={files} />;
}

async function getSession() {
  const session = await getServerSession(authOptions);
  if (session === null) {
    redirect("/login");
  }
  return session;
}
