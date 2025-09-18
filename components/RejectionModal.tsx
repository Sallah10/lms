"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface RejectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  leadName: string;
  title?: string;
  description?: string;
  confirmButtonText?: string;
}

export function RejectionModal({
  open,
  onClose,
  onConfirm,
  leadName,
  title = "Reject Lead",
  description = "Please provide reasons for rejecting this lead. This feedback will be visible to the sales representative.",
  confirmButtonText = "Confirm Rejection",
}: RejectionModalProps) {
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(notes);
    setNotes(""); // Reset notes after confirmation
  };

  const handleClose = () => {
    onClose();
    setNotes(""); // Reset notes when closing
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description.replace("{leadName}", leadName)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            placeholder="Enter rejection reasons..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!notes.trim()}
          >
            {confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
