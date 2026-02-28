import logo from './assets/logo.png'
import RouteMap from './components/map/RouteMap'

function App() {
  return (
    <div className="h-screen flex flex-col bg-zinc-100 font-body">
      {/* Header */}
      <header className="shrink-0 bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <nav className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center space-x-4">
              <img src={logo} alt="Ascent Data Insights" className="h-10 lg:h-14 w-auto" />
              <div className="h-8 w-px bg-gray-300" />
              <span className="font-heading text-xl lg:text-2xl font-semibold text-primary">
                Routing Tech Demo
              </span>
            </div>
          </div>
        </nav>
      </header>

      {/* Two-panel layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel — Configuration sidebar */}
        <aside className="w-80 shrink-0 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <h2 className="font-heading text-lg font-semibold text-primary mb-4">Configuration</h2>
          <p className="text-sm text-gray-500">Controls will go here.</p>
        </aside>

        {/* Right panel — Map */}
        <main className="flex-1 min-w-0">
          <RouteMap sources={[]} destinations={[]} routes={[]} />
        </main>
      </div>
    </div>
  )
}

export default App
