import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <section className="screen center" aria-labelledby="cancel-h">
      <div className="wrap">
        <h1 id="cancel-h" className="h2">
          Payment cancelled
        </h1>
        <p className="lede" style={{ marginTop: 16 }}>
          PayPal took no money and LeashPay recorded no payment. Your cart rules haven&apos;t changed.
        </p>
        <div className="flex flex-wrap justify-center gap-3" style={{ marginTop: 28 }}>
          <Link href="/shop" className="btn">
            Back to the shop
          </Link>
          <Link href="/orders" className="btn btn-quiet">
            See your orders
          </Link>
        </div>
      </div>
    </section>
  );
}
