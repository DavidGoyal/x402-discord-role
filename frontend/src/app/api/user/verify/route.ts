import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { SiweMessage } from "siwe";

export async function POST(request: Request) {
  try {
    const { message, signature } = await request.json();
    const siweMessage = new SiweMessage(message);
    const { data } = await siweMessage.verify({ signature });
    const encryptedAddress = jwt.sign(data.address, process.env.JWT_SECRET!);

    (await cookies()).set("x402roleaccess-siwe", encryptedAddress, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 60,
    });
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.log(error);
    return Response.json({ success: false }, { status: 400 });
  }
}
