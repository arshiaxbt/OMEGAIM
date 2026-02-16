import ErrorBoundary from "@/components/ErrorBoundary";
import GameWrapper from "@/components/GameWrapper";

export default function Home() {
  return (
    <ErrorBoundary>
      <GameWrapper />
    </ErrorBoundary>
  );
}
