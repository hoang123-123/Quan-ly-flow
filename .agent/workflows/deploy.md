---
description: Kiểm tra trước khi push vào github
---

# Workflow: Pre-flight Check & Auto-Push

## Mục tiêu
Đảm bảo code sạch, không lỗi build và bảo mật trước khi đẩy lên nhánh `main`.

## Các bước thực hiện
1. **Linting & Formatting**: 
   - Chạy `npm run lint`. 
   - Nếu có lỗi, Agent tự động sửa bằng `npm run lint -- --fix`.
2. **Environment Check**: 
   - Kiểm tra file `.env.local` hoặc `.env`.
   - Đảm bảo các biến VITE quan trọng (Client ID, Tenant ID...) đã được khai báo.
3. **Build Test**: 
   - Chạy `npm run build` cục bộ.
   - **Nếu lỗi**: Agent đọc log lỗi, phân tích file gây lỗi và tiến hành sửa lỗi logic/cú pháp. Lặp lại build cho đến khi thành công.
4. **Git Finalize**: 
   - Chạy `git add .`
   - Tạo commit với message theo chuẩn: `feat/fix: [mô tả ngắn gọn lỗi đã sửa hoặc tính năng]`.
5. **Push to GitHub**:
   - Chạy `git push origin main`.
   - Thông báo cho người dùng sau khi hoàn tất.