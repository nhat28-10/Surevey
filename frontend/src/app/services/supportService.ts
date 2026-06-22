// Controller: Support Service for managing tickets and FAQ

import {
  SupportTicket,
  DisputeTicket,
  TicketCategory,
  DisputeType,
  TicketStatus,
  FAQCategory
} from '../types/support';

const SUPPORT_TICKETS_KEY = 'sureVey_supportTickets';
const DISPUTE_TICKETS_KEY = 'sureVey_disputeTickets';

// Get all support tickets
export const getAllSupportTickets = (): SupportTicket[] => {
  const stored = localStorage.getItem(SUPPORT_TICKETS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Save support tickets
const saveSupportTickets = (tickets: SupportTicket[]): void => {
  localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(tickets));
};

// Create support ticket
export const createSupportTicket = (
  userId: string,
  userName: string,
  category: TicketCategory,
  description: string,
  email: string
): SupportTicket => {
  const tickets = getAllSupportTickets();
  const newTicket: SupportTicket = {
    id: `ticket_${Date.now()}`,
    userId,
    userName,
    category,
    description,
    email,
    status: TicketStatus.PROCESSING,
    createdAt: new Date().toISOString()
  };
  tickets.push(newTicket);
  saveSupportTickets(tickets);
  return newTicket;
};

// Get all dispute tickets
export const getAllDisputeTickets = (): DisputeTicket[] => {
  const stored = localStorage.getItem(DISPUTE_TICKETS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Save dispute tickets
const saveDisputeTickets = (tickets: DisputeTicket[]): void => {
  localStorage.setItem(DISPUTE_TICKETS_KEY, JSON.stringify(tickets));
};

// Create dispute ticket
export const createDisputeTicket = (
  userId: string,
  userName: string,
  surveyName: string,
  disputeType: DisputeType,
  description: string,
  email: string
): DisputeTicket => {
  const tickets = getAllDisputeTickets();
  const newTicket: DisputeTicket = {
    id: `dispute_${Date.now()}`,
    userId,
    userName,
    surveyName,
    disputeType,
    description,
    email,
    status: TicketStatus.PROCESSING,
    createdAt: new Date().toISOString()
  };
  tickets.push(newTicket);
  saveDisputeTickets(tickets);
  return newTicket;
};

// Get tickets by user
export const getUserTickets = (userId: string): {
  supportTickets: SupportTicket[];
  disputeTickets: DisputeTicket[];
} => {
  const supportTickets = getAllSupportTickets().filter(t => t.userId === userId);
  const disputeTickets = getAllDisputeTickets().filter(t => t.userId === userId);
  return { supportTickets, disputeTickets };
};

// Get ticket by ID
export const getTicketById = (ticketId: string): SupportTicket | DisputeTicket | null => {
  // Check support tickets
  const supportTickets = getAllSupportTickets();
  const supportTicket = supportTickets.find(t => t.id === ticketId);
  if (supportTicket) return supportTicket;
  
  // Check dispute tickets
  const disputeTickets = getAllDisputeTickets();
  const disputeTicket = disputeTickets.find(t => t.id === ticketId);
  if (disputeTicket) return disputeTicket;
  
  return null;
};

// FAQ Data
export const getFAQCategories = (): FAQCategory[] => {
  return [
    {
      id: 'create_survey',
      title: 'Tạo khảo sát',
      icon: 'PlusCircle',
      items: [
        {
          id: 'faq_cs_1',
          question: 'Làm thế nào để tạo khảo sát mới?',
          answer: 'Chuyển sang vai trò "Chủ khảo sát", sau đó nhấp vào "Đăng khảo sát" trên thanh điều hướng. Điền thông tin khảo sát, chọn gói phù hợp (dựa trên số lượng câu hỏi), và xác định số lượt hoàn thành mục tiêu. Bạn có thể sử dụng liên kết từ Google Forms, Typeform, hoặc bất kỳ nền tảng khảo sát nào.'
        },
        {
          id: 'faq_cs_2',
          question: 'Các gói khảo sát khác nhau như thế nào?',
          answer: 'Chúng tôi cung cấp 3 gói: Gói 1 (dưới 10 câu hỏi) với 1.000 VND/lượt và giới hạn 3 phút; Gói 2 (10-20 câu hỏi) với 1.500 VND/lượt và giới hạn 7 phút; Gói 3 (trên 20 câu hỏi) với 2.000 VND/lượt và giới hạn 10 phút. Chọn gói phù hợp với độ dài khảo sát của bạn.'
        },
        {
          id: 'faq_cs_3',
          question: 'Chi phí tạo khảo sát là bao nhiêu?',
          answer: 'Tổng chi phí = Giá gói × Số lượt cần đạt × 1.2. Hệ số 1.2 bao gồm 20% phí nền tảng. Ví dụ: 50 lượt hoàn thành với Gói 1 (1.000 VND) sẽ có chi phí 1.000 × 50 × 1.2 = 60.000 VND.'
        },
        {
          id: 'faq_cs_4',
          question: 'Tôi có thể chỉnh sửa khảo sát sau khi đăng không?',
          answer: 'Hiện tại, bạn không thể chỉnh sửa khảo sát sau khi đăng. Tuy nhiên, bạn có thể hủy khảo sát nếu nó vẫn ở trạng thái "Open" (chưa có ai chấp nhận), sau đó tạo lại với thông tin đúng.'
        },
        {
          id: 'faq_cs_5',
          question: 'Làm thế nào để theo dõi tiến độ khảo sát?',
          answer: 'Truy cập "Khảo sát của tôi" từ dashboard để xem tất cả khảo sát của bạn. Bạn sẽ thấy số lượt đã hoàn thành, mục tiêu, trạng thái, và hạn chót. Thanh tiến độ hiển thị % hoàn thành theo thời gian thực.'
        }
      ]
    },
    {
      id: 'join_survey',
      title: 'Tham gia khảo sát',
      icon: 'Search',
      items: [
        {
          id: 'faq_js_1',
          question: 'Làm thế nào để tìm và tham gia khảo sát?',
          answer: 'Chuyển sang vai trò "Người làm khảo sát", sau đó nhấp vào "Tìm khảo sát". Duyệt các khảo sát có sẵn hoặc sử dụng bộ lọc để tìm khảo sát phù hợp với thời gian và mức thưởng bạn mong muốn. Nhấp "Chấp nhận & Bắt đầu" để mở liên kết khảo sát.'
        },
        {
          id: 'faq_js_2',
          question: 'Bộ lọc hoạt động như thế nào?',
          answer: 'Sử dụng bộ lọc để tìm khảo sát theo: Phần thưởng tối thiểu (VND), Phần thưởng tối đa (VND), Thời gian tối đa (phút), và Sắp xếp theo (Phần thưởng, Thời gian, Hạn chót). Điều này giúp bạn nhanh chóng tìm thấy khảo sát phù hợp nhất.'
        },
        {
          id: 'faq_js_3',
          question: 'Điều gì xảy ra sau khi tôi chấp nhận khảo sát?',
          answer: 'Sau khi chấp nhận, bạn sẽ được chuyển đến liên kết khảo sát bên ngoài (Google Forms, Typeform, v.v.). Hoàn thành khảo sát trong thời gian giới hạn. Sau khi hoàn thành, nhấp "Đánh dấu hoàn thành" để nhận phần thưởng của bạn.'
        },
        {
          id: 'faq_js_4',
          question: 'Tôi có thể tham gia cùng một khảo sát nhiều lần không?',
          answer: 'Không, mỗi người làm khảo sát chỉ có thể tham gia một khảo sát một lần. Hệ thống theo dõi việc bạn chấp nhận để đảm bảo tính công bằng và ngăn chặn phản hồi trùng lặp.'
        },
        {
          id: 'faq_js_5',
          question: 'Điều gì xảy ra nếu tôi không thể hoàn thành khảo sát?',
          answer: 'Nếu bạn gặp khó khăn trong việc hoàn thành khảo sát, đừng đánh dấu là hoàn thành. Thay vào đó, báo cáo vấn đề qua trang FAQ bằng cách sử dụng biểu mẫu "Báo cáo vấn đề" hoặc "Báo cáo gian lận/tranh chấp" nếu có vấn đề với khảo sát.'
        }
      ]
    },
    {
      id: 'reward',
      title: 'Phần thưởng',
      icon: 'Coins',
      items: [
        {
          id: 'faq_r_1',
          question: 'Khi nào tôi nhận được phần thưởng?',
          answer: 'Phần thưởng được ghi nhận ngay sau khi bạn nhấp "Đánh dấu hoàn thành" sau khi hoàn thành khảo sát. Trong hệ thống demo này, phần thưởng được theo dõi trong ứng dụng. Trong môi trường sản xuất, phần thưởng sẽ được xử lý qua hệ thống thanh toán.'
        },
        {
          id: 'faq_r_2',
          question: 'Tôi nhận được bao nhiêu cho mỗi khảo sát?',
          answer: 'Phần thưởng phụ thuộc vào gói khảo sát: Gói 1 (dưới 10 câu) = 1.000 VND, Gói 2 (10-20 câu) = 1.500 VND, Gói 3 (trên 20 câu) = 2.000 VND. Mức thưởng được hiển thị rõ ràng trên thẻ khảo sát trước khi bạn chấp nhận.'
        },
        {
          id: 'faq_r_3',
          question: 'Tôi có thể rút phần thưởng như thế nào?',
          answer: 'Trong hệ thống demo này, phần thưởng được theo dõi trong ứng dụng. Trong phiên bản sản xuất đầy đủ, bạn sẽ có thể rút phần thưởng vào tài khoản ngân hàng, ví điện tử, hoặc phương thức thanh toán đã đăng ký của bạn khi đạt ngưỡng tối thiểu.'
        },
        {
          id: 'faq_r_4',
          question: 'Có phí nào khi rút phần thưởng không?',
          answer: 'Phí nền tảng 20% được chủ khảo sát thanh toán, không phải người làm khảo sát. Bạn nhận được toàn bộ số tiền được quảng cáo cho mỗi lượt hoàn thành khảo sát. Phí rút tiền (nếu có) sẽ được công bố rõ ràng trước khi xác nhận rút tiền.'
        },
        {
          id: 'faq_r_5',
          question: 'Điều gì xảy ra nếu khảo sát bị hủy?',
          answer: 'Nếu một chủ khảo sát hủy khảo sát sau khi bạn đã hoàn thành và được đánh dấu hoàn thành, phần thưởng của bạn vẫn được đảm bảo. Chỉ các khảo sát ở trạng thái "Open" mới có thể bị hủy. Nếu bạn gặp vấn đề, hãy sử dụng biểu mẫu báo cáo tranh chấp.'
        }
      ]
    },
    {
      id: 'report_issue',
      title: 'Báo cáo vấn đề',
      icon: 'AlertCircle',
      items: [
        {
          id: 'faq_ri_1',
          question: 'Làm thế nào để báo cáo vấn đề?',
          answer: 'Cuộn xuống cuối trang FAQ này và bạn sẽ tìm thấy hai biểu mẫu: "Báo cáo vấn đề" cho các vấn đề chung (đăng nhập, tham gia khảo sát, phần thưởng, v.v.) và "Báo cáo gian lận/tranh chấp" cho các vấn đề nghiêm trọng hơn liên quan đến khảo sát cụ thể.'
        },
        {
          id: 'faq_ri_2',
          question: 'Mất bao lâu để nhận được phản hồi?',
          answer: 'Đội ngũ hỗ trợ của chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc. Bạn sẽ nhận được email xác nhận ngay sau khi gửi vấn đề. Bạn có thể kiểm tra trạng thái đơn báo cáo của mình trên trang "Trạng thái đơn báo cáo".'
        },
        {
          id: 'faq_ri_3',
          question: 'Tôi có thể theo dõi trạng thái của vấn đề được báo cáo không?',
          answer: 'Có! Sau khi gửi vấn đề, bạn sẽ nhận được mã đơn báo cáo. Truy cập trang "Trạng thái đơn báo cáo" từ menu điều hướng FAQ và nhập mã đơn báo cáo của bạn để kiểm tra trạng thái (Đang xử lý hoặc Đã giải quyết).'
        },
        {
          id: 'faq_ri_4',
          question: 'Khi nào tôi nên sử dụng biểu mẫu tranh chấp?',
          answer: 'Sử dụng biểu mẫu "Báo cáo gian lận/tranh chấp" khi bạn: không nhận được phần thưởng sau khi hoàn thành khảo sát, gặp vấn đề với liên kết khảo sát hoặc nội dung, hoặc nghi ngờ hành vi gian lận từ chủ khảo sát hoặc người làm khảo sát khác.'
        },
        {
          id: 'faq_ri_5',
          question: 'Tôi cần cung cấp thông tin gì khi báo cáo?',
          answer: 'Để báo cáo vấn đề chung: chọn danh mục vấn đề, cung cấp mô tả chi tiết, và email của bạn. Để báo cáo tranh chấp: cung cấp tên khảo sát, loại vấn đề, mô tả chi tiết, và email của bạn. Càng nhiều chi tiết, chúng tôi càng có thể giúp bạn tốt hơn.'
        }
      ]
    }
  ];
};
