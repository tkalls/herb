import { BuyerTraceContent } from "./_components";

export const metadata = {
  robots: "noindex, nofollow",
};

export default async function BuyerTracePage({
  params,
}: {
  params: Promise<{ batchCode: string }>;
}) {
  const { batchCode } = await params;
  return <BuyerTraceContent batchCode={batchCode} />;
}
