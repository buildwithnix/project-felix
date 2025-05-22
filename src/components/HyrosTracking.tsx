'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { getBaseURL, size } from '@/lib/utils'
import { useEffect } from 'react'

const HyrosTracking = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const baseUrl = getBaseURL()
    const strSearchParams = searchParams.toString()
    const url = size(strSearchParams) > 0 ? `${baseUrl}${pathname}?${strSearchParams}` : `${baseUrl}${pathname}`

    // Remove any existing Hyros script to avoid duplicates
    const existingScript = document.querySelector('script[src*="hyros.com"]')
    if (existingScript) {
      existingScript.remove()
    }

    // Create and append the new Hyros tracking script
    const script = document.createElement('script')
    script.src = `https://208238.t.hyros.com/v1/lst/universal-script?ph=b481a6180a77537ac4e16508f08d61cb446d60d48a228c70686e97c8aedf03ae&tag=!clicked&spa=true&ref_url=${encodeURIComponent(url)}`
    script.async = true
    document.head.appendChild(script)

    // Cleanup function to remove script when component unmounts
    return () => {
      const scriptToRemove = document.querySelector('script[src*="hyros.com"]')
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [pathname, searchParams])

  return null
}

export default HyrosTracking