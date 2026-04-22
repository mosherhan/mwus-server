"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface Props {
  page?: string;
  onOpen: () => void;
}

const hints: Record<string, string> = {
  home: "Not sure where to start? I can guide you.",
  services: "Need help choosing the right service?",
  contact: "Skip forms. Talk to me directly.",
  default: "Have a question? I'm here to help.",
};

export default function ProactiveHint({ page = "default", onOpen }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const hint = hints[page] || hints.default;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute bottom-16 right-0 bg-white shadow-lg rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-gray-700 max-w-[200px] border border-gray-100 cursor-pointer"
          onClick={() => { setVisible(false); onOpen(); }}
        >
          <button
            onClick={e => { e.stopPropagation(); setVisible(false); }}
            className="absolute top-1 right-1 text-gray-300 hover:text-gray-500"
          >
            <X size={12} />
          </button>
          {hint}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
