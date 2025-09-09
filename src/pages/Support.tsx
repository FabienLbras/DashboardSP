import { useState } from "react";
import { MessageCircle, Search, Filter, Clock, AlertCircle, CheckCircle, User, Reply } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { SupportTicketDialog } from "../components/support/SupportTicketDialog";

const Support = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const supportTickets = [
    {
      id: "TICK-001",
      subject: "Payment processing issue",
      description: "Unable to process payments through terminal ID 12345. Getting error code E404.",
      user: "John Doe",
      email: "john.doe@example.com",
      status: "open",
      priority: "high",
      category: "Technical",
      createdAt: "2024-01-15 10:30 AM",
      updatedAt: "2024-01-15 2:15 PM",
      replies: 3,
    },
    {
      id: "TICK-002", 
      subject: "Account setup assistance needed",
      description: "New user needs help setting up their merchant account and configuring terminals.",
      user: "Sarah Wilson",
      email: "sarah.w@business.com",
      status: "in-progress",
      priority: "medium",
      category: "Account",
      createdAt: "2024-01-14 3:45 PM",
      updatedAt: "2024-01-15 9:20 AM",
      replies: 1,
    },
    {
      id: "TICK-003",
      subject: "Invoice generation problem",
      description: "Invoices are not generating correctly with proper tax calculations for international clients.",
      user: "Mike Johnson",
      email: "mike.j@company.org",
      status: "resolved",
      priority: "low",
      category: "Billing",
      createdAt: "2024-01-13 11:20 AM",
      updatedAt: "2024-01-14 4:30 PM",
      replies: 5,
    },
    {
      id: "TICK-004",
      subject: "Feature request: Bulk operations",
      description: "Would like to have bulk operation capabilities for managing multiple terminals at once.",
      user: "Emily Chen",
      email: "e.chen@retail.com",
      status: "open",
      priority: "low",
      category: "Feature Request",
      createdAt: "2024-01-12 2:10 PM",
      updatedAt: "2024-01-13 10:45 AM",
      replies: 0,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-500";
      case "in-progress": return "bg-yellow-500 bg-yellow-500";
      case "resolved": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-blue-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-gray-500";
      default: return "text-gray-400";
    }
  };

  const filteredTickets = supportTickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const ticketStats = {
    total: supportTickets.length,
    open: supportTickets.filter(t => t.status === "open").length,
    inProgress: supportTickets.filter(t => t.status === "in-progress").length,
    resolved: supportTickets.filter(t => t.status === "resolved").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-muted-foreground">
            Manage and respond to user support requests
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-bold">{ticketStats.total}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold text-red-500">{ticketStats.open}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-yellow-500">{ticketStats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-500">{ticketStats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tickets by ID, subject, or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card className="">
        <CardHeader>
          <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
          <CardDescription>
            Click on any ticket to view details and respond
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-muted-foreground">{ticket.id}</span>
                      <Badge variant="outline" className={`${getStatusColor(ticket.status)} text-white`}>
                        {ticket.status.replace('-', ' ')}
                      </Badge>
                      <Badge variant="outline">{ticket.category}</Badge>
                      <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority} priority
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground">{ticket.subject}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{ticket.user}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{ticket.createdAt}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Reply className="h-3 w-3" />
                        <span>{ticket.replies} replies</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>



      <Card className="hidden shadow-medium border-0 bg-surface-elevated">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Support Tickets</CardTitle>
              <CardDescription className="text-base mt-1">
                {filteredTickets.length} tickets found - Click any ticket to view details and respond
              </CardDescription>
            </div>
            <Badge variant="secondary" className="px-3 py-1 text-sm font-semibold">
              {filteredTickets.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {filteredTickets.map((ticket, index) => (
              <div
                key={ticket.id}
                className={`p-6 border-b border-border/50 hover:bg-background hover:shadow-subtle cursor-pointer transition-all duration-200 group ${
                  index === filteredTickets.length - 1 ? 'border-b-0' : ''
                }`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm bg-muted px-2 py-1 rounded text-muted-foreground">
                        {ticket.id}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={`${getStatusColor(ticket.status)} text-white shadow-sm`}
                      >
                        {ticket.status.replace('-', ' ')}
                      </Badge>
                      <Badge variant="outline" className="border-border/50">
                        {ticket.category}
                      </Badge>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        ticket.priority === 'high' 
                          ? 'bg-destructive/10 text-destructive' 
                          : ticket.priority === 'medium' 
                          ? 'bg-success-orange/10 text-success-orange'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {ticket.priority} priority
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                      {ticket.subject}
                    </h3>
                    <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                      {ticket.description}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{ticket.user}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{ticket.createdAt}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Reply className="h-4 w-4" />
                        <span>{ticket.replies} replies</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <SupportTicketDialog 
        ticket={selectedTicket} 
        open={!!selectedTicket} 
        onOpenChange={(open) => !open && setSelectedTicket(null)}
      />
    </div>
  );
};

export default Support;