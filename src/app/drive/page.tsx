import { CreateFolderButtonContainer } from "@/components/CreateFolder";
import { FileList } from "@/components/FileList";
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
  console.log(path);
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FileUploadContainer />
          <CreateFolderButtonContainer />
          <Suspense>
            <FileListContainer path={path} />
          </Suspense>
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
  console.log(`prefix: ${prefix}`);
  const files = await getFiles(prefix);
  console.log(`files: ${files}`);
  return <FileList files={files} />;
}

async function getSession() {
  const session = await getServerSession(authOptions);
  if (session === null) {
    redirect("/login");
  }
  return session;
}
