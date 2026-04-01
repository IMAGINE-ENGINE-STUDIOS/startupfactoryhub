import { useState } from "react";
import { Rocket, Shield, Moon, Flame } from "lucide-react";
import SpaceInvadersGame from "./SpaceInvadersGame";
import AsteroidDodgerGame from "./AsteroidDodgerGame";
import LunarLanderGame from "./LunarLanderGame";
import RocketLaunchGame from "./RocketLaunchGame";

const GAMES = [
  { id: "invaders", name: "INVADERS", icon: Shield, component: SpaceInvadersGame },
  { id: "asteroids", name: "ASTEROIDS", icon: Rocket, component: AsteroidDodgerGame },
  { id: "lander", name: "LANDER", icon: Moon, component: LunarLanderGame },
  { id: "launch", name: "LAUNCH", icon: Flame, component: RocketLaunchGame },
] as const;

const SpaceArcade = () => {
  const [activeGame, setActiveGame] = useState(0);
  const ActiveComponent = GAMES[activeGame].component;

  return (
    <div>
      {/* Game selector tabs */}
      <div className="flex gap-1 mb-3">
        {GAMES.map((game, i) => {
          const Icon = game.icon;
          return (
            <button
              key={game.id}
              onClick={() => setActiveGame(i)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-futuristic tracking-wider transition-all ${
                i === activeGame
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "glass-morphism text-muted-foreground hover:text-primary border border-transparent hover:border-primary/20"
              }`}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{game.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active game */}
      <ActiveComponent />
    </div>
  );
};

export default SpaceArcade;
