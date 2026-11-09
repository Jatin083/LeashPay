import { Suspense } from "react";
import CaptureStatus from "./CaptureStatus";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// PayPal sends the buyer back here with ?token=<orderId>.
async function ReturnContent({ searchParams }: { searchParams: SearchParams }) {
  const { token } = await searchParams;
  const orderId = typeof token === "string" ? token : null;

  return <CaptureStatus orderId={orderId} />;
}

export default function CheckoutReturnPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<section className="screen" />}>
      <ReturnContent searchParams={searchParams} />
    </Suspense>
  );
}
