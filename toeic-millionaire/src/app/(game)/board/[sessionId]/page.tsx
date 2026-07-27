import { BoardGame } from "@/features/board/BoardGame";

interface BoardPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { sessionId } = await params;
  return <BoardGame sessionId={sessionId} />;
}
