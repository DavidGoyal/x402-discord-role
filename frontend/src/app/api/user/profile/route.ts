import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    const cookie = (await cookies()).get("x402roleaccess-siwe");
    const isLoggedIn = cookie !== undefined;

    if (!isLoggedIn) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const address = jwt.verify(cookie?.value, process.env.JWT_SECRET!) as {
      address: string;
    };

    if (!address) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
