# Margelle

Nơi lưu giữ những trích dẫn từ sách bạn đọc. Chỉ có frontend (React + Vite + Tailwind + shadcn/ui) nói chuyện thẳng với Firestore, không có backend.

## Chạy thử

```bash
npm install
npm run dev
```

Khi chưa có cấu hình Firebase, app chạy ở **chế độ cục bộ**: trích dẫn chỉ được lưu trong trình duyệt đang dùng (localStorage).

## Kết nối Firebase

1. Tạo project tại [Firebase Console](https://console.firebase.google.com) (gói Spark miễn phí).
2. **Build → Firestore Database → Create database** (chế độ production).
3. **Build → Authentication → Sign-in method** → bật **Google**.
4. **Project settings → Your apps → Web app** → đăng ký app và lấy đoạn `firebaseConfig`.
5. Sao chép `.env.example` thành `.env.local` rồi điền các giá trị tương ứng.
6. Triển khai luật bảo mật (bắt buộc, nếu không sẽ không đọc/ghi được):

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules --project <project-id>
   ```

Trích dẫn nằm ở `users/{uid}/quotes/{id}`; [firestore.rules](firestore.rules) chỉ cho mỗi tài khoản đọc và ghi dữ liệu của chính mình.

## Triển khai

```bash
npm run build
npx firebase-tools deploy --only hosting --project <project-id>
```

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy máy chủ phát triển |
| `npm run build` | Kiểm tra kiểu và build ra `dist/` |
| `npm run lint` | Chạy oxlint |
