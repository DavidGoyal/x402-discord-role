import { cookies } from "next/headers";

export async function POST() {
  try {
    (await cookies()).delete("x402roleaccess-siwe");
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
