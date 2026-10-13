import { X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { addMember, removeMember, subscribeMembers } from '@/lib/access'
import type { Member } from '@/lib/types'

// Lets the owner decide which Google accounts may read and add to the shelf.
export function MembersDialog({ onClose }: { onClose: () => void }) {
  const [members, setMembers] = useState<Member[]>([])
  const [email, setEmail] = useState('')

  useEffect(
    () =>
      subscribeMembers(setMembers, (error) =>
        toast.error('Không tải được danh sách', { description: error.message }),
      ),
    [],
  )

  function handleAdd(event: FormEvent) {
    event.preventDefault()
    const value = email.trim().toLowerCase()
    if (!value) return
    addMember(value).catch((error: Error) =>
      toast.error('Không mời được', { description: error.message }),
    )
    setEmail('')
  }

  function handleRemove(member: Member) {
    removeMember(member.email).catch((error: Error) =>
      toast.error('Không gỡ được', { description: error.message }),
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">Người đóng góp</DialogTitle>
          <DialogDescription>
            Những tài khoản Google dưới đây được xem kệ sách và thêm trích dẫn.
            Mỗi người chỉ sửa, xoá được phần mình thêm.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ten@gmail.com"
            aria-label="Email người được mời"
            autoComplete="off"
            required
          />
          <Button type="submit">Mời</Button>
        </form>

        {members.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            Chưa mời ai. Hiện chỉ có bạn dùng kệ sách này.
          </p>
        ) : (
          <ul className="grid gap-1">
            {members.map((member) => (
              <li
                key={member.email}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-muted"
              >
                <span className="truncate text-sm">{member.email}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Gỡ ${member.email}`}
                  onClick={() => handleRemove(member)}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
