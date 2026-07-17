# Hướng dẫn demo SureVey

Tài liệu này dùng để chuẩn bị và thuyết trình demo cho dự án SureVey. Mục tiêu là giúp người xem hiểu rõ hệ thống có 3 vai trò, có luồng nghiệp vụ end-to-end, có phân quyền, có thanh toán, có marketplace khảo sát và có ví/rút tiền.

## 1. Tổng quan hệ thống

SureVey là nền tảng kết nối người tạo khảo sát với người tham gia làm khảo sát.

Hệ thống có 3 vai trò chính:

- `Customer`: tạo campaign khảo sát, đặt số lượng response mục tiêu, thanh toán, theo dõi tiến độ và duyệt submission.
- `Collaborator`: xem marketplace, nhận campaign, làm khảo sát, nộp kết quả và nhận thưởng vào ví.
- `Admin`: xác minh thanh toán, duyệt campaign, quản lý yêu cầu rút tiền và theo dõi doanh thu nền tảng.

## 2. Điểm nổi bật khi demo

- Đăng nhập theo role và dashboard hiển thị khác nhau theo từng role.
- Customer có thể tạo campaign và theo dõi tiến độ response đã đặt.
- Admin có dashboard quản trị gồm thanh toán, campaign chờ duyệt và rút tiền.
- Collaborator có marketplace để nhận campaign và trang công việc/ví để theo dõi tiền thưởng.
- Dữ liệu hiển thị lấy từ backend, không cần hard-code số liệu trên giao diện.

## 3. Tài khoản demo

Điền tài khoản demo thật của nhóm vào bảng bên dưới trước khi thuyết trình.

| Vai trò | Email | Mật khẩu | Ghi chú |
| --- | --- | --- | --- |
| Admin | `admin@example.com` | `123456` | Xác minh thanh toán, duyệt campaign, xử lý rút tiền |
| Customer | `customer@example.com` | `123456` | Tạo campaign, thanh toán, theo dõi response |
| Collaborator | `collaborator@example.com` | `123456` | Nhận campaign, nộp submission, xem ví |

## 4. Chuẩn bị dữ liệu trước demo

Nên có sẵn dữ liệu ở nhiều trạng thái để khi demo giao diện trông đầy đủ hơn.

- 1 campaign mới tạo/chưa thanh toán.
- 1 campaign đã gửi biên lai và đang chờ Admin xác minh.
- 1 campaign đã thanh toán và đang chờ Admin duyệt.
- 1 campaign đang ACTIVE trên marketplace.
- 1 campaign đã có submission cho Customer duyệt.
- 1 collaborator có tiền trong ví.
- 1 yêu cầu rút tiền đang chờ Admin xử lý.

## 5. Luồng demo đề xuất

### Bước 1: Giới thiệu trang chủ

Mở ứng dụng và giới thiệu nhanh:

- SureVey có 3 vai trò: Customer, Collaborator, Admin.
- Mỗi vai trò có dashboard và chức năng riêng.
- Hệ thống tập trung vào luồng tạo campaign, thanh toán, làm khảo sát, duyệt kết quả và trả thưởng.

### Bước 2: Demo Customer

Đăng nhập bằng tài khoản `Customer`.

Cần demo:

- Sau khi đăng nhập, hệ thống vào dashboard của Customer.
- Dashboard hiển thị tổng campaign, campaign đang hiển thị, campaign chờ thanh toán và số response đã duyệt.
- Khu vực "Tiến độ response đã đặt" cho biết:
  - Tổng response mục tiêu đã thanh toán.
  - Response đã duyệt.
  - Response còn thiếu để đạt 100%.
  - Phần trăm hoàn thành.
- Customer có thể lọc/sắp xếp campaign theo trạng thái, tiến độ, deadline.
- Mở chi tiết campaign để xem submission và duyệt/từ chối submission.

Nếu demo tạo campaign:

1. Chọn "Tạo campaign".
2. Nhập thông tin campaign.
3. Đặt số lượng response mục tiêu.
4. Tạo campaign và mở QR thanh toán.
5. Gửi URL biên lai để Admin xác minh.

### Bước 3: Demo Admin

Đăng xuất và đăng nhập bằng tài khoản `Admin`.

Cần demo:

- Admin thấy dashboard quản trị.
- Khu vực tổng quan hiển thị theo các cột dữ liệu:
  - Thanh toán.
  - Campaign.
  - Rút tiền.
  - Doanh thu.
- Tab "Thanh toán":
  - Xem biên lai.
  - Xác minh thanh toán.
  - Từ chối thanh toán nếu không hợp lệ.
- Tab "Campaign":
  - Xem campaign chờ duyệt.
  - Duyệt campaign để đưa lên marketplace.
  - Từ chối campaign và nhập lý do.
- Tab "Rút tiền":
  - Duyệt yêu cầu rút tiền.
  - Đánh dấu đã chuyển tiền.
  - Từ chối yêu cầu nếu sai thông tin.

### Bước 4: Demo Collaborator

Đăng xuất và đăng nhập bằng tài khoản `Collaborator`.

Cần demo:

- Collaborator vào marketplace.
- Marketplace hiển thị campaign đã thanh toán, còn hạn và còn slot.
- Có thể tìm kiếm, lọc theo danh mục, sắp xếp theo:
  - Gần hết hạn trước.
  - Thưởng cao trước.
  - Nhiều slot trước.
  - Mới nhất.
- Chọn một campaign và bấm "Nhận campaign".
- Mở trang làm khảo sát, nộp mã xác nhận/bằng chứng/ghi chú.

Sau đó mở trang "Công việc & ví":

- Xem campaign đã nhận.
- Lọc công việc theo trạng thái.
- Xem giao dịch ví.
- Tạo yêu cầu rút tiền.

### Bước 5: Kết luận luồng end-to-end

Tóm tắt lại luồng hoàn chỉnh:

1. Customer tạo campaign và thanh toán.
2. Admin xác minh thanh toán và duyệt campaign.
3. Collaborator nhận campaign trên marketplace.
4. Collaborator làm khảo sát và nộp submission.
5. Customer duyệt submission.
6. Collaborator nhận thưởng vào ví.
7. Collaborator gửi yêu cầu rút tiền.
8. Admin xử lý rút tiền.

## 6. Checklist trước khi thuyết trình

- Backend đang chạy.
- Frontend đang chạy.
- Đăng nhập được 3 role.
- Có dữ liệu campaign mẫu.
- Có ít nhất 1 payment đang chờ xác minh.
- Có ít nhất 1 campaign đang ACTIVE.
- Có ít nhất 1 submission đang chờ Customer duyệt.
- Có ít nhất 1 withdrawal đang chờ Admin xử lý.
- Giao diện tiếng Việt không bị lỗi font/encoding.
- Không để console hiện lỗi nghiêm trọng.

## 7. Câu trả lời gợi ý khi bị hỏi

### Vì sao cần 3 role?

Vì hệ thống có 3 nhóm người dùng với trách nhiệm khác nhau: Customer tạo nhu cầu khảo sát, Collaborator thực hiện khảo sát, Admin kiểm soát thanh toán và vận hành.

### Hệ thống có phân quyền không?

Có. Sau khi đăng nhập, frontend đọc role của người dùng và điều hướng vào dashboard phù hợp. Các route quan trọng được bảo vệ theo role.

### Customer theo dõi tiến độ khảo sát như thế nào?

Customer dashboard tính tiến độ dựa trên `approvedResponses / targetResponses`. Hệ thống hiện số response đã duyệt, tổng response mục tiêu và số response còn thiếu để đạt 100%.

### Admin có vai trò gì?

Admin đảm bảo campaign hợp lệ trước khi hiển thị cho Collaborator. Admin xác minh thanh toán, duyệt campaign và xử lý rút tiền.

### Collaborator nhận tiền bằng cách nào?

Sau khi submission được duyệt, tiền thưởng được ghi nhận vào ví. Collaborator có thể gửi yêu cầu rút tiền và Admin xử lý yêu cầu đó.

## 8. Hướng phát triển tiếp theo

Nếu có thêm thời gian, có thể phát triển:

- Thông báo realtime khi campaign/submission/payment thay đổi trạng thái.
- Upload ảnh biên lai thay vì nhập URL.
- Báo cáo thống kê nâng cao cho Customer và Admin.
- Phân trang và lọc dữ liệu ở backend cho danh sách lớn.
- Email notification khi campaign được duyệt hoặc submission được chấp nhận.
- Tích hợp Google OAuth nếu cần đăng nhập nhanh.
