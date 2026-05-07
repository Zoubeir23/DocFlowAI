import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import doctorData from '@/data/doctor.json'

export const metadata: Metadata = {
  title: `${doctorData.name} | ${doctorData.specialty}`,
  description: `${doctorData.name}, ${doctorData.title} — Board-certified ${doctorData.specialty} with ${doctorData.experience} of experience. Specializing in interventional cardiology, TAVR, and preventive heart care in Boston, MA.`,
  keywords: [
    'cardiologist',
    'heart specialist',
    'interventional cardiology',
    'TAVR',
    'coronary angioplasty',
    'Boston cardiologist',
    'heart disease treatment',
    doctorData.name,
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-950 text-slate-100">
        <Header />
        <main>{children}</main>
        <Footer />

        {/* <!-- MedBook AI Widget --> */}
        <iframe
          src="http://localhost:3000/widget/theblockchaincoders"
          style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            width: '420px',
            height: '680px',
            border: 'none',
            zIndex: 9999,
            background: 'transparent',
          }}
          allow="clipboard-write"
        />
      </body>
    </html>
  )
}
