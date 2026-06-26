import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Transaction {
  hash: string;
  type: 'xp_booster' | 'premium_pass';
  timestamp: number;
}

interface GameState {
  xpBoosterActive: boolean;
  xpBoosterExpiry: number | null;
  premiumStatus: boolean;
  transactions: Transaction[];
  setXPBooster: (txHash: string) => void;
  setPremium: (txHash: string) => void;
}

const GameContext = createContext<GameState | undefined>(undefined);

const STORAGE_KEY = 'nexora_game_state';

const loadState = (): Partial<GameState> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return {};
};

const saveState = (state: Partial<GameState>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initial = loadState();

  const [xpBoosterExpiry, setXpBoosterExpiry] = useState<number | null>(
    initial.xpBoosterExpiry ?? null
  );
  const [premiumStatus, setPremiumStatus] = useState<boolean>(
    initial.premiumStatus ?? false
  );
  const [transactions, setTransactions] = useState<Transaction[]>(
    initial.transactions ?? []
  );

  const xpBoosterActive =
    xpBoosterExpiry !== null && Date.now() < xpBoosterExpiry;

  const persist = (updates: Partial<GameState>) => {
    const state: Partial<GameState> = {
      xpBoosterExpiry,
      premiumStatus,
      transactions,
      ...updates,
    };
    saveState(state);
  };

  const setXPBooster = (txHash: string) => {
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    setXpBoosterExpiry(expiry);
    const newTx: Transaction = {
      hash: txHash,
      type: 'xp_booster',
      timestamp: Date.now(),
    };
    setTransactions((prev) => {
      const updated = [newTx, ...prev];
      persist({ xpBoosterExpiry: expiry, transactions: updated });
      return updated;
    });
  };

  const setPremium = (txHash: string) => {
    setPremiumStatus(true);
    const newTx: Transaction = {
      hash: txHash,
      type: 'premium_pass',
      timestamp: Date.now(),
    };
    setTransactions((prev) => {
      const updated = [newTx, ...prev];
      persist({ premiumStatus: true, transactions: updated });
      return updated;
    });
  };

  return (
    <GameContext.Provider
      value={{
        xpBoosterActive,
        xpBoosterExpiry,
        premiumStatus,
        transactions,
        setXPBooster,
        setPremium,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
