import logo from './assets/logo.png'

function App() {
  return (
    <div className="min-h-screen bg-zinc-100 font-body">
      {/* Header - matching ascent-website style */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* Content */}
      <main className="pt-20 lg:pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-primary">Content will go here.</p>
        </div>
      </main>
    </div>
  )
}

export default App
