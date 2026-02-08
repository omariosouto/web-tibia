import { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: number;
  time: string;
  text: string;
  type: 'info' | 'combat' | 'system';
}

export function GameChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, time: getTime(), text: 'Welcome to Web Tibia!', type: 'system' },
    { id: 2, time: getTime(), text: 'Use arrow keys or WASD to move.', type: 'info' },
    { id: 3, time: getTime(), text: 'Click on monsters to attack them.', type: 'info' },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for combat events from window
  useEffect(() => {
    const handleCombatMessage = (event: CustomEvent<string>) => {
      addMessage(event.detail, 'combat');
    };

    window.addEventListener('combat-message' as never, handleCombatMessage as never);
    return () => {
      window.removeEventListener('combat-message' as never, handleCombatMessage as never);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function addMessage(text: string, type: ChatMessage['type']) {
    setMessages((prev) => [
      ...prev.slice(-50), // Keep last 50 messages
      { id: Date.now(), time: getTime(), text, type },
    ]);
  }

  function getTime(): string {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  const typeColors: Record<ChatMessage['type'], string> = {
    info: 'text-[#888]',
    combat: 'text-[#ff6b6b]',
    system: 'text-[#4ecdc4]',
  };

  return (
    <div className="h-[120px] bg-[#1a1a2e] border-t border-[#3d3d5c] flex flex-col">
      {/* Tab bar */}
      <div className="h-6 bg-[#2d2d44] flex items-center px-2 border-b border-[#3d3d5c]">
        <button className="px-3 py-1 text-xs text-white bg-[#3d3d5c] rounded-t">
          Default
        </button>
        <button className="px-3 py-1 text-xs text-[#888] hover:text-white">
          Game-Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-2 text-xs font-mono">
        {messages.map((msg) => (
          <div key={msg.id} className={`${typeColors[msg.type]}`}>
            <span className="text-[#555]">{msg.time}</span>{' '}
            <span>{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

// Export function to add combat messages from other components
export function addCombatMessage(text: string) {
  window.dispatchEvent(new CustomEvent('combat-message', { detail: text }));
}
