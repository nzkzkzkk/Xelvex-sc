import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CheckoutForm } from "@/components/marketplace/CheckoutForm";
import { CheckoutSteps } from "@/components/marketplace/CheckoutSteps";
import { getCurrentUser } from "@/lib/auth";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { label: "หน้าแรก", href: "/" },
          { label: "ตะกร้าสินค้า", href: "/cart" },
          { label: "ชำระเงิน" },
        ]}
      />
      <h1 className="mt-4 mb-6 text-3xl font-extrabold tracking-tight text-foreground">ชำระเงิน</h1>
      <CheckoutSteps current="checkout" />
      <CheckoutForm />
    </div>
  );
}
