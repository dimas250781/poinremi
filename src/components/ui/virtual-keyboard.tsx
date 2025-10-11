
"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { ArrowLeft } from "lucide-react";

interface VirtualKeyboardProps {
  isOpen: boolean;
  onKeyPress: (key: string) => void;
  onClose: () => void;
}

export function VirtualKeyboard({ isOpen, onKeyPress, onClose }: VirtualKeyboardProps) {
  const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '-', '0', 'backspace'
  ];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="w-full max-w-sm mx-auto rounded-t-2xl border-none bg-background/95 backdrop-blur-sm">
            <div className="grid grid-cols-3 gap-2 p-4">
                {keys.map((key) => (
                <Button
                    key={key}
                    variant="outline"
                    className="h-16 text-2xl font-bold bg-card hover:bg-accent/80"
                    onClick={() => onKeyPress(key)}
                >
                    {key === 'backspace' ? <ArrowLeft /> : key}
                </Button>
                ))}
            </div>
        </SheetContent>
    </Sheet>
  );
}
