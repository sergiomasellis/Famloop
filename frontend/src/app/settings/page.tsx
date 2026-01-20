"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CalendarPlus, Users, Plus, Pencil, Trash2, AlertCircle, UserPlus, Settings, Mail, Sparkles, Crown } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useFamily } from "@/hooks/useFamily";
import { useFamilies, Family } from "@/hooks/useFamilies";
import { FamilyDialog } from "@/features/family/components/FamilyDialog";
import { AddMemberDialog } from "@/features/family/components/AddMemberDialog";
import { EditMemberDialog } from "@/features/family/components/EditMemberDialog";
import { InviteParentDialog } from "@/features/family/components/InviteParentDialog";
import { PendingInvitationsList } from "@/features/family/components/PendingInvitationsList";
import { useFamilyMembers, useCreateFamilyMember, useUpdateFamilyMember, useDeleteFamilyMember, FamilyMember } from "@/hooks/useFamilyMembers";
import { useAuth } from "@/contexts/AuthContext";
import { Id } from "../../../convex/_generated/dataModel";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Color palette for member cards
const MEMBER_COLORS = [
  "bg-[var(--event-purple)]/20",
  "bg-[var(--event-blue)]/20",
  "bg-[var(--event-green)]/20",
  "bg-[var(--event-orange)]/20",
  "bg-primary/20",
  "bg-secondary/20",
];

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
      {/* Family Management Card */}
      <Card className="border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground border-b-2 border-border py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="leading-none flex items-center gap-3 font-black uppercase tracking-tight">
              <Users className="size-6" />
              Family Management
            </CardTitle>
            <Button
              onClick={handleCreateFamily}
              size="sm"
              variant="secondary"
              className="w-full sm:w-auto font-bold uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Family
            </Button>
          </div>
        </CardHeader>
        <CardContent className="py-4">
          {familyLoading ? (
            <div className="text-center py-8">
              <div className="text-4xl animate-bounce mb-2">🏠</div>
              <p className="font-bold text-muted-foreground">Loading family...</p>
            </div>
          ) : family ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-2 border-border rounded-xl shadow-[2px_2px_0px_0px_var(--shadow-color)] bg-muted/30">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-3xl">🏠</span>
                    <h3 className="font-black text-xl uppercase break-words">{family.name}</h3>
                    <Badge className="shrink-0 border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] font-bold uppercase bg-accent text-accent-foreground">
                      Current Family
                    </Badge>
                  </div>
                  <p className="text-sm font-bold text-muted-foreground">
                    Created {family.createdAt ? format(new Date(family.createdAt), "MMMM d, yyyy") : "recently"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditFamily(family)}
                    className="flex-1 sm:flex-initial font-bold uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--shadow-color)] transition-all"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteFamily(family)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-1 sm:flex-initial font-bold uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--shadow-color)] transition-all"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative text-center py-12 border-2 border-dashed border-border rounded-xl">
              <div className="text-5xl mb-4">🏠</div>
              <h3 className="text-xl font-black uppercase mb-2">No family yet</h3>
              <p className="text-muted-foreground font-bold mb-4">
                Create a family to start adding members and managing chores.
              </p>
              <Button
                onClick={handleCreateFamily}
                className="font-bold uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Family
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Family Members Card */}
      <Card className="border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] overflow-hidden">
        <CardHeader className="bg-[var(--event-blue)] border-b-2 border-border py-4">
          <CardTitle className="leading-none flex items-center gap-3 font-black uppercase tracking-tight">
            <UserPlus className="size-6" />
            Family Members
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm font-bold text-muted-foreground">
              Add, edit, or remove family members. Parents require email; kids do not.
            </p>
            <Button
              onClick={handleAddMember}
              size="sm"
              className="w-full sm:w-auto font-bold uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              disabled={creatingMember || membersLoading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
          {membersLoading ? (
            <div className="text-center py-8">
              <div className="text-4xl animate-bounce mb-2">👥</div>
              <p className="font-bold text-muted-foreground">Loading members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="relative text-center py-12 border-2 border-dashed border-border rounded-xl">
              <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="text-xl font-black uppercase mb-2">No members yet</h3>
              <p className="text-muted-foreground font-bold">
                Add your family to get started!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((member, index) => (
                <Card
                  key={member._id}
                  className={`border-2 border-border shadow-[3px_3px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all overflow-hidden`}
                >
                  {/* Color accent bar */}
                  <div className={`h-2 ${MEMBER_COLORS[index % MEMBER_COLORS.length].replace('/20', '')} border-b-2 border-border`} />
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-12 border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                        <AvatarImage src={member.profileImageUrl || undefined} alt={member.name} />
                        <AvatarFallback className="font-black text-lg bg-primary text-primary-foreground">
                          {member.iconEmoji || member.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-black truncate text-lg">{member.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`text-xs font-bold uppercase border border-border ${
                              member.role === 'parent'
                                ? 'bg-primary/20 text-foreground'
                                : 'bg-accent/20 text-foreground'
                            }`}
                          >
                            {member.role === 'parent' && <Crown className="size-3 mr-1" />}
                            {member.role}
                          </Badge>
                          {member._id === currentUser?._id && (
                            <Badge className="text-xs font-bold uppercase bg-secondary text-secondary-foreground border border-border">
                              You
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 font-bold uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--shadow-color)] transition-all"
                        onClick={() => handleEditMember(member)}
                        disabled={updatingMember}
                      >
                        <Pencil className="mr-2 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 font-bold uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--shadow-color)] transition-all"
                        onClick={() => handleDeleteMember(member)}
                        disabled={deletingMember || member._id === currentUser?._id}
                      >
                        <Trash2 className="mr-2 h-3 w-3" />
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

      {/* Invite Parents Card */}
      {family && currentUser?.role === "parent" && (
        <Card className="border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] overflow-hidden">
          <CardHeader className="bg-[var(--event-green)] border-b-2 border-border py-4">
            <CardTitle className="leading-none flex items-center gap-3 font-black uppercase tracking-tight">
              <Mail className="size-6" />
              Invite Parents
            </CardTitle>
          </CardHeader>
          <CardContent className="py-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm font-bold text-muted-foreground">
                Invite another parent to join your family. They will have full parent permissions.
              </p>
              <Button
                onClick={() => setInviteDialogOpen(true)}
                size="sm"
                className="w-full sm:w-auto font-bold uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                <Plus className="mr-2 h-4 w-4" />
                Invite Parent
              </Button>
            </div>
            <PendingInvitationsList />
          </CardContent>
        </Card>
      )}

      {/* Security Card */}
      <Card className="border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] overflow-hidden">
        <CardHeader className="bg-[var(--event-purple)] border-b-2 border-border py-4">
          <CardTitle className="leading-none flex items-center gap-3 font-black uppercase tracking-tight">
            <Shield className="size-6" />
            Security & Access
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4 space-y-4">
          <p className="text-sm font-bold text-muted-foreground">
            Family admin password protects family-level changes. Share member logins carefully. Reset parent passwords from the login page if needed.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="font-bold uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--shadow-color)] transition-all"
            >
              <Link href="/auth/forgot-password">
                🔑 Reset Password
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="font-bold uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--shadow-color)] transition-all"
            >
              <Link href="/auth/login">
                👤 Switch User
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight flex items-center gap-3">
              <Settings className="size-8" />
              Settings
            </h1>
            <p className="text-muted-foreground mt-2 font-bold">
              Manage your family, members, and security preferences.
            </p>
          </div>
          <Button
            variant="outline"
            asChild
            className="font-bold uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--shadow-color)] transition-all"
          >
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
