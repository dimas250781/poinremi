"use client";

import { useState, useMemo, type KeyboardEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PlusCircle,
  RotateCw,
  Trophy,
  UserPlus,
  Plus,
  Trash2,
  History,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Player = {
  id: number;
  name: string;
};

type Round = number[];

export default function ScoreboardPage() {
  const [players, setPlayers] = useState<Player[]>([
    // {id: 1, name: "Player 1"},
    // {id: 2, name: "Player 2"},
    // {id: 3, name: "Player 3"},
  ]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentScores, setCurrentScores] = useState<(string | number)[]>([]);
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      const newPlayer: Player = {
        id: Date.now(),
        name: newPlayerName.trim(),
      };
      setPlayers([...players, newPlayer]);
      setNewPlayerName("");
      setCurrentScores([...currentScores, ""]);
      setIsAddPlayerDialogOpen(false);
    }
  };

  const handleCutPlayer = (playerId: number) => {
    const playerIndex = players.findIndex(p => p.id === playerId);
    if(playerIndex !== -1) {
      setRounds(rounds.map(round => {
        const newRound = [...round];
        newRound.splice(playerIndex, 1);
        return newRound;
      }));
      const newCurrentScores = [...currentScores];
      newCurrentScores.splice(playerIndex, 1);
      setCurrentScores(newCurrentScores);
      setPlayers(players.filter((p) => p.id !== playerId));
    }
  };

  const handleAddPlayerOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddPlayer();
    }
  };

  const handleNewRound = () => {
    const newRound = currentScores.map(score => Number(score) || 0);
    setRounds([...rounds, newRound]);
    setCurrentScores(Array(players.length).fill(""));
  };
  
  const totalScores = useMemo(() => {
    return players.map((_, playerIndex) => {
      const roundsScore = rounds.reduce((total, round) => total + (round[playerIndex] || 0), 0);
      const currentScore = Number(currentScores[playerIndex] || 0);
      return roundsScore + currentScore;
    });
  }, [rounds, players, currentScores]);


  const handleResetScores = () => {
    setRounds([]);
    setCurrentScores(Array(players.length).fill(""));
  }

  const handleFinishGame = () => {
    setPlayers([]);
    setRounds([]);
    setCurrentScores([]);
    setNewPlayerName("");
  }

  const gridColsClass = `grid-cols-${players.length > 0 ? players.length : 1}`;

  return (
    <main className="flex flex-col items-center justify-center p-4 bg-gray-800 min-h-screen text-foreground">
      <div className="w-full max-w-sm h-[80vh] max-h-[700px] flex flex-col bg-background rounded-2xl shadow-2xl overflow-hidden">
        
        <div className="flex-shrink-0 p-4">
          <header className="w-full mb-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <Trophy className="w-10 h-10 text-accent" />
              <h1 className="text-5xl font-bold text-accent">
                SKOR REMI
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Dibuat oleh: M01 Software Development
            </p>
          </header>

          <div className="flex justify-center gap-2">
            <AlertDialog open={isAddPlayerDialogOpen} onOpenChange={setIsAddPlayerDialogOpen}>
              <AlertDialogTrigger asChild>
                  <Button variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                      <Plus className="mr-2" /> Add Player
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                  <AlertDialogTitle>Add a New Player</AlertDialogTitle>
                  <AlertDialogDescription>
                      Enter the name of the player you want to add to the game.
                  </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                      <Input
                          placeholder="Player Name"
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          onKeyDown={handleAddPlayerOnEnter}
                          aria-label="New player name"
                          autoFocus
                      />
                  </div>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleAddPlayer}>Add</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>


            <Button variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleNewRound}>
              <Plus className="mr-2" /> New Round
            </Button>
            <Button variant="outline">
              <History className="mr-2"/> Winner History
            </Button>
          </div>
        </div>
        
        <div className="p-4 border-t border-b border-border">
          <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${players.length > 0 ? players.length : 1}, 1fr)` }}>
            {players.map((player, index) => (
              <div key={player.id} className="text-center">
                <p className="font-semibold text-lg truncate">{player.name}</p>
                <Button variant="destructive" size="sm" className="mt-1 h-7 text-xs" onClick={() => handleCutPlayer(player.id)}>
                  <Trash2 className="mr-1 h-3 w-3" /> Cut
                </Button>
              </div>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-grow">
          <div className="p-4 space-y-2">
            {rounds.map((round, roundIndex) => (
              <div key={roundIndex} className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${players.length}, 1fr)` }}>
                {round.map((score, playerIndex) => (
                  <div key={`${roundIndex}-${playerIndex}`} className="bg-accent text-accent-foreground rounded-md p-2 text-center text-xl font-bold">
                      {score}
                  </div>
                ))}
              </div>
            ))}
            {players.length > 0 && (
              <div className={`grid gap-4 mt-2`} style={{ gridTemplateColumns: `repeat(${players.length}, 1fr)` }}>
                  {players.map((player, index) => (
                  <div key={player.id} className="text-center">
                      <Input
                      type="number"
                      placeholder="0"
                      value={currentScores[index]}
                      onChange={(e) => {
                          const newScores = [...currentScores];
                          newScores[index] = e.target.value;
                          setCurrentScores(newScores);
                      }}
                      className="text-center bg-yellow-200/20 border-yellow-400 text-yellow-200 placeholder:text-yellow-200/50 text-xl font-bold h-12"
                      />
                  </div>
                  ))}
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex-shrink-0 mt-auto">
            <div className="p-4">
              {players.length > 0 && (
                <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${players.length}, 1fr)` }}>
                    {players.map((player, index) => (
                        <div key={player.id} className="bg-yellow-300/80 text-background rounded-md p-2 text-center text-2xl font-bold">
                            {totalScores[index] || 0}
                        </div>
                      ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-border">
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={handleResetScores}>
                  <RotateCw className="mr-2" /> Reset Scores
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                        <Trophy className="mr-2" /> Finish Game
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to finish the game?</AlertDialogTitle>
                      <AlertDialogDescription>
                          This will clear all players and scores. This action cannot be undone.
                      </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleFinishGame} className="bg-destructive hover:bg-destructive/90">Finish Game</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
              </div>
            </div>
        </div>
      </div>
    </main>
  );
}
