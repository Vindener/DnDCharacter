import { create } from 'zustand';
import { loadDefaultCampaignId, persistDefaultCampaignId } from '@/dm/repositories/dmSettingsRepository';

export interface DmSettingsStore {
  defaultCampaignId: string | null;
  setDefaultCampaignId: (campaignId: string | null) => Promise<void>;
  loadDefaultCampaignId: () => Promise<void>;
}

const useDmSettingsStore = create<DmSettingsStore>((set) => ({
  defaultCampaignId: null,

  setDefaultCampaignId: async (campaignId) => {
    set({ defaultCampaignId: campaignId });
    try {
      await persistDefaultCampaignId(campaignId);
    } catch (_error) {
      /* intentionally ignored */
    }
  },

  loadDefaultCampaignId: async () => {
    try {
      const campaignId = await loadDefaultCampaignId();
      set({ defaultCampaignId: campaignId });
    } catch (_error) {
      /* intentionally ignored */
    }
  },
}));

export default useDmSettingsStore;
