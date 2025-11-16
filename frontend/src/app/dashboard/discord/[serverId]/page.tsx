import { RoleAssigned } from "@/types/discord";
import axios from "axios";
import { notFound } from "next/navigation";
import AdminDashboard from "./client";
import { cookies } from "next/headers";

async function getServer(serverId: string): Promise<{
  serverName: string;
  rolesAssigned: RoleAssigned[];
} | null> {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("x402roleaccess-siwe");
    if (!authCookie) {
      return null;
    }
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_DISCORD_APP_URL}/api/server/my-server/${serverId}`,
      {
        headers: {
          Cookie: authCookie ? `x402roleaccess-siwe=${authCookie.value}` : "",
        },
        withCredentials: true,
      }
    );
    return {
      serverName: response.data.serverName,
      rolesAssigned: response.data.rolesAssigned,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function Home({ params }: { params: Promise<{ serverId: string }> }) {
  const { serverId } = await params;
  if (!serverId) {
    return notFound();
  }
  const server = await getServer(serverId);
  if (!server) {
    return notFound();
  }

  return (
    <AdminDashboard
      serverId={serverId}
      serverName={server.serverName}
      rolesAssigned={server.rolesAssigned}
    />
  );
}

export default Home;
