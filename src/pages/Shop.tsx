import React, { useState, useEffect } from 'react';
import {
  Zap,
  Star,
  Check,
  Loader2,
  Wallet,
  X,
  AlertCircle,
  Link2,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useWallet } from '../context/WalletContext';
import { useGame } from '../context/GameContext';
import { useToast } from '../context/ToastContext';

type ItemType = 'xp_booster' | 'premium_pass';

interface ConfirmModalProps {
  itemType: ItemType;
  itemName: string;
  price: string;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  success: boolean;
  error: string | null;
  txHash: string | null;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  itemName,
  price,
  onClose,
  onConfirm,
  loading,
  success,
  error,
  txHash,
}) => {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl p-6 max-w-md w-full"
        style={{ border: '1px solid rgba(139,92,246,0.3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="text-center py-8">
            <Loader2 size={48} className="text-brand-purple animate-spin mx-auto mb-4" />
            <p className="text-text-primary font-medium mb-1">Waiting for wallet confirmation...</p>
            <p className="text-text-secondary text-sm">Confirm the transaction in MetaMask</p>
          </div>
        ) : success ? (
          <div className="text-center py-4">
            <div className="mb-4 animate-bounce">
              <Check size={64} className="text-success-emerald mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-success-emerald mb-2">Purchase Successful!</h3>
            <p className="text-text-secondary text-sm mb-4">{itemName} is now active on your account.</p>
            {txHash && (
              <a
                href={`https://explorer.ritualfoundation.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-interactive-cyan hover:underline"
              >
                <Link2 size={14} />
                View on Explorer
              </a>
            )}
            <div className="mt-6">
              <button
                onClick={onClose}
                className="w-full py-3 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-semibold transition-all"
              >
                Done
              </button>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <div className="mb-4">
              <X size={64} className="text-red-500 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-red-500 mb-2">Purchase Failed</h3>
            <p className="text-text-secondary text-sm mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onConfirm}
                className="flex-1 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-semibold transition-all"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 border-2 border-secondary-layer hover:border-brand-purple text-text-primary rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-text-primary">Confirm Purchase</h3>
              <button
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-secondary-layer rounded-xl">
                <span className="text-text-secondary">Item</span>
                <span className="text-text-primary font-medium">{itemName}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-secondary-layer rounded-xl">
                <span className="text-text-secondary">Price</span>
                <span className="text-text-primary font-bold">{price} RITUAL</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-interactive-cyan">
                <Link2 size={16} />
                <span>Transaction on Ritual Testnet</span>
              </div>
              <p className="text-sm text-gold flex items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>Ensure you have enough RITUAL in your wallet</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onConfirm}
                className="flex-1 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-semibold transition-all"
              >
                Confirm
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 border-2 border-secondary-layer hover:border-brand-purple text-text-primary rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Shop: React.FC = () => {
  const { isConnected, isCorrectNetwork, connectWallet, switchToRitual, purchaseItem } = useWallet();
  const { xpBoosterActive, xpBoosterExpiry, premiumStatus, setXPBooster, setPremium } = useGame();
  const { showToast } = useToast();

  const [loadingBooster, setLoadingBooster] = useState(false);
  const [loadingPremium, setLoadingPremium] = useState(false);
  const [boosterError, setBoosterError] = useState<string | null>(null);
  const [premiumError, setPremiumError] = useState<string | null>(null);

  const [modalState, setModalState] = useState<{
    open: boolean;
    itemType: ItemType | null;
    loading: boolean;
    success: boolean;
    error: string | null;
    txHash: string | null;
  }>({ open: false, itemType: null, loading: false, success: false, error: null, txHash: null });

  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0 });

  useEffect(() => {
    if (!xpBoosterExpiry) return;
    const update = () => {
      const diff = xpBoosterExpiry - Date.now();
      if (diff <= 0) {
        setCountdown({ hours: 0, minutes: 0 });
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown({ hours, minutes });
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [xpBoosterExpiry]);

  const getItemName = (itemType: ItemType) =>
    itemType === 'xp_booster' ? 'XP Booster' : 'Premium Pass';

  const handleBuy = async (itemType: ItemType) => {
    const price = itemType === 'xp_booster' ? '0.01' : '0.05';
    const setLoading = itemType === 'xp_booster' ? setLoadingBooster : setLoadingPremium;
    const setError = itemType === 'xp_booster' ? setBoosterError : setPremiumError;

    setLoading(true);
    setError(null);

    try {
      const txHash = await purchaseItem(price, itemType);

      if (itemType === 'xp_booster') {
        setXPBooster(txHash);
      } else {
        setPremium(txHash);
      }

      showToast('success', `${getItemName(itemType)} purchased successfully!`, {
        label: 'View on Explorer →',
        href: `https://explorer.ritualfoundation.org/tx/${txHash}`,
      });

      setModalState({
        open: true,
        itemType,
        loading: false,
        success: true,
        error: null,
        txHash,
      });
    } catch (err: any) {
      if (err.message === 'WRONG_NETWORK') {
        setError('⚠️ Switch to Ritual Network to complete this purchase');
      } else if (err.code === 4001 || err.message?.includes('user rejected')) {
        showToast('error', 'Transaction rejected by user.');
      } else {
        showToast('error', 'Transaction failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAndRetry = async (itemType: ItemType) => {
    await switchToRitual();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (itemType === 'xp_booster') setBoosterError(null);
    else setPremiumError(null);
    handleBuy(itemType);
  };

  const openConfirmModal = (itemType: ItemType) => {
    if (!isCorrectNetwork) {
      if (itemType === 'xp_booster') {
        setBoosterError('⚠️ Switch to Ritual Network to complete this purchase');
      } else {
        setPremiumError('⚠️ Switch to Ritual Network to complete this purchase');
      }
      return;
    }
    setModalState({
      open: true,
      itemType,
      loading: false,
      success: false,
      error: null,
      txHash: null,
    });
  };

  const handleModalConfirm = async () => {
    if (!modalState.itemType) return;
    const itemType = modalState.itemType;
    setModalState((prev) => ({ ...prev, loading: true, error: null }));

    const price = itemType === 'xp_booster' ? '0.01' : '0.05';

    try {
      const txHash = await purchaseItem(price, itemType);
      if (itemType === 'xp_booster') {
        setXPBooster(txHash);
      } else {
        setPremium(txHash);
      }
      showToast('success', `${getItemName(itemType)} purchased successfully!`, {
        label: 'View on Explorer →',
        href: `https://explorer.ritualfoundation.org/tx/${txHash}`,
      });
      setModalState({
        open: true,
        itemType,
        loading: false,
        success: true,
        error: null,
        txHash,
      });
    } catch (err: any) {
      setModalState({
        open: true,
        itemType,
        loading: false,
        success: false,
        error: err.code === 4001 ? 'Transaction rejected by user.' : 'Transaction failed. Please try again.',
        txHash: null,
      });
    }
  };

  const closeModal = () => {
    setModalState({ open: false, itemType: null, loading: false, success: false, error: null, txHash: null });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-bg-primary pt-20 lg:pt-24 pb-20 lg:pb-8 flex items-center justify-center px-4">
        <div className="bg-card rounded-2xl p-8 lg:p-10 text-center max-w-md w-full" style={{ border: '1px solid rgba(139,92,246,0.2)' }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-purple/10 mb-6">
            <Wallet size={32} className="text-brand-purple" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Connect your wallet to access the Shop</h2>
          <p className="text-text-secondary mb-6 text-sm">Purchase XP Boosters and Premium Pass using Ritual Testnet.</p>
          <button
            onClick={connectWallet}
            className="px-6 py-3 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-xl font-semibold transition-all"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary pt-20 lg:pt-24 pb-20 lg:pb-8">
      <Sidebar />
      <main className="lg:pl-60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-text-primary mb-2">Shop</h1>
            <p className="text-text-secondary mb-4">Enhance your Nexora experience</p>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: 'rgba(56,189,248,0.1)',
                border: '1px solid rgba(56,189,248,0.2)',
                fontSize: '12px',
                color: '#38BDF8',
              }}
            >
              <AlertCircle size={14} />
              <span>Payments require Ritual Testnet</span>
            </div>
          </div>

          {/* Shop Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARD 1 — XP Booster */}
            <div
              className="bg-card rounded-2xl p-6"
              style={{ border: '1px solid rgba(251,191,36,0.25)' }}
            >
              <Zap size={40} className="text-gold mb-4" />
              <h3 className="text-2xl font-bold text-text-primary mb-2">XP Booster</h3>
              <p className="text-text-secondary text-sm mb-4">
                Earn 1.5× XP on all challenges for 24 hours
              </p>

              <div className="text-xl font-bold text-text-primary mb-3">0.01 RITUAL</div>

              <div
                className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-4"
                style={{
                  backgroundColor: 'rgba(251,191,36,0.1)',
                  color: '#FBBF24',
                  border: '1px solid rgba(251,191,36,0.3)',
                }}
              >
                24 Hours
              </div>

              <div className="h-px bg-secondary-layer my-4" />

              <ul className="space-y-2 mb-6">
                {[
                  '1.5× XP multiplier on all correct answers',
                  'Valid for 24 hours from time of purchase',
                  'Works across all categories and difficulties',
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <Check size={16} className="text-success-emerald flex-shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              {xpBoosterActive ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl font-semibold text-white"
                  style={{ backgroundColor: '#10B981' }}
                >
                  ✓ Active — {countdown.hours}h {countdown.minutes}m remaining
                </button>
              ) : loadingBooster ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'rgba(139,92,246,0.6)' }}
                >
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </button>
              ) : (
                <button
                  onClick={() => openConfirmModal('xp_booster')}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: '#8B5CF6' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#7C3AED')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#8B5CF6')}
                >
                  Buy Now — 0.01 RITUAL
                </button>
              )}

              {boosterError && (
                <div className="mt-3">
                  <p className="text-gold text-sm mb-2">{boosterError}</p>
                  <button
                    onClick={() => handleSwitchAndRetry('xp_booster')}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      border: '1px solid #38BDF8',
                      color: '#38BDF8',
                      backgroundColor: 'transparent',
                    }}
                  >
                    Switch Network
                  </button>
                </div>
              )}
            </div>

            {/* CARD 2 — Premium Pass */}
            <div
              className="relative bg-card rounded-2xl p-6"
              style={{ border: '1px solid rgba(139,92,246,0.3)' }}
            >
              <div
                className="absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: '#FBBF24', color: '#0F172A' }}
              >
                MOST POPULAR
              </div>

              <Star size={40} className="text-gold mb-4" fill="currentColor" />
              <h3 className="text-2xl font-bold text-text-primary mb-2">Premium Pass</h3>
              <p className="text-text-secondary text-sm mb-4">
                Unlock permanent premium status on the platform
              </p>

              <div className="text-xl font-bold text-text-primary mb-3">0.05 RITUAL</div>

              <div
                className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-4"
                style={{
                  backgroundColor: 'rgba(139,92,246,0.1)',
                  color: '#8B5CF6',
                  border: '1px solid rgba(139,92,246,0.3)',
                }}
              >
                Permanent
              </div>

              <div className="h-px bg-secondary-layer my-4" />

              <ul className="space-y-2 mb-6">
                {[
                  'Premium badge displayed on your profile',
                  'Special ⭐ status in the Leaderboard',
                  'Premium account recognition',
                  'Permanent — never expires',
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <Check size={16} className="text-success-emerald flex-shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              {premiumStatus ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl font-semibold text-white"
                  style={{ backgroundColor: '#10B981' }}
                >
                  ✓ Premium Active
                </button>
              ) : loadingPremium ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'rgba(139,92,246,0.6)' }}
                >
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </button>
              ) : (
                <button
                  onClick={() => openConfirmModal('premium_pass')}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(to right, #8B5CF6, #FBBF24)' }}
                >
                  Buy Premium — 0.05 RITUAL
                </button>
              )}

              {premiumError && (
                <div className="mt-3">
                  <p className="text-gold text-sm mb-2">{premiumError}</p>
                  <button
                    onClick={() => handleSwitchAndRetry('premium_pass')}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      border: '1px solid #38BDF8',
                      color: '#38BDF8',
                      backgroundColor: 'transparent',
                    }}
                  >
                    Switch Network
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {modalState.open && modalState.itemType && (
        <ConfirmModal
          itemType={modalState.itemType}
          itemName={getItemName(modalState.itemType)}
          price={modalState.itemType === 'xp_booster' ? '0.01' : '0.05'}
          onClose={closeModal}
          onConfirm={handleModalConfirm}
          loading={modalState.loading}
          success={modalState.success}
          error={modalState.error}
          txHash={modalState.txHash}
        />
      )}
    </div>
  );
};

export default Shop;
