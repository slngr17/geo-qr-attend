import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  QrCode, 
  MapPin, 
  ShieldCheck, 
  BarChart3, 
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <QrCode size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight">SmartAttendX</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate('/sign-in')}>Login</Button>
            <Button onClick={() => navigate('/sign-up')}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow pt-16">
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,var(--color-primary)_0%,transparent_100%)] opacity-10" />
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
                  Smart Attendance <br />
                  <span className="text-primary">Simplified.</span>
                </h1>
                <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-lg">
                  Automate your classroom attendance with geofencing and dynamic QR codes. Secure, real-time, and mobile-ready.
                </p>
                <div className="mt-10 flex items-center gap-x-6">
                  <Button size="lg" className="rounded-full px-8" onClick={() => navigate('/sign-up')}>
                    Start for Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="link" size="lg" className="font-semibold">
                    View Demo
                  </Button>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative"
              >
                <div className="relative rounded-2xl border bg-card/50 p-2 shadow-2xl backdrop-blur-sm overflow-hidden">
                  <img 
                    src="https://storage.googleapis.com/dala-prod-public-storage/generated-images/0a5d0f18-2d4a-4e49-8945-9d05e412958e/smart-classroom-background-8ba2240a-1778337095123.webp" 
                    alt="Smart Attendance Interface" 
                    className="rounded-xl object-cover aspect-[4/3] w-full"
                  />
                  <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4 rounded-xl bg-background/90 p-4 shadow-lg backdrop-blur-md border border-white/20">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 text-green-500">
                      <ShieldCheck size={28} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Attendance Verified</p>
                      <p className="text-xs text-muted-foreground">Location: Inside Geofence (Radius 50m)</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to manage attendance</h2>
              <p className="mt-4 text-muted-foreground">Cutting-edge technology to make life easier for instructors and students.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'Geofencing Technology',
                  desc: 'Ensure students are physically present in the classroom using precise GPS location verification.',
                  icon: <MapPin className="text-primary" size={24} />,
                },
                {
                  title: 'Dynamic QR Codes',
                  desc: 'Generate temporary QR codes that expire, preventing remote scanning or code sharing.',
                  icon: <QrCode className="text-primary" size={24} />,
                },
                {
                  title: 'Real-time Analytics',
                  desc: 'Instantly view attendance rates and export detailed reports for your courses.',
                  icon: <BarChart3 className="text-primary" size={24} />,
                }
              ].map((feature, i) => (
                <div key={i} className="rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-md">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="mx-auto max-w-7xl px-4 text-center text-muted-foreground sm:px-6 lg:px-8">
          <p>© 2025 SmartAttendX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
