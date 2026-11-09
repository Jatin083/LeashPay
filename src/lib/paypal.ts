
import "server-only";

export const PAYPAL_BASE_URL =
  process.env.PAYPAL_BASE_URL ||
  "https://api-m.sandbox.paypal.com";

export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are missing");
  }

  // Keep this integration locked to Sandbox.
  if (PAYPAL_BASE_URL !== "https://api-m.sandbox.paypal.com") {
    throw new Error("Only PayPal Sandbox is enabled");
  }

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const response = await fetch(
    `${PAYPAL_BASE_URL}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("PayPal authentication failed:", {
      status: response.status,
      error: data.error,
    });

    throw new Error("PayPal authentication failed");
  }

  if (typeof data.access_token !== "string") {
    throw new Error("PayPal did not return an access token");
  }

  return data.access_token;
}
