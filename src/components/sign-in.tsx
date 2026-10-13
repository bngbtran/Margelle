import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function SignIn({ onSignIn }: { onSignIn: () => Promise<void> }) {
  const [pending, setPending] = useState(false)

  async function handleSignIn() {
    setPending(true)
    try {
      await onSignIn()
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code !== 'auth/popup-closed-by-user') {
        toast.error('Không đăng nhập được', {
          description: (error as Error).message,
        })
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <span
        aria-hidden
        className="font-serif text-8xl leading-[0.6] text-brand/60 select-none"
      >
        “
      </span>
      <h1 className="font-serif text-5xl font-medium tracking-tight">
        Margelle
      </h1>
      <p className="mt-4 max-w-sm font-serif text-lg text-muted-foreground italic">
        Nơi giữ lại những dòng chữ đáng nhớ từ những cuốn sách bạn đọc.
      </p>
      <Button size="lg" className="mt-8 px-5" onClick={handleSignIn} disabled={pending}>
        {pending ? 'Đang đăng nhập…' : 'Đăng nhập bằng Google'}
      </Button>
    </main>
  )
}
