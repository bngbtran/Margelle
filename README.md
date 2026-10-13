# Margelle

Kệ sách trích dẫn dùng chung. Mỗi playlist là một cuốn sách trên kệ, mỗi trích dẫn bắt đầu ở một trang mới, và chân trang ghi tên người đã đóng góp trích dẫn đó.

Chỉ có frontend (React + Vite + Tailwind + shadcn/ui) nói chuyện thẳng với Firestore, không có backend.

## Chạy thử

```bash
npm install
npm run dev
```

Khi chưa có cấu hình Firebase, app chạy ở **chế độ cục bộ**: dữ liệu chỉ được lưu trong trình duyệt đang dùng (localStorage).

## Kết nối Firebase

1. Tạo project tại [Firebase Console](https://console.firebase.google.com) (gói Spark miễn phí).
2. **Build → Firestore Database → Create database** (Standard edition, chế độ production).
3. **Build → Authentication → Sign-in method** → bật **Google**.
4. **Project settings → Your apps → Web app** → đăng ký app và lấy đoạn `firebaseConfig`.
5. Sao chép `.env.example` thành `.env.local` rồi điền các giá trị tương ứng.
6. Triển khai luật bảo mật (bắt buộc, nếu không sẽ không đọc/ghi được):

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules
   ```

## Ai được dùng kệ sách

- **Chủ kệ sách** là tài khoản đầu tiên đăng nhập sau khi luật bảo mật được triển khai. Hãy tự đăng nhập ngay sau bước 6.
- **Người đóng góp** là những tài khoản Google được chủ kệ sách mời bằng email (menu tài khoản → Người đóng góp). Họ xem được mọi cuốn sách, tạo playlist và thêm trích dẫn, nhưng chỉ sửa hoặc xoá phần mình thêm.
- Tài khoản chưa được mời sẽ không đọc được gì.

Toàn bộ quy tắc này nằm trong [firestore.rules](firestore.rules).

## Dữ liệu

| Collection | Nội dung |
|---|---|
| `config/library` | Tài khoản chủ kệ sách |
| `members/{email}` | Những email được mời |
| `playlists/{id}` | Một cuốn sách: tên, lời đề, màu bìa, người tạo |
| `quotes/{id}` | Một trích dẫn: nội dung, sách gốc, tác giả, các playlist chứa nó, người đóng góp |

## Triển khai

Frontend chạy trên Vercel (preset **Vite**), tự build mỗi khi push lên `main`. Cần khai báo 4 biến `VITE_FIREBASE_*` trong Vercel và thêm tên miền Vercel vào **Authentication → Settings → Authorized domains**.

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy máy chủ phát triển |
| `npm run build` | Kiểm tra kiểu và build ra `dist/` |
| `npm run lint` | Chạy oxlint |
