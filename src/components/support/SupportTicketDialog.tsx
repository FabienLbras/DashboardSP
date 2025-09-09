import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Separator } from "../../components/ui/separator";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { User, Clock, Mail, Tag, Send, MessageSquare } from "lucide-react";
import { useToast } from "../../hooks/useToast";

interface SupportTicketDialogProps {
  ticket: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SupportTicketDialog = ({ ticket, open, onOpenChange }: SupportTicketDialogProps) => {
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState(ticket?.status || "open");
  const { toast } = useToast();

  if (!ticket) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleSendReply = () => {
    if (!reply.trim()) return;
    
    toast({
      title: "Reply sent",
      description: "Your response has been sent to the user.",
    });
    
    setReply("");
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    toast({
      title: "Status updated",
      description: `Ticket status changed to ${newStatus.replace('-', ' ')}.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-destructive";
      case "in-progress": return "bg-warning";
      case "resolved": return "bg-success";
      default: return "bg-muted";
    }
  };

  const mockReplies = [
    {
      id: 1,
      author: ticket.user,
      message: ticket.description,
      timestamp: ticket.createdAt,
      isStaff: false,
    },
    {
      id: 2,
      author: "Support Agent",
      message: "Thank you for reaching out. I'm looking into this issue and will have an update for you shortly.",
      timestamp: "2024-01-15 11:45 AM",
      isStaff: true,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between mt-3">
            <div className="space-y-2">
              <DialogTitle className="text-xl">{ticket.subject}</DialogTitle>
              <DialogDescription>
                Ticket ID: {ticket.id}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{ticket.category}</Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* User Info */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {getInitials(ticket.user)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{ticket.user}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>{ticket.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Created {ticket.createdAt}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      <span className={`font-medium ${ticket.priority === 'high' ? 'text-destructive' : ticket.priority === 'medium' ? 'text-warning' : 'text-muted-foreground'}`}>
                        {ticket.priority} priority
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conversation */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <h4 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversation
            </h4>
            
            <div className="space-y-4">
              {mockReplies.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.isStaff ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={message.isStaff ? 'bg-primary text-primary-foreground' : ''}>
                      {getInitials(message.author)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 space-y-1 ${message.isStaff ? 'text-right' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{message.author}</span>
                      <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                    </div>
                    <div className={`p-3 rounded-lg max-w-[80%] ${
                      message.isStaff 
                        ? 'bg-primary text-primary-foreground ml-auto' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Reply Section */}
          <div className="space-y-3">
            <h4 className="font-semibold">Send Reply</h4>
            <Textarea
              placeholder="Type your response here..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="min-h-[100px] outline-none"
            />
            <div className="flex justify-end">
              <Button className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 hover:scale-105 transition-transform" onClick={handleSendReply} disabled={!reply.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Send Reply
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};