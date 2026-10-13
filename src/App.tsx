import { Library } from '@/components/library'
import { SignIn } from '@/components/sign-in'
import { Button } from '@/components/ui/button'
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

  if (state.status === 'denied' || state.status === 'error') {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-3xl font-medium">
          {state.status === 'denied'
            ? 'Bạn chưa được mời'
            : 'Không kiểm tra được quyền truy cập'}
        </h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          {state.status === 'denied'
            ? `Tài khoản ${state.email ?? 'này'} chưa có trong danh sách người đóng góp. Hãy nhờ chủ kệ sách mời đúng địa chỉ email này.`
            : state.message}
        </p>
        <Button variant="outline" className="mt-6" onClick={signOut}>
          Đăng xuất
        </Button>
      </main>
    )
  }

  return (
    <Library
      key={state.viewer.uid}
      viewer={state.viewer}
      local={state.local}
      onSignOut={signOut}
    />
  )
}

export default App
