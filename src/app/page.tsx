
"use client";

import { useState, useMemo, type KeyboardEvent, useEffect } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Trash2,
  History,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const playerColors = [
  { id: 'default', name: 'Default', bg: 'bg-accent/20', border: 'border-border', headerBg: 'bg-card', text: 'text-foreground' },
  { id: 'red', name: 'Red', bg: 'bg-red-500', border: 'border-red-500', text: 'text-white' },
  { id: 'blue', name: 'Blue', bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-white' },
  { id: 'green', name: 'Green', bg: 'bg-green-500', border: 'border-green-500', text: 'text-white' },
  { id: 'yellow', name: 'Yellow', bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-black' },
  { id: 'purple', name: 'Purple', bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-white' },
  { id: 'pink', name: 'Pink', bg: 'bg-pink-500', border: 'border-pink-500', text: 'text-white' },
];

type PlayerColor = typeof playerColors[number];

type Player = {
  id: number;
  name: string;
  color: PlayerColor;
};

type PlayerWithScore = Player & {
  totalScore: number;
  originalIndex: number;
}

type Round = (number | string)[];

type GameResult = {
  id: number;
  timestamp: Date;
  players: PlayerWithScore[];
}

export default function ScoreboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerColor, setNewPlayerColor] = useState<PlayerColor>(playerColors[1]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentScores, setCurrentScores] = useState<(string | number)[]>([]);
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [isWinnerDialogOpen, setIsWinnerDialogOpen] = useState(false);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState("");
  
  const { toast } = useToast();

  const usedPlayerColors = useMemo(() => new Set(players.map(p => p.color.id)), [players]);

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      const newPlayer: Player = {
        id: Date.now(),
        name: newPlayerName.trim(),
        color: newPlayerColor,
      };
      setPlayers([...players, newPlayer]);
      setNewPlayerName("");
      const firstAvailableColor = playerColors.find(c => c.id !== 'default' && !usedPlayerColors.has(c.id) && c.id !== newPlayerColor.id) || playerColors.find(c => c.id !== 'default' && !usedPlayerColors.has(c.id));
      if (firstAvailableColor) {
        setNewPlayerColor(firstAvailableColor);
      }
      setCurrentScores([...currentScores, ""]);
      setIsAddPlayerDialogOpen(false);
    }
  };
  
  const handleStartEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setEditingPlayerName(player.name);
  }

  const handleCancelEditPlayer = () => {
    setEditingPlayer(null);
    setEditingPlayerName("");
  }
  
  const handleUpdatePlayerName = () => {
    if(!editingPlayer || !editingPlayerName.trim()) return;
    
    setPlayers(players.map(p => 
      p.id === editingPlayer.id ? { ...p, name: editingPlayerName.trim() } : p
    ));
    
    toast({
      title: "Success",
      description: `Player name updated to ${editingPlayerName.trim()}`
    });
    handleCancelEditPlayer();
  }
  
  const handleCutPlayer = (playerIdToCut: number) => {
    const playerIndex = players.findIndex(p => p.id === playerIdToCut);
    if (playerIndex === -1) return;

    // Set all past scores for this player to 0
    const newRounds = rounds.map(round => {
        const updatedRound = [...round];
        updatedRound[playerIndex] = 0;
        return updatedRound;
    });
    setRounds(newRounds);

    // Set current input score for this player to 0
    const newCurrentScores = [...currentScores];
    newCurrentScores[playerIndex] = 0;
    setCurrentScores(newCurrentScores);

    toast({
        title: "Score Cut",
        description: `All scores for ${players[playerIndex].name} have been reset to 0.`,
    });
  };

  const handleDeletePlayer = (playerIdToDelete: number) => {
    const playerIndex = players.findIndex(p => p.id === playerIdToDelete);
    if (playerIndex === -1) return;

    const playerName = players[playerIndex].name;

    // Remove player
    setPlayers(players.filter(p => p.id !== playerIdToDelete));

    // Remove their scores from all rounds
    setRounds(rounds.map(round => {
      const newRound = [...round];
      newRound.splice(playerIndex, 1);
      return newRound;
    }));

    // Remove their score from current input
    const newCurrentScores = [...currentScores];
    newCurrentScores.splice(playerIndex, 1);
    setCurrentScores(newCurrentScores);
    
    handleCancelEditPlayer();

    toast({
      title: "Player Deleted",
      description: `${playerName} has been removed from the game.`,
    });
  };

  const handleAddPlayerOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddPlayer();
    }
  };
  
  const handleUpdatePlayerOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleUpdatePlayerName();
    }
  };

  const handleNewRound = () => {
    if (players.length === 0) return;
    
    const newRound = currentScores.map(score => score === '' || score === '-' ? 0 : Number(score));
    
    setRounds([...rounds, newRound]);
    setCurrentScores(Array(players.length).fill(""));
  };
  
  const handleUndoRound = () => {
    if (rounds.length === 0) return;
    const lastRound = rounds[rounds.length - 1];
    const newRounds = rounds.slice(0, -1);
    
    setRounds(newRounds);
    setCurrentScores(lastRound.map(String));

    toast({
      title: "Undo Successful",
      description: "The last round has been removed.",
    });
  }

  const totalScores = useMemo(() => {
    return players.map((_, playerIndex) => {
      return rounds.reduce((total, round) => total + Number(round[playerIndex] || 0), 0);
    });
  }, [rounds, players]);
  
  const sortedPlayers = useMemo(() => {
    if (players.length === 0) return [];
    
    const combined: PlayerWithScore[] = players.map((player, index) => ({
      ...player,
      totalScore: totalScores[index] + Number(currentScores[index] || 0),
      originalIndex: index,
    }));
    
    combined.sort((a, b) => b.totalScore - a.totalScore);
    
    return combined;
  }, [players, totalScores, currentScores]);

  const handleFinishGame = (saveToHistory: boolean = true) => {
    if(saveToHistory && players.length > 0) {
      const finalScores = players.map((_, playerIndex) => {
        return rounds.reduce((total, round) => total + (Number(round[playerIndex]) || 0), 0) + Number(currentScores[playerIndex] || 0);
      });
      
      const sortedFinal: PlayerWithScore[] = players.map((player, index) => ({
        ...player,
        totalScore: finalScores[index] || 0,
        originalIndex: index,
      })).sort((a, b) => b.totalScore - a.totalScore);

      const newResult: GameResult = {
        id: Date.now(),
        timestamp: new Date(),
        players: sortedFinal,
      };
      setGameHistory([newResult, ...gameHistory]);
    }
    setPlayers([]);
    setRounds([]);
    setCurrentScores([]);
    setNewPlayerName("");
    setWinner(null);
    setIsWinnerDialogOpen(false);
  }

  const handleClearHistory = () => {
    setGameHistory([]);
    toast({
      title: "Success",
      description: "Winner history has been cleared."
    })
  }

  const handleScoreChange = (index: number, value: string) => {
    const newScores = [...currentScores];
    if (/^-?\d*$/.test(value)) {
      newScores[index] = value;
      setCurrentScores(newScores);
    }
  };

  useEffect(() => {
    const firstAvailableColor = playerColors.find(c => !usedPlayerColors.has(c.id) && c.id !== 'default');
    if (firstAvailableColor) {
      setNewPlayerColor(firstAvailableColor);
    }
  }, [isAddPlayerDialogOpen, usedPlayerColors]);

  useEffect(() => {
    if (players.length === 0) return;

    const scoresForWinnerCheck = players.map((_, playerIndex) => {
        return rounds.reduce((total, round) => total + (Number(round[playerIndex]) || 0), 0) + Number(currentScores[playerIndex] || 0);
      });

    const winnerCheck = players
        .map((p, i) => ({ name: p.name, score: scoresForWinnerCheck[i] }))
        .sort((a, b) => b.score - a.score)[0];

    if (winnerCheck && winnerCheck.score >= 1000) {
      if (!winner) {
        setWinner(winnerCheck.name);
        setIsWinnerDialogOpen(true);
      }
    } else {
      setWinner(null);
    }
  }, [rounds, currentScores, players, winner]);

  return (
    <main className="flex flex-col items-center justify-center p-4 bg-gray-800 min-h-screen text-foreground">
      <div className="w-full max-w-sm h-[90vh] max-h-[800px] flex flex-col bg-background rounded-2xl shadow-2xl overflow-hidden">
        
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

          <div className="flex justify-center gap-2 flex-wrap">
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
                      Enter player's name and choose a color for their column.
                  </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4 space-y-4">
                      <Input
                          type="text"
                          placeholder="Player Name"
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          onKeyDown={handleAddPlayerOnEnter}
                          aria-label="New player name"
                          autoFocus
                      />
                      <div className="flex flex-wrap gap-2 justify-center">
                        {playerColors.filter(c => c.id !== 'default').map(color => {
                          const isUsed = usedPlayerColors.has(color.id);
                          return (
                            <button
                              key={color.id}
                              type="button"
                              disabled={isUsed}
                              onClick={() => setNewPlayerColor(color)}
                              className={cn(
                                "w-8 h-8 rounded-full border-2",
                                color.bg,
                                newPlayerColor.id === color.id ? 'ring-2 ring-offset-2 ring-ring ring-offset-background' : 'border-transparent',
                                isUsed && 'opacity-25 cursor-not-allowed'
                              )}
                              aria-label={`Select ${color.name} color`}
                            />
                          )
                        })}
                      </div>
                  </div>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleAddPlayer}>Add</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleNewRound} disabled={players.length === 0}>
              <Plus className="mr-2" /> New Round
            </Button>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <History className="mr-2"/> Winner History
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col">
                <SheetHeader>
                  <SheetTitle>Winner History</SheetTitle>
                  <SheetDescription>
                    List of winners from previous games.
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="flex-grow pr-4">
                  <div className="space-y-4">
                    {gameHistory.length > 0 ? gameHistory.map((game, index) => (
                      <div key={game.id} className="p-4 border rounded-lg">
                        <h3 className="font-bold mb-2">Game #{gameHistory.length - index} - {game.timestamp.toLocaleString()}</h3>
                        <ol className="list-decimal list-inside space-y-1">
                          {game.players.map(p => (
                            <li key={p.id}>
                              <span className="font-semibold">{p.name}</span> - {p.totalScore} points
                            </li>
                          ))}
                        </ol>
                      </div>
                    )) : (
                      <p className="text-muted-foreground text-center">No history yet.</p>
                    )}
                  </div>
                </ScrollArea>
                {gameHistory.length > 0 && (
                  <SheetFooter className="mt-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          <Trash2 className="mr-2"/> Clear History
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete all game history. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleClearHistory} className="bg-destructive hover:bg-destructive/90">Clear History</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </SheetFooter>
                )}
              </SheetContent>
            </Sheet>

          </div>
        </div>
        
        {players.length > 0 && (
          <div className="flex-shrink-0 p-4 border-t border-b border-border">
            <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))` }}>
              {sortedPlayers.map((player, idx) => (
                <div key={player.id} className="text-center flex flex-col items-center justify-start h-20">
                  <div className="h-5">
                      {sortedPlayers.length > 1 && idx === 0 && player.totalScore > 0 && (
                          <ThumbsUp className="w-5 h-5 text-yellow-400 fill-yellow-400 shrink-0" />
                      )}
                      {sortedPlayers.length > 1 && idx === sortedPlayers.length - 1 && player.totalScore < 0 && (
                          <ThumbsDown className="w-5 h-5 text-red-500 fill-red-500 shrink-0" />
                      )}
                  </div>
                  <Button variant="link" className="p-0 h-auto font-semibold text-lg text-foreground break-words" onClick={() => handleStartEditPlayer(player)}>
                    {player.name}
                  </Button>
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="mt-1 h-7 text-xs">
                          <Trash2 className="mr-1 h-3 w-3" /> Cut
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cut Score?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cut {player.name}'s score? All their past scores will be reset to 0.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleCutPlayer(player.id)} className="bg-destructive hover:bg-destructive/90">Cut Score</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-grow overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {rounds.map((round, roundIndex) => (
                <div key={roundIndex} className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))` }}>
                  {sortedPlayers.map(({ originalIndex, color }) => (
                    <div key={`${roundIndex}-${originalIndex}`} className={cn("rounded-md p-2 text-center text-xl font-bold flex items-center justify-center h-12", color.bg, color.text)}>
                        {round[originalIndex]}
                    </div>
                  ))}
                </div>
              ))}
              {players.length > 0 && (
                <div className={`grid gap-4 mt-2`} style={{ gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))` }}>
                    {sortedPlayers.map(({ originalIndex, id, color }) => (
                    <div key={id} className="text-center">
                        <Input
                          type="text"
                          inputMode="text"
                          placeholder="0"
                          value={currentScores[originalIndex]}
                          onChange={(e) => handleScoreChange(originalIndex, e.target.value)}
                          className={cn(
                            `text-center border-2 text-foreground placeholder:text-muted-foreground text-xl font-bold h-12`,
                            color.border, 'bg-transparent'
                          )}
                        />
                    </div>
                    ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        {players.length > 0 && (
          <div className="flex-shrink-0 mt-auto border-t border-border">
              <div className="p-4">
                <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))` }}>
                    {sortedPlayers.map(({ totalScore, id, color }) => (
                        <div key={id} className={cn("rounded-md p-2 text-center text-2xl font-bold", color.bg, color.text)}>
                            {totalScore || 0}
                        </div>
                      ))}
                </div>
              </div>

              <div className="p-4 border-t border-border">
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={handleUndoRound} disabled={rounds.length === 0}>
                    <RotateCcw className="mr-2" /> Undo Round
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
                            This will save the results and clear all players and scores. This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleFinishGame(true)} className="bg-destructive hover:bg-destructive/90">Finish Game</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                </div>
              </div>
          </div>
        )}
      </div>

       <AlertDialog open={isWinnerDialogOpen} onOpenChange={setIsWinnerDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-2xl text-accent">Congratulations!</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-lg">
              The winner is <span className="font-bold text-foreground">{winner}</span>!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => handleFinishGame(true)} className="w-full">
              Start New Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!editingPlayer} onOpenChange={(open) => !open && handleCancelEditPlayer()}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Edit Player</AlertDialogTitle>
            <AlertDialogDescription>
                Update the name or delete the player.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-4">
                <Input
                    placeholder="New Player Name"
                    value={editingPlayerName}
                    onChange={(e) => setEditingPlayerName(e.target.value)}
                    onKeyDown={handleUpdatePlayerOnEnter}
                    aria-label="New player name"
                    autoFocus
                    type="text"
                />
            </div>
            <AlertDialogFooter className="justify-between w-full flex-row-reverse">
                <div className="flex gap-2">
                    <AlertDialogCancel onClick={handleCancelEditPlayer}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleUpdatePlayerName}>Save Name</AlertDialogAction>
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 className="mr-2" /> Delete Player
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Delete Player?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {editingPlayer?.name}? All their scores will be removed. This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeletePlayer(editingPlayer!.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
