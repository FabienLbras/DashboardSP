import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  Camera
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { getRoleLabel } from "../lib/permissions";

const Profile = () => {
  const { user, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: `${user?.name}`,
    email: user?.email || "",
    phone: "+1 (555) 123-4567",
    location: "Amsterdam, Netherlands",
    role: getRoleLabel(user?.role),
    joinDate: "March 15, 2023",
    department: "Operations"
  });

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Profile</h1>
            <p className="text-text-secondary mt-1">Manage your account settings and preferences</p>
          </div>
        </div>

        {/* Main Profile Card */}
        <Card className="p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-background shadow-medium">
                  <AvatarImage src="/images/user/default-avatar.png" alt="Profile" />
                  <AvatarFallback className="bg-gradient-brand text-blue-600 text-2xl font-semibold">
                    {userInfo.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  size="sm" 
                  className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full shadow-medium bg-gray-200"
                  variant="secondary"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-text-primary">{userInfo.name}</h2>
                <Badge variant="secondary" className="bg-gray-200 mt-1">
                  <Shield className="h-3 w-3 mr-1" />
                  {getRoleLabel(user?.role || userInfo.role)}
                </Badge>
              </div>
            </div>

            {/* Profile Information */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">Personal Information</h3>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="space-x-2">
                    <Button onClick={handleSave} size="sm">
                      Save Changes
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-text-secondary">
                    Full Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={userInfo.name}
                      onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center space-x-2 py-2">
                      <span className="text-text-primary">{userInfo.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-text-secondary">
                    Email Address
                  </Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center space-x-2 py-2">
                      <Mail className="h-4 w-4 text-text-muted" />
                      <span className="text-text-primary">{userInfo.email}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-text-secondary">
                    Phone Number
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={userInfo.phone}
                      onChange={(e) => setUserInfo({...userInfo, phone: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center space-x-2 py-2">
                      <Phone className="h-4 w-4 text-text-muted" />
                      <span className="text-text-primary">{userInfo.phone}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium text-text-secondary">
                    Location
                  </Label>
                  {isEditing ? (
                    <Input
                      id="location"
                      value={userInfo.location}
                      onChange={(e) => setUserInfo({...userInfo, location: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center space-x-2 py-2">
                      <MapPin className="h-4 w-4 text-text-muted" />
                      <span className="text-text-primary">{userInfo.location}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-text-secondary">
                    Department
                  </Label>
                  <div className="flex items-center space-x-2 py-2">
                    <span className="text-text-primary">{userInfo.department}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-text-secondary">
                    Role
                  </Label>
                  <div className="flex items-center space-x-2 py-2">
                    <Shield className="h-4 w-4 text-text-muted" />
                    <span className="text-text-primary">{getRoleLabel(user?.role || userInfo.role)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-text-secondary">
                    Join Date
                  </Label>
                  <div className="flex items-center space-x-2 py-2">
                    <Calendar className="h-4 w-4 text-text-muted" />
                    <span className="text-text-primary">{userInfo.joinDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Additional Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Account Settings</h3>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/profile/mfa">
                  Two-Factor Authentication
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Notification Preferences
              </Button>
            </div>
          </Card>

          <Card className="p-6 hidden">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Activity Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Last Login</span>
                <span className="text-text-primary font-medium">2 hours ago</span>
              </div>
              <div className="border-b"></div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Sessions Active</span>
                <span className="inline-flex items-center rounded-md bg-gray-400/10 px-2 py-1 text-xs font-medium text-gray-400 inset-ring inset-ring-gray-400/20">2</span>
              </div>
              <div className="border-b"></div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Account Status</span>
                <Badge className="bg-success-blue text-white">Active</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
