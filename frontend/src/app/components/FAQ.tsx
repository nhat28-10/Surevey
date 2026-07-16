import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Alert, AlertDescription } from "./ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const faqs = [
  { question: "Làm sao tạo campaign?", answer: "Đăng nhập bằng Customer, mở Tạo campaign, nhập link Google Form, số câu trả lời, giá mỗi câu và mục tiêu phản hồi. Campaign được tạo qua SurveyService." },
  { question: "Khi nào campaign được gửi duyệt?", answer: "Customer tạo thanh toán, gửi URL chứng từ; Admin duyệt thanh toán trong WalletService. Khi campaign có PaymentStatus PAID, Customer mới gửi campaign cho Admin duyệt." },
  { question: "Collaborator nhận thưởng khi nào?", answer: "Collaborator nhận campaign, hoàn thành form, nộp confirmation code. Customer duyệt submission thì SurveyService gọi WalletService để trả thưởng." },
  { question: "Rút tiền như thế nào?", answer: "Collaborator mở Công việc & ví, tạo yêu cầu rút. Admin duyệt, sau đó đánh dấu đã thanh toán." },
];

export function FAQ() {
  return <div className="max-w-4xl mx-auto space-y-6">
    <div><h1 className="text-3xl font-bold">Hướng dẫn luồng backend hiện tại</h1><p className="text-gray-600 mt-1">Nội dung tĩnh ở frontend; backend gốc chưa có SupportTicket API.</p></div>
    <Alert><AlertDescription>Trang này không lưu ticket vào localStorage và không gọi endpoint không tồn tại. Module support sẽ nối sau khi backend có API tương ứng.</AlertDescription></Alert>
    <Card><CardHeader><CardTitle>Câu hỏi thường gặp</CardTitle></CardHeader><CardContent><Accordion type="single" collapsible>{faqs.map((item,index)=><AccordionItem key={index} value={String(index)}><AccordionTrigger>{item.question}</AccordionTrigger><AccordionContent>{item.answer}</AccordionContent></AccordionItem>)}</Accordion></CardContent></Card>
  </div>;
}
