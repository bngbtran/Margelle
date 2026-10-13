import { Library } from '@/components/library'
import { SignIn } from '@/components/sign-in'
import { useAuth } from '@/hooks/use-auth'

function App() {
  const { state, signIn, signOut } = useAuth()

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="animate-pulse font-serif text-3xl text-muted-foreground">
          Margelle
        </p>
      </div>
    )
  }

  if (state.status === 'signed-out') return <SignIn onSignIn={signIn} />

  const user = state.status === 'signed-in' ? state.user : null
  return <Library key={user?.uid ?? 'local'} user={user} onSignOut={signOut} />
}

export default App
