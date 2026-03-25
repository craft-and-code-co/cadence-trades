import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { TopBar } from './TopBar'

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64">
        <TopBar />
        <main className="flex-1 p-8 md:p-12 pt-4 pb-24 md:pb-12">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
