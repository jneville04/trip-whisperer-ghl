import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, BookOpen, Users, ChevronDown } from "lucide-react";
import { defaultProposal, type ProposalData } from "@/types/proposal";
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

  // Group fields
  const [groupTripTitle, setGroupTripTitle] = useState("");
  const [groupStartDate, setGroupStartDate] = useState<Date>();
  const [groupEndDate, setGroupEndDate] = useState<Date>();
  const [groupDestination, setGroupDestination] = useState("");
  const [groupName, setGroupName] = useState("");

  const [creating, setCreating] = useState(false);

  const resetProposal = () => {
    setClientName("");
    setTripTitle("");
    setStartDate(undefined);
    setEndDate(undefined);
    setDestination("");
  };

  const resetGroup = () => {
    setGroupTripTitle("");
    setGroupStartDate(undefined);
    setGroupEndDate(undefined);
    setGroupDestination("");
    setGroupName("");
  };

  const formatDateRange = (start?: Date, end?: Date) => {
    if (!start && !end) return "";
    if (start && end) return `${format(start, "MMM d")}–${format(end, "d, yyyy")}`;
    if (start) return format(start, "MMM d, yyyy");
    return "";
  };

  const handleCreateProposal = async () => {
    if (!tripTitle.trim()) {
      toast({ title: "Please enter a trip title", variant: "destructive" });
      return;
    }
    setCreating(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) { setCreating(false); return; }

    const proposalData: ProposalData = {
      ...defaultProposal,
      proposalType: "proposal",
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
    if (!groupTripTitle.trim()) {
      toast({ title: "Please enter a trip title", variant: "destructive" });
      return;
    }
    setCreating(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) { setCreating(false); return; }

    const proposalData: ProposalData = {
      ...defaultProposal,
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
          <Button variant="travel" size="sm" className="px-5 font-medium">
            <Plus className="h-4 w-4 mr-1.5" /> Create Trip <ChevronDown className="h-3 w-3 ml-2 opacity-70" />
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
              <Label htmlFor="clientName">Client Name</Label>
              <Input id="clientName" placeholder="Search or enter client name..." value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tripTitle">Trip Title</Label>
              <Input id="tripTitle" placeholder="e.g. Italy Adventure 2026" value={tripTitle} onChange={(e) => setTripTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {startDate ? format(startDate, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {endDate ? format(endDate, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
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
              <Label htmlFor="groupTripTitle">Group Trip Title</Label>
              <Input id="groupTripTitle" placeholder="e.g. Portugal Group Tour 2026" value={groupTripTitle} onChange={(e) => setGroupTripTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !groupStartDate && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {groupStartDate ? format(groupStartDate, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={groupStartDate} onSelect={setGroupStartDate} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !groupEndDate && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {groupEndDate ? format(groupEndDate, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={groupEndDate} onSelect={setGroupEndDate} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="groupDestination">Destination(s)</Label>
              <Input id="groupDestination" placeholder="e.g. Lisbon, Porto, Fátima" value={groupDestination} onChange={(e) => setGroupDestination(e.target.value)} />
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
