"use client";

import { useState, useMemo, type ChangeEvent, type KeyboardEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Crown, PlusCircle, RotateCw, UserPlus, Spade } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Player = {
  id: number;
  name: string;
};

type Round = {
  roundNumber: number;
  scores: Record<Player["id"], number | null>;
};

export default function ScoreboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentScores, setCurrentScores] = useState<Record<Player["id"], string>>({});
  const [gamePhase, setGamePhase] = useState<"setup" | "playing">("setup");
  const { toast } = useToast();

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      setPlayers([...players, { id: Date.now(), name: newPlayerName.trim() }]);
      setNewPlayerName("");
    }
  };
  
  const handleAddPlayerOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddPlayer();
    }
  }

  const handleStartGame = () => {
    if (players.length >= 2) {
      setGamePhase("playing");
    } else {
       toast({
        variant: "destructive",
        title: "Not enough players",
        description: "Please add at least 2 players to start the game.",
      });
    }
  };

  const handleScoreChange = (playerId: number, value: string) => {
    setCurrentScores({ ...currentScores, [playerId]: value });
  };

  const handleSaveRound = () => {
    const scoresForRound: Record<Player["id"], number | null> = {};
    let allScoresEntered = true;

    for (const player of players) {
      const score = currentScores[player.id];
      if (score === "" || score === undefined || isNaN(parseInt(score, 10))) {
        allScoresEntered = false;
        scoresForRound[player.id] = null; // Or some other indicator of missing score
      } else {
        scoresForRound[player.id] = parseInt(score, 10);
      }
    }

    if (!allScoresEntered && Object.values(currentScores).some(s => s && s.trim() !== '')) {
       toast({
        variant: "destructive",
        title: "Incomplete Scores",
        description: "Please enter a score for every player.",
      });
      return;
    }
    
    // Allow saving empty round
    if(Object.values(scoresForRound).every(s => s === null)) {
      // Do not save an entirely empty round unless user wants to
      return;
    }


    setRounds([
      ...rounds,
      { roundNumber: rounds.length + 1, scores: scoresForRound },
    ]);
    setCurrentScores({});
  };

  const handleNewGame = () => {
    setPlayers([]);
    setRounds([]);
    setCurrentScores({});
    setNewPlayerName("");
    setGamePhase("setup");
  };

  const totalScores = useMemo(() => {
    const totals: Record<Player["id"], number> = {};
    players.forEach((player) => {
      totals[player.id] = rounds.reduce(
        (acc, round) => acc + (round.scores[player.id] ?? 0),
        0
      );
    });
    return totals;
  }, [players, rounds]);

  const overallWinnerIds = useMemo(() => {
    if (players.length === 0 || rounds.length === 0) return [];

    const scores = Object.values(totalScores);
    const minScore = Math.min(...scores);
    
    return players
      .filter((player) => totalScores[player.id] === minScore)
      .map((player) => player.id);
  }, [totalScores, players, rounds]);

  const renderSetupPhase = () => (
    <Card className="max-w-2xl mx-auto animate-in fade-in-0 duration-500">
      <CardHeader>
        <CardTitle>Game Setup</CardTitle>
        <CardDescription>Add players to the game. You need at least two to start.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Player Name"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={handleAddPlayerOnEnter}
            aria-label="New player name"
          />
          <Button onClick={handleAddPlayer} aria-label="Add Player">
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Players:</h4>
            {players.length > 0 ? (
                <ul className="grid grid-cols-2 gap-2">
                    {players.map((player, index) => (
                        <li key={player.id} className="bg-muted/50 p-2 rounded-md text-sm font-medium">{index + 1}. {player.name}</li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-center text-muted-foreground py-4">No players added yet.</p>
            )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleStartGame} disabled={players.length < 2} className="w-full">
          Start Game
        </Button>
      </CardFooter>
    </Card>
  );

  const renderPlayingPhase = () => (
     <Card className="animate-in fade-in-0 duration-500">
      <CardHeader>
        <CardTitle>Scoreboard</CardTitle>
        <CardDescription>Enter scores for each round. The lowest total score wins.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold w-[100px] min-w-[100px]">Round</TableHead>
                {players.map(player => (
                  <TableHead key={player.id} className="text-center font-semibold min-w-[120px]">{player.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rounds.map(round => (
                <TableRow key={round.roundNumber} className="hover:bg-muted/20">
                  <TableCell className="font-medium text-muted-foreground">{round.roundNumber}</TableCell>
                  {players.map(player => (
                    <TableCell key={player.id} className="text-center">{round.scores[player.id] ?? '-'}</TableCell>
                  ))}
                </TableRow>
              ))}
              <TableRow className="bg-muted/10">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                   <PlusCircle className="h-4 w-4 text-primary"/>
                   <span>Round {rounds.length + 1}</span>
                  </div>
                </TableCell>
                {players.map(player => (
                  <TableCell key={player.id}>
                    <Input
                      type="number"
                      placeholder="Score"
                      value={currentScores[player.id] || ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleScoreChange(player.id, e.target.value)}
                      className="text-center"
                      aria-label={`Score for ${player.name} in round ${rounds.length + 1}`}
                    />
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow className="bg-secondary/20 hover:bg-secondary/30">
                <TableHead className="font-bold text-lg">Total</TableHead>
                {players.map(player => (
                  <TableCell key={player.id} className="text-center font-bold text-xl text-primary-foreground">
                    <div className="flex items-center justify-center gap-2">
                       {totalScores[player.id]}
                       {overallWinnerIds.includes(player.id) && <Crown className="h-6 w-6 text-yellow-400" />}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveRound} className="w-full md:w-auto md:ml-auto">
          Save Round {rounds.length + 1}
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <main className="container mx-auto p-4 md:p-8 bg-background min-h-screen">
      <header className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <Spade className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline text-foreground">
            Remi Scoreboard
          </h1>
        </div>
        <Button variant="outline" onClick={handleNewGame}>
          <RotateCw className="mr-2 h-4 w-4" />
          New Game
        </Button>
      </header>
      {gamePhase === 'setup' ? renderSetupPhase() : renderPlayingPhase()}
    </main>
  );
}
