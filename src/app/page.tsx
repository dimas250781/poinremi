
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
  PlusCircle,
  RotateCw,
  Trophy,
  UserPlus,
  Plus,
  Trash2,
  History,
  ThumbsUp,
  ThumbsDown,
  X,
  RotateCcw,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

type Player = {
  id: number;
  name: string;
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
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentScores, setCurrentScores] = useState<(string | number)[]>([]);
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [isWinnerDialogOpen, setIsWinnerDialogOpen] = useState(false);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const { toast } = useToast();
  
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);

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

  const handleResetPlayerScore = (playerIdToReset: number) => {
    const playerIndex = players.findIndex(p => p.id === playerIdToReset);
    if(playerIndex !== -1) {
      const newRounds = rounds.map(round => {
        const newRound = [...round];
        newRound[playerIndex] = 0; 
        return newRound;
      });
      setRounds(newRounds);
      
      const newCurrentScores = [...currentScores];
      newCurrentScores[playerIndex] = "0";
      setCurrentScores(newCurrentScores);

      toast({
        title: "Score Reset",
        description: `The score for ${players[playerIndex].name} has been reset to 0.`,
      });
    }
  };

  const handleAddPlayerOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddPlayer();
    }
  };

  const handleNewRound = () => {
    if (players.length === 0) return;
    
    // Convert empty strings to 0 before adding to rounds
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
      const roundsScore = rounds.reduce((total, round) => total + Number(round[playerIndex] || 0), 0);
      return roundsScore;
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
  
  const handleKeyPress = (key: string) => {
    if (activeInputIndex === null) return;
  
    const newScores = [...currentScores];
    const currentValue = String(newScores[activeInputIndex] || '');
  
    if (key === 'del') {
      newScores[activeInputIndex] = currentValue.slice(0, -1);
    } else if (key === '-') {
      if (currentValue === '') {
        newScores[activeInputIndex] = '-';
      }
    } else {
      newScores[activeInputIndex] = currentValue + key;
    }
  
    setCurrentScores(newScores);
  };
  
  const keyboardKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', 'del'];


  useEffect(() => {
    const scoresForWinnerCheck = players.map((_, playerIndex) => {
        return rounds.reduce((total, round) => total + (Number(round[playerIndex]) || 0), 0) + Number(currentScores[playerIndex] || 0);
      });

    const winnerCheck = players
        .map((p, i) => ({ name: p.name, score: scoresForWinnerCheck[i] }))
        .sort((a, b) => b.score - a.score)[0];

    if (winnerCheck && winnerCheck.score >= 1000) {
      if (!winner) { // Only set winner if not already set
        setWinner(winnerCheck.name);
        setIsWinnerDialogOpen(true);
      }
    }
  }, [rounds, currentScores, players, winner, sortedPlayers]);

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
          <div className="p-4 border-t border-b border-border">
            <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${players.length}, 1fr)` }}>
              {sortedPlayers.map((player, idx) => (
                <div key={player.id} className="text-center">
                  <div className="flex items-center justify-center gap-1">
                      <p className="font-semibold text-lg truncate">{player.name}</p>
                      {sortedPlayers.length > 1 && idx === 0 && player.totalScore > 0 && (
                          <ThumbsUp className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      )}
                      {sortedPlayers.length > 1 && idx === sortedPlayers.length - 1 && player.totalScore < sortedPlayers[0].totalScore && (
                          <ThumbsDown className="w-4 h-4 text-red-500 fill-red-500" />
                      )}
                  </div>
                  <Button variant="destructive" size="sm" className="mt-1 h-7 text-xs" onClick={() => handleResetPlayerScore(player.id)}>
                    <Trash2 className="mr-1 h-3 w-3" /> Cut
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <ScrollArea className="flex-grow">
          <div className="p-4 space-y-2">
            {rounds.map((round, roundIndex) => (
              <div key={roundIndex} className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${players.length}, 1fr)` }}>
                {sortedPlayers.map(({ originalIndex }) => (
                  <div key={`${roundIndex}-${originalIndex}`} className="bg-accent text-accent-foreground rounded-md p-2 text-center text-xl font-bold">
                      {round[originalIndex]}
                  </div>
                ))}
              </div>
            ))}
            {players.length > 0 && (
              <div className={`grid gap-4 mt-2`} style={{ gridTemplateColumns: `repeat(${players.length}, 1fr)` }}>
                  {sortedPlayers.map(({ originalIndex, id }) => (
                  <div key={id} className="text-center">
                      <Input
                        type="text" 
                        readOnly 
                        onFocus={() => setActiveInputIndex(originalIndex)}
                        placeholder="0"
                        value={currentScores[originalIndex]}
                        className={`text-center bg-yellow-200/20 border-yellow-400 text-yellow-200 placeholder:text-yellow-200/50 text-xl font-bold h-12 ${activeInputIndex === originalIndex ? 'ring-2 ring-yellow-400' : ''}`}
                      />
                  </div>
                  ))}
              </div>
            )}
          </div>
        </ScrollArea>
        
        {players.length > 0 && (
          <div className="flex-shrink-0 mt-auto">
              <div className="p-4">
                <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${players.length}, 1fr)` }}>
                    {sortedPlayers.map(({ totalScore, id }) => (
                        <div key={id} className="bg-yellow-300/80 text-background rounded-md p-2 text-center text-2xl font-bold">
                            {totalScore || 0}
                        </div>
                      ))}
                </div>
              </div>
              
              <div className="p-2 border-t border-border">
                <div className="grid grid-cols-6 gap-1 mb-2">
                    {keyboardKeys.slice(0, 6).map((key) => (
                        <Button key={key} variant="outline" className="h-10 text-xl" onClick={() => handleKeyPress(key)}>{key}</Button>
                    ))}
                </div>
                <div className="grid grid-cols-6 gap-1">
                    {keyboardKeys.slice(6).map((key) => (
                        <Button key={key} variant="outline" className="h-10 text-xl" onClick={() => handleKeyPress(key)}>
                            {key === 'del' ? <ArrowLeft/> : key}
                        </Button>
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
    </main>
  );
}

    