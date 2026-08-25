import React from 'react'
import Navbar from '../components/Navbar.jsx'
import Hero from '../components/Hero.jsx'
import FeatureStrip from '../components/FeatureStrip.jsx'
import HowItWorks from '../components/HowItWorks.jsx'
import Footer from '../components/Footer.jsx'

function Home() {
  return (
    <div className="relative min-h-screen bg-background-primary overflow-x-hidden font-sans selection:bg-accent-primary/30 selection:text-white">
      {/* Decorative technical grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Curved tech waves glowing effect in background */}
      <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-gradient-to-t from-accent-primary/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[1px] bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent pointer-events-none" />

      <Navbar />
      <main>
        <Hero />
        <FeatureStrip />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  )
}

export default Home
