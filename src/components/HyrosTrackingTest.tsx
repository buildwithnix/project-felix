'use client'

import { useEffect, useState } from 'react'

const HyrosTrackingTest = () => {
  const [trackingStatus, setTrackingStatus] = useState<string>('Checking...')

  useEffect(() => {
    // Check if Hyros script is loaded after a short delay
    const checkHyrosScript = () => {
      const hyrosScript = document.querySelector('script[src*="hyros.com"]')
      if (hyrosScript) {
        setTrackingStatus('✅ Hyros tracking script loaded successfully')
      } else {
        setTrackingStatus('❌ Hyros tracking script not found')
      }
    }

    // Check immediately and after a delay to ensure script has time to load
    checkHyrosScript()
    const timer = setTimeout(checkHyrosScript, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded-lg text-sm z-50">
      <div className="font-semibold">Hyros Tracking Status:</div>
      <div>{trackingStatus}</div>
    </div>
  )
}

export default HyrosTrackingTest