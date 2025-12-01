import { toast } from "sonner";
import SubscriptionClient from "./client";
import { cookies } from "next/headers";
import axios from "axios";
import { ServerSubscription } from "@/types/telegram";
import { notFound } from "next/navigation";

const fetchSubscription = async (
  serverId: string
): Promise<ServerSubscription | null> => {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("x402roleaccess-siwe");
    if (!authCookie) {
      return null;
    }
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_TELEGRAM_APP_URL}/api/server/my-server/${serverId}/subscription`,
      {
        headers: {
          Cookie: authCookie ? `x402roleaccess-siwe=${authCookie.value}` : "",
        },
        withCredentials: true,
      }
    );

    return response.data.subscription;
  } catch (error) {
    console.error("Error fetching subscription:", error);
    toast.error("Failed to fetch subscription");
    return null;
  }
};

export default async function SubscriptionPage({
  params,
}: {
  params: Promise<{ serverId: string }>;
}) {
  const { serverId } = await params;
  if (!serverId) {
    return notFound();
  }
  const subscription = await fetchSubscription(serverId);
  if (!subscription) {
    return notFound();
  }
  return <SubscriptionClient subscription={subscription} />;
}
