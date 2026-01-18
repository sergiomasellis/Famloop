"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CalendarPlus, Users, Plus, Pencil, Trash2, AlertCircle, UserPlus } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useFamily } from "@/hooks/useFamily";
import { useFamilies, Family } from "@/hooks/useFamilies";
import { FamilyDialog } from "@/features/family/components/FamilyDialog";
import { AddMemberDialog } from "@/features/family/components/AddMemberDialog";
import { EditMemberDialog } from "@/features/family/components/EditMemberDialog";
import { InviteParentDialog } from "@/features/family/components/InviteParentDialog";
import { PendingInvitationsList } from "@/features/family/components/PendingInvitationsList";
import { Mail } from "lucide-react";
import { useFamilyMembers, useCreateFamilyMember, useUpdateFamilyMember, useDeleteFamilyMember, FamilyMember } from "@/hooks/useFamilyMembers";
import { useAuth } from "@/contexts/AuthContext";
import { Id } from "../../../convex/_generated/dataModel";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

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

  const handleSaveMember = async (data: {
    name: string;
    email?: string;
    password?: string;
    role: "parent" | "child";
    family_id?: string;
  }) => {
    try {
      await createMember({ name: data.name, role: data.role });
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
      await updateMember(userId as Id<"users">, { name: data.name, iconEmoji: data.iconEmoji ?? undefined });
      refetchMembers();
      setEditMemberDialogOpen(false);
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="space-y-6">
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
                    Created {family.createdAt ? format(new Date(family.createdAt), "MMMM d, yyyy") : "recently"}
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
            <div className="text-sm text-muted-foreground">
              No family created yet. Create one to start adding members and managing chores.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-5" /> Family Members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Add, edit, or remove family members. Parents require email and password; kids do not.
            </p>
            <Button onClick={handleAddMember} size="sm" className="w-full sm:w-auto" disabled={creatingMember || membersLoading}>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
          {membersLoading ? (
            <p className="text-sm text-muted-foreground">Loading members...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet. Add your family to get started.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((member) => (
                <Card key={member._id} className="border">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src={member.profileImageUrl || undefined} alt={member.name} />
                        <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditMember(member)}
                        disabled={updatingMember}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteMember(member)}
                        disabled={deletingMember}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {family && currentUser?.role === "parent" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="size-5" /> Invite Parents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Invite another parent to join your family. They will have full parent permissions.
              </p>
              <Button onClick={() => setInviteDialogOpen(true)} size="sm" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Invite Parent
              </Button>
            </div>
            <PendingInvitationsList />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" /> Security & Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Family admin password protects family-level changes. Share member logins carefully. Reset parent passwords from the login page if needed.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/auth/forgot-password">
                Reset parent password
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/auth/login">
                Sign in as another user
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <FamilyDialog
        open={familyDialogOpen}
        onOpenChange={setFamilyDialogOpen}
        family={editingFamily}
        onSave={handleSaveFamily}
      />

      {family && (
        <AddMemberDialog
          open={addMemberDialogOpen}
          onOpenChange={setAddMemberDialogOpen}
          familyId={family._id}
          onSave={handleSaveMember}
          loading={creatingMember}
        />
      )}

      <EditMemberDialog
        open={editMemberDialogOpen}
        onOpenChange={setEditMemberDialogOpen}
        member={editingMember}
        onSave={handleUpdateMember}
        loading={updatingMember}
      />

      <InviteParentDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your family, members, and security preferences.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <SettingsPageContent />
      </div>
    </ProtectedRoute>
  );
}

