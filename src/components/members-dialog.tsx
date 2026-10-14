import { X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { OWNER_EMAIL, addMember, subscribeMembers } from '@/lib/access'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Lets the owner invite Google accounts, one or several at a time. People
// already invited are managed in "Quản lý người dùng", not here.
export function MembersDialog({ onClose }: { onClose: () => void }) {
  const [invited, setInvited] = useState<Set<string>>(new Set())
  const [draft, setDraft] = useState('')
  // Addresses queued up to be invited together.
  const [queue, setQueue] = useState<string[]>([])
  const [sending, setSending] = useState(false)

  useEffect(
    () =>
      subscribeMembers(
        (members) => setInvited(new Set(members.map((m) => m.email))),
        (error) =>
          toast.error('Không tải được danh sách', {
            description: error.message,
          }),
      ),
    [],
  )

  // Returns the address if it can be queued, otherwise says why not.
  function check(value: string): string | null {
    const email = value.trim().toLowerCase()
    if (!EMAIL.test(email)) {
      toast.error('Email không hợp lệ', { description: value.trim() })
    } else if (email === OWNER_EMAIL) {
      toast.info('Đây là tài khoản chủ kệ sách')
    } else if (invited.has(email)) {
      toast.info('Người này đã được mời', { description: email })
    } else {
      return email
    }
    return null
  }

  function handleAdd(event: FormEvent) {
    event.preventDefault()
    const email = check(draft)
    if (!email) return
    if (!queue.includes(email)) setQueue([...queue, email])
    setDraft('')
  }

  async function handleInvite() {
    let emails = queue
    // A typed address that was not added yet is invited too.
    if (draft.trim()) {
      const email = check(draft)
      if (!email) return
      if (!emails.includes(email)) emails = [...emails, email]
    }
    if (emails.length === 0) return
    setSending(true)
    try {
      await Promise.all(emails.map((email) => addMember(email)))
      toast.success(
        emails.length === 1
          ? `Đã mời ${emails[0]}`
          : `Đã mời ${emails.length} người`,
      )
      setQueue([])
      setDraft('')
    } catch (error) {
      toast.error('Không mời được', { description: (error as Error).message })
    } finally {
      setSending(false)
    }
  }

  const total = queue.length + (draft.trim() ? 1 : 0)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">Mời người dùng</DialogTitle>
          <DialogDescription>
            Nhập email Google của người bạn muốn mời. Có thể thêm nhiều người
            rồi mời một lượt. Người đã được mời nằm trong Quản lý người dùng.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            type="email"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="ten@gmail.com"
            aria-label="Email người được mời"
            autoComplete="off"
          />
          <Button type="submit" variant="outline" disabled={!draft.trim()}>
            Thêm
          </Button>
        </form>

        {queue.length > 0 && (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">
              Chờ mời ({queue.length})
            </p>
            <ul className="grid gap-1">
              {queue.map((email) => (
                <li
                  key={email}
                  className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-1.5"
                >
                  <span className="truncate text-sm">{email}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Bỏ ${email}`}
                    onClick={() => setQueue(queue.filter((e) => e !== email))}
                  >
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button
            type="button"
            disabled={total === 0 || sending}
            onClick={handleInvite}
          >
            {sending ? 'Đang mời…' : total > 1 ? `Mời ${total} người` : 'Mời'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
