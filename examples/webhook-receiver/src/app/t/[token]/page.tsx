import { InboxClient } from "./inbox-client";

export default async function InboxPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InboxClient token={token} />;
}
