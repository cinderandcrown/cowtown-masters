import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageCircle, Mail, LogIn } from 'lucide-react';
import ChatTab from '@/components/pool/ChatTab';
import DMInbox from '@/components/pool/DMInbox';
import { useParticipant } from '@/lib/ParticipantContext';

export default function MessagingHub({ poolId }) {
  const [activeTab, setActiveTab] = useState('group');
  const [dmConversation, setDmConversation] = useState(null);
  const navigate = useNavigate();
  const { poolId: routePoolId } = useParams();

  const { isLoggedIn, participant } = useParticipant();

  // Require login for messaging
  if (!isLoggedIn) {
    return (
      <div className="px-3 pt-3 pb-0">
        <div className="bg-gradient-to-br from-secondary to-primary rounded-xl p-6 border border-accent/30 text-center animate-fade-in-up">
          <MessageCircle className="w-10 h-10 text-accent mx-auto mb-3" />
          <h2 className="text-xl font-bold text-primary-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Messages
          </h2>
          <p className="text-sm text-primary-foreground/70 mb-4">
            Sign in to join the smack talk and send direct messages
          </p>
          <button
            onClick={() => navigate(`/pool/${routePoolId || poolId}/login`)}
            className="inline-flex items-center gap-2 bg-accent text-white font-bold px-6 py-2.5 rounded-lg hover:bg-accent/90 transition"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'group', label: 'Smack Talk', Icon: MessageCircle },
    { id: 'dms', label: 'Direct Messages', Icon: Mail },
  ];

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
      {/* Sub-tab Switcher */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex gap-1 bg-primary/5 rounded-xl p-1 border border-primary/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setDmConversation(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'group' && (
        <ChatTab poolId={poolId} participantIdentity={participant?.participant_name} />
      )}
      {activeTab === 'dms' && (
        <DMInbox
          poolId={poolId}
          currentUser={participant?.participant_name}
          conversation={dmConversation}
          onOpenConversation={setDmConversation}
          onBack={() => setDmConversation(null)}
        />
      )}
    </div>
  );
}