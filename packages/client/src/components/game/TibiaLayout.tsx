import { GameCanvas } from './GameCanvas';
import { Sidebar } from './Sidebar';
import { GameChat } from './GameChat';

export function TibiaLayout() {
  return (
    <div className="h-screen w-screen bg-[#1a1a2e] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="h-6 bg-[#2d2d44] border-b border-[#3d3d5c] flex items-center px-2">
        <span className="text-[#888] text-xs">Web Tibia</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Game view */}
        <div className="flex-1 flex items-center justify-center p-2">
          <GameCanvas />
        </div>

        {/* Right sidebar */}
        <Sidebar />
      </div>

      {/* Bottom chat area */}
      <GameChat />
    </div>
  );
}
