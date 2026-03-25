export default function Coach() {
  return (
    <div className="space-y-10">
      <header>
        <h2 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">
          Coach Chat
        </h2>
        <p className="text-on-surface-variant mt-2">
          Strategizing with your AI Chief of Staff
        </p>
      </header>

      {/* Empty state */}
      <div className="bg-surface-container rounded-2xl p-10 text-center space-y-4">
        <p className="text-on-surface-variant text-lg leading-relaxed max-w-md mx-auto">
          Your AI business coach will be available here. Ask anything about your operations, pricing, staffing, or growth strategy.
        </p>
        <p className="text-on-surface-variant/60 text-sm">
          Coming in Phase 4
        </p>
      </div>
    </div>
  )
}
