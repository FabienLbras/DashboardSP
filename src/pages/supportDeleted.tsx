import { useState } from "react";
import { MessageCircle, Mail, Phone, FileText, Search, Headphones } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { SupportChatDialog } from "../components/support/SupportChatDialog";
import { useToast } from "../hooks/useToast";

const Support = () => {
  const [showChat, setShowChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const supportOptions = [
    {
      title: "Live Chat Support",
      description: "Get instant help from our AI assistant for quick questions and common issues",
      icon: MessageCircle,
      action: () => setShowChat(true),
      buttonText: "Start Chat",
      availability: "Available 24/7",
      responseTime: "Instant response",
      color: "bg-blue-500",
    },
    {
      title: "Email Support",
      description: "Send us detailed questions and we'll get back to you with comprehensive answers",
      icon: Mail,
      action: () => {
        window.location.href = "mailto:support@yourcompany.com?subject=Support Request";
        toast({
          title: "Email client opened",
          description: "We'll respond within 24 hours",
        });
      },
      buttonText: "Send Email",
      availability: "Business hours",
      responseTime: "Within 24 hours",
      color: "bg-green-500",
    },
    {
      title: "Phone Support",
      description: "Speak directly with our support team for urgent matters and complex issues",
      icon: Phone,
      action: () => {
        toast({
          title: "Phone Support",
          description: "Call us at +1 (555) 123-4567",
        });
      },
      buttonText: "Call Now",
      availability: "Mon-Fri 9AM-6PM EST",
      responseTime: "Immediate",
      color: "bg-purple-500",
    },
  ];

  const quickActions = [
    { title: "Account Setup", icon: FileText },
    { title: "Payment Issues", icon: MessageCircle },
    { title: "Technical Problems", icon: Search },
    { title: "Feature Requests", icon: Headphones },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">How can we help you?</h1>
        <p className="text-muted-foreground text-lg">
          Choose the best way to get support that works for you
        </p>
      </div>

      {/* Search Bar */}
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search for help articles or describe your issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Support Options */}
      <div className="grid md:grid-cols-3 gap-6">
        {supportOptions.map((option, index) => (
          <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-all duration-200 group">
            <div className={`absolute top-0 left-0 w-full h-1 ${option.color}`} />
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${option.color} ${option.color}/15 bg-opacity-60`}>
                  <option.icon className={`h-6 w-6 text-white`} style={{ color: option.color.replace('bg-', '').replace('-500', '') }} />
                </div>
                <Badge variant="outline" className="text-xs">
                  {option.availability}
                </Badge>
              </div>
              <CardTitle className="text-xl">{option.title}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {option.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>{option.responseTime}</span>
              </div>
              <Button 
                onClick={option.action}
                className="w-full group-hover:scale-105 transition-transform duration-200"
                variant="outline"
              >
                {option.buttonText}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            Common Topics
          </CardTitle>
          <CardDescription>
            Quick access to frequently requested help topics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-muted/50"
                onClick={() => setShowChat(true)}
              >
                <action.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{action.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Dialog */}
      <SupportChatDialog open={showChat} onOpenChange={setShowChat} />
    </div>
  );
};

export default Support;