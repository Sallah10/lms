// components/DeleteModal.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface DeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  description: string;
  itemName: string;
  isLoading?: boolean;
}

export function DeleteModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false,
}: DeleteModalProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert("Please provide a reason for deletion");
      return;
    }
    onConfirm(reason);
    setReason(""); // Reset on close
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="font-medium mb-2">Item to delete: {itemName}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium mb-2">
              Reason for deletion *
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this item is being deleted..."
              required
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This reason will be recorded in the audit log and sent to the CTO.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !reason.trim()}
            variant="destructive"
          >
            {isLoading ? "Deleting..." : "Confirm Deletion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
