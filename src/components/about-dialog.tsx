import { LogoMark } from '@/components/logo-mark'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function AboutDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <LogoMark className="size-12 text-brand" />
          <DialogTitle className="font-serif text-2xl">Margelle</DialogTitle>
          <DialogDescription>Về chúng tôi</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 pb-1 text-sm leading-relaxed">
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
      </DialogContent>
    </Dialog>
  )
}
