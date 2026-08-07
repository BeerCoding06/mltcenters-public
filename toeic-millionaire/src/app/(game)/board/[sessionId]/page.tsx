import { redirect } from "next/navigation";

/** Legacy Monopoly board route — quiz-show hot seat replaces it. */
export default function BoardPage() {
  redirect("/hotseat");
}
