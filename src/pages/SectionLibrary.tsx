import AppLayout from "@/components/AppLayout";
import { Library } from "lucide-react";

export default function SectionLibrary() {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center py-20">
          <Library className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">
            Section Library
          </h3>
          <p className="text-muted-foreground font-body text-sm leading-relaxed">
            Save and reuse proposal sections like terms, itinerary blocks, and more. Coming soon.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
