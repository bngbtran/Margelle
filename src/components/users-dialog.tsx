import { Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  OWNER_EMAIL,
  removeUser,
  subscribeMembers,
  subscribeProfiles,
} from '@/lib/access'
import type { Member, Profile } from '@/lib/types'

interface UsersDialogProps {
  // How much each person has added, by their uid.
  playlistCounts: Map<string, number>
  quoteCounts: Map<string, number>
  onClose: () => void
}

interface Row {
  email: string
  profile: Profile | undefined
  owner: boolean
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Owner only: everyone with access to the shelf, and a way to take it away.
export function UsersDialog({
  playlistCounts,
  quoteCounts,
  onClose,
}: UsersDialogProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [removing, setRemoving] = useState<Row | null>(null)

  useEffect(() => {
    const fail = (error: Error) =>
      toast.error('Không tải được danh sách', { description: error.message })
    const stopMembers = subscribeMembers(setMembers, fail)
    const stopProfiles = subscribeProfiles(setProfiles, fail)
    return () => {
      stopMembers()
      stopProfiles()
    }
  }, [])

  const rows = useMemo(() => {
    const byEmail = new Map(
      profiles.filter((p) => p.email).map((p) => [p.email, p]),
    )
    const owner: Row = {
      email: OWNER_EMAIL,
      profile: byEmail.get(OWNER_EMAIL),
      owner: true,
    }
    return [
      owner,
      ...members.map((member) => ({
        email: member.email,
        profile: byEmail.get(member.email),
        owner: false,
      })),
    ]
  }, [members, profiles])

  function confirmRemove() {
    if (!removing) return
    removeUser(removing.email, removing.profile?.uid ?? null).then(
      () => toast.success('Đã xoá người dùng'),
      (error: Error) =>
        toast.error('Không xoá được', { description: error.message }),
    )
    setRemoving(null)
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">
              Quản lý người dùng
            </DialogTitle>
            <DialogDescription>
              {members.length} người được mời. Xoá một người sẽ lấy lại quyền
              vào kệ sách của họ; playlist và trích dẫn họ đã đóng góp vẫn được
              giữ lại.
            </DialogDescription>
          </DialogHeader>

          <ul className="grid gap-1">
            {rows.map((row) => {
              const uid = row.profile?.uid ?? ''
              return (
                <li
                  key={row.email}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted"
                >
                  {row.profile?.photoURL ? (
                    <img
                      src={row.profile.photoURL}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="size-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-muted-foreground">
                      {(row.profile?.name || row.email).charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <span className="truncate">
                        {row.profile?.name || 'Chưa đăng nhập lần nào'}
                      </span>
                      {row.owner && (
                        <span className="shrink-0 rounded-full bg-brand/15 px-2 py-0.5 text-[0.7rem] font-medium text-brand">
                          Chủ kệ sách
                        </span>
                      )}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {row.email}
                    </p>
                    {row.profile && (
                      <p className="text-xs text-muted-foreground">
                        {playlistCounts.get(uid) ?? 0} playlist ·{' '}
                        {quoteCounts.get(uid) ?? 0} trích dẫn · vào lần cuối{' '}
                        {formatDate(row.profile.lastSeenAt)}
                      </p>
                    )}
                  </div>
                  {!row.owner && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Xoá ${row.email}`}
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setRemoving(row)}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá {removing?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              Người này sẽ không vào được kệ sách nữa, kể cả khi đang mở sẵn.
              Playlist và trích dẫn họ đã thêm vẫn nằm trên kệ. Muốn cho họ
              vào lại thì mời lại bằng đúng email này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>Xoá</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
