import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query){
        console.log("query not available");
        return NextResponse.json({ users: [] });
    }


 const client = await clerkClient();
 const users = await client.users.getUserList({
    emailAddressQuery: query,
  })

    const formatted = users.data.map((u) => ({
      id: u.id,
      email: u.emailAddresses[0]?.emailAddress,
      name: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
    }));

    return NextResponse.json({ users: formatted });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}