import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full px-4 py-5 sm:px-8 shadow-sm bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-blue-600">
              <path d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 0 0-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 0 0 0-1.5H5.378A2.25 2.25 0 0 1 7.5 15h11.218a.75.75 0 0 0 .674-.421 60.358 60.358 0 0 0 2.96-7.228.75.75 0 0 0-.525-.965A60.864 60.864 0 0 0 5.68 4.509l-.232-.867A1.875 1.875 0 0 0 3.636 2.25H2.25Z" />
              <path d="M3.75 20.25a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM16.5 20.25a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
            </svg>
            <span className="font-bold text-xl sm:text-2xl">Trip Sliptos</span>
          </div>
          <nav className="hidden sm:flex space-x-6 items-center text-sm">
            <Link href="/trips" className="hover:text-blue-600 transition-colors">My Trips</Link>
            <Link href="/login" className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-4 py-2 rounded-lg">
              Get Started
            </Link>
          </nav>
          <Link href="/login" className="sm:hidden bg-blue-600 hover:bg-blue-700 transition-colors text-white px-3 py-1.5 text-sm rounded-lg">
            Login
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center px-4 pt-12 pb-20 sm:pt-20 max-w-7xl mx-auto w-full">

        {/* Hero Section */}
        <div className="w-full flex flex-col md:flex-row items-center gap-8 md:gap-12 mb-16">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Split Trip Expenses <span className="text-blue-600">Effortlessly</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-xl">
              Track, split, and settle expenses with friends, family, or colleagues during your trips. No more awkward money conversations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link 
                href="/login" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-6 py-3 text-center transition-colors"
              >
                Start a New Trip
              </Link>
              <Link 
                href="/trips" 
                className="bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg px-6 py-3 text-center transition-colors"
              >
                View My Trips
              </Link>
            </div>
          </div>
          <div className="flex-1 max-w-md">
            <div className="relative w-full aspect-square">
              <div className="absolute top-0 right-0 w-4/5 h-4/5 bg-blue-600/10 rounded-lg"></div>
              <div className="absolute bottom-0 left-0 w-4/5 h-4/5 bg-blue-600 rounded-lg overflow-hidden flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-1/2 h-1/2">
                  <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 01-.921.42z" />
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 01-.921-.421l-.879-.66a.75.75 0 00-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 001.5 0v-.81a4.124 4.124 0 001.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 00-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 00.933-1.175l-.415-.33a3.836 3.836 0 00-1.719-.755V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="w-full py-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-10 text-center">How Trip Sliptos Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-600">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create a Trip</h3>
              <p className="text-gray-600 dark:text-gray-300">Start by creating a trip and inviting friends to join. Everyone can see the trip details in real-time.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-600">
                  <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" />
                  <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Add Expenses</h3>
              <p className="text-gray-600 dark:text-gray-300">Log expenses as you go. Specify who paid and who should share in the cost with just a few taps.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-600">
                  <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zM9.75 14.25a.75.75 0 000 1.5H15a.75.75 0 000-1.5H9.75z" clipRule="evenodd" />
                  <path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Settle Up</h3>
              <p className="text-gray-600 dark:text-gray-300">See who owes what at the end of the trip. We'll calculate the simplest way to settle all debts.</p>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="w-full py-12 mb-4">
          <div className="bg-blue-600 rounded-xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-blue-100 mb-6 max-w-xl mx-auto">Join thousands of travelers who use Trip Sliptos to make group expenses hassle-free.</p>
            <Link 
              href="/login" 
              className="inline-block bg-white text-blue-600 hover:bg-blue-50 font-medium rounded-lg px-6 py-3 transition-colors"
            >
              Create Your First Trip
            </Link>
          </div>
        </section>
      </main>
      
      <footer className="w-full px-4 py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-600">
                <path d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 0 0-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 0 0 0-1.5H5.378A2.25 2.25 0 0 1 7.5 15h11.218a.75.75 0 0 0 .674-.421 60.358 60.358 0 0 0 2.96-7.228.75.75 0 0 0-.525-.965A60.864 60.864 0 0 0 5.68 4.509l-.232-.867A1.875 1.875 0 0 0 3.636 2.25H2.25Z" />
                <path d="M3.75 20.25a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM16.5 20.25a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
              </svg>
              <span className="font-medium">Trip Sliptos</span>
            </div>
            <div className="flex flex-wrap gap-6 justify-center text-sm text-gray-600 dark:text-gray-400">
              <Link href="/trips" className="hover:text-blue-600 transition-colors">My Trips</Link>
              <Link href="/login" className="hover:text-blue-600 transition-colors">Sign In</Link>
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            © {new Date().getFullYear()} Trip Sliptos. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
