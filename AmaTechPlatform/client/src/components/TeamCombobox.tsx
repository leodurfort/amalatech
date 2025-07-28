import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface TeamComboboxProps {
  value: string[];
  onChange: (value: string[]) => void;
  currentUserId?: string;
  placeholder?: string;
}

// Extended team members list
const teamMembers: TeamMember[] = [
  { id: "1", name: "Zed Douze", email: "z.douze@amalaparters.com" },
  { id: "2", name: "Marc Dupont", email: "m.dupont@amalaparters.com" },
  { id: "3", name: "Sophie Martin", email: "s.martin@amalaparters.com" },
  { id: "4", name: "Alexandre Leroy", email: "a.leroy@amalaparters.com" },
  { id: "5", name: "Isabelle Moreau", email: "i.moreau@amalaparters.com" },
  { id: "6", name: "Claire Marchand", email: "c.marchand@amalaparters.com" },
  { id: "7", name: "Pierre Durand", email: "p.durand@amalaparters.com" },
  { id: "8", name: "Julie Lambert", email: "j.lambert@amalaparters.com" },
  { id: "9", name: "Thomas Bernard", email: "t.bernard@amalaparters.com" },
  { id: "10", name: "Marie Rousseau", email: "m.rousseau@amalaparters.com" },
  { id: "11", name: "Antoine Petit", email: "a.petit@amalaparters.com" },
  { id: "12", name: "Laura Vincent", email: "l.vincent@amalaparters.com" },
];

export default function TeamCombobox({ value, onChange, currentUserId, placeholder = "Sélectionner des membres..." }: TeamComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedMembers = teamMembers.filter(member => value.includes(member.name));
  const availableMembers = teamMembers.filter(member => !value.includes(member.name));

  const handleSelect = (memberName: string) => {
    if (!value.includes(memberName)) {
      onChange([...value, memberName]);
    }
    setOpen(false);
  };

  const handleRemove = (memberName: string) => {
    // Prevent removing current user if they are selected
    const currentUserName = teamMembers.find(m => m.id === currentUserId)?.name;
    if (memberName === currentUserName) {
      return;
    }
    onChange(value.filter(name => name !== memberName));
  };

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left font-normal"
          >
            <span className="truncate">
              {selectedMembers.length === 0 
                ? placeholder 
                : `${selectedMembers.length} membre${selectedMembers.length > 1 ? 's' : ''} sélectionné${selectedMembers.length > 1 ? 's' : ''}`
              }
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Rechercher un membre..." />
            <CommandList>
              <CommandEmpty>Aucun membre trouvé.</CommandEmpty>
              <CommandGroup>
                {availableMembers.map((member) => (
                  <CommandItem
                    key={member.id}
                    value={member.name}
                    onSelect={() => handleSelect(member.name)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{member.name}</span>
                      <span className="text-xs text-muted-foreground">{member.email}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected members badges */}
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedMembers.map((member) => {
            const currentUserName = teamMembers.find(m => m.id === currentUserId)?.name;
            const isCurrentUser = member.name === currentUserName;
            
            return (
              <Badge
                key={member.id}
                variant="secondary"
                className="flex items-center gap-1 px-2 py-1"
              >
                {member.name}
                {!isCurrentUser && (
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => handleRemove(member.name)}
                  />
                )}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}