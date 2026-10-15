import { Container } from "@/components/ui";

export default function Loading() {
  return (
    <Container className="py-24">
      <div className="space-y-5 animate-pulse">
        <div className="h-3 w-40 bg-rule" />
        <div className="h-20 w-3/4 bg-rule/70" />
        <div className="h-20 w-1/2 bg-rule/70" />
        <div className="mt-10 h-4 w-full max-w-md bg-rule/60" />
      </div>
    </Container>
  );
}