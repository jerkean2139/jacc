import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Search } from "lucide-react";

interface ExternalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  query: string;
}

export function ExternalSearchDialog({ isOpen, onClose, onApprove, query }: ExternalSearchDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Search External Sources?
          </DialogTitle>
          <DialogDescription className="text-left">
            I didn't find specific information about your query in our internal document database.
            <br /><br />
            <strong>Your query:</strong> "{query}"
            <br /><br />
            Would you like me to search external sources for additional information? This will help provide more comprehensive answers but will search outside our internal knowledge base.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            No, Keep Internal Only
          </Button>
          <Button onClick={onApprove} className="w-full sm:w-auto">
            <Search className="w-4 h-4 mr-2" />
            Yes, Search External Sources
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}