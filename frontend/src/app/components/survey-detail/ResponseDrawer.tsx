import { HelperResponse } from './types';
import { formatTime } from './mockData';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Monitor, Smartphone, Tablet, Globe, Clock, Calendar, MessageSquare, List } from 'lucide-react';

interface ResponseDrawerProps {
  response: HelperResponse | null;
  open: boolean;
  onClose: () => void;
}

const DEVICE_ICONS = {
  Desktop: <Monitor className="w-4 h-4" />,
  Mobile: <Smartphone className="w-4 h-4" />,
  Tablet: <Tablet className="w-4 h-4" />,
};

function initials(name: string): string {
  return name.split(' ').map(p => p[0]).slice(-2).join('').toUpperCase();
}

function avatarColor(name: string): string {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'];
  let hash = 0;
  for (const c of name) hash = (hash + c.charCodeAt(0)) % colors.length;
  return colors[hash];
}

export function ResponseDrawer({ response, open, onClose }: ResponseDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b shrink-0">
          <SheetTitle>Chi tiết phản hồi</SheetTitle>
        </SheetHeader>

        {response && (
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Helper info */}
              <div className="flex items-center gap-4">
                <Avatar className="size-12">
                  <AvatarFallback className={`${avatarColor(response.helperName)} text-white font-semibold`}>
                    {initials(response.helperName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900">{response.helperName}</p>
                  <p className="text-sm text-gray-500">{response.email}</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{new Date(response.completedAt).toLocaleString('vi-VN')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{formatTime(response.completionTimeMinutes)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {DEVICE_ICONS[response.device]}
                  <span>{response.device}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{response.country}</span>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{response.browser}</Badge>
                <Badge variant="outline">{response.device}</Badge>
              </div>

              <Separator />

              {/* Answers */}
              <div className="space-y-5">
                <h3 className="font-semibold text-gray-900">
                  Câu trả lời ({response.answers.length} câu hỏi)
                </h3>

                {response.answers.map((a, idx) => (
                  <div key={a.questionId} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-gray-400 mt-0.5 shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {a.questionType === 'multiple_choice'
                            ? <List className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            : <MessageSquare className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          }
                          <Badge variant="outline" className="text-xs py-0">
                            {a.questionType === 'multiple_choice' ? 'Trắc nghiệm' : 'Văn bản'}
                          </Badge>
                          <span className="text-xs text-gray-400">{a.timeSpentSeconds}s</span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium leading-snug">{a.questionText}</p>
                        <p className="text-sm text-gray-900 mt-1.5 bg-gray-50 rounded-md px-3 py-2 border">
                          {a.answer}
                        </p>
                      </div>
                    </div>
                    {idx < response.answers.length - 1 && <Separator className="mt-2" />}
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
