import { auth} from "../../../../auth" ;

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  return new Response("Hello World! , "+session.user.email);
}