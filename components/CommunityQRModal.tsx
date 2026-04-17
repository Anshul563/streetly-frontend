"use client";
import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Check, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  community: { id: number; name: string; inviteCode: string };
  onClose: () => void;
};

export function CommunityQRModal({ community, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const joinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${community.inviteCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Invite to {community.name}</h2>
            <p className="text-xs text-muted-foreground">Share this QR or link</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-inner">
            <QRCodeSVG
              value={joinUrl}
              size={200}
              level="H"
              includeMargin={false}
              imageSettings={{
                src: "/logo.png",
                x: undefined,
                y: undefined,
                height: 36,
                width: 36,
                excavate: true,
              }}
            />
          </div>
        </div>

        {/* Invite Link */}
        <div className="bg-muted rounded-xl p-3 mb-4">
          <p className="text-xs text-muted-foreground mb-1">Invite Link</p>
          <p className="text-sm font-mono break-all text-foreground">{joinUrl}</p>
        </div>

        <Button onClick={handleCopy} className="w-full gap-2">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy Link"}
        </Button>
      </div>
    </div>
  );
}
