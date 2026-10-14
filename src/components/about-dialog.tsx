import { Mail } from 'lucide-react'
import { LogoMark } from '@/components/logo-mark'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const CREATOR = { name: 'TranBNB', email: 'tranbnb.2004@gmail.com' }

export function AboutDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-6 p-7 sm:max-w-xl sm:p-9">
        <DialogHeader className="items-center gap-3 text-center">
          <LogoMark className="size-14 text-brand" />
          <DialogTitle className="font-serif text-3xl">Margelle</DialogTitle>
          <DialogDescription>Về chúng tôi</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 text-[0.95rem] leading-relaxed">
          <p>
            Margelle là một kệ sách trích dẫn dùng chung: nơi gom những dòng
            chữ đáng nhớ thành từng cuốn sách nhỏ, để đọc lại và để cùng bạn bè
            góp thêm.
          </p>
          <p>
            Trong tiếng Pháp, <i>margelle</i> là thành giếng, vành đá quanh
            miệng giếng nơi người ta dừng chân và nhìn xuống làn nước sâu. Mỗi
            trích dẫn cũng là một lần dừng lại như thế.
          </p>
        </div>

        <div className="border-t pt-5">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            Người tạo
          </p>
          <p className="mt-1.5 font-serif text-xl">{CREATOR.name}</p>
          <a
            href={`mailto:${CREATOR.email}`}
            className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <Mail className="size-4" />
            {CREATOR.email}
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}
