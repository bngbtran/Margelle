import { useEffect, useState } from 'react'
import { computeMetrics, type PageMetrics } from '@/lib/book'

export function usePageMetrics(): PageMetrics {
  const [metrics, setMetrics] = useState(() =>
    computeMetrics(window.innerWidth, window.innerHeight),
  )

  useEffect(() => {
    let frame = 0
    function update() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = computeMetrics(window.innerWidth, window.innerHeight)
        setMetrics((current) =>
          current.pageW === next.pageW &&
          current.pageH === next.pageH &&
          current.spread === next.spread
            ? current
            : next,
        )
      })
    }
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', update)
    }
  }, [])

  return metrics
}
