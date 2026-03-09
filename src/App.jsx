import React, { useMemo, useState } from "react";
import {
  RotateCcw,
  Users,
  User,
  Skull,
  HeartPulse,
  Star,
  Pencil,
  Check,
  Bomb,
  Minus,
  Plus,
  XCircle,
  Palette,
  Trophy,
} from "lucide-react";

const BASE_TEAM_COUNT = 25;
const RANKED_TEAM_COUNT = 16;
const MAX_TEAM_COUNT = 50;
const PLAYER_COUNT = 4;
const TOP10_BORDER = "#f2b8b5";

const BASE_TEAM_COLORS = {
  1: "#0f2f7a",
  2: "#066660",
  3: "#70230a",
  4: "#0b485e",
  5: "#3b0f6f",
  6: "#571f0d",
  7: "#1e5808",
  8: "#780a40",
  9: "#6c4e18",
  10: "#3d0e22",
  11: "#8c7b12",
  12: "#35847a",
  13: "#58676a",
  14: "#986d13",
  15: "#2f4e5c",
  16: "#b2476a",
  17: "#0e4e46",
  18: "#0e4e46",
  19: "#55640e",
  20: "#51376d",
  21: "#2f7e62",
  22: "#5c6686",
  23: "#ac7458",
  24: "#313161",
  25: "#5b5e1b",
};

const STATUS = {
  alive: { label: "생존", icon: User },
  knocked: { label: "기절", icon: HeartPulse },
  dead: { label: "사망", icon: Skull },
};

const cycleStatus = (current) => {
  if (current === "alive") return "knocked";
  if (current === "knocked") return "dead";
  return "alive";
};

const createTeam = (teamNumber) => ({
  teamNumber,
  players: Array.from({ length: PLAYER_COUNT }, () => "alive"),
  nicknames: Array.from({ length: PLAYER_COUNT }, () => ""),
  rosterSize: 4,
  hackers: Array.from({ length: PLAYER_COUNT }, () => false),
  eliminated: false,
  previousStateBeforeElimination: null,
});

const createInitialTeams = (count = BASE_TEAM_COUNT) =>
  Array.from({ length: count }, (_, idx) => createTeam(idx + 1));

function getAliveCount(players, rosterSize) {
  return players.slice(0, rosterSize).filter((status) => status !== "dead").length;
}

function getTeamSummary(players, rosterSize) {
  const activePlayers = players.slice(0, rosterSize);
  const alive = activePlayers.filter((s) => s === "alive").length;
  const knocked = activePlayers.filter((s) => s === "knocked").length;
  const dead = activePlayers.filter((s) => s === "dead").length;
  return { alive, knocked, dead, survivors: alive + knocked };
}

function getBaseColor(teamNumber) {
  const normalized = ((teamNumber - 1) % BASE_TEAM_COUNT) + 1;
  return BASE_TEAM_COLORS[normalized];
}

function getColorModeStyle(teamNumber, isEliminated, isSelected, isMyTeam) {
  const baseColor = getBaseColor(teamNumber);
  const stripeOverlay = isEliminated ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.16)";

  const style = {
    background:
      teamNumber > BASE_TEAM_COUNT
        ? `linear-gradient(to bottom, transparent 0%, transparent 33.333%, ${stripeOverlay} 33.333%, ${stripeOverlay} 66.666%, transparent 66.666%, transparent 100%), linear-gradient(${baseColor}, ${baseColor})`
        : baseColor,
    color: "white",
    opacity: isEliminated ? 0.48 : 1,
  };

  const shadows = [];
  if (isSelected) shadows.push("inset 0 0 0 3px rgba(255,255,255,0.92)");
  if (isMyTeam) shadows.push("0 0 0 3px rgba(253,224,71,0.95)");
  if (shadows.length) style.boxShadow = shadows.join(", ");
  if (isSelected) style.transform = "scale(1.02)";

  return style;
}

export default function PubgSquadTracker() {
  const [mode, setMode] = useState("normal");
  const [teams, setTeams] = useState(createInitialTeams());
  const [selectedTeam, setSelectedTeam] = useState(1);
  const [myTeam, setMyTeam] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [nicknameDrafts, setNicknameDrafts] = useState({});
  const [hackMode, setHackMode] = useState(false);
  const [eliminateMode, setEliminateMode] = useState(false);
  const [showTeamColors, setShowTeamColors] = useState(false);
  const [mySquadEditing, setMySquadEditing] = useState(false);
  const [mySquadDraft, setMySquadDraft] = useState(Array.from({ length: PLAYER_COUNT }, () => ""));

  const isRankedMode = mode === "ranked";
  const selectedTeamData = teams.find((team) => team.teamNumber === selectedTeam);
  const teamCount = teams.length;
  const isTeamExtensionActive = !isRankedMode && teamCount > BASE_TEAM_COUNT;
  const totalCapacity = teamCount * PLAYER_COUNT;
  const isEditingSelectedTeam = editingTeam === selectedTeam;
  const isSelectedMyTeam = myTeam === selectedTeam;

  const totalSurvivors = useMemo(() => {
    return teams.reduce((sum, team) => sum + getAliveCount(team.players, team.rosterSize), 0);
  }, [teams]);

  const survivingTeamsCount = useMemo(() => {
    return teams.filter((team) => getAliveCount(team.players, team.rosterSize) > 0).length;
  }, [teams]);

  const isTop10Phase = survivingTeamsCount <= 10;

  const selectedSummary = useMemo(() => {
    if (!selectedTeamData) return { alive: 0, knocked: 0, dead: 0, survivors: 0 };
    return getTeamSummary(selectedTeamData.players, selectedTeamData.rosterSize);
  }, [selectedTeamData]);

  const applyMySquadPresetToTeam = (teamNumber) => {
    setTeams((prev) =>
      prev.map((team) =>
        team.teamNumber === teamNumber ? { ...team, nicknames: [...mySquadDraft] } : team
      )
    );
  };

  const assignMyTeam = (teamNumber) => {
    setTeams((prev) =>
      prev.map((team) => {
        if (myTeam && team.teamNumber === myTeam && myTeam !== teamNumber) {
          return { ...team, nicknames: Array.from({ length: PLAYER_COUNT }, () => "") };
        }
        if (team.teamNumber === teamNumber) {
          return { ...team, nicknames: [...mySquadDraft] };
        }
        return team;
      })
    );
    setMyTeam(teamNumber);
  };

  const toggleMode = () => {
    const nextMode = isRankedMode ? "normal" : "ranked";
    const nextTeamCount = nextMode === "ranked" ? RANKED_TEAM_COUNT : BASE_TEAM_COUNT;

    setMode(nextMode);
    setTeams(createInitialTeams(nextTeamCount));
    setSelectedTeam(1);
    setMyTeam(null);
    setEditingTeam(null);
    setNicknameDrafts({});
    setHackMode(false);
    setEliminateMode(false);
    setShowTeamColors(false);
    setMySquadEditing(false);
  };

  const addTeam = () => {
    if (isRankedMode) return;
    setTeams((prev) => {
      if (prev.length >= MAX_TEAM_COUNT) return prev;
      return [...prev, createTeam(prev.length + 1)];
    });
  };

  const removeTeam = () => {
    if (isRankedMode || teamCount <= BASE_TEAM_COUNT) return;
    const removedTeamNumber = teamCount;
    setTeams((prev) => prev.slice(0, -1));
    if (selectedTeam === removedTeamNumber) setSelectedTeam(removedTeamNumber - 1);
    if (myTeam === removedTeamNumber) setMyTeam(null);
    if (editingTeam === removedTeamNumber) setEditingTeam(null);
    setNicknameDrafts((prev) => {
      const next = { ...prev };
      delete next[removedTeamNumber];
      return next;
    });
  };

  const updatePlayerStatus = (teamNumber, playerIndex) => {
    setTeams((prev) =>
      prev.map((team) => {
        if (team.teamNumber !== teamNumber || playerIndex >= team.rosterSize) return team;

        const nextPlayers = [...team.players];
        nextPlayers[playerIndex] = cycleStatus(nextPlayers[playerIndex]);

        const activePlayers = nextPlayers.slice(0, team.rosterSize);
        const aliveCount = activePlayers.filter((status) => status === "alive").length;
        const allDead = activePlayers.every((status) => status === "dead");

        if (aliveCount === 0) {
          return {
            ...team,
            players: nextPlayers.map((status, idx) => (idx < team.rosterSize ? "dead" : status)),
            eliminated: true,
            previousStateBeforeElimination: null,
          };
        }

        return {
          ...team,
          players: nextPlayers,
          eliminated: allDead,
          previousStateBeforeElimination: allDead ? team.previousStateBeforeElimination : null,
        };
      })
    );
  };

  const toggleHacker = (teamNumber, playerIndex) => {
    setTeams((prev) =>
      prev.map((team) => {
        if (team.teamNumber !== teamNumber || playerIndex >= team.rosterSize) return team;
        const nextHackers = [...team.hackers];
        nextHackers[playerIndex] = !nextHackers[playerIndex];
        return { ...team, hackers: nextHackers };
      })
    );
  };

  const startNicknameEdit = (teamNumber) => {
    const team = teams.find((item) => item.teamNumber === teamNumber);
    if (!team) return;
    setNicknameDrafts((prev) => ({ ...prev, [teamNumber]: [...team.nicknames] }));
    setEditingTeam(teamNumber);
  };

  const updateNicknameDraft = (teamNumber, playerIndex, value) => {
    setNicknameDrafts((prev) => ({
      ...prev,
      [teamNumber]: (prev[teamNumber] || Array.from({ length: PLAYER_COUNT }, () => "")).map((name, idx) =>
        idx === playerIndex ? value : name
      ),
    }));
  };

  const applyNicknames = (teamNumber) => {
    const draft = nicknameDrafts[teamNumber];
    if (!draft) return;
    setTeams((prev) =>
      prev.map((team) => (team.teamNumber === teamNumber ? { ...team, nicknames: [...draft] } : team))
    );
    setEditingTeam(null);
  };

  const applyMySquadNicknames = () => {
    setMySquadEditing(false);
    if (myTeam) applyMySquadPresetToTeam(myTeam);
  };

  const adjustRosterSize = (teamNumber, delta) => {
    setTeams((prev) =>
      prev.map((team) => {
        if (team.teamNumber !== teamNumber) return team;
        const nextRosterSize = Math.min(4, Math.max(2, team.rosterSize + delta));
        const isEliminated = team.players.slice(0, nextRosterSize).every((status) => status === "dead");
        return { ...team, rosterSize: nextRosterSize, eliminated: isEliminated };
      })
    );
  };

  const toggleEliminateTeam = (teamNumber) => {
    setTeams((prev) =>
      prev.map((team) => {
        if (team.teamNumber !== teamNumber) return team;

        if (team.eliminated) {
          if (team.previousStateBeforeElimination) {
            return {
              ...team,
              ...team.previousStateBeforeElimination,
              previousStateBeforeElimination: null,
            };
          }
          return {
            ...team,
            eliminated: false,
            players: Array.from({ length: PLAYER_COUNT }, () => "alive"),
            previousStateBeforeElimination: null,
          };
        }

        return {
          ...team,
          previousStateBeforeElimination: {
            players: [...team.players],
            nicknames: [...team.nicknames],
            rosterSize: team.rosterSize,
            hackers: [...team.hackers],
            eliminated: team.eliminated,
          },
          players: Array.from({ length: PLAYER_COUNT }, () => "dead"),
          eliminated: true,
        };
      })
    );
  };

  const resetSelectedTeam = () => {
    setTeams((prev) =>
      prev.map((team) =>
        team.teamNumber === selectedTeam
          ? {
              ...team,
              players: Array.from({ length: PLAYER_COUNT }, () => "alive"),
              nicknames: isSelectedMyTeam ? [...mySquadDraft] : Array.from({ length: PLAYER_COUNT }, () => ""),
              rosterSize: 4,
              hackers: Array.from({ length: PLAYER_COUNT }, () => false),
              eliminated: false,
              previousStateBeforeElimination: null,
            }
          : team
      )
    );
    setEditingTeam(null);
    setHackMode(false);
  };

  const resetAll = () => {
    setMode("normal");
    setTeams(createInitialTeams());
    setSelectedTeam(1);
    setMyTeam(null);
    setEditingTeam(null);
    setNicknameDrafts({});
    setHackMode(false);
    setEliminateMode(false);
    setShowTeamColors(false);
    setMySquadEditing(false);
    setMySquadDraft(Array.from({ length: PLAYER_COUNT }, () => ""));
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">PUBG 스쿼드 생존 추적기</h1>
            <p className="text-sm text-slate-600 mt-2">
              팀 번호를 선택한 뒤, 우측 플레이어 아이콘을 클릭해 상태를 기록하세요.
              <br />1회 클릭 = 기절 / 2회 클릭 = 사망 / 3회 클릭 = 부활 및 기본 복귀
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap justify-end">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 px-5 py-4 min-w-[260px]">
              <div className="text-xs font-medium text-slate-500">총 생존 인원</div>
              <div className="mt-1 flex items-center gap-2 text-3xl font-bold">
                <Users className="w-7 h-7" />
                <span>{totalSurvivors}</span>
                <span className="text-base font-medium text-slate-500">/ {totalCapacity}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium">
                {isTeamExtensionActive && <span className="text-sky-700">팀 추가 기능 활성화 중</span>}
                {isTop10Phase && <span style={{ color: TOP10_BORDER }}>탑10 생존 중</span>}
              </div>
            </div>

            <button
              onClick={toggleMode}
              className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm transition ${
                isRankedMode
                  ? "border-violet-300 bg-violet-100 text-violet-900 hover:bg-violet-200"
                  : "border-slate-300 bg-white hover:bg-slate-100"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                {isRankedMode ? "경쟁전" : "일반전"}
              </span>
            </button>

            <button
              onClick={() => setMySquadEditing((prev) => !prev)}
              className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm transition ${
                mySquadEditing
                  ? "border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                  : "border-slate-300 bg-white hover:bg-slate-100"
              }`}
            >
              스쿼드 닉네임
            </button>

            <button
              onClick={resetAll}
              className="rounded-2xl bg-slate-900 text-white px-4 py-3 text-sm font-medium shadow-sm hover:opacity-90 transition"
            >
              전체 초기화
            </button>
          </div>
        </div>

        {mySquadEditing && (
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div>
                <div className="text-lg font-semibold">우리팀 스쿼드 닉네임</div>
                <div className="text-sm text-slate-500 mt-1">
                  여기 입력한 닉네임은 나의 팀으로 설정할 때 자동으로 적용됩니다.
                </div>
              </div>
              <button
                onClick={applyMySquadNicknames}
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-200 transition"
              >
                <Check className="w-4 h-4" /> 적용
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {mySquadDraft.map((nickname, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-700">플레이어 {index + 1}</label>
                  <input
                    value={nickname}
                    onChange={(e) =>
                      setMySquadDraft((prev) => prev.map((item, idx) => (idx === index ? e.target.value : item)))
                    }
                    placeholder="닉네임 입력"
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <section
            className={`rounded-3xl border shadow-sm p-5 ${isSelectedMyTeam ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}
            style={isTop10Phase ? { boxShadow: `0 0 0 4px ${TOP10_BORDER}` } : undefined}
          >
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold">팀 선택</h2>
                <div className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                  1번 ~ {teamCount}번 팀
                  {isTop10Phase && (
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: "#fde8e8", color: "#c96b6b" }}
                    >
                      탑10 생존 중
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {!isRankedMode && (
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2">
                    <span className="text-sm font-medium text-slate-700">팀 추가</span>
                    <button
                      onClick={removeTeam}
                      disabled={teamCount <= BASE_TEAM_COUNT}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white p-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="min-w-[48px] text-center text-sm font-bold">{teamCount}</div>
                    <button
                      onClick={addTeam}
                      disabled={teamCount >= MAX_TEAM_COUNT}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white p-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => assignMyTeam(selectedTeam)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-200 transition"
                >
                  <Star className="w-4 h-4" />
                  나의 팀으로 설정하기
                </button>

                <button
                  onClick={() => setEliminateMode((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                    eliminateMode
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white hover:bg-slate-100"
                  }`}
                >
                  <XCircle className="w-4 h-4" /> 탈락 팀
                </button>

                <button
                  onClick={() => setShowTeamColors((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                    showTeamColors
                      ? "border-sky-700 bg-sky-700 text-white"
                      : "border-slate-300 bg-white hover:bg-slate-100"
                  }`}
                >
                  <Palette className="w-4 h-4" /> 팀별 색상
                </button>

                {myTeam && (
                  <div className="rounded-2xl bg-amber-100 border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-900">
                    우리팀: {myTeam}번
                  </div>
                )}
              </div>
            </div>

            {eliminateMode && (
              <div className="mb-4 rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 flex items-center justify-between gap-3">
                <span>탈락 처리 모드 활성화</span>
                <button
                  onClick={() => setEliminateMode(false)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
                >
                  완료
                </button>
              </div>
            )}

            <div className="grid grid-cols-5 gap-3">
              {teams.map((team) => {
                const summary = getTeamSummary(team.players, team.rosterSize);
                const isSelected = team.teamNumber === selectedTeam;
                const isMyTeam = team.teamNumber === myTeam;
                const isEliminated = team.eliminated;
                const colorMode = showTeamColors;

                let buttonClass = "bg-slate-50 hover:bg-slate-100 border-slate-200";
                let textClass = isSelected && !isMyTeam && !isEliminated ? "text-slate-200" : "text-slate-600";
                let inlineStyle = {};

                if (colorMode) {
                  buttonClass = "border-transparent";
                  textClass = "text-white";
                  inlineStyle = getColorModeStyle(team.teamNumber, isEliminated, isSelected, isMyTeam);
                } else {
                  if (isSelected) buttonClass = "bg-slate-900 text-white border-slate-900 scale-[1.02]";
                  if (isMyTeam) buttonClass = "bg-amber-100 border-amber-300 text-amber-950 hover:bg-amber-200";
                  if (isSelected && isMyTeam) buttonClass = "bg-amber-200 border-amber-400 text-amber-950 scale-[1.02]";
                  if (isEliminated) buttonClass = "bg-slate-300 border-slate-400 text-slate-700";
                  if (isEliminated && isMyTeam) buttonClass = "bg-amber-200 border-amber-400 text-amber-950";
                }

                return (
                  <button
                    key={team.teamNumber}
                    onClick={() => {
                      if (eliminateMode) {
                        toggleEliminateTeam(team.teamNumber);
                        return;
                      }
                      setSelectedTeam(team.teamNumber);
                      setHackMode(false);
                    }}
                    className={`rounded-2xl border p-3 text-left transition shadow-sm ${buttonClass}`}
                    style={inlineStyle}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className={`text-xs opacity-80 ${colorMode ? "text-white" : ""}`}>TEAM</div>
                      <div className={`flex items-center gap-1 ${colorMode ? "text-white" : ""}`}>
                        {isMyTeam && <Star className="w-4 h-4" />}
                        {isEliminated && <Skull className="w-4 h-4" />}
                      </div>
                    </div>
                    <div className={`text-2xl font-bold leading-none mt-1 ${colorMode ? "text-white" : ""}`}>{team.teamNumber}</div>
                    <div className={`mt-3 text-xs ${textClass}`}>
                      {isEliminated ? "탈락" : `생존 ${summary.survivors} / ${team.rosterSize}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={`rounded-3xl border shadow-sm p-5 ${isSelectedMyTeam ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="text-3xl font-bold tracking-tight">
                {selectedTeam}
                <span className="ml-1 text-lg font-semibold text-slate-500">팀</span>
                {isSelectedMyTeam && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-950 align-middle">
                    <Star className="w-3 h-3" /> 우리팀
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!isSelectedMyTeam && (
                  <button
                    onClick={() => (isEditingSelectedTeam ? applyNicknames(selectedTeam) : startNicknameEdit(selectedTeam))}
                    className={`inline-flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
                      isEditingSelectedTeam
                        ? "border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                        : "border-slate-300 bg-white hover:bg-slate-100"
                    }`}
                  >
                    {isEditingSelectedTeam ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                    닉네임
                  </button>
                )}

                <button
                  onClick={() => setHackMode((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
                    hackMode
                      ? "border-rose-300 bg-rose-100 text-rose-900 hover:bg-rose-200"
                      : "border-slate-300 bg-white hover:bg-slate-100"
                  }`}
                >
                  <Bomb className="w-4 h-4" /> 핵유저
                </button>

                <button
                  onClick={resetSelectedTeam}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium whitespace-nowrap hover:bg-slate-100 transition"
                >
                  <RotateCcw className="w-4 h-4" /> 초기화
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className={`rounded-2xl border px-4 py-3 ${isSelectedMyTeam ? "bg-amber-100 border-amber-200" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-2xl font-bold">{selectedSummary.survivors} / {selectedTeamData?.rosterSize || 4}</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjustRosterSize(selectedTeam, -1)}
                      disabled={(selectedTeamData?.rosterSize || 4) <= 2}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="min-w-[20px] text-center text-xl font-bold">{selectedTeamData?.rosterSize || 4}</div>
                    <button
                      onClick={() => adjustRosterSize(selectedTeam, 1)}
                      disabled={(selectedTeamData?.rosterSize || 4) >= 4}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl border px-4 py-3 flex items-center ${isSelectedMyTeam ? "bg-amber-100 border-amber-200" : "bg-slate-50 border-slate-200"}`}>
                <div className="text-sm font-medium text-slate-700 leading-6">
                  생존 {selectedSummary.alive} / 기절 {selectedSummary.knocked} / 사망 {selectedSummary.dead}
                </div>
              </div>
            </div>

            {isEditingSelectedTeam && !isSelectedMyTeam && (
              <div className="mb-5 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(nicknameDrafts[selectedTeam] || Array.from({ length: PLAYER_COUNT }, () => "")).map((nickname, index) => {
                    const isDisabled = index >= (selectedTeamData?.rosterSize || 4);
                    return (
                      <div key={index} className="flex flex-col gap-1">
                        <label className={`text-xs font-medium ${isDisabled ? "text-slate-400" : "text-slate-700"}`}>
                          플레이어 {index + 1}
                        </label>
                        <input
                          value={nickname}
                          onChange={(e) => updateNicknameDraft(selectedTeam, index, e.target.value)}
                          placeholder="닉네임 입력"
                          disabled={isDisabled}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {selectedTeamData?.players.map((status, index) => {
                const statusMeta = STATUS[status];
                const Icon = statusMeta.icon;
                const nickname = selectedTeamData?.nicknames[index];
                const isDisabled = index >= selectedTeamData.rosterSize;
                const isHacker = selectedTeamData.hackers[index];

                const cardClass = isDisabled
                  ? "border-slate-200 bg-slate-100"
                  : status === "alive"
                  ? "border-emerald-200 bg-emerald-50"
                  : status === "knocked"
                  ? "border-amber-200 bg-amber-50"
                  : "border-rose-200 bg-rose-50";

                const iconClass = isDisabled
                  ? "text-slate-400"
                  : status === "alive"
                  ? "text-emerald-600"
                  : status === "knocked"
                  ? "text-amber-600"
                  : "text-rose-600";

                const myTeamRing = isSelectedMyTeam ? "ring-2 ring-amber-200" : "";

                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (isDisabled) return;
                      if (hackMode) {
                        toggleHacker(selectedTeam, index);
                        return;
                      }
                      updatePlayerStatus(selectedTeam, index);
                    }}
                    disabled={isDisabled}
                    className={`rounded-3xl border p-5 flex flex-col items-center justify-center min-h-[220px] transition shadow-sm ${
                      isDisabled ? "cursor-not-allowed opacity-70" : "hover:scale-[1.02]"
                    } ${cardClass} ${myTeamRing}`}
                  >
                    <div className="text-sm font-medium text-slate-500 mb-2">플레이어 {index + 1}</div>
                    <div className="mb-3 text-sm font-semibold text-slate-800 text-center min-h-[20px]">
                      {isDisabled ? "비활성 슬롯" : nickname || "닉네임 없음"}
                    </div>
                    {isHacker && !isDisabled && (
                      <div className="mb-2 rounded-full bg-rose-100 border border-rose-300 px-3 py-1 text-xs font-bold text-rose-900">
                        핵유저 💀
                      </div>
                    )}
                    <Icon className={`w-16 h-16 ${iconClass}`} strokeWidth={1.75} />
                    <div className="mt-4 text-xl font-bold">{isDisabled ? "미사용" : statusMeta.label}</div>
                    <div className="mt-2 text-xs text-slate-500 text-center">
                      {isDisabled ? "현재 팀 인원수에 포함되지 않음" : hackMode ? "핵유저 표시 선택 중" : "클릭"}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-sm font-semibold mb-2">상태 순환 규칙</div>
              <div className="text-sm text-slate-600 leading-7">
                플레이어 아이콘은 클릭할 때마다
                <span className="font-semibold"> 생존 → 기절 → 사망 → 생존</span>
                순서로 변경됩니다. 탈락 팀 모드에서는 좌측 팀 번호를 다시 눌러 탈락 전 기록 상태로 복구할 수 있습니다.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
