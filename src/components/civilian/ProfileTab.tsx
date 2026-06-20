"use client";

import { Award, Shield, Phone, MessageSquare, Zap, Activity, Settings } from "lucide-react";
import { useTravelSafeStore } from "@/store/useTravelSafeStore";

export function ProfileTab() {
  const userName = useTravelSafeStore((s) => s.userName) || "Priya Sharma";
  const trustScore = useTravelSafeStore((s) => s.trustScore) || 98;

  const badges = [
    { title: "Verified Citizen", desc: "Aadhaar e-KYC linked", icon: <Shield size={14} className="text-emerald-400" /> },
    { title: "Night Traveler", desc: "50+ night journeys", icon: <Zap size={14} className="text-cyan-400" /> },
    { title: "Safety Champion", desc: "Top 5% in district", icon: <Award size={14} className="text-purple-400" /> },
  ];

  const emergencyContacts = [
    { name: "Vikram Sharma (Father)", relation: "Family", available: "Available", status: "online" },
    { name: "Ananya Roy", relation: "Friend", available: "Co-traveling", status: "journey" },
    { name: "TravelSafe Patrol Alpha", relation: "Guardian", available: "Active Patrol", status: "guardian" },
  ];

  const contactColors: Record<string, string> = {
    online: "bg-emerald-400",
    journey: "bg-cyan-400",
    guardian: "bg-purple-400",
  };

  return (
    <div className="p-4 space-y-4">
      {/* Profile Overview Card */}
      <div className="rounded-2xl p-4 bg-white/[0.01] border border-white/5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-2 border-emerald-500/30 flex items-center justify-center text-lg font-bold text-white">
          {userName.split(" ").map(n => n[0]).join("").toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-bold text-white">{userName}</h3>
            <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded">
              VERIFIED
            </span>
          </div>
          <p className="text-[10px] text-white/40 mt-0.5">Account ID: TSX-9834-DLI</p>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400/90 font-mono">
            <span>Trust Score:</span>
            <span className="font-bold">{trustScore}%</span>
          </div>
        </div>
      </div>

      {/* Gamification / Safety Streaks */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <span className="text-[8px] text-white/30 uppercase block font-mono">Safety Streak</span>
          <span className="text-xl font-bold text-white block mt-1">32 Journeys</span>
          <span className="text-[8px] text-emerald-400 mt-1 block">✓ 100% Secure trips</span>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <span className="text-[8px] text-white/30 uppercase block font-mono">Helping Points</span>
          <span className="text-xl font-bold text-white block mt-1">1,240 XP</span>
          <span className="text-[8px] text-cyan-400 mt-1 block">+120 for alert verification</span>
        </div>
      </div>

      {/* Badges Earned */}
      <div className="space-y-2">
        <h3 className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex items-center gap-1.5">
          <Award size={10} className="text-emerald-400" /> Achieved Badges
        </h3>
        
        <div className="grid grid-cols-3 gap-1.5">
          {badges.map((b) => (
            <div key={b.title} className="p-2 rounded-xl bg-white/[0.01] border border-white/5 text-center flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-1.5">
                {b.icon}
              </div>
              <h4 className="text-[9px] font-bold text-white/80 leading-none">{b.title}</h4>
              <span className="text-[7px] text-white/30 block mt-1 leading-none">{b.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="space-y-2">
        <h3 className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex items-center gap-1.5">
          <Phone size={10} className="text-emerald-400" /> Emergency Guardians
        </h3>

        <div className="space-y-2">
          {emergencyContacts.map((contact) => (
            <div
              key={contact.name}
              className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-semibold text-white/40">
                    {contact.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0a0a0f] ${contactColors[contact.status]}`} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white/80">{contact.name}</h4>
                  <p className="text-[9px] text-white/30">{contact.relation} · {contact.available}</p>
                </div>
              </div>
              
              <div className="flex gap-1">
                <button className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white">
                  <Phone size={12} />
                </button>
                <button className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white">
                  <MessageSquare size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wearables / Connected Devices Settings */}
      <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Activity size={14} className="text-cyan-400" />
          <div>
            <h4 className="text-xs font-semibold text-white/80">Wearable Device Link</h4>
            <p className="text-[9px] text-white/30">Apple Watch Series 9 connected</p>
          </div>
        </div>
        <Settings size={14} className="text-white/30" />
      </div>
    </div>
  );
}
