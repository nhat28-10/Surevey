# Huong dan demo SureVey

Tai lieu nay dung de chuan bi va thuyet trinh demo cho du an SureVey. Muc tieu la giup nguoi xem hieu ro he thong co 3 vai tro, co luong nghiep vu end-to-end, co phan quyen, co thanh toan, co marketplace khao sat va co vi/rut tien.

## 1. Tong quan he thong

SureVey la nen tang ket noi nguoi tao khao sat voi nguoi tham gia lam khao sat.

He thong co 3 vai tro chinh:

- `Customer`: tao campaign khao sat, dat so luong response muc tieu, thanh toan, theo doi tien do va duyet submission.
- `Collaborator`: xem marketplace, nhan campaign, lam khao sat, nop ket qua va nhan thuong vao vi.
- `Admin`: xac minh thanh toan, duyet campaign, quan ly yeu cau rut tien va theo doi doanh thu nen tang.

## 2. Diem noi bat khi demo

- Dang nhap theo role va dashboard hien thi khac nhau theo tung role.
- Customer co the tao campaign va theo doi tien do response da dat.
- Admin co dashboard quan tri gom thanh toan, campaign cho duyet va rut tien.
- Collaborator co marketplace de nhan campaign va trang cong viec/vi de theo doi tien thuong.
- Du lieu hien thi lay tu backend, khong can hard-code so lieu tren giao dien.

## 3. Tai khoan demo

Dien tai khoan demo that cua nhom vao bang ben duoi truoc khi thuyet trinh.

| Vai tro | Email | Mat khau | Ghi chu |
| --- | --- | --- | --- |
| Admin | `admin@example.com` | `123456` | Xac minh thanh toan, duyet campaign, xu ly rut tien |
| Customer | `customer@example.com` | `123456` | Tao campaign, thanh toan, theo doi response |
| Collaborator | `collaborator@example.com` | `123456` | Nhan campaign, nop submission, xem vi |

## 4. Chuan bi du lieu truoc demo

Nen co san du lieu o nhieu trang thai de khi demo giao dien trong day du hon.

- 1 campaign moi tao/chua thanh toan.
- 1 campaign da gui bien lai va dang cho Admin xac minh.
- 1 campaign da thanh toan va dang cho Admin duyet.
- 1 campaign dang ACTIVE tren marketplace.
- 1 campaign da co submission cho Customer duyet.
- 1 collaborator co tien trong vi.
- 1 yeu cau rut tien dang cho Admin xu ly.

## 5. Luong demo de xuat

### Buoc 1: Gioi thieu trang chu

Mo ung dung va gioi thieu nhanh:

- SureVey co 3 vai tro: Customer, Collaborator, Admin.
- Moi vai tro co dashboard va chuc nang rieng.
- He thong tap trung vao luong tao campaign, thanh toan, lam khao sat, duyet ket qua va tra thuong.

### Buoc 2: Demo Customer

Dang nhap bang tai khoan `Customer`.

Can demo:

- Sau khi dang nhap, he thong vao dashboard cua Customer.
- Dashboard hien thi tong campaign, campaign dang hien thi, campaign cho thanh toan va so response da duyet.
- Khu vuc "Tien do response da dat" cho biet:
  - Tong response muc tieu da thanh toan.
  - Response da duyet.
  - Response con thieu de dat 100%.
  - Phan tram hoan thanh.
- Customer co the loc/sap xep campaign theo trang thai, tien do, deadline.
- Mo chi tiet campaign de xem submission va duyet/tu choi submission.

Neu demo tao campaign:

1. Chon "Tao campaign".
2. Nhap thong tin campaign.
3. Dat so luong response muc tieu.
4. Tao campaign va mo QR thanh toan.
5. Gui URL bien lai de Admin xac minh.

### Buoc 3: Demo Admin

Dang xuat va dang nhap bang tai khoan `Admin`.

Can demo:

- Admin thay dashboard quan tri.
- Khu vuc tong quan hien thi:
  - Tong tien da xac minh.
  - Phi nen tang.
  - Thanh toan cho xac minh.
  - Campaign cho duyet.
  - Withdrawal cho xu ly.
- Tab "Thanh toan":
  - Xem bien lai.
  - Xac minh thanh toan.
  - Tu choi thanh toan neu khong hop le.
- Tab "Campaign":
  - Xem campaign cho duyet.
  - Duyet campaign de dua len marketplace.
  - Tu choi campaign va nhap ly do.
- Tab "Rut tien":
  - Duyet yeu cau rut tien.
  - Danh dau da chuyen tien.
  - Tu choi yeu cau neu sai thong tin.

### Buoc 4: Demo Collaborator

Dang xuat va dang nhap bang tai khoan `Collaborator`.

Can demo:

- Collaborator vao marketplace.
- Marketplace hien thi campaign da thanh toan, con han va con slot.
- Co the tim kiem, loc theo danh muc, sap xep theo:
  - Gan het han truoc.
  - Thuong cao truoc.
  - Nhieu slot truoc.
  - Moi nhat.
- Chon mot campaign va bam "Nhan campaign".
- Mo trang lam khao sat, nop ma xac nhan/bang chung/ghi chu.

Sau do mo trang "Cong viec & vi":

- Xem campaign da nhan.
- Loc cong viec theo trang thai.
- Xem giao dich vi.
- Tao yeu cau rut tien.

### Buoc 5: Ket luan luong end-to-end

Tom tat lai luong hoan chinh:

1. Customer tao campaign va thanh toan.
2. Admin xac minh thanh toan va duyet campaign.
3. Collaborator nhan campaign tren marketplace.
4. Collaborator lam khao sat va nop submission.
5. Customer duyet submission.
6. Collaborator nhan thuong vao vi.
7. Collaborator gui yeu cau rut tien.
8. Admin xu ly rut tien.

## 6. Checklist truoc khi thuyet trinh

- Backend dang chay.
- Frontend dang chay.
- Dang nhap duoc 3 role.
- Co du lieu campaign mau.
- Co it nhat 1 payment dang cho xac minh.
- Co it nhat 1 campaign dang ACTIVE.
- Co it nhat 1 submission dang cho Customer duyet.
- Co it nhat 1 withdrawal dang cho Admin xu ly.
- Giao dien tieng Viet khong bi loi font/encoding.
- Khong de console hien loi nghiem trong.

## 7. Cau tra loi goi y khi bi hoi

### Vi sao can 3 role?

Vi he thong co 3 nhom nguoi dung voi trach nhiem khac nhau: Customer tao nhu cau khao sat, Collaborator thuc hien khao sat, Admin kiem soat thanh toan va van hanh.

### He thong co phan quyen khong?

Co. Sau khi dang nhap, frontend doc role cua nguoi dung va dieu huong vao dashboard phu hop. Cac route quan trong duoc bao ve theo role.

### Customer theo doi tien do khao sat nhu the nao?

Customer dashboard tinh tien do dua tren `approvedResponses / targetResponses`. He thong hien so response da duyet, tong response muc tieu va so response con thieu de dat 100%.

### Admin co vai tro gi?

Admin dam bao campaign hop le truoc khi hien thi cho Collaborator. Admin xac minh thanh toan, duyet campaign va xu ly rut tien.

### Collaborator nhan tien bang cach nao?

Sau khi submission duoc duyet, tien thuong duoc ghi nhan vao vi. Collaborator co the gui yeu cau rut tien va Admin xu ly yeu cau do.

## 8. Huong phat trien tiep theo

Neu co them thoi gian, co the phat trien:

- Thong bao realtime khi campaign/submission/payment thay doi trang thai.
- Upload anh bien lai thay vi nhap URL.
- Bao cao thong ke nang cao cho Customer va Admin.
- Phan trang va loc du lieu o backend cho danh sach lon.
- Email notification khi campaign duoc duyet hoac submission duoc chap nhan.
- Tich hop Google OAuth neu can dang nhap nhanh.
