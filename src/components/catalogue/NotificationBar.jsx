import React, { useState, useRef, useEffect } from "react";
import { AlertTriangle, ImageOff, Bell } from "lucide-react";

function getMissingReasons(product) {
  const reasons = [];
  if (!product.image_url) reasons.push("no image");
  if (!product.brand) reasons.push("no brand");
  if (!product.category) reasons.push("no category");
  if (!product.product_name) reasons.push("no name");
  return reasons;
}

export default function NotificationBar({ products, onOpenMissing }) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const ref = useRef();

  const noImage = products.filter((p) => !p.image_url);
  const incomplete = products.filter((p) => getMissingReasons(p).length > 0);
  const noImageCount = noImage.length;
  const incompleteCount = incomplete.length;
  const otherCount = incompleteCount - noImageCount;
  const totalIssues = incompleteCount;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setPopoverOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (totalIssues === 0) return null;

  return (
    <div className="flex items-center px-6 py-2 border-b border-border/20 bg-background/60" ref={ref}>
      <div className="relative">
        <button
          onClick={() => setPopoverOpen((o) => !o)}
          className="relative flex items-center justify-center w-9 h-9 rounded-full bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 transition-colors"
          title="Incomplete products"
        >
          <Bell className="w-4 h-4 text-yellow-400" />
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-yellow-500 text-[10px] font-bold text-black rounded-full flex items-center justify-center">
            {totalIssues}
          </span>
        </button>

        {popoverOpen && (
          <div className="absolute top-full left-0 mt-2 z-[9999] w-64 bg-popover border border-border/50 rounded-lg shadow-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-foreground mb-2">Incomplete Products</p>
            {noImageCount > 0 && (
              <button
                onClick={() => { setPopoverOpen(false); onOpenMissing(); }}
                className="w-full flex items-center gap-2 text-xs text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg px-3 py-2 transition-colors text-left"
              >
                <ImageOff className="w-3.5 h-3.5 shrink-0" />
                <span>{noImageCount} product{noImageCount !== 1 ? "s" : ""} missing image</span>
              </button>
            )}
            {otherCount > 0 && (
              <button
                onClick={() => { setPopoverOpen(false); onOpenMissing(); }}
                className="w-full flex items-center gap-2 text-xs text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg px-3 py-2 transition-colors text-left"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{otherCount} product{otherCount !== 1 ? "s" : ""} with missing info</span>
              </button>
            )}
            <button
              onClick={() => { setPopoverOpen(false); onOpenMissing(); }}
              className="w-full text-xs text-primary hover:underline text-left pt-1"
            >
              View all {incompleteCount} incomplete →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}