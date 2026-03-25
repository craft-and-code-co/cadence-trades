import { Icon } from '@/components/ui/icon'

export function TopBar() {
  return (
    <header className="flex justify-end items-center w-full px-10 py-6 sticky top-0 z-30 glass-surface">
      <div className="flex items-center gap-6">
        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <Icon name="sync" size={22} />
        </button>
        <button className="text-on-surface-variant hover:text-primary transition-colors relative">
          <Icon name="notifications" size={22} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary-container rounded-full ring-2 ring-surface" />
        </button>
        <div className="w-px h-6 bg-outline-variant/30" />
        <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center">
          <Icon name="person" size={18} className="text-on-surface-variant" />
        </div>
      </div>
    </header>
  )
}
