import type { Metadata } from "next";

type CryptoProjectPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: CryptoProjectPageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `${id} | Crypto Intelligence Platform`,
    description: "Project intelligence workspace.",
  };
}

export default function CryptoProjectPage() {
  // The project workspace is intentionally empty for now. The global layout
  // supplies the navbar and sidebar while project sections are built out.
  return <div className="min-h-[calc(100vh-7rem)]" aria-label="Project workspace" />;
}
