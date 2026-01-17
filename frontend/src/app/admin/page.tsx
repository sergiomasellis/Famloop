"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CalendarPlus, Users, Plus, Pencil, AlertCircle, UserPlus, Trash2 } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useFamily, Family } from "@/hooks/useFamily";
import { useFamilies } from "@/hooks/useFamilies";
import { FamilyDialog } from "@/features/family/components/FamilyDialog";
import { AddMemberDialog } from "@/features/family/components/AddMemberDialog";
import { EditMemberDialog } from "@/features/family/components/EditMemberDialog";
import { useFamilyMembers, useCreateFamilyMember, useUpdateFamilyMember, useDeleteFamilyMember, FamilyMember } from "@/hooks/useFamilyMembers";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Id } from "../../../convex/_generated/dataModel";

function SettingsPageContent() {
  const { user: currentUser } = useAuth();
  const { family, loading: familyLoading, refetch: refetchFamily } = useFamily();
  const { createFamily, updateFamily, deleteFamily } = useFamilies();
  const { members, loading: membersLoading, refetch: refetchMembers } = useFamilyMembers(family?._id);
  const { createMember, loading: creatingMember } = useCreateFamilyMember();
  const { updateMember, loading: updatingMember } = useUpdateFamilyMember();
  const { deleteMember, loading: deletingMember } = useDeleteFamilyMember();
  
  const [familyDialogOpen, setFamilyDialogOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [editMemberDialogOpen, setEditMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  const handleCreateFamily = () => {
    setEditingFamily(null);
    setFamilyDialogOpen(true);
  };

  const handleEditFamily = (fam: Family) => {
    setEditingFamily(fam);
    setFamilyDialogOpen(true);
  };

  const handleDeleteFamily = async (fam: Family) => {
    const confirmed = confirm(
      `⚠️ WARNING: Are you sure you want to delete "${fam.name}"?\n\n` +
      `This will permanently delete:\n` +
      `- All family members\n` +
      `- All chores and points\n` +
      `- All events and calendar data\n` +
      `- All goals\n\n` +
      `This action CANNOT be undone!`
    );

    if (!confirmed) {
      return;
    }

    const success = await deleteFamily(fam._id);
    if (success) {
      refetchFamily();
      // Optionally redirect to home or show a message
      alert("Family deleted successfully. You may need to log out and create a new family.");
    } else {
      alert("Failed to delete family. Please try again.");
    }
  };

  const handleSaveFamily = async (data: { name: string; adminPin?: string }, familyId?: string) => {
    if (familyId) {
      await updateFamily(familyId as Id<"families">, { name: data.name, adminPin: data.adminPin });
    } else {
      await createFamily({ name: data.name, adminPin: data.adminPin });
    }
    refetchFamily();
  };

  const handleAddMember = () => {
    if (!family) {
      alert("Please create a family first");
      return;
    }
    setAddMemberDialogOpen(true);
  };

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setEditMemberDialogOpen(true);
  };

  const handleDeleteMember = async (member: FamilyMember) => {
    if (member._id === currentUser?._id) {
      alert("You cannot delete yourself");
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to remove "${member.name}" from the family?\n\n` +
      `This will permanently delete:\n` +
      `- Their account\n` +
      `- All their assigned chores\n` +
      `- All their points\n\n` +
      `This action CANNOT be undone!`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMember(member._id);
      refetchMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete member");
    }
  };

  const handleGoogleConnect = () => {
    // Google OAuth is handled by Clerk - redirect to Clerk's OAuth flow
    alert("Google Calendar integration is coming soon. For now, use Clerk's Google sign-in.");
  };

  const handleSaveMember = async (data: {
    name: string;
    email?: string;
    password?: string;
    role: "parent" | "child";
    family_id?: string;
  }) => {
    try {
      // Convex createMember expects { name, role, iconEmoji? }
      await createMember({
        name: data.name,
        role: data.role,
      });
      refetchMembers();
      setAddMemberDialogOpen(false);
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateMember = async (userId: string, data: {
    name?: string;
    profileImageUrl?: string | null;
    iconEmoji?: string | null;
  }) => {
    try {
      await updateMember(userId as Id<"users">, {
        name: data.name,
        iconEmoji: data.iconEmoji ?? undefined,
      });
      refetchMembers();
      setEditMemberDialogOpen(false);
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      {/* Family Management Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" /> Family Management
            </CardTitle>
            <Button onClick={handleCreateFamily} size="sm" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Family
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {familyLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : family ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg break-words">{family.name}</h3>
                    <Badge variant="outline" className="shrink-0">Current Family</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created {format(new Date(family.createdAt), "MMMM d, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditFamily(family)}
                    className="flex-1 sm:flex-initial"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteFamily(family)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-1 sm:flex-initial"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                No family found. Create your first family to get started.
              </p>
              <Button onClick={handleCreateFamily}>
                <Plus className="mr-2 h-4 w-4" />
                Create Family
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Family Members Section */}
      {family && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="size-5" /> Family Members
              </CardTitle>
              <Button onClick={handleAddMember} size="sm" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <p className="text-sm text-muted-foreground">Loading members...</p>
            ) : members.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  No family members yet. Add your first member to get started.
                </p>
                <Button onClick={handleAddMember}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={member.profileImageUrl || undefined} alt={member.name} />
                        <AvatarFallback>
                          {member.iconEmoji || member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold break-words">{member.name}</h3>
                          {member._id === currentUser?._id && (
                            <Badge variant="outline" className="text-xs shrink-0">You</Badge>
                          )}
                          <Badge
                            variant={member.role === "parent" ? "default" : "secondary"}
                            className="text-xs shrink-0"
                          >
                            {member.role === "parent" ? "Parent" : "Child"}
                          </Badge>
                        </div>
                        {member.email && (
                          <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 sm:ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMember(member)}
                        className="flex-1 sm:flex-initial"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      {member._id !== currentUser?._id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMember(member)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-1 sm:flex-initial"
                          disabled={deletingMember}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Other Admin Sections */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5" /> Parental Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Manage roles and parent PIN for secure access.
            </p>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="#">Change Parent PIN</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarPlus className="size-5" /> Calendar Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              <Button onClick={handleGoogleConnect} className="w-full sm:w-auto">
                Connect Google
              </Button>
              <Button variant="secondary" asChild className="w-full sm:w-auto">
                <Link href="#">Add iCal</Link>
              </Button>
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="#">Connect Alexa</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Family Dialog */}
      <FamilyDialog
        open={familyDialogOpen}
        onOpenChange={setFamilyDialogOpen}
        family={editingFamily}
        onSave={handleSaveFamily}
      />

      {/* Add Member Dialog */}
      {family && (
        <AddMemberDialog
          open={addMemberDialogOpen}
          onOpenChange={setAddMemberDialogOpen}
          familyId={family._id}
          onSave={handleSaveMember}
          loading={creatingMember}
        />
      )}

      {/* Edit Member Dialog */}
      <EditMemberDialog
        open={editMemberDialogOpen}
        onOpenChange={setEditMemberDialogOpen}
        member={editingMember}
        onSave={handleUpdateMember}
        loading={updatingMember}
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPageContent />
    </ProtectedRoute>
  );
}