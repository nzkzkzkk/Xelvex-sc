import { redirect } from "next/navigation";
import { PaymentResultFlow } from "@/components/marketplace/PaymentResultFlow";
import { getCurrentUser } from "@/lib/auth";

export default async function PaymentResultPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/orders/${orderNumber}/result`);

  return <PaymentResultFlow orderNumber={orderNumber} />;
}
