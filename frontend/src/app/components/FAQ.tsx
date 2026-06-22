import { useState } from "react";
import {
  PlusCircle,
  Search,
  Coins,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Alert, AlertDescription } from "./ui/alert";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import {
  getFAQCategories,
  createSupportTicket,
  createDisputeTicket,
} from "../services/supportService";
import { getCurrentUser } from "../services/surveyService";
import {
  TicketCategory,
  DisputeType,
  TICKET_CATEGORY_LABELS,
  DISPUTE_TYPE_LABELS,
} from "../types/support";
import { Link } from "react-router";

const iconMap = {
  PlusCircle,
  Search,
  Coins,
  AlertCircle,
};

export function FAQ() {
  const faqCategories = getFAQCategories();
  const currentUser = getCurrentUser();

  // Support ticket form state
  const [supportForm, setSupportForm] = useState({
    category: "" as TicketCategory | "",
    description: "",
    email: "",
  });
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [supportTicketId, setSupportTicketId] = useState("");

  // Dispute form state
  const [disputeForm, setDisputeForm] = useState({
    surveyName: "",
    disputeType: "" as DisputeType | "",
    description: "",
    email: "",
  });
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);
  const [disputeTicketId, setDisputeTicketId] = useState("");

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !supportForm.category ||
      !supportForm.description ||
      !supportForm.email
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const ticket = createSupportTicket(
      currentUser.id,
      currentUser.name,
      supportForm.category as TicketCategory,
      supportForm.description,
      supportForm.email,
    );

    setSupportTicketId(ticket.id);
    setSupportSubmitted(true);
    toast.success("Đã gửi báo cáo vấn đề thành công!");

    // Reset form
    setSupportForm({
      category: "",
      description: "",
      email: "",
    });
  };

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !disputeForm.surveyName ||
      !disputeForm.disputeType ||
      !disputeForm.description ||
      !disputeForm.email
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const ticket = createDisputeTicket(
      currentUser.id,
      currentUser.name,
      disputeForm.surveyName,
      disputeForm.disputeType as DisputeType,
      disputeForm.description,
      disputeForm.email,
    );

    setDisputeTicketId(ticket.id);
    setDisputeSubmitted(true);
    toast.success("Đã gửi báo cáo tranh chấp thành công!");

    // Reset form
    setDisputeForm({
      surveyName: "",
      disputeType: "",
      description: "",
      email: "",
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Trung tâm trợ giúp</h1>
        <p className="text-lg text-gray-600">
          Tìm câu trả lời cho câu hỏi của bạn hoặc liên hệ với đội ngũ hỗ trợ
          của chúng tôi
        </p>
      </div>

      {/* Quick Links */}
      <Card className="bg-green-50 border-green-400">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/support/tickets">
              <Button variant="outline" className="gap-2">
                <FileText className="w-4 h-4" />
                Kiểm tra trạng thái đơn báo cáo
              </Button>
            </Link>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                const element = document.getElementById("report-forms");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <AlertCircle className="w-4 h-4" />
              Báo cáo vấn đề
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Categories */}
      <div className="grid md:grid-cols-2 gap-6">
        {faqCategories.map((category) => {
          const Icon = iconMap[category.icon as keyof typeof iconMap];
          return (
            <Card
              key={category.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>{category.title}</CardTitle>
                    <CardDescription>
                      {category.items.length} câu hỏi
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.items.map((item, index) => (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger className="text-left hover:no-underline">
                        <span className="text-sm font-medium">
                          {item.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {item.answer}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator className="my-12" />

      {/* Report Forms Section */}
      <div id="report-forms" className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">Báo cáo vấn đề</h2>
          <p className="text-gray-600">
            Không tìm thấy câu trả lời? Gửi vấn đề của bạn và chúng tôi sẽ phản
            hồi trong vòng 24 giờ
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* General Support Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Báo cáo vấn đề chung
              </CardTitle>
              <CardDescription>
                Cho các vấn đề về đăng nhập, tham gia khảo sát, phần thưởng,
                v.v.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {supportSubmitted ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <p className="font-medium mb-2">
                      Vấn đề của bạn đã được tiếp nhận!
                    </p>
                    <p className="text-sm mb-2">
                      Đội ngũ hỗ trợ của chúng tôi sẽ phản hồi trong vòng 24
                      giờ.
                    </p>
                    <p className="text-sm font-mono bg-white px-2 py-1 rounded border border-green-200 inline-block">
                      Mã đơn báo cáo: {supportTicketId}
                    </p>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSupportSubmitted(false)}
                      >
                        Gửi vấn đề khác
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="support-category">Danh mục vấn đề *</Label>
                    <Select
                      value={supportForm.category}
                      onValueChange={(value) =>
                        setSupportForm({
                          ...supportForm,
                          category: value as TicketCategory,
                        })
                      }
                    >
                      <SelectTrigger id="support-category">
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TICKET_CATEGORY_LABELS).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="support-description">Mô tả vấn đề *</Label>
                    <Textarea
                      id="support-description"
                      placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải..."
                      value={supportForm.description}
                      onChange={(e) =>
                        setSupportForm({
                          ...supportForm,
                          description: e.target.value,
                        })
                      }
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="support-email">Email *</Label>
                    <Input
                      id="support-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={supportForm.email}
                      onChange={(e) =>
                        setSupportForm({
                          ...supportForm,
                          email: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="destructive"
                    className="w-full gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Gửi báo cáo
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Fraud/Dispute Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Báo cáo gian lận/tranh chấp
              </CardTitle>
              <CardDescription>
                Cho các vấn đề nghiêm trọng liên quan đến khảo sát cụ thể
              </CardDescription>
            </CardHeader>
            <CardContent>
              {disputeSubmitted ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <p className="font-medium mb-2">
                      Báo cáo của bạn đã được tiếp nhận!
                    </p>
                    <p className="text-sm mb-2">
                      Đội ngũ hỗ trợ của chúng tôi sẽ phản hồi trong vòng 24
                      giờ.
                    </p>
                    <p className="text-sm font-mono bg-white px-2 py-1 rounded border border-green-200 inline-block">
                      Mã đơn báo cáo: {disputeTicketId}
                    </p>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDisputeSubmitted(false)}
                      >
                        Gửi báo cáo khác
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleDisputeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dispute-survey">Tên khảo sát *</Label>
                    <Input
                      id="dispute-survey"
                      placeholder="Nhập tên khảo sát"
                      value={disputeForm.surveyName}
                      onChange={(e) =>
                        setDisputeForm({
                          ...disputeForm,
                          surveyName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dispute-type">Loại vấn đề *</Label>
                    <Select
                      value={disputeForm.disputeType}
                      onValueChange={(value) =>
                        setDisputeForm({
                          ...disputeForm,
                          disputeType: value as DisputeType,
                        })
                      }
                    >
                      <SelectTrigger id="dispute-type">
                        <SelectValue placeholder="Chọn loại vấn đề" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DISPUTE_TYPE_LABELS).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dispute-description">Mô tả vấn đề *</Label>
                    <Textarea
                      id="dispute-description"
                      placeholder="Vui lòng mô tả chi tiết vấn đề và cung cấp bất kỳ bằng chứng nào..."
                      value={disputeForm.description}
                      onChange={(e) =>
                        setDisputeForm({
                          ...disputeForm,
                          description: e.target.value,
                        })
                      }
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dispute-email">Email *</Label>
                    <Input
                      id="dispute-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={disputeForm.email}
                      onChange={(e) =>
                        setDisputeForm({
                          ...disputeForm,
                          email: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full gap-2"
                    variant="destructive"
                  >
                    <Send className="w-4 h-4" />
                    Gửi báo cáo
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Info */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Cần hỗ trợ thêm?</h3>
            <p className="text-gray-600">
              Kiểm tra trạng thái đơn báo cáo của bạn trên{" "}
              <Link
                to="/support/tickets"
                className="text-blue-600 hover:underline"
              >
                trang Trạng thái đơn báo cáo
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
