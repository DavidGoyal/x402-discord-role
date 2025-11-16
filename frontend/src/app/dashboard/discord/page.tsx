import axios, { AxiosError } from "axios";
import React from "react";
import AdminDashboard from "./client";
import { cookies } from "next/headers";
import { MyServer } from "@/types/discord";

async function getMyServers(): Promise<MyServer[]> {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("x402roleaccess-siwe");

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_DISCORD_APP_URL}/api/server/my-servers`,
      {
        headers: {
          Cookie: authCookie ? `x402roleaccess-siwe=${authCookie.value}` : "",
        },
        withCredentials: true,
      }
    );
    return response.data.servers;
  } catch (error) {
    console.error(error instanceof AxiosError ? error.response?.data : error);
    return [];
  }
}

export default async function Home() {
  const servers = await getMyServers();
  return <AdminDashboard servers={servers} />;
}
