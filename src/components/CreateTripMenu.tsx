import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, BookOpen, Users } from "lucide-react";
import { blankProposal, type ProposalData } from "@/types/proposal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function RequiredMark() {
  return <span className="text-destructive ml-0.5">*</span>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-destructive text-xs mt-1">{message}</p>;
}

type ProposalErrors = {
  clientName?: string;
  tripTitle?: string;
  startDate?: string;
  endDate?: string;
};

type GroupErrors = {
  groupTripTitle?: string;
  groupStartDate?: string;
  groupEndDate?: string;
  groupDestination?: string;
};

export default function CreateTripMenu() {
  const navigate = useNavigate();
  const [proposalOpen, setProposalOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);

  // Proposal fields
  const [clientName, setClientName] = useState("");
  const [tripTitle, setTripTitle] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [destination, setDestination] = useState("");
  const [proposalErrors, setProposalErrors] = useState<ProposalErrors>({});

  // Group fields
  const [groupTripTitle, setGroupTripTitle] = useState("");
  const [groupStartDate, setGroupStartDate] = useState<Date>();
  const [groupEndDate, setGroupEndDate] = useState<Date>();
  const [groupDestination, setGroupDestination] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupErrors, setGroupErrors] = useState<GroupErrors>({});

  const [creating, setCreating] = useState(false);

  const resetProposal = () => {
    setClientName("");
    setTripTitle("");
    setStartDate(undefined);
    setEndDate(undefined);
    setDestination("");
    setProposalErrors({});
  };

  const resetGroup = () => {
    setGroupTripTitle("");
    setGroupStartDate(undefined);
    setGroupEndDate(undefined);
    setGroupDestination("");
    setGroupName("");
    setGroupErrors({});
  };

  const formatDateRange = (start?: Date, end?: Date) => {
    if (!start && !end) return "";
    if (start && end) return `${format(start, "MMM d")}–${format(end, "d, yyyy")}`;
    if (start) return format(start, "MMM d, yyyy");
    return "";
  };

  const validateProposal = (): boolean => {
    const errors: ProposalErrors = {};
    if (!clientName.trim()) errors.clientName = "This field is required.";
    if (!tripTitle.trim()) errors.tripTitle = "This field is required.";
    if (!startDate) errors.startDate = "This field is required.";
    if (!endDate) errors.endDate = "This field is required.";
    setProposalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateGroup = (): boolean => {
    const errors: GroupErrors = {};
    if (!groupTripTitle.trim()) errors.groupTripTitle = "This field is required.";
    if (!groupStartDate) errors.groupStartDate = "This field is required.";
    if (!groupEndDate) errors.groupEndDate = "This field is required.";
    if (!groupDestination.trim()) errors.groupDestination = "This field is required.";
    setGroupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateProposal = async () => {
    if (!validateProposal()) return;
    setCreating(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) { setCreating(false); return; }

    const proposalData: ProposalData = {
      ...blankProposal,
      proposalType: "proposal",
      tripName: tripTitle.trim(),
      clientName: clientName.trim(),
      destination: destination.trim(),
      travelDates: formatDateRange(startDate, endDate),
    };

    const { data, error } = await supabase
      .from("proposals")
      .insert({
        user_id: user.id,
        title: tripTitle.trim(),
        client_name: clientName.trim(),
        destination: destination.trim(),
        data: proposalData as any,
      })
      .select()
      .single();

    setCreating(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      setProposalOpen(false);
      resetProposal();
      navigate(`/editor/${(data as any).id}`);
    }
  };

  const handleCreateGroup = async () => {
    if (!validateGroup()) return;
    setCreating(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) { setCreating(false); return; }

    const proposalData: ProposalData = {
      ...blankProposal,
      proposalType: "group_booking",
      clientName: groupName.trim() || groupTripTitle.trim(),
      destination: groupDestination.trim(),
      travelDates: formatDateRange(groupStartDate, groupEndDate),
    };

    const { data, error } = await supabase
      .from("proposals")
      .insert({
        user_id: user.id,
        title: groupTripTitle.trim(),
        client_name: groupName.trim() || groupTripTitle.trim(),
        destination: groupDestination.trim(),
        data: proposalData as any,
      })
      .select()
      .single();

    setCreating(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      setGroupOpen(false);
      resetGroup();
      navigate(`/editor/${(data as any).id}`);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="travel" size="sm" className="gap-2.5 px-6 font-medium">
            <Plus className="h-4 w-4" />
            Create Trip
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => { resetProposal(); setProposalOpen(true); }}>
            <BookOpen className="h-4 w-4 mr-2" /> Create Proposal
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { resetGroup(); setGroupOpen(true); }}>
            <Users className="h-4 w-4 mr-2" /> Create Group Trip
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Proposal Modal */}
      <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Create Proposal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="clientName">Client Name<RequiredMark /></Label>
              <Input
                id="clientName"
                placeholder="Search or enter client name..."
                value={clientName}
                onChange={(e) => { setClientName(e.target.value); setProposalErrors((p) => ({ ...p, clientName: undefined })); }}
                className={cn(proposalErrors.clientName && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError message={proposalErrors.clientName} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tripTitle">Trip Title<RequiredMark /></Label>
              <Input
                id="tripTitle"
                placeholder="e.g. Italy Adventure 2026"
                value={tripTitle}
                onChange={(e) => { setTripTitle(e.target.value); setProposalErrors((p) => ({ ...p, tripTitle: undefined })); }}
                className={cn(proposalErrors.tripTitle && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError message={proposalErrors.tripTitle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date<RequiredMark /></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                        proposalErrors.startDate && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {startDate ? format(startDate, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={(d) => { setStartDate(d); setProposalErrors((p) => ({ ...p, startDate: undefined })); }} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <FieldError message={proposalErrors.startDate} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date<RequiredMark /></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground",
                        proposalErrors.endDate && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {endDate ? format(endDate, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={(d) => { setEndDate(d); setProposalErrors((p) => ({ ...p, endDate: undefined })); }} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <FieldError message={proposalErrors.endDate} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destination">Destination(s)</Label>
              <Input id="destination" placeholder="e.g. Rome, Florence, Venice" value={destination} onChange={(e) => setDestination(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="travel-outline" size="sm" onClick={() => setProposalOpen(false)}>Cancel</Button>
            <Button variant="travel" size="sm" onClick={handleCreateProposal} disabled={creating}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Trip Modal */}
      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Create Group Trip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="groupTripTitle">Group Trip Title<RequiredMark /></Label>
              <Input
                id="groupTripTitle"
                placeholder="e.g. Portugal Group Tour 2026"
                value={groupTripTitle}
                onChange={(e) => { setGroupTripTitle(e.target.value); setGroupErrors((p) => ({ ...p, groupTripTitle: undefined })); }}
                className={cn(groupErrors.groupTripTitle && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError message={groupErrors.groupTripTitle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date<RequiredMark /></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !groupStartDate && "text-muted-foreground",
                        groupErrors.groupStartDate && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {groupStartDate ? format(groupStartDate, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={groupStartDate} onSelect={(d) => { setGroupStartDate(d); setGroupErrors((p) => ({ ...p, groupStartDate: undefined })); }} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <FieldError message={groupErrors.groupStartDate} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date<RequiredMark /></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !groupEndDate && "text-muted-foreground",
                        groupErrors.groupEndDate && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {groupEndDate ? format(groupEndDate, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={groupEndDate} onSelect={(d) => { setGroupEndDate(d); setGroupErrors((p) => ({ ...p, groupEndDate: undefined })); }} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <FieldError message={groupErrors.groupEndDate} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="groupDestination">Destination(s)<RequiredMark /></Label>
              <Input
                id="groupDestination"
                placeholder="e.g. Lisbon, Porto, Fátima"
                value={groupDestination}
                onChange={(e) => { setGroupDestination(e.target.value); setGroupErrors((p) => ({ ...p, groupDestination: undefined })); }}
                className={cn(groupErrors.groupDestination && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError message={groupErrors.groupDestination} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="groupName">Group Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input id="groupName" placeholder="e.g. Smith Family Reunion" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="travel-outline" size="sm" onClick={() => setGroupOpen(false)}>Cancel</Button>
            <Button variant="travel" size="sm" onClick={handleCreateGroup} disabled={creating}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
