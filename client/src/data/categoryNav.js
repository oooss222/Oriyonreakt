import {
  Building2,
  Car,
  Sofa,
  Smartphone,
  WashingMachine,
  Laptop,
  Hammer,
} from "lucide-react";

export const CATEGORY_NAV_META = {
  realestate: {
    Icon: Building2,
    accent: "from-teal-400/25 via-teal-500/10 to-cyan-600/20",
    iconClass: "text-teal-200",
    ringClass: "group-hover:ring-teal-400/40",
    activeRing: "ring-teal-400/70 shadow-[0_0_20px_rgb(45_212_191/0.2)]",
  },
  transport: {
    Icon: Car,
    accent: "from-blue-400/25 via-blue-500/10 to-indigo-600/20",
    iconClass: "text-blue-200",
    ringClass: "group-hover:ring-blue-400/40",
    activeRing: "ring-blue-400/70 shadow-[0_0_20px_rgb(96_165_250/0.2)]",
  },
  furniture: {
    Icon: Sofa,
    accent: "from-amber-400/25 via-orange-500/10 to-amber-600/20",
    iconClass: "text-amber-200",
    ringClass: "group-hover:ring-amber-400/40",
    activeRing: "ring-amber-400/70 shadow-[0_0_20px_rgb(251_191_36/0.2)]",
  },
  phones: {
    Icon: Smartphone,
    accent: "from-violet-400/25 via-purple-500/10 to-fuchsia-600/20",
    iconClass: "text-violet-200",
    ringClass: "group-hover:ring-violet-400/40",
    activeRing: "ring-violet-400/70 shadow-[0_0_20px_rgb(167_139_250/0.2)]",
  },
  electronics: {
    Icon: WashingMachine,
    accent: "from-sky-400/25 via-cyan-500/10 to-blue-600/20",
    iconClass: "text-sky-200",
    ringClass: "group-hover:ring-sky-400/40",
    activeRing: "ring-sky-400/70 shadow-[0_0_20px_rgb(56_189_248/0.2)]",
  },
  computers: {
    Icon: Laptop,
    accent: "from-slate-300/20 via-slate-400/10 to-slate-600/25",
    iconClass: "text-slate-200",
    ringClass: "group-hover:ring-slate-300/40",
    activeRing: "ring-slate-300/70 shadow-[0_0_20px_rgb(203_213_225/0.15)]",
  },
  repair: {
    Icon: Hammer,
    accent: "from-yellow-400/25 via-amber-500/10 to-orange-600/20",
    iconClass: "text-yellow-200",
    ringClass: "group-hover:ring-yellow-400/40",
    activeRing: "ring-yellow-400/70 shadow-[0_0_20px_rgb(250_204_21/0.2)]",
  },
};
