// app/(dashboard)/_components/DeleteLeadButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { DeleteModal } from "@/components/DeleteModal";
import { showToast } from "@/lib/toast";

interface DeleteLeadButtonProps {
  leadId: string;
  leadName: string;
}

export function DeleteLeadButton({ leadId, leadName }: DeleteLeadButtonProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDeleteLead = async (reason: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        showToast.success("Lead archived successfully!");
        setDeleteModalOpen(false);
        router.push("/dashboard/leads");
        router.refresh();
      } else {
        throw new Error("Failed to delete lead");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showToast.error("Failed to delete lead");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setDeleteModalOpen(true)}
        className="flex items-center gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Delete Lead
      </Button>

      <DeleteModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteLead}
        title="Delete Lead"
        description="This lead will be deleted."
        itemName={leadName}
        isLoading={isDeleting}
      />
    </>
  );
}
