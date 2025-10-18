import SiteNav from "@/components/site-nav";
import PredictionForm from "@/components/prediction-form";

export default function CreatePage() {
  return (
    <main>
      <SiteNav />
      <section className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-serif text-2xl md:text-3xl mb-4">
          Create a Prediction
        </h1>
        <p className="text-sm text-foreground/70 mb-6">
          Start a market for a trader’s specific position. Add an image or order
          ID, set an expiration, and choose the outcome logic.
        </p>
        <PredictionForm />
      </section>
    </main>
  );
}
